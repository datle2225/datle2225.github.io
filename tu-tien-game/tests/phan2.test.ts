import { describe, expect, it } from 'vitest';
import { newPlayer } from '../src/core/save';
import { Rng } from '../src/core/rng';
import { buildBattle } from '../src/core/encounter';
import { DIFFICULTIES, ELITE, applyDefeatPenalty, difficultyOf, scaleEnemyStats } from '../src/core/difficulty';
import { abandonBounty, acceptBounty, activeBounties, bountiesForDay, huntPool, MAX_ACTIVE_BOUNTIES } from '../src/core/bounty';
import { availableSkills, checkCollect, completeQuest, getQuest, questEvent } from '../src/core/session';
import { DIALOGUES, DialogueRunner, pickDialogue } from '../src/core/story';
import { allMapIds, loadMap } from '../src/core/maps';
import { QUESTS, REALMS, enemyMap } from '../src/core/data';
import { TribulationRun, needsTamMa, tamMaFlag, tribulationFor, tribulationReadiness } from '../src/core/progression';
import { SCENARIOS, winRate } from '../tools/simulate';
import { BRANCHES } from '../src/core/data';

const branches = BRANCHES.filter((b: any) => b.playable).map((b: any) => b.id as string);

describe('độ khó', () => {
  it('Thường giữ nguyên số liệu; Khó/Ác mộng mạnh hơn, thưởng cao hơn, phạt nặng hơn', () => {
    const [n, h, x] = DIFFICULTIES;
    expect(n.enemyHp).toBe(1);
    expect(h.enemyAtk).toBeGreaterThan(n.enemyAtk); expect(x.enemyAtk).toBeGreaterThan(h.enemyAtk);
    expect(x.reward).toBeGreaterThan(h.reward); expect(x.deathGold).toBeGreaterThan(h.deathGold);
    expect(x.pills).toBeLessThan(n.pills); expect(x.canFlee).toBe(false);
  });
  it('chỉ số kẻ địch được nhân theo độ khó và tinh anh', () => {
    const base = { hp: 1000, atk: 100, def: 100 };
    expect(scaleEnemyStats(base, DIFFICULTIES[0])).toEqual(base);
    expect(scaleEnemyStats(base, DIFFICULTIES[1]).hp).toBe(1100);
    expect(scaleEnemyStats(base, DIFFICULTIES[0], true).hp).toBe(Math.round(1000 * ELITE.hp));
    const p = newPlayer(); p.rootId = 'kim'; p.realmIndex = 1; p.stage = 5; p.branchId = 'kiem_tu';
    const unit = (d: 'normal' | 'hard', el = false) => { p.difficulty = d; return buildBattle(p, ['boss_huyet_anh_truong_lao'], new Rng(1), false, { elite: el }).battle.units.find((u) => u.side === 'enemy')!; };
    expect(unit('hard').stats.hp).toBeGreaterThan(unit('normal').stats.hp);
    const w = (el: boolean) => { p.difficulty = 'normal'; return buildBattle(p, ['soi_hoang'], new Rng(1), false, { elite: el }).battle.units.find((u) => u.side === 'enemy')!; };
    expect(w(true).stats.hp).toBeGreaterThan(w(false).stats.hp);
    expect(w(true).name.startsWith('★')).toBe(true);
    expect(unit('normal', true).name.startsWith('★')).toBe(false); // boss không có tinh anh
  });
  it('phạt khi thua theo độ khó (kể cả tu vi)', () => {
    const mk = (d: 'normal' | 'hard' | 'nightmare') => { const p = newPlayer(); p.difficulty = d; p.gold = 1000; p.exp = 1000; return p; };
    const a = mk('normal'); applyDefeatPenalty(a); expect(a.gold).toBe(900); expect(a.exp).toBe(1000);
    const b = mk('hard'); applyDefeatPenalty(b); expect(b.gold).toBe(850); expect(b.exp).toBe(900);
    const c = mk('nightmare'); applyDefeatPenalty(c); expect(c.gold).toBe(750); expect(c.exp).toBe(800);
    expect(difficultyOf({ difficulty: 'nightmare' }).name).toBe('Ác mộng');
  });
  it('mô phỏng: Khó và Ác mộng hạ tỉ lệ thắng so với Thường', () => {
    const sc = SCENARIOS.find((s) => s.name === 'TC5 vs Boss')!;
    const rate = (d: 'normal' | 'hard' | 'nightmare') => branches.reduce((a, b) => a + winRate(b, sc, 40, d).win, 0) / branches.length;
    const [n, h, x] = [rate('normal'), rate('hard'), rate('nightmare')];
    expect(h).toBeLessThan(n - 0.1); expect(x).toBeLessThan(h - 0.05);
  });
});

