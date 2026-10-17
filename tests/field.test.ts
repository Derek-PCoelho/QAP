// Intervenção (plantão extra na ambulância): motor, conteúdo e integração com a casa e o plantão seguinte.
import { describe, it, expect } from 'vitest';
import { CONTENT } from '../src/content/index';
import { FIELD_CASES } from '../src/content/field';
import { FieldSim, createFieldShift, autoPlayField, FIELD_BASE, FIELD_PAY_OK } from '../src/engine/field';
import { HomeSim } from '../src/engine/home';
import { Game } from '../src/engine/game';
import { newGameState } from '../src/engine/state';
import { Rng } from '../src/engine/util';
import type { FieldCaseDef, FieldShift, GameState } from '../src/engine/types';
import { PLACES as DRAWN_PLACES } from '../src/client/art/videoPlace';

// todo lugar usado precisa ter desenho
const PLACES = Object.keys(DRAWN_PLACES);

function state(day = 5, seed = 3): GameState {
  const st = newGameState({ gender: 'F', difficulty: 'padrao', seed, startDay: day } as never);
  st.day = day;
  return st;
}

function single(def: FieldCaseDef): FieldSim {
  const f: FieldShift = { cases: [def.id], idx: 0, phase: 'radio', results: [], clock: [20 * 60], extra: {} };
  return new FieldSim(f, FIELD_CASES, 'padrao');
}

/** joga o caso "de livro": seguro, críticas na ordem com pré-requisitos, destino ideal */
function playPerfect(sim: FieldSim) {
  sim.begin();
  const d = sim.def!;
  const rt = sim.rt!;
  const all = sim.actionsOf(d);
  const run = (id: string) => {
    const r = sim.act(id);
    expect(r.ok, `${d.id}: ${id} (${r.reason ?? ''})`).toBe(true);
    for (let i = 0; i < 200 && rt.busy; i++) sim.tick(0.25);
  };
  if (d.unsafe) run(all.find((a) => a.secures)!.id);
  if (d.prank) {
    run(all.find((a) => a.endsPrank)!.id);
    return;
  }
  const done = new Set<string>();
  const doWithNeeds = (id: string) => {
    const a = all.find((x) => x.id === id)!;
    for (const n of [...(a.needs ?? []), ...(a.after ?? [])]) if (!done.has(n)) doWithNeeds(n);
    if (!done.has(id)) {
      run(id);
      done.add(id);
    }
  };
  for (const c of sim.criticals()) doWithNeeds(c.id);
  expect(rt.stable, `${d.id}: estabilizou`).toBe(true);
  sim.transport(d.dest[0]);
}

/** faz uma ação e espera a equipe terminar */
function doAct(sim: FieldSim, id: string) {
  const r = sim.act(id);
  expect(r.ok, `${id} (${r.reason ?? ''})`).toBe(true);
  for (let i = 0; i < 200 && sim.rt!.busy; i++) sim.tick(0.25);
}

describe('Intervenção: conteúdo', () => {
  it('cada ocorrência é coerente', () => {
    const ids = new Set<string>();
    for (const d of FIELD_CASES) {
      expect(ids.has(d.id), d.id).toBe(false);
      ids.add(d.id);
      expect(PLACES).toContain(d.scene.place);
      if (d.far) expect(PLACES).toContain(d.far.place);
      for (const a of d.actions) if (a.scene?.place) expect(PLACES).toContain(a.scene.place);
      const acts = single(d).actionsOf(d);
      const aids = new Set(acts.map((a) => a.id));
      expect(aids.size, d.id).toBe(acts.length);
      for (const a of acts) for (const n of [...(a.needs ?? []), ...(a.after ?? [])]) expect(aids.has(n), `${d.id}.${a.id} → ${n}`).toBe(true);
      expect(d.radio).toContain('{unit}');
      expect(/SAMU|192/.test(JSON.stringify(d)), d.id).toBe(false);
      if (d.prank) {
        expect(d.actions.some((a) => a.endsPrank)).toBe(true);
        continue;
      }
      expect(d.actions.some((a) => a.kind === 'critico'), d.id).toBe(true);
      expect(d.dest.length, d.id).toBeGreaterThan(0);
      if (d.unsafe) expect(d.actions.some((a) => a.secures) && d.actions.some((a) => a.hurts), d.id).toBe(true);
    }
    expect(FIELD_CASES.filter((c) => !c.special).length).toBeGreaterThanOrEqual(16);
  });

  it('jogando certo, todo paciente chega estável no hospital certo', () => {
    for (const d of FIELD_CASES) {
      const sim = single(d);
      playPerfect(sim);
      const r = sim.f.results[0];
      if (d.prank) expect(r.outcome).toBe('trote');
      else {
        expect(r.outcome, d.id).toBe('estavel');
        expect(r.destOk, d.id).toBe(true);
        expect(r.pay).toBe(FIELD_PAY_OK);
      }
    }
  });

  it('parado, o paciente grave morre; cena insegura fere a equipe', () => {
    const pcr = single(FIELD_CASES.find((c) => c.id === 'pcr_fv')!);
    pcr.begin();
    for (let i = 0; i < 400 && !pcr.rt!.outcome; i++) pcr.tick(0.25);
    expect(pcr.f.results[0].outcome).toBe('obito');

    const bar = single(FIELD_CASES.find((c) => c.id === 'bar_faca')!);
    bar.begin();
    expect(bar.visibleActions().find((a) => a.id === 'compressao')!.state).toBe('bloqueado');
    expect(bar.act('entrar').ok).toBe(true);
    for (let i = 0; i < 40 && bar.rt!.busy; i++) bar.tick(0.25);
    expect(bar.f.results[0].outcome).toBe('equipe_ferida');
  });

  it('dano piora e destino errado rebaixa', () => {
    const iam = single(FIELD_CASES.find((c) => c.id === 'iam_inferior')!);
    iam.begin();
    for (let i = 0; i < 30; i++) iam.tick(0.25);
    const before = iam.rt!.stab;
    iam.act('dinitrato');
    for (let i = 0; i < 40 && iam.rt!.busy; i++) iam.tick(0.25);
    expect(iam.rt!.stab).toBeLessThan(before - 15);
    expect(iam.rt!.harm).toBe(1);

    const avc = single(FIELD_CASES.find((c) => c.id === 'avc')!);
    playPerfect(avc);
    const avc2 = single(FIELD_CASES.find((c) => c.id === 'avc')!);
    avc2.begin();
    for (const id of ['glicemia', 'hora', 'cincinnati']) {
      avc2.act(id);
      for (let i = 0; i < 40 && avc2.rt!.busy; i++) avc2.tick(0.25);
    }
    avc2.transport('UPA');
    expect(avc2.f.results[0].outcome).toBe('instavel');
    expect(avc2.f.results[0].destOk).toBe(false);
  });

  it('sorteio: três ocorrências, trote nunca primeiro, especial entra em segundo', () => {
    for (let s = 1; s < 40; s++) {
      const st = state(8, s);
      const f = createFieldShift(st, FIELD_CASES);
      expect(f.cases.length).toBe(3);
      expect(f.cases[0]).not.toBe('trote_praca');
      expect(new Set(f.cases).size).toBe(3);
    }
    const st = state(1, 2);
    const f = createFieldShift(st, FIELD_CASES, { special: ['parto'], radio: [{ before: 1, who: 'RÁDIO', text: 'oi' }] });
    expect(f.cases[1]).toBe('parto');
    expect(f.extra[1][0].text).toBe('oi');
    // dia 1: nada que comece depois
    for (const id of f.cases) expect(FIELD_CASES.find((c) => c.id === id)!.minDay ?? 1).toBeLessThanOrEqual(1);
  });
});

