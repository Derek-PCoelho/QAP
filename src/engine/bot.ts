// Jogador automático: testes de ponta a ponta e simulação de balanceamento
// (perfis Lento / Médio / Experiente da planilha do documento de design).
import type { Content } from './content-api';
import type { Resource, Color, Support, Dest, TruthDef, CallRT, GameState, Choice, SceneNode } from './types';
import { makeEffCtx } from './state';
import { Game } from './game';
import { Rng, hashString } from './util';
import { colorFor } from './grading';
import { autoPlayField } from './field';
import { VIDEO_UNRELIABLE } from './video';

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
  /** usa o mapa/vídeo e repara nos objetos da casa */
  inspects: boolean;
  /** qualidade média nos minijogos */
  guideQuality: number;
  /** atende a família no dia 9 com USA (favorecimento) */
  favorFamily?: boolean;
  /** quando erra, chance de errar para mais (excesso) em vez de para menos */
  overBias: number;
  /** como escolhe nas cenas: 'bom' (protege família e integridade), 'neutro' (sorteia), 'pragmatico' (dinheiro primeiro) */
  ethic: 'bom' | 'neutro' | 'pragmatico';
  /** 1.1: horários (minutos do relógio) em que toma cada café */
  coffeeAt?: number[];
  /** 1.1: chance de pedir vídeo quando quem liga não é confiável (exagera, minimiza, trota, não sabe) */
  video?: number;
  /** 1.1: chance de pedir vídeo num post-it vermelho ("pega essa") */
  videoUrgent?: number;
  /** 1.1: vídeos guardados para os casos duvidosos (não usa no post-it vermelho abaixo disso) */
  videoKeep?: number;
  /** 1.1: chance de escolher o argumento que responde à objeção na vaga zero */
  vzSkill?: number;
  /** 1.1: chance de passar ao Peixoto quando o botão acende e o Saulo empacou */
  peixoto?: number;
  /** 1.1: chance de escolher uma pergunta que muda a conduta (a caixa certa) em vez de uma ao acaso */
  askSkill?: number;
}

// 1.1: os perfis usam café, vídeo e vaga zero do jeito de cada um (docs/BALANCEAMENTO.md).
//  · Lento: um café no meio da manhã, vídeo de vez em quando com quem liga e não é confiável,
//    argumenta meio no escuro e quase nunca lembra do Peixoto;
//  · Médio: dois cafés (manhã e tarde), vídeo na maioria dos casos duvidosos, argumenta bem;
//  · Experiente: dois cafés na hora do aperto, vídeo onde rende, argumentos certos, Peixoto quando precisa;
//  · Oráculo: referência (não precisa de café).
export const PROFILES: Record<string, BotProfile> = {
  lento: { name: 'Lento', accuracy: 0.75, think: [80, 120], questions: 4, coffee: 1, coffeeAt: [600], bicoBelow: 60, inspects: false, guideQuality: 0.55, overBias: 0.75, ethic: 'neutro', video: 0.5, videoUrgent: 0.5, videoKeep: 0, vzSkill: 0.55, peixoto: 0.4, askSkill: 0.5 },
  medio: { name: 'Médio', accuracy: 0.86, think: [40, 60], questions: 3, coffee: 2, coffeeAt: [600, 900], bicoBelow: 40, inspects: true, guideQuality: 0.75, overBias: 0.6, ethic: 'neutro', video: 0.7, videoUrgent: 0.5, videoKeep: 1, vzSkill: 0.72, peixoto: 0.8, askSkill: 0.7 },
  experiente: { name: 'Experiente', accuracy: 0.95, think: [35, 50], questions: 2, coffee: 2, coffeeAt: [570, 960], bicoBelow: 0, inspects: true, guideQuality: 0.92, overBias: 0.5, ethic: 'bom', video: 0.9, videoUrgent: 0.7, videoKeep: 1, vzSkill: 0.9, peixoto: 1, askSkill: 0.9 },
  oraculo: { name: 'Oráculo', accuracy: 1, think: [15, 25], questions: 1, coffee: 0, bicoBelow: -999, inspects: true, guideQuality: 1, overBias: 0.5, ethic: 'bom', video: 1, videoUrgent: 0, videoKeep: 3, vzSkill: 1, peixoto: 1, askSkill: 1 },
};

/**
 * Perfis de comparação (fora da tabela principal; `npm run simulate -- 150 --extra`):
 * o mesmo Médio, só que sem gerir recursos — não toma café, não pede vídeo, argumenta ao acaso
 * na vaga zero, não lembra do Peixoto e pergunta ao acaso (como os bots da 1.0.4).
 */
