import { beastMap, skillMap, statusMap } from './data';
import { Rng } from './rng';
import type { Element, Skill, Stats } from './types';

/**
 * Chiến đấu theo thanh thời gian (CTB):
 * mỗi đơn vị có `nextAt`; ai nhỏ nhất đi trước. Sau khi ra chiêu, nextAt += cost * 100 / tốc độ hiệu dụng.
 * → Tốc độ cao tự nhiên đi nhiều lần hơn, chiêu nặng đẩy lượt sau xa hơn.
 */
export interface Unit {
  id: string;
  name: string;
  side: 'player' | 'enemy';
  element: Element;
  stats: Stats;
  hp: number;
  mp: number;
  skills: string[];
  nextAt: number;
  statuses: { id: string; left: number; src?: number }[];
  alive: boolean;
  /** Boss nhiều pha: khi HP dưới ngưỡng `at` (tỉ lệ) sẽ đổi chiêu / tăng sức mạnh. */
  phases?: Phase[];
  phaseIdx?: number;
  takenMul?: number; // nhân sát thương nhận vào (trận pháp)
  hpRegenPct?: number; // hồi % HP mỗi lần hành động (trận pháp)
  perks?: { softcap?: number; healOnKill?: number; dodge?: number; elemBonus?: boolean; critDmg?: number }; // pháp tắc
  reviveFrac?: number; // thoát xác: hồi sinh một lần mỗi trận với tỉ lệ HP này
  revived?: boolean;
  tempoResist?: number; // 0..1: nhân với độ trễ bị đẩy lùi (boss kháng đảo nhịp)
  cooldowns?: Record<string, number>; // chiêu → số lần hành động còn lại để dùng lại
  master?: string; // id chủ nhân (linh thú)
  tex?: string; // texture hiển thị (linh thú)
}

export interface Phase { at: number; text: string; skills?: string[]; atkMul?: number; spdMul?: number; heal?: number }

export interface BattleEvent {
  type: 'hit' | 'heal' | 'status' | 'dot' | 'miss' | 'end' | 'combo' | 'cap' | 'trap' | 'phase' | 'summon' | 'tempo' | 'revive';
  actor?: string;
  target?: string;
  value?: number;
  crit?: boolean;
  text: string;
}

export const MAX_CONSECUTIVE = 3;
const SPD_SOFTCAP = 150;

/** Tốc độ hiệu dụng: trên ngưỡng mềm chỉ còn 50% hiệu quả, tránh khóa cứng đối thủ. */
export function effectiveSpeed(spd: number, softcap = SPD_SOFTCAP): number {
  return spd <= softcap ? spd : softcap + (spd - softcap) * 0.5;
}

export function unitSpeed(u: Unit): number {
  let m = 1;
  for (const s of u.statuses) m *= statusMap.get(s.id)?.spdMul ?? 1;
  return Math.max(10, effectiveSpeed(u.stats.spd, u.perks?.softcap) * m);
}

/** Ngũ hành tương khắc: Kim>Mộc>Thổ>Thủy>Hỏa>Kim. */
const BEATS: Record<string, string> = { kim: 'moc', moc: 'tho', tho: 'thuy', thuy: 'hoa', hoa: 'kim' };
export function elementMult(atk: Element, def: Element): number {
  if (atk === 'none' || def === 'none') return 1;
  if (BEATS[atk] === def) return 1.3;
  if (BEATS[def] === atk) return 0.8;
  return 1;
}

export class Battle {
  units: Unit[];
  rng: Rng;
  log: BattleEvent[] = [];
  clock = 0;
  winner: 'player' | 'enemy' | null = null;
  private lastActor: string | null = null;
  private streak = 0;
  combo = 0;
  /** Linh lực hồi mỗi lần phe người chơi hành động. */
  mpRegen = 2;

  constructor(units: Unit[], rng = new Rng()) {
    this.units = units;
    this.rng = rng;
    for (const u of units) u.nextAt = (100 * 100) / unitSpeed(u);
  }

  alive(side?: 'player' | 'enemy') {
    return this.units.filter((u) => u.alive && (!side || u.side === side));
  }

  private byNext(list: Unit[]) {
    return [...list].sort((a, b) => a.nextAt - b.nextAt || unitSpeed(b) - unitSpeed(a) || a.id.localeCompare(b.id));
  }

  /** Người sắp hành động, có áp dụng giới hạn hành động liên tiếp. */
  current(): Unit | null {
    if (this.winner) return null;
    const order = this.byNext(this.alive());
    const first = order[0];
    if (!first) return null;
    if (first.id === this.lastActor && this.streak >= MAX_CONSECUTIVE) {
      const other = order.find((u) => u.side !== first.side);
      if (other) return other;
    }
    return first;
  }

