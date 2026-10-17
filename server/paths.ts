// Onde ficam o cliente compilado e os dados.
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface ServerPaths {
  /** raiz do projeto (pai de dist/) */
  projectRoot: string;
  /** dist/client — ou CLIENT_DIR */
  clientDir: string;
  /** <raiz>/data — ou DATA_DIR */
  dataDir: string;
}

/**
 * `metaUrl` é o import.meta.url da entrada. No bundle (dist/server/server.mjs) o
 * cliente fica em new URL('../client/', import.meta.url); rodando direto do código
 * (server/server.ts) ele fica em <raiz>/dist/client.
 */
export function resolvePaths(metaUrl: string, env: NodeJS.ProcessEnv = process.env, cwd: string = process.cwd()): ServerPaths {
  const here = dirname(fileURLToPath(metaUrl));
  const bundled = basename(here) === 'server' && basename(dirname(here)) === 'dist';
  const projectRoot = bundled ? dirname(dirname(here)) : dirname(here);
  const defaultClient = bundled ? fileURLToPath(new URL('../client/', metaUrl)) : join(projectRoot, 'dist', 'client');
  return {
    projectRoot,
    clientDir: env.CLIENT_DIR ? resolve(cwd, env.CLIENT_DIR) : defaultClient,
    dataDir: env.DATA_DIR ? resolve(cwd, env.DATA_DIR) : join(projectRoot, 'data'),
  };
}
