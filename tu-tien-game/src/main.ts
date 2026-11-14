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

const phaserGame = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: W,
  height: H,
  backgroundColor: '#0b1020',
  pixelArt: true,
  roundPixels: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { activePointers: 3 },
  scene: [BootScene, TitleScene, OverworldScene, BattleScene, MenuScene, ShopScene, MiniGameScene, TribulationScene],
});
(window as unknown as { __phaser: Phaser.Game }).__phaser = phaserGame; // phục vụ debug/test

// PWA: đăng ký service worker (chỉ ở bản build, bỏ qua khi dev)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => { /* bỏ qua */ }); });
}
