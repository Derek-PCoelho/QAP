// Regressões encontradas na revisão de QA antes do playtest (save/load, Intervenção, colapso,
// conquistas, recorde do Infinito, conteúdo).
import { describe, it, expect, beforeAll } from 'vitest';
import { CONTENT } from '../src/content/index';
import { FIELD_CASES } from '../src/content/field';
import { buildVideo } from '../src/content/video';
import { FieldSim, autoPlayField } from '../src/engine/field';
import { Game } from '../src/engine/game';
import { newGameState, makeCtx } from '../src/engine/state';
import { Rng } from '../src/engine/util';
import { resolveTokens } from '../src/engine/text';
import { colorFor } from '../src/engine/grading';
import type { CallDef, FieldShift, Resource } from '../src/engine/types';

// ---------------------------------------------------------------------------
// driver mínimo e determinístico (só depende do estado do jogo)
// ---------------------------------------------------------------------------
function step(g: Game): boolean {
  const st = g.st;
  if (st.phase === 'jornal') {
    g.newspaper();
    g.beginShift();
  } else if (st.phase === 'plantao') {
    if (g.scene) {
      const ch = g.scene.choices().filter((x) => !x.disabled);
      if (ch.length) g.sceneChoose(ch[0].idx);
      else g.sceneContinue();
      return true;
    }
    const sh = g.shift!;
    for (const m of [...sh.sh.modals]) sh.ackModal(m.id, m.options?.[0]?.id);
    for (const r of [...sh.sh.requests]) sh.answerRequest(r.id, r.options[0].id);
    if (sh.sh.guideCallId) sh.finishGuide(0.8, true);
    else if (sh.sh.cochilo) sh.acordar();
    else if (!sh.sh.activeId) {
      const q = sh.queue();
      if (q.length) sh.answer(q[0].id);
    } else {
      const call = sh.active()!;
      if (call.status === 'ativa' && !call.decision) {
        const t = sh.truthOf(call);
        for (const q of t.must ?? []) sh.ask(q);
        const def = sh.defOf(call);
        if (sh.active()?.id === call.id && !def.mci) {
          let res: Resource = t.best ?? t.ok[0];
          if ((res === 'USA' || res === 'USB') && !sh.availableUnits(res).length) res = sh.availableUnits().length ? sh.availableUnits()[0].type : 'ORI';
          const r = sh.stamp({ color: colorFor(t.sev), resource: res, support: [...(t.sup ?? [])], dest: res === 'USA' || res === 'USB' ? t.dest?.[0] ?? 'REG' : undefined, referral: res === 'ORI' ? t.ref?.[0] ?? 'UBS' : undefined });
          if (!r.ok) sh.stamp({ color: colorFor(t.sev), resource: 'ORI', support: [], referral: 'UBS' });
        } else if (def.mci) sh.hold();
      }
    }
    g.tick(250);
  } else if (st.phase === 'relatorio') {
    const f = g.reportField();
    if (f && !st.flags['report_' + f.id]) g.chooseReportField(f.options[0].id);
    if (st.gameOver) g.setPhase('gameover');
    else g.toHome();
  } else if (st.phase === 'casa') {
    const h = g.home!;
    const s = st.home!.step;
    if (s === 'pre' || s === 'cena') {
      const ch = h.choices().filter((x) => !x.disabled);
      if (ch.length) h.choose(ch[0].idx);
      else h.continueScene();
    } else if (s === 'escolha') h.chooseTimeOff(h.canBico() ? 'bico' : 'descanso');
    else if (s === 'intervencao') {
      autoPlayField(h.fieldSim()!, 1, new Rng(st.day));
      h.finishField();
    } else if (s === 'contas') {
      if (!h.payBills(h.bills().filter((b) => !b.auto).map((b) => b.id)).ok) h.payBills([]);
    } else g.finishHome();
  } else return false;
  return true;
}

