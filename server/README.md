# Servidor do QAP — Emergency Dispatch

Servidor local do jogo: entrega o cliente compilado (`dist/client`), guarda perfis,
saves, ranking e telemetria, e calcula as métricas de calibragem do playtest
(seção 2.8 do design) num painel em `/admin`.

Usa **só módulos nativos do Node** (`node:http`, `node:fs`, `node:sqlite`…): o bundle
`dist/server/server.mjs` roda com `node` puro, em qualquer Node ≥ 18, sem `npm install`.

## Como rodar

| Situação | Comando |
|---|---|
| Jogar (tudo compilado) | `npm run build` e depois `npm start` |
| Abrir o navegador sozinho | `node dist/server/server.mjs --open` |
| Só recompilar o servidor | `npm run build:server` |
| Desenvolvimento | `npm run dev` → jogo em http://localhost:5173, API em http://localhost:7270 |

`npm run dev` (`scripts/dev.mjs`) compila o servidor com o esbuild em modo watch,
reinicia o processo a cada alteração em `server/` e sobe o Vite (que repassa `/api`
para a porta 7270). **Ctrl+C encerra tudo** e o servidor grava os dados antes de sair.

Opções de linha de comando: `--open` (`-o`), `--port <n>` (`-p`), `--host <endereço>`, `--help` (`-h`).

Se o cliente ainda não foi compilado, o servidor sobe mesmo assim: `/` responde 503
com uma página explicando como compilar; a API e o `/admin` funcionam normalmente.

## Variáveis de ambiente

| Variável | Padrão | Para quê |
|---|---|---|
| `PORT` | `7270` | Porta (`0` = qualquer porta livre). |
| `HOST` | `127.0.0.1` | Endereço. Use `0.0.0.0` para um playtest na rede local (o banner mostra os IPs). |
| `DATA_DIR` | `<projeto>/data` | Onde ficam os dados (raiz do projeto = pai de `dist/`). |
| `CLIENT_DIR` | `dist/client` | Pasta do cliente compilado. |
| `STORE` | automático | `sqlite` ou `json` para forçar o armazenamento. |
| `TRUST_PROXY` | desligado | `1` = usar o `X-Forwarded-For` como IP do cliente (só atrás de proxy reverso; senão todos os jogadores dividem o mesmo limite de taxa). |
| `ALLOWED_ORIGINS` | — | Origens extras com CORS liberado, separadas por vírgula. |
| `LOG_REQUESTS` | desligado | `1` = registra cada requisição no terminal (sem o id de perfil nem tokens). |
| `ALLOWED_HOSTS` | — | Nomes de `Host` aceitos além de IPs, `localhost` e o nome da máquina (proteção contra DNS rebinding; ex.: domínio de um proxy reverso). |
| `ADMIN_TOKEN` | — | Libera o `/admin` e as métricas pela rede (sem ele, só neste computador). Use 16+ caracteres aleatórios; abra `/admin?token=…` uma vez (vira cookie). |
| `DISABLE_SAVES`, `DISABLE_RANKING`, `DISABLE_TELEMETRY` | desligado | `1` = desliga essa parte da API (resposta 503) sem atualizar o servidor. |

Com `HOST=127.0.0.1` o servidor também escuta em `::1`, porque no macOS `localhost`
pode resolver primeiro para IPv6 (e o proxy do Vite aponta para `localhost:7270`).

## Armazenamento

Na partida o servidor escolhe o backend (ou obedece `STORE`):

- **SQLite** — quando o Node tem `node:sqlite` (22.5+; sem flag a partir do 22.13).
  Um arquivo só: `DATA_DIR/qap.sqlite` (modo WAL). O aviso
  "ExperimentalWarning: SQLite…" do Node é silenciado.
- **JSON** — nos demais casos. Um arquivo por coleção: `profiles.json`, `saves.json`,
  `ranking.json`, `telemetry.json`. Os dados ficam em memória; as gravações são
  agrupadas (400 ms após a última alteração, no máximo 3 s) e atômicas (arquivo
  temporário + fsync + rename). Ctrl+C/SIGTERM grava o que estiver pendente.
  Um arquivo ilegível é renomeado para `*.corrompido-<data>` e a coleção recomeça vazia.

