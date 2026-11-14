import Phaser from 'phaser';
export { TILESET } from '../core/tileset';

/**
 * Toàn bộ sprite pixel được vẽ bằng code (không cần file ảnh).
 * Muốn dùng art thật: bỏ ảnh 16×16 vào `public/art/` và khai báo trong `public/art/manifest.json`
 * (xem docs/13-art-guide.md). Texture nào có trong manifest sẽ thay cho bản vẽ bằng code.
 */

type G = Phaser.GameObjects.Graphics;
const R = (g: G, c: number, x: number, y: number, w: number, h: number) => g.fillStyle(c, 1).fillRect(x, y, w, h);

interface Look { skin: number; robe: number; hair: number; hat?: number; beard?: number; belt?: number }

/** Vẽ người 16×16. `step` 0/1/2 = đứng / bước chân trái / bước chân phải. */
function person(g: G, l: Look, step = 0) {
  R(g, l.hair, 4, 1, 8, 4);
  if (l.hat) { R(g, l.hat, 3, 0, 10, 2); R(g, l.hat, 5, 0, 6, 1); }
  R(g, l.skin, 5, 4, 6, 4);
  R(g, 0x111111, 6, 5, 1, 1); R(g, 0x111111, 9, 5, 1, 1);
  if (l.beard) R(g, l.beard, 5, 7, 6, 3);
  R(g, l.robe, 3, 8, 10, 6);
  if (l.belt) R(g, l.belt, 3, 11, 10, 1);
  R(g, l.skin, 2, 9, 1, 3); R(g, l.skin, 13, 9, 1, 3);
  if (step === 0) { R(g, 0x222222, 5, 14, 2, 2); R(g, 0x222222, 9, 14, 2, 2); }
  else if (step === 1) { R(g, 0x222222, 4, 14, 2, 2); R(g, 0x222222, 10, 13, 2, 2); }
  else { R(g, 0x222222, 6, 13, 2, 2); R(g, 0x222222, 9, 14, 2, 2); }
}

