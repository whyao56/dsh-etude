/* 演示数据：样式稿要看起来像真的，所以句子、场景、数字都按真实使用写。 */

export const PH = './assets/photos/';
export const photo = (n) => PH + n + '.jpg';

/* 每条例句：谁在说 / 在哪 / 什么时候 / 说完会怎样 */
export const SENTS = [
  {
    ord: 1,
    w: 'abandon',
    q: 'The crew abandoned ship within minutes.',
    scene: '凌晨四点，货轮在雾里开始进水。船长在驾驶台下了最后一道命令，说完所有人都往救生艇跑。',
    zh: '船员几分钟内就弃船了。',
    img: 'p-harbor',
    dur: 3.4,
    sense: '离开、丢下（人或地方）',
    heard: true,
    imgOk: true,
    audioOk: true,
    reg: '书面',
    tags: ['工作职场', '影视对白'],
  },
  {
    ord: 2,
    w: 'abandon',
    q: 'He abandoned the plan the moment it got hard.',
    scene: '周三的项目例会上，有人把上周还在坚持的方案当场撂下。说完，会议室安静了三秒。',
    zh: '方案一难，他就不要了。',
    img: 'p-office',
    dur: 3.1,
    sense: '放弃（想法、计划）',
    heard: false,
    imgOk: true,
    audioOk: true,
    reg: '口语',
    tags: ['工作职场'],
  },
  {
    ord: 3,
    w: 'succumb',
    q: "I'm afraid I succumbed to temptation.",
    scene: '周一上午十点，你把同事桌上的芝士蛋糕拿走了一块。说完，对方笑了一下。',
    zh: '抱歉，我没忍住。',
    img: 'p-coffee',
    dur: 2.9,
    sense: '屈服于（诱惑）',
    heard: true,
    imgOk: true,
    audioOk: true,
    reg: '口语',
    tags: ['日常生活', '餐饮点单'],
  },
  {
    ord: 4,
    w: 'succumb',
    q: 'She succumbed to the flu after a week of overtime.',
    scene: '连着加班一周，周五她没来上班，人事在群里说了这句话。',
    zh: '连轴转一周后，她还是被流感放倒了。',
    img: 'p-subway',
    dur: 3.6,
    sense: '死于、被（病）击倒',
    heard: false,
    imgOk: true,
    audioOk: false,
    reg: '书面',
    tags: ['工作职场', '医疗看病'],
  },
  {
    ord: 5,
    w: 'indispensable',
    q: 'A good pair of shoes is indispensable in this city.',
    scene: '朋友刚搬来，第一天走了两万步。晚上吃饭时他说了这句话。',
    zh: '在这座城市，一双好鞋是少不了的。',
    img: 'p-street',
    dur: 3.3,
    sense: '不可缺少的',
    heard: true,
    imgOk: false,
    audioOk: true,
    reg: '口语',
    tags: ['旅行外出', '购物逛街'],
  },
  {
    ord: 6,
    w: 'indispensable',
    q: 'She made herself indispensable in three months.',
    scene: '季度复盘会上，主管这样评价新来的同事。说完，屋里几个人点了点头。',
    zh: '三个月，她把自己做成了没人能替的那个。',
    img: 'p-office',
    dur: 3.2,
    sense: '不可替代的（人）',
    heard: false,
    imgOk: true,
    audioOk: true,
    reg: '正式',
    tags: ['工作职场'],
  },
  {
    ord: 7,
    w: 'ambiguous',
    q: 'His answer was deliberately ambiguous.',
    scene: '面试结束后，你问 HR 什么时候给结果。对方这样说，说完就起身送客。',
    zh: '他的回答是故意说含糊的。',
    img: 'p-office',
    dur: 3.0,
    sense: '模棱两可的',
    heard: true,
    imgOk: true,
    audioOk: true,
    reg: '书面',
    tags: ['工作职场', '考研'],
  },
  {
    ord: 8,
    w: 'ambiguous',
    q: 'The ending is ambiguous on purpose.',
    scene: '电影散场，灯亮了，同伴问你导演到底想说什么。你这样回他。',
    zh: '那个结尾是故意不讲清楚的。',
    img: 'p-dinner',
    dur: 2.8,
    sense: '（作品）留白的',
    heard: true,
    imgOk: true,
    audioOk: true,
    reg: '口语',
    tags: ['影视对白', '社交寒暄'],
  },
  {
    ord: 9,
    w: 'deteriorate',
    q: 'The weather deteriorated faster than anyone expected.',
    scene: '下了飞机，接机的人指着窗外这样说。说完，他把外套递给你。',
    zh: '天气比谁预料的都坏得快。',
    img: 'p-harbor',
    dur: 3.5,
    sense: '恶化（天气）',
    heard: false,
    imgOk: true,
    audioOk: true,
    reg: '书面',
    tags: ['旅行外出', '新闻'],
  },
  {
    ord: 10,
    w: 'deteriorate',
    q: 'Their relationship deteriorated after the move.',
    scene: '搬家半年后，朋友在电话里轻描淡写地说了这句，然后换了个话题。',
    zh: '搬完家之后，他们的关系就不行了。',
    img: 'p-dinner',
    dur: 3.1,
    sense: '（关系）变坏',
    heard: false,
    imgOk: false,
    audioOk: false,
    reg: '口语',
    tags: ['家庭日常', '社交寒暄'],
  },
  {
    ord: 11,
    w: 'meticulous',
    q: 'He keeps meticulous notes of every experiment.',
    scene: '实验室里，师兄指着柜子里的本子这样介绍新人。说完，抽出一本给你看。',
    zh: '他把每个实验都记得很细。',
    img: 'p-library',
    dur: 3.6,
    sense: '一丝不苟的',
    heard: true,
    imgOk: true,
    audioOk: true,
    reg: '书面',
    tags: ['校园学习', '技术文档'],
  },
  {
    ord: 12,
    w: 'plausible',
    q: "That's a plausible explanation, but I don't buy it.",
    scene: '项目出了事故，有人给了一个听起来很顺的说法。你这样回，说完把日志推过去。',
    zh: '这解释讲得通，但我不信。',
    img: 'p-office',
    dur: 3.9,
    sense: '说得通的',
    heard: true,
    imgOk: true,
    audioOk: true,
    reg: '口语',
    tags: ['工作职场', '播客'],
  },
];

