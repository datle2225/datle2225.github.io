import { Battle, makeUnit, type Unit } from './battle';
import { companionMap, enemyMap } from './data';
import { Rng } from './rng';
import { availableSkills, companionStats } from './session';
import { computeStats } from './stats';
import { tamMaFactor } from './progression';
import { formationFx, lawPerks } from './advanced';
import { effectiveDifficulty, scaleEnemyStats } from './difficulty';
import type { PlayerState } from './types';

/** Dựng trận đấu từ trạng thái người chơi (dùng chung cho game và mô phỏng cân bằng). */
export function buildBattle(p: PlayerState, enemyIds: string[], rng: Rng, withParty = true, opts: { elite?: boolean; mult?: number } = {}): { battle: Battle; player: Unit; enemyUnitIds: string[] } {
  const stats = computeStats(p);
  const player = makeUnit('player', p.name, 'player', stats, availableSkills(p).map((s) => s.id), 'none');
  if (p.unlockedSystems.includes('thoat_xac')) player.reviveFrac = 0.3; // Nguyên Anh: thoát xác, mạng thứ hai
  const units: Unit[] = [player];
  if (withParty) {
    for (const cid of p.party) {
      const def = companionMap.get(cid);
      const cs = companionStats(p, cid);
      if (def && cs) units.push(makeUnit(`c_${cid}`, def.name, 'player', cs, def.skills, def.element));
    }
  }
  const enemyUnitIds: string[] = [];
  enemyIds.forEach((eid, i) => {
    const e = enemyMap.get(eid);
    const id = `e${i}`;
    enemyUnitIds.push(id);
    if (eid === 'tam_ma') {
      // bản sao của người chơi: cùng chiêu thức, chỉ số theo đạo tâm
      const f = tamMaFactor(p);
      const ms = { hp: Math.round(stats.hp * f), mp: stats.mp, atk: Math.round(stats.atk * f), def: Math.round(stats.def * f), spd: stats.spd, crit: stats.crit };
      units.push(makeUnit(id, 'Tâm Ma', 'enemy', ms, availableSkills(p).map((s) => s.id), 'none'));
    } else {
      const elite = !!opts.elite && !e.boss;
      let st = scaleEnemyStats(e.stats, effectiveDifficulty(p), elite);
      if (opts.mult && opts.mult !== 1) st = { ...st, hp: Math.round(st.hp * opts.mult), atk: Math.round(st.atk * opts.mult) }; // Vô Tận Tháp
      units.push(makeUnit(id, elite ? `★ ${e.name}` : e.name, 'enemy', st, e.skills, e.element, e.phases, e.tempoResist));
    }
  });
  // trận pháp (cả đội) và pháp tắc (chỉ bản thân) — chỉ áp dụng cho phe người chơi
  const fx = formationFx(p);
  for (const u of units.filter((x) => x.side === 'player')) {
    u.stats = { ...u.stats, atk: Math.round(u.stats.atk * fx.atkMul), def: Math.round(u.stats.def * fx.defMul), spd: Math.round(u.stats.spd * fx.spdMul) };
    if (fx.takenMul !== 1) u.takenMul = fx.takenMul;
    if (fx.hpRegenPct) u.hpRegenPct = fx.hpRegenPct;
  }
  const lp = lawPerks(p);
  if (Object.keys(lp).length) player.perks = { softcap: lp.softcap, healOnKill: lp.healOnKill, dodge: lp.dodge, elemBonus: lp.elemBonus, critDmg: lp.critDmg };
  const battle = new Battle(units, rng);
  battle.mpRegen += fx.mpRegen;
  return { battle, player, enemyUnitIds };
}

/** Tự đánh cả trận bằng AI (cho cả hai phe). Trả về kết quả và số hành động. */
export function autoBattle(p: PlayerState, enemyIds: string[], rng: Rng, maxActions = 400, withParty = false): { won: boolean; actions: number; hpLeft: number } {
  const { battle, player } = buildBattle(p, enemyIds, rng, withParty);
  let n = 0;
  while (!battle.winner && n < maxActions) {
    const cur = battle.current();
    if (!cur) break;
    const id = battle.aiPick(cur);
    let ev = battle.act(cur, id, battle.aiTarget(cur, id));
    if (!ev.length) ev = battle.act(cur, cur.skills.find((k) => k) ?? '', undefined);
    if (!ev.length) cur.nextAt += 100;
    n++;
  }
  return { won: battle.winner === 'player', actions: n, hpLeft: player.hp / player.stats.hp };
}