  /** Dự đoán thứ tự cho thanh timeline (không đổi trạng thái). */
  preview(n = 8): { unit: Unit; at: number }[] {
    const sim = this.units.filter((u) => u.alive).map((u) => ({ u, at: u.nextAt }));
    const out: { unit: Unit; at: number }[] = [];
    for (let i = 0; i < n; i++) {
      sim.sort((a, b) => a.at - b.at || unitSpeed(b.u) - unitSpeed(a.u));
      const s = sim[0];
      out.push({ unit: s.u, at: s.at });
      s.at += (100 * 100) / unitSpeed(s.u);
    }
    return out;
  }

  canUse(u: Unit, skillId: string): boolean {
    const s = skillMap.get(skillId);
    if (!s || !u.skills.includes(skillId) || u.mp < s.mp) return false;
    if (s.hpCost && u.hp <= Math.round(u.stats.hp * s.hpCost)) return false; // không tự sát bằng hiến tế
    if ((u.cooldowns?.[skillId] ?? 0) > 0) return false;
    if (s.summon && this.beastOf(u)) return false; // mỗi lần chỉ một linh thú
    if (s.pick === 'beast' && !this.beastOf(u)) return false;
    return true;
  }

  hasStatus(u: Unit, id: string) {
    return u.statuses.some((s) => s.id === id);
  }

  private addStatus(u: Unit, id: string, srcAtk?: number) {
    const def = statusMap.get(id);
    if (!def) return;
    const ex = u.statuses.find((s) => s.id === id);
    if (ex) { ex.left = def.duration; if (srcAtk !== undefined) ex.src = Math.max(ex.src ?? 0, srcAtk); }
    else u.statuses.push({ id, left: def.duration, src: srcAtk });
  }

  private removeStatus(u: Unit, id: string) {
    u.statuses = u.statuses.filter((s) => s.id !== id);
  }

  private defOf(u: Unit) {
    let m = 1;
    for (const s of u.statuses) m *= statusMap.get(s.id)?.defMul ?? 1;
    return u.stats.def * m;
  }

  private damageTakenMul(u: Unit) {
    let m = 1;
    for (const s of u.statuses) m *= statusMap.get(s.id)?.damageTakenMul ?? 1;
    return m;
  }

  /** Tính sát thương một đòn (public để test). */
  calcDamage(att: Unit, def: Unit, sk: Skill, comboMult = 1, crit = false): number {
    const raw = att.stats.atk * sk.power - this.defOf(def) * 0.5;
    let el = elementMult(sk.element === 'none' ? att.element : sk.element, def.element);
    if (att.perks?.elemBonus) el = el > 1 ? 1.5 : el < 1 ? 1 : el; // Ngũ Hành Pháp Tắc
    const variance = this.rng.range(0.95, 1.05);
    return Math.max(1, Math.round(raw * el * variance * comboMult * (crit ? (att.perks?.critDmg ?? 1.5) : 1) * this.damageTakenMul(def) * (def.takenMul ?? 1)));
  }

