import { CONTENT } from '../src/content/index';
import { playBot, PROFILES } from '../src/engine/bot';
import { Game } from '../src/engine/game';
const prof = process.argv[2] ?? 'experiente';
const from = Number(process.argv[3] ?? 1001);
const to = Number(process.argv[4] ?? 1060);
const sumI: number[] = Array(22).fill(0);
const sumW: number[] = Array(22).fill(0);
const sumN: number[] = Array(22).fill(0);
const cnt: number[] = Array(22).fill(0);
for (let s = from; s <= to; s++) {
  const g = Game.create(CONTENT, { gender: 'M', difficulty: 'padrao', seed: s });
  let lastDay = 1;
  const rec = (gg: Game) => {
    sumI[lastDay] += gg.st.vars.integridade;
    sumW[lastDay] += gg.st.totals.warnings;
    sumN[lastDay] += gg.st.totals.notes;
    cnt[lastDay]++;
  };
  playBot(CONTENT, PROFILES[prof], s, {
    game: g,
    stopWhen: (gg) => {
      if (gg.st.day !== lastDay) {
        rec(gg);
        lastDay = gg.st.day;
      }
      return false;
    },
  });
}
const out: string[] = [];
for (let d = 1; d <= 20; d++) if (cnt[d]) out.push(`D${d}: integ ${(sumI[d] / cnt[d]).toFixed(2)} advert ${(sumW[d] / cnt[d]).toFixed(2)} notas ${(sumN[d] / cnt[d]).toFixed(2)}`);
console.log(out.join('\n'));
