# Passagem de plantão (contexto para a próxima sessão)

> **Atualização de 17/10 (fim do dia):** o estado atual da 1.1 e o que falta estão em [`docs/HANDOFF-1.1.md`](HANDOFF-1.1.md). Leia esse arquivo primeiro.

Leia isto primeiro, depois `docs/FEEDBACK-1.1.md` (a lista de trabalho, 58 itens) e `docs/ARQUITETURA.md`.

## O projeto
"QAP — Emergency Dispatch": simulador de regulação médica de urgência em pixel art, pt-BR (React 18 + TypeScript strict + Vite; motor puro em `src/engine`; conteúdo em `src/content`; programa de desktop Electron em `desktop/`; alvo Steam). Versão atual: **1.0.4**. A próxima será a **1.1.0**, com o feedback do jogador.

O jogador é médico regulador e escreve em português, curto e simples. Respostas longas e técnicas não ajudam ("entendi nada"): diga o que mudou em poucas linhas.

## Como trabalhar
- `npm ci` → `npx tsc --noEmit -p tsconfig.json` → `npx vitest run` (140 testes na 1.0.4) → `npm run simulate` (bots; a dificuldade NÃO pode subir — ver `docs/BALANCEAMENTO.md`).
- `npm run build` gera `JOGAR.html`, o artefato web e o servidor. `node desktop/build.mjs` gera os programas de teste; `--release` gera a versão final (sem `window.__store`, sem `?dia`/`?speed`).
- Testes de interface: `npx vite --port 5391`, Playwright com `window.__store` (só em builds de teste). Ex.: `?dia=2` começa no dia 2.
- Saves antigos (o jogador tem um save no dia 6, campanha da Camille/ex-Amber) **precisam continuar abrindo**: `src/engine/save-check.ts` confere e `SAVE_VERSION` em `state.ts`; migre em vez de quebrar.
- Preferências do jogador para entregas: fazer sozinho o que é reversível; avisar antes do que é irreversível; versões antigas vão para quarentena com prazo (`_entrega/arquivos_antigos/<data>/` com LEIA-ME), nunca apagadas direto; dizer se uma mudança pode quebrar caminhos ou programas.
- Nada de "SAMU" nem "192" no texto do jogo (o serviço é "a Regulação"). Doses e condutas conferidas com `docs/fontes/` (protocolos enviados pelo jogador); marque o que for novo com `// [validar]`.

## Já feito nesta rodada (17/10)
- Dia 12: "segunda à noite" → "domingo à noite" (`src/content/days/d12.ts`).
- Asma: a asma moderada do banco (`src/content/bank/resp.ts`) não tem mais fala entrecortada nem tiragem; fala entrecortada é sempre USA.
- Contas (`src/client/screens/home/Bills.tsx`): calculadora "Saldo agora / Contas marcadas / Fica" que muda a cada clique; marcar além do saldo é permitido, só o pagamento pede para desmarcar (o bug era o jogo recusar a marcação em silêncio, então o valor nunca mudava).
- `docs/FEEDBACK-1.1.md`: os 58 itens do jogador, na ordem dele.

