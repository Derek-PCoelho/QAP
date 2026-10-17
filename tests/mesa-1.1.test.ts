// Mesa da 1.1 (Onda 2): post-it da Simone por cor, quadro de cortiça no save, o "piii" da
// censura e as rubricas, folgados com as frases de Outros, trotes sem risada.
import { describe, it, expect } from 'vitest';
import { CONTENT } from '../src/content/index';
import { BANK } from '../src/content/bank/index';
import { FOLGADOS, FOLGADO_NOT_DAYS, folgadoSlot } from '../src/content/bank/folgados';
import { Game } from '../src/engine/game';
import { ShiftSim } from '../src/engine/shift';
import { newGameState } from '../src/engine/state';
import { buildGeneratedCall } from '../src/engine/generator';
import { simoneBox, noteBoxFor } from '../src/engine/categories';
import { corkOf, corkAddPostit, corkAddSticker, corkMove, corkRemove, CORK_MAX_POSTITS } from '../src/engine/cork';
import { checkSave, parseSave } from '../src/engine/save-check';
import { hasBleep, splitBleeps, BLEEP_RE } from '../src/engine/bleep';
import { parseText, buildPlan, specFor, speechSeed, rubricEffect } from '../src/client/audio/speech';
import { hm, fmtTime } from '../src/engine/util';
import type { CallDef, CallRT, DayDef, GenParams, TruthDef } from '../src/engine/types';
import type { Content } from '../src/engine/content-api';

const gen = (template: string, truth: string, seed = 5): GenParams => ({ template, truth, seed, name: '', age: 0, sex: 'M', addr: { rua: '', n: 0, bairro: '' }, num: '', caller: '' });
const truthOf = (d: CallDef): TruthDef => (typeof d.truth === 'function' ? d.truth({} as never) : d.truth);

// -----------------------------------------------------------------------------
describe('post-it da Simone por cor', () => {
  const base: CallDef = {
    id: 'x',
    at: '07:10',
    num: '(17) 3322-0000',
    caller: 'Teste',
    type: 'comum',
    note: 'Teste.',
    addr: { rua: 'Rua Bahia', n: 1200, bairro: 'Centro' },
    open: ['Alô.'],
    patient: { name: 'Teste', age: 40, sex: 'F' },
    truth: { dx: 'Entorse', sev: 'verde', ok: ['ORI'], ref: ['UPA'] },
  };
  it('a cor vem da caixa do chamado: Clínico azul, GO rosa, Trauma verde, branco quando ela não sabe', () => {
    expect(simoneBox({ ...base, truth: { dx: 'Infarto', sev: 'vermelho', ok: ['USA'] } }, { dx: 'Infarto', sev: 'vermelho', ok: ['USA'] })).toBe('clinico');
    expect(simoneBox(base, { dx: 'Trabalho de parto expulsivo', sev: 'amarelo', ok: ['USB'] })).toBe('go');
    expect(simoneBox(base, { dx: 'Queda de moto com fratura', sev: 'amarelo', ok: ['USB'] })).toBe('trauma');
    expect(simoneBox({ ...base, cat: 'outros' }, truthOf(base))).toBe('outros');
    expect(simoneBox(base, { dx: 'Ligação acidental', sev: 'trote', ok: ['TROTE'], prankKind: 'acidental' })).toBe('outros');
    expect(simoneBox(base, { dx: 'Dor', sev: 'verde', ok: ['ORI'] }, 'Linha aberta, ninguém fala.')).toBe('outros');
  });

  it('nota certa = cor certa; nota errada erra a cor na maior parte das vezes (sem sorteio do jogo)', () => {
    let same = 0;
    for (let i = 0; i < 400; i++) {
      expect(noteBoxFor('c' + i, 'go', true)).toBe('go');
      const w = noteBoxFor('c' + i, 'go', false);
      expect(noteBoxFor('c' + i, 'go', false)).toBe(w); // determinístico
      if (w === 'go') same++;
    }
    expect(same / 400).toBeGreaterThan(0.2);
    expect(same / 400).toBeLessThan(0.5);
  });

  it('no plantão: toda ligação com nota tem cor; ligação raw (sem pré-triagem) fica sem post-it', () => {
    const g = Game.create(CONTENT, { gender: 'F', difficulty: 'padrao', seed: 11, startDay: 3 });
    g.newspaper();
    g.beginShift();
    const sh = g.shift!;
    sh.processUntil(hm('18:30'));
    const calls = Object.values(sh.sh.calls).filter((c) => !(c as CallRT & { pendingArrival?: boolean }).pendingArrival);
    expect(calls.length).toBeGreaterThan(3);
    for (const c of calls) {
      if (c.noteText) expect(['clinico', 'go', 'trauma', 'outros']).toContain(c.noteBox);
      if (sh.defOf(c).raw) expect(c.noteText).toBe('');
      // nota certa: a cor é a da caixa do chamado (ou branco, quando ela não sabe)
      if (c.noteText && c.noteRight && !c.followOf) expect(c.noteBox).toBe(simoneBox(sh.defOf(c), sh.truthOf(c), c.noteText));
    }
  });
});

