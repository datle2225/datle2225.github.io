import dialogues from '../data/dialogues.json';
import { enterChapter, questEvent, unlockSystem, completeQuest } from './session';
import { clearBottleneck, gainExp, isBottlenecked, levelUpStages } from './progression';
import { gameHour, inHours } from './time';
import rumors from '../data/rumors.json';
import { companionMap, materialMap, recipeMap, rootMap, systemName } from './data';
import type { PlayerState } from './types';

export interface Cond {
  flag?: string; notFlag?: string;
  questDone?: string; questActive?: string; noQuest?: string;
  minRealm?: number; minChapter?: number;
  minDao?: number; maxDao?: number;
  rel?: { npc: string; min: number };
  party?: string; notParty?: string;
  system?: string; notSystem?: string;
  gold?: number;
  hour?: [number, number]; // giờ trong game, hỗ trợ qua nửa đêm
  notHour?: [number, number];
  map?: string;
  hasItem?: { id: string; n: number };
  bottleneck?: boolean;
  towerMin?: number; // tầng cao nhất Vô Tận Tháp tối thiểu
}

export type Effect =
  | { flag: string; value?: boolean | number | string }
  | { dao: number }
  | { rep: Record<string, number> }
  | { rel: Record<string, number> }
  | { quest: string }
  | { done: string }
  | { event: { kind: string; target: string; n?: number } }
  | { gold: number }
  | { item: { id: string; n: number } }
  | { exp: number }
  | { recipe: string }
  | { join: string }
  | { leave: string }
  | { system: string }
  | { chapter: number }
  | { toast: string }
  | { openShop: string; tab?: string }
  | { battle: string[] }
  | { breakthrough: true }
  | { root: string }
  | { tower: number }; // bắt đầu leo Vô Tận Tháp từ tầng này

export interface Choice { text: string; goto?: string | null; if?: Cond; do?: Effect[] }
export interface Node { who?: string; text: string; next?: string | null; choices?: Choice[]; do?: Effect[] }
export interface Dialogue { start: string; nodes: Record<string, Node> }

export const DIALOGUES = dialogues as unknown as Record<string, Dialogue>;

export function check(p: PlayerState, c?: Cond): boolean {
  if (!c) return true;
  if (c.flag && !p.flags[c.flag]) return false;
  if (c.notFlag && p.flags[c.notFlag]) return false;
  if (c.questDone && !p.quests.done.includes(c.questDone)) return false;
  if (c.questActive && !p.quests.active.includes(c.questActive)) return false;
  if (c.noQuest && (p.quests.active.includes(c.noQuest) || p.quests.done.includes(c.noQuest))) return false;
  if (c.minRealm !== undefined && p.realmIndex < c.minRealm) return false;
  if (c.minChapter !== undefined && p.chapter < c.minChapter) return false;
  if (c.minDao !== undefined && p.daoHeart < c.minDao) return false;
  if (c.maxDao !== undefined && p.daoHeart > c.maxDao) return false;
  if (c.rel && (p.relations[c.rel.npc] ?? 0) < c.rel.min) return false;
  if (c.party && !p.party.includes(c.party)) return false;
  if (c.notParty && p.party.includes(c.notParty)) return false;
  if (c.system && !p.unlockedSystems.includes(c.system)) return false;
  if (c.notSystem && p.unlockedSystems.includes(c.notSystem)) return false;
  if (c.gold !== undefined && p.gold < c.gold) return false;
  if (c.hour && !inHours(gameHour(p), c.hour[0], c.hour[1])) return false;
  if (c.notHour && inHours(gameHour(p), c.notHour[0], c.notHour[1])) return false;
  if (c.map && p.mapId !== c.map) return false;
  if (c.towerMin !== undefined && p.towerBest < c.towerMin) return false;
  if (c.bottleneck !== undefined && isBottlenecked(p) !== c.bottleneck) return false;
  if (c.hasItem && (p.inventory[c.hasItem.id] ?? 0) < c.hasItem.n) return false;
  return true;
}

