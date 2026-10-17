// Interface do registro de conteúdo (implementado em src/content/index.ts).
import type {
  DayDef, QuestionDef, ManualPage, FleetSpec, CallDef, Ctx, SceneDef, BillDef, ShopItem, GameState, Gender,
  AddrIn, Effect, Cond, Txt, CallRT, NewspaperDef, EndingInfo, TruthDef, VideoDef, LineIn, FieldCaseDef, VagaZeroContent,
} from './types';

export interface GuideOption {
  label: string;
  /** 'certo' avança; 'calma' reduz pânico; 'errado' aumenta pânico/qualidade cai; 'troca' muda para outro roteiro */
  kind: 'certo' | 'calma' | 'errado' | 'neutro';
  reply?: string;
  switchTo?: string;
}

export interface GuideStep {
  /** fala de quem liga / situação */
  say: string;
  who?: string;
  options: GuideOption[];
  /** segundos reais para escolher */
  time?: number;
}

export interface GuideScript {
  id: string;
  title: string;
  kind: 'dialogo' | 'rcp' | 'respiracao' | 'multiplas';
  intro: string;
  panic?: number;
  steps?: GuideStep[];
  /** texto do cartão de apoio exibido (ex.: CVV 188) */
  card?: string;
  /** relógio mais lento durante o minijogo (fator) */
  slow?: number;
  /** dialogo: nunca falha por tempo (acolhimento) */
  noTimeout?: boolean;
  success: string;
  fail: string;
  /** parâmetros da RCP */
  bpm?: [number, number];
  tiredEvery?: number;
}

export interface TemplateTruth {
  id: string;
  weight?: number;
  minDay?: number;
  /** função que completa a ligação a partir dos parâmetros gerados */
  build: (p: TemplateParams) => Partial<CallDef> & Pick<CallDef, 'truth' | 'open'>;
}

export interface TemplateParams {
  name: string;
  first: string;
  age: number;
  sex: Gender;
  addr: AddrIn;
  num: string;
  /** quem liga (relação com o paciente) */
  rel: string;
  relName: string;
  day: number;
  rand: () => number;
  pick: <T>(a: readonly T[]) => T;
}

export interface TemplateDef {
  id: string;
  tags: string[];
  minDay?: number;
  /** faixa etária do paciente e sexo preferido */
  age?: [number, number];
  sex?: Gender | 'any';
  /** relação de quem liga */
  rel?: string[];
  truths: TemplateTruth[];
}

export interface EpilogueThread {
  id: string;
  title: string;
  ok: Cond;
  /** só aparece se */
  when?: Cond;
  good: Txt;
  bad: Txt;
}

export interface EndingTexts {
  ruim: (c: Ctx) => string[];
  normal: (c: Ctx) => string[];
  bom: (c: Ctx) => string[];
  secreto: (c: Ctx) => string[];
  chairOffer: (c: Ctx) => string[];
  gameover: Record<'exonerado' | 'despejo' | 'colapso' | 'sindicancia', (c: Ctx) => string[]>;
  threads: EpilogueThread[];
  credits: string[];
}

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  secret?: boolean;
}

export interface HomeContent {
  /** contas fixas por interlúdio */
  baseBills: (c: Ctx) => BillDef[];
  /** loja de conforto/itens permanentes disponível */
  shop: ShopItem[];
  /** cena genérica quando o dia não tem evento */
  genericScene: (c: Ctx) => SceneDef;
  /** cena de bico genérica */
  genericBico: (c: Ctx) => SceneDef;
  /** frase de inspeção à toa */
}

export interface DeskDoc {
  id: string;
  title: string;
  text: Txt;
  /** @deprecated pistas do antigo Modo Inconsistência (ignoradas) */
  clues?: { id: string; text: string }[];
  /** efeito na primeira vez que o documento é lido no quadro (grava também a flag `doc_lido_<id>`) */
  onRead?: import('./types').Effect;
  /** dias em que está na mesa (padrão: sempre depois de recebido) */
  until?: number;
}

// -----------------------------------------------------------------------------
// Campanha 2: "Simone" (os mesmos 20 dias vistos pela TARM)
// -----------------------------------------------------------------------------
/** o que a Simone pode consultar do turno (mundo-sombra, regulação por IA) */
export interface SimoneWorld {
  /** ligação do dia (id da ligação no dia original) */
  call(defId: string): CallRT | undefined;
  /** flag do mundo-sombra (escolhas do regulador controlado pela IA) */
  shadowFlag(name: string): boolean | number | string | undefined;
  /** minutos desde 00:00 */
  time: number;
  /** pré-triagens feitas até agora no turno */
  passed: number;
}

