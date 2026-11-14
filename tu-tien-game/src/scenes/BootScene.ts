import Phaser from 'phaser';

/** Không cần file ảnh: toàn bộ sprite pixel được vẽ bằng code, dễ thay bằng art thật về sau. */
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    const px = (key: string, size: number, draw: (g: Phaser.GameObjects.Graphics) => void) => {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      draw(g);
      g.generateTexture(key, size, size);
      g.destroy();
    };
    const R = (g: Phaser.GameObjects.Graphics, c: number, x: number, y: number, w: number, h: number) => g.fillStyle(c, 1).fillRect(x, y, w, h);

    px('grass', 16, (g) => { R(g, 0x3b7a3b, 0, 0, 16, 16); R(g, 0x4a8f48, 3, 4, 2, 2); R(g, 0x2f6a30, 10, 9, 2, 2); R(g, 0x4a8f48, 12, 2, 1, 2); });
    px('path', 16, (g) => { R(g, 0xb59a6a, 0, 0, 16, 16); R(g, 0xa38a5c, 4, 5, 3, 2); R(g, 0xc7ae7e, 10, 11, 3, 2); });
    px('water', 16, (g) => { R(g, 0x2d5fa8, 0, 0, 16, 16); R(g, 0x4a7fc8, 2, 4, 5, 1); R(g, 0x4a7fc8, 9, 10, 5, 1); });
    px('tree', 16, (g) => { R(g, 0x3b7a3b, 0, 0, 16, 16); R(g, 0x5a3a1e, 7, 10, 3, 6); R(g, 0x1f5a26, 2, 1, 12, 10); R(g, 0x2c7a34, 4, 2, 8, 6); });
    px('rock', 16, (g) => { R(g, 0x3b7a3b, 0, 0, 16, 16); R(g, 0x7a7f8c, 2, 5, 12, 9); R(g, 0x9aa0ae, 4, 6, 5, 3); });
    px('ruin', 16, (g) => { R(g, 0x3a3a3a, 0, 0, 16, 16); R(g, 0x2a2a2a, 1, 1, 6, 6); R(g, 0x4a3a2a, 9, 7, 6, 8); R(g, 0x6a2a1a, 11, 3, 3, 3); });
    px('well', 16, (g) => { R(g, 0x3b7a3b, 0, 0, 16, 16); R(g, 0x777777, 2, 4, 12, 10); R(g, 0x111827, 4, 6, 8, 5); R(g, 0x5a3a1e, 2, 1, 12, 2); });
    px('gate', 16, (g) => { R(g, 0xb59a6a, 0, 0, 16, 16); R(g, 0xaa2a2a, 1, 0, 3, 16); R(g, 0xaa2a2a, 12, 0, 3, 16); R(g, 0xd9b44a, 0, 0, 16, 3); });

    const person = (skin: number, robe: number, hair: number) => (g: Phaser.GameObjects.Graphics) => {
      R(g, hair, 4, 1, 8, 4); R(g, skin, 5, 4, 6, 4); R(g, 0x111111, 6, 5, 1, 1); R(g, 0x111111, 9, 5, 1, 1);
      R(g, robe, 3, 8, 10, 6); R(g, skin, 2, 9, 1, 3); R(g, skin, 13, 9, 1, 3); R(g, 0x222222, 5, 14, 2, 2); R(g, 0x222222, 9, 14, 2, 2);
    };
    px('player', 16, person(0xf1c9a0, 0x4a6fd8, 0x1a1a1a));
    px('npc_elder', 16, person(0xe3b98c, 0x8a8a8a, 0xdddddd));
    px('npc_girl', 16, person(0xf1c9a0, 0xd86a8a, 0x3a1a1a));
    px('npc_disciple', 16, person(0xf1c9a0, 0xffffff, 0x2a2a2a));
    px('wolf', 16, (g) => { R(g, 0x7a7f8c, 2, 6, 12, 6); R(g, 0x9aa0ae, 11, 4, 4, 4); R(g, 0xff4444, 13, 5, 1, 1); R(g, 0x7a7f8c, 3, 12, 2, 3); R(g, 0x7a7f8c, 10, 12, 2, 3); R(g, 0x5a5f6c, 0, 5, 3, 2); });
    px('snake', 16, (g) => { R(g, 0x4a9a4a, 2, 10, 12, 3); R(g, 0x4a9a4a, 9, 6, 3, 5); R(g, 0x6aba6a, 9, 4, 4, 3); R(g, 0xffee44, 11, 5, 1, 1); });
    px('cultist', 16, person(0xe3b98c, 0x8a1a1a, 0x111111));
    px('elder_boss', 16, person(0xe3b98c, 0x5a0a0a, 0xaa2a2a));
    px('herb', 16, (g) => { R(g, 0x3b7a3b, 0, 0, 16, 16); R(g, 0x2fb04a, 6, 6, 4, 8); R(g, 0x6aeb7a, 4, 5, 3, 3); R(g, 0x6aeb7a, 9, 4, 3, 3); R(g, 0xffd84a, 7, 3, 2, 2); });
    px('spark', 4, (g) => { R(g, 0xfff3a0, 0, 0, 4, 4); });

    this.scene.start('Title');
  }
}
