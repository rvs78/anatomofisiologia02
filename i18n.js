// Textos de la interfície de Sentits Quest en català (ca) i castellà (es).
// {x} es substitueix amb t('clau', {x: valor}).

export const LANGS = ['ca', 'es'];
const KEY = 'sq-lang';

export const UI = {
  ca: {
    langName: 'Català', chooseLang: 'Tria l\'idioma', brandSub: 'U4 · Vista i oïda',
    phases: ['Models 3D', 'Test', 'Patologies', 'Informe'],
    points: 'Punts', streak: 'Ratxa', streakTitle: 'Encerts seguits. Cada 3, +15 punts',
    soundOff: 'Silencia els sons', soundOn: 'Activa els sons', sound: 'So',
    logout: 'Surt i esborra el progrés', logoutTitle: 'Surt', switchLang: 'Canvia a castellà',
    logoutAsk: 'Vols sortir? Es perdrà el progrés desat en aquest navegador.', logoutYes: 'Sí, surt', cancel: 'Cancel·la',
    streakBanner: 'Ratxa de 3! +15',
    // entrada
    welcomeLead: 'Omple l\'àlbum de la vista i l\'oïda de la Unitat 4, sobre models 3D de l\'ull i de l\'orella que pots girar.',
    step1: '<b>Models 3D.</b> Enganxa cada cromo a la seva estructura, en sis pàgines.',
    step2: '<b>Test.</b> Vint preguntes d\'anatomia, amb explicació.',
    step3: '<b>Patologies.</b> Completa quatre textos triant la paraula correcta.',
    email: 'Correu de l\'institut', password: 'Contrasenya de l\'aula', open: 'Obre l\'àlbum',
    note: 'El progrés es desa en aquest navegador. Si canvies d\'ordinador o fas servir una finestra privada, començaràs de nou.',
    badEmail: 'Escriu el teu correu acabat en @isvh.cat.', badPass: 'La contrasenya no és correcta. Demana-la al professorat.',
    eye: 'Ull', ear: 'Orella', credit: 'Aplicación de Rubén Vallejo', coverCredit: 'Il·lustracions de portada generades amb IA',
    // sobres
    intro1Title: 'Fase 1 <span>Models 3D</span>', intro1Lead: 'Cada nivell és una pàgina de l\'àlbum. Enganxa cada cromo a l\'estructura de l\'ull o de l\'orella que li correspon.',
    i1a: ['Arrossega', 'Porta cada cromo fins al seu forat o fins al punt negre del model.'],
    i1b: ['Gira el model', 'Arrossega el fons blanc per girar-lo. Roda o botons + i − per apropar-lo.'],
    i1c: ['O toca i col·loca', 'Toca un cromo i després el forat. Amb teclat: Tab i Enter.'],
    intro2Title: 'Fase 2 <span>Test</span>', intro2Lead: 'Vint preguntes d\'anatomia de la coordinació, la vista i l\'oïda. Només una resposta és correcta.',
    i2a: ['Respon ràpid', 'Clica una opció o prem les tecles 1, 2, 3 o 4.'],
    i2b: ['Aprèn de l\'error', 'Després de respondre veuràs la correcta i per què.'],
    i2c: ['Ratxa', 'Tres encerts seguits sumen 15 punts extra.'],
    intro3Title: 'Fase 3 <span>Patologies</span>', intro3Lead: 'Quatre textos sobre les patologies de la vista i l\'oïda. Tria la paraula que falta a cada buit.',
    i3a: ['Tria al desplegable', 'Cada buit té tres opcions i només una és correcta.'],
    i3b: ['Un sol intent', 'En triar, es corregeix al moment. Si falles, veuràs la correcta i anirà a la llista de repàs.'],
    i3c: ['Pista', 'Et dona una pista sobre el buit marcat en daurat (−5).'],
    introScore: 'Encert +10 · Error −3 · Pista −5', start: 'Comença', videoLabel: 'Vídeo: com s\'enganxa un cromo sobre el model 3D',
    // fase 1
    page: 'Pàgina', bossMeta: 'Totes les estructures del model, sense ajudes', levelMeta: 'Gira el model per trobar cada punt',
    stuck: 'enganxats', of: 'de', pileHelp: 'Arrossega cada cromo fins al seu forat, o toca\'l i després toca el forat. Els punts buits són a l\'altra cara: gira el model per veure\'ls.',
    pileLabel: 'Cromos per enganxar', hint: 'Pista −5', emptySlot: 'Forat buit',
    zoomIn: 'Apropa el model', zoomOut: 'Allunya el model', zoomFit: 'Torna a la vista inicial', rotateHelp: 'Arrossega el fons per girar',
    hitMsg: '{n}, enganxat. +10 punts.', hitBonus: '{n}! Tres seguits: +{p} punts.', missMsg: '{n} no va en aquest forat. −3 punts.',
    pickFirst: 'Primer tria un cromo del munt.', hintPick: 'Tria primer un cromo i la pista et mostrarà on va.',
    hintMsg: 'Pista: el forat de {n} brilla en daurat. −5 punts.',
    pageDone: 'Pàgina completa', time: 'Temps', errors: 'Errors', hints: 'Pistes', nextPage: 'Passa la pàgina', startTest: 'Comença el test',
    noGlTitle: 'Aquest navegador no pot mostrar models 3D',
    noGlText: 'Cal WebGL. Prova-ho amb Chrome, Edge o Firefox actualitzats, o en un altre ordinador. Si no pots, avisa el professor i continua amb el test.',
    noGlSkip: 'Continua sense la fase 3D', stars: '{n} de 3 estrelles',
    // fase 2
    keys: 'Tecles 1–4', options: 'Opcions', blocks: { coord: 'Coordinació i estímuls', vista: 'Vista', oida: 'Oïda' },
    right: 'Correcte!', wrong: 'No és aquesta.', wrongPre: 'La bona és la marcada en verd. ',
    nextQ: 'Següent pregunta', startCloze: 'Comença les patologies',
    // fase 3
    text: 'Text', gaps: 'buits', choose: 'tria…', gapLabel: 'Buit {k} de {n}',
    clozeOk: 'Correcte! +10 punts.', clozeBonus: 'Correcte! Tres seguits: +{p}.', clozeBad: 'No és «{v}». La correcta és «{ok}». −3 punts.',
    clue: 'Pista: {c}', nextText: 'Següent text', seeReport: 'Veure l\'informe',
    // informe
    subject: 'MP0061 Anatomofisiologia i Patologia Bàsiques · CFGM Farmàcia i Parafarmàcia · FAR 1L · Unitat 4',
    done: 'Àlbum completat', totalTime: 'Temps total', no3d: '<b>Fase 3D no feta</b>: el navegador no tenia WebGL.',
    grade: 'Nota', gradeOf: 'sobre 10', levels: { insuf: 'Insuficient', suf: 'Suficient', be: 'Bé', notable: 'Notable', excel: 'Excel·lent' },
    gradeModels: 'Models 3D', gradeTest: 'Test', gradeCloze: 'Patologies',
    gradeHow: 'Nota = 1 + 9 × encert ponderat (models 3D {w1} %, test {w2} %, patologies {w3} %). Models 3D: estructures ÷ (estructures + errors + ½ pistes). Test: encerts ÷ 20. Patologies: (encerts − ½ encerts amb pista) ÷ 30.',
    pointsTile: 'Punts del joc', correctOf: 'encerts',
    pagesTitle: 'Pàgines dels models 3D', pageCol: 'Pàgina', starsCol: 'Estrelles',
    review: 'Per repassar', reviewAtlas: 'Cromos col·locats en un forat equivocat (vegades):',
    reviewQuiz: 'Preguntes del test fallades i la seva resposta:', reviewCloze: 'Buits dels textos de patologies que has fallat (resposta correcta):',
    youChose: 'havies triat', noErrors: 'Cap error en tot el recorregut.',
    deliver: 'Lliura-ho a Classroom',
    deliver1: 'Prem <b>Desa l\'informe en PDF</b> i, al diàleg d\'impressió, tria «Desa com a PDF».',
    deliver2: 'Obre la tasca de la Unitat 4 a Google Classroom i adjunta-hi el PDF.', deliver3: 'Prem <b>Lliura</b> a Classroom.',
    pdf: 'Desa l\'informe en PDF', classroom: 'Obre Google Classroom', pdfName: 'Informe U4 Sentits',
    langUsed: 'Idioma de la partida',
  },
  es: {
    langName: 'Castellano', chooseLang: 'Elige el idioma', brandSub: 'U4 · Vista y oído',
    phases: ['Modelos 3D', 'Test', 'Patologías', 'Informe'],
    points: 'Puntos', streak: 'Racha', streakTitle: 'Aciertos seguidos. Cada 3, +15 puntos',
    soundOff: 'Silencia los sonidos', soundOn: 'Activa los sonidos', sound: 'Sonido',
    logout: 'Sal y borra el progreso', logoutTitle: 'Salir', switchLang: 'Cambia a catalán',
    logoutAsk: '¿Quieres salir? Se perderá el progreso guardado en este navegador.', logoutYes: 'Sí, salir', cancel: 'Cancelar',
    streakBanner: '¡Racha de 3! +15',
    welcomeLead: 'Completa el álbum de la vista y el oído de la Unidad 4, sobre modelos 3D del ojo y del oído que puedes girar.',
    step1: '<b>Modelos 3D.</b> Pega cada cromo en su estructura, en seis páginas.',
    step2: '<b>Test.</b> Veinte preguntas de anatomía, con explicación.',
    step3: '<b>Patologías.</b> Completa cuatro textos eligiendo la palabra correcta.',
    email: 'Correo del instituto', password: 'Contraseña del aula', open: 'Abre el álbum',
    note: 'El progreso se guarda en este navegador. Si cambias de ordenador o usas una ventana privada, empezarás de nuevo.',
    badEmail: 'Escribe tu correo acabado en @isvh.cat.', badPass: 'La contraseña no es correcta. Pídesela al profesorado.',
    eye: 'Ojo', ear: 'Oído', credit: 'Aplicación de Rubén Vallejo', coverCredit: 'Ilustraciones de portada generadas con IA',
    intro1Title: 'Fase 1 <span>Modelos 3D</span>', intro1Lead: 'Cada nivel es una página del álbum. Pega cada cromo en la estructura del ojo o del oído que le corresponde.',
    i1a: ['Arrastra', 'Lleva cada cromo hasta su hueco o hasta el punto negro del modelo.'],
    i1b: ['Gira el modelo', 'Arrastra el fondo blanco para girarlo. Rueda o botones + y − para acercarlo.'],
    i1c: ['O toca y coloca', 'Toca un cromo y después el hueco. Con teclado: Tab e Intro.'],
    intro2Title: 'Fase 2 <span>Test</span>', intro2Lead: 'Veinte preguntas de anatomía de la coordinación, la vista y el oído. Solo una respuesta es correcta.',
    i2a: ['Responde rápido', 'Pulsa una opción o las teclas 1, 2, 3 o 4.'],
    i2b: ['Aprende del error', 'Después de responder verás la correcta y por qué.'],
    i2c: ['Racha', 'Tres aciertos seguidos suman 15 puntos extra.'],
    intro3Title: 'Fase 3 <span>Patologías</span>', intro3Lead: 'Cuatro textos sobre las patologías de la vista y el oído. Elige la palabra que falta en cada hueco.',
    i3a: ['Elige en el desplegable', 'Cada hueco tiene tres opciones y solo una es correcta.'],
    i3b: ['Un solo intento', 'Al elegir, se corrige al momento. Si fallas, verás la correcta y pasará a la lista de repaso.'],
    i3c: ['Pista', 'Te da una pista sobre el hueco marcado en dorado (−5).'],
    introScore: 'Acierto +10 · Error −3 · Pista −5', start: 'Empieza', videoLabel: 'Vídeo: cómo se pega un cromo sobre el modelo 3D',
    page: 'Página', bossMeta: 'Todas las estructuras del modelo, sin ayudas', levelMeta: 'Gira el modelo para encontrar cada punto',
    stuck: 'pegados', of: 'de', pileHelp: 'Arrastra cada cromo hasta su hueco, o tócalo y después toca el hueco. Los puntos vacíos están en la otra cara: gira el modelo para verlos.',
    pileLabel: 'Cromos para pegar', hint: 'Pista −5', emptySlot: 'Hueco vacío',
    zoomIn: 'Acerca el modelo', zoomOut: 'Aleja el modelo', zoomFit: 'Vuelve a la vista inicial', rotateHelp: 'Arrastra el fondo para girar',
    hitMsg: '{n}, pegado. +10 puntos.', hitBonus: '¡{n}! Tres seguidos: +{p} puntos.', missMsg: '{n} no va en este hueco. −3 puntos.',
    pickFirst: 'Primero elige un cromo del montón.', hintPick: 'Elige primero un cromo y la pista te mostrará dónde va.',
    hintMsg: 'Pista: el hueco de {n} brilla en dorado. −5 puntos.',
    pageDone: 'Página completa', time: 'Tiempo', errors: 'Errores', hints: 'Pistas', nextPage: 'Pasa la página', startTest: 'Empieza el test',
    noGlTitle: 'Este navegador no puede mostrar modelos 3D',
    noGlText: 'Hace falta WebGL. Pruébalo con Chrome, Edge o Firefox actualizados, o en otro ordenador. Si no puedes, avisa al profesor y continúa con el test.',
    noGlSkip: 'Continúa sin la fase 3D', stars: '{n} de 3 estrellas',
    keys: 'Teclas 1–4', options: 'Opciones', blocks: { coord: 'Coordinación y estímulos', vista: 'Vista', oida: 'Oído' },
    right: '¡Correcto!', wrong: 'No es esta.', wrongPre: 'La buena es la marcada en verde. ',
    nextQ: 'Siguiente pregunta', startCloze: 'Empieza las patologías',
    text: 'Texto', gaps: 'huecos', choose: 'elige…', gapLabel: 'Hueco {k} de {n}',
    clozeOk: '¡Correcto! +10 puntos.', clozeBonus: '¡Correcto! Tres seguidos: +{p}.', clozeBad: 'No es «{v}». La correcta es «{ok}». −3 puntos.',
    clue: 'Pista: {c}', nextText: 'Siguiente texto', seeReport: 'Ver el informe',
    subject: 'MP0061 Anatomofisiología y Patología Básicas · CFGM Farmacia y Parafarmacia · FAR 1L · Unidad 4',
    done: 'Álbum completado', totalTime: 'Tiempo total', no3d: '<b>Fase 3D no realizada</b>: el navegador no tenía WebGL.',
    grade: 'Nota', gradeOf: 'sobre 10', levels: { insuf: 'Insuficiente', suf: 'Suficiente', be: 'Bien', notable: 'Notable', excel: 'Sobresaliente' },
    gradeModels: 'Modelos 3D', gradeTest: 'Test', gradeCloze: 'Patologías',
    gradeHow: 'Nota = 1 + 9 × acierto ponderado (modelos 3D {w1} %, test {w2} %, patologías {w3} %). Modelos 3D: estructuras ÷ (estructuras + errores + ½ pistas). Test: aciertos ÷ 20. Patologías: (aciertos − ½ aciertos con pista) ÷ 30.',
    pointsTile: 'Puntos del juego', correctOf: 'aciertos',
    pagesTitle: 'Páginas de los modelos 3D', pageCol: 'Página', starsCol: 'Estrellas',
    review: 'Para repasar', reviewAtlas: 'Cromos colocados en un hueco equivocado (veces):',
    reviewQuiz: 'Preguntas del test falladas y su respuesta:', reviewCloze: 'Huecos de los textos de patologías que has fallado (respuesta correcta):',
    youChose: 'habías elegido', noErrors: 'Ningún error en todo el recorrido.',
    deliver: 'Entrégalo en Classroom',
    deliver1: 'Pulsa <b>Guarda el informe en PDF</b> y, en el diálogo de impresión, elige «Guardar como PDF».',
    deliver2: 'Abre la tarea de la Unidad 4 en Google Classroom y adjunta el PDF.', deliver3: 'Pulsa <b>Entregar</b> en Classroom.',
    pdf: 'Guarda el informe en PDF', classroom: 'Abre Google Classroom', pdfName: 'Informe U4 Sentidos',
    langUsed: 'Idioma de la partida',
  },
};

