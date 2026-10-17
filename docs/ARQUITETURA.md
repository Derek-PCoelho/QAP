# Arquitetura

O jogo é um motor puro (TypeScript sem DOM), um conjunto de dados de conteúdo escrito como objetos TypeScript, uma interface React que só desenha o estado e envia ações, e um servidor Node opcional. Nada no motor depende do navegador: os bots, os testes e a simulação de balanceamento jogam a campanha inteira no Node.

```
            ┌──────────────── src/content ────────────────┐
            │ days/d01…d20  bank/  simone/  base  guides  │
            │ endings  home-base  defaults  dsl           │
            └───────────────┬─────────────────────────────┘
                            │ Content (content-api.ts)
┌───────────────────────────▼──────────────────────────────┐
│ src/engine  (puro, determinístico, serializável)         │
│  Game ── fases: jornal → plantão → relatório → casa       │
│   ├─ ShiftSim   relógio, fila, perguntas, inconsistências,│
│   │             carimbo, frota/rotas, rádio, pedidos,     │
│   │             piora, veredito, desfecho, relatório,     │
│   │             mesas de regulação por IA (campanha 2)    │
│   ├─ HomeSim    folga, cena, contas, loja, consequências  │
│   ├─ SceneRunner cenas (passagem de turno, eventos)       │
│   ├─ endings / grading / infinite / generator / simone    │
│   └─ city/  mapa 64×40, endereços, Dijkstra              │
└───────────────────────────┬──────────────────────────────┘
                            │ store.ts (laço rAF, eventos → áudio/telemetria/saves)
┌───────────────────────────▼──────────────────────────────┐
│ src/client  React 18                                      │
│  screens/  desk/  home/  simone/  minigames/  ui/          │
│  art/   pixel art procedural (canvas, paleta fixa)        │
│  audio/ síntese WebAudio (vozes, rádio, ambiência, música)│
│  api.ts  servidor local (opcional; desligado no JOGAR.html)│
└───────────────────────────┬──────────────────────────────┘
                            │ HTTP /api (opcional)
┌───────────────────────────▼──────────────────────────────┐
│ server/  Node puro: perfis, saves, ranking, telemetria,   │
│          /admin (métricas de calibragem), estático        │
│          SQLite (node:sqlite) ou JSON                     │
└───────────────────────────────────────────────────────────┘
```

## Motor

- **Estado** (`GameState`, `state.ts`): tudo o que o jogo precisa para continuar está num objeto serializável (`SAVE_VERSION`). O gerador aleatório (mulberry32) vive dentro do estado, então a mesma semente produz o mesmo jogo.
- **Saves só nas fronteiras de fase**: um plantão interrompido recomeça do jornal daquele dia. Isso mantém o save pequeno e evita estados intermediários inválidos.
- **Tempo**: 1 segundo real ≈ 1 minuto de jogo no Padrão (0,62 no Narrativo). Perguntas e ferramentas custam minutos de uma vez. O Modo Inconsistência reduz a escala para 50% (70% com Desgaste alto). Durante a orientação por telefone, o relógio é ajustado para que o tempo de chegada da viatura caiba no minijogo.
- **Agenda de eventos** (`ShiftSim.schedule`): chegada de ligação, desistência, viatura (chegada, cena, transporte, hospital, liberação), linha do tempo do dia, retorno de caso dispensado, revelação de auditoria, expiração de pedido de rádio, decisões das mesas de IA, fim do turno.
- **Verdade e veredito** (`grading.ts`): cada ligação tem uma verdade (`TruthDef`: diagnóstico, gravidade, recursos aceitáveis, apoio, destino, perguntas obrigatórias, janela de risco). O veredito é calculado no carimbo, mas só é revelado quando a viatura chega ou na auditoria do fim do dia. A punição é assimétrica: mandar a mais é nota de auditoria; mandar a menos ou dispensar emergência é advertência (e sindicância se houver óbito).
- **Desfecho clínico**: a sobrevivência depende do tempo entre a chegada da ligação (ou a piora, com `resetRisk`) e o cuidado adequado, com bônus pela qualidade da orientação por telefone.
- **Risco durante a conversa**: o tempo de conversa antes da decisão conta para a janela de risco a 30% (`CALL_RISK_RATE`), e a janela é escalada pela dificuldade (`RISK_SCALE`). Perguntar bem não mata ninguém; demorar demais, sim.
- **Videoatendimento** (`video.ts` + `content/video.ts`): cena gerada da verdade clínica (ou escrita no campo `video` da ligação), custos em minutos, franquia e sinal por bairro. Ver [`VIDEOCHAMADA.md`](VIDEOCHAMADA.md).
- **Intervenção** (`field.ts` + `content/field.ts`): o plantão extra na ambulância é um motor à parte, em segundos reais, chamado pela casa (`HomeSim.chooseTimeOff('bico')` → passo `intervencao` → `finishField()`). Deixa a flag `noite_em_claro`, que o `ShiftSim` do dia seguinte transforma em três eventos `cochilo` (`acordar()` custa 1 min; `cochilar()`, 4). Ver [`INTERVENCAO.md`](INTERVENCAO.md).
- **Campanha da Simone** (`simone.ts` + seção TARM do `shift.ts`): o mundo roda num estado-sombra (`GameState.shadow`) onde o protagonista é controlado pela IA. A jogadora faz a pré-triagem; as mesas (Mesa 1 e Henrique) decidem com uma precisão que depende da cor escolhida, da hora e do dia, e o resto da simulação (frota, desfechos) é a mesma da campanha 1.

