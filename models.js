// Models 3D de l'ull i de l'orella (three.js r170).
// Unitats: mil·límetres. Cada punt de joc (ancoratge) es calcula amb els MATEIXOS
// paràmetres que generen la malla on es troba: no hi ha cap coordenada posada a mà sobre la pantalla.
//
// ULL: ull dret, secció horitzontal pel meridià que passa per la fòvea i el disc òptic
//      (com la làmina clàssica), vist des de dalt. Eix òptic local = +Y; el grup el gira
//      perquè la còrnia miri cap a +Z (anterior). +X = nasal, −X = temporal, +Y món = superior.
// ORELLA: orella dreta en tall coronal; +X lateral, +Y superior, +Z anterior.
//      L'orella mitjana i la interna s'amplien ×1,6 respecte de l'externa (proporció didàctica).
import * as THREE from 'three';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const DEG = Math.PI / 180;

/* ------------------------------------------------------------------ materials */
function solid(color, o = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0, side: THREE.DoubleSide, ...o });
}
function glass(color, opacity, o = {}) {
  return new THREE.MeshPhysicalMaterial({
    color, transparent: true, opacity, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05,
    depthWrite: false, side: THREE.DoubleSide, ...o,
  });
}
const CUT_Y = [new THREE.Plane(V3(0, -1, 0), 0)]; // conserva y ≤ 0 (món): tall horitzontal de l'ull

function mesh(geo, material, { occluder = true, name = '' } = {}) {
  const m = new THREE.Mesh(geo, material);
  m.userData.occluder = occluder && !material.transparent;
  m.name = name;
  return m;
}

/* ------------------------------------------------------------------ geometria */
/** Revolució d'un perfil tancat [[r,y],…] al voltant de Y entre phiStart i phiStart+phiLength,
 *  amb les dues tapes del tall (superfície de secció). */
function solidLathe(profile, material, capMaterial, { seg = 96, phiStart = -Math.PI / 2, phiLength = Math.PI, name } = {}) {
  const g = new THREE.Group();
  const pts = [...profile, profile[0]].map(([r, y]) => new THREE.Vector2(Math.max(r, 0), y));
  const lathe = new THREE.LatheGeometry(pts, seg, phiStart, phiLength);
  lathe.computeVertexNormals();
  g.add(mesh(lathe, material, { name }));
  const shape = new THREE.Shape(profile.map(([r, y]) => new THREE.Vector2(Math.max(r, 0), y)));
  for (const phi of [phiStart, phiStart + phiLength]) {
    const cap = mesh(new THREE.ShapeGeometry(shape, 24), capMaterial || material, { name: name + ' (tall)' });
    cap.rotation.y = phi - Math.PI / 2; // l'eix x de la forma passa a (sin φ, 0, cos φ)
    g.add(cap);
  }
  return g;
}

