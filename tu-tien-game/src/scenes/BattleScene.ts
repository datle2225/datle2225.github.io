import Phaser from 'phaser';
import { W, H } from '../main';
import { game, persist } from '../state';
import { button, label, bar } from '../ui/widgets';
import { Battle, makeUnit, type Unit } from '../core/battle';
import { Rng } from '../core/rng';
import { computeStats } from '../core/stats';
import { availableSkills, questEvent, rollDrops } from '../core/session';
import { enemyMap, skillMap, materialMap, statusMap } from '../core/data';
import { gainExp, levelUpStages } from '../core/progression';

interface Init { enemies: string[]; foeIndex: number }
const TEX: Record<string, string> = { soi_hoang: 'wolf', yeu_xa: 'snake', huyet_anh_do_de: 'cultist', boss_huyet_anh_truong_lao: 'elder_boss' };

export class BattleScene extends Phaser.Scene {
  private b!: Battle;
  private init0!: Init;
  private sprites = new Map<string, Phaser.GameObjects.Sprite>();
  private hp = new Map<string, ReturnType<typeof bar>>();
  private mp!: ReturnType<typeof bar>;
  private ui: Phaser.GameObjects.GameObject[] = [];
  private logText!: Phaser.GameObjects.Text;
  private logLines: string[] = [];
  private timeline: Phaser.GameObjects.GameObject[] = [];
  private target: string | null = null;
  private comboIdx = 0;
  private locked = false;
  private player!: Unit;
  private enemyIds: string[] = [];

  constructor() { super('Battle'); }

  init(d: Init) { this.init0 = d; }

  create() {
    const p = game.p;
    this.sprites.clear(); this.hp.clear(); this.ui = []; this.logLines = []; this.comboIdx = 0; this.locked = false;
    this.add.rectangle(0, 0, W, H, 0x101a36).setOrigin(0);
    this.add.rectangle(0, 200, W, 160, 0x1b2a4a).setOrigin(0);

    const stats = computeStats(p);
    const skills = availableSkills(p).map((s) => s.id);
    this.player = makeUnit('player', p.name, 'player', stats, skills, 'none');
    const units: Unit[] = [this.player];
    this.enemyIds = [];
    this.init0.enemies.forEach((eid, i) => {
      const e = enemyMap.get(eid);
      const id = `e${i}`;
      this.enemyIds.push(id);
      units.push(makeUnit(id, e.name, 'enemy', e.stats, e.skills, e.element));
    });
    this.b = new Battle(units, new Rng());
    this.target = this.enemyIds[0];

    this.addUnit(this.player, 130, 140, 'player', 0x6aa0ff);
    this.init0.enemies.forEach((eid, i) => this.addUnit(this.b.units.find((u) => u.id === this.enemyIds[i])!, 480, 130 + i * 50, TEX[eid] ?? 'wolf', 0xff6a6a, enemyMap.get(eid)?.boss ? 5 : 3));
    this.mp = bar(this, 90, 114, 80, 5, 0x4aa8ff);

    this.logText = label(this, 10, 232, '', { fontSize: '9px', wordWrap: { width: 300 }, lineSpacing: 1, color: '#c8d0ff' });
    label(this, 10, 2, 'THỨ TỰ HÀNH ĐỘNG', { fontSize: '8px', color: '#6b7391' });
    this.push(`Gặp ${this.b.units.filter((u) => u.side === 'enemy').map((u) => u.name).join(', ')}!`);
    this.drawTimeline();
    this.step();
  }

  private addUnit(u: Unit, x: number, y: number, tex: string, color: number, scale = 3) {
    const spr = this.add.sprite(x, y, tex).setScale(scale);
    if (u.side === 'enemy') {
      spr.setInteractive({ useHandCursor: true }).on('pointerdown', () => { this.target = u.id; this.drawTargetMark(); });
      spr.setFlipX(true);
    }
    this.sprites.set(u.id, spr);
    label(this, x - 40, y - 48 - scale * 4, u.name, { fontSize: '9px', color: '#ffffff' });
    const hb = bar(this, x - 40, y - 36 - scale * 4 + 12, 80, 6, color);
    this.hp.set(u.id, hb);
    this.updateBars();
  }

  private drawTargetMark() {
    this.children.getAll().filter((o: any) => o.name === 'tmark').forEach((o) => o.destroy());
    const s = this.target ? this.sprites.get(this.target) : null;
    if (s) { const m = this.add.text(s.x, s.y - 60, '▼', { fontFamily: 'monospace', fontSize: '14px', color: '#ffe38a' }).setOrigin(0.5); m.name = 'tmark'; }
  }

