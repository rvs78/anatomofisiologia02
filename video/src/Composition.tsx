import React from "react";
import {
  AbsoluteFill,
  Composition,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import meta from "../public/meta.json";

// Tutorial «Com es juga» de Sentits Quest · U4. Les imatges són captures reals del joc
// (tools/captures_video.py); les coordenades del cromo, el forat i el punt surten de meta.json.

const C = { cover: "#22194d", paper: "#fffdf8", ink: "#1b1533", ull: "#0b7a83", foil: "#ffd86b", foilDeep: "#b88a00" };
const DISPLAY = "BigShoulders, 'Arial Narrow', sans-serif";
const FONTS = `
@font-face { font-family: BigShoulders; font-weight: 900; src: url(${staticFile("fonts/big-shoulders-display-latin-900-normal.woff2")}) format('woff2'); }
@font-face { font-family: Atkinson; font-weight: 700; src: url(${staticFile("fonts/atkinson-hyperlegible-latin-700-normal.woff2")}) format('woff2'); }
`;
type B = { x: number; y: number; w: number; h: number };
const mid = (b: B) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.16, 1, 0.3, 1);

const chipA = mid(meta.chipA), slotA = mid(meta.slotA), chipC = mid(meta.chipC), dotC = mid(meta.dotC), slotC = mid(meta.slotC);
const rot = meta.rot;

/** Interpola un punt per trams [fotograma, x, y]. */
const path = (f: number, keys: [number, number, number][]) => ({
  x: interpolate(f, keys.map((k) => k[0]), keys.map((k) => k[1]), { ...clamp, easing: ease }),
  y: interpolate(f, keys.map((k) => k[0]), keys.map((k) => k[2]), { ...clamp, easing: ease }),
});

const Shot: React.FC<{ src: string; from: number; to?: number }> = ({ src, from, to }) => {
  const f = useCurrentFrame();
  return (
    <Img
      src={staticFile(src)}
      style={{
        position: "absolute", inset: 0, width: 1280, height: 720,
        opacity: interpolate(f, to ? [from, from + 10, to, to + 10] : [from, from + 10], to ? [0, 1, 1, 0] : [0, 1], clamp),
      }}
    />
  );
};

