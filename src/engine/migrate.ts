// Migração de saves antigos para a versão atual (SAVE_VERSION em state.ts).
//
// Regra: um save de uma versão anterior conhecida é convertido aqui ANTES do checkSave;
// um save de versão futura (ou anterior à 3) continua recusado com "incompatível".
//
// v3 (1.0.x) → v4 (1.1):
//   - o protagonista passou a se chamar Camille (ex-Amber) / Thiago (ex-Luan) e pode ser
//     renomeado: textos já "assados" no save (diário, relatórios, registro da noite, quadro,
//     finais) trocam o nome antigo pelo atual;
//   - o Modo Inconsistência saiu; a casa ganhou o "reparar". `home.found/tried/inspected`
//     continuam existindo (são reaproveitados), mas um save sem eles não pode quebrar;
//   - a mesma conversão vale para o mundo-sombra da campanha da Simone.
import type { GameState } from './types';
import { cleanName, PROTAGONIST_FIRST, replaceOldNames } from './text';

/** versões que sabemos converter */
export const OLDEST_MIGRATABLE = 3;

type Obj = Record<string, unknown>;
const isObj = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x);

function fixText(o: Obj, k: string, f: (s: string) => string): void {
  if (typeof o[k] === 'string') o[k] = f(o[k] as string);
}

function migrateV3toV4(st: Obj): void {
  const g = st.gender === 'M' ? 'M' : 'F';
  const name = cleanName(st.name as string | undefined) ?? PROTAGONIST_FIRST[g];
  if (st.name !== undefined && !cleanName(st.name as string)) delete st.name;
  const f = (s: string) => replaceOldNames(s, g, name);
  if (Array.isArray(st.diary)) {
    for (const d of st.diary) {
      if (!isObj(d)) continue;
      fixText(d, 'text', f);
      fixText(d, 'name', f);
      if (Array.isArray(d.updates)) for (const u of d.updates) if (isObj(u)) fixText(u, 'text', f);
    }
  }
  if (Array.isArray(st.history)) {
    for (const h of st.history) {
      if (!isObj(h) || !Array.isArray(h.report)) continue;
      for (const r of h.report) if (isObj(r)) fixText(r, 'text', f);
    }
  }
  if (Array.isArray(st.board)) for (const b of st.board) if (isObj(b)) (fixText(b, 'text', f), fixText(b, 'title', f));
  if (isObj(st.flags)) for (const k of Object.keys(st.flags)) fixText(st.flags, k, f);
  if (isObj(st.ending)) {
    const e = st.ending;
    if (Array.isArray(e.lines)) e.lines = e.lines.map((x) => (typeof x === 'string' ? f(x) : x));
    if (Array.isArray(e.threads)) for (const t of e.threads) if (isObj(t)) fixText(t, 'text', f);
  }
  if (isObj(st.gameOver)) fixText(st.gameOver, 'text', f);
  if (isObj(st.home)) {
    const h = st.home;
    if (Array.isArray(h.log)) h.log = h.log.map((x) => (typeof x === 'string' ? f(x) : x));
    if (!Array.isArray(h.found)) h.found = [];
    if (!Array.isArray(h.tried)) h.tried = [];
    if (typeof h.inspected !== 'boolean') h.inspected = false;
    if (typeof h.sceneDone !== 'boolean') h.sceneDone = false;
  }
  if (isObj(st.shadow)) migrateV3toV4(st.shadow);
}

/**
 * Converte um estado lido de um save para a versão atual. Lança "incompatível" quando a
 * versão é desconhecida. Muda o objeto recebido e o devolve.
 */
export function migrate(st: GameState, current: number): GameState {
  const o = st as unknown as Obj;
  const v = o.v;
  if (typeof v !== 'number' || !Number.isInteger(v) || v < OLDEST_MIGRATABLE || v > current) {
    throw new Error('Save incompatível com esta versão.');
  }
  if (v < 4) migrateV3toV4(o);
  o.v = current;
  if (isObj(o.shadow)) o.shadow.v = current;
  return st;
}
