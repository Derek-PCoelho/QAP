// =============================================================================
// npm run dev — servidor (esbuild em watch + reinício automático) e Vite juntos.
// Ctrl+C encerra tudo. Sem dependências além do esbuild e do vite do projeto.
// =============================================================================
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUTFILE = join(root, 'dist', 'server', 'server.mjs');
const isWin = process.platform === 'win32';
const tag = (s) => `\x1b[32m[dev]\x1b[0m ${s}`;

let shuttingDown = false;
/** @type {import('node:child_process').ChildProcess | null} */
let server = null;
/** @type {import('node:child_process').ChildProcess | null} */
let vite = null;
let restartQueued = false;
let stopping = null;

function startServer() {
  const child = spawn(process.execPath, [OUTFILE], {
    cwd: root,
    stdio: ['ignore', 'inherit', 'inherit'],
    env: { ...process.env, PLANTAO_DEV: '1', NODE_ENV: process.env.NODE_ENV ?? 'development' },
  });
  child.on('exit', (code, signal) => {
    if (server === child) server = null;
    if (!shuttingDown && !stopping && code !== 0 && signal == null) {
      console.log(tag(`o servidor saiu com código ${code}; ele volta na próxima alteração em server/.`));
    }
  });
  server = child;
}

function stopServer() {
  const child = server;
  if (!child || child.exitCode !== null || child.signalCode !== null) return Promise.resolve();
  return new Promise((done) => {
    const kill = setTimeout(() => child.kill('SIGKILL'), 4000);
    child.once('exit', () => {
      clearTimeout(kill);
      done();
    });
    child.kill('SIGTERM'); // o servidor grava os dados e sai
  });
}

/** reinicia o servidor depois de cada build bem-sucedido (agrupando builds seguidos) */
async function restartServer() {
  if (shuttingDown) return;
  if (stopping) {
    restartQueued = true;
    return;
  }
  stopping = stopServer();
  await stopping;
  stopping = null;
  if (shuttingDown) return;
  startServer();
  if (restartQueued) {
    restartQueued = false;
    void restartServer();
  }
}

function viteCommand() {
  try {
    const require = createRequire(import.meta.url);
    const pkg = require.resolve('vite/package.json');
    return { cmd: process.execPath, args: [join(dirname(pkg), 'bin', 'vite.js')], shell: false };
  } catch {
    return { cmd: isWin ? 'npx.cmd' : 'npx', args: ['vite'], shell: isWin };
  }
}

function startVite() {
  const { cmd, args, shell } = viteCommand();
  vite = spawn(cmd, args, { cwd: root, stdio: 'inherit', shell, env: process.env });
  vite.on('exit', (code) => {
    vite = null;
    if (!shuttingDown) {
      console.log(tag('o Vite encerrou; finalizando o modo dev.'));
      void shutdown(code ?? 0);
    }
  });
  vite.on('error', (err) => {
    console.error(tag(`não consegui iniciar o Vite: ${err.message}`));
    void shutdown(1);
  });
}

let ctx = null;

async function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  const force = setTimeout(() => process.exit(code), 5000);
  force.unref();
  try {
    await ctx?.dispose();
  } catch {
    /* ignorar */
  }
  const waits = [stopServer()];
  if (vite && vite.exitCode === null) {
    waits.push(new Promise((done) => vite.once('exit', done)));
    vite.kill('SIGTERM');
  }
  await Promise.all(waits);
  process.exit(code);
}

process.on('SIGINT', () => void shutdown(0));
process.on('SIGTERM', () => void shutdown(0));

const restartPlugin = {
  name: 'reiniciar-servidor',
  setup(build) {
    let first = true;
    build.onEnd((result) => {
      if (result.errors.length) {
        console.log(tag('o servidor tem erros de compilação; esperando a correção…'));
        return;
      }
      if (!first) console.log(tag('servidor recompilado; reiniciando…'));
      first = false;
      void restartServer();
    });
  },
};

ctx = await esbuild.context({
  absWorkingDir: root,
  entryPoints: ['server/server.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node18',
  outfile: OUTFILE,
  banner: { js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);" },
  logLevel: 'warning',
  plugins: [restartPlugin],
});
await ctx.watch();
startVite();
console.log(tag('API em http://localhost:7270 · jogo em http://localhost:5173 · Ctrl+C encerra tudo'));