  act(actor: Unit, skillId: string, target?: Unit): BattleEvent[] {
    const ev: BattleEvent[] = [];
    const sk = skillMap.get(skillId);
    if (!sk || !actor.alive || this.winner) return ev;
    if (!this.canUse(actor, skillId)) return ev;
    this.clock = Math.max(this.clock, actor.nextAt); // thời điểm hiện tại = lúc người này ra tay
    for (const k of Object.keys(actor.cooldowns ?? {})) if (actor.cooldowns![k] > 0) actor.cooldowns![k]--; // mỗi lần hành động giảm hồi chiêu
    if (sk.cd) (actor.cooldowns ??= {})[skillId] = sk.cd;
    actor.mp -= sk.mp;
    if (sk.hpCost) {
      const c = Math.round(actor.stats.hp * sk.hpCost);
      actor.hp -= c;
      ev.push({ type: 'dot', target: actor.id, value: c, text: `${actor.name} hy sinh ${c} sinh lực.` });
    }
    // bẫy đã đặt lên người hành động: nổ ngay khi họ ra tay
    const trapDelay = this.triggerTraps(actor, ev);
    if (!actor.alive) { this.checkEnd(ev); this.log.push(...ev); return ev; }

    // giới hạn hành động liên tiếp
    if (this.lastActor === actor.id) this.streak++;
    else {
      this.lastActor = actor.id;
      this.streak = 1;
      if (actor.side === 'player') this.combo = 0;
    }

    const opp = actor.side === 'player' ? 'enemy' : 'player';
    const foe = target && target.alive && target.side === opp ? target : this.byNext(this.alive(opp))[0];

    if (sk.target === 'self' || sk.target === 'ally' || !foe) {
      const subject = sk.target === 'ally' ? (sk.pick === 'beast' ? (this.beastOf(actor) ?? actor) : this.weakestAlly(actor, target)) : actor;
      if (sk.summon) this.summon(actor, sk.summon, ev);
      if (sk.advance) {
        subject.nextAt = Math.min(subject.nextAt, Math.max(this.clock, subject.nextAt - (sk.advance * 100) / unitSpeed(subject))); // chỉ kéo sớm, không bao giờ làm chậm
        ev.push({ type: 'tempo', actor: actor.id, target: subject.id, text: `${subject.name} hành động sớm hơn!` });
      }
      if (sk.heal) {
        const v = Math.round(subject.stats.hp * sk.heal);
        subject.hp = Math.min(subject.stats.hp, subject.hp + v);
        ev.push({ type: 'heal', actor: actor.id, target: subject.id, value: v, text: `${actor.name} dùng ${sk.name}${subject === actor ? '' : ` lên ${subject.name}`}, hồi ${v} sinh lực.` });
      }
      if (sk.gives) {
        this.addStatus(subject, sk.gives, actor.stats.atk);
        ev.push({ type: 'status', actor: actor.id, target: subject.id, text: `${subject.name} nhận ${statusMap.get(sk.gives)?.name}.` });
      }
    } else {
      const hits = sk.hits ?? 1;
      let comboMult = 1;
      const reqTarget = sk.requiresOn === 'self' ? actor : foe;
      if (sk.requires && this.hasStatus(reqTarget, sk.requires)) {
        comboMult = sk.bonus ?? 1.5;
        if (sk.requiresOn !== 'self') this.removeStatus(foe, sk.requires);
        if (actor.side === 'player') this.combo++;
        ev.push({ type: 'combo', actor: actor.id, target: foe.id, text: `Cộng hưởng ${statusMap.get(sk.requires)?.name}! x${comboMult}` });
      }
      for (let i = 0; i < hits && foe.alive; i++) {
        // Hư Không Pháp Tắc: né hoàn toàn một đòn
        if (foe.perks?.dodge && this.rng.chance(foe.perks.dodge)) {
          ev.push({ type: 'miss', actor: actor.id, target: foe.id, text: `${foe.name} né hoàn toàn đòn của ${actor.name}!` });
          continue;
        }
        const crit = this.rng.chance(actor.stats.crit);
        const dmg = this.calcDamage(actor, foe, sk, comboMult, crit);
        foe.hp = Math.max(0, foe.hp - dmg);
        ev.push({ type: 'hit', actor: actor.id, target: foe.id, value: dmg, crit, text: `${actor.name} dùng ${sk.name} gây ${dmg} sát thương${crit ? ' (bạo kích)' : ''}.` });
        if (sk.lifesteal) actor.hp = Math.min(actor.stats.hp, actor.hp + Math.round(dmg * sk.lifesteal));
        if (foe.hp <= 0) {
          if (this.markDead(foe, ev)) {
            ev.push({ type: 'status', target: foe.id, text: `${foe.name} gục ngã.` });
            if (actor.perks?.healOnKill) { // Sinh Tử Pháp Tắc
              const h = Math.round(actor.stats.hp * actor.perks.healOnKill);
              actor.hp = Math.min(actor.stats.hp, actor.hp + h);
              ev.push({ type: 'heal', actor: actor.id, target: actor.id, value: h, text: `${actor.name} hấp thụ sinh khí, hồi ${h} sinh lực.` });
            }
          }
        }
      }
      if (sk.delay && foe.alive) {
        foe.nextAt += (sk.delay * (foe.tempoResist ?? 1) * 100) / unitSpeed(foe);
        ev.push({ type: 'tempo', actor: actor.id, target: foe.id, text: `Nhịp của ${foe.name} bị đảo lộn, lượt của họ bị lùi lại!` });
      }
      if (sk.gives && foe.alive) {
        this.addStatus(foe, sk.gives, actor.stats.atk);
        ev.push({ type: 'status', actor: actor.id, target: foe.id, text: `${foe.name} dính ${statusMap.get(sk.gives)?.name}.` });
      }
    }

    // đẩy lượt kế tiếp
    actor.nextAt += ((sk.cost + trapDelay) * 100) / unitSpeed(actor);
    if (this.streak >= MAX_CONSECUTIVE) {
      const others = this.alive(actor.side === 'player' ? 'enemy' : 'player');
      if (others.length) ev.push({ type: 'cap', text: `${actor.name} đã ra ${MAX_CONSECUTIVE} đòn liên tiếp, đối thủ kịp phản ứng.` });
    }

    if (actor.side === 'player' && actor.alive) {
      actor.mp = Math.min(actor.stats.mp, actor.mp + this.mpRegen);
      if (actor.hpRegenPct) { const h = Math.round(actor.stats.hp * actor.hpRegenPct); actor.hp = Math.min(actor.stats.hp, actor.hp + h); }
    }
    for (const u of this.units) if (u.alive && u.phases) this.checkPhase(u, ev);
    this.tickStatuses(actor, ev);
    this.checkEnd(ev);
    this.log.push(...ev);
    return ev;
  }

