import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Build em arquivo único (JOGAR.html): roda com duplo clique, sem servidor.
// QAP_RELEASE=1 gera a versão final do programa de desktop (desktop/build.mjs --release):
// sem as facilidades de teste (?speed, ?dia, ?simone, window.__store), em dist/standalone-release.
const RELEASE = process.env.QAP_RELEASE === '1';

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: './',
  // código só em ASCII: a página funciona mesmo servida sem charset (ex.: Artifact)
  esbuild: { charset: 'ascii' },
  define: { __STANDALONE__: 'true', __QAP_DEV__: RELEASE ? 'false' : 'true' },
  build: {
    outDir: RELEASE ? 'dist/standalone-release' : 'dist/standalone',
    emptyOutDir: true,
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 8000,
  },
});
