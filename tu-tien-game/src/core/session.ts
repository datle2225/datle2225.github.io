import { BRANCHES, REALMS, SKILLS, QUESTS, questMap, CHAPTERS, ENEMIES, companionMap } from './data';
import { gainExp, levelUpStages } from './progression';
import { addContribution } from './advanced';
import type { PlayerState, Skill, Stats } from './types';

/** Chiêu người chơi đã mở: nhánh đã chọn (hoặc chiêu cơ bản của mọi nhánh khi chưa chọn) theo cảnh giới/tầng. */
export function availableSkills(p: PlayerState): Skill[] {
  return SKILLS.filter((s) => {
    const r = REALMS.findIndex((x) => x.id === s.unlockRealm);
    const reached = p.realmIndex > r || (p.realmIndex === r && p.stage >= s.unlockStage);
    if (!reached) return false;
    if (p.branchId) return s.branch === 'all' || s.branch === p.branchId || (!!p.subBranchId && s.branch === p.subBranchId);
    return s.id === 'kiem_co_ban'; // trước khi chọn nhánh chỉ có đòn cơ bản
  });
}

export function ownsSystem(p: PlayerState, id: string) {
  return p.unlockedSystems.includes(id);
}

export function unlockSystem(p: PlayerState, id: string): boolean {
  if (ownsSystem(p, id)) return false;
  p.unlockedSystems.push(id);
  return true;
}

export function enterChapter(p: PlayerState, n: number): string[] {
  const ch = CHAPTERS.find((c: any) => c.n === n);
  if (!ch) return [];
  p.chapter = n;
  return ch.unlock.filter((id: string) => unlockSystem(p, id));
}

/** Cập nhật tiến độ nhiệm vụ khi có sự kiện (đánh thắng / đến nơi / nói chuyện / nhặt). */
/** Nhiệm vụ: dữ liệu tĩnh hoặc sinh động (bảng nhiệm vụ). */
export function getQuest(p: PlayerState, id: string): any {
  return questMap.get(id) ?? p.dynQuests[id];
}

export function questEvent(p: PlayerState, kind: string, target: string, n = 1): string[] {
  const done: string[] = [];
  for (const id of [...p.quests.active]) {
    const q = getQuest(p, id);
    if (!q) continue;
    const idx = q.steps.findIndex((_: any, i: number) => (p.quests.progress[`${id}:${i}`] ?? 0) < (q.steps[i].n ?? 1));
    if (idx < 0) continue;
    const st = q.steps[idx];
    if (st.kind !== kind || st.target !== target) continue;
    p.quests.progress[`${id}:${idx}`] = Math.min(st.n ?? 1, (p.quests.progress[`${id}:${idx}`] ?? 0) + n);
    const finished = q.steps.every((s: any, i: number) => (p.quests.progress[`${id}:${i}`] ?? 0) >= (s.n ?? 1));
    if (finished) {
      completeQuest(p, id);
      done.push(id);
    }
  }
  return done;
}

export function completeQuest(p: PlayerState, id: string) {
  const q = getQuest(p, id);
  if (!q) return;
  p.quests.active = p.quests.active.filter((x) => x !== id);
  if (!p.quests.done.includes(id)) p.quests.done.push(id);
  const r = q.reward ?? {};
  if (r.exp) {
    gainExp(p, r.exp);
    levelUpStages(p);
  }
  if (r.linh_thach) p.gold += r.linh_thach;
  if (r.item) p.inventory[r.item] = (p.inventory[r.item] ?? 0) + (r.n ?? 1);
  if (r.recipe && !p.knownRecipes.includes(r.recipe)) p.knownRecipes.push(r.recipe);
  if (q.unlockSystem) unlockSystem(p, q.unlockSystem);
  if (q.unlockChapter) enterChapter(p, q.unlockChapter);
  addContribution(p, q.type === 'main' ? 30 : 10); // điểm cống hiến thế lực
  for (const [k, v] of Object.entries(q.rep ?? {})) p.rep[k] = Math.max(-100, Math.min(100, (p.rep[k] ?? 0) + (v as number)));
  p.flags.lastDoneTitle = q.title;
  if (q.bounty) delete p.dynQuests[id]; // quest bảng: xong là dọn
  for (const next of q.unlocks ?? []) if (!p.quests.active.includes(next) && !p.quests.done.includes(next)) p.quests.active.push(next);
}

