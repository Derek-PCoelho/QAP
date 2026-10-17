// Avaliação dos finais (ruim, normal, bom, secreto) e epílogos por fio.
import type { GameState, EndingInfo, KeyPatient } from './types';
import type { Content } from './content-api';
import { makeCtx } from './state';
import { txt, resolveTokens } from './text';

export const KEY_PATIENTS: { id: KeyPatient; name: string }[] = [
  { id: 'antonio', name: 'Seu Antônio' },
  { id: 'davi_marcia', name: 'Liam / Tia Márcia' },
  { id: 'rosangela', name: 'Rosângela' },
  { id: 'juliana', name: 'Juliana' },
  { id: 'jairo', name: 'Seu Jairo' },
  { id: 'osvaldo', name: 'Seu Osvaldo' },
  { id: 'cida', name: 'Dona Cida' },
];

export function keysSaved(st: GameState): number {
  return KEY_PATIENTS.filter((k) => st.keys[k.id] === 'salvo').length;
}

export function sourcesCount(st: GameState): number {
  return Object.values(st.sources).filter(Boolean).length;
}

export function familyDead(st: GameState): boolean {
  return Object.values(st.family).some((m) => m.status === 'morto');
}

export function familyAllWell(st: GameState): boolean {
  return Object.values(st.family).every((m) => m.status === 'bem');
}

export interface EndingCheck {
  bad: boolean;
  badReasons: string[];
  good: boolean;
  goodMissing: string[];
  secretEligible: boolean;
}

export function checkEnding(st: GameState): EndingCheck {
  const badReasons: string[] = [];
  if (familyDead(st)) badReasons.push('um membro da família morreu');
  if (st.vars.lacos <= 2 || st.flags['lucia_foi_embora']) badReasons.push(resolveTokens('{oconj} foi embora', st.gender, st));
  if (st.vars.integridade <= 2) badReasons.push('seu nome foi exposto (Integridade ≤ 2)');
  const bad = badReasons.length > 0;
  const goodMissing: string[] = [];
  if (!familyAllWell(st)) goodMissing.push('família toda bem');
  if (st.vars.lacos < 7) goodMissing.push('Laços ≥ 7');
  if (st.vars.integridade < 6) goodMissing.push('Integridade ≥ 6');
  if (keysSaved(st) < 4) goodMissing.push('4 pacientes-chave salvos');
  if (!(st.flags['materia_publicada'] && sourcesCount(st) >= 2)) goodMissing.push('matéria da Carla com 2+ fontes');
  const good = !bad && goodMissing.length === 0;
  const secretEligible = !bad && !!st.flags['peixoto_caiu'] && st.vars.integridade >= 3 && st.vars.integridade <= 6 && st.money > 500;
  return { bad, badReasons, good, goodMissing, secretEligible };
}

export function buildEnding(st: GameState, c: Content, chair?: 'assinar' | 'recusar'): EndingInfo {
  const chk = checkEnding(st);
  const ctx = makeCtx(st);
  const threads = c.endings.threads
    .filter((t) => !t.when || t.when(ctx))
    .map((t) => {
      const ok = t.ok(ctx);
      return { id: t.id, ok, text: resolveTokens(txt(ok ? t.good : t.bad, ctx), st.gender, st) };
    });
  const R = (arr: string[]) => arr.map((x) => resolveTokens(x, st.gender, st));
  if (chk.bad) return { kind: 'ruim', lines: R(c.endings.ruim(ctx)), threads };
  if (chk.secretEligible && chair === 'assinar') {
    return { kind: 'secreto', chairOffered: true, chairSigned: true, lines: R(c.endings.secreto(ctx)), threads };
  }
  const extra = chk.secretEligible && chair === 'recusar' ? ['Ofereceram a cadeira. ' + (st.gender === 'M' ? 'Ele' : 'Ela') + ' preferiu o telefone.'] : [];
  if (chk.good) return { kind: 'bom', chairOffered: chk.secretEligible, chairSigned: false, lines: [...R(c.endings.bom(ctx)), ...extra], threads };
  return { kind: 'normal', chairOffered: chk.secretEligible, chairSigned: false, lines: [...R(c.endings.normal(ctx)), ...extra], threads };
}