describe('bảng nhiệm vụ', () => {
  const rp = (realm: number) => { const p = newPlayer(); p.rootId = 'kim'; p.realmIndex = realm; p.stage = 3; return p; };
  it('sinh ổn định theo ngày và theo cảnh giới, thưởng tăng theo cảnh giới', () => {
    const p = rp(2);
    const a = bountiesForDay(p), b = bountiesForDay(p);
    expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id));
    expect(a.length).toBe(4);
    p.playtime += 301;
    expect(bountiesForDay(p).map((x) => x.title)).not.toEqual(a.map((x) => x.title));
    const gold = (r: number) => bountiesForDay(rp(r)).reduce((s, x) => s + x.reward.linh_thach, 0);
    expect(gold(5)).toBeGreaterThan(gold(1));
  });
  it('săn quái chỉ gồm quái hợp cảnh giới, không phải boss', () => {
    for (let r = 0; r < REALMS.length; r++) for (const id of huntPool(r)) { const e = enemyMap.get(id); expect(e.boss).toBeFalsy(); expect(['tam_ma']).not.toContain(id); }
    expect(huntPool(5)).toContain('hu_anh');
  });
  it('nhận tối đa 3, không nhận lại, bỏ được; xong thì trả thưởng, danh vọng và dọn dẹp', () => {
    const p = rp(2); p.gold = 0;
    const bs = bountiesForDay(p);
    for (let i = 0; i < MAX_ACTIVE_BOUNTIES; i++) expect(acceptBounty(p, bs[i]).ok).toBe(true);
    expect(acceptBounty(p, bs[3]).ok).toBe(false);
    expect(acceptBounty(p, bs[0]).msg).toMatch(/rồi/);
    expect(activeBounties(p).length).toBe(3);
    expect(abandonBounty(p, bs[2].id).ok).toBe(true);
    expect(activeBounties(p).length).toBe(2);
    // hoàn thành bounty đầu
    const b = bs[0], id = b.id;
    const finish = () => b.kind === 'hunt' ? questEvent(p, 'battle', b.target, b.n) : (p.inventory[b.target] = b.n, checkCollect(p));
    const done = finish();
    expect(done).toContain(id);
    expect(p.gold).toBe(b.reward.linh_thach);
    expect(p.rep.tan_tu).toBe(1);
    expect(p.dynQuests[id]).toBeUndefined();
    expect(p.quests.done).toContain(id);
  });
  it('thu thập: nộp (trừ) vật phẩm khi đủ, chưa đủ thì chưa hoàn thành', () => {
    const p = rp(1); p.quests.active.push('s1_2');
    p.inventory.linh_thao = 4;
    expect(checkCollect(p)).toEqual([]);
    p.inventory.linh_thao = 7;
    expect(checkCollect(p)).toContain('s1_2');
    expect(p.inventory.linh_thao).toBe(2); // nộp 5
    expect(p.knownRecipes).toContain('hoi_huyet_dan');
  });
});

