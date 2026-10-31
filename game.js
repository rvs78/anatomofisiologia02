// Sentits Quest · U4 — mateixa estructura que Vascular Quest (rvs78/anatomia02):
// entrada, sobre d'instruccions, 3 fases (Models 3D, Test, Text de patologies) i informe.
import { MODELS, mountViewer } from './models.js';
import { LEVELS, QUIZ, QUIZ_MIX, CLOZE } from './data.js';
import { shuffle, applyScore, stars, formatTime, pickQuiz, parseCloze } from './logic.js';
import * as fx from './fx.js';

const KEY = 'far-u4-sentits-v1';
const PASSWORD = 'alumnesfar';
const PHASES = ['Models 3D', 'Test', 'Patologies', 'Informe'];
const CLOZE_PARTS = CLOZE.map(c => parseCloze(c.body));
const GAPS = CLOZE_PARTS.flatMap((parts, t) => parts.filter(p => typeof p !== 'string').map((g, k) => ({ key: `${t}-${k}`, t, ...g })));

const app = document.querySelector('#app');
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ic = (name, cls = 'icon') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const starRow = (n, cls = 'stars') => `<div class="${cls}" role="img" aria-label="${n} de 3 estrelles">${[0, 1, 2].map(i => `<svg viewBox="0 0 24 24" class="${i < n ? '' : 'no'}"><use href="#i-star"/></svg>`).join('')}</div>`;
const modelName = m => (m === 'ull' ? 'Ull' : 'Orella');

/* ---------- Estat ---------- */
const fresh = email => ({
  v: 1, email, phase: 1, start: Date.now(), end: null,
  points: 0, streak: 0, correct: 0, errors: 0, hints: 0, phasePts: { 1: 0, 2: 0, 3: 0 },
  p1: { level: 0, placed: {}, stats: {}, levelStart: Date.now(), bank: {}, skipped: false },
  p2: { order: pickQuiz(QUIZ, QUIZ_MIX), perm: {}, i: 0, answers: {} },
  p3: { i: 0, perm: {}, answers: {}, hinted: {} },
  review: { atlas: {}, quiz: [], cloze: [] },
  seen: {},
});
let s = null;
try { s = JSON.parse(localStorage.getItem(KEY)); if (!s || s.v !== 1) s = null; } catch { s = null; }
if (s) s.seen ||= {};
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* mode privat */ } };
let cleanup = () => {};

const levelTargets = lvl => {
  const L = LEVELS[lvl], all = MODELS[L.model].targets;
  return L.names === 'ALL' ? all : all.filter(t => L.names.includes(t.name));
};

/* ---------- Capçalera ---------- */
function header() {
  $('#steps').innerHTML = s ? PHASES.map((p, i) => {
    const n = i + 1, cur = n === s.phase;
    return `<li ${cur ? 'aria-current="step"' : ''} class="${n < s.phase ? 'done' : ''}">${n < s.phase ? ic('check') : ''}<span>${p}</span></li>`;
  }).join('') : '';
  const on = fx.sound.enabled();
  $('#score').innerHTML = s ? `
    <span class="who">${esc(s.email)}</span>
    <span class="pts">Punts <b id="pts">${s.points}</b></span>
    <span class="streak" title="Encerts seguits. Cada 3, +15 punts">Ratxa <b id="streak">${s.streak}</b></span>
    <button class="iconbtn no-print" id="sound" aria-pressed="${on}" aria-label="${on ? 'Silencia els sons' : 'Activa els sons'}" title="So">${ic(on ? 'sound' : 'mute')}</button>
    <button class="iconbtn no-print" id="logout" aria-label="Surt i esborra el progrés" title="Surt">${ic('exit')}</button>` : `
    <button class="iconbtn no-print" id="sound" aria-pressed="${on}" aria-label="${on ? 'Silencia els sons' : 'Activa els sons'}" title="So">${ic(on ? 'sound' : 'mute')}</button>`;
  $('#sound').onclick = () => { fx.sound.toggle(); header(); };
  const out = $('#logout');
  if (out) out.onclick = () => {
    if (!confirm('Vols sortir? Es perdrà el progrés desat en aquest navegador.')) return;
    localStorage.removeItem(KEY); s = null; render();
  };
}

function score(kind, phase) {
  const before = s.points;
  const r = applyScore(s, kind, phase);
  save(); header();
  if (s.points !== before) { const p = $('#pts'); p?.classList.add('bump'); }
  if (r.bonus) { fx.banner('Ratxa de 3! +15'); fx.sound.play('bonus'); }
  return r;
}

function render() {
  cleanup(); cleanup = () => {};
  document.body.dataset.system = '';
  if (!s) return login();
  header();
  if (s.phase === 1) modelPhase();
  else if (s.phase === 2) quizPhase();
  else if (s.phase === 3) clozePhase();
  else return report();
  if (!s.seen[s.phase] && !$('#intro')) intro(s.phase);
}

