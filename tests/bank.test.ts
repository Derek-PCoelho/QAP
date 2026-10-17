// Validação do banco de ligações variáveis ("mesma abertura, verdades diferentes").
// 1) Estática + construção: todo modelo × verdade × dia × semente monta uma ligação válida.
// 2) Motor: cada variante é atendida, interrogada, conectada e carimbada num plantão real.
// 3) Simulação: bots jogam campanhas com "ligações variáveis" (dias sintéticos e reais).
import { describe, it, expect } from 'vitest';
import { CONTENT } from '../src/content/index';
import { BANK } from '../src/content/bank/index';
import { buildGeneratedCall } from '../src/engine/generator';
import { resolveAddress } from '../src/engine/city/map';
import { cluesIn } from '../src/engine/text';
import { newGameState, makeCtx } from '../src/engine/state';
import { ShiftSim } from '../src/engine/shift';
import { colorFor } from '../src/engine/grading';
import { playBot, PROFILES } from '../src/engine/bot';
import { Game } from '../src/engine/game';
import { hm, fmtTime } from '../src/engine/util';
import type { CallDef, GenParams, AnswerIn, LineIn, Ctx, DayDef, TruthDef, Resource } from '../src/engine/types';
import type { Content, TemplateDef } from '../src/engine/content-api';

const KNOWN_TOKENS = new Set(['dr', 'Dr', 'DR', 'tit', 'nome', 'NOME', 'filho', 'Filho', 'pai', 'Pai', 'o', 'O', 'ele', 'Ele', 'dele', 'um', 'sozinho', 'cansado', 'obrigado', 'querido', 'menino', 'meu', 'Meu', 'seu', 'Seu', 'regulador', 'medico', 'Medico', 'esposo', 'conj', 'CONJ', 'oconj', 'Oconj', 'doconj', 'proconj', 'bene', 'sobrenome', 'central', 'unit', 'dx', 'Dx', 'name', 'hora', 'dest']);
const POOL_TAGS = ['leve', 'moderado', 'grave', 'trote', 'pediatria', 'respiratorio', 'cardio', 'trauma_moderado', 'trauma', 'obstetricia', 'dengue', 'psiq', 'intox', 'neuro', 'idoso'];
/** dia em que cada etiqueta precisa ter pelo menos um modelo disponível */
const TAG_FROM: Record<string, number> = { obstetricia: 7, dengue: 11, psiq: 12, intox: 13 };
const DAYS = [1, 6, 9, 12, 15, 20];
const SEEDS = [1, 7, 42, 1234, 99991, 31337];

const manualRuleDay = new Map<string, number>();
for (const p of CONTENT.manual) for (const r of p.rules) manualRuleDay.set(r.id, p.day);
const baseQ = new Map(CONTENT.questions.map((q) => [q.id, q.day ?? 1]));

const ctx: Ctx = makeCtx(newGameState({ gender: 'M', difficulty: 'padrao', seed: 3 }));

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
  const clean = s.replace(/\{\{[^}]*\}\}/g, (m) => m.slice(2, -2).split('|')[0]);
  let m: RegExpExecArray | null;
  while ((m = re.exec(clean))) {
    const tok = m[1];
    if (tok.startsWith('m:') || tok.startsWith('c:')) continue;
    out.push(tok);
  }
  return out;
}
const minDayOf = (t: TemplateDef, tr: { minDay?: number }) => Math.max(t.minDay ?? 1, tr.minDay ?? 1);

function newGen(template: string, truth: string, seed: number): GenParams {
  return { template, truth, seed, name: '', age: 0, sex: 'M', addr: { rua: '', n: 0, bairro: '' }, num: '', caller: '' };
}

/** todas as falas da ligação (abertura, respostas, perguntas específicas, retorno, piora) */
function allLines(def: CallDef): string[] {
  const out: string[] = [];
  const add = (a: AnswerIn | undefined) => {
    for (const l of linesOf(a, ctx)) out.push(textOf(l, ctx));
  };
  add(def.open as AnswerIn);
  for (const v of Object.values(def.q ?? {})) add(v as AnswerIn);
  for (const x of def.extra ?? []) add(x.a);
  add(def.callback);
  for (const w of def.worsen ?? []) add(w.lines);
  return out;
}

