// Jogador automático: testes de ponta a ponta e simulação de balanceamento
// (perfis Lento / Médio / Experiente da planilha do documento de design).
import type { Content } from './content-api';
import type { Resource, Color, Support, Dest, TruthDef, CallRT, GameState, Choice, SceneNode } from './types';
import { makeEffCtx } from './state';
import { Game } from './game';
import { Rng } from './util';
import { colorFor } from './grading';
import { autoPlayField } from './field';

export interface BotProfile {
  name: string;
  /** probabilidade de acertar a decisão */
  accuracy: number;
  /** segundos reais "pensando" por ligação */
  think: [number, number];
  /** perguntas extras além das obrigatórias */
  questions: number;
  coffee: number;
  /** bico quando o saldo cair abaixo disto */
  bicoBelow: number;
  /** usa o modo inconsistência */
  inspects: boolean;
  /** qualidade média nos minijogos */
  guideQuality: number;
  /** atende a família no dia 9 com USA (favorecimento) */
  favorFamily?: boolean;
  /** quando erra, chance de errar para mais (excesso) em vez de para menos */
  overBias: number;
  /** como escolhe nas cenas: 'bom' (protege família e integridade), 'neutro' (sorteia), 'pragmatico' (dinheiro primeiro) */
  ethic: 'bom' | 'neutro' | 'pragmatico';
}

export const PROFILES: Record<string, BotProfile> = {
  lento: { name: 'Lento', accuracy: 0.75, think: [80, 120], questions: 4, coffee: 0, bicoBelow: 60, inspects: false, guideQuality: 0.55, overBias: 0.75, ethic: 'neutro' },
  medio: { name: 'Médio', accuracy: 0.86, think: [40, 60], questions: 3, coffee: 1, bicoBelow: 40, inspects: true, guideQuality: 0.75, overBias: 0.6, ethic: 'neutro' },
  experiente: { name: 'Experiente', accuracy: 0.95, think: [35, 50], questions: 2, coffee: 1, bicoBelow: 0, inspects: true, guideQuality: 0.92, overBias: 0.5, ethic: 'bom' },
  oraculo: { name: 'Oráculo', accuracy: 1, think: [15, 25], questions: 1, coffee: 0, bicoBelow: -999, inspects: true, guideQuality: 1, overBias: 0.5, ethic: 'bom' },
};

export interface BotResult {
  profile: string;
  seed: number;
  daysPlayed: number;
  ending?: string;
  gameOver?: string;
  money: number;
  moneyByDay: number[];
  vars: Record<string, number>;
  keys: number;
  warnings: number;
  notes: number;
  deaths: number;
  handled: number;
  bicos: number;
  errors: string[];
}

const RANKS: Resource[] = ['ORI', 'USB', 'USA'];

export interface BotOptions {
  maxDays?: number;
  gender?: 'M' | 'F';
  variable?: boolean;
  /** continua um jogo já existente (ex.: carregado de um save) em vez de criar um novo */
  game?: Game;
  /** para antes do próximo passo quando devolver true (ex.: para gravar um save numa fase) */
  stopWhen?: (g: Game) => boolean;
}

export function playBot(c: Content, profile: BotProfile, seed: number, opts: BotOptions = {}): BotResult {
  const rng = new Rng(seed * 7 + 13);
  const g = opts.game ?? Game.create(c, { gender: opts.gender ?? 'M', difficulty: 'padrao', seed, variable: opts.variable });
  const errors: string[] = [];
  const moneyByDay: number[] = [];
  const maxDays = opts.maxDays ?? 20;
  let guard = 0;
  try {
    while (guard++ < 200) {
      const st = g.st;
      if (st.phase === 'gameover' || st.phase === 'final') break;
      if (opts.stopWhen?.(g)) break;
      if (st.phase === 'jornal') {
        g.newspaper();
        if (st.day > maxDays) break;
        g.beginShift();
        continue;
      }
      if (st.phase === 'plantao') {
        playShift(g, profile, rng, errors);
        continue;
      }
      if (st.phase === 'relatorio') {
        const f = g.reportField();
        if (f) {
          const opts = f.options.filter((o) => !o.when || o.when(g.ctx()));
          const idx = pickChoice(st, opts.map((o, i) => ({ idx: i, choice: { label: o.label, effect: o.effect } as Choice })), profile, rng);
          g.chooseReportField(opts[idx]?.id ?? f.options[0].id);
        }
        g.mourn();
        moneyByDay.push(st.money);
        g.toHome();
        continue;
      }
      if (st.phase === 'casa') {
        playHome(g, profile, rng, opts.stopWhen);
        if (g.st.day > maxDays && g.st.phase === 'jornal') break;
        continue;
      }
    }
    if (g.st.phase === 'final' && !g.st.ending) g.decideChair(profile.ethic === 'bom' ? 'recusar' : profile.ethic === 'pragmatico' ? 'assinar' : rng.chance(0.5) ? 'assinar' : 'recusar');
  } catch (e) {
    errors.push(`EXCEÇÃO dia ${g.st.day} fase ${g.st.phase}: ${(e as Error).stack ?? e}`);
  }
  const st = g.st;
  return {
    profile: profile.name,
    seed,
    daysPlayed: st.history.length,
    ending: st.ending?.kind,
    gameOver: st.gameOver?.kind,
    money: st.money,
    moneyByDay,
    vars: { ...st.vars },
    keys: Object.values(st.keys).filter((k) => k === 'salvo').length,
    warnings: st.totals.warnings,
    notes: st.totals.notes,
    deaths: st.totals.deaths,
    handled: st.totals.handled,
    bicos: st.totals.bicos,
    errors,
  };
}

