import { describe, expect, it } from 'vitest';
import { allMapIds, loadMap } from '../src/core/maps';
import { parseTiled, isSolidTile, type TiledMap } from '../src/core/tiled';
import { TILESET } from '../src/core/tileset';
import { DIALOGUES, pickDialogue, check } from '../src/core/story';
import { enemyMap, vendorMap, questMap } from '../src/core/data';
import { buyPrice, memberDiscount } from '../src/core/services';
import { joinFaction, leaveFaction } from '../src/core/advanced';
import { newPlayer } from '../src/core/save';

describe('bản đồ Tiled', () => {
  it('12 bản đồ được nạp và có spawn hợp lệ', () => {
    expect(allMapIds().sort()).toEqual(['bang_nguyen', 'co_chien_truong', 'hoang_mac', 'hu_khong', 'huyet_anh_dan', 'huyet_nguyet', 'phuong_thi', 'thanh_ha', 'thanh_van_tong', 'thien_kiep_dai', 'thien_mon', 'thien_phong']);
    for (const id of allMapIds()) {
      const m = loadMap(id);
      expect(m.w * m.h).toBe(m.tiles.length);
      const sp = m.spawns.spawn;
      expect(isSolidTile(m.tiles[sp.y * m.w + sp.x]), `${id} spawn kẹt vào vật cản`).toBe(false);
    }
  });
  it('tileset trong file Tiled khớp tileset của game (cùng thứ tự)', () => {
    const files = import.meta.glob('../src/data/maps/*.json', { eager: true, import: 'default' }) as Record<string, TiledMap>;
    for (const raw of Object.values(files)) {
      const tiles = (raw.tilesets as any)[0].tiles as { id: number; properties: { name: string; value: unknown }[] }[];
      expect(tiles.length).toBe(TILESET.length);
      tiles.forEach((t, i) => { expect(t.properties.find((p) => p.name === 'tex')!.value).toBe(TILESET[i].tex); expect(t.properties.find((p) => p.name === 'solid')!.value).toBe(TILESET[i].solid); });
    }
  });
  it('mọi tham chiếu trong bản đồ đều tồn tại (NPC, hội thoại, quái, cửa hàng, cổng, vùng)', () => {
    for (const id of allMapIds()) {
      const m = loadMap(id);
      for (const n of m.npcs) {
        if (n.vendor) expect(vendorMap.has(n.vendor), `${id}:${n.id} vendor`).toBe(true);
        expect(n.talk.length, `${id}:${n.id} thiếu talk`).toBeGreaterThan(0);
        for (const t of n.talk) if (t.id !== '@rumor' && t.id !== '@board') expect(DIALOGUES[t.id], `${id}:${n.id} -> ${t.id}`).toBeTruthy();
        expect(isSolidTile(m.tiles[n.y * m.w + n.x]), `${id}:${n.id} đứng trong vật cản`).toBe(false);
        for (const s of n.schedule ?? []) expect(isSolidTile(m.tiles[s.y * m.w + s.x]), `${id}:${n.id} lịch ${s.from}`).toBe(false);
      }
      for (const f of m.foes) { for (const e of f.group) expect(enemyMap.has(e), `${id} quái ${e}`).toBe(true); expect(isSolidTile(m.tiles[f.y * m.w + f.x])).toBe(false); }
      for (const [x, y] of m.herbs) expect(isSolidTile(m.tiles[y * m.w + x]), `${id} thảo dược (${x},${y})`).toBe(false);
      for (const po of m.portals) { const dst = loadMap(po.target); expect(dst.spawns[po.arrive], `${id}->${po.target}:${po.arrive}`).toBeTruthy(); }
      for (const z of m.zones) expect(z.r).toBeGreaterThan(0);
    }
  });
  it('các cổng nối hai chiều giữa các map', () => {
    for (const id of allMapIds()) for (const po of loadMap(id).portals) expect(loadMap(po.target).portals.some((q) => q.target === id), `${po.target} thiếu cổng về ${id}`).toBe(true);
  });
  it('NPC cửa hàng nghỉ đêm, có mặt ban ngày', () => {
    const m = loadMap('thanh_ha');
    const smith = m.npcs.find((n) => n.id === 'tho_ren')!;
    expect(smith.schedule!.some((s) => s.hidden)).toBe(true);
    expect(smith.schedule!.some((s) => !s.hidden)).toBe(true);
  });
  it('mọi NPC đến được: đường đi từ spawn tới cạnh NPC (BFS, không bị tường chặn)', () => {
    for (const id of allMapIds()) {
      const m = loadMap(id);
      const seen = new Set<string>();
      const q = [[m.spawns.spawn.x, m.spawns.spawn.y]];
      seen.add(`${q[0][0]},${q[0][1]}`);
      while (q.length) {
        const [x, y] = q.shift()!;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h || seen.has(`${nx},${ny}`) || isSolidTile(m.tiles[ny * m.w + nx])) continue;
          seen.add(`${nx},${ny}`); q.push([nx, ny]);
        }
      }
      for (const n of m.npcs) {
        const near = [[0, 1], [0, -1], [1, 0], [-1, 0], [0, 0]].some(([dx, dy]) => seen.has(`${n.x + dx},${n.y + dy}`));
        expect(near, `${id}: không tới được ${n.id}`).toBe(true);
      }
      for (const po of m.portals) expect(seen.has(`${po.x},${po.y}`) || seen.has(`${po.x - 1},${po.y}`) || seen.has(`${po.x + 1},${po.y}`), `${id}: không tới được cổng ${po.target}`).toBe(true);
      for (const [hx, hy] of m.herbs) expect(seen.has(`${hx},${hy}`), `${id}: thảo dược (${hx},${hy}) bị chặn`).toBe(true);
    }
  });
  it('NPC chọn đúng hội thoại theo điều kiện', () => {
    const m = loadMap('thanh_van_tong');
    const mac = m.npcs.find((n) => n.id === 'mac_tran')!;
    const p = newPlayer();
    expect(pickDialogue(p, mac.talk)).toBe('mac_tran_1');
    p.flags.mac_tran_met = true;
    expect(pickDialogue(p, mac.talk)).toBe('mac_tran_2');
    expect(check(p, { map: 'thanh_ha' })).toBe(true);
  });
  it('nhiệm vụ s2_1 tồn tại và nhận được từ Quản Sự', () => {
    expect(questMap.has('s2_1')).toBe(true);
  });
  it('parseTiled từ chối tile sai kích thước và JSON thuộc tính hỏng', () => {
    expect(() => parseTiled({ width: 1, height: 1, tilewidth: 32, layers: [] } as any, 'x')).toThrow();
    const bad: any = { width: 2, height: 2, tilewidth: 16, layers: [{ name: 'npcs', type: 'objectgroup', objects: [{ id: 1, name: 'a', x: 0, y: 0, properties: [{ name: 'talk', value: '{không phải json' }] }] }] };
    expect(() => parseTiled(bad, 'x')).toThrow();
  });
});