function checkCall(where: string, def: CallDef, day: number, errs: string[]) {
  const truth: TruthDef = typeof def.truth === 'function' ? def.truth(ctx) : def.truth;
  // ---- verdade
  if (!truth.ok?.length) errs.push(`${where}: truth.ok vazio`);
  if (truth.sev === 'trote' && !truth.ok.includes('TROTE')) errs.push(`${where}: trote sem TROTE em ok`);
  if (truth.sev !== 'trote' && truth.ok.includes('TROTE')) errs.push(`${where}: caso real com TROTE em ok`);
  if (truth.sev === 'trote' && !truth.prankKind) errs.push(`${where}: trote sem prankKind`);
  if (truth.risk && truth.risk.good >= truth.risk.bad) errs.push(`${where}: risk.good >= risk.bad`);
  if (truth.sev === 'vermelho' && !truth.risk) errs.push(`${where}: vermelho sem janela de risco`);
  if (truth.sev !== 'trote' && (truth.ok.includes('USA') || truth.ok.includes('USB')) && !truth.dest?.length) errs.push(`${where}: despacho possível sem truth.dest`);
  if (truth.best && !truth.ok.includes(truth.best)) errs.push(`${where}: best fora de ok`);
  if (truth.ok.includes('ORI') && truth.sev !== 'trote' && !truth.ref?.length) errs.push(`${where}: orientação sem ref`);
  // ---- endereço
  const ar = resolveAddress(def.addr);
  if (truth.sev !== 'trote' && ar.kind !== 'ok' && ar.kind !== 'marco') errs.push(`${where}: endereço inválido em caso real: ${ar.message}`);
  // ---- qualidade mínima
  const qn = Object.keys(def.q ?? {}).filter((k) => k !== 'referencia').length;
  if (qn < 5) errs.push(`${where}: só ${qn} respostas escritas`);
  if (typeof def.note !== 'string' || !def.note) errs.push(`${where}: sem nota da Simone`);
  if (typeof def.noteWrong !== 'string' || !def.noteWrong) errs.push(`${where}: sem nota errada`);
  if (def.noteWrong === def.note) errs.push(`${where}: nota errada igual à certa`);
  if (!def.voice) errs.push(`${where}: sem voz`);
  if (!def.amb?.length) errs.push(`${where}: sem ambiente`);
  if (!def.caller) errs.push(`${where}: sem quem liga`);
  if (truth.sev === 'trote' && def.callback === undefined) errs.push(`${where}: trote sem retorno de ligação`);
  // ---- perguntas
  for (const k of Object.keys(def.q ?? {})) {
    if (!baseQ.has(k) && k !== 'confronto_quadro' && k !== 'confronto_endereco') errs.push(`${where}: resposta para pergunta inexistente "${k}"`);
  }
  const extras = def.extra ?? [];
  const extraIds = new Set(extras.map((x) => x.id));
  if (extraIds.size !== extras.length) errs.push(`${where}: ids de extra duplicados`);
  for (const x of extras) {
    if (baseQ.has(x.id) || x.id === 'acalmar') errs.push(`${where}: extra "${x.id}" colide com pergunta base`);
    for (const u of x.unlocks ?? []) if (!extraIds.has(u)) errs.push(`${where}: unlocks "${u}" inexistente`);
    if (x.locked) {
      const by = !!x.unlockedBy?.length || extras.some((y) => y.unlocks?.includes(x.id));
      if (!by) errs.push(`${where}: extra trancada "${x.id}" nunca é desbloqueada`);
    }
  }
  for (const m of truth.must ?? []) {
    const d = baseQ.get(m);
    if (d !== undefined) {
      if (d > day) errs.push(`${where}: must "${m}" indisponível no dia ${day}`);
    } else if (!extraIds.has(m)) errs.push(`${where}: must "${m}" não existe`);
    else if (extras.find((x) => x.id === m)?.locked) errs.push(`${where}: must "${m}" é pergunta trancada`);
  }
  // ---- pistas e inconsistências
  const lines = allLines(def);
  const clues = new Set<string>(['num', 'end', 'mapa']);
  for (const tx of lines) for (const cl of cluesIn(tx)) clues.add(cl.id);
  for (const l of def.links ?? []) {
    for (const id of [l.a, l.b]) {
      if (clues.has(id)) continue;
      if (id.startsWith('manual:')) {
        const rd = manualRuleDay.get(id.slice(7));
        if (rd === undefined) errs.push(`${where}: regra de manual inexistente ${id}`);
        else if (rd > day) errs.push(`${where}: ${id} só existe a partir do dia ${rd}`);
        continue;
      }
      errs.push(`${where}: pista "${id}" não aparece em nenhuma fala da ligação`);
    }
    const un = l.unlock ? (Array.isArray(l.unlock) ? l.unlock : [l.unlock]) : [];
    for (const u of un) if (!extraIds.has(u) && u !== 'confronto_quadro' && u !== 'confronto_endereco') errs.push(`${where}: unlock "${u}" não é extra da ligação`);
  }
  // ---- roteiros de orientação
  if (def.guide) {
    const gid = typeof def.guide.id === 'function' ? def.guide.id(ctx) : def.guide.id;
    if (!CONTENT.guides[gid]) errs.push(`${where}: guia inexistente ${gid}`);
  }
  for (const w of def.worsen ?? []) {
    if (w.guide && !CONTENT.guides[w.guide]) errs.push(`${where}: guia inexistente ${w.guide}`);
    // a piora é mesclada por cima da verdade original: best/must/ref antigos não podem sobrar
    const wt = typeof w.truth === 'function' ? w.truth(ctx) : w.truth;
    if (wt?.ok) {
      const merged = { ...truth, ...wt };
      if (merged.best && !merged.ok.includes(merged.best)) errs.push(`${where}: piora troca ok mas mantém best "${merged.best}"`);
      if ((merged.ok.includes('USA') || merged.ok.includes('USB')) && !merged.dest?.length) errs.push(`${where}: piora com despacho sem dest`);
      if (merged.sev === 'vermelho' && !merged.risk) errs.push(`${where}: piora para vermelho sem risk`);
      if (truth.must?.length && wt.must === undefined && !truth.ok.every((r) => merged.ok.includes(r))) errs.push(`${where}: piora troca ok mas herda must da verdade original`);
      if (wt.sev === 'vermelho' && truth.sev !== 'vermelho' && !w.resetRisk) errs.push(`${where}: piora que vira vermelho sem resetRisk (a janela contaria desde a chegada)`);
    }
  }
  // ---- tokens
  const texts = [...lines];
  for (const x of extras) texts.push(typeof x.say === 'function' ? x.say(ctx) : x.say ?? '', x.label);
  for (const t of [def.note, def.noteWrong]) if (t) texts.push(typeof t === 'function' ? t(ctx) : t);
  for (const v of Object.values(def.radio ?? {})) if (v) texts.push(typeof v === 'function' ? v(ctx) : v);
  for (const v of [def.diary?.alive, def.diary?.dead, def.diary?.ori]) if (v) texts.push(typeof v === 'function' ? v(ctx) : v);
  for (const l of def.links ?? []) texts.push(typeof l.insight === 'function' ? l.insight(ctx) : l.insight);
  for (const tx of texts) {
    for (const tok of tokensIn(tx)) if (!KNOWN_TOKENS.has(tok)) errs.push(`${where}: token desconhecido {${tok}} em "${tx.slice(0, 70)}"`);
    if (/undefined|NaN|\[object/.test(tx)) errs.push(`${where}: texto quebrado "${tx.slice(0, 70)}"`);
  }
}

describe('banco de ligações variáveis', () => {
  it('tamanho, etiquetas e pesos', () => {
    const errs: string[] = [];
    const ids = new Set<string>();
    let variants = 0;
    for (const t of BANK) {
      if (ids.has(t.id)) errs.push(`modelo duplicado ${t.id}`);
      ids.add(t.id);
      if (t.truths.length < 3 || t.truths.length > 5) errs.push(`${t.id}: ${t.truths.length} verdades (esperado 3–5)`);
      const tids = new Set(t.truths.map((x) => x.id));
      if (tids.size !== t.truths.length) errs.push(`${t.id}: verdades com id duplicado`);
      for (const tag of t.tags) if (!POOL_TAGS.includes(tag)) errs.push(`${t.id}: etiqueta desconhecida ${tag}`);
      for (const tr of t.truths) if ((tr.weight ?? 1) <= 0) errs.push(`${t.id}.${tr.id}: peso inválido`);
      if (t.truths.filter((tr) => (tr.minDay ?? 1) <= (t.minDay ?? 1)).length === 0) errs.push(`${t.id}: nenhuma verdade disponível no minDay do modelo`);
      variants += t.truths.length;
    }
    for (const tag of POOL_TAGS) {
      const from = TAG_FROM[tag] ?? 1;
      const n = BANK.filter((t) => t.tags.includes(tag) && (t.minDay ?? 1) <= from).length;
      if (n === 0) errs.push(`etiqueta ${tag}: nenhum modelo disponível no dia ${from}`);
    }
    // etiquetas de gravidade precisam refletir o peso das verdades (dia 20, todas liberadas):
    // leve ⇒ verde/azul ≥ 35% · moderado ⇒ amarelo ≥ 25% · grave ⇒ vermelho ≥ 25% · trote ⇒ trote ≥ 40%
    for (const t of BANK) {
      const share: Record<string, number> = {};
      const W = t.truths.reduce((a, x) => a + (x.weight ?? 1), 0);
      for (const tr of t.truths) {
        const def = buildGeneratedCall(CONTENT, newGen(t.id, tr.id, 5), 'x', 20);
        const sev = (typeof def.truth === 'function' ? def.truth(ctx) : def.truth).sev;
        const k = sev === 'verde' || sev === 'azul' ? 'leve' : sev === 'amarelo' ? 'moderado' : sev === 'vermelho' ? 'grave' : 'trote';
        share[k] = (share[k] ?? 0) + (tr.weight ?? 1) / W;
      }
      const min: Record<string, number> = { leve: 0.35, moderado: 0.25, grave: 0.25, trote: 0.4 };
      for (const [tag, m] of Object.entries(min)) {
        if (t.tags.includes(tag) && (share[tag] ?? 0) < m) errs.push(`${t.id}: etiqueta "${tag}" com só ${Math.round((share[tag] ?? 0) * 100)}% de verdades desse tipo`);
      }
      // slot "leve" pode surpreender, mas não pode virar vermelho na maioria das vezes
      if (t.tags.includes('leve') && (share.grave ?? 0) >= 0.5) errs.push(`${t.id}: etiqueta "leve" com ${Math.round((share.grave ?? 0) * 100)}% de vermelhos`);
    }
    // resumo para o relatório
    const byTag = POOL_TAGS.map((tag) => {
      const ts = BANK.filter((t) => t.tags.includes(tag));
      return `${tag}: ${ts.length} modelos / ${ts.reduce((a, t) => a + t.truths.length, 0)} variantes`;
    });
    console.log(`BANCO: ${BANK.length} modelos, ${variants} variantes\n` + byTag.join('\n'));
    if (errs.length) console.log('ERROS:\n' + errs.join('\n'));
    expect(errs).toEqual([]);
    expect(BANK.length).toBeGreaterThanOrEqual(34);
    expect(variants).toBeGreaterThanOrEqual(120);
  });

  it('toda variante monta ligação válida em todos os dias e sementes', () => {
    const errs: string[] = [];
    let built = 0;
    for (const t of BANK) {
      for (const tr of t.truths) {
        const md = minDayOf(t, tr);
        const days = [...new Set([md, ...DAYS])].filter((d) => d >= md).sort((a, b) => a - b);
        for (const day of days) {
          for (const seed of SEEDS) {
            const where = `${t.id}.${tr.id} D${day} s${seed}`;
            const gen = newGen(t.id, tr.id, seed);
            try {
              const def = buildGeneratedCall(CONTENT, gen, `t~${t.id}.${tr.id}`, day);
              checkCall(where, def, day, errs);
              // determinismo: reconstruir com os mesmos parâmetros dá a mesma ligação
              const again = buildGeneratedCall(CONTENT, gen, `t~${t.id}.${tr.id}`, day);
              if (JSON.stringify(again) !== JSON.stringify(def)) errs.push(`${where}: reconstrução não é determinística`);
              built++;
            } catch (e) {
              errs.push(`${where}: EXCEÇÃO ${(e as Error).stack ?? e}`);
            }
          }
        }
      }
    }
    if (errs.length) console.log('ERROS:\n' + [...new Set(errs)].slice(0, 80).join('\n'));
    expect(errs).toEqual([]);
    expect(built).toBeGreaterThan(0);
  });

  it('a abertura falada é a mesma para todas as verdades do modelo', () => {
    const errs: string[] = [];
    for (const t of BANK) {
      for (const seed of SEEDS.slice(0, 3)) {
        const day = 20;
        const spoken = new Set<string>();
        for (const tr of t.truths) {
          const def = buildGeneratedCall(CONTENT, newGen(t.id, tr.id, seed), 'x', day);
          const open = linesOf(def.open as AnswerIn, ctx).map((l) => textOf(l, ctx));
          const first = open.find((l) => !(l.startsWith('[') && l.endsWith(']'))) ?? open[0];
          spoken.add(first.replace(/\d+/g, '#'));
        }
        if (spoken.size > 1) errs.push(`${t.id} s${seed}: aberturas diferentes:\n  ${[...spoken].join('\n  ')}`);
      }
    }
    if (errs.length) console.log(errs.join('\n'));
    expect(errs).toEqual([]);
  });
});

// -----------------------------------------------------------------------------
// Conteúdo sintético: dias só com "slots" de banco (independe dos arquivos de dia)
// -----------------------------------------------------------------------------
/** 8 "slots" por dia (como um dia real: 6–7 variáveis), etiquetas em rodízio */
function synthDay(day: number): DayDef {
  const pools = Array.from({ length: 8 }, (_, i) => POOL_TAGS[(day * 3 + i) % POOL_TAGS.length]);
  return {
    day,
    title: `Teste ${day}`,
    weekday: '—',
    newspaper: () => ({ headline: 'Teste', stories: [] }),
    calls: pools.map((pool, i) => ({
      id: `syn${day}_${i}`,
      at: fmtTime(hm('07:10') + i * 80),
      pool,
      num: `(17) 3322-${String(1000 + day * 20 + i)}`,
      caller: 'Teste',
      type: 'comum',
      note: 'Teste.',
      addr: { rua: 'Rua Bahia', n: 1200, bairro: 'Centro' },
      open: ['Alô, meu marido torceu o tornozelo.'],
      patient: { name: 'José Teste', age: 40, sex: 'M' },
      truth: { dx: 'Entorse de tornozelo', sev: 'verde', ok: ['ORI'], ref: ['UPA', 'UBS'] },
    })),
  };
}
const SYN_DAYS: Record<number, DayDef> = {};
for (let d = 1; d <= 20; d++) SYN_DAYS[d] = synthDay(d);
const SYN: Content = { ...CONTENT, days: SYN_DAYS };

function decisionFor(truth: TruthDef, day: number, wrong = false) {
  let resource: Resource = truth.best ?? truth.ok[0];
  if (wrong) resource = truth.sev === 'trote' ? 'USB' : resource === 'ORI' ? 'USB' : 'ORI';
  const color = truth.sev === 'trote' ? 'azul' : colorFor(truth.sev);
  const dispatch = resource === 'USA' || resource === 'USB';
  return {
    color,
    resource,
    support: wrong ? [] : [...(truth.sup ?? [])],
    dest: dispatch && day >= 9 ? truth.dest?.[0] ?? 'REG' : undefined,
    referral: resource === 'ORI' ? truth.ref?.[0] ?? 'UBS' : undefined,
  };
}

/** atende, pergunta tudo, conecta as inconsistências, carimba e roda o plantão até o fim */
function runVariant(t: TemplateDef, trId: string, day: number, seed: number, wrong: boolean): string[] {
  const errs: string[] = [];
  const where = `${t.id}.${trId} D${day} s${seed}${wrong ? ' (decisão errada)' : ''}`;
  const st = newGameState({ gender: seed % 2 ? 'M' : 'F', difficulty: 'padrao', seed });
  st.day = day;
  st.manual = CONTENT.manualUntil(day);
  st.variable = true;
  const sim = new ShiftSim(st, SYN);
  // tira as ligações sintéticas da frente
  for (const id of Object.keys(sim.sh.calls)) delete sim.sh.calls[id];
  sim.sh.pending = sim.sh.pending.filter((e) => e.kind !== 'arrival');
  const id = `x~${t.id}.${trId}`;
  sim.addCall(id, 'x', hm('07:05'), newGen(t.id, trId, seed));
  sim.advance(6);
  const call = sim.sh.calls[id];
  if (!call || call.status !== 'fila') return [`${where}: ligação não chegou na fila`];
  sim.answer(id);
  const def = sim.defOf(call);
  for (let round = 0; round < 3; round++) {
    for (const q of sim.questions(call)) if (!q.asked && sim.active()?.id === id) sim.ask(q.id);
  }
  if (sim.active()?.id !== id) {
    // desligou (ex.: trote com confronto) — tudo bem, mas não pode explodir
    return errs;
  }
  const truth = sim.truthOf(call);
  const d = decisionFor(truth, day, wrong);
  const r = sim.stamp(d);
  if (!r.ok) {
    errs.push(`${where}: carimbo falhou: ${r.error}`);
    return errs;
  }
  if (!wrong) {
    const v = call.verdict!;
    if (!['correto', 'defensavel', 'trote_ok'].includes(v.kind)) errs.push(`${where}: decisão "certa" avaliada como ${v.kind} (${v.text})`);
  }
  let guard = 0;
  while (!sim.sh.ended && guard++ < 400) {
    if (sim.sh.guideCallId) sim.finishGuide(0.8, true);
    for (const m of [...sim.sh.modals]) sim.ackModal(m.id, m.options?.[0]?.id);
    for (const q of [...sim.sh.requests]) sim.answerRequest(q.id, q.options[0].id);
    // retorno (dispensa) volta para a fila: atende e regula certo
    const back = sim.queue().find((c) => c.id === id);
    if (back && !sim.sh.guideCallId && !sim.active()) {
      sim.answer(id);
      if (!call.decision) sim.stamp(decisionFor(sim.truthOf(call), day, false));
    }
    sim.advance(10);
  }
  if (!sim.sh.ended) errs.push(`${where}: plantão não terminou`);
  return errs;
}

describe('banco no motor', () => {
  it('cada variante é atendida, interrogada, carimbada e resolvida sem erro', () => {
    const errs: string[] = [];
    for (const t of BANK) {
      for (const tr of t.truths) {
        const md = minDayOf(t, tr);
        for (const [day, seed] of [
          [md, 11],
          [Math.max(md, 12), 12],
        ] as [number, number][]) {
          for (const wrong of [false, true]) {
            try {
              errs.push(...runVariant(t, tr.id, day, seed, wrong));
            } catch (e) {
              errs.push(`${t.id}.${tr.id} D${day}${wrong ? ' errada' : ''}: EXCEÇÃO ${(e as Error).stack ?? e}`);
            }
          }
        }
      }
    }
    if (errs.length) console.log('ERROS:\n' + errs.slice(0, 60).join('\n'));
    expect(errs).toEqual([]);
  });

  it('dias sintéticos com ligações variáveis: o banco entra no plantão', () => {
    const g = Game.create(SYN, { gender: 'F', difficulty: 'padrao', seed: 5, variable: true });
    g.st.day = 14;
    g.newspaper();
    g.beginShift();
    const ids = Object.keys(g.shift!.sh.calls);
    const gen = ids.filter((x) => x.includes('~'));
    expect(gen.length).toBeGreaterThan(0);
  });

  it('bot (perfil médio) joga a campanha sintética com ligações variáveis sem erro', () => {
    // Demissão/colapso por erros do bot é desfecho legítimo; aqui só não pode haver exceção.
    const summary: string[] = [];
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const r = playBot(SYN, PROFILES.medio, seed, { variable: true });
      if (r.errors.length) console.log('sintético', seed, r.errors.slice(0, 5));
      expect(r.errors).toEqual([]);
      summary.push(`s${seed}: ${r.daysPlayed} dias, ${r.handled} ligações, ${r.deaths} óbitos, ${r.warnings} adv. → ${r.ending ?? r.gameOver}`);
    }
    console.log('CAMPANHA SINTÉTICA (bot médio):\n' + summary.join('\n'));
  });

  it('bot (perfil médio) joga a campanha real com ligações variáveis', () => {
    // Os dias são escritos em paralelo: erros de arquivos de dia só são registrados.
    // Falha apenas se o erro vier de uma ligação gerada pelo banco.
    const bankErrs: string[] = [];
    for (const seed of [1, 2, 3]) {
      const r = playBot(CONTENT, PROFILES.medio, seed, { variable: true });
      for (const e of r.errors) {
        if (e.includes('~') || e.includes('/bank/')) bankErrs.push(`seed ${seed}: ${e}`);
        else console.log(`[aviso: erro fora do banco] seed ${seed}: ${e.slice(0, 300)}`);
      }
    }
    if (bankErrs.length) console.log(bankErrs.join('\n'));
    expect(bankErrs).toEqual([]);
  });
});
