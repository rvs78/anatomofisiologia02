// Contingut didàctic de Sentits Quest · U4 (MP0061, FAR 1L).
// Font: Canva «Unitat 4 · Coordinació i sentits · Pell i mucoses · Revisió ampliada»:
// diapositives 1–6 (coordinació, efectors, estímuls), 7–18 (vista), 19–27 (oïda) i taules de patologies.
// Els noms dels nivells han d'existir a MODELS de models.js (ho comprova tests/check.mjs).

export const LEVELS = [
  { model: 'ull', title: 'Capes i segment anterior', names: ['Còrnia', 'Escleròtica', 'Coroide', 'Retina', 'Iris', 'Pupil·la', 'Cristal·lí'] },
  { model: 'ull', title: 'Medis, fons d\'ull i annexos', names: ['Cos ciliar', 'Humor aquós', 'Humor vitri', 'Màcula i fòvea', 'Disc òptic', 'Nervi òptic', 'Múscul extraocular'] },
  { model: 'ull', title: 'Repte de l\'ull complet', names: 'ALL', boss: true },
  { model: 'oid', title: 'Orella externa i mitjana', names: ['Pavelló auricular', 'Conducte auditiu extern', 'Timpà', 'Martell', 'Enclusa', 'Estrep', 'Trompa d\'Eustaqui'] },
  { model: 'oid', title: 'Orella interna', names: ['Estrep', 'Finestra oval', 'Vestíbul', 'Canals semicirculars', 'Còclea', 'Nervi vestibulococlear'] },
  { model: 'oid', title: 'Repte de l\'orella completa', names: 'ALL', boss: true },
];

