import { ITEMS, SERVICES, materialMap, recipeMap, vendorMap } from './data';
import { forge } from './forge';
import { brew, canBrew, type AlchemyResult } from './alchemy';
import { Rng } from './rng';
import type { ItemInstance, PlayerState, ShopState, StatKey } from './types';
import { factionPerks } from './advanced';

const RARITY_VALUE: Record<string, number> = { pham: 1, linh: 1.6, bao: 2.6, tien: 4.5 };
const STAT_WEIGHT: Record<StatKey, number> = { atk: 4, def: 4, hp: 0.5, mp: 0.6, spd: 5, crit: 600 };

export function itemValue(it: ItemInstance): number {
  let v = 10;
  for (const [k, val] of Object.entries(it.stats)) v += (val as number) * STAT_WEIGHT[k as StatKey];
  return Math.max(5, Math.round(v * (RARITY_VALUE[it.rarity] ?? 1)));
}

export const SELL_BACK = SERVICES.sellBack as number;

/** Ngày của thế giới (dựa trên thời gian chơi) → cửa hàng nhập hàng mới & giá dao động. */
export function worldDay(p: PlayerState): number {
  return Math.floor(p.playtime / SERVICES.restockSeconds);
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Hệ số giá (dao động ±15% theo ngày, ổn định trong ngày). */
export function priceFactor(vendorId: string, p: PlayerState): number {
  const r = new Rng(hash(`${vendorId}:price:${worldDay(p)}`));
  return 1 + r.range(-SERVICES.priceDrift, SERVICES.priceDrift);
}

/** Chiết khấu theo quan hệ: ≥30 → -5%, ≥60 → -10%, ≥90 → -15%. */
export function relationDiscount(p: PlayerState, vendorId: string): number {
  const rel = p.relations[vendorId] ?? 0;
  return rel >= 90 ? 0.85 : rel >= 60 ? 0.9 : rel >= 30 ? 0.95 : 1;
}

/** Giảm giá riêng của thương hội cho thành viên một thế lực (ví dụ Thanh Vân Tông). */
export function memberDiscount(p: PlayerState, vendorId: string): number {
  const fd = (vendorMap.get(vendorId) as any)?.factionDiscount as Record<string, number> | undefined;
  return (p.faction && fd?.[p.faction.id]) || 0;
}

export function buyPrice(p: PlayerState, vendorId: string, basePrice: number): number {
  return Math.max(1, Math.round(basePrice * priceFactor(vendorId, p) * relationDiscount(p, vendorId) * (1 - factionPerks(p).discount) * (1 - memberDiscount(p, vendorId))));
}

/** Nhập hàng nếu qua ngày mới. Đồ sẵn được "NPC rèn" bằng RNG theo seed (cùng ngày → cùng hàng). */
export function ensureStock(p: PlayerState, vendorId: string): ShopState {
  const v = vendorMap.get(vendorId) as any;
  const day = worldDay(p);
  const cur = p.shops[vendorId];
  if (cur && cur.day === day) return cur;
  const rng = new Rng(hash(`${vendorId}:stock:${day}`));
  const stock: Record<string, number> = {};
  for (const s of v.sells ?? []) stock[s.id] = Math.max(1, Math.round(s.stock * rng.range(0.6, 1.1)));
  for (const id of v.readyPills ?? []) stock[id] = rng.int(1, v.pillStock ?? 3);
  for (const id of v.fashion ?? []) stock[id] = 1;
  const items: ItemInstance[] = [];
  if (v.type === 'smith') {
    const pool = [...v.readyBases];
    for (let i = 0; i < (v.readyCount ?? 3) && pool.length; i++) {
      const baseId = pool.splice(rng.int(0, pool.length - 1), 1)[0];
      items.push(forge({ baseId, materialQuality: rng.range(0.45, 0.8), skillScore: Math.min(1, v.skill * 0.1 + rng.range(-0.1, 0.15)), smithLevel: v.skill }, rng));
    }
  }
  // giữ lại hàng đã mua dở của ngày cũ? Không: nhập mới hoàn toàn, đồ cũ bị bán đi.
  const next: ShopState = { day, stock, items };
  p.shops[vendorId] = next;
  return next;
}

export interface Result { ok: boolean; msg: string }

export function buyMaterial(p: PlayerState, vendorId: string, id: string): Result {
  const v = vendorMap.get(vendorId) as any;
  const st = ensureStock(p, vendorId);
  const line = (v.sells as any[]).find((x) => x.id === id);
  if (!line) return { ok: false, msg: 'Cửa hàng không bán món này.' };
  if ((st.stock[id] ?? 0) <= 0) return { ok: false, msg: 'Hết hàng.' };
  const price = buyPrice(p, vendorId, line.price);
  if (p.gold < price) return { ok: false, msg: 'Không đủ linh thạch.' };
  p.gold -= price;
  st.stock[id]--;
  p.inventory[id] = (p.inventory[id] ?? 0) + 1;
  return { ok: true, msg: `Mua ${(materialMap.get(id) as any)?.name} (-${price} LT).` };
}

export function pillBasePrice(id: string): number {
  return (recipeMap.get(id) as any)?.basePrice ?? 0;
}

export function buyPill(p: PlayerState, vendorId: string, id: string): Result {
  const st = ensureStock(p, vendorId);
  if ((st.stock[id] ?? 0) <= 0) return { ok: false, msg: 'Hết hàng.' };
  const price = buyPrice(p, vendorId, Math.round(pillBasePrice(id) * 1.3));
  if (p.gold < price) return { ok: false, msg: 'Không đủ linh thạch.' };
  p.gold -= price;
  st.stock[id]--;
  p.inventory[id] = (p.inventory[id] ?? 0) + 1;
  return { ok: true, msg: `Mua ${recipeMap.get(id)?.name} (-${price} LT).` };
}

export function readyItemPrice(p: PlayerState, vendorId: string, it: ItemInstance): number {
  return buyPrice(p, vendorId, Math.round(itemValue(it) * 1.4));
}

export function buyReadyItem(p: PlayerState, vendorId: string, uid: string): Result {
  const st = ensureStock(p, vendorId);
  const idx = st.items.findIndex((i) => i.uid === uid);
  if (idx < 0) return { ok: false, msg: 'Món này đã bán.' };
  const price = readyItemPrice(p, vendorId, st.items[idx]);
  if (p.gold < price) return { ok: false, msg: 'Không đủ linh thạch.' };
  p.gold -= price;
  const [item] = st.items.splice(idx, 1);
  p.gear.push(item);
  return { ok: true, msg: `Mua ${item.name} (-${price} LT).` };
}

export function buyFashion(p: PlayerState, vendorId: string, id: string): Result {
  const f = (ITEMS.fashion as any[]).find((x) => x.id === id);
  if (!f) return { ok: false, msg: 'Không có.' };
  if (f.currency !== 'linh_thach') return { ok: false, msg: 'Món này mua bằng xu (chưa mở).' };
  if (p.fashion.owned.includes(id)) return { ok: false, msg: 'Đã có.' };
  const price = buyPrice(p, vendorId, f.price);
  if (p.gold < price) return { ok: false, msg: 'Không đủ linh thạch.' };
  p.gold -= price;
  p.fashion.owned.push(id);
  return { ok: true, msg: `Mua ${f.name} (-${price} LT).` };
}

/** Giá bán lại cho NPC: 50% giá trị niêm yết. */
export function sellValue(id: string): number {
  const m = materialMap.get(id) as any;
  const base = m?.price ?? pillBasePrice(id);
  return Math.floor(base * SELL_BACK);
}

export function sellItem(p: PlayerState, id: string, n = 1): Result {
  const have = p.inventory[id] ?? 0;
  const v = sellValue(id);
  if (have < n || v <= 0) return { ok: false, msg: 'Không bán được.' };
  p.inventory[id] -= n;
  p.gold += v * n;
  return { ok: true, msg: `Bán ${n} ${(materialMap.get(id) as any)?.name ?? recipeMap.get(id)?.name} (+${v * n} LT).` };
}

export function sellGear(p: PlayerState, uid: string): Result {
  const i = p.gear.findIndex((g) => g.uid === uid);
  if (i < 0) return { ok: false, msg: 'Không có món này.' };
  const v = Math.floor(itemValue(p.gear[i]) * SELL_BACK);
  for (const k of Object.keys(p.equipped)) if (p.equipped[k] === uid) p.equipped[k] = null;
  p.gear.splice(i, 1);
  p.gold += v;
  return { ok: true, msg: `Bán trang bị (+${v} LT).` };
}

/* ───────────────────────── THUÊ NPC ───────────────────────── */

export type Tier = 'normal' | 'fine';

export interface Quote {
  ok: boolean;
  reason?: string;
  labor: number; // tiền công
  materialCost: number; // tiền bù nguyên liệu NPC cấp
  total: number;
  missing: Record<string, number>;
}

function materialsQuote(p: PlayerState, vendorId: string, need: Record<string, number>, tier: Tier): { cost: number; missing: Record<string, number>; ok: boolean } {
  let cost = 0;
  const missing: Record<string, number> = {};
  for (const [id, n] of Object.entries(need)) {
    const lack = Math.max(0, n - (p.inventory[id] ?? 0));
    if (lack > 0) {
      missing[id] = lack;
      const unit = ((materialMap.get(id) as any)?.price ?? 10) * 1.25 * (tier === 'fine' ? 1.8 : 1);
      cost += Math.round(unit * lack);
    }
  }
  return { cost: Math.round(cost * relationDiscount(p, vendorId)), missing, ok: true };
}

export function quoteForge(p: PlayerState, vendorId: string, baseId: string, tier: Tier): Quote {
  const v = vendorMap.get(vendorId) as any;
  const base = (ITEMS.bases as any[]).find((b) => b.id === baseId);
  if (!v || v.type !== 'smith' || !base) return { ok: false, reason: 'Không có mẫu rèn.', labor: 0, materialCost: 0, total: 0, missing: {} };
  const labor = Math.round(base.ore * v.labor * (tier === 'fine' ? 2.2 : 1) * relationDiscount(p, vendorId));
  const m = materialsQuote(p, vendorId, { huyen_thiet: base.ore }, tier);
  const total = labor + m.cost;
  return { ok: p.gold >= total, reason: p.gold >= total ? undefined : 'Không đủ linh thạch.', labor, materialCost: m.cost, total, missing: m.missing };
}

export function commissionForge(p: PlayerState, vendorId: string, baseId: string, tier: Tier, rng: Rng): { ok: boolean; msg: string; item?: ItemInstance } {
  const v = vendorMap.get(vendorId) as any;
  const q = quoteForge(p, vendorId, baseId, tier);
  if (!q.ok) return { ok: false, msg: q.reason ?? 'Không thuê được.' };
  const base = (ITEMS.bases as any[]).find((b) => b.id === baseId);
  p.gold -= q.total;
  const have = Math.min(p.inventory.huyen_thiet ?? 0, base.ore);
  p.inventory.huyen_thiet = (p.inventory.huyen_thiet ?? 0) - have;
  const item = forge({
    baseId,
    materialQuality: tier === 'fine' ? 0.85 : 0.55,
    skillScore: Math.max(0, Math.min(1, v.skill * 0.1 + rng.range(-0.12, 0.15))),
    smithLevel: v.skill,
  }, rng);
  p.gear.push(item);
  p.relations[vendorId] = Math.min(100, (p.relations[vendorId] ?? 0) + 2);
  return { ok: true, msg: `${v.name} rèn xong (-${q.total} LT).`, item };
}

/** Công thức NPC đan sư luyện được (kể cả công thức người chơi chưa học). */
export function npcRecipes(vendorId: string): any[] {
  const v = vendorMap.get(vendorId) as any;
  return (v?.recipes ?? []).map((id: string) => recipeMap.get(id)).filter(Boolean);
}

export function quoteBrew(p: PlayerState, vendorId: string, recipeId: string, tier: Tier): Quote {
  const v = vendorMap.get(vendorId) as any;
  const r = recipeMap.get(recipeId) as any;
  if (!v || v.type !== 'alchemist' || !r || !(v.recipes as string[]).includes(recipeId)) return { ok: false, reason: 'NPC không biết đan phương này.', labor: 0, materialCost: 0, total: 0, missing: {} };
  const labor = Math.round(r.basePrice * v.labor * (tier === 'fine' ? 1.8 : 1) * relationDiscount(p, vendorId));
  const need: Record<string, number> = {};
  for (const i of r.ingredients) need[i.id] = i.n;
  const m = materialsQuote(p, vendorId, need, tier);
  const total = labor + m.cost;
  return { ok: p.gold >= total, reason: p.gold >= total ? undefined : 'Không đủ linh thạch.', labor, materialCost: m.cost, total, missing: m.missing };
}

export function commissionBrew(p: PlayerState, vendorId: string, recipeId: string, tier: Tier, rng: Rng): { ok: boolean; msg: string; result?: AlchemyResult } {
  const v = vendorMap.get(vendorId) as any;
  const q = quoteBrew(p, vendorId, recipeId, tier);
  if (!q.ok) return { ok: false, msg: q.reason ?? 'Không thuê được.' };
  const r = recipeMap.get(recipeId) as any;
  p.gold -= q.total;
  // trừ phần người chơi tự đem, phần thiếu NPC bù
  for (const i of r.ingredients) p.inventory[i.id] = Math.max(0, (p.inventory[i.id] ?? 0) - i.n);
  const heat = Math.max(0, Math.min(1, v.skill * 0.1 + (tier === 'fine' ? 0.1 : 0) + rng.range(-0.1, 0.1)));
  const chk = canBrew(p, recipeId, { byNpc: true, skipIngredients: true });
  if (!chk.ok) return { ok: false, msg: chk.reason ?? '' };
  const res = brew(p, recipeId, heat, rng, { byNpc: true, skipIngredients: true });
  p.relations[vendorId] = Math.min(100, (p.relations[vendorId] ?? 0) + 2);
  return { ok: res.ok, msg: res.ok ? `${v.name} luyện xong ${r.name} phẩm ${res.grade} (${res.pillLines} đan văn).` : `${res.reason}`, result: res };
}

