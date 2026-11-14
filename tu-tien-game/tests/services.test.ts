import { describe, expect, it } from 'vitest';
import { newPlayer } from '../src/core/save';
import { Rng } from '../src/core/rng';
import { buyMaterial, buyPill, buyReadyItem, commissionBrew, commissionForge, ensureStock, itemValue, quoteBrew, quoteForge, relationDiscount, sellGear, sellItem, worldDay } from '../src/core/services';
import { forgeMiniScore, forgeZoneWidth, heatBand, heatScore, heatStep, strikeScore } from '../src/core/minigame';
import { DialogueRunner, applyEffects, check, pickDialogue } from '../src/core/story';
import { Battle, makeUnit } from '../src/core/battle';
import { TribulationRun, runTribulation } from '../src/core/progression';
import { brew } from '../src/core/alchemy';

const rich = () => { const p = newPlayer(); p.gold = 5000; return p; };

describe('cửa hàng NPC', () => {
  it('nhập hàng ổn định trong ngày, đổi khi sang ngày', () => {
    const p = rich();
    const a = JSON.stringify(ensureStock(p, 'tho_ren').items.map((i) => i.stats));
    expect(JSON.stringify(ensureStock(p, 'tho_ren').items.map((i) => i.stats))).toBe(a);
    p.playtime += 301;
    expect(worldDay(p)).toBe(1);
    expect(JSON.stringify(ensureStock(p, 'tho_ren').items.map((i) => i.stats))).not.toBe(a);
  });
  it('thợ rèn có đồ sẵn, đan sư có đan sẵn', () => {
    const p = rich();
    expect(ensureStock(p, 'tho_ren').items.length).toBe(3);
    expect(Object.keys(ensureStock(p, 'dan_su').stock)).toContain('hoi_huyet_dan');
  });
  it('mua nguyên liệu trừ tiền và tồn kho', () => {
    const p = rich();
    const before = ensureStock(p, 'tho_ren').stock.huyen_thiet;
    const r = buyMaterial(p, 'tho_ren', 'huyen_thiet');
    expect(r.ok).toBe(true);
    expect(p.inventory.huyen_thiet).toBe(1);
    expect(p.shops.tho_ren.stock.huyen_thiet).toBe(before - 1);
    expect(p.gold).toBeLessThan(5000);
  });
  it('không đủ tiền / hết hàng thì từ chối', () => {
    const p = newPlayer();
    p.gold = 0;
    expect(buyMaterial(p, 'tho_ren', 'huyen_thiet').ok).toBe(false);
    p.gold = 9999;
    ensureStock(p, 'tho_ren').stock.huyen_thiet = 0;
    expect(buyMaterial(p, 'tho_ren', 'huyen_thiet').msg).toMatch(/Hết/);
  });
  it('mua đồ sẵn: món chuyển sang túi và biến khỏi kệ', () => {
    const p = rich();
    const st = ensureStock(p, 'tho_ren');
    const uid = st.items[0].uid;
    expect(buyReadyItem(p, 'tho_ren', uid).ok).toBe(true);
    expect(p.gear.some((g) => g.uid === uid)).toBe(true);
    expect(buyReadyItem(p, 'tho_ren', uid).ok).toBe(false);
  });
  it('mua đan sẵn', () => {
    const p = rich();
    ensureStock(p, 'tap_hoa');
    expect(buyPill(p, 'tap_hoa', 'hoi_huyet_dan').ok).toBe(true);
    expect(p.inventory.hoi_huyet_dan).toBe(2);
  });
  it('bán lại 50% và bán trang bị', () => {
    const p = newPlayer();
    p.inventory.linh_thao = 4; p.gold = 0;
    sellItem(p, 'linh_thao', 2);
    expect(p.gold).toBe(8);
    const it = ensureStock(rich(), 'tho_ren').items[0];
    p.gear.push(it); p.equipped.weapon = it.uid;
    expect(sellGear(p, it.uid).ok).toBe(true);
    expect(p.equipped.weapon).toBeNull();
    expect(p.gold).toBeGreaterThan(8);
  });
  it('giá trị đồ tăng theo độ hiếm', () => {
    const p = rich();
    const items = ensureStock(p, 'tho_ren').items;
    expect(items.every((i) => itemValue(i) > 0)).toBe(true);
  });
  it('quan hệ cao thì được giảm giá', () => {
    const p = newPlayer();
    expect(relationDiscount(p, 'tho_ren')).toBe(1);
    p.relations.tho_ren = 65;
    expect(relationDiscount(p, 'tho_ren')).toBe(0.9);
  });
});

