import { describe, expect, it } from 'vitest';
import { newPlayer } from '../src/core/save';
import { Rng } from '../src/core/rng';
import { Battle, makeUnit } from '../src/core/battle';
import { buildBattle } from '../src/core/encounter';
import { computeStats } from '../src/core/stats';
import { gainExp, expNeeded } from '../src/core/progression';
import { buyPrice } from '../src/core/services';
import { DialogueRunner, pickDialogue } from '../src/core/story';
import { completeQuest, questEvent } from '../src/core/session';
import { loadMap } from '../src/core/maps';
import { enemyMap } from '../src/core/data';
import { LAW_CHANGE_COST, addContribution, canJoin, chooseLaw, claimStipend, donate, factionPerks, formationFx, joinFaction, leaveFaction, learnFormation, lawPerks, pendingStipend, rankIndex, setFormation } from '../src/core/advanced';
import { SCENARIOS, winRate } from '../tools/simulate';
import { BRANCHES } from '../src/core/data';

const na = () => { const p = newPlayer(); p.rootId = 'kim'; p.realmIndex = 3; p.stage = 5; p.branchId = 'kiem_tu'; p.gold = 20000; p.unlockedSystems.push('tran_phap', 'the_luc', 'thoat_xac'); return p; };
const S = { hp: 1000, mp: 100, atk: 100, def: 0, spd: 100, crit: 0 };

describe('trận pháp', () => {
  it('chỉ học được khi đã mở hệ, tốn tiền, không học hai lần', () => {
    const p = newPlayer(); p.gold = 5000;
    expect(learnFormation(p, 'kim_cuong').ok).toBe(false); // chưa mở hệ
    const q = na();
    expect(learnFormation(q, 'kim_cuong').ok).toBe(true);
    expect(q.gold).toBe(20000 - 800);
    expect(learnFormation(q, 'kim_cuong').ok).toBe(false);
    expect(setFormation(q, 'phi_phong').ok).toBe(false); // chưa học
    expect(setFormation(q, 'kim_cuong').ok).toBe(true);
    expect(formationFx(q).defMul).toBe(1.2);
    setFormation(q, null);
    expect(formationFx(q).defMul).toBe(1);
  });
  it('trận được áp dụng cho cả đội trong trận: Kim Cương tăng Thủ giảm Tốc', () => {
    const p = na(); p.party = ['nguyet_nhi'];
    const base = buildBattle(p, ['soi_hoang'], new Rng(1)).battle.units.filter((u) => u.side === 'player');
    learnFormation(p, 'kim_cuong'); setFormation(p, 'kim_cuong');
    const fx = buildBattle(p, ['soi_hoang'], new Rng(1)).battle.units.filter((u) => u.side === 'player');
    expect(fx.length).toBe(2);
    fx.forEach((u, i) => { expect(u.stats.def).toBe(Math.round(base[i].stats.def * 1.2)); expect(u.stats.spd).toBeLessThan(base[i].stats.spd); });
  });
  it('Tụ Linh hồi thêm linh lực; Thái Cực hồi HP mỗi lần hành động; Huyết Sát nhận thêm sát thương', () => {
    const p = na(); ['tu_linh', 'thai_cuc', 'huyet_sat'].forEach((id) => learnFormation(p, id));
    setFormation(p, 'tu_linh');
    expect(buildBattle(p, ['soi_hoang'], new Rng(1)).battle.mpRegen).toBe(2 + 4);
    setFormation(p, 'thai_cuc');
    const b = buildBattle(p, ['soi_hoang'], new Rng(2)); b.player.hp = 100;
    b.battle.act(b.player, 'kiem_co_ban');
    expect(b.player.hp).toBeGreaterThan(100);
    setFormation(p, 'huyet_sat');
    const hs = buildBattle(p, ['soi_hoang'], new Rng(3));
    expect(hs.player.takenMul).toBe(1.1);
  });
});

