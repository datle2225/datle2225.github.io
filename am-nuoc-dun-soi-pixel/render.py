#!/usr/bin/env python3
"""Vẽ video hoạt hình pixel "Ấm nước đun sôi tướng quân mộng" (truyện của Mèo Hoang).

Chạy:  python3 render.py   (cần Pillow, numpy, ffmpeg)  ->  am-nuoc-dun-soi.mp4
Mỗi cảnh được vẽ bằng từng điểm ảnh trên khung 320x144, phóng 4 lần, kèm thanh phụ đề.
"""
import math, os, random, subprocess, sys, wave, shutil
import numpy as np
from PIL import Image, ImageDraw, ImageFont

W, SH, CAP = 320, 144, 36      # rộng, cao khung cảnh, cao thanh phụ đề (pixel gốc)
H = SH + CAP
S = 4                          # hệ số phóng
FPS = 12
HERE = os.path.dirname(os.path.abspath(__file__))
FB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

def C(h): h = h.lstrip('#'); return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
SKIN, SKIN2 = C('f2c9a0'), C('d9a577')
INK = C('1a1423'); WHITE = C('f4f1e8'); RED = C('c8372d'); GOLD = C('f2b632')
WOOD = C('7a4a2b'); WOOD2 = C('54321c'); STONE = C('8d8a96'); GREEN = C('3f8f4a')
FIRE = [C('ffe066'), C('ff9f1c'), C('e8481c'), C('8f1d14')]

def R(d, x, y, w, h, c):
    if w < 1 or h < 1: return
    d.rectangle([int(x), int(y), int(x + w - 1), int(y + h - 1)], fill=c)
def P(d, x, y, c): d.point((int(x), int(y)), fill=c)