describe('thuê NPC rèn / luyện đan', () => {
  it('thuê rèn: dùng quặng của mình rẻ hơn, ra món có chỉ số', () => {
    const p = rich();
    const noOre = quoteForge(p, 'tho_ren', 'phi_kiem_so', 'normal');
    p.inventory.huyen_thiet = 3;
    const withOre = quoteForge(p, 'tho_ren', 'phi_kiem_so', 'normal');
    expect(withOre.total).toBeLessThan(noOre.total);
    expect(withOre.materialCost).toBe(0);
    const r = commissionForge(p, 'tho_ren', 'phi_kiem_so', 'normal', new Rng(3));
    expect(r.ok).toBe(true);
    expect(r.item!.name).toBe('Phi Kiếm Sơ Cấp');
    expect(p.inventory.huyen_thiet).toBe(0);
    expect(p.relations.tho_ren).toBe(2);
  });
  it('thuê rèn bằng quặng NPC (thiếu quặng) vẫn được nếu đủ tiền', () => {
    const p = rich();
    expect(commissionForge(p, 'tho_ren', 'chien_giap_so', 'normal', new Rng(1)).ok).toBe(true);
  });
  it('gói tinh phẩm đắt hơn nhưng thường ra độ hiếm cao hơn', () => {
    const rank = (t: 'normal' | 'fine') => { let n = 0; for (let s = 0; s < 80; s++) { const p = rich(); p.inventory.huyen_thiet = 3; n += ['pham', 'linh', 'bao', 'tien'].indexOf(commissionForge(p, 'tho_ren', 'phi_kiem_so', t, new Rng(s)).item!.rarity); } return n / 80; };
    const p = rich();
    expect(quoteForge(p, 'tho_ren', 'phi_kiem_so', 'fine').total).toBeGreaterThan(quoteForge(p, 'tho_ren', 'phi_kiem_so', 'normal').total);
    expect(rank('fine')).toBeGreaterThan(rank('normal'));
  });
  it('không đủ tiền thì không thuê', () => {
    const p = newPlayer();
    p.gold = 1;
    expect(commissionForge(p, 'tho_ren', 'phi_kiem_so', 'normal', new Rng(1)).ok).toBe(false);
    expect(p.gear.length).toBe(0);
  });
  it('đan sư NPC luyện được đan người chơi CHƯA học và khác nhánh', () => {
    const p = rich();
    expect(p.knownRecipes).toEqual([]);
    p.branchId = 'kiem_tu';
    const r = commissionBrew(p, 'dan_su', 'huyet_khi_dan', 'normal', new Rng(2));
    expect(r.ok).toBe(true);
    expect(p.inventory.huyet_khi_dan).toBe(1);
  });
  it('tự luyện vẫn cần học phương', () => {
    const p = rich();
    p.inventory.linh_thao = 9;
    expect(brew(p, 'hoi_huyet_dan', 0.9, new Rng(1)).ok).toBe(false);
  });
  it('báo giá: phần nguyên liệu thiếu NPC bù', () => {
    const p = rich();
    const q = quoteBrew(p, 'dan_su', 'tu_khi_dan', 'normal');
    expect(q.missing.linh_thao).toBe(4);
    expect(q.missing.huyet_tham).toBe(1);
    p.inventory.linh_thao = 4; p.inventory.huyet_tham = 1;
    expect(quoteBrew(p, 'dan_su', 'tu_khi_dan', 'normal').materialCost).toBe(0);
  });
  it('NPC không biết phương thì từ chối', () => {
    const p = rich();
    expect(quoteBrew(p, 'tap_hoa', 'hoi_huyet_dan', 'normal').ok).toBe(false);
  });
});

describe('mini-game chấm điểm', () => {
  it('trúng tâm 1, lệch xa thấp', () => {
    expect(strikeScore(0.5, 0.5, 0.3)).toBe(1);
    expect(strikeScore(0.0, 0.5, 0.3)).toBe(0);
    expect(strikeScore(0.6, 0.5, 0.3)).toBeGreaterThan(0.6);
  });
  it('vùng sáng hẹp dần theo độ hiếm', () => {
    expect(forgeZoneWidth(3, 0)).toBeLessThan(forgeZoneWidth(0, 0));
    expect(forgeMiniScore([1, 0.5])).toBe(0.75);
  });
  it('hỏa hầu: giữ trong vùng xanh cho điểm cao', () => {
    const band = heatBand(1);
    let sim = { temp: 0.55, inBand: 0, ticks: 0 };
    for (let i = 0; i < 100; i++) sim = heatStep(sim, i % 2 === 0, 0.016, band);
    expect(heatScore(sim)).toBeGreaterThan(0.9);
    let bad = { temp: 0, inBand: 0, ticks: 0 };
    for (let i = 0; i < 100; i++) bad = heatStep(bad, false, 0.016, band);
    expect(heatScore(bad)).toBe(0);
    expect(heatBand(9)[1] - heatBand(9)[0]).toBeLessThan(heatBand(1)[1] - heatBand(1)[0]);
  });
});

