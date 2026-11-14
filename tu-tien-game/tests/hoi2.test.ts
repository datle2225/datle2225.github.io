import { describe, expect, it } from 'vitest';
import { newPlayer } from '../src/core/save';
import { Rng } from '../src/core/rng';
import { DialogueRunner, pickDialogue } from '../src/core/story';
import { questEvent } from '../src/core/session';
import { autoBattle } from '../src/core/encounter';
import { needsTamMa, tamMaFactor, tamMaFlag, tribulationReadiness } from '../src/core/progression';
import { computeStats } from '../src/core/stats';
import { cancelBid, currentLots, lotsForDay, myBid, placeBid, settleAuctions } from '../src/core/auction';
import { worldDay } from '../src/core/services';
import { loadMap } from '../src/core/maps';
import { enemyMap, QUESTS, rootMap } from '../src/core/data';
import { gainExp, clearBottleneck, expNeeded, isBottlenecked } from '../src/core/progression';
import { commissionBrew } from '../src/core/services';

const kd = () => { const p = newPlayer(); p.rootId = 'kim'; p.realmIndex = 2; p.stage = 5; p.branchId = 'kiem_tu'; p.chapter = 6; p.quests = { active: [], done: ['m1_1', 'm1_2', 'm1_3'], progress: {} }; return p; };

describe('chuỗi nhiệm vụ Hồi 2', () => {
  it('Thiên Cơ Các → bí cảnh → Độc Thủ → manh mối Mặc Gia', () => {
    const p = kd();
    const talk = loadMap('phuong_thi').npcs.find((n) => n.id === 'thien_co')!;
    expect(pickDialogue(p, talk.talk)).toBe('thien_co_m2');
    const d = new DialogueRunner(p, 'thien_co_m2'); d.advance();
    expect(p.quests.active).toContain('m2_1');
    expect(questEvent(p, 'reach', 'bi_canh_sau')).toContain('m2_1');
    expect(p.quests.active).toContain('m2_2');
    expect(questEvent(p, 'battle', 'doc_thu_tien_sinh')).toContain('m2_2');
    expect(p.quests.active).toContain('m2_3');
    expect(pickDialogue(p, talk.talk)).toBe('thien_co_m2b');
    new DialogueRunner(p, 'thien_co_m2b');
    expect(p.flags.mac_gia_known).toBe(true);
    expect(p.chapter).toBe(7);
  });
  it('Mặc Gia: tuyến vạch trần bằng chứng cứ (không đánh nhau) vẫn hoàn thành nhiệm vụ', () => {
    const p = kd();
    p.quests.active.push('m2_3'); p.inventory.mac_gia_chung_cu = 1; p.daoHeart = 50;
    questEvent(p, 'reach', 'mac_gia_trai');
    const d = new DialogueRunner(p, 'mac_gia_chu_1');
    d.advance(); // a → b
    const v = d.view()!;
    expect(v.choices.length).toBe(3);
    d.advance(0); // vạch trần
    const done = d.out.completed;
    expect(done).toContain('m2_3');
    expect(p.flags.enemy3_dead).toBe(true);
    expect(p.inventory.mac_gia_chung_cu).toBe(0);
    expect(p.daoHeart).toBe(54);
    expect(p.rep.chinh_dao).toBe(5);
  });
  it('không có chứng cứ thì không có lựa chọn vạch trần', () => {
    const p = kd(); p.quests.active.push('m2_3');
    const d = new DialogueRunner(p, 'mac_gia_chu_1'); d.advance();
    expect(d.view()!.choices.length).toBe(2);
  });
  it('tuyến đánh nhau phát lệnh battle', () => {
    const p = kd(); p.quests.active.push('m2_3');
    const d = new DialogueRunner(p, 'mac_gia_chu_1'); d.advance();
    d.advance(1);
    expect(d.out.battle).toEqual(['mac_gia_chu']);
    expect(p.flags.mac_route_fight).toBe(true);
  });
  it('gỡ phong ấn: Tàn Căn → Hỗn Độn Căn, tu luyện nhanh 5 lần so với trước', () => {
    const p = kd(); p.rootId = 'tan_can';
    const before = gainExp(newPlayerWith('tan_can'), 100).gained;
    const d = new DialogueRunner(p, 'unseal');
    while (!d.ended) d.advance();
    expect(p.rootId).toBe('hon_don');
    expect(p.flags.unsealed).toBe(true);
    expect((rootMap.get('hon_don') as any).expMul).toBe(1.6);
    expect(gainExp(newPlayerWith('hon_don'), 100).gained).toBe(160);
    expect(before).toBe(30);
  });
  it('kết cục theo đạo tâm', () => {
    const rules = [{ if: { minDao: 65 }, id: 'hoi2_end_chinh' }, { if: { maxDao: 35 }, id: 'hoi2_end_ma' }, { id: 'hoi2_end_tan' }];
    const p = kd();
    p.daoHeart = 80; expect(pickDialogue(p, rules)).toBe('hoi2_end_chinh');
    p.daoHeart = 20; expect(pickDialogue(p, rules)).toBe('hoi2_end_ma');
    p.daoHeart = 50; expect(pickDialogue(p, rules)).toBe('hoi2_end_tan');
  });
  it('mọi nhiệm vụ Hồi 2 và boss tham chiếu dữ liệu có thật', () => {
    for (const id of ['m2_1', 'm2_2', 'm2_3']) expect(QUESTS.some((q: any) => q.id === id)).toBe(true);
    for (const id of ['doc_thu_tien_sinh', 'mac_gia_chu']) { const e = enemyMap.get(id); expect(e.boss).toBe(true); expect(e.phases.length).toBe(2); expect(e.flagOnWin).toBeTruthy(); }
  });
  it('map Hồi 2 có cổng điều kiện và linh khí đậm', () => {
    const pt = loadMap('phuong_thi');
    expect(pt.portals.find((q) => q.target === 'huyet_nguyet')!.if).toEqual({ minRealm: 2 });
    expect(pt.portals.find((q) => q.target === 'hoang_mac')!.if).toEqual({ flag: 'mac_gia_known' });
    expect(loadMap('huyet_nguyet').aura).toBeGreaterThanOrEqual(2);
    expect(loadMap('huyet_nguyet').respawn).toBeLessThan(loadMap('thanh_ha').respawn);
    expect(loadMap('huyet_nguyet').foes.some((f) => f.group.includes('doc_thu_tien_sinh'))).toBe(true);
  });
});

