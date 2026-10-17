// =============================================================================
// Kit de autoria do banco de ligações variáveis ("mesma abertura, verdades
// diferentes"). Cada modelo (TemplateDef) tem UMA abertura falada; cada verdade
// escreve as respostas, ruídos, pistas e inconsistências que a separam das outras.
//
// Regras do kit:
// - Aleatoriedade só por p.pick / p.rand (semente da partida). Nada de Math.random.
// - Pistas de manual (lm) e perguntas obrigatórias (must) se ajustam ao dia:
//   regra/pergunta que ainda não existe no dia some sozinha.
// - Endereço: casos reais sempre recebem endereço válido (addrOk); trotes usam o
//   endereço sorteado pelo gerador (que pode ser inexistente).
// - Tokens {dr}, {Dr}, {m:...|...} falam do PROTAGONISTA. Paciente e quem liga
//   são flexionados aqui, em JS (p.o, p.ele, p.g(), p.cg()...).
// =============================================================================
import type { TemplateDef, TemplateParams } from '../../engine/content-api';
import type {
  AddrIn, AmbientId, AnswerIn, BoxId, CallDef, CallerType, DiaryDef, ExtraQ, Gender, GuideRef, LineIn, LinkDef,
  PatientIn, RadioTexts, TruthDef, VideoHint, VoiceId, WorsenDef,
} from '../../engine/types';
import { resolveAddress } from '../../engine/city/map';
import { MANUAL, NAMES, QUESTIONS } from '../base';

// ----------------------------------------------------------------------------
// Dia em que cada regra do manual / pergunta base aparece
// ----------------------------------------------------------------------------
export const RULE_DAY = new Map<string, number>();
for (const pg of MANUAL) for (const r of pg.rules) RULE_DAY.set(r.id, pg.day);
export const Q_DAY = new Map<string, number>();
for (const q of QUESTIONS) Q_DAY.set(q.id, q.day ?? 1);

// ----------------------------------------------------------------------------
// Pessoa: paciente + quem liga, já flexionados
// ----------------------------------------------------------------------------
export interface P extends TemplateParams {
  /** paciente é mulher */
  F: boolean;
  /** flexão pelo sexo do paciente */
  g: (m: string, f: string) => string;
  /** flexão pelo sexo de quem liga */
  cg: (m: string, f: string) => string;
  /** terminação do paciente: acordad${p.o} */
  o: string;
  /** terminação de quem liga: nervos${p.co} */
  co: string;
  ele: string;
  Ele: string;
  dele: string;
  um: string;
  /** paciente idoso (≥ 60) / criança (≤ 12) */
  old: boolean;
  kid: boolean;
  /** quem liga é o próprio paciente */
  self: boolean;
  /** marcador de fala do paciente: "JOSÉ" (use `${p.PT}: ...`) */
  PT: string;
  /** como quem liga chama o paciente pelo nome: "Seu José", "Dona Maria", "José" */
  nome: string;
  /** descrição curta para a nota da Simone: "Senhora", "Rapaz", "Menino", "Bebê" */
  tipo: string;
  /** como quem liga se refere ao paciente: "minha mãe", "meu vizinho", "um senhor" */
  quem: string;
  Quem: string;
  /** vocativo de quem liga para o paciente: "mãe", "vô", "José" */
  voc: string;
  /** quem liga */
  cFirst: string;
  cF: boolean;
  cWord: string;
  caller: string;
  CT: string;
  /** voz padrão de quem liga */
  voz: VoiceId;
  /** idade falada: "72 anos", "3 aninhos", "8 meses" */
  anos: string;
  /** meses (bebês) */
  meses: number;
  /** endereço válido do caso (sem ponto de referência) */
  addrOk: AddrIn;
  /** ponto de referência sorteado */
  refPoint: string;
  /** número fixo em [0,1) para variações cosméticas que não dependem da verdade */
  v: number;
  /** mesma pessoa com outra idade (determinístico, sem consumir sorteio) */
  at: (lo: number, hi: number) => P;
  /** paciente para a ficha */
  pt: () => PatientIn;
}

interface Fixed {
  ref: string;
  mesesRaw: number;
  v: number;
  addr: AddrIn;
}

