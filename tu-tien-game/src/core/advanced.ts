import { factionMap, FACTIONS, formationMap, FORMATIONS, lawMap, LAWS } from './data';
import { DAY_SECONDS } from './time';
import type { PlayerState } from './types';

/**
 * Hệ thống mở ở Nguyên Anh / Hóa Thần (Phần 2):
 *  - Trận pháp (Nguyên Anh): học và bày một trận, có lợi + hại đi kèm, áp dụng cho cả đội trong mọi trận đấu.
 *  - Thế lực (Nguyên Anh): gia nhập một phe, tích điểm cống hiến để thăng chức, nhận bổng lộc và phúc lợi.
 *  - Pháp tắc (Hóa Thần): chọn một pháp tắc, đổi luật chơi trong chiến đấu.
 */

/* ───────────── Trận pháp ───────────── */
export interface FormationFx { atkMul: number; defMul: number; spdMul: number; takenMul: number; mpRegen: number; hpRegenPct: number }

export function formationFx(p: Pick<PlayerState, 'formation'>): FormationFx {
  const f = p.formation ? (formationMap.get(p.formation) as any) : null;
  return { atkMul: f?.atkMul ?? 1, defMul: f?.defMul ?? 1, spdMul: f?.spdMul ?? 1, takenMul: f?.takenMul ?? 1, mpRegen: f?.mpRegen ?? 0, hpRegenPct: f?.hpRegenPct ?? 0 };
}

export function learnFormation(p: PlayerState, id: string): { ok: boolean; msg: string } {
  const f = formationMap.get(id) as any;
  if (!f) return { ok: false, msg: 'Không có trận này.' };
  if (!p.unlockedSystems.includes('tran_phap')) return { ok: false, msg: 'Cần mở khóa Trận pháp (Nguyên Anh).' };
  if (p.formations.includes(id)) return { ok: false, msg: 'Đã học trận này.' };
  if (p.gold < f.price) return { ok: false, msg: `Cần ${f.price} linh thạch.` };
  p.gold -= f.price;
  p.formations.push(id);
  return { ok: true, msg: `Đã học ${f.name}.` };
}

export function setFormation(p: PlayerState, id: string | null): { ok: boolean; msg: string } {
  if (id !== null && !p.formations.includes(id)) return { ok: false, msg: 'Chưa học trận này.' };
  p.formation = id;
  return { ok: true, msg: id ? `Đã bày ${(formationMap.get(id) as any).name}.` : 'Đã thu trận.' };
}

/* ───────────── Thế lực ───────────── */
export interface FactionPerks { atkMul: number; defMul: number; hpMul: number; spdAdd: number; expMul: number; discount: number; stipend: number }
const NO_PERKS: FactionPerks = { atkMul: 1, defMul: 1, hpMul: 1, spdAdd: 0, expMul: 1, discount: 0, stipend: 0 };

export function rankIndex(p: Pick<PlayerState, 'faction'>): number {
  if (!p.faction) return -1;
  const f = factionMap.get(p.faction.id) as any;
  let r = 0;
  f.ranks.forEach((rk: any, i: number) => { if (p.faction!.points >= rk.points) r = i; });
  return r;
}

export function factionPerks(p: Pick<PlayerState, 'faction'>): FactionPerks {
  if (!p.faction) return NO_PERKS;
  const rk = (factionMap.get(p.faction.id) as any).ranks[rankIndex(p)];
  return { atkMul: rk.atkMul ?? 1, defMul: rk.defMul ?? 1, hpMul: rk.hpMul ?? 1, spdAdd: rk.spdAdd ?? 0, expMul: rk.expMul ?? 1, discount: rk.discount ?? 0, stipend: rk.stipend ?? 0 };
}

export function canJoin(p: PlayerState, id: string): { ok: boolean; reason?: string } {
  const f = factionMap.get(id) as any;
  if (!f) return { ok: false, reason: 'Không có thế lực này.' };
  if (!p.unlockedSystems.includes('the_luc')) return { ok: false, reason: 'Cần mở khóa Thế lực (Nguyên Anh).' };
  if (p.faction) return { ok: false, reason: 'Bạn đã thuộc một thế lực. Hãy rời đi trước.' };
  for (const [k, v] of Object.entries(f.req ?? {})) if ((p.rep[k] ?? 0) < (v as number)) return { ok: false, reason: `Cần danh vọng ${k.replace('_', ' ')} ≥ ${v}.` };
  return { ok: true };
}

