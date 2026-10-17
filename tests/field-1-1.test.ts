// Intervenção 1.1: rádio (QRR), oxigênio por dispositivo, clopidogrel, leitura de ritmo,
// endereços válidos e a história das noites ("O Sereno").
import { describe, it, expect } from 'vitest';
import { CONTENT } from '../src/content/index';
import { FIELD_CASES } from '../src/content/field';
import { FieldSim, createFieldShift, autoPlayField, storyCases, vitalShown, FIELD_BASE, FIELD_PAY_OK } from '../src/engine/field';
import { resolveAddress } from '../src/engine/city/map';
import { HomeSim } from '../src/engine/home';
import { newGameState } from '../src/engine/state';
import { Rng } from '../src/engine/util';
import type { FieldShift, GameState } from '../src/engine/types';

function state(day = 5, seed = 3): GameState {
  const st = newGameState({ gender: 'F', difficulty: 'padrao', seed, startDay: day } as never);
  st.day = day;
  return st;
}
const byId = (id: string) => FIELD_CASES.find((c) => c.id === id)!;
function started(id: string): FieldSim {
  const f: FieldShift = { cases: [id], idx: 0, phase: 'radio', results: [], clock: [20 * 60], extra: {} };
  const sim = new FieldSim(f, FIELD_CASES, 'padrao');
  sim.begin();
  return sim;
}
/** faz uma ação e espera a equipe terminar */
function doAct(sim: FieldSim, id: string) {
  const r = sim.act(id);
  expect(r.ok, `${id} (${r.reason ?? ''})`).toBe(true);
  for (let i = 0; i < 200 && sim.rt!.busy; i++) sim.tick(0.25);
}

