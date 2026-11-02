/* 整行可点：给任何带 data-go 的行挂上跳转，按钮和链接不动 */
(function () {
  document.addEventListener('click', function (e) {
    if (e.target.closest('button, a, input, select, textarea, .gear')) return
    var row = e.target.closest('[data-go]')
    if (!row) return
    var to = row.getAttribute('data-go')
    if (to) location.href = to
  })
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return
    var row = document.activeElement
    if (!row || !row.hasAttribute || !row.hasAttribute('data-go')) return
    e.preventDefault()
    location.href = row.getAttribute('data-go')
  })
})()
