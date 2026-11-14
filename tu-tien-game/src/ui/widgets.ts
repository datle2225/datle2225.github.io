import Phaser from 'phaser';

export const FONT = { fontFamily: 'monospace', fontSize: '10px', color: '#e8ecff' };

export function label(s: Phaser.Scene, x: number, y: number, text: string, style: Phaser.Types.GameObjects.Text.TextStyle = {}) {
  return s.add.text(x, y, text, { ...FONT, ...style }).setScrollFactor(0);
}

/** Nút bấm cỡ lớn, dễ chạm trên điện thoại. */
export function button(s: Phaser.Scene, x: number, y: number, w: number, h: number, text: string, onClick: () => void, opts: { enabled?: boolean; color?: number; depth?: number } = {}) {
  const enabled = opts.enabled ?? true;
  const col = opts.color ?? 0x2a3566;
  const bg = s.add.rectangle(x, y, w, h, enabled ? col : 0x1a1f33).setOrigin(0).setStrokeStyle(1, enabled ? 0x8fa2ff : 0x3a415c).setScrollFactor(0);
  const t = s.add.text(x + w / 2, y + h / 2, text, { ...FONT, color: enabled ? '#ffffff' : '#6b7391', align: 'center', wordWrap: { width: w - 4 } }).setOrigin(0.5).setScrollFactor(0);
  if (enabled) {
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => bg.setFillStyle(0x3b4a8c));
    bg.on('pointerout', () => bg.setFillStyle(col));
    bg.on('pointerdown', () => onClick());
  }
  if (opts.depth !== undefined) { bg.setDepth(opts.depth); t.setDepth(opts.depth + 1); }
  return { bg, t, destroy: () => { bg.destroy(); t.destroy(); } };
}

export function bar(s: Phaser.Scene, x: number, y: number, w: number, h: number, color: number) {
  const back = s.add.rectangle(x, y, w, h, 0x151a2e).setOrigin(0).setStrokeStyle(1, 0x3a415c).setScrollFactor(0);
  const fill = s.add.rectangle(x + 1, y + 1, w - 2, h - 2, color).setOrigin(0).setScrollFactor(0);
  return {
    set(ratio: number) { fill.width = Math.max(0, (w - 2) * Math.min(1, Math.max(0, ratio))); },
    destroy() { back.destroy(); fill.destroy(); },
    objs: [back, fill],
  };
}
