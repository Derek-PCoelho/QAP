# 06 — Interface (src/client sem art/) e Áudio

Leitura: **100% das 18.016 linhas** de `src/client/**` fora de `src/client/art/` (77 arquivos: App, main, store, settings, api, native, infinite, ui/ ×5, screens/ ×12 + desk/ ×19 + home/ ×6 + simone/ ×6, minigames/ ×5, audio/ ×11 incl. README e lab, styles/ ×7) + docs HANDOFF/FEEDBACK-1.1/ARQUITETURA (207 linhas).
Nenhum arquivo do repositório foi modificado. Referências são `arquivo:linha` relativas a `src/client/`.

---

## 1. Esqueleto

| Peça | O que faz |
|---|---|
| `main.tsx:1-17` | Fontes (Pixelify Sans, VT323, Jacquard 24) + 7 CSS + `<App/>` |
| `App.tsx:26-93` | `useStore()`; `store.init()`; destrava áudio no 1º gesto (`audio.unlock()` + tema do título); no desktop destrava já (`:37`). Esc: em INPUT/TEXTAREA só tira o foco (`:41`); senão pausa se fase ∈ plantao/casa/jornal/relatorio (`:45-47`). Switch de `s.screen` (titulo, novo, carregar, opcoes, conquistas, creditos, ranking, simone_novo, como_jogar; senão `GameScreen`). Sempre renderiza `PauseMenu` (se `paused && screen==='jogo'`) e `Toasts`. |
| `App.tsx:100-120` | `ScreenGuard` (error boundary) com `key = screen:phase`; botão → `store.recoverToTitle()` (não grava). |
| `App.tsx:122-140` | `GameScreen` por `g.st.phase`: jornal→`Newspaper`; plantao→`SimoneDesk` (mode simone) ou `Desk`; relatorio→`Report`; casa→`SimoneNight` ou `Home`; final→`Ending`; gameover→`GameOver`. Keys com dia/turno infinito para remontar. |
| `ui/Stage.tsx` | Palco 1280×720 com `transform: scale`. "Escala inteira" usa `floor(s*2)/2` (meio-inteiro, `:9`), não inteiro como diz o comentário/Opções. |
| `ui/ArtCanvas.tsx` | Canvas lógico w×h, escala CSS; anima via rAF limitado a `fps`; sem animação redesenha a cada render; `onClick/onMove` em coordenadas lógicas. Erros de desenho só vão ao console. |
| `ui/Portrait.tsx` | `speakerId(who, gender)` (mapa de nomes→CharacterId; LUCIA com protagonista F vira ALEX `:15`; DAVI/LIAM→DAVI); `speakerName` (LUCIA→spouseName, DAVI→SON_NAME, ZELIA→"Dona Zélia", EU→"Você", NARRADOR→""); `Portrait` arredonda para múltiplos de 64 px. |
| `ui/Icon.tsx`, `ui/Toasts.tsx` | Ícone 16×16 de `art.icon`; lista dos últimos 6 toasts. |
| `infinite.ts` | `startInfinite` = `Game.createInfinite`; `todaySeed()` AAAA-MM-DD. |

## 2. store.ts (estado do cliente)

- **Parâmetros de teste** (só com `__QAP_DEV__`, removidos no `--release`): `PARAMS` (`:23`); `?speed=N` → `DEV_SPEED` 0,1–60 multiplica `g.tick` (`:25`, `:139`); `?dia=N` → `DEV_DAY` vira `startDay` em `newGame`/`newSimone` (`:26`, `:179`, `:193`); `?simone=1` → `DEV_SIMONE` libera a campanha 2 (`:30`, `:202`). `window.__store = store` (`:581`).
- **Campos**: `game`, `screen`, `settings` (loadSettings), `achievements`, `meta`, `paused`, `version`, `serverOk`, `toasts` (máx 6, nunca expiram no estado — só o CSS some com eles em 10 s), privados `lastRingState`, `lastActive`, `prankQuick`.
- **Assinatura**: `subscribe/getVersion` + `useStore()` (`useSyncExternalStore`); `notify(immediate)` limita a ~15 fps (66 ms) quando não imediato.
- **init()** (`:80-125`): `pruneTrash`, volumes, perfil do servidor (cria perfil com `playerName`), laço rAF `frame(dt)` (dt ≤ 100 ms) protegido por `crashed()`; `beforeunload → saveAuto`; no desktop: sincroniza tela cheia e **pausa ao perder foco** (`pauseOnBlur :127-133`, não durante orientação por telefone; inclui Intervenção).
- **frame** (`:135-145`): só no plantão: `g.tick(dt*DEV_SPEED*settings.ritmo)` + `syncCentralAudio` + notify. (A Intervenção tem relógio próprio dentro do componente.)
- **Ações**: `updateSettings`, `applyVolumes`, `setScreen` (fora de 'jogo' para hum/toque/ambiente; 'titulo' toca tema), `toast`, `newGame({gender,difficulty,variable,mode,seed,startDay})`, `newSimone`, `simoneUnlocked()` (DEV_SIMONE ‖ native.testBuild ‖ meta.simoneUnlocked ‖ campaignsFinished>0), `newInfinite(seed)`, `continueGame(slot)`, `crashed(e)`, `recoverToTitle()`, `loadFromServer(slot)`, `saves()`, `deleteSave(slot)` (vai para "Saves guardados"), `trash()`, `restoreTrash(id)`, `purgeTrash(id)`, `saveTo(slot)` (só campanha/simone; backup antes de substituir outra campanha ou ponto anterior), `saveAuto()` (fim de campanha → manda o auto para a lixeira; jornal → também slot `dia`; Simone usa prefixo `simone_`), `quitToTitle()`, `recordInfinite`, `unlockAchievement`, `syncPhaseAudio()`, `pause(p)` (recusa pausar durante orientação por telefone com toast `:567-571`).
- **Eventos do motor → efeitos** (`onGameEvent :380-459`): phase (conquistas, áudio, relatório→telemetria d9/d19, fim→meta), save, telemetry, achievement, ring (`ringOnce(day/20)`), answer (`pickup` + ambiente `def.amb` a 0,8), radio (voz de rádio; perfil `bene` se o remetente contém BENÉ), stamp (sfx; conta trotes rápidos → conquista `ouvido_absoluto`), penalty (warning/note), money, insight (insight/wrong), death, saved, modal (interfone), phantom (toque fantasma), gameover (para toque).
- **syncPhaseAudio** (`:525-547`): plantão → hum; casa → violão (Laços/10, Desgaste); jornal → tema jornal; final → tema por tipo; gameover → tema.

