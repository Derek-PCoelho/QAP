// Campanha 2 ("Simone"): um bot de TARM joga os 20 dias sem interface.
import { describe, it, expect } from 'vitest';
import { CONTENT } from '../src/content/index';
import { Game } from '../src/engine/game';
import { colorFor } from '../src/engine/grading';
import type { Color } from '../src/engine/types';

function playTarm(seed: number, acc: number, toHenrique: number) {
  let s = seed;
  const rnd = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  const g = Game.createSimone(CONTENT, { gender: seed % 2 ? 'M' : 'F', difficulty: 'padrao', seed });
  const order: Color[] = ['azul', 'verde', 'amarelo', 'vermelho'];
  const errors: string[] = [];
  let guard = 0;
  try {
    while (guard++ < 400000) {
      const st = g.st;
      if (st.phase === 'final' || st.phase === 'gameover') break;
      if (st.phase === 'jornal') {
        g.newspaper();
        g.beginShift();
        continue;
      }
      if (g.scene) {
        const ch = g.scene.choices().filter((c) => !c.disabled);
        if (ch.length) g.sceneChoose(ch[Math.floor(rnd() * ch.length)].idx);
        else g.sceneContinue();
        continue;
      }
      if (st.phase === 'relatorio') {
        if (st.gameOver) {
          g.setPhase('gameover');
          break;
        }
        g.toHome();
        continue;
      }
      if (st.phase === 'casa') {
        g.finishNight(g.nightBills().filter((b) => rnd() < 0.85).map((b) => b.id));
        continue;
      }
      if (st.phase === 'plantao') {
        const sh = g.shift!;
        const act = sh.active();
        if (!act) {
          const q = sh.queue();
          if (q.length) sh.answer(q[0].id);
          else g.tick(1000);
          continue;
        }
        if (act.status !== 'ativa') {
          g.tick(500);
          continue;
        }
        g.tick(1000);
        if (act.asked.length < 2) {
          const qs = sh.questions(act).filter((x) => !x.asked && x.group !== 'acalmar' && x.id !== 'callback');
          if (qs.length) {
            sh.ask(qs[0].id);
            continue;
          }
        }
        const t = sh.truthOf(act);
        let color = colorFor(t.sev);
        if (rnd() > acc) color = order[Math.max(0, Math.min(3, order.indexOf(color) + (rnd() < 0.5 ? -1 : 1)))];
        const henriqueOk = !sh.sh.tarm!.regs.henrique.away;
        const r = sh.tarmPass(color, color === 'vermelho', henriqueOk && rnd() < toHenrique ? 'henrique' : 'moura');
        if (!r.ok) errors.push('pass: ' + r.error);
      }
    }
  } catch (e) {
    errors.push(`dia ${g.st.day}: ${(e as Error).message}\n${(e as Error).stack?.split('\n').slice(0, 4).join('\n')}`);
  }
  return { g, errors };
}

describe('campanha da Simone (TARM)', () => {
  it('joga os 20 dias sem exceções', () => {
    for (const seed of [11, 12]) {
      const { g, errors } = playTarm(seed, 0.85, 0.3);
      if (errors.length) console.log(errors.slice(0, 5));
      expect(errors).toEqual([]);
      expect(['final', 'gameover']).toContain(g.st.phase);
      expect(g.st.history.length).toBeGreaterThan(0);
      if (g.st.phase === 'final') expect(g.st.ending?.lines.length).toBeGreaterThan(0);
    }
  });
  it('triagem ruim leva a advertências', () => {
    const { g, errors } = playTarm(5, 0.2, 0.5);
    expect(errors).toEqual([]);
    expect(g.st.totals.warnings + (g.st.gameOver ? 1 : 0)).toBeGreaterThan(0);
  });
});
