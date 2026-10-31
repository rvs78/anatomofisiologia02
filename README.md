# Sentits Quest · Anatomofisiologia U4

Aplicació web en català per al CFGM de Farmàcia i Parafarmàcia (MP0061 Anatomofisiologia i Patologia Bàsiques, grup FAR 1L). L'alumnat identifica les estructures de l'**ull** i de l'**orella** sobre dos **models 3D** que pot girar i ampliar, respon un test d'anatomia i completa textos sobre les patologies de la vista i l'oïda.

Mateixa estructura, puntuació, ajuda i informe que [Vascular Quest · RA2](https://rvs78.github.io/anatomia02/) (àlbum de cromos).

## Recorregut

| Fase | Què es fa | Abast |
| --- | --- | --- |
| **1 · Models 3D** | Arrossegar (o tocar i col·locar) cada nom al seu forat o al seu punt sobre el model | Ull: 2 nivells + repte (14 estructures). Orella: 2 nivells + repte (12 estructures) |
| **2 · Test** | 20 preguntes d'una sola resposta correcta, explicació després de cada resposta | 4 de coordinació i estímuls + 8 de vista + 8 d'oïda, triades d'un banc de 44 |
| **3 · Patologies** | 4 textos amb 30 buits; cada buit té un desplegable amb 3 opcions | Defectes de refracció, cataracta/glaucoma i altres, trastorns de l'audició, vertigen i farmàcia |
| **Informe** | Punts per fase, estrelles i temps per nivell, llista de repàs; PDF des del navegador | Lliurament a la tasca de Google Classroom |

**Puntuació:** +10 encert · −3 error · −5 pista · +15 per cada 3 encerts seguits. La puntuació no baixa de 0.

**Font del contingut:** Canva «Unitat 4 · Coordinació i sentits · Pell i mucoses · Revisió ampliada» (diapositives 1–27 i taules de patologies de vista i oïda).

## Els models 3D

`models.js` construeix els dos models amb three.js (r170, servit des de `vendor/`) a partir de mesures anatòmiques en mil·límetres:

- **Ull dret, secció horitzontal** pel meridià de la fòvea i del disc òptic, vist des de dalt: còrnia, escleròtica, coroide, retina, cos ciliar amb fibres zonulars, iris i pupil·la, cristal·lí biconvex, humor aquós i vitri, màcula amb fòvea (temporal), disc òptic amb els vasos centrals (nasal), nervi òptic i músculs rectes lateral, medial i inferior.
- **Orella dreta, tall coronal**: pavelló auricular, conducte auditiu extern en S (paret posterior), timpà cònic amb l'umbó, martell, enclusa i estrep articulats fins a la finestra oval, vestíbul, tres canals semicirculars amb ampolla, còclea de 2,6 voltes amb finestra rodona, nervi vestibulococlear (branques coclear i vestibular) i trompa d'Eustaqui. L'orella mitjana i la interna estan ampliades ×1,6 respecte de l'externa, com a les làmines didàctiques.

Cada punt de joc es calcula amb els mateixos paràmetres que generen la malla (no hi ha coordenades posades a mà). `tests/check.mjs` comprova que cada punt toca la seva geometria, que tots es veuen a la vista inicial i que es compleixen les relacions anatòmiques (disc nasal a la màcula, ordre lateral → medial de l'orella, trompa anterior i inferior…).

## Desenvolupament

```bash
npm i                              # només per a les proves (three a node_modules)
python3 -m http.server 8000        # obre http://localhost:8000
node tests/check.mjs               # 454 comprovacions de dades, models i puntuació
python3 tests/e2e.py http://localhost:8000/ shots   # partida completa amb Playwright i captures
python3 tools/portades.py          # regenera assets/portada_*.webp des dels models
python3 tools/captures_video.py    # captures reals del joc per al vídeo
cd video && npm i && REMOTION_CHROME=/usr/bin/google-chrome npm run render   # vídeo «Com es juga» (Remotion)
```

Accés: correu `@isvh.cat` i contrasenya d'aula (`alumnesfar`, a `game.js`). És una barrera d'entrada, no una autenticació. El progrés es desa al `localStorage` del navegador.
