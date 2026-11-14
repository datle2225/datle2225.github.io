import Phaser from 'phaser';
import { W, H } from '../main';
import { game, persist } from '../state';
import { button, label } from '../ui/widgets';
import { questEvent, enterChapter, startableQuests } from '../core/session';
import { questMap, REALMS } from '../core/data';
import { expNeeded } from '../core/progression';

const TS = 32; // 1 ô = 16px art phóng 2x
const HALF = TS / 2;
const MW = 64;
const MH = 40;

interface Npc { id: string; name: string; tex: string; x: number; y: number }
const NPCS: Npc[] = [
  { id: 'lao_ngu', name: 'Lão Ngư', tex: 'npc_elder', x: 14, y: 12 },
  { id: 'ba_ly', name: 'Bà Lý', tex: 'npc_girl', x: 22, y: 20 },
  { id: 'thanh_van_do_tu', name: 'Đệ tử Thanh Vân', tex: 'npc_disciple', x: 54, y: 19 },
];

const ENEMY_SPOTS = [
  { id: 'soi_hoang', tex: 'wolf', x: 30, y: 14 }, { id: 'soi_hoang', tex: 'wolf', x: 34, y: 26 },
  { id: 'soi_hoang', tex: 'wolf', x: 26, y: 30 }, { id: 'yeu_xa', tex: 'snake', x: 40, y: 20 },
  { id: 'yeu_xa', tex: 'snake', x: 44, y: 30 }, { id: 'huyet_anh_do_de', tex: 'cultist', x: 46, y: 10 },
];
const HERBS = [[18, 8], [24, 12], [28, 22], [36, 16], [20, 28], [42, 24], [12, 24]];

export class OverworldScene extends Phaser.Scene {
  private solid = new Set<string>();
  private player!: Phaser.GameObjects.Sprite;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private npcSprites: { npc: Npc; spr: Phaser.GameObjects.Sprite }[] = [];
  private foes: { spot: (typeof ENEMY_SPOTS)[number]; spr: Phaser.GameObjects.Sprite; dead: boolean }[] = [];
  private herbs: { spr: Phaser.GameObjects.Sprite; got: boolean }[] = [];
  private hud!: Phaser.GameObjects.Text;
  private questText!: Phaser.GameObjects.Text;
  private talkBtn?: { destroy(): void };
  private dialog: string[] = [];
  private dialogBox?: Phaser.GameObjects.Container;
  private dialogAfter?: () => void;
  private busy = false;
  private lastAutosave = 0;

  constructor() { super('Overworld'); }

