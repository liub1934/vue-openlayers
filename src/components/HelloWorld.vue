<template>
  <div class="map">
    <el-card class="map-left"
      v-loading="loading">
      <div class="top">
        <div class="title">区域列表</div>
        <el-button class="style-setting"
          type="text"
          icon="icon-color"
          @click="handleSetStyle">
          样式设置
        </el-button>
      </div>
      <div class="list"
        v-if="polygons.length">
        <el-checkbox style="margin-bottom: 10px"
          :indeterminate="(checkList.length === polygons.length || !checkList.length) ? false : true"
          :value="checkList.length === polygons.length"
          @change="handleCheckAllChange">全选</el-checkbox>
        <el-checkbox-group v-model="checkList">
          <div class="list-item"
            v-for="(item, index) in polygons"
            :key="item.id">
            <el-checkbox :label="item.id">
              {{''}}
            </el-checkbox>
            <div class="item"
              @click="handleListItemClick(item, index)">
              <span class="item-color"
                :style="{
                  'border-color': hexToRgba(item.styles.strokeColor, item.styles.strokeOpacity),
                  'border-width': item.styles.strokeWeight + 'px',
                  'background-color': hexToRgba(item.styles.fillColor, item.styles.fillOpacity)
                }">
              </span>
              <span class="item-name">{{ item.title }}</span>
            </div>
          </div>
        </el-checkbox-group>
      </div>
      <style-setting ref="styleSetting"
        :styles="this.styles.polygon"
        :polygons="polygons"
        @confirm="styleSettingConfirm">
      </style-setting>
    </el-card>
    <div class="map-content"
      v-loading="loading">
      <!-- 地图 -->
      <div id="GDMap"></div>

      <!-- 工具 -->
      <el-card class="map-tools"
        :body-style="{ padding: '5px' }">
        <template v-for="(tool, index) in mapTools">
          <el-tooltip :key="index"
            :content="tool.label"
            effect="dark"
            placement="bottom">
            <i :class="['tool-icon', tool.icon]"
              @click="handleToolClick(tool)">
            </i>
          </el-tooltip>
        </template>
      </el-card>

      <div v-show="showMapTooltip"
        class="map-tooltip"
        ref="mapTooltip">
        {{ mapTooltipText }}
      </div>

      <!-- 信息窗口 -->
      <transition name="el-fade-in-linear">
        <info-window ref="infoWindow"
          v-if="infoWindow.visible"
          :title="infoWindow.extData.title"
          :pos="infoWindow.position"
          @close="infoWindowClose">
          <el-form v-if="infoWindow.isEditAttribute">
            <el-form-item label="标题">
              <el-input v-model="infoWindow.extData.title"
                placeholder="请输入标题"></el-input>
            </el-form-item>
            <el-form-item label="描述">
              <el-input v-model="infoWindow.extData.desc"
                type="textarea"
                placeholder="请输入描述">
              </el-input>
            </el-form-item>
          </el-form>
          <template v-else>
            {{ infoWindow.extData.desc }}
          </template>
          <div slot="footer"
            class="info-window-footer">
            <span class="by"></span>
            <div class="tools">
              <template v-for="(tool, index) in infoWindowTools">
                <el-tooltip :key="index"
                  effect="dark"
                  :content="tool.label"
                  placement="top">
                  <i :class="['footer-icon', tool.icon]"
                    @click="infoWindowToolClick(tool)"></i>
                </el-tooltip>
              </template>
            </div>
          </div>
        </info-window>
      </transition>
      <edit-style-dialog ref="editStyleDialog"
        :id="editStyleDialog.polygonId"
        :styles="editStyleDialog.styles"
        @confirm="editStyleConfirm">
      </edit-style-dialog>
    </div>
  </div>
</template>

