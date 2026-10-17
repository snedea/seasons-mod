"""Render a `tmux capture-pane -e -p` capture as a PNG of a terminal window.

    python3 scripts/ansi2png.py capture.txt out.png [columns]

Needs Pillow. Block elements and braille are drawn as shapes, so the pixel art
and the webs come out as the terminal draws them; other text uses Menlo, with
Apple Symbols and Arial Unicode for the glyphs Menlo lacks (macOS fonts).
"""
import re
import sys

from PIL import Image, ImageDraw, ImageFont

src, out = sys.argv[1], sys.argv[2]
COLS = int(sys.argv[3]) if len(sys.argv) > 3 else 120

SIZE = 26
CW, CH = 16, 32
PAD, BAR, RADIUS = 28, 52, 18
BG = (22, 18, 28)
FG = (214, 210, 222)
CHROME = (34, 30, 42)

FONTS = [
    ImageFont.truetype("/System/Library/Fonts/Menlo.ttc", SIZE),
    ImageFont.truetype("/System/Library/Fonts/Apple Symbols.ttf", SIZE),
    ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Unicode.ttf", SIZE - 2),
]
NOTDEF = [bytes(f.getmask("\U000f0000")) for f in FONTS]


def font_for(ch):
    for f, nd in zip(FONTS, NOTDEF):
        if bytes(f.getmask(ch)) != nd:
            return f
    return FONTS[0]


BASIC = [(0, 0, 0), (205, 49, 49), (13, 188, 121), (229, 229, 16), (36, 114, 200), (188, 63, 188), (17, 168, 205), (229, 229, 229)]


def c256(n):
    if n < 8:
        return BASIC[n]
    if n < 16:
        return tuple(min(255, v + 60) for v in BASIC[n - 8])
    if n < 232:
        n -= 16
        return tuple(0 if v == 0 else 55 + v * 40 for v in (n // 36, (n // 6) % 6, n % 6))
    g = 8 + (n - 232) * 10
    return (g, g, g)


lines = open(src, encoding="utf-8").read().rstrip("\n").split("\n")
W = COLS * CW + PAD * 2
H = len(lines) * CH + PAD * 2 + BAR
img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
d.rounded_rectangle([0, 0, W - 1, H - 1], RADIUS, fill=BG)
d.rounded_rectangle([0, 0, W - 1, BAR + RADIUS], RADIUS, fill=CHROME)
d.rectangle([0, BAR, W - 1, BAR + RADIUS], fill=BG)
for i, c in enumerate([(255, 95, 87), (254, 188, 46), (40, 200, 64)]):
    x = 26 + i * 30
    d.ellipse([x - 9, BAR // 2 - 9, x + 9, BAR // 2 + 9], fill=c)

X0, Y0 = PAD, BAR + PAD // 2

for row, line in enumerate(lines):
    fg, bg, dim = FG, None, False
    x = 0
    for tok in re.split(r"(\x1b\[[0-9;:]*m)", line):
        if tok.startswith("\x1b["):
            ps = re.split(r"[;:]", tok[2:-1]) or ["0"]
            i = 0
            while i < len(ps):
                p = int(ps[i] or 0)
                if p == 0:
                    fg, bg, dim = FG, None, False
                elif p == 2:
                    dim = True
                elif p == 22:
                    dim = False
                elif 30 <= p <= 37:
                    fg = BASIC[p - 30]
                elif 90 <= p <= 97:
                    fg = c256(p - 90 + 8)
                elif p == 39:
                    fg = FG
                elif 40 <= p <= 47:
                    bg = BASIC[p - 40]
                elif p == 49:
                    bg = None
                elif p in (38, 48):
                    if ps[i + 1] == "2":
                        col = tuple(int(v) for v in ps[i + 2 : i + 5])
                        i += 4
                    else:
                        col = c256(int(ps[i + 2]))
                        i += 2
                    if p == 38:
                        fg = col
                    else:
                        bg = col
                i += 1
            continue
        for ch in tok.replace("\u23f5", "\u25b8"):
            if x >= COLS:
                break
            px, py = X0 + x * CW, Y0 + row * CH
            if bg:
                d.rectangle([px, py, px + CW - 1, py + CH - 1], fill=bg)
            col = tuple(int(v * 0.6 + b * 0.4) for v, b in zip(fg, BG)) if dim else fg
            o = ord(ch)
            if o == 0x2580:
                d.rectangle([px, py, px + CW - 1, py + CH // 2 - 1], fill=col)
            elif o == 0x2584:
                d.rectangle([px, py + CH // 2, px + CW - 1, py + CH - 1], fill=col)
            elif o == 0x2588:
                d.rectangle([px, py, px + CW - 1, py + CH - 1], fill=col)
            elif o == 0x2500:
                d.rectangle([px, py + CH // 2 - 1, px + CW - 1, py + CH // 2], fill=col)
            elif o == 0x2502:
                d.rectangle([px + CW // 2 - 1, py, px + CW // 2, py + CH - 1], fill=col)
            elif 0x2800 <= o <= 0x28FF:
                bits = o - 0x2800
                for k, (dx, dy) in enumerate([(0, 0), (0, 1), (0, 2), (1, 0), (1, 1), (1, 2), (0, 3), (1, 3)]):
                    if bits & (1 << k):
                        cx, cy = px + 4 + dx * 8, py + 4 + dy * 8
                        d.rectangle([cx, cy, cx + 2, cy + 2], fill=col)
            elif ch != " ":
                d.text((px, py + 2), ch, font=font_for(ch), fill=col)
            x += 1
img.save(out)
