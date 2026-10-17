// experimento: perfil com ajustes em N sementes a partir de F. Uso: exp.ts <nome> (configs.json)
import { readFileSync } from 'node:fs';
import { CONTENT } from '../src/content/index';
import { playBot, PROFILES, EXTRA_PROFILES } from '../src/engine/bot';

const name = process.argv[2];
const cfgs = JSON.parse(readFileSync(new URL('./configs.json', import.meta.url), 'utf8')) as Record<string, { key: string; over?: Record<string, unknown>; n?: number; from?: number }>;
const c = cfgs[name];
const n = c.n ?? 150;
const from = c.from ?? 1001;
const prof = { ...({ ...PROFILES, ...EXTRA_PROFILES }[c.key]), ...(c.over ?? {}) };
let reach = 0;
const go: Record<string, number> = {};
let deaths = 0;
let warn = 0;
for (let s = 0; s < n; s++) {
  const r = playBot(CONTENT, prof, from + s);
  if (r.ending) reach++;
  if (r.gameOver) go[r.gameOver] = (go[r.gameOver] ?? 0) + 1;
  deaths += r.deaths;
  warn += r.warnings;
}
console.log(name, c.key, JSON.stringify(c.over ?? {}), `n=${n} from=${from}`, 'reach', ((100 * reach) / n).toFixed(1) + '%', JSON.stringify(go), 'deaths', (deaths / n).toFixed(1), 'warn', (warn / n).toFixed(1));
