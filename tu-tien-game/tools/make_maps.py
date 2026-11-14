#!/usr/bin/env python3
"""Sinh các bản đồ chuẩn Tiled (JSON) trong src/data/maps/. Sau đó có thể mở và chỉnh trong Tiled.
Chạy: python3 tools/make_maps.py   (ghi đè các map do script này quản lý)"""
import json, math, os, re

OUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'maps')
SRC = open(os.path.join(os.path.dirname(__file__), '..', 'src', 'core', 'tileset.ts'), encoding='utf8').read()
TEXS = re.findall(r"tex: '([a-z0-9_]+)', solid: (true|false)", SRC)
TILESET = [(t, s == 'true') for t, s in TEXS]
IDX = {t: i for i, (t, _) in enumerate(TILESET)}
CH = {'g': 'grass', 'G2': 'grass2', 'p': 'path', 't': 'tree', 'r': 'rock', 'w': 'water', 'R': 'ruin', 'W': 'well', 'D': 'gate', 'h': 'house',
      'f': 'floor', 'k': 'wood', 'S': 'sect_roof', 'M': 'sect_wall', 'P': 'pillar', 'y': 'dummy', 'l': 'lantern', 'x': 'flower', 'n': 'fence',
      'c': 'carpet', 'b': 'bridge', 's': 'sand', 'C': 'cactus', 'V': 'lava', 'o': 'bones', 'X': 'dungeon_wall', 'd': 'dungeon_floor', 'q': 'sand_rock'}

def hrand(x, y, salt=0):
    h = math.sin((x + salt) * 12.9898 + y * 78.233) * 43758.5453
    return h - math.floor(h)

class Grid:
    def __init__(self, w, h, fill='g'):
        self.w, self.h = w, h
        self.g = [[fill] * w for _ in range(h)]
    def put(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h: self.g[y][x] = c
    def rect(self, x0, y0, x1, y1, c):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1): self.put(x, y, c)
    def border(self, c='t'):
        for x in range(self.w): self.put(x, 0, c); self.put(x, self.h - 1, c)
        for y in range(self.h): self.put(0, y, c); self.put(self.w - 1, y, c)
    def scatter(self, only='g', tree=0.9, rock=0.86, flower=0.8, seed=0):
        for y in range(self.h):
            for x in range(self.w):
                if self.g[y][x] != only: continue
                r = hrand(x, y, seed)
                if r > tree: self.put(x, y, 't')
                elif r > rock: self.put(x, y, 'r')
                else:
                    r2 = hrand(x, y, seed + 99)
                    if r2 > 0.93: self.put(x, y, 'x')
                    elif r2 > 0.6: self.put(x, y, 'G2')
    def house(self, x, y, w=4, h=2, kind='h'):
        if kind == 'h':
            self.rect(x, y, x + w - 1, y + h - 1, 'h')
        else:
            self.rect(x, y, x + w - 1, y, 'S')
            self.rect(x, y + 1, x + w - 1, y + h - 1, 'M')
    def data(self):
        return [IDX[CH[c]] + 1 for row in self.g for c in row]

def P(name, value, typ=None):
    if typ is None: typ = 'float' if isinstance(value, float) else 'int' if isinstance(value, int) and not isinstance(value, bool) else 'bool' if isinstance(value, bool) else 'string'
    return {'name': name, 'type': typ, 'value': value}

def J(v): return json.dumps(v, ensure_ascii=False, separators=(',', ':'))

class Objs:
    def __init__(self): self.layers = {}; self.nid = 1; self.clear = []
    def add(self, layer, name, tx, ty, props=None, w=0, h=0):
        o = {'id': self.nid, 'name': name, 'type': '', 'x': tx * 16, 'y': ty * 16, 'width': w * 16, 'height': h * 16, 'rotation': 0, 'visible': True}
        if w == 0 and h == 0: o['point'] = True
        o['properties'] = props or []
        self.nid += 1
        if layer in ('npcs', 'enemies', 'herbs', 'spawns'): self.clear.append((tx, ty))
        self.layers.setdefault(layer, []).append(o)