describe('Intervenção: casa e plantão seguinte', () => {
  it('o "bico" vira o plantão na ambulância, paga, cansa e mostra a cena de casa', () => {
    const st = state(4, 9);
    st.phase = 'casa';
    const h = new HomeSim(st, CONTENT);
    h.start();
    for (let i = 0; i < 50 && st.home!.step === 'pre'; i++) {
      const ch = h.choices().filter((x) => !x.disabled);
      if (ch.length) h.choose(ch[0].idx);
      else h.continueScene();
    }
    expect(st.home!.step).toBe('escolha');
    const money = st.money;
    const wear = st.vars.desgaste;
    h.chooseTimeOff('bico');
    expect(st.home!.step).toBe('intervencao');
    const sim = h.fieldSim()!;
    autoPlayField(sim, 1, new Rng(4));
    expect(sim.f.phase).toBe('fim');
    h.finishField();
    expect(st.home!.step).toBe('cena');
    expect(st.money).toBeGreaterThanOrEqual(money + FIELD_BASE);
    expect(st.vars.desgaste).toBeGreaterThan(wear);
    expect(st.flags['noite_em_claro']).toBe(true);
    expect(st.achievements).toContain('dobra');
    // não paga duas vezes
    const m2 = st.money;
    h.finishField();
    expect(st.money).toBe(m2);
  });

  it('dia 10: o rádio manda a USB para a sua casa no meio da noite', () => {
    const st = state(10, 5);
    st.phase = 'casa';
    const h = new HomeSim(st, CONTENT);
    h.start();
    for (let i = 0; i < 50 && st.home!.step === 'pre'; i++) {
      const ch = h.choices().filter((x) => !x.disabled);
      if (ch.length) h.choose(ch[0].idx);
      else h.continueScene();
    }
    h.chooseTimeOff('bico');
    const f = st.home!.field!;
    expect(f.extra[1]?.length).toBe(2);
    expect(f.extra[1][0].text).toContain('Rua das Acácias, 40');
  });

  it('noite em claro: cochilos no plantão seguinte, acordar custa 1 min, cochilar custa 4', () => {
    const g = Game.create(CONTENT, { gender: 'M', difficulty: 'padrao', seed: 21, startDay: 2 });
    g.st.flags['noite_em_claro'] = true;
    g.newspaper();
    g.beginShift();
    const sh = g.shift!;
    expect(sh.sh.semSono).toBe(true);
    expect(g.st.flags['noite_em_claro']).toBeUndefined();
    expect(sh.sh.pending.filter((e) => e.kind === 'cochilo').length).toBe(3);
    let woke = false;
    let slept = false;
    for (let i = 0; i < 60000 && !(woke && slept) && g.st.phase === 'plantao'; i++) {
      if (g.scene) {
        const ch = g.scene.choices().filter((x) => !x.disabled);
        if (ch.length) g.sceneChoose(ch[0].idx);
        else g.sceneContinue();
        continue;
      }
      for (const m of [...sh.sh.modals]) sh.ackModal(m.id, m.options?.[0]?.id);
      if (sh.sh.cochilo && !woke) {
        const t = sh.sh.time;
        sh.acordar();
        expect(sh.sh.cochilo).toBeUndefined();
        expect(sh.sh.time).toBeGreaterThanOrEqual(t + 1);
        woke = true;
        continue;
      }
      if (sh.sh.cochilo && woke) {
        const before = sh.sh.cochilos ?? 0;
        for (let k = 0; k < 40 && sh.sh.cochilo; k++) g.tick(250);
        expect(sh.sh.cochilos).toBe(before + 1);
        slept = true;
        continue;
      }
      g.tick(250);
    }
    expect(woke && slept).toBe(true);
  });
});
