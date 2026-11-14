import { load, newPlayer, save } from './core/save';
import type { PlayerState } from './core/types';

/** Trạng thái người chơi dùng chung cho mọi scene. */
export const game: { p: PlayerState } = { p: newPlayer() };

/** Độ khó chọn ở màn hình chính cho ván mới (mặc định Khó). */
export const newGame: { difficulty: 'normal' | 'hard' | 'nightmare' } = { difficulty: 'hard' };

export function startNew() {
  game.p = newPlayer();
  game.p.difficulty = newGame.difficulty;
}
export function continueGame(): boolean {
  const p = load();
  if (p) game.p = p;
  return !!p;
}
export function persist() {
  return save(game.p);
}
if (typeof window !== 'undefined') (window as unknown as { __game: typeof game }).__game = game; // phục vụ debug/test
