import Phaser from 'phaser';
import { game, persist } from '../state';
import { ListPanel, type Row } from '../ui/ListPanel';
import { fmtAffixes, fmtItem } from '../ui/format';
import { ITEMS, materialMap, recipeMap, vendorMap } from '../core/data';
import { Rng } from '../core/rng';
import { forge } from '../core/forge';
import { brew, canBrew } from '../core/alchemy';
import {
  buyFashion, buyMaterial, buyPill, buyReadyItem, commissionBrew, commissionForge, ensureStock, itemValue, npcRecipes, pillBasePrice,
  buyPrice, quoteBrew, quoteForge, readyItemPrice, sellGear, sellItem, sellValue, type Result, type Tier,
} from '../core/services';
import { ownsSystem } from '../core/session';
import { audio } from '../audio';

const FORGE_FEE_PER_ORE = 5;

/** Cửa hàng của NPC: mua đồ/nguyên liệu, bán lại, thuê NPC rèn/luyện, hoặc tự làm với mini-game. */
export class ShopScene extends Phaser.Scene {
  private vendorId = 'tap_hoa';
  private panel!: ListPanel;
  private rng = new Rng();

  constructor() { super('Shop'); }

  init(d: { vendor: string; tab?: string }) { this.vendorId = d.vendor; this.initTab = d.tab; }
  private initTab?: string;

  create() {
    const v = vendorMap.get(this.vendorId) as any;
    ensureStock(game.p, this.vendorId);
    this.panel = new ListPanel(this, {
      tabs: () => [
        { id: 'buy', name: 'Mua', on: true },
        { id: 'sell', name: 'Bán', on: true },
        { id: 'hire', name: v.type === 'smith' ? 'Thuê rèn' : 'Thuê luyện', on: v.type !== 'general' },
        { id: 'craft', name: v.type === 'smith' ? 'Tự rèn' : 'Tự luyện', on: v.type !== 'general' },
      ],
      header: () => `${v.name} · ${v.title}   |   Linh thạch: ${game.p.gold}   |   Quan hệ: ${game.p.relations[this.vendorId] ?? 0}/100`,
      rows: (tab) => this.rows(tab),
      onClose: () => this.close(),
      perPage: 6,
    });
    if (this.initTab) this.panel.tab = this.initTab;
    this.panel.note = `"${v.greeting}"`;
    this.panel.render();
    this.input.keyboard!.once('keydown-ESC', () => this.close());
  }

  private close() { persist(); this.scene.stop(); this.scene.resume('Overworld'); }

  private say(r: Result | { ok: boolean; msg: string }) {
    this.panel.note = r.msg;
    audio.sfx(r.ok ? 'coin' : 'fail');
  }

  private rows(tab: string): Row[] {
    if (tab === 'buy') return this.rowsBuy();
    if (tab === 'sell') return this.rowsSell();
    if (tab === 'hire') return this.rowsHire();
    return this.rowsCraft();
  }

  private rowsBuy(): Row[] {
    const p = game.p;
    const v = vendorMap.get(this.vendorId) as any;
    const st = ensureStock(p, this.vendorId);
    const rows: Row[] = [];
    for (const m of v.sells as any[]) {
      const price = buyPrice(p, this.vendorId, m.price);
      const left = st.stock[m.id] ?? 0;
      rows.push({ text: `${(materialMap.get(m.id) as any).name} — ${price} LT (còn ${left})`, btns: [{ label: 'Mua', enabled: left > 0 && p.gold >= price, fn: () => this.say(buyMaterial(p, this.vendorId, m.id)) }] });
    }
    for (const id of (v.readyPills ?? []) as string[]) {
      const price = buyPrice(p, this.vendorId, Math.round(pillBasePrice(id) * 1.3));
      const left = st.stock[id] ?? 0;
      rows.push({ text: `${recipeMap.get(id)?.name} (đan có sẵn) — ${price} LT (còn ${left})`, btns: [{ label: 'Mua', enabled: left > 0 && p.gold >= price, fn: () => this.say(buyPill(p, this.vendorId, id)) }] });
    }
    for (const it of st.items) {
      const price = readyItemPrice(p, this.vendorId, it);
      rows.push({ text: fmtItem(it), sub: `${fmtAffixes(it)} — ${price} LT`, btns: [{ label: `Mua ${price}`, enabled: p.gold >= price, fn: () => this.say(buyReadyItem(p, this.vendorId, it.uid)) }] });
    }
    for (const fid of (v.fashion ?? []) as string[]) {
      const f = (ITEMS.fashion as any[]).find((x) => x.id === fid);
      if (!f) continue;
      const own = p.fashion.owned.includes(fid);
      const price = buyPrice(p, this.vendorId, f.price);
      rows.push({ text: `Thời trang: ${f.name} — ${price} LT${own ? ' (đã có)' : ''}`, sub: 'Chỉ thay đổi ngoại hình, không có chỉ số.', btns: [{ label: own ? 'Đã có' : 'Mua', enabled: !own && p.gold >= price, fn: () => this.say(buyFashion(p, this.vendorId, fid)) }] });
    }
    if (!rows.length) rows.push({ text: 'Hôm nay hết hàng.' });
    return rows;
  }

