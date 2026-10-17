// =============================================================================
// Campanha 2: "Simone". Os mesmos 20 dias vistos pela TARM.
// O mundo (frota, pacientes, regulação) roda num estado-sombra, com o
// protagonista da primeira campanha controlado pela IA na Mesa 1 e o
// Dr. Henrique na Mesa 2. O estado principal é o da Simone: dinheiro,
// pressão, Wesley, emprego e o histórico das pré-triagens dela.
// =============================================================================
import type { GameState, DayRecord, ReportItem, Color, BillDef, Ctx, Gender, Difficulty } from './types';
import type { Content, SimoneDayDef, SimoneWorld } from './content-api';
import type { ShiftSim } from './shift';
import { newGameState } from './state';
import { colorFor, decisionLabel } from './grading';
import { clamp } from './util';

export const SIMONE_TMA_GOAL = 45;

export function createSimoneState(o: { gender: Gender; difficulty: Difficulty; seed?: number }): GameState {
  const st = newGameState({ gender: o.gender, difficulty: o.difficulty, mode: 'simone', seed: o.seed });
  st.money = 90;
  st.vars.desgaste = 30;
  st.vars.pressao = 5;
  st.vars.wesley = 5;
  st.vars.emprego = 6;
  st.vars.lealSimone = 10;
  const shadow = newGameState({ gender: o.gender, difficulty: 'padrao', mode: 'simone', seed: (st.seed ^ 0x2f6b) | 0 });
  st.shadow = shadow;
  return st;
}

export function simoneDay(c: Content, day: number): SimoneDayDef | undefined {
  return c.simone?.days[day];
}

export function simoneWorld(sim: ShiftSim | undefined): SimoneWorld {
  return {
    call: (defId: string) => (sim ? Object.values(sim.sh.calls).find((x) => x.def === defId) : undefined),
    shadowFlag: (name: string) => sim?.st.flags[name],
    time: sim?.sh.time ?? 0,
    passed: sim?.sh.tarm?.passed ?? 0,
  };
}

const RANK: Record<Color, number> = { azul: 0, verde: 1, amarelo: 2, vermelho: 3 };
const COLOR_PT: Record<Color, string> = { vermelho: 'vermelho', amarelo: 'amarelo', verde: 'verde', azul: 'azul' };

export interface SimoneDayResult {
  record: DayRecord;
  /** mensagens para o relatório (OS, advertências) */
  notes: string[];
  tma: number;
  goal: number;
  passed: number;
  right: number;
  under: number;
  over: number;
}

