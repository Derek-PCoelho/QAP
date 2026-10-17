# 05 — Motor (`src/engine/**`) — estudo linha a linha

Lido 100%: 20 arquivos, 8.839 linhas (contagem `wc -l`). Nenhum arquivo do repositório foi alterado.

| arquivo | linhas | arquivo | linhas |
|---|---|---|---|
| shift.ts | 2931 | video.ts | 302 |
| types.ts | 1279 | content-api.ts | 231 |
| game.ts | 693 | text.ts | 229 |
| home.ts | 638 | save-check.ts | 226 |
| field.ts | 467 | grading.ts | 209 |
| bot.ts | 382 | state.ts | 190 |
| city/map.ts | 319 | simone.ts | 185 |
| city/path.ts | 162 | util.ts | 100 |
| generator.ts | 86 | endings.ts / infinite.ts | 75 / 75 |
| qcodes.ts | 60 | **total** | **8839** |

**Verificação (sem alterar nada):**
- `npx tsc --noEmit -p tsconfig.json` → saída vazia, exit 0 (sem erros).
- `npx vitest run` → **13 arquivos, 140/140 testes passando**, ~21 s, exit 0.

---

## 1. Mapa dos arquivos

### util.ts (100)
- `rngNext` mulberry32 (:4), classe `Rng` mutável (:14–49: next/int/pick/chance/shuffle/weighted), `hashString` FNV (:51), `clamp`, `hm('HH:MM')→min` (:65, lança erro se inválido), `fmtTime`, `fmtMoney`, `fmtDur`, `uid`, `sumBy`.
- **Código morto:** `uid`, `sumBy`, `fmtMoney` não são usados em nenhum lugar de `src/` (só a definição).

### qcodes.ts (60)
- `QCODES` tabela de códigos Q (:3), `splitQ(text)` marca códigos no texto do rádio (:47). Trata `QRR n`.

### city/map.ts (319)
- Grade 64×40 (`MAP_W/H` :8–9), `MIN_PER_TILE=0.25` (:11), `DISPATCH_DELAY=1` (:13).
- `BAIRROS` (9 bairros, :26), `STREETS` (:51; numeração métrica 100 m/tile), `LANDMARKS` (:102): central, Regional (dest REG), UPA Norte (UPA), Maternidade (MAT), 3 bases, **casa do protagonista = Rua das Acácias, 40 — Vila Esperança** (:110; usada no dia 10, Henrique erra o endereço), escolas etc.
- `grid()` memoizada (:135), `isRoad`, `bairroAt`, `norm` (:183), `resolveAddress` (:222 → `ok|sem_rua|invalido|bairro|marco`), `landmarkAtAddress` (:257, ignora casa/base), `landmarkPos` (cacheia `pos` no próprio objeto exportado), `destLandmark`, `streetRanges`, `randomAddress`, `invalidAddress` (:308, para trotes), `addrText`.

### city/path.ts (162)
- `tileCost` com alagamento do dia 17 (:15), `trafficFactor` por hora (:27: 7–8h30 ×1.3; 11h45–13h15 ×1.15; 17–19h ×1.35), `nearestRoad`, `route()` Dijkstra com heap binário (:58; sem rota ⇒ linha reta ×4 `blocked:true`), `addressTarget` (:148; endereço inválido cai na ponta da rua ou centro do bairro), `streetCount` (:160) — **morto** (não usado).

### types.ts (1279) — tipos centrais
- Básicos (:7–41): `Resource USA|USB|ORI|TROTE`, `Color`, `TruthSev = Color|'trote'`, `Support PM|BOMB`, `Dest REG|UPA|MAT`, `Referral`, `Gender`, `Difficulty narrativo|padrao|real`, `Mode campanha|infinito|simone`, `Phase`, `CallerType`, `VarName` (10 vars), `KeyPatient` (7), `Source`, `FamilyMember lucia|davi|zelia` (ids internos — ainda "lucia"/"davi" mesmo com Alex/Liam), `VoiceId` (tem 'alex', 'lucia', 'davi').
- `Ctx`/`EffCtx` (:46–72), `Txt/Cond/Effect`.
- Falas: `LineDef` (:81), `ExtraQ` (:93: `locked`, `unlocks`, `kind pergunta|confronto|fala|acalmar`, `repeat`), **`LinkDef`** (:109: `a`,`b`,`kind contra|confirma`,`insight`,`unlock`,`onFind`).
- Verdade: `RiskDef` (:121 good/bad/needs/guideBonus), `TruthDef` (:131 dx, sev, ok, sup, dest, ref, must, risk, inevitable, key, prankKind, noPenalty, best), `WorsenDef` (:149), `GuideRef`, `RadioTexts`, `DiaryDef`.
- Vídeo (:208–406): lugares/poses/pele (`VideoSkin` normal|palido|cianose|vermelho|amarelado|cinza)/sinais/props, `VideoHint` (cena escrita junto da ligação), `VideoSpot` (`unlocks` → já desbloqueia perguntas `locked`!), `VideoDef`, `VideoRT`.
- Intervenção (:411–543): `FieldActionDef` (kind info|critico|ajuda|neutro|dano; `needs/after/until/shows/scene/secures/hurts/endsPrank`), `FieldCaseDef` (`qrr`, `radio`, `vitals`, `vitalsAfter`, `start`, `decay`, `dest`, `scoop`, `treatOnScene`, `unsafe`, `prank`), `FieldCaseRT`, `FieldShift`.
- `CallDef` (:545): `note/noteWrong/noteFixed`, `q` (respostas por id de pergunta), `extra`, `callback`, **`links`**, `truth` (obj ou função), `worsen`, `guide`, `radio`, `diary`, hooks `onAnswer/onStamp/onResolve`, `patience`, `special mci|simone|peixoto_teste`, `raw`, `nightDeath`, `noFollowup`, `mci`, `impedimento`, `video`, `cena`.
- Cenas: `DLine`, `Choice` (:636: `needMoney`, `affectionate`, **`needLink`**, `hint`), `SceneNode`, `HomeObject` (:659 x/y/w/h, desc), **`InspectDef`** (:669 objects + links), `SceneDef` (:675 `inspect?`).
- `BillDef`, `ShopItem`, `InterludeDef` (:706: teaser, scene, bico, bills, shop, familyLacos, onBico/onFamily/onRest, noBico, `field` {cases, radio}, `pre`).
- `TimelineDef` (:745 kind radio|interfone|simone|script|pedido|aviso), `ShiftScriptCtx` (:759).
- `DayDef` (:792): fleet, goal{maxUSA,bonus}, newspaper, handover, calls, timeline, endScene, interlude, flood, **noVacancy**, reportField, simoneAccuracy, onStart, **links** (do dia), tutorial. (:821 comentário solto "escala de tempo especial" sem campo — resto de código removido.)
- `QuestionDef` (:840 group base|protocolo|ferramenta) — **não tem categoria (Clínico/GO/Trauma/Outros)**.
- Estado: `UnitStatus` (:853 QRV|DESLOC|LOCAL|TRANSP|RETIDO|RETORNO|PANE|FORA), `UnitState`, `RadioMsg`, `PendingRequest` (:885 kind timeline|piora|recusa|retencao|hostil|**vaga**), `ShownLine` (kind inclui 'insight'), `Decision` (:908), `Verdict` (:926), `CallOutcome`, `CallRT` (:942: `asked`, **`unlocked`, `found`, `tried`, `wrongLinks`**, patience, worsenIdx, truthPatch, noteRight/noteText/noteUrgent, mapLookup, guide, careAt, gen, calmed, followOf, holdCount, mismanaged, riskFrom, dxAtStamp, tarm, talk, video, videoTries).
- Simone: `RegId`, `TarmInfo`, `TarmRegState`, `TarmShiftState`.
- `SchedEvent` (:1047 kinds), `ReportItem`, `ModalMsg`, `ShiftState` (:1077: …, **`inspect: boolean`**, coffee/coffeeUntil, semSono/cochilo/cochilos/noites, fast, photoUsed, diaryRead, noVacancy, flood, peixotoCalls, pauseUntilReal, tarm, video).
- `DiaryEntry`, `BoardEntryIn/BoardEntry` (:1154: id, kind trote|frequente|doc|postit, title, text, num, day, count), `MemberState`, `BillsState`, `DayRecord`, **`GameState`** (:1199), `HomeState` (:1238: step, timeOff, field, sceneId, node, lineIdx, paid, bought, **found, tried, inspected**, log, sceneDone, ozzy), `GameOverInfo`, `EndingInfo`, `InfiniteState`.
- Doc errados: `WorsenDef.unless` doc fala em `'sempre'` mas o tipo é `'nada'` (:151–152); doc de `GameState.lastSave` (:1232) fala de "família fora" (comentário trocado).

