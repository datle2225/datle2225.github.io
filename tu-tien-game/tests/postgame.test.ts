import { describe, it, expect } from 'vitest';
import { newPlayer } from '../src/core/save';
import { bump, checkAchievements, conditionMet } from '../src/core/achievements';
import { ACHIEVEMENTS } from '../src/core/data';
import { canStartNgPlus, startNewGamePlus } from '../src/core/ngplus';
import { factionMissions, acceptFactionMission, MAX_ACTIVE_FACTION } from '../src/core/bounty';
import { floorEnemies, floorMult, clearFloor } from '../src/core/tower';
import { Rng } from '../src/core/rng';

describe('postgame', () => {
  it('achievements unlock once and pay', () => {
    const p = newPlayer('kiem' as any);
    bump(p, 'kills', 1000);
    const g0 = p.gold;
    const a = checkAchievements(p);
    expect(a.length).toBeGreaterThan(0);
    expect(checkAchievements(p)).toHaveLength(0);
    expect(p.gold).toBeGreaterThan(g0);
    expect(ACHIEVEMENTS.length).toBeGreaterThan(20);
    expect(typeof conditionMet).toBe('function');
  });
  it('ng+ requires win and carries over', () => {
    const p = newPlayer('kiem' as any);
    expect(canStartNgPlus(p)).toBe(false);
    p.flags.game_won = true; p.achievements.push('x'); p.towerBest = 7;
    expect(canStartNgPlus(p)).toBe(true);
    const q = startNewGamePlus(p);
    expect(q.ngPlus).toBe(1);
    expect(q.achievements).toContain('x');
    expect(q.towerBest).toBe(7);
    expect(q.flags.game_won).toBeFalsy();
  });
  it('faction missions limited and accepted', () => {
    const p = newPlayer('kiem' as any);
    p.faction = { id: 'thanh_van', rank: 0, contribution: 0 } as any;
    const ms = factionMissions(p);
    expect(ms.length).toBe(3);
    expect(factionMissions(p).map((m) => m.id)).toEqual(ms.map((m) => m.id));
    let ok = 0;
    for (const m of ms) if (acceptFactionMission(p, m).ok) ok++;
    expect(ok).toBe(MAX_ACTIVE_FACTION);
  });
  it('tower scales and pays', () => {
    const p = newPlayer('kiem' as any);
    expect(floorMult(20)).toBeGreaterThan(floorMult(1));
    expect(floorEnemies(p, 3, new Rng(1)).length).toBeGreaterThan(0);
    const g0 = p.gold;
    clearFloor(p, 5);
    expect(p.towerBest).toBe(5);
    expect(p.gold).toBeGreaterThan(g0);
  });
});
