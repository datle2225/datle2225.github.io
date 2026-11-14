import { computeStats } from './stats';
import type { PlayerState } from './types';

/** Sinh lực / linh lực hiện tại của người chơi giữa các trận (undefined = đầy). */
export const REGEN_WALK = 0.004; // mỗi giây (tỉ lệ tối đa) khi đi ngoài trời: ~4 phút để đầy
export const REGEN_SAFE = 0.02; // trong thôn/thành an toàn: ~50 giây
export const DEFEAT_HP = 0.5; // thua trận tỉnh lại với 50% sinh lực

export function curHp(p: PlayerState): number {
  const max = computeStats(p).hp;
  return Math.max(1, Math.min(max, Math.round(p.hp ?? max)));
}
export function curMp(p: PlayerState): number {
  const max = computeStats(p).mp;
  return Math.max(0, Math.min(max, Math.round(p.mp ?? max)));
}
export function setVitals(p: PlayerState, hp: number, mp: number) {
  const s = computeStats(p);
  p.hp = Math.max(1, Math.min(s.hp, Math.round(hp)));
  p.mp = Math.max(0, Math.min(s.mp, Math.round(mp)));
}
export function restoreFull(p: PlayerState) { p.hp = undefined; p.mp = undefined; }
export function heal(p: PlayerState, hpFrac: number, mpFrac: number) {
  const s = computeStats(p);
  setVitals(p, curHp(p) + s.hp * hpFrac, curMp(p) + s.mp * mpFrac);
}
export function regen(p: PlayerState, seconds: number, safe: boolean) {
  if (p.hp === undefined && p.mp === undefined) return;
  heal(p, (safe ? REGEN_SAFE : REGEN_WALK) * seconds, (safe ? REGEN_SAFE : REGEN_WALK) * seconds);
  const s = computeStats(p);
  if (curHp(p) >= s.hp && curMp(p) >= s.mp) restoreFull(p);
}
export const isFull = (p: PlayerState) => p.hp === undefined && p.mp === undefined;
