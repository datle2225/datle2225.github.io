import Phaser from 'phaser';
import { game, persist } from '../state';
import { ListPanel, type Row } from '../ui/ListPanel';
import { fmtAffixes, fmtItem } from '../ui/format';
import { BRANCHES, RECIPES, REALMS, branchMap, companionMap, materialMap, questMap, recipeMap, rootMap, skillMap } from '../core/data';
import { computeStats, power } from '../core/stats';
import { atStageCap, expNeeded, gainExp, levelUpStages, tribulationFor, tribulationReadiness } from '../core/progression';
import { availableSkills, ownsSystem } from '../core/session';
import { audio } from '../audio';
import { getSettings, setSettings } from '../settings';
import { exportSave, importSave, writeSave } from '../core/save';

const SLOTS_BASE = 3;

/** Menu chính: trạng thái, tu luyện, độ kiếp, combo, kho đồ, nhật ký (Huyết Thư), cài đặt. */
export class MenuScene extends Phaser.Scene {
  private panel!: ListPanel;
  private useShieldPill = false;

  constructor() { super('Menu'); }

  create() {
    this.panel = new ListPanel(this, {
      tabs: () => {
        const p = game.p;
        return [
          { id: 'status', name: 'Trạng thái', on: true },
          { id: 'cultivate', name: 'Tu luyện', on: ownsSystem(p, 'tu_luyen') },
          { id: 'tribulation', name: 'Độ kiếp', on: ownsSystem(p, 'tu_luyen') && !!tribulationFor(p) },
          { id: 'combo', name: 'Chiêu/Combo', on: true },
          { id: 'bag', name: 'Kho đồ', on: true },
          { id: 'journal', name: 'Huyết Thư', on: true },
          { id: 'settings', name: 'Cài đặt', on: true },
        ];
      },
      rows: (t) => this.rows(t),
      onClose: () => this.close(),
      perPage: 7,
    });
    this.panel.render();
    this.input.keyboard!.once('keydown-ESC', () => this.close());
    this.input.keyboard!.once('keydown-M', () => this.close());
    this.events.on('trib-done', () => { this.panel.setTab('status'); });
  }

  private close() { persist(); this.scene.stop(); }

  private rows(tab: string): Row[] {
    switch (tab) {
      case 'status': return this.rowsStatus();
      case 'cultivate': return this.rowsCultivate();
      case 'tribulation': return this.rowsTribulation();
      case 'combo': return this.rowsCombo();
      case 'bag': return this.rowsBag();
      case 'journal': return this.rowsJournal();
      default: return this.rowsSettings();
    }
  }

  private note(t: string) { this.panel.note = t; }

  private rowsStatus(): Row[] {
    const p = game.p;
    const s = computeStats(p);
    const r = REALMS[p.realmIndex];
    const root = rootMap.get(p.rootId) as any;
    const rows: Row[] = [
      { text: `${p.name} · ${r.name} tầng ${p.stage}/${r.stages} · Thọ nguyên ${r.lifespan} năm` },
      { text: `Linh căn: ${root?.name}`, sub: root?.desc },
      { text: `Nhánh tu: ${p.branchId ? branchMap.get(p.branchId)?.name : 'Chưa chọn'} · Đạo tâm ${p.daoHeart}/100 · Lực chiến ${power(s)}` },
      { text: `HP ${s.hp} · MP ${s.mp} · Công ${s.atk} · Thủ ${s.def} · Tốc ${Math.round(s.spd)} · Bạo ${(s.crit * 100).toFixed(0)}%` },
      { text: `Linh thạch ${p.gold} · Chương ${p.chapter} · Chơi ${Math.round(p.playtime / 60)} phút` },
    ];
    if (ownsSystem(p, 'chon_nhanh') && !p.branchId) {
      rows.push({ text: 'Đã Trúc Cơ! Hãy chọn nhánh tu (không đổi được miễn phí):' });
      for (const b of BRANCHES.filter((x: any) => x.playable)) {
        rows.push({ text: `${b.name} — ${b.role}`, sub: b.desc, btns: [{ label: 'Chọn', fn: () => { p.branchId = b.id; p.comboPresets[0] = [availableSkills(p)[0]?.id].filter(Boolean) as string[]; this.note(`Đã chọn ${b.name}.`); } }] });
      }
    }
    rows.push({ text: 'Lưu game (tự lưu mỗi 30 giây và khi thoát menu)', btns: [{ label: 'Lưu', fn: () => this.note(persist() ? 'Đã lưu.' : 'Không lưu được (trình duyệt chặn).') }] });
    return rows;
  }

