// Proves de coherència: node tests/check.mjs  (cal `npm i` per tenir three a node_modules)
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { MODELS, buildModel, anchorWorld } from '../models.js';
import { LEVELS, QUIZ, QUIZ_MIX, CLOZE } from '../data.js';
import { shuffle, applyScore, stars, pickQuiz, parseCloze, grade, toGrade } from '../logic.js';
import { UI } from '../i18n.js';
import * as fx from '../fx.js';

let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };

/* ---- Models: ancoratges sobre la geometria i visibles a la vista inicial */
for (const kind of Object.keys(MODELS)) {
  const T = MODELS[kind].targets;
  for (const lg of ['ca', 'es']) { const nm = T.map(t => t.name[lg]); ok(nm.every(Boolean) && new Set(nm).size === nm.length, `${kind}/${lg}: noms buits o duplicats`); }
  const names = T.map(t => t.id);
  ok(new Set(T.map(t => t.id)).size === T.length, `${kind}: ids duplicats`);
  const m = buildModel(kind);
  const meshes = []; m.root.traverse(o => { if (o.isMesh) meshes.push(o); });
  const occ = meshes.filter(o => o.userData.occluder);
  const sphere = new THREE.Box3().setFromObject(m.root).getBoundingSphere(new THREE.Sphere());
  const target = sphere.center.clone().lerp(m.camera.target, 0.5);
  const dir = m.camera.pos.clone().sub(m.camera.target).normalize();
  const ray = new THREE.Raycaster();
  for (const t of T) {
    ok(m.anchors[t.id], `${t.id}: sense ancoratge`);
    const p = anchorWorld(m, t.id);
    ok(p.distanceTo(sphere.center) < sphere.radius, `${t.id}: fora del model`);
    // a prop d'alguna superfície del model (≤ 2,5 mm) o dins un medi transparent (humors, pupil·la)
    let best = Infinity;
    const tri = new THREE.Triangle(), a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), q = new THREE.Vector3();
    for (const o of meshes) { // distància al triangle més proper (cares i tapes de tall)
      const pos = o.geometry.attributes.position, idx = o.geometry.index, k = idx ? idx.count : pos.count;
      const at = i => (idx ? idx.getX(i) : i);
      for (let i = 0; i < k && best > 0.05; i += 3) {
        a.fromBufferAttribute(pos, at(i)).applyMatrix4(o.matrixWorld); b.fromBufferAttribute(pos, at(i + 1)).applyMatrix4(o.matrixWorld); c.fromBufferAttribute(pos, at(i + 2)).applyMatrix4(o.matrixWorld);
        tri.set(a, b, c).closestPointToPoint(p, q); const dd = q.distanceTo(p); if (dd === dd) best = Math.min(best, dd); // ignora triangles degenerats (NaN)
      }
    }
    ok(best < 1.2, `${t.id}: massa lluny de la geometria (${best.toFixed(2)} mm)`);
    for (const D of [70, 120, 180]) { // visible des de la càmera inicial a diverses distàncies
      const cam = target.clone().addScaledVector(dir, D), d = p.clone().sub(cam), dist = d.length();
      ray.set(cam, d.normalize());
      const hit = ray.intersectObjects(occ, false).find(x => x.distance < dist - 0.35 && !(x.object.material.clippingPlanes && x.point.y > 0.01));
      ok(!hit, `${t.id}: amagat a la vista inicial (distància ${D})`);
    }
  }
  // tots apareixen en algun nivell regional
  const used = new Set(LEVELS.filter(l => l.model === kind).flatMap(l => l.ids === 'ALL' ? [] : l.ids));
  names.forEach(nm => ok(used.has(nm), `${kind}: ${nm} no surt en cap nivell regional`));
}
// Relacions anatòmiques bàsiques (ull dret: +X nasal, +Z anterior; orella: +X lateral)
{
  const e = buildModel('ull'), A = id => anchorWorld(e, id);
  ok(A('ull-disc').x > A('ull-macula').x, 'el disc òptic és nasal respecte a la màcula');
  ok(A('ull-cornia').z > A('ull-cristalli').z && A('ull-cristalli').z > A('ull-vitri').z, 'ordre antero-posterior: còrnia → cristal·lí → vitri');
  ok(A('ull-aquos').z > A('ull-iris').z - 0.5, 'l\'humor aquós és davant de l\'iris');
  ok(A('ull-nervi').z < A('ull-disc').z, 'el nervi òptic és posterior al disc');
  const o = buildModel('oid'), B = id => anchorWorld(o, id);
  ok(B('oid-pavello').x > B('oid-conducte').x && B('oid-conducte').x > B('oid-timpa').x, 'lateral → medial: pavelló, conducte, timpà');
  ok(B('oid-timpa').x > B('oid-estrep').x && B('oid-estrep').x > B('oid-vestibul').x, 'timpà → estrep → vestíbul');
  ok(B('oid-martell').x > B('oid-enclusa').x - 0.5 && B('oid-enclusa').x > B('oid-estrep').x, 'cadena d\'ossets de lateral a medial');
  ok(B('oid-nervi').x < B('oid-vestibul').x, 'el nervi VIII surt per medial');
  ok(B('oid-eustaqui').z > B('oid-timpa').z && B('oid-eustaqui').y < B('oid-timpa').y, 'la trompa va cap a anterior i inferior');
  ok(B('oid-canals').y > B('oid-vestibul').y, 'els canals semicirculars són superiors al vestíbul');
}
for (const L of LEVELS) {
  ok(MODELS[L.model], `Nivell «${L.title.ca}»: model inexistent`);
  ok(L.title.ca && L.title.es, 'Nivell sense títol en les dues llengües');
  if (L.ids === 'ALL') continue;
  const ids = MODELS[L.model].targets.map(t => t.id);
  L.ids.forEach(id => ok(ids.includes(id), `Nivell «${L.title.ca}»: ${id} no existeix al model`));
  ok(new Set(L.ids).size === L.ids.length, `Nivell «${L.title.ca}»: ids repetits`);
}