## 3. settings.ts / native.ts / api.ts

- `Settings`: master, music, sfx, ambient, voice, textSpeed (10–400; Opções expõe 20–140), tremble, tutorial, scale fit|pixel, playerName (≤24, **só usado no ranking/perfil**), profileId, variable, fullscreen, ritmo 1|0,75|0,5. Leitura defensiva campo a campo.
- Migração das chaves antigas `192plantao.` → `qap.` (`:48-62`; interna, não aparece ao jogador).
- `Meta`: campaignsFinished, endings, firstCampaignStarted, infiniteBest, simoneUnlocked, lastGender.
- Saves locais `qap.save.<slot>` + `qap.save.meta.<slot>`; lixeira `qap.lixeira.*` (30 dias, máx 10), `backupLocalSave` com escrita conferida, `replacingLosesProgress` (outra campanha / ponto anterior com 5 s de tolerância).
- `native.ts`: ponte Electron `window.qapNative` (storage em arquivos, fullscreen, savesDir, quit, testBuild, version); `storage` cai para localStorage.
- `api.ts`: tudo preguiçoso e sem exceções; desligado no standalone/file://. Perfis, saves, ranking, telemetria em lotes (10 s / 50 eventos / sendBeacon). **`SLOT_RE` só aceita `auto|1|2|3|infinito` (`:103`)** → `putSave` de `dia`, `simone_auto`, `simone_dia` falha em silêncio (o servidor nunca recebe os saves da Simone nem o "início do dia").

## 4. Mapa de telas e fluxo do jogo

### Menu
- **Title.tsx**: arte animada `drawEnding('titulo')`; botões: Continuar campanha (se há `auto`), Nova campanha, Plantão Infinito, Simone (Continuar/Nova ou trancada com toast), Como jogar, Carregar, Ranking, Conquistas, Opções, Créditos, Sair (desktop). Rodapé com versão/servidor.
- **NewGame.tsx**: escolha de gênero (cartões com `Portrait EU_M/EU_F` + `protagonistName(gd)` + "29 anos"), dificuldade (Narrativo/Padrão/Regulador Real, `:7-11`), "Ligações variáveis" (padrão ligado a partir da 2ª campanha), aviso de campanha em andamento com 2º clique (6 s). **Não há campo de nome** (item 11). → `store.newGame`.
- **LoadGame.tsx**: lista de saves (`slotName`, `describe` = "Dia · fase · R$ · nome · dificuldade" usando `PROTAGONIST_FIRST[gender]`), apagar com 2º clique (4 s), "Saves guardados" (restaurar/apagar de vez), "Salvar a campanha atual em" 1–3 (só se há jogo campanha; acessível pelo botão "Salvar / carregar" do jornal). Comentário `:18` ainda diz "Amber".
- **Options.tsx**: sliders de volume (geral, música, efeitos, "ambiente das ligações" — também controla o zumbido da central —, vozes), ritmo do plantão, velocidade do texto, checkboxes (tremor, dicas da Simone, escala inteira, tela cheia desktop), nome no ranking, pasta dos saves. "Voltar" vai para 'jogo' se há partida.
- **HowToPlay.tsx**: abas Passo a passo / Abordagens / Detalhes / Siglas e rádio (QCODES) / Controles. Conteúdo estático escrito à mão (precisa ser revisto na 1.1: ver §8).
- **Ranking.tsx**: ranking do Infinito (dia/todos), recorde local sem servidor. **Achievements.tsx**, **Credits.tsx** (texto de `CONTENT.endings.credits`; solta a partida antes de voltar).
- **PauseMenu.tsx**: Voltar, "Salvar no espaço 1" (só campanha fora do plantão, sobrescreve sem confirmar), Opções, Sair para o título (aviso de recomeçar o dia).