const LOOKS: Record<string, Look> = {
  player: { skin: 0xf1c9a0, robe: 0x4a6fd8, hair: 0x1a1a1a, belt: 0xd9b44a },
  npc_elder: { skin: 0xe3b98c, robe: 0x8a8a8a, hair: 0xdddddd, beard: 0xdddddd },
  npc_girl: { skin: 0xf1c9a0, robe: 0xd86a8a, hair: 0x3a1a1a },
  npc_girl2: { skin: 0xf1c9a0, robe: 0x8ad8c8, hair: 0x1a1a3a, belt: 0xffffff },
  npc_disciple: { skin: 0xf1c9a0, robe: 0xffffff, hair: 0x2a2a2a, belt: 0x4a6fd8 },
  npc_smith: { skin: 0xe3b98c, robe: 0x6a4a2a, hair: 0x3a2a1a, beard: 0x3a2a1a },
  npc_alch: { skin: 0xf1c9a0, robe: 0x2f8a5a, hair: 0x1a1a1a, hat: 0x1f6a44 },
  npc_shop: { skin: 0xe3b98c, robe: 0xc9a23a, hair: 0x5a3a1e, hat: 0x7a5a1e },
  npc_guard: { skin: 0xe3b98c, robe: 0x5a6a7a, hair: 0x2a2a2a, hat: 0x8a9aaa, belt: 0xd9b44a },
  npc_rival: { skin: 0xf1c9a0, robe: 0xf0e8c8, hair: 0x101018, belt: 0xd9b44a },
  npc_sage: { skin: 0xe3b98c, robe: 0x3a5a9a, hair: 0xeeeeee, beard: 0xeeeeee, hat: 0x2a3a6a },
  npc_clerk: { skin: 0xf1c9a0, robe: 0x8a6a4a, hair: 0x2a1a1a, belt: 0x4a3a2a },
  npc_merchant: { skin: 0xd9b48c, robe: 0x6a3a8a, hair: 0x201020, hat: 0x4a2a6a },
  cultist: { skin: 0xe3b98c, robe: 0x8a1a1a, hair: 0x111111 },
  elder_boss: { skin: 0xe3b98c, robe: 0x5a0a0a, hair: 0xaa2a2a, beard: 0xaa2a2a },
};

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    this.load.json('artManifest', './art/manifest.json');
  }

  create() {
    const manifest = this.cache.json.get('artManifest') as { images?: Record<string, string> } | undefined;
    const imgs = manifest?.images ?? {};
    const keys = Object.keys(imgs);
    if (keys.length) {
      for (const k of keys) this.load.image(k, `./art/${imgs[k]}`);
      this.load.once('complete', () => this.build());
      this.load.start();
    } else this.build();
  }

  private build() {
    const px = (key: string, size: number, draw: (g: G) => void) => {
      if (this.textures.exists(key)) return; // đã được art thật ghi đè
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      draw(g);
      g.generateTexture(key, size, size);
      g.destroy();
    };

    // ───── Tile ─────
    px('grass', 16, (g) => { R(g, 0x3b7a3b, 0, 0, 16, 16); R(g, 0x4a8f48, 3, 4, 2, 2); R(g, 0x2f6a30, 10, 9, 2, 2); R(g, 0x4a8f48, 12, 2, 1, 2); R(g, 0x336d34, 6, 12, 2, 1); });
    px('grass2', 16, (g) => { R(g, 0x3d7d3d, 0, 0, 16, 16); R(g, 0x4a8f48, 8, 3, 2, 2); R(g, 0x2f6a30, 2, 10, 2, 2); R(g, 0x56a352, 13, 12, 1, 2); R(g, 0x336d34, 5, 6, 1, 2); });
    px('flower', 16, (g) => { R(g, 0x3b7a3b, 0, 0, 16, 16); R(g, 0x4a8f48, 3, 4, 2, 2); R(g, 0xff7aa8, 5, 7, 2, 2); R(g, 0xffe066, 10, 4, 2, 2); R(g, 0xffffff, 9, 11, 2, 2); R(g, 0x2f9a3a, 5, 9, 1, 2); });
    px('path', 16, (g) => { R(g, 0xb59a6a, 0, 0, 16, 16); R(g, 0xa38a5c, 4, 5, 3, 2); R(g, 0xc7ae7e, 10, 11, 3, 2); R(g, 0x9a8250, 1, 13, 2, 1); });
    px('sand', 16, (g) => { R(g, 0xd8c48a, 0, 0, 16, 16); R(g, 0xc8b47a, 3, 3, 2, 1); R(g, 0xe8d49a, 10, 10, 3, 1); });
    px('water', 16, (g) => { R(g, 0x2d5fa8, 0, 0, 16, 16); R(g, 0x4a7fc8, 2, 4, 5, 1); R(g, 0x4a7fc8, 9, 10, 5, 1); });
    px('water2', 16, (g) => { R(g, 0x2d5fa8, 0, 0, 16, 16); R(g, 0x4a7fc8, 6, 5, 5, 1); R(g, 0x4a7fc8, 1, 11, 5, 1); R(g, 0x5a8fd8, 11, 2, 2, 1); });
    px('bridge', 16, (g) => { R(g, 0x2d5fa8, 0, 0, 16, 16); R(g, 0x8a6a3a, 0, 2, 16, 12); R(g, 0x6a4a2a, 0, 5, 16, 1); R(g, 0x6a4a2a, 0, 9, 16, 1); });
    px('tree', 16, (g) => { R(g, 0x3b7a3b, 0, 0, 16, 16); R(g, 0x5a3a1e, 7, 10, 3, 6); R(g, 0x1f5a26, 2, 1, 12, 10); R(g, 0x2c7a34, 4, 2, 8, 6); R(g, 0x3a9a44, 5, 3, 3, 2); });
    px('rock', 16, (g) => { R(g, 0x3b7a3b, 0, 0, 16, 16); R(g, 0x7a7f8c, 2, 5, 12, 9); R(g, 0x9aa0ae, 4, 6, 5, 3); R(g, 0x5a5f6c, 9, 11, 4, 2); });
    px('ruin', 16, (g) => { R(g, 0x3a3a3a, 0, 0, 16, 16); R(g, 0x2a2a2a, 1, 1, 6, 6); R(g, 0x4a3a2a, 9, 7, 6, 8); R(g, 0x6a2a1a, 11, 3, 3, 3); });
    px('well', 16, (g) => { R(g, 0x3b7a3b, 0, 0, 16, 16); R(g, 0x777777, 2, 4, 12, 10); R(g, 0x111827, 4, 6, 8, 5); R(g, 0x5a3a1e, 2, 1, 12, 2); });
    px('gate', 16, (g) => { R(g, 0xb59a6a, 0, 0, 16, 16); R(g, 0xaa2a2a, 1, 0, 3, 16); R(g, 0xaa2a2a, 12, 0, 3, 16); R(g, 0xd9b44a, 0, 0, 16, 3); });
    px('house', 16, (g) => { R(g, 0x3b7a3b, 0, 0, 16, 16); R(g, 0x8a2a2a, 0, 0, 16, 8); R(g, 0xb04a3a, 0, 1, 16, 2); R(g, 0xc9b28a, 0, 8, 16, 8); R(g, 0x8a7a5a, 3, 10, 3, 4); R(g, 0x8a7a5a, 10, 10, 3, 4); });
    px('floor', 16, (g) => { R(g, 0x9a9aa8, 0, 0, 16, 16); R(g, 0x8a8a98, 0, 0, 16, 1); R(g, 0x8a8a98, 0, 8, 16, 1); R(g, 0x8a8a98, 8, 0, 1, 8); R(g, 0x8a8a98, 4, 8, 1, 8); R(g, 0xaaaab8, 2, 2, 3, 2); });
    px('wood', 16, (g) => { R(g, 0xa87a4a, 0, 0, 16, 16); R(g, 0x8a6238, 0, 5, 16, 1); R(g, 0x8a6238, 0, 11, 16, 1); R(g, 0xb88a5a, 3, 2, 4, 1); });
    px('carpet', 16, (g) => { R(g, 0x9a2a3a, 0, 0, 16, 16); R(g, 0xd9b44a, 0, 0, 16, 1); R(g, 0xd9b44a, 0, 15, 16, 1); R(g, 0xb84a5a, 6, 6, 4, 4); });
    px('sect_roof', 16, (g) => { R(g, 0x3a4a8a, 0, 0, 16, 10); R(g, 0x4a5aaa, 0, 2, 16, 2); R(g, 0x2a3a6a, 0, 8, 16, 2); R(g, 0xd9b44a, 0, 10, 16, 1); R(g, 0xe8e0c8, 0, 11, 16, 5); });
    px('sect_wall', 16, (g) => { R(g, 0xe8e0c8, 0, 0, 16, 16); R(g, 0xc8c0a8, 0, 0, 16, 1); R(g, 0x8a2a2a, 6, 5, 4, 11); R(g, 0xd9b44a, 9, 10, 1, 1); R(g, 0xb8b098, 1, 4, 3, 3); R(g, 0xb8b098, 12, 4, 3, 3); });
    px('pillar', 16, (g) => { R(g, 0x9a9aa8, 0, 0, 16, 16); R(g, 0xaa2a2a, 5, 0, 6, 16); R(g, 0xd9b44a, 4, 0, 8, 2); R(g, 0xd9b44a, 4, 14, 8, 2); });
    px('dummy', 16, (g) => { R(g, 0x9a9aa8, 0, 0, 16, 16); R(g, 0x6a4a2a, 7, 6, 2, 10); R(g, 0xc9a26a, 4, 2, 8, 6); R(g, 0x8a6a3a, 3, 8, 10, 2); R(g, 0xaa2a2a, 6, 4, 4, 2); });
    px('lantern', 16, (g) => { R(g, 0x9a9aa8, 0, 0, 16, 16); R(g, 0x5a3a1e, 7, 0, 2, 4); R(g, 0xc02a2a, 4, 4, 8, 8); R(g, 0xffd24a, 6, 6, 4, 4); R(g, 0x5a3a1e, 7, 12, 2, 2); });
    px('fence', 16, (g) => { R(g, 0x3b7a3b, 0, 0, 16, 16); R(g, 0x8a6a3a, 0, 5, 16, 2); R(g, 0x8a6a3a, 0, 10, 16, 2); R(g, 0x6a4a2a, 2, 3, 2, 11); R(g, 0x6a4a2a, 12, 3, 2, 11); });
    px('cactus', 16, (g) => { R(g, 0xd8c48a, 0, 0, 16, 16); R(g, 0x2f8a3a, 6, 3, 4, 12); R(g, 0x2f8a3a, 3, 6, 3, 2); R(g, 0x2f8a3a, 3, 4, 2, 4); R(g, 0x2f8a3a, 10, 8, 3, 2); R(g, 0x2f8a3a, 11, 5, 2, 5); R(g, 0x5ac86a, 7, 4, 1, 8); });
    px('lava', 16, (g) => { R(g, 0x8a1a0a, 0, 0, 16, 16); R(g, 0xe8501a, 2, 3, 6, 3); R(g, 0xffb02a, 4, 4, 2, 1); R(g, 0xe8501a, 8, 10, 6, 3); R(g, 0xffb02a, 10, 11, 2, 1); });
    px('bones', 16, (g) => { R(g, 0x3a3030, 0, 0, 16, 16); R(g, 0xe8e0c8, 3, 6, 9, 2); R(g, 0xe8e0c8, 2, 5, 2, 4); R(g, 0xe8e0c8, 11, 5, 2, 4); R(g, 0xe8e0c8, 6, 10, 5, 1); });
    px('dungeon_wall', 16, (g) => { R(g, 0x2a2438, 0, 0, 16, 16); R(g, 0x3a3250, 0, 0, 16, 7); R(g, 0x1a1428, 0, 7, 16, 1); R(g, 0x3a3250, 8, 8, 8, 7); R(g, 0x1a1428, 8, 8, 1, 8); R(g, 0x5a2a3a, 2, 3, 3, 1); });
    px('dungeon_floor', 16, (g) => { R(g, 0x4a3a52, 0, 0, 16, 16); R(g, 0x3e3046, 0, 0, 16, 1); R(g, 0x3e3046, 0, 8, 16, 1); R(g, 0x3e3046, 8, 0, 1, 8); R(g, 0x58486a, 3, 3, 3, 2); R(g, 0x6a2a3a, 11, 11, 2, 2); });
    px('sand_rock', 16, (g) => { R(g, 0xd8c48a, 0, 0, 16, 16); R(g, 0x8a8f9c, 2, 5, 12, 9); R(g, 0xaab0be, 4, 6, 5, 3); R(g, 0x6a6f7c, 9, 11, 4, 2); });
    px('snow', 16, (g) => { R(g, 0xe8f0f8, 0, 0, 16, 16); R(g, 0xd0dcec, 3, 4, 3, 1); R(g, 0xffffff, 10, 10, 3, 1); R(g, 0xc0d0e4, 7, 13, 2, 1); });
    px('ice', 16, (g) => { R(g, 0xa8d4f0, 0, 0, 16, 16); R(g, 0xc8e8ff, 2, 3, 6, 1); R(g, 0x88b8e0, 8, 9, 6, 1); R(g, 0xffffff, 11, 3, 2, 1); });
    px('pine', 16, (g) => { R(g, 0xe8f0f8, 0, 0, 16, 16); R(g, 0x5a3a1e, 7, 11, 2, 5); R(g, 0x1f5a3a, 3, 7, 10, 5); R(g, 0x2c7a4a, 4, 4, 8, 4); R(g, 0x3a9a5a, 6, 1, 4, 4); R(g, 0xffffff, 5, 6, 3, 1); R(g, 0xffffff, 7, 3, 2, 1); });
    px('snow_rock', 16, (g) => { R(g, 0xe8f0f8, 0, 0, 16, 16); R(g, 0x7a7f8c, 2, 5, 12, 9); R(g, 0x9aa0ae, 4, 6, 5, 3); R(g, 0xffffff, 3, 5, 10, 2); });
    px('void_floor', 16, (g) => { R(g, 0x1c1038, 0, 0, 16, 16); R(g, 0x2c1a58, 0, 0, 16, 1); R(g, 0x2c1a58, 0, 8, 16, 1); R(g, 0x2c1a58, 8, 0, 1, 8); R(g, 0x6a4ac8, 3, 3, 2, 2); R(g, 0xb090ff, 11, 11, 1, 1); R(g, 0x6a4ac8, 12, 5, 1, 1); });
    px('cloud', 16, (g) => { R(g, 0xdce8ff, 0, 0, 16, 16); R(g, 0xffffff, 2, 3, 6, 3); R(g, 0xffffff, 9, 9, 5, 3); R(g, 0xc0d0f0, 4, 12, 6, 2); R(g, 0xf4f8ff, 10, 2, 3, 2); });
    px('void_hole', 16, (g) => { R(g, 0x050210, 0, 0, 16, 16); R(g, 0x2a1060, 2, 2, 12, 12); R(g, 0x0a0420, 4, 4, 8, 8); R(g, 0xb090ff, 7, 7, 2, 2); });
    px('herb', 16, (g) => { R(g, 0x2fb04a, 6, 6, 4, 8); R(g, 0x6aeb7a, 4, 5, 3, 3); R(g, 0x6aeb7a, 9, 4, 3, 3); R(g, 0xffd84a, 7, 3, 2, 2); });
    px('spark', 4, (g) => { R(g, 0xfff3a0, 0, 0, 4, 4); });

    // ───── Nhân vật (đứng + 2 khung bước) ─────
    for (const [key, look] of Object.entries(LOOKS)) {
      px(key, 16, (g) => person(g, look, 0));
      px(`${key}_w1`, 16, (g) => person(g, look, 1));
      px(`${key}_w2`, 16, (g) => person(g, look, 2));
      if (!this.anims.exists(`walk_${key}`)) {
        this.anims.create({ key: `walk_${key}`, frames: [{ key: `${key}_w1` }, { key }, { key: `${key}_w2` }, { key }], frameRate: 8, repeat: -1 });
      }
    }

    // ───── Quái (2 khung nhún nhảy) ─────
    px('wolf', 16, (g) => { R(g, 0x7a7f8c, 2, 6, 12, 6); R(g, 0x9aa0ae, 11, 4, 4, 4); R(g, 0xff4444, 13, 5, 1, 1); R(g, 0x7a7f8c, 3, 12, 2, 3); R(g, 0x7a7f8c, 10, 12, 2, 3); R(g, 0x5a5f6c, 0, 5, 3, 2); });
    px('wolf2', 16, (g) => { R(g, 0x7a7f8c, 2, 5, 12, 6); R(g, 0x9aa0ae, 11, 3, 4, 4); R(g, 0xff4444, 13, 4, 1, 1); R(g, 0x7a7f8c, 2, 11, 2, 4); R(g, 0x7a7f8c, 11, 11, 2, 4); R(g, 0x5a5f6c, 0, 4, 3, 2); });
    px('turtle', 16, (g) => { R(g, 0x4a7a4a, 3, 6, 10, 6); R(g, 0x6aaa5a, 5, 5, 6, 3); R(g, 0x8ab86a, 12, 7, 3, 3); R(g, 0x111111, 14, 8, 1, 1); R(g, 0x3a5a3a, 4, 12, 3, 2); R(g, 0x3a5a3a, 10, 12, 3, 2); R(g, 0xd9b44a, 6, 7, 2, 2); R(g, 0xd9b44a, 9, 7, 2, 2); });
    px('snake', 16, (g) => { R(g, 0x4a9a4a, 2, 10, 12, 3); R(g, 0x4a9a4a, 9, 6, 3, 5); R(g, 0x6aba6a, 9, 4, 4, 3); R(g, 0xffee44, 11, 5, 1, 1); });
    px('snake2', 16, (g) => { R(g, 0x4a9a4a, 2, 11, 12, 3); R(g, 0x4a9a4a, 9, 7, 3, 5); R(g, 0x6aba6a, 9, 5, 4, 3); R(g, 0xffee44, 11, 6, 1, 1); R(g, 0xff4444, 13, 7, 2, 1); });
    for (const k of ['wolf', 'snake']) {
      if (!this.anims.exists(`idle_${k}`)) this.anims.create({ key: `idle_${k}`, frames: [{ key: k }, { key: `${k}2` }], frameRate: 3, repeat: -1 });
    }

    this.scene.start('Title');
  }
}
