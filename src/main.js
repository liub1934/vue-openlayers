import Vue from 'vue'
import App from './App.vue'

// 加载样式
import './assets/styles/index.scss'

import Element from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'

Vue.use(Element, {
  size: 'small'
})

Vue.config.productionTip = false

new Vue({
  render: h => h(App)
}).$mount('#app')
