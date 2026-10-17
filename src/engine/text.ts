// Texto: tokens de gênero/nome, marcação de pistas {{trecho|id}}, falantes.
//
// Família do protagonista (os nomes moram só aqui):
//   protagonista: Dr. Thiago Moura (M) ou Dra. Camille Moura (F) — {nome}, {NOME};
//   o jogador pode renomear (GameState.name); use sempre {nome} ou protagonistFirst(),
//   nunca o nome escrito direto;
//   filho: Liam, 8 anos (o mesmo nas duas versões; escreva "Liam" direto no texto);
//   cônjuge: com o Thiago, a esposa Lúcia; com a Camille, o marido Alex. Mesmo papel na
//   história (mesmas cenas, mesmo ateliê, mesmas escolhas), muda só nome, gênero e
//   concordância. A Dona Zélia é a mãe do protagonista nas duas versões.
//
// Tokens do PROTAGONISTA (tabela GENDERED): forma masculina | feminina.
// Tokens do CÔNJUGE (tabela SPOUSE e {c:...}): forma da Lúcia | forma do Alex:
//   {conj} Lúcia/Alex · {CONJ} LÚCIA/ALEX · {oconj} a Lúcia/o Alex · {Oconj} A Lúcia/O Alex ·
//   {doconj} da Lúcia/do Alex · {proconj} pra Lúcia/pro Alex ·
//   {c:forma da Lúcia|forma do Alex} para pronomes e concordância:
//   "{Oconj} chegou {c:cansada|cansado}", "({c:ela|ele} ri)", "a mãe|o pai do Liam".
// O cônjuge é sempre do gênero oposto ao do protagonista, então {c:a|b} equivale a {m:a|b};
// use {c:} quando a palavra concorda com o cônjuge e {m:} quando concorda com o protagonista.
import type { Ctx, Gender, LineIn, LineDef, Txt, GameState } from './types';

export interface Segment {
  text: string;
  clue?: string;
}

/** Primeiro nome PADRÃO do protagonista (M: Thiago · F: Camille). O nome em uso mora no
 *  estado (`GameState.name`): leia com `protagonistFirst(g, s)`. */
export const PROTAGONIST_FIRST: Record<Gender, string> = { M: 'Thiago', F: 'Camille' };
/** Sobrenome da família. */
export const SURNAME = 'Moura';
/** Tamanho máximo do nome escolhido pelo jogador. */
export const NAME_MAX = 20;

/** Limpa um nome digitado (sem tokens, sem quebras, até NAME_MAX). Vazio → undefined. */
export function cleanName(raw: string | undefined | null): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const t = raw.replace(/[{}|<>\n\r\t]/g, '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX).trim();
  return t || undefined;
}

let activeName: string | undefined;
let activeGender: Gender = 'F';
/** O cliente avisa qual partida está aberta (para telas/arte que não recebem o estado). */
export function setActiveProtagonist(s: Pick<GameState, 'gender' | 'name'> | null | undefined): void {
  activeName = s ? cleanName(s.name) : undefined;
  activeGender = s?.gender === 'M' ? 'M' : 'F';
}

/** Primeiro nome do protagonista em uso: o escolhido no estado, senão o padrão do gênero.
 *  Sem estado, usa a partida aberta no cliente (setActiveProtagonist). */
export function protagonistFirst(g?: Gender, s?: Pick<GameState, 'gender' | 'name' | 'shadow'> | null): string {
  if (s) {
    const n = cleanName(s.name) ?? cleanName(s.shadow?.name);
    const gg = g ?? (s.gender === 'M' ? 'M' : 'F');
    return n ?? PROTAGONIST_FIRST[gg];
  }
  const gg = g ?? activeGender;
  if (activeName && gg === activeGender) return activeName;
  return PROTAGONIST_FIRST[gg];
}
/** Nome do filho (igual nas duas versões). */
export const SON_NAME = 'Liam';

/** true quando o cônjuge é a esposa (Lúcia): protagonista homem. */
export function spouseIsWife(g: Gender): boolean {
  return g === 'M';
}