/** fronteiras: o save guarda o estado como está (fora delas, volta ao começo do trecho) */
function boundary(g: Game): boolean {
  const p = g.st.phase;
  const s = g.st.home?.step;
  return p === 'jornal' || p === 'relatorio' || (p === 'casa' && (s === 'escolha' || s === 'contas' || s === 'loja'));
}

/** JSON canônico, sem carimbo de hora */
function norm(st: unknown): string {
  const sort = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(sort);
    if (v && typeof v === 'object') {
      const o: Record<string, unknown> = {};
      for (const k of Object.keys(v as object).sort()) if (k !== 'lastSave' && k !== 'playSeconds') o[k] = sort((v as Record<string, unknown>)[k]);
      return o;
    }
    return v;
  };
  return JSON.stringify(sort(JSON.parse(JSON.stringify(st))));
}

describe('save/load', () => {
  it('recarregar em toda fronteira não muda nada (com noite na ambulância e cochilos no dia seguinte)', () => {
    const A = Game.create(CONTENT, { gender: 'F', difficulty: 'padrao', seed: 4242, startDay: 3 });
    let B = Game.load(CONTENT, A.serialize());
    let reloads = 0;
    let semSono = false;
    for (let i = 0; i < 60000 && A.st.day <= 5 && A.st.phase !== 'gameover'; i++) {
      step(A);
      step(B);
      if (A.shift?.sh.semSono) semSono = true;
      const b = boundary(B);
      if (b || i % 50 === 0) expect(norm(B.st), `passo ${i}, ${A.st.phase} D${A.st.day}`).toBe(norm(A.st));
      if (b) {
        B = Game.load(CONTENT, B.serialize());
        reloads++;
      }
    }
    expect(semSono).toBe(true);
    expect(reloads).toBeGreaterThan(5);
  });

  it('save no meio do plantão e da Intervenção volta ao começo do trecho e rejoga igual', () => {
    const A = Game.create(CONTENT, { gender: 'M', difficulty: 'padrao', seed: 99, startDay: 4 });
    const saves: { data: string; target: number }[] = [];
    const targets: string[] = [];
    let wasB = true;
    for (let i = 0; i < 40000 && A.st.day <= 5 && A.st.phase !== 'gameover'; i++) {
      step(A);
      const b = boundary(A);
      if (b && !wasB) targets.push(norm(A.st));
      if (!b && (A.st.phase === 'plantao' || A.st.home?.step === 'intervencao') && i % 397 === 0) saves.push({ data: A.serialize(), target: targets.length });
      wasB = b;
    }
    expect(saves.length).toBeGreaterThan(3);
    for (const sv of saves) {
      const C = Game.load(CONTENT, sv.data);
      let left = !boundary(C);
      for (let k = 0; k < 40000; k++) {
        step(C);
        if (!boundary(C)) left = true;
        else if (left) break;
      }
      // conquistas ganhas no trecho ficam no save (de propósito): na reprodução não há o aviso de novo
      const strip = (x: string) => {
        const o = JSON.parse(x);
        delete o.achievements;
        if (o.shift) {
          o.shift.toasts = o.shift.toasts.filter((t: { text: string }) => !t.text.startsWith('Conquista:')).map((t: { text: string }) => t.text);
          delete o.shift.toastSeq;
        }
        return JSON.stringify(o);
      };
      expect(strip(norm(C.st))).toBe(strip(targets[sv.target]));
    }
  });
});

