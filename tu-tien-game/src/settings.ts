const KEY = 'tu-tien-game:settings:v1';
export type JoyMode = 'auto' | 'on' | 'off';
export interface Settings { joystick: JoyMode }

const DEFAULTS: Settings = { joystick: 'auto' };

export function getSettings(): Settings {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }; } catch { return { ...DEFAULTS }; }
}
export function setSettings(s: Partial<Settings>) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...getSettings(), ...s })); } catch { /* bỏ qua */ }
}
export function isTouchDevice(): boolean {
  return typeof window !== 'undefined' && ('ontouchstart' in window || (navigator.maxTouchPoints ?? 0) > 0);
}
export function joystickEnabled(): boolean {
  const m = getSettings().joystick;
  return m === 'on' || (m === 'auto' && isTouchDevice());
}