## Decisões de projeto já tomadas (siga)
- **Nomes:** protagonista mulher = **Camille** (era Amber), homem = **Thiago** (era Luan), com opção de renomear na tela de nova campanha. Os nomes moram em `src/engine/text.ts` (`PROTAGONIST_FIRST`, `{nome}`). Renomear NPCs que colidem: paciente "Thiago, 28" do dia 11 e o irmão "Tiago" da Carla (caso de 2019).
- **Família:** com a Camille, o marido (Alex) é branco, cabelo preto; com o Thiago, a esposa (Lúcia) é asiática de pele clara, bonita; o filho Liam é branco. Retratos em `src/client/art/portraits.ts`/`faces.ts`/`portraitKit.ts`, corpos em `figures.ts`.
- **Modo Discrepância/Inconsistência:** sai do plantão (TAB, `links`, `{{trecho|pista}}` como mecânica, `InspectDrawer`, `RedThread`, `confronto_*` que dependem dele, a escala de tempo de 50%). O que ele desbloqueava (perguntas `locked`, escolhas `needLink`) precisa de outro gatilho: pergunta certa, vídeo, ou o novo "reparar". O texto com `{{...|id}}` pode ficar (é só mostrado como texto).
- **Examinar em casa (item 58):** vira "reparar": objetos marcados na cena, um clique mostra o que se notou e libera a escolha. Sem pares, sem TAB, sem custo de Laços.
- **Perguntas:** fixas = Tem pulso? · Respira? · Cor da pele? · Está acordado? · O que aconteceu?. Quatro caixas: Clínico (azul), GO (rosa), Trauma (verde), Outros (branco). Abrir uma caixa acrescenta as perguntas daquela categoria (e as perguntas específicas da ligação que forem dessa categoria). Outros = frases de "meios próprios" para o solicitante folgado. "Falar com o paciente", "Ligar de volta", "Acalmar", "Vídeo" e "Pôr em espera" ficam como ferramentas. "Confirmar endereço" sai do médico: é tarefa da Simone (TARM). Respostas para as perguntas novas (pulso, pele, categoria) vêm de `src/content/defaults.ts`, derivadas da verdade clínica e da cena do vídeo (`src/content/video.ts` já sabe a cor da pele de cada quadro); escreva à mão onde importa.
- **Folgados:** ligações novas (banco) de quem quer ambulância como táxi/consulta; algumas xingam: bipe "piii" no áudio (`src/client/audio`) e símbolos na transcrição (`#%!#@$`), cômico, criativo, sem palavrão escrito.
- **Post-its da Simone:** cor por categoria (azul Clínico, rosa GO, verde Trauma, branco quando ela não sabe); a cor também pode estar errada quando a nota está errada.
- **Quadro de cortiça:** mover, remover, escolher a cor antes de colar, adesivos do Ozzy.
- **Vaga zero:** começa cedo (por volta do dia 3–5, não só 19–20) e é sempre negociada: diálogo com o plantonista do hospital (ele diz que está lotado e argumenta); o jogador escolhe argumentos (ex.: "se a tomografia não mostrar nada, tiro o paciente e levo pra UPA"); sem acordo, a viatura fica retida até liberar vaga; 1 vez por plantão dá para passar ao Dr. Peixoto. Momento com o "tempo parando" (clímax de Papers, Please: tela escurece, relógio para, música/batida). Hoje existe só um pedido de rádio simples em `ShiftSim.onHospital` (`kind: 'vaga'`).
- **Almoço às 13h:** pausa no plantão (relógio parado) com cena da equipe a cada dia, para dar peso aos personagens.
- **Recursos (sem ficar mais difícil):** café, VER (3 vídeos), USA/USB e o tempo das perguntas têm de fazer diferença; calibrar com os bots.
- **Intervenção** (`src/engine/field.ts`, `src/content/field.ts`, `src/client/screens/home/Intervencao.tsx`): USA = QRR 3, USB = QRR 2 (urgente); hipoglicemia tratada certo sem punição por não abrir a bolsa; saturação aparece nos sinais vitais; O2 só quando escolhido (DPOC alvo 88–92%; infarto só com Sat < 90%); clopidogrel junto do AAS; cateter nasal / Venturi / máscara com reservatório + intubação; parada com leitura de ritmo (FV/TVsp chocável; assistolia/AESP não chocável → CA-GA-DA e adrenalina). Histórias próprias das noites.
- **Casa:** explorar cômodos, objetos clicáveis, algo diferente por cômodo em cada dia; Ozzy corre latindo pela sala e dorme no tapete.
- **História:** dar uso às flags esquecidas (lista no item 3 do FEEDBACK: henrique_maos_d1, promessa_bene, cida_costurava, alianca_vendida, anotou_henrique_d10 etc.); o dinheiro do vereador muda as falas da família; o bilhete sobre o Henrique errar o endereço (dia 10) tem consequência; desenho do Liam pesa; reviravoltas; cenas de ida e volta do plantão; finais com texto e arte melhores (`src/content/endings.ts`, `src/engine/endings.ts`, `src/client/art/endingArt.ts`); acertar o epílogo do Henrique (não denunciado + sobreviveu); atualizar `docs/CONTEUDO.md`.

## Ao terminar
Subir a versão para 1.1.0 (`package.json`, `GameOver.tsx`/`Report.tsx` submitScore), rodar tudo, gerar os builds e marcar os itens em `docs/FEEDBACK-1.1.md`.