/* ---- Test (les dues llengües, mateix ordre i mateixa resposta correcta) */
ok(QUIZ.ca.length === QUIZ.es.length, 'El banc té el mateix nombre de preguntes en català i castellà');
for (const lg of ['ca', 'es']) {
  for (const [q, o, r, why, block] of QUIZ[lg]) {
    ok(o.length === 4 && new Set(o).size === 4, `${lg}: opcions incorrectes: ${q}`);
    ok(r >= 0 && r < 4 && why, `${lg}: resposta o explicació: ${q}`);
    ok(Object.keys(QUIZ_MIX).includes(block), `${lg}: bloc desconegut: ${q}`);
  }
  ok(new Set(QUIZ[lg].map(q => q[0])).size === QUIZ[lg].length, `${lg}: enunciats repetits`);
}
QUIZ.ca.forEach((q, i) => ok(q[2] === QUIZ.es[i][2] && q[4] === QUIZ.es[i][4], `Pregunta ${i}: resposta o bloc diferents entre llengües`));
for (const [block, k] of Object.entries(QUIZ_MIX)) ok(QUIZ.ca.filter(q => q[4] === block).length >= k + 3, `Bloc ${block}: calen més preguntes que les que es trien`);
ok(Object.values(QUIZ_MIX).reduce((a, b) => a + b, 0) === 20, 'El test té 20 preguntes');
const pick = pickQuiz(QUIZ.ca, QUIZ_MIX);
ok(pick.length === 20 && new Set(pick).size === 20, 'pickQuiz: 20 índexs diferents');
ok(pick.filter(i => QUIZ.ca[i][4] === 'vista').length === QUIZ_MIX.vista, 'pickQuiz respecta els blocs');

