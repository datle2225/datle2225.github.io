import { REALMS, SKILLS, QUESTS, questMap, CHAPTERS, ENEMIES } from './data';
import { gainExp, levelUpStages } from './progression';
import type { PlayerState, Skill } from './types';

/** Chiêu người chơi đã mở: nhánh đã chọn (hoặc chiêu cơ bản của mọi nhánh khi chưa chọn) theo cảnh giới/tầng. */
export function availableSkills(p: PlayerState): Skill[] {
  return SKILLS.filter((s) => {
    const r = REALMS.findIndex((x) => x.id === s.unlockRealm);
    const reached = p.realmIndex > r || (p.realmIndex === r && p.stage >= s.unlockStage);
    if (!reached) return false;
    if (p.branchId) return s.branch === p.branchId;
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
export function questEvent(p: PlayerState, kind: string, target: string, n = 1): string[] {
  const done: string[] = [];
  for (const id of [...p.quests.active]) {
    const q = questMap.get(id);
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
  const q = questMap.get(id);
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
