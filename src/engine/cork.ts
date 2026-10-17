// Quadro de cortiça (1.1): o jogador move tudo o que está preso, escolhe a cor do post-it antes
// de colar, remove os próprios papéis e cola adesivos do Ozzy.
//
// Estado no save: `GameState.cork` (opcional). Saves antigos não têm o campo: os post-its de texto
// da 1.0 (`flags.postits`, separados por \u0001) viram post-its amarelos na primeira leitura, e
// qualquer coisa estranha no campo é descartada em silêncio (o quadro nunca impede o save de abrir).
//
// Posições em fração da área do quadro (0–1), para não depender do tamanho da tela. As fichas da
// central (trotes, frequentadores) e os documentos não saem do quadro (quem prende é a Simone),
// mas podem mudar de lugar: a posição fica em `pos` pela chave `b:ID` (ficha) ou `d:ID` (documento).
import type { CorkColor, CorkItem, CorkState, GameState } from './types';
import { hashString } from './util';

export const CORK_COLORS: readonly CorkColor[] = ['amarelo', 'azul', 'rosa', 'verde', 'branco'];
/** adesivos do Ozzy (os mesmos ids da arte: src/client/art/stickers.ts) */
export const CORK_STICKERS = ['feliz', 'dormindo', 'latindo', 'coracao', 'festa', 'sirene'] as const;
export const CORK_MAX_POSTITS = 40;
export const CORK_MAX_STICKERS = 30;
export const CORK_TEXT_MAX = 80;

const clamp01 = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.5);
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** inclinação fixa por id (−3° a 3° nos post-its, −9° a 9° nos adesivos) */
export function corkTilt(id: string, kind: CorkItem['kind']): number {
  const h = hashString(id + ':tilt') >>> 0;
  return kind === 'adesivo' ? (h % 19) - 9 : (h % 7) - 3;
}

function cleanItem(x: unknown): CorkItem | null {
  if (!isObj(x) || typeof x.id !== 'string' || !x.id || x.id.length > 40) return null;
  if (x.kind === 'postit') {
    const text = typeof x.text === 'string' ? x.text.slice(0, CORK_TEXT_MAX) : '';
    if (!text.trim()) return null;
    const color = CORK_COLORS.includes(x.color as CorkColor) ? (x.color as CorkColor) : 'amarelo';
    return { id: x.id, kind: 'postit', x: clamp01(x.x), y: clamp01(x.y), text, color };
  }
  if (x.kind === 'adesivo') {
    const sticker = (CORK_STICKERS as readonly string[]).includes(x.sticker as string) ? (x.sticker as string) : 'feliz';
    return { id: x.id, kind: 'adesivo', x: clamp01(x.x), y: clamp01(x.y), sticker };
  }
  return null;
}

/** lugar automático para o k-ésimo papel sem posição (grade de 4 colunas, como o quadro antigo) */
export function autoSlot(k: number): [number, number] {
  const col = k % 4;
  const row = Math.floor(k / 4);
  const page = Math.floor(row / 3);
  return [0.02 + col * 0.245 + page * 0.03, 0.03 + (row % 3) * 0.31 + page * 0.04];
}

/**
 * O quadro do save, criado e conferido na hora (migração tolerante): sem `cork`, nasce vazio com os
 * post-its antigos de `flags.postits`; com `cork` estragado, fica só o que dá para usar.
 */
export function corkOf(st: GameState): CorkState {
  const raw = (st as unknown as { cork?: unknown }).cork;
  if (isObj(raw) && Array.isArray(raw.items) && isObj(raw.pos) && typeof raw.seq === 'number') {
    const c = raw as unknown as CorkState;
    // confere uma vez por leitura (barato: poucas dezenas de itens)
    const items: CorkItem[] = [];
    const seen = new Set<string>();
    for (const it of c.items) {
      const ok = cleanItem(it);
      if (ok && !seen.has(ok.id)) (seen.add(ok.id), items.push(ok));
    }
    const pos: Record<string, [number, number]> = {};
    for (const [k, v] of Object.entries(c.pos)) {
      if (k.length <= 80 && Array.isArray(v) && v.length === 2) pos[k] = [clamp01(v[0]), clamp01(v[1])];
    }
    c.items = items;
    c.pos = pos;
    if (!Number.isInteger(c.seq) || c.seq < items.length) c.seq = items.length;
    return c;
  }
  const fresh: CorkState = { items: [], pos: {}, seq: 0 };
  const old = st.flags['postits'];
  if (typeof old === 'string' && old) {
    const notes = old.split('\u0001').map((t) => t.trim().slice(0, CORK_TEXT_MAX)).filter(Boolean);
    // os papéis antigos ficam depois das fichas da central, na mesma ordem em que estavam
    const base = st.board.length + st.docs.length;
    notes.forEach((text, i) => {
      const [x, y] = autoSlot(base + i);
      fresh.items.push({ id: `p${++fresh.seq}`, kind: 'postit', x, y, text, color: 'amarelo' });
    });
    delete st.flags['postits'];
  }
  (st as unknown as { cork: CorkState }).cork = fresh;
  return fresh;
}

/** cola um post-it do jogador (devolve o item, ou null se vazio ou com o quadro cheio) */
export function corkAddPostit(st: GameState, text: string, color: CorkColor, at?: [number, number]): CorkItem | null {
  const c = corkOf(st);
  const t = text.trim().slice(0, CORK_TEXT_MAX);
  if (!t) return null;
  if (c.items.filter((i) => i.kind === 'postit').length >= CORK_MAX_POSTITS) return null;
  const id = `p${++c.seq}`;
  const [x, y] = at ?? [0.35 + ((c.seq * 0.137) % 0.3), 0.5 + ((c.seq * 0.071) % 0.25)];
  const it: CorkItem = { id, kind: 'postit', x: clamp01(x), y: clamp01(y), text: t, color: CORK_COLORS.includes(color) ? color : 'amarelo' };
  c.items.push(it);
  return it;
}

/** cola um adesivo do Ozzy */
export function corkAddSticker(st: GameState, sticker: string, at?: [number, number]): CorkItem | null {
  const c = corkOf(st);
  if (!(CORK_STICKERS as readonly string[]).includes(sticker)) return null;
  if (c.items.filter((i) => i.kind === 'adesivo').length >= CORK_MAX_STICKERS) return null;
  const id = `a${++c.seq}`;
  const [x, y] = at ?? [0.45 + ((c.seq * 0.113) % 0.3), 0.1 + ((c.seq * 0.093) % 0.6)];
  const it: CorkItem = { id, kind: 'adesivo', x: clamp01(x), y: clamp01(y), sticker };
  c.items.push(it);
  return it;
}

/** move um papel/adesivo do jogador (vai para a frente) ou uma ficha/documento da central (`b:ID`/`d:ID`) */
export function corkMove(st: GameState, id: string, x: number, y: number): boolean {
  const c = corkOf(st);
  const i = c.items.findIndex((it) => it.id === id);
  if (i >= 0) {
    const [it] = c.items.splice(i, 1);
    it.x = clamp01(x);
    it.y = clamp01(y);
    c.items.push(it);
    return true;
  }
  if (/^[bd]:/.test(id) && id.length <= 80) {
    c.pos[id] = [clamp01(x), clamp01(y)];
    return true;
  }
  return false;
}

/** tira do quadro um post-it ou adesivo do jogador (fichas da central e documentos não saem) */
export function corkRemove(st: GameState, id: string): boolean {
  const c = corkOf(st);
  const n = c.items.length;
  c.items = c.items.filter((it) => it.id !== id);
  return c.items.length !== n;
}
