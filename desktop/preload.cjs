// Ponte entre a página do jogo e o processo principal (main.cjs). Expõe window.qapNative,
// que o jogo usa em src/client/native.ts: saves em arquivos, tela cheia e "Sair".
// As chamadas de armazenamento são síncronas, como o localStorage que elas substituem.
// O processo principal só atende a página do jogo; fora dela a ponte nem é criada.
'use strict';
const { contextBridge, ipcRenderer } = require('electron');

const info = ipcRenderer.sendSync('qap:info');

if (info && typeof info === 'object') {
  const storage = (op, key, value) => ipcRenderer.sendSync('qap:storage', op, key, value);
  contextBridge.exposeInMainWorld('qapNative', {
    storage: {
      get: (key) => {
        const v = storage('get', String(key));
        return typeof v === 'string' ? v : null;
      },
      set: (key, value) => {
        storage('set', String(key), String(value));
      },
      remove: (key) => {
        storage('remove', String(key));
      },
      keys: () => {
        const k = storage('keys');
        return Array.isArray(k) ? k : [];
      },
    },
    isFullscreen: () => ipcRenderer.sendSync('qap:fullscreen:get') === true,
    setFullscreen: (on) => ipcRenderer.send('qap:fullscreen:set', on === true),
    onFullscreenChange: (cb) => {
      if (typeof cb === 'function') ipcRenderer.on('qap:fullscreen', (_e, on) => cb(on === true));
    },
    savesDir: () => String(info.savesDir || ''),
    openSavesDir: () => ipcRenderer.send('qap:openSavesDir'),
    quit: () => ipcRenderer.send('qap:quit'),
    platform: String(info.platform || ''),
    version: String(info.version || ''),
    testBuild: info.testBuild === true,
  });
}
