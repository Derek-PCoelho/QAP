// =============================================================================
// QAP — Emergency Dispatch: processo principal do executável de desktop (Electron).
//
// Abre o jogo (a versão de arquivo único, a mesma do JOGAR.html) numa janela própria,
// com tela cheia, saves em arquivos na pasta do usuário e um registro de erros.
//
//   Saves e opções: <pasta do usuário>/saves/*.json
//     Windows: %APPDATA%\QAP - Emergency Dispatch\saves
//     Mac:     ~/Library/Application Support/QAP - Emergency Dispatch/saves
//     Linux:   ~/.config/QAP - Emergency Dispatch/saves
//   Registro de erros: erros.log, na mesma pasta.
//
// A página fala com este processo só pelo preload (preload.cjs → window.qapNative), e só a
// página do jogo é atendida. Segurança (ver docs/SEGURANCA.md): o jogo não acessa a rede,
// não abre outras páginas nem janelas, não concede permissões do navegador e, na versão
// final, não aceita argumentos de depuração. Os blocos marcados como só da versão de teste
// (entre os marcadores "@teste-" de início e fim) o build.mjs apaga na versão final.
// =============================================================================
'use strict';
const { app, BrowserWindow, ipcMain, Menu, protocol, session, shell } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const PRODUCT = 'QAP - Emergency Dispatch';
const TITLE = 'QAP — Emergency Dispatch';
app.setName(PRODUCT);
// pasta do usuário fixa pelo nome do produto (os saves não mudam de lugar entre versões)
app.setPath('userData', path.join(app.getPath('appData'), PRODUCT));

// a música do título toca sem esperar o primeiro clique
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

// versão de teste da equipe (o build.mjs grava; --release desliga): a Campanha da Simone já vem aberta
const TEST_BUILD = !!require('./package.json').qapTestBuild;
let DEBUG = false;
// @teste-inicio
// Só na versão de teste: --debug (ou QAP_DEBUG=1) libera as ferramentas de desenvolvedor (F12).
DEBUG = process.argv.includes('--debug') || process.env.QAP_DEBUG === '1';
// @teste-fim

// ------------------------------------------------------------------ pastas e registro
const savesDir = () => path.join(app.getPath('userData'), 'saves');
const logFile = () => path.join(savesDir(), 'erros.log');

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** caminhos com a pasta pessoal do jogador (que trazem o nome de usuário) viram "~" no registro */
const HOME_RES = (() => {
  const home = os.homedir();
  if (!home || home.length < 4) return [];
  const slash = home.replace(/\\/g, '/');
  const forms = new Set([home, slash, encodeURI(slash), slash.replace(/ /g, '%20')]);
  return [...forms].map((f) => new RegExp(escapeRe(f), process.platform === 'linux' ? 'g' : 'gi'));
})();
function scrub(text) {
  let out = text;
  for (const re of HOME_RES) out = out.replace(re, '~');
  return out;
}

function log(...parts) {
  try {
    fs.mkdirSync(savesDir(), { recursive: true });
    const f = logFile();
    try {
      if (fs.statSync(f).size > 1_000_000) fs.renameSync(f, f + '.anterior');
    } catch {
      /* ainda não existe */
    }
    const text = parts.map((p) => (p instanceof Error ? p.stack || p.message : typeof p === 'string' ? p : JSON.stringify(p))).join(' ');
    fs.appendFileSync(f, `[${new Date().toISOString()}] ${scrub(text).slice(0, 4000)}\n`);
  } catch {
    /* sem disco: segue sem registro */
  }
}
process.on('uncaughtException', (err) => log('[principal]', err));

