# Segurança — auditoria antes da Steam

Auditoria da versão 1.0.1, feita em 16/10/2026 seguindo o "Checklist de segurança para lançar um jogo na Steam" (15 seções). Cada item foi testado no próprio jogo, corrigido e testado de novo com o mesmo procedimento. As correções entraram na **1.0.2**. Depois, uma revisão independente refez os testes e achou pontos que a 1.0.2 tinha deixado passar ou que este relatório exagerava; eles foram corrigidos na **1.0.3** (seção "Revisão independente", no fim).

**Resumo:** 23 problemas encontrados e corrigidos na 1.0.2, mais 9 ajustes da revisão na 1.0.3. Os mais graves estavam no programa de desktop: o executável podia virar um interpretador que roda qualquer script, e a versão final abria com depuração remota. Não havia nenhum segredo (chave, senha, token) no código nem nos pacotes. Dois riscos foram aceitos e estão explicados abaixo. Os itens que dependem da conta Steamworks e de certificados estão na lista **O que depende de você**.

## O que o jogo tem (superfície de ataque)

| Parte | O que é | Onde roda |
|---|---|---|
| Programa de desktop | Electron 44.8.0 com o jogo de arquivo único | computador do jogador (é o que vai para a Steam) |
| `JOGAR.html` / Artifact | o mesmo jogo, aberto no navegador | navegador |
| Servidor local | ranking, saves, telemetria e painel `/admin` para playtests | máquina da equipe (127.0.0.1 ou rede local) |
| Saves | JSON em arquivos (desktop) ou `localStorage` (navegador) | computador do jogador |

O jogo é para um jogador só, não tem multiplayer, loja, itens pagos nem mods. Por isso as seções 5, 6, 7 (rede de jogo), 8 e 10 não se aplicam hoje. O servidor local é a única parte com rede, e ele foi testado como um backend (seções 7, 9, 11, 12 e 13).

## Resultado por seção do checklist

| # | Seção | Situação |
|---|---|---|
| 1 | Segredos e conteúdo indevido no build | ✓ sem segredos; ferramentas de teste removidas da versão final (achados 2, 3) |
| 2 | Conta Steamworks e pipeline | depende de você (lista no fim); lockfile e SBOM prontos |
| 3 | Engine e dependências | ✓ Electron 44.8.0; ferramentas de build atualizadas (achado 12); 1 risco aceito |
| 4 | Segurança local do cliente | ✓ achados 1 a 11; DLL no Windows: risco aceito |
| 5 | Autenticação Steam | não se aplica (sem backend online); ver "Antes de pôr algo online" |
| 6 | Cliente-servidor e cheats | não se aplica (singleplayer); editar o próprio save é aceito |
| 7 | Rede | servidor local: ✓ achados 22 e 23 |
| 8 | Economia e microtransações | não se aplica |
| 9 | Stats, conquistas e leaderboards | ✓ ranking local com remoção de fraude (achado 20); conquistas da Steam: configurar quando integrar |
| 10 | Mods e Workshop | não se aplica |
| 11 | Nomes e textos | ✓ achado 18 |
| 12 | Backend e banco | ✓ achados 15 a 23; SQL só com consultas parametrizadas (conferido) |
| 13 | Privacidade (LGPD) | ✓ achados 11, 19 e 21 |
| 14 | Lógica do jogo | ✓ achados 7, 8, 9 e 10; saves atômicos |
| 15 | Operação pós-lançamento | ✓ interruptores (achado 21); falta o canal de contato (lista no fim) |

## Achados e correções

Severidade: **alta** (código de fora roda no computador do jogador), **média** (dá controle ou expõe dados sem precisar de acesso ao computador), **baixa** (incômodo, travamento ou boa prática).

### Programa de desktop

