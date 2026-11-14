import Phaser from 'phaser';
import { W, H } from '../main';
import { game, persist } from '../state';
import { button, label } from '../ui/widgets';
import { BRANCHES, ITEMS, RECIPES, REALMS, branchMap, materialMap, recipeMap, rootMap, skillMap } from '../core/data';
import { computeStats, power } from '../core/stats';
import { atStageCap, expNeeded, gainExp, levelUpStages, runTribulation, tribulationFor, tribulationReadiness } from '../core/progression';
import { availableSkills, enterChapter, ownsSystem } from '../core/session';
import { forge } from '../core/forge';
import { brew, canBrew } from '../core/alchemy';
import { Rng } from '../core/rng';

type Tab = 'status' | 'cultivate' | 'combo' | 'bag' | 'forge' | 'alchemy' | 'shop' | 'tribulation';
interface Row { text: string; btns?: { label: string; fn: () => void; enabled?: boolean }[] }

const SLOTS_BASE = 3;

export class MenuScene extends Phaser.Scene {
  private tab: Tab = 'status';
  private objs: Phaser.GameObjects.GameObject[] = [];
  private page = 0;
  private note = '';
  private rng = new Rng();
  private tribChoices: ('dodge' | 'guard' | 'pill')[] = [];

  constructor() { super('Menu'); }

  create() {
    this.page = 0; this.note = '';
    this.render();
    this.input.keyboard!.once('keydown-ESC', () => this.close());
    this.input.keyboard!.once('keydown-M', () => this.close());
  }

  private close() { persist(); this.scene.stop(); }

  private tabs(): { id: Tab; name: string; on: boolean }[] {
    const p = game.p;
    return [
      { id: 'status', name: 'Trạng thái', on: true },
      { id: 'cultivate', name: 'Tu luyện', on: ownsSystem(p, 'tu_luyen') },
      { id: 'tribulation', name: 'Độ kiếp', on: ownsSystem(p, 'tu_luyen') && !!tribulationFor(p) },
      { id: 'combo', name: 'Chiêu/Combo', on: true },
      { id: 'bag', name: 'Kho đồ', on: true },
      { id: 'forge', name: 'Rèn đồ', on: ownsSystem(p, 'ren_do') },
      { id: 'alchemy', name: 'Luyện đan', on: ownsSystem(p, 'luyen_dan') || ownsSystem(p, 'ren_do') },
      { id: 'shop', name: 'Cửa hàng', on: ownsSystem(p, 'cua_hang') || ownsSystem(p, 'ren_do') },
    ];
  }

  private render() {
    this.objs.forEach((o) => o.destroy());
    this.objs = [];
    const add = <T extends Phaser.GameObjects.GameObject>(o: T) => { this.objs.push(o); return o; };
    add(this.add.rectangle(0, 0, W, H, 0x0b1020, 0.97).setOrigin(0).setInteractive());
    // tab bar
    let x = 6;
    for (const t of this.tabs()) {
      const b = button(this, x, 6, 70, 24, t.name, () => { this.tab = t.id; this.page = 0; this.note = ''; this.render(); }, { enabled: t.on, color: t.id === this.tab ? 0x5a6ad8 : 0x2a3566 });
      this.objs.push(b.bg, b.t);
      x += 73;
    }
    const cl = button(this, W - 40, 6, 34, 24, 'X', () => this.close(), { color: 0x6a2a2a });
    this.objs.push(cl.bg, cl.t);

    const rows = this.rows();
    const perPage = 8;
    const maxPage = Math.max(0, Math.ceil(rows.length / perPage) - 1);
    this.page = Math.min(this.page, maxPage);
    const shown = rows.slice(this.page * perPage, this.page * perPage + perPage);
    let y = 40;
    for (const r of shown) {
      add(label(this, 10, y + 4, r.text, { fontSize: '10px', wordWrap: { width: r.btns?.length ? 330 : 600 } }));
      let bx = W - 8;
      for (const bt of [...(r.btns ?? [])].reverse()) {
        const w = Math.max(52, bt.label.length * 6 + 14);
        bx -= w + 4;
        const b = button(this, bx, y, w, 24, bt.label, () => { bt.fn(); this.render(); }, { enabled: bt.enabled ?? true });
        this.objs.push(b.bg, b.t);
      }
      y += 34;
    }
    if (maxPage > 0) {
      const a = button(this, 10, H - 34, 40, 24, '◀', () => { this.page = Math.max(0, this.page - 1); this.render(); });
      const b = button(this, 56, H - 34, 40, 24, '▶', () => { this.page = Math.min(maxPage, this.page + 1); this.render(); });
      this.objs.push(a.bg, a.t, b.bg, b.t);
      add(label(this, 104, H - 28, `${this.page + 1}/${maxPage + 1}`));
    }
    if (this.note) add(label(this, W / 2, H - 28, this.note, { fontSize: '10px', color: '#ffe38a', wordWrap: { width: 420 } }).setOrigin(0.5, 0.5));
  }