/** Pontos de referência genéricos (resposta padrão para "referencia"). */
const REFS = [
  'Casa de muro amarelo, portão de grade, do lado da padaria.',
  'Em frente ao ponto de ônibus, casa com um pé de manga na calçada.',
  'Perto do mercadinho do Seu Tonhão, portão marrom.',
  'Esquina com a lotérica. A casa do lado tem um cachorro preto.',
  'Do lado da igreja evangélica, sobrado azul.',
  'Atrás da escola, casa de esquina com muro pichado.',
  'Na frente da academia, portão branco, interfone quebrado.',
  'Do lado do salão de beleza, a casa com a garagem aberta.',
  'Perto do campinho de futebol, casa verde.',
  'Vila de casas, a terceira. Tem um varal na frente.',
  'Do lado da borracharia, portão de madeira.',
  'Prédio de três andares, apartamento 12. O porteiro sabe.',
  'Em frente à farmácia, casa com grade vermelha.',
  'Casa rosa com uma roseira na frente, perto do bar do Zé.',
  'Fundo do terreno, passa pelo corredor do lado da oficina.',
  'Sobrado cinza, segundo andar, a escada é por fora.',
];

/** Faixas internas seguras de endereços válidos (tabela do CONTEUDO.md). */
const SAFE: { rua: string; bairro: string; a: number; b: number }[] = [
  { rua: 'Rua Paineira', bairro: 'Santa Luzia', a: 40, b: 1950 },
  { rua: 'Rua Ipê', bairro: 'Jardim Norte', a: 40, b: 2150 },
  { rua: 'Rua dos Bem-te-vis', bairro: 'Bela Vista', a: 40, b: 2150 },
  { rua: 'Rua Sete de Setembro', bairro: 'Jardim Norte', a: 2050, b: 4150 },
  { rua: 'Rua das Indústrias', bairro: 'Distrito Industrial', a: 40, b: 1950 },
  { rua: 'Rua Jacarandá', bairro: 'Jardim Primavera', a: 40, b: 2150 },
  { rua: 'Rua Pará', bairro: 'Distrito Industrial', a: 40, b: 1950 },
  { rua: 'Rua das Mangueiras', bairro: 'Jardim Primavera', a: 40, b: 2150 },
  { rua: 'Rua das Acácias', bairro: 'Vila Esperança', a: 150, b: 1950 },
  { rua: 'Rua Tiradentes', bairro: 'Vila Nova', a: 40, b: 1200 },
  { rua: 'Rua São João', bairro: 'Vila Nova', a: 40, b: 2150 },
  { rua: 'Rua Sabiá', bairro: 'Vila Esperança', a: 40, b: 1050 },
  { rua: 'Rua dos Expositores', bairro: 'Parque das Exposições', a: 40, b: 2150 },
  { rua: 'Rua Goiás', bairro: 'Santa Luzia', a: 40, b: 1350 },
  { rua: 'Rua Minas Gerais', bairro: 'Vila Esperança', a: 2650, b: 3650 },
  { rua: 'Rua Rui Barbosa', bairro: 'Jardim Norte', a: 40, b: 1350 },
  { rua: 'Rua Marechal Deodoro', bairro: 'Vila Nova', a: 2650, b: 3650 },
  { rua: 'Rua Padre Anchieta', bairro: 'Jardim Norte', a: 40, b: 1350 },
  { rua: 'Rua Quaresmeira', bairro: 'Bela Vista', a: 40, b: 1350 },
  { rua: 'Rua Pitangueira', bairro: 'Jardim Primavera', a: 1450, b: 2550 },
];

const okAddr = (a: AddrIn) => {
  const k = resolveAddress(a).kind;
  return k === 'ok' || k === 'marco';
};

function validAddr(tp: TemplateParams): AddrIn {
  if (okAddr(tp.addr)) return { rua: tp.addr.rua, n: tp.addr.n, bairro: tp.addr.bairro };
  for (let i = 0; i < 4; i++) {
    const s = tp.pick(SAFE);
    const n = s.a + Math.floor(tp.rand() * (s.b - s.a));
    const ad = { rua: s.rua, n, bairro: s.bairro };
    if (okAddr(ad)) return ad;
  }
  return { rua: 'Rua Bahia', n: 1240, bairro: 'Centro' };
}

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function idadeTxt(age: number, meses: number): string {
  if (age <= 0) return meses <= 1 ? 'um mês' : `${meses} meses`;
  if (age === 1) return 'um aninho';
  if (age <= 5) return `${age} aninhos`;
  return `${age} anos`;
}