def npc(O, id, label, tex, x, y, talk, vendor=None, schedule=None):
    pr = [P('label', label), P('tex', tex), P('talk', J(talk))]
    if vendor: pr.append(P('vendor', vendor))
    if schedule:
        pr.append(P('schedule', J(schedule)))
        O.clear.extend((e['x'], e['y']) for e in schedule)
    O.add('npcs', id, x, y, pr)

def foe(O, group, tex, x, y, minRealm=None, scale=None):
    pr = [P('group', ','.join(group)), P('tex', tex)]
    if minRealm is not None: pr.append(P('minRealm', minRealm))
    if scale is not None: pr.append(P('scale', scale))
    O.add('enemies', group[0], x, y, pr)

def portal(O, name, x, y, w, h, target, arrive, cond=None, deny=None):
    pr = [P('target', target), P('arrive', arrive)]
    if cond: pr.append(P('if', J(cond)))
    if deny: pr.append(P('deny', deny))
    O.add('portals', name, x, y, pr, w, h)

def write(id, grid, O, props):
    solid = {t for t, sol in TILESET if sol}
    for (x, y) in O.clear:   # mọi thứ đứng trên ô đi được
        if CH[grid.g[y][x]] in solid: grid.put(x, y, 'g')
    layers = [{'id': 1, 'name': 'ground', 'type': 'tilelayer', 'x': 0, 'y': 0, 'width': grid.w, 'height': grid.h, 'opacity': 1, 'visible': True, 'data': grid.data()}]
    lid = 2
    for name in ['npcs', 'signs', 'enemies', 'herbs', 'zones', 'portals', 'auras', 'spawns']:
        layers.append({'id': lid, 'name': name, 'type': 'objectgroup', 'draworder': 'topdown', 'opacity': 1, 'visible': True, 'x': 0, 'y': 0, 'objects': O.layers.get(name, [])}); lid += 1
    tiles = [{'id': i, 'properties': [P('tex', t), P('solid', s, 'bool')]} for i, (t, s) in enumerate(TILESET)]
    m = {'type': 'map', 'version': '1.10', 'tiledversion': '1.10.2', 'orientation': 'orthogonal', 'renderorder': 'right-down', 'infinite': False,
         'width': grid.w, 'height': grid.h, 'tilewidth': 16, 'tileheight': 16, 'nextlayerid': lid, 'nextobjectid': O.nid,
         'properties': [P(k, v) for k, v in props.items()],
         'layers': layers,
         'tilesets': [{'firstgid': 1, 'name': 'tu-tien', 'tilewidth': 16, 'tileheight': 16, 'tilecount': len(TILESET), 'columns': 8, 'image': 'tileset.png', 'imagewidth': 128, 'imageheight': 16 * math.ceil(len(TILESET) / 8), 'margin': 0, 'spacing': 0, 'tiles': tiles}]}
    with open(os.path.join(OUT, id + '.json'), 'w', encoding='utf8') as f: json.dump(m, f, ensure_ascii=False, separators=(',', ':'))
    print('ghi', id, grid.w, 'x', grid.h)

DAY = lambda x, y, hx, hy: [{'from': 6, 'to': 22, 'x': x, 'y': y}, {'from': 22, 'to': 6, 'x': hx, 'y': hy, 'hidden': True}]