// ------------------------------------------------------------------ argumentos de linha de comando
// Argumentos que abririam o jogo para depuração ou carregariam código de fora. A versão final
// não abre com eles (a de teste aceita, porque os testes automáticos usam a depuração remota).
// --inspect e as variáveis NODE_OPTIONS e ELECTRON_RUN_AS_NODE já são desligadas pelos fuses
// do Electron (build.mjs); a lista repete as do Node por garantia.
const BLOCKED_SWITCHES = [
  'remote-debugging-port',
  'remote-debugging-pipe',
  'remote-debugging-address',
  'remote-allow-origins',
  'inspect',
  'inspect-brk',
  'inspect-port',
  'js-flags',
  'disable-web-security',
  'allow-file-access-from-files',
  'disable-site-isolation-trials',
  'host-rules',
  'host-resolver-rules',
  'proxy-server',
  'proxy-pac-url',
  'ignore-certificate-errors',
  // chaves que mandam o Chromium abrir outro programa junto com os processos dele
  'renderer-cmd-prefix',
  'utility-cmd-prefix',
  'gpu-launcher',
  'gpu-cmd-prefix',
  'plugin-launcher',
  'ppapi-plugin-launcher',
  'browser-subprocess-path',
  'load-extension',
];
/**
 * Só os argumentos de quem abriu o jogo (process.argv): o app.commandLine também tem as chaves que
 * o próprio Electron liga por dentro (ex.: allow-file-access-from-files), que não são do jogador.
 * O Chromium aceita "--nome", "-nome" e, no Windows, "/nome"; tudo depois de "--" não é chave.
 */
function userSwitches(argv) {
  const out = [];
  for (const a of argv.slice(1)) {
    if (a === '--') break;
    const m = /^(?:--?|\/)([A-Za-z0-9][A-Za-z0-9-]*)(?:=|$)/.exec(String(a));
    if (m && !(process.platform !== 'win32' && a.startsWith('/'))) out.push(m[1].toLowerCase());
  }
  return out;
}
const blockedSwitch = (s) => BLOCKED_SWITCHES.includes(s) || /^(remote-debugging|remote-allow|inspect)/.test(s);
if (!TEST_BUILD) {
  const bad = [...new Set(userSwitches(process.argv).filter(blockedSwitch))];
  if (bad.length) {
    log('[segurança] o jogo não abre com estes argumentos:', bad.map((s) => '--' + s).join(' '));
    app.exit(2);
  }
}

// ------------------------------------------------------------------ armazenamento em arquivos
// Uma chave do jogo vira um arquivo .json. Letras, números, ponto, hífen e sublinhado ficam
// como estão; o resto vira %XX, para o nome valer em qualquer sistema.
function keyToFile(key) {
  let out = '';
  for (const b of Buffer.from(String(key), 'utf8')) {
    const c = String.fromCharCode(b);
    out += /[A-Za-z0-9._-]/.test(c) ? c : '%' + b.toString(16).toUpperCase().padStart(2, '0');
  }
  return out + '.json';
}
function fileToKey(name) {
  if (!name.endsWith('.json')) return null;
  try {
    return decodeURIComponent(name.slice(0, -5));
  } catch {
    return null;
  }
}

/** só as chaves que o jogo usa: "qap.*" (e as antigas "192plantao.*", lidas uma vez na migração) */
const KEY_RE = /^(?:qap|192plantao)\.[A-Za-z0-9._-]{1,120}$/;
/** um save tem ~100 KB; 8 MB é folga de sobra e impede arquivos gigantes de travar o jogo */
const MAX_VALUE = 8 * 1024 * 1024;
const validKey = (key) => typeof key === 'string' && KEY_RE.test(key);
/** gravar, só nas chaves atuais "qap.*" (as antigas "192plantao.*" só são lidas e apagadas na migração) */
const writableKey = (key) => validKey(key) && key.startsWith('qap.');

