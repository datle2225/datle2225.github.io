import Phaser from 'phaser';
import { W, H } from '../main';
import { continueGame, startNew, persist, game, newGame } from '../state';
import { DIFFICULTIES, difficultyOf } from '../core/difficulty';
import { button, label } from '../ui/widgets';
import { load } from '../core/save';
import { enterChapter, unlockSystem } from '../core/session';
import { audio } from '../audio';

export class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    this.add.rectangle(0, 0, W, H, 0x0b1020).setOrigin(0);
    for (let i = 0; i < 60; i++) this.add.rectangle(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H), 2, 2, 0xffffff, Phaser.Math.FloatBetween(0.2, 0.9));
    label(this, W / 2, 60, 'TÀN CĂN NGHỊCH THIÊN', { fontSize: '28px', color: '#ffe38a' }).setOrigin(0.5);
    label(this, W / 2, 96, 'Phế vật nghịch tập · Báo thù huyết hải', { fontSize: '11px', color: '#9fb0ff' }).setOrigin(0.5);

    this.input.on('pointerdown', () => { audio.unlock(); audio.music('title'); });
    this.input.keyboard!.once('keydown', () => { audio.unlock(); audio.music('title'); });
    const diffDesc = label(this, W - 200, 176, '', { fontSize: '9px', color: '#9fb0ff', wordWrap: { width: 180 } });
    let diffUi: { bg: Phaser.GameObjects.Rectangle; t: Phaser.GameObjects.Text } | null = null;
    const drawDiff = () => {
      diffUi?.bg.destroy(); diffUi?.t.destroy();
      const d = difficultyOf(newGame);
      diffUi = button(this, W - 200, 142, 180, 28, `Độ khó: ${d.name}`, () => { const i = DIFFICULTIES.findIndex((x) => x.id === newGame.difficulty); newGame.difficulty = DIFFICULTIES[(i + 1) % DIFFICULTIES.length].id; drawDiff(); }, { color: d.id === 'nightmare' ? 0x7a2a2a : d.id === 'hard' ? 0x7a5a2a : 0x2a5a3a });
      diffDesc.setText(d.desc);
    };
    label(this, W - 200, 126, 'Ván mới:', { fontSize: '9px', color: '#6b7391' });
    drawDiff();
    const hasSave = !!load();
    const bx = W / 2 - 90;
    button(this, bx, 112, 180, 28, 'Bắt đầu mới', () => { startNew(); this.scene.start('Overworld'); });
    button(this, bx, 144, 180, 28, hasSave ? 'Tiếp tục' : 'Tiếp tục (chưa có save)', () => { if (continueGame()) this.scene.start('Overworld'); }, { enabled: hasSave });
    button(this, bx, 176, 180, 28, 'Thử nhanh: Trúc Cơ + Kiếm Tu', () => {
      startNew();
      const p = game.p;
      p.rootId = 'kim'; p.realmIndex = 1; p.stage = 5; p.branchId = 'kiem_tu'; p.gold = 800;
      p.inventory = { hoi_huyet_dan: 3, linh_thao: 12, huyet_tham: 4, huyen_thiet: 8 };
      p.knownRecipes = ['hoi_huyet_dan', 'hoi_linh_dan', 'tu_khi_dan'];
      p.comboPresets = [['kiem_nhat_thiem', 'kiem_phong_cuong', 'kiem_tam_ho'], [], []];
      for (const c of [1, 2, 3, 4]) enterChapter(p, c);
      unlockSystem(p, 'tu_luyen');
      persist();
      this.scene.start('Overworld');
    });
    button(this, bx, 208, 180, 28, 'Thử nhanh: Kết Đan (Hồi 2)', () => {
      startNew();
      const p = game.p;
      p.rootId = 'kim'; p.realmIndex = 2; p.stage = 3; p.branchId = 'kiem_tu'; p.gold = 1500; p.daoHeart = 60;
      p.inventory = { hoi_huyet_dan: 5, linh_thao: 15, huyet_tham: 8, huyen_thiet: 10 };
      p.knownRecipes = ['hoi_huyet_dan', 'hoi_linh_dan', 'tu_khi_dan'];
      p.comboPresets = [['kiem_nhat_thiem', 'kiem_phong_cuong', 'kiem_tam_ho', 'kiem_van_ly'], [], []];
      p.quests = { active: [], done: ['m1_1', 'm1_2', 'm1_3'], progress: {} };
      p.flags = { intro: true, met_laongu: true, enemy1_dead: true };
      for (const c of [1, 2, 3, 4, 6]) enterChapter(p, c);
      unlockSystem(p, 'tu_luyen'); unlockSystem(p, 'luyen_dan');
      p.mapId = 'phuong_thi';
      persist();
      this.scene.start('Overworld');
    });
    button(this, bx, 240, 180, 28, 'Thử nhanh: Nguyên Anh (Hồi 3)', () => {
      startNew();
      const p = game.p;
      p.rootId = 'hon_don'; p.realmIndex = 3; p.stage = 5; p.branchId = 'kiem_tu'; p.subBranchId = 'dan_tu'; p.gold = 4000; p.daoHeart = 60;
      p.inventory = { hoi_huyet_dan: 8, linh_thao: 20, huyet_tham: 10, huyen_thiet: 12 };
      p.knownRecipes = ['hoi_huyet_dan', 'hoi_linh_dan', 'tu_khi_dan'];
      p.comboPresets = [['kiem_nhat_thiem', 'kiem_phong_cuong', 'kiem_tam_ho', 'kiem_van_ly'], [], []];
      p.quests = { active: [], done: ['m1_1', 'm1_2', 'm1_3', 'm2_1', 'm2_2', 'm2_3'], progress: {} };
      p.flags = { intro: true, met_laongu: true, enemy1_dead: true, enemy2_dead: true, enemy3_dead: true, mac_gia_known: true, unsealed: true, luc_hint: true };
      for (const c of [1, 2, 3, 4, 6, 7]) enterChapter(p, c);
      for (const sy of ['tu_luyen', 'luyen_dan', 'thoat_xac', 'hon_don']) unlockSystem(p, sy);
      p.mapId = 'phuong_thi';
      persist();
      this.scene.start('Overworld');
    });
    button(this, bx, 272, 180, 28, 'Thử nhanh: Hóa Thần (Phần 2)', () => {
      startNew();
      const p = game.p;
      p.rootId = 'hon_don'; p.realmIndex = 4; p.stage = 4; p.branchId = 'kiem_tu'; p.subBranchId = 'dan_tu'; p.gold = 12000; p.daoHeart = 60;
      p.rep = { chinh_dao: 6, ma_dao: 0, tan_tu: 2 };
      p.inventory = { hoi_huyet_dan: 10, linh_thao: 20, huyet_tham: 12, huyen_thiet: 20 };
      p.knownRecipes = ['hoi_huyet_dan', 'hoi_linh_dan', 'tu_khi_dan'];
      p.comboPresets = [['kiem_nhat_thiem', 'kiem_phong_cuong', 'kiem_tam_ho', 'kiem_van_ly'], [], []];
      p.quests = { active: [], done: ['m1_1', 'm1_2', 'm1_3', 'm2_1', 'm2_2', 'm2_3', 'm3_1', 'm3_2', 'm3_3'], progress: {} };
      p.flags = { intro: true, met_laongu: true, enemy1_dead: true, enemy2_dead: true, enemy3_dead: true, enemy4_dead: true, enemy5_dead: true, mac_gia_known: true, unsealed: true, game_complete: true, ending_end_chinh: true, hoi3_open: true };
      for (const c of [1, 2, 3, 4, 6, 7, 8]) enterChapter(p, c);
      for (const sy of ['tu_luyen', 'luyen_dan', 'thoat_xac', 'hon_don', 'tran_phap', 'the_luc', 'phap_tac']) unlockSystem(p, sy);
      p.mapId = 'thien_kiep_dai';
      persist();
      this.scene.start('Overworld');
    });
    button(this, bx, 304, 180, 28, 'Thử nhanh: Đại Thừa (Phi Thăng)', () => {
      startNew();
      const p = game.p;
      p.rootId = 'hon_don'; p.realmIndex = 7; p.stage = 9; p.exp = 7e9; p.branchId = 'kiem_tu'; p.subBranchId = 'dan_tu'; p.gold = 100000; p.daoHeart = 70;
      p.rep = { chinh_dao: 10, ma_dao: 0, tan_tu: 3 };
      p.inventory = { hoi_huyet_dan: 20, linh_thao: 30, huyet_tham: 20, huyen_thiet: 30, truc_co_dan: 5, pha_canh_dan: 3 };
      p.knownRecipes = ['hoi_huyet_dan', 'hoi_linh_dan', 'tu_khi_dan'];
      p.comboPresets = [['kiem_nhat_thiem', 'kiem_phong_cuong', 'kiem_tam_ho', 'kiem_van_ly', 'thien_dia_hop_nhat', 'phi_thang_chi_kiem'], [], []];
      p.formations = ['huyet_sat', 'kim_cuong']; p.formation = 'kim_cuong'; p.law = 'sinh_tu';
      p.quests = { active: [], done: ['m1_1', 'm1_2', 'm1_3', 'm2_1', 'm2_2', 'm2_3', 'm3_1', 'm3_2', 'm3_3', 'm4_1', 'm4_2', 'm5_1', 'm5_2', 'm6_1', 'm6_2', 'm7_1', 'm7_2'], progress: {} };
      p.flags = { intro: true, met_laongu: true, enemy1_dead: true, enemy2_dead: true, enemy3_dead: true, enemy4_dead: true, enemy5_dead: true, enemy6_dead: true, enemy7_dead: true, enemy8_dead: true, enemy9_dead: true, mac_gia_known: true, unsealed: true, game_complete: true, ending_end_chinh: true, hoi3_open: true };
      for (const c of [1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12]) enterChapter(p, c);
      for (const sy of ['tu_luyen', 'luyen_dan', 'thoat_xac', 'hon_don', 'tran_phap', 'the_luc', 'phap_tac', 'dich_chuyen', 'phi_thang']) unlockSystem(p, sy);
      p.visited = ['thanh_ha', 'phuong_thi', 'thien_kiep_dai', 'thien_phong', 'hu_khong', 'co_chien_truong', 'thien_mon'];
      p.mapId = 'thien_mon';
      persist();
      this.scene.start('Overworld');
    });
    label(this, W / 2, H - 22, 'WASD / phím mũi tên / chạm để di chuyển · E hoặc chạm NPC để nói chuyện · M: menu', { fontSize: '9px', color: '#6b7391' }).setOrigin(0.5);
  }
}
