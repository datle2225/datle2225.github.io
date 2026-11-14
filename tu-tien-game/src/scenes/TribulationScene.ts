import Phaser from 'phaser';
import { W, H } from '../main';
import { game, persist } from '../state';
import { button, label, bar } from '../ui/widgets';
import { TribulationRun, type TribChoice } from '../core/progression';
import { Rng } from '../core/rng';
import { REALMS, systemName } from '../core/data';
import { ownsSystem, enterChapter } from '../core/session';
import { audio } from '../audio';

interface Init { shield: number; usedPill: boolean }

const NAMES: Record<TribChoice, string> = { dodge: 'Né', guard: 'Đỡ', pill: 'Uống đan' };

/** Cảnh điện ảnh lôi kiếp: mỗi đợt sét người chơi chọn Né / Đỡ / Uống đan. */
export class TribulationScene extends Phaser.Scene {
  private run!: TribulationRun;
  private hpBar!: ReturnType<typeof bar>;
  private hero!: Phaser.GameObjects.Sprite;
  private sky!: Phaser.GameObjects.Rectangle;
  private btns: { destroy(): void }[] = [];
  private info!: Phaser.GameObjects.Text;
  private busy = false;
  private d!: Init;

  constructor() { super('Tribulation'); }
  init(d: Init) { this.d = d; }

  create() {
    const p = game.p;
    this.run = new TribulationRun(p, new Rng(), this.d.shield);
    this.busy = false;
    this.sky = this.add.rectangle(0, 0, W, H, 0x120c24).setOrigin(0);
    for (let i = 0; i < 6; i++) {
      const c = this.add.ellipse(Phaser.Math.Between(40, W - 40), Phaser.Math.Between(20, 90), Phaser.Math.Between(120, 220), Phaser.Math.Between(30, 50), 0x2a2140, 0.9);
      this.tweens.add({ targets: c, x: c.x + Phaser.Math.Between(-30, 30), duration: 2500 + i * 300, yoyo: true, repeat: -1 });
    }
    this.add.rectangle(0, 270, W, 90, 0x1d1730).setOrigin(0);
    this.hero = this.add.sprite(W / 2, 252, 'player').setScale(4);
    label(this, W / 2, 16, `${this.run.name}`, { fontSize: '16px', color: '#ffe38a' }).setOrigin(0.5);
    this.info = label(this, W / 2, 44, 'Mây đen kéo đến... Thiên lôi sắp giáng xuống!', { fontSize: '11px', color: '#c8d0ff' }).setOrigin(0.5);
    label(this, 10, 70, 'Sinh lực', { fontSize: '9px' });
    this.hpBar = bar(this, 10, 82, 160, 10, 0xd84a4a);
    this.hpBar.set(1);
    audio.music('tribulation');
    this.time.delayedCall(1200, () => this.askWave());
  }

  private clearBtns() { this.btns.forEach((b) => b.destroy()); this.btns = []; }

  private askWave() {
    this.clearBtns();
    this.info.setText(`Đợt sét ${this.run.wave + 1}/${this.run.waves} — chọn cách ứng phó`);
    const pills = game.p.inventory.hoi_huyet_dan ?? 0;
    (['dodge', 'guard', 'pill'] as TribChoice[]).forEach((c, i) => {
      const enabled = c !== 'pill' || pills > 0;
      const label2 = c === 'pill' ? `Uống đan (${pills})` : NAMES[c];
      this.btns.push(button(this, 90 + i * 150, 300, 140, 40, label2, () => this.doWave(c), { enabled, color: c === 'dodge' ? 0x2a5a8c : c === 'guard' ? 0x5a4a2a : 0x2a6a4a }));
    });
    const hint = label(this, W / 2, 346, 'Né: dựa vào Tốc độ (có thể trượt). Đỡ: dựa vào Thủ. Đan: hồi 20% máu.', { fontSize: '8px', color: '#8f9bd0' }).setOrigin(0.5);
    this.btns.push({ destroy: () => hint.destroy() });
  }

  private doWave(choice: TribChoice) {
    if (this.busy) return;
    this.busy = true;
    this.clearBtns();
    if (choice === 'pill') game.p.inventory.hoi_huyet_dan--;
    const r = this.run.step(choice);
    audio.sfx('thunder');
    this.cameras.main.flash(200, 255, 255, 255);
    this.cameras.main.shake(300, 0.012);
    this.drawBolt();
    this.hpBar.set(r.hp / this.run.maxHp);
    const msg = r.dodged ? `Né thành công! Chỉ chịu ${r.dmg}.` : `Nhận ${r.dmg} sát thương!`;
    this.info.setText(`Đợt ${r.wave}: ${msg}`);
    const t = label(this, W / 2, 200, `-${r.dmg}`, { fontSize: '20px', color: r.dodged ? '#7aff9a' : '#ff6a6a' }).setOrigin(0.5);
    this.tweens.add({ targets: t, y: 160, alpha: 0, duration: 900, onComplete: () => t.destroy() });
    this.tweens.add({ targets: this.hero, alpha: 0.3, duration: 60, yoyo: true, repeat: 4 });
    this.time.delayedCall(1200, () => {
      if (r.done) return this.finish(!r.dead);
      this.busy = false;
      this.askWave();
    });
  }

  private drawBolt() {
    const g = this.add.graphics();
    g.lineStyle(4, 0xffffff, 1);
    let x = this.hero.x + Phaser.Math.Between(-20, 20);
    let y = 0;
    g.beginPath();
    g.moveTo(x, y);
    while (y < this.hero.y - 30) {
      x += Phaser.Math.Between(-24, 24);
      y += Phaser.Math.Between(20, 40);
      g.lineTo(x, y);
    }
    g.strokePath();
    this.tweens.add({ targets: g, alpha: 0, duration: 350, onComplete: () => g.destroy() });
  }

  private finish(success: boolean) {
    const p = game.p;
    const { lost } = this.run.finish(success);
    this.clearBtns();
    audio.music(null);
    let msg: string;
    if (success) {
      const r2 = REALMS[p.realmIndex];
      const fresh = r2.unlocks.filter((u) => !ownsSystem(p, u));
      p.unlockedSystems.push(...fresh);
      if (p.realmIndex === 1) enterChapter(p, 4);
      if (p.realmIndex === 2) enterChapter(p, 6);
      p.daoHeart = Math.min(100, p.daoHeart + 3);
      msg = `ĐỘ KIẾP THÀNH CÔNG!\nBước vào ${r2.name}.\nMở khóa: ${fresh.map(systemName).join(', ') || '—'}`;
      audio.sfx('levelup');
      this.sky.setFillStyle(0x3a2a6a);
      this.cameras.main.flash(600, 255, 230, 140);
    } else {
      msg = `Độ kiếp thất bại...\nMất ${lost} tu vi. Hãy chuẩn bị kỹ hơn rồi thử lại.`;
      audio.sfx('fail');
    }
    persist();
    this.add.rectangle(W / 2, 150, 420, 120, 0x0b1020, 0.95).setStrokeStyle(2, success ? 0xffe38a : 0xff6a6a);
    this.add.text(W / 2, 140, msg, { fontFamily: 'monospace', fontSize: '13px', color: '#fff', align: 'center' }).setOrigin(0.5);
    button(this, W / 2 - 50, 296, 100, 32, 'Tiếp tục', () => {
      this.scene.stop();
      this.scene.resume('Menu');
      this.scene.get('Menu').events.emit('trib-done');
    });
  }
}
