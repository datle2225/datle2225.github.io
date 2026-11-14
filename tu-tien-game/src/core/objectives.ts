import { allMapIds, loadMap } from './maps';
import { enemyMap } from './data';
import { getQuest } from './session';
import type { MapDef } from './tiled';
import type { PlayerState } from './types';

/** Điểm đánh dấu mục tiêu nhiệm vụ trên minimap. Tọa độ tính theo ô. */
export interface Marker { x: number; y: number; label: string; kind: 'target' | 'portal'; main: boolean; mapName?: string }

interface Step { kind: string; target: string; n?: number }

/** Các vị trí có thể hoàn thành bước nhiệm vụ này trên bản đồ m. */
function spotsOnMap(step: Step, m: MapDef): { x: number; y: number }[] {
  switch (step.kind) {
    case 'talk': return m.npcs.filter((n) => n.id === step.target).map((n) => ({ x: n.x, y: n.y }));
    case 'reach': return m.zones.filter((z) => z.id === step.target).map((z) => ({ x: z.x, y: z.y }));
    case 'battle': return m.foes.filter((f) => f.group.includes(step.target)).map((f) => ({ x: f.x, y: f.y }));
    case 'collect': {
      const dropFoes = m.foes.filter((f) => f.group.some((e) => enemyMap.get(e)?.drops?.some((d: { id: string }) => d.id === step.target)));
      const herb = step.target === 'linh_thao' ? m.herbs.map(([x, y]) => ({ x, y })) : [];
      return [...herb, ...dropFoes.map((f) => ({ x: f.x, y: f.y }))];
    }
    default: return [];
  }
}

/** Đường đi ngắn nhất giữa các bản đồ qua cổng dịch chuyển → cổng đầu tiên cần đi qua (hoặc null). */
function firstPortalToward(from: string, goal: (id: string) => boolean): { x: number; y: number; to: string } | null {
  const prev = new Map<string, { map: string; portal: { x: number; y: number; to: string } }>();
  const seen = new Set([from]);
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const pt of loadMap(cur).portals) {
      if (seen.has(pt.target)) continue;
      seen.add(pt.target);
      prev.set(pt.target, { map: cur, portal: { x: pt.x + pt.w / 2, y: pt.y + pt.h / 2, to: pt.target } });
      if (goal(pt.target)) {
        let node = pt.target;
        let step = prev.get(node)!;
        while (step.map !== from) { node = step.map; step = prev.get(node)!; }
        return step.portal;
      }
      queue.push(pt.target);
    }
  }
  return null;
}

/** Bước đầu tiên chưa xong của mỗi nhiệm vụ đang nhận. */
export function activeSteps(p: PlayerState): { quest: any; step: Step }[] {
  const out: { quest: any; step: Step }[] = [];
  for (const id of p.quests.active) {
    const q = getQuest(p, id);
    if (!q) continue;
    const idx = q.steps.findIndex((s: Step, i: number) => (p.quests.progress[`${id}:${i}`] ?? 0) < (s.n ?? 1));
    if (idx >= 0) out.push({ quest: q, step: q.steps[idx] });
  }
  return out;
}

export function objectiveMarkers(p: PlayerState, mapId: string): Marker[] {
  const here = loadMap(mapId);
  const markers: Marker[] = [];
  for (const { quest, step } of activeSteps(p)) {
    const main = quest.type === 'main';
    const spots = spotsOnMap(step, here);
    if (spots.length) { for (const s of spots) markers.push({ ...s, label: quest.title, kind: 'target', main }); continue; }
    const hasSpot = (id: string) => spotsOnMap(step, loadMap(id)).length > 0;
    if (!allMapIds().some((id) => id !== mapId && hasSpot(id))) continue; // mục tiêu không gắn với vị trí nào (vd. đan phải tự chế)
    const portal = firstPortalToward(mapId, hasSpot);
    if (portal) {
      const dest = allMapIds().find((id) => id === portal.to);
      markers.push({ x: portal.x, y: portal.y, label: quest.title, kind: 'portal', main, mapName: dest ? loadMap(dest).name : undefined });
    }
  }
  return markers;
}