### Campanha (laço de um dia)
1. **Jornal** — `Newspaper.tsx`: Gazeta (manchete, sub, foto `newsPhoto` com recorte quando denso, 2–3 colunas), "Ocorrências de ontem" (salvos/óbitos/noturno), aviso da Central + novas páginas do Manual, anúncio; lateral "Dia X de 20" + "Ir para o plantão" (`g.beginShift()`), "Salvar / carregar" (dia > 1). Infinito: cartão com pontos.
2. **Passagem de turno** — cenas do motor exibidas em `desk/SceneOverlay.tsx` (retrato do último falante, "Continuar" linha a linha, escolhas `g.sceneChoose`, "Seguir" `g.sceneContinue`). É o lugar natural para almoço (item 18) e cenas de ida/volta (17) se ficarem na central.
3. **Mesa** — `desk/Desk.tsx` (layout 368/528/352 px):
   - `TopBar.tsx`: "REGULAÇÃO" (+ etiqueta "dormiu 3 h"), dia/título, relógio (amarelo no fechamento) + barra do turno, advertências (`warningLimit`, `effectiveWarnings`, "+½ nota"), pontos do Infinito, painel Saúde+ (dia ≥ 5: USA hoje/meta, custo, índice), **garrafa de café** (`sh.coffee()`, máx 2, `:79-90`), copo = medidor de cansaço, **foto da família** (`sh.photo()`, mensagem 3,2 s). `onPhoto` é no-op.
   - `Queue.tsx` (fila): cartões (número, hora/espera, **post-it da TARM** amarelo ou `.red` com "Pega essa agora." `:58-65`, "sem anotação"), classes late/hold/retorno/anchor/active; bloqueada durante orientação/cena; botão "Adiantar até a próxima ligação" (`sh.setFast`, só sem fila e `sh.idle()`); cartões fantasma (`clickPhantom`).
   - `CallPanel.tsx`: monitor com `CallHeader` (número, solicitante, duração, "impaciente/perdendo a paciência", post-it inteiro `.ch-tarm`), `Transcript` (digitação por WeakMap por ligação; voz `audio.voice(texto, voiceFor, {style, fit})` sincronizada à velocidade do texto; clique pula; rolagem "novas falas ↓"; tremor se Desgaste > 60), `Line` (tipos caller/regulador/ruido/sistema/insight/video; spans `.clue`). `Keypad`: `orderQuestions` mistura perguntas próprias (especifica/fala) com as de sempre em posição estável por hash (`:227-243`), botões com custo em minutos, "Pôr em espera", `VideoButton` (franquia VER), "Declarar impedimento" (`def.impedimento`).
   - Centro: `MapPanel.tsx` (canvas 512×320, viaturas, rotas, marcadores casa/alvo/chamada, rua destacada após "Conferir no mapa"; hover mostra viatura/rua/bairro; clique escolhe viatura livre → `deskSel`) **ou** `VideoPanel.tsx` (quando há vídeo ativo; botão "Mapa"/"📹 Voltar ao vídeo" via `mapPeek` em Desk `:120-129`): animação de conexão, sinal, REC, "Peça para mostrar" (spots com custo), Plano geral, Encerrar vídeo, legenda da última linha de vídeo. `RequestTray.tsx` sobre o mapa: pedidos de rádio com contagem regressiva e opções (`sh.answerRequest`) — **é aqui que hoje entra a "vaga" do hospital**.
   - `RadioPanel.tsx`: chips das viaturas (status, escolhe viatura) + log do rádio com códigos Q em `<abbr>`.
   - Direita: `Ficha.tsx`: nº da ficha, hora, telefone (`clue('num')`), solicitante, paciente + idade da TARM (`sh.tarmAge`, pode ser pista citada), endereço (`clue('end')`), **"Conferir no mapa (2′)"** (`sh.lookup`, `:155-168`), Classificação (4 cores; some com Trote), Recurso (USA/USB/Orientação/Trote), Viatura (até 4 mais próximas com ETA), Apoio (PM 190 / Bombeiros 193), Destino (dia ≥ 9), Encaminhar (ORI: UBS/UPA/Regional/Maternidade/Ficar em casa), carimbo `sh.stamp(...)`, marca "REGULADO"/"TROTE". `deskSel.ts` = seleção de viatura compartilhada mapa↔ficha↔rádio.
   - `DeskBar.tsx`: Manual (M; bloqueado no Regulador Real durante ligação), Quadro (Q), Diário (D), **Inconsistência (TAB)**, resumo "N reguladas · óbitos", Pausa.
   - Livros: `ManualBook.tsx` (páginas liberadas `g.st.manual`, aba "Q" com código Q, marca "nova" do dia), `CorkBoard.tsx` (cartões `g.st.board` por tipo trote/frequente/doc + post-its do jogador gravados em `g.st.flags['postits']` separados por `\u0001`, máx 80 caracteres, escreve no estado direto + `g.bump()`), `DiaryBook.tsx` (vivos/mortos/atualizações; "Reler os nomes" `sh.readDiary`; `readOnly` em casa).
   - `ModalStack.tsx`: recados não bloqueantes (post-its amarelos da Simone / azuis "other", somem em 25 s se sem opções) e modal bloqueante (Interfone do Peixoto com retrato, Aviso, Recado; botão "Entendido, doutor").
   - `Tutorial.tsx`: post-its da Simone no dia 1 (`settings.tutorial`).
   - `Cochilo` (Desk `:168-193`): pálpebras após noite na ambulância; clique/tecla acorda (`sh.acordar`), captura teclas.
   - Sobreposições: `GuideOverlay` (orientação), `MciPanel`/`MciSummary` (dia 15), `SceneOverlay`, `Toasts` do turno, `fluor-flicker` (Desgaste > 60).
4. **RCP/orientação** — `minigames/GuideOverlay.tsx`: escolhe roteiro `CONTENT.guides[call.guide.id]` (resolve tokens), cabeçalho com ETA da viatura, `card`, troca de roteiro (`switchTo`, média das qualidades), resultado 1,8 s → `sh.finishGuide(q, ok)` (ok = success && q ≥ 0,5); conquista `maos_firmes` no parto.
   - `Rcp.tsx`: metrônomo 100–120 (`audio.metronome`), ESPAÇO/clique por compressão (tolerância 130 ms, 190 no Narrativo), contagem "um…trinta", cansaço a cada `tiredEvery` (12 s) → "Troca!" (T) em 3 s senão penaliza; nome "Pedro" fixo (`:106`); sem anel visual no Regulador Real.
   - `Breathing.tsx`: segurar ESPAÇO 4 tempos/soltar 4 tempos; qualidade = tempo em fase.
   - `DialogGuide.tsx`: passos com opções embaralhadas (certo/calma/neutro/errado), medidor de pânico, limite de tempo por passo (18 s; ×1,6 Narrativo), 3 estouros = erro, pânico 100 = desliga.
   - `MciPanel.tsx`: START em cartões (vermelho/amarelo/verde; tipo `preto` sem botão), viaturas por vítima, reforço regional, `sh.mciSubmit`; `mciState` é global de módulo.
