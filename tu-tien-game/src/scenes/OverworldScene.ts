import Phaser from 'phaser';
import { W, H, Z } from '../main';
import { game, persist } from '../state';
import { button, label } from '../ui/widgets';
import { checkCollect, getQuest, questEvent } from '../core/session';
import { ELITE } from '../core/difficulty';
import { EVENTS, REALMS, enemyMap, vendorMap } from '../core/data';
import { expNeeded } from '../core/progression';
import { DIALOGUES, DialogueRunner, check, pickDialogue, rollEvent, rumorDialogue } from '../core/story';
import { checkAchievements } from '../core/achievements';
import { clearFloor, floorEnemies, floorMult, towerBossName } from '../core/tower';
import { loadMap } from '../core/maps';
import { isSolidTile, type MapDef, type MapNpc, type MapFoe } from '../core/tiled';
import { TILESET } from '../core/tileset';
import { formatHour, gameHour, nightAlpha } from '../core/time';
import { auraAt, claimSeclusion, MED, seclusionUnits } from '../core/meditation';
import { settleAuctions } from '../core/auction';
import { audio } from '../audio';
import { joystickEnabled, getSettings } from '../settings';

const TS = 32; // 1 ô = 16px art phóng 2x
const HALF = TS / 2;

/** Quái đã hạ (trong phiên): `${map}:${index}` → thời điểm (giây chơi) được hồi sinh. Không lưu vào save. */
const respawnAt = new Map<string, number>();

interface NpcView { npc: MapNpc; spr: Phaser.GameObjects.Sprite; tag: Phaser.GameObjects.Text; at: string }
interface FoeView { def: MapFoe; spr: Phaser.GameObjects.Sprite; tag?: Phaser.GameObjects.Text; key: string; elite: boolean }

export class OverworldScene extends Phaser.Scene {
  private map!: MapDef;
  private solid = new Set<string>();
  private player!: Phaser.GameObjects.Sprite;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private npcs: NpcView[] = [];
  private foes: FoeView[] = [];
  private herbs: { spr: Phaser.GameObjects.Sprite; got: boolean }[] = [];
  private waters: Phaser.GameObjects.Image[] = [];
  private followers: Phaser.GameObjects.Sprite[] = [];
  private trail: { x: number; y: number }[] = [];
  private hud!: Phaser.GameObjects.Text;
  private questText!: Phaser.GameObjects.Text;
  private nightOverlay!: Phaser.GameObjects.Rectangle;
  private talkBtn?: { destroy(): void };
  private busy = false;
  private lastAutosave = 0;
  private immuneUntil = 0;
  private denyUntil = 0;
  private partyKey = '';
  private walked = 0;
  private fps?: Phaser.GameObjects.Text;
  private initData: { arrive?: string } = {};
  private towerFloor = 0;

  // hội thoại
  private runner: DialogueRunner | null = null;
  private dialogUi: Phaser.GameObjects.GameObject[] = [];
  private afterDialog?: () => void;
  private pendingProgress: string[] = [];

  // joystick ảo
  private joyOn = false;
  private joyThumb?: Phaser.GameObjects.Arc;
  private joyPtr: Phaser.Input.Pointer | null = null;
  private joyVec = new Phaser.Math.Vector2(0, 0);
  private joyCenter = { x: 84, y: H - 84 };

  constructor() { super('Overworld'); }

  init(d?: { arrive?: string }) { this.initData = d ?? {}; }

