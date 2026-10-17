// =============================================================================
// npm run build:desktop — empacota o jogo como programa de Windows, Mac e Linux.
//
//   npm run build:desktop                       → todas as plataformas
//   npm run build:desktop -- linux win          → só as escolhidas: linux, win, mac-arm, mac-intel
//   npm run build:desktop -- --release          → versão final (sem as facilidades da versão de teste)
//
// Coloca o build de arquivo único (dist/standalone/index.html, o mesmo do JOGAR.html) dentro
// do Electron com main.cjs e preload.cjs. Saída em desktop/release/ (versão final: desktop/release-final/): um .zip por plataforma
// (Linux: .tar.gz), cada um com uma pasta pronta e um LEIA-ME.
//
// Mac: o app é assinado "ad hoc" com o rcodesign (variável RCODESIGN ou no PATH). Sem
// assinatura, o Mac com chip Apple não abre o app; ver docs/DESKTOP.md.
// Segurança (docs/SEGURANCA.md): os fuses do Electron são gravados em todo pacote (o binário
// não roda como Node, ignora NODE_OPTIONS e --inspect, só carrega o app.asar e confere a
// integridade dele); a versão final sai sem o código de teste (main.cjs e o jogo) e é
// recompilada sem as facilidades de teste; cada build gera um SBOM (lista de componentes).
// Precisa de: Node 22.12+, internet para baixar o Electron (fica em cache), zip e tar.
// =============================================================================
import { packager } from '@electron/packager';
import { flipFuses, getCurrentFuseWire, FuseV1Options, FuseVersion } from '@electron/fuses';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const ELECTRON = '44.8.0';
const NAME = 'QAP - Emergency Dispatch';
const VERSION = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;
/** versão de teste da equipe (padrão): a Campanha da Simone já vem aberta e o rodapé diz "versão de teste" */
const TEST_BUILD = !process.argv.includes('--release');
const STAGE = join(HERE, '.stage');
// a versão final sai em pastas próprias, para nunca ser trocada por engano por um pacote de teste
const OUT = join(HERE, TEST_BUILD ? 'out' : 'out-final');
const RELEASE = join(HERE, TEST_BUILD ? 'release' : 'release-final');
const today = new Date();
const DATA = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

const TARGETS = {
  linux: { platform: 'linux', arch: 'x64', label: 'Linux (x64)', folder: `${NAME} (Linux)`, archive: 'QAP-Emergency-Dispatch-Linux.tar.gz' },
  win: { platform: 'win32', arch: 'x64', label: 'Windows 10 e 11 (64 bits)', folder: `${NAME} (Windows)`, archive: 'QAP-Emergency-Dispatch-Windows.zip' },
  'mac-arm': { platform: 'darwin', arch: 'arm64', label: 'Mac com chip Apple (M1, M2, M3, M4…)', chip: 'Apple (M1, M2, M3, M4…)', folder: `${NAME} (Mac Apple Silicon)`, archive: 'QAP-Emergency-Dispatch-Mac-AppleSilicon.zip' },
  'mac-intel': { platform: 'darwin', arch: 'x64', label: 'Mac com processador Intel', chip: 'Intel', folder: `${NAME} (Mac Intel)`, archive: 'QAP-Emergency-Dispatch-Mac-Intel.zip' },
};

const die = (msg) => {
  console.error('\n✗ ' + msg);
  process.exit(1);
};
const mb = (f) => (statSync(f).size / 1048576).toFixed(1) + ' MB';

// ------------------------------------------------------------------ quais plataformas
const asked = process.argv.slice(2).filter((a) => !a.startsWith('-'));
for (const a of asked) if (!TARGETS[a]) die(`plataforma desconhecida: ${a} (use: ${Object.keys(TARGETS).join(', ')})`);
const targets = (asked.length ? asked : Object.keys(TARGETS)).map((k) => ({ key: k, ...TARGETS[k] }));

