# 界面：设计稿怎么搬进插件

0.1.0 的界面是另画的：宿主那套通用灰底、卡片列表、大图铺满。设计稿（`design/`，
15 个纯静态页面）是另一套东西 —— 深色、星空、玻璃拟态、五面练习。

0.2.0 把这两套合成一套：**`design/` 是唯一真源，插件里跑的就是它**。

---

## 一句话说清搬法

```
design/app.css ──(构建时把 :root 改成 :host)──┐
                                              ├─→ client.js ─→ 塞进 shadow root
src/*.js ─────(按文件名顺序拼接)──────────────┘
```

界面用 `ShadowHost`（`src/10-shell.js`）挂在 shadow root 里，用 `createPortal`
把 React 树塞进 shadow 里的 `.etude-mount`。这样宿主的样式进不来，设计稿的样式也
漏不出去。

**为什么是 shadow，不是 iframe**：iframe 要过宿主 CSP（查不到策略，风险不落地），
而且媒体字节要跨一次 `postMessage` 才能进画面。shadow 是同文档的另一棵树，RPC
照常直调，`<img src="data:...">` 和 blob URL 都能用。

**为什么不是直接改 client.js**：宿主的 `__ModuleLoader__.load({factory})` 只给
一个 `require`，**不能 import 相对路径**，界面必须是一个单文件。分片 + 构建脚本
是唯一能既保持源码可读、又产出一个单文件的办法。

---

## 构建

```bash
cd F:\dsharness\dsh-etude
node scripts/build-client.cjs
```

它会：

1. 读 `src/` 下所有 `^\d\d-.*\.js$`，按文件名排序拼接（顺序就是编号，`99-` 最后）；
2. 读 `design/app.css`，把 `:root` → `:host`、`:root[data-theme="light"]` →
   `:host([data-theme="light"])`、`html,body{` → `:host{`，并在尾部补一条
   `:host` 的背景渐变（设计稿的背景画在 `body` 上，shadow 里没有 `body`）；
3. 生成 `client.js`：

```js
window.__ModuleLoader__.load({
  id: 'dsh-etude',
  factory: (require) => {
    const React = require('react')
    const __CSS__ = "…"          // 上面那份 CSS，转义成字符串
    /* —— 分片按顺序贴在这里 —— */
    return module.exports
  },
})
```

改界面 = 改 `src/` 下的分片，然后跑一遍 build。**不要直接改 `client.js`**，
它是产物，下次 build 会盖掉。

改样式 = 改 `design/app.css`（样式稿的真源，`design/gen.mjs` 生成 15 页），
然后跑 build。两件事都改完，`git status` 里应该看到 `client.js` 有 diff。

---

## 写分片的三条规矩

1. **只用 `function` 声明，不要顶层 `const` / `let`。**
   所有分片拼在同一个函数体里，顶层 `const` 重名会直接 `SyntaxError`。函数名带前缀
   （`CardsPage` / `StudyFace` / `FX_BLOCKS`），一眼知道是谁的。

2. **不用 JSX、不用 `import`。**
   没有编译步骤，`h()` 是手写的 `React.createElement`（见 `src/00-base.js`）。

3. **找 DOM 用 `useRef` 拿到的 shadow root，不要用 `document.querySelector`。**
   设计稿的 `design/app.js` 到处 `document.querySelectorAll`，那是普通页面。搬进
   shadow 之后这些全都查不到 —— 交互层要重写，不是原样复制。

---

## 加一屏

1. 在 `src/` 建 `NN-xxx.js`（NN 决定它在哪一段，比如 `55-xxx.js` 会在工厂页后面）；
2. 写一个 `function XxxPage(props)`，返回 `h(Screen, {className:'half'}, …)`；
3. 在 `src/90-app.js` 的 `EtudeApp` 里把 `page === 'xxx' ? h(XxxPage, …)` 接上；
4. 顶栏那份 tab 在 `src/10-shell.js` 的 `Topbar` 里，加一项；
5. `node scripts/build-client.cjs && node tests/client-smoke.mjs`。

冒烟测试会真的把面板渲染一遍（用假 DOM），打出来的节点数就是「画出来了没有」。
0 个节点 = 白屏，别急着刷新页面。

---

## 数据从哪来

所有事实都走 `/etude` RPC，不经过 HTTP 路由（那条只留给 CI）。

`src/20-bridge.js` 里三件事：

- `callRpc(rpc, endpoint, payload)` —— 15 秒超时、把 `{ok:false}` 变成异常；
- `useFactory(rpc)` —— 取 `state`，给 `status: 'loading' | 'ready' | 'error'`；
- `packRows(state)` / `nextUp(state)` —— 把包摊成表格行、挑出下一个该练的。

**形状照 `lib/rpc.js` 的 `state` 端点**，不要在界面里发明字段。界面里的数如果
算不出来，就写「还没有」，不要填一个像样的假数字。

---

## 以后要做别的语言

插件核心是「真正学会一门自然语言」，英文只是第一个。留的口子：

- **包的 `language` 字段**：`pack.create` 的入参里已经有，例句生成、TTS 音色、
  分词/拼写校验都按它分支，不要写死 `en`。
- **学习页的五个面**（听/说/读/写/改）与语言无关，别往里塞英文特有的判断；
  拼写检查那种英文才有的面，按 `language` 决定要不要出现。
- **界面文案**在 `src/99-register.js` 的 `LOCALE`（zh / en 两份），
  加语言就加一份，不要在组件里写死中文。
- **契约 v2 的清单**（`contract/manifest.schema.json`）里 `language` 是必填，
  导出时按包的语言写，不要一律 `en`。

---

## 界面为什么是现在这个样子

设计稿经过一轮完整的打磨（四轮，见 `docs/POLISH.md` 与 `design/DESIGN.md`）：
颜色收敛成 1 主 + 1 警示 + 5 级中性，装饰色只准出现在 2px 以下；间距只用 4 的
倍数；字阶 6 级；字重 3 档；圆角只有 6/14/999。这些不是审美偏好，是为了让
「齐了 / 差 3 个 / 还没开始」这种状态一眼看出区别，而不是靠七种颜色去猜。

改这些数值之前先看 `docs/POLISH.md`，那里写了每一条为什么。