### content-api.ts (231)
- `GuideOption/Step/Script` (minijogos de orientação; `slow` = escala do relógio), `TemplateTruth/Params/Def` (banco procedural), `EpilogueThread` (:308 ok/when/good/bad), `EndingTexts` (:318 ruim/normal/bom/secreto/chairOffer/gameover/threads/credits), `AchievementDef`, `HomeContent` (:336 baseBills, shop, genericScene, genericBico, **pointlessInspect**), **`DeskDoc.clues`** (:349 pistas do documento no Modo Inconsistência), Simone (`SimoneWorld`, `SimoneEvent`, `SimoneDayDef`, `SimoneContent`), `Content` (:423: days, simone, questions, manual, fleet, guides, bank, endings, achievements, home, docs, **`defaults(q, call, ctx)`**, video{fromDay,credits,build,remoteLines,intro}, field{cases}, effects, names, version, fleetForDay, manualUntil).

### state.ts (190)
- **`SAVE_VERSION = 3`** (:9). `VAR_RANGE`/`VAR_LABEL` (:11–35).
- `NewGameOpts` (:37: gender, difficulty, mode, seed, variable, startDay) — **sem nome customizado**.
- `newGameState` (:47): dinheiro 150; vars desgaste 10, lacos 5, integridade 7, humanidade 3, lealSimone 5, lealHenrique 5, intimBene 0, pressao 4, wesley 5, emprego 6; família lucia/davi/zelia 'bem'; contas (aluguel 100); totais.
- `randOf` (RNG no estado), `makeCtx` (:102), `makeEffCtx` (:124: set/unset/add com clamp e sink/pay/keyPatient/source/diary (resolve tokens na hora → texto "assado" no save)/board (id repetido incrementa count)/doc/toast/family/achievement).
- `simoneAccuracy` (:183): precisão do post-it da Simone: 0.9 até o dia 9, depois 0.75; ±lealdade; real −0.15; narrativo = 1.

### save-check.ts (226)
- Limites (:12–20), `MODES/DIFFICULTIES/PHASES/HOME_STEPS/MEMBER_STATUS/DIARY_KINDS/...` (:24–35), `SaveError` (:38).
- `walk()` (:75) iterativo: números finitos ≤1e15, strings ≤50k, arrays ≤20k, profundidade ≤32, sem `__proto__/constructor/prototype`.
- `checkHome` (:107): exige `step` válido, `lineIdx`, arrays `paid/bought/found/tried/log`, **`inspected` e `sceneDone` booleanos obrigatórios**, `field` (cases/idx/phase/results/clock/extra).
- `checkState` (:132): campos obrigatórios; família exige as chaves `lucia/davi/zelia`; `bills` com todos os campos; diary/board/history formatos; `shift` só formato raso; `shadow` uma vez só (aninhado proibido).
- **Não confere `st.v`** e **não rejeita campos desconhecidos** (dá para acrescentar campos opcionais sem quebrar saves).
- `parseSave` (:211), `checkSave` (:225).

### text.ts (229)
- Comentário de cabeçalho ainda com Luan/Amber (:3–17).
- **`PROTAGONIST_FIRST: { M: 'Luan', F: 'Amber' }`** (:26), `SON_NAME='Liam'` (:28), `spouseIsWife`, `spouseName` (Lúcia/Alex).
- `GENDERED` (:40) — **`nome`/`NOME` são calculados uma vez no carregamento do módulo** a partir de `PROTAGONIST_FIRST` (:45–46). `SPOUSE` (:73).
- `beneForm(s)` (:82): intimBene ≥7 → primeiro nome; ≥3 Doutor(a); senão "Central".
- `resolveTokens(str, g, s?)` (:90): `{{...|id}}` preservado (resolve tokens dentro), `{x}`, `{m:a|b}`, `{c:a|b}`, `{bene}`, `{sobrenome}` = 'Moura' fixo.
- `parseMarkup/stripMarkup/cluesIn` (:147–181) — marcação de pistas.
- `normLine/normLines` (:198) — "QUEM: fala", "[ruído]".
- `protagonistName(g)` (:227) — **sem estado** (não serve para nome customizado).
- Para renomear (item 11): precisa `GameState.name?` (opcional; save-check aceita), `resolveOne` ler `s?.name ?? PROTAGONIST_FIRST[g]`, `beneForm`, `protagonistName(g, s?)`. Fora do motor usam `PROTAGONIST_FIRST`/`protagonistName`: `content/base.ts:222`, `content/days/d18.ts:41`, `client/art/portraits.ts:186–191`, `client/art/endingArt.ts:688`, `screens/LoadGame.tsx:20`, `NewGame.tsx:33,52`, `Report.tsx:85`, `simone/TriagePanel.tsx:116`, `simone/SimoneNew.tsx:41`. 22 arquivos de conteúdo usam `{nome}`.

