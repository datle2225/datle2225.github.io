import Phaser from 'phaser';
import { W, H } from '../main';
import { game, persist } from '../state';
import { button, label } from '../ui/widgets';
import { questEvent } from '../core/session';
import { questMap, REALMS, vendorMap } from '../core/data';
import { expNeeded } from '../core/progression';
import { DialogueRunner, check, pickDialogue, type Cond, type TalkRule } from '../core/story';
import { audio } from '../audio';
import { joystickEnabled } from '../settings';
import map from '../data/maps/thanh_ha.json';

const TS = 32; // 1 ô = 16px art phóng 2x
const HALF = TS / 2;

interface MapNpc { id: string; name: string; tex: string; x: number; y: number; vendor?: string; talk: TalkRule[] }
interface MapFoe { group: string[]; tex: string; x: number; y: number; scale?: number; minRealm?: number }
interface MapZone { id: string; x: number; y: number; r: number; if?: Cond; deny?: string }
const M = map as unknown as {
  legend: Record<string, string>; solid: string[]; spawn: { x: number; y: number }; rows: string[];
  npcs: MapNpc[]; signs: { x: number; y: number; text: string }[]; enemies: MapFoe[]; herbs: number[][]; zones: MapZone[];
};

export class OverworldScene extends Phaser.Scene {
  private solid = new Set<string>();
  private player!: Phaser.GameObjects.Sprite;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private npcs: { npc: MapNpc; spr: Phaser.GameObjects.Sprite }[] = [];
  private foes: { def: MapFoe; spr: Phaser.GameObjects.Sprite; dead: boolean }[] = [];
  private herbs: { spr: Phaser.GameObjects.Sprite; got: boolean }[] = [];
  private followers: Phaser.GameObjects.Sprite[] = [];
  private trail: { x: number; y: number }[] = [];
  private hud!: Phaser.GameObjects.Text;
  private questText!: Phaser.GameObjects.Text;
  private talkBtn?: { destroy(): void };
  private busy = false;
  private lastAutosave = 0;
  private immuneUntil = 0;
  private denyUntil = 0;
  private partyKey = '';

  // hội thoại
  private runner: DialogueRunner | null = null;
  private dialogUi: Phaser.GameObjects.GameObject[] = [];
  private afterDialog?: () => void;

  // joystick ảo
  private joyOn = false;
  private joyBase?: Phaser.GameObjects.Arc;
  private joyThumb?: Phaser.GameObjects.Arc;
  private joyPtr: Phaser.Input.Pointer | null = null;
  private joyVec = new Phaser.Math.Vector2(0, 0);

  constructor() { super('Overworld'); }