// ---------------------------------------------------------------------------
describe('desgaste 100 fora do plantão', () => {
  it('a noite na ambulância que leva a 100 é colapso no fim da casa, não no meio do dia seguinte', () => {
    const g = Game.create(CONTENT, { gender: 'F', difficulty: 'padrao', seed: 77, startDay: 4 });
    for (let i = 0; i < 30000 && g.st.phase !== 'casa'; i++) step(g);
    for (let i = 0; i < 50 && g.st.home!.step === 'pre'; i++) step(g);
    g.st.vars.desgaste = 79;
    const h = g.home!;
    expect(h.canBico()).toBe(true);
    h.chooseTimeOff('bico');
    const sim = h.fieldSim()!;
    // ninguém faz nada: os graves morrem (+4 de desgaste cada)
    for (let i = 0; i < 100000 && sim.f.phase !== 'fim'; i++) {
      if (sim.f.phase === 'radio') sim.begin();
      else if (sim.f.phase === 'resultado') sim.next();
      else if (sim.def!.prank) sim.act(sim.def!.actions.find((a) => a.endsPrank)!.id);
      else if (!sim.rt!.secured && !sim.rt!.busy) sim.act(sim.def!.actions.find((a) => a.secures)!.id);
      sim.tick(0.25);
    }
    h.finishField();
    expect(g.st.vars.desgaste).toBe(100);
    for (let i = 0; i < 200 && g.st.phase === 'casa'; i++) step(g);
    expect(g.st.phase).toBe('gameover');
    expect(g.st.gameOver?.kind).toBe('colapso');
    expect(g.st.gameOver?.day).toBe(4);
    expect(g.st.gameOver?.text).toContain('COLAPSO');
  });
});

// ---------------------------------------------------------------------------
describe('Intervenção: liberar no local', () => {
  const single = (id: string) => {
    const f: FieldShift = { cases: [id], idx: 0, phase: 'radio', results: [], clock: [1200], extra: {} };
    const sim = new FieldSim(f, FIELD_CASES, 'padrao');
    sim.begin();
    return sim;
  };
  it('paciente que precisava de hospital, sem estabilizar, não sai "vivo" de casa', () => {
    for (const d of FIELD_CASES) {
      if (d.prank || d.dest.includes('LOCAL')) continue;
      const sim = single(d.id);
      if (d.unsafe) {
        sim.act(d.actions.find((a) => a.secures)!.id);
        for (let i = 0; i < 100 && sim.rt!.busy; i++) sim.tick(0.25);
      }
      for (let i = 0; i < 40; i++) sim.tick(0.25);
      sim.transport('LOCAL');
      expect(sim.f.results[0].outcome, d.id).toBe('obito');
      expect(sim.f.results[0].pay).toBe(0);
    }
  });
  it('estabilizado e liberado no lugar errado continua vivo, rebaixado', () => {
    const d = FIELD_CASES.find((c) => c.id === 'hipoglicemia')!;
    const sim = single(d.id);
    const crit = d.actions.filter((a) => a.kind === 'critico');
    const done = new Set<string>();
    const run = (id: string) => {
      const a = d.actions.find((x) => x.id === id)!;
      for (const n of [...(a.needs ?? []), ...(a.after ?? [])]) if (!done.has(n)) run(n);
      if (done.has(id)) return;
      expect(sim.act(id).ok).toBe(true);
      for (let i = 0; i < 100 && sim.rt!.busy; i++) sim.tick(0.25);
      done.add(id);
    };
    for (const c of crit) run(c.id);
    expect(sim.rt!.stable).toBe(true);
    sim.transport('LOCAL');
    expect(sim.f.results[0].outcome).toBe('instavel');
  });
});