  private rows(): Row[] {
    switch (this.tab) {
      case 'status': return this.rowsStatus();
      case 'cultivate': return this.rowsCultivate();
      case 'tribulation': return this.rowsTribulation();
      case 'combo': return this.rowsCombo();
      case 'bag': return this.rowsBag();
      case 'forge': return this.rowsForge();
      case 'alchemy': return this.rowsAlchemy();
      case 'shop': return this.rowsShop();
    }
  }

  private rowsStatus(): Row[] {
    const p = game.p;
    const s = computeStats(p);
    const r = REALMS[p.realmIndex];
    const root = rootMap.get(p.rootId) as any;
    const rows: Row[] = [
      { text: `${p.name} · ${r.name} tầng ${p.stage}/${r.stages} · Thọ nguyên ${r.lifespan} năm` },
      { text: `Linh căn: ${root?.name} — ${root?.desc}` },
      { text: `Nhánh tu: ${p.branchId ? branchMap.get(p.branchId)?.name : 'Chưa chọn'} · Đạo tâm ${p.daoHeart}/100 · Lực chiến ${power(s)}` },
      { text: `HP ${s.hp} · MP ${s.mp} · Công ${s.atk} · Thủ ${s.def} · Tốc ${Math.round(s.spd)} · Bạo kích ${(s.crit * 100).toFixed(0)}%` },
      { text: `Linh thạch: ${p.gold} · Chương ${p.chapter} · Thời gian chơi ${Math.round(p.playtime / 60)} phút` },
    ];
    if (ownsSystem(p, 'chon_nhanh') && !p.branchId) {
      rows.push({ text: 'Đã Trúc Cơ! Chọn nhánh tu (không thể đổi miễn phí):', btns: BRANCHES.filter((b: any) => b.playable).map((b: any) => ({ label: b.name, fn: () => { p.branchId = b.id; p.comboPresets[0] = [availableSkills(p)[0]?.id].filter(Boolean) as string[]; this.note = `Đã chọn ${b.name}.`; } })) });
    }
    rows.push({ text: 'Lưu game (tự lưu mỗi 30 giây và khi thoát menu)', btns: [{ label: 'Lưu', fn: () => { this.note = persist() ? 'Đã lưu.' : 'Không lưu được (trình duyệt chặn).'; } }] });
    return rows;
  }

