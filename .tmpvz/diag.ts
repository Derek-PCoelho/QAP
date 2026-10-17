// diagnóstico: onde o perfil perde (óbitos por tipo, desperdício de perguntas nos graves)
import { CONTENT } from '../src/content/index';
import { playBot, PROFILES, EXTRA_PROFILES } from '../src/engine/bot';
import { ShiftSim } from '../src/engine/shift';

const prof = { ...PROFILES, ...EXTRA_PROFILES }[process.argv[2] ?? 'lento'];
const n = Number(process.argv[3] ?? 40);
const stats = { reds: 0, waste: 0, wasteCalls: 0, objective: 0, deaths: 0, deathFault: 0, deathKinds: {} as Record<string, number>, hangupDeaths: 0, talk: 0, videos: 0 };
const origFinish = ShiftSim.prototype.finish;
ShiftSim.prototype.finish = function (this: ShiftSim) {
  const already = this.sh.ended;
  origFinish.call(this);
  if (already) return;
  for (const id of this.sh.order) {
    const c = this.sh.calls[id];
    if (!c) continue;
    const t = this.truthOf(c);
    if (t.sev === 'vermelho') {
      stats.reds++;
      stats.waste += c.waste ?? 0;
      stats.talk += c.talk ?? 0;
      if ((c.waste ?? 0) > 0) stats.wasteCalls++;
      if (c.verdict?.text.includes('Direto ao ponto')) stats.objective++;
    }
    if (c.outcome === 'obito') {
      stats.deaths++;
      const k = c.status === 'desligou' ? 'fila' : c.verdict?.kind ?? c.status;
      stats.deathKinds[k] = (stats.deathKinds[k] ?? 0) + 1;
    }
  }
};
let reach = 0;
const go: Record<string, number> = {};
for (let s = 1; s <= n; s++) {
  const r = playBot(CONTENT, prof, 1000 + s);
  if (r.ending) reach++;
  if (r.gameOver) go[r.gameOver] = (go[r.gameOver] ?? 0) + 1;
}
console.log(prof.name, 'reach', reach, '/', n, go);
console.log('reds', stats.reds, 'avg waste/red', (stats.waste / stats.reds).toFixed(1), 'calls w/ waste', stats.wasteCalls, 'objective', stats.objective, 'avg talk/red', (stats.talk / stats.reds).toFixed(1));
console.log('deaths', stats.deaths, stats.deathKinds);