// -----------------------------------------------------------------------------
describe('quadro de cortiça no save', () => {
  it('save antigo: os post-its de texto (flags.postits) viram post-its amarelos', () => {
    const st = newGameState({ gender: 'M', difficulty: 'padrao', seed: 3 });
    st.flags['postits'] = 'Biel = neto do Jairo?\u0001Ligar de volta';
    const c = corkOf(st);
    expect(c.items.map((i) => [i.text, i.color])).toEqual([
      ['Biel = neto do Jairo?', 'amarelo'],
      ['Ligar de volta', 'amarelo'],
    ]);
    expect(st.flags['postits']).toBeUndefined();
    expect(corkOf(st)).toBe(c);
  });

  it('cor, adesivo, mover, tirar e ida e volta pelo save', () => {
    const st = newGameState({ gender: 'F', difficulty: 'padrao', seed: 4 });
    const a = corkAddPostit(st, 'GO: semanas e sangramento', 'rosa')!;
    const b = corkAddSticker(st, 'festa', [0.8, 0.2])!;
    expect(corkAddSticker(st, 'dinossauro')).toBeNull();
    expect(corkAddPostit(st, '   ', 'azul')).toBeNull();
    expect(corkMove(st, a.id, 0.1, 0.9)).toBe(true);
    expect(corkMove(st, 'b:trote_123', 2, -1)).toBe(true); // ficha da central: só a posição
    expect(st.cork!.pos['b:trote_123']).toEqual([1, 0]);
    expect(corkRemove(st, b.id)).toBe(true);
    expect(corkRemove(st, 'b:trote_123')).toBe(false); // ficha da central não sai
    const json = JSON.stringify(st);
    const back = parseSave(json);
    checkSave(back);
    const c = corkOf(back);
    expect(c.items).toEqual([{ id: a.id, kind: 'postit', x: 0.1, y: 0.9, text: 'GO: semanas e sangramento', color: 'rosa' }]);
  });

  it('quadro estragado não impede o save de abrir: o que não serve some', () => {
    const st = newGameState({ gender: 'F', difficulty: 'padrao', seed: 4 });
    (st as unknown as { cork: unknown }).cork = { items: [{ id: 'p1', kind: 'postit', x: 'a', y: 9, text: 'ok', color: 'roxo' }, { kind: 'bomba' }, 7], pos: { 'b:x': [0.5, 0.5], 'd:y': 'z' }, seq: 1 };
    checkSave(parseSave(JSON.stringify(st)));
    const c = corkOf(st);
    expect(c.items).toEqual([{ id: 'p1', kind: 'postit', x: 0.5, y: 1, text: 'ok', color: 'amarelo' }]);
    expect(c.pos).toEqual({ 'b:x': [0.5, 0.5] });
    // cork que não é objeto é recusado pela conferência do save (forma)
    (st as unknown as { cork: unknown }).cork = [1, 2];
    expect(() => checkSave(parseSave(JSON.stringify(st)))).toThrow();
  });

  it('limite de post-its', () => {
    const st = newGameState({ gender: 'F', difficulty: 'padrao', seed: 4 });
    for (let i = 0; i < CORK_MAX_POSTITS; i++) expect(corkAddPostit(st, 'n' + i, 'verde')).not.toBeNull();
    expect(corkAddPostit(st, 'demais', 'verde')).toBeNull();
  });
});