function derive(tp: TemplateParams, age: number, fx: Fixed): P {
  const F = tp.sex === 'F';
  const g = (m: string, f: string) => (F ? f : m);
  const self = tp.rel === 'proprio';
  const relFirst = tp.relName.split(' ')[0];
  const cFirst = self ? tp.first : relFirst;
  const cF = self
    ? F
    : tp.rel === 'esposa' || tp.rel === 'mae'
      ? true
      : tp.rel === 'marido' || tp.rel === 'pai'
        ? false
        : NAMES.f.includes(relFirst);
  const cg = (m: string, f: string) => (cF ? f : m);
  const old = age >= 60;
  const kid = age <= 12;
  const first = tp.first;
  const nome = old ? g(`Seu ${first}`, `Dona ${first}`) : first;
  let quem = '';
  let voc = first;
  let cWord = '';
  switch (tp.rel) {
    case 'proprio':
      quem = 'eu';
      cWord = '';
      break;
    case 'filho':
      quem = g('meu pai', 'minha mãe');
      voc = g('pai', 'mãe');
      cWord = cg('filho', 'filha');
      break;
    case 'neto':
      quem = g('meu avô', 'minha avó');
      voc = g('vô', 'vó');
      cWord = cg('neto', 'neta');
      break;
    case 'esposa':
    case 'marido':
      quem = g('meu marido', 'minha esposa');
      cWord = tp.rel === 'esposa' ? 'esposa' : 'marido';
      break;
    case 'mae':
    case 'pai':
      quem = g('meu filho', 'minha filha');
      cWord = tp.rel === 'mae' ? 'mãe' : 'pai';
      break;
    case 'vizinho':
      quem = old ? g(`o Seu ${first}`, `a Dona ${first}`) : g(`o ${first}`, `a ${first}`);
      cWord = cg('vizinho', 'vizinha');
      break;
    case 'colega':
      quem = g(`o ${first}`, `a ${first}`);
      cWord = 'colega';
      break;
    case 'amigo':
      quem = g('meu amigo', 'minha amiga');
      cWord = cg('amigo', 'amiga');
      break;
    default:
      // neutro em idade: modelos que reajustam a idade por verdade (p.at) não podem
      // entregar a verdade na abertura ("uma moça" × "uma senhora")
      quem = kid ? g('um menino', 'uma menina') : g('um homem', 'uma mulher');
      voc = g('moço', 'moça');
      cWord = 'testemunha';
  }
  const caller = self ? tp.name : `${cFirst} (${cWord})`;
  const vg = (m: VoiceId, f: VoiceId): VoiceId => (F ? f : m);
  const vc = (m: VoiceId, f: VoiceId): VoiceId => (cF ? f : m);
  const voz: VoiceId = self
    ? kid
      ? 'crianca'
      : age < 20
        ? 'adolescente'
        : old
          ? vg('idoso', 'idosa')
          : age < 30
            ? vg('jovem_h', 'jovem_m')
            : vg('homem', 'mulher')
    : tp.rel === 'neto'
      ? vc('jovem_h', 'jovem_m')
      : (tp.rel === 'esposa' || tp.rel === 'marido') && old
        ? vc('idoso', 'idosa')
        : vc('homem', 'mulher');
  const meses = 1 + Math.floor(fx.mesesRaw * 11);
  const p: P = {
    ...tp,
    age,
    F,
    g,
    cg,
    o: g('o', 'a'),
    co: cg('o', 'a'),
    ele: g('ele', 'ela'),
    Ele: g('Ele', 'Ela'),
    dele: g('dele', 'dela'),
    um: g('um', 'uma'),
    old,
    kid,
    self,
    PT: first.toUpperCase(),
    nome,
    tipo: age <= 0 ? 'Bebê' : kid ? g('Menino', 'Menina') : age < 18 ? g('Adolescente', 'Adolescente') : old ? g('Senhor', 'Senhora') : age < 30 ? g('Rapaz', 'Moça') : g('Homem', 'Mulher'),
    quem,
    Quem: cap(quem),
    voc,
    cFirst,
    cF,
    cWord,
    caller,
    CT: cFirst.toUpperCase(),
    voz,
    anos: idadeTxt(age, meses),
    meses,
    addrOk: fx.addr,
    refPoint: fx.ref,
    v: fx.v,
    at: (lo: number, hi: number) => derive(tp, lo + (Math.abs(tp.age) % (hi - lo + 1)), fx),
    pt: () => ({ name: tp.name, age, sex: tp.sex }),
  };
  return p;
}

