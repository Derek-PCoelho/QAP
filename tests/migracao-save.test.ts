// Migração de saves da 1.0.x (v3) para a 1.1 (v4): o save do jogador no dia 6 tem de abrir.
// Os arquivos de tests/fixtures foram gravados com o código da 1.0.4 (commit 99dfb0e),
// campanha feminina (ex-Amber), bot Médio, semente 4242.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CONTENT } from '../src/content/index';
import { Game } from '../src/engine/game';
import { playBot, PROFILES } from '../src/engine/bot';
import { SAVE_VERSION } from '../src/engine/state';
import { protagonistFirst, resolveTokens } from '../src/engine/text';

const fx = (f: string) => readFileSync(new URL('./fixtures/' + f, import.meta.url), 'utf8');

describe('migração de saves v3 → v4', () => {
  for (const file of ['v3-dia6-casa.json', 'v3-dia6-jornal.json']) {
    it(`${file} abre, vira a versão atual e o jogo continua`, () => {
      const json = fx(file);
      expect(JSON.parse(json).v).toBe(3);
      const g = Game.load(CONTENT, json);
      expect(g.st.v).toBe(SAVE_VERSION);
      expect(g.st.day).toBe(6);
      expect(g.st.gender).toBe('F');
      expect(protagonistFirst(g.st.gender, g.st)).toBe('Camille');
      // segue jogando até o dia 8 sem exceção
      const r = playBot(CONTENT, PROFILES.medio, 7, { game: g, maxDays: 8 });
      expect(r.errors).toEqual([]);
      expect(g.st.day).toBeGreaterThanOrEqual(8);
      // e o save novo abre de novo
      expect(() => Game.load(CONTENT, g.serialize())).not.toThrow();
    });
  }

  it('textos já gravados com "Amber" passam a usar o nome atual', () => {
    const o = JSON.parse(fx('v3-dia6-casa.json'));
    o.diary.push({ id: 'x', day: 5, name: 'Teste', text: 'A Dra. Amber Moura ligou de volta. AMBER!', kind: 'vivo', updates: [{ day: 6, text: 'Amber voltou.' }] });
    o.history[0].report.push({ callId: 'c', name: 'n', text: 'Amber', money: 0, t: 0 });
    o.home.log.push('Amber chegou.');
    const g = Game.load(CONTENT, JSON.stringify(o));
    const d = g.st.diary.find((x) => x.id === 'x')!;
    expect(d.text).toBe('A Dra. Camille Moura ligou de volta. CAMILLE!');
    expect(d.updates[0].text).toBe('Camille voltou.');
    expect(g.st.history[0].report.at(-1)!.text).toBe('Camille');
    expect(g.st.home!.log.at(-1)).toBe('Camille chegou.');
    // com nome escolhido
    o.name = 'Bia';
    const g2 = Game.load(CONTENT, JSON.stringify(o));
    expect(g2.st.diary.find((x) => x.id === 'x')!.text).toContain('Dra. Bia Moura');
  });

  it('save de casa sem found/tried/inspected não quebra a carga', () => {
    const o = JSON.parse(fx('v3-dia6-casa.json'));
    delete o.home.found;
    delete o.home.tried;
    delete o.home.inspected;
    const g = Game.load(CONTENT, JSON.stringify(o));
    expect(g.st.home!.found).toEqual([]);
    expect(g.st.home!.inspected).toBe(false);
  });

  it('protagonista masculino: Luan vira Thiago (o menino Luan Cardoso do dia 17 não)', () => {
    const o = JSON.parse(fx('v3-dia6-casa.json'));
    o.gender = 'M';
    o.diary.push({ id: 'y', day: 5, name: 'T', text: 'Luan, o regulador. Luan Cardoso, 7.', kind: 'vivo', updates: [] });
    const g = Game.load(CONTENT, JSON.stringify(o));
    expect(g.st.diary.find((x) => x.id === 'y')!.text).toBe('Thiago, o regulador. Luan Cardoso, 7.');
  });
});

describe('nome do protagonista', () => {
  it('padrão por gênero e nome escolhido no {nome}', () => {
    const f = Game.create(CONTENT, { gender: 'F', difficulty: 'padrao', seed: 1 });
    expect(resolveTokens('{tit} {nome} {sobrenome}', 'F', f.st)).toBe('Dra. Camille Moura');
    const m = Game.create(CONTENT, { gender: 'M', difficulty: 'padrao', seed: 1 });
    expect(resolveTokens('{NOME}', 'M', m.st)).toBe('THIAGO');
    const n = Game.create(CONTENT, { gender: 'M', difficulty: 'padrao', seed: 1, name: '  Zeca {x}  ' });
    expect(n.st.name).toBe('Zeca x');
    expect(resolveTokens('Oi, {nome}.', 'M', n.st)).toBe('Oi, Zeca x.');
  });
});
