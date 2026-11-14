/** Hàm chấm điểm thuần cho mini-game rèn đồ & luyện đan (scene chỉ lo hiển thị / input). */

/** Búa rèn: con trỏ chạy 0..1, vùng sáng tâm `center` rộng `width`. Trả điểm 0..1 cho một nhát. */
export function strikeScore(cursor: number, center: number, width: number): number {
  const d = Math.abs(cursor - center);
  const half = width / 2;
  if (d <= half * 0.35) return 1; // trúng tâm
  if (d <= half) return 0.6 + 0.4 * (1 - (d - half * 0.35) / (half * 0.65));
  const out = Math.max(0, 1 - (d - half) / 0.25);
  return out * 0.4;
}

/** Điểm rèn = trung bình các nhát. */
export function forgeMiniScore(strikes: number[]): number {
  return strikes.length ? strikes.reduce((a, b) => a + b, 0) / strikes.length : 0;
}

/** Độ rộng vùng sáng theo độ hiếm mục tiêu (cao hơn → hẹp hơn) và cấp nghề. */
export function forgeZoneWidth(targetRarity: number, smithLevel: number): number {
  return Math.max(0.1, 0.34 - targetRarity * 0.05 + Math.min(0.1, smithLevel * 0.01));
}

/** Hỏa hầu: mỗi tick nhiệt đổi theo `heating`, điểm = tỉ lệ thời gian nằm trong vùng xanh. */
export interface HeatSim { temp: number; inBand: number; ticks: number }
export function heatStep(sim: HeatSim, heating: boolean, dt: number, band: [number, number], drift = 0): HeatSim {
  const rate = heating ? 0.55 : -0.4;
  const temp = Math.min(1, Math.max(0, sim.temp + (rate + drift) * dt));
  const inside = temp >= band[0] && temp <= band[1];
  return { temp, inBand: sim.inBand + (inside ? dt : 0), ticks: sim.ticks + dt };
}
export function heatScore(sim: HeatSim): number {
  return sim.ticks > 0 ? sim.inBand / sim.ticks : 0;
}
/** Vùng xanh hẹp dần theo độ khó đan phương (1..9). */
export function heatBand(difficulty: number): [number, number] {
  const w = Math.max(0.12, 0.34 - (difficulty - 1) * 0.035);
  return [0.55 - w / 2, 0.55 + w / 2];
}
