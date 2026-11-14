import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { OverworldScene } from './scenes/OverworldScene';
import { BattleScene } from './scenes/BattleScene';
import { MenuScene } from './scenes/MenuScene';
import { ShopScene } from './scenes/ShopScene';
import { MiniGameScene } from './scenes/MiniGameScene';
import { TribulationScene } from './scenes/TribulationScene';

export const W = 640;
export const H = 360;
/** Hệ số render: canvas thật = W*Z × H*Z, camera zoom Z, chữ vẽ ở độ phân giải Z → nét hơn trên màn hình lớn/điện thoại. */
export const Z = 2;

// mọi chữ tạo ra đều dùng độ phân giải Z
const origText = Phaser.GameObjects.GameObjectFactory.prototype.text;
Phaser.GameObjects.GameObjectFactory.prototype.text = function (this: Phaser.GameObjects.GameObjectFactory, ...a: Parameters<typeof origText>) {
  return origText.apply(this, a).setResolution(Z);
} as typeof origText;

const phaserGame = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: W * Z,
  height: H * Z,
  backgroundColor: '#0b1020',
  pixelArt: true,
  roundPixels: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { activePointers: 3 },
  scene: [BootScene, TitleScene, OverworldScene, BattleScene, MenuScene, ShopScene, MiniGameScene, TribulationScene],
});
phaserGame.events.once('ready', () => {
  for (const sc of phaserGame.scene.scenes) {
    sc.events.on('create', () => {
      const c = sc.cameras.main;
      c.setViewport(0, 0, W * Z, H * Z).setOrigin(0, 0).setZoom(Z);
    });
  }
});
(window as unknown as { __phaser: Phaser.Game }).__phaser = phaserGame; // phục vụ debug/test

// PWA: đăng ký service worker (chỉ ở bản build, bỏ qua khi dev)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => { /* bỏ qua */ }); });
}