5. **Fim do plantão** — `Report.tsx`: impressora matricial (linha a linha a cada 140 ms), tabela hora/nome+dx/decisão/veredito/desfecho/R$, resumo (fixo `FIXED_PAY` + bônus + glosa − descontos, VER, noite sem sono), "meta suja"; lateral: justificativa obrigatória (`g.reportField()` → `chooseReportField`), "Ficar um minuto em silêncio" (`g.mourn()`), Ir para casa / Sair da central (dia 20) / Continuar (game over). Infinito envia pontuação (`version: '1.0.4'` fixo `:68`).
6. **Casa** — `home/Home.tsx`: cena 320×180 (`drawScene` com bg da cena, objetos derivados de flags/compras/contas `:88-100`, `STAGING` por cena, família presente com marcações `familyMarks`, **Ozzy: `h.ozzy ? 'dormindo' : 'sentado'`** `:117`), topo com família (retrato, estado com concordância), saldo, aluguel atrasado, "Noite do dia N" + "chegou irritado (café)". Passos `h.step`:
   - `pre`/`cena` → `HomeDialogue.tsx`: linhas com voz (LUCIA→lucia/alex, DAVI, ZELIA, EU→jovem_h/jovem_m), escolhas (`aff` = carinhosas, `disabled` + motivo), **botão "Examinar" (TAB)** e hotspots.
   - `escolha` → `TimeOff.tsx`: teaser, Descansar (−15), Família (Laços +familyLacos, −10), Plantão extra (`canBico`, `tooTiredForField`, ganhos `FIELD_BASE..+CASES*PAY_OK`, desgaste +`FIELD_WEAR`+`SLEEP_DEBT`×noites seguidas, aviso ≥ 60).
   - `intervencao` → `Intervencao.tsx` (§6).
   - `contas` → `Bills.tsx`: calculadora "Saldo agora / Contas marcadas / Fica" (`key={after}` anima), pré-marca o que cabe; marcar além do saldo permitido; "Pagar o que está marcado" desabilitado se falta (`:95`) → `home.payBills(chosen)`.
   - `loja` → `Shop.tsx`: compras (`home.buy`), **Brincar com o Ozzy** (`home.playOzzy`, `OZZY_RELIEF`), "Ler o diário" (DiaryBook readOnly), Dormir (`g.finishHome()`).
   - Toasts próprios da casa (`home.toasts`).
7. **Finais** — `Ending.tsx`: oferta da cadeira (dia 20, `cadeira_oferecida` → Assinar/Recusar `g.decideChair`); texto linha a linha com arte em 2 quadros por tipo (`ART`/`ART_SIMONE`), "Meu pai/Minha mãe salva as pessoas pelo telefone" no desenho; "O que aconteceu depois" → fios (thread-card ok/bad), estatísticas (pacientes-chave `keysSaved/KEY_PATIENTS`), Créditos/Título. `readableTitle` evita a Jacquard em caixa alta. `GameOver.tsx`: arte por tipo (exonerado/despejo/colapso/sindicância), linhas a cada 1,4 s, "Tentar o dia N de novo" (slot `dia`/`simone_dia`), Infinito: ranking/jogar de novo.

### Campanha da Simone
- `simone/SimoneNew.tsx`: "Do outro lado da linha"; Mesa 1 = protagonista (gênero, padrão = último terminado), Mesa 2 = Henrique; dificuldades Narrativo/Padrão/TARM Real.
- `SimoneDesk.tsx`: reutiliza Queue, CallPanel, MapPanel, RadioPanel, DeskBar (sem diário), ManualBook, CorkBoard, ModalStack, SceneOverlay, **InspectDrawer/RedThread (cópia do código de inconsistência da mesa)**; `SimoneTopBar` (TMA vs meta, passadas, advertências acumuladas da campanha, barra de pressão, saldo); `TriagePanel` (cor da pré-triagem com dica, "Pega essa agora" = fura fila, passar para Mesa 1/Henrique `sh.tarmPass`, TMA da ligação, voo do post-it); `RegDesks` (as duas mesas, ocupação, humor do Henrique por hora/dia, log); `SimoneTutorial`.
- `SimoneNight.tsx`: cena da noite (Simone/Wesley, `g.scene` com `sceneKind==='night'`), barras pressão/Wesley/emprego, `NightBills` (calculadora sem trava; `g.finishNight(chosen)`).

## 5. Áudio (src/client/audio)

