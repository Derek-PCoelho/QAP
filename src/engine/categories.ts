// Categorias das perguntas e dos chamados (1.1): Clínico (azul), GO (rosa), Trauma (verde),
// Outros (branco). Servem às caixas de perguntas da mesa e, na Onda 2, à cor do post-it da Simone.
//
// O conteúdo pode marcar à mão (`CallDef.cat`, `ExtraQ.cat`); sem marca, a heurística abaixo
// decide pelo texto (diagnóstico, etiquetas do banco, rótulo da pergunta).
import type { BoxId, CallDef, ExtraQ, TruthDef } from './types';

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

const GO_RE = /gestac|gestant|gravid|parto|eclamp|obstet|aborto|placent|puerper|semanas de|trabalho de parto|bolsa (rota|estour)|pre-?natal|sangramento vaginal|hemorragia pos-parto|contrac/;
const TRAUMA_RE =
  /trauma|queda|caiu|fratur|atropel|\bmoto\b|motociclista|colisao|acidente|ferimento|facada|faca|esfaque|\btiro\b|arma de fogo|baleado|corte|queimadur|amputa|andaime|laje|capotamento|ciclista|bicicleta|agress|espancad|luxac|entorse|tce\b|traumatismo|soterr|prensad|esmag|mordedura|choque eletrico|eletrocu/;

/** Caixa do chamado: a marcada no conteúdo, senão GO/Trauma pelo diagnóstico e etiquetas, senão Clínico. */
export function callBox(def: CallDef, t?: TruthDef): BoxId {
  if (def.cat) return def.cat;
  const text = norm(`${t?.dx ?? ''} ${def.pool ?? ''}`);
  if (/obstetricia/.test(text) || GO_RE.test(text)) return 'go';
  if (/trauma/.test(text) || TRAUMA_RE.test(text)) return 'trauma';
  return 'clinico';
}

const EXTRA_GO = /gravid|gestac|contrac|bolsa|bebe (mexe|esta mexendo)|mexe\b.*bebe|semanas|parto|menstru|pre-?natal|placenta|cordao|nasceu/;
const EXTRA_TRAUMA = /queda|caiu|bateu|altura|capacete|fratur|osso|corte|sangr|ferid|arma|faca|tiro|atropel|cinto|\bcarro\b|\bmoto\b|pernas?\b.*mex|mexe as pernas|coluna|torniquete|apert|pano|pressao no|hemorrag|machuc|cabeca|pescoco|deformid|torto|queimad|mordeu|choque/;

/**
 * Caixa de uma pergunta específica: `cat` do conteúdo; confronto e "acalmar" não vão para caixa
 * (`undefined` = sempre à vista); senão, palavras do rótulo; senão, a caixa do chamado.
 */
export function extraBox(x: ExtraQ, callCat: BoxId): BoxId | undefined {
  if (x.cat) return x.cat;
  if (x.kind === 'confronto' || x.kind === 'acalmar' || x.id === 'acalmar') return undefined;
  const label = norm(typeof x.label === 'string' ? x.label : '');
  if (EXTRA_GO.test(label)) return 'go';
  if (EXTRA_TRAUMA.test(label) && callCat !== 'go') return 'trauma';
  return callCat;
}
