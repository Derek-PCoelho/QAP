# QAP — Emergency Dispatch

> *Cada segundo é uma escolha. Cada escolha tem um nome.*

Simulador narrativo de regulação médica de urgência, em pixel art 2D. Você é o médico (ou a médica) regulador(a) da Central de Regulação de Santa Aurora, uma cidade fictícia de 300 mil habitantes, durante 20 plantões. Atende a ligação, faz as perguntas certas, desconfia do que não fecha, pede vídeo quando a história não fecha, classifica, escolhe a viatura e o hospital, orienta por telefone até a equipe chegar. Depois volta para casa, onde o Liam, a Dona Zélia e a Lúcia (ou o Alex, se você jogar com a médica) esperam, e as contas também. Ou emenda a noite na ambulância, por dinheiro, e chega no dia seguinte sem ter dormido.

*QAP*, no código Q do rádio, quer dizer "na escuta".

Depois do primeiro final, abre a **Campanha da Simone**: os mesmos 20 dias vistos pela TARM da mesa ao lado.

---

## Como jogar

Há quatro jeitos. Os dois primeiros não precisam instalar nada. No jogo, o menu principal tem **Como jogar**: o plantão passo a passo, as siglas e os controles.

### 1. Programa de desktop (Windows, Mac e Linux)

Em **`executaveis/`** há um pacote por sistema (Windows, Mac com chip Apple, Mac Intel e Linux), cada um com um `LEIA-ME.txt` para a primeira abertura. O jogo abre em tela cheia (F11 ou Alt+Enter alterna) e grava saves, opções e conquistas em arquivos na pasta do usuário. É a versão que vai para a Steam. Detalhes em [`docs/DESKTOP.md`](docs/DESKTOP.md).

### 2. Duplo clique no navegador (offline)

Abra **`JOGAR.html`**. O jogo inteiro está nesse arquivo: roda em qualquer navegador moderno, sem internet e sem servidor. Os saves ficam no próprio navegador.

### 3. Com o servidor local (saves, ranking e painel de métricas)

