'use strict';
/* The Last Lantern Ferry – engine. Hai người chơi chung một điện thoại. */

/* ---------- tiện ích ---------- */
const $ = (s, r = document) => r.querySelector(s);
const FAST = /[?&]fast/.test(location.search);
const sleep = ms => new Promise(r => setTimeout(r, FAST ? ms / 25 : ms));
const rnd = n => 1 + Math.floor(Math.random() * n);
const rollN = (n, d) => Array.from({ length: n }, () => rnd(d));
const sum = a => a.reduce((x, y) => x + y, 0);
const fmt = n => (n >= 0 ? '+' : '−') + Math.abs(n);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function h(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
function md(s) {
  if (typeof s === 'function') s = s();
  return String(s).replace(/\*\*\*(.+?)\*\*\*/g, '<b><i>$1</i></b>').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>').replace(/\n/g, '<br>');
}
const CH = { T: 'Tamsin', W: 'Wren' };
const other = w => (w === 'T' ? 'W' : 'T');
const KEY = 'llf_save_v1', SKEY = 'llf_sound';

/* ---------- trạng thái ---------- */
function newState() {
  return {
    names: { T: '', W: '' }, rel: null, hp: { T: 27, W: 24 }, max: { T: 27, W: 24 }, slots: [4, 2], cd: 2,
    insp: { T: false, W: false }, nextMod: null, f: {}, inv: { tin: false, whistle: false, potion: 0, journal: false, fireflies: false },
    lanterns: 0, memory: '', scene: null, log: [], reader: null, extra: ''
  };
}
let S = newState();
const RT = { combat: false, scrolled: false, sound: true, feed: null };
try { RT.sound = localStorage.getItem(SKEY) !== '0'; } catch (e) { }
const pname = w => S.names[w] || (w === 'T' ? 'Người chơi 1' : 'Người chơi 2');
const totalSlots = () => S.slots[0] + S.slots[1];
function spendSlot() { if (S.slots[0] > 0) S.slots[0]--; else if (S.slots[1] > 0) S.slots[1]--; hud(); }
function persist() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
function loadSave() { try { const v = localStorage.getItem(KEY); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
function clearSave() { try { localStorage.removeItem(KEY); } catch (e) { } }
function heal(w, n) { const b = S.hp[w]; S.hp[w] = Math.min(S.max[w], S.hp[w] + n); hud(); return S.hp[w] - b; }

/* ---------- âm thanh ---------- */
let AC = null;
function beep(f, d, type = 'square', vol = 0.035, delay = 0) {
  if (!RT.sound) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.value = f; g.gain.value = vol;
    o.connect(g); g.connect(AC.destination); const t = AC.currentTime + delay; o.start(t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.stop(t + d + 0.02);
  } catch (e) { }
}
const sfx = {
  tick() { beep(380 + Math.random() * 420, 0.035); },
  click() { beep(560, 0.05); },
  win() { beep(523, 0.1); beep(659, 0.1, 'square', 0.035, 0.1); beep(880, 0.2, 'square', 0.035, 0.2); },
  lose() { beep(260, 0.18, 'triangle', 0.05); beep(196, 0.3, 'triangle', 0.05, 0.15); },
  hit() { beep(150, 0.12, 'sawtooth', 0.05); },
  heal() { beep(660, 0.1, 'sine', 0.05); beep(990, 0.2, 'sine', 0.05, 0.1); },
  chime() { beep(784, 0.25, 'sine', 0.05); beep(1175, 0.4, 'sine', 0.04, 0.12); }
};
function buzz(ms = 15) { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { } }

/* ---------- UI chung ---------- */
let toastT = null;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 2200); }
function openModal(html) {
  const m = $('#modal'); m.innerHTML = '<div class="sheet"><button class="x" aria-label="Đóng">✕</button>' + html + '</div>'; m.hidden = false;
  $('.x', m).onclick = closeModal; m.onclick = e => { if (e.target === m) closeModal(); };
  return $('.sheet', m);
}
function closeModal() { const m = $('#modal'); m.hidden = true; m.innerHTML = ''; }
function overlay(html) { const o = $('#overlay'); o.innerHTML = '<div class="ov">' + html + '</div>'; o.hidden = false; return $('.ov', o); }
function hideOverlay() { $('#overlay').hidden = true; $('#overlay').innerHTML = ''; }
function clickWait(btn) { return new Promise(r => { btn.onclick = () => { sfx.click(); buzz(); r(); }; }); }
function put(node) {
  RT.feed.append(node);
  if (!RT.scrolled) { RT.scrolled = true; requestAnimationFrame(() => node.scrollIntoView({ block: 'start' })); }
  updateDown();
  return node;
}
function blk(cls, html) { const d = h('div', 'blk ' + (cls || ''), html); return d; }
function updateDown() {
  const f = RT.feed; let d = $('#down');
  const more = f && f.scrollHeight - f.scrollTop - f.clientHeight > 80 && !$('#topbar').hidden;
  if (!d) { d = h('button', 'icon-btn', '⬇'); d.id = 'down'; d.style.cssText = 'position:fixed;right:12px;bottom:calc(env(safe-area-inset-bottom) + 14px);z-index:30;width:44px;height:44px;border-radius:22px;background:#f5c842;color:#2a1c00;border-color:#fff1b0;display:none'; d.onclick = () => RT.feed.scrollTo({ top: RT.feed.scrollHeight, behavior: 'smooth' }); document.body.append(d); }
  d.style.display = more ? 'block' : 'none';
}

function hud() {
  const bar = $('#topbar');
  for (const w of ['T', 'W']) {
    const c = $('#chip' + w), pct = Math.max(0, S.hp[w] / S.max[w] * 100);
    c.classList.toggle('asleep', S.hp[w] <= 0);
    c.innerHTML = `<div class="nm">${CH[w]}${S.insp[w] ? '<span title="Cảm hứng Anh hùng" style="color:#f5c842">★</span>' : ''}${S.hp[w] <= 0 ? ' <small>😴</small>' : ''}</div>
      <div class="hpbar"><i style="width:${pct}%"></i></div>
      <div class="meta">❤ ${S.hp[w]}/${S.max[w]}${w === 'T' ? ` · ✦${S.slots[0]}+${S.slots[1]}` : ''}</div>`;
  }
  const mb = $('#modbar');
  if (S.nextMod) { mb.hidden = false; mb.textContent = S.nextMod === 'adv' ? '🌫 Sương mù: kiểm tra kế tiếp có LỢI THẾ' : '🌫 Sương mù: kiểm tra kế tiếp có BẤT LỢI'; } else mb.hidden = true;
}
function setNextMod(m) { if (!S.nextMod) S.nextMod = m; else if (S.nextMod !== m) S.nextMod = null; hud(); }

/* ---------- xúc xắc ---------- */
function d20r(adv, dis, luck = false) {
  const roll = () => { let v = rnd(20), l = 0; if (luck && v === 1) { l = 1; v = rnd(20); } return { v, l }; };
  const A = roll();
  if (adv === dis) return { all: [A.v], n: A.v, luck: A.l };
  const B = roll();
  return { all: [A.v, B.v], n: adv ? Math.max(A.v, B.v) : Math.min(A.v, B.v), luck: A.l || B.l, adv, dis };
}
async function animDice(els, finals, ms = 650) {
  els.forEach(e => e.classList.add('roll'));
  const t0 = performance.now(); if (FAST) ms = 30;
  while (performance.now() - t0 < ms) { els.forEach((e, i) => e.textContent = rnd(e.classList.contains('d6') ? 6 : 20)); sfx.tick(); await sleep(70); }
  els.forEach((e, i) => { e.classList.remove('roll'); e.textContent = finals[i]; });
}
function diceEls(host, n, d6) { host.innerHTML = ''; const els = Array.from({ length: n }, () => h('div', 'die' + (d6 ? ' d6' : ''), '?')); els.forEach(e => host.append(e)); return els; }
async function showD20(host, r) {
  const els = diceEls(host, r.all.length);
  await animDice(els, r.all);
  if (r.all.length > 1) { const keep = r.all.indexOf(r.n); els.forEach((e, i) => { if (i !== keep) e.classList.add('off'); }); }
}

/* ---------- hộp TUNG: kiểm tra d20 ---------- */
function checkPanel(cfg, host, ctx = {}) {
  return new Promise(resolve => {
    const box = h('div', 'tung blk'); box.innerHTML = `<div class="th">TUNG · ${esc(cfg.title || 'Kiểm tra')}</div>`;
    const tb = h('div', 'tb'); box.append(tb); host.append(box);
    const opts = cfg.opts.filter(op => !op.if || op.if());
    const dc = typeof cfg.dc === 'function' ? cfg.dc() : cfg.dc;
    let sel = 0, helpOn = false, started = false;
    const pills = h('div', 'pills');
    opts.forEach((op, i) => {
      const b = h('button', 'pill' + (i ? '' : ' sel'), `<span class="m">d20${fmt(op.mod)}</span><b>${CH[op.c]}</b> <span class="sub">(${pname(op.c)})</span> · ${esc(op.skill)}`);
      b.onclick = () => { if (started) return; sel = i; [...pills.children].forEach((x, j) => x.classList.toggle('sel', j === i)); paint(); };
      pills.append(b);
    });
    const req = h('div', 'req', `Cần <b>${dc}</b> trở lên` + (cfg.note ? ` · <span class="sub">${esc(cfg.note)}</span>` : ''));
    const tags = h('div', 'chips');
    let helpBtn = null;
    if (cfg.help) { helpBtn = h('button', 'btn ghost', '🙌 Tamsin Hỗ trợ trước (cô thành thạo Thuyết phục) → Lợi thế'); helpBtn.onclick = () => { helpOn = !helpOn; helpBtn.classList.toggle('sel', helpOn); paint(); }; }
    const go = h('button', 'btn pri', '🎲 TUNG');
    const dice = h('div', 'dice'), math = h('div', 'math'), res = h('div');
    tb.append(pills, req, tags); if (helpBtn) { helpBtn.style.marginBottom = '8px'; tb.append(helpBtn); } tb.append(go, dice, math, res);
    function modes() {
      let adv = false, dis = false; const notes = [];
      if (cfg.adv && cfg.adv()) { adv = true; notes.push(cfg.advNote || 'Lợi thế'); }
      if (ctx.adv) { adv = true; notes.push(ctx.advNote || 'Lợi thế'); }
      if (helpOn) { adv = true; notes.push('Hỗ trợ'); }
      if (S.nextMod === 'adv') { adv = true; notes.push('Sương mù'); }
      if (S.nextMod === 'dis') { dis = true; notes.push('Sương mù'); }
      return { adv, dis, notes };
    }
    function paint() {
      const m = modes(); tags.innerHTML = '';
      if (m.adv && m.dis) tags.append(h('span', 'tag', 'Lợi thế + Bất lợi = tung thường'));
      else if (m.adv) tags.append(h('span', 'tag adv', '▲ Lợi thế (' + esc(m.notes.join(', ')) + ')'));
      else if (m.dis) tags.append(h('span', 'tag dis', '▼ Bất lợi (' + esc(m.notes.join(', ')) + ')'));
      if (opts[sel].c === 'W') tags.append(h('span', 'tag', 'Halfling Luck: 1 tự nhiên được tung lại'));
    }
    paint();
    function finalize(total, who, skill) {
      const win = total >= dc;
      const txt = win ? cfg.win : cfg.lose;
      res.innerHTML = `<div class="res ${win ? 'win' : 'lose'}"><span class="badge">${win ? 'THÀNH CÔNG' : 'THẤT BẠI'} →</span>${txt ? md(txt) : (win ? 'Hai bạn làm được.' : 'Không sao. Câu chuyện vẫn đi tiếp.')}</div>`;
      win ? sfx.win() : sfx.lose();
      try { (win ? cfg.onWin : cfg.onLose) && (win ? cfg.onWin : cfg.onLose)(); } catch (e) { console.error(e); }
      hud();
      resolve({ win, total, who, skill });
    }
    go.onclick = async () => {
      if (started) return; started = true; go.disabled = true; sfx.click(); buzz();
      [...pills.children].forEach(p => p.disabled = true); if (helpBtn) helpBtn.disabled = true;
      const m = modes(), op = opts[sel], who = op.c;
      if (S.nextMod) S.nextMod = null; hud();
      if (ctx.consume) ctx.consume();
      let r = d20r(m.adv, m.dis, who === 'W');
      await showD20(dice, r);
      let total = r.n + op.mod;
      math.innerHTML = `${r.n}${r.luck ? ' <small>(Luck!)</small>' : ''} ${fmt(op.mod)} = <b style="color:#f5c842">${total}</b> <small>vs ${dc}</small>`;
      if (total < dc && S.insp[who]) {
        const rr = h('div', 'row'); rr.style.marginTop = '8px';
        const y = h('button', 'btn', '★ Dùng Cảm hứng Anh hùng (tung lại)'), n = h('button', 'btn ghost', 'Giữ kết quả');
        rr.append(y, n); res.append(rr);
        const use = await new Promise(rs => { y.onclick = () => rs(true); n.onclick = () => rs(false); });
        rr.remove();
        if (use) {
          S.insp[who] = false; hud(); toast('Đã dùng Cảm hứng Anh hùng');
          r = d20r(m.adv, m.dis, who === 'W'); await showD20(dice, r); total = r.n + op.mod;
          math.innerHTML = `${r.n} ${fmt(op.mod)} = <b style="color:#f5c842">${total}</b> <small>vs ${dc} (tung lại)</small>`;
        }
      }
      finalize(total, who, op.skill);
    };
  });
}

/* ---------- Giữa Hai Ta ---------- */
function curReader() { return S.reader || 'T'; }
function gtPanel(host, opt) {
  return new Promise(resolve => {
    const reader = curReader(), partner = other(reader);
    const box = h('div', 'tung blk'); box.innerHTML = '<div class="th">TUNG · Giữa Hai Ta</div>';
    const tb = h('div', 'tb'); box.append(tb); host.append(box);
    tb.append(h('p', null, `<b>Người Đồng Hành (${pname(partner)} · ${CH[partner]})</b> tung d6 và hỏi <b>${CH[reader]}</b>. Người Đọc trả lời đúng vai và nhận <b>Cảm hứng Anh hùng</b>.`));
    const go = h('button', 'btn pri', '🎲 TUNG d6'), dice = h('div', 'dice'), out = h('div');
    tb.append(go); if (opt) { const sk = h('button', 'btn ghost', 'Bỏ qua (hai bạn đã trò chuyện rồi)'); sk.style.marginTop = '8px'; sk.onclick = () => { box.remove(); resolve(false); }; tb.append(sk); }
    tb.append(dice, out);
    go.onclick = async () => {
      go.disabled = true; sfx.click(); buzz(); const n = rnd(6); const els = diceEls(dice, 1, true); await animDice(els, [n]);
      out.innerHTML = `<div class="res info"><span class="badge">${n}</span><b>${esc(GHT_Q[n - 1])}</b></div>`;
      const ok = h('button', 'btn', S.insp[reader] ? '✓ Đã trả lời (đã có Cảm hứng Anh hùng)' : `✓ Đã trả lời — ${CH[reader]} nhận ★ Cảm hứng Anh hùng`); ok.style.marginTop = '8px'; out.append(ok);
      await clickWait(ok); ok.disabled = true;
      if (!S.insp[reader]) { S.insp[reader] = true; toast('★ ' + CH[reader] + ' nhận Cảm hứng Anh hùng'); sfx.chime(); }
      hud(); resolve(true);
    };
  });
}

/* ---------- Sương mù ---------- */
function fogPanel(host, ch) {
  return new Promise(resolve => {
    const partner = other(curReader());
    const box = h('div', 'tung blk'); box.innerHTML = '<div class="th">TUNG · Sương mù</div>';
    const tb = h('div', 'tb'); box.append(tb); host.append(box);
    tb.append(h('p', null, `<b>Người Đồng Hành (${pname(partner)})</b> tung d6 · không có con số cần đạt.`));
    const go = h('button', 'btn pri', '🌫 TUNG d6'), dice = h('div', 'dice'), out = h('div'); tb.append(go, dice, out);
    go.onclick = async () => {
      go.disabled = true; sfx.click(); buzz(); const n = rnd(6); const els = diceEls(dice, 1, true); await animDice(els, [n]);
      const e = FOG[ch][n - 1]; let extra = '';
      if (e.fx === 'adv') setNextMod('adv');
      if (e.fx === 'dis') setNextMod('dis');
      if (e.fx === 'heal') { const a = rnd(4), b = rnd(4); const x = heal('T', a), y = heal('W', b); extra = `<br><small>Tamsin +${a}, Wren +${b} Điểm máu.</small>`; sfx.heal(); }
      if (e.fx === 'insp') { S.insp.T = S.insp.W = true; hud(); sfx.chime(); }
      out.innerHTML = `<div class="res info"><span class="badge">${n}</span>${md(e.t)}${extra}</div>`;
      if (e.fx === 'ght') await gtPanel(host.isConnected ? host : RT.feed, false);
      RT.scrolled = false; resolve();
    };
  });
}

/* ---------- danh sách thẻ (Thử xem / Lựa chọn nhẹ nhàng) ---------- */
function renderItems(host, items, opt = {}) {
  let busy = false; const cards = [];
  items.forEach(it => {
    if (it.if && !it.if()) return;
    const card = h('div', 'card'); card.innerHTML = `<h4>${esc(it.title)}</h4>` + (it.desc ? `<div class="d">${md(it.desc)}</div>` : '');
    const area = h('div'); card.append(area); host.append(card); cards.push(card);
    const finish = (win, res) => { card.classList.remove('open'); card.classList.add('done'); busy = false; opt.onResult && opt.onResult(it, { win, ...res }); };
    const autoOk = it.auto && (!it.auto.if || it.auto.if());
    if (autoOk) {
      const b = h('button', 'btn', it.auto.label || 'Làm'); area.append(b);
      b.onclick = () => {
        if (busy || opt.locked && opt.locked()) return; sfx.click(); buzz(); b.remove();
        if (it.auto.text) area.append(h('div', 'res info', md(it.auto.text)));
        if (it.auto.fx) it.auto.fx(); hud(); sfx.win(); finish(true, {});
      };
    } else if (it.buttons) {
      const bs = it.buttons.filter(x => !x.if || x.if()); const wrap = h('div', 'stack'); area.append(wrap);
      bs.forEach(x => {
        const b = h('button', 'btn', x.label); wrap.append(b);
        b.onclick = () => { if (busy || opt.locked && opt.locked()) return; sfx.click(); wrap.remove(); area.append(h('div', 'res info', md(x.text))); if (x.fx) x.fx(); hud(); finish(true, {}); };
      });
    } else if (it.check && (it.check.if ? it.check.if() : true)) {
      const sm = [...new Set(it.check.opts.filter(o2 => !o2.if || o2.if()).map(o2 => `${CH[o2.c]} ${fmt(o2.mod)}`))].join(' / ');
      const b = h('button', 'btn', `🎲 Thử <small>${esc(sm)}</small>`); area.append(b);
      b.onclick = async () => {
        if (busy || opt.locked && opt.locked()) return; busy = true; b.remove(); card.classList.add('open');
        const ctx = opt.ctx ? opt.ctx() : {};
        const r = await checkPanel({ title: it.title, ...it.check }, area, ctx);
        finish(r.win, r);
      };
    }
  });
  return cards;
}

/* ---------- Lựa chọn nhẹ nhàng (đếm 3 thành công / 2 thất bại) ---------- */
function cozyRun(cfg, host) {
  return new Promise(resolve => {
    const box = h('div', 'tung cozy blk'); box.innerHTML = `<div class="th">LỰA CHỌN NHẸ NHÀNG · ${esc(cfg.title)}</div>`;
    const tb = h('div', 'tb'); box.append(tb); host.append(box);
    tb.append(h('p', 'sub', 'Chọn một cách, người được nêu tên sẽ tung. Mỗi cách chỉ dùng một lần. Thành công → đánh dấu một ô Thành công. Thất bại → một ô Thất bại.'));
    const score = h('div', 'score'); tb.append(score);
    let w = 0, l = 0, finished = false, firstAdv = !!(cfg.firstAdv && cfg.firstAdv());
    const paint = () => {
      const bx = (n, tot, c) => Array.from({ length: tot }, (_, i) => `<span class="box ${i < n ? c : ''}">${i < n ? (c === 'w' ? '✓' : '✗') : ''}</span>`).join('');
      score.innerHTML = `<span class="w">Thành công ${bx(w, cfg.win, 'w')}</span><span class="l">Thất bại ${bx(l, cfg.lose, 'l')}</span>`;
    };
    paint();
    if (firstAdv && cfg.firstAdvNote) tb.append(h('div', 'chips', `<span class="tag adv">▲ ${esc(cfg.firstAdvNote)}</span>`));
    const list = h('div'); tb.append(list);
    renderItems(list, cfg.items, {
      locked: () => finished,
      ctx: () => ({ adv: firstAdv, advNote: cfg.firstAdvNote, consume: () => { firstAdv = false; } }),
      onResult: (it, r) => {
        r.win ? w++ : l++; paint();
        if (w >= cfg.win || l >= cfg.lose) {
          finished = true; const win = w >= cfg.win;
          [...list.querySelectorAll('button')].forEach(b => b.disabled = true);
          tb.append(h('div', 'res ' + (win ? 'win' : 'lose'), `<span class="badge">${win ? 'THÀNH CÔNG' : 'THẤT BẠI'}</span>${md(win ? (cfg.winTxt || 'Ba lần thành công!') : (cfg.loseTxt || 'Hai lần thất bại.'))}`));
          win ? sfx.win() : sfx.lose();
          const c = h('button', 'btn pri', 'Tiếp tục ▸'); c.style.marginTop = '10px'; tb.append(c);
          clickWait(c).then(() => { c.disabled = true; RT.scrolled = false; resolve(win ? 'win' : 'lose'); });
        }
      }
    });
  });
}

/* ---------- Giao tranh ---------- */
class Gentle extends Error { }
async function runCombat(E, host) {
  RT.combat = true;
  const box = h('div', 'tung combat blk'); box.innerHTML = `<div class="th">GIAO TRANH · ${esc(E.title)}</div>`;
  const tb = h('div', 'tb'); box.append(tb); host.append(box);
  tb.append(h('div', 'note', md(E.intro)));
  const arena = h('div', 'arena'), orderEl = h('div', 'order'), rb = h('div'), ctl = h('div'), log = h('div', 'log');
  tb.append(arena, orderEl, rb, ctl, log);
  const foes = E.foes.map(f => ({ ...f, kind: 'foe', cur: f.hp, down: false, marked: false }));
  const heroes = ['T', 'W'].map(w => ({ id: w, kind: 'hero', who: w, name: CH[w] }));
  const st = { near: true, advT: 0, advW: 0, advAny: 0, fenDis: 0, potion: false, steady: false };
  let cur = null, order = [], round = 1;
  const L = (t, c) => { const d = h('div', c || '', md(t)); log.append(d); log.scrollTop = log.scrollHeight; };
  const asleep = w => S.hp[w] <= 0;
  const living = () => foes.filter(f => !f.down);
  const mainF = foes.find(f => f.main);
  function paintArena() {
    arena.innerHTML = '';
    const mk = (u) => {
      const isH = u.kind === 'hero', hp = isH ? S.hp[u.who] : u.cur, mx = isH ? S.max[u.who] : u.hp;
      const d = h('div', 'unit' + (isH ? '' : ' foe') + (cur === u ? ' act' : '') + ((isH ? asleep(u.who) : u.down) ? ' down' : '') + (u.marked ? ' mark' : ''));
      const cv = h('canvas'); cv.width = 28; cv.height = 28; d.append(cv);
      d.append(h('div', 'n', u.name), h('div', 'hpbar', `<i style="width:${Math.max(0, hp / mx * 100)}%"></i>`));
      const stt = isH ? (asleep(u.who) ? '😴 ngủ thiếp' : (S.insp[u.who] ? '★ Cảm hứng' : '')) : (u.down ? 'tản đi' : (u.cur <= u.bloodied ? 'Trọng thương' : ''));
      d.append(h('div', 'st', `${hp}/${mx} ${stt}`)); arena.append(d);
      Art.portrait(cv, isH ? (u.who === 'T' ? 'tamsin' : 'wren') : u.sprite);
    };
    foes.forEach(mk); heroes.forEach(mk);
    orderEl.innerHTML = '<span style="border:0">Thứ tự:</span>' + order.map(u => `<span class="${u === cur ? 'cur' : ''}">${u.name}</span>`).join('');
    hud();
  }
  async function rollShow(sides, vals, text) {
    rb.innerHTML = ''; const dd = h('div', 'dice'); rb.append(dd);
    const els = diceEls(dd, vals.length, sides === 6);
    await animDice(els, vals, 500);
    if (text) rb.append(h('div', 'math', text));
    await sleep(350);
  }
  function pick(prompt, list, gentle = true) {
    return new Promise(res => {
      ctl.innerHTML = ''; if (prompt) ctl.append(h('div', 'req', prompt));
      const g = h('div', 'stack');
      list.forEach(it => { const b = h('button', 'btn' + (it.pri ? ' pri' : ''), it.label); if (it.off) b.disabled = true; b.onclick = () => { sfx.click(); ctl.innerHTML = ''; res(it.v); }; g.append(b); });
      ctl.append(g);
      if (gentle) { const b = h('button', 'btn ghost', '🕊 "Nhẹ nhàng!" — chuyển sang Lựa chọn nhẹ nhàng'); b.style.marginTop = '8px'; b.onclick = () => { ctl.innerHTML = ''; res('__gentle'); }; ctl.append(b); }
    });
  }
  const ask = async (p, l, g = true) => { const v = await pick(p, l, g); if (v === '__gentle') throw new Gentle(); return v; };
  const dmgRoll = (n, d, flat, crit) => { const a = rollN(n * (crit ? 2 : 1), d); return { a, t: sum(a) + flat }; };
  function applyFoeDmg(f, raw, physical) {
    const d = physical ? Math.floor(raw / 2) : raw; f.cur = Math.max(0, f.cur - d);
    if (f.cur <= 0 && !f.main) f.down = true;
    return d;
  }
  function advFor(who, tgt) {
    let adv = false, dis = false; const src = [];
    if (tgt.marked) { adv = true; src.push('Guiding Bolt'); }
    if (who === 'T' && st.advT > 0) { adv = true; src.push('Hỗ trợ'); }
    if (who === 'W' && st.advW > 0) { adv = true; src.push('Steady Aim'); }
    if (st.advAny > 0) { adv = true; src.push('đèn lồng'); }
    if (S.nextMod === 'adv') { adv = true; src.push('Sương mù'); }
    if (S.nextMod === 'dis') { dis = true; src.push('Sương mù'); }
    return { adv, dis, src };
  }
  function consumeAdv(who, tgt) {
    if (tgt.marked) tgt.marked = false; else if (who === 'T' && st.advT > 0) st.advT--; else if (who === 'W' && st.advW > 0) st.advW--; else if (st.advAny > 0) st.advAny--;
    S.nextMod = null;
  }
  async function heroAttack(who, tgt, bonus, label) {
    const a = advFor(who, tgt); consumeAdv(who, tgt);
    let r = d20r(a.adv, a.dis, who === 'W'); let total = r.n + bonus;
    let hit = r.n === 20 || (r.n !== 1 && total >= tgt.ac);
    await rollShow(20, r.all, `d20 ${r.n} ${fmt(bonus)} = <b>${total}</b> vs AC ${tgt.ac}${a.src.length ? ' · ' + (a.adv ? 'Lợi thế' : 'Bất lợi') : ''}`);
    if (!hit && S.insp[who]) {
      const v = await pick(`${CH[who]} trượt! Dùng ★ Cảm hứng Anh hùng để tung lại?`, [{ label: '★ Tung lại', v: 1, pri: 1 }, { label: 'Giữ kết quả', v: 0 }], false);
      if (v) { S.insp[who] = false; r = d20r(a.adv, a.dis, who === 'W'); total = r.n + bonus; hit = r.n === 20 || (r.n !== 1 && total >= tgt.ac); await rollShow(20, r.all, `Tung lại: ${r.n} ${fmt(bonus)} = <b>${total}</b> vs AC ${tgt.ac}`); }
    }
    return { hit, crit: r.n === 20, nat: r.n, total, adv: a.adv };
  }
  async function pickTarget() {
    const lv = living(); if (lv.length === 1) return lv[0];
    const v = await ask('Chọn mục tiêu:', lv.map(f => ({ label: `${f.name} <small>${f.cur}/${f.hp} · AC ${f.ac}</small>`, v: f.id })));
    return foes.find(f => f.id === v);
  }
  async function heroTurn(u) {
    const w = u.who; let acted = false;
    while (!acted) {
      const opts = [];
      if (w === 'T') {
        opts.push({ label: `Guiding Bolt — tia sáng dẫn đường <small>+5 · 4d6 thánh quang · tốn 1 ô (còn ${totalSlots()}) · đòn kế tiếp vào nó có Lợi thế</small>`, v: 'gb', off: totalSlots() < 1 });
        opts.push({ label: 'Sacred Flame — ngọn lửa thiêng <small>chống chịu Khéo léo DC 13 · 1d8 thánh quang · miễn phí</small>', v: 'sf' });
        opts.push({ label: `Chữa lành <small>Cure Wounds 2d8+6 / Healing Word 2d4+6 · tốn 1 ô (còn ${totalSlots()})</small>`, v: 'heal', off: totalSlots() < 1 });
        opts.push({ label: 'Vung chiếc chùy <small>+2 để trúng · 1d6 sát thương đập</small>', v: 'mace' });
      } else {
        opts.push({ label: `Strike — ra đòn <small>+5 · 1d6+3 xuyên${st.near ? ' · +2d6 Sneak Attack (Tamsin sát địch)' : ''}</small>`, v: 'strike' });
        opts.push({ label: 'Steady Aim, rồi Strike <small>Lợi thế + Sneak Attack tự động (không di chuyển)</small>', v: 'aim' });
        opts.push({ label: 'Giúp một tay <small>Tamsin có Lợi thế ở đòn tấn công kế tiếp</small>', v: 'help' });
        if (E.lantern) opts.push({ label: 'Thắp một ngọn đèn lồng <small>Fen Bất lợi ở đòn kế tiếp · hai bạn có Lợi thế ở một đòn · không cần tung</small>', v: 'lamp' });
      }
      if (S.inv.potion > 0 && !st.potion) opts.push({ label: `🧪 Uống Potion of Healing <small>hành động phụ · 2d4+2 · còn ${S.inv.potion}</small>`, v: 'potion' });
      if (w === 'W') opts.push({ label: `Tamsin đứng sát mục tiêu (Sneak Attack): <b>${st.near ? 'CÓ' : 'KHÔNG'}</b> <small>chạm để đổi</small>`, v: 'toggle' });
      const v = await ask(`Lượt của <b>${CH[w]}</b> (${pname(w)}) — chọn MỘT hành động:`, opts);
      if (v === 'toggle') { st.near = !st.near; continue; }
      if (v === 'potion') {
        const t = await ask('Cho ai uống?', heroes.map(x => ({ label: `${x.name} <small>${S.hp[x.who]}/${S.max[x.who]}</small>`, v: x.who })), false);
        const a = rollN(2, 4), n = sum(a) + 2; S.inv.potion--; st.potion = true; const g = heal(t, n); sfx.heal();
        await rollShow(4, a, `2d4+2 = <b>${n}</b>`); L(`🧪 ${CH[t]} hồi ${g} Điểm máu.`, 'hit'); paintArena(); continue;
      }
      acted = true;
      if (v === 'heal') {
        const kind = await ask('Chọn phép:', [{ label: 'Cure Wounds <small>2d8+6 · hành động</small>', v: 'cw' }, { label: 'Healing Word <small>2d4+6 · hành động phụ, tầm 60 ft</small>', v: 'hw' }], false);
        const t = await ask('Chữa lành cho ai?', heroes.map(x => ({ label: `${x.name} <small>${S.hp[x.who]}/${S.max[x.who]}${asleep(x.who) ? ' · ngủ thiếp' : ''}</small>`, v: x.who })), false);
        spendSlot(); const a = kind === 'cw' ? rollN(2, 8) : rollN(2, 4), n = sum(a) + 6; const g = heal(t, n); sfx.heal();
        await rollShow(kind === 'cw' ? 8 : 4, a, `${kind === 'cw' ? '2d8' : '2d4'}+6 = <b>${n}</b>`);
        L(`✦ Tamsin ${kind === 'cw' ? 'Cure Wounds' : 'Healing Word'}: ${CH[t]} hồi ${g} Điểm máu.`, 'hit');
      } else if (v === 'sf') {
        const t = await pickTarget(); const r = rnd(20), tot = r + t.save;
        await rollShow(20, [r], `${t.name} chống chịu: ${r} ${fmt(t.save)} = <b>${tot}</b> vs DC 13`);
        if (tot >= 13) L(`✦ Sacred Flame: ${t.name} né được.`, 'miss'); else { const d = dmgRoll(1, 8, 0, false); const dd = applyFoeDmg(t, d.t, false); sfx.hit(); L(`✦ Sacred Flame trúng ${t.name}: <b>${dd}</b> thánh quang.`, 'hit'); }
      } else if (v === 'gb' || v === 'mace') {
        const t = await pickTarget(); if (v === 'gb') spendSlot();
        const r = await heroAttack('T', t, v === 'gb' ? 5 : 2);
        if (!r.hit) L(`✦ ${v === 'gb' ? 'Guiding Bolt' : 'Chùy'} trượt ${t.name}.`, 'miss');
        else if (v === 'gb') { const d = dmgRoll(4, 6, 0, r.crit); const dd = applyFoeDmg(t, d.t, false); t.marked = true; sfx.hit(); L(`✦ Guiding Bolt trúng ${t.name}${r.crit ? ' (CHÍ MẠNG)' : ''}: <b>${dd}</b> thánh quang. Đòn kế tiếp vào nó có Lợi thế.`, 'hit'); }
        else { const d = dmgRoll(1, 6, 0, r.crit); const dd = applyFoeDmg(t, d.t, true); sfx.hit(); L(`✦ Chùy trúng ${t.name}: <b>${dd}</b> (đã giảm một nửa do kháng).`, 'hit'); }
      } else if (v === 'strike' || v === 'aim') {
        const t = await pickTarget(); if (v === 'aim') st.advW++;
        const withAdv = v === 'aim' || t.marked || st.advAny > 0 || st.advW > 0;
        const r = await heroAttack('W', t, 5);
        if (!r.hit) L(`🗡 Wren ra đòn trượt ${t.name}.`, 'miss');
        else {
          const sneak = (v === 'aim' || r.adv || st.near);
          const d = dmgRoll(1, 6, 3, r.crit); let tot = d.t, s = 0; if (sneak) { const sd = dmgRoll(2, 6, 0, r.crit); s = sd.t; tot += s; }
          const dd = applyFoeDmg(t, tot, true); sfx.hit(); L(`🗡 Wren trúng ${t.name}${r.crit ? ' (CHÍ MẠNG)' : ''}: <b>${dd}</b> sát thương${sneak ? ` (gồm Sneak Attack ${s})` : ''}, đã giảm một nửa do kháng.`, 'hit');
        }
      } else if (v === 'help') {
        st.advT++; L('🙌 Wren gây rối kẻ địch: Tamsin có Lợi thế ở đòn tấn công kế tiếp.', 'sys');
      } else if (v === 'lamp') {
        S.lanterns++; st.fenDis++; st.advAny++; Art.patch({ lit: S.lanterns }); sfx.chime();
        L(`🏮 Wren thắp ngọn đèn lồng thứ <b>${S.lanterns}</b>. Fen bị Bất lợi ở đòn kế tiếp; hai bạn có Lợi thế ở một đòn tấn công vào cô.`, 'sys');
      }
      paintArena();
    }
  }
  async function foeTurn(f) {
    await ask(`Lượt của <b>${f.name}</b> — <b>Người Đọc</b> thực hiện:`, [{ label: '▶ Thực hiện lượt', v: 1, pri: true }]);
    let who;
    const d6 = rnd(6); who = d6 <= 3 ? 'T' : 'W';
    if (asleep(who)) who = other(who);
    await rollShow(6, [d6], `d6 = ${d6} → ${CH[who]}${asleep(d6 <= 3 ? 'T' : 'W') ? ' (đang ngủ, chuyển sang người kia)' : ''}`);
    const dis = f.fen && st.fenDis > 0; if (dis) st.fenDis--;
    const r = d20r(false, !!dis); const ac = who === 'T' ? 16 : 14, tot = r.n + f.bonus; const hit = r.n === 20 || (r.n !== 1 && tot >= ac);
    await rollShow(20, r.all, `d20 ${r.n} ${fmt(f.bonus)} = <b>${tot}</b> vs AC ${ac}${dis ? ' · Bất lợi (đèn lồng)' : ''}`);
    if (!hit) { L(`${f.name} đánh trượt ${CH[who]}.`, 'miss'); return; }
    const dd = (f.dmgLow && f.cur <= f.bloodied) ? f.dmgLow : f.dmg; const d = dmgRoll(dd[0], dd[1], dd[2], r.n === 20);
    S.hp[who] = Math.max(0, S.hp[who] - d.t); sfx.hit(); buzz(30);
    L(`${f.name} trúng ${CH[who]}${r.n === 20 ? ' (CHÍ MẠNG)' : ''}: <b>${d.t}</b> sát thương.${S.hp[who] <= 0 ? ` <b>${CH[who]} ngủ thiếp đi.</b>` : ''}`, 'hurt');
    paintArena();
  }
  function ended() {
    if (mainF.cur <= mainF.bloodied) return 'bloodied';
    if (asleep('T') && asleep('W')) return 'ko';
    if (E.maxRounds && round > E.maxRounds) return 'bloodied';
    return null;
  }
  try {
    // thứ tự lượt
    const ini = [];
    heroes.forEach(u => { const r = rnd(20), v = r + (u.who === 'T' ? 1 : 5); ini.push({ u, v, t: Math.random() }); });
    foes.forEach(u => { const r = rnd(20), v = r + u.init; ini.push({ u, v, t: Math.random() }); });
    ini.sort((a, b) => b.v - a.v || b.t - a.t); order = ini.map(x => x.u);
    L('Thứ tự lượt: ' + ini.map(x => `${x.u.name} ${x.v}`).join(' · '), 'sys'); paintArena();
    await ask('Tung Thứ tự lượt (Initiative): tổng cao nhất đi trước.', [{ label: '▶ Bắt đầu giao tranh', v: 1, pri: true }]);
    let result = null;
    while (!result) {
      for (const u of order) {
        cur = u; paintArena();
        if (u.kind === 'hero') { if (asleep(u.who)) { L(`${u.name} đang ngủ thiếp, bỏ lượt.`, 'miss'); continue; } await heroTurn(u); }
        else { if (u.down) continue; await foeTurn(u); }
        result = ended(); if (result) break;
      }
      round++; if (!result) { result = ended(); if (!result) L(`— Vòng ${round} —`, 'sys'); }
    }
    cur = null; paintArena(); ctl.innerHTML = '';
    const msg = result === 'bloodied' ? E.endTxt : 'Cả hai cùng ngủ thiếp đi.';
    ctl.append(h('div', 'res info', `<span class="badge">KẾT THÚC</span>${md(msg)}`));
    await sleep(800);
    return result;
  } catch (e) {
    if (e instanceof Gentle) { cur = null; paintArena(); ctl.innerHTML = ''; L('🕊 "Nhẹ nhàng!" — hai bạn chuyển sang Lựa chọn nhẹ nhàng.', 'sys'); await sleep(600); return 'gentle'; }
    throw e;
  } finally { RT.combat = false; }
}

/* ---------- gặp gỡ: chọn đánh nhau hay nhẹ nhàng ---------- */
async function encRun(id, host) {
  const E = ENC[id];
  const c = h('div', 'blk note'); c.innerHTML = '<b>Hãy cùng quyết định:</b> đánh nhau, hay chọn <b>Lựa chọn nhẹ nhàng</b>? Rồi chỉ làm theo một cách ấy. (Bạn có thể nói "Nhẹ nhàng!" bất cứ lúc nào để chuyển.)';
  const g = h('div', 'stack'); g.style.marginTop = '8px';
  const b1 = h('button', 'btn', '⚔ Đánh nhau <small>luật SRD 5.2, giao tranh theo lượt</small>'), b2 = h('button', 'btn', '🕊 Lựa chọn nhẹ nhàng <small>ba lần thành công trước hai thất bại</small>');
  g.append(b1, b2); c.append(g); host.append(c);
  const mode = await new Promise(r => { b1.onclick = () => r('fight'); b2.onclick = () => r('cozy'); }); sfx.click();
  g.remove(); c.append(h('div', 'sub', mode === 'fight' ? 'Hai bạn chọn: đánh nhau.' : 'Hai bạn chọn: Lựa chọn nhẹ nhàng.'));
  let result;
  if (mode === 'fight') { result = await runCombat(E, host); if (result === 'gentle') result = await cozyRun(E.cozy, host); }
  else result = await cozyRun(E.cozy, host);
  const good = result === 'bloodied' || result === 'win';
  if (id === 'specter') S.f.spec = good ? 'peace' : 'ko';
  if (id === 'fen') S.f.fenPass = good;
  S.log.push((id === 'specter' ? 'Bóng Vọng: ' : 'Fen: ') + (mode === 'fight' && result !== 'win' && result !== 'lose' ? 'đã giao tranh' : 'lựa chọn nhẹ nhàng') + (good ? ' (thành công)' : ' (không thành)'));
  hud();
}

/* ---------- các loại khối nội dung ---------- */
const BLK = {
  read(b) { put(blk('read', `<span class="lbl">📖 Đọc to</span>${md(b.t)}`)); },
  txt(b) { put(blk('', `<p>${md(b.t)}</p>`)); },
  tip(b) { put(blk('tip', `<span class="lbl">💡 Mẹo cho Người Đọc</span>${md(b.t)}`)); },
  h(b) { put(blk('', `<h3>${md(b.t)}</h3>`)); },
  run(b) { b.fn && b.fn(); },
  async fog() { const w = blk(''); put(w); await fogPanel(w, SCENES[S.scene].ch); },
  async ght(b) {
    const w = blk(''); put(w);
    if (b.label) w.append(h('p', 'sub', '[GIỮA HAI TA] ' + b.label));
    await gtPanel(w, b.opt); RT.scrolled = false;
  },
  async check(b) { const w = blk(''); put(w); await checkPanel(b, w, {}); RT.scrolled = false; },
  async tries(b) {
    const w = blk(''); put(w); w.append(h('h3', null, 'Thử xem <small class="sub" style="font-family:system-ui;font-size:12px">(tùy chọn: làm mấy việc, theo thứ tự nào, hay bỏ qua đều được)</small>'));
    renderItems(w, b.items, {}); const c = h('button', 'btn pri cont', 'Xong phần này ▸'); c.style.marginTop = '4px'; w.append(c);
    await clickWait(c); c.disabled = true; c.style.opacity = .5; RT.scrolled = false;
  },
  async cozy(b) { const w = blk(''); put(w); await cozyRun(b.cfg, w); RT.scrolled = false; },
  async enc(b) { const w = blk(''); put(w); await encRun(b.id, w); RT.scrolled = false; },
  async ask() {
    const w = blk(''); put(w);
    let left = S.inv.journal ? 4 : 2;
    const hd = h('h3', null, 'Hỏi Fen'); w.append(hd);
    const info = h('div', 'sub'); w.append(info);
    const upd = () => info.innerHTML = `Mỗi người hỏi Fen một câu${S.inv.journal ? ' (có nhật ký: thêm một câu mỗi người)' : ''}. Còn <b>${left}</b> câu.`; upd();
    const st = h('div', 'stack'); st.style.margin = '8px 0'; w.append(st);
    FEN_Q.forEach(q => {
      const b = h('button', 'btn', `Hỏi về: ${esc(q.q)}`); st.append(b);
      b.onclick = () => { if (left <= 0) { toast('Hết câu hỏi'); return; } left--; sfx.click(); b.disabled = true; b.classList.add('done'); b.after(h('div', 'res info', `<b>Fen:</b> ${md(q.a)}`)); upd(); };
    });
    const c = h('button', 'btn pri', 'Xong, tiếp tục ▸'); w.append(c); await clickWait(c); c.disabled = true; RT.scrolled = false;
  },
  async exits(b) {
    const w = blk(''); put(w); w.append(h('h3', null, 'Lối đi (Exits)'));
    const g = h('div', 'stack'); w.append(g);
    const opts = b.opts.filter(o2 => !o2.if || o2.if());
    let locked = false;
    const chosen = await new Promise(res => {
      opts.forEach((o2, i) => {
        const why = o2.locked && o2.locked();
        const bt = h('button', 'btn' + (why ? ' off' : ''), `<b>${i + 1}. ${esc(o2.label)}</b>${o2.desc ? `<small>${md(o2.desc)}</small>` : ''}${why ? `<small style="color:#ff8b9b">🔒 ${esc(why)}</small>` : ''}`);
        bt.onclick = () => { if (why || locked) return; locked = true; sfx.click(); buzz(); res(o2); };
        g.append(bt);
      });
    });
    [...g.children].forEach(x => x.disabled = true);
    S.log.push(`Cảnh ${SCENES[S.scene].n}: ${chosen.label}`);
    if (chosen.fx) chosen.fx(); hud();
    if (chosen.check) {
      const cw = h('div'); w.append(cw); await checkPanel(chosen.check, cw, {});
      const c = h('button', 'btn pri', 'Tiếp tục ▸'); c.style.marginTop = '8px'; cw.append(c); await clickWait(c); c.disabled = true;
    }
    RT.scrolled = false;
    return { goto: chosen.to };
  },
  async end(b) { await endScreen(b.ending); return { goto: '__end' }; }
};

/* ---------- màn hình ---------- */
function setTitleMode(on) {
  document.body.classList.toggle('title', on);
  $('#topbar').hidden = on; if (on) $('#modbar').hidden = true;
  updateDown();
}
function roleLine(sc) {
  if (!sc.reader) return '<div>📖 <b>Người Đọc:</b> ai đã đọc ít nhất (hai bạn tự chọn)</div><div>🤝 <b>Người Đồng Hành:</b> người còn lại (đọc <b>Sau Kết Cục</b> ở cuối)</div>';
  const r = sc.reader, p = other(r);
  return `<div>📖 <b>Người Đọc:</b> ${esc(pname(r))} <span class="sub">(${CH[r]})</span> — đọc to khung "Đọc to" và các Lối đi</div><div>🤝 <b>Người Đồng Hành:</b> ${esc(pname(p))} <span class="sub">(${CH[p]})</span> — bấm các nút TUNG, hỏi câu Giữa Hai Ta</div>`;
}
async function sceneTransition(sc) {
  const o = overlay(`<div class="big">Cảnh ${sc.n} · Chương ${sc.ch === 1 ? 'Một' : 'Hai'}</div><h1>${esc(sc.title)}</h1><div class="sub">~${sc.min} phút</div><div class="roles">${roleLine(sc)}</div><button class="btn pri" id="go">Bắt đầu cảnh ▸</button>`);
  Art.set(sc.art, { ...sc.artP }); $('#stageTitle').textContent = '';
  await clickWait($('#go', o)); hideOverlay();
}
function chapterIntro(ch) {
  return new Promise(res => {
    const t = ch === 1
      ? 'Mỗi đêm, chiếc *Marigold* vượt Lake Hushmere từ Dawnrest Landing sang Far Shore, lái theo Ngọn Đèn Cuối, ngọn đèn đồng thau mà các người gác đèn xưa nói rằng ngọn lửa của nó được thắp từ một vì sao. Đêm nay là chuyến vượt hồ cuối trước mùa sương mù mùa thu. Ở đâu đó giữa hồ, sẽ có người lấy mất ngọn đèn. **Không phải vì ác ý. Mà vì nỗi nhớ.**'
      : 'Bóng Vọng (nếu hai bạn đã gặp ông) đã trở về với sương, dịu hơn trước. Ngọn Đèn Cuối nằm trong xuồng, nghiêng về phía hòn đảo. Chiếc *Marigold* đợi sau lưng hai bạn với một ngọn đèn dầu và một phà đầy hành khách kiên nhẫn. Ở phía trước là nơi chiếc đèn được thắp lần đầu, và một người canh giữ rất già, rất sáng, và hoàn toàn không biết phải nghĩ sao về hai người lạ.';
    let extra = '';
    if (ch === 2) extra = `<div class="note" style="text-align:left;margin:10px 0"><b>Trước khi bắt đầu</b>, hãy đọc câu trên Điểm lưu của hai bạn, rồi lần lượt nói điều mình nhớ nhất:<br><br><i style="color:#ffe58a;font-size:17px">"Đêm nay chúng ta sẽ nhớ... ${esc(S.memory || '(hai bạn chưa ghi câu nào)')}"</i></div>`;
    const o = overlay(`<div class="big">Chương ${ch === 1 ? 'Một' : 'Hai'}</div><h1>${ch === 1 ? 'Chuyến Vượt Hồ' : 'Mist Isle'}</h1><div class="read" style="text-align:left;margin:12px 0">${md(t)}</div>${extra}<button class="btn pri" id="go">${ch === 1 ? 'Đến Dawnrest Landing' : 'Nhổ neo'} ▸</button>`);
    clickWait($('#go', o)).then(() => { hideOverlay(); res(); });
  });
}
function summaryHtml() {
  const it = [];
  if (S.inv.tin) it.push('hộp thiếc bấc đèn'); if (S.inv.whistle) it.push('chiếc còi đèn'); if (S.inv.fireflies) it.push('lọ đom đóm');
  if (S.inv.potion) it.push(`Potion of Healing ×${S.inv.potion}`); if (S.inv.journal) it.push('nhật ký phà');
  const ch = [S.f.trail && 'THEO DẤU', S.f.hold && 'GIỮ HƯỚNG', !S.f.trail && !S.f.hold && 'không chọn (Cửa hầm hàng)', S.inv.journal && 'nhật ký', S.f.orrinTip && 'mẹo của Orrin', (S.insp.T || S.insp.W) && 'Cảm hứng Anh hùng'].filter(Boolean);
  return `<table class="t"><tr><th></th><th>${esc(pname('T'))} · Tamsin</th><th>${esc(pname('W'))} · Wren</th></tr>
  <tr><td>Máu</td><td>${S.hp.T}/${S.max.T}</td><td>${S.hp.W}/${S.max.W}</td></tr>
  <tr><td>Ô phép / Channel Divinity</td><td>cấp 1: ${S.slots[0]} · cấp 2: ${S.slots[1]} · CD: ${S.cd}</td><td>—</td></tr>
  <tr><td>Cảm hứng Anh hùng</td><td>${S.insp.T ? '★' : '—'}</td><td>${S.insp.W ? '★' : '—'}</td></tr></table>
  <p><b>Vật phẩm:</b> ${it.length ? it.join(', ') : '—'}</p><p><b>Lựa chọn:</b> ${ch.length ? ch.join(' · ') : '—'}</p>`;
}
async function savePoint() {
  return new Promise(res => {
    persist();
    const o = overlay(`<div class="big">Điểm lưu · cuối Chương Một</div><h1>Nghỉ một chút?</h1><div class="note" style="text-align:left;margin:10px 0">${summaryHtml()}</div>
      <label class="f" for="mem">Một câu bắt đầu bằng "Đêm nay chúng ta sẽ nhớ..." (hai bạn sẽ đọc to khi chơi tiếp)</label><textarea id="mem" rows="3" placeholder="...tiếng chuông lúc ngọn đèn tắt, và bàn tay ai đó nắm lấy mình."></textarea>
      <div class="stack" style="margin-top:12px"><button class="btn pri" id="go">Chơi tiếp Chương Hai ▸</button><button class="btn" id="stop">💾 Dừng ở đây (đã tự lưu)</button></div>`);
    const save = () => { S.memory = $('#mem', o).value.trim(); S.scene = 's5'; persist(); };
    $('#go', o).onclick = () => { sfx.click(); save(); hideOverlay(); res('go'); };
    $('#stop', o).onclick = () => { sfx.click(); save(); hideOverlay(); res('stop'); };
  });
}
async function endScreen(e) {
  clearSave();
  Art.patch({});
  const log = S.log.map(x => `<li>${esc(x)}</li>`).join('');
  const o = overlay(`<div class="big">Hết · ${ENDING_NAMES[e]}</div><h1>Cảm ơn hai bạn</h1>
    <div class="read" style="text-align:left;margin:10px 0">Chuyến vượt hồ nào cũng chỉ có một lần. Hồ sẽ nhớ hai bạn, và hai bạn sẽ nhớ nhau.</div>
    <div class="note" style="text-align:left;max-height:30dvh;overflow:auto"><b>Hành trình của hai bạn</b><ul class="bul">${log || '<li>—</li>'}</ul><p><b>Đèn lồng đã thắp:</b> ${S.lanterns}</p></div>
    <div class="stack" style="margin-top:12px"><button class="btn pri" id="again">Chơi lại từ đầu</button><button class="btn" id="home">Về màn hình chính</button></div>`);
  await new Promise(r => { $('#again', o).onclick = () => { hideOverlay(); S = newState(); r(); setupScreen(); }; $('#home', o).onclick = () => { hideOverlay(); r(); showTitle(); }; });
}

/* ---------- điều khiển cảnh ---------- */
async function runScene(id) {
  const sc = SCENES[id];
  if (id === 's5') {
    if (!S.f.ch1done) { S.f.ch1done = true; const c = await savePoint(); if (c === 'stop') { showTitle(); return '__title'; } }
    S.scene = id; persist(); await chapterIntro(2);
  }
  for (const w of ['T', 'W']) if (S.hp[w] <= 0) { S.hp[w] = 1; toast(`${CH[w]} tỉnh lại với 1 Điểm máu`); }
  S.scene = id; S.reader = sc.reader; persist();
  setTitleMode(false); hud();
  await sceneTransition(sc);
  RT.feed.innerHTML = ''; RT.feed.scrollTop = 0; RT.scrolled = false;
  $('#stageTitle').textContent = `Cảnh ${sc.n} · ${sc.title}`;
  put(blk('', `<h2 class="scn">Cảnh ${sc.n} — ${esc(sc.title)}</h2><div class="sub">${roleLine(sc)}</div>`));
  const blocks = typeof sc.blocks === 'function' ? sc.blocks() : sc.blocks;
  for (const b of blocks) {
    if (b.if && !b.if()) continue;
    const r = await BLK[b.k](b);
    if (r && r.goto) return r.goto;
  }
  return null;
}
async function playFrom(id) {
  if (id === 's1' && !S.f.began) { S.f.began = true; setTitleMode(false); await chapterIntro(1); }
  while (id && id !== '__end' && id !== '__title') id = await runScene(id);
}

/* ---------- màn hình chính / chuẩn bị ---------- */
function showTitle() {
  setTitleMode(true); closeModal(); hideOverlay();
  Art.set('title'); $('#stageTitle').textContent = '';
  const f = RT.feed; f.innerHTML = ''; RT.scrolled = true; f.scrollTop = 0;
  const sv = loadSave(); const sc = sv && SCENES[sv.scene];
  const w = h('div', 'blk', `<div style="text-align:center"><div class="sub" style="letter-spacing:3px;color:#f5c842">DUET EVENINGS · TẬP 1</div>
    <h1 style="font-family:var(--pix);font-size:50px;line-height:.9;margin:6px 0;color:#fff2c4;text-shadow:0 3px 0 #000">The Last<br>Lantern Ferry</h1>
    <div style="font-family:var(--pix);font-size:25px;color:#f5c842">Chuyến Phà Ngọn Đèn Cuối</div>
    <p class="sub" style="margin:6px 0 12px"><i>cuộc phiêu lưu song đấu tương thích 5e dành cho hai người, không cần Quản trò</i><br>2 chương · 3 kết cục · ~45 phút mỗi chương</p></div>`);
  const g = h('div', 'stack'); w.append(g);
  const b0 = h('button', 'btn pri', 'Chơi mới ▸'); g.append(b0);
  if (sc) { const bc = h('button', 'btn', `⏵ Tiếp tục <small>Cảnh ${sc.n} · ${esc(sc.title)} (tự lưu ở đầu mỗi cảnh)</small>`); g.append(bc); bc.onclick = () => { sfx.click(); S = Object.assign(newState(), sv); RT.sound = RT.sound; if (!S.reader) S.reader = sc.reader; playFrom(sv.scene); }; }
  const row = h('div', 'row'); const b1 = h('button', 'btn', '📖 Cách chơi'), b2 = h('button', 'btn', '👥 Nhân vật'); row.append(b1, b2); g.append(row);
  const row2 = h('div', 'row'); const b3 = h('button', 'btn', '🔊 Âm thanh: ' + (RT.sound ? 'BẬT' : 'TẮT')), b4 = h('button', 'btn', 'ℹ Ghi công'); row2.append(b3, b4); g.append(row2);
  b0.onclick = () => { sfx.click(); if (sc && !confirm('Chơi mới sẽ xóa bản lưu cũ. Tiếp tục?')) return; S = newState(); clearSave(); setupScreen(); };
  b1.onclick = () => openModal(RULES + GLOSS); b2.onclick = () => charPicker(); b4.onclick = () => openModal(CREDITS);
  b3.onclick = () => { RT.sound = !RT.sound; try { localStorage.setItem(SKEY, RT.sound ? '1' : '0'); } catch (e) { } b3.innerHTML = '🔊 Âm thanh: ' + (RT.sound ? 'BẬT' : 'TẮT'); sfx.click(); };
  w.append(h('p', 'sub', '<br><center>MeoHoangStudio · bản tiếng Việt, chia sẻ miễn phí · hai người, một điện thoại, một tách trà ấm.</center>'));
  f.append(w);
}
function charPicker() {
  const m = openModal('<h2>Nhân vật</h2><div class="stack"><button class="btn" id="cT">Tamsin Ashgrove <small>Giáo sĩ Người lùn, Miền Sự Sống, Cấp 3 · Người chơi 1</small></button><button class="btn" id="cW">Wren Tallowmere <small>Đạo tặc Halfling, Kẻ Trộm, Cấp 3 · Người chơi 2</small></button></div>');
  $('#cT', m).onclick = () => sheetModal('T'); $('#cW', m).onclick = () => sheetModal('W');
}
function sheetModal(w) {
  const sk = SKILLS[w].map(([n, v, p]) => `<td>${n}${p ? '*' : ''}</td><td><b>${fmt(v)}</b></td>`);
  let rows = ''; for (let i = 0; i < sk.length; i += 2) rows += `<tr>${sk[i]}${sk[i + 1] || '<td></td><td></td>'}</tr>`;
  let st = '';
  if (S.scene || w) st = `<p>❤ <b>${S.hp[w]}/${S.max[w]}</b> ${S.insp[w] ? '· <span style="color:#f5c842">★ Cảm hứng Anh hùng</span>' : ''}${w === 'T' ? ` <br>Ô phép: cấp 1 <span class="slots">${'◆'.repeat(S.slots[0]) + '◇'.repeat(4 - S.slots[0])}</span> · cấp 2 <span class="slots">${'◆'.repeat(S.slots[1]) + '◇'.repeat(2 - S.slots[1])}</span> · Channel Divinity ${S.cd}/2` : ''}</p>`;
  openModal(`<h2>${CH[w] === 'Tamsin' ? 'Tamsin Ashgrove' : 'Wren Tallowmere'}</h2><div class="sub">${w === 'T' ? 'Giáo sĩ (Cleric) Người lùn · Miền Sự Sống · Cấp 3' : 'Đạo tặc (Rogue) Halfling · Kẻ Trộm · Cấp 3'}</div>${st}${SHEETS[w]}<h3>Kỹ năng <small class="sub" style="font-family:system-ui;font-size:12px">(* = thành thạo)</small></h3><table class="t">${rows}</table>`);
}
function bagModal() {
  const L = [];
  if (S.inv.potion) L.push(`<div class="card"><h4>🧪 Potion of Healing ×${S.inv.potion}</h4><div class="d">Hành động phụ: hồi 2d4+2 Điểm máu.</div><div class="row" id="pot"></div></div>`);
  if (S.inv.tin) L.push('<div class="card"><h4>🕯 Hộp thiếc bấc đèn</h4><div class="d">Quà của Marl.</div></div>');
  if (S.inv.whistle) L.push('<div class="card"><h4>🎵 Chiếc còi đèn</h4><div class="d">Nếu thổi tại Mist Isle, Bóng Vọng sẽ đáp lại từ rất xa.</div></div>');
  if (S.inv.fireflies) L.push('<div class="card"><h4>✨ Lọ đom đóm</h4><div class="d">Sáng như đèn lồng cho tới sáng.</div></div>');
  if (S.inv.journal) L.push('<div class="card"><h4>📓 Nhật ký phà</h4><div class="d"><i>"Mist Isle, ngọn đèn thứ ba tính từ bãi lau."</i> (hỏi Fen thêm câu ở Cảnh 6)</div></div>');
  const fl = [S.f.orrinTip && 'mẹo của Orrin (Lợi thế "Đọc dòng nước")', S.f.trail && 'THEO DẤU (Lợi thế lần tung đầu Cảnh 5)', S.f.hold && 'GIỮ HƯỚNG', S.lanterns && `${S.lanterns} đèn lồng đã thắp`].filter(Boolean);
  if (fl.length) L.push(`<div class="card"><h4>📌 Ghi nhớ</h4><div class="d">${fl.join('<br>')}</div></div>`);
  const m = openModal('<h2>Túi đồ</h2>' + (L.join('') || '<p class="sub">Chưa có gì. Hai bạn mới nhổ neo thôi.</p>'));
  const pot = $('#pot', m);
  if (pot) ['T', 'W'].forEach(w => {
    const b = h('button', 'btn', `Cho ${CH[w]} uống <small>${S.hp[w]}/${S.max[w]}</small>`); if (RT.combat) b.disabled = true; pot.append(b);
    b.onclick = () => { const a = rollN(2, 4), n = sum(a) + 2; S.inv.potion--; const g = heal(w, n); sfx.heal(); toast(`${CH[w]} hồi ${g} Điểm máu (2d4+2 = ${n})`); closeModal(); };
  });
  if (RT.combat) $('.sheet', $('#modal')).append(h('p', 'sub', 'Đang giao tranh: hãy uống thuốc trong lượt của bạn.'));
}
function menuModal() {
  const m = openModal(`<h2>Menu</h2><div class="stack">
    <button class="btn" id="m1">📖 Cách chơi & thuật ngữ</button><button class="btn" id="m2">👥 Nhân vật</button><button class="btn" id="m3">🔊 Âm thanh: ${RT.sound ? 'BẬT' : 'TẮT'}</button>
    <button class="btn" id="m4">ℹ Ghi công & Công khai AI</button><button class="btn" id="m5">🏠 Về màn hình chính <small>(tiến trình tự lưu ở đầu mỗi cảnh; thoát giữa cảnh sẽ chơi lại cảnh đó)</small></button></div>`);
  $('#m1', m).onclick = () => openModal(RULES + GLOSS); $('#m2', m).onclick = () => charPicker(); $('#m4', m).onclick = () => openModal(CREDITS);
  $('#m3', m).onclick = () => { RT.sound = !RT.sound; try { localStorage.setItem(SKEY, RT.sound ? '1' : '0'); } catch (e) { } menuModal(); };
  $('#m5', m).onclick = () => { if (confirm('Về màn hình chính? Cảnh hiện tại sẽ chơi lại từ đầu khi tiếp tục.')) location.reload(); };
}

function setupScreen() {
  setTitleMode(false); $('#topbar').hidden = true;
  Art.set('title'); $('#stageTitle').textContent = '';
  const f = RT.feed; f.innerHTML = ''; RT.scrolled = true; f.scrollTop = 0;
  const w = h('div', 'blk');
  w.innerHTML = `<h2 class="scn">Trước khi nhổ neo</h2>
  <p>Hai bạn là hai lữ khách trên chuyến phà cuối cùng của đêm, và đêm nay, ngọn đèn giữ bình yên cho cả mặt hồ sắp biến mất. Phần còn lại, hai bạn sẽ cùng nhau khám phá.</p>
  <div class="note"><b>Hai bạn cần có:</b> một điện thoại, và nơi ngồi ấm áp. Có trà càng đúng điệu. <b>Không cần xúc xắc thật:</b> game tung giúp. Một người <b>đọc to</b>, người kia <b>bấm nút</b>; hai bạn đổi vai ở mỗi cảnh.</div>
  <h3>Chọn nhân vật</h3>
  <p><b>Người chơi 1</b> vào vai <b>Tamsin Ashgrove</b>, nữ Giáo sĩ người lùn giữ Ngọn Đèn Cuối. <b>Người chơi 2</b> vào vai <b>Wren Tallowmere</b>, Đạo tặc Halfling lái chiếc phà <i>Marigold</i>.</p>
  <label class="f">Tên Người chơi 1 (Tamsin), không bắt buộc</label><input type="text" id="n1" maxlength="20" placeholder="Người chơi 1">
  <label class="f">Tên Người chơi 2 (Wren), không bắt buộc</label><input type="text" id="n2" maxlength="20" placeholder="Người chơi 2">
  <h3 style="margin-top:14px">Tamsin và Wren là gì của nhau?</h3><p class="sub">Tung một d6 hoặc cứ chọn thẳng. Hãy nói to lên, rồi thêm một chi tiết nhỏ chỉ hai bạn mới biết.</p>
  <div id="rel"></div>
  <details class="note" style="margin:12px 0"><summary><b>Hồ và những người nơi đây</b></summary><br>
  <p><b>Lake Hushmere</b> dài, nông và lúc nào cũng mờ sương. Chẳng ai nhớ nổi lúc nào hồ trong vắt. Sương không hề thù địch; nó làm tiếng bước chân nhỏ lại và khiến mọi ngọn đèn trông như một mặt trời bé xíu.</p>
  <p><b>Chiếc Marigold</b> là một chiếc phà đáy phẳng, đủ rộng cho một chiếc xe kéo và chục hành khách. Phà có Phòng lái (Wheelhouse) với chiếc vô-lăng đồng thau mòn nhẵn bởi bàn tay bao thập kỷ, những chiếc ghế dài dưới ngọn đèn dầu, một chiếc chuông tàu, và một Xuồng cứu sinh (Lifeboat) treo trên giá cẩu ở đuôi.</p>
  <p><b>Ngọn Đèn Cuối (Last Lantern)</b> là một ngọn đèn đồng thau với ngọn lửa màu mật ong ấm. Nơi nào đèn chiếu tới, sương rẽ ra thành một con đường yên tĩnh, như thể hồ đang giữ cửa mở cho bạn. Đèn treo trên Cột đèn, và những người gác đèn đã chăm sóc nó lâu như thị trấn này có tên. Tamsin là người gác mới nhất và cô ấy hơi nghiêm túc quá mức với công việc.</p>
  <p><b>Mist Isle</b> là một hòn đảo nhỏ giữa hồ, không có trên bất kỳ bản đồ nào. Lữ khách kể rằng chỉ tìm thấy đảo nếu bạn đang mang theo ngọn lửa, hoặc đang lạc đường, hoặc cả hai.</p>
  <p><b>Không khí.</b> Hãy chơi thật nhẹ nhàng. Bí ẩn ở đây hiền lành, những điều đặt cược thì dịu dàng, và mọi nhân vật, kể cả những người trông đáng sợ, đều có lý do của mình. Nếu không biết nói gì, hãy tự hỏi điều gì sẽ là tử tế.</p></details>`;
  f.append(w);
  const relBox = $('#rel', w);
  const go = h('button', 'btn pri', 'Nhổ neo ▸'); go.disabled = true;
  const setRel = n => { S.rel = n; relBox.innerHTML = `<div class="res info"><span class="badge">${n + 1}</span>Tamsin và Wren là: <b>${esc(REL[n])}.</b></div>`; go.disabled = false; };
  const rr = h('div', 'row'); const rb = h('button', 'btn', '🎲 Tung d6'); rr.append(rb); relBox.append(rr);
  const dd = h('div', 'dice'); relBox.append(dd);
  rb.onclick = async () => { rb.disabled = true; sfx.click(); const n = rnd(6); await animDice(diceEls(dd, 1, true), [n]); setRel(n - 1); dd.remove(); };
  const sel = h('select'); sel.style.cssText = 'width:100%;margin-top:8px;padding:10px;background:#05071a;color:#eef1ff;border:2px solid #33418c;border-radius:8px;font:inherit';
  sel.innerHTML = '<option value="">…hoặc chọn thẳng</option>' + REL.map((t, i) => `<option value="${i}">${i + 1}. ${esc(t)}</option>`).join(''); sel.onchange = () => { if (sel.value !== '') { setRel(+sel.value); rb.disabled = true; } }; relBox.append(sel);
  const row = h('div', 'stack'); row.style.marginTop = '10px'; row.append(go); const back = h('button', 'btn ghost', '← Quay lại'); row.append(back); w.append(row);
  back.onclick = showTitle;
  go.onclick = () => { S.names.T = $('#n1', w).value.trim(); S.names.W = $('#n2', w).value.trim(); sfx.click(); S.scene = 's1'; persist(); hud(); playFrom('s1'); };
}
function mainFlow(restart) { if (restart) { S = newState(); } showTitle(); }

/* ---------- khởi động ---------- */
window.addEventListener('DOMContentLoaded', () => {
  RT.feed = $('#feed'); Art.init($('#art'));
  $('#chipT').onclick = () => sheetModal('T'); $('#chipW').onclick = () => sheetModal('W');
  $('#btnBag').onclick = bagModal; $('#btnMenu').onclick = menuModal;
  RT.feed.addEventListener('scroll', updateDown);
  window.addEventListener('resize', updateDown);
  showTitle();
});