### grading.ts (209)
- `BONUS` USA 25 / USB 15 / ORI 8 / TROTE 10, `NOTE_COST 10`, `WARNING_COST 20` (:4–6).
- `grade()` (:32): trote (TROTE ok, ORI sem penalidade, viatura = nota); caso real: aceitável → `sem_justificativa` se faltou `must` (meio bônus + nota), `defensavel` se mais de um aceitável (melhor +5), senão `correto`; ORI com `ref` errado → sem bônus; TROTE/ORI em grave → `dispensou` (advertência + sindicância se óbito); viatura acima → `excesso` (nota); abaixo → `falta` (advertência), exceto USB sem USA livre (`noUSA`, protocolo RM4) = defensável. Complementos: faltou apoio → advertência + `safety`; destino errado (dia ≥9) → nota. Cor de classificação errada → meio bônus. Hora de ouro: vermelho certo em ≤60 s reais → +10.
- `verdictLabel`, `decisionLabel`.

### generator.ts (86)
- `phoneNumber`, `REL_LABEL`, `fillParams` (nome/idade/sexo/endereço; trote 60% endereço inválido), `buildGeneratedCall` (template + verdade + params → CallDef).

### infinite.ts (75)
- `infiniteDay` (cache em módulo por `seed:turno`; 9+2·turno ligações até 22; `noVacancy` 35% a partir do turno 2; `flood`), `scoreVerdict`.

### endings.ts (75)
- `KEY_PATIENTS` (7; rótulo "Liam / Tia Márcia" com id `davi_marcia`), `keysSaved`, `sourcesCount`, `familyDead`, `familyAllWell`.
- **`checkEnding`** (:41): **ruim** se alguém da família morreu, ou Laços ≤2 / `lucia_foi_embora`, ou Integridade ≤2. **bom** exige: família toda 'bem', Laços ≥7, Integridade ≥6, ≥4 pacientes-chave salvos, `materia_publicada` + ≥2 fontes. **secreto** elegível: não-ruim, `peixoto_caiu`, Integridade 3–6, dinheiro >500.
- `buildEnding` (:58): fios (`threads`) filtrados por `when`, texto bom/ruim por `ok`; ruim → secreto (se assinou a cadeira) → bom → normal; recusar a cadeira acrescenta uma linha.

### game.ts (693) — orquestra fases
- `SceneRunner` (:27): cena transitória (passagem de turno, fim de turno, eventos da Simone). **Não confere `needLink` nem `disabled` no `choose`** (só a UI filtra).
- `DATES` (:81): calendário dos 20 dias (dia 12 = "Dom., 16 de março").
- `Game` (:88): construtor (:105) — save em `plantao` volta ao `jornal`; em `casa` recria `HomeSim` (ou a noite da Simone).
- `create`, `createSimone`, `createInfinite`, `dayDef`.
- **`load` (:169): `parseSave` → `if (st.v !== SAVE_VERSION) throw 'Save incompatível'` → `checkSave`. Não existe migração.**
- `serialize` (:177): plantão/cena em andamento salva o snapshot do começo do trecho (`resumeSnap`), preservando conquistas e tempo.
- `enterDay` (:227): manual, atualizações `diary.later`, `onStart`, flag `gameover` de conteúdo, fase jornal, evento `save`.
- `newspaper` (:258), `beginShift` (:290: cria `ShiftSim`, handover via SceneRunner), `tick` (:341: **com cena aberta o plantão não anda**), `scoreInfinite`, `onShiftEnd` (endScene), `fillGameOverText/toGameOver`, `reportField/chooseReportField`, `mourn` (luto: humanidade +1, desgaste −2), `toHome` (:442), `finishHome` (:480), `toEnding` (:499; cadeira), `decideChair`, `emitEnding`.
- Simone: `enterSimoneDay`, `beginSimoneShift` (estado-sombra; pressão ≥8 → escala ×1.08), `checkSimoneEvents`, `onSimoneShiftEnd`, `checkSimoneGameOver`, `startNight/nightBills/finishNight`, `chairText`.

### home.ts (638) — noite em casa
- `OZZY_RELIEF=4`, `BICO_PAY=150` (só usado se não houver conteúdo de Intervenção), **`TRANSPORT=20` morto**.
- `start()` (:70): snapshot; café → desgaste +8×irritado; ateliê +40 (+20 com Rosângela) se `maquina`; internação da Zélia −40; cena `pre`.
- `present`, `teaser`, `canBico`, `tooTiredForField` (desgaste ≥80).
- `chooseTimeOff` (:117): descanso −15 desgaste; família +Laços (`familyLacos`, padrão 1) −10 desgaste; **bico → Intervenção** (`createFieldShift`, passo `intervencao`).
- `fieldSim`, `finishField` (:176): paga, `noites_seguidas`, desgaste 15 + 5×(seguidas−1) + 4×óbito (+6 equipe ferida), intimBene +1, flags `noite_em_claro`, `fez_intervencao`, `field_<id>`; conquistas.
- Cenas: `enterScene`, `scene()` (reconstrói por id após load), `visibleLines`, **`choices()` (:262: esconde escolha `needLink` se `h.found` não contém a chave)**, `continueScene`, `choose`, `goto`, `endScene`.
- **Modo Inconsistência doméstico** (:333–390): `inspectAvailable`, `homeClues` (falas `{{}}` + objetos), **`markInspect` (−1 Laços se a cena não tem inspect)**, **`link(a,b)`** (par → `h.found` recebe a chave e o `unlock`; 3 erros = −1 Laços).
- Contas: `bills()` (:395: base + aluguel atrasado + religação + do evento), `billTotal`, **`payBills` (:419: recusa se o total marcado > saldo − automáticas → "Dinheiro insuficiente"; coerente com o HANDOFF: só o pagamento pede para desmarcar)**, `shop`, `playOzzy` (:463), `buy`, `applyDebts`.
- **`finish()` (:515)**: consequências — aluguel (3 atrasos = despejo), comida (fome; 2 seguidas → risco Zélia/Liam), energia (2º aviso corta e estraga insulina), gás (−1 Laços, Liam com frio), remédios (2 faltas → Zélia internada), geladeira, estados da Zélia (risco ≥7 e já crítica → morre: desgaste +25, Laços −2), Liam, Lúcia/Alex triste (Laços ≤4), **Laços <3 → `lucia_foi_embora`** (cônjuge e Liam 'ausente'), desgaste ≥100 → colapso.

