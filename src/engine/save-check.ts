// Conferência de um save antes de carregar (checklist de segurança, seção 4: desserialização e
// parsers de arquivo; ver docs/SEGURANCA.md).
//
// O save é JSON puro: nada de classes, tipos ou código, e o JSON.parse não executa nada. Aqui
// se confere forma, limites e tamanhos, para que um arquivo corrompido (disco, cópia pela
// metade, edição à mão) vire uma mensagem clara na hora de carregar, em vez de travar o jogo
// no meio de um plantão. Editar o próprio save continua possível (o jogo é singleplayer): o
// que não passa é o que o jogo não saberia usar.
import type { GameState } from './types';

/** um save tem ~100 KB (o da Simone, com o mundo-sombra, ~250 KB); 8 MB é folga de sobra */
export const SAVE_MAX_CHARS = 8 * 1024 * 1024;
const MAX_DEPTH = 32;
const MAX_ARRAY = 20_000;
const MAX_STRING = 50_000;
const MAX_NODES = 2_000_000;
/** maior número aceito (as datas em ms ficam em ~1,8e12) */
const MAX_NUM = 1e15;
/** chaves que mexeriam no protótipo dos objetos se algum código as copiasse */
const BAD_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const MODES = ['campanha', 'infinito', 'simone'];
const DIFFICULTIES = ['narrativo', 'padrao', 'real'];
const PHASES = ['jornal', 'plantao', 'relatorio', 'casa', 'final', 'gameover'];
const HOME_STEPS = ['pre', 'escolha', 'intervencao', 'cena', 'contas', 'loja', 'fim'];
const MEMBER_STATUS = ['bem', 'fome', 'frio', 'doente', 'triste', 'critico', 'internado', 'ausente', 'morto'];
const DIARY_KINDS = ['vivo', 'morto', 'orientado', 'trote', 'nota', 'sequela'];
const ENDINGS = ['ruim', 'normal', 'bom', 'secreto'];
const GAMEOVERS = ['exonerado', 'despejo', 'colapso', 'sindicancia'];
const FIELD_PHASES = ['radio', 'cena', 'resultado', 'fim'];
const BILL_NUMS = ['rentDebt', 'rentOverdue', 'rent', 'energyMissed', 'foodMissed', 'medsMissed', 'gasMissed'];
const BILL_BOOLS = ['energyCut', 'icebox', 'fridgeBroken', 'insulinSpoiled'];
const TOTALS = ['warnings', 'notes', 'deaths', 'saves', 'handled', 'pranks', 'sindicancias', 'coffee', 'bicos', 'calls', 'golden'];