# ---------------------------------------------------------------- nhân vật
def person(d, x, y, hair, robe, t=0, pose='stand', style='m', skin=SKIN, flip=False, beard=False, robe2=None, face='n'):
    """Nhân vật chibi cao ~21px, (x,y) là điểm chân. pose: stand|walk|sit|run|cheer|write"""
    f = -1 if flip else 1
    bob = 0
    sit = pose == 'sit' or pose == 'write'
    if pose in ('walk', 'run'): bob = 1 if (t // (2 if pose == 'run' else 3)) % 2 else 0
    if pose == 'cheer': bob = 1 if (t // 3) % 2 else 0
    base = y - (6 if sit else 0)
    hy = base - 21 + bob
    robe2 = robe2 or tuple(max(0, v - 40) for v in robe)
    # chân
    if sit:
        R(d, x - 5, y - 3, 10, 3, INK)
    else:
        sw = 2 if pose in ('walk', 'run') else 0
        ph = (t // (2 if pose == 'run' else 3)) % 2
        R(d, x - 3 + (sw if ph else 0) * 0, y - 4, 3, 4, INK if True else robe2)
        R(d, x + 1, y - 4 + (1 if ph and sw else 0), 3, 4 - (1 if ph and sw else 0), INK)
        if sw and ph: R(d, x - 3, y - 4, 3, 3, INK)
    # thân
    R(d, x - 4, base - 12 + bob, 8, 9, robe)
    R(d, x - 4, base - 5 + bob, 8, 2, robe2)
    R(d, x - 4, base - 9 + bob, 8, 1, robe2)
    # tay
    if pose == 'cheer':
        up = (t // 3) % 2
        R(d, x - 6, base - 15 + bob - up, 2, 6, robe); R(d, x + 4, base - 15 + bob - up, 2, 6, robe)
        P(d, x - 6, base - 16 + bob - up, skin); P(d, x + 5, base - 16 + bob - up, skin)
    elif pose == 'write':
        R(d, x - 5, base - 10, 2, 6, robe); R(d, x + 3, base - 9 + (t // 2) % 2, 4 * f if f > 0 else 4 * f, 2, robe)
        R(d, x + (4 if f > 0 else -7), base - 9 + (t // 2) % 2, 4, 2, robe)
    else:
        sw = (1 if (t // 3) % 2 else -1) if pose in ('walk', 'run') else 0
        R(d, x - 6, base - 11 + bob + sw, 2, 6, robe); R(d, x + 4, base - 11 + bob - sw, 2, 6, robe)
        P(d, x - 6, base - 5 + bob + sw, skin); P(d, x + 5, base - 5 + bob - sw, skin)
    # đầu
    R(d, x - 4, hy, 8, 8, skin)
    P(d, x - 4, hy + 7, skin2(skin)); P(d, x + 3, hy + 7, skin2(skin))
    # tóc
    if style == 'f':
        R(d, x - 5, hy - 1, 10, 3, hair); R(d, x - 5, hy + 2, 2, 9, hair); R(d, x + 3, hy + 2, 2, 9, hair)
        R(d, x - 2, hy - 2, 4, 1, hair); P(d, x + 2 * f, hy - 3, GOLD)
    elif style == 'h':  # mũ / tướng
        R(d, x - 5, hy - 2, 10, 4, hair); R(d, x - 1, hy - 4, 2, 2, RED)
    else:
        R(d, x - 4, hy - 1, 8, 3, hair); R(d, x - 2, hy - 3, 4, 2, hair); R(d, x - 5, hy, 1, 3, hair); R(d, x + 4, hy, 1, 3, hair)
    # mặt
    ex = [-2, 1]
    if face == 'x':   # nhắm mắt
        for e in ex: R(d, x + e, hy + 4, 2, 1, INK)
    elif face == 's':  # sợ
        for e in ex: R(d, x + e, hy + 3, 2, 3, WHITE); P(d, x + e + (0 if f > 0 else 1), hy + 4, INK)
        R(d, x - 1, hy + 6, 2, 1, INK)
    else:
        blink = (t % 36) == 0
        for e in ex:
            if blink: R(d, x + e, hy + 4, 2, 1, INK)
            else: R(d, x + e, hy + 3, 1, 2, INK) if f > 0 else R(d, x + e + 1, hy + 3, 1, 2, INK)
        if face == 'h': R(d, x - 1, hy + 6, 3, 1, INK); P(d, x - 2, hy + 5, INK); P(d, x + 2, hy + 5, INK)
        else: R(d, x, hy + 6, 1, 1, C('a0524a'))
    if beard: R(d, x - 3, hy + 6, 6, 3, hair)

def skin2(s): return tuple(max(0, v - 25) for v in s)

def kettle(d, x, y, t, steam=True, big=1):
    R(d, x - 5, y - 8, 10, 8, C('4b4b5a')); R(d, x - 4, y - 9, 8, 1, C('4b4b5a'))
    R(d, x - 4, y - 7, 2, 4, C('777788'))
    R(d, x + 5, y - 7, 3, 2, C('4b4b5a')); P(d, x + 8, y - 8, C('4b4b5a'))   # vòi
    R(d, x - 3, y - 12, 6, 1, C('4b4b5a')); P(d, x - 4, y - 11, C('4b4b5a')); P(d, x + 3, y - 11, C('4b4b5a'))
    if steam: steam_col(d, x + 9, y - 9, t)

def steam_col(d, x, y, t, h=26, col=C('eef2f7')):
    for i in range(7):
        ph = (t * 1.1 + i * 4.5) % h
        px = x + math.sin((t + i * 5) * 0.35) * (2 + ph * 0.1)
        s = 2 if ph < h * 0.6 else 1
        if ph < h - 2: R(d, px, y - ph, s, s, col)

# ---------------------------------------------------------------- phông nền
def sky_bands(d, top, bot, y0, y1, n=8):
    for i in range(n):
        c = tuple(int(top[k] + (bot[k] - top[k]) * i / (n - 1)) for k in range(3))
        R(d, 0, y0 + (y1 - y0) * i // n, W, (y1 - y0) // n + 1, c)

def stars(d, t, seed=1, n=36, ymax=60):
    rnd = random.Random(seed)
    for i in range(n):
        x, y = rnd.randrange(W), rnd.randrange(ymax)
        if (t // 4 + i) % 5: P(d, x, y, WHITE)
        elif i % 2: P(d, x, y, C('9aa7d8'))

def moon(d, x, y):
    R(d, x - 5, y - 7, 10, 14, C('f3eac2')); R(d, x - 7, y - 5, 14, 10, C('f3eac2')); R(d, x - 3, y - 9, 6, 18, C('f3eac2'))
    R(d, x + 1, y - 4, 3, 3, C('d9cf9d')); R(d, x - 4, y + 2, 2, 2, C('d9cf9d'))

def cloud(d, x, y, c=WHITE):
    R(d, x, y + 3, 22, 4, c); R(d, x + 3, y, 8, 4, c); R(d, x + 10, y + 1, 8, 3, c)

def mountain(d, pts_x, base, h, c, c2=None):
    for x in range(W):
        yy = 0
        for (cx, ch, w) in pts_x:
            yy = max(yy, ch - abs(x - cx) * ch / w)
        if yy > 0: R(d, x, base - yy, 1, yy + 1, c)

def ground(d, y, c, c2):
    R(d, 0, y, W, SH - y, c)
    for x in range(0, W, 8): P(d, x + (y % 5), y + 2 + (x % 3), c2)

def roof(d, x, y, w, c, c2):
    for i in range(6):
        R(d, x - i * 2 + 0, y + i * 2 - 6, w + i * 4 - 0, 2, c if i % 2 == 0 else c2) if False else None
    h = 7
    for i in range(h):
        R(d, x - h + i + 1, y - h + i, w + 2 * (h - i - 1) , 1, c if i % 2 == 0 else c2) if False else None
    for i in range(6):
        R(d, x - 5 + i, y - 6 + i, w + 10 - 2 * i, 1, c if i % 2 else c2)
    R(d, x - 6, y, w + 12, 2, c2)

def house(d, x, y, w, h, wall, rf, rf2, door=True, lit=False):
    R(d, x, y - h, w, h, wall)
    roof(d, x, y - h, w, rf, rf2)
    R(d, x, y - h, 2, h, WOOD); R(d, x + w - 2, y - h, 2, h, WOOD)
    if door: R(d, x + w // 2 - 4, y - 14, 8, 14, WOOD2 if not lit else GOLD)
    if lit: R(d, x + 4, y - h + 5, 6, 6, GOLD)

def lantern(d, x, y, t):
    R(d, x, y, 1, 4, INK); R(d, x - 2, y + 4, 5, 6, RED if (t // 6) % 6 else C('e0553a')); R(d, x - 1, y + 10, 3, 1, GOLD)
    R(d, x - 1, y + 5, 3, 4, GOLD)

def tent(d, x, y, w, c, c2):
    for i in range(w // 2):
        R(d, x + i, y - i * 12 // (w // 2) - 1, w - 2 * i, 1, c if i % 2 else c2) if False else None
    h = 16
    for i in range(h):
        ww = w * (h - i) // h
        R(d, x + (w - ww) // 2, y - i - 1, max(ww, 1), 1, c if (i // 2) % 2 else c2)
    R(d, x + w // 2 - 3, y - 9, 6, 9, INK)

def sack(d, x, y, c=C('d9c9a0')):
    R(d, x, y - 7, 9, 7, c); R(d, x + 1, y - 8, 7, 1, c); R(d, x + 3, y - 9, 3, 1, c)
    R(d, x + 1, y - 5, 7, 1, C('b6a47a')); P(d, x + 4, y - 3, C('b6a47a'))

def cart(d, x, y, load=True, burn=0, t=0):
    R(d, x, y - 8, 18, 4, WOOD); R(d, x + 2, y - 4, 14, 1, WOOD2)
    for wx in (x + 3, x + 12):
        R(d, wx - 2, y - 5, 5, 5, WOOD2); R(d, wx - 1, y - 4, 3, 3, WOOD)
    if load:
        R(d, x + 1, y - 14, 16, 6, C('d9c9a0')); R(d, x + 1, y - 11, 16, 1, C('b6a47a'))
    if burn: flames(d, x + 9, y - 12, t, burn)

def flames(d, x, y, t, size=1.0, seed=0):
    rnd = random.Random(seed + t // 2)
    n = int(10 * size) + 4
    for i in range(n):
        ox = (rnd.random() - .5) * 14 * size
        h = rnd.random() * 14 * size + 3
        w = max(1, int(3 * size * (1 - 0.3 * rnd.random())))
        col = FIRE[min(3, int(rnd.random() * 2 + (1 - h / (17 * size)) * 2.2))]
        R(d, x + ox - w / 2, y - h, w, h, col)
    for i in range(5):  # tàn lửa
        ph = (t * 1.4 + i * 7) % 24
        P(d, x + math.sin(i * 3 + t * .2) * 8 * size, y - 14 * size - ph, FIRE[0] if i % 2 else FIRE[1])

def coin_chest(d, x, y, t, open_=1.0):
    R(d, x, y - 10, 20, 10, WOOD); R(d, x, y - 7, 20, 2, GOLD); R(d, x + 9, y - 8, 2, 4, GOLD)
    lid = int(8 * open_)
    R(d, x - 1, y - 14 - lid, 22, 4, WOOD2); R(d, x - 1, y - 12 - lid, 22, 1, GOLD)
    if open_ > .3:
        R(d, x + 1, y - 11, 18, 3, GOLD)
        for i in range(8): P(d, x + 2 + (i * 5 + t) % 17, y - 12 - (i * 3 + t // 2) % 5, WHITE if (t + i) % 6 < 2 else GOLD)

def crate_stack(d, x, y, n=3):
    for i in range(n):
        R(d, x, y - 8 * (i + 1), 16, 8, WOOD); R(d, x + 1, y - 8 * (i + 1) + 1, 14, 6, C('9b6a3d'))
        R(d, x + 7, y - 8 * (i + 1), 2, 8, WOOD2)

def arrow(d, x, y, c=WHITE):
    R(d, x, y, 7, 1, c); P(d, x + 7, y, RED); P(d, x - 1, y - 1, c); P(d, x - 1, y + 1, c)

def horse(d, x, y, t, body=C('5a3b2e'), rider=None, flip=False, run=True):
    f = -1 if flip else 1
    def r(dx, dy, w, h, c): R(d, x + (dx if f > 0 else -dx - w + 1), y + dy, w, h, c)
    g = (t // 2) % 2
    r(-9, -12, 18, 7, body); r(-9, -12, 18, 1, tuple(v + 20 for v in body))
    r(6, -18, 5, 8, body); r(9, -17, 4, 4, body); r(6, -20, 2, 3, body)  # cổ đầu
    r(5, -19, 1, 5, INK)     # bờm
    r(-11, -11, 2, 5, INK)   # đuôi
    for i, lx in enumerate((-8, -5, 3, 6)):
        up = g if i % 2 == 0 else 1 - g
        r(lx, -5 - (2 if (run and up) else 0), 2, 5 + (0), body if i % 2 else tuple(v - 15 for v in body))
    if rider:
        person(d, x + (-1 * f), y - 8 + (1 if g else 0), rider[0], rider[1], t, pose='stand', style=rider[2], flip=flip)

# ---------------------------------------------------------------- tiện ích hiệu ứng
def bubble_q(d, x, y, t, ch='?'):
    b = int(math.sin(t * .5) * 1.5)
    R(d, x - 4, y - 8 + b, 9, 9, WHITE); P(d, x - 1, y + 1 + b, WHITE)
    if ch == '?':
        R(d, x - 2, y - 7 + b, 4, 1, INK); P(d, x + 2, y - 6 + b, INK); R(d, x, y - 5 + b, 2, 1, INK); P(d, x, y - 3 + b, INK); P(d, x, y - 1 + b, INK)
    else:
        R(d, x - 1, y - 7 + b, 2, 5, RED); R(d, x - 1, y - 1 + b, 2, 1, RED)

def heart(d, x, y, c=C('ff5d8f')):
    R(d, x - 3, y - 3, 3, 2, c); R(d, x + 1, y - 3, 3, 2, c); R(d, x - 4, y - 2, 9, 3, c); R(d, x - 3, y + 1, 7, 1, c)
    R(d, x - 2, y + 2, 5, 1, c); R(d, x - 1, y + 3, 3, 1, c)

def sparkle(d, x, y, t, c=GOLD):
    k = (t // 2) % 3
    if k == 0: P(d, x, y, c)
    elif k == 1: R(d, x - 1, y, 3, 1, c); R(d, x, y - 1, 1, 3, c)
    else: R(d, x - 2, y, 5, 1, c); R(d, x, y - 2, 1, 5, c)

def lerp(a, b, p): return a + (b - a) * min(1, max(0, p))
def ease(p): p = min(1, max(0, p)); return p * p * (3 - 2 * p)

# ---------------------------------------------------------------- các cảnh
# mỗi cảnh: (thời lượng giây, hàm vẽ(d, t, n) -> danh sách chữ phủ, phụ đề)
# chữ phủ: (text, x, y, size, color) theo toạ độ pixel gốc

def sc_title(d, t, n):
    sky_bands(d, C('0d1030'), C('3a2a63'), 0, SH, 12); stars(d, t, 3, 60, 90); moon(d, 262, 28)
    mountain(d, [(40, 34, 70), (120, 26, 50), (230, 38, 90)], SH - 8, 0, C('201a3d'))
    ground(d, SH - 20, C('2b2144'), C('3b2f5c'))
    # mái nhà xa
    house(d, 20, SH - 20, 40, 18, C('4a3a63'), C('2a2547'), C('3b3361'), door=False)
    house(d, 250, SH - 20, 46, 20, C('4a3a63'), C('2a2547'), C('3b3361'), door=False, lit=True)
    kettle(d, 160, SH - 18, t, steam=False)
    # hơi nước dần tạo hình tướng quân cưỡi ngựa
    p = ease((t - 8) / 40)
    steam_col(d, 169, SH - 28, t, h=36)
    if p > 0:
        col = tuple(int(c0 * (0.35 + .65 * p) + 12 * (1 - p)) for c0 in C('eef2f7'))
        ox, oy = 170 + int(p * 22), SH - 70 - int(p * 8)
        # bóng ngựa + tướng quân bằng hơi nước
        R(d, ox, oy, 22, 8, col); R(d, ox + 18, oy - 6, 5, 8, col); R(d, ox + 20, oy - 8, 4, 4, col)
        for lx in (1, 6, 15, 19): R(d, ox + lx, oy + 8, 2, 7, col)
        R(d, ox + 6, oy - 10, 7, 10, col); R(d, ox + 7, oy - 16, 5, 5, col); R(d, ox + 6, oy - 18, 7, 2, col); R(d, ox + 13, oy - 14, 1, 14, col)
        sparkle(d, ox + 12, oy - 22, t)
    return [("ẤM NƯỚC ĐUN SÔI", 160, 22, 20, WHITE), ("TƯỚNG QUÂN MỘNG", 160, 44, 20, GOLD), ("Truyện của Mèo Hoang  •  hoạt hình pixel", 160, 128, 7, C('c9c2e8'))]

def sc_street(d, t, n):
    sky_bands(d, C('7ec8f0'), C('d8f0ff'), 0, 70, 6); cloud(d, (t * .3) % 360 - 30, 14); cloud(d, (t * .2 + 160) % 360 - 30, 30)
    # tường thành xa
    R(d, 0, 52, W, 22, C('b9a98f'))
    for x in range(0, W, 10): R(d, x, 48, 6, 4, C('b9a98f'))
    ground(d, 74, C('d9c08b'), C('c4a86f'))
    house(d, 14, 92, 56, 34, C('e6d3a8'), C('9a3d2f'), C('b8503d'), door=False)
    R(d, 24, 66, 36, 9, RED); R(d, 25, 67, 34, 7, GOLD)  # biển hiệu
    for i in range(5): R(d, 28 + i * 6, 69, 3, 3, RED)    # nét "chữ"
    R(d, 28, 76, 28, 16, WOOD2); R(d, 30, 78, 24, 14, C('2a1810'))  # cửa hàng
    house(d, 238, 94, 62, 38, C('e6d3a8'), C('2f5a8f'), C('3f72ae'), door=True)
    ground(d, 95, C('c4a86f'), C('a98d55'))
    for x in range(0, W, 24): R(d, x + (t * 0) , 120, 10, 2, C('b0945c'))
    # NPC đi ngang
    px = (t * 1.6) % 360 - 20; person(d, px, 112, INK, C('5a8a3c'), t, 'walk', 'm')
    px2 = 340 - (t * 1.2) % 380; person(d, px2, 124, C('4a2a1a'), C('a85d8a'), t, 'walk', 'f', flip=True)
    # nhân vật chính ngồi xổm với ấm nước
    kettle(d, 112, 112, t); person(d, 96, 112, INK, C('3f6fb5'), t, 'sit', 'm', face='x' if (t // 18) % 4 == 3 else 'n')
    if t > n * .55:
        # tiếng cha gọi
        R(d, 176, 70, 52, 17, WHITE); P(d, 190, 87, WHITE); P(d, 189, 88, WHITE)
        return [("Lục Trường An! Vào đây!", 202, 78, 7, INK)]
    return []

def sc_notice(d, t, n):
    sky_bands(d, C('9fb0c8'), C('d8dde6'), 0, 70, 6); cloud(d, 30, 16, C('c8ced8')); cloud(d, 220, 24, C('c8ced8'))
    ground(d, 74, C('cdb888'), C('b79f6c'))
    # bảng thông báo
    R(d, 138, 38, 4, 54, WOOD2); R(d, 178, 38, 4, 54, WOOD2); R(d, 128, 30, 64, 40, C('e8dcb5')); R(d, 128, 30, 64, 2, WOOD); R(d, 128, 68, 64, 2, WOOD)
    for i in range(5): R(d, 136, 38 + i * 6, 40 - (i % 2) * 8, 2, C('7a6a45'))
    R(d, 172, 56, 12, 12, RED); R(d, 175, 59, 6, 6, C('f4d9d6'))
    # đám đông & nhân vật
    person(d, 92, 108, INK, C('8a3a3a'), t, 'stand', 'm', flip=False, beard=True, hair=C('5a5a66')) if False else None
    person(d, 100, 112, C('5a5a66'), C('8a3a3a'), t, 'stand', 'm', beard=True)          # cha
    person(d, 72, 112, C('2a1a14'), C('7b4fa8'), t, 'stand', 'f')                          # chị
    person(d, 160, 116, INK, C('3f6fb5'), t, 'stand', 'm', face='s')                       # Trường An
    person(d, 230, 112, C('5a4a3a'), C('4a4a56'), t, 'walk', 'h', flip=True)
    bubble_q(d, 160, 90, t, '!')
    # tia sét/chiến sự phương bắc
    if (t // 5) % 3 == 0: R(d, 250, 8, 2, 14, GOLD); R(d, 252, 20, 2, 8, GOLD)
    mountain(d, [(280, 30, 50)], 74, 0, C('5f6a86'))
    return [("Chiến sự phương Bắc", 275, 16, 7, WHITE)]

def sc_dream(d, t, n):
    sky_bands(d, C('0b0d28'), C('2c2457'), 0, SH, 12); stars(d, t, 7, 50, 70); moon(d, 40, 26)
    ground(d, 100, C('2a2038'), C('3b2d4d'))
    house(d, 220, 100, 70, 40, C('4d3d61'), C('231d3d'), C('36295a'), door=False, lit=True)
    lantern(d, 212, 70, t)
    person(d, 120, 124, INK, C('3f6fb5'), t, 'sit', 'm', face='x' if t > 20 else 'n'); kettle(d, 136, 124, t, steam=False)
    # hơi nước dâng lên → tướng quân cưỡi ngựa trên mây
    p = ease((t - 6) / (n * .6))
    steam_col(d, 145, 115, t, h=30)
    if p > 0:
        col = tuple(int(a * .25 + b * .75 * p) for a, b in zip(C('2c2457'), C('eef2f7')))
        ox = 140 + int(p * 40); oy = 90 - int(p * 24)
        for j in range(4): cloud(d, ox - 14 + j * 9, oy + 24 + (j % 2) * 3, tuple(int(v * .6) for v in col))
        R(d, ox, oy, 26, 9, col); R(d, ox + 22, oy - 7, 6, 9, col); R(d, ox + 25, oy - 10, 5, 5, col); R(d, ox + 23, oy - 12, 2, 3, col)
        for lx in (1, 7, 17, 22): R(d, ox + lx, oy + 9, 3, 8 + (t // 3 + lx) % 2, col)
        R(d, ox - 4, oy - 2, 4, 3, col)
        R(d, ox + 8, oy - 12, 8, 12, col); R(d, ox + 9, oy - 19, 6, 6, col); R(d, ox + 8, oy - 21, 8, 2, col); R(d, ox + 16, oy - 26, 1, 16, col)
        R(d, ox + 17, oy - 26, 8, 4, RED)
        for i in range(4): sparkle(d, ox - 6 + i * 11, oy - 20 + (i * 7) % 12, t + i * 2, WHITE)
    return []

def sc_enlist(d, t, n):
    sky_bands(d, C('9ad0f0'), C('d8f0ff'), 0, 66, 6); cloud(d, 60, 14); cloud(d, 210, 22)
    mountain(d, [(60, 28, 90), (250, 36, 110)], 70, 0, C('8fa6b8'))
    ground(d, 66, C('b49b6a'), C('9d8556'))
    tent(d, 14, 92, 44, C('c8372d'), C('a82a22')); tent(d, 262, 92, 44, C('2f5a8f'), C('284a78'))
    R(d, 84, 28, 2, 40, WOOD2); R(d, 86, 28, 22 + int(math.sin(t * .4) * 2), 12, RED)   # cờ
    # quan tuyển binh + Trường An + Triệu Hổ
    person(d, 190, 114, C('2a2a33'), C('b8402f'), t, 'stand', 'h', beard=True, robe2=C('7a2a20'), skin=SKIN)
    person(d, 130, 120, INK, C('3f6fb5'), t, 'stand', 'm', face='s' if t < n * .7 else 'n')
    q = ['?', '?', '?', '!']
    k = min(3, int(t / (n / 4)))
    bubble_q(d, 196, 86, t, '?') if k < 3 else None
    # câu trả lời "Không" lần lượt hiện
    if k < 3:
        txt = ["Biết đánh nhau không?", "Biết cưỡi ngựa không?", "Biết nấu cơm không?"][k]
        R(d, 140, 66, 112, 14, WHITE); P(d, 184, 80, WHITE)
        out = [(txt, 196, 73, 7, INK)]
        if (t % int(n / 4)) > n / 8:
            out.append(("Không...", 130, 92, 8, WHITE))
        return out
    # Triệu Hổ khiêng bao gạo đi vào
    hx = lerp(330, 240, (t - 3 * n / 4) / (n / 4))
    person(d, hx, 122, C('3a2a1a'), C('5a8a3c'), t, 'walk', 'm', flip=True)
    sack(d, hx - 6, 100)
    R(d, 140, 66, 112, 14, WHITE); P(d, 184, 80, WHITE)
    return [("Biết đun nước. – Vào quân nhu!", 196, 73, 7, INK)]

def sc_granary(d, t, n):
    R(d, 0, 0, W, SH, C('3a2a22')); R(d, 0, 0, W, 70, C('4a362c'))
    for x in range(0, W, 20): R(d, x, 0, 2, 70, C('2b1d17'))
    R(d, 0, 70, W, 74, C('6b5033'));
    for y in range(76, SH, 12): R(d, 0, y, W, 1, C('5a4129'))
    # cửa sổ có ánh sáng
    R(d, 250, 18, 34, 28, C('f6e4a3')); R(d, 265, 18, 2, 28, WOOD2); R(d, 250, 31, 34, 2, WOOD2)
    # chồng bao gạo – biến mất dần
    gone = int(ease(t / (n * .8)) * 10)
    k = 0
    for row in range(3):
        for col in range(5):
            idx = row * 5 + col
            if idx >= 15 - gone - 3 and idx < 15 - gone + 0 and False: pass
            if (idx * 7) % 15 >= 15 - gone * 1: continue
            sack(d, 24 + col * 28 + (row % 2) * 10, 108 - row * 9)
    # kẻ trộm bóng đen cõng bao gạo (xuất hiện chớp nhoáng)
    ph = (t // 6) % 6
    if ph in (2, 3) and gone > 1:
        tx = 70 + ((t * 3) % 200)
        person(d, tx, 126, INK, INK, t, 'walk', 'm', skin=INK); sack(d, tx - 4, 112, C('3a3a40'))
    person(d, 224, 128, INK, C('3f6fb5'), t, 'sit', 'm', face='s' if gone > 3 else 'n')
    person(d, 262, 128, C('3a2a1a'), C('5a8a3c'), t, 'stand', 'm', face='s' if gone > 3 else 'n')
    # sổ sách
    R(d, 200, 112, 16, 10, WHITE); R(d, 200, 112, 16, 1, INK); R(d, 207, 112, 2, 10, C('c8c0a8'))
    out = [("SỔ: 450 bao", 60, 14, 8, GOLD), ("THỰC TẾ: %d bao" % (450 - int(gone * 8)), 60, 28, 8, C('ff9f9f') if gone > 4 else WHITE)]
    if gone > 5: bubble_q(d, 224, 92, t, '!')
    return out

def sc_ambush(d, t, n):
    sky_bands(d, C('140b22'), C('4a1d1c'), 0, SH, 12); stars(d, t, 11, 30, 40)
    mountain(d, [(40, 50, 90), (160, 38, 70), (280, 56, 100)], 100, 0, C('1f1228'))
    # sườn dốc
    for x in range(W):
        yy = 96 + (x * 38 // W if False else 0)
    for x in range(W):
        top = 98 + max(0, (x - 170) * 0.35)
        R(d, x, top, 1, SH - top, C('2d2132'));
    ground(d, 120, C('2d2132'), C('3d2f44'))
    for x in range(180, W):
        yy = 98 + (x - 170) * 0.35
        P(d, x, yy, C('4a3a52'))
    # xe lương đang cháy
    for i, cx in enumerate((18, 52, 86)):
        cart(d, cx, 116, burn=1.0 + (i % 2) * .3, t=t)
    # xe được đẩy xuống dốc
    sp = ease(t / n)
    cx = 120 + sp * 160; cy = 104 + max(0, (cx - 170) * .35)
    cart(d, cx, cy, load=True)
    person(d, 112 + sp * 12, 120 + 0, INK, C('3f6fb5'), t, 'run', 'm', face='s')
    person(d, 100, 120, C('3a2a1a'), C('5a8a3c'), t, 'run', 'm', face='s') if False else None
    # kỵ binh địch phi ngang, tên bay
    for k in range(2):
        hx = (t * 4 + k * 140) % 420 - 40
        horse(d, hx, 92 - k * 0, t + k, body=C('2a2a33'), rider=(C('1a1a22'), C('5a1a1a'), 'h'), flip=False)
        arrow(d, hx + 18 + (t * 3) % 30, 66 + k * 14)
    return [("TẬP KÍCH!", 60, 18, 12, GOLD)] if (t // 4) % 2 else []

def sc_family(d, t, n):
    R(d, 0, 0, W, SH, C('5b3f2c')); R(d, 0, 0, W, 76, C('7a5a3c'))
    for x in range(0, W, 28): R(d, x, 0, 2, 76, C('4d3322'))
    R(d, 0, 76, W, 68, C('9b7149'))
    for y in range(82, SH, 14): R(d, 0, y, W, 1, C('85603c'))
    lantern(d, 80, 8, t); lantern(d, 240, 8, t)
    # bàn
    R(d, 112, 94, 100, 6, WOOD); R(d, 120, 100, 4, 24, WOOD2); R(d, 200, 100, 4, 24, WOOD2)
    for bx in (126, 150, 178): R(d, bx, 90, 8, 4, WHITE); R(d, bx + 1, 91, 6, 2, C('c9a15a'))
    person(d, 100, 118, C('5a5a66'), C('8a3a3a'), t, 'sit', 'm', beard=True, face='h' if t > n * .5 else 'n')       # cha
    person(d, 222, 118, C('2a1a14'), C('7b4fa8'), t, 'sit', 'f', flip=True)                                           # chị
    person(d, 160, 122, INK, C('3f6fb5'), t, 'sit', 'm', face='x' if t % 24 < 4 else 'n')
    # rương tiền mở ra khi cha gật đầu
    op = ease((t - n * .45) / (n * .3))
    coin_chest(d, 258, 130, t, op)
    if op > .1:
        for i in range(6): sparkle(d, 252 + i * 7, 100 - (i * 5) % 14, t + i)
    return [("Buôn bán cũng là đánh trận!", 160, 44, 9, GOLD)] if t > n * .25 else []

def sc_market(d, t, n):
    sky_bands(d, C('ffd6a0'), C('fff0d0'), 0, 60, 6)
    ground(d, 60, C('d9c08b'), C('c4a86f'))
    # 3 quầy thương nhân
    for i, (sx, col) in enumerate(((16, C('c8372d')), (112, C('2f8f6b')), (208, C('8a4fa8')))):
        R(d, sx, 62, 96, 6, col); R(d, sx, 68, 96, 3, tuple(max(0, v - 50) for v in col))
        for j in range(6): R(d, sx + j * 16, 58, 8, 4, WHITE)
        R(d, sx + 4, 76, 4, 22, WOOD2); R(d, sx + 88, 76, 4, 22, WOOD2); R(d, sx, 94, 96, 6, WOOD)
        for j in range(4): sack(d, sx + 8 + j * 22, 94)
        person(d, sx + 48, 130 - 12, C('2a2a33'), col, t, 'stand', 'm', face='s' if t > n * .5 else 'n')
    # giá tụt dần
    price = int(lerp(90, 52, ease(t / (n * .85))))
    person(d, 160, 138, INK, C('3f6fb5'), t, 'cheer' if t > n * .7 else 'stand', 'm', face='h' if t > n * .6 else 'n')
    for i in range(3): R(d, 40 + i * 96, 100, 50, 12, C('f6e4a3')) if False else None
    out = []
    for i, sx in enumerate((16, 112, 208)):
        pi = max(50, price - i * 4 + 2)
        R(d, sx + 28, 99, 40, 11, C('f6e4a3'))
        out.append(("%d quan" % pi, sx + 48, 104, 8, RED))
    if t > n * .8: [sparkle(d, 150 + i * 8, 100 - i * 3, t + i) for i in range(5)]
    return out + ([("↓ Giá gạo giảm!", 160, 14, 10, C('7a1a10'))] if (t // 4) % 2 or t < n * .5 else [])

def sc_letter(d, t, n):
    sky_bands(d, C('0b0d28'), C('2c2457'), 0, SH, 12); stars(d, t, 5, 40, 60); moon(d, 160, 20)
    # trái: Trường An viết thư ở quân doanh
    R(d, 0, 100, 160, 44, C('2a2038')); R(d, 160, 100, 160, 44, C('3a2a28'))
    R(d, 160, 20, 1, 124, C('120c1c'))
    R(d, 22, 104, 56, 5, WOOD); R(d, 26, 109, 4, 14, WOOD2); R(d, 70, 109, 4, 14, WOOD2)
    person(d, 50, 112, INK, C('3f6fb5'), t, 'write', 'm')
    R(d, 54, 98, 12, 6, WHITE)
    lantern(d, 88, 72, t)
    # phải: Tô Vãn Ninh đọc thư
    house(d, 190, 104, 100, 50, C('4d3d61'), C('231d3d'), C('36295a'), door=False, lit=True)
    person(d, 250, 122, C('2a1a14'), C('e8a0c0'), t, 'stand', 'f', face='h' if t > n * .45 else 'n')
    # thư bay qua
    p = ease((t - 6) / (n * .5))
    if 0 < p < 1:
        lx = lerp(70, 238, p); ly = 90 - math.sin(p * math.pi) * 40
        R(d, lx, ly, 10, 7, WHITE); R(d, lx, ly, 10, 1, C('c8c0a8')); P(d, lx + 4, ly + 3, RED)
        sparkle(d, lx - 4, ly + 6, t, GOLD)
    if t > n * .5:
        for i in range(3):
            ph = (t * 1.2 + i * 8) % 30
            heart(d, 255 + math.sin(i * 2 + t * .2) * 6, 94 - ph, C('ff5d8f'))
        R(d, 244, 108, 12, 7, WHITE)
    return [("Nếu còn sống thì trả lời thư.", 232, 14, 7, C('f3eac2')), ("Ta sẽ trở về.", 70, 14, 8, C('9fd0ff'))] if t > n * .45 else [("Gửi kẻ từng hỏi giá trà…", 70, 14, 7, C('9fd0ff'))]

def sc_pact(d, t, n):
    sky_bands(d, C('9ad0f0'), C('e8f6ff'), 0, 60, 6); cloud(d, 40, 14); cloud(d, 230, 20)
    ground(d, 60, C('d9c08b'), C('c4a86f'))
    # hai kho: LỤC và TÔ
    for sx, col, name in ((18, C('b83a2f'), 'LỤC'), (194, C('2f8f6b'), 'TÔ')):
        house(d, sx, 100, 108, 44, C('e6d3a8'), col, tuple(max(0, v - 30) for v in col), door=False)
        R(d, sx + 40, 78, 28, 22, WOOD2)
        R(d, sx + 38, 60, 32, 10, col)
        for k in range(4): R(d, sx + 44, 100 - 8, 4, 8, WOOD)
        # cờ
        R(d, sx + 6, 46, 2, 22, WOOD2); R(d, sx + 8, 46, 14 + int(math.sin(t * .5) * 2), 9, col)
    # đám đông xếp hàng nhận gạo
    for i in range(5):
        px = 110 + i * 15 + int((t * (1 + i * .1)) % 3)
        person(d, px, 112 + (i % 2) * 8, [INK, C('4a2a1a'), C('5a5a66'), C('2a1a14'), INK][i], [C('5a8a3c'), C('a85d8a'), C('c89b3c'), C('3f8f8f'), C('8a5a3a')][i], t + i * 2, 'walk' if (t // 8 + i) % 3 else 'stand', 'f' if i % 2 else 'm')
    # Thanh Dao, Vãn Ninh, Lục Thành bắt tay
    person(d, 72, 122, C('5a5a66'), C('8a3a3a'), t, 'stand', 'm', beard=True, face='h')
    person(d, 250, 122, C('2a1a14'), C('e8a0c0'), t, 'stand', 'f', face='h', flip=True)
    person(d, 100, 130, C('2a1a14'), C('7b4fa8'), t, 'stand', 'f', face='h')
    for i in range(3): sparkle(d, 150 + i * 10, 40 + (i * 7) % 12, t + i * 2)
    price = int(lerp(70, 40, ease(t / n)))
    R(d, 134, 68, 52, 14, C('f6e4a3'))
    return [("Giá gạo: %d quan" % price, 160, 75, 7, RED), ("Lục gia + Tô gia: cùng mở kho!", 160, 12, 8, C('7a1a10'))]

def sc_cliff(d, t, n):
    sky_bands(d, C('0a0618'), C('2b1230'), 0, SH, 12); stars(d, t, 9, 30, 50)
    mountain(d, [(40, 46, 80), (170, 34, 70), (290, 50, 90)], 104, 0, C('1b1128'))
    ground(d, 104, C('241a2e'), C('33263f'))
    R(d, 0, 124, W, 4, C('3a2c46'))
    # cổng thành
    R(d, 250, 54, 70, 56, C('4a4658'));
    for x in range(250, 320, 10): R(d, x, 48, 6, 6, C('4a4658'))
    R(d, 266, 76, 26, 34, INK)
    # kỵ sĩ phi vào
    hx = lerp(-30, 232, ease(t / n))
    horse(d, hx, 126, t, body=C('6b4a3a'), rider=(INK, C('3f6fb5'), 'm'))
    R(d, hx + 18, 110, 3, 3, RED) if False else None
    # bụi
    for i in range(6):
        ph = (t * 1.5 + i * 5) % 20
        R(d, hx - 12 - ph, 122 - i % 3, 3, 2, C('6a5a74'))
    # Lục Thành & Thanh Dao chờ ở cổng
    person(d, 280, 126, C('5a5a66'), C('8a3a3a'), t, 'stand', 'm', beard=True, face='s', flip=True) if t > n * .6 else None
    out = []
    if t > n * .5:
        R(d, 80, 30, 160, 28, C('1b1128')); R(d, 82, 32, 156, 24, INK)
        out = [("Phương Bắc có biến…", 160, 42, 9, C('ff9f9f')), ("CÒN TIẾP...", 160, 52, 8, GOLD)]
    return out

SCENES = [
    (6, sc_title, "Mở đầu • Một câu chuyện về chiến tranh... và những ấm nước."),
    (8, sc_street, "Năm Vĩnh Hòa thứ mười bảy, thành Bình Giang. Lục Trường An, mười chín tuổi, chỉ giỏi mỗi việc... đun nước."),
    (7, sc_notice, "Chiến sự nổ ra ở phương Bắc. Triều đình ban lệnh trưng binh: nhà nào cũng phải giao một nam đinh."),
    (7, sc_dream, "Đêm ấy, bên ấm nước, cậu mơ một giấc mộng lạ: mặc áo giáp, cưỡi ngựa trở về qua cổng thành."),
    (8, sc_enlist, "Nhập ngũ: biết đánh nhau không? Không. Biết cưỡi ngựa không? Không. Biết đun nước? Có! — Vào quân nhu."),
    (8, sc_granary, "Kho lương hụt tám mươi bao gạo. Có kẻ đang ăn cắp lương của quân đội..."),
    (8, sc_ambush, "Đêm quân địch tập kích. Trường An liều đẩy xe xuống sườn dốc, cứu được sáu mươi ba xe lương."),
    (8, sc_family, "Về Bình Giang, cha mở kho: \"Buôn bán cũng là đánh trận.\" Cả gia sản được đặt lên bàn cược."),
    (8, sc_market, "Ba ngày, Trường An khiến thương nhân tự hạ giá, mua đủ lương cho cả quân đội."),
    (8, sc_letter, "Một lá thư không tên: \"Nếu còn sống thì trả lời thư.\" — Tô Vãn Ninh. Cậu viết lại: \"Ta sẽ trở về.\""),
    (8, sc_pact, "Lục gia và Tô gia bắt tay, cùng mở kho bán lương giá rẻ. Giá gạo sụt, cả thành thở phào."),
    (8, sc_cliff, "Nhưng đêm ấy, một kỵ sĩ đẫm máu phi vào thành: Bắc Quan thất thủ. Cuộc chiến thật sự mới bắt đầu."),
]

# ---------------------------------------------------------------- dựng khung hình
_fonts = {}
def font(sz, bold=True):
    k = (sz, bold)
    if k not in _fonts: _fonts[k] = ImageFont.truetype(FB if bold else FR, sz)
    return _fonts[k]

def wrap(text, fnt, maxw, d):
    lines, cur = [], ""
    for w in text.split(" "):
        tr = (cur + " " + w).strip()
        if d.textlength(tr, font=fnt) <= maxw: cur = tr
        else: lines.append(cur); cur = w
    lines.append(cur)
    return lines

def render_frame(si, t, n, caption):
    img = Image.new("RGB", (W, H), C('120d1f'))
    d = ImageDraw.Draw(img)
    overlay = SCENES[si][1](d, t, n) or []
    # phóng 4 lần (nearest) rồi vẽ chữ & phụ đề ở độ phân giải cao
    big = img.resize((W * S, H * S), Image.NEAREST)
    bd = ImageDraw.Draw(big)
    for (txt, x, y, sz, col) in overlay:
        f = font(int(sz * S * 0.72))
        w = bd.textlength(txt, font=f)
        bd.text((x * S - w / 2 + 2, y * S - sz * S * 0.36 + 2), txt, font=f, fill=INK)
        bd.text((x * S - w / 2, y * S - sz * S * 0.36), txt, font=f, fill=col)
    # thanh phụ đề
    cy = SH * S
    bd.rectangle([0, cy, W * S, H * S], fill=C('120d1f'))
    bd.rectangle([0, cy, W * S, cy + 4], fill=GOLD)
    f = font(21)
    shown = caption[: int(len(caption) * min(1, (t + 1) / max(1, n * 0.55)))]
    lines = wrap(caption, f, W * S - 60, bd)
    # chỉ hiển thị phần đã gõ (typewriter) nhưng giữ bố cục
    pos = 0
    y = cy + 20
    for ln in lines:
        part = shown[pos: pos + len(ln) + 1]
        bd.text((30, y), part.strip(), font=f, fill=WHITE)
        pos += len(ln) + 1
        y += 32
    # thanh tiến độ
    tot = sum(s[0] for s in SCENES)
    return big

def make_audio(path, total_s):
    sr = 22050
    N = int(sr * total_s)
    out = np.zeros(N, dtype=np.float32)
    scale = [0, 3, 5, 7, 10, 12, 15]   # âm giai cung nhạc (pentatonic nhỏ)
    base = 220.0
    rnd = random.Random(5)
    beat = 60 / 110
    def tone(freq, start, dur, vol, duty=.5):
        i0 = int(start * sr); i1 = min(N, int((start + dur) * sr))
        if i1 <= i0: return
        tt = np.arange(i1 - i0) / sr
        ph = (tt * freq) % 1
        w = np.where(ph < duty, 1.0, -1.0).astype(np.float32)
        env = np.minimum(1, tt * 200) * np.exp(-tt * 5 / dur)
        out[i0:i1] += w * env * vol
    bass_roots = [0, -4, -2, -7]
    t0 = 0.0
    bar = 0
    while t0 < total_s:
        root = bass_roots[bar % 4]
        for b in range(4):
            tone(base / 2 * 2 ** ((root + (0 if b % 2 == 0 else 7)) / 12), t0 + b * beat, beat * .9, .10, .25)
        for e in range(8):
            deg = rnd.choice(scale)
            if rnd.random() < .78: tone(base * 2 * 2 ** ((root + deg) / 12), t0 + e * beat / 2, beat * .45, .06, .5)
        t0 += 4 * beat; bar += 1
    # nhịp trống đơn giản
    t0 = 0
    while t0 < total_s:
        i0 = int(t0 * sr); l = int(.05 * sr)
        if i0 + l < N: out[i0:i0 + l] += (np.random.RandomState(int(t0 * 10) % 99).rand(l).astype(np.float32) - .5) * .12 * np.linspace(1, 0, l)
        t0 += beat
    fade = int(sr * 1.5); out[-fade:] *= np.linspace(1, 0, fade)
    out = np.clip(out, -1, 1)
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((out * 32000).astype('<i2').tobytes())

def main():
    out_mp4 = os.path.join(HERE, "am-nuoc-dun-soi.mp4")
    tmp = os.path.join(os.environ.get("TMPDIR", "/tmp"), "pixel_frames"); shutil.rmtree(tmp, ignore_errors=True); os.makedirs(tmp)
    only = int(sys.argv[1]) if len(sys.argv) > 1 else None
    idx = 0
    for si, (secs, fn, cap) in enumerate(SCENES):
        n = secs * FPS
        for t in range(n):
            if only is not None and si != only: continue
            fr = render_frame(si, t, n, cap)
            fr.save(os.path.join(tmp, "f%05d.png" % idx)); idx += 1
        print("cảnh", si, "xong", flush=True)
    total = idx / FPS
    wav = os.path.join(tmp, "music.wav"); make_audio(wav, total)
    subprocess.check_call(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", os.path.join(tmp, "f%05d.png"), "-i", wav,
                           "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "22", "-preset", "slow", "-c:a", "aac", "-b:a", "96k",
                           "-vf", "fps=24", "-shortest", "-movflags", "+faststart", out_mp4])
    # ảnh bìa
    import glob
    fr = sorted(glob.glob(os.path.join(tmp, "f*.png")))
    if only is None: Image.open(fr[len(fr) // 12 * 1 + 40]).convert("RGB").save(os.path.join(HERE, "poster.jpg"), quality=88)
    print("xong:", out_mp4, "%.0fs" % total)

if __name__ == "__main__":
    main()
