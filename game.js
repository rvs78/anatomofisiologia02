// Sentits Quest · U4 — mateixa estructura que Vascular Quest (rvs78/anatomia02):
// entrada (amb tria d'idioma), sobre d'instruccions, 3 fases (Models 3D, Test, Text de patologies) i informe amb nota 1–10.
import { MODELS, mountViewer } from './models.js';
import { LEVELS, QUIZ, QUIZ_MIX, CLOZE } from './data.js';
import { shuffle, applyScore, stars, formatTime, pickQuiz, parseCloze, grade } from './logic.js';
import { t, L, getLang, setLang, LANGS, FLAGS } from './i18n.js';
import * as fx from './fx.js';

const KEY = 'far-u4-sentits-v2';
const PASSWORD = 'alumnesfar';

const app = document.querySelector('#app');
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ic = (name, cls = 'icon') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const starRow = (n, cls = 'stars') => `<div class="${cls}" role="img" aria-label="${t('stars', { n })}">${[0, 1, 2].map(i => `<svg viewBox="0 0 24 24" class="${i < n ? '' : 'no'}"><use href="#i-star"/></svg>`).join('')}</div>`;
const modelName = m => t(m === 'ull' ? 'eye' : 'ear');
const TARGETS = Object.fromEntries(Object.values(MODELS).flatMap(m => m.targets.map(x => [x.id, x])));
const nameOf = id => L(TARGETS[id].name);
const quiz = () => QUIZ[getLang()];
const clozeParts = () => CLOZE[getLang()].map(c => parseCloze(c.body));
/** Buits del text i: [{key, t, ok, opts, clue}] (opts[0] és la correcta). */
const gapsOf = i => clozeParts()[i].filter(p => typeof p !== 'string').map((g, k) => ({ key: `${i}-${k}`, t: i, ...g }));
const ALL_GAPS = () => CLOZE.ca.flatMap((_, i) => gapsOf(i));

/* ---------- Estat ---------- */
const fresh = email => ({
  v: 2, email, phase: 1, start: Date.now(), end: null,
  points: 0, streak: 0, correct: 0, errors: 0, hints: 0, phasePts: { 1: 0, 2: 0, 3: 0 },
  p1: { level: 0, placed: {}, stats: {}, levelStart: Date.now(), bank: {}, skipped: false },
  p2: { order: pickQuiz(QUIZ.ca, QUIZ_MIX), perm: {}, i: 0, answers: {} },
  p3: { i: 0, perm: {}, answers: {}, hinted: {} }, // answers[key] = índex de l'opció triada (0 = correcta)
  review: { atlas: {}, quiz: [], cloze: [] },
  seen: {},
});
let s = null;
try { s = JSON.parse(localStorage.getItem(KEY)); if (!s || s.v !== 2) s = null; } catch { s = null; }
if (s) s.seen ||= {};
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* mode privat */ } };
let cleanup = () => {};

const levelTargets = lvl => {
  const lv = LEVELS[lvl], all = MODELS[lv.model].targets;
  return lv.ids === 'ALL' ? all : all.filter(x => lv.ids.includes(x.id));
};

/* ---------- Capçalera ---------- */
function header() {
  $('.brand small').textContent = t('brandSub');
  const ph = t('phases');
  $('#steps').innerHTML = s ? ph.map((p, i) => {
    const n = i + 1, cur = n === s.phase;
    return `<li ${cur ? 'aria-current="step"' : ''} class="${n < s.phase ? 'done' : ''}">${n < s.phase ? ic('check') : ''}<span>${p}</span></li>`;
  }).join('') : '';
  const on = fx.sound.enabled(), other = getLang() === 'ca' ? 'es' : 'ca';
  const langBtn = `<button class="iconbtn flagbtn no-print" id="lang" aria-label="${t('switchLang')}" title="${t('switchLang')}">${FLAGS[other]}</button>`;
  const soundBtn = `<button class="iconbtn no-print" id="sound" aria-pressed="${on}" aria-label="${on ? t('soundOff') : t('soundOn')}" title="${t('sound')}">${ic(on ? 'sound' : 'mute')}</button>`;
  $('#score').innerHTML = s ? `
    <span class="who">${esc(s.email)}</span>
    <span class="pts">${t('points')} <b id="pts">${s.points}</b></span>
    <span class="streak" title="${t('streakTitle')}">${t('streak')} <b id="streak">${s.streak}</b></span>
    ${langBtn}${soundBtn}
    <button class="iconbtn no-print" id="logout" aria-label="${t('logout')}" title="${t('logoutTitle')}">${ic('exit')}</button>` : soundBtn;
  $('#sound').onclick = () => { fx.sound.toggle(); header(); };
  const lb = $('#lang'); if (lb) lb.onclick = () => { setLang(other); render(); };
  const out = $('#logout');
  if (out) out.onclick = () => confirmBox(out, t('logoutAsk'), t('logoutYes'), () => { try { localStorage.removeItem(KEY); } catch { /* */ } s = null; render(); });
}

