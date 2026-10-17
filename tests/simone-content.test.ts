// Campanha 2 ("Simone"): validação estática e dinâmica do conteúdo.
import { describe, it, expect } from 'vitest';
import { CONTENT } from '../src/content/index';
import { SIMONE } from '../src/content/simone/index';
import { pesoLista, statusEmprego } from '../src/content/simone/days14_20';
import { newGameState, makeCtx, makeEffCtx } from '../src/engine/state';
import { resolveTokens, txt } from '../src/engine/text';
import { hm } from '../src/engine/util';
import { Game } from '../src/engine/game';
import { colorFor } from '../src/engine/grading';
import type { Ctx, GameState, SceneDef, CallRT, Color, Gender } from '../src/engine/types';
import type { SimoneWorld } from '../src/engine/content-api';

const SPEAKERS = new Set(['NARRADOR', 'SIMONE', 'WESLEY', 'BENE', 'PEIXOTO', 'HENRIQUE', 'ROSE', 'CARLA', 'CIDA', 'VIZINHA']);
const BRACE = /\{(?!\{)[^{}]*\}/;

type Flags = Record<string, boolean | number | string>;
function estado(day: number, g: Gender, flags: Flags = {}, vars: Partial<GameState['vars']> = {}, sombra: Flags = {}, keys: GameState['keys'] = {}): GameState {
  const st = newGameState({ gender: g, difficulty: 'padrao', mode: 'simone', seed: 3 });
  st.day = day;
  st.flags = { ...flags };
  Object.assign(st.vars, { pressao: 5, wesley: 5, emprego: 6, desgaste: 30 }, vars);
  const sh = newGameState({ gender: g, difficulty: 'padrao', mode: 'simone', seed: 4 });
  sh.day = day;
  sh.flags = { ...sombra };
  sh.keys = { ...keys };
  st.shadow = sh;
  return st;
}

/** contextos que cobrem os ramos principais (flags da Simone e do mundo-sombra) */
function contextos(day: number): GameState[] {
  const muitos: Flags = {
    postit_h: 3, postit_h1: true, postit_h2: true, sd2_8877: true, capacete_bom: true, conheceu_edinho: true, receita_nova: true, sd7_desfecho: 'viatura', sd7_noite: 'cadeira',
    sd9_mesa: 'henrique', sd9_marcia: 'vivo', sd11_yuri: 'vivo', sd12: 'falou', sd14_fonte: true, sd15_bene: true, rose_yasmin: true, sd16_cida_sinal: true, sd17_cida_sinal: true,
    sd16_avisou_peixoto: true, wesley_feira: true, falou_futuro: true, bolo_bene: true, bolo_feito: true, promessa_remedio: true, sd17_crise: 'central', emprego_status: 'supervisora',
  };
  const outros: Flags = {
    sem_remedio_seq: 3, sd7_desfecho: 'dispensado', sd7_cor: 'verde', sd9_mesa: 'moura', sd9_marcia: 'morto', sd11_yuri: 'noturno', sd12: 'mentiu', sd14_recusou: true,
    parcela_atrasada: true, wesley_voltou_moto: true, voltou_escondido: true, sd17_continuou: true, sd17_sem_comprimido: true, bolo_bene: true, bolo_sem_ingredientes: true, bolo_gratis: true, emprego_status: 'demitida',
  };
  const out: GameState[] = [];
  for (const g of ['M', 'F'] as const) {
    out.push(estado(day, g));
    out.push(estado(day, g, muitos, { pressao: 3, wesley: 9, emprego: 10 }, { denunciou_henrique: true, materia_forte: true, peixoto_caiu: true, bombinha: true }, { osvaldo: 'salvo', cida: 'salvo' }));
    out.push(estado(day, g, outros, { pressao: 10, wesley: 2, emprego: 3, desgaste: 95 }, { encobriu_henrique: true, noturno_obito_d11_dengue_grave: true }, { osvaldo: 'perdido', cida: 'perdido' }));
  }
  return out;
}

const chamada = (def: string, o: Partial<CallRT>): CallRT => ({
  id: def, def, day: 1, status: 'encerrada', arrived: 0, realSec: 0, lines: [], asked: [], unlocked: [],
  patience: 0, worsenIdx: 0, noteRight: true, noteText: '', units: [], outcome: 'salvo', calmed: 0, holdCount: 0, ...o,
});
const mundo = (padrao: Partial<CallRT> | null): SimoneWorld => ({
  call: (id) => (padrao ? chamada(id, padrao) : undefined),
  shadowFlag: () => undefined,
  time: hm('12:00'),
  passed: 3,
});
const MUNDOS: SimoneWorld[] = [
  mundo(null),
  mundo({ status: 'encerrada', outcome: 'salvo', tarm: { color: 'amarelo', priority: true, to: 'moura', at: 0, handle: 10, realSec: 0 }, decision: { color: 'amarelo', resource: 'USB', unit: 'USB01', support: [], t: 0, realSec: 0 } }),
  mundo({ status: 'encerrada', outcome: 'obito', tarm: { color: 'verde', priority: false, to: 'henrique', at: 0, handle: 10, realSec: 0 }, decision: { color: 'verde', resource: 'ORI', support: [], t: 0, realSec: 0 } }),
  mundo({ status: 'noturno', outcome: 'transportado', tarm: { color: 'vermelho', priority: true, to: 'moura', at: 0, handle: 10, realSec: 0 } }),
  mundo({ status: 'fila', outcome: 'pendente' }),
];

/** percorre a cena: nós, saltos, falantes, tokens, condições e efeitos (num clone do estado) */
function validaCena(onde: string, sc: SceneDef, st: GameState, erros: string[]) {
  const c: Ctx = makeCtx(st);
  if (!sc.nodes.start) erros.push(`${onde}: ${sc.id} sem nó start`);
  for (const [k, n] of Object.entries(sc.nodes)) {
    const w = `${onde}: ${sc.id}.${k}`;
    if (n.next && !sc.nodes[n.next]) erros.push(`${w} next "${n.next}" inexistente`);
    for (const ch of n.choices ?? []) {
      if (ch.next && !sc.nodes[ch.next]) erros.push(`${w} escolha → "${ch.next}" inexistente`);
      const label = resolveTokens(txt(ch.label, c), st.gender, st);
      if (BRACE.test(label)) erros.push(`${w} token não resolvido na escolha: ${label}`);
      if (ch.when) ch.when(c);
      if (ch.effect) {
        const clone: GameState = JSON.parse(JSON.stringify(st));
        ch.effect(makeEffCtx(clone));
      }
    }
    if (n.onEnter) {
      const clone: GameState = JSON.parse(JSON.stringify(st));
      n.onEnter(makeEffCtx(clone));
    }
    for (const l of n.lines) {
      if (!SPEAKERS.has(l.who)) erros.push(`${w} falante desconhecido "${l.who}"`);
      if (l.when) l.when(c);
      const t = resolveTokens(txt(l.t, c), st.gender, st);
      if (!t.trim()) erros.push(`${w} fala vazia`);
      if (BRACE.test(t)) erros.push(`${w} token não resolvido: ${t.slice(0, 80)}`);
    }
  }
}

describe('campanha da Simone: conteúdo', () => {
  it('tem os 20 dias, cada um com noite', () => {
    for (let d = 1; d <= 20; d++) {
      const def = SIMONE.days[d];
      expect(def, `dia ${d}`).toBeTruthy();
      expect(def.day).toBe(d);
      expect(typeof def.night).toBe('function');
    }
  });

  it('cenas (manhã, eventos, fim de turno e noite) são válidas em todos os ramos', () => {
    const erros: string[] = [];
    for (let d = 1; d <= 20; d++) {
      const def = SIMONE.days[d];
      for (const st of contextos(d)) {
        const c = makeCtx(st);
        const m = def.morning?.(c);
        if (m) validaCena(`D${d} manhã`, m, st, erros);
        validaCena(`D${d} noite`, def.night(c), st, erros);
        for (const w of MUNDOS) {
          const ev = def.evening?.(c, w);
          if (ev) validaCena(`D${d} fim`, ev, st, erros);
          (def.events ?? []).forEach((e, i) => {
            if (e.when) e.when(c, w);
            validaCena(`D${d} evento ${i}`, e.scene(c, w), st, erros);
            e.out?.(c, w);
          });
        }
        if (def.newspaper) def.newspaper(c);
      }
    }
    if (erros.length) console.log(erros.slice(0, 20));
    expect(erros).toEqual([]);
  });

  it('eventos: horários válidos e onCall aponta para uma ligação do dia original', () => {
    for (let d = 1; d <= 20; d++) {
      const calls = new Map(CONTENT.days[d].calls.map((x) => [x.id, x]));
      for (const e of SIMONE.days[d].events ?? []) {
        expect(e.at, `D${d}`).toMatch(/^\d\d:\d\d$/);
        if (e.until) expect(hm(e.until)).toBeGreaterThan(hm(e.at));
        if (e.onCall) {
          const call = calls.get(e.onCall);
          expect(call, `D${d} onCall ${e.onCall}`).toBeTruthy();
          expect(hm(e.at), `D${d} ${e.onCall}: 'at' depois da chegada`).toBeLessThanOrEqual(hm(call!.at));
          expect(call!.special, `D${d} ${e.onCall} não pode ser pulada na campanha 2`).not.toBe('simone');
        }
      }
    }
  });

  it('contas: ids únicos, valores válidos, remédio sempre por último', () => {
    for (let d = 1; d <= 20; d++) {
      for (const st of contextos(d)) {
        const c = makeCtx(st);
        const defs = [...SIMONE.baseBills(c), ...(SIMONE.days[d].bills ?? [])].filter((b) => !b.when || b.when(c));
        const ids = defs.map((b) => b.id);
        expect(new Set(ids).size, `D${d} ids repetidos: ${ids.join(',')}`).toBe(ids.length);
        for (const b of defs) {
          const v = typeof b.amount === 'function' ? b.amount(c) : b.amount;
          expect(v, `D${d} ${b.id}`).toBeGreaterThanOrEqual(0);
          expect(BRACE.test(b.label)).toBe(false);
        }
        expect(ids[ids.length - 1].startsWith('remedio'), `D${d}: ${ids.join(',')}`).toBe(true);
      }
    }
  });

  it('a lista do dia 18: congelada, a Tati na lista, ou a Simone na lista', () => {
    const ev = SIMONE.days[18].events!.find((e) => e.at === '12:00')!;
    const w = MUNDOS[0];
    const nos = (st: GameState) => {
      const sc = ev.scene(makeCtx(st), w);
      const c = makeCtx(st);
      return (sc.nodes.start.choices ?? []).filter((ch) => !ch.when || ch.when(c)).map((ch) => ch.next);
    };
    // A: matéria forte → corte congelado, convite de supervisora
    expect(nos(estado(18, 'M', {}, { emprego: 8 }, { materia_forte: true }))).toEqual(['aceitou', 'recusou']);
    expect(nos(estado(18, 'M', {}, { emprego: 4 }, { materia_forte: true }))).toEqual([]);
    // B: a Tati na lista (planilha excelente)
    const tati = estado(18, 'F', {}, { emprego: 10 });
    expect(pesoLista(makeCtx(tati))).toBeGreaterThanOrEqual(1);
    expect(nos(tati)).toEqual(['assinou', 'naoassinou', 'tati']);
    // B: a Simone na lista; a Rose segura se a Simone achou a Yasmin
    const simone = estado(18, 'F', { rose_yasmin: true, sd17_crise: 'central' }, { emprego: 8 });
    expect(pesoLista(makeCtx(simone))).toBeLessThan(1);
    expect(nos(simone)).toEqual(['assinou', 'demitida', 'adiada']);
    expect(nos(estado(18, 'F', {}, { emprego: 5 }))).toEqual(['assinou', 'demitida']);
    // o Peixoto tira o nome dela se o pai sobreviveu e ela avisou
    const peixoto = estado(18, 'M', { sd16_avisou_peixoto: true }, { emprego: 6 }, {}, { osvaldo: 'salvo' });
    expect(pesoLista(makeCtx(peixoto))).toBeGreaterThanOrEqual(1);
    // sem a cena (fallback do final)
    expect(statusEmprego(makeCtx(estado(20, 'M', {}, { emprego: 10 }, { materia_forte: true })))).toBe('fica');
    expect(statusEmprego(makeCtx(estado(20, 'M', {}, { emprego: 5 })))).toBe('demitida');
  });

  it('finais: regras e textos', () => {
    const caso = (flags: Flags, vars: Partial<GameState['vars']>, sombra: Flags = {}) => {
      const st = estado(20, 'F', flags, vars, sombra, { cida: 'salvo' });
      return SIMONE.ending(makeCtx(st));
    };
    expect(caso({ emprego_status: 'assinou' }, { wesley: 9, pressao: 3 }).kind).toBe('secreto');
    expect(caso({ emprego_status: 'demitida' }, { wesley: 9, pressao: 3 }).kind).toBe('ruim');
    expect(caso({ emprego_status: 'supervisora' }, { wesley: 2, pressao: 3 }).kind).toBe('ruim');
    expect(caso({ emprego_status: 'supervisora' }, { wesley: 8, pressao: 9 }).kind).toBe('ruim');
    expect(caso({ emprego_status: 'supervisora' }, { wesley: 8, pressao: 5 }, { peixoto_caiu: true }).kind).toBe('bom');
    expect(caso({ emprego_status: 'fica_fone' }, { wesley: 8, pressao: 5 }).kind).toBe('normal');
    expect(caso({ emprego_status: 'adiada' }, { wesley: 6, pressao: 7 }).kind).toBe('normal');
    for (const g of ['M', 'F'] as const) {
      for (const st of contextos(20).map((s) => ({ ...s, gender: g }))) {
        const e = SIMONE.ending(makeCtx(st));
        expect(e.lines.length).toBeGreaterThanOrEqual(7);
        expect(e.lines.length).toBeLessThanOrEqual(13);
        const ids = e.threads.map((t) => t.id);
        expect(new Set(ids).size).toBe(ids.length);
        for (const t of [...e.lines, ...e.threads.map((x) => x.text)]) {
          const r = resolveTokens(t, g, st);
          expect(r.trim().length).toBeGreaterThan(0);
          expect(BRACE.test(r), r).toBe(false);
        }
      }
    }
    // toda variante do final ruim fica entre 6 e 12 parágrafos, e o epílogo não contradiz a saúde
    const ruins: [Flags, Partial<GameState['vars']>, GameState['keys']][] = [
      [{ emprego_status: 'demitida' }, { wesley: 9, pressao: 3 }, { cida: 'salvo' }],
      [{ emprego_status: 'demitida' }, { wesley: 1, pressao: 9 }, { cida: 'perdido' }],
      [{ emprego_status: 'demitida' }, { wesley: 8, pressao: 4 }, {}],
      [{ emprego_status: 'supervisora' }, { wesley: 8, pressao: 10 }, {}],
      [{ emprego_status: 'supervisora' }, { wesley: 1, pressao: 9 }, {}],
      [{ emprego_status: 'fica_fone' }, { wesley: 1, pressao: 4 }, {}],
      [{ emprego_status: 'adiada' }, { wesley: 2, pressao: 8 }, {}],
    ];
    for (const [f, v, k] of ruins) {
      const e = SIMONE.ending(makeCtx(estado(20, 'F', f, v, {}, k)));
      expect(e.kind).toBe('ruim');
      expect(e.lines.length, e.lines[0]).toBeGreaterThanOrEqual(7);
      expect(e.lines.length, e.lines[0]).toBeLessThanOrEqual(13);
      const corpo = e.lines.join(' ');
      if ((v.pressao ?? 5) <= 6) expect(corpo).not.toMatch(/peito aperta|nuca pesa/);
      if ((v.wesley ?? 5) > 2) expect(corpo).not.toMatch(/Sinop|sozinha na casa/);
    }
  });

  it('game overs têm texto', () => {
    const c = makeCtx(estado(10, 'M'));
    const c2 = makeCtx(estado(10, 'M', { simone_colapso: true }));
    for (const f of [SIMONE.gameover.exonerado(c), SIMONE.gameover.colapso(c), SIMONE.gameover.colapso(c2), SIMONE.gameover.despejo(c)]) {
      expect(f.length).toBeGreaterThanOrEqual(4);
      for (const l of f) expect(BRACE.test(l)).toBe(false);
    }
    // antes do D7 o Wesley ainda não quebrou a perna
    const cedo = makeCtx(estado(3, 'F', { simone_colapso: true }));
    for (const f of [SIMONE.gameover.exonerado(cedo), SIMONE.gameover.colapso(cedo), SIMONE.gameover.despejo(cedo)]) expect(f.join(' ')).not.toMatch(/muleta/);
  });

  it('a ligação da própria Simone (D17, 13:00) não entra na fila da TARM', () => {
    const g = Game.createSimone(CONTENT, { gender: 'F', difficulty: 'padrao', seed: 9, startDay: 17 });
    g.beginShift();
    const defs = Object.values(g.shift!.sh.calls).map((x) => x.def);
    expect(defs).not.toContain('d17_simone');
  });
});

// -----------------------------------------------------------------------------
// integração: um bot que nunca se mexe pela matéria e assina a escala chega ao final secreto
// -----------------------------------------------------------------------------
function joga(seed: number, escolhe: (labels: string[]) => number) {
  const g = Game.createSimone(CONTENT, { gender: 'M', difficulty: 'padrao', seed });
  let guard = 0;
  while (guard++ < 400000) {
    const st = g.st;
    if (st.phase === 'final' || st.phase === 'gameover') break;
    if (st.phase === 'jornal') {
      g.beginShift();
      continue;
    }
    if (g.scene) {
      const ch = g.scene.choices().filter((x) => !x.disabled);
      if (ch.length) g.sceneChoose(ch[escolhe(ch.map((x) => x.label))].idx);
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
      g.finishNight(g.nightBills().map((b) => b.id));
      continue;
    }
    const sh = g.shift!;
    const act = sh.active();
    if (!act) {
      const q = sh.queue();
      if (q.length) sh.answer(q[0].id);
      else g.tick(1000);
      continue;
    }
    g.tick(1000);
    if (g.scene || act.status !== 'ativa') continue;
    if (act.asked.length < 2) {
      const qs = sh.questions(act).filter((x) => !x.asked && x.group !== 'acalmar' && x.id !== 'callback');
      if (qs.length) {
        sh.ask(qs[0].id);
        continue;
      }
    }
    const color: Color = colorFor(sh.truthOf(act).sev);
    sh.tarmPass(color, color === 'vermelho', 'moura');
  }
  return g;
}

describe('campanha da Simone: caminhos completos', () => {
  it('quem assina a escala chega ao final secreto', () => {
    const g = joga(21, (ls) => {
      const i = ls.findIndex((l) => /^Assinar/.test(l));
      return i >= 0 ? i : ls.length - 1;
    });
    expect(g.st.phase).toBe('final');
    expect(g.st.ending?.kind).toBe('secreto');
  });
  it('quem cuida da saúde, da matéria e do Wesley pode chegar ao final bom', () => {
    const g = joga(22, (ls) => {
      const pref = [/UBS/, /Fala com ela, Bené/, /Contar do TMA/, /Aceito/, /prometer/i, /capacete bom/, /Respirar/, /Parar\./, /sem celular/i, /Ligar pro celular da Rose/, /ramal da coordenação/];
      for (const re of pref) {
        const i = ls.findIndex((l) => re.test(l));
        if (i >= 0) return i;
      }
      const dormir = ls.findIndex((l) => /[Dd]ormir|[Dd]eitar|sofá/.test(l));
      return dormir >= 0 ? dormir : 0;
    });
    expect(g.st.phase).toBe('final');
    expect(g.st.ending?.kind).toBe('bom');
  });
});
