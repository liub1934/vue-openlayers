/**
 * 动态加载高德地图
 *
 * @export
 * @param {*} key 高德地图key
 * @param {*} plugins 高德地图插件
 * @param {string} [v='1.4.14'] 高德地图版本
 * @returns
 */
export function loadMap (key, plugins, v = '1.4.14') {
  return new Promise(function (resolve, reject) {
    if (typeof AMap !== 'undefined') {
      // eslint-disable-next-line no-undef
      resolve(AMap)
      return true
    }
    window.onCallback = function () {
      // eslint-disable-next-line no-undef
      resolve(AMap)
    }
    let script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = `https://webapi.amap.com/maps?v=${v}&key=${key}&plugin=${plugins}&callback=onCallback`
    script.onerror = reject
    document.head.appendChild(script)
  })
}

/**
 * HEX十六进制颜色颜色转RGBA
 *
 * @export
 * @param {*} hex HEX颜色
 * @param {number} [trans=1] 透明度
 * @returns
 */
export function hexToRgba (hex, trans = 1) {
  let hexColor = /^#/.test(hex) ? hex.slice(1) : hex
  let r
  let g
  let b
  hexColor = /^[0-9a-f]{3}|[0-9a-f]{6}$/i.test(hexColor) ? hexColor : 'fffff'
  if (hexColor.length === 3) {
    hexColor = hexColor.replace(/(\w)(\w)(\w)/gi, '$1$1$2$2$3$3')
  }
  r = hexColor.slice(0, 2)
  g = hexColor.slice(2, 4)
  b = hexColor.slice(4, 6)
  r = parseInt(r, 16)
  g = parseInt(g, 16)
  b = parseInt(b, 16)
  return `rgba(${r}, ${g}, ${b}, ${trans})`
}

/**
 * 生成uid
 *
 * @export
 * @returns
 */
export function uid () {
  function s4 () {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1)
  }
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`
}
