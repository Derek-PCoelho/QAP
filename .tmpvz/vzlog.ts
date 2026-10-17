import { CONTENT } from '../src/content/index';
import { playBot, PROFILES, EXTRA_PROFILES } from '../src/engine/bot';
import { ShiftSim } from '../src/engine/shift';

const prof = { ...PROFILES, ...EXTRA_PROFILES }[process.argv[2] ?? 'medio'];
const seed = Number(process.argv[3] ?? 1001);
const orig = ShiftSim.prototype.vzClose;
ShiftSim.prototype.vzClose = function (this: ShiftSim) {
  const vz = this.sh.vz;
  if (vz) {
    console.log(`\n=== D${this.st.day} ${vz.key} (${vz.origin}) start ${vz.start} → ${vz.result} · ${vz.minutes} min · Saulo ${this.st.flags['saulo_confianca'] ?? 0}`);
    for (const l of vz.log) console.log(`  ${l.who}: ${l.text}`);
  }
  return orig.call(this);
};
const r = playBot(CONTENT, prof, seed);
console.log('\nRESULT', r.ending ?? r.gameOver, 'days', r.daysPlayed, r.res, r.errors.slice(0, 3));
