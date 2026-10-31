// Efectes de moviment i so de Vascular Quest (sense estat de joc).
// Segur en qualsevol entorn: sense window, sense Web Audio o amb moviment reduït, no fa res visible.

const hasWin = typeof window !== 'undefined';
const SOUND_KEY = 'vq-sound';
const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';

export function reduced() {
  return !hasWin || !window.matchMedia || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* ---------- So (Web Audio, sintetitzat) ---------- */
let ctx = null;
function audio() {
  if (!hasWin) return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try { ctx ||= new AC(); if (ctx.state === 'suspended') ctx.resume(); } catch { return null; }
  return ctx;
}
function tone(ac, { f, f2 = f, t = 0, d = .12, type = 'sine', g = .18 }) {
  const o = ac.createOscillator(), v = ac.createGain(), at = ac.currentTime + t;
  o.type = type; o.frequency.setValueAtTime(f, at); o.frequency.exponentialRampToValueAtTime(f2, at + d);
  v.gain.setValueAtTime(0.0001, at); v.gain.exponentialRampToValueAtTime(g, at + .012); v.gain.exponentialRampToValueAtTime(0.0001, at + d);
  o.connect(v).connect(ac.destination); o.start(at); o.stop(at + d + .02);
}
const RECIPES = {
  // «cop» sord del cromo + dues notes ascendents
  hit: [{ f: 180, f2: 70, d: .07, type: 'triangle', g: .25 }, { f: 660, t: .05, d: .1 }, { f: 990, t: .12, d: .16 }],
  miss: [{ f: 150, f2: 110, d: .2, type: 'sawtooth', g: .09 }, { f: 120, f2: 90, t: .09, d: .18, type: 'square', g: .05 }],
  hint: [{ f: 880, d: .09, type: 'triangle', g: .1 }, { f: 740, t: .08, d: .12, type: 'triangle', g: .1 }],
  bonus: [{ f: 523, d: .1 }, { f: 659, t: .08, d: .1 }, { f: 784, t: .16, d: .1 }, { f: 1047, t: .24, d: .25, g: .2 }],
  level: [{ f: 392, d: .14 }, { f: 523, t: .14, d: .14 }, { f: 659, t: .28, d: .14 }, { f: 784, t: .42, d: .4, g: .22 }],
  open: [{ f: 900, f2: 300, d: .22, type: 'sawtooth', g: .04 }, { f: 1200, t: .18, d: .12, type: 'triangle', g: .08 }],
};
export const sound = {
  enabled() {
    if (!hasWin) return false;
    try { return localStorage.getItem(SOUND_KEY) !== 'off'; } catch { return true; }
  },
  toggle() {
    const on = !this.enabled();
    try { localStorage.setItem(SOUND_KEY, on ? 'on' : 'off'); } catch { /* sense emmagatzematge */ }
    if (on) this.play('hint');
    return on;
  },
  play(kind) {
    if (!this.enabled()) return;
    const ac = audio(), r = RECIPES[kind];
    if (!ac || !r) return;
    try { r.forEach(n => tone(ac, n)); } catch { /* àudio no disponible */ }
  },
};

/* ---------- Moviment ---------- */
const center = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; };

function card(label, kind, at) {
  const c = document.createElement('div');
  c.className = `fly-card ${kind}`;
  c.textContent = label;
  c.setAttribute('aria-hidden', 'true');
  c.style.left = at.x + 'px'; c.style.top = at.y + 'px';
  document.body.append(c);
  return c;
}

