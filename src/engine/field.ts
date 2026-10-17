// =============================================================================
// Intervenção: plantão extra na ambulância (USA 01), entre dois plantões da
// Regulação. Chega o chamado pelo rádio, a equipe chega na cena e o jogador
// escolhe o que fazer enquanto o paciente piora em tempo real. Paga mais que
// ficar em casa, mas custa a noite com a família e o sono antes da Regulação.
//
// Motor puro e determinístico: o relógio vem de fora (segundos), a interface
// chama tick(dt). Nada aqui toca DOM. Ver docs/INTERVENCAO.md.
// =============================================================================
import type {
  Difficulty, FieldActionDef, FieldCaseDef, FieldCaseRT, FieldDest, FieldOutcome, FieldResult, FieldShift, FieldVital, GameState,
} from './types';
import { Rng, clamp, hashString } from './util';

/** pagamento fixo do plantão extra (R$) */
export const FIELD_BASE = 140;
/** por ocorrência: estável no destino certo / vivo (instável ou destino errado) */
export const FIELD_PAY_OK = 25;
export const FIELD_PAY_ALIVE = 10;
/** desgaste do plantão (a noite sem dormir) e por óbito */
export const FIELD_WEAR = 15;
export const FIELD_WEAR_DEATH = 4;
/** desgaste a mais por noite seguida na ambulância (a segunda noite seguida custa +5, a terceira +10...) */
export const FIELD_SLEEP_DEBT = 5;
/** ocorrências por plantão */
export const FIELD_CASES = 3;
/** segundos de leitura antes de o paciente começar a piorar */
export const FIELD_GRACE: Record<Difficulty, number> = { narrativo: 9, padrao: 6, real: 4 };
/** velocidade da piora por dificuldade */
export const FIELD_DECAY: Record<Difficulty, number> = { narrativo: 0.75, padrao: 1, real: 1.2 };
/** tempo de transporte (s) e quanto a piora segue durante ele */
const TRANSPORT_S: Record<FieldDest, number> = { REG: 10, UPA: 7, MAT: 9, LOCAL: 0 };
const TRANSPORT_RATE = 0.6;
/** depois do essencial, num caso "scoop" (trauma, AVC), a piora segue nesta fração */
const SCOOP_RATE = 0.35;
/** abaixo disto, um caso "scoop" chega instável */
const SCOOP_OK = 35;

export const DEST_LABEL: Record<FieldDest, string> = {
  REG: 'Hospital Regional',
  UPA: 'UPA Norte',
  MAT: 'Maternidade',
  LOCAL: 'Liberar no local, com orientação',
};

export const OUTCOME_LABEL: Record<FieldOutcome, string> = {
  estavel: 'Chegou estável',
  instavel: 'Chegou vivo, mas instável',
  obito: 'Óbito',
  equipe_ferida: 'Equipe ferida',
  trote: 'Trote',
};

export interface FieldActionView extends FieldActionDef {
  state: 'ok' | 'feito' | 'ocupado' | 'falta' | 'bloqueado';
  reason?: string;
  /** 0..1 enquanto a equipe faz */
  progress?: number;
}

