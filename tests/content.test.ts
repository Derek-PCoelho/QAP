// Validação estática e dinâmica do conteúdo (dias, ligações, cenas, jornais).
import { describe, it, expect } from 'vitest';
import { CONTENT } from '../src/content/index';
import type { CallDef, Ctx, DayDef, LineIn, SceneDef, AnswerIn, GameState } from '../src/engine/types';
import { newGameState, makeCtx } from '../src/engine/state';
import { resolveAddress } from '../src/engine/city/map';
import { hm } from '../src/engine/util';
import { cluesIn } from '../src/engine/text';

const KNOWN_TOKENS = new Set(['dr', 'Dr', 'DR', 'tit', 'nome', 'NOME', 'filho', 'Filho', 'pai', 'Pai', 'o', 'O', 'ele', 'Ele', 'dele', 'um', 'sozinho', 'cansado', 'obrigado', 'querido', 'menino', 'meu', 'Meu', 'seu', 'Seu', 'regulador', 'medico', 'Medico', 'esposo', 'conj', 'CONJ', 'oconj', 'Oconj', 'doconj', 'proconj', 'bene', 'sobrenome', 'central', 'unit', 'dx', 'Dx', 'name', 'hora', 'dest']);
const SPEAKERS = new Set(['LUCIA', 'LÚCIA', 'DAVI', 'ZELIA', 'ZÉLIA', 'EU', 'NARRADOR', 'SIMONE', 'HENRIQUE', 'PEIXOTO', 'DR. PEIXOTO', 'BENE', 'BENÉ', 'CARLA', 'ARLINDO', 'ASSESSOR', 'CIDA', 'JAIRO', 'NOGUEIRA', 'JULIANA', 'ROSANGELA', 'ROSÂNGELA', 'ANTONIO', 'ANTÔNIO', 'BIEL', 'WESLEY', 'MARCIA', 'MÁRCIA', 'PAULA', 'DRA. PAULA', 'PLANTONISTA', 'MARCOS', 'TICO', 'JOANA', 'ODETE', 'OSVALDO', 'VIZINHA', 'PROFESSORA', 'DIRETORA', 'CASTRO', 'FERNANDA', 'TODOS', 'VOZ', 'RÁDIO', 'TELEFONE', 'DIRETOR', 'MÉDICO', 'ENFERMEIRA', 'LÚCIA E DAVI', 'IRMÃ', 'CRIANÇA', 'MOÇA']);

function ctxs(day: number): Ctx[] {
  const out: Ctx[] = [];
  const flagsSets: Record<string, boolean | number | string>[] = [
    {},
    { bombinha: true, maquina: true, cida_queda_regulada: true, henrique_coberto: true, marcia_viva: true, d9_davi: 'USB', geladeira_quebrada: true, denunciou_henrique: true, depoimento: 'aceitou', materia_publicada: true, pe_ferida: true, curativo: true, reforco_frota: true },
    { cida_queda_dispensada: true, marcia_morreu: true, d9_davi: 'USA', envelope_aceito: true, encobriu_henrique: true, lucia_fora: true, zelia_caiu_d10: true, geladeira_quebrada: true, geladeira_ok: true, brigou_nogueira: true },
  ];
  for (const f of flagsSets) {
    for (const g of ['M', 'F'] as const) {
      const st: GameState = newGameState({ gender: g, difficulty: 'padrao', seed: 7 });
      st.day = day;
      st.flags = { ...f };
      st.keys = f.marcia_morreu ? { rosangela: 'perdido', antonio: 'perdido' } : { rosangela: 'salvo', antonio: 'salvo' };
      out.push(makeCtx(st));
    }
  }
  return out;
}

function linesOf(a: AnswerIn | undefined, c: Ctx): LineIn[] {
  if (a === undefined) return [];
  const v = typeof a === 'function' ? a(c) : a;
  return Array.isArray(v) ? v : [v];
}
function textOf(l: LineIn, c: Ctx): string {
  if (typeof l === 'string') return l;
  if (l.when && !l.when(c)) return '';
  return typeof l.t === 'function' ? l.t(c) : l.t;
}
function tokensIn(s: string): string[] {
  const out: string[] = [];
  const re = /\{([^{}|]+)(?:\|[^{}]*)?\}/g;
  // ignora {{...}}
  const clean = s.replace(/\{\{[^}]*\}\}/g, (m) => m.slice(2, -2).split('|')[0]);
  let m: RegExpExecArray | null;
  while ((m = re.exec(clean))) {
    const tok = m[1];
    if (tok.startsWith('m:') || tok.startsWith('c:')) continue;
    out.push(tok);
  }
  return out;
}

