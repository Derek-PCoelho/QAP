// Regressões achadas no playtest de QA (jogando no navegador) antes do playtest de desktop.
import { describe, it, expect } from 'vitest';
import { CONTENT } from '../src/content/index';
import { FIELD_CASES } from '../src/content/field';
import { FieldSim, autoPlayField } from '../src/engine/field';
import { Game } from '../src/engine/game';
import { newGameState, makeCtx } from '../src/engine/state';
import { Rng } from '../src/engine/util';
import type { FieldShift } from '../src/engine/types';

describe('playtest: Intervenção', () => {
  it('save na cena logo depois da Intervenção não descarta a noite (pagamento, cochilos)', () => {
    const st = newGameState({ gender: 'F', difficulty: 'padrao', seed: 11, startDay: 4 } as never);
    st.day = 4;
    st.phase = 'casa';
    const g = Game.load(CONTENT, JSON.stringify(st));
    const h = g.home!;
    for (let i = 0; i < 50 && g.st.home!.step === 'pre'; i++) {
      const ch = h.choices().filter((x) => !x.disabled);
      if (ch.length) h.choose(ch[0].idx);
      else h.continueScene();
    }
    expect(g.st.home!.step).toBe('escolha');
    h.chooseTimeOff('bico');
    autoPlayField(h.fieldSim()!, 1, new Rng(4));
    h.finishField();
    expect(g.st.home!.step).toBe('cena');
    const paid = g.st.money;
    // save no meio da cena: volta ao resumo da noite, já paga
    const B = Game.load(CONTENT, g.serialize());
    expect(B.st.money).toBe(paid);
    expect(B.st.flags['noite_em_claro']).toBe(true);
    expect(B.st.home!.step).toBe('intervencao');
    B.home!.finishField();
    expect(B.st.home!.step).toBe('cena');
    expect(B.st.money).toBe(paid); // não paga de novo
  });

  it('{hora} nas falas segue o relógio da ocorrência; nenhum caso fixa um horário', () => {
    const f: FieldShift = { cases: ['moto_coxa'], idx: 0, phase: 'radio', results: [], clock: [19 * 60 + 40], extra: {} };
    const sim = new FieldSim(f, FIELD_CASES, 'padrao');
    sim.begin();
    expect(sim.act('torniquete').ok).toBe(true);
    while (sim.rt!.busy) sim.tick(0.25);
    expect(sim.rt!.log[sim.rt!.log.length - 1].text).toContain('O Márcio escreve a hora: 19h40.');
    for (const c of FIELD_CASES) for (const t of [c.radio, ...c.actions.map((a) => a.say)]) expect(t, c.id).not.toMatch(/\b\d{1,2}h\d{0,2}\b/);
  });
});

describe('playtest: textos de fim', () => {
  it('exoneração no Regulador Real fala em duas advertências', () => {
    const st = newGameState({ gender: 'M', difficulty: 'real', seed: 1, startDay: 2 } as never);
    expect(CONTENT.endings.gameover.exonerado(makeCtx(st))[1]).toBe('Duas advertências no mesmo plantão.');
    st.difficulty = 'padrao';
    expect(CONTENT.endings.gameover.exonerado(makeCtx(st))[1]).toBe('Três advertências no mesmo plantão.');
  });
});