describe('nhiệm vụ phụ viết tay', () => {
  const side = QUESTS.filter((q: any) => q.id.startsWith('sq_'));
  it('có ít nhất 15 nhiệm vụ phụ, trải đều các bản đồ', () => {
    expect(side.length).toBeGreaterThanOrEqual(15);
    const maps = new Set(allMapIds().filter((m) => loadMap(m).npcs.some((n) => n.id.startsWith('n_sq_'))));
    expect(maps.size).toBeGreaterThanOrEqual(9);
  });
  it('mỗi nhiệm vụ có NPC giao việc trên bản đồ, đủ hội thoại, và chọn đúng hội thoại theo trạng thái', () => {
    for (const q of side) {
      const npc = allMapIds().flatMap((m) => loadMap(m).npcs).find((n) => n.id === `n_${q.id}`);
      expect(npc, q.id).toBeTruthy();
      for (const t of npc!.talk) expect(DIALOGUES[t.id], t.id).toBeTruthy();
      const p = newPlayer(); p.chapter = 12; p.realmIndex = 7;
      expect(pickDialogue(p, npc!.talk), q.id).toBe(`${q.id}_offer`);
      p.quests.active.push(q.id);
      expect(pickDialogue(p, npc!.talk)).toBe(`${q.id}_wait`);
      p.quests.active = []; p.quests.done.push(q.id);
      const next = pickDialogue(p, npc!.talk);
      expect([`${q.id}_res`, `${q.id}_after`]).toContain(next);
    }
  });
  it('nhận việc qua hội thoại → hoàn thành → lựa chọn đạo đức ảnh hưởng đạo tâm / cờ', () => {
    const p = newPlayer(); p.chapter = 2; p.daoHeart = 50;
    const offer = new DialogueRunner(p, 'sq_thon_truong_offer'); offer.advance(0);
    expect(p.quests.active).toContain('sq_thon_truong');
    questEvent(p, 'battle', 'yeu_xa', 3);
    expect(p.quests.done).toContain('sq_thon_truong');
    const res = new DialogueRunner(p, 'sq_thon_truong_res'); res.advance(0);
    expect(p.daoHeart).toBe(51);
    expect(p.flags.sq_thon_truong_res).toBe(true);
    // tuyến đạo đức khác nhau cho kết quả khác nhau
    const q = newPlayer(); q.daoHeart = 50;
    const r2 = new DialogueRunner(q, 'sq_bang_ho_ly_res'); r2.advance(0);
    expect(q.flags.spared_fox).toBe(true); expect(q.daoHeart).toBe(54);
    const q2 = newPlayer(); q2.gold = 0; const r3 = new DialogueRunner(q2, 'sq_bang_ho_ly_res'); r3.advance(1);
    expect(q2.gold).toBe(400); expect(q2.daoHeart).toBe(47);
  });
  it('nhiệm vụ cao cấp chỉ được giao cho người đủ cảnh giới', () => {
    const npc = loadMap('thien_mon').npcs.find((n) => n.id === 'n_sq_ke_xin_len')!;
    const p = newPlayer(); p.realmIndex = 3;
    expect(pickDialogue(p, npc.talk)).toBe('sq_ke_xin_len_idle');
    p.realmIndex = 7;
    expect(pickDialogue(p, npc.talk)).toBe('sq_ke_xin_len_offer');
  });
});

