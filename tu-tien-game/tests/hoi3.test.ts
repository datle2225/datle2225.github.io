import { describe, expect, it } from 'vitest';
import { newPlayer } from '../src/core/save';
import { Rng } from '../src/core/rng';
import { DialogueRunner, pickDialogue, DIALOGUES } from '../src/core/story';
import { questEvent } from '../src/core/session';
import { Battle, makeUnit } from '../src/core/battle';
import { buildBattle } from '../src/core/encounter';
import { loadMap } from '../src/core/maps';
import { enemyMap } from '../src/core/data';

const na = () => {
  const p = newPlayer(); p.rootId = 'hon_don'; p.realmIndex = 3; p.stage = 5; p.branchId = 'kiem_tu'; p.chapter = 7;
  p.quests = { active: [], done: ['m1_1', 'm1_2', 'm1_3', 'm2_1', 'm2_2', 'm2_3'], progress: {} };
  p.flags = { enemy1_dead: true, enemy2_dead: true, enemy3_dead: true, luc_hint: true };
  return p;
};

describe('Hồi 3: chuỗi nhiệm vụ', () => {
  it('Thiên Cơ Các (Nguyên Anh + đã hạ Mặc Gia) → Băng Nguyên → Tổng Đàn → Thiên Kiếp Đài', () => {
    const p = na();
    const talk = loadMap('phuong_thi').npcs.find((n) => n.id === 'thien_co')!;
    expect(pickDialogue(p, talk.talk)).toBe('thien_co_m3');
    const d = new DialogueRunner(p, 'thien_co_m3'); d.advance();
    expect(p.flags.hoi3_open).toBe(true);
    expect(p.quests.active).toContain('m3_1');
    expect(questEvent(p, 'reach', 'bang_nguyen_sau')).toContain('m3_1');
    expect(p.chapter).toBe(8); // quest mở chương 8 → mở cổng Tổng Đàn
    expect(p.quests.active).toContain('m3_2');
    questEvent(p, 'reach', 'tong_dan_sau');
    expect(questEvent(p, 'battle', 'huyet_anh_mon_chu')).toContain('m3_2');
    expect(p.quests.active).toContain('m3_3');
    questEvent(p, 'reach', 'thien_kiep_dai');
    expect(questEvent(p, 'battle', 'luc_van_sinh')).toContain('m3_3');
  });
  it('chưa đủ điều kiện thì Thiên Cơ Các không giao nhiệm vụ Hồi 3', () => {
    const p = na(); p.realmIndex = 2;
    const talk = loadMap('phuong_thi').npcs.find((n) => n.id === 'thien_co')!;
    expect(pickDialogue(p, talk.talk)).not.toBe('thien_co_m3');
    const q = na(); q.flags.enemy3_dead = false;
    expect(pickDialogue(q, talk.talk)).not.toBe('thien_co_m3');
  });
  it('cổng Hồi 3 bị khóa đúng điều kiện và nối hai chiều', () => {
    const pt = loadMap('phuong_thi').portals.find((q) => q.target === 'bang_nguyen')!;
    expect(pt.if).toEqual({ flag: 'hoi3_open' });
    const bn = loadMap('bang_nguyen');
    expect(bn.portals.find((q) => q.target === 'huyet_anh_dan')!.if).toEqual({ minChapter: 8 });
    expect(bn.portals.find((q) => q.target === 'thien_kiep_dai')!.if).toEqual({ flag: 'enemy4_dead' });
    expect(loadMap('thien_kiep_dai').npcs.some((n) => n.id === 'luc_van_sinh')).toBe(true);
    expect(loadMap('huyet_anh_dan').foes.some((f) => f.group.includes('huyet_anh_mon_chu'))).toBe(true);
  });
});