  private updateBars() {
    for (const u of this.b.units) this.hp.get(u.id)?.set(u.hp / u.stats.hp);
    this.mp?.set(this.player.mp / this.player.stats.mp);
  }

  private drawTimeline() {
    this.timeline.forEach((o) => o.destroy());
    this.timeline = [];
    const pv = this.b.preview(9);
    pv.forEach((e, i) => {
      const x = 10 + i * 34;
      const col = e.unit.side === 'player' ? 0x3a6ad8 : 0xb03a3a;
      const r = this.add.rectangle(x, 14, 30, 22, col).setOrigin(0).setStrokeStyle(i === 0 ? 2 : 1, i === 0 ? 0xffe38a : 0x8fa2ff);
      const t = this.add.text(x + 15, 25, e.unit.name.slice(0, 4), { fontFamily: 'monospace', fontSize: '8px', color: '#fff' }).setOrigin(0.5);
      this.timeline.push(r, t);
    });
    // trạng thái
    const st = this.b.units.filter((u) => u.alive && u.statuses.length).map((u) => `${u.name}: ${u.statuses.map((s) => `${statusMap.get(s.id)?.name}(${s.left})`).join(' ')}`).join('   ');
    const stT = this.add.text(10, 40, st, { fontFamily: 'monospace', fontSize: '8px', color: '#ffd37a' });
    this.timeline.push(stT);
    this.drawTargetMark();
  }

  private push(t: string) {
    this.logLines.push(t);
    this.logText.setText(this.logLines.slice(-6).join('\n'));
  }

  private clearUi() { this.ui.forEach((o) => o.destroy()); this.ui = []; }

  private showButtons() {
    this.clearUi();
    const p = game.p;
    const skills = availableSkills(p);
    const bw = 98, bh = 26;
    let x = 330, y = 238, n = 0;
    const add = (b: { bg: any; t: any }) => this.ui.push(b.bg, b.t);
    for (const s of skills) {
      const ok = this.b.canUse(this.player, s.id);
      add(button(this, x, y, bw, bh, `${s.name}${s.mp ? ` (${s.mp})` : ''}`, () => this.playerAct(s.id), { enabled: ok && !this.locked }));
      x += bw + 4;
      if (++n % 3 === 0) { x = 330; y += bh + 4; }
    }
    // combo preset
    const preset = (p.comboPresets[p.activeCombo] ?? []).filter((id) => skillMap.has(id) && this.player.skills.includes(id));
    if (preset.length) {
      const nx = this.peekCombo(preset);
      const sk = nx ? skillMap.get(nx.id) : null;
      add(button(this, 330, 322, 150, 28, sk ? `Combo ▶ ${sk.name}` : 'Combo: thiếu linh lực', () => { if (nx) { this.comboIdx = nx.next; this.playerAct(nx.id); } }, { enabled: !!sk && !this.locked, color: 0x6a3a8c }));
    }
    const pill = p.inventory.hoi_huyet_dan ?? 0;
    add(button(this, 484, 322, 70, 28, `Đan (${pill})`, () => this.usePill(), { enabled: pill > 0 && !this.locked, color: 0x2a6a4a }));
    const boss = enemyMap.get(this.init0.enemies[0])?.boss;
    add(button(this, 558, 322, 74, 28, 'Bỏ chạy', () => this.end(false, true), { enabled: !boss && !this.locked, color: 0x6a2a2a }));
  }

  /** Xem chiêu kế tiếp trong combo (không đổi trạng thái); bỏ qua chiêu thiếu linh lực. */
  private peekCombo(preset: string[]): { id: string; next: number } | null {
    for (let i = 0; i < preset.length; i++) {
      const at = (this.comboIdx + i) % preset.length;
      if (this.b.canUse(this.player, preset[at])) return { id: preset[at], next: (at + 1) % preset.length };
    }
    return null;
  }

  private usePill() {
    const p = game.p;
    if ((p.inventory.hoi_huyet_dan ?? 0) <= 0) return;
    p.inventory.hoi_huyet_dan--;
    this.player.hp = Math.min(this.player.stats.hp, this.player.hp + Math.round(this.player.stats.hp * 0.35));
    this.player.nextAt += 100;
    this.push('Dùng Hồi Huyết Đan, hồi 35% sinh lực.');
    this.floatText(this.player.id, '+HP', '#7aff9a');
    this.updateBars(); this.drawTimeline(); this.step();
  }