### field.ts (467) — Intervenção (ambulância)
- Constantes (:16–37): base R$140, +25 estável no destino certo, +10 vivo; desgaste 15/+4 por óbito/+5 por noite seguida; 3 ocorrências; carência 9/6/4 s; decaimento ×0.75/1/1.2; transporte REG 10 s, UPA 7, MAT 9; scoop 0.35; `DEST_LABEL`, `OUTCOME_LABEL`.
- (:66 comentário órfão "sorteia as ocorrências" em cima de `vitalShown`, que é outra função.)
- `vitalShown` (:68): sinal só aparece depois de uma ação com `shows` (sat incluída) — **item 45 é conteúdo (`shows: ['sat']` na ação "ver sinais vitais")**.
- `createFieldShift` (:73): novos antes de repetidos, no máximo 1 trote e nunca o primeiro; especial do dia na 2ª posição; relógio 19h20–.
- `FieldSim` (:111): `begin`, `criticals`, `rate` (sem tratamento: decay; críticas feitas reduzem até 65%; estável: 0 ou scoop), `tick` (falas da equipe a cada 22 s, ação em andamento, óbito em stab 0), `visibleActions` (after/until/needs/cena insegura), `act`, `complete` (delta, `dano`→harm, shows, cena, secures/hurts/endsPrank, estabiliza quando todas as críticas feitas), `transport` (LOCAL; `treatOnScene` sem estabilizar = óbito; destino errado rebaixa para instável), `end`, `next`, `summary`.
- `autoPlayField` (:406) bot.
- **QRR: só existe `FieldCaseDef.qrr` (conteúdo) — item 43 mexe no conteúdo e na UI do rádio.** Itens 44–52 são majoritariamente conteúdo (`src/content/field.ts`) usando `needs/after/until/delta/kind`; o motor já suporta. Ritmo de parada (51–52): dá para modelar como ação "ler ritmo" (`shows:['ritmo']`) + ações "chocar"/"CA-GA-DA"/"adrenalina" com `after`, mas o ritmo por caso é fixo — variar ritmo exigiria casos separados ou um campo novo (sorteio no `begin`).

### video.ts (302) — Programa VER
- Custos (:21–25): pedir 2 min; conectar 3/5/7 (+1 aleatório); olhar 4×(1/1.3/1.6); prova de trote +R$10.
- Sinal por bairro (:28), piora com alagamento.
- `videoEnabled` (dia ≥ `fromDay`; desligado na Simone), `videoBudget` (franquia; cria se faltar), `videoDefOf` (cena do conteúdo sobre a gerada), `videoView` (motivos de bloqueio; 2 recusas no máximo), `pushVideoLines`, `startVideo` (harmful/remote/refuse/conecta; gasta franquia só se conecta), **`videoLook` (:223: `spot.unlocks` → `call.unlocked` — gatilho alternativo já pronto)**, `videoWide`, `endVideo`, `videoProofOnStamp`.
- **`VIDEO_LINKS` + `videoAutoLinks` (:271–302): pistas do vídeo × regras do manual, só funcionam pelo Modo Inconsistência (TAB).**

### shift.ts (2931) — o plantão
- Constantes (:20–30): 07:00–19:00, `FIXED_PAY 160`, `RISK_SCALE` 1.3/1.1/0.9, `CALL_RISK_RATE 0.3`, `BONUS_CAP 160`, `PRODUCTIVITY_BONUS 30`, custos USA 1850/USB 720.
- `ShiftEvent` (:32), `TARM_QUESTIONS` (:56), `REG_LABEL`, `LinkResult`, `QuestionView` (:66 group base|protocolo|ferramenta|especifica|confronto|fala|acalmar), `ClueRef`.
- Construtor (:99; `resume` sempre `false` em produção — ramo de retomada só no teste), `freshTarm`, `on/emit`, `ctx/eff` (desgaste 100 → colapso na hora), `toast`.
- `fresh` (:176), **`setup` (:226)**: frota do dia, ligações (variantes do banco quando `variable`/`genOnly`), linha do tempo, toques fantasmas (desgaste >80), cochilos após `noite_em_claro` (3/5/7), fim do turno, aviso do VER.
- `pickVariant`, `addCall` (`pendingArrival`), `defOf`, `truthOf` (aplica `truthPatch` da piora).
- Agenda: `schedule` (:382), **`scale()` (:391: orientação usa `guideScale`; `if (sh.inspect) s *= desgaste>80 ? 0.7 : 0.5` ← escala do Modo Inconsistência)**, `isBlocked` (modal bloqueante, pausa, fim, game over), `tick` (:407: cochilo não respondido; ≤0.25 s por passo; adiantar ×4), `tarmAge` (:436), `advance` (custo instantâneo), `processUntil`, `setTime` (soma `talk`), `riskElapsed` (:498: conversa conta a 30%), `handle` (:503).
- Fila: `onArrival` (:554: post-it da Simone — certo com prob. `simoneAccuracy`; `noteUrgent` = vermelho; desistência após `patience` 120 min), `idle`, `setFast`, `wrongNote`, `onHangup` (vermelho pode morrer), `queue`.
- Atender: `answer` (:643), `hold` (−10 paciência), `active`.
- Transcrição: `sysLine` (kind 'insight' → falante "INCONSISTÊNCIA"), `pushRawLine`, `regLine`, `pushLines`, `callerLabel`.
- **Perguntas**: `questionCost` (:735: café ×0.7, desgaste >60 ×1.1), **`questions(call)` (:742)**: base do conteúdo (esconde `idade`; `referencia` vira "Confirmar o endereço" para o regulador), "Acalmar", extras do caso (`locked` só depois de desbloqueada), **confrontos automáticos `confronto_quadro`/`confronto_endereco` só aparecem se `call.unlocked` os tiver (vêm de `autoLinks`)**. `ask` (:785: callback, respostas `def.q[id]` ou `c.defaults`; extras com `unlocks`), `defaultCallback` (trote: número inexistente/caixa postal).
- Mapa: `lookup` (:852, 2 min), `addrResult`, `etaFor`, `floodMode`, `unitPos`, `availableUnits` (QRV ou RETORNO).
- **Modo Inconsistência** (:898–1013): `toggleInspect`, `clueCatalog` (ficha, transcrição, manual, quadro, documentos, diário), `autoLinks` (número no quadro de trotes → `confronto_quadro`; mapa não confere → `confronto_endereco`; vídeo×manual), **`link(a,b)`** (erro: −15 paciência, +5 min, pode desligar; acerto: `unlocked`, linha 'insight', `onFind`, +2 min), `globalHolder` (Proxy em `sh.flags._gfound/_gtried` para os vínculos do dia), `globalFound` (**morto**).
- `callerHangsUp` (:1015: real liga de novo em 10 min).
- Vídeo: wrappers (:1036–1053).
- **Carimbo `stamp` (:1058)**: escolhe viatura mais próxima; destino obrigatório a partir do dia 9; `noUSA`; `grade`; TROTE → quadro + prova de vídeo + retorno se era grave; ORI → apoio, guia `onOri`, retorno se grave; despacho → `dispatch`, custo, `mismanaged`, `peixotoWatch`, guia automática.
- `declareImpediment` (:1140), `mciSubmit` (:1177, dia 15), `closeCall` (zera `sh.inspect`), `scheduleDismissFollowup`.
- Frota: **`dispatch` (:1314; rádio `QRR 3/2/1` pela COR da decisão)**, `moveUnit`, `setUnit`, `onUnit` (arrive/arrive2/leave/hospital/released/repaired/base/handoff), `returnToBase`, `checkAwaits` (primeira USA que liberar, rendez-vous), `needsTransport`, `defaultDest`, `sceneMinutes`, **`onScene` (:1492: revelação do veredito na chegada; trote; falta de apoio = recua 20 min; USB em caso de USA → `underRequest`; excesso = libera)**, `onSecondArrival`, **`onHospital` (:1556: destino errado → transferência; retenção de maca 25–80 min; `noVacancy` no Regional → +60 min e pedido `vaga` com opções vaga zero (10 min) / UPA / aguardar; retenção longa → pedido `retencao`)**.
- Pedidos: `makeRequest` (:1610; prazo dobrado, mín. 12 min; na Simone a IA responde), `underRequest`, `answerRequest`, `onRequestExpire`, **`applyRequest` (:1663: piora/retencao/`vaga` — vagazero libera em 15 min e grava `vaga_zero_negociada`; UPA com vermelho = nota)/timeline)**, `returnToBaseLater`.
- Desfecho: `riskScale`, `survival` (linear entre good e bad), **`evaluateCare` (:1787)** (adiado se a orientação está em curso; óbito/sequela/salvo; sindicância só se o certo teria salvado; Bené +intimidade), `onScheduledOutcome`, `registerDeath` (desgaste +10/+6; 2 sindicâncias = game over), `writeDiary`.
- Revelação: `revealVerdict` (:1907), `addPenalty` (nota −10 +1 desgaste; advertência −20 +3; 2 notas = 1 advertência efetiva; 3 (real: 2) = exonerado), `effectiveWarnings`, `warningLimit`, `addBonus`, `gameOver`, `reportItem`, `radioText/radioTextNoUnit`, `radio`.
- Retornos: `onFollowup` (dispensa → reabre na fila com post-it urgente), `onReveal` (`sem_retorno` → óbito com sindicância; `dispensa_amarelo`).
- `checkWorsen` (:2098), `startGuide`/`finishGuide` (minijogo; escala do relógio ajustada ao ETA), **`coffee()` (:2194: até 2/dia, `irritado++`, perguntas ×0.7 por 2 h (1h30/1h com noites seguidas), sem cochilo)**, `photo` (−3 desgaste), `readDiary` (desgaste >70: −10 ou +5).
- Linha do tempo: `timelineCtx` (:2238), `extendShift`, `onTimeline`, `ackModal`, `pushModal`, `peixotoWatch` (:2365: a partir do dia 5, interfone ao passar da meta de USA), `efficiency`.
- Fantasmas/cochilo: `onPhantom`, `acordar` (1 min), `cochilar` (4 min), `clickPhantom` (2 min), `expirePhantoms`.
- Simone/TARM (:2430–2698): `tarmLog`, `tarmPass`, `tarmOut`, `coverTriage`, `aiNext/aiThink/aiAccuracy/aiGuideQuality/aiRequestChoice/aiDecision/onAi/aiMci`, `tarmSummary`.
- Fim: `onEndTime` (:2703: fila → noturno), **`finish()` (:2726)** (revela pendentes, estima desfechos, relatório, produtividade (≥8 atendidas sem advertência: +30), meta do Peixoto (bônus; com falta/dispensa → Integridade −1 `metaSuja`), teto 160, salário 160 + bônus − descontos, desgaste +5 (+1 sem foto), histórico, game overs), `registerDeathNoDup`, `nightShift` (noturno: Henrique piorando = +140 min), `buildReport`.
- `CALM`, `numKey` (últimos 5 dígitos), `DEFAULT_RADIO` (:2908), `DEFAULT_FOLLOWUP`, `capFirst`. (:2928 `DEFAULT_RADIO.okUSB = DEFAULT_RADIO.okUSB` é no-op.)