const store = {
  get(key) {
    if (!validKey(key)) return null;
    const file = path.join(savesDir(), keyToFile(key));
    try {
      if (fs.statSync(file).size > MAX_VALUE) {
        log('[saves] arquivo grande demais, ignorado:', path.basename(file));
        return null;
      }
      return fs.readFileSync(file, 'utf8');
    } catch (err) {
      if (err && err.code !== 'ENOENT') log('[saves] leitura', key, err);
      return null;
    }
  },
  set(key, value) {
    if (!writableKey(key)) throw new Error('chave inválida');
    // o limite vale em bytes no disco (o mesmo que a leitura confere), não em caracteres
    if (typeof value !== 'string' || Buffer.byteLength(value, 'utf8') > MAX_VALUE) throw new Error('valor inválido ou grande demais');
    const dir = savesDir();
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, keyToFile(key));
    const tmp = file + '.tmp';
    // grava num arquivo temporário e troca: um save nunca fica pela metade
    fs.writeFileSync(tmp, value, 'utf8');
    try {
      fs.renameSync(tmp, file);
    } catch {
      // Windows: antivírus ou indexador segurando o arquivo → grava direto
      fs.writeFileSync(file, value, 'utf8');
      try {
        fs.rmSync(tmp, { force: true });
      } catch {
        /* nada */
      }
    }
  },
  remove(key) {
    if (!validKey(key)) return;
    const file = path.join(savesDir(), keyToFile(key));
    // registra o que some da pasta dos saves (ajuda a entender um save que "sumiu")
    if (fs.existsSync(file)) log('[saves] apagado:', key);
    fs.rmSync(file, { force: true });
  },
  keys() {
    try {
      return fs
        .readdirSync(savesDir())
        .map(fileToKey)
        .filter((k) => k !== null && validKey(k));
    } catch {
      return [];
    }
  },
};

// ------------------------------------------------------------------ página do jogo
// A página é servida por um protocolo próprio (qap://jogo/index.html), e não por file://: assim
// o fuse GrantFileProtocolExtraPrivileges fica desligado (file:// sem privilégios extras) e a
// página não consegue ler nenhum outro arquivo do computador. O protocolo só entrega o
// index.html de dentro do app.asar; qualquer outro endereço responde 404.
const INDEX = path.join(__dirname, 'index.html');
const SCHEME = 'qap';
const GAME_HOST = 'jogo';
const GAME_URL = `${SCHEME}://${GAME_HOST}/index.html`;
protocol.registerSchemesAsPrivileged([{ scheme: SCHEME, privileges: { standard: true, secure: true } }]);

/** a URL é a página do jogo (qap://jogo/index.html)? */
function isGamePage(url) {
  try {
    if (typeof url !== 'string') return false;
    const u = new URL(url);
    return u.protocol === SCHEME + ':' && u.host === GAME_HOST && (u.pathname === '/' || u.pathname === '/index.html');
  } catch {
    return false;
  }
}

let pageCache = null;
function servePage(req) {
  if (req.method !== 'GET' || !isGamePage(req.url)) return new Response('não encontrado', { status: 404 });
  if (!pageCache) {
    const body = fs.readFileSync(INDEX);
    // a mesma Content-Security-Policy do <meta> do HTML, também como cabeçalho
    const m = body.toString('utf8', 0, Math.min(body.length, 8192)).match(/http-equiv="Content-Security-Policy" content="([^"]+)"/);
    pageCache = { body, csp: m ? m[1] : "default-src 'none'" };
  }
  return new Response(pageCache.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': pageCache.csp,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
    },
  });
}

let win = null;
/** o pedido veio da página do jogo, no quadro principal da janela do jogo? */
function trusted(e) {
  const f = e.senderFrame;
  return !!win && !win.isDestroyed() && e.sender === win.webContents && !!f && !f.parent && isGamePage(f.url);
}

// ------------------------------------------------------------------ pedidos da página
ipcMain.on('qap:storage', (e, op, key, value) => {
  if (!trusted(e)) {
    e.returnValue = null;
    return;
  }
  try {
    if (op === 'get') e.returnValue = store.get(key);
    else if (op === 'set') {
      store.set(key, value);
      e.returnValue = true;
    } else if (op === 'remove') {
      store.remove(key);
      e.returnValue = true;
    } else if (op === 'keys') e.returnValue = store.keys();
    else e.returnValue = null;
  } catch (err) {
    log('[saves]', String(op).slice(0, 10), String(key).slice(0, 140), err);
    e.returnValue = op === 'keys' ? [] : op === 'get' ? null : false;
  }
});