<script>
import 'ol/ol.css'
import { Map, View, Feature, Overlay } from 'ol'
import { defaults as defaultControls } from 'ol/control'
import { boundingExtent, getCenter } from 'ol/extent'
import { MultiPoint, Polygon } from 'ol/geom'
import { Draw, Modify, Snap } from 'ol/interaction'
import { XYZ, Vector as VectorSource } from 'ol/source'
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer'
import { Fill, Stroke, Style, Circle } from 'ol/style'
import { hexToRgba, uid } from '@/utils'
import storage from 'good-storage'
import InfoWindow from '@/components/info-window/info-window'
import StyleSetting from '@/components/style-setting/style-setting'
import EditStyleDialog from '@/components/edit-style-dialog/edit-style-dialog'
const storageName = 'OPENLAYERS_POLYGONS'
export default {
  components: {
    InfoWindow,
    StyleSetting,
    EditStyleDialog
  },
  data () {
    return {
      GDMap: null,
      source: null,
      vector: null,
      modify: null,
      draw: null,
      snap: null,
      drawPointCount: 0,
      isDrawing: false,
      showMapTooltip: false,
      mapTooltipText: '单击进行绘制',
      checkList: [],
      polygons: [],
      editPolygons: [],
      mapLoading: true,
      dataLoading: true,
      mapTools: [
        {
          name: 'polygon',
          functionName: 'AddArea',
          label: '添加区域',
          icon: 'icon-regional'
        }
      ],
      editStyleDialog: {
        styles: null,
        polygonId: ''
      },
      styles: {
        polygon: {
          fillColor: '#409EFF', // 填充色
          fillOpacity: 0.2, // 填充透明度
          strokeColor: '#409EFF', // 轮廓颜色
          strokeWeight: 1, // 轮廓宽度
          strokeOpacity: 0.9 // 轮廓透明度
        }
      },
      infoWindow: {
        overlay: null,
        extData: {},
        polygonIndex: null,
        visible: false,
        isEditAttribute: false,
        position: null
      }
    }
  },
  created () {
    this._getMapAreaList()
  },
  mounted () {
    this.source = new VectorSource()
    this.editSource = new VectorSource()
    this.vector = new VectorLayer(
      {
        source: this.source
      }
    )
    this.GDMap = new Map({
      target: 'GDMap',
      controls: defaultControls({
        zoom: false
      }),
      layers: [
        new TileLayer({
          source: new XYZ({
            url: 'http://wprd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&style=7&x={x}&y={y}&z={z}'
          })
        }),
        this.vector
      ],
      view: new View({
        projection: 'EPSG:4326',
        center: [116.403847, 39.915526],
        zoom: 11,
        minZoom: 3,
        maxZoom: 18
      })
    })
    // 强制更新地图数据，防止部分情况初始化的时候地图被拉伸
    setTimeout(() => {
      this.GDMap.updateSize()
    }, 20)
    // 用于编辑
    this.modify = new Modify({
      source: this.editSource,
      style: new Style({
        image: new Circle({
          radius: 3,
          fill: new Fill({
            color: this.styles.polygon.fillColor
          })
        })
      })

    })
    // 交互点吸附
    this.snap = new Snap({
      source: this.source,
      pixelTolerance: 5
    })
    this.mapLoading = false
    this.initEvent()
  },
  computed: {
    loading () {
      return this.mapLoading || this.dataLoading
    },
    infoWindowTools () {
      let tools = []
      if (this.infoWindow.isEditAttribute) {
        tools = [
          {
            name: 'complate',
            label: '完成',
            icon: 'el-icon-check'
          }
        ]
      } else {
        tools = [
          {
            name: 'editStyle',
            functionName: 'EditAreaStyle',
            label: '编辑样式',
            icon: 'icon-color'
          },
          {
            name: 'editNode',
            functionName: 'EditAreaNode',
            label: '开启/结束编辑节点',
            icon: 'el-icon-menu'
          },
          {
            name: 'editAttribute',
            functionName: 'EditAreaAttributes',
            label: '编辑属性',
            icon: 'el-icon-edit'
          },
          {
            name: 'delete',
            functionName: 'DelArea',
            label: '删除',
            icon: 'el-icon-delete'
          }
        ]
      }
      return tools
    }
  },
  methods: {
    initEvent () {
      this.mapClickEvent = this.GDMap.on('click', (ev) => {
        if (this.isDrawing) {
          this.drawPointCount++
        }
        this.GDMap.forEachFeatureAtPixel(ev.pixel, (feature) => {
          feature.dispatchEvent({ type: 'click', event: ev })
        })
      })
      this.mapPointermoveEvent = this.GDMap.on('pointermove', (ev) => {
        if (this.isDrawing) {
          this.showMapTooltip = true
          if (this.$refs.mapTooltip) {
            const pixel = ev.pixel
            this.setMapTooltipPosition(pixel)
          }
        }
      })
    },
    handleSetStyle () {
      if (this.checkList.length) {
        this.$refs.styleSetting.show()
      } else {
        this.$message.error('请勾选需要批量修改样式的区域')
      }
    },
    styleSettingConfirm (styles) {
      const features = this.source.getFeatures()
      const polygons = this.polygons
      features.forEach(item => {
        const id = item.getId()
        if (this.checkList.indexOf(id) > -1) {
          this.polygonSetStyle(item, styles)
        }
      })
      polygons.forEach(item => {
        if (this.checkList.indexOf(item.id) > -1) {
          item.styles = styles
        }
      })
      storage.set(storageName, this.polygons)
      this.$refs.styleSetting.hide()
    },
    handleToolClick (tool) {
      switch (tool.name) {
        // 画多边形
        case 'polygon':
          this.handleDrawPolygon(tool)
          break
      }
    },
    infoWindowToolClick ({ name }) {
      const index = this.infoWindow.featureIndex
      const feature = this.source.getFeatures()[index]
      if (index <= -1) return
      switch (name) {
        // 编辑样式
        case 'editStyle':
          this.handleEditStyle()
          break
        // 编辑节点
        case 'editNode':
          this.handleEditNode(feature)
          break
        // 编辑属性
        case 'editAttribute':
          this.infoWindow.isEditAttribute = true
          break
        // 删除
        case 'delete':
          this.handleDelete(feature)
          break
        // 完成
        case 'complate':
          this.handleComplate(feature)
          break
      }
    },
    // 编辑样式
    handleEditStyle () {
      this.$refs.editStyleDialog.open()
    },
    // 编辑节点
    handleEditNode (feature) {
      const styles = this.polygons[this.infoWindow.polygonIndex].styles
      const isEdit = feature.getProperties().edit
      feature.setProperties({
        edit: !isEdit
      })
      if (isEdit) {
        let path = feature.getGeometry().getCoordinates()[0]
        path = path.map(item => {
          return {
            lng: item[0],
            lat: item[1]
          }
        })
        // 调用接口参数
        const params = {
          id: feature.getId(),
          path
        }
        console.log(params)
        this.polygonSetStyle(feature, styles)
        this.editSource.removeFeature(feature)
        this.GDMap.removeInteraction(this.modify)
        this.GDMap.removeInteraction(this.snap)
        this.polygons[this.infoWindow.polygonIndex].path = path
        storage.set(storageName, this.polygons)
      } else {
        this.editSource.addFeature(feature)
        this.polygonSetStyle(feature, styles, 'edit')
        this.GDMap.addInteraction(this.modify) // 开启编辑
        this.GDMap.addInteraction(this.snap) // 开启自动吸附
      }
    },
    // 删除多边形
    handleDelete (feature) {
      // 根据ID调用接口进行删除
      const id = feature.getId()
      console.log(id)
      this.polygons.splice(this.infoWindow.polygonIndex, 1)
      storage.set(storageName, this.polygons)
      this.vector.getSource().removeFeature(feature)
      this.infoWindow.visible = false
    },
    // 编辑属性完成
    handleComplate (feature) {
      const { title, desc } = this.infoWindow.extData
      const index = this.infoWindow.polygonIndex
      // 调用接口参数
      const params = {
        id: feature.getId(),
        title,
        desc
      }
      console.log(params)
      this.polygons[index].title = title
      this.polygons[index].desc = desc
      storage.set(storageName, this.polygons)
      feature.setProperties({
        extData: this.polygons[index]
      })
      this.infoWindow.isEditAttribute = false
    },
    infoWindowClose () {
      if (this.infoWindow.isEditAttribute) {
        this.infoWindow.isEditAttribute = false
      } else {
        this.infoWindow.visible = false
      }
    },
    // 编辑样式确定
    editStyleConfirm (styles) {
      const features = this.source.getFeatures()
      const polygonIndex = this.infoWindow.polygonIndex
      if (polygonIndex > -1) {
        const feature = features[this.infoWindow.featureIndex]
        const isEdit = feature.getProperties().edit
        // 调用接口参数
        const params = {
          id: feature.getId(),
          styles
        }
        console.log(params)
        this.polygons[polygonIndex].styles = styles
        storage.set(storageName, this.polygons)
        this.polygonSetStyle(feature, styles, isEdit ? 'edit' : 'add')
      }
    },
    // 地图上添加单个多边形
    addPolygon (polygon) {
      const path = polygon.path.map(p => [p.lng, p.lat])
      const polygonFeature = new Feature({
        geometry: new Polygon([path])
      })
      // 设置样式
      this.polygonSetStyle(polygonFeature, polygon.styles)
      // 设置extData数据，可通过getProperties获取
      polygonFeature.setProperties({
        extData: polygon
      })
      // 设置id
      polygonFeature.setId(polygon.id)
      // 添加到地图显示
      this.vector.getSource().addFeature(polygonFeature)
      // 添加点击事件
      polygonFeature.on('click', (ev) => {
        const feature = ev.target
        const point = ev.event.coordinate
        if (!this.isDrawing) {
          this.setInfoWindowPosition(feature, point)
        }
      })
    },
    // 开始画多边形
    handleDrawPolygon (tool) {
      if (this.isDrawing) {
        this.GDMap.removeInteraction(this.draw)
        this.GDMap.removeInteraction(this.snap)
        this.draw.un('drawend', this.drawCompleted)
        this.isDrawing = false
        this.showMapTooltip = false
      } else {
        this.isDrawing = true
        const polygonStyle = this.styles.polygon
        this.draw = new Draw({
          type: 'Polygon',
          style: new Style({
            fill: new Fill({
              color: this.hexToRgba(polygonStyle.fillColor, polygonStyle.fillOpacity)
            }),
            stroke: new Stroke({
              color: polygonStyle.fillColor,
              width: 1
            }),
            image: new Circle({
              radius: 3,
              fill: new Fill({
                color: polygonStyle.fillColor
              })
            })
          })
        })
        this.GDMap.addInteraction(this.draw) // 开启画图
        this.GDMap.addInteraction(this.snap) // 开启自动吸附
        this.draw.on('drawend', this.drawCompleted)
      }
      tool.label = this.isDrawing ? '取消操作' : '添加区域'
    },
    drawCompleted (ev) {
      this.drawPointCount = 0
      const feature = ev.feature
      let path = feature.getGeometry().getCoordinates()[0] // 获取多边形的path
      path = path.map(item => {
        return {
          lng: item[0],
          lat: item[1]
        }
      })

      // 调用接口参数
      const polygon = {
        id: uid(), // 生成一个uid，正式环境调用接口的时候这个ID不用传，由后端生成ID返回
        type: 'polygon',
        title: `区域${this.polygons.length + 1}`,
        desc: '',
        path: path,
        styles: {
          ...this.styles.polygon
        }
      }
      console.log(polygon)
      // polygon.id = res.data.id // 后端生成ID返回
      this.polygons.push(polygon)
      storage.set(storageName, this.polygons)
      this.addPolygon(polygon)
      feature.setProperties({
        extData: polygon
      })
      this.setInfoWindowPosition(feature) // 设置信息窗的位置
      setTimeout(() => {
        this.GDMap.removeInteraction(this.draw)
        this.GDMap.removeInteraction(this.snap)
        this.isDrawing = false
        this.showMapTooltip = false
      }, 20)
    },
    handleListItemClick ({ id }) {
      const features = this.source.getFeatures()
      const index = features.findIndex(item => item.getId() === id)
      const feature = features[index]
      if (feature) {
        const center = this.getFeatureCenter(feature)
        const viewer = this.GDMap.getView()
        this.setInfoWindowPosition(feature)
        viewer.animate({
          center: center,
          duration: 500 // 动画时长
        })
      }
    },
    handleCheckAllChange (val) {
      this.checkList = val ? this.polygons.map(item => item.id) : []
    },
    // 设置信息窗的位置
    setInfoWindowPosition (feature, point) {
      const center = this.getFeatureCenter(feature)
      const extData = feature.getProperties().extData
      this.infoWindow.visible = true
      this.infoWindow.extData = extData
      this.infoWindow.polygonIndex = this.polygons.findIndex(item => item.id === extData.id)
      this.infoWindow.featureIndex = this.source.getFeatures().findIndex(item => item.getId() === extData.id)
      this.editStyleDialog.styles = extData.styles
      this.editStyleDialog.polygonId = extData.id
      this.$nextTick(() => {
        const infoWindowHeight = this.$refs.infoWindow.$el.clientHeight // 获取信息框的高度
        let pixel = this.GDMap.getPixelFromCoordinate(point || center) // 多边形中心坐标转像素
        pixel[1] = pixel[1] - infoWindowHeight / 2 - 10 // 设置偏移像素
        const coordinate = this.GDMap.getCoordinateFromPixel(pixel) // 像素重新转换成坐标
        if (!this.infoWindow.overlay) {
          // 设置信息窗Overlay
          this.infoWindow.overlay = new Overlay({
            element: this.$refs.infoWindow.$el
          })
          this.GDMap.addOverlay(this.infoWindow.overlay) // 地图上添加信息窗
        }
        this.infoWindow.overlay.setPosition(coordinate) // 设置信息窗位置
      })
    },
    setMapTooltipPosition (pixel) {
      const x = pixel[0] + 12
      const y = pixel[1] - 12
      this.$refs.mapTooltip.style.left = x + 'px'
      this.$refs.mapTooltip.style.top = y + 'px'
    },
    getFeatureCenter (feature) {
      const polygonGeometry = feature.getGeometry()
      const path = polygonGeometry.getCoordinates()[0] // 获取多边形的path
      const center = getCenter(boundingExtent(path)) // 获取多边形的中心坐标
      return center
    },
    // 设置多边形样式，默认是添加样式，type为edit的时候为编辑样式，多边形角有圆点
    polygonSetStyle (feature, styles, type = 'add') {
      const fill = new Fill({
        color: this.hexToRgba(styles.fillColor, styles.fillOpacity)
      })
      const stroke = new Stroke({
        color: this.hexToRgba(styles.strokeColor, styles.strokeOpacity),
        width: styles.strokeWeight
      })
      const style = new Style({
        fill,
        stroke
      })
      const circleStyle = new Style({
        image: new Circle({
          radius: 3,
          fill: new Fill({
            color: this.styles.polygon.fillColor
          })
        }),
        geometry: () => {
          const coordinates = feature.getGeometry().getCoordinates()[0]
          return new MultiPoint(coordinates)
        }
      })
      if (type === 'add') {
        feature.setStyle(style)
      } else {
        feature.setStyle([style, circleStyle])
      }
    },
    hexToRgba (hex, trans = 1) {
      return hexToRgba(hex, trans)
    },
    _getMapAreaList () {
      setTimeout(() => {
        this.polygons = storage.get(storageName, [])
        this.polygons.forEach(item => {
          this.addPolygon(item)
        })
        this.dataLoading = false
      }, 500)
    }
  },
  watch: {
    drawPointCount (val) {
      if (val >= 2) {
        this.mapTooltipText = '双击完成绘制'
      } else {
        this.mapTooltipText = '单击进行绘制'
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.map {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  background-color: #f5f6f8;
  display: flex;
  .map-left {
    width: 280px;
    position: relative;
    .top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .list {
      position: absolute;
      left: 18px;
      right: 18px;
      top: 54px;
      bottom: 0;
      overflow: auto;
      .list-item {
        margin-bottom: 10px;
        cursor: pointer;
        display: flex;
        align-items: center;
        .item {
          display: flex;
          align-items: center;
          flex: 1;
        }
        .item-color {
          width: 26px;
          height: 16px;
          box-sizing: border-box;
          margin-right: 5px;
          border-style: solid;
        }
        .item-name {
          font-size: 12px;
          flex: 1;
        }
      }
    }
  }
  .map-tooltip {
    position: absolute;
    border-radius: 4px;
    padding: 0 8px;
    z-index: 2000;
    font-size: 12px;
    line-height: 24px;
    min-width: 80px;
    word-wrap: break-word;
    background: rgba(48, 49, 51, 0.8);
    color: #ffffff;
    text-align: center;
    margin-left: 12px;

    &::after {
      content: "";
      width: 0;
      height: 0;
      font-size: 0;
      border-width: 5px;
      border-color: transparent rgba(48, 49, 51, 0.8) transparent transparent;
      border-style: dashed solid dashed dashed;
      overflow: hidden;
      position: absolute;
      left: -10px;
      top: 50%;
      transform: translateY(-50%);
    }
  }
  .map-content {
    margin-left: 10px;
    overflow: hidden;
    flex: 1;
    position: relative;
    .map-tools {
      position: absolute;
      right: 30px;
      top: 30px;
      .tool-icon {
        font-size: 26px;
        color: #409eff;
        cursor: pointer;
      }
    }
  }
  .info-window-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .by {
      font-size: 12px;
      color: #ccc;
    }
    .tools {
      font-size: 14px;
      .footer-icon {
        cursor: pointer;
        margin-left: 5px;
      }
    }
  }
  #GDMap {
    width: 100%;
    height: 100%;
    position: relative;
    // cursor: crosshair;
  }
}
</style>
