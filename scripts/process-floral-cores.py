"""
Imagens ILUSTRATIVAS das cores "em breve" do Vaso Floral Luxo (ainda não produzidas).
Recolore a foto assets/floral/luxo-ambiente-banheiro.png usando a máscara do vaso (assets/floral/*.mask.png),
mantendo luz/sombra do relevo. Cada flor recebe um degradê radial (centro -> borda da pétala).

  python3 -m venv /tmp/v && /tmp/v/bin/pip install opencv-python-headless numpy
  /tmp/v/bin/python scripts/process-floral-cores.py
"""
import cv2, numpy as np, os

SRC = "assets/floral/luxo-ambiente-banheiro.png"
MASK = "assets/floral/luxo-ambiente-banheiro.mask.png"
OUT = "public/images/products"
CENTERS = [(265, 315), (176, 315), (351, 313), (214, 399), (312, 399)]  # miolo de cada flor (x, y)
R = 50.0  # raio aproximado de uma flor

def hexrgb(h):
    h = h.lstrip("#"); return np.array([int(h[i:i+2], 16) for i in (0, 2, 4)], np.float32)

im = cv2.imread(SRC).astype(np.float32)[:, :, ::-1]  # RGB
m = cv2.imread(MASK, 0).astype(np.float32) / 255
m = cv2.GaussianBlur(m, (0, 0), 1.0)[..., None]
H, W = m.shape[:2]
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
d = np.min([np.hypot(xx - cx, yy - cy) for cx, cy in CENTERS], axis=0) / R  # distância normalizada ao miolo mais próximo
lum = im @ np.array([0.299, 0.587, 0.114], np.float32)
vase = m[..., 0] > 0.5
ref = np.percentile(lum[vase], 92)
shade = np.clip(lum / ref, 0, 1.15)[..., None]  # relevo (luz/sombra)

def sstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)

def render(name, body, inner, outer, in_end=0.35, out_start=0.75, dark=False):
    body, inner, outer = hexrgb(body), hexrgb(inner), hexrgb(outer)
    flower = (1 - sstep(0.88, 1.12, d))[..., None]       # 1 dentro da flor, 0 no corpo do vaso
    t = sstep(in_end, out_start, d)[..., None]
    fcol = inner * (1 - t) + outer * t
    col = body * (1 - flower) + fcol * flower
    if dark:  # cores escuras: mantém o relevo sem apagar tudo
        out = col * (0.35 + 0.9 * shade ** 1.4)
    else:
        out = col * (shade ** 1.15)
    out = np.clip(out, 0, 255)
    res = im * (1 - m) + out * m
    # quadrado 1000x1000
    x0 = 5
    sq = res[0:H, x0:x0 + H]
    sq = cv2.resize(sq, (1000, 1000), interpolation=cv2.INTER_LANCZOS4)
    sq = np.clip(sq, 0, 255).astype(np.uint8)
    sharp = cv2.GaussianBlur(sq, (0, 0), 1.2)
    sq = cv2.addWeighted(sq, 1.5, sharp, -0.5, 0)
    cv2.imwrite(os.path.join(OUT, f"floral-luxo-{name}.webp"), sq[:, :, ::-1], [cv2.IMWRITE_WEBP_QUALITY, 84])

WHITE = "#F4F1EA"
render("rosa",      WHITE,     WHITE,     "#E58FB0")
render("roxo",      WHITE,     WHITE,     "#8E5DB5")
render("amarelo",  WHITE,     WHITE,     "#F2C230")
render("verde-roxo", "#4F7D4B", WHITE,    "#7B4AA8", in_end=0.30, out_start=0.80)
render("preto-vermelho", "#1C1C1C", "#D3202A", "#B3121E", in_end=0.5, out_start=1.0, dark=True)
render("branco-vermelho", "#D9D6D1", "#D3202A", "#B3121E", in_end=0.5, out_start=1.0)
print("ok")
