import { parseTiled, type MapDef, type TiledMap } from './tiled';

// Mọi file src/data/maps/*.json (xuất từ Tiled) được nạp tự động; tên file = id bản đồ.
const files = import.meta.glob('../data/maps/*.json', { eager: true, import: 'default' }) as Record<string, TiledMap>;

const cache = new Map<string, MapDef>();
export function allMapIds(): string[] {
  return Object.keys(files).map((p) => p.split('/').pop()!.replace('.json', ''));
}
export function loadMap(id: string): MapDef {
  const hit = cache.get(id);
  if (hit) return hit;
  const key = Object.keys(files).find((p) => p.endsWith(`/${id}.json`));
  if (!key) throw new Error(`Không có bản đồ: ${id}`);
  const def = parseTiled(files[key], id);
  cache.set(id, def);
  return def;
}