describe('Luyện Hư → Đại Thừa → Phi Thăng', () => {
  it('chiêu Hợp Thể / Đại Thừa mở theo cảnh giới cho mọi nhánh', () => {
    for (const b of branches) {
      const p = newPlayer(); p.branchId = b; p.realmIndex = 5; p.stage = 9;
      expect(availableSkills(p).some((s) => s.id === 'thien_dia_hop_nhat')).toBe(false);
      p.realmIndex = 6; p.stage = 1;
      expect(availableSkills(p).some((s) => s.id === 'thien_dia_hop_nhat')).toBe(true);
      p.realmIndex = 7;
      expect(availableSkills(p).some((s) => s.id === 'phi_thang_chi_kiem')).toBe(true);
    }
  });
  it('chuỗi cổng và nhiệm vụ: Thiên Phong → Hư Không → Cổ Chiến Trường → Thiên Môn', () => {
    const chain: [string, string, object][] = [['thien_phong', 'hu_khong', { minRealm: 5, questDone: 'm4_2' }], ['hu_khong', 'co_chien_truong', { flag: 'enemy7_dead', minRealm: 6 }], ['co_chien_truong', 'thien_mon', { flag: 'enemy8_dead', minRealm: 7 }]];
    for (const [from, to, cond] of chain) {
      const po = loadMap(from).portals.find((q) => q.target === to)!;
      expect(po.if).toEqual(cond);
      expect(loadMap(to).portals.some((q) => q.target === from)).toBe(true);
    }
    for (const id of ['m5_1', 'm5_2', 'm6_1', 'm6_2', 'm7_1', 'm7_2']) expect(QUESTS.some((q: any) => q.id === id)).toBe(true);
    for (const [id, flag] of [['hu_khong_thu_ho', 'enemy7_dead'], ['chien_than_tan_hon', 'enemy8_dead'], ['thien_dao_su_gia', 'enemy9_dead']]) { const e = enemyMap.get(id); expect(e.boss).toBe(true); expect(e.flagOnWin).toBe(flag); expect(e.phases.length).toBeGreaterThanOrEqual(3); }
  });
  it('Phi Thăng: cần tâm ma, rồi lôi kiếp 12 đợt; thành công đặt cờ ascended', () => {
    const p = newPlayer(); p.rootId = 'hon_don'; p.realmIndex = 7; p.stage = 9; p.exp = 1e12; p.daoHeart = 100;
    const t = tribulationFor(p)!;
    expect(t.name).toBe('Phi Thăng Thiên Kiếp'); expect(t.waves).toBe(12);
    expect(needsTamMa(p)).toBe(true);
    expect(tribulationReadiness(p).reason).toMatch(/TÂM MA/);
    p.flags[tamMaFlag(p)] = true;
    expect(needsTamMa(p)).toBe(false);
    p.rootId = 'kim';
    const run = new TribulationRun(p, new Rng(3), 0.6);
    run.finish(true);
    expect(p.flags.ascended).toBe(true);
    expect(p.realmIndex).toBe(7); // không vượt quá cảnh giới cuối
  });
  it('5 kết cục phi thăng đều đặt cờ game_won', () => {
    for (const id of ['ascend_chinh', 'ascend_ma', 'ascend_tan', 'ascend_expose', 'ascend_dark']) {
      const p = newPlayer(); const d = new DialogueRunner(p, id); while (!d.ended) d.advance();
      expect(p.flags.game_won, id).toBe(true);
    }
  });
  it('cân bằng Luyện Hư → Đại Thừa: quái thường ≥ 30% mọi nhánh, boss mọi nhánh ≥ 10% và trung bình ≤ 90%', () => {
    for (const sc of SCENARIOS.filter((s) => s.realm >= 5)) {
      const rates = branches.map((b) => winRate(b, sc, 40).win);
      const boss = sc.enemies.some((e) => enemyMap.get(e).boss);
      rates.forEach((r, i) => expect(r, `${sc.name}: ${branches[i]}`).toBeGreaterThanOrEqual(boss ? 0.1 : 0.3));
      expect(rates.reduce((a, b) => a + b, 0) / rates.length, sc.name).toBeLessThanOrEqual(boss ? 0.9 : 1);
      if (!boss) expect(rates.reduce((a, b) => a + b, 0) / rates.length, `${sc.name} trung bình`).toBeGreaterThanOrEqual(0.8);
    }
  });
  it('getQuest tìm được cả nhiệm vụ tĩnh lẫn sinh động', () => {
    const p = newPlayer();
    expect(getQuest(p, 'm1_1').title).toBe('Tro tàn');
    p.dynQuests.x = { id: 'x', title: 'Động', steps: [], reward: {} };
    expect(getQuest(p, 'x').title).toBe('Động');
    completeQuest(p, 'x');
    expect(p.flags.lastDoneTitle).toBe('Động');
  });
});
