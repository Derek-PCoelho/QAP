// =============================================================================
// QAP — Emergency Dispatch — entrada do servidor. Compilado para dist/server/server.mjs com
// `npm run build:server` e iniciado com `npm start` (Node ≥ 18, sem npm install).
// =============================================================================
import { spawn, type SpawnOptions } from 'node:child_process';
import { existsSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { join } from 'node:path';
import { createServer, type App, type ListenInfo } from './app';
import { DEFAULT_HOST, DEFAULT_PORT } from './config';
import { resolvePaths } from './paths';
import { openStore, type Store } from './store';
import { VERSION } from './version';

const HELP = `
QAP — servidor local

Uso: node dist/server/server.mjs [--open] [--port 7270] [--host 127.0.0.1]

  --open, -o    abre o jogo no navegador
  --port, -p    porta (padrão: PORT ou ${DEFAULT_PORT}; 0 = qualquer porta livre)
  --host        endereço (padrão: HOST ou ${DEFAULT_HOST}; 0.0.0.0 abre para a rede local)
  --help, -h    esta ajuda

Variáveis de ambiente: PORT, HOST, DATA_DIR, CLIENT_DIR, STORE=sqlite|json,
TRUST_PROXY=1, ALLOWED_ORIGINS=https://a.com,https://b.com, LOG_REQUESTS=1,
ALLOWED_HOSTS=nome1,nome2 (nomes de Host aceitos além de IPs e localhost),
ADMIN_TOKEN=… (painel e métricas pela rede), DISABLE_SAVES=1, DISABLE_RANKING=1,
DISABLE_TELEMETRY=1 (desligam essas partes da API sem atualizar o servidor)
`;

interface Cli {
  open: boolean;
  help: boolean;
  port: number | null;
  host: string | null;
  errors: string[];
}

function parsePort(raw: string | undefined): number | null {
  if (raw === undefined || !/^\d{1,5}$/.test(raw.trim())) return null;
  const n = Number(raw.trim());
  return n <= 65535 ? n : null;
}

function parseArgs(argv: readonly string[]): Cli {
  const cli: Cli = { open: false, help: false, port: null, host: null, errors: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const eq = arg.indexOf('=');
    const flag = eq > 0 ? arg.slice(0, eq) : arg;
    const inline = eq > 0 ? arg.slice(eq + 1) : undefined;
    const value = () => inline ?? argv[++i];
    switch (flag) {
      case '--open':
      case '-o':
        cli.open = true;
        break;
      case '--help':
      case '-h':
        cli.help = true;
        break;
      case '--port':
      case '-p': {
        const p = parsePort(value());
        if (p === null) cli.errors.push('--port precisa de um número entre 0 e 65535');
        else cli.port = p;
        break;
      }
      case '--host': {
        const h = value();
        if (!h) cli.errors.push('--host precisa de um endereço');
        else cli.host = h;
        break;
      }
      default:
        cli.errors.push(`opção desconhecida: ${arg}`);
    }
  }
  return cli;
}

const truthy = (v: string | undefined): boolean => !!v && /^(?:1|true|yes|sim|on)$/i.test(v.trim());
const splitList = (v: string | undefined): string[] =>
  (v ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

function lanAddresses(): string[] {
  const out: string[] = [];
  for (const list of Object.values(networkInterfaces())) {
    for (const a of list ?? []) {
      const ipv4 = a.family === 'IPv4' || (a.family as unknown) === 4;
      if (ipv4 && !a.internal) out.push(a.address);
    }
  }
  return out;
}

/** Só URLs que nós mesmos montamos (http://host:porta/...) — nada de metacaracteres de shell. */
const SAFE_URL = /^http:\/\/[A-Za-z0-9.:[\]-]+\/[A-Za-z0-9/._-]*$/;

function openBrowser(url: string): void {
  let warned = false;
  const fallback = () => {
    if (warned) return;
    warned = true;
    console.log(`   Não consegui abrir o navegador sozinho; abra ${url}`);
  };
  if (!SAFE_URL.test(url)) return fallback();
  const options: SpawnOptions = { stdio: 'ignore', detached: true };
  let cmd: string;
  let args: string[];
  if (process.platform === 'darwin') {
    cmd = 'open';
    args = [url];
  } else if (process.platform === 'win32') {
    // `start` é um comando interno do cmd; a URL já foi validada acima
    cmd = 'cmd';
    args = ['/d', '/s', '/c', 'start', '""', `"${url}"`];
    options.windowsVerbatimArguments = true;
    options.windowsHide = true;
  } else {
    cmd = 'xdg-open';
    args = [url];
  }
  try {
    const child = spawn(cmd, args, options);
    child.on('error', fallback);
    child.on('exit', (code) => {
      if (code) fallback(); // ex.: xdg-open sem navegador configurado
    });
    child.unref();
  } catch {
    fallback();
  }
}

function printBanner(info: ListenInfo, store: Store, clientBuilt: boolean, dev: boolean, adminToken: boolean, off: string[]): void {
  const rule = '═'.repeat(50);
  const out = ['', `  ${rule}`, '   QAP · central de regulação no ar', `  ${rule}`];
  out.push(`   Jogo      ${info.url}`, `   Painel    ${info.url}admin`);
  if (info.host === '0.0.0.0' || info.host === '::') {
    for (const ip of lanAddresses()) out.push(`   Na rede   http://${ip}:${info.port}/`);
    out.push(adminToken ? '   Painel    pela rede com o ADMIN_TOKEN (/admin?token=…)' : '   Painel    só neste computador (ADMIN_TOKEN libera pela rede)');
  }
  if (off.length) out.push(`   Desligado ${off.join(', ')}`);
  out.push(`   Dados     ${store.kind === 'sqlite' ? 'SQLite' : 'arquivos JSON'} em ${store.location}`);
  if (dev) out.push('', '   Modo dev: jogue pelo Vite em http://localhost:5173 (a API é repassada para cá).');
  else if (!clientBuilt) out.push('', '   Atenção: o jogo ainda não foi compilado. Rode "npm run build" e recarregue a página.');
  out.push('', '   Ctrl+C encerra o plantão.', '');
  console.log(out.join('\n'));
}

function installShutdown(app: App, store: Store): void {
  let stoppingSince = 0;
  const stop = (signal: string) => {
    if (stoppingSince) {
      // o mesmo Ctrl+C pode chegar duas vezes (grupo de processos + npm run dev): ignora
      if (Date.now() - stoppingSince < 1000) return;
      store.flushSync();
      process.exit(1);
    }
    stoppingSince = Date.now();
    console.log(`\n   Encerrando o plantão (${signal})… guardando os dados.`);
    const force = setTimeout(() => {
      store.flushSync();
      process.exit(1);
    }, 5000);
    force.unref();
    void (async () => {
      try {
        await app.close();
      } catch {
        /* segue o encerramento */
      }
      try {
        await store.close();
      } catch (err) {
        console.error('   Falha ao fechar os dados:', err);
        store.flushSync();
      }
      process.exit(0);
    })();
  };
  process.on('SIGINT', () => stop('SIGINT'));
  process.on('SIGTERM', () => stop('SIGTERM'));
  process.on('SIGHUP', () => stop('SIGHUP'));
  process.on('exit', () => {
    try {
      store.flushSync();
    } catch {
      /* última tentativa */
    }
  });
  process.on('uncaughtException', (err) => {
    console.error('[qap] erro inesperado:', err);
    try {
      store.flushSync();
    } catch {
      /* última tentativa */
    }
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    console.error('[qap] promessa rejeitada sem tratamento:', reason);
  });
}

async function main(): Promise<void> {
  process.title = 'qap';
  const cli = parseArgs(process.argv.slice(2));
  if (cli.help) {
    console.log(HELP);
    return;
  }
  if (cli.errors.length) {
    for (const e of cli.errors) console.error(`  ${e}`);
    console.error(HELP);
    process.exitCode = 2;
    return;
  }

  const env = process.env;
  const envPort = env.PORT ? parsePort(env.PORT) : null;
  if (env.PORT && envPort === null) console.warn(`  PORT=${env.PORT} é inválida; usando ${DEFAULT_PORT}.`);
  const port = cli.port ?? envPort ?? DEFAULT_PORT;
  const host = cli.host ?? (env.HOST?.trim() || DEFAULT_HOST);
  const dev = env.PLANTAO_DEV === '1';
  const paths = resolvePaths(import.meta.url, env);

  let store: Store;
  try {
    store = await openStore({ dataDir: paths.dataDir, prefer: env.STORE });
  } catch (err) {
    console.error(`\n  Não consegui abrir os dados em ${paths.dataDir}: ${(err as Error).message}\n`);
    process.exitCode = 1;
    return;
  }

  const app = createServer({
    store,
    clientDir: paths.clientDir,
    version: VERSION,
    trustProxy: truthy(env.TRUST_PROXY),
    allowedOrigins: splitList(env.ALLOWED_ORIGINS),
    logRequests: truthy(env.LOG_REQUESTS),
    allowedHosts: splitList(env.ALLOWED_HOSTS),
    adminToken: env.ADMIN_TOKEN?.trim() || undefined,
    disabled: { saves: truthy(env.DISABLE_SAVES), ranking: truthy(env.DISABLE_RANKING), telemetry: truthy(env.DISABLE_TELEMETRY) },
    dualLoopback: true,
  });
  installShutdown(app, store);

  let info: ListenInfo;
  try {
    info = await app.listen(port, host);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'EADDRINUSE') {
      console.error(
        `\n  A porta ${port} já está em uso — o plantão já está aberto em outra janela?\n` +
          `  Feche a outra instância ou escolha outra porta, por exemplo: PORT=${port + 1} npm start\n`,
      );
    } else if (code === 'EACCES') {
      console.error(`\n  Sem permissão para usar a porta ${port}. Tente uma porta acima de 1024.\n`);
    } else if (code === 'EADDRNOTAVAIL' || code === 'ENOTFOUND') {
      console.error(`\n  O endereço ${host} não existe nesta máquina (confira HOST/--host).\n`);
    } else {
      console.error(`\n  Não consegui abrir o servidor: ${(err as Error).message}\n`);
    }
    await store.close().catch(() => {});
    process.exit(1);
  }

  const off = [truthy(env.DISABLE_SAVES) && 'saves', truthy(env.DISABLE_RANKING) && 'ranking', truthy(env.DISABLE_TELEMETRY) && 'telemetria'].filter(Boolean) as string[];
  if (env.ADMIN_TOKEN && env.ADMIN_TOKEN.trim().length < 16) console.warn('  ADMIN_TOKEN curto demais: use pelo menos 16 caracteres aleatórios.');
  printBanner(info, store, existsSync(join(paths.clientDir, 'index.html')), dev, !!env.ADMIN_TOKEN?.trim(), off);
  if (cli.open) openBrowser(dev ? 'http://localhost:5173/' : info.url);
}

main().catch((err) => {
  console.error('[qap] falha ao iniciar:', err);
  process.exit(1);
});
