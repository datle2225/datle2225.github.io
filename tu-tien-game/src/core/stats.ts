import { REALMS, rootMap } from './data';
import type { ItemInstance, PlayerState, StatKey, Stats } from './types';
import { factionPerks, lawPerks } from './advanced';

export const BASE_STATS: Stats = { hp: 100, mp: 30, atk: 10, def: 5, spd: 100, crit: 0.05 };

/** Chỉ số tổng = (gốc + mỗi tầng) × hệ số cảnh giới × (1+bonus linh căn) + trang bị. */
export function computeStats(p: PlayerState): Stats {
  const realm = REALMS[p.realmIndex];
  const levelsDone = p.realmIndex * 9 + (p.stage - 1);
  const root = rootMap.get(p.rootId);
  const bonus = (root?.bonus ?? {}) as Partial<Record<StatKey, number>>;
  const out = { ...BASE_STATS };
  for (const k of ['hp', 'mp', 'atk', 'def'] as const) {
    const grow = k === 'hp' ? 12 : k === 'mp' ? 4 : k === 'atk' ? 1.6 : 0.9;
    out[k] = (BASE_STATS[k] + grow * levelsDone) * realm.statMul * (1 + (bonus[k] ?? 0));
  }
  out.spd = BASE_STATS.spd + levelsDone * 0.5;
  out.crit += bonus.crit ?? 0;
  for (const uid of Object.values(p.equipped)) {
    const it = p.gear.find((g) => g.uid === uid);
    if (it) addGear(out, it);
  }
  // phúc lợi thế lực & pháp tắc
  const fp = factionPerks(p);
  out.atk *= fp.atkMul; out.def *= fp.defMul; out.hp *= fp.hpMul; out.spd += fp.spdAdd;
  out.crit += lawPerks(p).critBonus ?? 0;
  for (const k of Object.keys(out) as StatKey[]) out[k] = k === 'crit' ? out[k] : Math.round(out[k]);
  return out;
}

function addGear(out: Stats, it: ItemInstance) {
  for (const [k, v] of Object.entries(it.stats)) out[k as StatKey] += v as number;
}

/** "Lực chiến" – dùng cho lôi kiếp và gợi ý độ khó. */
export function power(s: Stats): number {
  return Math.round(s.atk * 4 + s.def * 3 + s.hp / 5 + s.mp / 10 + (s.spd - 100));
}