/* ---- Text de patologies */
ok(CLOZE.ca.length === CLOZE.es.length, 'Mateix nombre de textos');
for (const lg of ['ca', 'es']) {
  let gaps = 0;
  for (const c of CLOZE[lg]) {
    const parts = parseCloze(c.body), g = parts.filter(p => typeof p !== 'string');
    gaps += g.length;
    ok(g.length >= 5, `${lg} «${c.title}»: pocs buits`);
    for (const x of g) {
      ok(x.opts.length === 3 && new Set(x.opts).size === 3, `${lg} «${c.title}»: cada buit vol 3 opcions diferents (${x.opts})`);
      ok(x.clue.length > 10, `${lg} «${c.title}»: falta la pista de «${x.ok}»`);
    }
    parts.forEach((p, i) => { if (typeof p === 'string' && typeof parts[i + 1] === 'object') ok(!/\w'$/.test(p), `${lg}: apòstrof just abans d'un buit`); });
    ok(parts.filter(p => typeof p === 'string').every(p => !/[{}|]/.test(p)), `${lg} «${c.title}»: sintaxi de buits trencada`);
  }
  ok(gaps === 30, `${lg}: 30 buits en total (${gaps})`);
}
CLOZE.ca.forEach((c, i) => ok(parseCloze(c.body).filter(p => typeof p !== 'string').length === parseCloze(CLOZE.es[i].body).filter(p => typeof p !== 'string').length, `Text ${i}: diferent nombre de buits entre llengües`));
const pc = parseCloze('A {x|y|z::pista} B');
ok(pc.length === 3 && pc[1].ok === 'x' && pc[1].clue === 'pista' && pc[2] === ' B', 'parseCloze');

/* ---- Interfície: mateixes claus en les dues llengües */
const kc = Object.keys(UI.ca).sort(), ke = Object.keys(UI.es).sort();
ok(JSON.stringify(kc) === JSON.stringify(ke), `Claus de la interfície diferents: ${kc.filter(k => !ke.includes(k))} / ${ke.filter(k => !kc.includes(k))}`);

/* ---- Nota de 1 a 10 */
const G = (m, tOk, cOk, hOk = 0, skipped = false) => grade({ models: { items: 53, errors: m[0], hints: m[1], skipped }, test: { ok: tOk, total: 20 }, cloze: { ok: cOk, hintedOk: hOk, total: 30 } });
ok(G([0, 0], 20, 30).final === 10, 'tot perfecte = 10');
ok(G([1000, 0], 0, 0).final >= 1 && G([1000, 0], 0, 0).final < 1.3, 'tot malament ≈ 1 (mai per sota)');
ok(toGrade(0) === 1 && toGrade(1) === 10 && toGrade(0.5) === 5.5, 'escala 1 + 9 × encert');
ok(G([0, 0], 10, 30).final === toGrade(0.4 + 0.15 + 0.3), 'ponderació 40/30/30');
ok(G([0, 0], 20, 30, 10).phases.cloze === toGrade(25 / 30), 'una pista a un buit encertat val mig');
ok(G([0, 0], 20, 30, 0, true).weights.test === 0.5, 'sense fase 3D: 50/50');
ok(G([13, 2], 16, 22, 1).level === 'notable', 'qualificació');

/* ---- Barreja i puntuació (idèntica a Vascular Quest) */
const sh = shuffle([1, 2, 3, 4, 5]); ok(sh.length === 5 && [...sh].sort().join() === '1,2,3,4,5', 'shuffle');
const s = { points: 0, streak: 0, correct: 0, errors: 0, hints: 0, phasePts: {} };
applyScore(s, 'hit', 1); applyScore(s, 'hit', 1); const r = applyScore(s, 'hit', 1);
ok(s.points === 45 && r.bonus, 'bonus de ratxa: 3×10 + 15');
applyScore(s, 'miss', 1); ok(s.points === 42 && s.streak === 0 && s.errors === 1, 'error −3');
applyScore(s, 'hint', 1); ok(s.points === 37 && s.hints === 1, 'pista −5');
const z = { points: 2, streak: 0, correct: 0, errors: 0, hints: 0, phasePts: {} };
applyScore(z, 'hint', 1); ok(z.points === 0 && z.phasePts[1] === -2, 'mínim 0');
ok(stars(0, 0) === 3 && stars(1, 1) === 2 && stars(2, 1) === 1, 'estrelles');
ok(typeof fx.sound.play === 'function' && typeof fx.fly === 'function', 'fx exporta sound i fly');
fx.sound.play('hit'); ok(fx.reduced() === true, 'sense window es considera moviment reduït');
console.log(`✓ ${n} comprovacions superades`);
