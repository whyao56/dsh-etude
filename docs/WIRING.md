# 接线作业单 · 把 dsh-etude 接到已经定稿的界面上

> **这一版的前提：界面已经定稿了，不要重画。**
> 上一个接手的人把整套前端重画了一遍，用户的原话是「直接把原先的卡片工厂删了」，
> 全部作废。所以这份单子只讲一件事：**在不改外观的前提下，把真实数据接进去。**

---

## 0. 你只需要做「接线」，不需要做「设计」

| 允许 | 禁止 |
|---|---|
| 把页面里写死的数据换成注入的真实数据 | 改字号、间距、颜色、圆角、阴影 |
| 给元素加 `data-*` 钩子、id | 重排布局、调整栏宽、换字体 |
| 补空态 / 加载态 / 错误态（用现有那套样式） | 换掉启动页的星空、换掉过渡 |
| 修真正的 bug（点击没反应、算错、报错） | 重写 `app.css`、重写 `gen.mjs` 的模板结构 |
| 新增页面（如果某个功能缺页面） | 改动已有的 15 页的任何视觉 |

判断标准只有一条：**同一屏，改之前和改之后的截图并排放，除了数据不同，看不出区别。**

---

## 1. 动手前的三件事（少一件都不要往下做）

```powershell
cd F:\dsharness\dsh-etude
git tag v60-frontend                    # 给现在这版打个标签，永远能回来
Copy-Item design design.v60 -Recurse     # 目录级备份
git status                               # 必须是干净的
```

