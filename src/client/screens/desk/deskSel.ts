// Seleção compartilhada entre mapa e ficha (viatura escolhida).
import { useSyncExternalStore } from 'react';

interface Sel {
  unit?: string;
  type?: 'USA' | 'USB';
}
let sel: Sel = {};
let ver = 0;
const ls = new Set<() => void>();

export const deskSel = {
  get: () => sel,
  set(p: Sel) {
    sel = { ...sel, ...p };
    ver++;
    ls.forEach((l) => l());
  },
  clear() {
    sel = {};
    ver++;
    ls.forEach((l) => l());
  },
};

export function useDeskSel() {
  useSyncExternalStore(
    (f) => {
      ls.add(f);
      return () => ls.delete(f);
    },
    () => ver,
  );
  return { ...sel, set: deskSel.set, clear: deskSel.clear };
}
