# Sentits Quest · U4 — pla d'implementació

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Passos amb caselles (`- [ ]`).

**Goal:** Joc web per a MP0061 Anatomofisiologia i Patologia Bàsiques (CFGM Farmàcia i Parafarmàcia, FAR 1L) sobre la Unitat 4, amb la mateixa estructura, puntuació, ajuda i informe que Vascular Quest (https://rvs78.github.io/anatomia02/).

**Architecture:** Còpia de l'arquitectura de Vascular Quest: `game.js` (render per fases), `logic.js` (pur), `data.js` (contingut), `fx.js` (moviment i so, sense canvis). La làmina 2D se substitueix per `models.js`: dos models 3D (three.js r170, servit des de `vendor/`) amb els punts d'ancoratge calculats a partir dels mateixos paràmetres que generen la geometria.

**Tech Stack:** HTML/CSS/JS ES Modules + import map; three.js r170 (local); Web Audio; Web Animations; Remotion 4 (només build del vídeo); Node 22; Playwright.

**Font del contingut:** Canva «Unitat 4 · Coordinació i sentits · Pell i mucoses · Revisió ampliada» (`DAHYwytIVFU`): diapositives 1–6 (coordinació, efectors, estímuls), 7–18 (vista), 19–27 (oïda) i taules de patologies de vista i oïda.

## Recorregut

| Fase | Què es fa | Abast |
| --- | --- | --- |
| 1 · Models 3D | Arrossegar cada nom al seu forat o al seu punt sobre el model que es pot girar i ampliar | Ull: 2 nivells + repte (14 estructures). Orella: 2 nivells + repte (12 estructures) |
| 2 · Test | 20 preguntes d'una resposta correcta (4 opcions), triades a l'atzar d'un banc estratificat: 4 coordinació i estímuls + 8 vista + 8 oïda | Anatomia i fisiologia bàsica |
| 3 · Text de patologies | Textos amb buits; cada buit té un desplegable de 3 opcions | Patologies de vista i oïda |
| Informe | Punts per fase, estrelles i temps per nivell, llista de repàs; PDF per al lliurament a Classroom | — |

**Puntuació** (idèntica): +10 encert · −3 error · −5 pista · +15 cada 3 seguits · mínim 0.

## Global Constraints

- Interfície en català. Tokens visuals de l'àlbum (coberta `#22194d`, pàgina `#f2b42c`, daurat `#ffd86b`); el color de sistema passa a ull (`--ull`) i orella (`--oid`), sempre acompanyat de text.
- L'anatomia mana: cada punt és un vèrtex o centre derivat de la geometria del model, mai una coordenada posada a mà sobre la pantalla.
- Cap número ni ordre visual relaciona un nom amb el seu forat.
- Els forats es recol·loquen a cada fotograma a dues columnes, ordenats per l'alçada projectada del punt; un punt amagat darrere del model es marca com a ocult però continua jugable.
- `prefers-reduced-motion`: sense vols ni gir automàtic.
- Sense recursos externs en execució (tipografies i three.js locals).
- Persistència: `localStorage['far-u4-sentits-v1']`.

## Review Focus

1. Girar el model mentre un cromo vola → un sol intent, sense errors.
2. Dos punts molt propers (estrep i finestra oval) → resol al punt actiu més proper.
3. WebGL no disponible → missatge clar, sense pantalla en blanc.
4. Recarregar a mig nivell, a mig test o a mig text → l'estat es recupera sense tornar a sortejar.
5. Mòbil 390 px → model, forats i munt sense scroll horitzontal.

---

### Task 1: Models 3D (`models.js`)
- [ ] Ull: secció de 3/4 al voltant de l'eix òptic (escleròtica, coroide, retina, còrnia, iris i pupil·la, cristal·lí, cos ciliar, humor aquós, humor vitri, màcula/fòvea, disc òptic, nervi òptic, músculs extraoculars).
- [ ] Orella: pavelló, conducte auditiu extern, timpà, martell, enclusa, estrep, finestra oval, trompa d'Eustaqui, vestíbul, canals semicirculars, còclea (2,5 voltes), nervi vestibulococlear.
- [ ] `mountModel(el, kind)` → `{ anchors: [{id,name,pos}], project(id), occluded(id), onFrame(fn), dispose() }`.
- [ ] Prova: cada ancoratge és dins la caixa del model i a sobre de la seva malla (raig des de fora).

### Task 2: Fase 1 (`game.js`)
- [ ] Mateixa mecànica que l'atles: arrossegar, tocar i col·locar, teclat, pista (forat daurat + gir automàtic cap al punt), estrelles i temps.
- [ ] Forats i línies guia en una capa HTML/SVG sobre el canvas.

### Task 3: Fase 2 i 3 (`data.js`, `game.js`)
- [ ] Banc ≥ 36 preguntes `[enunciat, [4 opcions], correcta, explicació, bloc]`.
- [ ] Textos de patologies: buits `{ok, opts:[3], why, clue}`; desplegable; error mostra la correcta; pista −5 mostra la pista del buit.

### Task 4: Informe i vídeo
- [ ] Informe igual que la referència; botó PDF (impressió) i enllaç a Classroom.
- [ ] Vídeo «Com es juga» amb Remotion a partir de captures reals del model.

### Task 5: Verificació
- [ ] `node tests/check.mjs`, `python3 tests/e2e.py`, captures a 1366, 1024 i 390 px; revisió anatòmica de les captures.
