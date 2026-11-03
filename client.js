/**
 * dsh-etude — Client half（由 scripts/build-client.mjs 生成，别直接改）
 *
 * 源在 src/NN-*.js，按文件名顺序拼；样式取 design/app.css，转成 shadow root 可用的形式。
 * 生成时间 2026-11-03T04:39:35.270Z
 */
window.__ModuleLoader__.load({
  id: 'dsh-etude',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    const React = require('react')
    const { useState, useEffect, useMemo, useRef, useCallback } = React

    const NS = 'dsh-etude'
    const CONFIG_NS = 'etude'

    /** design/app.css，:root 已换成 :host */
    const __CSS__ = "/* 卡片工厂-测试 · 样式稿\n   配色与材质参照 dsh-Go 的「雾蓝玻璃 Mist Glass」：\n   深海石板底 + 竖向渐变 + 两团极淡的光 + 白 5% 玻璃卡。\n   70% 中性面 / 25% 文字细线 / ≤5% 强调色。 */\n\n:host{\n  /* 深色石板底（不是纯黑） */\n  --bg-top:#1D222C;\n  --bg-bottom:#1B1C23;\n  --lowest:#14171E;\n  --night:#1C1F28;\n  --low:#232730;\n  --cont:#272C36;\n  --high:#2D323C;\n  --highest:#343944;\n\n  /* 文字：雾白，不是纯白 */\n  --fg:#E6E9F0;\n  --fg2:#B6BBC5;\n  --fg3:#9A9EA9;\n  --ghost:#656971;\n\n  /* 细线与边界 */\n  --line:#343841;\n  --outline:#737781;\n\n  /* 强调：雾蓝（seedDark），5% 原则 */\n  --accent:#97B1F0;\n  --on-accent:#121C34;\n  --accent-cont:#2E3C5F;\n  --on-accent-cont:#D8E1F6;\n\n  /* 语义色 */\n  --dusk:#BEAEDE;\n  --dusk-cont:#3E3451;\n  --danger:#E69089;\n  --danger-cont:#542C29;\n  --ok:#97B1F0;\n  --warn:#BEAEDE;\n  --bad:#E69089;\n  --idle:#4A4F5A;\n\n  /* 玻璃 */\n  --glass:rgba(var(--w),.072);\n  --glass-2:rgba(var(--w),.092);\n  --glass-line:rgba(var(--w),.085);\n  --rim:rgba(var(--w),.10);\n\n  --sans:\"MiSans\",\"HarmonyOS Sans SC\",\"PingFang SC\",\"Microsoft YaHei\",system-ui,-apple-system,\"Segoe UI\",sans-serif;\n  --mono:\"JetBrains Mono\",\"Cascadia Mono\",Consolas,monospace;\n\n  --r-xs:6px; --r-sm:10px; --r-md:14px; --r-lg:20px; --r-xl:28px;\n\n  /* 交互用：叠加色通道、浮层表面、光晕、阅读字号、界面缩放 */\n  --w:255,255,255;            /* 往面板上加的白色 */\n  --accent-rgb:151,177,240;   /* 强调色的通道，跟着配色走 */\n  --shadow:3,6,13;            /* 阴影用的黑 */\n  --fg-strong:#FFFFFF;\n  --surface-float:#252A35;    /* 查词卡、下拉 */\n  --surface-sheet:#20242D;    /* 抽屉 */\n  --glow-1:rgba(81,103,157,.28);\n  --glow-2:rgba(81,71,101,.24);\n  --read-scale:1;\n  --zoom:1;\n}\n\n/* 浅色：晨雾蓝。中性面翻过来，强调色用房 dsh-Go 的浅色 seed */\n:host([data-theme=\"light\"]){\n  --bg-top:#EDF2FE;\n  --bg-bottom:#F6F7FC;\n  --lowest:#FFFFFF;\n  --night:#F7F9FD;\n  --low:#EEF2FA;\n  --cont:#E8EEF9;\n  --high:#DDE5F2;\n  --highest:#D2DAEA;\n\n  --fg:#1B2130;\n  --fg2:#4A515F;\n  --fg3:#767D8B;\n  --ghost:#A0A6B2;\n\n  --line:#D7DDEA;\n  --outline:#B4BCCA;\n\n  --accent:#4B67B4;\n  --on-accent:#FFFFFF;\n  --accent-cont:#DCE4F8;\n  --on-accent-cont:#2A3550;\n\n  --dusk:#726291;\n  --dusk-cont:#E4DEF1;\n  --danger:#B4544C;\n  --danger-cont:#F6E2E0;\n  --ok:#3F5EA8;\n  --warn:#6B5C8C;\n  --bad:#B4544C;\n  --idle:#C6CCD8;\n\n  --glass:rgba(255,255,255,.74);\n  --glass-2:rgba(255,255,255,.9);\n  --glass-line:rgba(24,34,54,.09);\n  --rim:rgba(255,255,255,.9);\n\n  --w:24,34,54;\n  --accent-rgb:75,103,180;\n  --shadow:96,116,156;\n  --fg-strong:#0C1017;\n  --surface-float:#FFFFFF;\n  --surface-sheet:#FFFFFF;\n\n  color-scheme:light;\n}\n\n*{box-sizing:border-box}\n:host{margin:0;padding:0}\nbody{\n  font-family:var(--sans);\n  font-size:14px;line-height:1.55;\n  color:var(--fg2);\n  -webkit-font-smoothing:antialiased;\n  background:var(--bg-bottom);\n  min-height:100vh;\n}\n/* 全屏背景：竖向渐变 + 右上主色光 + 左下暮紫光。同一套页面共用，不随 tab 变 */\nbody::before{\n  content:\"\";position:fixed;inset:0;z-index:-1;pointer-events:none;\n  background:\n    radial-gradient(760px 520px at 88% -6%, var(--glow-1), transparent 62%),\n    radial-gradient(680px 560px at -8% 104%, var(--glow-2), transparent 60%),\n    linear-gradient(180deg,var(--bg-top),var(--bg-bottom));\n}\na{color:var(--accent);text-decoration:none}\nh1,h2,h3{margin:0;color:var(--fg);font-weight:600}\nh1{font-size:22px;line-height:1.3;letter-spacing:-.01em}\np{margin:0}\nu{text-decoration:none;box-shadow:inset 0 -1.5px 0 rgba(var(--accent-rgb),.55)}\n\n.page{\n  max-width:1160px;margin:0 auto;zoom:var(--zoom);padding:14px 26px 0;\n  display:flex;flex-direction:column;min-height:100vh;\n  animation:page-in .4s cubic-bezier(.22,.61,.36,1) both;\n}\n@keyframes page-in{\n  from{opacity:0;transform:translateY(10px) scale(.992)}\n  to{opacity:1;transform:translateY(0) scale(1)}\n}\n.screen.fill,.screen:has(>.strip){min-height:calc(100vh - 96px);display:flex;flex-direction:column}\n.screen{display:flex;flex-direction:column;gap:22px;padding:8px 0 44px;width:100%;margin:0 auto}\n.screen.half{max-width:980px;min-height:calc(100vh - 92px)}\n\n/* ── 顶栏：品牌胶囊 + 分段导航 + 圆钮 ───────────────── */\n.topbar{position:relative;display:flex;align-items:center;gap:14px;padding:6px 0 18px}\n.brand{\n  display:flex;align-items:center;gap:10px;padding:7px 16px 7px 8px;\n  background:var(--glass);border:1px solid var(--glass-line);border-radius:999px;\n  box-shadow:inset 0 1px 0 var(--rim);\n}\n.brand .mark{\n  width:30px;height:30px;border-radius:10px;display:grid;place-items:center;\n  background:var(--accent-cont);color:var(--on-accent-cont);font-size:13px;font-weight:600;\n}\n.brand b{display:block;color:var(--fg);font-size:14px;font-weight:600;line-height:1.25}\n.brand s{display:block;text-decoration:none;color:var(--ghost);font-size:11px;line-height:1.35}\n\n.tabs{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;gap:2px;padding:4px;background:var(--glass);border:1px solid var(--glass-line);border-radius:999px;margin:0}\n.tabs a{\n  padding:7px 16px;border-radius:999px;font-size:13px;font-weight:600;color:var(--fg3);\n  transition:background .15s,color .15s;\n}\n.tabs a:hover{color:var(--fg2)}\n.tabs a.on{background:rgba(var(--accent-rgb),.16);color:var(--accent)}\n\n.iconbtn{\n  width:38px;height:38px;border-radius:999px;display:grid;place-items:center;\n  background:var(--glass);border:1px solid var(--glass-line);color:var(--fg3);\n  box-shadow:inset 0 1px 0 var(--rim);\n}\n.iconbtn:hover{color:var(--fg2)}\n.iconbtn.on{color:var(--accent);background:rgba(var(--accent-rgb),.16);border-color:rgba(var(--accent-rgb),.2)}\n.iconbtn svg,.tabs svg{width:17px;height:17px;stroke:currentColor;fill:none;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}\n\n/* ── 页头 ────────────────────────────────────────── */\n.hdr{display:flex;align-items:flex-end;gap:16px;padding-top:6px}\n.hdr .sub{color:var(--ghost);font-size:12px;margin-top:6px}\n.hdr .act{display:flex;gap:10px;margin-left:auto;align-items:center}\n\n/* ── 按钮 ────────────────────────────────────────── */\n.btn{\n  font-family:inherit;font-size:13.5px;font-weight:600;color:var(--fg2);\n  background:var(--glass-2);border:1px solid var(--glass-line);border-radius:999px;\n  padding:9px 18px;cursor:pointer;box-shadow:inset 0 1px 0 var(--rim);\n  transition:background .15s,color .15s,opacity .15s,transform .12s,box-shadow .15s;\n}\n.btn:hover{background:rgba(var(--w),.1);color:var(--fg);transform:translateY(-1px)}\n.btn:active{transform:translateY(0);box-shadow:inset 0 1px 2px rgba(var(--shadow),.2)}\n.btn.ghost{background:transparent;box-shadow:none;color:var(--fg3)}\n.btn.ghost:hover{background:var(--glass);color:var(--fg2)}\n.btn.ghost:active{transform:translateY(0)}\n.btn.primary{\n  background:linear-gradient(135deg, #A8BEF4 0%, var(--accent) 100%);\n  color:var(--on-accent);border-color:transparent;\n  box-shadow:inset 0 1px 0 rgba(255,255,255,.2), 0 8px 22px rgba(var(--shadow),.4), 0 2px 6px rgba(var(--accent-rgb),.4);\n}\n.btn.primary:hover{\n  background:linear-gradient(135deg, #B5C9F6 0%, #AAC0F4 100%);\n  transform:translateY(-2px);\n  box-shadow:inset 0 1px 0 rgba(255,255,255,.25), 0 12px 28px rgba(var(--shadow),.45), 0 4px 10px rgba(var(--accent-rgb),.5);\n}\n.btn.primary:active{\n  transform:translateY(0);\n  background:linear-gradient(135deg, #9AB4F0 0%, #8AAAE8 100%);\n  box-shadow:inset 0 1px 2px rgba(0,0,0,.1), 0 4px 12px rgba(var(--shadow),.35);\n}\n.btn.wide{width:100%;padding:13px 18px;font-size:14px}\n\n/* ── 卡：白 5% 玻璃 + 发丝边 ───────────────────────── */\n.card{\n  background:var(--glass);border:1px solid var(--glass-line);border-radius:var(--r-lg);\n  padding:18px 20px;box-shadow:inset 0 1px 0 rgba(var(--w),.06);\n  transition:transform .2s ease, box-shadow .2s ease;\n}\n.card:hover{transform:translateY(-1px);box-shadow:inset 0 1px 0 rgba(var(--w),.06), 0 4px 16px rgba(var(--shadow),.12)}\n.card.focus{border-radius:var(--r-xl);padding:24px 26px;display:flex;flex-direction:column;gap:16px}\n.grid2{display:grid;grid-template-columns:1.45fr 1fr;gap:16px;align-items:start}\n.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}\n.split{display:grid;grid-template-columns:290px 1fr;gap:16px;align-items:start}\n.row{display:flex;align-items:center;gap:8px}\n.col{display:flex;flex-direction:column;gap:2px}\n.sp{flex:1}\n.divider{height:1px;background:var(--line);margin:6px 0}\n\n/* 分区小标题：12/600 + 字距，替代粗分割线 */\n.eyebrow,.tag{\n  font-size:12px;font-weight:600;letter-spacing:.5px;color:var(--ghost);\n  display:inline-flex;align-items:center;gap:6px;\n}\n.tag.hot{color:var(--accent)}\n.tag.ok{color:var(--ok)}\n.tag.bad{color:var(--bad)}\n.sec-title{font-size:13px;font-weight:600;color:var(--fg2);letter-spacing:.2px}\n\n.mut{color:var(--ghost);font-size:12px;line-height:1.5}\n.en{font-family:var(--sans);color:var(--fg);font-weight:400}\n\n/* ── chip / pill ─────────────────────────────────── */\n.chips{display:flex;gap:8px;flex-wrap:wrap}\n.chip{\n  display:inline-flex;align-items:center;gap:6px;\n  font-size:11.5px;font-weight:600;letter-spacing:.2px;\n  padding:4px 10px;border-radius:999px;color:var(--fg3);\n  background:rgba(var(--w),.06);border:1px solid rgba(var(--w),.1);\n  white-space:nowrap;\n  box-shadow:inset 0 0.5px 0 rgba(var(--w),.05);\n  transition:all .15s ease;\n  cursor:default;\n}\n.chip:hover{background:rgba(var(--w),.09);border-color:rgba(var(--w),.14)}\n.chip.on{\n  background:linear-gradient(135deg, rgba(var(--accent-rgb),.16), rgba(var(--accent-rgb),.12));\n  color:var(--accent);\n  border-color:rgba(var(--accent-rgb),.28);\n  cursor:pointer;\n  box-shadow:inset 0 0.5px 0 rgba(255,255,255,.1);\n}\n.chip.on:hover{transform:translateY(-1px);box-shadow:inset 0 0.5px 0 rgba(255,255,255,.1), 0 2px 4px rgba(var(--accent-rgb),.15)}\n.chip.accent{\n  background:linear-gradient(135deg, rgba(var(--accent-rgb),.16), rgba(var(--accent-rgb),.12));\n  color:var(--accent);\n  border-color:rgba(var(--accent-rgb),.28);\n  box-shadow:inset 0 0.5px 0 rgba(255,255,255,.08);\n}\n.chip.accent:hover{background:linear-gradient(135deg, rgba(var(--accent-rgb),.22), rgba(var(--accent-rgb),.16))}\n.chip.bad{\n  background:linear-gradient(135deg, rgba(230,144,137,.14), rgba(230,144,137,.10));\n  color:#E38A80;\n  border-color:rgba(230,144,137,.24);\n  box-shadow:inset 0 0.5px 0 rgba(255,255,255,.08);\n}\n.chip.ok{\n  background:linear-gradient(135deg, rgba(130,194,130,.16), rgba(107,183,107,.12));\n  color:#6BB76B;\n  border-color:rgba(107,183,107,.28);\n  box-shadow:inset 0 0.5px 0 rgba(255,255,255,.08);\n}\n\n/* ── 今天 ────────────────────────────────────────── */\n.word{font-size:30px;font-weight:300;line-height:1.2;letter-spacing:-.015em;color:var(--fg)}\n.qline{font-size:18px;line-height:1.5;color:var(--fg);letter-spacing:-.005em}\n.faces{display:flex;gap:18px}\n.face{display:flex;align-items:center;gap:6px;font-size:11.5px;color:var(--ghost)}\n\n/* 统一的状态小点样式（卡片页 + 工厂页共用） */\n.pip{\n  display:inline-block;\n  width:10px;height:10px;\n  border-radius:50%;\n  background:linear-gradient(135deg, rgba(var(--w),.22), rgba(var(--w),.12));\n  box-shadow:inset 0 0.5px 1px rgba(255,255,255,.15), 0 1px 2px rgba(0,0,0,.15);\n  position:relative;\n}\n.pip.ok{\n  background:linear-gradient(135deg, #82C282, #6BB76B);\n  box-shadow:inset 0 0.5px 1px rgba(255,255,255,.3), 0 1px 2px rgba(107,183,107,.25);\n}\n.pip.warn{\n  background:linear-gradient(135deg, #E0BA6E, #D4A558);\n  box-shadow:inset 0 0.5px 1px rgba(255,255,255,.3), 0 1px 2px rgba(212,165,88,.25);\n}\n.pip.bad{\n  background:linear-gradient(135deg, #E38A80, #D86E62);\n  box-shadow:inset 0 0.5px 1px rgba(255,255,255,.3), 0 1px 2px rgba(216,110,98,.25);\n}\n.pip.now{\n  background:linear-gradient(135deg, #AAC3F5, var(--accent));\n  box-shadow:inset 0 0.5px 1px rgba(255,255,255,.35), 0 0 0 2px rgba(var(--accent-rgb),.25), 0 2px 4px rgba(var(--accent-rgb),.2);\n  animation:pip-pulse 2s ease-in-out infinite;\n}\n@keyframes pip-pulse{\n  0%, 100%{transform:scale(1)}\n  50%{transform:scale(1.08)}\n}\n\n/* 一周：细竖条 + 小字，不是图表 */\n.days{display:flex;gap:12px;align-items:flex-end;height:46px}\n.days .d{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end}\n.days .bar{width:100%;max-width:7px;border-radius:99px;background:rgba(var(--w),.13)}\n.days .bar.on{background:rgba(var(--accent-rgb),.62)}\n.days .d span{font-size:10.5px;color:var(--ghost);line-height:1}\n.num{font-size:22px;font-weight:300;color:var(--fg);line-height:1.1}\n.numlab{font-size:11px;color:var(--ghost);margin-top:3px}\n\n.qitem{display:flex;align-items:center;gap:10px;padding:9px 0;font-size:13.5px}\n.qitem+.qitem{border-top:1px solid var(--line)}\n.qitem .en{font-size:14.5px}\n\n/* ── 练：进度条 + 舞台 + 底部动作条 ───────────────── */\n.strip{display:flex;align-items:center;gap:14px;padding:14px 0 10px}\n.strip .crumb{font-size:11.5px;color:var(--ghost);display:flex;gap:8px;align-items:center;white-space:nowrap}\n.track{flex:1;height:2px;border-radius:99px;background:rgba(var(--w),.1);overflow:hidden}\n.track i{display:block;height:100%;border-radius:99px;background:var(--accent)}\n\n.stage{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;padding:24px 0 10px;text-align:center}\n.stage .tag{align-self:center}\n.cue{font-size:20px;line-height:1.6;font-weight:400;color:var(--fg);max-width:720px}\n.hint{font-size:12.5px;color:var(--ghost);max-width:560px;line-height:1.6}\n\n.defn{border-left:2px solid var(--accent-cont);padding:2px 0 2px 16px;text-align:left}\n.defn .lab{font-size:11px;font-weight:600;letter-spacing:.8px;color:var(--accent);display:block;margin-bottom:6px}\n.defn p{font-size:15px;line-height:1.6;color:var(--fg2)}\n\n.typebox{\n  width:100%;max-width:760px;min-height:62px;display:flex;align-items:center;\n  padding:16px 20px;font-size:20px;line-height:1.5;color:var(--fg);\n  background:var(--glass);border:1px solid rgba(var(--accent-rgb),.35);border-radius:var(--r-md);\n  box-shadow:inset 0 1px 0 var(--rim);text-align:left;\n}\n.caret{\n  width:0;height:0;display:inline-block;\n  border-top:5.5px solid transparent;border-bottom:5.5px solid transparent;\n  border-left:7px solid var(--fg3);margin-right:3px;transition:transform .18s ease;\n}\n.caret.open{border-left:0;border-top:7px solid var(--fg3);transform:translateY(1px)}.gear svg{stroke:currentColor;fill:none;stroke-width:1.3;stroke-linecap:round;opacity:.85}\n.dnum{text-align:center;font-variant-numeric:tabular-nums;font-size:12.5px;color:var(--fg2)}\n.drow > .dnum:nth-child(2){color:var(--s-blue)}\n.dnum.learn{color:var(--s-amber)}\n.dnum.due{color:var(--s-green);font-weight:600}\n.dgear{text-align:center}\n.gear{\n  width:26px;height:26px;border-radius:50%;border:1px solid transparent;background:transparent;\n  color:var(--fg3);cursor:pointer;line-height:1;display:inline-flex;align-items:center;justify-content:center;\n}\n.gear:hover{background:rgba(var(--w),.08);border-color:var(--line);color:var(--fg)}\n.deckfoot{display:flex;align-items:center;justify-content:center;gap:10px;padding:2px 2px 8px}\n.deckhint{text-align:center;font-size:11.5px;color:var(--fg3);margin-top:-2px}\n.chip.live{display:inline-flex;align-items:center;gap:7px;color:var(--fg2)}\n.chip.live i{width:7px;height:7px;border-radius:50%;background:var(--s-green);box-shadow:0 0 0 3px rgba(87,199,123,.18)}\n@media print{.deckfoot{display:none}}\n\n/* ── 卡片：照 Anki 的牌组列表 ─────────────────────── */\n.deckcard{padding:0;overflow:hidden}\n.deckhead,.drow{\n  display:grid;grid-template-columns:minmax(0,1fr) 74px 74px 74px 34px;\n  align-items:center;gap:6px;padding:7px 14px;\n}\n.deckhead{padding:7px 14px;border-bottom:1px solid var(--line)}\n.deckhead .dname{font-size:10.5px;letter-spacing:.06em;color:var(--fg3)}\n.deckhead > span{font-size:10.5px;letter-spacing:.06em;color:var(--fg3)}\n.deckhead .dnum{text-align:center}\n.deckhead .dgear{text-align:center}\n.drow+.drow{border-top:1px solid rgba(var(--w),.05)}\n.drow:hover{background:rgba(var(--w),.03)}\n.drow .dname{display:flex;align-items:center;gap:7px;min-width:0;color:var(--fg);font-size:12.5px}\n.drow.child .dname{color:var(--fg2);font-size:12px}\n.drow .dname a{color:inherit;text-decoration:none;border-bottom:1px solid transparent}\n.drow .dname a:hover{border-bottom-color:rgba(var(--w),.3)}\n.drow .dname .mut{font-size:11px}\n.caret{\n  width:0;height:0;display:inline-block;flex:0 0 auto;\n  border-top:5.5px solid transparent;border-bottom:5.5px solid transparent;\n  border-left:7px solid var(--fg3);margin-right:3px;transition:transform .18s ease;\n}\n.caret.open{border-left:5.5px solid transparent;border-right:5.5px solid transparent;border-top:7px solid var(--fg3);border-bottom:0;transform:translateY(1px)}\n.dnum{text-align:center;font-variant-numeric:tabular-nums;font-size:12.5px;color:var(--fg2)}\n.drow > .dnum:nth-child(2){color:var(--s-blue)}\n.dnum.learn{color:var(--s-amber)}\n.dnum.due{color:var(--s-green);font-weight:600}\n.dgear{text-align:center}\n.gear{\n  width:26px;height:26px;border-radius:50%;border:1px solid transparent;background:transparent;\n  color:var(--fg3);cursor:pointer;line-height:1;display:inline-flex;align-items:center;justify-content:center;\n}\n.gear:hover{background:rgba(var(--w),.08);border-color:var(--line);color:var(--fg)}\n.gear svg{stroke:currentColor;fill:none;stroke-width:1.3;stroke-linecap:round;opacity:.85}\n.deckfoot{display:flex;align-items:center;justify-content:center;gap:10px;padding:2px 2px 8px}\n.deckhint{text-align:center;font-size:11.5px;color:var(--fg3);margin-top:-2px}\n.chip.live{display:inline-flex;align-items:center;gap:7px;color:var(--fg2)}\n.chip.live i{width:7px;height:7px;border-radius:50%;background:var(--s-green);box-shadow:0 0 0 3px rgba(87,199,123,.18)}\n@media print{.deckfoot{display:none}}\n\n/* ═══════════════════════════════════════════════════════════\n   重写：这一批样式在之前的行号切块里被误删，按设计稿补回来。\n   顺序：顶栏零件 → 菜单 → 设置 → 弹窗 → 统计图表 → 引导 →\n        快捷键 → 搜索层 → 气泡/液面\n   ═══════════════════════════════════════════════════════════ */\n\n/* 顶栏左右两块 */\n.tb-left,.tb-right{display:flex;align-items:center;gap:10px;min-width:0}\n.tb-right{margin-left:auto}\n.tbtn{\n  display:inline-flex;align-items:center;gap:8px;padding:8px 15px;border-radius:999px;cursor:pointer;\n  background:var(--glass);border:1px solid var(--glass-line);color:var(--fg2);font-size:13px;font-weight:600;\n  box-shadow:inset 0 1px 0 var(--rim);list-style:none;user-select:none;\n}\n.tbtn::-webkit-details-marker{display:none}\n.tbtn:hover{color:var(--fg);border-color:rgba(var(--w),.14)}\n.tbtn svg{width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}\n\n/* 插件下拉 */\n.menu{position:relative}\n.menu[open] .tbtn{color:var(--fg);background:rgba(var(--w),.09)}\n.menu-list{\n  position:absolute;top:calc(100% + 8px);left:0;min-width:232px;padding:6px;z-index:60;\n  display:flex;flex-direction:column;gap:1px;border-radius:var(--r-md);\n  background:var(--surface-float);border:1px solid rgba(var(--w),.12);\n  box-shadow:0 22px 46px rgba(var(--shadow),.55);animation:pop .16s ease-out;\n}\n@keyframes pop{from{opacity:0;transform:translateY(-4px) scale(.99)}to{opacity:1;transform:none}}\n.mi{\n  display:flex;align-items:center;gap:9px;padding:9px 11px;border-radius:9px;\n  font-size:13px;color:var(--fg2);cursor:pointer;list-style:none;white-space:nowrap;\n}\n.mi::-webkit-details-marker{display:none}\n.mi:hover{background:rgba(var(--w),.07);color:var(--fg);padding-left:14px}\n.mi .ext,.mi .mut{margin-left:auto;font-size:11.5px;color:var(--fg3)}\n.msep{height:1px;background:rgba(var(--w),.08);margin:5px 8px}\n.sub{position:relative}\n.sub[open]>.menu-list{top:-6px;left:100%;margin-left:8px}\n.sub[open]>.mi{background:rgba(var(--w),.07);color:var(--fg)}\n.chev::after{content:\"›\";margin-left:auto;color:var(--fg3);font-size:14px}\n\n/* 设置页 */\n.setwrap{display:grid;grid-template-columns:190px minmax(0,1fr);gap:26px;align-items:start}\n.setnav{position:sticky;top:14px;display:flex;flex-direction:column;gap:2px;padding:6px 0}\n.setnav .glab{\n  font-size:11px;letter-spacing:.12em;color:var(--fg3);padding:14px 12px 6px;\n}\n.setnav .glab:first-child{padding-top:4px}\n.setnav a{\n  position:relative;display:block;padding:8px 12px;border-radius:9px;font-size:13px;\n  color:var(--fg2);text-decoration:none;transition:background .14s,color .14s;\n}\n.setnav a:hover{background:rgba(var(--w),.05);color:var(--fg)}\n.setnav a.on{background:rgba(var(--accent-rgb),.14);color:var(--accent);font-weight:600}\n.setnav a.on::before{\n  content:\"\";position:absolute;left:0;top:9px;bottom:9px;width:2px;border-radius:2px;background:var(--accent);\n}\n.setnav .glab + a{margin-top:0}\n.setbody{display:flex;flex-direction:column;gap:18px;min-width:0}\n.setsec{color:var(--fg3)}\n.group{\n  background:var(--glass);border:1px solid var(--glass-line);border-radius:var(--r-lg);\n  padding:18px 20px;box-shadow:inset 0 1px 0 var(--rim);\n}\n.setbody .group{display:none}\n.setbody .group.on{display:block;animation:rise .28s ease-out}\n.ghead{display:flex;align-items:baseline;gap:12px;margin-bottom:6px}\n.ghead h2{font-size:15px;font-weight:600}\n.ghead .mut{margin-left:auto;font-size:11.5px}\n.field{\n  display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:center;\n  padding:13px 0;border-top:1px solid rgba(var(--w),.05);\n}\n.field:first-of-type{border-top:0}\n.field .lab{font-size:13.5px;color:var(--fg);font-weight:600}\n.field .desc{font-size:12px;line-height:1.55;color:var(--fg3);margin-top:4px;max-width:60ch}\n.field .ctl{justify-self:end;display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}\n.inp{\n  display:inline-flex;align-items:center;padding:8px 12px;border-radius:10px;font-size:12.5px;\n  background:rgba(var(--w),.05);border:1px solid var(--line);color:var(--fg2);\n  max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;\n}\n.inp.wide{min-width:260px}\n.inp:focus{outline:none;border-color:rgba(var(--accent-rgb),.5)}\n.badge-ok{color:var(--s-green);font-size:12px;display:inline-flex;align-items:center;gap:6px}\n.badge-ok::before{content:\"\";width:6px;height:6px;border-radius:50%;background:var(--s-green);box-shadow:0 0 0 3px rgba(87,199,123,.16)}\n\n/* 分段控件 / 开关 / 色板 / 步进 */\n.seg{\n  display:inline-flex;align-items:center;gap:2px;padding:3px;border-radius:999px;\n  background:rgba(var(--w),.05);border:1px solid rgba(var(--w),.1);\n  box-shadow:inset 0 0.5px 0 rgba(var(--w),.05);\n}\n.seg span{\n  padding:6px 14px;border-radius:999px;font-size:12.5px;color:var(--fg3);cursor:pointer;\n  transition:all .16s ease;white-space:nowrap;font-weight:500;\n}\n.seg span:hover{color:var(--fg2);background:rgba(var(--w),.04)}\n.seg span.on{\n  background:linear-gradient(135deg, rgba(var(--accent-rgb),.22), rgba(var(--accent-rgb),.14));\n  color:var(--accent);font-weight:600;\n  box-shadow:inset 0 0.5px 0 rgba(255,255,255,.12), 0 1px 3px rgba(var(--accent-rgb),.18);\n}\n.seg span.off{color:var(--ghost);cursor:default}\n.seg.small span{padding:5px 11px;font-size:11.5px}\n\n/* 统计页用的 checkbox 标签 */\n.ck{\n  display:inline-flex;align-items:center;gap:7px;padding:5px 11px 5px 9px;border-radius:999px;\n  background:rgba(var(--w),.05);border:1px solid rgba(var(--w),.1);\n  font-size:12px;color:var(--fg3);cursor:pointer;user-select:none;\n  transition:all .16s ease;box-shadow:inset 0 0.5px 0 rgba(var(--w),.04);\n}\n.ck:hover{background:rgba(var(--w),.08);border-color:rgba(var(--w),.16);color:var(--fg2)}\n.ck input{\n  appearance:none;-webkit-appearance:none;width:15px;height:15px;border-radius:4px;\n  border:1.5px solid rgba(var(--w),.25);background:transparent;cursor:pointer;\n  transition:all .16s ease;display:grid;place-items:center;margin:0;\n}\n.ck input:hover{border-color:rgba(var(--accent-rgb),.5)}\n.ck input:checked{\n  background:linear-gradient(135deg, var(--accent), #8AAAE8);\n  border-color:transparent;\n  box-shadow:inset 0 0.5px 1px rgba(255,255,255,.25);\n}\n.ck input:checked::after{\n  content:\"\";width:8px;height:5px;border-left:2px solid var(--on-accent);border-bottom:2px solid var(--on-accent);\n  transform:translateY(-1px) rotate(-45deg);\n}\n.ck input:checked ~ span{color:var(--fg2)}\n.sw{\n  display:inline-block;width:34px;height:19px;border-radius:999px;background:rgba(var(--w),.12);\n  position:relative;cursor:pointer;transition:background .18s;\n}\n.sw i{position:absolute;top:2px;left:2px;width:15px;height:15px;border-radius:50%;background:#fff;transition:transform .18s}\n.sw.on{background:var(--accent)}\n.sw.on i{transform:translateX(15px)}\n.swatches{display:flex;align-items:center;gap:10px}\n.sw2{position:relative;display:inline-flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;font-size:10.5px;color:var(--fg3)}\n.sw2 i{width:22px;height:22px;border-radius:50%;display:block;box-shadow:inset 0 0 0 1px rgba(var(--w),.18)}\n.sw2 input{position:absolute;opacity:0;width:22px;height:22px;cursor:pointer}\n.sw2.on i{box-shadow:0 0 0 2px var(--bg-bottom),0 0 0 3.5px var(--accent)}\n.sw2.on span{color:var(--fg)}\n.stepper{display:inline-flex;align-items:center;gap:12px;padding:4px;border-radius:999px;background:rgba(var(--w),.04);border:1px solid var(--line)}\n.stepper button{width:24px;height:24px;border-radius:50%;border:0;background:rgba(var(--w),.06);color:var(--fg2);cursor:pointer;line-height:1}\n.stepper button:hover{background:rgba(var(--w),.12);color:var(--fg)}\n.stepper span{font-size:12.5px;min-width:44px;text-align:center;font-variant-numeric:tabular-nums}\n\n/* 折叠行（点开是小窗的那种） */\n.folds{display:flex;flex-direction:column}\n.foldrow{\n  display:flex;align-items:center;gap:10px;width:100%;padding:14px 2px;background:none;border:0;\n  border-top:1px solid rgba(var(--w),.05);color:var(--fg);font:inherit;font-size:13.5px;cursor:pointer;text-align:left;\n}\n.foldrow:hover{color:var(--accent)}\n.foldrow .fsum{margin-left:auto;font-size:12px;color:var(--fg3)}\n.foldrow .chev-i{color:var(--fg3);font-size:14px;margin-left:10px}\n.foldrow:hover .fsum{color:var(--fg2)}\n.fprev{\n  margin-top:10px;padding:14px 16px;border-radius:12px;border:1px dashed rgba(var(--w),.14);\n  display:flex;flex-direction:column;gap:6px;\n}\n.fprev .en1{font-size:calc(17px * var(--read-scale));color:var(--fg)}\n.fprev .zh1{font-size:calc(13px * var(--read-scale));color:var(--fg2)}\n.picker{display:inline-flex;align-items:center;gap:8px}\n.picker input[type=\"color\"]{\n  width:26px;height:26px;padding:0;border:1px solid var(--line);border-radius:8px;background:transparent;cursor:pointer;\n}\n\n/* 弹窗 */\n.mask[hidden]{display:none}\n.pal-wrap[hidden]{display:none}\n.mask{\n  position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;padding:24px;\n  background:rgba(6,8,13,.62);backdrop-filter:blur(7px);animation:fadein .18s ease-out;\n}\n@keyframes fadein{from{opacity:0}to{opacity:1}}\n.sheet{\n  outline:none;width:min(560px,100%);max-height:min(86vh,760px);overflow:auto;padding:0;\n  background:var(--surface-sheet);border:1px solid rgba(var(--w),.12);border-radius:var(--r-lg);\n  box-shadow:0 30px 70px rgba(0,0,0,.6);animation:rise .22s cubic-bezier(.22,.61,.36,1);\n}\n.sheet.sm{width:min(440px,100%)}\n.sheet.wide{width:min(680px,100%)}\n.shead{display:flex;align-items:center;gap:12px;padding:18px 20px 14px;border-bottom:1px solid rgba(var(--w),.07)}\n.shead h3{font-size:15px;font-weight:600}\n.shead .x{\n  margin-left:auto;width:28px;height:28px;border-radius:50%;border:1px solid transparent;\n  background:transparent;color:var(--fg3);font-size:15px;cursor:pointer;line-height:1;\n}\n.shead .x:hover{background:rgba(var(--w),.08);color:var(--fg)}\n.sbody{padding:6px 20px 4px}\n.sfoot{display:flex;align-items:center;gap:10px;padding:14px 20px 18px}\n.sfoot .btn:last-child{margin-left:auto}\n.srow{display:flex;align-items:flex-start;gap:16px;padding:13px 0;border-top:1px solid rgba(var(--w),.05)}\n.srow:first-child{border-top:0}\n.srow .sl{font-size:13px;color:var(--fg);font-weight:600}\n.srow .sd{font-size:11.5px;color:var(--fg3);margin-top:3px;line-height:1.5}\n.srow .sr{margin-left:auto;display:flex;align-items:center;gap:8px;flex:0 0 auto}\n.snote{font-size:11.5px;color:var(--fg3);line-height:1.6;margin:8px 0 4px}\n.prompt{\n  margin:10px 0 6px;padding:12px 14px;border-radius:10px;background:rgba(var(--w),.04);\n  border:1px solid var(--line);font-size:12px;line-height:1.75;color:var(--fg2);white-space:pre-wrap;\n  font-family:var(--mono,ui-monospace,SFMono-Regular,Menlo,monospace);\n}\n.plus{\n  display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:999px;cursor:pointer;\n  border:1px dashed rgba(var(--w),.18);background:transparent;color:var(--fg2);font-size:12.5px;\n}\n.plus:hover{border-color:rgba(var(--accent-rgb),.5);color:var(--accent)}\n\n/* 统计图表 */\n.chips.jump{display:flex;gap:8px;flex-wrap:wrap}\n.chips.jump a{\n  padding:6px 12px;border-radius:999px;font-size:12px;color:var(--fg3);\n  background:rgba(var(--w),.04);border:1px solid var(--line);text-decoration:none;\n}\n.chips.jump a:hover{color:var(--accent);border-color:rgba(var(--accent-rgb),.35)}\n/* ── 统计：单列、每卡自成一行 ─────────────────────────────── */\n.sgrid{display:flex;flex-direction:column;gap:24px}\n\n.card.stat{\n  padding:22px 26px 20px;\n  scroll-margin-top:80px;\n  background:rgba(var(--w),.04);\n  border:1px solid rgba(var(--w),.09);\n  border-radius:18px;\n  box-shadow:inset 0 1px 0 rgba(var(--w),.06), 0 1px 6px rgba(var(--shadow),.08);\n  transition:border-color .22s, box-shadow .22s;\n}\n.card.stat:hover{\n  border-color:rgba(var(--w),.15);\n  box-shadow:inset 0 1px 0 rgba(var(--w),.08), 0 6px 22px rgba(var(--shadow),.13);\n}\n/* 卡头：标题左、副标题次之、控件右推 */\n.shead2{\n  display:flex;align-items:center;gap:10px;\n  margin-bottom:18px;padding-bottom:14px;\n  border-bottom:1px solid rgba(var(--w),.07);\n  min-height:32px;\n}\n.shead2 .stitle{\n  font-size:15px;font-weight:600;color:var(--fg);letter-spacing:-.01em;\n  white-space:nowrap;\n}\n.shead2 .smut{\n  font-size:11.5px;color:var(--ghost);\n  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;\n}\n.shead2 .sctls{\n  margin-left:auto;display:flex;align-items:center;gap:8px;flex-shrink:0;flex-wrap:nowrap;\n}\n\n/* 图表容器 */\n.card.stat .chartbox{width:100%}\n.card.stat .box{width:100%}\n\n/* 汇总数字：左对齐横排，细分隔线 */\n.sums{\n  display:flex;gap:0;flex-wrap:wrap;\n  margin-top:18px;padding-top:16px;\n  border-top:1px solid rgba(var(--w),.07);\n}\n.sums>div{\n  display:flex;flex-direction:column;gap:5px;\n  padding:0 28px 0 0;margin-right:28px;\n  border-right:1px solid rgba(var(--w),.07);\n}\n.sums>div:last-child{padding-right:0;margin-right:0;border-right:0}\n.sums .mut{font-size:10.5px;color:var(--ghost);letter-spacing:.04em;line-height:1}\n.sums b{font-size:22px;font-weight:600;color:var(--fg);font-variant-numeric:tabular-nums;letter-spacing:-.025em;line-height:1.1}\n\n/* takeaway：引用线风格 */\n.takeaway{\n  font-size:12px;line-height:1.65;\n  margin-top:14px;padding:8px 12px;\n  color:var(--ghost);\n  border-left:2px solid rgba(var(--accent-rgb),.35);\n  background:rgba(var(--accent-rgb),.04);\n  border-radius:0 8px 8px 0;\n}\n\n/* 图例 */\n.donutwrap{display:flex;align-items:center;gap:36px;flex-wrap:nowrap;margin-top:10px}\n.donut-center{flex-shrink:0;display:flex;align-items:center;justify-content:center;position:relative}\n.legend{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px;min-width:210px;flex:1}\n.legend li{\n  display:grid;grid-template-columns:11px 1fr 52px 44px;align-items:center;gap:10px;\n  font-size:12.5px;color:var(--fg2);\n  padding:5px 8px;margin:0 -8px;border-radius:7px;\n  transition:background .15s;cursor:default;\n}\n.legend li:hover:not(.tot){background:rgba(var(--w),.05)}\n.legend i{\n  width:11px;height:11px;border-radius:3px;flex-shrink:0;\n  box-shadow:inset 0 0.5px 1px rgba(255,255,255,.18);\n}\n.legend b{font-weight:600;color:var(--fg);text-align:right;font-variant-numeric:tabular-nums}\n.legend .mut{text-align:right;font-size:11.5px;color:var(--ghost);font-variant-numeric:tabular-nums}\n.legend .tot{\n  margin-top:4px;padding-top:9px;border-top:1px solid rgba(var(--w),.09);\n  border-radius:0;background:transparent;\n}\n.legend .c1{background:linear-gradient(135deg,#6B9DF3,#4E7FE5)}\n.legend .c2{background:linear-gradient(135deg,#45D4B0,#2FB898)}\n.legend .c3{background:linear-gradient(135deg,#F4B84D,#E89F2E)}\n.legend .c4{background:linear-gradient(135deg,#ED766F,#E04F47)}\n.legend .c5{background:linear-gradient(135deg,#5B78C8,#3B67C8)}\n.legend .c6{background:linear-gradient(135deg,#66D489,#4ABF6E)}\n.legend .c7{background:linear-gradient(135deg,#5AD5F0,#38BFE0)}\n.legend .c8{background:linear-gradient(135deg,#9BA4B5,#7B8494)}\n.legend .c9{background:linear-gradient(135deg,#C0AEFA,#9B8CF0)}\n\n/* 饼图居中+图例并排 - 已移至上方统一定义 */\n/* 饼图中心文字 */\n.donut-big{\n  font-size:26px;font-weight:700;fill:var(--fg);\n  font-family:var(--sans);letter-spacing:-.02em;\n  font-variant-numeric:tabular-nums;\n}\n.donut-label{\n  font-size:12px;fill:var(--ghost);\n  font-family:var(--sans);\n}\n/* 饼图片段 hover - 已移至统计专用样式区 */\n\n/* 记忆保留率表格 */\ntable.rt{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px}\ntable.rt th,table.rt td{\n  padding:11px 12px;text-align:right;font-weight:400;color:var(--fg2);\n  font-variant-numeric:tabular-nums;\n}\ntable.rt th:first-child,table.rt td:first-child,\ntable.rt thead th:first-child{text-align:left}\ntable.rt thead th{\n  font-size:10.5px;font-weight:600;letter-spacing:.08em;color:var(--ghost);\n  border-bottom:1px solid rgba(var(--w),.09);padding-bottom:9px;\n}\ntable.rt thead th.g{color:var(--s-green)}\ntable.rt thead th.b{color:var(--s-blue)}\ntable.rt td.g{color:var(--s-green)}\ntable.rt td.b{color:var(--s-blue)}\ntable.rt tbody th{color:var(--fg);font-weight:500;text-align:left}\ntable.rt tbody tr{transition:background .15s}\ntable.rt tbody tr+tr{border-top:1px solid rgba(var(--w),.05)}\ntable.rt tbody tr:hover{background:rgba(var(--w),.045);border-radius:8px}\n\n/* 图表容器：上方有点留白 */\n.chartbox{position:relative;margin:10px 0 4px}\n.cvv{position:absolute;inset:0;opacity:0;transform:translateY(6px);pointer-events:none;transition:opacity .28s ease,transform .28s cubic-bezier(.22,.61,.36,1)}\n.cvv.on{position:relative;opacity:1;transform:none;pointer-events:auto}\n.cvv.on .bar{animation:grow .54s cubic-bezier(.34,.61,.35,1) both;transform-box:fill-box;transform-origin:bottom}\n@keyframes grow{\n  from{transform:scaleY(.02);opacity:.35}\n  to{transform:scaleY(1);opacity:1}\n}\n.cv{display:block;overflow:visible}\n.tx{font-size:11px;fill:var(--fg3);font-family:var(--sans);font-variant-numeric:tabular-nums}\n.big{font-size:19px;fill:var(--fg);font-weight:600;font-family:var(--sans)}\n.gl{stroke:rgba(var(--w),.05);stroke-width:1;stroke-dasharray:3 4}\n.bl{stroke:rgba(var(--w),.12);stroke-width:1}\n\n/* 面积图 */\n.area2{\n  fill:url(#ac2);\n  opacity:.85;\n  transition:opacity .2s ease;\n  animation:area-in .65s cubic-bezier(.22,.61,.36,1) both;\n}\n@keyframes area-in{\n  from{opacity:.18}\n  to{opacity:.85}\n}\n.line2{\n  fill:none;\n  stroke:var(--s-blue2);\n  stroke-width:2;\n  stroke-linejoin:round;\n  stroke-linecap:round;\n  filter:drop-shadow(0 1px 3px rgba(94,143,239,.3));\n  transition:all .2s ease;\n  /* 用 pathLength=\"1\" 归一化：原来写死 1000，路径一长（新增那张）就只画前 1000 个单位，尾巴断开只剩点 */\n  stroke-dasharray:1;\n  stroke-dashoffset:1;\n  animation:line-draw .85s cubic-bezier(.22,.61,.36,1) .15s both;\n}\n@keyframes line-draw{\n  to{stroke-dashoffset:0}\n}\n.chart:hover .line2{\n  stroke-width:2.5;\n  filter:drop-shadow(0 2px 6px rgba(94,143,239,.4));\n}\n.ln2{fill:none;stroke:var(--s-amber);stroke-width:1.7;stroke-dasharray:4 3;opacity:.95}\n.hit{fill:transparent;cursor:pointer}\n.hx{fill:rgba(var(--w),.05);transition:all .15s ease;cursor:pointer}\n.hx:hover{stroke:rgba(var(--w),.4);stroke-width:1;fill:rgba(var(--w),.08)}\n\n/* 面积图数据点：实心 + hover 放大 + 透明命中区 */\n.adot{\n  fill:var(--s-blue2);\n  stroke:rgba(var(--bg-bottom),.9);\n  stroke-width:2;\n  transition:all .18s ease;\n  filter:drop-shadow(0 1px 2px rgba(94,143,239,.4));\n  animation:dot-pop .35s cubic-bezier(.34,1.56,.64,1) .8s both;\n}\n@keyframes dot-pop{\n  from{opacity:0;transform:scale(.3)}\n  to{opacity:1;transform:scale(1)}\n}\n.adot-last{fill:var(--accent);r:4.5}\n.ahit{cursor:pointer}\n.ahit:hover ~ .adot,\n.ahit:hover + .adot{r:6}\n/* hover 透明命中圈触发时，让它后面的实心点放大 */\n.ahit:hover{fill:rgba(var(--accent-rgb),.06)}\n/* donutwrap / legend / sums / takeaway / rt 统一在上方统计区定义 */\n.tip{\n  position:fixed;z-index:99;pointer-events:none;padding:7px 11px;border-radius:9px;\n  background:linear-gradient(135deg, #1A1E28, #14171F);\n  border:1px solid rgba(var(--w),.22);\n  font-size:12px;color:var(--fg);font-weight:500;\n  white-space:nowrap;\n  box-shadow:0 16px 36px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.08);\n  transform:translate(-50%,-140%);\n  backdrop-filter:blur(12px);\n  animation:tip-in .2s ease-out;\n}\n@keyframes tip-in{\n  from{opacity:0;transform:translate(-50%,-135%);}\n  to{opacity:1;transform:translate(-50%,-140%);}\n}\n\n/* 热力图小格子 hover */\n.heat rect{\n  transition:all .2s ease;\n  cursor:pointer;\n  animation:heat-in .4s ease both;\n}\n@keyframes heat-in{\n  from{opacity:.2}\n  to{opacity:1}\n}\n.heat rect:hover{\n  opacity:1 !important;\n  filter:brightness(1.25) saturate(1.3);\n  stroke:rgba(var(--accent-rgb),.6);\n  stroke-width:1.5;\n  rx:3;\n}\n\n/* 引导 */\n.guide{\n  position:fixed;inset:0;z-index:150;display:flex;align-items:center;justify-content:center;padding:24px;\n  background:rgba(6,8,13,.66);backdrop-filter:blur(7px);\n}\n.guide[hidden]{display:none}\n.guide.out{opacity:0;transition:opacity .26s ease}\n.gcard{\n  width:min(520px,100%);padding:24px 26px 18px;border-radius:var(--r-lg);\n  background:var(--surface-sheet);border:1px solid rgba(var(--w),.12);\n  box-shadow:0 30px 70px rgba(0,0,0,.6);animation:rise .24s cubic-bezier(.22,.61,.36,1);\n}\n.geyebrow{font-size:11.5px;letter-spacing:.1em;color:var(--fg3)}\n.gbody{margin-top:14px;min-height:112px}\n.gstep{display:none}\n.gstep.on{display:block;animation:rise .24s ease-out}\n.gtitle{font-size:17px;font-weight:600;color:var(--fg);margin-bottom:6px}\n.gdesc{font-size:12.5px;line-height:1.6;color:var(--fg3);margin-bottom:6px}\n.gpick{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}\n.gfoot{display:flex;align-items:center;gap:10px;margin-top:16px}\n.gdots{display:flex;gap:6px;margin:0 auto}\n.gdots .gdot{width:6px;height:6px;border-radius:50%;background:rgba(var(--w),.16);cursor:pointer}\n.gdots .gdot.on{background:var(--accent)}\n.gfield{display:flex;align-items:center;gap:8px;margin-bottom:9px}\n.glab2{font-size:11.5px;letter-spacing:.08em;color:var(--fg3)}\n.gpath{display:flex;align-items:center;gap:8px}\n.gpath .inp{flex:1 1 auto;min-width:0;font-size:12.5px}\n.gpath .btn{flex:0 0 auto}\n\n/* 快捷键 */\n.ksearch{\n  display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:10px;margin-bottom:12px;\n  background:rgba(var(--w),.04);border:1px solid var(--line);color:var(--fg3);font-size:12.5px;\n}\n.kgroups{display:grid;grid-template-columns:1fr 1fr;gap:6px 34px}\n.kgrp{padding:6px 0}\n.kgh{display:flex;align-items:baseline;gap:6px;font-size:11px;letter-spacing:.1em;color:var(--fg3);padding:6px 0 8px}\n.kgh .mut{font-size:10.5px;color:#4C515A}\n.krow{display:flex;align-items:center;gap:12px;padding:9px 0;border-top:1px solid rgba(var(--w),.05);cursor:pointer}\n.krow:hover .kb{border-color:rgba(var(--accent-rgb),.5);color:var(--accent)}\n.krow .lab{font-size:12.5px;color:var(--fg2);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.krow .kb{\n  margin-left:auto;padding:3px 9px;border-radius:7px;border:1px solid var(--line);\n  background:rgba(var(--w),.04);font-size:11.5px;color:var(--fg2);white-space:nowrap;\n  font-family:var(--mono,ui-monospace,Menlo,monospace);\n}\n.krow .kb.live{border-color:rgba(var(--accent-rgb),.6);color:var(--accent)}\n.keyhint{font-size:11.5px;color:var(--fg3);line-height:1.6;margin-top:12px}\n\n/* 搜索层 */\n.palmask{\n  position:fixed;inset:0;z-index:180;display:flex;align-items:flex-start;justify-content:center;\n  padding-top:13vh;background:rgba(6,8,13,.6);backdrop-filter:blur(7px);animation:fadein .16s ease-out;\n}\n.palette{\n  position:relative;z-index:190;\n  width:min(660px,92vw);border-radius:var(--r-lg);overflow:hidden;\n  background:var(--surface-sheet);border:1px solid rgba(var(--w),.12);box-shadow:0 30px 70px rgba(0,0,0,.62);\n  animation:rise .2s cubic-bezier(.22,.61,.36,1);\n}\n.pal-in{display:flex;align-items:center;gap:10px;padding:15px 18px;border-bottom:1px solid rgba(var(--w),.07)}\n.pal-in svg{width:16px;height:16px;stroke:var(--fg3);fill:none;stroke-width:1.6}\n.pal-in input{flex:1;background:none;border:0;outline:none;color:var(--fg);font:inherit;font-size:14px}\n.pal-body{padding:4px 8px 8px}\n/* 组标题：贴边是之前最大的毛病——文字直接写在 .pal-sec 上，而这里只给了上下 padding */\n.pal-sec{padding:12px 10px 4px;font-size:11px;font-weight:600;letter-spacing:.08em;color:var(--fg3)}\n.pal-body>.pal-sec:first-child{padding-top:6px}\n.pal-item{\n  display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:9px;\n  font-size:13px;color:var(--fg2);cursor:pointer;\n}\n.pal-item>span:first-child{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.pal-item.on,.pal-item:hover{background:rgba(var(--w),.07);color:var(--fg)}\n.pal-item.on{box-shadow:inset 2px 0 0 var(--accent)}\n.pal-item .mut,.pal-item .kb{\n  margin-left:auto;flex:0 0 auto;padding-left:14px;font-size:11.5px;color:var(--fg3);\n  font-variant-numeric:tabular-nums;\n}\n.pal-foot{display:flex;align-items:center;gap:12px;padding:10px 18px;border-top:1px solid rgba(var(--w),.07);font-size:11.5px;color:var(--fg3)}\n.kbd{\n  padding:2px 6px;border-radius:5px;border:1px solid var(--line);background:rgba(var(--w),.05);\n  font-size:11px;font-family:var(--mono,ui-monospace,Menlo,monospace);\n}\n\n/* 背景层 */\ncanvas.liquid{position:fixed;inset:0;z-index:-1;pointer-events:none;filter:blur(34px) saturate(1.18);opacity:.66;transform:scale(1.05)}\n:host([data-theme=\"light\"]) canvas.liquid{opacity:.42}\n/* 玻璃雨滴层：在背景之上、内容之下 */\ncanvas.rain{position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none}\n.glow{position:fixed;inset:-14%;z-index:-2;pointer-events:none;opacity:.38;transition:opacity .4s}\n:host([data-theme=\"light\"]) .glow{opacity:.5}\n.glow i{position:absolute;border-radius:50%;filter:blur(70px)}\n\n/* 小零件 */\n.sm{font-size:12px}\n.small{font-size:11.5px}\n.off{opacity:.45}\n.stat{font-variant-numeric:tabular-nums}\n.hdr-act{display:flex;align-items:center;gap:10px;margin-left:auto}\n.ncard{padding:14px;border-radius:12px;background:rgba(var(--w),.04);border:1px solid var(--line)}\n.nowrow{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:12px 0}\n.nt{font-size:11.5px;letter-spacing:.06em;color:var(--fg3)}\n.nv{font-size:14px;color:var(--fg);margin-top:6px;font-weight:600}\n.nu{font-size:11.5px;color:var(--fg3);margin-top:3px}\n\n/* ── 补：系列色与统计控件（上一批被误删） ───────────────── */\n.c1{fill:var(--s-blue)} .c2{fill:var(--s-teal)} .c3{fill:var(--s-amber)} .c4{fill:var(--s-red)}\n.c5{fill:#2C5C86} .c6{fill:var(--s-green)} .c7{fill:var(--s-cyan)} .c8{fill:var(--s-grey)}\n.c9{fill:var(--s-lav)} .c10{fill:var(--s-purple)} .c11{fill:var(--s-cyan)} .c12{fill:var(--s-lime)} .c13{fill:var(--s-pink)}\n/* legend 颜色定义已移到统计区 */\n.h0{fill:rgba(var(--w),.05)} .h1{fill:rgba(91,141,239,.35)} .h2{fill:rgba(69,200,232,.6)} .h3{fill:var(--s-cyan)}\n\n.rng{display:inline-flex;align-items:center;gap:2px;padding:3px;border-radius:999px;background:rgba(var(--w),.04);border:1px solid var(--line)}\n.rng label{display:inline-flex;position:relative;cursor:pointer}\n.rng input{position:absolute;opacity:0;width:0;height:0;pointer-events:none}\n.rng span{padding:5px 11px;border-radius:999px;font-size:12px;color:var(--fg3);transition:color .16s,background .16s;white-space:nowrap}\n.rng input:checked + span{background:var(--accent-cont);color:var(--on-accent-cont);font-weight:600}\n.rng label:hover span{color:var(--fg)}\n\n.chk{display:inline-flex;align-items:center;gap:7px;font-size:12px;color:var(--fg2);cursor:pointer}\n.chk input{\n  appearance:none;-webkit-appearance:none;width:14px;height:14px;border-radius:4px;\n  border:1px solid rgba(var(--w),.26);background:rgba(var(--w),.04);position:relative;cursor:pointer;flex:0 0 auto;\n}\n.chk input:checked{background:var(--accent);border-color:var(--accent)}\n.chk input:checked::after{\n  content:\"\";position:absolute;left:4px;top:1px;width:4px;height:8px;\n  border:solid var(--on-accent);border-width:0 1.6px 1.6px 0;transform:rotate(42deg);\n}\n\n.sel{\n  appearance:none;-webkit-appearance:none;\n  padding:7px 30px 7px 13px;border-radius:999px;\n  font:inherit;font-size:12.5px;color:var(--fg);font-weight:500;\n  background-color:rgba(var(--w),.055);\n  border:1px solid rgba(var(--w),.12);cursor:pointer;\n  box-shadow:inset 0 0.5px 0 rgba(var(--w),.06);\n  transition:all .16s ease;\n  background-image:\n    linear-gradient(45deg, transparent 50%, var(--fg3) 50%),\n    linear-gradient(135deg, var(--fg3) 50%, transparent 50%);\n  background-position:calc(100% - 14px) 55%, calc(100% - 9.5px) 55%;\n  background-size:4.5px 4.5px, 4.5px 4.5px;\n  background-repeat:no-repeat;\n}\n.sel:hover{\n  border-color:rgba(var(--w),.2);\n  background-color:rgba(var(--w),.08);\n}\n.sel:focus{\n  outline:none;\n  border-color:rgba(var(--accent-rgb),.4);\n  box-shadow:inset 0 0.5px 0 rgba(var(--w),.06), 0 0 0 3px rgba(var(--accent-rgb),.1);\n}\n.year{font-size:12.5px;color:var(--fg);font-weight:600;min-width:42px;text-align:center;font-variant-numeric:tabular-nums}\n.btn.sm{padding:5px 11px;font-size:11.5px;border-radius:999px;font-weight:600}\n@media print{\n  .topbar,.chips.jump,.sctls,.hdr-act,.tip,.card.stat .takeaway{display:none!important}\n  body,.page{background:#fff!important}\n  .card{background:#fff!important;border:1px solid #d8dde8!important;box-shadow:none!important;break-inside:avoid}\n  h1,.stitle,.sums b,.legend b,table.rt tbody th{color:#111!important}\n  .mut,.smut,.tx{color:#666!important}\n  .tx{fill:#666!important}\n  .gl{stroke:#e6e9f0!important}.bl{stroke:#c9cfdb!important}\n}\n\n\n/* 统计系列色（上一批被误删，补回） */\n/* 统计图表配色：用渐变而不是纯色 */\n:host{\n  --s-blue:#5B8DEF; --s-blue2:#4E7FE5; --s-cyan:#45C8E8; --s-teal:#35C2A6;\n  --s-green:#57C77B; --s-lime:#A6D65A; --s-amber:#F0A93B; --s-red:#E8635C;\n  --s-pink:#E27BA8; --s-purple:#9B8CF0; --s-grey:#8B94A6; --s-lav:#B8A9F2;\n}\n\n/* 柱状图 */\n.bar{\n  transition:all .2s ease;\n  cursor:pointer;\n}\n.bar:hover{\n  opacity:.85;\n  filter:brightness(1.15) saturate(1.2);\n  stroke:rgba(255,255,255,.15);\n  stroke-width:1;\n}\n.bar.c1{fill:url(#grad-blue)}\n.bar.c2{fill:url(#grad-teal)}\n.bar.c3{fill:url(#grad-amber)}\n.bar.c4{fill:url(#grad-red)}\n.bar.c5{fill:url(#grad-blue-dark)}\n.bar.c6{fill:url(#grad-green)}\n.bar.c7{fill:url(#grad-cyan)}\n\n/* 环形图用描边色 + hover 放大 */\n.donut circle{\n  transition:all .25s ease;\n  cursor:pointer;\n  filter:drop-shadow(0 2px 4px rgba(0,0,0,.15));\n}\n.donut circle:hover{\n  opacity:.9;\n  filter:drop-shadow(0 4px 8px rgba(0,0,0,.25)) brightness(1.1);\n  stroke-width:18;\n}\n.donut .dc.c1{stroke:var(--s-blue)}\n.donut .dc.c2{stroke:var(--s-teal)}\n.donut .dc.c3{stroke:var(--s-amber)}\n.donut .dc.c4{stroke:var(--s-red)}\n.donut .dc.c5{stroke:#3E6FD6}\n.donut .dc.c6{stroke:var(--s-green)}\n.donut .dc.c7{stroke:var(--s-cyan)}\n.donut .dc.c8{stroke:var(--s-grey)}\n.donut .dc.c9{stroke:var(--s-lav)}\n\n/* 饼图片段入场动画 */\n.donut circle{\n  animation:donut-in .55s cubic-bezier(.22,.61,.36,1) both;\n}\n.donut circle:nth-child(1){animation-delay:0s}\n.donut circle:nth-child(2){animation-delay:.05s}\n.donut circle:nth-child(3){animation-delay:.1s}\n.donut circle:nth-child(4){animation-delay:.15s}\n.donut circle:nth-child(5){animation-delay:.2s}\n.donut circle:nth-child(6){animation-delay:.25s}\n.donut circle:nth-child(7){animation-delay:.3s}\n@keyframes donut-in{\n  /* 只动透明度：这条圆上还有 transform=\"rotate(-90 …)\" 属性，\n     再用 CSS transform 做缩放会把它顶掉——环会转到看不见的地方去。 */\n  from{opacity:.25}\n  to{opacity:1}\n}\n\n/* 窄版面（卡片页）里，页头按钮换到下一行，别把字挤成三行 */\n.btn{white-space:nowrap}\n.screen.half .hdr{flex-direction:column;align-items:flex-start;gap:8px}\n.screen.half .hdr .act,.screen.half .hdr-act{margin-left:0;width:100%;justify-content:flex-start;flex-wrap:wrap;gap:8px}\n.screen.half .hdr h1{font-size:20px}\n.screen.half .hdr .sub{max-width:none}\n\n/* 卡片页两栏：左边牌组表，右边「接着练」小卡 */\n.cards2{display:grid;width:100%;grid-template-columns:minmax(0,1fr) 296px;gap:16px;align-items:start}\n.c-l{display:flex;flex-direction:column;gap:10px;min-width:0}\n.c-r{position:sticky;top:14px;display:flex;flex-direction:column;gap:10px}\n.nextup{padding:14px 16px;display:flex;flex-direction:column;gap:8px}\n.nextup .sec-title{font-size:12px;letter-spacing:.04em;color:var(--fg3)}\n.nextup .word{font-size:20px;line-height:1.2}\n.nextup .qline{font-size:13px;line-height:1.55;margin:0;color:var(--fg)}\n.nextup .mut{font-size:11.5px;line-height:1.55}\n.nextup-face{margin:2px 0 4px}\n.nextup .btn{align-self:flex-start;padding:7px 15px;font-size:12.5px}\n.nextup-note{font-size:11px}\n@media (max-width:900px){\n  .cards2{grid-template-columns:minmax(0,1fr)}\n  .c-r{position:static}\n}\n\n/* 底部那三个按钮再缩一半 */\n.deckfoot .btn{padding:5px 11px;font-size:10.5px;border-radius:999px;letter-spacing:.02em}\n\n/* 三个牌组按钮：缩一半、贴页面底部居中 */\n.deckfoot{display:flex;align-items:center;justify-content:center;gap:8px;padding:0 2px 10px;margin-top:auto}\n.deckfoot .btn{padding:5px 11px;font-size:10.5px;border-radius:999px}\n\n/* 牌组表下面那行统计，居中 */\n.deckstat{text-align:center;font-size:11.5px;color:var(--fg3);margin:2px 0 0}\n\n/* 接着练：五面小点在左，主按钮靠右 */\n.nextup-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:4px}\n.nextup-foot .btn{padding:7px 15px;font-size:12.5px}\n.screen.half .hdr .act{justify-content:flex-start}\n\n/* 接着练底部一行：点子在左、按钮贴右，别溢出卡片 */\n.nextup-foot{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px;margin-top:4px}\n.nextup-foot .btn{justify-self:end;padding:6px 13px;font-size:12px;white-space:nowrap}\n.nextup-face{min-width:0;overflow:hidden}\n\n/* 右卡窄：五面单独一行，按钮另起一行靠右 */\n.nextup-foot{display:flex;flex-direction:column;align-items:stretch;gap:9px;margin-top:4px}\n.nextup-face{min-width:0;overflow:visible}\n.nextup-face .face{font-size:10px;gap:3px}\n.nextup-foot .btn{align-self:flex-end;padding:6px 14px;font-size:12px}\n\n/* 设置页：所有说明小字撤掉，只留标题和控件 */\n.setbody .group .field .desc,\n.setbody .group .ghead .mut,\n.setbody .group .keyhint,\n.setbody .group .snote,\n.setbody .group .deckstat{display:none}\n.setbody .group .field{padding:11px 0}\n\n/* 智能体「给它哪些手」：开关推到右边 */\n.perm{display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid var(--line)}\n.perm .pl{font-size:12.5px;color:var(--fg2)}\n.perm .sw{margin-left:auto;flex:0 0 auto}\n\n/* 设置卡片：雾化玻璃 */\n.setbody .group{\n  background:rgba(var(--w),.035);\n  backdrop-filter:blur(18px) saturate(1.15);\n  -webkit-backdrop-filter:blur(18px) saturate(1.15);\n  box-shadow:inset 0 1px 0 rgba(var(--w),.06), 0 22px 50px rgba(var(--shadow),.28);\n}\n\n/* 设置每行节奏：左右两端对齐、上下留白一致 */\n.setbody .group .field{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px 26px;padding:13px 0;border-bottom:1px solid var(--line)}\n.setbody .group .field:last-child{border-bottom:0}\n.setbody .group .field .lab{font-size:13px;color:var(--fg)}\n.setbody .group .field .ctl{justify-self:end;display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}\n.setbody .group .ghead{margin-bottom:2px}\n\n/* 搜索层输入框别把 Esc 挤住 */\n.pal-in{position:relative}\n.pal-in input{min-width:0;width:100%}\n.pal-in .kbd{margin-left:auto;flex:0 0 auto}\n\n/* 快捷键那行搜索框（刚恢复时 svg 没尺寸，画成了一个大黑圆） */\n.ksearch{display:flex;align-items:center;gap:9px;padding:9px 13px;border-radius:999px;\n  background:rgba(var(--w),.04);border:1px solid var(--line);color:var(--fg3);font-size:12.5px;min-width:0}\n.ksearch svg{width:15px;height:15px;flex:0 0 auto;fill:none;stroke:currentColor;stroke-width:1.6}\n.setbody .group svg{flex:0 0 auto}\n.setbody .group .foldrow svg,.setbody .group .shead svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.6}\n\n/* ── 牌组行菜单 / 选项小窗 / 提示条 ───────────────────── */\n.deckmenu{\n  position:fixed;z-index:320;min-width:132px;padding:6px;border-radius:12px;\n  background:#181B22;border:1px solid rgba(var(--w),.14);\n  box-shadow:0 22px 48px rgba(0,0,0,.55);\n  display:flex;flex-direction:column;gap:1px;animation:pop .16s ease-out;\n}\n.deckmenu[hidden]{display:none}\n.deckmenu button{\n  text-align:left;padding:8px 11px;border-radius:8px;border:0;background:transparent;\n  color:var(--fg2);font:inherit;font-size:12.5px;cursor:pointer;\n}\n.deckmenu button:hover{background:rgba(var(--w),.07);color:var(--fg)}\n.deckmenu button.danger{color:#E69089}\n.deckmenu button.danger:hover{background:rgba(230,144,137,.14)}\n\n.sheet.lg{width:min(680px,92vw)}\n.sheet.lg .sbody{max-height:min(72vh,640px);overflow:auto;padding-right:4px}\n.deckopt{display:flex;flex-direction:column;gap:18px}\n.oset h3{\n  margin:0 0 6px;font-size:12px;letter-spacing:.08em;color:var(--fg3);\n  padding-bottom:6px;border-bottom:1px solid var(--line);\n}\n.oset .srow{padding:7px 0;border-bottom:1px solid rgba(var(--w),.04)}\n.oset .srow:last-child{border-bottom:0}\n.inp.sm{width:150px;padding:6px 10px;font-size:12px;text-align:left}\n.sel.sm{width:auto;min-width:150px;max-width:260px;padding:6px 26px 6px 10px;font-size:12px}\n\n.toast{\n  position:fixed;left:50%;bottom:28px;transform:translate(-50%,14px);\n  z-index:400;display:flex;align-items:center;gap:12px;\n  padding:10px 14px;border-radius:999px;font-size:12.5px;color:var(--fg);\n  background:#1A1D25;border:1px solid rgba(var(--w),.16);\n  box-shadow:0 18px 40px rgba(0,0,0,.5);opacity:0;pointer-events:none;\n  transition:opacity .2s ease,transform .2s ease;\n}\n.toast.in{opacity:1;transform:translate(-50%,0);pointer-events:auto}\n.toast button{\n  border:0;background:transparent;color:var(--accent);font:inherit;font-size:12.5px;\n  font-weight:600;cursor:pointer;padding:0;\n}\n\n/* 选项小窗：控件靠右 + 底栏固定在底部 */\n.sheet.lg{max-height:86vh;display:flex;flex-direction:column;padding:0}\n.sheet.lg .shead{padding:18px 20px 12px;flex:0 0 auto}\n.sheet.lg .sbody{flex:1 1 auto;min-height:0;overflow:auto;padding:4px 20px 8px}\n.sheet.lg .sfoot{padding:12px 20px 16px;flex:0 0 auto;border-top:1px solid var(--line);background:transparent}\n.oset .srow{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px 18px}\n.oset .srow .sd{justify-self:end;display:flex;align-items:center;justify-content:flex-end;gap:10px}\n.oset .srow .sw{flex:0 0 auto}\n\n/* 提示条别压在牌组底部按钮上 */\n.toast{bottom:84px}\n\n/* 选项小窗：大分区之间拉开，每块自带卡片阴影 */\n.deckopt{gap:28px}\n.oset{\n  padding:14px 16px 8px;border-radius:14px;\n  background:rgba(var(--w),.035);\n  border:1px solid rgba(var(--w),.08);\n  box-shadow:0 12px 26px rgba(0,0,0,.26), inset 0 1px 0 rgba(var(--w),.05);\n}\n.oset h3{margin:0 0 4px;padding-bottom:8px}\n.oset .srow:last-child{border-bottom:0}\n\n/* ── 深度系统（照 Refactoring UI 第六章重做）────────────────────\n   1. 光从上方来：凸起 = 上沿更亮 + 下方小而紧的阴影；凹陷 = 顶部阴影 + 下沿更亮。\n   2. 五级阴影，水平偏移一律 0；级别越高，贴边那层「接触阴影」越淡。\n   3. 深色下更亮 = 更近：底色压暗，卡片才浮得起来。\n   数值在 1440 宽下截图并采样核过。整体回滚：删掉本段即可。 */\n:host{\n  --el-rim:rgba(255,255,255,.095);\n  --el-ink:3,6,13;\n  --el-1:0 1px 2px rgba(var(--el-ink),.30), inset 0 1px 0 var(--el-rim);\n  --el-2:0 1px 2px rgba(var(--el-ink),.26), 0 6px 16px -8px rgba(var(--el-ink),.50), inset 0 1px 0 var(--el-rim);\n  --el-3:0 2px 4px rgba(var(--el-ink),.28), 0 10px 24px -10px rgba(var(--el-ink),.55), inset 0 1px 0 var(--el-rim);\n  --el-4:0 3px 6px rgba(var(--el-ink),.24), 0 18px 44px -14px rgba(var(--el-ink),.62), inset 0 1px 0 var(--el-rim);\n  --el-5:0 4px 8px rgba(var(--el-ink),.18), 0 30px 70px -18px rgba(var(--el-ink),.68), inset 0 1px 0 var(--el-rim);\n  --el-in:inset 0 1px 2px rgba(var(--el-ink),.42), inset 0 -1px 0 var(--el-rim);\n  --bg-top:#1B2027; --bg-bottom:#171B22;\n}\n:host([data-theme=\"light\"]){\n  --el-rim:#FFFFFF;\n  --el-ink:24,38,74;\n  --bg-top:#F8FAFE; --bg-bottom:#E9EFFB;\n}\n\n/* 天空光：自上而下。那层很淡的白是「界面被头顶的灯照着」的唯一提示，\n   抽掉它，所有阴影的方向都会显得可疑。 */\nbody::before{\n  background:\n    radial-gradient(1100px 360px at 50% -14%, rgba(var(--w),.07), transparent 72%),\n    radial-gradient(760px 520px at 88% -6%, var(--glow-1), transparent 62%),\n    radial-gradient(680px 560px at -8% 104%, var(--glow-2), transparent 60%),\n    linear-gradient(180deg,var(--bg-top) 0%,var(--bg-bottom) 68%,#12161D 100%);\n}\n:host([data-theme=\"light\"]) body::before{\n  background:\n    radial-gradient(1100px 360px at 50% -14%, #FFFFFF, transparent 72%),\n    radial-gradient(760px 520px at 88% -6%, var(--glow-1), transparent 62%),\n    radial-gradient(680px 560px at -8% 104%, var(--glow-2), transparent 60%),\n    linear-gradient(180deg,var(--bg-top) 0%,var(--bg-bottom) 100%);\n}\n\n/* 谁在哪一层：按钮 1 · 卡片 2 · 菜单 3 · 弹窗 4 · 命令面板 5 */\n.brand,.tabs,.iconbtn,.btn{box-shadow:var(--el-1)}\n.btn:active{box-shadow:none;transform:translateY(.5px)}\n.btn.primary{box-shadow:var(--el-2), 0 8px 20px -8px rgba(var(--accent-rgb),.6)}\n.card{box-shadow:var(--el-2)}\n.deckmenu,.toast,.pop{box-shadow:var(--el-3)}\n.sheet{box-shadow:var(--el-4)}\n.palette{box-shadow:var(--el-5)}\n\n/* 凹陷：该像「嵌进页面」的东西——输入框、搜索框 */\n.typebox,.ksearch{box-shadow:var(--el-in)}\n.typebox:focus-within{box-shadow:var(--el-in), 0 0 0 3px rgba(var(--accent-rgb),.13)}\n\n/* 底部操作条（曾经有样式，被某次外科手术切掉了，这里补回） */\n.actbar{\n  display:flex;align-items:center;gap:9px;margin-top:auto;\n  padding:9px 14px;border-radius:999px;font-size:12px;color:var(--fg3);\n  background:var(--glass);border:1px solid var(--glass-line);box-shadow:var(--el-1);\n}\n.actbar .btn{padding:7px 16px}\n\n/* ── 启动页（v11 的三张画布 + 居中一组字）────────────────────────\n   这套规则之前被整块删掉了，启动页只剩流星、没有标题和按钮。\n   分层照 DESIGN v11：流星 z-1 · 按钮层 1 · 环前半 3。\n   点空白只跟背景玩，只有按钮是真的可点的 —— 所以外层 pointer-events:none。 */\ncanvas.meteors{position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none}\ncanvas.ringfront{position:fixed;inset:0;width:100%;height:100%;z-index:3;pointer-events:none}\nmain.splash2{position:fixed;inset:0;z-index:1;display:grid;place-items:center;pointer-events:none}\n.sp2-inner{\n  text-align:center;pointer-events:none;\n  display:flex;flex-direction:column;align-items:center;gap:0;\n  transform:translateY(-28px);\n}\n\n/* Wordmark：图标 + 名称横排 */\n.sp2-wordmark{\n  display:inline-flex;align-items:center;gap:9px;\n  margin-bottom:20px;\n  animation:sp-rise .7s cubic-bezier(.22,.61,.36,1) both;\n}\n.sp2-logo{\n  width:36px;height:36px;border-radius:10px;display:grid;place-items:center;\n  background:linear-gradient(135deg,rgba(var(--accent-rgb),.28),rgba(var(--accent-rgb),.14));\n  border:1px solid rgba(var(--accent-rgb),.35);\n  font-size:16px;font-weight:700;color:var(--accent);\n  box-shadow:inset 0 1px 0 rgba(255,255,255,.12), 0 4px 12px rgba(var(--accent-rgb),.2);\n}\n.sp2-brand{\n  font-size:13px;font-weight:600;letter-spacing:.12em;\n  color:var(--fg3);\n}\n\n/* 主标题 */\n.sp2-title{\n  margin:0;font-size:52px;line-height:1.2;font-weight:700;letter-spacing:-.025em;\n  color:var(--fg);\n  text-shadow:0 2px 32px rgba(0,0,0,.45);\n  animation:sp-rise .85s .1s cubic-bezier(.22,.61,.36,1) both;\n}\n:host([data-theme=\"light\"]) .sp2-title{text-shadow:0 1px 20px rgba(255,255,255,.8)}\n\n/* 按钮区：只有一个按钮，居中 */\n.sp2-act{\n  margin-top:36px;position:relative;z-index:2;\n  animation:sp-rise .85s .22s cubic-bezier(.22,.61,.36,1) both;\n}\n.sp2-act .btn.lg{\n  pointer-events:auto;\n  padding:15px 48px;font-size:15.5px;letter-spacing:.02em;font-weight:600;\n  box-shadow:\n    inset 0 1px 0 rgba(255,255,255,.22),\n    0 8px 32px rgba(var(--accent-rgb),.42),\n    0 2px 8px rgba(var(--accent-rgb),.28);\n}\n.sp2-act .btn.lg:hover{\n  transform:translateY(-2px);\n  box-shadow:\n    inset 0 1px 0 rgba(255,255,255,.28),\n    0 14px 40px rgba(var(--accent-rgb),.52),\n    0 4px 14px rgba(var(--accent-rgb),.36);\n}\n.sp2-act .btn.lg:active{\n  transform:translateY(0);\n}\n\n@keyframes sp-rise{\n  from{opacity:0;transform:translateY(18px)}\n  to{opacity:1;transform:translateY(0)}\n}\n/* 页面切换：淡出 + 轻微下沉 + 轻微缩小 */\nbody.leaving .page{\n  opacity:0;\n  transform:translateY(8px) scale(.994);\n  transition:opacity .28s ease, transform .28s cubic-bezier(.4,0,.2,1);\n}\nbody.leaving .glow{opacity:0;transition:opacity .28s ease}\n@media (max-width:760px){\n  .sp2-title{font-size:38px}\n  .sp2-inner{transform:translateY(-18px)}\n}\n\n/* ── 牌组树：无限层子牌组（Anki 的 父::子）──────────────────\n   缩进跟着 --dep 走：一级 0，二级 1，三级 2……每层 18px。\n   折叠用 hidden，但 .drow 是 display:grid，得手动让 hidden 生效。 */\n.drow{padding-left:calc(14px + var(--dep,0) * 18px)}\n.drow[hidden]{display:none}\n.drow.parent .dname{color:var(--fg)}\n.drow .caret{cursor:pointer}\n.drow.flash{animation:deckflash .9s ease-out}\n@keyframes deckflash{\n  0%{background:rgba(var(--accent-rgb),.18)}\n  100%{background:transparent}\n}\n.nd-preview{\n  font-size:12.5px;color:var(--fg2);padding:6px 10px;border-radius:8px;\n  background:rgba(var(--w),.05);border:1px dashed var(--line);\n  word-break:break-all;max-width:280px;display:inline-block;\n}\n#deckmenu button[data-act=\"subdeck\"]{font-weight:600;color:var(--fg)}\n.drow.ctx{background:rgba(var(--accent-rgb),.1)}\n\n/* ══ 工厂 v2：造料三步 + 五面契约（2026-11-01）══════════════════\n   页面只做三件事：给英英意思、给八条例句、让人挑一句最短的。\n   挑完那一句，右边就把「五个面」的原料摆出来 —— 缺哪样一眼能看到。\n   底下才轮到图、声、换词。 */\n\n.frule{display:grid;grid-template-columns:1fr 1fr;gap:12px}\n.frule>div{\n  display:flex;gap:10px;align-items:flex-start;padding:11px 13px;\n  border-radius:var(--r-md);background:rgba(var(--accent-rgb),.055);\n  border:1px solid rgba(var(--accent-rgb),.15);\n}\n.frule i{\n  font-style:normal;flex:0 0 auto;width:19px;height:19px;border-radius:50%;\n  display:grid;place-items:center;font-size:11px;font-weight:600;\n  background:rgba(var(--accent-rgb),.16);color:var(--accent);margin-top:1px;\n}\n.frule b{display:block;font-size:12.5px;font-weight:600;color:var(--accent);margin-bottom:3px}\n.frule span{font-size:11.5px;line-height:1.6;color:var(--fg3)}\n\n.fmake{display:flex;align-items:center;gap:10px;padding:13px 15px}\n.fmake .inp{flex:1;height:40px;font-size:15px;font-family:var(--sans)}\n.fmake .inp:not(.wide){min-width:0}\n\n/* 五步进度：一条横的传送带 */\n.fsteps{display:grid;grid-template-columns:repeat(5,1fr);gap:9px}\n.fstep{\n  display:flex;flex-direction:column;gap:3px;padding:10px 12px;border-radius:var(--r-md);\n  background:rgba(var(--w),.03);border:1px solid var(--glass-line);\n}\n.fstep .n{\n  font-size:10.5px;font-weight:600;color:var(--ghost);letter-spacing:.4px;\n}\n.fstep .t{font-size:12.5px;color:var(--fg2);display:flex;align-items:center;gap:6px}\n.fstep .s{font-size:11px;color:var(--ghost)}\n.fstep.done{background:rgba(var(--w),.05)}\n.fstep.done .n{color:var(--ok)}\n.fstep.done .t{color:var(--fg)}\n.fstep.now{border-color:rgba(var(--accent-rgb),.4);background:rgba(var(--accent-rgb),.09)}\n.fstep.now .n,.fstep.now .t{color:var(--accent)}\n.fstep .dot{width:7px;height:7px;border-radius:50%;background:rgba(var(--w),.16)}\n.fstep.done .dot{background:var(--ok)}\n.fstep.now .dot{background:var(--accent);box-shadow:0 0 0 3px rgba(var(--accent-rgb),.22)}\n\n/* 两列：左边造句子，右边交代这张卡是什么 */\n.fgrid{display:grid;grid-template-columns:minmax(0,1fr) 348px;gap:16px;align-items:start}\n.fmain,.fside{display:flex;flex-direction:column;gap:16px;min-width:0}\n\n/* 例句池 */\n.fpool{margin-top:6px;border-top:1px solid var(--line)}\n.fp{\n  display:flex;align-items:center;gap:10px;padding:10px 6px;\n  border-bottom:1px solid rgba(var(--w),.05);\n}\n.fp .fp-s{font-size:14.5px;color:var(--fg);flex:1;min-width:0}\n.fp .fp-s b{font-weight:600;color:var(--accent);border-bottom:1px solid rgba(var(--accent-rgb),.45)}\n.fp .fp-z{width:170px;font-size:11.5px;color:var(--ghost);flex:0 0 auto}\n.fp .chip{flex:0 0 auto}\n.fp.on{background:rgba(var(--accent-rgb),.07);border-radius:var(--r-sm);padding-left:10px;padding-right:10px}\n.fp .num{\n  flex:0 0 auto;width:18px;text-align:right;font-size:11px;color:var(--ghost);\n  font-variant-numeric:tabular-nums;\n}\n.fp.on .num{color:var(--accent)}\n\n/* 选中那一句 + 三张候选图 */\n.fsent{font-size:21px;line-height:1.45;color:var(--fg);letter-spacing:-.01em}\n.fsent b{font-weight:600;color:var(--accent)}\n.fpick{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:2px}\n.ftile{\n  position:relative;border-radius:var(--r-md);overflow:hidden;cursor:pointer;\n  border:1px solid var(--glass-line);background:var(--lowest);aspect-ratio:4 / 3;\n}\n.ftile img{width:100%;height:100%;object-fit:cover;display:block;opacity:.72;transition:opacity .16s}\n.ftile:hover img{opacity:.92}\n.ftile.on{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)}\n.ftile.on img{opacity:1}\n.fcap{\n  position:absolute;left:8px;bottom:8px;font-size:11px;font-weight:600;\n  padding:3px 8px;border-radius:999px;color:var(--fg2);\n  background:rgba(12,15,20,.72);\n}\n.ftile.on .fcap{background:var(--accent);color:var(--on-accent)}\n\n/* 语音那一行 */\n.fvoice{display:flex;align-items:center;gap:10px;flex-wrap:wrap}\n.fvoice .sel{flex:1;min-width:220px;border-radius:10px}\n.fdef{font-size:14px;line-height:1.65;color:var(--fg2);margin-top:9px}\n\n/* 五个面 */\n.f5{display:flex;flex-direction:column;margin-top:8px}\n.f5r{\n  display:flex;align-items:center;gap:9px;padding:8px 0;\n  border-bottom:1px solid rgba(var(--w),.05);\n}\n.f5r:last-child{border-bottom:0}\n.f5n{\n  flex:0 0 auto;width:22px;font-size:13px;font-weight:600;color:var(--fg3);\n}\n.f5io{flex:1;font-size:11.5px;color:var(--ghost)}\n.f5r.ok .f5n{color:var(--fg)}\n.f5r.warn .f5n{color:var(--warn)}\n\n.actbar .mut{font-size:11.5px}\n\n/* 句子那一列要留够宽：标题不折行，挤的时候先把「一句话大意」和那行长说明收起来 */\n.fpool .sec-title{white-space:nowrap}\n@media (max-width:1240px){\n  .fhint{display:none}\n  .fp .fp-z{display:none}\n}\n\n/* 窄一点就把右栏收到下面；五步那条一直保持五格 —— 它是页面的骨架，折成两排会散 */\n@media (max-width:1000px){\n  .fgrid{grid-template-columns:minmax(0,1fr)}\n  .fside{position:static}\n  .fstep{padding:9px 10px}\n  .fstep .s{display:none}\n}\n@media (max-width:760px){\n  .fsteps{grid-template-columns:repeat(2,1fr)}\n  .fpick{grid-template-columns:1fr}\n  .frule{grid-template-columns:1fr}\n}\n/* 右栏跟着滚：左栏长（八条例句 + 挑中的那一句），右边不能一滚就空掉 */\n.fside{position:sticky;top:10px}\n/* ══ 全局：小问号 + 弹出小窗（v30）══════════════════════════\n   页面上的解释字都收进问号里。点一下贴在按钮旁边，点别处就收。\n   内容写在页面里的 <div class=\"pop\" id=\"...\"> 里，JS 只负责搬。 */\n.q{\n  flex:0 0 auto;width:16px;height:16px;border-radius:50%;padding:0;\n  display:inline-grid;place-items:center;font:600 10.5px/1 var(--sans);\n  color:var(--ghost);background:rgba(var(--w),.06);\n  border:1px solid var(--glass-line);cursor:pointer;transition:color .14s,border-color .14s;\n}\n.q:hover,.q.on{color:var(--fg);border-color:rgba(var(--w),.24)}\n.q.lg{width:19px;height:19px;font-size:11.5px}\n.pop{display:none}\n.popbox{\n  position:fixed;z-index:80;padding:12px 14px;border-radius:14px;\n  background:#20242C;border:1px solid rgba(var(--w),.13);\n  box-shadow:0 20px 50px rgba(0,0,0,.5);\n  font-size:12px;line-height:1.7;color:var(--fg3);\n}\n:host([data-theme=\"light\"]) .popbox{background:#FFF}\n.popbox b{display:block;font-size:12.5px;font-weight:600;color:var(--fg);margin-bottom:5px}\n.popbox u{text-decoration:none;color:var(--accent)}\n.popbox code{font-family:var(--mono);font-size:11px;color:var(--accent);background:rgba(var(--accent-rgb),.12);padding:1px 5px;border-radius:5px}\n.popbox .pl{margin:7px 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:5px}\n.popbox .pl li{display:flex;gap:7px}\n.popbox .pl li::before{content:\"\";flex:0 0 auto;width:4px;height:4px;border-radius:50%;background:var(--accent);margin-top:8px}\n\n/* 词胶囊：句子以外只看这一个词，点开才展开解释 */\n.wchip{\n  display:inline-flex;align-items:center;gap:6px;padding:4px 11px;border-radius:999px;\n  font:600 12.5px/1.4 var(--sans);color:var(--fg2);letter-spacing:.2px;\n  background:rgba(var(--w),.05);border:1px solid var(--glass-line);cursor:pointer;\n}\n.wchip:hover,.wchip.on{color:var(--fg);border-color:rgba(var(--w),.22)}\n.wchip i{font-style:normal;color:var(--ghost);font-size:10px}\n\n/* 五个面：横向就绪点，顺序固定 听 说 读 写 改 */\n/* 五个面的状态小点（工厂页句子行用） - 统一使用渐变效果 */\n.f5row{display:flex;gap:13px;align-items:center}\n.f5row .fi{\n  display:flex;align-items:center;gap:6px;\n  font-size:11.5px;color:var(--ghost);font-weight:500;\n}\n.f5row .fi.on{color:var(--fg2)}\n/* 工厂页用 .pd 类名，样式和 .pip 完全一致 */\n.f5row .fi .pd{\n  width:10px;height:10px;\n  border-radius:50%;\n  background:linear-gradient(135deg, rgba(var(--w),.22), rgba(var(--w),.12));\n  box-shadow:inset 0 0.5px 1px rgba(255,255,255,.15), 0 1px 2px rgba(0,0,0,.15);\n  position:relative;\n}\n.f5row .fi.ok .pd{\n  background:linear-gradient(135deg, #82C282, #6BB76B);\n  box-shadow:inset 0 0.5px 1px rgba(255,255,255,.3), 0 1px 2px rgba(107,183,107,.25);\n}\n.f5row .fi.warn .pd{\n  background:linear-gradient(135deg, #E0BA6E, #D4A558);\n  box-shadow:inset 0 0.5px 1px rgba(255,255,255,.3), 0 1px 2px rgba(212,165,88,.25);\n}\n.f5row .fi.now .pd{\n  background:linear-gradient(135deg, #AAC3F5, var(--accent));\n  box-shadow:inset 0 0.5px 1px rgba(255,255,255,.35), 0 0 0 2px rgba(var(--accent-rgb),.25), 0 2px 4px rgba(var(--accent-rgb),.2);\n  animation:pip-pulse 2s ease-in-out infinite;\n}\n\n/* 练习页：默认灰但能按的控件 */\n.btn.dim{opacity:.5}\n.btn.dim:hover{opacity:.8}\n.typebox.dim{border-color:rgba(var(--w),.1);color:var(--ghost)}\n.typebox.dim:focus{color:var(--fg)}\n\n/* ══ 工厂 v4：优化视觉层级和交互反馈 ═════════════════════════ */\n\n/* 左侧单词索引 */\n.windex{display:flex;flex-direction:column;gap:3px;padding-right:6px}\n.windex .wi{\n  display:flex;align-items:baseline;gap:10px;padding:10px 12px;border-radius:11px;cursor:pointer;\n  border:1px solid transparent;transition:all .18s ease;\n}\n.windex .wi:hover{\n  background:rgba(var(--w),.06);\n  border-color:rgba(var(--w),.08);\n  transform:translateX(2px);\n}\n.windex .wi.on{\n  background:rgba(var(--accent-rgb),.12);\n  border-color:rgba(var(--accent-rgb),.32);\n  box-shadow:inset 0 1px 0 rgba(var(--w),.08), 0 2px 8px rgba(var(--accent-rgb),.15);\n}\n.windex .wi b{font-size:14.5px;font-weight:600;color:var(--fg);letter-spacing:-.01em}\n.windex .wi.on b{color:var(--accent)}\n.windex .wi span{margin-left:auto;font-size:11.5px;color:var(--ghost);white-space:nowrap}\n\n/* 一条句子 = 一个 <details>，收起时只有一行 */\n.wrow{\n  border-bottom:1px solid rgba(var(--w),.05);\n  transition:background .2s ease;\n  margin-bottom:1px;\n}\n.wrow>summary{\n  display:flex;align-items:center;gap:14px;padding:12px 6px;cursor:pointer;list-style:none;\n  transition:all .18s ease;border-radius:11px;\n}\n.wrow>summary::-webkit-details-marker{display:none}\n.wrow>summary:hover{\n  background:rgba(var(--w),.055);\n  padding-left:10px;padding-right:10px;\n  box-shadow:0 1px 4px rgba(var(--shadow),.08);\n}\n.wrow .ws{\n  flex:1;min-width:0;font-size:15px;color:var(--fg2);line-height:1.5;\n  transition:color .18s ease;\n}\n.wrow>summary:hover .ws{color:var(--fg)}\n.wrow .ws b{\n  font-weight:600;color:var(--accent);\n  border-bottom:1.5px solid rgba(var(--accent-rgb),.5);\n  padding-bottom:1px;\n}\n.wrow .wmeta{flex:0 0 auto;display:flex;align-items:center;gap:16px}\n.wrow[open]>summary{\n  background:rgba(var(--w),.065);\n  border-radius:11px 11px 0 0;\n  padding-left:10px;padding-right:10px;\n  margin-bottom:-1px;\n}\n/* 展开后的内容区域 */\n.wbody{\n  padding:0 10px 18px 10px;\n  display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:18px;\n  background:rgba(var(--w),.035);\n  border-radius:0 0 11px 11px;\n  border-top:1px solid rgba(var(--w),.08);\n}\n.wbody .wlonely{grid-column:1 / -1}\n\n/* 展开内容的子卡片 */\n.wsec{\n  border:1px solid rgba(var(--w),.1);\n  border-radius:12px;\n  padding:14px 16px;\n  background:rgba(var(--w),.04);\n  transition:all .2s ease;\n  box-shadow:0 1px 3px rgba(var(--shadow),.06);\n}\n.wsec:hover{\n  border-color:rgba(var(--w),.15);\n  box-shadow:0 2px 6px rgba(var(--shadow),.1);\n  background:rgba(var(--w),.055);\n}\n.wsec h4{\n  margin:0 0 11px;\n  font-size:13px;\n  font-weight:600;\n  color:var(--fg);\n  display:flex;\n  align-items:center;\n  gap:8px;\n  letter-spacing:-.005em;\n}\n\n/* 五个面在工厂里的就绪清单 */\n.flist{display:flex;flex-direction:column;gap:1px}\n.fline{\n  display:flex;align-items:center;gap:10px;padding:9px 0;\n  border-bottom:1px solid rgba(var(--w),.06);font-size:12.5px;\n}\n.fline:last-child{border-bottom:0}\n.fline .fn{\n  flex:0 0 auto;width:24px;font-weight:600;\n  color:var(--fg);font-size:13px;\n}\n.fline .fio{flex:1;color:var(--fg3);font-size:12px;line-height:1.5}\n\n/* 图的四个来源 */\n.src4{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:12px}\n.src4 button{\n  display:flex;flex-direction:column;gap:4px;align-items:flex-start;text-align:left;\n  padding:10px 12px;border-radius:11px;font:inherit;font-size:11.5px;color:var(--fg3);\n  background:rgba(var(--w),.045);border:1px solid rgba(var(--w),.1);cursor:pointer;\n  transition:all .18s ease;\n}\n.src4 button:hover{\n  color:var(--fg2);border-color:rgba(var(--w),.2);\n  background:rgba(var(--w),.07);\n  transform:translateY(-1px);\n  box-shadow:0 2px 6px rgba(var(--shadow),.08);\n}\n.src4 button b{font-size:12.5px;font-weight:600;color:var(--fg)}\n.src4 button.on{\n  border-color:rgba(var(--accent-rgb),.55);\n  background:rgba(var(--accent-rgb),.12);\n  box-shadow:inset 0 1px 0 rgba(var(--w),.08), 0 0 0 2px rgba(var(--accent-rgb),.1);\n}\n.src4 button.on b{color:var(--accent)}\n\n/* 候选图网格 */\n.shots{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}\n.shots .s{\n  position:relative;aspect-ratio:4 / 3;border-radius:11px;overflow:hidden;cursor:pointer;\n  border:2px solid rgba(var(--w),.1);background:var(--lowest);\n  transition:all .2s ease;\n}\n.shots .s:hover{\n  border-color:rgba(var(--accent-rgb),.35);\n  transform:scale(1.02);\n  box-shadow:0 4px 12px rgba(var(--shadow),.12);\n}\n.shots .s img{width:100%;height:100%;object-fit:cover;display:block;opacity:.75;transition:opacity .2s ease}\n.shots .s:hover img{opacity:.9}\n.shots .s.on{\n  border-color:var(--accent);\n  box-shadow:0 0 0 2px rgba(var(--accent-rgb),.25), 0 4px 12px rgba(var(--accent-rgb),.2);\n  transform:scale(1.01);\n}\n.shots .s.on img{opacity:1}\n.shots .s em{\n  position:absolute;left:8px;bottom:8px;font-style:normal;font-size:11px;font-weight:600;\n  padding:3px 9px;border-radius:999px;background:rgba(12,15,20,.8);color:var(--fg2);\n  backdrop-filter:blur(8px);\n  transition:all .2s ease;\n}\n.shots .s.on em{background:var(--accent);color:var(--on-accent);transform:scale(1.05)}\n\n/* 音色选择列表 */\n.voicepick{display:flex;flex-direction:column;gap:7px}\n.voicepick .vr{\n  display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:11px;\n  border:1px solid rgba(var(--w),.1);background:rgba(var(--w),.04);\n  cursor:pointer;transition:all .18s ease;\n}\n.voicepick .vr:hover{\n  border-color:rgba(var(--w),.18);\n  background:rgba(var(--w),.065);\n  box-shadow:0 1px 4px rgba(var(--shadow),.08);\n}\n.voicepick .vr.on{\n  border-color:rgba(var(--accent-rgb),.48);\n  background:rgba(var(--accent-rgb),.11);\n  box-shadow:inset 0 1px 0 rgba(var(--w),.08), 0 0 0 2px rgba(var(--accent-rgb),.1);\n}\n.voicepick .vr b{font-size:13px;color:var(--fg);line-height:1.4}\n.voicepick .vr.on b{color:var(--accent)}\n.voicepick .vr .vt{font-size:11.5px;color:var(--ghost)}\n.voicepick .vg{\n  font-size:11px;font-weight:600;letter-spacing:.6px;\n  color:var(--ghost);margin:8px 0 3px;text-transform:uppercase;\n}\n\n@media (max-width:1080px){\n  .wbody{grid-template-columns:minmax(0,1fr)}\n  .src4{grid-template-columns:repeat(2,minmax(0,1fr))}\n}\n/* ══ 练的五个面（v30）══════════════════════════════════════ */\n.shot{\n  display:block;width:100%;max-width:780px;max-height:38vh;object-fit:cover;\n  border-radius:var(--r-lg);border:1px solid var(--glass-line);background:var(--lowest);\n  box-shadow:0 2px 8px rgba(var(--shadow),.15);\n  transition:transform .2s ease, box-shadow .2s ease;\n}\n.shot:hover{\n  transform:scale(1.01);\n  box-shadow:0 4px 16px rgba(var(--shadow),.22);\n}\n.writein{flex:0 0 auto;min-width:0;width:min(100%,560px);height:46px;padding:0 16px;font-size:14px;\n  transition:border-color .2s ease, background .2s ease;}\n.writein:focus{\n  border-color:rgba(var(--accent-rgb),.6);\n  background:rgba(var(--w),.08);\n}\n.writein.dim{opacity:.55}\n.writein.dim:focus{opacity:1}\n.reveal>summary{\n  list-style:none;cursor:pointer;display:inline-flex;align-items:center;gap:7px;\n  transition:color .15s ease;\n}\n.reveal>summary:hover{color:var(--fg)}\n.reveal>summary::-webkit-details-marker{display:none}\n.reveal>summary::after{content:\"▾\";font-size:10px;color:var(--ghost);margin-left:2px;transition:transform .2s ease}\n.reveal[open]>summary::after{content:\"▴\";transform:rotate(180deg)}\n.reveal[open]>summary{color:var(--fg)}\n.stage .row{align-items:center}\n/* 播放键 / 波形 / 录音钮 —— 老页面用了这三组类，但 app.css 里一直没有它们 */\n.play{\n  flex:0 0 auto;width:46px;height:46px;border-radius:50%;display:grid;place-items:center;\n  background:rgba(var(--accent-rgb),.14);border:1px solid rgba(var(--accent-rgb),.38);\n  color:var(--accent);cursor:pointer;transition:background .14s,transform .14s, box-shadow .2s;\n  box-shadow:0 2px 8px rgba(var(--accent-rgb),.2);\n}\n.play:hover{\n  background:rgba(var(--accent-rgb),.22);\n  box-shadow:0 4px 12px rgba(var(--accent-rgb),.3);\n  transform:scale(1.05);\n}\n.play:active{transform:scale(.96);box-shadow:0 1px 4px rgba(var(--accent-rgb),.25)}\n.play svg{width:18px;height:18px;fill:currentColor;margin-left:2px}\n.wave{flex:1 1 auto;display:flex;align-items:center;gap:2px;height:38px;min-width:200px}\n.wave i{flex:1 1 2px;max-width:3px;border-radius:99px;background:rgba(var(--w),.16);\n  transition:background .2s ease, height .15s ease}\n.wave i.on{background:var(--accent);animation:wave-pulse .6s ease-in-out infinite alternate}\n@keyframes wave-pulse{to{opacity:.7}}\n.rec{\n  width:78px;height:78px;border-radius:50%;display:grid;place-items:center;cursor:pointer;\n  background:rgba(var(--accent-rgb),.16);border:1px solid rgba(var(--accent-rgb),.4);\n  color:var(--accent);box-shadow:0 0 0 6px rgba(var(--accent-rgb),.05);\n  transition:transform .2s ease, box-shadow .2s ease;\n}\n.rec:hover{\n  transform:scale(1.05);\n  box-shadow:0 0 0 8px rgba(var(--accent-rgb),.12), 0 4px 12px rgba(var(--accent-rgb),.2);\n}\n.rec:active{transform:scale(.98)}\n.rec svg{width:26px;height:26px;fill:currentColor}\n.reclab{font-size:12px;color:var(--ghost);margin-top:8px}\n/* 练的这几屏内容比工厂少，间距收一点才装得下一屏 */\n.screen:has(>.strip) .stage{gap:16px;padding:8px 0 4px;min-height:0;overflow:visible}\n.screen:has(>.strip) .stage .cue{max-width:860px}\n\n/* 工厂页网格布局 + 输入框 + 义项标题 */\n.fgrid{grid-template-columns:220px minmax(0,1fr);gap:24px}\n.fgoal{\n  display:flex;align-items:center;gap:10px;padding:12px 15px;border-radius:14px;\n  border:1px solid rgba(var(--w),.12);background:rgba(var(--w),.045);\n  box-shadow:inset 0 1px 0 rgba(var(--w),.05);\n  transition:all .2s ease;\n}\n.fgoal:focus-within{\n  border-color:rgba(var(--accent-rgb),.35);\n  background:rgba(var(--w),.06);\n  box-shadow:inset 0 1px 0 rgba(var(--w),.08), 0 0 0 3px rgba(var(--accent-rgb),.08);\n}\n.fgoal .inp{flex:0 1 300px;min-width:120px}\n.fgoal .btn.primary{margin-left:4px}\n\n/* 义项标题：增强对比度，加大留白 */\n.wgh{\n  display:flex;align-items:baseline;gap:10px;\n  margin:28px 0 8px;padding-bottom:8px;\n  font-size:13px;font-weight:600;color:var(--fg);\n  border-bottom:1px solid rgba(var(--w),.1);\n  letter-spacing:.01em;\n}\n.wgh:first-of-type{margin-top:12px}\n.wgh span{margin-left:auto;font-weight:400;font-size:11.5px;color:var(--ghost)}\n.windex{padding-right:6px}\n.wrow>summary{touch-action:manipulation}\n@media (max-width:1000px){\n  .fgrid{grid-template-columns:minmax(0,1fr)}\n  .windex{flex-direction:row;overflow-x:auto;gap:8px;padding-bottom:6px}\n  .windex .wi{flex:0 0 auto}\n}\n/* ───────── 工厂 v4：收起来干净，打开来给足旋钮 ─────────\n   收起态只有：序号 · 句子 · 一条五格进度 · 词数 · 两个小按钮。\n   五个面的字、图、声、变体全在展开态，展开态是 2×2 四块面板。 */\n\n.whead{display:flex;align-items:baseline;gap:9px;padding-bottom:10px;flex-wrap:wrap}\n.whead h2{margin:0;font-size:20px}\n\n.wrow{margin-bottom:2px}\n.wrow>summary{\n  display:flex;align-items:center;gap:12px;\n  padding:11px 12px;border-radius:var(--r-md);\n  cursor:pointer;list-style:none;\n}\n.wrow>summary::-webkit-details-marker{display:none}\n.wrow>summary:hover{background:rgba(var(--w),.032)}\n.wrow[open]>summary{background:rgba(var(--w),.045);box-shadow:inset 2px 0 0 var(--accent)}\n.wn{\n  flex:0 0 18px;text-align:right;font-size:11px;color:var(--ghost);\n  font-variant-numeric:tabular-nums;\n}\n.ws{flex:1 1 auto;min-width:0;font-size:15px;line-height:1.45;color:var(--fg)}\n.ws b{color:var(--accent);font-weight:600}\n.wmeta{flex:0 0 auto;display:flex;align-items:center;gap:12px}\n\n/* 五格进度：不收标签，只收颜色。字留到展开态 */\n.pips{display:flex;align-items:center;gap:3px}\n.pips i{width:16px;height:5px;border-radius:99px;background:rgba(var(--w),.16);box-shadow:inset 0 0 0 1px rgba(var(--w),.05)}\n.pips i.ok{background:var(--ok)}\n.pips i.warn{background:var(--warn)}\n.pips i.bad{background:var(--bad)}\n.wchip{\n  font-size:11px;color:var(--ghost);font-variant-numeric:tabular-nums;\n  padding:2px 6px;border-radius:6px;background:rgba(var(--w),.045);\n}\n.wact{display:flex;gap:2px;opacity:.55;transition:opacity .14s}\n.wrow>summary:hover .wact,.wrow[open]>summary .wact{opacity:1}\n.icobtn{\n  width:26px;height:26px;display:grid;place-items:center;\n  border-radius:7px;border:1px solid transparent;background:none;\n  color:var(--fg2);font-size:12px;cursor:pointer;line-height:1;\n}\n.icobtn:hover{background:rgba(var(--w),.07);border-color:var(--glass-line);color:var(--fg)}\n\n/* 展开态 */\n.wb{padding:2px 12px 14px 42px}\n.wb4{display:flex;gap:12px;align-items:flex-start}\n.wcol{flex:1 1 0;min-width:0;display:flex;flex-direction:column;gap:12px}\n.wcol:first-child{flex:1.42 1 0}\n.wblk{\n  min-width:0;display:flex;flex-direction:column;gap:9px;\n  padding:12px 13px;border-radius:var(--r-md);\n  background:rgba(var(--w),.028);border:1px solid var(--glass-line);\n}\n.wbh{\n  display:flex;align-items:center;gap:6px;\n  font-size:12px;font-weight:600;color:var(--fg2);\n}\n.wbh .q{width:15px;height:15px;font-size:10px}\n\n/* 小按钮：这一版的主角，页面上的旋钮都长这样 */\n.mini{\n  padding:3px 9px;border-radius:7px;font-size:11.5px;line-height:1.5;\n  border:1px solid var(--glass-line);background:rgba(var(--w),.03);\n  color:var(--fg2);cursor:pointer;white-space:nowrap;\n}\n.mini:hover{background:rgba(var(--w),.07);color:var(--fg)}\n.mini.on{background:rgba(var(--accent-rgb),.16);border-color:rgba(var(--accent-rgb),.4);color:var(--accent)}\n\n/* 五面：一行一个面，左边一个开关 */\n.frow5{display:flex;flex-direction:column;gap:1px}\n.fr{\n  display:flex;align-items:center;gap:9px;\n  padding:6px 7px;border-radius:8px;font-size:13px;\n}\n.fr:hover{background:rgba(var(--w),.04)}\n.fr b{flex:0 0 auto;width:16px;font-weight:600;color:var(--fg)}\n.fr .fio{flex:1 1 auto;min-width:0;font-size:11.5px;color:var(--ghost)}\n.sw{\n  flex:0 0 auto;width:26px;height:15px;border-radius:99px;position:relative;\n  background:rgba(var(--w),.14);cursor:pointer;\n}\n.sw::after{\n  content:'';position:absolute;top:2px;left:2px;width:11px;height:11px;\n  border-radius:50%;background:var(--fg3);transition:transform .14s,background .14s;\n}\n.sw.on{background:rgba(var(--accent-rgb),.42)}\n.sw.on::after{transform:translateX(11px);background:var(--accent)}\n\n/* 图：四个来路做成小分段，缩略图一行 */\n.seg4{display:flex;gap:3px;padding:3px;border-radius:9px;background:rgba(var(--w),.05)}\n.seg4 button{\n  flex:1 1 0;min-width:0;padding:4px 2px;border-radius:6px;border:none;background:none;\n  font-size:11px;color:var(--fg2);cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;\n}\n.seg4 button:hover{background:rgba(var(--w),.06)}\n.seg4 button.on{background:rgba(var(--accent-rgb),.18);color:var(--accent);font-weight:600}\n\n.shots{display:flex;gap:6px}\n.shots .s{position:relative;flex:1 1 0;min-width:0;border-radius:9px;overflow:hidden;border:1px solid var(--glass-line);cursor:pointer}\n.shots .s img{display:block;width:100%;height:74px;object-fit:cover}\n.shots .s.on{border-color:var(--accent);box-shadow:0 0 0 1px rgba(var(--accent-rgb),.5)}\n.shots .s em{\n  position:absolute;left:0;right:0;bottom:0;padding:3px 0;text-align:center;\n  font-style:normal;font-size:10.5px;color:var(--fg);background:rgba(12,14,18,.72);\n}\n\n/* 声 */\n.vline{display:flex;align-items:center;gap:8px;font-size:12px}\n.vline .sel.sm{flex:1 1 auto;min-width:0;font-size:12px;padding:5px 8px}\n.vt{font-size:11px;color:var(--ghost);font-variant-numeric:tabular-nums}\n.vopts{display:flex;flex-wrap:wrap;gap:5px}\n\n.wfoot{\n  display:flex;align-items:center;gap:8px;margin-top:11px;\n  padding-top:11px;border-top:1px solid var(--glass-line);\n}\n.btn.sm{padding:5px 12px;font-size:12.5px}\n\n@media (max-width:1000px){\n  .wb{padding-left:12px}\n  .wb4{flex-direction:column}\n  .wcol{flex:1 1 auto;width:100%}\n}\n@media (max-width:640px){\n  .wrow>summary{gap:8px;padding:10px 8px}\n  .pips i{width:10px}\n  .wchip{display:none}\n  .wb{padding:2px 4px 12px 4px}\n}\n/* 每个面自己也有一个「⋯」：只在悬停这一行时出现，不占地方但随时能展开 */\n.fr .ftab{margin-left:2px;opacity:0;width:22px;height:22px;font-size:11px}\n.fr:hover .ftab{opacity:.7}\n.fr .ftab:hover{opacity:1}\n/* 图面板里的关键词行 + 输入框小号 */\n.kwrow{display:flex;gap:5px}\n.kwrow .inp.sm{flex:1 1 auto;min-width:0;font-size:12px;padding:5px 8px;height:auto}\n/* 窄屏：顶栏那几个导航和数据列都得能挤下去，否则一个字一行 */\n@media (max-width:640px){\n  .topbar .nav,.topbar .tabs,.seg,.seg span{white-space:nowrap}\n  .fgrid{grid-template-columns:minmax(0,1fr)}\n  .windex{display:flex;flex-wrap:nowrap;overflow-x:auto;align-items:center}\n  .windex .wi{flex:0 0 auto}\n  .windex .mut,.windex .q{white-space:nowrap;flex:0 0 auto}\n  .fr .fio{display:none}\n}\n/* ───────── 自绘下拉（pick.js）─────────\n   原生 select 的弹出层跟着系统走，深色页面里是白底浅灰字，看不清也改不了。\n   这里把 select 本体藏起来（仍然在 DOM 里、值仍然有效），换成按钮 + 面板。 */\n.pick{position:relative;display:inline-flex;min-width:0;max-width:100%}\nselect.picknative{\n  position:absolute;inset:0;opacity:0;pointer-events:none;\n  width:100%;height:100%;\n}\n.pickbtn{\n  display:flex;align-items:center;gap:8px;width:100%;min-width:0;\n  padding:6px 10px;border-radius:9px;cursor:pointer;\n  border:1px solid var(--glass-line);background:rgba(var(--w),.04);\n  color:var(--fg);font-size:12.5px;line-height:1.5;text-align:left;\n}\n.pickbtn:hover{background:rgba(var(--w),.07)}\n.pickbtn:focus-visible{outline:2px solid rgba(var(--accent-rgb),.55);outline-offset:1px}\n.picktxt{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.pickbtn.empty .picktxt{color:var(--ghost)}\n.pickbtn .caret{\n  flex:0 0 auto;width:0;height:0;margin-top:-2px;\n  border-left:4px solid transparent;border-right:4px solid transparent;\n  border-top:5px solid var(--fg3);transition:transform .14s;\n}\n.pick.open .pickbtn .caret{transform:rotate(180deg)}\n\n.pickmenu{\n  position:absolute;z-index:60;top:calc(100% + 5px);left:0;min-width:100%;width:max-content;\n  max-width:min(440px,86vw);max-height:260px;overflow:auto;\n  padding:4px;border-radius:11px;\n  background:#20242c;border:1px solid rgba(var(--w),.14);\n  box-shadow:0 14px 34px rgba(0,0,0,.5),0 2px 6px rgba(0,0,0,.4);\n}\n.pickmenu.up{bottom:calc(100% + 5px);top:auto}\n.pickmenu[hidden]{display:none}\n.pickitem{\n  position:relative;padding:7px 26px 7px 10px;border-radius:7px;font-size:12.5px;line-height:1.45;\n  color:var(--fg2);cursor:pointer;\n}\n.pickitem:hover,.pickitem.focus{background:rgba(var(--w),.07);color:var(--fg)}\n.pickitem.on{color:var(--accent);font-weight:600}\n.pickitem.on::after{content:'✓';position:absolute;right:9px;top:50%;transform:translateY(-50%);font-weight:400}\n\n/* 放进表格行 / 设置行里时别把行撑高 */\n.srow .pick,.sr .pick{width:100%}\n.sr .pickbtn{padding:7px 10px}\n/* ── 图表的第二轮：环图、面积图、柱图 ───────────── */\n/* 环图：分段之间留缝；底色用一圈很淡的轨道 */\n.donut circle{fill:none!important}\n.donut .dtrack{stroke:rgba(var(--w),.055);filter:none}\n.donut .dc{transition:stroke-width .18s ease,opacity .18s ease}\n.donut:hover .dc{stroke-width:20}\n.donut .dc:hover{stroke-width:23}\n/* 环图旁边的图例：用 grid 把 数字 / 百分比 两列对齐 */\n.donutwrap{display:flex;align-items:center;gap:44px;justify-content:center;flex-wrap:wrap}\n.legend{flex:0 1 430px;min-width:300px;display:flex;flex-direction:column;gap:2px;margin:0;padding:0;list-style:none}\n.legend li{\n  display:grid;grid-template-columns:9px minmax(0,1fr) 58px 46px;\n  align-items:center;gap:10px;padding:7px 10px 7px 8px;border-radius:9px;\n  font-size:12.5px;color:var(--fg2);\n}\n.legend li:hover{background:rgba(var(--w),.035)}\n.legend li i{width:9px;height:9px;border-radius:3px;display:block}\n.legend li b{text-align:right;font-weight:600;color:var(--fg);font-variant-numeric:tabular-nums}\n.legend li .mut{text-align:right;font-size:11.5px;color:var(--ghost);font-variant-numeric:tabular-nums}\n.legend li.tot{border-top:1px solid var(--glass-line);border-radius:0;margin-top:4px;padding-top:10px;grid-template-columns:minmax(0,1fr) 58px 46px}\n.legend li.tot .mut:first-child{grid-column:1;color:var(--fg2)}\n/* 面积图：网格更淡、刻度在右、末点带一圈光 */\n.gl{stroke:rgba(var(--w),.045);stroke-width:1;stroke-dasharray:none}\n.tx.ty{font-size:10.5px;fill:var(--ghost);opacity:.85}\n.line2{stroke-width:0;filter:none}\n.chart .line2{stroke:var(--s-blue2);stroke-width:2.2;stroke-linejoin:round;stroke-linecap:round;filter:drop-shadow(0 2px 8px rgba(78,127,229,.28))}\n.adot{fill:var(--s-blue2);stroke:rgba(var(--bg-bottom),1);stroke-width:1.6;filter:none}\n.adot-last{fill:#fff;stroke:var(--s-blue2);stroke-width:2.4;filter:drop-shadow(0 0 6px rgba(78,127,229,.55))}\n.ahit:hover + .adot,.chart:hover .adot{r:3.4}\n/* 柱图：渐变 + 悬停提亮 */\n.chart.bars .bar{transition:opacity .16s ease,filter .16s ease}\n.chart.bars .bar:hover{filter:brightness(1.16) saturate(1.05)}\n.chart.bars:hover .bar{opacity:.86}\n.chart.bars .bar:hover{opacity:1}\n.stk .bar{stroke:none}\n/* 基线：柱子不至于看着浮在半空 */\n.gbase{stroke:rgba(var(--w),.10);stroke-width:1}\n/* ── 图表入场动画 ─────────────────────────────\n   两态：\n   .cv-js  = 脚本活着，图先冻在起始帧（animation-play-state:paused），等滚进视野；\n   .cv-play = charts.js 判定「进视野了」，开始播。\n   脚本没加载 → 没有 .cv-js → 图直接是成品，不会空白。 */\n/* cv-reset：把动画整个摘掉一帧，再挂回去，动画才会从头开始（重播用） */\n.cv-reset .chart *, .cv-reset .heat rect{animation:none!important}\n.cv-js .chart *, .cv-js .heat rect{animation-play-state:paused}\n.cv-play .chart *, .cv-play .heat rect{animation-play-state:running}\n\n/* 柱子：慢速长起来，一根接一根 */\n@keyframes bar-grow{from{transform:scaleY(.02);opacity:.3}to{transform:scaleY(1);opacity:1}}\n.cv-js .bar, .cv-play .bar{animation:bar-grow .95s cubic-bezier(.22,.72,.3,1) both;animation-delay:var(--d,0ms)}\n.bar{transform-box:fill-box;transform-origin:bottom}\n\n/* 折线：从左往右连通（用 pathLength=\"1\" 归一化，不依赖具体长度） */\n@keyframes line-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}\n.cv-js .line2, .cv-play .line2{animation:line-draw 1.15s cubic-bezier(.4,.1,.35,1) .1s both}\n.line2{stroke-dasharray:1;stroke-dashoffset:1}\n\n/* 面积：跟着线一起浮上来 */\n@keyframes area-in{from{opacity:0}to{opacity:.88}}\n.cv-js .area2, .cv-play .area2{animation:area-in .9s ease .25s both}\n.area2{opacity:.88}\n\n/* 圆点：线画到哪儿，点弹到哪儿 */\n@keyframes dot-pop{from{opacity:0;transform:scale(.2)}to{opacity:1;transform:scale(1)}}\n.cv-js .adot, .cv-play .adot{animation:dot-pop .38s cubic-bezier(.34,1.56,.64,1) both;animation-delay:var(--d,0ms)}\n.adot{transform-box:fill-box;transform-origin:center}\n\n/* 环图：整圈转进来（旋转铺开），几段再依次亮 */\n@keyframes donut-spin{from{transform:rotate(-42deg) scale(.92);opacity:.15}to{transform:rotate(0) scale(1);opacity:1}}\n.cv-js .dspin, .cv-play .dspin{animation:donut-spin 1.05s cubic-bezier(.22,.61,.36,1) both;transform-box:fill-box;transform-origin:center}\n@keyframes donut-in{from{opacity:.25}to{opacity:1}}\n.cv-js .donut .dc, .cv-play .donut .dc{animation:donut-in .5s ease both;animation-delay:var(--d,0ms)}\n\n/* 热力图：一格一格，从左上往右下斜着铺 */\n@keyframes heat-in{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}\n.cv-js .heat rect, .cv-play .heat rect{animation:heat-in .5s cubic-bezier(.22,.61,.36,1) both;animation-delay:var(--d,0ms)}\n.heat rect{transform-box:fill-box;transform-origin:center}\n\n/* 图例 / 中心数字 / 表里的行 */\n@keyframes rise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}\n.cv-js .legend li, .cv-play .legend li{animation:rise .4s cubic-bezier(.22,.61,.36,1) both;animation-delay:var(--d,0ms)}\n.legend li:nth-child(1){--d:40ms}.legend li:nth-child(2){--d:90ms}.legend li:nth-child(3){--d:140ms}\n.legend li:nth-child(4){--d:190ms}.legend li:nth-child(5){--d:240ms}.legend li:nth-child(6){--d:290ms}\n.legend li:nth-child(7){--d:340ms}.legend li:nth-child(8){--d:390ms}.legend li:nth-child(9){--d:440ms}\n@keyframes fadein{from{opacity:0}to{opacity:1}}\n.cv-js .donut-big, .cv-play .donut-big{animation:fadein .5s ease .3s both}\n\n/* 不再按系统的 reduced-motion 关掉这些动画：动画本身就是内容的一部分。\n   想静止看数据，用页面右下角那个「动画」开关（默认开）。 */\n/* 「动画 · 开/关」开关关掉时，图直接是成品（静止但完整） */\n.cv-off .chart *, .cv-off .heat rect, .cv-off .legend li, .cv-off .donut-big{animation:none!important}\n\n/* ── 门控补丁（关键）───────────────────────────\n   下面这些图用的是 `.cv-js .bar, .cv-play .bar{animation:…}` 这种简写，\n   而 animation 简写会把 animation-play-state 重置成 running ——\n   于是上面那两条「paused / running」的门控对它们完全失效：\n   图在加载时就自己演完了，滚到那儿只剩结果。\n   这两条加 !important 钉住，并且 running 放后面（已播的卡两者都有，后者生效）。 */\n.cv-js .chart *, .cv-js .heat rect, .cv-js .legend li, .cv-js .donut-big{animation-play-state:paused!important}\n.cv-play .chart *, .cv-play .heat rect, .cv-play .legend li, .cv-play .donut-big{animation-play-state:running!important}\n\n\n/* 搜索层：窄屏底栏别断成三行 */\n@media (max-width:560px){\n  .pal-foot{flex-wrap:wrap;gap:8px 14px}\n  .pal-foot>span{white-space:nowrap}\n  .pal-foot .mut{display:none}\n  .pal-in{padding:13px 14px}\n  .pal-item{padding:8px 10px}\n}\n\n\n/* 组之间一条极淡的分隔线，扫读时不用靠空白猜 */\n.pal-body>.pal-sec:not(:first-child){border-top:1px solid rgba(var(--w),.055);margin-top:4px}\n\n\n/* 搜索层改成脚本注入后：hidden 要真的隐藏（.palmask 是 display:flex，会盖掉 hidden） */\n.palmask[hidden]{display:none!important}\n/* 顶栏搜索图标从 <a> 换成 <button>，把按钮默认外观抹掉 */\nbutton.iconbtn{background:none;border:0;padding:0;font:inherit;cursor:pointer}\n\n/* 结果里「当前页」那行：压暗一点，点它没意义 */\n.pal-item.here{color:var(--fg3)}\n.pal-item.here .mut{color:var(--fg3)}\n/* 搜索层：真输入框 + 最近搜索 chips + 命中排序 */\n.pal-q{\n  flex:1;background:none;border:0;outline:none;color:var(--fg);\n  font:inherit;font-size:14px;padding:0;\n}\n.pal-q::placeholder{color:var(--fg3)}\n.pal-sec-recent{display:flex;align-items:baseline;flex-wrap:wrap;gap:8px}\n.pal-sec-recent>span{flex:0 0 auto}\n.pal-clear{\n  background:none;border:0;padding:0;font:inherit;font-size:11px;color:var(--fg3);\n  cursor:pointer;margin-left:auto;\n}\n.pal-clear:hover{color:var(--fg2)}\n.pal-chips{flex:1 0 100%;display:flex;flex-wrap:wrap;gap:6px;padding:0 0 4px}\n.pal-chip{\n  background:rgba(var(--w),.06);border:1px solid rgba(var(--w),.08);border-radius:999px;\n  padding:4px 10px;font:inherit;font-size:11.5px;color:var(--fg2);cursor:pointer;\n}\n.pal-chip:hover{background:rgba(var(--w),.1);color:var(--fg)}\n.pal-empty{padding:22px 10px;font-size:12.5px;color:var(--fg3);text-align:center}\n\n/* ───────── 工厂 v5 ───────── */\n\n.btn.batch{\n  background:linear-gradient(180deg,#8aa9ff,#6f8bff);color:#0e1526;font-weight:700;\n  box-shadow:0 0 0 1px rgba(138,169,255,.55),0 6px 18px rgba(111,139,255,.28);\n}\n.btn.batch:hover{filter:brightness(1.06)}\n\n.fx-src{display:flex;align-items:center;gap:9px;padding:10px 13px;border-radius:14px;\n  border:1px solid var(--glass-line);background:rgba(var(--w),.03)}\n.fx-src .inp{flex:1 1 auto;min-width:120px}\n\n.fx-grid{display:grid;grid-template-columns:198px minmax(0,1fr);gap:22px;align-items:start;margin-top:20px}\n\n.fx-side{display:flex;flex-direction:column;gap:8px}\n.fx-sidehd{font-size:11px;font-weight:600;letter-spacing:.08em;color:var(--fg3);padding:0 4px}\n.fx-mini{display:flex;gap:5px}\n.fx-words{list-style:none;margin:2px 0 0;padding:0;display:flex;flex-direction:column;gap:2px}\n.fx-words li{display:flex;align-items:center;gap:8px;padding:7px 9px;border-radius:9px;cursor:pointer}\n.fx-words li:hover{background:rgba(var(--w),.04)}\n.fx-words li.on{background:rgba(var(--accent-rgb),.12);box-shadow:inset 2px 0 0 var(--accent)}\n.fx-words b{font-size:14px;font-weight:600;color:var(--fg)}\n.fdot{margin-left:auto;width:6px;height:6px;border-radius:50%;background:rgba(var(--w),.18)}\n.fdot.ok{background:var(--ok)}\n.fdot.half{background:var(--warn)}\n.fdot.none{background:rgba(var(--w),.22)}\n\n.fx-main{min-width:0;display:flex;flex-direction:column;gap:12px}\n.fx-wordhd{display:flex;align-items:baseline;gap:9px}\n.fx-wordhd h2{font-size:26px;font-weight:700;margin:0;letter-spacing:-.01em}\n.fx-wordhd .sp{flex:1 1 auto}\n.opt{opacity:.55}\n\n.fx-info{display:flex;align-items:center;gap:16px;flex-wrap:wrap;\n  padding:9px 12px;border-radius:11px;border:1px solid var(--glass-line);background:rgba(var(--w),.025);\n  font-size:12px;color:var(--fg3)}\n.fx-info b{color:var(--fg);font-weight:600;margin-right:3px;font-variant-numeric:tabular-nums}\n\n.fx-tools{display:flex;align-items:center;gap:6px;flex-wrap:wrap}\n.fx-tools .inp{width:190px}\n.fx-tools .sp{flex:1 1 auto}\n\n.fx-list{display:flex;flex-direction:column;gap:3px;border-top:1px solid var(--glass-line);padding-top:10px}\n.fx-grp{display:flex;align-items:baseline;gap:8px;margin:10px 0 2px;\n  font-size:12px;font-weight:600;color:var(--fg2)}\n.fx-grp span{margin-left:auto;font-weight:400;font-size:11px}\n\n.fx-row{border-radius:10px}\n.fx-row>summary{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:10px;cursor:pointer;list-style:none}\n.fx-row>summary::-webkit-details-marker{display:none}\n.fx-row>summary:hover{background:rgba(var(--w),.035)}\n.fx-row[open]>summary{background:rgba(var(--w),.05)}\n.fx-row .n{width:16px;text-align:right;font-size:11px;color:var(--ghost);font-variant-numeric:tabular-nums}\n.fx-row .s{flex:1 1 auto;min-width:0;font-size:15px;color:var(--fg);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.fx-row .s b{color:var(--accent);font-weight:600}\n.fx-row .wc{font-size:11px;color:var(--fg3)}\n.fx-row .ix{font-size:11px;color:var(--fg3)}\n.fx-row .more{color:var(--ghost);font-size:13px;padding:0 2px}\n.mini.xs{padding:3px 8px;font-size:11px}\n.mini.go{color:var(--ok)}\n.pips{display:flex;gap:2px}\n.pips i{width:9px;height:4px;border-radius:99px;background:rgba(var(--w),.14)}\n.pips i.ok{background:var(--ok)}\n.pips i.warn{background:var(--warn)}\n\n.fx-body{display:flex;gap:14px;padding:4px 6px 16px 26px;align-items:flex-start}\n.fx-left{flex:0 0 44%;min-width:0;display:flex;flex-direction:column;gap:10px}\n.fx-right{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:10px}\n.fx-blk{border:1px solid var(--glass-line);border-radius:12px;padding:10px 12px 12px;background:rgba(var(--w),.022)}\n.fx-bh{display:flex;align-items:center;gap:7px;margin-bottom:8px;font-size:12px;font-weight:600;color:var(--fg2)}\n.fx-bh .sp{flex:1 1 auto}\n\n.f5list{display:flex;flex-direction:column}\n.f5row{display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid rgba(var(--w),.045)}\n.f5row:first-child{border-top:0}\n.f5row b{font-size:13px;font-weight:600;width:16px;color:var(--fg)}\n.f5row .d{flex:1 1 auto;min-width:0;font-size:11.5px;color:var(--fg3)}\n.f5row em{font-size:11px;font-style:normal;padding:2px 7px;border-radius:99px}\n.f5row em.ok{color:var(--ok);background:rgba(87,199,123,.12)}\n.f5row em.warn{color:var(--warn);background:rgba(190,174,222,.14)}\n.sw{width:30px;height:17px;border-radius:99px;border:1px solid var(--glass-line);background:rgba(var(--w),.08);position:relative;cursor:pointer;flex:0 0 auto}\n.sw::after{content:'';position:absolute;top:2px;left:2px;width:11px;height:11px;border-radius:50%;background:var(--fg3);transition:left .14s,background .14s}\n.sw.on{background:rgba(var(--accent-rgb),.28)}\n.sw.on::after{left:15px;background:var(--accent)}\n.f5note{margin-top:8px;font-size:11px;color:var(--ghost)}\n.f5note b{color:var(--fg2)}\n\n.fx-right .src4{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-bottom:8px}\n.fx-right .kwrow{display:flex;gap:5px;margin-bottom:8px}\n.fx-right .kwrow .inp{flex:1 1 auto;min-width:0}\n.fx-right .shots{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}\n.fx-right .shots .s{position:relative;border-radius:8px;overflow:hidden;border:1px solid var(--glass-line);cursor:pointer}\n.fx-right .shots .s.on{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)}\n.fx-right .shots img{display:block;width:100%;height:66px;object-fit:cover}\n.fx-right .shots em{position:absolute;left:0;right:0;bottom:0;font-size:10px;font-style:normal;text-align:center;\n  padding:2px 0;background:rgba(10,12,16,.66);color:var(--fg2)}\n.fx-right .vopts{display:flex;gap:5px;margin-top:8px;flex-wrap:wrap}\n.fx-right .vline{display:flex;align-items:center;gap:8px;margin-bottom:8px}\n.fx-right .vline .sel{flex:1 1 auto;min-width:0}\n.fx-right .chips{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:7px}\n.fx-right .note{margin:7px 0 0;font-size:11px;line-height:1.55}\n\n/* ───────── 弹窗 ───────── */\n.msheet{position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;\n  background:rgba(6,8,12,.62);backdrop-filter:blur(3px);padding:24px}\n.msheet[hidden]{display:none!important}\n.mcard{width:min(560px,100%);max-height:calc(100vh - 48px);overflow:auto;\n  border-radius:16px;border:1px solid var(--glass-line);background:#1b1e26;\n  box-shadow:0 24px 70px rgba(0,0,0,.5)}\n.mcard.mc-wide{width:min(760px,100%)}\n.mhd{display:flex;align-items:baseline;gap:9px;padding:14px 16px 12px;border-bottom:1px solid var(--glass-line);position:sticky;top:0;background:#1b1e26;z-index:2}\n.mhd b{font-size:15px;font-weight:700}\n.mhd .mut{font-size:11px}\n.mx{margin-left:auto;background:none;border:0;color:var(--fg3);font-size:18px;line-height:1;cursor:pointer;padding:2px 4px}\n.mx:hover{color:var(--fg)}\n.mbody{padding:14px 16px 16px;display:flex;flex-direction:column;gap:10px}\n.mrow{display:flex;align-items:center;gap:8px;flex-wrap:wrap}\n.mrow .sp{flex:1 1 auto}\n.mtag{font-size:11px;color:var(--fg3);min-width:52px}\n.mta{width:100%;box-sizing:border-box;background:rgba(var(--w),.04);border:1px solid var(--glass-line);\n  border-radius:10px;color:var(--fg);font:13px/1.6 inherit;padding:10px 12px;resize:vertical}\n.mest{display:flex;gap:10px;flex-wrap:wrap;padding:10px 12px;border-radius:11px;background:rgba(var(--accent-rgb),.07);\n  border:1px solid rgba(var(--accent-rgb),.22)}\n.mest>div{display:flex;flex-direction:column;gap:3px;min-width:120px;flex:1 1 auto}\n.mest span{font-size:11px}\n.mest b{font-size:13px;font-weight:600}\n.mgrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}\n.mtile{border-radius:10px;overflow:hidden;border:1px solid var(--glass-line);cursor:pointer}\n.mtile.on{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)}\n.mtile img{display:block;width:100%;height:86px;object-fit:cover}\n.mtile span{display:block;font-size:10px;color:var(--fg3);padding:3px 6px 4px}\n.drop{border:1px dashed rgba(var(--w),.22);border-radius:12px;padding:22px 14px;text-align:center;\n  font-size:12px;color:var(--fg3);display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap}\n.eggs{display:flex;flex-direction:column;gap:6px}\n.egg{display:flex;align-items:center;gap:9px;padding:9px 11px;border-radius:10px;border:1px solid var(--glass-line);background:rgba(var(--w),.02)}\n.egg b{font-size:13px}\n.egg span{font-size:11px}\n.egg .sp{flex:1 1 auto}\n.ords{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:7px;font-size:12.5px;color:var(--fg2)}\n.ords b{color:var(--fg);font-weight:600;margin-right:7px}\n.dface{display:flex;gap:14px;align-items:flex-start}\n.dcard{flex:0 0 260px;border:1px solid var(--glass-line);border-radius:14px;background:rgba(var(--w),.03);padding:10px;display:flex;flex-direction:column;gap:8px}\n.dimg{position:relative;border-radius:10px;overflow:hidden}\n.dimg img{display:block;width:100%;height:130px;object-fit:cover}\n.dimg .mini{position:absolute;bottom:6px}\n.dimg .mini:first-of-type{left:6px}\n.dimg .mini:last-of-type{right:6px}\n.dhide{font-size:11px;color:var(--ghost);text-align:center;padding:6px 0;border-top:1px dashed rgba(var(--w),.1);border-bottom:1px dashed rgba(var(--w),.1)}\n.daudio{display:flex;align-items:center;gap:8px}\n.dnote{flex:1 1 auto;min-width:0;font-size:12.5px;line-height:1.65;color:var(--fg2)}\n.dnote p{margin:0 0 8px}\n.mbody-in{display:flex;gap:10px;flex-wrap:wrap;padding:10px 12px;border-radius:10px;background:rgba(var(--w),.03);border:1px solid var(--glass-line);font-size:12px}\n.mbody-in[hidden]{display:none!important}\n.mbody-in label{display:flex;align-items:center;gap:5px}\n.mbody-in .mut{flex-basis:100%;font-size:11px}\n.olist{display:flex;flex-direction:column;gap:2px;max-height:300px;overflow:auto}\n.olist label{display:flex;align-items:center;gap:9px;padding:7px 8px;border-radius:8px;font-size:13px}\n.olist label:hover{background:rgba(var(--w),.04)}\n.olist .s{flex:1 1 auto;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.olist em{font-size:11px;font-style:normal;white-space:nowrap}\n.olist em.ok{color:var(--ok)}\n.olist em.warn{color:var(--warn)}\n.olist em.bad{color:var(--bad)}\n.pick{display:flex;align-items:center;gap:6px;font-size:12px}\nhtml.sheet-open{overflow:hidden}\n\n@media (max-width:1000px){\n  .fx-grid{grid-template-columns:minmax(0,1fr)}\n  .fx-words{flex-direction:row;flex-wrap:wrap;overflow-x:visible;gap:6px 12px}\n  .fx-words li{flex:0 0 auto}\n  .fx-body{flex-direction:column;padding-left:8px}\n  .fx-left,.fx-right{flex:1 1 auto;width:100%}\n  .dface{flex-direction:column}\n  .dcard{flex:1 1 auto;width:100%}\n}\n.bgl{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:5px}\n.bgl li{display:flex;gap:8px;font-size:11.5px;color:var(--fg3);line-height:1.5}\n.bgl b{flex:0 0 30px;color:var(--fg2);font-weight:600}\n.msheet .inp{flex:1 1 150px;width:auto;min-width:0}\n.msheet .sel{flex:0 0 auto}\n\n/* 维度小窗：图下面是操作行，反面才放句子 */\n.dops{display:flex;gap:5px}\n.dfront{padding:10px;border-radius:10px;background:rgba(var(--w),.04);border:1px dashed rgba(var(--w),.12)}\n.dfront[hidden]{display:none!important}\n.dsent{margin:0 0 6px;font-size:14px;line-height:1.5;color:var(--fg)}\n.dsent b{color:var(--accent)}\n.dimg[hidden]{display:none!important}/* ───────── 工厂 v6：比例、义项概率、玻璃小窗、流动 ───────── */\n\n/* 1) 两栏比例：五维度与背景往左放宽，图声变体靠右收窄 */\n.fx-body{gap:20px;padding:6px 8px 18px 30px}\n.fx-left{flex:1 1 58%}\n.fx-right{flex:0 0 36%;max-width:420px}\n\n/* 2) 五维度：名字 · 说明 · 右边一组的开关/状态/展开 */\n.f5row{gap:10px;padding:7px 0}\n.f5row b{width:18px}\n.f5row .d{flex:1 1 auto;font-size:12px}\n.f5t{display:flex;align-items:center;gap:8px;flex:0 0 auto}\n.f5row em{padding:3px 9px;font-size:11.5px;letter-spacing:.01em}\n.f5row .mini.xs{min-width:24px;height:22px;display:inline-flex;align-items:center;justify-content:center;padding:0 6px}\n\n/* 3) 义项行：标题 + 四个场合概率 + 操作 */\n.fx-def{display:flex;align-items:center;gap:9px;margin:14px 0 4px;flex-wrap:wrap}\n.fx-def .dn{font-size:11px;color:var(--fg3);letter-spacing:.04em}\n.fx-def .dt{font-size:12.5px;font-weight:600;color:var(--fg2)}\n.fx-def .sp{flex:1 1 auto}\n.fx-def .prob{display:flex;gap:5px;flex-wrap:wrap}\n.fx-def .prob i{font-style:normal;font-size:10.5px;color:var(--ghost);\n  padding:2px 7px;border-radius:99px;background:rgba(var(--w),.045);border:1px solid rgba(var(--w),.05)}\n.fx-def .prob b{font-weight:600;color:var(--fg3);margin-left:3px;font-variant-numeric:tabular-nums}\n.fx-foot{margin:14px 0 0;font-size:11.5px;line-height:1.6;color:var(--ghost)}\n.mini.batch{color:#cfe0ff;border-color:rgba(138,169,255,.45);background:rgba(111,139,255,.16)}\n\n/* 4) 小窗：更大、更松、玻璃质感 */\n.msheet{background:rgba(5,7,11,.55);backdrop-filter:blur(10px) saturate(120%);padding:32px}\n.mcard{width:min(760px,100%);max-height:calc(100vh - 64px);\n  background:linear-gradient(180deg,rgba(40,45,58,.92),rgba(24,27,35,.94));\n  border:1px solid rgba(var(--w),.10);\n  box-shadow:0 30px 90px rgba(0,0,0,.55),inset 0 1px 0 rgba(var(--w),.10);\n  backdrop-filter:blur(22px) saturate(130%);\n  border-radius:20px}\n.mcard.mc-wide{width:min(880px,100%)}\n.mhd{padding:18px 22px 14px;background:transparent;border-bottom:1px solid rgba(var(--w),.07)}\n.mhd b{font-size:16px}\n.mbody{padding:20px 22px 20px;gap:14px}\n.mrow{gap:10px}\n.mta{font-size:13px;padding:12px 14px;border-radius:12px;background:rgba(0,0,0,.22);border-color:rgba(var(--w),.08)}\n.mest{padding:13px 15px;border-radius:13px}\n.mgrid{gap:10px}\n.mtile img{height:104px}\n.ords{gap:9px;font-size:13px}\n.egg{padding:12px 14px}\n.drop{padding:30px 18px;border-radius:14px;background:rgba(0,0,0,.16)}\n.dcard{padding:12px;border-radius:16px;background:rgba(0,0,0,.20);border-color:rgba(var(--w),.08)}\n.dimg img{height:150px}\n.dimg,.dfront{border-radius:12px}\n.dsent{font-size:15px}\n.dnote{font-size:13px}\n.mx{width:30px;height:30px;border-radius:9px;display:inline-flex;align-items:center;justify-content:center}\n.mx:hover{background:rgba(var(--w),.08)}\n\n/* 5) 概率条 */\n.prbow{display:flex;flex-direction:column;gap:10px;padding:14px 16px;border-radius:14px;background:rgba(0,0,0,.18);border:1px solid rgba(var(--w),.07)}\n.prow{display:flex;align-items:center;gap:12px}\n.prow .pl{flex:0 0 80px;font-size:12px;color:var(--fg2)}\n.pbar{flex:1 1 auto;height:7px;border-radius:99px;background:rgba(var(--w),.08);overflow:hidden}\n.pbar i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,rgba(138,169,255,.55),var(--accent))}\n.prow b{flex:0 0 30px;text-align:right;font-size:12px;font-variant-numeric:tabular-nums;color:var(--fg)}\n\n/* 6) 流动：指针扫过时有光,靠近左边缘时轻微压下 */\n.fx-blk,.fx-row>summary,.mcard,.fx-def{position:relative}\n.fx-blk{overflow:hidden;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}\n.fx-blk::after{content:'';position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .22s ease;\n  background:radial-gradient(260px circle at var(--mx,50%) var(--my,50%),rgba(var(--w),.10),transparent 62%)}\n.fx-blk:hover::after{opacity:1}\n.fx-blk:hover{border-color:rgba(var(--w),.12)}\n.fx-blk.press-l{transform:translateY(1.5px);box-shadow:inset 3px 0 14px rgba(0,0,0,.30),0 10px 26px rgba(0,0,0,.28)}\n.fx-row>summary::after{content:'';position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .22s ease;\n  background:radial-gradient(320px circle at var(--mx,50%) var(--my,50%),rgba(var(--w),.07),transparent 65%)}\n.fx-row>summary:hover::after{opacity:1}\n\n/* 重要按钮：指针扫过有一道流光 */\n.btn.batch,.btn.primary{position:relative;overflow:hidden}\n.btn.batch::after,.btn.primary::after{content:'';position:absolute;top:0;bottom:0;width:38%;left:-45%;\n  background:linear-gradient(100deg,transparent,rgba(255,255,255,.45),transparent);\n  transform:skewX(-14deg);opacity:0}\n.btn.batch:hover::after,.btn.primary:hover::after{animation:sheen .65s ease}\n@keyframes sheen{0%{left:-45%;opacity:0}25%{opacity:1}100%{left:110%;opacity:0}}\n\n/* 页面底子：一层缓慢流动的光，别太抢 */\nbody::before{content:'';position:fixed;inset:-20%;z-index:-2;pointer-events:none;\n  background:\n    radial-gradient(38% 32% at 18% 22%,rgba(111,139,255,.13),transparent 62%),\n    radial-gradient(34% 30% at 78% 12%,rgba(151,177,240,.10),transparent 60%),\n    radial-gradient(42% 36% at 62% 78%,rgba(190,174,222,.09),transparent 64%);\n  animation:drift 46s ease-in-out infinite alternate}\n@keyframes drift{\n  0%{transform:translate3d(0,0,0) scale(1)}\n  50%{transform:translate3d(1.4%,-1.1%,0) scale(1.03)}\n  100%{transform:translate3d(-1.2%,1.3%,0) scale(1.02)}\n}\n@media (prefers-reduced-motion:reduce){\n  body::before{animation:none}\n  .btn.batch:hover::after,.btn.primary:hover::after{animation:none}\n}\n\n@media (max-width:1100px){\n  .fx-right{flex:1 1 auto;max-width:none}\n}\n.dmini{margin:12px 0 12px;padding:12px 14px;border-radius:12px;background:rgba(0,0,0,.20);border:1px solid rgba(var(--w),.07)}\n.dmini .dsent{margin:6px 0 4px}\n.fx-def .prob i{color:var(--fg3);background:rgba(var(--w),.06);border-color:rgba(var(--w),.07)}\n.fx-def .prob b{color:var(--fg2)}\n.msheet .inp.tiny{flex:0 0 96px}\n\n/* ───────── 工厂 v7：更宽的两栏、义项成框、五维度换排法、图进弹窗 ───────── */\n\n/* 1) 两块都往左收一点，右栏放宽：图声变体的左边缘往左挪 */\n.fx-body{gap:14px;padding:6px 6px 18px 4px}\n.fx-left{flex:1 1 50%;min-width:0}\n.fx-right{flex:0 0 46%;max-width:560px;min-width:0}\n@media (max-width:1180px){ .fx-right{flex:1 1 auto;max-width:none} }\n\n/* 2) 每个义项一个大框，框和框之间留空 */\n.fx-sense{\n  border:1px solid rgba(var(--w),.075);\n  border-radius:16px;\n  background:linear-gradient(180deg,rgba(var(--w),.020),rgba(var(--w),.006));\n  padding:10px 14px 12px;\n  margin:0 0 14px;\n}\n.fx-sense .fx-def{margin:2px 0 8px}\n.fx-sense .fx-row:last-of-type{border-bottom:0}\n.fx-sense .fx-body{padding-left:14px;padding-right:2px}\n.fx-list>.fx-foot{margin:2px 0 0}\n\n/* 3) 五维度：名字带一个小角标，点名字开窗；状态贴名字；说明贴开关 */\n.f5row{display:flex;align-items:center;gap:9px;padding:7px 0}\n.f5row .f5name{\n  position:relative;flex:0 0 auto;width:27px;height:27px;padding:0;\n  display:inline-flex;align-items:center;justify-content:center;\n  border-radius:9px;border:1px solid rgba(var(--w),.07);\n  background:rgba(var(--w),.045);color:var(--fg);cursor:pointer;\n  transition:background .18s ease,border-color .18s ease,color .18s ease;\n}\n.f5row .f5name b{font-size:13px;font-weight:600;line-height:1}\n.f5row .f5name .cor{\n  position:absolute;top:-7px;right:-8px;font-style:normal;font-size:9px;line-height:1;\n  color:var(--fg3);opacity:.45;transition:opacity .18s ease,transform .18s ease,color .18s ease;\n}\n.f5row .f5name:hover{background:rgba(138,169,255,.16);border-color:rgba(138,169,255,.42);color:#fff}\n.f5row .f5name:hover .cor{opacity:1;color:#bcd0ff;transform:translate(1px,-1px)}\n.f5row em{flex:0 0 auto;margin:0}\n.f5row .d{flex:0 0 auto;font-size:11.5px;color:var(--fg3);letter-spacing:.01em}\n.f5row .sw{flex:0 0 auto;margin-left:2px}\n\n/* 4) 页面上只留一张缩略图 */\n.imgbar{display:flex;align-items:center;gap:10px;margin:2px 0 10px}\n.imgbar>img{\n  width:104px;height:72px;object-fit:cover;border-radius:10px;flex:0 0 auto;\n  border:1px solid rgba(var(--w),.10);cursor:pointer;transition:.18s ease;\n}\n.imgbar>img:hover{border-color:rgba(138,169,255,.55);filter:brightness(1.06)}\n.imgbar .im{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:2px}\n.imgbar .im b{font-size:12px}\n.imgbar .im span{font-size:10.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n\n/* 5) 小窗里的「已有图」缩略带 */\n.dgal{margin-top:2px;padding:12px 14px;border-radius:13px;background:rgba(0,0,0,.18);border:1px solid rgba(var(--w),.07)}\n.dg-h{display:flex;align-items:baseline;gap:10px;margin-bottom:9px}\n.dg-h b{font-size:12px}\n.dg-h span{font-size:10.5px}\n.dg-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}\n.dg{position:relative;border-radius:10px;overflow:hidden;border:1px solid rgba(var(--w),.09);background:rgba(0,0,0,.25);cursor:pointer;transition:.18s ease}\n.dg img{display:block;width:100%;height:78px;object-fit:cover}\n.dg em{position:absolute;left:5px;bottom:5px;font-style:normal;font-size:10px;padding:1px 6px;border-radius:99px;background:rgba(0,0,0,.62);color:#fff}\n.dg:hover{border-color:rgba(138,169,255,.5);transform:translateY(-1px)}\n.dg.on::after{content:'';position:absolute;top:5px;right:5px;width:6px;height:6px;border-radius:50%;background:#5ad39a;box-shadow:0 0 0 3px rgba(90,211,154,.18)}\n.dg.warn::after{content:'';position:absolute;top:5px;right:5px;width:6px;height:6px;border-radius:50%;background:#e0a34a;box-shadow:0 0 0 3px rgba(224,163,74,.18)}\n.dg.none{display:flex;align-items:center;justify-content:center;height:78px;border-style:dashed;color:var(--ghost);font-size:11px}\n\n/* 手机：句子行允许换行，别把句子截成「The…」 */\n@media (max-width:700px){\n  .fx-row>summary{flex-wrap:wrap;row-gap:7px}\n  .fx-row>summary .s{flex:1 1 62%;white-space:normal;line-height:1.45}\n  .fx-row>summary .pips{margin-left:auto}\n  .fx-sense{padding:10px 10px 10px}\n  .f5row{gap:7px}\n  .f5row .d{font-size:10.5px}\n  .imgbar>img{width:84px;height:60px}\n}\n/* ── 开关重做（此前 .sw 有三份互相打架的定义：17/15/19 高、旋钮有的写 left 有的写 transform） ── */\n.sw,\nbutton.sw,\nlabel.sw,\nspan.sw,\ndiv.sw{\n  --sw-w:36px; --sw-h:20px; --sw-k:14px;\n  position:relative;display:inline-flex;flex:0 0 auto;vertical-align:middle;\n  width:var(--sw-w);height:var(--sw-h);padding:0;margin:0;border:0;border-radius:999px;\n  background:linear-gradient(180deg,rgba(var(--w),.13),rgba(var(--w),.09));\n  box-shadow:inset 0 0 0 1px rgba(var(--w),.13),inset 0 1px 2px rgba(0,0,0,.22);\n  cursor:pointer;-webkit-appearance:none;appearance:none;\n  transition:background .22s ease,box-shadow .22s ease,transform .12s ease;\n}\n.sw::after{\n  content:'';position:absolute;top:calc((var(--sw-h) - var(--sw-k)) / 2);left:3px;\n  width:var(--sw-k);height:var(--sw-k);border-radius:50%;\n  background:#f2f5ff;box-shadow:0 1px 2.5px rgba(0,0,0,.42),inset 0 -1px 0 rgba(0,0,0,.10);\n  transition:transform .24s cubic-bezier(.34,1.3,.64,1),background .2s ease;\n}\n.sw:hover{background:linear-gradient(180deg,rgba(var(--w),.17),rgba(var(--w),.12))}\n.sw:active::after{transform:scale(.92)}\n.sw:focus-visible{outline:2px solid rgba(138,169,255,.75);outline-offset:2px}\n.sw.on{\n  background:linear-gradient(180deg,#8ea9ff,#6f8bff);\n  box-shadow:inset 0 0 0 1px rgba(160,185,255,.55),0 0 12px rgba(111,139,255,.28);\n}\n.sw.on::after{left:3px;transform:translateX(calc(var(--sw-w) - var(--sw-k) - 6px));background:#fff}\n.sw.on:hover{filter:brightness(1.06)}\n.sw.on:active::after{left:3px;transform:translateX(calc(var(--sw-w) - var(--sw-k) - 6px)) scale(.92)}\n\n/* 小一号，用在五维度那种密集行里 */\n.f5row .sw{--sw-w:32px;--sw-h:18px;--sw-k:12px}\n.f5row .sw::after{left:3px}\n.f5row .sw.on::after{left:3px;transform:translateX(calc(32px - 12px - 6px))}\n\n@media (prefers-reduced-motion:reduce){\n  .sw,.sw::after{transition:none}\n}\n/* ── 义项工具条：+ / − / 设置，以及删除模式的勾选框 ── */\n.defops{display:inline-flex;align-items:center;gap:6px;flex:0 0 auto}\n.mini.ic{width:24px;padding:0;justify-content:center;font-size:14px;line-height:1;font-weight:600}\n.mini.ic[data-add]{font-size:15px}\n.mini.danger{color:#ffb4b4;border-color:rgba(255,120,120,.42);background:rgba(255,86,86,.14)}\n.mini.danger:hover{background:rgba(255,86,86,.22)}\n.mini.danger[disabled]{opacity:.38;cursor:not-allowed}\n\n.pickbox{display:none;flex:0 0 auto;align-items:center;padding:2px 4px 2px 0;cursor:pointer}\n.pickbox input{\n  width:14px;height:14px;margin:0;border-radius:4px;cursor:pointer;\n  accent-color:var(--accent);\n}\n.fx-sense.del .pickbox{display:inline-flex}\n\n.delbar{display:none;align-items:center;gap:8px;margin:2px 0 6px;padding:6px 10px;\n  border-radius:9px;background:rgba(255,86,86,.08);border:1px solid rgba(255,120,120,.22)}\n.delbar .mut{font-size:11px;color:#f0b6b6}\n.fx-sense.del .delbar{display:flex}\n.fx-sense.del .fx-row>summary{background:rgba(255,255,255,.015)}\n\n/* 加句：按顺序排在最下面，虚线框标出来 */\n.fx-row.is-new>summary{background:rgba(111,139,255,.10);box-shadow:inset 2px 0 0 var(--accent)}\n.fx-row.is-new .s{color:var(--fg3);font-style:italic}\n/* ───────── 交互层：统一缓动、只动合成器友好的属性 ───────── */\n\n:host{\n  --ease:cubic-bezier(.22,.8,.24,1);\n  --ease-spring:cubic-bezier(.34,1.25,.64,1);\n  --t-fast:.16s;\n  --t-mid:.24s;\n}\n\n/* 所有可点元素：显式列属性，不用 transition:all（all 会把 background-image / box-shadow 之类也拖进去，掉帧） */\nbutton,.btn,.mini,.chip,.sw,.tab,.nav a,.seg button,.f5name,.dg,.imgbar>img,\n.fx-row>summary,.fx-words li,.mini.ic,.iconbtn,.q,.sel,.msheet .mx{\n  transition:\n    background-color var(--t-fast) var(--ease),\n    border-color var(--t-fast) var(--ease),\n    color var(--t-fast) var(--ease),\n    box-shadow var(--t-mid) var(--ease),\n    opacity var(--t-fast) var(--ease),\n    transform var(--t-fast) var(--ease);\n}\n\n/* 按下就有一点手感，不要「咔」一下 */\nbutton:active:not([disabled]),.mini:active:not([disabled]),.chip:active,.btn:active:not([disabled]),\n.f5name:active,.dg:active,.imgbar>img:active{\n  transform:translateY(.5px) scale(.985);\n  transition-duration:.06s;\n}\n.btn:hover{transform:translateY(-1px)}\n.btn:active{transform:translateY(0) scale(.99)}\n\n/* 开关：轨道换成纯色，才能从灰渐变到蓝（渐变之间浏览器不插值，原来那下是硬切） */\n.sw{background-color:rgba(var(--w),.14);background-image:none;\n  transition:background-color var(--t-mid) var(--ease),box-shadow var(--t-mid) var(--ease),transform .1s var(--ease)}\n.sw.on{background-color:#7d97ff;\n  box-shadow:inset 0 0 0 1px rgba(170,195,255,.55),inset 0 6px 10px -8px rgba(255,255,255,.65),0 0 12px rgba(111,139,255,.30)}\n.sw:hover{background-color:rgba(var(--w),.18)}\n.sw.on:hover{background-color:#8aa3ff}\n\n/* 卡片上的光斑：改成「整块固定的圆」用 transform 移，指针动的时候不再重画渐变 */\n.fx-blk::after{\n  top:0;left:0;width:520px;height:520px;margin:-260px 0 0 -260px;inset:auto;\n  background:radial-gradient(circle closest-side,rgba(var(--w),.11),rgba(var(--w),.04) 55%,transparent 72%);\n  transform:translate3d(var(--mx,0px),var(--my,0px),0);\n  transition:opacity var(--t-mid) var(--ease);\n  will-change:transform,opacity;\n}\n.fx-row>summary::after{\n  top:0;left:0;width:620px;height:620px;margin:-310px 0 0 -310px;inset:auto;\n  background:radial-gradient(circle closest-side,rgba(var(--w),.07),transparent 70%);\n  transform:translate3d(var(--mx,0px),var(--my,0px),0);\n  transition:opacity var(--t-mid) var(--ease);\n  will-change:transform,opacity;\n}\n\n/* 弹窗进出：从下往上 8px 淡入，别硬闪 */\n.msheet:not([hidden]) .mcard{animation:mcard-in var(--t-mid) var(--ease-spring) both}\n@keyframes mcard-in{from{opacity:0;transform:translateY(10px) scale(.985)}to{opacity:1;transform:none}}\n.msheet:not([hidden]){animation:msheet-in .2s var(--ease) both}\n@keyframes msheet-in{from{opacity:0}to{opacity:1}}\n\n/* 勾选框 */\n.pickbox{transition:opacity var(--t-fast) var(--ease)}\n.pickbox input{transition:transform .12s var(--ease-spring),box-shadow .16s var(--ease)}\n.pickbox input:checked{transform:scale(1.06)}\n\n@media (prefers-reduced-motion:reduce){\n  *,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;\n    transition-duration:.01ms!important;scroll-behavior:auto!important}\n}\n\n/* ───────── v37：光影只留给顶栏，其余全删 ───────── */\n\n/* 1) 删掉：卡片上的指针光斑 */\n.fx-blk::after,\n.fx-row>summary::after{content:none!important;display:none!important}\n.fx-blk.press-l{transform:none!important;box-shadow:none!important}\n\n/* 2) 删掉：按钮上的流光、抬升、通用压下 */\n.btn.batch::after,\n.btn.primary::after{content:none!important;animation:none!important}\n.btn:hover,.btn.primary:hover,.btn.batch:hover{transform:none!important}\nbutton:active:not([disabled]),\n.mini:active:not([disabled]),\n.chip:active,\n.btn:active:not([disabled]),\n.f5name:active,\n.dg:active,\n.imgbar>img:active{\n  transform:none!important;\n  transition-duration:0s;\n}\n.chip.on:hover,.chip:hover,.dg:hover,.imgbar>img:hover,.f5row .f5name:hover .cor{transform:none!important}\n\n/* 3) 删掉：页面底色那层漂移的光（留静态的，不要动） */\nbody::before{animation:none!important}\n\n/* ── 顶栏：唯一保留光影的地方 ──────────────────────────────\n   做法是「上缘一道亮边 + 下缘一道暗边」，中间实心；按下去的件反过来：\n   上缘压暗、内部一道自上而下的内阴影。这样才算立体，而不是发光。 */\n\n/* 底座：三个 tab 的外壳，本身就是一块被托起来的板 */\n.tabs{\n  background:linear-gradient(180deg,rgba(var(--w),.055),rgba(var(--w),.022));\n  border:1px solid rgba(var(--w),.085);\n  box-shadow:\n    inset 0 1px 0 rgba(var(--w),.13),\n    inset 0 -1px 0 rgba(0,0,0,.34),\n    0 1px 1px rgba(0,0,0,.30),\n    0 3px 8px -3px rgba(0,0,0,.40);\n}\n.tabs a{position:relative;box-shadow:inset 0 1px 0 rgba(var(--w),0);color:var(--fg3)}\n.tabs a:hover{color:var(--fg2);box-shadow:inset 0 1px 0 rgba(var(--w),.06)}\n\n/* 选中的那一格：压进去 —— 上缘暗、内部下沉、底部一道极细的反光 */\n.tabs a.on{\n  color:#eef3ff;\n  background:linear-gradient(180deg,rgba(0,0,0,.36),rgba(0,0,0,.12));\n  box-shadow:\n    inset 0 2px 5px -1px rgba(0,0,0,.65),\n    inset 0 -1px 0 rgba(var(--w),.13),\n    inset 0 0 0 1px rgba(var(--w),.045);\n}\n.tabs a.on::after{\n  content:'';position:absolute;left:12%;right:12%;top:1px;height:1px;border-radius:1px;\n  background:linear-gradient(90deg,transparent,rgba(0,0,0,.55),transparent);\n}\n\n/* 插件按钮 / 两个圆钮：同样一条亮边压一条暗边 */\n.tbtn,.iconbtn{\n  background:linear-gradient(180deg,rgba(var(--w),.075),rgba(var(--w),.028));\n  border:1px solid rgba(var(--w),.085);\n  box-shadow:\n    inset 0 1px 0 rgba(var(--w),.12),\n    inset 0 -1px 0 rgba(0,0,0,.30),\n    0 1px 1px rgba(0,0,0,.28),\n    0 2px 6px -2px rgba(0,0,0,.32);\n}\n.tbtn:hover,.iconbtn:hover{\n  background:linear-gradient(180deg,rgba(var(--w),.10),rgba(var(--w),.045));\n  border-color:rgba(var(--w),.12);\n}\n.tbtn:active,.iconbtn:active{\n  background:linear-gradient(180deg,rgba(0,0,0,.20),rgba(var(--w),.03));\n  box-shadow:\n    inset 0 2px 4px -1px rgba(0,0,0,.55),\n    inset 0 -1px 0 rgba(var(--w),.07);\n}\n.menu[open] .tbtn{\n  background:linear-gradient(180deg,rgba(0,0,0,.20),rgba(var(--w),.03));\n  box-shadow:\n    inset 0 2px 4px -1px rgba(0,0,0,.55),\n    inset 0 -1px 0 rgba(var(--w),.07);\n}\n/* 按下之后整块下沉半像素，反馈只到这儿 */\n.tbtn:active,.iconbtn:active,.tabs a:active{transform:translateY(.5px)}\n.tabs a{--t:1}\n\n/* 4) 正文里的主按钮也去掉光晕，只留一条压住的暗影 */\n.btn.primary,.btn.batch{\n  box-shadow:0 1px 2px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.28), inset 0 -1px 0 rgba(0,0,0,.18);\n}\n.btn.primary:hover,.btn.batch:hover{filter:brightness(1.04)}\n/* 顶栏里「当前页」那颗圆钮：保留一点蓝色，否则被上面的渐变盖掉就看不出了 */\n.iconbtn.on{\n  color:#cfdcff;\n  background:linear-gradient(180deg,rgba(111,139,255,.26),rgba(111,139,255,.12));\n  border-color:rgba(138,169,255,.34);\n  box-shadow:\n    inset 0 1px 0 rgba(255,255,255,.16),\n    inset 0 -1px 0 rgba(0,0,0,.30),\n    0 1px 1px rgba(0,0,0,.26);\n}\n/* ── 义项行的情境信号：前三个 + 还有几个 ── */\n.fx-def .prob{display:flex;gap:5px;flex-wrap:wrap;align-items:center}\n.fx-def .prob i{color:var(--fg3);background:rgba(var(--w),.06);border:1px solid rgba(var(--w),.07)}\n.fx-def .prob i b{color:var(--fg2)}\n.morep{\n  font:inherit;font-size:10.5px;line-height:1;padding:3px 7px;border-radius:99px;cursor:pointer;\n  color:var(--fg3);background:transparent;border:1px dashed rgba(var(--w),.16);\n  transition:background-color .16s var(--ease),color .16s var(--ease),border-color .16s var(--ease);\n}\n.morep:hover{color:var(--fg);border-color:rgba(var(--w),.3);background:rgba(var(--w),.05)}\n\n/* ── 底部「加一个义项」 ── */\n.addsense{display:flex;align-items:center;gap:10px;margin:2px 0 10px}\n.as-main{\n  display:inline-flex;align-items:center;gap:9px;padding:9px 15px;border-radius:12px;cursor:pointer;\n  font:inherit;font-size:12.5px;font-weight:600;color:var(--fg3);\n  background:transparent;border:1px dashed rgba(var(--w),.16);\n  transition:color .16s var(--ease),border-color .16s var(--ease),background-color .16s var(--ease);\n}\n.as-main b{font-size:16px;line-height:1;color:var(--accent);font-weight:600}\n.as-main:hover{color:var(--fg);border-color:rgba(138,169,255,.45);background:rgba(111,139,255,.07)}\n.as-alt{display:inline-flex;gap:6px;opacity:.75}\n.addsense:hover .as-alt{opacity:1}\n\n/* ── 情境画像里的分组标签 ── */\n.tggroup{margin:0 0 14px;padding:13px 15px;border-radius:13px;background:rgba(0,0,0,.16);border:1px solid rgba(var(--w),.06)}\n.tg-h{display:flex;align-items:baseline;gap:10px;margin-bottom:10px}\n.tg-h b{font-size:12.5px}\n.tg-h span{font-size:10.5px}\n.tg{display:flex;gap:7px;flex-wrap:wrap}\n.t{\n  display:inline-flex;align-items:center;gap:6px;padding:5px 11px;border-radius:99px;cursor:pointer;\n  font-size:11.5px;color:var(--fg3);background:rgba(var(--w),.045);border:1px solid rgba(var(--w),.06);\n  transition:background-color .16s var(--ease),color .16s var(--ease),border-color .16s var(--ease);\n}\n.t b{font-size:10.5px;color:var(--ghost);font-variant-numeric:tabular-nums}\n.t:hover{color:var(--fg2);border-color:rgba(var(--w),.13)}\n.t.on{color:#dfe8ff;background:rgba(111,139,255,.15);border-color:rgba(138,169,255,.38)}\n.t.on b{color:#aebfff}\n/* 小窗里的行标签对齐 */\n.mbody .mrow>.mtag{min-width:46px;flex:0 0 auto}\n.mbody .mrow{margin:8px 0}\n@media (max-width:700px){\n  .addsense{flex-wrap:wrap;gap:8px}\n  .fx-def .prob{width:100%;order:5;margin-top:2px}\n  .fx-def .prob i{font-size:10px}\n}\n/* ───────── 卡片（学习界面）───────── */\n\n.screen.study{max-width:1180px}\n.hsub{margin:6px 0 0;font-size:12.5px;color:var(--fg3)}\n\n.st-wrap{display:grid;grid-template-columns:212px minmax(0,1fr);gap:22px;align-items:start;margin-top:18px}\n\n/* 左：牌组 */\n.st-rail{padding:14px 12px;border-radius:16px;border:1px solid var(--glass-line);\n  background:linear-gradient(180deg,rgba(var(--w),.035),rgba(var(--w),.014))}\n.st-rail-h{display:flex;align-items:center;justify-content:space-between;margin:0 4px 8px;\n  font-size:11px;letter-spacing:.08em;color:var(--fg3)}\n.st-rail-h .mini.ic{width:22px;height:22px;font-size:15px;line-height:1;padding:0}\n.st-dk{display:flex;flex-direction:column;gap:3px;width:100%;text-align:left;padding:9px 11px;\n  margin-bottom:6px;border-radius:11px;cursor:pointer;font:inherit;\n  background:transparent;border:1px solid transparent;color:var(--fg2);\n  transition:background-color .16s var(--ease),border-color .16s var(--ease),color .16s var(--ease)}\n.st-dk:hover{background:rgba(var(--w),.045)}\n.st-dk.on{background:rgba(111,139,255,.12);border-color:rgba(138,169,255,.26);color:var(--fg)}\n.st-dk-n{font-size:13px;font-weight:600}\n.st-dk-c{font-size:11px;color:var(--fg3)}\n.st-dk-c b{color:#aebfff;font-variant-numeric:tabular-nums}\n.st-note{margin:10px 4px 2px;font-size:11px;line-height:1.65;color:var(--ghost)}\n\n/* 右：一张卡 */\n.st-main{min-width:0}\n.st-top{display:flex;align-items:center;gap:12px;margin-bottom:12px}\n.st-prog{font-size:12px;color:var(--fg3)}\n.st-prog b{color:var(--fg);font-variant-numeric:tabular-nums}\n.st-bar{flex:1;height:2px;border-radius:2px;background:rgba(var(--w),.08);overflow:hidden}\n.st-bar i{display:block;height:100%;border-radius:2px;background:linear-gradient(90deg,#7d97ff,#a9bcff)}\n.st-clock{font-size:12px;color:var(--fg3);font-variant-numeric:tabular-nums}\n\n.st-card{padding:26px 30px 22px;border-radius:18px;border:1px solid var(--glass-line);\n  background:linear-gradient(180deg,rgba(var(--w),.045),rgba(var(--w),.018))}\n.st-card-top{display:flex;align-items:center;gap:12px;margin-bottom:20px}\n.st-face{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;\n  border-radius:8px;font-size:13px;font-weight:600;color:#dfe8ff;\n  background:rgba(111,139,255,.18);border:1px solid rgba(138,169,255,.34)}\n.st-word{font-family:var(--serif);font-size:15px;color:var(--fg2);letter-spacing:.01em}\n.st-faces{margin-left:auto;display:inline-flex;align-items:center;gap:5px;font-size:10.5px;color:var(--ghost)}\n.st-faces i{display:inline-block;width:6px;height:6px;border-radius:50%;\n  background:rgba(var(--w),.13);margin:0 6px 0 1px}\n.st-faces i.on{background:rgba(94,214,180,.75)}\n.st-faces i.cur{background:#8aa9ff;box-shadow:0 0 0 3px rgba(138,169,255,.18)}\n\n.st-sent{margin:0 0 10px;font-size:29px;line-height:1.5;letter-spacing:-.005em}\n.st-sent b{color:#bccdff;font-weight:600}\n.st-ask{margin:0 0 20px;font-size:13px;color:var(--fg3)}\n.st-mini{display:flex;gap:8px;flex-wrap:wrap}\n.st-mini .btn{font-size:12px;padding:7px 13px}\n\n/* 答案 */\n.st-answer{display:grid;grid-template-columns:340px minmax(0,1fr);gap:20px;align-items:start;\n  margin-top:16px;padding:16px;border-radius:16px;\n  border:1px solid var(--glass-line);background:rgba(var(--w),.022)}\n.st-shot{border-radius:12px;overflow:hidden;background:rgba(0,0,0,.3)}\n.st-shot img{display:block;width:100%;height:100%;object-fit:cover;aspect-ratio:16/10}\n.st-a{min-width:0}\n.st-cn{margin:2px 0 12px;font-size:15px;line-height:1.7;color:var(--fg2)}\n.st-tags{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}\n.st-note2{margin:0 0 14px;font-size:12px;line-height:1.7;color:var(--fg3)}\n.st-a .btn{font-size:12px;padding:6px 12px}\n\n/* 评分 */\n.st-rate{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:16px}\n.st-r{display:flex;flex-direction:column;align-items:center;gap:2px;padding:11px 8px;\n  border-radius:12px;cursor:pointer;font:inherit;\n  background:rgba(var(--w),.045);border:1px solid rgba(var(--w),.08);color:var(--fg2);\n  transition:background-color .16s var(--ease),border-color .16s var(--ease),color .16s var(--ease)}\n.st-r b{font-size:13px;font-weight:600}\n.st-r em{font-size:10.5px;font-style:normal;color:var(--ghost);font-variant-numeric:tabular-nums}\n.st-r:hover{background:rgba(var(--w),.085);border-color:rgba(var(--w),.16);color:var(--fg)}\n.st-r.good{background:rgba(111,139,255,.16);border-color:rgba(138,169,255,.34);color:#e6edff}\n.st-r.good em{color:#a9bcff}\n.st-r.good:hover{background:rgba(111,139,255,.24)}\n\n.st-keys{margin:14px 0 0;font-size:11.5px;color:var(--ghost)}\n\n@media (max-width:900px){\n  .st-wrap{grid-template-columns:minmax(0,1fr)}\n  .st-answer{grid-template-columns:minmax(0,1fr)}\n  .st-sent{font-size:23px}\n  .st-rate{grid-template-columns:repeat(2,1fr)}\n}\n\n/* ── 句子之间：去掉序号，改用一条真正的分隔线 + 更松的间距 ── */\n.fx-row{position:relative}\n.fx-row+.fx-row::before{\n  content:'';position:absolute;left:10px;right:10px;top:0;height:1px;\n  background:linear-gradient(90deg,rgba(var(--w),.10),rgba(var(--w),.045) 70%,transparent);\n  pointer-events:none;\n}\n.fx-row>summary{padding:13px 10px}\n.fx-row[open]>summary{padding-bottom:10px}\n.fx-row[open]::before{opacity:.6}\n.fx-row .n{display:none}\n.st-flip{display:flex;align-items:baseline;gap:10px;margin:18px 2px 0;font-size:11px;color:var(--ghost)}\n.st-flip span{letter-spacing:.1em;color:var(--fg3)}\n.st-faces span{display:inline-flex;align-items:center;gap:4px}\n.st-faces i{margin:0}\n.fx-row+.fx-row::before{background:linear-gradient(90deg,rgba(var(--w),.13),rgba(var(--w),.06) 70%,transparent)}\n/* 分隔线看得见一点：整条浅线，不要渐变淡出 */\n.fx-row+.fx-row::before{\n  left:2px;right:2px;height:1px;\n  background:rgba(var(--w),.085);\n}\n.fx-row>summary{padding:14px 10px}\n.fx-row[open]>summary{padding-bottom:12px}\n/* 学习页的返回路径与侧栏内的进度 */\n.st-crumb{display:flex;align-items:center;gap:7px;font-size:11.5px;color:var(--ghost);margin-bottom:7px}\n.st-crumb a{color:var(--fg3);text-decoration:none;border-bottom:1px solid transparent}\n.st-crumb a:hover{color:var(--fg);border-color:rgba(var(--w),.3)}\n.st-word-big{font-family:var(--serif);font-weight:400}\n.st-top-in{display:flex;align-items:baseline;justify-content:space-between;margin:2px 4px 8px}\n.st-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 2px 0;padding:11px 0 0;\n  border-top:1px solid rgba(var(--w),.07)}\n.st-stats div{display:flex;flex-direction:column;gap:3px}\n.st-stats dt{font-size:10px;letter-spacing:.06em;color:var(--ghost)}\n.st-stats dd{margin:0;font-size:14px;font-variant-numeric:tabular-nums;color:var(--fg2)}\n/* ── 工厂 · 资源链接 ── */\n.resl{list-style:none;margin:0 0 10px;padding:0;display:flex;flex-direction:column;gap:6px}\n.resl li{display:flex;align-items:center;gap:9px;padding:8px 9px;border-radius:10px;\n  background:rgba(var(--w),.03);border:1px solid rgba(var(--w),.055)}\n.resl li:hover{border-color:rgba(var(--w),.12)}\n.rt{flex:0 0 auto;font-size:10px;line-height:1;padding:4px 7px;border-radius:6px;\n  color:var(--fg3);background:rgba(var(--w),.06);border:1px solid rgba(var(--w),.07)}\n.rt.gif{color:#ffd39b;background:rgba(255,196,120,.12);border-color:rgba(255,196,120,.22)}\n.rt.vid{color:#a9bcff;background:rgba(138,169,255,.13);border-color:rgba(138,169,255,.24)}\n.rt.post{color:#9fe3cd;background:rgba(94,214,180,.11);border-color:rgba(94,214,180,.2)}\n.resl a{flex:1;min-width:0;font-size:12px;color:var(--fg2);text-decoration:none;\n  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.resl a:hover{color:var(--fg);text-decoration:underline;text-decoration-color:rgba(var(--w),.3)}\n.resl .x{flex:0 0 auto;width:20px;height:20px;border-radius:6px;border:0;background:transparent;\n  color:var(--ghost);font-size:11px;cursor:pointer;line-height:1}\n.resl .x:hover{color:#ffb4b4;background:rgba(255,120,120,.12)}\n\n/* 图块上的「动图」角标 */\n.giftag{position:absolute;right:6px;top:6px;font-size:9.5px;line-height:1;padding:3px 5px;border-radius:5px;\n  color:#ffe0b8;background:rgba(0,0,0,.55);border:1px solid rgba(255,196,120,.35);letter-spacing:.04em}\n.fx-img{position:relative}\n.mtile.gifshot{position:relative}\n.mtile .giftag{position:absolute;right:6px;top:6px}\n.fx-img .giftag{pointer-events:none}\n/* ───────── 学习页 v2 ───────── */\n\n.st-idx{display:flex;align-items:center;gap:9px;margin:2px 0 0;font-size:22px;font-weight:400}\n.st-idx .wd{font:inherit;font-family:var(--serif);font-size:26px;letter-spacing:.01em;color:var(--fg);\n  background:rgba(var(--w),.055);border:1px solid rgba(var(--w),.1);border-radius:11px;\n  padding:3px 13px;cursor:pointer;\n  transition:background-color .16s var(--ease),border-color .16s var(--ease)}\n.st-idx .wd:hover{background:rgba(var(--w),.09);border-color:rgba(var(--w),.2)}\n.st-where{margin-left:6px;font-size:11.5px}\n\n/* 面标签条 */\n.fbar{display:flex;align-items:center;gap:6px;margin:16px 0 14px;padding:6px;border-radius:14px;\n  border:1px solid var(--glass-line);background:linear-gradient(180deg,rgba(var(--w),.04),rgba(var(--w),.016))}\n.fb{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:7px 15px;border-radius:10px;\n  cursor:pointer;font:inherit;font-size:13px;font-weight:600;color:var(--fg3);\n  background:transparent;border:1px solid transparent;\n  transition:background-color .16s var(--ease),color .16s var(--ease),border-color .16s var(--ease)}\n.fb i{font-style:normal;font-size:10px;font-weight:400;color:var(--ghost);letter-spacing:.02em}\n.fb:hover{color:var(--fg2);background:rgba(var(--w),.045)}\n.fb.on{color:#eef3ff;background:linear-gradient(180deg,rgba(0,0,0,.34),rgba(0,0,0,.12));\n  border-color:rgba(var(--w),.08);\n  box-shadow:inset 0 2px 5px -1px rgba(0,0,0,.6),inset 0 -1px 0 rgba(var(--w),.1)}\n.fb.on i{color:#a9bcff}\n\n/* 舞台 + 右侧揭开栏 */\n.st2{display:grid;grid-template-columns:minmax(0,1fr) 232px;gap:20px;align-items:start}\n.stage2{min-height:300px;padding:22px 26px;border-radius:18px;border:1px solid var(--glass-line);\n  background:linear-gradient(180deg,rgba(var(--w),.045),rgba(var(--w),.018));\n  display:flex;flex-direction:column;gap:16px}\n.blk{animation:blkin .22s var(--ease) both}\n@keyframes blkin{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}\n\n/* 声音 */\n.b-audio{display:flex;align-items:center;gap:14px}\n.pp{width:46px;height:46px;border-radius:50%;cursor:pointer;flex:0 0 auto;\n  background:rgba(111,139,255,.18);border:1px solid rgba(138,169,255,.4);color:#dfe8ff;font-size:14px;\n  transition:background-color .16s var(--ease),transform .1s var(--ease)}\n.pp:hover{background:rgba(111,139,255,.28)}\n.pp:active{transform:scale(.96)}\n.wave{display:flex;align-items:center;gap:3px;height:42px;flex:1;min-width:0}\n.wave i{display:block;width:2px;border-radius:2px;background:rgba(138,169,255,.55)}\n.wave i:nth-child(3n){height:26px}.wave i:nth-child(3n+1){height:14px}\n.wave i:nth-child(4n){height:34px}.wave i:nth-child(5n){height:8px}\n.wave i:nth-child(7n){height:20px}\n.dur{font-size:12px;color:var(--fg3);font-variant-numeric:tabular-nums}\n\n/* 图 + 资源 */\n.b-media{display:flex;flex-direction:column;gap:12px}\n.shot{position:relative;margin:0;border-radius:14px;overflow:hidden;background:rgba(0,0,0,.3);max-width:560px}\n.shot img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover}\n.rlink{list-style:none;margin:0;padding:0;display:flex;gap:8px;flex-wrap:wrap}\n.rlink li{display:flex;align-items:center;gap:7px;padding:6px 10px;border-radius:9px;\n  background:rgba(var(--w),.035);border:1px solid rgba(var(--w),.06);max-width:100%}\n.rlink a{font-size:11.5px;color:var(--fg3);text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.rlink a:hover{color:var(--fg)}\n\n/* 句子 */\n.b-sent .big{margin:0;font-size:30px;line-height:1.5;letter-spacing:-.005em}\n.b-sent .tgt{color:#bccdff;font-weight:600;border-bottom:1px dashed rgba(138,169,255,.5);cursor:help}\n\n/* 写 */\n.b-type{display:flex;flex-direction:column;gap:7px}\n.tl{font-size:12px;color:var(--fg3)}\n.tin{width:100%;font:inherit;font-size:16px;padding:12px 14px;border-radius:11px;color:var(--fg);\n  background:rgba(0,0,0,.22);border:1px solid rgba(var(--w),.1);outline:none}\n.tin::placeholder{color:var(--ghost)}\n.tnote{font-size:11px;color:var(--ghost)}\n.b-type.soft .tin{background:rgba(0,0,0,.13);border-color:rgba(var(--w),.06);color:var(--fg3)}\n.b-type.soft .tl,.b-type.soft .tnote{opacity:.62}\n.b-type.lead .tin{background:rgba(111,139,255,.07);border-color:rgba(138,169,255,.34)}\n.b-type.lead .tl{color:#c8d6ff}\n\n/* 改 */\n.b-vary{display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:13px;\n  background:rgba(var(--w),.025);border:1px solid rgba(var(--w),.06)}\n.vl{margin:0;font-size:12px;color:var(--fg3)}\n.vw{margin:0;font-size:18px;line-height:1.6}\n.vw s{color:var(--ghost)}\n.vw b{color:#bccdff}\n\n/* 揭开栏 */\n.st-side{padding:13px 11px;border-radius:16px;border:1px solid var(--glass-line);\n  background:linear-gradient(180deg,rgba(var(--w),.035),rgba(var(--w),.014))}\n.side-h{font-size:11px;letter-spacing:.08em;color:var(--fg3);margin:0 4px 9px}\n.rv{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;padding:8px 10px;\n  margin-bottom:5px;border-radius:9px;cursor:pointer;font:inherit;font-size:12.5px;color:var(--fg3);\n  background:transparent;border:1px dashed rgba(var(--w),.14);\n  transition:background-color .16s var(--ease),border-color .16s var(--ease),color .16s var(--ease)}\n.rv i{font-style:normal;font-size:10.5px;color:var(--ghost)}\n.rv:hover{color:var(--fg2);border-color:rgba(var(--w),.28)}\n.rv.on{color:#dfe8ff;background:rgba(111,139,255,.13);border-style:solid;border-color:rgba(138,169,255,.34)}\n.rv.on i{color:#a9bcff}\n.rv.dim{border-style:dashed;border-color:rgba(var(--w),.1);color:var(--ghost)}\n.rv.dim i{opacity:.55}\n.rv.hi{border-style:solid;border-color:rgba(138,169,255,.5);color:#dfe8ff;\n  background:rgba(111,139,255,.1);box-shadow:0 0 0 1px rgba(138,169,255,.12)}\n.side-n{margin:10px 4px 0;font-size:10.5px;line-height:1.65;color:var(--ghost)}\n\n.bgb.hi{border-color:rgba(138,169,255,.5);color:#dfe8ff;background:rgba(111,139,255,.14)}\n.bgb.dim{color:var(--ghost);border-color:rgba(var(--w),.08)}\n\n/* 英释小窗 */\n.enbox{padding:16px 18px;border-radius:13px;background:rgba(0,0,0,.2);border:1px solid rgba(var(--w),.06)}\n.enrow{display:flex;align-items:center;gap:9px;margin-bottom:9px}\n.ph{font-size:12px;color:var(--fg3)}\n.en-def{margin:0;font-size:17px;line-height:1.65}\n.zhbox{margin-top:12px;padding:16px 18px;border-radius:13px;background:rgba(var(--w),.03);\n  border:1px dashed rgba(var(--w),.12)}\n.zhbox .en-def{font-size:15px;color:var(--fg2)}\n\n/* 背景小窗 */\n.ordl{list-style:none;margin:0 0 10px;padding:0;counter-reset:o}\n.ordl li{display:flex;gap:12px;padding:7px 0;border-bottom:1px solid rgba(var(--w),.05);font-size:13px}\n.ordl li:last-child{border-bottom:0}\n.ordl b{flex:0 0 76px;color:var(--fg3);font-weight:600;font-size:12px}\n\n@media (max-width:960px){\n  .st2{grid-template-columns:minmax(0,1fr)}\n  .b-sent .big{font-size:23px}\n  .fbar{flex-wrap:wrap}\n}\n\n/* hidden 必须真的藏住：.b-* 上的 display:flex 会盖过 [hidden] */\n.blk[hidden]{display:none!important}\n/* ── 展开态改成两栏网格：五维度整行，图/声一排，变体/资源一排，背景整行 ── */\n.fx-body{\n  display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);\n  gap:14px;padding:8px 6px 16px 26px;align-items:start;\n}\n.fx-body .fx-blk{min-width:0}\n.fx-body .fx-blk.b5,.fx-body .fx-blk.bbg{grid-column:1/-1}\n\n/* 五维度整行之后，每一行都够宽，标题不再竖着折 */\n.fx-blk.b5 .f5row{display:flex;align-items:center;gap:10px;padding:9px 2px}\n\n/* 背景整行：六条摊成三列，别竖着堆成一长条 */\n.fx-blk.bbg .bgl{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px 22px}\n.fx-blk.bbg .bgl li{display:flex;gap:9px;align-items:baseline;min-width:0}\n.fx-blk.bbg .bgl b{flex:0 0 42px}\n\n/* 图块里的动图/静图角标钉在缩略图左上角，别飞到标题上 */\n.imgbar{position:relative}\n.imgbar .giftag{left:6px;top:6px;right:auto}\n\n/* 资源那一排，标题能占满，不要早早点省略号 */\n.resl a{font-size:12px}\n\n@media (max-width:900px){\n  .fx-body{grid-template-columns:minmax(0,1fr);padding-left:14px}\n  .fx-blk.bbg .bgl{grid-template-columns:minmax(0,1fr)}\n}\n/* 同一行的两块等高，内容各就各位，底注贴底 */\n.fx-body .fx-blk{display:flex;flex-direction:column;height:100%}\n.fx-body .fx-blk>.note{margin-top:auto}\n.fx-body .fx-blk>.fx-bh{margin-bottom:10px}\n/* 变体卡里那颗「自己打一个」别拉满整行 */\n.fx-blk .chips+.mini,.fx-blk>.mini{flex:0 0 auto;align-self:flex-start}\n.fx-blk .resl+.note,.fx-blk .bgl+.note{margin-top:12px}\n/* 整行可点：手型 + 悬停给一点反馈 + 键盘焦点 */\n[data-go]{cursor:pointer}\n.drow[data-go]:hover{background:rgba(var(--w),.055)}\n.drow[data-go]:focus-visible{outline:2px solid rgba(138,169,255,.55);outline-offset:-2px}\n.drow[data-go] .dname a{border-bottom-color:rgba(var(--w),.18)}\n.drow[data-go]:hover .dname a{border-bottom-color:rgba(138,169,255,.55)}\n/* ── 工厂：四个来路四色，块内别挤 ── */\n.src4{gap:10px;margin-bottom:4px}\n.vopts{margin-top:12px;gap:8px}\n.fx-blk{padding:12px 13px 14px}\n.fx-bh{gap:8px;margin-bottom:10px}\n.fx-bh .mini{margin-left:2px}\n.mini.own{margin-top:10px}\n\n/* 四个来路各一个色相：只用描边 + 淡底，不加光 */\n.mini.c-blue{color:#b9caff;border-color:rgba(111,139,255,.42);background:rgba(111,139,255,.10)}\n.mini.c-blue:hover{background:rgba(111,139,255,.18);border-color:rgba(138,169,255,.6)}\n.mini.c-violet{color:#cbb6ff;border-color:rgba(160,124,255,.42);background:rgba(160,124,255,.10)}\n.mini.c-violet:hover{background:rgba(160,124,255,.18);border-color:rgba(180,150,255,.6)}\n.mini.c-amber{color:#f3c98a;border-color:rgba(226,163,74,.42);background:rgba(226,163,74,.10)}\n.mini.c-amber:hover{background:rgba(226,163,74,.18);border-color:rgba(240,186,110,.6)}\n.mini.c-teal{color:#96ddcf;border-color:rgba(70,190,170,.42);background:rgba(70,190,170,.10)}\n.mini.c-teal:hover{background:rgba(70,190,170,.18);border-color:rgba(110,210,190,.6)}\n/* ── 图表演示：慢一点、轻一点 ──\n   原来热力图 364 个 <rect> 各自动一次（每个都带 transform + opacity），\n   一屏这么多动画必然掉帧；现在按「周」分组成 52 个 <g>，一次动一列。 */\n.cv-js .hcol, .cv-play .hcol{animation:hcol-in .5s cubic-bezier(.22,.61,.36,1) both;animation-delay:var(--d,0ms)}\n@keyframes hcol-in{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}\n.cv-js .heat rect, .cv-play .heat rect{animation:none!important}\n.heat rect{transition:fill .18s ease}\n.heat rect:hover{filter:brightness(1.25)}\n\n/* 柱子和折线放慢一档 */\n.cv-js .bar, .cv-play .bar{animation-duration:1.05s!important}\n.cv-js .line2, .cv-play .line2{animation-duration:1.35s!important}\n.cv-js .area2, .cv-play .area2{animation-duration:1.05s!important}\n.cv-js .dspin, .cv-play .dspin{animation-duration:1.2s!important}\n.cv-js .adot, .cv-play .adot{animation-duration:.42s!important}\n\n/* 别让浏览器为整片图缓存图层 */\n.chart, .chart *{will-change:auto}\n/* ── 学习页：发光层级 + 评分四色 + 录音 ── */\n/* 四档评分各自一个色：重来红、困难橙、良好蓝、简单绿 */\n.st-r{border-color:rgba(var(--w),.10)}\n.st-r:nth-child(1){color:#ffb4b4;border-color:rgba(255,120,120,.30);background:rgba(255,120,120,.09)}\n.st-r:nth-child(2){color:#f3c98a;border-color:rgba(226,163,74,.30);background:rgba(226,163,74,.09)}\n.st-r:nth-child(3),\n.st-r.good{color:#b9caff;border-color:rgba(111,139,255,.45);background:rgba(111,139,255,.16)}\n.st-r:nth-child(4){color:#9ee0c8;border-color:rgba(70,190,170,.30);background:rgba(70,190,170,.09)}\n.st-r:hover{filter:brightness(1.14)}\n\n/* 右栏两段：解释（青）与还藏着什么（蓝）分开 */\n.st-side .ex-h{margin-top:0}\n.exrow{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:6px}\n.ex{\n  display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 11px;border-radius:9px;cursor:pointer;\n  font:inherit;font-size:12px;color:var(--fg2);background:rgba(var(--w),.05);border:1px solid rgba(var(--w),.09);\n  transition:background-color .16s var(--ease),border-color .16s var(--ease),color .16s var(--ease),box-shadow .16s var(--ease);\n}\n.ex i{font-size:10.5px;color:var(--ghost);font-style:normal}\n.ex:hover{border-color:rgba(70,190,170,.45);color:#c8f0e6}\n.ex.on{\n  color:#d7fff4;background:rgba(70,190,170,.16);border-color:rgba(70,190,170,.55);\n  box-shadow:0 0 0 1px rgba(70,190,170,.20),0 0 20px -8px rgba(70,190,170,.85);\n}\n.st-side .side-h+.exrow{margin-top:2px}\n\n/* 点开的：亮但偏暗；这一面该用的：发光 */\n.rv.on{color:var(--fg2);background:rgba(var(--w),.075);border-color:rgba(var(--w),.16)}\n.rv.lit,.bgb.lit{\n  color:#eaf0ff;background:rgba(111,139,255,.17);border-color:rgba(138,169,255,.55);\n  box-shadow:0 0 0 1px rgba(138,169,255,.22),0 0 22px -8px rgba(111,139,255,.9);\n}\n.st-r.good{box-shadow:0 0 0 1px rgba(111,139,255,.22),0 0 22px -9px rgba(111,139,255,.8)}\n\n/* 写框：靠下，写这一面时边框发光 */\n.b-type{margin-top:4px}\n.tin{transition:border-color .2s var(--ease),box-shadow .2s var(--ease),background-color .2s var(--ease)}\n.blk.b-type.lead .tin,.blk.b-type.lead .tl{color:#eaf0ff}\n.blk.b-type.lead .tin{\n  border-color:rgba(138,169,255,.6);background:rgba(111,139,255,.10);\n  box-shadow:0 0 0 1px rgba(138,169,255,.25),0 0 26px -8px rgba(111,139,255,.95);\n}\n.blk.b-type.soft .tin{background:rgba(var(--w),.028);border-color:rgba(var(--w),.08)}\n.blk.b-type.soft .tl{color:var(--ghost)}\n\n/* 录音块 */\n.b-rec{display:flex;align-items:center;gap:14px}\n.mic{\n  width:46px;height:46px;border-radius:50%;flex:0 0 auto;cursor:pointer;\n  color:#cfd8ea;background:rgba(var(--w),.06);border:1px solid rgba(var(--w),.12);\n  transition:background-color .16s var(--ease),border-color .16s var(--ease),box-shadow .16s var(--ease);\n}\n.mic span{font-size:11px}\n.b-rec.lead .mic{\n  color:#fff;background:rgba(240,110,110,.20);border-color:rgba(255,130,130,.55);\n  box-shadow:0 0 0 1px rgba(255,130,130,.25),0 0 24px -8px rgba(255,110,110,.9);\n}\n.rechint{display:flex;flex-direction:column;gap:2px;font-size:12px}\n.rechint .mut{font-size:11px}\n\n/* 直接给的块：轻描一下，跟藏起来的分开 */\n.blk.lead .big{text-shadow:0 0 26px rgba(111,139,255,.35)}\n/* ── 浮动小窗：小、透明、可拖可拉（英释 / 中译） ── */\n.popwin{\n  position:fixed;z-index:70;\n  width:320px;min-width:230px;max-width:620px;\n  min-height:110px;max-height:72vh;\n  display:flex;flex-direction:column;\n  border-radius:13px;overflow:hidden;\n  background:rgba(24,27,36,.62);\n  border:1px solid rgba(var(--w),.14);\n  box-shadow:0 18px 44px -18px rgba(0,0,0,.75),inset 0 1px 0 rgba(var(--w),.10);\n  backdrop-filter:blur(14px) saturate(125%);\n  -webkit-backdrop-filter:blur(14px) saturate(125%);\n  resize:both;\n}\n.popwin[hidden]{display:none!important}\n.pw-hd{\n  display:flex;align-items:center;gap:7px;padding:8px 10px 7px;flex:0 0 auto;\n  cursor:grab;user-select:none;\n  border-bottom:1px solid rgba(var(--w),.08);\n  background:rgba(var(--w),.035);\n}\n.pw-hd:active{cursor:grabbing}\n.pw-hd b{font-size:12.5px;font-weight:600;color:var(--fg)}\n.pw-hd .ph{font-size:11px;color:var(--ghost);font-family:var(--mono)}\n.pw-hd .tag{font-size:10px;padding:1px 5px}\n.pw-hd .mx{margin-left:auto}\n.pw-bd{padding:10px 12px 11px;overflow:auto;flex:1 1 auto;min-height:0}\n.pw-bd .en-def{font-size:12.5px;line-height:1.62;color:var(--fg2);margin:0}\n.pw-bd .zhbox{margin-top:9px;padding-top:9px;border-top:1px dashed rgba(var(--w),.12)}\n.pw-ft{display:flex;align-items:center;gap:7px;margin-top:10px}\n.pw-ft .mini{font-size:11px;padding:4px 9px}\n.pwtip{font-size:10px;color:var(--ghost)}\n\n/* 收进 ? 的那颗：贴在块标题行末尾 */\n.q.hq{margin-left:6px;width:15px;height:15px;font-size:10px}\n\n/* ── 编辑面板 ── */\n.edwarn{\n  margin:0 0 12px;padding:9px 11px;border-radius:9px;font-size:11.5px;line-height:1.62;\n  color:#d8e2ff;background:rgba(111,139,255,.10);border:1px solid rgba(138,169,255,.22);\n}\n.edwarn b{color:#fff}\n.edtxt,.edbg{min-height:54px;padding:8px 10px;line-height:1.55;resize:vertical;font:inherit;font-size:12px}\n.edbg{min-height:86px;font-family:var(--mono);font-size:11.5px}\n.edimg{display:inline-flex;align-items:center;gap:9px}\n.edimg img{width:78px;height:54px;object-fit:cover;border-radius:7px;border:1px solid rgba(var(--w),.10)}\n.edf5{display:inline-flex;gap:6px}\n.edf5 .chip{font-size:11.5px;padding:4px 10px}\n/* ── 学习页：完成绿勾 / 关掉的感叹号 / 两侧词导航 / 底部面导航 ── */\n.fb.done::after{\n  content:\"✓\";position:absolute;top:3px;right:4px;\n  font-size:9.5px;font-weight:700;line-height:1;color:#0e1a13;\n  background:#6fd29a;border-radius:50%;width:13px;height:13px;\n  display:flex;align-items:center;justify-content:center;\n  box-shadow:0 0 10px -2px rgba(111,210,154,.9);\n}\n.fb{position:relative}\n.fb.done{background:rgba(111,210,154,.10);border-color:rgba(111,210,154,.30)}\n.fb.done b,.fb.done{color:#c8f2db}\n.fb.done.on{background:rgba(111,210,154,.16)}\n\n.rv.off::after{\n  content:\"!\";position:absolute;top:6px;right:6px;\n  font-size:9.5px;font-weight:700;line-height:1;color:#2a0d0d;\n  background:#ff8b8b;border-radius:50%;width:13px;height:13px;\n  display:flex;align-items:center;justify-content:center;\n  box-shadow:0 0 10px -2px rgba(255,120,120,.9);\n}\n.rv{position:relative}\n.rv.off{color:var(--ghost);background:rgba(0,0,0,.18);border-color:rgba(255,120,120,.26);border-style:dashed}\n\n.wordnav{\n  position:fixed;top:50%;transform:translateY(-50%);z-index:30;\n  display:inline-flex;align-items:center;gap:6px;padding:9px 12px;border-radius:99px;cursor:pointer;\n  font:inherit;font-size:11.5px;color:var(--fg3);\n  background:rgba(24,27,36,.62);border:1px solid rgba(var(--w),.12);\n  backdrop-filter:blur(12px);\n  transition:color .16s var(--ease),border-color .16s var(--ease),background-color .16s var(--ease);\n}\n.wordnav.prev{left:12px}\n.wordnav.next{right:12px}\n.wordnav:hover{color:var(--fg);border-color:rgba(138,169,255,.45);background:rgba(111,139,255,.14)}\n\n.navstep{\n  position:fixed;bottom:16px;z-index:30;\n  display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:99px;cursor:pointer;\n  font:inherit;font-size:11.5px;color:var(--fg3);\n  background:rgba(24,27,36,.62);border:1px solid rgba(var(--w),.12);\n  backdrop-filter:blur(12px);\n  transition:color .16s var(--ease),border-color .16s var(--ease),background-color .16s var(--ease);\n}\n.navstep.prev{left:16px}\n.navstep.next{right:16px}\n.navstep:hover{color:var(--fg);border-color:rgba(138,169,255,.45);background:rgba(111,139,255,.14)}\n\n.mini.on{color:#eaf0ff;background:rgba(111,139,255,.18);border-color:rgba(138,169,255,.55)}\n\n@media (max-width:900px){\n  .wordnav{padding:7px 9px;font-size:10.5px}\n  .wordnav.prev{left:6px}\n  .wordnav.next{right:6px}\n  .navstep{bottom:10px;padding:7px 11px}\n  .navstep.prev{left:10px}\n  .navstep.next{right:10px}\n}\n/* 两侧单词导航收成圆钮，别压住正文 */\n.wordnav{\n  width:34px;height:34px;padding:0;border-radius:50%;\n  display:flex;align-items:center;justify-content:center;\n  font-size:15px;line-height:1;color:var(--fg2);\n}\n.wordnav span{display:none}\n.wordnav.prev{left:10px}\n.wordnav.next{right:10px}\n.wordnav:hover{color:#eaf0ff}\n/* ══ v46 ══ */\n\n/* 1) 五维度：框做大、行距拉开 */\n.fx-blk.b5 .f5row{padding:11px 0;gap:12px}\n.fx-blk.b5 .f5row .f5name{width:36px;height:36px;border-radius:11px}\n.fx-blk.b5 .f5row .f5name b{font-size:15px}\n.fx-blk.b5 .f5row .f5name .cor{top:-6px;right:-7px;font-size:10px}\n.fx-blk.b5 .f5row em{font-size:11.5px;padding:4px 11px;margin-left:2px}\n.fx-blk.b5 .f5row .d{font-size:12px}\n.fx-blk.b5 .f5row .sw{--sw-w:38px;--sw-h:21px;--sw-k:15px;margin-left:8px}\n.fx-blk.b5 .f5row .sw::after{left:3px}\n.fx-blk.b5 .f5row .sw.on::after{left:3px;transform:translateX(calc(38px - 15px - 6px))}\n\n/* 2) 工厂背景：一条一个框，带编辑 / 减 */\n.bgl{gap:8px}\n.bgl li{\n  display:flex;align-items:flex-start;gap:9px;\n  padding:8px 9px 8px 11px;border-radius:9px;\n  background:rgba(0,0,0,.16);border:1px solid rgba(var(--w),.07);\n  transition:background-color .16s var(--ease),border-color .16s var(--ease);\n}\n.bgl li:hover{background:rgba(var(--w),.05);border-color:rgba(var(--w),.13)}\n.bgl b{flex:0 0 34px;color:var(--fg2)}\n.bgl li span{flex:1 1 auto;min-width:0}\n.bgl .bops{display:flex;gap:4px;flex:0 0 auto;opacity:.55;transition:opacity .16s var(--ease)}\n.bgl li:hover .bops{opacity:1}\n.bgl .bops button{\n  width:20px;height:20px;border-radius:6px;cursor:pointer;\n  font-size:11px;line-height:1;color:var(--fg3);\n  background:rgba(var(--w),.05);border:1px solid rgba(var(--w),.08);\n}\n.bgl .bops button:hover{color:var(--fg);border-color:rgba(138,169,255,.45);background:rgba(111,139,255,.14)}\n.bgl .bops button[data-bgdel]:hover{color:#ffb4b4;border-color:rgba(255,120,120,.45);background:rgba(255,120,120,.14)}\n.bgadd{\n  margin-top:8px;padding:6px 10px;border-radius:8px;cursor:pointer;\n  font:inherit;font-size:11.5px;color:var(--fg3);\n  background:transparent;border:1px dashed rgba(var(--w),.16);\n  transition:color .16s var(--ease),border-color .16s var(--ease),background-color .16s var(--ease);\n}\n.bgadd:hover{color:var(--fg);border-color:rgba(138,169,255,.45);background:rgba(111,139,255,.08)}\n\n/* 3) 浮动小窗：分块 + 每块一个框 + 编辑/加/减 */\n.pw-bd{padding:9px 10px 10px}\n.pw-list{display:flex;flex-direction:column;gap:8px}\n.pw-blk{\n  border-radius:9px;background:rgba(0,0,0,.20);\n  border:1px solid rgba(var(--w),.09);\n  transition:border-color .16s var(--ease),background-color .16s var(--ease);\n}\n.pw-blk:hover{border-color:rgba(var(--w),.16)}\n.pw-blk-h{\n  display:flex;align-items:center;gap:6px;padding:5px 7px 5px 9px;\n  border-bottom:1px solid rgba(var(--w),.07);\n}\n.pw-blk-h b{font-size:10.5px;font-weight:600;color:var(--fg3);letter-spacing:.04em}\n.pw-blk-h .sp{flex:1 1 auto}\n.pw-blk-h button{\n  width:19px;height:19px;border-radius:6px;cursor:pointer;\n  font-size:10.5px;line-height:1;color:var(--fg3);\n  background:rgba(var(--w),.05);border:1px solid rgba(var(--w),.08);\n  transition:color .16s var(--ease),border-color .16s var(--ease),background-color .16s var(--ease);\n}\n.pw-blk-h button:hover{color:var(--fg);border-color:rgba(138,169,255,.45);background:rgba(111,139,255,.14)}\n.pw-blk-h button[data-pwdel]:hover{color:#ffb4b4;border-color:rgba(255,120,120,.45);background:rgba(255,120,120,.14)}\n.pw-blk-b{padding:8px 10px 9px;font-size:12.5px;line-height:1.62;color:var(--fg2)}\n.pw-blk-b[contenteditable=\"true\"]{\n  outline:none;background:rgba(111,139,255,.08);\n  box-shadow:inset 0 0 0 1px rgba(138,169,255,.45);\n}\n.pw-blk.editing{border-color:rgba(138,169,255,.5)}\n.pw-add{display:flex;gap:6px;margin-top:9px}\n.pw-add button{\n  flex:1 1 auto;padding:5px 8px;border-radius:7px;cursor:pointer;\n  font:inherit;font-size:11px;color:var(--fg3);\n  background:transparent;border:1px dashed rgba(var(--w),.16);\n}\n.pw-add button:hover{color:var(--fg);border-color:rgba(138,169,255,.45);background:rgba(111,139,255,.08)}\n.pw-bd .zhbox{margin:0;padding:0;border:0}\n\n/* 拖动时把模糊关掉，跟手 */\n.popwin.dragging{backdrop-filter:none;-webkit-backdrop-filter:none;background:rgba(26,29,38,.94);box-shadow:0 24px 50px -18px rgba(0,0,0,.85)}\n.popwin{will-change:transform}\n\n/* 5) 学习页：两侧圆钮再往外，四个按钮四色 */\n.wordnav.prev{left:2px}\n.wordnav.next{right:2px}\n.wordnav{width:36px;height:36px;font-size:17px}\n.navstep{font-weight:600}\n.navstep.prev{\n  color:#f6d9b0;border-color:rgba(226,163,74,.42);\n  background:linear-gradient(180deg,rgba(226,163,74,.20),rgba(226,163,74,.08));\n  box-shadow:0 0 0 1px rgba(226,163,74,.12),0 6px 18px -10px rgba(226,163,74,.8);\n}\n.navstep.next{\n  color:#cfdcff;border-color:rgba(138,169,255,.55);\n  background:linear-gradient(180deg,rgba(111,139,255,.34),rgba(111,139,255,.16));\n  box-shadow:0 0 0 1px rgba(138,169,255,.18),0 6px 18px -10px rgba(111,139,255,.95);\n}\n.wordnav.prev{\n  color:#d9c6f2;border-color:rgba(184,171,210,.48);\n  background:linear-gradient(180deg,rgba(184,171,210,.26),rgba(184,171,210,.10));\n  box-shadow:0 0 0 1px rgba(184,171,210,.14),0 6px 18px -10px rgba(184,171,210,.9);\n}\n.wordnav.next{\n  color:#b8e8dd;border-color:rgba(70,190,170,.48);\n  background:linear-gradient(180deg,rgba(70,190,170,.26),rgba(70,190,170,.10));\n  box-shadow:0 0 0 1px rgba(70,190,170,.14),0 6px 18px -10px rgba(70,190,170,.9);\n}\n.navstep.prev:hover,.navstep.next:hover,.wordnav.prev:hover,.wordnav.next:hover{filter:brightness(1.18)}\n/* 背景带框之后 3 列太挤，改 2 列 */\n.fx-blk.bbg .bgl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}\n@media (max-width:900px){.fx-blk.bbg .bgl{grid-template-columns:1fr}}\n/* ── v47 三处 ── */\n/* 1) 四个导航离屏幕边远一点，但不压进正文 */\n.wordnav.prev{left:14px}\n.wordnav.next{right:14px}\n.navstep.prev{left:14px}\n.navstep.next{right:14px}\n\n/* 2) 关掉的高亮按钮：红边 + 中间一个发光的红 ! */\n.rv.off{\n  color:rgba(255,190,190,.55);\n  border-color:rgba(255,110,110,.55)!important;\n  background:rgba(255,80,80,.07)!important;\n  box-shadow:0 0 0 1px rgba(255,110,110,.18),0 0 18px -6px rgba(255,80,80,.75);\n}\n.rv.off span,.rv.off i{opacity:.30}\n.rv.off>span:first-child{color:transparent}\n.rv.off::after{\n  content:'!';\n  position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);\n  width:19px;height:19px;border-radius:50%;\n  display:flex;align-items:center;justify-content:center;\n  font-size:12px;font-weight:700;line-height:1;color:#fff;\n  background:radial-gradient(circle at 50% 35%,#ff6a6a,#d8323a);\n  box-shadow:0 0 0 1px rgba(255,140,140,.5),0 0 16px 2px rgba(255,70,70,.65);\n  animation:offpulse 2.4s ease-in-out infinite;\n  pointer-events:none;\n}\n@keyframes offpulse{\n  0%,100%{box-shadow:0 0 0 1px rgba(255,140,140,.5),0 0 12px 1px rgba(255,70,70,.5)}\n  50%{box-shadow:0 0 0 1px rgba(255,160,160,.7),0 0 20px 3px rgba(255,70,70,.85)}\n}\n.rv{position:relative}\n\n/* 3) 搜索层：背景不模糊，透出下面的页面 */\n.palmask{\n  background:rgba(6,8,13,.34);\n  backdrop-filter:none!important;\n  -webkit-backdrop-filter:none!important;\n}\n.palette{cursor:grab}\n.palette.dragging{cursor:grabbing;box-shadow:0 34px 80px rgba(0,0,0,.7)}\n/* ── v50：六个抽屉 ── */\n.st2{display:block;padding:0}\n.stage2{max-width:960px;margin:0 auto;display:flex;flex-direction:column;gap:10px}\n\n.dbar{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin-bottom:4px}\n.db{\n  display:flex;flex-direction:column;gap:3px;align-items:flex-start;\n  padding:9px 11px;border-radius:11px;cursor:pointer;font:inherit;text-align:left;\n  background:rgba(var(--w),.04);border:1px solid rgba(var(--w),.08);color:var(--fg3);\n  transition:background-color .18s var(--ease),border-color .18s var(--ease),color .18s var(--ease),box-shadow .18s var(--ease);\n}\n.db b{font-size:12.5px;font-weight:600;color:var(--fg2)}\n.db i{font-size:10.5px;font-style:normal;color:var(--ghost)}\n.db:hover{border-color:rgba(var(--w),.16);color:var(--fg2)}\n.db.on{background:rgba(var(--w),.08);border-color:rgba(var(--w),.20);color:var(--fg)}\n.db.on b{color:#fff}\n.db.lit{\n  background:rgba(111,139,255,.15);border-color:rgba(138,169,255,.5);\n  box-shadow:0 0 0 1px rgba(138,169,255,.18),0 0 18px -8px rgba(111,139,255,.9);\n}\n.db.lit b{color:#e6eeff}\n.db.lit i{color:#a9bbf2}\n\n/* 抽屉本体：grid-rows 0fr→1fr 才是真的“拉开”，比 max-height 顺 */\n.drw{\n  border:1px solid rgba(var(--w),.075);border-radius:12px;overflow:hidden;\n  background:rgba(var(--w),.022);\n  transition:border-color .2s var(--ease),box-shadow .2s var(--ease),background-color .2s var(--ease);\n}\n.drw.lit{border-color:rgba(138,169,255,.34);box-shadow:0 0 22px -12px rgba(111,139,255,.9)}\n.drw.off{border-color:rgba(255,110,110,.55);background:rgba(255,80,80,.06)}\n.drw-h{\n  width:100%;display:flex;align-items:center;gap:9px;padding:10px 13px;cursor:pointer;\n  font:inherit;text-align:left;background:none;border:0;color:var(--fg3);\n}\n.drw-h b{font-size:12px;font-weight:600;color:var(--fg2)}\n.drw-h .mut{font-size:11px;color:var(--ghost);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.drw-h .car{font-size:10px;color:var(--ghost);transition:transform .3s var(--ease)}\n.drw.open .drw-h .car{transform:rotate(180deg)}\n.drw-b{display:grid;grid-template-rows:0fr;transition:grid-template-rows .38s var(--ease)}\n.drw.open .drw-b{grid-template-rows:1fr}\n.drw-p{overflow:hidden;min-height:0}\n.drw.open .drw-p{padding:0 13px 13px}\n.drw-p>*:first-child{margin-top:2px}\n.dlist{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}\n.dlist li{\n  display:flex;gap:8px;padding:7px 10px;border-radius:8px;\n  background:rgba(0,0,0,.18);border:1px solid rgba(var(--w),.06);font-size:12px;color:var(--fg2);\n}\n.dlist li b{flex:0 0 auto;color:var(--fg3);font-weight:600;font-size:11.5px}\n.arow{display:flex;align-items:center;gap:14px}\n.shot{margin:0}\n.shot img{width:100%;max-height:340px;object-fit:cover;border-radius:10px;display:block}\n.rlink{margin:10px 0 0}\n\n@media (max-width:720px){\n  .dbar{grid-template-columns:repeat(3,minmax(0,1fr))}\n  .dlist{grid-template-columns:1fr}\n}\n/* ── v51：按钮回右栏，主体改窗帘式展开 ── */\n.st2{display:grid;grid-template-columns:minmax(0,1fr) 200px;gap:26px;align-items:start;max-width:1180px;margin:0 auto}\n.stage2{max-width:none;display:flex;flex-direction:column;gap:0;border:1px solid rgba(var(--w),.075);border-radius:14px;overflow:hidden;background:rgba(var(--w),.018)}\n\n.drail{position:sticky;top:14px;display:flex;flex-direction:column;gap:5px}\n.drail .side-h{margin:10px 0 4px;font-size:11px;font-weight:600;letter-spacing:.08em;color:var(--fg3)}\n.drail .side-h:first-child{margin-top:0}\n.drail .exrow{margin-bottom:2px}\n.drail .side-n{margin-top:8px;font-size:10.5px;line-height:1.6;color:var(--ghost)}\n\n/* 抽屉：不要自己的边框，靠分隔线；展开像拉窗帘 */\n.drw{\n  border:0;border-radius:0;background:transparent;overflow:visible;\n  border-top:1px solid rgba(var(--w),.07);\n  box-shadow:none;\n}\n.drw:first-child{border-top:0}\n.drw.lit{box-shadow:inset 3px 0 0 rgba(138,169,255,.55)}\n.drw.off{box-shadow:inset 3px 0 0 rgba(255,110,110,.55)}\n\n.drw-h{padding:11px 15px;gap:10px}\n.drw-h b{font-size:12.5px}\n.drw.open .drw-h{background:rgba(var(--w),.03)}\n.drw-b{display:grid;grid-template-rows:0fr;transition:grid-template-rows .52s cubic-bezier(.22,.9,.18,1)}\n.drw.open .drw-b{grid-template-rows:1fr}\n.drw-p{overflow:hidden;min-height:0;position:relative;padding:0 15px}\n.drw.open .drw-p{padding:2px 15px 15px}\n/* 拉开时一条亮边从上往下扫，像布被拉开 */\n.drw-p::after{\n  content:'';position:absolute;left:0;right:0;top:0;height:70%;pointer-events:none;\n  background:linear-gradient(180deg,rgba(var(--w),.16),rgba(var(--w),0));\n  opacity:0;transform:translateY(-100%);\n}\n.drw.opening .drw-p::after{animation:curtain .52s cubic-bezier(.22,.9,.18,1)}\n@keyframes curtain{\n  0%{opacity:.9;transform:translateY(-100%)}\n  60%{opacity:.45}\n  100%{opacity:0;transform:translateY(120%)}\n}\n/* 内容跟着窗帘一点点出来 */\n.drw-p>*{opacity:0;transform:translateY(-7px);transition:opacity .34s var(--ease),transform .34s var(--ease)}\n.drw.open .drw-p>*{opacity:1;transform:none;transition-delay:.1s}\n\n@media (max-width:1000px){\n  .st2{grid-template-columns:minmax(0,1fr)}\n  .drail{position:static;order:-1;flex-direction:row;flex-wrap:wrap;align-items:center;gap:6px}\n  .drail .side-h,.drail .side-n{display:none}\n  .drail .exrow{flex:0 0 auto}\n  .drail .rv{flex:0 0 auto}\n}\n@media (max-width:1000px){\n  .drail{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-bottom:4px}\n  .drail .exrow{grid-column:1/-1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}\n  .drail .rv{width:auto}\n}\n/* ── v52：两栏对齐、面板变宽、右栏收窄；小窗「钉」 ── */\n.st2{\n  grid-template-columns:minmax(0,1fr) 168px;\n  gap:16px;\n  max-width:none;\n  margin:8px 0 0;\n  align-items:start;\n}\n.stage2{margin-top:0}\n.drail{top:10px;gap:4px}\n.drail .rv{padding:7px 10px;font-size:11.5px}\n.drail .rv i{font-size:10px}\n.drail .side-h{font-size:10.5px;margin:8px 0 3px}\n\n/* 小窗标题栏那颗「钉」 */\n.pw-hd .pin{\n  margin-left:2px;padding:1px 7px;border-radius:6px;cursor:pointer;\n  font:inherit;font-size:10.5px;line-height:1.6;color:var(--fg3);\n  background:rgba(var(--w),.05);border:1px solid rgba(var(--w),.10);\n  transition:color .16s var(--ease),background-color .16s var(--ease),border-color .16s var(--ease);\n}\n.pw-hd .pin:hover{color:var(--fg);border-color:rgba(var(--w),.2)}\n.pw-hd .pin.on{\n  color:#cfe0ff;background:rgba(111,139,255,.20);border-color:rgba(138,169,255,.55);\n  box-shadow:0 0 0 1px rgba(138,169,255,.2);\n}\n/* 拖动时：关掉模糊换实底，跟手 */\n.popwin.dragging{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;background:rgba(22,25,34,.97)}\n.popwin{transition:box-shadow .18s var(--ease)}\n.stage2{margin:0;max-width:none;width:100%}\n/* ── v53 · 工厂：按钮别挤 ── */\n.src4{gap:12px;margin-top:14px}\n.src4 .mini{padding:9px 12px}\n.vopts{margin-top:16px;gap:10px}\n.vopts .mini{padding:7px 12px}\n.mini.own{margin-top:16px}\n.fx-blk .fx-bh .mini{font-size:11.5px;padding:5px 10px}\n.fx-blk .fx-bh{gap:8px}\n.vline{gap:10px;margin-top:12px}\n\n/* ── v53 · 统计：再慢一档，少压一点帧 ── */\n.cv-play .bar,.cv-play .darc,.cv-play .hcol,.cv-play .dot,.cv-play .line2,.cv-play .area2{will-change:transform,opacity}\n/* v53：统计演示再慢一档（用户说太快、掉帧） */\n.cv-js .bar, .cv-play .bar{animation-duration:1.55s}\n.cv-js .line2, .cv-play .line2{animation-duration:1.9s}\n.cv-js .area2, .cv-play .area2{animation-duration:1.7s}\n.cv-js .donut .dc, .cv-play .donut .dc{animation-duration:.85s}\n.cv-js .hcol, .cv-play .hcol{animation-duration:.8s}\n.cv-js .dot, .cv-play .dot{animation-duration:.6s}\n.chart,.chart *{will-change:auto}\n.cv-play .bar,.cv-play .dc,.cv-play .dot{will-change:transform,opacity}\n/* ── v53 · 抽屉改成「细横条 + 角落小字」 ── */\n.drw{position:relative;border-top:none!important;padding:0!important;min-height:0}\n.drw::before{\n  content:'';display:block;height:2px;border-radius:2px;\n  margin:7px 10px 0;opacity:.45;\n  transition:opacity .2s var(--ease),height .2s var(--ease),margin .2s var(--ease);\n}\n.drw[data-drw=bg]::before{background:rgba(226,163,74,.9)}\n.drw[data-drw=media]::before{background:rgba(70,190,170,.9)}\n.drw[data-drw=sent]::before{background:rgba(111,139,255,.9)}\n.drw[data-drw=audio]::before{background:rgba(184,171,210,.95)}\n.drw[data-drw=rec]::before{background:rgba(240,110,110,.85)}\n.drw[data-drw=type]::before{background:rgba(110,200,140,.9)}\n.drw[data-drw=vary]::before{background:rgba(200,140,220,.9)}\n.drw.open::before{opacity:.9}\n.drw.lit::before{opacity:1;height:3px}\n.drw.off::before{opacity:.85;background:rgba(255,110,110,.8)!important}\n\n/* 标题收成右上角的小字 */\n.drw-h{\n  position:absolute;top:6px;right:10px;left:auto;z-index:3;\n  display:inline-flex;align-items:center;gap:5px;\n  padding:0;background:none;border:none;box-shadow:none;\n  font-size:10px;line-height:1;color:var(--ghost);opacity:.5;\n  transition:opacity .2s var(--ease),color .2s var(--ease);\n}\n.drw-h b{font-weight:600;font-size:10px;letter-spacing:.04em}\n.drw-h .mut,.drw-h .car,.drw-h .sp{display:none}\n.drw-h:hover{opacity:1;color:var(--fg2)}\n.drw.open .drw-h{opacity:.42}\n.drw-b{margin-top:2px}\n.drw.open{padding-bottom:10px!important}\n.drw-p{padding:0 14px}\n\n/* 句子里那个词：同色系，只比整句亮一点点 */\n#sentLine .tgt, .sent .tgt, p.big .tgt{\n  color:#cfd8f5;text-decoration:none;\n  border-bottom:1px solid rgba(138,169,255,.55);\n  padding-bottom:1px;\n}\n/* 让角落标签真的靠右（有旧规则给了 left:10px，两个都写就横向拉满） */\n.stage2 .drw .drw-h{left:auto!important;right:10px;width:auto;max-width:none}\n/* 全揭开挪到右栏按钮下面，铺满一列 */\n.drail .allbtn{width:100%;justify-content:center;margin-top:6px;padding:8px 10px;font-size:11.5px}\n.drail .allbtn.on{color:#dfe8ff;background:rgba(111,139,255,.16);border-color:rgba(138,169,255,.5)}\n/* ── 启动页：星轨 / 吸积盘 / 黑洞 ── */\nbody.splash-body{background:#020307;overflow:hidden}\n#sky{position:fixed;inset:0;z-index:0;display:block}\nbody.splash-body .splash2{background:none}\nbody.splash-body .splash2::before,\nbody.splash-body .splash2::after{display:none}\n.splash-body .sp2-inner{position:relative;z-index:2}\n.splash-body .sp2-wordmark,\n.splash-body .sp2-title{transition:opacity .5s var(--ease),transform .5s var(--ease)}\n/* 入场动画的 fill-mode 会压住 opacity，点火前得先把它关掉 */\nbody.igniting .sp2-wordmark,\nbody.igniting .sp2-title{animation:none!important;opacity:0;transform:translateY(-10px)}\nbody.igniting .sp2-act .btn{opacity:.0;transform:scale(.94)}\n.splash-body .sp2-act .btn{transition:opacity .4s var(--ease),transform .4s var(--ease)}\n.splash-body .sp2-act .btn.busy{pointer-events:none}\n/* 中心压暗一层，标题和按钮才压得住星轨 */\n.sky-veil{\n  position:fixed;inset:0;z-index:1;pointer-events:none;\n  background:radial-gradient(44% 38% at 50% 47%, rgba(2,3,7,.86), rgba(2,3,7,.5) 58%, rgba(2,3,7,0) 80%);\n}\n/* 压暗要更宽更透，边缘才看不出一个圆盘 */\n.sky-veil{\n  background:radial-gradient(58% 52% at 50% 45%, rgba(2,3,7,.9), rgba(2,3,7,.6) 42%, rgba(2,3,7,.22) 68%, rgba(2,3,7,0) 88%);\n}\n/* ── 进出场：方格翻面 ── */\n#trwave{\n  position:fixed;inset:0;z-index:9000;pointer-events:none;\n  perspective:900px;overflow:hidden;\n}\n#trwave i{\n  position:absolute;display:block;\n  width:64px;height:64px;\n  background:#05060a;\n  transform-origin:center center;\n  backface-visibility:hidden;\n  will-change:transform,opacity;\n  opacity:0;transform:rotateX(90deg);\n}\n#trwave.out i{animation:tr-flip-in .38s cubic-bezier(.4,0,.2,1) forwards}\n#trwave.in  i{opacity:1;transform:rotateX(0deg);animation:tr-flip-out .34s cubic-bezier(.4,0,.2,1) forwards}\n#trwave.hold i{opacity:1;transform:rotateX(0deg);animation:none}\n@keyframes tr-flip-in{\n  0%{opacity:0;transform:rotateX(88deg) scale(.98)}\n  60%{opacity:1}\n  100%{opacity:1;transform:rotateX(0deg) scale(1)}\n}\n@keyframes tr-flip-out{\n  0%{opacity:1;transform:rotateX(0deg)}\n  40%{opacity:1}\n  100%{opacity:0;transform:rotateX(-88deg) scale(.98)}\n}\n@media (prefers-reduced-motion: reduce){\n  #trwave.out i{animation:none;opacity:1;transform:none}\n  #trwave.in  i{animation:none;opacity:0}\n}\n/* 醒来：抵达时一层薄雾化开 */\n.trwake{\n  position:fixed;inset:0;z-index:9100;pointer-events:none;\n  background:radial-gradient(70% 60% at 50% 45%, rgba(226,236,255,.20), rgba(180,200,255,.10) 55%, rgba(0,0,0,0) 85%);\n  animation:tr-wake .95s cubic-bezier(.3,0,.2,1) forwards;\n}\n@keyframes tr-wake{\n  0%{opacity:0;backdrop-filter:blur(7px)}\n  22%{opacity:1}\n  100%{opacity:0;backdrop-filter:blur(0px)}\n}\n/* 启动页「开启」：内容随遮罩一起轻轻退场，不是被一刀盖住 */\n.splash-body.leaving .sp2-inner{opacity:0;transform:scale(.986);transition:opacity .46s ease,transform .46s ease}\n.splash-body.leaving .sp2-wordmark{opacity:0;transition:opacity .34s ease}\n\n/* ── v60 · 抽屉的分隔重做：一条细线 + 一个小色点，颜色只做标记不做条纹 ── */\n.drw{\n  --dot:rgba(170,180,200,.5);\n  border-top:1px solid rgba(var(--w),.062)!important;\n  padding:0!important;min-height:0;box-shadow:none!important;\n  background:none!important;\n}\n.drw:first-of-type{border-top:0!important}\n.drw[data-drw=bg]{--dot:#dfa053}\n.drw[data-drw=media]{--dot:#4bbbac}\n.drw[data-drw=sent]{--dot:#7b94ff}\n.drw[data-drw=audio]{--dot:#b7aad0}\n.drw[data-drw=rec]{--dot:#e57777}\n.drw[data-drw=type]{--dot:#6cc48b}\n.drw[data-drw=vary]{--dot:#c58fda}\n\n/* 收起：左侧一颗 5px 小点 */\n.stage2 .drw::before{\n  content:'';display:block;position:absolute;left:15px;top:50%;\n  width:5px;height:5px;margin-top:-2.5px;border-radius:50%;\n  background:var(--dot);opacity:.5;\n  transition:opacity .2s var(--ease),left .26s var(--ease),top .26s var(--ease),\n             width .26s var(--ease),height .26s var(--ease),margin .26s var(--ease),\n             border-radius .26s var(--ease);\n}\n.stage2 .drw:hover::before{opacity:.85}\n.stage2 .drw.lit::before{opacity:1}\n.stage2 .drw.off::before{background:#ef6b6b;opacity:1}\n/* 展开：小点长成左侧一道竖条 */\n.stage2 .drw.open::before{\n  left:15px;top:12px;bottom:14px;margin-top:0;\n  width:2px;height:auto;border-radius:2px;opacity:.92;\n}\n\n/* 标题变回一行正经的列表项 */\n.stage2 .drw .drw-h{\n  position:static!important;left:auto!important;right:auto!important;\n  display:flex!important;align-items:center;gap:10px;width:100%;\n  padding:11px 15px 11px 31px!important;\n  background:none!important;border:0!important;box-shadow:none!important;\n  font-size:12.5px!important;line-height:1.2!important;\n  color:rgba(var(--w),.58)!important;text-align:left;opacity:1!important;\n  transition:color .2s var(--ease);\n}\n.stage2 .drw .drw-h b{\n  font-size:12.5px!important;font-weight:500!important;\n  letter-spacing:.01em!important;color:inherit!important;\n}\n.stage2 .drw .drw-h .mut,.stage2 .drw .drw-h .sp{display:none!important}\n.stage2 .drw .drw-h .car{\n  display:inline-block!important;margin-left:auto;\n  font-size:9px;color:rgba(var(--w),.24);\n  transition:transform .26s var(--ease),color .2s var(--ease);\n}\n.stage2 .drw .drw-h:hover{color:rgba(var(--w),.9)!important}\n.stage2 .drw.open .drw-h{color:rgba(var(--w),.94)!important}\n.stage2 .drw.open .drw-h .car{transform:rotate(180deg);color:rgba(var(--w),.45)}\n/* 内容跟着标题的缩进，不再顶到边上 */\n.stage2 .drw .drw-p{padding:0 15px 0 31px!important}\n.stage2 .drw.open .drw-p{padding:2px 15px 15px 31px!important}\n.stage2 .drw.open{padding-bottom:0!important}\n\n/* v60b：右箭头画成真的箭头，平时不抢眼，指向才出现 */\n.stage2 .drw .drw-h{padding-left:34px!important}\n.stage2 .drw .drw-p,.stage2 .drw.open .drw-p{padding-left:34px!important}\n.stage2 .drw .drw-h .car{\n  display:block!important;margin-left:auto;width:6px;height:6px;\n  font-size:0!important;line-height:0;\n  border-right:1.3px solid rgba(var(--w),.26);border-bottom:1.3px solid rgba(var(--w),.26);\n  transform:rotate(45deg);opacity:0;margin-right:2px;\n  transition:opacity .2s var(--ease),transform .26s var(--ease),border-color .2s var(--ease);\n}\n.stage2 .drw:hover .drw-h .car{opacity:.75}\n.stage2 .drw.open .drw-h .car{opacity:.55;transform:rotate(225deg);border-color:rgba(var(--w),.4)}\n\n/* v60c：窄屏回到单栏（v52 的两栏规则写在媒体查询后面，把窄屏那条盖掉了） */\n@media (max-width:1000px){\n  .st2{grid-template-columns:minmax(0,1fr)}\n  .stage2{min-height:0}\n}\n\n/* v60d：窄屏时，两枚悬浮的翻词箭头跟内容打架，收起来（底部仍有「下一个」） */\n@media (max-width:1000px){\n  .wordnav{display:none}\n}\n\n/* v60e：没点开的那几块，字再淡一档，收起的只剩「这里还有一块」 */\n.stage2 .drw .drw-h{color:rgba(var(--w),.38)!important}\n.stage2 .drw.lit .drw-h{color:rgba(var(--w),.5)!important}\n.stage2 .drw .drw-h:hover{color:rgba(var(--w),.82)!important}\n.stage2 .drw.open .drw-h{color:rgba(var(--w),.95)!important}\n.stage2 .drw::before{opacity:.4}\n.stage2 .drw.lit::before{opacity:.85}\n\n/* 学习页 v62 · 原骨架不动，只改细节\n   五面横条 / 七块抽屉 / 右栏 / 底部四格评分，位置和顺序全保留。\n   动的只有：颜色收敛、间距取 4 的倍数、字号收敛成 6 级、右栏触控尺寸、900 宽那一栏的折法。 */\n\n/* ── 1 五面横条 ───────────────────────────── */\n.fbar{gap:8px;margin:12px 0 12px;padding:8px;border-radius:14px}\n.fb{padding:8px 16px;border-radius:999px;gap:4px;min-height:44px;justify-content:center}\n.fb b{font-size:14px;font-weight:500}\n.fb i{font-size:11px}\n.fb.on{border-radius:999px}\n.fb.on i{color:rgba(var(--accent-rgb),.75)}\n.fb.done{background:rgba(var(--accent-rgb),.08);border:1px solid rgba(var(--accent-rgb),.20)}\n.fb.done b,.fb.done{color:var(--fg2)}\n.fb.done.on{background:rgba(var(--accent-rgb),.16);border-color:rgba(var(--accent-rgb),.32)}\n\n/* ── 2 七块抽屉：七个色相 → 一个中性点，当前块才给主色 ────── */\n.stage2 .drw{--dot:var(--fg3)}\n.stage2 .drw::before{width:6px;height:6px;border-radius:999px;opacity:.45}\n.stage2 .drw:hover::before{opacity:.75;background:var(--fg2)}\n.stage2 .drw.lit::before{opacity:1;background:var(--accent)}\n.stage2 .drw.open::before{opacity:1;background:var(--accent)}\n.stage2 .drw.off::before{background:var(--danger);opacity:1}\n.stage2 .drw .drw-h{padding:12px 16px 12px 36px!important;gap:8px}\n.stage2 .drw .drw-h b{font-size:14px;font-weight:500;color:var(--fg2)!important;letter-spacing:0}\n.stage2 .drw.open .drw-h b{color:var(--fg)!important}\n/* 说明原来被 display:none!important 吃掉了，接回来，右对齐贴到折叠箭头左边 */\n.stage2 .drw .drw-h .mut{display:block!important;flex:1;min-width:0;margin-left:12px;text-align:right;\n  font-size:11px;color:var(--ghost);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.stage2 .drw.open .drw-h .mut{color:var(--fg3)}\n.stage2 .drw .drw-p,.stage2 .drw.open .drw-p{padding-left:36px!important}\n.stage2 .big{font-size:20px;line-height:1.5}\n\n/* ── 3 右栏：32 高、字号 12，全是 4 的倍数 ────────────── */\n.drail{gap:4px}\n.drail .side-h{margin:12px 0 8px;font-size:11px;font-weight:500;letter-spacing:.06em;color:var(--fg3)}\n.drail .side-h:first-child{margin-top:0}\n.drail .exrow{gap:8px;margin-bottom:0}\n.drail .ex{height:32px;padding:0 12px;border-radius:6px;font-size:12px}\n.drail .ex i{font-size:11px}\n.drail .rv{height:32px;padding:0 12px;border-radius:6px;font-size:12px;\n  background:transparent;border-color:rgba(var(--w),.08);color:var(--fg2)}\n.drail .rv i{font-size:11px}\n/* 高亮跟着真正展开的那一块（静态页展开的是「句子」），不再固定在第一项 */\n.drail .rv[data-drw=\"sent\"]{color:var(--accent);border-color:rgba(var(--accent-rgb),.30);background:rgba(var(--accent-rgb),.12)}\n.drail .rv[data-drw=\"sent\"] i{color:rgba(var(--accent-rgb),.75)}\n.drail .rv:hover{color:var(--fg);border-color:rgba(var(--w),.20)}\n.drail .allbtn{height:32px;margin-top:8px;padding:0 12px;border-radius:6px;font-size:12px}\n.drail .side-n{margin-top:8px;font-size:11px;line-height:1.6}\n\n/* ── 4 评分四档：四个色相 → 主色明度阶，推荐档最实 ────────── */\n.st-rate{gap:12px;margin-top:12px}\n.st-r{padding:12px 8px;border-radius:14px;gap:4px;border:1px solid rgba(var(--w),.10);\n  background:transparent;color:var(--fg3);filter:none;box-shadow:none}\n.st-r b{font-size:14px;font-weight:500}\n.st-r em{font-size:11px;color:inherit;opacity:.6}\n.st-r:nth-child(1){color:var(--fg3);border-color:rgba(var(--w),.10);background:transparent}\n.st-r:nth-child(2){color:var(--fg2);border-color:rgba(var(--w),.16);background:rgba(var(--w),.03)}\n.st-r:nth-child(3),.st-r.good{color:var(--on-accent);border-color:var(--accent);background:var(--accent);box-shadow:none}\n.st-r:nth-child(4){color:var(--fg2);border-color:rgba(var(--accent-rgb),.40);background:rgba(var(--accent-rgb),.10)}\n.st-r:hover{filter:none;background:rgba(var(--w),.06)}\n.st-r.good:hover{filter:brightness(1.06);background:var(--accent)}\n\n/* ── 5 字阶收敛成 28 / 20 / 14 / 12 / 11 / 10 ─────────── */\n.st-crumb,.st-crumb a{font-size:11px;color:var(--ghost)}\n.st-idx{display:flex;align-items:baseline;gap:12px}\n.st-idx .wd{font-size:28px;font-weight:600;line-height:1.15}\n.st-where{font-size:11px;color:var(--ghost)}\n.hdr .btn.ghost{padding:8px 16px;font-size:12px;border-radius:999px}\n.st-keys{margin-top:8px;font-size:11px;color:var(--ghost)}\n.st-keys .kbd{font-size:10px;min-width:16px;height:16px;line-height:16px}\n.navstep,.wordnav{font-size:12px}\n\n/* ── 6 窄屏：右栏原来掉成两列按钮墙，改成抽屉下面横着滚一条 ── */\n/* 1024~1200 这一段内容会顶到两侧的悬浮翻页钮，给页面留出 56 的侧边 */\n@media (max-width:1200px){\n  .screen.study{padding-left:56px;padding-right:56px}\n}\n@media (max-width:1100px){\n  /* 两侧已经有 ‹ › 翻单词，底部这两个大按钮是重复的，还会压住评分键与快捷键行 */\n  .navstep{display:none}\n}\n@media (max-width:1000px){\n  .st2{display:flex;flex-direction:column;gap:16px}\n  .drail{order:2;display:flex;flex-direction:row;flex-wrap:nowrap;overflow-x:auto;gap:8px;\n    position:static;padding-bottom:4px}\n  .drail .side-h,.drail .side-n{display:none}\n  .drail .exrow{display:contents}\n  .drail .rv,.drail .allbtn,.drail .ex{flex:0 0 auto;width:auto;height:36px;margin:0;white-space:nowrap}\n  .st-rate{gap:8px;grid-template-columns:repeat(4,1fr);margin-bottom:16px}\n  .st-r{padding:12px 4px}\n}\n\n/* ===== v63 · 工厂页（原骨架不动，只改细节） ===== */\n\n/* ── 1 面板与标题：圆角归 14，内边距归 4 的倍数 ───────────── */\n.fx-blk{padding:12px 16px 16px;border-radius:14px}\n.fx-bh{font-size:12px;font-weight:500;gap:8px;margin-bottom:12px;color:var(--fg2)}\n.fx-bh b,.fx-bh strong{font-weight:500}\n.fx-blk>.fx-row{gap:8px}\n.fx-row{border-radius:14px}\n.mcard{padding:0}\n.mhd{padding:16px 16px 12px}\n\n/* ── 2 五维度：行高收紧，块和开关都收进规格 ─────────────── */\n.f5row{gap:12px;padding:8px 0;min-height:52px}\n.f5name{width:40px;height:32px;border-radius:6px;font-size:12px;display:flex;align-items:center;justify-content:center}\n.f5row .mut{font-size:11px}\n.f5row .fdot{width:6px;height:6px;margin-left:0}\n.f5row>span.sp{flex:1}\n.sw{width:40px;height:24px;border-radius:999px;transition:background .16s cubic-bezier(.22,.9,.18,1)}\n.sw::after{width:16px;height:16px;border-radius:999px;transition:transform .16s cubic-bezier(.22,.9,.18,1)}\n.sw.on::after{transform:translateX(16px)}\n\n/* ── 3 状态 chip：绿/琥珀 → 主色 / 警示（用现成 token，不写新色） ── */\n.chip{border-radius:999px;font-size:11px;line-height:1;padding:5px 8px;gap:4px;height:22px}\n.chip.ok{background:var(--accent-cont);color:var(--accent);border-color:transparent}\n.chip.warn{background:var(--danger-cont);color:var(--danger);border-color:transparent}\n.chip.bad{background:var(--danger-cont);color:var(--danger);border-color:transparent}\n.chip.ok i,.chip.warn i,.chip.bad i{display:none}\n\n/* ── 4 面板右上那些彩色小动作：一律中性描边，主色只留给真主动作 ── */\n.mini.c-teal,.mini.go,.mini.xs.go{color:var(--fg2);border-color:rgba(var(--w),.12);background:transparent}\n.mini.c-teal:hover,.mini.go:hover,.mini.xs.go:hover{color:var(--fg);border-color:rgba(var(--w),.24);background:rgba(var(--w),.04)}\n.mini.xs.danger{color:var(--danger);border-color:rgba(var(--w),.12);background:transparent}\n.mini.xs.danger:hover{color:var(--danger);border-color:var(--danger-cont);background:var(--danger-cont)}\n.mini{border-radius:6px;height:28px;padding:0 12px;font-size:11px;\n  transition:color .16s cubic-bezier(.22,.9,.18,1),border-color .16s cubic-bezier(.22,.9,.18,1),\n             background .16s cubic-bezier(.22,.9,.18,1)}\n.mini.xs{height:28px;padding:0 8px}\n.mini.ic{width:28px;padding:0}\n.btn.sm{height:28px;padding:0 12px;font-size:12px;border-radius:999px}\n.btn.sm.primary{background:var(--accent);color:var(--on-accent);border-color:transparent}\n\n/* ── 5 义项与句子行：字阶收敛到 12/11，行距统一 ──────────── */\n.fx-sense{border-radius:14px}\n.fx-sense .dh,.fx-sense .dn{font-size:12px}\n.dsent{font-size:20px;line-height:1.4}\n.fx-foot{margin:12px 0 0;font-size:11px;line-height:1.6}\n\n/* ── 6 左栏词列表：小圆点统一 6px，选中行才给主色 ─────────── */\n.ords .fdot,.ords .pl .fdot{width:6px;height:6px;background:rgba(var(--w),.18)}\n.ords .pl.on .fdot{background:var(--accent)}\n.ords .pl{height:32px;border-radius:6px}\n\n/* ── 7 状态反馈：只做位移与底色，不弹跳 ────────────────── */\n.fx-blk{transition:border-color .18s cubic-bezier(.22,.9,.18,1),background .18s cubic-bezier(.22,.9,.18,1)}\n.fx-blk:hover{border-color:rgba(var(--w),.10)}\n.f5row:hover .f5name{background:rgba(var(--accent-rgb),.14)}\n\n/* ===== v63b · 工厂页状态色与彩色小动作（补第一次没打中的那些类） ===== */\n\n/* 状态文字：齐了 / 差 N 个 —— 绿色下线，齐了用主色，缺口用警示 */\n.f5row em.ok,.olist em.ok,.fx-sense em.ok{color:var(--accent);background:var(--accent-cont);border-radius:999px;\n  padding:4px 8px;font-size:11px;line-height:1;font-style:normal}\n.f5row em.warn,.olist em.warn,.fx-sense em.warn{color:var(--danger);background:var(--danger-cont);border-radius:999px;\n  padding:4px 8px;font-size:11px;line-height:1;font-style:normal}\n\n/* 五维进度点：ok 主色 / warn 警示 / 空 中性 */\n.pips i{width:12px;height:4px;border-radius:99px;background:rgba(var(--w),.14);box-shadow:none}\n.pips i.ok{background:var(--accent)}\n.pips i.warn{background:var(--danger)}\n.pips i.bad{background:var(--danger)}\n\n/* 左栏词表的小圆点：有缺口才给色，其余中性 */\n.fdot.ok{background:var(--accent)}\n.fdot.warn{background:var(--danger)}\nli.on>.fdot,li.on .fdot.ok{background:var(--accent)}\n\n/* 琥珀/松石描边小按钮 → 中性；琥珀那只（免费鸡蛋）用警示色，因为它花钱/花额度 */\n.mini.c-amber{color:var(--danger);border-color:var(--danger-cont);background:transparent}\n.mini.c-amber:hover{color:var(--danger);border-color:var(--danger);background:var(--danger-cont)}\n.mini.c-teal{color:var(--fg2);border-color:rgba(var(--w),.12);background:transparent}\n.mini.c-teal:hover{color:var(--fg);border-color:rgba(var(--w),.24);background:rgba(var(--w),.04)}\n\n/* ===== v63c · 工厂页五维方块回到主色 ===== */\n.f5name{color:var(--accent);background:rgba(var(--accent-rgb),.10);border-color:transparent}\n.f5name b{color:inherit;font-weight:500;font-size:12px}\n.f5name:hover{background:rgba(var(--accent-rgb),.18)}\n.f5name .cor{color:rgba(var(--accent-rgb),.55);font-size:9px}\n/* 五个方块现在带底，行里再 hover 换底会跳，去掉那条 */\n.f5row:hover .f5name{background:rgba(var(--accent-rgb),.18)}\n\n/* ===== v63d · 工厂页：状态条分组、义项折叠钮 ===== */\n\n/* 状态条：总数 | 三个子集 | 语言，用细分隔线分组，数字不再看起来并列 */\n.fx-info{gap:12px}\n.fx-info>span{font-size:12px;color:var(--fg3);display:inline-flex;align-items:baseline;gap:4px}\n.fx-info>span b{font-family:var(--mono);font-size:12px;color:var(--fg);font-weight:500}\n.fx-info>span.sub b{color:var(--fg2)}\n.fx-info>span.sub{color:var(--fg3)}\n.fx-info .sep{width:1px;height:12px;background:var(--line);display:inline-block;align-self:center}\n\n/* 义项折叠钮：24 的命中区，展开时箭头朝下，收起时朝右 */\n.sense-tg{width:24px;height:24px;flex:0 0 auto;display:flex;align-items:center;justify-content:center;\n  border-radius:6px;border:1px solid transparent;background:transparent;color:var(--fg3);cursor:pointer;\n  transition:color .16s cubic-bezier(.22,.9,.18,1),background .16s cubic-bezier(.22,.9,.18,1)}\n.sense-tg i{font-style:normal;font-size:10px;line-height:1;display:block;\n  transition:transform .18s cubic-bezier(.22,.9,.18,1);transform:rotate(0deg)}\n.sense-tg[aria-expanded=\"false\"] i{transform:rotate(-90deg)}\n.sense-tg:hover{color:var(--fg);background:rgba(var(--w),.06);border-color:rgba(var(--w),.10)}\n.fx-def{gap:8px}\n\n/* ===== v64 · 统计页：六色相收成主色明度阶 =====\n   原则：1 主色（#97B1F0）的明度阶 + 1 警示（--danger）+ 中性（--fg3/--ghost）。\n   形态不变，只换图的颜色和表格里两列的色，图例跟着走。 */\n\n/* 环图 + 图例：一张图一套阶，占比越大越深 */\n.legend .c1{background:#7E93C8}\n.legend .c2{background:#656971}\n.legend .c3{background:#97B1F0}\n.legend .c4{background:#E69089}\n.legend .c5{background:#55689A}\n.legend .c6{background:#3F4E72}\n.legend .c7{background:#B9C9F6}\n.legend .c8{background:#4A4F5A}\n.legend .c9{background:#8FA6DE}\n.legend .c10{background:#D5DFFA}\n.legend .c11{background:#6E82BA}\n.legend .c12{background:#B9C9F6}\n.legend .c13{background:#8FA6DE}\n\n/* 面积 / 堆叠 / 散点 */\n.c1{fill:#7E93C8} .c2{fill:#656971} .c3{fill:#97B1F0} .c4{fill:#E69089}\n.c5{fill:#55689A} .c6{fill:#3F4E72} .c7{fill:#B9C9F6} .c8{fill:#4A4F5A}\n.c9{fill:#8FA6DE} .c10{fill:#D5DFFA} .c11{fill:#6E82BA} .c12{fill:#B9C9F6} .c13{fill:#8FA6DE}\n\n/* 柱：原来六条彩色渐变，改成一个阶的实色（渐变只留给主色那一根） */\n.bar.c1{fill:url(#grad-blue)}\n.bar.c2{fill:#656971}\n.bar.c3{fill:#97B1F0}\n.bar.c4{fill:#E69089}\n.bar.c5{fill:#55689A}\n.bar.c6{fill:#3F4E72}\n\n/* 环：段与段之间留 2.4 的缺口，深色底上不描边也不会糊 */\n.donut .dc.c1{stroke:#7E93C8}\n.donut .dc.c2{stroke:#656971}\n.donut .dc.c3{stroke:#97B1F0}\n.donut .dc.c4{stroke:#E69089}\n.donut .dc.c5{stroke:#55689A}\n.donut .dc.c6{stroke:#3F4E72}\n.donut .dc.c7{stroke:#B9C9F6}\n.donut .dc.c8{stroke:#4A4F5A}\n\n/* 记忆保留率：绿 / 蓝两列改成「主色阶 」与「中性」 */\ntable.rt thead th.g{color:#7E93C8}\ntable.rt thead th.b{color:var(--fg3)}\ntable.rt td.g{color:#B9C9F6}\ntable.rt td.b{color:var(--fg3)}\n\n/* ===== v64b · 统计页色阶微调：主色给最大块，越熟越浅 =====\n   v64 里把 70% 的「欠熟练」放在最深的 #3F4E72，深底上糊成一块；\n   改成主色给最大块，浅阶往「已熟练」方向走，读起来是「越亮越熟」。 */\n.c1{fill:#6E82BA}\n.c3{fill:#B9C9F6}\n.c6{fill:#97B1F0}\n.c7{fill:#D5DFFA}\n\n.legend .c1{background:#6E82BA}\n.legend .c3{background:#B9C9F6}\n.legend .c6{background:#97B1F0}\n.legend .c7{background:#D5DFFA}\n\n.donut .dc.c1{stroke:#6E82BA}\n.donut .dc.c3{stroke:#B9C9F6}\n.donut .dc.c6{stroke:#97B1F0}\n.donut .dc.c7{stroke:#D5DFFA}\n\n/* ===== v61 · 打磨第一屏：卡片页（候选 C「今日先」） =====\n   注意：这一段在 app.css 被 git 恢复时丢过一次，这里按当时定版重建。 */\n\n:host{--r-sm:6px;--r-md:14px;--r-lg:14px;--r-xl:14px}\n\n/* 页宽与节奏 */\n.screen.half{max-width:1040px;gap:24px;padding:0 0 32px}\n.screen.half .hdr{flex-direction:row;align-items:flex-start;justify-content:space-between;flex-wrap:nowrap;gap:12px}\n.screen.half .hdr h1{white-space:nowrap;font-size:24px}\n.screen.half .hdr .act{width:auto;justify-content:flex-end}\n.cards2{grid-template-columns:minmax(0,1fr) 360px;gap:24px;align-items:start}\n.c-l{gap:12px}\n.c-r{top:16px;gap:16px}\n\n/* 牌组表：撑开行高、数字换 mono、待复习收成主色胶囊 */\n.deckcard{padding:0;border-radius:14px}\n.deckhead,.drow{grid-template-columns:minmax(0,1fr) 64px 64px 80px 36px;gap:8px;padding:0 16px}\n.deckhead{height:36px;border-bottom:1px solid var(--line)}\n.deckhead .dname{font-size:11px;color:var(--fg3)}\n.deckhead>.dnum{text-align:right;justify-self:stretch;font-size:11px;color:var(--fg3)}\n.deckhead>.dnum.due{color:var(--accent)}\n.drow{height:44px}\n.drow+.drow{border-top:1px solid rgba(var(--w),.05)}\n.drow .dname{font-size:14px}\n.drow.child .dname{font-size:13px}\n.dnum{font-family:var(--mono);font-size:12px;color:var(--fg3);justify-self:end}\n.drow>.dnum:nth-child(2),\n.drow>.dnum:nth-child(3){color:var(--fg3)}\n.dnum.due{color:var(--accent);font-weight:600;justify-self:center;\n  min-width:32px;padding:4px 8px;border-radius:999px;background:rgba(var(--accent-rgb),.14)}\n.dnum.due.z{background:none!important;color:var(--ghost)!important;font-weight:400;min-width:0;padding:0}\n.drow .chip{padding:4px 8px;font-size:11px}\n.gear{width:28px;height:28px}\n.deckstat{font-size:12px;color:var(--fg3);padding:8px 4px 0}\n\n/* 接着练：放大成主角 */\n.nextup{padding:24px;gap:16px;border-radius:14px}\n.nextup .sec-title{font-size:11px;color:var(--fg3)}\n.nextup .word{font-size:28px;font-weight:600}\n.nextup .qline{font-size:16px;color:var(--fg2)}\n.nextup .mut{font-size:13px;color:var(--fg3)}\n.nextup-foot{gap:16px;margin-top:8px}\n.nextup-foot .btn{padding:12px 16px;font-size:14px;width:100%}\n.faces{gap:16px}\n.face{font-size:12px;color:var(--fg3)}\n\n/* 状态点：绿下线，主色 = 齐、白 = 待、警示 = 缺 */\n.pip{width:8px;height:8px;border-radius:999px}\n.pip.ok{background:var(--accent);box-shadow:none}\n.pip.warn{background:rgba(var(--w),.34);box-shadow:none}\n.pip.bad{background:var(--danger);box-shadow:none}\n.pip.now{background:var(--accent);animation:none}\n.chip.live i{width:6px;height:6px;background:var(--accent);box-shadow:0 0 0 2px rgba(var(--accent-rgb),.16)}\n\n/* 底部三个入口：左对齐贴底 */\n.deckfoot{justify-content:flex-start;gap:8px;padding:0 4px 8px}\n.deckfoot .btn{padding:4px 12px;font-size:12px}\n\n/* 窄屏 */\n@media (max-width:1100px){#animToggle{display:none}}\n@media (max-width:1024px){\n  .cards2{grid-template-columns:minmax(0,1fr);gap:16px;align-content:start}\n  .c-r{position:static}\n}\n@media (max-width:900px){\n  .deckhead,.drow{grid-template-columns:minmax(0,1fr) 48px 48px 64px 32px}\n  .nextup{padding:16px}\n  .nextup .word{font-size:24px}\n}\n.drow .dname a{text-decoration:none}\n\n/* ===== v65 · 学习页评分四键：先保证看得清，再谈层级 =====\n   毛病：v62 把「良好」做成主色实心底，但文字颜色还是 v60 的浅蓝 #b9caff，\n   浅蓝落浅蓝 = 糊成一片；另外三档底色几乎等于背景，字也压得太淡。\n   改法：四档同一套底与边，只有「良好」带主色淡底 + 主色边来突出；\n   字色跟底色脱钩，永远用 fg/fg2/fg3，谁也不会再互相踩。 */\n\n.st-rate{grid-template-columns:repeat(4,1fr);gap:12px;margin-top:12px;padding:0 56px}\n.st-r{\n  background:rgba(var(--w),.03);\n  border:1px solid rgba(var(--w),.10);\n  border-radius:14px;\n  padding:12px 8px;\n  color:var(--fg2);\n  transition:background .16s cubic-bezier(.22,.9,.18,1),\n             border-color .16s cubic-bezier(.22,.9,.18,1),\n             color .16s cubic-bezier(.22,.9,.18,1);\n}\n.st-r b{color:var(--fg);font-size:16px;font-weight:500;display:block}\n.st-r em{color:var(--fg2);font-size:12px;font-style:normal;display:block;margin-top:4px}\n.st-r:hover{background:rgba(var(--w),.06);border-color:rgba(var(--w),.18);color:var(--fg)}\n.st-r:hover b{color:var(--fg)}\n\n/* 推荐档：主色淡底 + 主色边，字仍然是 fg，对比度不吃亏 */\n.st-r.good,\n.st-r:nth-child(3){\n  background:rgba(var(--accent-rgb),.14);\n  border-color:rgba(var(--accent-rgb),.42);\n  box-shadow:none;\n  color:var(--fg);\n  filter:none;\n}\n.st-r.good b,\n.st-r:nth-child(3) b{color:var(--fg)}\n.st-r.good em,\n.st-r:nth-child(3) em{color:var(--fg2)}\n.st-r.good:hover,\n.st-r:nth-child(3):hover{\n  background:rgba(var(--accent-rgb),.20);\n  border-color:rgba(var(--accent-rgb),.55);\n  filter:none;\n}\n\n/* v60 留下的四色相与亮色描边，这里全部清掉 */\n.st-r:nth-child(1),\n.st-r:nth-child(2),\n.st-r:nth-child(4){color:var(--fg2)}\n.st-r:nth-child(1) b,\n.st-r:nth-child(2) b,\n.st-r:nth-child(4) b{color:var(--fg)}\n.st-r:nth-child(1) em,\n.st-r:nth-child(2) em,\n.st-r:nth-child(4) em{color:var(--fg3)}\n\n/* v-fix-contrast.css — 深色 UI 可读性补丁（追加在 app.css 末尾，v65 之后）\n   审计对象：F:\\dsharness\\dsh-etude\\design\\app.css（4323 行 / 206907 字节 / 末段 v65 = 4272-4323）\n   审计时间：2026-11-02 23:5x\n   底色实测（从 study-v65-1440.png / stats-v64-1440.png 取像素）：\n     页面 #1D2028 · 面板/舞台 #1B1F26 · 面标签条 #1E2228 · 统计卡片 #20232A\n   阈值：正文 4.5:1，≥18px 或 ≥600 字重的大字 3:1（本文件命中的全是 9–12.5px 小字，一律按 4.5 算）\n   只动 color / fill / opacity，不动尺寸、字体、间距。颜色只用 --fg3 / --w / --accent-rgb 及其 alpha 变体。\n   核心结论：--ghost(#656971) 在实际底色上只有 2.86~3.00:1，是唯一系统性不合格的令牌；\n             换成 --fg3(#9A9EA9) 即 5.87~6.17:1，层级仍低于 --fg2，视觉不塌。\n   —— 学习页评分四档（.st-r）已被 v65 修好，这里不再重复开药方。 */\n\n/* ───────────────────────── 学习页 study.html ───────────────────────── */\n\n/* 面包屑「卡片 / 测试牌组 / 第 3 张，共 12 张」 */\n.st-crumb{color:var(--fg3)}\n/* ghost #656971 → fg3 #9A9EA9，底 #1D2028，2.96:1 → 6.08:1 */\n\n/* 单词右边那行「06:41 · 这一轮 12 张」（HTML 上同时挂了 .mut，故要压过 .mut） */\n.st-where{color:var(--fg3)}\n/* ghost → fg3，底 #1D2028，2.96:1 → 6.08:1 */\n\n/* 页面底部快捷键提示「1–4 评分 · ← → 换面 …」 */\n.st-keys{color:var(--fg3)}\n/* ghost → fg3，底 #1D2028，2.96:1 → 6.08:1；里面 .kbd 没有自己的色，会跟着变亮 */\n\n/* 右栏抽屉列表底部那行说明 */\n.drail .side-n{color:var(--fg3)}\n/* ghost → fg3，底 #1D2028，2.96:1 → 6.08:1 */\n\n/* 七个抽屉标题右边那行解释（「这句话在什么场合说…」），收起状态下几乎看不见 */\n.stage2 .drw .drw-h .mut{color:var(--fg3)}\n/* ghost → fg3，底 #1B1F26，3.00:1 → 6.17:1 */\n\n/* 抽屉右侧的展开箭头 ▾（9px） */\n.stage2 .drw .drw-h .car{color:rgba(var(--w),.5)}\n/* rgba(w,.24) → rgba(w,.5)，底 #1B1F26，2.20:1 → 5.10:1；箭头是「这里能点开」的唯一点头，不能糊 */\n\n/* 打字面的提示「写不写都行」 */\n.tnote{color:var(--fg3)}\n/* ghost → fg3，底 #1B1F26，3.00:1 → 6.17:1 */\n\n/* soft 面把整块 opacity 压到 .62，叠在 ghost 上只剩 1.94:1 —— 这是全页最糊的一处正文 */\n.b-type.soft .tnote{color:var(--fg3);opacity:1}\n/* ghost@.62 → fg3@1，底 #1B1F26，1.94:1 → 6.17:1 */\n\n/* 打字输入框占位符（框底是 rgba(0,0,0,.22) 叠面板 = #15181E） */\n.tin::placeholder{color:var(--fg3)}\n/* ghost → fg3，底 #15181E，3.22:1 → 6.63:1 */\n\n/* 变体结果里被划掉的词 */\n.vw s{color:var(--fg3)}\n/* ghost → fg3，底 #1B1F26，3.00:1 → 6.17:1；保留下划线删除线，弱化感还在 */\n\n/* 面标签条上每档的小字「声音 → 画面」（.fb.on 那档已有自己的 #a9bcff，不受影响） */\n.fb i{color:var(--fg3)}\n/* ghost → fg3，底 #1E2228，2.90:1 → 5.96:1 */\n\n/* 悬浮小窗标题里的注音 /əˈbændən/ */\n.pw-hd .ph{color:var(--fg3)}\n/* ghost → fg3，底 #1B1F26 级别，3.00:1 → 6.17:1 */\n\n/* 小窗底部「按住标题可拖 · 右下角可拉」 */\n.pwtip{color:var(--fg3)}\n/* ghost → fg3，3.00:1 → 6.17:1 */\n\n/* ───────────────────────── 统计页 stats.html ───────────────────────── */\n\n/* 数据表表头（10.5px / 600 也算小字，4.5 才够） */\ntable.rt thead th{color:var(--fg3)}\n/* ghost → fg3，底 #20232A，2.86:1 → 5.87:1；th.g / th.b 的 v64 配色不动 */\n\n/* 图例右边的占比数字 */\n.legend .mut{color:var(--fg3)}\n/* ghost → fg3，底 #20232A，2.86:1 → 5.87:1；旁边的 .legend li 是 fg2，仍比它亮 */\n\n/* 环图中心的标签字 */\n.donut-label{fill:var(--fg3)}\n/* ghost → fg3，底 #20232A，2.86:1 → 5.87:1 */\n\n/* 图表里的 y 轴刻度（本来是 ghost 再乘 .85 透明） */\n.tx.ty{fill:var(--fg3);opacity:1}\n/* ghost@.85 → fg3@1，2.42:1 → 5.87:1；.tx 本体已是 fg3，这一条只是把刻度拉回同一级 */\n\n/* ───────────────────────── 设置页 settings.html ───────────────────────── */\n\n/* 快捷键面板每一组标题右边的条数（硬编码 #4C515A，全文件最糊的一处） */\n.kgh .mut{color:var(--fg3)}\n/* #4C515A → fg3，底 #20232A，1.97:1 → 5.87:1 */\n\n/* ───────────────────────── 工厂页 factory.html ───────────────────────── */\n\n/* 五维标签右上角的 ↗ 角标（9px，主色 55% 透明叠在深底上） */\n.f5name .cor{color:rgba(var(--accent-rgb),.82)}\n/* accent@.55 → accent@.82，底 #1B1F26，3.31:1 → 5.67:1；仍是同色相，只是不再半透明糊掉 */\n\n/* ============================================================================\n   v-fix-align.css\n   像素对齐修正补丁 —— 追加在 F:\\dsharness\\dsh-etude\\design\\app.css 之后即可生效\n   （所有覆盖规则的来源特异性 >= 被覆盖规则，且更靠后，见每条注释里的行号）\n\n   实测环境：headless Chrome，deviceScaleFactor=1，宽度 1440 / 1024 / 900\n   量法：getBoundingClientRect（CDP Runtime.evaluate），像素复核用截图 + 亮度扫描\n   取值纪律：间距只用 4 的倍数，圆角只用 6 / 14 / 999，字号只用 11/12/14/16/20/24/28，\n             字重只用 400 / 500 / 600\n\n   注释统一格式：修哪个错位、错位量（px）、被覆盖的规则行号\n   ============================================================================ */\n\n\n/* ============================================================================\n   【1】卡片页（cards）—— 表头「待复习」被当成数据胶囊\n   app.css:4229-4230 的 .dnum.due 同时命中了表头单元格（表头也是 <span class=\"dnum due\">），\n   于是三个表头里只有一个被染成实心胶囊：\n     表头「待复习」  W 51.6  H 25    （右端 780.8）\n     同级表头「未学习」/「学习中」 W 64  H 17（右端 635 / 707）\n     数据胶囊「12」  W 32   H 26.6  （右端 771）\n   错位量：宽 +19.6、高 -1.6、与另两列表头的右端差 +45.8\n   另：4229 的 justify-self:center 让该列表头居中、另两列表头右对齐，同一行两套对齐规则。\n   修法：表头不带胶囊（背景/内边距/最小宽/字重全归零），保留强调色；居中保持不动，\n        修完后表头文字中心 = 754.5 = 下方数据胶囊中心（739..771 的中点），列内自洽。\n   ============================================================================ */\n.deckhead>.dnum.due{\n  background:none;\n  padding:0;\n  min-width:0;\n  font-weight:400;\n}\n\n\n/* ============================================================================\n   【2】学习页（study）—— 评分四键左右各缩进 56px，和整页错开\n   app.css:4278 给 .st-rate 加了 padding:0 56px。\n     评分四键 222..1218（宽 996）\n     同页 .fbar / .st2 / .st-keys 166..1274（宽 1108）\n   错位量：左右各 56px（总宽差 112px）\n   ≤1200 更糟：app.css:4007-4009 的 .screen.study{padding-left:56px;padding-right:56px}\n   再叠一道，1024 下四键 138..886 而 .screen 是 82..942，仍是 56。\n   修法：去掉这层内边距，四键回到 166..1274，单键 240 → 268 宽。\n   ============================================================================ */\n.st-rate{padding:0}\n\n\n/* ============================================================================\n   【3】学习页（study）—— 右栏行距 9px，不在 4 的倍数网格上\n   app.css:3966 / 3682 的 .drail{gap:4px} 与 app.css:3972 的\n   .drail .rv{...margin-bottom:5px} 叠加成 9px：\n     七行 .rv 的 top = 414.7 / 455.7 / 496.7 / 537.7 / 578.7 / 619.7 / 660.7\n     → 行距 pitch 41 = 32（行高）+ 9\n     → 「全揭开」.allbtn 的上间距 17 = 8（margin-top）+ 9\n   错位量：行间多出 5px、按钮上方多出 5px（9 vs 4）\n   修法：margin-bottom 归零；pitch 41 → 36，.allbtn 上间距 17 → 12。\n   ============================================================================ */\n.drail .rv{margin-bottom:0}\n\n\n/* ============================================================================\n   【4】学习页（study）—— 五面条宽度不等 + 右侧 571.6px 空白\n   app.css:3938 .fbar 是 flex 容器，app.css:3939 .fb 按内容定宽：\n     五个 .fb 宽 97.1 / 97.1 / 97.1 / 97.1 / 90.1（第 5 个少 7px）\n     末尾 <span class=\"sp\"> 吃满剩余（app.css:230 .sp{flex:1}），占 693.4..1265\n   错位量：最后一格窄 7px；条右侧空 571.6px（五个胶囊只用到条宽的 47%）\n   修法：五格均分。(1108 - 16 - 32) / 5 = 212 每格（实测 211.6，差在 border 与取整）；.sp 不再参与分配。\n   ============================================================================ */\n.fbar .fb{flex:1 1 0;min-width:0}\n.fbar>.sp{display:none}\n\n\n/* ============================================================================\n   【5】学习页（study）≤1000 —— 横向溢出 157px\n   900 宽下 document.scrollWidth = 1057 而 innerWidth = 900：\n     aside.drail  W 975.5（82..1057.5），自己被撑成 975 宽，overflow-x:auto 完全失效\n     button.mini 右端 1033、button.q 右端 1057 —— 直接被视口切掉\n   成因：app.css:4015 的 .st2{display:flex;flex-direction:column;gap:16px} 没写 align-items，\n        继承了基础 .st2 的 align-items:start → 子项按 max-content 定宽，不再受容器约束\n        （app.css:4016 给 .drail 的 overflow-x:auto 因此永远不触发）\n   错位量：157px 溢出（视口 900 / 内容 1057）\n   修法：拉伸列宽，让 .drail 变成 736 宽、自家横向滚动。\n   ============================================================================ */\n@media (max-width:1000px){\n  .st2{display:flex;flex-direction:column;align-items:stretch;min-width:0}\n  .st2>.drail{width:auto;min-width:0;max-width:100%}\n}\n\n\n/* ============================================================================\n   【6】工厂页（factory）—— 五维块左右内缩不对称 14 / 2\n   app.css:2546 .fx-sense .fx-body{padding-left:14px;padding-right:2px}（特异性 0,3,0，\n   压过 app.css:3157 的 padding:8px 6px 16px 26px）：\n     .fx-body   401..1259\n     .fx-blk.b5 415..1257   → 左 14、右 2\n     内容框     432..1240   → 比上方 .fx-def 段落右端 1259 少 19、左端多 31\n   错位量：左右内缩差 12px（14 vs 2），整块在面板里左重右轻\n   修法：对称 16 / 16；b5 变 417..1243，内容框 434..1226（实测），与面板左右各留 16。\n   ============================================================================ */\n.fx-sense .fx-body{padding-left:16px;padding-right:16px}\n\n\n/* ============================================================================\n   【7】工厂页（factory）—— 五维行行高不等 58 / 59 / 59 / 59 / 59\n   app.css:2305 .f5row{border-top:1px solid ...} + app.css:2306 .f5row:first-child{border-top:0}\n   → 首行少 1px，五行里第一行比其余矮 1px，行内容垂直中心彼此差 0.5px。\n   错位量：行高差 1px（58 vs 59）\n   修法：首行保留 1px 但透明，五行统一 59。\n   ============================================================================ */\n.fx-blk.b5 .f5row:first-child{border-top:1px solid transparent}\n\n\n/* ============================================================================\n   【8】工厂页（factory）—— 同一行三段间距三个节奏（14 / 12 / 20）\n   行 gap 是 12（app.css:3409），但：\n     app.css:3413 .fx-blk.b5 .f5row em{margin-left:2px}  → 方块→状态 chip = 14\n     app.css:3415 .fx-blk.b5 .f5row .sw{margin-left:8px}  → 标签→开关   = 20\n   实测：f5name 432..468、em 482..527.2（+14）、.d 右端 1182、.sw 1202..1240（+20）\n   错位量：chip 多 2px、开关多 8px\n   修法：两处归零 → 统一 12。chip 左移 2px；开关左移 8px，右侧标签组右移 8px。\n   ============================================================================ */\n.fx-blk.b5 .f5row em{margin-left:0}\n.fx-blk.b5 .f5row .sw{margin-left:0}\n\n\n/* ============================================================================\n   【9】工厂页（factory）—— 五维方块圆角 11px 不在白名单\n   app.css:3410 .fx-blk.b5 .f5row .f5name{width:36px;height:36px;border-radius:11px}\n   36x36 的方块用了 11px 圆角；设计规范只允许 6 / 14 / 999。\n   错位量：圆角 11 → 14（3px）\n   ============================================================================ */\n.fx-blk.b5 .f5row .f5name{border-radius:14px}\n\n\n/* ============================================================================\n   【10】统计页（stats）—— 面板头右侧控件三种高度，上下边差 5.2px\n   8 个 .shead2 的 .sctls 高度序列：32.8 / 32.8 / 30.6 / 32.8 / 32.8 / 35.8 / 32.8 / 32.8 / 32.8\n     .ck（复选框标签）  30.6  = 18（行高）+ 5+5（padding）+ 1+1（border）\n     .sel（下拉）       32.8  = 16.8 + 7+7 + 1+1\n     .seg.small（分段） 35.8  = 27.8 + 3+3 + 1+1\n   三者垂直居中所以中心线齐，但上边缘差 5.2px、下边缘差 5.2px（最高 35.8 / 最矮 30.6）。\n   错位量：±2.6px（总差 5.2px）\n   修法：三种统一 32px（.sel 内边距 7→6 补回差值，.seg 内边距 3→2、格内 5→4，行高才塞得下）。\n   ============================================================================ */\n.shead2 .sctls .ck,\n.shead2 .sctls .sel,\n.shead2 .sctls .seg{height:32px;box-sizing:border-box}\n.shead2 .sctls .ck{padding-top:0;padding-bottom:0}\n.shead2 .sctls .sel{padding-top:6px;padding-bottom:6px}\n.shead2 .sctls .seg.small{padding:2px}\n.shead2 .sctls .seg.small span{padding:4px 11px}\n\n\n/* ============================================================================\n   【11】统计页（stats）—— 记忆保留率表格四个数字列宽不等\n   table.rt 是 auto 布局（app.css:748），四个数字列宽由表头文字撑开：\n     228.9（首列）/ 222（欠熟练）/ 209.2（已熟练）/ 222（总计）/ 170.8（总数）\n   「已熟练」比左右邻居各窄 12.8px，最宽最窄差 51.2px。\n   错位量：12.8px（相邻列）/ 51.2px（极差）\n   修法：固定布局，四个数字列各 19%，首列吃剩下的 24%：\n         1054 宽下 253 / 200.3 / 200.3 / 200.3 / 200.3（实测 252.8 / 200.1 × 4）。\n   ============================================================================ */\ntable.rt{table-layout:fixed}\ntable.rt thead th:nth-child(n+2){width:19%}\n\n/* ══════════════════════════════════════════════════════════════════════════\n   v-fix-anim.css · 动效 / 图表演示修复覆盖层\n   --------------------------------------------------------------------------\n   覆盖对象：F:\\dsharness\\dsh-etude\\design\\app.css（抓现场时 4323 行）\n             + gen.mjs 内联注入的 #animToggle\n\n   必须先读这条前提：本文件必须排在 app.css 之后加载\n   （<link rel=\"stylesheet\" href=\"app.css\"><link rel=\"stylesheet\" href=\"v-fix-anim.css\">\n     或整段贴到 app.css 末尾）。原因是这里大量用「同重要性、同特异性、靠后胜」\n   来压 app.css 里那批带 !important 的时长规则；跑到前面去就全败。\n\n   每条都按：现在 → 改成 → 为什么\n   --------------------------------------------------------------------------\n   时长令牌（本文件新定义，不复用旧名，免得跟 app.css:2670-2673 打架）：\n     悬停 / 按下    120–180ms   --fx-t-hover:160ms\n     展开 / 收起    380–520ms   --fx-t-open:460ms\n     页面切换       460–580ms   --fx-t-page:520ms\n     图表重绘       600–900ms   --fx-t-chart:760ms\n   缓动令牌：\n     进场 cubic-bezier(.22,.9,.18,1)     --fx-in\n     退场 cubic-bezier(.4,0,.85,.55)     --fx-out\n   全文件无弹跳（没有 --ease-spring 那种回弹曲线）。\n   ══════════════════════════════════════════════════════════════════════════ */\n\n:host{\n  --fx-in:cubic-bezier(.22,.9,.18,1);\n  --fx-out:cubic-bezier(.4,0,.85,.55);\n  --fx-t-hover:160ms;\n  --fx-t-open:460ms;\n  --fx-t-page:520ms;\n  --fx-t-chart:760ms;\n}\n\n\n/* ══════════════════════════════════════════════════════════════════════════\n   A 组 · 演示开关 #animToggle：从「窄屏消失 + 压住齿轮」改成「一直在、在右下角」\n   ══════════════════════════════════════════════════════════════════════════ */\n\n/* A1 ── 让它无论多窄都还在\n   现在：app.css:4260\n         @media (max-width:1100px){#animToggle{display:none}}\n         这是全库唯一命中 #animToggle 的样式表规则；1024–1100 的窗口里整个开关被\n         display:none 干掉，用户看到的就是「动画演示都不行了」。\n   改成：任何宽度都 display:inline-flex，!important 压掉那条媒体查询。\n   为什么：它是唯一能证明「图表的动画是活的」的开关，藏起来等于把唯一的自救入口拿掉。\n           注意 gen.mjs:30 的内联 cssText 里没有 display，所以这里不会跟内联打架。 */\n#animToggle{\n  display:inline-flex!important;\n  align-items:center!important;\n  justify-content:center!important;\n  min-height:32px;\n  min-width:32px;\n  -webkit-tap-highlight-color:transparent;\n}\n\n/* A2 ── 从右上角挪到右下角\n   现在：gen.mjs:30 内联 `position:fixed;right:16px;top:12px;z-index:9000`\n         实测 1200×800 的截图里，胶囊左缘直接压住顶栏齿轮的右半边\n         （.page max-width:1160 + padding 26 → 视口 <≈1390px 就开始压 .tb-right）。\n         而 1101–1390px 这一整段「既压住齿轮、又没被隐藏」，1024 以下又整个没有。\n   改成：bottom:16px / right:16px，z-index 从 9000 降到 60，字号 12px、内边距 7px 12px。\n   为什么：右上角是 .tb-right（搜索 / 齿轮）的地盘，任何 fixed 元素钉在那里迟早撞；\n           右下角常驻可点，不挡顶栏三颗按钮。\n           z-index 60 让它落在 .tip(99) / .popwin(70) / .msheet(9000) 之下，\n           弹窗和浮窗打开时不会被一个演示开关盖住。\n   实现要点：内联 style 是「普通声明」，作者样式表里的 !important 能压过它，\n           所以 position/right/top/bottom/z-index 必须带 !important 才生效。 */\n#animToggle{\n  position:fixed!important;\n  top:auto!important;\n  right:16px!important;\n  bottom:16px!important;\n  left:auto!important;\n  z-index:60!important;\n  padding:7px 12px!important;\n  font-size:12px!important;\n  line-height:1!important;\n  transition:\n    background-color var(--fx-t-hover) var(--fx-in),\n    border-color     var(--fx-t-hover) var(--fx-in),\n    color            var(--fx-t-hover) var(--fx-in);\n}\n\n/* A3 ── 悬停 / 按下反馈（160ms，在 120–180ms 里）\n   现在：没有 hover 态，只有一段 backdrop-filter 毛玻璃。\n   改成：hover 提亮底色与边框；active 下压 0.5px。\n   为什么：一个常驻的浮动控件必须有「我点得到」的反馈，否则用户不敢点。\n           这里不用 transform 放大，避免弹跳感。 */\n#animToggle:hover{\n  background:rgba(28,31,40,.94)!important;\n  border-color:rgba(255,255,255,.26)!important;\n}\n#animToggle:active{transform:translateY(.5px)}\n\n/* A4 ── 键盘焦点环\n   现在：:focus 被 app.css:1022 那类规则统一 outline:none 掉了，键盘用户看不到自己停在哪。\n   改成：:focus-visible 给一圈 2px 主色描边 + 2px 偏移。\n   为什么：它是页面里唯一能关掉全部动画的开关，必须能被键盘找到。 */\n#animToggle:focus-visible{\n  outline:2px solid rgba(138,169,255,.55);\n  outline-offset:2px;\n}\n\n/* A5 ── 窄屏收一号，而不是消失\n   现在：≤1100px 直接 display:none（就是 A1 要压掉的那条）。\n   改成：≤1100px 时内边距 6px 10px、字号 11px、位置贴边 14px。\n   为什么：窄屏更需要这个开关；缩一号就足够不压住内容，没有必要整个砍掉。\n           带 !important 是为了连同 app.css:4260 的 display:none 一起压住。 */\n@media (max-width:1100px){\n  #animToggle{\n    display:inline-flex!important;\n    padding:6px 10px!important;\n    font-size:11px!important;\n    right:14px!important;\n    bottom:14px!important;\n  }\n}\n\n/* A6 ── 学习页给翻页胶囊让位\n   现在：app.css:3375 `.navstep{position:fixed;bottom:16px;z-index:30}` 配\n         3383 `.navstep.next{right:16px}` —— 跟新位置完全重叠。\n   改成：body 里存在 .navstep.next 时，开关右移 92px（≤900px 时右移 82px）。\n   为什么：两个 fixed 元素钉在同一个角落会叠成一坨；让位比把开关藏起来划算。\n           :has() 在现代 Chrome / Edge 都能用（本项目只跑 Chrome 系）。 */\nbody:has(.navstep.next) #animToggle{right:108px!important}\n@media (max-width:900px){\n  body:has(.navstep.next) #animToggle{right:96px!important}\n}\n\n/* A7 ── 打印 / 导出 PDF 时不要出现\n   现在：app.css:1030\n         @media print{.topbar,.chips.jump,.sctls,.hdr-act,.tip,.card.stat .takeaway{display:none!important}}\n         名单里没有 #animToggle，而 stats.js 的「导出 PDF」走 window.print()，\n         结果这枚屏幕控件的胶囊会被打进 PDF 的第一页右上角。\n   改成：打印媒体下 display:none!important。\n   为什么：它是屏幕上的调试/演示开关，不属于报告内容。 */\n@media print{\n  #animToggle{display:none!important}\n}\n\n\n/* ══════════════════════════════════════════════════════════════════════════\n   B 组 · 统计图表：把「到底谁说了算」收成一处（时长 / 错峰 / 缓动 / 图层）\n   ══════════════════════════════════════════════════════════════════════════ */\n\n/* B1 ── 柱子时长：从 1.05s 改成 760ms（落在 600–900ms 令牌里）\n   现在：三套时长互相打架\n         2136 `.cv-js .bar,.cv-play .bar{animation:bar-grow .95s cubic-bezier(.22,.72,.3,1) both;animation-delay:var(--d,0ms)}`（简写）\n         3221 `.cv-js .bar,.cv-play .bar{animation-duration:1.05s!important}`   ← 带 !important，它赢\n         3716 `.cv-js .bar,.cv-play .bar{animation-duration:1.55s}`             ← 没 !important，它是死的\n         也就是说 3715 行「v53：统计演示再慢一档（用户说太快、掉帧）」那次调慢，\n         从来没有生效过。\n   改成：760ms，!important。\n   为什么：!important 不看谁在后面，只看重要性；要改就得带 !important 才压得住 3221。\n           760ms 配 420ms 的错峰上限（见 B2），最后一批柱子 1.18s 收尾，比原来 2.1s 干净一半。 */\n.cv-js .bar, .cv-play .bar{animation-duration:var(--fx-t-chart)!important}\n\n/* B2 ── 折线 / 面积 / 旋转 / 热格 / 环图 的时长一起收进令牌\n   现在：2156 dspin 1.05s；2141 line2 1.15s；2146 area2 .9s；2158 donut .dc .5s；\n         2142/2144/… 各自再加一条 3222-3224 的 !important。\n   改成：line2 860ms、area2 780ms、dspin 820ms、hcol 680ms、donut .dc 640ms、adot 460ms。\n   为什么：一张图里有 5 种时长、5 条曲线各走各的，眼睛就会觉得「卡」；\n           统一到同一档之后，视觉上是一次整齐的生长。\n           hcol / donut .dc 上一版靠「靠后胜」赢（3214 vs 3720），这里用 !important 钉死，\n           以后谁再往文件末尾加时长也不会被翻掉。 */\n.cv-js .line2,       .cv-play .line2      {animation-duration:860ms!important}\n.cv-js .area2,       .cv-play .area2      {animation-duration:780ms!important}\n.cv-js .dspin,       .cv-play .dspin      {animation-duration:820ms!important}\n.cv-js .hcol,        .cv-play .hcol       {animation-duration:680ms!important}\n.cv-js .donut .dc,   .cv-play .donut .dc  {animation-duration:640ms!important}\n.cv-js .adot,        .cv-play .adot       {animation-duration:460ms!important}\n\n/* B3 ── 错峰尾巴封顶，别让人等两秒\n   现在：2136 `animation-delay:var(--d,0ms)` 直接吃 stats.html 内联的 --d，\n         实测 215 处 --d，最大 1020ms；1.05s 动画 + 1.02s 延迟 = 最后一根柱子 2.1s 才站好。\n   改成：min(var(--d,0ms),420ms)（热格 360ms、环图 260ms、点 420ms）。\n   为什么：错峰是为了「一根接一根」的节奏，不是为了让人等；min() 只削最长的尾巴，\n           前 420ms 以内的间距比例完全不变。min() 对时间值是合法的（Chrome 79+）。\n           带 !important 是因为 .cvv.on .bar（app.css:772，特异性 0,3,0）会把 delay 重置成 0。 */\n.cv-js .bar,       .cv-play .bar       {animation-delay:min(var(--d,0ms),420ms)!important}\n.cv-js .hcol,      .cv-play .hcol      {animation-delay:min(var(--d,0ms),360ms)!important}\n.cv-js .donut .dc, .cv-play .donut .dc {animation-delay:min(var(--d,0ms),260ms)!important}\n.cv-js .adot,      .cv-play .adot      {animation-delay:min(var(--d,0ms),420ms)!important}\n\n/* B4 ── 进场缓动统一成 --fx-in\n   现在：2135 bar-grow 用 cubic-bezier(.22,.72,.3,1)，773 grow 用 (.34,.61,.35,1)，\n         2141 line-draw 用 (.4,.1,.35,1)，2167 legend 用 rise，各写一套。\n   改成：图里所有进场动画统一 cubic-bezier(.22,.9,.18,1)。\n   为什么：同一屏里三种起步速度，肉眼读到的就是「不流畅」；统一手感比抠单个数值有效。\n           只覆盖 timing-function，不动 keyframes 本身（柱子的 scaleY、线的 dashoffset 都保留）。\n           图例 / 环心数字顺手加上 .card.stat 限定，别去碰别的页面（见 D 组同样的坑）。 */\n.cv-js :is(.bar,.line2,.area2,.dspin,.hcol,.donut .dc),\n.cv-play :is(.bar,.line2,.area2,.dspin,.hcol,.donut .dc){animation-timing-function:var(--fx-in)!important}\n.card.stat .legend li,\n.card.stat .donut-big{animation-timing-function:var(--fx-in)!important}\n\n/* B5 ── 把常驻的 will-change 收回去\n   现在：app.css:3227-3228 写了 `.chart,.chart *{will-change:auto}`（想收图层），\n         但 3714 / 3723 两行又说\n           .cv-play .bar,.cv-play .darc,.cv-play .hcol,.cv-play .dot,.cv-play .line2,…{will-change:transform,opacity}\n           .cv-play .bar,.cv-play .dc,.cv-play .dot{will-change:transform,opacity}\n         它们特异性更高、位置更靠后，把 auto 翻掉了 → 一屏 98 根柱子 + 30 多段环图弧\n         全部常驻 will-change，而且 .cv-play 动画跑完不会被摘掉，图层永远不回收。\n   改成：`.chart` 及其全部后代 will-change:auto，!important。\n   为什么：SVG 子元素的 transform/opacity 动画在 Chrome 里本来就不走合成器（走 repaint），\n           will-change 在这里唯一的作用是把元素提成独立图层。100+ 个小图层常驻，\n           滚动和后续重绘都跟着变贵 —— 这正是「昨天还顺、今天不对劲」的典型来源。 */\n.chart,\n.chart *{will-change:auto!important}\n\n/* B6 ── 折线绘制期间先卸掉 drop-shadow\n   现在：2112 `.chart .line2{…filter:drop-shadow(0 2px 8px rgba(78,127,229,.28))}`\n         同时 2141 在跑 stroke-dashoffset 1→0 的绘制动画，每一帧都要重新栅格化 8px 模糊。\n   改成：给折线再挂第二条动画 line-fx —— 0% 和 99% 都是 filter:none，\n         只有 100% 才是原来那圈 drop-shadow。于是整段绘制期间没有 blur，\n         画完最后一帧影子自己回来。\n   为什么：影子只在「线已经画完」时有意义；把这一秒的 blur 关掉，绘制帧就能省下来。\n         实现上不要写 `filter:none` 做兜底 —— 那会让 .cv-off（animation:none）时\n         折线永久失去辉光。交给动画值接管就够：动画值压过 2112 的常驻 filter，\n         动画被关掉时 2112 的 filter 自然回位。\n         注意：这里任何 filter 都不能带 !important —— 作者 !important 会压过动画值，\n         那样 100% 的影子永远挂不回来。\n         副作用：`.chart:hover .line2{filter:…}`（app.css:810）的 hover 加亮会被动画\n         fill 住的 100% 值盖住，只剩 stroke-width 变化。要保留 hover 加亮就整段删掉这条。 */\n@keyframes line-fx{\n  0%,99%{filter:none}\n  100%  {filter:drop-shadow(0 2px 8px rgba(78,127,229,.28))}\n}\n.cv-js .line2, .cv-play .line2{\n  animation:\n    line-draw 860ms var(--fx-in) .1s both,\n    line-fx   860ms var(--fx-in) .1s both;\n}\n\n\n/* ══════════════════════════════════════════════════════════════════════════\n   C 组 · 填色：v64 / v64b 只改了一半\n   （跟「卡不卡」无关 —— 柱子动画只动 transform 和 opacity，从没动过 fill。\n     这一组只把「图例一个色、柱子另一个色」这个半截状态补完，不改新配色，\n     颜色全部取自 v64(4160-4165) 与 v64b(4186-4189) 已有的值。不想要就整组删掉。）\n   ══════════════════════════════════════════════════════════════════════════ */\n\n/* C1 ── 让柱子真正吃到 v64b 的实色阶\n   现在：app.css:4160 `.bar.c1{fill:url(#grad-blue)}`（特异性 0,2,0）\n         压着 v64b 4186 `.c1{fill:#6E82BA}`（特异性 0,1,0）→ 柱子还是渐变；\n         而图例 4191 `.legend .c1{background:#6E82BA}`、环图 4196 `.donut .dc.c1{stroke:#6E82BA}`\n         特异性够，吃到了新色 → 同一张图里两套蓝。\n         更麻烦的是 stats.html 里有 38 根柱子直接写了内联 `style=\"fill:url(#bg1)\"`（内联永远赢），\n         连 `.bar.cN` 都压不住它们。\n   改成：`.chart .bar.cN` + !important，一次性钉死 7 个色。\n   为什么：这正是「统计你都改的不流畅了」里那个「看着不对劲」的来源 —— 98 根柱子里\n           38 根是渐变、60 根是实色，还和图例不是一个色。统一之后颜色才跟 v64b 的意图一致。\n           实色比渐变省填充率，对帧率只有好处，没有坏处。 */\n.chart .bar.c1{fill:#97B1F0!important}   /* 单序列柱图的主用色：主色，别再压暗 */\n.chart .bar.c2{fill:#656971!important}\n.chart .bar.c3{fill:#B9C9F6!important}\n.chart .bar.c4{fill:#E69089!important}\n.chart .bar.c5{fill:#55689A!important}\n.chart .bar.c6{fill:#7E93C8!important}\n.chart .bar.c7{fill:#D5DFFA!important}\n\n\n/* ══════════════════════════════════════════════════════════════════════════\n   D 组 · 门控收窄：`.cv-off` / `.cv-js` 别再用 `.chart *` 一网打尽\n   ══════════════════════════════════════════════════════════════════════════ */\n\n/* D1 ── 暂停只冻「真的会动」的那几个类\n   现在：app.css:2185\n           .cv-js .chart *, .cv-js .heat rect, .cv-js .legend li, .cv-js .donut-big{animation-play-state:paused!important}\n         2186 同款 running。\n         `.chart *` 把图里所有后代一起冻住 —— 包括以后加进图里的任何新动效、图内浮层、子图。\n   改成：只冻 .bar / .line2 / .area2 / .adot / .dspin / .hcol / .donut .dc，\n         图例与环心数字加上 .card.stat 限定。\n   为什么：`animation-play-state` 只对「自己身上有 animation 的元素」有意义；\n           用通配符的唯一效果是把后来加进图里的东西一起冻死，而且写的人根本不会记得回来改。\n           这一条不改变现在的行为（今天会动的就是这 7 个类），只是把雷拆掉。 */\n.cv-js :is(.bar,.line2,.area2,.adot,.dspin,.hcol,.donut .dc),\n.cv-js .card.stat .legend li,\n.cv-js .card.stat .donut-big{animation-play-state:paused!important}\n\n.cv-play :is(.bar,.line2,.area2,.adot,.dspin,.hcol,.donut .dc),\n.cv-play .card.stat .legend li,\n.cv-play .card.stat .donut-big{animation-play-state:running!important}\n\n/* D2 ── 「关动画」也不要越过 .chart 的边界\n   现在：app.css:2177\n           .cv-off .chart *, .cv-off .heat rect, .cv-off .legend li, .cv-off .donut-big{animation:none!important}\n         后两个选择器没有 .chart 前缀，是作用于整个文档的。\n         `.legend li` 的进场是 2167 `animation:rise .4s … both`、2166 `@keyframes rise{from{opacity:0;…}}`，\n         `.donut-big` 是 2172 `fadein .5s ease .3s both`（from opacity:0）。\n         一旦这类元素落在没有 .cv-play 祖先的地方，就会被永久冻在 opacity:0 —— 字直接不见。\n   改成：收窄到会动的 7 个类，图例 / 环心数字限定在 .card.stat 里。\n   为什么：今天 stats.html 的图例和环心都在 `<section class=\"card stat\" id=\"s-counts\">` 内，\n           所以还没炸；但 .cv-off 是挂在 <html> 上的，全 15 页通吃，\n           只要哪天把图例搬到卡片外面，那段文字就永久消失。这是预防，不是修复现场。 */\n.cv-off :is(.bar,.line2,.area2,.adot,.dspin,.hcol,.donut .dc,.heat rect){animation:none!important}\n.cv-off .card.stat .legend li,\n.cv-off .card.stat .donut-big{animation:none!important}\n\n\n/* ══════════════════════════════════════════════════════════════════════════\n   E 组 · 可选：reduced-motion 与「动画演示」互相打架（默认不启用）\n   ══════════════════════════════════════════════════════════════════════════\n\n   现在：app.css:2732-2735\n           @media (prefers-reduced-motion:reduce){\n             *,*::before,*::after{\n               animation-duration:.01ms!important;\n               animation-iteration-count:1!important;\n               transition-duration:.01ms!important;\n               scroll-behavior:auto!important;\n             }\n           }\n         而 app.css:2174-2175 的注释写的是「不再按系统的 reduced-motion 关掉这些动画」。\n         两句话直接打脸，而且是前者说了算。\n         后果：Windows 设置里关掉「动画效果」之后，全站一切动效立刻变成 0.01ms ——\n         柱子不长、环图不转、页面不淡入，看起来就是「动画/图表演示全坏了」，\n         而且那个「动画 · 开」开关救不了它（它只切 .cv-off）。\n\n   先验证再决定要不要开：控制台跑\n       matchMedia('(prefers-reduced-motion: reduce)').matches\n   如果是 true，并且你希望「演示」照样能动（按 2174 行注释的本意），\n   就把下面这段的注释去掉。如果这台机器本来就是 false，那这条跟你的现象无关，保持注释。\n\n@media (prefers-reduced-motion:reduce){\n  .cv-js :is(.bar,.line2,.area2,.adot,.dspin,.hcol,.donut .dc),\n  .card.stat .legend li,\n  .card.stat .donut-big{animation-duration:var(--fx-t-chart)!important}\n}\n*/\n\n/* ══════════════════════════════════════════════════════════════════════════\n   收尾备注\n   1) 本文件只动：动画时长/缓动/延迟、动画门控选择器、will-change、可见性与定位、\n      以及 C 组「补齐 v64b 半迁移」的柱子填色。没动字体、没动布局结构。\n   2) 如果只想解决「开关不见了」，只留 A 组即可；只想让统计顺一点，留 B 组 + D 组。\n   3) 想在浏览器里直接验证 B1 生效：选中一根柱子看 computed animation-duration，\n      应为 0.76s；改之前是 1.05s（app.css:3221 那个 !important 的缘故）。\n   ══════════════════════════════════════════════════════════════════════════ */\n\n/* =============================================================================\n   v66 · 三页打磨：句库(library) / 详情(detail) / 挖句(mine)\n   —— 覆盖层，接在 design/app.css 之后加载；不改 app.css，不改 HTML 结构。\n   —— 每条注释写清「现在 → 改成 → 为什么」，编号 #01…#77 与 detail-report.md 对齐。\n\n   作用域为什么长这样\n     这三页没有 <body> 级页面类，硬靠类名选会把别的 12 页一起改到。所以全部选择器都\n     挂在三页自己的标记上（:has() 需要 Chrome ≥ 105）：\n       .page:has(.sent)                  句库 + 详情（左说法列表 + 右句子表，两页共用）\n       .page:has(main.screen > .drawer)  详情（.drawer 在 main.screen 里，不是 .page 子节点）\n       .page:has(.minewrap)              挖句\n\n   三处被撞名的全局类（本文件靠作用域把它们压回去，源文件一个字不动）\n     .t     在 app.css 是「统计/工厂的时间胶囊」（padding:5px 11px;border-radius:99px;border + 底）\n            → 挖句页字幕时间 12:38 被套成胶囊，见 #54\n     .mini  在 app.css 是「面板上的 28px 小按钮」（height:28px;padding:0 12px;font-size:11px）\n            → 挖句页「正面/背面」两张卡被压成一条按钮，文字互压，见 #66\n     .drow  在 app.css 是「卡组表的 5 列网格行」（display:grid;height:44px;grid-template-columns:…）\n            → 详情抽屉每行被拆成 5 列，标签挤进最右 64px 竖排，见 #27\n\n   为什么有几处 !important\n     页面里有行内 style（padding:10px / padding:6px 8px 10px / margin-top:6px / line-height:1.7），\n     其中 10、6、1.7 违反硬规格，行内样式只能靠 !important 压。每一处都单条注释说明。\n   ========================================================================== */\n\n\n/* ==========================================================================\n   §1 三页共用页头（#01–#04）\n   ========================================================================== */\n\n/* #01 现在 h1 = 22px（非 4 的倍数，且比学习页标题弱）→ 改成 24px\n       为什么：POLISH 3.2「字阶 ≤6 级」现有 11/12/14/16/20/24/28 正好 6 级，24 才是标题档；\n               22 是第 7 级，把 22 收进 24，页头才跟学习页一个手感（POLISH 10）。 */\n.page:is(:has(.sent),:has(.minewrap)) .hdr h1{font-size:24px}\n\n/* #02 现在 .hdr{padding-top:6px} → 改成 4px，并且 act 行允许换行、底部对齐基线\n       为什么：6 不是 4 的倍数（硬规格）；4 个 chip + 2 个按钮在 1024 宽还得挤一行，\n               换行后靠 flex-end 对齐，标题不会被顶歪。 */\n.page:is(:has(.sent),:has(.minewrap)) .hdr{padding-top:4px;align-items:flex-end;row-gap:8px}\n\n/* #03 现在 .hdr .sub{margin-top:6px;color:var(--ghost)} → 改成 margin-top:4px + --fg3\n       为什么：6→4（硬规格）；副标题是「次文字」不是「提示」，\n               POLISH 3.2 要求次文字 .6 / 提示 .38，--ghost 只有 .38，副标题会糊进背景。 */\n.page:is(:has(.sent),:has(.minewrap)) .hdr .sub{margin-top:4px;color:var(--fg3)}\n\n/* #04 现在 .hdr .act{gap:10px} → 改成 gap:8px、flex-wrap:wrap、行间距 8px\n       为什么：10 不是 4 的倍数；1024 宽时四个 chip + 两个按钮仍在一行，加 wrap 兜住窄屏。 */\n.page:is(:has(.sent),:has(.minewrap)) .hdr .act{gap:8px;row-gap:8px;flex-wrap:wrap;justify-content:flex-end}\n\n\n/* ==========================================================================\n   §2 句库 · 左「说法」列表（#05–#12）\n   ========================================================================== */\n\n/* #05 现在左卡行内 style=\"padding:10px\"（10 不是 4 的倍数，卡片内边距跟别的 .card 也不一致）\n       → 改成 8px（行内样式只能 !important）\n       为什么：硬规格；.card 默认 18px 20px 在这里太肥，8px 让 litem 自己撑出 32px 行高。 */\n.page:has(.sent) .split > .card:first-child{padding:8px !important}\n\n/* #06 现在列表头行行内 style=\"padding:6px 8px 10px\"（6、10 不是 4 的倍数，且跟数据行没有分隔）\n       → 改成 padding:4px 8px 8px + 1px 下边线\n       为什么：硬规格；表头和数据行之间没有线，「说法 / 句子·卡住」看起来像第一条数据。 */\n.page:has(.sent) .split > .card:first-child > .row:first-child{\n  padding:4px 8px 8px !important;\n  border-bottom:1px solid rgba(52,56,65,.5);\n}\n\n/* #07 现在 .litem 没有任何样式：三个 span 挤成一行「succumb屈服、扛不住4 · 2」，行高由文字撑\n       → 改成 flex 行：min-height:32px、padding 0 8px、gap 8px、圆角 6px、可点、加过渡\n       为什么：读不出来是一个条目；32px 满足桌面触控 ≥28（POLISH 8），6px 是硬规格三档圆角之一。 */\n.page:has(.sent) .litem{\n  display:flex;\n  align-items:center;\n  gap:8px;\n  min-height:32px;\n  padding:0 8px;\n  border-radius:6px;\n  cursor:pointer;\n  transition:background 160ms cubic-bezier(.22,.9,.18,1);\n}\n\n/* #08 现在 hover 完全没有反馈 → 改成 4% 白底\n       为什么：POLISH 9「点了应该有反应的地方几乎没反馈」，悬停 120–180ms，这里 160ms。 */\n.page:has(.sent) .litem:hover{background:rgba(var(--w),.045)}\n\n/* #09 现在选中态 .litem.on 只是背景略亮一点，看不出来选的是哪个说法\n       → 改成 10% 主色底 + 左端 2px 主色竖条\n       为什么：主色是唯一强调色（硬规格）；2px 属于「装饰色只在 ≤2px 元素上」的许可范围；\n               左边条不占布局宽度，行高不变，选中不会跳。 */\n.page:has(.sent) .litem.on{background:rgba(var(--accent-rgb),.10);position:relative}\n.page:has(.sent) .litem.on::before{\n  content:\"\";\n  position:absolute;\n  left:0; top:4px; bottom:4px;\n  width:2px;\n  border-radius:999px;\n  background:var(--accent);\n}\n\n/* #10 现在 .litem .en 继承全局 .en{font-weight:400;color:var(--fg)}，字重和正文一样\n       → 改成 14px / 600 / --fg，不参与收缩\n       为什么：说法是这一行的主信息，要压过释义；POLISH 2 字重只三档，600 是主信息档。 */\n.page:has(.sent) .litem .en{font-size:14px;font-weight:600;color:var(--fg);flex:0 0 auto}\n\n/* #11 现在中文释义是 --ghost（提示档 .38），且长了不截断，把计数挤到换行\n       → 改成 12px / --fg3（次文字档）+ 单行省略；计数用 mono 11px 固定在最右\n       为什么：POLISH 3.2 对比度分档（次文字 .6、提示 .38），释义不是提示；\n               省略号保证「4 · 2」永远对齐在最右，六行数字才排得出一条竖线。 */\n.page:has(.sent) .litem .mut{\n  font-size:12px;\n  color:var(--fg3);\n  min-width:0;\n  overflow:hidden;\n  text-overflow:ellipsis;\n  white-space:nowrap;\n}\n.page:has(.sent) .litem .mut:last-child{\n  flex:0 0 auto;\n  margin-left:auto;\n  font-family:var(--mono);\n  font-size:11px;\n  color:var(--ghost);\n  font-variant-numeric:tabular-nums;\n}\n\n/* #12 现在底部「还有 6 个 / 31 句」行行内 margin-top:6px + border-top 用 rgba(52,56,65,.7)\n       → 改成 margin-top:8px、分割线走 --line 同色\n       为什么：6→8（硬规格）；同一张卡里前后两条分割线不能一个 .7 一个 1.0。 */\n.page:has(.sent) .split > .card:first-child > .row:last-child{\n  margin-top:8px !important;\n  padding-top:12px !important;\n  border-top:1px solid rgba(52,56,65,.6) !important;\n}\n\n\n/* ==========================================================================\n   §3 句库 · 右「句子」表（#13–#22）\n   ========================================================================== */\n\n/* #13 现在右卡行内 style=\"padding:6px 8px 8px\"（6 不是 4 的倍数）→ 改成 8px\n       为什么：硬规格；四边等距，表头和卡片上沿的关系才跟左边那张卡一致。 */\n.page:has(.sent) .split > .card:last-child{padding:8px !important}\n\n/* #14 现在 .split table 全裸：没有 width:100%、没有 border-collapse，列宽按内容撑，表头和数据对不齐\n       → 改成 width:100% + table-layout:fixed + border-collapse\n       为什么：fixed 让「句子」列真的吃 54%（th 上的行内 width），五个面容得下列宽才会等宽，\n               否则首行两行文字会把「读」列顶到别处（这就是现在读/打/听列错位的原因）。 */\n.page:has(.sent) .split > .card:last-child > table{\n  width:100%;\n  table-layout:fixed;\n  border-collapse:collapse;\n}\n\n/* #15 现在表头没有样式：11.5px 灰字、字号跟来源列一样、没有下边线\n       → 改成 11px / 500 / --fg3 / min-height 32px / 居中 / 1px 下边线\n       为什么：硬规格字阶里没有 11.5；表头是标签不是数据，用 500 免得跟正文 600 抢。 */\n.page:has(.sent) .split thead th{\n  font-size:11px;\n  font-weight:500;\n  color:var(--fg3);\n  height:32px;\n  padding:0 8px;\n  text-align:center;\n  border-bottom:1px solid var(--line);\n  white-space:nowrap;\n}\n\n/* #16 现在表头「句子」是居中的，而 td 里的句子是左对齐的 → 表头文字浮在句子行中间\n       → 改成 th:first-child 左对齐；最后一列「来源」也左对齐（数据贴左，视觉上成一条）\n       为什么：15 页里所有表头都跟着数据左对齐；居中的表头 + 左对齐的数据是这两页最明显的错位。 */\n.page:has(.sent) .split thead th:first-child,\n.page:has(.sent) .split thead th:last-child,\n.page:has(.sent) .split tbody td:last-child{text-align:left}\n\n/* #17 现在 td 没有 padding、没有行高，6 行句子贴在一起，行间也没有分割线\n       → 改成 padding:4px 8px、垂直居中、tr + tr 一条 1px 分割线\n       为什么：4 是硬规格；行内句子 24px 行高 + 8px 上下留白 = 40px 行，6 行才读得开（POLISH 3）。 */\n.page:has(.sent) .split tbody td{\n  padding:4px 8px;\n  text-align:center;\n  vertical-align:middle;\n}\n.page:has(.sent) .split tbody tr + tr > td{border-top:1px solid rgba(52,56,65,.6)}\n\n/* #18 现在整行可点（tr.clickable 有 onclick）但没有 hover、没有手型，用户不知道能点\n       → 改成 hover 4% 白底 + cursor:pointer，160ms\n       为什么：POLISH 9；这张表是进详情页的唯一入口（点看这句详情只是另一个入口）。 */\n.page:has(.sent) .split tbody tr:hover > td{background:rgba(var(--w),.045)}\n.page:has(.sent) .split tbody tr.clickable{cursor:pointer}\n\n/* #19 现在 .sent 没有样式，14px 继承正文，靠 --fg 满亮度 → 六行句子亮成一片，扫不出「哪句在说哪个说法」\n       → 改成 14px / --fg2（次文字）+ 行高 24px；行 hover 时提亮到 --fg\n       为什么：POLISH 3.2 对比度分档；句子是数据不是标题，满亮度会让下划线高亮失效。 */\n.page:has(.sent) .sent{font-size:14px;line-height:24px;color:var(--fg2)}\n.page:has(.sent) .split tbody tr:hover .sent{color:var(--fg)}\n\n/* #20 现在下划线是全局 u{box-shadow:inset 0 -1.5px 0 rgba(accent,.55)}，1.5px 在 14px 字下几乎看不见\n       → 改成 2px、底色提到 .62\n       为什么：u 标的是「这句在练哪个说法」，是这张表的核心信息；2px 是装饰色许可上限（硬规格）。 */\n.page:has(.sent) .sent u{box-shadow:inset 0 -2px 0 rgba(var(--accent-rgb),.62)}\n\n/* #21 现在 pip 是 inline span，width/height 在行内元素上不生效，td 居中也不稳\n       → 改成 display:block + margin:0 auto\n       为什么：8px 的圆点在 40px 行里要落在正中，五个面才排成一条水平线（现在有些偏上有些偏下）。 */\n.page:has(.sent) .split tbody td > .pip{display:block;margin:0 auto}\n\n/* #22 现在「来源」列是 .mut（12px / --ghost），跟表头 11px 不同字号，右边缘也不齐\n       → 改成 11px、--ghost、不换行、tabular\n       为什么：硬规格字阶 11 才是提示档；来源是辅助信息，不该跟句子同字号。 */\n.page:has(.sent) .split tbody td.mut{font-size:11px;white-space:nowrap;color:var(--ghost)}\n\n\n/* ==========================================================================\n   §4 详情 · 抽屉骨架（#23–#26）\n   ========================================================================== */\n\n/* #23 现在 .drawer 没有任何定位样式，直接排在 .split 下面、占满全宽，像「页面掉了一块」\n       → 改成页级两栏：内容 1fr + 抽屉 400px，抽屉 sticky 在右上\n       为什么：详情页的信息密度比句库高一级（POLISH 10 要照学习页对齐）；\n               400px 是「一列标签 + 一列值」放得下、又不会把句子表挤爆的宽度。\n               注意 .drawer 在 main.screen 里（不是 .page 的直接子节点），所以选 main.screen。 */\n.page > main.screen:has(> .drawer){\n  display:grid;\n  grid-template-columns:minmax(0,1fr) 400px;\n  column-gap:16px;\n  row-gap:0;\n  align-content:start;\n}\n.page > main.screen:has(> .drawer) > main.screen{\n  grid-column:1;\n  grid-row:1;\n  min-width:0;\n  padding:0;              /* 现在里外两层 main.screen 各有一份 padding:8px 0 44px，底部白 88px */\n  gap:20px;\n}\n.page > main.screen:has(> .drawer) > .drawer{\n  grid-column:2;\n  grid-row:1;\n  align-self:start;\n  position:sticky;\n  top:16px;\n}\n\n/* #24 现在 .dmask 是空的 div，没样式但也没隐藏（占一行高度）→ 关掉\n       为什么：抽屉是常驻栏不是模态层，不需要遮罩；留着会在 grid 里多占一行。 */\n.page > main.screen:has(> .drawer) > .dmask{display:none}\n\n/* #25 现在抽屉开着时左栏只有 1104-400-16=688px，而句子表是 7 列 fixed 表：\n       「句子」54% 只剩 206px（句子折 3 行）、五个面的列各 20px 撑不住 8px 点\n       → 改成抽屉打开时详情页走单栏（说法列表在上、句子表在下，各占 688px）\n       为什么：7 列表格在 382px 里放不下；堆叠后表格 688px、句子列 371px，一行读完（POLISH 3）。\n       抽屉关掉（.drawer[hidden]）时回到 290px + 1fr。 */\n.page:has(main.screen > .drawer) .split{grid-template-columns:minmax(0,1fr)}\n.page:has(main.screen > .drawer[hidden]) .split{grid-template-columns:290px minmax(0,1fr)}\n.page:has(main.screen > .drawer[hidden]) > main.screen:has(> .drawer){grid-template-columns:minmax(0,1fr)}\n\n/* #26 现在抽屉是裸 div：无底、无边、无圆角、无内距，五段内容一口气排到底\n       → 改成 surface-sheet 面板：16px 内距、14px 圆角、最大高度 calc(100vh - 32px)、内部滚动\n       为什么：--surface-sheet(#20242D) 就是给「抽屉」准备的令牌；14px 与 .card 同档（硬规格）；\n               内部滚动让抽屉不会把页面拉成 1500px 长。 */\n.page:has(main.screen > .drawer) .drawer{\n  background:var(--surface-sheet);\n  border:1px solid var(--glass-line);\n  border-radius:14px;\n  padding:16px;\n  max-height:calc(100vh - 32px);\n  overflow:auto;\n  overscroll-behavior:contain;\n  scrollbar-width:thin;\n}\n\n\n/* ==========================================================================\n   §5 详情 · 抽屉内部（#27–#38）\n   ========================================================================== */\n\n/* #27 现在 .drawer .drow 命中全局「卡组表 5 列网格」：display:grid + height:44px + grid-template-columns\n       → 改成 flex 行：min-height:28px、gap 8px、圆角 6px、hover 4%\n       为什么：这里每行是「点 + 面名 + 结果 + 右端备注」，不是五列表格；复位成 flex 之后\n               「最近七次」的日期也回到行首，而不是被挤到最右 64px 列里竖排。 */\n.page:has(main.screen > .drawer) .drow{\n  display:flex;\n  align-items:center;\n  gap:8px;\n  min-height:28px;\n  padding:0 4px;\n  border-radius:6px;\n  transition:background 160ms cubic-bezier(.22,.9,.18,1);\n}\n.page:has(main.screen > .drawer) .drow:hover{background:rgba(var(--w),.04)}\n\n/* #28 现在抽屉里的 pip 跟着网格被甩到最左，跟文字隔一整个 1fr\n       → 改成 flex 子项固定 8px\n       为什么：「五个面」是「点 → 面名 → 结果」的读法，点必须紧贴面名。 */\n.page:has(main.screen > .drawer) .drow > .pip{flex:0 0 auto;display:block}\n\n/* #29 现在 .df（面名 读/打/听/说/改）没有样式，14px 继承 --fg，最右那列还被行内 width:auto 影响\n       → 改成 12px / --fg2、flex:0 0 auto + min-width 32px\n       为什么：面名是标签，用 --fg2（次文字）不抢结果；min-width 32px 让五个面名等宽对齐；\n               行内 style=\"width:auto\" 的「原声 3.2s」靠 min-width 兜住，不会再被压成 32px。 */\n.page:has(main.screen > .drawer) .drow > .df{\n  font-size:12px;\n  color:var(--fg2);\n  flex:0 0 auto;\n  min-width:32px;\n}\n\n/* #30 现在 .dst（已过 / 卡住 / 没开始）没有样式，跟面名同字号同色，一行里读不出主次\n       → 改成 14px / --fg / 600 / 吃掉剩余空间\n       为什么：结果才是这一行的答案，字重 600 + 满亮度；吃掉剩余空间后右端备注自然贴右。 */\n.page:has(main.screen > .drawer) .drow > .dst{\n  font-size:14px;\n  font-weight:600;\n  color:var(--fg);\n  flex:1 1 auto;\n  min-width:0;\n}\n\n/* #31 现在右端备注（档 4 · 4 天后）是 .mut 但没右对齐规则，两行数字不成列\n       → 改成 11px / --ghost / 右对齐 / tabular-nums，且行高 20px\n       为什么：一列数字必须等宽才对得齐（tabular-nums）；11px 是提示档（硬规格字阶）。 */\n.page:has(main.screen > .drawer) .drow > .mut:last-child{\n  font-size:11px;\n  color:var(--ghost);\n  text-align:right;\n  flex:0 1 auto;\n  min-width:0;\n  font-variant-numeric:tabular-nums;\n  line-height:20px;\n}\n\n/* #32 现在「这一句」的 ▶ 落在 1fr 列里被拉成 800px 长的横条\n       → 改成 28px 见方的键帽按钮\n       为什么：它是个播放按钮，不是进度条；28px 满足桌面触控下限（POLISH 8）。 */\n.page:has(main.screen > .drawer) .drow > .kbd{\n  flex:0 0 auto;\n  display:inline-grid;\n  place-items:center;\n  width:28px;\n  height:28px;\n  padding:0;\n  border-radius:6px;\n  font-size:11px;\n  cursor:pointer;\n  transition:background 160ms cubic-bezier(.22,.9,.18,1);\n}\n.page:has(main.screen > .drawer) .drow > .kbd:hover{background:rgba(var(--accent-rgb),.16)}\n\n/* #33 现在抽屉头部 .dhead/.dtitle/.dsub 全无样式：长英文标题 14px 铺满、副标题贴着标题\n       → 标题 16px/600/行高 24px，副标题 12px/--fg3/margin-top 4px\n       为什么：POLISH 3.2 字阶；标题 2 行时要整齐断开，副标题得让人一眼看出「说法·出处」。 */\n.page:has(main.screen > .drawer) .dhead{display:flex;align-items:flex-start;gap:12px;padding-bottom:16px}\n.page:has(main.screen > .drawer) .dhead > div{min-width:0;flex:1}\n.page:has(main.screen > .drawer) .dtitle{font-size:16px;font-weight:600;color:var(--fg);line-height:24px}\n.page:has(main.screen > .drawer) .dsub{font-size:12px;color:var(--fg3);margin-top:4px}\n\n/* #34 现在关闭钮是全局 .iconbtn 38px 圆钮，压在标题行右侧但没有基线关系\n       → 改成 32px，不收缩\n       为什么：POLISH 8「图标按钮再小也要有 32px 命中区」；32 也正好跟标题行高对齐。 */\n.page:has(main.screen > .drawer) .dhead > .iconbtn{width:32px;height:32px;flex:0 0 auto;cursor:pointer}\n\n/* #35 现在四个 .dsec 之间没有任何分隔，只有间距；段落标题 13px 跟内容 12px 差一点\n       → 每段 padding 16px 0 + 1px 分割线，首段不留上边距、末段不留线\n       为什么：四段信息（五个面 / 卡片信息 / 最近七次 / 这一句）要能一眼切成四块（POLISH 10）。 */\n.page:has(main.screen > .drawer) .dsec{padding:16px 0;border-top:1px solid rgba(52,56,65,.6)}\n.page:has(main.screen > .drawer) .dhead + .dsec{padding-top:0;border-top:0}\n.page:has(main.screen > .drawer) .dsec > .dsech{margin-bottom:4px}\n\n/* #36 现在 .dsech 没样式，13px 继承，跟下面 14px 的结果几乎同号\n       → 改成 11px / 500 / --ghost / 大写字距感（不引入新字重）\n       为什么：段落小标题是「提示」层级，靠字号+颜色分层，不靠加粗（POLISH 2 只许三档字重）。 */\n.page:has(main.screen > .drawer) .dsech{font-size:11px;font-weight:500;color:var(--ghost)}\n\n/* #37 现在 .dgrid 没有网格：四组「当前间隔/4 天」竖着排成一列、label 和值间没有 4px\n       → 改成 2×2 网格，gap 12px 16px，label 11px/--ghost，值 14px/600/margin-top 4px\n       为什么：四个字段是并列的，竖排会让抽屉多长 120px；12px 与 16px 都是 4 的倍数。 */\n.page:has(main.screen > .drawer) .dgrid{display:grid;grid-template-columns:1fr 1fr;gap:12px 16px}\n.page:has(main.screen > .drawer) .dgrid > div > .mut{font-size:11px;color:var(--ghost);line-height:16px}\n.page:has(main.screen > .drawer) .dv{\n  font-size:14px;\n  font-weight:600;\n  color:var(--fg);\n  margin-top:4px;\n  line-height:20px;\n  font-variant-numeric:tabular-nums;\n}\n\n/* #38 现在 .dfoot 沉在抽屉最底，没有分割线，主按钮和两个 ghost 一样大，焦点不明确\n       → 加上边线、gap 8px、按钮 12px/8px 16px，主按钮靠右\n       为什么：POLISH 9 状态反馈 + 视觉焦点；底部动作条必须跟内容切开，主按钮才立得住。 */\n.page:has(main.screen > .drawer) .dfoot{\n  display:flex;\n  align-items:center;\n  gap:8px;\n  padding-top:16px;\n  border-top:1px solid rgba(52,56,65,.6);\n}\n.page:has(main.screen > .drawer) .dfoot .sp{flex:1}\n.page:has(main.screen > .drawer) .dfoot .btn{font-size:12px;padding:8px 16px;cursor:pointer}\n\n\n/* ==========================================================================\n   §6 挖句 · 播放器（#39–#48）\n   ========================================================================== */\n\n/* #39 现在 .minewrap 没有布局：播放器卡和字幕卡上下各占满全宽，播放器一开就是 1104×770\n       → 改成两栏 1fr + 400px\n       为什么：1440 下播放器 688×387（16:9 正好），字幕卡 400px 在右边同屏可见，\n               挖句时不用上下滚（POLISH 3 一屏之内可用）。 */\n.page:has(.minewrap) .minewrap{\n  display:grid;\n  grid-template-columns:minmax(0,1fr) 400px;\n  gap:16px;\n  align-items:start;\n}\n\n/* #40 现在播放器卡用 .card 默认 18px 20px 内距，内部元素之间没有统一间距\n       → 改成 padding:16px、纵向 gap:12px\n       为什么：16/12 都是 4 的倍数；播放器里的块（视频 / 进度 / 快捷键 / 音轨 / 说法）节奏要一致。 */\n.page:has(.minewrap) .player{padding:16px;display:flex;flex-direction:column;gap:12px}\n\n/* #41 ★ 现在 .vid 是个普通 div，里面的 .vplay > svg 没有 width/height，\n       浏览器按「宽度撑满父级」解析 → SVG 变成一整个屏幕大的黑色三角形，把整页盖住\n       → 给 .vid 定 16:9 + 圆角 + 溢出裁切\n       为什么：这是挖句页第一丑（整页只剩一个黑三角）；16:9 是视频唯一正确答案，\n               overflow:hidden 让里面任何绝对定位也跑不出去。 */\n.page:has(.minewrap) .vid{\n  position:relative;\n  aspect-ratio:16/9;\n  border-radius:14px;\n  overflow:hidden;\n  background:var(--lowest);\n  border:1px solid rgba(52,56,65,.8);\n}\n\n/* #42 现在 .vframe 无样式，播放三角居中不了 → absolute 铺满 + grid 居中 + 可点\n       为什么：视频封面区域要自己撑满 .vid，播放钮才是真的在正中间。 */\n.page:has(.minewrap) .vframe{position:absolute;inset:0;display:grid;place-items:center;cursor:pointer}\n\n/* #43 现在 .vplay 就是那个失控的 SVG → 改成 48px 圆钮 + 16px 图标 + hover 反馈\n       为什么：POLISH 8（≥28px 触控、图标按钮 32px 命中区）与 POLISH 9（悬停/按下 120–180ms）。 */\n.page:has(.minewrap) .vplay{\n  width:48px;\n  height:48px;\n  border-radius:999px;\n  display:grid;\n  place-items:center;\n  background:rgba(var(--w),.10);\n  border:1px solid rgba(var(--w),.16);\n  color:var(--fg);\n  transition:background 160ms cubic-bezier(.22,.9,.18,1),transform 160ms cubic-bezier(.22,.9,.18,1);\n}\n.page:has(.minewrap) .vplay svg{width:16px;height:16px;fill:currentColor;stroke:none}\n.page:has(.minewrap) .vplay:hover{background:rgba(var(--w),.16);transform:scale(1.06)}\n\n/* #44 现在 .vtime「12:41 / 22:04」是普通文本，压在视频左上角，跟黑色画面糊在一起\n       → 贴右下角、11px mono、半透明深底胶囊\n       为什么：播放器时间码是「提示」信息，不该跟画面对撞；右下角是播放器的通用位置。 */\n.page:has(.minewrap) .vtime{\n  position:absolute;\n  right:12px;\n  bottom:12px;\n  padding:4px 8px;\n  border-radius:6px;\n  background:rgba(20,22,28,.72);\n  font-family:var(--mono);\n  font-size:11px;\n  color:var(--fg2);\n  font-variant-numeric:tabular-nums;\n}\n\n/* #45 现在 .vbar 没样式，里面 i 的 31% 宽度不生效（父级没有高度）→ 轨道 4px、已播主色\n       为什么：进度是状态反馈的基础（POLISH 9）；4px 是硬规格间距里最小的一档厚度。 */\n.page:has(.minewrap) .vbar{height:4px;border-radius:999px;background:rgba(var(--w),.10);overflow:hidden}\n.page:has(.minewrap) .vbar > i{display:block;height:100%;border-radius:999px;background:var(--accent)}\n\n/* #46 现在 .vctl 里四个 .kbd 和说明文字挤成一行，没有换行余量\n       → gap 8px + 允许换行 + 11px 提示色\n       为什么：900 宽时这一行必然换行，不设 wrap 会横向溢出（硬规格 900 断点要求）。 */\n.page:has(.minewrap) .vctl{display:flex;align-items:center;gap:8px;row-gap:8px;flex-wrap:wrap;font-size:11px;color:var(--ghost)}\n\n/* #47 现在 .vtrack 里「音轨」标签和 .wave 抢宽度，wave 被标签压成一个窄条\n       → 标签不收缩 11px、wave 吃剩余宽度\n       为什么：波形是音轨这一块的主体，标签只是标注（POLISH 3 节奏）。 */\n.page:has(.minewrap) .vtrack{display:flex;align-items:center;gap:12px}\n.page:has(.minewrap) .vtrack > .mut{flex:0 0 auto;font-size:11px}\n.page:has(.minewrap) .vtrack .wave{flex:1 1 auto;min-width:0}\n\n/* #48 现在 .wave i.on 带着 animation:wave-pulse .6s infinite alternate，48 根柱子一直在闪\n       → 关掉无限动画，改成静态主色；只保留 .on 与 .off 的明暗差\n       为什么：常驻闪烁是噪声不是反馈（POLISH 9 只要「点了有反应」，不要持续动）；\n               prefers-reduced-motion 时也必须静止（硬规格）。 */\n.page:has(.minewrap) .wave i.on{animation:none}\n.page:has(.minewrap) .wave i{background:rgba(var(--accent-rgb),.32)}\n.page:has(.minewrap) .wave i.on{background:var(--accent)}\n\n/* #49 现在播放器里说明小字行内 style=\"font-size:11px;line-height:1.7\"（1.7 不是 4 的倍数体系）\n       → 改成行高 16px（行内样式只能 !important）\n       为什么：硬规格间距；11px 字配 16px 行高在深色底上正好不散。 */\n.page:has(.minewrap) .player > p.mut{line-height:16px !important;margin:0 !important}\n\n/* #50 现在 .player 里的 .divider 还带全局 margin:6px 0，跟 gap:12px 叠成 12+12=24 的空档\n       → margin:0，间距全交给 gap\n       为什么：同一条缝不能两份间距（POLISH 3 一屏只用 3 种间距档，这里统一 12）。 */\n.page:has(.minewrap) .player > .divider{margin:0}\n\n\n/* ==========================================================================\n   §7 挖句 · 字幕（#51–#60）\n   ========================================================================== */\n\n/* #51 现在 .subs 是默认 .card 内距，.sublines 没有间距 → 9 行字幕贴成一片\n       → .subs padding 16px + gap 12px；.sublines flex 列 + gap 4px\n       为什么：字幕行密，行与行之间靠 4px + hover 底色区分，而不是靠大空白。 */\n.page:has(.minewrap) .subs{padding:16px;display:flex;flex-direction:column;gap:12px}\n.page:has(.minewrap) .sublines{display:flex;flex-direction:column;gap:4px}\n\n/* #52 ★ 现在 .subline 没有样式 → 「12:38We're completely out of coffee.已收」三块粘成一句\n       → 三列网格：48px 时间 + 1fr 句子 + auto 状态，gap 8px，min-height 36px，可点\n       为什么：这是挖句页操作最频繁的一行；48px 刚好放下 12:38 这种 5 字符时间码，36px 命中区\n               满足 POLISH 8。 */\n.page:has(.minewrap) .subline{\n  display:grid;\n  grid-template-columns:48px minmax(0,1fr) auto;\n  align-items:baseline;\n  gap:8px;\n  min-height:36px;\n  padding:8px;\n  border-radius:6px;\n  cursor:pointer;\n  position:relative;\n  transition:background 160ms cubic-bezier(.22,.9,.18,1);\n}\n.page:has(.minewrap) .subline:hover{background:rgba(var(--w),.045)}\n\n/* #53 现在选中的字幕 .subline.on 完全没有可见差别\n       → 主色 10% 底 + 左端 2px 主色条\n       为什么：正在播的是哪一句必须一眼看出来（POLISH 9 状态反馈）；跟说法列表用同一套选中语言。 */\n.page:has(.minewrap) .subline.on{background:rgba(var(--accent-rgb),.10)}\n.page:has(.minewrap) .subline.on::before{\n  content:\"\";\n  position:absolute;\n  left:0; top:4px; bottom:4px;\n  width:2px;\n  border-radius:999px;\n  background:var(--accent);\n}\n\n/* #54 ★ 现在时间 12:38 命中全局 .t（时间胶囊：padding 5px 11px + 边框 + 圆底），被套成一个小胶囊\n       → 复位成裸 mono 时间码：11px、--ghost、无底无边、不收缩、左对齐\n       为什么：撞名。时间码是行首的标尺，不是可点的胶囊；胶囊还把 48px 列撑破了。\n       注：圆角写 6px 而不是 0，是因为硬规格只认 6/14/999 三档；没有底色时看不出来。 */\n.page:has(.minewrap) .subline > .t{\n  font-family:var(--mono);\n  font-size:11px;\n  font-weight:400;\n  color:var(--ghost);\n  padding:0;\n  border:0;\n  background:none;\n  border-radius:6px;\n  cursor:inherit;\n  text-align:left;\n  font-variant-numeric:tabular-nums;\n}\n\n/* #55 现在 .subline .en 继承全局 .en{color:var(--fg);font-weight:400}，9 行全是满亮度白字\n       → 14px / 行高 24px / --fg2；已收的行降到 --fg3，选中行提亮到 --fg\n       为什么：三档亮度正好表达「没碰 → 已收 → 正在听」（POLISH 3.2 分档 + POLISH 9）。 */\n.page:has(.minewrap) .subline > .en{font-size:14px;line-height:24px;color:var(--fg2);font-weight:400}\n.page:has(.minewrap) .subline.done > .en{color:var(--fg3)}\n.page:has(.minewrap) .subline.on > .en{color:var(--fg)}\n\n/* #56 现在 .smark（已收 / 收这句 / 空）跟在句子后面，把句子挤短、右端参差\n       → 第三列右端对齐，11px，nowrap\n       为什么：状态列右对齐才成一列（跟表里的 pip 一个道理）。 */\n.page:has(.minewrap) .smark{font-size:11px;color:var(--ghost);white-space:nowrap;justify-self:end;align-self:center}\n.page:has(.minewrap) .smark:empty{display:none}\n\n/* #57 现在「收这句」和「已收」颜色一样，看不出哪行还能收\n       → 未收的 .smark 用主色，已收的保持 --ghost\n       为什么：主色是唯一强调色，只用来标「可操作」（POLISH 1 色相收敛）。 */\n.page:has(.minewrap) .subline:not(.done) > .smark{color:var(--accent);font-weight:500}\n\n/* #58 现在句子里的 .w（逐词可点）没有 hover，点上去没反应\n       → hover 主色 14% 底、圆角 6px、120ms\n       为什么：POLISH 9；逐词可点是挖句页的核心交互，必须有悬停反馈。 */\n.page:has(.minewrap) .w{border-radius:6px;transition:background 120ms cubic-bezier(.22,.9,.18,1);cursor:pointer}\n.page:has(.minewrap) .w:hover{background:rgba(var(--accent-rgb),.14)}\n\n/* #59 现在 .mined（已经收进卡片的词）没有任何标记\n       → 2px 主色下划线；.mined.hot（当前正要收的）再加 16% 底\n       为什么：已收词要在句子里看得见，否则用户不知道自己收过哪些（POLISH 9）。 */\n.page:has(.minewrap) .w.mined{box-shadow:inset 0 -2px 0 var(--accent)}\n.page:has(.minewrap) .w.mined.hot{background:rgba(var(--accent-rgb),.16)}\n\n/* #60 现在字幕卡的标题行「字幕 / 点词查 · 点整行收」跟列表没有分隔，标题像第一条数据\n       → 标题行下加 1px 分割线、padding 0 0 8px\n       为什么：一卡一个大标题，跟抽屉的 .dhead 用同一种处理（POLISH 10 密度对齐）。 */\n.page:has(.minewrap) .subs > .row:first-child{padding-bottom:8px;border-bottom:1px solid rgba(52,56,65,.6)}\n\n\n/* ==========================================================================\n   §8 挖句 · 查词面板（#61–#64）\n   ========================================================================== */\n\n/* #61 ★ 现在 .pop 命中全局 .pop{display:none}（那是「说明文字浮层」的关闭态），\n      而挖句页的 .pop 是钉在字幕卡里的查词面板 → 一直不显示\n       → 在 .subs 里恢复成一张常驻小卡（12px 内距、14px 圆角、3% 白底）\n       为什么：撞名。这个面板是挖句页的第二根柱子（点词→释义→收），必须看得见。 */\n.page:has(.minewrap) .subs > .pop{\n  display:flex;\n  flex-direction:column;\n  gap:8px;\n  padding:12px;\n  border-radius:14px;\n  background:rgba(var(--w),.03);\n  border:1px solid rgba(52,56,65,.7);\n}\n\n/* #62 现在 .pw/.ipa/.chip 挤在一行没有基线关系，词频 chip 贴在词右边\n       → 词 20px/600、音标 12px mono --ghost、词频 chip 推到最右\n       为什么：20px 是硬规格字阶里的次级标题档；音标用 mono 才不会跟正文混淆。 */\n.page:has(.minewrap) .pophead{display:flex;align-items:baseline;gap:8px}\n.page:has(.minewrap) .pw{font-size:20px;font-weight:600;color:var(--fg)}\n.page:has(.minewrap) .ipa{font-size:12px;color:var(--ghost);font-family:var(--mono)}\n.page:has(.minewrap) .pophead > .chip{margin-left:auto}\n\n/* #63 现在 .poplemma / .popdef 没样式：原形和释义同字号，读不出层级\n       → 原形 11px --ghost，释义 14px/24px --fg2\n       为什么：释义是这一段真正要读的东西，14px 正文档（POLISH 2 补的那一档）。 */\n.page:has(.minewrap) .poplemma{font-size:11px;color:var(--ghost)}\n.page:has(.minewrap) .popdef{font-size:14px;line-height:24px;color:var(--fg2)}\n\n/* #64 现在 .popfoot 里两个按钮没有间距，也没有上边线\n       → gap 8px + 上边线 + 12px 按钮\n       为什么：面板内部的动作条跟抽屉 .dfoot 用同一套（POLISH 10 一致性）。 */\n.page:has(.minewrap) .popfoot{display:flex;gap:8px;padding-top:8px;border-top:1px solid rgba(52,56,65,.6)}\n.page:has(.minewrap) .popfoot .btn{font-size:12px;padding:8px 16px;cursor:pointer}\n\n\n/* ==========================================================================\n   §9 挖句 · 「收进来是这样」预览卡（#65–#70）\n   ========================================================================== */\n\n/* #65 现在 .cardprev 没有布局：正面卡和背面卡并排且各自被 .mini 压成 28px 高\n       → 两列 1fr + 12px 间隙\n       为什么：正面/背面是同一张卡的两个面，并排最省地方，12px 是 4 的倍数。 */\n.page:has(.minewrap) .cardprev{display:grid;grid-template-columns:1fr 1fr;gap:12px}\n\n/* #66 ★ 现在 .mini 命中全局「面板小按钮」（height:28px / padding 0 12px / font-size 11px / 内联 flex），\n      两张卡被压成一条按钮，英文和中文互相叠在一起\n       → 复位成卡：height:auto、padding 12px、圆角 14px、纵向 flex gap 8px、14px 字\n       为什么：撞名。这是「卡片长什么样」的预览，必须是卡片的比例，不然预览毫无意义。 */\n.page:has(.minewrap) .cardprev .mini{\n  display:flex;\n  flex-direction:column;\n  gap:8px;\n  height:auto;\n  padding:12px;\n  border-radius:14px;\n  background:var(--low);\n  border:1px solid rgba(52,56,65,.7);\n  font-size:14px;\n  line-height:normal;\n  cursor:default;\n}\n\n/* #67 现在 .miniimg 只有「12:41 的画面」几个字，没有画面区\n       → 16:9 渐变占位 + 11px mono 提示字居中\n       为什么：正面要有图片区的形状，用户才知道卡片出厂长什么样（POLISH 7 空位也要画）。 */\n.page:has(.minewrap) .miniimg{\n  aspect-ratio:16/9;\n  border-radius:6px;\n  background:linear-gradient(180deg,var(--cont),var(--lowest));\n  display:grid;\n  place-items:center;\n  font-family:var(--mono);\n  font-size:11px;\n  color:var(--fg3);\n}\n\n/* #68 现在 .minien（英文句子）跟 11px 按钮字一样大，压在图片底下没有间距\n       → 16px / 500 / 行高 24px / --fg\n       为什么：卡片正面的主文字是那句英文，16px 是硬规格字阶；500 比正文 400 重一档，不抢 600。 */\n.page:has(.minewrap) .minien{font-size:16px;font-weight:500;color:var(--fg);line-height:24px}\n\n/* #69 现在 .miniaudio 里 kbd ▶ 和「3.2s · 原声」粘在一起\n       → flex + gap 8px，kbd 固定 28px 命中区，说明 11px\n       为什么：试听是卡片正面唯一的动作，命中区 28px（POLISH 8）。 */\n.page:has(.minewrap) .miniaudio{display:flex;align-items:center;gap:8px}\n.page:has(.minewrap) .miniaudio .kbd{\n  display:inline-grid;\n  place-items:center;\n  width:28px;\n  height:28px;\n  padding:0;\n  border-radius:6px;\n  font-size:11px;\n  cursor:pointer;\n}\n.page:has(.minewrap) .miniaudio .mut{font-size:11px}\n\n/* #70 现在 .minizh / .minitags / .minisrc 三块没有间距，中文和三个 chip 贴在一起\n       → 中文 14px/24px --fg2，chip 横排 gap 8px，出处 11px --ghost + 上 4px\n       为什么：背面是「中文场景 + 标签 + 出处」三层信息，靠 8px/4px 分档（POLISH 3 三档间距）。 */\n.page:has(.minewrap) .minizh{font-size:14px;line-height:24px;color:var(--fg2)}\n.page:has(.minewrap) .minitags{display:flex;flex-wrap:wrap;gap:8px}\n.page:has(.minewrap) .minisrc{font-size:11px;color:var(--ghost);margin-top:4px}\n\n\n/* ==========================================================================\n   §10 三页的态（空 / 加载 / 错误）与键盘（#71–#74）\n   ========================================================================== */\n\n/* #71 现在三条列表（说法 / 句子表 / 字幕 / 收进来）在没数据时是一片空白卡片，什么也不说\n       → 用 :has() 判空补空态文案（不改 HTML、不要 JS）\n       为什么：POLISH 7「空态不要写暂无数据，要说清下一步该点哪」；这里是纯 CSS 就能补的一层保险。 */\n.page:has(.sent) .split > .card:first-child:not(:has(.litem))::after{\n  content:\"还没有说法：先去「工厂」粘几段素材，或在挖句台收一句进来\";\n  display:block;\n  padding:24px 12px;\n  text-align:center;\n  font-size:12px;\n  line-height:20px;\n  color:var(--fg3);\n}\n.page:has(.sent) .split > .card:last-child:not(:has(tbody tr))::after{\n  content:\"这张表还没有句子：换个说法筛选，或按「全部」看全部 37 句\";\n  display:block;\n  padding:24px 12px;\n  text-align:center;\n  font-size:12px;\n  line-height:20px;\n  color:var(--fg3);\n}\n.page:has(.minewrap) .sublines:not(:has(.subline))::after{\n  content:\"这一段还没抓到字幕：点右上「导入素材」贴 .srt，或换一段再挖\";\n  display:block;\n  padding:24px 8px;\n  text-align:center;\n  font-size:12px;\n  line-height:20px;\n  color:var(--fg3);\n}\n.page:has(.minewrap) .cardprev:not(:has(.mini))::after{\n  content:\"收进来之后这里会显示卡片正反面\";\n  grid-column:1/-1;\n  display:block;\n  padding:24px 8px;\n  text-align:center;\n  font-size:12px;\n  line-height:20px;\n  color:var(--fg3);\n}\n\n/* #72 现在数据没回来时页面就是空白，没有任何「在加载」的迹象\n       → 给三页的列表容器补 .is-loading / .is-error 态（JS 加类即可，无需改结构）\n       为什么：POLISH 7 三态都要画；故意做成「有底色 + 一行话」，不引进度条色相。 */\n.page:is(:has(.sent),:has(.minewrap)) .card.is-loading::after{\n  content:\"正在读库…\";\n  display:block;\n  padding:24px 12px;\n  text-align:center;\n  font-size:12px;\n  color:var(--fg3);\n}\n.page:is(:has(.sent),:has(.minewrap)) .card.is-error::after{\n  content:\"这一块没读出来：先刷新一次，还不行就看「诊断」\";\n  display:block;\n  padding:24px 12px;\n  text-align:center;\n  font-size:12px;\n  line-height:20px;\n  color:var(--danger);      /* 唯一警示色，不引入第二种 */\n}\n.page:is(:has(.sent),:has(.minewrap)) .card.is-error{border-color:var(--danger-cont)}\n\n/* #73 现在全页没有焦点环（app.css 只给部分控件写了 :focus-visible），键盘 Tab 到说法行/字幕行看不出来\n       → 三页的可点块统一 2px 主色焦点环、offset 2px\n       为什么：POLISH 3.2「Tab 可达、焦点环可见」；offset 2 让环不压住文字。 */\n.page:is(:has(.sent),:has(.minewrap)) :is(a,button,.chip,.litem,.subline,.drow,.w):focus-visible{\n  outline:2px solid var(--accent);\n  outline-offset:2px;\n}\n\n/* #74 现在波形常驻动画、悬停过渡不受系统偏好影响\n       → prefers-reduced-motion 时全部静止\n       为什么：POLISH 3.2「reduce 时全部动画立即完成」是硬规格。 */\n@media (prefers-reduced-motion:reduce){\n  .page:is(:has(.sent),:has(.minewrap)) *{\n    animation:none !important;\n    transition-duration:1ms !important;\n  }\n}\n\n\n/* ==========================================================================\n   §11 断点（#75–#77）—— 1440 / 1024 / 900 三个宽度都要能看（POLISH 3.2）\n   ========================================================================== */\n\n/* #75 现在 <1120 时抽屉 400px 会把内容栏压到 600px 以下，句子表 7 列挤成一列一个词\n       → 抽屉落到内容下面，变整宽、不再 sticky\n       为什么：POLISH 3.2「900 宽不许出现一列一个词」；抽屉本身是详情不是主线，窄屏让位。 */\n@media (max-width:1120px){\n  .page > main.screen:has(> .drawer){grid-template-columns:minmax(0,1fr);row-gap:16px}\n  .page > main.screen:has(> .drawer) > .drawer{\n    grid-column:1;\n    grid-row:2;\n    position:static;\n    max-height:none;\n  }\n}\n\n/* #76 现在 <1100 时挖句两栏（688 + 400）会小于 1100，字幕列被压到 300px 以下开始折三行\n       → 单栏：播放器在上、字幕在下\n       为什么：挖句是看视频为主的动作，窄屏先给画面。 */\n@media (max-width:1100px){\n  .page:has(.minewrap) .minewrap{grid-template-columns:minmax(0,1fr)}\n}\n\n/* #77 现在 <900 时 .split 的 290px 左栏 + 7 列表格必然溢出，正面/背面两卡也会挤成两列窄条\n       → 三处一起塌成单栏\n       为什么：POLISH 3.2 三个断点都要截图验证；900 是一列一个词的分水岭。 */\n@media (max-width:900px){\n  .page:has(.sent) .split{grid-template-columns:minmax(0,1fr)}\n  .page:has(.minewrap) .cardprev{grid-template-columns:minmax(0,1fr)}\n  .page:is(:has(.sent),:has(.minewrap)) .hdr{flex-direction:column;align-items:flex-start}\n  .page:is(:has(.sent),:has(.minewrap)) .hdr .act{margin-left:0;justify-content:flex-start}\n}\n\n/* —— 规则到此为止：#01…#77。数字口径：编号是按「一条独立的可覆盖决定」编的，\n   一个编号下面可能有两三条声明（比如 .litem 的 flex 行算 #07，它的 hover 算 #08）。 */\n\n/* ════════════════════════════════════════════════════════════════════\n   v-settings.css · 设置页（settings.html）打磨覆盖层\n   ────────────────────────────────────────────────────────────────────\n   怎么用：放在 app.css 之后加载（或整段追加到 app.css 末尾）。\n           只写「覆盖」，不改 app.css 本体，不改 gen.mjs，不动分组顺序。\n   写法：每条 = 现在 → 改成 → 为什么，数字都是 1440×900 实拍量出来的。\n   真源：app.css（实读时 4974 → 8062 行，别的代理还在追加，这份只认选择器）\n   提醒：app.css 第 5836 行之后已经出现本文件的一份快照（别人合并的，不是我\n         写的）；那份不会跟着这里更新，所以定稿仍以本文件为准，行号引用按选择器对。\n   实拍：F:\\dsharness\\etude-test\\mock\\settings.html（8 段逐个截过）\n   字阶：全页收到 11 / 12 / 14 / 16（+ 页面标题 24 不动），共 5 级\n   间距：全部 4 的倍数；圆角：6 / 14 / 999；颜色：只用现有 token\n   ════════════════════════════════════════════════════════════════════ */\n\n\n/* ── 01 · 骨架栅格：26/18/190 不在 4 网格上 ──────────────────────────\n   现在：.setwrap gap 26px、栏宽 190px；.setbody gap 18px\n   改成：24px / 192px / 16px\n   为什么：26 与 18 都落在 4 网格外，栅格和内容间距各自为政，\n           卡片左缘在 x=382，侧栏右缘在 x=356，中间 26px 是唯一的\n           奇数级差，缩放时先在这里看出歪。 */\n.setwrap{grid-template-columns:192px minmax(0,1fr);gap:24px}\n.setbody{gap:16px}\n\n\n/* ── 02 · 卡片圆角：20 是规格外的第七种圆角 ──────────────────────────\n   现在：.group 用 var(--r-lg) = 20px，全站圆角原本只有 6 / 14 / 999\n   改成：14px\n   为什么：20px 是台阶上的第十三级，跟内部的 .ncard(12)、.fprev(12)、\n           .inp(10) 凑出四种圆角；统一到 14 之后卡片 = 14、内块 = 14、\n           小件 = 6，只剩三级。 */\n.setbody .group{border-radius:14px;padding:16px 20px}\n\n\n/* ── 03 · 分组标题太弱：15/600 和白字行标签 13/600 只差 2px ──────────\n   现在：.ghead h2 15px；.ghead .mut 被密度层 display:none 撤掉\n   改成：h2 16px，副标题恢复 12px / --fg3\n   为什么：整页 8 个分组里，标题和下面第一行标签几乎同权，眼睛找不到\n           「这一段从哪开始」。副标题（\"账本 · 素材 · 音频\"）本来就是\n           撑层级的，被 .setbody .group .ghead .mut{display:none} 一起\n           撤了，等于把唯一的层级线索删了。尺寸差 16:12 + 权重 600:400\n           拉开两档，再靠 h2 与首行的 8px 间隙分组。 */\n.setbody .group .ghead{margin-bottom:8px;gap:12px}\n.setbody .group .ghead h2{font-size:16px;font-weight:600;line-height:1.4}\n.setbody .group .ghead .mut{display:block;font-size:12px;color:var(--fg3);line-height:1.4}\n\n\n/* ── 04 · 同一页两套行高：48 与 66，且 66 不是 4 的倍数 ───────────────\n   现在：控件是开关的行 = 48px，控件是按钮的行 = 66px\n         （13 上 + 40 按钮 + 13 下 + 上下各 1px border）\n   改成：.field 统一 64px（11 + 40 + 11 + 2 border），开关行被 min-height\n         撑到同一高度\n   为什么：实拍 divider y 坐标（通用 276/324/390/456、数据 275/341/407/\n           473/539）证明开关行 48、按钮行 66，同一列上下跳 18px；66 还\n           落在 4 网格外。\n   注：padding 取 11 不是 12 —— .field 同时带 border-top（app.css:490 的\n       基础规则）和 border-bottom（密度层 1157 加的），两条都没被抵消，\n       实测占 2px。11+40+11+2 = 64 才真的落在 64。\n   注：这条只管高度。真正把行钉在 64 的是下面几条 —— 只要有一个控件的\n       内容超过 40px，这一行就会破 64，所以 .seg / .stepper / .btn 都\n       给了显式 height:40px。 */\n.setbody .group .field{\n  min-height:64px;padding:11px 0;gap:8px 24px;\n  align-items:center;\n}\n.setbody .group .field .lab{font-size:14px;font-weight:500;line-height:1.4}\n.setbody .group .field .ctl{gap:8px;align-items:center}\n\n\n/* ── 05 · 侧栏：每项 34.5px（分数像素），圆角 9、字号 13 都在规格外 ──\n   现在：.setnav a padding 8px 12px + 13px 字 → 实测 12 项 y 间距\n         33/34 交替 = 34.5px；border-radius 9px；font-size 13px\n   改成：定高 36px、圆角 6、字号 14、左竖条 top/bottom 8px；gap 2→4\n   为什么：34.5 是分数像素，每三项就会有一行落在半像素上，字发虚；\n           36 是 4 的倍数且比原来高 1.5px，命中区更大。9px 圆角是规格\n           外第七种值。gap 2px 同样贴不住网格。 */\n.setnav{gap:4px;padding:4px 0}\n.setnav a{\n  display:flex;align-items:center;height:36px;padding:0 12px;\n  border-radius:6px;font-size:14px;line-height:1;\n}\n.setnav a.on::before{top:8px;bottom:8px}\n.setnav .glab{padding:12px 12px 8px;font-size:11px}\n\n\n/* ── 06 · 开关：轨道被 div.sw 压成 36×20，旋钮还画了两层 ────────────────\n   现在：app.css:555 .sw i 是白块 15×15 top2/left2；app.css:4043 又叠了\n         .sw::after 16×16 top3/left3 —— 两个旋钮同时渲染\n   改成：只留 ::after，top/left 归到 4px，尺寸 16×16\n   为什么：实拍关着的开关旋钮 bbox 量到 17×17（不是 16），边缘一圈发虚，\n           就是两层白块错 1px 叠出来的。24 高的轨道放 16 的旋钮，上下\n           各 4px 才对称；原来 top 是按 --sw-h:20/--sw-k:14 算的 3px，\n           尺寸被改成 24/16 之后没人回头改 top。\n   注：轨道尺寸必须显式写 —— app.css:2609 的 `div.sw{--sw-w:36px;--sw-h:20px;\n        width:var(--sw-w);height:var(--sw-h)}` 特异度 (0,1,1)，一直压着\n        app.css:4042 的 `.sw{width:40px;height:24px}` (0,1,0)。实测 ON 态\n        轨道 bbox 只有 36×21，旋钮 16×16 落在 x1237..1252，右边零间隙、\n        上下 4/1 —— 下面的 top:4「正确」是相对 24 高而言的。 */\n.setbody .sw{width:40px;height:24px}\n.setbody .sw i{display:none}\n.setbody .sw::after{top:4px;left:4px;width:16px;height:16px;background:rgba(255,255,255,.72)}\n.setbody .sw.on::after{transform:translateX(16px);background:#fff}\n\n\n/* ── 07 · 开着的开关比同列控件多出 5px：外发光溢出了 ──────────────────\n   现在：.sw.on box-shadow 0 0 12px rgba(111,139,255,.30)（app.css:2700）\n   改成：外发光换成内描边，右缘回到 1252\n   为什么：实测所有行控件右缘都是 1252，只有「通用 · 练完自动跳下一张」\n         那个开着的开关量到 1257 —— 12px 的外发光把 5px 光晕画到了\n         控件列之外。同一列控件在开/关两种状态下右缘差 5px，扫一眼就\n         觉得没对齐。内描边不越界，也不会在暗底上糊成一团。 */\n.setbody .sw.on{\n  background-color:var(--accent);\n  background-image:none;\n  box-shadow:inset 0 0 0 1px rgba(var(--accent-rgb),.55);\n}\n.setbody .sw.on:hover{background-color:var(--accent);filter:brightness(1.07)}\n\n\n/* ── 08 · 开关颜色是写死的 #7d97ff / #8aa3ff，不是主色 ────────────────\n   现在：.sw.on background-color:#7d97ff（hover #8aa3ff），比 --accent\n         (#97B1F0) 更蓝更亮，换配色主题时这一处不跟\n   改成：var(--accent)\n   为什么：主色是唯一允许的强调色，写死的蓝一旦换主题就露馅；上面一条\n           已经把 background-image 关掉了，正好一起换成 token。 */\n\n\n/* ── 09 · 开关命中区 40×24，差 4px ────────────────────────────────────\n   现在：桌面命中区 24px 高\n   改成：加一层 inset:-4px 的透明 ::before，命中区 48×32\n   为什么：硬规格要求开关桌面命中区 ≥28。视觉尺寸不动（24px 好看），\n           只把可点区域撑到 32，鼠标擦边也能点上。 */\n.setbody .sw{position:relative}\n.setbody .sw::before{content:\"\";position:absolute;inset:-4px;border-radius:999px}\n\n\n/* ── 10 · 分段控件：内边距 3px、字 12.5 都在规格外 ────────────────────\n   现在：.seg padding 3px；.seg span padding 6px 14px、font-size 12.5px\n         → 实测整体 43px 高（4 + 35 + 4），把整行顶到 67px\n   改成：整体定高 40px（4 + 32 + 4），块内 6px 12px、12px 字\n   为什么：3px 贴不住 4 网格；12.5 是台阶外的第四种字号（全页还有\n           13 / 13.5 / 11.5 / 10.5 四种，一起收）。12px 下「跟随系统」\n           仍一行放得下（实测该段最宽 84px，栏宽 128px）。\n   注：显式 height 是必须的 —— 段落高度靠 padding + 行高乘出来是 43，\n       而 .field 只给了 min-height:64，43 > 40 就会把那一行撑到 67。\n       32 = 40 - 上下各 4，是能落在 64 行里的最大档。 */\n.setbody .seg{height:40px;padding:4px;align-items:center}\n.setbody .seg span{\n  height:32px;display:inline-flex;align-items:center;\n  padding:0 12px;font-size:12px;font-weight:500;line-height:1;\n}\n\n\n/* ── 11 · 缩放步进器：CSS 写的是 button/span，HTML 里是 i/b ───────────\n   现在：.stepper button{24×24 圆} 和 .stepper span{12.5px} 全打不中，\n         −/+ 是裸的 <i>（默认斜体）、100% 是 <b>（默认 700 粗体）\n   改成：整体定高 40px，i 做 30×30 圆底 + hover，b 用 500 字重\n   为什么：斜体减号 + 700 粗的百分比，是全页唯一一处斜体和唯一一处\n           700 字重（规格只允许 400/500/600）。24px 命中区也不够。\n   注：圆底取 30 不是 32 —— 这颗胶囊自带 1px 描边，4 + 32 + 4 + 2 = 42\n       会把那一行顶到 66；30 是能同时满足「40 高」「4 网格」「命中区\n       ≥28」三个条件的最大值。 */\n.setbody .stepper{height:40px;padding:4px;gap:12px;align-items:center}\n.setbody .stepper i{\n  width:30px;height:30px;border-radius:999px;display:inline-flex;\n  align-items:center;justify-content:center;font-style:normal;line-height:1;\n  background:rgba(var(--w),.06);color:var(--fg2);cursor:pointer;font-size:14px;\n  transition:background .16s cubic-bezier(.22,.9,.18,1),color .16s cubic-bezier(.22,.9,.18,1);\n}\n.setbody .stepper i:hover{background:rgba(var(--w),.12);color:var(--fg)}\n.setbody .stepper b{font-size:14px;font-weight:500;min-width:44px;text-align:center;font-variant-numeric:tabular-nums;line-height:1}\n\n\n/* ── 12 · 主题色板：命中区 22px、标签 10.5px、间距 10px ───────────────\n   现在：.sw2 i 22×22，.sw2 字 10.5px、gap 5px；.swatches gap 10px；\n         color input 只有 22×22\n   改成：色圆 24×24、字 11px、gap 4px、色板列间距 8px，color input 撑满\n   为什么：22px 的命中区加上下面 10.5px 的标签，整块才 40px 高，但真正\n           能点的只有那个 22px 的圆；「自定义」那个 label 里的 input 也\n           只盖住圆本身。撑满之后点标签文字也能选色，命中区 44×44。\n           10.5px 是字阶外的最小号，和 .kgh 一起并到 11。\n   注：.sw2 的 line-height 收到 1 —— 色圆 + 标签这一块的高度是\n       24 + 4 + 11，行高按 1.55 算会多出 6px，把这一行顶到 70，成了\n       全页唯一一个不是 64 的行。\n   注：min-width:36 是给标签的（不是给圆的）。色圆只有 24 宽，而 11px\n       的「自定义」三个字要 33px，7 个色板挤在 218px 里时标签会互相\n       咬住（实拍 3x 放大后相邻两个字只隔 2~3px）。整块仍然右缘对齐\n       1254，只是往左多占 82px —— 这一行左侧从 466 到 1030 全是空的，\n       有的是地方。 */\n.setbody .swatches{gap:8px;align-items:flex-start}\n.setbody .sw2{gap:4px;font-size:11px;line-height:1;min-width:36px}\n.setbody .sw2 i{width:24px;height:24px}\n.setbody .sw2 input[type=\"color\"]{inset:0;width:100%;height:100%;opacity:0;cursor:pointer}\n.setbody .sw2:hover i{box-shadow:inset 0 0 0 1px rgba(var(--accent-rgb),.55)}\n.setbody .sw2:hover span{color:var(--fg2)}\n.setbody .sw2.on i{box-shadow:0 0 0 2px var(--bg-bottom),0 0 0 3.5px var(--accent)}\n\n\n/* ── 13 · 字号预览框只到 x=1030，右边 220px 空着 ─────────────────────\n   现在：.fprev 是 .field 网格里的第三个子元素，自动掉进第 1 列\n         （minmax(0,1fr)），从 402 到 1030，卡片内容右缘是 1254\n   改成：grid-column:1/-1 跨两列，margin-top 12、padding 16、圆角 14\n   为什么：它是「字号」这一行的结果预览，缩在左半栏会让人以为属于\n           左上那块；跨满整行才对得上\"预览\"的身份。10/14/16/6 的\n           老内边距也一并归到 4 网格。 */\n.setbody .group .field .fprev{\n  grid-column:1/-1;margin-top:12px;padding:16px;border-radius:14px;gap:8px;\n}\n\n\n/* ── 14 · 预览框里的两行字没有任何样式：.f1/.f2 打不中 ─────────────────\n   现在：CSS 写的是 .fprev .en1 / .zh1，HTML 里是 <div class=\"f1\"> 和\n         <div class=\"f2\"> —— 两条规则从来没生效，两行都是 13.5px 灰白\n   改成：.f1 16px（跟 --read-scale 走）、.f2 12px\n   为什么：这一块存在的唯一目的就是演示\"字号\"设置，结果不管选小/大/\n           特大，预览框一个字都不变。绑上 var(--read-scale) 之后才真的\n           预览得出来。 */\n.setbody .fprev .f1{font-size:calc(16px * var(--read-scale));color:var(--fg);line-height:1.5}\n.setbody .fprev .f2{font-size:calc(12px * var(--read-scale));color:var(--fg2);line-height:1.6}\n\n\n/* ── 15 · 折叠行文字比同列标签右移 2px，行高 48 却用 14px 撑 ──────────\n   现在：.foldrow padding 14px 2px、gap 10px（接口段 4 行 + 快捷键末行），\n         2px 是手写残留，14/10 都不在 4 网格上\n   改成：padding 0 + 定高 48px + gap 8px、字号 14\n   为什么：实拍 接口段 折叠行文字左缘 404，而同段的 .field 标签左缘\n           402，差 2px；一组一行跳 2px 比整体错位更刺眼。高度正好回到\n           它原来的 48（14+19+14+1border），这一档本来就是 4 的倍数，\n           只是靠 padding 撑出来的，字体一换就散。 */\n.setbody .group .foldrow{padding:0;min-height:48px;gap:8px;font-size:14px}\n.setbody .group .foldrow .fsum{\n  font-size:12px;min-width:0;max-width:52%;\n  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;\n}\n\n\n/* ── 16 · 折叠行右侧画了两个 ›（HTML 一个 + ::after 一个） ─────────────\n   现在：.chev::after{content:\"›\"} 叠在 <span class=\"chev\">›</span> 上\n   改成：content:none，箭头交给 .chev 自己；hover 右移 2px\n   为什么：实拍 \"…不填 key 也能用 ››\" —— 双箭头，读起来像「再展开两层」。\n           顺手给箭头加 2px 位移，折叠行才有\"点开\"的手感。 */\n.setbody .chev{color:var(--fg3);font-size:14px;line-height:1;margin-left:8px;\n  transition:transform .16s cubic-bezier(.22,.9,.18,1),color .16s}\n.setbody .chev::after{content:none}\n.setbody .group .foldrow:hover .chev{color:var(--accent);transform:translateX(2px)}\n\n\n/* ── 17 · 三张当前值卡片：圆角 12、内边距 14、字号 11.5 ───────────────\n   现在：.ncard padding 14px / radius 12px；.nt 与 .nu 都 11.5px\n   改成：16px / 14px / 11px & 12px\n   为什么：卡片是小一号的容器，圆角却比这页的 .group 还大一号才乱；14\n           与卡片外框同族。.nt（大模型）和 .nu（跟随会话 · 温度 0.7）\n           原来同号同色，只能靠位置分主次 —— 拉开到 11 / 12。 */\n.setbody .ncard{padding:16px;border-radius:14px}\n.setbody .nt{font-size:11px}\n.setbody .nu{font-size:12px;margin-top:4px;\n  display:block;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;\n}\n\n\n/* ── 18 · 「给它哪些手」8 行：标签选择器 .pl 是死的 ───────────────────\n   现在：CSS 写 .perm .pl，HTML 里是裸 <span> → 字号颜色全没生效，\n         继承成 13.5px 的 --fg（比 .field 的 13 还亮）；行高 43\n   改成：> span:first-child 14px / --fg2；定高 44px + hover 底\n   为什么：这 8 行是\"设置项\"，比隔壁按钮行的 14px 粗体标签还亮，等于\n           把从属关系颠倒。改成 --fg2 的常规字重，让它读起来是\"一列\n           可开关的条目\"。44 是这一档（9+25+9 加 1px 分隔线 = 43）最近\n           的 4 的倍数，也是桌面行可点的最小舒适高度。\n   注：mono 工具名和中文名在同一个 span 里，CSS 拆不开，只能整行同色。 */\n.setbody .perm{padding:0;min-height:44px;border-radius:6px}\n.setbody .perm > span:first-child{\n  font-size:14px;color:var(--fg2);min-width:0;\n  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;\n}\n.setbody .perm:hover{background:rgba(var(--w),.03)}\n.setbody .perm:hover > span:first-child{color:var(--fg)}\n\n\n/* ── 19 · 快捷键两栏：栏间距 20px，左栏键帽快贴上右栏文字 ─────────────\n   现在：.kgroups gap 6px 34px —— 34 是列间距，但左栏 .krow 内 .kb 是\n         靠 margin-left:auto 顶到栏尾，实测左栏键帽右缘 797、右栏文字\n         左缘 818，视觉间距只剩 21px\n   改成：gap 8px 32px\n   为什么：两栏 21px 的缝跟栏内 12px 的缝差不多，眼睛分不清\"这一行\n           到哪结束\"；32px 才把两栏分开。8/32 都在 4 网格上。 */\n.setbody .kgroups{gap:8px 32px}\n.setbody .kgrp{padding:8px 0}\n.setbody .kgh{padding:4px 0 8px;font-size:11px}\n.setbody .kgh .mut{font-size:11px;color:var(--fg3);font-variant-numeric:tabular-nums}\n\n\n/* ── 20 · 快捷键每行的标签选择器 .lab 是死的，长标签没有省略号 ─────────\n   现在：.krow .lab{…ellipsis} 打不中裸 <span> → 长标签（搁置（今天不再\n         出现，明天自动回来））既没有 nowrap 也没有省略号，靠运气不换行\n   改成：> span:first-child 12px + nowrap + ellipsis；整行定高 44px\n   为什么：全页最长的三条标签都在这一栏，宽度一收就换行，把两栏的\n           行对齐整个带歪。12px 是这里唯一能保住\"一行一条\"的档位：\n           实测该标签现在已占 333px，可用宽度只有 343px，14px 会需要\n           373px 直接被截。\n   顺带：行 hover 只改键帽边框、文字不动，光标扫过去只有右边 40px 有\n         反应；标签一起提亮才是\"整行可点\"。行高 9+20+9+1border = 39\n         不在网格上，定高 44 后两栏的行能对上同一把尺子。 */\n.setbody .krow{padding:0;min-height:44px;align-items:center}\n.setbody .krow > span:first-child{\n  font-size:12px;color:var(--fg2);min-width:0;\n  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;\n}\n.setbody .krow:hover > span:first-child{color:var(--fg)}\n\n\n/* ── 21 · 键帽：圆角 5/7、字 11.5 ─────────────────────────────────────\n   现在：.krow .kb radius 7px、font 11.5px；.kbd radius 5px\n   改成：6px / 11px\n   为什么：5 和 7 是两个规格外圆角，而全站最小的圆角档位就是 6（--r-xs）。\n           11.5 是台阶外字号，键帽本来就该是最小的一档，落 11。 */\n.setbody .krow .kb{border-radius:6px;font-size:11px;padding:2px 8px;min-height:22px}\n.setbody .kbd{border-radius:6px;font-size:11px;padding:2px 6px}\n\n\n/* ── 22 · 「点键位直接按新键，Esc 取消」这句唯一说明被撤掉了 ───────────\n   现在：.setbody .group .keyhint{display:none}（密度层统一撤小字）\n   改成：恢复，12px / --fg3\n   为什么：快捷键这页最需要一句话告诉人\"键帽是可以点着改的\"，撤掉之后\n           只能靠猜。它不在密度该牺牲的范围内 —— 一行说明换来整块可\n           操作性。 */\n.setbody .group .keyhint{display:block;font-size:12px;color:var(--fg3);margin-top:12px;line-height:1.6}\n\n\n/* ── 23 · 最后那个 ＋ 是个 30px 的胶囊，不是图标按钮 ──────────────────\n   现在：.plus padding 7px 12px + 12.5px 字 → 高 30px、宽 33px，\n         7px 不在网格上，形状是横胶囊\n   改成：32×32 正圆\n   为什么：它在这一行是纯图标（内容只有一个 ＋），横胶囊会让它跟左边的\n           文字黏成一句；32 也是硬规格里图标按钮的尺寸。 */\n.setbody .plus{\n  width:32px;height:32px;padding:0;border-radius:999px;\n  display:inline-flex;align-items:center;justify-content:center;\n  font-size:14px;line-height:1;\n}\n\n\n/* ── 24 · 危险操作和备份/恢复长得一模一样（最严重的一条） ─────────────\n   现在：HTML 写了两个类 `<div class=\"lab danger\">` 和\n         `<button class=\"btn ghost danger\">`，但 app.css 里 .lab.danger /\n         .btn.danger / .btn.ghost.danger 一个规则都没有 → 重置数据那行\n         的字色、按钮、边框跟「备份」「恢复」完全相同\n   改成：标签用 --danger、按钮用 --danger 描边 + 8% 底、hover 上实底\n   为什么：整页只有这一个动作会删光账本/素材/音频，却排在最后一行、\n           长得跟前一行\"导入/导出\"一样。红字 + 红边是唯一在暗底上\n           能一眼分出\"这个别按\"的做法，而且只用现有 --danger token，\n           不引入新色相。 */\n.setbody .group .field .lab.danger{color:var(--danger);font-weight:600}\n.setbody .group .field .lab.danger:first-child{color:var(--danger)}\n.setbody .btn.ghost.danger{\n  color:var(--danger);\n  border-color:rgba(230,144,137,.42);\n  background:rgba(230,144,137,.08);\n}\n.setbody .btn.ghost.danger:hover{\n  color:var(--danger);\n  border-color:var(--danger);\n  background:var(--danger-cont);\n}\n.setbody .btn.ghost.danger:active{background:rgba(230,144,137,.24)}\n\n\n/* ── 25 · 「删除不可撤销 —— 先做一次备份」这行被密度层撤掉了 ───────────\n   现在：.field .desc 一律 display:none，包括重置数据那行的警告\n   改成：只给危险行放回来，12px / --danger 82%\n   为什么：全页唯一一句\"不可撤销\"就在这行 desc 里。危险操作既没有视觉\n           区分、也没有文字警告，等于把最该说的一句话按住了。其余行\n           的 desc 继续按密度策略收着，只有这一条例外。 */\n.setbody .group .field .lab.danger + .desc{\n  display:block;font-size:12px;line-height:1.6;\n  color:var(--danger);color:color-mix(in srgb,var(--danger) 82%,transparent);\n  margin-top:4px;max-width:60ch;\n}\n\n\n/* ── 26 · 「已连 / 正常 / 开着」是绿的 ────────────────────────────────\n   现在：.badge-ok 用 --s-green 字 + 绿点 + 绿光晕（通用·通知、接口·\n         连通性、智能体·已连 三处）\n   改成：文字 --fg2、圆点用 --accent + 主色光晕\n   为什么：硬规格只留 1 主色 + 1 警示 + 5 级中性，绿色不在里面。这三处\n           都是\"状态正常\"，用主色点比绿色更贴这套配色，也不会跟警示\n           红打架。 */\n.setbody .badge-ok{color:var(--fg2);font-size:12px;gap:8px}\n.setbody .badge-ok::before{\n  background:var(--accent);box-shadow:0 0 0 3px rgba(var(--accent-rgb),.16);\n}\n.setbody .badge-ok i{display:none}\n\n\n/* ── 27 · 按钮：13.5px 是台阶外字号，高度没定死 ───────────────────────\n   现在：.btn font-size 13.5px、padding 9px 18px（高度 ≈40.6px，小数）\n   改成：14px、height 40px、padding 0 18px\n   为什么：13.5 让全页出现第四种字号；高度靠 padding 撑出来是 40.6，\n           .field 定高 64 之后这 0.6px 会让分隔线落在半像素上。\n           .btn.sm 一并从 28 提到 32（图标按钮按 32 走）。 */\n.setbody .btn{font-size:14px;height:40px;padding:0 18px;line-height:1}\n.setbody .btn.sm{height:32px;padding:0 12px;font-size:12px}\n\n\n/* ── 28 · 键盘可达：按钮/链接/折叠行一个焦点环都没有 ──────────────────\n   现在：全站只有 .pickbtn / .sw / .drow / #animToggle 有 :focus-visible，\n         Tab 走到按钮、侧栏链接、折叠行时屏幕上什么都不变\n   改成：统一 2px 主色环 + 2px offset\n   为什么：硬规格要求 Tab 可达且焦点环可见。.seg span / .krow / .sw2 是\n           <span>/<div>，CSS 救不了（要改模板加 tabindex），这里把能\n           聚焦的补齐：a、button、.foldrow、.btn、.sw、.stepper i 的父级。 */\n.setnav a:focus-visible,\n.setbody .btn:focus-visible,\n.setbody .group .foldrow:focus-visible,\n.setbody .stepper i:focus-visible,\n.setbody .sw:focus-visible,\n.setbody .ksearch:focus-visible{\n  outline:2px solid var(--accent);outline-offset:2px;\n}\n\n\n/* ── 29 · 快捷键搜索框：圆角 10→999、内边距 9/13、比旁边的按钮矮 7px ──\n   现在：.ksearch 两处定义打架（903 行 radius 10px，1190 行 radius 999px\n         胜出），padding 9px 13px → 实测 33px 高，同一行右边「恢复默认」\n         按钮 40px\n   改成：定高 40px、左右 12px、gap 8、字号 12\n   为什么：9/13 都不在 4 网格上；33 与 40 并排，上缘各差 3.5px，扫描线\n           是断的。定高 40 之后这一行整行高 60（模板里这行有 inline\n           padding:12px 0 6px，CSS 压不过 inline，见收尾备注）。 */\n.setbody .ksearch{height:40px;box-sizing:border-box;padding:0 12px;gap:8px;font-size:12px}\n\n\n/* ── 30 · 断点：这一页在 1024 / 900 下不塌，侧栏硬吃 190px ────────────\n   现在：.setwrap 的 grid-template-columns 没有任何 @media 覆盖（全文件\n         搜不到），1440 之外一律 192px + 剩余\n   改成：≤1100px 单栏，导航改成横向胶囊条、取消 sticky\n   为什么：900 宽实拍时卡片只剩 611px，主题配色那行 7 个色圆挤到边缘；\n           而侧栏是 12 项竖排 + sticky，在 768 高的屏上会被视口切掉最后\n           两项（数据/关于），滚到顶也点不到。横向条把它变回一行，\n           .glab 分组标题在窄屏隐藏（分组靠顺序仍然成立）。\n   注：1540 行以后才是「改成」的样子，1440 宽的截图不受影响。 */\n@media (max-width:1100px){\n  .setwrap{grid-template-columns:minmax(0,1fr);gap:16px}\n  .setnav{position:static;flex-direction:row;flex-wrap:wrap;gap:4px;padding:0 0 4px}\n  .setnav .glab{display:none}\n  .setnav a{height:32px;border-radius:999px;padding:0 12px}\n  .setnav a.on::before{display:none}\n  .setbody .group .field{min-height:56px}\n}\n\n\n/* ── 31 · 动效收口：新增的过渡全部走 160ms，尊重 reduced-motion ─────── */\n@media (prefers-reduced-motion:reduce){\n  .setnav a,.setbody .stepper i,.setbody .chev,\n  .setbody .sw2 i,.setbody .perm{transition:none}\n  .setbody .group .foldrow:hover .chev{transform:none}\n}\n\n\n/* ── 32 · 能点的 chip 只有 22px 高；关着的开关没有边框 ────────────────\n   现在：.chip 定高 22（工具段的「出声」「先进草稿」、智能体段的「改配置·\n         自动存」都是能点的状态开关），命中区只有 22px；关着的开关是\n         一层 rgba(w,.14) 的底，在卡片 1.7:1 的底色上几乎看不见轮廓\n   改成：chip 用 inset:-5px 的透明 ::after 把命中区撑到 32；\n         .sw:not(.on) 补 1px 内描边 + 底色提到 .16\n   为什么：硬规格：桌面命中区 ≥28。视觉高度不动（22 的胶囊在这页刚好），\n           只把可点区域撑到 32。开关的\"关\"态如果连轮廓都没有，用户只\n           能靠\"没有蓝色\"推断它在关 —— 补一圈内描边是这套玻璃底上\n           画边界的统一做法（.btn / .inp 都是 inset 描边）。\n   注：.chip 是 <span>，进不了 Tab 序列；命中区只管鼠标（见收尾备注）。\n   注：选择器必须带 :not(.on)，否则 .setbody .sw 会和 .sw.on 同权重、\n        且在文件里更靠后，把 ON 态的蓝色底一起盖成灰的。 */\n.setbody .chip{position:relative}\n.setbody .chip::after{content:\"\";position:absolute;inset:-5px;border-radius:999px}\n.setbody .sw:not(.on){\n  background-color:rgba(var(--w),.16);\n  background-image:none;\n  box-shadow:inset 0 0 0 1px rgba(var(--w),.10);\n}\n\n\n/* ── 33 · 列表末尾那行没有任何\"到底了\"的信号 ──────────────────────────\n   现在：快捷键段最后一行「没有你想要的快捷键？」用的是和上面 27 行\n         一样的 1px 实线，看起来还是\"下一行\"\n   改成：紧跟 .keyhint 的那条 .foldrow 换成虚线 + --fg3\n   为什么：POLISH §2.7 说整站基本没有空态。这一页 HTML 里唯一允许做\n           \"列表结束\"的地方就是这行，虚线是\"边界\"的通用语汇，实线会被\n           读成\"还有下一行\"。真要做空态（一条快捷键都没有时）得改模板，\n           见收尾备注。 */\n.setbody .group .keyhint + .foldrow{\n  border-top:1px dashed rgba(var(--w),.14);color:var(--fg3);margin-top:8px;\n}\n.setbody .group .keyhint + .foldrow:hover{color:var(--accent)}\n\n\n/* ════════════════════════════════════════════════════════════════════\n   收尾备注\n   1. 只覆盖，没动 app.css / gen.mjs / 分组顺序，也没改 HTML。\n   2. 五条「CSS 救不了」留给模板层：\n      · .seg span 是 <span>、.krow 是 <div>、.sw2 是 <div>、.chip 是\n        <span> —— 键盘不可达，要加 tabindex=\"0\" + role 才能进 Tab 序列；\n      · .perm 的「中文名 · 工具名」挤在同一个 span 里，没法把工具名做成\n        等宽小字，要拆成两个 span；\n      · 快捷键搜索框 .ksearch 本身就是个 <span>，现在只当占位，真要能搜\n        得换成 <input>，同时把那行的 inline `padding:12px 0 6px` 删掉\n        （inline 样式优先级高于任何选择器，那行永远是 60 而不是 64）；\n      · 「最近动过什么」只有\"有记录\"这一种画法，没有一条记录时整块会\n        塌成一行空 label —— 空态要模板给一个 `<div class=\"empty\">`；\n      · 通用段「其他语言（未做）」和它右边那个「未做」chip 说的是同一句\n        话（seg 自己已经带了括号说明），chip 该删。\n   3. 开关的双旋钮（.sw i + .sw::after）是全局问题，这里按 .setbody 收窄；\n      要修全站得把 app.css:555 的 .sw i 直接删掉。\n   4. 所有数字都在 1440×900 实拍上量过；验证方法是不改 app.css，只在\n      mock 页的 app.css 之后加一行 link 指向本文件再截图。\n   ════════════════════════════════════════════════════════════════════ */\n\n/* ══════════════════════════════════════════════════════════════════════════\n   v-faces.css · 五面（听 / 说 / 读 / 写 / 改）+ 教程 —— 节奏对齐覆盖\n   ─────────────────────────────────────────────────────────────────────────\n   只用一种方式加载：接在 app.css 后面\n\n     <link rel=\"stylesheet\" href=\"./app.css\">\n     <link rel=\"stylesheet\" href=\"./v-faces.css\">   ← 后加载，同权重即覆盖\n\n   作用域只有两处，别的地方一个像素都不动：\n     main.screen:has(>.strip)   = 五个练习面（靠顶部 strip 认页）\n     main.screen:has(.docwrap)  = 教程（靠 docwrap 认页）\n   卡片页(.screen.half) / 工厂 / 统计 / 设置 完全不碰。\n\n   这套文件的依据是 1440×900 无头 Chrome 实测的 getBoundingClientRect +\n   getComputedStyle（见 faces-report.md 的一致性对照表），不是看图形容。\n\n   每条都写成三句：现在 → 改成 → 为什么。\n   ══════════════════════════════════════════════════════════════════════════ */\n\n\n/* ══ 0 · 尺子 ═════════════════════════════════════════════════════════════\n   五个面本来各写各的宽度，先把尺子立成变量，后面所有规则只引用变量。\n   列宽取 560 / 720 两档：560 是「操作列」（图、写框、按钮组），\n   720 是「阅读列」（整句英文）。都落在 4 的倍数上，也是 560+80×2 的常见版心。 */\n\nmain.screen:has(>.strip),\nmain.screen:has(.docwrap){\n  --f-col:560px;      /* 操作列：图 / 写框 / 按钮组 / 答案块 */\n  --f-read:720px;     /* 阅读列：整句英文 / 教程正文 */\n  --f-btn:40px;       /* 按钮统一高度：命中区 ≥28 的规格之上，留出一点呼吸 */\n  --f-btn-min:104px;  /* 右下角主按钮的槽宽：五个面 + 教程都同宽 */\n  --f-radius:14px;    /* 圆角只留 6 / 14 / 999 三档 */\n  --f-fast:160ms;     /* 悬停 / 按下 */\n  --f-slow:420ms;     /* 展开 */\n}\n\n/* R01 · 现在 .screen{gap:22px}（22 不是 4 的倍数） → 改成 24 → 为什么\n   整页的竖节奏就靠这一个 gap，不是倍数的话 4px 网格在拼图时永远差 2。 */\nmain.screen:has(>.strip),\nmain.screen:has(.docwrap){ gap:24px; }\n\n\n/* ══ 1 · 五面共用：顶部 strip（这一条五个面本来就一致，只做规格收口） ═══ */\n\n/* R02 · 现在 .strip{padding:14px 0 10px}（14 / 10 都不在 4 网格上） → 改成 12px 0\n   → 为什么 12+52+12 仍然等于原来的 76px 高，视觉零位移，但两个数都合规。 */\nmain.screen:has(>.strip) .strip{ padding:12px 0; }\n\n/* R03 · 现在 .strip{gap:14px} → 改成 12 → 为什么 同一个 4 网格。 */\nmain.screen:has(>.strip) .strip{ gap:12px; }\n\n/* R04 · 现在 .strip .crumb 11.5px / .wchip 11px / .f5row .fi 11.5px\n   → 改成一律 12 → 为什么 字阶只留 11/12/14/16/20/24/28，11.5 这种半档\n   在同一行里和 12 抢，看起来是「没对齐」而不是「层级不同」。 */\nmain.screen:has(>.strip) .strip .crumb,\nmain.screen:has(>.strip) .strip .f5row .fi{ font-size:12px; }\nmain.screen:has(>.strip) .strip .wchip{ font-size:12px; }\n\n/* R05 · 现在 .wchip 高 21.4px，是 strip 里唯一可点的东西 → 改成 28px 高\n   → 为什么 命中区规格 ≥28；21 的胶囊在触屏上基本点不中。\n   宽度不动、圆角仍是 999，视觉上只是上下多出 3px。 */\nmain.screen:has(>.strip) .strip .wchip{ height:28px; padding:0 12px; }\n\n/* R06 · 现在 .track / .wave i 圆角 99px → 改成 999 → 为什么 圆角只留 6/14/999。 */\nmain.screen:has(>.strip) .strip .track,\nmain.screen:has(>.strip) .strip .track i,\nmain.screen:has(>.strip) .wave i{ border-radius:999px; }\n\n\n/* ══ 2 · 五面共用：舞台 —— 本轮最大的一条 ══════════════════════════════ */\n\n/* R07 · 现在 .stage{justify-content:center; padding:24px 0 10px}，标题行跟着内容\n   在屏幕中间浮：实测标题行 y = 听 371.9 / 说 190.1 / 读 355.9 / 写 204.9 / 改 328.1。\n   → 改成 justify-content:flex-start + padding:24px 0 8px\n   → 为什么 切一个面标题就上下跳 180px，这五个面就没法当成「同一句话的五个面」。\n   改成从固定位置起排之后，五页标题行都落在 y≈208，只有下面的内容在换。 */\nmain.screen:has(>.strip) .stage{\n  justify-content:flex-start;\n  padding:24px 0 8px;\n  gap:16px;\n}\n\n/* R08 · 现在 .stage 内容超出时溢出到底部操作条上（.stage{overflow:visible} 是\n   app.css 里为塞进一屏故意写死的） → 改成 overflow-y:auto + min-height:0\n   → 为什么 展开「看画面 / 对答案」后答案块比舞台高，实测写面展开时内容会压到\n   actbar 上；改成舞台内部滚动，actbar 永远在自己那一格。 */\nmain.screen:has(>.strip) .stage{\n  min-height:0;\n  overflow-y:auto;\n  overscroll-behavior:contain;\n  scrollbar-width:thin;\n}\n\n/* R37 · 现在 .screen:has(>.strip){min-height:calc(100vh - 96px)} 只有下限没有上限，\n   于是内容最多的「说」把整列撑高：实测 stage 605、actbar 掉到 y813，整页 915 出现滚动条，\n   而其余四面 actbar 停在 778。→ 改成 补一个同值的 max-height + 舞台 flex:1 1 0\n   → 为什么 底部操作条必须钉在同一行；「说」比「听」多一个大圆按钮和一行提示，\n   多出来的高度应该由舞台内部消化，不该把整列和操作条一起推下去。 */\nmain.screen:has(>.strip){\n  max-height:calc(100vh - 96px);\n}\nmain.screen:has(>.strip) .stage{\n  flex:1 1 0;\n}\n\n/* R09 · 现在 .stage 的直接子元素是 shrink-to-fit（align-items:center 的副作用），\n   答案块里的图片被压到 150px 宽（实测 listen 答案图 150.1×111.1）。\n   → 改成 答案块定宽 = 操作列 560\n   → 为什么 「看答案」是这个页面的第二主角，现在缩成缩略图大小，等于答案不给看。 */\nmain.screen:has(>.strip) .stage > .reveal{\n  width:var(--f-col);\n  max-width:100%;\n  align-self:center;\n}\nmain.screen:has(>.strip) .stage > .reveal > div{ width:100%; }\n\n/* R10 · 现在 说/写两页的场面图 560×342，听/读的答案图只有 150 宽\n   → 改成 图一律 560 宽 → 为什么 同一个场面在四个页面里必须同一个尺寸，\n   否则切面的时候「看图」这件事的两个面看起来不是一件事。 */\nmain.screen:has(>.strip) .stage > img.shot,\nmain.screen:has(>.strip) .reveal img.shot{\n  width:var(--f-col);\n  max-width:100%;\n  border-radius:var(--f-radius);\n}\n\n/* R11 · 现在 .writein{width:min(100%,560px)} 却被父级 .row 收缩，\n   实测三种宽度：听 388.5 / 读 388.5 / 说 416.1 / 写 560。\n   → 改成 输入行与单输入框都定宽 560，输入框吃满剩余宽度\n   → 为什么 同一套「写一句」的动作，四个页面四个宽度，是最显眼的不一致。 */\nmain.screen:has(>.strip) .stage > .row:has(> input),\nmain.screen:has(>.strip) .stage > input.writein{\n  width:var(--f-col);\n  max-width:100%;\n  gap:8px;              /* 原来行内 gap:10px 不在 4 网格上 */\n  justify-content:center;\n}\nmain.screen:has(>.strip) .stage > .row:has(> input) .writein{\n  flex:1 1 auto;\n  width:auto;\n  min-width:0;\n}\n\n/* R12 · 现在 .inp / .writein 圆角 10px、高 46px → 改成 14px / 44px\n   → 为什么 圆角只留 6/14/999；46 不在 4 网格上。 */\nmain.screen:has(>.strip) .writein{\n  border-radius:var(--f-radius);\n  height:44px;\n  font-size:14px;\n}\n\n/* R13 · 现在 写框的过渡是 .2s → 改成 160ms → 为什么 悬停/按下规格 120–180ms。 */\nmain.screen:has(>.strip) .writein{\n  transition:border-color var(--f-fast) ease, background var(--f-fast) ease;\n}\n\n/* R14 · 现在 句子字级三档：读 26 / 改 22 / 听·说·写的答案 19（全是内联 style）\n   → 改成 主句 24、答案句 20，宽一律 720\n   → 为什么 26 和 22 都在字阶之外；同一句英文在五个面之间大跳，读者会以为\n   换了内容。24 是「主句」，20 是「核对用」。内联 style 必须 !important 才盖得住。 */\nmain.screen:has(>.strip) .stage > .cue{\n  font-size:24px !important;\n  line-height:1.5 !important;\n  max-width:var(--f-read) !important;\n  width:100%;\n  font-weight:400;\n}\nmain.screen:has(>.strip) .stage .reveal .cue{\n  font-size:20px !important;\n  line-height:1.6 !important;\n  max-width:var(--f-read) !important;\n  width:100%;\n}\n\n/* R15 · 现在 改面把替换词写成 <b style=\"...\">，字重 700 → 改成 600\n   → 为什么 字重只有 400/500/600；700 在一屏里像标题。 */\nmain.screen:has(>.strip) .cue b{ font-weight:600 !important; }\n\n/* R16 · 现在 .defn 是 max-width:820 内联 + 句子 19px 内联 + .mut 15px\n   → 改成 宽 560（操作列），句子 20px，注 14px → 为什么 它是「改完是这样」的\n   预览块，属于答案区，跟操作列同宽；15px 不在字阶上。 */\nmain.screen:has(>.strip) .stage > .defn{\n  width:var(--f-col);\n  max-width:100% !important;\n  border-left-width:2px;\n  padding:8px 0 8px 16px;\n}\nmain.screen:has(>.strip) .defn > p{ font-size:20px !important; line-height:1.5; }\nmain.screen:has(>.strip) .defn > p.mut{ font-size:14px !important; line-height:1.6; margin-top:8px; }\n\n/* R17 · 现在 .chip 高 22px，而改面的换词胶囊是主要操作 → 改成 28px / 12px\n   → 为什么 命中区 ≥28；22 的胶囊在触屏上点不中，而且 11px 的字在 22 的胶囊里\n   上下几乎贴边。只改舞台里的 chip，工厂/卡片的 chip 不动。 */\nmain.screen:has(>.strip) .stage .chip{\n  height:28px;\n  padding:0 12px;\n  font-size:12px;\n  border-radius:999px;\n  gap:8px;\n}\n\n\n/* ══ 3 · 五面共用：按钮与底部操作条 ═══════════════════════════════════ */\n\n/* R18 · 现在 按钮字 13.5px、内边距 9/18、高度 38.4~40.9，而 actbar 里\n   .actbar .btn 又把内边距压成 7/16（高 36.9） → 改成 全套统一 14px / 高 40\n   → 为什么 13.5 不在字阶上；同一栏里的按钮差 4px 高，右边缘就参差。 */\nmain.screen:has(>.strip) .btn,\nmain.screen:has(.docwrap) .btn{\n  font-size:14px;\n  height:var(--f-btn);\n  padding:0 16px;\n  border-radius:999px;\n  display:inline-flex;\n  align-items:center;\n  justify-content:center;\n  gap:8px;\n  line-height:1;\n  font-weight:600;\n  transition:background var(--f-fast) ease, color var(--f-fast) ease,\n             border-color var(--f-fast) ease, opacity var(--f-fast) ease,\n             transform 120ms ease, box-shadow var(--f-fast) ease;\n}\n\n/* R19 · 现在 .actbar{padding:9px 14px;gap:9px}（9 / 14 都不在网格上）\n   → 改成 8px 16px / gap 8 → 为什么 4 网格 + 左右内边距和 .strip 对齐。 */\nmain.screen:has(>.strip) .actbar{\n  padding:8px 16px;\n  gap:8px;\n}\n\n/* R20 · 现在 右下角主按钮宽 102（下一面）或 74.5（改面的「回卡片」）\n   → 改成 槽宽 104 → 为什么 五个面 + 教程的同一个位置应该是同一块面积，\n   否则「下一步在哪」每切一个面都要重新找。 */\nmain.screen:has(>.strip) .actbar > .btn.primary,\nmain.screen:has(.docwrap) .hdr .act .btn{\n  min-width:var(--f-btn-min);\n}\n\n/* R21 · 现在 教程页头部那个「回卡片」是 .hdr .btn.ghost{padding:8/16;font-size:12px}\n   （高 36.6，比 actbar 里的按钮矮一档） → 改成跟其他页 40 高 / 14px\n   → 为什么 同一个动作，教程里一种体格、改面里另一种。 */\nmain.screen:has(.docwrap) .hdr .btn.ghost{\n  padding:0 16px;\n  font-size:14px;\n  height:var(--f-btn);\n}\n\n/* R22 · 现在 .kbd 圆角 5px → 改成 6 → 为什么 圆角只留 6/14/999。 */\nmain.screen:has(>.strip) .kbd{ border-radius:6px; }\n\n\n/* ══ 4 · 五面共用：反馈节奏与命中区 ═══════════════════════════════════ */\n\n/* R23 · 现在 .shot:hover{transform:scale(1.01)} 过渡 .2s → 改成 160ms\n   → 为什么 悬停/按下 120–180ms；200ms 摸起来是「慢半拍」。 */\nmain.screen:has(>.strip) .shot{\n  transition:transform var(--f-fast) ease, box-shadow var(--f-fast) ease;\n}\n\n/* R24 · 现在 展开答案没有动画（details 原生直出） → 改成 420ms 淡入+上移 4px\n   → 为什么 展开规格 380–520ms；五个面里「看答案 / 对答案」是同一个反馈动作，\n   现在有的页面瞬开、有的页面带 .reveal 的箭头过渡，节奏不齐。 */\nmain.screen:has(>.strip) .reveal[open] > div{\n  animation:face-open var(--f-slow) cubic-bezier(.22,.61,.36,1) both;\n}\n@keyframes face-open{\n  from{opacity:0; transform:translateY(4px)}\n  to{opacity:1; transform:translateY(0)}\n}\n\n/* R25 · 现在 .q 是 16×16 的图标按钮 → 命中区只有 16 → 改成 视觉仍 16，\n   用伪元素把可点面积撑到 32 → 为什么 图标按钮规格 32px，但真去改宽度会把\n   标题行撑高；透明白边是唯一既不动布局又能点中的做法。 */\nmain.screen:has(>.strip) .q{ position:relative; border-radius:999px; }\nmain.screen:has(>.strip) .q::after{\n  content:\"\";\n  position:absolute;\n  inset:-8px;\n  border-radius:999px;\n}\n\n/* R26 · 现在 五个面的状态点：.fi.ok 是绿 #6BB76B、.fi.warn 是琥珀 #D4A558\n   → 改成 主色 / 警示色 → 为什么 配色只有 1 主 + 1 警示 + 中性，绿和琥珀都在禁令里；\n   app.css 后半段已经把这个口径用在 chip 上了，这五颗点漏掉了。 */\nmain.screen:has(>.strip) .f5row .fi.ok .pd{\n  background:var(--accent);\n  box-shadow:0 0 0 2px rgba(var(--accent-rgb),.18);\n}\nmain.screen:has(>.strip) .f5row .fi.warn .pd{\n  background:var(--danger);\n  box-shadow:0 0 0 2px rgba(230,144,137,.18);\n}\n\n\n/* ══ 5 · 教程 ═════════════════════════════════════════════════════════════\n   教程现在几乎没写过样式：h2 是浏览器默认的 1.5em（21px），p 的 margin 是\n   全局的 0，正文直接铺满 1108px。它不是「另一个设计」，是「没设计」。 */\n\n/* R27 · 现在 教程 h1 22px（全局 h1） → 改成 24 → 为什么 它是页面标题，\n   和卡片页的 .hdr h1 24 对齐；22 和正文的 21 挤在同一档。 */\nmain.screen:has(.docwrap) .hdr h1{ font-size:24px; line-height:1.3; }\n\n/* R28 · 现在 article.doc h2 = 浏览器默认 21px/600，和页标题 22 只差 1px\n   → 改成 20px + 32/8 的上下间距 → 为什么 章节标题必须明显小于页标题；\n   21 这个数根本不在字阶上（它只是 14×1.5）。 */\nmain.screen:has(.docwrap) .doc h2{\n  font-size:20px;\n  line-height:1.4;\n  letter-spacing:0;\n  margin:32px 0 8px;\n}\nmain.screen:has(.docwrap) .doc h2:first-child{ margin-top:0; }\n\n/* R29 · 现在 正文 720 才是可读行宽，实际是 1108（约 130 字符/行）\n   → 改成 max-width:720 → 为什么 这一页是拿来读的；720 也是五个面的阅读列，\n   教程和练习页因此共用同一个「一行字有多长」。 */\nmain.screen:has(.docwrap) .doc{ max-width:720px; }\n\n/* R30 · 现在 全局 p{margin:0}，段落之间零间距（实测上一段底边就是下一段顶边）\n   → 改成 段间 12px、行高 1.7 → 为什么 现在整篇是一堵字墙，段落边界只能靠\n   句号猜。1.7 只给正文，不改全局。 */\nmain.screen:has(.docwrap) .doc p{\n  margin:0 0 12px;\n  line-height:1.7;\n  font-size:14px;\n}\nmain.screen:has(.docwrap) .doc p:last-child{ margin-bottom:0; }\n\n/* R31 · 现在 教程里的 <b> 是 700 → 改成 600 → 为什么 字重只有 400/500/600。 */\nmain.screen:has(.docwrap) .doc b{ font-weight:600; color:var(--fg); }\n\n/* R32 · 现在 列表用浏览器默认（缩进 40、项间无距） → 改成 缩进 20、项间 8\n   → 为什么 五个面那一节全是 li，现在项与项粘在一起，读起来像一段。 */\nmain.screen:has(.docwrap) .doc ul{\n  margin:0 0 12px;\n  padding-left:20px;\n}\nmain.screen:has(.docwrap) .doc li{\n  margin:8px 0;\n  line-height:1.7;\n}\nmain.screen:has(.docwrap) .doc li::marker{ color:var(--ghost); }\n\n/* R33 · 现在 .docnav 的六个链接之间只有源码里的一个空格（实测间距 4px），\n   14px 主色，看起来像一长串字 → 改成 flex + gap 16、12px 次级色、悬停才亮\n   → 为什么 目录是导航不是正文；4px 间距点不中，也分不清是六个入口。 */\nmain.screen:has(.docwrap) .docnav{\n  display:flex;\n  flex-wrap:wrap;\n  gap:16px;\n  margin-bottom:24px;\n}\nmain.screen:has(.docwrap) .docnav a{\n  font-size:12px;\n  color:var(--fg3);\n  padding:4px 0;\n  transition:color var(--f-fast) ease;\n}\nmain.screen:has(.docwrap) .docnav a:hover{ color:var(--accent); }\n\n/* R34 · 现在 .doc .quote 就是一段普通 14px 文字 → 改成 左侧 2px 主色细线的\n   引文块（和改面的 .defn 同一个手感） → 为什么 「学习原则」那条是全文唯一的\n   引用，现在和正文一模一样，读者会当成正文读过去。 */\nmain.screen:has(.docwrap) .doc .quote{\n  border-left:2px solid var(--accent-cont);\n  padding:4px 0 4px 16px;\n  color:var(--fg2);\n}\n\n/* R35 · 现在 正文里的行内代码没有样式 → 改成 mono / 12px / 6 圆角浅底\n   → 为什么 隐私那节有一整条路径，跟正文同字体时会被读成句子。 */\nmain.screen:has(.docwrap) .doc code{\n  font-family:var(--mono);\n  font-size:12px;\n  color:var(--accent);\n  background:rgba(var(--accent-rgb),.12);\n  padding:4px 8px;\n  border-radius:6px;\n}\n\n/* R36 · 现在 教程页头的 .sub 12px 和正文 14px 贴得太近，且 hdr 没有下边距\n   → 改成 sub 12px + 段间 8 → 为什么 副标题是说明不是正文，隔 8 才分得开。 */\nmain.screen:has(.docwrap) .hdr .sub{ margin-top:8px; font-size:12px; }\n\n\n/* ══ 6 · 空态 / 载入态 / 错态 ═════════════════════════════════════════════\n   先说结论：这六个页面生成出来的 HTML 里没有任何空态/载入态/错态的标记\n   （六个文件里 class 含 empty/skel/load/err 的元素数 = 0）。\n   下面 A 组只靠属性，不需要动 gen.mjs；B 组需要 gen.mjs 多吐一个 div。\n   报告里第 3 节列了 B 组需要的标记。 */\n\n/* A1 · 载入中：给 .stage 加 aria-busy=\"true\" 即可（JS 一行）\n   现在 载入时页面就是全亮、写框能点，看起来像已经就绪\n   → 改成 舞台降透明度 + 波形继续动 + 写框禁点\n   → 为什么 练习页最怕「假就绪」：用户会对着还没加载的句子开始打分。 */\nmain.screen:has(>.strip) .stage[aria-busy=\"true\"] > *{\n  opacity:.5;\n  transition:opacity var(--f-fast) ease;\n}\nmain.screen:has(>.strip) .stage[aria-busy=\"true\"] .wave i{\n  animation:face-cycle 1.4s ease-in-out infinite;\n}\n@keyframes face-cycle{\n  0%,100%{opacity:.35}\n  50%{opacity:1}\n}\nmain.screen:has(>.strip) .stage[aria-busy=\"true\"] .writein{ pointer-events:none; }\n\n/* A2 · 禁用态：现在 .writein:disabled / .btn:disabled 没有专门样子\n   → 改成 统一 40% + 禁点光标 → 为什么 灰的「能写但不要写」(.dim) 和\n   真不能写是两件事，不能长得一样。 */\nmain.screen:has(>.strip) .writein:disabled,\nmain.screen:has(>.strip) .btn:disabled,\nmain.screen:has(.docwrap) .btn:disabled{\n  opacity:.4;\n  cursor:not-allowed;\n}\n\n/* A3 · 图片缺失：现在 图片没 src 时只留 alt 文字撑着，行高乱掉\n   → 改成 有固定比例的占位块 → 为什么 这是唯一能用纯 CSS 表达的空态：\n   不需要改模板，只要 src 为空。 */\nmain.screen:has(>.strip) img.shot:not([src]),\nmain.screen:has(>.strip) img.shot[src=\"\"]{\n  aspect-ratio:16/10;\n  width:var(--f-col);\n  max-width:100%;\n  display:block;\n  border:1px dashed rgba(var(--w),.14);\n  border-radius:var(--f-radius);\n  background:repeating-linear-gradient(135deg, rgba(var(--w),.03) 0 8px, transparent 8px 16px);\n}\n\n/* B · 需要 gen.mjs 多吐一个 <div class=\"fstate\" data-kind=\"empty|load|err\"> 才有用：\n   空态 = 今天这一面没有到期；载入态 = 正在取句子；错态 = 取挂了。\n   三种用同一个骨架，只有边框和字色不同，位置固定在操作列里。 */\nmain.screen:has(>.strip) .fstate{\n  width:var(--f-col);\n  max-width:100%;\n  display:flex;\n  flex-direction:column;\n  align-items:center;\n  gap:8px;\n  padding:24px 16px;\n  border:1px dashed rgba(var(--w),.14);\n  border-radius:var(--f-radius);\n  background:rgba(var(--w),.02);\n  color:var(--fg3);\n  font-size:14px;\n  line-height:1.6;\n  text-align:center;\n}\nmain.screen:has(>.strip) .fstate b{ font-weight:600; color:var(--fg2); font-size:14px; }\nmain.screen:has(>.strip) .fstate[data-kind=\"load\"]{ border-style:solid; color:var(--fg3); }\nmain.screen:has(>.strip) .fstate[data-kind=\"load\"]::before{\n  content:\"\";\n  width:16px; height:16px;\n  border-radius:999px;\n  border:2px solid rgba(var(--w),.14);\n  border-top-color:var(--accent);\n  animation:face-spin .9s linear infinite;\n}\n@keyframes face-spin{ to{ transform:rotate(360deg) } }\nmain.screen:has(>.strip) .fstate[data-kind=\"err\"]{\n  border-color:var(--danger-cont);\n  border-style:solid;\n  color:var(--danger);\n}\nmain.screen:has(>.strip) .fstate[data-kind=\"err\"] b{ color:var(--danger); }\n\n/* ════════════════════════════════════════════════════════════════\n   v72 · 启动页（index.html）打磨覆盖层\n   （第一行带 v72 标记：apply.mjs 的幂等靠 cur.includes(标记)，\n     少了它每跑一次 apply-all.ps1 就会把整块再追加一遍）\n   ------------------------------------------------------------------\n   加载方式：放在 app.css 之后（或整段追加到 app.css 末尾）。\n   本文件只写「覆盖」，不改 app.css 本体。\n\n   动手范围：文字排版 / 按钮 / 间距 / 字在星点上的可读性 / 焦点·按下·加载反馈。\n   没动：#sky 的 canvas 绘制、splash.js 的任何逻辑、.sky-veil（把 veil 调浓\n        等于把星点压暗 = 改了星空观感，铁律禁止）。星空绘制未改动。\n\n   每条格式：现在 → 改成 → 为什么\n   数值约束：间距只用 4 的倍数；字阶 11/12/14/16/20/24/28（本页标题是唯一\n   的显示级，48）；字重 400/500/600；圆角 6/14/999。\n   ════════════════════════════════════════════════════════════════ */\n\n/* ── 01 · 标题：字阶 / 行高 / 字重 ───────────────────────────────\n   现在：font-size 52px、line-height 1.2 = 62.4px、font-weight 700\n   改成：font-size 48px、line-height 64px、font-weight 600\n   为什么：52 和 62.4 都不在字阶、也不在 4px 网格上；700 超出 400/500/600。\n           48 是本页唯一的显示级（只用在标题这一处，不下放到正文），\n           行高 64px 让两行正好 128px，整块落回网格。 */\n.sp2-title{\n  font-size:48px;\n  line-height:64px;\n  font-weight:600;\n}\n\n/* ── 02 · 标题在星点上的可读性 ───────────────────────────────────\n   现在：text-shadow:0 2px 32px rgba(0,0,0,.45) —— 32px 模糊等于没有边\n   改成：0 1px 2px rgba(2,3,7,.55), 0 2px 24px rgba(2,3,7,.6)\n   为什么：星点用 'lighter' 合成，最亮那几颗接近纯白，压在字边上会把笔画\n           啃掉一块；紧边（2px）只压字缘、宽影（24px）只做体积，\n           两层各干一件事，比一层大模糊顶用。 */\n.sp2-title{\n  text-shadow:0 1px 2px rgba(2,3,7,.55), 0 2px 24px rgba(2,3,7,.6);\n}\n\n/* ── 03 · 品牌字：13px → 12px ────────────────────────────────────\n   现在：font-size 13px，无文字阴影\n   改成：font-size 12px + 0 1px 8px rgba(2,3,7,.7)\n   为什么：13 不在台阶上；12px 的 --fg3 灰字压在星场里偏虚，\n           补一道很短的暗影就清得住，不用动那块压暗层。 */\n.sp2-brand{\n  font-size:12px;\n  text-shadow:0 1px 8px rgba(2,3,7,.7);\n}\n\n/* ── 04 · 品牌小方块：圆角与字重 ─────────────────────────────────\n   现在：border-radius 10px、font-weight 700\n   改成：border-radius var(--r-md)（末段 :root 把它定成 14px）、font-weight 600\n   为什么：全站圆角只有 6/14/999，10 是第 4 种；字重 700 不在集合里。\n           （方块里那层 28% 主色渐变属于品牌标识，不是装饰色块，保留。） */\n.sp2-logo{\n  border-radius:var(--r-md);\n  font-weight:600;\n}\n\n/* ── 05 · 品牌行内间距：9px → 8px ────────────────────────────────\n   现在：gap 9px\n   改成：gap 8px\n   为什么：9 不是 4 的倍数。 */\n.sp2-wordmark{\n  gap:8px;\n}\n\n/* ── 06 · 主按钮尺寸：130×52 的小胶囊 → 139×56 的入口 ────────────\n   现在：padding:15px 48px + font-size 15.5px，高度靠字高凑出来 = 52px\n   改成：height:56px、padding:0 52px、font-size:16px、line-height:24px、\n         inline-flex 居中\n   为什么：15.5 不在台阶（→16）；高度写死 56 才落在 4px 网格上（现在 52 是\n           15+22+15 凑的，字一换就飘）；56px 命中区远高于「≥36px」的下限，\n           139×56（实测）配 48px 标题，按钮才像个「入口」而不是标题下面的小胶囊。 */\n.splash-body .sp2-act .btn.lg{\n  display:inline-flex;\n  align-items:center;\n  justify-content:center;\n  height:56px;\n  padding:0 52px;\n  font-size:16px;\n  line-height:24px;\n}\n\n/* ── 07 · hover 的过渡被砍掉了（本屏最实的一个 bug）───────────────\n   现在：app.css:3782 的 .splash-body .sp2-act .btn 用 (0,3,0) 盖掉了\n         app.css:2677 那份显式 transition 列表，只剩 opacity .4s / transform .4s\n         → transform 那 400ms 其实白给（见 09：抬升被 !important 关死了），\n           而真正在变的 box-shadow / filter / 颜色一项都没有过渡 = 硬闪\n   改成：显式五条属性：box-shadow 240ms、filter 160ms、background-color 160ms、\n         color 160ms、opacity 400ms（留给退场）\n   为什么：只列真的会变的属性，不用 transition:all（all 会把 background-image\n           也拖进来重绘）；transform 不列，因为这一屏它被 2747 / 2755 的\n           !important 按死了，列了也是空转。 */\n.splash-body .sp2-act .btn.lg{\n  transition:\n    box-shadow 240ms var(--ease),\n    filter 160ms var(--ease),\n    background-color 160ms var(--ease),\n    color 160ms var(--ease),\n    opacity 400ms var(--ease);\n}\n\n/* ── 08 · hover 换渐变 = 天然硬切，换成叠一层白膜 ─────────────────\n   现在：.btn.primary:hover 把 background 换成另一条 linear-gradient\n   改成：hover 保持 base 那条渐变；改用 ::before 叠 10% 白，配合已有的\n         brightness(1.04) 和 box-shadow 加厚来表达 hover\n   为什么：background-image（渐变）不能插值，换渐变永远是「啪」一下；\n           叠一层 opacity 可插值的白膜才有过渡。按钮已经是\n           position:relative + overflow:hidden + 999 圆角（app.css:2495），\n           白膜会被裁成胶囊形，不用额外处理。\n           注意：hover 的 translateY(-2px) 在 app.css:2747 被\n           transform:none!important 关死了（v37 的决定），所以这屏的 hover\n           反馈不能靠位移，只能靠亮度 + 光晕 + 白膜。 */\n.splash-body .sp2-act .btn.lg::before{\n  content:'';\n  position:absolute; inset:0;\n  border-radius:inherit;\n  background:rgba(255,255,255,.10);\n  opacity:0;\n  transition:opacity 160ms var(--ease);\n  pointer-events:none;\n}\n.splash-body .sp2-act .btn.lg:hover::before{\n  opacity:1;\n}\n.splash-body .sp2-act .btn.primary:hover{\n  background:linear-gradient(135deg, #A8BEF4 0%, var(--accent) 100%);\n}\n\n/* ── 09 · 按下反馈：现在等于没按，而且不能用 transform 修 ──────────\n   现在：.sp2-act .btn.lg:active{transform:translateY(0)} —— 想从 hover 的\n         -2px 回到 0；但 hover 那 -2px 在 app.css:2747 被\n         `transform:none!important` 关死，:active 又在 2748-2757 被\n         `transform:none!important; transition-duration:0s` 关死\n         → 这一屏按下去只剩 .btn.primary:active 换了一条更深的渐变（硬切）\n   改成：不跟 !important 的 transform 较劲（v37 明确删掉了抬升和通用压下），\n         改用三样都能插值/瞬时可见的：filter brightness(.95) 整体压暗、\n         内阴影从「上缘亮线」翻成「上缘暗坑」、外光晕从 32px 收到 14px，\n         时长压到 70ms\n   为什么：按下要的是「这件东西陷进去了」，不是「它移动了」；\n           光晕收干 + 内部翻暗 = 陷进去，而且不受那两条 !important 影响。\n           70ms 是「立刻」的体感上限，再慢就像加载。 */\n.splash-body .sp2-act .btn.lg:active{\n  filter:brightness(.95);\n  background:linear-gradient(135deg, #9AB4F0 0%, #8AAAE8 100%);\n  box-shadow:\n    inset 0 1px 3px rgba(0,0,0,.24),\n    0 4px 14px rgba(var(--accent-rgb),.30);\n  transition-duration:70ms;\n}\n\n/* ── 10 · 焦点环：现在完全没有 ──────────────────────────────────\n   现在：按钮没有 focus-visible 样式（全站只有 .pickbtn / .sw / .drow 有）\n   改成：outline:2px solid rgba(var(--accent-rgb),.9)、outline-offset:4px\n   为什么：splash.js 全局监听 Enter / Space 直接进门，键盘用户 Tab 过来\n           是一颗「看不见焦点」的按钮，按下去页面就跳走了。\n           2px 正好卡在「装饰色只能出现在 2px 以下」的上限。 */\n.splash-body .sp2-act .btn.lg:focus-visible{\n  outline:2px solid rgba(var(--accent-rgb),.9);\n  outline-offset:4px;\n  outline-style:solid;\n}\n\n/* ── 11 · 加载中状态：CSS 预埋了 .busy，但它是空的 ────────────────\n   现在：app.css:3783 只有 .busy{pointer-events:none}，没有视觉；\n         splash.js / smooth.js 里也没有任何地方加这个类\n         → 点「开启」到遮罩开始盖（约 2 帧 = 32ms）之间，屏幕什么都不变\n   改成：把 .busy 的视觉补齐 —— 指针变 progress、按钮压到 78%、\n         底部一条 2px 扫光；另外 .leaving 期间也给 progress 指针\n         （这条纯 CSS 立刻生效，不依赖 JS）\n   为什么：样式先备好，JS 只要 classList.add('busy') 就能用；在 JS 补上之前，\n           .leaving 的 progress 指针至少让点击当下有回应。\n           扫光条 2px = 装饰色的合法粗细，压在按钮底边不挡字。 */\n.splash-body .sp2-act .btn.busy{\n  pointer-events:none;\n  cursor:progress;\n  opacity:.78;\n  filter:saturate(.85);\n}\n.splash-body .sp2-act .btn.busy::after{\n  content:'' !important;          /* app.css:2745 把 ::after 设成了 content:none!important */\n  display:block !important;\n  position:absolute;\n  top:auto;                       /* base 的 2496 写了 top:0，不关掉这条会被钉在顶边 */\n  left:0; right:0; bottom:0;\n  height:2px;\n  width:100%;\n  transform:none;\n  border-radius:999px;\n  background:linear-gradient(90deg,\n    rgba(18,28,52,0) 0%,\n    rgba(18,28,52,.55) 50%,\n    rgba(18,28,52,0) 100%);\n  background-size:45% 100%;\n  background-repeat:no-repeat;\n  opacity:1;\n  animation:sp-busy-sweep 1.1s linear infinite !important;   /* 2745 的 animation:none!important 也要压过 */\n}\n@keyframes sp-busy-sweep{\n  0%  {background-position:-45% 0}\n  100%{background-position:145% 0}\n}\n/* 点击之后、遮罩盖满之前：指针立刻变 progress（零 JS） */\n.splash-body.leaving .sp2-act .btn{\n  cursor:progress;\n}\n\n/* ── 12 · 移动端：38px/45.6 与 -18px 都不在网格上 ─────────────────\n   现在：@media (max-width:760px) 里 title 38px（行高 45.6px）、\n         .sp2-inner translateY(-18px)\n   改成：40px / 48px、translateY(-20px)\n   为什么：45.6 不是 4 的倍数，-18 也不是；40/48 是显示级在窄屏的等比档。 */\n@media (max-width:760px){\n  .sp2-title{font-size:40px;line-height:48px}\n  .sp2-inner{transform:translateY(-20px)}\n}\n\n/* ── 13 · 减少动效时别把扫光转成鬼影 ────────────────────────────\n   现在：app.css:2733 在 prefers-reduced-motion 下把 animation-duration 强制成\n         .01ms!important，无限循环的扫光会变成一条静止的 2px 亮线\n   改成：该模式下关掉扫光，只留压暗 + progress 指针\n   为什么：静止的亮线看着像渲染坏了，不如不画。 */\n@media (prefers-reduced-motion:reduce){\n  .splash-body .sp2-act .btn.busy::after{\n    display:none !important;\n  }\n}\n\n/* ==========================================================================\n   v-states.css · 空态 / 加载态 / 错误态 · 状态反馈动效\n   --------------------------------------------------------------------------\n   这是补丁层：追加在 design/app.css 之后，只覆盖、不替换，也不改任何结构。\n   写的四件事：POLISH ⑦（三种状态都要画，空态要说清下一步点哪）\n                POLISH ⑨（180–260ms 状态反馈 + 必要位移，不要弹跳）\n\n   命名（全站统一）\n     .state          状态块（默认空态外观，另外两个态在它上面改色）\n     .state-empty    空：数据是 0，要给下一步\n     .state-loading  加载：在等，用户别乱点\n     .state-error    出错：说清哪儿错了 + 一个可点的重试\n     里面四件套：.state-fig（占位图）/ .state-title（一句结论）\n                 .state-hint（为什么、下一步点哪）/ .state-acts（按钮行）\n\n   两条路\n     1) 纯 CSS：容器本来就是空的（:empty / :not(:has())）→ 自动长出提示，\n        一行 HTML 都不用改。第 2 节各页的「空态兜底」全走这条。\n     2) 要让 JS 配合：整块替换成 .state-*（自定义文案 + 按钮）、\n        加载中（aria-busy）、出错（data-error / .state-error）。\n        浏览器自己不知道「正在等」和「失败了」，这三个词得由 JS 说出来。\n\n   约束（违反就是白干，所以写在这里当自检表）\n     间距只用 4 的倍数；字阶只用 11/12/14/16/20；字重 400/500/600；\n     圆角只用 6/14/999；颜色只有 --accent / --danger / 五级中性 + 白通道；\n     悬停按下 120–180ms，展开收起 380–520ms，状态反馈 200ms；\n     进场 cubic-bezier(.22,.9,.18,1)，退场 cubic-bezier(.4,0,.85,.55)；\n     两条曲线都没有 overshoot，所以不会有弹跳。\n   ========================================================================== */\n\n/* ── 0. 本文件自用的令牌 ──────────────────────────────────────────────────\n   作用：把四种时长、两条曲线、错误色通道收在一处。\n   为什么：app.css 已有 --ease / --t-fast / --t-mid，但少了「按下」「反馈」\n          两个档；加进来以后这一层不再出现裸数字，改节奏只要动这里。\n          错误色没有 rgb 通道变量（--danger 是 hex），补一个 --st-bad。 */\n:host{\n  --st-in:cubic-bezier(.22,.9,.18,1);   /* 进场：先快后慢，收尾不冲过头 */\n  --st-out:cubic-bezier(.4,0,.85,.55);  /* 退场：先慢后快，走得干脆 */\n  --st-hover:160ms;   /* 悬停/抬升：规格 120–180，取偏慢的一档，抬升才看得见 */\n  --st-press:120ms;   /* 按下：同规格，按下去要「立刻」，比悬停快一档 */\n  --st-fb:200ms;      /* 状态反馈：规格 180–260，取中段，一屏三个元素也不打架 */\n  --st-xp:420ms;      /* 展开收起：规格 380–520，取中段 */\n  --st-bad:230,144,137;/* = #E69089 的通道；错误底色用低透明度，不用实色 */\n  --st-line:rgba(var(--w),.10); /* 空态虚框的统一灰度，比 --line 还淡一级 */\n}\n\n/* ==========================================================================\n   1. 空态\n   ========================================================================== */\n\n/* ── 1.0 三种状态之间怎么切 ──────────────────────────────────────────────\n   作用：[hidden] 永远不显示；[data-empty] 原地说一句空态的话。\n   为什么：一块区域在「空 / 在等 / 有内容」之间切换，最小代价是 JS 只翻\n          一个属性，而不是增删一整块 DOM。\n          :empty 与 :not(:has())）留给「本来就没有内容」的纯 CSS 判断，\n          这两条路 HTML 一行都不用改；要换文案/加按钮才落到 .state-* 上。\n          这里给 [hidden] 补 !important：下面各页的 ::before/::after\n          提示是 display:block，不加这一条，JS 挂 hidden 也压不掉它。 */\n[hidden]{display:none!important}\n/* 宿主是 .litem 这种横排 flex 行时，只有让它换行，下面那条 flex:1 0 100%\n   才真的把提示顶到第二行；不换行的 flex 会把它挤在同一行尾巴上。 */\n[data-empty]{flex-wrap:wrap}\n[data-empty]::after{\n  content:attr(data-empty);\n  display:block;\n  /* flex:1 0 100%：宿主是 .litem 这种横向 flex 行时，提示必须自己占一行，\n     否则会接在「补偿」后面横着滚出去。块级容器里这两条不生效，无害。 */\n  flex:1 0 100%;\n  margin-top:8px;\n  font-size:12px;\n  font-weight:400;\n  line-height:1.7;\n  color:var(--fg3);\n}\n\n/* ── 1.1 状态块的骨架 .state ─────────────────────────────────────────────\n   作用：任何一块「这块区域该有内容但现在没有」的容器，套上 .state 就成型。\n   为什么：虚线框是这套设计里「这里可以长东西」的既有语言（.addsense /\n          .drop / .rv.dim 都是虚线），空态沿用同一条，不新造一种边框。 */\n.state{\n  display:grid;\n  place-items:center;\n  gap:12px;\n  align-content:center;\n  min-height:160px;\n  padding:32px 24px;\n  text-align:center;\n  border:1px dashed var(--st-line);\n  border-radius:14px;\n  background:rgba(var(--w),.02);\n  animation:st-in var(--st-fb) var(--st-in) both;\n}\n/* 紧凑版：塞在卡片里的一段行内提示，不要撑成一块台面 */\n.state.state-sm{\n  min-height:0;\n  padding:16px 16px;\n  gap:8px;\n}\n\n/* ── 1.2 占位图 .state-fig ───────────────────────────────────────────────\n   作用：48px 的小图位，三种状态共用一个。\n   为什么：这一版没有插画，也没引入图标字体；用两块 CSS 画出来的「空行」\n          代替图片，颜色跟 --accent-rgb 走，换配色（settings 里那六种）时\n          这里跟着变，不需要另做一套图。 */\n.state-fig{\n  position:relative;\n  width:48px;height:48px;\n  border-radius:14px;\n  background:linear-gradient(180deg,rgba(var(--accent-rgb),.14),rgba(var(--accent-rgb),.05));\n  box-shadow:inset 0 0 0 1px rgba(var(--accent-rgb),.22);\n}\n/* 三条空行：读起来就是「一张还没写字的表」 */\n.state-fig::before{\n  content:'';\n  position:absolute;\n  inset:14px;\n  border-radius:6px;\n  background:repeating-linear-gradient(\n    180deg,\n    rgba(var(--accent-rgb),.52) 0 2px,\n    rgba(var(--accent-rgb),0) 2px 6px\n  );\n}\n.state-fig::after{content:none}\n\n/* ── 1.3 文案三层 + 按钮行 ───────────────────────────────────────────────\n   作用：.state-title 一句结论（14/500），.state-hint 说下一步（12/400），\n        .state-note 补一句代价/说明（11/400）。\n   为什么：POLISH ⑦ 点名「空态不要写『暂无数据』，要说清下一步点哪」——\n          所以结论和动作用两层分开写，动作那层永远写按钮的原话。\n          hint 限宽 360px：中文一行 22 字左右最好读，太宽就成说明书了。 */\n.state-title{\n  font-size:14px;font-weight:500;line-height:1.5;\n  color:var(--fg2);\n}\n.state-hint{\n  max-width:360px;\n  font-size:12px;font-weight:400;line-height:1.7;\n  color:var(--fg3);\n}\n.state-note{\n  font-size:11px;font-weight:400;line-height:1.6;\n  color:var(--ghost);\n}\n.state-acts{\n  display:flex;\n  flex-wrap:wrap;\n  justify-content:center;\n  gap:8px;\n  margin-top:4px;\n}\n/* 空态里的主按钮：用现成的 .btn.primary，只把圆角收成胶囊，\n   让它比页面里的普通按钮更「像下一步」。 */\n.state .btn{white-space:nowrap}\n.state-acts .btn.primary{border-radius:999px;padding:8px 20px;font-size:12px}\n.state-acts .btn.ghost{border-radius:999px;padding:8px 16px;font-size:12px}\n\n/* ── 1.4 空态进场/退场 ───────────────────────────────────────────────────\n   作用：.state 出现 200ms 淡入上移 4px；.state.leaving 160ms 淡出上移。\n   为什么：4px 是「刚放上去」的最小位移，再大就像弹窗；退场刻意比进场快，\n          因为用户已经知道它要走，多等 40ms 都是浪费。 */\n@keyframes st-in{\n  from{opacity:0;transform:translateY(4px)}\n  to{opacity:1;transform:none}\n}\n@keyframes st-out{\n  from{opacity:1;transform:none}\n  to{opacity:0;transform:translateY(-4px)}\n}\n.state.leaving{animation:st-out var(--st-hover) var(--st-out) both}\n\n\n/* ── 1.5 各页「数据为空」的纯 CSS 兜底 ───────────────────────────────────\n   下面每条都是「容器里确实没有内容」时才成立，靠 :empty / :not(:has())\n   判断，不需要 JS。文案里一律写出按钮原话（获取牌组 / 导入素材 / 开始练）\n   —— 空态要能当路标用，不能只报丧。 */\n\n/* 卡片页：整块牌组表还在，但一行数据都没有 */\n/* 作用：.deckcard 里一个 .drow 都没有时，表头下面接一段带虚线的提示。\n   为什么：表头（牌组 / 未学习 / 学习中 / 待复习）得留着，用户才知道\n          这张表本该有什么；空态只补身体，不动头。 */\n.card.deckcard:not(:has(.drow))::after{\n  content:'这个包里还没有牌组。点下面「获取牌组」拿一套现成的，或者「创建牌组」自己建一个。';\n  display:block;\n  padding:32px 24px;\n  text-align:center;\n  font-size:12px;\n  line-height:1.7;\n  color:var(--fg3);\n}\n\n/* 卡片页：连牌组表都没有（第一次打开、一个包都没导入） */\n/* 作用：.c-l 里没有 .deckcard 时，整个左栏长成一块虚线占位。\n   为什么：这时表头也没有了，得让「获取 / 创建 / 导入」三个入口显得是\n          在等用户点，而不是页面加载坏了。 */\n.c-l:not(:has(.deckcard)){display:grid;place-items:center}\n.c-l:not(:has(.deckcard))::before{\n  content:'还没有牌组。先点下面的「获取牌组」从 AnkiWeb 拿一套，或者「创建牌组」。';\n  display:block;\n  width:100%;\n  box-sizing:border-box;\n  min-height:200px;\n  padding:32px 24px;\n  text-align:center;\n  font-size:12px;\n  line-height:1.7;\n  color:var(--fg3);\n  border:1px dashed var(--st-line);\n  border-radius:14px;\n  background:rgba(var(--w),.02);\n  animation:st-in var(--st-fb) var(--st-in) both;\n}\n\n/* 句库 / 详情：左栏的说法列表空了（右栏是句表，靠 table 排除掉） */\n/* 作用：.split 里没有 .litem、也没有 table 的那张卡 → 虚线占位。\n   为什么：句库和详情页共用同一套 .split 壳，这条能一次覆盖两页。 */\n.split>section.card:not(:has(.litem)):not(:has(table)){display:grid;place-items:center}\n.split>section.card:not(:has(.litem)):not(:has(table))::before{\n  content:'一个说法都没收。点右上「导入素材」贴一段字幕，或者去「工厂」造一句。';\n  display:block;\n  width:100%;\n  box-sizing:border-box;\n  min-height:160px;\n  padding:32px 24px;\n  text-align:center;\n  font-size:12px;\n  line-height:1.7;\n  color:var(--fg3);\n  border:1px dashed var(--st-line);\n  border-radius:14px;\n  animation:st-in var(--st-fb) var(--st-in) both;\n}\n\n/* 句库 / 详情：右栏句表一行都没有 */\n/* 作用：卡里有 table、但 tbody 没有 tr → 表格下面接提示。\n   为什么：不能往 tbody 里塞伪元素（表格布局不认），只能在表尾加一段；\n          表头留着，用户照样知道列是「读/打/听/说/改」。 */\n.split>section.card:has(table):not(:has(tbody tr))::after{\n  content:'这张表还是空的。换个筛选看看，或者点右上「导入素材」贴一段字幕加句子。';\n  display:block;\n  width:100%;\n  box-sizing:border-box;\n  padding:24px 20px;\n  text-align:center;\n  font-size:12px;\n  line-height:1.7;\n  color:var(--fg3);\n  border:1px dashed var(--st-line);\n  border-radius:14px;\n  margin-top:12px;\n}\n\n/* 统计页：图表区一颗像素都没有 */\n/* 作用：.card.stat 里 .chartbox 空（或 chartbox 里的 .box 空）→ 卡内虚线提示。\n   为什么：只认「图都没画出来」这一条硬信号。图例为空、留存表没行这两种\n          在「有数据但不够」时也会成立（比如只练了 3 天、留存表本来就\n          要 20 句才排队），拿它们判空会把正常卡画成没数据。\n          汇总数字和结论句（.sums / .takeaway）不在这里清，它们是 JS\n          写进去的，0 数据时该由 JS 换成「还没有」—— 见报告里「等 JS」那栏。 */\n.card.stat:has(.chartbox:empty)::after,\n.card.stat:has(.chartbox>.box:empty)::after{\n  content:'这张卡还没有数据。至少练过 20 个句子，这里才会长出曲线 —— 先去「卡片」页把今天该练的练掉。';\n  display:grid;\n  place-items:center;\n  width:100%;\n  box-sizing:border-box;\n  min-height:120px;\n  padding:24px 20px;\n  text-align:center;\n  font-size:12px;\n  line-height:1.7;\n  color:var(--fg3);\n  border:1px dashed var(--st-line);\n  border-radius:14px;\n  margin-top:12px;\n  animation:st-in var(--st-fb) var(--st-in) both;\n}\n\n/* 工厂：左栏词表空了 */\n/* 作用：.fx-words 里没有 li → 列表位置长出一块虚线提示。\n   为什么：工厂的空词表是「新用户第一屏」，必须告诉他搜索框在哪，\n          不然那块窄条看着像加载失败。 */\n.fx-words:not(:has(li))::before{\n  content:'左边还没有词。上面搜索框敲一个，第一项会自动加进来。';\n  display:grid;\n  place-items:center;\n  width:100%;\n  box-sizing:border-box;\n  min-height:120px;\n  padding:16px 12px;\n  text-align:center;\n  font-size:12px;\n  line-height:1.7;\n  color:var(--fg3);\n  border:1px dashed var(--st-line);\n  border-radius:14px;\n  margin-top:4px;\n  animation:st-in var(--st-fb) var(--st-in) both;\n}\n\n/* 工厂：右栏还没选词（没有词头） */\n.fx-main:not(:has(.fx-wordhd))::after{\n  content:'右边还没选词。左边点一个，就能在这里编例句、配图、排读音。';\n  display:grid;\n  place-items:center;\n  width:100%;\n  box-sizing:border-box;\n  min-height:200px;\n  padding:32px 24px;\n  text-align:center;\n  font-size:12px;\n  line-height:1.7;\n  color:var(--fg3);\n  border:1px dashed var(--st-line);\n  border-radius:14px;\n  animation:st-in var(--st-fb) var(--st-in) both;\n}\n\n/* 工厂：这个词一个义项都没有 */\n.fx-list:not(:has(.fx-sense))::after{\n  content:'这个词还没有义项。点下面「加义项」，先写一句例句，再挑图。';\n  display:grid;\n  place-items:center;\n  width:100%;\n  box-sizing:border-box;\n  min-height:120px;\n  padding:24px 20px;\n  text-align:center;\n  font-size:12px;\n  line-height:1.7;\n  color:var(--fg3);\n  border:1px dashed var(--st-line);\n  border-radius:14px;\n  margin-top:12px;\n}\n\n/* 工厂：右栏整个空着的时候，上面已经有一条「还没选词」，这里再长一条会\n   变成两层虚线框叠在一起。只留外层。\n   注意：这条要写在 .fx-list 那条之后，靠后覆盖。 */\n.fx-main:not(:has(.fx-wordhd)) .fx-list:not(:has(.fx-sense))::after{content:none}\n\n/* 卡片页：牌组表空着时，模板里那句「随包是空的…」会和上面这条撞车\n   （一句说没牌组、一句介绍样例牌组），留一句就够。 */\n.c-l:has(.deckcard:not(:has(.drow))) .deckstat{display:none}\n\n/* 学习页：抽屉拉开以后是空的（这一面还没内容） */\n/* 作用：.drw-p 里没有任何元素 → 抽屉里显示一行提示。\n   为什么：学习页有 7 个抽屉，内容由句子决定；缺一面时不能给白板。\n          用 ::before 是因为 .drw-p::after 已经被「拉开窗帘」的亮边占用了。 */\n.drw-p:not(:has(*))::before{\n  content:'这一面还没有内容。去工厂给这个词补一句，回来这里就有了。';\n  display:block;\n  padding:12px 0;\n  font-size:12px;\n  line-height:1.7;\n  color:var(--ghost);\n  animation:st-in var(--st-fb) var(--st-in) both;\n}\n\n/* 挖句（mine）：字幕列表空了 */\n.sublines:not(:has(.subline))::before{\n  content:'还没有挖到句子。播放上面的原声，听到想要的按「挖这一句」，就会落进这里。';\n  display:grid;\n  place-items:center;\n  min-height:160px;\n  padding:32px 24px;\n  text-align:center;\n  font-size:12px;\n  line-height:1.7;\n  color:var(--fg3);\n  border:1px dashed var(--st-line);\n  border-radius:14px;\n  animation:st-in var(--st-fb) var(--st-in) both;\n}\n\n/* 单句练习页（听/说/读/打/改）：这句还没语音 */\n/* 作用：.stage 里没有 .play 播放键 → 练习区顶上给一句提示。\n   为什么：没语音时波形区是空的，用户会以为是网卡了；直接告诉他去点\n          「生成语音」，比留一块空白强。 */\n.stage:not(:has(.play))::after{\n  content:'这一句还没有语音。点右上「生成语音」，几秒就好，之后就能直接听。';\n  display:block;\n  padding:12px 16px;\n  font-size:12px;\n  line-height:1.7;\n  color:var(--fg3);\n  border:1px dashed var(--st-line);\n  border-radius:14px;\n}\n/* 波形空：只给一行小字，不占块 */\n/* 只在这一句「有播放键但波形没生出来」时才说话 —— 没语音的那种情况上面\n   已经有一条完整提示，这里再说一遍就是两张嘴。 */\n.stage:has(.play) .wave:not(:has(i))::after{\n  content:'还没有波形';\n  font-size:11px;\n  line-height:1.6;\n  color:var(--ghost);\n  letter-spacing:.04em;\n}\n/* 配图空：figure 还在、图没有 */\n.shot:not(:has(img))::after{\n  content:'这句还没配图。去工厂换一张真实场景的图，练习时会好记很多。';\n  display:grid;\n  place-items:center;\n  min-height:120px;\n  padding:24px 16px;\n  text-align:center;\n  font-size:11px;\n  line-height:1.7;\n  color:var(--ghost);\n  border:1px dashed var(--st-line);\n  border-radius:6px;\n}\n\n/* 设置页：没开的东西一眼看得出来 */\n/* 作用：开关关着的那一行，标题退到 --fg2；开着的是 --fg。\n   为什么：设置页最常被问的是「我到底开没开」——一个 24px 的开关不够显眼，\n          让这一行的标题跟着变重量，扫一眼就知道哪几项没开。 */\n.field:has(.sw:not(.on)) .lab{color:var(--fg2)}\n/* 作用：「其他语言（未做）」这类占位选项后面补一个「未做」标签。\n   为什么：.seg span.off 现在只是变灰，灰和「没选中」长得一样；\n          写出来才知道是功能没做，不是选项被禁用。 */\n.seg span.off::after{\n  content:'未做';\n  margin-left:4px;\n  font-size:11px;\n  font-weight:400;\n  color:var(--ghost);\n  letter-spacing:.04em;\n}\n/* 作用：接口页三张卡都没接时，整行给一句提示。\n   为什么：三张 ncard 各自写着「关」，凑在一起才知道是「一个都没接」。 */\n.nowrow:not(:has(.ncard))::before{\n  content:'三类接口都还没接。先填一个 API key，右上角的状态点会跟着亮起来。';\n  display:grid;\n  place-items:center;\n  min-height:96px;\n  padding:24px 20px;\n  text-align:center;\n  font-size:12px;\n  line-height:1.7;\n  color:var(--fg3);\n  border:1px dashed var(--st-line);\n  border-radius:14px;\n  animation:st-in var(--st-fb) var(--st-in) both;\n}\n\n/* 教程页不涉及：内容是写的，不是读出来的，没有空的时候。 */\n\n\n/* ==========================================================================\n   2. 加载态\n   ========================================================================== */\n\n/* ── 2.1 加载中的状态块 .state-loading ───────────────────────────────────\n   作用：复用 .state 的骨架，只换占位图和边框。\n   为什么：三种态要是三种长相，用户就得多认两套语言；换成同骨架后，\n          「这块在长东西」这个意思不用重新学。 */\n.state-loading{\n  border-style:solid;\n  border-color:rgba(var(--w),.08);\n  background:transparent;\n}\n.state-loading .state-fig{\n  background:none;\n  box-shadow:inset 0 0 0 1px rgba(var(--w),.10);\n}\n/* 转圈：只有一环缺口在动，不带阴影、不带发光 */\n.state-loading .state-fig::before{\n  inset:8px;\n  border-radius:999px;\n  background:none;\n  border:2px solid rgba(var(--accent-rgb),.20);\n  border-top-color:var(--accent);\n  animation:st-spin .8s linear infinite;\n}\n.state-loading .state-fig::after{content:none}\n@keyframes st-spin{to{transform:rotate(360deg)}}\n\n/* ── 2.2 骨架行 .st-sk ───────────────────────────────────────────────────\n   作用：.st-sk 里放 3 个 <i>，就是三条灰条 + 一道扫光。\n   为什么：首次进页面要读本地 ledger.json，那一下是 100–300ms 的空白；\n          三根条比转圈更能说明「这里马上会有一列表」，也不会让布局跳。\n          宽度用 calc(100% - 48px) 而不是 84%，这样所有数字还是 4 的倍数。 */\n.st-sk{\n  display:grid;\n  gap:12px;\n  width:100%;\n  max-width:360px;\n  margin-top:4px;\n}\n.st-sk i{\n  position:relative;\n  display:block;\n  height:12px;\n  border-radius:6px;\n  background:rgba(var(--w),.06);\n  overflow:hidden;\n}\n.st-sk i::after{\n  content:'';\n  position:absolute;\n  inset:0;\n  background:linear-gradient(100deg,rgba(var(--w),0) 24%,rgba(var(--w),.10) 50%,rgba(var(--w),0) 76%);\n  background-size:220% 100%;\n  animation:st-sweep 1.4s var(--st-in) infinite;\n}\n.st-sk i:nth-child(2){width:calc(100% - 48px)}\n.st-sk i:nth-child(3){width:calc(100% - 96px)}\n@keyframes st-sweep{\n  from{background-position:120% 0}\n  to{background-position:-120% 0}\n}\n\n/* ── 2.3 容器级「正在等」 ────────────────────────────────────────────────\n   作用：给容器挂 aria-busy=\"true\"，里面的内容降到 30% 透明，上面扫一道光。\n   为什么：aria-busy 是浏览器与读屏器都认识的既有属性，JS 只要置这一个\n          属性，样式和语义一起到位，不用再加 class。\n          只挂在四种宿主上（main / section / .card / .chartbox），\n          避免误伤 .btn.primary 那种自己要用 ::after 做流光的地方。 */\nmain[aria-busy=\"true\"],\nsection[aria-busy=\"true\"],\n.card[aria-busy=\"true\"],\n.chartbox[aria-busy=\"true\"]{\n  position:relative;\n}\nmain[aria-busy=\"true\"]>*,\nsection[aria-busy=\"true\"]>*,\n.card[aria-busy=\"true\"]>*,\n.chartbox[aria-busy=\"true\"]>*{\n  opacity:.3;\n  transition:opacity var(--st-fb) var(--st-out);\n}\nmain[aria-busy=\"true\"]::after,\nsection[aria-busy=\"true\"]::after,\n.card[aria-busy=\"true\"]::after,\n.chartbox[aria-busy=\"true\"]::after{\n  content:'';\n  position:absolute;\n  inset:0;\n  z-index:2;\n  border-radius:inherit;\n  pointer-events:none;\n  background:linear-gradient(100deg,rgba(var(--w),0) 24%,rgba(var(--w),.07) 50%,rgba(var(--w),0) 76%);\n  background-size:220% 100%;\n  animation:st-sweep 1.4s var(--st-in) infinite;\n}\n\n/* ── 2.4 整页跳转时的进度条 ──────────────────────────────────────────────\n   作用：body 挂 data-busy=\"page\" → 视口顶部一条 2px 的主色扫光。\n   为什么：卡片页点一句就跳学习页，这中间是白的；一条细线说明「在走了」，\n          比盖一层遮罩轻，也不会打断用户对上一屏的注意力。 */\nbody[data-busy=\"page\"]::after{\n  content:'';\n  position:fixed;\n  z-index:120;\n  top:0;left:0;\n  width:40%;\n  height:2px;\n  pointer-events:none;\n  background:linear-gradient(90deg,rgba(var(--accent-rgb),0),var(--accent),rgba(var(--accent-rgb),0));\n  animation:st-prog 1.1s var(--st-in) infinite;\n}\n@keyframes st-prog{\n  from{transform:translateX(-100%)}\n  to{transform:translateX(300%)}\n}\n\n/* ── 2.5 启动页 ──────────────────────────────────────────────────────────\n   不碰。index 的加载动画在 v-splash.css 里（.sp2-* 那一套），\n   这里只提供上面通用的 aria-busy / data-busy，两者不重叠。 */\n\n\n/* ==========================================================================\n   3. 错误态\n   ========================================================================== */\n\n/* ── 3.1 错误块 .state-error ─────────────────────────────────────────────\n   作用：换成实线 + 警示色低透明底，占位图里画一个叹号。\n   为什么：空态是「还没长」，错误是「长坏了」，两者必须一眼分开；\n          所以空用虚线（可填），错用实线（先修）。\n          底色只用 5% 的 --danger，不用实心：错误块经常整块出现，\n          实心红会把整页压暗，读不了别的内容。 */\n.state-error{\n  border-style:solid;\n  border-color:rgba(var(--st-bad),.34);\n  background:rgba(var(--st-bad),.05);\n}\n.state-error .state-title{color:var(--fg)}\n.state-error .state-hint{color:var(--fg3)}\n.state-error .state-fig{\n  background:rgba(var(--st-bad),.10);\n  box-shadow:inset 0 0 0 1px rgba(var(--st-bad),.28);\n}\n/* 叹号：一根竖杠 + 一个点，纯 CSS，不引图标 */\n.state-error .state-fig::before{\n  content:'';\n  inset:auto;\n  left:50%;\n  top:12px;\n  width:2px;\n  height:16px;\n  border-radius:999px;\n  background:var(--danger);\n  transform:translateX(-1px);\n}\n.state-error .state-fig::after{\n  content:'';\n  position:absolute;\n  left:50%;\n  bottom:10px;\n  width:4px;height:4px;\n  border-radius:999px;\n  background:var(--danger);\n  transform:translateX(-2px);\n}\n/* 错误块里的主按钮改成「重试」的样子：警示色描边，不抢主色 */\n.state-error .btn.primary{\n  background:transparent;\n  color:var(--danger);\n  box-shadow:inset 0 0 0 1px rgba(var(--st-bad),.42);\n}\n.state-error .btn.primary:hover{\n  background:rgba(var(--st-bad),.10);\n  color:var(--danger);\n}\n\n/* ── 3.2 行内报错 [data-error] ───────────────────────────────────────────\n   作用：任何元素挂 data-error=\"文案\"，就在它下面多一行 11px 的警示字。\n   为什么：字段级报错（key 填错、路径不存在）不该整页盖一层错误块；\n          只加属性、不改 DOM，是 JS 最省事的一条路。\n          注意：<input>/<img> 这种替换元素不生成伪元素，\n          要挂就挂在包着它的 .ctl / .field 上。 */\n[data-error]::after{\n  content:attr(data-error);\n  display:block;\n  margin-top:8px;\n  font-size:11px;\n  font-weight:400;\n  line-height:1.6;\n  color:var(--danger);\n}\n/* 出错的那一行，标题跟着变成警示色，扫一眼找得到 */\n.field[data-error] .lab{color:var(--danger)}\n\n/* ── 3.3 空但「全是 0」 ──────────────────────────────────────────────────\n   作用：容器挂 data-zero，补一句「数字是有的，但都是 0」。\n   为什么：统计页第一周最常见的情况不是没数据，是数据全 0；这时图会\n          画成一条贴底的直线，看着像坏了。CSS 判断不了数值，只能等 JS 说。 */\n[data-zero]::after{\n  content:'这一周全是 0。练过几次以后，这里才有起伏。';\n  display:block;\n  margin-top:8px;\n  font-size:11px;\n  line-height:1.6;\n  color:var(--ghost);\n}\n\n\n/* ==========================================================================\n   4. 反馈动效\n   只补「点了有反应」这一层，不做装饰性动效（v37 已经把流光、光斑删掉了，\n   这次不往回加）。所有位移都在 1–2px，没有回弹。\n   ========================================================================== */\n\n/* ── 4.1 按下位移 1px ────────────────────────────────────────────────────\n   作用：所有可点的件按下时整体下沉 1px，120ms 走完。\n   为什么：v37 为了去「浮夸」把按下反馈全清了（transform:none!important），\n          结果按钮按下去毫无回执，点快了会怀疑没点上。1px 是手感下限，\n          不动色、不加阴影，就不会变成「装饰」。\n          这里必须用 !important：v37 那几条是 !important + 0s，\n          不抢就压不过去。 */\nbutton:active:not([disabled]),\n.btn:active:not([disabled]),\n.mini:active:not([disabled]),\n.chip:active,\n.tab:active,\n.dg:active,\n.rv:active,\n.st-r:active,\n.fb:active,\n.ex:active,\n.play:active,\n.drw-h:active,\n.drow:active,\n.litem:active,\n.fx-words li:active,\n.sw:active{\n  transform:translateY(1px)!important;\n  transition-duration:var(--st-press)!important;\n  transition-timing-function:var(--st-in)!important;\n}\n\n/* 悬停保持平（v37 的决定），只有按下才动 —— 这里显式写一遍，\n   防止以后有人把 4.1 的 !important 抄到 :hover 上去。 */\n.btn:hover{transform:none}\n\n/* ── 4.2 卡片 hover 抬升 ─────────────────────────────────────────────────\n   作用：.card 悬停上浮 2px，160ms；表格卡（deckcard）和 .focus 大面板不抬。\n   为什么：抬升是「这块可以点/可以看」的最便宜信号。2px 配 160ms，\n          扫过一排卡片时是「浮起来」而不是「跳一下」。\n          deckcard 里面全是可点的行，整张表抬会跟行抢注意力；\n          .card.focus 是页面主面板，抬起来像能拖走。 */\n.card{\n  transition:\n    transform var(--st-hover) var(--st-in),\n    border-color var(--st-hover) var(--st-in),\n    box-shadow var(--st-hover) var(--st-in);\n}\n.card:hover{transform:translateY(-2px)}\n.card.deckcard:hover,\n.card.focus:hover{transform:none}\n\n/* ── 4.3 开关拖动 160ms ──────────────────────────────────────────────────\n   作用：.sw 的轨道与旋钮统一 160ms，曲线用进场曲线。\n   为什么：v63 已经把旋钮改成 160ms / cubic-bezier(.22,.9,.18,1)，\n          但轨道背景还挂着 .22s、旋钮背景 .2s，两个速度不齐会看着「分家」。\n          这条把两者拉到同一档，顺带把 2618 那个会过冲的\n          cubic-bezier(.34,1.3,.64,1) 顶掉 —— 开关不许弹。 */\n.sw,.sw::after{\n  transition-duration:160ms;\n  transition-timing-function:var(--st-in);\n}\n\n/* ── 4.4 列表项出现 200ms 淡入（--d 错开） ───────────────────────────────\n   作用：行一多，按 --d 每行晚 40ms 出现，200ms 淡入 + 上移 4px。\n   为什么：句库一屏 7 行、牌组一屏十几行，同时出现会「闪一下」；\n          逐行 40ms 的差，眼睛能读出「这是列表」而不是「图变了」。\n          --d 是 app.css 里 .legend li 已经在用的同一个变量，不新造。\n          注意：这些元素上有 :active 的 !important 位移，\n          动画不会把它顶掉（!important 的优先级高于动画填充）。 */\n@keyframes st-rise{\n  from{opacity:0;transform:translateY(4px)}\n  to{opacity:1;transform:none}\n}\n.litem,\n.drow,\n.fx-words li,\n.sublines .subline,\ntable.rt tbody tr{\n  animation:st-rise var(--st-fb) var(--st-in) both;\n  animation-delay:var(--d,0ms);\n}\n/* 前 8 项逐个错开 40ms；第 9 项往后一起在 280ms 出现，不无限拖 */\n:is(.litem:nth-child(1),.drow:nth-child(2),.fx-words li:nth-child(1),.subline:nth-child(1),table.rt tbody tr:nth-child(1)){--d:0ms}\n:is(.litem:nth-child(2),.drow:nth-child(3),.fx-words li:nth-child(2),.subline:nth-child(2),table.rt tbody tr:nth-child(2)){--d:40ms}\n:is(.litem:nth-child(3),.drow:nth-child(4),.fx-words li:nth-child(3),.subline:nth-child(3),table.rt tbody tr:nth-child(3)){--d:80ms}\n:is(.litem:nth-child(4),.drow:nth-child(5),.fx-words li:nth-child(4),.subline:nth-child(4),table.rt tbody tr:nth-child(4)){--d:120ms}\n:is(.litem:nth-child(5),.drow:nth-child(6),.fx-words li:nth-child(5),.subline:nth-child(5),table.rt tbody tr:nth-child(5)){--d:160ms}\n:is(.litem:nth-child(6),.drow:nth-child(7),.fx-words li:nth-child(6),.subline:nth-child(6),table.rt tbody tr:nth-child(6)){--d:200ms}\n:is(.litem:nth-child(7),.drow:nth-child(8),.fx-words li:nth-child(7),.subline:nth-child(7),table.rt tbody tr:nth-child(7)){--d:240ms}\n:is(.litem:nth-child(8),.drow:nth-child(9),.fx-words li:nth-child(8),.subline:nth-child(8),table.rt tbody tr:nth-child(8)){--d:280ms}\n:is(.litem,.drow,.fx-words li,.subline,table.rt tbody tr):nth-child(n+9){--d:280ms}\n\n/* ── 4.5 抽屉展开/收起 ───────────────────────────────────────────────────\n   .drw-b 已经是 520ms 的 grid-template-rows 动画（app.css:3641），\n   落在规格 380–520 的上沿，不动它；只把里面内容的淡入从 340ms 收到 200ms，\n   跟别的状态反馈对齐 —— 之前 340ms 会让抽屉比内容「晚一步」。 */\n.drw-p>*{\n  transition-duration:var(--st-fb);\n  transition-timing-function:var(--st-in);\n}\n\n/* ── 4.6 系统要求减少动效时 ──────────────────────────────────────────────\n   作用：prefers-reduced-motion:reduce 时，本文件加的东西全部 0 时长。\n   为什么：规格要求「全部动画立即完成」。注意只关这一层的动画，\n          不碰统计页的图表动画 —— 那几段的作者明确写了「动画本身就是内容」，\n          关掉会让图表变成一坨静止的块，属于另一个人的决定，这里不越权。 */\n@media (prefers-reduced-motion:reduce){\n  .state,\n  .state.leaving,\n  .state-fig::before,\n  .state-loading .state-fig::before,\n  .st-sk i::after,\n  .litem,\n  .drow,\n  .fx-words li,\n  .subline,\n  .card,\n  .sw,\n  .sw::after,\n  body[data-busy=\"page\"]::after,\n  main[aria-busy=\"true\"]::after,\n  section[aria-busy=\"true\"]::after,\n  .card[aria-busy=\"true\"]::after,\n  .chartbox[aria-busy=\"true\"]::after{\n    animation:none!important;\n    transition-duration:0s!important;\n  }\n}\n\n/* v74 · 硬规格补丁 */\n/* 用法：<link rel=\"stylesheet\" href=\"app.css\"> 之后再 link 这个文件（它不是 app.css 的替代品，是最后一层覆盖）。\n   内容全部是「同一个选择器、只改一个数值」，不新增选择器结构、不新增颜色、不新增字号。\n   每条后面的注释写了 app.css 里的行号和原值，方便逐条核对或回滚。\n   这里只放我认为零风险的部分；拿不准的都在 spec-audit.md 里，没进这个文件。 */\n\n/* ── 1 间距：把 5/7/9/11/13/17px 收到 4 的倍数。每次只动 1px，\n      不影响任何容器能否装下内容。────────────────────────────────── */\n.chip.live{gap:8px}  /* app.css:417  gap:7px → 8px */\n.drow .dname{gap:8px}  /* app.css:393  gap:7px → 8px */\n.mi{gap:8px}  /* app.css:450  gap:9px → 8px */\n.ck{gap:8px}  /* app.css:529  gap:7px → 8px */\n.sw2{gap:4px}  /* app.css:559  gap:5px → 4px */\n.sums>div{gap:4px}  /* app.css:685  gap:5px → 4px */\n.legend .tot{padding-top:8px}  /* app.css:721  padding-top:9px → 8px */\ntable.rt thead th{padding-bottom:8px}  /* app.css:757  padding-bottom:9px → 8px */\n.gfield{margin-bottom:8px}  /* app.css:896  margin-bottom:9px → 8px */\n.ksearch{gap:8px}  /* app.css:1190  gap:9px → 8px */\n.chk{gap:8px}  /* app.css:992  gap:7px → 8px */\n.actbar{gap:8px}  /* app.css:1315  gap:9px → 8px */\n.fsteps{gap:8px}  /* app.css:1445  gap:9px → 8px */\n.fdef{margin-top:8px}  /* app.css:1507  margin-top:9px → 8px */\n.f5r{gap:8px}  /* app.css:1512  gap:9px → 8px */\n.popbox b{margin-bottom:4px}  /* app.css:1565  margin-bottom:5px → 4px */\n.popbox .pl{gap:4px}  /* app.css:1568  gap:5px → 4px */\n.popbox .pl li{gap:8px}  /* app.css:1569  gap:7px → 8px */\n.voicepick{gap:8px}  /* app.css:1771  gap:7px → 8px */\n.reveal>summary{gap:8px}  /* app.css:1819  gap:7px → 8px */\n.whead{gap:8px}  /* app.css:1901  gap:9px → 8px */\n.wblk{gap:8px}  /* app.css:1946  gap:9px → 8px */\n.fr{gap:8px}  /* app.css:1968  gap:9px → 8px */\n.wfoot{margin-top:12px}  /* app.css:2010  margin-top:11px → 12px */\n.wfoot{padding-top:12px}  /* app.css:2010  padding-top:11px → 12px */\n.kwrow{gap:4px}  /* app.css:2031  gap:5px → 4px */\n.fx-src{gap:8px}  /* app.css:2240  gap:9px → 8px */\n.fx-mini{gap:4px}  /* app.css:2248  gap:5px → 4px */\n.fx-wordhd{gap:8px}  /* app.css:2260  gap:9px → 8px */\n.fx-right .kwrow{gap:4px}  /* app.css:2320  gap:5px → 4px */\n.fx-right .vopts{gap:4px}  /* app.css:2328  gap:5px → 4px */\n.fx-right .chips{gap:4px}  /* app.css:2331  gap:5px → 4px */\n.fx-right .chips{margin-bottom:8px}  /* app.css:2331  margin-bottom:7px → 8px */\n.mhd{gap:8px}  /* app.css:2342  gap:9px → 8px */\n.egg{gap:8px}  /* app.css:2366  gap:9px → 8px */\n.ords{gap:8px}  /* app.css:2463  gap:9px → 8px */\n.ords b{margin-right:8px}  /* app.css:2371  margin-right:7px → 8px */\n.mbody-in label{gap:4px}  /* app.css:2385  gap:5px → 4px */\n.olist label{gap:8px}  /* app.css:2388  gap:9px → 8px */\n.bgl li{gap:8px}  /* app.css:3422  gap:9px → 8px */\n.dops{gap:4px}  /* app.css:2414  gap:5px → 4px */\n.fx-def .prob{gap:4px}  /* app.css:2840  gap:5px → 4px */\n.dg-h{margin-bottom:8px}  /* app.css:2582  margin-bottom:9px → 8px */\n.as-main{gap:8px}  /* app.css:2853  gap:9px → 8px */\n.tg{gap:8px}  /* app.css:2868  gap:7px → 8px */\n.st-faces{gap:4px}  /* app.css:2926  gap:5px → 4px */\n.st-crumb{gap:8px}  /* app.css:2996  gap:7px → 8px */\n.st-crumb{margin-bottom:8px}  /* app.css:2996  margin-bottom:7px → 8px */\n.resl li{gap:8px}  /* app.css:3008  gap:9px → 8px */\n.rlink li{gap:8px}  /* app.css:3081  gap:7px → 8px */\n.b-type{gap:8px}  /* app.css:3091  gap:7px → 8px */\n.rv{margin-bottom:4px}  /* app.css:3114  margin-bottom:5px → 4px */\n.enrow{gap:8px}  /* app.css:3133  gap:9px → 8px */\n.enrow{margin-bottom:8px}  /* app.css:3133  margin-bottom:9px → 8px */\n.fx-blk.bbg .bgl li{gap:8px}  /* app.css:3167  gap:9px → 8px */\n.pw-hd{gap:8px}  /* app.css:3307  gap:7px → 8px */\n.pw-bd .zhbox{margin-top:8px}  /* app.css:3319  margin-top:9px → 8px */\n.pw-bd .zhbox{padding-top:8px}  /* app.css:3319  padding-top:9px → 8px */\n.pw-ft{gap:8px}  /* app.css:3320  gap:7px → 8px */\n.edimg{gap:8px}  /* app.css:3335  gap:9px → 8px */\n.pw-add{margin-top:8px}  /* app.css:3476  margin-top:9px → 8px */\n.drw-h{gap:4px}  /* app.css:3745  gap:5px → 4px */\n.dlist{gap:8px}  /* app.css:3603  gap:7px → 8px */\n\n/* ── 2 圆角：只有 6 / 14 / 999 三档。\n      7/8/9px → 6px（小控件、角标、菜单行，差 1–3px）\n      10/11/12/13/15/16/18/20px → 14px（卡片、面板、抽屉、输入框）\n      99px 是「胶囊」的写法，视觉与 999px 完全等价（元素两轴都 < 198px 时浏览器一样夹到半高），\n      这里只做写法归一，不改观感。──────────────────────────────── */\n.days .bar{border-radius:999px}  /* app.css:327  99px → 999px（胶囊写法归一，视觉等价）*/\n.track{border-radius:999px}  /* app.css:340  99px → 999px（胶囊写法归一，视觉等价）*/\n.track i{border-radius:999px}  /* app.css:341  99px → 999px（胶囊写法归一，视觉等价）*/\n.mi{border-radius:6px}  /* app.css:450  9px → 6px（小控件 → 6）*/\n.setnav a{border-radius:6px}  /* app.css:470  9px → 6px（小控件 → 6）*/\n.inp{border-radius:14px}  /* app.css:499  10px → 14px（容器 → 14）*/\n.fprev{border-radius:14px}  /* app.css:580  12px → 14px（容器 → 14）*/\n.picker input[type=\"color\"]{border-radius:6px}  /* app.css:587  8px → 6px（小控件 → 6）*/\n.prompt{border-radius:14px}  /* app.css:622  10px → 14px（容器 → 14）*/\n.card.stat{border-radius:14px}  /* app.css:646  18px → 14px（容器 → 14）*/\n.legend li{border-radius:6px}  /* app.css:2099  9px → 6px（小控件 → 6）*/\ntable.rt tbody tr:hover{border-radius:6px}  /* app.css:766  8px → 6px（小控件 → 6）*/\n.tip{border-radius:6px}  /* app.css:840  9px → 6px（小控件 → 6）*/\n.krow .kb{border-radius:6px}  /* app.css:915  7px → 6px（小控件 → 6）*/\n.pal-item{border-radius:6px}  /* app.css:941  9px → 6px（小控件 → 6）*/\n.kbd{border-radius:6px}  /* app.css:953  5px → 6px（小控件 → 6）*/\n.ncard{border-radius:14px}  /* app.css:972  12px → 14px（容器 → 14）*/\n.deckmenu{border-radius:14px}  /* app.css:1198  12px → 14px（容器 → 14）*/\n.deckmenu button{border-radius:6px}  /* app.css:1205  8px → 6px（小控件 → 6）*/\n.nd-preview{border-radius:6px}  /* app.css:1414  8px → 6px（小控件 → 6）*/\n.fvoice .sel{border-radius:14px}  /* app.css:1506  10px → 14px（容器 → 14）*/\n.popbox code{border-radius:6px}  /* app.css:1567  5px → 6px（小控件 → 6）*/\n.windex .wi{border-radius:14px}  /* app.css:1622  11px → 14px（容器 → 14）*/\n.wsec{border-radius:14px}  /* app.css:1684  12px → 14px（容器 → 14）*/\n.src4 button{border-radius:14px}  /* app.css:1724  11px → 14px（容器 → 14）*/\n.shots .s{border-radius:6px}  /* app.css:1995  9px → 6px（小控件 → 6）*/\n.voicepick .vr{border-radius:14px}  /* app.css:1773  11px → 14px（容器 → 14）*/\n.pips i{border-radius:999px}  /* app.css:4091  99px → 999px（胶囊写法归一，视觉等价）*/\n.icobtn{border-radius:6px}  /* app.css:1934  7px → 6px（小控件 → 6）*/\n.fr{border-radius:6px}  /* app.css:1969  8px → 6px（小控件 → 6）*/\n.seg4{border-radius:6px}  /* app.css:1986  9px → 6px（小控件 → 6）*/\n.pickbtn{border-radius:6px}  /* app.css:2052  9px → 6px（小控件 → 6）*/\n.pickmenu{border-radius:14px}  /* app.css:2070  11px → 14px（容器 → 14）*/\n.pickitem{border-radius:6px}  /* app.css:2077  7px → 6px（小控件 → 6）*/\n.fx-words li{border-radius:6px}  /* app.css:2250  9px → 6px（小控件 → 6）*/\n.fx-info{border-radius:14px}  /* app.css:2266  11px → 14px（容器 → 14）*/\n.fx-row>summary{border-radius:14px}  /* app.css:2280  10px → 14px（容器 → 14）*/\n.f5row em{border-radius:999px}  /* app.css:2309  99px → 999px（胶囊写法归一，视觉等价）*/\n.fx-right .shots .s{border-radius:6px}  /* app.css:2323  8px → 6px（小控件 → 6）*/\n.mcard{border-radius:14px}  /* app.css:2452  20px → 14px（容器 → 14）*/\n.mta{border-radius:14px}  /* app.css:2459  12px → 14px（容器 → 14）*/\n.mest{border-radius:14px}  /* app.css:2460  13px → 14px（容器 → 14）*/\n.mtile{border-radius:14px}  /* app.css:2359  10px → 14px（容器 → 14）*/\n.egg{border-radius:14px}  /* app.css:2366  10px → 14px（容器 → 14）*/\n.dcard{border-radius:14px}  /* app.css:2466  16px → 14px（容器 → 14）*/\n.dimg{border-radius:14px}  /* app.css:2374  10px → 14px（容器 → 14）*/\n.mbody-in{border-radius:14px}  /* app.css:2383  10px → 14px（容器 → 14）*/\n.olist label{border-radius:6px}  /* app.css:2388  8px → 6px（小控件 → 6）*/\n.dfront{border-radius:14px}  /* app.css:2415  10px → 14px（容器 → 14）*/\n.fx-def .prob i{border-radius:999px}  /* app.css:2441  99px → 999px（胶囊写法归一，视觉等价）*/\n.dimg,.dfront{border-radius:14px}  /* app.css:2468  12px → 14px（容器 → 14）*/\n.mx{border-radius:6px}  /* app.css:2471  9px → 6px（小控件 → 6）*/\n.pbar{border-radius:999px}  /* app.css:2478  99px → 999px（胶囊写法归一，视觉等价）*/\n.pbar i{border-radius:999px}  /* app.css:2479  99px → 999px（胶囊写法归一，视觉等价）*/\n.dmini{border-radius:14px}  /* app.css:2522  12px → 14px（容器 → 14）*/\n.f5row .f5name{border-radius:6px}  /* app.css:2553  9px → 6px（小控件 → 6）*/\n.imgbar>img{border-radius:14px}  /* app.css:2572  10px → 14px（容器 → 14）*/\n.dgal{border-radius:14px}  /* app.css:2581  13px → 14px（容器 → 14）*/\n.dg{border-radius:14px}  /* app.css:2586  10px → 14px（容器 → 14）*/\n.dg em{border-radius:999px}  /* app.css:2588  99px → 999px（胶囊写法归一，视觉等价）*/\n.delbar{border-radius:6px}  /* app.css:2658  9px → 6px（小控件 → 6）*/\n.morep{border-radius:999px}  /* app.css:2844  99px → 999px（胶囊写法归一，视觉等价）*/\n.as-main{border-radius:14px}  /* app.css:2853  12px → 14px（容器 → 14）*/\n.tggroup{border-radius:14px}  /* app.css:2864  13px → 14px（容器 → 14）*/\n.t{border-radius:999px}  /* app.css:2870  99px → 999px（胶囊写法归一，视觉等价）*/\n.st-rail{border-radius:14px}  /* app.css:2894  16px → 14px（容器 → 14）*/\n.st-dk{border-radius:14px}  /* app.css:2900  11px → 14px（容器 → 14）*/\n.st-card{border-radius:14px}  /* app.css:2919  18px → 14px（容器 → 14）*/\n.st-face{border-radius:6px}  /* app.css:2922  8px → 6px（小控件 → 6）*/\n.st-answer{border-radius:14px}  /* app.css:2940  16px → 14px（容器 → 14）*/\n.st-shot{border-radius:14px}  /* app.css:2942  12px → 14px（容器 → 14）*/\n.resl li{border-radius:14px}  /* app.css:3008  10px → 14px（容器 → 14）*/\n.giftag{border-radius:6px}  /* app.css:3024  5px → 6px（小控件 → 6）*/\n.st-idx .wd{border-radius:14px}  /* app.css:3034  11px → 14px（容器 → 14）*/\n.rlink li{border-radius:6px}  /* app.css:3081  9px → 6px（小控件 → 6）*/\n.tin{border-radius:14px}  /* app.css:3093  11px → 14px（容器 → 14）*/\n.b-vary{border-radius:14px}  /* app.css:3103  13px → 14px（容器 → 14）*/\n.st-side{border-radius:14px}  /* app.css:3111  16px → 14px（容器 → 14）*/\n.rv{border-radius:6px}  /* app.css:3115  9px → 6px（小控件 → 6）*/\n.enbox{border-radius:14px}  /* app.css:3132  13px → 14px（容器 → 14）*/\n.zhbox{border-radius:14px}  /* app.css:3136  13px → 14px（容器 → 14）*/\n.ex{border-radius:6px}  /* app.css:3243  9px → 6px（小控件 → 6）*/\n.popwin{border-radius:14px}  /* app.css:3296  13px → 14px（容器 → 14）*/\n.edwarn{border-radius:6px}  /* app.css:3329  9px → 6px（小控件 → 6）*/\n.edimg img{border-radius:6px}  /* app.css:3336  7px → 6px（小控件 → 6）*/\n.navstep{border-radius:999px}  /* app.css:3376  99px → 999px（胶囊写法归一，视觉等价）*/\n.bgl li{border-radius:6px}  /* app.css:3423  9px → 6px（小控件 → 6）*/\n.bgadd{border-radius:6px}  /* app.css:3440  8px → 6px（小控件 → 6）*/\n.pw-blk{border-radius:6px}  /* app.css:3450  9px → 6px（小控件 → 6）*/\n.pw-add button{border-radius:6px}  /* app.css:3478  7px → 6px（小控件 → 6）*/\n.db{border-radius:14px}  /* app.css:3566  11px → 14px（容器 → 14）*/\n.dlist li{border-radius:6px}  /* app.css:3605  8px → 6px（小控件 → 6）*/\n.shot img{border-radius:14px}  /* app.css:3611  10px → 14px（容器 → 14）*/\n\n/* ── 3 字号：删掉 9.5 / 10.5 / 11.5 / 12.5 / 13.5 / 14.5 / 15.5 这七档小数，\n      以及 17 / 18 / 19 / 21 / 29 这些孤立档。每次只动 0.5–2px，\n      缩小的方向不会引起新的折行。──────────────────────────────── */\n.btn{font-size:13px}  /* app.css:190  13.5px → 13px */\n.qline{font-size:16px}  /* app.css:289  18px → 16px */\n.days .d span{font-size:10px}  /* app.css:329  10.5px → 10px */\n.qitem{font-size:13px}  /* app.css:333  13.5px → 13px */\n.qitem .en{font-size:14px}  /* app.css:335  14.5px → 14px */\n.strip .crumb{font-size:11px}  /* app.css:339  11.5px → 11px */\n.hint{font-size:12px}  /* app.css:346  12.5px → 12px */\n.defn p{font-size:14px}  /* app.css:350  15px → 14px */\n.deckhint{font-size:11px}  /* app.css:416  11.5px → 11px */\n.deckhead > span{font-size:10px}  /* app.css:388  10.5px → 10px */\n.mi .ext,.mi .mut{font-size:11px}  /* app.css:455  11.5px → 11px */\n.ghead h2{font-size:14px}  /* app.css:488  15px → 14px */\n.ghead .mut{font-size:11px}  /* app.css:489  11.5px → 11px */\n.field .lab{font-size:13px}  /* app.css:495  13.5px → 13px */\n.inp{font-size:12px}  /* app.css:499  12.5px → 12px */\n.seg span{font-size:12px}  /* app.css:515  12.5px → 12px */\n.seg.small span{font-size:11px}  /* app.css:525  11.5px → 11px */\n.sw2{font-size:10px}  /* app.css:559  10.5px → 10px */\n.stepper span{font-size:12px}  /* app.css:567  12.5px → 12px */\n.foldrow{font-size:13px}  /* app.css:573  13.5px → 13px */\n.shead h3{font-size:14px}  /* app.css:606  15px → 14px */\n.shead .x{font-size:14px}  /* app.css:609  15px → 14px */\n.srow .sd{font-size:11px}  /* app.css:618  11.5px → 11px */\n.snote{font-size:11px}  /* app.css:620  11.5px → 11px */\n.plus{font-size:12px}  /* app.css:628  12.5px → 12px */\n.shead2 .stitle{font-size:14px}  /* app.css:662  15px → 14px */\n.shead2 .smut{font-size:11px}  /* app.css:666  11.5px → 11px */\n.sums .mut{font-size:10px}  /* app.css:690  10.5px → 10px */\n.legend li{font-size:12px}  /* app.css:2099  12.5px → 12px */\n.legend .mut{font-size:11px}  /* app.css:719  11.5px → 11px */\ntable.rt thead th{font-size:10px}  /* app.css:755  10.5px → 10px */\n.big{font-size:20px}  /* app.css:779  19px → 20px */\n.geyebrow{font-size:11px}  /* app.css:885  11.5px → 11px */\n.gtitle{font-size:16px}  /* app.css:889  17px → 16px */\n.gdesc{font-size:12px}  /* app.css:890  12.5px → 12px */\n.glab2{font-size:11px}  /* app.css:897  11.5px → 11px */\n.gpath .inp{font-size:12px}  /* app.css:899  12.5px → 12px */\n.ksearch{font-size:12px}  /* app.css:1191  12.5px → 12px */\n.kgh .mut{font-size:10px}  /* app.css:910  10.5px → 10px */\n.krow .lab{font-size:12px}  /* app.css:913  12.5px → 12px */\n.krow .kb{font-size:11px}  /* app.css:916  11.5px → 11px */\n.keyhint{font-size:11px}  /* app.css:920  11.5px → 11px */\n.pal-item .mut,.pal-item .kb{font-size:11px}  /* app.css:948  11.5px → 11px */\n.pal-foot{font-size:11px}  /* app.css:951  11.5px → 11px */\n.small{font-size:11px}  /* app.css:968  11.5px → 11px */\n.nt{font-size:11px}  /* app.css:974  11.5px → 11px */\n.nu{font-size:11px}  /* app.css:976  11.5px → 11px */\n.sel{font-size:12px}  /* app.css:1006  12.5px → 12px */\n.year{font-size:12px}  /* app.css:1027  12.5px → 12px */\n.nextup .btn{font-size:12px}  /* app.css:1123  12.5px → 12px */\n.perm .pl{font-size:12px}  /* app.css:1166  12.5px → 12px */\n.deckmenu button{font-size:12px}  /* app.css:1206  12.5px → 12px */\n.toast{font-size:12px}  /* app.css:1227  12.5px → 12px */\n.toast button{font-size:12px}  /* app.css:1234  12.5px → 12px */\n.sp2-act .btn.lg{font-size:16px}  /* app.css:1368  15.5px → 16px */\n.nd-preview{font-size:12px}  /* app.css:1413  12.5px → 12px */\n.frule b{font-size:12px}  /* app.css:1437  12.5px → 12px */\n.frule span{font-size:11px}  /* app.css:1438  11.5px → 11px */\n.fmake .inp{font-size:14px}  /* app.css:1441  15px → 14px */\n.fstep .n{font-size:10px}  /* app.css:1450  10.5px → 10px */\n.fstep .t{font-size:12px}  /* app.css:1453  12.5px → 12px */\n.fp .fp-s{font-size:14px}  /* app.css:1474  14.5px → 14px */\n.fp .fp-z{font-size:11px}  /* app.css:1476  11.5px → 11px */\n.fsent{font-size:20px}  /* app.css:1486  21px → 20px */\n.f5io{font-size:11px}  /* app.css:1519  11.5px → 11px */\n.actbar .mut{font-size:11px}  /* app.css:1523  11.5px → 11px */\n.q.lg{font-size:11px}  /* app.css:1556  11.5px → 11px */\n.popbox b{font-size:12px}  /* app.css:1565  12.5px → 12px */\n.f5row .fi{font-size:11px}  /* app.css:1585  11.5px → 11px */\n.windex .wi b{font-size:14px}  /* app.css:1635  14.5px → 14px */\n.windex .wi span{font-size:11px}  /* app.css:1637  11.5px → 11px */\n.wrow .ws{font-size:14px}  /* app.css:1656  15px → 14px */\n.fline{font-size:12px}  /* app.css:1711  12.5px → 12px */\n.src4 button{font-size:11px}  /* app.css:1724  11.5px → 11px */\n.src4 button b{font-size:12px}  /* app.css:1734  12.5px → 12px */\n.shots .s em{font-size:10px}  /* app.css:2000  10.5px → 10px */\n.voicepick .vr .vt{font-size:11px}  /* app.css:1789  11.5px → 11px */\n.wgh span{font-size:11px}  /* app.css:1889  11.5px → 11px */\n.ws{font-size:14px}  /* app.css:1917  15px → 14px */\n.fr .fio{font-size:11px}  /* app.css:1973  11.5px → 11px */\n.pickbtn{font-size:12px}  /* app.css:2054  12.5px → 12px */\n.pickitem{font-size:12px}  /* app.css:2077  12.5px → 12px */\n.legend li .mut{font-size:11px}  /* app.css:2105  11.5px → 11px */\n.tx.ty{font-size:10px}  /* app.css:2110  10.5px → 10px */\n.pal-chip{font-size:11px}  /* app.css:2227  11.5px → 11px */\n.pal-empty{font-size:12px}  /* app.css:2230  12.5px → 12px */\n.fx-row .s{font-size:14px}  /* app.css:2285  15px → 14px */\n.f5row .d{font-size:11px}  /* app.css:2566  11.5px → 11px */\n.f5row em{font-size:11px}  /* app.css:2431  11.5px → 11px */\n.mx{font-size:16px}  /* app.css:2345  18px → 16px */\n.bgl li{font-size:11px}  /* app.css:2408  11.5px → 11px */\n.fx-def .dt{font-size:12px}  /* app.css:2437  12.5px → 12px */\n.fx-def .prob i{font-size:10px}  /* app.css:2440  10.5px → 10px */\n.imgbar .im span{font-size:10px}  /* app.css:2578  10.5px → 10px */\n.dg-h span{font-size:10px}  /* app.css:2584  10.5px → 10px */\n.mini.ic[data-add]{font-size:14px}  /* app.css:2646  15px → 14px */\n.morep{font-size:10px}  /* app.css:2844  10.5px → 10px */\n.as-main{font-size:12px}  /* app.css:2854  12.5px → 12px */\n.tg-h b{font-size:12px}  /* app.css:2866  12.5px → 12px */\n.tg-h span{font-size:10px}  /* app.css:2867  10.5px → 10px */\n.t{font-size:11px}  /* app.css:2870  11.5px → 11px */\n.t b{font-size:10px}  /* app.css:2874  10.5px → 10px */\n.hsub{font-size:12px}  /* app.css:2889  12.5px → 12px */\n.st-rail-h .mini.ic{font-size:14px}  /* app.css:2898  15px → 14px */\n.st-word{font-size:14px}  /* app.css:2925  15px → 14px */\n.st-faces{font-size:10px}  /* app.css:2926  10.5px → 10px */\n.st-sent{font-size:28px}  /* app.css:2932  29px → 28px */\n.st-cn{font-size:14px}  /* app.css:2945  15px → 14px */\n.st-crumb{font-size:11px}  /* app.css:2996  11.5px → 11px */\n.giftag{font-size:10px}  /* app.css:3024  9.5px → 10px */\n.rlink a{font-size:11px}  /* app.css:3083  11.5px → 11px */\n.vw{font-size:16px}  /* app.css:3106  18px → 16px */\n.rv{font-size:12px}  /* app.css:3115  12.5px → 12px */\n.rv i{font-size:10px}  /* app.css:3118  10.5px → 10px */\n.side-n{font-size:10px}  /* app.css:3126  10.5px → 10px */\n.en-def{font-size:16px}  /* app.css:3135  17px → 16px */\n.zhbox .en-def{font-size:14px}  /* app.css:3138  15px → 14px */\n.ex i{font-size:10px}  /* app.css:3247  10.5px → 10px */\n.pw-hd b{font-size:12px}  /* app.css:3313  12.5px → 12px */\n.pw-bd .en-def{font-size:12px}  /* app.css:3318  12.5px → 12px */\n.edwarn{font-size:11px}  /* app.css:3329  11.5px → 11px */\n.edbg{font-size:11px}  /* app.css:3334  11.5px → 11px */\n.edf5 .chip{font-size:11px}  /* app.css:3338  11.5px → 11px */\n.fb.done::after{font-size:10px}  /* app.css:3341  9.5px → 10px */\n.wordnav{font-size:16px}  /* app.css:3492  17px → 16px */\n.navstep{font-size:11px}  /* app.css:3377  11.5px → 11px */\n.fx-blk.b5 .f5row .f5name b{font-size:14px}  /* app.css:3411  15px → 14px */\n.fx-blk.b5 .f5row em{font-size:11px}  /* app.css:3413  11.5px → 11px */\n.bgadd{font-size:11px}  /* app.css:3441  11.5px → 11px */\n.pw-blk-h b{font-size:10px}  /* app.css:3460  10.5px → 10px */\n.pw-blk-h button{font-size:10px}  /* app.css:3463  10.5px → 10px */\n.pw-blk-b{font-size:12px}  /* app.css:3470  12.5px → 12px */\n.db b{font-size:12px}  /* app.css:3570  12.5px → 12px */\n.db i{font-size:10px}  /* app.css:3571  10.5px → 10px */\n.dlist li b{font-size:11px}  /* app.css:3608  11.5px → 11px */\n.pw-hd .pin{font-size:10px}  /* app.css:3690  10.5px → 10px */\n.fx-blk .fx-bh .mini{font-size:11px}  /* app.css:3709  11.5px → 11px */\n\n/* ── 4 字重：700 → 600、300 → 400，全库就这 8 条。\n      说明：.donut-big / .fx-wordhd h2 是大号数字，改完会略轻一点点，\n      不影响版式，也不影响可读性。────────────────────────────────── */\n.word{font-weight:400}  /* app.css:288  300 → 400 */\n.num{font-weight:400}  /* app.css:330  300 → 400 */\n.donut-big{font-weight:600}  /* app.css:737  700 → 600 */\n.btn.batch{font-weight:600}  /* app.css:2235  700 → 600 */\n.fx-wordhd h2{font-weight:600}  /* app.css:2261  700 → 600 */\n.mhd b{font-weight:600}  /* app.css:2343  700 → 600 */\n.fb.done::after{font-weight:600}  /* app.css:3342  700 → 600 */\n.rv.off::after{font-weight:600}  /* app.css:3539  700 → 600 */\n\n/* ── 5 动效时长（只在 no-preference 下生效，reduced-motion 的 0 时长仍然赢）\n      页面切换：.page 进场 400ms → 520ms（规格 460–580）；body.leaving 退场 280ms → 520ms\n      图表重绘：柱子 540 / 面积 650 / 热力图 400 / 环图 550 → 统一 780ms（规格 600–900）\n      悬停按下不动（--t-fast:.16s = 160ms 已经在规格内）。────────────── */\n@media (prefers-reduced-motion:no-preference){\n  .page{animation-duration:520ms}                       /* app.css:142  animation:page-in .4s → 520ms */\n  body.leaving .page{transition-duration:520ms}         /* app.css:1392 opacity/transform .28s → 520ms */\n  .bar{animation-duration:780ms}                        /* app.css:772  animation:grow .54s → 780ms */\n  .area2{animation-duration:780ms}                      /* app.css:787  area-in .65s → 780ms */\n  .heat rect{animation-duration:780ms}                  /* app.css:858  heat-in .4s → 780ms */\n  .donut circle{animation-duration:780ms}               /* app.css:1089 donut-in .55s → 780ms */\n}\n\n/* ── 没进这个文件的部分（明细与原因都在 spec-audit.md）：\n      app.css:2596 row-gap:7px（媒体查询内，需按断点分别覆盖）\n      app.css:2600 gap:7px（媒体查询内，需按断点分别覆盖）\n      app.css:160 .brand .mark border-radius:10px（高只有 30px 的小件，改成 14px 会明显变圆，交给人看图定）\n      app.css:3410 .fx-blk.b5 .f5row .f5name border-radius:11px（高只有 36px 的小件，改成 14px 会明显变圆，交给人看图定）\n      app.css:2601 font-size:10.5px（媒体查询内）\n      app.css:3389 font-size:10.5px（媒体查询内）\n  */\n\n/* ===== v75 · 牌组名那条常驻的半下划线 =====\n   来由：app.css:3192 给「整行可点」的牌组行加了 1px 底边（18% 白），\n   截图里看像每条牌组名都带下划线，显脏。改成只在悬停/键盘聚焦时出现，\n   可点提示靠 hover 背景与手型本来就有。 */\n\n.drow[data-go] .dname a{border-bottom-color:transparent}\n.drow[data-go]:hover .dname a{border-bottom-color:rgba(var(--accent-rgb),.55)}\n.drow[data-go]:focus-visible .dname a{border-bottom-color:rgba(var(--accent-rgb),.55)}\n\n/* ===== v76 · 规格审计剩下的 17 处装饰色相 =====\n   来由：spec-audit.md 第 5 条 —— 硬规格「1 主 + 1 警示 + 5 级中性 + ≤2 语义色」\n   对装饰色相零容忍，但 app.css 里还留着琥珀 6 处、绿 8 处、紫 2 处。\n   这些是 v60 的「四来路四色」（视频/文章/帖子…）与几个角标。\n   改成：来路靠字重与描边区分，颜色一律回到主色 / 中性 / 警示。\n\n   改动清单（原文位置 → 现在的值）：\n   303  / 1598  渐变绿 #82C282→#6BB76B   → 主色阶（深浅两档）\n   307  / 1602  渐变琥珀 #E0BA6E→#D4A558 → 警示阶\n   2590 .dg.on::after #5ad39a（绿点）    → 主色\n   2591 .dg.warn::after #e0a34a（琥珀点）→ 警示\n   3013 .rt.gif（琥珀文字胶囊）          → 中性\n   3015 .rt.post（松石文字胶囊）         → 主色\n   3025 .giftag（琥珀小角标）            → 中性\n   3205 .mini.c-violet（紫）             → 中性\n   3248 .ex:hover #c8f0e6（松石）        → 主色\n   3250 .ex.on #d7fff4（松石）           → 主色\n   3343 .fb.done::after #6fd29a（绿点）  → 主色\n   3495 .navstep.prev #f6d9b0（琥珀）    → 中性\n   3505 .wordnav.prev #d9c6f2（紫）      → 中性\n   3510 .wordnav.next #b8e8dd（松石）    → 主色 */\n\n/* ── 四来路：色相全下线，靠描边浓度与字重分档 ── */\n.rt{color:var(--fg2);background:rgba(var(--w),.05);border-color:rgba(var(--w),.12)}\n.rt.gif{color:var(--fg2);background:rgba(var(--w),.04);border-color:rgba(var(--w),.10)}\n.rt.post{color:var(--accent);background:rgba(var(--accent-rgb),.10);border-color:rgba(var(--accent-rgb),.28)}\n.rt.vid{color:var(--fg2);background:rgba(var(--w),.04);border-color:rgba(var(--w),.10)}\n.rt.art{color:var(--fg2);background:rgba(var(--w),.04);border-color:rgba(var(--w),.10)}\n\n/* ── 来路渐变块（303 / 1598 / 1602 这两组）── */\n.fx-src.green,.src-dot.green{background:linear-gradient(135deg,#97B1F0,#7E93C8)}\n.fx-src.amber,.src-dot.amber{background:linear-gradient(135deg,#E69089,#C9736C)}\n\n/* ── 状态点（303 / 307 的绿与琥珀渐变）── */\n.pip.ok{background:var(--accent);box-shadow:inset 0 .5px 1px rgba(255,255,255,.3),0 1px 2px rgba(var(--accent-rgb),.25)}\n.pip.warn{background:rgba(var(--w),.34);box-shadow:inset 0 .5px 1px rgba(255,255,255,.2),0 1px 2px rgba(0,0,0,.2)}\n.pip.bad{background:var(--danger);box-shadow:inset 0 .5px 1px rgba(255,255,255,.3),0 1px 2px rgba(230,144,137,.25)}\n.pip.now{background:var(--accent);animation:none}\n\n/* ── 状态小圆点 ── */\n.dg.on::after{background:var(--accent);box-shadow:0 0 0 2px rgba(var(--accent-rgb),.18)}\n.dg.warn::after{background:var(--danger);box-shadow:0 0 0 2px rgba(230,144,137,.18)}\n.dg.off::after{background:var(--ghost);box-shadow:none}\n.fb.done::after{background:var(--accent)}\n\n/* ── 角标 ── */\n.giftag{color:var(--fg2);background:rgba(0,0,0,.55);border:1px solid rgba(var(--w),.16)}\n\n/* ── 按钮的紫 / 松石 / 琥珀 ── */\n.mini.c-violet{color:var(--fg2);border-color:rgba(var(--w),.16);background:rgba(var(--w),.05)}\n.navstep.prev,.wordnav.prev{color:var(--fg2);border-color:rgba(var(--w),.16)}\n.navstep.next,.wordnav.next{color:var(--accent);border-color:rgba(var(--accent-rgb),.48)}\n.ex:hover{border-color:rgba(var(--accent-rgb),.45);color:var(--fg)}\n.ex.on{color:var(--fg);background:rgba(var(--accent-rgb),.16);border-color:rgba(var(--accent-rgb),.55)}\n\n:host{\n  display:block;position:relative;height:100%;overflow:auto;\n  background:linear-gradient(180deg,var(--bg-top),var(--bg-bottom));\n  color:var(--fg);\n  font-family:var(--sans);\n  -webkit-font-smoothing:antialiased;\n}\n:host([hidden]){display:none}\n/* shadow 里没有 body，宿主的 width 也不会自动传进来 —— 不写这几条，\n   .screen 是 flex column，宽度会被内容挤成 440px，表格和卡片全缩着。 */\n.etude-shell{width:100%;min-height:100%;box-sizing:border-box;max-width:1160px;margin:0 auto}\n.etude-shell>.screen{width:100%;box-sizing:border-box}\n.page,.screen{max-width:100%}\n/* 设计稿的牌组表是 5 列（目标 + 三个数字 + 齿轮），插件这边多一列「到哪一步」，\n   列模板多给一档，最后一格留给齿轮占位。不改 design/app.css —— 那是设计真源。 */\n.deckhead,.drow{grid-template-columns:minmax(0,1fr) 56px 56px 56px 96px 36px}\n.deckhead>.dnum,.drow>.dnum{text-align:right}\n.deckhead>.dnum.due,.drow>.dnum.due{justify-self:end;text-align:right}\n/* navstep 是 fixed 到视口左右下角的，宿主里会盖住学习页最后一行快捷键 —— 给底部留出它 */\n.screen.study{padding-bottom:64px}\n/* 两侧悬浮的 ‹ ›（.wordnav）贴在 .st2 边缘，会压住右栏那一行的数值一点 ——\n   试过给 .drail 加 padding-right:36 让开，结果右栏窄了、标签全折行，更糟；退回原样。 */\n"

/* ===================== 00-base.js ===================== */
/* 00 · 底座：一个小工具 + 图标 + 从宿主取主题 */
const h = React.createElement

const canUseDOM = typeof document !== 'undefined'

/** 把 design 里那套 svg path 收在一起，面板里到处要用 */
const ICON = {
  search: 'M11 4a7 7 0 1 0 4.2 12.6l3.6 3.6 1.4-1.4-3.6-3.6A7 7 0 0 0 11 4Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z',
  gear: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm-1-8h2l.4 2.3 1.6.7 2-1.2 1.4 1.4-1.2 2 .7 1.6L20 12v2l-2.3.4-.7 1.6 1.2 2-1.4 1.4-2-1.2-1.6.7L11 20H9l-.4-2.3-1.6-.7-2 1.2L3.6 16.8l1.2-2-.7-1.6L2 12V10l2.3-.4.7-1.6-1.2-2L4.9 4.4l2 1.2 1.6-.7L9 2Z',
  plug: 'M9 2v5h2V2h2v5h1a3 3 0 0 1 3 3v3a6 6 0 0 1-5 5.9V22h-2v-3.1A6 6 0 0 1 5 13V10a3 3 0 0 1 3-3h1V2Z',
  bolt: 'M13 2 4 14h6l-1 8 9-12h-6l1-8Z',
  play: 'M8 5v14l11-7L8 5Z',
  factory:
    'M4 20V9l4 2V9l4 2V9l4 2V6h4v14H4Zm2-2h12v-8.2l-4-2V10l-4-2v2.2L6 8.4V18Z',
}

function Icon({ name, size = 18 }) {
  const d = ICON[name]
  if (!d) return null
  return h(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'currentColor',
      'aria-hidden': 'true',
      style: { display: 'block', flex: '0 0 auto' },
    },
    h('path', { d }),
  )
}

/** design 的页面外壳：.page > main.screen */
function Screen({ className, children }) {
  return h('div', { className: 'page' }, h('main', { className: 'screen ' + (className || '') }, children))
}


/* ===================== 10-shell.js ===================== */
/* 10 · 外壳：Shadow DOM 容器 + 顶栏 + 页面路由
   样式全部来自 design/app.css（构建时转成 :host 形态），塞进 shadow root，
   所以不会和宿主的任何样式互相污染 —— 这是把打磨好的界面原样搬进插件的前提。 */

const { createPortal } = require('react-dom')

/** 把 children 渲染进一个 shadow root，CSP 与全局样式都碰不到里层 */
function ShadowHost({ theme = 'dark', children }) {
  const hostRef = useRef(null)
  const [mount, setMount] = useState(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host || !canUseDOM) return
    let root = host.shadowRoot
    if (!root) root = host.attachShadow({ mode: 'open' })
    // 只在第一次挂 style，后面重渲染不要再覆盖，否则动画会重放
    if (!root.querySelector('style[data-etude]')) {
      const style = document.createElement('style')
      style.setAttribute('data-etude', '')
      style.textContent = __CSS__
      root.appendChild(style)
    }
    let box = root.querySelector('.etude-mount')
    if (!box) {
      box = document.createElement('div')
      box.className = 'etude-mount'
      box.style.height = '100%'
      root.appendChild(box)
    }
    setMount(box)
  }, [])

  useEffect(() => {
    const host = hostRef.current
    if (host) host.setAttribute('data-theme', theme)
  }, [theme])

  return h(
    'div',
    {
      ref: hostRef,
      'data-etude-host': '',
      style: { display: 'block', height: '100%', minHeight: 0, contain: 'layout style' },
    },
    mount ? createPortal(children, mount) : null,
  )
}

/** 顶栏：设计稿里那一排（插件 / 卡片·工厂·统计 / 搜索 / 设置）
    注意 design/app.css 里是 `.tabs a`（第 167 行），不是 button —— 用 button 会没样式。 */
function Topbar({ page, onPage }) {
  const tabs = [
    ['cards', '卡片'],
    ['factory', '工厂'],
    ['stats', '统计'],
  ]
  return h(
    'div',
    { className: 'topbar' },
    h(
      'div',
      { className: 'tb-left' },
      h(
        'button',
        { className: 'pill', type: 'button', title: 'dsh-etude · 卡片工厂' },
        h(Icon, { name: 'plug', size: 16 }),
        h('span', null, '插件'),
      ),
    ),
    h(
      'nav',
      { className: 'tabs', role: 'tablist' },
      tabs.map(([id, label]) =>
        h(
          'a',
          {
            key: id,
            href: '#',
            role: 'tab',
            'aria-selected': page === id ? 'true' : 'false',
            className: page === id ? 'on' : '',
            onClick: (e) => {
              e.preventDefault()
              onPage(id)
            },
          },
          label,
        ),
      ),
    ),
    h(
      'div',
      { className: 'tb-right' },
      h(
        'button',
        { className: 'icobtn', type: 'button', title: '搜索', 'aria-label': '搜索' },
        h(Icon, { name: 'search', size: 18 }),
      ),
      h(
        'button',
        {
          className: 'icobtn' + (page === 'settings' ? ' on' : ''),
          type: 'button',
          title: '设置',
          'aria-label': '设置',
          onClick: () => onPage('settings'),
        },
        h(Icon, { name: 'gear', size: 18 }),
      ),
    ),
  )
}


/* ===================== 20-bridge.js ===================== */
/* 20 · 数据层：所有事实都从宿主那边的 /etude RPC 取
   形状照 lib/rpc.js 的 `state` 端点与 lib/packs.js 的 listPacks —— 不发明字段。
   核实过的地方标了行号，改动那边时记得回来对一眼。 */

const RPC_CHANNEL = '/etude'

/** rpc 可能是通道本身，也可能是「取通道」的函数（apply 那一刻 connection 可能还没就绪）*/
async function callRpc(rpc, endpoint, payload) {
  const bridge = typeof rpc === 'function' ? rpc() : rpc
  if (!bridge || typeof bridge.call !== 'function') {
    throw new Error('宿主连接还没就绪。刷新一下页面再试；还是空的话，去 设置 → 插件 看 dsh-etude 是不是 active。')
  }
  let timer = null
  const timeout = new Promise((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`宿主 15 秒没回应（${endpoint}）。刷新页面重试。`)), 15000)
  })
  const body = payload === undefined || payload === null ? {} : payload
  let result
  try {
    result = await Promise.race([bridge.call(RPC_CHANNEL, endpoint, body), timeout])
  } finally {
    if (timer) clearTimeout(timer)
  }
  if (!result || result.ok !== true) {
    const message = result?.error?.message ?? '接口调用失败'
    const error = new Error(message)
    error.code = result?.error?.code
    throw error
  }
  return result.value
}

/** 宿主状态：packs / jobs / settings / selfcheck / root / version */
function useFactory(rpc) {
  const [state, setState] = useState({ status: 'loading', packs: [], jobs: [] })
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    try {
      const value = await callRpc(rpc, 'state')
      setState({ status: 'ready', ...value })
      setError(null)
      return value
    } catch (failure) {
      setState((prev) => ({ ...prev, status: 'error' }))
      setError(failure.message)
      return null
    }
  }, [rpc])

  useEffect(() => {
    reload()
  }, [reload])

  return { state, error, reload }
}

/* lib/packs.js 实际写的状态（第 112/157/188/258/275/791 行）：
   generating → text → media → packed → exported，任何一步失败是 failed。
   这里的中文是给人看的，键名必须跟后端一模一样，否则「到哪一步」那一列会全空。 */
const STATUS_TEXT = {
  generating: '正在造',
  text: '例句好了',
  media: '配素材',
  packed: '能出厂',
  exported: '已导出',
  failed: '上次出错',
}

/** 包 → 卡片页那一行。
    设计稿那套「未学习 / 学习中 / 待复习」是 Anki 的调度口径，插件没有调度引擎，
    所以列换成插件真有的四个数：例句 / 配图 / 语音 / 到哪一步。
    注意 progress.done 是布尔（lib/store.js:130），不是计数器 —— 别拿它加总。 */
function packRows(state) {
  const packs = Array.isArray(state?.packs) ? state.packs : []
  return packs.map((pack) => {
    const progress = pack?.progress ?? {}
    const total = progress.total ?? 0
    return {
      id: pack.id,
      name: pack.target || '(未命名)',
      kind: pack.kind || 'word',
      gloss: pack.gloss || '',
      examples: total,
      images: progress.images ?? 0,
      audios: progress.audios ?? 0,
      ready: progress.done === true,
      learnable: pack.learnable === true,
      status: pack.status || 'generating',
      statusText: STATUS_TEXT[pack.status] || pack.status || '未知',
      exportedAt: pack.exportedAt || null,
      lastError: pack.lastError || null,
    }
  })
}

/** 「接着练」挑哪个包：先挑还没能出厂的，全都能出厂了就挑最近改过的那个。
    注意 listPacks 不返回例句（lib/packs.js:223-238），要句子得再调一次 pack.get。 */
function nextUp(state) {
  const packs = Array.isArray(state?.packs) ? state.packs : []
  if (!packs.length) return null
  const pending = packs.find((one) => one?.progress?.done !== true) || packs[packs.length - 1]
  return pending
}

/** 图 / 音 只走 RPC 拿字节，不走 HTTP 路由。宿主给的是 base64，直接拼 data URL。 */
function mimeOf(file) {
  const name = String(file || '').toLowerCase()
  if (name.endsWith('.png')) return 'image/png'
  if (name.endsWith('.webp')) return 'image/webp'
  if (name.endsWith('.gif')) return 'image/gif'
  if (name.endsWith('.mp3')) return 'audio/mpeg'
  if (name.endsWith('.wav')) return 'audio/wav'
  if (name.endsWith('.ogg')) return 'audio/ogg'
  return 'image/jpeg'
}

function dataUrlOf(file, base64) {
  return `data:${mimeOf(file)};base64,${base64}`
}


/* ===================== 40-cards.js ===================== */
/* 40 · 卡片页：包列表 + 接着练
   结构照 design/gen.mjs:201-412，类名与 app.css 对齐；但列换成插件真实有的四个数
   （例句 / 配图 / 语音 / 到哪一步）—— 设计稿那套 Anki 的未学习/学习中/待复习，
   插件这边还没有调度引擎，不能画不存在的数。 */

function PackRow({ row, onOpen }) {
  return h(
    'div',
    { className: 'drow parent', onClick: onOpen, style: { cursor: 'pointer' } },
    h(
      'span',
      { className: 'dname' },
      h('i', { className: 'caret', 'aria-hidden': 'true' }),
      h('a', { href: '#', onClick: (e) => e.preventDefault(), title: row.id }, row.name),
      h('span', { className: 'chip' }, row.kind === 'sentence' ? '整句' : row.kind === 'phrase' ? '说法' : '单词'),
    ),
    h('span', { className: 'dnum' }, String(row.examples)),
    h('span', { className: 'dnum learn' }, String(row.images)),
    h('span', { className: 'dnum' }, String(row.audios)),
    h('span', { className: 'dnum due' + (row.ready ? '' : ' z') }, row.statusText),
    h('span', { className: 'dgear' }),
  )
}

function CardsPage({ rpc, state, error, onReload, onGo }) {
  const rows = packRows(state)
  const target = nextUp(state)
  const [sample, setSample] = useState(null)
  const loading = state?.status === 'loading'

  //「接着练」要一句真的句子。listPacks 不带 examples（lib/packs.js:223-238），
  //所以要单独拉一次 pack.get —— 拉不到就老老实实说拉不到。
  useEffect(() => {
    let alive = true
    if (!target) {
      setSample(null)
      return () => {}
    }
    callRpc(rpc, 'pack.get', { id: target.id })
      .then((pack) => {
        if (!alive) return
        const examples = Array.isArray(pack?.examples) ? pack.examples : []
        setSample(examples[0] || null)
      })
      .catch(() => {
        if (alive) setSample(null)
      })
    return () => {
      alive = false
    }
  }, [rpc, target?.id])

  return h(
    Screen,
    { className: 'half' },
    h(
      'header',
      { className: 'hdr' },
      h('h1', null, '卡片'),
      h(
        'div',
        { className: 'act' },
        h('span', { className: 'chip live' }, h('i'), state?.root ? '账本已连' : '还没连上'),
      ),
    ),

    error
      ? h(
          'div',
          { className: 'card', style: { padding: '20px 24px', display: 'grid', gap: 12 } },
          h('div', { className: 'sec-title' }, '没取到数据'),
          h('p', { className: 'mut' }, error),
          h('button', { className: 'btn ghost', type: 'button', onClick: onReload }, '重试'),
        )
      : null,

    h(
      'div',
      { className: 'cards2' },
      h(
        'div',
        { className: 'c-l' },
        h(
          'section',
          { className: 'card deckcard' },
          h(
            'div',
            { className: 'deckhead' },
            h('span', { className: 'dname' }, '目标'),
            h('span', { className: 'dnum' }, '例句'),
            h('span', { className: 'dnum' }, '配图'),
            h('span', { className: 'dnum' }, '语音'),
            h('span', { className: 'dnum due' }, '到哪一步'),
            h('span', { className: 'dgear' }),
          ),
          loading
            ? h('div', { className: 'drow parent' }, h('span', { className: 'mut' }, '正在取账本…'))
            : rows.length
              ? rows.map((row) =>
                  h(PackRow, { key: row.id, row, onOpen: () => onGo && onGo('factory') }),
                )
              : h(
                  'div',
                  { className: 'drow parent', style: { height: 'auto', padding: '28px 16px' } },
                  h(
                    'span',
                    { className: 'mut' },
                    '还没有任何包。去「工厂」输入一个词、一个说法或者一整句，点「造一个包」——第一个包不用你配任何东西。',
                  ),
                ),
        ),
        h(
          'p',
          { className: 'deckstat' },
          rows.length
            ? `一共 ${rows.length} 个包，${rows.reduce((sum, one) => sum + one.examples, 0)} 条例句。`
            : '这一屏是空的，因为账本里还没有包。',
        ),
      ),
      h(
        'aside',
        { className: 'c-r' },
        h(
          'section',
          { className: 'card nextup' },
          h('div', { className: 'sec-title' }, '接着练'),
          target
            ? [
                h('div', { className: 'word', key: 'w' }, target.target),
                h(
                  'p',
                  { className: 'qline', key: 'q' },
                  sample?.sentence || (sample === null ? '例句还没取到' : '这个包还没有例句'),
                ),
                h(
                  'p',
                  { className: 'mut', key: 'm' },
                  sample?.sceneZh || sample?.sceneEn || (target.lastError ? `上次出错：${target.lastError}` : ''),
                ),
              ]
            : [
                h('div', { className: 'word', key: 'w' }, '还没有包'),
                h('p', { className: 'mut', key: 'm' }, '造一个包之后，这里会挑出下一个该练的句子。'),
              ],
          h(
            'div',
            { className: 'faces' },
            ['听', '说', '读', '写', '改'].map((f, i) =>
              h(
                'span',
                { key: f, className: 'face' },
                h('i', { className: 'pip ' + (i === 2 ? 'ok' : i < 2 ? 'warn' : '') }),
                f,
              ),
            ),
          ),
          h(
            'div',
            { className: 'nextup-foot' },
            h(
              'button',
              {
                className: 'btn primary',
                type: 'button',
                disabled: !target,
                onClick: () => target && onGo && onGo('study'),
              },
              '练这一句',
            ),
          ),
        ),
      ),
    ),

    h(
      'div',
      { className: 'deckfoot' },
      h('button', { className: 'btn ghost', type: 'button', onClick: onReload }, '刷新'),
      h('button', { className: 'btn ghost', type: 'button', onClick: () => onGo && onGo('factory') }, '造一个包'),
      h('button', { className: 'btn ghost', type: 'button', onClick: () => onGo && onGo('factory') }, '看素材'),
    ),
  )
}


/* ===================== 45-study.js ===================== */
/* 45 · 学习页：拿一个包的一条例句，分五个面（听 / 说 / 读 / 写 / 改）练它
   结构照 design/gen.mjs:2849-2973 —— 顶上五个面、中间七块抽屉、右边解释栏、底下四个评分键，
   类名一律用 design/app.css 里已经有的（没加一个新类）。

   跟设计稿不一样的地方，全是插件现在真没有的能力，所以换成实话而不是画假：
   · 说面要录音 —— 插件取不到麦克风，账本里也没有存录音的字段，那个按钮只能禁着，
     并且因此「说」这一面永远算不出完成度，就老实写「还没开始」；
   · 写面打出来的字不落账本，只存在于这一页的 state 里，换一张就没了；
   · 评分键没有调度引擎（账本里没有 due / interval / ease 这些字段），点了只在本页记一次，
     不排「几天后再见」，也不上报；
   · 设计稿的动图/视频链接、「英文」小窗浮层没有对应数据，换成真实的图片署名行和页内开关；
   · 五面的完成状态全部从 pack.get 回来的字段算，算不出来就是「还没开始」。

   这个分片只定义组件，不注册插槽 —— 挂到哪一页由 90-app.js 决定。 */

/** 五个面：名字、设计稿里那句提示（2884 行）、这一面默认摊开 / 点亮的抽屉 */
function STUDY_faces() {
  return [
    { id: 'listen', label: '听', hint: '声音 → 画面', open: ['audio', 'rec'], lit: ['audio', 'rec'] },
    { id: 'speak', label: '说', hint: '画面 → 声音', open: ['media', 'rec'], lit: ['media', 'rec'] },
    { id: 'read', label: '读', hint: '句子 → 画面', open: ['sent'], lit: ['sent', 'bg'] },
    { id: 'write', label: '写', hint: '画面 → 拼写', open: ['media', 'type'], lit: ['media', 'type', 'bg'] },
    { id: 'vary', label: '改', hint: '换一个说法', open: ['sent', 'vary'], lit: ['sent', 'media', 'bg'] },
  ]
}

/** 七块抽屉：key 就是设计稿的 data-drw，标题与副标题照 2880-2935 行 */
function STUDY_drawers() {
  return [
    { key: 'bg', title: '背景', mut: '这句话在什么场合说、谁在说、说完会怎样' },
    { key: 'media', title: '图 · 资源', mut: '一张挑过的照片，加它的出处' },
    { key: 'sent', title: '句子', mut: '练的那一句本身' },
    { key: 'audio', title: '声音', mut: '母语者念的这一个句子' },
    { key: 'rec', title: '录音', mut: '按住说一遍，松手结束' },
    { key: 'type', title: '打字', mut: '看着场面把句子写出来' },
    { key: 'vary', title: '换一个说法', mut: '同一个场面，换掉中间那个词' },
  ]
}

/** 挑一个包：能出厂的优先（例句、图、语音都齐了才 learnable），其次没失败的，最后随便一个 */
function STUDY_pickPack(packs) {
  const list = Array.isArray(packs) ? packs : []
  if (!list.length) return null
  return (
    list.find((one) => one && one.learnable) ||
    list.find((one) => one && one.status !== 'failed') ||
    list[0]
  )
}

function STUDY_has(list, value) {
  return Array.isArray(list) && list.indexOf(value) >= 0
}

/** 秒数：账本里 audio.seconds 是 3.288 这种小数，别直接怼给用户看 */
function STUDY_secs(seconds) {
  const value = Number(seconds)
  if (!isFinite(value) || value <= 0) return ''
  if (value >= 60) return Math.round(value / 60) + ' 分钟'
  return (Math.round(value * 10) / 10).toFixed(1) + 's'
}

function STUDY_words(sentence) {
  const text = typeof sentence === 'string' ? sentence.trim() : ''
  if (!text) return 0
  return text.split(/\s+/).length
}

/** 句子里把 target 原词包成 <b class="tgt">；找不到就原样返回，不硬凑高亮 */
function STUDY_sentenceParts(sentence, target) {
  const text = typeof sentence === 'string' ? sentence : ''
  const word = typeof target === 'string' ? target.trim() : ''
  if (!text) return []
  if (!word) return [text]
  const at = text.toLowerCase().indexOf(word.toLowerCase())
  if (at < 0) return [text]
  return [
    text.slice(0, at),
    h('b', { className: 'tgt', key: 'tgt' }, text.slice(at, at + word.length)),
    text.slice(at + word.length),
  ]
}

/** 「换一个说法」的全部材料：pack.swaps 是唯一的英文替换候选，zhVariants 是中文说法 */
function STUDY_varyRows(pack, example) {
  const swaps = Array.isArray(pack && pack.swaps) ? pack.swaps : []
  const roles = []
  swaps.forEach((swap) => {
    const candidates = Array.isArray(swap && swap.candidates)
      ? swap.candidates.filter((one) => typeof one === 'string' && one.trim())
      : []
    if (!candidates.length) return
    roles.push({
      role: typeof swap.role === 'string' ? swap.role.trim() : '',
      original: (typeof swap.original === 'string' && swap.original.trim()) || (pack && pack.target) || '',
      candidates,
    })
  })
  const zh = Array.isArray(example && example.zhVariants)
    ? example.zhVariants.filter((one) => typeof one === 'string' && one.trim())
    : []
  const total = roles.reduce((sum, one) => sum + one.candidates.length, 0)
  return { roles, zh, total }
}

/** 背景那几条：只用账本里真有的字段，缺哪条就不出哪条 */
function STUDY_bgRows(pack, example, showEn, showZh) {
  const rows = []
  if (!example) return rows
  if (showZh && example.sceneZh) rows.push(['场面（中）', example.sceneZh])
  if (showEn && example.sceneEn) rows.push(['场面（英）', example.sceneEn])
  if (example.register) rows.push(['语域', example.register])
  if (example.voiceHint) rows.push(['念的时候', example.voiceHint])
  if (pack && pack.gloss) rows.push(['释义', pack.gloss])
  if (pack && pack.ipa) rows.push(['音标', pack.ipa])
  return rows
}

/** 打字对一下原文：只比字母数字，标点大小写不算错。不判分，只给一句话 */
function STUDY_typedVerdict(typed, sentence) {
  const got = String(typed || '')
  if (!got.trim()) return ''
  const clean = (one) =>
    String(one || '')
      .toLowerCase()
      .replace(/[^a-z0-9'\s]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  const want = clean(sentence)
  if (!want) return got.trim() === String(sentence || '').trim() ? '一样' : '还不一样'
  return clean(got) === want ? '一样' : '还不一样'
}

/** 换说法后的那一行：<s>原词</s> <b>新词</b>，原词拼不进句子就直说 */
function STUDY_swappedParts(sentence, picked) {
  const text = typeof sentence === 'string' ? sentence : ''
  if (!picked) return [text || '（这一条还没有句子）']
  const original = picked.original || ''
  const at = original ? text.toLowerCase().indexOf(original.toLowerCase()) : -1
  if (at < 0) {
    return [
      h('s', { key: 'old' }, original),
      ' ',
      h('b', { key: 'new' }, picked.candidate),
      ' —— 账本里这句没有这个词，拼不回整句，先把替换对摆在这儿。',
    ]
  }
  return [
    text.slice(0, at),
    h('s', { key: 'old' }, text.slice(at, at + original.length)),
    ' ',
    h('b', { key: 'new' }, picked.candidate),
    text.slice(at + original.length),
  ]
}

/** 五面的「有没有」：全部从账本字段算，算不出来就是「还没开始」 —— 一个数都不编 */
function STUDY_faceState(pack, example, typedText) {
  const audio = example && example.audio && example.audio.file ? example.audio : null
  const image = example && example.image && example.image.file ? example.image : null
  const vary = STUDY_varyRows(pack, example)
  const listen = Boolean(audio)
  const read = Boolean(image)
  const write = Boolean(typedText && String(typedText).trim())
  return {
    // 听：账本里这条有 audio.file（顺带把秒数说出来，那是真数据）
    listen: { ok: listen, text: listen ? (STUDY_secs(audio.seconds) ? '有语音 ' + STUDY_secs(audio.seconds) : '有语音') : '还没开始' },
    // 说：要用户录音。插件没有录音能力，账本里也没有这个字段 —— 永远「还没开始」
    speak: { ok: false, text: '还没开始' },
    // 读：账本里这条有 image.file
    read: { ok: read, text: read ? '有配图' : '还没开始' },
    // 写：这一页里真的打过字（只在本页记着，不落账本）
    write: { ok: write, text: write ? '写过一遍' : '还没开始' },
    // 改：有英文替换候选（pack.swaps）或中文说法（zhVariants）
    vary: {
      ok: vary.total > 0 || vary.zh.length > 0,
      text: vary.total ? vary.total + ' 个换法' : vary.zh.length ? vary.zh.length + ' 种中文说法' : '还没开始',
    },
  }
}

/** 抽屉里的「这块是空的」：一句人话，不装忙 */
function STUDY_note(text, key) {
  return h('p', { className: 'mut', key: key || undefined, style: { margin: 0 } }, text)
}

/** 一张说清楚的卡片：标题 + 一句人话 + 至多一个按钮 */
function STUDY_card(title, text, actionLabel, onAction) {
  const children = [h('div', { className: 'sec-title', key: 't' }, title)]
  if (text) children.push(h('p', { className: 'mut', key: 'm' }, text))
  if (actionLabel) {
    children.push(
      h(
        'button',
        { key: 'b', className: 'btn ghost', type: 'button', disabled: !onAction, onClick: onAction || undefined },
        actionLabel,
      ),
    )
  }
  return h('div', { className: 'card', style: { padding: '20px 24px', display: 'grid', gap: 12, maxWidth: 680 } }, children)
}

/** 一个面：上面是名字，下面 <i> 里是设计稿那句提示 + 这一面真实的状态 */
function StudyFace(props) {
  const classes = ['fb']
  if (props.active) classes.push('on')
  if (props.status && props.status.ok) classes.push('done')
  return h(
    'button',
    {
      className: classes.join(' '),
      type: 'button',
      'data-face': props.face.id,
      'aria-pressed': props.active ? 'true' : 'false',
      onClick: () => props.onPick(props.face.id),
    },
    props.face.label,
    h('i', null, props.face.hint + ' · ' + (props.status ? props.status.text : '还没开始')),
  )
}

/** 一块抽屉：结构照 design/study.html:127-129 —— .drw > button.drw-h + div.drw-b > div.drw-p */
function StudyDrawer(props) {
  const classes = ['drw']
  if (props.open) classes.push('open')
  if (props.lit) classes.push('lit')
  if (props.off) classes.push('off')
  return h(
    'div',
    { className: classes.join(' '), 'data-drw': props.def.key },
    h(
      'button',
      {
        className: 'drw-h',
        type: 'button',
        'data-drw': props.def.key,
        'aria-expanded': props.open ? 'true' : 'false',
        onClick: () => props.onToggle(props.def.key),
      },
      h('b', null, props.def.title),
      h('span', { className: 'mut' }, props.def.mut),
      h('span', { className: 'sp' }),
      h('span', { className: 'car' }, '▾'),
    ),
    h('div', { className: 'drw-b' }, h('div', { className: 'drw-p' }, props.children)),
  )
}

function StudyPage(props) {
  const own = useFactory(props.rpc || props.getRpc || null)
  const given = props.state !== undefined && props.state !== null
  const state = given ? props.state : own.state
  const failure = given ? props.error || null : own.error
  const reload = props.onReload || own.reload
  // rpc 塞进 ref：换一页的时候不该因为它是不是新函数而重新取一遍
  const rpcRef = useRef(props.rpc || props.getRpc || null)
  rpcRef.current = props.rpc || props.getRpc || null

  const onGoCards = props.onGo
    ? () => props.onGo('cards')
    : null

  const packs = Array.isArray(state && state.packs) ? state.packs : []
  const loading = Boolean(state && state.status === 'loading')
  const auto = STUDY_pickPack(packs)

  const [pickedId, setPickedId] = useState(null)
  const picked = pickedId ? packs.find((one) => one && one.id === pickedId) || null : null
  const chosen = picked || auto
  const chosenId = chosen && chosen.id ? chosen.id : null

  // 列表里的 pack 只有 progress，没有 examples —— 句子、图、语音都得再问一次 pack.get
  const [detail, setDetail] = useState({ id: null, status: 'idle', pack: null, error: null })
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    if (!chosenId) {
      setDetail({ id: null, status: 'idle', pack: null, error: null })
      return undefined
    }
    let alive = true
    setDetail({ id: chosenId, status: 'loading', pack: null, error: null })
    callRpc(rpcRef.current, 'pack.get', { id: chosenId })
      .then((value) => {
        if (!alive) return
        setDetail({ id: chosenId, status: 'ready', pack: value, error: null })
      })
      .catch((why) => {
        if (!alive) return
        setDetail({ id: chosenId, status: 'error', pack: null, error: (why && why.message) || '这一包没取过来' })
      })
    return () => {
      alive = false
    }
  }, [chosenId, retry])

  const pack = detail.pack && detail.pack.id === chosenId ? detail.pack : chosen
  const examples = Array.isArray(pack && pack.examples) ? pack.examples : []
  const [exIdx, setExIdx] = useState(0)
  const index = examples.length ? Math.max(0, Math.min(exIdx, examples.length - 1)) : 0
  const example = examples[index] || null

  const [face, setFace] = useState('read')
  const [toggled, setToggled] = useState({})
  const [typed, setTyped] = useState({})
  const [marks, setMarks] = useState({})
  const [pickedSwap, setPickedSwap] = useState(null)
  const [showEn, setShowEn] = useState(true)
  const [showZh, setShowZh] = useState(true)
  const [imgStage, setImgStage] = useState(0)
  const [audioBroken, setAudioBroken] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const audioRef = useRef(null)

  const stamp = chosenId && example ? chosenId + ':' + example.ord : ''
  // 换一条句子，播放/取图/换词这些一次性的东西全部归零
  useEffect(() => {
    setImgStage(0)
    setAudioBroken(false)
    setPlaying(false)
    setElapsed(0)
  }, [stamp])

  const faces = STUDY_faces()
  const drawers = STUDY_drawers()
  const active = faces.find((one) => one.id === face) || faces[0]
  const recordKey = stamp
  const typedText = recordKey ? typed[recordKey] || '' : ''
  const faceState = STUDY_faceState(pack, example, typedText)
  const vary = STUDY_varyRows(pack, example)
  const bgRows = STUDY_bgRows(pack, example, showEn, showZh)
  const mark = recordKey ? marks[recordKey] || null : null
  const packIndex = packs.findIndex((one) => one && one.id === chosenId)
  const grades = [
    { id: 'again', label: '重来' },
    { id: 'hard', label: '困难' },
    { id: 'good', label: '良好' },
    { id: 'easy', label: '简单' },
  ]

  function isOpen(key) {
    return toggled[key] === undefined ? STUDY_has(active.open, key) : Boolean(toggled[key])
  }

  function isLit(key) {
    return STUDY_has(active.lit, key)
  }

  function encouraged(key) {
    return isOpen(key) || isLit(key)
  }

  function toggleDrawer(key) {
    setToggled((prev) => {
      const now = prev[key] === undefined ? STUDY_has(active.open, key) : Boolean(prev[key])
      const next = { ...prev }
      next[key] = !now
      return next
    })
  }

  function openAll(value) {
    const next = {}
    drawers.forEach((one) => {
      next[one.key] = value
    })
    setToggled(next)
  }

  function stepExample(delta) {
    if (!examples.length) return
    setExIdx(Math.max(0, Math.min(index + delta, examples.length - 1)))
  }

  function stepPack(delta) {
    if (!packs.length || packIndex < 0) return
    const to = packIndex + delta
    if (to < 0 || to >= packs.length) return
    setPickedId(packs[to].id)
    setExIdx(0)
    setPickedSwap(null)
  }

  function stepFace(delta) {
    const list = STUDY_faces()
    const at = list.findIndex((one) => one.id === face)
    const to = ((at < 0 ? 0 : at) + delta + list.length) % list.length
    setFace(list[to].id)
  }

  function rate(gradeId) {
    if (!recordKey) return
    setMarks((prev) => {
      const before = prev[recordKey]
      const times = before && before.grade === gradeId ? before.times + 1 : 1
      const next = { ...prev }
      next[recordKey] = { grade: gradeId, times }
      return next
    })
  }

  function play() {
    const node = audioRef.current
    if (!node || typeof node.play !== 'function') {
      setAudioBroken(true)
      return
    }
    if (playing) {
      try {
        node.pause()
      } catch (ignored) {}
      setPlaying(false)
      return
    }
    setElapsed(0)
    let started = null
    try {
      started = node.play()
    } catch (ignored) {
      setAudioBroken(true)
      return
    }
    setPlaying(true)
    if (started && typeof started.catch === 'function') {
      started.catch(() => {
        setPlaying(false)
        setAudioBroken(true)
      })
    }
  }

  function replay() {
    const node = audioRef.current
    if (!node) return
    setElapsed(0)
    if (typeof node.play !== 'function') {
      setAudioBroken(true)
      return
    }
    try {
      node.currentTime = 0
      const started = node.play()
      setPlaying(true)
      if (started && typeof started.catch === 'function') {
        started.catch(() => {
          setPlaying(false)
          setAudioBroken(true)
        })
      }
    } catch (ignored) {
      setAudioBroken(true)
    }
  }

  // 1-4 评分、左右换面 —— 这两样是真做了的，所以底下那行键盘提示才敢写
  useEffect(() => {
    if (typeof window === 'undefined' || !window || typeof window.addEventListener !== 'function') return undefined
    function onKey(event) {
      const node = event.target
      const tag = node && node.tagName ? String(node.tagName).toUpperCase() : ''
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (node && node.isContentEditable)) return
      const key = event.key || ''
      const order = ['again', 'hard', 'good', 'easy']
      if (key >= '1' && key <= '4') {
        if (event.preventDefault) event.preventDefault()
        rate(order[Number(key) - 1])
        return
      }
      if (key === 'ArrowLeft') {
        if (event.preventDefault) event.preventDefault()
        stepFace(-1)
        return
      }
      if (key === 'ArrowRight') {
        if (event.preventDefault) event.preventDefault()
        stepFace(1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  /** 每一块抽屉里的东西：没有就写清楚没有，不拿设计稿的假数据顶 */
  function drawerBody(key) {
    if (key === 'bg') {
      if (!bgRows.length) return STUDY_note('这个包没记场面：中文场景、英文场景、语域、念法提示都是空的。')
      return h(
        'ul',
        { className: 'dlist' },
        bgRows.map((row, at) => h('li', { key: at }, h('b', null, row[0]), row[1])),
      )
    }

    if (key === 'media') {
      const image = example && example.image && example.image.file ? example.image : null
      if (!image) return STUDY_note('这一条还没有配图 —— 账本里 image 是空的。去卡片页给它挑一张候选图，挑完这里就有了。')
      const out = []
      if (imgStage < 2) {
        const src =
          imgStage === 0
            ? '/etude/media/images/' + encodeURIComponent(image.file)
            : '/etude/pack/' + encodeURIComponent((pack && pack.id) || '') + '/images/' + encodeURIComponent(image.file)
        out.push(
          h(
            'figure',
            { className: 'shot', key: 'shot' },
            h('img', {
              src,
              alt: (example && example.sentence) || '这一句的场面',
              onError: () => setImgStage((stage) => stage + 1),
            }),
            h('span', { className: 'giftag' }, '静图'),
          ),
        )
      } else {
        out.push(
          STUDY_note('图在磁盘上，但这边的两条媒体路由都取不到它（/etude/media/images 和 /etude/pack/<id>/images 都空了）。', 'noimg'),
        )
      }
      const credit = image.creditUrl || image.licenseUrl || ''
      const who = [image.author, image.license].filter(Boolean).join(' · ')
      if (credit || who) {
        out.push(
          h(
            'ul',
            { className: 'rlink', key: 'rlink' },
            h(
              'li',
              null,
              h('span', { className: 'rt post' }, '出处'),
              credit ? h('a', { href: credit, target: '_blank', rel: 'noreferrer' }, who || credit) : h('span', { className: 'mut' }, who),
            ),
          ),
        )
      }
      out.push(
        h(
          'p',
          { className: 'tnote', key: 'meta' },
          [image.width && image.height ? image.width + '×' + image.height : '', image.source || '', image.file]
            .filter(Boolean)
            .join(' · '),
        ),
      )
      return out
    }

    if (key === 'sent') {
      if (!example || !example.sentence) return STUDY_note('这一条还没有句子。')
      const out = [h('p', { className: 'big', key: 'big' }, STUDY_sentenceParts(example.sentence, pack && pack.target))]
      out.push(h('p', { className: 'tnote', key: 'meta' }, STUDY_words(example.sentence) + ' 词 · 第 ' + example.ord + ' 条'))
      return out
    }

    if (key === 'audio') {
      const audio = example && example.audio && example.audio.file ? example.audio : null
      if (!audio) return STUDY_note('这一条还没有语音 —— 账本里 audio 是空的。')
      const ratio = audio.seconds > 0 ? Math.min(1, elapsed / audio.seconds) : 0
      const bars = []
      for (let at = 0; at < 20; at += 1) {
        bars.push(h('i', { key: at, className: (at + 1) / 20 <= ratio ? 'on' : undefined }))
      }
      const out = [
        h(
          'div',
          { className: 'arow', key: 'row' },
          h(
            'button',
            { className: 'pp', type: 'button', 'aria-label': playing ? '暂停' : '播放', onClick: play },
            h('span', null, playing ? '❚❚' : '▶'),
          ),
          h('div', { className: 'wave' }, bars),
          h('span', { className: 'dur' }, STUDY_secs(audio.seconds) || '?'),
          h('button', { className: 'mini', type: 'button', onClick: replay }, '再放一遍'),
        ),
        h('audio', {
          key: 'el',
          ref: audioRef,
          src: '/etude/media/audio/' + encodeURIComponent(audio.file),
          preload: 'none',
          style: { display: 'none' },
          onTimeUpdate: (event) => setElapsed((event.currentTarget && event.currentTarget.currentTime) || 0),
          onEnded: () => {
            setPlaying(false)
            setElapsed(0)
          },
          onError: () => setAudioBroken(true),
        }),
        h(
          'p',
          { className: 'tnote', key: 'meta' },
          [audio.engine, audio.voice, audio.rate, audio.file].filter(Boolean).join(' · '),
        ),
      ]
      if (audioBroken) {
        out.push(
          STUDY_note(
            '这条音频放不出来：要么文件不在 /etude/media/audio 下，要么名字不合那条路由的规矩（得是「字母-20 位十六进制.mp3」）。上面那行是账本里记的元数据。',
            'broken',
          ),
        )
      }
      return out
    }

    if (key === 'rec') {
      return h(
        'div',
        { className: 'arow' },
        h(
          'button',
          {
            className: 'mic',
            type: 'button',
            disabled: true,
            'aria-label': '按住说话（还没接）',
            title: '插件现在取不到麦克风，也没有存录音的地方',
          },
          h('span', null, '●'),
        ),
        h(
          'div',
          { className: 'rechint' },
          h('b', null, '录音还没接'),
          h('span', { className: 'mut' }, '插件既没有取麦克风的能力，账本里也没有存录音的字段 —— 这一面现在练不了，所以「说」那一条永远显示「还没开始」。'),
        ),
      )
    }

    if (key === 'type') {
      const verdict = STUDY_typedVerdict(typedText, example && example.sentence)
      return [
        h('input', {
          key: 'tin',
          className: 'tin',
          value: typedText,
          placeholder: '听到/看到这个场面，句子是什么？',
          autoComplete: 'off',
          spellCheck: false,
          onChange: (event) => {
            const value = event.target.value
            if (!recordKey) return
            setTyped((prev) => {
              const next = { ...prev }
              next[recordKey] = value
              return next
            })
          },
        }),
        h(
          'span',
          { className: 'tnote', key: 'note' },
          verdict === '一样' ? '和账本里那句一样。' : verdict ? '和账本里那句还不太一样（可能只是标点或大小写）。' : '写不写都行',
          h('span', { className: 'fold' }, '打出来的字只留在这一页：不上报、不打分，换一张就没了。'),
        ),
      ]
    }

    if (key === 'vary') {
      const out = []
      if (vary.roles.length) {
        vary.roles.forEach((one, at) => {
          out.push(
            h('p', { className: 'mut', key: 'lb' + at, style: { margin: '0 0 6px' } }, one.role ? one.role + ' · 把 ' + one.original + ' 换掉' : '把 ' + one.original + ' 换掉'),
          )
          out.push(
            h(
              'div',
              { className: 'chips', key: 'ch' + at },
              one.candidates.map((candidate) =>
                h(
                  'span',
                  {
                    key: candidate,
                    role: 'button',
                    tabIndex: 0,
                    className:
                      'chip' +
                      (pickedSwap && pickedSwap.candidate === candidate && pickedSwap.original === one.original ? ' on' : ''),
                    onClick: () => setPickedSwap({ original: one.original, candidate }),
                  },
                  candidate,
                ),
              ),
            ),
          )
        })
        out.push(h('p', { className: 'vw', key: 'vw' }, STUDY_swappedParts(example && example.sentence, pickedSwap)))
      } else {
        out.push(STUDY_note('这个包没有英文替换候选 —— 账本里 swaps 是空的。'), )
      }
      if (vary.zh.length) {
        out.push(h('p', { className: 'mut', key: 'zhlb', style: { margin: '10px 0 6px' } }, '这句的中文说法（zhVariants，不是英文换法）：'))
        out.push(
          h(
            'ul',
            { className: 'dlist', key: 'zhl' },
            vary.zh.map((line, at) => h('li', { key: at }, h('b', null, '说法 ' + (at + 1)), line)),
          ),
        )
      }
      return out
    }

    return STUDY_note('这一块没内容。')
  }

  const allOpen = drawers.every((one) => isOpen(one.key))
  const header = h(
    'header',
    { className: 'hdr' },
    h(
      'div',
      null,
      h(
        'div',
        { className: 'st-crumb' },
        h('a', { href: '#', onClick: (event) => { event.preventDefault(); if (onGoCards) onGoCards() } }, '卡片'),
        h('span', null, '/'),
        h('span', null, pack ? pack.target || '(未命名)' : '还没有包'),
        h('span', null, '/'),
        h('span', null, examples.length ? '第 ' + (index + 1) + ' 条，共 ' + examples.length + ' 条' : '还没有例句'),
      ),
      h(
        'h1',
        { className: 'st-idx' },
        h('span', { className: 'wd' }, pack ? pack.target || '(未命名)' : '学习'),
        h(
          'span',
          { className: 'mut st-where' },
          examples.length ? index + 1 + ' / ' + examples.length + ' 条 · 这一面：' + active.label : '这个包还没有例句',
        ),
      ),
    ),
    h(
      'div',
      { className: 'act' },
      h('button', { className: 'btn ghost', type: 'button', disabled: true, title: '编辑面板还没做：这一版只能看，不能改包里的东西' }, '编辑'),
      h('button', { className: 'btn ghost', type: 'button', disabled: true, title: '这一页不排队，关掉就是暂停 —— 没有「暂停」这个动作' }, '暂停'),
      h('button', { className: 'btn ghost', type: 'button', disabled: !onGoCards, onClick: onGoCards || undefined }, '退出'),
    ),
  )

  // 四种「还练不了」的状态：加载中 / 出错 / 没有包 / 这个包还没例句
  if (failure) {
    return h(Screen, { className: 'study' }, header, STUDY_card('没取到数据', failure, '重试', reload))
  }
  if (loading) {
    return h(Screen, { className: 'study' }, header, STUDY_card('正在取账本…', '宿主那边还没回话。最多等 15 秒，超时会在这儿说出来。'))
  }
  if (!packs.length) {
    return h(
      Screen,
      { className: 'study' },
      header,
      STUDY_card(
        '账本里还没有包',
        '这一屏要一条例句才能练，现在一个包都没有。去卡片页输一个词，点「造一个包」—— 第一个包会用示例数据造，不用你配任何东西。',
        '去卡片页造一个包',
        onGoCards,
      ),
    )
  }
  if (detail.status === 'error') {
    return h(
      Screen,
      { className: 'study' },
      header,
      STUDY_card('这一包没取过来', (detail.error || '') + '（pack.get ' + (chosenId || '') + '）', '再取一次', () => setRetry((n) => n + 1)),
    )
  }
  if (detail.status !== 'ready') {
    return h(Screen, { className: 'study' }, header, STUDY_card('正在把这一包取过来…', '列表里只有每包的进度，句子和图得再问一次 pack.get。'))
  }
  if (!example) {
    return h(
      Screen,
      { className: 'study' },
      header,
      STUDY_card(
        '这个包还没有例句',
        '账本里这个包的 examples 是空的' + (pack && pack.progress && pack.progress.total ? '（progress.total 是 ' + pack.progress.total + '，对不上）' : '') + '。回卡片页让它先造几句，再回来练。',
        '去卡片页',
        onGoCards,
      ),
    )
  }

  const faceBar = h(
    'div',
    { className: 'fbar', id: 'fbar' },
    faces.map((one) =>
      h(StudyFace, {
        key: one.id,
        face: one,
        status: faceState[one.id],
        active: one.id === active.id,
        onPick: setFace,
      }),
    ),
    h('span', { className: 'sp' }),
  )

  const stage = h(
    'section',
    { className: 'stage2', id: 'stage' },
    drawers.map((def) =>
      h(
        StudyDrawer,
        {
          key: def.key,
          def,
          open: isOpen(def.key),
          lit: isLit(def.key),
          off: !encouraged(def.key),
          onToggle: toggleDrawer,
        },
        drawerBody(def.key),
      ),
    ),
  )

  const railRows = [
    { key: 'bg', label: '背景', num: bgRows.length ? bgRows.length + ' 条' : '没有' },
    {
      key: 'media',
      label: '图 · 资源',
      num: example.image && example.image.file ? (example.image.creditUrl || example.image.licenseUrl ? '1 图 1 出处' : '1 图') : '没有',
    },
    { key: 'sent', label: '句子', num: example.sentence ? STUDY_words(example.sentence) + ' 词' : '没有' },
    { key: 'audio', label: '声音', num: example.audio && example.audio.file ? STUDY_secs(example.audio.seconds) || '有' : '没有' },
    { key: 'rec', label: '录音', num: '没有' },
    { key: 'type', label: '打字', num: typedText ? '写过' : '还没写' },
    { key: 'vary', label: '换一个说法', num: vary.total ? vary.total + ' 个' : vary.zh.length ? vary.zh.length + ' 条中文' : '没有' },
  ]

  const rail = h(
    'aside',
    { className: 'drail' },
    h('div', { className: 'side-h' }, '解释'),
    h(
      'div',
      { className: 'exrow' },
      h(
        'button',
        { className: 'ex' + (showEn ? ' on' : ''), type: 'button', onClick: () => setShowEn((value) => !value) },
        h('span', null, '英文'),
        h('i', null, showEn ? '开' : '关'),
      ),
      h(
        'button',
        { className: 'ex' + (showZh ? ' on' : ''), type: 'button', onClick: () => setShowZh((value) => !value) },
        h('span', null, '中文'),
        h('i', null, showZh ? '开' : '关'),
      ),
    ),
    h('div', { className: 'side-h' }, '每一块都在这里'),
    railRows.map((row) =>
      h(
        'button',
        {
          key: row.key,
          className:
            'rv' + (isOpen(row.key) ? ' on' : '') + (isLit(row.key) ? ' lit' : '') + (encouraged(row.key) ? '' : ' dim'),
          type: 'button',
          onClick: () => toggleDrawer(row.key),
        },
        h('span', null, row.label),
        h('i', null, row.num),
      ),
    ),
    h('button', { className: 'mini allbtn', type: 'button', onClick: () => openAll(!allOpen) }, allOpen ? '全收起' : '全揭开'),
    h('p', { className: 'side-n fold' }, '点一下拉开，再点一下收起来。灰的是这一面不鼓励先看的，照样能拉。'),
  )

  const rateBar = h(
    'div',
    { className: 'st-rate' },
    grades.map((grade) => {
      const mine = mark && mark.grade === grade.id ? mark : null
      return h(
        'button',
        {
          key: grade.id,
          className: 'st-r',
          type: 'button',
          'aria-pressed': mine ? 'true' : 'false',
          style: mine ? { borderColor: 'var(--accent)' } : null,
          onClick: () => rate(grade.id),
        },
        h('b', null, grade.label),
        // 设计稿这里写的是「1 分钟 / 3 天 / 8 天 / 15 天」—— 没有调度引擎就没有这些数
        h('em', null, mine ? '本页 ' + mine.times + ' 次' : '未接调度'),
      )
    }),
  )

  const keysLine = h(
    'p',
    { className: 'st-keys' },
    h('span', { className: 'kbd' }, '1'),
    '–',
    h('span', { className: 'kbd' }, '4'),
    ' 评分 · ',
    h('span', { className: 'kbd' }, '←'),
    h('span', { className: 'kbd' }, '→'),
    ' 换面 · 四档现在只在这一页记一次，不排下次复习时间，也不写账本。',
  )

  const markLine = mark
    ? h(
        'p',
        { className: 'mut', style: { marginTop: 6 } },
        '这一条刚评的是「' +
          (grades.find((one) => one.id === mark.grade) || { label: mark.grade }).label +
          '」，本页第 ' +
          mark.times +
          ' 次。调度引擎还没接，所以没有「几天后再见」这回事，账本里也没写。',
      )
    : null

  const body = h(
    'div',
    { className: 'st2' },
    stage,
    rail,
  )

  return h(
    Screen,
    { className: 'study' },
    header,
    faceBar,
    body,
    h(
      'button',
      {
        className: 'wordnav prev',
        type: 'button',
        title: '上一个词（换一个包）',
        disabled: packIndex <= 0,
        onClick: () => stepPack(-1),
      },
      '‹',
    ),
    h(
      'button',
      {
        className: 'wordnav next',
        type: 'button',
        title: '下一个词（换一个包）',
        disabled: packIndex < 0 || packIndex >= packs.length - 1,
        onClick: () => stepPack(1),
      },
      '›',
    ),
    h(
      'button',
      { className: 'navstep prev', type: 'button', disabled: index <= 0, onClick: () => stepExample(-1) },
      '← 上一个',
    ),
    h(
      'button',
      {
        className: 'navstep next',
        type: 'button',
        disabled: index >= examples.length - 1,
        onClick: () => stepExample(1),
      },
      '下一个 →',
    ),
    rateBar,
    markLine,
    keysLine,
  )
}


/* ===================== 50-factory.js ===================== */
/* 50 · 工厂页 —— 造料 → 挑图 → 声音 → 出厂
   结构照 design/gen.mjs 的 screens.factory（左词表 / 中义项 / 右素材），类名照
   design/app.css 的 .fx-*。但每一格只画插件真有的东西，三处照实改了：

   1) 设计稿的「五维度（听说读写改）+ 权重开关」是 Anki 那种调度模型里的东西，
      插件里根本没有这个数据。这里换成这条例句真实的五件事：图 / 声 / 变体 /
      背景 / 复核，**只读**，不画假开关（画了开关就得有地方存）。
   2) 设计稿的「义项 N」按释义分组，一个包在 lib/packs.js 里只有一个 gloss，
      所以永远只有一组；界面上直接说清楚，不假装还有第二条。
   3) 「资源（动图 / 视频 / 帖子）」插件没有存储位、也没有对应端点：空态一句话，
      不画加号，免得点下去一片安静。

   三条死规矩在 lib 里，界面负责别把它们藏起来：
   · 图要人点过：只有 pack.pick / pack.upload 会写 imageReview.by，界面上
     「这张图点过没有」是从账本读的，不是点一下就在前端自己记一笔。
   · 声要真听过：勾「听过」的按钮在播放到六成之前是 disabled，点了也发不出去。
   · 重复造不重复花钱：pack.create 幂等命中时日志里会有一句「直接复用，不再花钱」，
     界面把宿主那句原话端出来，而不是自己编一句「已复用」。 */

// ────────────────────────────── 小工具 ──────────────────────────────

/** 扩展名 → mime。包里的文件名只有三种：语音 .mp3，图 .jpg/.png/.webp/.gif */
function FX_mimeOf(name) {
  const lower = String(name || '').toLowerCase()
  if (lower.endsWith('.mp3')) return 'audio/mpeg'
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.gif')) return 'image/gif'
  return 'image/jpeg'
}

/** 字节 → data URL。图和声都不走 HTTP 媒体路由（那条路由整站要鉴权，
    子资源请求带不上凭据，最后就是一片空格子），所以字节从 RPC 拿回来自己拼。 */
function FX_dataUrl(name, base64) {
  if (!base64) return null
  return 'data:' + FX_mimeOf(name) + ';base64,' + String(base64)
}

function FX_humanBytes(bytes) {
  const n = Number(bytes)
  if (!Number.isFinite(n) || n <= 0) return ''
  if (n >= 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + ' MB'
  return Math.round(n / 1024) + ' KB'
}

function FX_humanSeconds(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return ''
  return n.toFixed(2) + ' 秒'
}

function FX_at(value) {
  if (!value) return ''
  const when = new Date(value)
  if (Number.isNaN(when.getTime())) return String(value)
  const pad = (n) => String(n).padStart(2, '0')
  return when.getFullYear() + '-' + pad(when.getMonth() + 1) + '-' + pad(when.getDate()) + ' ' + pad(when.getHours()) + ':' + pad(when.getMinutes())
}

function FX_wordCount(sentence) {
  const text = String(sentence || '').trim()
  if (!text) return 0
  return text.split(/\s+/).filter(Boolean).length
}

/** 句子 → [前, 目标词, 后]，中间那段在界面上用 <b> 包起来 */
function FX_sentenceParts(sentence, target) {
  const text = String(sentence || '')
  const needle = String(target || '').trim()
  if (!needle) return [text]
  const at = text.toLowerCase().indexOf(needle.toLowerCase())
  if (at < 0) return [text]
  return [text.slice(0, at), text.slice(at, at + needle.length), text.slice(at + needle.length)]
}

function FX_statusText(status) {
  const real = {
    generating: '在造例句',
    text: '例句好了',
    media: '在找素材',
    packed: '已打包',
    exported: '已导出',
    failed: '上次失败了',
  }
  return real[status] || STATUS_TEXT[status] || status || '刚建好'
}

function FX_kindText(kind) {
  if (kind === 'sentence') return '整句'
  if (kind === 'phrase') return '说法'
  if (kind === 'word') return '单词'
  return kind || '没标类型'
}

/** 账本里的包 → 左边词表那一行。设计稿的「未学习 / 待复习」是 Anki 的口径，
    这里换成插件真有的四个数：例句、有图、有语音、到哪一步。 */
function FX_rowsOf(state) {
  const packs = Array.isArray(state?.packs) ? state.packs : []
  return packs.map((pack) => {
    const total = pack?.progress?.total ?? (Array.isArray(pack?.examples) ? pack.examples.length : 0)
    const images = pack?.progress?.images ?? 0
    const audios = pack?.progress?.audios ?? 0
    return {
      id: pack.id,
      name: pack.target || '(未命名)',
      kind: pack.kind || 'word',
      status: pack.status || 'draft',
      createdAt: Date.parse(pack.createdAt || '') || 0,
      total,
      images,
      audios,
      done: pack?.progress?.done === true,
      missingImages: Math.max(0, total - images),
      missingAudios: Math.max(0, total - audios),
      lastError: pack.lastError || null,
    }
  })
}

/** 词表圆点：全齐 / 差一半 / 一条都没有 */
function FX_dotOf(row) {
  if (row.done) return 'ok'
  if (row.images > 0 || row.audios > 0 || row.total > 0) return 'half'
  return 'none'
}

function FX_sortedRows(rows, mode) {
  const list = rows.slice()
  if (mode === 'behind') {
    list.sort((a, b) => (b.missingImages + b.missingAudios) - (a.missingImages + a.missingAudios))
    return list
  }
  list.sort((a, b) => b.createdAt - a.createdAt)
  return list
}

/** 一条例句的四个真实维度，画成 summary 上那排小豆子 */
function FX_pipStates(example) {
  const image = example?.image
  const reviewed = Boolean(example?.imageReview?.by)
  const audio = example?.audio
  const listened = example?.audioReview?.listened === true
  const variants = Array.isArray(example?.zhVariants) ? example.zhVariants.length : 0
  return [
    { key: 'image', state: image && reviewed ? 'ok' : image ? 'warn' : 'none' },
    { key: 'audio', state: audio && listened ? 'ok' : audio ? 'warn' : 'none' },
    { key: 'variant', state: variants >= 2 ? 'ok' : variants ? 'warn' : 'none' },
    { key: 'scene', state: example?.sceneZh ? 'ok' : 'none' },
  ]
}

/** 幂等命中的那句原话（lib/packs.js 里 createPack 打的） */
function FX_reusedLine(job) {
  const lines = Array.isArray(job?.log) ? job.log : []
  return lines.find((one) => String(one).includes('不再花钱') || String(one).includes('直接复用')) || null
}

function FX_jobStatusText(status) {
  if (status === 'running') return '在跑'
  if (status === 'done') return '完了'
  if (status === 'failed') return '砸了'
  if (status === 'cancelled') return '撤了'
  return status || '不知道'
}

// ────────────────────────────── 样式（新增的类都叫 .fx-*，样式写在这里） ──────────────────────────────

function FX_noticeStyle(tone) {
  const table = {
    ok: { background: 'rgba(87,199,123,.10)', border: '1px solid rgba(87,199,123,.30)' },
    warn: { background: 'rgba(255,196,120,.10)', border: '1px solid rgba(255,196,120,.32)' },
    bad: { background: 'rgba(255,120,120,.10)', border: '1px solid rgba(255,120,120,.32)' },
    info: { background: 'rgba(138,169,255,.08)', border: '1px solid rgba(138,169,255,.22)' },
  }
  const picked = table[tone] || table.info
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '9px 12px',
    borderRadius: 11,
    fontSize: 12.5,
    lineHeight: 1.55,
    color: 'var(--fg2)',
    background: picked.background,
    border: picked.border,
  }
}

function FX_blockStyle() {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: '10px 12px',
    borderRadius: 12,
    border: '1px solid var(--glass-line)',
    background: 'rgba(var(--w),.022)',
  }
}

function FX_logStyle() {
  return {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    fontSize: 11,
    lineHeight: 1.5,
    color: 'var(--fg3)',
    wordBreak: 'break-word',
  }
}

function FX_gapPx() {
  return { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }
}

// ────────────────────────────── 字节 → <img> / <audio> ──────────────────────────────

/** 一张图。spec 要么 {file}（已锁定的图），要么 {candidate:true, stagedName}（候选图）。
    两条端点的返回都是 {dataBase64}，这里拼成 data URL 塞给 <img src>。 */
function FX_Picture({ rpc, spec, alt, className, style }) {
  const [media, setMedia] = useState({ status: 'idle', url: null, error: null })
  const name = spec ? (spec.candidate ? spec.stagedName : spec.file) : ''
  const key = spec ? (spec.candidate ? 'candidate:' : 'image:') + name : ''

  useEffect(() => {
    if (!key) {
      setMedia({ status: 'idle', url: null, error: null })
      return undefined
    }
    let alive = true
    setMedia({ status: 'loading', url: null, error: null })
    const endpoint = spec.candidate ? 'candidate.bytes' : 'image.bytes'
    const payload = spec.candidate ? { stagedName: spec.stagedName } : { kind: 'images', file: spec.file }
    callRpc(rpc, endpoint, payload)
      .then((value) => {
        if (!alive) return
        const url = FX_dataUrl(name, value?.dataBase64)
        if (url) setMedia({ status: 'ready', url, error: null })
        else setMedia({ status: 'error', url: null, error: '宿主没给图片内容。' })
      })
      .catch((failure) => {
        if (!alive) return
        setMedia({ status: 'error', url: null, error: failure?.message || String(failure) })
      })
    return () => {
      alive = false
    }
  }, [key, rpc])

  if (!spec) return null
  if (media.status === 'ready') return h('img', { className, style, src: media.url, alt: alt || '', loading: 'lazy' })
  return h(
    'div',
    {
      className: 'fx-miss ' + (className || ''),
      style: Object.assign(
        {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          fontSize: 10.5,
          lineHeight: 1.4,
          color: 'var(--fg3)',
          background: 'rgba(var(--w),.05)',
          borderRadius: 9,
          padding: 4,
        },
        style || {},
      ),
      title: media.error || '正在取图片字节…',
    },
    media.status === 'error' ? '图取不到' : '取图…',
  )
}

// ────────────────────────────── 词表（左） ──────────────────────────────

function FactoryWords({ rows, selected, filter, sortMode, onFilter, onSort, onSelect }) {
  return h(
    'aside',
    { className: 'fx-side' },
    h(
      'div',
      { className: 'fx-sidehd' },
      '词表 ',
      h('span', { className: 'mut' }, rows.length + ' 个包'),
    ),
    h('input', {
      className: 'inp sm',
      type: 'search',
      value: filter,
      placeholder: '筛一下…',
      onChange: (event) => onFilter(event.target.value),
    }),
    h(
      'div',
      { className: 'fx-mini' },
      h(
        'button',
        {
          className: 'mini' + (sortMode === 'recent' ? ' on' : ''),
          type: 'button',
          onClick: () => onSort('recent'),
          title: '按造出来的时间倒着排',
        },
        '最近',
      ),
      h(
        'button',
        {
          className: 'mini' + (sortMode === 'behind' ? ' on' : ''),
          type: 'button',
          onClick: () => onSort('behind'),
          title: '欠得最多的排前面（缺图 + 缺声）',
        },
        '按欠的',
      ),
    ),
    h(
      'ul',
      { className: 'fx-words' },
      rows.length === 0
        ? h(
            'li',
            { style: { cursor: 'default' } },
            h('b', { className: 'mut' }, filter ? '没有配得上的' : '账本里还没有包'),
          )
        : rows.map((row) =>
            h(
              'li',
              {
                key: row.id,
                className: row.id === selected ? 'on' : '',
                onClick: () => onSelect(row.id),
                title: row.lastError ? '上次失败：' + row.lastError : FX_statusText(row.status),
              },
              h('b', null, row.name),
              h('i', { className: 'fdot ' + FX_dotOf(row) }),
            ),
          ),
    ),
  )
}

// ────────────────────────────── 素材：图（右） ──────────────────────────────

function FactoryMedia({ rpc, pack, example, busy, acts }) {
  const image = example.image
  const review = example.imageReview
  const candidates = Array.isArray(example.imageCandidates) ? example.imageCandidates : []
  const rejected = Array.isArray(example.imageRejected) ? example.imageRejected : []
  const pickedName = image?.candidateName || image?.stagedName || ''

  return h(
    'div',
    { className: 'fx-blk' },
    h(
      'div',
      { className: 'fx-bh' },
      '配图',
      h('span', { className: 'sp' }),
      h(
        'button',
        {
          className: 'mini',
          type: 'button',
          disabled: Boolean(busy),
          onClick: () => acts.findCandidates(example.ord, example.imageQuery),
          title: '按这条例句的 image_query 去图库检索一批候选',
        },
        busy === 'candidates:' + example.ord ? '在找…' : '找候选图',
      ),
    ),

    h(
      'div',
      { className: 'imgbar fx-img' },
      image
        ? h(FX_Picture, {
            rpc,
            spec: { file: image.file },
            alt: '第 ' + example.ord + ' 条的配图',
            style: { width: 104, height: 72, borderRadius: 10 },
          })
        : h('div', {
            className: 'fx-miss',
            style: {
              width: 104,
              height: 72,
              borderRadius: 10,
              border: '1px dashed rgba(var(--w),.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10.5,
              color: 'var(--ghost)',
              flex: '0 0 auto',
            },
          }, '没图'),
      h(
        'div',
        { className: 'im' },
        h('b', null, image ? '这张定了' : '还没有配图'),
        h(
          'span',
          { className: 'mut' },
          image
            ? [image.source || '来路没记', image.width && image.height ? image.width + '×' + image.height : '', FX_humanBytes(image.bytes), image.license || '许可没记']
                .filter(Boolean)
                .join(' · ')
            : '找一批候选，点一张才算数。',
        ),
        review
          ? h('span', { className: 'mut' }, '复核人：' + (review.by || '?') + ' · ' + FX_at(review.at))
          : image
            ? h('span', { className: 'mut', style: { color: 'var(--warn)' } }, '这张还没人点过头，打包会被挡。')
            : null,
      ),
    ),

    h(
      'div',
      { className: 'shots' },
      candidates.map((one) =>
        h(
          'div',
          {
            key: one.stagedName,
            className: 's' + (one.stagedName === pickedName ? ' on' : ''),
            onClick: () => acts.pick(example.ord, one),
            title: [one.source, one.query, one.license].filter(Boolean).join(' · ') || one.stagedName,
          },
          h(FX_Picture, { rpc, spec: { candidate: true, stagedName: one.stagedName }, alt: one.stagedName }),
          h('em', null, one.source || '候选'),
        ),
      ),
    ),

    candidates.length === 0
      ? h('p', { className: 'note mut' }, '这批还没有候选图。点上面的「找候选图」，本机去图库现找一批。')
      : null,

    h(
      'div',
      { className: 'vopts' },
      h(
        'button',
        {
          className: 'mini',
          type: 'button',
          disabled: Boolean(busy),
          onClick: () => acts.pickCandidatesAll(),
          title: '把这个包里所有还没图的条目一起找一遍（已经定图 / 已有候选的会跳过）',
        },
        '全部找一遍',
      ),
      image
        ? h(
            'button',
            {
              className: 'mini',
              type: 'button',
              disabled: Boolean(busy),
              onClick: () => acts.unlockImage(example.ord),
              title: '把这张图取消掉，回去重新挑',
            },
            '不锁了',
          )
        : null,
      h(
        'label',
        {
          className: 'mini',
          style: { cursor: 'pointer' },
          title: '自己上传一张图；上传也算你点过头',
        },
        '自己传一张',
        h('input', {
          type: 'file',
          accept: 'image/*',
          style: { display: 'none' },
          onChange: (event) => {
            const file = event.target?.files?.[0]
            event.target.value = ''
            if (file) acts.upload(example.ord, file)
          },
        }),
      ),
    ),

    rejected.length
      ? h(
          'p',
          { className: 'note mut' },
          '挡掉了 ' + rejected.length + ' 张：' + rejected.slice(0, 3).map((one) => one.reason || one.source || '').filter(Boolean).join('；'),
        )
      : null,
  )
}

// ────────────────────────────── 素材：声音（右） ──────────────────────────────

function FactoryAudio({ rpc, pack, example, voices, busy, acts }) {
  const audio = example.audio
  const review = example.audioReview
  const listened = review?.listened === true
  const [media, setMedia] = useState({ status: 'idle', url: null, error: null })
  const [ratio, setRatio] = useState(0)
  const [playing, setPlaying] = useState(false)
  const node = useRef(null)
  const played = useRef(0)
  const fileName = audio?.file || ''

  // 合成过一次不算听过：换文件就从头算播放进度（synthesizeExample 也会把
  // audioReview 置空，两边口径一致）。
  useEffect(() => {
    played.current = 0
    setRatio(0)
    setPlaying(false)
  }, [fileName])

  useEffect(() => {
    if (!fileName) {
      setMedia({ status: 'idle', url: null, error: null })
      return undefined
    }
    let alive = true
    setMedia({ status: 'loading', url: null, error: null })
    callRpc(rpc, 'image.bytes', { kind: 'audio', file: fileName })
      .then((value) => {
        if (!alive) return
        const url = FX_dataUrl(fileName, value?.dataBase64)
        if (url) setMedia({ status: 'ready', url, error: null })
        else setMedia({ status: 'error', url: null, error: '宿主没给语音内容。' })
      })
      .catch((failure) => {
        if (!alive) return
        setMedia({ status: 'error', url: null, error: failure?.message || String(failure) })
      })
    return () => {
      alive = false
    }
  }, [fileName, rpc])

  function toggle() {
    const element = node.current
    if (!element || typeof element.play !== 'function') return
    if (element.paused) {
      try {
        const started = element.play()
        if (started && typeof started.catch === 'function') started.catch(() => setPlaying(false))
      } catch (failure) {
        setMedia({ status: 'error', url: null, error: '放不出来：' + (failure?.message || String(failure)) })
      }
    } else {
      element.pause()
    }
  }

  function onTimeUpdate(event) {
    const element = event.currentTarget
    const duration = Number(element?.duration)
    if (!Number.isFinite(duration) || duration <= 0) return
    const now = Number(element.currentTime) || 0
    if (now > played.current) played.current = now
    const next = Math.min(1, played.current / duration)
    setRatio((prev) => (next > prev ? next : prev))
  }

  const needMore = Math.max(0, 0.6 - ratio)
  const gateOpen = Boolean(audio) && ratio >= 0.6
  const seconds = Number(audio?.seconds) || 0
  const remain = seconds > 0 && !gateOpen ? Math.ceil(needMore * seconds) : 0
  const currentVoice = pack?.voiceChoice?.voice || voices?.defaultVoice || ''

  return h(
    'div',
    { className: 'fx-blk' },
    h(
      'div',
      { className: 'fx-bh' },
      '语音',
      h('span', { className: 'sp' }),
      audio ? h('span', { className: 'mut' }, FX_humanSeconds(audio.seconds)) : h('span', { className: 'mut' }, '还没合成'),
    ),

    h(
      'div',
      { className: 'vline' },
      h(
        'select',
        {
          className: 'sel sm',
          value: currentVoice,
          disabled: Boolean(busy) || !voices?.list?.length,
          onChange: (event) => acts.setVoice(event.target.value),
          title: '换音色之后，已有语音要重新合成才算数',
        },
        (voices?.list || []).map((one) =>
          h('option', { key: one.id, value: one.id }, one.label + (one.locale ? ' · ' + one.locale : '')),
        ),
      ),
      h('span', { className: 'mut' }, voices?.error ? '音色表没取到，这几个是兜底的' : voices?.engine === 'openai' ? 'openai' : 'edge'),
    ),

    audio
      ? h(
          'div',
          { className: 'vline' },
          h(
            'button',
            {
              className: 'mini',
              type: 'button',
              onClick: toggle,
              disabled: media.status !== 'ready',
              title: media.status === 'error' ? media.error : '放一遍',
            },
            playing ? '暂停' : h(Icon, { name: 'play', size: 11 }),
          ),
          h(
            'div',
            {
              className: 'fx-miss',
              style: {
                flex: '1 1 auto',
                height: 5,
                borderRadius: 99,
                background: 'rgba(var(--w),.12)',
                overflow: 'hidden',
                padding: 0,
              },
              title: '听了 ' + Math.round(ratio * 100) + '%',
            },
            h('i', {
              style: {
                display: 'block',
                height: '100%',
                width: Math.round(ratio * 100) + '%',
                background: ratio >= 0.6 ? 'var(--ok)' : 'var(--accent)',
                transition: 'width .2s linear',
              },
            }),
          ),
          h('span', { className: 'mut' }, Math.round(ratio * 100) + '%'),
          h('audio', {
            ref: node,
            src: media.url || undefined,
            preload: 'auto',
            style: { display: 'none' },
            onTimeUpdate,
            onPlaying: () => setPlaying(true),
            onPause: () => setPlaying(false),
            onEnded: () => {
              setPlaying(false)
              setRatio(1)
            },
          }),
        )
      : null,

    h(
      'div',
      { className: 'vopts' },
      h(
        'button',
        {
          className: 'mini' + (audio ? '' : ' go'),
          type: 'button',
          disabled: Boolean(busy),
          onClick: () => acts.synthesize(example.ord),
          title: '合成本条例句的语音',
        },
        busy === 'audio:' + example.ord ? '在合成…' : audio ? '重合成' : '合成语音',
      ),
      audio
        ? h(
            'button',
            {
              className: 'mini go',
              type: 'button',
              disabled: !gateOpen || listened || Boolean(busy),
              onClick: () => acts.confirmAudio(example.ord),
              title: gateOpen
                ? '这句你真听到了六成，记一笔'
                : '还没听到六成，先放着听一遍（还差 ' + remain + ' 秒）',
            },
            listened ? '已经听过了' : gateOpen ? '听过' : '还要听 ' + remain + ' 秒',
          )
        : null,
      listened
        ? h(
            'button',
            {
              className: 'mini xs',
              type: 'button',
              disabled: Boolean(busy),
              onClick: () => acts.unlockAudio(example.ord),
              title: '把「听过」这笔撤掉',
            },
            '撤销',
          )
        : null,
      h(
        'button',
        {
          className: 'mini',
          type: 'button',
          disabled: Boolean(busy),
          onClick: () => acts.synthesizeAll(),
          title: '整个包每条都合成一遍（已有语音也会重来）',
        },
        '全部合成',
      ),
    ),

    h(
      'p',
      { className: 'note mut' },
      audio
        ? (audio.engine || '引擎没记') + ' / ' + (audio.voice || '音色没记') + (audio.fellBackFrom ? '（' + audio.fellBackFrom + ' 不可用，降级来的）' : '')
        : '还没合成。合成不等于听过 —— 合成完了要真放一遍才算数。',
    ),

    listened
      ? h('p', { className: 'note', style: { color: 'var(--ok)' } }, '复核人：' + (review.by || '?') + ' · ' + FX_at(review.at))
      : null,
  )
}

// ────────────────────────────── 一条例句（中间，展开态） ──────────────────────────────

function FactoryExampleRow({ rpc, pack, example, open, onToggle, voices, busy, acts }) {
  const target = pack.target
  const parts = FX_sentenceParts(example.sentence, target)
  const pips = FX_pipStates(example)
  const variants = Array.isArray(example.zhVariants) ? example.zhVariants : []

  const dims = [
    {
      key: 'image',
      name: '图',
      ok: Boolean(example.image) && Boolean(example.imageReview?.by),
      text: example.image ? (example.imageReview?.by ? '定了，也点过' : '有图，但没人点过') : '还没配图',
    },
    {
      key: 'audio',
      name: '声',
      ok: Boolean(example.audio) && example.audioReview?.listened === true,
      text: example.audio ? (example.audioReview?.listened ? '听过了' : '有语音，没听过') : '还没合成',
    },
    {
      key: 'variant',
      name: '变',
      ok: variants.length >= 2,
      text: variants.length ? '中文说法 ' + variants.length + ' 条' : '没有中文变体',
    },
    {
      key: 'scene',
      name: '景',
      ok: Boolean(example.sceneZh),
      text: example.register || (example.sceneZh ? '有场景' : '没写场景'),
    },
    {
      key: 'review',
      name: '核',
      ok: Boolean(example.imageReview?.by) && example.audioReview?.listened === true,
      text:
        example.imageReview?.by && example.audioReview?.listened
          ? '图和声都复核过'
          : '还差' + [example.imageReview?.by ? '' : '点图', example.audioReview?.listened ? '' : '听声'].filter(Boolean).join(' / '),
    },
  ]

  return h(
    'details',
    { className: 'fx-row', open: open ? true : undefined },
    h(
      'summary',
      {
        onClick: (event) => {
          event.preventDefault()
          onToggle(open ? null : example.ord)
        },
      },
      h('span', { className: 'n' }, String(example.ord)),
      h(
        'span',
        { className: 's' },
        parts.length === 3
          ? [parts[0], h('b', { key: 'mid' }, parts[1]), parts[2]]
          : h('span', null, parts[0]),
      ),
      h(
        'span',
        { className: 'pips' },
        pips.map((pip) =>
          h('i', {
            key: pip.key,
            className: pip.state === 'ok' ? 'ok' : pip.state === 'warn' ? 'warn' : '',
          }),
        ),
      ),
      h('span', { className: 'wc' }, FX_wordCount(example.sentence) + ' 词'),
      h('span', { className: 'ix' }, example.audio ? '♪' : '—'),
      h(
        'button',
        {
          className: 'mini xs',
          type: 'button',
          onClick: (event) => {
            event.preventDefault()
            event.stopPropagation()
            onToggle(open ? null : example.ord)
          },
        },
        open ? '收起' : '展开',
      ),
    ),

    open
      ? h(
          'div',
          { className: 'fx-body' },

          // 五件事：只读。设计稿那五个开关背后是调度权重，插件里没有这个东西。
          h(
            'div',
            { className: 'fx-blk b5' },
            h('div', { className: 'fx-bh' }, '这条的五件事', h('span', { className: 'sp' }), h('span', { className: 'mut' }, '只读')),
            h(
              'div',
              { className: 'f5list' },
              dims.map((dim) =>
                h(
                  'div',
                  { className: 'f5row', key: dim.key },
                  h('b', null, dim.name),
                  h('em', { className: dim.ok ? 'ok' : 'warn' }, dim.ok ? '齐了' : '差着'),
                  h('span', { className: 'sp' }),
                  h('span', { className: 'd' }, dim.text),
                ),
              ),
            ),
            h(
              'p',
              { className: 'note mut' },
              '设计稿这里是「听/说/读/写/改」五个权重开关 —— 插件没有调度引擎，画了也没地方存。换成这五件能查证的事。',
            ),
          ),

          h(FactoryMedia, { rpc, pack, example, busy, acts }),
          h(FactoryAudio, { rpc, pack, example, voices, busy, acts }),

          h(
            'div',
            { className: 'fx-blk' },
            h('div', { className: 'fx-bh' }, '中文变体', h('span', { className: 'sp' }), h('span', { className: 'mut' }, variants.length + ' 条')),
            variants.length
              ? h(
                  'div',
                  { className: 'chips' },
                  variants.map((one, index) => h('span', { key: index, className: 'chip on' }, one)),
                )
              : h('p', { className: 'note mut' }, '模型没给中文变体。'),
            h('p', { className: 'note mut' }, '这些是造例句时模型一起给的，插件里没有改它的端点，所以只读。'),
          ),

          h(
            'div',
            { className: 'fx-blk' },
            h('div', { className: 'fx-bh' }, '资源', h('span', { className: 'sp' }), h('span', { className: 'mut' }, '0 条')),
            h(
              'p',
              { className: 'note mut' },
              '动图 / 视频 / 帖子这类外部资源，插件还没有存它们的字段，也没有对应端点 —— 所以这一格是空的，不是没加载出来。',
            ),
          ),

          h(
            'div',
            { className: 'fx-blk bbg' },
            h('div', { className: 'fx-bh' }, '背景', h('span', { className: 'sp' }), h('span', { className: 'mut' }, '造料时定的')),
            h(
              'ul',
              { className: 'bgl' },
              h('li', null, h('b', null, '场景'), h('span', null, example.sceneEn || '没写英文场景')),
              h('li', null, h('b', null, '中文'), h('span', null, example.sceneZh || '没写中文场景')),
              h('li', null, h('b', null, '语域'), h('span', null, example.register || '没标')),
              h('li', null, h('b', null, '语气'), h('span', null, example.voiceHint || '没给')),
              h('li', null, h('b', null, '找图词'), h('span', null, example.imageQuery || '没给')),
            ),
          ),
        )
      : null,
  )
}

// ────────────────────────────── 义项（中间） ──────────────────────────────

function FactorySense({ rpc, pack, examples, openOrd, onOpen, voices, busy, acts }) {
  const total = Array.isArray(pack.examples) ? pack.examples.length : 0
  return h(
    'div',
    { className: 'fx-sense' },
    h(
      'div',
      { className: 'fx-def' },
      h('span', { className: 'dn' }, '义项 1'),
      h('span', { className: 'dt' }, pack.gloss || pack.note || '(模型没给释义)'),
      h(
        'span',
        { className: 'prob' },
        h('i', null, '例句 ', h('b', null, String(total))),
        pack.ipa ? h('i', null, '音标 ', h('b', null, pack.ipa)) : null,
      ),
      h('span', { className: 'sp' }),
      h('span', { className: 'mut' }, '一个包只有一条释义，变体那栏是中文说法，不是义项'),
    ),
    examples.length === 0
      ? h(
          'p',
          { className: 'note mut' },
          total === 0
            ? '这个包的例句还没造出来。上面「造料」跑完之后，这里会一条一条列出来。'
            : '筛出来的这几条都不在：换个筛法，或者点「全部」。',
        )
      : examples.map((example) =>
          h(FactoryExampleRow, {
            key: example.ord,
            rpc,
            pack,
            example,
            open: openOrd === example.ord,
            onToggle: onOpen,
            voices,
            busy,
            acts,
          }),
        ),
  )
}

// ────────────────────────────── 整页 ──────────────────────────────

function FactoryPage({ rpc, state, error, reload }) {
  const ready = state?.status === 'ready'
  const rows = FX_rowsOf(state)

  const [draft, setDraft] = useState('')
  const [count, setCount] = useState('8')
  const [autoImages, setAutoImages] = useState(false)
  const [filter, setFilter] = useState('')
  const [sortMode, setSortMode] = useState('recent')
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState({ status: 'idle', pack: null, error: null })
  const [nonce, setNonce] = useState(0)
  const [job, setJob] = useState(null)
  const [flash, setFlash] = useState(null)
  const [check, setCheck] = useState(null)
  const [busy, setBusy] = useState('')
  const [seg, setSeg] = useState('all')
  const [sentenceFilter, setSentenceFilter] = useState('')
  const [openOrd, setOpenOrd] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [voices, setVoices] = useState({ list: [], defaultVoice: '', engine: '', error: null })

  const pack = detail.pack
  const detailId = pack?.id || null

  // 进了页面先挑一个包：优先挑还没做完的，全做完了就挑最近那个
  useEffect(() => {
    if (selected) return
    if (!rows.length) return
    const behind = rows.filter((row) => !row.done).sort((a, b) => b.createdAt - a.createdAt)
    setSelected((behind[0] || rows[0]).id)
  }, [rows, selected])

  // 选中变了就去账本取整包（列表里只有 progress，没有例句和素材）
  useEffect(() => {
    if (!selected) {
      setDetail({ status: 'idle', pack: null, error: null })
      return undefined
    }
    let alive = true
    setDetail((prev) => (prev.pack && prev.pack.id === selected ? prev : { status: 'loading', pack: null, error: null }))
    callRpc(rpc, 'pack.get', { id: selected })
      .then((value) => {
        if (alive) setDetail({ status: 'ready', pack: value, error: null })
      })
      .catch((failure) => {
        if (alive) setDetail({ status: 'error', pack: null, error: failure?.message || String(failure) })
      })
    return () => {
      alive = false
    }
  }, [selected, nonce, rpc])

  // 音色表：取一次就够，拿不到就用兜底表（pack.voice.list 自己会兜底）
  useEffect(() => {
    let alive = true
    callRpc(rpc, 'pack.voice.list', {})
      .then((value) => {
        if (!alive) return
        setVoices({
          list: Array.isArray(value?.voices) ? value.voices : [],
          defaultVoice: value?.defaultVoice || '',
          engine: value?.engine || '',
          error: value?.error || null,
        })
      })
      .catch((failure) => {
        if (!alive) return
        setVoices({ list: [], defaultVoice: '', engine: '', error: failure?.message || String(failure) })
      })
    return () => {
      alive = false
    }
  }, [rpc])

  // 任务轮询：起任务只拿得到任务号，日志和结果得自己接着问
  useEffect(() => {
    if (!job || job.status !== 'running') return undefined
    let alive = true
    const timer = setTimeout(() => {
      callRpc(rpc, 'job.get', { id: job.id })
        .then((next) => {
          if (!alive) return
          setJob(next)
          if (next.status !== 'running') finishJob(next)
        })
        .catch((failure) => {
          if (!alive) return
          setJob(Object.assign({}, job, { status: 'failed', error: failure?.message || String(failure) }))
          setFlash({ tone: 'bad', text: '任务状态取不到了：' + (failure?.message || String(failure)) })
        })
    }, 900)
    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [job, rpc])

  /** 发一条同步端点，失败一律落成提示条，不抛 */
  async function send(endpoint, payload, key) {
    setBusy(key)
    try {
      return await callRpc(rpc, endpoint, payload)
    } catch (failure) {
      setFlash({ tone: 'bad', text: '没成：' + (failure?.message || String(failure)) })
      return null
    } finally {
      setBusy('')
    }
  }

  /** 起一个后台任务：立刻拿到任务号，剩下的交给轮询 */
  async function startJob(endpoint, payload, key, hint) {
    setBusy(key)
    try {
      const started = await callRpc(rpc, endpoint, payload)
      setJob(started)
      setFlash({ tone: 'info', text: hint || '开了个任务：' + (started.label || started.kind) + '。下面能看到它跑到哪儿。' })
      return started
    } catch (failure) {
      setFlash({ tone: 'bad', text: '没成：' + (failure?.message || String(failure)) })
      return null
    } finally {
      setBusy('')
    }
  }

  async function refreshPack(packId) {
    const id = packId || selected
    if (!id) return null
    try {
      const value = await callRpc(rpc, 'pack.get', { id })
      setDetail({ status: 'ready', pack: value, error: null })
      return value
    } catch (failure) {
      setDetail({ status: 'error', pack: null, error: failure?.message || String(failure) })
      return null
    }
  }

  function finishJob(finished) {
    const kind = finished.kind
    if (finished.status === 'failed') {
      setFlash({ tone: 'bad', text: '任务砸了（' + FX_jobStatusText(finished.status) + '）：' + (finished.error || '没有说明') })
      refreshPack()
      if (reload) reload()
      return
    }
    if (finished.status === 'cancelled') {
      setFlash({ tone: 'warn', text: '任务被你撤了，账本没动。' })
      return
    }
    const reused = FX_reusedLine(finished)
    if (kind === 'create') {
      const packId = finished.result?.packId
      if (reused) {
        // 幂等命中：宿主那边一句钱都没花，界面把它的原话端出来
        setFlash({ tone: 'warn', text: '这是上次造的，没再花钱。' + (packId ? '（' + packId + '）' : '') })
      } else {
        setFlash({ tone: 'ok', text: '造好了' + (packId ? '：' + packId : '') + '。下一步挑图。' })
      }
      if (packId) setSelected(packId)
    } else if (kind === 'candidates') {
      const kept = finished.result?.kept ?? 0
      const rejected = finished.result?.rejected ?? 0
      setFlash({ tone: 'ok', text: '候选图留了 ' + kept + ' 张，挡掉 ' + rejected + ' 张。点一张才算数。' })
    } else if (kind === 'candidates-all') {
      const done = finished.result?.done ?? 0
      const total = finished.result?.total ?? 0
      const failed = (finished.result?.failures || []).length
      setFlash({ tone: failed ? 'warn' : 'ok', text: '候选图找完了：' + total + ' 条，成了 ' + done + ' 条' + (failed ? '，' + failed + ' 条没成' : '') + '。' })
    } else if (kind === 'audio') {
      setFlash({ tone: 'ok', text: '语音合好了。放一遍听到六成，「听过」才点得动。' })
    } else if (kind === 'audio-all') {
      const done = finished.result?.done ?? 0
      const total = finished.result?.total ?? 0
      const failed = (finished.result?.failures || []).length
      setFlash({ tone: failed ? 'warn' : 'ok', text: '语音合完了：' + total + ' 条，成了 ' + done + ' 条' + (failed ? '，' + failed + ' 条没成' : '') + '。每条听完才算数。' })
    } else if (kind === 'pack') {
      const errors = finished.result?.errors || []
      const dir = finished.result?.dir
      setFlash({ tone: errors.length ? 'warn' : 'ok', text: (dir ? '打好了：' + dir : '打包完成。') + (errors.length ? '（但还有 ' + errors.length + ' 个错）' : '') })
    } else if (kind === 'export') {
      const value = finished.result || {}
      setFlash({ tone: 'ok', text: value.dir ? '导出到 ' + value.dir + '（' + (value.files ?? 0) + ' 个文件，' + (FX_humanBytes(value.bytes) || '体积没算') + '）。' : '导出完成。' })
    } else {
      setFlash({ tone: 'ok', text: (finished.label || kind) + ' 完成了。' })
    }
    if (reload) reload()
    refreshPack()
  }

  async function doCreate() {
    const target = draft.trim()
    if (!target) {
      setFlash({ tone: 'warn', text: '先在上面写一个词、一个说法或者一整句。' })
      return
    }
    const payload = { target, examples: Number(count) || 8 }
    if (autoImages) payload.prepareCandidates = true
    const started = await startJob('pack.create', payload, 'create', '正在造料：' + target + '（同样的目标再点一次不会重复扣钱，宿主会认幂等键）')
    if (started) setDraft('')
  }

  async function cancelJob(id) {
    const value = await send('job.cancel', { id }, 'cancel')
    if (value) setJob(value)
  }

  async function pickImage(ord, candidate) {
    const value = await send('pack.pick', { id: detailId, ord, stagedName: candidate.stagedName }, 'pick:' + ord)
    if (!value) return
    setDetail({ status: 'ready', pack: value, error: null })
    setFlash({ tone: 'ok', text: '第 ' + ord + ' 条锁了这张 —— 这一下就是你点过头的凭据，账本里记了复核人。' })
    if (reload) reload()
  }

  async function unlockImage(ord) {
    const value = await send('pack.unlockImage', { id: detailId, ord }, 'unlockImage:' + ord)
    if (!value) return
    setDetail({ status: 'ready', pack: value, error: null })
    setFlash({ tone: 'ok', text: '第 ' + ord + ' 条的图放开了，回去重新挑。' })
    if (reload) reload()
  }

  async function uploadImage(ord, file) {
    if (typeof FileReader === 'undefined') {
      setFlash({ tone: 'bad', text: '这个环境读不了本地文件。' })
      return
    }
    const base64 = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        const text = String(reader.result || '')
        const comma = text.indexOf(',')
        resolve(comma >= 0 ? text.slice(comma + 1) : text)
      }
      reader.onerror = () => resolve('')
      reader.readAsDataURL(file)
    })
    if (!base64) {
      setFlash({ tone: 'bad', text: '这张图读不出来。' })
      return
    }
    const value = await send('pack.upload', { id: detailId, ord, dataBase64: base64, mediaType: file.type || '' }, 'upload:' + ord)
    if (!value) return
    setDetail({ status: 'ready', pack: value.pack || value, error: null })
    setFlash({ tone: 'ok', text: '传上去了，第 ' + ord + ' 条用这张。' })
    if (reload) reload()
  }

  async function confirmAudio(ord) {
    const value = await send('pack.confirmAudio', { id: detailId, ord }, 'confirmAudio:' + ord)
    if (!value) return
    setDetail({ status: 'ready', pack: value, error: null })
    setFlash({ tone: 'ok', text: '第 ' + ord + ' 条记成听过了。' })
    if (reload) reload()
  }

  async function unlockAudio(ord) {
    const value = await send('pack.unlockAudio', { id: detailId, ord }, 'unlockAudio:' + ord)
    if (!value) return
    setDetail({ status: 'ready', pack: value, error: null })
    if (reload) reload()
  }

  async function setVoice(voice) {
    const value = await send('pack.voice', { id: detailId, voice }, 'voice')
    if (!value) return
    setFlash({ tone: 'ok', text: '音色换成 ' + voice + '。已有语音要重新合成才算数。' })
    await refreshPack()
  }

  async function doCheck() {
    setBusy('check')
    try {
      const value = await callRpc(rpc, 'pack.check', { id: detailId })
      setCheck({ status: 'ready', value })
    } catch (failure) {
      setCheck({ status: 'error', message: failure?.message || String(failure) })
    } finally {
      setBusy('')
    }
  }

  async function doReopen() {
    const value = await send('pack.reopen', { id: detailId }, 'reopen')
    if (!value) return
    setFlash({ tone: 'ok', text: '打回去了：现在是「' + FX_statusText(value.status) + '」' + (value.hadExport ? '，之前导出过的那份还在。' : '') })
    await refreshPack()
    if (reload) reload()
  }

  async function doDelete() {
    const value = await send('pack.delete', { id: detailId }, 'delete')
    if (!value) return
    setConfirmDelete(false)
    setSelected(null)
    setDetail({ status: 'idle', pack: null, error: null })
    setFlash({ tone: 'warn', text: '包删了。导出到下载目录的那份是磁盘上的文件，这边不动它。' })
    if (reload) reload()
  }

  // ── 交给下面几块的动作用一份打包好的，省得每个组件都接七八个 props ──
  const acts = {
    pick: pickImage,
    unlockImage,
    upload: uploadImage,
    synthesize: (ord) => startJob('pack.audio', { id: detailId, ord }, 'audio:' + ord, '开始合成第 ' + ord + ' 条的语音。'),
    synthesizeAll: () => startJob('pack.audioAll', { id: detailId }, 'audioAll', '开始把整个包的语音都合成一遍。'),
    confirmAudio,
    unlockAudio,
    setVoice,
    findCandidates: (ord, query) =>
      startJob('pack.candidates', { id: detailId, ord, query: query || undefined }, 'candidates:' + ord, '去找第 ' + ord + ' 条的候选图。'),
    pickCandidatesAll: () => startJob('pack.candidatesAll', { id: detailId }, 'candidatesAll', '把这个包里还没图的条目一起找一遍。'),
  }

  // ── 中间那些句子按「全部 / 缺图 / 缺声」和一句话筛选 ──
  const examples = Array.isArray(pack?.examples) ? pack.examples : []
  const filtered = examples.filter((example) => {
    if (seg === 'noimg' && example.image) return false
    if (seg === 'noaudio' && example.audio) return false
    const needle = sentenceFilter.trim().toLowerCase()
    if (needle && !String(example.sentence || '').toLowerCase().includes(needle)) return false
    return true
  })

  const rowsShown = FX_sortedRows(
    rows.filter((row) => {
      const needle = filter.trim().toLowerCase()
      if (!needle) return true
      return row.name.toLowerCase().includes(needle)
    }),
    sortMode,
  )

  const reuseLine = job ? FX_reusedLine(job) : null
  const verdict = check?.value?.verdict || null

  return h(
    Screen,
    null,

    h(
      'header',
      { className: 'hdr' },
      h('h1', null, '工厂'),
      h('div', { className: 'sub' }, '造料 → 挑图 → 声音 → 出厂。每一步都要人点头，点完才写进账本。'),
      h(
        'div',
        { className: 'act' },
        h('span', { className: 'chip live' }, h('i'), ready ? '账本已连' : state?.status === 'loading' ? '在取账本' : '账本没连上'),
        h('button', { className: 'btn ghost', type: 'button', onClick: reload }, '重新取账本'),
      ),
    ),

    // 造料条：不管有没有包都得在，不然第一个包造不出来
    h(
      'div',
      { className: 'fx-src' },
      h('input', {
        className: 'inp',
        type: 'text',
        value: draft,
        placeholder: '一个词 / 一个说法 / 一整句，比如 run out of',
        onChange: (event) => setDraft(event.target.value),
        onKeyDown: (event) => {
          if (event.key === 'Enter') doCreate()
        },
      }),
      h(
        'select',
        { className: 'sel sm', value: count, onChange: (event) => setCount(event.target.value), title: '造几条例句' },
        ['4', '6', '8', '10', '12'].map((n) => h('option', { key: n, value: n }, n + ' 条')),
      ),
      h(
        'button',
        {
          className: 'sw' + (autoImages ? ' on' : ''),
          type: 'button',
          role: 'switch',
          'aria-checked': autoImages,
          onClick: () => setAutoImages(!autoImages),
          title: '造完例句顺手去图库找一批候选图（不点图，只是先备着）',
        },
        h('i'),
      ),
      h('span', { className: 'mut', style: { fontSize: 11 } }, autoImages ? '顺手找图' : '先只造例句'),
      h(
        'button',
        {
          className: 'btn primary',
          type: 'button',
          disabled: busy === 'create' || !draft.trim(),
          onClick: doCreate,
        },
        busy === 'create' ? '在问模型…' : '造料',
      ),
      h(
        'button',
        {
          className: 'btn ghost',
          type: 'button',
          disabled: !selected,
          onClick: () => refreshPack(),
          title: '重新取一次这个包的细节',
        },
        '刷新',
      ),
    ),

    flash ? h('div', { className: 'fx-notice ' + (flash.tone || 'info'), style: FX_noticeStyle(flash.tone) }, h('span', null, flash.text)) : null,

    // 任务条：后台在干什么、跑到哪儿、日志最后几行、幂等命中的原话
    job
      ? h(
          'div',
          { className: 'fx-job', style: FX_blockStyle() },
          h(
            'div',
            { className: 'fx-bh' },
            h('b', null, job.label || job.kind),
            h('span', { className: 'chip' + (job.status === 'running' ? ' live' : '') }, FX_jobStatusText(job.status)),
            job.progress && job.progress.total ? h('span', { className: 'mut' }, job.progress.done + '/' + job.progress.total) : null,
            h('span', { className: 'sp' }),
            job.status === 'running' ? h('button', { className: 'mini xs', type: 'button', onClick: () => cancelJob(job.id) }, '撤了') : null,
            h('button', { className: 'mini xs', type: 'button', onClick: () => setJob(null) }, '收起'),
          ),
          job.error ? h('div', { className: 'mut' }, job.error) : null,
          reuseLine
            ? h(
                'div',
                {
                  className: 'fx-reuse',
                  style: {
                    fontSize: 12,
                    padding: '6px 9px',
                    borderRadius: 9,
                    color: 'var(--fg)',
                    background: 'rgba(255,196,120,.12)',
                    border: '1px solid rgba(255,196,120,.28)',
                  },
                },
                '这是上次造的，没再花钱 —— 宿主原话：' + reuseLine,
              )
            : null,
          Array.isArray(job.log) && job.log.length
            ? h(
                'ul',
                { className: 'fx-joblog', style: FX_logStyle() },
                job.log.slice(-6).map((line, index) => h('li', { key: index }, line)),
              )
            : null,
        )
      : null,

    // 后台还有别的任务在跑（刷新之后接不回来的那种）
    !job && Array.isArray(state?.jobs) && state.jobs.length
      ? h(
          'div',
          { className: 'fx-notice info', style: FX_noticeStyle('info') },
          h('span', null, '后台还有 ' + state.jobs.length + ' 个任务在跑：' + state.jobs.map((one) => one.label || one.kind).join('、')),
          h(
            'button',
            { className: 'mini xs', type: 'button', onClick: () => setJob(state.jobs[0]) },
            '接上来看',
          ),
        )
      : null,

    error
      ? h(
          'div',
          { className: 'card', style: { padding: '20px 24px', display: 'grid', gap: 12 } },
          h('div', { className: 'sec-title' }, '账本没取到'),
          h('p', { className: 'mut' }, error),
          h('button', { className: 'btn ghost', type: 'button', onClick: reload }, '重试'),
        )
      : null,

    h(
      'div',
      { className: 'fx-grid' },
      h(FactoryWords, {
        rows: rowsShown,
        selected,
        filter,
        sortMode,
        onFilter: setFilter,
        onSort: setSortMode,
        onSelect: (id) => {
          setSelected(id)
          setOpenOrd(null)
          setCheck(null)
          setConfirmDelete(false)
        },
      }),

      h(
        'section',
        { className: 'fx-main' },

        detail.status === 'idle'
          ? h(
              'div',
              { style: { display: 'grid', gap: 8 } },
              h('div', { className: 'fx-wordhd' }, h('h2', null, '还没挑包')),
              h('p', { className: 'mut' }, rows.length ? '左边点一个包，这里就会摊开它的例句和素材。' : '账本里还没有包。在上面写一个词，点「造料」—— 第一个包不用你配任何东西。'),
            )
          : null,

        detail.status === 'loading'
          ? h(
              'div',
              { style: { display: 'grid', gap: 8 } },
              h('div', { className: 'fx-wordhd' }, h('h2', null, '取包里…')),
              h('p', { className: 'mut' }, '正在从账本把这个包的例句和素材取回来。'),
            )
          : null,

        detail.status === 'error'
          ? h(
              'div',
              { className: 'card', style: { padding: '18px 20px', display: 'grid', gap: 10 } },
              h('div', { className: 'sec-title' }, '这个包取不到'),
              h('p', { className: 'mut' }, detail.error),
              h('button', { className: 'btn ghost', type: 'button', onClick: () => refreshPack() }, '再试一次'),
            )
          : null,

        detail.status === 'ready' && pack
          ? h(
              'div',
              { style: { display: 'contents' } },
              h(
                'div',
                { className: 'fx-wordhd' },
                h('h2', null, pack.target || '(未命名)'),
                pack.ipa ? h('span', { className: 'mut opt' }, '[' + pack.ipa + ']') : null,
                h('span', { className: 'chip' }, FX_kindText(pack.kind)),
                h('span', { className: 'chip' }, FX_statusText(pack.status)),
                h('span', { className: 'sp' }),
                h('button', { className: 'mini', type: 'button', disabled: Boolean(busy), onClick: doCheck }, busy === 'check' ? '在查…' : '校验'),
                h('button', { className: 'mini', type: 'button', disabled: Boolean(busy), onClick: () => startJob('pack.pack', { id: pack.id }, 'pack', '开始打包（缺图或没试听过的会被挡住）。') }, '打包'),
                h('button', { className: 'mini go', type: 'button', disabled: Boolean(busy), onClick: () => startJob('pack.export', { id: pack.id }, 'export', '开始导出成品包。') }, '导出'),
                h('button', { className: 'mini xs', type: 'button', disabled: Boolean(busy) || !(pack.status === 'packed' || pack.status === 'exported'), onClick: doReopen, title: '把已打包的包退回素材阶段接着改' }, '打回'),
              ),

              h(
                'div',
                { className: 'fx-info' },
                h('span', null, h('b', null, String(pack.progress?.total ?? examples.length)), '条例句'),
                h('span', null, h('b', null, String(pack.progress?.images ?? 0)), '条有图'),
                h('span', null, h('b', null, String(pack.progress?.audios ?? 0)), '条听过了'),
                h('span', null, h('b', null, String(pack.examples?.length ? pack.examples.filter((one) => one.imageCandidates?.length).length : 0)), '条备了候选'),
                h('span', { className: 'sub' }, pack.pack?.dir ? '包目录：' + pack.pack.dir : '还没打包'),
                pack.export?.dir ? h('span', { className: 'sub' }, '导出去过：' + pack.export.dir) : null,
              ),

              check
                ? h(
                    'div',
                    { className: 'fx-bill', style: FX_blockStyle() },
                    h(
                      'div',
                      { className: 'fx-bh' },
                      h('b', null, '校验'),
                      h('span', { className: 'chip' }, check.status === 'ready' ? (verdict && (verdict.errors || []).length === 0 ? '过得去' : '过不去') : '没查成'),
                      h('span', { className: 'sp' }),
                      h('button', { className: 'mini xs', type: 'button', onClick: () => setCheck(null) }, '收起'),
                    ),
                    check.status === 'error'
                      ? h('p', { className: 'note mut' }, check.message)
                      : h(
                          'ul',
                          { style: FX_logStyle() },
                          (verdict?.errors || [])
                            .slice(0, 5)
                            .map((one, index) => h('li', { key: 'e' + index }, '错：' + (one.message || one)))
                            .concat(
                              (verdict?.warnings || [])
                                .slice(0, 3)
                                .map((one, index) => h('li', { key: 'w' + index }, '提醒：' + (one.message || one))),
                            ),
                        ),
                    check.status === 'ready' && !verdict
                      ? h('p', { className: 'note mut' }, '宿主没给 verdict，只有清单。')
                      : null,
                  )
                : null,

              h(
                'div',
                { className: 'fx-tools' },
                h('input', {
                  className: 'inp sm',
                  type: 'search',
                  value: sentenceFilter,
                  placeholder: '筛句子…',
                  onChange: (event) => setSentenceFilter(event.target.value),
                }),
                h('button', { className: 'mini' + (seg === 'all' ? ' on' : ''), type: 'button', onClick: () => setSeg('all') }, '全部'),
                h('button', { className: 'mini' + (seg === 'noimg' ? ' on' : ''), type: 'button', onClick: () => setSeg('noimg') }, '缺图'),
                h('button', { className: 'mini' + (seg === 'noaudio' ? ' on' : ''), type: 'button', onClick: () => setSeg('noaudio') }, '缺声'),
                h('span', { className: 'sp' }),
                h('span', { className: 'mtag' }, filtered.length + ' 条'),
                h('button', { className: 'mini', type: 'button', disabled: Boolean(busy), onClick: acts.pickCandidatesAll }, '批量找图'),
                h('button', { className: 'mini', type: 'button', disabled: Boolean(busy), onClick: acts.synthesizeAll }, '批量造声'),
                h(
                  'button',
                  {
                    className: 'btn sm primary',
                    type: 'button',
                    disabled: Boolean(busy),
                    onClick: () => startJob('pack.pack', { id: pack.id }, 'pack', '开始打包。缺图、没试听过的会被挡住，这是故意的。'),
                  },
                  '批量出厂',
                ),
              ),

              h(
                'div',
                { className: 'fx-list' },
                h(FactorySense, {
                  rpc,
                  pack,
                  examples: filtered,
                  openOrd,
                  onOpen: setOpenOrd,
                  voices,
                  busy,
                  acts,
                }),
              ),

              h(
                'p',
                { className: 'fx-foot' },
                '这些是绕不过去的：每条都要有图、每张图都要你点过头、每条语音都要听到六成才算听过 —— 三条差一条，打包就会挡住并告诉你差第几条。删包的按钮在右边：',
                ' ',
                confirmDelete
                  ? h(
                      'button',
                      { className: 'mini xs danger', type: 'button', disabled: Boolean(busy), onClick: doDelete },
                      '真的删（磁盘上导出过的那份不动）',
                    )
                  : h(
                      'button',
                      { className: 'mini xs danger', type: 'button', onClick: () => setConfirmDelete(true), title: '删之前要再点一次' },
                      '删掉这个包',
                    ),
                confirmDelete
                  ? h(
                      'button',
                      { className: 'mini xs', type: 'button', onClick: () => setConfirmDelete(false) },
                      '算了',
                    )
                  : null,
                h('br'),
                '导出目录：' + (state?.exportDir || '宿主没给') + '。',
              ),
            )
          : null,
      ),
    ),
  )
}


/* ===================== 60-stats.js ===================== */
/* 60 · 统计页：只画账本里真的有的数
   设计稿（design/gen.mjs 的 screens.stats）画的是 Anki 的复习历史 —— 今天练了几次、
   未来到期预测、半年热力图、卡片数量环图、记忆保留率。这一版插件里没有调度引擎、
   没有复习记录、也没有「复习次数」这个字段，那些图一张都画不出来。
   所以这一屏只画能从 state 里真算出来的东西：
     包数 / 例句总数 / 配图完成度 / 语音完成度 / 全齐的包 / 状态分布 / 最近新建 /
     在跑的任务 / 自检结果 / 数据目录与版本。
   其余位置写清楚「这一项等调度引擎做出来才有」—— 编一条假曲线比空着更糟。 */

/* ── 小工具：数值、日期、百分比 ─────────────────────────────── */

/* 只认「正的有限数」，undefined / null / '3 条' / NaN 一律当 0，避免图表里出现 NaN */
function ST_Num(v) {
  const n = Number(v)
  return isFinite(n) && n > 0 ? n : 0
}

function ST_Pad2(n) {
  return n < 10 ? '0' + n : String(n)
}

function ST_DateKey(d) {
  return d.getFullYear() + '-' + ST_Pad2(d.getMonth() + 1) + '-' + ST_Pad2(d.getDate())
}

function ST_Md(d) {
  return ST_Pad2(d.getMonth() + 1) + '-' + ST_Pad2(d.getDate())
}

function ST_Pct(part, whole) {
  return whole > 0 ? Math.round((part / whole) * 100) : 0
}

function ST_Dur(ms) {
  const s = Math.max(0, Math.round(ST_Num(ms) / 1000))
  if (s < 60) return s + ' 秒'
  const m = Math.floor(s / 60)
  const rest = s % 60
  return rest ? m + ' 分 ' + rest + ' 秒' : m + ' 分钟'
}

/* ── 读 state：包、状态、汇总、每日、任务、自检、目录 ──────── */

function ST_Packs(state) {
  return state && Array.isArray(state.packs) ? state.packs : []
}

/* 真实 status 只有六种（lib/packs.js）：generating / text / media / packed /
   exported / failed。STATUS_TEXT（20-bridge.js:75）那五个是设计稿的词，
   真数据里永远对不上，所以这里两套都认，查不到就照原样显示，不硬编。 */
function ST_StatusDefs() {
  return [
    { id: 'generating', label: '造例句中', color: 'c3' },
    { id: 'text', label: '例句已出', color: 'c1' },
    { id: 'media', label: '找素材', color: 'c7' },
    { id: 'packed', label: '已打包', color: 'c6' },
    { id: 'exported', label: '已导出', color: 'c9' },
    { id: 'failed', label: '失败了', color: 'c4' },
    { id: 'draft', label: '刚建好', color: 'c8' },
    { id: 'examples', label: '造例句', color: 'c3' },
    { id: 'review', label: '等确认', color: 'c5' },
    { id: 'ready', label: '能出厂', color: 'c2' },
  ]
}

function ST_StatusDef(status) {
  const defs = ST_StatusDefs()
  for (let i = 0; i < defs.length; i += 1) {
    if (defs[i].id === status) return defs[i]
  }
  return null
}

function ST_StatusLabel(status) {
  const def = ST_StatusDef(status)
  if (def) return def.label
  if (typeof STATUS_TEXT !== 'undefined' && STATUS_TEXT && STATUS_TEXT[status]) return STATUS_TEXT[status]
  return status ? String(status) : '未知'
}

function ST_StatusColor(status) {
  const def = ST_StatusDef(status)
  return def ? def.color : 'c8'
}

/* 一堆包求和。progress.done 是布尔（lib/store.js:126 packProgress），不是条数：
   「两样都齐」的例句数要按包把 progress.total 加进去，不能直接拿 done 求和。 */
function ST_Totals(state) {
  const packs = ST_Packs(state)
  let total = 0
  let images = 0
  let audios = 0
  let both = 0
  let learnable = 0
  let exported = 0
  let failed = 0
  const byStatus = {}
  packs.forEach((p) => {
    const pr = p && p.progress ? p.progress : {}
    const n = ST_Num(pr.total)
    total += n
    images += ST_Num(pr.images)
    audios += ST_Num(pr.audios)
    if (pr.done === true && n > 0) both += n
    if (p && p.learnable === true) learnable += 1
    if (p && p.exportedAt) exported += 1
    if (p && p.status === 'failed') failed += 1
    const s = (p && p.status) || 'unknown'
    byStatus[s] = (byStatus[s] || 0) + 1
  })
  return {
    count: packs.length,
    total,
    images,
    audios,
    both,
    learnable,
    exported,
    failed,
    byStatus,
  }
}

/* 按 createdAt 落地本地日期，取最近 days 天（含今天）的新建包数 */
function ST_Daily(state, days) {
  const packs = ST_Packs(state)
  const n = days > 0 ? days : 14
  const out = []
  const index = {}
  const now = new Date()
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const key = ST_DateKey(d)
    index[key] = out.length
    out.push({ key, day: d, value: 0 })
  }
  packs.forEach((p) => {
    const t = p && p.createdAt ? Date.parse(p.createdAt) : NaN
    if (!isFinite(t)) return
    const key = ST_DateKey(new Date(t))
    if (key in index) out[index[key]].value += 1
  })
  return out
}

/* selfcheck 真实形状是对象 {checks:[{id,ok,detail}],...}（lib/rpc.js），
   tests/client-smoke.mjs 喂的却是数组 —— 两种都收，别让页面炸。 */
function ST_Checks(state) {
  const sc = state && state.selfcheck
  const list = Array.isArray(sc) ? sc : sc && Array.isArray(sc.checks) ? sc.checks : []
  return list.filter((one) => one && typeof one === 'object')
}

function ST_CheckName(id) {
  const map = {
    node: 'Node 运行时',
    sharp: 'sharp 图像库',
    ws: 'WebSocket 通道',
    fetch: '网络请求 fetch',
    network: '外网连通',
    llm: '模型接口',
    storage: '数据目录可写',
  }
  return map[id] || String(id || '未命名检查')
}

function ST_JobKind(kind) {
  const map = {
    create: '造例句',
    candidates: '找候选图',
    'candidates-all': '批量找候选图',
    audio: '合成语音',
    'audio-all': '批量合成语音',
    pack: '打包',
    export: '导出',
    sample: '试听样本',
  }
  return map[kind] || String(kind || '任务')
}

function ST_Where(state) {
  const sc = state && state.selfcheck && !Array.isArray(state.selfcheck) ? state.selfcheck : {}
  const rows = []
  const add = (k, v) => {
    if (v) rows.push({ k, v: String(v) })
  }
  add('数据目录', (state && state.root) || sc.root)
  add('导出目录', (state && state.exportDir) || sc.exportDir)
  add('配置目录', sc.profile)
  add('代理', sc.proxy)
  add('版本', (state && state.version) || sc.version)
  return rows
}

/* ── 两种图：竖柱图 + 环图（手写 SVG，不引图表库） ───────────── */

/* 照 design/gen.mjs:1494 的 barChart：等宽槽位、柱宽 3–22、底部留 22 给标签、
   0 值不画柱（一排 0 高柱子等于假图，只留标签）。宽度变量叫 boxW/boxH，
   不能叫 w/h —— h 是 00-base.js 里的 createElement，局部一遮蔽整张图就炸。
   viewBox 宽默认 1000：卡最宽 1040（.screen.half），画布跟容器差不多宽才不会
   按 preserveAspectRatio 缩小、两边留一大块空白（620 宽时实测两边各空 200px）。 */
function StatsBars(props) {
  const items = Array.isArray(props.items) ? props.items : []
  if (!items.length) return null
  const boxW = props.width || 1000
  const boxH = props.height || 170
  const base = 22
  const top = 14
  const pad = props.axis === false ? 0 : 34
  const plotW = boxW - pad
  const bottom = boxH - base
  const areaH = bottom - top
  const peak = items.reduce((m, one) => Math.max(m, ST_Num(one.value)), 0)
  const max = props.max && props.max > 0 ? props.max : peak
  if (!max || !peak) return null

  const kids = []
  kids.push(h('line', { key: 'gbase', x1: 0, y1: bottom, x2: plotW, y2: bottom, className: 'gbase' }))
  const steps = [0.25, 0.5, 0.75]
  steps.forEach((f) => {
    const y = Math.round(bottom - areaH * f)
    kids.push(h('line', { key: 'gl' + f, x1: 0, y1: y, x2: plotW, y2: y, className: 'gl' }))
  })
  if (pad) {
    const ticks = [1, 0.5]
    ticks.forEach((f) => {
      const y = Math.round(bottom - areaH * f)
      kids.push(
        h('text', { key: 'ty' + f, x: plotW + 9, y: y + 3.5, textAnchor: 'start', className: 'tx ty' }, String(Math.round(max * f))),
      )
    })
  }

  const slot = plotW / Math.max(1, items.length)
  const barW = Math.max(3, Math.min(22, slot * 0.46))
  items.forEach((one, i) => {
    const v = ST_Num(one.value)
    const cx = i * slot + slot / 2
    if (one.label) {
      kids.push(h('text', { key: 'lb' + i, x: cx, y: boxH - 6, textAnchor: 'middle', className: 'tx' }, one.label))
    }
    if (!(v > 0)) return
    const bh = Math.max(2, (v / max) * areaH)
    const bw = Math.min(barW, slot * 0.8)
    kids.push(
      h(
        'rect',
        {
          key: 'b' + i,
          x: i * slot + (slot - bw) / 2,
          y: bottom - bh,
          width: bw,
          height: bh,
          rx: Math.min(4, bw / 2),
          className: 'bar ' + (one.color || 'c1'),
        },
        h('title', { key: 't' }, one.tip || String(v)),
      ),
    )
  })

  return h(
    'svg',
    { className: 'chart bars', viewBox: '0 0 ' + boxW + ' ' + boxH, width: '100%', height: boxH, role: 'img', 'aria-label': props.label || '' },
    kids,
  )
}

/* 照 design/gen.mjs:1583 的 donut：r = size/2 - thick/2 - 6，每段留 2.4 的缝，
   stroke-dasharray 画弧、rotate(-90) 从 12 点起，中心两行字。 */
function StatsDonut(props) {
  const parts = (Array.isArray(props.parts) ? props.parts : []).filter((one) => ST_Num(one.value) > 0)
  const total = parts.reduce((sum, one) => sum + ST_Num(one.value), 0)
  if (!total) return null
  const size = props.size || 200
  const thick = props.thick || 18
  const gap = 2.4
  const r = size / 2 - thick / 2 - 6
  const c = 2 * Math.PI * r
  const cx = size / 2

  const arcs = []
  let offset = 0
  parts.forEach((one, i) => {
    const raw = (ST_Num(one.value) / total) * c
    const len = Math.max(0.0001, raw - (parts.length > 1 ? gap : 0))
    const pct = Math.round((ST_Num(one.value) / total) * 100)
    arcs.push(
      h(
        'circle',
        {
          key: 'd' + i,
          className: 'dc ' + (one.color || 'c1'),
          cx: cx,
          cy: cx,
          r: r,
          fill: 'none',
          strokeWidth: thick,
          strokeLinecap: 'butt',
          strokeDasharray: len.toFixed(2) + ' ' + (c - len).toFixed(2),
          strokeDashoffset: (-offset).toFixed(2),
          transform: 'rotate(-90 ' + cx + ' ' + cx + ')',
        },
        h('title', { key: 't' }, (one.label || '') + ' · ' + ST_Num(one.value) + ' 个（' + pct + '%）'),
      ),
    )
    offset += raw
  })

  const digits = String(total).length
  const big = digits >= 4 ? size * 0.16 : size * 0.19
  const kids = [
    h('g', { className: 'dspin', key: 'g' }, [h('circle', { key: 'tr', className: 'dtrack', cx: cx, cy: cx, r: r, fill: 'none', strokeWidth: thick })].concat(arcs)),
    h(
      'text',
      { key: 'big', x: cx, y: cx + big * 0.24, textAnchor: 'middle', className: 'donut-big', style: { fontSize: big.toFixed(1) + 'px' } },
      String(total),
    ),
    h(
      'text',
      { key: 'lab', x: cx, y: cx + big * 0.24 + 19, textAnchor: 'middle', className: 'donut-label' },
      props.centerLabel || '',
    ),
  ]
  return h('svg', { className: 'chart donut', viewBox: '0 0 ' + size + ' ' + size, width: size, height: size, role: 'img' }, kids)
}

/* ── 卡壳：卡头 + 空/加载/出错三态 ──────────────────────────── */

function StatsCard({ id, title, mut, children }) {
  return h(
    'section',
    { className: 'card stat', id },
    h(
      'div',
      { className: 'shead2' },
      h('span', { className: 'stitle' }, title),
      mut ? h('span', { className: 'smut' }, mut) : null,
    ),
    children,
  )
}

/* 三种态共用 .state 骨架（design/app.css:7052），只换修饰类：
   空 = 虚线框 + 三条空行；加载中 = 实线框 + 转圈 + 三条骨架条；出错 = 圆点 + 重试。 */
function StatsBlock({ kind, title, hint, note, onRetry, retryText }) {
  const cls = 'state state-sm' + (kind === 'loading' ? ' state-loading' : kind === 'error' ? ' state-error' : '')
  return h(
    'div',
    { className: cls, role: kind === 'error' ? 'alert' : undefined },
    h('div', { className: 'state-fig', 'aria-hidden': 'true' }),
    h('div', { className: 'state-title' }, title),
    hint ? h('div', { className: 'state-hint' }, hint) : null,
    note ? h('div', { className: 'state-note' }, note) : null,
    kind === 'loading' ? h('div', { className: 'st-sk' }, h('i', { key: 1 }), h('i', { key: 2 }), h('i', { key: 3 })) : null,
    onRetry
      ? h('div', { className: 'state-acts' }, h('button', { className: 'btn primary', type: 'button', onClick: onRetry }, retryText || '重试'))
      : null,
  )
}

function StatsSum({ label, value }) {
  return h('div', null, h('span', { className: 'mut' }, label), h('b', null, String(value)))
}

/* ── 1 · 规模：全是求和，没有一项是估的 ─────────────────────── */

function StatsScaleCard({ state }) {
  const t = ST_Totals(state)
  const gapImage = Math.max(0, t.total - t.images)
  const gapAudio = Math.max(0, t.total - t.audios)

  if (!t.count) {
    return h(
      StatsCard,
      { id: 's-scale', title: '规模', mut: '账本里的全部家底' },
      h(StatsBlock, {
        kind: 'empty',
        title: '账本里还没有包',
        hint: '去卡片页造第一个包：造完这一屏就有数了。这里统计的是包、例句、配图、语音——都是真数出来的，不是示例。',
        note: '包数 = state.packs.length；例句 = Σ progress.total。',
      }),
    )
  }

  return h(
    StatsCard,
    { id: 's-scale', title: '规模', mut: t.count + ' 个包 · ' + t.total + ' 条例句' },
    h(
      'div',
      { className: 'sums' },
      h(StatsSum, { label: '包', value: t.count }),
      h(StatsSum, { label: '例句', value: t.total }),
      h(StatsSum, { label: '配图齐', value: t.images }),
      h(StatsSum, { label: '语音齐', value: t.audios }),
      h(StatsSum, { label: '能出厂', value: t.learnable }),
    ),
    h(
      'p',
      { className: 'takeaway' },
      gapImage || gapAudio
        ? '还差 ' + gapImage + ' 条配图、' + gapAudio + ' 条语音；两样都齐的包才算能出厂，现在有 ' + t.learnable + ' 个。'
        : '所有例句的配图和语音都齐了，' + t.learnable + ' 个包能出厂。',
    ),
  )
}

/* ── 2 · 素材完成度：以例句总数为分母的三根柱 ───────────────── */

function StatsProgressCard({ state }) {
  const t = ST_Totals(state)
  if (!t.total) {
    return h(
      StatsCard,
      { id: 's-progress', title: '素材完成度', mut: '配图 / 语音 / 两样都齐' },
      h(StatsBlock, {
        kind: 'empty',
        title: '还没有例句，完成度没有分母',
        hint: '先造一个包的例句。配图完成度和语音完成度都是「已确认条数 ÷ 例句总数」，一条例句都没有的时候这个除法没有意义。',
        note: '语音要你亲耳点过才算（audioReview.listened），所以这一项通常比配图慢。',
      }),
    )
  }

  const pctImage = ST_Pct(t.images, t.total)
  const pctAudio = ST_Pct(t.audios, t.total)
  const pctBoth = ST_Pct(t.both, t.total)
  return h(
    StatsCard,
    { id: 's-progress', title: '素材完成度', mut: '满值 = ' + t.total + ' 条例句' },
    h(
      'div',
      { className: 'chartbox' },
      h(StatsBars, {
        items: [
          { label: '配图', value: t.images, color: 'c1', tip: '配图 ' + t.images + '/' + t.total + '（' + pctImage + '%）' },
          { label: '语音', value: t.audios, color: 'c6', tip: '语音 ' + t.audios + '/' + t.total + '（' + pctAudio + '%）' },
          { label: '两样都齐', value: t.both, color: 'c3', tip: '两样都齐 ' + t.both + '/' + t.total + '（' + pctBoth + '%）' },
        ],
        max: t.total,
        height: 170,
        label: '素材完成度',
      }),
    ),
    h(
      'div',
      { className: 'sums' },
      h(StatsSum, { label: '配图', value: pctImage + '%' }),
      h(StatsSum, { label: '语音', value: pctAudio + '%' }),
      h(StatsSum, { label: '两样都齐', value: pctBoth + '%' }),
    ),
    h(
      'p',
      { className: 'takeaway' },
      '配图 = Σ progress.images ÷ Σ progress.total，语音 = Σ progress.audios ÷ 同一个分母。语音那一项要你自己听过一遍才算数，所以它比配图慢是正常的。',
    ),
  )
}

/* ── 3 · 状态分布：环形图 + 图例（按真实 status 分组） ──────── */

function StatsStatusCard({ state }) {
  const t = ST_Totals(state)
  if (!t.count) {
    return h(
      StatsCard,
      { id: 's-status', title: '状态分布', mut: '每个包现在停在哪一步' },
      h(StatsBlock, {
        kind: 'empty',
        title: '还没有包，分不出阶段',
        hint: '包的状态只会在「造例句 → 找素材 → 打包 → 导出」这条线上走。一个包都没有的时候，这张图没有东西可分。',
      }),
    )
  }

  const defs = ST_StatusDefs()
  const groups = []
  defs.forEach((def) => {
    if (t.byStatus[def.id] > 0) groups.push({ name: def.label, value: t.byStatus[def.id], color: def.color, id: def.id })
  })
  const known = {}
  defs.forEach((def) => {
    known[def.id] = true
  })
  Object.keys(t.byStatus).forEach((key) => {
    if (!known[key] && t.byStatus[key] > 0) groups.push({ name: ST_StatusLabel(key), value: t.byStatus[key], color: 'c8', id: key })
  })

  let top = groups[0]
  groups.forEach((g) => {
    if (g.value > top.value) top = g
  })
  /* 并列最多时别说「就是这一步最堵」—— 那句话只在真的有个最大值时成立 */
  const tiedWithTop = groups.filter((g) => g.value === top.value).length
  const legend = groups.map((g) =>
    h(
      'li',
      { key: g.id },
      h('i', { className: g.color }),
      h('span', null, g.name),
      h('b', null, String(g.value)),
      h('span', { className: 'mut' }, ST_Pct(g.value, t.count) + '%'),
    ),
  )
  legend.push(
    h(
      'li',
      { className: 'tot', key: 'tot' },
      h('span', { className: 'mut' }, '总计'),
      h('b', null, String(t.count)),
      h('span', { className: 'mut' }, '100%'),
    ),
  )

  return h(
    StatsCard,
    { id: 's-status', title: '状态分布', mut: '按包的 status 分组 · ' + t.count + ' 个' },
    h(
      'div',
      { className: 'donutwrap' },
      h('div', { className: 'donut-center' }, h(StatsDonut, { parts: groups, size: 200, centerLabel: '个包' })),
      h('ul', { className: 'legend' }, legend),
    ),
    h(
      'p',
      { className: 'takeaway' },
      groups.length > 1
        ? tiedWithTop > 1
          ? '有 ' + tiedWithTop + ' 个阶段一样多（各 ' + top.value + ' 个），说不上堵在哪一步。'
          : '最多的一步是「' + top.name + '」' + top.value + ' 个（' + ST_Pct(top.value, t.count) + '%），这一步就是现在最堵的地方。'
        : '所有包都停在同一处：「' + top.name + '」。',
    ),
  )
}

/* ── 4 · 最近两周新建：按 createdAt 落本地日期分桶 ──────────── */

function StatsAddedCard({ state }) {
  const days = ST_Daily(state, 14)
  const sum = days.reduce((n, d) => n + d.value, 0)
  const packCount = ST_Packs(state).length

  if (!sum) {
    return h(
      StatsCard,
      { id: 's-added', title: '最近两周新建', mut: '最近 14 天' },
      h(StatsBlock, {
        kind: 'empty',
        title: '最近 14 天没有新建的包',
        hint: packCount
          ? '账本里那 ' + packCount + ' 个包都是 14 天以前建的。想再造一个回卡片页输入一个词就行。'
          : '账本里还一个包都没有，所以每天都是 0——这张图没有可画的柱子。',
        note: '按 pack.createdAt 落本地日期统计，跨月的天按本地时区算。',
      }),
    )
  }

  /* 并列最多是常态（一天就造一个包），所以不能只报「第一个最大的那天」——
     那会把 10-28 说成唯一的高峰，而 11-01 明明也一样多。改成：
     报最近的那天 + 数一共几天一样多。 */
  let peak = 0
  days.forEach((d) => {
    if (d.value > peak) peak = d.value
  })
  let best = days[0]
  days.forEach((d) => {
    if (d.value === peak) best = d
  })
  const ties = days.filter((d) => d.value === peak).length
  const items = days.map((d, at) => ({
    label: d.day.getDate() === 1 || at === days.length - 1 ? ST_Md(d.day) : '',
    value: d.value,
    color: 'c1',
    tip: ST_Md(d.day) + ' · 新建 ' + d.value + ' 个包',
  }))

  return h(
    StatsCard,
    { id: 's-added', title: '最近两周新建', mut: '最近 14 天 · 共 ' + sum + ' 个' },
    h('div', { className: 'chartbox' }, h(StatsBars, { items, height: 150, label: '最近 14 天新建的包' })),
    h(
      'p',
      { className: 'takeaway' },
      ties > 1
        ? '有 ' + ties + ' 天一样多（各 ' + peak + ' 个），最近一次是 ' + ST_Md(best.day) + '；14 天平均每天 ' + (sum / 14).toFixed(1) + ' 个。'
        : '最多的一天是 ' + ST_Md(best.day) + '，新建了 ' + best.value + ' 个；14 天平均每天 ' + (sum / 14).toFixed(1) + ' 个。',
    ),
  )
}

/* ── 5 · 复习历史：设计稿这一整屏，插件里没有数据 ───────────── */

function StatsMissingRows() {
  return [
    { k: '今天', v: '每小时练了几次、练了多久 —— 要每次作答的时间戳' },
    { k: '预测', v: '未来每天到期多少张 —— 要调度引擎的到期队列' },
    { k: '日程表', v: '半年热力图 —— 要按天累计的复习次数' },
    { k: '卡片数量', v: 'Unlearned / Learning / Relearning 分面 —— 要每张卡的记忆状态' },
    { k: '复习 / 复习间隔', v: '答了多少次、下次隔几天再来 —— 要 SM-2 那套调度' },
    { k: '卡片简易度', v: 'Easy / Good / Hard / Again 的分布 —— 要每次回答后的难度记录' },
    { k: '记忆保留率', v: '按间隔档统计答对率 —— 要成对的历史作答' },
    { k: '逐小时分析', v: '一天里哪个钟点最准 —— 要全部作答的时间戳' },
  ]
}

function StatsReviewCard() {
  const rows = StatsMissingRows()
  return h(
    StatsCard,
    { id: 's-review', title: '复习历史', mut: '这一屏设计稿画的东西 · 现在没有数据' },
    h(StatsBlock, {
      kind: 'empty',
      title: '账本里没有任何一次作答记录',
      hint: '设计稿这一屏画的是 Anki 的复习历史。插件现在只有「包 / 例句 / 配图 / 语音」，没有调度引擎，也从来没记过谁在哪一秒点过哪个按钮——所以下面这些图一个都画不出来。',
      note: '这不是加载失败，是账本里根本没有这项数据。等调度引擎做出来才有。',
    }),
    h(
      'ul',
      {
        className: 'stt-missing',
        style: { listStyle: 'none', margin: '16px 0 0', padding: 0, display: 'grid', gap: 0 },
      },
      rows.map((row) =>
        h(
          'li',
          {
            key: row.k,
            style: {
              display: 'grid',
              gridTemplateColumns: '132px minmax(0,1fr)',
              gap: '12px',
              alignItems: 'baseline',
              padding: '7px 0',
              borderTop: '1px solid rgba(var(--w),.05)',
              fontSize: '12.5px',
              color: 'var(--fg2)',
            },
          },
          h('span', { style: { color: 'var(--fg)' } }, row.k),
          h('span', { className: 'mut', style: { fontSize: '11.5px', lineHeight: 1.6 } }, row.v),
        ),
      ),
    ),
  )
}

/* ── 6 · 正在跑的任务：state.jobs 只含 running ─────────────── */

function StatsJobsCard({ state }) {
  const jobs = state && Array.isArray(state.jobs) ? state.jobs.filter((j) => j && typeof j === 'object') : []
  if (!jobs.length) {
    return h(
      StatsCard,
      { id: 's-jobs', title: '正在跑的任务', mut: '现在没有' },
      h(StatsBlock, {
        kind: 'empty',
        title: '现在没有在跑的任务',
        hint: '造例句、找候选图、合成语音、打包、导出这些活儿，跑起来的时候会出现在这里，带进度和最后一句日志。',
        note: '这里只列 state.jobs 里 status 为 running 的；跑完的会被服务端从这份列表里拿掉。',
      }),
    )
  }

  const rows = jobs.map((job, at) => {
    const pr = job.progress && typeof job.progress === 'object' ? job.progress : null
    const done = pr ? ST_Num(pr.done) : 0
    const total = pr ? ST_Num(pr.total) : 0
    const pct = total > 0 ? ST_Pct(done, total) : 0
    const log = Array.isArray(job.log) && job.log.length ? job.log[job.log.length - 1] : ''
    const meta = [
      ST_JobKind(job.kind),
      total > 0 ? done + '/' + total + '（' + pct + '%）' : '进度未报',
      job.startedAt ? '已跑 ' + ST_Dur(Date.now() - ST_Num(job.startedAt)) : '',
    ].filter(Boolean)
    return h(
      'div',
      {
        key: String(job.id || job.label || 'job-' + at),
        className: 'stt-job',
        style: {
          display: 'grid',
          gridTemplateColumns: '10px minmax(0,1fr)',
          gap: '10px',
          alignItems: 'start',
          padding: '10px 0',
          borderTop: '1px solid rgba(var(--w),.06)',
        },
      },
      h('i', { className: 'pip ok', style: { marginTop: 5 } }),
      h(
        'div',
        { style: { minWidth: 0 } },
        h(
          'div',
          { style: { fontSize: '12.5px', color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
          job.label ? String(job.label) : ST_JobKind(job.kind),
        ),
        h('div', { className: 'mut', style: { fontSize: '11.5px', lineHeight: 1.6 } }, meta.join(' · ')),
        log
          ? h(
              'div',
              {
                className: 'mut',
                style: {
                  fontSize: '11px',
                  lineHeight: 1.6,
                  color: 'var(--ghost)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                },
              },
              String(log),
            )
          : null,
      ),
    )
  })

  return h(
    StatsCard,
    { id: 's-jobs', title: '正在跑的任务', mut: jobs.length + ' 个在跑' },
    h('div', null, rows),
    h('p', { className: 'takeaway' }, '这些数字是页面打开那一刻的快照。要刷新就点右上角「刷新」——不会打断正在跑的任务。'),
  )
}

/* ── 7 · 自检：state.selfcheck.checks ──────────────────────── */

function StatsCheckCard({ state, onReload }) {
  const checks = ST_Checks(state)
  const okCount = checks.filter((c) => c.ok === true).length

  return h(
    StatsCard,
    {
      id: 's-check',
      title: '自检',
      mut: checks.length ? okCount + '/' + checks.length + ' 项通过' : '没有结果',
    },
    checks.length
      ? h(
          'div',
          null,
          checks.map((c) =>
            h(
              'div',
              {
                key: String(c.id),
                style: {
                  display: 'grid',
                  gridTemplateColumns: '10px minmax(0,1fr)',
                  gap: '10px',
                  alignItems: 'start',
                  padding: '9px 0',
                  borderTop: '1px solid rgba(var(--w),.06)',
                },
              },
              h('i', { className: 'pip ' + (c.ok === true ? 'ok' : 'bad'), style: { marginTop: 5 } }),
              h(
                'div',
                { style: { minWidth: 0 } },
                h(
                  'div',
                  { style: { fontSize: '12.5px', color: 'var(--fg)' } },
                  ST_CheckName(c.id) + (c.ok === true ? '' : ' · 不通'),
                ),
                c.detail ? h('div', { className: 'mut', style: { fontSize: '11.5px', lineHeight: 1.6 } }, String(c.detail)) : null,
              ),
            ),
          ),
          h(
            'p',
            { className: 'takeaway' },
            okCount === checks.length
              ? '全部通过。这一屏的每个数都是从同一个账本读出来的，自检通过说明读得到。'
              : '有 ' + (checks.length - okCount) + ' 项不通。下面的数可能不全，先把不通的那项修掉再回来看。',
          ),
        )
      : h(StatsBlock, {
          kind: 'empty',
          title: '自检没有返回结果',
          hint: 'state.selfcheck 里应该有一份 checks 列表。这次是空的——点下面的按钮让服务端重新跑一遍自检。',
          onRetry: onReload,
          retryText: '重新自检',
        }),
    checks.length
      ? h('div', { style: { marginTop: 14 } }, h('button', { className: 'btn ghost sm', type: 'button', onClick: onReload }, '重新自检'))
      : null,
  )
}

/* ── 8 · 目录与版本 ────────────────────────────────────────── */

function StatsWhereCard({ rows }) {
  if (!rows.length) {
    return h(
      StatsCard,
      { id: 's-where', title: '目录与版本', mut: '没读到' },
      h(StatsBlock, {
        kind: 'empty',
        title: '没拿到数据目录',
        hint: 'state.root 是空的时候，说明账本还没定位到磁盘上。去工厂页看一眼自检里的「数据目录可写」。',
      }),
    )
  }
  return h(
    StatsCard,
    { id: 's-where', title: '目录与版本', mut: rows.length + ' 项' },
    h(
      'div',
      {
        className: 'stt-kv',
        style: { display: 'grid', gridTemplateColumns: '76px minmax(0,1fr)', gap: '9px 14px', alignItems: 'baseline' },
      },
      rows.map((row) =>
        h(
          'div',
          { key: row.k, style: { display: 'contents' } },
          h('span', { className: 'mut', style: { fontSize: '11.5px' } }, row.k),
          h(
            'span',
            {
              className: 'stt-val',
              style: {
                fontSize: '11.5px',
                color: 'var(--fg2)',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                wordBreak: 'break-all',
                lineHeight: 1.6,
              },
            },
            row.v,
          ),
        ),
      ),
    ),
  )
}

/* ── 三态的两张整页兜底卡 ─────────────────────────────────── */

function StatsLoadingCard() {
  return h(
    StatsCard,
    { id: 's-loading', title: '正在读账本', mut: '第一次进这屏会慢一点' },
    h(StatsBlock, {
      kind: 'loading',
      title: '正在读账本…',
      hint: '这一屏每个数都要先把本地 ledger.json 读一遍。读完之后包、例句、任务的数字就会出来。',
    }),
  )
}

function StatsErrorCard({ error, onReload }) {
  return h(
    'div',
    { className: 'card stat' },
    h('div', { className: 'shead2' }, h('span', { className: 'stitle' }, '没取到账本')),
    h(StatsBlock, {
      kind: 'error',
      title: '读账本的时候出错了',
      hint: String(error || 'state 接口没有返回。'),
      note: '这一屏所有数字都是从账本里求和的，账本读不到就一个都算不出来。点「重试」再读一遍；如果还不行，去工厂页看自检。',
      onRetry: onReload,
      retryText: '重试',
    }),
  )
}

/* ── 页面 ─────────────────────────────────────────────────── */

/* 90-app.js 现在传的是 { rpc, state, error, reload }，不是 onReload ——
   两个名字都收，免得按钮点了没反应。 */
function StatsPage({ state, error, onReload, reload }) {
  const again = typeof onReload === 'function' ? onReload : reload
  const loading = !state || state.status === 'loading'
  const where = ST_Where(state)

  return h(
    Screen,
    { className: 'half' },
    h(
      'header',
      { className: 'hdr' },
      h('h1', null, '统计'),
      h(
        'div',
        { className: 'act' },
        h('span', { className: 'chip live' }, h('i'), state && state.root ? '账本已连' : '示例数据'),
        h('button', { className: 'btn ghost sm', type: 'button', onClick: again }, '刷新'),
      ),
    ),

    h(
      'div',
      { className: 'sgrid' },
      error
        ? h(StatsErrorCard, { error, onReload: again })
        : loading
          ? h(StatsLoadingCard)
          : [
              h(StatsScaleCard, { key: 'scale', state }),
              h(StatsProgressCard, { key: 'progress', state }),
              h(StatsStatusCard, { key: 'status', state }),
              h(StatsAddedCard, { key: 'added', state }),
              h(StatsReviewCard, { key: 'review' }),
              h(StatsJobsCard, { key: 'jobs', state }),
              h(StatsCheckCard, { key: 'check', state, onReload: again }),
              h(StatsWhereCard, { key: 'where', rows: where }),
            ],
    ),

    /* 不用 .tip：app.css:839 那个 .tip 是图表悬停提示（position:fixed + nowrap），
       当脚注用会飘成一条浮在左上角的长条。小灰字用 .mut。 */
    h(
      'p',
      { className: 'mut', style: { margin: '2px 2px 0', lineHeight: 1.75 } },
      '这一屏只画账本里真的有的数：包、例句、配图、语音、在跑的任务、自检。没记过的东西（复习历史那一整组）宁可空着写清楚，也不编一条曲线出来。',
    ),
  )
}


/* ===================== 70-settings.js ===================== */
/**
 * 70-settings.js — 面板的「设置」页。
 *
 * 这个文件只做一件事：把**插件真的有**的那些配置项摆出来，改一下真的写回去。
 *
 * ── 值存在哪儿 ───────────────────────────────────────────────────────────────
 * 插件自己的 RPC（lib/rpc.js）里**没有任何配置端点**，`state` 的返回里也没有
 * settings 字段 —— 这是刻意的：配置的真源是 loader 里那条插件配置，也就是
 * index.js 里 `export const Config = z.object({...})`。客户端要改它，只能走
 * 宿主给的 `configForms` 服务（index.js:36 那句注释就是留给这里看的）：
 *
 *   const form = ctx.get('configForms').get(CONFIG_NS)   // CONFIG_NS = 'etude'
 *   form.getSnapshot()          // { status, value, writable, revision }
 *   form.subscribe(fn)          // 值变了叫一声
 *   form.mutate([{ op: 'set', path: ['rate'], value: '+5%' }])   // 真的写
 *
 * DSH 老于 0.1.6 时没有 `configForms` —— 那就只读、不改，页面上直说「这一项
 * 现在只能改 loader 里的配置」，不假装能存。
 *
 * ── 怎么把它接到面板上（给下一个改 99-register.js 的人） ────────────────────
 *   1. `inject` 里加上 'configForms'（拿不到就算了，别把面板搞挂）；
 *   2. 取一份 form：`const form = SET_configForm(ctx)`；
 *   3. 渲染：`h(SettingsPage, { rpc: getRpc(), form: form, onBack: ... })`。
 * 顶部齿轮按钮（10-shell.js 的 Topbar）现在还没有 onClick，接上它就是入口。
 *
 * 分组只留真的有配置项的：语言 / 声音 / 造卡 / 接口 / 位置 / 自检 / 关于。
 * 设计稿里的外观、智能体、快捷键、以及数据那块的危险操作（清缓存、重置账本、
 * 迁移、导入导出）全套没有对应接口，一律不画空壳。
 */

// ── 配置项真值 ────────────────────────────────────────────────────────────────
//
// 逐项照抄 index.js 的 Config 默认值。宿主没给（空配置）时用它兜底，
// 免得界面上一排空白，让人以为坏了。

function SET_defaults() {
  return {
    dataDir: '',
    exportDir: '',
    language: 'en',
    examplesPerLesson: 8,
    zhVariants: 3,
    candidateLimit: 9,
    autoPrepareCandidates: true,
    pixelCheck: true,
    ttsEngine: 'auto',
    rate: '+10%',
    volume: '+10%',
    ttsVoiceEdge: 'en-US-AriaNeural',
    ttsBaseUrl: '',
    ttsApiKeyEnv: 'OPENAI_API_KEY',
    ttsModel: 'tts-1',
    ttsVoice: 'alloy',
    llmBaseUrl: '',
    llmModel: '',
    llmApiKeyEnv: 'OPENAI_API_KEY',
    proxyUrl: '',
  }
}

/** 分组导航。glab 是设计稿里那个灰色小标题。 */
function SET_glabs() {
  return [
    { label: '语言与声音', ids: ['lang', 'voice'] },
    { label: '造卡与接口', ids: ['make', 'api'] },
    { label: '这台机器', ids: ['place', 'health', 'about'] },
  ]
}

/** 一组的标题与副题。 */
function SET_meta(id) {
  const table = {
    lang: { title: '语言', note: '学什么、界面说什么' },
    voice: { title: '声音', note: '引擎、音色、快慢' },
    make: { title: '造卡', note: '一个包造多少、给几张候选图' },
    api: { title: '接口', note: '大模型 / TTS / 代理' },
    place: { title: '位置', note: '账本和成品放哪' },
    health: { title: '自检', note: '真跑一遍，看卡在哪' },
    about: { title: '关于', note: '版本，以及还没接的东西' },
  }
  return table[id] || { title: id, note: '' }
}

/** 读配置里的一个值，宿主是 0.1.6+ 时可能是 volatile 引用，要 .get()。 */
function SET_unwrap(value) {
  if (value && typeof value === 'object' && typeof value.get === 'function') {
    try {
      return value.get()
    } catch (error) {
      return undefined
    }
  }
  return value
}

function SET_value(snapshot, key, fallback) {
  const value = snapshot && snapshot.value
  if (!value || typeof value !== 'object') return fallback
  const one = SET_unwrap(value[key])
  if (one === undefined || one === null) return fallback
  return one
}

function SET_read(snapshot, key) {
  const defaults = SET_defaults()
  return SET_value(snapshot, key, defaults[key])
}

/** 写一条配置。没有 configForms 就明确拒绝，别静默成功。 */
function SET_patch(form, key, value) {
  if (!form || typeof form.mutate !== 'function') {
    return Promise.reject(
      new Error('宿主没给配置接口（configForms）。这一项现在只能去 loader 里的配置条目改。'),
    )
  }
  try {
    return Promise.resolve(form.mutate([{ op: 'set', path: [key], value: value }]))
  } catch (error) {
    return Promise.reject(error)
  }
}

/** 从 ctx 里安全地取 configForms 的 form。取不到返回 null。 */
function SET_configForm(ctx) {
  if (!ctx || typeof ctx.get !== 'function') return null
  let configForms = null
  try {
    configForms = ctx.get('configForms')
  } catch (error) {
    return null
  }
  if (!configForms || typeof configForms.get !== 'function') return null
  try {
    return configForms.get(CONFIG_NS) || null
  } catch (error) {
    return null
  }
}

function SET_snapshot(form) {
  if (!form || typeof form.getSnapshot !== 'function') {
    return { status: 'unavailable', value: undefined, error: '' }
  }
  try {
    const one = form.getSnapshot()
    return one && typeof one === 'object' ? one : { status: 'unavailable', value: undefined, error: '' }
  } catch (error) {
    return { status: 'error', value: undefined, error: (error && error.message) || String(error) }
  }
}

// ── 取数 ──────────────────────────────────────────────────────────────────────

/**
 * 配置快照。
 *
 * 没有 form 时不能当成「空配置」——那会让人以为值被清空了。所以状态是
 * unavailable，界面上单独说一句。
 */
function SET_useConfig(form) {
  const [snapshot, setSnapshot] = useState(function () {
    return SET_snapshot(form)
  })
  useEffect(
    function () {
      if (!form || typeof form.getSnapshot !== 'function') {
        setSnapshot({ status: 'unavailable', value: undefined, error: '' })
        return undefined
      }
      setSnapshot(SET_snapshot(form))
      if (typeof form.subscribe !== 'function') return undefined
      let stop = null
      try {
        stop = form.subscribe(function () {
          setSnapshot(SET_snapshot(form))
        })
      } catch (error) {
        return undefined
      }
      return function () {
        if (typeof stop === 'function') stop()
      }
    },
    [form],
  )
  return snapshot
}

/** state 端点：root / version / exportDir / packs / jobs / selfcheck。 */
function SET_useFacts(rpc) {
  const [facts, setFacts] = useState({ status: 'loading', value: null, error: '' })
  const load = useCallback(
    function () {
      setFacts(function (prev) {
        return { status: prev.value ? 'ready' : 'loading', value: prev.value, error: '' }
      })
      callRpc(rpc, 'state', {})
        .then(function (value) {
          setFacts({ status: 'ready', value: value || null, error: '' })
        })
        .catch(function (error) {
          setFacts({ status: 'error', value: null, error: (error && error.message) || String(error) })
        })
    },
    [rpc],
  )
  useEffect(
    function () {
      load()
    },
    [load],
  )
  return { facts: facts, reload: load }
}

/** Edge 音色表（voice.list）。进声音那一组才去取，离线也别把人卡住。 */
function SET_useVoices(rpc, active) {
  const [voices, setVoices] = useState({ status: 'idle', list: [], error: '' })
  const load = useCallback(
    function () {
      setVoices({ status: 'loading', list: [], error: '' })
      callRpc(rpc, 'voice.list', { timeoutMs: 12000 })
        .then(function (value) {
          const list = value && Array.isArray(value.voices) ? value.voices : []
          setVoices({ status: 'ready', list: list, error: '' })
        })
        .catch(function (error) {
          setVoices({ status: 'error', list: [], error: (error && error.message) || String(error) })
        })
    },
    [rpc],
  )
  useEffect(
    function () {
      if (active && voices.status === 'idle') load()
    },
    [active, voices.status, load],
  )
  return { voices: voices, reload: load }
}

/** 自检（selfcheck）：node / sharp / ws / fetch / network / llm。 */
function SET_useCheck(rpc, active) {
  const [check, setCheck] = useState({ status: 'idle', value: null, error: '' })
  const load = useCallback(
    function () {
      setCheck({ status: 'loading', value: null, error: '' })
      callRpc(rpc, 'selfcheck', {})
        .then(function (value) {
          setCheck({ status: 'ready', value: value || null, error: '' })
        })
        .catch(function (error) {
          setCheck({ status: 'error', value: null, error: (error && error.message) || String(error) })
        })
    },
    [rpc],
  )
  useEffect(
    function () {
      if (active && check.status === 'idle') load()
    },
    [active, check.status, load],
  )
  return { check: check, reload: load }
}

// ── 试听 ──────────────────────────────────────────────────────────────────────
//
// 走的是真链路：sample.audio 开一个任务 → job.get 等它 → image.bytes 取字节。
// 为什么不把 `/etude/media/audio/xxx.mp3` 直接塞进 <audio src>：宿主 web 服务
// 整站要鉴权，子资源请求带不上凭据，最后就是一个不响的播放器（这是上一版踩过
// 的坑，10-shell / 旧客户端的注释里写着）。

function SET_trialText() {
  return 'Actually, I already told him the whole story.'
}

function SET_jobError(job) {
  if (!job) return '任务不见了。'
  if (job.status === 'cancelled') return '合成被取消了。'
  if (job.error) return '合成失败：' + job.error
  return '合成没成功（' + (job.status || '不知道什么状态') + '）。'
}

/** 等一个任务跑完。超时两分钟，不无限等。 */
function SET_waitJob(rpc, job) {
  const first = job && job.id ? job : null
  if (!first) return Promise.reject(new Error('宿主没给任务 id，合成没跑起来。'))
  if (first.status && first.status !== 'running') return Promise.resolve(first)
  let tries = 0
  function step() {
    return callRpc(rpc, 'job.get', { id: first.id }).then(function (now) {
      if (!now || !now.status) throw new Error('任务不见了。')
      if (now.status !== 'running') return now
      tries += 1
      if (tries >= 100) throw new Error('等了两分钟还没好，先不听了。')
      return new Promise(function (resolve) {
        setTimeout(resolve, 1200)
      }).then(step)
    })
  }
  return step()
}

function SET_blobUrl(base64, mediaType) {
  const canBlob =
    typeof atob === 'function' &&
    typeof Blob === 'function' &&
    typeof URL !== 'undefined' &&
    typeof URL.createObjectURL === 'function'
  if (!canBlob) throw new Error('这个界面环境不让建 blob URL，播不了音频。')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return URL.createObjectURL(new Blob([bytes], { type: mediaType }))
}

function SET_sampleMeta(one) {
  const parts = []
  if (one.engine) parts.push(one.engine === 'edge' ? 'Edge' : String(one.engine))
  if (one.voice) parts.push(one.voice)
  if (typeof one.seconds === 'number' && one.seconds > 0) parts.push(one.seconds.toFixed(2) + ' 秒')
  if (typeof one.bytes === 'number' && one.bytes > 0) parts.push(Math.round(one.bytes / 1024) + ' KB')
  if (one.fellBackFrom) parts.push('从 ' + one.fellBackFrom + ' 退回来的')
  return parts.join(' · ')
}

function SET_trialRun(rpc) {
  return callRpc(rpc, 'sample.audio', { texts: [SET_trialText()] })
    .then(function (job) {
      return SET_waitJob(rpc, job)
    })
    .then(function (job) {
      if (!job) throw new Error('任务不见了。')
      if (job.status !== 'done') throw new Error(SET_jobError(job))
      const samples = job.result && Array.isArray(job.result.samples) ? job.result.samples : []
      const one = samples[0]
      if (!one) throw new Error('合成完了，但一个样本也没给。')
      if (one.error) throw new Error('这一句合成失败：' + one.error)
      if (!one.file) throw new Error('样本没有文件名，取不到音频。')
      return callRpc(rpc, 'image.bytes', { kind: 'audio', file: one.file }).then(function (bytes) {
        const base64 = bytes && bytes.dataBase64
        if (!base64) throw new Error('音频字节是空的。')
        return { src: SET_blobUrl(base64, 'audio/mpeg'), meta: SET_sampleMeta(one) }
      })
    })
}

// ── 小控件 ────────────────────────────────────────────────────────────────────

/** 分组卡片的壳子：section.group.on > .ghead + .field… */
function SetGroup(props) {
  return h(
    'section',
    { className: 'group on' },
    h(
      'div',
      { className: 'ghead' },
      h('h2', null, props.title),
      props.note ? h('span', { className: 'mut stg-gnote' }, props.note) : null,
    ),
    props.children,
  )
}

/** 一行设置：左边标题+说明，右边控件。
 *
 * 设计稿的密度层把 `.field .desc` 全收了（只给危险行放回来）。这里跟着照做，
 * 只让 props.showDesc 那几行显示说明 —— 用在「学什么语言 / 界面语言」这种
 * 光看控件看不出后果的行上。 */
function SetRow(props) {
  return h(
    'div',
    { className: 'field' + (props.stg ? ' stg-row' : '') },
    h(
      'div',
      null,
      h('div', { className: 'lab' }, props.label),
      props.desc ? h('div', { className: 'desc' + (props.showDesc ? ' stg-desc-on' : '') }, props.desc) : null,
    ),
    h('div', { className: 'ctl' }, props.children),
  )
}

/** 分段控件。真两态、能点、键盘也能点。 */
function SET_seg(props) {
  const options = Array.isArray(props.options) ? props.options : []
  return h(
    'span',
    { className: 'seg', role: 'group', 'aria-label': props.label },
    options.map(function (option) {
      const active = option.value === props.value
      const blocked = Boolean(option.disabled)
      const frozen = blocked || Boolean(props.disabled)
      function pick() {
        if (blocked) {
          if (typeof option.onBlocked === 'function') option.onBlocked()
          return
        }
        if (props.disabled || active) return
        props.onChange(option.value)
      }
      return h(
        'span',
        {
          key: option.value,
          className: (active ? 'on' : '') + (blocked ? ' off' : ''),
          role: 'button',
          tabIndex: frozen ? -1 : 0,
          'aria-pressed': active ? 'true' : 'false',
          'aria-disabled': blocked ? 'true' : undefined,
          title: option.hint || undefined,
          onClick: pick,
          onKeyDown: function (event) {
            if (blocked || props.disabled) return
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              pick()
            }
          },
        },
        option.label,
      )
    }),
  )
}

/** 开关。两态，点了就翻。 */
function SET_switch(props) {
  const on = Boolean(props.on)
  return h('button', {
    type: 'button',
    className: 'sw' + (on ? ' on' : ''),
    role: 'switch',
    'aria-checked': on ? 'true' : 'false',
    'aria-label': props.label,
    disabled: Boolean(props.disabled),
    onClick: function () {
      if (props.disabled) return
      props.onChange(!on)
    },
  })
}

/** 加减器。范围外那颗按钮直接灰掉，不给点出越界值。 */
function SET_stepper(props) {
  const value = Number(props.value) || 0
  const min = Number(props.min) || 0
  const max = props.max === undefined ? Number.MAX_SAFE_INTEGER : Number(props.max)
  const unit = Number(props.step) || 1
  function move(delta) {
    if (props.disabled) return
    const next = Math.min(max, Math.max(min, value + delta))
    if (next !== value) props.onChange(next)
  }
  return h(
    'span',
    { className: 'stepper' },
    h(
      'button',
      {
        type: 'button',
        className: 'stg-step',
        'aria-label': '减 ' + unit,
        disabled: Boolean(props.disabled) || value <= min,
        onClick: function () {
          move(-unit)
        },
      },
      '−',
    ),
    h('b', null, String(value)),
    h(
      'button',
      {
        type: 'button',
        className: 'stg-step',
        'aria-label': '加 ' + unit,
        disabled: Boolean(props.disabled) || value >= max,
        onClick: function () {
          move(unit)
        },
      },
      '+',
    ),
  )
}

/**
 * 文本输入。
 *
 * 受控组件不能一边打字一边写配置（每敲一个字一个 RPC），所以本地先存草稿，
 * 回车或失焦才提交；Esc 撤回。
 */
function SET_text(props) {
  const current = props.value === undefined || props.value === null ? '' : String(props.value)
  const [draft, setDraft] = useState(current)
  const [editing, setEditing] = useState(false)
  useEffect(
    function () {
      if (!editing) setDraft(current)
    },
    [current, editing],
  )
  function commit() {
    setEditing(false)
    const next = draft.trim()
    if (next === current) return
    props.onCommit(next)
  }
  return h('input', {
    className: 'inp' + (props.wide ? ' wide' : '') + ' stg-inp',
    type: 'text',
    value: draft,
    placeholder: props.placeholder || '',
    disabled: Boolean(props.disabled),
    spellCheck: false,
    'aria-label': props.label,
    onFocus: function () {
      setEditing(true)
    },
    onChange: function (event) {
      setDraft(event.target.value)
    },
    onBlur: commit,
    onKeyDown: function (event) {
      if (event.key === 'Enter') {
        event.preventDefault()
        commit()
      }
      if (event.key === 'Escape') {
        setDraft(current)
        setEditing(false)
      }
    },
  })
}

/** 音色下拉。当前值不在表里时也要显示得出来（离线时宿主可能给的是默认音色）。 */
function SET_voiceSelect(props) {
  const value = String(props.value === undefined || props.value === null ? '' : props.value)
  const list = Array.isArray(props.list) ? props.list : []
  const known = list.some(function (one) {
    return String(one.id) === value
  })
  const children = []
  if (value && !known) {
    children.push(h('option', { key: '__current', value: value }, value + '（不在这次取回的表里）'))
  }
  list.forEach(function (one) {
    const label = one.label && one.label !== one.id ? one.label + ' · ' + one.id : String(one.id)
    children.push(h('option', { key: String(one.id), value: String(one.id) }, label))
  })
  if (!children.length) {
    children.push(h('option', { key: '__none', value: '' }, '还没有音色表'))
  }
  return h(
    'select',
    {
      className: 'inp wide stg-inp stg-select',
      value: value,
      disabled: Boolean(props.disabled) || !list.length,
      'aria-label': props.label,
      onChange: function (event) {
        props.onChange(event.target.value)
      },
    },
    children,
  )
}

/** 写回结果那条线。三种语气：忙着、成了、坏了。 */
function SET_saveLine(save) {
  if (!save || !save.tone) return null
  if (save.tone === 'busy') {
    return h('div', { className: 'stg-msg stg-msg-busy', role: 'status' }, save.text)
  }
  if (save.tone === 'ok') {
    return h('div', { className: 'stg-msg stg-msg-ok', role: 'status' }, save.text)
  }
  return h('div', { className: 'stg-msg stg-msg-bad', role: 'alert' }, save.text)
}

function SET_banner(props) {
  return h(
    'div',
    { className: 'stg-banner stg-banner-' + props.tone },
    h('b', null, props.title),
    props.text ? h('span', null, props.text) : null,
  )
}

function SET_checkLabel(id) {
  const table = {
    node: 'Node',
    sharp: 'sharp（图片）',
    ws: 'WebSocket',
    fetch: 'fetch',
    network: '网络',
    llm: '大模型',
    storage: '数据目录可写',
  }
  return table[id] || String(id)
}

function SET_checkRow(props) {
  const one = props.one || {}
  const ok = Boolean(one.ok)
  return h(
    'div',
    { className: 'stg-check' },
    h('span', { className: 'stg-dot ' + (ok ? 'stg-dot-ok' : 'stg-dot-bad') }),
    h('b', null, SET_checkLabel(one && one.id)),
    h('span', { className: 'stg-checkv' }, (one && one.detail) || (ok ? '正常' : '没过，也没说为什么')),
  )
}

/** 「现在实际用着的是哪儿」——空配置时这一行最重要。 */
function SET_factText(facts, pick) {
  if (!facts || facts.status === 'loading') return '正在取…'
  if (facts.status === 'error') return '没取到'
  const value = facts.value
  if (!value) return '没取到'
  return pick(value) || '—'
}

// ── 各分组 ────────────────────────────────────────────────────────────────────

function SET_secLang(p) {
  return [
    h(
      SetRow,
      {
        key: 'target',
        label: '学什么语言',
        showDesc: true,
        desc:
          '造例句和卡片的目标语言。现在只有英语能生成：lib/packs.js 里 LANGUAGES = ["en"]，' +
          '换个值一造就报「现在还不能生成」。所以中文那颗是灰的，点了会在这里说明。',
      },
      h(SET_seg, {
        value: String(p.snapshot ? SET_read(p.snapshot, 'language') : 'en'),
        label: '目标语言',
        disabled: !p.canWrite,
        options: [
          { value: 'en', label: 'English' },
          { value: 'zh', label: '中文', disabled: true, hint: '还没接：LANGUAGES 只有 en', onBlocked: p.onBlocked },
        ],
        onChange: function (next) {
          p.clearNote()
          p.commit('language', next)
        },
      }),
    ),
    h(
      SetRow,
      {
        key: 'ui',
        label: '界面语言',
        showDesc: true,
        tone: 'bad',
        desc:
          '插件自己不存这一项：文案跟着 DSH 的 locale 走（99-register.js 里 ctx.locale.register + bind）。' +
          '要换界面语言得去宿主设置里改，面板刷新后跟上。',
      },
      h('span', { key: 'chip', className: 'chip warn' }, '这一项还没接'),
      h('span', { key: 'now', className: 'inp' }, '跟宿主走'),
    ),
  ]
}

function SET_secVoice(p) {
  const voices = p.voices || { status: 'idle', list: [], error: '' }
  const engine = String(p.snapshot ? SET_read(p.snapshot, 'ttsEngine') : 'auto')
  const engineHint =
    engine === 'edge'
      ? '只用 Edge。不用任何 key，离线也能合成一部分。'
      : engine === 'openai'
        ? '主 TTS 优先，没配端点或失败还是退回 Edge。'
        : '自动：配了 OpenAI 兼容的 TTS 就先用它，Edge 永远兜底。'

  const voiceCtl = []
  if (voices.status === 'loading') {
    voiceCtl.push(h('span', { key: 'busy', className: 'mut' }, '正在取 Edge 音色表…'))
  } else if (voices.status === 'error') {
    voiceCtl.push(h('span', { key: 'bad', className: 'chip bad' }, '没取到音色表'))
    voiceCtl.push(
      h(
        'button',
        {
          key: 'retry',
          type: 'button',
          className: 'btn ghost sm',
          onClick: p.reloadVoices,
        },
        '再取一次',
      ),
    )
  } else if (voices.status === 'ready' && !voices.list.length) {
    voiceCtl.push(h('span', { key: 'empty', className: 'mut' }, 'Edge 一个音色都没返回'))
    voiceCtl.push(
      h('button', { key: 'retry', type: 'button', className: 'btn ghost sm', onClick: p.reloadVoices }, '再取一次'),
    )
  } else {
    voiceCtl.push(
      h(SET_voiceSelect, {
        key: 'sel',
        value: String(p.snapshot ? SET_read(p.snapshot, 'ttsVoiceEdge') : 'en-US-AriaNeural'),
        list: voices.list,
        label: 'Edge 音色',
        disabled: !p.canWrite,
        onChange: function (next) {
          p.commit('ttsVoiceEdge', next)
        },
      }),
    )
  }

  const trial = p.trial || { status: 'idle', src: '', meta: '', error: '' }
  const trialCtl = [
    h(
      'button',
      {
        key: 'go',
        type: 'button',
        className: 'btn ghost sm',
        disabled: trial.status === 'running',
        onClick: p.runTrial,
      },
      trial.status === 'running' ? '正在合成…' : '合成一句听听',
    ),
  ]
  if (trial.status === 'ready' && trial.src) {
    trialCtl.push(h('audio', { key: 'audio', className: 'stg-audio', controls: true, preload: 'none', src: trial.src }))
  }
  if (trial.status === 'ready' && trial.meta) {
    trialCtl.push(h('span', { key: 'meta', className: 'mut stg-meta' }, trial.meta))
  }
  if (trial.status === 'bad') {
    trialCtl.push(h('span', { key: 'err', className: 'stg-msg stg-msg-bad stg-inline' }, trial.error))
  }

  return [
    h(
      SetRow,
      { key: 'engine', label: '语音引擎', desc: engineHint },
      h(SET_seg, {
        value: engine,
        label: '语音引擎',
        disabled: !p.canWrite,
        options: [
          { value: 'auto', label: '自动' },
          { value: 'edge', label: '只用 Edge' },
          { value: 'openai', label: '主 TTS 优先' },
        ],
        onChange: function (next) {
          p.commit('ttsEngine', next)
        },
      }),
    ),
    h(
      SetRow,
      {
        key: 'voice',
        label: 'Edge 音色',
        desc:
          voices.status === 'error'
            ? '音色表要联网从 Edge 取，取不到不影响用默认音色。'
            : '表是 voice.list 从 Edge 现取的，几百个；英文的都在这里。',
      },
      voiceCtl,
    ),
    h(
      SetRow,
      {
        key: 'rate',
        label: '语速',
        desc: 'Edge 写 +10% / -5% 这种；OpenAI 兼容接口会换算成 speed=1.1。',
      },
      h(SET_text, {
        value: String(p.snapshot ? SET_read(p.snapshot, 'rate') : '+10%'),
        placeholder: '+10%',
        label: '语速',
        wide: false,
        disabled: !p.canWrite,
        onCommit: function (next) {
          p.commit('rate', next)
        },
      }),
    ),
    h(
      SetRow,
      { key: 'volume', label: '音量', desc: '只有 Edge 引擎认这个参数，OpenAI 兼容接口没有音量。' },
      h(SET_text, {
        value: String(p.snapshot ? SET_read(p.snapshot, 'volume') : '+10%'),
        placeholder: '+10%',
        label: '音量',
        disabled: !p.canWrite,
        onCommit: function (next) {
          p.commit('volume', next)
        },
      }),
    ),
    h(
      SetRow,
      {
        key: 'trial',
        label: '试听',
        desc: '按现在的引擎/音色真合成一句（实际走 sample.audio 任务，不是假按钮）。',
      },
      trialCtl,
    ),
  ]
}

function SET_secMake(p) {
  function num(key, min, max) {
    const value = Number(p.snapshot ? SET_read(p.snapshot, key) : SET_defaults()[key])
    return { value: Number.isFinite(value) ? value : min, min: min, max: max }
  }
  const examples = num('examplesPerLesson', 1, 40)
  const zh = num('zhVariants', 2, 4)
  const cands = num('candidateLimit', 3, 12)
  return [
    h(
      SetRow,
      { key: 'examples', label: '一个包几句', desc: '1–40，默认 8。多了模型写得久，也更容易写出重复的场景。' },
      h(SET_stepper, {
        value: examples.value,
        min: examples.min,
        max: examples.max,
        disabled: !p.canWrite,
        onChange: function (next) {
          p.commit('examplesPerLesson', next)
        },
      }),
    ),
    h(
      SetRow,
      { key: 'zh', label: '中文变体', desc: '每句给几种故意不一致的中文说法，2–4。练的是「别逐字对译」。' },
      h(SET_stepper, {
        value: zh.value,
        min: zh.min,
        max: zh.max,
        disabled: !p.canWrite,
        onChange: function (next) {
          p.commit('zhVariants', next)
        },
      }),
    ),
    h(
      SetRow,
      { key: 'cands', label: '候选图张数', desc: '每条给几张候选图，3–12。张数越多，找图和预检越花时间。' },
      h(SET_stepper, {
        value: cands.value,
        min: cands.min,
        max: cands.max,
        disabled: !p.canWrite,
        onChange: function (next) {
          p.commit('candidateLimit', next)
        },
      }),
    ),
    h(
      SetRow,
      { key: 'auto', label: '造完顺手找候选图', desc: '关掉就只写例句，候选图等你回面板自己点。' },
      h(SET_switch, {
        on: Boolean(p.snapshot ? SET_read(p.snapshot, 'autoPrepareCandidates') : true),
        label: '造完顺手找候选图',
        disabled: !p.canWrite,
        onChange: function (next) {
          p.commit('autoPrepareCandidates', next)
        },
      }),
    ),
    h(
      SetRow,
      {
        key: 'pixel',
        label: '像素预检',
        desc: '用像素统计挡掉纯色块、渐变图和大色块海报 —— 这类图配上去就是个色块。',
      },
      h(SET_switch, {
        on: Boolean(p.snapshot ? SET_read(p.snapshot, 'pixelCheck') : true),
        label: '像素预检',
        disabled: !p.canWrite,
        onChange: function (next) {
          p.commit('pixelCheck', next)
        },
      }),
    ),
  ]
}

function SET_secApi(p) {
  function text(key, placeholder, desc, wide) {
    return h(
      SetRow,
      { key: key, label: SET_textLabel(key), desc: desc },
      h(SET_text, {
        value: String(p.snapshot ? SET_read(p.snapshot, key) : SET_defaults()[key]),
        placeholder: placeholder,
        label: SET_textLabel(key),
        wide: wide !== false,
        disabled: !p.canWrite,
        onCommit: function (next) {
          p.commit(key, next)
        },
      }),
    )
  }
  return [
    text('llmBaseUrl', '留空 = 用宿主的 llm', 'OpenAI 兼容的模型端点，比如 http://127.0.0.1:18999/v1。留空就用宿主的 llm 服务 —— 这是正常情况，不填也能造。'),
    text('llmModel', '留空 = 端点自己的默认', '上面那个端点用的模型名。用宿主 llm 时这里不用填。'),
    text('llmApiKeyEnv', 'OPENAI_API_KEY', 'key 存在哪个环境变量名下。key 本身放 DSH 的凭据里，不写在这儿。', false),
    text('ttsBaseUrl', '留空 = 只用 Edge', 'OpenAI 兼容 TTS 的 base url。留空就只有 Edge 一条路。'),
    text('ttsModel', 'tts-1', 'TTS 模型名。'),
    text('ttsApiKeyEnv', 'OPENAI_API_KEY', 'TTS 的 key 存在哪个环境变量名下。', false),
    text('ttsVoice', 'alloy', 'OpenAI 兼容 TTS 的音色名（Edge 的音色在上面「声音」里）。', false),
    text(
      'proxyUrl',
      '留空 = 读 HTTPS_PROXY 和系统代理',
      'Node 的 fetch 不读系统代理。搜不到候选图时先填这里，比如 http://127.0.0.1:7897。改完立刻生效，不用重启宿主。',
    ),
  ]
}

function SET_textLabel(key) {
  const table = {
    llmBaseUrl: '大模型端点',
    llmModel: '大模型名',
    llmApiKeyEnv: 'Key 环境变量',
    ttsBaseUrl: 'TTS 端点',
    ttsModel: 'TTS 模型',
    ttsApiKeyEnv: 'TTS Key 环境变量',
    ttsVoice: 'OpenAI 音色',
    proxyUrl: '代理地址',
    dataDir: '数据目录',
    exportDir: '导出目录',
  }
  return table[key] || key
}

function SET_secPlace(p) {
  const facts = p.facts || { status: 'loading', value: null, error: '' }
  return [
    h(
      SetRow,
      {
        key: 'data',
        label: '数据目录',
        desc: '账本、素材、成品包全在这棵树里。留空就是 %LOCALAPPDATA%\\dsh-etude。改完下次造包才用新目录，老账本不会自己搬过去。',
      },
      h(SET_text, {
        value: String(p.snapshot ? SET_read(p.snapshot, 'dataDir') : ''),
        placeholder: '留空 = %LOCALAPPDATA%\\dsh-etude',
        label: '数据目录',
        disabled: !p.canWrite,
        onCommit: function (next) {
          p.commit('dataDir', next)
        },
      }),
      SET_livePath(facts, 'root', p.reloadFacts),
    ),
    h(
      SetRow,
      {
        key: 'export',
        label: '导出目录',
        desc: '打完包导出成品时往哪儿放。留空就是 %USERPROFILE%\\Downloads\\dsh-etude。',
      },
      h(SET_text, {
        value: String(p.snapshot ? SET_read(p.snapshot, 'exportDir') : ''),
        placeholder: '留空 = Downloads\\dsh-etude',
        label: '导出目录',
        disabled: !p.canWrite,
        onCommit: function (next) {
          p.commit('exportDir', next)
        },
      }),
      SET_livePath(facts, 'exportDir', p.reloadFacts),
    ),
  ]
}

/** 「现在用着：xxx」。这一行比输入框更重要 —— 留空时它才告诉你真落在哪。 */
function SET_livePath(facts, key, onRetry) {
  if (!facts || facts.status === 'loading') {
    return h('span', { className: 'stg-live' }, '现在用着：正在取…')
  }
  if (facts.status === 'error' || !facts.value) {
    return h(
      'span',
      { className: 'stg-live' },
      '现在用着：没取到',
      h('button', { type: 'button', className: 'btn ghost sm', onClick: onRetry }, '再取一次'),
    )
  }
  const value = facts.value[key]
  return h(
    'span',
    { className: 'stg-live', title: String(value || '') },
    '现在用着：',
    h('span', { className: 'stg-code' }, String(value || '—')),
  )
}

function SET_secHealth(p) {
  const check = p.check || { status: 'idle', value: null, error: '' }
  const buttons = [
    h(
      'button',
      {
        key: 'go',
        type: 'button',
        className: 'btn ghost sm',
        disabled: check.status === 'loading',
        onClick: p.reloadCheck,
      },
      check.status === 'loading' ? '正在体检…' : check.status === 'ready' ? '重新体检' : '跑一遍体检',
    ),
  ]
  const body = []
  if (check.status === 'error') {
    body.push(h(SET_banner, { key: 'err', tone: 'bad', title: '自检没跑起来', text: check.error }))
  } else if (check.status === 'ready') {
    const value = check.value || {}
    const checks = Array.isArray(value.checks) ? value.checks : []
    if (!checks.length) {
      body.push(h('p', { key: 'empty', className: 'mut' }, '宿主没返回任何检查项。配置没坏的话，这通常意味着自检模块没装上。'))
    } else {
      body.push(
        h('div', { key: 'list', className: 'stg-list' }, checks.map(function (one) {
          return h(SET_checkRow, { key: String((one && one.id) || Math.random()), one: one })
        })),
      )
    }
    body.push(
      h(
        'div',
        { key: 'meta', className: 'stg-meta-line' },
        h('span', null, '版本 ' + String(value.version || '—')),
        h('span', null, '数据 ' + String(value.root || '—')),
        h('span', null, '代理 ' + String(value.proxy || '没设（用系统代理）')),
      ),
    )
  } else if (check.status === 'loading') {
    body.push(h('p', { key: 'busy', className: 'mut' }, '正在体检，挨个试一遍，几秒钟…'))
  } else {
    body.push(h('p', { key: 'idle', className: 'mut' }, '还没体检。点右边那颗按钮，会把 node / sharp / ws / fetch / 网络 / 大模型挨个试一遍。'))
  }

  return [
    h(
      SetRow,
      {
        key: 'run',
        label: '一键体检',
        desc: '真跑一遍，不是画勾。哪一项没过会连原因一起显示出来。',
      },
      buttons,
    ),
    h('div', { key: 'body', className: 'stg-body' }, body),
  ]
}

function SET_secAbout(p) {
  const facts = p.facts || { status: 'loading', value: null, error: '' }
  return [
    h(
      SetRow,
      { key: 'version', label: '版本', desc: '宿主那半 index.js 的 version，state 端点带回来的。' },
      h('span', { key: 'chip', className: 'chip ok' }, String(SET_factText(facts, function (value) {
        return value.version
      }))),
    ),
    h(
      SetRow,
      {
        key: 'update',
        label: '检查更新',
        tone: 'bad',
        desc: '插件没有更新端点，面板也不该自己去敲网。现在只能手动换包。',
      },
      h('span', { key: 'chip', className: 'chip warn' }, '这一项还没接'),
    ),
    h(
      SetRow,
      {
        key: 'danger',
        label: '清缓存 / 重置账本',
        tone: 'bad',
        desc:
          '很想摆这两个按钮，但插件里没有对应接口：pack.delete 只能按一个包删，' +
          '没有全局清缓存、也没有重置账本。真要做只能直接删数据目录里的文件。',
      },
      h('span', { key: 'chip', className: 'chip warn' }, '这一项还没接'),
    ),
    h(
      SetRow,
      { key: 'law', label: '这套东西的规矩', desc: '配图必须有人从候选里挑一张，语音必须有人听过。两条都是打包时的硬校验，模型替不了，面板也替不了。' },
      h('span', { key: 'chip', className: 'chip accent' }, '人点头才算数'),
    ),
  ]
}

// ── 页面 ──────────────────────────────────────────────────────────────────────

/**
 * 设置页。
 *
 * props:
 *   rpc     —— connection.rpc（与其它页同一份）
 *   form    —— configForms.get(CONFIG_NS)，没有就传 null（只读）
 *   owner   —— 宿主配置卡塞进来的 owner（owner.form 是这个条目的 form）
 *   ctx     —— 宿主 ctx，给了就自己去找 configForms
 *   onBack  —— 可选，回上一页
 *
 * form 三选一：直接给的 → owner.form → 拿 ctx 现找。都没有就只读（每个开关点下去会
 * 说清楚为什么改不了，不假装存上了）。
 */
function SettingsPage(props) {
  const rpc = props.rpc
  const form =
    props.form ||
    (props.owner && props.owner.form) ||
    (props.ctx ? SET_configForm(props.ctx) : null) ||
    null

  const [group, setGroup] = useState('lang')
  const [save, setSave] = useState({ key: '', tone: '', text: '' })
  const [note, setNote] = useState('')

  const snapshot = SET_useConfig(form)
  const factsBundle = SET_useFacts(rpc)
  const voicesBundle = SET_useVoices(rpc, group === 'voice')
  const checkBundle = SET_useCheck(rpc, group === 'health')

  const aliveRef = useRef(true)
  const audioRef = useRef('')
  const [trial, setTrial] = useState({ status: 'idle', src: '', meta: '', error: '' })

  useEffect(function () {
    aliveRef.current = true
    return function () {
      aliveRef.current = false
      if (audioRef.current && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
        try {
          URL.revokeObjectURL(audioRef.current)
        } catch (error) {
          /* 撤不掉就算了，别把卸载流程搞挂 */
        }
      }
    }
  }, [])

  const commit = useCallback(
    function (key, value) {
      if (!form) {
        setSave({ key: key, tone: 'bad', text: '没有配置接口（configForms），这一项改不了。' })
        return
      }
      if (snapshot && snapshot.writable === false) {
        setSave({ key: key, tone: 'bad', text: '宿主说这份配置是只读的。' })
        return
      }
      setSave({ key: key, tone: 'busy', text: '正在写回 ' + SET_textLabel(key) + '…' })
      SET_patch(form, key, value)
        .then(function () {
          setSave({ key: key, tone: 'ok', text: '已写回：' + SET_textLabel(key) + ' = ' + String(value) })
        })
        .catch(function (error) {
          setSave({ key: key, tone: 'bad', text: '写不进去：' + ((error && error.message) || String(error)) })
        })
    },
    [form, snapshot],
  )

  const runTrial = useCallback(
    function () {
      if (audioRef.current) {
        if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
          try {
            URL.revokeObjectURL(audioRef.current)
          } catch (error) {
            /* 同上 */
          }
        }
        audioRef.current = ''
      }
      setTrial({ status: 'running', src: '', meta: '', error: '' })
      SET_trialRun(rpc)
        .then(function (result) {
          if (!aliveRef.current) return
          audioRef.current = result.src
          setTrial({ status: 'ready', src: result.src, meta: result.meta, error: '' })
        })
        .catch(function (error) {
          if (!aliveRef.current) return
          setTrial({ status: 'bad', src: '', meta: '', error: (error && error.message) || String(error) })
        })
    },
    [rpc],
  )

  const canWrite = Boolean(form) && (snapshot ? snapshot.writable !== false : false)
  const facts = factsBundle.facts
  const stage = {
    snapshot: snapshot,
    facts: facts,
    canWrite: canWrite,
    commit: commit,
    voices: voicesBundle.voices,
    reloadVoices: voicesBundle.reload,
    check: checkBundle.check,
    reloadCheck: checkBundle.reload,
    reloadFacts: factsBundle.reload,
    trial: trial,
    runTrial: runTrial,
    onBlocked: function () {
      setNote('中文还没接：lib/packs.js 里 LANGUAGES 只有 "en"，选了也造不出来。')
    },
    clearNote: function () {
      setNote('')
    },
  }

  const notices = []
  if (!form) {
    notices.push(
      h(SET_banner, {
        key: 'noform',
        tone: 'warn',
        title: '这次没有配置接口',
        text:
          '宿主没给 configForms（DSH 0.1.6 以上才有）。下面这些值照常显示，但改不了 —— ' +
          '要改只能去 loader 里那条 dsh-etude 配置条目。',
      }),
    )
  } else if (snapshot && snapshot.status === 'error') {
    notices.push(h(SET_banner, { key: 'err', tone: 'bad', title: '配置没读出来', text: snapshot.error || '' }))
  } else if (!snapshot || snapshot.status !== 'ready') {
    notices.push(
      h(SET_banner, {
        key: 'wait',
        tone: 'warn',
        title: '正在等宿主把配置给过来',
        text: '下面先按默认值显示。',
      }),
    )
  } else if (snapshot.writable === false) {
    notices.push(
      h(SET_banner, {
        key: 'ro',
        tone: 'warn',
        title: '这份配置是只读的',
        text: '宿主说当前不能改（writable = false）。下面照样显示真值。',
      }),
    )
  }

  let section = null
  if (group === 'lang') section = SET_secLang(stage)
  else if (group === 'voice') section = SET_secVoice(stage)
  else if (group === 'make') section = SET_secMake(stage)
  else if (group === 'api') section = SET_secApi(stage)
  else if (group === 'place') section = SET_secPlace(stage)
  else if (group === 'health') section = SET_secHealth(stage)
  else section = SET_secAbout(stage)

  const meta = SET_meta(group)
  const subtitle = []
  subtitle.push('dsh-etude')
  subtitle.push(facts.status === 'ready' && facts.value && facts.value.version ? String(facts.value.version) : '版本待取')
  subtitle.push(facts.status === 'ready' && facts.value && facts.value.root ? String(facts.value.root) : '目录待取')
  subtitle.push(meta.title)

  return Screen({
    className: 'stg-screen',
    children: [
      h('style', { key: 'css' }, SET_css()),
      h(
        'header',
        { key: 'hdr', className: 'hdr' },
        h('div', null, h('h1', null, '设置'), h('div', { className: 'sub stg-sub' }, subtitle.join(' · '))),
        h(
          'div',
          { className: 'act' },
          h(
            'button',
            {
              type: 'button',
              className: 'btn ghost',
              onClick: function () {
                factsBundle.reload()
              },
            },
            '重取一次',
          ),
          props.onBack
            ? h('button', { type: 'button', className: 'btn ghost', onClick: props.onBack }, '回面板')
            : null,
        ),
      ),
      h(
        'div',
        { key: 'wrap', className: 'setwrap' },
        SET_nav(group, function (next) {
          setGroup(next)
          setNote('')
        }),
        h(
          'div',
          { key: 'body', className: 'setbody' },
          notices,
          SET_saveLine(save),
          note ? h('p', { key: 'note', className: 'mut stg-note' }, note) : null,
          h(SetGroup, { key: 'group', title: meta.title, note: meta.note }, section),
        ),
      ),
    ],
  })
}

function SET_nav(active, onPick) {
  return h(
    'nav',
    { className: 'setnav', 'aria-label': '设置分组' },
    SET_glabs().map(function (block) {
      return h(
        'div',
        { key: block.label, className: 'stg-navblock' },
        h('div', { className: 'glab' }, block.label),
        block.ids.map(function (id) {
          const meta = SET_meta(id)
          return h(
            'a',
            {
              key: id,
              href: '#' + id,
              className: active === id ? 'on' : '',
              'aria-current': active === id ? 'page' : undefined,
              onClick: function (event) {
                if (event && typeof event.preventDefault === 'function') event.preventDefault()
                onPick(id)
              },
            },
            meta.title,
          )
        }),
      )
    }),
  )
}

// ── 这个文件自己的样式 ────────────────────────────────────────────────────────
//
// 只加 .stg- 开头的类，量很小：一是补齐设计稿里没有的（下拉、音频、体检行），
// 二是把被覆盖层吃掉的那几个（.desc / .ghead .mut）显式打开。

function SET_css() {
  return [
    '.stg-screen{max-width:1120px}',
    '.stg-navblock{display:flex;flex-direction:column;gap:2px}',
    '.setbody .group .field .desc.stg-desc-on{display:block;margin-top:4px;font-size:12px;line-height:1.55;color:var(--fg3);max-width:60ch}',
    '.stg-gnote{display:block}',
    '.stg-sub{word-break:break-all}',
    '.stg-inp{width:100%;min-width:0;height:34px;box-sizing:border-box;font:inherit;font-size:12px;font-family:inherit}',
    '.stg-inp::placeholder{color:var(--ghost,rgba(255,255,255,.35))}',
    'select.stg-inp{appearance:auto;-webkit-appearance:auto;padding:0 10px;cursor:pointer}',
    '.stg-step{padding:0;line-height:1}',
    '.stg-step:disabled{opacity:.35;cursor:default}',
    '.stg-msg{font-size:11.5px;line-height:1.5;display:flex;align-items:center;gap:6px;margin:0 0 10px}',
    '.stg-msg-busy{color:var(--fg3,rgba(255,255,255,.55))}',
    '.stg-msg-ok{color:var(--s-green,#57c77b)}',
    '.stg-msg-bad{color:var(--danger,#e5534b)}',
    '.stg-inline{margin:0;max-width:320px;text-align:right}',
    '.stg-banner{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:baseline;padding:11px 14px;border-radius:14px;font-size:12px;line-height:1.6}',
    '.stg-banner b{font-weight:600}',
    '.stg-banner span{color:var(--fg3,rgba(255,255,255,.55))}',
    '.stg-banner-warn{background:rgba(240,180,60,.09);border:1px solid rgba(240,180,60,.28);color:#f0b43c}',
    '.stg-banner-bad{background:rgba(229,83,75,.1);border:1px solid rgba(229,83,75,.3);color:var(--danger,#e5534b)}',
    '.stg-list{display:flex;flex-direction:column;gap:7px;margin-top:12px}',
    '.stg-check{display:grid;grid-template-columns:9px 128px minmax(0,1fr);gap:9px;align-items:baseline;font-size:12px;color:var(--fg3,rgba(255,255,255,.55))}',
    '.stg-check b{font-weight:600;color:var(--fg2,rgba(255,255,255,.8))}',
    '.stg-checkv{word-break:break-word;font-variant-numeric:tabular-nums}',
    '.stg-dot{width:7px;height:7px;border-radius:50%;display:inline-block}',
    '.stg-dot-ok{background:var(--s-green,#57c77b);box-shadow:0 0 0 2px rgba(87,199,123,.16)}',
    '.stg-dot-bad{background:var(--danger,#e5534b);box-shadow:0 0 0 2px rgba(229,83,75,.18)}',
    '.stg-meta-line{display:flex;flex-wrap:wrap;gap:14px;margin-top:12px;font-size:11.5px;color:var(--ghost,rgba(255,255,255,.35))}',
    '.stg-code{display:inline-block;max-width:290px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;vertical-align:bottom;font-size:11.5px;color:var(--fg2,rgba(255,255,255,.8));font-variant-numeric:tabular-nums}',
    '.stg-live{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;color:var(--ghost,rgba(255,255,255,.35));white-space:nowrap}',
    '.stg-audio{height:32px;max-width:260px;filter:invert(1) hue-rotate(180deg)}',
    '.stg-meta{white-space:nowrap;font-size:11px}',
    '.stg-note{margin:0 0 10px}',
    '.stg-body{display:flex;flex-direction:column;gap:6px}',
  ].join('\n')
}


/* ===================== 90-app.js ===================== */
/* 90 · 组装：一个 App，按顶栏切页。
   四屏都是可选的 —— 某个分片还没写出来时（typeof 是 'undefined'），
   这一页就退回一张说明卡，不会整片白屏。 */

function EtudeApp({ rpc, configForm }) {
  const [page, setPage] = useState('cards')
  const { state, error, reload } = useFactory(rpc)

  const pageOf = (name) => {
    if (name === 'cards') return h(CardsPage, { rpc, state, error, onReload: reload, onGo: setPage })
    if (name === 'study' && typeof StudyPage === 'function') {
      return h(StudyPage, { rpc, state, error, onReload: reload, onGo: setPage })
    }
    if (name === 'factory' && typeof FactoryPage === 'function') {
      return h(FactoryPage, { rpc, state, error, reload })
    }
    if (name === 'stats' && typeof StatsPage === 'function') {
      return h(StatsPage, { rpc, state, error, reload })
    }
    if (name === 'settings' && typeof SettingsPage === 'function') {
      // form 是宿主 configForms 的 etude 表单；没有就传 null，设置页会渲染成只读并说明原因。
      return h(SettingsPage, { rpc, state, error, reload, form: configForm || null, onBack: () => setPage('cards') })
    }
    return h(ViewStub, { title: name, note: '这一屏还没搬进插件。' })
  }

  return h(
    ShadowHost,
    { theme: 'dark' },
    h(
      'div',
      { className: 'etude-shell' },
      h(Topbar, { page, onPage: setPage, state }),
      pageOf(page),
    ),
  )
}

function ViewStub({ title, note }) {
  return h(
    Screen,
    { className: 'half' },
    h('header', { className: 'hdr' }, h('h1', null, title)),
    h('div', { className: 'card', style: { padding: '24px' } }, h('p', { className: 'mut' }, note)),
  )
}


/* ===================== 99-register.js ===================== */
/* 99 · 注册：main 面板 + 侧栏「卡片工厂」入口 */

const LOCALE = {
  zh: {
    'nav.title': '卡片工厂',
    'nav.subtitle': '还没有账本，先造一个包',
  },
  en: {
    'nav.title': 'Card factory',
    'nav.subtitle': 'No ledger yet — make a pack first',
  },
}

const inject = ['slots', 'locale', 'connection', 'configForms']

function apply(ctx) {
  // 宿主那边的连接。注意 apply 不是 React 组件，这里不能调 hook ——
  // 面板自己的状态全在 EtudeApp 里。
  let rpcGetter = null
  const getRpc = () => {
    if (rpcGetter) return rpcGetter
    try {
      const connection = ctx.get('connection')
      if (connection && typeof connection.rpc?.call === 'function') rpcGetter = connection.rpc
    } catch {}
    return rpcGetter
  }

  // 设置页要写回宿主配置：DSH 的 configForms 是 etude 表单的唯一写入口。
  // 拿不到（旧版宿主）就传 null，设置页会渲染成只读并说明原因。
  const getForm = () => {
    try {
      const forms = ctx.get('configForms')
      if (forms && typeof forms.get === 'function') return forms.get(CONFIG_NS) || null
    } catch {}
    return null
  }

  ctx.effect(() => ctx.locale.register(NS, { zh: LOCALE.zh, en: LOCALE.en }), 'dsh-etude: copy')
  const bound = ctx.locale.bind(NS)
  const t = (key) => {
    try {
      const v = bound(key)
      if (v && v !== key) return v
    } catch {}
    return LOCALE.zh[key] ?? LOCALE.en[key] ?? key
  }

  // 主面板：侧栏点「卡片工厂」进来的那一页
  ctx.slots.inject('main', () =>
    ctx.slots.register({ name: 'main', key: NS, locale: NS }, () =>
      h(EtudeApp, { rpc: getRpc, configForm: getForm() }),
    ),
  )

  // 侧栏那一行
  ctx.slots.inject('sidebar.panellist', () =>
    ctx.slots.register(
      { name: 'sidebar.panellist', id: NS, order: 30, label: () => t('nav.title'), locale: NS },
      (owner) => h(Icon, { name: 'factory', size: typeof owner?.size === 'number' ? owner.size : 18 }),
    ),
  )
}

exports.apply = apply
exports.inject = inject


    return module.exports
  },
})
