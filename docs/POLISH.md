# 作业单 · 前端打磨（60 → 85+）+ 接线

> 这套界面是用户认可的形态，**方向对，完成度不够**。用户原话：
> 「我可以说达到了六十分，但距离满分一百分还有距离。」
>
> 所以你要做两件事：**在现有这套界面里把它做细**，然后把真实数据接上去。
> 不是重画，也不是原样不动 —— 是在同一套语法里把它做精。

---

## 0. 一句话边界

**可以改的**：间距、字号、字重、颜色阶、圆角的具体数值；单页内部的排版细节；
补齐缺失的状态；加动效反馈；修 bug；把写死的数据换成真实数据。

**不可以的**：换掉这套设计语言、重写 `app.css`、重排 15 页的结构、删文件、
换字体家族、改 `gen.mjs` 的模板骨架、把 `splash.js` 的星空换掉。

判据：**同一屏，改前改后并排放，能看出「更精致了」，但说不出「换了一套设计」。**

---

## 1. 动手前（少一件都别往下做）

```powershell
cd F:\dsharness\dsh-etude
git tag v60-frontend                       # 打标签，永远能回来
Copy-Item design design.v60 -Recurse        # 目录级备份
git status                                  # 必须干净
```

界面真源是 **`F:\dsharness\etude-test\mock\`**，`design/` 是它的逐字节副本
（`index.html` 1723 B、`app.css` 190859 B，md5 一致）。改页面改 `gen.mjs`，
`node gen.mjs` 生成 15 页，再同步到 `design/`（脚本见第 6 节）。

先读这三样，再写第一行代码：

| 文件 | 你会得到什么 |
|---|---|
| `design/index.html`（双击） | 15 个页面现在长什么样 |
| `design/DESIGN.md`（165 KB） | 每一版为什么这么改、尺寸是多少、踩过什么坑 |
| `docs/HANDOVER.md` | 插件侧的接口、数据结构、已经跑通的链路 |

---

## 2. 现在这 60 分扣在哪（照着改，别自己另起一套想法）

1. **色相没收住。** 主色蓝紫之外还有琥珀/松石/紫/红/绿/粉六个装饰色，出现在状态点、抽屉、图表上。目标：**1 个主色 + 1 个警示色 + 5 级中性阶 + 至多 2 个语义色**；其余颜色只允许出现在 ≤2px 的标记上。
2. **字阶缺中间层。** 现在是 11 / 12.5 / 15 / 20 / 28，11 和 12.5 之间几乎看不出差，20 到 28 又跳。目标：补一档 14（正文），把 15 收进正文层级。字重只用三档（400 / 500 / 600），现在有 600/700 混用。
3. **间距没有节奏。** 出现 7 / 9 / 11 / 13 / 17 / 22 这些值。目标：全部改成 4 的倍数（4/8/12/16/20/24/32/48），一屏之内只用 3 种间距档。
4. **学习页右栏像按钮墙。** 900px 时右栏变成两列网格，六个块挤成一片。目标：窄屏改成可横向滚动的一条，或者折叠成一行 chip。
5. **工厂页层次靠字号撑。** 11 个弹窗入口分散，扫描路径不清楚。目标：按「造料 / 挑图 / 声音 / 出厂」四组收拢入口，「还差什么」做成一个显眼的缺口条。
6. **统计页六个色相**（`.c1…c6`）跟第 1 条冲突。目标：改成主色的 6 级明度阶，图例只保留差异不保留色相。
7. **空态 / 加载态 / 错误态基本没有。** 三态都要画。空态不要写「暂无数据」，要说清下一步该点哪。
8. **触控目标偏小。** 有一批 24–28px 的按钮。目标：桌面 ≥28px、窄屏 ≥36px，图标按钮再小也要有 32px 命中区。
9. **动效只在启动页和统计图上有。** 挑图、试听、评分、展开这些「点了应该有反应」的地方几乎没反馈。目标：180–260ms 的状态反馈 + 必要的位移，不要弹跳。
10. **卡片页与详情页是早期做的**，密度和节奏跟学习页不是一套。目标：以学习页为准，把这两页的手感对齐。

---

## 3. 打磨怎么做（方式比结果重要）

### 3.1 一屏一屏来，每屏出 2–3 版

顺序：**卡片 → 学习 → 工厂 → 统计 → 详页/设置/其余 → 启动页最后**。

每屏的流程：

1. 先出 **2–3 个候选**，差别要明确（密度不同 / 信息层级不同 / 焦点不同），不是微调。
2. 每版都截图（1440）贴在对话里，**让用户挑一版**，不要自己拍板。
3. 挑定之后才写进 `gen.mjs`，再补 1024 / 900 两个断点的截图。
4. 收尾把「为什么选这版」写进 `DESIGN.md` 一节。

### 3.2 硬规格（不满足就不算做完）

- 间距只取 4 的倍数。
- 字阶 ≤ 6 级，字重 ≤ 3 档。
- 圆角只有 3 档：6 / 14 / 999。
- 颜色：1 主 + 1 警示 + 5 级中性 + ≤2 语义色；装饰色只在 ≤2px 元素上。
- 正文对比度：主文字 `.92`、次文字 `.6`、提示 `.38`、禁用 `.26`。
- 1440 / 1024 / 900 三个宽度都要截图，且 900 宽不许出现「一列一个词」。
- `prefers-reduced-motion: reduce` 时全部动画立即完成。
- 键盘：Tab 可达、焦点环可见、Esc 关弹层、`Ctrl/Cmd+K` 全局搜索。

### 3.3 动效时长

| 场景 | 时长 |
|---|---|
| 悬停 / 按下 / 选中 | 120–180ms |
| 展开 / 收起 | 380–520ms |
| 页面切换（遮罩） | 460–580ms |
| 图表重绘 | 600–900ms |

缓动统一用 `cubic-bezier(.22,.9,.18,1)`（进场）和 `cubic-bezier(.4,0,.85,.55)`（退场）。

---

## 4. 接线（和打磨并行，别等打磨完再做）

页面是死的，插件是活的，中间断着。接口名字直接照抄，别再发明：

| 端点 | 返回 |
|---|---|
| `state` | `{ packs, settings, counts, selfcheck }` |
| `create` | `{ packId, examples }` |
| `status` | `{ packId, examples: [{ id, text, image:{ok,picked}, audio:{ok,listened} }] }` |
| `candidates` | `{ exampleId, images: [{ id, bytes, w, h, sha }] }` |
| `pick` | `{ ok }` |
| `preview` | `{ base64, mime }`（图和音频都走这条，**不开 HTTP 路由**） |
| `pack` / `export` | `{ path, validated }` |

信封只有一种：`{ ok, value }` / `{ ok: false, error }`。**失败要说清挂在哪一步**
（搜图？预检？TTS？校验？），不要吞成「出错了」。

三条不能破的规矩：每张图必须人点过头；语音必须真播到六成才许点「我听过了」；
幂等键命中就复用、不重复花钱。

---

## 5. 验收

**自动化**

```powershell
node --test tests/unit.test.mjs
node tests/rpc-smoke.mjs
node tests/client-smoke.mjs
python -m pytest tests/test_contract.py -q
node tests/selftest.mjs --examples 2 --candidates 5 --export
```

**人工**

1. 造一个词，8 条例句在卡片页可见、能点进学习页。
2. 学习页五个面走完一轮，退出再进，进度还在。
3. 工厂：粘 8 行（逗号换行混用）→ 认出 8 条；缺 1 张图时「还差什么」显示 1 条。
4. 九宫格挑一张，刷新后还是那张。
5. 语音播到一半点「我听过了」→ 不许成功；六成 → 可以。
6. 缺图就打包 → 必须拒绝并说清缺哪条。
7. 导出目录用 `contract/validate.py` 再校验，通过。
8. 三个断点逐页截图，和 `design.v60` 并排比：更精致，但没换设计。

---

## 6. 同步脚本

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

改页面必须改 `gen.mjs` 再 `node gen.mjs`。只改 js 不重新生成时，`app.css` 的
mtime 要 touch 一下，否则 `?v=` 不变、浏览器用旧缓存。

---

## 7. 上一次是怎么翻车的

我给上一个模型的提示词是「把它做美：建立一套字号/颜色/间距的层级规则」。
它照着做 —— 建了**自己的一套令牌**，把 15 页全部按新令牌重排，
`app.css` 换成新文件，`splash.js` / `fx.js` / `palette.js` 全删，`docs/HANDOVER.md` 也删了。
功能上一行没接，界面也不再是用户要的那个。

**教训**：这一版你要是觉得某处该大改，**先写进 `DESIGN.md` 问一句**，
等用户点头再动。不要自己判断「这样更好看」然后直接推平。

---

## 8. 交付

1. 15 页在同一套设计语言里变精致，三个断点都有截图。
2. 全部由真实数据驱动，五个面能走完，缺什么真能算出来。
3. 第 5 节清单全绿。
4. `DESIGN.md` 追加：改了哪几屏、每屏选的是哪一版、为什么。
5. 提交并推送；`v60-frontend` 标签保留。