  beastOf(u: Unit): Unit | undefined {
    return this.units.find((x) => x.alive && x.master === u.id);
  }

  /** Trả về true nếu thật sự chết; false nếu thoát xác (Nguyên Anh) hồi sinh một lần mỗi trận. */
  private markDead(u: Unit, ev?: BattleEvent[]): boolean {
    if (u.reviveFrac && !u.revived) {
      u.revived = true;
      u.hp = Math.max(1, Math.round(u.stats.hp * u.reviveFrac));
      u.statuses = [];
      ev?.push({ type: 'revive', target: u.id, value: u.hp, text: `${u.name} thoát xác Nguyên Anh, hồi sinh với ${u.hp} sinh lực!` });
      return false;
    }
    u.alive = false;
    if (u.master) { const m = this.units.find((x) => x.id === u.master); if (m) this.removeStatus(m, 'thu_tam'); }
    return true;
  }

  /** Triệu hồi linh thú: chỉ số theo tỉ lệ so với chủ nhân. */
  private summon(master: Unit, beastId: string, ev: BattleEvent[]) {
    const d = beastMap.get(beastId);
    if (!d) return;
    const r = d.ratio;
    const stats = { hp: Math.round(master.stats.hp * r.hp), mp: Math.round(master.stats.mp * r.mp), atk: Math.round(master.stats.atk * r.atk), def: Math.round(master.stats.def * r.def), spd: d.spd, crit: 0.05 };
    const u = makeUnit(`b_${master.id}_${beastId}`, d.name, master.side, stats, d.skills, d.element);
    u.master = master.id;
    u.tex = d.tex;
    u.nextAt = master.nextAt + 5000 / unitSpeed(u);
    this.units.push(u);
    this.addStatus(master, 'thu_tam');
    ev.push({ type: 'summon', actor: master.id, target: u.id, text: `${master.name} triệu hồi ${d.name}!` });
  }

  /** Kích nổ mọi bẫy trên `u`. Trả về độ trễ cộng thêm cho lượt kế. */
  private triggerTraps(u: Unit, ev: BattleEvent[]): number {
    let delay = 0;
    for (const s of [...u.statuses]) {
      const def = statusMap.get(s.id);
      if (def?.kind !== 'trap') continue;
      const d = Math.max(1, Math.round(def.trapAtk !== undefined ? (s.src ?? 20) * def.trapAtk : u.stats.hp * (def.trapPct ?? 0.1)));
      u.hp = Math.max(0, u.hp - d);
      delay += def.trapDelay ?? 0;
      this.removeStatus(u, s.id);
      ev.push({ type: 'trap', target: u.id, value: d, text: `${def.name} phát nổ dưới chân ${u.name}, gây ${d} sát thương!` });
      if (u.hp <= 0) { if (this.markDead(u, ev)) ev.push({ type: 'status', target: u.id, text: `${u.name} gục ngã.` }); break; }
    }
    return delay;
  }

  private checkPhase(u: Unit, ev: BattleEvent[]) {
    const idx = u.phaseIdx ?? 0;
    const ph = u.phases?.[idx];
    if (!ph || u.hp / u.stats.hp > ph.at) return;
    u.phaseIdx = idx + 1;
    if (ph.skills) u.skills = [...ph.skills];
    if (ph.atkMul) u.stats = { ...u.stats, atk: Math.round(u.stats.atk * ph.atkMul) };
    if (ph.spdMul) u.stats = { ...u.stats, spd: Math.round(u.stats.spd * ph.spdMul) };
    if (ph.heal) u.hp = Math.min(u.stats.hp, u.hp + Math.round(u.stats.hp * ph.heal));
    ev.push({ type: 'phase', target: u.id, text: ph.text });
  }

