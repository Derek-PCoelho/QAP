// Saves guardados (src/client/settings.ts): nenhum save some de vez sem o jogador querer.
// Apagar, o fim da campanha e gravar outra campanha (ou um ponto anterior) por cima guardam uma
// cópia, que fica 30 dias (no máximo 10). Testado com um localStorage de mentira, inclusive cheio.
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';

class MemStorage {
  data = new Map<string, string>();
  /** limite em caracteres (null = sem limite), para simular o navegador sem espaço */
  quota: number | null = null;
  get length() {
    return this.data.size;
  }
  key(i: number) {
    return [...this.data.keys()][i] ?? null;
  }
  getItem(k: string) {
    return this.data.has(k) ? this.data.get(k)! : null;
  }
  setItem(k: string, v: string) {
    if (this.quota !== null) {
      let used = 0;
      for (const [kk, vv] of this.data) if (kk !== k) used += kk.length + vv.length;
      if (used + k.length + v.length > this.quota) throw new Error('QuotaExceededError');
    }
    this.data.set(k, String(v));
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
}

const mem = new MemStorage();
let S: typeof import('../src/client/settings');

beforeAll(async () => {
  (globalThis as unknown as { window: unknown }).window = { localStorage: mem };
  S = await import('../src/client/settings');
});
beforeEach(() => {
  mem.data.clear();
  mem.quota = null;
});

function put(slot: string, id: string, playSeconds: number, day = 3) {
  const data = JSON.stringify({ v: 3, id, playSeconds, day, filler: 'x'.repeat(2000) });
  S.writeLocalSave(slot, data, { slot, savedAt: 1, day, phase: 'casa', mode: 'campanha', money: 100, gender: 'F', difficulty: 'padrao', gameId: id, playSeconds });
  return data;
}

describe('saves guardados', () => {
  it('apagar guarda uma cópia que dá para ler de volta', () => {
    const data = put('auto', 'campA', 500);
    expect(S.trashLocalSave('auto', 'apagado por você')).toBe(true);
    expect(S.readLocalSave('auto')).toBeNull();
    const [t] = S.listTrash();
    expect(t.slot).toBe('auto');
    expect(t.reason).toBe('apagado por você');
    expect(t.summary.day).toBe(3);
    expect(S.readTrash(t.id)).toBe(data);
    // e apagar de vez tira a cópia
    S.purgeTrash(t.id);
    expect(S.listTrash()).toEqual([]);
  });

  it('sem espaço para a cópia, o save original não é apagado', () => {
    put('auto', 'campA', 500);
    mem.quota = [...mem.data].reduce((a, [k, v]) => a + k.length + v.length, 0) + 100;
    expect(S.trashLocalSave('auto', 'apagado por você')).toBe(false);
    expect(S.readLocalSave('auto')).not.toBeNull();
    expect(S.listTrash()).toEqual([]);
    // nenhum resto de cópia pela metade
    expect([...mem.data.keys()].some((k) => k.startsWith('qap.lixeira.'))).toBe(false);
  });

  it('sem espaço, tira a cópia guardada mais antiga para caber a nova', () => {
    put('1', 'velha', 10);
    expect(S.backupLocalSave('1', 'teste', 1_000)).toBe(true);
    put('auto', 'nova', 20);
    // espaço para os saves e uma cópia só
    mem.quota = [...mem.data].reduce((a, [k, v]) => a + k.length + v.length, 0) + 200;
    expect(S.backupLocalSave('auto', 'teste', 2_000)).toBe(true);
    const list = S.listTrash();
    expect(list.map((t) => t.slot)).toEqual(['auto']);
  });

  it('cópias com mais de 30 dias saem, e ficam no máximo 10', () => {
    const day = 86_400_000;
    const now = 100 * day;
    for (let i = 0; i < 14; i++) {
      put('auto', 'c' + i, i);
      expect(S.backupLocalSave('auto', 'teste', now - i * 1000)).toBe(true);
    }
    put('2', 'antiga', 1);
    expect(S.backupLocalSave('2', 'teste', now - 40 * day)).toBe(true);
    S.pruneTrash(now);
    const list = S.listTrash();
    expect(list.length).toBe(S.TRASH_MAX);
    expect(list.some((t) => t.slot === '2')).toBe(false);
    // as mais novas ficam
    expect(list[0].deletedAt).toBe(now);
  });

  it('decide quando gravar por cima perde algo', () => {
    const next = { id: 'A', playSeconds: 1000 };
    expect(S.replacingLosesProgress(undefined, next)).toBeNull();
    expect(S.replacingLosesProgress({ id: 'A', playSeconds: 900 }, next)).toBeNull();
    expect(S.replacingLosesProgress({ id: 'B', playSeconds: 10 }, next)).toMatch(/outra campanha/);
    expect(S.replacingLosesProgress({ id: 'A', playSeconds: 4000 }, next)).toMatch(/ponto anterior/);
    expect(S.replacingLosesProgress(null, next)).toMatch(/ilegível/);
  });

  it('lê a campanha de um save antigo, sem o id no resumo', () => {
    mem.setItem('qap.save.auto', JSON.stringify({ v: 3, id: 'velha', playSeconds: 77 }));
    mem.setItem('qap.save.meta.auto', JSON.stringify({ slot: 'auto', day: 2 }));
    expect(S.savedInfo('auto')).toEqual({ id: 'velha', playSeconds: 77 });
    mem.setItem('qap.save.auto', '{quebrado');
    expect(S.savedInfo('auto')).toBeNull();
    expect(S.savedInfo('3')).toBeUndefined();
  });

  it('a lista de saves não mostra as cópias guardadas', () => {
    put('auto', 'A', 5);
    S.backupLocalSave('auto', 'teste');
    expect(S.listLocalSaves().map((x) => x.slot)).toEqual(['auto']);
  });
});