export interface EffectOutput { toasts: string[]; openShop?: { vendor: string; tab?: string }; completed: string[]; battle?: string[]; tower?: number }

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function applyEffects(p: PlayerState, effects: Effect[] | undefined, out: EffectOutput = { toasts: [], completed: [] }): EffectOutput {
  for (const e of effects ?? []) {
    if ('flag' in e) p.flags[e.flag] = e.value ?? true;
    else if ('dao' in e) { p.daoHeart = clamp(p.daoHeart + e.dao, 0, 100); out.toasts.push(`Đạo tâm ${e.dao > 0 ? '+' : ''}${e.dao}`); }
    else if ('rep' in e) for (const [k, v] of Object.entries(e.rep)) { p.rep[k] = clamp((p.rep[k] ?? 0) + v, -100, 100); out.toasts.push(`Danh vọng ${k.replace('_', ' ')} ${v > 0 ? '+' : ''}${v}`); }
    else if ('rel' in e) for (const [k, v] of Object.entries(e.rel)) { p.relations[k] = clamp((p.relations[k] ?? 0) + v, 0, 100); out.toasts.push(`Quan hệ ${v > 0 ? '+' : ''}${v}`); }
    else if ('quest' in e) { if (!p.quests.active.includes(e.quest) && !p.quests.done.includes(e.quest)) { p.quests.active.push(e.quest); out.toasts.push('Nhận nhiệm vụ mới'); } }
    else if ('done' in e) { if (p.quests.active.includes(e.done)) { completeQuest(p, e.done); out.completed.push(e.done); } }
    else if ('event' in e) out.completed.push(...questEvent(p, e.event.kind, e.event.target, e.event.n ?? 1));
    else if ('gold' in e) { p.gold += e.gold; out.toasts.push(`${e.gold > 0 ? '+' : ''}${e.gold} linh thạch`); }
    else if ('item' in e) { p.inventory[e.item.id] = Math.max(0, (p.inventory[e.item.id] ?? 0) + e.item.n); out.toasts.push(`${e.item.n > 0 ? 'Nhận' : 'Mất'} ${Math.abs(e.item.n)} ${(materialMap.get(e.item.id) as any)?.name ?? recipeMap.get(e.item.id)?.name ?? e.item.id}`); }
    else if ('exp' in e) { const g = gainExp(p, e.exp); levelUpStages(p); out.toasts.push(`+${g.gained} tu vi`); }
    else if ('recipe' in e) { if (!p.knownRecipes.includes(e.recipe)) { p.knownRecipes.push(e.recipe); out.toasts.push('Học được đan phương mới'); } }
    else if ('join' in e) { if (!p.party.includes(e.join) && p.party.length < 2) { p.party.push(e.join); out.toasts.push(`${companionMap.get(e.join)?.name ?? e.join} gia nhập đội`); } }
    else if ('leave' in e) p.party = p.party.filter((x) => x !== e.leave);
    else if ('system' in e) { if (unlockSystem(p, e.system)) out.toasts.push(`Mở khóa: ${systemName(e.system)}`); }
    else if ('chapter' in e) enterChapter(p, e.chapter).forEach((s) => out.toasts.push(`Mở khóa: ${systemName(s)}`));
    else if ('toast' in e) out.toasts.push(e.toast);
    else if ('openShop' in e) out.openShop = { vendor: e.openShop, tab: e.tab };
    else if ('battle' in e) out.battle = e.battle;
    else if ('tower' in e) out.tower = e.tower;
    else if ('root' in e) { p.rootId = e.root; out.toasts.push(`Linh căn: ${(rootMap.get(e.root) as any)?.name ?? e.root}`); }
    else if ('breakthrough' in e) { const u = clearBottleneck(p); out.toasts.push(u ? 'Ngộ đạo! Bình cảnh đã phá, lên tầng mới.' : 'Ngộ đạo, nhưng chưa có bình cảnh để phá.'); }
  }
  return out;
}

export interface TalkRule { if?: Cond; id: string }