# ═════════ Thanh Hà Thôn & Hắc Lâm ═════════
def thanh_ha():
    g = Grid(64, 40)
    g.scatter(seed=0)
    g.rect(0, 13, 63, 13, 'p'); g.rect(10, 8, 10, 24, 'p'); g.rect(10, 19, 55, 19, 'p'); g.rect(30, 13, 30, 29, 'p')
    g.rect(12, 23, 38, 23, 'p'); g.rect(18, 19, 18, 23, 'p'); g.rect(25, 19, 25, 23, 'p')
    g.rect(6, 4, 12, 8, 'R')
    g.put(10, 14, 'W')
    for hx in (13, 20, 34):
        g.house(hx, 21); g.put(hx + 1, 23, 'p')
    for y in range(20, 27):
        for x in range(12, 40):
            if g.g[y][x] in 'trxG2' or g.g[y][x] == 'G2': g.put(x, y, 'g')
    for y in range(40):
        for x in range(64):
            if (x - 44) ** 2 / 25 + (y - 34) ** 2 / 9 < 1: g.put(x, y, 'w')
    g.rect(56, 18, 56, 20, 'D')
    g.border('t')
    g.rect(62, 12, 63, 14, 'p')  # lối ra phía đông (Phường Thị)
    for (x, y) in [(10, 10), (14, 12), (24, 16), (54, 19), (27, 24), (34, 10), (44, 14), (26, 32), (40, 20), (46, 10), (44, 30), (50, 8), (59, 19), (60, 13)]:
        if g.g[y][x] in 'trw': g.put(x, y, 'g')
    O = Objs()
    npc(O, 'lao_ngu', 'Lão Ngư', 'npc_elder', 14, 12, [{'if': {'notFlag': 'met_laongu'}, 'id': 'lao_ngu_1'}, {'id': 'lao_ngu_2'}])
    npc(O, 'ba_ly', 'Bà Lý', 'npc_girl', 24, 16, [{'if': {'questDone': 's1_1', 'notFlag': 'wolf_resolved'}, 'id': 'ba_ly_choice'}, {'if': {'questActive': 's1_1'}, 'id': 'ba_ly_wait'}, {'if': {'noQuest': 's1_1'}, 'id': 'ba_ly_offer'}, {'id': 'ba_ly_after'}])
    npc(O, 'gate', 'Đệ tử Thanh Vân', 'npc_disciple', 54, 19, [{'if': {'questDone': 'm1_2'}, 'id': 'gate_open'}, {'id': 'gate_closed'}])
    npc(O, 'tho_ren', 'Lão Thiết (Thợ Rèn)', 'npc_smith', 14, 23, [{'if': {'notFlag': 'met_tho_ren'}, 'id': 'tho_ren_1'}, {'id': 'tho_ren_menu'}], 'tho_ren', DAY(14, 23, 14, 20))
    npc(O, 'dan_su', 'Lục Dược Sư (Đan Sư)', 'npc_alch', 21, 23, [{'if': {'notFlag': 'met_dan_su'}, 'id': 'dan_su_1'}, {'id': 'dan_su_menu'}], 'dan_su', DAY(21, 23, 21, 20))
    npc(O, 'tap_hoa', 'Chưởng Quầy Tiền (Tạp Hóa)', 'npc_shop', 35, 23, [{'if': {'notFlag': 'met_tap_hoa'}, 'id': 'tap_hoa_1'}, {'id': 'tap_hoa_menu'}], 'tap_hoa', DAY(35, 23, 35, 20))
    npc(O, 'nguyet_nhi', 'Liễu Nguyệt Nhi', 'npc_girl2', 27, 24, [{'if': {'notFlag': 'nguyet_met'}, 'id': 'nguyet_1'}, {'if': {'party': 'nguyet_nhi'}, 'id': 'nguyet_party'}, {'if': {'questDone': 'm1_2', 'notParty': 'nguyet_nhi'}, 'id': 'nguyet_join'}, {'id': 'nguyet_idle'}],
        schedule=[{'from': 7, 'to': 21, 'x': 27, 'y': 24}, {'from': 21, 'to': 7, 'x': 28, 'y': 25, 'hidden': True}])
    for t, x, y in [('Lò Rèn', 15, 20), ('Đan Phòng', 22, 20), ('Tạp Hóa', 36, 20), ('Thanh Hà Tập', 26, 21)]:
        O.add('signs', t, x, y, [P('text', t)])
    for grp, tex, x, y, mr in [(['soi_hoang'], 'wolf', 34, 10, None), (['soi_hoang'], 'wolf', 44, 14, None), (['soi_hoang'], 'wolf', 26, 32, None),
                               (['soi_hoang', 'soi_hoang'], 'wolf', 48, 24, None), (['yeu_xa'], 'snake', 40, 20, None), (['yeu_xa', 'yeu_xa'], 'snake', 48, 28, None),
                               (['huyet_anh_do_de'], 'cultist', 46, 10, None), (['huyet_anh_do_de', 'huyet_anh_do_de'], 'cultist', 52, 14, 1)]:
        foe(O, grp, tex, x, y, mr)
    foe(O, ['boss_huyet_anh_truong_lao'], 'elder_boss', 50, 8, 1, 3)
    for x, y in [(18, 8), (24, 12), (28, 22), (36, 16), (20, 28), (42, 24), (12, 28), (8, 18)]: O.add('herbs', 'linh_thao', x, y)
    O.add('zones', 'diep_gia_tan_tich', 9, 6, [P('r', 3)])
    O.add('zones', 'gieng_co', 10, 14, [P('r', 2)])
    O.add('zones', 'thanh_van_mon', 55, 19, [P('r', 2), P('if', J({'questActive': 'm1_3'})), P('deny', 'Cổng Thanh Vân Tông đóng chặt. Hãy hoàn thành "Cổ Đỉnh" trước.')])
    portal(O, 'to_thanh_van_tong', 57, 18, 1, 3, 'thanh_van_tong', 'from_thanh_ha', {'questDone': 'm1_3'}, 'Cổng Thanh Vân Tông chưa mở. Hãy xin nhập môn trước.')
    portal(O, 'to_phuong_thi', 62, 12, 1, 3, 'phuong_thi', 'from_thanh_ha', {'minChapter': 2}, 'Đường đến Phường Thị Vân Hải rất xa. Hãy gia nhập tông môn rồi hẵng đi.')
    O.add('auras', 'linh_mach', 10, 14, [P('r', 4), P('value', 1.8), P('label', 'Linh mạch giếng cổ')])
    O.add('spawns', 'spawn', 10, 10)
    O.add('spawns', 'from_thanh_van_tong', 59, 19)
    O.add('spawns', 'from_phuong_thi', 60, 13)
    write('thanh_ha', g, O, {'name': 'Thanh Hà Thôn & Hắc Lâm', 'music': 'overworld', 'aura': 1.0})