ipcMain.on('qap:info', (e) => {
  e.returnValue = trusted(e) ? { platform: process.platform, version: app.getVersion(), savesDir: savesDir(), testBuild: TEST_BUILD } : null;
});

// ------------------------------------------------------------------ janela
function settingsFromDisk() {
  try {
    return JSON.parse(store.get('qap.settings') || '{}');
  } catch {
    return {};
  }
}

function createWindow() {
  const startFull = settingsFromDisk().fullscreen !== false;
  win = new BrowserWindow({
    width: 1280,
    height: 720,
    useContentSize: true,
    minWidth: 960,
    minHeight: 540,
    center: true,
    show: false,
    fullscreen: startFull,
    fullscreenable: true,
    autoHideMenuBar: true,
    backgroundColor: '#0d1311',
    title: TITLE,
    icon: process.platform === 'linux' ? path.join(__dirname, 'icon.png') : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      nodeIntegrationInSubFrames: false,
      webSecurity: true,
      webviewTag: false,
      devTools: DEBUG,
      spellcheck: false,
    },
  });
  win.once('ready-to-show', () => win.show());

  win.on('enter-full-screen', () => tellFull(true));
  win.on('leave-full-screen', () => tellFull(false));

  // F11 e Alt+Enter alternam tela cheia (no Mac também Ctrl+Cmd+F, pelo menu)
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11' || (input.alt && input.key === 'Enter')) {
      e.preventDefault();
      setFull(!win.isFullScreen());
    }
    // @teste-inicio
    else if (DEBUG && input.key === 'F12') win.webContents.toggleDevTools();
    // @teste-fim
  });

  // a janela do jogo só mostra a página do jogo: nada de navegar para fora nem abrir janelas
  // (o jogo não tem links externos; um clique com o botão do meio também não abre nada)
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e, url) => {
    if (!isGamePage(url)) e.preventDefault();
  });
  win.webContents.on('will-frame-navigate', (e) => {
    if (!e.isMainFrame || !isGamePage(e.url)) e.preventDefault();
  });
  win.webContents.on('will-redirect', (e, url) => {
    if (!isGamePage(url)) e.preventDefault();
  });

  // erros da página vão para erros.log (a equipe manda esse arquivo junto com o relato)
  win.webContents.on('console-message', (...args) => {
    const ev = args[0] || {};
    const level = ev.level !== undefined ? ev.level : args[1];
    if (!(level === 'error' || level === 3)) return;
    const message = typeof ev.message === 'string' ? ev.message : args[2];
    const line = ev.lineNumber !== undefined ? ev.lineNumber : args[3];
    log('[jogo]', message, `(linha ${line})`);
  });
  win.webContents.on('render-process-gone', (_e, d) => log('[jogo encerrou]', d.reason, 'código', d.exitCode));
  win.on('unresponsive', () => log('[janela sem resposta]'));
  win.on('closed', () => {
    win = null;
  });

  win.loadURL(GAME_URL);
}

/** avisa a página (que grava a preferência em Opções) */
function tellFull(on) {
  if (win && !win.isDestroyed()) win.webContents.send('qap:fullscreen', on);
}
/** muda a tela cheia e já avisa a página: no Mac a troca é animada e alguns gerenciadores de janela do Linux não mandam o evento */
function setFull(on) {
  if (!win) return;
  if (win.isFullScreen() !== on) win.setFullScreen(on);
  tellFull(on);
}

