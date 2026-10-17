// Depois do build de arquivo único: põe a Content-Security-Policy no HTML (scripts/csp.mjs) e
// copia para JOGAR.html na raiz (abre com duplo clique, sem servidor).
// Com QAP_RELEASE=1 (versão final do programa de desktop, ver desktop/build.mjs) o build sai em
// dist/standalone-release/ e não vira JOGAR.html.
import { copyFileSync, existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { withCsp } from './csp.mjs';

const RELEASE = process.env.QAP_RELEASE === '1';
const src = resolve(RELEASE ? 'dist/standalone-release/index.html' : 'dist/standalone/index.html');
if (!existsSync(src)) {
  console.error(`${src} não existe. Rode o build standalone primeiro.`);
  process.exit(1);
}
writeFileSync(src, withCsp(readFileSync(src, 'utf8')));
if (RELEASE) {
  console.log(`Versão final de arquivo único com CSP: ${src} (${(statSync(src).size / 1024).toFixed(0)} KB).`);
} else {
  copyFileSync(src, resolve('JOGAR.html'));
  copyFileSync(src, resolve('dist/JOGAR.html'));
  console.log(`JOGAR.html atualizado, com CSP (${(statSync(src).size / 1024).toFixed(0)} KB).`);
}