function fmtClock(min: number): string {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** sorteia as ocorrências do plantão (as especiais do dia entram primeiro, na posição pedida) */
/** valor de um sinal no monitor agora ('--' se ainda não medido) */
export function vitalShown(d: FieldCaseDef, rt: FieldCaseRT, k: FieldVital): string {
  if (!rt.shown.includes(k)) return '--';
  return (rt.stable && d.vitalsAfter?.[k]) || d.vitals[k] || '--';
}

export function createFieldShift(
  st: GameState,
  all: FieldCaseDef[],
  opts: { special?: string[]; radio?: { before: number; who: string; text: string }[]; n?: number } = {},
): FieldShift {
  const n = opts.n ?? FIELD_CASES;
  const rng = new Rng(hashString(`${st.seed}:field:${st.day}:${st.totals.bicos}`));
  const seen = (id: string) => !!st.flags['field_' + id];
  const pool = all.filter((c) => !c.special && (c.minDay ?? 1) <= Math.max(1, st.day));
  // primeiro os que ainda não saíram; trote no máximo um por noite e nunca na primeira
  const fresh = rng.shuffle(pool.filter((c) => !seen(c.id)));
  const old = rng.shuffle(pool.filter((c) => seen(c.id)));
  const picked: string[] = [];
  let prank = false;
  for (const c of [...fresh, ...old]) {
    if (picked.length >= n) break;
    if (c.prank && (prank || picked.length === 0)) continue;
    if (c.prank) prank = true;
    picked.push(c.id);
  }
  const special = (opts.special ?? []).filter((id) => all.some((c) => c.id === id));
  // especial ocupa o lugar da segunda ocorrência (ou a primeira, se for a única)
  for (const id of special) {
    picked.splice(Math.min(1, picked.length), 0, id);
    if (picked.length > n) picked.pop();
  }
  // meio plantão noturno, das 19h à 1h
  const clock: number[] = [];
  let t = 19 * 60 + 20 + rng.int(0, 30);
  for (let i = 0; i < picked.length; i++) {
    clock.push(t);
    t += 95 + rng.int(0, 45);
  }
  const extra: FieldShift['extra'] = {};
  for (const r of opts.radio ?? []) (extra[r.before] ??= []).push({ who: r.who, text: r.text });
  return { cases: picked, idx: 0, phase: 'radio', results: [], clock, extra };
}

export class FieldSim {
  f: FieldShift;
  defs: Map<string, FieldCaseDef>;
  diff: Difficulty;
  unit: string;

  /** tokens de gênero/nome ({dr}, {nome}...), resolvidos por quem cria o simulador */
  tokens?: (t: string) => string;

  constructor(f: FieldShift, cases: FieldCaseDef[], diff: Difficulty = 'padrao', unit = 'USA 01', tokens?: (t: string) => string) {
    this.f = f;
    this.defs = new Map(cases.map((c) => [c.id, c]));
    this.diff = diff;
    this.unit = unit;
    this.tokens = tokens;
  }

  get def(): FieldCaseDef | undefined {
    return this.defs.get(this.f.cases[this.f.idx]);
  }
  get rt(): FieldCaseRT | undefined {
    return this.f.rt;
  }
  /** horário do chamado atual, "HH:MM" */
  clock(): string {
    const base = this.f.clock[this.f.idx] ?? 19 * 60 + 30;
    // 6 s de cena = 1 min de relógio
    return fmtClock(base + Math.floor((this.f.rt?.t ?? 0) / 6));
  }
  /** hora em que a noite acaba (depois da última ocorrência) */
  endClock(): string {
    const last = this.f.clock[this.f.clock.length - 1] ?? 23 * 60;
    return fmtClock(Math.max(last + 45, 24 * 60 + 50));
  }
  radioText(): string {
    const d = this.def;
    return d ? this.fill(d.radio) : '';
  }
  fill(t: string): string {
    // {hora}: o relógio da ocorrência agora (ex.: "23h05"), para o texto não brigar com o relógio da tela
    const u = t.split('{unit}').join(this.unit).split('{hora}').join(this.clock().replace(':', 'h'));
    return this.tokens ? this.tokens(u) : u;
  }

  // ---------------------------------------------------------------------------
  // ciclo da ocorrência
  // ---------------------------------------------------------------------------
  /** "QSL, a caminho": sai do rádio e chega na cena */
  begin(): void {
    const d = this.def;
    if (!d || this.f.phase !== 'radio') return;
    const rt: FieldCaseRT = {
      id: d.id,
      t: 0,
      stab: d.start,
      done: [],
      log: [],
      harm: 0,
      shown: [],
      scene: JSON.parse(JSON.stringify(d.scene)),
      focus: 'geral',
      secured: !d.unsafe,
      stable: false,
      crewIdx: 0,
    };
    for (const s of d.see) rt.log.push({ t: 0, text: this.fill(s), kind: 'achado' });
    if (d.unsafe) rt.log.push({ t: 0, who: 'BENÉ', text: this.fill('{Dr}, a cena não tá segura. O cara ainda tá lá dentro.'), kind: 'equipe' });
    this.f.rt = rt;
    this.f.phase = 'cena';
  }

  criticals(d = this.def): FieldActionDef[] {
    return (d?.actions ?? []).filter((a) => a.kind === 'critico');
  }

  /** pontos por segundo agora (no transporte não há carência: a piora já começou) */
  rate(inTransport = false): number {
    const d = this.def;
    const rt = this.rt;
    if (!d || !rt || rt.outcome || d.prank) return 0;
    if (!inTransport && rt.t < FIELD_GRACE[this.diff]) return 0;
    const base = d.decay * FIELD_DECAY[this.diff];
    if (rt.stable) return d.scoop ? base * SCOOP_RATE : 0;
    const crit = this.criticals();
    const k = crit.length ? crit.filter((a) => rt.done.includes(a.id)).length / crit.length : 0;
    return base * (1 - 0.65 * k);
  }

  tick(dt: number): void {
    const d = this.def;
    const rt = this.rt;
    if (!d || !rt || this.f.phase !== 'cena' || rt.outcome) return;
    const step = Math.max(0, Math.min(dt, 0.5));
    rt.stab = clamp(rt.stab - this.rate() * step, 0, 100);
    rt.t += step;
    // falas da equipe de tempos em tempos
    const crew = d.crew ?? [];
    if (rt.crewIdx < crew.length && rt.t >= 14 + rt.crewIdx * 22) {
      const line = this.fill(crew[rt.crewIdx++]);
      const m = /^([A-ZÁÉÍÓÚÂÊÔÃÕÇ ]+):\s*(.*)$/.exec(line);
      rt.log.push({ t: rt.t, who: m ? m[1] : undefined, text: m ? m[2] : line, kind: 'equipe' });
    }
    // close-up volta ao plano geral
    if (!rt.busy && rt.focusUntil !== undefined && rt.t >= rt.focusUntil) {
      rt.focus = 'geral';
      rt.focusUntil = undefined;
    }
    // ação em andamento
    if (rt.busy && rt.t >= rt.busy.end) {
      const a = d.actions.find((x) => x.id === rt.busy!.id);
      rt.busy = undefined;
      if (a) this.complete(a);
    }
    if (!rt.outcome && rt.stab <= 0) {
      rt.stab = 0;
      rt.log.push({ t: rt.t, text: 'Sem pulso. Vocês fazem tudo o que dá. Não volta.', kind: 'fim' });
      this.end('obito');
    }
  }

  visibleActions(): FieldActionView[] {
    const d = this.def;
    const rt = this.rt;
    if (!d || !rt) return [];
    const out: FieldActionView[] = [];
    for (const a of d.actions) {
      if (a.after && !a.after.every((x) => rt.done.includes(x))) continue;
      if (a.until && a.until.some((x) => rt.done.includes(x)) && !rt.done.includes(a.id)) continue;
      let state: FieldActionView['state'] = 'ok';
      let reason: string | undefined;
      let progress: number | undefined;
      if (rt.done.includes(a.id)) state = 'feito';
      else if (rt.busy?.id === a.id) {
        state = 'ocupado';
        progress = clamp((rt.t - rt.busy.start) / Math.max(0.01, rt.busy.end - rt.busy.start), 0, 1);
      } else if (rt.outcome) state = 'bloqueado';
      else if (!rt.secured && !a.secures && !a.hurts) {
        state = 'bloqueado';
        reason = 'Cena insegura';
      } else if (rt.secured && (a.secures || a.hurts) && d.unsafe) continue;
      else if (a.needs && !a.needs.every((x) => rt.done.includes(x))) {
        state = 'falta';
        const miss = a.needs.filter((x) => !rt.done.includes(x)).map((x) => d.actions.find((y) => y.id === x)?.label ?? x);
        reason = 'Antes: ' + miss.join(', ');
      } else if (rt.busy) state = 'bloqueado';
      out.push({ ...a, state, reason, progress });
    }
    return out;
  }

  act(id: string): { ok: boolean; reason?: string } {
    const d = this.def;
    const rt = this.rt;
    if (!d || !rt || this.f.phase !== 'cena' || rt.outcome) return { ok: false };
    const a = d.actions.find((x) => x.id === id);
    if (!a) return { ok: false };
    const v = this.visibleActions().find((x) => x.id === id);
    if (!v) return { ok: false };
    if (v.state === 'feito') return { ok: false, reason: 'Já feito.' };
    if (v.state === 'ocupado' || rt.busy) return { ok: false, reason: 'A equipe está ocupada.' };
    if (v.state === 'falta' || v.state === 'bloqueado') return { ok: false, reason: v.reason };
    rt.busy = { id: a.id, start: rt.t, end: rt.t + Math.max(0.5, a.cost) };
    rt.log.push({ t: rt.t, text: a.label + '…', kind: 'acao' });
    if (a.focus) {
      rt.focus = a.focus;
      rt.focusUntil = undefined;
    }
    return { ok: true };
  }

  private complete(a: FieldActionDef): void {
    const d = this.def!;
    const rt = this.rt!;
    rt.done.push(a.id);
    if (a.focus) rt.focusUntil = rt.t + 3;
    if (a.delta) rt.stab = clamp(rt.stab + a.delta, 0, 100);
    if (a.kind === 'dano') rt.harm++;
    for (const s of a.shows ?? []) if (!rt.shown.includes(s)) rt.shown.push(s);
    if (a.scene) {
      const { patient, ...rest } = a.scene;
      Object.assign(rt.scene, rest);
      if (patient !== undefined) {
        const was = rt.scene.patient;
        // equipamento soma (o colar não some quando entra o soro)
        const gear = patient?.gear ? [...new Set([...(was?.gear ?? []), ...patient.gear])] : was?.gear;
        rt.scene.patient = patient === null ? null : { ...(was ?? { pose: 'deitado' }), ...patient, ...(gear ? { gear } : {}) };
      }
    }
    rt.log.push({ t: rt.t, text: this.fill(a.say), kind: a.kind === 'dano' ? 'alerta' : a.kind === 'info' ? 'achado' : 'acao' });
    if (a.secures) rt.secured = true;
    if (a.hurts) {
      this.end('equipe_ferida');
      return;
    }
    if (a.endsPrank) {
      this.end('trote');
      return;
    }
    if (!rt.stable && !d.prank) {
      const crit = this.criticals();
      if (crit.length && crit.every((c) => rt.done.includes(c.id))) {
        rt.stable = true;
        rt.log.push({
          t: rt.t,
          text: d.scoop ? 'O essencial está feito. Agora é chegar rápido ao hospital.' : 'Paciente estabilizado. Pode transportar.',
          kind: 'fim',
        });
      }
    }
  }

  /** leva para o destino (ou libera no local) e encerra a ocorrência */
  transport(dest: FieldDest): void {
    const d = this.def;
    const rt = this.rt;
    if (!d || !rt || rt.outcome || this.f.phase !== 'cena' || d.prank) return;
    if (!rt.secured) return;
    rt.busy = undefined;
    const ok = d.dest.includes(dest);
    let out: FieldOutcome;
    if (dest === 'LOCAL') {
      // liberar no local só resolve onde o caso aceita. Quem precisava de hospital e não foi
      // estabilizado não resiste em casa (antes saía "vivo, instável" até numa parada, melhor do que levar)
      out = ok ? (rt.stable ? 'estavel' : 'instavel') : rt.stable ? 'instavel' : 'obito';
      if (!ok) rt.harm++;
    } else {
      const ts = TRANSPORT_S[dest];
      rt.stab = clamp(rt.stab - this.rate(true) * TRANSPORT_RATE * ts, 0, 100);
      rt.t += ts;
      // parada sem pulso de volta: a massagem no baú em movimento não segura até o hospital
      if (d.treatOnScene && !rt.stable) rt.stab = 0;
      if (rt.stab <= 0) out = 'obito';
      else if (d.scoop) out = rt.stable && rt.stab >= SCOOP_OK ? 'estavel' : 'instavel';
      else out = rt.stable ? 'estavel' : 'instavel';
      // destino que não resolve: vai precisar de transferência
      if (!ok && out === 'estavel') out = 'instavel';
    }
    rt.dest = dest;
    rt.destOk = ok;
    rt.log.push({
      t: rt.t,
      text:
        dest === 'LOCAL'
          ? out === 'obito'
            ? d.treatOnScene
              ? 'A reanimação para ali mesmo. Não voltou.'
              : 'Vocês orientam a família e liberam no local. De madrugada, a família liga de novo: não resistiu.'
            : 'Vocês orientam a família e liberam no local.'
          : out === 'obito'
            ? d.treatOnScene && !rt.stable
              ? 'Saíram sem pulso. Massagem no baú até a porta do hospital; não voltou.'
              : 'Parou no caminho. Massagem até a porta do hospital.'
            : `QUY: chegada ao ${DEST_LABEL[dest]}.`,
      kind: 'fim',
    });
    this.end(out);
  }

  private end(o: FieldOutcome): void {
    const d = this.def!;
    const rt = this.rt!;
    rt.outcome = o;
    rt.busy = undefined;
    const destOk = !!rt.destOk;
    rt.pay = o === 'estavel' && destOk ? FIELD_PAY_OK : o === 'estavel' || o === 'instavel' ? FIELD_PAY_ALIVE : 0;
    this.f.results.push({ id: d.id, title: d.title, outcome: o, dest: rt.dest, destOk, harm: rt.harm, pay: rt.pay, secs: Math.round(rt.t) });
    this.f.phase = 'resultado';
  }

  /** depois do resultado: próxima ocorrência ou fim do plantão */
  next(): void {
    if (this.f.phase !== 'resultado') return;
    this.f.rt = undefined;
    this.f.idx++;
    this.f.phase = this.f.idx < this.f.cases.length ? 'radio' : 'fim';
  }

  /** soma do plantão */
  summary(): { pay: number; base: number; extra: number; deaths: number; stable: number; hurt: boolean; results: FieldResult[] } {
    const extra = this.f.results.reduce((a, r) => a + r.pay, 0);
    return {
      pay: FIELD_BASE + extra,
      base: FIELD_BASE,
      extra,
      deaths: this.f.results.filter((r) => r.outcome === 'obito').length,
      stable: this.f.results.filter((r) => r.outcome === 'estavel' && r.destOk).length,
      hurt: this.f.results.some((r) => r.outcome === 'equipe_ferida'),
      results: this.f.results,
    };
  }
}

// -----------------------------------------------------------------------------
// bot: joga o plantão sozinho (simulações de balanceamento e testes)
// -----------------------------------------------------------------------------
export function autoPlayField(sim: FieldSim, accuracy: number, rng: Rng, think: [number, number] = [2, 5]): void {
  let guard = 0;
  while (sim.f.phase !== 'fim' && guard++ < 5000) {
    if (sim.f.phase === 'radio') {
      sim.begin();
      continue;
    }
    if (sim.f.phase === 'resultado') {
      sim.next();
      continue;
    }
    const d = sim.def!;
    const rt = sim.rt!;
    // pensa
    const wait = think[0] + rng.next() * (think[1] - think[0]);
    for (let s = 0; s < wait && !rt.outcome; s += 0.25) sim.tick(0.25);
    if (rt.outcome) continue;
    const views = sim.visibleActions();
    const free = views.filter((v) => v.state === 'ok');
    let pick: FieldActionView | undefined;
    if (!rt.secured) pick = rng.chance(accuracy) ? free.find((v) => v.secures) : free.find((v) => v.hurts) ?? free.find((v) => v.secures);
    else if (d.prank) pick = rng.chance(accuracy) ? free.find((v) => v.endsPrank) : free.find((v) => !v.endsPrank) ?? free.find((v) => v.endsPrank);
    else if (rt.stable) pick = undefined;
    else if (rng.chance(accuracy)) {
      // próxima crítica possível; se falta pré-requisito, faz o pré-requisito
      for (const c of sim.criticals()) {
        if (rt.done.includes(c.id)) continue;
        const v = views.find((x) => x.id === c.id);
        if (v?.state === 'ok') {
          pick = v;
          break;
        }
        const need = (c.needs ?? []).find((n) => !rt.done.includes(n));
        const nv = need ? free.find((x) => x.id === need) : undefined;
        if (nv) {
          pick = nv;
          break;
        }
        // crítica escondida (after): faz o achado que a revela
        const aft = (c.after ?? []).find((n) => !rt.done.includes(n));
        const av = aft ? free.find((x) => x.id === aft) : undefined;
        if (av) {
          pick = av;
          break;
        }
      }
    } else {
      const wrong = free.filter((v) => v.kind === 'neutro' || v.kind === 'dano' || v.kind === 'ajuda');
      pick = wrong.length ? rng.pick(wrong) : free[0];
    }
    if (pick) {
      sim.act(pick.id);
      for (let s = 0; s < 60 && rt.busy && !rt.outcome; s += 0.25) sim.tick(0.25);
      continue;
    }
    if (!rt.outcome) {
      const dest = rng.chance(accuracy) ? d.dest[0] : rng.pick(['REG', 'UPA', 'MAT'] as FieldDest[]);
      if (dest) sim.transport(dest);
      else sim.transport('REG');
    }
  }
}