  create() {
    const p = game.p;
    this.solid.clear(); this.npcs = []; this.foes = []; this.herbs = []; this.waters = []; this.followers = []; this.trail = [];
    this.runner = null; this.dialogUi = []; this.busy = false; this.joyPtr = null; this.joyVec.set(0, 0); this.partyKey = ''; this.walked = 0;
    this.map = loadMap(p.mapId);
    p.mapId = this.map.id;
    if (!p.visited.includes(p.mapId)) p.visited.push(p.mapId);
    this.buildMap();

    const arrive = this.initData.arrive;
    const spawn = (arrive && this.map.spawns[arrive]) || (!arrive && p.pos ? p.pos : this.map.spawns.spawn);
    this.initData = {};
    this.player = this.add.sprite(spawn.x * TS + HALF, spawn.y * TS + HALF, 'player').setScale(2).setDepth(10);
    this.camFollow(true);

    for (const n of this.map.npcs) {
      const spr = this.add.sprite(n.x * TS + HALF, n.y * TS + HALF, n.tex).setScale(2).setDepth(5);
      const tag = this.add.text(n.x * TS + HALF, n.y * TS - 4, n.name, { fontFamily: 'monospace', fontSize: '11px', color: n.vendor ? '#9affc8' : '#ffe38a', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(6);
      this.npcs.push({ npc: n, spr, tag, at: '' });
    }
    this.applySchedules(true);
    for (const sg of this.map.signs) this.add.text(sg.x * TS + HALF, sg.y * TS + HALF, sg.text, { fontFamily: 'monospace', fontSize: '11px', color: '#ffd37a', backgroundColor: '#3a2a1ecc', padding: { x: 3, y: 1 } }).setOrigin(0.5).setDepth(4);
    this.map.foes.forEach((f, i) => {
      const spr = this.add.sprite(f.x * TS + HALF, f.y * TS + HALF, f.tex).setScale(f.scale ?? 2).setDepth(5);
      if (this.anims.exists(`idle_${f.tex}`)) spr.play(`idle_${f.tex}`);
      const tag = f.group.length > 1 ? this.add.text(f.x * TS + HALF, f.y * TS - 6, `×${f.group.length}`, { fontFamily: 'monospace', fontSize: '10px', color: '#ff9a9a', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(6) : undefined;
      const elite = this.rollElite(f);
      this.foes.push({ def: f, spr, tag, key: `${this.map.id}:${i}`, elite });
      this.markElite(this.foes[this.foes.length - 1]);
    });
    for (const [x, y] of this.map.herbs) this.herbs.push({ spr: this.add.sprite(x * TS + HALF, y * TS + HALF, 'herb').setScale(2).setDepth(2), got: false });
    this.refreshFoeVisibility();

    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT') as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.on('keydown-M', () => this.openMenu());
    this.input.keyboard!.on('keydown-E', () => this.interact());
    this.input.keyboard!.on('keydown-SPACE', () => this.interact());
    (['ONE', 'TWO', 'THREE'] as const).forEach((k, idx) => this.input.keyboard!.on(`keydown-${k}`, () => this.quickChoose(idx)));
    this.input.keyboard!.on('keydown-N', () => { audio.setMuted(!audio.muted); this.toast(audio.muted ? 'Đã tắt âm thanh' : 'Đã bật âm thanh'); });
    this.input.keyboard!.on('keydown-F', () => { this.fps ? (this.fps.destroy(), this.fps = undefined) : (this.fps = label(this, 6, H - 14, '', { fontSize: '9px', color: '#9aff9a' }).setDepth(120)); });

    this.nightOverlay = this.add.rectangle(0, 0, W, H, 0x0a1040, 0).setOrigin(0).setScrollFactor(0).setDepth(90);
    this.hud = label(this, 6, 4, '', { fontSize: '10px', backgroundColor: '#0b1020cc', padding: { x: 4, y: 2 } }).setDepth(100);
    this.questText = label(this, 6, 24, '', { fontSize: '9px', color: '#ffe38a', backgroundColor: '#0b1020cc', padding: { x: 4, y: 2 }, wordWrap: { width: 320 } }).setDepth(100);
    button(this, W - 70, 6, 64, 24, 'Menu (M)', () => this.openMenu(), { depth: 100 });
    this.setupJoystick();
    this.tick();
    this.time.addEvent({ delay: 500, loop: true, callback: () => this.tick() });
    this.time.addEvent({ delay: 600, loop: true, callback: () => this.waters.forEach((w) => w.setTexture(w.texture.key === 'water' ? 'water2' : 'water')) });

    const onBattleEnd = (r: { won: boolean; fled?: boolean; lost?: boolean; foeIndex: number; completed?: string[] }) => {
      this.busy = false;
      this.immuneUntil = this.time.now + 3000;
      if (r.foeIndex === -2) { this.onTowerResult(r.won); audio.music(this.map.music); return; }
      const f = this.foes[r.foeIndex];
      if (r.won && f) { respawnAt.set(f.key, game.p.playtime + this.map.respawn); f.elite = this.rollElite(f.def); this.markElite(f); this.refreshFoeVisibility(); }
      if (r.lost && r.foeIndex !== -2) { const sp = this.map.spawns.spawn; this.player.setPosition(sp.x * TS + HALF, sp.y * TS + HALF); this.trail = []; }
      this.refreshHud();
      audio.music(this.map.music);
      if (r.completed?.length) this.time.delayedCall(300, () => this.progress(r.completed!)); // quest hoàn thành ngay trong trận
    };
    const onResume = () => {
      this.refreshHud(); this.refreshFoeVisibility(); audio.music(this.map.music);
      if (game.p.flags.ascended && !game.p.flags.ascend_shown) { game.p.flags.ascend_shown = true; this.time.delayedCall(500, () => { const e = pickDialogue(game.p, [{ if: { flag: 'ending_join' }, id: 'ascend_dark' }, { if: { flag: 'route_expose' }, id: 'ascend_expose' }, { if: { minDao: 65 }, id: 'ascend_chinh' }, { if: { maxDao: 35 }, id: 'ascend_ma' }, { id: 'ascend_tan' }]); if (e) this.startDialogue(e); }); }
    };
    this.events.on('battle-end', onBattleEnd);
    this.events.on('resume', onResume);
    this.events.once('shutdown', () => { this.events.off('battle-end', onBattleEnd); this.events.off('resume', onResume); });

    audio.music(this.map.music);
    this.toast(this.map.name);
    if (p.seclusion && seclusionUnits(p, Date.now()) >= 1) { const r = claimSeclusion(p, Date.now()); this.time.delayedCall(900, () => this.toast(r.msg)); persist(); }
    if (!p.flags.intro) { p.flags.intro = true; this.startDialogue('intro'); }
  }

  /* ───────────── Dựng bản đồ (đóng băng thành 1 texture để chạy mượt trên điện thoại) ───────────── */
  private buildMap() {
    const m = this.map;
    const rt = this.add.renderTexture(0, 0, m.w * 16, m.h * 16).setOrigin(0).setScale(2).setDepth(0);
    rt.beginDraw();
    for (let y = 0; y < m.h; y++) {
      for (let x = 0; x < m.w; x++) {
        const idx = m.tiles[y * m.w + x];
        if (idx < 0) continue;
        const tex = TILESET[idx].tex;
        if (tex === 'water') { this.waters.push(this.add.image(x * TS, y * TS, 'water').setOrigin(0).setScale(2).setDepth(0)); }
        else rt.batchDraw(tex, x * 16, y * 16);
        if (isSolidTile(idx)) this.solid.add(`${x},${y}`);
      }
    }
    rt.endDraw();
  }

  /** 12% quái thường là tinh anh (★): mạnh hơn, thưởng gấp đôi. Boss thì không. */
  private rollElite(f: MapFoe): boolean {
    return !f.group.some((id) => enemyMap.get(id)?.boss) && Math.random() < ELITE.chance;
  }

  private markElite(f: FoeView) {
    if (f.elite) f.spr.setTint(0xff7070); else f.spr.clearTint();
    f.tag?.setText(`${f.elite ? '★ ' : ''}${f.def.group.length > 1 ? `×${f.def.group.length}` : ''}`.trim());
    if (!f.tag && f.elite) f.tag = this.add.text(f.def.x * TS + HALF, f.def.y * TS - 6, '★', { fontFamily: 'monospace', fontSize: '12px', color: '#ffd24a', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(6);
  }

  private foeAlive(f: FoeView) {
    return (respawnAt.get(f.key) ?? 0) <= game.p.playtime && (f.def.minRealm ?? 0) <= game.p.realmIndex;
  }

  private refreshFoeVisibility() {
    for (const f of this.foes) { const a = this.foeAlive(f); f.spr.setVisible(a); f.tag?.setVisible(a); }
  }

  /* ───────────── Lịch sinh hoạt NPC ───────────── */
  private applySchedules(instant: boolean) {
    const h = gameHour(game.p);
    for (const v of this.npcs) {
      const sc = v.npc.schedule;
      if (!sc?.length) continue;
      const cur = sc.find((e) => (e.from <= e.to ? h >= e.from && h < e.to : h >= e.from || h < e.to)) ?? sc[0];
      const key = `${cur.x},${cur.y},${cur.hidden ? 1 : 0}`;
      if (v.at === key) continue;
      v.at = key;
      const tx = cur.x * TS + HALF, ty = cur.y * TS + HALF;
      const show = !cur.hidden;
      if (instant) { v.spr.setPosition(tx, ty); v.tag.setPosition(tx, ty - HALF - 4); v.spr.setVisible(show); v.tag.setVisible(show); }
      else {
        if (show) { v.spr.setVisible(true); v.tag.setVisible(true); }
        this.tweens.add({ targets: v.spr, x: tx, y: ty, duration: 1800, onComplete: () => { if (!show) { v.spr.setVisible(false); v.tag.setVisible(false); } } });
        this.tweens.add({ targets: v.tag, x: tx, y: ty - HALF - 4, duration: 1800 });
      }
    }
  }

  private tick() {
    for (const a of checkAchievements(game.p)) { this.toast(`★ Thành tựu: ${a.name} (+${a.reward?.gold ?? 0} LT)`); audio.sfx('levelup'); persist(); }
    const col = checkCollect(game.p);
    if (col.length) this.progress(col);
    if (Object.keys(game.p.auction.bids).length) { const n = settleAuctions(game.p); if (n.length) { this.toast(n[0]); persist(); } }
    this.refreshHud();
    this.syncFollowers();
    this.applySchedules(false);
    this.refreshFoeVisibility();
    this.nightOverlay.setFillStyle(0x0a1040, nightAlpha(gameHour(game.p)));
    if (this.fps) this.fps.setText(`${Math.round(this.game.loop.actualFps)} fps · ${this.children.length} obj`);
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

  /* ───────────── Joystick ảo (vị trí / bật tắt trong Cài đặt) ───────────── */
  private setupJoystick() {
    this.joyOn = joystickEnabled();
    if (!this.joyOn) return;
    const side = getSettings().joyside;
    const cx = side === 'right' ? W - 84 : 84, cy = H - 84;
    this.joyCenter = { x: cx, y: cy };
    this.add.circle(cx, cy, 48, 0xffffff, 0.12).setStrokeStyle(2, 0xffffff, 0.35).setScrollFactor(0).setDepth(150);
    this.joyThumb = this.add.circle(cx, cy, 22, 0xffffff, 0.35).setScrollFactor(0).setDepth(151);
    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (this.busy || this.runner) return;
      if (Math.abs(ptr.x / Z - cx) < 100 && ptr.y / Z > H - 190 && !this.joyPtr) { this.joyPtr = ptr; this.moveJoy(ptr); }
    });
    this.input.on('pointermove', (ptr: Phaser.Input.Pointer) => { if (this.joyPtr && ptr.id === this.joyPtr.id) this.moveJoy(ptr); });
    const end = (ptr: Phaser.Input.Pointer) => {
      if (this.joyPtr && ptr.id === this.joyPtr.id) { this.joyPtr = null; this.joyVec.set(0, 0); this.joyThumb!.setPosition(cx, cy); }
    };
    this.input.on('pointerup', end);
    this.input.on('pointerupoutside', end);
  }

  private moveJoy(ptr: Phaser.Input.Pointer) {
    const { x: cx, y: cy } = this.joyCenter;
    const v = new Phaser.Math.Vector2(ptr.x / Z - cx, ptr.y / Z - cy);
    const len = Math.min(v.length(), 48);
    if (v.length() > 0) v.normalize();
    this.joyThumb!.setPosition(cx + v.x * len, cy + v.y * len);
    this.joyVec.set(len > 10 ? v.x : 0, len > 10 ? v.y : 0);
  }

  private blocked(px: number, py: number) {
    return this.solid.has(`${Math.floor(px / TS)},${Math.floor(py / TS)}`);
  }

  /** Camera tự theo người chơi (zoom Z, gốc 0,0): giữ trong biên bản đồ, nhỏ hơn màn hình thì căn giữa. */
  private camFollow(snap = false) {
    const cam = this.cameras.main;
    const mw = this.map.w * TS, mh = this.map.h * TS;
    const clampAxis = (v: number, view: number, size: number) => (size <= view ? (size - view) / 2 : Math.max(0, Math.min(size - view, v)));
    const tx = clampAxis(this.player.x - W / 2, W, mw);
    const ty = clampAxis(this.player.y - H / 2, H, mh);
    const k = snap ? 1 : 0.15;
    cam.setScroll(Math.round(cam.scrollX + (tx - cam.scrollX) * k), Math.round(cam.scrollY + (ty - cam.scrollY) * k));
  }

  update(_t: number, dt: number) {
    this.camFollow();
    if (this.busy || this.runner) { this.player.anims.stop(); this.player.setTexture('player'); return; }
    const k = this.keys;
    let vx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    let vy = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
    if (!vx && !vy && this.joyPtr) { vx = this.joyVec.x; vy = this.joyVec.y; }
    const ptr = this.input.activePointer;
    if (!vx && !vy && !this.joyOn && ptr.isDown && ptr.y / Z > 40) {
      const wp = this.cameras.main.getWorldPoint(ptr.x, ptr.y);
      const dx = wp.x - this.player.x, dy = wp.y - this.player.y;
      if (Math.hypot(dx, dy) > 8) { vx = dx; vy = dy; }
    }
    const len = Math.hypot(vx, vy);
    if (len > 0.05) {
      const speed = 150 * (dt / 1000);
      const ox = this.player.x, oy = this.player.y;
      const nx = ox + (vx / len) * speed, ny = oy + (vy / len) * speed;
      if (!this.blocked(nx, oy + 8)) this.player.x = nx;
      if (!this.blocked(this.player.x, ny + 8)) this.player.y = ny;
      if (Math.abs(vx) > 0.1) this.player.setFlipX(vx < 0);
      this.player.anims.play('walk_player', true);
      this.walked += Math.hypot(this.player.x - ox, this.player.y - oy);
      this.trail.unshift({ x: this.player.x, y: this.player.y });
      if (this.trail.length > 120) this.trail.length = 120;
    } else { this.player.anims.stop(); this.player.setTexture('player'); }
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
    if (this.lastAutosave > 30000) { this.lastAutosave = 0; this.savePos(); persist(); }
    const tx = this.player.x / TS, ty = this.player.y / TS;

    for (const z of this.map.zones) {
      if (Math.hypot(tx - z.x, ty - z.y) > z.r) continue;
      if (z.if && !check(p, z.if)) {
        if (z.deny && this.time.now > this.denyUntil) { this.denyUntil = this.time.now + 4000; this.toast(z.deny); }
        continue;
      }
      const done = questEvent(p, 'reach', z.id);
      if (done.length) this.progress(done);
    }

    for (const pt of this.map.portals) {
      if (tx < pt.x || tx > pt.x + pt.w || ty < pt.y || ty > pt.y + pt.h) continue;
      if (pt.if && !check(p, pt.if)) {
        if (pt.deny && this.time.now > this.denyUntil) { this.denyUntil = this.time.now + 4000; this.toast(pt.deny); }
        continue;
      }
      return this.changeMap(pt.target, pt.arrive);
    }

    for (const h of this.herbs) {
      if (!h.got && Math.hypot(h.spr.x - this.player.x, h.spr.y - this.player.y) < 24) {
        h.got = true; h.spr.setVisible(false);
        p.inventory.linh_thao = (p.inventory.linh_thao ?? 0) + 1;
        audio.sfx('coin');
        this.toast('Nhặt được Linh Thảo');
        this.progress(checkCollect(p));
        this.time.delayedCall(30000, () => { h.got = false; h.spr.setVisible(true); });
      }
    }

    if (this.time.now > this.immuneUntil) {
      this.foes.forEach((f, i) => {
        if (this.foeAlive(f) && Math.hypot(f.spr.x - this.player.x, f.spr.y - this.player.y) < 26) this.startBattle(i);
      });
    }

    // cơ duyên ngẫu nhiên: đi đủ xa thì thử bốc một sự kiện
    if (this.walked > 420 && !this.runner && this.time.now > this.immuneUntil) {
      this.walked = 0;
      const ev = rollEvent(p, EVENTS, Math.random);
      if (ev) this.startDialogue(ev.dialogue);
    }

    const npc = this.nearestNpc();
    if (npc && !this.talkBtn && !this.runner) {
      this.talkBtn = button(this, W / 2 - 60, H - 40, 120, 28, `Nói chuyện: ${npc.name.split(' (')[0]}`, () => this.interact(), { depth: 100 });
    }
    if ((!npc || this.runner) && this.talkBtn) { this.talkBtn.destroy(); this.talkBtn = undefined; }
  }

  private savePos() {
    game.p.pos = { x: Math.floor(this.player.x / TS), y: Math.floor(this.player.y / TS) };
  }

  private changeMap(target: string, arrive: string) {
    game.p.mapId = target;
    game.p.pos = null;
    persist();
    this.scene.restart({ arrive });
  }

  private nearestNpc(): MapNpc | null {
    let best: MapNpc | null = null, bd = 56;
    for (const n of this.npcs) {
      if (!n.spr.visible) continue;
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
    let id = pickDialogue(game.p, n.talk);
    if (id === '@rumor') id = rumorDialogue(game.p);
    if (id === '@board') { this.openShop('bang_nv'); return; }
    if (id) this.startDialogue(id);
  }

  private progress(done: string[]) {
    for (const id of done) {
      this.toast(`Hoàn thành: ${getQuest(game.p, id)?.title ?? game.p.flags.lastDoneTitle ?? 'nhiệm vụ'}`);
      audio.sfx('levelup');
      if (id === 'm1_2') this.startDialogue('co_dinh');
      if (id === 'm1_3') this.startDialogue('m1_3_done');
      if (id === 'm4_2') this.time.delayedCall(400, () => this.startDialogue('phan2_demo_end'));
      if (id === 'm3_3') this.time.delayedCall(400, () => { const e = pickDialogue(game.p, [{ if: { flag: 'ending_join' }, id: 'end_dark' }, { if: { flag: 'route_expose' }, id: 'end_expose' }, { if: { minDao: 65 }, id: 'end_chinh' }, { if: { maxDao: 35 }, id: 'end_ma' }, { id: 'end_tan' }]); if (e) this.startDialogue(e); });
      if (id === 'm2_3') this.startDialogue('unseal', () => { const e = pickDialogue(game.p, [{ if: { minDao: 65 }, id: 'hoi2_end_chinh' }, { if: { maxDao: 35 }, id: 'hoi2_end_ma' }, { id: 'hoi2_end_tan' }]); if (e) this.time.delayedCall(300, () => this.startDialogue(e)); });
    }
    persist();
    this.refreshHud();
  }

  private startBattle(i: number) {
    this.launchBattle(this.foes[i].def.group, i, this.foes[i].elite);
  }

  private launchBattle(group: string[], foeIndex: number, elite = false, mult?: number) {
    this.busy = true;
    this.joyPtr = null; this.joyVec.set(0, 0);
    this.savePos();
    this.scene.pause();
    this.scene.launch('Battle', { enemies: group, foeIndex, elite, mult });
  }

  private openMenu() {
    if (this.busy || this.runner) return;
    this.busy = true;
    this.savePos();
    this.scene.pause();
    const tx = this.player.x / TS, ty = this.player.y / TS;
    const calm = !this.foes.some((f) => this.foeAlive(f) && Math.hypot(f.spr.x - this.player.x, f.spr.y - this.player.y) < MED.calmRadiusTiles * TS);
    const au = auraAt(this.map, tx, ty);
    this.scene.launch('Menu', { calm, aura: au.value, auraLabel: au.label, area: this.map.name });
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
    this.hud.setText(`${p.name} · ${r.name} tầng ${p.stage} · ${p.exp}/${expNeeded(p)} · ${p.gold} LT${p.party.length ? ` · +${p.party.length}` : ''}\n${this.map.name} · ${formatHour(gameHour(p))}`);
    const mq = p.quests.active.map((id) => getQuest(p, id)).filter(Boolean);
    this.questText.setY(this.hud.y + this.hud.height + 2);
    this.questText.setText(mq.length ? mq.map((q: any) => `${q.type === 'main' ? '★' : '·'} ${q.title}: ${q.desc}`).join('\n') : '(Hết nhiệm vụ trong chương này)');
  }

  private toast(msg: string) {
    const t = label(this, W / 2, 90, msg, { fontSize: '10px', backgroundColor: '#1d2a5bdd', padding: { x: 6, y: 3 }, wordWrap: { width: 420 }, align: 'center' }).setOrigin(0.5).setDepth(200);
    this.tweens.add({ targets: t, alpha: 0, y: 70, delay: 1800, duration: 500, onComplete: () => t.destroy() });
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
    if (done.length) this.pendingProgress.push(...done);
  }

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

  /* ───────────── Vô Tận Tháp ───────────── */
  private startTower(floor: number) {
    this.towerFloor = floor;
    this.runTowerFloor();
  }

  private runTowerFloor() {
    const f = this.towerFloor;
    const enemies = floorEnemies(game.p, f);
    this.toast(`Vô Tận Tháp — tầng ${f}${f % 10 === 0 && towerBossName(game.p) ? ` (thủ vệ: ${towerBossName(game.p)})` : ''}`);
    this.launchBattle(enemies, -2, false, floorMult(f));
  }

  private onTowerResult(won: boolean) {
    const p = game.p;
    const f = this.towerFloor;
    if (!won) {
      this.towerFloor = 0;
      this.toast(`Rơi khỏi tháp ở tầng ${f}. Kỷ lục: tầng ${p.towerBest}.`);
      persist();
      return;
    }
    const r = clearFloor(p, f);
    const reward = `${r.label}: +${r.gold} LT${r.item ? ` và ${r.item.n} ${r.item.id === 'huyet_tham' ? 'Huyết Sâm' : 'Phá Cảnh Đan'}` : ''}.`;
    DIALOGUES.__tower = { start: 'a', nodes: { a: { who: 'Tháp Linh', text: `Vượt tầng ${f}! ${reward} Kỷ lục của ngươi: tầng ${p.towerBest}. Leo tiếp tầng ${f + 1}?`, choices: [{ text: `Leo tiếp lên tầng ${f + 1}.`, goto: null, do: [{ tower: f + 1 }] }, { text: 'Dừng ở đây, xuống tháp.', goto: null }] } } };
    persist();
    this.time.delayedCall(300, () => this.startDialogue('__tower'));
  }

  private endDialogue() {
    this.clearDialogUi();
    const r = this.runner;
    this.runner = null;
    const shop = r?.out.openShop;
    const fight = r?.out.battle;
    const tower = r?.out.tower;
    const after = this.afterDialog; this.afterDialog = undefined;
    after?.();
    const done = this.pendingProgress.splice(0);
    if (done.length) this.progress(done);
    persist();
    this.refreshHud();
    this.syncFollowers();
    if (tower) this.startTower(tower);
    else if (fight?.length) this.launchBattle(fight, -1);
    else if (shop) this.openShop(shop.vendor, shop.tab);
  }
}
