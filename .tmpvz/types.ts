import { CONTENT } from '../src/content/index';
const unrel = new Set(['trotista', 'exagerador', 'minimizador', 'embriagado', 'crianca', 'disfarcado', 'frequentador']);
for (let d = 1; d <= 20; d++) {
  const day = CONTENT.days[d];
  const types: Record<string, number> = {};
  let u = 0;
  let red = 0;
  for (const c of day.calls) {
    types[c.type] = (types[c.type] ?? 0) + 1;
    if (unrel.has(c.type)) u++;
    const t = typeof c.truth === 'function' ? null : c.truth;
    if (t?.sev === 'vermelho') red++;
  }
  console.log(d, day.calls.length, 'unrel', u, 'red', red, JSON.stringify(types));
}
