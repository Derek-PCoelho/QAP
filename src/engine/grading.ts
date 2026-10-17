// Avaliação assimétrica (v2.0): excesso = nota de auditoria; falta = advertência.
import type { Decision, TruthDef, Verdict, Resource, Color, TruthSev } from './types';

export const BONUS: Record<Resource, number> = { USA: 25, USB: 15, ORI: 8, TROTE: 10 };
export const NOTE_COST = 10;
export const WARNING_COST = 20;

const RANK: Record<Resource, number> = { ORI: 0, USB: 1, USA: 2, TROTE: -1 };

export function colorFor(sev: TruthSev): Color {
  return sev === 'trote' ? 'azul' : sev;
}

export const RESOURCE_LABEL: Record<Resource, string> = {
  USA: 'USA (suporte avançado)',
  USB: 'USB (suporte básico)',
  ORI: 'Orientação',
  TROTE: 'Trote',
};

export interface GradeInput {
  truth: TruthDef;
  decision: Decision;
  asked: string[];
  day: number;
}

function isDispatch(r: Resource) {
  return r === 'USA' || r === 'USB';
}

export function grade({ truth, decision, asked, day }: GradeInput): Verdict {
  const v: Verdict = {
    kind: 'correto',
    safety: false,
    destWrong: false,
    refWrong: false,
    bonus: 0,
    notes: 0,
    warnings: 0,
    golden: false,
    text: '',
    revealed: false,
  };
  const r = decision.resource;
  const okRes = truth.ok;

  // ---------------- trote verdadeiro ----------------
  if (truth.sev === 'trote') {
    if (r === 'TROTE') {
      v.kind = 'trote_ok';
      v.bonus = truth.prankKind === 'teste' || truth.prankKind === 'desabafo' ? 0 : BONUS.TROTE;
      v.text = truth.prankKind === 'acidental' ? 'Ligação acidental encerrada.' : truth.prankKind === 'teste' ? 'Ligação-teste identificada.' : 'Trote identificado.';
    } else if (r === 'ORI') {
      v.kind = 'sem_penalidade';
      v.text = truth.prankKind === 'desabafo' ? 'Encerrada com orientação.' : 'Era trote — encerrada sem viatura, mas sem identificar.';
      if (truth.prankKind === 'desabafo') v.kind = 'correto';
    } else {
      v.kind = 'trote_enviado';
      v.notes = truth.noPenalty ? 0 : 1;
      v.text = `Viatura enviada para ${truth.prankKind === 'teste' ? 'ligação-teste' : 'trote'}.`;
    }
    return v;
  }

  // ---------------- caso real ----------------
  const grave = truth.sev === 'vermelho' || truth.sev === 'amarelo';
  const okHas = okRes.includes(r);
  if (okHas) {
    const multi = okRes.filter((x) => x !== 'TROTE').length > 1;
    const missing = (truth.must ?? []).filter((q) => !asked.includes(q));
    if (missing.length && !truth.noPenalty) {
      v.kind = 'sem_justificativa';
      v.notes = 1;
      v.bonus = Math.round(BONUS[r] / 2);
      v.text = `Decisão aceitável, mas sem as perguntas obrigatórias (${missing.length}).`;
    } else if (multi) {
      // ⚖ mais de uma decisão aceitável: a melhor (truth.best) paga mais; as outras, o próprio valor
      const best = truth.best ?? okRes[0];
      const top = Math.max(...okRes.filter((x) => x !== 'TROTE').map((x) => BONUS[x]));
      v.kind = 'defensavel';
      v.bonus = r === best ? top + 5 : Math.min(BONUS[r], top);
      v.text = r === best ? 'Decisão defensável e bem justificada: a melhor das opções.' : 'Decisão defensável.';
    } else {
      v.kind = 'correto';
      v.bonus = BONUS[r];
      v.text = 'Decisão correta.';
    }
    if (r === 'ORI' && truth.ref && truth.ref.length && (!decision.referral || !truth.ref.includes(decision.referral))) {
      v.refWrong = true;
      v.bonus = 0;
      v.text +=
        decision.referral === 'REG'
          ? ' Encaminhamento inadequado: o Regional é para os casos graves, que vão de viatura; caso leve vai para a UPA ou a UBS (sem bônus).'
          : ' Encaminhamento inadequado (sem bônus).';
    }
  } else if (r === 'TROTE') {
    if (grave) {
      v.kind = 'dispensou';
      v.warnings = 1;
      v.sindicancia = true;
      v.text = 'Emergência real tratada como trote.';
    } else {
      v.kind = 'trote_falso';
      v.notes = 1;
      v.text = 'Caso real (leve) marcado como trote.';
    }
  } else if (r === 'ORI') {
    if (grave) {
      v.kind = 'dispensou';
      v.warnings = 1;
      v.sindicancia = true;
      v.text = 'Caso que precisava de viatura foi dispensado.';
    } else {
      v.kind = 'falta';
      v.notes = 1;
      v.text = 'Orientação onde se esperava viatura (caso não grave): nota de auditoria.';
    }
  } else {
    // USA/USB fora do aceitável
    const ranks = okRes.filter((x) => x !== 'TROTE').map((x) => RANK[x]);
    const minR = Math.min(...ranks);
    const maxR = Math.max(...ranks);
    if (RANK[r] > maxR) {
      v.kind = 'excesso';
      v.notes = 1;
      v.text = r === 'USA' ? 'Excesso: USA para caso que não precisava.' : 'Excesso: viatura para caso leve.';
    } else if (RANK[r] < minR && r === 'USB' && decision.noUSA && okRes.includes('USA')) {
      // RM4: vermelho = USA; na falta dela, USB, com orientação até a chegada
      v.kind = 'defensavel';
      v.bonus = BONUS.USB;
      v.text = 'Sem USA livre: USB enviada, como prevê o protocolo. Mantenha a orientação até a chegada.';
    } else if (RANK[r] < minR) {
      v.kind = 'falta';
      v.warnings = 1;
      v.text = 'Falta: recurso abaixo do necessário.';
    }
  }

  // ---------------- complementos ----------------
  if (isDispatch(r) || (r === 'ORI' && okHas)) {
    const need = truth.sup ?? [];
    const missingSup = need.filter((s) => !decision.support.includes(s));
    if (missingSup.length && !truth.noPenalty) {
      v.safety = true;
      v.warnings += 1;
      v.text += ` Faltou apoio: ${missingSup.map((s) => (s === 'PM' ? 'Polícia Militar' : 'Bombeiros')).join(' e ')}.`;
    }
    if (day >= 9 && truth.dest && truth.dest.length && decision.dest && !truth.dest.includes(decision.dest) && !truth.noPenalty) {
      v.destWrong = true;
      v.notes += 1;
      v.text += ' Destino hospitalar inadequado.';
    }
  }

  // cor da classificação: errada = metade do bônus
  if (v.bonus > 0 && decision.color !== colorFor(truth.sev)) {
    v.bonus = Math.round(v.bonus / 2);
    v.text += ' Classificação de cor divergente (bônus reduzido).';
  }

  // hora de ouro
  if (truth.sev === 'vermelho' && (v.kind === 'correto' || v.kind === 'defensavel') && decision.realSec <= 60) {
    v.golden = true;
    v.bonus += 10;
  }

  if (truth.noPenalty) {
    v.notes = 0;
    v.warnings = 0;
    v.sindicancia = false;
    if (!okHas && v.kind !== 'trote_ok') v.kind = 'sem_penalidade';
  }
  return v;
}

