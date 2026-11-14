import { ACHIEVEMENTS } from './data';
import { rankIndex } from './advanced';
import type { PlayerState } from './types';

/** Thống kê đơn giản dùng cho thành tựu. */
export function bump(p: PlayerState, key: string, n = 1): void {
  p.counters[key] = (p.counters[key] ?? 0) + n;
}

export function conditionMet(p: PlayerState, c: any): boolean {
  if (c.counter && (p.counters[c.counter] ?? 0) < c.min) return false;
  if (c.realm !== undefined && p.realmIndex < c.realm) return false;
  if (c.flag && !p.flags[c.flag]) return false;
  if (c.flags && !c.flags.every((f: string) => p.flags[f])) return false;
  if (c.gold !== undefined && p.gold < c.gold) return false;
  if (c.factionRank !== undefined && (!p.faction || rankIndex(p) < c.factionRank)) return false;
  if (c.formations !== undefined && p.formations.length < c.formations) return false;
  if (c.law && !p.law) return false;
  if (c.difficulty && !c.difficulty.includes(p.difficulty)) return false;
  if (c.tower !== undefined && p.towerBest < c.tower) return false;
  if (c.ngPlus !== undefined && p.ngPlus < c.ngPlus) return false;
  return true;
}

/** Mở các thành tựu mới đủ điều kiện, trả thưởng một lần. Trả về danh sách vừa mở. */
export function checkAchievements(p: PlayerState): any[] {
  const fresh: any[] = [];
  for (const a of ACHIEVEMENTS) {
    if (p.achievements.includes(a.id) || !conditionMet(p, a.cond)) continue;
    p.achievements.push(a.id);
    p.gold += a.reward?.gold ?? 0;
    fresh.push(a);
  }
  return fresh;
}

/** Kết quả này giữ nguyên qua các lần chơi lại. */
export const progressOf = (p: PlayerState) => ({ done: p.achievements.length, total: ACHIEVEMENTS.length });