function playShift(g: Game, p: BotProfile, rng: Rng, errors: string[]) {
  const sh = g.shift!;
  let steps = 0;
  let thinkLeft = 0;
  let decided = false;
  let coffeeTaken = 0;
  while (g.st.phase === 'plantao' && steps++ < 20000) {
    if (g.scene) {
      const ch = g.scene.choices().filter((x) => !x.disabled);
      const node = g.scene.sc.nodes[g.scene.node];
      if (ch.length) g.sceneChoose(pickChoice(g.st, ch.map((x) => ({ idx: x.idx, choice: node?.choices?.[x.idx] })), p, rng, g.scene.sc.nodes));
      else g.sceneContinue();
      continue;
    }
    const s = sh.sh;
    // modais
    for (const m of [...s.modals]) sh.ackModal(m.id, m.options?.[0]?.id);
    // pedidos de rádio: escolhe a primeira opção (geralmente a proativa)
    for (const r of [...s.requests]) sh.answerRequest(r.id, r.options[0].id);
    // minijogo
    if (s.guideCallId) {
      const q = Math.max(0, Math.min(1, p.guideQuality + (rng.next() - 0.5) * 0.2));
      sh.finishGuide(q, q > 0.5);
      continue;
    }
    if (coffeeTaken < p.coffee && s.time > 600) {
      sh.coffee();
      coffeeTaken++;
    }
    // sem dormir: pálpebras pesando (quem é atento reage a tempo)
    if (s.cochilo && rng.chance(p.accuracy)) sh.acordar();
    // objetos da mesa: a foto da família uma vez por plantão; o diário quando o cansaço aperta
    if (!s.photoUsed && s.time > 540 && g.st.vars.desgaste > 15) sh.photo();
    if (!s.diaryRead && g.st.vars.desgaste > 70) sh.readDiary();
    // post-it vermelho na fila: segura a ligação atual (se ainda não decidiu e ela não é urgente) e atende
    if (s.activeId && !decided && p.inspects) {
      const cur = s.calls[s.activeId];
      const urgent = sh.queue().find((x) => x.noteUrgent && x.id !== cur.id);
      if (urgent && !cur.noteUrgent && cur.status === 'ativa') {
        sh.hold();
        sh.answer(urgent.id);
        thinkLeft = rng.int(p.think[0], p.think[1]);
        decided = false;
      }
    }
    if (!s.activeId) {
      const q = sh.queue();
      if (q.length) {
        // prioriza post-its vermelhos, depois retornos e âncoras
        const pick = q.find((x) => x.noteUrgent) ?? q.find((x) => x.followOf) ?? q.find((x) => sh.defOf(x).anchor) ?? q[0];
        sh.answer(pick.id);
        thinkLeft = rng.int(p.think[0], p.think[1]);
        decided = false;
      }
    } else if (!decided) {
      const call = s.calls[s.activeId];
      if (thinkLeft <= 0) {
        decided = true;
        try {
          decide(sh, call, p, rng, g.st.day);
        } catch (e) {
          errors.push(`Dia ${g.st.day} ${call.def}: ${(e as Error).message}`);
          sh.hold();
        }
      }
    }
    g.tick(250); // o motor limita cada passo a 0,25 s reais
    thinkLeft -= 0.25;
    if (s.ended) break;
  }
  if (steps >= 20000) errors.push(`Dia ${g.st.day}: plantão não terminou`);
}