/** Chọn đoạn thoại đầu tiên thỏa điều kiện của NPC. */
export function pickDialogue(p: PlayerState, rules: TalkRule[]): string | null {
  for (const r of rules) if (check(p, r.if)) return r.id;
  return null;
}

/** Chạy một đoạn hội thoại: UI chỉ gọi view()/advance(). */
export class DialogueRunner {
  private nodeId: string | null;
  readonly dlg: Dialogue;
  readonly out: EffectOutput = { toasts: [], completed: [] };
  constructor(private p: PlayerState, public id: string) {
    this.dlg = DIALOGUES[id];
    if (!this.dlg) throw new Error(`Thiếu hội thoại: ${id}`);
    this.nodeId = this.dlg.start;
    this.enter();
  }
  private enter() {
    const n = this.node();
    if (n) applyEffects(this.p, n.do, this.out);
  }
  private node(): Node | null { return this.nodeId ? this.dlg.nodes[this.nodeId] ?? null : null; }
  get ended() { return this.node() === null; }
  view(): { who?: string; text: string; choices: { text: string; i: number }[] } | null {
    const n = this.node();
    if (!n) return null;
    const choices = (n.choices ?? []).map((c, i) => ({ c, i })).filter(({ c }) => check(this.p, c.if)).map(({ c, i }) => ({ text: c.text, i }));
    return { who: n.who, text: n.text, choices };
  }
  /** Nếu node có lựa chọn thì phải truyền index. Trả về false khi hội thoại kết thúc. */
  advance(choice?: number): boolean {
    const n = this.node();
    if (!n) return false;
    if (n.choices?.length) {
      const c = choice !== undefined ? n.choices[choice] : undefined;
      if (!c || !check(this.p, c.if)) return true; // lựa chọn không hợp lệ: ở lại
      applyEffects(this.p, c.do, this.out);
      this.nodeId = c.goto ?? null;
    } else this.nodeId = n.next ?? null;
    this.enter();
    return !this.ended;
  }
}


/* ───────────── Tin đồn (bảng tin / Thiên Cơ Các) ───────────── */
interface Rumor { if?: Cond; text: string }

/** Chọn vài tin đồn đang phù hợp với tiến trình, dựng thành một hội thoại tạm `__rumor`. */
export function rumorDialogue(p: PlayerState, pickIndex: (n: number) => number = (n) => Math.floor(Math.random() * n)): string {
  const pool = (rumors as Rumor[]).filter((r) => check(p, r.if));
  const chosen: Rumor[] = [];
  const left = [...pool];
  while (chosen.length < 3 && left.length) chosen.push(left.splice(pickIndex(left.length), 1)[0]);
  const nodes: Record<string, Node> = {};
  chosen.forEach((r, i) => { nodes[`n${i}`] = { who: 'Tin đồn', text: r.text, next: i + 1 < chosen.length ? `n${i + 1}` : null }; });
  if (!chosen.length) nodes.n0 = { who: 'Tin đồn', text: 'Hôm nay chưa có tin gì đáng chú ý.', next: null };
  DIALOGUES.__rumor = { start: 'n0', nodes };
  return '__rumor';
}

/* ───────────── Sự kiện ngẫu nhiên (cơ duyên) ───────────── */
export interface GameEvent { id: string; maps?: string[]; if?: Cond; chance: number; cooldown: number; dialogue: string }

/** Thử bốc một sự kiện hợp lệ (đúng map, đúng điều kiện, hết hồi). Trả về id hội thoại hoặc null. */
export function rollEvent(p: PlayerState, events: GameEvent[], rnd: () => number): GameEvent | null {
  const lastAt = (id: string) => { const v = p.flags[`ev_cd_${id}`]; return typeof v === 'number' ? v : -1e9; };
  const ok = events.filter((e) => (!e.maps || e.maps.includes(p.mapId)) && check(p, e.if) && p.playtime - lastAt(e.id) >= e.cooldown);
  for (const e of ok) {
    if (rnd() < e.chance) { p.flags[`ev_cd_${e.id}`] = p.playtime; return e; }
  }
  return null;
}
