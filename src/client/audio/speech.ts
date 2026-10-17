// =============================================================================
// QAP — Emergency Dispatch — áudio · planejamento de fala (texto → sílabas temporizadas)
// Balbucio "Papers, Please": não é TTS. As vogais, a tonicidade e a pontuação
// do texto em português guiam o ritmo e a entonação do balbucio.
// =============================================================================
import type { LineStyle, VoiceId } from '../../engine/types';
import { bleepDuration } from '../../engine/bleep';
import { clamp, hashStr, mulberry32, pick, rr, type Rand } from './dsp';

export type Vowel = 'a' | 'E' | 'e' | 'i' | 'O' | 'o' | 'u';
export type Onset = '' | 'p' | 'b' | 'f' | 'v' | 's' | 'z' | 'x' | 'j' | 'n' | 'l' | 'h' | 'tch' | 'dj';
export type Coda = '' | 's' | 'r' | 'n';
export type Channel = 'phone' | 'room' | 'radio';

/** Parâmetros efetivos de um falante (perfil + estilo). */
export interface VoiceSpec {
  f0: number; // Hz
  fmt: number; // escala de formantes (trato vocal)
  rate: number; // sílabas/s
  vary: number; // variação aleatória de pitch por sílaba (fração)
  range: number; // acento tônico (fração)
  breath: number; // soprosidade 0..1
  tilt: number; // inclinação espectral da fonte (1 = dente de serra)
  gap: number; // fração da sílaba em silêncio (staccato)
  level: number; // ganho
  vib: number; // vibrato Hz
  vibDepth: number; // cents
  jitter: number; // cents aleatórios
  rasp: number; // aspereza 0..1
  crack: number; // prob. de falsete (voz de adolescente)
  slur: number; // portamento 0..1
  warm: number; // 0..1 (passa-baixa)
  whisper: number; // 0 = vozeado, 1 = só ruído
  trem: number; // tremolo de amplitude 0..1
  tremRate: number;
  reverse: boolean; // envelope invertido (fantasma)
  drive: number; // saturação (grito)
  sob: number; // prob. de soluço por palavra
  pant: number; // prob. de respiração por palavra
  laugh: number; // prob. de risada por palavra
  verb: number; // envio de reverb
  open: number; // abertura extra de F1 (grito)
  channel: Channel;
}

const BASE: VoiceSpec = {
  f0: 120, fmt: 1, rate: 6.2, vary: 0.05, range: 0.13, breath: 0.06, tilt: 1.05, gap: 0.1, level: 1,
  vib: 5, vibDepth: 0, jitter: 0, rasp: 0, crack: 0, slur: 0.1, warm: 0.15, whisper: 0, trem: 0, tremRate: 6,
  reverse: false, drive: 0, sob: 0, pant: 0, laugh: 0, verb: 0, open: 1, channel: 'phone',
};