  /** Đồng đội cần hồi nhất (tỉ lệ máu thấp nhất), hoặc mục tiêu chỉ định nếu cùng phe. */
  weakestAlly(actor: Unit, prefer?: Unit): Unit {
    if (prefer && prefer.alive && prefer.side === actor.side) return prefer;
    return [...this.alive(actor.side)].sort((a, b) => a.hp / a.stats.hp - b.hp / b.stats.hp)[0] ?? actor;
  }

  /** Chọn mục tiêu cho AI: ưu tiên kẻ yếu máu nhất (có chút ngẫu nhiên). */
  aiTarget(u: Unit, skillId: string): Unit | undefined {
    const sk = skillMap.get(skillId);
    if (sk?.pick === 'beast') return this.beastOf(u);
    if (sk?.target === 'ally') return this.weakestAlly(u);
    const foes = this.alive(u.side === 'player' ? 'enemy' : 'player');
    if (!foes.length) return undefined;
    return [...foes].sort((a, b) => a.hp / a.stats.hp + this.rng.range(0, 0.4) - (b.hp / b.stats.hp + this.rng.range(0, 0.4)))[0];
  }

  private tickStatuses(u: Unit, ev: BattleEvent[]) {
    if (!u.alive) return;
    for (const s of [...u.statuses]) {
      const def = statusMap.get(s.id);
      if (def?.kind === 'dot' && (!!def.dotPct || !!def.dotAtk)) {
        const d = Math.max(1, Math.round(def.dotAtk !== undefined ? (s.src ?? 20) * def.dotAtk : u.stats.hp * (def.dotPct ?? 0)));
        u.hp = Math.max(0, u.hp - d);
        ev.push({ type: 'dot', target: u.id, value: d, text: `${u.name} chịu ${d} sát thương từ ${def.name}.` });
        if (u.hp <= 0) {
          if (this.markDead(u, ev)) ev.push({ type: 'status', target: u.id, text: `${u.name} gục ngã.` });
        }
      }
      s.left--;
      if (s.left <= 0) this.removeStatus(u, s.id);
    }
  }

  private checkEnd(ev: BattleEvent[]) {
    if (!this.alive('enemy').length) this.winner = 'player';
    else if (!this.alive('player').length) this.winner = 'enemy';
    if (this.winner) ev.push({ type: 'end', text: this.winner === 'player' ? 'Chiến thắng!' : 'Bại trận...' });
  }

  /** AI đơn giản: ưu tiên chiêu có cộng hưởng, hồi máu khi đồng đội yếu, rồi chiêu mạnh còn đủ linh lực. */
  aiPick(u: Unit): string {
    const foes = this.alive(u.side === 'player' ? 'enemy' : 'player');
    const foe = this.byNext(foes)[0];
    const allies = this.alive(u.side);
    const lowAlly = Math.min(...allies.map((a) => a.hp / a.stats.hp));
    const options = u.skills.filter((id) => this.canUse(u, id)).map((id) => skillMap.get(id)!);
    if (!options.length) return u.skills.find((id) => skillMap.get(id)?.mp === 0) ?? u.skills[0];
    const scored = options.map((s) => {
      let w = s.power + 0.5;
      if (s.requires && foe && this.hasStatus(s.requiresOn === 'self' ? u : foe, s.requires)) w += (s.bonus ?? 1.5) * 2;
      if (s.summon) w = this.beastOf(u) ? 0 : 7;
      else if (s.advance && !s.power && !s.heal) w = s.pick === 'beast' ? (this.beastOf(u) ? 1.2 : 0) : 0.9;
      else if (s.heal) w = s.advance ? 0.8 : lowAlly < 0.55 ? 3 + (1 - lowAlly) * 3 : 0.05;
      else if (s.target === 'self' && u.statuses.length) w = 0.05;
      return { id: s.id, weight: w + this.rng.next() };
    });
    return scored.sort((a, b) => b.weight - a.weight)[0].id;
  }
}

export function makeUnit(id: string, name: string, side: 'player' | 'enemy', stats: Stats, skills: string[], element: Element = 'none', phases?: Phase[], tempoResist?: number): Unit {
  return { id, name, side, element, stats: { ...stats }, hp: stats.hp, mp: stats.mp, skills, nextAt: 0, statuses: [], alive: true, phases, phaseIdx: 0, tempoResist };
}