export const WORDS = [
  { w: 'abandon', ipa: '/əˈbændən/', gloss: '丢下；放弃', total: 3, imgs: 3, aud: 3, senses: 2, st: 'done' },
  { w: 'succumb', ipa: '/səˈkʌm/', gloss: '屈服；被…放倒', total: 2, imgs: 2, aud: 2, senses: 1, st: 'part' },
  { w: 'indispensable', ipa: '/ˌɪndɪˈspensəbl/', gloss: '不可缺少的', total: 2, imgs: 1, aud: 2, senses: 1, st: 'part' },
  { w: 'ambiguous', ipa: '/æmˈbɪɡjuəs/', gloss: '模棱两可的', total: 2, imgs: 2, aud: 2, senses: 1, st: 'done' },
  { w: 'deteriorate', ipa: '/dɪˈtɪəriəreɪt/', gloss: '恶化', total: 2, imgs: 1, aud: 1, senses: 1, st: 'part' },
  { w: 'meticulous', ipa: '/məˈtɪkjələs/', gloss: '一丝不苟的', total: 1, imgs: 1, aud: 1, senses: 1, st: 'done' },
  { w: 'plausible', ipa: '/ˈplɔːzəbl/', gloss: '说得通的', total: 1, imgs: 1, aud: 1, senses: 1, st: 'done' },
];

export const DECKS = [
  { name: '测试牌组', sample: true, dep: 0, open: true, neu: 4, learn: 2, due: 12, all: 18 },
  { name: 'abandon', dep: 1, neu: 0, learn: 0, due: 3, all: 3 },
  { name: 'succumb', dep: 1, neu: 0, learn: 0, due: 2, all: 2 },
  { name: '影视对白', dep: 0, neu: 18, learn: 6, due: 34, all: 96 },
  { name: '职场英语', dep: 0, neu: 22, learn: 9, due: 21, all: 128 },
  { name: '日常口语', dep: 0, neu: 11, learn: 4, due: 8, all: 52 },
  { name: '学术写作', dep: 0, neu: 6, learn: 2, due: 0, all: 41 },
];

export const TODAY = {
  reviews: 42,
  minutes: 11,
  from: '08:40',
  to: '21:50',
  streak: 19,
  due: 12,
  hours: [0, 0, 0, 0, 0, 1, 3, 0, 0, 6, 0, 0, 2, 0, 0, 0, 0, 0, 4, 7, 9, 8, 1, 1],
};

export const FORECAST = [
  ...Array.from({ length: 30 }, (_, i) => {
    const base = [14, 11, 8, 5, 3, 6, 9, 12, 7, 4, 2, 3, 6, 10, 13, 9, 5, 3, 2, 4, 7, 9, 6, 4, 3, 2, 4, 6, 5, 3][i];
    return { day: i + 1, neu: Math.round(base * 0.35), learn: Math.round(base * 0.25), due: Math.round(base * 0.4) };
  }),
];

export const RETENTION = [62, 68, 71, 74, 73, 76, 79, 78, 81, 83, 82, 84, 85, 84, 86, 87, 86, 88, 89, 88, 90, 89, 91, 90, 91, 92, 91, 92, 93, 92];

export const EASE = [
  { v: '1.3', n: 2 },
  { v: '1.7', n: 5 },
  { v: '2.1', n: 9 },
  { v: '2.5', n: 14 },
  { v: '2.7', n: 18 },
  { v: '3.0', n: 11 },
  { v: '3.4', n: 6 },
  { v: '3.9', n: 2 },
];

export const CARD_STATE = [
  { t: '没过', v: 12, c: '#a7bdf6' },
  { t: '学习中', v: 46, c: 'rgba(167,189,246,.55)' },
  { t: '待复习', v: 128, c: 'rgba(167,189,246,.28)' },
  { t: '新卡', v: 54, c: 'rgba(255,255,255,.16)' },
];

/* 26 周 × 7 = 182 格，0–4 */
export const HEAT = Array.from({ length: 182 }, (_, i) => {
  const s = (i * 2654435761) % 100;
  if (i > 168) return s % 7 === 0 ? 2 : 0;
  if (s < 26) return 0;
  if (s < 52) return 1;
  if (s < 74) return 2;
  if (s < 90) return 3;
  return 4;
});

export const VOICES = [
  { v: 'en-US-AvaMultilingualNeural', t: 'Ava · 美音 · 女', tag: '默认' },
  { v: 'en-US-AndrewMultilingualNeural', t: 'Andrew · 美音 · 男' },
  { v: 'en-GB-SoniaNeural', t: 'Sonia · 英音 · 女' },
  { v: 'en-GB-RyanNeural', t: 'Ryan · 英音 · 男' },
];
