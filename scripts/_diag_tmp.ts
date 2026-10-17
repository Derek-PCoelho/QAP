// Diagnóstico: por que um Experiente não chega ao final bom?
import { CONTENT } from '../src/content/index';
import { playBot, PROFILES } from '../src/engine/bot';
import { Game } from '../src/engine/game';
import { checkEnding } from '../src/engine/endings';

const prof = PROFILES[process.argv[2] ?? 'experiente'];
const n = Number(process.argv[3] ?? 50);
for (let s = 1; s <= n; s++) {
  const seed = 1000 + s;
  const g = Game.create(CONTENT, { gender: 'M', difficulty: 'padrao', seed });
  const r = playBot(CONTENT, prof, seed, { game: g });
  if (r.ending !== 'bom') {
    const chk = checkEnding(g.st);
    const fam = Object.entries(g.st.family).map(([k, m]) => `${k}:${m.status}/r${m.risk}`).join(' ');
    console.log(seed, r.ending, r.gameOver ?? '', 'faltou:', chk.goodMissing.join('; '), '|', fam, '| laços', g.st.vars.lacos, 'integ', g.st.vars.integridade, '| zelia_caiu', !!g.st.flags['zelia_caiu_d10'], 'espera', g.st.flags['zelia_espera'] ?? '-');
  }
}