describe('Intervenção 1.1: regras médicas', () => {
  it('a USA sempre sai em QRR 3 e todo endereço existe no mapa', () => {
    for (const d of FIELD_CASES) {
      expect(d.qrr, d.id).toBe(3);
      expect(d.radio, d.id).toContain('QRR 3');
      const r = resolveAddress(d.addr);
      expect(['ok', 'marco'], `${d.id}: ${r.message}`).toContain(r.kind);
    }
  });

  it('"sinais vitais" sempre trazem a saturação', () => {
    for (const d of FIELD_CASES) {
      if (d.prank) continue;
      expect(d.vitals.sat, d.id).toBeDefined();
      const sim = started(d.id);
      if (d.unsafe) doAct(sim, d.actions.find((a) => a.secures)!.id);
      // alguma ação que não é oxigênio mostra a saturação
      const shows = sim.visibleActions().filter((a) => !a.o2 && (a.shows ?? []).some((k) => k === 'sat' || k === 'pa' || k === 'fc'));
      expect(shows.length, d.id).toBeGreaterThan(0);
      for (const n of shows[0].needs ?? []) doAct(sim, n);
      doAct(sim, shows[0].id);
      expect(sim.rt!.shown, d.id).toContain('sat');
    }
  });

  it('hipoglicemia tratada certo, sem abrir a mochila, chega estável e paga inteiro', () => {
    const sim = started('hipoglicemia');
    for (const id of ['glicemia', 'acesso', 'glicose']) doAct(sim, id);
    expect(sim.rt!.done).not.toContain('mochila');
    expect(sim.rt!.stable).toBe(true);
    // ao acordar ele mesmo conta da insulina (a informação não depende da mochila)
    expect(sim.rt!.log.map((l) => l.text).join(' ')).toMatch(/insulina/);
    sim.transport('REG');
    expect(sim.f.results[0]).toMatchObject({ outcome: 'estavel', destOk: true, pay: FIELD_PAY_OK, harm: 0 });
    // liberar em casa continua errado, mas o resultado explica por quê
    expect(byId('hipoglicemia').destNote?.LOCAL).toMatch(/insulina/);
  });

  it('oxigênio é escolha: com saturação normal não é obrigatório; no infarto é erro leve', () => {
    const avc = started('avc');
    expect(avc.criticals().some((a) => a.o2)).toBe(false);
    doAct(avc, 'o2_cateter');
    expect(avc.rt!.harm).toBe(0);
    const iam = started('iam_inferior');
    expect(iam.criticals().some((a) => a.o2)).toBe(false);
    for (let i = 0; i < 40; i++) iam.tick(0.25);
    const before = iam.rt!.stab;
    doAct(iam, 'o2_reservatorio');
    expect(iam.rt!.harm).toBe(1);
    expect(iam.rt!.stab).toBeLessThan(before);
    expect(iam.rt!.stab).toBeGreaterThan(before - 10);
    // intubar quem respira e protege a via aérea é erro
    const avc2 = started('avc');
    doAct(avc2, 'iot');
    expect(avc2.rt!.harm).toBe(1);
  });

  it('DPOC: alvo 88–92%; reservatório dá hipercapnia, Venturi resolve', () => {
    const a = started('dpoc');
    expect(a.criticals().find((x) => x.o2)?.id).toBe('o2_venturi');
    doAct(a, 'o2_reservatorio');
    expect(a.rt!.o2ok).toBe(false);
    expect(a.rt!.harm).toBe(1);
    expect(a.rt!.sat).toBeGreaterThan(92);
    expect(a.rt!.log.map((l) => l.text).join(' ')).toMatch(/sonolento|CO₂/);
    doAct(a, 'o2_venturi');
    expect(a.rt!.o2ok).toBe(true);
    expect(a.rt!.sat).toBeGreaterThanOrEqual(88);
    expect(a.rt!.sat).toBeLessThanOrEqual(92);
    // o dispositivo anterior sai
    expect(a.rt!.done).not.toContain('o2_reservatorio');
    // cateter com pouco fluxo também chega ao alvo
    const b = started('dpoc');
    doAct(b, 'o2_cateter');
    expect(b.rt!.o2ok).toBe(true);
  });

  it('máscaras têm faixas: cateter não basta na asma grave; com 86% só o reservatório', () => {
    const asma = started('asma_crianca');
    doAct(asma, 'o2_cateter');
    expect(asma.rt!.o2ok).toBe(false);
    expect(asma.rt!.o2partial).toBe(true);
    doAct(asma, 'o2_venturi');
    expect(asma.rt!.o2ok).toBe(true);
    const eap = started('noite_rua_errada');
    doAct(eap, 'o2_venturi');
    expect(eap.rt!.o2ok).toBe(false);
    doAct(eap, 'o2_reservatorio');
    expect(eap.rt!.o2ok).toBe(true);
    // trauma grave com choque: o protocolo pede reservatório mesmo com saturação "boa"
    const moto = started('moto_coxa');
    doAct(moto, 'o2_cateter');
    expect(moto.rt!.o2ok).toBe(false);
  });

  it('intubação: indicada em quem não sustenta (Glasgow 7), e as máscaras não resolvem', () => {
    const tce = started('noite_quarenta');
    expect(tce.criticals().find((x) => x.o2)?.id).toBe('iot');
    doAct(tce, 'o2_reservatorio');
    expect(tce.rt!.o2ok).toBe(false);
    doAct(tce, 'iot');
    expect(tce.rt!.o2ok).toBe(true);
    expect(tce.rt!.harm).toBe(0);
  });

  it('infarto: AAS com clopidogrel na dose da idade; nitrato proibido no inferior', () => {
    const inf = byId('iam_inferior');
    const crit = inf.actions.filter((a) => a.kind === 'critico').map((a) => a.id);
    expect(crit).toEqual(expect.arrayContaining(['aas', 'clopi300']));
    expect(inf.actions.find((a) => a.id === 'dinitrato')!.kind).toBe('dano');
    // 61 anos: 75 mg é pouco, mas antiagrega (não trava a estabilização)
    const s = started('iam_inferior');
    doAct(s, 'clopi75');
    expect(s.rt!.done).toContain('clopi300');
    expect(s.visibleActions().some((a) => a.id === 'clopi300' && a.state !== 'feito')).toBe(false);
    // 78 anos: 75 mg é o certo; 300 é erro (conta, mas machuca)
    const cap = byId('noite_capa');
    expect(cap.actions.find((a) => a.id === 'clopi75')!.kind).toBe('critico');
    const s2 = started('noite_capa');
    doAct(s2, 'clopi300');
    expect(s2.rt!.harm).toBe(1);
    expect(s2.rt!.done).toContain('clopi75');
    // no infarto anterior com pressão boa o nitrato pode
    expect(cap.actions.find((a) => a.id === 'dinitrato')!.kind).toBe('ajuda');
  });
});