type P = Partial<VoiceSpec>;
export const PROFILES: Record<VoiceId, P> = {
  homem: { f0: 110, fmt: 1, rate: 6.0 },
  mulher: { f0: 210, fmt: 1.16, rate: 6.3, vary: 0.06, range: 0.16, breath: 0.09, tilt: 1.1 },
  idoso: { f0: 118, fmt: 0.98, rate: 4.8, breath: 0.16, tilt: 1.25, vibDepth: 22, vib: 5.2, jitter: 16, gap: 0.12 },
  idosa: { f0: 190, fmt: 1.1, rate: 5.0, vary: 0.06, breath: 0.15, tilt: 1.25, vibDepth: 34, vib: 5.6, jitter: 14 },
  crianca: { f0: 300, fmt: 1.32, rate: 7.4, vary: 0.1, range: 0.22, tilt: 1.0, breath: 0.07 },
  menino: { f0: 255, fmt: 1.26, rate: 7.0, vary: 0.09, range: 0.2 },
  adolescente: { f0: 168, fmt: 1.12, rate: 6.8, vary: 0.08, range: 0.18, crack: 0.08 },
  jovem_h: { f0: 125, fmt: 1.03, rate: 6.6, vary: 0.06, range: 0.14 },
  jovem_m: { f0: 222, fmt: 1.18, rate: 6.6, vary: 0.07, range: 0.17, breath: 0.08 },
  grave: { f0: 85, fmt: 0.92, rate: 5.4, vary: 0.04, range: 0.1, tilt: 1.15 },
  aguda: { f0: 265, fmt: 1.22, rate: 6.6, vary: 0.08, range: 0.18 },
  bebado: { f0: 112, fmt: 0.98, rate: 4.6, vary: 0.1, slur: 0.75, breath: 0.12, jitter: 12, gap: 0.02 },
  profissional: { f0: 128, fmt: 1.02, rate: 6.2, vary: 0.03, range: 0.08, gap: 0.12 },
  simone: { f0: 180, fmt: 1.12, rate: 6.2, vary: 0.06, breath: 0.26, rasp: 0.5, tilt: 1.0, channel: 'room', verb: 0.08 },
  peixoto: { f0: 105, fmt: 0.97, rate: 6.6, vary: 0.04, range: 0.12, gap: 0.32, channel: 'room', verb: 0.07 },
  henrique: { f0: 115, fmt: 1, rate: 4.6, vary: 0.04, range: 0.1, gap: 0.08, channel: 'room', verb: 0.08 },
  bene: { f0: 95, fmt: 0.95, rate: 5.4, range: 0.1, warm: 0.6, breath: 0.07, channel: 'room', verb: 0.07 },
  lucia: { f0: 205, fmt: 1.14, rate: 5.8, vary: 0.06, range: 0.14, warm: 0.35, breath: 0.08, channel: 'room', verb: 0.1 },
  // o Alex (marido, com a protagonista mulher): homem adulto, voz grave e quente, o mesmo ritmo da Lúcia
  alex: { f0: 106, fmt: 0.98, rate: 5.8, vary: 0.05, range: 0.13, warm: 0.45, breath: 0.08, tilt: 1.1, channel: 'room', verb: 0.1 },
  davi: { f0: 290, fmt: 1.3, rate: 7.0, vary: 0.1, range: 0.2, channel: 'room', verb: 0.1 },
  zelia: { f0: 185, fmt: 1.08, rate: 4.6, vibDepth: 30, vib: 5.4, breath: 0.15, tilt: 1.25, jitter: 10, channel: 'room', verb: 0.1 },
  cida: { f0: 195, fmt: 1.14, rate: 6.6, vary: 0.09, range: 0.22, breath: 0.07 },
  radio: { f0: 120, fmt: 1, rate: 6.4, channel: 'radio' },
};

/** Perfil + estilo → parâmetros efetivos. */
export function specFor(profile: VoiceId, style?: LineStyle, rateMul = 1, overrides?: P): VoiceSpec {
  const s: VoiceSpec = { ...BASE, ...(PROFILES[profile] ?? {}) };
  switch (style) {
    case 'arrastada':
      s.rate *= 0.68; s.f0 *= 0.9; s.slur = Math.max(s.slur, 0.7); s.gap = 0.02; s.vary *= 0.7; s.jitter += 6;
      break;
    case 'sussurro':
      s.whisper = 0.97; s.level *= 0.85; s.rate *= 0.95; s.breath = 0.5;
      break;
    case 'grito':
      s.level *= 1.55; s.f0 *= 1.38; s.open = 1.14; s.tilt *= 0.72; s.rate *= 1.05; s.range += 0.1; s.drive = 0.45; s.gap *= 0.6;
      break;
    case 'choro':
      s.vib = 6.5; s.vibDepth = Math.max(s.vibDepth, 55); s.f0 *= 1.12; s.sob = 0.35; s.rate *= 0.85; s.breath += 0.15; s.trem = 0.25; s.tremRate = 5.5;
      break;
    case 'tremida':
      s.jitter += 45; s.trem = 0.3; s.tremRate = 8; s.rate *= 0.92;
      break;
    case 'calma':
      s.rate *= 0.88; s.vary *= 0.6; s.range *= 0.7; s.level *= 0.85; s.slur += 0.2;
      break;
    case 'ofegante':
      s.pant = 0.5; s.breath += 0.2; s.gap += 0.04;
      break;
    case 'rindo':
      s.laugh = 0.3; s.vary *= 1.5; s.fmt *= 1.04; s.range += 0.05;
      break;
    case 'fantasma':
      s.whisper = 0.85; s.reverse = true; s.level *= 0.5; s.f0 *= 0.92; s.rate *= 0.8; s.verb = 0.65; s.channel = 'room';
      break;
    default:
      break;
  }
  s.rate *= clamp(rateMul || 1, 0.3, 3);
  return overrides ? { ...s, ...overrides } : s;
}