function newPlayerWith(root: string) { const p = newPlayer(); p.rootId = root; return p; }

describe('tâm ma kiếp', () => {
  it('chỉ cần từ Kết Đan trở lên', () => {
    const p = newPlayer(); p.rootId = 'kim'; p.stage = 9; p.exp = 99999;
    expect(needsTamMa(p)).toBe(false); // Luyện Khí → Trúc Cơ
    p.realmIndex = 1;
    expect(needsTamMa(p)).toBe(true);  // Trúc Cơ → Kết Đan
    expect(tribulationReadiness(p).reason).toMatch(/TÂM MA/);
    p.flags[tamMaFlag(p)] = true;
    expect(needsTamMa(p)).toBe(false);
    expect(tribulationReadiness(p).ready).toBe(true);
  });
  it('đạo tâm càng thấp tâm ma càng mạnh', () => {
    const p = newPlayer();
    p.daoHeart = 100; const lo = tamMaFactor(p);
    p.daoHeart = 50; const mid = tamMaFactor(p);
    p.daoHeart = 0; const hi = tamMaFactor(p);
    expect(lo).toBeLessThan(mid); expect(mid).toBeLessThan(hi);
    expect(mid).toBeCloseTo(1.0);
  });
  it('mô phỏng: đạo tâm cao thắng tâm ma dễ hơn đạo tâm thấp', () => {
    const rate = (dao: number) => { let w = 0; for (let i = 0; i < 60; i++) { const p = kd(); p.realmIndex = 1; p.stage = 9; p.daoHeart = dao; if (autoBattle(p, ['tam_ma'], new Rng(500 + i)).won) w++; } return w / 60; };
    expect(rate(100)).toBeGreaterThan(rate(0));
    expect(computeStats(kd()).hp).toBeGreaterThan(0);
  });
});