function decide(sh: Game['shift'] & {}, call: CallRT, p: BotProfile, rng: Rng, day: number) {
  const def = sh.defOf(call);
  const t: TruthDef = sh.truthOf(call);
  // videochamada: quem desconfia usa em trote, minimizador e exagerado (até acabar a franquia)
  if (p.inspects && sh.videoView(call).canStart && (def.type === 'trotista' || def.type === 'minimizador' || def.type === 'exagerador') && rng.chance(0.6)) {
    const r = sh.startVideo();
    if (r === 'conectou') {
      for (const spot of sh.videoView(call).spots.slice(0, 2)) sh.videoLook(spot.id);
      sh.endVideo();
    }
    if (!sh.active() || sh.active()!.id !== call.id) return; // desligou
  }
  // perguntas obrigatórias + algumas extras
  for (const q of t.must ?? []) sh.ask(q);
  const qs = sh.questions(call).filter((q) => !q.asked && q.group !== 'acalmar' && q.id !== 'callback');
  for (let i = 0; i < p.questions && qs.length; i++) {
    const q = qs.splice(rng.int(0, qs.length - 1), 1)[0];
    sh.ask(q.id);
  }
  if (p.inspects) {
    sh.lookup();
  }
  if (!sh.active() || sh.active()!.id !== call.id) return; // desligou
  if (def.special === 'mci' && def.mci) {
    const triage: Record<string, Color | 'preto'> = {};
    const alloc: Record<string, string> = {};
    const usa = sh.availableUnits('USA').map((u) => u.id);
    const usb = sh.availableUnits('USB').map((u) => u.id);
    for (const v of def.mci.victims) {
      const right = rng.next() < p.accuracy;
      triage[v.id] = right ? v.cor : v.cor === 'vermelho' ? 'amarelo' : 'verde';
      if (triage[v.id] === 'vermelho') alloc[v.id] = usa.shift() ?? 'reforco';
      else if (triage[v.id] === 'amarelo') alloc[v.id] = usb.shift() ?? 'reforco';
      else alloc[v.id] = 'upa';
    }
    sh.mciSubmit(triage, alloc, true);
    return;
  }
  if (def.impedimento && p.accuracy >= 1) {
    sh.declareImpediment();
    return;
  }
  // casos vermelhos costumam ser óbvios: o erro se concentra na fronteira amarelo/verde
  const errP = (1 - p.accuracy) * (t.sev === 'vermelho' ? 0.4 : 1.15);
  const right = rng.next() >= errP;
  let res: Resource = t.best ?? t.ok[0];
  if (!right) {
    if (t.sev === 'trote') res = rng.chance(0.5) ? 'ORI' : 'USB';
    else {
      const i = RANKS.indexOf(res);
      const up = i < RANKS.length - 1 ? RANKS[i + 1] : undefined;
      const down = i > 0 ? RANKS[i - 1] : undefined;
      res = (up && (!down || rng.chance(p.overBias)) ? up : down) ?? res;
    }
  }
  const color: Color = colorFor(t.sev);
  // esquecer o apoio ou errar o hospital são erros independentes (e mais raros)
  const supOk = rng.next() >= (1 - p.accuracy) * 0.5;
  const destOk = rng.next() >= (1 - p.accuracy) * 0.6;
  const support: Support[] = supOk ? [...(t.sup ?? [])] : [];
  let dest: Dest | undefined;
  if ((res === 'USA' || res === 'USB') && day >= 9) dest = destOk ? t.dest?.[0] ?? (t.sev === 'vermelho' ? 'REG' : 'UPA') : t.sev === 'vermelho' ? 'UPA' : 'REG';
  let unit: string | undefined;
  if (res === 'USA' || res === 'USB') {
    const free = sh.availableUnits(res);
    if (!free.length) {
      // sem viatura do tipo: tenta a outra
      const other: Resource = res === 'USA' ? 'USB' : 'USA';
      const f2 = sh.availableUnits(other);
      if (!f2.length) {
        res = 'ORI';
      } else {
        res = other;
        unit = f2.sort((a, b) => sh.etaFor(a.id, call) - sh.etaFor(b.id, call))[0].id;
      }
    } else unit = free.sort((a, b) => sh.etaFor(a.id, call) - sh.etaFor(b.id, call))[0].id;
  }
  const r = sh.stamp({ color, resource: res, unit, support, dest: res === 'USA' || res === 'USB' ? dest ?? 'REG' : undefined, referral: res === 'ORI' ? t.ref?.[0] ?? 'UBS' : undefined });
  if (!r.ok) throw new Error('carimbo falhou: ' + r.error);
}

