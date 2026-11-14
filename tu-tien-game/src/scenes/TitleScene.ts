import Phaser from 'phaser';
import { W, H } from '../main';
import { continueGame, startNew, persist, game } from '../state';
import { button, label } from '../ui/widgets';
import { load } from '../core/save';
import { enterChapter, unlockSystem } from '../core/session';

export class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    this.add.rectangle(0, 0, W, H, 0x0b1020).setOrigin(0);
    for (let i = 0; i < 60; i++) this.add.rectangle(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H), 2, 2, 0xffffff, Phaser.Math.FloatBetween(0.2, 0.9));
    label(this, W / 2, 60, 'TÀN CĂN NGHỊCH THIÊN', { fontSize: '28px', color: '#ffe38a' }).setOrigin(0.5);
    label(this, W / 2, 96, 'Phế vật nghịch tập · Báo thù huyết hải', { fontSize: '11px', color: '#9fb0ff' }).setOrigin(0.5);

    const hasSave = !!load();
    const bx = W / 2 - 90;
    button(this, bx, 140, 180, 34, 'Bắt đầu mới', () => { startNew(); this.scene.start('Overworld'); });
    button(this, bx, 182, 180, 34, hasSave ? 'Tiếp tục' : 'Tiếp tục (chưa có save)', () => { if (continueGame()) this.scene.start('Overworld'); }, { enabled: hasSave });
    button(this, bx, 224, 180, 34, 'Thử nhanh: Trúc Cơ + Kiếm Tu', () => {
      startNew();
      const p = game.p;
      p.rootId = 'kim'; p.realmIndex = 1; p.stage = 5; p.branchId = 'kiem_tu'; p.gold = 500;
      p.inventory = { hoi_huyet_dan: 3, linh_thao: 12, huyet_tham: 4, huyen_thiet: 8 };
      p.knownRecipes = ['hoi_huyet_dan', 'hoi_linh_dan', 'tu_khi_dan'];
      p.comboPresets = [['kiem_nhat_thiem', 'kiem_phong_cuong', 'kiem_tam_ho'], [], []];
      for (const c of [1, 2, 3, 4]) enterChapter(p, c);
      unlockSystem(p, 'tu_luyen');
      persist();
      this.scene.start('Overworld');
    });
    label(this, W / 2, H - 22, 'WASD / phím mũi tên / chạm để di chuyển · E hoặc chạm NPC để nói chuyện · M: menu', { fontSize: '9px', color: '#6b7391' }).setOrigin(0.5);
  }
}