describe('thế lực', () => {
  it('điều kiện gia nhập theo danh vọng; một thế lực một lúc', () => {
    const p = na();
    expect(canJoin(p, 'thanh_van').ok).toBe(false);
    p.rep.chinh_dao = 5;
    expect(joinFaction(p, 'thanh_van').ok).toBe(true);
    expect(joinFaction(p, 'van_duoc').ok).toBe(false); // đã có thế lực
    expect(leaveFaction(p).ok).toBe(true);
    expect(p.faction).toBeNull();
    expect(canJoin(newPlayer(), 'van_duoc').reason).toMatch(/Thế lực/); // chưa mở hệ
  });
  it('điểm cống hiến thăng chức và tăng phúc lợi', () => {
    const p = na(); p.rep.chinh_dao = 5; joinFaction(p, 'thanh_van');
    const a0 = computeStats(p).atk;
    expect(rankIndex(p)).toBe(0);
    addContribution(p, 100);
    expect(rankIndex(p)).toBe(1);
    addContribution(p, 300);
    expect(rankIndex(p)).toBe(2);
    expect(factionPerks(p).defMul).toBe(1.05);
    expect(computeStats(p).atk).toBeGreaterThan(a0);
  });
  it('quyên góp, bổng lộc theo ngày game (tối đa 3 ngày), quest cộng điểm', () => {
    const p = na(); joinFaction(p, 'van_duoc');
    expect(donate(p, 5).ok).toBe(false);
    donate(p, 250);
    expect(p.faction!.points).toBe(25);
    expect(pendingStipend(p)).toBe(0);
    p.playtime += 150; // nửa ngày
    expect(pendingStipend(p)).toBe(7);
    p.playtime += 5000;
    expect(pendingStipend(p)).toBe(45); // trần 3 ngày × 15
    const g = p.gold; expect(claimStipend(p).ok).toBe(true);
    expect(p.gold).toBe(g + 45);
    expect(claimStipend(p).ok).toBe(false);
    const before = p.faction!.points;
    p.quests.active.push('m1_1'); completeQuest(p, 'm1_1');
    expect(p.faction!.points).toBe(before + 30);
  });
  it('Vạn Dược Cốc giảm giá cửa hàng; Tán Tu Liên Minh tăng tu vi', () => {
    const p = na(); p.rep.tan_tu = 2;
    const full = buyPrice(p, 'tho_ren', 1000);
    joinFaction(p, 'van_duoc');
    expect(buyPrice(p, 'tho_ren', 1000)).toBe(Math.round(full * 0.96));
    leaveFaction(p); joinFaction(p, 'tan_tu');
    const q = na(); q.rootId = 'kim';
    expect(gainExp(p, 100).gained).toBe(105);
    expect(gainExp(q, 100).gained).toBe(100);
    expect(expNeeded(p)).toBeGreaterThan(0);
  });
});

describe('pháp tắc (Hóa Thần)', () => {
  const ht = () => { const p = na(); p.realmIndex = 4; p.unlockedSystems.push('phap_tac'); return p; };
  it('chọn lần đầu miễn phí, đổi tốn linh thạch', () => {
    const p = ht(); p.gold = 3000;
    expect(chooseLaw(newPlayer(), 'hu_khong').ok).toBe(false);
    expect(chooseLaw(p, 'hu_khong').ok).toBe(true);
    expect(p.gold).toBe(3000);
    expect(chooseLaw(p, 'hu_khong').ok).toBe(false);
    expect(chooseLaw(p, 'sinh_tu').ok).toBe(true);
    expect(p.gold).toBe(3000 - LAW_CHANGE_COST);
    p.gold = 10; expect(chooseLaw(p, 'loi_dinh').ok).toBe(false);
  });
  it('Thời Gian nâng ngưỡng mềm Tốc Độ', () => {
    const slow = makeUnit('a', 'A', 'player', { ...S, spd: 300 }, ['kiem_co_ban']);
    const fast = makeUnit('b', 'B', 'player', { ...S, spd: 300 }, ['kiem_co_ban']);
    fast.perks = { softcap: 220 };
    const bt = new Battle([slow, fast, makeUnit('e', 'E', 'enemy', S, ['kiem_co_ban'])], new Rng(1));
    expect(bt.preview(1)[0].unit.id).toBe('b'); // nhanh hơn nên có lượt đầu
  });
  it('Sinh Tử hồi máu khi hạ gục', () => {
    const a = makeUnit('player', 'A', 'player', { ...S, atk: 9999 }, ['kiem_co_ban']); a.hp = 100; a.perks = { healOnKill: 0.1 };
    const e = makeUnit('e', 'E', 'enemy', { ...S, hp: 5 }, ['kiem_co_ban']);
    new Battle([a, e], new Rng(1)).act(a, 'kiem_co_ban');
    expect(a.hp).toBe(200);
  });
  it('Hư Không né đòn (xác suất), Lôi Đình tăng sát thương bạo kích, Ngũ Hành tăng khắc hệ', () => {
    const e = makeUnit('e', 'E', 'enemy', { ...S, atk: 10 }, ['kiem_co_ban']);
    const a = makeUnit('player', 'A', 'player', { ...S, hp: 99999 }, ['kiem_co_ban']); a.perks = { dodge: 0.5 };
    const bt = new Battle([a, e], new Rng(5));
    let miss = 0; for (let i = 0; i < 200; i++) if (bt.act(e, 'kiem_co_ban').some((x) => x.type === 'miss')) miss++;
    expect(miss).toBeGreaterThan(70); expect(miss).toBeLessThan(130);
    const x = makeUnit('x', 'X', 'player', S, ['kiem_co_ban']), y = makeUnit('y', 'Y', 'enemy', S, ['kiem_co_ban']);
    const bt2 = new Battle([x, y], new Rng(1));
    const base = bt2.calcDamage(x, y, { power: 1, element: 'none' } as any, 1, true);
    x.perks = { critDmg: 1.8 };
    expect(bt2.calcDamage(x, y, { power: 1, element: 'none' } as any, 1, true)).toBeGreaterThan(base * 1.1);
    x.element = 'kim'; y.element = 'moc'; x.perks = {};
    const norm = bt2.calcDamage(x, y, { power: 1, element: 'kim' } as any, 1, false);
    x.perks = { elemBonus: true };
    expect(bt2.calcDamage(x, y, { power: 1, element: 'kim' } as any, 1, false)).toBeGreaterThan(norm * 1.1);
    expect(lawPerks({ law: 'loi_dinh' }).critBonus).toBe(0.08);
  });
  it('pháp tắc vào trận qua encounter và Lôi Đình tăng bạo kích trong chỉ số', () => {
    const p = ht(); const c0 = computeStats(p).crit;
    chooseLaw(p, 'loi_dinh');
    expect(computeStats(p).crit).toBeCloseTo(c0 + 0.08);
    expect(buildBattle(p, ['soi_hoang'], new Rng(1)).player.perks?.critDmg).toBe(1.8);
  });
});