// Banc del test: [enunciat, [4 opcions], índex correcte, explicació, bloc].
// Es trien 4 preguntes del bloc «coord», 8 de «vista» i 8 d'«oida» (20 en total).
export const QUIZ_MIX = { coord: 4, vista: 8, oida: 8 };
export const QUIZ = [
  // ---- Coordinació i estímuls (diapositives 3–6)
  ['Quin és l\'ordre correcte del circuit de coordinació?', ['Captació → processament → resposta', 'Resposta → captació → processament', 'Processament → captació → resposta', 'Captació → resposta → processament'], 0, 'Els receptors capten el canvi, els centres nerviosos integren la informació i els efectors executen la resposta.', 'coord'],
  ['Quines estructures detecten els canvis externs o interns?', ['Els receptors', 'Els efectors', 'Les glàndules endocrines', 'Els músculs'], 0, 'La captació és la primera etapa: la fan els receptors.', 'coord'],
  ['Quins són els efectors de l\'organisme?', ['Els músculs i les glàndules', 'Els receptors i els nervis', 'L\'encèfal i la medul·la espinal', 'L\'ull i l\'orella'], 0, 'Els efectors executen l\'ordre: els músculs es contreuen o es relaxen i les glàndules secreten.', 'coord'],
  ['Què fan les glàndules exocrines?', ['Aboquen els seus productes a superfícies o cavitats per conductes', 'Alliberen hormones a la circulació', 'Detecten estímuls químics', 'Integren la informació nerviosa'], 0, 'Les exocrines tenen conducte; per exemple, les salivals i les sudorípares.', 'coord'],
  ['Què fan les glàndules endocrines?', ['Alliberen hormones al medi intern i a la circulació', 'Aboquen la suor a la pell', 'Produeixen saliva per un conducte', 'Transformen la llum en senyals nerviosos'], 0, 'Les hormones arriben per la sang a les cèl·lules diana i poden modificar, per exemple, el ritme cardíac o la tensió arterial.', 'coord'],
  ['Quin d\'aquests sentits capta estímuls químics?', ['L\'olfacte', 'La vista', 'L\'oïda', 'El tacte'], 0, 'Olfacte i gust capten estímuls químics; vista, oïda i tacte capten estímuls físics.', 'coord'],
  ['Quin és l\'estímul físic que capta la vista?', ['La llum', 'Les vibracions sonores', 'Les molècules oloroses', 'Les substàncies dissoltes'], 0, 'La vista capta la llum; l\'oïda, les vibracions sonores.', 'coord'],
  ['Què fan els receptors sensorials amb l\'estímul?', ['El transformen en senyals nerviosos', 'Executen l\'ordre del sistema nerviós', 'L\'emmagatzemen com a hormona', 'El transmeten directament al múscul'], 0, 'Els receptors transformen l\'estímul en senyals nerviosos que arriben al sistema nerviós.', 'coord'],
  // ---- Vista (diapositives 7–13, 17–18)
  ['On es troba el globus ocular?', ['A l\'òrbita (regió orbital)', 'A la fossa nasal', 'Al conducte auditiu', 'A la regió temporal'], 0, 'El globus ocular s\'allotja dins l\'òrbita, que el protegeix.', 'vista'],
  ['Quines estructures formen la capa externa de l\'ull?', ['L\'escleròtica i la còrnia', 'La coroide, el cos ciliar i l\'iris', 'La retina i el nervi òptic', 'El cristal·lí i l\'humor aquós'], 0, 'La capa externa té una part resistent i opaca (escleròtica) i una part transparent (còrnia).', 'vista'],
  ['Quines estructures formen l\'úvea, la capa mitjana?', ['Coroide, cos ciliar i iris', 'Escleròtica i còrnia', 'Retina, màcula i fòvea', 'Cristal·lí i humor vitri'], 0, 'L\'úvea és la capa vascular i pigmentada de l\'ull.', 'vista'],
  ['Quina és la capa sensorial interna amb fotoreceptors?', ['La retina', 'La coroide', 'L\'escleròtica', 'L\'iris'], 0, 'La retina conté els cons i els bastons.', 'vista'],
  ['Quina estructura regula la quantitat de llum que entra a l\'ull?', ['L\'iris', 'El cristal·lí', 'La coroide', 'L\'humor vitri'], 0, 'L\'iris varia el diàmetre de la pupil·la.', 'vista'],
  ['Què és la pupil·la?', ['L\'obertura central de l\'iris', 'Una lent que enfoca la imatge', 'La part blanca de l\'ull', 'El punt cec de la retina'], 0, 'La pupil·la és un forat, no una estructura amb teixit propi.', 'vista'],
  ['Quina estructura modifica la seva curvatura per enfocar a distàncies diferents?', ['El cristal·lí, amb l\'acció del múscul ciliar', 'La retina, desplaçant els fotoreceptors', 'La còrnia, canviant de gruix', 'L\'iris, variant el diàmetre pupil·lar'], 0, 'És l\'acomodació: el múscul ciliar canvia la curvatura del cristal·lí.', 'vista'],
  ['Quins fotoreceptors permeten veure el color i el detall?', ['Els cons', 'Els bastons', 'Les cèl·lules ciliades', 'Els botons gustatius'], 0, 'Els cons: color i detall. Els bastons: visió amb poca llum.', 'vista'],
  ['Per a què serveixen sobretot els bastons?', ['Per a la visió amb poca llum', 'Per distingir els colors', 'Per enfocar de prop', 'Per regular la pupil·la'], 0, 'Els bastons són molt sensibles a la llum i permeten veure en condicions de poca il·luminació.', 'vista'],
  ['Per què el disc òptic és el punt cec?', ['Perquè no té fotoreceptors', 'Perquè té massa cons', 'Perquè és la zona més pigmentada', 'Perquè hi arriba l\'humor vitri'], 0, 'Pel disc òptic surt el nervi òptic: allà no hi ha cons ni bastons.', 'vista'],
  ['On es concentra la visió fina?', ['A la fòvea', 'Al disc òptic', 'A l\'iris', 'A la coroide'], 0, 'La fòvea, al centre de la màcula, concentra la visió de detall.', 'vista'],
  ['Quin medi fa la primera refracció de la llum?', ['La còrnia', 'El cristal·lí', 'L\'humor vitri', 'La retina'], 0, 'La còrnia és el primer medi transparent que travessa la llum.', 'vista'],
  ['Quin medi és un gel que ocupa la cavitat posterior de l\'ull?', ['L\'humor vitri', 'L\'humor aquós', 'El cristal·lí', 'La coroide'], 0, 'L\'humor aquós és un fluid de la part anterior; el vitri és un gel de la part posterior.', 'vista'],
  ['Quina capa és vascular i aporta nutrients?', ['La coroide', 'L\'escleròtica', 'La còrnia', 'La retina'], 0, 'La coroide és la capa vascular de l\'ull.', 'vista'],
  ['Quin és l\'ordre dels medis que travessa la llum?', ['Còrnia → humor aquós → cristal·lí → humor vitri → retina', 'Cristal·lí → còrnia → humor vitri → humor aquós → retina', 'Còrnia → cristal·lí → humor aquós → retina → humor vitri', 'Humor aquós → còrnia → humor vitri → cristal·lí → retina'], 0, 'La llum entra per la còrnia i arriba a la retina després de travessar els medis transparents.', 'vista'],
  ['Quants músculs extraoculars orienten cada globus ocular?', ['Sis', 'Quatre', 'Dos', 'Vuit'], 0, 'Sis músculs extraoculars mouen cada ull de manera coordinada.', 'vista'],
  ['On es construeix la percepció visual?', ['Al cervell, que integra els senyals', 'A la retina', 'Al cristal·lí', 'A la còrnia'], 0, 'La retina transforma la llum en senyals; el cervell els integra i construeix la imatge.', 'vista'],
  ['Quina funció tenen les parpelles, les pestanyes i les llàgrimes?', ['Protegir i humitejar l\'ull', 'Enfocar la llum', 'Formar la imatge', 'Moure el globus ocular'], 0, 'Són òrgans auxiliars de protecció; els músculs extraoculars orienten l\'ull.', 'vista'],
  ['L\'escleròtica…', ['És la part blanca i fibrosa que protegeix el globus ocular', 'És transparent i deixa passar la llum', 'Conté els fotoreceptors', 'Produeix l\'humor aquós'], 0, 'L\'escleròtica és una barrera fibrosa; els músculs s\'hi fixen.', 'vista'],
  // ---- Oïda (diapositives 19–24, 26–27)
  ['En quines parts es divideix l\'orella?', ['Externa, mitjana i interna', 'Superior i inferior', 'Externa i interna', 'Pavelló, timpà i nervi'], 0, 'Orella externa (pavelló i conducte), mitjana (ossets) i interna (còclea i vestíbul).', 'oida'],
  ['Quina és la funció del pavelló auricular?', ['Recollir el so', 'Transmetre la vibració a la finestra oval', 'Equilibrar les pressions', 'Detectar l\'acceleració'], 0, 'El pavelló recull el so i el conducte el dirigeix fins al timpà.', 'oida'],
  ['Quina estructura dirigeix el so fins al timpà?', ['El conducte auditiu extern', 'La trompa d\'Eustaqui', 'La còclea', 'El vestíbul'], 0, 'El conducte auditiu extern porta el so del pavelló al timpà.', 'oida'],
  ['Quina funció té el cerumen?', ['Contribueix a protegir el conducte auditiu', 'Amplifica el so', 'Detecta l\'acceleració', 'Equilibra les pressions'], 0, 'El cerumen protegeix el conducte; si s\'acumula, pot formar un tap.', 'oida'],
  ['Quina estructura vibra quan hi arriben les ones sonores?', ['El timpà', 'La còclea', 'El nervi vestibulococlear', 'El pavelló auricular'], 0, 'El timpà vibra i passa la vibració als ossets.', 'oida'],
  ['Quin és l\'ordre dels ossets, des del timpà?', ['Martell → enclusa → estrep', 'Estrep → enclusa → martell', 'Enclusa → martell → estrep', 'Martell → estrep → enclusa'], 0, 'El martell està unit al timpà i l\'estrep, a la finestra oval.', 'oida'],
  ['Quin element rep el moviment de l\'estrep?', ['La finestra oval', 'El timpà', 'El conducte auditiu extern', 'La trompa d\'Eustaqui'], 0, 'Per la finestra oval la vibració entra a l\'orella interna.', 'oida'],
  ['Amb quina cavitat comunica la trompa d\'Eustaqui?', ['Amb la nasofaringe', 'Amb la còclea', 'Amb el conducte auditiu extern', 'Amb el vestíbul'], 0, 'La trompa comunica l\'orella mitjana amb la nasofaringe.', 'oida'],
  ['Quina funció té la trompa d\'Eustaqui?', ['Ajudar a equilibrar les pressions', 'Recollir el so', 'Detectar els girs del cap', 'Convertir la vibració en senyal nerviós'], 0, 'Equilibra la pressió a banda i banda del timpà.', 'oida'],
  ['On es troba l\'òrgan de Corti?', ['A la còclea', 'Al vestíbul', 'A l\'orella mitjana', 'Al timpà'], 0, 'L\'òrgan de Corti, amb les cèl·lules ciliades auditives, és dins la còclea.', 'oida'],
  ['Quines cèl·lules converteixen la vibració en senyals nerviosos?', ['Les cèl·lules ciliades', 'Els cons', 'Els bastons', 'Els melanòcits'], 0, 'El moviment dels fluids coclears activa les cèl·lules ciliades.', 'oida'],
  ['Quin nervi porta a l\'encèfal la informació auditiva i la de l\'equilibri?', ['El nervi vestibulococlear (VIII)', 'El nervi òptic', 'El bulb olfactori', 'La medul·la espinal'], 0, 'El nervi VIII té una branca coclear (audició) i una de vestibular (equilibri).', 'oida'],
  ['Què detecten els canals semicirculars?', ['L\'acceleració angular (els girs)', 'L\'acceleració lineal i la gravetat', 'Els sons aguts', 'La pressió de l\'aire'], 0, 'Utricle i sàcul detecten l\'acceleració lineal i la gravetat.', 'oida'],
  ['Què detecten l\'utricle i el sàcul?', ['L\'acceleració lineal i la gravetat', 'L\'acceleració angular', 'El so que arriba al pavelló', 'La vibració de l\'estrep'], 0, 'Són al vestíbul; els canals semicirculars detecten els girs.', 'oida'],
  ['A més dels receptors de l\'audició, què allotja l\'orella interna?', ['Els receptors de l\'equilibri', 'Els receptors del gust', 'Els receptors del tacte', 'Els fotoreceptors'], 0, 'L\'orella interna conté la còclea (audició) i l\'aparell vestibular (equilibri).', 'oida'],
  ['Per mantenir l\'equilibri, quins senyals integra el cervell?', ['Vestibulars, visuals i propioceptius', 'Només vestibulars', 'Auditius i olfactius', 'Gustatius i tàctils'], 0, 'L\'equilibri combina la informació de l\'orella interna, la vista i la propiocepció.', 'oida'],
  ['En el procés d\'audició, què passa just després del moviment dels fluids i les membranes coclears?', ['S\'activen les cèl·lules ciliades i la via auditiva', 'Vibra el timpà', 'Es mou el martell', 'El pavelló recull el so'], 0, 'Ordre: so i timpà → ossets → fluids coclears → cèl·lules ciliades i via auditiva.', 'oida'],
];

