// =============================================================================
// Intervenção: plantão extra na ambulância (USA 01), entre dois plantões da
// Regulação. Chega o chamado pelo rádio, a equipe chega na cena e o jogador
// escolhe o que fazer enquanto o paciente piora em tempo real. Paga mais que
// ficar em casa, mas custa a noite com a família e o sono antes da Regulação.
//
// 1.1: oxigênio por dispositivo (cateter, Venturi, reservatório, intubação),
// parada com leitura de ritmo (o monitor desenha, o jogador interpreta) e a
// história própria das noites (capítulos que avançam a cada noite feita).
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
/** último dia da campanha que ainda tem noite livre (o dia 20 não tem folga) */
export const FIELD_LAST_NIGHT = 19;
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

// -----------------------------------------------------------------------------
// tipos da 1.1 (estendem os de types.ts sem mexer neles: o conteúdo continua
// sendo um FieldCaseDef para o resto do jogo)
// -----------------------------------------------------------------------------
/** ritmo da parada (e o sinusal depois do retorno da circulação) */
export type Rhythm = 'FV' | 'TV' | 'ASSISTOLIA' | 'AESP' | 'SINUSAL';
export const RHYTHM_LABEL: Record<Rhythm, string> = {
  FV: 'Fibrilação ventricular',
  TV: 'Taquicardia ventricular sem pulso',
  ASSISTOLIA: 'Assistolia',
  AESP: 'Atividade elétrica sem pulso',
  SINUSAL: 'Ritmo sinusal, com pulso',
};
export const SHOCKABLE: Rhythm[] = ['FV', 'TV'];
/** o que o monitor mostra de frequência em cada ritmo de parada (contagem de complexos, não pulso) */
const MONITOR_FC: Record<Exclude<Rhythm, 'SINUSAL'>, string> = { FV: '---', TV: '180', ASSISTOLIA: '0', AESP: '44' };

/** dispositivos de oxigênio e via aérea */
export type O2Kind = 'cateter' | 'venturi' | 'reservatorio' | 'iot';
export type O2Device = Exclude<O2Kind, 'iot'>;
const O2_ORDER: O2Device[] = ['cateter', 'venturi', 'reservatorio'];
/** quanto cada dispositivo sobe a SpO2 (pontos) — desenho do jogo, coerente com AP15–AP17 // [validar] */
export const O2_GAIN: Record<O2Device, number> = { cateter: 4, venturi: 7, reservatorio: 12 };
export const O2_LABEL: Record<O2Kind, string> = {
  cateter: 'Cateter nasal (1–4 L/min)',
  venturi: 'Máscara de Venturi (24–50%)',
  reservatorio: 'Máscara com reservatório (10–15 L/min)',
  iot: 'Intubação orotraqueal',
};
const O2_COST: Record<O2Kind, number> = { cateter: 3, venturi: 4, reservatorio: 3, iot: 10 };

/** oxigenação do caso: a saturação em ar ambiente e o que a fonte pede */
export interface FieldOxy {
  /** SpO2 em ar ambiente (%) */
  sat: number;
  /** abaixo disto o oxigênio é indicado (padrão 94; infarto: 90, decisão do jogador) */
  need?: number;
  /** DPOC: alvo 88–92%; acima disso, hipercapnia */
  copd?: boolean;
  /** infarto: oxigênio com saturação normal é erro leve */
  iam?: boolean;
  /** o protocolo pede pelo menos este dispositivo (trauma grave/choque: reservatório) */
  min?: O2Device;
  /** não sustenta a via aérea (Glasgow ≤ 8, exaustão, apneia): só a intubação resolve */
  iot?: boolean;
  /** pré-requisitos para pôr o oxigênio (ex.: EPI na intoxicação) */
  needs?: string[];
}

/** a parada: ritmo inicial e mudanças de ritmo durante a RCP (cada regra acontece uma vez) */
export interface FieldArrest {
  start: Rhythm;
  /** depois destas ações, com o ritmo em `from`, o ritmo vira `to` (a primeira regra que bate) */
  rules?: { from: Rhythm; to: Rhythm; after: string[]; say?: string }[];
}

export type FlagVal = boolean | number | string;

