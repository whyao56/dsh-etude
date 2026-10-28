# dsh-etude

**DeepSeek Harness 插件：语言卡片工厂。**

给它一个词、一个固定说法、一句英文，它把「卡片」做出来 —— 8 条不同场景的例句、
每条例句一张对得上情境的实拍图、一条能听清语气的语音，打成 v2 卡片包交给
[Etude](https://github.com/whyao56/Etude) 去练（五通道 + 间隔重复）。

装好之后侧栏多一个「卡片工厂」，在里面造包、挑图、试听、打包、装进 Etude。
也可以用工具直接招呼：`etude_create` / `etude_status` / `etude_pack`。

> 现状：**0.1.0，能用了**。真模型造出过 8 条例句的包；配图走 Commons 实拍图、
> 每张都经过人工点选；语音走 Edge TTS（零配置、不需要 key），也能接 OpenAI 兼容接口。
> 见 [docs/HANDOVER.md](docs/HANDOVER.md) 了解为什么切开这一半。

## 为什么是插件，而不是「在 Etude 里继续改」

Etude 0.1.1 里有两半：训练器（好）和卡片工厂（坏）。

| | 谁做 | 在哪 |
|---|---|---|
| 造卡（写句、找图、TTS、人工挑图） | **dsh-etude**（本仓库） | DSH 插件 |
| 练卡（五通道、调度、统计、跟读） | Etude 0.1.1（参考实现） | 本地 exe / 源码 |

造卡是一次性、贵、必须有人看一眼的活；练卡是长期、便宜、天天跑的活。
混在一个进程里，工厂的毛病会拖着训练器一起被骂。

## 三条一开始就定死的规矩

1. **每张图都有人点过头。** 检索候选 → 预检 → 九宫格挑图 → 锁定。没有「自动配好就入库」这条路。
2. **试听必须真能播。** 界面上是真正的 `<audio>`，播到六成才允许点「我听过了」。
3. **重复的目标不重复收费。** 同目标同参数再点一次「造包」，直接复用上次的包，一分钱不花。

契约里把这三条写成了硬校验：`review.image.by` 与 `review.audio.by` 没有值、
`audio.listened !== true` 的包，`contract/validate.*` 一律拒收 —— 打不出来。

## 装上

```powershell
# 依赖（sharp 做像素体检，ws 打 Edge TTS 的 WebSocket）
cd <本仓库>
npm install

# 装进 DSH（在本仓库根目录之外的任意地方用 DSH 的 plugin_manager 也行）
```

装进 profile 后 `plugin_manager set_plugin target=include:etude enabled=false` 再
`enabled=true` 会重新加载宿主半（`changed:false` 时它不会重跑）。

## 用起来

界面上：侧栏「卡片工厂」→ 输入目标 → 造包 → 逐条「找候选图 / 点一张 / 生成语音 / 我听过了」
→ 打包 → 装进 Etude。**红字没消掉之前，打包按钮会告诉你还差哪几条。**

命令行（自检整条链路，用假模型，不花真钱、不联网找例句）：

```powershell
node tests/selftest.mjs --target coffee --examples 4 --candidates 6 --keep
node tests/selftest.mjs --target coffee --examples 8 --install   # 顺手装进 8977 上的 Etude
```

跑测试：

```powershell
npm test                                  # JS 单元 + 客户端渲染冒烟
python -m pytest tests/test_contract.py -q  # 契约双份校验器 + 像素守卫反证
```

## 数据落在哪

全部在 `%LOCALAPPDATA%\Etude`（`ETUDE_DATA_DIR` 或插件设置里的 `dataDir` 可以改）：

```
factory/library.json          账本：包、例句、复核记录（真源，不是内存）
factory/media/images|audio    内容寻址的媒体（<source>-<sha256[:20]>.<ext>）
factory/packs/<id>/           打好的成品包：manifest.json + images/ + audio/
factory/candidates/           还没选中的候选图（换一批就删）
staging/<id>/                 打包中转（校验不过会留着让人查）
etude.sqlite3  images/  audio/   Etude 自己的库和媒体目录
```

媒体文件名不是随便起的：`<小写字母>-<sha256 前 20 位>.<ext>`。这正好是 Etude
自己的命名规则，所以同一份字节既能由插件提供服务，也能直接落进 Etude 的目录里被认出来。

## 成品包长什么样

`format: "etude-lesson"`、`format_version: 2`。结构在
[`contract/manifest.schema.json`](contract/manifest.schema.json)，表达不出来的规矩在
[`contract/validate.js`](contract/validate.js) 与 [`contract/validate.py`](contract/validate.py)
（两份逐条对齐，测试里同一批好包坏包喂给两边，判定必须一致）。

每条例句带 `voice_hint`（怎么说这句）与 `image_query`（图是怎么搜来的）；
每张图带 `source / query / license / author / credit_url`，缺了授权信息只警告、
不拦交付 —— 但那种包不该对外发。

## 已知的坑（都踩过，别再踩）

- **Node 的 `fetch` 不读系统代理。** 走 Clash 之类的话，直连 Openverse / Commons 会卡到超时。
  `lib/net.js` 显式解析「设置 → 代理」→ 环境变量 → Windows 注册表，走 CONNECT 隧道。
  搜不到图先看设置里的 `proxyUrl`。
- **`output.schema` 是 Harness 的 value schema DSL，不是 JSON Schema。** 必填写在属性上
  （`{ type: 'string', required: true }`），写成 `required: [...]` 数组会让整个插件激活失败。
- **宿主 web 服务整站要鉴权。** `<img src="/etude/...">` 这种子资源带不上 token，会 401。
  所以界面的图与音频都走 RPC 拿字节、转 blob URL，不走 HTTP 路由。
- **Etude 的 `POST /api/lessons/import` 完全忽略 media 字段。** 它只吃文字。
  配图靠导入后逐条 `PATCH /api/examples/{id}` 写 `scene_image`；
  语音没有对外 setter，只能直写 sqlite（`node:sqlite`，`busy_timeout` 兜住 WAL），
  写不进去也不算失败 —— 会标成「语音需要重建」。
- **渐变图能骗过方差。** 纯色块 `stdev < 6` 就够，但线性渐变 `stdev` 能到 70 多。
  必须看二阶差分（`secondDiff < 1.1` 判渐变）。

## 许可

MIT