## Conteúdo

O conteúdo é escrito em TypeScript com ajudantes (`dsl.ts`): condições (`is.flag`, `is.v`), efeitos (`fx.set`, `fx.add`, `fx.money`), números e endereços recorrentes. Funções aparecem onde o texto ou a verdade dependem do estado (`truth: (c) => …`, `t: (c) => …`). Marcação de pistas dentro do texto: `{{trecho|id}}`. Tokens de gênero e de nome: `{dr}`, `{Dr}`, `{m:o|a}`, `{nome}`.

Os dias se conectam por **flags** (ex.: `bombinha` no dia 3 muda a verdade da ligação de casa no dia 9). A lista de flags que cada dia lê e escreve está em [`CONTEUDO.md`](CONTEUDO.md) e é conferida pelo teste de conteúdo.

O validador (`tests/content.test.ts`) confere, para todos os dias: endereços existentes no mapa, pistas citadas nos vínculos de inconsistência, horários, ids únicos, perguntas obrigatórias existentes, guias existentes, cenas com nós válidos e jornais. Os bots (`tests/bot.test.ts`) jogam a campanha inteira com quatro perfis.

## Interface

- `store.ts` é o único estado de interface fora do React: segura o `Game`, roda o laço `requestAnimationFrame`, traduz eventos do motor em sons, toasts, conquistas, saves automáticos e telemetria.
- O palco tem 1280×720 e é escalado para a janela (inteiro, para o pixel ficar nítido, ou contínuo).
- A arte é procedural (`src/client/art`): retratos, cenas, mapa e objetos são desenhados em canvas a partir de uma paleta fixa e de sprites em texto, sem imagens externas. Direção de arte em [`ARTE.md`](ARTE.md).
- O áudio é sintetizado em tempo real (`src/client/audio`): vozes por formantes a partir do texto, filtro de telefone e de rádio, ambiências em camadas, toque, metrônomo, música do violão em casa. Nenhum arquivo de som.

## Servidor

`server/` usa apenas módulos nativos do Node e é empacotado em um arquivo (`dist/server/server.mjs`). Escolhe SQLite quando disponível (`node:sqlite`) e JSON nos outros casos. Rotas principais: `/api/health`, `/api/profiles`, `/api/saves/:perfil/:slot`, `/api/ranking`, `/api/telemetry`, `/api/metrics`, `/admin`. Detalhes em [`server/README.md`](../server/README.md).

## Builds

| Comando | Saída |
|---|---|
| `npm run build:client` | `dist/client` (servido pelo servidor local) |
| `npm run build:standalone` | `dist/standalone/index.html` → `JOGAR.html` (tudo embutido, inclusive as fontes) |
| `npm run build:server` | `dist/server/server.mjs` |

No `JOGAR.html` a constante `__STANDALONE__` desliga a API: o jogo nunca tenta falar com um servidor.
