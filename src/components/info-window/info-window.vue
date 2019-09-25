<template>
  <div class="info-window"
    id="info-window"
    ref="infoWindow"
    :style="{width: width}">
    <div class="top">
      <span class="title">{{ title }}</span>
      <span class="close"
        @click="handleClose">x</span>
    </div>
    <div class="content">
      <slot></slot>
    </div>
    <slot name="footer"></slot>
  </div>
</template>

<script>
export default {
  props: {
    width: {
      type: String,
      default: '320px'
    },
    title: String,
    // 像素坐标
    pos: Object,
    // 信息窗口偏移
    offset: {
      type: Object,
      default: () => {
        return {
          x: 0,
          y: -10
        }
      }
    }
  },
  methods: {
    handleClose () {
      this.$emit('close')
    }
  },
  watch: {
    pos: {
      handler (newPos) {
        if (newPos && newPos.x && newPos.y) {
          this.$nextTick(() => {
            const infoHeight = this.$refs.infoWindow.clientHeight
            this.$refs.infoWindow.style.left = newPos.x + this.offset.x + 'px'
            this.$refs.infoWindow.style.top = newPos.y - infoHeight / 2 + this.offset.y + 'px'
          })
        }
      },
      immediate: true
    }
  }
}

</script>
<style lang="scss" scoped>
.info-window {
  position: absolute;
  top: 50%;
  left: 50%;
  padding: 10px;
  min-width: 300px;
  border-radius: 5px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  background-color: #ffffff;
  box-sizing: border-box;
  z-index: 10;
  transform: translate(-50%, -50%);
  .top {
    margin-bottom: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    .title {
      font-size: 12px;
    }
    .close {
      width: 24px;
      font-size: 12px;
      text-align: center;
      cursor: pointer;
    }
  }
  .content {
    text-align: left;
    font-size: 14px;
    margin-bottom: 5px;
  }
  .footer {
    font-size: 12px;
    color: #ccc;
    text-align: right;
  }
  &::after {
    content: "◆";
    font-size: 36px;
    height: 24px;
    color: #fff;
    position: absolute;
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);
  }
}
</style>