const manualRuleIds = new Map<string, number>();
for (const p of CONTENT.manual) for (const r of p.rules) manualRuleIds.set(r.id, p.day);
const docClues = new Set<string>();
for (const d of Object.values(CONTENT.docs)) for (const c of d.clues ?? []) docClues.add(c.id);
const allCallIds = new Map<string, number>();
for (const d of Object.values(CONTENT.days)) for (const c of d.calls) allCallIds.set(c.id, d.day);

function checkCall(d: DayDef, call: CallDef, errs: string[], warns: string[]) {
  const where = `D${d.day} ${call.id}`;
  const unionClues = new Set<string>(['num', 'end', 'mapa', 'retorno_ok', 'retorno_caixa', 'retorno_inexistente']);
  let extraIdsU = new Set<string>();
  try {
    hm(call.at);
  } catch {
    errs.push(`${where}: horário inválido ${call.at}`);
  }
  const t0 = hm(call.at);
  if (t0 < hm('06:00') || t0 > hm('18:59')) errs.push(`${where}: horário fora do plantão ${call.at}`);
  for (const c of ctxs(d.day)) {
    if (call.when && !call.when(c)) continue;
    const truth = typeof call.truth === 'function' ? call.truth(c) : call.truth;
    if (!truth.ok?.length) errs.push(`${where}: truth.ok vazio`);
    if (truth.sev === 'trote' && !truth.ok.includes('TROTE')) errs.push(`${where}: trote sem TROTE em ok`);
    if (truth.sev !== 'trote' && truth.ok.includes('TROTE')) errs.push(`${where}: caso real com TROTE em ok`);
    if (truth.dest && d.day < 9) warns.push(`${where}: dest definido antes do dia 9 (ignorado)`);
    if (d.day >= 9 && truth.sev !== 'trote' && (truth.ok.includes('USA') || truth.ok.includes('USB')) && !truth.dest?.length) warns.push(`${where}: dia ≥ 9 com despacho possível sem truth.dest`);
    if (truth.risk && truth.risk.good >= truth.risk.bad) errs.push(`${where}: risk.good >= risk.bad`);
    // endereço
    const ar = resolveAddress(call.addr);
    if (truth.sev !== 'trote' && ar.kind !== 'ok' && ar.kind !== 'marco') {
      const allowed = (call.links ?? []).some((l) => l.a === 'mapa' || l.b === 'mapa' || l.a === 'end' || l.b === 'end');
      if (!allowed) errs.push(`${where}: endereço inválido em caso real: ${ar.message}`);
    }
    // pistas presentes
    const clues = new Set<string>(['num', 'end', 'mapa', 'retorno_ok', 'retorno_caixa', 'retorno_inexistente']);
    const texts: string[] = [];
    const add = (a: AnswerIn | undefined) => {
      for (const l of linesOf(a, c)) {
        const tx = textOf(l, c);
        texts.push(tx);
        for (const cl of cluesIn(tx)) clues.add(cl.id);
      }
    };
    add(call.open as AnswerIn);
    for (const v of Object.values(call.q ?? {})) add(v as AnswerIn);
    for (const x of call.extra ?? []) add(x.a);
    add(call.callback);
    for (const w of call.worsen ?? []) add(w.lines);
    // perguntas base válidas
    for (const k of Object.keys(call.q ?? {})) {
      const q = CONTENT.questions.find((x) => x.id === k);
      if (!q && k !== 'confronto_quadro' && k !== 'confronto_endereco') errs.push(`${where}: resposta para pergunta inexistente "${k}"`);
      else if (q?.day && q.day > d.day) warns.push(`${where}: resposta para "${k}" que só existe a partir do dia ${q.day}`);
    }
    const extraIds = new Set((call.extra ?? []).map((x) => x.id));
    if (extraIds.size !== (call.extra ?? []).length) errs.push(`${where}: ids de extra duplicados`);
    for (const x of call.extra ?? []) {
      if (CONTENT.questions.some((q) => q.id === x.id)) errs.push(`${where}: extra "${x.id}" colide com pergunta base`);
      for (const u of x.unlocks ?? []) if (!extraIds.has(u)) errs.push(`${where}: unlocks "${u}" inexistente`);
      // 1.1: sem Modo Inconsistência, toda pergunta trancada precisa de um gatilho jogável
      for (const k of x.unlockedBy ?? []) {
        const okK =
          k === 'callback' || k === 'video' || k === 'quadro' || k === 'endereco' || /^(video|doc|lido|flag|sflag):./.test(k) || extraIds.has(k) || CONTENT.questions.some((q) => q.id === k);
        if (!okK) errs.push(`${where}: unlockedBy "${k}" de "${x.id}" não é gatilho conhecido`);
        if (k.startsWith('doc:') && !CONTENT.docs[k.slice(4)]) errs.push(`${where}: unlockedBy "${k}": documento inexistente`);
      }
    }
    for (const m of truth.must ?? []) {
      const q = CONTENT.questions.find((x) => x.id === m);
      if (!q && !extraIds.has(m)) errs.push(`${where}: must "${m}" não existe`);
      if (q?.day && q.day > d.day) errs.push(`${where}: must "${m}" indisponível no dia ${d.day}`);
    }
    for (const x of clues) unionClues.add(x);
    extraIdsU = extraIds;
  }
  {
    const clues = unionClues;
    const extraIds = extraIdsU;
    for (const l of call.links ?? []) {
      for (const id of [l.a, l.b]) {
        if (clues.has(id)) continue;
        if (id.startsWith('manual:')) {
          const rd = manualRuleIds.get(id.slice(7));
          if (rd === undefined) errs.push(`${where}: regra de manual inexistente ${id}`);
          else if (rd > d.day) errs.push(`${where}: ${id} só existe a partir do dia ${rd}`);
          continue;
        }
        if (id.startsWith('doc:')) {
          if (!docClues.has(id)) errs.push(`${where}: pista de documento inexistente ${id}`);
          continue;
        }
        if (id.startsWith('quadro:')) continue;
        if (id.startsWith('diario:')) {
          const cd = allCallIds.get(id.slice(7));
          if (cd === undefined || cd > d.day) errs.push(`${where}: ${id} não existe antes do dia ${d.day}`);
          continue;
        }
        errs.push(`${where}: pista "${id}" não aparece em nenhuma fala da ligação`);
      }
      const un = l.unlock ? (Array.isArray(l.unlock) ? l.unlock : [l.unlock]) : [];
      for (const u of un) if (!extraIds.has(u) && u !== 'confronto_quadro' && u !== 'confronto_endereco') errs.push(`${where}: unlock "${u}" não é extra da ligação`);
    }
  }
  for (const c of ctxs(d.day)) {
    if (call.when && !call.when(c)) continue;
    const truth = typeof call.truth === 'function' ? call.truth(c) : call.truth;
    const texts: string[] = [];
    const add = (a: AnswerIn | undefined) => {
      for (const l of linesOf(a, c)) texts.push(textOf(l, c));
    };
    add(call.open as AnswerIn);
    for (const v of Object.values(call.q ?? {})) add(v as AnswerIn);
    for (const x of call.extra ?? []) add(x.a);
    add(call.callback);
    for (const w of call.worsen ?? []) add(w.lines);
    for (const x of call.extra ?? []) {
      if (x.locked) {
        // 1.1: os vínculos (links) não destravam mais nada
        const unlockedBy = !!x.unlockedBy?.length || (call.extra ?? []).some((y) => y.unlocks?.includes(x.id));
        if (!unlockedBy) errs.push(`${where}: extra trancada "${x.id}" nunca é desbloqueada`);
      }
    }
    if (call.guide) {
      const gid = typeof call.guide.id === 'function' ? call.guide.id(c) : call.guide.id;
      if (!CONTENT.guides[gid]) errs.push(`${where}: guia inexistente ${gid}`);
    }
    for (const w of call.worsen ?? []) if (w.guide && !CONTENT.guides[w.guide]) errs.push(`${where}: guia inexistente ${w.guide}`);
    // tokens
    for (const tx of texts) for (const tok of tokensIn(tx)) if (!KNOWN_TOKENS.has(tok)) errs.push(`${where}: token desconhecido {${tok}} em "${tx.slice(0, 60)}"`);
    // nota/rádio
    if (typeof call.note === 'function') call.note(c);
    for (const v of Object.values(call.radio ?? {})) if (typeof v === 'function') v(c);
  }
}

