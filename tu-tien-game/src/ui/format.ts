import { ITEMS } from '../core/data';
import type { ItemInstance } from '../core/types';

const STAT_NAME: Record<string, string> = { atk: 'Công', def: 'Thủ', hp: 'HP', mp: 'MP', spd: 'Tốc', crit: 'Bạo' };

export function rarityName(id: string): string {
  return ITEMS.rarities.find((r: any) => r.id === id)?.name ?? id;
}
export function fmtStats(stats: Partial<Record<string, number>>): string {
  return Object.entries(stats).map(([k, v]) => `${STAT_NAME[k] ?? k}${k === 'crit' ? ` +${((v as number) * 100).toFixed(1)}%` : ` +${Math.round(v as number)}`}`).join(' ');
}
export function fmtItem(it: ItemInstance): string {
  return `[${rarityName(it.rarity)}] ${it.name}  ${fmtStats(it.stats)}`;
}
export function fmtAffixes(it: ItemInstance): string {
  return it.affixes.length ? `Dòng phụ: ${it.affixes.map((a) => `${STAT_NAME[a.stat]} ${a.stat === 'crit' ? (a.value * 100).toFixed(1) + '%' : a.value}`).join(', ')}` : 'Không có dòng phụ';
}
