# Programa de desktop (Windows, Mac e Linux)

O jogo roda como programa próprio, em tela cheia, com saves em arquivos. É a forma que vai para a Steam. Por dentro, é o mesmo jogo do `JOGAR.html` (o build de arquivo único) dentro do [Electron](https://www.electronjs.org) 44.8.0. Segurança do programa: ver [SEGURANCA.md](SEGURANCA.md).

## O que a equipe recebe

Em `executaveis/` (gerado em `desktop/release/`):

| Arquivo | Para |
|---|---|
| `QAP-Emergency-Dispatch-Windows.zip` | Windows 10 e 11 (64 bits) |
| `QAP-Emergency-Dispatch-Mac-AppleSilicon.zip` | Mac com chip Apple (M1, M2, M3, M4…), macOS 13 ou mais novo |
| `QAP-Emergency-Dispatch-Mac-Intel.zip` | Mac com processador Intel, macOS 13 ou mais novo |
| `QAP-Emergency-Dispatch-Linux.tar.gz` | Linux x64 |
| `LEIA-ME.txt` | qual arquivo usar |

Cada pacote tem uma pasta pronta e um `LEIA-ME.txt` com o passo a passo da primeira abertura.

**Versão de teste da equipe** (o padrão do `build:desktop`): a Campanha da Simone já vem aberta, para ninguém precisar jogar os 20 plantões até ela destrancar, e o rodapé do título diz "versão de teste". Com `--release`, sai a versão final: a Campanha da Simone volta a abrir só depois do primeiro final.

**Versão de teste, sem assinatura digital.** Na primeira vez:

- **Windows:** "O Windows protegeu o computador" → *Mais informações* → *Executar assim mesmo*.
- **Mac:** o app é assinado "ad hoc" (sem conta de desenvolvedor da Apple). Na primeira vez o Mac avisa que não consegue verificar o app: no macOS 15 ou mais novo, *Ajustes do Sistema → Privacidade e Segurança → Abrir Mesmo Assim*; no 14 ou anterior, botão direito no app → *Abrir*. Se aparecer "está danificado", no Terminal: `xattr -cr ` e arrastar o app para a janela.
- **Linux:** `qap-emergency-dispatch` é um script que abre o binário com `--no-sandbox` (muitas distribuições bloqueiam o sandbox do Chromium para usuários comuns, e essa verificação acontece antes de o código do jogo rodar). O jogo só abre a própria página: a navegação para fora é bloqueada.

## O que muda em relação ao navegador

| | Navegador (`JOGAR.html`) | Programa |
|---|---|---|
| Saves, opções, conquistas | `localStorage` do navegador | arquivos `.json` na pasta do usuário |
| Tela cheia | F11 do navegador | abre em tela cheia; F11 ou Alt+Enter alterna (no Mac também Ctrl+Cmd+F); opção em Opções, lembrada entre sessões |
| Sair | fechar a aba | botão **Sair** no menu principal |
| Trocar de janela (Alt+Tab, Cmd+Tab) | o relógio continua | o plantão e a ambulância pausam |
| Erros | console do navegador | `erros.log` na pasta dos saves |
| Ranking | servidor local (`start.command`) | só o recorde deste computador, por enquanto |

### Onde ficam os saves

| Sistema | Pasta |
|---|---|
| Windows | `%APPDATA%\QAP - Emergency Dispatch\saves` |
| Mac | `~/Library/Application Support/QAP - Emergency Dispatch/saves` |
| Linux | `~/.config/QAP - Emergency Dispatch/saves` |

Em Opções há o caminho e um botão que abre a pasta. Cada chave do jogo vira um arquivo: `qap.settings.json` (opções), `qap.meta.json` (finais vistos, recordes), `qap.achievements.json`, `qap.save.<espaço>.json` e `qap.save.meta.<espaço>.json` (o resumo que a tela Carregar mostra). A gravação é atômica (arquivo temporário e troca), então um save não fica pela metade se o programa fechar no meio. Cópias de saves apagados ou substituídos ficam em `qap.lixeira.*.json` por 30 dias (em Carregar → "Saves guardados"), e cada arquivo que sai da pasta fica anotado no `erros.log` ("[saves] apagado: …"). Copiar a pasta para outro computador leva o progresso junto. Essas pastas são as que o Steam Auto-Cloud consegue sincronizar mais tarde.

## Como funciona por dentro

```
desktop/
├── main.cjs        processo principal: janela, tela cheia, saves em arquivo, erros.log, menu do Mac
├── preload.cjs     ponte segura: expõe window.qapNative para a página
├── build.mjs       empacota as quatro plataformas e gera os .zip
├── LEIA-ME.txt     modelo do LEIA-ME de cada pacote
└── icons/          ícone em pixel art (make-icons.py gera .png, .ico e .icns)
```

A página é servida por um protocolo próprio, `qap://jogo/index.html`, que só entrega o `index.html` de dentro do `app.asar` (nada de `file://`). Os fuses do Electron são gravados em todo pacote: o binário não roda como Node (`ELECTRON_RUN_AS_NODE`), ignora `NODE_OPTIONS` e `--inspect`, só carrega o `app.asar` e confere o hash dele. A versão final (`--release`) é recompilada sem as facilidades de teste e não abre com argumentos de depuração (`--remote-debugging-port` e afins).

O jogo fala com o programa só por `window.qapNative` (tipos em `src/client/native.ts`). No navegador ela não existe, e `native.ts` cai no `localStorage`, então o mesmo código serve aos dois. A página roda isolada (`contextIsolation`, `sandbox`, sem Node), e as chamadas de armazenamento são síncronas, como o `localStorage` que substituem.

## Gerar de novo

Precisa de Node 22.12 ou mais novo, `zip` e `tar`, e internet na primeira vez (o Electron de cada plataforma é baixado e fica em cache).

```bash
npm install
npm run build:desktop                          # as quatro plataformas
npm run build:desktop -- mac-arm win           # só algumas: linux, win, mac-arm, mac-intel
npm run build:desktop -- --release             # versão final (Campanha da Simone trancada até o primeiro final)
```

Os pacotes saem em `desktop/release/` (versão final, com `--release`: `desktop/release-final/`). Para o Mac, o `build.mjs` assina o app "ad hoc" com o [rcodesign](https://github.com/indygreg/apple-platform-rs) (no `PATH` ou na variável `RCODESIGN`). Sem ele, o app do Mac sai sem assinatura e o Mac com chip Apple não o abre; nesse caso, num Mac: `codesign --force --deep --sign - "QAP - Emergency Dispatch.app"`.

## Testado

- **1.0.2, Linux** (Xvfb): como os fuses desligam o `--inspect` que o `_electron` do Playwright usa, a versão de teste é testada pela depuração remota do Chromium (`--remote-debugging-port`, que a versão final recusa). Conferidos a ponte, os saves em arquivo, a CSP e os bloqueios (ver SEGURANCA.md); a versão final abre normalmente e recusa os argumentos de depuração.
- **Linux** (1.0.1, Xvfb, Playwright): a ponte existe; saves, opções e meta viram arquivos; o jogo abre em tela cheia; desligar em Opções vale na hora e na próxima abertura; F11 e Alt+Enter alternam e a opção é gravada; fechar a janela faz o salvamento automático; Carregar mostra os saves na abertura seguinte; o botão Sair fecha o programa; perder o foco pausa o plantão; nenhum erro no console; `erros.log` não é criado sem erro.
- **Mac com chip Apple**: aberto sem problemas num MacBook Air (15/10/2026), a partir do `.zip` copiado para a pasta do projeto.
- **Windows e Mac Intel**: conferidos na estrutura (nome e ícone do `.exe`, informações de versão; `Info.plist`, ícone, assinatura ad hoc em todos os binários e bundles internos, links simbólicos preservados no `.zip`). Ainda não foram abertos: a primeira abertura num Windows e num Mac Intel é o primeiro teste da equipe.

## Antes da Steam

- Integração Steamworks (conquistas, nuvem, ranking) com `steamworks.js` ou equivalente.
- Assinatura de verdade: certificado de assinatura de código no Windows; Developer ID e notarização da Apple no Mac.
- Publicar na Steam só o build `--release` (a lista completa está em SEGURANCA.md, "O que depende de você").
- Identificador do app no Mac: hoje `br.qap.emergencydispatch`, provisório até definir a conta da Apple.
