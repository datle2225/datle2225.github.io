import { describe, expect, it } from 'vitest';
import { Battle, makeUnit } from '../src/core/battle';
import { Rng } from '../src/core/rng';
import { newPlayer, exportSave, importSave } from '../src/core/save';
import { check, DialogueRunner, rollEvent, rumorDialogue, applyEffects } from '../src/core/story';
import { formatHour, gameHour, inHours, isNight, nightAlpha } from '../src/core/time';
import { availableSkills } from '../src/core/session';
import { BRANCHES, EVENTS, ENEMIES, skillMap } from '../src/core/data';
import { SCENARIOS, winRate } from '../tools/simulate';

const S = (o: Record<string, number> = {}) => ({ hp: 1000, mp: 100, atk: 20, def: 0, spd: 100, crit: 0, ...o });

describe('Ma Tu: hy sinh máu', () => {
  it('trừ HP khi dùng, không cho dùng nếu sẽ tự sát', () => {
    const a = makeUnit('player', 'A', 'player', S(), ['ma_hien_te']);
    const b = makeUnit('e', 'E', 'enemy', S(), ['kiem_co_ban']);
    const bt = new Battle([a, b], new Rng(1));
    expect(bt.canUse(a, 'ma_hien_te')).toBe(true);
    bt.act(a, 'ma_hien_te');
    expect(a.hp).toBe(850);
    a.hp = 100; // < 15% của 1000
    expect(bt.canUse(a, 'ma_hien_te')).toBe(false);
  });
});

describe('Phù Trận Tu: bẫy', () => {
  it('bẫy nổ khi đối thủ hành động, gây sát thương và đẩy lượt', () => {
    const a = makeUnit('player', 'A', 'player', S({ spd: 200 }), ['phu_dia_loi']);
    const b = makeUnit('e', 'E', 'enemy', S({ spd: 100 }), ['kiem_co_ban']);
    const bt = new Battle([a, b], new Rng(2));
    bt.act(a, 'phu_dia_loi');
    expect(bt.hasStatus(b, 'bay_loi')).toBe(true);
    const hp = b.hp;
    const nextBefore = b.nextAt;
    const ev = bt.act(b, 'kiem_co_ban');
    expect(ev.some((e) => e.type === 'trap')).toBe(true);
    expect(b.hp).toBeLessThan(hp);
    expect(bt.hasStatus(b, 'bay_loi')).toBe(false);
    expect(b.nextAt - nextBefore).toBeGreaterThan(100); // chậm hơn bình thường do trapDelay
  });
  it('Dẫn Lôi cộng hưởng với bẫy', () => {
    const a = makeUnit('player', 'A', 'player', S(), ['phu_dia_loi', 'phu_dan_loi']);
    const b = makeUnit('e', 'E', 'enemy', S(), ['kiem_co_ban']);
    const bt = new Battle([a, b], new Rng(3));
    bt.act(a, 'phu_dia_loi');
    expect(bt.act(a, 'phu_dan_loi').some((e) => e.type === 'combo')).toBe(true);
  });
});

describe('Đan Tu: độc', () => {
  it('Bạo Đan cộng hưởng với Trúng Độc', () => {
    const a = makeUnit('player', 'A', 'player', S(), ['dan_doc_phi', 'dan_bao']);
    const b = makeUnit('e', 'E', 'enemy', S(), ['kiem_co_ban']);
    const bt = new Battle([a, b], new Rng(4));
    bt.act(a, 'dan_doc_phi');
    expect(bt.hasStatus(b, 'doc')).toBe(true);
    expect(bt.act(a, 'dan_bao').some((e) => e.type === 'combo')).toBe(true);
  });
});

