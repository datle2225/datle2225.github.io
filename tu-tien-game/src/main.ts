import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { OverworldScene } from './scenes/OverworldScene';
import { BattleScene } from './scenes/BattleScene';
import { MenuScene } from './scenes/MenuScene';

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
  scene: [BootScene, TitleScene, OverworldScene, BattleScene, MenuScene],
});
(window as unknown as { __phaser: Phaser.Game }).__phaser = phaserGame; // phục vụ debug/test