/** monta o relatório e as consequências do turno da TARM */
export function settleSimoneShift(st: GameState, c: Content, sim: ShiftSim): SimoneDayResult {
  const sday = simoneDay(c, st.day);
  const goal = sday?.tmaGoal ?? SIMONE_TMA_GOAL;
  const sh = sim.sh;
  const items: ReportItem[] = [];
  const notes: string[] = [];
  let right = 0;
  let under = 0;
  let over = 0;
  let warnings = 0;
  let deathsUnder = 0;
  for (const id of sh.order) {
    const call = sh.calls[id];
    if (!call) continue;
    const def = sim.defOf(call);
    const t = sim.truthOf(call);
    const name = def.patient.name + (def.patient.age ? `, ${def.patient.age}` : '');
    const mine = !!call.tarm && !call.tarm.cover;
    if (call.status === 'desligou') {
      items.push({ callId: id, name, dx: t.sev === 'trote' ? 'Trote' : t.dx, decision: '—', verdict: 'desligou', money: 0, text: call.resultText ?? 'Desistiu de esperar na fila.', outcome: call.outcome, t: call.arrived });
      continue;
    }
    if (call.status === 'noturno' && !mine) {
      items.push({ callId: id, name, dx: t.sev === 'trote' ? 'Trote' : t.dx, decision: 'ficou na fila', verdict: 'noturno', money: 0, text: call.resultText ?? 'Passou para o plantão noturno.', outcome: call.outcome, t: call.arrived });
      continue;
    }
    if (!call.tarm) continue;
    const truthColor = colorFor(t.sev);
    const diff = RANK[call.tarm.color] - RANK[truthColor];
    let verdict: ReportItem['verdict'];
    if (!mine) verdict = 'pendente';
    else if (diff === 0) {
      verdict = t.sev === 'trote' ? 'trote_ok' : 'correto';
      right++;
    } else if (diff < 0) {
      verdict = 'falta';
      under++;
    } else {
      verdict = 'excesso';
      over++;
    }
    const who = call.tarm.to === 'henrique' ? 'Henrique' : 'Mesa 1';
    const decision = `${COLOR_PT[call.tarm.color]}${call.tarm.priority ? ' · prioridade' : ''} → ${who}${call.decision ? ' · ' + decisionLabel(call.decision) : ' · sem decisão'}`;
    if (mine && t.sev === 'vermelho' && diff < 0 && call.outcome === 'obito') deathsUnder++;
    items.push({ callId: id, name, dx: t.sev === 'trote' ? 'Trote' : t.dx, decision, verdict, money: 0, text: mine ? '' : 'Triada por quem cobriu a mesa.', outcome: call.outcome, t: call.arrived });
  }
  const sum = sim.tarmSummary();
  const tma = sum.tma;
  const passed = sum.passed;
  // OS: tempo médio de atendimento
  let bonus = 0;
  let deductions = 0;
  if (passed >= 4 && tma <= goal) {
    bonus += 15;
    notes.push(`TMA ${Math.round(tma)} min, dentro da meta de ${goal}: +R$ 15.`);
  } else if (passed >= 4 && tma > goal * 1.5) {
    warnings++;
    deductions += 20;
    notes.push(`TMA ${Math.round(tma)} min, muito acima da meta de ${goal}: advertência da OS (−R$ 20).`);
  } else if (passed > 0) notes.push(`TMA ${Math.round(tma)} min (meta: ${goal}).`);
  // auditoria de pré-triagem da OS: muitas cores erradas no mesmo turno
  if (passed >= 5 && right / passed < 0.6) {
    warnings++;
    deductions += 20;
    notes.push(`Auditoria de pré-triagem: só ${right} de ${passed} na cor certa. Advertência (−R$ 20).`);
  }
  const redUnder = items.filter((it) => it.verdict === 'falta' && it.outcome !== 'pendente').length;
  if (redUnder >= 2) notes.push('A coordenação reparou: casos graves chegando às mesas com cor de caso leve.');
  if (deathsUnder > 0) {
    warnings += 1;
    deductions += 20;
    notes.push(`Pré-triagem abaixo da gravidade em ${deathsUnder === 1 ? 'um caso que terminou em óbito' : deathsUnder + ' casos que terminaram em óbito'}: advertência (−R$ 20).`);
  }
  const fixed = c.simone?.pay ?? 120;
  const pay = sh.tarm?.out ? Math.round(fixed / 2) : fixed + bonus - deductions;
  st.money += pay;
  st.totals.warnings += warnings;
  st.totals.handled += passed;
  st.totals.calls += sh.order.length;
  st.totals.deaths += sum.deaths;
  st.totals.saves += sum.saves;
  // o corpo cobra: turno pesado sobe a pressão
  const heavy = (tma > goal ? 1 : 0) + (sum.deaths >= 2 ? 1 : 0);
  st.vars.desgaste = clamp(st.vars.desgaste + 3 + heavy * 2, 0, 100);
  if (heavy >= 2) st.vars.pressao = clamp(st.vars.pressao + 1, 0, 10);
  if (redUnder >= 2) st.vars.emprego = clamp(st.vars.emprego - 1, 0, 10);
  if (warnings) st.vars.emprego = clamp(st.vars.emprego - warnings, 0, 10);
  else if (passed >= 6 && right / Math.max(1, passed) >= 0.8) st.vars.emprego = clamp(st.vars.emprego + 1, 0, 10);
  const record: DayRecord = {
    day: st.day,
    warnings,
    notes: 0,
    deaths: sum.deaths,
    saves: sum.saves,
    handled: passed,
    pay,
    bonus,
    deductions,
    report: items,
    moneyAfter: st.money,
  };
  st.history.push(record);
  st.flags['tarm_d' + st.day] = `${right}/${passed}`;
  st.flags['tma_d' + st.day] = Math.round(tma);
  return { record, notes, tma, goal, passed, right, under, over };
}

export interface SimoneBillView {
  id: string;
  label: string;
  amount: number;
  auto: boolean;
  desc?: string;
}

export function simoneBills(st: GameState, c: Content, ctx: Ctx): { defs: BillDef[]; views: SimoneBillView[] } {
  const sday = simoneDay(c, st.day);
  const defs = [...(c.simone?.baseBills(ctx) ?? []), ...(sday?.bills ?? [])].filter((b) => !b.when || b.when(ctx));
  const views = defs.map((b) => ({
    id: b.id,
    label: b.label,
    amount: typeof b.amount === 'function' ? b.amount(ctx) : b.amount,
    auto: !!b.auto,
    desc: typeof b.desc === 'function' ? b.desc(ctx) : b.desc,
  }));
  return { defs, views };
}
