"""Partida completa automatitzada: python3 tests/e2e.py [url] [carpeta_captures]
Comprova: entrada, sobre d'instruccions, 6 pàgines 3D (arrossegar, tocar, error, pista),
punts visibles a la vista inicial, test de 20, text de patologies (30 buits), informe i persistència."""
import sys, os
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8000/'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'shots'
KEY = 'far-u4-sentits-v1'
os.makedirs(OUT, exist_ok=True)
errors = []
GL = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']


def close_intro(pg, shot=None):
    pg.wait_for_selector('#intro-go'); pg.wait_for_timeout(900)
    assert pg.locator('#intro').count() == 1, 'un sol sobre'
    if shot:
        pg.screenshot(path=shot)
    pg.click('#intro-go'); pg.wait_for_selector('#intro', state='detached')


def state(pg):
    return pg.evaluate(f"JSON.parse(localStorage.getItem('{KEY}'))")


def center(pg, sel):
    # espera que l'element estigui quiet (els forats llisquen uns fotogrames després de girar)
    prev = None
    for _ in range(40):
        b = pg.locator(sel).first.bounding_box()
        cur = (round(b['x']), round(b['y']))
        if cur == prev:
            break
        prev = cur; pg.wait_for_timeout(120)
    return b['x'] + b['width'] / 2, b['y'] + b['height'] / 2


def settle(pg):
    pg.wait_for_timeout(150)
    pg.wait_for_function("!document.querySelector('.fly-card, .chip.lifting')", timeout=15000)
    pg.wait_for_timeout(250)


def drag(pg, chip_sel, target_sel):
    x, y = center(pg, chip_sel); tx, ty = center(pg, target_sel)
    pg.mouse.move(x, y); pg.mouse.down(); pg.mouse.move(x + 20, y + 10, steps=3)
    pg.mouse.move(tx, ty, steps=8); pg.mouse.up(); settle(pg)