// ---------------------------------------------------------------------------
describe('conteúdo', () => {
  it('vídeo do trote: recusa e desliga / recusa / aceita perto de 40/30/30', () => {
    const st = newGameState({ gender: 'M', difficulty: 'padrao', seed: 1 });
    const c = makeCtx(st);
    const def = { id: 'x', at: '08:00', num: '9', caller: '?', type: 'trotista', note: '', addr: { rua: 'R', n: 1, bairro: 'Centro' }, open: [], patient: { name: '?' }, truth: {} } as unknown as CallDef;
    const n = { desliga: 0, recusa: 0, aceita: 0 };
    const N = 2000;
    for (let i = 0; i < N; i++) {
      const v = buildVideo(def, { dx: 'Trote', sev: 'trote', ok: ['TROTE'], prankKind: 'trote' }, c, `d${(i % 20) + 1}_c${i}`);
      n[v.refuse ? (v.refuse.hangup ? 'desliga' : 'recusa') : 'aceita']++;
    }
    expect(Math.abs(n.desliga / N - 0.4)).toBeLessThan(0.06);
    expect(Math.abs(n.recusa / N - 0.3)).toBeLessThan(0.06);
    expect(Math.abs(n.aceita / N - 0.3)).toBeLessThan(0.06);
  });

  it('conquistas: nenhuma repetida (a lista inteira dá para completar)', () => {
    const descs = CONTENT.achievements.map((a) => a.desc);
    expect(new Set(descs).size).toBe(descs.length);
    expect(CONTENT.achievements.some((a) => a.id === 'simone_final')).toBe(false);
  });

  it('com a doutora, o Bené (rádio da Intervenção no dia 10) diz "Doutora"', () => {
    const st = newGameState({ gender: 'F', difficulty: 'padrao', seed: 1, startDay: 10 });
    const radio = CONTENT.days[10].interlude?.field?.radio ?? [];
    const bene = radio.find((r) => r.who === 'BENÉ');
    expect(bene).toBeDefined();
    const txt = resolveTokens(bene!.text, 'F', st);
    expect(txt.startsWith('Doutora...')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// cliente: conquistas e recorde do Infinito persistidos (armazenamento falso no lugar do localStorage)
// ---------------------------------------------------------------------------
describe('cliente: conquistas e recorde', () => {
  const mem = new Map<string, string>();
  let store: typeof import('../src/client/store')['store'];
  beforeAll(async () => {
    const ls = {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
      key: (i: number) => [...mem.keys()][i] ?? null,
      get length() {
        return mem.size;
      },
    };
    (globalThis as unknown as { window: unknown }).window = { addEventListener() {}, localStorage: ls };
    store = (await import('../src/client/store')).store;
  });

  it('conquista ganha em casa (Dobra) entra na lista global antes do fim da campanha', () => {
    store.newGame({ gender: 'M', difficulty: 'padrao', variable: false, seed: 5, startDay: 4 });
    const g = store.game!;
    for (let i = 0; i < 30000 && !(g.st.phase === 'casa' && g.st.home?.step === 'escolha'); i++) step(g);
    g.home!.chooseTimeOff('bico');
    autoPlayField(g.home!.fieldSim()!, 1, new Rng(1));
    g.home!.finishField();
    expect(g.st.achievements).toContain('dobra');
    store.quitToTitle();
    expect(store.achievements).toContain('dobra');
    expect(JSON.parse(mem.get('qap.achievements') ?? '[]')).toContain('dobra');
  });

  it('o recorde do Plantão Infinito fica salvo', () => {
    store.recordInfinite(1234);
    expect(JSON.parse(mem.get('qap.meta') ?? '{}').infiniteBest).toBe(1234);
    store.recordInfinite(10);
    expect(JSON.parse(mem.get('qap.meta') ?? '{}').infiniteBest).toBe(1234);
  });
});

// ---------------------------------------------------------------------------
describe('Intervenção: transporte', () => {
  const single = (id: string) => {
    const f: FieldShift = { cases: [id], idx: 0, phase: 'radio', results: [], clock: [1200], extra: {} };
    const sim = new FieldSim(f, FIELD_CASES, 'padrao');
    sim.begin();
    return sim;
  };
  it('parada cardíaca levada sem o pulso de volta é óbito no caminho', () => {
    const sim = single('pcr_fv');
    sim.transport('REG');
    expect(sim.f.results[0].outcome).toBe('obito');
  });
  it('no transporte a piora conta desde o começo (sem a carência de leitura)', () => {
    const sim = single('iam_inferior');
    const start = sim.rt!.stab;
    sim.transport('REG');
    expect(sim.f.results[0].outcome).toBe('instavel');
    expect(sim.rt!.stab).toBeLessThan(start);
  });
});
