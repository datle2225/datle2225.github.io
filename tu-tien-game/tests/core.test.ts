import { describe, expect, it } from 'vitest';
import { Battle, effectiveSpeed, elementMult, makeUnit, MAX_CONSECUTIVE } from '../src/core/battle';
import { Rng } from '../src/core/rng';
import { forge } from '../src/core/forge';
import { brew, canBrew } from '../src/core/alchemy';
import { newPlayer } from '../src/core/save';
import { computeStats, power } from '../src/core/stats';
import { atStageCap, gainExp, runTribulation, tribulationReadiness } from '../src/core/progression';
import { REALMS } from '../src/core/data';
import { availableSkills, questEvent } from '../src/core/session';

const S = (o: Partial<ReturnType<typeof base>> = {}) => ({ ...base(), ...o });
const base = () => ({ hp: 1000, mp: 100, atk: 10, def: 0, spd: 100, crit: 0 });

describe('chiến đấu timeline', () => {
  it('tốc độ gấp đôi → đi nhiều gần gấp đôi', () => {
    const a = makeUnit('a', 'A', 'player', S({ spd: 100, hp: 99999 }), ['kiem_co_ban']);
    const b = makeUnit('b', 'B', 'enemy', S({ spd: 50, hp: 99999 }), ['kiem_co_ban']);
    const bt = new Battle([a, b], new Rng(1));
    const count = { a: 0, b: 0 };
    for (let i = 0; i < 90; i++) {
      const u = bt.current()!;
      count[u.id as 'a' | 'b']++;
      bt.act(u, 'kiem_co_ban');
    }
    expect(count.a / count.b).toBeGreaterThan(1.7);
    expect(count.a / count.b).toBeLessThan(2.3);
  });

  it('chênh tốc độ cực lớn vẫn bị giới hạn hành động liên tiếp', () => {
    const a = makeUnit('a', 'A', 'player', S({ spd: 1000, hp: 99999, mp: 99999 }), ['kiem_nhat_thiem']);
    const b = makeUnit('b', 'B', 'enemy', S({ spd: 50, hp: 99999 }), ['kiem_co_ban']);
    const bt = new Battle([a, b], new Rng(2));
    let streak = 0, maxStreak = 0;
    for (let i = 0; i < 40; i++) {
      const u = bt.current()!;
      streak = u.id === 'a' ? streak + 1 : 0;
      maxStreak = Math.max(maxStreak, streak);
      bt.act(u, u.id === 'a' ? 'kiem_nhat_thiem' : 'kiem_co_ban');
    }
    expect(maxStreak).toBeLessThanOrEqual(MAX_CONSECUTIVE);
  });

  it('softcap tốc độ', () => {
    expect(effectiveSpeed(100)).toBe(100);
    expect(effectiveSpeed(250)).toBe(200);
  });

  it('ngũ hành khắc chế', () => {
    expect(elementMult('kim', 'moc')).toBe(1.3);
    expect(elementMult('moc', 'kim')).toBe(0.8);
    expect(elementMult('hoa', 'none')).toBe(1);
  });

  it('combo: Phá Giáp rồi Phong Cuồng cộng hưởng', () => {
    const a = makeUnit('a', 'A', 'player', S({ mp: 100 }), ['kiem_nhat_thiem', 'kiem_phong_cuong']);
    const b = makeUnit('b', 'B', 'enemy', S(), ['kiem_co_ban']);
    const bt = new Battle([a, b], new Rng(3));
    bt.act(a, 'kiem_nhat_thiem');
    expect(bt.hasStatus(b, 'pha_giap')).toBe(true);
    const ev = bt.act(a, 'kiem_phong_cuong');
    expect(ev.some((e) => e.type === 'combo')).toBe(true);
    expect(bt.hasStatus(b, 'pha_giap')).toBe(false);
    expect(bt.combo).toBe(1);
  });

  it('kết thúc trận khi một phe chết hết', () => {
    const a = makeUnit('a', 'A', 'player', S({ atk: 9999 }), ['kiem_co_ban']);
    const b = makeUnit('b', 'B', 'enemy', S({ hp: 5 }), ['kiem_co_ban']);
    const bt = new Battle([a, b], new Rng(4));
    bt.act(a, 'kiem_co_ban');
    expect(bt.winner).toBe('player');
  });
});