/** Escombrat d'una secció tancada al llarg d'una corba: points[i], frames {u,v}[i], section(i)->[[a,b],…]. */
function sweep(points, frames, section, { closeEnds = true } = {}) {
  const pos = [], idx = [];
  const n = points.length, k = section(0).length;
  for (let i = 0; i < n; i++) {
    const p = points[i], { u, v } = frames[i];
    for (const [a, b] of section(i)) pos.push(p.x + u.x * a + v.x * b, p.y + u.y * a + v.y * b, p.z + u.z * a + v.z * b);
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < k; j++) {
    const a = i * k + j, b = i * k + (j + 1) % k, c = (i + 1) * k + j, d = (i + 1) * k + (j + 1) % k;
    idx.push(a, c, b, b, c, d);
  }
  const geo = new THREE.BufferGeometry();
  if (closeEnds) { // tapes en ventall des del centre de la secció
    const base = pos.length / 3;
    for (const [i, flip] of [[0, true], [n - 1, false]]) {
      const p = points[i];
      pos.push(p.x, p.y, p.z);
      const cIdx = pos.length / 3 - 1;
      for (let j = 0; j < k; j++) {
        const a = i * k + j, b = i * k + (j + 1) % k;
        if (flip) idx.push(cIdx, b, a); else idx.push(cIdx, a, b);
      }
    }
    void base;
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/** Marcs perpendiculars estables: u = projecció d'un vector de referència, v = t × u. */
function framesAlong(points, ref = V3(0, 1, 0)) {
  return points.map((p, i) => {
    const a = points[Math.max(0, i - 1)], b = points[Math.min(points.length - 1, i + 1)];
    const t = b.clone().sub(a).normalize();
    let u = ref.clone().sub(t.clone().multiplyScalar(ref.dot(t)));
    if (u.lengthSq() < 1e-6) u = V3(1, 0, 0).sub(t.clone().multiplyScalar(t.x));
    u.normalize();
    return { t, u, v: t.clone().cross(u).normalize() };
  });
}

const circle = (r, k = 18) => Array.from({ length: k }, (_, j) => [r * Math.cos(2 * Math.PI * j / k), r * Math.sin(2 * Math.PI * j / k)]);

/** Tub de radi variable al llarg d'una corba Catmull-Rom. */
function tube(ctrl, radius, material, { samples = 64, ref, k = 18, name } = {}) {
  const curve = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal');
  const pts = curve.getSpacedPoints(samples);
  const fr = framesAlong(pts, ref);
  const rf = typeof radius === 'function' ? radius : () => radius;
  const geo = sweep(pts, fr, i => circle(rf(i / (pts.length - 1)), k));
  const m = mesh(geo, material, { name });
  m.userData.curve = curve; m.userData.points = pts; m.userData.frames = fr;
  return m;
}

/** El·lipsoide. */
function ellipsoid(c, r, material, name) {
  const m = mesh(new THREE.SphereGeometry(1, 40, 28), material, { name });
  m.scale.set(r[0], r[1], r[2]); m.position.copy(c);
  return m;
}

/** Textura de l'iris: estries radials (al llarg de v del torn) i collareta. */
function irisTexture() {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas'); c.width = 512; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#6b4a2b'; g.fillRect(0, 0, 512, 64);
  for (let i = 0; i < 512; i += 2) {
    const l = 28 + Math.random() * 30;
    g.fillStyle = `hsl(${26 + Math.random() * 10} 45% ${l}%)`;
    g.fillRect(i, 0, 1 + Math.random() * 2, 64);
  }
  g.fillStyle = 'rgba(40,24,10,.45)'; g.fillRect(0, 36, 512, 6); // collareta
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ================================================================== ULL */
const EYE = {
  R_SCL: 12.0, R_SCL_IN: 11.0, R_CHO_IN: 10.4, R_RET_IN: 9.8,
  CORNEA_R: 7.8, CORNEA_C: 5.285, CORNEA_RI: 7.0, CORNEA_CI: 5.535,
  LENS_A: 9.4, LENS_P: 5.4, LENS_RA: 10, LENS_RP: 6,
  ORA: 54 * DEG, SPUR: 33 * DEG,
};
const sph = (R, a) => [R * Math.sin(a), R * Math.cos(a)];           // α des del pol anterior
const arc = (R, a0, a1, n = 40) => Array.from({ length: n + 1 }, (_, i) => sph(R, a0 + (a1 - a0) * i / n));
const corneaOut = r => EYE.CORNEA_C + Math.sqrt(EYE.CORNEA_R ** 2 - r * r);
const corneaIn = r => EYE.CORNEA_CI + Math.sqrt(EYE.CORNEA_RI ** 2 - r * r);
const lensAnt = r => EYE.LENS_A - (EYE.LENS_RA - Math.sqrt(EYE.LENS_RA ** 2 - r * r));
const lensPost = r => EYE.LENS_P + (EYE.LENS_RP - Math.sqrt(EYE.LENS_RP ** 2 - r * r));
const LENS_EQ = (() => { let lo = 0, hi = 5.9; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (lensAnt(m) > lensPost(m)) lo = m; else hi = m; } return lo; })();
const LIMBUS_R = 5.8;
const IRIS_BACK = [[1.8, 9.26], [3.5, 9.13], [5.85, 8.55]];
const IRIS_FRONT = [[5.85, 8.98], [3.5, 9.6], [1.8, 9.68]];
/** Punt del pla local (r, y) a l'azimut φ → coordenades locals del grup de revolució. */
const P = (r, y, phi) => V3(r * Math.sin(phi), y, r * Math.cos(phi));
const NASAL = Math.PI / 2, TEMPORAL = -Math.PI / 2;

function buildEye() {
  const root = new THREE.Group(); root.name = 'ull';
  const eye = new THREE.Group(); eye.rotation.x = Math.PI / 2; root.add(eye); // +Y local → +Z món
  const anchors = {};
  const anchor = (id, v) => { const o = new THREE.Object3D(); o.position.copy(v); o.name = id; eye.add(o); anchors[id] = o; };

  const M = {
    sclera: solid(0xf3efe6, { roughness: 0.7 }), scleraCut: solid(0xe9e1cf, { roughness: 0.9 }),
    choroid: solid(0x6e2a2c, { roughness: 0.8 }), retina: solid(0xe39b7d, { roughness: 0.75 }),
    retinaCut: solid(0xd98a6b), ciliary: solid(0x7b3a3c, { roughness: 0.8 }),
    lens: glass(0xf7e7b0, 0.62, { roughness: 0.2 }), lensCut: solid(0xf3dc9a, { transparent: true, opacity: 0.85, roughness: 0.3 }),
    cornea: glass(0xcfe8ff, 0.32), corneaCut: solid(0xb9d9f0, { transparent: true, opacity: 0.7 }),
    aqueous: glass(0x9fd6f0, 0.16), vitreous: glass(0xbfe5dc, 0.10),
    iris: solid(0xffffff, { map: irisTexture(), roughness: 0.85 }), irisCut: solid(0x4a3019),
    nerve: solid(0xf1e3b8, { clippingPlanes: CUT_Y, roughness: 0.8 }),
    disc: solid(0xfff1c6, { clippingPlanes: CUT_Y }), macula: solid(0xc9902c, { clippingPlanes: CUT_Y }),
    fovea: solid(0x7a4a16, { clippingPlanes: CUT_Y }),
    vessel: solid(0xb4232f, { clippingPlanes: CUT_Y, roughness: 0.4 }),
    muscle: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, side: THREE.DoubleSide, clippingPlanes: CUT_Y }),
    zonule: new THREE.LineBasicMaterial({ color: 0xe8e0c8, transparent: true, opacity: 0.8 }),
  };

  // Escleròtica: de l'anell limbar al pol posterior (exterior R 12, interior R 11)
  const aL = Math.asin(LIMBUS_R / EYE.R_SCL), aLi = Math.asin(5.75 / EYE.R_SCL_IN);
  eye.add(solidLathe([...arc(EYE.R_SCL, aL, Math.PI), ...arc(EYE.R_SCL_IN, Math.PI, aLi)], M.sclera, M.scleraCut, { name: 'Escleròtica' }));
  // Còrnia
  const cOut = Array.from({ length: 31 }, (_, i) => { const r = LIMBUS_R * i / 30; return [r, corneaOut(r)]; });
  const cIn = Array.from({ length: 31 }, (_, i) => { const r = 5.75 * (30 - i) / 30; return [r, corneaIn(r)]; });
  eye.add(solidLathe([...cOut, ...cIn], M.cornea, M.corneaCut, { name: 'Còrnia' }));
  // Coroide i retina (de la ora serrata al pol posterior)
  eye.add(solidLathe([...arc(EYE.R_SCL_IN, EYE.ORA - 2 * DEG, Math.PI), ...arc(EYE.R_CHO_IN, Math.PI, EYE.ORA - 2 * DEG)], M.choroid, M.choroid, { name: 'Coroide' }));
  eye.add(solidLathe([...arc(EYE.R_CHO_IN, EYE.ORA, Math.PI), ...arc(EYE.R_RET_IN, Math.PI, EYE.ORA)], M.retina, M.retinaCut, { name: 'Retina' }));
  // Cos ciliar (anell triangular amb els processos ciliars cap al cristal·lí)
  const ciliary = [sph(EYE.R_SCL_IN, EYE.SPUR), sph(EYE.R_SCL_IN, EYE.ORA), sph(EYE.R_CHO_IN, EYE.ORA), [6.7, 7.25], [LENS_EQ + 0.75, 7.95], [5.8, 8.5]];
  eye.add(solidLathe(ciliary, M.ciliary, M.ciliary, { name: 'Cos ciliar' }));
  // Iris (forat central = pupil·la)
  eye.add(solidLathe([...IRIS_BACK, ...IRIS_FRONT], M.iris, M.irisCut, { name: 'Iris' }));
  // Cristal·lí biconvex
  const lens = [
    ...Array.from({ length: 25 }, (_, i) => { const r = LENS_EQ * i / 24; return [r, lensAnt(r)]; }),
    ...Array.from({ length: 24 }, (_, i) => { const r = LENS_EQ * (23 - i) / 24; return [r, lensPost(r)]; }),
  ];
  eye.add(solidLathe(lens, M.lens, M.lensCut, { name: 'Cristal·lí' }));
  // Humor aquós: cambra anterior (entre còrnia, iris i cristal·lí)
  const aqueous = [
    ...Array.from({ length: 21 }, (_, i) => { const r = 5.7 * i / 20; return [r, corneaIn(r) - 0.02]; }),
    [5.95, 9.0], ...IRIS_FRONT.slice(1).map(([r, y]) => [r, y + 0.02]), [1.8, lensAnt(1.8) + 0.02], [0, EYE.LENS_A + 0.02],
  ];
  eye.add(solidLathe(aqueous, M.aqueous, M.aqueous, { name: 'Humor aquós' }));
  // Humor vitri: cavitat posterior
  const vitreous = [
    [0, EYE.LENS_P - 0.02], ...Array.from({ length: 12 }, (_, i) => { const r = LENS_EQ * (i + 1) / 12; return [r, lensPost(r) - 0.02]; }),
    [6.7, 7.2], ...arc(EYE.R_RET_IN - 0.02, EYE.ORA + 1 * DEG, Math.PI, 36),
  ];
  eye.add(solidLathe(vitreous, M.vitreous, M.vitreous, { name: 'Humor vitri' }));
  // Fibres zonulars (lligament suspensori del cristal·lí)
  const zon = [];
  for (let k = 0; k <= 24; k++) {
    const phi = -Math.PI / 2 + Math.PI * k / 24;
    for (const dy of [-0.35, 0, 0.35]) { zon.push(P(LENS_EQ + 0.75, 7.95, phi), P(LENS_EQ - 0.05, lensAnt(LENS_EQ - 0.4) - 0.4 + dy, phi)); }
  }
  eye.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(zon), M.zonule));

  // Fons d'ull: màcula amb fòvea (temporal) i disc òptic (nasal), sobre la superfície interna de la retina
  const onRetina = (a, phi, d = 0.06) => { const [r, y] = sph(EYE.R_RET_IN - d, a); return P(r, y, phi); };
  const patch = (center, radius, material, name) => {
    const m = mesh(new THREE.CircleGeometry(radius, 40), material, { name });
    m.position.copy(center); m.lookAt(0, 0, 0); // normal cap al centre del globus
    m.userData.occluder = false;
    eye.add(m); return m;
  };
  const MAC = { a: 176 * DEG, phi: TEMPORAL + 0.62 }, DISC = { a: 164 * DEG, phi: NASAL - 0.42 };
  patch(onRetina(MAC.a, MAC.phi, 0.12), 1.55, M.macula, 'Màcula');
  patch(onRetina(MAC.a, MAC.phi, 0.16), 0.45, M.fovea, 'Fòvea');
  patch(onRetina(DISC.a, DISC.phi, 0.12), 0.9, M.disc, 'Disc òptic');
  // Vasos centrals de la retina: arcades que surten del disc i envolten la màcula
  const vesselPath = (a1, phi1, a2, phi2) => {
    const pts = [];
    for (let i = 0; i <= 14; i++) { const t = i / 14; pts.push(onRetina(DISC.a + (a1 - DISC.a) * t + (a2 - a1) * t * t, DISC.phi + (phi1 - DISC.phi) * t + (phi2 - phi1) * t * t, 0.1)); }
    return pts;
  };
  for (const [a1, p1, a2, p2, r] of [[150, -0.05, 120, TEMPORAL + 0.25, 0.14], [170, 0.2, 125, TEMPORAL + 0.9, 0.12], [140, NASAL - 0.25, 115, NASAL - 0.05, 0.11], [150, NASAL - 0.9, 118, NASAL - 1.3, 0.11]]) {
    eye.add(tube(vesselPath(a1 * DEG, p1, a2 * DEG, p2), r, M.vessel, { samples: 40, k: 8, name: 'Vas retinià' }));
  }

  // Nervi òptic: surt pel disc (nasal) i va cap a l'àpex de l'òrbita
  const exit = (() => { const [r, y] = sph(EYE.R_SCL, DISC.a); return P(r, y, DISC.phi); })();
  const out = exit.clone().normalize();
  const APEX = V3(7.5, -33, 0);
  const nerve = tube([exit.clone().addScaledVector(out, -0.8), exit.clone().addScaledVector(out, 2.5), V3(5.5, -18, 0.2), V3(7, -26, 0), APEX], 1.75, M.nerve, { samples: 60, k: 24, name: 'Nervi òptic' });
  eye.add(nerve);

  // Músculs rectes: tendó blanc nacrat que s'insereix a l'escleròtica i ventre muscular cap a l'àpex
  const muscle = (phi, aIns, name) => {
    const pts = [];
    for (let a = aIns; a <= 118 * DEG; a += 3 * DEG) { const [r, y] = sph(EYE.R_SCL + 0.65, a); pts.push(P(r, y, phi)); }
    const last = pts[pts.length - 1], side = P(2.4, 0, phi);
    const apex = APEX.clone().add(side);
    for (let i = 1; i <= 12; i++) pts.push(last.clone().lerp(apex, i / 12));
    const wdir = V3(Math.cos(phi), 0, -Math.sin(phi)); // direcció circumferencial (amplada)
    const fr = pts.map((p, i) => {
      const t = pts[Math.min(pts.length - 1, i + 1)].clone().sub(pts[Math.max(0, i - 1)]).normalize();
      return { u: wdir, v: t.clone().cross(wdir).normalize() };
    });
    const n = pts.length, onGlobe = pts.map(p => p.length() < EYE.R_SCL + 2.5);
    const sgn = pts.map((p, i) => Math.sign(fr[i].v.dot(p)) || 1); // v cap enfora del globus
    const geo = sweep(pts, fr, i => {
      const t = i / (n - 1), hw = t < 0.12 ? 5 : 4.6 - 2.8 * Math.max(0, t - 0.45) / 0.55, ht = t < 0.12 ? 0.3 : 0.6 + 0.5 * Math.sin(Math.PI * Math.min(1, t * 1.4));
      const R = EYE.R_SCL + 0.65, bow = onGlobe[i] ? 1 : 0.25, sec = [];
      for (const side of [-1, 1]) for (let j = 0; j <= 8; j++) { // cara interna i externa, corbades com l'escleròtica
        const a = (side < 0 ? -1 + 2 * j / 8 : 1 - 2 * j / 8) * hw;
        sec.push([a, sgn[i] * (side * ht - bow * a * a / (2 * R))]);
      }
      return sec;
    });
    const col = [], cT = new THREE.Color(0xeee6d6), cM = new THREE.Color(0xb23b35);
    for (let i = 0; i < n; i++) { const c = i / (n - 1) < 0.16 ? cT : cM; for (let j = 0; j < 18; j++) col.push(c.r, c.g, c.b); }
    for (let j = 0; j < 2; j++) col.push(cT.r, cT.g, cT.b);
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const m = mesh(geo, M.muscle, { name }); eye.add(m); return pts;
  };
  const latRect = muscle(TEMPORAL, 59 * DEG, 'Recte lateral');
  muscle(NASAL, 50 * DEG, 'Recte medial');
  muscle(0, 56 * DEG, 'Recte inferior');

  // ---- Ancoratges (coordenades del perfil de cada estructura)
  const mid = (r1, r2) => (r1 + r2) / 2;
  anchor('ull-cornia', P(3.2, mid(corneaOut(3.2), corneaIn(3.2)), TEMPORAL));
  anchor('ull-esclerotica', (() => { const [r, y] = sph(mid(EYE.R_SCL, EYE.R_SCL_IN), 98 * DEG); return P(r, y, NASAL); })());
  anchor('ull-coroide', (() => { const [r, y] = sph(mid(EYE.R_SCL_IN, EYE.R_CHO_IN), 112 * DEG); return P(r, y, TEMPORAL); })());
  anchor('ull-retina', (() => { const [r, y] = sph(mid(EYE.R_CHO_IN, EYE.R_RET_IN), 140 * DEG); return P(r, y, TEMPORAL); })());
  anchor('ull-iris', P(4.4, mid(9.0, 9.4), NASAL));
  anchor('ull-pupilla', P(0, 9.55, 0));
  anchor('ull-cristalli', P(2.6, mid(lensAnt(2.6), lensPost(2.6)), TEMPORAL));
  anchor('ull-ciliar', P(7.3, 7.55, NASAL));
  anchor('ull-aquos', P(2.4, 10.85, NASAL));
  anchor('ull-vitri', P(4.5, -1.5, TEMPORAL));
  anchor('ull-macula', onRetina(MAC.a, MAC.phi, 0.18));
  anchor('ull-disc', onRetina(DISC.a, DISC.phi, 0.18));
  anchor('ull-nervi', (() => { const p = nerve.userData.curve.getPoint(0.42); p.z = 0; return p; })()); // centre del nervi sobre el pla de tall (z local 0 = y món 0)
  anchor('ull-muscul', latRect[Math.round(latRect.length * 0.62)].clone()); // pla de tall del recte lateral

  return { root, anchors, camera: { pos: V3(14, 74, 40), target: V3(0, -2, -7) }, bounds: 46, fitScale: 0.7 };
}