// -----------------------------------------------------------------------------
// Plano de fala
// -----------------------------------------------------------------------------
export interface SylSeg {
  kind: 'syl';
  t: number;
  dur: number;
  onset: Onset;
  onsetDur: number;
  v: Vowel;
  v2?: Vowel;
  nasal: boolean;
  coda: Coda;
  codaDur: number;
  stress: boolean;
  f0: number;
  f0End: number;
  amp: number;
  gap: number;
  /** liga a próxima sílaba (mesma palavra) */
  legato: boolean;
  crack?: boolean;
  /** falsete/soluço: pitch quebra para cima */
  breakUp?: boolean;
}
export interface BreathSeg {
  kind: 'breath';
  t: number;
  dur: number;
  inhale: boolean;
  amp: number;
}
/** "piii" da censura (1.1): tom senoidal puro no lugar do palavrão, com a duração da palavra */
export interface BeepSeg {
  kind: 'beep';
  t: number;
  dur: number;
  /** frequência do bipe (Hz) */
  f: number;
  amp: number;
}
export type Seg = SylSeg | BreathSeg | BeepSeg;

/** frequência do bipe de censura */
export const BEEP_HZ = 1000;

export interface Plan {
  segs: Seg[];
  dur: number;
}

/** Sílaba antes de temporizar. */
export interface RawSyl {
  onset: Onset;
  v: Vowel;
  v2?: Vowel;
  nasal: boolean;
  coda: Coda;
  stress: boolean;
  wordStart: boolean;
  wordEnd: boolean;
  caps: boolean;
  /** pontuação após a sílaba (só no fim de palavra) */
  punct: '' | ',' | '.' | '?' | '!' | '...' | ';';
  special?: 'laugh' | 'sob' | 'cough' | 'sigh' | 'breath' | 'pause' | 'bleep';
  /** duração do bipe (s), só em `special: 'bleep'` */
  bleepDur?: number;
}

const VOWEL_CHARS = 'aeiouáàâãéêíóôõúüy';
const isVowelCh = (c: string): boolean => VOWEL_CHARS.includes(c);
const CLITICS = new Set([
  'a', 'o', 'e', 'as', 'os', 'de', 'da', 'do', 'das', 'dos', 'em', 'na', 'no', 'nas', 'nos', 'um', 'uns', 'que', 'se', 'me', 'te',
  'lhe', 'por', 'pra', 'pro', 'com', 'sem', 'mas', 'ou', 'nem', 'ao', 'à', 'num', 'numa', 'meu', 'seu', 'tu', 'eu',
]);
const CLUSTERS = new Set(['pr', 'br', 'tr', 'dr', 'cr', 'gr', 'fr', 'vr', 'pl', 'bl', 'cl', 'gl', 'fl', 'tl']);
const DIGITS = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];

/** Limpa marcação de conteúdo ({{trecho|pista}}, {m:a|b}, "QUEM: ") e normaliza. */
export function cleanText(text: string): string {
  let s = String(text ?? '');
  s = s.replace(/\{\{([^|}]*)\|[^}]*\}\}/g, '$1');
  s = s.replace(/\{[mf]:([^|}]*)\|[^}]*\}/gi, '$1');
  s = s.replace(/\{[^}]*\}/g, 'fulano');
  s = s.replace(/^\s*[A-Z\u00c0-\u00dd0-9 ._-]{2,24}:\s+/, '');
  return s;
}

function vowelInfo(c: string): { v: Vowel; acc: boolean; nasal: boolean; grave: boolean } {
  switch (c) {
    case 'á': case 'â': return { v: 'a', acc: true, nasal: false, grave: false };
    case 'à': return { v: 'a', acc: false, nasal: false, grave: true };
    case 'ã': return { v: 'a', acc: true, nasal: true, grave: false };
    case 'é': return { v: 'E', acc: true, nasal: false, grave: false };
    case 'ê': return { v: 'e', acc: true, nasal: false, grave: false };
    case 'í': return { v: 'i', acc: true, nasal: false, grave: false };
    case 'ó': return { v: 'O', acc: true, nasal: false, grave: false };
    case 'ô': return { v: 'o', acc: true, nasal: false, grave: false };
    case 'õ': return { v: 'o', acc: true, nasal: true, grave: false };
    case 'ú': return { v: 'u', acc: true, nasal: false, grave: false };
    case 'e': return { v: 'e', acc: false, nasal: false, grave: false };
    case 'o': return { v: 'o', acc: false, nasal: false, grave: false };
    case 'i': case 'y': return { v: 'i', acc: false, nasal: false, grave: false };
    case 'u': case 'ü': return { v: 'u', acc: false, nasal: false, grave: false };
    default: return { v: 'a', acc: false, nasal: false, grave: false };
  }
}

