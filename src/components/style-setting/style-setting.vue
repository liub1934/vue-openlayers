<template>
  <div class="style-setting"
    :style="{ 'left': left }">
    <div class="setting-top">
      <el-button type="text"
        @click="hide">
        <i class="top-icon el-icon-caret-left"></i>
      </el-button>
      <i class="top-icon icon-color"></i>
      <span class="top-title">样式设置</span>
    </div>
    <div class="style-config">
      <div class="config-item">
        <div class="item-left">填充颜色</div>
        <div class="item-right">
          <el-color-picker v-model="myStyles.fillColor"></el-color-picker>
        </div>
      </div>
      <div class="config-item">
        <div class="item-left">填充透明度</div>
        <div class="item-right">
          <div class="set-opacity">
            <el-input-number v-model="myStyles.fillOpacity"
              controls-position="right"
              :min="0"
              :max="100">
            </el-input-number>
            <div class="percent-sign">%</div>
          </div>
        </div>
      </div>

      <div class="config-item">
        <div class="item-left">轮廓颜色</div>
        <div class="item-right">
          <el-color-picker v-model="myStyles.strokeColor"></el-color-picker>
        </div>
      </div>
      <div class="config-item">
        <div class="item-left">轮廓宽度</div>
        <div class="item-right">
          <el-input-number v-model="myStyles.strokeWeight"
            controls-position="right"
            :min="1"
            :max="5">
          </el-input-number>
        </div>
      </div>
      <div class="config-item">
        <div class="item-left">轮廓透明度</div>
        <div class="item-right">
          <div class="set-opacity">
            <el-input-number v-model="myStyles.strokeOpacity"
              controls-position="right"
              :min="0"
              :max="100">
            </el-input-number>
            <div class="percent-sign">%</div>
          </div>
        </div>
      </div>
    </div>
    <div class="setting-button">
      <el-button @click="hide">返回</el-button>
      <el-button type="primary"
        @click="confirm">应用</el-button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    styles: Object
  },
  data () {
    return {
      left: '-280px',
      myStyles: {},
      range: ''
    }
  },
  methods: {
    show () {
      this.left = '0px'
    },
    hide () {
      this.left = '-280px'
    },
    confirm () {
      let styles = JSON.parse(JSON.stringify(this.myStyles))
      styles.fillOpacity = styles.fillOpacity / 100
      styles.strokeOpacity = styles.strokeOpacity / 100
      this.$emit('confirm', styles)
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
<style lang="scss" scoped>
.style-setting {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  background: #ffffff;
  z-index: 1;
  transition: all 0.3s;
  .setting-top {
    height: 60px;
    padding: 0 20px;
    display: flex;
    align-items: center;
    border-bottom: 2px solid #ebeef5;

    .top-icon {
      font-size: 12px;
      color: #409eff;
      margin-right: 5px;
    }
    .top-title {
      color: #515a6e;
    }
  }

  .style-config {
    position: absolute;
    top: 82px;
    left: 20px;
    right: 20px;
    bottom: 54px;
    overflow: auto;

    .config-item {
      height: 50px;
      background: #edf0f5;
      padding: 0 20px;
      margin-bottom: 15px;
      border-radius: 4px;
      color: #515a6e;
      font-size: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .el-input-number {
        width: 100px;
      }

      .set-opacity {
        position: relative;

        .el-input-number.is-controls-right {
          .el-input__inner {
            padding-right: 60px;
          }
        }

        .percent-sign {
          position: absolute;
          left: 44px;
          top: 9px;
        }
      }
    }
  }

  .setting-button {
    width: 100%;
    position: absolute;
    bottom: 0;
    padding: 20px;
    box-sizing: border-box;
    text-align: right;
  }
}
</style>
