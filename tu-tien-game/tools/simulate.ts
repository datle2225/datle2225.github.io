/* Thư viện mô phỏng cân bằng: mỗi nhánh tự đánh N trận vs nhóm địch. CLI: `npm run sim`. */
import { autoBattle } from '../src/core/encounter';
import { Rng } from '../src/core/rng';
import { newPlayer } from '../src/core/save';

export interface Scenario { name: string; realm: number; stage: number; enemies: string[] }
export const SCENARIOS: Scenario[] = [
  { name: 'LK1 vs 1 Sói', realm: 0, stage: 1, enemies: ['soi_hoang'] },
  { name: 'LK5 vs 2 Sói', realm: 0, stage: 5, enemies: ['soi_hoang', 'soi_hoang'] },
  { name: 'LK9 vs Đệ tử HAM', realm: 0, stage: 9, enemies: ['huyet_anh_do_de'] },
  { name: 'TC5 vs Ma Tu', realm: 1, stage: 5, enemies: ['ma_tu_lang_thang'] },
  { name: 'TC5 vs Boss', realm: 1, stage: 5, enemies: ['boss_huyet_anh_truong_lao'] },
  { name: 'TC9 vs Boss', realm: 1, stage: 9, enemies: ['boss_huyet_anh_truong_lao'] },
  { name: 'KĐ3 vs 2 Quái', realm: 2, stage: 3, enemies: ['huyet_quai', 'doc_trung'] },
  { name: 'KĐ5 vs Độc Thủ', realm: 2, stage: 5, enemies: ['doc_thu_tien_sinh'] },
  { name: 'KĐ6 vs Mặc Gia', realm: 2, stage: 6, enemies: ['mac_gia_chu'] },
];

export function winRate(branch: string, sc: Scenario, n = 200): { win: number; hp: number; actions: number } {
  let w = 0, hp = 0, act = 0;
  for (let i = 0; i < n; i++) {
    const p = newPlayer();
    p.rootId = 'kim'; p.realmIndex = sc.realm; p.stage = sc.stage; p.branchId = sc.realm === 0 ? null : branch; // trước Trúc Cơ chưa có nhánh
    const r = autoBattle(p, sc.enemies, new Rng(1000 + i));
    if (r.won) { w++; hp += r.hpLeft; }
    act += r.actions;
  }
  return { win: w / n, hp: w ? hp / w : 0, actions: act / n };
}