function onsetClass(cons: string, nextVowel: string, wordInitial: boolean): Onset {
  if (!cons) return '';
  const c = cons.startsWith('qu') || cons.startsWith('gu') ? cons.slice(0, 1) : cons;
  const first2 = c.slice(0, 2);
  const soft = 'eiéêíy'.includes(nextVowel);
  if (first2 === 'ch') return 'x';
  if (first2 === 'lh') return 'l';
  if (first2 === 'nh') return 'n';
  if (first2 === 'rr') return 'h';
  if (first2 === 'ss') return 's';
  const f = c[0];
  switch (f) {
    case 'p': case 't': case 'k': case 'q': return 'p';
    case 'c': return soft ? 's' : 'p';
    case 'b': case 'd': return 'b';
    case 'g': return soft ? 'j' : 'b';
    case 'f': return 'f';
    case 'v': case 'w': return 'v';
    case 's': case 'ç': return 's';
    case 'z': return 'z';
    case 'x': return 'x';
    case 'j': return 'j';
    case 'm': case 'n': return 'n';
    case 'l': return 'l';
    case 'r': return wordInitial ? 'h' : 'l';
    default: return '';
  }
}

/** Divide uma palavra em sílabas fonéticas aproximadas. */
function syllabify(word: string, caps: boolean): RawSyl[] {
  const w = word.toLowerCase();
  // unidades: consoantes (com dígrafos) e vogais
  const units: { s: string; vowel: boolean }[] = [];
  for (let i = 0; i < w.length; ) {
    const two = w.slice(i, i + 2);
    if (two === 'ch' || two === 'lh' || two === 'nh' || two === 'rr' || two === 'ss') {
      units.push({ s: two, vowel: false });
      i += 2;
      continue;
    }
    if ((two === 'qu' || two === 'gu') && 'eiéêí'.includes(w[i + 2] ?? '')) {
      units.push({ s: two, vowel: false });
      i += 2;
      continue;
    }
    if (w[i] === 'h') {
      i++; // h mudo
      continue;
    }
    units.push({ s: w[i], vowel: isVowelCh(w[i]) });
    i++;
  }
  interface G { onset: string; v1: string; v2?: string; coda: string }
  const groups: G[] = [];
  let i = 0;
  let pending = '';
  while (i < units.length) {
    const u = units[i];
    if (!u.vowel) {
      pending += u.s;
      i++;
      continue;
    }
    const g: G = { onset: pending, v1: u.s, coda: '' };
    pending = '';
    i++;
    // ditongo: segunda vogal i/u átona (ou nasal ão/ãe/õe)
    if (i < units.length && units[i].vowel) {
      const n = units[i].s;
      const nasalDiph = (g.v1 === 'ã' || g.v1 === 'õ') && (n === 'o' || n === 'e');
      const glide = (n === 'i' || n === 'u') && !(g.v1 === 'i' || g.v1 === 'u');
      const nextIsNh = units[i + 1]?.s === 'nh';
      if ((nasalDiph || glide) && !nextIsNh) {
        g.v2 = n;
        i++;
      }
    }
    // consoantes até a próxima vogal
    const cons: string[] = [];
    let j = i;
    while (j < units.length && !units[j].vowel) cons.push(units[j++].s);
    if (j >= units.length) {
      g.coda = cons.join('');
      i = j;
    } else if (cons.length >= 2 && CLUSTERS.has(cons[cons.length - 2] + cons[cons.length - 1])) {
      g.coda = cons.slice(0, -2).join('');
      pending = cons.slice(-2).join('');
      i = j;
    } else if (cons.length >= 1) {
      g.coda = cons.slice(0, -1).join('');
      pending = cons[cons.length - 1];
      i = j;
    }
    groups.push(g);
  }
  if (!groups.length) return [];
  if (pending && groups.length) groups[groups.length - 1].coda += pending;

  // tonicidade
  let stressIdx = -1;
  for (let k = groups.length - 1; k >= 0 && stressIdx < 0; k--) {
    const a = vowelInfo(groups[k].v1);
    if (a.acc && !a.nasal) stressIdx = k;
  }
  for (let k = groups.length - 1; k >= 0 && stressIdx < 0; k--) {
    if (vowelInfo(groups[k].v1).nasal) stressIdx = k;
  }
  if (stressIdx < 0) {
    if (groups.length === 1) stressIdx = CLITICS.has(w) ? -1 : 0;
    else if (/(i|is|u|us|r|l|z|x|im|ins|um|uns|om|ons)$/.test(w)) stressIdx = groups.length - 1;
    else stressIdx = groups.length - 2;
  }

  const out: RawSyl[] = [];
  groups.forEach((g, k) => {
    const last = k === groups.length - 1;
    const stress = k === stressIdx;
    const vi = vowelInfo(g.v1);
    let v = vi.v;
    let nasal = vi.nasal;
    const codaLast = g.coda.slice(-1);
    let coda: Coda = '';
    let v2: Vowel | undefined = g.v2 ? vowelInfo(g.v2).v : undefined;
    if (codaLast === 's' || codaLast === 'z' || codaLast === 'x') coda = 's';
    else if (codaLast === 'r') coda = 'r';
    else if (codaLast === 'm' || codaLast === 'n') {
      coda = 'n';
      nasal = true;
    } else if (codaLast === 'l' && !v2) v2 = 'u'; // "Brasil" → "Brasiu"
    // redução de vogais átonas finais do PB: e → i, o → u
    if (!stress && last && (g.coda === '' || g.coda === 's')) {
      if (v === 'e') v = 'i';
      else if (v === 'o') v = 'u';
    }
    let onset = onsetClass(g.onset, g.v1, k === 0);
    const first = g.onset.replace(/^(qu|gu)/, (m) => m[0])[0];
    if (v === 'i' && first === 't' && g.onset.length === 1) onset = 'tch';
    if (v === 'i' && first === 'd' && g.onset.length === 1) onset = 'dj';
    out.push({ onset, v, v2, nasal, coda, stress, wordStart: k === 0, wordEnd: last, caps, punct: '' });
  });
  return out;
}

