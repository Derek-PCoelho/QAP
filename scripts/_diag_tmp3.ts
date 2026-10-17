import { CONTENT } from '../src/content/index';
import { playBot, PROFILES } from '../src/engine/bot';
const prof = process.argv[2] ?? 'experiente';
const from = Number(process.argv[3] ?? 1001);
const to = Number(process.argv[4] ?? 1100);
const ends: Record<string, number> = {};
let integ = 0;
let d20 = 0;
let n = 0;
for (let s = from; s <= to; s++) {
  const r = playBot(CONTENT, PROFILES[prof], s);
  const k = r.ending ?? 'go:' + r.gameOver;
  ends[k] = (ends[k] ?? 0) + 1;
  integ += r.vars.integridade ?? 0;
  if (r.ending) d20++;
  n++;
}
console.log(prof, JSON.stringify(ends), 'integ', (integ / n).toFixed(2), 'D20', d20 + '/' + n);