| # | Sev. | Problema (como foi comprovado na 1.0.1) | Correção na 1.0.2 | Reteste |
|---|---|---|---|---|
| 1 | alta | Os "fuses" do Electron estavam no padrão. Com `ELECTRON_RUN_AS_NODE=1` o executável do jogo rodou um script qualquer. Com `NODE_OPTIONS=--require arquivo.js`, carregou código de fora. `--inspect` abria o depurador do Node. Uma pasta `resources/app` ao lado era carregada no lugar do jogo. | `build.mjs` grava os fuses em todo pacote e confere: não roda como Node, ignora `NODE_OPTIONS` e `--inspect`, só carrega o `app.asar` e confere o hash dele (Mac e Windows). | os 4 truques no binário novo: nenhum rodou |
| 2 | média | A versão final tinha as ferramentas de teste: F12 (DevTools) com `--debug`, `?speed`, `?dia`, `?simone` e `window.__store`, que dá controle total do jogo pelo console. | Compilação condicional: `__QAP_DEV__` falso na versão final (o código nem entra no arquivo) e os blocos `@teste-` do `main.cjs` são apagados. O build para com erro se sobrar `window.__store`, `?speed`, `?dia` ou `?simone`. A versão final sai em `desktop/release-final/`, separada dos pacotes de teste. | `app.asar` da versão final das 4 plataformas (1.0.3): 0 ocorrências |
| 3 | média | Argumentos do Chromium como `--remote-debugging-port`, `--remote-debugging-pipe`, `--js-flags`, `--disable-web-security` e `--proxy-server` eram aceitos (a depuração remota dá controle total da página). | A versão final não abre com eles (sai com código 2 e registra em `erros.log`). Só conta o que vem na linha de comando de quem abriu o jogo. | 8 variantes (inclusive `-nome` e maiúsculas): todas recusadas; sem argumentos o jogo abre |
| 4 | média | A página não tinha Content-Security-Policy: um HTML injetado (por exemplo num nome) poderia rodar script. | CSP no próprio HTML: só roda o script do jogo (pelo hash SHA-256), sem `eval`, sem rede, sem frames nem formulários. No programa ela também vai como cabeçalho. | script injetado, `eval`, `new Function`, `fetch` e `window.open`: todos bloqueados |
| 5 | média | A página abria por `file://` com os privilégios extras do Electron (podia ler outros arquivos locais). | A página é servida por um protocolo próprio (`qap://jogo/index.html`) que só entrega o `index.html` de dentro do pacote. O fuse de privilégios do `file://` fica desligado e pedidos `file://` são bloqueados. | navegação para fora, rede e arquivos locais: bloqueados |
| 6 | média | A ponte com o processo principal atendia qualquer quadro e qualquer chave, de qualquer tamanho. | Só atende a página do jogo no quadro principal. Grava só chaves `qap.*` (as antigas `192plantao.*` só são lidas e apagadas na migração), até 8 MB medidos em bytes, com gravação atômica. | chave com `../`, chave fora de `qap.*`, chave antiga, 9 MB e 10 MB em bytes (5 milhões de "é"): recusados; nada gravado fora da pasta |
| 7 | média | Saves sem conferência: 500 saves corrompidos ou editados geraram 41 falhas diferentes (estouro de pilha com aninhamento, `TypeError` no meio do plantão, `Infinity`, `__proto__`). | `src/engine/save-check.ts`: JSON puro conferido (forma, tipos, faixas, tamanho, profundidade) antes de carregar. Um save ruim vira mensagem, não trava. | 3 × 600 mutantes: 0 falhas; os 658 saves da 1.0.0 continuam abrindo |
| 8 | baixa | Uma tela que quebrasse deixava o jogo congelado. | Proteção por tela (volta ao título com aviso) e o relógio do jogo não para por um erro. | conferido no código |
| 9 | baixa | Opções, conquistas ou progresso corrompidos travavam o título. | Leitura campo a campo, com o padrão no lugar do que não serve. | testes em `seguranca-saves.test.ts` |
| 10 | baixa | Clique duplo pagava as contas duas vezes; dormir antes de escolher a folga pulava etapas. | Cada passo da noite só vale uma vez e na ordem. | testes de clique repetido |
| 11 | baixa | O `erros.log` trazia caminhos com o nome de usuário do computador e crescia sem limite. | Pasta pessoal vira `~`; o registro troca de arquivo a cada 1 MB. | conferido no código |
| 12 | baixa | Ferramentas de build com falhas conhecidas (2 críticas, 4 altas, 3 moderadas, todas fora do jogo: vitest, vite, esbuild, tinypool). | vite 6.4.4, vitest 4.1.12, esbuild 0.25.12, vite-plugin-singlefile 2.3.3, Electron 44.8.0 (o mais novo em 16/10). | `npm audit`: sobra 1 alerta (braces), que aparece como "3 high" por passar por micromatch e vite-plugin-singlefile; risco aceito abaixo. `npm audit --omit=dev`: 0 |
| 13 | baixa | O app do Mac pedia câmera, microfone e Bluetooth e liberava conexões sem HTTPS (padrão do Electron). | Essas permissões saem do `Info.plist`. Na sessão, toda permissão do navegador é negada (só a tela cheia passa). | microfone pedido pela página: negado |
| 14 | baixa | Erro encontrado durante os testes: o close do paciente com eletrodos quebrava em alguns quadros da respiração (a cena congelava). | Índice de cor inteiro; teste que desenha todos os casos da Intervenção ao longo de 6 s, com todo o equipamento. | o teste falha na 1.0.1 e passa na 1.0.2 |