Na **primeira** execução com SQLite numa pasta que já tinha os `.json`, tudo é importado
para o banco automaticamente (os `.json` ficam intactos como backup). O caminho inverso
(voltar para um Node sem SQLite) não é automático: os `.json` antigos voltariam a valer.

Travas contra encher o disco (importam quando o servidor fica exposto na rede):
10 mil perfis, 512 MB de saves no total, 100 mil recordes (resposta 507) e telemetria
limitada a 250 mil eventos no JSON / 1 milhão no SQLite (os mais antigos saem primeiro).

Backup: copie a pasta `data/` com o servidor parado.

## API

Tudo é JSON. Erros vêm como `{ "error": "mensagem em português" }` com o status
adequado (400 entrada inválida, 403 origem não permitida, 404, 405, 413 corpo grande
demais, 429 limite de taxa, 507 servidor cheio, 500 erro interno).

| Método e rota | Corpo / parâmetros | Resposta |
|---|---|---|
| `GET /api/health` | — | `{ ok: true, version, storage: 'sqlite'\|'json', time }` |
| `POST /api/profiles` | `{ name }` (1–24 caracteres) | `201 { id, name, createdAt }` |
| `GET /api/profiles/:id` | — | `{ id, name, createdAt }` |
| `GET /api/saves/:profileId` | — | `[{ slot, savedAt, summary }]` (ordem: auto, 1, 2, 3, infinito) |
| `GET /api/saves/:profileId/:slot` | — | `{ slot, savedAt, summary, data }` |
| `PUT /api/saves/:profileId/:slot` | `{ data, summary }` | `{ ok: true, slot, savedAt }` |
| `DELETE /api/saves/:profileId/:slot` | — | `{ ok: true, deleted }` (idempotente) |
| `GET /api/ranking` | `?mode=infinito&seed=<rótulo>&limit=20` | `[{ name, score, calls, correct, seed, createdAt }]` |
| `POST /api/ranking` | `{ profileId?, name, score, calls, correct, seed, mode, version }` | `{ ok: true, improved, rank, best }` |
| `POST /api/telemetry` | `{ sessionId, profileId?, events: [{ name, data, t }] }` | `{ ok: true, accepted, rejected }` |
| `GET /api/metrics` | `?difficulty=padrao&since=2026-10-01` | relatório de calibragem (abaixo) |
| `GET /admin` | — | painel HTML |

Detalhes e validação:

- **id de perfil**: 16 caracteres `[A-Za-z0-9_-]` (aleatório). Funciona como senha do perfil: quem tem o id lê e grava os saves.
- **slot**: `auto`, `1`, `2`, `3` ou `infinito`.
- **save**: `data` é o JSON serializado do jogo (string, objeto JSON, até 2 MB); o corpo do PUT pode ter até 3 MB porque a string vai escapada. `summary` = `{ day, phase, mode, money, gender, difficulty }` (campos extras são ignorados).
- **ranking**: nomes e sementes são saneados (sem caracteres de controle/invisíveis, sem `<` `>`, espaços colapsados); `score` inteiro 0–1.000.000, `correct ≤ calls` e `score ≤ calls × 300`. Fica só o **melhor resultado por (modo, semente, nome)** — o nome é comparado sem diferenciar maiúsculas. Sem `seed` no GET = ranking geral (todas as sementes; o mesmo nome pode aparecer uma vez por semente). `limit` vai de 1 a 100. `mode` ∈ `infinito` (padrão), `campanha`, `simone`.
- **telemetria**: até 200 eventos e 64 KB por lote; cada evento até 4 KB; `name` em `snake_case` minúsculo; `data` precisa ser objeto; `t` é o horário do cliente em ms (se faltar, vale o do servidor). Eventos inválidos são descartados um a um (contados em `rejected`); o lote só é recusado (400) se o envelope for inválido. Aceita `Content-Type: text/plain` (o `navigator.sendBeacon` manda assim).
- **metrics**: `difficulty` filtra pelas campanhas daquela dificuldade; `since` (ms ou `AAAA-MM-DD`) ignora eventos mais antigos — útil para medir só depois de um ajuste de balanceamento. Resultado em cache até chegar telemetria nova.

## Telemetria e métricas de calibragem

Eventos que o cliente envia (guardados crus; outros nomes também são aceitos):

