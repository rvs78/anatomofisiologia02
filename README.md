# Sentits Quest · Anatomofisiologia U4

Aplicació web en català per al CFGM de Farmàcia i Parafarmàcia (MP0061 Anatomofisiologia i Patologia Bàsiques, grup FAR 1L). L'alumnat identifica les estructures de l'**ull** i de l'**orella** sobre dos **models 3D** que pot girar i ampliar, respon un test d'anatomia i completa textos sobre les patologies de la vista i l'oïda.

Mateixa estructura, puntuació, ajuda i informe que [Vascular Quest · RA2](https://rvs78.github.io/anatomia02/) (àlbum de cromos).

**Accés:** https://rvs78.github.io/anatomofisiologia02/

**Idioma:** a la pantalla inicial l'alumne tria **Català** o **Castellano** (amb bandera). Es pot canviar en qualsevol moment amb la bandera de la capçalera sense perdre el progrés: tota la interfície, els noms de les estructures, el test, els textos de patologies, el vídeo i l'informe estan en les dues llengües, amb el mateix ordre de preguntes i buits.

## Recorregut

| Fase | Què es fa | Abast |
| --- | --- | --- |
| **1 · Models 3D** | Arrossegar (o tocar i col·locar) cada nom al seu forat o al seu punt sobre el model | Ull: 2 nivells + repte (14 estructures). Orella: 2 nivells + repte (12 estructures) |
| **2 · Test** | 20 preguntes d'una sola resposta correcta, explicació després de cada resposta | 4 de coordinació i estímuls + 8 de vista + 8 d'oïda, triades d'un banc de 44 |
| **3 · Patologies** | 4 textos amb 30 buits; cada buit té un desplegable amb 3 opcions | Defectes de refracció, cataracta/glaucoma i altres, trastorns de l'audició, vertigen i farmàcia |
| **Informe** | **Nota de 1 a 10**, nota de cada fase, estrelles i temps per nivell, llista de repàs; PDF des del navegador | Lliurament a la tasca de Google Classroom |

**Puntuació del joc:** +10 encert · −3 error · −5 pista · +15 per cada 3 encerts seguits. La puntuació no baixa de 0. És la motivació durant la partida; la qualificació és la nota.

**Nota (1–10):** `Nota = 1 + 9 × (0,4 × models 3D + 0,3 × test + 0,3 × patologies)`, amb un decimal.

| Fase | Encert (0 a 1) |
| --- | --- |
| Models 3D (40 %) | estructures ÷ (estructures + errors + ½ pistes); 53 estructures en total |
| Test (30 %) | encerts ÷ 20 |
| Patologies (30 %) | (encerts − ½ encerts amb pista) ÷ 30 |

Tot correcte sense pistes = 10; res correcte = 1. Si un ordinador no té WebGL i se salta la fase 3D, test i patologies pesen el 50 % cadascun i l'informe ho indica. Qualificació: < 5 Insuficient · 5 Suficient · 6 Bé · 7–8,9 Notable · ≥ 9 Excel·lent. La fórmula surt imprimida al PDF.

**Font del contingut:** Canva «Unitat 4 · Coordinació i sentits · Pell i mucoses · Revisió ampliada» (diapositives 1–27 i taules de patologies de vista i oïda).

## Els models 3D

`models.js` construeix els dos models amb three.js (r170, servit des de `vendor/`) a partir de mesures anatòmiques en mil·límetres:

- **Ull dret, secció horitzontal** pel meridià de la fòvea i del disc òptic, vist des de dalt: còrnia, escleròtica, coroide, retina, cos ciliar amb fibres zonulars, iris i pupil·la, cristal·lí biconvex, humor aquós i vitri, màcula amb fòvea (temporal), disc òptic amb els vasos centrals (nasal), nervi òptic i músculs rectes lateral, medial i inferior.
- **Orella dreta, tall coronal**: pavelló auricular, conducte auditiu extern en S (paret posterior), timpà cònic amb l'umbó, martell, enclusa i estrep articulats fins a la finestra oval, vestíbul, tres canals semicirculars amb ampolla, còclea de 2,6 voltes amb finestra rodona, nervi vestibulococlear (branques coclear i vestibular) i trompa d'Eustaqui. L'orella mitjana i la interna estan ampliades ×1,6 respecte de l'externa, com a les làmines didàctiques.

Cada punt de joc es calcula amb els mateixos paràmetres que generen la malla (no hi ha coordenades posades a mà).

**Gràfics.** Il·luminació d'estudi amb entorn d'habitació (reflexos suaus als teixits humits), ombra de contacte, textura real d'iris i retinografia aplicada a la retina (alineada perquè el disc òptic i la fòvea de la imatge caiguin exactament sobre els punts del model), entrada animada de la càmera i il·luminació breu de l'estructura encertada. En equips sense acceleració gràfica (escriptoris virtuals, renderitzat per programari) el visor ho detecta i passa sol a un **mode lleuger** sense reflexos; `?q=hq` o `?q=lite` a l'adreça el forcen.

**Etiquetes.** Els forats van en dues columnes; cada etiqueta va a la columna més propera al seu punt (amb un límit segons l'alçada disponible), s'ordena per l'alçada del punt, mai se solapa amb una altra i, si dues línies veïnes es creuen, s'intercanvien. La línia guia fa colze i acaba al centre exacte del punt, marcat amb un punt blanc de precisió. Els punts que queden darrere el model es veuen discontinus.

**Imatges amb IA.** Les portades i les textures d'iris i de fons d'ull s'han generat amb OpenRouter (`google/gemini-3-pro-image`); vegeu `tools/PROMPTS_IA.md` i `tools/textures.py`. `tests/check.mjs` comprova que cada punt toca la seva geometria, que tots es veuen a la vista inicial i que es compleixen les relacions anatòmiques (disc nasal a la màcula, ordre lateral → medial de l'orella, trompa anterior i inferior…).

## Desenvolupament

```bash
npm i                              # només per a les proves (three a node_modules)
python3 -m http.server 8000        # obre http://localhost:8000
node tests/check.mjs               # 778 comprovacions: dades en 2 llengües, models, puntuació i nota
python3 tests/e2e.py http://localhost:8000/ shots ca   # partida completa (ca o es) amb Playwright, PDF i captures
python3 tools/textures.py imatges/  # portades i textures a partir de les imatges generades
python3 tools/captures_video.py http://localhost:8000/ ca   # captures reals per al vídeo (ca i es)
cd video && npm i && REMOTION_CHROME=/usr/bin/google-chrome npm run render   # vídeos «Com es juga» en català i castellà (Remotion)
```

Accés: correu `@isvh.cat` i contrasenya d'aula (`alumnesfar`, a `game.js`). És una barrera d'entrada, no una autenticació. El progrés es desa al `localStorage` del navegador.
