"""Captures reals del joc per al vídeo «Com es juga»: python3 tools/captures_video.py [url]"""
import sys, json
from playwright.sync_api import sync_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8000/'
OUT = 'video/public'
GL = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
def box(pg, sel):
    b = pg.locator(sel).first.bounding_box(); return {'x': b['x'], 'y': b['y'], 'w': b['width'], 'h': b['height']}
def calm(pg):
    pg.wait_for_timeout(200); pg.wait_for_function("!document.querySelector('.fly-card, .chip.lifting, .float-pts, .spark')", timeout=20000); pg.wait_for_timeout(1800)
with sync_playwright() as p:
    b = p.chromium.launch(args=GL)
    pg = b.new_page(viewport={'width': 1280, 'height': 720})
    pg.goto(URL, wait_until='domcontentloaded'); pg.evaluate('localStorage.clear()'); pg.evaluate("localStorage.setItem('vq-sound','off')"); pg.reload(wait_until='domcontentloaded')
    pg.fill('input[name=email]', 'alumne@isvh.cat'); pg.fill('input[name=password]', 'alumnesfar'); pg.click('#login .btn')
    pg.wait_for_selector('#intro-go'); pg.wait_for_timeout(800); pg.click('#intro-go'); pg.wait_for_selector('#intro', state='detached'); calm(pg)
    pg.evaluate("document.querySelector('#clock').style.visibility='hidden'")
    meta = {}
    pg.screenshot(path=f'{OUT}/a.png')
    meta['chipA'] = box(pg, '.chip[data-name="Còrnia"]'); meta['slotA'] = box(pg, '.slot[data-target="ull-cornia"]')
    x = meta['chipA']; t = meta['slotA']
    pg.mouse.move(x['x'] + x['w'] / 2, x['y'] + x['h'] / 2); pg.mouse.down(); pg.mouse.move(x['x'] + 40, x['y'] + 20, steps=4); pg.mouse.move(t['x'] + t['w'] / 2, t['y'] + t['h'] / 2, steps=10); pg.mouse.up(); calm(pg)
    pg.evaluate("document.querySelector('#fb').innerHTML=''")
    pg.screenshot(path=f'{OUT}/b.png')
    g = box(pg, '#glhost'); meta['rot'] = {'x0': g['x'] + g['w'] * 0.66, 'y0': g['y'] + g['h'] * 0.80, 'x1': g['x'] + g['w'] * 0.52, 'y1': g['y'] + g['h'] * 0.80}
    r = meta['rot']; pg.mouse.move(r['x0'], r['y0']); pg.mouse.down(); pg.mouse.move(r['x1'], r['y1'], steps=12); pg.mouse.up(); calm(pg); pg.wait_for_timeout(1500)
    pg.screenshot(path=f'{OUT}/c.png')
    meta['chipC'] = box(pg, '.chip[data-name="Iris"]'); meta['dotC'] = box(pg, '.dot[data-target="ull-iris"]'); meta['slotC'] = box(pg, '.slot[data-target="ull-iris"]')
    pg.click('.chip[data-name="Iris"]'); pg.wait_for_timeout(300)
    pg.screenshot(path=f'{OUT}/c_sel.png')
    d = meta['dotC']; pg.mouse.click(d['x'] + d['w'] / 2, d['y'] + d['h'] / 2); calm(pg)
    pg.evaluate("document.querySelector('#fb').innerHTML=''")
    pg.screenshot(path=f'{OUT}/d.png')
    json.dump(meta, open(f'{OUT}/meta.json', 'w'), indent=1); print(json.dumps(meta))
    b.close()