// Rubricas → efeito. Cada termo precisa começar uma palavra (antes, "/ri/" achava risada em
// "[silêncio comprido]", "[gritos]", "(criança)", "(marido)", "(irritado)" e "(sem risco)", e
// "/chor/" achava choro em "(cachorro latindo)"). Sem efeito reconhecido, a rubrica vira pausa.
const W = '(?:^|[^\\p{L}])';
const SPECIALS: [RegExp, RawSyl['special']][] = [
  [new RegExp(`${W}pi{2,}`, 'iu'), 'bleep'],
  [new RegExp(`${W}(?:(?:ri|riu|rir|rindo|riso|risos)(?!\\p{L})|risad|risinh|gargalh|hah|ha ha|kkk)`, 'iu'), 'laugh'],
  [new RegExp(`${W}(?:chor|solu[çc]|funga)`, 'iu'), 'sob'],
  [new RegExp(`${W}(?:toss|engasg)`, 'iu'), 'cough'],
  [new RegExp(`${W}(?:suspir|bocej)`, 'iu'), 'sigh'],
  [new RegExp(`${W}(?:respir|ofeg|arfa)`, 'iu'), 'breath'],
];

/** efeito de uma rubrica ("[risadas]", "(chorando)") — exportado para os testes */
export function rubricEffect(inner: string): NonNullable<RawSyl['special']> {
  const hit = SPECIALS.find(([r]) => r.test(inner));
  return hit ? hit[1]! : 'pause';
}

function specialSyl(kind: RawSyl['special'], bleepDur?: number): RawSyl {
  const s: RawSyl = { onset: '', v: 'a', nasal: false, coda: '', stress: false, wordStart: true, wordEnd: true, caps: false, punct: '', special: kind };
  if (bleepDur !== undefined) s.bleepDur = bleepDur;
  return s;
}