describe('boss nhiều pha', () => {
  it('đổi chiêu và tăng sức mạnh khi HP xuống ngưỡng', () => {
    const boss = makeUnit('e0', 'Boss', 'enemy', S({ hp: 1000, atk: 10 }), ['kiem_co_ban'], 'none', [
      { at: 0.7, text: 'Pha 2!', skills: ['yeu_kiem_cuong'], atkMul: 2 },
      { at: 0.3, text: 'Pha 3!', skills: ['yeu_kiem_tam'], heal: 0.1 },
    ]);
    const hero = makeUnit('player', 'H', 'player', S({ atk: 200, hp: 99999, spd: 300 }), ['kiem_co_ban']);
    const bt = new Battle([hero, boss], new Rng(5));
    const evs = [] as string[];
    for (let i = 0; i < 6 && !bt.winner; i++) { const cur = bt.current()!; if (cur.id === 'player') evs.push(...bt.act(cur, 'kiem_co_ban').filter((e) => e.type === 'phase').map((e) => e.text)); else bt.act(cur, cur.skills[0]); }
    expect(evs[0]).toBe('Pha 2!');
    expect(boss.stats.atk).toBe(20);
    expect(boss.skills).not.toContain('kiem_co_ban');
  });
});

describe('giờ trong game', () => {
  it('bắt đầu 8:00, một ngày = 300s, qua nửa đêm', () => {
    const p = newPlayer();
    expect(gameHour(p)).toBeCloseTo(8);
    p.playtime = 150;
    expect(gameHour(p)).toBeCloseTo(20);
    expect(isNight(20.5)).toBe(true);
    expect(inHours(23, 22, 6)).toBe(true);
    expect(inHours(3, 22, 6)).toBe(true);
    expect(inHours(12, 22, 6)).toBe(false);
    expect(nightAlpha(12)).toBe(0);
    expect(nightAlpha(0)).toBe(0.5);
    expect(formatHour(8.5)).toBe('08:30');
  });
  it('điều kiện hội thoại theo giờ', () => {
    const p = newPlayer();
    expect(check(p, { hour: [22, 6] })).toBe(false);
    p.playtime = 200; // 8 + 16/ ... = 21.33 → chưa; 
    p.playtime = 230; // 8+ 230/300*24 = 26.4 % 24 = 2.4h
    expect(check(p, { hour: [22, 6] })).toBe(true);
    expect(check(p, { notHour: [22, 6] })).toBe(false);
  });
});

describe('sự kiện ngẫu nhiên & tin đồn', () => {
  it('sự kiện tôn trọng hồi chiêu và điều kiện', () => {
    const p = newPlayer();
    const evs = EVENTS.filter((e) => e.id === 'suoi_linh_khi');
    expect(rollEvent(p, evs, () => 0)?.id).toBe('suoi_linh_khi');
    expect(rollEvent(p, evs, () => 0)).toBeNull(); // đang hồi
    p.playtime += 1000;
    expect(rollEvent(p, evs, () => 0)?.id).toBe('suoi_linh_khi');
  });
  it('sự kiện ban đêm chỉ xảy ra ban đêm', () => {
    const p = newPlayer();
    const evs = EVENTS.filter((e) => e.id === 'thuong_nhan');
    expect(rollEvent(p, evs, () => 0)).toBeNull(); // 8:00 sáng
    p.playtime = 160; // 8+12.8=20.8h
    expect(rollEvent(p, evs, () => 0)?.id).toBe('thuong_nhan');
  });
  it('tin đồn phụ thuộc tiến trình', () => {
    const p = newPlayer();
    const id = rumorDialogue(p, () => 0);
    const text = new DialogueRunner(p, id).view()!.text;
    expect(text.length).toBeGreaterThan(10);
    p.flags.wolf_spared = true; p.quests.done.push('m1_2'); p.chapter = 2; p.realmIndex = 1;
    expect(rumorDialogue(p, () => 0)).toBe('__rumor');
  });
  it('hiệu ứng battle & mất vật phẩm không âm', () => {
    const p = newPlayer();
    const out = applyEffects(p, [{ battle: ['cuop_duong'] }, { item: { id: 'hoi_huyet_dan', n: -5 } }]);
    expect(out.battle).toEqual(['cuop_duong']);
    expect(p.inventory.hoi_huyet_dan).toBe(0);
  });
  it('mọi hội thoại sự kiện tồn tại', () => {
    for (const e of EVENTS) expect(() => new DialogueRunner(newPlayer(), e.dialogue)).not.toThrow();
  });
});