describe('Hồi 3: đối mặt Lục Vân Sinh và các kết cục', () => {
  const final = (setup: (p: ReturnType<typeof na>) => void) => {
    const p = na(); p.quests.active = ['m3_3']; questEvent(p, 'reach', 'thien_kiep_dai'); setup(p);
    return p;
  };
  const rules = [{ if: { flag: 'ending_join' }, id: 'end_dark' }, { if: { flag: 'route_expose' }, id: 'end_expose' }, { if: { minDao: 65 }, id: 'end_chinh' }, { if: { maxDao: 35 }, id: 'end_ma' }, { id: 'end_tan' }];
  it('chọn lựa chọn "vạch trần" cần Thư Tay (rơi từ Môn Chủ), hoàn thành nhiệm vụ không đánh', () => {
    const p = final(() => {});
    const d0 = new DialogueRunner(p, 'luc_final'); d0.advance();
    expect(d0.view()!.choices.length).toBe(3); // thiếu lựa chọn vạch trần
    const q = final((x) => { x.inventory.luc_chung_cu = 1; });
    const d = new DialogueRunner(q, 'luc_final'); d.advance();
    expect(d.view()!.choices.length).toBe(4);
    d.advance(1);
    expect(d.out.completed).toContain('m3_3');
    expect(q.flags.route_expose).toBe(true);
    expect(q.inventory.luc_chung_cu).toBe(0);
    expect(pickDialogue(q, rules)).toBe('end_expose');
  });
  it('tuyến đánh nhau phát lệnh battle; tuyến hợp tác cho kết cục tối và giảm đạo tâm mạnh', () => {
    const p = final(() => {});
    const d = new DialogueRunner(p, 'luc_final'); d.advance(); d.advance(0);
    expect(d.out.battle).toEqual(['luc_van_sinh']);
    const q = final((x) => { x.daoHeart = 70; });
    const e = new DialogueRunner(q, 'luc_final'); e.advance(); e.advance(2);
    expect(e.out.completed).toContain('m3_3');
    expect(q.daoHeart).toBe(55);
    expect(pickDialogue(q, rules)).toBe('end_dark');
  });
  it('kết cục theo đạo tâm khi đánh thắng', () => {
    const p = na();
    p.daoHeart = 80; expect(pickDialogue(p, rules)).toBe('end_chinh');
    p.daoHeart = 10; expect(pickDialogue(p, rules)).toBe('end_ma');
    p.daoHeart = 50; expect(pickDialogue(p, rules)).toBe('end_tan');
  });
  it('mọi kết cục đặt cờ game_complete', () => {
    for (const id of ['end_chinh', 'end_ma', 'end_tan', 'end_expose', 'end_dark']) {
      const p = na(); const d = new DialogueRunner(p, id);
      while (!d.ended) d.advance();
      expect(p.flags.game_complete, id).toBe(true);
      expect(DIALOGUES[id]).toBeTruthy();
    }
  });
  it('hai boss Hồi 3 có đủ pha, kháng đảo nhịp, đặt cờ kẻ thù, rơi Thư Tay (Môn Chủ)', () => {
    const chu = enemyMap.get('huyet_anh_mon_chu'), luc = enemyMap.get('luc_van_sinh');
    expect(chu.phases.length).toBe(3); expect(luc.phases.length).toBe(3);
    expect(chu.flagOnWin).toBe('enemy4_dead'); expect(luc.flagOnWin).toBe('enemy5_dead');
    expect(chu.drops.some((d: any) => d.id === 'luc_chung_cu' && d.chance === 1)).toBe(true);
    expect(chu.tempoResist).toBeLessThan(1);
  });
});

describe('Nguyên Anh: thoát xác (mạng thứ hai)', () => {
  const S = { hp: 1000, mp: 100, atk: 50, def: 0, spd: 100, crit: 0 };
  it('hồi sinh đúng một lần mỗi trận với 30% HP, xóa trạng thái, không bị tính là chết', () => {
    const hero = makeUnit('player', 'H', 'player', S, ['kiem_co_ban']);
    hero.reviveFrac = 0.3;
    const foe = makeUnit('e0', 'E', 'enemy', { ...S, atk: 5000 }, ['kiem_co_ban']);
    const bt = new Battle([hero, foe], new Rng(1));
    hero.statuses.push({ id: 'chay', left: 3 });
    let ev = bt.act(foe, 'kiem_co_ban');
    expect(ev.some((e) => e.type === 'revive')).toBe(true);
    expect(hero.alive).toBe(true);
    expect(hero.hp).toBe(300);
    expect(hero.statuses).toEqual([]);
    expect(bt.winner).toBeNull();
    ev = bt.act(foe, 'kiem_co_ban');
    expect(hero.alive).toBe(false);
    expect(bt.winner).toBe('enemy');
  });
  it('chỉ người chơi đã mở hệ "thoát xác" (lôi kiếp lên Nguyên Anh) mới có', () => {
    const p = na();
    expect(buildBattle(p, ['soi_hoang'], new Rng(1)).player.reviveFrac).toBeUndefined();
    p.unlockedSystems.push('thoat_xac');
    expect(buildBattle(p, ['soi_hoang'], new Rng(1)).player.reviveFrac).toBe(0.3);
  });
  it('thoát xác tăng tỉ lệ thắng trùm cuối', () => {
    const rate = (xac: boolean) => { let w = 0; for (let i = 0; i < 60; i++) { const p = na(); p.stage = 7; if (xac) p.unlockedSystems.push('thoat_xac'); const { battle } = buildBattle(p, ['luc_van_sinh'], new Rng(900 + i)); let n = 0; while (!battle.winner && n < 400) { const c = battle.current()!; const id = battle.aiPick(c); battle.act(c, id, battle.aiTarget(c, id)); n++; } if (battle.winner === 'player') w++; } return w / 60; };
    expect(rate(true)).toBeGreaterThan(rate(false));
  });
});