export function person(tp: TemplateParams): P {
  const fx: Fixed = { ref: tp.pick(REFS), mesesRaw: tp.rand(), v: tp.rand(), addr: validAddr(tp) };
  return derive(tp, tp.age, fx);
}

/** variação cosmética fixa por partida (não depende da verdade sorteada) */
export function alt<T>(p: P, opts: readonly T[]): T {
  return opts[Math.floor(p.v * opts.length) % opts.length];
}

// ----------------------------------------------------------------------------
// Pistas de manual e perguntas obrigatórias sensíveis ao dia
// ----------------------------------------------------------------------------
export function lk(a: string, b: string, insight: string, o: Partial<LinkDef> = {}): LinkDef {
  return { a, b, insight, ...o };
}

/** inconsistência com regra do manual — só existe se a regra já foi liberada no dia */
export function lm(p: P, a: string, rule: string, insight: string, o: Partial<LinkDef> = {}): LinkDef | null {
  const d = RULE_DAY.get(rule);
  if (d === undefined) throw new Error('regra de manual inexistente: ' + rule);
  return d <= p.day ? { a, b: 'manual:' + rule, insight, ...o } : null;
}

/** perguntas obrigatórias (⚖): perguntas base ainda não liberadas no dia são removidas */
export function must(p: P, ...ids: string[]): string[] {
  return ids.filter((id) => {
    const d = Q_DAY.get(id);
    return d === undefined || d <= p.day;
  });
}

/** escolhe só se o dia já tem o recurso (ex.: protocolo) */
export const from = <T,>(p: P, day: number, v: T): T | undefined => (p.day >= day ? v : undefined);

// ----------------------------------------------------------------------------
// Retornos de ligação (trotes)
// ----------------------------------------------------------------------------
export function prankCallback(p: P): { id: string; lines: LineIn[]; insight: string } {
  return p.pick([
    { id: 'retorno_inexistente', lines: ['[{{"O número chamado não existe ou está fora de serviço."|retorno_inexistente}}]'], insight: 'Ligar de volta: número inexistente. Chip descartável?' },
    { id: 'retorno_caixa', lines: ['[{{Chama, chama... cai na caixa postal. De novo. Caixa postal.|retorno_caixa}}]'], insight: 'Ligar de volta: ninguém atende, só caixa postal.' },
    { id: 'retorno_desliga', lines: ['[{{Atendem. Um segundo de silêncio. Desligam na sua cara.|retorno_desliga}}]'], insight: 'Ligar de volta: atenderam calados e desligaram.' },
  ]);
}

// ----------------------------------------------------------------------------
// Especificação de uma verdade
// ----------------------------------------------------------------------------
export interface Spec {
  truth: TruthDef;
  /** pré-triagem certa da Simone */
  note: string;
  /** pré-triagem errada (puxa para outra verdade do mesmo modelo) */
  noteWrong: string;
  amb: AmbientId[];
  q: Partial<Record<string, AnswerIn>>;
  /** falas/ruídos de fundo acrescentados à abertura comum */
  noise?: LineIn[];
  /** substitui a abertura inteira (evite: a abertura deve ser a mesma) */
  open?: LineIn[];
  /** pessoa efetiva (ex.: p.at(55, 85) para reajustar a idade) */
  who?: P;
  type?: CallerType;
  voice?: VoiceId;
  extra?: ExtraQ[];
  links?: (LinkDef | null | undefined | false)[];
  callback?: AnswerIn;
  worsen?: WorsenDef[];
  guide?: GuideRef;
  radio?: RadioTexts;
  diary?: DiaryDef;
  patient?: PatientIn;
  addr?: AddrIn;
  caller?: string;
  callerName?: string;
  patience?: number;
  noFollowup?: boolean;
  /** cena da videochamada (por cima da `cena` do modelo) */
  cena?: VideoHint;
  /** caixa do chamado / cor do post-it da Simone (1.1); sem ela, `callBox` deduz pelo diagnóstico */
  cat?: BoxId;
  /** gancho ao encerrar (flags, conquistas) */
  onResolve?: CallDef['onResolve'];
}

