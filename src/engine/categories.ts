// Categorias das perguntas e dos chamados (1.1): Clínico (azul), GO (rosa), Trauma (verde),
// Outros (branco). Servem às caixas de perguntas da mesa e à cor do post-it da Simone.
//
// O conteúdo pode marcar à mão (`CallDef.cat`, `ExtraQ.cat`); sem marca, a heurística abaixo
// decide pelo texto (diagnóstico, etiquetas do banco, rótulo da pergunta).
import { BOXES, type BoxId, type CallDef, type ExtraQ, type TruthDef } from './types';
import { hashString } from './util';

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
// só palavras fortes de trauma (pergunta de clínica com "cabeça" ou "sangue" fica na caixa do chamado)
const EXTRA_TRAUMA = /queda|caiu|bateu a cabeca|altura|capacete|fratur|\bosso\b|arma\b|faca|tiro|atropel|cinto|mexe as pernas|coluna|torniquete|deformid|queimad|mordeu/;

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

// a Simone não sabe classificar: linha aberta, ninguém fala, ela mesma diz que não entendeu
const UNSURE_RE = /linha (aberta|muda)|ningu[eé]m (fala|responde)|nao (sei|entendi|deu pra entender)|nao consegui entender|sem saber o que/;

/**
 * Cor do post-it que a Simone escreveria com a nota CERTA: a caixa do chamado; branco (Outros)
 * quando o chamado é dos "folgados" (`cat: 'outros'`), quando é linha aberta/acidental ou quando a
 * própria nota diz que ela não entendeu.
 */
export function simoneBox(def: CallDef, t: TruthDef | undefined, note?: string): BoxId {
  const box = callBox(def, t);
  if (box === 'outros') return 'outros';
  if (t?.prankKind === 'acidental') return 'outros';
  if (note && UNSURE_RE.test(norm(note))) return 'outros';
  return box;
}

/**
 * Cor do post-it de verdade: com a nota certa, a cor certa; com a nota errada, a cor erra em ~2/3
 * das vezes (outra caixa ou branco). Sem sorteio do jogo (hash da ligação): não muda a sequência
 * aleatória da partida nem a simulação dos bots.
 */
export function noteBoxFor(callId: string, right: BoxId, noteRight: boolean): BoxId {
  if (noteRight) return right;
  // >>> 0: hashString tem sinal (resto negativo cairia sempre em "cor certa")
  const h = hashString(callId + ':postit') >>> 0;
  if (h % 100 < 35) return right;
  const others = BOXES.filter((b) => b !== right);
  return others[Math.floor(h / 100) % others.length];
}
