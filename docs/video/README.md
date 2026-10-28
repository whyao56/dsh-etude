# 教程视频：代码做的

这个目录里有一条 6 分钟的教程视频，**不是录屏，是用代码生成的**。

成品：`dsh-etude-tutorial.mp4`（1280×720 / 25fps / H.264 + AAC，约 8.7 MB）。

## 为什么用代码做

录屏有三个毛病：改了一个字就得重录全片；鼠标一动就抖；想换个说法得重来一遍。用代码做，画面和旁白都在两个文本文件里，改完重跑，片子自己跟着变。

## 怎么做的

```
narration.mjs   →  逐段中文语音（Edge TTS）→  量出每段真实时长
                ↓
             逐帧画 SVG（sharp 光栅化成 raw RGBA）
                ↓
             stdin 喂给 ffmpeg → libx264 + AAC → mp4
```

关键点：**时长是量出来的，不是估的**。每段旁白先合成 mp3，解成 24kHz 单声道 PCM，按采样数算秒数；画面就按这个秒数停那么久。所以画面和声音不会错位，也不会出现「话说完了画面还在」。

## 文件

| 文件 | 用途 |
| --- | --- |
| `narration.mjs` | 逐字稿 + 每屏的画面描述。**改内容只改这个** |
| `build.mjs` | 渲染器。读稿子 → 合成语音 → 画帧 → 调 ffmpeg |
| `.cache/` | 合成过的语音（按文本哈希缓存），重跑不用再合成 |
| `.preview/` | `--still` 导出的静帧，看排版用 |

## 重出一遍

```powershell
# 需要：ffmpeg（带 libx264）、node_modules 里的 sharp 和 ws、能连 Edge 合成端点
node docs/video/build.mjs

# 只看几个时间点的排版（不编码，几秒钟出结果）
node docs/video/build.mjs --still 4,20,60,150,300

# 换 ffmpeg 位置 / 调质量
node docs/video/build.mjs --ffmpeg "C:\ffmpeg\bin\ffmpeg.exe" --crf 19 --preset slow
```

没有 ffmpeg 的话：

```powershell
npm i ffmpeg-static
# 然后 --ffmpeg node_modules/ffmpeg-static/ffmpeg.exe
```

## 画面有哪几种

`narration.mjs` 里 `scene.type` 决定：

| type | 长什么样 |
| --- | --- |
| `title` | 居中大标题 + 副标题 + 一排标签 |
| `bullets` | 标题 + 几条要点（逐条淡入，整块垂直居中） |
| `shot` | 一张真实的界面截图 + 一行小注（截图按 1.5 倍上限缩放，小图不会被拉糊） |
| `code` | 圆角深色框 + 等宽文字（逐行淡入） |
| `tree` | 目录树，比 `code` 行距更松 |
| `outro` | 收尾大字 + 一排标签 |

公共零件：顶部 3px 进度条（走完全片比例）、底部渐隐字幕带（最多 3 行）、右下 `NN / 42` 步号、左下签名。

## 排版上的几个坑（踩过）

- **字体必须写死**。`font-family="sans-serif"` 会回落到一个近似等宽的字体，拉丁字母很难看。中文写 `Microsoft YaHei, Segoe UI`，代码写 `Consolas, Courier New`。
- **等宽字体里画不出 `├──`**。Consolas 没有 U+251C/U+2514，树状图会缺字符，只剩竖线。所以 `tree` 场景一律用空格缩进。
- **截图卡不能每帧重新解码**。一张几百 KB 的 jpeg 解一次就要十几毫秒，九千帧扛不住。做法是每个 `shot` 场景先把「背景 + 截图」整屏预渲染一次存成 raw，逐帧只画文字层再 composite 上去。整片因此从半小时降到三分钟。
- **裁切坐标必须回看**。第一次把「换一张」按钮和半个图角一起裁进了语音行，元信息那行被切掉一半 —— 只算尺寸不看图，一定会出事。

## 字幕和旁白不是同一份文本

字幕显示的就是旁白原文（自动折行，最多三行）。如果某句话太长会被截断，改稿子时把它拆成两段，而不是在渲染器里加省略号。