function checkScene(where: string, sc: SceneDef, errs: string[]) {
  if (!sc.nodes.start) errs.push(`${where}: cena ${sc.id} sem nó start`);
  for (const [k, n] of Object.entries(sc.nodes)) {
    if (n.next && !sc.nodes[n.next]) errs.push(`${where}: ${sc.id}.${k} next "${n.next}" inexistente`);
    for (const ch of n.choices ?? []) if (ch.next && !sc.nodes[ch.next]) errs.push(`${where}: ${sc.id}.${k} escolha → "${ch.next}" inexistente`);
    for (const l of n.lines) {
      if (!SPEAKERS.has(l.who)) errs.push(`${where}: ${sc.id}.${k} falante desconhecido "${l.who}"`);
    }
    for (const ch of n.choices ?? []) {
      if (ch.needLink) {
        // "reparar" (1.1): algum objeto marcado da cena precisa destravar a escolha
        const objs = new Set((sc.inspect?.objects ?? []).map((o) => o.id));
        const asList = (u: string | string[] | undefined) => (u === undefined ? [] : Array.isArray(u) ? u : [u]);
        const byObj = (sc.inspect?.objects ?? []).some((o) => asList(o.unlock).includes(ch.needLink!));
        const byLink = (sc.inspect?.links ?? []).some(
          (l) => (objs.has(l.a) || objs.has(l.b)) && ([l.a, l.b].sort().join('×') === ch.needLink || asList(l.unlock).includes(ch.needLink!)),
        );
        if (!byObj && !byLink) errs.push(`${where}: ${sc.id}.${k} needLink "${ch.needLink}" sem objeto para reparar que o destrave`);
      }
    }
  }
}

