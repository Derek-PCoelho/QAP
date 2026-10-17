import { describe, it, expect } from 'vitest';
import { CONTENT } from '../src/content/index';
import { playBot, PROFILES } from '../src/engine/bot';

describe('campanha completa com bot', () => {
  for (const [key, prof] of Object.entries(PROFILES)) {
    it(`perfil ${key} joga sem exceções`, () => {
      for (const seed of [1, 2, 3]) {
        const r = playBot(CONTENT, prof, seed);
        if (r.errors.length) console.log(key, seed, r.errors.slice(0, 5));
        expect(r.errors).toEqual([]);
        expect(r.daysPlayed).toBeGreaterThan(0);
        expect(r.ending || r.gameOver).toBeTruthy();
      }
    });
  }
});