export interface FieldActionX extends FieldActionDef {
  /** só é a conduta certa nestes ritmos (fora deles: `wrongSay`, `wrongDelta`, e não conta como feita) */
  when?: Rhythm[];
  wrongSay?: string;
  wrongDelta?: number;
  /** ao terminar, também conta como esta ação (ex.: dose errada que ainda assim antiagrega) */
  satisfies?: string;
  /** marcas para a campanha (história das noites) */
  sets?: Record<string, FlagVal>;
  /** gerada pelo motor: dispositivo de oxigênio / intubação */
  o2?: O2Kind;
}

/** contexto para as falas condicionais da história */
export interface StoryCtx {
  day: number;
  night: number;
  flag: (k: string) => FlagVal | undefined;
}
export interface StoryLine {
  who: string;
  text: string;
  when?: (s: StoryCtx) => boolean;
}
/** capítulo da história das noites: a ocorrência especial carrega o capítulo */
export interface FieldStory {
  chapter: number;
  title: string;
  /** não aparece antes deste dia (para não brigar com a campanha) */
  minDay?: number;
  /** o chamado do capítulo não acontece antes desta hora (minutos desde 00:00 da noite; passa de 1440 depois da meia-noite) */
  at?: number;
  /** quem está na viatura nesta noite, se mudar */
  crew?: string;
  /** rádio e viatura no começo da noite */
  open?: StoryLine[];
  /** logo antes da ocorrência do capítulo */
  before?: StoryLine[];
  /** o que acontece no fim da noite */
  epilogue: StoryLine[];
  /** marcas por desfecho da ocorrência do capítulo */
  flags?: Partial<Record<FieldOutcome, Record<string, FlagVal>>>;
  /** depois do desfecho: falas soltas das noites seguintes (só no último capítulo) */
  afterwards?: StoryLine[];
}

export interface FieldCaseX extends FieldCaseDef {
  actions: FieldActionX[];
  oxy?: FieldOxy;
  arrest?: FieldArrest;
  /** por que este destino não era o certo (aparece no resultado) */
  destNote?: Partial<Record<FieldDest, string>>;
  story?: FieldStory;
}

export interface FieldCaseRTX extends FieldCaseRT {
  rhythm?: Rhythm;
  /** dispositivo de O2 em uso */
  o2?: O2Kind;
  /** SpO2 agora (número) */
  sat?: number;
  /** oxigenação no alvo */
  o2ok?: boolean;
  /** melhorou, mas abaixo do alvo */
  o2partial?: boolean;
  /** regras de mudança de ritmo que já aconteceram (cada uma acontece uma vez) */
  fired?: number[];
}

export interface FieldShiftX extends FieldShift {
  /** história das noites: número da noite, capítulos desta noite e o fim da noite */
  story?: {
    night: number;
    /** dia da campanha em que a noite aconteceu */
    day: number;
    chapters: { id: string; chapter: number; title: string }[];
    crew?: string;
    /** as marcas da campanha que as falas da história consultam (cópia do começo da noite) */
    base: Record<string, FlagVal>;
  };
  /** marcas para a campanha (gravadas em st.flags no fim da noite) */
  flags?: Record<string, FlagVal>;
}

export interface FieldActionView extends FieldActionX {
  state: 'ok' | 'feito' | 'ocupado' | 'falta' | 'bloqueado';
  reason?: string;
  /** 0..1 enquanto a equipe faz */
  progress?: number;
}

