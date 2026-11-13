#!/usr/bin/env python3
"""Vẽ video hoạt hình pixel "Chạy khỏi đám cưới của chính mình" (truyện của Mèo Boss).

Chạy:  python3 render.py   (cần Pillow, numpy, ffmpeg)  ->  chay-khoi-dam-cuoi.mp4
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
GREY = C('cfd2dc')
def bride(d, x, y, t, pose='stand', face='n', veil=False):
    person(d, x, y, INK, WHITE, t, pose, 'f', robe2=GREY, face=face)
    R(d, x - 6, y - 7, 12, 7, WHITE); R(d, x - 7, y - 4, 14, 4, WHITE); R(d, x - 7, y - 1, 14, 1, GREY)
    if veil:
        for i in range(9):
            R(d, x - 6 - i * 2, y - 19 + i // 2 + int(math.sin(t * .6 + i) * 1.4), 2, 2, C('e8ecf4'))

def bougainvillea(d, x, y, t):
    R(d, x, y, 2, 40, WOOD2)
    rnd = random.Random(4)
    for i in range(26):
        P(d, x + rnd.randint(-14, 14), y + rnd.randint(-8, 14), C('e0407f') if i % 3 else C('ff7fb0'))
        R(d, x + rnd.randint(-14, 14), y + rnd.randint(-8, 14), 2, 2, C('e0407f'))
    for i in range(4):   # cánh hoa rơi
        ph = (t * .8 + i * 9) % 36
        P(d, x + math.sin(i * 2 + t * .15) * 8, y + 14 + ph, C('ff7fb0'))

def window(d, x, y, w, h, c): R(d, x, y, w, h, c); R(d, x + w // 2, y, 1, h, tuple(max(0, v - 30) for v in c)); R(d, x, y + h // 2, w, 1, tuple(max(0, v - 30) for v in c))

def sc_title2(d, t, n):
    sky_bands(d, C('140b2e'), C('5a2a5c'), 0, SH, 12); stars(d, t, 2, 50, 70); moon(d, 270, 26)
    # hội trường xa với dây đèn
    R(d, 30, 62, 130, 56, C('2a2144')); R(d, 20, 56, 150, 8, C('3a2d5a'))
    for i in range(7): R(d, 40 + i * 18, 72, 8, 14, GOLD if (t // 6 + i) % 4 else C('f6e4a3'))
    for i in range(24): P(d, 20 + i * 6, 58 + int(math.sin(i * .9) * 2) + 4, FIRE[(t // 3 + i) % 3])
    ground(d, SH - 22, C('2b2144'), C('3b2f5c'))
    bx = lerp(-20, 210, ease(t / n * 1.3 - .1))
    bride(d, bx, SH - 22, t, 'run', 'h', veil=True)
    for i in range(3): heart(d, bx + 6 + i * 8, SH - 52 - ((t * 1.2 + i * 6) % 16), C('ff5d8f')) if t > n * .6 else None
    return [("CHẠY KHỎI ĐÁM CƯỚI", 160, 18, 15, WHITE), ("CỦA CHÍNH MÌNH", 160, 38, 15, C('ff9fc4')), ("Truyện của Mèo Boss  •  hoạt hình pixel", 160, 128, 7, C('c9c2e8'))] if True else []

def sc_fitting(d, t, n):
    R(d, 0, 0, W, SH, C('f0dcd2')); R(d, 0, 96, W, 48, C('b88a62'))
    for y in range(100, SH, 12): R(d, 0, y, W, 1, C('a07650'))
    for x in range(0, W, 40): R(d, x, 0, 1, 96, C('e2c8bc'))
    # gương ba mặt
    for i, gx in enumerate((190, 224, 258)):
        R(d, gx, 26, 30, 72, WOOD); R(d, gx + 2, 28, 26, 68, C('b9dcf0')); R(d, gx + 5, 32, 3, 20, C('e4f4ff'))
    # bục + cô dâu
    R(d, 120, 108, 50, 8, WOOD); R(d, 120, 116, 50, 2, WOOD2)
    bride(d, 145, 108, t, 'stand', 's' if t > n * .45 else 'n')
    person(d, 106, 128, C('3a3a44'), C('6a6a78'), t, 'sit', 'f')                       # thợ may quỳ
    for i in range(3): P(d, 112 + i * 3, 120, C('f0f0f0'))
    # mẹ quay lưng gọi điện
    person(d, 52, 130, C('4a3a3a'), C('8a5aa8'), t, 'stand', 'f', flip=True)
    R(d, 58, 112, 3, 6, INK)
    R(d, 4, 38, 100, 26, WHITE); P(d, 50, 64, WHITE)
    out = [("…xoá hẳn khoản hai mươi tỷ…", 54, 48, 7, INK)]
    if t > n * .4: out.append(("20 TỶ", 160, 20, 16, RED))
    if t > n * .4: bubble_q(d, 145, 76, t, '!')
    return out

def sc_garden(d, t, n):
    sky_bands(d, C('0b0d28'), C('2c2457'), 0, 90, 10); stars(d, t, 6, 40, 60); moon(d, 270, 24)
    R(d, 0, 90, W, 54, C('2a2038')); R(d, 0, 76, W, 14, C('4a3d5e'))
    for x in range(0, W, 16): R(d, x, 76, 1, 14, C('3a2d4e'))
    bougainvillea(d, 60, 56, t); bougainvillea(d, 262, 52, t + 5)
    lantern(d, 160, 20, t)
    R(d, 110, 108, 110, 6, STONE); R(d, 116, 114, 6, 14, C('6b6877')); R(d, 208, 114, 6, 14, C('6b6877'))
    person(d, 144, 110, INK, C('e8a0c0'), t, 'sit', 'f', face='n')
    person(d, 186, 110, INK, C('3a5a8a'), t, 'sit', 'm', flip=True, face='n')
    for i in range(6): sparkle(d, 40 + (i * 53) % 240, 90 + (i * 17) % 40, t + i * 3, C('d8f06a')) if (t // 3 + i) % 3 == 0 else None
    k = min(2, int(t / (n / 3)))
    txt = [("Ngày mai là đám cưới rồi. Em có ổn không?", C('9fd0ff'), 186), ("Anh cũng bị ép à?", C('ffb0d0'), 144), ("Anh không có lựa chọn nào đẹp hơn em đâu.", C('9fd0ff'), 186)][k]
    R(d, 18, 22, 140 if False else 284, 16, C('120d1f'))
    return [(txt[0], 160, 31, 8, txt[1])]

def sc_hall(d, t, n):
    R(d, 0, 0, W, SH, C('4a1d2c')); R(d, 0, 0, W, 50, C('7a2a3a'))
    for x in range(0, W, 16): R(d, x, 0, 8, 50, C('6a2232'))
    for i in range(28): P(d, 6 + i * 11, 12 + int(math.sin(i) * 3), FIRE[(t // 3 + i) % 3])
    R(d, 0, 50, W, 94, C('8a6a4a'))
    R(d, 100, 52, 120, 12, C('5a3a2a'))                     # sân khấu
    R(d, 140, 40, 40, 6, C('e8c860')) if False else None
    # bánh ba tầng
    R(d, 152, 44, 16, 8, WHITE); R(d, 148, 52, 24, 8, C('f6c4d4')); R(d, 144, 60, 32, 6, WHITE); P(d, 160, 41, RED); R(d, 159, 42, 2, 2, RED)
    # khách (mini)
    cols = [C('c8372d'), C('2f5a8f'), C('3f8f4a'), C('8a4fa8'), C('c89b3c'), C('3a3a44')]
    for r in range(5):
        for c in range(18):
            gx = 12 + c * 17 + (r % 2) * 8; gy = 88 + r * 11
            b = 1 if (t // 4 + c + r) % 7 == 0 else 0
            R(d, gx, gy - b, 6, 4, SKIN if (c + r) % 3 else SKIN2); R(d, gx - 1, gy + 4 - b, 8, 5, cols[(c * 3 + r) % 6])
            R(d, gx, gy - 1 - b, 6, 2, INK)
    # cô dâu chú rể
    bx = 144 - max(0, (t - n * .55)) * 5
    bride(d, bx, 74, t, 'walk' if t > n * .55 else 'stand', 'h' if t < n * .5 else 'n')
    person(d, 176, 74, INK, C('222233'), t, 'stand', 'm', face='h')
    # đồng hồ
    R(d, 268, 8, 44, 18, INK); R(d, 270, 10, 40, 14, C('1a2a1a'))
    clock = "21:%02d" % min(59, 45 + int(t / n * 6)) if False else "20:45"
    return [(clock, 290, 17, 9, C('7fff7f')), ("Con vào chỉnh lại trang điểm ạ…", 160, 30, 9, WHITE)] if t > n * .5 else [(clock, 290, 17, 9, C('7fff7f'))]

def sc_run(d, t, n):
    sky_bands(d, C('0a0a1e'), C('1f1a3d'), 0, SH, 10); stars(d, t, 8, 24, 40)
    off = (t * 4) % 120
    for i in range(-1, 5):
        bx = i * 120 - off; h = 50 + (i * 17) % 30
        R(d, bx, 100 - h, 100, h, C('15122c') if i % 2 else C('1c1838'))
        for wx in range(6, 100, 20):
            for wy in range(100 - h + 6, 94, 14):
                if (wx + wy + i) % 3 == 0: R(d, bx + wx, wy, 6, 6, GOLD if (wx * wy) % 4 else C('6a6a88'))
    ground(d, 100, C('2b2640'), C('3b345a'))
    for i in range(3):
        lx = (i * 130 - off * 1.0) % 390 - 20
        R(d, lx, 56, 2, 50, C('4a4660')); R(d, lx - 3, 54, 8, 3, GOLD); R(d, lx - 10, 58, 22, 40, C('3a3555')) if False else None
    bride(d, 110, 128, t, 'run', 's', veil=True)
    R(d, 98, 118 + (t // 2) % 2, 3, 2, RED); R(d, 94, 120 + (t // 2) % 2, 3, 2, RED)    # giày cầm tay
    sh = (t % 3) - 1
    R(d, 222 + sh, 14, 76, 40, C('0a0a14')); R(d, 224 + sh, 16, 72, 36, C('1f2a3f'))
    return [("6 cuộc gọi nhỡ: Mẹ", 260 + sh, 25, 6, WHITE), ("Long: “Cẩn thận nhé.”", 260 + sh, 40, 6, C('9fd0ff'))]

def sc_apt_gate(d, t, n):
    sky_bands(d, C('0b0d28'), C('2c2457'), 0, SH, 12); stars(d, t, 12, 40, 50); moon(d, 40, 24)
    # toà chung cư cũ
    R(d, 100, 16, 150, 106, C('3a3548'))
    for r in range(4):
        for c in range(5):
            on = (r == 0 and c == 3)
            col = (GOLD if (t // 3) % 5 else C('b8902a')) if on else C('15121f')
            R(d, 112 + c * 28, 26 + r * 24, 16, 14, col)
            R(d, 111 + c * 28, 40 + r * 24, 18, 2, C('4a455a'))
    R(d, 100, 12, 150, 4, C('2a2538'))
    ground(d, 122, C('2a2038'), C('3b2d4d'))
    # hàng rào tôn + biển
    for x in range(0, 100, 6): R(d, x, 98, 5, 24, C('6a6a78') if x % 12 else C('5a5a66'))
    R(d, 72, 98, 12, 24, C('2a2038'))   # khe hở
    R(d, 24, 74, 56, 12, C('7a4a2a')); R(d, 24, 74, 56, 1, C('9a6a3a'))
    bx = lerp(8, 86, ease(t / (n * .8)))
    bride(d, bx, 134, t, 'walk', 's')
    out = [("CHUNG CƯ SAO MAI", 52, 80, 5, C('d8c8a0'))]
    if t > n * .5: out.append(("TẦNG 4", 252, 14, 9, GOLD))
    return out

def sc_gas(d, t, n):
    R(d, 0, 0, W, SH, C('0e0c18'))
    R(d, 0, 0, W, 12, C('2a2538')); R(d, 0, 132, W, 12, C('2a2538'))
    R(d, 0, 12, 112, 120, C('1c1828'))     # phòng trống trái
    R(d, 112, 12, 96, 120, C('141222'))    # hành lang
    R(d, 208, 12, 112, 120, C('6a5a3a'))   # phòng sáng phải
    R(d, 208, 12, 4, 120, C('2a2538')); R(d, 108, 12, 4, 120, C('2a2538'))
    R(d, 216, 20, 96, 100, C('8a7448')); R(d, 220, 64, 60, 4, WOOD)
    for i in range(5): R(d, 216 + i * 20, 20, 1, 100, C('7a6540'))
    # bình ga + khí
    R(d, 18, 112, 10, 18, C('b83a2f')); R(d, 20, 108, 6, 4, C('777788'))
    for i in range(10):
        ph = (t * .7 + i * 6) % 40
        R(d, 24 + ph * 1.5 + math.sin(i + t * .1) * 4, 108 - math.sin(ph * .1) * 8 - i % 3 * 4, 3, 3, C('8fd88f') if i % 2 else C('b0f0b0'))
    bride(d, 70, 128, t, 'stand', 's')
    # hai bóng đàn ông giằng co
    sw = (t // 2) % 2
    person(d, 252 + sw, 118, INK, INK, t, 'stand', 'm', skin=INK)
    person(d, 276 - sw, 118, INK, C('3a2020'), t, 'stand', 'm', skin=INK, flip=True)
    R(d, 258 + sw * 2, 100, 14, 3, C('6a6a78'))
    out = []
    if t > n * .5: bubble_q(d, 70, 92, t, '!')
    if t > n * .75:
        sx = 92; sy = 116
        sparkle(d, sx, sy, t, FIRE[0]); R(d, sx - 1, sy - 1, 3, 3, FIRE[1])
        out.append(("TÁCH!", 100, 70, 12, GOLD))
    if t >= n - 2: R(d, 0, 0, W, SH, FIRE[0])
    return out

def sc_fire(d, t, n):
    R(d, 0, 0, W, SH, C('120a14'))
    R(d, 0, 0, W, 12, C('2a2538')); R(d, 0, 132, W, 12, C('2a2538'))
    R(d, 0, 12, 112, 120, C('3a1a14')); R(d, 112, 12, 96, 120, C('221422'))
    R(d, 208, 12, 112, 120, C('241c2e'))
    R(d, 108, 12, 4, 120, C('2a2538')); R(d, 208, 12, 4, 120, C('2a2538'))
    k = min(1.6, .6 + t / n * 1.2)
    flames(d, 40, 130, t, k * 1.6, 1); flames(d, 80, 130, t, k * 1.2, 2); flames(d, 20, 130, t, k, 3)
    # khói
    for i in range(14):
        ph = (t * 1.3 + i * 8) % 60
        R(d, 20 + i * 8 + math.sin(ph * .2) * 3, 100 - ph * 1.6, 6, 6, C('2a2630') if i % 2 else C('3a3640'))
    sp = ease(t / (n * .8))
    bride(d, lerp(92, 190, sp), 128, t, 'run', 's')
    # cửa sổ + thang thoát hiểm bên phải, người đàn ông trèo ra
    R(d, 286, 20, 3, 112, C('5a5a66'));
    for i in range(8): R(d, 270, 28 + i * 14, 20, 2, C('5a5a66'))
    window(d, 240, 60, 26, 30, C('3a4a6a'))
    my = lerp(86, 40, ease((t - n * .2) / (n * .6)))
    person(d, 272, my + 40, INK, C('5a6a7a'), t, 'run', 'm', face='s')
    out = [("CHÁY!", 160, 26, 16, GOLD)] if (t // 3) % 2 else []
    if n * .45 < t < n * .7: bubble_q(d, 150, 80, t, '!')
    return out

def sc_cry(d, t, n):
    sky_bands(d, C('140a1e'), C('7a2a24'), 0, SH, 14); stars(d, t, 14, 20, 30)
    g = 14 + int(math.sin(t * .6) * 3)
    R(d, 190, 60, 90, 24, C('c8482c')); R(d, 210, 44, 50, 16, FIRE[2]) if False else None
    flames(d, 236, 82, t, 1.4, 5);
    for i in range(9):
        bx = i * 38 - 10; R(d, bx, 66 + (i * 13) % 20, 34, 80, C('140a1e') if i % 2 else C('1a1020'))
    ground(d, 112, C('1a1020'), C('2b1a33'))
    R(d, 100, 110, 80, 5, C('3a2a46')); R(d, 100, 115, 80, 29, C('2a1d36'))
    bride(d, 140, 112, t, 'stand', 'x') if False else None
    person(d, 140, 118, INK, WHITE, t, 'sit', 'f', robe2=GREY, face='x')
    R(d, 134, 112, 12, 8, WHITE)
    for i in range(3): P(d, 138 + (i % 2) * 5, 104 + (t * 1.2 + i * 4) % 12, C('7fbfff'))
    fx = lerp(380, -60, t / n)
    R(d, fx, 90, 36, 12, RED); R(d, fx + 4, 84, 14, 6, RED); R(d, fx + 20, 92, 14, 4, WHITE)
    R(d, fx + 5, 82, 4, 2, C('4a9aff') if (t // 2) % 2 else RED)
    for wx in (fx + 6, fx + 26): R(d, wx, 100, 6, 6, INK)
    return []

def sc_cafe(d, t, n):
    sky_bands(d, C('7ec8f0'), C('d8f0ff'), 0, 60, 6); cloud(d, (t * .4) % 360 - 30, 12)
    for k in range(3):
        gx = (t * (1.2 + k * .3) + k * 90) % 340 - 10
        gy = 20 + k * 10 + math.sin(t * .4 + k) * 3
        R(d, gx, gy, 3, 1, WHITE); R(d, gx + 3, gy - 1, 2, 1, WHITE) if (t // 3) % 2 else R(d, gx + 3, gy + 1, 2, 1, WHITE); R(d, gx + 5, gy, 3, 1, WHITE)
    R(d, 0, 60, W, 34, C('2f8fcf'))
    for r in range(8):
        for c in range(40):
            if (c * 3 + r * 5 + t // 3) % 9 == 0: R(d, c * 8, 62 + r * 4, 4, 1, C('9fd8ff'))
    R(d, 0, 94, W, 50, C('e8d3a0'))
    for x in range(0, W, 10): P(d, x + (x % 3), 100 + x % 7, C('d0b87c'))
    # quán cà phê
    R(d, 190, 54, 120, 74, C('c8a67a')); R(d, 186, 44, 128, 10, RED)
    for i in range(8): R(d, 186 + i * 16, 44, 8, 10, WHITE)
    R(d, 200, 66, 100, 28, C('b0e0f0')); R(d, 196, 96, 108, 6, WOOD); R(d, 196, 102, 108, 26, WOOD2)
    R(d, 214, 62, 70, 6, C('f6e4a3'))
    person(d, 250, 96, INK, C('7a4a2b'), t, 'stand', 'b', robe2=C('54321c'), face='h')
    R(d, 226, 90, 5, 6, WHITE); steam_col(d, 228, 90, t, h=10)
    # khách đi bộ
    px = (t * 1.5) % 360 - 20; person(d, px, 128, C('3a2a1a'), C('c89b3c'), t, 'walk', 'm')
    return [("Sáu tháng sau…", 80, 24, 10, WHITE), ("Một thành phố biển cách đó năm trăm cây số.", 160, 138, 7, INK)]

def sc_news(d, t, n):
    sky_bands(d, C('ffb36a'), C('ffe0a8'), 0, 60, 8)
    R(d, 0, 60, W, 84, C('c8a67a')); R(d, 0, 100, W, 44, WOOD)
    for y in range(106, SH, 12): R(d, 0, y, W, 1, WOOD2)
    person(d, 60, 128, INK, C('7a4a2b'), t, 'stand', 'b', robe2=C('54321c'), face='n')
    # điện thoại lớn với bài báo
    R(d, 112, 10, 90, 122, C('0a0a14')); R(d, 116, 16, 82, 108, C('f0ece0'))
    for i in range(7): R(d, 120, 52 + i * 10, 74 - (i % 3) * 14, 3, C('7a7a82'))
    R(d, 120, 22, 74, 22, C('c8372d'))
    # bong bóng suy nghĩ có gương mặt lấm lem
    R(d, 224, 14, 70, 60, WHITE); R(d, 218, 70, 6, 6, WHITE); R(d, 210, 80, 4, 4, WHITE)
    R(d, 244, 28, 28, 28, SKIN); R(d, 242, 22, 32, 8, INK); R(d, 248, 38, 4, 5, INK); R(d, 262, 38, 4, 5, INK)
    for p_ in ((250, 32), (266, 46), (254, 50)): R(d, p_[0], p_[1], 5, 3, C('6a5a4a'))
    R(d, 252, 50, 12, 2, C('a0524a'))
    out = [("BÊ BỐI THAM NHŨNG", 157, 28, 6, WHITE), ("CHẤN ĐỘNG NGÀNH XÂY DỰNG", 157, 37, 5, WHITE)]
    if t > n * .6:
        out.append(("— HẾT —", 160, 128, 14, GOLD))
        for i in range(5): sparkle(d, 120 + i * 20, 118 - (i * 7) % 10, t + i * 2)
    return out

SCENES = [
    (6, sc_title2, "Mở đầu • Một cô dâu, một món nợ hai mươi tỷ, và một đêm bỏ trốn."),
    (8, sc_fitting, "Trong tiệm áo cưới, Thanh Vy nghe lỏm mẹ nói qua điện thoại: sau lễ cưới, khoản nợ hai mươi tỷ sẽ được xoá. Cô chính là khoản thanh toán cuối cùng."),
    (8, sc_garden, "Đêm trước hôn lễ, Đinh Bảo Long mang trả cuốn sổ tay. Hóa ra anh cũng bị ép, cũng chẳng có lựa chọn nào đẹp đẽ hơn cô."),
    (8, sc_hall, "Hội trường năm trăm khách. Đến tiết mục cắt bánh, cô dâu mỉm cười xin ra chỉnh lại trang điểm... rồi không quay lại nữa."),
    (8, sc_run, "Cô xách túi giấu sau thùng rác, qua cửa thoát hiểm đã tắt chuông, chạy chân trần trong đêm. Điện thoại rung liên hồi."),
    (8, sc_apt_gate, "Chín giờ bốn mươi, Vy lách qua hàng rào tôn của chung cư Sao Mai bỏ hoang, nơi tầng bốn lại có một ô cửa sáng đèn."),
    (8, sc_gas, "Từ căn hộ sáng đèn vang lên tiếng giằng co. Trong phòng trống ngập mùi ga, Vy hoảng sợ bật chiếc bật lửa theo phản xạ."),
    (8, sc_fire, "Lửa bùng lên! Vy lao chạy, thoáng thấy một người đàn ông lấm lem trèo qua cửa sổ thoát hiểm. Hai người chỉ kịp nhìn nhau nửa giây."),
    (7, sc_cry, "Giữa con hẻm lạ, xe cứu hỏa hú còi, cô dâu rách váy ngồi khóc: cô tin mình vừa gây ra tai hoạ cho một người xa lạ."),
    (8, sc_cafe, "Sáu tháng sau, Vy pha cà phê ở một thành phố biển, dưới cái tên khác, mái tóc ngắn khác. Mẹ cô nhắn: mẹ mừng vì con đã dám."),
    (8, sc_news, "Một bài báo về vụ bê bối được phanh phui ngay đêm cháy ấy. Phải chăng người đàn ông lấm lem năm nào là nguồn tin giấu tên?"),
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
    out_mp4 = os.path.join(HERE, "chay-khoi-dam-cuoi.mp4")
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