// -----------------------------------------------------------------------------
describe('"piii" e rubricas', () => {
  it('a marcação: 3+ símbolos de quadrinho com algum que não seja "!"', () => {
    expect(hasBleep('sua songamonga retardada, filha de uma #%!#@$')).toBe(true);
    expect(hasBleep('Seu &%$#!')).toBe(true);
    expect(hasBleep('Socorro!!!')).toBe(false);
    expect(hasBleep('R$ 40,00')).toBe(false);
    expect(splitBleeps('Vai #%!#@$ com isso!')).toEqual([{ text: 'Vai ' }, { text: '#%!#@$', bleep: true }, { text: ' com isso!' }]);
    expect('a @#$%&* b #@$%! c'.match(BLEEP_RE)).toEqual(['@#$%&*', '#@$%!']);
  });

  it('na fala: o trecho censurado vira um bipe com a duração da palavra; o resto continua fala', () => {
    const raw = parseText('Sua songamonga, filha de uma #%!#@$!');
    const bl = raw.filter((s) => s.special === 'bleep');
    expect(bl.length).toBe(1);
    expect(bl[0].bleepDur).toBeGreaterThan(0.3);
    expect(raw.filter((s) => !s.special).length).toBeGreaterThan(5);
    const plan = buildPlan(raw, specFor('mulher'), speechSeed('x', 'mulher'));
    const beeps = plan.segs.filter((s) => s.kind === 'beep');
    expect(beeps.length).toBe(1);
    expect(beeps[0]).toMatchObject({ kind: 'beep', f: 1000 });
    // sem censura não há bipe; "!!!" é só ênfase
    expect(parseText('Socorro!!! Corre!').some((s) => s.special === 'bleep')).toBe(false);
    // a rubrica [piii] (caixa postal) também bipa
    expect(parseText('[piii]').some((s) => s.special === 'bleep')).toBe(true);
  });

  it('rubricas: risada só quando é risada ("comprido", "gritos", "criança", "marido", "cachorro" não)', () => {
    for (const r of ['silêncio comprido', 'gritos', 'criança', 'marido', 'irritado', 'sem risco', 'cachorro latindo', 'silêncio absoluto']) expect(rubricEffect(r), r).toBe('pause');
    for (const r of ['risadas', 'ri de nervoso', 'alguém ri perto do telefone', 'gargalhada', 'risadinha', 'rindo']) expect(rubricEffect(r), r).toBe('laugh');
    expect(rubricEffect('chorando')).toBe('sob');
    expect(rubricEffect('soluço')).toBe('sob');
    expect(rubricEffect('tosse')).toBe('cough');
    expect(rubricEffect('respiração rápida')).toBe('breath');
  });
});

// -----------------------------------------------------------------------------
// Folgados no motor
// -----------------------------------------------------------------------------
function synthDay(day: number, calls: CallDef[]): DayDef {
  return { day, title: 'Teste', weekday: '—', newspaper: () => ({ headline: 'Teste', stories: [] }), calls };
}
const SLOT = (id: string, at: string): CallDef => folgadoSlot(id, at);

function simWith(template: string, truth: string, day = 6, seed = 21) {
  const st = newGameState({ gender: 'F', difficulty: 'padrao', seed });
  st.day = day;
  st.manual = CONTENT.manualUntil(day);
  const C: Content = { ...CONTENT, days: { ...CONTENT.days, [day]: synthDay(day, []) } };
  const sim = new ShiftSim(st, C);
  for (const id of Object.keys(sim.sh.calls)) delete sim.sh.calls[id];
  sim.sh.pending = sim.sh.pending.filter((e) => e.kind !== 'arrival');
  const id = `x~${template}.${truth}`;
  sim.addCall(id, 'x', hm('07:05'), gen(template, truth, seed));
  sim.advance(6);
  sim.answer(id);
  return { st, sim, call: sim.sh.calls[id] };
}
const lastCaller = (call: CallRT) => call.lines.filter((l) => l.kind === 'caller').map((l) => l.text);

