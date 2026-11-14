import { enemyMap, REALMS } from './data';
import { huntPool } from './bounty';
import { Rng } from './rng';
import { expNeeded } from './progression';
import type { PlayerState } from './types';

/**
 * Vô Tận Tháp: nội dung chơi lại không giới hạn.
 * Mỗi tầng là một trận; kẻ địch theo cảnh giới của người chơi và mạnh dần theo tầng (+7% HP/Công mỗi tầng).
 * Cứ 10 tầng gặp một boss của cảnh giới. Thua thì kết thúc lượt leo (không bị phạt tu vi). Tầng cao nhất được lưu.
 */
export const FLOOR_STEP = 0.07;
export const BOSS_EVERY = 10;
export const MILESTONE_EVERY = 5;

/** Boss tương ứng từng cảnh giới (không có thì dùng quái thường mạnh hơn). */
export const REALM_BOSS: Record<number, string> = {
  1: 'boss_huyet_anh_truong_lao', 2: 'doc_thu_tien_sinh', 3: 'huyet_anh_mon_chu', 4: 'thien_phong_kiem_chu', 5: 'hu_khong_thu_ho', 6: 'chien_than_tan_hon', 7: 'thien_dao_su_gia',
};

export const floorMult = (floor: number) => 1 + FLOOR_STEP * (floor - 1);

export function floorEnemies(p: PlayerState, floor: number, rng: Rng = new Rng(floor * 7919 + p.realmIndex)): string[] {
  const boss = REALM_BOSS[p.realmIndex];
  if (floor % BOSS_EVERY === 0 && boss) return [boss];
  const pool = huntPool(p.realmIndex);
  const fallback = pool.length ? pool : ['soi_hoang'];
  const n = Math.min(3, 1 + Math.floor((floor - 1) / 4));
  return Array.from({ length: n }, () => rng.pick(fallback));
}

export interface FloorReward { gold: number; exp: number; item?: { id: string; n: number }; label: string }

export function floorReward(p: PlayerState, floor: number): FloorReward {
  const scale = 1 + p.realmIndex * 0.9;
  const gold = Math.round(40 * scale * floor * (floor % BOSS_EVERY === 0 ? 3 : 1));
  const exp = Math.round(expNeeded(p) * 0.01 * floor);
  const out: FloorReward = { gold, exp, label: `Tầng ${floor}` };
  if (floor % MILESTONE_EVERY === 0) {
    out.item = floor % BOSS_EVERY === 0 ? { id: 'pha_canh_dan', n: 1 } : { id: 'huyet_tham', n: 2 + Math.floor(floor / 5) };
    out.gold = Math.round(out.gold * 1.5);
    out.label = `Tầng ${floor} (mốc thưởng)`;
  }
  return out;
}

/** Nhận thưởng tầng vừa vượt; cập nhật tầng cao nhất. */
export function clearFloor(p: PlayerState, floor: number): FloorReward {
  const r = floorReward(p, floor);
  p.gold += r.gold;
  if (r.item) p.inventory[r.item.id] = (p.inventory[r.item.id] ?? 0) + r.item.n;
  p.towerBest = Math.max(p.towerBest, floor);
  p.counters.tower_floors = (p.counters.tower_floors ?? 0) + 1;
  return r;
}

export const realmName = (p: PlayerState) => REALMS[p.realmIndex].name;
export const towerBossName = (p: PlayerState) => { const b = REALM_BOSS[p.realmIndex]; return b ? enemyMap.get(b).name : null; };