- **Arquitetura**: `index.ts` `AudioEngine` singleton `audio`; estado "desejado" (`want`) aplicado quando o contexto nasce; no-op sem AudioContext. `core.ts`: `Clock` com lookahead (40 ms/0,3 s), `Banks` (ruídos, estalos, bolhas, gotas, KS, IR, ondas), `buildRig`: barramentos music/sfx/ambient/voice → master → mute → compressor → limitador → makeup 0,502; **linha telefônica** (HP 260/170, LP 3,7k, pico 1,7k, saturação) para vozes de chamador e para **todas as camadas de ambiente**; linha de rádio HT. `dsp.ts` (PRNG, nós, envelopes, ruídos, IR, Karplus-Strong), `kit.ts` (noiseHit, tone, bell, pluck, noiseBed).
- **Vozes** (`speech.ts` + `voice.ts`): balbucio por formantes (não TTS). `cleanText` remove `{{…|…}}`, `{m:…}`, prefixo "QUEM:"; `parseText` (`speech.ts:368-397`) quebra em sílabas; colchetes/parênteses viram efeitos (`SPECIALS :355-361`: risada, soluço, tosse, suspiro, respiração, senão pausa); dígitos viram palavras; CAIXA ALTA = ênfase; `buildPlan` temporiza/entoa e corta a 6 s (`MAX_LINE`) ou ao `fit` do texto; perfis `PROFILES :52-77` (homem, mulher, idoso/a, criança, menino, adolescente, jovem_h/m, grave, aguda, bêbado, profissional, simone, peixoto, henrique, bene, lucia, alex, davi(=Liam), zelia, cida, radio) e estilos (`specFor :80-115`: arrastada, sussurro, grito, choro, tremida, calma, ofegante, rindo, fantasma). `Speaker` (`voice.ts:76-369`) = fonte glotal + 3 passa-bandas + ruído para fricativas; `babbleBed` para fundos. **Uma voz de cada vez** (`index.ts:342-344`, a README diz "mesmo perfil" e "máx 3" — desatualizada).
- **Rádio** (`index.ts:360-406`): fila half-duplex, squelch/estalos/roger beep; abafado se alguém fala; atrasado demais vira só clique.
- **Efeitos** (`sfx.ts`): 31 nomes (stamp, click, hover, paper, type, warning, note, money, insight, wrong, coffee, photo — que silencia a central 1,4 s —, interfone, death, saved, tick, door, page, hangup, pickup, dialtone, busy, siren, thread, unlock, error, achievement, paper_slide, pen, radio_on/off). `hover`, `tick`, `thread`, `unlock`, `paper_slide`, `dialtone` não são usados pelas telas (só no laboratório).
- **Central** (`phone.ts`): `ringBurst`/`RingLoop` (toque 425 Hz FM, mais agudo com o dia; fantasma), `CentralHum` (120 Hz + piscadas), `Metronome` (RCP, acento a cada 30), `Heart` ("tum-tum", usado como "bip do monitor" na Intervenção).
- **Música** (`music.ts`): `HomeMusic` violão KS dedilhado, progressões por Laços com histerese, zumbido desafinado com Desgaste > 60, desafinação > 80; temas `titulo` (drone + violão + motivo de sinos "1-9-2" + telefone fantasma), `final_bom/normal/ruim`, `gameover`, `jornal`. Não há música para Simone, Intervenção, almoço ou "momento vaga zero".
- **Ambientes** (`ambient.ts`): 32 camadas (`AMBIENT_IDS :13-17`), `Layer` + `AmbientMixer` com crossfade e `TRIM`. `risadas` (`:389-398`, TRIM 1,8, evento a cada 2–6 s) é a "risada ao fundo" dos trotes (item 39).
- **Laboratório**: `lab.ts` (página `tools/audio-lab.html` — a README diz `/audio-lab.html`), `window.__audioLab.measureAll()`.
- **Onde as telas chamam o áudio**: store (eventos), CallPanel `:93` (voz do chamador), HomeDialogue `:31-37`, SimoneNight `:69-75`, Intervencao (`radio`, `setAmbient`, `heartbeat`, sirene), Rcp (`metronome`), botões (sfx).

### "piii" para xingamentos (item 38) — onde mexer
Hoje símbolos `#%!@$` são **ignorados** pelo regex de palavras de `parseText` (`speech.ts:372`) — só o `!` vira pontuação (ênfase). Caminho sugerido:
1. Em `parseText`, reconhecer uma sequência de símbolos (ex.: `/[#%@$&*!]{3,}/`) ou um marcador explícito `[piii]` e empurrar `specialSyl('bleep')` (novo valor em `RawSyl['special']`, `speech.ts:169`).
2. Em `specialSegs` (`speech.ts:573-613`) emitir um segmento novo (`kind: 'beep'`, ~1 kHz, 0,35–0,6 s) e no `Speaker.play` (`voice.ts:342-347`) zerar o envelope da voz e tocar um `tone()` senoidal no mesmo `dest` (passa pela linha telefônica e fica "de TV").
3. **Atenção ao regex de efeitos**: `SPECIALS[0] = /ri|riso|…/` casa qualquer rubrica que contenha "ri" — `[silêncio comprido]`, `[gritos]`, `(criança)`, `(marido)`, `(irritado)`, `(sem risco)` viram **risada** hoje (`speech.ts:356`). Um `[piii]` não casa (vira pausa), mas convém ancorar o regex (`\bri\b|^ri…`).
4. A transcrição já mostra o texto cru (CallPanel `Line`), então `#%!#@$` aparece como escrito; para destacar, pode-se envolver em `<span className="bleep">` no `Line` (`CallPanel.tsx:182-219`).

## 6. Intervenção (home/Intervencao.tsx)
- Relógio rAF próprio (`:48-69`; respeita `store.paused` e `settings.ritmo`), ambiente por lugar (`:82-101`, rua/bar/rio/praia/campo/festa/silêncio/risadas), para a música de casa.
- `FieldTop`: "INTERVENÇÃO · USA 01", equipe "Seu Bené (condutor) · Enf. Márcio · você", ocorrência n/3, relógio, pagamento.
- `FieldRadio`: retrato do Bené, "RÁDIO · REGULAÇÃO → USA 01", etiqueta `QRR_LABEL` (`:31`: 1 baixa, 2 moderada, 3 absoluta — **item 43**), texto datilografado + voz de rádio, QTH, instruções na 1ª vez, Enter/Espaço = "QSL, a caminho (QTY)".
- `FieldScene`: vista (de longe até `rt.secured`), estado (estabilidade/tendência), `Monitor` (rótulo do ritmo **escrito na tela** `fd-ritmo :392`, traçado ECG só distingue "fibrila" `:386`; demais ritmos = complexo normal ou linha reta se FC 0), sinais vitais `VITALS :22-30` (PA, FC, FR, **SpO₂**, Glic, Temp, Glasgow; só os que o caso define e foram medidos), `FieldLog`, ações 1–9 por grupo (cena, via, resp, circ, neuro, exp, med) com custo em segundos/progresso/estado falta|bloqueado|ocupado|feito, destinos REG/UPA/MAT/LOCAL (só com cena segura e sem ação em curso).
- `FieldResult` (desfecho, destino certo?, condutas que pioraram, pagamento, debrief, **referência** `d.source`), `FieldEnd` (resumo; texto "desgaste +FIELD_WEAR" ignora a dívida de sono que o TimeOff mostra).

## 7. Modo Inconsistência na interface (item 42 — tudo o que precisa sair)

