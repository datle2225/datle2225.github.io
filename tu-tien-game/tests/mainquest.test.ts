import { describe, it, expect } from 'vitest';
import { newPlayer } from '../src/core/save';
import { QUESTS } from '../src/core/data';
import { checkStateSteps, questEvent } from '../src/core/session';
import { stepProgress, objectiveMarkers } from '../src/core/objectives';

const main = () => (QUESTS as any[]).filter((q) => q.type === 'main');

describe('chuỗi nhiệm vụ chính liên tục', () => {
  it('mỗi nhiệm vụ chính (trừ vài điểm do hội thoại giao) đều dẫn tới nhiệm vụ kế tiếp', () => {
    const givenByDialogue = new Set(['m2_1', 'm3_1', 'm4_1']); // NPC giao khi nói chuyện
    const reachable = new Set<string>(['m1_1', ...givenByDialogue]);
    const q = new Map(main().map((x) => [x.id, x]));
    let grew = true;
    while (grew) { grew = false; for (const id of [...reachable]) for (const n of q.get(id)?.unlocks ?? []) if (!reachable.has(n)) { reachable.add(n); grew = true; } }
    for (const m of main()) expect(reachable.has(m.id), `${m.id} không thể nhận được`).toBe(true);
    // nhiệm vụ cuối của mỗi mạch nối tới cảnh giới kế: chỉ m1_12, m2_5, m3_5, m5_x… và m7_3 được phép không có unlocks
    const ends = main().filter((m) => !(m.unlocks ?? []).length).map((m) => m.id);
    for (const id of ['m1_12', 'm2_5', 'm3_5', 'm7_3']) expect(ends).toContain(id);
    expect(ends).not.toContain('m1_3');
    expect(ends).not.toContain('m3_3');
  });
  it('bước cảnh giới tự hoàn thành và mở nhiệm vụ kế', () => {
    const p = newPlayer('kiem' as any);
    p.quests.active = ['m1_7'];
    p.stage = 8; expect(checkStateSteps(p)).toEqual([]);
    p.stage = 9; expect(checkStateSteps(p)).toEqual(['m1_7']);
    expect(p.quests.active).toContain('m1_8');
    p.realmIndex = 1; p.stage = 1;
    expect(checkStateSteps(p)).toContain('m1_8');
    expect(p.quests.active).toContain('m1_9');
    p.branchId = 'kiem_tu';
    expect(checkStateSteps(p)).toContain('m1_9');
  });
  it('nói chuyện với NPC mục tiêu hoàn thành bước talk', () => {
    const p = newPlayer('kiem' as any);
    p.quests.active = ['m1_4'];
    expect(questEvent(p, 'talk', 'mac_tran')).toEqual(['m1_4']);
    expect(p.quests.active).toContain('m1_5');
  });
  it('minimap có đánh dấu cho nhiệm vụ nói chuyện & tiến độ hiển thị', () => {
    const p = newPlayer('kiem' as any);
    p.quests.active = ['m1_6'];
    const q = (QUESTS as any[]).find((x) => x.id === 'm1_6');
    expect(stepProgress(p, q)).toBe(' (0/3)');
    expect(objectiveMarkers(p, 'thanh_ha').length).toBeGreaterThan(0);
    p.quests.active = ['m1_4'];
    expect(objectiveMarkers(p, 'thanh_ha').some((m) => m.kind === 'portal')).toBe(true);
  });
});