  private rowsCultivate(): Row[] {
    const p = game.p;
    const need = expNeeded(p);
    const medi = () => { const g = gainExp(p, 8 + p.realmIndex * 40 + p.stage * 2); const ups = levelUpStages(p); this.note = `Tu luyện: +${g.gained} tu vi${ups ? ` · lên ${ups} tầng` : ''}.`; };
    const rows: Row[] = [
      { text: `Tu vi: ${p.exp}/${need}${atStageCap(p) ? ' (ĐẦY – hãy độ kiếp)' : ''}. Tàn Căn thu nạp linh khí chậm, hãy dùng đan dược.` },
      { text: 'Ngồi thiền hấp thụ linh khí', btns: [{ label: 'Tu luyện', fn: medi, enabled: !atStageCap(p) }, { label: 'x10', fn: () => { for (let i = 0; i < 10; i++) if (!atStageCap(p)) medi(); }, enabled: !atStageCap(p) }] },
    ];
    for (const r of RECIPES) {
      const n = p.inventory[r.id] ?? 0;
      if (r.effect.exp && n > 0) rows.push({ text: `${r.name} ×${n} (+${r.effect.exp} tu vi)`, btns: [{ label: 'Dùng', fn: () => { p.inventory[r.id]--; const g = gainExp(p, r.effect.exp); levelUpStages(p); this.note = `+${g.gained} tu vi.`; }, enabled: !atStageCap(p) }] });
    }
    return rows;
  }

  private rowsTribulation(): Row[] {
    const p = game.p;
    const t = tribulationFor(p)!;
    const rd = tribulationReadiness(p);
    const rows: Row[] = [
      { text: `${t.name}: ${t.waves} đợt sét, lực ${t.boltPower}+. Lực chiến đề xuất ${t.recommendedPower} (hiện ${power(computeStats(p))}).` },
      { text: rd.ready ? 'Khí tức đã ổn định. Chọn cách ứng phó cho từng đợt (mặc định: Đỡ):' : (rd.reason ?? '') },
    ];
    if (!rd.ready) return rows;
    for (let i = 0; i < t.waves; i++) {
      const c = this.tribChoices[i] ?? 'guard';
      const names = { dodge: 'Né', guard: 'Đỡ', pill: 'Uống đan' };
      rows.push({ text: `Đợt ${i + 1}: ${names[c]}`, btns: (['dodge', 'guard', 'pill'] as const).map((k) => ({ label: names[k], fn: () => { this.tribChoices[i] = k; } })) });
    }
    const hasPill = (p.inventory.truc_co_dan ?? 0) > 0;
    rows.push({ text: `Pháp bảo/đan hộ kiếp: Trúc Cơ Đan ×${p.inventory.truc_co_dan ?? 0} (giảm 15% sát thương)`, btns: [{ label: 'ĐỘ KIẾP!', fn: () => this.doTribulation(hasPill) }] });
    return rows;
  }

  private doTribulation(usePill: boolean) {
    const p = game.p;
    let shield = 0;
    if (usePill) { p.inventory.truc_co_dan--; shield = 0.15; }
    const r = runTribulation(p, { choices: this.tribChoices, shield }, this.rng);
    this.tribChoices = [];
    if (r.success) {
      const r2 = REALMS[p.realmIndex];
      const unlocked = r2.unlocks.filter((u) => !ownsSystem(p, u));
      p.unlockedSystems.push(...unlocked);
      if (p.realmIndex === 1) enterChapter(p, 4);
      if (p.realmIndex === 2) enterChapter(p, 6);
      this.note = `ĐỘ KIẾP THÀNH CÔNG! Bước vào ${r2.name}. Mở khóa: ${unlocked.join(', ') || '—'}.`;
    } else this.note = r.reason ?? 'Thất bại.';
    this.tab = 'status';
    persist();
  }

  private slots() { return SLOTS_BASE + game.p.realmIndex * 2; }