| Onde | O quê |
|---|---|
| `screens/desk/Desk.tsx:18-19, 28-32` | imports `InspectDrawer`, `RedThread`; tipo `InspectSel` (também importado por SimoneDesk) |
| `Desk.tsx:39-41` | estados `sel`, `thread`, `insight` |
| `Desk.tsx:46-53` | `inspect`, `toggleInspect` (`sh.toggleInspect`) |
| `Desk.tsx:56-76` | `pick` → `sh.link(a,b)`, fio, banner |
| `Desk.tsx:83-85` | tecla **TAB** |
| `Desk.tsx:96-101` | banner some em 6,5 s |
| `Desk.tsx:111` | classe `inspecting` |
| `Desk.tsx:116, 130, 136` | `onPick/sel` para CallPanel, InspectDrawer, Ficha |
| `Desk.tsx:144-151` | dica "Modo Inconsistência…", banner "Inconsistência", `RedThread` |
| `desk/DeskBar.tsx:6, 34-38` | props `inspect/toggleInspect`; botão "Inconsistência TAB" |
| `desk/CallPanel.tsx:9, 16, 26, 66-70, 167, 182-207` | `PickFn`, `onPick/sel`, `inspect`, spans `.clue` clicáveis (o texto `{{…|id}}` pode continuar só como texto) |
| `desk/Ficha.tsx:10, 37, 80, 94-104, 137, 148, 153` | `clue()` no telefone, idade e endereço |
| `desk/InspectDrawer.tsx` (53 linhas) | gaveta Manual/Quadro/Mesa/Diário (`sh.clueCatalog`) — arquivo inteiro |
| `desk/RedThread.tsx` (31 linhas) | fio SVG — arquivo inteiro |
| `desk/Tutorial.tsx:22-23` | dica "Aperta TAB: Modo Inconsistência…" |
| `simone/SimoneDesk.tsx:14-15, 18, 28-62, 69-71, 91, 96, 101, 110-118` | cópia completa do modo na mesa da TARM |
| `home/Home.tsx:56, 63-85, 97, 116, 148` | TAB em casa, `home.markInspect()` (custa Laços), objetos da cena `sc.inspect.objects` |
| `home/HomeDialogue.tsx:11-12, 21-22, 39-70, 78-86, 90, 109-111` | pares de pistas `home.link`, hotspots, botão "Examinar/Parar de examinar TAB" (vira o "reparar" do item 58) |
| `screens/HowToPlay.tsx:34, 233, 307, 348, 463` | textos do Modo Inconsistência e do confronto |
| `store.ts:438-440` | evento `insight` → sfx insight/wrong (pode ficar para o "reparar") |
| CSS `desk.css:485-505` (`.clue.live/.sel`), `:965-969`, `:1156-1159`, `:1177-1328` (overlay, dica, gaveta, chips, banner, fio); `home.css:154-162, 170-224` (botão insp, insight, `.clue`, `inspecting`, `.hotspot` — reaproveitável no "reparar") |
| Motor (fora deste estudo, citado pela UI) | `shift.ts:398` escala de tempo 50%/70%, `toggleInspect :901`, `clueCatalog :905`, `link :951`, `confronto_quadro/endereco :770-818` |

## 8. Onde cada item do feedback toca a interface