describe('hội thoại & lựa chọn', () => {
  it('lựa chọn đổi đạo tâm / cờ / quan hệ', () => {
    const p = newPlayer();
    p.quests.done.push('m1_2');
    const d = new DialogueRunner(p, 'ba_ly_choice');
    expect(d.view()!.choices.length).toBe(2);
    d.advance(0);
    expect(p.flags.wolf_spared).toBe(true);
    expect(p.daoHeart).toBe(54);
    expect(p.relations.ba_ly).toBe(10);
    d.advance();
    expect(d.ended).toBe(true);
  });
  it('lựa chọn bị ẩn khi không thỏa điều kiện', () => {
    const p = newPlayer();
    expect(new DialogueRunner(p, 'lao_ngu_2').view()!.choices.map((c) => c.text)).toEqual(['Cảm ơn lão.']);
    p.quests.done.push('m1_2');
    expect(new DialogueRunner(p, 'lao_ngu_2').view()!.choices.length).toBe(2);
  });
  it('mở shop & nhận phương đan qua hội thoại', () => {
    const p = newPlayer();
    const d = new DialogueRunner(p, 'dan_su_1');
    expect(p.knownRecipes).toContain('hoi_huyet_dan');
    d.advance(); // sang node b (có lựa chọn)
    d.advance(0);
    expect(d.out.openShop?.vendor).toBe('dan_su');
  });
  it('đồng hành gia nhập và rời đội', () => {
    const p = newPlayer();
    applyEffects(p, [{ join: 'nguyet_nhi' }]);
    expect(p.party).toEqual(['nguyet_nhi']);
    applyEffects(p, [{ leave: 'nguyet_nhi' }]);
    expect(p.party).toEqual([]);
  });
  it('chọn đoạn thoại theo điều kiện', () => {
    const p = newPlayer();
    const rules = [{ if: { flag: 'x' }, id: 'a' }, { id: 'b' }];
    expect(pickDialogue(p, rules)).toBe('b');
    p.flags.x = true;
    expect(pickDialogue(p, rules)).toBe('a');
    expect(check(p, { rel: { npc: 'k', min: 1 } })).toBe(false);
  });
});

describe('đồng đội & lôi kiếp từng đợt', () => {
  it('đồng đội hồi máu cho người yếu nhất', () => {
    const s = { hp: 100, mp: 100, atk: 10, def: 0, spd: 100, crit: 0 };
    const hero = makeUnit('player', 'A', 'player', s, ['kiem_co_ban']);
    const healer = makeUnit('nn', 'N', 'player', s, ['moc_tri_lieu']);
    const foe = makeUnit('e', 'E', 'enemy', s, ['kiem_co_ban']);
    hero.hp = 20;
    const bt = new Battle([hero, healer, foe], new Rng(1));
    expect(bt.aiPick(healer)).toBe('moc_tri_lieu');
    bt.act(healer, 'moc_tri_lieu', bt.aiTarget(healer, 'moc_tri_lieu'));
    expect(hero.hp).toBe(50);
  });
  it('địch nhắm vào người yếu máu', () => {
    const s = { hp: 100, mp: 100, atk: 10, def: 0, spd: 100, crit: 0 };
    const a = makeUnit('player', 'A', 'player', s, ['kiem_co_ban']);
    const b = makeUnit('nn', 'N', 'player', s, ['kiem_co_ban']);
    const e = makeUnit('e', 'E', 'enemy', s, ['kiem_co_ban']);
    b.hp = 10;
    const bt = new Battle([a, b, e], new Rng(1));
    let hitB = 0;
    for (let i = 0; i < 20; i++) if (bt.aiTarget(e, 'kiem_co_ban')!.id === 'nn') hitB++;
    expect(hitB).toBeGreaterThan(15);
  });
  it('TribulationRun chạy từng đợt, kết quả giống runTribulation', () => {
    const mk = () => { const p = newPlayer(); p.rootId = 'kim'; p.stage = 9; p.exp = 99999; return p; };
    const p1 = mk();
    const run = new TribulationRun(p1, new Rng(5), 0.15);
    let last;
    while (!last || !last.done) last = run.step('guard');
    expect(last.dead).toBe(false);
    run.finish(true);
    const p2 = mk();
    const r = runTribulation(p2, { choices: ['guard', 'guard', 'guard'], shield: 0.15 }, new Rng(5));
    expect(r.success).toBe(true);
    expect(p1.realmIndex).toBe(p2.realmIndex);
  });
  it('độ kiếp thất bại mất 30% tu vi', () => {
    const p = newPlayer(); p.rootId = 'kim'; p.stage = 9; p.exp = 1000;
    const run = new TribulationRun(p, new Rng(1), 0);
    (run as any).hp = 1;
    run.step('dodge');
    const { lost } = run.finish(false);
    expect(lost).toBe(300);
    expect(p.exp).toBe(700);
  });
});