界面真源是 **`F:\dsharness\etude-test\mock\`**，`design/` 是它的副本。
两边现在**逐字节相同**（`index.html` 1723 B、`app.css` 190859 B，md5 一致）。

改页面的正确顺序：

```powershell
cd F:\dsharness\etude-test\mock
Copy-Item gen.mjs gen.mjs.bak-$(Get-Date -Format yyyyMMdd-HHmmss)
# …改 gen.mjs…
node gen.mjs                             # → wrote 15 screens
(Get-Item app.css).LastWriteTime = Get-Date   # 只改 js 时必做，否则 ?v= 不刷新
```

再把产物同步进仓库（脚本见第 6 节），最后提交。

---

## 2. 先读，再写一行代码

| 位置 | 看什么 |
|---|---|
| `design/index.html` → 双击打开 | 15 个页面长什么样、怎么跳 |
| `design/DESIGN.md`（165 KB） | 每一版为什么这么改、尺寸是多少、踩过什么坑 |
| `docs/REBUILD.md` | 产品规矩、技术事实、验收清单 |
| `docs/HANDOVER.md` | 上一轮插件侧的接口与数据长什么样 |

**读完再动手。** 上一次翻车的原因就是没读，直接按自己的想法重做了。

---

## 3. 现状：页面是死的，插件是活的，中间断着

- 15 个页面：数据全写死在 `gen.mjs` 里，按钮点了多半没反应。
- 插件侧（`index.js` / `lib/` / `contract/`）已经在跑：能造例句、能搜图、能合成语音、
  能打包导出。工具名是 `etude_create` / `etude_status` / `etude_build` / `etude_pack` / `etude_delete`。
- `client.js`（11 万字节）里已经有一个能用的面板，但**它长得不是这套界面**。
  上个窗口在里面改了不少（配置卡、九宫格、音频条）—— 那部分可以留作参考，但界面以 `design/` 为准。

所以你要做的桥是：

```
design/*.html  ──window.__ETUDE__──  data.js（注入的一坨真实数据）
      ▲                                   ▲
      │ 点按钮                            │ loopback RPC
      └──────── rpc.js ──────────────────┘
                                     index.js（Host 侧）
```

---

## 4. 具体怎么接（按这个顺序，一次一屏）

### 4.1 先定接口，再改页面

在 `lib/rpc.js` 里写死这套端点（名字照抄，别再发明）：

| 端点 | 返回 |
|---|---|
| `state` | `{ packs, settings, counts, selfcheck }` |
| `create` | `{ packId, examples }` |
| `status` | `{ packId, examples: [{ id, text, image: {ok, picked}, audio: {ok, listened} }] }` |
| `candidates` | `{ exampleId, images: [{ id, bytes, w, h, sha }] }` |
| `pick` | `{ ok }` |
| `preview` | `{ base64, mime }`（图 / 音频都走这条，**不要开 HTTP 路由**） |
| `pack` / `export` | `{ path, validated }` |

前端只认 `{ ok, value }` / `{ ok: false, error }` 这一种信封。
**失败必须说清是哪一步挂的**（搜图？预检？TTS？校验？），不要吞成「出错了」。

### 4.2 一屏一屏接，顺序不能变

1. **启动页** `index.html` —— 只加「点了开启之后去查一次 state」，别的都不要动。
2. **卡片** `cards.html` —— 卡片列表从 state 来。
3. **学习** `study.html` —— 五个面的内容和进度从 state 来；练过的状态要留得住。
4. **工厂** `factory.html` —— 这里是重点：粘贴 → 造料 → 九宫格挑图 → 试听 → 打包 → 导出。
   「还差什么」必须**真算**，不许写死。
5. **统计** `stats.html` —— 数字从 state 来；没有数据时走空态。
6. **设置** `settings.html` —— 读写的都是 Host 侧的配置。

每接完一屏，**立刻截图对比**：

```
vision_html_screenshot(width=1440, height=900, fullPage=true, source=<页面>.html)
```

和改之前那张并排看。如果除了数据以外还有别的地方变了，退回去重接。

### 4.3 三条绝对不能碰的规矩

1. 每张图必须人点过头才入库（九宫格挑图，不许自动配好）。
2. 语音必须真播过、人点过「我听过了」（播放进度到六成才许点）。
3. 幂等键命中就复用，不重复花钱。

---

## 5. 验收（按这个清单走，一条一条打勾）

**自动化**

```powershell
node --test tests/unit.test.mjs
node tests/rpc-smoke.mjs
node tests/client-smoke.mjs
python -m pytest tests/test_contract.py -q
node tests/selftest.mjs --examples 2 --candidates 5 --export
```

**人工**

1. 造一个词，8 条例句都能在卡片页看到、能点进学习页。
2. 学习页五个面都能走完一轮，返回后再进来，进度还在。
3. 工厂：粘 8 行（混着逗号和换行）→ 能认出是 8 条；缺图时「还差什么」显示 1 条，不是 0。
4. 九宫格挑一张图，刷新后还是那张。
5. 语音播到一半点「我听过了」→ **不许**成功；播到六成 → 可以。
6. 缺一张图就打包 → **必须拒绝**，并说清缺哪一条。
7. 导出的目录用 `contract/validate.py` 再校验一遍，通过。
8. 1440 / 1024 / 900 三个宽度，逐页截图，和 v60 并排比。

---

## 6. 同步脚本（改完 `mock/` 之后跑这个）

```powershell
$src = 'F:\dsharness\etude-test\mock'
$dst = 'F:\dsharness\dsh-etude\design'
$files = 'gen.mjs','app.css','app.js','app2.js','bgrows.js','decks.js','factory.js','fx.js',
'help.js','palette.js','pick.js','rain.js','rows.js','smooth.js','splash.js','transit.js','stats.js',
'cards.html','detail.html','factory.html','index.html','library.html','listen.html','mine.html',
'read.html','settings.html','speak.html','stats.html','study.html','tutorial.html','type.html','vary.html'
foreach ($f in $files) { Copy-Item (Join-Path $src $f) (Join-Path $dst $f) -Force }
Copy-Item (Join-Path $src 'assets') (Join-Path $dst 'assets') -Recurse -Force
Copy-Item 'F:\dsharness\etude-test\DESIGN.md' (Join-Path $dst 'DESIGN.md') -Force
```

提交信息写清「接了哪一屏」，不要写「更新界面」。

---

## 7. 上一次是怎么翻车的（别重犯）

给上一个模型的提示词是「把它做美：建立一套字号/颜色/间距的层级规则」。
它照着做了 —— 建了一套**自己的**令牌，然后把 15 页全部按新令牌重排了一遍，
`app.css` 从 190 KB 换成新文件，旧的 `splash.js`、`fx.js`、`palette.js` 全删，
`docs/HANDOVER.md` 也删了。功能上一行没接。

**教训**：说「做美」就会被理解成「重画」。
这一版你要是觉得哪里不好看，**先写进 `DESIGN.md` 问一句**，等用户点头再动；
不要自己判断「这样更好看」然后直接改。

---

## 8. 交付

1. 15 个页面全部由真实数据驱动，点击有反应，五个面能走完。
2. 外观与 v60 **肉眼无差**（三个断点截图并排）。
3. 上面第 5 节的清单全绿。
4. `DESIGN.md` 追加一节：接了哪几屏、每屏的数据从哪来、还剩什么没接。
5. 提交并推送，`git tag` 保留 `v60-frontend`。