export function verdictLabel(k: Verdict['kind']): string {
  switch (k) {
    case 'correto':
      return 'Correto';
    case 'defensavel':
      return 'Defensável';
    case 'sem_justificativa':
      return 'Sem justificativa';
    case 'excesso':
      return 'Excesso';
    case 'falta':
      return 'Falta';
    case 'trote_enviado':
      return 'Viatura p/ trote';
    case 'dispensou':
      return 'Emergência dispensada';
    case 'trote_ok':
      return 'Trote identificado';
    case 'trote_falso':
      return 'Falso trote';
    case 'sem_penalidade':
      return 'Sem penalidade';
  }
}

export function decisionLabel(d: Decision): string {
  let s = d.resource === 'ORI' ? 'Orientação' : d.resource === 'TROTE' ? 'Trote' : d.resource;
  if (d.unit) s += ` (${d.unit.replace(/(US[AB])(\d+)/, '$1 $2')})`;
  if (d.support.length) s += ' + ' + d.support.map((x) => (x === 'PM' ? 'PM' : 'Bombeiros')).join(' + ');
  if (d.dest) s += ' → ' + d.dest;
  if (d.resource === 'ORI' && d.referral) s += ' → ' + (d.referral === 'REG' ? 'Regional' : d.referral === 'CASA' ? 'casa' : d.referral);
  return s;
}