# ═════════ Thanh Vân Tông ═════════
def thanh_van_tong():
    g = Grid(48, 34)
    g.scatter(seed=7)
    g.rect(8, 8, 39, 28, 'f')                      # sân chính
    g.rect(23, 6, 24, 33, 'c')                      # thảm từ cổng lên điện
    g.rect(14, 2, 33, 3, 'S'); g.rect(14, 4, 33, 5, 'M')   # chính điện
    g.rect(23, 4, 24, 5, 'c')
    for x in (14, 17, 20, 27, 30, 33): g.put(x, 4, 'P'); g.put(x, 5, 'P')
    g.house(3, 9, 5, 3, 's')  # ký túc xá trái
    g.house(40, 9, 5, 3, 's')
    for x, y in [(14, 14), (14, 18), (33, 14), (33, 18)]: g.put(x, y, 'y')
    for y in (9, 13, 17, 21, 25):
        g.put(21, y, 'l'); g.put(26, y, 'l')
    g.rect(0, 30, 47, 33, 'g'); g.rect(22, 29, 25, 33, 'p')
    g.rect(2, 29, 45, 29, 'n'); g.rect(22, 29, 25, 29, 'p')
    g.border('t')
    g.rect(22, 33, 25, 33, 'p')
    O = Objs()
    npc(O, 'mac_tran', 'Mặc Trần', 'npc_rival', 24, 13, [{'if': {'notFlag': 'mac_tran_met'}, 'id': 'mac_tran_1'}, {'id': 'mac_tran_2'}])
    npc(O, 'quan_su', 'Quản Sự Tạp Dịch', 'npc_clerk', 18, 24, [{'if': {'questDone': 's2_1'}, 'id': 'quan_su_after'}, {'if': {'questActive': 's2_1'}, 'id': 'quan_su_wait'}, {'id': 'quan_su_offer'}])
    npc(O, 'luc_van_sinh', 'Trưởng lão Lục Vân Sinh', 'npc_sage', 27, 8, [{'if': {'notFlag': 'luc_met'}, 'id': 'luc_1'}, {'id': 'luc_2'}])
    npc(O, 'bao_tin', 'Bảng Tin Tông Môn', 'npc_clerk', 30, 24, [{'id': '@rumor'}])
    O.add('signs', 'Chính Điện', 24, 1, [P('text', 'Thanh Vân Điện')])
    O.add('signs', 'Luyện Võ', 14, 12, [P('text', 'Võ Trường')])
    for x, y in [(6, 18), (40, 20), (10, 27), (38, 27)]: O.add('herbs', 'linh_thao', x, y)
    portal(O, 'to_thanh_ha', 22, 33, 4, 1, 'thanh_ha', 'from_thanh_van_tong')
    O.add('auras', 'linh_mach', 24, 8, [P('r', 5), P('value', 2.2), P('label', 'Linh mạch chính điện')])
    O.add('spawns', 'spawn', 24, 31)
    O.add('spawns', 'from_thanh_ha', 24, 31)
    write('thanh_van_tong', g, O, {'name': 'Thanh Vân Tông', 'music': 'sect', 'aura': 1.5})