  create() {
    this.solid.clear(); this.npcSprites = []; this.foes = []; this.herbs = [];
    this.buildMap();
    const p = game.p;

    this.player = this.add.sprite(10 * TS + HALF, 10 * TS + HALF, 'player').setScale(2).setDepth(10);
    this.cameras.main.setBounds(0, 0, MW * TS, MH * TS).startFollow(this.player, true, 0.15, 0.15);

    for (const n of NPCS) {
      const spr = this.add.sprite(n.x * TS + HALF, n.y * TS + HALF, n.tex).setScale(2).setDepth(5);
      this.add.text(n.x * TS + HALF, n.y * TS - 4, n.name, { fontFamily: 'monospace', fontSize: '11px', color: '#ffe38a' }).setOrigin(0.5).setDepth(6);
      this.npcSprites.push({ npc: n, spr });
    }
    for (const s of ENEMY_SPOTS) this.foes.push({ spot: s, spr: this.add.sprite(s.x * TS + HALF, s.y * TS + HALF, s.tex).setScale(2).setDepth(5), dead: false });
    for (const [x, y] of HERBS) this.herbs.push({ spr: this.add.sprite(x * TS + HALF, y * TS + HALF, 'herb').setScale(2).setDepth(2), got: false });
    // Boss chỉ xuất hiện khi đã Trúc Cơ
    if (p.realmIndex >= 1) {
      const b = { id: 'boss_huyet_anh_truong_lao', tex: 'elder_boss', x: 50, y: 8 };
      this.foes.push({ spot: b, spr: this.add.sprite(b.x * TS + HALF, b.y * TS + HALF, b.tex).setScale(3).setDepth(5), dead: false });
    }

    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,M,SPACE') as any;
    this.input.keyboard!.on('keydown-M', () => this.openMenu());
    this.input.keyboard!.on('keydown-E', () => this.interact());
    this.input.keyboard!.on('keydown-SPACE', () => this.dialogBox && this.nextLine());

    // HUD (cố định, không zoom): dùng camera riêng cho UI
    this.hud = label(this, 6, 4, '', { fontSize: '10px', backgroundColor: '#0b1020cc', padding: { x: 4, y: 2 } }).setDepth(100);
    this.questText = label(this, 6, 24, '', { fontSize: '9px', color: '#ffe38a', backgroundColor: '#0b1020cc', padding: { x: 4, y: 2 }, wordWrap: { width: 300 } }).setDepth(100);
    button(this, W - 70, 6, 64, 24, 'Menu (M)', () => this.openMenu(), { depth: 100 });
    this.refreshHud();
    this.time.addEvent({ delay: 500, loop: true, callback: () => this.refreshHud() });

    this.events.on('battle-end', (r: { won: boolean; foeIndex: number }) => {
      this.busy = false;
      if (r.won && this.foes[r.foeIndex]) {
        const f = this.foes[r.foeIndex];
        f.dead = true; f.spr.setVisible(false);
        this.time.delayedCall(40000, () => { if (f.spr.scene) { f.dead = false; f.spr.setVisible(true); } });
      }
      this.refreshHud();
    });
    this.events.on('resume', () => this.refreshHud());

    if (!p.flags.intro) {
      p.flags.intro = true;
      this.say(['Thanh Hà thôn, đêm đó lửa cháy ngút trời...', 'Diệp gia, ba mươi sáu mạng người, chỉ còn mình ngươi.', 'Linh căn bị coi là phế vật, nhưng ngươi sống để báo thù.', 'Hãy đến gặp Lão Ngư bên con đường phía nam tàn tích.']);
    }
  }