ipcMain.on('qap:fullscreen:get', (e) => {
  e.returnValue = trusted(e) && !!win && win.isFullScreen();
});
ipcMain.on('qap:fullscreen:set', (e, on) => {
  if (trusted(e)) setFull(on === true);
});
function openSavesDir() {
  fs.mkdirSync(savesDir(), { recursive: true });
  shell.openPath(savesDir());
}
ipcMain.on('qap:openSavesDir', (e) => {
  if (trusted(e)) openSavesDir();
});
ipcMain.on('qap:quit', (e) => {
  if (trusted(e)) app.quit();
});

// ------------------------------------------------------------------ sessão: rede e permissões
let blockedLogged = 0;
function lockDownSession() {
  const ses = session.defaultSession;
  // o jogo é todo local: nenhuma requisição de rede sai do programa
  ses.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*', 'ftp://*/*', 'file://*/*'] }, (d, cb) => {
    if (blockedLogged < 20) {
      blockedLogged++;
      let where = '';
      try {
        const u = new URL(d.url);
        where = u.protocol === 'file:' ? 'file://(arquivo local)' : u.origin;
      } catch {
        where = '(endereço inválido)';
      }
      log('[rede bloqueada]', where);
    }
    cb({ cancel: true });
  });
  // nenhuma permissão do navegador (câmera, microfone, localização, notificações…); só a tela cheia
  ses.setPermissionRequestHandler((_wc, permission, cb, details) => cb(permission === 'fullscreen' && isGamePage(details && details.requestingUrl)));
  ses.setPermissionCheckHandler((_wc, permission) => permission === 'fullscreen');
  ses.setDevicePermissionHandler(() => false);
  if (typeof ses.setDisplayMediaRequestHandler === 'function') ses.setDisplayMediaRequestHandler((_req, cb) => cb({}));
}

// qualquer outro conteúdo web que aparecer (ex.: as ferramentas de desenvolvedor da versão
// de teste) também não abre janelas nem <webview>
app.on('web-contents-created', (_e, contents) => {
  contents.on('will-attach-webview', (ev) => ev.preventDefault());
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));
});

// ------------------------------------------------------------------ menu
function buildMenu() {
  if (process.platform !== 'darwin') {
    Menu.setApplicationMenu(null);
    return;
  }
  // Mac: o menu de cima é obrigatório (Cmd+Q, copiar/colar no nome do jogador)
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: PRODUCT,
        submenu: [
          { role: 'about', label: 'Sobre o QAP' },
          { type: 'separator' },
          { label: 'Abrir pasta dos saves', click: openSavesDir },
          { type: 'separator' },
          { role: 'hide', label: 'Ocultar o QAP' },
          { role: 'hideOthers', label: 'Ocultar os outros' },
          { role: 'unhide', label: 'Mostrar tudo' },
          { type: 'separator' },
          { role: 'quit', label: 'Sair do QAP' },
        ],
      },
      {
        label: 'Editar',
        submenu: [
          { role: 'undo', label: 'Desfazer' },
          { role: 'redo', label: 'Refazer' },
          { type: 'separator' },
          { role: 'cut', label: 'Recortar' },
          { role: 'copy', label: 'Copiar' },
          { role: 'paste', label: 'Colar' },
          { role: 'selectAll', label: 'Selecionar tudo' },
        ],
      },
      { label: 'Visualizar', submenu: [{ role: 'togglefullscreen', label: 'Tela cheia' }] },
      { label: 'Janela', submenu: [{ role: 'minimize', label: 'Minimizar' }, { role: 'zoom', label: 'Zoom' }] },
    ]),
  );
}

// ------------------------------------------------------------------ início
if (!app.requestSingleInstanceLock()) {
  // já há um QAP aberto: traz aquela janela para a frente e sai
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.focus();
  });
  app.whenReady().then(() => {
    app.setAboutPanelOptions({ applicationName: TITLE, applicationVersion: app.getVersion(), copyright: 'Central de Regulação de Santa Aurora' });
    protocol.handle(SCHEME, servePage);
    lockDownSession();
    buildMenu();
    createWindow();
  });
  app.on('window-all-closed', () => app.quit());
}
