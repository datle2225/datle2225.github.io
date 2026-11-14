import Phaser from 'phaser';
import { W, H } from '../main';
import { button, label } from '../ui/widgets';
import { forgeMiniScore, heatBand, heatScore, heatStep, strikeScore, type HeatSim } from '../core/minigame';
import { audio } from '../audio';

interface Init { mode: 'forge' | 'alchemy'; param: any; parent: string; onDone: (score: number) => void }

const BAR_X = 60;
const BAR_W = 520;
const BAR_Y = 170;
const GAUGE_TOP = 70;
const GAUGE_H = 200;

/** Mini-game búa rèn (bấm đúng nhịp) & hỏa hầu (giữ nhiệt trong vùng xanh). Một nút duy nhất → chơi được bằng 1 ngón. */
export class MiniGameScene extends Phaser.Scene {
  private d!: Init;
  private heating = false;
  private finished = false;

  // rèn
  private cursor = 0;
  private dir = 1;
  private speed = 0.9;
  private center = 0.5;
  private zone = 0.3;
  private strikes: number[] = [];
  private readonly maxStrikes = 5;
  private cursorObj?: Phaser.GameObjects.Rectangle;
  private zoneObj?: Phaser.GameObjects.Rectangle;

  // luyện đan
  private sim: HeatSim = { temp: 0.1, inBand: 0, ticks: 0 };
  private band: [number, number] = [0.4, 0.7];
  private drift = 0;
  private driftTimer = 0;
  private heatObj?: Phaser.GameObjects.Rectangle;
  private elapsed = 0;
  private readonly duration = 9;

  private info!: Phaser.GameObjects.Text;

  constructor() { super('MiniGame'); }

  init(d: Init) { this.d = d; }

  create() {
    this.heating = false;
    this.finished = false;
    this.strikes = [];
    this.cursor = 0;
    this.dir = 1;
    this.speed = 0.9;
    this.sim = { temp: 0.1, inBand: 0, ticks: 0 };
    this.elapsed = 0;
    this.drift = 0;
    this.driftTimer = 0;

    const forge = this.d.mode === 'forge';
    this.add.rectangle(0, 0, W, H, 0x0b1020, 1).setOrigin(0).setInteractive();
    label(this, W / 2, 24, forge ? 'RÈN ĐỒ – Bấm đúng khi con trỏ vào vùng sáng' : 'LUYỆN ĐAN – Giữ nhiệt trong vùng xanh', { fontSize: '13px', color: '#ffe38a' }).setOrigin(0.5);
    this.info = label(this, W / 2, 50, '', { fontSize: '11px', color: '#c8d0ff' }).setOrigin(0.5);

    const bigBtn = this.add.rectangle(W / 2, H - 60, 300, 70, forge ? 0x8a4a1a : 0x2a6a4a).setStrokeStyle(2, 0xffffff).setInteractive();
    this.add.text(W / 2, H - 60, forge ? 'ĐẬP BÚA!' : 'GIỮ ĐỂ TĂNG LỬA', { fontFamily: 'monospace', fontSize: '18px', color: '#fff' }).setOrigin(0.5);
    bigBtn.on('pointerdown', () => this.press(true));
    bigBtn.on('pointerup', () => this.press(false));
    bigBtn.on('pointerout', () => this.press(false));
    this.input.keyboard!.on('keydown-SPACE', () => this.press(true));
    this.input.keyboard!.on('keyup-SPACE', () => this.press(false));
    button(this, W - 80, 8, 72, 24, 'Bỏ qua', () => this.finish(0.3), { color: 0x6a2a2a });

    if (forge) {
      this.zone = Math.max(0.1, (this.d.param.zone ?? 0.3) + Math.min(0.1, (this.d.param.level ?? 0) * 0.01) - 0.02);
      this.add.rectangle(BAR_X, BAR_Y, BAR_W, 30, 0x1a2140).setOrigin(0, 0.5).setStrokeStyle(2, 0x8fa2ff);
      this.newZone();
      this.cursorObj = this.add.rectangle(BAR_X, BAR_Y, 6, 44, 0xffffff);
    } else {
      this.band = heatBand(this.d.param.difficulty ?? 1);
      this.add.rectangle(W / 2, GAUGE_TOP + GAUGE_H / 2, 60, GAUGE_H, 0x1a2140).setStrokeStyle(2, 0x8fa2ff);
      const mid = (this.band[0] + this.band[1]) / 2;
      this.add.rectangle(W / 2, GAUGE_TOP + GAUGE_H * (1 - mid), 60, GAUGE_H * (this.band[1] - this.band[0]), 0x2fb04a, 0.6);
      this.heatObj = this.add.rectangle(W / 2, GAUGE_TOP + GAUGE_H, 56, 4, 0xff6a2a).setOrigin(0.5, 1);
      label(this, W / 2 + 46, GAUGE_TOP, 'Nóng', { fontSize: '9px', color: '#ff8a6a' });
      label(this, W / 2 + 46, GAUGE_TOP + GAUGE_H - 10, 'Nguội', { fontSize: '9px', color: '#6aa0ff' });
    }
  }