describe('conteúdo', () => {
  it('todos os 20 dias existem', () => {
    for (let d = 1; d <= 20; d++) expect(CONTENT.days[d], `dia ${d}`).toBeTruthy();
  });

  it('ligações, cenas e jornais são válidos', () => {
    const errs: string[] = [];
    const warns: string[] = [];
    const ids = new Set<string>();
    for (const d of Object.values(CONTENT.days)) {
      for (const call of d.calls) {
        if (ids.has(call.id)) errs.push(`id duplicado ${call.id}`);
        ids.add(call.id);
        checkCall(d, call, errs, warns);
      }
      for (const c of ctxs(d.day)) {
        try {
          const n = d.newspaper(c);
          if (!n.headline) errs.push(`D${d.day}: jornal sem manchete`);
          const ho = d.handover?.(c);
          if (ho) checkScene(`D${d.day} passagem`, ho, errs);
          const es = d.endScene?.(c);
          if (es) checkScene(`D${d.day} fim`, es, errs);
          const it = d.interlude;
          if (it) {
            for (const s of [it.scene, it.bico, it.pre]) {
              if (!s) continue;
              const sc = typeof s === 'function' ? s(c) : s;
              checkScene(`D${d.day} casa`, sc, errs);
            }
            if (typeof it.teaser === 'function') it.teaser(c);
          }
          d.reportField?.(c);
        } catch (e) {
          errs.push(`D${d.day}: exceção ao avaliar conteúdo: ${(e as Error).message}`);
        }
      }
      for (const tl of d.timeline ?? []) {
        try {
          hm(tl.at);
        } catch {
          errs.push(`D${d.day}: timeline com horário inválido ${tl.at}`);
        }
      }
      for (const pid of d.manual ?? []) if (!CONTENT.manual.some((p) => p.id === pid)) errs.push(`D${d.day}: página de manual ${pid} inexistente`);
    }
    if (warns.length) console.log('AVISOS:\n' + warns.join('\n'));
    if (errs.length) console.log('ERROS:\n' + errs.join('\n'));
    expect(errs).toEqual([]);
  });
});