### Servidor local (ranking, saves, telemetria, painel)

Teste de ataque (`attack.mjs`, 50 verificações): **33/50 na 1.0.1 → 50/50 na 1.0.2**.

| # | Sev. | Problema | Correção |
|---|---|---|---|
| 15 | média | DNS rebinding: um site aberto no navegador do jogador podia ler o ranking, as métricas e o painel e enviar dados, apontando o próprio domínio para 127.0.0.1. | O cabeçalho `Host` é conferido: só IPs, `localhost` e o nome da máquina; outros nomes só com `ALLOWED_HOSTS`. |
| 16 | média | Com `HOST=0.0.0.0`, qualquer um na rede via o painel `/admin` e as métricas. | Painel e métricas só neste computador; pela rede, só com `ADMIN_TOKEN` (comparação em tempo constante, cookie `HttpOnly` e `SameSite=Strict`). |
| 17 | baixa | Faltavam cabeçalhos de segurança e CSP na página servida. | CSP, `X-Frame-Options`, `Referrer-Policy`, `Cross-Origin-*` e `Permissions-Policy` em toda resposta. |
| 18 | baixa | Nomes com Unicode enganoso passavam: "zalgo", letras de largura dupla, caracteres invisíveis (hangul vazio, braille em branco). | NFKC, no máximo 2 acentos por letra (contados com o texto decomposto), marcas que não desenham nada sozinhas (seletores de variação, U+034F, acentos sem letra) removidas, e um nome sem nada visível é recusado (já havia controle, `<` `>` e tamanho máximo). Os "joiners" de largura zero continuam removidos: isso quebra emojis compostos e alguns nomes persas e indianos, aceito num ranking de playtest. |
| 19 | média | O registro de requisições (`LOG_REQUESTS=1`) gravava o id do perfil, que funciona como senha dos saves. | O registro troca o id por `<perfil>` (também com barras invertidas, `/api\saves\…`) e oculta tokens. |
| 20 | baixa | Não havia como tirar uma pontuação falsa do ranking. | `DELETE /api/admin/ranking` (só pelo painel). |
| 21 | baixa | Não havia exclusão de dados (LGPD) nem como desligar uma parte com problema. | `DELETE /api/profiles/:id` apaga perfil, saves, recordes e telemetria do jogador. `DISABLE_SAVES`, `DISABLE_RANKING` e `DISABLE_TELEMETRY` desligam essa parte da API inteira (leitura e escrita) sem atualizar o servidor. |
| 22 | média | Um só endereço podia ocupar todas as conexões (700 abertas: nenhuma recusada). | No máximo 32 conexões por endereço e 512 no total; outros jogadores continuam atendidos durante o ataque. |
| 23 | média | Conexões lentas (slowloris) ficavam abertas. | Cabeçalhos em até 15 s; a conexão lenta recebe 408 e é fechada em 16 s. |

Também conferido e já correto na 1.0.1: travessia de diretório nos arquivos estáticos, injeção SQL (consultas parametrizadas), CSRF por `Origin`, corpos gigantes ou malformados, `NaN`/`Infinity`, limites de taxa, corrida de envios paralelos (40 envios do mesmo save ou do mesmo nome gravam um só).

### Revisão independente (1.0.3)

Uma segunda verificação, feita sem ver o trabalho, refez os testes nos pacotes prontos. Confirmou os achados de alta e média severidade e encontrou:

| Ponto | Correção na 1.0.3 |
|---|---|
| Só a versão final de Linux tinha sido gerada e conferida | As 4 versões finais geradas em `desktop/release-final/` e conferidas: `qapTestBuild: false`, 0 código de teste, fuses certos |
| A versão final e a de teste usavam os mesmos nomes de arquivo | Pastas separadas (`release-final/`, `out-final/`) |
| O build só barrava `__store` e `?speed` | Barra também `?dia` e `?simone` |
| Nomes só com marcas invisíveis passavam; teto de acentos contava errado | Achado 18 acima |
| Registro mostrava o id com barras invertidas | Achado 19 acima |
| A ponte gravava chaves antigas `192plantao.*` e media o tamanho em caracteres | Achado 6 acima |
| `DISABLE_RANKING` não desligava a leitura do ranking | Achado 21 acima |
| Chaves do Chromium que abrem outro programa (`--renderer-cmd-prefix`, `--gpu-launcher`…) não estavam na lista | Entraram na lista; a versão final recusa (testado) |
| O script do Linux reabria sem sandbox quando o jogo recusava um argumento | Saída 2 (recusa do jogo) não reabre mais |
| `/admin?token=` não tinha limite de tentativas | 10 tentativas por minuto, depois 429 (testado) |
| Host com porta acima de 65535 era aceito | Recusado |