/** Texto → sílabas brutas (com pontuação, efeitos entre colchetes e o "piii" da censura). */
export function parseText(text: string): RawSyl[] {
  const s = cleanText(text).replace(/\d/g, (d) => ' ' + DIGITS[Number(d)] + ' ');
  const out: RawSyl[] = [];
  // [rubrica] e (rubrica) são descrições de cena: viram choro, risada, pausa etc., nunca palavras lidas;
  // "#%!#@$" (3+ símbolos de quadrinho, ver engine/bleep.ts) é palavrão censurado: vira o bipe
  const re = /\[([^\]]*)\]|\(([^)]*)\)|((?=[#%!@$&*]*[#%@$&*])[#%!@$&*]{3,12})|([A-Za-z\u00c0-\u00ff]+)|(\.\.\.|\u2026|[.,;:!?\u2014\u2013]|\s-\s)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m[1] !== undefined || m[2] !== undefined) {
      const inner = m[1] ?? m[2];
      const fx = rubricEffect(inner);
      out.push(fx === 'bleep' ? specialSyl('bleep', 0.45) : specialSyl(fx));
      continue;
    }
    if (m[3] !== undefined) {
      out.push(specialSyl('bleep', bleepDuration(m[3])));
      continue;
    }
    if (m[4] !== undefined) {
      const word = m[4];
      const caps = word.length > 1 && word === word.toUpperCase() && word !== word.toLowerCase();
      out.push(...syllabify(word, caps));
      continue;
    }
    const p = m[5];
    const lastSyl = out[out.length - 1];
    if (!lastSyl) continue;
    const punct: RawSyl['punct'] =
      p === '...' || p === '…' ? '...' : p === '?' ? '?' : p === '!' ? '!' : p === '.' ? '.' : p === ',' ? ',' : ';';
    // "?!" mantém o mais forte
    if (lastSyl.punct === '?' || lastSyl.punct === '!') continue;
    lastSyl.punct = punct;
  }
  return out;
}

const PAUSE: Record<RawSyl['punct'], number> = { '': 0, ',': 0.17, ';': 0.22, '.': 0.32, '?': 0.32, '!': 0.3, '...': 0.5 };

/** Sílabas aleatórias "com cara de português" (para balbucios de fundo). */
export function randomRaw(r: Rand, words: number): RawSyl[] {
  const onsets: Onset[] = ['', 'p', 'p', 'b', 's', 'n', 'n', 'l', 'l', 'x', 'f', 'v', 'tch', 'h', 'z', 'j', 'dj'];
  const vowels: Vowel[] = ['a', 'a', 'a', 'e', 'e', 'E', 'i', 'o', 'O', 'u'];
  const out: RawSyl[] = [];
  for (let w = 0; w < words; w++) {
    const n = 1 + Math.floor(r() * 3.2);
    const st = n === 1 ? 0 : n - 2;
    for (let k = 0; k < n; k++) {
      const v = pick(r, vowels);
      const last = k === n - 1;
      out.push({
        onset: pick(r, onsets),
        v: last && v === 'o' ? 'u' : v,
        v2: r() < 0.08 ? pick(r, ['i', 'u'] as Vowel[]) : undefined,
        nasal: r() < 0.12,
        coda: last && r() < 0.3 ? 's' : r() < 0.06 ? 'r' : '',
        stress: k === st,
        wordStart: k === 0,
        wordEnd: last,
        caps: false,
        punct: last && w === words - 1 ? (r() < 0.2 ? '?' : '.') : last && r() < 0.12 ? ',' : '',
      });
    }
  }
  return out;
}

/** Duração máxima de uma fala (s). */
export const MAX_LINE = 6;

/**
 * Temporiza e entoa as sílabas. Determinístico para (texto, perfil, estilo).
 */
