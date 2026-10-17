// =============================================================================
// Nome do protagonista dentro da arte (crachá desenhado, rótulos da galeria).
// A arte não lê o estado do jogo: quem desenha passa o nome escolhido pelo
// jogador (EndingOpts.name, protagonistLabel(g, nome)); sem ele, valem os
// padrões abaixo.
// =============================================================================
import { textWidth } from './font';

export type ArtGender = 'M' | 'F';

/** primeiro nome padrão do protagonista (antes de o jogador renomear) */
export const DEFAULT_FIRST_NAME: Record<ArtGender, string> = { M: 'Thiago', F: 'Camille' };
/** sobrenome da família */
export const DEFAULT_SURNAME = 'Moura';

/** primeiro nome limpo (vazio/só espaços → padrão do gênero) */
export function firstNameOr(g: ArtGender, first?: string | null): string {
  const n = (first ?? '').replace(/\s+/g, ' ').trim();
  return n || DEFAULT_FIRST_NAME[g];
}

/** "Dr. Thiago Moura" / "Dra. Camille Moura" (com o nome escolhido, se houver) */
export function protagonistLabel(g: ArtGender, first?: string | null, surname: string = DEFAULT_SURNAME): string {
  return `${g === 'F' ? 'Dra.' : 'Dr.'} ${firstNameOr(g, first)} ${surname}`.replace(/\s+/g, ' ').trim();
}

/**
 * Quebra palavras em linhas que cabem em `width` px na fonte 3×5 (maiúsculas),
 * no máximo `maxLines`; palavra comprida demais é cortada com ponto ("MAXIMIL.").
 * A última linha que estourar o limite também termina em ponto.
 */
export function fitLines(words: string[], width: number, maxLines: number): string[] {
  const cut = (w: string) => {
    if (textWidth(w) <= width) return w;
    let s = w;
    while (s.length > 1 && textWidth(s + '.') > width) s = s.slice(0, -1);
    return s + '.';
  };
  const lines: string[] = [];
  let cur = '';
  for (const raw of words) {
    const w = cut(raw.toUpperCase());
    if (!w) continue;
    const tryLine = cur ? `${cur} ${w}` : w;
    if (textWidth(tryLine) <= width) cur = tryLine;
    else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const keep = lines.slice(0, maxLines);
    const last = keep[maxLines - 1];
    keep[maxLines - 1] = last.endsWith('.') ? last : cut(last + '.');
    return keep;
  }
  return lines;
}