# ═════════ Phường Thị Vân Hải ═════════
def phuong_thi():
    g = Grid(56, 36)
    g.scatter(seed=13)
    g.rect(6, 10, 49, 26, 'f')            # quảng trường
    g.rect(0, 17, 6, 19, 'p')             # đường vào phía tây
    g.rect(24, 10, 31, 26, 'f')
    g.house(9, 11, 5, 2); g.house(17, 11, 5, 2)
    g.house(26, 11, 6, 3, 's')            # Thiên Cơ Các
    g.house(36, 11, 5, 2); g.house(43, 11, 5, 2)
    for x in (11, 19, 38, 45): g.put(x, 13, 'p')
    g.put(29, 14, 'p')
    g.rect(6, 15, 49, 15, 'p')
    for x in range(8, 49, 4): g.put(x, 9, 'l')
    g.rect(40, 28, 52, 33, 'w'); g.rect(44, 28, 45, 33, 'b')
    g.rect(0, 34, 55, 35, 't')
    g.border('t'); g.rect(0, 17, 1, 19, 'p')
    g.rect(27, 32, 29, 35, 'p'); g.rect(54, 17, 55, 19, 'p')
    for (x, y) in [(3, 18), (12, 14), (20, 14), (29, 15), (14, 21), (24, 28), (47, 30), (30, 30)]:
        if g.g[y][x] in 'trw': g.put(x, y, 'g')
    O = Objs()
    npc(O, 'thiet_phong', 'Chủ Thiết Phong Lâu (Thợ Rèn)', 'npc_smith', 11, 14, [{'if': {'notFlag': 'met_thiet_phong'}, 'id': 'thiet_phong_1'}, {'id': 'thiet_phong_menu'}], 'thiet_phong', DAY(11, 14, 11, 10))
    npc(O, 'van_duoc', 'Đan Sư Vạn Dược Đường', 'npc_alch', 19, 14, [{'if': {'notFlag': 'met_van_duoc'}, 'id': 'van_duoc_1'}, {'id': 'van_duoc_menu'}], 'van_duoc', DAY(19, 14, 19, 10))
    npc(O, 'thien_co', 'Thiên Cơ Các (Tin Tức)', 'npc_sage', 29, 14, [{'if': {'minRealm': 2, 'noQuest': 'm2_1'}, 'id': 'thien_co_m2'}, {'if': {'questDone': 'm2_2', 'notFlag': 'mac_gia_known'}, 'id': 'thien_co_m2b'}, {'id': '@rumor'}], schedule=DAY(29, 14, 29, 10))
    npc(O, 'dau_gia', 'Chủ Trì Đấu Giá', 'npc_clerk', 45, 14, [{'id': 'dau_gia_1'}], 'dau_gia', DAY(45, 14, 45, 10))
    npc(O, 've_phuong_thi', 'Vệ Binh Phường Thị', 'npc_guard', 3, 16, [{'id': 'guard_phuong_thi'}])
    npc(O, 'thuong_gia', 'Thương Gia Thạch', 'npc_merchant', 38, 14, [{'id': 'thuong_gia_1'}], 'thuong_nhan', DAY(38, 14, 38, 10))
    O.add('signs', 'Phuong', 28, 9, [P('text', 'Phường Thị Vân Hải')])
    O.add('signs', 'Ren', 12, 10, [P('text', 'Thiết Phong Lâu')])
    O.add('signs', 'Dan', 20, 10, [P('text', 'Vạn Dược Đường')])
    O.add('signs', 'Dg', 45, 10, [P('text', 'Hội Đấu Giá')])
    for grp, tex, x, y, mr in [(['cuop_duong'], 'wolf', 14, 30, None), (['cuop_duong', 'cuop_duong'], 'cultist', 30, 31, None), (['ma_tu_lang_thang'], 'cultist', 8, 31, 1), (['soi_hoang', 'soi_hoang'], 'wolf', 50, 22, None)]:
        foe(O, grp, tex, x, y, mr)
    for x, y in [(5, 22), (50, 12), (20, 30), (35, 32), (3, 28)]: O.add('herbs', 'linh_thao', x, y)
    portal(O, 'to_thanh_ha', 1, 17, 1, 3, 'thanh_ha', 'from_phuong_thi')
    portal(O, 'to_huyet_nguyet', 27, 35, 3, 1, 'huyet_nguyet', 'from_phuong_thi', {'minRealm': 2}, 'Bí cảnh Huyết Nguyệt rất nguy hiểm. Cần ít nhất cảnh giới Kết Đan.')
    portal(O, 'to_hoang_mac', 55, 17, 1, 3, 'hoang_mac', 'from_phuong_thi', {'flag': 'mac_gia_known'}, 'Hoang Mạc Xích Hỏa quá nguy hiểm khi chưa có manh mối. Hãy hỏi Thiên Cơ Các.')
    O.add('spawns', 'from_huyet_nguyet', 28, 31)
    O.add('spawns', 'from_hoang_mac', 52, 18)
    O.add('spawns', 'spawn', 4, 18)
    O.add('spawns', 'from_thanh_ha', 4, 18)
    write('phuong_thi', g, O, {'name': 'Phường Thị Vân Hải', 'music': 'market', 'aura': 0.7})