| # | Toque na interface |
|---|---|
| 1 | — (conteúdo; feito) |
| 2–4 | Nenhum direto. 4: `Ending.tsx` mostra `e.threads` (fios) e linhas; o texto vem do motor. |
| 5–6 | Escolhas aparecem em `SceneOverlay`, `HomeDialogue` (aff/disabled/reason), `Report.tsx` (justificativa), `ModalStack` (opções do Peixoto). Consequência imediata pode usar toasts (`store.toast`, `sh.toast`, `home.toasts`). |
| 7 | `Home.tsx` (saldo no topo) e falas em `HomeDialogue` — texto do conteúdo; a UI só precisa expor saldo/origem. |
| 8 | Casa: nova cena em `HomeDialogue`; o "papel" é cartão do `CorkBoard` (`g.st.board`) — pode virar pista/objeto da casa. |
| 9 | Arte do desenho (`Home.tsx` objetos `desenhos`, `Ending.tsx` `desenho_davi`/kid-title). |
| 10 | Telas que leem `PROTAGONIST_FIRST`/`protagonistName`: `NewGame.tsx:33,52`, `LoadGame.tsx:20`, `Report.tsx:85`, `SimoneNew.tsx:41`, `TriagePanel.tsx:116`, `RegDesks.tsx:30` ("Dr./Dra. Moura"). Valor mora em `engine/text.ts:26` (ainda `Luan`/`Amber`). |
| 11 | `NewGame.tsx`: campo de nome (hoje só gênero). O nome precisa ir para o estado (não constante) e o `SaveSummary` (`settings.ts:153`) para `LoadGame.describe` e o aviso do NewGame mostrarem o nome escolhido. `settings.playerName` é outro conceito (ranking). |
| 12–14 | Arte (`art/`, fora daqui); `Portrait.tsx` já troca LUCIA→ALEX com protagonista F; `Home.tsx:105,122` idem. |
| 15–16, 21 | Conteúdo; SceneOverlay/HomeDialogue/ModalStack exibem. |
| 17 | Cenas antes/depois: `SceneOverlay` (central) ou nova etapa de `Home` (passos `pre`/`cena`); caminho de ida/volta precisaria de fundo novo (`drawScene` bg). |
| 18 | Almoço 13h: relógio parado + cena → o motor dispara cena e a `Desk` mostra `SceneOverlay` (já bloqueia fila e teclas quando `g.scene`). Áudio: sem música própria; `stopCentralHum`/ambiente de refeitório (pode usar `cozinha`/`multidao`). |
| 19 | `Intervencao.tsx` (FieldRadio `extra`, FieldResult debrief, FieldEnd). |
| 20 | `Ending.tsx` (ART/ART_SIMONE `:15-27`, threads, stats) + `music.ts` temas finais. |
| 22 | `TopBar.tsx:79-90` (garrafa, título com efeito), `HowToPlay.tsx:265-272`, `Home.tsx:144` (irritado). |
| 23 | `CallPanel VideoButton :298-321`, `VideoPanel.tsx`, `Report` linha VER. |
| 24 | `Ficha.tsx:83-84, 204-219` (viaturas/ETA), `MapPanel`, `RadioPanel`, painel Saúde+ (`TopBar :60-77`). |
| 25 | Custos `q.cost` no `Keypad` (`CallPanel :269`), `VideoPanel` spots, `Ficha` "Conferir no mapa (2′)". |
| 26 | Nenhum (bots). |
| 27–31 | Hoje vaga = pedido no `RequestTray.tsx` (opções simples). Negociação com argumentos, "viatura retida" e "passar ao Peixoto (1×/plantão)" precisam de nova UI: um diálogo próprio (retrato do plantonista via `Portrait`, opções de argumento) — pode reutilizar `ModalStack` bloqueante (já tem retrato e opções) ou uma variação do `SceneOverlay`. `MapPanel STATUS_PT.RETIDO` e chip `st-RETIDO` já mostram viatura retida. |
| 32 | "Tempo parando": novo overlay escuro + `store.pause`-like no motor (o `frame` só avança se fase plantão e não pausado); áudio: `stopCentralHum`, `ringLoop(false)`, novo tema/batida em `music.ts` (`playTheme` aceita só 6 tipos — `THEME_KINDS index.ts:58`) ou `heartbeat()` como pulso. |
| 33 | Post-it por cor: `Queue.tsx:58-65` (`.postit`/`.red`) e `CallPanel.tsx:49-53` (`.ch-tarm`/`.red`); CSS `desk.css:313-334, 1934-1950`. Hoje só amarelo/vermelho(urgente) — trocar por classes azul/rosa/verde/branco a partir de um campo `noteCat` do motor; o "Pega essa agora" pode continuar como selo. Simone (TriagePanel) já escolhe cor de triagem (não categoria). |
| 34 | `CorkBoard.tsx` inteiro: hoje só lista e acrescenta post-it texto em `flags.postits`. Mover/remover/cor/adesivos exigem estrutura (lista de objetos com x,y,cor,tipo) no estado e arrastar (pointer events) no `.cork-items` (`desk.css:1429-1476`). Adesivos do Ozzy: novo tipo de cartão. |
| 35–36 | `Keypad`/`orderQuestions` (`CallPanel.tsx:221-295`): grupos atuais `base/protocolo/ferramenta/especifica/confronto/fala/acalmar` (`engine/shift.ts:70`). Precisa: 5 fixas no topo + 4 caixas (botões Clínico azul/GO rosa/Trauma verde/Outros branco) que expandem perguntas; CSS `.kp-btn.g-*` (`desk.css:568-590`; `g-especifica`/`g-fala` hoje são CSS morto porque o TSX remapeia para `g-base` `:263`). Ferramentas (Falar com o paciente, Ligar de volta, Acalmar, Vídeo, Pôr em espera) ficam em `kp-actions`. |
| 37 | Caixa "Outros" (frases de meios próprios) no mesmo Keypad; respostas/efeito vêm do motor. |
| 38 | Áudio "piii" (§5) + transcrição `Line` (`CallPanel.tsx:182-219`) para símbolos; estilo de voz `grito` já existe. |
| 39 | Ambiente `risadas` (`ambient.ts:389-398`, `TRIM :708` 1,8) e `Intervencao.tsx:87` (`laughing`). Reduzir densidade/nível ou usar menos `amb: ['risadas']` no conteúdo. |
| 40 | Remover "Conferir no mapa"/"Confirmar o endereço" do médico: `Ficha.tsx:155-168`, `MapPanel :57-62, 72` (marcador/destaque dependem de `call.mapLookup`), `Tutorial.tsx:19-21`, `HowToPlay.tsx:33, 233`. Na Simone, a conferência pode entrar no `TriagePanel.tsx` (endereço já mostrado `:91-94`). |
| 41 | — (conteúdo; feito) |
| 42 | §7. |
| 43 | `Intervencao.tsx:31` (`QRR_LABEL`), `:191-192` (cabeçalho "→ USA 01" e etiqueta), `field.css:139-154` (cores q1–q3); a unidade fixa "USA 01" está em `FieldTop :133`. |
| 44 | Pontuação em `FieldResult` (`rt.harm`, `rt.pay`) — regra no motor. |
| 45 | `Monitor` `VITALS :22-30` já tem SpO₂; aparece só se `d.vitals.sat` existe e foi medida (`rt.shown`). |
| 46–50 | Ações vêm de `sim.visibleActions()`; a grade `fd-grid` (3 colunas, 52 px por linha, `field.css:373-380`) precisa caber mais botões (cateter, Venturi, máscara com reservatório, IOT, clopidogrel) — risco de transbordar (só teclas 1–9 têm atalho). |
| 51–52 | `Monitor` (`Intervencao.tsx:380-434`): **tirar o rótulo do ritmo** (`fd-ritmo`) quando o jogador deve interpretar; desenhar FV, TV sem pulso, assistolia (linha reta) e AESP (complexos sem pulso) no ECG; opcional "piii" contínuo da assistolia no áudio (hoje só `heartbeat`). CA-GA-DA vira ações. |
| 53 | `FieldResult` mostra `d.source` (`:493`). |
| 54 | `Home.tsx:117` só passa `ozzy: 'dormindo' | 'sentado'` a `drawScene`; correr latindo exige novo estado de animação na arte + latido (o ambiente `cachorro` passa pela linha telefônica — para casa precisaria tocar fora da linha). |
| 55–56 | Casa hoje é um quadro fixo por cena (`bg`) com botões; andar por cômodos e objetos clicáveis = nova navegação em `Home.tsx` (o mecanismo de `hotspot` de `HomeDialogue :59-70` + `objectRect/objectsFor` da arte serve de base). |
| 57 | `Bills.tsx` (feito) — mas ver risco de trava §9. |
| 58 | `HomeDialogue.tsx:39-70, 109-111` + `Home.tsx:63-85`: trocar pares/TAB/custo por hotspots sempre visíveis; um clique mostra o texto (`c.desc`) e libera a escolha. CSS `.hotspot` (`home.css:201-224`) reaproveitável. |

