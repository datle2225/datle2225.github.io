import { load, newPlayer, save } from './core/save';
import type { PlayerState } from './core/types';

/** Trạng thái người chơi dùng chung cho mọi scene. */
export const game: { p: PlayerState } = { p: newPlayer() };

export function startNew() {
  game.p = newPlayer();
}
export function continueGame(): boolean {
  const p = load();
  if (p) game.p = p;
  return !!p;
}
export function persist() {
  return save(game.p);
}