describe('Phần 2: Thiên Phong Thành & Kiếm Trủng', () => {
  it('cổng chỉ mở khi đã hoàn thành Phần 1 và đạt Hóa Thần; nối hai chiều', () => {
    const po = loadMap('thien_kiep_dai').portals.find((q) => q.target === 'thien_phong')!;
    expect(po.if).toEqual({ minRealm: 4, flag: 'game_complete' });
    expect(loadMap('thien_phong').portals.some((q) => q.target === 'thien_kiep_dai')).toBe(true);
  });
  it('chuỗi nhiệm vụ Kiếm Sư → Kiếm Trủng, cờ boss và đoạn kết bản thử', () => {
    const p = newPlayer(); p.realmIndex = 4; p.quests = { active: [], done: [], progress: {} };
    const ks = loadMap('thien_phong').npcs.find((n) => n.id === 'kiem_su')!;
    expect(pickDialogue(p, ks.talk)).toBe('kiem_su_1');
    const d2 = new DialogueRunner(p, 'kiem_su_1'); // tự nhận m4_1 rồi hoàn thành khi nói chuyện
    expect(d2.out.completed).toContain('m4_1');
    expect(p.quests.active).toContain('m4_2');
    expect(pickDialogue(p, ks.talk)).toBe('kiem_su_wait');
    questEvent(p, 'reach', 'kiem_trung_sau');
    expect(questEvent(p, 'battle', 'thien_phong_kiem_chu')).toContain('m4_2');
    const e = new DialogueRunner(p, 'phan2_demo_end'); while (!e.ended) e.advance();
    expect(p.flags.phan2_demo_done).toBe(true);
    const boss = enemyMap.get('thien_phong_kiem_chu');
    expect(boss.phases.length).toBe(3); expect(boss.flagOnWin).toBe('enemy6_dead');
  });
  it('cân bằng Hóa Thần: quái ≥ 85%, Kiếm Chủ mọi nhánh ≥ 20% và trung bình ≤ 90%', () => {
    const branches = BRANCHES.filter((b: any) => b.playable).map((b: any) => b.id as string);
    const trash = SCENARIOS.find((s) => s.name.startsWith('HT3'))!;
    for (const b of branches) expect(winRate(b, trash, 40).win, `${b} vs quái HT`).toBeGreaterThanOrEqual(0.85);
    const boss = SCENARIOS.find((s) => s.name === 'HT5 vs Kiếm Chủ')!;
    const r = branches.map((b) => winRate(b, boss, 50).win);
    r.forEach((x, i) => expect(x, branches[i]).toBeGreaterThanOrEqual(0.2));
    expect(r.reduce((a, b) => a + b, 0) / r.length).toBeLessThanOrEqual(0.9);
  });
  it('pháp tắc/trận pháp làm trùm Hóa Thần dễ hơn (sức mạnh có ý nghĩa)', () => {
    const boss = ['thien_phong_kiem_chu'];
    const wr = (setup: (p: ReturnType<typeof na>) => void) => { let w = 0; for (let i = 0; i < 50; i++) { const p = na(); p.realmIndex = 4; p.stage = 5; p.unlockedSystems.push('phap_tac'); setup(p); const { battle } = buildBattle(p, boss, new Rng(2000 + i)); let n = 0; while (!battle.winner && n < 400) { const c = battle.current()!; const id = battle.aiPick(c); battle.act(c, id, battle.aiTarget(c, id)); n++; } if (battle.winner === 'player') w++; } return w / 50; };
    const none = wr(() => {});
    const full = wr((p) => { learnFormation(p, 'huyet_sat'); setFormation(p, 'huyet_sat'); chooseLaw(p, 'sinh_tu'); p.rep.chinh_dao = 5; joinFaction(p, 'thanh_van'); addContribution(p, 400); });
    expect(full).toBeGreaterThan(none);
  });
});