/** Nome do cônjuge: Lúcia (protagonista homem) ou Alex (protagonista mulher). */
export function spouseName(g: Gender): string {
  return spouseIsWife(g) ? 'Lúcia' : 'Alex';
}

const GENDERED: Record<string, [string, string]> = {
  dr: ['doutor', 'doutora'],
  Dr: ['Doutor', 'Doutora'],
  DR: ['DOUTOR', 'DOUTORA'],
  tit: ['Dr.', 'Dra.'],
  filho: ['filho', 'filha'],
  Filho: ['Filho', 'Filha'],
  pai: ['pai', 'mãe'],
  Pai: ['Pai', 'Mãe'],
  o: ['o', 'a'],
  O: ['O', 'A'],
  ele: ['ele', 'ela'],
  Ele: ['Ele', 'Ela'],
  dele: ['dele', 'dela'],
  um: ['um', 'uma'],
  sozinho: ['sozinho', 'sozinha'],
  cansado: ['cansado', 'cansada'],
  obrigado: ['obrigado', 'obrigada'],
  querido: ['querido', 'querida'],
  menino: ['menino', 'menina'],
  meu: ['meu', 'minha'],
  Meu: ['Meu', 'Minha'],
  seu: ['seu', 'sua'],
  Seu: ['Seu', 'Sua'],
  regulador: ['regulador', 'reguladora'],
  medico: ['médico', 'médica'],
  Medico: ['Médico', 'Médica'],
  esposo: ['marido', 'esposa'],
};

/** Cônjuge: [forma com a Lúcia (protagonista M), forma com o Alex (protagonista F)]. */
const SPOUSE: Record<string, [string, string]> = {
  conj: ['Lúcia', 'Alex'],
  CONJ: ['LÚCIA', 'ALEX'],
  oconj: ['a Lúcia', 'o Alex'],
  Oconj: ['A Lúcia', 'O Alex'],
  doconj: ['da Lúcia', 'do Alex'],
  proconj: ['pra Lúcia', 'pro Alex'],
};

export function beneForm(s: GameState): string {
  const i = s.vars.intimBene;
  if (i >= 7) return protagonistFirst(s.gender === 'F' ? 'F' : 'M', s);
  if (i >= 3) return s.gender === 'M' ? 'Doutor' : 'Doutora';
  return 'Central';
}