/** Confirmació dins la pàgina (els diàlegs del navegador no funcionen a tots els visors). */
function confirmBox(anchor, msg, yes, onYes) {
  $('.confirm')?.remove();
  const box = document.createElement('div');
  box.className = 'confirm'; box.setAttribute('role', 'alertdialog');
  box.innerHTML = `<p>${esc(msg)}</p><div class="row"><button class="btn small" data-a="yes">${esc(yes)}</button><button class="btn ghost small" data-a="no">${t('cancel')}</button></div>`;
  document.body.append(box);
  const r = anchor.getBoundingClientRect();
  box.style.top = (r.bottom + 10) + 'px'; box.style.right = Math.max(12, innerWidth - r.right) + 'px';
  const close = () => { box.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  box.onclick = e => { const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return; close(); if (a === 'yes') onYes(); };
  $('[data-a="no"]', box).focus();
}

function score(kind, phase) {
  const before = s.points;
  const r = applyScore(s, kind, phase);
  save(); header();
  if (s.points !== before) { const p = $('#pts'); p?.classList.add('bump'); }
  if (r.bonus) { fx.banner(t('streakBanner')); fx.sound.play('bonus'); }
  return r;
}

function render() {
  cleanup(); cleanup = () => {};
  $('.confirm')?.remove();
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
  1: { title: 'intro1Title', lead: 'intro1Lead', video: true, cards: [['ull', 'drag', 'i1a'], ['oid', 'rotate', 'i1b'], ['foil', 'target', 'i1c']] },
  2: { title: 'intro2Title', lead: 'intro2Lead', cards: [['ull', 'keys', 'i2a'], ['oid', 'bulb', 'i2b'], ['foil', 'star', 'i2c']] },
  3: { title: 'intro3Title', lead: 'intro3Lead', cards: [['ull', 'list', 'i3a'], ['oid', 'check', 'i3b'], ['foil', 'bulb', 'i3c']] },
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
        <h2 id="intro-title">${t(I.title)}</h2>
        <p>${t(I.lead)}</p>
        ${I.video ? `<video src="./assets/tutorial${getLang() === 'es' ? '_es' : ''}.mp4" poster="./assets/tutorial${getLang() === 'es' ? '_es' : ''}.jpg" autoplay muted loop playsinline aria-label="${t('videoLabel')}"></video>` : ''}
        <div class="cards">${I.cards.map(([c, i, k]) => { const [h, p] = t(k); return `<div class="howto ${c}">${ic(i, '')}<h3>${h}</h3><p>${p}</p></div>`; }).join('')}</div>
        <div class="row">
          <p class="muted" style="color:var(--cover-muted)">${t('introScore')}</p>
          <button class="btn" id="intro-go">${ic('play')} ${t('start')}</button>
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

/* ---------- Entrada (amb tria d'idioma) ---------- */
function login() {
  header();
  const keep = { email: $('#login input[name=email]')?.value || '', pass: $('#login input[name=password]')?.value || '' };
  app.innerHTML = `
  <section class="welcome">
    <div class="intro-col">
      <div class="langpick" role="radiogroup" aria-label="${t('chooseLang')} / Elige el idioma">
        ${LANGS.map(l => `<button type="button" class="langopt" role="radio" aria-checked="${l === getLang()}" data-lang="${l}">${FLAGS[l]}<span>${l === 'ca' ? 'Català' : 'Castellano'}</span></button>`).join('')}
      </div>
      <h1>Sentits <span>Quest</span></h1>
      <p>${t('welcomeLead')}</p>
      <ol>
        <li><span>${t('step1')}</span></li>
        <li><span>${t('step2')}</span></li>
        <li><span>${t('step3')}</span></li>
      </ol>
      <form id="login" novalidate>
        <label class="field">${t('email')}<input name="email" type="email" autocomplete="email" placeholder="nom@isvh.cat" required></label>
        <label class="field">${t('password')}<input name="password" type="password" autocomplete="current-password" required></label>
        <button class="btn">${ic('play')} ${t('open')}</button>
        <p class="feedback err" id="fb" role="alert"></p>
      </form>
      <p class="note">${t('note')}</p>
    </div>
    <div class="art">
      <div class="cover-plates" aria-hidden="true">
        <figure class="plate-card ull"><img src="./assets/portada_ull.webp" alt="" width="900" height="900"><figcaption>${t('eye')}</figcaption></figure>
        <figure class="plate-card oid"><img src="./assets/portada_orella.webp" alt="" width="900" height="900"><figcaption>${t('ear')}</figcaption></figure>
      </div>
      <p class="credit">${t('credit')}</p>
      <p class="aicredit">${t('coverCredit')}</p>
    </div>
  </section>`;
  $('#login input[name=email]').value = keep.email; $('#login input[name=password]').value = keep.pass;
  $('.langpick').onclick = e => {
    const b = e.target.closest('[data-lang]'); if (!b || b.dataset.lang === getLang()) return;
    setLang(b.dataset.lang); fx.sound.play('hint'); login();
    $(`.langopt[data-lang="${b.dataset.lang}"]`)?.focus();
  };
  $('.langpick').onkeydown = e => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault(); const nl = getLang() === 'ca' ? 'es' : 'ca'; setLang(nl); login(); $(`.langopt[data-lang="${nl}"]`)?.focus();
  };
  $('#login').onsubmit = e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const email = String(f.get('email')).trim().toLowerCase();
    const fail = m => { $('#fb').innerHTML = ic('x') + `<span>${m}</span>`; fx.shake($('#login')); fx.sound.play('miss'); };
    if (!/^[^@\s]+@isvh\.cat$/.test(email)) return fail(t('badEmail'));
    if (f.get('password') !== PASSWORD) return fail(t('badPass'));
    s = fresh(email); save(); render();
  };
}