// Fase 3 · Text amb buits. Sintaxi: {correcta|distractor|distractor::pista}
export const CLOZE = [
  {
    title: 'Defectes de refracció',
    body: 'En la {miopia|hipermetropia|presbícia::L\'ull és llarg o té massa potència òptica.} la imatge s\'enfoca {davant|darrere|a sobre::Pensa on cau el focus quan l\'ull és massa llarg.} de la retina. La persona veu borrós de {lluny|prop|costat::Aclucar els ulls per veure-hi de lluny és un signe típic.} i es corregeix amb lents {divergents|convergents|bifocals::Cal separar els raigs perquè el focus arribi més enrere.}. En la hipermetropia, en canvi, l\'ull és curt i hi ha dificultat per a la visió {propera|llunyana|nocturna::Aquí costa llegir i hi ha fatiga ocular.}. {L\'astigmatisme|L\'estrabisme|El daltonisme::La còrnia o el cristal·lí tenen una curvatura desigual.} es deu a una curvatura irregular i es corregeix amb lents cilíndriques o tòriques. La presbícia apareix amb {l\'edat|l\'exposició al sol|una infecció::El cristal·lí perd elasticitat amb els anys.} perquè disminueix la capacitat {d\'acomodació|de refracció de la còrnia|de produir llàgrimes::És la capacitat del cristal·lí d\'enfocar de prop.}.',
  },
  {
    title: 'Cataracta, glaucoma i altres alteracions',
    body: 'La cataracta és l\'opacificació del {cristal·lí|humor vitri|disc òptic::És la lent que perd transparència.}, habitualment relacionada amb l\'edat; provoca visió tèrbola i enlluernament, i es tracta amb {cirurgia de substitució del cristal·lí|col·liris hipotensors|lents divergents::És el tractament quirúrgic quan està indicat.}. En el glaucoma es lesiona el {nervi òptic|cristal·lí|timpà::És l\'estructura que surt pel disc òptic.}, sovint amb una pressió intraocular {elevada|baixa|nul·la::Els col·liris del tractament la fan baixar.}. Al principi sol ser {asimptomàtic|molt dolorós|molt evident::Per això és important la revisió periòdica.} i després apareix una pèrdua progressiva del camp visual. En l\'estrabisme els ulls no mantenen una {alineació|transparència|curvatura::Es veu la desviació d\'un ull.} adequada i de vegades hi ha diplopia. El daltonisme és una alteració dels fotopigments dels {cons|bastons|cèl·lules ciliades::Són els fotoreceptors del color.}, sovint hereditària. La degeneració macular afecta sobretot la visió {central|perifèrica|nocturna::La màcula és al centre de la retina.}.',
  },
  {
    title: 'Trastorns de l\'audició',
    body: 'La hipoacúsia de {transmissió|neurosensorial|vestibular::El problema és conduir el so per l\'orella externa o mitjana.} es produeix per una obstrucció o alteració de l\'orella externa o mitjana: la persona nota l\'orella tapada. La hipoacúsia neurosensorial es deu a un dany {coclear|del timpà|del pavelló auricular::Afecta l\'orella interna o el nervi auditiu.} o del nervi auditiu; si apareix de manera {sobtada|progressiva|simètrica::En aquest cas la taula diu «valoració urgent».} cal una valoració urgent. Es pot tractar amb {audiòfons|col·liris|lents de contacte::Amplifiquen el so; en casos indicats, implants.} o implants. L\'otitis mitjana és una inflamació o infecció de l\'orella {mitjana|externa|interna::És on hi ha els ossets.} que causa {otàlgia|diplopia|anòsmia::És el dolor d\'orella.}, febre i de vegades hipoacúsia. El tap de cerumen és una acumulació de cerumen al {conducte auditiu extern|vestíbul|canal semicircular::És on es produeix i s\'acumula el cerumen.} i es tracta amb {cerumenolítics|antibiòtics|ulleres de prop::Són productes que desfan el cerumen.} o amb extracció professional.',
  },
  {
    title: 'Vertigen i aplicació a la farmàcia',
    body: 'El vertigen és la sensació de {moviment|pressió|picor::Sembla que un mateix o l\'entorn giren.} propi o de l\'entorn. Es deu a una alteració del sistema {vestibular|auditiu extern|lacrimal::Canals semicirculars, utricle i sàcul.} i pot causar sensació de gir, {nàusees|febre alta|visió de colors::És un símptoma digestiu que l\'acompanya sovint.} i desequilibri. El tractament depèn de la causa; en el VPPB es fan {maniobres|cirurgies de cataracta|audiòfons::Es fan amb moviments del cap.}. A la farmàcia cal recordar que alguns fàrmacs són ototòxics: poden afectar l\'audició o {l\'equilibri|l\'olfacte|el gust::L\'orella interna també en té els receptors.}. En el glaucoma, els col·liris per reduir la pressió ocular s\'utilitzen segons prescripció, i la pauta i la {tècnica d\'ús|mida de l\'envàs|marca comercial::Com s\'aplica la gota a l\'ull.} importen.',
  },
];