  private rowsCultivate(): Row[] {
    const p = game.p;
    const medi = () => { const g = gainExp(p, 8 + p.realmIndex * 40 + p.stage * 2); const ups = levelUpStages(p); this.note(`Tu luyện: +${g.gained} tu vi${ups ? ` · lên ${ups} tầng` : ''}.`); if (ups) audio.sfx('levelup'); };
    const rows: Row[] = [
      { text: `Tu vi: ${p.exp}/${expNeeded(p)}${atStageCap(p) ? ' (ĐẦY – hãy độ kiếp)' : ''}. Tàn Căn thu nạp linh khí rất chậm, hãy dùng đan dược.` },
      { text: 'Ngồi thiền hấp thụ linh khí', btns: [{ label: 'Tu luyện', fn: medi, enabled: !atStageCap(p) }, { label: 'x10', fn: () => { for (let i = 0; i < 10; i++) if (!atStageCap(p)) medi(); }, enabled: !atStageCap(p) }] },
    ];
    for (const r of RECIPES) {
      const n = p.inventory[r.id] ?? 0;
      if (n <= 0) continue;
      if (r.effect.exp) rows.push({ text: `${r.name} ×${n} (+${r.effect.exp} tu vi)`, btns: [{ label: 'Dùng', enabled: !atStageCap(p), fn: () => { p.inventory[r.id]--; const g = gainExp(p, r.effect.exp); levelUpStages(p); this.note(`+${g.gained} tu vi.`); } }] });
      if (r.effect.dao) rows.push({ text: `${r.name} ×${n} (+${r.effect.dao} đạo tâm)`, btns: [{ label: 'Dùng', enabled: p.daoHeart < 100, fn: () => { p.inventory[r.id]--; p.daoHeart = Math.min(100, p.daoHeart + r.effect.dao); this.note('Tâm cảnh bình ổn hơn.'); } }] });
    }
    return rows;
  }

  private rowsTribulation(): Row[] {
    const p = game.p;
    const t = tribulationFor(p)!;
    const rd = tribulationReadiness(p);
    const rows: Row[] = [
      { text: `${t.name}: ${t.waves} đợt sét, lực ${t.boltPower}+. Lực chiến đề xuất ${t.recommendedPower} (hiện ${power(computeStats(p))}).` },
      { text: rd.ready ? 'Khí tức đã ổn định. Bạn sẽ chọn Né / Đỡ / Uống đan cho từng đợt sét.' : (rd.reason ?? '') },
    ];
    if (!rd.ready) return rows;
    const has = (p.inventory.truc_co_dan ?? 0) > 0;
    rows.push({ text: `Đan hộ kiếp: Trúc Cơ Đan ×${p.inventory.truc_co_dan ?? 0} (giảm 15% sát thương)`, btns: [{ label: this.useShieldPill ? 'Sẽ dùng ✓' : 'Dùng đan', enabled: has, fn: () => { this.useShieldPill = !this.useShieldPill; } }] });
    rows.push({ text: 'Mang theo Hồi Huyết Đan để uống giữa các đợt sét.', btns: [{
      label: 'ĐỘ KIẾP!', color: 0x8c3a3a, fn: () => {
        let shield = 0;
        if (this.useShieldPill && has) { p.inventory.truc_co_dan--; shield = 0.15; }
        this.useShieldPill = false;
        this.scene.pause();
        this.scene.launch('Tribulation', { shield, usedPill: shield > 0 });
      },
    }] });
    return rows;
  }

  private slots() { return SLOTS_BASE + game.p.realmIndex * 2; }

  private rowsCombo(): Row[] {
    const p = game.p;
    const cur = p.comboPresets[p.activeCombo] ?? [];
    const rows: Row[] = [
      { text: `Combo ${p.activeCombo + 1}: ${cur.map((id) => skillMap.get(id)?.name).join(' → ') || '(trống)'}  [${cur.length}/${this.slots()} ô]`, btns: [{ label: 'Xóa', fn: () => { p.comboPresets[p.activeCombo] = []; } }, { label: `Đổi (${p.activeCombo + 1}/3)`, fn: () => { p.activeCombo = (p.activeCombo + 1) % 3; } }] },
      { text: 'Mẹo: chiêu "gieo" trạng thái (Phá Giáp, Bỏng…) trước, rồi chiêu "cộng hưởng" sau để nhân sát thương.' },
    ];
    for (const s of availableSkills(p)) {
      const tag = [s.gives ? `gieo ${s.gives}` : '', s.requires ? `cần ${s.requires} → x${s.bonus}` : ''].filter(Boolean).join(' · ');
      rows.push({ text: `${s.name} [${s.element}] công x${s.power} · MP ${s.mp} · trễ ${s.cost}${s.hits ? ` · ${s.hits} đòn` : ''}`, sub: tag || s.desc, btns: [{ label: '+Combo', fn: () => { if (cur.length < this.slots()) p.comboPresets[p.activeCombo] = [...cur, s.id]; else this.note('Hết ô combo. Lên cảnh giới để có thêm ô.'); } }] });
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
      rows.push({ text: fmtItem(g) + (on ? '  (đang mặc)' : ''), sub: fmtAffixes(g), btns: [{ label: on ? 'Cởi' : 'Mặc', fn: () => { p.equipped[g.slot] = on ? null : g.uid; } }] });
    }
    if (!p.gear.length) rows.push({ text: '(chưa có trang bị – mua ở Lò Rèn hoặc thuê Lão Thiết rèn)' });
    if (p.fashion.owned.length) {
      rows.push({ text: '— Thời trang (chỉ đổi ngoại hình) —' });
      for (const fid of p.fashion.owned) {
        const on = Object.values(p.fashion.worn).includes(fid);
        rows.push({ text: `${fid}${on ? ' (đang mặc)' : ''}`, btns: [{ label: on ? 'Cởi' : 'Mặc', fn: () => { p.fashion.worn.outfit = on ? null : fid; } }] });
      }
    }
    return rows;
  }

