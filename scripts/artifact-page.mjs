// Gera dist/artifact/index.html a partir do build de arquivo único:
// só o conteúdo da página (título, estilos, raiz e script), sem doctype/head/body,
// para publicar como Artifact no Claude.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const src = readFileSync('dist/standalone/index.html', 'utf8');
const title = (src.match(/<title>([\s\S]*?)<\/title>/) || [, 'QAP — Emergency Dispatch'])[1];
const styles = [...src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
const scripts = [...src.matchAll(/<script type="module"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
if (!styles.length || !scripts.length) {
  console.error('build standalone sem estilos ou script.');
  process.exit(1);
}
const page = [
  `<title>${title}</title>`,
  // o jogo tem uma só identidade visual (escura): fundo e esquema de cores explícitos
  '<style>:root{color-scheme:dark}html,body{background:#070a09;color:#e6efd9}</style>',
  ...styles.map((s) => `<style>${s}</style>`),
  '<div id="root"></div>',
  ...scripts.map((s) => `<script type="module">${s}</script>`),
].join('\n');
mkdirSync('dist/artifact', { recursive: true });
writeFileSync('dist/artifact/index.html', page);
console.log(`dist/artifact/index.html (${(page.length / 1024).toFixed(0)} KB)`);
