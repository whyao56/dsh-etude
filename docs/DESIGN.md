# 设计与取舍

这份文档只记「为什么这么做」，不记「怎么用」（用法在 README）。每条都带被否掉的
另一个选择 —— 半年后回头看，能看懂当时怕的是什么。

## 整体形状

```
DSH 宿主进程（Node）
  index.js
    ├── Config            z.object，全部可调参数（20 个字段）
    ├── lib/tools.js      etude_create / etude_status / etude_pack
    ├── lib/rpc.js        /etude 回环 RPC：界面与脚本的唯一入口
    ├── lib/http-server.js /etude/* 媒体与回环 JSON 桥
    └── lib/packs.js      工厂主流程（状态机 + 账本）
          ├── lib/examples.js ← lib/llm.js（宿主内 llm 服务，DeepSeek 账号）
          ├── lib/images.js   → Openverse / Commons
          ├── lib/tts.js      → Edge TTS（lib/edge-token.js + ws）/ OpenAI 兼容
          ├── lib/manifest.js → contract/validate.js
          └── lib/etude.js    → Etude HTTP API + sqlite
浏览器（Web GUI）
  client.js  React 组件挂到 main / sidebar.panellist / plugins.bundle.config
```

界面上一切事实都来自宿主：客户端半没有自己的业务状态，只有「现在看哪个包」和
「哪个任务在跑」。所以刷新页面不会丢东西，也不会和账本对不上。

## 十个决定

### 1. 客户端半照抄 `window.__ModuleLoader__.load({ id, factory })`

Inspect 里还描述了另一种「dynamic Client half」写法（`ctx` / `React` / `host.call`），
但它没有任何现成插件在用，也没文档。**选实装且跑着的那一种。**

否掉的：dynamic 形态（好看，但坏了没人能修）。

### 2. 业务状态放 `factory/library.json`，不进 Config

Config 是给人调旋钮的，会被 Harness 当成「设置」渲染、会被热提交、会被备份。
包里几十条例句、每条的复核记录放进去，等于把数据库塞进设置项。

否掉的：Config + `mutate()` 存状态（dsh-image-generation 那种写法，适合纯配置）。

### 3. RPC 是唯一入口，工具与界面共用同一套 handler

`etude_create` 和界面上点「造包」走的是同一个函数。**好处**：不会出现「界面能造、
工具造不了」或者两套校验。**代价**：工具的参数校验得自己写一遍。

否掉的：工具直接调 `createPack`、界面调 RPC（两条路，迟早不一致）。

### 4. 媒体用 blob URL，不用 HTTP 路由

宿主 web 服务整站要鉴权，`<img src>` / `<audio src>` 这种子资源带不上 token，一律 401。
所以客户端通过 RPC 取字节、转 `URL.createObjectURL`。

**硬约束（踩过）**：拿到一个 object URL 后立刻 `revokeObjectURL` 会让图白掉；
每个 file 名字对应一个 URL，按 `bytes`/`mediaType` 做 key 缓存，组件卸载才撤。

HTTP 路由仍然保留（`/etude/media/...`、`/etude/candidate/...`），因为：
- 回环 JSON 桥（`POST /etude/api/<endpoint>`）让脚本和 CI 能无头驱动整条链路；
- 将来 Harness 若给外部访问配 token，媒体路由直接就能用，不必改客户端。

否掉的：只做 base64 over RPC（每个候选图 300KB×9 张会很痛）。

### 5. 像素体检不只看方差

纯色块 `stdev < 6` 就够。但**线性渐变的标准差能到 73**，只看方差会放它过去。
真正管用的是二阶差分（相邻像素差的差）：`secondDiff < 1.1` 判渐变抹平。

三个阈值（`stdev < 6` / `secondDiff < 1.1` / `uniqueRatio < 0.02`）都在
`lib/images.js` 的 `analyzePixels` 里，48×48 缩图上算，单张 10ms 级。

否掉的：只验尺寸和字节数（那等于不验，假模型的渐变图尺寸永远合格）。
否掉的：接 CLIP 之类判断「图文相关」（贵、慢、还要模型，先让人眼管这件事）。

### 6. sharp 是硬依赖，但缺了不阻止流程

`npm install` 带 prebuilt 二进制，装得上就能做像素体检；装不上就退回「只验结构」，
manifest 里的 `quality.pixel_analysis` 会写 `none` 而不是假装验过。

否掉的：纯 JS 自己解 JPEG/PNG（能解尺寸，但缩到 48×48 做统计要写解码器，不值）。

### 7. Edge TTS 纯 JS 复刻，不用 Python 子进程

`lib/edge-token.js` 是 `edge_tts.drm.generate_sec_ms_gec_v2` 的逐字节移植 ——
那套哈希被混淆过，`firstRound === 14` 时会先跑两轮标准轮再进 unrolled block，
照抄控制流才对得上。`tests/unit.test.mjs` 钉了三个时间戳的原值，算法一漂就红。

**好处**：零配置、不需要 key、不需要用户装 Python。
**代价**：Edge 哪天改算法，这里会 403 —— 所以引擎链里 OpenAI 兼容接口是主选、
Edge 是兜底，降级原因写进 `media.audio.engine` 与 `fellBackFrom`。

否掉的：起 `python -m edge_tts` 子进程（要用户有 Python，还要管进程）。

### 8. 语速类参数按引擎换算

Edge 用 `rate=+10%` / `volume=+10%`；OpenAI 兼容只有 `speed=1.1`，没有 volume。
`voice_hint`（"flat, tired, slow"）里的情绪词会再挪 ±10% 的语速 —— 同一批卡片
听起来不该像同一个人用同一种情绪念完八句。

否掉的：把 rate/volume 原样传给所有引擎（Etude 0.1.1 就是这么静默失效的）。

### 9. Etude 集成：能走 API 就走 API，走不了才碰数据库

- 导入：`POST /api/lessons/import`（只吃文字，etude 会忽略 media 字段）
- 配图：逐条 `PATCH /api/examples/{id}` 带 `scene_image`
- 语音：**没有对外 setter**，只能 `UPDATE examples SET audio_path=...`（`node:sqlite`，
  `busy_timeout=5000` 兜住 WAL 并发写）。写失败不致命，标成「语音需要重建」。

否掉的：让 Etude 自己重新合成一遍（要 key、要花钱，而且同一句话重复收费）。

### 10. 打包前先自检，校验不过保留 staging

`buildPackDir` 在 `staging/<id>/` 里写 `images/`、`audio/`、`manifest.json`，
跑一遍 `validateManifest`（full 模式，真的读文件对哈希），过才 copy 到
`factory/packs/<id>/`。不过关就抛错、**保留中转目录**，让人能进去看到底哪张图不对。

否掉的：直接写成品目录（半个包留在那儿，状态还是 `packed`，最坑人）。

## 状态机

```
generating ──→ text ──→ media ──→ packed ──→ installed
     └──────────┴────────┴─────────┴──→ failed（记 lastError）
```

`text` 之后每次动图/音都会重算 `progress`。任何时候都可以「解锁」某张图或某条语音
回到半成品状态 —— 状态机是往前走的，但复核记录可以撤销，因为选错了要能改。

## 幂等

`idempotencyKey({ target, kind, language, examples, variants, model, promptVersion, voice })`
→ sha256 前 32 位。同键且状态不是 `failed` 的包直接复用：**不重新调模型、不重新找图**。
`failed` 的包不复用 —— 失败可能有各种原因，第二次不该被上一次挡住。