  private rowsSell(): Row[] {
    const p = game.p;
    const rows: Row[] = [];
    for (const [id, n] of Object.entries(p.inventory)) {
      const val = sellValue(id);
      if (n > 0 && val > 0 && id !== 'huyet_anh_lenh') {
        rows.push({ text: `${(materialMap.get(id) as any)?.name ?? recipeMap.get(id)?.name} ×${n} — ${val} LT/cái`, btns: [{ label: 'Bán 1', fn: () => this.say(sellItem(p, id, 1)) }, { label: 'Bán hết', fn: () => this.say(sellItem(p, id, n)) }] });
      }
    }
    for (const g of p.gear) {
      const val = Math.floor(itemValue(g) * 0.5);
      rows.push({ text: fmtItem(g) + (p.equipped[g.slot] === g.uid ? '  (đang mặc)' : ''), sub: `${fmtAffixes(g)} — ${val} LT`, btns: [{ label: `Bán ${val}`, fn: () => this.say(sellGear(p, g.uid)) }] });
    }
    if (!rows.length) rows.push({ text: 'Bạn không có gì để bán.' });
    return rows;
  }

  private tierBtns(quote: (t: Tier) => { ok: boolean; total: number }, act: (t: Tier) => void) {
    return (['normal', 'fine'] as Tier[]).map((t) => {
      const q = quote(t);
      return { label: `${t === 'normal' ? 'Thường' : 'Tinh phẩm'} ${q.total}`, enabled: q.ok, fn: () => act(t), color: t === 'fine' ? 0x6a3a8c : undefined };
    });
  }

  private rowsHire(): Row[] {
    const p = game.p;
    const v = vendorMap.get(this.vendorId) as any;
    const rows: Row[] = [{ text: `Thuê ${v.name} làm giúp: tay nghề ${v.skill}/10. Tự đem nguyên liệu thì rẻ hơn; "Tinh phẩm" dùng nguyên liệu tốt hơn và tay nghề cẩn thận hơn.` }];
    if (v.type === 'smith') {
      for (const b of ITEMS.bases as any[]) {
        if (p.branchId && b.branch !== p.branchId) continue;
        const q = quoteForge(p, this.vendorId, b.id, 'normal');
        rows.push({
          text: `${b.name} [${b.slot}] ${Object.entries(b.base).map(([k, val]) => `${k}${val}`).join(' ')}`,
          sub: `Công ${q.labor} + nguyên liệu thiếu ${q.materialCost} (cần ${b.ore} Huyền Thiết, bạn có ${p.inventory.huyen_thiet ?? 0})`,
          btns: this.tierBtns((t) => quoteForge(p, this.vendorId, b.id, t), (t) => {
            const r = commissionForge(p, this.vendorId, b.id, t, this.rng);
            this.say({ ok: r.ok, msg: r.ok && r.item ? `${r.msg} Nhận: ${fmtItem(r.item)}` : r.msg });
          }),
        });
      }
    } else {
      for (const r of npcRecipes(this.vendorId)) {
        const q = quoteBrew(p, this.vendorId, r.id, 'normal');
        const known = p.knownRecipes.includes(r.id);
        rows.push({
          text: `${r.name}${known ? '' : ' (bạn chưa biết phương)'}`,
          sub: `Công ${q.labor} + nguyên liệu thiếu ${q.materialCost} — ${r.ingredients.map((i: any) => `${(materialMap.get(i.id) as any)?.name} ${p.inventory[i.id] ?? 0}/${i.n}`).join(', ')}`,
          btns: this.tierBtns((t) => quoteBrew(p, this.vendorId, r.id, t), (t) => {
            const res = commissionBrew(p, this.vendorId, r.id, t, this.rng);
            this.say(res);
          }),
        });
      }
    }
    return rows;
  }

