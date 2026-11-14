import { describe, expect, it } from 'vitest';
import { newPlayer } from '../src/core/save';
import { MED, auraAt, canMeditate, cancelSeclusion, claimSeclusion, energyNow, meditate, secondsUntilEnergy, seclusionUnits, startSeclusion } from '../src/core/meditation';
import { clearBottleneck, expNeeded, isBottlenecked, levelUpStages, gainExp } from '../src/core/progression';
import { DialogueRunner, check } from '../src/core/story';
import { rollEvent } from '../src/core/story';
import { EVENTS } from '../src/core/data';

const kim = () => { const p = newPlayer(); p.rootId = 'kim'; return p; };

describe('thiền có giới hạn', () => {
  it('mỗi lần thiền tốn tâm lực và 2 giờ game, tăng tu vi theo linh khí', () => {
    const a = kim(), b = kim();
    const t0 = a.playtime;
    const ra = meditate(a, 1, true), rb = meditate(b, 2, true);
    expect(ra.ok).toBe(true);
    expect(rb.gain!).toBeGreaterThan(ra.gain! * 1.8);
    expect(energyNow(a)).toBeCloseTo(100 - MED.energyCost);
    expect(a.playtime - t0).toBeCloseTo(25);
  });
  it('thời gian thiền KHÔNG hồi tâm lực: chỉ thiền được ~8 lần liên tiếp', () => {
    const p = kim();
    p.stage = 1; p.exp = 0;
    let n = 0;
    p.realmIndex = 1; // tu vi cần lớn để không bị đầy tầng giữa chừng
    p.stage = 1;
    while (meditate(p, 1, true).ok && n < 50) n++;
    expect(n).toBe(Math.floor(100 / MED.energyCost));
    expect(canMeditate(p, true).reason).toMatch(/Tâm lực cạn/);
    expect(secondsUntilEnergy(p)).toBeGreaterThan(0);
  });
  it('chơi một lúc thì tâm lực hồi', () => {
    const p = kim(); p.realmIndex = 1;
    while (meditate(p, 1, true).ok);
    const wait = secondsUntilEnergy(p);
    p.playtime += wait;
    expect(canMeditate(p, true).ok).toBe(true);
  });
  it('cần nơi yên tĩnh', () => {
    expect(meditate(kim(), 1, false).ok).toBe(false);
  });
  it('Tàn Căn thiền gần như vô ích so với linh căn thường (cần đan dược)', () => {
    const a = kim(), b = newPlayer();
    expect(meditate(b, 1, true).gain!).toBeLessThan(meditate(a, 1, true).gain! * 0.35);
  });
  it('linh mạch cao hơn nền thì được dùng, nếu đứng đủ gần', () => {
    const map = { aura: 1, auras: [{ x: 10, y: 10, r: 3, value: 2, label: 'Linh mạch' }] };
    expect(auraAt(map, 11, 10).value).toBe(2);
    expect(auraAt(map, 20, 20).value).toBe(1);
  });
});

describe('bình cảnh', () => {
  it('Luyện Khí tầng 6 đủ tu vi vẫn không lên, tu vi không tích vượt trần', () => {
    const p = kim(); p.stage = 6;
    gainExp(p, expNeeded(p) * 3);
    expect(levelUpStages(p)).toBe(0);
    expect(p.stage).toBe(6);
    expect(p.exp).toBe(expNeeded(p));
    expect(isBottlenecked(p)).toBe(true);
    expect(canMeditate(p, true).reason).toMatch(/Bình cảnh/);
  });
  it('phá bình cảnh thì lên tầng và đi tiếp được', () => {
    const p = kim(); p.stage = 6; p.exp = expNeeded(p);
    expect(clearBottleneck(p)).toBe(1);
    expect(p.stage).toBe(7);
    expect(isBottlenecked(p)).toBe(false);
    expect(clearBottleneck(p)).toBe(0); // không bình cảnh nữa
  });
  it('các tầng không phải bình cảnh lên bình thường', () => {
    const p = kim(); p.stage = 3; p.exp = expNeeded(p);
    expect(levelUpStages(p)).toBe(1);
  });
  it('sự kiện ngộ đạo chỉ xuất hiện khi bị bình cảnh và phá được nó', () => {
    const p = kim(); p.stage = 6;
    const evs = EVENTS.filter((e) => e.id === 'ngo_dao');
    expect(rollEvent(p, evs, () => 0)).toBeNull();
    p.exp = expNeeded(p);
    expect(check(p, { bottleneck: true })).toBe(true);
    const ev = rollEvent(p, evs, () => 0)!;
    const d = new DialogueRunner(p, ev.dialogue);
    d.advance(0);
    expect(p.stage).toBe(7);
  });
});

describe('bế quan (offline)', () => {
  const T0 = 1_700_000_000_000;
  it('chưa đủ 10 phút thì không nhận gì', () => {
    const p = kim(); startSeclusion(p, 1, T0);
    expect(seclusionUnits(p, T0 + 9 * 60_000)).toBe(0);
    expect(claimSeclusion(p, T0 + 9 * 60_000).gain).toBe(0);
    expect(p.seclusion).toBeNull();
  });
  it('mỗi 10 phút thực = 1 đơn vị, hiệu suất 50% so với thiền thường', () => {
    const a = kim(), b = kim();
    startSeclusion(a, 1, T0);
    const g = claimSeclusion(a, T0 + 30 * 60_000).gain!;
    const direct = meditate(b, 1, true).gain!;
    expect(g).toBeGreaterThan(direct * 1.2); // 3 đơn vị × 50% = 1.5 lần
    expect(g).toBeLessThan(direct * 1.8);
  });
  it('có trần 8 giờ và không vượt qua bình cảnh', () => {
    const p = kim(); startSeclusion(p, 1, T0);
    expect(seclusionUnits(p, T0 + 100 * 3600_000)).toBe(MED.seclusionMaxUnits);
    const q = kim(); q.stage = 6; q.exp = expNeeded(q);
    startSeclusion(q, 1, T0);
    const r = claimSeclusion(q, T0 + 5 * 3600_000);
    expect(r.gain).toBe(0);
    expect(q.stage).toBe(6);
  });
  it('không bế quan hai lần; hủy được', () => {
    const p = kim();
    expect(startSeclusion(p, 1, T0).ok).toBe(true);
    expect(startSeclusion(p, 1, T0).ok).toBe(false);
    cancelSeclusion(p);
    expect(p.seclusion).toBeNull();
  });
});
