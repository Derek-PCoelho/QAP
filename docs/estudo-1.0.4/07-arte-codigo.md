# 07 — Arte: leitura linha a linha de src/client/art/ (código)

(Notas de estudo. Nada no repositório foi modificado. Referências no formato arquivo:linha.)

## 0. Visão geral
- 27 arquivos .ts + README.md = 25.912 linhas. Toda a arte é procedural: buffer `Pix` (Uint32 RGBA, 0xAABBGGRR) + sprites ASCII + primitivas (rect/line/disc/ellipse/poly/dith/vgrad/glow/outline).
- Dois "mundos" de cor: CENTRAL (fria) e HOME (quente). Desgaste → `homeGrader(t)` aplicado como `Pix.setMap()` (toda cor desenhada passa pelo mapa).
- Galerias de revisão (gallery.ts, videoGallery.ts) tocam `document` no topo — NÃO são exportadas pelo index (são entradas de tools/art-gallery.html).

## 1. Base

### index.ts (109)
- Reexporta palette, pix, font, sprite, portraits, faces, icons, mapRender, figures, dog, scenes, newsPhotos, endingArt; `props` como namespace (`export * as props`).
- NÃO reexporta: portraitKit, newsPhotoKit, video*, videoPlace etc. (o vídeo é importado direto de `./art/video`).
- Objeto `art` agrupado (index.ts:37-107) + default export.