  private newZone() {
    this.center = 0.2 + Math.random() * 0.6;
    this.zoneObj?.destroy();
    this.zoneObj = this.add.rectangle(BAR_X + BAR_W * this.center, BAR_Y, BAR_W * this.zone, 30, 0xffd84a, 0.55);
  }

  private press(down: boolean) {
    if (this.finished) return;
    if (down && !this.heating && this.d.mode === 'forge') this.strike();
    this.heating = down;
  }

  private strike() {
    const s = strikeScore(this.cursor, this.center, this.zone);
    this.strikes.push(s);
    audio.sfx('hammer');
    const txt = s >= 0.95 ? 'HOÀN HẢO!' : s >= 0.6 ? 'Tốt' : s > 0.2 ? 'Lệch' : 'Trượt';
    const t = label(this, W / 2, 110, txt, { fontSize: '16px', color: s >= 0.6 ? '#ffe38a' : '#ff8a8a' }).setOrigin(0.5);
    this.tweens.add({ targets: t, alpha: 0, y: 90, duration: 600, onComplete: () => t.destroy() });
    this.cameras.main.shake(80, 0.004);
    this.speed += 0.18;
    if (this.strikes.length >= this.maxStrikes) {
      this.finished = true;
      this.time.delayedCall(700, () => this.finish(forgeMiniScore(this.strikes)));
    } else this.newZone();
  }

  update(_t: number, dtMs: number) {
    if (this.finished) return;
    const dt = Math.min(0.05, dtMs / 1000);
    if (this.d.mode === 'forge') {
      this.cursor += this.dir * this.speed * dt;
      if (this.cursor >= 1) { this.cursor = 1; this.dir = -1; }
      if (this.cursor <= 0) { this.cursor = 0; this.dir = 1; }
      this.cursorObj!.x = BAR_X + BAR_W * this.cursor;
      this.info.setText(`Nhát ${Math.min(this.strikes.length + 1, this.maxStrikes)}/${this.maxStrikes}`);
      return;
    }
    // hỏa hầu: nhiệt trôi nhẹ ngẫu nhiên để không thể giữ yên
    this.driftTimer -= dt;
    if (this.driftTimer <= 0) { this.drift = (Math.random() - 0.5) * 0.3; this.driftTimer = 0.6 + Math.random() * 0.8; }
    this.elapsed += dt;
    this.sim = heatStep(this.sim, this.heating, dt, this.band, this.drift);
    this.heatObj!.height = Math.max(2, GAUGE_H * this.sim.temp);
    const inside = this.sim.temp >= this.band[0] && this.sim.temp <= this.band[1];
    this.heatObj!.setFillStyle(inside ? 0x7aff9a : 0xff6a2a);
    this.info.setText(`Còn ${Math.max(0, this.duration - this.elapsed).toFixed(1)}s · Điểm hỏa hầu: ${(heatScore(this.sim) * 100).toFixed(0)}%`);
    if (this.elapsed >= this.duration) {
      this.finished = true;
      this.finish(heatScore(this.sim));
    }
  }

  private finish(score: number) {
    this.finished = true;
    const cb = this.d.onDone;
    const parent = this.d.parent;
    this.scene.stop();
    this.scene.resume(parent);
    cb(score);
  }
}