  private playerAct(skillId: string) {
    if (this.locked || this.b.current()?.id !== 'player') return;
    const tgt = this.b.units.find((u) => u.id === this.target && u.alive) ?? this.b.alive('enemy')[0];
    const ev = this.b.act(this.player, skillId, tgt);
    this.player.mp = Math.min(this.player.stats.mp, this.player.mp + 2);
    this.afterAct(ev);
  }

  private afterAct(ev: ReturnType<Battle['act']>) {
    for (const e of ev) {
      this.push(e.text);
      if (e.type === 'hit' && e.target) {
        this.floatText(e.target, `${e.value}${e.crit ? '!' : ''}`, e.crit ? '#ffe38a' : '#ffffff');
        const s = this.sprites.get(e.target);
        if (s) this.tweens.add({ targets: s, x: s.x + 6, duration: 40, yoyo: true, repeat: 2 });
      }
      if (e.type === 'combo') { const t = label(this, W / 2, 80, `COMBO x${this.b.combo}`, { fontSize: '18px', color: '#ffe38a' }).setOrigin(0.5); this.tweens.add({ targets: t, alpha: 0, y: 50, duration: 900, onComplete: () => t.destroy() }); }
      if (e.type === 'heal' && e.target) this.floatText(e.target, `+${e.value}`, '#7aff9a');
      if (e.type === 'dot' && e.target) this.floatText(e.target, `${e.value}`, '#ff9a4a');
    }
    for (const u of this.b.units) if (!u.alive) this.sprites.get(u.id)?.setAlpha(0.2);
    this.updateBars(); this.drawTimeline();
    if (!this.b.alive('enemy').find((u) => u.id === this.target)) { this.target = this.b.alive('enemy')[0]?.id ?? null; this.drawTargetMark(); }
    if (this.b.winner) { this.locked = true; this.clearUi(); this.time.delayedCall(900, () => this.end(this.b.winner === 'player')); return; }
    this.step();
  }

  private floatText(id: string, text: string, color: string) {
    const s = this.sprites.get(id);
    if (!s) return;
    const t = this.add.text(s.x, s.y - 30, text, { fontFamily: 'monospace', fontSize: '14px', color, stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
    this.tweens.add({ targets: t, y: t.y - 30, alpha: 0, duration: 800, onComplete: () => t.destroy() });
  }

  private step() {
    if (this.b.winner) return;
    const cur = this.b.current();
    if (!cur) return;
    if (cur.side === 'player') { this.locked = false; this.showButtons(); return; }
    this.locked = true; this.clearUi(); this.showButtons();
    this.time.delayedCall(650, () => {
      const id = this.b.aiPick(cur);
      const ev = this.b.act(cur, id);
      if (!ev.length) this.b.act(cur, cur.skills[0]);
      this.afterAct(ev);
    });
  }

  private end(won: boolean, fled = false) {
    const p = game.p;
    let msg = '';
    if (won) {
      let exp = 0;
      for (const eid of this.init0.enemies) {
        const e = enemyMap.get(eid);
        exp += e.exp;
        for (const [id, n] of Object.entries(rollDrops(eid, Math.random))) {
          if (id === 'linh_thach_ha') p.gold += n * 5; else p.inventory[id] = (p.inventory[id] ?? 0) + n;
          msg += `\n+${n} ${(materialMap.get(id) as any)?.name ?? id}`;
        }
        questEvent(p, 'battle', eid, 1);
      }
      const g = gainExp(p, exp);
      const ups = levelUpStages(p);
      msg = `Chiến thắng! +${g.gained} tu vi${ups ? ` · Lên ${ups} tầng!` : ''}${g.breakthroughReady ? '\nĐã đầy tu vi – hãy độ kiếp (M).' : ''}${msg}`;
    } else if (fled) {
      msg = 'Ngươi chạy thoát.';
    } else {
      p.gold = Math.floor(p.gold * 0.9);
      msg = 'Bại trận... Mất 10% linh thạch. Ngươi tỉnh lại ở nơi an toàn.';
    }
    persist();
    this.clearUi();
    const bg = this.add.rectangle(W / 2, H / 2, 380, 150, 0x0b1020, 0.97).setStrokeStyle(2, 0xffe38a);
    this.add.text(W / 2, H / 2 - 20, msg, { fontFamily: 'monospace', fontSize: '12px', color: '#fff', align: 'center', wordWrap: { width: 350 } }).setOrigin(0.5);
    button(this, W / 2 - 50, H / 2 + 40, 100, 28, 'Tiếp tục', () => {
      const ow = this.scene.get('Overworld');
      this.scene.stop();
      this.scene.resume('Overworld');
      ow.events.emit('battle-end', { won, foeIndex: this.init0.foeIndex });
    });
    bg.setDepth(0);
  }
}