### palette.ts (293)
- CENTRAL (18 cores) :10-29; HOME (13) :33-47; HOME_COLD :52-66; TRIAGE :68; SKIN 5 tons :75 (`#f1c7a5 … #5e3a22`); HAIR 5 :76 (preto, castanho-escuro, castanho, grisalho, branco); UNIT_STATUS_COLOR :79; MEMBER_STATUS_COLOR :91.
- hexToRgb (cache) :109, mix :130, luma :139, chroma :145, `shade` (sombra → roxo #160d1c, luz → #fff3d6) :154, `shadeCold` :161.
- blendHome(t) :168 (lerp por chave); cssVars/cssVarsText :176/184.
- gradeHome(hex,t) :234 — Shepard (peso 1/d³) sobre âncoras: 13 cores HOME→COLD + 5 SKIN (pele esverdeada pálida) + branco/preto/paper/ink :202-219; cor saturada (chroma>0.45) recebe só 45% do "puxão" para a rampa fria `coldRampAt` :224 (o deslocamento das âncoras é aplicado inteiro).
- homeGrader(t) :272 — quantizado em 1/40, memo por cor. `quantize(t,steps)` :291.

### pix.ts (666)
- pack(hex) :13 (suporta #rgb, #rrggbbaa, 'transparent'); BAYER4/BAYER8 :33-44 (BAYER8 não é usado aqui — conferir uso nos outros arquivos); bayerOn :47.
- class Pix :73 — setMap/map :87-95, c() :98 (cor gradada com cache por Pix), clear, get, raw, px, pxa (alfa) :140, rect, recta, frame, hl, vl, line (Bresenham, guarda 4096) :208, dashed :235, disc :247 (r²+0.6r), ring :261, ellipse :274, poly (par-ímpar) :287, dith :316, checker :329, vgrad/hgrad (faixas + pontilhado) :339/359, glow (anéis quantizados com Bayer na borda; `opaqueOnly`) :381, blit (flipX, tint, tintAmount, alpha) :400, sprite :446, outline (4/8 viz.) :472, dropShadow :498, remap :517, copy/copyFrom/crop/scaled :525-556, toImageData/toCanvas/toDataURL :558-580.
- presentPix(ctx,p,x,y,scale,slot) :592 — canvas intermediário por slot+tamanho.
- gradedCopy(src,fn,key) :612 — cópia gradada em cache (WeakMap por Pix) — usado para sprites (figuras, Ozzy).
- mulberry :641, hash2 :652, hashStr (FNV-1a) :659.
- Observação: `blit` com tint usa `this.c(o.tint)` (passa pelo map) — ok. `pxa` sobre destino transparente grava cor com alfa a (não pré-multiplicado) — consistente com ImageData.

### sprite.ts (121)
- `Sprite = {w,h,rows,pal}`; makeSprite :11; spriteKey (hash conteúdo, memo WeakMap) :19; spritePix :33; spriteCanvas/spriteURL (cache por chave+escala) :44/55; drawSprite (ctx, tint, flipX, alpha) :72; seeded/rint/rpick :108-120.
- '.' e ' ' transparentes; chave mapeada para null também.

### font.ts (209)
- Fonte 3×5 (M, N, W com 4-5 px) :8-70; acentos por marcas (acute/grave/circ/tilde/cedil/uml) :73-117 — Á À Â Ã É Ê Í Ó Ô Õ Ú Ü Ç. Faltam: È Ì Ò Ù Ñ, '@' (cai em '?').
- textWidth :129, drawText(p,str,x,y,color,{scale,align,shadow,outline,spacing,alpha}) :153 (outline = 8 passadas), wrapText :196.
- Tudo vira maiúscula.

## 2. Família de corpo inteiro, Ozzy e objetos

### figures.ts (730) — sprites de corpo inteiro
- `CastId = LUCIA | ALEX | DAVI | ZELIA | EU_M | EU_F` :12; `Pose = em_pe | sentado | deitado` :13; Kind adult_f/adult_m/child/elder_f :15.
- `BODIES` :49-75 (definição de cada pessoa — É AQUI que se muda pele/cabelo/roupa dos sprites):
  - LUCIA :50 — `skin: SKIN[3]` (#8d5634, moreno-escuro), `hair: HAIR[0]` preto, `hairStyle: 'curly_big'` (cachos volumosos), blusa `HOME.fabricRed` com fita métrica (`blouse_tape`), saia azul #3a4660, brincos dourados.
  - ALEX :55 — `skin: SKIN[3]`, `hair: HAIR[0]`, `curly_short`, `beard: true` (barba cheia), camisa vermelha de botão com fita (`shirt_tape`), calça.
  - DAVI (Liam) :59 — `skin: SKIN[2]` (#b97b52, moreno médio), cabelo preto `kid`, camiseta listrada azul/creme, bermuda, tênis vermelho com sola branca.
  - ZELIA :63 — SKIN[1], grisalho `bun_top`, blusa florida roxa #7a5c8e, saia longa, óculos.
  - EU_M :67 — SKIN[1], preto `short_m`, pijama cirúrgico verde #4f8a6e, barba por fazer (stubble). EU_F :71 — SKIN[1], `bun_low`.
- `EXTRA` (ANTONIO, ESPOSA — só vinhetas) :36-47.
- Geometria por kind `geo()` :104 (adulto 16×32, criança 12×24, idosa 14×29).
- Cores derivadas `colors()` :148 — status doente/crítico/frio mistura a pele com cinza-verde/cinza/azul.
- `drawHeadAndHair` :172 — rosto 6×7-8 px, 7 estilos de cabelo (curly_big :186, short_m :206, bun_low :223, kid :242, curly_short :258, bucket_hat :276, bun_top :292); olhos 1 px (criança ganha brilho acima); óculos; boca; bochecha corada (criança); barba :343; stubble :360; brincos :365.
- `drawTorso` :371 (pescoço, tronco, braços, estilos scrubs/blouse_tape/shirt_tape/stripes/plaid/floral; xale no frio :468).
- `drawLegsStanding` :482; `standing` :543; `sitting` (cadeira opcional) :552; `lying` (travesseiro + cobertor, estrelinhas se azul) :594.
- `figurePix(id,pose,{inhale,blink,status,chair,blanket})` :684 — cache 400; inspiração sobe cabeça/tronco 1 px :693; contorno #120c08.
- `extraFigurePix` :710, `figureHeight` :722, `CAST_IDS` :730.
- Código morto/pequenos defeitos: :487 ternário com os dois ramos iguais (`long_skirt ? legY0-1 : legY0-1`); :515-517 `if` vazio; :577 `lapC` ternário com ramos iguais; :320 `(o.down ? 0 : 0)`.
- Não há olho asiático/forma de olho no sprite (olho = 1 px), então "asiática" no corpo inteiro só se lê por pele clara + cabelo liso preto (precisa de um estilo novo, p.ex. 'straight_long' / 'bob').

### dog.ts (299) — Ozzy
- PAL laranja/creme/preto + língua + bolinha azul :24-36.
- FRAMES desenhados à mão :39-154: `sentado0/1` (16×13, rabo abana), `deitado0/1` (19×11, respira), `dormindo0/1` (16×10, enrolado, olho fechado `DD`), `brincando0` (19×10, reverência com língua) e `brincando1` (16×13, pulo).
- frameKey(pose,t) :170 — sentado: 4 abanadas a cada 180 ms + pausa; deitado: seno 2,6 s; dormindo: seno 3,2 s; brincando: 320 ms.
- dogPix(pose,t,scale) :188 (contorno #120c08, cache); drawDog(p,x,y,pose,t,{map,mapKey,flip,noShadow,scale}) :222 — centro em x, patas na linha y, sombra, pulo 3 px, bolinha quicando :231-237.
- dogPortraitPix/dogPortrait :261/289 — retrato 64×64 em fundo de casa com tapete (sentado/dormindo ×3, deitado/brincando ×2). Cache limitado a 40.
- NÃO existe pose "correndo" nem "latindo" — o item 54 do feedback (Ozzy corre pela sala latindo e depois dorme no tapete) exige quadros novos (`correndo0/1/2`, `latindo0/1`) + `DogPose` + `frameKey` + deslocamento em x feito por quem chama (scenes.ts). "dormindo" já existe.
- Observação: a gradação usa `gradedCopy(src, map, mapKey)`; quem chama precisa passar mapKey diferente por passo de desgaste (senão o cache devolve a versão errada). scenes.ts faz isso (conferir).

### props.ts (733) — objetos desenháveis (exportado como `props`)
- floorShadow :15, nail :20, badge (crachá) :27, kidDrawing (ambulancia/casa/sol/familia) :52, fridge (ok/quebrada + desenhos) :120, sewingMachine (+cartão) :185, plateEdge :230, cup :245, sugarTin "AÇÚCAR" :260, juiceGlass :273, insulin :283, stainedSock :300, closedShoes :315, handbag (+passagem) :326, interviewClothes :344, angryDrawing :368, cornCake (bolo de fubá) :384, candle (animada) :400, bucket :417, fatEnvelope :430, ring (aliança piscando) :446, inhaler :463, flowers :478, letter :505, styrofoam :515, woodChair (+xale) :531, hangingBulb :567, deskPhone (toca, luz pisca) :577, familyPhoto :621, monitorFrame :649, postit :660, papers :672, manualBinder "REG" :684, corkBoard :698, pushPin :712, housePlate "40" :720, cardBox :727.
- **familyPhoto :621-646 também codifica a família**: você pele #d9a57e (SKIN[1]) de verde; cônjuge pele **#8d5634 (SKIN[3])** de vermelho; Liam pele **#b97b52 (SKIN[2])** de azul — todos de cabelo preto. Tem de mudar junto com o HANDOFF (cônjuge claro; Liam branco). Não depende do gênero.
- postit :660 aceita cor (já serve para post-its por categoria: azul/rosa/verde/branco).

## 3. Ícones e mapa

### icons.ts (1015)
- ICON_PAL (letra→cor, ~40 cores) :12-53; contorno automático #0d1311.
- GRIDS (51 ícones 16×16) :58-769: phone, phone_ring, usa, usb, hospital, upa, maternidade, base, casa, central, escola, igreja, parque, policia, bombeiros, cafe, cafe_vazio, foto, manual, quadro, diario, radio, carimbo, alerta, nota, dinheiro, pin, lupa, relogio, coracao, estrela, check, xis, cadeado, som, mudo, interfone, mapa, fila, postit, envelope, bolo, termometro, gota, raio, porta, prato, nuvem_chuva, floco, cruz_vermelha, cama_hospital.
- STATUS_GRIDS (9 status 10×10 → 12×12) :772-878: bem, fome, frio, doente, triste, critico, internado, ausente, morto (contorno claro #8fa89a para "morto" :947).
- build(rows,size,outline) :885 — centraliza pela caixa ocupada. iconPix :926 (nome desconhecido → ícone "alerta"; nomes de status também aceitos, 12×12 dentro de 16×16), statusIconPix :942, icon(name,scale=2) dataURL :960, statusIcon :972, iconSprite (Pix→Sprite indexado) :984.
- Ícone `foto` :303 usa pele `F` (#b97b52) nos rostos — se a família ficar clara, talvez trocar para `f` (#e8b48a).
- Morto: `void spriteKey` :1013 (import usado só para silenciar lint).
- Não existe ícone de "caixa"/categoria de pergunta, "almoço", "vaga zero", "adesivo do Ozzy" (itens 34, 18, 28 do feedback) — se a UI quiser ícones novos, basta acrescentar uma grade em GRIDS (o nome entra sozinho em ICON_NAMES/IconName).

### mapRender.ts (1025) — mapa de Santa Aurora (64×40 tiles; dados em `src/engine/city/map`)
- Tipos MapUnit/MapRoute/MapMarker/CityMapOpts :29-61; mapPixelSize :64; tileFromPixel :69.
- MAP_COLORS :78; TONES por bairro (9 bairros, kind casas/nobre/galpao/centro/denso/expo) :110-120.
- Ícones de marcos 7×7 (LM_PAL/LM_ICON :125-164: hospital, upa, maternidade, base, central, escola, igreja, parque, casa, ubs, posto, comercio, publico, praca); MAJOR :178.
- placeLandmarks (escolhe tile de quadra vizinho à rua) :196; landmarkTile :232.
- Camada estática: roof :245, drawBlockTile (variações por kind) :257, drawRoadTile (calçadas + faixa tracejada de avenida) :384, drawParkTile :411, drawWaterTile :430, drawBankTile :445, labelBands :458, buildBase (praça com chafariz :502, alamedas :511, alagamento — intransitável hachurado/lento/quadras molhadas :513-542, marcos + glow quente da casa :544-564, rótulos com desvio de colisão :566-621). Cache `base()` por (tile, labels, flood), máx. 8 :627.
- Camada dinâmica: shimmer (rio + ondulação + chuva no alagamento) :641, drawRoute (sombra + "formigas" tracejadas) :681, drawMarker (chamada pulsando, inválido "?", casa, alvo) :734, AMB_ROWS 9×7 :825, ambulancePix (faixa vermelha USA / laranja USB, giroflex quando DESLOC/TRANSP, cinza em PANE/FORA) :837, drawUnits (leque para viaturas sobrepostas, ponto de status, cantoneiras na selecionada, rótulo) :862, drawHighlight (rua destacada com nome) :934, drawHover :960, drawLiveLandmarks (antena da central pisca) :967.
- renderCityMap :987 / drawCityMap :1015 / unitStatusColor :1021.
- Riscos: `renderCityMap` devolve um Pix de trabalho COMPARTILHADO (`work`, :984-996) — quem guardar a referência vê o conteúdo mudar na próxima chamada. `lastPos` (:835) é global por id de viatura (dois mapas com a mesma viatura disputam a direção). `void hashStr` :1025 (import morto). `ambulancePix` recriado a cada quadro (sem cache, barato).

## 4. Cenas — scenes.ts (2957)

### Estrutura e API
- SCENE_W/H 320×180 :57; SCENE_BGS (13) :60 = cozinha, sala, quarto, porta, escola, central, rua, hospital, calcada, escritorio, igreja, mesa, preto (o tipo `SceneBg` mora em `src/engine/types`).
- SCENE_OBJECTS (29 ids) :63-93. `SceneCast {id: LUCIA|ALEX|DAVI|ZELIA|EU_M|EU_F, pose, x, status}` :103; `SceneOpts {bg, blend, objects, cast, ozzy, time}` :112.
- `ObjDef {r, layer back|front, draw?, anim?}` :127; `Placement {x, bottom, layer back|top, chair, blanket, seat}` :134; `BgDef {warm, back, front, light, anim, place, seats, marks, ozzy[], ozzySleep, objects}` :144.
- Utilitários: plaster :168, tileGrid :173, floorTiles :183 (não usado? — só perspFloor aparece nas cenas da casa; conferir: floorTiles NÃO é chamado em lugar nenhum → código morto), planks :200, vignette :211, roomFrame :228 (não chamado → morto), nightWindow :233 (não chamado; substituído por nightPane → morto), door :275 (não chamado → morto), bulbLight :293 (não chamado → morto), perspFloor :314, skirting :348, wallContact :355, bulbCone :365, roomDark :388, pendantLamp :409, bareBulb :429, nightPane :441, windowFrame :464.
- Constantes de palco da casa: WALL_Y=100, FEET_BACK=121, FEET_FRONT=149 :308-311 (diálogo sobe a cena 33 linhas; faixa útil 40..156 — comentário :301-306).

### Cômodos da casa
- COZINHA :474-886 — `TABLE` :482; cozinhaBack :484 (reboco, azulejo com friso azul, piso vermelhão em perspectiva, tapete de retalhos, porta da área + crachá, cesto de roupa (meia), geladeira ok/quebrada (+desenhos), janela com varal (roupa de entrevista), bancada, cuba, garrafa térmica vermelha, escorredor (prato seco), fogão + panela (some com `mesa_vazia`), prateleira (lata de açúcar / suco escondido), botijão, filtro de barro, relógio, calendário, **familyPhoto :658**, aparador (máquina de costura/cartão ou rádio), armário, vassoura, lâmpada nua, encostos de cadeira); chairBack :715, frontChair :729, laundryBasket :756, shawlOn :773; cozinhaFront :786 (mesa xadrez ou nua); cozinhaPlace :837; cozinhaSeats :853 (bolsa na cadeira, xale da Zélia em `cadeira_vazia`); cozinhaAnim :864 (vapor, gota da geladeira); cozinhaLight :883.
- SALA :888-1136 — COFFEE/ARMCHAIR :896-898; salaBack :900 (papel listrado, viga, piso bege, porta da frente, estante com TV de tubo, janela com cortina azul e lua, sofá azul com manta, bordado "LAR DOCE LAR" :981-993, canto da costura, manequim, poltrona vermelha da Zélia, luminária pendente); armchair :1038; salaFront :1062; salaRug :1076; salaPlace :1092; salaSeats :1111; salaAnim (novela na TV) :1121; salaLight :1133.
- QUARTO (do Liam) :1138-1330 — BED/LAMP :1147; quartoBack :1150 (parede azul com estrelinhas, 4 desenhos de criança por cima da cama, cama com cobertor de estrelas, criado-mudo + abajur, janela com lua, escrivaninha com lápis e cadeirinha vermelha, guarda-roupa com adesivo de ambulância, caixa de brinquedos, ambulância de brinquedo); quartoPlace :1299; quartoLight (abajur + luar) :1317. Sem `front`/`seats`.
- PORTA (fachada à noite, casa azul nº 40) :1332-1530 — PORCH_Y/DOOR :1341; barredWindow (acesa com sombra da máquina) :1345; stringChair :1374; portaBack :1393 (beiral, fachada, janelas, marquise, porta, arandela, placa 40, caixa de correio, espada-de-são-jorge, lajota, muro baixo com portão, pedra portuguesa, poste); portaFront :1494; portaLight :1501; portaPlace :1515; portaSeats :1527.
- CALÇADA (despejo, fim de tarde) :1532-1688 — calcadaBack :1543 (aviso de despejo na porta), streetSofa :1608, **drawEvictionFurniture (export)** :1628, porchFurniture :1657, calcadaFront/Place/Light :1668-1688.
### Fora de casa
- ESCOLA (Festa da Família, palco) :1690-1871 — STAGE :1699; escolaBack :1701 (faixa "FESTA DA FAMÍLIA" :1755); plasticChair :1802; escolaFront (plateia em silhueta, celular) :1819; escolaLight :1839; escolaPlace (Liam no palco) :1853; escolaSeats :1864.
- CENTRAL :1873-1962 — smallMap (renderCityMap tile 2) :1878; console3q :1883; centralBack (janela, painel com o mapa, relógio "03:12", quadro de cortiça com post-its) :1901; centralFront/Light/Place/Anim :1942-1962.
- RUA (noite, fusca) :1964-2041. HOSPITAL (corredor em perspectiva, "UTI", "SILÊNCIO", maca, cadeiras) :2043-2213. ESCRITÓRIO (ar-condicionado, **metricsScreen export** "ÍNDICE 94" :2218) :2215-2301. IGREJA (vitrais, altar, bancos, velas) :2303-2397. MESA (close 160×90 ampliado ×2: monitor com mapa nativo, post-its, teclado, telefone, formulários, carimbo, manual, familyPhoto :2437, caneca; objetos carta/envelope/aliança/crachá/flores) :2399-2476. PRETO :2811.

### Objetos inspecionáveis
- helper `o()` :2481; DRAW :2483; candleAnim :2503; ringAnim :2513; leakAnim (goteira) :2518; leakStain :2535; COZ_CAKE/SALA_CAKE :2546.
- `OBJECTS` por cenário :2549-2678 (retângulos clicáveis + desenho/animação). Muitos objetos não têm `draw` porque são desenhados dentro do `back` do cenário consultando `has` (geladeira, desenhos, máquina, prato, lata, suco, roupa, meia, bolsa, cadeira_vazia, mesa_vazia).
- `OBJECT_RECTS` (padrão; cozinha→sala→quarto→porta→calcada→mesa) :2681; `objectRect(bg,id)` :2693; `objectsFor(bg)` :2700.
- Achados: cozinha `sapato_fechado` :2570 tem retângulo mas NADA desenha o sapato na cozinha (o comentário diz que são os pés da Zélia sentada; se ela não estiver lá, o clique marca um vazio). sala `geladeira_*` :2601-2602 com retângulo 0×0 (só para "aceitar" o id). mesa `xicara` :2662 — a caneca é sempre desenhada (o objeto não muda nada). igreja `vela` :2658 sem draw (velas sempre acesas pela anim).

### Definições e render
- `BGS` :2709-2812 — warm (gradação do Desgaste só nos warm: cozinha, sala, quarto, porta, calcada, escola, rua, igreja), marks (lugar de cada um por cômodo), ozzy (lugares do Ozzy por preferência), ozzySleep.
- layerCache (fundo + frente estáticos por bg|q|objetos, máx. 24) :2824-2854; quantize(blend,20).
- PHASE (fase de respiração/piscada por pessoa) :2856; `familyMarks(bg, ids)` (export) :2867; castHeight :2878; drawCastMember (respira, pisca, treme no frio, sombra, ícone de status) :2883.
- `renderScene` :2904 — copia fundo, anim do cenário, anim dos objetos de trás, elenco e Ozzy ordenados por `bottom` (camada back), frente, anim dos objetos da frente, cadeiras vazias, elenco/Ozzy da camada top, ícones de status (não gradados), tremulação fluorescente com blend>0.45 :2939-2944. `drawScene` :2952.
- Ozzy na cena: escolhe o primeiro lugar livre de `def.ozzy` :2926; dormindo vai para `ozzySleep` :2927. Posição fixa: **não há trajeto** (item 54 "corre pela sala latindo" precisa de: quadros novos em dog.ts + um modo em renderScene/SceneOpts que interpole x ao longo do tempo, p.ex. `ozzy: {pose:'correndo', path:[...], t0}`) e o "latido" é som (src/client/audio) + talvez um balãozinho "AU!" com drawText.
- Riscos: `renderScene` devolve o Pix compartilhado `work` (:2900) — igual ao mapa. Código morto: floorTiles, roomFrame, nightWindow, door, bulbLight; `void mix; void nail` :2956-2957; `void has` em portaFront/escolaBack/escolaSeats.
- Para "algo diferente em cada cômodo nos 20 dias" (item 56) e "reparar" (item 58): o mecanismo já existe (ids de objeto + retângulo + desenho). Hoje são só 29 ids, vários repetidos entre cômodos; 20 dias × 4 cômodos exigirão dezenas de objetos novos (props + entradas em OBJECTS e SCENE_OBJECTS).

## 5. Retratos

### portraitKit.ts (1164) — kit compartilhado por retratos e rostos de paciente
- Cor OKLab/OKLCH: toLch :30, lch (reduz croma até caber no sRGB) :66, hueToward :81, mixLab :88, adjust :107.
- `ramp(base, RampSpec)` :130 — 5 tons [fundo, sombra, base, luz, brilho]; sombras → 292° (violeta), luzes → 85° (amarelo); neutros ganham tinta.
- `Mask` :156 (get/set/rect/hl/ellipse/poly/spans/stroke/or/and/sub/copy/edge/rowSpan/prune/fillPits/count).
- Luz `LIGHT` cima-esquerda-frente :308; lit :312; sphereN :318; toneOf(I, limiares) :330.
- Partes `P` (NONE, BACK, BODY, NECK, EAR, FACE, FEAT, HAIR, HAT, ACC, GLASS) :342.
- `Layer` :356 — material (rampa) + tom 0..4 + parte + trava por pixel; mat/solid/set/color/tone/shift/remat/paint/despeckle/hexAt. Máx. 255 materiais.
- `compose(L, bg, {ink, rim, rimK, openBottom})` :549 — cores das rampas, luz de recorte na borda direita, contorno externo seletivo (mais claro do lado da luz).
- Olhos: `EYE_SHAPES` :629 = adult, fem (**idêntico a adult** apesar do comentário "canto externo mais alongado"), big (criança), small (idoso), patient, patientBig. **Não existe formato de olho amendoado/asiático.** EyeMood (drop/raise/outDrop/inDrop/lift/look/closed/tinyPupil/wet/rolled) :644; eyeColors :678; `drawEye` :715.
- Sobrancelha `drawBrow` (Lagrange por 3 pontos) :884. Moldes em texto `stamp` + papéis skinTone/skinLock/solidRole :923-956; dith2 :959.
- Rampas: skinRamp (sombra → vermelho-rosado 12°, luz → pêssego 78°) :968; hairRamp (preto com brilho azul-violeta frio; castanho; grisalho com sombra lilás) :984; clothRamp :1004.
- Cabelo: hairTone (mechas por ângulo a partir de `src`, faixa de brilho quebrada, queda reta abaixo de `fallY`) :1032; paintHair :1079; paintCurls (Voronoi = cachos-esfera com sulco) :1084; poissonIn :1118; curlySilhouette :1139; belowLine (janela do rosto sob a linha do cabelo) :1147.
- Miudezas: drawEye :754 `+= ... ? 0 : -0` (sem efeito), :759 ternário com ramos iguais, :824 `void leftmost`.

### portraits.ts (3152) — os 24 retratos
- `Mood` / `MOODS` (7): neutro, feliz, triste, bravo, preocupado, surpreso, cansado :50-51. PORTRAIT_SIZE 64 :54.
- `CharacterId` (24) :56-80 — **CHARACTER_IDS = Object.keys(CH)** :314, na ordem: EU_M, EU_F, LUCIA, ALEX, DAVI, ZELIA, SIMONE, PEIXOTO, HENRIQUE, BENE, CARLA, ARLINDO, ASSESSOR, CIDA, JAIRO, BIEL, NOGUEIRA, JULIANA, ANTONIO, ROSANGELA, WESLEY, MARCIA, PAULA, PLANTONISTA.
- Vocabulário: FaceShape (oval, fem, round, square, long, child, teen) :82; HairStyle (short, bun_low, curly, kid, bun_top, pixie_side, balding, messy, slick, gel, curly_short, long, ponytail, shoulder, crop, asym, under_hat, none) :83; Hat :102; Facial :103; Glasses :104; Clothes (20) :105; Acc (17) :126; BgKind (8) :144; Nose :145; `Look` :155 (sex, face, skin, hair, style, hat, eyes normal|tired|big|small|**narrow**, iris, brows, facial, glasses, clothes c1/c2/c3, acc, bg, lines, rest, nose, lips).
- **`CH` :184-307 — a ficha de cada personagem (É AQUI que se muda o retrato).**
  - EU_M :185 — "Dr. ${PROTAGONIST_FIRST.M} Moura" (hoje Luan), oval, SKIN[1], preto `short`, olhos cansados, barba por fazer, pijama cirúrgico verde #4f8a6e, olheiras, caneta no bolso, fundo central.
  - EU_F :190 — "Dra. ${PROTAGONIST_FIRST.F} Moura" (hoje Amber), fem, SKIN[1], preto `bun_low`, cansada, scrubs, olheiras, brincos pequenos.
  - LUCIA :195 — fem, **skin SKIN[3] (#8d5634)**, preto, **style 'curly'** (cachos volumosos), íris #2e1a10, **lips 'full', nose 'broad'**, blusa vermelha (HOME.fabricRed), argolas douradas + fita métrica, fundo casa, rest 'soft'.
  - ALEX :201 — oval, **skin SKIN[3]**, preto, **'curly_short'**, lips full, nose broad, **facial 'heavy'** (barba cheia), camisa vermelha de botão, fita métrica, rest soft.
  - DAVI (Liam) :206 — child, **skin SKIN[2] (#b97b52)**, preto `kid` (cachinhos), olhos grandes, nariz botão, listrada azul/creme, bochecha corada.
  - ZELIA :211 — round, SKIN[1], grisalho `bun_top`, olhos pequenos, óculos redondos, floral lilás, 3 rugas, rest wry.
  - SIMONE :216 (ruiva #a3402a pixie_side, meia-lua com corrente, cardigã, headset, batom); PEIXOTO :222 (SKIN[0], calvo, bigode, camisa+gravata, crachá); HENRIQUE :227 (SKIN[0], messy, barba cerrada, jaleco aberto, olheiras, fundo noite); BENE :232 (SKIN[2], boné laranja com estrela da vida, bigode branco, uniforme `samu`); CARLA :237 (SKIN[0], chanel assimétrico, jaqueta, caneta na orelha, bloquinho); ARLINDO :242 (SKIN[0], grisalho slick, terno, alfinete, rest smug); ASSESSOR :247 (gel, óculos escuros na cabeça, terno slim); CIDA :252 (79, curly_short branco, cardigã, colar); JAIRO :257 (boné, óculos, macacão); BIEL :262 (boné virado, moletom); NOGUEIRA :267 (fedora, colete, stern); JULIANA :272 (SKIN[2], long); ANTONIO :277 (chapéu de pescador, xadrez); ROSANGELA :282 (SKIN[3], puff crespo, camiseta); WESLEY :287 (capacete de moto, jaqueta moto); MARCIA :292 (shoulder, óculos, cardigã, crachá de cordão, fundo escola); PAULA :297 (SKIN[4], crop crespo, jaleco, estetoscópio); PLANTONISTA :302 (touca cirúrgica, máscara no queixo, estetoscópio, fundo hospital).
- CHARACTERS (nome/papel/idade) :310; `characterColors` :317 (não usado fora do arquivo).
- Geometria: FACE_HW (meia-largura por linha para cada formato) :349; SHOULDERS M/F/K :359; geoFor (olhos/nariz/boca por formato; escolhe EYE_SHAPE por eyes big/small/sexo) :398 — **`eyes: 'narrow'` NÃO muda o formato do olho**, só entra em `expression()` como pálpebra caída de 1 px no neutro (:798, :804).
- Materiais `makeMats` (pele, blush, flush, olheira, barba, lábio, cabelo, sobrancelha) :492.
- Fundo por ambiente `background()` + BG_INK/BG_RIM :523-639.
- Corpo: torsoMask/torsoTone :644-669; drawNeck/neckTone :680-703; faceTone (planos do rosto) :715; faceMask :738; orelhas EAR_L/EAR_R :751-773; drawFaceBase :775.
- Expressões `expression(l, mood)` :796 (por humor: olhos, sobrancelhas, boca, blush, lágrima (só criança), suor, ruga, olheira).
- drawFeatures :864 (órbitas, maçãs, rugas por `lines`, olheiras, blush, sardas, barba, olhos (cílios nas mulheres), sobrancelhas, nariz, boca, lágrima/suor); vividIris :1027; drawNose (moldes button/small/broad/long/medium) :1034; MOUTHS (moldes M/F/criança × 13 expressões) :1061; drawMouth :1129; drawBeard :1163; drawMustache :1206.
- Cabelo: drawHairBack (curly, long, shoulder, bun_low, ponytail, asym) :1247; drawHairFront (todos os estilos) :1334; castShadows :1802.
- drawHat (samu_cap, cap, cap_back, fedora, bucket, helmet, scrub_cap) :1830; drawGlasses (round, rect, half_chain, sun_head) :2015; drawClothes (20 roupas) :2135; drawAccessories :2819.
- Montagem `render()` :2998 (ordem: cabelo de trás → roupa → pescoço → gola por cima → orelhas → rosto → traços → bigode → cabelo da frente → chapéu → sombras projetadas → despeckle → óculos → acessórios → compose com fundo).
- drawClothesOverNeck (refaz a roupa numa camada auxiliar) :3024; makeMatsInto :3043; gradePix (Desgaste) :3048.
- API: `portraitPix(id, mood, {blend, bg})` (cache por id|humor|bg|blend quantizado em 1/20; devolve CÓPIA) :3068; `portraitThumbPix` (32×32, usado no crachá do final) :3087; downsample2 :3092; `portrait(id, mood, {blend, size, bg})` dataURL :3128; `characterFor(who, gender)` :3142 ('EU'→EU_M/EU_F; 'LUCIA'/'ALEX'→ conforme gênero; 'LIAM'→DAVI).
- Risco p/ item 11 (renomear): o nome em `CH[...].name` é montado UMA vez no carregamento do módulo com `PROTAGONIST_FIRST` (hoje 'Luan'/'Amber' em src/engine/text.ts:26). Se o jogador puder renomear, `CHARACTERS.EU_M.name` fica velho (hoje só a galeria usa `CHARACTERS[...]`, mas é armadilha).
- Pequenos mortos: `void l` em drawEars :772; `void h` após return em vividIris :1031; `void neckR; void skinAt` :2158; `void inV` :2703; under_hat :1789 ternário igual.

### faces.ts (1100) — rostos de paciente (close da videochamada, 64×64, fundo transparente)
- `PatientFaceSpec` :53 (seed, age bebe|crianca|adolescente|adulto|idoso, sex, skin idx, hair, hairStyle, shirt, beard, state normal|palido|cianose|vermelho|amarelado|cinza, sweat, eyes abertos|fechados|semi|revirados, droop esq|dir, bruise, swelling, blood/bloodFrom, froth, petechiae, expression dor|calmo|assustado|rindo).
- Geometria: contour (crânio em arco + mandíbula) :111; geoFor (bebê/criança/adulto; idoso com pálpebra +1) :128.
- `tintsFor(base, state, age)` (export; usado também pelo corpo no vídeo) :231 — pálido, cianose (lábio + halo azul-arroxeado), vermelho (rubor), amarelado (pele + esclera), cinza.
- faceTone :270; orelhas :291-311; drawNeckAndShirt (gola redonda ou V pela seed) :313.
- `FaceHair` (curto, raspado, careca, cacheado, crespo, longo, coque, chanel, rabo, bebe, permanente) :358; `faceHairChoices(age, sex)` (export) :362; drawHair (frente/trás por estilo) :375-657.
- MOUTH (calmo, dor, assustado, rindo × adulto/criança/bebê) :662; droopRows (desvio de rima) :686; SHIRTS :705.
- render :707 — ordem: cabelo de trás, pescoço/camisa, orelhas, rosto, estrutura, rugas (idoso), sulcos (somem do lado paralisado), bochecha/pálpebra caída (AVC), barba, rubor/palidez, halo de cianose, hematoma (olho da direita), petéquias, olhos (fechados/semi/revirados/inchados), olheiras, sobrancelhas, nariz, boca (inchada/caída), espuma, cabelo da frente, sombras, despeckle, suor, sangue (cabeça/nariz) → compose.
- irisFor :1058 (azul/verde só em pele 0-1, 25%); castShadows :1065; `patientFacePix(spec)` (cache 64; devolve cópia) :1089.
- Achados: o comentário :717 diz que "os sorteios acontecem sempre (mesma sequência)", mas em :718 o bebê de pele escura (skinIdx ≥ 3) NÃO consome `rnd()` → muda a sequência dos sorteios seguintes (penteado/camisa/hseed/gola) só nesse caso (efeito pequeno; a videochamada passa hair/style/shirt pela spec). :919 ternário redundante (`hairHex === HAIR[0] ? hairHex : hairHex`); :939 ternário com os três ramos = 2; `void sphereN` :1100; `void age` :262.

## 6. Vídeo (Programa VER na mesa + vista da equipe na Intervenção)

### video.ts (856) — orquestra o "palco"
- VIDEO_H 144, VIDEO_W 192 (4:3) :27-29. `VideoFrameOpts {scene, focus, signal bom|fraco|ruim, t, seed, connecting, view ver|campo}` :31.
- `Actor` :48 (look, pose, act, role, âncora, escala k, dir, fases de animação, frames em cache, reach/hold/gaze, lift p/ colo); `Stage` :83 (layout, luz, bg/fg já iluminados, atores, props, flashers, câmeras camX/envX/peopleX, chuva).
- MIRROR (lugares que podem sair espelhados, sem letreiro) :110; LYING :112; kAt (escala pela profundidade) :116; roleDefaults (idade/sexo/roupa por papel: mãe, pai, policial, bombeiro, garçom…) :123; FAMILY/HOME_PLACES :184-185; defaultCast (figurantes quando a cena só dá `people`) :188; poseForAct :229; animFor (fases/período: convulsão, RCP, tremor, agitado, respiração rápida) :254.
- `stageFor(scene, seed, view)` (cache 10) :266; buildStage :276 — lugar (+ espelho 50%), paciente (berço p/ bebê na cama, sofá, cama, parto na cama ou no chão sobre toalha, sentado em sofá/cadeira/banco/longarina/banco de igreja/chão, debruçado com mesa na frente, preso no carro com volante/cinto), colo (mãe com o mesmo tom de pele), poças (sangue/vômito/água) :649, objetos posicionados por `PROP_HOME` (rua, fundo, parede, junto, mesa, chão) :461-515, figurantes (família com tom vizinho ao do paciente; ajoelhados com as mãos no ponto: peito/ferida/cabeça/mão) :517-606, ordem de profundidade, luz (giroflex de viatura/ambulância, fogo, lanterna do celular na rua escura, faróis da equipe à noite) :610-637, câmeras :639-645.
- mkActor :677; `actorFrame` (quadro iluminado em cache por fase) :698; drawWide :720; rain :745; `phoneLook` (vinheta + ruído no escuro) :755.
- `renderVideoFrame(o)` :778 — conectando (bolinhas + barra), 'ambiente'/'pessoas' (câmera vira), bebê/colo = plano médio ampliado ×2, closes via renderClose (meia resolução ×2), phoneLook na VER.
- FACHADA + `farScene(scene)` (cena insegura vista de longe, Intervenção) :815-829.
- `drawVideoFeed(ctx, o, scale)` :832 — congela com sinal fraco/ruim, blocos de compressão 6×6, tremida (`shaky`). Usado em src/client/screens/desk/VideoPanel.tsx:79; renderVideoFrame/farScene em src/client/screens/home/Intervencao.tsx:313-314.
- Riscos: `frozen` (:776) é indexado só pela seed (ligação) e nunca é limpo (cresce 1 entrada por ligação — pequeno, mas sem teto); dois feeds da mesma ligação ao mesmo tempo dividiriam o quadro congelado.

### videoPlace.ts (2127) — 39 lugares (mundo 256×144, quadro VIEW_W=192)
- Tipos SeatKind/FloorKind/SurfaceKind :21-23; Lamp (x,y,r,k,hue quente|sodio|fria|tv|vermelha|azul) :25; Layout (outdoor, floorY, vpY, seat, bed, wall, floor, floorCol, surface, lamps, env, lieY, standY) :35; PlaceCtx (night, dark, seed, r, glow[], usesSeat, usesBed, variant, rain) :57.
- Pincéis: box (caixa com tampo em perspectiva) :79, wallFill :102, baseboard :107, floorGrid :113, floorChecker :143, windowAt (dia/noite, vista céu/muro/prédios/árvore, cortina, grade) :157, door :207, picture :227, plant :234, tree :247, skyFill (estrelas/nuvens/chuva) :262, skyline :287, lampPost (sódio) :315, curb :324, asphalt :330, sidewalk (pedra portuguesa/ladrilho/cimento) :348, grass :374, water :386, rainOver :401.
- Móveis do paciente: drawSofa :415, drawChair (madeira/plástico) :439, drawBed :466, drawCrib (grade da frente em outra camada) :500, drawBench :529, drawCurbSeat :542 (**não usado**), drawBusSeat :547, drawPew :559, drawTable (toalha xadrez opcional) :571.
- L0 (layout padrão) :592. Lugares: sala (3 variações) :612, quarto (3) :703, cozinha (3) :775, banheiro :830, quintal :869, escada :910, porta :930 (**desenha o número "40" na fachada — o mesmo número da casa do protagonista em scenes.ts; toda "porta de casa" de paciente sai com 40**), corredor :957, parkedCar :1008, facades (farmácia com cruz verde) :1027, rua :1084, calcada :1102, ponto_onibus ("LINHA 12") :1115, praca (coreto, igreja, ipê) :1152, feira :1198, estacionamento :1228, posto ("5,89") :1247, bar_porta (letreiro sorteado) :1278, alagado :1322, telhado (variante enchente) :1338, praia :1377, rio :1395, piscina :1410, campo :1440, chacara :1472 (comentário "galão de veneno no canto" sem código :1496), obra :1501, bar ("FIADO SÓ AMANHÃ") :1536, loja (variante farmácia) :1596, mercado :1633, padaria :1696, academia :1727, fabrica :1759, escritorio :1797, escola ("ADIÇÃO 3+4=7") :1823, quadra :1853, igreja :1881, salao ("FELIZ ANIVERSÁRIO") :1924, hospital/UPA ("RECEPÇÃO", "TRIAGEM >") :1957, central :1991, onibus :2018, carro (para-brisa trincado) :2081.
- `PLACES` :2125; `PLACE_HELPERS` :2127 (exportado, **não usado** fora).
- Mortos: `void t0` :133, `void c1` :153, `void c` :371, `yTop`/`void yTop` :1659-1660; :342 `+ (y - y0) * 0.0`.

### videoLight.ts (154)
- LightMode (dia_dentro, dia_fora, noite_dentro, noite_fora, escuro) :14; 6 faixas :16; HUES :28.
- `lightMap(w,h,mode,lamps,{flashlight, headlights})` :34 — ambiente + lâmpadas com queda (1-d²), quantizado em faixas com pontilhado só na fronteira; tom da lâmpada dominante por pixel.
- SHADOW/LIGHT (multiplicadores) :87-101; grade (com "lift" para não virar preto) :103; `applyLight(p, lm, ox, oy)` (memo por modo+faixa+tom) :116; `lightModeFor(outdoor, light)` :150.

### videoLook.ts (336) — UMA aparência por pessoa (plano geral e close batem)
- `Look` :19 (idade, sexo, tom 0-4, pele com estado, lábio, cabelo, penteado FaceHair, barba, óculos, roupa/top/top2/manga/bottom/legs/sapato/chinelo/vestido/chapéu/estampa); TOPS/BOTTOMS/SHOES/PASTEL :51-54.
- `lookFor(seed, spec)` :74 — sorteios sempre na mesma ordem (sexo, tom, cabelo, penteado, barba, óculos, roupa…), a cena só substitui; roupa pelo lugar (praia→banho, obra, fábrica, padaria→avental, academia, escola, quarto à noite→pijama, igreja→vestido/social); cache 400.
- applyWear (fralda, pijama, escolar, obra, motoboy, social, esporte, banho, vestido, farda, bombeiro, socorrista, seguranca, lanchonete, avental, uniforme, jaleco, sem_camisa) :166. A linha :330 quase nunca tem efeito (fralda deixa manga 'curta'/'longa', então a condição `sleeve === 'nenhuma'` falha) — inofensivo.
- `faceLook(L)` (passa tom/cabelo/penteado/camisa/barba para faces.ts) :334.

### videoFigure.ts (2140) — corpo inteiro paramétrico no vídeo
- FigPose = VideoPose + rcp, ajoelhado_maos, colo_adulto, sentado_chao :24; FigSpec :31; FigOut (pix, front = antebraços por cima do paciente, âncora, pontos head/face/mouth/chest/belly/pelvis/mãos/pés/joelhos/neck/wound, hr, lying) :52.
- dimFor (medidas por idade/sexo: bebê, criança, adolescente, idoso, adulto) :94; Arm/Leg/Rig :122-182; ik (dois segmentos) :195.
- rigFor (vista de frente: sentado/curvado/debruçado/preso, encostado, ajoelhado/rcp, agachado, sentado_chao, parto, em pé; `act: 'correndo'` balança as pernas :332; respiração; tremor) :211; scaleRig :381; armsFront (mãos por sinal: no peito, na barriga, no pescoço, na cabeça, braço caído, agitado; por ação: mão na boca, chorando, filmando, apontando, gritando, rindo, abanando, lanterna, segurando criança, escondido, segurando a mão; colo; RCP) :406; ikEnd :587.
- rigTop (deitado visto de cima: caído, lateral/recuperação, convulsão, deformidade de perna, cama, bebê "perna de sapo" e braços em W, de bruços = costas) :598.
- Rasterização: TH_CLOTH/TH_SKIN :765; classe `Fig` (camada + ordem + grupo por pixel) :768; capsule :831; polyShaded :876; ellipseShaded :922; innerLines (contorno interno entre grupos, exceto pares SAME) :936; grupos `G` :975.
- `drawFigure(spec)` :1021 — cabelo de trás, braços de trás, pernas, tronco, cós/sunga/saia, estampa, grávida, colo, pescoço/gola, cabeça (frente/cima/costas), rosto, cabelo da frente, chapéu, cobertor, lençol do parto, braços da frente, sinais, equipamento, recém-nascido, objeto na mão; recorte `front` para quem ajuda :1214.
- woundPoint :1264; face (olhos 1-2 px, sobrancelhas de dor, nariz, boca aberta/torta (AVC), halo de cianose, rubor, barba, óculos) :1293; inHead/faceCoords :1425-1440; hairBack :1442; hairFront :1479; hat (capacete, capacete de obra, boné, quepe, touca) :1585; beltLine/briefs/skirt/collar/clothDetail/pregnant/blanket/tent :1634-1814; BLOOD/stain/trickle/dots :1820-1852; signsOn (sangue tronco/perna/braço/cabeça/rosto/nariz/boca, espuma, vômito, queimadura, hematomas, olho roxo, manchas roxas, placas, suor, choro, molhado, poeira, curativo, livores) :1854; newborn :1981; gearOn (colar cervical, máscara de O2/ambu, manta, toalha, torniquete, tala, compressa, soro, oxímetro) :1994; held (celular, lanterna, bebê, pano, papelão, garrafa, pau, bolsa de soro, caneta, colher, galão) :2071.
- Mortos/estranhos: :969 `- (lightSide ? 0 : 0)`; :1320 `1 * sx * 0`; :1577 `(back ? 0 : 0)`; :1614 `x - F.ox + F.ox`; `void shoulderC` :758; `void k` :1419; :1202 condição redundante.
- Relevante p/ Intervenção (feedback 45-52): os equipamentos desenháveis hoje são colar, máscara O2 (uma só, sem distinguir cateter nasal/Venturi/reservatório), ambu, manta, toalha, torniquete, tala, compressa, soro, oxímetro. **Não há cateter nasal, máscara Venturi, máscara com reservatório, tubo/intubação, pás/monitor de desfibrilador** — se a UI da Intervenção quiser mostrar isso na cena, é preciso acrescentar `VideoGear` (src/engine/types) + um ramo em gearOn (e talvez no close).

### videoProps.ts (736) — objetos da cena de vídeo
- PropSprite {pix, ax, ay} :15; PropHome (chao, mesa, fundo, rua, parede, junto) e `PROP_HOME` :23-30; sprite() com contorno INK :32; R() :41; frasco :44.
- `DRAW` (≈70 objetos) :51-713: remedios, cartela, seringa, caneta_insulina, glicosimetro, garrafa (variante cachaça), garrafa_quebrada, copo, bombinha, produto (variante soda), galao, faca, arma, celular, mamadeira, termometro, balde (variante hda), ketchup, boneco (trote), tijolos, fio, quadro_luz, aquecedor, **oxigenio** (cilindro verde) :219, mochila, toalha, gelo, vasos, pau, vidro, brinquedo, bola, livros, pipoca, videogame, fralda, bengala, sacola, bolo, panela, fumaca, fogo, agua, cones, cachorro, gato, animal (=cachorro), capacete, cadeira_rodas, andador, berco, carrinho_bebe, carrinho, churrasqueira, escada, bicicleta, moto (caída/em pé), carro (batido/poste), viatura ("PM"), ambulancia (faixa laranja/vermelha), onibus, poste, tv, bexigas, andaime, esteira, masseira, maquina, cadeira, mesa_bar, mesa, sofa, cama, fogao.
- `propSprite(prop, k, variant)` (k quantizado em 1/4; cache 300) :718; `drawProp` :731 (não usado no repositório — conferir; video.ts usa propSprite direto).

### videoClose.ts (1217) — closes 96×72 (ampliados ×2)
- CW/CH :24-25; bokeh (fundo = recorte do lugar desfocado 3×3 e ampliado ×4 com pontilhado) :33; pointLight (luz uniforme com o nível do ponto) :85; worldPts :105.
- Rosto: faceSpecOf (traduz sinais → PatientFaceSpec: olhos revirados/semi/fechados, AVC, olho roxo, inchaço, sangue, espuma, petéquias, expressão) :115; closeFace (rosto de faces.ts + luz + tremor/convulsão) :145; faceOverlays (choro, sangue na boca, vômito, poeira, molhado, curativo, placas, capacete/boné, colar cervical, máscara O2/ambu) :170.
- Corpo: mats :256; finish :266; rescuer :276; closeChest (respiração, tiragem com camisa levantada e costelas, fúrcula, grávida, mão no peito, sangue/ferida, queimadura, eletrodos, compressa, manta, mãos da RCP) :280; closeChestBaby :459; closeHandsBaby :595; closeLegsBaby :647; woundOf :702; drawWoundMark :719; burn :734; closeHands (unhas cianóticas/pálidas, soro, oxímetro, glicosímetro) :754; hand :817; closeLegs (calça arregaçada, deformidade, fêmur, osso exposto, torniquete, tala) :840; closeWound (cabeça/rosto/braço/perna; galo, queimadura, exposta, fratura, mordida, picada, ralado, tiro, corte) :913-1025.
- Objeto/chão: SMALL :1030; surface (mesa/criado/balcão/pia/banco/painel/estante; toalha xadrez na cozinha) :1032; floorTexture :1057; closeObject :1109; closeFloor (sangue, vômito, água, ketchup/boneco do trote, fio, cacos…) :1130.
- `renderClose(st, focus, t)` (cache 40 por palco+foco+fase) :1171.
- Achados: **:859 `/coxa|femur/.test('')` é sempre falso** (o teste deveria olhar um texto do ferimento; hoje `fem` depende só de "deformidade sem sangue e não exposta"). :238 elipse com alfa 0.0 (não faz nada). `const lit = (hex) => hex` + `void lit` :173/250. `void drawFigure; void dots; void TH_CLOTH; void G` :1214-1217 (dots/G/TH_CLOTH são usados de verdade; só drawFigure é morto). Tipo `VideoBodyPart` importado e não usado :21. **Import circular** video.ts ⇄ videoClose.ts (funciona porque só é usado em tempo de chamada, mas é frágil).

## 7. Jornal

### newsPhotoKit.ts (916)
- NEWS_W/H 144×96 :17-18; tons `T` (ink 0 … paper 1, níveis n/8 que caem limpos na retícula 4×4) :21.
- classe `Tone` (lona de tons float): get/set/mul/fill/rect/mulRect/frame/vgrad/hgrad/scan/poly/polyEdge/ellipse/mulEllipse/ball/ring/line/radial/text (fonte 3×5 com halo)/sharpen ("nitidez de clichê") :38-277.
- screenThreshold (Bayer 4×4) :282; `printTone(t, ink, paper)` → Pix :287.
- `Local` (referencial espelhável u/v para veículos; texto nunca espelhado) :300.
- Pessoas: Pose (stand, walk, armUp, armsUp, phone, point, carry, hip, cross, wave) :368; PersonOpts :370; classe `Fig` (figurinha com NaN = transparente, carimbo com contorno) :393; bodyDims :466; personFig :477; person :630; crowd :635.
- Veículos: ambulanceL (≈82×44, "REGULAÇÃO" na lateral, giroflex, portas abertas) :693; ambulanceS :743; flash :774; policeCar ("POLÍCIA") :785.
- Cidade: windows :810, treeCrown :817, tape (zebrada) :830, rain :840, bars :850, roofTiles :855, truss/trussV :866-875, palm :878, streetLamp :898, bush :909.

### newsPhotos.ts (1641) — 34 fotos
- NEWS_CROP 96×64 :41-42; NewsKind/NEWS_KINDS :44-116; PhotoDef {draw, crop, sharpen} :118; fade :127; shadedFace :135.
- `PHOTOS` :155-1595 (cada uma com o seu recorte): ambulancia (farmácia, "REGULAÇÃO", curiosos) :158; hospital ("HOSPITAL REGIONAL", "PRONTO-SOCORRO") :188; corredor (macas, "SILÊNCIO") :229; central (telão "REGULAÇÃO", operadores) :295; coletiva ("SAÚDE+ GESTÃO") :346; garagem ("BASE VILA ESPERANÇA", "FORA DE SERVIÇO") :413; vip (casa do vereador, palmeira) :450; rua (RCP na calçada, "PADARIA") :486; bar ("BAR DO NENO", viatura) :538; dengue (mosquito em close) :588; fumace :650; veneno (galão com caveira, "SODA") :691; cronometro :748; show ("EXPO AURORA") :799; grade (grade tombada, maca) :835; enchente (bote) :890; condutor (Seu Bené, "BENEDITO") :934; retrato (vereador) :1006; planilha ("CONFIDENCIAL", "USA POR PLANTÃO") :1053; anonimo :1098; poltrona :1128; casa (nº "112") :1174; policia (fita zebrada) :1214; calor ("34°C") :1242; abelhas :1276; multidao ("QUEREMOS AMBULÂNCIA") :1323; chuva :1351; predio :1391; fogo :1416; escola ("ESCOLA ESTADUAL") :1456; tribunal ("FÓRUM") :1489; camara ("CÂMARA MUNICIPAL") :1514; parque :1539; generico (a Matriz) :1562.
- API: newsPhotoCrop :1612; `newsPhotoPix(kind, {crop})` (re-renderiza a cada chamada — sem cache de Pix) :1617; `newsPhoto(kind, {crop, scale})` dataURL em cache :1631. Tipo desconhecido → 'generico'.
- Nenhum texto "SAMU"/"192" (ok com o HANDOFF). A ambulância escreve "REGULAÇÃO".

## 8. Finais e título — endingArt.ts (1494)
- EndingKind/ENDING_KINDS (11): desenho_davi, desenho_cadeira, cracha_prego, calcada_moveis, telefone_escuro, gaveta, quarto_alugado, escritorio_ar, mural, bolo_porta, titulo :17-42. EndingOpts {blend, time, gender} :44.
- Giz de cera: CRAYON (paleta) :58; waxDot :75; crayon (traço tremido) :87; inPoly :107; scribble (preenchimento em zigue-zague) :118; rectPts/circlePts :145-161; crayonText (fonte 3×5 como esqueleto) :164; paperSheet (folha sulfite sobre a mesa) :173; crayonHouse :198; crayonDog (Ozzy de giz) :236; stroke :291.
- Vinhetas: desenhoDavi (você à mesa com fone e telefone vermelho, casinhas acesas ligadas por fios pontilhados, ambulância na rua, coração, Ozzy de giz, assinatura "LIAM") :304 — pele do protagonista em giz `CRAYON.skin` (#e8b48a, clara) com contorno #b97b52; cabelo preto (com coque/cabelo comprido no F). desenhoCadeira (tudo cinza: "94", ar-condicionado, mesa enorme, Liam pequenininho no canto) :519. crachaPrego (porta da cozinha, crachá pendurado com retrato `portraitThumbPix(EU_M/EU_F)`, "DR./DRA. <PROTAGONIST_FIRST> MOURA", "MAT 0417-4", logo Saúde+) :625. calcadaMoveis (despejo; cônjuge `figurePix(ALEX|LUCIA)` triste + Liam triste segurando o desenho da ambulância; sem o Ozzy) :714. telefoneEscuro (telefone 3× tocando no escuro, a mão que não atende) :801. gaveta (gaveta aberta: manual, diário, post-its, caixa de mudança, porta-retrato virado) :858. quartoAlugado (quarto alugado, você sentado com a mão no peito, celular "SOS", chuva) :915. escritorioAr (você na cadeira executiva, índice 94, ar-condicionado) :1010. MURAL_FRAMES (8 molduras para a UI legendar) :1095; mural (polaroids vazias, fio vermelho, recorte da Gazeta, desenho do Liam) :1109. plaster :1161; darkBands :1170; half (desenha a 160×90 e amplia ×2) :1189; graded :1196. boloPorta (Seu Antônio e esposa com o bolo de fubá na porta, de dia; familyPhoto; Ozzy ×2 abanando) :1200. titulo (mesa da regulação de madrugada: janela, quadro, tubo, monitor com mapa, papéis, caneca, headset, **familyPhoto ×2** com brilho quente, telefone, manual) :1305; tituloAnim :1379.
- STATIC (em cache: desenho_davi, desenho_cadeira, gaveta, mural) :1396; WARM (gradação do Desgaste só em cracha_prego, mural, bolo_porta) :1403; `renderEnding(kind, o)` :1415 (tipo desconhecido → telefone_escuro); `drawEnding` :1490. Usado em src/client/screens/Ending.tsx:66 (blend 1 só no final "secreto").
- Achados: `calcada_moveis` nunca é gradado (renderEnding faz `out.setMap(null)` e não está em WARM), embora a galeria mostre uma variante "F (Alex) · blend .8" — o blend não muda nada. O Pix `out` (:1412) é compartilhado e o mapa fica "grudado": depois de um `bolo_porta` com blend, os caminhos STATIC/cracha_prego não resetam o mapa e a "poeira na luz" do crachá (:1448) sai gradada pelo mapa anterior (efeito mínimo). `void CRAYON` :1494 redundante. O crachá usa `PROTAGONIST_FIRST[c.g]` fixo (para o item 11 — renomear — é preciso passar o nome escolhido em EndingOpts).

## 9. Família: aparência atual × decisões do HANDOFF (o que mudar e onde)

A família aparece em 4 lugares de código: (a) retratos `CH` em portraits.ts; (b) corpos `BODIES` em figures.ts (cenas da casa e finais); (c) a miniatura `familyPhoto` em props.ts (cozinha, mesa da central, título, bolo_porta); (d) ícone `foto` em icons.ts (rostos em `F` #b97b52). Os rostos de vídeo (faces.ts/videoLook) não envolvem a família.

| Quem | Hoje (retrato portraits.ts) | Hoje (corpo figures.ts) | Decisão HANDOFF | O que mudar |
|---|---|---|---|---|
| ALEX (marido da Camille) | :201 SKIN[3] #8d5634 (moreno), cabelo preto `curly_short` (cachos), barba cheia `heavy`, lábios cheios, nariz largo, camisa vermelha, fita métrica | :55 SKIN[3], preto, `curly_short`, `beard: true`, camisa vermelha com fita | **branco, cabelo preto** | portraits.ts:203 → `skin: SKIN[0]` ou `SKIN[1]`, `style: 'short'` (ou 'messy'/'slick') — cabelo liso preto já existe; tirar `lips: 'full', nose: 'broad'` (usar 'medium'); barba: pode manter (`'stubble'` ou `'heavy'`) — decisão de estilo; iris pode ficar escura. figures.ts:56 → `skin: SKIN[0]/[1]`, `hairStyle: 'short_m'`, `beard` opcional (stubble). |
| LÚCIA (esposa do Thiago) | :195 SKIN[3] (moreno-escuro), `curly` (cachos volumosos), lábios cheios, nariz largo, argolas, blusa vermelha | :50 SKIN[3], `curly_big`, brincos | **asiática, pele clara, bonita** | portraits.ts:197 → `skin: SKIN[0]` (#f1c7a5) ou um tom novo levemente mais amarelado (p.ex. '#f0cfae' — SKIN é só um array de hex; um hex literal funciona, `skinRamp` aceita qualquer cor), `hair: HAIR[0]`, `style: 'long'` ou 'shoulder' (lisos já existem; 'long' tem fios caindo à frente dos ombros), `nose: 'small'`, tirar `lips: 'full'`, `eyes: 'narrow'` só baixa a pálpebra no neutro (portraits.ts:798/804). **Para olho amendoado de verdade é preciso criar um formato novo** em portraitKit.ts EYE_SHAPES (:629) — p.ex. `almond: { lid: [2,1,1,0,0,1,2], bot: [2,3,3,3,3,3,2], iris: 3, irisTop: 1, irisH: 2 }` — e escolhê-lo em geoFor (portraits.ts:430) por um novo campo do Look (p.ex. `eyeShape?: 'almond'`), já que hoje a escolha é só big/small/fem/adult. Sobrancelhas 'thin' ficam bem. figures.ts:50 → `skin: SKIN[0]`, novo `hairStyle` liso comprido (não existe: os femininos são `curly_big`, `bun_low`, `bun_top`) — criar p.ex. `'straight_long'` em `drawHeadAndHair` (:185) e no `lying` (:604), e acrescentar ao union Body.hairStyle (:25). Manter brincos/fita/blusa vermelha (papel de costureira). |
| DAVI = Liam | :206 SKIN[2] #b97b52 (moreno médio), preto `kid` (cachinhos crespos via paintCurls) | :59 SKIN[2], preto `kid` | **branco** | portraits.ts:208 → `skin: SKIN[0]` ou `SKIN[1]`; cabelo pode virar castanho (HAIR[1]/[2]) ou preto; se o filho é de Thiago/Camille (SKIN[1]) com cônjuge branco/asiática clara, `SKIN[0]`/`[1]` coerente; o estilo `kid` é cacheado (células Voronoi) — para cabelo liso de criança, usar um estilo liso (`short` em escala de criança fica grande; melhor criar 'kid_straight' ou reaproveitar 'crop' com r maior). figures.ts:60 → `skin: SKIN[0]/[1]`. |
| familyPhoto | props.ts:641-643: você #d9a57e (SKIN[1]), cônjuge **#8d5634**, Liam **#b97b52** | — | coerente com os acima | props.ts:642 → pele do cônjuge #f1c7a5/#d9a57e; :643 → Liam #f1c7a5/#d9a57e. A foto não distingue gênero do cônjuge (sempre "de vermelho", cabelo preto 2 px) — ok para Lúcia e Alex. |
| ícone `foto` | icons.ts:303-315 rostos `FF` (#b97b52) | — | — | trocar `F` por `f` (#e8b48a) nos três rostos se quiser coerência. |
| Protagonista | EU_M :185 / EU_F :190 SKIN[1], nomes `Dr. ${PROTAGONIST_FIRST.M} Moura` (hoje Luan/Amber) | EU_M/EU_F :67/71 SKIN[1] | Thiago / Camille (+ renomear) | Trocar os nomes em src/engine/text.ts:26 (fora da arte). Em portraits.ts o `name` é calculado no carregamento do módulo; endingArt.ts:688 usa PROTAGONIST_FIRST direto — para renomear livremente, passar o nome por parâmetro. |
| Zélia | SKIN[1] grisalha | SKIN[1] | (sem mudança) | — |

Observações:
- O id interno do Liam continua `DAVI` (retrato, sprite, cena, final `desenho_davi`). `characterFor('LIAM')` → DAVI (portraits.ts:3147).
- A troca LUCIA↔ALEX é feita fora da arte: src/client/ui/Portrait.tsx:15, src/client/screens/home/Home.tsx:105/122, endingArt.ts:774 (calcada_moveis) e portraits.ts:3146.
- Doc ARTE.md/README ainda descrevem Lúcia "cachos volumosos, pele morena" e Alex "cachos curtos, pele morena", e "Luan/Amber" — atualizar junto.
- Nada mais na arte depende da cor de pele da família (o Desgaste usa as âncoras SKIN em palette.ts:207 — trocar para SKIN[0] continua coberto; um hex fora do SKIN ainda é gradado pelas âncoras vizinhas).

## 10. Como acrescentar coisas novas

- **Retrato novo**: 1) acrescentar o id ao union `CharacterId` (portraits.ts:56); 2) uma entrada em `CH` (portraits.ts:184) com sex/face/skin/hair/style/clothes/c1/bg (+ opcionais); CHARACTER_IDS/CHARACTERS saem sozinhos; 3) se precisar de penteado/roupa/acessório novo: acrescentar ao union (HairStyle :83, Clothes :105, Acc :126…) e um `case` em drawHairBack/drawHairFront (:1247/:1334), drawClothes (:2135) ou drawAccessories (:2819); 4) `characterFor` (:3142) se o "who" das falas tiver outro nome; 5) aparece sozinho na galeria (gallery.ts:63).
- **Pessoa de corpo inteiro nova na casa**: `CastId` (figures.ts:12) + `BODIES` (:49) + `SceneCast.id` (scenes.ts:105) + `PHASE` (scenes.ts:2856) + `marks` em cada cômodo (scenes.ts:2719…). Extra só de final: `ExtraId`/`EXTRA` (figures.ts:36-47) + `extraFigurePix`.
- **Objeto inspecionável novo (item 56/58)**: 1) desenhar em props.ts (função `(p, x, y, …)` com cores quentes; o Desgaste vem do setMap); 2) acrescentar o id em `SCENE_OBJECTS` (scenes.ts:63); 3) para cada cômodo, uma entrada em `OBJECTS[bg]` (scenes.ts:2549) com `o(x, y, w, h, 'back'|'front', draw?, anim?)` — o retângulo é o que `objectRect` devolve para o clique; 4) se o objeto altera o cenário (trocar um móvel), consultar `has.has('id')` dentro do `xxxBack` do cômodo; 5) ver na galeria (gallery.ts SAMPLE :183). A camada estática entra no cache por lista de objetos (layerCache máx. 24 — com muitos objetos/dia, aumentar).
- **Cômodo/cena nova (p.ex. banheiro, quarto do casal, cozinha de dia, refeitório para o almoço das 13h, ida/volta do plantão)**: 1) `SceneBg` em src/engine/types.ts:657; 2) `SCENE_BGS` (scenes.ts:60); 3) funções `xxxBack/Front/Light/Anim/Place/Seats` e uma entrada em `BGS` (:2709) com `warm`, `marks`, `ozzy`, `ozzySleep`, `objects`; 4) `OBJECTS[bg]` se houver objetos; 5) a galeria (gallery.ts:183) usa `Record<SceneBg,…>` — o TypeScript obriga a acrescentar um SAMPLE.
- **Pose nova do Ozzy (correr/latir)**: novos quadros em `FRAMES` (dog.ts:39), `DogPose`/`DOG_POSES` (:20-21), `frameKey` (:170); o deslocamento pela sala tem de ser feito em renderScene (scenes.ts:2924-2929), hoje só há lugares fixos.
- **Final novo**: `EndingKind`/`ENDING_KINDS` (endingArt.ts:17-42), função de desenho, ligar em STATIC (se estático) ou no switch de renderEnding (:1433), WARM se for doméstico; conteúdo em src/content/endings.ts.
- **Foto de jornal nova**: `NewsKind`/`NEWS_KINDS` (newsPhotos.ts:44-116) + entrada em `PHOTOS` com `draw(t: Tone)` e `crop`; peças em newsPhotoKit.ts.
- **Ícone novo**: uma grade 16×16 em `GRIDS` (icons.ts:58) com as letras de `ICON_PAL`.
- **Lugar/objeto/equipamento de vídeo**: `VideoPlace`/`VideoProp`/`VideoGear` em src/engine/types.ts (:208/:235/:253) + `PLACES` (videoPlace.ts:2125) / `DRAW`+`PROP_HOME` (videoProps.ts) / ramo em `gearOn` (videoFigure.ts:1994) e em `faceOverlays`/`closeChest` (videoClose.ts) para o close.

