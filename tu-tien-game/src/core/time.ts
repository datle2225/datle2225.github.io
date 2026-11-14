import type { PlayerState } from './types';

/** Một ngày trong game = 300 giây chơi (khớp chu kỳ nhập hàng). Bắt đầu lúc 8 giờ sáng. */
export const DAY_SECONDS = 300;
const START_HOUR = 8;

export function gameHour(p: PlayerState): number {
  return ((p.playtime / DAY_SECONDS) * 24 + START_HOUR) % 24;
}

/** Khoảng giờ [from,to) có hỗ trợ vòng qua nửa đêm (ví dụ [22,6]). */
export function inHours(hour: number, from: number, to: number): boolean {
  return from <= to ? hour >= from && hour < to : hour >= from || hour < to;
}

export function isNight(hour: number): boolean {
  return inHours(hour, 20, 5);
}

/** Độ tối 0..0.5 của lớp phủ ban đêm (mượt khi hoàng hôn / bình minh). */
export function nightAlpha(hour: number): number {
  if (inHours(hour, 21, 4)) return 0.5;
  if (inHours(hour, 18, 21)) return 0.5 * ((hour - 18) / 3);
  if (inHours(hour, 4, 7)) return 0.5 * (1 - (hour - 4) / 3);
  return 0;
}

export function formatHour(hour: number): string {
  const h = Math.floor(hour);
  return `${String(h).padStart(2, '0')}:${hour % 1 >= 0.5 ? '30' : '00'}`;
}