describe('xuất / nhập save', () => {
  it('khứ hồi giữ nguyên dữ liệu, kể cả tiếng Việt', () => {
    const p = newPlayer('Diệp Thanh');
    p.gold = 1234; p.flags.wolf_spared = true;
    const r = importSave(exportSave(p));
    expect(r.ok).toBe(true);
    if (r.ok) { expect(r.p.gold).toBe(1234); expect(r.p.name).toBe('Diệp Thanh'); expect(r.p.flags.wolf_spared).toBe(true); }
  });
  it('phát hiện file bị sửa / sai định dạng', () => {
    const s = exportSave(newPlayer());
    expect(importSave(s.slice(0, -4) + 'AAAA').ok).toBe(false);
    expect(importSave('xyz').ok).toBe(false);
    expect(importSave('TCNT1.abc.def').ok).toBe(false);
  });
});

describe('nhánh mới & dữ liệu', () => {
  it('6 nhánh chơi được và đều có chiêu mở dần', () => {
    const playable = BRANCHES.filter((b: any) => b.playable).map((b: any) => b.id);
    expect(playable.sort()).toEqual(['dan_tu', 'kiem_tu', 'ma_tu', 'phap_tu', 'phu_tran_tu', 'the_tu']);
    for (const id of playable) {
      const p = newPlayer(); p.branchId = id;
      const a = availableSkills(p).length;
      p.realmIndex = 1; p.stage = 9;
      const b = availableSkills(p).length;
      p.realmIndex = 2; p.stage = 1;
      expect(b).toBeGreaterThan(a);
      expect(availableSkills(p).length).toBeGreaterThanOrEqual(b);
    }
  });
  it('mọi chiêu / trạng thái được tham chiếu đều tồn tại', () => {
    for (const e of ENEMIES) {
      for (const s of e.skills) expect(skillMap.has(s), `${e.id}:${s}`).toBe(true);
      for (const ph of e.phases ?? []) for (const s of ph.skills ?? []) expect(skillMap.has(s), `${e.id} pha:${s}`).toBe(true);
    }
  });
});

describe('cân bằng (mô phỏng tự động)', () => {
  const branches = BRANCHES.filter((b: any) => b.playable).map((b: any) => b.id as string);
  it('trước Trúc Cơ: thắng quái cùng tầng nhưng không dễ như không', () => {
    for (const sc of SCENARIOS.filter((s) => s.realm === 0)) {
      const r = winRate('kiem_tu', sc, 60);
      expect(r.win, sc.name).toBeGreaterThanOrEqual(0.9);
      expect(r.hp, sc.name).toBeLessThan(0.7);
    }
  });
  it('Trúc Cơ 5 đấu boss: mọi nhánh thắng 25–90% (cần chuẩn bị, không bất khả thi)', () => {
    const sc = SCENARIOS.find((s) => s.name === 'TC5 vs Boss')!;
    const rates = branches.map((b) => winRate(b, sc, 80).win);
    for (const r of rates) { expect(r).toBeGreaterThanOrEqual(0.25); expect(r).toBeLessThanOrEqual(0.9); }
    expect(Math.max(...rates) - Math.min(...rates)).toBeLessThan(0.45); // không nhánh nào áp đảo
  });
  it('Trúc Cơ 9 vượt tầng thì thắng boss dễ hơn rõ rệt', () => {
    const tc5 = SCENARIOS.find((s) => s.name === 'TC5 vs Boss')!;
    const tc9 = SCENARIOS.find((s) => s.name === 'TC9 vs Boss')!;
    for (const b of branches) expect(winRate(b, tc9, 50).win).toBeGreaterThan(winRate(b, tc5, 50).win);
  });
});
