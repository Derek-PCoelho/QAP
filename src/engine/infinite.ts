// Plantão Infinito: turnos gerados proceduralmente a partir do banco, com pontuação e ranking.
import type { DayDef, CallDef, GameState, VerdictKind, TruthSev } from './types';
import type { Content } from './content-api';
import { Rng, hashString, fmtTime } from './util';
import { buildGeneratedCall } from './generator';

const cache = new Map<string, DayDef>();

export function infiniteDay(c: Content, st: GameState): DayDef {
  const shift = st.infinite?.shifts ?? 1;
  const key = `${st.seed}:${shift}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const rng = new Rng(hashString(key));
  const n = Math.min(22, 9 + shift * 2);
  const calls: CallDef[] = [];
  let t = 7 * 60 + 4;
  const span = 18 * 60 + 30 - t;
  const gap = span / n;
  const pool = c.bank.filter((b) => (b.minDay ?? 1) <= 20);
  for (let i = 0; i < n && pool.length; i++) {
    const tpl = rng.pick(pool);
    const truths = tpl.truths.filter((x) => (x.minDay ?? 1) <= 20);
    const tr = rng.weighted(truths, (x) => x.weight ?? 1);
    const at = fmtTime(Math.round(t));
    const gen = { template: tpl.id, truth: tr.id, seed: rng.int(1, 2 ** 30), name: '', age: 0, sex: 'M' as const, addr: { rua: '', n: 0, bairro: '' }, num: '', caller: '' };
    const id = `inf${shift}_${i}`;
    const def = buildGeneratedCall(c, gen, id, 20, at);
    calls.push({ ...def, id, at });
    t += gap * (0.55 + rng.next() * 0.9);
    if (t > 18 * 60 + 40) break;
  }
  const day: DayDef = {
    day: 20,
    title: `Plantão Infinito · Turno ${shift}`,
    weekday: '—',
    newspaper: () => ({
      headline: `Turno ${shift}`,
      sub: `${calls.length} ligações previstas. Três advertências no mesmo turno e acabou.`,
      stories: [],
    }),
    calls,
    goal: { maxUSA: 3, bonus: 0 },
    flood: shift >= 3 && rng.chance(0.25),
    noVacancy: shift >= 2 && rng.chance(0.35),
  };
  cache.set(key, day);
  return day;
}

const SEV_W: Record<TruthSev, number> = { vermelho: 1.6, amarelo: 1.2, verde: 1, azul: 0.8, trote: 1 };

/** pontos por veredito revelado */
export function scoreVerdict(kind: VerdictKind, sev: TruthSev): number {
  const w = SEV_W[sev] ?? 1;
  switch (kind) {
    case 'correto':
      return Math.round(100 * w);
    case 'defensavel':
      return Math.round(110 * w);
    case 'trote_ok':
      return 70;
    case 'sem_justificativa':
      return Math.round(40 * w);
    case 'sem_penalidade':
      return 10;
    case 'excesso':
    case 'trote_enviado':
    case 'trote_falso':
      return -40;
    case 'falta':
    case 'dispensou':
      return -120;
  }
}
