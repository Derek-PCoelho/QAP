// Censura de palavrão (1.1): o "piii".
//
// Marcação no texto: uma sequência de 3 a 12 símbolos de quadrinho (# % ! @ $ & *) com pelo
// menos um que não seja "!" — por exemplo "#%!#@$", "&%$#!", "@#$%&*". É assim que a fala
// aparece na transcrição (o que se escreve é o que o jogador lê), e o áudio troca o trecho
// por um bipe de ~1 kHz com a duração da palavra. Palavrão de verdade nunca é escrito.
// "!!!" sozinho continua sendo pontuação (ênfase), não censura.

/** um trecho censurado (global: use com matchAll/replace) */
export const BLEEP_RE = /(?=[#%!@$&*]*[#%@$&*])[#%!@$&*]{3,12}/g;

const ONE = new RegExp(BLEEP_RE.source);

/** o texto tem algum trecho censurado */
export function hasBleep(text: string): boolean {
  return ONE.test(text);
}

export interface BleepSeg {
  text: string;
  bleep?: boolean;
}

/** divide o texto em trechos normais e censurados (para a transcrição) */
export function splitBleeps(text: string): BleepSeg[] {
  const out: BleepSeg[] = [];
  let i = 0;
  for (const m of text.matchAll(BLEEP_RE)) {
    const at = m.index ?? 0;
    if (at > i) out.push({ text: text.slice(i, at) });
    out.push({ text: m[0], bleep: true });
    i = at + m[0].length;
  }
  if (i < text.length) out.push({ text: text.slice(i) });
  return out;
}

/** duração do bipe (s) para um trecho censurado: ~ a duração da palavra que ele cobre */
export function bleepDuration(symbols: string): number {
  return Math.min(0.75, Math.max(0.28, 0.07 * symbols.length));
}