/** Resolve tokens {x} e {m:a|b}. Não toca em {{...}} (pistas). */
export function resolveTokens(str: string, g: Gender, s?: GameState): string {
  let out = '';
  let i = 0;
  while (i < str.length) {
    const c = str[i];
    if (c === '{' && str[i + 1] === '{') {
      // pista: copia até '}}' (os tokens dentro serão resolvidos também)
      const end = str.indexOf('}}', i + 2);
      if (end < 0) {
        out += str.slice(i);
        break;
      }
      const inner = str.slice(i + 2, end);
      const bar = inner.lastIndexOf('|');
      const vis = bar >= 0 ? inner.slice(0, bar) : inner;
      const id = bar >= 0 ? inner.slice(bar + 1) : '';
      out += '{{' + resolveTokens(vis, g, s) + (id ? '|' + id : '') + '}}';
      i = end + 2;
      continue;
    }
    if (c === '{') {
      const end = str.indexOf('}', i + 1);
      if (end < 0) {
        out += str.slice(i);
        break;
      }
      const tok = str.slice(i + 1, end);
      out += resolveOne(tok, g, s) ?? `{${tok}}`;
      i = end + 1;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

function resolveOne(tok: string, g: Gender, s?: GameState): string | undefined {
  if (tok.startsWith('m:')) {
    const [a, b] = tok.slice(2).split('|');
    return g === 'M' ? a : b ?? a;
  }
  if (tok.startsWith('c:')) {
    // concordância com o cônjuge: forma da Lúcia | forma do Alex
    const [a, b] = tok.slice(2).split('|');
    return spouseIsWife(g) ? a : b ?? a;
  }
  if (tok === 'bene') return s ? beneForm(s) : 'Central';
  if (tok === 'sobrenome') return SURNAME;
  if (tok === 'nome') return protagonistFirst(g, s);
  if (tok === 'NOME') return protagonistFirst(g, s).toUpperCase();
  const pair = GENDERED[tok];
  if (pair) return g === 'M' ? pair[0] : pair[1];
  const sp = SPOUSE[tok];
  if (sp) return spouseIsWife(g) ? sp[0] : sp[1];
  return undefined;
}

/** Divide texto com marcação {{trecho|pista}} em segmentos. */
export function parseMarkup(text: string): Segment[] {
  const segs: Segment[] = [];
  let i = 0;
  while (i < text.length) {
    const start = text.indexOf('{{', i);
    if (start < 0) {
      segs.push({ text: text.slice(i) });
      break;
    }
    if (start > i) segs.push({ text: text.slice(i, start) });
    const end = text.indexOf('}}', start + 2);
    if (end < 0) {
      segs.push({ text: text.slice(start) });
      break;
    }
    const inner = text.slice(start + 2, end);
    const bar = inner.lastIndexOf('|');
    if (bar >= 0) segs.push({ text: inner.slice(0, bar), clue: inner.slice(bar + 1) });
    else segs.push({ text: inner });
    i = end + 2;
  }
  return segs.filter((s) => s.text.length > 0);
}

export function stripMarkup(text: string): string {
  return parseMarkup(text)
    .map((s) => s.text)
    .join('');
}

export function cluesIn(text: string): { id: string; text: string }[] {
  return parseMarkup(text)
    .filter((s) => s.clue)
    .map((s) => ({ id: s.clue!, text: s.text }));
}

export function txt(t: Txt | undefined, c: Ctx): string {
  if (t === undefined) return '';
  return typeof t === 'function' ? t(c) : t;
}

const SPEAKER_RE = /^([A-ZÁÉÍÓÚÂÊÔÃÕÇÜ][A-ZÁÉÍÓÚÂÊÔÃÕÇÜ0-9 .'()-]{0,28}):\s+/;

export interface NormLine {
  who?: string;
  text: string;
  noise: boolean;
  style?: LineDef['style'];
}

/** Normaliza um LineIn (string ou objeto) em fala resolvida (sem tokens). */
export function normLine(l: LineIn, c: Ctx): NormLine | null {
  if (typeof l === 'string') {
    // tokens antes do falante: "{CONJ}: ..." vira "LÚCIA: ..." ou "ALEX: ..."
    const s = resolveTokens(l.trim(), c.g, c.s);
    if (s.startsWith('[') && s.endsWith(']')) {
      return { text: s, noise: true };
    }
    const m = SPEAKER_RE.exec(s);
    if (m) return { who: m[1].trim(), text: s.slice(m[0].length), noise: false };
    return { text: s, noise: false };
  }
  if (l.when && !l.when(c)) return null;
  const raw = txt(l.t, c);
  const isNoise = l.noise ?? (raw.startsWith('[') && raw.endsWith(']'));
  return { who: l.who === undefined ? undefined : resolveTokens(l.who, c.g, c.s), text: resolveTokens(raw, c.g, c.s), noise: isNoise, style: l.style };
}

export function normLines(a: LineIn | LineIn[] | undefined, c: Ctx): NormLine[] {
  if (a === undefined) return [];
  const arr = Array.isArray(a) ? a : [a];
  const out: NormLine[] = [];
  for (const l of arr) {
    const n = normLine(l, c);
    if (n) out.push(n);
  }
  return out;
}

/** Nome por extenso do protagonista ("Dra. Camille Moura"), com o nome escolhido. */
export function protagonistName(g: Gender, s?: Pick<GameState, 'gender' | 'name' | 'shadow'> | null): string {
  return `${g === 'M' ? 'Dr.' : 'Dra.'} ${protagonistFirst(g, s)} ${SURNAME}`;
}

/** Troca, num texto já gravado, o nome antigo do protagonista pelo atual (migração de save). */
export function replaceOldNames(text: string, g: Gender, name: string): string {
  const old = g === 'M' ? ['Luan', 'LUAN'] : ['Amber', 'AMBER'];
  return text.replace(new RegExp(`\\b${old[0]}\\b(?! Cardoso)(?!, 7)`, 'g'), name).replace(new RegExp(`\\b${old[1]}\\b`, 'g'), name.toUpperCase());
}