describe('Intervenção 1.1: parada com leitura de ritmo', () => {
  it('o monitor não diz mais o ritmo nem se é chocável', () => {
    for (const d of FIELD_CASES.filter((c) => c.arrest)) {
      const mon = d.actions.find((a) => a.id === 'monitor')!;
      expect(mon.say, d.id).not.toMatch(/choc[áa]vel|fibrila|taquicardia|assistolia|AESP/i);
      const sim = started(d.id);
      doAct(sim, 'monitor');
      expect(vitalShown(d, sim.rt!, 'ritmo'), d.id).toBe('');
    }
  });

  it('o ritmo varia por caso: FV, TV sem pulso, assistolia e AESP', () => {
    const rhythms = new Set<string>(FIELD_CASES.filter((c) => c.arrest).map((c) => c.arrest!.start));
    for (const r of ['FV', 'TV', 'ASSISTOLIA', 'AESP']) expect(rhythms.has(r), r).toBe(true);
  });

  it('assistolia: choque é erro; CA-GA-DA e adrenalina; o ritmo vira FV e aí sim choque', () => {
    const s = started('pcr_assistolia');
    doAct(s, 'rcp');
    doAct(s, 'monitor');
    expect(s.rt!.rhythm).toBe('ASSISTOLIA');
    doAct(s, 'choque');
    expect(s.rt!.done).not.toContain('choque');
    expect(s.rt!.harm).toBe(1);
    doAct(s, 'cagada');
    doAct(s, 'acesso');
    doAct(s, 'adrenalina');
    expect(s.rt!.rhythm).toBe('FV');
    doAct(s, 'choque');
    expect(s.rt!.stable).toBe(true);
    expect(s.rt!.rhythm).toBe('SINUSAL');
  });

  it('AESP: choque não serve; acha a causa (5H/5T) e trata', () => {
    const s = started('pcr_aesp');
    doAct(s, 'rcp');
    doAct(s, 'monitor');
    doAct(s, 'choque');
    expect(s.rt!.harm).toBe(1);
    doAct(s, 'cagada'); // não é linha reta: só gasta tempo
    expect(s.rt!.done).not.toContain('cagada');
    expect(s.visibleActions().some((a) => a.id === 'magill')).toBe(false);
    doAct(s, 'causas');
    expect(s.visibleActions().some((a) => a.id === 'magill')).toBe(true);
  });

  it('o ritmo muda durante a RCP (FV → AESP → FV → pulso)', () => {
    const s = started('noite_desfecho');
    doAct(s, 'rcp');
    doAct(s, 'monitor');
    expect(s.rt!.rhythm).toBe('FV');
    doAct(s, 'choque');
    expect(s.rt!.rhythm).toBe('AESP');
    doAct(s, 'causas');
    doAct(s, 'acesso');
    doAct(s, 'adrenalina');
    expect(s.rt!.rhythm).toBe('FV');
    doAct(s, 'choque2');
    expect(s.rt!.rhythm).toBe('FV');
    doAct(s, 'amiodarona');
    expect(s.rt!.stable).toBe(true);
    expect(s.rt!.rhythm).toBe('SINUSAL');
  });
});

