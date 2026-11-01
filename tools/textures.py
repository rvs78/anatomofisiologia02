"""Prepara les imatges generades amb IA (OpenRouter · google/gemini-3-pro-image) per al joc.
Entrada: carpeta amb ull.webp, orella.webp, iris.webp i fons.webp (1024 px, tal com les retorna el model).
Sortida: assets/portada_ull.webp, assets/portada_orella.webp, assets/tex_iris.webp, assets/tex_fons.webp
Ús: python3 tools/textures.py carpeta_imatges

El fons d'ull: es detecten el camp circular, el disc òptic (zona més brillant) i la fòvea (zona més fosca
del canal vermell prop del centre). Aquests valors van a FONS de models.js, que alinea la imatge amb el disc
i la màcula del model 3D. Fora del camp, la vora s'allarga radialment i es difumina (sense negre)."""
import sys
import numpy as np
from PIL import Image, ImageFilter

SRC = sys.argv[1] if len(sys.argv) > 1 else '.'
A = 'assets/'
for src, dst in [('ull', 'portada_ull'), ('orella', 'portada_orella')]:
    Image.open(f'{SRC}/{src}.webp').convert('RGB').resize((900, 900), Image.LANCZOS).save(A + dst + '.webp', quality=84)
Image.open(f'{SRC}/iris.webp').convert('RGB').resize((768, 768), Image.LANCZOS).save(A + 'tex_iris.webp', quality=86)

f = np.asarray(Image.open(f'{SRC}/fons.webp').convert('RGB')).astype(float)
H, W, _ = f.shape
L = f.mean(2)
yy, xx = np.mgrid[0:H, 0:W]
mask = L > 25
cy, cx = yy[mask].mean(), xx[mask].mean(); r = np.sqrt(mask.sum() / np.pi)
blur = np.asarray(Image.fromarray(L.astype(np.uint8)).filter(ImageFilter.GaussianBlur(12))).astype(float)
inside = (xx - cx) ** 2 + (yy - cy) ** 2 < (0.85 * r) ** 2
dy, dx = divmod(int(np.argmax(np.where(inside, blur, 0))), W)
R = np.asarray(Image.fromarray(f[..., 0].astype(np.uint8)).filter(ImageFilter.GaussianBlur(20))).astype(float)
cand = np.where(inside & (((xx - dx) ** 2 + (yy - dy) ** 2) > (0.15 * W) ** 2) & (((xx - cx) ** 2 + (yy - cy) ** 2) < (0.35 * r) ** 2), R, 999)
fy, fx = divmod(int(np.argmin(cand)), W)
print(f"FONS = {{ c: [{cx / W:.4f}, {cy / H:.4f}], r: 0.47, disc: [{dx / W:.4f}, {dy / H:.4f}], fovea: [{fx / W:.4f}, {fy / H:.4f}] }}")

c = (cx, cy); R0 = 0.47 * W
ddx, ddy = xx - c[0], yy - c[1]; rr = np.hypot(ddx, ddy) + 1e-6
s = np.minimum(rr, R0) / rr
sx = np.clip((c[0] + ddx * s).astype(int), 0, W - 1); sy = np.clip((c[1] + ddy * s).astype(int), 0, H - 1)
ext = f[sy, sx]
blurred = np.asarray(Image.fromarray(ext.astype(np.uint8)).filter(ImageFilter.GaussianBlur(28))).astype(float)
t = np.clip((rr - 0.43 * W) / (0.05 * W), 0, 1)[..., None]
out = f * (1 - t) + blurred * t
out = np.where((rr > R0)[..., None], blurred, out)
Image.fromarray(out.astype(np.uint8)).save(A + 'tex_fons.webp', quality=88)
