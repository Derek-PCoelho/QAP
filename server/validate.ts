// =============================================================================
// Validação e saneamento de entradas. Toda função lança HttpError(400) com uma
// mensagem em português quando a entrada é inválida.
// =============================================================================
import { HttpError, isPlainObject } from './http';
import { ID_RE, SLOT_RE, SESSION_RE, MODES, TOKEN_RE, type GameMode, type Slot } from './config';

/**
 * caracteres de controle/formatação invisíveis (inclui os de direção do texto, como o U+202E
 * que inverte o nome, e os de largura zero), os "brancos" que não são espaço (preenchimento do
 * hangul, braille vazio, separador mongol, khmer) e os sinais de tag HTML
 */
const STRIP_RE = /[\p{Cc}\p{Cf}\p{Co}\p{Cs}\p{Zl}\p{Zp}\u115F\u1160\u17B4\u17B5\u180E\u2800\u3164\uFFA0<>]/gu;
/** "zalgo": no máximo dois acentos empilhados na mesma letra (contados com o texto decomposto) */
const MARKS_RE = /(\p{M}{2})\p{M}+/gu;
/** marcas que não desenham nada sozinhas: seletores de variação, o "joiner" de grafemas U+034F */
const INVISIBLE_MARKS_RE = /[\u034F\uFE00-\uFE0F\u{E0100}-\u{E01EF}]/gu;
/** acentos sem letra antes (no começo do texto ou depois de um espaço) */
const ORPHAN_MARKS_RE = /(^|\s)\p{M}+/gu;
/** um nome precisa ter pelo menos uma letra, número ou símbolo visível */
const VISIBLE_RE = /[\p{L}\p{N}\p{S}\p{P}]/u;

/**
 * Saneia um rótulo livre (nome, semente, versão): normaliza Unicode (NFKC: letras de largura
 * total e "negrito matemático" viram as letras comuns, o que evita nomes que só parecem iguais),
 * troca qualquer sequência de espaços por um espaço, remove caracteres de controle, invisíveis e
 * `<` `>`, limita acentos empilhados e apara as pontas. Devolve null se não for string.
 */
export function sanitizeLabel(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const out = value
    .normalize('NFKC')
    .replace(/\s+/gu, ' ')
    .replace(STRIP_RE, '')
    .replace(INVISIBLE_MARKS_RE, '')
    .normalize('NFD')
    .replace(ORPHAN_MARKS_RE, '$1')
    .replace(MARKS_RE, '$1')
    .replace(/ {2,}/g, ' ')
    .trim()
    .normalize('NFC');
  // só acentos/marcas (nada que se veja) vira texto vazio: o tamanho mínimo recusa
  return VISIBLE_RE.test(out) ? out : '';
}

export function charLength(s: string): number {
  return Array.from(s).length;
}

export function requireLabel(value: unknown, field: string, min: number, max: number): string {
  const s = sanitizeLabel(value);
  if (s === null) throw new HttpError(400, `${field} deve ser um texto`);
  const len = charLength(s);
  if (len < min || len > max) {
    throw new HttpError(400, min > 0 ? `${field} deve ter de ${min} a ${max} caracteres` : `${field} deve ter no máximo ${max} caracteres`);
  }
  return s;
}

export function requireInt(value: unknown, field: string, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    throw new HttpError(400, `${field} deve ser um inteiro entre ${min} e ${max}`);
  }
  return value;
}

export function requireNumber(value: unknown, field: string, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new HttpError(400, `${field} deve ser um número entre ${min} e ${max}`);
  }
  return value;
}

export function requireToken(value: unknown, field: string): string {
  if (typeof value !== 'string' || !TOKEN_RE.test(value)) {
    throw new HttpError(400, `${field} inválido`);
  }
  return value;
}

export function requireObject(value: unknown, field = 'corpo'): Record<string, unknown> {
  if (!isPlainObject(value)) throw new HttpError(400, `${field} deve ser um objeto JSON`);
  return value;
}

export function requireProfileId(value: unknown): string {
  if (typeof value !== 'string' || !ID_RE.test(value)) throw new HttpError(400, 'id de perfil inválido');
  return value;
}

export function optionalProfileId(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  return requireProfileId(value);
}

export function requireSlot(value: unknown): Slot {
  if (typeof value !== 'string' || !SLOT_RE.test(value)) {
    throw new HttpError(400, 'slot inválido (use auto, 1, 2, 3 ou infinito)');
  }
  return value as Slot;
}

export function requireSessionId(value: unknown): string {
  if (typeof value !== 'string' || !SESSION_RE.test(value)) throw new HttpError(400, 'sessionId inválido');
  return value;
}

export function requireMode(value: unknown, fallback: GameMode = 'infinito'): GameMode {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string' || !(MODES as readonly string[]).includes(value)) {
    throw new HttpError(400, `mode inválido (use ${MODES.join(', ')})`);
  }
  return value as GameMode;
}

/** Interpreta `since` como milissegundos desde a época ou data ISO (AAAA-MM-DD...). */
export function parseSince(value: string | null): number | null {
  if (value === null || value.trim() === '') return null;
  const v = value.trim();
  if (/^\d{1,15}$/.test(v)) return Number(v);
  if (/^\d{4}-\d{2}-\d{2}(?:[T ][\d:.]+(?:Z|[+-]\d{2}:?\d{2})?)?$/.test(v)) {
    const ms = Date.parse(v);
    if (Number.isFinite(ms)) return ms;
  }
  throw new HttpError(400, 'since inválido (use milissegundos ou data AAAA-MM-DD)');
}
