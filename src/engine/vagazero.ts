// =============================================================================
// Vaga zero negociada (1.1) — pilar da regulação.
//
// Toda vaga zero é uma conversa com o plantonista do PS do Regional (Dr. Saulo Brandão):
// ele diz que está lotado e objeta; o regulador escolhe argumentos (bom −2, meio −1, ruim +1 na
// Resistência); com a Resistência em 0 ele diz "Manda." e a maca da viatura é liberada na chegada.
// Sem acordo em quatro rodadas, a viatura fica presa no Regional (40–60 min) — o PS recebe no
// corredor: ninguém morre por falta de acordo; o custo é a viatura. Uma vez por plantão (a partir
// do dia 5), o caso pode ir para o Dr. Peixoto, que "sabe do quarto andar".
//
// Enquanto a tela está aberta, o relógio do plantão PARA (ShiftSim.isBlocked); ao fechar, o
// relógio cobra os minutos da conversa de uma vez (2 por rodada, 3 pelo Peixoto).
// Conteúdo: src/content/vagazero.ts (por id de ligação). Bíblia: docs/roteiro-1.1/vaga-zero.md.
// =============================================================================
import type { CallRT, PendingRequest, UnitState, VagaZeroContent, VagaZeroDef, VzCardDef, VzLineDef, VzObjection, VzRT, Txt } from './types';
import type { ShiftSim } from './shift';
import { txt, resolveTokens } from './text';
import { Rng, clamp, fmtTime, hashString } from './util';

export const VZ_MAX_ROUNDS = 4;
/** minutos de jogo cobrados por rodada (quando a tela fecha) */
export const VZ_ROUND_MIN = 2;
/** minutos de jogo cobrados pela escalada (Peixoto/diretor) */
export const VZ_ESCALA_MIN = 3;
/** pavio de cada rodada, em segundos reais (0 = sem pavio) */
export const VZ_FUSE = 15;
/** a cada quantos minutos de maca presa o rádio pergunta se você quer tentar de novo */
export const VZ_RETRY_EVERY = 20;
/** maca liberada depois do acordo (minutos de passagem do paciente na sala vermelha) */
export const VZ_RELEASE = 8;

const UNRELIABLE_PEIXOTO = 0.95;

type Origin = VzRT['origin'];
interface QueueItem {
  key: string;
  callId: string;
  unit?: string;
  origin: Origin;
  pendingReq?: VzRT['pendingReq'];
}

// -----------------------------------------------------------------------------
// leitura
// -----------------------------------------------------------------------------
export function vzContent(sim: ShiftSim): VagaZeroContent | undefined {
  return sim.c.vagazero;
}

/** a negociação existe neste plantão (campanha a partir do dia 3; infinito; nunca na campanha da Simone) */
export function vzEnabled(sim: ShiftSim): boolean {
  if (!sim.c.vagazero || sim.tarm) return false;
  if (sim.st.mode === 'infinito') return true;
  return sim.st.mode === 'campanha' && sim.st.day >= 3;
}

/** confiança do Saulo (0–5), guardada em `flags.saulo_confianca` */
export function saulo(sim: ShiftSim | { st: { flags: Record<string, unknown> } }): number {
  return clamp(Number(sim.st.flags['saulo_confianca']) || 0, 0, 5);
}

function addConfianca(sim: ShiftSim, d: number) {
  const before = saulo(sim);
  const after = clamp(before + d, 0, 5);
  sim.st.flags['saulo_confianca'] = after;
  if (after === before) return;
  sim.toast(d > 0 ? 'O Saulo, do Regional, vai lembrar disso.' : 'O Saulo, do Regional, não vai esquecer isso.', d > 0 ? 'bom' : 'ruim');
}

/** entrada escrita para esta ligação (ligações sorteadas do banco não têm) */
export function vzDefFor(sim: ShiftSim, call: CallRT): VagaZeroDef | undefined {
  if (call.gen) return undefined;
  return sim.c.vagazero?.calls[call.def];
}

/** o caso precisa mesmo do Regional (senão, desviar para a UPA é a resposta certa) */
export function vzNeedsRegional(sim: ShiftSim, call: CallRT, def?: VagaZeroDef): boolean {
  if (def?.precisa !== undefined) return def.precisa;
  const t = sim.truthOf(call);
  if (t.dest?.length) return t.dest.includes('REG');
  return t.sev === 'vermelho';
}