let lang = 'ca';
try { const l = localStorage.getItem(KEY); if (LANGS.includes(l)) lang = l; } catch { /* sense emmagatzematge */ }
export const getLang = () => lang;
export function setLang(l) {
  if (!LANGS.includes(l)) return;
  lang = l;
  try { localStorage.setItem(KEY, l); } catch { /* sense emmagatzematge */ }
  if (typeof document !== 'undefined') document.documentElement.lang = l;
}
if (typeof document !== 'undefined') document.documentElement.lang = lang;

/** Text de la interfície; {x} es substitueix pels valors donats (ja escapats si cal). */
export function t(key, vars) {
  let v = UI[lang][key] ?? UI.ca[key] ?? key;
  if (vars && typeof v === 'string') v = v.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
  return v;
}
/** Tria la llengua activa d'un objecte {ca, es}. */
export const L = obj => (obj && typeof obj === 'object' && !Array.isArray(obj) && 'ca' in obj ? obj[lang] ?? obj.ca : obj);

/** Banderes en SVG (senyera de 9 franges; bandera d'Espanya sense escut, proporció 1:2:1). */
export const FLAGS = {
  ca: '<svg viewBox="0 0 27 18" aria-hidden="true"><rect width="27" height="18" fill="#FCDD09"/>' + [1, 3, 5, 7].map(i => `<rect y="${i * 2}" width="27" height="2" fill="#DA121A"/>`).join('') + '</svg>',
  es: '<svg viewBox="0 0 27 18" aria-hidden="true"><rect width="27" height="18" fill="#AA151B"/><rect y="4.5" width="27" height="9" fill="#F1BF00"/></svg>',
};