export function joinFaction(p: PlayerState, id: string): { ok: boolean; msg: string } {
  const c = canJoin(p, id);
  if (!c.ok) return { ok: false, msg: c.reason! };
  p.faction = { id, points: 0, lastClaim: p.playtime };
  return { ok: true, msg: `Gia nhập ${(factionMap.get(id) as any).name}.` };
}

/** Rời thế lực: mất toàn bộ điểm cống hiến. */
export function leaveFaction(p: PlayerState): { ok: boolean; msg: string } {
  if (!p.faction) return { ok: false, msg: 'Bạn không thuộc thế lực nào.' };
  p.faction = null;
  return { ok: true, msg: 'Đã rời thế lực, mất toàn bộ điểm cống hiến.' };
}

export function addContribution(p: PlayerState, n: number): void {
  if (p.faction) p.faction.points += n;
}

/** Quyên góp linh thạch lấy điểm cống hiến (10 LT = 1 điểm). */
export function donate(p: PlayerState, gold: number): { ok: boolean; msg: string } {
  if (!p.faction) return { ok: false, msg: 'Bạn chưa thuộc thế lực nào.' };
  if (gold < 10 || p.gold < gold) return { ok: false, msg: 'Không đủ linh thạch (tối thiểu 10).' };
  const pts = Math.floor(gold / 10);
  p.gold -= pts * 10;
  p.faction.points += pts;
  return { ok: true, msg: `Quyên góp ${pts * 10} LT, +${pts} điểm cống hiến.` };
}

/** Bổng lộc: mỗi ngày game nhận `stipend` LT, tích tối đa 3 ngày. */
export function pendingStipend(p: PlayerState): number {
  if (!p.faction) return 0;
  const days = Math.min(3, (p.playtime - p.faction.lastClaim) / DAY_SECONDS);
  return Math.floor(days * factionPerks(p).stipend);
}

export function claimStipend(p: PlayerState): { ok: boolean; msg: string } {
  const g = pendingStipend(p);
  if (g <= 0) return { ok: false, msg: 'Chưa có bổng lộc để nhận.' };
  p.gold += g;
  p.faction!.lastClaim = p.playtime;
  return { ok: true, msg: `Nhận bổng lộc ${g} LT.` };
}

export const factionList = () => FACTIONS;

/* ───────────── Pháp tắc ───────────── */
export interface LawPerks { softcap?: number; healOnKill?: number; dodge?: number; elemBonus?: boolean; critBonus?: number; critDmg?: number }

export function lawPerks(p: Pick<PlayerState, 'law'>): LawPerks {
  const l = p.law ? (lawMap.get(p.law) as any) : null;
  return l ? { softcap: l.softcap, healOnKill: l.healOnKill, dodge: l.dodge, elemBonus: l.elemBonus, critBonus: l.critBonus, critDmg: l.critDmg } : {};
}

export const LAW_CHANGE_COST = 2000;

export function chooseLaw(p: PlayerState, id: string): { ok: boolean; msg: string } {
  if (!lawMap.has(id)) return { ok: false, msg: 'Không có pháp tắc này.' };
  if (!p.unlockedSystems.includes('phap_tac')) return { ok: false, msg: 'Cần mở khóa Pháp tắc (Hóa Thần).' };
  if (p.law === id) return { ok: false, msg: 'Đang tu pháp tắc này.' };
  const cost = p.law ? LAW_CHANGE_COST : 0;
  if (p.gold < cost) return { ok: false, msg: `Đổi pháp tắc tốn ${cost} linh thạch.` };
  p.gold -= cost;
  p.law = id;
  return { ok: true, msg: `Lĩnh ngộ ${(lawMap.get(id) as any).name}.` };
}

export const ALL_LAWS = LAWS;
export const ALL_FORMATIONS = FORMATIONS;
