import { ITEMS, SERVICES, materialMap, recipeMap, vendorMap } from './data';
import { forge } from './forge';
import { Rng } from './rng';
import { worldDay } from './services';
import type { ItemInstance, PlayerState } from './types';

/**
 * Đấu giá với thương nhân NPC (không cần máy chủ):
 *  - Mỗi ngày game có một phiên với vài lô hàng, sinh theo seed `ngày` nên ổn định.
 *  - Người chơi đặt GIÁ TỐI ĐA (giữ cọc ngay). Hết ngày, hệ thống xét: nếu giá của bạn cao hơn mức các thương nhân NPC
 *    chịu trả thì thắng và chỉ trả giá NPC +5% (giá "người trả cao thứ hai"), phần dư hoàn lại. Thua thì hoàn đủ.
 */
export interface Lot {
  id: string; // `${ngày}-${i}`
  day: number;
  kind: 'gear' | 'pill' | 'material';
  ref: string; // id mẫu / đan / nguyên liệu
  qty: number;
  name: string;
  start: number; // giá khởi điểm
  npcFinal: number; // mức cao nhất các NPC chịu trả (ẩn với người chơi)
  item?: ItemInstance; // chỉ với trang bị
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function lotsForDay(day: number, vendorId = 'dau_gia'): Lot[] {
  const v = vendorMap.get(vendorId) as any;
  const n = v?.lots ?? 4;
  const rng = new Rng(hash(`auction:${day}`));
  const lots: Lot[] = [];
  const bases = ITEMS.bases as any[];
  const pills = ['truc_co_dan', 'thanh_tam_dan', 'pha_canh_dan', 'kiem_y_dan', 'huyet_khi_dan'];
  for (let i = 0; i < n; i++) {
    const roll = rng.next();
    let lot: Lot;
    if (roll < 0.5) {
      const b = rng.pick(bases);
      // đồ đấu giá phẩm chất cao hơn đồ bán thường
      const item = forge({ baseId: b.id, materialQuality: rng.range(0.7, 0.95), skillScore: rng.range(0.6, 1), smithLevel: 6 }, rng);
      const val = 120 + Object.values(item.stats).reduce((a, x) => a + (x as number), 0) * 6 * (1 + item.affixes.length * 0.5);
      const start = Math.round(val * 0.7);
      lot = { id: `${day}-${i}`, day, kind: 'gear', ref: b.id, qty: 1, name: `[${rarityLabel(item.rarity)}] ${item.name}`, start, npcFinal: Math.round(start * rng.range(1.25, 2.1)), item };
    } else if (roll < 0.85) {
      const id = rng.pick(pills);
      const q = rng.int(1, 3);
      const base = (recipeMap.get(id) as any)?.basePrice ?? 100;
      const start = Math.round(base * q * 0.9);
      lot = { id: `${day}-${i}`, day, kind: 'pill', ref: id, qty: q, name: `${recipeMap.get(id)?.name} ×${q}`, start, npcFinal: Math.round(start * rng.range(1.2, 1.9)) };
    } else {
      const id = rng.pick(['huyet_tham', 'huyen_thiet']);
      const q = rng.int(4, 9);
      const base = (materialMap.get(id) as any)?.price ?? 30;
      const start = Math.round(base * q * 0.8);
      lot = { id: `${day}-${i}`, day, kind: 'material', ref: id, qty: q, name: `${(materialMap.get(id) as any)?.name} ×${q}`, start, npcFinal: Math.round(start * rng.range(1.15, 1.7)) };
    }
    lots.push(lot);
  }
  return lots;
}

const rarityLabel = (id: string) => (ITEMS.rarities as any[]).find((r) => r.id === id)?.name ?? id;

export const minRaise = (current: number, start: number) => Math.max(start, Math.ceil(current * 1.1));

export function currentLots(p: PlayerState, vendorId = 'dau_gia'): Lot[] {
  return lotsForDay(worldDay(p), vendorId);
}

export function myBid(p: PlayerState, lotId: string): number {
  return p.auction.bids[lotId] ?? 0;
}

export function placeBid(p: PlayerState, lotId: string, amount: number): { ok: boolean; msg: string } {
  const lot = currentLots(p).find((l) => l.id === lotId);
  if (!lot) return { ok: false, msg: 'Lô này đã kết thúc hoặc không tồn tại.' };
  const cur = myBid(p, lotId);
  const need = cur ? Math.ceil(cur * 1.1) : lot.start;
  if (amount < need) return { ok: false, msg: `Giá tối thiểu là ${need} LT.` };
  const extra = amount - cur;
  if (p.gold < extra) return { ok: false, msg: 'Không đủ linh thạch để giữ cọc.' };
  p.gold -= extra;
  p.auction.bids[lotId] = amount;
  return { ok: true, msg: `Đã đặt giá tối đa ${amount} LT cho "${lot.name}" (giữ cọc ${extra} LT).` };
}

export function cancelBid(p: PlayerState, lotId: string): { ok: boolean; msg: string } {
  const cur = myBid(p, lotId);
  if (!cur) return { ok: false, msg: 'Bạn chưa đặt giá.' };
  p.gold += Math.floor(cur * 0.9); // phí hủy 10%
  delete p.auction.bids[lotId];
  return { ok: true, msg: `Đã rút giá, hoàn ${Math.floor(cur * 0.9)} LT (phí 10%).` };
}

/** Xét các lô của những ngày đã qua. Trả về tin kết quả mới. */
export function settleAuctions(p: PlayerState): string[] {
  const today = worldDay(p);
  const news: string[] = [];
  for (const [lotId, bid] of Object.entries({ ...p.auction.bids })) {
    const day = Number(lotId.split('-')[0]);
    if (!(day < today)) continue;
    const lot = lotsForDay(day).find((l) => l.id === lotId);
    delete p.auction.bids[lotId];
    if (!lot) { p.gold += bid; continue; }
    if (bid > lot.npcFinal) {
      const price = Math.min(bid, Math.max(lot.start, Math.round(lot.npcFinal * 1.05)));
      p.gold += bid - price;
      if (lot.kind === 'gear' && lot.item) p.gear.push({ ...lot.item, uid: `auc_${lot.id}_${p.gear.length}_${Math.floor(p.playtime)}` });
      else p.inventory[lot.ref] = (p.inventory[lot.ref] ?? 0) + lot.qty;
      news.push(`THẮNG đấu giá "${lot.name}" với giá ${price} LT (hoàn lại ${bid - price}).`);
    } else {
      p.gold += bid;
      news.push(`Thua đấu giá "${lot.name}": thương nhân trả cao hơn. Đã hoàn ${bid} LT.`);
    }
  }
  p.auction.news.push(...news);
  if (p.auction.news.length > 12) p.auction.news = p.auction.news.slice(-12);
  return news;
}

export const AUCTION_ID = 'dau_gia';
export const auctionEnabled = (SERVICES.vendors as any[]).some((v) => v.id === AUCTION_ID);
