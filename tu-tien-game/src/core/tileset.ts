/** Thứ tự ô trong tileset (khớp tileset của các map Tiled). KHÔNG đổi thứ tự, chỉ thêm vào cuối. */
export const TILESET: { tex: string; solid: boolean }[] = [
  { tex: 'grass', solid: false }, { tex: 'path', solid: false }, { tex: 'water', solid: true }, { tex: 'tree', solid: true },
  { tex: 'rock', solid: true }, { tex: 'ruin', solid: false }, { tex: 'well', solid: true }, { tex: 'gate', solid: false },
  { tex: 'house', solid: true }, { tex: 'floor', solid: false }, { tex: 'wood', solid: false }, { tex: 'sect_roof', solid: true },
  { tex: 'sect_wall', solid: true }, { tex: 'pillar', solid: true }, { tex: 'dummy', solid: true }, { tex: 'lantern', solid: true },
  { tex: 'flower', solid: false }, { tex: 'fence', solid: true }, { tex: 'carpet', solid: false }, { tex: 'grass2', solid: false },
  { tex: 'bridge', solid: false }, { tex: 'sand', solid: false },
  { tex: 'cactus', solid: true }, { tex: 'lava', solid: true }, { tex: 'bones', solid: false }, { tex: 'dungeon_wall', solid: true }, { tex: 'dungeon_floor', solid: false }, { tex: 'sand_rock', solid: true },
];


export const TILE_PX = 16;
export const tileIndexByTex = new Map(TILESET.map((t, i) => [t.tex, i] as const));
