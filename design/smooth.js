/* 页面之间的「淡过去 / 淡回来」。
   两页之间的白闪、抽帧，都是因为直接 location.href 让浏览器先清屏再画新页；
   这里在跳之前先铺一层与底色同色的遮罩，落地页在 <head> 里就把遮罩铺上、
   第一帧之后再淡出，于是两页在视觉上是同一个连续的镜头。 */
(function () {
  var BG = '#04060d'

  function go (url, opts) {
    var ms = (opts && opts.ms) || 460
    var d = document.createElement('div')
    d.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:' + BG +
      ';opacity:0;pointer-events:none;will-change:opacity;transition:opacity ' + ms + 'ms cubic-bezier(.4,0,.85,.55)'
    document.body.appendChild(d)
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { d.style.opacity = '1' })
    })
    setTimeout(function () {
      location.href = url + (url.indexOf('?') < 0 ? '?' : '&') + 't=fade'
    }, ms - 24)
  }

  window.kfGo = go

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-fade]')
    if (!a) return
    e.preventDefault()
    go(a.getAttribute('data-fade'))
  })
})();