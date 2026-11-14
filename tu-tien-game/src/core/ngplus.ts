import { newPlayer } from './save';
import type { PlayerState } from './types';

/**
 * Chơi lại (NG+): bắt đầu cuộc đời mới nhưng giữ lại những gì "ở lại với linh hồn".
 *  Giữ: thành tựu, thống kê, thời trang đã mua, đan phương đã học, trận pháp đã học, tầng cao nhất ở Vô Tận Tháp, độ khó.
 *  Thưởng: bắt đầu với Hỗn Độn Căn (không còn Tàn Căn), tu vi ×1.25 mỗi chu kỳ, 10% linh thạch (tối đa 5000).
 *  Đánh đổi: kẻ địch mạnh thêm 15% HP/Công mỗi chu kỳ (xem difficulty.ts).
 */
export function canStartNgPlus(p: PlayerState): boolean {
  return !!p.flags.game_won;
}

export function startNewGamePlus(p: PlayerState): PlayerState {
  const n = newPlayer(p.name);
  n.ngPlus = (p.ngPlus ?? 0) + 1;
  n.difficulty = p.difficulty;
  n.rootId = 'hon_don';
  n.gold = 20 + Math.min(5000, Math.floor(p.gold * 0.1));
  n.achievements = [...p.achievements];
  n.counters = { ...p.counters };
  n.fashion = { owned: [...p.fashion.owned], worn: { ...p.fashion.worn } };
  n.knownRecipes = [...p.knownRecipes];
  n.formations = [...p.formations];
  n.towerBest = p.towerBest;
  return n;
}