### simone.ts (185) — campanha 2
- `SIMONE_TMA_GOAL 45`, `createSimoneState` (dinheiro 90, desgaste 30…; `shadow` = estado do regulador com dificuldade padrão), `simoneDay`, `simoneWorld`, `settleSimoneShift` (cor da pré-triagem × cor da verdade; TMA; auditoria <60% certo; óbito por subtriagem = advertência; pagamento 120 ou metade se saiu; pressão/emprego), `simoneBills`.
- Atenção: na Simone, "cor" = **gravidade** (vermelho/amarelo/verde/azul). Os post-its por **categoria** (azul Clínico, rosa GO, verde Trauma, branco) do item 33 usam as mesmas palavras com outro sentido → risco de confusão no código e na tela.

### bot.ts (382)
- `PROFILES` lento/medio/experiente/oraculo (:34); `inspects` liga mapa, vídeo e **links da casa**.
- `playBot` (:71), `playShift` (:135: modais = 1ª opção, pedidos = 1ª opção (vaga → "vaga zero"), minijogo, café após 10h, acordar, foto/diário, post-it vermelho), `decide` (:208: vídeo em trotista/minimizador/exagerador; `must` + perguntas aleatórias; lookup; MCI; impedimento só oráculo; erro concentrado em amarelo/verde), `pickChoice` (simula efeito num clone), `playHome` (:319: **chama `h.link` em todos os pares da cena e prefere a escolha `needLink`** — precisa mudar com o "reparar"), escolha da folga, contas, loja.

---

## 2. Estado do jogo e saves

- `GameState` (`types.ts:1199`) é todo serializável: RNG dentro (`rng`), `phase`, `money`, `vars`, `keys`, `sources`, `flags` (bool/número/texto), `family`, `bills`, `diary`, `board`, `docs`, `manual`, `achievements`, `history`, `shift?`, `totals`, `irritado`, `home?`, `gameOver?`, `ending?`, `infinite?`, `shadow?`.
- Saves só em fronteira de fase: `enterDay` (jornal), `toHome` (casa), `finishHome`→`enterDay`, finais. `serialize` volta ao começo do trecho em plantão/cena/Intervenção (`resumeSnap`). Um plantão salvo vira `jornal` (`Game` construtor e `serialize`).
- **`SAVE_VERSION = 3` e `Game.load` exige igualdade estrita (`game.ts:172`) — não há migração.** O teste `seguranca-saves.test.ts:151` espera "incompatível" para v2.
- Para a 1.1 sem quebrar o save do dia 6 (campanha F):
  1. Preferir campos novos **opcionais** (`name?`, `boxes?`, cor/posição do quadro, cômodos da casa…): o `checkSave` não rejeita campos desconhecidos e não olha `v`. Assim nem precisa subir a versão.
  2. Se subir para 4: criar `migrate(st)` em `Game.load` **antes** do teste de versão e do `checkSave` (e no `shadow`), atualizar o teste de v2 e o `writeLocalSave` do cliente (`tests/saves-guardados.test.ts` grava `v: 3`).
  3. `checkHome` exige `found/tried/inspected` — manter esses campos (mesmo sem uso) ou afrouxar a conferência; nunca torná-los obrigatórios de outro jeito.
  4. Textos "assados" no save: `diary[].text`, `diary[].updates`, `history[].report[].text`, `home.log`, `board` são resolvidos na hora em que são escritos (`makeEffCtx.diary`, `writeDiary`). Se algum tiver "Amber"/"Luan", fica no save antigo → migração de texto (Amber→Camille, Luan→Thiago) ou aceitar.
  5. `diary[].callDef` aponta para ids de ligação: renomear ids de ligação quebra (em silêncio) as atualizações `diary.later`. Renomear flags quebra a continuidade das escolhas já feitas — manter os nomes ou migrar.
  6. Save em `casa` é retomado reconstruindo a cena pelo `sceneId` (`home.ts:225`); se o id da cena do dia 6 mudar, `scene()` devolve `undefined` e a noite pula para contas (não trava). Com `step pre/cena/intervencao` o save já volta ao início da noite.
  7. Família: ids `lucia/davi/zelia` são exigidos pelo save-check (`save-check.ts:153`) — não renomear os ids internos.

