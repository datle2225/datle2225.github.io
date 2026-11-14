import Phaser from 'phaser';
import { W, H } from '../main';
import { button, label } from './widgets';

export interface Row { text: string; sub?: string; btns?: { label: string; fn: () => void; enabled?: boolean; color?: number }[] }
export interface TabDef { id: string; name: string; on: boolean }

/** Khung danh sách có thẻ (tab), phân trang và dòng ghi chú; dùng cho Menu và Cửa hàng NPC. */
export class ListPanel {
  tab: string;
  page = 0;
  note = '';
  private objs: Phaser.GameObjects.GameObject[] = [];

  constructor(
    private scene: Phaser.Scene,
    private cfg: { tabs: () => TabDef[]; rows: (tab: string) => Row[]; onClose: () => void; header?: () => string; perPage?: number },
  ) {
    this.tab = cfg.tabs().find((t) => t.on)?.id ?? 'x';
  }

  setTab(id: string) { this.tab = id; this.page = 0; this.note = ''; this.render(); }

  destroy() { this.objs.forEach((o) => o.destroy()); this.objs = []; }

  render() {
    this.destroy();
    const s = this.scene;
    const keep = <T extends Phaser.GameObjects.GameObject>(o: T) => { this.objs.push(o); return o; };
    keep(s.add.rectangle(0, 0, W, H, 0x0b1020, 0.97).setOrigin(0).setInteractive());
    const tabs = this.cfg.tabs();
    const tw = Math.min(86, Math.floor((W - 56) / tabs.length) - 3);
    tabs.forEach((t, i) => {
      const b = button(s, 6 + i * (tw + 3), 6, tw, 24, t.name, () => this.setTab(t.id), { enabled: t.on, color: t.id === this.tab ? 0x5a6ad8 : 0x2a3566 });
      this.objs.push(b.bg, b.t);
    });
    const cl = button(s, W - 40, 6, 34, 24, 'X', () => this.cfg.onClose(), { color: 0x6a2a2a });
    this.objs.push(cl.bg, cl.t);
    let top = 38;
    if (this.cfg.header) { keep(label(s, 10, top, this.cfg.header(), { fontSize: '10px', color: '#ffe38a', wordWrap: { width: 620 } })); top += 16; }

    const rows = this.cfg.rows(this.tab);
    const per = this.cfg.perPage ?? 7;
    const maxPage = Math.max(0, Math.ceil(rows.length / per) - 1);
    this.page = Math.min(this.page, maxPage);
    let y = top + 2;
    for (const r of rows.slice(this.page * per, this.page * per + per)) {
      keep(label(s, 10, y + (r.sub ? 0 : 5), r.text, { fontSize: '10px', wordWrap: { width: r.btns?.length ? 340 : 620 } }));
      if (r.sub) keep(label(s, 10, y + 13, r.sub, { fontSize: '9px', color: '#8f9bd0', wordWrap: { width: 340 } }));
      let bx = W - 8;
      for (const bt of [...(r.btns ?? [])].reverse()) {
        const w = Math.max(50, bt.label.length * 6 + 14);
        bx -= w + 4;
        const b = button(s, bx, y, w, 26, bt.label, () => { bt.fn(); this.render(); }, { enabled: bt.enabled ?? true, color: bt.color });
        this.objs.push(b.bg, b.t);
      }
      y += 36;
    }
    if (maxPage > 0) {
      const a = button(s, 10, H - 34, 40, 24, '◀', () => { this.page = Math.max(0, this.page - 1); this.render(); });
      const b = button(s, 56, H - 34, 40, 24, '▶', () => { this.page = Math.min(maxPage, this.page + 1); this.render(); });
      this.objs.push(a.bg, a.t, b.bg, b.t);
      keep(label(s, 104, H - 28, `${this.page + 1}/${maxPage + 1}`));
    }
    if (this.note) keep(label(s, W / 2 + 40, H - 22, this.note, { fontSize: '10px', color: '#ffe38a', wordWrap: { width: 460 }, align: 'center' }).setOrigin(0.5));
  }
}
