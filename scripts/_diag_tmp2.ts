import { CONTENT } from '../src/content/index';
import { playBot, PROFILES } from '../src/engine/bot';
import { Game } from '../src/engine/game';
for (const seed of [1008, 1036]) {
  const g = Game.create(CONTENT, { gender: 'M', difficulty: 'padrao', seed });
  let last = g.st.vars.integridade;
  playBot(CONTENT, PROFILES.experiente, seed, {
    game: g,
    stopWhen: (gg) => {
      const v = gg.st.vars.integridade;
      if (v !== last) {
        console.log(seed, 'D' + gg.st.day, gg.st.phase, last, '->', v, Object.keys(gg.st.flags).filter((k) => /mentiu|favorec|meta_suja|vip|vereador_usa|d9_|envelope|denun|encobr|omit/.test(k)).join(','));
        last = v;
      }
      return false;
    },
  });
}