describe('phân bố cửa hàng: mỗi vùng một đặc sản', () => {
  const vendorsOf = (map: string) => loadMap(map).npcs.filter((n) => n.vendor).map((n) => n.vendor!);
  it('dungeon và cảnh cuối không có cửa hàng; vùng ngoài trời có đặc sản riêng', () => {
    for (const m of ['huyet_nguyet', 'huyet_anh_dan', 'thien_kiep_dai', 'hu_khong', 'co_chien_truong', 'thien_mon']) expect(vendorsOf(m), m).toEqual([]);
    expect(vendorsOf('thanh_van_tong')).toEqual(['tong_mon_thuong_hoi']);
    expect(vendorsOf('hoang_mac')).toContain('mac_gia_thuong_hoi');
    expect(vendorsOf('bang_nguyen')).toEqual(['tho_san_bang']);
  });
  it('Băng Nguyên không có lò rèn hay đan sư (chỉ tiếp tế); không map ngoài chợ nào có đủ ba quầy', () => {
    const types = (map: string) => new Set(vendorsOf(map).map((v) => (vendorMap.get(v) as any).type));
    expect(types('bang_nguyen')).toEqual(new Set(['general']));
    for (const m of allMapIds().filter((x) => !['thanh_ha', 'phuong_thi', 'thien_phong'].includes(x))) expect(types(m).has('smith') && types(m).has('alchemist'), m).toBe(false);
  });
  it('Hoang Mạc bán Huyền Thiết rẻ nhất; Thương hội Thanh Vân giảm riêng cho thành viên', () => {
    const price = (v: string) => (vendorMap.get(v) as any).sells.find((s: any) => s.id === 'huyen_thiet')?.price ?? 999;
    for (const other of ['tho_ren', 'tap_hoa', 'thiet_phong', 'thien_phong_ren', 'thuong_nhan']) expect(price('mac_gia_thuong_hoi')).toBeLessThan(price(other));
    const p = newPlayer(); p.unlockedSystems.push('the_luc'); p.rep.chinh_dao = 5;
    const base = buyPrice(p, 'tong_mon_thuong_hoi', 1000);
    expect(memberDiscount(p, 'tong_mon_thuong_hoi')).toBe(0);
    joinFaction(p, 'thanh_van');
    expect(memberDiscount(p, 'tong_mon_thuong_hoi')).toBe(0.12);
    expect(buyPrice(p, 'tong_mon_thuong_hoi', 1000)).toBeLessThan(base * 0.9);
    expect(memberDiscount(p, 'tap_hoa')).toBe(0); // chỉ áp dụng ở thương hội tông môn
    leaveFaction(p); joinFaction(p, 'van_duoc');
    expect(memberDiscount(p, 'tong_mon_thuong_hoi')).toBe(0);
  });
  it('ba đặc sản chọn đúng hội thoại và ngủ ban đêm (trừ trạm thợ săn)', () => {
    for (const [m, id, first, menu] of [['thanh_van_tong', 'tong_mon_thuong_hoi', 'tmth_1', 'tmth_menu'], ['hoang_mac', 'mac_gia_thuong_hoi', 'mgth_1', 'mgth_menu'], ['bang_nguyen', 'tho_san_bang', 'tsb_1', 'tsb_menu']]) {
      const n = loadMap(m).npcs.find((x) => x.id === id)!;
      const p = newPlayer();
      expect(pickDialogue(p, n.talk)).toBe(first);
      p.flags[`met_${first.replace('_1', '')}`] = true;
      expect(pickDialogue(p, n.talk)).toBe(menu);
    }
    expect(loadMap('thanh_van_tong').npcs.find((x) => x.id === 'tong_mon_thuong_hoi')!.schedule!.some((s) => s.hidden)).toBe(true);
    expect(loadMap('bang_nguyen').npcs.find((x) => x.id === 'tho_san_bang')!.schedule).toBeUndefined();
  });
});