Versão 1.1.0 (HANDOFF "Ao terminar"): `Report.tsx:68` e `GameOver.tsx:30` têm `version: '1.0.4'` fixo.

## 9. Bugs, riscos, código morto e inconsistências

**Bugs/riscos reais**
1. **Trava nas contas** — `Bills.tsx:31-34, 95`: `short` inclui as contas automáticas (transporte R$ 20, `content/home-base.ts:13`). Se o saldo for menor que as automáticas, o botão fica desabilitado para sempre e não há como sair do passo `contas` (o motor aceitaria: `engine/home.ts:426` usa `max(0, money − autos)` e deixa o saldo negativo). Correção: calcular `short` só sobre as não automáticas, ou permitir pagar quando nada além das automáticas está marcado.
2. **Regex de rubricas** — `audio/speech.ts:356`: `/ri|…/` casa "comprido", "gritos", "criança", "marido", "irritado", "risco" → risada no lugar de pausa/choro.
3. **Ambiente da Intervenção pela linha telefônica** — `AmbientMixer` sempre usa `rig.in.ambient` (filtro de telefone, `ambient.ts:41`, `core.ts:312-313`): na rua, com o jogador presente, a rua/bar soa "pelo telefone".
4. **Zumbido some depois de Opções pela pausa** — `PauseMenu → setScreen('opcoes')` para hum/ambiente (`store.ts:161-165`); voltar a 'jogo' não chama `syncPhaseAudio`, então o zumbido da central só volta na próxima fase.
5. **Movimento reduzido**: `base.css:264-269` desliga `animation` dos toasts, inclusive a saída de 10 s → toasts ficam para sempre na tela (até 6).
6. **Saves da Simone/"dia" nunca vão ao servidor** — `api.ts:103` (`SLOT_RE`).
7. **Infinito: envio duplo** de pontuação/telemetria quando termina em game over (`Report.tsx:178` + `GameOver.tsx:26-33`).
8. **Ranking/GameOver infinito**: "Ver ranking" deixa o jogo anexado; Ranking "Voltar" vai ao título com `store.game` ainda setado (Opções/Carregar "Voltar" depois cai em 'jogo' = tela de game over). Mesmo padrão que Credits já corrige.
9. `Ficha.tsx:122-124`: `setTimeout(setRes)` durante o render (repete a cada render até sincronizar).
10. `MapPanel`: sem `onMouseLeave` — a dica fica presa depois que o mouse sai.
11. `mciState` (`MciPanel.tsx:10`) global de módulo: um resumo aberto sobrevive a sair para o título/nova partida.
12. `Bills`/`NightBills` calculam a pré-seleção só no primeiro render (`useState` inicializador).
13. `FieldEnd` (`Intervencao.tsx:520-523`) mostra desgaste +`FIELD_WEAR` sem a dívida de sono.
14. `PauseMenu` "Salvar no espaço 1" sobrescreve sem confirmação (há backup se for outra campanha/ponto anterior).
15. `CorkBoard` escreve direto em `g.st.flags` (fora do motor) — cuidado ao migrar o quadro (item 34) e com saves antigos (`postits` em string com `\u0001`).
16. `Newspaper` `.news-cols { overflow: hidden }` (`screens.css:488`): história longa é cortada sem aviso; `.postit { max-height: 56px; overflow:hidden }` corta o post-it no cartão (o inteiro aparece no `ch-tarm`).
17. `Rcp`: nome "Pedro" fixo na troca (`Rcp.tsx:106`); `DialogGuide` timeout usa `'"{dr}?!…"'.replace` manual.
18. Escala "inteira" não é inteira (`Stage.tsx:9`).
19. Cochilo captura todas as teclas em fase de captura (`Desk.tsx:181`) — se coincidir com RCP, o ESPAÇO acordaria em vez de comprimir (o motor provavelmente evita; não verificado).

**Código morto / não usado**
- `TopBar onPhoto` (no-op, `Desk.tsx:112`); `SFX` `hover`, `tick`, `thread`, `unlock`, `paper_slide`, `dialtone` sem uso nas telas; `.tremble` (`base.css:249`) não usada (usa-se `tremble-text`); CSS `.kp-btn.g-especifica/.g-fala` (remapeados no TSX); `api.ensureProfile/getProfile/listSaves/flush/sessionId` sem uso no cliente; `deleteLocalSave` só via lixeira; `infinite.ts` parâmetro `_s` ignorado; `audio.autoUnlock`/`mute` não usados pelo jogo; `utter` usado só no ambiente.
- README de áudio desatualizada: caminho do laboratório (`tools/audio-lab.html`), regra das vozes (uma só, não "mesmo perfil/3"), ambiente padrão 0,7 vs settings 0,6.

**Textos ("SAMU"/"192"/nomes)**
- Nenhum "SAMU" ou "192" visível ao jogador no cliente. Restos internos: classe `tb-samu` e var `--c-samu` (CSS), chave antiga `192plantao.` (migração, invisível), semente `192` e o motivo de sinos "1-9-2" do tema do título (`music.ts:328, 346, 354` — é som, não texto, mas é uma referência ao 192), semente `1920` do toque.
- Nomes antigos: `LoadGame.tsx:18` (comentário "Amber"); nomes reais vêm de `engine/text.ts:26` (`Luan`/`Amber`, item 10).
- "Polícia (190)" / "Bombeiros (193)" na Ficha e "CVV 188" no Como jogar são corretos.
- `HowToPlay.tsx` precisa de revisão para a 1.1: TAB/Inconsistência (34, 233, 307, 348, 463), "Confirmar o endereço" (233), café (265-272), perguntas (32), Intervenção, Ozzy.
