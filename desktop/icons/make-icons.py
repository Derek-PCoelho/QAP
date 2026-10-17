# Gera os ícones do executável a partir de um desenho em pixel art de 64×64.
# Uso: python3 desktop/icons/make-icons.py   (precisa do Pillow)
# Saída nesta pasta: icon-1024.png, icon.png (512), icon.ico (Windows), icon.icns (Mac).
from pathlib import Path
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
N = 64
BG0 = (13, 19, 17, 255)     # --c-bg0
BG1 = (22, 32, 28, 255)     # --c-bg1
BG2 = (31, 44, 39, 255)     # --c-bg2
LINE = (61, 82, 72, 255)    # --c-line
RED = (224, 72, 61, 255)    # --c-red
RED_D = (122, 29, 22, 255)
RED_L = (255, 140, 120, 255)
GREEN = (127, 209, 122, 255)  # --c-green
GREEN_D = (47, 92, 50, 255)
BLUE = (90, 167, 214, 255)

FONT = {
    'Q': ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
    'A': ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    'P': ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
}

img = Image.new('RGBA', (N, N), (0, 0, 0, 0))
px = img.load()

# placa arredondada (margem de 4 px, como os ícones do Mac)
x0, y0, x1, y1, r = 4, 4, 59, 59, 9
def inside(x, y):
    if x < x0 or x > x1 or y < y0 or y > y1:
        return False
    cx = min(max(x, x0 + r), x1 - r)
    cy = min(max(y, y0 + r), y1 - r)
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r + r * 0.6
for y in range(N):
    for x in range(N):
        if inside(x, y):
            # degradê em faixas, mais claro em cima
            band = BG2 if y < 22 else BG1 if y < 44 else BG0
            px[x, y] = band
# borda de 1 px
for y in range(N):
    for x in range(N):
        if inside(x, y) and not all(inside(x + dx, y + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
            px[x, y] = LINE

# giroflex no topo: vermelho e azul
for x in range(23, 31):
    for y in (9, 10):
        px[x, y] = RED if x < 27 else BLUE
for x in range(33, 41):
    for y in (9, 10):
        px[x, y] = BLUE if x < 37 else RED
for x in (22, 41):
    px[x, 10] = LINE

# letras QAP 5×7 ampliadas 2× (10×14), sombra deslocada
S, GAP = 2, 3
word = 'QAP'
w = len(word) * 5 * S + (len(word) - 1) * GAP
lx, ly = (N - w) // 2, 16
def letter(ch, ox, oy, col):
    for j, row in enumerate(FONT[ch]):
        for i, c in enumerate(row):
            if c == '#':
                for a in range(S):
                    for b in range(S):
                        px[ox + i * S + a, oy + j * S + b] = col
for k, ch in enumerate(word):
    letter(ch, lx + k * (5 * S + GAP) + 1, ly + 1, RED_D)
for k, ch in enumerate(word):
    letter(ch, lx + k * (5 * S + GAP), ly, RED)
# brilho no canto de cada letra
for k in range(len(word)):
    ox = lx + k * (5 * S + GAP)
    px[ox + 2, ly] = RED_L

# linha de ECG verde
base = 46
pts = [(9, base), (22, base), (24, base - 2), (26, base), (28, base), (30, base + 3), (32, base - 9), (34, base + 5), (36, base), (40, base), (43, base - 3), (46, base), (54, base)]
def line(a, b, col):
    (xa, ya), (xb, yb) = a, b
    n = max(abs(xb - xa), abs(yb - ya))
    for t in range(n + 1):
        x = round(xa + (xb - xa) * t / n)
        y = round(ya + (yb - ya) * t / n)
        px[x, y] = col
for a, b in zip(pts, pts[1:]):
    line((a[0], a[1] + 1), (b[0], b[1] + 1), GREEN_D)
for a, b in zip(pts, pts[1:]):
    line(a, b, GREEN)

img.save(HERE / 'icon-64.png')
big = img.resize((1024, 1024), Image.NEAREST)
big.save(HERE / 'icon-1024.png')
img.resize((512, 512), Image.NEAREST).save(HERE / 'icon.png')
# Windows: vários tamanhos; os pequenos reduzem o desenho de 64 px
ico_sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (24, 24), (16, 16)]
big.save(HERE / 'icon.ico', sizes=ico_sizes)
# Mac
big.save(HERE / 'icon.icns')
print('ícones gerados em', HERE)