Ficaram como estão (baixo risco, explicados): o limite de conexões é por endereço exato, então na rede local por IPv6 um mesmo computador pode trocar de endereço; e os números "antes" (33/50, 41 falhas, 658 saves) vêm dos testes da 1.0.1 e não se refazem a partir do código atual.

## Riscos aceitos

- **`braces` (ferramenta de build):** falha de lentidão com padrões aninhados. Não existe versão corrigida. Só roda na compilação, com padrões fixos do projeto, e não vai para o jogo.
- **DLL no Windows:** o `.exe` do Electron carrega `VERSION.dll`, `WINMM.dll` e `DWrite.dll` procurando primeiro na pasta do jogo (`DependentLoadFlags = 0`). Quem conseguir pôr uma DLL na pasta do jogo já consegue trocar o próprio `.exe`, então isso não dá acesso que a pessoa não tinha. O `.exe` tem ASLR, DEP e CFG ligados. Não alterei o binário porque o Windows ainda não foi testado num computador de verdade. Teste sugerido: Process Monitor, filtro "NAME NOT FOUND" em `.dll`, abrindo o jogo instalado pela Steam.
- **Linux sem sandbox em alguns sistemas:** o script de abertura usa o sandbox do Chromium quando o sistema permite e, se não, abre sem ele (root, contêiner, Steam Runtime, Ubuntu 24.04+). O jogo é todo local, não acessa a rede e só mostra a própria página.
- **Editar o próprio save** continua possível (jogo para um jogador). O que não passa é o que o jogo não saberia usar.

## O que depende de você

São configurações de conta, compras e processos que não estão no código.

1. **Steamworks:** ativar Steam Guard Mobile e 2FA em todas as contas. Dar a permissão de publicar só a quem publica. Criar uma conta separada para o upload de builds, com permissões mínimas.
2. **Branches beta:** com senha forte, e nunca apontando para um build de teste (o padrão do `npm run build:desktop`). Para a Steam, use `npm run build:desktop -- --release`.
3. **Assinatura de código:** certificado Authenticode para o `.exe` e Developer ID com notarização da Apple. A assinatura "ad hoc" de hoje só serve para testes.
4. **Antivírus:** enviar o `.exe` e o app do Mac da versão final ao VirusTotal antes de cada publicação (detecta contaminação e antecipa falsos positivos). Não enviei daqui porque são os seus binários.
5. **Keys:** entregar só a contatos verificados pelos canais oficiais de quem pede (golpistas se passam por imprensa e influenciadores).
6. **Canal de segurança:** definir um e-mail para relatos de vulnerabilidade e publicar no site (`/.well-known/security.txt`) e na página da Steam.
7. **Plano de incidente:** quem decide, como avisar os jogadores e quando tirar um build do ar.

## Antes de pôr algo online

Se o jogo ganhar ranking online, nuvem própria ou conquistas pela Steam:

- A identidade vem do ticket da Steam (`GetAuthTicketForWebApi`), validado no servidor com a publisher key. A key nunca vai para o cliente.
- Pontuação só aceita do servidor ou com plausibilidade conferida (a semente do Plantão Infinito permite refazer a partida). Leaderboard da Steam como "trusted".
- Conquistas e stats que importam com permissão "GameServer"; stats com "Increment Only" e "Max Change".
- Política de privacidade na página da Steam se houver telemetria. Hoje o programa de desktop não manda nada pela rede.

## Como repetir os testes

```bash
npm test                                   # 133 testes, incluindo:
npx vitest run tests/seguranca-saves.test.ts   # saves: ida e volta, recusas, fuzzing, lógica
npx vitest run tests/server-seguranca.test.ts  # servidor: rebinding, painel, Unicode, LGPD, interruptores
npm audit --omit=dev                       # dependências do jogo: deve dar 0
npm run build:desktop -- --release         # versão final em desktop/release-final/; para com erro se sobrar código de teste ou faltar a CSP
```

Os fuses de um pacote podem ser lidos com `npx electron-fuses read --app <executável ou .app>`. Cada build gera `SBOM-QAP-<versão>.cdx.json` junto dos pacotes (CycloneDX), a lista de componentes para auditoria.

**Para a próxima auditoria:** rode o checklist inteiro de novo a cada versão grande, sempre no build final, e anote cada achado (como reproduzir, impacto, correção, reteste).
