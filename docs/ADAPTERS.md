# 页面适配器契约（v0.3 起）

插件界面 = `design/` 那 15 页，原样跑在 iframe 里。样式、交互、弹层、动效全部来自设计稿本体，
**不重画**。插件只做一件事：把页面里写死的演示数字，换成账本里的真数字。

这件事由每页一个「适配器」完成：`src/adapters/<page>.js`。

## 一个适配器长什么样

```js
window.__ETUDE_APPLY__ = function (state, api) {
  // state: 账本快照（可能还没到 —— 先判 status）
  // api.rpc(endpoint, payload) → Promise<value>
}
```

- 名字必须是 `window.__ETUDE_APPLY__`（页面里已经有 `window.__ETUDE__` 运行时）。
- 宿主每次拿到新 state 就调一次；`state.status` 是 `'loading' | 'ready' | 'error'`。
- 函数可以反复执行（幂等）：**不要**每次都 `appendChild` 新的行，先清掉上一轮自己插的。

## state 的真实形状

来自 `lib/packs.js` 的 `listPacks` + `lib/rpc.js` 的 `state` 端点：

```js
{
  status: 'ready',
  root: 'C:\\Users\\HP\\AppData\\Local\\dsh-etude',
  version: '0.1.0',
  exportDir: '...',
  packs: [
    {
      id: 'abcdef0123456789',
      target: 'abandon',          // 词 / 说法 / 整句
      kind: 'word',               // 'word' | 'phrase' | 'sentence'
      language: 'en',
      status: 'media',            // 'generating'|'text'|'media'|'packed'|'exported'|'failed'
      gloss: '离开、扔下不管',
      progress: { total: 8, images: 5, audios: 2, done: false },  // done 是布尔，不是计数
      learnable: false,
      exportedAt: null,
      lastError: null,
      createdAt: '2026-11-03T...',
      updatedAt: '2026-11-03T...'
    }
  ],
  jobs: [ /* 正在跑的任务 */ ],
  settings: { language: 'en', examples: 8, voice: 'en-US-AriaNeural', ... },
  selfcheck: { checks: [{ id, ok, detail }], root, version, profile, proxy, exportDir }
}
```

**`packs[]` 里没有 `examples`**。要例句必须再调 `api.rpc('pack.get', { id })`，
返回的包里才有 `examples: [{ ord, sentence, sceneEn, sceneZh, zhVariants, register, image, imageReview, audio, audioReview }]`
以及 `swaps: [{ candidates: [] }]`。

媒体（图片/音频）永远走 RPC 取字节，不开 HTTP 路由：

```js
api.rpc('image.bytes', { file })     → { dataBase64, mediaType }   // 也可以 candidate.bytes
api.rpc('pack.audio', { id, ord })   → { file, seconds, ... }        // 再造一条语音
```

## 硬规矩

1. **只改「值」，不重排结构。** 能改 `textContent`、`className`、`setAttribute` 就不要 `innerHTML` 重写整块；
   只有表格行这种「一行一个数据」的地方才允许增删 `.drow` 级别的节点，而且要先把上一轮插的删干净。
2. **不改 `design/` 下的任何文件。** 那是设计真源，15 页的样式和脚本都是它。
3. **不碰 `client.js`**（构建产物）和 `src/` 下别人的分片。一个适配器只写自己那一个文件。
4. **找不到锚点就跳过。** 选择器对不上时保留设计稿原样 + `console.warn`，绝不抛错 ——
   抛错会把整页打成空白，而且用户看到的是一张没数据的页面而不是「插件坏了」。
5. **算不出来的数就写字说明。** 宁可写「账本里没有这项数据」，也不要留设计稿里的假数字。
   现有端点里**没有**复习历史（reviews / due / interval / ease / retention 全都没有），
   涉及这些的图表要么隐藏、要么写明「要什么才有」。
6. **中文文案跟着设计稿的语气**：短句、具体、不用感叹号、不写「已为您」。

## 自检

```bash
node scripts/build-client.cjs                 # 拼出 client.js
node tests/client-smoke.mjs                   # 契约冒烟（注册、15 页在内、iframe 能画）
node scripts/render-preview.cjs F:\dsharness\etude-test\shots
```

`render-preview` 会算出 `plugin-<page>.html`，里面 iframe 已经注入了一份假 state 并跑过适配器，
**直接截图就能看到你的适配器效果**。截图命令（如果这个会话里有）：

```js
vision_html_screenshot({ source: 'F:\\dsharness\\etude-test\\shots\\plugin-<page>.html', width: 1280, height: 900 })
```

## 各页锚点怎么找

```bash
grep -n 'class="' design/<page>.html | head -60
```

设计稿的类名就是锚点，例如卡片页的 `.deckcard / .deckhead / .drow / .dnum / .deckstat / .nextup`。
先读一遍页面 HTML，把「哪一块是数据、哪一块是固定文案」分清楚，再动手。

## 已知的「设计稿有、后端没有」清单

| 设计稿里 | 实际 |
|---|---|
| Anki 调度（未学习/学习中/待复习、间隔、难度、复习次数） | 没有调度引擎，只有 `status` 六种状态 |
| 复习历史曲线、记忆保留率、间隔分布、难度分布 | 端点里没有任何作答记录 |
| 录音（说这一面） | 没有录音字段，也没有录音端点 |
| 生图、背景编辑、资源挂载 | RPC 里没有 |
| 多语言（中文/日语/韩语…） | `LANGUAGES = ['en']`，只有英语能生成 |
| 三态（空/加载/错）的具体文案 | CSS 全都有（`.state-*`），但页面里没有对应节点 |

这些空缺，适配器的正确做法是**如实标注**，不是编一个数字填上。
