import Phaser from 'phaser';
import { W, H } from '../main';
import { game, persist } from '../state';
import { button, label, bar } from '../ui/widgets';
import { type Battle, type Unit } from '../core/battle';
import { buildBattle } from '../core/encounter';
import { Rng } from '../core/rng';
import { availableSkills, questEvent, rollDrops } from '../core/session';
import { enemyMap, skillMap, materialMap, statusMap } from '../core/data';
import { ELITE, applyDefeatPenalty, difficultyOf } from '../core/difficulty';
import { audio } from '../audio';
import { gainExp, levelUpStages } from '../core/progression';

interface Init { enemies: string[]; foeIndex: number; returnTo?: string; elite?: boolean }
const TEX: Record<string, string> = { soi_hoang: 'wolf', yeu_xa: 'snake', huyet_anh_do_de: 'cultist', boss_huyet_anh_truong_lao: 'elder_boss', tam_ma: 'player', huyet_quai: 'cultist', doc_trung: 'snake', doc_thu_tien_sinh: 'elder_boss', xich_hoa_thu: 'wolf', sa_trung: 'snake', mac_gia_chu: 'npc_sage', cuop_duong: 'cultist', bang_lang: 'wolf', huyet_ve: 'cultist', bang_yeu: 'snake', huyet_anh_mon_chu: 'elder_boss', luc_van_sinh: 'npc_sage', ma_tu_lang_thang: 'cultist' };

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
  private completedQuests: string[] = [];
  private pillsLeft = 3;

  constructor() { super('Battle'); }

  init(d: Init) { this.init0 = d; }

  create() {
    const p = game.p;
    this.sprites.clear(); this.hp.clear(); this.ui = []; this.logLines = []; this.comboIdx = 0; this.locked = false;
    this.add.rectangle(0, 0, W, H, 0x101a36).setOrigin(0);
    this.add.rectangle(0, 200, W, 160, 0x1b2a4a).setOrigin(0);

    this.pillsLeft = difficultyOf(p).pills;
    const built = buildBattle(p, this.init0.enemies, new Rng(), true, { elite: !!this.init0.elite });
    this.b = built.battle;
    this.player = built.player;
    this.enemyIds = built.enemyUnitIds;
    this.target = this.enemyIds[0];

    const allies = this.b.units.filter((u) => u.side === 'player');
    allies.forEach((u, i) => this.addUnit(u, 130, 130 + i * 70 - (allies.length - 1) * 20, u.id === 'player' ? 'player' : 'npc_girl2', 0x6aa0ff));
    this.init0.enemies.forEach((eid, i) => {
      const n = this.init0.enemies.length;
      this.addUnit(this.b.units.find((u) => u.id === this.enemyIds[i])!, 480, 130 + i * 70 - (n - 1) * 25, TEX[eid] ?? 'wolf', 0xff6a6a, enemyMap.get(eid)?.boss ? 5 : 3);
    });
    const ps = this.sprites.get('player')!;
    if (this.init0.enemies.includes('tam_ma')) this.enemyIds.forEach((id) => { const sp = this.sprites.get(id); sp?.setTint(0x9a5aff); });
    this.mp = bar(this, ps.x - 40, ps.y - 28, 80, 5, 0x4aa8ff);

    this.logText = label(this, 10, 232, '', { fontSize: '9px', wordWrap: { width: 300 }, lineSpacing: 1, color: '#c8d0ff' });
    label(this, 10, 2, 'THỨ TỰ HÀNH ĐỘNG', { fontSize: '8px', color: '#6b7391' });
    this.push(`Gặp ${this.b.units.filter((u) => u.side === 'enemy').map((u) => u.name).join(', ')}!`);
    audio.music(enemyMap.get(this.init0.enemies[0])?.boss ? 'boss' : 'battle');
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
    const bw = 98, bh = 24;
    let x = 330, y = 232, n = 0;
    const add = (b: { bg: any; t: any }) => this.ui.push(b.bg, b.t);
    for (const s of skills) {
      const ok = this.b.canUse(this.player, s.id);
      add(button(this, x, y, bw, bh, `${s.name}${s.mp ? ` (${s.mp})` : ''}`, () => this.playerAct(s.id), { enabled: ok && !this.locked }));
      x += bw + 4;
      if (++n % 3 === 0) { x = 330; y += bh + 3; }
    }
    // combo preset
    const preset = (p.comboPresets[p.activeCombo] ?? []).filter((id) => skillMap.has(id) && this.player.skills.includes(id));
    if (preset.length) {
      const nx = this.peekCombo(preset);
      const sk = nx ? skillMap.get(nx.id) : null;
      add(button(this, 330, 322, 150, 28, sk ? `Combo ▶ ${sk.name}` : 'Combo: thiếu linh lực', () => { if (nx) { this.comboIdx = nx.next; this.playerAct(nx.id); } }, { enabled: !!sk && !this.locked, color: 0x6a3a8c }));
    }
    const pill = p.inventory.hoi_huyet_dan ?? 0;
    add(button(this, 484, 322, 70, 28, `Đan ${pill}·${this.pillsLeft}/${difficultyOf(p).pills}`, () => this.usePill(), { enabled: pill > 0 && this.pillsLeft > 0 && !this.locked, color: 0x2a6a4a }));
    const boss = enemyMap.get(this.init0.enemies[0])?.boss || this.init0.enemies.includes('tam_ma');
    add(button(this, 558, 322, 74, 28, 'Bỏ chạy', () => this.end(false, true), { enabled: !boss && difficultyOf(p).canFlee && !this.locked, color: 0x6a2a2a }));
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
    if ((p.inventory.hoi_huyet_dan ?? 0) <= 0 || this.pillsLeft <= 0) return;
    this.pillsLeft--;
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
    this.afterAct(ev);
  }

  private afterAct(ev: ReturnType<Battle['act']>) {
    for (const e of ev) {
      this.push(e.text);
      if (e.type === 'hit') audio.sfx(e.crit ? 'crit' : 'hit');
      if (e.type === 'heal') audio.sfx('heal');
      if (e.type === 'combo') audio.sfx('combo');
      if (e.type === 'summon' && e.target) {
        const bu = this.b.units.find((u) => u.id === e.target);
        if (bu) { this.addUnit(bu, 215, 175, bu.tex ?? 'wolf', 0x6affc8, 2); const sp = this.sprites.get(bu.id); if (sp) { sp.setAlpha(0); this.tweens.add({ targets: sp, alpha: 1, duration: 400 }); } audio.sfx('heal'); }
      }
      if (e.type === 'tempo') audio.sfx('combo');
      if (e.type === 'revive') { audio.sfx('levelup'); this.cameras.main.flash(300, 160, 255, 220); if (e.target) this.floatText(e.target, 'THOÁT XÁC', '#9affd8'); }
      if (e.type === 'trap') { audio.sfx('crit'); if (e.target) this.floatText(e.target, `${e.value}`, '#ffb84a'); }
      if (e.type === 'phase') { audio.sfx('thunder'); this.cameras.main.shake(250, 0.01); this.cameras.main.flash(250, 255, 60, 60); const t = label(this, W / 2, 110, e.text, { fontSize: '13px', color: '#ff8a8a', backgroundColor: '#200a0acc', padding: { x: 6, y: 3 }, wordWrap: { width: 460 }, align: 'center' }).setOrigin(0.5); this.tweens.add({ targets: t, alpha: 0, y: 90, delay: 1500, duration: 600, onComplete: () => t.destroy() }); }
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
    if (cur.id === 'player') { this.locked = false; this.showButtons(); return; }
    // địch và đồng hành do AI điều khiển
    this.locked = true; this.clearUi(); this.showButtons();
    this.time.delayedCall(650, () => {
      if (this.b.winner) return;
      const id = this.b.aiPick(cur);
      let ev = this.b.act(cur, id, this.b.aiTarget(cur, id));
      if (!ev.length) ev = this.b.act(cur, cur.skills.find((sid) => skillMap.get(sid)?.mp === 0) ?? cur.skills[0]);
      if (!ev.length) cur.nextAt += 100; // không làm được gì → nhường lượt, tránh kẹt
      this.afterAct(ev);
    });
  }

  private end(won: boolean, fled = false) {
    const p = game.p;
    let msg = '';
    const completed: string[] = [];
    if (won) {
      let exp = 0;
      const mult = difficultyOf(p).reward * (this.init0.elite ? ELITE.reward : 1);
      for (const eid of this.init0.enemies) {
        const e = enemyMap.get(eid);
        exp += Math.round(e.exp * mult);
        for (const [id, n] of Object.entries(rollDrops(eid, () => Math.random() / mult))) {
          if (id === 'linh_thach_ha') p.gold += n * 5; else p.inventory[id] = (p.inventory[id] ?? 0) + n;
          msg += `\n+${n} ${(materialMap.get(id) as any)?.name ?? id}`;
        }
        completed.push(...questEvent(p, 'battle', eid, 1));
        if (e.flagOnWin) p.flags[e.flagOnWin] = true;
      }
      const g = gainExp(p, exp);
      const ups = levelUpStages(p);
      audio.sfx('levelup');
      msg = `Chiến thắng! +${g.gained} tu vi${ups ? ` · Lên ${ups} tầng!` : ''}${g.breakthroughReady ? '\nĐã đầy tu vi – hãy độ kiếp (M).' : ''}${msg}`;
    } else if (fled) {
      msg = 'Ngươi chạy thoát.';
    } else {
      const mirror = this.init0.enemies.includes('tam_ma');
      const lost = mirror ? { gold: 0, exp: 0 } : applyDefeatPenalty(p); // tâm ma: chỉ ảnh hưởng đạo tâm
      msg = mirror ? 'Tâm ma thắng thế...' : `Bại trận... Mất ${lost.gold} linh thạch${lost.exp ? ` và ${lost.exp} tu vi` : ''}. Ngươi tỉnh lại ở nơi an toàn.`;
    }
    this.completedQuests = completed;
    persist();
    this.clearUi();
    const bg = this.add.rectangle(W / 2, H / 2, 380, 150, 0x0b1020, 0.97).setStrokeStyle(2, 0xffe38a);
    this.add.text(W / 2, H / 2 - 20, msg, { fontFamily: 'monospace', fontSize: '12px', color: '#fff', align: 'center', wordWrap: { width: 350 } }).setOrigin(0.5);
    button(this, W / 2 - 50, H / 2 + 40, 100, 28, 'Tiếp tục', () => {
      const back = this.init0.returnTo ?? 'Overworld';
      const ow = this.scene.get(back);
      this.scene.stop();
      this.scene.resume(back);
      ow.events.emit('battle-end', { won, fled, lost: !won && !fled, foeIndex: this.init0.foeIndex, completed: this.completedQuests });
    });
    bg.setDepth(0);
  }
}
