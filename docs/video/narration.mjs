/**
 * 视频教程的逐字稿。
 *
 * 一段 = 一句旁白 + 一屏画面。旁白合成完才知道多长，画面就跟着它停多久。
 * 改稿子只改这个文件，然后 `node docs/video/build.mjs` 重出片子。
 *
 * scene 类型：
 *   title   大字标题 + 副标题 + 三个小标签
 *   bullets 标题 + 几条要点（逐条淡入）
 *   shot    截图卡（图 + 标题 + 右下角小字），可选 spotlight 高亮框
 *   code    等宽代码块（逐行淡入）
 *   tree    目录树（等宽）
 *   outro   收尾
 */
export const narration = [
  {
    scene: {
      type: 'title',
      kicker: 'DeepSeek Harness 插件',
      title: '卡片工厂',
      subtitle: '给一个词、一个说法，或者一整句 —— 造一套能练的卡片',
      pills: ['一句真会说的话', '一张挑过的照片', '一条听过的语音'],
    },
    text: '这是一套语言卡片的制作流程。全部在 DeepSeek Harness 的卡片工厂插件里完成。',
  },
  {
    scene: {
      type: 'bullets',
      title: '一个包是什么',
      bullets: [
        '一个目标：一个词 / 一个固定说法 / 一整句',
        '八条卡片，场景互不相同',
        '每条带一张真照片、一条真语音',
        '导成一个目录，谁想练拿去练',
      ],
    },
    text: '一个包，就是给一个词、一个固定说法，或者一整句，造出来的全套材料。',
  },
  {
    scene: {
      type: 'bullets',
      title: '每条卡片的三个部分',
      bullets: [
        '句子 —— 真人真会说的那种，不是教科书例句',
        '照片 —— 有人亲自挑过的，不是自动配的',
        '语音 —— 有人戴着耳机真的听过的',
      ],
    },
    text: '每条卡片有三样东西：一句真人真会说的话，一张有人挑过的真照片，一条有人真的听过的语音。',
  },
  {
    scene: {
      type: 'bullets',
      title: '为什么不做一键全自动',
      bullets: [
        '1  每张图都得有人点过头',
        '2  试听必须真的能播出来',
        '3  同样的东西不重复花钱',
      ],
    },
    text: '那为什么不做成一键全自动？因为这行里最常见的就是看起来成功、其实废掉的材料。三条硬规矩。',
  },
  {
    scene: {
      type: 'bullets',
      title: '第一条：每张图都得有人点头',
      bullets: [
        '图库按关键词搜回来的东西，经常图文不符',
        '自动配好的图，人一眼就看出是机器糊的',
        '所以流程是：取候选 → 体检 → 人来挑 → 锁定',
      ],
    },
    text: '第一，每张图都得有人点过头。图库按关键词搜出来的东西，经常跟句子对不上。',
  },
  {
    scene: {
      type: 'bullets',
      title: '第二条：试听必须真能播',
      bullets: [
        '接口返回两百，不等于耳机里有声',
        '返回三万字节，也可能是坏的',
        '所以：播放进度过六成才算听过',
      ],
    },
    text: '第二，试听必须真的能播。接口返回了字节，不等于你耳朵里听得见。',
  },
  {
    scene: {
      type: 'bullets',
      title: '第三条：不重复花钱',
      bullets: [
        '幂等键 = 目标 + 类型 + 条数 + 模型 + 音色的哈希',
        '命中就直接复用上一次的包',
        '不再调模型、不再搜图、不再合成',
      ],
    },
    text: '第三，同样的东西不重复花钱。同一个词、同样的参数造第二遍，直接复用第一遍的结果。',
  },
  {
    scene: {
      type: 'bullets',
      title: '安装：两步',
      bullets: ['git clone 仓库', 'npm install —— 只装两个真依赖'],
    },
    text: '安装只有两步：克隆仓库，装依赖。',
  },
  {
    scene: {
      type: 'code',
      title: '两个依赖，都不是可选的',
      lines: [
        'npm install',
        '',
        '# sharp  读像素：纯色块、渐变、大色块海报全靠它挡',
        '# ws     走 Edge 语音的 WebSocket（要自定义请求头）',
        '',
        '$env:HTTPS_PROXY="http://127.0.0.1:7897"; npm install',
      ],
    },
    text: 'npm install 只装两个真依赖。sharp 用来读像素，ws 用来走 Edge 的语音通道。',
  },
  {
    scene: {
      type: 'code',
      title: '装进 Harness',
      lines: [
        'plugin_manager  action: install_bundle',
        '                target: "<仓库绝对路径>"',
        '',
        '# 成功：dsh-etude 0.1.0 <- F:\\dsharness\\dsh-etude',
        '',
        '# 改完代码之后重载（必须真先关再开）',
        'plugin_manager  action: set_plugin  target: "include:etude"  enabled: false',
        'plugin_manager  action: set_plugin  target: "include:etude"  enabled: true',
      ],
    },
    text: '然后让 Harness 把这个目录当成插件装上。装完左边会多一个工厂图标。',
  },
  {
    scene: {
      type: 'shot',
      title: '第一次打开',
      src: 'guide/first-open.jpg',
      note: '中间一句话告诉你下一步做什么；左边空着是正常的',
    },
    text: '第一次打开是这样。中间一句话告诉你下一步做什么，左边空着是正常的，它只列已经有的包。',
  },
  {
    scene: {
      type: 'shot',
      title: '顶栏三样东西',
      src: 'guide/header.jpg',
      crop: { left: 0, top: 0, width: 1280, height: 58 },
      note: '数据目录 · 输入框 · 造一个包',
    },
    text: '顶栏三样东西：数据目录，输入框，和造一个包。数据目录那个位置是有意的，一眼能看到东西存哪。',
  },
  {
    scene: {
      type: 'bullets',
      title: '打的字会自己判类型',
      bullets: [
        'coffee                         → 单词',
        'in the long run                → 短语',
        "I'm just looking around.       → 整句",
      ],
    },
    text: '打的字会自己判类型。一个词是单词，几个词是短语，带句末标点或者以 I、you、there 开头就是整句。',
  },
  {
    scene: {
      type: 'bullets',
      title: '判型为什么重要',
      bullets: [
        'get along with someone 是四个词的【短语】',
        '判成整句，模型会开始造整句',
        '方向从一开始就偏了，后面全废',
      ],
    },
    text: '判型不是小事，它决定提示词怎么写。四个词的固定说法是短语，被当成句子的话，方向从一开始就偏了。',
  },
  {
    scene: {
      type: 'shot',
      title: '正在造例句',
      src: 'guide/generating.jpg',
      note: '这一屏不用手动刷新，写完自己出现卡片',
    },
    text: '点造一个包，状态立刻变成正在造。这一屏不用手动刷新，模型写完，卡片会自己出现。',
  },
  {
    scene: {
      type: 'bullets',
      title: '模型回来后还要过一遍确定性校验',
      bullets: [
        '句子必须含目标词（短语要原样出现）',
        '两句不许重复',
        '场景不能把句子抄进去',
        '两条场景的词级相似度不超过 0.86',
        '中文说法至少两个',
      ],
    },
    text: '模型写完不是直接信。还要过一遍确定性校验：句子必须含目标词，场景不能雷同，中文说法至少两个。',
  },
  {
    scene: {
      type: 'bullets',
      title: '不过关怎么办',
      bullets: [
        '带着「哪里不对」重试一次',
        '取两次里问题更少的那份',
        '两次都不行 → 包置为失败，记下原因',
      ],
    },
    text: '有一项不过，就带着哪里不对重试一次，取问题更少的那份。两次都不行，包会置为失败，把原因记下来。',
  },
  {
    scene: {
      type: 'shot',
      title: '造出来的样子',
      src: 'guide/detail-top.jpg',
      note: '目标 · 类型 · 音标 · 状态 · 几条已确认',
    },
    text: '造出来是这样：大标题是目标词，四个小标签是类型、音标、状态、几条已确认，下面开始是八张卡片。',
  },
  {
    scene: {
      type: 'shot',
      title: '一张卡就三层',
      src: 'guide/card-meta.jpg',
      note: '句子（衬线大字）· 场景（一行次级色）· 元信息（更淡的小字）',
    },
    text: '一张卡从上到下就三层：句子，场景，元信息。别塞更多，多了就没人看。',
  },
  {
    scene: {
      type: 'bullets',
      title: '场景不是翻译',
      bullets: [
        '场景 = 什么情况下会说这句话',
        '写成翻译，练习就退化成翻译练习',
        '所以 scene_zh 只许写场合，不许字面对映',
      ],
    },
    text: '场景是什么情况下会说这句话，不是翻译。一旦写成翻译，这个练习就退化成翻译练习，方法失效。',
  },
  {
    scene: {
      type: 'bullets',
      title: '中文那句话是故意不一致的',
      bullets: [
        '同一句带两到三种不同说法',
        '一个极短口语、一个更完整、一个换个角度',
        '每次随机显示一种',
        '目的：防止你锁死「英文 A = 中文 B」',
      ],
    },
    text: '中文那句话是故意的：同一句话带两三种彼此不一致的说法，随机显示一种，防止你把英文和某个中文死死绑在一起。',
  },
  {
    scene: {
      type: 'shot',
      title: '左边列表带真实进度',
      src: 'guide/list.jpg',
      crop: { left: 0, top: 55, width: 320, height: 300 },
      note: '几张图、几条音、什么状态',
    },
    text: '左边列表每一行都带真实进度：几张图、几条音、什么状态。不用点进去猜。',
  },
  {
    scene: {
      type: 'shot',
      title: '底部动作条',
      src: 'panel-actions.jpg',
      note: '找全部候选图 · 打包 · 导出 · 补语音 · 删包',
    },
    text: '底部这一排是动作：找全部候选图、打包、导出成品包、补齐全部语音、删掉这个包。',
  },
  {
    scene: {
      type: 'bullets',
      title: '取货可以批量，点头不行',
      bullets: [
        '找候选图只是去图库取货',
        '没有「点头」的语义，所以可以一次八条',
        '挑哪张、听没听过 —— 只能人来',
      ],
    },
    text: '找候选图这一步只是去图库取货，没有点头的语义，所以可以批量。八条一次点下去。',
  },
  {
    scene: {
      type: 'bullets',
      title: '每张图先过体检',
      bullets: [
        '短边 ≥ 640，字节 ≤ 4 MB',
        '文件头嗅探：必须真是 jpeg/png/webp',
        '亮度标准差 < 6 → 纯色块',
        '亮度二阶差分 < 1.1 → 线性渐变',
        '量化色数占比 < 0.02 → 大色块海报',
      ],
    },
    text: '搜回来的每张图先过体检。短边不够、纯色块、渐变、大色块海报，全部挡掉。',
  },
  {
    scene: {
      type: 'bullets',
      title: '渐变是个陷阱',
      bullets: [
        '线性渐变的【方差并不小】',
        '只看方差，渐变会全部放过',
        '要看亮度的二阶差分才管用',
      ],
    },
    text: '特别注意渐变。它的方差并不小，只看方差会全部放过。必须看亮度的二阶差分。',
  },
  {
    scene: {
      type: 'shot',
      title: '九宫格里挑',
      src: 'panel-grid.jpg',
      note: '单击选中，双击锁定；不满意换一批或自己上传',
    },
    text: '过了体检的进九宫格。单击选中，双击直接锁定，不满意就换一批，或者自己上传一张。',
  },
  {
    scene: {
      type: 'bullets',
      title: '挑图时卡片会变成纵向',
      bullets: [
        '挤在图片那一栏里，每张只有一百来像素',
        '照片小于 150 像素，根本看不出拍的是什么',
        '所以挑图时九宫格铺满整卡',
      ],
    },
    text: '挑图的时候卡片会变成纵向，让九宫格铺满整卡。挤在图片那一栏里，每张只有一百来像素，等于让你瞎点。',
  },
  {
    scene: {
      type: 'bullets',
      title: '锁定之后',
      bullets: [
        '文件名 = 来源 + 内容哈希前 20 位',
        '同一张照片被两个包用到，磁盘里只有一份',
        '许可、作者、出处一起存下来',
      ],
    },
    text: '锁定之后图写进媒体库。文件名是来源加内容哈希，同一张照片被两个包用到，磁盘里也只有一份。',
  },
  {
    scene: {
      type: 'shot',
      title: '语音那一行',
      src: 'guide/audio-row.jpg',
      note: '真实时长 · 实际引擎与音色 · 确认按钮',
    },
    text: '语音默认走 Edge，不需要任何 key。这一行显示真实时长、实际用到的引擎和音色。',
  },
  {
    scene: {
      type: 'bullets',
      title: '合成完成 ≠ 能用了',
      bullets: [
        '点了播放、听到声音，「我听过了」才会亮',
        '播放进度过 60% 才算数',
        '确认之后才写复核记录',
        '没有复核记录 —— 包根本打包不了',
      ],
    },
    text: '合成完成不等于能用。要点播放，真的听到声音，我听过了那个按钮才会亮。没有复核记录，包根本打包不了。',
  },
  {
    scene: {
      type: 'bullets',
      title: '打包会先查缺件',
      bullets: [
        '缺图 / 缺音 / 图没点过 / 音没听过',
        '直接拒绝，并告诉你第几条',
        '然后生成清单，自己按契约验一遍',
        '验过了才进 packs 目录',
      ],
    },
    text: '打包会先查缺件：缺图、缺音、没点过、没听过，直接拒绝，并告诉你第几条。',
  },
  {
    scene: {
      type: 'shot',
      title: '导出',
      src: 'guide/exported.jpg',
      crop: { left: 0, top: 300, width: 1280, height: 240 },
      note: '落到下载目录；横幅写「已复验」',
    },
    text: '验过了才导出到下载目录。横幅上会写已复验 —— 这个词有具体含义，下一屏讲。',
  },
  {
    scene: {
      type: 'bullets',
      title: '导出不只是拷贝',
      bullets: [
        '先清空目标目录（重导不会新旧混在一起）',
        '拷完拿【导出那份】再验一次',
        '源文件好，不代表副本好',
        '验过了才记「已复验」；不过就报 export-invalid',
      ],
    },
    text: '导出不只是拷贝。先清空旧目录，拷完拿导出那份再验一次 —— 源文件好不代表副本好。验过了才记已复验。',
  },
  {
    scene: {
      type: 'tree',
      title: '成品包长这样',
      lines: [
        'coffee-13f770d580a24fc4/',
        '  manifest.json                         8519 B',
        '  images/',
        '    commons-34958284bf84a30c8729.jpg   352694 B   1920 x 1280',
        '    commons-6f227aa4ad77f5b7bece.jpg   569998 B   1920 x 1440',
        '  audio/',
        '    edge-1587b6105fb7f373b0dc.mp3       19728 B   3.288 s',
        '    edge-0a10e7f25badca7f9d64.mp3       20736 B   3.456 s',
      ],
    },
    text: '成品包就三样：清单、图片目录、音频目录。文件名的二十位十六进制是内容哈希。',
  },
  {
    scene: {
      type: 'code',
      title: '清单里每条都带出处与复核',
      lines: [
        '"media": {',
        '  "image": { "file": "images/commons-3495….jpg",',
        '             "sha256": "34958284…", "license": "CC BY 2.0",',
        '             "author": "Artem Beliaikin", "credit_url": "https://…" },',
        '  "audio": { "file": "audio/edge-1587….mp3",',
        '             "seconds": 3.288, "engine": "edge" }',
        '},',
        '"review": { "image": { "by": "…", "at": "…" },',
        '            "audio": { "by": "…", "listened": true } }',
      ],
    },
    text: '清单里每条都带哈希、许可、作者、出处，还有图和音各自的复核记录。这几项不是装饰，缺了包就不合格。',
  },
  {
    scene: {
      type: 'code',
      title: '命令行也能验',
      lines: [
        'python contract/validate.py "C:\\Users\\HP\\Downloads\\dsh-etude\\coffee-13f7…"',
        '',
        '合格 → 退出码 0',
        '不合格 → 退出码 1，并列出每一条错误',
        '',
        '# Node 版：contract/validate.js（插件打包时用的就是它）',
      ],
    },
    text: '没有 Node 的机器也能验：python contract/validate.py 加上包目录，合格退出码零，不合格退出码一。',
  },
  {
    scene: {
      type: 'shot',
      title: '设置页',
      src: 'guide/config.jpg',
      note: '音色 · 语速 · 每包几条 · 候选上限 · 导出目录 · 数据目录 · 代理',
    },
    text: '设置页能改音色、语速、每包几条、候选上限、导出目录、数据目录，还有代理地址。',
  },
  {
    scene: {
      type: 'bullets',
      title: '代理这条最容易踩',
      bullets: [
        'Node 的 fetch 不读系统代理',
        '搜不到候选图，九成是这里没填',
        '填 http://127.0.0.1:7897 这种，改完立刻生效',
        '不用重启宿主',
      ],
    },
    text: '代理这条最容易踩。Node 的 fetch 不读系统代理，搜不到图九成是这里没填。填完立刻生效，不用重启。',
  },
  {
    scene: {
      type: 'code',
      title: '也可以直接跟它说',
      lines: [
        '「给我造一个 coffee 的包，先不用找图」',
        '',
        'etude_create { target: "coffee", prepareImages: false }',
        '  → { packId: "7d4076e8a82b4a3d", status: "text",',
        '      summary: "…配图还没人挑，语音还没人试听。" }',
        '',
        'etude_status { }              # 所有包 / 某一条的详情',
        'etude_pack   { packId, export: true }',
      ],
    },
    text: '也可以在会话里直接说：给我造一个 coffee 的包。它调 etude_create。',
  },
  {
    scene: {
      type: 'bullets',
      title: '它不会替你点',
      bullets: [
        '造完的总结会明说：配图还没人挑，语音还没人试听',
        '这不是客套话，是当前状态',
        '插件里刻意没有任何「自动确认」的入口',
      ],
    },
    text: '它造完会明确告诉你：配图还没人挑，语音还没人试听。它不会替你点，插件里也没有自动确认的入口。',
  },
  {
    scene: {
      type: 'outro',
      title: '造包可以批量，点头只能人来',
      subtitle: '文档：docs/GUIDE.md   ·   仓库：github.com/whyao56/dsh-etude',
      pills: ['造例句', '取候选', '你来挑', '打包', '导出'],
    },
    text: '就这样。造包可以批量，点头只能人来。',
  },
]