  private rowsCombo(): Row[] {
    const p = game.p;
    const sk = availableSkills(p);
    const cur = p.comboPresets[p.activeCombo] ?? [];
    const rows: Row[] = [
      { text: `Combo ${p.activeCombo + 1}: ${cur.map((id) => skillMap.get(id)?.name).join(' → ') || '(trống)'}  [${cur.length}/${this.slots()} ô]`, btns: [{ label: 'Xóa', fn: () => { p.comboPresets[p.activeCombo] = []; } }, { label: `Đổi (${p.activeCombo + 1}/3)`, fn: () => { p.activeCombo = (p.activeCombo + 1) % 3; } }] },
      { text: 'Mẹo: chiêu "gieo" trạng thái (Phá Giáp, Bỏng…) trước, rồi chiêu "cộng hưởng" sau để nhân sát thương.' },
    ];
    for (const s of sk) {
      const tag = [s.gives ? `gieo ${s.gives}` : '', s.requires ? `cần ${s.requires} → x${s.bonus}` : ''].filter(Boolean).join(' · ');
      rows.push({ text: `${s.name} [${s.element}] công x${s.power} · MP ${s.mp} · trễ ${s.cost}${s.hits ? ` · ${s.hits} đòn` : ''} ${tag}`, btns: [{ label: '+Combo', fn: () => { if (cur.length < this.slots()) { p.comboPresets[p.activeCombo] = [...cur, s.id]; } else this.note = 'Hết ô combo. Lên cảnh giới để có thêm ô.'; } }] });
    }
    return rows;
  }

  private rowsBag(): Row[] {
    const p = game.p;
    const rows: Row[] = [];
    for (const [id, n] of Object.entries(p.inventory)) if (n > 0) rows.push({ text: `${(materialMap.get(id) as any)?.name ?? recipeMap.get(id)?.name ?? id} ×${n}` });
    rows.push({ text: '— Trang bị —' });
    for (const g of p.gear) {
      const on = p.equipped[g.slot] === g.uid;
      const st = Object.entries(g.stats).map(([k, v]) => `${k}+${Math.round((v as number) * 100) / 100}`).join(' ');
      rows.push({ text: `[${ITEMS.rarities.find((r: any) => r.id === g.rarity)?.name}] ${g.name}  ${st}${on ? '  (đang mặc)' : ''}`, btns: [{ label: on ? 'Cởi' : 'Mặc', fn: () => { p.equipped[g.slot] = on ? null : g.uid; } }] });
    }
    if (!p.gear.length) rows.push({ text: '(chưa có trang bị – mở Rèn đồ ở Chương 4)' });
    if (ownsSystem(p, 'thoi_trang') || ownsSystem(p, 'cua_hang')) {
      rows.push({ text: '— Thời trang (chỉ đổi ngoại hình) —' });
      for (const f of ITEMS.fashion) if (p.fashion.owned.includes(f.id)) {
        const on = p.fashion.worn[f.slot] === f.id;
        rows.push({ text: `${f.name}${on ? ' (đang mặc)' : ''}`, btns: [{ label: on ? 'Cởi' : 'Mặc', fn: () => { p.fashion.worn[f.slot] = on ? null : f.id; } }] });
      }
    }
    return rows;
  }

  private rowsForge(): Row[] {
    const p = game.p;
    const rows: Row[] = [{ text: `Huyền Thiết ×${p.inventory.huyen_thiet ?? 0}. Mỗi lần rèn ra chỉ số khác nhau (dòng phụ ngẫu nhiên). Nhánh của bạn: ${p.branchId ? branchMap.get(p.branchId)?.name : 'chưa chọn'}.` }];
    for (const b of ITEMS.bases as any[]) {
      if (p.branchId && b.branch !== p.branchId) continue;
      const have = p.inventory.huyen_thiet ?? 0;
      rows.push({ text: `${b.name} [${b.slot}] cần ${b.ore} Huyền Thiết · ${Object.entries(b.base).map(([k, v]) => `${k}${v}`).join(' ')}`, btns: [{ label: 'Rèn', enabled: have >= b.ore, fn: () => {
        p.inventory.huyen_thiet -= b.ore;
        // mini-game búa sẽ thay cho số ngẫu nhiên này (xem GDD §8)
        const item = forge({ baseId: b.id, materialQuality: 0.55 + this.rng.range(0, 0.3), skillScore: this.rng.range(0.4, 1), smithLevel: p.realmIndex * 3 + p.stage / 3 }, this.rng);
        p.gear.push(item);
        this.note = `Rèn ra: [${ITEMS.rarities.find((r: any) => r.id === item.rarity)?.name}] ${item.name} — ${item.affixes.map((a) => `${a.stat}+${a.value}`).join(', ') || 'không dòng phụ'}`;
      } }] });
    }
    return rows;
  }