function patientName(sim: ShiftSim, call: CallRT): string {
  const p = sim.defOf(call).patient;
  const first = (p.name ?? '').split(/[\s(]/)[0] ?? '';
  if (!first || /^(rapaz|homem|mulher|moça|menino|menina|criança|bebê|idos)/i.test(p.name)) return 'o paciente';
  if ((p.age ?? 0) >= 60) return (p.sex === 'F' ? 'Dona ' : 'Seu ') + first;
  return first;
}

/** resolve os tokens próprios da tela ({reg}, {recurso}, {paciente}, {hora}) e os do jogo */
function say(sim: ShiftSim, t: Txt | undefined, vz?: Pick<VzRT, 'recurso' | 'patient'>, extra?: Record<string, string>): string {
  if (t === undefined) return '';
  const c = sim.ctx();
  let s = txt(t, c);
  const reg = saulo(sim) >= 3 ? '{nome}' : 'Regulação';
  const pac = vz?.patient ?? 'o paciente';
  s = s
    .replace(/\{reg\}/g, reg)
    .replace(/\{recurso\}/g, vz?.recurso ?? 'sala vermelha')
    .replace(/\{Paciente\}/g, pac.charAt(0).toUpperCase() + pac.slice(1))
    .replace(/\{paciente\}/g, pac)
    .replace(/\{hora\}/g, fmtTime(sim.sh.time));
  for (const [k, v] of Object.entries(extra ?? {})) s = s.split(`{${k}}`).join(v);
  return resolveTokens(s, sim.st.gender, sim.st);
}

function lines(sim: ShiftSim, vz: VzRT, ls: VzLineDef[] | undefined) {
  const c = sim.ctx();
  for (const l of ls ?? []) if (!l.when || l.when(c)) vz.log.push({ who: l.who, text: say(sim, l.t, vz) });
}

// -----------------------------------------------------------------------------
// fila de negociações
// -----------------------------------------------------------------------------
/** carimbo de uma ligação marcada: abre (ou enfileira) a negociação. Devolve true se enfileirou. */
export function vzOnStamp(sim: ShiftSim, call: CallRT): boolean {
  if (!vzEnabled(sim) || call.vz) return false;
  const def = vzDefFor(sim, call);
  if (!def || def.abre === 'retencao') return false;
  const d = call.decision;
  if (!d || (d.resource !== 'USA' && d.resource !== 'USB')) return false;
  const dest = d.dest ?? sim.defaultDestOf(call);
  if (dest !== 'REG') return false;
  if (def.when && !def.when(sim.ctx(), sim.truthOf(call))) return false;
  call.vz = { key: call.def, tries: 0 };
  vzEnqueue(sim, { key: call.def, callId: call.id, unit: d.unit, origin: 'carimbo' });
  return true;
}

/** múltiplas vítimas (dia 15): a negociação vale para todas as viaturas que forem ao Regional */
export function vzOnMci(sim: ShiftSim, call: CallRT): boolean {
  if (!vzEnabled(sim) || call.vz) return false;
  const def = vzDefFor(sim, call);
  if (!def || def.abre === 'retencao') return false;
  call.vz = { key: call.def, tries: 0 };
  vzEnqueue(sim, { key: call.def, callId: call.id, origin: 'carimbo' });
  return true;
}

export function vzEnqueue(sim: ShiftSim, item: QueueItem) {
  const q = (sim.sh.vzQueue ??= []);
  if (q.some((x) => x.callId === item.callId && x.origin === item.origin) || sim.sh.vz?.callId === item.callId) return;
  q.push(item);
}

/** abre a próxima negociação da fila quando a mesa está livre (sem orientação, aviso ou outra negociação) */
export function vzTryOpen(sim: ShiftSim): boolean {
  const sh = sim.sh;
  if (sh.vz || !sh.vzQueue?.length || sh.guideCallId || sh.ended || sim.st.gameOver) return false;
  if (sh.modals.some((m) => m.blocking)) return false;
  const item = sh.vzQueue.shift()!;
  const call = sh.calls[item.callId];
  if (!call) return vzTryOpen(sim);
  vzOpen(sim, item, call);
  return true;
}

// -----------------------------------------------------------------------------
// a negociação
// -----------------------------------------------------------------------------
function rngFor(sim: ShiftSim, call: CallRT, salt: string) {
  return new Rng(hashString(`${sim.st.seed}:${sim.st.day}:${call.id}:vz:${salt}`));
}

function vzOpen(sim: ShiftSim, item: QueueItem, call: CallRT) {
  const C = vzContent(sim)!;
  const def = item.key === 'generico' ? undefined : C.calls[item.key];
  const t = sim.truthOf(call);
  const c = sim.ctx();
  const v = (call.vz ??= { key: item.key, tries: 0 });
  v.tries++;
  const precisa = vzNeedsRegional(sim, call, def);
  let start: number;
  if (def && item.origin !== 'retentativa') start = typeof def.start === 'function' ? def.start(c) : def.start;
  else start = item.origin === 'retentativa' ? 2 : 3;
  const conf = saulo(sim);
  if (start > 0 && !def?.fixo) start = Math.max(1, start - conf);
  const vz: VzRT = {
    id: 'vz' + ++sim.sh.seq,
    key: item.key,
    callId: call.id,
    unit: item.unit,
    origin: item.origin,
    patient: patientName(sim, call),
    recurso: def?.recurso ?? C.recursoDe(t.dx),
    round: 0,
    maxRounds: VZ_MAX_ROUNDS,
    resistance: start,
    start,
    floor: def?.floor ?? 0,
    cards: [],
    used: [],
    usedObjections: [],
    log: [],
    state: 'negociando',
    peixoto: 'indisponivel',
    peixotoLabel: 'Passar ao Dr. Peixoto',
    fuse: sim.st.difficulty === 'narrativo' ? 0 : VZ_FUSE,
    minutes: 0,
    especial: def?.especial,
    precisa,
    pendingReq: item.pendingReq,
  };
  // o que ficou da última vez
  if (start > 0) {
    if (sim.st.flags['saulo_mentira']) {
      delete sim.st.flags['saulo_mentira'];
      vz.resistance = vz.start = Math.min(6, vz.start + 2);
      vz.log.push({ who: 'SAULO', text: say(sim, 'Antes de você falar, {reg}: da última vez o "parando" tava comendo bolacha comigo. Eu vou querer o eletro.', vz) });
    }
    if (sim.st.flags['saulo_promessa_quebrada']) {
      delete sim.st.flags['saulo_promessa_quebrada'];
      vz.resistance = vz.start = Math.min(6, vz.start + 1);
      vz.log.push({ who: 'SAULO', text: say(sim, C.falas.promessaLembra, vz) });
    }
    if (sim.st.flags['saulo_precisou_chefe']) {
      delete sim.st.flags['saulo_precisou_chefe'];
      vz.log.push({ who: 'SAULO', text: say(sim, C.falas.precisouChefe, vz) });
    }
  }
  sim.sh.vz = vz;
  sim.sh.fast = false;
  lines(sim, vz, def?.intro);
  if (vz.resistance <= 0) {
    vz.direto = true;
    finish(sim, vz, 'aceito');
    vz.minutes = 1;
    return;
  }
  if (!def || !def.objections.length) {
    if (!def?.intro?.length || item.origin !== 'carimbo') vz.log.push({ who: 'SAULO', text: say(sim, C.abertura, vz) });
  }
  updatePeixoto(sim, vz, def);
  nextObjection(sim, vz, def);
}

function objectionsOf(sim: ShiftSim, vz: VzRT, def?: VagaZeroDef): VzObjection[] {
  const C = vzContent(sim)!;
  const own = vz.origin === 'retentativa' ? [] : def?.objections ?? [];
  // genéricas numa ordem própria da ligação (O9, o desrespeito, nunca é a primeira)
  const call = sim.sh.calls[vz.callId];
  const gen = rngFor(sim, call, 'gen').shuffle([...C.generic]);
  if (!vz.precisa) {
    // o caso não precisa do Regional: a armadilha vem logo (O8/O3: aceitar a UPA é o certo)
    gen.sort((a, b) => Number(b.id === 'O8' || b.id === 'O3') - Number(a.id === 'O8' || a.id === 'O3'));
  } else if (gen[0]?.id === 'O9' && gen.length > 1) gen.push(gen.shift()!);
  return [...own, ...gen];
}

function eligible(sim: ShiftSim, vz: VzRT, o: VzObjection): boolean {
  if (vz.usedObjections.includes(o.id)) return false;
  if (o.after && !o.after.some((x) => vz.used.includes(x))) return false;
  if (o.notAfter && o.notAfter.some((x) => vz.used.includes(x))) return false;
  if (o.precisa !== undefined && o.precisa !== vz.precisa) return false;
  if (o.when && !o.when(sim.ctx())) return false;
  return true;
}

function cardOk(sim: ShiftSim, vz: VzRT, k: VzCardDef): boolean {
  if (k.precisa !== undefined && k.precisa !== vz.precisa) return false;
  if (k.when && !k.when(sim.ctx())) return false;
  return true;
}

function nextObjection(sim: ShiftSim, vz: VzRT, def?: VagaZeroDef) {
  const C = vzContent(sim)!;
  const call = sim.sh.calls[vz.callId];
  const o = objectionsOf(sim, vz, def).find((x) => eligible(sim, vz, x));
  if (!o) {
    impasse(sim, vz, def);
    return;
  }
  vz.objection = o.id;
  vz.usedObjections.push(o.id);
  vz.birra = !!o.birra;
  vz.log.push({ who: 'SAULO', text: say(sim, o.say, vz) });
  const cards = o.cards.filter((k) => cardOk(sim, vz, k));
  // um argumento "sujo" quando cabe (ninguém é santo às três da tarde)
  if (cards.length < 4) {
    const r = rngFor(sim, call, 'sujo' + vz.round);
    const tags = new Set(cards.map((k) => k.tag).filter(Boolean));
    const pool = C.sujos.filter((k) => !vz.used.includes(k.id) && !tags.has(k.tag) && cardOk(sim, vz, k) && !(k.tag === 'mentira' && /parada/i.test(sim.truthOf(call).dx)));
    if (pool.length && r.chance(0.8)) cards.push(r.pick(pool));
  }
  const order = rngFor(sim, call, 'ordem' + vz.round).shuffle([...cards]);
  const hintId = def?.dica ? order.find((k) => effKind(vz, k) === 'bom' && k.tag !== 'mentira')?.id : undefined;
  vz.cards = order.map((k) => ({ id: k.id, text: say(sim, k.text, vz), hint: k.id === hintId || undefined }));
  updatePeixoto(sim, vz, def);
}

function findCard(sim: ShiftSim, vz: VzRT, id: string): VzCardDef | undefined {
  const C = vzContent(sim)!;
  const def = C.calls[vz.key];
  const pools: VzObjection[] = [...(def?.objections ?? []), ...C.generic];
  const o = pools.find((x) => x.id === vz.objection);
  return o?.cards.find((k) => k.id === id) ?? C.sujos.find((k) => k.id === id);
}

function effKind(vz: VzRT, k: VzCardDef): VzCardDef['kind'] {
  if (k.kind === 'bom' && k.goodAfter && !k.goodAfter.some((x) => vz.used.includes(x))) return 'meio';
  return k.kind;
}

function defOf(sim: ShiftSim, vz: VzRT): VagaZeroDef | undefined {
  return vz.key === 'generico' ? undefined : vzContent(sim)?.calls[vz.key];
}

/** o jogador escolhe um argumento */
export function vzChoose(sim: ShiftSim, cardId: string): boolean {
  const vz = sim.sh.vz;
  if (!vz || vz.state !== 'negociando' || !vz.cards.some((k) => k.id === cardId)) return false;
  const card = findCard(sim, vz, cardId);
  if (!card) return false;
  const def = defOf(sim, vz);
  vz.log.push({ who: 'VOCÊ', text: vz.cards.find((k) => k.id === cardId)!.text });
  const kind = effKind(vz, card);
  const early = kind !== card.kind;
  let delta = card.delta ?? (kind === 'bom' ? -2 : kind === 'meio' ? -1 : 1);
  if (early) delta = -1;
  if (kind === 'bom' && card.delta === undefined && sim.st.difficulty === 'narrativo') delta = -3;
  if (kind !== 'bom' || card.tag === 'mentira') vz.dirty = true;
  switch (card.tag) {
    case 'mentira':
      vz.lie = true;
      break;
    case 'ameaca':
    case 'grito':
      addConfianca(sim, -1);
      break;
    case 'carteirada':
      addConfianca(sim, -1);
      if (vz.peixoto === 'apagado' || vz.peixoto === 'aceso') {
        sim.sh.flags['vz_peixoto'] = (Number(sim.sh.flags['vz_peixoto']) || 0) + 1;
        vz.peixoto = 'usado';
      }
      break;
    case 'promessa':
      if (kind === 'bom') vz.promise = true;
      break;
    case 'desvio':
      vz.used.push(card.id);
      vz.round++;
      vz.minutes += VZ_ROUND_MIN;
      finish(sim, vz, 'desviado');
      return true;
  }
  vz.used.push(card.id);
  vz.round++;
  vz.minutes += VZ_ROUND_MIN;
  vz.resistance = vz.resistance + delta;
  if (delta < 0 && vz.floor > 0) vz.resistance = Math.max(vz.floor, vz.resistance);
  vz.resistance = clamp(vz.resistance, 0, 7);
  const reply = early ? card.replyEarly : card.reply;
  if (reply) vz.log.push({ who: 'SAULO', text: say(sim, reply, vz) });
  advanceRound(sim, vz, def);
  return true;
}

/** o pavio da rodada acabou sem resposta: conta como argumento ruim */
export function vzTimeout(sim: ShiftSim): boolean {
  const vz = sim.sh.vz;
  if (!vz || vz.state !== 'negociando') return false;
  const C = vzContent(sim)!;
  vz.log.push({ who: 'VOCÊ', text: '(...)' });
  vz.dirty = true;
  vz.log.push({ who: 'SAULO', text: say(sim, C.falas.pavio, vz) });
  vz.round++;
  vz.minutes += VZ_ROUND_MIN;
  vz.resistance = clamp(vz.resistance + 1, 0, 7);
  advanceRound(sim, vz, defOf(sim, vz));
  return true;
}

function advanceRound(sim: ShiftSim, vz: VzRT, def?: VagaZeroDef) {
  if (vz.resistance <= 0) return finish(sim, vz, 'aceito');
  if (vz.round >= vz.maxRounds) return impasse(sim, vz, def);
  nextObjection(sim, vz, def);
}

function impasse(sim: ShiftSim, vz: VzRT, def?: VagaZeroDef) {
  vz.state = 'impasse';
  vz.cards = [];
  vz.objection = undefined;
  vz.log.push({ who: 'SAULO', text: say(sim, def?.recusa ?? vzContent(sim)!.falas.recusa, vz) });
  updatePeixoto(sim, vz, def);
}

// -----------------------------------------------------------------------------
// Peixoto (1× por plantão)
// -----------------------------------------------------------------------------
function peixotoLimit(sim: ShiftSim): number {
  return sim.st.day === 19 && sim.st.sources.peixoto ? 2 : 1;
}

function updatePeixoto(sim: ShiftSim, vz: VzRT, def?: VagaZeroDef) {
  if (vz.state === 'fim') return;
  const day = sim.st.day;
  const camp = sim.st.mode === 'campanha';
  if (def?.peixoto === false || (camp && day < 5) || (vz.peixotoTried && vz.peixoto === 'indisponivel')) {
    vz.peixoto = 'indisponivel';
    return;
  }
  vz.peixotoLabel =
    def?.peixoto === 'impedimento' ? 'Pedir à Simone que ligue pro diretor clínico' : sim.st.flags['peixoto_caiu'] && day >= 18 ? 'Passar à Dra. Heloísa (coordenação)' : 'Passar ao Dr. Peixoto';
  const used = Number(sim.sh.flags['vz_peixoto']) || 0;
  if (vz.peixoto === 'usado' || used >= peixotoLimit(sim)) {
    vz.peixoto = 'usado';
    return;
  }
  const lit = vz.state === 'impasse' || vz.birra || (vz.round >= 2 && vz.resistance >= 3) || (vz.floor > 0 && vz.round >= 2 && vz.resistance <= vz.floor);
  vz.peixoto = lit ? 'aceso' : 'apagado';
}

/** passa o caso para o Peixoto (ou para quem estiver no lugar dele) */
export function vzPeixoto(sim: ShiftSim): boolean {
  const vz = sim.sh.vz;
  if (!vz || vz.state === 'fim' || vz.peixoto !== 'aceso') return false;
  const C = vzContent(sim)!;
  const def = defOf(sim, vz);
  const call = sim.sh.calls[vz.callId];
  const day = sim.st.day;
  const roll = rngFor(sim, call, 'peixoto' + vz.round).next();
  // D19, o pai morreu e ele endureceu: recusa uma vez (sem gastar o uso do dia)
  if (day === 19 && sim.st.flags['peixoto_endureceu'] && def?.peixoto !== 'impedimento' && !sim.st.flags['peixoto_caiu']) {
    vz.peixotoTried = true;
    vz.peixoto = 'indisponivel';
    vz.log.push({ who: 'PEIXOTO', text: say(sim, C.falas.peixotoEndureceu, vz) });
    return true;
  }
  vz.peixotoTried = true;
  sim.sh.flags['vz_peixoto'] = (Number(sim.sh.flags['vz_peixoto']) || 0) + 1;
  vz.peixoto = 'usado';
  vz.minutes += VZ_ESCALA_MIN;
  let ok: boolean;
  if (def?.peixoto === 'impedimento') {
    lines(sim, vz, C.falas.diretor);
    ok = roll < 0.6;
    if (!ok) vz.log.push({ who: 'SIMONE', text: say(sim, C.falas.diretorFalhou, vz) });
  } else if (sim.st.flags['peixoto_caiu'] && day >= 18) {
    lines(sim, vz, C.falas.heloisa);
    ok = sim.st.flags['saulo_fonte'] ? true : roll < 0.8;
    if (!ok) vz.log.push({ who: 'HELOÍSA', text: say(sim, 'Ele desligou na minha cara, {dr}. Vou registrar. Mas a maca, hoje, não sai.', vz) });
  } else {
    lines(sim, vz, def?.peixotoFala ?? (day >= 19 && sim.st.sources.peixoto ? C.falas.peixotoFonte : C.falas.peixoto));
    ok = roll < UNRELIABLE_PEIXOTO;
    if (!ok) vz.log.push({ who: 'PEIXOTO', text: say(sim, C.falas.peixotoFalhou, vz) });
    // ele negocia "pelo painel": com a meta de USA estourada, cobra
    const goal = sim.day.goal;
    if (goal && sim.sh.usaSent > goal.maxUSA) {
      vz.log.push({ who: 'PEIXOTO', text: say(sim, C.falas.peixotoCobra, vz) });
      sim.eff().add('desgaste', 2, 'Peixoto cobrou o painel');
    }
  }
  if (ok) {
    if (def?.onPeixoto) def.onPeixoto(sim.eff());
    finish(sim, vz, 'peixoto');
  } else {
    if (vz.state !== 'impasse') {
      vz.state = 'impasse';
      vz.cards = [];
    }
  }
  return true;
}

/** desiste e desvia para a UPA Norte (certo só quando o caso não precisa do Regional) */
export function vzDesviar(sim: ShiftSim): boolean {
  const vz = sim.sh.vz;
  if (!vz || vz.state === 'fim') return false;
  vz.log.push({ who: 'VOCÊ', text: 'Deixa, Saulo. Eu desvio pra UPA Norte.' });
  finish(sim, vz, 'desviado');
  return true;
}

/** sem acordo: desliga e a viatura espera a maca */
export function vzDesistir(sim: ShiftSim): boolean {
  const vz = sim.sh.vz;
  if (!vz || vz.state !== 'impasse') return false;
  finish(sim, vz, 'recusado');
  return true;
}

// -----------------------------------------------------------------------------
// resultado
// -----------------------------------------------------------------------------
function holdFor(sim: ShiftSim, call: CallRT, def?: VagaZeroDef): number | undefined {
  if (def?.retencao === 'normal') return undefined;
  if (typeof def?.retencao === 'number') return def.retencao;
  if (sim.st.day >= 15) return 60;
  return 40 + (hashString(`${sim.st.seed}:${call.id}:hold`) % 21);
}

function finish(sim: ShiftSim, vz: VzRT, result: NonNullable<VzRT['result']>) {
  const C = vzContent(sim)!;
  const def = defOf(sim, vz);
  const call = sim.sh.calls[vz.callId];
  const v = (call.vz ??= { key: vz.key, tries: 1 });
  vz.state = 'fim';
  vz.result = result;
  vz.cards = [];
  v.result = result;
  const e = sim.eff();
  const now = sim.sh.time;
  const day = sim.st.day;
  const fem = sim.defOf(call).patient.sex === 'F';
  sim.st.flags['vz_d' + day] = result;
  // contadores da campanha (relatório de balanceamento, finais)
  const cnt = (k: string) => (sim.st.flags[k] = (Number(sim.st.flags[k]) || 0) + 1);
  cnt('vz_total');
  if (result === 'peixoto') cnt('vz_peixoto_total');
  if (result === 'recusado') cnt('vz_recusadas');
  if (result === 'desviado') cnt('vz_desviadas');
  if (result === 'aceito' || result === 'peixoto') {
    if (result === 'aceito') vz.log.push({ who: 'SAULO', text: say(sim, def?.aceita ?? C.falas.aceita, vz) });
    v.lie = !!vz.lie;
    v.promise = !!vz.promise;
    e.set('vaga_zero_negociada');
    e.achievement('vaga_zero');
    sim.st.flags['vz_aceitas'] = (Number(sim.st.flags['vz_aceitas']) || 0) + 1;
    // o Saulo respeita quem negocia limpo: só argumentos que respondem, sem Peixoto e sem mentira (nas negociações escritas)
    if (result === 'aceito' && !vz.lie && !vz.direto && vz.key !== 'generico' && !vz.dirty) addConfianca(sim, 1);
    if (result === 'peixoto') sim.st.flags['saulo_precisou_chefe'] = true;
    // compatibilidade: o roteiro antigo do dia 19 (guia 'vagazero') conferia o minijogo
    if (sim.defOf(call).guide && guideIdOf(sim, call) === 'vagazero') {
      call.guide = { id: 'vagazero', done: true, success: true, quality: 1 };
      (call as CallRT & { vagaZero?: boolean }).vagaZero = true;
    }
    if (def?.onAceita && result === 'aceito') def.onAceita(e);
    if (def?.depois?.length) lines(sim, vz, def.depois);
    else if (!vz.direto) vz.log.push({ who: 'SIMONE', text: say(sim, C.falas.postit, vz) });
    if (def?.radioDepois) sim.schedule(now + def.radioDepois.min, 'vz', vz.callId, { kind: 'radio', who: def.radioDepois.who, text: say(sim, def.radioDepois.text, vz) });
    if (vz.promise && def?.promessa) sim.schedule(Math.min(now + def.promessa.depois, sim.sh.end - 15), 'vz', vz.callId, { kind: 'promessa' });
    // a maca já está presa lá: libera em poucos minutos
    if (vz.pendingReq) {
      sim.applyRequestNow(vz.pendingReq.req, vz.pendingReq.opt);
    }
    for (const x of retainedAtRegional(sim, vz)) {
      const until = Math.min(x.until ?? now + VZ_RELEASE, now + VZ_RELEASE + vz.minutes);
      sim.setUnit(x.id, 'RETIDO', until, 'Vaga zero · maca liberando');
      sim.radio(x.radioName, `${x.label}: vaga zero aceita. Paciente na sala vermelha, maca liberando.`, 'ok');
    }
    sim.radio('REGULAÇÃO', `Vaga zero no Regional${result === 'peixoto' ? ' (pela coordenação)' : ''}: ${vz.patient} recebid${fem ? 'a' : 'o'} na sala vermelha.`, 'ok');
  } else if (result === 'recusado') {
    v.hold = holdFor(sim, call, def);
    if (def?.onRecusa) def.onRecusa(e);
    if (vz.pendingReq) sim.dropInlineRequest(vz.pendingReq.req.id);
    const held = retainedAtRegional(sim, vz);
    for (const x of held) {
      x.note = 'RETIDA · sem vaga zero, maca presa no Regional';
      scheduleRetry(sim, call, x);
    }
    sim.radio('REGULAÇÃO', `Sem vaga zero no Regional para ${vz.patient}. ${held.length ? 'A maca segue presa.' : 'A viatura vai ficar com a maca presa quando chegar.'}`, 'alerta');
  } else if (result === 'desviado') {
    if (vz.precisa) {
      sim.addPenalty('nota', `${vz.patient} desviad${fem ? 'a' : 'o'} para a UPA: precisava de ${vz.recurso}.`);
    } else {
      addConfianca(sim, 1);
      vz.log.push({ who: 'SAULO', text: say(sim, 'Obrigado, {reg}. (crec) De verdade.', vz) });
    }
    if (vz.pendingReq) sim.dropInlineRequest(vz.pendingReq.req.id);
    sim.divertToUPA(call);
  }
}

function guideIdOf(sim: ShiftSim, call: CallRT): string | undefined {
  const g = sim.defOf(call).guide;
  if (!g) return undefined;
  return typeof g.id === 'function' ? g.id(sim.ctx()) : g.id;
}

/** viaturas desta negociação presas no Regional agora */
function retainedAtRegional(sim: ShiftSim, vz: VzRT): UnitState[] {
  const out: UnitState[] = [];
  for (const u of Object.values(sim.sh.units)) {
    if (u.status !== 'RETIDO') continue;
    const mine = vz.unit ? u.id === vz.unit : u.callId === vz.callId;
    if (mine && (/regional/i.test(u.note ?? '') || u.dest === 'REG' || !!vz.pendingReq)) out.push(u);
  }
  return out;
}

function scheduleRetry(sim: ShiftSim, call: CallRT, u: UnitState) {
  if ((call.vz?.tries ?? 0) >= 3) return;
  if ((u.until ?? 0) - sim.sh.time <= VZ_RETRY_EVERY / 2) return;
  sim.schedule(sim.sh.time + VZ_RETRY_EVERY, 'vz', call.id, { kind: 'retry', unit: u.id });
}

/** fecha a tela: o mundo volta e o relógio cobra os minutos da conversa */
export function vzClose(sim: ShiftSim): boolean {
  const vz = sim.sh.vz;
  if (!vz || vz.state !== 'fim') return false;
  sim.sh.vz = undefined;
  if (vz.minutes > 0) sim.advance(vz.minutes);
  vzTryOpen(sim);
  return true;
}

// -----------------------------------------------------------------------------
// chegada ao Regional, pedidos de rádio, promessas
// -----------------------------------------------------------------------------
/**
 * A viatura chegou ao Regional. Devolve a retenção de maca (e o aviso) conforme a vaga zero da
 * ligação, ou undefined para a retenção comum.
 */
export function vzAtHospital(sim: ShiftSim, u: UnitState, call: CallRT): { ret: number; note: string; text: string } | undefined {
  const v = call.vz;
  if (!v?.result) return undefined;
  const C = vzContent(sim)!;
  if (v.lie && !v.lieCaught && v.result === 'aceito') {
    v.lieCaught = true;
    addConfianca(sim, -2);
    sim.st.flags['saulo_mentira'] = true;
    const vzLike = { recurso: '', patient: patientName(sim, call) };
    sim.radio('SAULO · REGIONAL', say(sim, C.falas.mentiraDescoberta, vzLike), 'alerta', call.id);
  }
  if (v.result === 'aceito' || v.result === 'peixoto') {
    const ret = 5 + (hashString(`${sim.st.seed}:${call.id}:${u.id}:rel`) % 6);
    return { ret, note: 'Vaga zero · maca liberando', text: `${u.label} no Regional. Vaga zero: paciente recebido na sala vermelha, maca liberada em ${ret} min.` };
  }
  if (v.result === 'recusado' && v.hold !== undefined) {
    scheduleRetry(sim, call, { ...u, until: sim.sh.time + v.hold });
    return { ret: v.hold, note: 'RETIDA · sem vaga zero, maca presa no Regional', text: `${u.label} no Regional. Sem vaga zero, a maca ficou presa. Previsão: ${v.hold} min.` };
  }
  return undefined;
}

/** eventos agendados da vaga zero ('vz') */
export function vzEvent(sim: ShiftSim, callId: string, data: Record<string, unknown> | undefined) {
  const call = sim.sh.calls[callId];
  if (!call || !data) return;
  const C = vzContent(sim);
  if (!C) return;
  const kind = data.kind;
  if (kind === 'radio') {
    sim.radio(String(data.who ?? 'RÁDIO'), String(data.text ?? ''), 'info', callId);
    return;
  }
  if (kind === 'retry') {
    const u = sim.sh.units[String(data.unit)];
    if (!u || u.status !== 'RETIDO' || (u.until ?? 0) - sim.sh.time < 6) return;
    if (sim.sh.requests.some((r) => r.kind === 'vaga' && r.callId === callId)) return;
    sim.makeRequest({
      kind: 'vaga',
      from: u.radioName,
      text: `Central, ${u.label} ainda presa no Regional. Faltam uns ${Math.round((u.until ?? sim.sh.time) - sim.sh.time)} min pra soltar a maca.`,
      options: [
        { id: 'negociar', label: 'Ligar de novo pro Regional e negociar' },
        { id: 'aguardar', label: 'Esperar a maca' },
      ],
      defaultOpt: 'aguardar',
      callId,
      data: { unit: u.id, retry: true },
      timeout: 8,
    });
    return;
  }
  if (kind === 'promessa') {
    const def = sim.c.vagazero?.calls[call.vz?.key ?? ''];
    const p = def?.promessa;
    if (!p) return;
    const vzLike = { recurso: def.recurso, patient: patientName(sim, call) };
    const limpo = typeof p.limpo === 'function' ? p.limpo(sim.ctx()) : p.limpo;
    if (!limpo) {
      addConfianca(sim, 1);
      sim.radio('SAULO · REGIONAL', say(sim, p.alterado ?? 'A {exame} não veio limpa, {reg}. Ainda bem que você mandou.', vzLike, { exame: p.exame }), 'info', callId);
      return;
    }
    const free = sim.availableUnits('USB')[0] ?? sim.availableUnits('USA')[0];
    sim.makeRequest({
      kind: 'promessa',
      from: 'SAULO · REGIONAL',
      text: say(sim, p.limpoTexto ?? C.falas.promessaBuscar, vzLike, { exame: p.exame }),
      options: [
        { id: 'buscar', label: free ? `Mandar a ${free.label} buscar (cumprir o combinado)` : 'Mandar a primeira viatura que liberar' },
        { id: 'nao', label: 'Agora não dá' },
      ],
      defaultOpt: 'nao',
      callId,
      timeout: 10,
    });
    return;
  }
  if (kind === 'buscar') {
    vzFetch(sim, call, Number(data.n) || 0);
  }
}

/** cumprir a promessa: uma viatura vai buscar o paciente no Regional (fica ocupada ~30 min) */
function vzFetch(sim: ShiftSim, call: CallRT, n: number) {
  const C = vzContent(sim)!;
  const u = sim.availableUnits('USB')[0] ?? sim.availableUnits('USA')[0];
  if (!u) {
    if (n < 6) sim.schedule(sim.sh.time + 10, 'vz', call.id, { kind: 'buscar', n: n + 1 });
    else promiseBroken(sim, call);
    return;
  }
  sim.setUnit(u.id, 'RETIDO', sim.sh.time + 30, 'Buscando paciente no Regional (vaga zero: o combinado)');
  addConfianca(sim, 1);
  sim.st.flags['saulo_promessa_cumprida'] = true;
  sim.radio('SAULO · REGIONAL', say(sim, C.falas.promessaCumprida, { recurso: '', patient: patientName(sim, call) }), 'ok', call.id);
}

function promiseBroken(sim: ShiftSim, call: CallRT) {
  const C = vzContent(sim)!;
  addConfianca(sim, -1);
  sim.st.flags['saulo_promessa_quebrada'] = true;
  sim.radio('SAULO · REGIONAL', say(sim, C.falas.promessaQuebrada, { recurso: '', patient: patientName(sim, call) }), 'alerta', call.id);
}

/** resposta do pedido de rádio da promessa */
export function vzPromiseAnswer(sim: ShiftSim, call: CallRT | undefined, opt: string) {
  if (!call) return;
  if (opt === 'buscar') vzFetch(sim, call, 0);
  else promiseBroken(sim, call);
}

/**
 * Pedido de rádio do roteiro do dia com a opção "negociar" sobre maca presa no Regional (D9, D15):
 * vira a negociação. Devolve true quando abriu (o efeito da opção só vale com acordo).
 */
export function vzInterceptRequest(sim: ShiftSim, req: PendingRequest, opt: string): boolean {
  if (!vzEnabled(sim) || opt !== 'negociar') return false;
  // (o pedido comum de maca presa "retencao" continua instantâneo: o paciente já foi recebido; não é vaga zero)
  if (req.kind !== 'timeline' && req.kind !== 'vaga') return false;
  const sh = sim.sh;
  const unitId = req.data?.unit as string | undefined;
  let u: UnitState | undefined = unitId ? sh.units[unitId] : undefined;
  if (req.kind === 'timeline') {
    if (!/regional/i.test(req.text)) return false;
    u = Object.values(sh.units).find((x) => x.status === 'RETIDO' && /regional/i.test(x.note ?? ''));
    if (!u) return false;
  }
  // a ligação: a escrita para "retenção" no dia (D9), a da própria viatura, ou a do pedido
  const C = vzContent(sim)!;
  let call: CallRT | undefined;
  let key = 'generico';
  for (const c of req.kind === 'timeline' ? Object.values(sh.calls) : []) {
    if (c.gen) continue;
    const d = C.calls[c.def];
    if (d && (d.abre === 'retencao' || d.abre === 'ambos') && (!c.vz?.result || c.vz.result === 'recusado')) {
      call = c;
      key = c.def;
      break;
    }
  }
  if (!call) {
    const cid = req.callId ?? u?.callId;
    call = cid ? sh.calls[cid] : undefined;
    if (call && C.calls[call.def] && !call.gen && req.kind !== 'vaga') key = call.def;
  }
  if (!call) return false;
  // retentativa: a mesma ligação já negociou e não houve acordo
  const origin: Origin = req.data?.retry || call.vz?.result === 'recusado' ? 'retentativa' : req.kind === 'timeline' ? 'retencao' : 'radio';
  if (origin === 'retentativa') key = 'generico';
  call.vz ??= { key, tries: 0 };
  vzEnqueue(sim, { key, callId: call.id, unit: u?.id, origin, pendingReq: req.kind === 'timeline' ? { req, opt } : undefined });
  vzTryOpen(sim);
  return true;
}

/** resumo para a tela */
export interface VzScreen {
  vz: VzRT;
  /** respiração do Saulo no fone: rápida (resistente) … lenta (cedendo) */
  breath: 'rapida' | 'media' | 'lenta';
  /** batida do "tempo parando", em bpm (sobe com a Resistência) */
  bpm: number;
  /** horário congelado no relógio */
  frozenAt: string;
  canDesviar: boolean;
}

export function vzScreen(sim: ShiftSim): VzScreen | undefined {
  const vz = sim.sh.vz;
  if (!vz) return undefined;
  const r = vz.state === 'fim' ? (vz.result === 'aceito' || vz.result === 'peixoto' ? 0 : 3) : vz.resistance;
  return {
    vz,
    breath: r >= 3 ? 'rapida' : r >= 2 ? 'media' : 'lenta',
    bpm: 54 + r * 8,
    frozenAt: fmtTime(sim.sh.time),
    canDesviar: vz.state !== 'fim',
  };
}

/** o que um argumento da tela vale de verdade (para o bot e para os testes; a tela não mostra) */
export function vzCardInfo(sim: ShiftSim, id: string): { kind: VzCardDef['kind']; tag?: VzCardDef['tag']; delta?: number } | undefined {
  const vz = sim.sh.vz;
  if (!vz) return undefined;
  const k = findCard(sim, vz, id);
  if (!k) return undefined;
  return { kind: effKind(vz, k), tag: k.tag, delta: k.delta };
}

/** a hora em que a negociação do dia 19 da Cida aconteceu (para o post-it) */
export function vzHour(sim: ShiftSim): string {
  return fmtTime(sim.sh.time);
}