const Cursor: React.FC<{ x: number; y: number; down: boolean }> = ({ x, y, down }) => (
  <svg width="34" height="40" viewBox="0 0 24 28" style={{ position: "absolute", left: x - 4, top: y - 2, scale: down ? "0.88" : "1", filter: "drop-shadow(0 3px 4px rgb(0 0 0 / .45))" }}>
    <path d="M3 2 L3 22 L8.5 17 L12 25.5 L15.5 24 L12 15.8 L19.5 15.8 Z" fill="#fff" stroke={C.ink} strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

const Card: React.FC<{ x: number; y: number; label: string; tilt: number }> = ({ x, y, label, tilt }) => (
  <div style={{
    position: "absolute", left: x, top: y, translate: "-50% -50%", rotate: `${tilt}deg`,
    display: "flex", alignItems: "center", gap: 9, padding: "10px 16px 10px 13px", borderRadius: 10,
    background: C.paper, color: C.ink, fontFamily: DISPLAY, fontWeight: 900, fontSize: 22, whiteSpace: "nowrap",
    boxShadow: `inset 0 0 0 3px ${C.ull}, inset 0 0 0 5px #fff, 0 18px 30px -10px rgb(0 0 0 / .65)`,
  }}>
    <span style={{ width: 13, height: 13, borderRadius: 99, background: C.ull, boxShadow: `0 0 0 2.5px #fff, 0 0 0 4px ${C.ull}` }} />
    {label}
  </div>
);

const Plus: React.FC<{ at: { x: number; y: number }; from: number }> = ({ at, from }) => {
  const f = useCurrentFrame();
  return (
    <div style={{
      position: "absolute", left: at.x, top: at.y, fontFamily: DISPLAY, fontWeight: 900, fontSize: 44, color: C.foil,
      WebkitTextStroke: `2px ${C.ink}`, paintOrder: "stroke fill", textShadow: `0 3px 0 ${C.ink}`,
      opacity: interpolate(f, [from, from + 6, from + 26, from + 34], [0, 1, 1, 0], clamp),
      translate: interpolate(f, [from, from + 34], ["-50% -20%", "-50% -170%"], { ...clamp, easing: ease }),
    }}>+10</div>
  );
};

const Ring: React.FC<{ at: { x: number; y: number }; from: number; color?: string }> = ({ at, from, color = C.foilDeep }) => {
  const f = useCurrentFrame();
  return (
    <div style={{
      position: "absolute", left: at.x, top: at.y, width: 44, height: 44, translate: "-50% -50%", borderRadius: 99,
      border: `4px solid ${color}`,
      opacity: interpolate(f, [from, from + 4, from + 18], [0, 1, 0], clamp),
      scale: interpolate(f, [from, from + 18], [0.5, 1.6], clamp),
    }} />
  );
};

const Caption: React.FC<{ from: number; to: number; n: string; text: string }> = ({ from, to, n, text }) => {
  const f = useCurrentFrame();
  return (
    <div style={{
      position: "absolute", left: 40, top: 140, display: "flex", alignItems: "center", gap: 14,
      padding: "12px 22px 12px 14px", borderRadius: 16, background: C.cover, color: "#fff",
      fontFamily: DISPLAY, fontWeight: 900, fontSize: 34, boxShadow: `0 0 0 4px ${C.foil}, 0 20px 40px -14px #000`,
      opacity: interpolate(f, [from, from + 8, to - 8, to], [0, 1, 1, 0], clamp),
      translate: interpolate(f, [from, from + 12], ["0px -30px", "0px 0px"], { ...clamp, easing: ease }),
    }}>
      <span style={{ display: "grid", placeItems: "center", width: 46, height: 46, borderRadius: 12, background: C.foil, color: C.ink }}>{n}</span>
      {text}
    </div>
  );
};

export const ComEsJuga: React.FC = () => {
  const f = useCurrentFrame();
  // Escena 1 · arrossegar (0–150)
  const p1 = path(f, [[0, 1000, 640], [36, chipA.x, chipA.y], [48, chipA.x, chipA.y], [100, slotA.x, slotA.y], [125, slotA.x + 60, slotA.y + 50]]);
  // Escena 2 · girar (150–255)
  const p2 = path(f, [[150, slotA.x + 60, slotA.y + 50], [172, rot.x0, rot.y0], [182, rot.x0, rot.y0], [222, rot.x1, rot.y1], [245, rot.x1 + 30, rot.y1 + 40]]);
  // Escena 3 · tocar i col·locar (255–385)
  const p3 = path(f, [[255, rot.x1 + 30, rot.y1 + 40], [282, chipC.x, chipC.y], [298, chipC.x, chipC.y], [330, dotC.x, dotC.y], [370, dotC.x + 70, dotC.y + 60]]);
  const cur = f < 150 ? p1 : f < 255 ? p2 : p3;
  const down = (f >= 44 && f < 100) || (f >= 180 && f < 222) || (f >= 286 && f < 291) || (f >= 332 && f < 337);
  const drag = f >= 48 && f < 100;
  const end = interpolate(f, [385, 395], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: C.cover, fontFamily: "Atkinson, sans-serif" }}>
      <style>{FONTS}</style>
      <Shot src="a.png" from={-10} to={100} />
      <Shot src="b.png" from={100} to={192} />
      <Shot src="c.png" from={192} to={288} />
      <Shot src="c_sel.png" from={288} to={334} />
      <Shot src="d.png" from={334} />
      {drag && <Card x={cur.x + 10} y={cur.y + 6} label="Còrnia" tilt={interpolate(f, [48, 74, 100], [-6, 4, 0], clamp)} />}
      {f >= 100 && f < 140 && <Ring at={slotA} from={100} color={C.ull} />}
      <Plus at={slotA} from={102} />
      {f >= 334 && f < 360 && <Ring at={dotC} from={334} color={C.ull} />}
      <Plus at={slotC} from={338} />
      <Cursor x={cur.x} y={cur.y} down={down} />
      <Caption from={4} to={146} n="1" text="Arrossega el cromo fins al seu forat" />
      <Caption from={150} to={252} n="2" text="Arrossega el fons per girar el model" />
      <Caption from={255} to={385} n="3" text="O toca el cromo i després el punt" />
      <AbsoluteFill style={{ background: `rgb(19 13 46 / ${0.88 * end})`, display: "grid", placeContent: "center", gap: 18, opacity: end }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 64, color: "#fff", textAlign: "center" }}>Encert <span style={{ color: C.foil }}>+10</span> · Error −3 · Pista −5</div>
        <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 40, color: C.foil, textAlign: "center", scale: interpolate(f, [392, 402], [0.6, 1], { ...clamp, easing: ease }) }}>Tres encerts seguits: +15</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const MyComposition: React.FC = () => (
  <Composition id="ComEsJuga" component={ComEsJuga} durationInFrames={420} fps={30} width={1280} height={720} />
);