// ------------------------------------------------------------------ pasta do app
// Versão de teste: o build de arquivo único de sempre (o mesmo do JOGAR.html).
// Versão final: recompila o jogo sem as facilidades de teste (?speed, ?dia, ?simone, window.__store).
if (!TEST_BUILD) {
  console.log('▸ Recompilando o jogo para a versão final (sem as facilidades de teste)…');
  const env = { ...process.env, QAP_RELEASE: '1' };
  execFileSync(process.execPath, [join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'), 'build', '--config', 'vite.standalone.config.ts', '--logLevel', 'warn'], { cwd: ROOT, env, stdio: 'inherit' });
  execFileSync(process.execPath, [join(ROOT, 'scripts', 'copy-standalone.mjs')], { cwd: ROOT, env, stdio: 'inherit' });
}
const html = join(ROOT, 'dist', TEST_BUILD ? 'standalone' : 'standalone-release', 'index.html');
if (!existsSync(html)) die(`${html} não existe. Rode "npm run build:standalone" antes.`);
const page = readFileSync(html, 'utf8');
if (!page.includes('http-equiv="Content-Security-Policy"')) die('o HTML do jogo está sem a Content-Security-Policy (scripts/copy-standalone.mjs).');
if (!TEST_BUILD && /__store|get\(["'](?:speed|dia|simone)["']\)/.test(page)) die('a versão final ainda tem facilidades de teste no jogo (window.__store, ?speed, ?dia ou ?simone).');
rmSync(STAGE, { recursive: true, force: true });
mkdirSync(STAGE, { recursive: true });
cpSync(html, join(STAGE, 'index.html'));
writeFileSync(join(STAGE, 'main.cjs'), stripTestBlocks(readFileSync(join(HERE, 'main.cjs'), 'utf8')));
cpSync(join(HERE, 'preload.cjs'), join(STAGE, 'preload.cjs'));
cpSync(join(HERE, 'icons', 'icon.png'), join(STAGE, 'icon.png'));
writeFileSync(
  join(STAGE, 'package.json'),
  JSON.stringify(
    {
      name: 'qap-emergency-dispatch',
      productName: NAME,
      version: VERSION,
      description: 'QAP — Emergency Dispatch: simulador de regulação médica de urgência.',
      main: 'main.cjs',
      private: true,
      qapTestBuild: TEST_BUILD,
    },
    null,
    2,
  ),
);

// ------------------------------------------------------------------ utilidades
/**
 * Versão final: apaga do main.cjs os blocos entre "// @teste-inicio" e "// @teste-fim"
 * (ferramentas de desenvolvedor). Esconder atrás de uma opção não basta: o código sai do pacote.
 */
function stripTestBlocks(src) {
  if (TEST_BUILD) return src;
  const out = src.replace(/^[ \t]*\/\/ @teste-inicio[\s\S]*?^[ \t]*\/\/ @teste-fim[^\n]*\n/gm, '');
  if (/@teste-(inicio|fim)|toggleDevTools|openDevTools|QAP_DEBUG/.test(out)) die('main.cjs: sobrou código de teste na versão final.');
  return out;
}

/** Fuses do Electron: chaves gravadas no binário que desligam recursos que o jogo não usa. */
const FUSES = {
  version: FuseVersion.V1,
  resetAdHocDarwinSignature: false, // o Mac é reassinado logo depois (rcodesign)
  // ELECTRON_RUN_AS_NODE=1 transformaria o executável num Node que roda qualquer script
  [FuseV1Options.RunAsNode]: false,
  // NODE_OPTIONS=--require … carregaria código de fora no processo principal
  [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
  // --inspect / --inspect-brk abririam o depurador do Node no processo principal
  [FuseV1Options.EnableNodeCliInspectArguments]: false,
  // o app.asar é conferido pelo hash gravado no pacote (Mac e Windows)
  [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
  // só carrega o jogo de dentro do app.asar (nada de uma pasta "app" ao lado)
  [FuseV1Options.OnlyLoadAppFromAsar]: true,
  // a página em file:// fica com as permissões de um navegador comum
  [FuseV1Options.GrantFileProtocolExtraPrivileges]: false,
};
const FUSE_NAMES = Object.keys(FuseV1Options).filter((k) => Number.isNaN(Number(k)));

async function burnFuses(target) {
  await flipFuses(target, FUSES);
  const wire = await getCurrentFuseWire(target);
  const want = (v) => (v ? 49 : 48); // '1' ligado, '0' desligado
  for (const n of FUSE_NAMES) {
    const v = FUSES[FuseV1Options[n]];
    if (v === undefined) continue;
    if (wire[FuseV1Options[n]] !== want(v)) die(`fuse ${n} não ficou como devia em ${target}`);
  }
  return FUSE_NAMES.filter((n) => FUSES[FuseV1Options[n]] !== undefined)
    .map((n) => `${n}=${FUSES[FuseV1Options[n]] ? 'sim' : 'não'}`)
    .join(' ');
}

function rcodesign() {
  const cands = [process.env.RCODESIGN, 'rcodesign'].filter(Boolean);
  for (const c of cands) {
    try {
      execFileSync(c, ['--version'], { stdio: 'ignore' });
      return c;
    } catch {
      /* próximo */
    }
  }
  return null;
}

/** tira os idiomas do Chromium que o jogo não usa (≈ 40 MB a menos por plataforma) */
function pruneLocales(dir, platform) {
  if (platform !== 'darwin') {
    const loc = join(dir, 'locales');
    const keep = new Set(['en-US.pak', 'pt-BR.pak', 'pt-PT.pak']);
    for (const f of readdirSync(loc)) if (!keep.has(f)) rmSync(join(loc, f), { force: true });
    return;
  }
  const keep = new Set(['en.lproj', 'en_US.lproj', 'pt_BR.lproj', 'pt_PT.lproj', 'pt.lproj', 'Base.lproj']);
  const app = join(dir, `${NAME}.app`);
  const res = [join(app, 'Contents', 'Resources'), join(app, 'Contents', 'Frameworks', 'Electron Framework.framework', 'Versions', 'A', 'Resources')];
  for (const r of res) {
    if (!existsSync(r)) continue;
    for (const f of readdirSync(r)) if (f.endsWith('.lproj') && !keep.has(f)) rmSync(join(r, f), { recursive: true, force: true });
  }
}

/**
 * Mac: o Info.plist padrão do Electron pede câmera, microfone, captura de áudio e Bluetooth e libera
 * conexões sem HTTPS. O jogo não usa nada disso: as descrições saem (sem elas o macOS nem oferece a
 * permissão) e o App Transport Security volta ao padrão (só HTTPS; o jogo nem acessa a rede).
 */
const PLIST_DROP = ['NSAudioCaptureUsageDescription', 'NSBluetoothAlwaysUsageDescription', 'NSBluetoothPeripheralUsageDescription', 'NSCameraUsageDescription', 'NSMicrophoneUsageDescription'];
function tightenPlist(dir) {
  const file = join(dir, `${NAME}.app`, 'Contents', 'Info.plist');
  let x = readFileSync(file, 'utf8');
  for (const k of PLIST_DROP) x = x.replace(new RegExp(`\\s*<key>${k}</key>\\s*<string>[^<]*</string>`), '');
  x = x.replace(/\s*<key>NSAppTransportSecurity<\/key>\s*<dict>[\s\S]*?<\/dict>/, '');
  if (PLIST_DROP.some((k) => x.includes(`<key>${k}</key>`)) || x.includes('NSAllowsArbitraryLoads')) die('Info.plist: não consegui tirar as permissões que o jogo não usa.');
  writeFileSync(file, x);
}

/**
 * Linux: o binário vira qap-emergency-dispatch-bin e o nome original passa a ser um script que
 * abre o jogo COM o sandbox do Chromium sempre que o sistema permite (user namespaces sem
 * privilégio, ou o chrome-sandbox com setuid de root). Onde não dá (root, contêiner, Steam
 * Runtime, Ubuntu 24.04+ sem perfil do AppArmor), abre sem sandbox — o jogo é todo local, não
 * acessa a rede e só mostra a própria página. Se o Chromium recusar o sandbox mesmo assim, ele
 * fecha em menos de 2 s e o script abre de novo sem. QAP_SANDBOX=0 força abrir sem sandbox.
 */
function linuxLauncher(dir) {
  const bin = join(dir, 'qap-emergency-dispatch');
  renameSync(bin, bin + '-bin');
  writeFileSync(
    bin,
    [
      '#!/bin/sh',
      '# Abre o QAP — Emergency Dispatch (ver LEIA-ME.txt).',
      '# Usa o sandbox do Chromium quando o sistema permite; senão abre sem (o jogo é todo local).',
      '# QAP_SANDBOX=0 força abrir sem sandbox.',
      'DIR="$(dirname "$(readlink -f "$0")")"',
      'BIN="$DIR/qap-emergency-dispatch-bin"',
      'sem_sandbox() { exec "$BIN" --no-sandbox "$@"; }',
      '[ "$(id -u)" = "0" ] && sem_sandbox "$@"',
      '[ "${QAP_SANDBOX:-1}" = "0" ] && sem_sandbox "$@"',
      'pode=0',
      'if [ -u "$DIR/chrome-sandbox" ] && [ "$(stat -c %u "$DIR/chrome-sandbox" 2>/dev/null)" = "0" ]; then pode=1',
      'elif command -v unshare >/dev/null 2>&1 && unshare --user --map-root-user true >/dev/null 2>&1; then pode=1',
      'fi',
      '[ "$pode" = "1" ] || sem_sandbox "$@"',
      '"$BIN" "$@" &',
      'PID=$!',
      'trap \'kill "$PID" 2>/dev/null\' INT TERM HUP',
      'n=0',
      'while [ "$n" -lt 20 ]; do',
      '  if ! kill -0 "$PID" 2>/dev/null; then',
      '    wait "$PID"',
      '    st=$?',
      '    # 0 = fechou normal; 2 = o próprio jogo recusou os argumentos (não é problema de sandbox)',
      '    { [ "$st" -eq 0 ] || [ "$st" -eq 2 ]; } && exit "$st"',
      '    echo "QAP: o sandbox do Chromium não abriu neste sistema; abrindo sem sandbox." >&2',
      '    sem_sandbox "$@"',
      '  fi',
      '  sleep 0.1 2>/dev/null || sleep 1',
      '  n=$((n + 1))',
      'done',
      'wait "$PID"',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );
}

/** SBOM (CycloneDX) do que vai dentro do pacote: as dependências do jogo e o Electron */
function writeSbom() {
  let sbom;
  try {
    const out = execFileSync('npm', ['sbom', '--sbom-format', 'cyclonedx', '--omit', 'dev', '--package-lock-only'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    sbom = JSON.parse(out);
  } catch (e) {
    console.warn('  ! SBOM não gerado (npm sbom precisa do npm 10+):', e.message.split('\n')[0]);
    return null;
  }
  sbom.components = sbom.components || [];
  sbom.components.push({
    type: 'framework',
    name: 'electron',
    version: ELECTRON,
    purl: `pkg:npm/electron@${ELECTRON}`,
    description: 'Runtime do programa de desktop (Chromium + Node.js), baixado pelo @electron/packager',
    'bom-ref': `electron@${ELECTRON}`,
  });
  const file = join(RELEASE, `SBOM-QAP-${VERSION}.cdx.json`);
  writeFileSync(file, JSON.stringify(sbom, null, 2) + '\n');
  return file;
}

function leiaMe(t) {
  const tpl = readFileSync(join(HERE, 'LEIA-ME.txt'), 'utf8');
  const abrir = {
    win32: [
      'COMO ABRIR (Windows 10 ou 11)',
      '1. Extraia o .zip inteiro (botão direito no arquivo → "Extrair tudo…").',
      '   Não abra o jogo de dentro do .zip.',
      `2. Na pasta extraída, dê dois cliques em "${NAME}.exe".`,
      '3. Se aparecer "O Windows protegeu o computador", clique em "Mais informações" e',
      '   depois em "Executar assim mesmo". O aviso aparece porque esta versão de teste',
      '   ainda não tem assinatura digital; depois da primeira vez ele não volta.',
    ],
    darwin: [
      'COMO ABRIR (macOS 13 Ventura ou mais novo)',
      `1. Dê dois cliques no .zip para extrair. Se quiser, arraste "${NAME}" para a pasta`,
      '   Aplicativos.',
      '2. Na primeira vez, o Mac avisa que não consegue verificar o app (esta versão de teste',
      '   ainda não foi autenticada pela Apple):',
      '   • macOS 15 (Sequoia) ou mais novo: tente abrir, clique em "OK" no aviso, vá em',
      '     Ajustes do Sistema → Privacidade e Segurança, role até o fim e clique em',
      '     "Abrir Mesmo Assim". Confirme com a sua senha.',
      '   • macOS 14 ou anterior: clique com o botão direito no app → Abrir → Abrir.',
      '3. Se o aviso disser que o app "está danificado": abra o Terminal, digite  xattr -cr',
      '   (com um espaço no fim), arraste o app para a janela do Terminal e aperte Enter.',
      '   Depois abra de novo.',
      '4. Se mesmo assim ele fechar sozinho ao abrir, no Terminal digite',
      '   codesign --force --deep --sign -   (com um espaço no fim), arraste o app para a',
      '   janela, aperte Enter e abra de novo.',
      `Este pacote é para Mac com chip ${t.chip}. Para conferir: menu Apple → Sobre Este Mac.`,
    ],
    linux: [
      'COMO ABRIR (Linux x64)',
      `1. Extraia:  tar xzf ${t.archive}`,
      `2. Abra:     "./${t.folder}/qap-emergency-dispatch"`,
      '   O jogo usa o sandbox do Chromium quando o sistema permite e, se não der, abre sem ele',
      '   (o jogo é todo local e não acessa a rede). Se mesmo assim não abrir, tente:',
      `   QAP_SANDBOX=0 "./${t.folder}/qap-emergency-dispatch"`,
    ],
  }[t.platform].join('\n');
  return tpl
    .replace('{{TIPO}}', TEST_BUILD ? 'Versão de teste' : 'Versão')
    .replace(
      '{{SIMONE}}',
      TEST_BUILD
        ? '\nNesta versão de teste, a "Campanha da Simone" (os mesmos dias, do lado da TARM) já vem\naberta; na versão final ela abre depois do primeiro final.'
        : '\nA "Campanha da Simone" (os mesmos dias, do lado da TARM) abre depois do primeiro final.',
    )
    .replace('{{VERSAO}}', VERSION)
    .replace('{{DATA}}', DATA)
    .replace('{{PLATAFORMA}}', t.label)
    .replace('{{COMO_ABRIR}}', abrir)
    .replace('{{MAC_TECLA}}', t.platform === 'darwin' ? ' (no Mac, também Ctrl+Cmd+F)' : '')
    .replace(/\r?\n/g, t.platform === 'win32' ? '\r\n' : '\n');
}

// ------------------------------------------------------------------ empacotar
mkdirSync(OUT, { recursive: true });
mkdirSync(RELEASE, { recursive: true });
const rc = targets.some((t) => t.platform === 'darwin') ? rcodesign() : null;
const report = [];

for (const t of targets) {
  console.log(`\n▸ ${t.label}`);
  const [built] = await packager({
    dir: STAGE,
    out: OUT,
    name: NAME,
    executableName: t.platform === 'linux' ? 'qap-emergency-dispatch' : NAME,
    platform: t.platform,
    arch: t.arch,
    electronVersion: ELECTRON,
    asar: true,
    overwrite: true,
    prune: false,
    quiet: true,
    icon: t.platform === 'darwin' ? join(HERE, 'icons', 'icon.icns') : t.platform === 'win32' ? join(HERE, 'icons', 'icon.ico') : undefined,
    appVersion: VERSION,
    buildVersion: VERSION,
    appCopyright: '© 2026 QAP — Emergency Dispatch',
    appBundleId: 'br.qap.emergencydispatch',
    appCategoryType: 'public.app-category.simulation-games',
    win32metadata: {
      CompanyName: 'QAP',
      FileDescription: NAME,
      ProductName: NAME,
      InternalName: 'QAP',
      OriginalFilename: `${NAME}.exe`,
    },
  });
  const dir = join(OUT, t.folder);
  rmSync(dir, { recursive: true, force: true });
  renameSync(built, dir);
  pruneLocales(dir, t.platform);
  if (t.platform === 'darwin') tightenPlist(dir);
  const fuseTarget = t.platform === 'darwin' ? join(dir, `${NAME}.app`) : t.platform === 'win32' ? join(dir, `${NAME}.exe`) : join(dir, 'qap-emergency-dispatch');
  const fuses = await burnFuses(fuseTarget);
  console.log(`  fuses: ${fuses}`);
  if (t.platform === 'linux') linuxLauncher(dir);
  writeFileSync(join(dir, 'LEIA-ME.txt'), leiaMe(t));

  let signed = '';
  if (t.platform === 'darwin') {
    const app = join(dir, `${NAME}.app`);
    if (rc) {
      execFileSync(rc, ['sign', app], { stdio: ['ignore', 'ignore', 'pipe'] });
      signed = 'assinado ad hoc';
    } else {
      signed = 'SEM assinatura (instale o rcodesign ou assine num Mac)';
      console.warn('  ! rcodesign não encontrado: o app do Mac sai sem assinatura.');
    }
  }

  const arc = join(RELEASE, t.archive);
  rmSync(arc, { force: true });
  if (t.archive.endsWith('.tar.gz')) execFileSync('tar', ['czf', arc, t.folder], { cwd: OUT });
  else execFileSync('zip', ['-r', '-y', '-q', '-X', arc, t.folder], { cwd: OUT });
  report.push(`${t.archive.padEnd(44)} ${mb(arc).padStart(9)}  ${signed}`);
}

writeFileSync(
  join(RELEASE, 'LEIA-ME.txt'),
  [
    `QAP — Emergency Dispatch · ${TEST_BUILD ? 'versão de teste' : 'versão'} ${VERSION} (${DATA})`,
    '',
    'Qual arquivo usar:',
    '  Windows 10 ou 11 ..................... QAP-Emergency-Dispatch-Windows.zip',
    '  Mac com chip Apple (M1, M2, M3, M4…) .. QAP-Emergency-Dispatch-Mac-AppleSilicon.zip',
    '  Mac com processador Intel ............ QAP-Emergency-Dispatch-Mac-Intel.zip',
    '  Linux (x64) .......................... QAP-Emergency-Dispatch-Linux.tar.gz',
    '',
    'Dentro de cada um há um LEIA-ME com o passo a passo para abrir na primeira vez,',
    'onde ficam os saves e como mandar o registro de erros.',
    '',
  ].join('\n'),
);

const sbom = writeSbom();
if (sbom) report.push(`${sbom.split('/').pop().padEnd(44)} (lista de componentes, para auditoria)`);

console.log(`\nPronto (Electron ${ELECTRON}, jogo ${VERSION}, ${TEST_BUILD ? 'versão de teste' : 'versão final'}). Em desktop/${TEST_BUILD ? "release" : "release-final"}/:`);
for (const r of report) console.log('  ' + r);