/** save que não dá para carregar; `detail` diz o porquê (vai para o registro de erros) */
export class SaveError extends Error {
  detail: string;
  constructor(detail: string) {
    super('Este save está corrompido (ou foi editado de um jeito que o jogo não entende) e não pode ser carregado.');
    this.name = 'SaveError';
    this.detail = detail;
  }
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isInt = (v: unknown, lo: number, hi: number): v is number => Number.isInteger(v) && (v as number) >= lo && (v as number) <= hi;
const isStr = (v: unknown): v is string => typeof v === 'string';
const isBool = (v: unknown): v is boolean => typeof v === 'boolean';

function fail(detail: string): never {
  throw new SaveError(detail);
}
function need(ok: boolean, detail: string): void {
  if (!ok) fail(detail);
}
function arrayOf(v: unknown, where: string, item: (x: unknown, w: string) => void): void {
  need(Array.isArray(v), `${where}: devia ser uma lista`);
  (v as unknown[]).forEach((x, i) => item(x, `${where}[${i}]`));
}
const strItem = (x: unknown, w: string) => need(isStr(x), `${w}: devia ser texto`);
function recordOf(v: unknown, where: string, item: (x: unknown, w: string) => boolean, what: string): void {
  need(isObj(v), `${where}: devia ser um objeto`);
  for (const [k, x] of Object.entries(v as Obj)) need(item(x, `${where}.${k}`), `${where}.${k}: devia ser ${what}`);
}

/**
 * Passa por todo o valor sem recursão (um save com milhares de níveis de lista não derruba a
 * conferência): números finitos e numa faixa sã, textos e listas com tamanho máximo, sem chaves
 * de protótipo, profundidade limitada.
 */
function walk(root: unknown): void {
  const stack: [unknown, string, number][] = [[root, 'save', 0]];
  let nodes = 0;
  while (stack.length) {
    const [v, where, depth] = stack.pop()!;
    if (++nodes > MAX_NODES) fail('save grande demais');
    if (depth > MAX_DEPTH) fail(`${where}: aninhamento grande demais`);
    if (v === null || typeof v === 'boolean') continue;
    if (typeof v === 'number') {
      need(Number.isFinite(v) && Math.abs(v) <= MAX_NUM, `${where}: número inválido`);
      continue;
    }
    if (typeof v === 'string') {
      need(v.length <= MAX_STRING, `${where}: texto grande demais`);
      continue;
    }
    if (Array.isArray(v)) {
      need(v.length <= MAX_ARRAY, `${where}: lista grande demais`);
      for (let i = v.length - 1; i >= 0; i--) stack.push([v[i], `${where}[${i}]`, depth + 1]);
      continue;
    }
    if (typeof v === 'object') {
      for (const k of Object.keys(v as Obj)) {
        need(!BAD_KEYS.has(k), `${where}: chave proibida "${k}"`);
        stack.push([(v as Obj)[k], `${where}.${k}`, depth + 1]);
      }
      continue;
    }
    fail(`${where}: valor de tipo inesperado`);
  }
}

function checkHome(h: unknown, w: string): void {
  need(isObj(h), `${w}: devia ser um objeto`);
  const o = h as Obj;
  need(HOME_STEPS.includes(o.step as string), `${w}.step inválido`);
  need(o.timeOff === undefined || ['descanso', 'familia', 'bico'].includes(o.timeOff as string), `${w}.timeOff inválido`);
  need(o.sceneId === undefined || isStr(o.sceneId), `${w}.sceneId inválido`);
  need(o.node === undefined || isStr(o.node), `${w}.node inválido`);
  need(isInt(o.lineIdx, 0, 100_000), `${w}.lineIdx inválido`);
  for (const k of ['paid', 'bought', 'found', 'tried', 'log']) arrayOf(o[k], `${w}.${k}`, strItem);
  need(isBool(o.inspected) && isBool(o.sceneDone), `${w}: inspected/sceneDone inválidos`);
  need(o.ozzy === undefined || isBool(o.ozzy), `${w}.ozzy inválido`);
  if (o.field !== undefined) {
    const f = o.field;
    need(isObj(f), `${w}.field: devia ser um objeto`);
    const fo = f as Obj;
    arrayOf(fo.cases, `${w}.field.cases`, strItem);
    need(isInt(fo.idx, 0, 1000), `${w}.field.idx inválido`);
    need(FIELD_PHASES.includes(fo.phase as string), `${w}.field.phase inválido`);
    arrayOf(fo.results, `${w}.field.results`, (x, ww) => need(isObj(x), `${ww}: devia ser um objeto`));
    arrayOf(fo.clock, `${w}.field.clock`, (x, ww) => need(isNum(x), `${ww}: devia ser número`));
    need(isObj(fo.extra), `${w}.field.extra inválido`);
    need(fo.rt === undefined || isObj(fo.rt), `${w}.field.rt inválido`);
  }
}

function checkState(st: Obj, w: string, nested: boolean): void {
  need(isStr(st.id) && (st.id as string).length <= 64, `${w}.id inválido`);
  need(isNum(st.seed) && isNum(st.rng), `${w}: seed/rng inválidos`);
  need(MODES.includes(st.mode as string), `${w}.mode inválido`);
  need(DIFFICULTIES.includes(st.difficulty as string), `${w}.difficulty inválido`);
  need(st.gender === 'M' || st.gender === 'F', `${w}.gender inválido`);
  need(st.name === undefined || (isStr(st.name) && (st.name as string).length <= 40), `${w}.name inválido`);
  need(isBool(st.variable), `${w}.variable inválido`);
  need(isInt(st.day, 1, 60), `${w}.day inválido`);
  need(PHASES.includes(st.phase as string), `${w}.phase inválido`);
  need(isNum(st.money), `${w}.money inválido`);
  recordOf(st.vars, `${w}.vars`, isNum, 'número');
  recordOf(st.keys, `${w}.keys`, (x) => x === 'salvo' || x === 'perdido', '"salvo" ou "perdido"');
  recordOf(st.sources, `${w}.sources`, isBool, 'verdadeiro/falso');
  recordOf(st.flags, `${w}.flags`, (x) => isBool(x) || isNum(x) || isStr(x), 'um valor simples');
  recordOf(
    st.family,
    `${w}.family`,
    (x) => isObj(x) && MEMBER_STATUS.includes(x.status as string) && isNum(x.hunger) && isNum(x.risk) && (x.away === undefined || isBool(x.away)),
    'um membro da família válido',
  );
  for (const m of ['lucia', 'davi', 'zelia']) need(isObj((st.family as Obj)[m]), `${w}.family.${m} faltando`);
  need(isObj(st.bills), `${w}.bills inválido`);
  const b = st.bills as Obj;
  for (const k of BILL_NUMS) need(isNum(b[k]), `${w}.bills.${k} inválido`);
  for (const k of BILL_BOOLS) need(isBool(b[k]), `${w}.bills.${k} inválido`);
  arrayOf(st.diary, `${w}.diary`, (x, ww) => {
    need(isObj(x), `${ww}: devia ser um objeto`);
    const d = x as Obj;
    need(isStr(d.id) && isNum(d.day) && isStr(d.name) && isStr(d.text) && DIARY_KINDS.includes(d.kind as string), `${ww}: entrada inválida`);
    need(d.callDef === undefined || isStr(d.callDef), `${ww}.callDef inválido`);
    arrayOf(d.updates, `${ww}.updates`, (u, wu) => need(isObj(u) && isNum(u.day) && isStr(u.text), `${wu}: atualização inválida`));
  });
  arrayOf(st.board, `${w}.board`, (x, ww) =>
    need(isObj(x) && isStr(x.id) && isStr(x.kind) && isStr(x.title) && isStr(x.text) && isNum(x.day) && isNum(x.count) && (x.num === undefined || isStr(x.num)), `${ww}: anotação inválida`),
  );
  for (const k of ['docs', 'manual', 'achievements']) arrayOf(st[k], `${w}.${k}`, strItem);
  arrayOf(st.history, `${w}.history`, (x, ww) => {
    need(isObj(x), `${ww}: devia ser um objeto`);
    const d = x as Obj;
    for (const k of ['day', 'warnings', 'notes', 'deaths', 'saves', 'handled', 'pay', 'bonus', 'deductions', 'moneyAfter']) need(isNum(d[k]), `${ww}.${k} inválido`);
    arrayOf(d.report, `${ww}.report`, (r, wr) => need(isObj(r) && isStr(r.callId) && isStr(r.name) && isStr(r.text) && isNum(r.money) && isNum(r.t), `${wr}: item inválido`));
  });
  need(isObj(st.totals), `${w}.totals inválido`);
  for (const k of TOTALS) need(isNum((st.totals as Obj)[k]), `${w}.totals.${k} inválido`);
  need(isNum(st.irritado) && isNum(st.createdAt) && isNum(st.playSeconds), `${w}: irritado/createdAt/playSeconds inválidos`);
  need(st.lastSave === undefined || isNum(st.lastSave), `${w}.lastSave inválido`);
  need(st.shift === undefined || isObj(st.shift), `${w}.shift inválido`);
  if (isObj(st.shift)) {
    const sh = st.shift;
    need(isObj(sh.calls) && Array.isArray(sh.order) && isObj(sh.units) && Array.isArray(sh.radio) && isNum(sh.time), `${w}.shift: plantão inválido`);
  }
  // fase casa sem home é normal: o save do começo da noite é refeito pelo HomeSim ao carregar
  if (st.home !== undefined) checkHome(st.home, `${w}.home`);
  if (st.gameOver !== undefined) {
    const g = st.gameOver;
    need(isObj(g) && GAMEOVERS.includes(g.kind as string) && isNum(g.day) && isStr(g.text), `${w}.gameOver inválido`);
  }
  if (st.ending !== undefined) {
    const e = st.ending;
    need(isObj(e) && ENDINGS.includes(e.kind as string), `${w}.ending inválido`);
    arrayOf((e as Obj).lines, `${w}.ending.lines`, strItem);
    arrayOf((e as Obj).threads, `${w}.ending.threads`, (x, ww) => need(isObj(x) && isStr(x.id) && isBool(x.ok) && isStr(x.text), `${ww}: inválido`));
  }
  if (st.infinite !== undefined) {
    const i = st.infinite;
    need(isObj(i) && isStr(i.seedLabel), `${w}.infinite inválido`);
    for (const k of ['score', 'calls', 'correct', 'streak', 'bestStreak', 'shifts']) need(isNum((i as Obj)[k]), `${w}.infinite.${k} inválido`);
  }
  if (st.shadow !== undefined) {
    need(!nested, `${w}.shadow: mundo-sombra dentro do mundo-sombra`);
    need(isObj(st.shadow), `${w}.shadow inválido`);
    checkState(st.shadow as Obj, `${w}.shadow`, true);
  }
}

/**
 * Lê o texto de um save e confere tudo antes de o jogo usar. Devolve o estado (ainda sem
 * conferir a versão: Game.load diz "incompatível com esta versão" separadamente).
 */
export function parseSave(json: string): GameState {
  need(typeof json === 'string', 'save vazio');
  need(json.length <= SAVE_MAX_CHARS, 'save grande demais');
  let st: unknown;
  try {
    st = JSON.parse(json);
  } catch {
    fail('o arquivo não é um JSON válido (cortado ou corrompido)');
  }
  need(isObj(st), 'o save não é um objeto');
  return st as unknown as GameState;
}

/** confere forma, limites e tamanhos de um estado já lido (lança SaveError) */
export function checkSave(st: GameState): void {
  walk(st);
  checkState(st as unknown as Obj, 'save', false);
}