describe('rèn đồ', () => {
  it('cùng mẫu nhưng chỉ số khác nhau', () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 30; seed++) {
      const it = forge({ baseId: 'phi_kiem_so', materialQuality: 0.7, skillScore: 0.7, smithLevel: 2 }, new Rng(seed));
      expect(it.name).toBe('Phi Kiếm Sơ Cấp');
      seen.add(JSON.stringify(it.stats));
    }
    expect(seen.size).toBeGreaterThan(15);
  });
  it('chất lượng cao cho độ hiếm cao hơn trung bình', () => {
    const avg = (q: number) => {
      let n = 0;
      for (let s = 0; s < 200; s++) n += ['pham', 'linh', 'bao', 'tien'].indexOf(forge({ baseId: 'phi_kiem_so', materialQuality: q, skillScore: q, smithLevel: 0 }, new Rng(s)).rarity);
      return n / 200;
    };
    expect(avg(0.95)).toBeGreaterThan(avg(0.2) + 1);
  });
  it('khóa dòng phụ được giữ lại', () => {
    const locked = [{ id: 'atk', stat: 'atk' as const, value: 9 }];
    const it = forge({ baseId: 'phi_kiem_so', materialQuality: 1, skillScore: 1, smithLevel: 5, lockedAffixes: locked }, new Rng(7));
    expect(it.affixes.some((a) => a.id === 'atk' && a.value === 9)).toBe(true);
  });
});

describe('luyện đan', () => {
  it('trừ nguyên liệu và ra đan', () => {
    const p = newPlayer();
    p.knownRecipes.push('hoi_huyet_dan');
    p.inventory.linh_thao = 4;
    const r = brew(p, 'hoi_huyet_dan', 0.9, new Rng(1));
    expect(r.ok).toBe(true);
    expect(p.inventory.linh_thao).toBe(2);
    expect(r.price).toBeGreaterThan(0);
  });
  it('thiếu nguyên liệu / chưa học thì không luyện được', () => {
    const p = newPlayer();
    expect(canBrew(p, 'hoi_huyet_dan').ok).toBe(false);
    p.knownRecipes.push('hoi_huyet_dan');
    expect(canBrew(p, 'hoi_huyet_dan').reason).toMatch(/Thiếu/);
  });
});

describe('tu luyện & lôi kiếp', () => {
  it('Tàn Căn tu chậm hơn', () => {
    const p = newPlayer();
    expect(gainExp(p, 100).gained).toBe(30);
  });
  it('chưa đủ khí tức thì không bị phạt', () => {
    const p = newPlayer();
    p.rootId = 'kim';
    p.stage = 9;
    p.exp = 99999;
    const trib = REALMS[1].tribulation!;
    const old = trib.recommendedPower;
    trib.recommendedPower = 100000;
    try {
      expect(atStageCap(p)).toBe(true);
      expect(tribulationReadiness(p).ready).toBe(false);
      const before = p.exp;
      const r = runTribulation(p, { choices: [], shield: 0 }, new Rng(1));
      expect(r.allowed).toBe(false);
      expect(p.exp).toBe(before);
      expect(p.realmIndex).toBe(0);
    } finally {
      trib.recommendedPower = old;
    }
  });
  it('Luyện Khí đỉnh phong độ Trúc Cơ Lôi Kiếp: đủ lực chiến thì qua', () => {
    const p = newPlayer();
    p.rootId = 'kim';
    p.stage = 9;
    p.exp = 99999;
    expect(tribulationReadiness(p).ready).toBe(true);
    const r = runTribulation(p, { choices: ['guard', 'guard', 'pill'], shield: 0.15 }, new Rng(5));
    expect(r.success).toBe(true);
    expect(p.realmIndex).toBe(1);
    expect(p.stage).toBe(1);
  });
  it('lực chiến tăng theo cảnh giới', () => {
    const p = newPlayer();
    const a = power(computeStats(p));
    p.realmIndex = 1;
    expect(power(computeStats(p))).toBeGreaterThan(a * 2);
  });
});

describe('nhiệm vụ & mở khóa', () => {
  it('hoàn thành chuỗi nhiệm vụ mở hệ thống tu luyện', () => {
    const p = newPlayer();
    questEvent(p, 'talk', 'lao_ngu');
    questEvent(p, 'reach', 'diep_gia_tan_tich');
    expect(p.quests.done).toContain('m1_1');
    expect(p.quests.active).toContain('m1_2');
    questEvent(p, 'reach', 'gieng_co');
    questEvent(p, 'battle', 'soi_hoang', 2);
    expect(p.quests.done).toContain('m1_2');
    expect(p.unlockedSystems).toContain('tu_luyen');
  });
  it('chiêu mở dần theo tầng', () => {
    const p = newPlayer();
    expect(availableSkills(p).length).toBe(1);
    p.branchId = 'kiem_tu';
    expect(availableSkills(p).map((s) => s.id)).toEqual(['kiem_co_ban']);
    p.stage = 3;
    expect(availableSkills(p).length).toBe(2);
    p.realmIndex = 1;
    p.stage = 5;
    expect(availableSkills(p).length).toBe(4);
  });
});