  private rowsCraft(): Row[] {
    const p = game.p;
    const v = vendorMap.get(this.vendorId) as any;
    if (!ownsSystem(p, 'ren_do')) return [{ text: 'Chưa mở khóa tự làm. Hãy độ kiếp lên Trúc Cơ (Chương 4) để mượn lò của NPC.' }, { text: 'Trong lúc đó, bạn vẫn thuê NPC làm giúp ở thẻ "Thuê".' }];
    const rows: Row[] = [{ text: v.type === 'smith' ? `Mượn lò rèn (phí ${FORGE_FEE_PER_ORE} LT/Huyền Thiết). Mini-game búa: bấm đúng nhịp để rèn món tốt hơn.` : 'Mượn lò đan. Mini-game hỏa hầu: giữ nhiệt trong vùng xanh. Chỉ luyện được phương bạn đã học.' }];
    if (v.type === 'smith') {
      for (const b of ITEMS.bases as any[]) {
        if (p.branchId && b.branch !== p.branchId) continue;
        const fee = b.ore * FORGE_FEE_PER_ORE;
        const ok = (p.inventory.huyen_thiet ?? 0) >= b.ore && p.gold >= fee;
        rows.push({ text: `${b.name} — cần ${b.ore} Huyền Thiết + ${fee} LT`, sub: `Bạn có ${p.inventory.huyen_thiet ?? 0} Huyền Thiết`, btns: [{ label: 'Tự rèn', enabled: ok, fn: () => this.selfForge(b) }] });
      }
    } else {
      for (const r of (npcRecipes(this.vendorId) as any[]).filter((x) => p.knownRecipes.includes(x.id))) {
        const chk = canBrew(p, r.id);
        rows.push({ text: `${r.name} — độ khó ${r.difficulty}`, sub: chk.ok ? 'Đủ nguyên liệu.' : (chk.reason ?? ''), btns: [{ label: 'Tự luyện', enabled: chk.ok, fn: () => this.selfBrew(r) }] });
      }
      if (rows.length === 1) rows.push({ text: 'Bạn chưa học đan phương nào. Nhận từ nhiệm vụ hoặc đan sư.' });
    }
    return rows;
  }

  private selfForge(b: any) {
    const p = game.p;
    const level = p.realmIndex * 3 + p.stage / 3;
    this.launchMini({ mode: 'forge', param: { zone: 0.3, level } }, (score) => {
      p.inventory.huyen_thiet -= b.ore;
      p.gold -= b.ore * FORGE_FEE_PER_ORE;
      const item = forge({ baseId: b.id, materialQuality: 0.55 + this.rng.range(0, 0.15), skillScore: score, smithLevel: level }, this.rng);
      p.gear.push(item);
      this.say({ ok: true, msg: `Rèn xong: ${fmtItem(item)}` });
    });
  }

  private selfBrew(r: any) {
    this.launchMini({ mode: 'alchemy', param: { difficulty: r.difficulty } }, (score) => {
      const res = brew(game.p, r.id, score, this.rng);
      this.say({ ok: res.ok, msg: res.ok ? `Luyện xong ${r.name} phẩm ${res.grade}, ${res.pillLines} đan văn (~${res.price} LT).` : (res.reason ?? '') });
    });
  }

  private launchMini(data: { mode: 'forge' | 'alchemy'; param: any }, done: (score: number) => void) {
    this.scene.pause();
    this.scene.launch('MiniGame', { ...data, parent: 'Shop', onDone: (s: number) => { done(s); this.panel.render(); } });
  }
}
