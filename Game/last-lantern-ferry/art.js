/* Pixel-art renderer: every scene is drawn procedurally on a 240x108 canvas. */
const Art = (function () {
  const W = 240, H = 108;
  let cv, cx, T = 0, scene = 'title', P = {}, running = false, last = 0;

  /* ---------- helpers ---------- */
  const rect = (x, y, w, h, c) => { cx.fillStyle = c; cx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const hex = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  const lcg = s => () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  function grad(y0, y1, c0, c1, step = 3) { for (let y = y0; y < y1; y += step) rect(0, y, W, step, mix(c0, c1, (y - y0) / Math.max(1, y1 - y0))); }
  const STARS = (() => { const r = lcg(7); return Array.from({ length: 80 }, () => ({ x: r() * W | 0, y: r() * 58 | 0, p: r() * 6.28, b: r() })); })();
  function stars(maxY = 58, a = 1) {
    for (const s of STARS) {
      if (s.y > maxY) continue;
      const tw = (Math.sin(T * 2 + s.p) + 1) / 2;
      cx.globalAlpha = a * (0.3 + 0.7 * tw);
      const big = s.b > 0.92;
      rect(s.x, s.y, big ? 2 : 1, big ? 2 : 1, '#fff6d6');
    }
    cx.globalAlpha = 1;
  }
  function glow(x, y, r, col, a = 0.1) {
    cx.fillStyle = col;
    for (let i = 5; i >= 1; i--) { cx.globalAlpha = a; cx.beginPath(); cx.arc(x, y, r * i / 5, 0, 6.283); cx.fill(); }
    cx.globalAlpha = 1;
  }
  function fog(y, h, a = 0.22, speed = 4, col = '#aabde6') {
    cx.fillStyle = col;
    for (let yy = 0; yy < h; yy += 2) {
      const off = (T * speed * (1 + (yy % 6) * 0.25)) | 0;
      for (let x = -(off % 8) - 8; x < W; x += 4) {
        if ((((x + off) >> 2) + (yy >> 1)) % 2 === 0) {
          cx.globalAlpha = a * (0.45 + 0.55 * Math.sin((x + T * 12) / 26 + yy * 0.7));
          if (cx.globalAlpha > 0.01) cx.fillRect(x, y + yy, 4, 2);
        }
      }
    }
    cx.globalAlpha = 1;
  }
  function water(y, c0, c1) {
    grad(y, H, c0, c1, 2);
    const r = lcg(3);
    for (let i = 0; i < 46; i++) {
      const x = (r() * W + T * (2 + i % 3)) % W, yy = y + 3 + ((r() * (H - y - 4)) | 0);
      cx.globalAlpha = 0.22; rect(x, yy, 5 + (i % 4) * 3, 1, '#b4c8ff');
    }
    cx.globalAlpha = 1;
  }
  function reflect(x, y, len, col, w = 10) {
    for (let i = 0; i < len; i += 3) {
      const ww = Math.max(2, w - i * 0.15 + Math.sin(T * 3 + i) * 2);
      cx.globalAlpha = 0.35 * (1 - i / len);
      rect(x - ww / 2, y + i, ww, 1.5, col);
    }
    cx.globalAlpha = 1;
  }
  const flick = (s = 1) => 0.85 + 0.15 * Math.sin(T * 9 * s) * Math.sin(T * 3.7 * s + 1);

  /* ---------- sprites ---------- */
  const PAL = {
    k: '#1a1220', s: '#e6b08a', S: '#c48a66', h: '#c8651b', H: '#8f4410', a: '#aab2c6', A: '#6d7690', g: '#f5c842',
    r: '#b23a50', R: '#6e2030', b: '#5b3a29', w: '#f4f0e6', e: '#1a1220', l: '#8a5a34', L: '#4e7a4a', M: '#386a3a', f: '#f2a900',
    o: '#7a4a2a', c: '#c7f1ff', C: '#6fb7d6', y: '#ffe58a', n: '#c9ffe6', N: '#4fe0a8', p: '#6a5aa8', d: '#9b8cd8', z: '#3b4468', t: '#d8d0c0'
  };
  const SPR = {
    tamsin: ['...kkkkkk...', '..kaaaaaak..', '.kaaAaaAaak.', '.kaaaaaaaak.', '.kssssssssk.', '.ksessssesk.', '.khhsssshhk.', '.khhhhhhhhk.', 'kkhhhhhhhhkk', '.kaahhhhaak.', 'klllaggaaak.', 'klllaaaaaAk.', 'klllaaaaaaak', '.kkkaaaaakk.', '..kbbkkbbk..', '..kbbk.kbbk.'],
    wren: ['....kffk....', '...kLLLLk...', '..kLLLLLLk..', '.kLLLLLLLLk.', '..kkkkkkkk..', '..koooooook.', '..kseoosesk.', '..kssssssk..', '...kssssk...', '..kllllllk..', '.kklllllllkk', '.kslllllllsk', '..kllkkllk..', '..kLLkkLLk..', '..kbbk.kbbk.', '..kbbk.kbbk.'],
    specter: ['....cccc......', '...cccccc.....', '..cceccecc....', '..cccccccc....', '..ccCooCcc....', '...cccccc.....', '..CccccccC....', '.CCcccccccC...', '.CccccyccccC..', '.CcccyyyccCC..', '..CccyyyccC...', '..Cccccccc....', '...Ccccccc....', '...CcCcCcC....', '....C.C.C.....'],
    fen: ['...nnnn...', '..nnnnnn..', '.nnennenn.', '.nnnnnnnn.', '.nnnNNnnn.', '..nnnnnn..', '...nNNn...', '....nn....'],
    bat1: ['k.......k', 'kk.....kk', 'kkk.k.kkk', '.kkkkkkk.', '..kkkkk..'],
    bat2: ['.........', '..k...k..', '.kkk.kkk.', 'kkkkkkkkk', '..kkkkk..'],
    lamp: ['.k.', 'kyk', 'kyk', '.k.']
  };
  const sprCache = {};
  function spr(name, x, y, s = 2, opt = {}) {
    const g = SPR[name]; if (!g) return;
    const key = name + (opt.pal ? JSON.stringify(opt.pal) : '');
    let c = sprCache[key];
    if (!c) {
      const pal = Object.assign({}, PAL, opt.pal || {});
      const w = Math.max(...g.map(r => r.length)), h = g.length;
      c = document.createElement('canvas'); c.width = w; c.height = h; const k = c.getContext('2d');
      g.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.' && pal[ch]) { k.fillStyle = pal[ch]; k.fillRect(i, j, 1, 1); } }));
      sprCache[key] = c;
    }
    cx.save();
    if (opt.alpha != null) cx.globalAlpha = opt.alpha;
    cx.imageSmoothingEnabled = false;
    if (opt.flip) { cx.translate(Math.round(x) + c.width * s, Math.round(y)); cx.scale(-1, 1); cx.drawImage(c, 0, 0, c.width * s, c.height * s); }
    else cx.drawImage(c, Math.round(x), Math.round(y), c.width * s, c.height * s);
    cx.restore();
  }
  // generic person made of rects (NPCs)
  function person(x, y, coat, hat, s = 1, skin = '#e6b08a') {
    rect(x + 2 * s, y, 4 * s, 3 * s, hat); rect(x + 2 * s, y + 3 * s, 4 * s, 3 * s, skin);
    rect(x + 1 * s, y + 6 * s, 6 * s, 7 * s, coat); rect(x + 2 * s, y + 13 * s, 2 * s, 3 * s, '#2a2030'); rect(x + 4 * s, y + 13 * s, 2 * s, 3 * s, '#2a2030');
    rect(x + 3 * s, y + 4 * s, 1 * s, 1 * s, '#1a1220'); rect(x + 5 * s, y + 4 * s, 1 * s, 1 * s, '#1a1220');
  }
  function heroes(xT, xW, y, opt = {}) {
    const bob = Math.round(Math.sin(T * 2) * 0.6);
    if (xT != null) spr('tamsin', xT, y + bob, 2, { flip: opt.flipT });
    if (xW != null) spr('wren', xW, y - Math.round(Math.sin(T * 2 + 1) * 0.6) + 2, 2, { flip: opt.flipW });
  }
  function hanging(x, y, a = 1) { // hanging lantern with glow
    rect(x, y - 6, 1, 4, '#222'); rect(x - 1, y - 2, 3, 1, '#333');
    glow(x + 0.5, y + 2, 16 * a, '#ffcf6a', 0.07);
    rect(x - 1, y - 1, 3, 5, mix('#b8761a', '#ffe58a', flick())); rect(x - 2, y - 1, 5, 1, '#222'); rect(x - 2, y + 4, 5, 1, '#222');
  }
  function ferry(x, y, lit = 1) {
    rect(x, y, 78, 4, '#0a0e22'); rect(x + 4, y + 4, 70, 3, '#0a0e22'); rect(x + 9, y + 7, 60, 3, '#0a0e22'); rect(x + 14, y + 10, 50, 2, '#0a0e22');
    rect(x - 6, y - 2, 6, 3, '#0a0e22'); rect(x + 78, y - 2, 6, 3, '#0a0e22');
    rect(x + 14, y - 14, 36, 14, '#0d1330'); rect(x + 12, y - 17, 40, 3, '#0a0e22'); rect(x + 22, y - 24, 20, 7, '#0d1330'); rect(x + 20, y - 26, 24, 2, '#0a0e22');
    rect(x + 31, y - 33, 5, 7, '#0a0e22'); rect(x + 30, y - 34, 7, 1, '#0a0e22');
    for (let i = 0; i < 5; i++) { cx.globalAlpha = lit * (0.7 + 0.3 * Math.sin(T * 2 + i)); rect(x + 17 + i * 6, y - 10, 3, 4, '#f5c842'); }
    for (let i = 0; i < 3; i++) rect(x + 25 + i * 5, y - 22, 3, 3, '#f5c842');
    cx.globalAlpha = 1;
    rect(x + 62, y - 30, 2, 30, '#0a0e22'); rect(x + 56, y - 30, 10, 2, '#0a0e22');
    if (lit > 0) { glow(x + 58, y - 24, 34 * lit, '#ffcf6a', 0.06); rect(x + 57, y - 28, 3, 5, mix('#c98a24', '#ffe58a', flick())); }
  }
  function island(x, y, w, h, col) { for (let i = 0; i < h; i++) { const ww = w * (0.55 + 0.45 * i / h); rect(x + (w - ww) / 2, y + i, ww, 1, col); } }
  function birch(x, y, h, s = 1) { rect(x, y, 2 * s, h, '#e4e4ee'); for (let i = 3; i < h; i += 6) rect(x, y + i, 2 * s, 1, '#3a3d55'); rect(x - 4 * s, y - 6 * s, 10 * s, 8 * s, '#2f4a45'); rect(x - 2 * s, y - 10 * s, 6 * s, 6 * s, '#3a5a52'); }
  function wisp(x, y, a = 1, s = 1) { glow(x, y, 7 * s, '#7fffd0', 0.12 * a); cx.globalAlpha = a; rect(x - s, y - s, 2 * s, 2 * s, '#d8fff0'); cx.globalAlpha = 1; }

  /* ---------- scene painters ---------- */
  const scenes = {
    title() {
      grad(0, 62, '#060a22', '#1f2d68'); stars(60);
      glow(190, 22, 22, '#fff2c4', 0.05); rect(186, 18, 9, 9, '#fff6d6'); rect(188, 16, 5, 1, '#fff6d6');
      island(-20, 54, 90, 10, '#0a0f26'); island(180, 56, 90, 8, '#0a0f26');
      water(62, '#1c2a63', '#070a22');
      ferry(78, 56, 1); reflect(139, 64, 40, '#ffcf6a', 14);
      fog(52, 24, 0.2, 3); fog(78, 20, 0.15, 5);
    },
    dock() {
      grad(0, 52, '#0a0f2e', '#3b3068'); stars(40);
      rect(0, 50, W, 4, '#6a4a6e'); rect(0, 54, W, 2, '#4c3a66');
      for (let i = 0; i < 9; i++) rect(8 + i * 26, 46, 2, 4, '#f5c842');
      water(52, '#2a2c64', '#0a0e2a');
      ferry(120, 62, 1); reflect(180, 66, 30, '#ffcf6a', 12);
      // boathouse + booth silhouettes
      rect(6, 28, 46, 24, '#0c1030'); rect(2, 24, 54, 6, '#090c26'); rect(14, 36, 8, 8, mix('#8a6a1a', '#f5c842', flick(0.7)));
      rect(60, 38, 22, 14, '#0c1030'); rect(58, 35, 26, 4, '#090c26');
      // pier planks
      rect(0, 70, W, 38, '#4a3326');
      for (let y = 70; y < H; y += 6) rect(0, y, W, 1, '#2f1f16');
      for (let x = 0; x < W; x += 18) rect(x + ((x / 18) % 2) * 6, 70, 1, 38, '#2f1f16');
      rect(0, 68, W, 3, '#6a4a34');
      // lamp posts
      for (const lx of [24, 100]) { rect(lx, 38, 3, 34, '#15101e'); rect(lx - 6, 38, 12, 2, '#15101e'); hanging(lx - 5, 42); }
      // Hettie's cart
      rect(150, 74, 22, 8, '#6a3a2a'); rect(152, 72, 18, 3, '#e8d2a0'); rect(154, 82, 4, 4, '#222'); rect(166, 82, 4, 4, '#222');
      person(174, 66, '#c6567a', '#e0e0e0', 1);
      heroes(40, 70, 70);
      fog(60, 16, 0.12, 3);
    },
    deck() {
      grad(0, 60, '#070a22', '#1b2658'); stars(40, P.lamp === false ? 1 : 0.4);
      fog(30, 40, 0.18, 4);
      water(66, '#18214f', '#070920');
      // deck + railing
      rect(0, 66, W, 4, '#2a1c14'); for (let x = 0; x < W; x += 12) rect(x, 56, 2, 12, '#2a1c14'); rect(0, 56, W, 2, '#3a281c');
      rect(0, 70, W, 38, '#4a3326'); for (let y = 70; y < H; y += 7) rect(0, y, W, 1, '#2d1d14'); for (let x = 0; x < W; x += 22) rect(x + ((x / 22) % 2) * 9, 70, 1, 38, '#2d1d14');
      // benches + passengers
      rect(14, 82, 60, 4, '#2a1c14'); rect(166, 82, 60, 4, '#2a1c14');
      person(22, 66, '#8a8aa0', '#d8d8e8', 1.3); person(40, 66, '#c0885a', '#5a3a2a', 1); person(50, 69, '#5a8aa0', '#5a3a2a', 1);
      person(178, 66, '#3a4a6a', '#e8c040', 1.2); person(200, 66, '#4a4a58', '#2a2a36', 1.3);
      // mast
      rect(118, 6, 4, 76, '#2a1c14'); rect(100, 8, 22, 3, '#2a1c14');
      if (P.lamp !== false) { glow(103, 18, 46, '#ffcf6a', 0.07); rect(101, 12, 4, 7, mix('#c98a24', '#ffe58a', flick())); rect(100, 11, 6, 1, '#222'); rect(100, 19, 6, 1, '#222'); }
      else { for (let i = 0; i < 12; i++) wisp(110 + i * 9 + Math.sin(T * 2 + i) * 3, 40 - i * 1.5 + Math.sin(T * 3 + i * 2) * 2, 0.9); }
      heroes(96, 134, 74);
    },
    wheelhouse() {
      grad(0, H, '#101a38', '#070c1c');
      for (let x = 0; x < W; x += 20) rect(x, 0, 1, H, '#0b1228');
      for (const wx of [16, 96, 176]) { rect(wx, 14, 48, 30, '#050818'); rect(wx + 2, 16, 44, 26, '#1b2650'); fog(16, 26, 0.35, 3); rect(wx, 14, 48, 2, '#2a3a6a'); rect(wx + 23, 14, 2, 30, '#2a3a6a'); }
      // brass items and wheel
      rect(0, 78, W, 30, '#2a1c14'); rect(0, 78, W, 2, '#6a4a34');
      cx.strokeStyle = '#b8861a'; cx.lineWidth = 2; cx.beginPath(); cx.arc(206, 62, 14, 0, 6.28); cx.stroke();
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + T * 0.1; cx.beginPath(); cx.moveTo(206, 62); cx.lineTo(206 + Math.cos(a) * 18, 62 + Math.sin(a) * 18); cx.stroke(); }
      rect(18, 56, 30, 22, '#3a2a1c'); rect(20, 58, 26, 18, '#d8cfb0'); rect(24, 62, 18, 1, '#6a5a3a'); rect(24, 66, 12, 1, '#6a5a3a');
      for (let i = 0; i < 4; i++) { rect(70 + i * 12, 66, 6, 12, '#7ab0d0'); rect(70 + i * 12, 64, 6, 2, '#b8861a'); }
      if (P.ghost !== false) {
        const gy = 28 + Math.sin(T * 1.5) * 3;
        glow(120, gy + 18, 34, '#8fe3ff', 0.05);
        spr('specter', 100, gy, 3, { alpha: 0.78 });
      }
      if (P.bats !== false) for (let i = 0; i < 4; i++) { const bx = 40 + i * 45 + Math.sin(T * 1.3 + i) * 14, by = 10 + Math.cos(T * 2 + i * 2) * 6 + i * 3; spr(Math.floor(T * 6 + i) % 2 ? 'bat1' : 'bat2', bx, by, 2); }
      heroes(40, 178, 70);
    },
    stern() {
      grad(0, 54, '#050820', '#16224e'); stars(50);
      for (let i = 0; i < 3; i++) { const x = 130 + i * 28, y = 46 + Math.sin(T * 1.2 + i) * 2; glow(x, y, 10, '#d8e8ff', 0.1); rect(x - 1, y - 1, 3, 3, '#f0f6ff'); }
      water(54, '#142048', '#050718');
      // ferry stern
      rect(0, 18, 48, 60, '#0a0e22'); rect(44, 14, 4, 64, '#0d1330'); rect(0, 14, 52, 4, '#15101e');
      rect(34, 20, 2, 32, '#2a1c14'); rect(34, 20, 24, 2, '#2a1c14'); rect(56, 22, 1, 12, '#555');
      for (let i = 0; i < 4; i++) rect(8 + i * 8, 30, 4, 5, mix('#6a5a1a', '#f5c842', 0.5 + 0.5 * Math.sin(T + i)));
      // lifeboat
      const by = 64 + Math.sin(T * 1.3) * 1.5;
      rect(76, by, 92, 6, '#5a3a24'); rect(80, by + 6, 84, 4, '#4a2e1c'); rect(86, by + 10, 72, 3, '#3a2416'); rect(72, by - 3, 8, 4, '#5a3a24'); rect(164, by - 3, 8, 4, '#5a3a24');
      rect(76, by, 92, 1, '#8a5a34');
      heroes(96, 126, by - 30);
      // blue lantern
      glow(150, by - 8, 28, '#7fffd8', 0.07); rect(148, by - 14, 5, 7, mix('#2a8a7a', '#bfffe8', flick())); rect(147, by - 15, 7, 1, '#222'); rect(147, by - 7, 7, 1, '#222');
      reflect(150, by + 14, 20, '#7fffd8', 10);
      fog(56, 24, 0.2, 3);
    },
    reeds() {
      grad(0, 58, '#060a22', '#1a2a50'); stars(50, 0.6);
      water(58, '#17254a', '#060820');
      const sway = x => Math.sin(T * 1.2 + x * 0.3) * 1.5;
      const r = lcg(11);
      for (let i = 0; i < 40; i++) { const x = r() * W, h = 30 + r() * 30; for (let j = 0; j < h; j += 3) rect(x + sway(x) * j / h * 2, 66 - j, 2, 3, '#2a4a3a'); }
      fog(46, 30, 0.16, 3);
      // boat + beam
      const by = 74 + Math.sin(T * 1.3);
      cx.globalAlpha = 0.18; cx.fillStyle = '#ffe08a'; cx.beginPath(); cx.moveTo(150, by - 8); cx.lineTo(240, by - 30); cx.lineTo(240, by + 20); cx.fill(); cx.globalAlpha = 1;
      rect(84, by, 80, 6, '#5a3a24'); rect(88, by + 6, 72, 4, '#4a2e1c'); rect(80, by - 3, 8, 4, '#5a3a24'); rect(160, by - 3, 8, 4, '#5a3a24');
      heroes(102, 132, by - 30); glow(152, by - 8, 18, '#ffcf6a', 0.08); rect(150, by - 14, 5, 7, mix('#c98a24', '#ffe58a', flick())); rect(149, by - 15, 7, 1, '#222');
      const r2 = lcg(5);
      for (let i = 0; i < 9; i++) wisp(r2() * W + Math.sin(T + i) * 6, 48 + r2() * 30 + Math.cos(T * 1.3 + i) * 4, 0.7);
      const r3 = lcg(21);
      for (let i = 0; i < 26; i++) { const x = r3() * W, h = 34 + r3() * 40; for (let j = 0; j < h; j += 3) rect(x + sway(x) * j / h * 3, 108 - j, 3, 3, '#1c3a2c'); }
    },
    stones() {
      const lit = P.lit || 0;
      grad(0, 60, '#070b26', '#1f2f62'); stars(40, 0.8);
      // island ground
      rect(0, 70, W, 38, '#16302e'); rect(0, 70, W, 2, '#2a5a4a');
      const r = lcg(31); for (let i = 0; i < 60; i++) rect(r() * W, 72 + r() * 34, 2, 1, '#2f5a4a');
      // birch grove
      for (let i = 0; i < 9; i++) birch(6 + i * 28 + (i % 2) * 8, 34 + (i % 3) * 4, 40 - (i % 3) * 4, 1);
      // stone gateways with lanterns
      for (let i = 0; i < 5; i++) {
        const x = 18 + i * 46, y = 44 + (i % 2) * 6;
        rect(x, y, 4, 28, '#5a6280'); rect(x + 22, y, 4, 28, '#5a6280'); rect(x - 2, y - 4, 30, 5, '#6b7390'); rect(x + 5, y + 2, 16, 2, '#3a4060');
        for (let j = 0; j < 6; j++) { const lx = x + 6 + j * 3, on = lit > (i * 6 + j) / 3; if (on) { glow(lx, y + 9, 5, '#ffd46a', 0.18); rect(lx, y + 6, 2, 4, '#ffe58a'); } else rect(lx, y + 6, 2, 4, '#3a5a6a'); }
      }
      // basin
      rect(92, 72, 56, 10, '#6b7390'); rect(94, 70, 52, 4, '#8a93b0'); rect(98, 74, 44, 5, '#1c2a50');
      if (P.fen !== false) {
        const big = P.fenBig ? 2 : 1, fy = 56 + Math.sin(T * 2) * 2 - (P.fenBig ? 22 : 0);
        glow(120, fy + 6, P.fenBig ? 54 : 30, P.fenBig ? '#d8fff0' : '#7fffd0', P.fenBig ? 0.09 : 0.07);
        spr('fen', 120 - 5 * 2 * big, fy - (big > 1 ? 6 : 0), 2 * big);
      }
      heroes(44, 200, 74);
      fog(74, 28, 0.14, 3);
    },
    lake() {
      const m = P.mood || 'night';
      const sky = { night: ['#060a22', '#1f2d68'], dawn: ['#2a3a78', '#f2a6b0'], gold: ['#0a0f30', '#4a3a78'], drift: ['#4a5a98', '#ffc8b0'] }[m] || ['#060a22', '#1f2d68'];
      grad(0, 60, sky[0], sky[1]); if (m !== 'dawn' && m !== 'drift') stars(50);
      if (m === 'dawn' || m === 'drift') { glow(150, 58, 40, '#fff0c0', 0.1); rect(142, 52, 16, 8, '#fff0c0'); }
      island(-30, 56, 100, 8, '#0a0f26');
      water(60, m === 'dawn' || m === 'drift' ? '#8a8ac0' : '#1c2a63', m === 'dawn' || m === 'drift' ? '#3a3a78' : '#070a22');
      if (P.ferryLight) { ferry(150, 52, 1); reflect(210, 60, 40, '#ffcf6a', 14); }
      if (P.path) { for (let i = 0; i < 26; i++) { const x = 100 + i * 5, y = 62 + Math.sin(T * 2 + i) * 1.5; wisp(x, y + (i % 3) * 8, 0.8 + 0.2 * Math.sin(T * 3 + i)); } }
      if (P.sparks) { const r = lcg(9); for (let i = 0; i < 34; i++) { const x = (r() * W + T * 6) % W, y = 20 + r() * 50 + Math.sin(T * 2 + i) * 3; wisp(x, y, 0.7); } }
      const by = 78 + Math.sin(T * 1.3);
      rect(78, by, 70, 5, '#5a3a24'); rect(82, by + 5, 62, 3, '#4a2e1c'); rect(74, by - 3, 8, 4, '#5a3a24'); rect(144, by - 3, 8, 4, '#5a3a24');
      heroes(92, 118, by - 28);
      if (P.lamp !== false) { glow(130, by - 8, 18, '#ffcf6a', 0.08); rect(128, by - 14, 5, 7, mix('#c98a24', '#ffe58a', flick())); rect(127, by - 15, 7, 1, '#222'); }
      fog(64, 24, m === 'dawn' ? 0.2 : 0.16, 3, m === 'dawn' ? '#f0d8e8' : '#aabde6');
    },
    void() { grad(0, H, '#060a22', '#10163a'); stars(100); }
  };

  /* ---------- engine ---------- */
  function frame(ts) {
    if (!running) return;
    requestAnimationFrame(frame);
    if (ts - last < 83) return; // ~12 fps, pixel-art cadence
    last = ts; T = ts / 1000;
    if (document.hidden) return;
    cx.imageSmoothingEnabled = false;
    (scenes[scene] || scenes.void)();
  }
  return {
    init(canvas) { cv = canvas; cx = cv.getContext('2d'); cx.imageSmoothingEnabled = false; if (!running) { running = true; requestAnimationFrame(frame); } },
    set(name, params) { scene = name; P = params || {}; },
    patch(params) { Object.assign(P, params); },
    // draw a sprite into a small canvas (combat cards)
    portrait(c, name) {
      const k = c.getContext('2d'); k.imageSmoothingEnabled = false; k.clearRect(0, 0, c.width, c.height);
      const g = SPR[name]; if (!g) return;
      const pal = PAL, w = Math.max(...g.map(r => r.length)), h = g.length, s = Math.max(1, Math.floor(Math.min(c.width / w, c.height / h)));
      const ox = Math.floor((c.width - w * s) / 2), oy = Math.floor((c.height - h * s) / 2);
      g.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.' && pal[ch]) { k.fillStyle = pal[ch]; k.fillRect(ox + i * s, oy + j * s, s, s); } }));
    },
    names: Object.keys(scenes)
  };
})();
