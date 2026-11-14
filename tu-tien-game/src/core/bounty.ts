import { ENEMIES, REALMS, enemyMap, factionMap, materialMap } from './data';
import { rankIndex } from './advanced';
import { Rng } from './rng';
import { worldDay } from './services';
import { expNeeded } from './progression';
import type { PlayerState } from './types';

/**
 * Bảng nhiệm vụ: mỗi ngày game sinh 4 nhiệm vụ lặp lại theo cảnh giới người chơi (săn quái / thu thập).
 * Nhiệm vụ đã nhận được lưu trong `p.dynQuests` nên không biến mất khi qua ngày.
 */
export interface Bounty {
  id: string; // `b${ngày}-${i}-${realm}`
  kind: 'hunt' | 'gather';
  target: string;
  n: number;
  title: string;
  desc: string;
  reward: { linh_thach: number; exp: number; rep?: Record<string, number> };
  danger: number; // 1..3
  faction?: string; // nhiệm vụ riêng của thế lực
  points?: number; // điểm cống hiến thưởng thêm
}

const MAX_ACTIVE = 3;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Quái hợp cảnh giới: cùng cảnh giới hoặc thấp hơn một bậc, không phải boss / tâm ma. */
export function huntPool(realmIndex: number): string[] {
  const ids = [REALMS[realmIndex]?.id, REALMS[Math.max(0, realmIndex - 1)]?.id];
  return ENEMIES.filter((e: any) => !e.boss && e.id !== 'tam_ma' && ids.includes(e.realm)).map((e: any) => e.id);
}

const GATHER_POOL = [
  { id: 'linh_thao', min: 6, max: 12 },
  { id: 'huyen_thiet', min: 4, max: 8 },
  { id: 'huyet_tham', min: 3, max: 6 },
  { id: 'da_soi', min: 5, max: 10 },
];

export function bountiesForDay(p: Pick<PlayerState, 'realmIndex' | 'stage' | 'playtime'>, count = 4): Bounty[] {
  const day = worldDay(p as PlayerState);
  const rng = new Rng(hash(`bounty:${day}:${p.realmIndex}`));
  const pool = huntPool(p.realmIndex);
  const out: Bounty[] = [];
  const scale = 1 + p.realmIndex * 0.9;
  for (let i = 0; i < count; i++) {
    const id = `b${day}-${i}-${p.realmIndex}`;
    const danger = rng.int(1, 3);
    if (pool.length && rng.chance(0.65)) {
      const e = enemyMap.get(rng.pick(pool));
      const n = rng.int(2, 4) + danger;
      out.push({ id, kind: 'hunt', target: e.id, n, title: `Săn ${e.name}`, desc: `Hạ ${n} ${e.name} đang quấy nhiễu quanh vùng.`, danger,
        reward: { linh_thach: Math.round(25 * scale * n * (0.8 + danger * 0.3)), exp: Math.round(e.exp * n * 0.6), rep: { tan_tu: 1 } } });
    } else {
      const g = rng.pick(GATHER_POOL);
      const n = rng.int(g.min, g.max);
      const name = (materialMap.get(g.id) as any).name;
      out.push({ id, kind: 'gather', target: g.id, n, title: `Thu mua ${name}`, desc: `Nộp ${n} ${name} cho thương hội.`, danger: 1,
        reward: { linh_thach: Math.round(((materialMap.get(g.id) as any).price ?? 10) * n * 1.9 + 20 * scale), exp: Math.round(expNeeded(p as PlayerState) * 0.004 * n), rep: { tan_tu: 1 } } });
    }
  }
  return out;
}

export const activeBounties = (p: PlayerState) => p.quests.active.filter((id) => p.dynQuests[id]?.bounty);

export function acceptBounty(p: PlayerState, b: Bounty): { ok: boolean; msg: string } {
  if (p.bountyAccepted[b.id]) return { ok: false, msg: 'Bạn đã nhận nhiệm vụ này rồi.' };
  if (activeBounties(p).length >= MAX_ACTIVE) return { ok: false, msg: `Chỉ nhận tối đa ${MAX_ACTIVE} nhiệm vụ bảng cùng lúc.` };
  p.dynQuests[b.id] = {
    id: b.id, type: 'side', bounty: true, title: b.title, desc: b.desc,
    steps: [{ kind: b.kind === 'hunt' ? 'battle' : 'collect', target: b.target, n: b.n }],
    reward: { exp: b.reward.exp, linh_thach: b.reward.linh_thach }, rep: b.reward.rep,
  };
  p.bountyAccepted[b.id] = true;
  p.quests.active.push(b.id);
  return { ok: true, msg: `Đã nhận: ${b.title}.` };
}