## 3. Ciclo de um plantão

1. **Jornal** (`Game.newspaper`) → `beginShift`: cria `ShiftSim`, snapshot, handover (SceneRunner; relógio parado enquanto há cena).
2. **Setup** (`shift.ts:226`): frota (`fleetForDay` ou `day.fleet`), ligações agendadas (`arrival`), linha do tempo, fantasmas, cochilos (noite na ambulância), fim às 19h.
3. **Relógio**: 1 s real = 1 min (narrativo 0,62; Simone com pressão alta ×1,08). Orientação: escala própria. **Modo Inconsistência: ×0,5 (×0,7 com desgaste >80)**. Adiantar ×4 quando ocioso. Perguntas/ferramentas avançam o relógio de uma vez (`advance`).
4. **Fila**: chega com post-it da Simone (certo ou errado; vermelho = "pega essa"); desiste após 120 min (âncoras não). Espera tira paciência.
5. **Perguntas**: custo do conteúdo (`QuestionDef.cost`, extras 8 min padrão) × café 0,7 × desgaste>60 1,1. Ferramentas: Acalmar (4), ligar de volta, mapa (2), vídeo (2+3–8+3–6 por olhada). A conversa conta só 30% para a janela de risco (`CALL_RISK_RATE`) → hoje o tempo das perguntas pesa mais na fila do que no paciente.
6. **Classificação** (cor) + **decisão** (`stamp`): recurso, viatura, apoio, destino (dia ≥9), encaminhamento (ORI). Veredito calculado no carimbo, revelado na chegada da viatura / retorno / fim do dia.
7. **Frota/mapa/rotas**: Dijkstra com trânsito por hora e alagamento; status QRV→DESLOC→LOCAL→TRANSP→RETIDO→RETORNO; USB em caso de USA pede apoio (USA extra, rendez-vous, aguardar a primeira que liberar, seguir).
8. **Hospitais**: REG/UPA/MAT; destino errado = transferência + nota; retenção de maca 25–80 min, pedido de negociação.
9. **Vaga zero**: só com `day.noVacancy` (dias 19–20 e Infinito) e só no Regional: +60 min de retenção e um pedido de rádio simples (vaga zero 10 min = sucesso garantido; UPA; aguardar).
10. **Vídeo**: franquia 3 a partir de `video.fromDay`; prova de trote +R$10; pontos de vista podem desbloquear perguntas.
11. **Café**: 2 por plantão; perguntas mais rápidas e sem cochilo por 2 h; em casa: desgaste +8 por café e escolhas carinhosas bloqueadas.
12. **Pontuação**: salário 160 + bônus (teto 160; produtividade +30; meta do Peixoto) − notas (10) − advertências (20). Hora de ouro +10.
13. **Consequências**: desgaste (óbito +6/+10, nota +1, advertência +3, plantão +5/+6), sindicâncias (2 = fim), exoneração (3 advertências efetivas; real 2), colapso (desgaste 100), pacientes-chave, `onResolve` de conteúdo, `noturno_obito_<id>`.
14. **Diário**: `writeDiary` (vivo/morto/orientado/sequela); `diary.later` atualiza nos dias seguintes.
15. **Flags**: `st.flags` (permanentes) por conteúdo e motor (ex.: `rendezvous_usado`, `vaga_zero_negociada`, `mci_reforco`, `mci_sem_obitos`, `noites_seguidas`, `noite_em_claro`, `fez_intervencao`, `field_*`, `luto_d*`, `report_*`, `item_*`, `ozzy_dias`, `cadeira_*`, `gameover`); `sh.flags` (do turno, não persistem).
16. **Fim** (`finish`): noturno, relatório, pagamento, histórico → `endScene` → relatório → `toHome`.

## 4. Casa, Intervenção, Simone, finais

- **Casa** (`HomeSim`): pre → escolha (descanso/família/Intervenção) → cena (ou Intervenção → cena do bico) → contas → loja → dormir (`finish`). Dinheiro: salário do plantão, ateliê, Intervenção, envelope do vereador (conteúdo). Laços: família +1 (ou `familyLacos`), gás −1, escolhas, Examinar (−1). **Examinar** = Modo Inconsistência doméstico (pares `link`, `needLink`).
- **Intervenção**: `field.ts`; termina em `finishField` (pagamento, desgaste, flags) → dia seguinte com cochilos.
- **Simone**: estado-sombra; regulador e Henrique por IA; avaliação por cor/TMA; finais e game overs próprios (`content.simone`).
- **Finais**: `toEnding` no fim do dia 20 → `checkEnding`; se elegível ao secreto e a cadeira não foi decidida → oferta (`chairText`/`decideChair`) → `buildEnding` (ruim > secreto > bom > normal) + fios do epílogo (`content.endings.threads`, onde mora o epílogo do Henrique — item 4).

## 5. Texto / tokens
- Ver `text.ts` acima. Nomes: protagonista em `PROTAGONIST_FIRST`; cônjuge em `spouseName`/`SPOUSE` (Lúcia/Alex — a decisão nova mantém Lúcia e Alex); filho `SON_NAME`; sobrenome "Moura" fixo em `resolveOne`.
- Pistas `{{trecho|id}}`: `resolveTokens` preserva; a UI mostra; `stripMarkup` tira. Podem ficar como texto depois de remover o modo.

## 6. Modo Inconsistência — tudo que depende dele

