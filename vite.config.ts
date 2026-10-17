import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  // código só em ASCII: a página funciona mesmo servida sem charset (ex.: Artifact)
  esbuild: { charset: 'ascii' },
  // __QAP_DEV__: facilidades de teste (?speed, ?dia, ?simone, window.__store); só a versão
  // final do programa de desktop sai sem elas (vite.standalone.config.ts com QAP_RELEASE=1)
  define: { __STANDALONE__: 'false', __QAP_DEV__: 'true' },
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
    chunkSizeWarningLimit: 4000,
  },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:7270' },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 120000,
  },
} as any);
