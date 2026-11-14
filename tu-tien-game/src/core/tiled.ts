import { TILESET, TILE_PX } from './tileset';
import type { Cond, TalkRule } from './story';

/** Nhập bản đồ định dạng Tiled (File → Export As → JSON, orthogonal). Tileset: xem docs/13-art-guide.md. */

export interface ScheduleEntry { from: number; to: number; x: number; y: number; hidden?: boolean }
export interface MapNpc { id: string; name: string; tex: string; x: number; y: number; vendor?: string; talk: TalkRule[]; schedule?: ScheduleEntry[] }
export interface MapFoe { group: string[]; tex: string; x: number; y: number; scale?: number; minRealm?: number }
export interface MapZone { id: string; x: number; y: number; r: number; if?: Cond; deny?: string }
export interface MapPortal { x: number; y: number; w: number; h: number; target: string; arrive: string; if?: Cond; deny?: string }
export interface MapDef {
  id: string; name: string; music: string; w: number; h: number;
  tiles: number[]; // chỉ số trong TILESET, -1 = trống
  npcs: MapNpc[]; signs: { x: number; y: number; text: string }[]; foes: MapFoe[]; herbs: [number, number][];
  zones: MapZone[]; portals: MapPortal[]; spawns: Record<string, { x: number; y: number }>;
}

interface TiledProp { name: string; type?: string; value: unknown }
interface TiledObject { id: number; name: string; type?: string; x: number; y: number; width?: number; height?: number; point?: boolean; properties?: TiledProp[] }
interface TiledLayer { name: string; type: 'tilelayer' | 'objectgroup'; data?: number[]; objects?: TiledObject[]; width?: number; height?: number }
export interface TiledMap { width: number; height: number; tilewidth: number; layers: TiledLayer[]; properties?: TiledProp[]; tilesets?: { firstgid: number; tiles?: { id: number; properties?: TiledProp[] }[] }[] }

const props = (o: { properties?: TiledProp[] }): Record<string, any> => Object.fromEntries((o.properties ?? []).map((p) => [p.name, p.value]));
const json = <T>(v: unknown): T | undefined => { if (typeof v !== 'string' || !v.trim()) return undefined; try { return JSON.parse(v) as T; } catch { throw new Error(`JSON không hợp lệ trong thuộc tính bản đồ: ${v}`); } };
const T = (px: number) => Math.floor(px / TILE_PX);

export function parseTiled(raw: TiledMap, id: string): MapDef {
  if (raw.tilewidth !== TILE_PX) throw new Error(`Bản đồ ${id}: tile phải là ${TILE_PX}px (đang là ${raw.tilewidth}).`);
  const mp = props(raw);
  const w = raw.width, h = raw.height;
  const firstgid = raw.tilesets?.[0]?.firstgid ?? 1;
  const tiles = new Array<number>(w * h).fill(-1);
  for (const l of raw.layers) {
    if (l.type !== 'tilelayer' || !l.data) continue;
    l.data.forEach((gid, i) => { if (gid > 0) { const idx = gid - firstgid; if (idx >= 0 && idx < TILESET.length) tiles[i] = idx; } });
  }
  const def: MapDef = { id, name: String(mp.name ?? id), music: String(mp.music ?? 'overworld'), w, h, tiles, npcs: [], signs: [], foes: [], herbs: [], zones: [], portals: [], spawns: {} };
  for (const l of raw.layers) {
    if (l.type !== 'objectgroup') continue;
    for (const o of l.objects ?? []) {
      const p = props(o);
      const x = T(o.x), y = T(o.y);
      switch (l.name) {
        case 'npcs': def.npcs.push({ id: o.name, name: String(p.label ?? o.name), tex: String(p.tex ?? 'npc_elder'), x, y, vendor: p.vendor, talk: json<TalkRule[]>(p.talk) ?? [], schedule: json<ScheduleEntry[]>(p.schedule) }); break;
        case 'enemies': def.foes.push({ group: String(p.group ?? '').split(',').map((s) => s.trim()).filter(Boolean), tex: String(p.tex ?? 'wolf'), x, y, scale: p.scale, minRealm: p.minRealm }); break;
        case 'herbs': def.herbs.push([x, y]); break;
        case 'signs': def.signs.push({ x, y, text: String(p.text ?? o.name) }); break;
        case 'zones': def.zones.push({ id: o.name, x, y, r: Number(p.r ?? 2), if: json<Cond>(p.if), deny: p.deny }); break;
        case 'portals': def.portals.push({ x, y, w: Math.max(1, T(o.width ?? TILE_PX)), h: Math.max(1, T(o.height ?? TILE_PX)), target: String(p.target), arrive: String(p.arrive ?? 'spawn'), if: json<Cond>(p.if), deny: p.deny }); break;
        case 'spawns': def.spawns[o.name || 'spawn'] = { x, y }; break;
      }
    }
  }
  if (!def.spawns.spawn) def.spawns.spawn = { x: Math.floor(w / 2), y: Math.floor(h / 2) };
  return def;
}

export function isSolidTile(idx: number): boolean {
  return idx >= 0 && !!TILESET[idx]?.solid;
}