/** El cromo vola des del munt (o des del punter) fins al forat. */
export async function fly(from, toEl, label, kind) {
  if (!hasWin || !toEl || reduced()) return;
  const a = from instanceof Element ? center(from) : from, b = center(toEl);
  if (!a) return;
  const c = card(label, kind, a);
  const dx = b.x - a.x, dy = b.y - a.y, s = Math.min(1.1, Math.max(.6, b.w / Math.max(c.offsetWidth, 1)));
  try {
    await c.animate([
      { transform: 'translate(-50%,-50%) rotate(-6deg) scale(1)' },
      { transform: `translate(calc(-50% + ${dx * .55}px), calc(-50% + ${dy * .55 - 40}px)) rotate(4deg) scale(1.12)`, offset: .55 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(0) scale(${s})` },
    ], { duration: Math.min(520, 260 + Math.hypot(dx, dy) * .35), easing: EASE_OUT }).finished;
  } catch { /* animació interrompuda */ }
  c.remove();
}

/** Cop i brillantor quan el cromo s'enganxa. */
export function stick(el) {
  if (!hasWin || !el) return;
  el.classList.remove('stuck'); void el.offsetWidth; el.classList.add('stuck');
  if (reduced()) return;
  el.animate([{ transform: el.style.transform + ' scale(1.18) rotate(-2deg)' }, { transform: el.style.transform + ' scale(.96)' }, { transform: el.style.transform || 'none' }],
    { duration: 380, easing: EASE_OUT, composite: 'add' });
}

/** Un cromo equivocat rebota i torna al munt. */
export async function bounceBack(from, toEl, label, kind) {
  if (!hasWin || !toEl || reduced()) return;
  const a = from instanceof Element ? center(from) : from, b = center(toEl);
  if (!a) return;
  const c = card(label, kind, a);
  c.classList.add('wrong');
  const dx = b.x - a.x, dy = b.y - a.y;
  try {
    await c.animate([
      { transform: 'translate(-50%,-50%) rotate(0)' },
      { transform: 'translate(calc(-50% - 10px), -50%) rotate(-8deg)', offset: .12 },
      { transform: 'translate(calc(-50% + 10px), -50%) rotate(8deg)', offset: .24 },
      { transform: `translate(calc(-50% + ${dx * .5}px), calc(-50% + ${dy * .5 - 60}px)) rotate(-14deg) scale(.9)`, offset: .62 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(0) scale(.8)`, opacity: .2 },
    ], { duration: 620, easing: 'cubic-bezier(.3,.7,.4,1)' }).finished;
  } catch { /* interrompuda */ }
  c.remove();
}

/** Puntuació flotant i espurnes al voltant d'un element. */
export function burst(el, text, tone = 'gain') {
  if (!hasWin || !el) return;
  const p = center(el);
  const t = document.createElement('div');
  t.className = `float-pts ${tone}`; t.textContent = text; t.setAttribute('aria-hidden', 'true');
  t.style.left = p.x + 'px'; t.style.top = p.y + 'px';
  document.body.append(t);
  const rm = () => t.remove();
  if (reduced()) { setTimeout(rm, 700); return; }
  t.animate([{ transform: 'translate(-50%,-30%) scale(.6)', opacity: 0 }, { transform: 'translate(-50%,-110%) scale(1.1)', opacity: 1, offset: .3 }, { transform: 'translate(-50%,-190%) scale(1)', opacity: 0 }],
    { duration: 900, easing: EASE_OUT }).finished.then(rm, rm);
  if (tone !== 'gain') return;
  for (let i = 0; i < 9; i++) {
    const s = document.createElement('i');
    s.className = 'spark'; s.setAttribute('aria-hidden', 'true');
    s.style.left = p.x + 'px'; s.style.top = p.y + 'px';
    document.body.append(s);
    const ang = (i / 9) * Math.PI * 2 + Math.random() * .4, dist = 34 + Math.random() * 26;
    s.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist}px)) scale(0)`, opacity: 0 }],
      { duration: 520 + Math.random() * 200, easing: EASE_OUT }).finished.then(() => s.remove(), () => s.remove());
  }
}

/** Sacseja un element (error). */
export function shake(el) {
  if (!hasWin || !el) return;
  el.classList.add('miss');
  setTimeout(() => el.classList.remove('miss'), 450);
  if (reduced()) return;
  el.animate([{ translate: '0' }, { translate: '-6px 0' }, { translate: '6px 0' }, { translate: '-4px 0' }, { translate: '0' }], { duration: 360, easing: 'ease-out' });
}

/** Segell que cau (estrelles, «ratxa»). */
export function stamp(el, delay = 0) {
  if (!hasWin || !el) return Promise.resolve();
  if (reduced()) { el.style.opacity = 1; return Promise.resolve(); }
  return el.animate([{ transform: 'scale(2.4) rotate(-18deg)', opacity: 0 }, { transform: 'scale(.9) rotate(4deg)', opacity: 1, offset: .7 }, { transform: 'scale(1) rotate(0)', opacity: 1 }],
    { duration: 420, delay, easing: EASE_OUT, fill: 'backwards' }).finished.catch(() => {});
}

/** Banner breu (ratxa de 3). */
export function banner(text) {
  if (!hasWin) return;
  const b = document.createElement('div');
  b.className = 'banner'; b.textContent = text; b.setAttribute('role', 'status');
  document.body.append(b);
  const rm = () => b.remove();
  if (reduced()) { setTimeout(rm, 1400); return; }
  b.animate([{ transform: 'translate(-50%, 0) scale(.4) rotate(-8deg)', opacity: 0 }, { transform: 'translate(-50%, 0) scale(1.06) rotate(-3deg)', opacity: 1, offset: .25 },
    { transform: 'translate(-50%, 0) scale(1) rotate(-3deg)', opacity: 1, offset: .8 }, { transform: 'translate(-50%, -20px) scale(1) rotate(-3deg)', opacity: 0 }],
  { duration: 1500, easing: EASE_OUT }).finished.then(rm, rm);
}