export function buildPlan(raw: RawSyl[], spec: VoiceSpec, r: Rand, maxDur = MAX_LINE): Plan {
  // insere efeitos de estilo (soluço, risada, respiração) entre palavras
  const items: RawSyl[] = [];
  for (let k = 0; k < raw.length; k++) {
    const s = raw[k];
    if (s.wordStart && !s.special && k > 0) {
      if (spec.sob > 0 && r() < spec.sob * 0.5) items.push(specialSyl('sob'));
      else if (spec.pant > 0 && r() < spec.pant * 0.6) items.push(specialSyl('breath'));
      else if (spec.laugh > 0 && r() < spec.laugh) items.push(specialSyl('laugh'));
    }
    items.push(s);
  }
  if (spec.pant > 0 && items.length) items.unshift(specialSyl('breath'));

  const base = 1 / Math.max(1.5, spec.rate);
  const segs: Seg[] = [];
  let t = 0;
  // agrupa por frase entonacional (até a pontuação)
  let phraseStart = 0;
  const phraseLen = (from: number): number => {
    let n = 0;
    for (let k = from; k < items.length; k++) {
      if (!items[k].special) n++;
      if (items[k].punct) break;
    }
    return Math.max(1, n);
  };
  let pIdx = 0;
  let pLen = phraseLen(0);
  let pendingBreak = false;

  const push = (seg: Seg): void => {
    segs.push(seg);
  };

  for (let k = 0; k < items.length; k++) {
    const s = items[k];
    if (s.special) {
      t = specialSegs(s.special, t, spec, r, push, s.bleepDur);
      if (s.special === 'sob') pendingBreak = true;
      continue;
    }
    // ---- duração
    let d = base;
    d *= s.stress ? 1.3 : 0.86;
    const phraseFinal = s.punct !== '' || k === items.length - 1;
    if (phraseFinal) d *= 1.4;
    else if (s.wordEnd) d *= 1.05;
    if (s.caps) d *= 1.1;
    d *= rr(r, 0.9, 1.1);
    const onsetDur = onsetLen(s.onset, d);
    const codaDur = s.coda === 's' ? Math.min(0.07, d * 0.3) : s.coda === 'r' ? Math.min(0.045, d * 0.2) : 0;
    const gapFrac = s.wordEnd ? spec.gap : spec.gap * 0.3;
    const gap = phraseFinal ? Math.max(0.03, d * gapFrac) : d * gapFrac;

    // ---- pitch (declinação + acento + contorno final)
    const prog = pIdx / pLen;
    let f = spec.f0 * (1.06 - 0.14 * prog);
    if (s.stress) f *= 1 + spec.range;
    f *= 1 + spec.vary * (r() * 2 - 1);
    if (s.caps) f *= 1.15;
    let fEnd = f;
    const end = s.punct;
    const lastStressOrFinal = phraseFinal || isLastStress(items, k);
    if (lastStressOrFinal) {
      if (end === '?') {
        f *= 1 + spec.range * 1.2;
        fEnd = f * (1 + spec.range * 1.6);
      } else if (end === '!' ) {
        f *= 1.08 + spec.range * 0.5;
        fEnd = f * 0.92;
      } else if (end === ',' || end === ';') {
        fEnd = f * 1.05;
      } else if (phraseFinal) {
        fEnd = f * 0.82;
      }
    }
    if (pendingBreak) {
      f *= 1.35;
      pendingBreak = false;
    }
    const crack = spec.crack > 0 && r() < spec.crack;
    // ---- amplitude
    let amp = s.stress ? 1 : 0.72;
    if (phraseFinal && !s.stress) amp *= 0.82;
    if (s.caps) amp *= 1.25;
    if (end === '!') amp *= 1.1;
    amp *= rr(r, 0.92, 1.05);

    const next = items[k + 1];
    push({
      kind: 'syl',
      t,
      dur: d,
      onset: s.onset,
      onsetDur,
      v: s.v,
      v2: s.v2,
      nasal: s.nasal,
      coda: s.coda,
      codaDur,
      stress: s.stress,
      f0: f,
      f0End: fEnd,
      amp,
      gap,
      legato: !s.wordEnd && !!next && !next.special,
      crack,
    });
    t += d + PAUSE[s.punct] * (0.85 + 0.3 * r()) * (spec.rate < 5 ? 1.2 : 1);
    pIdx++;
    if (s.punct) {
      phraseStart = k + 1;
      pIdx = 0;
      pLen = phraseLen(phraseStart);
    }
  }
  let dur = t;
  if (segs.length && dur > maxDur) return fitPlan(segs, dur, maxDur);
  return { segs, dur: Math.max(0, dur) };
}

function isLastStress(items: RawSyl[], k: number): boolean {
  if (!items[k].stress) return false;
  for (let j = k + 1; j < items.length; j++) {
    if (items[j].stress && !items[j].special) return false;
    if (items[j].punct) return true;
  }
  return true;
}

function onsetLen(o: Onset, d: number): number {
  const m: Record<Onset, number> = {
    '': 0, p: 0.05, b: 0.04, f: 0.075, v: 0.06, s: 0.085, z: 0.07, x: 0.085, j: 0.07, n: 0.05, l: 0.035, h: 0.065, tch: 0.08, dj: 0.07,
  };
  return Math.min(m[o], d * 0.42);
}