/* ---------- Sobre d'instruccions ---------- */
const INTROS = {
  1: {
    title: 'Fase 1 <span>Models 3D</span>',
    lead: 'Cada nivell és una pàgina de l\'àlbum. Enganxa cada cromo a l\'estructura de l\'ull o de l\'orella que li correspon.',
    video: true,
    cards: [
      ['ull', 'drag', 'Arrossega', 'Porta cada cromo fins al seu forat o fins al punt negre del model.'],
      ['oid', 'rotate', 'Gira el model', 'Arrossega el fons blanc per girar-lo. Roda o botons + i − per apropar-lo.'],
      ['foil', 'target', 'O toca i col·loca', 'Toca un cromo i després el forat. Amb teclat: Tab i Enter.'],
    ],
  },
  2: {
    title: 'Fase 2 <span>Test</span>',
    lead: 'Vint preguntes d\'anatomia de la coordinació, la vista i l\'oïda. Només una resposta és correcta.',
    cards: [
      ['ull', 'keys', 'Respon ràpid', 'Clica una opció o prem les tecles 1, 2, 3 o 4.'],
      ['oid', 'bulb', 'Aprèn de l\'error', 'Després de respondre veuràs la correcta i per què.'],
      ['foil', 'star', 'Ratxa', 'Tres encerts seguits sumen 15 punts extra.'],
    ],
  },
  3: {
    title: 'Fase 3 <span>Patologies</span>',
    lead: 'Quatre textos sobre les patologies de la vista i l\'oïda. Tria la paraula que falta a cada buit.',
    cards: [
      ['ull', 'list', 'Tria al desplegable', 'Cada buit té tres opcions i només una és correcta.'],
      ['oid', 'check', 'Un sol intent', 'En triar, es corregeix al moment. Si falles, veuràs la correcta i anirà a la llista de repàs.'],
      ['foil', 'bulb', 'Pista', 'Et dona una pista sobre el buit marcat en daurat (−5).'],
    ],
  },
};
function intro(phase) {
  const I = INTROS[phase]; if (!I) return;
  const wrap = document.createElement('div');
  wrap.className = 'intro'; wrap.id = 'intro';
  wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-labelledby', 'intro-title');
  wrap.innerHTML = `
    <div class="envelope">
      <div class="flap"></div>
      <div class="inside">
        <h2 id="intro-title">${I.title}</h2>
        <p>${I.lead}</p>
        ${I.video ? `<video src="./assets/tutorial.mp4" poster="./assets/tutorial.jpg" autoplay muted loop playsinline aria-label="Vídeo: com s'enganxa un cromo sobre el model 3D"></video>` : ''}
        <div class="cards">${I.cards.map(([c, i, h, p]) => `<div class="howto ${c}">${ic(i, '')}<h3>${h}</h3><p>${p}</p></div>`).join('')}</div>
        <div class="row">
          <p class="muted" style="color:var(--cover-muted)">Encert +10 · Error −3 · Pista −5</p>
          <button class="btn" id="intro-go">${ic('play')} Comença</button>
        </div>
      </div>
    </div>`;
  document.body.append(wrap);
  const vid = $('video', wrap); if (vid) vid.onerror = () => vid.remove();
  const prev = document.activeElement;
  const close = () => {
    s.seen[phase] = true; save();
    document.removeEventListener('keydown', onKey);
    const done = () => { wrap.remove(); (prev && prev.isConnected ? prev : $('.chip:not(.gone), select.gap:not(:disabled), .choice'))?.focus?.({ preventScroll: true }); };
    if (fx.reduced()) return done();
    wrap.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180 }).finished.then(done, done);
  };
  const onKey = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  $('#intro-go', wrap).onclick = close;
  $('#intro-go', wrap).focus({ preventScroll: true });
  fx.sound.play('open');
  if (fx.reduced()) return;
  const env = $('.envelope', wrap), ease = 'cubic-bezier(0.16, 1, 0.3, 1)';
  wrap.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
  env.animate([{ transform: 'translateY(40px) scale(.9) rotate(-2deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 480, easing: ease });
  $('.flap', wrap).animate([{ transform: 'scaleY(5)', filter: 'brightness(1.2)' }, { transform: 'scaleY(1)' }], { duration: 520, delay: 220, easing: ease, fill: 'backwards' });
  $$('.howto', wrap).forEach((c, i) => c.animate(
    [{ transform: `translateY(60px) rotate(${(i - 1) * 9}deg) scale(.85)`, opacity: 0 }, { transform: 'none', opacity: 1 }],
    { duration: 520, delay: 380 + i * 110, easing: ease, fill: 'backwards' }));
}

/* ---------- Entrada ---------- */
function login() {
  header();
  app.innerHTML = `
  <section class="welcome">
    <div class="intro-col">
      <h1>Sentits <span>Quest</span></h1>
      <p>Omple l'àlbum de la vista i l'oïda de la Unitat 4, sobre models 3D de l'ull i de l'orella que pots girar.</p>
      <ol>
        <li><span><b>Models 3D.</b> Enganxa cada cromo a la seva estructura, en sis pàgines.</span></li>
        <li><span><b>Test.</b> Vint preguntes d'anatomia, amb explicació.</span></li>
        <li><span><b>Patologies.</b> Completa quatre textos triant la paraula correcta.</span></li>
      </ol>
      <form id="login" novalidate>
        <label class="field">Correu de l'institut<input name="email" type="email" autocomplete="email" placeholder="nom@isvh.cat" required></label>
        <label class="field">Contrasenya de l'aula<input name="password" type="password" autocomplete="current-password" required></label>
        <button class="btn">${ic('play')} Obre l'àlbum</button>
        <p class="feedback err" id="fb" role="alert"></p>
      </form>
      <p class="note">El progrés es desa en aquest navegador. Si canvies d'ordinador o fas servir una finestra privada, començaràs de nou.</p>
    </div>
    <div class="art">
      <div class="cover-plates" aria-hidden="true">
        <figure class="plate-card ull"><img src="./assets/portada_ull.webp" alt="" width="900" height="900"><figcaption>Ull</figcaption></figure>
        <figure class="plate-card oid"><img src="./assets/portada_orella.webp" alt="" width="900" height="900"><figcaption>Orella</figcaption></figure>
      </div>
      <p class="credit">Aplicación de Rubén Vallejo</p>
    </div>
  </section>`;
  $('#login').onsubmit = e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const email = String(f.get('email')).trim().toLowerCase();
    const fail = m => { $('#fb').innerHTML = ic('x') + `<span>${m}</span>`; fx.shake($('#login')); fx.sound.play('miss'); };
    if (!/^[^@\s]+@isvh\.cat$/.test(email)) return fail('Escriu el teu correu acabat en @isvh.cat.');
    if (f.get('password') !== PASSWORD) return fail('La contrasenya no és correcta. Demana-la al professorat.');
    s = fresh(email); save(); render();
  };
}

/* ---------- Escenari 3D (models, forats i línies guia) ---------- */
const SVGNS = 'http://www.w3.org/2000/svg';
function mountStage(stage, kind, targets, pageLabel) {
  stage.innerHTML = `
    ${pageLabel ? `<div class="pageno">${pageLabel}</div>` : ''}
    <div class="plate3d" id="plate">
      <div class="glhost" id="glhost"></div>
      <svg class="leaders" aria-hidden="true"></svg>
      <div class="overlay" id="overlay"></div>
      <p class="modelcap">${esc(MODELS[kind].title)}</p>
      <p class="gesture no-print">${ic('rotate')} Arrossega el fons per girar</p>
    </div>
    <div class="zoomer no-print">
      <button type="button" data-z="in" aria-label="Apropa el model">${ic('plus')}</button>
      <button type="button" data-z="out" aria-label="Allunya el model">${ic('minus')}</button>
      <button type="button" data-z="fit" aria-label="Torna a la vista inicial">${ic('fit')}</button>
    </div>`;
  const plate = $('#plate', stage), overlay = $('#overlay', stage), svg = $('svg.leaders', stage);
  const V = mountViewer($('#glhost', stage), kind, { reducedMotion: fx.reduced(), fitWidth: stage.clientWidth < 600 ? 0.66 : 0.64, fitHeight: stage.clientWidth < 600 ? 0.95 : 0.86 });
  if (!V) return null;
  stage.querySelector('.zoomer').onclick = e => {
    const b = e.target.closest('[data-z]'); if (!b) return;
    if (b.dataset.z === 'in') V.zoomBy(0.8); else if (b.dataset.z === 'out') V.zoomBy(1.25); else V.reset();
  };
  const items = new Map();
  for (const t of targets) {
    const slot = document.createElement('button'); slot.type = 'button'; slot.className = 'slot'; slot.dataset.target = t.id; slot.setAttribute('aria-label', 'Forat buit');
    const dot = document.createElement('button'); dot.type = 'button'; dot.className = 'dot'; dot.dataset.target = t.id; dot.tabIndex = -1; dot.setAttribute('aria-hidden', 'true');
    const line = document.createElementNS(SVGNS, 'line'); line.dataset.for = t.id;
    svg.append(line); overlay.append(slot, dot);
    items.set(t.id, { t, slot, dot, line, y: null, x: null, side: null });
  }
  // Disposició: dues columnes de forats; cada forat a l'alçada del seu punt, sense solapaments.
  const GAP = 6;
  function layout() {
    const W = plate.clientWidth, H = plate.clientHeight;
    const narrow = W < 560;
    const sw = narrow ? Math.min(108, W * 0.28) : Math.min(196, Math.max(132, W * 0.2)), sh = narrow ? 28 : 36, m = narrow ? 6 : 12;
    plate.style.setProperty('--sw', sw + 'px'); plate.style.setProperty('--sh', sh + 'px');
    const cols = { L: [], R: [] };
    let cx = 0, n = 0;
    const proj = new Map();
    for (const [id] of items) { const p = V.project(id); proj.set(id, p); cx += p.x; n++; }
    cx = n ? cx / n : W / 2;
    for (const [id, it] of items) {
      const p = proj.get(id);
      const side = p.x < cx ? 'L' : 'R';
      cols[side].push({ id, it, p, y: Math.min(H - sh / 2 - m - 26, Math.max(sh / 2 + m + 44, p.y)) });
    }
    for (const side of ['L', 'R']) {
      const c = cols[side].sort((a, b) => a.p.y - b.p.y);
      for (let i = 1; i < c.length; i++) c[i].y = Math.max(c[i].y, c[i - 1].y + sh + GAP);
      for (let i = c.length - 1; i >= 0; i--) {
        const lim = i === c.length - 1 ? H - sh / 2 - m - 26 : c[i + 1].y - sh - GAP;
        c[i].y = Math.min(c[i].y, lim);
      }
      for (const { it, p, y } of c) {
        const tx = side === 'L' ? m : W - m - sw;
        const k = it.y == null || fx.reduced() ? 1 : 0.28;
        it.y = it.y == null ? y : it.y + (y - it.y) * k;
        it.x = it.x == null ? tx : it.x + (tx - it.x) * k;
        it.side = side;
        it.slot.style.transform = `translate(${it.x}px, ${it.y - sh / 2}px)`;
        it.slot.classList.toggle('L', side === 'L'); it.slot.classList.toggle('R', side === 'R');
        it.dot.style.transform = `translate(${p.x}px, ${p.y}px)`;
        it.dot.classList.toggle('hidden', p.hidden);
        const ex = side === 'L' ? it.x + sw : it.x;
        it.line.setAttribute('x1', ex); it.line.setAttribute('y1', it.y); it.line.setAttribute('x2', p.x); it.line.setAttribute('y2', p.y);
        it.line.classList.toggle('hidden', p.hidden);
      }
    }
  }
  const off = V.onFrame(layout);
  return {
    V, plate, items,
    dispose() { off(); V.dispose(); },
    fill(id, name, cls = 'draw') {
      const it = items.get(id); if (!it) return;
      it.slot.textContent = name; it.slot.setAttribute('aria-label', name); it.slot.classList.add('done'); it.dot.classList.add('done');
      it.line.setAttribute('class', 'done' + (cls ? ' ' + cls : '')); it.line.classList.toggle('hidden', it.dot.classList.contains('hidden'));
    },
  };
}

/** Si el punter és sobre un punt, tria el punt actiu més proper (alguns punts són molt a prop: estrep i finestra oval). */
function nearestTarget(el, x, y) {
  const hit = el?.closest('[data-target]');
  if (!hit || !hit.classList.contains('dot')) return hit;
  let best = hit, bd = Infinity;
  $$('.dot[data-target]:not(.done)').forEach(d => {
    const r = d.getBoundingClientRect(), dd = Math.hypot(r.left + r.width / 2 - x, r.top + r.height / 2 - y);
    if (dd < bd) { bd = dd; best = d; }
  });
  return best;
}

function sayIn(fb) {
  const icons = { ok: 'check', err: 'x', info: 'bulb' };
  return (msg, kind) => { fb.innerHTML = `${ic(icons[kind] || 'bulb')}<span>${esc(msg)}</span>`; fb.className = 'feedback ' + kind; };
}

/* ---------- Fase 1 · Models 3D ---------- */
function modelPhase() {
  const lvl = s.p1.level;
  if (lvl >= LEVELS.length) { s.phase = 2; save(); return render(); }
  const L = LEVELS[lvl], active = levelTargets(lvl);
  const activeIds = new Set(active.map(t => t.id));
  const placed = s.p1.placed[lvl] ||= {};
  const stat = s.p1.stats[lvl] ||= { errors: 0, hints: 0, ms: 0 };
  if (!s.p1.bank[lvl]) { s.p1.bank[lvl] = shuffle(active.map(t => t.name)); s.p1.levelStart = Date.now(); save(); }
  document.body.dataset.system = L.model;

  app.innerHTML = `
  <section class="play">
    <div class="stage" id="stage"></div>
    <aside class="panel">
      <header>
        <h1>${esc(L.title)}</h1>
        <div class="meta"><span class="sysbadge">${modelName(L.model)}</span><span>${L.boss ? 'Totes les estructures del model, sense ajudes' : 'Gira el model per trobar cada punt'}</span></div>
      </header>
      <div class="progress">
        <div class="row"><span><b id="count"></b> enganxats</span><span id="clock"></span></div>
        <div class="bar"><span id="bar"></span></div>
      </div>
      <div id="work">
        <p class="muted" style="margin-bottom:12px">Arrossega cada cromo fins al seu forat, o toca'l i després toca el forat. Els punts grisos són a l'altra cara: gira el model per veure'ls.</p>
        <div class="pile" id="bank" role="list" aria-label="Cromos per enganxar"></div>
      </div>
      <p class="feedback" id="fb" aria-live="polite"></p>
      <div class="row tools" id="tools">
        <button type="button" class="btn ghost small" id="hint">${ic('bulb')} Pista −5</button>
      </div>
    </aside>
  </section>`;

  const stage = $('#stage');
  const P = mountStage(stage, L.model, active, `Pàgina <span>${lvl + 1}</span> / ${LEVELS.length}`);
  if (!P) return noWebGL(stage);
  let timer = 0;
  cleanup = () => { P.dispose(); clearInterval(timer); };
  active.filter(t => placed[t.id]).forEach(t => P.fill(t.id, t.name, ''));

  const bank = $('#bank');
  bank.innerHTML = s.p1.bank[lvl].map(n => `<button type="button" class="chip ${active.some(t => t.name === n && placed[t.id]) ? 'gone' : ''}" role="listitem" aria-pressed="false" data-name="${esc(n)}">${esc(n)}</button>`).join('');
  const say = sayIn($('#fb'));
  let selected = null, busy = false;
  const elapsed = () => stat.ms + (Date.now() - s.p1.levelStart);
  timer = setInterval(() => { $('#clock').textContent = formatTime(elapsed()); }, 1000);

  function progress() {
    const n = active.filter(t => placed[t.id]).length;
    $('#count').textContent = `${n} de ${active.length}`;
    $('#bar').style.width = (100 * n / active.length) + '%';
    $('#clock').textContent = formatTime(elapsed());
    if (n === active.length) finishLevel();
  }
  function select(chip) {
    $$('.chip', bank).forEach(c => c.setAttribute('aria-pressed', String(c === chip && c.getAttribute('aria-pressed') !== 'true')));
    selected = chip && chip.getAttribute('aria-pressed') === 'true' ? chip.dataset.name : null;
    $$('.dot.ping, .slot.ask').forEach(e => e.classList.remove('ping', 'ask'));
  }
  async function attempt(name, id, from) {
    if (busy || !name || !activeIds.has(id) || placed[id]) return;
    const t = active.find(x => x.id === id), it = P.items.get(id), slot = it.slot, chip = $(`.chip[data-name="${CSS.escape(name)}"]`, bank);
    $$('.ping, .ask').forEach(e => e.classList.remove('ping', 'ask'));
    $$('line.hint', stage).forEach(l => l.classList.remove('hint'));
    busy = true;
    if (t.name === name) {
      placed[id] = true;
      const r = score('hit', 1);
      save();
      selected = null; $$('.chip', bank).forEach(c => c.setAttribute('aria-pressed', 'false'));
      chip?.classList.add('lifting');
      await fx.fly(from || chip, slot, name, L.model);
      chip?.classList.add('gone'); chip?.classList.remove('lifting');
      P.fill(id, name);
      fx.stick(slot);
      fx.burst(slot, '+' + r.gained);
      if (!r.bonus) fx.sound.play('hit');
      say(r.bonus ? `${name}! Tres seguits: +${r.gained} punts.` : `${name}, enganxat. +10 punts.`, 'ok');
      busy = false;
      progress();
      $('.chip:not(.gone)', bank)?.focus({ preventScroll: true });
    } else {
      stat.errors++;
      score('miss', 1);
      (s.review.atlas[name] ||= 0); s.review.atlas[name]++;
      save();
      [slot, it.dot].forEach(fx.shake);
      fx.sound.play('miss');
      fx.burst(slot, '−3', 'loss');
      say(`${name} no va en aquest forat. −3 punts.`, 'err');
      chip?.classList.add('lifting');
      await fx.bounceBack(from || slot, chip || bank, name, L.model);
      chip?.classList.remove('lifting');
      busy = false;
    }
  }

  // Arrossegar amb punter (ratolí, trackpad i pantalla tàctil)
  let drag = null;
  bank.addEventListener('pointerdown', e => {
    const chip = e.target.closest('.chip'); if (!chip || e.button > 0 || busy) return;
    drag = { chip, x: e.clientX, y: e.clientY, moving: false, ghost: null, over: null };
    chip.setPointerCapture(e.pointerId);
  });
  bank.addEventListener('pointermove', e => {
    if (!drag) return;
    if (!drag.moving && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 6) {
      drag.moving = true;
      selected = null; $$('.chip', bank).forEach(c => c.setAttribute('aria-pressed', 'false'));
      drag.ghost = Object.assign(document.createElement('div'), { className: 'ghost-chip', textContent: drag.chip.dataset.name });
      document.body.append(drag.ghost);
      drag.chip.classList.add('lifting');
    }
    if (!drag.moving) return;
    drag.ghost.style.left = e.clientX + 'px'; drag.ghost.style.top = e.clientY + 'px';
    const over = nearestTarget(document.elementFromPoint(e.clientX, e.clientY), e.clientX, e.clientY);
    if (drag.over && drag.over !== over) $$(`[data-target="${drag.over.dataset.target}"]`).forEach(x => x.classList.remove('drop'));
    if (over && activeIds.has(over.dataset.target)) $$(`[data-target="${over.dataset.target}"]`).forEach(x => x.classList.add('drop'));
    drag.over = over;
  });
  const endDrag = e => {
    if (!drag) return;
    const d = drag; drag = null;
    d.ghost?.remove();
    d.chip.classList.remove('lifting');
    $$('.drop').forEach(x => x.classList.remove('drop'));
    if (!d.moving) return select(d.chip);
    const over = e.type === 'pointerup' ? nearestTarget(document.elementFromPoint(e.clientX, e.clientY), e.clientX, e.clientY) : null;
    if (over) attempt(d.chip.dataset.name, over.dataset.target, { x: e.clientX, y: e.clientY });
  };
  bank.addEventListener('pointerup', endDrag);
  bank.addEventListener('pointercancel', endDrag);
  bank.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(e.target.closest('.chip')); } });
  stage.addEventListener('click', e => {
    const t = nearestTarget(e.target, e.clientX, e.clientY); if (!t) return;
    if (!selected) { fx.sound.play('hint'); return say('Primer tria un cromo del munt.', 'info'); }
    attempt(selected, t.dataset.target);
  });

  $('#hint').onclick = () => {
    if (!selected) return say('Tria primer un cromo i la pista et mostrarà on va.', 'info');
    const t = active.find(x => x.name === selected);
    stat.hints++; score('hint', 1); save();
    fx.sound.play('hint');
    const it = P.items.get(t.id);
    it.slot.classList.add('ask'); it.dot.classList.add('ping'); it.line.classList.add('hint');
    if (it.dot.classList.contains('hidden')) P.V.reset();
    say(`Pista: el forat de ${selected} brilla en daurat. −5 punts.`, 'info');
  };

  function finishLevel() {
    const first = !stat.done;
    if (first) { stat.ms = elapsed(); stat.stars = stars(stat.errors, stat.hints); stat.done = true; save(); }
    clearInterval(timer);
    const st = stat.stars;
    $('#work').innerHTML = `
      <div class="done-card">
        <h2>Pàgina completa</h2>
        ${starRow(st)}
        <div class="stats">
          <div><span>Temps</span><b>${formatTime(stat.ms).replace(' min ', ':').replace(' s', '')}</b></div>
          <div><span>Errors</span><b>${stat.errors}</b></div>
          <div><span>Pistes</span><b>${stat.hints}</b></div>
        </div>
        <button class="btn sys" id="next">${lvl + 1 < LEVELS.length ? 'Passa la pàgina' : 'Comença el test'}</button>
      </div>`;
    $('#tools').hidden = true;
    if (first) {
      fx.sound.play('level');
      $$('.done-card .stars svg').forEach((el, i) => fx.stamp(el, 250 + i * 260));
    }
    $('#next').onclick = () => { s.p1.level++; s.p1.levelStart = Date.now(); save(); render(); };
    $('#next').focus();
  }
  progress();
}