export function startableQuests(p: PlayerState) {
  return QUESTS.filter((q: any) => q.type === 'side' && q.chapter <= p.chapter && !p.quests.active.includes(q.id) && !p.quests.done.includes(q.id));
}

export function rollDrops(enemyId: string, rnd: () => number): Record<string, number> {
  const e = ENEMIES.find((x: any) => x.id === enemyId);
  const out: Record<string, number> = {};
  for (const d of e?.drops ?? []) if (rnd() < d.chance) out[d.id] = (out[d.id] ?? 0) + 1;
  return out;
}

/** Chỉ số đồng hành: gốc × hệ số cảnh giới của người chơi, cộng nhẹ theo tầng. */
export function companionStats(p: PlayerState, id: string): Stats | null {
  const def = companionMap.get(id);
  if (!def) return null;
  const mul = REALMS[p.realmIndex].statMul * (1 + (p.stage - 1) * 0.04);
  const s = def.stats as Stats;
  return { hp: Math.round(s.hp * mul), mp: Math.round(s.mp * mul), atk: Math.round(s.atk * mul), def: Math.round(s.def * mul), spd: s.spd, crit: s.crit };
}

/** Nhánh chọn khi Trúc Cơ: chỉ các nhánh mở ở Trúc Cơ (Kiếm, Thể, Pháp). Còn lại học làm nhánh phụ về sau. */
export function mainBranchChoices(): any[] {
  return BRANCHES.filter((b: any) => b.playable && b.unlockRealm === 'truc_co');
}

export const SUB_BRANCH_COST = 1000;

/** Nhánh phụ có thể học: đã tới cảnh giới mở nhánh, khác nhánh chính, chỉ được một nhánh phụ. */
export function eligibleSubBranches(p: PlayerState): any[] {
  if (!p.branchId || p.subBranchId) return [];
  return BRANCHES.filter((b: any) => b.playable && b.id !== p.branchId && REALMS.findIndex((r) => r.id === b.unlockRealm) <= p.realmIndex && b.unlockRealm !== 'truc_co');
}

export function learnSubBranch(p: PlayerState, id: string): { ok: boolean; msg: string } {
  const b = eligibleSubBranches(p).find((x: any) => x.id === id);
  if (!b) return { ok: false, msg: 'Chưa thể học nhánh này.' };
  if (p.gold < SUB_BRANCH_COST) return { ok: false, msg: `Cần ${SUB_BRANCH_COST} linh thạch để học nhánh phụ.` };
  p.gold -= SUB_BRANCH_COST;
  p.subBranchId = id;
  return { ok: true, msg: `Đã học nhánh phụ ${b.name}. Chiêu của nhánh này mở dần theo cảnh giới.` };
}

/**
 * Bước "thu thập": nộp vật phẩm trong túi. Gọi sau mọi thay đổi túi đồ (nhặt, rơi, mua).
 * Khi đủ số lượng thì trừ vật phẩm và hoàn thành bước đó.
 */
export function checkCollect(p: PlayerState): string[] {
  const done: string[] = [];
  for (const id of [...p.quests.active]) {
    const q = getQuest(p, id);
    if (!q) continue;
    const idx = q.steps.findIndex((_: any, i: number) => (p.quests.progress[`${id}:${i}`] ?? 0) < (q.steps[i].n ?? 1));
    if (idx < 0) continue;
    const st = q.steps[idx];
    if (st.kind !== 'collect') continue;
    const need = st.n ?? 1;
    if ((p.inventory[st.target] ?? 0) < need) { p.quests.progress[`${id}:${idx}`] = Math.min(need, p.inventory[st.target] ?? 0); continue; }
    p.inventory[st.target] -= need; // nộp vật phẩm
    p.quests.progress[`${id}:${idx}`] = need;
    if (q.steps.every((s: any, i: number) => (p.quests.progress[`${id}:${i}`] ?? 0) >= (s.n ?? 1))) { completeQuest(p, id); done.push(id); }
  }
  return done;
}