describe('đấu giá NPC', () => {
  const rich = () => { const p = newPlayer(); p.gold = 100000; return p; };
  it('lô hàng ổn định theo ngày và khác nhau giữa các ngày', () => {
    const a = lotsForDay(3), b = lotsForDay(3), c = lotsForDay(4);
    expect(a.map((l) => [l.name, l.start, l.npcFinal])).toEqual(b.map((l) => [l.name, l.start, l.npcFinal]));
    expect(JSON.stringify(a.map((l) => l.name))).not.toBe(JSON.stringify(c.map((l) => l.name)));
    for (const l of a) { expect(l.npcFinal).toBeGreaterThan(l.start); expect(l.id.startsWith('3-')).toBe(true); }
  });
  it('đặt giá giữ cọc, tăng giá phải ≥ +10%, rút bị phí 10%', () => {
    const p = rich(); const lot = currentLots(p)[0];
    expect(placeBid(p, lot.id, lot.start - 1).ok).toBe(false);
    expect(placeBid(p, lot.id, lot.start).ok).toBe(true);
    expect(p.gold).toBe(100000 - lot.start);
    expect(placeBid(p, lot.id, lot.start + 1).ok).toBe(false);
    expect(placeBid(p, lot.id, Math.ceil(lot.start * 1.1)).ok).toBe(true);
    expect(myBid(p, lot.id)).toBe(Math.ceil(lot.start * 1.1));
    const g = p.gold; cancelBid(p, lot.id);
    expect(p.gold).toBe(g + Math.floor(Math.ceil(lot.start * 1.1) * 0.9));
  });
  it('không đủ tiền thì không đặt', () => {
    const p = newPlayer(); p.gold = 1; expect(placeBid(p, currentLots(p)[0].id, 99999).ok).toBe(false);
  });
  it('thắng khi giá cao hơn mức NPC: chỉ trả NPC+5%, hoàn phần dư, nhận hàng', () => {
    const p = rich();
    const lot = currentLots(p).find((l) => l.kind !== 'gear')!;
    const bid = lot.npcFinal * 3;
    placeBid(p, lot.id, bid);
    p.playtime += 301; // sang ngày mới
    expect(worldDay(p)).toBe(1);
    const news = settleAuctions(p);
    expect(news[0]).toMatch(/THẮNG/);
    const price = Math.max(lot.start, Math.round(lot.npcFinal * 1.05));
    expect(p.gold).toBe(100000 - price);
    expect(p.inventory[lot.ref]).toBe(lot.qty);
    expect(p.auction.bids[lot.id]).toBeUndefined();
  });
  it('thua thì hoàn đủ cọc, không nhận hàng', () => {
    const p = rich();
    const lot = currentLots(p).find((l) => l.kind !== 'gear')!;
    placeBid(p, lot.id, lot.start); // thấp hơn mức NPC
    p.playtime += 301;
    const news = settleAuctions(p);
    expect(news[0]).toMatch(/Thua/);
    expect(p.gold).toBe(100000);
    expect(p.inventory[lot.ref] ?? 0).toBe(0);
  });
  it('thắng lô trang bị thì vào túi đồ với đúng chỉ số', () => {
    const p = rich();
    const lot = currentLots(p).find((l) => l.kind === 'gear');
    if (!lot) return; // ngày 0 có thể không có lô trang bị
    placeBid(p, lot.id, lot.npcFinal * 3);
    p.playtime += 301;
    settleAuctions(p);
    expect(p.gear.length).toBe(1);
    expect(p.gear[0].stats).toEqual(lot.item!.stats);
  });
  it('lô của ngày hôm nay chưa được xét; không đặt được lô cũ', () => {
    const p = rich(); const lot = currentLots(p)[0];
    placeBid(p, lot.id, lot.npcFinal * 2);
    expect(settleAuctions(p)).toEqual([]);
    p.playtime += 301;
    expect(placeBid(p, lot.id, lot.npcFinal * 3).ok).toBe(false);
  });
  it('NPC Đấu Giá có ở Phường Thị và ngủ ban đêm', () => {
    const n = loadMap('phuong_thi').npcs.find((x) => x.id === 'dau_gia')!;
    expect(n.vendor).toBe('dau_gia');
    expect(n.schedule!.some((s) => s.hidden)).toBe(true);
  });
});

describe('Phá Cảnh Đan từ Đan Sư', () => {
  it('thuê Đan Sư luyện Phá Cảnh Đan rồi dùng để phá bình cảnh', () => {
    const p = newPlayer(); p.rootId = 'kim'; p.gold = 5000; p.stage = 6; p.exp = expNeeded(p);
    expect(isBottlenecked(p)).toBe(true);
    const r = commissionBrew(p, 'van_duoc', 'pha_canh_dan', 'normal', new Rng(4));
    expect(r.ok).toBe(true);
    expect(p.inventory.pha_canh_dan).toBe(1);
    p.inventory.pha_canh_dan--;
    expect(clearBottleneck(p)).toBe(1);
    expect(isBottlenecked(p)).toBe(false);
  });
});