  private rowsJournal(): Row[] {
    const p = game.p;
    const rows: Row[] = [{ text: `Danh vọng — Chính đạo ${p.rep.chinh_dao} · Ma đạo ${p.rep.ma_dao} · Tán tu ${p.rep.tan_tu} · Đạo tâm ${p.daoHeart}` }];
    rows.push({ text: p.party.length ? `Đồng hành: ${p.party.map((id) => companionMap.get(id)?.name).join(', ')}` : 'Đồng hành: (chưa có)' });
    const rel = Object.entries(p.relations).filter(([, v]) => v > 0).map(([k, v]) => `${k} ${v}`).join(' · ');
    rows.push({ text: `Quan hệ: ${rel || '(chưa ai)'}` });
    rows.push({ text: '— Nhiệm vụ đang làm —' });
    for (const id of p.quests.active) { const q = questMap.get(id) as any; if (q) rows.push({ text: `${q.type === 'main' ? '★' : '·'} ${q.title}`, sub: q.desc }); }
    rows.push({ text: `— Đã hoàn thành: ${p.quests.done.length} —` });
    const choices = Object.keys(p.flags).filter((k) => ['wolf_spared', 'wolf_killed', 'swore_to_gate', 'nguyet_secret'].includes(k));
    if (choices.length) rows.push({ text: `Lựa chọn đã nhớ: ${choices.join(', ')}` });
    return rows;
  }

  private rowsSettings(): Row[] {
    const st = getSettings();
    const next = { auto: 'on', on: 'off', off: 'auto' } as const;
    const nm = { auto: 'Tự động', on: 'Luôn bật', off: 'Tắt' } as const;
    return [
      { text: `Âm thanh: ${audio.muted ? 'TẮT' : 'BẬT'}`, btns: [{ label: audio.muted ? 'Bật' : 'Tắt', fn: () => { audio.setMuted(!audio.muted); audio.unlock(); } }] },
      { text: `Joystick ảo (điện thoại): ${nm[st.joystick]} · vị trí: ${st.joyside === 'left' ? 'trái' : 'phải'}`, sub: 'Vòng tròn điều khiển ở góc dưới màn hình. Áp dụng khi vào lại bản đồ.', btns: [{ label: 'Đổi chế độ', fn: () => { setSettings({ joystick: next[st.joystick] }); this.note('Đã đổi. Áp dụng khi đổi bản đồ.'); } }, { label: 'Đổi bên', fn: () => { setSettings({ joyside: st.joyside === 'left' ? 'right' : 'left' }); this.note('Đã đổi bên. Áp dụng khi đổi bản đồ.'); } }] },
      { text: 'Sao lưu save', sub: 'Tải file .txt về máy, hoặc sao chép chuỗi save vào clipboard.', btns: [{ label: 'Tải file', fn: () => this.downloadSave() }, { label: 'Sao chép', fn: () => this.copySave() }] },
      { text: 'Khôi phục save', sub: 'Chọn file .txt đã sao lưu hoặc dán chuỗi. Sẽ GHI ĐÈ tiến trình hiện tại.', btns: [{ label: 'Chọn file', color: 0x6a3a3a, fn: () => this.pickSaveFile() }, { label: 'Dán chuỗi', color: 0x6a3a3a, fn: () => this.pasteSave() }] },
      { text: 'Phím tắt: WASD/Mũi tên đi · E/Space nói chuyện · 1-3 chọn · M menu · N tắt tiếng · F hiện FPS' },
    ];
  }

  private downloadSave() {
    try {
      const blob = new Blob([exportSave(game.p)], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `tan-can-nghich-thien-${Date.now()}.txt`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      this.note('Đã tạo file save.');
    } catch { this.note('Không tải được file. Hãy thử "Sao chép".'); }
  }

  private copySave() {
    const text = exportSave(game.p);
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(() => { this.note('Đã sao chép chuỗi save vào clipboard.'); this.panel.render(); }, () => this.note('Trình duyệt chặn clipboard.'));
    else this.note('Trình duyệt không hỗ trợ clipboard.');
  }

  private applyImported(text: string) {
    const r = importSave(text);
    if (!r.ok) { this.note(r.reason); this.panel.render(); return; }
    game.p = r.p;
    writeSave(r.p);
    this.note('Đã khôi phục save. Bản đồ sẽ tải lại.');
    this.panel.render();
    this.time.delayedCall(700, () => { this.scene.stop(); this.scene.stop('Overworld'); this.scene.start('Overworld'); });
  }

  private pickSaveFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,text/plain';
    input.onchange = () => { const f = input.files?.[0]; if (f) f.text().then((t) => this.applyImported(t)); };
    input.click();
  }

  private pasteSave() {
    const t = window.prompt('Dán chuỗi save (bắt đầu bằng TCNT1.):');
    if (t) this.applyImported(t);
  }
}