function fmtClock(min: number): string {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** valor de um sinal no monitor agora ('--' se ainda não medido) */
export function vitalShown(d: FieldCaseDef, rt: FieldCaseRT, k: FieldVital): string {
  if (!rt.shown.includes(k)) return '--';
  const x = rt as FieldCaseRTX;
  const dx = d as FieldCaseX;
  if (k === 'sat' && x.sat !== undefined && !dx.arrest) return `${x.sat}%`;
  if (k === 'ritmo' && dx.arrest) return x.rhythm === 'SINUSAL' ? (d.vitalsAfter?.ritmo ?? RHYTHM_LABEL.SINUSAL) : '';
  // na parada o monitor conta os complexos que vê (não é pulso): FV não tem contagem
  if (k === 'fc' && dx.arrest && x.rhythm && x.rhythm !== 'SINUSAL') return MONITOR_FC[x.rhythm];
  return (rt.stable && d.vitalsAfter?.[k]) || d.vitals[k] || '--';
}

// -----------------------------------------------------------------------------
// oxigênio: qual é o certo e o que cada dispositivo faz
// -----------------------------------------------------------------------------
function oxyNeed(o: FieldOxy): number {
  return o.copd ? 88 : (o.need ?? 94);
}
/** só a intubação resolve? */
function needsIot(o: FieldOxy): boolean {
  return !!o.iot || o.sat + O2_GAIN.reservatorio < oxyNeed(o);
}
/** oxigênio é indicado neste caso? */
export function o2Indicated(o: FieldOxy): boolean {
  return o.sat < oxyNeed(o) || !!o.min || !!o.iot;
}
/** SpO2 com o dispositivo */
function satWith(o: FieldOxy, k: O2Kind): number {
  if (k === 'iot') return o.iot || needsIot(o) ? 97 : Math.min(99, o.sat + O2_GAIN.reservatorio);
  let s = o.sat + O2_GAIN[k];
  // a Venturi é titulável: no DPOC a equipe ajusta a fração para ficar no alvo
  if (o.copd && k === 'venturi' && s >= 88) s = Math.min(s, 90);
  return Math.min(99, s);
}
/** o dispositivo resolve a oxigenação? */
function o2Resolves(o: FieldOxy, k: O2Kind): boolean {
  if (needsIot(o)) return k === 'iot';
  if (k === 'iot') return false;
  if (o.min && O2_ORDER.indexOf(k) < O2_ORDER.indexOf(o.min)) return false;
  const s = satWith(o, k);
  if (o.copd) return s >= 88 && s <= 92;
  return s >= oxyNeed(o);
}
/** o dispositivo ideal (o mais simples que resolve); undefined se o2 não é indicado */
export function idealO2(o: FieldOxy | undefined): O2Kind | undefined {
  if (!o || !o2Indicated(o)) return undefined;
  if (needsIot(o)) return 'iot';
  if (o.copd) return o2Resolves(o, 'venturi') ? 'venturi' : O2_ORDER.find((k) => o2Resolves(o, k));
  return O2_ORDER.find((k) => o2Resolves(o, k));
}

/** ações de oxigênio e via aérea geradas pelo motor para o caso */
export function oxyActions(d: FieldCaseX): FieldActionX[] {
  const o = d.oxy;
  if (!o || d.arrest || d.prank) return [];
  const ideal = idealO2(o);
  const ind = o2Indicated(o);
  const out: FieldActionX[] = [];
  const kinds: O2Kind[] = d.actions.some((a) => a.id.startsWith('intubar')) ? [...O2_ORDER] : [...O2_ORDER, 'iot'];
  for (const k of kinds) {
    let kind: FieldActionX['kind'];
    if (k === ideal) kind = 'critico';
    else if (k === 'iot') kind = needsIot(o) ? 'critico' : 'dano';
    else if (!ind) kind = o.iam ? 'dano' : 'neutro';
    else if (o.copd && satWith(o, k) > 92) kind = 'dano';
    else kind = o2Resolves(o, k) ? 'ajuda' : 'neutro';
    out.push({
      id: k === 'iot' ? 'iot' : 'o2_' + k,
      label: O2_LABEL[k],
      group: k === 'iot' ? 'via' : 'resp',
      cost: O2_COST[k],
      kind,
      o2: k,
      needs: o.needs,
      shows: ['sat'],
      say: '',
    });
  }
  return out;
}

// -----------------------------------------------------------------------------
// história das noites
// -----------------------------------------------------------------------------
/** capítulos (ocorrências especiais com `story`), em ordem */
export function storyCases(all: FieldCaseDef[]): FieldCaseX[] {
  return (all as FieldCaseX[]).filter((c) => c.story).sort((a, b) => a.story!.chapter - b.story!.chapter);
}

/** marcas da campanha que as falas da história consultam (além das "noite_*") */
const STORY_KEYS = ['henrique_afastado', 'denunciou_henrique', 'encobriu_henrique', 'omitiu_henrique', 'cartao_carla', 'materia_publicada'];

function storyLines(ls: StoryLine[] | undefined, ctx: StoryCtx): { who: string; text: string }[] {
  return (ls ?? []).filter((l) => !l.when || l.when(ctx)).map((l) => ({ who: l.who, text: l.text }));
}

/** quantas noites a pessoa já fez na Intervenção */
export function nightsDone(st: GameState): number {
  return Number(st.flags['noites_intervencao']) || 0;
}

/** capítulos desta noite: o próximo (e mais um, se já não houver noites para todos) */
export function pickChapters(st: GameState, all: FieldCaseDef[]): FieldCaseX[] {
  const pending = storyCases(all).filter((c) => !st.flags['field_' + c.id]);
  const out: FieldCaseX[] = [];
  const day = Math.max(1, st.day);
  const ok = (c?: FieldCaseX) => !!c && (c.story!.minDay ?? 1) <= day;
  if (!ok(pending[0])) return out;
  out.push(pending[0]);
  // começou tarde: dois capítulos numa noite, para o desfecho ainda caber até o dia 19
  const nightsLeft = Math.max(1, FIELD_LAST_NIGHT - day + 1);
  if (pending.length > nightsLeft && ok(pending[1])) out.push(pending[1]);
  return out;
}

export function createFieldShift(
  st: GameState,
  all: FieldCaseDef[],
  opts: { special?: string[]; radio?: { before: number; who: string; text: string }[]; n?: number } = {},
): FieldShiftX {
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
  // história das noites: o capítulo é a última ocorrência da noite (dois capítulos: as duas últimas)
  const night = nightsDone(st) + 1;
  const chapters = pickChapters(st, all);
  if (chapters.length) {
    // o trote não divide a noite com a história
    const keep = picked.filter((id) => !all.find((c) => c.id === id)?.prank || special.includes(id));
    picked.length = 0;
    picked.push(...keep.slice(0, Math.max(1, n - chapters.length)));
    for (const c of chapters) picked.push(c.id);
  }
  // meio plantão noturno, das 19h à 1h
  const clock: number[] = [];
  let t = 19 * 60 + 20 + rng.int(0, 30);
  for (let i = 0; i < picked.length; i++) {
    clock.push(t);
    t += 95 + rng.int(0, 45);
  }
  // capítulo com hora marcada (ex.: depois da meia-noite)
  for (const c of chapters) {
    const at = picked.indexOf(c.id);
    if (c.story!.at !== undefined && at >= 0 && clock[at] < c.story!.at) clock[at] = c.story!.at;
  }
  const extra: FieldShift['extra'] = {};
  for (const r of opts.radio ?? []) (extra[r.before] ??= []).push({ who: r.who, text: r.text });
  const ctx: StoryCtx = { day: st.day, night, flag: (k) => st.flags[k] };
  const lines = (ls?: StoryLine[]) => storyLines(ls, ctx);
  let crew: string | undefined;
  chapters.forEach((c, i) => {
    const s = c.story!;
    const at = picked.indexOf(c.id);
    if (i === 0 && s.open) (extra[0] ??= []).unshift(...lines(s.open));
    if (s.before) (extra[at] ??= []).push(...lines(s.before));
    if (s.crew) crew = s.crew;
  });
  // o fim da noite depende do que acontecer nela: guarda só as marcas que as falas consultam
  const base: Record<string, FlagVal> = {};
  for (const [k, v] of Object.entries(st.flags)) if (k.startsWith('noite_') || STORY_KEYS.includes(k)) base[k] = v;
  // depois do desfecho: uma fala solta de vez em quando, para a cidade continuar viva
  if (!chapters.length) {
    const last = storyCases(all).slice(-1)[0];
    if (last && seen(last.id)) {
      const after = lines(last.story!.afterwards);
      if (after.length) (extra[0] ??= []).push(after[(night + st.day) % after.length]);
    }
  }
  return {
    cases: picked,
    idx: 0,
    phase: 'radio',
    results: [],
    clock,
    extra,
    story: { night, day: st.day, chapters: chapters.map((c) => ({ id: c.id, chapter: c.story!.chapter, title: c.story!.title })), crew, base },
    flags: {},
  };
}

export class FieldSim {
  f: FieldShiftX;
  defs: Map<string, FieldCaseX>;
  diff: Difficulty;
  unit: string;

  /** tokens de gênero/nome ({dr}, {nome}...), resolvidos por quem cria o simulador */
  tokens?: (t: string) => string;

  private gen = new Map<string, FieldActionX[]>();

  constructor(f: FieldShift, cases: FieldCaseDef[], diff: Difficulty = 'padrao', unit = 'USA 01', tokens?: (t: string) => string) {
    this.f = f as FieldShiftX;
    this.defs = new Map((cases as FieldCaseX[]).map((c) => [c.id, c]));
    this.diff = diff;
    this.unit = unit;
    this.tokens = tokens;
  }

  get def(): FieldCaseX | undefined {
    return this.defs.get(this.f.cases[this.f.idx]);
  }
  get rt(): FieldCaseRTX | undefined {
    return this.f.rt as FieldCaseRTX | undefined;
  }
  /** todas as ações do caso: as escritas e as de oxigênio geradas pelo motor */
  actionsOf(d: FieldCaseX | undefined = this.def): FieldActionX[] {
    if (!d) return [];
    let g = this.gen.get(d.id);
    if (!g) this.gen.set(d.id, (g = oxyActions(d)));
    return g.length ? [...d.actions, ...g] : d.actions;
  }
  private action(id: string): FieldActionX | undefined {
    return this.actionsOf().find((x) => x.id === id);
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
  /** capítulo da história desta ocorrência, se houver */
  chapter(): FieldStory | undefined {
    return this.def?.story;
  }

  // ---------------------------------------------------------------------------
  // ciclo da ocorrência
  // ---------------------------------------------------------------------------
  /** "QSL, a caminho": sai do rádio e chega na cena */
  begin(): void {
    const d = this.def;
    if (!d || this.f.phase !== 'radio') return;
    const rt: FieldCaseRTX = {
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
    if (d.arrest) rt.rhythm = d.arrest.start;
    if (d.oxy) rt.sat = d.oxy.sat;
    for (const s of d.see) rt.log.push({ t: 0, text: this.fill(s), kind: 'achado' });
    if (d.unsafe) rt.log.push({ t: 0, who: 'BENÉ', text: this.fill('{Dr}, a cena não tá segura. O cara ainda tá lá dentro.'), kind: 'equipe' });
    this.f.rt = rt;
    this.f.phase = 'cena';
  }

  criticals(d = this.def): FieldActionX[] {
    return this.actionsOf(d).filter((a) => a.kind === 'critico');
  }

  /** a crítica está cumprida? (o oxigênio conta pelo alvo atingido, com o dispositivo que for) */
  isDone(a: FieldActionX): boolean {
    const rt = this.rt;
    if (!rt) return false;
    if (a.o2) return !!rt.o2ok;
    return rt.done.includes(a.id);
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
    let got = 0;
    for (const c of crit) got += this.isDone(c) ? 1 : c.o2 && rt.o2partial ? 0.5 : 0;
    const k = crit.length ? got / crit.length : 0;
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
      const a = this.action(rt.busy.id);
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
    for (const a of this.actionsOf(d)) {
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
        const miss = a.needs.filter((x) => !rt.done.includes(x)).map((x) => this.actionsOf(d).find((y) => y.id === x)?.label ?? x);
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
    const a = this.action(id);
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

  private mergeScene(sc: FieldActionDef['scene']): void {
    const rt = this.rt!;
    if (!sc) return;
    const { patient, ...rest } = sc;
    Object.assign(rt.scene, rest);
    if (patient !== undefined) {
      const was = rt.scene.patient;
      // equipamento soma (o colar não some quando entra o soro)
      const gear = patient?.gear ? [...new Set([...(was?.gear ?? []), ...patient.gear])] : was?.gear;
      rt.scene.patient = patient === null ? null : { ...(was ?? { pose: 'deitado' }), ...patient, ...(gear ? { gear } : {}) };
    }
  }

  /** oxigênio e via aérea: o efeito depende do caso */
  private completeO2(a: FieldActionX): void {
    const d = this.def!;
    const rt = this.rt!;
    const o = d.oxy!;
    const k = a.o2!;
    // troca de dispositivo: o anterior sai
    rt.done = rt.done.filter((x) => !x.startsWith('o2_') && x !== 'iot');
    rt.done.push(a.id);
    rt.o2 = k;
    if (!rt.shown.includes('sat')) rt.shown.push('sat');
    const s = satWith(o, k);
    const before = rt.sat ?? o.sat;
    const say = (text: string, kind: 'acao' | 'alerta' | 'achado' = 'acao') => rt.log.push({ t: rt.t, text: this.fill(text), kind });
    const hurt = (delta: number) => {
      rt.harm++;
      rt.stab = clamp(rt.stab + delta, 0, 100);
    };
    rt.o2ok = false;
    rt.o2partial = false;
    if (k === 'iot') {
      if (needsIot(o)) {
        rt.o2ok = true;
        rt.sat = s;
        rt.stab = clamp(rt.stab + 10, 0, 100);
        this.mergeScene({ patient: { gear: ['ambu'] } });
        say(`Laringoscopia, tubo, cuff, ausculta dos dois lados. Ventilação de 10 a 12 por minuto, sem hiperventilar. SpO₂ ${s}%. Via aérea definitiva.`);
      } else {
        hurt(-12);
        rt.sat = Math.max(before, Math.min(99, o.sat + 2));
        this.mergeScene({ patient: { gear: ['ambu'], signs: ['olhos_fechados'] } });
        say('O paciente respirava sozinho e protegia a via aérea. Sedar e intubar sem indicação trouxe a pressão para baixo e dez minutos de risco à toa. Intubação é para quem não sustenta.', 'alerta');
      }
      return;
    }
    this.mergeScene({ patient: { gear: k === 'cateter' ? ['oximetro'] : ['mascara_o2'] } });
    rt.sat = s;
    if (!o2Indicated(o)) {
      if (o.iam) {
        hurt(-4);
        say(`SpO₂ já estava em ${o.sat}%. No infarto, oxigênio só com saturação abaixo de 90%: com saturação normal não ajuda e pode aumentar a lesão do músculo.`, 'alerta');
      } else say(`SpO₂ em ${o.sat}% no ar ambiente: o oxigênio não muda nada aqui. Foram ${a.cost} segundos.`, 'achado');
      return;
    }
    if (needsIot(o)) {
      rt.o2partial = true;
      rt.stab = clamp(rt.stab + 2, 0, 100);
      say(`SpO₂ sobe para ${s}%, mas não segura: ${o.iot ? 'ele não protege a via aérea (ronco, respiração lenta, Glasgow baixo)' : 'nem a máscara mais forte resolve'}. Máscara não resolve quem não sustenta.`, 'alerta');
      return;
    }
    if (o.copd && s > 92) {
      hurt(-10);
      this.mergeScene({ patient: { signs: ['olhos_fechados'] } });
      say(`SpO₂ ${s}%: bonito no monitor, ruim no paciente. Em poucos minutos ele fica sonolento, responde devagar: o CO₂ está subindo. No DPOC o alvo é 88 a 92%.`, 'alerta');
      return;
    }
    if (o2Resolves(o, k)) {
      rt.o2ok = true;
      rt.stab = clamp(rt.stab + 6, 0, 100);
      say(o.copd ? `SpO₂ ${s}%: dentro do alvo do DPOC (88 a 92%). Ele continua acordado e conversando.` : `SpO₂ sobe de ${before}% para ${s}%. No alvo.`);
      return;
    }
    rt.o2partial = true;
    rt.stab = clamp(rt.stab + 2, 0, 100);
    if (o.min && O2_ORDER.indexOf(k) < O2_ORDER.indexOf(o.min)) say(`SpO₂ ${s}%. Em trauma grave e choque, o protocolo pede alto fluxo: máscara com reservatório.`, 'achado');
    else say(`SpO₂ sobe para ${s}%: melhorou, mas abaixo do alvo de ${oxyNeed(o)}%.`, 'achado');
  }

  private complete(a: FieldActionX): void {
    const d = this.def!;
    const rt = this.rt!;
    if (a.focus) rt.focusUntil = rt.t + 3;
    if (a.o2) {
      this.completeO2(a);
      this.checkStable();
      return;
    }
    // conduta de parada fora do ritmo certo: não conta, e às vezes piora
    if (a.when && rt.rhythm && !a.when.includes(rt.rhythm)) {
      const delta = a.wrongDelta ?? -10;
      if (delta < 0) rt.harm++;
      rt.stab = clamp(rt.stab + delta, 0, 100);
      rt.log.push({ t: rt.t, text: this.fill(a.wrongSay ?? 'Não era a conduta para este ritmo.'), kind: delta < 0 ? 'alerta' : 'achado' });
      return;
    }
    rt.done.push(a.id);
    if (a.satisfies && !rt.done.includes(a.satisfies)) rt.done.push(a.satisfies);
    if (a.delta) rt.stab = clamp(rt.stab + a.delta, 0, 100);
    if (a.kind === 'dano') rt.harm++;
    // "ver sinais vitais" sempre traz a saturação junto
    const shows = [...(a.shows ?? [])];
    if ((shows.includes('pa') || shows.includes('fc')) && d.vitals.sat !== undefined && !shows.includes('sat')) shows.push('sat');
    for (const s of shows) if (!rt.shown.includes(s)) rt.shown.push(s);
    this.mergeScene(a.scene);
    if (a.sets) Object.assign((this.f.flags ??= {}), a.sets);
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
    // mudança de ritmo durante a RCP
    if (d.arrest?.rules && rt.rhythm) {
      const fired = (rt.fired ??= []);
      const i = d.arrest.rules.findIndex((x, n) => !fired.includes(n) && x.from === rt.rhythm && x.after.every((id) => rt.done.includes(id)));
      const r = d.arrest.rules[i];
      if (r) {
        fired.push(i);
        rt.rhythm = r.to;
        rt.log.push({ t: rt.t, text: this.fill(r.say ?? 'Checagem de ritmo depois de dois minutos de massagem: o traçado mudou. Pulso? Nada.'), kind: 'alerta' });
      }
    }
    this.checkStable();
  }

  private checkStable(): void {
    const d = this.def!;
    const rt = this.rt!;
    if (rt.stable || d.prank || rt.outcome) return;
    const crit = this.criticals();
    if (crit.length && crit.every((c) => this.isDone(c))) {
      rt.stable = true;
      if (d.arrest) rt.rhythm = 'SINUSAL';
      if (d.oxy && rt.sat !== undefined) rt.sat = Math.min(d.oxy.copd ? 92 : 99, rt.sat + (d.oxy.copd ? 0 : 1));
      rt.log.push({
        t: rt.t,
        text: d.arrest ? 'Pulso carotídeo! Voltou. Agora é cuidar do pós-parada e levar.' : d.scoop ? 'O essencial está feito. Agora é chegar rápido ao hospital.' : 'Paciente estabilizado. Pode transportar.',
        kind: 'fim',
      });
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
    const sf = d.story?.flags?.[o];
    if (sf) Object.assign((this.f.flags ??= {}), sf);
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

  /** o fim da noite da história (depende do que aconteceu nela) */
  epilogue(): { who: string; text: string }[] {
    const s = this.f.story;
    if (!s || !s.chapters.length) return [];
    const flags = { ...s.base, ...(this.f.flags ?? {}) };
    const ctx: StoryCtx = { day: s.day, night: s.night, flag: (k) => flags[k] };
    const out: { who: string; text: string }[] = [];
    for (const c of s.chapters) {
      const d = this.defs.get(c.id);
      // capítulo que não chegou a acontecer (noite interrompida) não tem fim
      if (!d?.story || !this.f.results.some((r) => r.id === c.id)) continue;
      out.push(...storyLines(d.story.epilogue, ctx));
    }
    return out;
  }

  /** marcas que a noite deixa na campanha (quem chama grava em st.flags no fim da noite) */
  storyFlags(): Record<string, FlagVal> {
    const out: Record<string, FlagVal> = {};
    const s = this.f.story;
    if (s) {
      out['noites_intervencao'] = s.night;
      for (const c of s.chapters) if (this.f.results.some((r) => r.id === c.id)) out['noite_cap' + c.chapter] = true;
    }
    return { ...out, ...(this.f.flags ?? {}) };
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
        if (sim.isDone(c)) continue;
        // lê o traçado: não dá choque em ritmo não chocável
        if (c.when && rt.rhythm && !c.when.includes(rt.rhythm)) continue;
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