describe('folgados', () => {
  it('são oito, com etiqueta própria, um por plantão e nunca nos dias pesados', () => {
    expect(FOLGADOS.length).toBe(8);
    for (const t of FOLGADOS) {
      expect(t.tags).toContain('folgado');
      expect(t.once).toBe('folgado');
      expect(t.notDays).toEqual(FOLGADO_NOT_DAYS);
      expect(BANK).toContain(t);
    }
  });

  it('cada verdade "folgada" pede orientação (meios próprios) e tem respostas próprias para as quatro frases de Outros', () => {
    for (const t of FOLGADOS) {
      for (const tr of t.truths) {
        const d = buildGeneratedCall(CONTENT, gen(t.id, tr.id), 'x', 14);
        const tt = truthOf(d);
        for (const k of ['gravada', 'nao_perfil', 'meios_proprios', 'encerrar']) expect(d.q?.[k], `${t.id}.${tr.id} ${k}`).toBeDefined();
        if (d.cat === 'outros') {
          expect(tt.ok, `${t.id}.${tr.id}`).toEqual(['ORI']);
          expect(['verde', 'azul']).toContain(tt.sev);
        }
      }
    }
  });

  it('a 2ª negativa faz o folgado estourar (piii) e "encerro" fecha certo, com alívio cômico', () => {
    const { st, sim, call } = simWith('folgado_uber', 'xinga');
    const desg = st.vars.desgaste;
    const hum = st.vars.humanidade;
    sim.ask('nao_perfil');
    expect(lastCaller(call).some(hasBleep)).toBe(false);
    sim.ask('meios_proprios');
    expect(lastCaller(call).some(hasBleep)).toBe(true);
    sim.ask('encerrar');
    expect(call.decision?.resource).toBe('ORI');
    expect(call.decision?.referral).toBe('UPA');
    expect(call.verdict?.kind).toBe('correto');
    expect(st.vars.desgaste).toBe(Math.max(0, desg - 2));
    expect(st.vars.humanidade).toBe(hum);
  });

  it('"encerro" sem conflito é desligar na cara: custa humanidade', () => {
    const { st, sim, call } = simWith('folgado_exame_marcado', 'entende');
    const hum = st.vars.humanidade;
    sim.ask('encerrar');
    expect(call.decision?.resource).toBe('ORI');
    expect(st.vars.humanidade).toBe(hum - 1);
  });

  it('"gravada" depois do xingamento tem fala própria; mandar viatura é excesso', () => {
    const { sim, call } = simWith('folgado_veterinario', 'xinga');
    sim.ask('meios_proprios');
    sim.ask('nao_perfil');
    sim.ask('gravada');
    expect(lastCaller(call).at(-1)).toMatch(/gravado/);
    const u = sim.availableUnits('USB')[0];
    sim.stamp({ color: 'azul', resource: 'USB', unit: u.id, support: [], dest: 'UPA' });
    expect(call.verdict?.kind).toBe('excesso');
  });

  it('o falso folgado: encerrar o caso real é dispensar emergência', () => {
    const { sim, call } = simWith('folgado_exame_marcado', 'real');
    sim.ask('nao_perfil');
    expect(lastCaller(call).at(-1)).toMatch(/não tá bem/);
    sim.ask('encerrar');
    expect(call.verdict?.kind).toBe('dispensou');
  });

  it('vaga de folgado nos dias: sempre um folgado; nunca nos dias pesados; no máximo um por plantão', () => {
    const slot = SLOT('dx_folgado', '09:00');
    expect(slot.pool).toBe('folgado');
    expect(slot.genOnly).toBe(true);
    const run = (day: number, calls: CallDef[]) => {
      const C: Content = { ...CONTENT, days: { ...CONTENT.days, [day]: synthDay(day, calls) } };
      const g = Game.create(C, { gender: 'F', difficulty: 'padrao', seed: 5, startDay: day });
      g.newspaper();
      g.beginShift();
      return Object.keys(g.shift!.sh.calls);
    };
    const d12 = run(12, [SLOT('a_folgado', '09:00'), { ...SLOT('b_folgado', '11:00') }]);
    const folg = d12.filter((id) => id.includes('~folgado_'));
    expect(folg.length).toBe(1);
    expect(d12.length).toBe(1); // a segunda vaga some (já saiu um folgado)
    const d9 = run(9, [SLOT('a_folgado', '09:00')]);
    expect(d9.length).toBe(0);
  });

  it('com ligações variáveis, um slot "leve" às vezes vira folgado, mas nunca dois no mesmo plantão', () => {
    let some = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const calls: CallDef[] = Array.from({ length: 8 }, (_, i) => ({ ...SLOT(`l${i}`, fmtTime(hm('07:30') + i * 70)), pool: 'leve', genOnly: true, dropIfNoVariant: false, when: undefined }));
      const C: Content = { ...CONTENT, days: { ...CONTENT.days, 14: synthDay(14, calls) } };
      const g = Game.create(C, { gender: 'M', difficulty: 'padrao', seed, startDay: 14, variable: true });
      g.newspaper();
      g.beginShift();
      const n = Object.keys(g.shift!.sh.calls).filter((id) => id.includes('~folgado_')).length;
      expect(n).toBeLessThanOrEqual(1);
      some += n;
    }
    expect(some).toBeGreaterThan(0);
  });
});

// -----------------------------------------------------------------------------
describe('trotes do banco (1.1)', () => {
  it('risada ao fundo só no trote óbvio (metade dos "quarenta pastéis")', () => {
    const laughing: string[] = [];
    for (const t of BANK) {
      for (const tr of t.truths) {
        const d = buildGeneratedCall(CONTENT, gen(t.id, tr.id), 'x', 20);
        if (truthOf(d).sev === 'trote' && d.amb?.includes('risadas')) laughing.push(`${t.id}.${tr.id}`);
      }
    }
    expect(laughing).toEqual(['trote_classico.trote']);
  });

  it('todo trote de verdade responde às perguntas fixas de pulso e pele (ou é linha acidental)', () => {
    for (const t of BANK.filter((x) => x.tags.includes('trote'))) {
      for (const tr of t.truths) {
        const d = buildGeneratedCall(CONTENT, gen(t.id, tr.id), 'x', 20);
        const tt = truthOf(d);
        if (tt.sev !== 'trote' || tt.prankKind === 'acidental') continue;
        expect(d.q?.pulso, `${t.id}.${tr.id} pulso`).toBeDefined();
        expect(d.q?.pele, `${t.id}.${tr.id} pele`).toBeDefined();
      }
    }
  });
});