# ═════════ Huyết Nguyệt Bí Cảnh ═════════
def huyet_nguyet():
    g = Grid(44, 32, 'X')
    g.rect(18, 26, 25, 30, 'd'); g.rect(21, 18, 22, 25, 'd')
    g.rect(6, 16, 15, 22, 'd'); g.rect(15, 19, 21, 19, 'd')
    g.rect(28, 16, 37, 22, 'd'); g.rect(22, 19, 28, 19, 'd')
    g.rect(21, 11, 22, 17, 'd'); g.rect(12, 3, 31, 10, 'd')
    for (x, y) in [(13, 4), (30, 4), (13, 9), (30, 9)]: g.put(x, y, 'P')
    for x0 in (15, 28):
        g.rect(x0, 5, x0 + 1, 6, 'V')
    for (x, y) in [(8, 17), (9, 21), (34, 17), (36, 21), (18, 5), (25, 8), (20, 27), (23, 28)]: g.put(x, y, 'o')
    for (x, y) in [(18, 3), (25, 3), (7, 16), (36, 16)]: g.put(x, y, 'l')
    g.rect(8, 19, 9, 20, 'V'); g.rect(34, 19, 35, 20, 'V')
    g.border('X')
    O = Objs()
    for grp, tex, x, y in [(['huyet_quai', 'doc_trung'], 'cultist', 10, 18), (['huyet_quai', 'huyet_quai'], 'cultist', 32, 18), (['doc_trung'], 'snake', 21, 14), (['huyet_quai'], 'cultist', 21, 22), (['doc_trung', 'doc_trung'], 'snake', 24, 7)]:
        foe(O, grp, tex, x, y, 2)
    foe(O, ['doc_thu_tien_sinh'], 'elder_boss', 22, 5, 2, 3)
    for x, y in [(7, 21), (36, 17), (14, 8)]: O.add('herbs', 'linh_thao', x, y)
    O.add('zones', 'bi_canh_sau', 21, 12, [P('r', 3)])
    O.add('auras', 'linh_mach', 22, 6, [P('r', 5), P('value', 2.8), P('label', 'Huyết Nguyệt linh mạch')])
    portal(O, 'to_phuong_thi', 19, 30, 4, 1, 'phuong_thi', 'from_huyet_nguyet')
    O.add('signs', 'bc', 22, 28, [P('text', 'Huyết Nguyệt Bí Cảnh')])
    O.add('spawns', 'spawn', 21, 28)
    O.add('spawns', 'from_phuong_thi', 21, 28)
    write('huyet_nguyet', g, O, {'name': 'Huyết Nguyệt Bí Cảnh', 'music': 'tribulation', 'aura': 2.0, 'respawn': 20})