**Motor:**
- `ShiftState.inspect` (`types.ts:1116`), `toggleInspect` (`shift.ts:901`), escala de tempo (`shift.ts:398`), reset em `closeCall` (:1294) e `tarmPass` (:2454).
- `clueCatalog` (:905), `autoLinks` (:936), `link` (:951), `globalHolder` (:990), `globalFound` (:1011, morto), `LinkResult`, `ClueRef`, evento `insight`, `ShownLine.kind 'insight'` (`sysLine` "INCONSISTÊNCIA").
- `CallRT.found/tried/wrongLinks` (e `unlocked` — este continua útil).
- `videoAutoLinks`/`VIDEO_LINKS` (`video.ts:271`).
- `tarmAge` devolve `clue` para clicar na ficha (`shift.ts:436`).
- Casa: `InspectDef`, `HomeObject`, `homeClues`, `markInspect`, `link`, `HomeState.found/tried/inspected`, `HomeContent.pointlessInspect`, `Choice.needLink`.
- Tipos: `LinkDef`, `CallDef.links`, `DayDef.links`, `DeskDoc.clues`, `SceneDef.inspect`.
- Bot: `playHome` liga todos os pares.
- Testes: `content.test.ts` (confere pistas citadas nos vínculos e `needLink`), outros que citam `confronto_`.

**Conteúdo que precisa de outro gatilho** (levantado com script sobre `CONTENT`):
- Perguntas `locked` desbloqueadas **só por vínculo** (as marcadas Q/V já têm pergunta ou vídeo):
  - D2 `d02_biel` → `fechada` (escola fechada × jornal).
  - D8 `d08_pizza` → `perigo` (os outros 4 já por pergunta/vídeo).
  - D9 `d09_marcia` → `professora` (+ flag `sabia_que_era_marcia`, lida em d09.ts:768).
  - D10 `d10_igreja` → `igreja` (endereço × mapa); `d10_biel` → `avo` (número × recibo).
  - D14 `d14_carla` → `confronto_jornalista`.
  - D16 `d16_cida` → `esta_bem` (+ `cida_sinal1`); `d16_osvaldo` → `filho_peixoto`.
  - D17 `d17_cida` → `repetiu` (+ `cida_sinal2`, `cida_sinais_cruzados`).
  - D18 `d18_peixoto_teste` → `desmascarar` (+ `peixoto_desmascarado`).
  - D19 `d19_cida` → `reconhecer`.
- Confrontos automáticos `confronto_quadro` (número no quadro) e `confronto_endereco` (mapa não confere) — hoje só via `autoLinks`. Gatilho natural: desbloquear direto quando o número bate com o quadro / quando o `lookup` dá inválido (ou pelo post-it da Simone, já que o endereço passa a ser dela — item 40).
- Vínculos do dia com `onFind` (flags de história): D9 `ordem_peixoto_registrada` (lida em d14.ts:38 e d18.ts:385), D12 `viu_ficha_sindicancia` (lida em d12.ts:909–913).
- `onFind` em ligações: d09_marcia, d16_cida, d17_cida, d18_peixoto_teste (acima).
- Casa (`needLink`): d10 `prato`/`hipo`; d12 `proposta` (+`lucia_proposta_descoberta`)/`cracha`; d13 `ver_pe` (+`pe_ferida`); d14 `lucia_fonte_rev`; d16 `davi_verdade`; d17 `desenhos_molhados`/`zelia_meia`/`goteira_nogueira`; d18 `achou_envelope`. → Viram o "reparar" (item 58): objeto marcado com `unlock` (e `onFind`), um clique libera.
- Vídeo × manual (`VIDEO_LINKS`, 20 insights): mostrar o insight direto no `videoLook` quando o ponto tem a pista.
- 14 documentos de mesa com `clues` (`DeskDoc`) e ~380 vínculos em `links:` nos dias 1–20 deixam de ter função (podem ser apagados ou ignorados).
- Bot: perfil `inspects` (mapa/vídeo/links da casa) e o balanceamento (BALANCEAMENTO.md foi calibrado com o modo existindo; a escala 50% dava tempo extra a quem usava).

## 7. Os 58 itens × motor