/** escolhe uma opção de cena simulando o efeito num clone do estado */
function pickChoice(st: GameState, opts: { idx: number; choice?: Choice }[], p: BotProfile, rng: Rng, nodes?: Record<string, SceneNode>): number {
  if (p.ethic === 'neutro' || opts.length === 1) return rng.pick(opts).idx;
  let best = opts[0].idx;
  let bestScore = -Infinity;
  for (const o of opts) {
    const clone = JSON.parse(JSON.stringify(st)) as GameState;
    try {
      const e = makeEffCtx(clone, {});
      o.choice?.effect?.(e);
      // o efeito costuma estar no nó seguinte (onEnter): simula também
      const nx = o.choice?.next ? nodes?.[o.choice.next] : undefined;
      nx?.onEnter?.(e);
    } catch {
      /* efeitos que dependem do turno: ignora */
    }
    const d = (k: keyof GameState['vars']) => clone.vars[k] - st.vars[k];
    const dm = clone.money - st.money;
    const score =
      p.ethic === 'bom'
        ? d('integridade') * 4 + d('lacos') * 2 + d('humanidade') * 2 + d('lealSimone') * 0.5 - d('desgaste') * 0.1 + Math.min(0, dm) * 0.004
        : dm * 0.01 + d('lacos') * 1 - d('desgaste') * 0.1;
    if (score > bestScore + 1e-9) {
      bestScore = score;
      best = o.idx;
    }
  }
  return best;
}

function playHome(g: Game, p: BotProfile, rng: Rng, stop?: (g: Game) => boolean) {
  const h = g.home!;
  let guard = 0;
  while (g.st.phase === 'casa' && guard++ < 300) {
    if (stop?.(g)) return;
    const step = g.st.home?.step;
    if (step === 'pre' || step === 'cena') {
      const ch = h.choices();
      if (ch.length) {
        const ok = ch.filter((x) => !x.disabled);
        // conecta inconsistências quando há
        if (p.inspects && h.inspectAvailable()) {
          const sc = h.scene();
          for (const l of sc?.inspect?.links ?? []) h.link(l.a, l.b);
        }
        const n = h.node();
        const withLink = ok.find((x) => !!n?.choices?.[x.idx]?.needLink);
        const pick = withLink ? withLink.idx : ok.length ? pickChoice(g.st, ok.map((x) => ({ idx: x.idx, choice: n?.choices?.[x.idx] })), p, rng, h.scene()?.nodes) : ch[0].idx;
        h.choose(pick);
      } else h.continueScene();
      continue;
    }
    if (step === 'intervencao') {
      const fs = h.fieldSim();
      if (fs) autoPlayField(fs, p.accuracy, rng);
      h.finishField();
      continue;
    }
    if (step === 'escolha') {
      // olha as contas que vêm depois da folga (o jogador vê o saldo e sabe o que deve)
      const due = h.bills().reduce((a, b) => a + b.amount, 0);
      const k = g.st.money - due < p.bicoBelow && h.canBico() && g.st.vars.desgaste < 45 ? 'bico' : g.st.vars.desgaste > 45 ? 'descanso' : 'familia';
      h.chooseTimeOff(k);
      continue;
    }
    if (step === 'contas') {
      const bills = h.bills();
      const order = ['aluguel_atrasado', 'aluguel', 'remedios', 'alimentacao', 'religacao', 'energia', 'gas'];
      const chosen: string[] = [];
      let budget = g.st.money - bills.filter((b) => b.auto).reduce((a, b) => a + b.amount, 0);
      for (const id of [...order, ...bills.filter((b) => b.kind === 'evento').map((b) => b.id)]) {
        const b = bills.find((x) => x.id === id && !x.auto);
        if (b && b.amount <= budget) {
          chosen.push(b.id);
          budget -= b.amount;
        }
      }
      const r = h.payBills(chosen);
      if (!r.ok) h.payBills([]);
      continue;
    }
    if (step === 'loja') {
      for (const it of h.shop()) {
        if (it.owned) continue;
        const want = ['bombinha', 'isopor', 'curativo'].includes(it.id) || (it.id === 'conserto' && g.st.money > it.priceN + 300) || (it.id === 'maquina' && g.st.money > 650);
        if (want && g.st.money >= it.priceN) h.buy(it.id);
      }
      g.finishHome();
      continue;
    }
    g.finishHome();
  }
  void rng;
}