export interface SimoneEvent {
  /** 'HH:MM': a partir de quando pode disparar */
  at: string;
  /** 'HH:MM': depois disso, desiste (padrão: at + 60 min) */
  until?: string;
  /** dispara quando a TARM atende esta ligação (id do dia original), em vez de só pelo relógio */
  onCall?: string;
  when?: (c: Ctx, w: SimoneWorld) => boolean;
  /** cena curta: o relógio para enquanto ela está aberta */
  scene: (c: Ctx, w: SimoneWorld) => SceneDef;
  /** depois da cena a TARM sai do turno (a crise do dia 17); o resto do dia é triado por quem cobrir */
  out?: (c: Ctx, w: SimoneWorld) => boolean;
}

export interface SimoneDayDef {
  day: number;
  /** cena antes do turno (chegada, ônibus, vestiário) */
  morning?: (c: Ctx) => SceneDef | undefined;
  /** cena no fim do turno, antes do relatório */
  evening?: (c: Ctx, w: SimoneWorld) => SceneDef | undefined;
  /** a noite na casa da Simone */
  night: (c: Ctx) => SceneDef;
  /** contas da noite (além das fixas) */
  bills?: BillDef[];
  events?: SimoneEvent[];
  /** precisão base das mesas (0–1) e ausências */
  moura?: { acc?: number };
  henrique?: { acc?: number; away?: boolean };
  /** meta de TMA da OS, em minutos de jogo entre atender e passar (padrão 45) */
  tmaGoal?: number;
  /** escolhas canônicas do regulador (mundo-sombra) antes do turno */
  shadow?: (s: GameState) => void;
  /** substitui partes do jornal do dia */
  newspaper?: (c: Ctx) => Partial<NewspaperDef> | undefined;
  onStart?: Effect;
}

export interface SimoneContent {
  days: Record<number, SimoneDayDef>;
  /** contas fixas de toda noite */
  baseBills: (c: Ctx) => BillDef[];
  /** salário por turno (R$) */
  pay: number;
  /** final: tipo, linhas (a primeira é o título) e fios do epílogo */
  ending: (c: Ctx) => Pick<EndingInfo, 'kind' | 'lines' | 'threads'>;
  gameover: Record<'exonerado' | 'colapso' | 'despejo', (c: Ctx) => string[]>;
  credits?: string[];
}

export interface Content {
  days: Record<number, DayDef>;
  /** campanha 2 (opcional) */
  simone?: SimoneContent;
  questions: QuestionDef[];
  manual: ManualPage[];
  fleet: FleetSpec[];
  guides: Record<string, GuideScript>;
  bank: TemplateDef[];
  endings: EndingTexts;
  achievements: AchievementDef[];
  home: HomeContent;
  docs: Record<string, DeskDoc>;
  /** frases padrão por tipo de quem liga para perguntas sem resposta escrita */
  defaults: (q: string, call: CallDef, c: Ctx) => string | string[];
  /** videochamada de averiguação: dia em que o piloto começa (campanha), franquia por plantão e cena gerada da verdade clínica */
  video?: {
    fromDay: number;
    credits: number;
    build: (call: CallDef, t: TruthDef, c: Ctx, callId: string) => VideoDef;
    /** frases de quem liga quando não está no local */
    remoteLines: (call: CallDef, c: Ctx) => LineIn[];
    /** aviso do primeiro dia do piloto */
    intro?: { who: string; text: string };
  };
  /** plantão extra na Intervenção (ambulância): banco de ocorrências */
  field?: { cases: FieldCaseDef[] };
  /** 1.1: vaga zero negociada com o plantonista do Regional (src/content/vagazero.ts) */
  vagazero?: VagaZeroContent;
  /** efeitos reutilizáveis nomeados */
  effects?: Record<string, Effect>;
  /** nomes para geração procedural */
  names: { m: string[]; f: string[]; last: string[] };
  /** validação extra de conteúdo */
  version: string;
  /** pré-processamento de estado ao iniciar dia (ex.: frota) */
  fleetForDay: (s: GameState) => string[];
  /** manual de regulação: páginas desbloqueadas até o dia */
  manualUntil: (day: number) => string[];
}
