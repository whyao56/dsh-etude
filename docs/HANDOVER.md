# dsh-etude 立项交接书

> 立项时间：2026-10-28
> 交接来源：`whyao56/Etude` @ `v0.1.1`（tag `v0.1.1`，release `426616149`，commit `cdd1f17`）
> 本仓库：`whyao56/dsh-etude`（新项目，0.0.0 骨架）
> 一句话：**把「造卡」从 Etude 里切出来，做成一个 DSH 插件；Etude 冻结成训练器。**

---

## 目录

- [0. 这份文档给谁看](#0-这份文档给谁看)
- [1. 判决与认领：Etude 哪里坏了](#1-判决与认领etude-哪里坏了)
- [2. 目标形态：dsh-etude 是什么](#2-目标形态dsh-etude-是什么)
- [3. 从 Etude 搬什么（可复用资产清单）](#3-从-etude-搬什么可复用资产清单)
- [4. 不搬什么（七个包袱）](#4-不搬什么七个包袱)
- [5. 契约：卡片包 v2](#5-契约卡片包-v2)
- [6. 四个子系统](#6-四个子系统)
- [7. 卡片 UI 的六条硬标准](#7-卡片-ui-的六条硬标准)
- [8. 记忆与费用](#8-记忆与费用)
- [9. 里程碑与验收](#9-里程碑与验收)
- [10. 风险与反面清单](#10-风险与反面清单)
- [11. 环境与凭据](#11-环境与凭据)
- [12. 开工前必须确认的五件事](#12-开工前必须确认的五件事)

---

## 0. 这份文档给谁看

给**下一个我**：开「创造模式」接手这个仓库时，第一件事读它。
它不是需求文档也不是宣传稿，是「上一轮为什么失败、哪些东西能直接搬、哪些必须重写」的交接。
读完应该能做到两件事：知道边界在哪，知道第一步敲什么命令。

它也给人看：所有数字和结论都是 2026-10-28 在真机上跑出来的，不是估计。

---

## 1. 判决与认领：Etude 哪里坏了

用户对着 Etude 0.1.1 的原话：

> 「输出的图片完全就不是人能看的，设置很多东西完全就是无法设置，无法预览。」

### 1.1 三件我认领的错

1. **拿假图当配图验收。** 演示数据把 `images.source` 指到假模型（`scripts/openai_stub.py`），
   它返回一张 320×200 的渐变 PNG。为了让 e2e 那条「头是 `\x89PNG`、字节数 > 0」过，我把它当成了成功。
   于是截图、发行说明、报告里的卡片配图全是色块 —— **用户看到的就是这个**。
   教训：守卫要断在「人看了会满意」的近似上，不是字节头。
2. **把「测试通过」当成品。** 331 个测试 + 41 冒烟 + 22 e2e 全绿，但用户关心的「图好不好看」一条都没覆盖。
3. **优先级排反了。** 工厂没做对之前，我先加了进度页、导入导出、备份恢复 —— 都是训练器侧的锦上添花。

### 1.2 真实链路上的三个硬伤（不是假数据的锅）

| 硬伤 | 位置（Etude @ v0.1.1） | 后果 |
|---|---|---|
| 取图只有一次机会，取完直接写库 | `backend/app/pipeline.py:277` `_make_images()`、`:568` `make_example_image()` | 用户没看过这张图，它就已经是卡的一部分 |
| 只回文件名，不回可看的画面 | `backend/app/providers/images.py:663` `_store()` → `f"{source}-{digest}.{ext}"`；界面只显示 `name · bytes`（`backend/frontend/js/views/settings.js:442-457`） | 测试按钮点完只看到哈希，等于没测 |
| 检索只靠关键词，没人复核 | `backend/app/providers/images.py:207` `build_query()`（砍破折号、滤 stop 词、按词长取前 5） | Commons/Openverse 常给「差不多但不是这个场景」的图 |

### 1.3 「设置无法设置、无法预览」的具体清单

- 语速 `rate` / 音量 `volume` 只在 Edge 引擎生效；`_synthesize_openai()`（`providers/tts.py:170`）
  根本不传这两个参数，切引擎后改了等于没改，且**没有任何提示**。
- 界面没有的配置项：`llm.max_tokens`、`study.scale`、`study.plan_default_count`、
  `server.port`、`server.open_window`。
- Edge 音色只有 7 个预置下拉（`providers/tts.py:22` `EDGE_VOICES`），不能填任意音色名。
- `POST /api/config/test-tts` 返回 `{ok, engine, voice, bytes}`（`routes/config.py:63-74`），**没有可播放 URL** ——
  设置页自己写着「合成成功：xxx 字节。先保存，再回来试听」。
- 配图没有预览 / 换一张 / 锁定；只有整个包「重新生成配图」。
- 字号/配色改动没有实时小样，要退出设置页才看得到。
- 例句没有「先出 3 条挑一条」，只有「生成 8 条，不满意整包重来」。

**结论：坏的是「造卡 + 预览 + 复核」这条链，不是训练器。**

---

## 2. 目标形态：dsh-etude 是什么

一个 **DSH 插件**，把「一个目标 → 一包可练的卡片」做成可复核、可复用、可计费的工作流：

```
目标（词/固定说法/整句）
  ├─ 例句：8 条不同场景 + 3 种中文说法 + 英英释义 + IPA + 换词样本
  ├─ 配图：每条一张 —— 检索候选 → 预检 → 挑图 → 锁定（带来源与许可）
  ├─ 语音：每条一条 —— TTS（音色/语速可调）→ 试听三句 → 定稿
  └─ 产物：manifest.json + media/  →  交给 Etude 去练
```

**边界**：

- dsh-etude **不做**训练、不做调度、不做统计。它只造卡与验卡。
- Etude **不做**生成。它只吃包、落库、铺卡、调度、展示。
- 两者之间只有一个契约（§5），不许有第二套隐式约定。

---

## 3. 从 Etude 搬什么（可复用资产清单）

这些都验证过、可以直接抄（路径相对 `whyao56/Etude` @ `v0.1.1`）：

| 资产 | 路径 | 搬过去做什么 |
|---|---|---|
| 例句提示词口径 | `backend/app/prompts.py`（`SYSTEM` 七条 HARD RULES、`_target_instruction`） | 直接改成短语料库的 system prompt；七条规则（一包一 JSON / 场景不含原句 / 中文说法必须「什么场合说」/ 4~12 词 / 真人会说 …）是踩出来的 |
| JSON 抽取 | `backend/app/providers/llm.py` `extract_json()` | 模型爱在 JSON 前后夹解说，甚至夹花括号；三层抽取（直解 → 剥围栏 → 从每个 `{` 配平扫描）必须抄 |
| 错误话术 | 同文件 `explain_error()` | 判断顺序错了会把 `ModuleNotFoundError` 说成「换个网络」 |
| 检索与预检 | `backend/app/providers/images.py`：`build_query()` `build_prompt()` `pick_candidate()` `_sniff()` `_reject_unknown()` | 关键词构造、排序打分、文件头嗅探（挡 200+HTML）都能用；**要加的是「候选池 + 预览 + 挑图」** |
| TTS 与缓存 | `backend/app/providers/tts.py`：`cache_name()` `resolve_voice()` `synthesize()` 的「合成后必须校验文件非空」 | 内容寻址缓存与唯一取音色处的写法；OpenAI 引擎缺 rate/volume 的坑别再犯 |
| 跟读/语音评分 | `backend/app/pronounce.py`（WAV 解析、停顿、音量、逐词 LCS 对齐） | 如果插件也要做「试听对不对」，这套启发式够用；音素级要另上模型 |
| 卡片包格式 v1 | `backend/app/routes/lessons.py` `export_lesson()` / `import_lesson()` | v2 就是在它上面加媒体与 review 记录 |
| 快照与恢复纪律 | `backend/app/store/schema.py`：先 `_migrate` 再 `executescript`；备份走 `VACUUM INTO`；恢复先删 `-wal` | 这条是血的教训（0.0.2「升级就崩」） |
| 前端设计 token | `backend/frontend/css/tokens.css`（四套配色、字号三档、四档评分色 `--g0..--g3`） | 卡片 UI 的底色体系可以直接继承，保证和训练器同一个世界观 |
| 守卫思路 | `scripts/check_frontend.py`（导入名/图标名/类名/版本一致）+ `tests/test_guards.py` 的反证用例 | 「守卫本身也要被验」 |
| 假模型与故障注入 | `scripts/openai_stub.py`（`fault-401/404/500/notjson/fenced/messy/slow`） | 造失败，比造成功更重要 |
| 演示数据 | `scripts/seed_demo.py` | 造「练了三周」的数据；**但它用假图这一点必须改**（§4.4） |

---

## 4. 不搬什么（七个包袱）

1. **「设置里选引擎」** → 改成可用性自动降级，并在卡片上标注实际用的是哪个引擎（用户要能听出差别）。
2. **一次成型、无候选的配图** → 候选池 + 挑图 + 锁定；没有「自动配好就入库」。
3. **`test-*` 只回字节数** → 必须回可播放/可显示的 URL。
4. **假模型生成的渐变图参与验收** → 演示数据里必须有真图；没有真图源就不出图，也不准出宣传图。
5. **「没有图」虚线占位框** → 没图就不占位（Etude 0.1.1 改了一半，插件时代彻底删掉）。
6. **把 key 塞进全局配置** → 凭据放 DSH 侧；Etude 只留「已配置/未配置」布尔（`public_view()` 已经这么做了，保持）。
7. **工厂没做好就堆功能** → 优先级按「用户会用哪一半」排。

---

## 5. 契约：卡片包 v2

一个包 = 一个目录（或一个 zip），根上 `manifest.json`：

```json
{
  "format": "etude-lesson",
  "format_version": 2,
  "generator": {"kind": "dsh-plugin", "name": "dsh-etude", "version": "0.1.0",
                "model": "deepseek-v4", "prompt_version": "2026-10-28.1", "run_id": "r-8f3a…"},
  "created_at": "2026-10-28T12:04:11Z",
  "lesson": {
    "target": "appreciate",
    "kind": "word",
    "language": "en",
    "gloss": "to understand how good something is, or to enjoy it",
    "ipa": "/əˈpriːʃieɪt/",
    "note": "Common in everyday speech.",
    "voice": {"engine": "dsh-tts", "voice": "en-female-warm", "rate": "-8%", "volume": "+0%"}
  },
  "examples": [
    {
      "ord": 1,
      "sentence": "I really appreciate the way this one works.",
      "scene_en": "At a concert, someone worries the crowd won't get it — you say it appeals to anyone.",
      "scene_zh": "音乐节上有人担心台下听不懂，你说谁都能听得进去。",
      "zh_variants": ["这不挑人。", "音乐节上有人担心台下听不懂，你说谁都能听得进去。"],
      "register": "日常口语",
      "media": {
        "image": {"file": "media/img/0001.webp", "sha256": "…", "bytes": 84213,
                  "width": 1280, "height": 853, "source": "search:commons",
                  "query": "concert crowd stage lights", "license": "CC BY-SA 4.0",
                  "author": "Jane Doe", "credit_url": "https://commons.wikimedia.org/wiki/File:…"},
        "audio": {"file": "media/audio/0001.mp3", "sha256": "…", "bytes": 21430,
                  "seconds": 2.6, "engine": "dsh-tts", "voice": "en-female-warm"}
      },
      "review": {"image": {"by": "agent", "at": "…", "candidates": 8, "picked": 3},
                 "audio": {"by": "agent", "at": "…", "listened": true}}
    }
  ],
  "swaps": [
    {"role": "object", "original": "the way this one works",
     "candidates": ["the design", "the ending", "the effort"],
     "samples": ["I really appreciate the design."]}
  ],
  "quality": {"examples": 8, "images": 8, "audios": 8,
              "min_image_short_edge": 853, "flat_images": 0, "text_in_images": 0}
}
```

### 硬性校验（导入方必须做，做不到就拒收）

- `format == "etude-lesson"`、`format_version == 2`、`lesson.target` 非空；
- 语言在白名单（当前只有 `en` 支持生成，其它能存不能生成）；
- `examples` 条数 1–40；`sentence` 非空；`zh_variants` ≤4；`scene_*` ≤600 字；
- 每条 `media.image` / `media.audio` 的文件**必须存在**，`sha256` 与文件一致；
- 图片短边 ≥ 640、`bytes` ≤ 4 MB；音频 `bytes` > 0 且能读出时长；
- `review.image.by` 与 `review.audio.by` 必须有值（**没有复核记录的包不算成品**）；
- 同句按 `casefold()` 去重；同一 `sha256` 的媒体只落一份。

### 幂等键

`hash(target, kind, language, examples_per_lesson, model, prompt_version, voice)`。
命中已有包 → 直接复用产物，不再调模型/图库/TTS。
产物落地：`%LOCALAPPDATA%\Etude\staging\<job_id>\`，导入成功后按需要保留或清理。

---

## 6. 四个子系统

### 6.1 目标 → 例句（最熟的一块）

- 复用 Etude 的七条 HARD RULES（`prompts.py` 的 `SYSTEM`），改三处：
  1. 明确要求**场景互不相同**（现在模型爱写 8 个「音乐节」）；
  2. 要求 `scene_zh` 只写「什么场合说这句」，不许翻译；
  3. 新增 `voice_hint`（情绪/语速建议），给语音子系统用。
- 输出后做**确定性校验**：句子词数 4–12、必须含 target（词形变化要标注）、不许两句编辑距离过近。
- 失败重试一次；再失败就交给人（「这条我写不好」比「写一条错的」便宜）。

### 6.2 配图（用户最不满的一环）

```
scene_en
  ├─(A) 检索：Openverse（CC）/ Wikimedia Commons / 可选 Unsplash&Pexels（需 key）
  │        → 每 query 取 6~8 张，至少两个 query 变体
  ├─(B) 画图：自部署 SDXL / Flux（默认关）
  │        → 每 prompt 2~4 张，冷启动 20~60 秒、出一张 3~15 秒、要 6~12 GB 显存
  └─(C) 候选池 → 预检 → 九宫格 → 挑 1 张 → 锁定
```

**预检**（自动，省人力）：

- 尺寸：短边 ≥ 640；宽高比 1.2–2.0 优先；`bytes` ≤ 4 MB；
- 内容：文件头嗅探（挡 200+HTML 与假扩展名）+ **主色方差/熵**（挡纯色块与渐变 ——
  这正是 Etude 那次事故的漏洞）+ 简易文字检测（画面里有大段文字就降权：卡片上出现英文会剧透）；
- 相关性：标题/标签/描述与场景关键词的命中数（`pick_candidate()` 已有的打分逻辑可继承）；
- 合规：许可、作者、来源链接**必须一起存**（`license/author/credit_url`）。

**人工那一步不可省**：九宫格（每张显示来源与许可）→ 点选 / 换一批 / 自己上传 → 锁定。
锁定后写 `media.image` 与 `review`。**没有这一步的包，导入方拒收。**

**自部署生图的定位**：补检索找不到的场景（抽象动作、特定文化场景），不是主力。
默认关，接口留着，README 里写明代价。

### 6.3 语音

**主链**：DSH 侧 TTS（OpenAI 兼容 `/audio/speech`，或本地 CosyVoice / GPT-SoVITS）。
**兜底**：Edge TTS（免费、无 key、离线可用）。切换语义是**按可用性自动降级**，
并把实际用的引擎写进 `lesson.voice` 与每条 `media.audio.engine`（卡片上也要标）。

参数要真正生效：

| 参数 | Edge | OpenAI 兼容 | 本地 CosyVoice/GPT-SoVITS |
|---|---|---|---|
| 音色 | 音色名 | `voice` | 参考音频（few-shot） |
| 语速 | `rate=+10%` | `speed=1.1` | `speed` |
| 音量 | `volume=+10%` | 不支持 → 本地增益或文档写明 | 同左 |
| 语气 | 不支持 | `instructions`（部分兼容层支持） | 参考音频的情感/风格 |

**试听是硬要求**：任何「试一下」必须返回 `{url, bytes, seconds, engine, voice}`，
界面里 `<audio controls>` 直接播；给**三句不同长度**的样本（4 词 / 10 词 / 18 词），
因为音色在长句上才听得出来。

**音色训练**：先不做。训练一个能用的音色要 10–60 分钟样本清洗 + 几十分钟训练，
收益（「听起来更像某个人」）对背句子的帮助很小。等 §8 的费用账算清后再开。

### 6.4 记忆（本地唯一真相）

- `%LOCALAPPDATA%\Etude\` 下 `etude.sqlite3` + `audio/` + `images/` + `staging/`；
- 媒体内容寻址：`sha256(bytes)[:20]`，两张卡用同一张图，磁盘上只有一份；
- 包级归档：`staging/<job_id>/` 就是完整包，可备份、可迁移、以后可上传分享；
- **失败不复用**：坏图坏音频绝不进「已生成」集合（否则用户会一直看到坏的那张）。

---

## 7. 卡片 UI 的六条硬标准

不定标准就永远做不好。这六条都能检查：

1. **图是主体**：图文比 ≥ 0.55:1；图必须是真照片（非渐变、非插画）；**没图不占位**。
2. **文字只有三层**：句子（衬线 1.5–1.9rem）/ 场景说明（1 行，次级色）/ 元信息（IPA、语域，最小）。
   不许出现第四种字号来「强调」。
3. **一屏一卡**：翻面前后卡片高度差 < 6%；评分区粘底但不遮内容。
4. **动效 ≤ 180 ms**，只用于翻面与揭示；`prefers-reduced-motion` 时全关。
5. **窄屏（360 px）不塌**：图高 240 px、字号同档、按钮不换行。
6. **暗色是设计过的暗色**：不是反相；`--surface` 与 `--ink` 对比度 ≥ 7:1；图不加滤镜、压暗 ≤ 6%。

视觉体系直接继承 Etude 的 `tokens.css`（四套配色、字号三档、四档评分色），
保证「在插件里做的卡」和「在训练器里看的卡」是同一个世界观。

---

## 8. 记忆与费用

省钱的四层，缺一层就会重复烧钱：

1. **内容寻址缓存**：同一句话 → 同一个 mp3；同一张图 → 同一份文件。
2. **幂等生成**：`(target, 参数, model, prompt_version)` 命中就复用。
3. **增量补齐**：只补 `missing_images` / `missing_audios`，不整包重生成。
4. **成功才入库，失败留痕**：失败项记进 job 报告，不写进包的 `media`。

**配额**（建议起步值，可在设置里改）：单包 ≤ 8 条例句、≤ 10 张图候选、
≤ 3 次 TTS 重试、画图默认关。目的不是抠，是让「一键生成」不至于一觉醒来账单爆炸。

---

## 9. 里程碑与验收

| 阶段 | 内容 | 验收（可执行） |
|---|---|---|
| **M0 骨架** | 仓库、契约 v2、校验器、假模型 | `pytest` 有「纯色块图会被拒收」「没有 review 记录会被拒收」两条反证用例 |
| **M1 例句** | 目标 → 8 条例句（复用七条规则 + 确定性校验） | 8 个目标各出一包，人工读一遍：「有没有真人会这么说」 |
| **M2 配图** | 检索候选 → 预检 → 九宫格挑图 → 锁定 | 一包 8 张图，**每张都点过头**；`quality.flat_images == 0` |
| **M3 语音** | TTS + 三句试听 + 音色/语速写进包 | 「试一下」能播；Edge 与主 TTS 各验一次；时长误差 < 15% |
| **M4 交付** | 出 v2 包 → Etude `import` → 训练器里能看到真图真音 | `POST /api/lessons/import` 200，卡片页首屏有图（`naturalWidth ≥ 480`） |

每个阶段的验收都必须是**命令或截图**，不许是「我看了一下，挺好」。

---

## 10. 风险与反面清单

| 风险 | 现实 | 应对 |
|---|---|---|
| 检索图质量不可控 | Commons 里「音乐节」的图大量是舞台远景，不是人的场景 | 两个 query 变体 + 人工挑；宁可给「无图卡」也不给错图 |
| 自部署生图不划算 | 显存、冷启动、出图慢、仍不如检索 | 默认关；只在补缺时开，且允许失败回退到「无图」 |
| 许可风险 | 检索图必须带许可与作者 | 未带 `license/author/credit_url` 的图一律不收 |
| 费用失控 | 模型 + 图 + TTS 三处都要钱 | 幂等 + 缓存 + 增量 + 配额（§8） |
| 插件与训练器版本漂移 | v2 包格式改一次就要同步两边 | 契约双份实现（Python + JS），用同一批 fixture 测 |
| 「好看」变成主观争论 | 六条标准就是尺子 | 对着 360/960/1320 三张图逐条对照 |

**反面清单**（看到就要停）：

- 用假图/占位图出宣传图；
- 未经复核的包直接入库；
- 单测只断言「字节数 > 0」；
- 把 key 写进仓库或日志；
- 在工厂没做对之前加新功能。

---

## 11. 环境与凭据

| 项 | 事实（2026-10-28 实测） |
|---|---|
| Etude 参考实现 | `F:\dsharness\Etude-work\Etude`，`.venv`（Python 3.11.9；fastapi 0.162 / uvicorn 0.54 / pydantic 2.14 / edge-tts 7.3.1 / pyinstaller 6.22.3 / pytest 9.1.1 / pywebview） |
| Etude 服务 | `backend/run_etude.py --no-window --port 8977`；端口被自己占用时复用，不开第二个实例 |
| 数据目录 | `%LOCALAPPDATA%\Etude`（`ETUDE_DATA_DIR` 可覆盖） |
| 假模型 | `scripts/openai_stub.py --port 18999`，模型名 `fault-401/404/500/notjson/fenced/messy/slow` 注入故障 |
| 凭据 | `git credential fill`（Windows 凭据管理器，helper=manager）；**没有 gh CLI**；本仓库用同一套 HTTPS 凭据推送 |
| 禁止 | 不要探测用户 home 下的凭据文件（CC Safety Net 会拦，也不该碰） |
| 已知坑 | ① 改前端/源码**不许**用 PowerShell 管道（`Get-Content` 按 GBK 解 UTF-8，中文会不可逆损毁）；② `write` 工具无 append，长文档用 `edit` 以尾部为锚；③ 换文件后重启服务；④ pwsh 管道退出码不可信 |

---

## 12. 开工前必须确认的五件事

1. **DSH 插件的注册方式**：确认插件入口、工具注册、配置 schema 的真实形状
   （现有参照：`$DSH_HOME\profiles\desktop\cordis.patch.yml` 与打包产物里的插件目录；
   创造模式第一件事是把插件 SDK 的入口读明白，别猜）。
2. **TTS 的主链到底是什么**：DSH 侧有没有现成的语音能力？没有就走 OpenAI 兼容 + Edge 兜底。
3. **图源白名单**：Openverse / Commons 够不够？要不要接 Unsplash（需 key）、Pexels（需 key）。
4. **包落地位置**：直接写 `%LOCALAPPDATA%\Etude\staging\`，还是插件自己的目录再由 Etude 导入。
5. **Etude 侧要改什么**：v2 导入分支 + 媒体落盘 + `media`/`review` 两列。**只改这些**，
   不许在 Etude 里再长出新功能。

---

## 附：Etude 0.1.1 能力对照（搬的时候按这张表核对）

| 能力 | Etude 里有 | dsh-etude 要不要 |
|---|---|---|
| 例句生成 + 中文说法 + 换词 | ✅ | ✅（重写 system prompt 与校验） |
| 配图检索/画图 | ✅ 一次成型 | ✅ 但必须「候选 → 挑图 → 锁定」 |
| TTS + 缓存 | ✅ | ✅ 且补试听、补 rate/volume |
| 五通道训练 | ✅ | ❌ 交给 Etude |
| SRS 调度 | ✅ | ❌ |
| 进度统计 | ✅ | ❌（可只读 Etude 的 `/api/progress`） |
| 跟读评分 | ✅ 启发式 | 可选（试听校验用） |
| 备份/恢复 | ✅ | ❌ |
| 导出/导入 JSON | ✅ v1 | ✅ 升级到 v2 |
| 桌面窗口/打包 | ✅ pywebview + PyInstaller | ❌（插件形态，不需要 exe） |
