import { REALMS } from './data';
import { DAY_SECONDS } from './time';
import { atStageCap, expNeeded, gainExp, isBottlenecked, levelUpStages } from './progression';
import type { MapDef } from './tiled';
import type { PlayerState } from './types';

/**
 * Giới hạn thiền (thay cho việc bấm nút vô hạn):
 *  - Mỗi lần thiền = 1 canh giờ (2 giờ game ≈ 25 giây thực): thế giới trôi qua, ban đêm có thể đến.
 *  - Tốn TÂM LỰC; chỉ hồi khi bạn thực sự chơi (thời gian thiền KHÔNG hồi tâm lực) → phải đi đánh/làm việc giữa các lần thiền.
 *  - Hiệu quả nhân với LINH KHÍ tại chỗ (mỗi vùng khác nhau, có linh mạch đậm hơn).
 *  - Cần nơi yên tĩnh (không có quái ở gần).
 *  - BÌNH CẢNH: một số tầng đủ tu vi vẫn không lên được, cần cơ duyên / Phá Cảnh Đan.
 *  - BẾ QUAN: tu luyện cả khi rời game (hiệu suất thấp hơn, có trần).
 */
export const MED = {
  energyCost: 12,
  hours: 2,
  regenPerSec: 100 / (DAY_SECONDS * 0.5), // đầy lại sau nửa ngày game khi đang chơi
  baseFrac: 0.12, // mỗi lần thiền = 12% tu vi cần cho tầng hiện tại × linh khí
  seclusionUnitSec: 600, // cứ 10 phút thực = 1 lần thiền
  seclusionMaxUnits: 48, // trần 8 tiếng thực
  seclusionMinSec: 600,
  seclusionEff: 0.5,
  calmRadiusTiles: 7,
} as const;

export function energyNow(p: PlayerState): number {
  return Math.min(100, Math.max(0, p.med.energy + (p.playtime - p.med.at) * MED.regenPerSec));
}

/** Số giây chơi cần để đủ tâm lực cho 1 lần thiền nữa. */
export function secondsUntilEnergy(p: PlayerState): number {
  const need = MED.energyCost - energyNow(p);
  return need <= 0 ? 0 : Math.ceil(need / MED.regenPerSec);
}

/** Linh khí tại vị trí: lấy giá trị cao nhất giữa nền của map và các linh mạch trong bán kính. */
export function auraAt(map: Pick<MapDef, 'aura' | 'auras'>, x: number, y: number): { value: number; label: string } {
  let best = { value: map.aura, label: 'linh khí vùng' };
  for (const a of map.auras) if (Math.hypot(a.x - x, a.y - y) <= a.r && a.value > best.value) best = { value: a.value, label: a.label };
  return best;
}

export interface MedResult { ok: boolean; msg: string; gain?: number; ups?: number }

function baseGain(p: PlayerState, aura: number, quality = 1): number {
  return expNeeded(p) * MED.baseFrac * aura * quality;
}

/** Hiệu quả theo tâm lực: 70% khi gần cạn, 100% khi đầy. */
export function energyQuality(p: PlayerState): number {
  return 0.7 + 0.3 * (energyNow(p) / 100);
}

export function canMeditate(p: PlayerState, calm: boolean): { ok: boolean; reason?: string } {
  if (!calm) return { ok: false, reason: 'Quanh đây không yên tĩnh (có quái ở gần). Hãy đến nơi vắng hơn.' };
  if (isBottlenecked(p)) return { ok: false, reason: 'Bình cảnh! Cần cơ duyên hoặc Phá Cảnh Đan để đột phá tầng này.' };
  if (atStageCap(p)) return { ok: false, reason: 'Tu vi đã đầy tầng cuối, hãy độ kiếp.' };
  if (energyNow(p) < MED.energyCost) return { ok: false, reason: `Tâm lực cạn. Hãy hoạt động khoảng ${secondsUntilEnergy(p)} giây rồi thiền tiếp.` };
  return { ok: true };
}

export function meditate(p: PlayerState, aura: number, calm: boolean): MedResult {
  const c = canMeditate(p, calm);
  if (!c.ok) return { ok: false, msg: c.reason! };
  const quality = energyQuality(p);
  const e = energyNow(p) - MED.energyCost;
  const g = gainExp(p, baseGain(p, aura, quality));
  p.playtime += (MED.hours / 24) * DAY_SECONDS; // thời gian trôi
  p.med = { energy: e, at: p.playtime }; // thời gian thiền không hồi tâm lực
  const ups = levelUpStages(p);
  return { ok: true, gain: g.gained, ups, msg: `Thiền một canh giờ: +${g.gained} tu vi${ups ? ` · lên ${ups} tầng!` : ''}${isBottlenecked(p) ? ' · BÌNH CẢNH!' : ''}` };
}

/* ───────────── Bế quan (tu luyện offline) ───────────── */
export function startSeclusion(p: PlayerState, aura: number, now: number): MedResult {
  if (p.seclusion) return { ok: false, msg: 'Bạn đang bế quan.' };
  p.seclusion = { startedAt: now, aura };
  return { ok: true, msg: 'Bắt đầu bế quan. Hãy rời game, quay lại sau để xuất quan.' };
}

export function seclusionUnits(p: PlayerState, now: number): number {
  if (!p.seclusion) return 0;
  const sec = Math.max(0, (now - p.seclusion.startedAt) / 1000);
  return Math.min(MED.seclusionMaxUnits, Math.floor(sec / MED.seclusionUnitSec));
}

/** Xuất quan: nhận tu vi theo thời gian đã bế quan. `force` = cho xuất sớm (chưa đủ 1 đơn vị thì không nhận gì). */
export function claimSeclusion(p: PlayerState, now: number): MedResult {
  if (!p.seclusion) return { ok: false, msg: 'Bạn không đang bế quan.' };
  const units = seclusionUnits(p, now);
  const aura = p.seclusion.aura;
  p.seclusion = null;
  if (units <= 0) return { ok: true, gain: 0, ups: 0, msg: 'Xuất quan sớm, chưa thu được gì (cần bế quan ít nhất 10 phút).' };
  let total = 0, ups = 0, blocked = false;
  for (let i = 0; i < units; i++) {
    if (atStageCap(p) || isBottlenecked(p)) { blocked = true; break; }
    total += gainExp(p, baseGain(p, aura) * MED.seclusionEff).gained;
    ups += levelUpStages(p);
  }
  const minutes = Math.round(units * (MED.seclusionUnitSec / 60));
  return { ok: true, gain: total, ups, msg: `Xuất quan sau ${minutes} phút tu luyện: +${total} tu vi${ups ? ` · lên ${ups} tầng` : ''}${blocked || isBottlenecked(p) ? ' · đã chạm giới hạn (bình cảnh / đầy tầng).' : '.'}` };
}

export function cancelSeclusion(p: PlayerState): void {
  p.seclusion = null;
}

export const MED_REALM_NAME = (p: PlayerState) => REALMS[p.realmIndex].name;