function specialSegs(kind: NonNullable<RawSyl['special']>, t: number, spec: VoiceSpec, r: Rand, push: (s: Seg) => void, bleepDur = 0.45): number {
  const syl = (tt: number, d: number, f: number, amp: number, v: Vowel, onset: Onset = 'h'): SylSeg => ({
    kind: 'syl', t: tt, dur: d, onset, onsetDur: Math.min(0.03, d * 0.35), v, nasal: false, coda: '', codaDur: 0, stress: true,
    f0: f, f0End: f * 0.94, amp, gap: d * 0.28, legato: false,
  });
  switch (kind) {
    case 'laugh': {
      const n = 3 + Math.floor(r() * 3);
      const v: Vowel = pick(r, ['a', 'e', 'i'] as Vowel[]);
      for (let i = 0; i < n; i++) {
        push(syl(t, 0.12, spec.f0 * (1.5 - i * 0.06), 0.8 - i * 0.08, v));
        t += 0.13 + r() * 0.02;
      }
      return t + 0.1;
    }
    case 'sob': {
      push({ kind: 'breath', t, dur: 0.2, inhale: true, amp: 0.9 });
      push({ kind: 'breath', t: t + 0.22, dur: 0.12, inhale: true, amp: 0.7 });
      return t + 0.4;
    }
    case 'cough': {
      push(syl(t, 0.16, spec.f0 * 0.9, 1.1, 'a', 'p'));
      push(syl(t + 0.22, 0.14, spec.f0 * 0.85, 0.9, 'a', 'p'));
      return t + 0.5;
    }
    case 'sigh': {
      push({ kind: 'breath', t, dur: 0.35, inhale: true, amp: 0.6 });
      const s = syl(t + 0.38, 0.55, spec.f0 * 1.05, 0.45, 'a');
      s.f0End = spec.f0 * 0.75;
      push(s);
      return t + 1.0;
    }
    case 'breath': {
      push({ kind: 'breath', t, dur: 0.17, inhale: true, amp: 0.8 });
      push({ kind: 'breath', t: t + 0.2, dur: 0.16, inhale: false, amp: 0.7 });
      return t + 0.4;
    }
    case 'bleep': {
      // o "piii" da TV: começa colado na palavra anterior e deixa um respiro curto depois
      push({ kind: 'beep', t: t + 0.02, dur: bleepDur, f: BEEP_HZ, amp: 1 });
      return t + 0.02 + bleepDur + 0.08;
    }
    default:
      return t + 0.35;
  }
}

/** Comprime/corta um plano longo: acelera até 25%, depois mantém o fim da frase. */
function fitPlan(segs: Seg[], dur: number, maxDur: number): Plan {
  const speed = Math.min(1.25, dur / maxDur);
  const scaled = segs.map((s) => ({ ...s, t: s.t / speed, dur: s.dur / speed }));
  const total = dur / speed;
  if (total <= maxDur) return { segs: scaled, dur: total };
  // mantém as últimas 3 sílabas (entonação final) e o início que couber
  const tail = scaled.slice(-3);
  const tailStart = tail[0].t;
  const tailDur = total - tailStart;
  const headLimit = maxDur - tailDur - 0.12;
  const head = scaled.filter((s) => s.t + s.dur <= headLimit);
  const lastHeadEnd = head.length ? head[head.length - 1].t + head[head.length - 1].dur + 0.12 : 0;
  const shift = tailStart - lastHeadEnd;
  const out = [...head, ...tail.map((s) => ({ ...s, t: s.t - shift }))];
  return { segs: out, dur: total - shift };
}

/** Semente determinística para fala. */
export function speechSeed(text: string, profile: string, style?: string): Rand {
  return mulberry32(hashStr(profile + '|' + (style ?? '') + '|' + text));
}

// -----------------------------------------------------------------------------
// Formantes (adulto masculino, PB aproximado)
// -----------------------------------------------------------------------------
export const FORMANTS: Record<Vowel, [number, number, number]> = {
  a: [720, 1300, 2500],
  E: [560, 1800, 2550],
  e: [420, 2000, 2650],
  i: [290, 2250, 2950],
  O: [560, 950, 2450],
  o: [430, 850, 2400],
  u: [320, 800, 2350],
};
const SCHWA: [number, number, number] = [500, 1500, 2500];

export function vowelFormants(v: Vowel, spec: VoiceSpec, stress: boolean, nasal: boolean): [number, number, number] {
  const f = FORMANTS[v];
  const c = stress ? 0 : 0.25; // centralização da átona
  let f1 = (f[0] + (SCHWA[0] - f[0]) * c) * spec.fmt * spec.open;
  const f2 = (f[1] + (SCHWA[1] - f[1]) * c) * spec.fmt;
  const f3 = (f[2] + (SCHWA[2] - f[2]) * c) * spec.fmt;
  if (nasal) f1 *= 0.88;
  return [f1, f2, f3];
}