| Evento | Dados |
|---|---|
| `campaign_start` | `{ difficulty, gender, variable, first? }` |
| `day_end` | `{ day, warnings, notes, deaths, saves, handled, pay, desgaste, money }` |
| `ending` | `{ kind: 'ruim'\|'normal'\|'bom'\|'secreto', keys, money, lacos, integridade }` |
| `gameover` | `{ kind: 'exonerado'\|'despejo'\|'colapso'\|'sindicancia', day }` |
| `bico` | `{ day }` |
| `d9_choice` | `{ scenario: 'M'\|'G', davi, marcia }` |
| `rendezvous` | `{ day }` |
| `cida_d19` | `{ recognized }` |
| `call_time` | `{ seconds, day }` |
| `infinite_end` | `{ score, calls }` |

Como os eventos viram campanhas:

- **Jogador** = `profileId` (ou o perfil visto em outro evento da mesma sessão) ou, sem perfil, o `sessionId` — que o cliente guarda no navegador.
- Os eventos de cada jogador são ordenados por `t`; cada `campaign_start` abre uma campanha. A primeira é a **1ª campanha**, exceto se o cliente mandou `first: false` (o navegador já tinha jogado antes de a telemetria existir).
- Eventos antes de qualquer `campaign_start` formam uma campanha "órfã": contam nas médias por dia, game overs, tempo por ligação e taxas gerais, nunca nas métricas de 1ª campanha.
- Eventos idênticos (mesma sessão, nome, `t` e dados) contam uma vez só; quando um dia é rejogado, vale o último `day_end` dele.

| Métrica | Como é calculada | Meta |
|---|---|---|
| Chegam ao dia 20 na 1ª tentativa | 1ªs campanhas já decididas cujo primeiro desfecho foi chegar ao dia 20 (`day_end` do dia 20 ou `ending`) antes de qualquer `gameover`. Em andamento/abandonadas ficam de fora (e aparecem em nota). | 55–65% |
| Finais na 1ª campanha | Distribuição do `ending` das 1ªs campanhas que chegaram a um final (mesmo depois de recarregar um save). | ruim 30 · normal 50 · bom 15 · secreto 5 (±10 pts cada) |
| Bicos por campanha | Média de dias distintos com `bico` nas campanhas que chegaram ao fim. | 2–4 |
| USA para o Liam (cenário M) | Primeira `d9_choice` de cada campanha com `scenario: 'M'`; % com `davi: 'USA'`. | 35–50% (abaixo de 20%: dilema fraco) |
| Encontro das 14:20 | Campanhas que chegaram ao dia 9; % com `rendezvous` no dia 9. | 10–15% |
| AVC da Dona Cida | Campanhas com `cida_d19`; % com `recognized: true`. | ≈60% (50–70%; abaixo de 40%: reforçar sinais) |
| Tempo médio por ligação | Média de `call_time.seconds` (ignora ≤ 0 e > 3600 s); também mediana e p90. | 75–95 s |

Para as métricas que a meta não restringe à 1ª campanha, o relatório traz também o
valor só das 1ªs campanhas (`firstCampaign`). Amostras com menos de 10 casos ganham a
nota "amostra pequena". Também vêm: médias por dia (`day_end`), game overs por tipo
com dia médio, contagem das escolhas do dia 9, números do modo infinito e totais de
sessões/jogadores/campanhas/eventos.

O painel **`/admin`** mostra cada métrica contra a meta (✓ na meta / ✗ fora da meta /
— sem dados), a distribuição dos finais (real × meta), game overs, modo infinito, a
tabela por dia e o ranking; filtra por dificuldade, data e semente e atualiza a cada 30 s.

## Segurança e robustez

