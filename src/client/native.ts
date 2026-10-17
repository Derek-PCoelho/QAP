// Ponte com o executável de desktop (Electron, ver desktop/). No navegador nada disso
// existe: o jogo usa o localStorage. No desktop, saves e opções viram arquivos na pasta
// do usuário, e há tela cheia e "Sair".

export interface NativeBridge {
  storage: {
    get(key: string): string | null;
    set(key: string, value: string): void;
    remove(key: string): void;
    keys(): string[];
  };
  isFullscreen(): boolean;
  setFullscreen(on: boolean): void;
  /** pasta onde ficam os saves */
  savesDir(): string;
  openSavesDir(): void;
  quit(): void;
  /** avisa quando a janela entra ou sai da tela cheia (F11, Alt+Enter, botão verde do Mac) */
  onFullscreenChange?(cb: (on: boolean) => void): void;
  platform: string;
  version: string;
  /** versão de teste da equipe: a Campanha da Simone já vem aberta */
  testBuild?: boolean;
}

declare global {
  interface Window {
    qapNative?: NativeBridge;
  }
}

export function native(): NativeBridge | undefined {
  return typeof window !== 'undefined' ? window.qapNative : undefined;
}

export function isNative(): boolean {
  return !!native();
}

function ls(): Storage | undefined {
  try {
    return typeof window !== 'undefined' ? window.localStorage : undefined;
  } catch {
    return undefined;
  }
}

/** armazenamento do jogo: arquivos no desktop, localStorage no navegador */
export const storage = {
  get(key: string): string | null {
    const n = native();
    if (n) return n.storage.get(key);
    try {
      return ls()?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    const n = native();
    if (n) return n.storage.set(key, value);
    try {
      ls()?.setItem(key, value);
    } catch {
      /* armazenamento indisponível: segue sem persistir */
    }
  },
  remove(key: string): void {
    const n = native();
    if (n) return n.storage.remove(key);
    try {
      ls()?.removeItem(key);
    } catch {
      /* nada */
    }
  },
  keys(): string[] {
    const n = native();
    if (n) return n.storage.keys();
    const out: string[] = [];
    try {
      const s = ls();
      if (!s) return out;
      for (let i = 0; i < s.length; i++) {
        const k = s.key(i);
        if (k) out.push(k);
      }
    } catch {
      /* nada */
    }
    return out;
  },
};