  private rowsAlchemy(): Row[] {
    const p = game.p;
    const rows: Row[] = [{ text: 'Luyện đan: chất lượng phụ thuộc hỏa hầu (mini-game sẽ thay số ngẫu nhiên này).' }];
    for (const r of RECIPES) {
      const known = p.knownRecipes.includes(r.id);
      const ing = r.ingredients.map((i: any) => `${(materialMap.get(i.id) as any)?.name} ${p.inventory[i.id] ?? 0}/${i.n}`).join(', ');
      rows.push({ text: `${r.name}${known ? '' : ' (chưa biết phương)'} — ${ing}`, btns: [
        { label: 'Luyện', enabled: canBrew(p, r.id).ok, fn: () => { const res = brew(p, r.id, this.rng.range(0.45, 1), this.rng); this.note = res.ok ? `Thành công: ${r.name} phẩm ${res.grade}, ${res.pillLines} đan văn, giá ~${res.price} LT.` : (res.reason ?? ''); } },
      ] });
    }
    if (p.knownRecipes.length < 3) rows.push({ text: 'Học thêm đan phương qua nhiệm vụ phụ và cửa hàng.', btns: [{ label: 'Mua phương Hồi Linh (60)', enabled: p.gold >= 60 && !p.knownRecipes.includes('hoi_linh_dan'), fn: () => { p.gold -= 60; p.knownRecipes.push('hoi_linh_dan'); } }] });
    return rows;
  }

  private rowsShop(): Row[] {
    const p = game.p;
    const rows: Row[] = [{ text: `Linh thạch: ${p.gold}   (tiền nạp: ${p.premium} – chỉ dùng cho thời trang, sắp ra mắt)` }];
    for (const m of [{ id: 'linh_thao', price: 10 }, { id: 'huyen_thiet', price: 30 }, { id: 'huyet_tham', price: 50 }]) {
      rows.push({ text: `Mua ${(materialMap.get(m.id) as any).name} — ${m.price} LT`, btns: [{ label: 'Mua', enabled: p.gold >= m.price, fn: () => { p.gold -= m.price; p.inventory[m.id] = (p.inventory[m.id] ?? 0) + 1; } }] });
    }
    for (const f of ITEMS.fashion as any[]) {
      const own = p.fashion.owned.includes(f.id);
      const prem = f.currency === 'tien_nap';
      rows.push({ text: `Thời trang: ${f.name} — ${f.price} ${prem ? 'xu (chưa mở)' : 'LT'}${own ? ' · đã có' : ''}`, btns: [{ label: own ? 'Đã có' : 'Mua', enabled: !own && !prem && p.gold >= f.price, fn: () => { p.gold -= f.price; p.fashion.owned.push(f.id); } }] });
    }
    // bán: giá = 50%
    for (const [id, n] of Object.entries(p.inventory)) {
      const price = (materialMap.get(id) as any)?.price ?? 0;
      const rp = recipeMap.get(id)?.basePrice;
      const v = Math.floor((price || rp || 0) * 0.5);
      if (n > 0 && v > 0 && id !== 'hoi_huyet_dan') rows.push({ text: `Bán ${(materialMap.get(id) as any)?.name ?? recipeMap.get(id)?.name} ×${n} (${v}/cái)`, btns: [{ label: 'Bán 1', fn: () => { p.inventory[id]--; p.gold += v; } }] });
    }
    return rows;
  }
}