/* ================================================================== ORELLA */
const S_MI = 1.6; // ampliació de l'orella mitjana i interna

function buildEar() {
  const root = new THREE.Group(); root.name = 'orella';
  const anchors = {};
  const anchorIn = (grp, id, v) => { const o = new THREE.Object3D(); o.position.copy(v); o.name = id; grp.add(o); anchors[id] = o; };
  const M = {
    skin: solid(0xe8b096, { roughness: 0.62 }), skinIn: solid(0xd48d78, { roughness: 0.7 }),
    tm: solid(0xc9cfd4, { roughness: 0.25, metalness: 0.05 }),
    bone: solid(0xf0e6d0, { roughness: 0.55 }), ossicle: solid(0xf5eedc, { roughness: 0.4 }),
    window: solid(0x8f7f63, { roughness: 0.6 }), round: solid(0x3d3a4a),
    cochlea: solid(0xf1d2bd, { roughness: 0.45 }), canal: solid(0xe9dcbc, { roughness: 0.45 }),
    nerve: solid(0xe8c94f, { roughness: 0.55 }), tube: solid(0xd98f8a, { roughness: 0.6 }),
    cavity: glass(0xbcd9f2, 0.08), wall: solid(0xe0cfae, { roughness: 0.9 }),
  };

  /* ---- Orella mitjana i interna (coordenades reals, origen al centre del timpà) */
  const mi = new THREE.Group(); mi.scale.setScalar(S_MI); root.add(mi);
  const nTM = V3(1, -0.5, 0.35).normalize();                       // el timpà mira lateral, inferior i anterior
  const bTM = V3(0, 1, 0).sub(nTM.clone().multiplyScalar(nTM.y)).normalize(); // «amunt» sobre el pla del timpà
  const aTM = bTM.clone().cross(nTM).normalize();
  const TM_R = [4.0, 4.5], TM_DEPTH = 1.5;
  const tmPoint = (rho, th) => V3(0, 0, 0).addScaledVector(aTM, rho * TM_R[0] * Math.cos(th)).addScaledVector(bTM, rho * TM_R[1] * Math.sin(th)).addScaledVector(nTM, -TM_DEPTH * (1 - rho));
  { // membrana timpànica cònica (umbó cap a medial)
    const pos = [], idx = [], NR = 12, NT = 48;
    for (let i = 0; i <= NR; i++) for (let j = 0; j < NT; j++) { const p = tmPoint(i / NR, 2 * Math.PI * j / NT); pos.push(p.x, p.y, p.z); }
    for (let i = 0; i < NR; i++) for (let j = 0; j < NT; j++) { const a = i * NT + j, b = i * NT + (j + 1) % NT, c = a + NT, d = b + NT; idx.push(a, b, c, b, d, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    mi.add(mesh(g, M.tm, { name: 'Timpà' }));
  }
  // anell fibrocartilaginós del timpà
  { const ring = []; for (let j = 0; j <= 64; j++) ring.push(tmPoint(1, 2 * Math.PI * j / 64)); mi.add(tube(ring, 0.22, M.wall, { samples: 96, k: 10, name: 'Anell timpànic' })); }

  // Martell: mànec dins el timpà (de l'umbó a l'apòfisi lateral), coll i cap a l'àtic
  const umbo = tmPoint(0, 0).addScaledVector(nTM, -0.15);
  const latProc = tmPoint(0.78, Math.PI / 2).addScaledVector(nTM, -0.25);
  const mHead = V3(-1.1, 5.7, 0.7);
  mi.add(tube([umbo, umbo.clone().lerp(latProc, 0.5), latProc, V3(-0.3, 4.9, 0.6), mHead], t => 0.32 + 0.25 * t, M.ossicle, { samples: 40, k: 14, name: 'Martell' }));
  mi.add(ellipsoid(mHead, [1.15, 1.55, 1.15], M.ossicle, 'Martell (cap)'));
  // Enclusa: cos articulat amb el cap del martell, apòfisi curta posterior i llarga descendent
  const iBody = V3(-2.5, 5.4, -1.0);
  mi.add(ellipsoid(iBody, [1.25, 1.6, 1.2], M.ossicle, 'Enclusa (cos)'));
  mi.add(tube([iBody, V3(-2.5, 5.7, -2.6), V3(-2.4, 5.8, -3.9)], t => 0.75 - 0.45 * t, M.ossicle, { samples: 20, k: 12, name: 'Enclusa (apòfisi curta)' }));
  const lent = V3(-3.7, 1.05, -0.35);
  mi.add(tube([iBody, V3(-2.7, 3.8, -0.9), V3(-2.95, 1.6, -0.55), lent], t => 0.55 - 0.25 * t, M.ossicle, { samples: 36, k: 12, name: 'Enclusa (apòfisi llarga)' }));
  // Estrep: cap, dues branques en arc i platina a la finestra oval
  const sHead = V3(-4.05, 1.05, -0.3), FP = V3(-6.7, 0.9, -0.2);
  mi.add(ellipsoid(sHead, [0.45, 0.45, 0.45], M.ossicle, 'Estrep (cap)'));
  for (const sgn of [1, -1]) mi.add(tube([sHead, V3(-5.0, 1.0, -0.2 + sgn * 0.95), V3(-6.1, 0.95, -0.2 + sgn * 1.35), V3(-6.6, 0.9, -0.2 + sgn * 1.25)], 0.17, M.ossicle, { samples: 24, k: 10, name: 'Estrep (branca)' }));
  const fp = mesh(new THREE.CylinderGeometry(1, 1, 0.28, 40), M.ossicle, { name: 'Estrep (platina)' });
  fp.rotation.z = Math.PI / 2; fp.scale.set(0.62, 1, 1.45); fp.position.copy(FP); mi.add(fp);
  // Finestra oval: marc ossi a la paret lateral del vestíbul
  const ow = mesh(new THREE.TorusGeometry(1, 0.13, 10, 48), M.window, { name: 'Finestra oval' });
  ow.rotation.y = Math.PI / 2; ow.scale.set(1.75, 0.95, 1); ow.position.set(-6.88, 0.9, -0.2); mi.add(ow);

  // Vestíbul (utricle i sàcul a dins)
  const VC = V3(-9.3, 1.0, 0.0), VR = [2.2, 2.4, 2.7];
  mi.add(ellipsoid(VC, VR, M.bone, 'Vestíbul'));
  // Canals semicirculars: tres arcs en plans perpendiculars, amb ampolla
  const canal = (center, e1, e2, R, gapDir) => {
    const g = gapDir.clone().sub(center); const g1 = g.dot(e1), g2 = g.dot(e2); const th0 = Math.atan2(g2, g1);
    const pts = [];
    for (let i = 0; i <= 60; i++) { const th = th0 + 0.45 + (2 * Math.PI - 0.9) * i / 60; pts.push(center.clone().addScaledVector(e1, R * Math.cos(th)).addScaledVector(e2, R * Math.sin(th))); }
    const a = VC.clone().lerp(pts[0], 0.55), b = VC.clone().lerp(pts[pts.length - 1], 0.55);
    const m = tube([a, ...pts.filter((_, i) => i % 3 === 0), b], 0.5, M.canal, { samples: 90, k: 14, name: 'Canal semicircular' });
    mi.add(m);
    mi.add(ellipsoid(pts[3], [0.95, 0.95, 0.95], M.canal, 'Ampolla'));
    return pts;
  };
  const d45 = V3(-0.71, 0, 0.71), dPost = V3(-0.71, 0, -0.71);
  const supCanal = canal(V3(-10.4, 4.9, 0.3), d45, V3(0, 1, 0), 2.9, VC);
  canal(V3(-10.6, 2.0, -3.7), dPost, V3(0, 1, 0), 2.9, VC);
  canal(V3(-7.9, 1.4, -3.0), V3(1, 0, 0), V3(0, 0, 1), 2.5, VC);
  // Còclea: espiral de 2,6 voltes al voltant del modíol
  const ax = V3(0.5, -0.2, 0.84).normalize();
  const cu = V3(0, 1, 0).sub(ax.clone().multiplyScalar(ax.y)).normalize(), cv = ax.clone().cross(cu).normalize();
  const CB = V3(-11.2, -1.4, 3.0);
  const toVest = VC.clone().sub(CB); const th0 = Math.atan2(toVest.dot(cv), toVest.dot(cu));
  const spiralAt = t => { const th = th0 + 2 * Math.PI * 2.6 * t, rho = 4.1 - 2.9 * t; return CB.clone().addScaledVector(ax, 3.6 * t).addScaledVector(cu, rho * Math.cos(th)).addScaledVector(cv, rho * Math.sin(th)); };
  const spiral = Array.from({ length: 121 }, (_, i) => spiralAt(i / 120));
  const coch = tube([VC.clone().lerp(spiral[0], 0.45), ...spiral.filter((_, i) => i % 2 === 0)], t => 1.2 - 0.62 * t, M.cochlea, { samples: 220, k: 18, ref: ax, name: 'Còclea' });
  mi.add(coch);
  // finestra rodona (membrana) a la volta basal, mirant a l'orella mitjana
  const rw = mesh(new THREE.CircleGeometry(0.75, 28), M.round, { name: 'Finestra rodona' });
  rw.position.copy(spiralAt(0.05)).add(V3(1.15, -0.2, 0)); rw.lookAt(rw.position.clone().add(V3(1, 0, 0))); mi.add(rw);
  // Nervi vestibulococlear (VIII): branca coclear (del modíol) i vestibular, que s'uneixen cap al conducte auditiu intern
  const J = V3(-15.2, 0.6, 1.0), IAM = V3(-21.5, 0.8, 1.4);
  mi.add(tube([CB.clone().addScaledVector(ax, 0.6), V3(-13.2, -0.6, 2.0), J], 0.62, M.nerve, { samples: 30, k: 14, name: 'Nervi coclear' }));
  mi.add(tube([VC.clone().add(V3(-1.9, 0.3, 0)), V3(-13.0, 1.2, 0.3), J], 0.55, M.nerve, { samples: 30, k: 14, name: 'Nervi vestibular' }));
  const trunk = tube([J, V3(-18, 0.75, 1.2), IAM], 1.0, M.nerve, { samples: 30, k: 18, name: 'Nervi vestibulococlear' });
  mi.add(trunk);
  // Trompa d'Eustaqui: de la paret anterior de la caixa del timpà cap a la nasofaringe
  const tubeE = tube([V3(-1.6, -3.9, 2.0), V3(-4.6, -6.6, 5.2), V3(-8.2, -11.4, 7.6), V3(-12.2, -16.4, 9.8)], t => 0.95 + 0.9 * t, M.tube, { samples: 50, k: 16, name: 'Trompa d\'Eustaqui' });
  mi.add(tubeE);
  // Caixa del timpà (espai aeri), translúcida

  /* ---- Orella externa (coordenades del món) */
  const ext = new THREE.Group(); root.add(ext);
  // Conducte auditiu extern: forma de S, de la conca (lateral) al timpà; només la paret posterior (tall)
  const tmWorld = V3(0, 0, 0);
  void tmWorld;
  const canalPath = new THREE.CatmullRomCurve3([V3(25, 3.4, -1.6), V3(19, 5.0, -2.2), V3(12.5, 3.8, 0.4), V3(7.0, 1.9, 1.2), V3(2.3, 0.7, 0.5)], false, 'centripetal');
  const cPts = canalPath.getSpacedPoints(70); const cFr = framesAlong(cPts, V3(0, 0, 1));
  const rCanal = t => 3.6 - 0.4 * t + 3.2 * Math.max(0, (t - 0.72) / 0.28) ** 2; // s'eixampla fins al marc del timpà ampliat
  const halfPipe = i => { const t = i / (cPts.length - 1), ri = rCanal(t), ro = ri + 1.8, sec = [];
    for (let j = 0; j <= 16; j++) { const th = Math.PI / 2 + Math.PI * j / 16; sec.push([ro * Math.cos(th), ro * Math.sin(th)]); }
    for (let j = 16; j >= 0; j--) { const th = Math.PI / 2 + Math.PI * j / 16; sec.push([ri * Math.cos(th), ri * Math.sin(th)]); }
    return sec; };
  const canalMesh = mesh(sweep(cPts, cFr, halfPipe, { closeEnds: false }), M.skinIn, { name: 'Conducte auditiu extern' });
  ext.add(canalMesh);

  // Pavelló auricular: làmina amb hèlix, antihèlix, tragus, antitragus i lòbul
  const AUR = 0.62;
  const nA = V3(1, 0.05, 0.42).normalize(), tA = V3(0, 1, 0).sub(nA.clone().multiplyScalar(nA.y)).normalize(), sA = tA.clone().cross(nA).normalize();
  if (sA.z < 0) sA.negate();
  const O = V3(27.2, 4.0, -0.6);
  const AP = (s, t, h = 0) => O.clone().addScaledVector(sA, s * AUR).addScaledVector(tA, t * AUR).addScaledVector(nA, h * AUR);
  const outline = [[7, 3], [7.6, -4.5], [4.5, -8.6], [-1, -10], [-3.5, -16], [-6.5, -24], [-11.5, -26.5], [-16, -22], [-19.5, -11], [-21.5, 2], [-19.5, 14], [-12.5, 23.5], [-3, 26], [3.5, 21], [5.5, 13], [4.2, 8], [6.4, 5]];
  const oCurve = new THREE.CatmullRomCurve3(outline.map(([s, t]) => V3(s, t, 0)), true, 'centripetal');
  const shape = new THREE.Shape(oCurve.getSpacedPoints(120).map(p => new THREE.Vector2(p.x, p.y)));
  const hole = new THREE.Path(); hole.absellipse(1.2, -1.2, 3.3, 3.9, 0, Math.PI * 2, false, 0); shape.holes.push(hole);
  const plateGeo = new THREE.ExtrudeGeometry(shape, { depth: 2.6, bevelEnabled: true, bevelThickness: 1.2, bevelSize: 1.1, bevelSegments: 4, curveSegments: 48 });
  plateGeo.translate(0, 0, -1.3);
  const basis = new THREE.Matrix4().makeBasis(sA, tA, nA).scale(V3(AUR, AUR, AUR)).setPosition(O);
  plateGeo.applyMatrix4(basis); plateGeo.computeVertexNormals();
  ext.add(mesh(plateGeo, M.skin, { name: 'Pavelló auricular' }));
  const ridge = (pts, r, name) => { const m = tube(pts.map(([s, t, h]) => AP(s, t, h)), r * AUR, M.skin, { samples: 80, k: 16, name }); ext.add(m); return m; };
  const helix = ridge([[5.6, 11.5, 2.0], [4.4, 18.5, 2.4], [-1.5, 24.4, 2.6], [-10, 22.6, 2.6], [-17.2, 13.5, 2.6], [-19.6, 2, 2.6], [-17.8, -9.5, 2.4], [-15.5, -17.5, 2.2]], 2.3, 'Hèlix');
  ridge([[-4.5, -7.2, 1.6], [-9.2, 1.5, 2.0], [-11.4, 9.5, 2.1], [-8.6, 17.4, 2.0]], 1.7, 'Antihèlix');
  ridge([[-11.4, 9.5, 2.0], [-6, 13.6, 1.9], [0.6, 13.4, 1.6]], 1.25, 'Antihèlix (branca inferior)');
  ridge([[4.6, 10.2, 1.4], [1.5, 7.2, 1.1], [-2.5, 5.6, 0.9]], 1.0, 'Arrel de l\'hèlix');
  const bump = (s, t, h, r, name) => { const e = ellipsoid(AP(s, t, h), r.map(x => x * AUR), M.skin, name); e.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(sA, tA, nA)); ext.add(e); };
  bump(6.1, -1.6, 2.0, [2.4, 4.2, 2.0], 'Tragus'); bump(-3.6, -8.4, 1.8, [2.8, 2.1, 1.7], 'Antitragus'); bump(-10.2, -20.5, 0.4, [6.4, 5.6, 2.4], 'Lòbul');

  /* ---- Ancoratges */
  anchorIn(ext, 'oid-pavello', helix.userData.points[Math.round(helix.userData.points.length * 0.42)].clone().addScaledVector(nA, 2.3 * AUR));
  anchorIn(ext, 'oid-conducte', (() => { const i = Math.round(cPts.length * 0.45), r = rCanal(0.45); return cPts[i].clone().addScaledVector(cFr[i].u, -r * 0.35).addScaledVector(cFr[i].v, -r * 0.94); })());
  anchorIn(mi, 'oid-timpa', tmPoint(0.62, -Math.PI * 0.62).addScaledVector(nTM, 0.12));
  anchorIn(mi, 'oid-martell', mHead.clone().add(V3(0.15, 0.45, 1.12)));
  anchorIn(mi, 'oid-enclusa', V3(-2.84, 2.6, -0.62).add(V3(0.15, 0, 0.5))); // apòfisi llarga, cara anterior
  anchorIn(mi, 'oid-estrep', V3(-5.3, 1.0, 0.95).add(V3(0, 0.18, 0.1)));
  anchorIn(mi, 'oid-oval', V3(-6.78, 0.9 + 1.08 * Math.sin(-Math.PI / 3), -0.2 + 1.88 * Math.cos(-Math.PI / 3))); // vora anteroinferior del marc
  anchorIn(mi, 'oid-eustaqui', (() => { const P_ = tubeE.userData.points, i = Math.round((P_.length - 1) * 0.55); return P_[i].clone().addScaledVector(tubeE.userData.frames[i].u, 0.95 + 0.9 * 0.55 + 0.05); })());
  anchorIn(mi, 'oid-vestibul', VC.clone().add(V3(0.61 * VR[0], 0.71 * VR[1], 0.35 * VR[2]).multiplyScalar(1.03))); // cara superolateral, visible entre l'estrep i els canals
  anchorIn(mi, 'oid-canals', supCanal[30].clone().add(V3(0, 0.5, 0)));
  anchorIn(mi, 'oid-coclea', (() => { const p = spiralAt(0.18); return p.add(p.clone().sub(CB).sub(ax.clone().multiplyScalar(ax.dot(p.clone().sub(CB)))).normalize().multiplyScalar(1.15)); })());
  anchorIn(mi, 'oid-nervi', trunk.userData.curve.getPoint(0.55).add(V3(0, 1.0, 0)));

  return { root, anchors, camera: { pos: V3(34, 30, 104), target: V3(1, -1, 2) }, bounds: 70, fitScale: 0.8 };
}

/* ================================================================== catàleg */
export const MODELS = {
  ull: {
    title: 'Ull dret · secció horitzontal',
    build: buildEye,
    targets: [
      { id: 'ull-cornia', name: 'Còrnia' },
      { id: 'ull-esclerotica', name: 'Escleròtica' },
      { id: 'ull-coroide', name: 'Coroide' },
      { id: 'ull-retina', name: 'Retina' },
      { id: 'ull-iris', name: 'Iris' },
      { id: 'ull-pupilla', name: 'Pupil·la' },
      { id: 'ull-cristalli', name: 'Cristal·lí' },
      { id: 'ull-ciliar', name: 'Cos ciliar' },
      { id: 'ull-aquos', name: 'Humor aquós' },
      { id: 'ull-vitri', name: 'Humor vitri' },
      { id: 'ull-macula', name: 'Màcula i fòvea' },
      { id: 'ull-disc', name: 'Disc òptic' },
      { id: 'ull-nervi', name: 'Nervi òptic' },
      { id: 'ull-muscul', name: 'Múscul extraocular' },
    ],
  },
  oid: {
    title: 'Orella dreta · tall coronal',
    build: buildEar,
    targets: [
      { id: 'oid-pavello', name: 'Pavelló auricular' },
      { id: 'oid-conducte', name: 'Conducte auditiu extern' },
      { id: 'oid-timpa', name: 'Timpà' },
      { id: 'oid-martell', name: 'Martell' },
      { id: 'oid-enclusa', name: 'Enclusa' },
      { id: 'oid-estrep', name: 'Estrep' },
      { id: 'oid-oval', name: 'Finestra oval' },
      { id: 'oid-eustaqui', name: 'Trompa d\'Eustaqui' },
      { id: 'oid-vestibul', name: 'Vestíbul' },
      { id: 'oid-canals', name: 'Canals semicirculars' },
      { id: 'oid-coclea', name: 'Còclea' },
      { id: 'oid-nervi', name: 'Nervi vestibulococlear' },
    ],
  },
};

/** Construeix el model (sense renderitzar): útil per a proves en Node. */
export function buildModel(kind) {
  const m = MODELS[kind].build();
  m.root.updateMatrixWorld(true);
  return m;
}

/** Posició al món d'un ancoratge. */
export function anchorWorld(model, id) {
  return model.anchors[id].getWorldPosition(new THREE.Vector3());
}

/* ================================================================== visor */
/**
 * Munta el visor 3D dins `host`. Retorna null si no hi ha WebGL.
 * API: project(id) → {x, y, hidden} en píxels del host · zoomBy(f) · reset() · focusOn(id) · onFrame(fn) · dispose()
 */
export function mountViewer(host, kind, { reducedMotion = false, fitWidth = 1, fitHeight = 1 } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  } catch { return null; }
  if (!renderer.getContext()) return null;
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.localClippingEnabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  host.append(renderer.domElement);
  renderer.domElement.className = 'gl';

  const scene = new THREE.Scene();
  const model = buildModel(kind);
  scene.add(model.root);
  scene.add(new THREE.HemisphereLight(0xfff6e8, 0x6d6480, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 1.9); key.position.set(30, 60, 50); scene.add(key);
  const rim = new THREE.DirectionalLight(0xc8d8ff, 0.7); rim.position.set(-50, 20, -40); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffffff, 0.45); fill.position.set(-20, -40, 30); scene.add(fill);

  const camera = new THREE.PerspectiveCamera(30, 1, 1, 1000);
  // Encaix: esfera envolupant del model, vista des de la direcció de càmera de la làmina
  const sphere = new THREE.Box3().setFromObject(model.root).getBoundingSphere(new THREE.Sphere());
  const viewDir = model.camera.pos.clone().sub(model.camera.target).normalize();
  const home = { pos: model.camera.pos.clone(), target: sphere.center.clone().lerp(model.camera.target, 0.5) };
  let touched = false;
  camera.position.copy(home.pos);
  let controls = null;
  const ready = import('./vendor/OrbitControls.js').then(({ OrbitControls }) => {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(model.camera.target);
    controls.enableDamping = !reducedMotion; controls.dampingFactor = 0.12;
    controls.enablePan = false; controls.rotateSpeed = 0.8;
    controls.minDistance = model.bounds * 0.45; controls.maxDistance = model.bounds * 4;
    controls.target.copy(home.target); controls.update();
    controls.addEventListener('start', () => { touched = true; anim = null; });
  });
  camera.lookAt(home.target);

  const occluders = []; model.root.traverse(o => { if (o.isMesh && o.userData.occluder) occluders.push(o); });
  const ray = new THREE.Raycaster();
  const hiddenCache = {}; let frame = 0;
  const tmp = new THREE.Vector3();
  let w = 1, h = 1;
  function resize() {
    const r = host.getBoundingClientRect(); w = Math.max(1, r.width); h = Math.max(1, r.height);
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // distància perquè l'esfera càpiga a la part útil (fitWidth × amplada, fitHeight × alçada)
    const vf = camera.fov * DEG / 2, hf = Math.atan(Math.tan(vf) * camera.aspect * fitWidth);
    const rad = sphere.radius * (model.fitScale || 0.86); // l'esfera sobreestima: el model no n'omple els extrems
    const d = Math.max(rad / Math.sin(Math.atan(Math.tan(vf) * fitHeight)), rad / Math.sin(hf));
    home.pos.copy(home.target).addScaledVector(viewDir, d);
    if (!touched) { camera.position.copy(home.pos); controls?.target.copy(home.target); camera.lookAt(home.target); }
    wake();
  }
  const listeners = new Set();
  let anim = null, raf = 0, alive = true;
  let settle = 30;
  const wake = (n = 30) => { settle = Math.max(settle, n); };
  const ro = new ResizeObserver(resize); ro.observe(host); resize();
  function project(id) {
    const p = anchorWorld(model, id);
    if (frame % 3 === 0 || hiddenCache[id] === undefined) {
      const dir = p.clone().sub(camera.position); const dist = dir.length(); dir.normalize();
      ray.set(camera.position, dir); ray.far = dist - 0.35;
      const hit = ray.intersectObjects(occluders, false).find(x => x.distance < dist - 0.35 && isVisibleHit(x));
      hiddenCache[id] = !!hit;
    }
    tmp.copy(p).project(camera);
    return { x: (tmp.x + 1) / 2 * w, y: (1 - tmp.y) / 2 * h, hidden: hiddenCache[id], behind: tmp.z > 1 };
  }
  // ignora la part retallada d'una malla (y > 0 al món) a l'ull
  const isVisibleHit = x => !(x.object.material.clippingPlanes && x.point.y > 0.01);
  // Renderitzat sota demanda: només es dibuixa quan alguna cosa canvia (gir, zoom, animació, mida)
  // i uns quants fotogrames després, perquè els forats acabin de lliscar al seu lloc.
  function loop() {
    if (!alive) return;
    raf = requestAnimationFrame(loop);
    if (anim) {
      const t = Math.min(1, (performance.now() - anim.t0) / anim.ms), e = 1 - Math.pow(1 - t, 3);
      camera.position.lerpVectors(anim.from, anim.to, e);
      if (controls) controls.target.lerpVectors(anim.tFrom, anim.tTo, e);
      if (t >= 1) anim = null;
      wake(20);
    }
    if (controls?.update()) wake(20);
    if (settle <= 0) return;
    settle--; frame++;
    if (!controls) camera.lookAt(home.target);
    renderer.render(scene, camera);
    listeners.forEach(fn => fn());
  }
  loop();
  ready.then(() => { controls.addEventListener('change', () => wake(20)); wake(); });
  function flyTo(pos, target, ms = 700) {
    if (reducedMotion) { camera.position.copy(pos); controls?.target.copy(target); return; }
    anim = { t0: performance.now(), ms, from: camera.position.clone(), to: pos, tFrom: (controls?.target || home.target).clone(), tTo: target };
  }
  return {
    ready, camera, model, canvas: renderer.domElement,
    project,
    zoomBy(f) {
      const t = controls?.target || home.target, d = camera.position.clone().sub(t);
      touched = true;
      const len = Math.min(model.bounds * 4, Math.max(model.bounds * 0.45, d.length() * f));
      flyTo(t.clone().add(d.setLength(len)), t.clone(), 300);
    },
    reset() { touched = false; flyTo(home.pos.clone(), home.target.clone()); },
    /** Gira la càmera perquè el punt quedi de cara, sense canviar la distància. */
    focusOn(id) {
      touched = true;
      const p = anchorWorld(model, id), t = controls?.target || home.target;
      const d = camera.position.distanceTo(t);
      const dir = p.clone().sub(t); dir.y = Math.max(dir.y, 0) + d * 0.15;
      const view = camera.position.clone().sub(t).normalize().lerp(dir.normalize(), 0.5).normalize();
      flyTo(t.clone().add(view.multiplyScalar(d)), t.clone());
    },
    onFrame(fn) { listeners.add(fn); wake(); return () => listeners.delete(fn); },
    wake,
    snapshot() { return renderer.domElement.toDataURL('image/png'); },
    dispose() {
      alive = false; cancelAnimationFrame(raf); ro.disconnect(); controls?.dispose();
      model.root.traverse(o => { if (o.isMesh || o.isLineSegments) { o.geometry.dispose(); const m = o.material; (Array.isArray(m) ? m : [m]).forEach(x => { x.map?.dispose(); x.dispose(); }); } });
      renderer.dispose(); renderer.domElement.remove();
    },
  };
}
