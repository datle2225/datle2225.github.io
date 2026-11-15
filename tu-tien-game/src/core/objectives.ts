import { allMapIds, loadMap } from './maps';
import { enemyMap, materialMap, REALMS } from './data';
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

/** Hậu tố tiến độ của bước đang làm, vd " (1/3)" cho 'hạ 3 Yêu Xà'. */
export function stepProgress(p: PlayerState, q: { id: string; steps: Step[] }): string {
  const idx = q.steps.findIndex((s, i) => (p.quests.progress[`${q.id}:${i}`] ?? 0) < (s.n ?? 1));
  if (idx < 0) return '';
  const st = q.steps[idx];
  if ((st.n ?? 1) <= 1 || st.kind === 'realm') return '';
  const have = p.quests.progress[`${q.id}:${idx}`] ?? 0;
  return ` (${have}/${st.n})`;
}

export const MAX_TRACKED = 3;

/** Nhiệm vụ hiển thị trên HUD: chính luôn hiện; phụ chỉ hiện cái được ghim (chưa ghim thì lấy 2 cái đầu); expanded = hiện hết. */
export function trackedQuests(p: PlayerState, expanded = false): any[] {
  const all = p.quests.active.map((id) => getQuest(p, id)).filter(Boolean) as any[];
  if (expanded) return [...all.filter((q) => q.type === 'main'), ...all.filter((q) => q.type !== 'main')];
  const main = all.filter((q) => q.type === 'main');
  const others = all.filter((q) => q.type !== 'main');
  const pins = (p.tracked ?? []).filter((id) => others.some((q) => q.id === id));
  const shown = pins.length ? others.filter((q) => pins.includes(q.id)) : others.slice(0, 2);
  return [...main, ...shown.slice(0, MAX_TRACKED)];
}

/** Việc cần làm kế tiếp, một câu ngắn gọn. */
export function stepText(p: PlayerState, q: any): string {
  const idx = q.steps.findIndex((s: Step, i: number) => (p.quests.progress[`${q.id}:${i}`] ?? 0) < (s.n ?? 1));
  if (idx < 0) return '';
  const st: Step = q.steps[idx];
  const have = p.quests.progress[`${q.id}:${idx}`] ?? 0;
  const cnt = (st.n ?? 1) > 1 ? ` (${have}/${st.n})` : '';
  switch (st.kind) {
    case 'talk': {
      let name = st.target;
      for (const id of allMapIds()) { const n = loadMap(id).npcs.find((x) => x.id === st.target); if (n) { name = n.name; break; } }
      return `Nói chuyện với ${name}`;
    }
    case 'reach': return 'Đến địa điểm đánh dấu trên minimap';
    case 'battle': return `Hạ ${enemyMap.get(st.target)?.name ?? st.target}${cnt}`;
    case 'collect': return `Thu thập ${materialMap.get(st.target)?.name ?? st.target}${cnt}`;
    case 'realm': return `Đạt ${REALMS.find((r) => r.id === st.target)?.name ?? st.target}${(st.n ?? 1) > 1 ? ` tầng ${st.n}` : ''}`;
    case 'branch': return 'Chọn nhánh tu (Menu → Trạng thái)';
    case 'flag': return 'Hoàn thành mục tiêu cuối (Menu → Độ kiếp)';
    default: return q.desc;
  }
}