  create() {
    this.solid.clear(); this.npcs = []; this.foes = []; this.herbs = []; this.followers = []; this.trail = [];
    this.runner = null; this.dialogUi = []; this.busy = false; this.joyPtr = null; this.joyVec.set(0, 0);
    this.buildMap();
    const p = game.p;
    const mapW = M.rows[0].length * TS, mapH = M.rows.length * TS;

    this.player = this.add.sprite(M.spawn.x * TS + HALF, M.spawn.y * TS + HALF, 'player').setScale(2).setDepth(10);
    this.cameras.main.setBounds(0, 0, mapW, mapH).startFollow(this.player, true, 0.15, 0.15);

    for (const n of M.npcs) {
      const spr = this.add.sprite(n.x * TS + HALF, n.y * TS + HALF, n.tex).setScale(2).setDepth(5);
      this.add.text(n.x * TS + HALF, n.y * TS - 4, n.name, { fontFamily: 'monospace', fontSize: '11px', color: n.vendor ? '#9affc8' : '#ffe38a', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(6);
      this.npcs.push({ npc: n, spr });
    }
    for (const sg of M.signs) this.add.text(sg.x * TS + HALF, sg.y * TS + HALF, sg.text, { fontFamily: 'monospace', fontSize: '11px', color: '#ffd37a', backgroundColor: '#3a2a1ecc', padding: { x: 3, y: 1 } }).setOrigin(0.5).setDepth(4);
    for (const f of M.enemies) {
      const spr = this.add.sprite(f.x * TS + HALF, f.y * TS + HALF, f.tex).setScale(f.scale ?? 2).setDepth(5);
      if (f.group.length > 1) this.add.text(f.x * TS + HALF, f.y * TS - 6, `×${f.group.length}`, { fontFamily: 'monospace', fontSize: '10px', color: '#ff9a9a', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(6);
      this.foes.push({ def: f, spr, dead: false });
    }
    for (const [x, y] of M.herbs) this.herbs.push({ spr: this.add.sprite(x * TS + HALF, y * TS + HALF, 'herb').setScale(2).setDepth(2), got: false });
    this.refreshFoeVisibility();

    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT') as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.on('keydown-M', () => this.openMenu());
    this.input.keyboard!.on('keydown-E', () => this.interact());
    this.input.keyboard!.on('keydown-SPACE', () => this.interact());
    (['ONE', 'TWO', 'THREE'] as const).forEach((k, idx) => this.input.keyboard!.on(`keydown-${k}`, () => this.quickChoose(idx)));
    this.input.keyboard!.on('keydown-N', () => { audio.setMuted(!audio.muted); this.toast(audio.muted ? 'Đã tắt âm thanh' : 'Đã bật âm thanh'); });

    this.hud = label(this, 6, 4, '', { fontSize: '10px', backgroundColor: '#0b1020cc', padding: { x: 4, y: 2 } }).setDepth(100);
    this.questText = label(this, 6, 24, '', { fontSize: '9px', color: '#ffe38a', backgroundColor: '#0b1020cc', padding: { x: 4, y: 2 }, wordWrap: { width: 320 } }).setDepth(100);
    button(this, W - 70, 6, 64, 24, 'Menu (M)', () => this.openMenu(), { depth: 100 });
    this.setupJoystick();
    this.refreshHud();
    this.syncFollowers();
    this.time.addEvent({ delay: 500, loop: true, callback: () => { this.refreshHud(); this.syncFollowers(); } });

    this.events.on('battle-end', (r: { won: boolean; fled?: boolean; lost?: boolean; foeIndex: number }) => {
      this.busy = false;
      this.immuneUntil = this.time.now + 3000;
      if (r.won && this.foes[r.foeIndex]) {
        const f = this.foes[r.foeIndex];
        f.dead = true; f.spr.setVisible(false);
        this.time.delayedCall(40000, () => { if (f.spr.scene) { f.dead = false; this.refreshFoeVisibility(); } });
      }
      if (r.lost) { this.player.setPosition(M.spawn.x * TS + HALF, M.spawn.y * TS + HALF); this.trail = []; }
      this.refreshHud();
      audio.music('overworld');
    });
    this.events.on('resume', () => { this.refreshHud(); this.refreshFoeVisibility(); audio.music('overworld'); });

    audio.music('overworld');
    if (!p.flags.intro) { p.flags.intro = true; this.startDialogue('intro'); }
  }

  private buildMap() {
    const solidChars = new Set(M.solid);
    M.rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        const tex = M.legend[ch] ?? 'grass';
        this.add.image(x * TS, y * TS, tex === 'house' ? 'house' : tex).setOrigin(0).setScale(2).setDepth(0);
        if (solidChars.has(ch)) this.solid.add(`${x},${y}`);
      }
    });
  }

  private refreshFoeVisibility() {
    const rl = game.p.realmIndex;
    for (const f of this.foes) f.spr.setVisible(!f.dead && (f.def.minRealm ?? 0) <= rl);
  }

  private foeActive(f: (typeof this.foes)[number]) {
    return !f.dead && (f.def.minRealm ?? 0) <= game.p.realmIndex;
  }

  /** Đồng đội đi theo sau người chơi. */
  private syncFollowers() {
    const key = game.p.party.join(',');
    if (key === this.partyKey) return;
    this.partyKey = key;
    this.followers.forEach((s) => s.destroy());
    this.followers = game.p.party.map((id) => {
      const tex = id === 'nguyet_nhi' ? 'npc_girl2' : 'npc_girl';
      return this.add.sprite(this.player.x, this.player.y, tex).setScale(2).setDepth(9);
    });
  }

  private setupJoystick() {
    this.joyOn = joystickEnabled();
    if (!this.joyOn) return;
    const cx = 84, cy = H - 84;
    this.joyBase = this.add.circle(cx, cy, 48, 0xffffff, 0.12).setStrokeStyle(2, 0xffffff, 0.35).setScrollFactor(0).setDepth(150);
    this.joyThumb = this.add.circle(cx, cy, 22, 0xffffff, 0.35).setScrollFactor(0).setDepth(151);
    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (this.busy || this.runner) return;
      if (ptr.x < 190 && ptr.y > H - 190 && !this.joyPtr) { this.joyPtr = ptr; this.moveJoy(ptr); }
    });
    this.input.on('pointermove', (ptr: Phaser.Input.Pointer) => { if (this.joyPtr && ptr.id === this.joyPtr.id) this.moveJoy(ptr); });
    const end = (ptr: Phaser.Input.Pointer) => {
      if (this.joyPtr && ptr.id === this.joyPtr.id) { this.joyPtr = null; this.joyVec.set(0, 0); this.joyThumb!.setPosition(cx, cy); }
    };
    this.input.on('pointerup', end);
    this.input.on('pointerupoutside', end);
  }

  private moveJoy(ptr: Phaser.Input.Pointer) {
    const cx = this.joyBase!.x, cy = this.joyBase!.y;
    const v = new Phaser.Math.Vector2(ptr.x - cx, ptr.y - cy);
    const len = Math.min(v.length(), 48);
    if (v.length() > 0) v.normalize();
    this.joyThumb!.setPosition(cx + v.x * len, cy + v.y * len);
    this.joyVec.set(len > 10 ? v.x : 0, len > 10 ? v.y : 0);
  }

  private blocked(px: number, py: number) {
    return this.solid.has(`${Math.floor(px / TS)},${Math.floor(py / TS)}`);
  }

  update(_t: number, dt: number) {
    if (this.busy || this.runner) return;
    const k = this.keys;
    let vx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    let vy = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
    if (!vx && !vy && this.joyPtr) { vx = this.joyVec.x; vy = this.joyVec.y; }
    const ptr = this.input.activePointer;
    if (!vx && !vy && !this.joyOn && ptr.isDown && ptr.y > 40) {
      const wp = this.cameras.main.getWorldPoint(ptr.x, ptr.y);
      const dx = wp.x - this.player.x, dy = wp.y - this.player.y;
      if (Math.hypot(dx, dy) > 8) { vx = dx; vy = dy; }
    }
    const len = Math.hypot(vx, vy);
    if (len > 0.05) {
      const speed = 150 * (dt / 1000);
      const nx = this.player.x + (vx / len) * speed, ny = this.player.y + (vy / len) * speed;
      if (!this.blocked(nx, this.player.y + 8)) this.player.x = nx;
      if (!this.blocked(this.player.x, ny + 8)) this.player.y = ny;
      if (Math.abs(vx) > 0.1) this.player.setFlipX(vx < 0);
      this.trail.unshift({ x: this.player.x, y: this.player.y });
      if (this.trail.length > 120) this.trail.length = 120;
    }
    this.followers.forEach((f, i) => {
      const t = this.trail[(i + 1) * 12] ?? this.trail[this.trail.length - 1];
      if (t) { f.x = t.x; f.y = t.y; } else { f.x = this.player.x - 20 * (i + 1); f.y = this.player.y; }
    });
    this.checkWorld(dt);
  }

  private checkWorld(dt: number) {
    const p = game.p;
    p.playtime += dt / 1000;
    this.lastAutosave += dt;
    if (this.lastAutosave > 30000) { this.lastAutosave = 0; persist(); }
    const tx = this.player.x / TS, ty = this.player.y / TS;

    for (const z of M.zones) {
      if (Math.hypot(tx - z.x, ty - z.y) > z.r) continue;
      if (z.if && !check(p, z.if)) {
        if (z.deny && this.time.now > this.denyUntil) { this.denyUntil = this.time.now + 4000; this.toast(z.deny); }
        continue;
      }
      const done = questEvent(p, 'reach', z.id);
      if (done.length) this.progress(done);
    }

    for (const h of this.herbs) {
      if (!h.got && Math.hypot(h.spr.x - this.player.x, h.spr.y - this.player.y) < 24) {
        h.got = true; h.spr.setVisible(false);
        p.inventory.linh_thao = (p.inventory.linh_thao ?? 0) + 1;
        audio.sfx('coin');
        this.toast('Nhặt được Linh Thảo');
        this.progress(questEvent(p, 'collect', 'linh_thao', 1));
        this.time.delayedCall(30000, () => { h.got = false; h.spr.setVisible(true); });
      }
    }

    if (this.time.now > this.immuneUntil) {
      this.foes.forEach((f, i) => {
        if (this.foeActive(f) && Math.hypot(f.spr.x - this.player.x, f.spr.y - this.player.y) < 26) this.startBattle(i);
      });
    }

    const npc = this.nearestNpc();
    if (npc && !this.talkBtn && !this.runner) {
      this.talkBtn = button(this, W / 2 - 60, H - 40, 120, 28, `Nói chuyện: ${npc.name.split(' (')[0]}`, () => this.interact(), { depth: 100 });
    }
    if ((!npc || this.runner) && this.talkBtn) { this.talkBtn.destroy(); this.talkBtn = undefined; }
  }

  private nearestNpc(): MapNpc | null {
    let best: MapNpc | null = null, bd = 56;
    for (const n of this.npcs) {
      const d = Math.hypot(n.spr.x - this.player.x, n.spr.y - this.player.y);
      if (d < bd) { bd = d; best = n.npc; }
    }
    return best;
  }

  private interact() {
    if (this.runner) return this.advanceDialogue();
    if (this.busy) return;
    const n = this.nearestNpc();
    if (!n) return;
    const id = pickDialogue(game.p, n.talk);
    if (id) this.startDialogue(id);
  }

  private progress(done: string[]) {
    for (const id of done) {
      this.toast(`Hoàn thành: ${questMap.get(id)?.title}`);
      audio.sfx('levelup');
      if (id === 'm1_2') this.startDialogue('co_dinh');
      if (id === 'm1_3') this.startDialogue('m1_3_done');
    }
    persist();
    this.refreshHud();
  }

  private startBattle(i: number) {
    const f = this.foes[i];
    this.busy = true;
    this.joyPtr = null; this.joyVec.set(0, 0);
    this.scene.pause();
    this.scene.launch('Battle', { enemies: f.def.group, foeIndex: i });
  }

  private openMenu() {
    if (this.busy || this.runner) return;
    this.busy = true;
    this.scene.pause();
    this.scene.launch('Menu');
    this.scene.get('Menu').events.once('shutdown', () => { this.busy = false; this.scene.resume(); this.refreshHud(); this.syncFollowers(); });
  }

  private openShop(vendor: string, tab?: string) {
    if (!vendorMap.has(vendor)) return;
    this.busy = true;
    this.scene.pause();
    this.scene.launch('Shop', { vendor, tab });
    this.scene.get('Shop').events.once('shutdown', () => { this.busy = false; this.refreshHud(); });
  }

  private refreshHud() {
    const p = game.p;
    const r = REALMS[p.realmIndex];
    this.hud.setText(`${p.name} · ${r.name} tầng ${p.stage} · ${p.exp}/${expNeeded(p)} · ${p.gold} LT${p.party.length ? ` · +${p.party.length}` : ''}`);
    const mq = p.quests.active.map((id) => questMap.get(id)).filter(Boolean);
    this.questText.setText(mq.length ? mq.map((q: any) => `${q.type === 'main' ? '★' : '·'} ${q.title}: ${q.desc}`).join('\n') : '(Hết nhiệm vụ trong chương này)');
  }

  private toast(msg: string) {
    const t = label(this, W / 2, 80, msg, { fontSize: '10px', backgroundColor: '#1d2a5bdd', padding: { x: 6, y: 3 }, wordWrap: { width: 420 }, align: 'center' }).setOrigin(0.5).setDepth(200);
    this.tweens.add({ targets: t, alpha: 0, y: 60, delay: 1800, duration: 500, onComplete: () => t.destroy() });
  }

  /* ───────────── Hội thoại (dữ liệu hóa, có lựa chọn) ───────────── */

  private startDialogue(id: string, after?: () => void) {
    if (this.runner) return;
    this.runner = new DialogueRunner(game.p, id);
    this.talkBtn?.destroy(); this.talkBtn = undefined;
    this.afterDialog = after;
    this.joyPtr = null; this.joyVec.set(0, 0);
    this.flushEffects();
    this.showNode();
  }

  private flushEffects() {
    const out = this.runner!.out;
    out.toasts.splice(0).forEach((t) => this.toast(t));
    const done = out.completed.splice(0);
    if (done.length) this.progressSoon(done);
  }

  private pendingProgress: string[] = [];
  private progressSoon(done: string[]) { this.pendingProgress.push(...done); }

  private clearDialogUi() { this.dialogUi.forEach((o) => o.destroy()); this.dialogUi = []; }

  private showNode() {
    this.clearDialogUi();
    const v = this.runner?.view();
    if (!v) return this.endDialogue();
    const bg = this.add.rectangle(10, H - 104, W - 20, 94, 0x0b1020, 0.95).setOrigin(0).setStrokeStyle(1, 0x8fa2ff).setScrollFactor(0).setDepth(300);
    this.dialogUi.push(bg);
    if (v.who) this.dialogUi.push(this.add.text(20, H - 98, v.who, { fontFamily: 'monospace', fontSize: '11px', color: '#ffe38a' }).setScrollFactor(0).setDepth(301));
    this.dialogUi.push(this.add.text(20, H - 82, v.text, { fontFamily: 'monospace', fontSize: '11px', color: '#ffffff', wordWrap: { width: W - 44 } }).setScrollFactor(0).setDepth(301));
    if (v.choices.length) {
      v.choices.forEach((c, i) => {
        const b = button(this, 20, H - 104 - (v.choices.length - i) * 30, W - 40, 26, `${i + 1}. ${c.text}`, () => this.choose(c.i), { depth: 302 });
        this.dialogUi.push(b.bg, b.t);
      });
    } else {
      this.dialogUi.push(this.add.text(W - 24, H - 24, '▼', { fontFamily: 'monospace', fontSize: '10px', color: '#ffe38a' }).setScrollFactor(0).setDepth(301));
      bg.setInteractive().on('pointerdown', () => this.advanceDialogue());
    }
  }

  private quickChoose(idx: number) {
    const c = this.runner?.view()?.choices[idx];
    if (c) this.choose(c.i);
  }

  private choose(i: number) {
    if (!this.runner) return;
    this.runner.advance(i);
    this.flushEffects();
    audio.sfx('click');
    this.showNode();
  }

  private advanceDialogue() {
    if (!this.runner) return;
    const v = this.runner.view();
    if (v && v.choices.length) return; // cần chọn
    this.runner.advance();
    this.flushEffects();
    this.showNode();
  }

  private endDialogue() {
    this.clearDialogUi();
    const r = this.runner;
    this.runner = null;
    const shop = r?.out.openShop;
    const after = this.afterDialog; this.afterDialog = undefined;
    after?.();
    const done = this.pendingProgress.splice(0);
    if (done.length) this.progress(done);
    persist();
    this.refreshHud();
    this.syncFollowers();
    if (shop) this.openShop(shop.vendor, shop.tab);
  }
}

