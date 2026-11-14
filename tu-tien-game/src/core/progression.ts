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

export const btFlag = (p: PlayerState) => `bt_${REALMS[p.realmIndex].id}_${p.stage}`;

/** Bình cảnh: tầng nằm trong `bottlenecks` của cảnh giới, chưa được "phá" bằng cơ duyên / Phá Cảnh Đan. */
export function isBottleneckStage(p: PlayerState): boolean {
  return p.stage < REALMS[p.realmIndex].stages && (REALMS[p.realmIndex].bottlenecks ?? []).includes(p.stage) && !p.flags[btFlag(p)];
}

/** Đủ tu vi nhưng đang bị bình cảnh chặn. */
export function isBottlenecked(p: PlayerState): boolean {
  return isBottleneckStage(p) && p.exp >= expNeeded(p);
}

/** Phá bình cảnh (ngộ đạo / Phá Cảnh Đan). Trả về số tầng lên được ngay sau đó. */
export function clearBottleneck(p: PlayerState): number {
  if (!isBottleneckStage(p)) return 0;
  p.flags[btFlag(p)] = true;
  return levelUpStages(p);
}

export function levelUpStages(p: PlayerState): number {
  let ups = 0;
  const realm = REALMS[p.realmIndex];
  while (p.stage < realm.stages && p.exp >= expNeeded(p)) {
    if (isBottleneckStage(p)) { p.exp = Math.min(p.exp, expNeeded(p)); break; } // bị chặn: không tích trữ vượt trần
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

/** Tâm ma kiếp: từ Kết Đan trở lên phải vượt qua trước lôi kiếp. */
export const tamMaFlag = (p: PlayerState) => `tam_ma_${REALMS[p.realmIndex + 1]?.id ?? 'x'}`;
export function needsTamMa(p: PlayerState): boolean {
  const next = REALMS[p.realmIndex + 1];
  return !!next && p.realmIndex + 1 >= 2 && !p.flags[tamMaFlag(p)];
}
/** Tâm ma là bản sao của chính bạn: đạo tâm càng thấp càng mạnh (đạo tâm 50 = ngang bạn). */
export function tamMaFactor(p: PlayerState): number {
  return 0.8 + (100 - p.daoHeart) / 250;
}

/** Kiểm tra điều kiện "khí tức". Chưa đủ → không phạt, chỉ bảo quay về tu thêm. */
export function tribulationReadiness(p: PlayerState): { ready: boolean; ratio: number; reason?: string } {
  const trib = tribulationFor(p);
  if (!trib) return { ready: false, ratio: 1, reason: 'Cảnh giới này không cần độ kiếp.' };
  if (!atStageCap(p)) return { ready: false, ratio: 0, reason: 'Tu vi chưa đầy tầng cuối.' };
  if (needsTamMa(p)) return { ready: false, ratio: 1, reason: 'Cần vượt qua TÂM MA KIẾP trước khi độ lôi kiếp.' };
  const ratio = power(computeStats(p)) / trib.recommendedPower;
  if (ratio < 0.7) return { ready: false, ratio, reason: 'Khí tức chưa ổn, thiên lôi sẽ nghiền nát ngươi. Hãy tu luyện thêm.' };
  return { ready: true, ratio };
}

export type TribChoice = 'dodge' | 'guard' | 'pill';

export interface WaveResult { wave: number; choice: TribChoice; dmg: number; hp: number; dodged: boolean; dead: boolean; done: boolean }

/** Lôi kiếp chạy từng đợt (để scene điện ảnh chọn từng đợt) — runTribulation bên dưới dùng lại cùng logic. */
export class TribulationRun {
  hp: number;
  maxHp: number;
  wave = 0;
  readonly waves: number;
  readonly name: string;
  private boltPower: number;
  private stats;
  constructor(private p: PlayerState, private rng: Rng, private shield = 0) {
    const t = tribulationFor(p);
    if (!t) throw new Error('Không có lôi kiếp');
    this.waves = t.waves; this.name = t.name; this.boltPower = t.boltPower;
    this.stats = computeStats(p);
    this.maxHp = this.stats.hp; this.hp = this.maxHp;
  }

  step(choice: TribChoice): WaveResult {
    const i = this.wave;
    const st = this.stats;
    let dmg = this.boltPower * (1 + i * 0.25) * this.rng.range(0.9, 1.1);
    let dodged = false;
    if (choice === 'dodge') {
      dodged = this.rng.chance(0.35 + st.spd / 600);
      dmg *= dodged ? 0.1 : 1.2;
    } else if (choice === 'guard') dmg = Math.max(1, dmg - st.def * 1.2) * 0.8;
    else dmg *= 0.9;
    dmg *= 1 - Math.min(0.6, this.shield);
    // Đạo tâm cao giảm một phần sát thương tâm ma kèm theo
    dmg *= 1 - Math.min(0.2, this.p.daoHeart / 500);
    if (choice === 'pill') this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.2);
    this.hp -= dmg;
    this.wave++;
    const dead = this.hp <= 0;
    return { wave: i + 1, choice, dmg: Math.round(dmg), hp: Math.max(0, Math.round(this.hp)), dodged, dead, done: dead || this.wave >= this.waves };
  }

  /** Áp kết quả lên người chơi. */
  finish(success: boolean): { lost: number } {
    if (success) {
      if (this.p.realmIndex < REALMS.length - 1) this.p.realmIndex++;
      this.p.stage = 1;
      this.p.exp = 0;
      return { lost: 0 };
    }
    const lost = Math.round(this.p.exp * 0.3);
    this.p.exp -= lost;
    return { lost };
  }
}

export function runTribulation(p: PlayerState, plan: TribulationPlan, rng: Rng): TribulationResult {
  const ready = tribulationReadiness(p);
  if (!ready.ready || !tribulationFor(p)) return { allowed: false, success: false, reason: ready.reason, hpLeft: 0, log: [] };
  const run = new TribulationRun(p, rng, plan.shield);
  const log: string[] = [];
  for (let i = 0; i < run.waves; i++) {
    const r = run.step(plan.choices[i] ?? 'guard');
    log.push(`Đợt ${r.wave}: ${r.choice} → nhận ${r.dmg} sát thương, còn ${r.hp}.`);
    if (r.dead) {
      const { lost } = run.finish(false);
      return { allowed: true, success: false, reason: `Độ kiếp thất bại! Mất ${lost} tu vi.`, hpLeft: 0, log };
    }
  }
  run.finish(true);
  return { allowed: true, success: true, hpLeft: Math.round(run.hp), log };
}