function noWebGL(stage) {
  stage.innerHTML = `<div class="nogl"><h2>Aquest navegador no pot mostrar models 3D</h2>
    <p>Cal WebGL. Prova-ho amb Chrome, Edge o Firefox actualitzats, o en un altre ordinador. Si no pots, avisa el professor i continua amb el test.</p>
    <button class="btn" id="skip3d">Continua sense la fase 3D</button></div>`;
  $('#tools').hidden = true; $('#work').hidden = true;
  $('#skip3d').onclick = () => { s.p1.skipped = true; s.p1.level = LEVELS.length; save(); render(); };
}

/* ---------- Fase 2 · Test ---------- */
function quizPhase() {
  const p = s.p2;
  if (p.i >= p.order.length) { s.phase = 3; save(); return render(); }
  const qi = p.order[p.i], [q, opts, right, why, block] = QUIZ[qi];
  const perm = p.perm[qi] ||= shuffle([0, 1, 2, 3]);
  const answered = p.answers[qi];
  const tag = { coord: 'Coordinació i estímuls', vista: 'Vista', oida: 'Oïda' }[block];
  app.innerHTML = `
  <div class="quizwrap"><section class="quiz">
    <div class="qcard">
      <div class="qhead"><span class="num">${p.i + 1} <span>/ ${p.order.length}</span></span><span class="qtag ${block}">${tag}</span><span class="muted">Tecles 1–4</span></div>
      <div class="bar"><span style="width:${100 * p.i / p.order.length}%"></span></div>
      <h2>${esc(q)}</h2>
      <div class="choices" role="group" aria-label="Opcions">
        ${perm.map((o, k) => `<button type="button" class="choice" data-o="${o}"><kbd>${k + 1}</kbd><span>${esc(opts[o])}</span>${ic(o === right ? 'check' : 'x')}</button>`).join('')}
      </div>
      <div id="after"></div>
    </div>
  </section></div>`;
  const show = (picked, animate) => {
    $$('.choice').forEach(b => {
      b.disabled = true;
      const o = +b.dataset.o;
      if (o === right) b.classList.add('right');
      if (o === picked) b.classList.add('picked');
    });
    const ok = picked === right;
    $('#after').innerHTML = `
      <div class="explain"><b>${ok ? 'Correcte!' : 'No és aquesta.'}</b><span>${ok ? '' : 'La bona és la marcada en verd. '}${esc(why)}</span></div>
      <div class="row" style="margin-top:14px"><button class="btn" id="next">${p.i + 1 < p.order.length ? 'Següent pregunta' : 'Comença les patologies'}</button></div>`;
    $('#next').onclick = () => { p.i++; save(); render(); };
    $('#next').focus();
    if (animate && !fx.reduced()) $('.explain').animate([{ transform: 'translateY(10px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 300, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
  };
  if (answered != null) show(answered, false);
  const choose = o => {
    if (p.answers[qi] != null) return;
    p.answers[qi] = o;
    const ok = o === right, btn = $(`.choice[data-o="${o}"]`);
    const r = score(ok ? 'hit' : 'miss', 2);
    if (!ok) s.review.quiz.push(qi);
    save(); show(o, true);
    if (ok) { fx.stick(btn); fx.burst(btn, '+' + r.gained); if (!r.bonus) fx.sound.play('hit'); }
    else { fx.shake(btn); fx.burst(btn, '−3', 'loss'); fx.sound.play('miss'); }
  };
  $('.choices').onclick = e => { const b = e.target.closest('.choice'); if (b) choose(+b.dataset.o); };
  const onKey = e => { const n = +e.key; if (n >= 1 && n <= 4 && !e.target.closest('input, select') && !$('#intro')) choose(perm[n - 1]); };
  document.addEventListener('keydown', onKey);
  cleanup = () => document.removeEventListener('keydown', onKey);
}

/* ---------- Fase 3 · Text de patologies ---------- */
function clozePhase() {
  const p = s.p3;
  if (p.i >= CLOZE.length) { s.phase = 4; s.end = Date.now(); save(); return render(); }
  const T = CLOZE[p.i], parts = CLOZE_PARTS[p.i];
  const gaps = GAPS.filter(g => g.t === p.i);
  for (const g of gaps) if (!p.perm[g.key]) p.perm[g.key] = shuffle([0, 1, 2]);
  save();
  let k = 0;
  const html = parts.map(part => {
    if (typeof part === 'string') return esc(part);
    const g = gaps[k++], ans = p.answers[g.key];
    const opts = p.perm[g.key].map(o => `<option value="${esc(g.opts[o])}" ${ans === g.opts[o] ? 'selected' : ''}>${esc(g.opts[o])}</option>`).join('');
    return `<span class="gapwrap" data-key="${g.key}"><select class="gap" data-key="${g.key}" aria-label="Buit ${k} de ${gaps.length}" ${ans != null ? 'disabled' : ''}><option value="" ${ans == null ? 'selected' : ''} disabled>tria…</option>${opts}</select></span>`;
  }).join('');
  app.innerHTML = `
  <div class="quizwrap"><section class="quiz">
    <div class="qcard">
      <div class="qhead"><span class="num">Text ${p.i + 1} <span>/ ${CLOZE.length}</span></span><span class="muted"><b id="left"></b></span></div>
      <div class="bar"><span id="cbar"></span></div>
      <h2>${esc(T.title)}</h2>
      <p class="cloze">${html}</p>
      <p class="feedback" id="fb" aria-live="polite"></p>
      <div class="row spread" id="ctools">
        <button type="button" class="btn ghost small dark" id="hint">${ic('bulb')} Pista −5</button>
        <button type="button" class="btn" id="next" hidden>${p.i + 1 < CLOZE.length ? 'Següent text' : 'Veure l\'informe'}</button>
      </div>
    </div>
  </section></div>`;
  const say = sayIn($('#fb'));
  const mark = (g, animate) => {
    const sel = $(`select.gap[data-key="${g.key}"]`), wrap = sel.parentElement, ok = p.answers[g.key] === g.ok;
    sel.disabled = true;
    wrap.classList.add(ok ? 'ok' : 'err'); wrap.classList.remove('focus');
    if (!ok && !$('.fix', wrap)) wrap.insertAdjacentHTML('beforeend', `<span class="fix">${ic('check')}${esc(g.ok)}</span>`);
    if (animate) { if (ok) { fx.stick(wrap); } else fx.shake(wrap); }
  };
  const pending = () => gaps.find(g => p.answers[g.key] == null);
  const refresh = () => {
    const done = gaps.filter(g => p.answers[g.key] != null).length;
    $('#left').textContent = `${done} de ${gaps.length} buits`;
    $('#cbar').style.width = (100 * done / gaps.length) + '%';
    $$('.gapwrap.focus').forEach(w => w.classList.remove('focus'));
    const nx = pending();
    if (nx) $(`.gapwrap[data-key="${nx.key}"]`).classList.add('focus');
    $('#next').hidden = !!nx; $('#hint').hidden = !nx;
    if (!nx) $('#next').focus();
  };
  gaps.filter(g => p.answers[g.key] != null).forEach(g => mark(g, false));
  refresh();
  $('.cloze').addEventListener('change', e => {
    const sel = e.target.closest('select.gap'); if (!sel || sel.disabled) return;
    const g = gaps.find(x => x.key === sel.dataset.key);
    if (p.answers[g.key] != null) return;
    p.answers[g.key] = sel.value;
    const ok = sel.value === g.ok, wrap = sel.parentElement;
    const r = score(ok ? 'hit' : 'miss', 3);
    if (!ok) s.review.cloze.push(g.key);
    save(); mark(g, true);
    if (ok) { fx.burst(wrap, '+' + r.gained); if (!r.bonus) fx.sound.play('hit'); say(r.bonus ? `Correcte! Tres seguits: +${r.gained}.` : 'Correcte! +10 punts.', 'ok'); }
    else { fx.burst(wrap, '−3', 'loss'); fx.sound.play('miss'); say(`No és «${sel.value}». La correcta és «${g.ok}». −3 punts.`, 'err'); }
    refresh();
    const nx = pending(); if (nx) $(`select.gap[data-key="${nx.key}"]`).focus({ preventScroll: false });
  });
  $('#hint').onclick = () => {
    const g = pending(); if (!g) return;
    if (p.hinted[g.key]) return say(`Pista: ${g.clue}`, 'info');
    p.hinted[g.key] = true; score('hint', 3); save(); fx.sound.play('hint');
    say(`Pista: ${g.clue} (−5)`, 'info');
    $(`select.gap[data-key="${g.key}"]`).focus();
  };
  $('#next').onclick = () => { p.i++; save(); render(); };
}

/* ---------- Informe ---------- */
function report() {
  document.body.dataset.system = '';
  const quizOk = s.p2.order.filter(qi => s.p2.answers[qi] === QUIZ[qi][2]).length;
  const clozeOk = GAPS.filter(g => s.p3.answers[g.key] === g.ok).length;
  const totalMs = (s.end || Date.now()) - s.start;
  const rows = LEVELS.map((L, i) => {
    const st = s.p1.stats[i] || {};
    return `<tr><td>${i + 1}. ${esc(L.title)} <span class="muted">(${modelName(L.model).toLowerCase()})</span></td>
      <td class="num">${st.stars ? starRow(st.stars, 'mini') : '—'}</td><td class="num">${st.errors ?? 0}</td><td class="num">${st.hints ?? 0}</td><td class="num">${st.ms ? formatTime(st.ms) : '—'}</td></tr>`;
  }).join('');
  const atlasMiss = Object.entries(s.review.atlas).sort((a, b) => b[1] - a[1]);
  const quizMiss = s.review.quiz.map(qi => QUIZ[qi]);
  const clozeMiss = s.review.cloze.map(k => GAPS.find(g => g.key === k)).filter(Boolean);
  app.innerHTML = `
  <div class="reportwrap"><section class="report" id="report">
    <div class="sheet">
      <header style="display:grid;gap:8px">
        <p class="print-only">MP0061 Anatomofisiologia i Patologia Bàsiques · CFGM Farmàcia i Parafarmàcia · FAR 1L · Unitat 4</p>
        <h1>Àlbum completat</h1>
        <p><b>${esc(s.email)}</b>, ${new Date(s.end || Date.now()).toLocaleString('ca-ES')}. Temps total: ${formatTime(totalMs)}.</p>
        ${s.p1.skipped ? '<p><b>Fase 3D no feta</b>: el navegador no tenia WebGL.</p>' : ''}
      </header>
      <div class="tiles">
        <div class="tile big"><span>Punts</span><b>${s.points}</b></div>
        <div class="tile"><span>Models 3D</span><b>${s.phasePts[1]}</b></div>
        <div class="tile"><span>Test</span><b>${quizOk}/${s.p2.order.length}</b></div>
        <div class="tile"><span>Patologies</span><b>${clozeOk}/${GAPS.length}</b></div>
        <div class="tile"><span>Errors</span><b>${s.errors}</b></div>
        <div class="tile"><span>Pistes</span><b>${s.hints}</b></div>
      </div>
      <div>
        <h2 style="margin-bottom:8px">Pàgines dels models 3D</h2>
        <table><thead><tr><th>Pàgina</th><th class="num">Estrelles</th><th class="num">Errors</th><th class="num">Pistes</th><th class="num">Temps</th></tr></thead><tbody>${rows}</tbody></table>
      </div>
      <div style="display:grid;gap:10px">
        <h2>Per repassar</h2>
        ${atlasMiss.length ? `<p class="muted">Cromos col·locats en un forat equivocat (vegades):</p><div class="tags">${atlasMiss.map(([n, c]) => `<span class="tag">${esc(n)} × ${c}</span>`).join('')}</div>` : ''}
        ${quizMiss.length ? `<p class="muted">Preguntes del test fallades i la seva resposta:</p><ul>${quizMiss.map(q => `<li>${esc(q[0])} <b>${esc(q[1][q[2]])}</b></li>`).join('')}</ul>` : ''}
        ${clozeMiss.length ? `<p class="muted">Buits dels textos de patologies que has fallat (resposta correcta):</p><ul>${clozeMiss.map(g => `<li>${esc(CLOZE[g.t].title)}: <b>${esc(g.ok)}</b> <span class="muted">(havies triat «${esc(s.p3.answers[g.key])}»)</span></li>`).join('')}</ul>` : ''}
        ${!atlasMiss.length && !quizMiss.length && !clozeMiss.length ? '<p>Cap error en tot el recorregut.</p>' : ''}
      </div>
      <div class="no-print deliver">
        <h2>Lliura-ho a Classroom</h2>
        <ol>
          <li>Prem <b>Desa l'informe en PDF</b> i, al diàleg d'impressió, tria «Desa com a PDF».</li>
          <li>Obre la tasca de la Unitat 4 a Google Classroom i adjunta-hi el PDF.</li>
          <li>Prem <b>Lliura</b> a Classroom.</li>
        </ol>
        <div class="row"><button class="btn" id="pdf">${ic('pdf')} Desa l'informe en PDF</button><a class="btn ghost" id="classroom" href="https://classroom.google.com/" target="_blank" rel="noopener">${ic('upload')} Obre Google Classroom</a></div>
      </div>
    </div>
  </section></div>`;
  if (!s.seen[4]) {
    s.seen[4] = true; save();
    fx.sound.play('level');
    $$('.tile').forEach((el, i) => fx.stamp(el, 120 + i * 90));
  }
  $('#pdf').onclick = () => {
    const prev = document.title;
    document.title = `Informe U4 Sentits - ${s.email.split('@')[0]}`; // nom suggerit del PDF
    window.print();
    setTimeout(() => { document.title = prev; }, 1000);
  };
}

render();