| # | onde toca no motor |
|---|---|
| 1 | feito (conteúdo d12). `game.ts:81` DATES já diz domingo. |
| 2 | nenhum (doc + `tests/content.test.ts`). |
| 3 | flags: `makeEffCtx.set` (`state.ts:124`); sem registro de flags no motor — um teste que compare `fx.set`/`flag()` ajudaria. |
| 4 | `endings.ts:58` (`threads`) + `content/endings.ts`. |
| 5–6 | conteúdo; motor oferece `onStamp/onResolve/diary.later/onStart`, `flags`. |
| 7 | falas por `ctx.money()`/flag do envelope; motor não guarda a ORIGEM do dinheiro (só `money`) — gravar flag/contador ao receber (ex. `fx.money` com motivo) ou ler a flag do envelope. |
| 8 | dia 10 + casa (`LANDMARKS casa` `map.ts:110`); consequência via flags (`anotou_henrique_d10`). |
| 9 | flags/escolhas; nada de motor. |
| 10–11 | `text.ts:26,45–46,82,227`; `NewGameOpts`/`newGameState` (`state.ts:37,47`) + `GameState.name?`; telas listadas na seção 1. |
| 12–14 | arte (cliente); `VoiceId` já tem `alex`. |
| 15–16 | conteúdo. |
| 17 | `Game.beginShift` (:290, antes do handover) e `Game.toHome` (:442) / `InterludeDef.pre` — nova cena de ida/volta (ex. `DayDef.commuteIn/Out`). |
| 18 | almoço 13h: evento agendado (`SchedEvent` novo ou `timeline` às 13:00) que abre uma cena no `Game` (com `this.scene` aberto, `Game.tick` não anda = relógio parado). Atenção ao trânsito 11h45–13h15 e a ligações na fila. |
| 19 | `InterludeDef.field` (casos especiais + rádio) e flags `field_<id>`. |
| 20 | `endings.ts`, `content/endings.ts`, `client/art/endingArt.ts`. |
| 21 | — |
| 22 | `coffee()` `shift.ts:2194`, `questionCost` :735, `HomeSim.start` :76, `Choice.affectionate`. |
| 23 | `video.ts` custos/franquia, `content.video.credits`. |
| 24 | `goal.maxUSA`, `peixotoWatch` :2365, `efficiency`, `underRequest`, `checkAwaits`, `finish` (meta). |
| 25 | `questionCost`, `CALL_RISK_RATE`, `riskElapsed`, `RISK_SCALE`. |
| 26 | `bot.ts` + `npm run simulate`. |
| 27 | `DayDef.noVacancy` (hoje só d19/d20) → campo por dia/ligação a partir do dia 3–5. |
| 28–30 | `onHospital` :1556 e `applyRequest('vaga')` :1716: trocar o pedido de rádio por negociação (diálogo com argumentos), retenção `RETIDO` até vaga (sem `until` fixo), efeito em `availableUnits`. `PendingRequest.kind 'vaga'` existe. IA da Simone (`aiRequestChoice` :2549) e bot (1ª opção) precisam saber responder. |
| 31 | contador por turno em `sh.flags` (1×/plantão) → Peixoto. |
| 32 | "tempo parando": modal `blocking` (`isBlocked`) ou cena no `Game` (`tick` para); efeito visual/áudio no cliente. |
| 33 | `onArrival` :566–574 (post-it): precisa de categoria da ligação (campo novo em `CallDef`/`TruthDef`, ou derivado das tags do banco) e de cor no `CallRT` (ex. `noteCat`); nota errada → cor errada. |
| 34 | `BoardEntry` (:1161) ganhar `pos/color/stickers` opcionais; remover entrada não existe no motor (e `autoLinks`/quadro de trotes casa por `kind:'trote'` + `num`). Board é escrito por `makeEffCtx.board` e `stamp` (trote). |
| 35–36 | `QuestionDef` (:840) ganhar categoria; `questions()` :742 (caixas abertas no `CallRT`); ids usados em `truth.must` e `TARM_QUESTIONS` — manter ids (`respira`, `consciencia`, `oque`…) ou mapear; respostas novas via `content.defaults(q, call, ctx)` (`content-api.ts:437`; precisa da verdade/cena do vídeo — `defaults` recebe só `CallDef`, dá para chamar `truth(ctx)`). |
| 37 | "Outros": novas perguntas/frases; "encerro a ligação" = encerrar (talvez ORI/encaminhamento `CASA`); avaliação dos folgados no `grade` (hoje: verde/azul ORI com `ref`). |
| 38 | `LineStyle` (:28) ou marcação no texto; áudio no cliente. |
| 39 | conteúdo (`bank/trotes.ts`), `AmbientId 'risadas'`, `VideoScene.laughing`. |
| 40 | `questions()` :752–754 (tirar `referencia` do regulador); `lookup` (mapa) continua; confronto de endereço vira dado da Simone (post-it). |
| 41 | feito. |
| 42 | seção 6. |
| 43 | `dispatch` :1330 (QRR pela cor → por recurso/urgência), `DEFAULT_RADIO.under` :2913, `FieldCaseDef.qrr` + textos de rádio do conteúdo. |
| 44 | `field.ts` `complete`/`end` (harm/pay) + conteúdo do caso de hipoglicemia (`needs` da bolsa). |
| 45 | conteúdo (`shows: ['sat']`); `vitalShown` :68. |
| 46–50 | conteúdo de `src/content/field.ts` (ações O2/máscaras/intubação com `after/until/delta/kind`); motor suporta. |
| 51–52 | conteúdo + talvez campo novo para ritmo variável (ver field.ts acima). |
| 53 | conteúdo. |
| 54 | cliente (+ `playOzzy` `home.ts:463`). |
| 55–56 | `HomeState` (cômodo atual, objetos vistos — opcionais), `InterludeDef`/`HomeContent` (objetos por cômodo por dia). |
| 57 | feito no cliente; motor `payBills` :419 continua recusando acima do saldo (coerente). |
| 58 | `home.ts:333–390` → `notice(objId)`: `HomeObject` ganha `unlock`/`onFind`/texto do que se notou; sem custo de Laços; `choices()` continua lendo `h.found`; bot (`bot.ts:330–336`) atualizar. |

## 8. Bugs, código morto, riscos

**Prováveis bugs / incoerências**
- `shift.ts:2086–2092` `onReveal('dispensa_amarelo')`: não chama `def.onResolve` nem marca o paciente-chave como perdido (o ramo `sem_retorno`, logo acima, faz as duas coisas). Conteúdo que depende de `onResolve` para amarelo dispensado não roda.
- `SceneRunner.choose` (`game.ts:54`) ignora `needLink` e `disabled` (dinheiro/irritado) — depende só da UI.
- `HomeSim.choices` some com as escolhas `needLink` (não mostra desabilitada com `hint`) — relevante para o "reparar".
- `registerDeathNoDup` (`shift.ts:2839`): óbito no noturno após dispensa no fim do turno sempre abre sindicância, sem a regra "o certo teria salvado" usada em `evaluateCare`.
- `onReveal('sem_retorno')` (`:2074`) também sempre `myFault = true`.
- `dispatch` (`:1330`): QRR pela cor da classificação, não pelo recurso (item 43).
- `riskElapsed`/`onHangup` (`:616`) usa `arrived`, não `riskFrom`.
- Campos fora do tipo via cast em `CallRT` (`pendingArrival`, `pendingGuide`, `deferCare`, `vagaZero`, `destNoted`, `reopened`, `aiWait`) e em `UnitState` (`token`): vivem em `st.shift` (não salvo), então não quebram save, mas escapam do TypeScript.
- `landmarkPos` muta o objeto exportado `LANDMARKS` (cache) — inofensivo.
- `infinite.ts` cache em módulo (`Map`) cresce sem limite (um por turno/semente) — irrelevante na prática.

**Código morto / sobras**
- `util.ts`: `uid`, `sumBy`, `fmtMoney`. `path.ts:160 streetCount`. `home.ts:16 TRANSPORT`. `shift.ts:1011 globalFound`.
- `shift.ts:264` `hm(gen ? def.at : def.at)`; `:792` `this.st.day >= 1 ? … : ''` (sempre verdadeiro); `:2176–2178` `if` vazio; `:2928` atribuição no-op; vários `void def`/`void c`; parâmetro `resume` do construtor (sempre `false` em produção).
- `field.ts:66` comentário órfão; `types.ts:821` comentário sem campo; doc errado em `types.ts:151` e `:1232`.
- `text.ts` cabeçalho com Luan/Amber.

**Riscos para a 1.1**
- **Save do dia 6**: `Game.load` recusa qualquer `v` diferente de 3 → não subir a versão sem `migrate`. Preferir campos opcionais. Manter ids de família, de flags e de ligações.
- Remover o Modo Inconsistência muda o balanceamento (a escala 50% e os vínculos davam tempo e desbloqueios) → refazer `npm run simulate`; a meta é não ficar mais difícil.
- `truth.must` lista ids de perguntas: renomear/reagrupar perguntas (itens 35–36) pode gerar `sem_justificativa` em massa.
- Palavra "cor" com dois sentidos (gravidade × categoria do post-it).
- Vaga zero com retenção "até liberar vaga" pode prender USA e matar pacientes em cascata — calibrar e dar saída (Peixoto 1×).
- Almoço parando o relógio: ligações na fila e viaturas param juntas (Game.tick não roda) — coerente, mas a paciência não corre; decidir se é o desejado.
- `defaults()` só recebe `CallDef`; respostas derivadas da verdade (pulso/pele) precisam resolver `truth(ctx)` e a cena do vídeo (`content.video.build`).
- Renomear: `GENDERED.nome` fixo no carregamento; `protagonistName(g)` sem estado; textos já gravados no save.
