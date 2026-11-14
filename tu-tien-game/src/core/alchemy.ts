import { recipeMap, REALMS } from './data';
import type { Rng } from './rng';
import type { PlayerState } from './types';

export interface AlchemyResult {
  ok: boolean;
  reason?: string;
  grade: number; // 1..9 phẩm
  pillLines: number; // số đan văn 0..3
  potency: number; // hệ số hiệu lực
  price: number;
}

export function canBrew(p: PlayerState, recipeId: string): { ok: boolean; reason?: string } {
  const r = recipeMap.get(recipeId);
  if (!r) return { ok: false, reason: 'Không có đan phương.' };
  if (!p.knownRecipes.includes(recipeId)) return { ok: false, reason: 'Chưa học đan phương này.' };
  const need = REALMS.findIndex((x) => x.id === r.needRealm);
  if (p.realmIndex < need) return { ok: false, reason: 'Cảnh giới chưa đủ.' };
  if (r.branch !== 'all' && r.branch !== p.branchId) return { ok: false, reason: 'Đan này chỉ dành cho nhánh khác.' };
  for (const ing of r.ingredients) {
    if ((p.inventory[ing.id] ?? 0) < ing.n) return { ok: false, reason: 'Thiếu nguyên liệu.' };
  }
  return { ok: true };
}

/**
 * Hỏa hầu 0..1 (độ gần vùng nhiệt lý tưởng trong mini-game).
 * Độ khó của đan phương làm vùng lý tưởng hẹp hơn.
 */
export function brew(p: PlayerState, recipeId: string, heatScore: number, rng: Rng): AlchemyResult {
  const chk = canBrew(p, recipeId);
  if (!chk.ok) return { ok: false, reason: chk.reason, grade: 0, pillLines: 0, potency: 0, price: 0 };
  const r = recipeMap.get(recipeId)!;
  for (const ing of r.ingredients) p.inventory[ing.id] -= ing.n;
  const difficultyPenalty = (r.difficulty - 1) * 0.06;
  const q = Math.max(0, Math.min(1, heatScore - difficultyPenalty + rng.range(-0.05, 0.05)));
  if (q < 0.15) return { ok: false, reason: 'Lò nổ, đan hỏng!', grade: 0, pillLines: 0, potency: 0, price: 0 };
  const grade = Math.max(1, Math.min(9, Math.ceil(q * 9)));
  const pillLines = q > 0.92 ? 3 : q > 0.8 ? 2 : q > 0.6 ? 1 : 0;
  const potency = 0.7 + q * 0.6 + pillLines * 0.1;
  const price = Math.round(r.basePrice * (0.6 + q * 0.8) * (1 + pillLines * 0.25));
  p.inventory[recipeId] = (p.inventory[recipeId] ?? 0) + 1;
  return { ok: true, grade, pillLines, potency, price };
}