Precisa do [Node.js](https://nodejs.org) 18 ou mais novo (o 22 é o recomendado).

- **macOS:** dê duplo clique em **`start.command`**. Na primeira vez, se o macOS bloquear, clique com o botão direito → *Abrir*.
- **Linux/macOS pelo terminal:** `./start.sh`
- **Qualquer sistema:** `node dist/server/server.mjs --open`

O jogo abre em `http://localhost:7270`. O servidor guarda perfis, saves (também no navegador), o ranking do Plantão Infinito e a telemetria do playtest. O painel com as métricas de calibragem fica em `http://localhost:7270/admin`.

Se o Node não estiver instalado, o `start.command` abre o `JOGAR.html` no lugar.

### 4. Desenvolvimento

```bash
npm install
npm run dev        # jogo em http://localhost:5173 (com recarga), API em :7270
npm test           # testes (conteúdo, motor, bots, servidor, campanha da Simone)
npm run validate   # só o validador de conteúdo
npm run simulate   # simulação de balanceamento (bots jogando a campanha inteira)
npm run build      # gera dist/client, dist/standalone, JOGAR.html e dist/server
npm run build:desktop   # programa de desktop das quatro plataformas em desktop/release/ (ver docs/DESKTOP.md; para a Steam: -- --release)
```

---

## Controles

| Tecla / ação | O quê |
|---|---|
| Clique no cartão da fila | Atender a ligação |
| Botões do teclado de perguntas | Perguntar (cada pergunta custa minutos do relógio) |
| `TAB` | **Modo Inconsistência**: clique em duas pistas que se contradizem (ou se confirmam). O tempo corre mais devagar |
| `M` | Manual de Regulação |
| `Q` | Quadro de cortiça (números de trote, documentos, post-its) |
| `D` | Diário (os nomes de quem você atendeu e o que aconteceu depois) |
| `ESPAÇO` | Compressão no minijogo de RCP guiada |
| `T` | Pedir para trocar quem faz a massagem quando cansar |
| `Esc` | Pausa (salvar, opções, sair) |
| `1`–`9` | Ações na Intervenção (plantão extra na ambulância) |
| Clique ou qualquer tecla | Acordar quando as pálpebras pesarem (dia seguinte à Intervenção) |
| `F11` ou `Alt+Enter` | Tela cheia ou janela (programa de desktop; no Mac também `Ctrl+Cmd+F`) |
| Botão "Adiantar" (fila vazia) | O relógio corre 4× até a próxima ligação |

Parâmetros de URL úteis para testar: `?speed=8` (relógio 8× mais rápido), `?dia=9` (o novo jogo começa no dia 9), `?simone=1` (libera a campanha da Simone).

---

## O que tem no jogo

- **20 dias roteirizados**, cada um com 8 a 14 ligações (âncoras fixas + ligações comuns), passagem de turno, linha do tempo de rádio e interfone, jornal da manhã e uma cena em casa.
- **Ligações variáveis** (opcional): as ligações comuns são sorteadas de um banco de modelos com a mesma abertura e verdades diferentes. Decorar não serve.
- **Modo Inconsistência**: o "fio vermelho" que liga a fala de quem liga com o mapa, o quadro de trotes, o manual, os documentos da mesa e o diário. Em casa, o mesmo modo serve para perceber o que a família não diz.
- **Frota simulada no mapa** (64×40 quadras, 9 bairros, ruas com numeração métrica, trânsito e alagamento): tempo de chegada real, retenção de maca, pane, "vaga zero", rendez-vous USB+USA.
- **Videoatendimento (Programa VER)**, a partir do dia 3: pedir para quem liga abrir a câmera. Caro (minutos, franquia de 3 por plantão, sinal fraco em alguns bairros) e limitado (mostra cor da pele, esforço para respirar, sangue, o ambiente; não mostra pressão, glicemia nem o que está fora do quadro). Bom contra trote e contra quem minimiza; ruim com vítima escondida ou crise suicida. Ver [`docs/VIDEOCHAMADA.md`](docs/VIDEOCHAMADA.md).
- **Código Q no rádio** (QAP, QTH, QSL, QTY, QUS, QRR…), com a tradução ao passar o mouse e um apêndice no Manual.
- **Orientação por telefone** em minijogos: RCP com metrônomo, desengasgo, parto, hemorragia, crise de ansiedade (respiração guiada), intoxicação, anafilaxia, asma, convulsão, trauma, AVC, afogamento, múltiplas vítimas (triagem START no dia 15).
- **Consequências**: o veredito aparece quando a viatura chega (ou na auditoria do fim do dia); casos dispensados ligam de novo; o que fica na fila às 19h vai para o plantão noturno do Dr. Henrique.
- **Casa**: folga (descansar, família ou plantão extra), contas no estilo planilha da semana, loja, eventos que se resolvem sem você se você estiver fora.
- **Intervenção (plantão extra na ambulância)**: meio plantão noturno na USA 01 com o Seu Bené. Três ocorrências em tempo real (o paciente piora enquanto você decide; cada ação leva segundos da equipe): infarto, parada, hipoglicemia, AVC, asma, anafilaxia, trauma, parto, convulsão, cena insegura, afogamento, intoxicação e trote. Paga mais, custa o evento da família e deixa você com três horas de sono: no dia seguinte, a tela escurece em três cochilos. Ver [`docs/INTERVENCAO.md`](docs/INTERVENCAO.md).
- **Quatro finais** (ruim, normal, bom e um secreto) e o epílogo com o destino de cada fio da história.
- **Plantão Infinito**: turnos gerados com semente do dia e ranking.
- **Campanha da Simone** (TARM): pré-triagem, prioridade e escolha entre a Mesa 1 (o protagonista, controlado pela IA) e a Mesa 2 (o Henrique), com a vida dela, o Wesley e a pressão alta.
- **Dificuldades**: Narrativo, Padrão e Regulador Real.
- **Conquistas**, saves em slots, opções de áudio e de texto, e o **ritmo do plantão** (normal, calmo ou bem calmo).
- **Saves guardados**: apagar um save, terminar a campanha ou começar outra por cima guarda uma cópia por 30 dias (no máximo 10), em Carregar → "Saves guardados".
- **Como jogar** no menu: passo a passo, **abordagens por situação** (o que perguntar e o que decidir em cada tipo de ligação, para estudar antes de jogar), **detalhes** de cada mecânica (café, foto, painel da Saúde+, atributos, contas, finais), siglas e controles.
- **Ozzy**, o lulu da pomerânia laranja da família: brincar com ele antes de dormir alivia o desgaste. Nada de ruim acontece com ele.

---

## Estrutura

```
pasta-do-jogo/
├── executaveis/            ← o programa de desktop pronto: Windows, Mac (chip Apple e Intel), Linux
├── JOGAR.html              ← o jogo inteiro em um arquivo (duplo clique)
├── start.command / start.sh← sobem o servidor local e abrem o navegador
├── dist/
│   ├── client/             ← build web (servido pelo servidor local)
│   ├── standalone/         ← build de arquivo único (origem do JOGAR.html)
│   └── server/server.mjs   ← servidor sem dependências (Node puro)
├── src/
│   ├── engine/             ← motor puro e determinístico (sem DOM)
│   ├── content/            ← os 20 dias, banco de ligações, manual, guias, finais, campanha da Simone
│   └── client/             ← interface React, arte procedural em pixel art, áudio sintetizado
├── server/                 ← servidor local (saves, ranking, telemetria, /admin)
├── desktop/                ← programa de desktop (Electron): janela, saves em arquivo, empacotamento
├── tests/                  ← Vitest
├── scripts/                ← simulação de balanceamento, dev, cópia do standalone
├── tools/                  ← páginas de laboratório de arte e de áudio (não fazem parte do jogo)
└── docs/                   ← design, direção de arte, conteúdo, arquitetura, validação médica
```

Documentos:

- [`docs/GDD-original.md`](docs/GDD-original.md): o documento de design de origem.
- [`docs/ARTE.md`](docs/ARTE.md): direção de arte (paleta, tipografia, pixel art, regras de composição).
- [`docs/CONTEUDO.md`](docs/CONTEUDO.md): bíblia de conteúdo (personagens, fios, flags entre os dias).
- [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md): como o motor, o conteúdo, a interface e o servidor se encaixam.
- [`docs/VALIDAR_MEDICO.md`](docs/VALIDAR_MEDICO.md): **lista para a equipe médica revisar** (todos os diagnósticos, decisões corretas, janelas de risco, roteiros de orientação e casos da Intervenção).
- [`docs/SEGURANCA.md`](docs/SEGURANCA.md): auditoria de segurança (checklist da Steam), correções, riscos aceitos e o que falta configurar na conta Steamworks.
- [`docs/FONTES.md`](docs/FONTES.md) e [`docs/fontes/`](docs/fontes/): de onde vêm as regras (protocolos reais de regulação e de campo, ACLS, PALS, AMLS, ATLS, PHTLS, USP) e o registro da revisão médica feita com eles.
- [`docs/VIDEOCHAMADA.md`](docs/VIDEOCHAMADA.md) e [`docs/INTERVENCAO.md`](docs/INTERVENCAO.md): as duas mecânicas novas, com regras e guia para escrever conteúdo.
- [`docs/BALANCEAMENTO.md`](docs/BALANCEAMENTO.md): resultado da simulação com os perfis de jogador.
- [`docs/DESKTOP.md`](docs/DESKTOP.md): o programa de desktop (onde ficam os saves, como gerar os pacotes, o que falta para a Steam).

---

## Aviso

O jogo trata de emergências médicas, morte, violência doméstica e crise emocional, com cuidado e sem detalhar métodos. As condutas clínicas seguem a lógica geral da regulação médica de urgência brasileira (fontes em `docs/FONTES.md`) e foram revisadas pela equipe médica do projeto (registro em `docs/VALIDAR_MEDICO.md` e `docs/fontes/`), mas **foram escritas para um jogo**. Não use o jogo como protocolo.

Em sofrimento emocional, ligue 188 (CVV) ou acesse cvv.org.br. Em emergência médica, ligue para o serviço de emergência da sua cidade.

## Créditos

Design, roteiro, código, arte procedural e áudio sintetizado gerados para este projeto. Fontes: Pixelify Sans, VT323 e Jacquard 24 (SIL Open Font License), via Fontsource.