describe('Intervenção 1.1: a história das noites', () => {
  function playNight(st: GameState) {
    const f = createFieldShift(st, FIELD_CASES);
    const sim = new FieldSim(f, FIELD_CASES, 'padrao');
    autoPlayField(sim, 1, new Rng(st.day));
    for (const r of sim.f.results) st.flags['field_' + r.id] = true;
    Object.assign(st.flags, sim.storyFlags());
    return sim;
  }

  it('um capítulo por noite feita, na ordem, sempre como a última ocorrência', () => {
    const st = state(1, 7);
    const story = storyCases(FIELD_CASES);
    expect(story.length).toBe(7);
    const seen: string[] = [];
    for (let night = 1; night <= 7; night++) {
      st.day = 2 + night; // noites espalhadas, como a pessoa quiser
      const sim = playNight(st);
      const ch = sim.f.story!.chapters;
      expect(ch.length, `noite ${night}`).toBe(1);
      expect(sim.f.cases[sim.f.cases.length - 1]).toBe(ch[0].id);
      expect(sim.f.cases.some((id) => byId(id).prank)).toBe(false);
      seen.push(ch[0].id);
      expect(st.flags['noites_intervencao']).toBe(night);
      expect(st.flags['noite_cap' + ch[0].chapter]).toBe(true);
      expect(sim.epilogue().length, `noite ${night}`).toBeGreaterThan(0);
    }
    expect(seen).toEqual(story.map((c) => c.id));
    expect(st.flags['noite_desfecho']).toBe(true);
    expect(st.flags['noite_anselmo_vivo']).toBe(true);
    // depois do desfecho: noite comum, com uma fala solta da cidade
    st.day = 12;
    const after = createFieldShift(st, FIELD_CASES);
    expect(after.story!.chapters.length).toBe(0);
    expect((after.extra[0] ?? []).length).toBe(1);
  });

  it('quem começa tarde ganha dois capítulos por noite e ainda vê o desfecho até o dia 19', () => {
    const st = state(15, 3);
    for (let d = 15; d <= 19; d++) {
      st.day = d;
      playNight(st);
    }
    expect(st.flags['noite_desfecho']).toBe(true);
  });

  it('não estraga o dia 18: antes dele o Bené não confessa; depois, sim', () => {
    const run = (day: number, flags: Record<string, boolean> = {}) => {
      const st = state(day, 5);
      Object.assign(st.flags, flags);
      for (const c of storyCases(FIELD_CASES).slice(0, 5)) st.flags['field_' + c.id] = true;
      const sim = playNight(st);
      expect(sim.f.story!.chapters[0].id).toBe('noite_quarenta');
      return sim.epilogue().map((l) => l.text).join(' ');
    };
    expect(run(12)).not.toMatch(/Fui eu/);
    expect(run(18)).toMatch(/Fui eu/);
    // quem regulava em 2019 só aparece depois que o almoço do dia 18 contou
    expect(run(12)).not.toMatch(/era o Henrique/);
    expect(run(18)).not.toMatch(/era o Henrique/);
    expect(run(18, { guardou_2019: true })).toMatch(/era o Henrique/);
  });

  it('o desfecho muda com o que acontece na pastelaria', () => {
    const st = state(12, 5);
    for (const c of storyCases(FIELD_CASES).slice(0, 6)) st.flags['field_' + c.id] = true;
    const f = createFieldShift(st, FIELD_CASES);
    const sim = new FieldSim(f, FIELD_CASES, 'padrao');
    // joga as avulsas direito e abandona a parada do Seu Anselmo
    let guard = 0;
    while (sim.f.phase !== 'fim' && guard++ < 50) {
      if (sim.f.phase === 'radio') sim.begin();
      else if (sim.f.phase === 'resultado') sim.next();
      else if (sim.def!.id === 'noite_desfecho') for (let i = 0; i < 800 && sim.f.phase === 'cena'; i++) sim.tick(0.25);
      else {
        const d = sim.def!;
        for (const c of sim.criticals()) {
          for (const n of [...(c.needs ?? []), ...(c.after ?? [])]) if (!sim.rt!.done.includes(n)) doAct(sim, n);
          if (!sim.isDone(c)) doAct(sim, c.id);
        }
        sim.transport(d.dest[0]);
      }
    }
    expect(sim.storyFlags()['noite_anselmo_morreu']).toBe(true);
    expect(sim.epilogue().map((l) => l.text).join(' ')).toMatch(/ninguém ficou sozinho/);
  });

  it('na campanha: a noite grava as marcas da história em st.flags', () => {
    const st = state(4, 9);
    st.phase = 'casa';
    const h = new HomeSim(st, CONTENT);
    h.start();
    for (let i = 0; i < 50 && st.home!.step === 'pre'; i++) {
      const ch = h.choices().filter((x) => !x.disabled);
      if (ch.length) h.choose(ch[0].idx);
      else h.continueScene();
    }
    h.chooseTimeOff('bico');
    const sim = h.fieldSim()!;
    expect(sim.f.cases).toContain('noite_capa');
    autoPlayField(sim, 1, new Rng(4));
    h.finishField();
    expect(st.flags['noites_intervencao']).toBe(1);
    expect(st.flags['field_noite_capa']).toBe(true);
    expect(st.flags['noite_cap1']).toBe(true);
  });

  it('a noite continua pagando o mesmo (R$ 140 a 215) e jogando certo paga tudo', () => {
    for (let s = 1; s < 15; s++) {
      const st = state(6, s);
      const sim = playNight(st);
      const sum = sim.summary();
      expect(sum.pay, `semente ${s}`).toBe(FIELD_BASE + 3 * FIELD_PAY_OK);
    }
  });
});