# ═════════ Hoang Mạc Xích Hỏa ═════════
def hoang_mac():
    g = Grid(60, 36, 's')
    for y in range(g.h):
        for x in range(g.w):
            r = hrand(x, y, 21)
            if r > 0.93: g.put(x, y, 'C')
            elif r > 0.89: g.put(x, y, 'q')
    g.rect(0, 18, 40, 18, 'p'); g.rect(40, 18, 40, 27, 'p'); g.rect(38, 27, 52, 27, 'p')
    for y in range(g.h):
        for x in range(g.w):
            if (x - 14) ** 2 / 20 + (y - 27) ** 2 / 8 < 1: g.put(x, y, 'w')
            if (x - 47) ** 2 / 16 + (y - 9) ** 2 / 10 < 1: g.put(x, y, 'V')
    for (x, y) in [(10, 25), (18, 25), (12, 30), (17, 30)]: g.put(x, y, 't')
    g.rect(38, 23, 54, 31, 'k')                      # doanh trại Mặc Gia
    g.house(40, 20, 5, 2); g.house(48, 20, 5, 2); g.house(42, 29, 5, 2); g.house(50, 29, 4, 2)
    g.rect(40, 27, 40, 27, 'p')
    g.border('C'); g.rect(0, 17, 1, 19, 'p')
    O = Objs()
    npc(O, 'mac_gia_chu', 'Mặc Gia Gia Chủ', 'npc_sage', 46, 26, [{'if': {'questActive': 'm2_3'}, 'id': 'mac_gia_chu_1'}, {'if': {'flag': 'enemy3_dead'}, 'id': 'mac_gia_chu_after'}, {'id': 'mac_gia_chu_idle'}])
    npc(O, 'mac_ho_ve', 'Hộ Vệ Mặc Gia', 'npc_guard', 42, 25, [{'id': 'mac_ho_ve'}])
    npc(O, 'lu_khach', 'Lữ Khách Hoang Mạc', 'npc_merchant', 16, 23, [{'id': 'lu_khach'}], 'thuong_nhan')
    O.add('signs', 'mg', 44, 24, [P('text', 'Mặc Gia Thương Hội')])
    for grp, tex, x, y in [(['xich_hoa_thu'], 'wolf', 20, 12), (['xich_hoa_thu', 'sa_trung'], 'snake', 28, 22), (['sa_trung', 'sa_trung'], 'snake', 30, 8), (['xich_hoa_thu', 'xich_hoa_thu'], 'wolf', 34, 30), (['sa_trung'], 'snake', 8, 10)]:
        foe(O, grp, tex, x, y, 2)
    for x, y in [(12, 22), (20, 28), (6, 28), (30, 15)]: O.add('herbs', 'linh_thao', x, y)
    O.add('zones', 'mac_gia_trai', 44, 26, [P('r', 4)])
    O.add('auras', 'linh_mach', 14, 27, [P('r', 4), P('value', 1.8), P('label', 'Ốc đảo linh khí')])
    portal(O, 'to_phuong_thi', 1, 17, 1, 3, 'phuong_thi', 'from_hoang_mac')
    O.add('spawns', 'spawn', 4, 18)
    O.add('spawns', 'from_phuong_thi', 4, 18)
    write('hoang_mac', g, O, {'name': 'Hoang Mạc Xích Hỏa', 'music': 'overworld', 'aura': 1.3})

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    thanh_ha(); thanh_van_tong(); phuong_thi(); huyet_nguyet(); hoang_mac()