export function abandonBounty(p: PlayerState, id: string): { ok: boolean; msg: string } {
  if (!p.dynQuests[id]?.bounty && !p.dynQuests[id]?.factionMission) return { ok: false, msg: 'Không phải nhiệm vụ bảng / thế lực.' };
  p.quests.active = p.quests.active.filter((x) => x !== id);
  delete p.dynQuests[id];
  for (const k of Object.keys(p.quests.progress)) if (k.startsWith(`${id}:`)) delete p.quests.progress[k];
  return { ok: true, msg: 'Đã bỏ nhiệm vụ.' };
}

export const MAX_ACTIVE_BOUNTIES = MAX_ACTIVE;


/* ───────────── Nhiệm vụ thế lực ───────────── */

/** Thế lực đối địch: hoàn thành nhiệm vụ của phe này làm phe kia ghét thêm. */
export const RIVAL_REP: Record<string, string> = { thanh_van: 'ma_dao', huyet_anh: 'chinh_dao' };
export const MAX_ACTIVE_FACTION = 2;

export function factionMissions(p: PlayerState): Bounty[] {
  if (!p.faction) return [];
  const f = factionMap.get(p.faction.id) as any;
  const rank = rankIndex(p);
  const day = worldDay(p);
  const rng = new Rng(hash(`faction:${p.faction.id}:${day}:${p.realmIndex}`));
  const pool = huntPool(p.realmIndex);
  const scale = 1 + p.realmIndex * 0.9;
  const out: Bounty[] = [];
  const name = f.name.split(' (')[0];
  for (let i = 0; i < 3; i++) {
    const danger = Math.min(3, 1 + Math.floor((rank + i) / 2));
    const id = `f${p.faction.id}-${day}-${i}-${p.realmIndex}`;
    const gatherTheme = p.faction.id === 'van_duoc' || (p.faction.id === 'tan_tu' && i === 2);
    const points = (15 + 20 * danger + 10 * rank) ;
    if (!gatherTheme && pool.length) {
      const e = enemyMap.get(rng.pick(pool));
      const n = 3 + danger + rng.int(0, 2);
      out.push({ id, kind: 'hunt', target: e.id, n, danger, faction: p.faction.id, points, title: `[${name}] Săn ${e.name}`, desc: `Mệnh lệnh của ${name}: hạ ${n} ${e.name}.`,
        reward: { linh_thach: Math.round(35 * scale * n * (0.9 + danger * 0.35)), exp: Math.round(e.exp * n * 0.7) } });
    } else {
      const g = rng.pick([{ id: 'huyet_tham', min: 4, max: 7 }, { id: 'linh_thao', min: 8, max: 14 }, { id: 'huyen_thiet', min: 6, max: 10 }]);
      const n = rng.int(g.min, g.max) + danger;
      const mn = (materialMap.get(g.id) as any).name;
      out.push({ id, kind: 'gather', target: g.id, n, danger, faction: p.faction.id, points, title: `[${name}] Cung ứng ${mn}`, desc: `${name} cần ${n} ${mn} gấp.`,
        reward: { linh_thach: Math.round(((materialMap.get(g.id) as any).price ?? 10) * n * 2.2 + 25 * scale), exp: Math.round(expNeeded(p) * 0.005 * n) } });
    }
  }
  return out;
}

export const activeFactionMissions = (p: PlayerState) => p.quests.active.filter((id) => p.dynQuests[id]?.factionMission);

export function acceptFactionMission(p: PlayerState, b: Bounty): { ok: boolean; msg: string } {
  if (!p.faction || p.faction.id !== b.faction) return { ok: false, msg: 'Nhiệm vụ này không thuộc thế lực của bạn.' };
  if (p.bountyAccepted[b.id]) return { ok: false, msg: 'Bạn đã nhận nhiệm vụ này rồi.' };
  if (activeFactionMissions(p).length >= MAX_ACTIVE_FACTION) return { ok: false, msg: `Chỉ nhận tối đa ${MAX_ACTIVE_FACTION} nhiệm vụ thế lực cùng lúc.` };
  const rivalKey = RIVAL_REP[b.faction];
  p.dynQuests[b.id] = {
    id: b.id, type: 'side', factionMission: true, title: b.title, desc: b.desc,
    steps: [{ kind: b.kind === 'hunt' ? 'battle' : 'collect', target: b.target, n: b.n }],
    reward: { exp: b.reward.exp, linh_thach: b.reward.linh_thach }, factionPoints: b.points,
    rep: rivalKey ? { [rivalKey]: -1 } : undefined,
  };
  p.bountyAccepted[b.id] = true;
  p.quests.active.push(b.id);
  return { ok: true, msg: `Đã nhận: ${b.title}.` };
}