- **Corpo**: 64 KB por padrão; 3 MB no PUT de save (com `data` ≤ 2 MB). JSON ou UTF-8 inválido → 400.
- **Validação estrita** de ids, slots, sessionId, nomes e números; nenhum handler derruba o processo (erros viram JSON 4xx/500).
- **Limite de taxa** por IP (token bucket em memória), só na API: 60 req/10 s no geral; telemetria 12 lotes/10 s; envio de ranking 6/min; criação de perfil 10/min. Resposta 429 com `Retry-After`.
- **CORS** só para `http://localhost:5173` e `http://127.0.0.1:5173` (Vite) e o que estiver em `ALLOWED_ORIGINS`.
- **Escrita vinda de outro site** (CSRF): POST/PUT/DELETE com `Origin` de outra origem (que não a própria nem as liberadas) → 403.
- **Arquivos estáticos**: caminho decodificado, normalizado e conferido contra a pasta do cliente; `..`, barras invertidas, byte nulo e arquivos ocultos são recusados. `index.html` sem cache, assets com hash `immutable`, ETag/304, gzip e Range.
- **`/admin`**: Content-Security-Policy com nonce, sem frames; todo texto vindo da API entra como texto (sem HTML).
- **Host conferido** contra DNS rebinding (403 para nomes desconhecidos); **painel e métricas** só neste computador ou com `ADMIN_TOKEN`.
- **Cabeçalhos** em toda resposta: CSP na página do jogo, `X-Frame-Options`, `Referrer-Policy`, `Cross-Origin-*`, `Permissions-Policy`.
- **Conexões**: até 32 por endereço e 512 no total; cabeçalhos em até 15 s (contra slowloris).
- **LGPD**: `DELETE /api/profiles/:id` apaga perfil, saves, recordes e telemetria do jogador. **Fraude no ranking**: `DELETE /api/admin/ranking` `{ mode, seed, name }` (só pelo painel).
- Detalhes e testes: [docs/SEGURANCA.md](../docs/SEGURANCA.md).
- **Encerramento**: Ctrl+C/SIGTERM fecha conexões ociosas na hora, espera as requisições em andamento (até 2 s) e grava os dados.

## Cliente (`src/client/api.ts`)

```ts
import { api } from './api';

await api.available();                 // GET /api/health uma vez (cache); false sem servidor
const p = await api.createProfile('Dra. Ana');          // vira o perfil atual
await api.putSave(p.id, 'auto', jsonDoJogo, resumo);    // true/false
const saves = await api.listSaves(p.id);                // [] sem servidor
const save = await api.getSave(p.id, 'auto');           // null sem servidor
await api.submitScore({ name, score, calls, correct, seed, mode: 'infinito', version });
const top = await api.ranking('infinito', seed, 20);    // [] sem servidor
api.track('bico', { day: 7 });          // só enfileira; nunca lança
```

- Nenhuma função lança: sem servidor devolvem `null`, `[]` ou `false`.
- No build standalone (`__STANDALONE__ = true`) ou em `file://` a API fica desligada e não toca a rede.
- `track()` envia em lotes: a cada 10 s, ao juntar 50 eventos e ao esconder/fechar a aba (`navigator.sendBeacon`, com `fetch keepalive` de reserva). Lotes respeitam 200 eventos/60 KB; eventos acima de 4 KB viram `{ _truncado: true }`.
- `api.sessionId` é um id anônimo guardado no `localStorage` (identifica o jogador nas métricas de "1ª campanha").
- `api.profileId` é o perfil atual: o último criado ou usado em uma chamada de save; também pode ser definido com `api.setProfile(id)`. `api.ensureProfile(nome)` reaproveita o perfil atual se ele ainda existir no servidor.
- Extras: `api.getProfile(id)`, `api.flush()` (envia a fila agora) e `api.enabled`.

## Testes

```sh
npx vitest run tests/server.test.ts
```

Cobrem os dois backends (o SQLite só quando o Node tem `node:sqlite`), todas as rotas,
validações, limites de corpo e de taxa, CORS/CSRF, arquivos estáticos (incluindo
tentativas de directory traversal), persistência, cálculo das métricas, encerramento,
o bundle rodando com `node` puro e o cliente `api.ts` (com e sem servidor, e no modo
standalone).

## Arquivos

```
server/
  server.ts      entrada: opções, banner, --open, encerramento
  app.ts         createServer(): rotas, CORS, limites, erros
  static.ts      arquivos estáticos e página "cliente não compilado"
  admin.ts       painel /admin (HTML/CSS/JS embutidos)
  metrics.ts     métricas de calibragem e metas
  validate.ts    validação e saneamento
  ratelimit.ts   token bucket
  http.ts        leitura de corpo e respostas
  config.ts      limites e formatos
  paths.ts       onde ficam cliente e dados
  version.ts     versão (do package.json)
  store/         Store, JsonStore, SqliteStore e openStore()
scripts/dev.mjs  modo desenvolvimento
src/client/api.ts  cliente da API para o navegador
```
