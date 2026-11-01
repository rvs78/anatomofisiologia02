// Lògica pura del joc (sense DOM) — la fan servir game.js i tests/check.mjs. Idèntica a Vascular Quest + test i text amb buits.

export const SCORE = { hit: 10, miss: -3, hint: -5, streakEvery: 3, streakBonus: 15 };

const PREFIX = /^(l |la |el )?(arteria|arteries|vena|venes|art|a|v|tronc venos)\s+/;

export function normalize(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/l·l|l\.l/g, 'll')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(PREFIX, '')
    .replace(/ (dreta|esquerra|derecha|izquierda)$/, '');
}

const squash = t => normalize(t).replace(/ /g, '');

function distance(a, b) {
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 2) return 3;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

/** Compara una resposta escrita amb el nom correcte.
 *  Retorna 'exact', 'typo' (una lletra de diferència en noms llargs) o null. */
export function matchName(input, name, synonyms = {}) {
  const given = squash(input);
  if (!given) return null;
  const forms = [name, ...(synonyms[name] || [])].map(squash);
  if (forms.includes(given)) return 'exact';
  if (forms.some(f => f.length >= 7 && distance(given, f) <= 1)) return 'typo';
  return null;
}

/** Barreja Fisher–Yates amb generador opcional (per a proves deterministes). */
export function shuffle(list, rnd = Math.random) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Aplica una acció de puntuació a l'estat. Retorna els punts guanyats (inclòs el bonus). */
export function applyScore(s, kind, phase) {
  let gained = SCORE[kind];
  if (kind === 'hit') {
    s.correct++;
    s.streak++;
    if (s.streak % SCORE.streakEvery === 0) gained += SCORE.streakBonus;
  } else {
    s.streak = 0;
    if (kind === 'hint') s.hints++; else s.errors++;
  }
  const before = s.points;
  s.points = Math.max(0, s.points + gained);
  const delta = s.points - before;
  s.phasePts[phase] = (s.phasePts[phase] || 0) + delta;
  return { gained, bonus: kind === 'hit' && gained > SCORE.hit };
}

/** 3 estrelles sense errors ni pistes; 2 amb fins a 2 incidències; 1 a la resta. */
export function stars(errors, hints) {
  const n = errors + hints;
  return n === 0 ? 3 : n <= 2 ? 2 : 1;
}

export function formatTime(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s`;
}

/** Tria preguntes per blocs (p. ex. {coord: 4, vista: 8, oida: 8}) i les barreja. Retorna índexs del banc. */
export function pickQuiz(bank, mix, rnd = Math.random) {
  const out = [];
  for (const [block, n] of Object.entries(mix)) {
    const idx = bank.map((q, i) => [q, i]).filter(([q]) => q[4] === block).map(([, i]) => i);
    out.push(...shuffle(idx, rnd).slice(0, n));
  }
  return shuffle(out, rnd);
}

/** Separa un text amb buits {correcta|opció|opció::pista} en trossos de text i buits. */
export function parseCloze(body) {
  const parts = [];
  const re = /\{([^{}]+)\}/g;
  let last = 0, m;
  while ((m = re.exec(body))) {
    if (m.index > last) parts.push(body.slice(last, m.index));
    const [opts, clue = ''] = m[1].split('::');
    const list = opts.split('|').map(x => x.trim());
    parts.push({ ok: list[0], opts: list, clue: clue.trim() });
    last = re.lastIndex;
  }
  if (last < body.length) parts.push(body.slice(last));
  return parts;
}

/* ---------- Nota de 1 a 10 ----------
   Cada fase dona un encert entre 0 i 1:
   · Models 3D: estructures / (estructures + errors + 0,5 × pistes)
   · Test: encerts / 20
   · Patologies: (encerts − 0,5 × encerts amb pista) / 30
   Nota = 1 + 9 × (0,4 × models + 0,3 × test + 0,3 × patologies), amb un decimal.
   Si la fase 3D no s'ha pogut fer (sense WebGL), test i patologies pesen el 50 % cadascun. */
export const WEIGHTS = { models: 0.4, test: 0.3, cloze: 0.3 };
const round1 = x => Math.round(x * 10) / 10;
export const toGrade = acc => round1(1 + 9 * Math.min(1, Math.max(0, acc)));

export function grade({ models, test, cloze }) {
  const a1 = models.skipped || !models.items ? null : models.items / (models.items + models.errors + 0.5 * models.hints);
  const a2 = test.total ? test.ok / test.total : 0;
  const a3 = cloze.total ? Math.max(0, cloze.ok - 0.5 * cloze.hintedOk) / cloze.total : 0;
  const w = a1 == null ? { models: 0, test: 0.5, cloze: 0.5 } : WEIGHTS;
  const acc = (a1 ?? 0) * w.models + a2 * w.test + a3 * w.cloze;
  const final = toGrade(acc);
  return {
    final, weights: w,
    phases: { models: a1 == null ? null : toGrade(a1), test: toGrade(a2), cloze: toGrade(a3) },
    level: final < 5 ? 'insuf' : final < 6 ? 'suf' : final < 7 ? 'be' : final < 9 ? 'notable' : 'excel',
  };
}
