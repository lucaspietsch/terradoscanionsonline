"""
Imagens ILUSTRATIVAS do Vaso Listrado Luxuoso Premium (ainda não produzido): preto e dourado, vermelho e dourado e
mármore, com folha de ouro. Recolore a foto do vaso verde (assets/listrados/listrado-verde.jpg) dentro do contorno do
vaso, mantendo a luz e as sombras das listras.

  python3 -m venv /tmp/v && /tmp/v/bin/pip install opencv-python-headless numpy
  /tmp/v/bin/python scripts/process-listrado-cores.py
"""
import cv2, numpy as np

SRC = "assets/listrados/listrado-verde.jpg"
MASK = "assets/listrados/listrado-verde.mask.png"  # contorno do vaso (verde), gerado a partir da cor
OUT = "public/images/products/"
CROP = (14, 0, 1000, 1000)  # esquerda, topo, largura, altura (quadrado)

x0, y0, cw, ch = CROP
im = cv2.imread(SRC)[y0:y0 + ch, x0:x0 + cw, ::-1].astype(np.float32)
H, W = im.shape[:2]
m = cv2.imread(MASK, 0)[y0:y0 + ch, x0:x0 + cw]
m[903 - y0:] = 0
m = cv2.GaussianBlur(m.astype(np.float32) / 255, (0, 0), 1.0)[..., None]
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)

lum = im @ np.array([0.299, 0.587, 0.114], np.float32)
vase = m[..., 0] > 0.5
shade = np.clip(lum / np.percentile(lum[vase], 90), 0, 1.25)[..., None]

rng = np.random.default_rng(7)
def noise(scale):
    n = cv2.resize(rng.random((H // scale + 2, W // scale + 2)).astype(np.float32), (W, H), interpolation=cv2.INTER_CUBIC)
    return n
def fbm(base=64, octaves=4):
    out = np.zeros((H, W), np.float32); amp = 1.0; tot = 0
    for o in range(octaves):
        out += amp * noise(max(2, base // 2 ** o)); tot += amp; amp *= 0.5
    return out / tot
def rgb(h): h = h.lstrip("#"); return np.array([int(h[i:i+2], 16) for i in (0, 2, 4)], np.float32)
def sstep(a, b, x): t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)

GOLD = rgb("#C39A2B")
def gold_layer(alpha):
    """folha de ouro: cor + brilho que varia com a luz da peça e pontos de reflexo"""
    sparkle = sstep(0.72, 0.95, fbm(6, 2))[..., None]
    g = GOLD * (0.42 + 0.85 * shade ** 1.3) + 38 * sparkle
    return np.clip(g, 0, 255), alpha

def flakes(density=0.09):
    """pedaços de folha de ouro espalhados (manchas irregulares)"""
    n = 0.7 * fbm(12, 3) + 0.3 * fbm(4, 2)
    thr = np.quantile(n[vase], 1 - density)
    return sstep(thr - 0.01, thr + 0.02, n)[..., None]

def render(name, base):
    out = np.clip(base, 0, 255)
    res = im * (1 - m) + out * m
    cv2.imwrite(OUT + f"listrado-premium-{name}.webp", np.clip(res, 0, 255).astype(np.uint8)[:, :, ::-1], [cv2.IMWRITE_WEBP_QUALITY, 86])

# preto e dourado
black = rgb("#17171A") * (0.45 + 1.1 * shade ** 1.3)
g, a = gold_layer(flakes(0.09))
render("preto-dourado", black * (1 - a) + g * a)

# vermelho e dourado
red = rgb("#9E1620") * (0.55 + 0.85 * shade ** 1.2)
g, a = gold_layer(flakes(0.09))
render("vermelho-dourado", red * (1 - a) + g * a)

# mármore com veios de folha de ouro
cloud = (0.94 + 0.10 * fbm(90, 4))[..., None]
base = rgb("#EEEBE5") * cloud * (0.50 + 0.62 * shade)
w1 = fbm(120, 5); w2 = fbm(150, 5)
t1 = np.abs(np.sin((xx * 0.006 + yy * 0.004 + 5 * w1) * np.pi))
t2 = np.abs(np.sin((xx * 0.004 - yy * 0.006 + 6 * w2) * np.pi))
gray = np.clip(1 - t1 / 0.16, 0, 1)[..., None] ** 1.5
vein = np.clip(1 - t2 / 0.07, 0, 1)[..., None] ** 1.2
base = base * (1 - 0.55 * gray) + rgb("#7C7B7B") * 0.55 * gray * (0.5 + 0.5 * shade)
g, _ = gold_layer(vein)
render("marmore", base * (1 - vein) + g * vein)
print("ok")