  private buildMap() {
    const g = (x: number, y: number) => {
      const edge = x < 1 || y < 1 || x >= MW - 1 || y >= MH - 1;
      if (edge) return 'tree';
      // ao nước
      if ((x - 40) ** 2 / 25 + (y - 34) ** 2 / 9 < 1) return 'water';
      // tàn tích Diệp gia
      if (x >= 6 && x <= 12 && y >= 4 && y <= 8) return (x + y) % 5 === 0 ? 'rock' : 'ruin';
      // giếng cổ
      if (x === 10 && y === 14) return 'well';
      // cổng tông môn
      if (x === 56 && y >= 18 && y <= 20) return 'gate';
      // đường
      if (y === 13 || x === 10 || (y === 19 && x > 10) || (x === 30 && y > 13 && y < 30)) return 'path';
      const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      const r = h - Math.floor(h);
      if (r > 0.9) return 'tree';
      if (r > 0.86) return 'rock';
      return 'grass';
    };
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const t = g(x, y);
      this.add.image(x * TS, y * TS, t).setOrigin(0).setScale(2).setDepth(0);
      if (t === 'tree' || t === 'water' || t === 'rock' || t === 'well') this.solid.add(`${x},${y}`);
    }
  }

  private blocked(px: number, py: number) {
    return this.solid.has(`${Math.floor(px / TS)},${Math.floor(py / TS)}`);
  }

  update(_t: number, dt: number) {
    if (this.busy || this.dialogBox) return;
    const k = this.keys;
    let vx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    let vy = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
    const ptr = this.input.activePointer;
    if (!vx && !vy && ptr.isDown && ptr.y > 40) {
      const wp = this.cameras.main.getWorldPoint(ptr.x, ptr.y);
      const dx = wp.x - this.player.x, dy = wp.y - this.player.y;
      if (Math.hypot(dx, dy) > 8) { vx = dx; vy = dy; }
    }
    const len = Math.hypot(vx, vy);
    if (len > 0) {
      const speed = 150 * (dt / 1000);
      const nx = this.player.x + (vx / len) * speed, ny = this.player.y + (vy / len) * speed;
      if (!this.blocked(nx, this.player.y + 8)) this.player.x = nx;
      if (!this.blocked(this.player.x, ny + 8)) this.player.y = ny;
      this.player.setFlipX(vx < 0);
    }
    this.checkWorld(dt);
  }

  private checkWorld(dt: number) {
    const p = game.p;
    p.playtime += dt / 1000;
    this.lastAutosave += dt;
    if (this.lastAutosave > 30000) { this.lastAutosave = 0; persist(); }
    const tx = this.player.x / TS, ty = this.player.y / TS;
    const near = (x: number, y: number, r: number) => Math.hypot(tx - x, ty - y) <= r;

    // điểm đến nhiệm vụ
    if (near(9, 6, 3)) this.reach('diep_gia_tan_tich');
    if (near(10, 14, 2)) this.reach('gieng_co');
    if (near(55, 19, 2)) {
      if (p.quests.done.includes('m1_2') || p.quests.active.includes('m1_3')) this.reach('thanh_van_mon');
      else this.toast('Cổng Thanh Vân Tông đóng chặt. Hãy hoàn thành "Cổ Đỉnh" trước.');
    }

    for (const h of this.herbs) {
      if (!h.got && Math.hypot(h.spr.x - this.player.x, h.spr.y - this.player.y) < 24) {
        h.got = true; h.spr.setVisible(false);
        p.inventory.linh_thao = (p.inventory.linh_thao ?? 0) + 1;
        this.toast('Nhặt được Linh Thảo');
        this.progress(questEvent(p, 'collect', 'linh_thao', 1));
        this.time.delayedCall(30000, () => { h.got = false; h.spr.setVisible(true); });
      }
    }

    this.foes.forEach((f, i) => {
      if (!f.dead && Math.hypot(f.spr.x - this.player.x, f.spr.y - this.player.y) < 26) this.startBattle(i);
    });

    // nút nói chuyện (cho cảm ứng)
    const npc = this.nearestNpc();
    if (npc && !this.talkBtn) this.talkBtn = button(this, W / 2 - 50, H - 40, 100, 28, `Nói chuyện: ${npc.name}`, () => this.interact(), { depth: 100 });
    if (!npc && this.talkBtn) { this.talkBtn.destroy(); this.talkBtn = undefined; }
  }

  private reach(id: string) {
    const done = questEvent(game.p, 'reach', id);
    if (done.length) this.progress(done);
  }

  private nearestNpc(): Npc | null {
    for (const n of this.npcSprites) if (Math.hypot(n.spr.x - this.player.x, n.spr.y - this.player.y) < 52) return n.npc;
    return null;
  }

  private interact() {
    if (this.dialogBox) return this.nextLine();
    const n = this.nearestNpc();
    if (!n) return;
    const p = game.p;
    if (n.id === 'lao_ngu') {
      this.say(['Lão Ngư: Ngươi là con cháu Diệp gia? Còn sống sao...', 'Lão Ngư: Thủ phạm là Huyết Ảnh Môn, nhưng sau lưng chúng còn có người của một tông môn chính đạo.', 'Lão Ngư: Đi xem tàn tích nhà ngươi, rồi xuống giếng cổ phía nam. Cha ngươi để lại thứ gì đó ở đấy.'], () => this.progress(questEvent(p, 'talk', 'lao_ngu')));
    } else if (n.id === 'ba_ly') {
      const q = startableQuests(p).find((x: any) => x.id === 's1_1') ?? null;
      if (q) this.say(['Bà Lý: Đàn gà của lão thân bị sói tha mất rồi! Cậu đánh giúp ba con sói được không?'], () => { p.quests.active.push('s1_1'); this.toast('Nhận nhiệm vụ phụ: Gà bị sói tha'); });
      else this.say(['Bà Lý: Cảm ơn cậu nhiều. Dạo này đám Huyết Ảnh Môn lảng vảng quanh đây, cẩn thận nhé.']);
    } else {
      this.say(p.quests.done.includes('m1_2')
        ? ['Đệ tử Thanh Vân: Ngươi có linh căn gì? ... Tàn Căn? Haha, phế vật cũng muốn nhập môn?', 'Đệ tử Thanh Vân: Thôi, vào đi. Tông môn thu nhận cả người như ngươi để làm tạp dịch.']
        : ['Đệ tử Thanh Vân: Tông môn chưa mở cửa cho người lạ.']);
    }
  }

  private progress(done: string[]) {
    const p = game.p;
    for (const id of done) {
      const q = questMap.get(id);
      this.toast(`Hoàn thành: ${q?.title}`);
      if (id === 'm1_2') this.say(['Cổ Đỉnh rung lên. Một giọng nói già nua vang trong đầu ngươi:', '"Hậu bối... linh căn của ngươi không phải phế vật. Nó bị ta phong ấn để tránh bị kẻ khác nhòm ngó."', '[Mở khóa: Tu luyện — nhấn M]']);
      if (id === 'm1_3') { const u = enterChapter(p, 2); this.toast(`Chương 2 – mở: ${u.join(', ') || '—'}`); }
    }
    persist();
    this.refreshHud();
  }

  private startBattle(i: number) {
    const f = this.foes[i];
    this.busy = true;
    this.scene.pause();
    this.scene.launch('Battle', { enemies: [f.spot.id], foeIndex: i });
  }

  private openMenu() {
    if (this.busy || this.dialogBox) return;
    this.busy = true;
    this.scene.pause();
    this.scene.launch('Menu');
    this.scene.get('Menu').events.once('shutdown', () => { this.busy = false; this.scene.resume(); this.refreshHud(); });
  }

  private refreshHud() {
    const p = game.p;
    const r = REALMS[p.realmIndex];
    this.hud.setText(`${p.name} · ${r.name} tầng ${p.stage} · ${p.exp}/${expNeeded(p)} · ${p.gold} LT`);
    const mq = p.quests.active.map((id) => questMap.get(id)).filter(Boolean);
    this.questText.setText(mq.length ? mq.map((q: any) => `${q.type === 'main' ? '★' : '·'} ${q.title}: ${q.desc}`).join('\n') : '(Hết nhiệm vụ trong chương này)');
  }

  private toast(msg: string) {
    const t = label(this, W / 2, 70, msg, { fontSize: '10px', backgroundColor: '#1d2a5bdd', padding: { x: 6, y: 3 } }).setOrigin(0.5).setDepth(200);
    this.tweens.add({ targets: t, alpha: 0, y: 50, delay: 1800, duration: 500, onComplete: () => t.destroy() });
  }

  private say(lines: string[], after?: () => void) {
    this.dialog = [...lines];
    this.dialogAfter = after;
    const bg = this.add.rectangle(10, H - 100, W - 20, 90, 0x0b1020, 0.95).setOrigin(0).setStrokeStyle(1, 0x8fa2ff).setScrollFactor(0);
    const tx = this.add.text(20, H - 92, '', { fontFamily: 'monospace', fontSize: '11px', color: '#ffffff', wordWrap: { width: W - 40 } }).setScrollFactor(0);
    const hint = this.add.text(W - 24, H - 22, '▼', { fontFamily: 'monospace', fontSize: '10px', color: '#ffe38a' }).setScrollFactor(0);
    this.dialogBox = this.add.container(0, 0, [bg, tx, hint]).setDepth(300).setScrollFactor(0);
    bg.setInteractive().on('pointerdown', () => this.nextLine());
    this.nextLine();
  }

  private nextLine() {
    if (!this.dialogBox) return;
    const line = this.dialog.shift();
    if (line === undefined) {
      this.dialogBox.destroy(); this.dialogBox = undefined;
      const a = this.dialogAfter; this.dialogAfter = undefined; a?.();
      return;
    }
    (this.dialogBox.list[1] as Phaser.GameObjects.Text).setText(line);
  }
}
