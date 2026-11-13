#!/usr/bin/env python3
"""Vẽ video hoạt hình pixel "Hồ ly thất nghiệp" (truyện của Mèo Boss).

Chạy:  python3 render.py   (cần Pillow, numpy, ffmpeg)  ->  ho-ly-that-nghiep.mp4
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
    elif style == 'b':
        R(d, x - 5, hy - 1, 10, 3, hair); R(d, x - 5, hy + 2, 2, 4, hair); R(d, x + 3, hy + 2, 2, 4, hair)
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
PEACH = C('ffb3c1'); PEACH2 = C('ff7fa0'); FUR = C('fdf6ee')

def tails(d, x, y, t, n=9, scale=1.8, droop=0.0):
    """Chín (hoặc n) cái đuôi cáo xoè sau lưng, (x,y) là gốc đuôi."""
    for i in range(n):
        a = math.radians(-95 + (i - (n - 1) / 2) * (150 / max(1, n - 1)) * 0.9 + 20 + droop * 40)
        sway = math.sin(t * .25 + i) * .12
        for k in range(1, 8):
            r = k * 2.4 * scale
            aa = a + sway * k * .3
            px = x + math.cos(aa) * r * -1 * 1.0
            py = y + math.sin(aa) * r * 0.9
            w = 5 if k < 6 else 3
            R(d, px - 2, py - 2, w, w, FUR if k < 7 else PEACH)

def fox(d, x, y, t, n=9, pose='stand', face='n', robe=C('f2e8d8'), skirt=None, flip=False, droop=0.0, tail_vis=True):
    if tail_vis and n > 0: tails(d, x - (3 if not flip else -3), y - 9, t, n, droop=droop)
    person(d, x, y, INK, robe, t, pose, 'f', robe2=skirt or C('7a7a88'), face=face, flip=flip)
    sit = pose in ('sit', 'write')
    hy = y - (6 if sit else 0) - 21 + (1 if pose in ('walk', 'run') and (t // 3) % 2 else 0)
    for sx in (-4, 2):
        R(d, x + sx, hy - 4, 3, 3, INK); P(d, x + sx + 1, hy - 3, PEACH2)
    # tóc dài thành mái ngang vì ảnh phóng nhỏ
    return hy

def goat(d, x, y, t, pose='stand', flip=False):
    person(d, x, y, C('c8c8d0'), C('7a5a3a'), t, pose, 'm', skin=C('e8d8b8'), flip=flip, robe2=C('54321c'))
    hy = y - 21
    R(d, x - 5, hy - 3, 2, 3, C('e8e0c8')); R(d, x + 3, hy - 3, 2, 3, C('e8e0c8'))   # sừng
    R(d, x - 2, hy + 7, 4, 4, C('c8c8d0'))                                          # râu
    R(d, x - 3, hy + 3, 2, 1, C('f2d24a')); R(d, x + 1, hy + 3, 2, 1, C('f2d24a'))  # mắt vàng

def guard(d, x, y, t):
    person(d, x, y, INK, C('15151e'), t, 'stand', 'm', robe2=C('0a0a12'), skin=SKIN2)
    hy = y - 21
    R(d, x - 4, hy + 3, 8, 2, INK)           # kính đen

def peach_burst(d, x, y, t, k=1.0):
    for i in range(10):
        ph = (t * 1.1 + i * 3) % 24
        a = i * 0.63 + t * .03
        P(d, x + math.cos(a) * ph * k, y + math.sin(a) * ph * .6 * k, PEACH if i % 2 else PEACH2)
        if ph < 12: R(d, x + math.cos(a) * ph * k, y + math.sin(a) * ph * .6 * k, 2, 2, PEACH)

def office_bg(d, wall=C('f2e6c4'), floor=C('9a8a6a')):
    R(d, 0, 0, W, SH, wall); R(d, 0, 100, W, 44, floor)
    for y in range(106, SH, 10): R(d, 0, y, W, 1, tuple(max(0, v - 18) for v in floor))
    R(d, 0, 96, W, 4, tuple(max(0, v - 30) for v in wall))

def desk(d, x, y, w=64, mon=True, t=0, text=None):
    R(d, x, y - 20, w, 4, WOOD); R(d, x + 3, y - 16, 3, 16, WOOD2); R(d, x + w - 6, y - 16, 3, 16, WOOD2)
    if mon:
        R(d, x + w // 2 - 11, y - 36, 22, 16, INK); R(d, x + w // 2 - 9, y - 34, 18, 12, C('7fb8e8')); R(d, x + w // 2 - 2, y - 21, 4, 2, INK)

def sc_title3(d, t, n):
    sky_bands(d, C('0a0a24'), C('3a2a5c'), 0, SH, 14); stars(d, t, 3, 60, 90); moon(d, 262, 28)
    # toà nhà chọc trời xa
    for i, (bx, bw, bh) in enumerate(((10, 30, 60), (44, 24, 82), (74, 34, 50), (214, 26, 70), (246, 36, 44), (286, 28, 90))):
        R(d, bx, SH - 24 - bh, bw, bh, C('1c1838'))
        for wy in range(SH - 24 - bh + 6, SH - 28, 8):
            for wx in range(bx + 4, bx + bw - 4, 7):
                if (wx * 7 + wy + t // 20) % 5 < 2: R(d, wx, wy, 3, 3, GOLD)
    R(d, 100, SH - 30, 120, 30, C('2a2548'))      # sân thượng
    R(d, 100, SH - 32, 120, 3, C('4a4568'))
    fox(d, 160, SH - 30, t, 9, 'stand', 'h')
    peach_burst(d, 160, SH - 70, t, 1.2)
    return [("HỒ LY THẤT NGHIỆP", 160, 20, 18, WHITE), ("Truyện của Mèo Boss  •  hoạt hình pixel", 160, 38, 7, C('c9c2e8'))]

def sc_fired(d, t, n):
    office_bg(d, C('d6d0e8'), C('6a5a8a'))
    for i in range(6): R(d, 20 + i * 54, 10, 30, 52, C('9ab8e8')); R(d, 20 + i * 54, 34, 30, 1, C('e8f0ff'))    # cửa sổ lớn
    desk(d, 30, 126, 80, True, t)
    fox(d, 72, 126, t, 9, 'stand', 'x' if t > n * .5 else 'n', tail_vis=True)
    R(d, 66, 100, 12, 3, GOLD)           # tai nghe
    goat(d, 190, 126, t, flip=True)
    R(d, 166, 104, 14, 9, WHITE); R(d, 166, 104, 14, 1, C('c8c0a8'))        # thư
    # robot Mị Mị Bot trên màn hình
    R(d, 232, 70, 52, 40, INK); R(d, 235, 73, 46, 34, C('1a2a5a'))
    R(d, 246, 80, 20, 14, C('9ab8ff')); R(d, 249, 84, 4, 4, INK); R(d, 259, 84, 4, 4, INK)
    R(d, 252, 90, 8, 1, INK) if (t // 6) % 2 else R(d, 252, 91, 8, 1, INK); R(d, 255, 76, 2, 4, C('9ab8ff')); P(d, 256, 75, RED)
    R(d, 252, 116, 12, 8, C('4b4b5a'))
    out = [("MỊ MỊ BOT v3.2", 258, 100, 5, C('9ab8ff'))]
    if t > n * .35: out.append(("THƯ CẮT GIẢM NHÂN SỰ", 160, 14, 11, RED))
    if t > n * .6: bubble_q(d, 72, 80, t, '!')
    return out

def sc_interview(d, t, n):
    office_bg(d, C('f4e8c8'), C('9a8a6a'))
    R(d, 90, 22, 70, 40, WHITE); R(d, 90, 22, 70, 2, STONE)
    for i in range(5): R(d, 96, 30 + i * 6, 40 + (i * 11) % 20, 2, C('4a4a8a'))
    R(d, 190, 70, 100, 4, WOOD); R(d, 196, 74, 4, 40, WOOD2)
    R(d, 214, 56, 24, 14, C('e8e0c8')); R(d, 220, 60, 12, 2, RED)
    person(d, 252, 112, INK, WHITE, t, 'sit', 'm', face='x' if (t // 4) % 3 == 0 else 'n')
    R(d, 244, 92, 12, 3, INK)    # kính
    R(d, 262, 98, 5, 5, WHITE)   # khăn giấy
    fox(d, 90, 122, t, 0, 'stand', 'h', robe=C('f4e8d0'), tail_vis=False)
    peach_burst(d, 120, 100, t, 1.8)
    # hắt xì
    if (t // 10) % 2: R(d, 218, 20, 62, 14, WHITE); P(d, 240, 34, WHITE)
    out = [("Hắt xì!", 250, 27, 10, C('d03a3a'))] if (t // 10) % 2 else []
    out.append(("Hương đào của em… sao anh vẫn hắt hơi?", 160, 138, 6, WHITE))
    return out

def sc_copier(d, t, n):
    office_bg(d, C('e8f0e8'), C('8a9a8a'))
    for i in range(3): R(d, 20 + i * 100, 10, 60, 40, C('c8d8e8')); R(d, 50 + i * 100, 10, 2, 40, WHITE)
    # máy photocopy
    R(d, 130, 74, 56, 52, C('9a9aa8')); R(d, 130, 74, 56, 8, C('c8c8d0')); R(d, 136, 90, 44, 6, C('2a2a34'))
    R(d, 142, 104, 20, 14, RED if (t // 3) % 2 else C('6a1a1a')); R(d, 168, 100, 10, 8, C('f6e4a3'))
    # giấy bay tung toé
    for i in range(7):
        ph = (t * 1.3 + i * 5) % 30
        R(d, 140 + math.sin(i * 2 + t * .2) * 36, 70 - ph, 6, 8, WHITE)
    fox(d, 90, 126, t, 9, 'stand', 's', robe=C('f4e8d0'))
    person(d, 240, 126, C('3a2a2a'), C('8a5aa8'), t, 'stand', 'f', face='h')   # chị Hương
    R(d, 228, 104, 12, 4, C('c89b3c')); R(d, 230, 101, 8, 3, C('e8b84a'))      # dĩa bánh
    out = [("KẸT GIẤY", 158, 66, 9, RED)] if (t // 3) % 2 else []
    if t > n * .5: out.append(("Ăn nhiều vào, nghề này phải khỏe!", 240, 82, 6, INK)); R(d, 196, 72, 90, 14, WHITE) if False else None
    return out + [("Ngày đầu đi làm: không mị hoặc ai!", 160, 20, 9, C('9a2a4a'))]

def sc_faint(d, t, n):
    office_bg(d, C('f4e8c8'), C('9a8a6a'))
    desk(d, 200, 126, 90, False, t); R(d, 215, 80, 22, 18, C('f0ece0')); R(d, 242, 86, 28, 12, C('e0d8c0'))
    for i in range(5): R(d, 262 + (i % 2) * 6, 98 - (i // 2) * 3, 5, 4, WHITE)    # đống khăn giấy
    person(d, 252, 126, INK, WHITE, t, 'sit', 'm', face='x')
    R(d, 244, 107, 12, 3, INK)
    fox(d, 120, 126, t, 0, 'stand', 'h', robe=C('f4e8d0'), tail_vis=False)
    peach_burst(d, 140, 100, t, 2.2)
    # bà Út ngất xỉu: trượt xuống
    p = ease((t - n * .3) / (n * .25))
    ay = lerp(126, 134, p)
    R(d, 20, 112, 3, 22, WOOD2)    # cây chổi
    if p < 1: person(d, 56, ay, C('9a9aa4'), C('7a6a8a'), t, 'stand', 'f', face='s')
    else:
        R(d, 40, 130, 28, 6, C('7a6a8a')); R(d, 64, 128, 8, 8, SKIN); R(d, 63, 126, 10, 3, C('9a9aa4'))
        for i in range(3): sparkle(d, 60 + i * 8, 116 - (i % 2) * 4, t + i * 2, GOLD)
    heart(d, 150, 90 - (t * .5) % 6, C('ff5d8f')) if t > n * .6 else None
    return [("Anh không ngửi được mùi gì cả.", 252, 70, 7, INK)] if (t // 12) % 2 else [("…vì thế mình không thể mị hoặc người này.", 160, 14, 8, C('9a2a4a'))]

def sc_party(d, t, n):
    R(d, 0, 0, W, SH, C('3a2018')); R(d, 0, 0, W, 50, C('5a3022'))
    for i in range(14): R(d, 6 + i * 23, 6, 3, 8 + (i * 5) % 6, RED); R(d, 4 + i * 23, 4, 7, 3, GOLD if (t // 4 + i) % 2 else FIRE[1])
    R(d, 0, 50, W, 94, C('6a4a34'))
    # bàn tròn + lẩu
    R(d, 90, 82, 140, 26, C('8a5a3a')); R(d, 88, 80, 144, 4, C('c8a060'))
    R(d, 148, 70, 24, 10, C('4b4b5a')); steam_col(d, 160, 70, t, h=14)
    for i in range(4): R(d, 100 + i * 28, 78, 6, 3, C('c8372d')); R(d, 106 + i * 28, 79, 4, 2, GOLD)
    cols = [(C('8a5aa8'), 'f', 'h'), (C('3a3a4a'), 'm', 'h'), (C('4a4a58'), 'f', 'n'), (C('7a6a8a'), 'f', 'h')]
    person(d, 100, 100, C('3a2a2a'), C('8a5aa8'), t, 'sit', 'f', face='h' if t > n * .45 else 'h')
    person(d, 220, 100, INK, C('3a8a6a'), t, 'sit', 'm', flip=True, face='s' if t > n * .55 else 'h')
    person(d, 250, 112, C('9a9aa4'), C('7a6a8a'), t, 'sit', 'f', face='s' if t > n * .55 else 'n')
    person(d, 60, 112, INK, C('4a5a8a'), t, 'sit', 'm', face='s' if t > n * .55 else 'h')
    person(d, 280, 108, INK, WHITE, t, 'sit', 'm', flip=True, face='h')
    # Ly đứng hát
    k = 0 if t < n * .45 else 3 if t < n * .6 else 9 if False else 3
    fox(d, 160, 130, t, k, 'cheer', 'h', robe=C('f4e8d0'))
    if t >= n * .45:
        for i in range(3):
            heart(d, 140 + i * 18, 40 - (t * .6 + i * 4) % 10, PEACH2) if False else None
    out = [("Con cò bé bé… đi ăn đêm…", 160, 20, 9, GOLD)] if t < n * .45 else [("CÁI ĐUÔI?!", 160, 20, 14, RED), ("“Dạ… đúng rồi. Cosplay.”", 160, 36, 8, WHITE)]
    if t > n * .45: bubble_q(d, 100, 70, t, '!'); bubble_q(d, 220, 70, t, '!')
    return out

def sc_debt(d, t, n):
    office_bg(d, C('e8e0d0'), C('7a7a8a'))
    for i in range(4): R(d, 14 + i * 76, 14, 40, 44, C('c8d8e8'))
    # cửa
    R(d, 6, 60, 36, 66, WOOD2); R(d, 10, 64, 28, 62, C('c8d8e8'))
    guard(d, 26, 126, t); guard(d, 62, 126, t)
    goat(d, 112, 126, t)
    R(d, 126, 108, 30, 18, WHITE); R(d, 126, 108, 30, 2, C('c8c0a8'))
    for i in range(4): R(d, 130, 112 + i * 3, 22, 1, C('7a7a8a'))
    person(d, 250, 126, INK, WHITE, t, 'stand', 'm', flip=True, face='h')
    R(d, 238, 104, 3, 8, RED)     # bút đỏ
    fox(d, 282, 126, t, 0, 'stand', 's', robe=C('f4e8d0'), flip=True, tail_vis=False)
    R(d, 276, 102, 8, 6, FUR); R(d, 272, 98, 6, 4, FUR)   # đuôi lộ ra lấp ló
    out = [("BỒI HOÀN: 5 CÁI ĐUÔI", 160, 18, 12, RED if (t // 4) % 2 else GOLD)]
    if t > n * .5: out.append(("“Hợp đồng ghi rõ, không phân biệt lý do.”", 112, 86, 6, INK)); R(d, 112, 76, 0, 0, WHITE)
    return out

def sc_council(d, t, n):
    sky_bands(d, C('0a0a24'), C('2a2a5c'), 0, SH, 12); stars(d, t, 5, 50, 80)
    R(d, 112, 14, 96, 96, C('f3eac2')) if False else None
    moon(d, 160, 32); R(d, 148, 20, 24, 24, C('f3eac2'))
    R(d, 0, 100, W, 44, C('3a3550')); R(d, 0, 98, W, 3, C('5a5470'))
    # chín ngai đá: rùa, cú, rắn...
    thr = [(40, C('3f8f4a')), (68, C('5a3a22')), (96, C('f4f4f4')), (124, C('7a6aa8')), (160, C('f4f4f4')), (196, C('a86a8a')), (224, C('c8a04a')), (252, C('4a8a9a')), (280, C('8a8a98'))]
    for i, (tx, col) in enumerate(thr):
        R(d, tx - 11, 62 + (4 - abs(i - 4)) * 2, 22, 38 - (4 - abs(i - 4)) * 2, C('7a7788')); R(d, tx - 8, 64 + (4 - abs(i - 4)) * 2, 16, 10, col)
        R(d, tx - 5, 67 + (4 - abs(i - 4)) * 2, 3, 3, GOLD if i in (1,) else INK); R(d, tx + 2, 67 + (4 - abs(i - 4)) * 2, 3, 3, GOLD if i in (1,) else INK)
    # ông lão ở giữa: râu dài
    R(d, 156, 78, 8, 20, WHITE)
    person(d, 120, 134, INK, WHITE, t, 'stand', 'm', face='h' if (t // 10) % 2 else 'n')   # Quang nói
    R(d, 112, 116, 6, 8, C('2a2a8a'))
    fox(d, 84, 134, t, 9, 'stand', 's', robe=C('f4e8d0'))
    goat(d, 240, 134, t, flip=True); guard(d, 268, 134, t)
    out = [("HỘI ĐỒNG YÊU TỘC", 160, 12, 10, WHITE)]
    ph = int(t / (n / 3))
    out.append((["Điều 5: lao động cưỡng bức bị cấm!", "Điều 42: sa thải không bồi thường!", "Hợp đồng ba trăm năm: VÔ HIỆU!"][min(2, ph)], 160, 128 if False else 62, 8, GOLD))
    return out

def sc_tails(d, t, n):
    sky_bands(d, C('0a0a24'), C('2a2a5c'), 0, SH, 12); stars(d, t, 8, 60, 90); moon(d, 160, 34)
    R(d, 0, 108, W, 36, C('3a3550')); R(d, 0, 106, W, 3, C('5a5470'))
    # số đuôi giảm dần
    p = ease((t - 12) / (n * .55))
    left = 9 - int(p * 8)
    fox(d, 140, 126, t, max(left, 0), 'stand', 'x', robe=C('f4e8d0'), droop=p * .3, tail_vis=left > 0)
    if left <= 1: R(d, 134, 112, 8, 4, FUR); R(d, 133, 114, 4, 3, FUR)
    person(d, 182, 126, INK, WHITE, t, 'stand', 'm', flip=True, face='s' if p < .9 else 'h')
    R(d, 174, 108, 12, 3, INK)
    # đốm sáng tan ra
    for i in range(int(40 * p)):
        a = i * 1.7 + t * .06; r = 8 + (i * 7) % 50 + t % 20
        sparkle(d, 140 + math.cos(a) * r, 100 + math.sin(a) * r * .6 - (t * .4) % 14, t + i, WHITE if i % 2 else PEACH)
    # nắm tay
    R(d, 148, 114, 24, 2, SKIN) if p > .5 else None
    heart(d, 160, 84 - (t * .4) % 6, PEACH2) if p > .8 else None
    return [("“Em xin mất tám đuôi. Giữ lại một.”", 160, 14, 9, WHITE)] if t > n * .2 else []

def sc_walk(d, t, n):
    sky_bands(d, C('0a0a24'), C('3a2a5c'), 0, SH, 12); stars(d, t, 9, 50, 70); moon(d, 56, 28)
    off = (t * 1.2) % 160
    for i in range(-1, 4):
        bx = i * 160 - off; h = 40 + (i * 23) % 30
        R(d, bx, 104 - h, 90, h, C('15122c') if i % 2 else C('1c1838'))
        for wx in range(8, 80, 16):
            for wy in range(104 - h + 8, 98, 14):
                if (wx + wy + i) % 3 == 0: R(d, bx + wx, wy, 5, 5, GOLD)
    ground(d, 104, C('2b2640'), C('3b345a'))
    for i in range(3):
        lx = (i * 140 - off * 1.4) % 440 - 20
        R(d, lx, 56, 2, 52, C('4a4660')); R(d, lx - 3, 54, 8, 3, GOLD)
    fox(d, 140, 134, t, 1, 'walk', 'h', robe=C('f4e8d0'), tail_vis=True)
    tail_w = int(math.sin(t * .5) * 2)
    person(d, 176, 134, INK, WHITE, t, 'walk', 'm', face='h')
    R(d, 168, 116, 3, 5, C('4a4a8a'))
    for i in range(3): heart(d, 150 + i * 14, 94 - (t * .6 + i * 5) % 12, PEACH2) if t > n * .4 else None
    return [("“Tôi không ngửi được hương đào của cô. Nhưng tôi muốn ngửi.”", 160, 20, 8, WHITE)] if t > n * .3 else []

def sc_spring(d, t, n):
    sky_bands(d, C('9ad0f0'), C('e8f6ff'), 0, 120, 8); cloud(d, 40, 14); cloud(d, 230, 22)
    # hoa đào nở
    R(d, 16, 54, 4, 60, WOOD2)
    rnd = random.Random(8)
    for i in range(70): R(d, 8 + rnd.randint(0, 34), 30 + rnd.randint(0, 36), 3, 3, PEACH if i % 3 else PEACH2)
    for i in range(10):
        ph = (t * .8 + i * 5) % 50
        P(d, 24 + math.sin(i + t * .1) * 14 + ph * .6, 62 + ph * 1.2, PEACH)
    office_bg(d, C('f4e8c8'), C('9a8a6a')) if False else None
    R(d, 60, 24, 220, 90, C('f4e8c8')); R(d, 60, 24, 220, 4, STONE); R(d, 60, 100, 220, 14, C('9a8a6a'))
    R(d, 80, 40, 40, 30, C('c8d8e8')); R(d, 100, 40, 2, 30, WHITE)
    R(d, 150, 40, 70, 4, WOOD2) if False else None
    ground(d, 114, C('d9c08b'), C('c4a86f'))
    desk(d, 170, 128, 80, True, t)
    fox(d, 150, 130, t, 1, 'stand', 'h', robe=C('f4e8d0'))
    # túi giấy + Quang
    person(d, 232, 130, INK, WHITE, t, 'stand', 'm', flip=True, face='h')
    R(d, 222, 112, 8, 10, C('c8a67a'))
    for i in range(4):
        ph = (t * .7 + i * 7) % 24
        P(d, 214 + ph * .4, 104 - ph * .6, WHITE)
    for i in range(3): heart(d, 190 + i * 16, 78 - (t * .6 + i * 5) % 12, PEACH2)
    out = [("“Tôi ngửi được rồi. Cà phê. Giấy mới. Và cô.”", 160, 16, 9, C('7a1a40')), ("“Cô thơm mùi nước xả vải.”", 160, 134, 8, C('7a1a40'))]
    if t > n * .65: out = [("“Cô thơm mùi nước xả vải.”", 160, 20, 10, C('7a1a40')), ("— HẾT —", 160, 134, 14, GOLD)]
    return out

SCENES = [
    (6, sc_title3, "Mở đầu • Hồ ly chín đuôi bị sa thải, và một ông sếp không bao giờ ngửi thấy mùi."),
    (8, sc_fired, "Hồ Thanh Ly, hồ ly chín đuôi, làm ở Tập đoàn Mị Hoặc bốn mươi hai năm, bị sa thải ngay giữa ca: AI Mị Mị Bot rẻ hơn cô bốn mươi tám lần."),
    (8, sc_interview, "Cô đi xin việc ở công ty kế toán nhỏ, thả hương đào mê hoặc. Nhưng ông sếp Quang chỉ... hắt xì. Anh bị viêm xoang, không ngửi được gì."),
    (8, sc_copier, "Ngày đầu đi làm, cô quyết không dùng phép. Nhưng máy photocopy thì không biết nể ai: KẸT GIẤY, KẸT GIẤY, KẸT GIẤY."),
    (8, sc_faint, "Cô thử mị hoặc anh mười hai lần, bà lao công ngất xỉu, còn Quang vẫn không hề hay biết. Và tim cô bắt đầu đập loạn."),
    (8, sc_party, "Tiệc tất niên: bốn ly bia, một bài \"Con cò bé bé\"... và ba cái đuôi trắng lộ ra trước mặt cả công ty. \"Dạ, cosplay ạ!\""),
    (8, sc_debt, "Ngài Dê đến đòi nợ hợp đồng ba trăm năm: bồi hoàn năm cái đuôi. Quang chắn trước mặt cô, cầm cây bút đỏ như cầm vũ khí."),
    (8, sc_council, "Trước Hội đồng Yêu tộc, anh kế toán nghẹt mũi cãi bằng luật lao động: hợp đồng ba trăm năm vô hiệu!"),
    (8, sc_tails, "Nhưng vì dùng phép trái phép, cô chấp nhận bị phạt, xin mất tám đuôi, giữ lại một, để sống trọn một đời người."),
    (8, sc_walk, "Trên đường về dưới trăng, Quang nói: tôi chưa bao giờ ngửi được hương đào của cô, nhưng tôi muốn ngửi. Tuần sau tôi đi mổ xoang."),
    (9, sc_spring, "Ba tháng sau, mũi anh đã thông. \"Tôi ngửi được rồi. Cà phê. Giấy mới. Và cô thơm mùi nước xả vải.\""),
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
    out_mp4 = os.path.join(HERE, "ho-ly-that-nghiep.mp4")
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
