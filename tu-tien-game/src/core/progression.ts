import { REALMS, rootMap } from './data';
import type { Rng } from './rng';
import { computeStats, power } from './stats';
import type { PlayerState } from './types';

export function expNeeded(p: PlayerState): number {
  return REALMS[p.realmIndex].expPerStage[p.stage - 1];
}

export function gainExp(p: PlayerState, amount: number): { gained: number; breakthroughReady: boolean } {
  const root = rootMap.get(p.rootId) as any;
  const gained = Math.round(amount * (root?.expMul ?? 1));
  p.exp += gained;
  return { gained, breakthroughReady: atStageCap(p) };
}

/** Chỉ cần đủ exp là lên tầng nhỏ; tầng 9 phải độ kiếp mới sang cảnh giới mới. */
export function atStageCap(p: PlayerState): boolean {
  return p.stage >= REALMS[p.realmIndex].stages && p.exp >= expNeeded(p);
}

export function levelUpStages(p: PlayerState): number {
  let ups = 0;
  const realm = REALMS[p.realmIndex];
  while (p.stage < realm.stages && p.exp >= expNeeded(p)) {
    p.exp -= expNeeded(p);
    p.stage++;
    ups++;
  }
  return ups;
}

export interface TribulationPlan {
  /** Mỗi đợt sét: 'dodge' | 'guard' | 'pill' */
  choices: ('dodge' | 'guard' | 'pill')[];
  shield: number; // 0..1 giảm sát thương từ pháp bảo / đan
}

export interface TribulationResult {
  allowed: boolean;
  success: boolean;
  reason?: string;
  hpLeft: number;
  log: string[];
}

/** Lôi kiếp cần vượt để *bước lên* cảnh giới kế (cảnh giới cuối thì là kiếp phi thăng). */
export function tribulationFor(p: PlayerState) {
  const next = REALMS[p.realmIndex + 1];
  return next ? next.tribulation : REALMS[p.realmIndex].tribulation;
}

/** Kiểm tra điều kiện "khí tức". Chưa đủ → không phạt, chỉ bảo quay về tu thêm. */
export function tribulationReadiness(p: PlayerState): { ready: boolean; ratio: number; reason?: string } {
  const trib = tribulationFor(p);
  if (!trib) return { ready: false, ratio: 1, reason: 'Cảnh giới này không cần độ kiếp.' };
  if (!atStageCap(p)) return { ready: false, ratio: 0, reason: 'Tu vi chưa đầy tầng cuối.' };
  const ratio = power(computeStats(p)) / trib.recommendedPower;
  if (ratio < 0.7) return { ready: false, ratio, reason: 'Khí tức chưa ổn, thiên lôi sẽ nghiền nát ngươi. Hãy tu luyện thêm.' };
  return { ready: true, ratio };
}

export function runTribulation(p: PlayerState, plan: TribulationPlan, rng: Rng): TribulationResult {
  const ready = tribulationReadiness(p);
  const t = tribulationFor(p);
  if (!ready.ready || !t) return { allowed: false, success: false, reason: ready.reason, hpLeft: 0, log: [] };
  const stats = computeStats(p);
  let hp = stats.hp;
  const log: string[] = [];
  for (let i = 0; i < t.waves; i++) {
    const choice = plan.choices[i] ?? 'guard';
    let dmg = t.boltPower * (1 + i * 0.25) * rng.range(0.9, 1.1);
    if (choice === 'dodge') dmg *= rng.chance(0.35 + stats.spd / 600) ? 0.1 : 1.2;
    else if (choice === 'guard') dmg = Math.max(1, dmg - stats.def * 1.2) * 0.8;
    else dmg *= 0.9;
    dmg *= 1 - Math.min(0.6, plan.shield);
    // Đạo tâm cao giảm một phần sát thương tâm ma kèm theo
    dmg *= 1 - Math.min(0.2, p.daoHeart / 500);
    if (choice === 'pill') hp = Math.min(stats.hp, hp + stats.hp * 0.2);
    hp -= dmg;
    log.push(`Đợt ${i + 1}: ${choice} → nhận ${Math.round(dmg)} sát thương, còn ${Math.max(0, Math.round(hp))}.`);
    if (hp <= 0) {
      const lost = Math.round(p.exp * 0.3);
      p.exp -= lost;
      return { allowed: true, success: false, reason: `Độ kiếp thất bại! Mất ${lost} tu vi.`, hpLeft: 0, log };
    }
  }
  if (p.realmIndex < REALMS.length - 1) p.realmIndex++;
  p.stage = 1;
  p.exp = 0;
  return { allowed: true, success: true, hpLeft: Math.round(hp), log };
}
