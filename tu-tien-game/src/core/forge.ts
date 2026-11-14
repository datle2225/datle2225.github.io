import { ITEMS } from './data';
import type { Rng } from './rng';
import type { ItemInstance, Stats, StatKey } from './types';

export interface ForgeInput {
  baseId: string;
  /** Phẩm chất nguyên liệu 0..1 */
  materialQuality: number;
  /** Điểm mini-game búa (nhịp) 0..1 */
  skillScore: number;
  /** Cấp nghề rèn (tăng theo cảnh giới) */
  smithLevel: number;
  /** Dòng phụ muốn giữ lại khi rèn lại (khóa) */
  lockedAffixes?: ItemInstance['affixes'];
}

let uidCounter = 0;
export const newUid = () => `it_${Date.now().toString(36)}_${(uidCounter++).toString(36)}`;

/** Điểm chất lượng tổng 0..1 → quyết định độ hiếm. */
export function forgeScore(i: ForgeInput, rng: Rng): number {
  const luck = rng.range(-0.1, 0.1);
  const lvl = Math.min(0.15, i.smithLevel * 0.015);
  return Math.max(0, Math.min(1, i.materialQuality * 0.45 + i.skillScore * 0.4 + lvl + luck));
}

export function rarityFor(score: number): number {
  if (score >= 0.88) return 3;
  if (score >= 0.68) return 2;
  if (score >= 0.4) return 1;
  return 0;
}

/**
 * Cùng một tên vật phẩm nhưng chỉ số khác nhau:
 * chỉ số gốc nhân hệ số độ hiếm + dòng phụ ngẫu nhiên (có min/max) co giãn theo điểm chất lượng.
 */
export function forge(input: ForgeInput, rng: Rng): ItemInstance {
  const base = (ITEMS.bases as any[]).find((b) => b.id === input.baseId);
  if (!base) throw new Error(`Không có mẫu rèn: ${input.baseId}`);
  const score = forgeScore(input, rng);
  const rIdx = rarityFor(score);
  const rarity = ITEMS.rarities[rIdx];
  const mult = rng.range(rarity.mult[0], rarity.mult[1]);

  const stats: Partial<Stats> = {};
  for (const [k, v] of Object.entries(base.base)) {
    stats[k as StatKey] = Math.round((v as number) * mult * 10) / 10;
  }

  const n = rng.int(rarity.affixes[0], rarity.affixes[1]);
  const affixes: ItemInstance['affixes'] = [...(input.lockedAffixes ?? [])];
  const pool = [...(ITEMS.affixes as any[])];
  while (affixes.length < n && pool.length) {
    const a = rng.weighted(pool);
    pool.splice(pool.indexOf(a), 1);
    if (affixes.some((x) => x.id === a.id)) continue;
    const t = Math.min(1, Math.max(0, score + rng.range(-0.15, 0.15)));
    const raw = a.min + (a.max - a.min) * t;
    const value = a.stat === 'crit' ? Math.round(raw * 1000) / 1000 : Math.round(raw);
    affixes.push({ id: a.id, stat: a.stat, value });
  }
  for (const a of affixes) stats[a.stat as StatKey] = (stats[a.stat as StatKey] ?? 0) + a.value;

  return { uid: newUid(), baseId: base.id, name: base.name, slot: base.slot, rarity: rarity.id, stats, affixes };
}
