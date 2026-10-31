"""Genera les imatges de portada i del vídeo a partir dels models reals:
python3 tools/portades.py [url_base]   (amb `python3 -m http.server` en marxa a l'arrel)"""
import sys, io
from playwright.sync_api import sync_playwright
from PIL import Image
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8000/'
GL = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
with sync_playwright() as p:
    b = p.chromium.launch(args=GL)
    for kind, out in [('ull', 'portada_ull'), ('oid', 'portada_orella')]:
        pg = b.new_page(viewport={'width': 900, 'height': 900}, device_scale_factor=1)
        pg.goto(f'{BASE}tools/preview.html?k={kind}&nl=1&fw=0.98&fh=0.98', wait_until='domcontentloaded')
        pg.wait_for_function('window.done', timeout=90000); pg.wait_for_timeout(2500)
        import base64
        data = pg.evaluate('window.V.snapshot()').split(',', 1)[1]  # el llenç directament (sense captura de pantalla)
        img = Image.open(io.BytesIO(base64.b64decode(data))).convert('RGBA')
        bg = Image.new('RGBA', img.size, (255, 255, 255, 255)); bg.alpha_composite(img); img = bg.convert('RGB')
        img.save(f'assets/{out}.webp', quality=82)
        print(out, img.size); pg.close()
    b.close()
