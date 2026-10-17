// =============================================================================
// Escolha do backend de armazenamento.
//   STORE=sqlite  → força SQLite (cai para JSON, com aviso, se node:sqlite não existir)
//   STORE=json    → força JSON
//   (vazio)       → SQLite se disponível, senão JSON
// =============================================================================
import { mkdirSync } from 'node:fs';
import { JsonStore, type JsonStoreOptions } from './json-store';
import { SqliteStore, loadSqliteModule, type SqliteStoreOptions } from './sqlite-store';
import type { Store } from './types';

export * from './types';
export { JsonStore, SqliteStore, loadSqliteModule };
export type { JsonStoreOptions, SqliteStoreOptions };

export interface OpenStoreOptions {
  dataDir: string;
  /** 'sqlite' | 'json' | vazio (automático) — normalmente vem de process.env.STORE */
  prefer?: string | null;
  log?: (msg: string) => void;
  json?: Omit<JsonStoreOptions, 'log'>;
  sqlite?: Omit<SqliteStoreOptions, 'log'>;
}

export async function openStore(o: OpenStoreOptions): Promise<Store> {
  const log = o.log ?? ((m: string) => console.log(m));
  const prefer = (o.prefer ?? '').trim().toLowerCase();
  if (prefer && prefer !== 'json' && prefer !== 'sqlite') {
    log(`[dados] STORE=${prefer} não existe (use sqlite ou json); usando a escolha automática.`);
  }
  mkdirSync(o.dataDir, { recursive: true });
  if (prefer !== 'json') {
    const store = await SqliteStore.open(o.dataDir, { ...o.sqlite, log });
    if (store) return store;
    if (prefer === 'sqlite') {
      log(
        `[dados] STORE=sqlite pedido, mas node:sqlite não está disponível no Node ${process.version} ` +
          '(existe a partir do 22.5; sem flag a partir do 22.13). Usando arquivos JSON.',
      );
    }
  }
  return JsonStore.open(o.dataDir, { ...o.json, log });
}