/* ---------- Escenari 3D: model, forats i línies guia sense solapaments ---------- */
const SVGNS = 'http://www.w3.org/2000/svg';
let measureCtx = null;
function textWidth(txt, px) {
  measureCtx ||= document.createElement('canvas').getContext('2d');
  measureCtx.font = `800 ${px}px "Big Shoulders Display", "Arial Narrow", sans-serif`;
  return measureCtx.measureText(txt).width;
}
const segCross = (a, b, c, d) => { // els segments ab i cd es tallen?
  const o = (p, q, r) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
};

function mountStage(stage, kind, targets, pageLabel) {
  stage.innerHTML = `
    ${pageLabel ? `<div class="pageno">${pageLabel}</div>` : ''}
    <div class="plate3d" id="plate">
      <div class="glhost" id="glhost"></div>
      <svg class="leaders" aria-hidden="true"></svg>
      <div class="overlay" id="overlay"></div>
      <p class="modelcap">${esc(L(MODELS[kind].title))}</p>
      <p class="gesture no-print">${ic('rotate')} ${t('rotateHelp')}</p>
    </div>
    <div class="zoomer no-print">
      <button type="button" data-z="in" aria-label="${t('zoomIn')}">${ic('plus')}</button>
      <button type="button" data-z="out" aria-label="${t('zoomOut')}">${ic('minus')}</button>
      <button type="button" data-z="fit" aria-label="${t('zoomFit')}">${ic('fit')}</button>
    </div>`;
  const plate = $('#plate', stage), overlay = $('#overlay', stage), svg = $('svg.leaders', stage);
  const longest = Math.max(...targets.map(x => textWidth(nameOf(x.id), 16)));
  const geom = W => { const narrow = W < 560, fs = narrow ? 12 : 15;
    return { narrow, fs, sh: narrow ? 30 : 34, m: narrow ? 6 : 12, sw: Math.round(Math.min(narrow ? W * 0.3 : W * 0.23, Math.max(narrow ? 96 : 128, longest * fs / 16 + 26))) }; };
  // el model s'encaixa entre les dues columnes d'etiquetes (sense quedar-hi a sota)
  const V = mountViewer($('#glhost', stage), kind, {
    reducedMotion: fx.reduced(),
    fitWidth: (w) => { const g = geom(w); return Math.max(g.narrow ? 0.44 : 0.3, Math.min(0.62, 1 - 2 * (g.m + g.sw + 22) / w)); },
    fitHeight: (w, h) => (w < 560 ? 0.62 : Math.min(0.8, 1 - 2 * 46 / h)),
  });
  if (!V) return null;
  window.__viewer = V; // diagnòstic (proves automàtiques)
  stage.querySelector('.zoomer').onclick = e => {
    const b = e.target.closest('[data-z]'); if (!b) return;
    if (b.dataset.z === 'in') V.zoomBy(0.8); else if (b.dataset.z === 'out') V.zoomBy(1.25); else V.reset();
  };
  const items = new Map();
  for (const x of targets) {
    const slot = document.createElement('button'); slot.type = 'button'; slot.className = 'slot'; slot.dataset.target = x.id; slot.setAttribute('aria-label', t('emptySlot'));
    const dot = document.createElement('button'); dot.type = 'button'; dot.className = 'dot'; dot.dataset.target = x.id; dot.tabIndex = -1; dot.setAttribute('aria-hidden', 'true');
    const line = document.createElementNS(SVGNS, 'polyline'); line.dataset.for = x.id;
    svg.append(line); overlay.append(slot, dot);
    items.set(x.id, { t: x, slot, dot, line, y: null, x: null, side: null });
  }
  /* Disposició de les etiquetes:
     1) Costat: mitjana de les x projectades (meitat i meitat), amb histèresi per no saltar en girar.
     2) Columna: ordre per l'alçada del punt; separació mínima garantida (cap forat se'n trepitja un altre).
     3) Encreuaments: si dues línies veïnes es creuen, s'intercanvien els forats (passades successives).
     4) Línia guia en colze: horitzontal des del forat i després recta fins al centre exacte del punt. */
  const GAP = 6;
  function layout() {
    const W = plate.clientWidth, H = plate.clientHeight;
    const { fs, sh, m, sw } = geom(W);
    plate.style.setProperty('--sw', sw + 'px'); plate.style.setProperty('--sh', sh + 'px'); plate.style.setProperty('--sfs', fs + 'px');
    const proj = new Map();
    for (const [id] of items) proj.set(id, V.project(id));
    // Costat: la columna més propera al punt (línies curtes, sense travessar el model),
    // amb capacitat limitada per l'alçada disponible; els que no hi caben passen a l'altra columna.
    const top = sh / 2 + m + 44, bottom = H - sh / 2 - m - 26;
    const capH = Math.max(1, Math.floor((bottom - top) / (sh + GAP)) + 1);
    const edgeL = m + sw, edgeR = W - m - sw;
    const cols = { L: [], R: [] };
    const order = [...items].map(([id, it]) => { const p = proj.get(id); return { id, it, p, pref: (p.x - edgeL) - (edgeR - p.x) }; })
      .sort((a, b) => Math.abs(b.pref) - Math.abs(a.pref)); // primer els que tenen una preferència més clara
    for (const o of order) {
      let side = o.pref < 0 ? 'L' : 'R';
      if (o.it.side && o.it.side !== side && Math.abs(o.pref) < 40) side = o.it.side; // histèresi en girar
      if (cols[side].length >= capH) side = side === 'L' ? 'R' : 'L';
      cols[side].push(o);
    }
    for (const side of ['L', 'R']) {
      const c = cols[side].sort((u, v) => u.p.y - v.p.y);
      const knee = side === 'L' ? m + sw + 16 : W - m - sw - 16;
      const place = () => {
        c.forEach(o => { o.y = Math.min(bottom, Math.max(top, o.p.y)); });
        for (let i = 1; i < c.length; i++) c[i].y = Math.max(c[i].y, c[i - 1].y + sh + GAP);
        for (let i = c.length - 1; i >= 0; i--) c[i].y = Math.min(c[i].y, i === c.length - 1 ? bottom : c[i + 1].y - sh - GAP);
      };
      place();
      for (let pass = 0; pass < c.length; pass++) { // elimina encreuaments entre línies veïnes
        let swapped = false;
        for (let i = 0; i + 1 < c.length; i++) {
          const A = { x: knee, y: c[i].y }, B = { x: knee, y: c[i + 1].y };
          if (segCross(A, c[i].p, B, c[i + 1].p)) { [c[i], c[i + 1]] = [c[i + 1], c[i]]; swapped = true; }
        }
        if (!swapped) break;
        const ys = c.map(o => o.y); c.forEach((o, i) => { o.y = ys[i]; });
      }
      for (const { it, p, y } of c) {
        const tx = side === 'L' ? m : W - m - sw;
        const k = it.y == null || fx.reduced() ? 1 : 0.3;
        it.y = it.y == null ? y : it.y + (y - it.y) * k;
        it.x = it.x == null || it.side !== side ? tx : it.x + (tx - it.x) * k;
        it.side = side;
        it.slot.style.transform = `translate(${it.x}px, ${it.y - sh / 2}px)`;
        it.slot.classList.toggle('L', side === 'L'); it.slot.classList.toggle('R', side === 'R');
        it.dot.style.transform = `translate(${p.x}px, ${p.y}px)`;
        it.dot.classList.toggle('hidden', p.hidden);
        const ex = side === 'L' ? it.x + sw : it.x, kx = side === 'L' ? Math.min(ex + 16, p.x) : Math.max(ex - 16, p.x);
        it.line.setAttribute('points', `${ex},${it.y} ${kx},${it.y} ${p.x},${p.y}`);
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
      it.slot.textContent = name; it.slot.title = name; it.slot.setAttribute('aria-label', name); it.slot.classList.add('done'); it.dot.classList.add('done');
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
  const lv = LEVELS[lvl], active = levelTargets(lvl);
  const activeIds = new Set(active.map(x => x.id));
  const placed = s.p1.placed[lvl] ||= {};
  const stat = s.p1.stats[lvl] ||= { errors: 0, hints: 0, ms: 0 };
  if (!s.p1.bank[lvl]) { s.p1.bank[lvl] = shuffle(active.map(x => x.id)); s.p1.levelStart = Date.now(); save(); }
  document.body.dataset.system = lv.model;

  app.innerHTML = `
  <section class="play">
    <div class="stage" id="stage"></div>
    <aside class="panel">
      <header>
        <h1>${esc(L(lv.title))}</h1>
        <div class="meta"><span class="sysbadge">${modelName(lv.model)}</span><span>${lv.boss ? t('bossMeta') : t('levelMeta')}</span></div>
      </header>
      <div class="progress">
        <div class="row"><span><b id="count"></b> ${t('stuck')}</span><span id="clock"></span></div>
        <div class="bar"><span id="bar"></span></div>
      </div>
      <div id="work">
        <p class="muted" style="margin-bottom:12px">${t('pileHelp')}</p>
        <div class="pile" id="bank" role="list" aria-label="${t('pileLabel')}"></div>
      </div>
      <p class="feedback" id="fb" aria-live="polite"></p>
      <div class="row tools" id="tools">
        <button type="button" class="btn ghost small" id="hint">${ic('bulb')} ${t('hint')}</button>
      </div>
    </aside>
  </section>`;

  const stage = $('#stage');
  const P = mountStage(stage, lv.model, active, `${t('page')} <span>${lvl + 1}</span> / ${LEVELS.length}`);
  if (!P) return noWebGL(stage);
  let timer = 0;
  cleanup = () => { P.dispose(); clearInterval(timer); };
  active.filter(x => placed[x.id]).forEach(x => P.fill(x.id, nameOf(x.id), ''));

  const bank = $('#bank');
  bank.innerHTML = s.p1.bank[lvl].map(id => `<button type="button" class="chip ${placed[id] ? 'gone' : ''}" role="listitem" aria-pressed="false" data-id="${id}">${esc(nameOf(id))}</button>`).join('');
  const say = sayIn($('#fb'));
  let selected = null, busy = false;
  const elapsed = () => stat.ms + (Date.now() - s.p1.levelStart);
  timer = setInterval(() => { $('#clock').textContent = formatTime(elapsed()); }, 1000);

  function progress() {
    const n = active.filter(x => placed[x.id]).length;
    $('#count').textContent = `${n} ${t('of')} ${active.length}`;
    $('#bar').style.width = (100 * n / active.length) + '%';
    $('#clock').textContent = formatTime(elapsed());
    if (n === active.length) finishLevel();
  }
  const unselectAll = () => { selected = null; $$('.chip', bank).forEach(c => c.setAttribute('aria-pressed', 'false')); };
  function select(chip) {
    $$('.chip', bank).forEach(c => c.setAttribute('aria-pressed', String(c === chip && c.getAttribute('aria-pressed') !== 'true')));
    selected = chip && chip.getAttribute('aria-pressed') === 'true' ? chip.dataset.id : null;
    $$('.dot.ping, .slot.ask').forEach(e => e.classList.remove('ping', 'ask'));
  }
  async function attempt(cid, id, from) {
    if (busy || !cid || !activeIds.has(id) || placed[id]) return;
    const it = P.items.get(id), slot = it.slot, chip = $(`.chip[data-id="${cid}"]`, bank), name = nameOf(cid);
    $$('.ping, .ask').forEach(e => e.classList.remove('ping', 'ask'));
    $$('polyline.hint', stage).forEach(l => l.classList.remove('hint'));
    busy = true;
    if (cid === id) {
      placed[id] = true;
      const r = score('hit', 1);
      save(); unselectAll();
      chip?.classList.add('lifting');
      await fx.fly(from || chip, slot, name, lv.model);
      chip?.classList.add('gone'); chip?.classList.remove('lifting');
      P.fill(id, name); P.V.flash(id);
      fx.stick(slot); fx.burst(slot, '+' + r.gained);
      if (!r.bonus) fx.sound.play('hit');
      say(r.bonus ? t('hitBonus', { n: name, p: r.gained }) : t('hitMsg', { n: name }), 'ok');
      busy = false;
      progress();
      $('.chip:not(.gone)', bank)?.focus({ preventScroll: true });
    } else {
      stat.errors++;
      score('miss', 1);
      (s.review.atlas[cid] ||= 0); s.review.atlas[cid]++;
      save();
      [slot, it.dot].forEach(fx.shake);
      fx.sound.play('miss'); fx.burst(slot, '−3', 'loss');
      say(t('missMsg', { n: name }), 'err');
      chip?.classList.add('lifting');
      await fx.bounceBack(from || slot, chip || bank, name, lv.model);
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
      drag.moving = true; unselectAll();
      drag.ghost = Object.assign(document.createElement('div'), { className: 'ghost-chip', textContent: nameOf(drag.chip.dataset.id) });
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
    if (over) attempt(d.chip.dataset.id, over.dataset.target, { x: e.clientX, y: e.clientY });
  };
  bank.addEventListener('pointerup', endDrag);
  bank.addEventListener('pointercancel', endDrag);
  bank.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(e.target.closest('.chip')); } });
  stage.addEventListener('click', e => {
    const tg = nearestTarget(e.target, e.clientX, e.clientY); if (!tg) return;
    if (!selected) { fx.sound.play('hint'); return say(t('pickFirst'), 'info'); }
    attempt(selected, tg.dataset.target);
  });

  $('#hint').onclick = () => {
    if (!selected) return say(t('hintPick'), 'info');
    stat.hints++; score('hint', 1); save();
    fx.sound.play('hint');
    const it = P.items.get(selected);
    it.slot.classList.add('ask'); it.dot.classList.add('ping'); it.line.classList.add('hint');
    if (it.dot.classList.contains('hidden')) P.V.focusOn(selected);
    say(t('hintMsg', { n: nameOf(selected) }), 'info');
  };

  function finishLevel() {
    const first = !stat.done;
    if (first) { stat.ms = elapsed(); stat.stars = stars(stat.errors, stat.hints); stat.done = true; save(); }
    clearInterval(timer);
    $('#work').innerHTML = `
      <div class="done-card">
        <h2>${t('pageDone')}</h2>
        ${starRow(stat.stars)}
        <div class="stats">
          <div><span>${t('time')}</span><b>${formatTime(stat.ms).replace(' min ', ':').replace(' s', '')}</b></div>
          <div><span>${t('errors')}</span><b>${stat.errors}</b></div>
          <div><span>${t('hints')}</span><b>${stat.hints}</b></div>
        </div>
        <button class="btn sys" id="next">${lvl + 1 < LEVELS.length ? t('nextPage') : t('startTest')}</button>
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
  stage.innerHTML = `<div class="nogl"><h2>${t('noGlTitle')}</h2><p>${t('noGlText')}</p><button class="btn" id="skip3d">${t('noGlSkip')}</button></div>`;
  $('#tools').hidden = true; $('#work').hidden = true;
  $('#skip3d').onclick = () => { s.p1.skipped = true; s.p1.level = LEVELS.length; save(); render(); };
}

/* ---------- Fase 2 · Test ---------- */
function quizPhase() {
  const p = s.p2;
  if (p.i >= p.order.length) { s.phase = 3; save(); return render(); }
  const qi = p.order[p.i], [q, opts, right, why, block] = quiz()[qi];
  const perm = p.perm[qi] ||= shuffle([0, 1, 2, 3]);
  const answered = p.answers[qi];
  app.innerHTML = `
  <div class="quizwrap"><section class="quiz">
    <div class="qcard">
      <div class="qhead"><span class="num">${p.i + 1} <span>/ ${p.order.length}</span></span><span class="qtag ${block}">${t('blocks')[block]}</span><span class="muted">${t('keys')}</span></div>
      <div class="bar"><span style="width:${100 * p.i / p.order.length}%"></span></div>
      <h2>${esc(q)}</h2>
      <div class="choices" role="group" aria-label="${t('options')}">
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
      <div class="explain"><b>${ok ? t('right') : t('wrong')}</b><span>${ok ? '' : t('wrongPre')}${esc(why)}</span></div>
      <div class="row" style="margin-top:14px"><button class="btn" id="next">${p.i + 1 < p.order.length ? t('nextQ') : t('startCloze')}</button></div>`;
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
  const p = s.p3, texts = CLOZE[getLang()];
  if (p.i >= texts.length) { s.phase = 4; s.end = Date.now(); save(); return render(); }
  const T = texts[p.i], parts = clozeParts()[p.i], gaps = gapsOf(p.i);
  for (const g of gaps) if (!p.perm[g.key]) p.perm[g.key] = shuffle([0, 1, 2]);
  save();
  let k = 0;
  const html = parts.map(part => {
    if (typeof part === 'string') return esc(part);
    const g = gaps[k++], ans = p.answers[g.key];
    const opts = p.perm[g.key].map(o => `<option value="${o}" ${ans === o ? 'selected' : ''}>${esc(g.opts[o])}</option>`).join('');
    return `<span class="gapwrap" data-key="${g.key}"><select class="gap" data-key="${g.key}" aria-label="${t('gapLabel', { k, n: gaps.length })}" ${ans != null ? 'disabled' : ''}><option value="" ${ans == null ? 'selected' : ''} disabled>${t('choose')}</option>${opts}</select></span>`;
  }).join('');
  app.innerHTML = `
  <div class="quizwrap"><section class="quiz">
    <div class="qcard">
      <div class="qhead"><span class="num">${t('text')} ${p.i + 1} <span>/ ${texts.length}</span></span><span class="muted"><b id="left"></b></span></div>
      <div class="bar"><span id="cbar"></span></div>
      <h2>${esc(T.title)}</h2>
      <p class="cloze">${html}</p>
      <p class="feedback" id="fb" aria-live="polite"></p>
      <div class="row spread" id="ctools">
        <button type="button" class="btn ghost small dark" id="hint">${ic('bulb')} ${t('hint')}</button>
        <button type="button" class="btn" id="next" hidden>${p.i + 1 < texts.length ? t('nextText') : t('seeReport')}</button>
      </div>
    </div>
  </section></div>`;
  const say = sayIn($('#fb'));
  const mark = (g, animate) => {
    const sel = $(`select.gap[data-key="${g.key}"]`), wrap = sel.parentElement, ok = p.answers[g.key] === 0;
    sel.disabled = true;
    wrap.classList.add(ok ? 'ok' : 'err'); wrap.classList.remove('focus');
    if (!ok && !$('.fix', wrap)) wrap.insertAdjacentHTML('beforeend', `<span class="fix">${ic('check')}${esc(g.ok)}</span>`);
    if (animate) { if (ok) fx.stick(wrap); else fx.shake(wrap); }
  };
  const pending = () => gaps.find(g => p.answers[g.key] == null);
  const refresh = () => {
    const done = gaps.filter(g => p.answers[g.key] != null).length;
    $('#left').textContent = `${done} ${t('of')} ${gaps.length} ${t('gaps')}`;
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
    const o = +sel.value; p.answers[g.key] = o;
    const ok = o === 0, wrap = sel.parentElement;
    const r = score(ok ? 'hit' : 'miss', 3);
    if (!ok) s.review.cloze.push(g.key);
    save(); mark(g, true);
    if (ok) { fx.burst(wrap, '+' + r.gained); if (!r.bonus) fx.sound.play('hit'); say(r.bonus ? t('clozeBonus', { p: r.gained }) : t('clozeOk'), 'ok'); }
    else { fx.burst(wrap, '−3', 'loss'); fx.sound.play('miss'); say(t('clozeBad', { v: g.opts[o], ok: g.ok }), 'err'); }
    refresh();
    const nx = pending(); if (nx) $(`select.gap[data-key="${nx.key}"]`).focus({ preventScroll: false });
  });
  $('#hint').onclick = () => {
    const g = pending(); if (!g) return;
    if (p.hinted[g.key]) return say(t('clue', { c: g.clue }), 'info');
    p.hinted[g.key] = true; score('hint', 3); save(); fx.sound.play('hint');
    say(t('clue', { c: g.clue }) + ' (−5)', 'info');
    $(`select.gap[data-key="${g.key}"]`).focus();
  };
  $('#next').onclick = () => { p.i++; save(); render(); };
}

/* ---------- Informe amb nota de 1 a 10 ---------- */
export function computeGrade(st) {
  let items = 0, errors = 0, hints = 0;
  LEVELS.forEach((_, i) => { const x = st.p1.stats[i]; if (!x) return; items += Object.keys(st.p1.placed[i] || {}).length; errors += x.errors || 0; hints += x.hints || 0; });
  const Q = QUIZ.ca, gaps = ALL_GAPS();
  const testOk = st.p2.order.filter(qi => st.p2.answers[qi] === Q[qi][2]).length;
  const clozeOk = gaps.filter(g => st.p3.answers[g.key] === 0).length;
  const hintedOk = gaps.filter(g => st.p3.answers[g.key] === 0 && st.p3.hinted[g.key]).length;
  return {
    testOk, clozeOk, gapsTotal: gaps.length,
    ...grade({ models: { items, errors, hints, skipped: st.p1.skipped }, test: { ok: testOk, total: st.p2.order.length }, cloze: { ok: clozeOk, hintedOk, total: gaps.length } }),
  };
}

function report() {
  document.body.dataset.system = '';
  const G = computeGrade(s);
  const totalMs = (s.end || Date.now()) - s.start;
  const rows = LEVELS.map((lv, i) => {
    const st = s.p1.stats[i] || {};
    return `<tr><td>${i + 1}. ${esc(L(lv.title))} <span class="muted">(${modelName(lv.model).toLowerCase()})</span></td>
      <td class="num">${st.stars ? starRow(st.stars, 'mini') : '—'}</td><td class="num">${st.errors ?? 0}</td><td class="num">${st.hints ?? 0}</td><td class="num">${st.ms ? formatTime(st.ms) : '—'}</td></tr>`;
  }).join('');
  const atlasMiss = Object.entries(s.review.atlas).sort((a, b) => b[1] - a[1]);
  const Q = quiz(), quizMiss = s.review.quiz.map(qi => Q[qi]);
  const gaps = ALL_GAPS(), clozeMiss = s.review.cloze.map(k => gaps.find(g => g.key === k)).filter(Boolean);
  const pct = x => Math.round(x * 100);
  const fmt = x => x == null ? '—' : x.toLocaleString(getLang(), { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  app.innerHTML = `
  <div class="reportwrap"><section class="report" id="report">
    <div class="sheet">
      <header class="rhead">
        <p class="subject">${t('subject')}</p>
        <h1>${t('done')}</h1>
        <p><b>${esc(s.email)}</b>, ${new Date(s.end || Date.now()).toLocaleString(getLang() === 'es' ? 'es-ES' : 'ca-ES')}. ${t('totalTime')}: ${formatTime(totalMs)}. ${t('langUsed')}: ${t('langName')}.</p>
        ${s.p1.skipped ? `<p>${t('no3d')}</p>` : ''}
      </header>
      <div class="gradebox">
        <div class="gradebig"><span>${t('grade')}</span><b id="grade">${fmt(G.final)}</b><small>${t('gradeOf')} · ${t('levels')[G.level]}</small></div>
        <div class="gradeparts">
          <div><span>${t('gradeModels')} · ${pct(G.weights.models)} %</span><b>${fmt(G.phases.models)}</b></div>
          <div><span>${t('gradeTest')} · ${pct(G.weights.test)} %</span><b>${fmt(G.phases.test)}</b><small>${G.testOk}/${s.p2.order.length} ${t('correctOf')}</small></div>
          <div><span>${t('gradeCloze')} · ${pct(G.weights.cloze)} %</span><b>${fmt(G.phases.cloze)}</b><small>${G.clozeOk}/${G.gapsTotal} ${t('correctOf')}</small></div>
        </div>
        <p class="gradehow">${t('gradeHow', { w1: pct(G.weights.models), w2: pct(G.weights.test), w3: pct(G.weights.cloze) })}</p>
      </div>
      <div class="tiles">
        <div class="tile"><span>${t('pointsTile')}</span><b>${s.points}</b></div>
        <div class="tile"><span>${t('errors')}</span><b>${s.errors}</b></div>
        <div class="tile"><span>${t('hints')}</span><b>${s.hints}</b></div>
      </div>
      <div>
        <h2 style="margin-bottom:8px">${t('pagesTitle')}</h2>
        <div class="tablewrap"><table><thead><tr><th>${t('pageCol')}</th><th class="num">${t('starsCol')}</th><th class="num">${t('errors')}</th><th class="num">${t('hints')}</th><th class="num">${t('time')}</th></tr></thead><tbody>${rows}</tbody></table></div>
      </div>
      <div style="display:grid;gap:10px">
        <h2>${t('review')}</h2>
        ${atlasMiss.length ? `<p class="muted">${t('reviewAtlas')}</p><div class="tags">${atlasMiss.map(([id, c]) => `<span class="tag">${esc(nameOf(id))} × ${c}</span>`).join('')}</div>` : ''}
        ${quizMiss.length ? `<p class="muted">${t('reviewQuiz')}</p><ul>${quizMiss.map(q => `<li>${esc(q[0])} <b>${esc(q[1][q[2]])}</b></li>`).join('')}</ul>` : ''}
        ${clozeMiss.length ? `<p class="muted">${t('reviewCloze')}</p><ul>${clozeMiss.map(g => `<li>${esc(CLOZE[getLang()][g.t].title)}: <b>${esc(g.ok)}</b> <span class="muted">(${t('youChose')} «${esc(g.opts[s.p3.answers[g.key]] ?? '')}»)</span></li>`).join('')}</ul>` : ''}
        ${!atlasMiss.length && !quizMiss.length && !clozeMiss.length ? `<p>${t('noErrors')}</p>` : ''}
      </div>
      <div class="no-print deliver">
        <h2>${t('deliver')}</h2>
        <ol><li>${t('deliver1')}</li><li>${t('deliver2')}</li><li>${t('deliver3')}</li></ol>
        <div class="row"><button class="btn" id="pdf">${ic('pdf')} ${t('pdf')}</button><a class="btn ghost" id="classroom" href="https://classroom.google.com/" target="_blank" rel="noopener">${ic('upload')} ${t('classroom')}</a></div>
      </div>
    </div>
  </section></div>`;
  if (!s.seen[4]) {
    s.seen[4] = true; save();
    fx.sound.play('level');
    fx.stamp($('.gradebig'), 120);
    $$('.gradeparts > div, .tile').forEach((el, i) => fx.stamp(el, 380 + i * 90));
  }
  $('#pdf').onclick = () => {
    const prev = document.title;
    document.title = `${t('pdfName')} - ${s.email.split('@')[0]} - ${fmt(G.final)}`; // nom suggerit del PDF
    window.print();
    setTimeout(() => { document.title = prev; }, 1000);
  };
}

render();