export const EXTRA_PROFILES: Record<string, BotProfile> = {
  medio_sem: { ...PROFILES.medio, name: 'Médio sem recursos', coffee: 0, coffeeAt: [], video: 0, videoUrgent: 0, vzSkill: 0, peixoto: 0, askSkill: 0 },
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
  /** 1.1: uso de recursos na campanha */
  res: { coffee: number; videos: number; vz: number; vzOk: number; vzPeixoto: number; vzFail: number; saulo: number };
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
    res: {
      coffee: st.totals.coffee,
      videos: Number(st.flags['videos_total']) || 0,
      vz: Number(st.flags['vz_total']) || 0,
      vzOk: Number(st.flags['vz_aceitas']) || 0,
      vzPeixoto: Number(st.flags['vz_peixoto_total']) || 0,
      vzFail: Number(st.flags['vz_recusadas']) || 0,
      saulo: Number(st.flags['saulo_confianca']) || 0,
    },
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
    // 1.1: vaga zero aberta (o relógio está parado)
    if (s.vz) {
      playVagaZero(sh, p, rng);
      continue;
    }
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
    // café na hora do perfil (com noite em claro, o primeiro vai logo cedo)
    const at = p.coffeeAt?.[coffeeTaken] ?? 600;
    if (coffeeTaken < p.coffee && (s.time >= at || (s.semSono && coffeeTaken === 0 && s.time > 450))) {
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
  // 1.1: videochamada onde ela resolve — quem liga não é confiável (a conversa engana) ou o post-it
  // diz que é grave (o vídeo responde respira/pele/acordado de uma vez). A última fica guardada para o duvidoso.
  const unreliable = VIDEO_UNRELIABLE.has(def.type);
  let viu = false;
  const vv = sh.videoView(call);
  const wantVideo = vv.canStart && (unreliable ? rng.chance(p.video ?? 0) : !!call.noteUrgent && vv.credits > (p.videoKeep ?? 1) && rng.chance(p.videoUrgent ?? 0));
  if (wantVideo) {
    const r = sh.startVideo();
    if (r === 'conectou') {
      viu = true;
      for (const spot of sh.videoView(call).spots.slice(0, unreliable ? 1 : 0)) sh.videoLook(spot.id);
      sh.endVideo();
    }
    if (!sh.active() || sh.active()!.id !== call.id) return; // desligou
  }
  // perguntas obrigatórias + algumas extras (quem pergunta bem escolhe a caixa certa)
  for (const q of t.must ?? []) sh.ask(q);
  const qs = sh.questions(call).filter((q) => !q.asked && q.group !== 'acalmar' && q.id !== 'callback' && !q.box?.includes('outros'));
  for (let i = 0; i < p.questions && qs.length; i++) {
    const rel = qs.filter((q) => sh.relevantQuestion(call, q.id));
    const pool = rel.length && rng.chance(p.askSkill ?? 0) ? rel : qs;
    const q = pool[rng.int(0, pool.length - 1)];
    qs.splice(qs.indexOf(q), 1);
    sh.ask(q.id);
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
  // 1.1: o vídeo tira a dúvida — com quem engana e no caso grave (a cor, a respiração), quase toda;
  // nos outros, um pouco
  const errP = (1 - p.accuracy) * (t.sev === 'vermelho' ? 0.4 : 1.15) * (viu ? (unreliable || t.sev === 'vermelho' ? 0.25 : 0.8) : 1);
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

/** 1.1: a negociação da vaga zero, do jeito do perfil */
function playVagaZero(sh: Game['shift'] & {}, p: BotProfile, rng: Rng) {
  const vz = sh.sh.vz!;
  if (vz.state === 'fim') {
    sh.vzClose();
    return;
  }
  const stuck = vz.state === 'impasse' || !!vz.birra || (vz.floor > 0 && vz.resistance <= vz.floor) || vz.resistance >= 3;
  if (vz.peixoto === 'aceso' && stuck && rng.chance(p.peixoto ?? 0)) {
    sh.vzPeixoto();
    return;
  }
  if (vz.state === 'impasse') {
    if (!vz.precisa && rng.chance(p.vzSkill ?? 0)) sh.vzDesviar();
    else sh.vzDesistir();
    return;
  }
  const info = vz.cards.map((c) => ({ id: c.id, ...(sh.vzCardInfo(c.id) ?? { kind: 'meio' as const, tag: undefined }) }));
  const good = info.filter((c) => (vz.precisa ? c.kind === 'bom' && c.tag !== 'desvio' && c.tag !== 'mentira' : c.tag === 'desvio' || (c.kind === 'bom' && c.tag !== 'mentira')));
  const pick = good.length && rng.chance(p.vzSkill ?? 0) ? rng.pick(good) : info.length ? rng.pick(info) : undefined;
  if (!pick || !sh.vzChoose(pick.id)) sh.vzTimeout();
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
        // repara nos objetos marcados da cena (libera as escolhas que dependem deles)
        if (p.inspects) for (const o of h.noticeables()) if (!o.noticed) h.notice(o.id);
        const ch2 = h.choices();
        if (ch2.length !== ch.length) continue;
        const n = h.node();
        const withLink = ok.find((x) => !!n?.choices?.[x.idx]?.needLink);
        const pick = withLink ? withLink.idx : ok.length ? pickChoice(g.st, ok.map((x) => ({ idx: x.idx, choice: n?.choices?.[x.idx] })), p, rng, h.scene()?.nodes) : ch[0].idx;
        h.choose(pick);
      } else h.continueScene();
      continue;
    }
    if (step === 'intervencao') {
      const fs = h.fieldSim();
      // gerador isolado para a noite: jogar a Intervenção não reembaralha o sorteio do resto da campanha
      if (fs) autoPlayField(fs, p.accuracy, new Rng(hashString(`${g.st.seed}:bot-noite:${g.st.day}`)));
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
