<template>
  <el-dialog :visible.sync="visible"
    title="修改区域样式"
    append-to-body
    custom-class="edit-color-dialog">
    <div class="dialog-content"
      v-if="styles">
      <el-radio-group v-model="value">
        <el-radio-button label="fill">区域填充</el-radio-button>
        <el-radio-button label="stroke">区域轮廓</el-radio-button>
      </el-radio-group>
      <div class="item"
        v-show="value === 'fill'">
        <el-form label-width="90px"
          label-position="left">
          <el-form-item label="自定义颜色">
            <el-input v-model="myStyles.fillColor"
              style="width: 130px">
            </el-input>
            <el-color-picker v-model="myStyles.fillColor"
              style="vertical-align: middle">
            </el-color-picker>
          </el-form-item>
          <el-form-item label="透明度">
            <div class="set-opacity">
              <el-input-number v-model="myStyles.fillOpacity"
                style="width: 130px"
                controls-position="right"
                :min="0"
                :max="100">
              </el-input-number>
            </div>
          </el-form-item>
        </el-form>
      </div>
      <div class="item"
        v-show="value === 'stroke'">
        <el-form label-width="90px"
          label-position="left">
          <el-form-item label="自定义颜色">
            <el-input v-model="myStyles.strokeColor"
              placeholder=""
              style="width: 130px">
            </el-input>
            <el-color-picker v-model="myStyles.strokeColor"
              style="vertical-align: middle">
            </el-color-picker>
          </el-form-item>
          <el-form-item label="透明度">
            <div class="set-opacity">
              <el-input-number v-model="myStyles.strokeOpacity"
                style="width: 130px"
                controls-position="right"
                :min="0"
                :max="100">
              </el-input-number>
            </div>
          </el-form-item>
          <el-form-item label="轮廓宽度">
            <el-input-number v-model="myStyles.strokeWeight"
              style="width: 130px"
              controls-position="right"
              :min="1"
              :max="5">
            </el-input-number>
          </el-form-item>
        </el-form>

      </div>
      <div class="colors">
        <span class="color-item"
          v-for="(color, index) in colors"
          :key="index"
          :class="{ 'active': isActive(color) }"
          :style="{'background-color': color}"
          @click="handleClick(color)"></span>
      </div>
      <div class="preview">
        <div class="view"
          :style="previewStyle">
        </div>
      </div>
    </div>
    <div class="dialog-footer">
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary"
        @click="confirm">确定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { hexToRgba } from '@/utils'
export default {
  props: {
    styles: Object
  },
  data () {
    return {
      visible: false,
      myStyles: {},
      value: 'fill',
      colors: ['#D0021B', '#F421AB', '#F57470', '#F7C01C', '#F8E71C', '#FBF585', '#7ED321', '#50E3C2', '#0BB78B', '#0BB78C', '#13F8FF', '#0078FF', '#9013FE', '#B045DF', '#E594F3']
    }
  },
  computed: {
    color () {
      return this.value === 'fill' ? this.myStyles.fillColor : this.myStyles.strokeColor
    },
    previewStyle () {
      return {
        'border-style': 'solid',
        'border-color': hexToRgba(this.myStyles.strokeColor, this.myStyles.strokeOpacity / 100),
        'border-width': this.myStyles.strokeWeight + 'px',
        'background-color': hexToRgba(this.myStyles.fillColor, this.myStyles.fillOpacity / 100)
      }
    }
  },
  methods: {
    open () {
      this.visible = true
    },
    handleClick (color) {
      if (this.value === 'fill') {
        this.myStyles.fillColor = color
      } else {
        this.myStyles.strokeColor = color
      }
    },
    confirm () {
      let styles = JSON.parse(JSON.stringify(this.myStyles))
      styles.fillOpacity = styles.fillOpacity / 100
      styles.strokeOpacity = styles.strokeOpacity / 100
      this.visible = false
      this.$emit('confirm', styles)
    },
    isActive (color) {
      if (this.value === 'fill') {
        return this.myStyles.fillColor.toLowerCase() === color.toLowerCase()
      } else {
        return this.myStyles.strokeColor.toLowerCase() === color.toLowerCase()
      }
    }
  },
  watch: {
    styles: {
      handler (newStyles) {
        if (newStyles) {
          this.myStyles = JSON.parse(JSON.stringify(newStyles))
          this.myStyles.fillOpacity = this.myStyles.fillOpacity * 100
          this.myStyles.strokeOpacity = this.myStyles.strokeOpacity * 100
        }
      },
      immediate: true
    }
  }
}

</script>

<style lang="scss">
.edit-color-dialog {
  .dialog-content {
    position: relative;

    .item {
      margin-top: 20px;

      .set-opacity {
        width: 130px;
        position: relative;

        &:after {
          content: "%";
          position: absolute;
          right: 60px;
          font-size: 12px;
        }
      }
    }

    .colors {
      display: flex;
      align-items: center;

      .color-item {
        width: 30px;
        height: 30px;
        margin-right: 5px;
        cursor: pointer;
        box-sizing: border-box;

        &.active {
          border: 1px solid #0088cc;
        }
      }
    }

    .preview {
      width: 80px;
      height: 80px;
      background-color: #fff;
      border: 2px solid #c9d3e0;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      position: absolute;
      top: 0;
      right: 0;

      .view {
        width: 60px;
        height: 60px;
      }
    }
  }

  .dialog-footer {
    margin-top: 20px;
    text-align: right;
  }
}
</style>