export interface TruthIn {
  id: string;
  weight?: number;
  minDay?: number;
  build: (p: P) => Spec;
}

export interface TplIn {
  id: string;
  tags: string[];
  minDay?: number;
  /** peso do modelo no sorteio (padrão 1) */
  weight?: number;
  /** dias da campanha em que nunca é sorteado */
  notDays?: number[];
  /** no máximo um modelo deste grupo por plantão */
  once?: string;
  age?: [number, number];
  sex?: Gender | 'any';
  rel?: string[];
  /** abertura falada — IGUAL para todas as verdades */
  open: (p: P) => LineIn[];
  /** cena da videochamada comum a todas as verdades (onde a abertura diz que é) */
  cena?: VideoHint | ((p: P) => VideoHint);
  truths: TruthIn[];
}

export type Built = Partial<CallDef> & Pick<CallDef, 'truth' | 'open'>;

function assemble(t: TplIn, tr: TruthIn, tp: TemplateParams): Built {
  const p0 = person(tp);
  const s = tr.build(p0);
  const p = s.who ?? p0;
  const prank = s.truth.sev === 'trote';
  const addr: AddrIn = s.addr ?? (prank ? { rua: tp.addr.rua, n: tp.addr.n, bairro: tp.addr.bairro } : { ...p.addrOk, ref: p.refPoint });
  const q: Partial<Record<string, AnswerIn>> = { ...s.q };
  if (q.referencia === undefined && addr.ref) q.referencia = addr.ref;
  const out: Built = {
    open: s.open ?? [...t.open(p), ...(s.noise ?? [])],
    truth: s.truth,
    note: s.note,
    noteWrong: s.noteWrong,
    caller: s.caller ?? p.caller,
    callerName: s.callerName ?? p.cFirst,
    type: s.type ?? 'comum',
    voice: s.voice ?? p.voz,
    amb: s.amb,
    addr,
    q,
    patient: s.patient ?? p.pt(),
  };
  const links = (s.links ?? []).filter((l): l is LinkDef => !!l);
  if (links.length) out.links = links;
  if (s.extra?.length) out.extra = s.extra;
  if (s.callback !== undefined) out.callback = s.callback;
  if (s.worsen?.length) out.worsen = s.worsen;
  if (s.guide) out.guide = s.guide;
  if (s.radio) out.radio = s.radio;
  if (s.diary) out.diary = s.diary;
  if (s.patience !== undefined) out.patience = s.patience;
  if (s.noFollowup) out.noFollowup = true;
  if (s.cat) out.cat = s.cat;
  if (s.onResolve) out.onResolve = s.onResolve;
  const cena = { ...(typeof t.cena === 'function' ? t.cena(p) : t.cena), ...s.cena };
  if (Object.keys(cena).length) out.cena = cena;
  return out;
}

/** Cria um modelo do banco a partir da abertura comum e das verdades. */
export function tpl(t: TplIn): TemplateDef {
  return {
    id: t.id,
    tags: t.tags,
    minDay: t.minDay,
    ...(t.weight !== undefined ? { weight: t.weight } : {}),
    ...(t.notDays ? { notDays: t.notDays } : {}),
    ...(t.once ? { once: t.once } : {}),
    age: t.age,
    sex: t.sex,
    rel: t.rel,
    truths: t.truths.map((tr) => ({ id: tr.id, weight: tr.weight, minDay: tr.minDay, build: (tp: TemplateParams) => assemble(t, tr, tp) })),
  };
}

// ----------------------------------------------------------------------------
// Atalhos de escrita
// ----------------------------------------------------------------------------
/** pergunta específica */
export function ex(id: string, label: string, say: string, a: AnswerIn, o: Partial<ExtraQ> = {}): ExtraQ {
  return { id, label, say, a, ...o };
}

/** guia só quando o texto do roteiro combina com o paciente (os roteiros são escritos com gênero fixo) */
export function guideIf(cond: boolean, id: string, onOri = false): GuideRef | undefined {
  return cond ? (onOri ? { id, onOri: true } : { id }) : undefined;
}