with sync_playwright() as p:
    b = p.chromium.launch(args=GL)
    pg = b.new_page(viewport={'width': 1366, 'height': 768})
    pg.on('console', lambda m: m.type == 'error' and '404' not in m.text and errors.append(m.text))
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto(URL, wait_until='domcontentloaded'); pg.evaluate('localStorage.clear()'); pg.reload(wait_until='domcontentloaded')
    pg.wait_for_timeout(500); pg.screenshot(path=f'{OUT}/0_entrada.png')
    pg.fill('input[name=email]', 'prova@isvh.cat'); pg.fill('input[name=password]', 'xx'); pg.click('#login .btn')
    assert 'contrasenya' in pg.inner_text('#fb').lower()
    pg.fill('input[name=email]', 'prova@gmail.com'); pg.fill('input[name=password]', 'alumnesfar'); pg.click('#login .btn')
    assert 'isvh' in pg.inner_text('#fb').lower()
    pg.fill('input[name=email]', 'prova@isvh.cat'); pg.click('#login .btn')
    close_intro(pg, f'{OUT}/1_sobre.png')
    names = pg.evaluate("import('./models.js').then(m => Object.fromEntries(Object.values(m.MODELS).flatMap(x => x.targets.map(t => [t.id, t.name]))))")

    for lvl in range(6):
        pg.wait_for_selector('.chip'); pg.wait_for_timeout(1800)
        hidden = pg.locator('.dot.hidden').count()
        assert hidden == 0, f'pàgina {lvl + 1}: {hidden} punts amagats a la vista inicial'
        pg.screenshot(path=f'{OUT}/2_pagina{lvl + 1}.png')
        ids = pg.eval_on_selector_all('.slot[data-target]', 'els => els.map(e => e.dataset.target)')
        if lvl == 0:
            # error: el primer cromo a un forat que no és el seu
            first = pg.get_attribute('.chip:not(.gone)', 'data-name')
            wrong = next(i for i in ids if names[i] != first)
            drag(pg, f'.chip[data-name="{first}"]', f'.slot[data-target="{wrong}"]')
            st = state(pg); assert st['errors'] == 1 and st['points'] == 0, 'error −3 amb mínim 0'
            # pista: seleccionar i demanar-la
            pg.click(f'.chip[data-name="{first}"]'); pg.click('#hint'); pg.wait_for_timeout(300)
            assert pg.locator('.slot.ask').count() == 1, 'la pista marca un forat'
            pg.click(f'.chip[data-name="{first}"]')  # desselecciona
        for k, tid in enumerate(ids):
            nm = names[tid]
            for attempt in range(3):  # en programari (sense GPU) un forat encara pot estar lliscant: es reintenta
                if pg.locator(f'.chip[data-name="{nm}"]:not(.gone)').count() == 0:
                    break
                if (k + attempt) % 2 == 0:
                    drag(pg, f'.chip[data-name="{nm}"]', f'.slot[data-target="{tid}"]')
                else:  # tocar el cromo i després el punt
                    if pg.get_attribute(f'.chip[data-name="{nm}"]', 'aria-pressed') != 'true':
                        pg.click(f'.chip[data-name="{nm}"]')
                    x, y = center(pg, f'.dot[data-target="{tid}"]'); pg.mouse.click(x, y); settle(pg)
            st = state(pg); assert st['p1']['placed'][str(lvl)].get(tid), f'{nm} no enganxat'
            # el model es pot girar entre intents sense trencar res
            if k == 2:
                bx, by = center(pg, '#glhost'); pg.mouse.move(bx, by + 120); pg.mouse.down(); pg.mouse.move(bx + 60, by + 100, steps=6); pg.mouse.up(); pg.wait_for_timeout(2500)
        try:
            pg.wait_for_selector('.done-card', timeout=8000)
        except Exception:
            pg.screenshot(path=f'{OUT}/ERROR_pagina{lvl + 1}.png'); print('feedback:', pg.inner_text('#fb'), state(pg)['p1']['placed']); raise
        if lvl == 0:
            pg.wait_for_timeout(900); pg.screenshot(path=f'{OUT}/3_pagina_completa.png')
            st = state(pg); assert st['p1']['stats']['0']['stars'] == 1 or st['p1']['stats']['0']['stars'] == 2
            pg.reload(wait_until='domcontentloaded'); pg.wait_for_selector('.done-card'); assert pg.locator('.slot.done').count() == len(ids), 'recàrrega conserva els cromos'
        pg.click('#next')

    # Test
    close_intro(pg, f'{OUT}/4_sobre_test.png')
    st = state(pg); order = st['p2']['order']
    assert len(order) == 20, '20 preguntes'
    quiz = pg.evaluate("import('./data.js').then(m => m.QUIZ)")
    blocks = [quiz[i][4] for i in order]
    assert blocks.count('coord') == 4 and blocks.count('vista') == 8 and blocks.count('oida') == 8, 'barreja 4/8/8'
    for i in range(20):
        pg.wait_for_selector('.choice')
        if i == 0:
            pg.screenshot(path=f'{OUT}/5_test.png')
        qi = state(pg)['p2']['order'][i]
        right = quiz[qi][2]
        pick = right if i % 5 else (right + 1) % 4
        pg.click(f'.choice[data-o="{pick}"]'); pg.wait_for_timeout(150)
        if i == 0:
            pg.screenshot(path=f'{OUT}/5_test_resposta.png')
        pg.click('#next')
    # Text de patologies
    close_intro(pg, f'{OUT}/6_sobre_patologies.png')
    cloze = pg.evaluate("import('./logic.js').then(l => import('./data.js').then(d => d.CLOZE.map(c => l.parseCloze(c.body).filter(x => typeof x !== 'string').map(g => g.ok))))")
    for t, oks in enumerate(cloze):
        pg.wait_for_selector('select.gap')
        if t == 0:
            pg.click('#hint'); assert 'Pista' in pg.inner_text('#fb')
        for k, ok in enumerate(oks):
            key = f'{t}-{k}'
            opts = pg.eval_on_selector(f'select.gap[data-key="{key}"]', 'e => [...e.options].slice(1).map(o => o.value)')
            assert len(opts) == 3 and ok in opts
            val = ok if (k + t) % 4 else next(o for o in opts if o != ok)
            pg.select_option(f'select.gap[data-key="{key}"]', val); pg.wait_for_timeout(120)
        if t == 0:
            pg.wait_for_timeout(500); pg.screenshot(path=f'{OUT}/7_patologies.png')
        pg.click('#next')
    # Informe
    pg.wait_for_selector('#report'); pg.wait_for_timeout(1500)
    pg.screenshot(path=f'{OUT}/8_informe.png', full_page=True)
    st = state(pg)
    assert st['phase'] == 4 and st['end']
    txt = pg.inner_text('#report')
    assert '/20' in txt and '/30' in txt and 'Classroom' in txt
    pg.emulate_media(media='print'); pg.wait_for_timeout(300); pg.screenshot(path=f'{OUT}/9_impressio.png', full_page=True); pg.emulate_media(media='screen')
    pg.pdf(path=f'{OUT}/informe_prova.pdf', format='A4', print_background=True)
    print('Punts finals:', st['points'], '· errors', st['errors'], '· pistes', st['hints'])

    # Resolucions: primera pàgina 3D (estat nou)
    for w, h in [(1024, 700), (390, 844), (1920, 1080)]:
        q = b.new_page(viewport={'width': w, 'height': h})
        q.on('pageerror', lambda e: errors.append(str(e)))
        q.goto(URL, wait_until='domcontentloaded')
        q.evaluate(f"localStorage.setItem('{KEY}', JSON.stringify(Object.assign({{}}, {{v:1,email:'prova@isvh.cat',phase:1,start:Date.now(),end:null,points:0,streak:0,correct:0,errors:0,hints:0,phasePts:{{1:0,2:0,3:0}},p1:{{level:3,placed:{{}},stats:{{}},levelStart:Date.now(),bank:{{}}}},p2:{{order:[],perm:{{}},i:0,answers:{{}}}},p3:{{i:0,perm:{{}},answers:{{}},hinted:{{}}}},review:{{atlas:{{}},quiz:[],cloze:[]}},seen:{{1:true}}}})))")
        q.reload(wait_until='domcontentloaded'); q.wait_for_selector('.chip'); q.wait_for_timeout(1800)
        sw = q.evaluate('document.documentElement.scrollWidth')
        assert sw <= w + 1, f'scroll horitzontal a {w}px'
        q.screenshot(path=f'{OUT}/res_{w}x{h}.png', full_page=(w < 600))
        q.close()
    b.close()

if errors:
    print('ERRORS DE CONSOLA:', errors); sys.exit(1)
print('✓ Partida completa sense errors')
