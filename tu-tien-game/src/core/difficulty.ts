import type { PlayerState } from './types';

/**
 * Độ khó. `normal` giữ nguyên số liệu gốc (các test cân bằng dùng mức này).
 * Người chơi mới mặc định chọn "Khó" ở màn hình chính.
 */
export type Difficulty = PlayerState['difficulty'];

export interface DifficultyDef {
  id: Difficulty;
  name: string;
  desc: string;
  enemyHp: number; // nhân HP kẻ địch
  enemyAtk: number; // nhân Công kẻ địch
  enemyDef: number; // nhân Thủ kẻ địch
  reward: number; // nhân tu vi & rơi đồ
  pills: number; // số lần uống đan tối đa mỗi trận
  deathGold: number; // mất bao nhiêu % linh thạch khi thua
  deathExp: number; // mất bao nhiêu % tu vi hiện có khi thua
  canFlee: boolean;
}

export const DIFFICULTIES: DifficultyDef[] = [
  { id: 'normal', name: 'Thường', desc: 'Số liệu gốc. Uống đan tối đa 3 lần mỗi trận.', enemyHp: 1, enemyAtk: 1, enemyDef: 1, reward: 1, pills: 3, deathGold: 0.1, deathExp: 0, canFlee: true },
  { id: 'hard', name: 'Khó', desc: 'Địch HP/Công +10%, Thủ +5%. Thưởng +20%. Thua mất 15% linh thạch và 10% tu vi.', enemyHp: 1.1, enemyAtk: 1.1, enemyDef: 1.05, reward: 1.2, pills: 3, deathGold: 0.15, deathExp: 0.1, canFlee: true },
  { id: 'nightmare', name: 'Ác mộng', desc: 'Địch HP/Công +25%, Thủ +10%. Thưởng +50%. Uống đan tối đa 2 lần. Thua mất 25% linh thạch và 20% tu vi. Không bỏ chạy.', enemyHp: 1.25, enemyAtk: 1.25, enemyDef: 1.1, reward: 1.5, pills: 2, deathGold: 0.25, deathExp: 0.2, canFlee: false },
];

export const difficultyOf = (p: Pick<PlayerState, 'difficulty'>): DifficultyDef => DIFFICULTIES.find((d) => d.id === (p.difficulty ?? 'normal')) ?? DIFFICULTIES[0];

/** Kẻ địch tinh anh (★): mạnh hơn, thưởng gấp đôi. */
export const ELITE = { hp: 1.4, atk: 1.25, def: 1.15, reward: 2, chance: 0.12 } as const;

export function scaleEnemyStats<T extends { hp: number; atk: number; def: number }>(s: T, d: DifficultyDef, elite = false): T {
  const h = d.enemyHp * (elite ? ELITE.hp : 1), a = d.enemyAtk * (elite ? ELITE.atk : 1), df = d.enemyDef * (elite ? ELITE.def : 1);
  return { ...s, hp: Math.round(s.hp * h), atk: Math.round(s.atk * a), def: Math.round(s.def * df) };
}

/** Phạt khi thua trận. Trả về lượng mất để hiển thị. */
export function applyDefeatPenalty(p: PlayerState): { gold: number; exp: number } {
  const d = difficultyOf(p);
  const gold = Math.floor(p.gold * d.deathGold);
  const exp = Math.floor(p.exp * d.deathExp);
  p.gold -= gold;
  p.exp -= exp;
  return { gold, exp };
}
