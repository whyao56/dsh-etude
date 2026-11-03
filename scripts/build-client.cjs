// 把 src/ 下的分片拼成 client.js
//
// 为什么要有这一步：宿主用 `window.__ModuleLoader__.load({ id, factory })` 加载
// client 半，factory 里只拿得到 require('react') 这类宿主给的模块，不能 import
// 相对路径。所以插件界面必须是「一个文件」。但一个文件又没法让多个人/多个子代理
// 同时改 —— 于是拆成 src/NN-*.js，按文件名顺序拼，最后由这里输出 client.js。
//
// 另外两件事也在这里做：
//   · design/app.css（打磨了 10 轮的那套）→ 转成 shadow 里能用的 CSS 字符串，
//     把 :root 换 :host（shadow root 里没有 :root），html/body 选择器兜到宿主容器；
//   · 把 design 的几个背景层样式补回 :host，不然面板是纯黑。

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const SRC = path.join(ROOT, 'src')
const DESIGN = path.join(ROOT, 'design')

/** design/app.css → shadow root 内可用的 CSS 文本 */
function buildCss() {
  let css = fs.readFileSync(path.join(DESIGN, 'app.css'), 'utf8')
  // shadow root 里没有 :root，令牌挂到宿主元素上
  css = css.replace(/:root\[data-theme="light"\]/g, ':host([data-theme="light"])')
  css = css.replace(/:root\{/g, ':host{')
  css = css.replace(/html,\s*body\{/g, ':host{')
  // 页面背景原来画在 body 上，shadow 里补到宿主
  css += `
:host{
  display:block;position:relative;height:100%;overflow:auto;
  background:linear-gradient(180deg,var(--bg-top),var(--bg-bottom));
  color:var(--fg);
  font-family:var(--sans);
  -webkit-font-smoothing:antialiased;
}
:host([hidden]){display:none}
/* shadow 里没有 body，宿主的 width 也不会自动传进来 —— 不写这几条，
   .screen 是 flex column，宽度会被内容挤成 440px，表格和卡片全缩着。 */
.etude-shell{width:100%;min-height:100%;box-sizing:border-box;max-width:1160px;margin:0 auto}
.etude-shell>.screen{width:100%;box-sizing:border-box}
.page,.screen{max-width:100%}
/* 设计稿的牌组表是 5 列（目标 + 三个数字 + 齿轮），插件这边多一列「到哪一步」，
   列模板多给一档，最后一格留给齿轮占位。不改 design/app.css —— 那是设计真源。 */
.deckhead,.drow{grid-template-columns:minmax(0,1fr) 56px 56px 56px 96px 36px}
.deckhead>.dnum,.drow>.dnum{text-align:right}
.deckhead>.dnum.due,.drow>.dnum.due{justify-self:end;text-align:right}
/* navstep 是 fixed 到视口左右下角的，宿主里会盖住学习页最后一行快捷键 —— 给底部留出它 */
.screen.study{padding-bottom:64px}
/* 两侧悬浮的 ‹ ›（.wordnav）贴在 .st2 边缘，会压住右栏那一行的数值一点 ——
   试过给 .drail 加 padding-right:36 让开，结果右栏窄了、标签全折行，更糟；退回原样。 */
`
  return css
}

/** 按文件名顺序取分片 */
function parts() {
  if (!fs.existsSync(SRC)) return []
  return fs
    .readdirSync(SRC)
    .filter((f) => /^\d\d-.*\.js$/.test(f))
    .sort()
    .map((f) => ({ name: f, code: fs.readFileSync(path.join(SRC, f), 'utf8') }))
}

const css = buildCss()
const list = parts()
if (!list.length) {
  console.error('src/ 下没有任何 NN-*.js 分片')
  process.exit(1)
}

const body = list
  .map(
    (p) =>
      `\n/* ===================== ${p.name} ===================== */\n` +
      p.code.replace(/__ETUDE_CSS__/g, '__CSS__'),
  )
  .join('\n')

const out = `/**
 * dsh-etude — Client half（由 scripts/build-client.mjs 生成，别直接改）
 *
 * 源在 src/NN-*.js，按文件名顺序拼；样式取 design/app.css，转成 shadow root 可用的形式。
 * 生成时间 ${new Date().toISOString()}
 */
window.__ModuleLoader__.load({
  id: 'dsh-etude',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    const React = require('react')
    const { useState, useEffect, useMemo, useRef, useCallback } = React

    const NS = 'dsh-etude'
    const CONFIG_NS = 'etude'

    /** design/app.css，:root 已换成 :host */
    const __CSS__ = ${JSON.stringify(css)}
${body}

    return module.exports
  },
})
`

fs.writeFileSync(path.join(ROOT, 'client.js'), out, 'utf8')
console.log(
  `client.js 已生成：${list.length} 个分片，css ${(css.length / 1024).toFixed(0)}KB，产物 ${(out.length / 1024).toFixed(0)}KB`,
)
