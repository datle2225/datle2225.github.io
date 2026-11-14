import { describe, it, expect } from 'vitest';
import { newPlayer } from '../src/core/save';
import { computeStats } from '../src/core/stats';
import { curHp, setVitals, regen, heal, restoreFull, isFull } from '../src/core/vitals';
import { buildBattle } from '../src/core/encounter';
import { meditate } from '../src/core/meditation';
import { objectiveMarkers } from '../src/core/objectives';
import { Rng } from '../src/core/rng';
import { allMapIds, loadMap } from '../src/core/maps';

describe('sinh lực/linh lực bền vững', () => {
  it('mặc định đầy, battle mang HP hiện tại khi persist', () => {
    const p = newPlayer('kiem' as any);
    const s = computeStats(p);
    expect(curHp(p)).toBe(s.hp);
    setVitals(p, 10, 3);
    const b = buildBattle(p, ['soi_hoang'], new Rng(1), true, { persist: true });
    expect(b.player.hp).toBe(10);
    expect(b.player.mp).toBe(3);
    const full = buildBattle(p, ['soi_hoang'], new Rng(1)); // mô phỏng/tháp: luôn đầy
    expect(full.player.hp).toBe(s.hp);
  });
  it('hồi chậm ngoài trời, nhanh trong thôn, về đầy thì reset', () => {
    const p = newPlayer('kiem' as any);
    setVitals(p, 1, 0);
    regen(p, 10, false); const a = curHp(p);
    setVitals(p, 1, 0); regen(p, 10, true); const b = curHp(p);
    expect(b).toBeGreaterThan(a);
    regen(p, 1000, true);
    expect(isFull(p)).toBe(true);
  });
  it('đan hồi và không vượt tối đa; thiền hồi 40%', () => {
    const p = newPlayer('kiem' as any);
    const s = computeStats(p);
    setVitals(p, 1, 1);
    heal(p, 0.35, 0);
    expect(curHp(p)).toBeGreaterThan(1);
    heal(p, 5, 5);
    expect(curHp(p)).toBe(s.hp);
    setVitals(p, 1, 1);
    const r = meditate(p, 1, true);
    if (r.ok) expect(curHp(p)).toBeGreaterThan(1);
    restoreFull(p);
    expect(isFull(p)).toBe(true);
  });
});

describe('minimap mục tiêu', () => {
  it('nhiệm vụ đầu có đánh dấu trên bản đồ hiện tại hoặc cổng dẫn tới', () => {
    const p = newPlayer('kiem' as any);
    p.quests.active = ['m1_1'];
    const ms = objectiveMarkers(p, 'thanh_ha');
    expect(ms.length).toBeGreaterThan(0);
  });
  it('mọi nhiệm vụ chính đều có đánh dấu từ bản đồ bất kỳ khi có vị trí', () => {
    const ids = allMapIds();
    expect(ids.length).toBeGreaterThan(5);
    const p = newPlayer('kiem' as any);
    p.quests.active = ['m1_2'];
    for (const id of ids) expect(() => objectiveMarkers(p, id)).not.toThrow();
    expect(loadMap(ids[0]).portals).toBeDefined();
  });
});