## 11. Bugs, código morto e riscos (resumo)
1. **Família fora do HANDOFF** (seção 9): Alex e Lúcia SKIN[3] com cachos; Liam SKIN[2]; familyPhoto e ícone `foto` com peles morenas.
2. **Não há olho amendoado** (EYE_SHAPES.fem === adult; `eyes:'narrow'` não muda o formato) — necessário para "asiática".
3. **Pix compartilhados** devolvidos por `renderScene` (scenes.ts:2900), `renderCityMap` (mapRender.ts:984) e `renderEnding` (endingArt.ts:1412): quem guardar a referência vê o conteúdo mudar na próxima chamada.
4. endingArt: `calcada_moveis` ignora o blend; mapa do `out` fica grudado entre chamadas.
5. videoClose.ts:859 regex sobre string vazia (ramo "fêmur" nunca usa o texto do ferimento).
6. Import circular video.ts ⇄ videoClose.ts.
7. video.ts `frozen` sem limite (1 entrada por ligação).
8. faces.ts:718 bebê de pele escura não consome o `rnd()` (quebra a promessa de sequência fixa — efeito pequeno).
9. videoPlace `porta` escreve "40" (número da casa do protagonista) em toda porta de paciente.
10. scenes.ts cozinha `sapato_fechado` tem retângulo clicável mas nada desenhado.
11. Nome do protagonista "congelado" em `CH[...].name` (portraits.ts:186/191) e lido como constante em endingArt.ts:688 — atenção ao item 11 (renomear).
12. Código morto/sem uso: scenes.ts `floorTiles`, `roomFrame`, `nightWindow`, `door`, `bulbLight`, `void mix/nail`; videoPlace `drawCurbSeat`, `PLACE_HELPERS`; pix.ts `BAYER8`; font.ts `wrapText`; palette.ts `shadeCold`; icons.ts `iconSprite`; portraits.ts `characterColors` (sem uso externo); dog.ts `dogPortrait` (só a galeria); videoProps `drawProp`; vários `void x` e ternários com ramos iguais (figures.ts:320/487/515/577, portraitKit.ts:754/759/824, faces.ts:919/939, videoFigure.ts:969/1320/1577/1614, videoClose.ts:238/1214, mapRender.ts:1025).
13. Fonte 3×5 sem '@' (cai em '?') — se a arte algum dia precisar escrever "#%!#@$" (xingamento censurado), o '@' sai '?'. A transcrição usa fontes web, então não afeta hoje.
14. Docs (ARTE.md, art/README.md) dizem "Luan/Amber", "Lúcia… pele morena", "Alex… cachos curtos, pele morena" — desatualizados frente ao HANDOFF.
15. Galerias (gallery.ts, videoGallery.ts) tocam `document` no topo — não importar em testes/Node (não são reexportadas pelo index, ok).
16. Para a Intervenção (itens 45-52): sem desenho de cateter nasal, Venturi, máscara com reservatório, tubo/intubação, monitor/pás de desfibrilador; só `mascara_o2`, `ambu`, `eletrodos`, `oximetro`, `soro`, prop `oxigenio`.
17. Para a casa (itens 54-56): Ozzy sem corrida/latido; objetos por dia insuficientes; layerCache de 24 pode ficar pequeno.

## 12. Linhas lidas (100% de cada arquivo)
    148 README.md
    299 dog.ts
   1494 endingArt.ts
   1100 faces.ts
    730 figures.ts
    209 font.ts
    365 gallery.ts
   1015 icons.ts
    109 index.ts
   1025 mapRender.ts
    916 newsPhotoKit.ts
   1641 newsPhotos.ts
    293 palette.ts
    666 pix.ts
   1164 portraitKit.ts
   3152 portraits.ts
    733 props.ts
   2957 scenes.ts
    121 sprite.ts
    856 video.ts
   1217 videoClose.ts
   2140 videoFigure.ts
    209 videoGallery.ts
    154 videoLight.ts
    336 videoLook.ts
   2127 videoPlace.ts
    736 videoProps.ts
  25912 total

Todos lidos integralmente com Read/cat em blocos (index, sprite, palette, pix, font, dog, videoLight, videoGallery, gallery, videoLook, figures, props, icons, mapRender, scenes 1-2957, portraitKit 1-1164, portraits 1-3152, faces 1-1100, video, videoPlace 1-2127, videoFigure 1-2140, videoProps, videoClose 1-1217, newsPhotoKit, newsPhotos 1-1641, endingArt 1-1494, README).
