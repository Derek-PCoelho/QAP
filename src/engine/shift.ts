// =============================================================================
// Simulação do plantão: relógio, fila, frota, perguntas, inconsistências,
// carimbo, rádio, pedidos de mão dupla, piora dinâmica, revelações e relatório.
// =============================================================================
import type {
  GameState, ShiftState, CallRT, CallDef, TruthDef, Decision, UnitState, Resource, LineIn, SchedEvent,
  RadioKind, Dest, Verdict, ReportItem, LinkDef, ExtraQ, Ctx, EffCtx, TimelineDef, UnitStatus, ModalMsg,
  PendingRequest, Color, Support, Referral, AnswerIn, CallOutcome, DayDef, RegId, TarmShiftState, ShownLine, BoxId, OutrosAct,
} from './types';
import type { Content } from './content-api';
import { callBox, extraBox, noteBoxFor, simoneBox } from './categories';
import { hasBleep } from './bleep';
import { makeCtx, makeEffCtx, randOf, simoneAccuracy, VAR_LABEL, recordIncome } from './state';
import { hm, fmtTime, clamp, Rng, hashString } from './util';
import { normLines, txt, cluesIn, resolveTokens, stripMarkup, beneForm } from './text';
import { resolveAddress, landmarkPos, destLandmark, addrText, type AddrResult } from './city/map';
import { route, addressTarget, type FloodMode } from './city/path';
import { grade, colorFor, decisionLabel, NOTE_COST, WARNING_COST } from './grading';
import { buildGeneratedCall } from './generator';
import { videoBudget, videoEnabled, videoView, startVideo, videoLook, videoWide, endVideo, videoProofOnStamp, type VideoView, type VideoStartResult } from './video';

export const SHIFT_START = hm('07:00');
export const SHIFT_END = hm('19:00');
export const FIXED_PAY = 160;
/** multiplicador das janelas de risco por dificuldade (ver riskScale) */
export const RISK_SCALE: Record<string, number> = { narrativo: 1.3, padrao: 1.1, real: 0.9 };
/** a conversa antes da decisão conta para a janela de risco neste ritmo (ver riskElapsed) */
export const CALL_RISK_RATE = 0.3;
export const BONUS_CAP = 160;
export const PRODUCTIVITY_BONUS = 30;
export const COST_USA = 1850;
export const COST_USB = 720;

export type ShiftEvent =
  | { type: 'ring'; callId: string }
  | { type: 'answer'; callId: string }
  | { type: 'lines'; callId: string }
  | { type: 'radio'; msg: { from: string; text: string; kind: RadioKind } }
  | { type: 'stamp'; callId: string; resource: Resource }
  | { type: 'penalty'; kind: 'nota' | 'advertencia'; text: string }
  | { type: 'money'; amount: number; reason: string }
  | { type: 'death'; callId: string; name: string }
  | { type: 'saved'; callId: string; name: string }
  | { type: 'request'; id: string }
  | { type: 'modal'; id: string }
  | { type: 'guide'; callId: string; start: boolean }
  | { type: 'phantom' }
  | { type: 'hangup'; callId: string }
  | { type: 'gameover'; kind: string }
  | { type: 'end' }
  | { type: 'var'; name: string; delta: number }
  | { type: 'unit'; id: string; status: UnitStatus }
  | { type: 'verdict'; callId: string; kind: Verdict['kind']; sev: TruthDef['sev'] }
  | { type: 'pass'; callId: string; to: RegId };

/** perguntas que a TARM faz (campanha da Simone) */
export const TARM_QUESTIONS = ['oque', 'consciencia', 'respira', 'idade', 'referencia', 'callback'];
export const REG_LABEL: Record<RegId, string> = { moura: 'Mesa 1', henrique: 'Mesa 2 · Henrique' };

export interface QuestionView {
  id: string;
  label: string;
  cost: number;
  group: 'base' | 'protocolo' | 'ferramenta' | 'especifica' | 'confronto' | 'fala' | 'acalmar';
  asked: boolean;
  hint?: string;
  /** uma das cinco perguntas fixas */
  fixed?: boolean;
  /** caixas em que aparece (sem fixed e sem box: ferramenta/confronto, sempre à vista) */
  box?: BoxId[];
}

const RANK: Record<string, number> = { ORI: 0, USB: 1, USA: 2 };

export class ShiftSim {
  st: GameState;
  c: Content;
  day: DayDef;
  sh: ShiftState;
  listeners: ((e: ShiftEvent) => void)[] = [];
  private genDefs = new Map<string, CallDef>();
  /** escala base: minutos de jogo por segundo real */
  baseScale = 1;
  realClock = 0;
  paused = false;
  private inlineReqs = new Map<string, import('./types').TimelineOption[]>();
  /** opções de recados abertos por scripts (c.modal com opções) */
  private inlineModals = new Map<string, import('./types').TimelineOption[]>();

  constructor(st: GameState, c: Content, resume?: boolean, dayDef?: DayDef) {
    this.st = st;
    this.c = c;
    this.day = dayDef ?? c.days[st.day];
    this.baseScale = st.difficulty === 'narrativo' ? 0.62 : 1;
    if (resume && st.shift) {
      this.sh = st.shift;
      // regenera ligações procedurais
      for (const call of Object.values(this.sh.calls)) if (call.gen) this.genDefs.set(call.id, buildGeneratedCall(this.c, call.gen, call.id, this.sh.day));
    } else {
      this.sh = this.fresh();
      st.shift = this.sh;
      if (this.tarm) this.sh.tarm = ShiftSim.freshTarm();
      this.setup();
    }
  }

  /** campanha da Simone: a jogadora é a TARM e a regulação é feita pela IA (o mundo roda num estado-sombra) */
  get tarm(): boolean {
    return this.st.mode === 'simone';
  }

  static freshTarm(): TarmShiftState {
    return {
      regs: {
        moura: { queue: [], busyUntil: 0, decided: 0, errors: 0 },
        henrique: { queue: [], busyUntil: 0, decided: 0, errors: 0 },
      },
      passed: 0,
      handleSum: 0,
      log: [],
    };
  }

  on(f: (e: ShiftEvent) => void) {
    this.listeners.push(f);
    return () => {
      this.listeners = this.listeners.filter((x) => x !== f);
    };
  }
  emit(e: ShiftEvent) {
    for (const l of this.listeners) l(e);
  }

  // ---------------------------------------------------------------------------
  // contexto
  // ---------------------------------------------------------------------------
  ctx(): Ctx {
    return makeCtx(this.st);
  }
  eff(): EffCtx {
    return makeEffCtx(this.st, {
      onVar: (v, d, reason) => {
        if (this.tarm) return;
        this.toast(`${VAR_LABEL[v]} ${d > 0 ? '+' : ''}${d}${reason ? ' · ' + reason : ''}`, v === 'desgaste' ? (d > 0 ? 'ruim' : 'bom') : d > 0 ? 'bom' : 'ruim');
        this.emit({ type: 'var', name: v, delta: d });
        if (v === 'desgaste' && this.st.vars.desgaste >= 100) this.gameOver('colapso');
      },
      onMoney: (a, r) => {
        if (this.tarm) return;
        this.toast(`${a >= 0 ? '+' : '−'}R$ ${Math.abs(a)} · ${r}`, 'dinheiro');
        this.emit({ type: 'money', amount: a, reason: r });
      },
      onToast: (t) => this.toast(t.text, t.kind),
      onAchievement: (id) => this.toast(`Conquista: ${this.c.achievements.find((a) => a.id === id)?.name ?? id}`, 'bom'),
    });
  }
  toast(text: string, kind: 'bom' | 'ruim' | 'info' | 'dinheiro' = 'info', force = false) {
    // na campanha da Simone, os avisos do regulador não aparecem para a TARM
    if (this.tarm && !force) return;
    this.sh.toasts.push({ id: ++this.sh.toastSeq, text: resolveTokens(text, this.st.gender, this.st), kind, t: this.sh.time });
    if (this.sh.toasts.length > 30) this.sh.toasts.splice(0, this.sh.toasts.length - 30);
  }

  // ---------------------------------------------------------------------------
  // montagem do dia
  // ---------------------------------------------------------------------------
  private fresh(): ShiftState {
    return {
      day: this.st.day,
      time: SHIFT_START,
      start: SHIFT_START,
      end: SHIFT_END,
      calls: {},
      order: [],
      pending: [],
      seq: 0,
      units: {},
      radio: [],
      radioSeq: 0,
      requests: [],
      modals: [],
      warnings: 0,
      notes: 0,
      bonus: 0,
      bonusRaw: 0,
      deductions: 0,
      usaSent: 0,
      dispatches: 0,
      handled: 0,
      deaths: [],
      saves: [],
      coffee: 0,
      coffeeUntil: 0,
      photoUsed: false,
      diaryRead: false,
      simoneAway: false,
      report: [],
      ended: false,
      closing: false,
      regTimes: [],
      goldenCount: 0,
      phantomSeq: 0,
      phantoms: [],
      flags: {},
      noVacancy: !!this.day?.noVacancy,
      flood: !!this.day?.flood,
      costToday: 0,
      toasts: [],
      toastSeq: 0,
      peixotoCalls: 0,
      sindicancias: 0,
      video: { credits: videoEnabled(this) ? this.c.video?.credits ?? 0 : 0, used: 0, proofs: 0, minutes: 0 },
    };
  }

  private setup() {
    const sh = this.sh;
    const c = this.ctx();
    // frota do dia
    const active = this.day.fleet ? this.day.fleet(c) : this.c.fleetForDay(this.st);
    for (const spec of this.c.fleet) {
      if (!active.includes(spec.id)) continue;
      const pos = landmarkPos(spec.base);
      sh.units[spec.id] = {
        id: spec.id,
        type: spec.type,
        label: spec.label,
        base: spec.base,
        crew: spec.crew,
        radioName: spec.radioName,
        status: 'QRV',
        pos: [pos[0], pos[1]],
        path: [],
        t0: 0,
        t1: 0,
      };
    }
    // ligações
    let variantIdx = 0;
    for (const def of this.day.calls) {
      if (def.when && !def.when(c)) continue;
      // a ligação sobre a própria Simone não existe na campanha dela
      if (this.tarm && def.special === 'simone') continue;
      let id = def.id;
      let gen: CallRT['gen'];
      if ((this.st.variable || def.genOnly) && def.pool && !def.anchor) {
        const g = this.pickVariant(def, variantIdx++, !!def.genOnly);
        if (g) {
          gen = g.gen;
          id = g.id;
          this.genDefs.set(id, g.def);
        }
      }
      this.addCall(id, def.id, hm(gen ? def.at : def.at), gen);
    }
    // linha do tempo
    // a condição (when) é avaliada na hora do evento, não no começo do turno
    (this.day.timeline ?? []).forEach((t, i) => {
      this.schedule(hm(t.at), 'timeline', t.id ?? `tl${i}`, { idx: i });
    });
    // toques fantasmas (desgaste alto)
    if (this.st.vars.desgaste > 80) this.schedule(SHIFT_START + 40 + Math.floor(randOf(this.st) * 60), 'phantom', 'ph');
    // noite em claro na Intervenção: três cochilos ao longo do dia (o café segura por 2 h).
    // Noites seguidas pioram: cinco cochilos na segunda, sete a partir da terceira, e menos tempo para reagir.
    if (this.st.flags['noite_em_claro']) {
      delete this.st.flags['noite_em_claro'];
      if (this.st.mode === 'campanha') {
        const n = Math.max(1, Number(this.st.flags['noites_seguidas']) || 1);
        sh.semSono = true;
        sh.noites = n;
        sh.cochilos = 0;
        const bases = n <= 1 ? [120, 330, 540] : n === 2 ? [90, 200, 310, 420, 530] : [70, 155, 240, 325, 410, 495, 580];
        const spread = n <= 1 ? 90 : 60;
        for (const base of bases) this.schedule(SHIFT_START + base + Math.floor(randOf(this.st) * spread), 'cochilo', 'zz');
        this.schedule(SHIFT_START + 1, 'notice', 'sem_sono');
      }
    } else delete this.st.flags['noites_seguidas'];
    this.schedule(SHIFT_END, 'endShift', 'end');
    this.radio('SISTEMA', `Plantão iniciado. Frota: ${Object.values(sh.units).map((u) => u.label).join(' · ')}.`, 'info');
    // piloto de videochamada: aviso no primeiro dia (no primeiro minuto do relógio, depois da passagem de turno)
    const vi = this.c.video;
    if (vi?.intro && this.st.mode === 'campanha' && this.st.day === vi.fromDay) this.schedule(SHIFT_START + 1, 'notice', 'video_intro');
    // 1.1: almoço com a equipe (a cena é aberta pelo Game: relógio parado, fila congelada)
    if (this.day.almoco && this.st.mode === 'campanha') this.schedule(hm(this.day.almocoAt ?? '13:00'), 'notice', 'almoco');
  }

  /** grupos de modelo (`TemplateDef.once`) já sorteados neste plantão: um folgado por plantão */
  private onceUsed = new Set<string>();

  private pickVariant(def: CallDef, idx: number, force = false) {
    const tags = def.pool!.split(',').map((t) => t.trim());
    const day = this.st.day;
    const pool = this.c.bank.filter(
      (t) =>
        t.tags.some((x) => tags.includes(x)) &&
        (t.minDay ?? 1) <= day &&
        // 1.1: dias proibidos (campanha) e "um por plantão" (folgados)
        !(this.st.mode === 'campanha' && t.notDays?.includes(day)) &&
        !(t.once && this.onceUsed.has(t.once)),
    );
    if (!pool.length) return null;
    const rng = new Rng(hashString(`${this.st.seed}:${this.st.day}:${def.id}:${idx}`));
    if (!force && rng.chance(0.35)) return null; // às vezes mantém a ligação de referência
    // com peso em algum modelo (folgados), sorteio ponderado; sem peso, o sorteio de sempre
    const tpl = pool.some((t) => t.weight !== undefined) ? rng.weighted(pool, (t) => t.weight ?? 1) : rng.pick(pool);
    if (tpl.once) this.onceUsed.add(tpl.once);
    const truths = tpl.truths.filter((t) => (t.minDay ?? 1) <= this.st.day);
    if (!truths.length) return null;
    const tr = rng.weighted(truths, (t) => t.weight ?? 1);
    const gen = {
      template: tpl.id,
      truth: tr.id,
      seed: rng.int(1, 2 ** 30),
      name: '',
      age: 0,
      sex: 'M' as const,
      addr: { rua: '', n: 0, bairro: '' },
      num: '',
      caller: '',
    };
    const id = `${def.id}~${tpl.id}.${tr.id}`;
    const built = buildGeneratedCall(this.c, gen, id, this.st.day, def.at);
    return { id, gen, def: built };
  }

  addCall(id: string, defId: string, at: number, gen?: CallRT['gen']) {
    const call: CallRT = {
      id,
      def: defId,
      day: this.st.day,
      status: 'fila',
      arrived: at,
      realSec: 0,
      lines: [],
      asked: [],
      unlocked: [],
      patience: 100,
      worsenIdx: 0,
      noteRight: true,
      noteText: '',
      units: [],
      outcome: 'pendente',
      calmed: 0,
      holdCount: 0,
      gen,
    };
    // ainda não chegou: fica fora da fila até o evento de chegada
    (call as CallRT & { pendingArrival?: boolean }).pendingArrival = true;
    this.sh.calls[id] = call;
    this.schedule(at, 'arrival', id);
  }

  defOf(call: CallRT | string): CallDef {
    const cl = typeof call === 'string' ? this.sh.calls[call] : call;
    if (cl.gen) {
      let d = this.genDefs.get(cl.id);
      if (!d) {
        d = buildGeneratedCall(this.c, cl.gen, cl.id, cl.day);
        this.genDefs.set(cl.id, d);
      }
      return d;
    }
    const d = this.day.calls.find((x) => x.id === cl.def);
    if (!d) throw new Error('def não encontrada: ' + cl.def);
    return d;
  }

  truthOf(call: CallRT): TruthDef {
    const def = this.defOf(call);
    const base = typeof def.truth === 'function' ? def.truth(this.ctx()) : def.truth;
    if (!call.truthPatch) return base;
    const merged = { ...base, ...call.truthPatch };
    // a piora mudou as decisões aceitas: "melhor" e perguntas obrigatórias da verdade antiga não valem mais
    if (call.truthPatch.ok) {
      if (!call.truthPatch.best && merged.best && !merged.ok.includes(merged.best)) delete merged.best;
      if (!call.truthPatch.must) delete merged.must;
    }
    return merged;
  }

  // ---------------------------------------------------------------------------
  // agenda de eventos
  // ---------------------------------------------------------------------------
  schedule(t: number, kind: SchedEvent['kind'], ref: string, data?: Record<string, unknown>) {
    const ev: SchedEvent = { t, kind, ref, data, seq: ++this.sh.seq };
    const p = this.sh.pending;
    let i = p.length;
    while (i > 0 && (p[i - 1].t > t || (p[i - 1].t === t && p[i - 1].seq > ev.seq))) i--;
    p.splice(i, 0, ev);
  }

  /** minutos de jogo por segundo real agora */
  scale(): number {
    const sh = this.sh;
    let s = this.baseScale;
    if (sh.guideCallId) {
      const g = (sh.flags['guideScale'] as number) ?? 0.3;
      return g;
    }
    return s;
  }

  isBlocked(): boolean {
    return this.sh.modals.some((m) => m.blocking) || this.paused || this.sh.ended || !!this.st.gameOver;
  }

  /** avança pelo relógio real */
  tick(realMs: number) {
    if (this.isBlocked()) return;
    const sh = this.sh;
    // pálpebras fecharam sem o jogador reagir
    // tempo para reagir: 6 min de jogo; 5 na segunda noite seguida; 4 a partir da terceira
    if (sh.cochilo && sh.time - sh.cochilo.at >= Math.max(4, 7 - (sh.noites ?? 1))) this.cochilar();
    const dtSec = Math.min(0.25, realMs / 1000);
    this.realClock += dtSec;
    this.st.playSeconds += dtSec;
    if (sh.activeId) {
      const a = sh.calls[sh.activeId];
      if (a) a.realSec += dtSec;
    }
    if (sh.closing && !sh.activeId && !sh.guideCallId) {
      this.finish();
      return;
    }
    if (sh.pauseUntilReal && this.realClock < sh.pauseUntilReal) return;
    // adiantar: 4× enquanto não houver nada para fazer (qualquer coisa nova desliga)
    if (sh.fast && !this.idle()) sh.fast = false;
    const target = sh.time + dtSec * this.scale() * (sh.fast ? 4 : 1);
    this.processUntil(target);
  }

  /**
   * Idade como a TARM anotou, para a ficha (desde o começo da ligação). Se a resposta escrita
   * para a idade tem uma pista ({{trecho|id}}), a pista vai junto e continua clicável no Modo
   * Inconsistência.
   */
  tarmAge(call: CallRT): { text: string; clue?: string; quoted?: boolean } {
    const def = this.defOf(call);
    const c = this.ctx();
    const a = def.q?.['idade'];
    let raw = '';
    if (a !== undefined) {
      try {
        raw = normLines(typeof a === 'function' ? a(c) : a, c)
          .map((l) => l.text)
          .join(' ');
      } catch {
        raw = '';
      }
    }
    raw = resolveTokens(raw, this.st.gender, this.st);
    const m = raw.match(/\{\{([^|}]*)\|([^}]*)\}\}/);
    if (m) return { text: m[1], clue: m[2], quoted: true };
    const age = def.patient.age;
    if (age === undefined || age === null) return { text: 'idade não informada' };
    if (age < 1) return { text: stripMarkup(raw).replace(/[.\s]+$/, '') || 'bebê', quoted: !!raw };
    return { text: `${age} ${age === 1 ? 'ano' : 'anos'}` };
  }

  /** avanço instantâneo (custo de pergunta, ferramenta etc.) */
  advance(min: number) {
    if (min <= 0) return;
    this.processUntil(this.sh.time + min);
  }

  processUntil(target: number) {
    const sh = this.sh;
    let limit = 2000;
    while (sh.pending.length && sh.pending[0].t <= target && limit-- > 0) {
      const ev = sh.pending.shift()!;
      this.setTime(Math.max(sh.time, ev.t));
      this.handle(ev);
      if (this.st.gameOver || sh.ended) return;
    }
    if (sh.closing) {
      // depois das 19h o relógio continua só enquanto houver ligação ativa
      this.setTime(Math.max(sh.time, Math.min(target, sh.end + 120)));
    } else this.setTime(Math.max(sh.time, target));
    this.checkWorsen();
  }

  /** avança o relógio; o tempo de conversa (antes da decisão) conta para a janela de risco num ritmo menor (ver riskElapsed) */
  private setTime(t: number) {
    const sh = this.sh;
    const dt = t - sh.time;
    if (dt > 0 && sh.activeId) {
      const c = sh.calls[sh.activeId];
      if (c && c.status === 'ativa' && !c.decision) c.talk = (c.talk ?? 0) + dt;
    }
    sh.time = t;
  }

  /**
   * Minutos que contam para a janela de risco até `at`: espera na fila e deslocamento contam
   * inteiros; a conversa antes da decisão conta a CALL_RISK_RATE. Motivo: o relógio do jogo é
   * comprimido (1 s real = 1 min) e uma ligação bem conduzida leva de 60 a 90 minutos de jogo,
   * contra 1 a 3 minutos na vida real. Assim, ser lento custa a fila, não o paciente na linha.
   */
  riskElapsed(call: CallRT, at: number): number {
    const from = call.riskFrom ?? call.arrived;
    return Math.max(0, at - from - (1 - CALL_RISK_RATE) * (call.talk ?? 0));
  }

  private handle(ev: SchedEvent) {
    switch (ev.kind) {
      case 'arrival':
        return this.onArrival(ev.ref);
      case 'hangup':
        return this.onHangup(ev.ref);
      case 'unit':
        return this.onUnit(ev.ref, ev.data as { phase: string; callId?: string });
      case 'timeline':
        return this.onTimeline(ev.data!.idx as number);
      case 'followup':
        return this.onFollowup(ev.ref, ev.data);
      case 'request':
        return this.onRequestExpire(ev.ref);
      case 'phantom':
        return this.onPhantom();
      case 'reveal':
        return this.onReveal(ev.ref, ev.data);
      case 'endShift':
        return this.onEndTime();
      case 'death':
        return this.onScheduledOutcome(ev.ref, ev.data);
      case 'ai':
        return this.onAi(ev.ref);
      case 'notice':
        if (ev.ref === 'almoco') {
          this.sh.flags['almocoPendente'] = true;
          this.sh.fast = false;
          return;
        }
        if (ev.ref === 'video_intro' && this.c.video?.intro) this.pushModal({ kind: 'aviso', who: this.c.video.intro.who, text: this.c.video.intro.text, blocking: true });
        if (ev.ref === 'sem_sono')
          this.toast(
            (this.sh.noites ?? 1) > 1
              ? `${this.sh.noites}ª noite seguida na ambulância. As pálpebras vão pesar mais vezes, e mais depressa; o café ajuda menos.`
              : 'Você dormiu três horas depois da noite na ambulância. As pálpebras vão pesar hoje; o café segura por duas horas.',
            'ruim',
          );
        return;
      case 'cochilo':
        if (this.sh.coffeeUntil > this.sh.time || this.sh.ended || this.sh.closing) return;
        // no meio de uma orientação por telefone ou de um aviso, o cochilo espera alguns minutos
        if (this.sh.guideCallId || this.sh.modals.some((m) => m.blocking)) {
          this.schedule(this.sh.time + 8, 'cochilo', 'zz');
          return;
        }
        this.sh.cochilo = { at: this.sh.time };
        return;
      default:
        return;
    }
  }

  // ---------------------------------------------------------------------------
  // chegada e fila
  // ---------------------------------------------------------------------------
  private onArrival(id: string) {
    const call = this.sh.calls[id] as CallRT & { pendingArrival?: boolean };
    if (!call) return;
    delete call.pendingArrival;
    const def = this.defOf(call);
    this.sh.order.push(id);
    call.status = 'fila';
    // nota da Simone
    if (this.tarm) {
      call.noteRight = true;
      call.noteText = '';
      if (this.sh.tarm?.out) this.schedule(this.sh.time + 2 + Math.floor(randOf(this.st) * 4), 'ai', 'tri:' + id);
    } else if (this.sh.simoneAway || def.raw) {
      call.noteRight = true;
      call.noteText = '';
    } else {
      const acc = def.noteFixed || def.anchor ? 1 : simoneAccuracy(this.st, this.day.simoneAccuracy);
      call.noteRight = randOf(this.st) < acc;
      call.noteText = resolveTokens(call.noteRight ? txt(def.note, this.ctx()) : this.wrongNote(call, def), this.st.gender, this.st);
      call.noteUrgent = call.noteRight ? this.truthOf(call).sev === 'vermelho' : /grave|morrendo|urgente|pega/i.test(call.noteText);
      // 1.1: a cor do post-it (a caixa que ela marcou) erra junto com a nota
      call.noteBox = noteBoxFor(call.id, simoneBox(def, this.truthOf(call), resolveTokens(txt(def.note, this.ctx()), this.st.gender, this.st)), call.noteRight);
      this.tarmAddress(call, def);
    }
    if (!def.anchor && def.patience !== 0) {
      const pat = def.patience ?? 120;
      if (isFinite(pat)) this.schedule(this.sh.time + pat, 'hangup', id);
    }
    this.st.totals.calls++;
    // chegou ligação: acaba o "adiantar"
    this.sh.fast = false;
    this.emit({ type: 'ring', callId: id });
  }

  /**
   * A Simone (TARM) confere o endereço no cadastro antes de passar a ligação (1.1: não é mais
   * tarefa do médico). Quando a nota dela está certa, o endereço que não existe vem anotado ("não
   * confere") e um marco no endereço aparece ("no endereço: Igreja..."); quando a nota está
   * errada (mesma taxa de erro do post-it), ela deixa passar um endereço ruim ou, às vezes, acusa
   * um endereço bom.
   */
  private tarmAddress(call: CallRT, def: CallDef) {
    const r = resolveAddress(def.addr);
    const bad = r.kind === 'sem_rua' || r.kind === 'invalido' || r.kind === 'bairro';
    let note: CallRT['addrNote'];
    if (call.noteRight) note = bad ? 'nao_confere' : r.kind === 'marco' ? 'marco' : undefined;
    else note = !bad && hashString(call.id + ':end') % 2 === 0 ? 'nao_confere' : undefined;
    if (!note) return;
    call.addrNote = note;
    call.noteAddr = note === 'marco' && r.landmark ? `No endereço: ${r.landmark.name}.` : 'Endereço não confere no mapa.';
  }

  /** sem ligação, fila, orientação, aviso ou pedido: dá para adiantar o relógio */
  idle(): boolean {
    const sh = this.sh;
    return !sh.activeId && !sh.guideCallId && !sh.closing && !sh.ended && !sh.cochilo && !sh.modals.length && !sh.requests.length && this.queue().length === 0;
  }

  /** liga/desliga o "adiantar até a próxima ligação" */
  setFast(on: boolean) {
    this.sh.fast = on && this.idle();
  }

  private wrongNote(call: CallRT, def: CallDef): string {
    if (def.noteWrong) return txt(def.noteWrong, this.ctx());
    const t = this.truthOf(call);
    const r = randOf(this.st);
    if (t.sev === 'trote') return r < 0.5 ? 'Parece grave. Pega logo.' : 'Diz que é urgente.';
    if (t.sev === 'vermelho') return r < 0.5 ? 'Acho que é bobagem.' : 'Parece tranquilo, sem pressa.';
    if (t.sev === 'amarelo') return r < 0.5 ? 'Acho que é trote.' : 'Coisa leve.';
    return r < 0.5 ? 'Disse que tá morrendo.' : 'Parece grave!';
  }

  private onHangup(id: string) {
    const call = this.sh.calls[id];
    if (!call || call.status !== 'fila') return;
    call.status = 'desligou';
    call.closed = this.sh.time;
    const t = this.truthOf(call);
    const def = this.defOf(call);
    let outcome: CallOutcome = 'liberado';
    let text = 'Desistiu de esperar na fila.';
    if (t.sev === 'vermelho' && t.risk) {
      const p = this.survival(t, this.sh.time + 50 - call.arrived, 0);
      if (randOf(this.st) > p || t.inevitable) {
        outcome = 'obito';
        text = 'Desistiu de esperar. Óbito (foi por meios próprios).';
        call.outcome = 'obito';
        this.registerDeath(call, false, 'na espera');
      } else {
        outcome = 'sequela';
        text = 'Desistiu de esperar; chegou ao hospital por meios próprios, grave.';
      }
    } else if (t.sev === 'amarelo') {
      outcome = 'piorou';
      text = 'Desistiu de esperar; piorou e procurou a UPA por conta própria.';
    }
    call.outcome = outcome;
    call.resultText = text;
    this.emit({ type: 'hangup', callId: id });
    void def;
  }

  queue(): CallRT[] {
    return this.sh.order.map((id) => this.sh.calls[id]).filter((c) => c && (c.status === 'fila' || c.status === 'espera'));
  }

  // ---------------------------------------------------------------------------
  // atender / espera
  // ---------------------------------------------------------------------------
  answer(id: string) {
    const sh = this.sh;
    const call = sh.calls[id];
    if (!call || (call.status !== 'fila' && call.status !== 'espera')) return;
    if (sh.guideCallId) return;
    // 1.1: hora do almoço e nenhuma ligação aberta: a próxima espera a cena do almoço (Game.checkLunch)
    if (sh.flags['almocoPendente'] && !sh.activeId) return;
    if (sh.activeId && sh.activeId !== id) this.hold();
    const first = call.answered === undefined;
    call.status = 'ativa';
    sh.activeId = id;
    if (first && call.lines.length) {
      // retorno de ligação dispensada/desligada: já tem transcrição
      call.answered = sh.time;
      call.worsenIdx = Math.max(call.worsenIdx, 0);
      this.sysLine(call, 'Você atende o retorno.');
    } else if (first) {
      call.answered = sh.time;
      const def = this.defOf(call);
      this.sysLine(call, `☎ ${def.num} · ${fmtTime(sh.time)} · ${addrText(def.addr)}`);
      this.pushLines(call, def.open, def);
      if (def.onAnswer) def.onAnswer(this.eff());
    } else {
      this.sysLine(call, 'Você retoma a ligação.');
      if (call.patience < 40) this.pushLines(call, ['Alô?! Ainda tá aí?'], this.defOf(call));
    }
    this.emit({ type: 'answer', callId: id });
  }

  hold() {
    const sh = this.sh;
    if (!sh.activeId) return;
    const call = sh.calls[sh.activeId];
    if (call && call.status === 'ativa') {
      endVideo(this, call, 'ligação em espera');
      call.status = 'espera';
      call.holdCount++;
      call.patience = Math.max(0, call.patience - 10);
      this.sysLine(call, 'Ligação colocada em espera.');
    }
    sh.activeId = undefined;
  }

  active(): CallRT | undefined {
    return this.sh.activeId ? this.sh.calls[this.sh.activeId] : undefined;
  }

  // ---------------------------------------------------------------------------
  // transcrição
  // ---------------------------------------------------------------------------
  private lineSeq = 0;
  private nextLineId(call: CallRT) {
    return call.lines.length ? call.lines[call.lines.length - 1].id + 1 : 1 + this.lineSeq++;
  }

  sysLine(call: CallRT, text: string, kind: 'sistema' | 'insight' = 'sistema') {
    call.lines.push({ id: this.nextLineId(call), who: kind === 'insight' ? 'VOCÊ REPARA' : 'SISTEMA', text: resolveTokens(text, this.st.gender, this.st), kind, t: this.sh.time });
    this.emit({ type: 'lines', callId: call.id });
  }

  /** linha com falante e tipo livres (vídeo, etc.) */
  pushRawLine(call: CallRT, who: string, text: string, kind: ShownLine['kind'], style?: ShownLine['style']) {
    call.lines.push({ id: this.nextLineId(call), who, text: resolveTokens(text, this.st.gender, this.st), kind, style, t: this.sh.time });
  }

  regLine(call: CallRT, text: string) {
    call.lines.push({ id: this.nextLineId(call), who: 'VOCÊ', text: resolveTokens(text, this.st.gender, this.st), kind: 'regulador', t: this.sh.time });
  }

  pushLines(call: CallRT, ans: AnswerIn | undefined, def: CallDef) {
    if (ans === undefined) return;
    const c = this.ctx();
    const raw = typeof ans === 'function' ? ans(c) : ans;
    const lines = normLines(raw as LineIn | LineIn[], c);
    for (const l of lines) {
      call.lines.push({
        id: this.nextLineId(call),
        who: l.noise ? '' : l.who ?? this.callerLabel(def),
        text: l.text,
        kind: l.noise ? 'ruido' : 'caller',
        style: l.style,
        t: this.sh.time,
      });
    }
    this.emit({ type: 'lines', callId: call.id });
  }

  callerLabel(def: CallDef): string {
    return resolveTokens(def.callerName ?? def.caller, this.st.gender, this.st).toUpperCase();
  }

  // ---------------------------------------------------------------------------
  // perguntas
  // ---------------------------------------------------------------------------
  questionCost(base: number): number {
    let c = base;
    if (this.sh.coffeeUntil > this.sh.time) c *= 0.7;
    if (this.st.vars.desgaste > 60) c *= 1.1;
    return Math.max(1, Math.round(c));
  }

  /**
   * Perguntas da ligação (1.1): `fixed` = as cinco fixas; `box` = a(s) caixa(s) em que aparece
   * (Clínico/GO/Trauma/Outros: a tela mostra só as das caixas abertas, `call.boxes`); sem as duas
   * = ferramenta ou confronto liberado (sempre à vista).
   */
  questions(call: CallRT): QuestionView[] {
    const def = this.defOf(call);
    const c = this.ctx();
    const out: QuestionView[] = [];
    for (const q of this.c.questions) {
      if (q.day && q.day > this.st.day) continue;
      if (q.id === 'acalmar') continue;
      if (this.tarm) {
        if (!TARM_QUESTIONS.includes(q.id)) continue;
      } else if (q.tarmOnly) continue;
      const box = q.box === undefined ? undefined : Array.isArray(q.box) ? q.box : [q.box];
      out.push({ id: q.id, label: q.label, cost: this.questionCost(q.cost), group: q.group, asked: call.asked.includes(q.id), hint: q.hint, fixed: !this.tarm && !!q.fixed, box: this.tarm ? undefined : box });
    }
    out.push({ id: 'acalmar', label: 'Acalmar', cost: this.questionCost(4), group: 'acalmar', asked: false, hint: 'Reduz o pânico de quem liga' });
    if (this.tarm) return out;
    const cat = this.callCat(call);
    for (const x of def.extra ?? []) {
      if (x.when && !x.when(c)) continue;
      if (!this.isUnlocked(call, x)) continue;
      const asked = call.asked.includes(x.id);
      const b = extraBox(x, cat);
      out.push({ id: x.id, label: x.label, cost: this.questionCost(x.cost ?? 8), group: this.groupOf(x), asked, box: b ? [b] : undefined });
    }
    // o número já está no quadro de trotes: dá para dizer isso a quem liga
    if (this.onBoard(call)) {
      out.push({ id: 'confronto_quadro', label: 'Esse número já ligou aqui antes?', cost: this.questionCost(6), group: 'confronto', asked: call.asked.includes('confronto_quadro') });
    }
    return out;
  }

  /** caixa (categoria) do chamado: Clínico, GO ou Trauma */
  callCat(call: CallRT): BoxId {
    return callBox(this.defOf(call), this.truthOf(call));
  }

  /** a pergunta foi feita com a caixa fechada (atalho, bot): abre a caixa dela (a do chamado, se servir) */
  private openBoxFor(call: CallRT, boxes: BoxId[]) {
    const open = (call.boxes ??= []);
    if (boxes.some((b) => open.includes(b))) return;
    const cat = this.callCat(call);
    open.push(boxes.includes(cat) ? cat : boxes[0]);
  }

  /** abre (ou fecha) uma caixa de perguntas na ligação ativa; não custa tempo */
  toggleBox(box: BoxId, open?: boolean): boolean {
    const call = this.active();
    if (!call) return false;
    const list = (call.boxes ??= []);
    const has = list.includes(box);
    const want = open ?? !has;
    if (want && !has) list.push(box);
    if (!want && has) call.boxes = list.filter((b) => b !== box);
    return want;
  }

  /** o número desta ligação está no quadro de trotes */
  onBoard(call: CallRT): boolean {
    const nk = numKey(this.defOf(call).num);
    return this.st.board.some((b) => b.kind === 'trote' && !!b.num && numKey(b.num) === nk);
  }

  /** pergunta trancada (`locked`) já liberada? (por `unlocks` de outra pergunta ou por um gatilho de `unlockedBy`) */
  isUnlocked(call: CallRT, x: ExtraQ): boolean {
    if (!x.locked || call.unlocked.includes(x.id)) return true;
    for (const k of x.unlockedBy ?? []) {
      if (this.triggerMet(call, k)) {
        call.unlocked.push(x.id);
        return true;
      }
    }
    return false;
  }

  private triggerMet(call: CallRT, k: string): boolean {
    if (k === 'quadro') return this.onBoard(call);
    if (k === 'endereco') return !!call.addrNote;
    if (k === 'video') return !!call.video;
    if (k.startsWith('video:')) return !!call.video?.seen.includes(k.slice(6));
    if (k.startsWith('doc:')) return this.st.docs.includes(k.slice(4));
    if (k.startsWith('lido:')) return !!this.st.flags['doc_lido_' + k.slice(5)];
    if (k.startsWith('flag:')) return !!this.st.flags[k.slice(5)];
    if (k.startsWith('sflag:')) return !!this.sh.flags[k.slice(6)];
    return call.asked.includes(k);
  }

  private groupOf(x: ExtraQ): QuestionView['group'] {
    if (x.kind === 'confronto') return 'confronto';
    if (x.kind === 'fala') return 'fala';
    if (x.kind === 'acalmar') return 'acalmar';
    return 'especifica';
  }

  ask(qid: string): boolean {
    const call = this.active();
    if (!call) return false;
    const def = this.defOf(call);
    const c = this.ctx();
    const base = this.c.questions.find((q) => q.id === qid);
    if (qid === 'acalmar') {
      this.regLine(call, this.st.day >= 1 ? pickCalm(call.calmed) : '');
      call.calmed++;
      call.patience = Math.min(100, call.patience + 30);
      const extraCalm = (def.extra ?? []).find((x) => x.id === 'acalmar');
      if (extraCalm) this.pushLines(call, extraCalm.a, def);
      else this.pushLines(call, call.calmed > 2 ? ['[respira fundo]'] : ['Tá... tá bom.'], def);
      this.advance(this.questionCost(4));
      return true;
    }
    if (base) {
      if (base.day && base.day > this.st.day) return false;
      if (!this.tarm && base.tarmOnly) return false;
      if (call.asked.includes(qid)) return false;
      call.asked.push(qid);
      // perguntar algo de uma caixa fechada (atalho, bot) abre a caixa
      if (!this.tarm && base.box) this.openBoxFor(call, Array.isArray(base.box) ? base.box : [base.box]);
      this.regLine(call, base.say);
      if (base.act) return this.outros(call, def, base.act, base.cost);
      if (qid === 'callback') {
        this.sysLine(call, '📞 Você desliga e liga de volta para o número...');
        const ans = def.callback ?? this.defaultCallback(call, def);
        this.pushLines(call, ans, def);
      } else {
        const a = def.q?.[qid];
        if (a !== undefined) this.pushLines(call, a, def);
        else this.pushLines(call, this.c.defaults(qid, def, c), def);
      }
      this.advance(this.questionCost(base.cost));
      return true;
    }
    if (qid === 'confronto_quadro') {
      if (call.asked.includes(qid) || !this.onBoard(call)) return false;
      call.asked.push(qid);
      this.regLine(call, 'Esse número já ligou aqui antes? Ele está no nosso quadro.');
      const a = def.q?.[qid] ?? this.c.defaults(qid, def, c);
      this.pushLines(call, a, def);
      this.advance(this.questionCost(6));
      return true;
    }
    const x = (def.extra ?? []).find((e) => e.id === qid);
    if (!x) return false;
    if (x.when && !x.when(c)) return false;
    if (!this.isUnlocked(call, x)) return false;
    if (call.asked.includes(qid) && !x.repeat) return false;
    if (!call.asked.includes(qid)) call.asked.push(qid);
    const xb = extraBox(x, this.callCat(call));
    if (xb) this.openBoxFor(call, [xb]);
    this.regLine(call, txt(x.say ?? x.label, c));
    this.pushLines(call, x.a, def);
    for (const u of x.unlocks ?? []) if (!call.unlocked.includes(u)) call.unlocked.push(u);
    if (x.onAsk) x.onAsk(this.eff());
    this.advance(this.questionCost(x.cost ?? 8));
    return true;
  }

  /**
   * Frases da caixa Outros (o solicitante folgado). A resposta vem de `def.q[id]` (por ligação) ou
   * do padrão (`defaults`). Efeitos: "gravada" acalma o abuso (paciência +10) mas irrita quem tem
   * urgência de verdade (−10); "não é perfil" irrita (−10) quem tem urgência; "meios próprios" conta
   * como orientação dada (fica marcado em `call.unlocked` como 'meios'); "encerro" fecha a ligação
   * como orientação (ORI) — com meios próprios ditos, para a UPA (ou o encaminhamento da verdade);
   * sem isso, ficar em casa. O carimbo avalia como qualquer orientação.
   */
  private outros(call: CallRT, def: CallDef, act: OutrosAct, cost: number): boolean {
    const c = this.ctx();
    const id = this.c.questions.find((q) => q.act === act)?.id ?? act;
    const t = this.truthOf(call);
    const urgent = t.sev === 'vermelho' || t.sev === 'amarelo';
    // conflito (1.1, "encerro por motivo de conflitos"): quem liga xingou (#%!#@$ na fala) ou
    // insistiu depois de duas negativas ("não é perfil" e "meios próprios" já ditos)
    const conflictBefore = this.conflict(call);
    const a = def.q?.[id];
    this.pushLines(call, a !== undefined ? a : this.c.defaults(id, def, c), def);
    if (act === 'gravada') call.patience = clamp(call.patience + (urgent ? -10 : 10), 0, 100);
    if (act === 'perfil' && urgent) call.patience = clamp(call.patience - 10, 0, 100);
    if (act === 'meios' && !call.unlocked.includes('meios')) call.unlocked.push('meios');
    this.advance(this.questionCost(cost));
    if (act === 'encerra' && !call.decision && this.active()?.id === call.id) {
      const meios = call.unlocked.includes('meios');
      // com meios próprios: o encaminhamento da verdade (UPA/UBS; "casa" quando é só transporte); sem: ficar em casa
      const ref: Referral = meios ? (t.ref?.find((r) => r !== 'CASA') ?? (t.ref?.includes('CASA') ? 'CASA' : 'UPA')) : 'CASA';
      const r = this.stamp({ color: t.sev === 'azul' ? 'azul' : 'verde', resource: 'ORI', support: [], referral: ref });
      if (r.ok) {
        this.sysLine(call, '☎ Você encerrou a ligação. Registrado como orientação' + (meios ? ' (meios próprios).' : '.'));
        const e = this.eff();
        if (t.sev !== 'trote' && !conflictBefore) {
          // sem briga, "encerro por motivo de conflitos" é desligar na cara de quem pediu ajuda
          e.add('humanidade', -1, 'desligou na cara sem ter havido conflito');
        } else if (conflictBefore && this.hadBleep(call) && call.verdict && (call.verdict.kind === 'correto' || call.verdict.kind === 'defensavel')) {
          // o xingamento criativo vira piada da central: alívio cômico
          e.add('desgaste', -2, 'a central inteira riu do xingamento');
        }
      }
    }
    return true;
  }

  /** quem liga xingou nesta ligação (o palavrão censurado, #%!#@$, numa fala) */
  hadBleep(call: CallRT): boolean {
    return call.lines.some((l) => l.kind === 'caller' && hasBleep(l.text));
  }

  /** houve conflito: xingamento, ou o regulador já disse "não é perfil" e "meios próprios" */
  conflict(call: CallRT): boolean {
    return this.hadBleep(call) || (call.asked.includes('nao_perfil') && call.asked.includes('meios_proprios')) || call.unlocked.includes('conflito');
  }

  private defaultCallback(call: CallRT, def: CallDef): LineIn[] {
    const t = this.truthOf(call);
    if (t.sev === 'trote') {
      return randOf(this.st) < 0.5 ? ['[{{O número chamado não existe.|retorno_inexistente}}]'] : ['[{{Caixa postal. Ninguém atende.|retorno_caixa}}]'];
    }
    return [`{{Alô? Alô! Sou eu que liguei, pelo amor de Deus!|retorno_ok}}`];
  }

  // ---------------------------------------------------------------------------
  // mapa
  // ---------------------------------------------------------------------------
  addrResult(call: CallRT): AddrResult {
    return resolveAddress(this.defOf(call).addr);
  }

  etaFor(unitId: string, call: CallRT): number {
    const u = this.sh.units[unitId];
    const tgt = addressTarget(this.defOf(call).addr);
    const from = this.unitPos(u);
    return route(from, tgt, this.floodMode(), this.sh.time).minutes;
  }

  floodMode(): FloodMode {
    return this.sh.flood ? 'flood' : 'none';
  }

  unitPos(u: UnitState): [number, number] {
    if (u.path.length > 1 && u.t1 > u.t0 && (u.status === 'DESLOC' || u.status === 'TRANSP' || u.status === 'RETORNO')) {
      const f = clamp((this.sh.time - u.t0) / (u.t1 - u.t0), 0, 1);
      const idx = f * (u.path.length - 1);
      const i = Math.floor(idx);
      const a = u.path[i];
      const b = u.path[Math.min(u.path.length - 1, i + 1)];
      const k = idx - i;
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
    }
    return u.pos;
  }

  availableUnits(type?: 'USA' | 'USB'): UnitState[] {
    return Object.values(this.sh.units).filter((u) => (u.status === 'QRV' || u.status === 'RETORNO') && (!type || u.type === type));
  }

  /** o jogador abriu um documento da mesa (quadro): grava `doc_lido_<id>` e roda o `onRead` na primeira vez */
  readDoc(id: string): boolean {
    const doc = this.c.docs[id];
    if (!doc || !this.st.docs.includes(id)) return false;
    const k = 'doc_lido_' + id;
    if (this.st.flags[k]) return false;
    this.st.flags[k] = true;
    if (doc.onRead) doc.onRead(this.eff());
    return true;
  }

  callerHangsUp(call: CallRT) {
    const def = this.defOf(call);
    endVideo(this, call);
    this.pushLines(call, ['[desliga]'], def);
    call.status = 'desligou';
    call.closed = this.sh.time;
    if (this.sh.activeId === call.id) this.sh.activeId = undefined;
    const t = this.truthOf(call);
    if (t.sev !== 'trote') {
      // liga de novo em 10 minutos, mais nervoso
      this.schedule(this.sh.time + 10, 'followup', call.id, { reason: 'irritado' });
    } else {
      call.outcome = 'trote';
      call.resultText = 'Desligou durante a ligação.';
    }
    this.emit({ type: 'hangup', callId: call.id });
  }

  // ---------------------------------------------------------------------------
  // videochamada de averiguação (lógica em video.ts)
  // ---------------------------------------------------------------------------
  videoView(call?: CallRT): VideoView {
    return videoView(this, call ?? this.active());
  }
  startVideo(): VideoStartResult {
    return startVideo(this);
  }
  videoLook(spotId: string): boolean {
    return videoLook(this, spotId);
  }
  videoWide() {
    videoWide(this);
  }
  endVideo() {
    endVideo(this, this.active(), 'você encerrou');
  }
  videoBudget() {
    return videoBudget(this);
  }

  // ---------------------------------------------------------------------------
  // carimbo (decisão)
  // ---------------------------------------------------------------------------
  stamp(d: { color: Color; resource: Resource; unit?: string; support: Support[]; dest?: Dest; referral?: Referral }, target?: CallRT): { ok: boolean; error?: string } {
    const sh = this.sh;
    const call = target ?? this.active();
    if (!call) return { ok: false, error: 'Nenhuma ligação ativa.' };
    if (call.decision) return { ok: false, error: 'Ligação já regulada.' };
    const def = this.defOf(call);
    if (def.special === 'mci') return { ok: false, error: 'Use o painel de múltiplas vítimas.' };
    if ((d.resource === 'USA' || d.resource === 'USB') && !d.unit) {
      const free = this.availableUnits(d.resource);
      if (!free.length) return { ok: false, error: `Nenhuma ${d.resource} disponível.` };
      d.unit = free.sort((a, b) => this.etaFor(a.id, call) - this.etaFor(b.id, call))[0].id;
    }
    if (d.unit) {
      const u = sh.units[d.unit];
      if (!u || (u.status !== 'QRV' && u.status !== 'RETORNO')) return { ok: false, error: 'Viatura indisponível.' };
      if (u.type !== d.resource) return { ok: false, error: `${u.label} não é ${d.resource}.` };
    }
    if (this.st.day >= 9 && (d.resource === 'USA' || d.resource === 'USB') && !d.dest) {
      return { ok: false, error: 'Defina o hospital de destino (Manual 9-A).' };
    }
    const noUSA = !Object.values(sh.units).some((u) => u.type === 'USA' && (u.status === 'QRV' || u.status === 'RETORNO'));
    const decision: Decision = { ...d, support: [...d.support], t: sh.time, realSec: call.realSec, noUSA };
    call.decision = decision;
    endVideo(this, call);
    const truth = this.truthOf(call);
    call.dxAtStamp = truth.dx;
    const verdict = grade({ truth, decision, asked: call.asked, day: this.st.day });
    call.verdict = verdict;
    sh.regTimes.push(sh.time - (call.answered ?? sh.time));
    sh.handled++;
    this.st.totals.handled++;
    const c = this.eff();
    if (def.onStamp) def.onStamp(c, decision);
    this.emit({ type: 'stamp', callId: call.id, resource: d.resource });

    // ---- trote: número ao quadro
    if (d.resource === 'TROTE') {
      if (truth.prankKind !== 'acidental' && truth.prankKind !== 'teste' && truth.prankKind !== 'desabafo') {
        c.board({ id: 'n' + numKey(def.num), kind: 'trote', title: def.num, text: `Trote · D${this.st.day} · ${fmtTime(sh.time)}`, num: def.num });
      }
      this.sysLine(call, `Carimbo: TROTE. ${truth.prankKind === 'acidental' ? '' : 'Número anotado no quadro.'}`);
      videoProofOnStamp(this, call, truth);
      this.closeCall(call);
      // revelação na auditoria do fim do dia; emergência real dispensada gera retorno
      if (truth.sev !== 'trote' && (truth.sev === 'vermelho' || truth.sev === 'amarelo')) this.scheduleDismissFollowup(call, truth);
      return { ok: true };
    }
    // ---- orientação
    if (d.resource === 'ORI') {
      this.sysLine(call, `Carimbo: ORIENTAÇÃO${d.referral ? ' → ' + d.referral : ''}.`);
      if (d.support.length) this.radio('COPOM/193', `Apoio acionado: ${d.support.map((s) => (s === 'PM' ? 'Polícia Militar (190)' : 'Bombeiros (193)')).join(' e ')} para ${addrText(def.addr)}.`, 'info');
      const g = def.guide;
      if (g && g.onOri && (!g.when || g.when(this.ctx()))) {
        this.startGuide(call, typeof g.id === 'function' ? g.id(this.ctx()) : g.id, 0);
      } else this.closeCall(call);
      if ((truth.sev === 'vermelho' || truth.sev === 'amarelo') && !truth.ok.includes('ORI')) this.scheduleDismissFollowup(call, truth);
      return { ok: true };
    }
    // ---- despacho
    const unit = sh.units[d.unit!];
    this.dispatch(unit, call, false);
    if (d.resource === 'USA') sh.usaSent++;
    sh.dispatches++;
    sh.costToday += d.resource === 'USA' ? COST_USA : COST_USB;
    if (d.support.length) this.radio('COPOM/193', `Apoio acionado: ${d.support.map((s) => (s === 'PM' ? 'Polícia Militar (190)' : 'Bombeiros (193)')).join(' e ')} para ${addrText(def.addr)}.`, 'info');
    this.sysLine(call, `Carimbo: REGULADO — ${decisionLabel(decision)}. ${unit.label} a caminho.`);
    // má gestão: caso vermelho sem USA livre enquanto uma USA está em excesso
    if (truth.sev === 'vermelho' && d.resource !== 'USA') {
      const busyExcess = Object.values(sh.units).some((u) => u.type === 'USA' && u.callId && sh.calls[u.callId]?.verdict?.kind === 'excesso');
      if (busyExcess && !this.availableUnits('USA').length) call.mismanaged = true;
    }
    // peixoto
    this.peixotoWatch();
    const g = def.guide;
    const worsenGuide = (call as CallRT & { pendingGuide?: string }).pendingGuide;
    const gid = worsenGuide ?? (g && (!g.when || g.when(this.ctx())) && g.auto !== false ? (typeof g.id === 'function' ? g.id(this.ctx()) : g.id) : undefined);
    if (gid) this.startGuide(call, gid, Math.max(1, unit.t1 - sh.time));
    else this.closeCall(call);
    return { ok: true };
  }

  /** Anexo 9-C: declarar impedimento — a coordenação assume a ligação. */
  declareImpediment(): { ok: boolean; error?: string } {
    const call = this.active();
    if (!call || call.decision) return { ok: false, error: 'Sem ligação ativa.' };
    const def = this.defOf(call);
    const imp = def.impedimento;
    if (!imp) return { ok: false, error: 'Não se aplica.' };
    this.regLine(call, 'Declaro impedimento: é da minha família. Passo para a coordenação.');
    this.advance(imp.cost);
    const res = imp.decision.resource;
    let unitId: string | undefined;
    if (res === 'USA' || res === 'USB') {
      // sem viatura do tipo pedido, a coordenação manda a outra em vez de "orientar" um caso grave
      const pool = this.availableUnits(res).length ? this.availableUnits(res) : this.availableUnits();
      const free = pool.sort((a, b) => this.etaFor(a.id, call) - this.etaFor(b.id, call));
      unitId = free[0]?.id;
    }
    const resource: Resource = unitId ? this.sh.units[unitId].type : res === 'ORI' || res === 'TROTE' ? res : 'ORI';
    const decision: Decision = { color: imp.decision.color, resource, unit: unitId, support: imp.decision.support ?? [], dest: imp.decision.dest, t: this.sh.time, realSec: call.realSec };
    call.decision = decision;
    const v = grade({ truth: this.truthOf(call), decision, asked: ['inicio', 'respira', 'consciencia'], day: this.st.day });
    call.verdict = { ...v, notes: 0, warnings: 0, bonus: 0, sindicancia: false, kind: 'sem_penalidade', text: 'Regulada pela coordenação (impedimento declarado).' };
    this.sysLine(call, resolveTokens(txt(imp.text, this.ctx()), this.st.gender, this.st));
    if (imp.effect) imp.effect(this.eff());
    this.sh.handled++;
    this.st.totals.handled++;
    if (unitId) {
      const u = this.sh.units[unitId];
      this.dispatch(u, call, false);
      if (u.type === 'USA') this.sh.usaSent++;
      this.sh.dispatches++;
      this.sh.costToday += u.type === 'USA' ? COST_USA : COST_USB;
    }
    this.closeCall(call);
    return { ok: true };
  }

  /** Dia 15: triagem e alocação no evento de múltiplas vítimas */
  mciSubmit(triage: Record<string, Color | 'preto'>, alloc: Record<string, string>, reinforcement: boolean): { ok: boolean; summary: string[] } {
    const sh = this.sh;
    const call = this.active();
    if (!call) return { ok: false, summary: [] };
    const def = this.defOf(call);
    const mci = def.mci;
    if (!mci) return { ok: false, summary: [] };
    const tgt = addressTarget(def.addr);
    const summary: string[] = [];
    const used = new Set<string>();
    let saved = 0;
    let lostReds = 0;
    let wasted = 0;
    let rightTriage = 0;
    const e = this.eff();
    // despacha cada viatura alocada uma vez
    const etaOf: Record<string, number> = {};
    for (const [vid, uid] of Object.entries(alloc)) {
      if (!uid || uid === 'upa' || uid === 'none' || uid === 'reforco') continue;
      if (used.has(uid)) continue;
      const u = sh.units[uid];
      if (!u || (u.status !== 'QRV' && u.status !== 'RETORNO')) continue;
      used.add(uid);
      const r = route(this.unitPos(u), tgt, this.floodMode(), sh.time);
      etaOf[uid] = r.minutes;
      this.dispatch(u, call, false);
      if (u.type === 'USA') sh.usaSent++;
      sh.dispatches++;
      sh.costToday += u.type === 'USA' ? COST_USA : COST_USB;
      void vid;
    }
    if (reinforcement) {
      this.radio('REGULAÇÃO REGIONAL', `Reforço de Rio Claro de Minas autorizado: ${mci.reinforcementUnits} viaturas, chegada em ~${mci.reinforcementMin} min.`, 'ok');
      this.st.flags['mci_reforco'] = true;
    }
    let reforcoUsed = 0;
    for (const v of mci.victims) {
      const tri = triage[v.id];
      if (tri === v.cor) rightTriage++;
      let uid = alloc[v.id];
      // o reforço tem um número limitado de viaturas
      if (uid === 'reforco') {
        if (reforcoUsed >= mci.reinforcementUnits) uid = 'none';
        else reforcoUsed++;
      }
      const u = uid ? sh.units[uid] : undefined;
      let careEta: number | undefined;
      let level: 'USA' | 'USB' | 'proprio' | 'nada' = 'nada';
      if (u && etaOf[u.id] !== undefined) {
        careEta = etaOf[u.id];
        level = u.type;
      } else if (uid === 'reforco' && reinforcement) {
        careEta = mci.reinforcementMin;
        level = 'USA';
      } else if (uid === 'upa') level = 'proprio';
      const name = `${v.name}, ${v.age}`;
      if (v.cor === 'vermelho') {
        const ok = (level === 'USA' && (careEta ?? 999) <= mci.redWindow) || (level === 'USB' && (careEta ?? 999) <= mci.redWindow * 0.35);
        if (ok) {
          saved++;
          summary.push(`🟥 ${name}: sobreviveu.`);
          sh.saves.push(`${call.id}:${v.id}`);
          this.st.totals.saves++;
          if (v.key) e.keyPatient(v.key, 'salvo');
          this.st.diary.push({ id: `mci_${v.id}`, day: this.st.day, name, text: `Vítima do tumulto no show. ${v.desc}. Viva.`, kind: 'vivo', updates: [], callDef: def.id });
        } else {
          lostReds++;
          summary.push(`🟥 ${name}: óbito no local.`);
          sh.deaths.push(`${call.id}:${v.id}`);
          this.st.totals.deaths++;
          e.add('desgaste', 10, 'óbito');
          if (v.key) e.keyPatient(v.key, 'perdido');
          this.st.diary.push({ id: `mci_${v.id}`, day: this.st.day, name, text: `Vítima do tumulto no show. ${v.desc}. Óbito.`, kind: 'morto', updates: [], callDef: def.id });
        }
      } else if (v.cor === 'amarelo') {
        if (level === 'nada' || level === 'proprio') summary.push(`🟨 ${name}: ficou sem viatura; piorou até a UPA.`);
        else summary.push(`🟨 ${name}: removido(a), estável.`);
      } else if (v.cor === 'verde') {
        if (level === 'USA' || level === 'USB') {
          wasted++;
          summary.push(`🟩 ${name}: levou uma viatura sem precisar.`);
        } else summary.push(`🟩 ${name}: foi à UPA por meios próprios.`);
      }
    }
    const decision: Decision = { color: 'vermelho', resource: 'USA', support: ['PM'], dest: 'REG', t: sh.time, realSec: call.realSec };
    call.decision = decision;
    const warnings = lostReds;
    const notes = wasted;
    const bonus = saved * 15 + rightTriage * 2;
    call.verdict = {
      kind: lostReds ? 'falta' : 'correto',
      safety: false,
      destWrong: false,
      refWrong: false,
      bonus,
      notes,
      warnings: Math.min(warnings, 2),
      golden: false,
      text: `Múltiplas vítimas: triagem ${rightTriage}/${mci.victims.length} correta · ${saved} vermelhas salvas · ${lostReds} óbitos.`,
      revealed: false,
    };
    call.outcome = lostReds ? 'obito' : 'salvo';
    sh.handled += 1;
    sh.flags['mciHandled'] = true;
    this.revealVerdict(call);
    this.closeCall(call);
    if (lostReds === 0) e.set('mci_sem_obitos');
    summary.unshift(`Triagem: ${rightTriage} de ${mci.victims.length} corretas.`);
    return { ok: true, summary };
  }

  private closeCall(call: CallRT) {
    endVideo(this, call);
    if (call.status !== 'guia') call.status = 'encerrada';
    call.closed = this.sh.time;
    if (this.sh.activeId === call.id) {
      this.sh.activeId = undefined;
    }
  }

  private scheduleDismissFollowup(call: CallRT, truth: TruthDef) {
    if (truth.noPenalty) return;
    const def = this.defOf(call);
    if (def.noFollowup) {
      // ninguém liga de novo: o desfecho chega pelo noticiário / pelo diário
      this.schedule(Math.min(this.sh.time + 45, this.sh.end - 1), 'reveal', call.id, { reason: 'sem_retorno' });
      return;
    }
    const delay = truth.sev === 'vermelho' ? 18 + Math.floor(randOf(this.st) * 20) : 60 + Math.floor(randOf(this.st) * 60);
    if (truth.sev === 'vermelho') this.schedule(this.sh.time + delay, 'followup', call.id, { reason: 'dispensa' });
    else this.schedule(Math.min(this.sh.time + delay, this.sh.end - 1), 'reveal', call.id, { reason: 'dispensa_amarelo' });
  }

  // ---------------------------------------------------------------------------
  // frota
  // ---------------------------------------------------------------------------
  dispatch(unit: UnitState, call: CallRT, second: boolean, target?: [number, number]) {
    const sh = this.sh;
    const def = this.defOf(call);
    const tgt = target ?? addressTarget(def.addr);
    const from = this.unitPos(unit);
    const r = route(from, tgt, this.floodMode(), sh.time);
    unit.status = 'DESLOC';
    unit.path = r.path;
    unit.t0 = sh.time;
    unit.t1 = sh.time + r.minutes;
    unit.callId = call.id;
    unit.target = tgt;
    unit.until = unit.t1;
    call.units.push(unit.id);
    if (!this.tarm) {
      // QRR pela viatura (1.1, pedido do jogador): USA = QRR 3; USB urgente (vermelho/amarelo) = QRR 2; USB sem urgência = QRR 1
      const col = call.decision?.color;
      const qrr = unit.type === 'USA' ? 'QRR 3' : col === 'vermelho' || col === 'amarelo' ? 'QRR 2' : 'QRR 1';
      this.radio(unit.radioName, `${unit.label} de QAP. QSL, ${qrr}: QTY para ${def.addr.rua}, ${def.addr.bairro}.`, 'info', call.id);
    }
    if (r.blocked) this.radio(unit.radioName, `${unit.label}: rota bloqueada pela água, vamos tentar contornar. Vai demorar.`, 'alerta');
    this.schedule(unit.t1, 'unit', unit.id, { phase: second ? 'arrive2' : 'arrive', callId: call.id });
    this.emit({ type: 'unit', id: unit.id, status: unit.status });
  }

  private moveUnit(unit: UnitState, to: [number, number], status: UnitStatus, phase: string, callId?: string) {
    const from = this.unitPos(unit);
    const r = route(from, to, this.floodMode(), this.sh.time);
    unit.status = status;
    unit.path = r.path;
    unit.t0 = this.sh.time;
    unit.t1 = this.sh.time + r.minutes;
    unit.target = to;
    unit.until = unit.t1;
    this.schedule(unit.t1, 'unit', unit.id, { phase, callId });
    this.emit({ type: 'unit', id: unit.id, status });
    return r.minutes;
  }

  setUnit(id: string, status: UnitStatus, until?: number, note?: string) {
    const u = this.sh.units[id];
    if (!u) return;
    u.pos = this.unitPos(u);
    u.path = [];
    u.status = status;
    u.until = until;
    u.note = note;
    if (until !== undefined && (status === 'PANE' || status === 'RETIDO' || status === 'FORA')) {
      this.schedule(until, 'unit', id, { phase: status === 'RETIDO' ? 'released' : 'repaired', token: this.sh.seq + 1 });
      (u as UnitState & { token?: number }).token = this.sh.seq;
    }
    if (status === 'QRV') {
      const p = landmarkPos(u.base);
      u.pos = [p[0], p[1]];
      u.callId = undefined;
      if (u.type === 'USA') this.checkAwaits();
    }
    this.emit({ type: 'unit', id, status });
  }

  private onUnit(id: string, data: { phase: string; callId?: string; token?: number }) {
    const u = this.sh.units[id];
    if (!u) return;
    const call = data.callId ? this.sh.calls[data.callId] : undefined;
    switch (data.phase) {
      case 'arrive': {
        if (u.status !== 'DESLOC' || u.callId !== data.callId) return;
        u.pos = u.target ?? u.pos;
        u.path = [];
        u.status = 'LOCAL';
        if (call) this.onScene(u, call);
        return;
      }
      case 'arrive2': {
        if (u.status !== 'DESLOC' || u.callId !== data.callId) return;
        u.pos = u.target ?? u.pos;
        u.path = [];
        u.status = 'LOCAL';
        if (call) this.onSecondArrival(u, call);
        return;
      }
      case 'leave': {
        if (u.status !== 'LOCAL' || u.callId !== data.callId) return;
        if (call && this.needsTransport(call)) {
          const dest = call.decision?.dest ?? this.defaultDest(call);
          u.dest = dest;
          this.moveUnit(u, landmarkPos(destLandmark(dest).id), 'TRANSP', 'hospital', call.id);
        } else this.returnToBase(u);
        return;
      }
      case 'hospital': {
        if (u.status !== 'TRANSP') return;
        if (data.callId && u.callId && u.callId !== data.callId) return;
        u.pos = u.target ?? u.pos;
        u.path = [];
        if (call) this.onHospital(u, call);
        return;
      }
      case 'released': {
        if (u.status !== 'RETIDO') return;
        this.returnToBase(u);
        return;
      }
      case 'repaired': {
        if (u.status !== 'PANE' && u.status !== 'FORA') return;
        this.returnToBase(u);
        return;
      }
      case 'base': {
        if (u.status !== 'RETORNO') return;
        this.setUnit(u.id, 'QRV');
        return;
      }
      case 'handoff': {
        if (u.status !== 'TRANSP' || u.callId !== data.callId) return;
        this.returnToBase(u);
        return;
      }
    }
  }

  returnToBase(u: UnitState) {
    u.callId = undefined;
    u.dest = undefined;
    u.note = undefined;
    this.moveUnit(u, landmarkPos(u.base), 'RETORNO', 'base');
    if (u.type === 'USA') this.checkAwaits();
  }

  /** pedidos de "mandar a primeira USA que liberar" */
  checkAwaits() {
    const sh = this.sh;
    for (const key of Object.keys(sh.flags)) {
      if (!key.startsWith('await_usa_') || !sh.flags[key]) continue;
      const callId = key.slice('await_usa_'.length);
      const call = sh.calls[callId];
      if (!call || call.outcome === 'salvo' || call.outcome === 'obito') {
        delete sh.flags[key];
        continue;
      }
      const usa = this.availableUnits('USA').sort((a, b) => this.etaFor(a.id, call) - this.etaFor(b.id, call))[0];
      if (!usa) return;
      delete sh.flags[key];
      sh.usaSent++;
      sh.costToday += COST_USA;
      const eta = this.etaFor(usa.id, call);
      this.radio(usa.radioName, `${usa.label} liberada. Indo direto para ${this.defOf(call).patient.name}: rendez-vous com a equipe no local.`, 'ok', call.id);
      const tgt = addressTarget(this.defOf(call).addr);
      this.dispatch(usa, call, true, tgt);
      usa.t1 = sh.time + Math.max(2, Math.round(eta * 0.6));
      usa.until = usa.t1;
      this.schedule(usa.t1, 'unit', usa.id, { phase: 'arrive2', callId: call.id });
      this.st.flags['rendezvous_usado'] = true;
      this.st.flags['rendezvous_d' + this.st.day] = true;
    }
  }

  private needsTransport(call: CallRT): boolean {
    const t = this.truthOf(call);
    if (t.sev === 'trote') return false;
    if (call.outcome === 'obito' || call.outcome === 'liberado') return false;
    if (call.verdict?.kind === 'excesso' && t.sev !== 'amarelo' && t.sev !== 'vermelho') return false;
    return t.sev === 'vermelho' || t.sev === 'amarelo';
  }

  private defaultDest(call: CallRT): Dest {
    const t = this.truthOf(call);
    if (t.dest?.length) return t.dest[0];
    return t.sev === 'vermelho' ? 'REG' : 'UPA';
  }

  private sceneMinutes(u: UnitState, call: CallRT): number {
    const t = this.truthOf(call);
    if (t.sev === 'trote') return 6;
    if (call.verdict?.kind === 'excesso') return 12;
    return (u.type === 'USA' ? 24 : 18) + Math.floor(randOf(this.st) * 8);
  }

  /** chegada da primeira viatura à cena: revelação do resultado */
  private onScene(u: UnitState, call: CallRT) {
    const def = this.defOf(call);
    const t = this.truthOf(call);
    const v = call.verdict!;
    const c = this.ctx();
    if (def.mci) {
      this.radio(u.radioName, `${u.label} no Parque de Exposições. Embarcando vítima.`, 'info', call.id);
      this.schedule(this.sh.time + 12, 'unit', u.id, { phase: 'leave', callId: call.id });
      return;
    }
    const R = def.radio ?? {};
    const from = u.radioName;
    const tag = (s: string) => this.radioText(s, u, call);
    if (t.sev === 'trote') {
      this.radio(from, tag(txt(R.prank, c) || DEFAULT_RADIO.prank), 'alerta', call.id);
      call.outcome = 'trote';
      this.revealVerdict(call);
      this.schedule(this.sh.time + this.sceneMinutes(u, call), 'unit', u.id, { phase: 'leave', callId: call.id });
      return;
    }
    // segurança
    if (v.safety) {
      const missingBomb = (t.sup ?? []).includes('BOMB') && !(call.decision?.support ?? []).includes('BOMB');
      const missingPm = (t.sup ?? []).includes('PM') && !(call.decision?.support ?? []).includes('PM');
      const dflt = missingBomb && !missingPm ? DEFAULT_RADIO.unsafeBomb : DEFAULT_RADIO.unsafe;
      this.radio(from, tag(txt(R.unsafe, c) || dflt), 'alerta', call.id);
      this.revealVerdict(call);
      // equipe recua, espera a PM: +20 min
      call.careAt = undefined;
      this.schedule(this.sh.time + 20, 'unit', u.id, { phase: 'leave', callId: call.id });
      this.evaluateCare(call, this.sh.time + 20, u.type);
      return;
    }
    const needs = t.risk?.needs ?? (t.sev === 'vermelho' ? 'USA' : t.sev === 'amarelo' ? 'USB' : undefined);
    if (u.type === 'USB' && needs === 'USA') {
      // subestimado: pede apoio avançado
      this.radio(from, tag(txt(R.under, c) || DEFAULT_RADIO.under), 'pedido', call.id);
      this.revealVerdict(call);
      this.underRequest(u, call);
      this.schedule(this.sh.time + this.sceneMinutes(u, call), 'unit', u.id, { phase: 'leave', callId: call.id });
      return;
    }
    if (v.kind === 'excesso') {
      this.radio(from, tag(txt(R.excess, c) || (u.type === 'USA' ? DEFAULT_RADIO.excessUSA : DEFAULT_RADIO.excessUSB)), 'alerta', call.id);
      call.outcome = 'liberado';
      this.revealVerdict(call);
      this.writeDiary(call, 'vivo');
      if (t.key) this.eff().keyPatient(t.key, 'salvo');
      if (def.onResolve) def.onResolve(this.eff(), { outcome: call.outcome, verdict: call.verdict, decision: call.decision });
      this.schedule(this.sh.time + this.sceneMinutes(u, call), 'unit', u.id, { phase: 'leave', callId: call.id });
      return;
    }
    // cuidado adequado chegou
    this.revealVerdict(call);
    this.evaluateCare(call, this.sh.time, u.type, u);
    this.schedule(this.sh.time + this.sceneMinutes(u, call), 'unit', u.id, { phase: 'leave', callId: call.id });
  }

  private onSecondArrival(u: UnitState, call: CallRT) {
    // USA de apoio chegou (após USB) ou rendez-vous
    this.evaluateCare(call, this.sh.time, 'USA', u);
    this.schedule(this.sh.time + 14, 'unit', u.id, { phase: 'leave', callId: call.id });
  }

  private onHospital(u: UnitState, call: CallRT) {
    const t = this.truthOf(call);
    const dest = u.dest ?? 'REG';
    const def = this.defOf(call);
    if (call.verdict?.destWrong && !(call as CallRT & { destNoted?: boolean }).destNoted) {
      (call as CallRT & { destNoted?: boolean }).destNoted = true;
      const right = t.dest?.[0] ?? 'REG';
      const text = txt(def.radio?.dest, this.ctx()) || `Central, ${u.label} no ${destLandmark(dest).short}. Não é perfil daqui: vão transferir pro ${destLandmark(right).short}. Perdemos tempo.`;
      this.radio(u.radioName, this.radioText(text, u, call), 'alerta', call.id);
    }
    // retenção de maca
    let ret = 25 + Math.floor(randOf(this.st) * 55);
    if (dest === 'REG' && this.sh.noVacancy && !(call as CallRT & { vagaZero?: boolean }).vagaZero) {
      ret += 60;
      this.makeRequest({
        kind: 'vaga',
        from: u.radioName,
        text: `Central, ${u.label} na porta do Regional. Sem vaga, sem maca. Paciente ${t.sev === 'vermelho' ? 'grave' : 'estável'} na nossa prancha.`,
        options: [
          { id: 'vagazero', label: 'Ligar e negociar "vaga zero" (10 min)', cost: 10 },
          { id: 'upa', label: 'Desviar para a UPA Norte' },
          { id: 'aguardar', label: 'Aguardar liberação' },
        ],
        defaultOpt: 'aguardar',
        callId: call.id,
        data: { unit: u.id },
        timeout: 8,
      });
    }
    u.status = 'RETIDO';
    u.until = this.sh.time + ret;
    u.note = `Retenção de maca · ${destLandmark(dest).short}`;
    this.schedule(u.until, 'unit', u.id, { phase: 'released' });
    if (call.outcome === 'pendente' || call.outcome === 'salvo') call.outcome = call.outcome === 'pendente' ? 'transportado' : 'salvo';
    if (ret > 70 && randOf(this.st) < 0.35 && !this.sh.requests.some((r) => r.kind === 'retencao')) {
      this.makeRequest({
        kind: 'retencao',
        from: u.radioName,
        text: `Central, ${u.label} retida no ${destLandmark(dest).short}. Sem maca, paciente na nossa. Previsão... não tem previsão.`,
        options: [
          { id: 'negociar', label: 'Ligar pro hospital e negociar (15 min)', cost: 15 },
          { id: 'esperar', label: 'Não ligar' },
        ],
        defaultOpt: 'esperar',
        data: { unit: u.id },
        timeout: 10,
      });
    }
    this.emit({ type: 'unit', id: u.id, status: u.status });
  }

  // ---------------------------------------------------------------------------
  // pedidos de rádio (mão dupla)
  // ---------------------------------------------------------------------------
  makeRequest(p: Omit<PendingRequest, 'id' | 't' | 'expires'> & { timeout?: number; silent?: boolean }) {
    const id = 'rq' + ++this.sh.seq;
    const R = (x: string) => resolveTokens(x, this.st.gender, this.st);
    const req: PendingRequest = { ...p, text: R(p.text), options: p.options.map((o) => ({ ...o, label: R(o.label) })), id, t: this.sh.time, expires: this.sh.time + Math.max(12, Math.round((p.timeout ?? 6) * 2)) };
    // (prazo dobrado, mínimo de 12 min de jogo: com ligação em andamento, 4 a 6 min não davam nem para ler o pedido)
    if (this.tarm) {
      // a IA da mesa responde o rádio sozinha
      req.defaultOpt = this.aiRequestChoice(req);
      req.expires = this.sh.time + 1;
    }
    delete (req as PendingRequest & { timeout?: number }).timeout;
    delete (req as PendingRequest & { silent?: boolean }).silent;
    this.sh.requests.push(req);
    this.schedule(req.expires, 'request', id);
    if (!p.silent) this.radio(p.from, p.text, 'pedido', p.callId);
    this.emit({ type: 'request', id });
    return id;
  }

  private underRequest(u: UnitState, call: CallRT) {
    const usa = this.availableUnits('USA');
    const opts: PendingRequest['options'] = [];
    if (usa.length) {
      opts.push({ id: 'usa', label: `Mandar ${usa[0].label} (mais uma viatura)` });
      opts.push({ id: 'rdv', label: 'Rendez-vous: USB acelera e encontra a USA no caminho' });
    } else {
      opts.push({ id: 'aguardar', label: 'Sem USA livre: mandar a primeira que liberar' });
    }
    opts.push({ id: 'seguir', label: 'Seguir com a USB até o hospital' });
    this.makeRequest({ kind: 'piora', from: u.radioName, text: `${u.label} pede suporte avançado para ${this.defOf(call).patient.name}.`, options: opts, defaultOpt: usa.length ? 'usa' : 'seguir', callId: call.id, data: { unit: u.id }, timeout: 4, silent: true });
  }

  answerRequest(id: string, opt: string) {
    const sh = this.sh;
    const idx = sh.requests.findIndex((r) => r.id === id);
    if (idx < 0) return;
    const req = sh.requests[idx];
    sh.requests.splice(idx, 1);
    const o = req.options.find((x) => x.id === opt);
    this.radio('VOCÊ', o ? o.label : opt, 'info');
    this.applyRequest(req, opt);
    if (o?.cost) this.advance(o.cost);
  }

  private onRequestExpire(id: string) {
    const req = this.sh.requests.find((r) => r.id === id);
    if (!req) return;
    this.sh.requests = this.sh.requests.filter((r) => r.id !== id);
    if (this.tarm) this.radio('REGULAÇÃO', req.options.find((o) => o.id === req.defaultOpt)?.label ?? '', 'info');
    else this.radio('SISTEMA', `Sem resposta da central. ${req.options.find((o) => o.id === req.defaultOpt)?.label ?? ''}`, 'info');
    this.applyRequest(req, req.defaultOpt);
  }

  private applyRequest(req: PendingRequest, opt: string) {
    const sh = this.sh;
    const call = req.callId ? sh.calls[req.callId] : undefined;
    const unitId = req.data?.unit as string | undefined;
    const u = unitId ? sh.units[unitId] : undefined;
    switch (req.kind) {
      case 'piora': {
        if (!call || !u) return;
        if (opt === 'usa' || opt === 'rdv') {
          const usa = this.availableUnits('USA').sort((a, b) => this.etaFor(a.id, call) - this.etaFor(b.id, call))[0];
          if (!usa) {
            this.applyRequest(req, 'seguir');
            return;
          }
          sh.usaSent++;
          sh.costToday += COST_USA;
          if (opt === 'rdv') {
            const eta = this.etaFor(usa.id, call);
            const meet = Math.max(2, Math.round(eta * 0.55));
            // USB sai em direção ao hospital; USA vai ao ponto de encontro
            const tgt = addressTarget(this.defOf(call).addr);
            const usaPos = this.unitPos(usa);
            const mid: [number, number] = [Math.round((tgt[0] + usaPos[0]) / 2), Math.round((tgt[1] + usaPos[1]) / 2)];
            this.dispatch(usa, call, true, mid);
            usa.t1 = sh.time + meet;
            usa.until = usa.t1;
            // reagenda chegada
            this.schedule(usa.t1, 'unit', usa.id, { phase: 'arrive2', callId: call.id });
            this.sh.flags['rdv_' + call.id] = true;
            this.st.flags['rendezvous_usado'] = true;
            this.radio(u.radioName, `${u.label}: entendido, saindo com o paciente. Ponto de encontro marcado no mapa.`, 'info', call.id);
            if (u.status === 'LOCAL') this.returnToBaseLater(u, meet);
          } else {
            this.dispatch(usa, call, true);
          }
        } else if (opt === 'aguardar') {
          sh.flags['await_usa_' + call.id] = true;
        } else {
          // segue com a USB até o hospital
          const eta = route(this.unitPos(u), landmarkPos(destLandmark(call.decision?.dest ?? 'REG').id), this.floodMode(), sh.time).minutes;
          this.evaluateCare(call, sh.time + eta + 18, 'USA');
        }
        return;
      }
      case 'retencao': {
        if (!u || u.status !== 'RETIDO') return;
        if (opt === 'negociar') {
          u.until = Math.min(u.until ?? sh.time, sh.time + 15);
          this.schedule(u.until, 'unit', u.id, { phase: 'released' });
          this.radio(u.radioName, `${u.label}: conseguiram uma maca. Liberados.`, 'ok');
        }
        return;
      }
      case 'vaga': {
        if (!u || !call) return;
        if (opt === 'vagazero') {
          (call as CallRT & { vagaZero?: boolean }).vagaZero = true;
          u.until = sh.time + 15;
          this.schedule(u.until, 'unit', u.id, { phase: 'released' });
          this.radio('REGULAÇÃO', 'Vaga zero autorizada no Regional. Paciente recebido no corredor da emergência.', 'ok');
          this.st.flags['vaga_zero_negociada'] = true;
        } else if (opt === 'upa') {
          const t = this.truthOf(call);
          if (t.sev === 'vermelho') {
            this.addPenalty('nota', 'Paciente grave desviado para a UPA (destino inadequado).');
          }
          this.moveUnit(u, landmarkPos('upa'), 'TRANSP', 'hospital', call.id);
          u.dest = 'UPA';
        }
        return;
      }
      case 'timeline': {
        if (req.data?.inline) {
          const opts = this.inlineReqs.get(req.id) ?? [];
          const io = opts.find((x) => x.id === opt);
          if (io?.effect) io.effect(this.timelineCtx());
          if (io?.reply) this.radio(req.from, resolveTokens(txt(io.reply, this.ctx()), this.st.gender, this.st), 'info');
          this.inlineReqs.delete(req.id);
          return;
        }
        const tl = this.day.timeline?.find((t, i) => (t.id ?? `tl${i}`) === req.timelineId);
        const o = tl?.options?.find((x) => x.id === opt);
        if (o?.effect) o.effect(this.timelineCtx());
        if (o?.reply) this.radio(tl?.who ?? 'RÁDIO', txt(o.reply, this.ctx()), 'info');
        return;
      }
      default:
        return;
    }
  }

  private returnToBaseLater(u: UnitState, after: number) {
    u.status = 'TRANSP';
    u.until = this.sh.time + after;
    // entrega o paciente à USA no ponto de encontro e volta para a base (sem isso a USB ficava em TRANSP para sempre)
    this.schedule(u.until, 'unit', u.id, { phase: 'handoff', callId: u.callId });
  }

  // ---------------------------------------------------------------------------
  // desfecho clínico
  // ---------------------------------------------------------------------------
  /**
   * Escala das janelas de risco. O relógio do jogo é comprimido (1 s real = 1 min) e uma
   * ligação bem conduzida leva de 60 a 90 minutos de jogo, muito mais do que os 1 a 3
   * minutos da vida real; as janelas escritas no conteúdo são multiplicadas por este fator
   * para que a ordem de grandeza entre conversa, deslocamento e piora continue coerente.
   * Calibrado com os perfis de bot (docs/BALANCEAMENTO.md).
   */
  riskScale(): number {
    return RISK_SCALE[this.st.difficulty] ?? RISK_SCALE.padrao;
  }

  survival(t: TruthDef, elapsed: number, guideBonus: number): number {
    if (t.inevitable) return 0;
    if (!t.risk) return 1;
    const k = this.riskScale();
    const good = t.risk.good * k + guideBonus;
    const bad = t.risk.bad * k + guideBonus;
    if (elapsed <= good) return 1;
    if (elapsed >= bad) return 0;
    return 1 - (elapsed - good) / (bad - good);
  }

  /** cuidado adequado chegou (ou estimado) no tempo `at` */
  evaluateCare(call: CallRT, at: number, level: 'USA' | 'USB', unit?: UnitState) {
    if (call.outcome === 'salvo' || call.outcome === 'obito' || call.outcome === 'sequela') return;
    // orientação ainda em curso: avalia quando o minijogo terminar (o bônus da orientação conta)
    if (call.guide && !call.guide.done && this.sh.guideCallId === call.id) {
      (call as CallRT & { deferCare?: { at: number; level: 'USA' | 'USB'; unit?: string } }).deferCare = { at, level, unit: unit?.id };
      return;
    }
    const t = this.truthOf(call);
    const def = this.defOf(call);
    const c = this.ctx();
    const R = def.radio ?? {};
    const needs = t.risk?.needs ?? (t.sev === 'vermelho' ? 'USA' : 'USB');
    if (needs === 'USA' && level === 'USB') return; // ainda não é o cuidado adequado
    call.careAt = at;
    const elapsed = this.riskElapsed(call, at);
    const gq = call.guide?.done ? call.guide.quality ?? 0 : 0;
    const bonus = (t.risk?.guideBonus ?? 0) * gq;
    const p = this.survival(t, elapsed, bonus);
    const roll = randOf(this.st);
    const tu = unit ?? (call.units.length ? this.sh.units[call.units[call.units.length - 1]] : undefined);
    const from = tu?.radioName ?? 'RÁDIO';
    const tag = (s: string) => (tu ? this.radioText(s, tu, call) : this.radioTextNoUnit(s, call));
    if (t.sev === 'vermelho' && (roll >= p || t.inevitable)) {
      call.outcome = 'obito';
      const deadTxt = txt(R.dead, c) || DEFAULT_RADIO.dead;
      if (at <= this.sh.time + 0.01) this.radio(from, tag(deadTxt), 'obito', call.id);
      else this.schedule(at, 'death', call.id, { text: tag(deadTxt), from });
      let myFault = !!call.verdict && (call.verdict.kind === 'falta' || call.verdict.kind === 'dispensou' || call.verdict.safety);
      // recurso abaixo do necessário só abre sindicância se a decisão certa, na mesma hora, teria salvado
      if (myFault && call.verdict?.kind === 'falta' && !call.verdict.safety) {
        const idealAt = (call.decision?.t ?? call.answered ?? call.arrived) + 12;
        if (this.survival(t, this.riskElapsed(call, idealAt), bonus) < 0.35) myFault = false;
      }
      this.registerDeath(call, myFault || !!call.mismanaged, t.inevitable ? 'inevitável' : 'demora');
      if (call.mismanaged && !myFault) this.addPenalty('advertencia', 'Óbito por má gestão de frota (USA em caso leve).');
      return;
    }
    if (t.sev === 'amarelo' && t.risk && elapsed > t.risk.bad * this.riskScale()) {
      call.outcome = 'sequela';
      this.radio(from, tag(txt(R.late, c) || DEFAULT_RADIO.late), 'alerta', call.id);
      this.writeDiary(call, 'sequela');
      return;
    }
    call.outcome = 'salvo';
    const worsened = call.worsenIdx > 0 || (!!call.guide && (this.c.guides[call.guide.id]?.kind === 'rcp' || call.guide.id === 'desengasgo_rcp'));
    const okTxt = worsened ? txt(R.saved, c) || txt(R.ok, c) || DEFAULT_RADIO.saved : txt(R.ok, c) || (level === 'USA' ? DEFAULT_RADIO.okUSA : DEFAULT_RADIO.okUSB);
    // chegada bem-sucedida sai na cor comum do rádio (cor própria entregava o desfecho antes da auditoria)
    if (at <= this.sh.time + 0.01) this.radio(from, tag(okTxt), 'ok', call.id);
    else this.schedule(at, 'death', call.id, { text: tag(okTxt), from, saved: true });
    if (t.sev === 'vermelho' && t.risk) {
      this.sh.saves.push(call.id);
      this.st.totals.saves++;
      this.emit({ type: 'saved', callId: call.id, name: def.patient.name });
      if (call.guide?.done && this.c.guides[call.guide.id]?.kind === 'rcp' && call.guide.success) {
        this.addBonus(20, 'RCP guiada com sobrevivência');
        this.eff().achievement('contou_bonito');
      }
    }
    if (unit?.id === 'USA01' && (call.verdict?.kind === 'correto' || call.verdict?.kind === 'defensavel')) {
      this.st.vars.intimBene = clamp(this.st.vars.intimBene + 1, 0, 10);
    }
    if (t.key) this.eff().keyPatient(t.key, 'salvo');
    this.writeDiary(call, 'vivo');
    if (def.onResolve) def.onResolve(this.eff(), { outcome: call.outcome, verdict: call.verdict, decision: call.decision });
  }

  private onScheduledOutcome(id: string, data?: Record<string, unknown>) {
    const call = this.sh.calls[id];
    if (!call || !data) return;
    this.radio(String(data.from ?? 'RÁDIO'), this.radioTextNoUnit(String(data.text ?? ''), call), data.saved ? 'ok' : 'obito', id);
  }

  registerDeath(call: CallRT, myFault: boolean, why: string) {
    const def = this.defOf(call);
    const t = this.truthOf(call);
    this.sh.deaths.push(call.id);
    this.st.totals.deaths++;
    const e = this.eff();
    // óbito pesa mais quando foi erro seu; a demora da fila também pesa, mas menos
    e.add('desgaste', myFault ? 10 : 6, 'óbito');
    if (myFault) {
      this.sh.sindicancias++;
      this.st.totals.sindicancias++;
      this.toast('Sindicância aberta.', 'ruim');
      if (this.st.totals.sindicancias >= 2) {
        this.gameOver('sindicancia');
      }
    }
    if (t.key) e.keyPatient(t.key, 'perdido');
    this.writeDiary(call, 'morto', why);
    if (def.onResolve) def.onResolve(e, { outcome: 'obito', verdict: call.verdict, decision: call.decision });
    this.emit({ type: 'death', callId: call.id, name: def.patient.name });
  }

  writeDiary(call: CallRT, kind: 'vivo' | 'morto' | 'sequela' | 'orientado', why?: string) {
    const def = this.defOf(call);
    const t = this.truthOf(call);
    const c = this.ctx();
    const id = call.gen ? call.id : def.id;
    if (this.st.diary.some((d) => d.id === id)) {
      const e = this.st.diary.find((d) => d.id === id)!;
      if (kind === 'morto' && e.kind !== 'morto') {
        e.kind = 'morto';
        e.text = txt(def.diary?.dead, c) || `${t.dx}. Óbito${why ? ' (' + why + ')' : ''}.`;
      }
      return;
    }
    const p = def.patient;
    const name = `${p.name}${p.age ? ', ' + p.age : ''}`;
    let text = '';
    if (kind === 'morto') text = txt(def.diary?.dead, c) || `${t.dx}. Óbito${why ? ' (' + why + ')' : ''}.`;
    else if (kind === 'orientado') text = txt(def.diary?.ori, c) || `${t.dx}. Orientado(a) por telefone.`;
    else if (kind === 'sequela') text = txt(def.diary?.sequela, c) || `${t.dx}. Sobreviveu, com sequelas da demora.`;
    else text = txt(def.diary?.alive, c) || `${t.dx}. Vivo(a).`;
    this.st.diary.push({ id, day: this.st.day, name, text: resolveTokens(text, this.st.gender, this.st), kind: kind === 'vivo' ? 'vivo' : kind === 'morto' ? 'morto' : kind === 'sequela' ? 'sequela' : 'orientado', updates: [], callDef: def.id });
  }

  // ---------------------------------------------------------------------------
  // revelação e penalidades
  // ---------------------------------------------------------------------------
  revealVerdict(call: CallRT) {
    const v = call.verdict;
    if (!v || v.revealed) return;
    v.revealed = true;
    call.revealedAt = this.sh.time;
    const def = this.defOf(call);
    const t = this.truthOf(call);
    for (let i = 0; i < v.warnings; i++) this.addPenalty('advertencia', v.text);
    for (let i = 0; i < v.notes; i++) this.addPenalty('nota', v.text);
    if (v.bonus > 0) this.addBonus(v.bonus, `${def.patient.name}: ${v.kind === 'trote_ok' ? 'trote' : 'regulação'}`);
    if (v.golden) {
      this.sh.goldenCount++;
      this.st.totals.golden++;
    }
    if (v.kind === 'trote_ok') this.st.totals.pranks++;
    this.emit({ type: 'verdict', callId: call.id, kind: v.kind, sev: t.sev });
  }

  addPenalty(kind: 'nota' | 'advertencia', text: string) {
    const sh = this.sh;
    if (this.tarm) {
      // penalidades da mesa de regulação: registradas, sem efeito sobre a TARM
      if (kind === 'nota') sh.notes++;
      else sh.warnings++;
      return;
    }
    if (kind === 'nota') {
      sh.notes++;
      this.st.totals.notes++;
      sh.deductions += NOTE_COST;
      this.st.vars.desgaste = clamp(this.st.vars.desgaste + 1, 0, 100);
      this.toast('Nota de auditoria (−R$ 10)', 'ruim');
    } else {
      sh.warnings++;
      this.st.totals.warnings++;
      sh.deductions += WARNING_COST;
      this.st.vars.desgaste = clamp(this.st.vars.desgaste + 3, 0, 100);
      this.toast('ADVERTÊNCIA (−R$ 20)', 'ruim');
    }
    this.emit({ type: 'penalty', kind, text });
    if (this.effectiveWarnings() >= this.warningLimit()) this.gameOver('exonerado');
    if (this.st.vars.desgaste >= 100) this.gameOver('colapso');
  }

  effectiveWarnings(): number {
    return this.sh.warnings + Math.floor(this.sh.notes / 2);
  }
  warningLimit(): number {
    return this.st.difficulty === 'real' ? 2 : 3;
  }

  addBonus(v: number, reason: string) {
    this.sh.bonusRaw += v;
    if (this.tarm) return;
    this.toast(`+R$ ${v} · ${reason}`, 'dinheiro');
  }

  gameOver(kind: 'exonerado' | 'despejo' | 'colapso' | 'sindicancia') {
    if (this.st.gameOver) return;
    if (this.tarm) return;
    if (this.st.mode === 'infinito' && kind !== 'exonerado' && kind !== 'colapso') return;
    this.st.gameOver = { kind, day: this.st.day, text: '' };
    this.emit({ type: 'gameover', kind });
  }

  reportItem(call: CallRT, verdict: ReportItem['verdict'], money: number, text: string): ReportItem {
    const def = this.defOf(call);
    const t = this.truthOf(call);
    return {
      callId: call.id,
      name: def.patient.name + (def.patient.age ? `, ${def.patient.age}` : ''),
      dx: t.sev === 'trote' ? 'Trote' : call.dxAtStamp ?? t.dx,
      decision: call.decision ? decisionLabel(call.decision) : '—',
      verdict,
      money,
      text,
      outcome: call.outcome,
      t: call.arrived,
    };
  }

  radioText(s: string, u: UnitState, call: CallRT): string {
    const def = this.defOf(call);
    const t = this.truthOf(call);
    const central = u.id === 'USA01' ? beneForm(this.st) : 'Central';
    return resolveTokens(
      s
        .replace(/\{central\}/g, central)
        .replace(/\{unit\}/g, u.label)
        .replace(/\{Dx\}/g, capFirst(t.dx))
        .replace(/\{dx\}/g, t.dx.charAt(0).toLowerCase() + t.dx.slice(1))
        .replace(/\{name\}/g, def.patient.name)
        .replace(/\{hora\}/g, fmtTime(this.sh.time))
        .replace(/\{dest\}/g, destLandmark(call.decision?.dest ?? this.defaultDest(call)).short),
      this.st.gender,
      this.st,
    );
  }

  radioTextNoUnit(s: string, call: CallRT): string {
    const def = this.defOf(call);
    const t = this.truthOf(call);
    return resolveTokens(
      s
        .replace(/\{central\}/g, 'Central')
        .replace(/\{unit\}/g, 'a equipe')
        .replace(/\{Dx\}/g, capFirst(t.dx))
        .replace(/\{dx\}/g, t.dx.charAt(0).toLowerCase() + t.dx.slice(1))
        .replace(/\{name\}/g, def.patient.name)
        .replace(/\{hora\}/g, fmtTime(this.sh.time))
        .replace(/\{dest\}/g, destLandmark(call.decision?.dest ?? this.defaultDest(call)).short),
      this.st.gender,
      this.st,
    );
  }

  radio(from: string, text: string, kind: RadioKind = 'info', callId?: string) {
    const msg = { id: ++this.sh.radioSeq, t: this.sh.time, from, text: resolveTokens(text, this.st.gender, this.st), kind, callId };
    this.sh.radio.push(msg);
    if (this.sh.radio.length > 80) this.sh.radio.splice(0, this.sh.radio.length - 80);
    this.emit({ type: 'radio', msg });
  }

  // ---------------------------------------------------------------------------
  // retornos e auditorias
  // ---------------------------------------------------------------------------
  private onFollowup(id: string, data?: Record<string, unknown>) {
    const call = this.sh.calls[id];
    if (!call) return;
    const def = this.defOf(call);
    const t = this.truthOf(call);
    const reason = data?.reason;
    if (reason === 'dispensa') {
      // reabre na fila, a verdade se revela
      this.revealVerdict(call);
      call.status = 'fila';
      call.decision = undefined;
      call.followOf = 'retorno';
      call.answered = undefined;
      call.lines.push({ id: this.nextLineId(call), who: 'SISTEMA', text: `RETORNO às ${fmtTime(this.sh.time)} — ligou de novo.`, kind: 'sistema', t: this.sh.time });
      call.noteText = 'LIGOU DE NOVO. Diz que piorou muito.';
      call.noteRight = true;
      call.noteUrgent = true;
      call.noteBox = simoneBox(def, t);
      this.pushLines(call, txt(def.radio?.dismissed, this.ctx()) || DEFAULT_FOLLOWUP[t.sev === 'vermelho' ? 'vermelho' : 'amarelo'], def);
      call.verdict = { ...call.verdict!, revealed: true };
      (call as CallRT & { reopened?: boolean }).reopened = true;
      this.emit({ type: 'ring', callId: id });
      return;
    }
    if (reason === 'irritado') {
      call.status = 'fila';
      call.answered = undefined;
      call.patience = 60;
      call.noteText = 'Ligou de novo. Muito nervoso(a).';
      call.lines.push({ id: this.nextLineId(call), who: 'SISTEMA', text: `RETORNO às ${fmtTime(this.sh.time)}.`, kind: 'sistema', t: this.sh.time });
      this.emit({ type: 'ring', callId: id });
    }
  }

  private onReveal(id: string, data?: Record<string, unknown>) {
    const call = this.sh.calls[id];
    if (!call) return;
    if (data?.reason === 'sem_retorno') {
      this.revealVerdict(call);
      const t = this.truthOf(call);
      if (t.sev === 'vermelho') {
        call.outcome = 'obito';
        this.registerDeath(call, true, 'sem atendimento');
        const nr = txt(this.defOf(call).radio?.noReturn, this.ctx());
        this.radio('SIMONE', nr || `{dr}... a PM foi até ${this.defOf(call).addr.rua}. Chegaram tarde.`, 'obito', id);
      } else {
        call.outcome = 'piorou';
        this.writeDiary(call, 'sequela');
        const def = this.defOf(call);
        if (t.key) this.eff().keyPatient(t.key, 'perdido');
        if (def.onResolve) def.onResolve(this.eff(), { outcome: call.outcome, verdict: call.verdict, decision: call.decision });
      }
      return;
    }
    if (data?.reason === 'dispensa_amarelo') {
      const def = this.defOf(call);
      this.revealVerdict(call);
      call.outcome = 'piorou';
      this.radio('SIMONE', `{dr}, a UPA avisou: ${def.patient.name} chegou lá por conta própria, piorado. Era caso de viatura.`.replace('{dr}', this.st.gender === 'M' ? 'Doutor' : 'Doutora'), 'alerta', id);
      this.writeDiary(call, 'sequela');
      // como no ramo 'sem_retorno': paciente-chave perdido e o onResolve do conteúdo rodam também aqui
      const t = this.truthOf(call);
      if (t.key) this.eff().keyPatient(t.key, 'perdido');
      if (def.onResolve) def.onResolve(this.eff(), { outcome: call.outcome, verdict: call.verdict, decision: call.decision });
    }
  }

  // ---------------------------------------------------------------------------
  // piora dinâmica
  // ---------------------------------------------------------------------------
  private checkWorsen() {
    for (const id of this.sh.order) {
      const call = this.sh.calls[id];
      if (!call || call.answered === undefined) continue;
      if (call.status !== 'ativa' && call.status !== 'espera' && call.status !== 'regulacao') continue;
      const def = this.defOf(call);
      const ws = def.worsen;
      if (!ws || call.worsenIdx >= ws.length) continue;
      const w = ws[call.worsenIdx];
      const since = this.sh.time - call.answered;
      if (since < w.after) continue;
      if ((w.unless ?? 'decidido') === 'decidido' && call.decision) continue;
      call.worsenIdx++;
      this.pushLines(call, w.lines, def);
      if (w.truth) call.truthPatch = { ...(call.truthPatch ?? {}), ...(typeof w.truth === 'function' ? w.truth(this.ctx()) : w.truth) };
      if (w.resetRisk) {
        call.riskFrom = this.sh.time;
        call.talk = 0;
      }
      if (w.guide) (call as CallRT & { pendingGuide?: string }).pendingGuide = w.guide;
      if (w.onTrigger) w.onTrigger(this.eff());
      this.sysLine(call, '⚠ O QUADRO MUDOU. Reavalie a classificação.');
    }
  }

  // ---------------------------------------------------------------------------
  // orientação ativa (minijogos)
  // ---------------------------------------------------------------------------
  startGuide(call: CallRT, guideId: string, etaMin: number) {
    const script = this.c.guides[guideId];
    if (this.tarm) {
      // o regulador orienta por telefone; a qualidade depende de quem está na mesa
      const q = this.aiGuideQuality(call);
      call.guide = { id: guideId, done: true, quality: q, success: q >= 0.5 };
      this.sysLine(call, `${REG_LABEL[call.tarm?.to ?? 'moura']}: orientação por telefone (${script?.title ?? guideId}).`);
      if (call.decision?.resource === 'ORI') {
        call.outcome = 'orientado';
        this.writeDiary(call, 'orientado');
      }
      call.status = 'encerrada';
      call.closed = this.sh.time;
      void etaMin;
      return;
    }
    call.guide = { id: guideId, done: false };
    call.status = 'guia';
    this.sh.guideCallId = call.id;
    this.sh.activeId = call.id;
    // duração real-alvo do minijogo
    let realSec = 30;
    if (script?.kind === 'rcp') realSec = clamp(18 + etaMin * 1.6, 22, 45);
    else if (script?.kind === 'respiracao') realSec = 28;
    else if (script?.steps) realSec = Math.max(20, script.steps.length * 7);
    const slow = script?.slow;
    const scale = slow ?? (etaMin > 0 ? etaMin / realSec : 0.25);
    this.sh.flags['guideScale'] = clamp(scale, 0.05, 1.2);
    this.sh.flags['guideReal'] = realSec;
    this.emit({ type: 'guide', callId: call.id, start: true });
  }

  finishGuide(quality: number, success: boolean) {
    const sh = this.sh;
    const id = sh.guideCallId;
    if (!id) return;
    const call = sh.calls[id];
    sh.guideCallId = undefined;
    delete sh.flags['guideScale'];
    if (!call) return;
    call.guide = { ...(call.guide ?? { id: '?' }), quality: clamp(quality, 0, 1), done: true, success };
    this.sysLine(call, success ? 'Orientação concluída.' : 'A orientação não saiu como devia.');
    if (call.guide.id === 'acolhimento' && success) this.eff().add('humanidade', 1, 'acolhimento');
    const def = this.defOf(call);
    // ORI com orientação: o desfecho é a própria orientação
    if (call.decision?.resource === 'ORI') {
      call.outcome = 'orientado';
      this.writeDiary(call, 'orientado');
    }
    // se o cuidado já chegou antes do fim, reavalia (bônus da orientação vale para a janela)
    if (call.careAt === undefined && call.units.length) {
      // será avaliado na chegada
    }
    call.status = 'encerrada';
    call.closed = sh.time;
    if (sh.activeId === id) sh.activeId = undefined;
    const dc = (call as CallRT & { deferCare?: { at: number; level: 'USA' | 'USB'; unit?: string } }).deferCare;
    if (dc) {
      delete (call as CallRT & { deferCare?: unknown }).deferCare;
      this.evaluateCare(call, dc.at, dc.level, dc.unit ? sh.units[dc.unit] : undefined);
    }
    this.emit({ type: 'guide', callId: id, start: false });
    void def;
  }

  // ---------------------------------------------------------------------------
  // mesa: café, foto, diário
  // ---------------------------------------------------------------------------
  coffee(): boolean {
    const sh = this.sh;
    if (sh.coffee >= 2) return false;
    sh.coffee++;
    this.st.irritado++;
    this.st.totals.coffee++;
    // com noites seguidas sem dormir, o café segura menos (2 h, 1 h 30, 1 h)
    const dur = (sh.noites ?? 1) >= 3 ? 60 : (sh.noites ?? 1) === 2 ? 90 : 120;
    sh.coffeeUntil = Math.max(sh.time, sh.coffeeUntil) + dur;
    this.toast(`Café: perguntas mais rápidas por ${dur === 120 ? '2 h' : dur === 90 ? '1 h 30' : '1 h'}${sh.semSono ? ' e sem cochilar' : ''}. Em casa você vai chegar irritad${this.st.gender === 'M' ? 'o' : 'a'}.`, 'info');
    return true;
  }

  photo(): string {
    const sh = this.sh;
    if (this.st.flags['foto_bloqueada']) return String(this.st.flags['foto_bloqueada']);
    if (sh.photoUsed) return 'Você já olhou a foto hoje. Ela continua ali.';
    sh.photoUsed = true;
    this.st.vars.desgaste = clamp(this.st.vars.desgaste - 3, 0, 100);
    this.toast('Desgaste −3 · a foto da família', 'bom');
    sh.pauseUntilReal = this.realClock + 1;
    return resolveTokens('{conj}, Liam e Dona Zélia no aniversário do ano passado. Por um segundo, a central fica em silêncio.', this.st.gender, this.st);
  }

  readDiary(): { ok: boolean; delta: number; text: string } {
    const sh = this.sh;
    if (sh.diaryRead) return { ok: false, delta: 0, text: 'Você já releu o diário hoje.' };
    if (this.st.vars.desgaste <= 70) return { ok: false, delta: 0, text: 'Reler o diário só faz diferença quando o cansaço aperta (Desgaste acima de 70).' };
    sh.diaryRead = true;
    const vivos = this.st.diary.filter((d) => d.kind === 'vivo').length;
    const mortos = this.st.diary.filter((d) => d.kind === 'morto').length;
    if (vivos > mortos) {
      this.st.vars.desgaste = clamp(this.st.vars.desgaste - 10, 0, 100);
      return { ok: true, delta: -10, text: `${vivos} nomes vivos. Você lembra por que continua.` };
    }
    this.st.vars.desgaste = clamp(this.st.vars.desgaste + 5, 0, 100);
    // como nas penalidades: chegar a 100 é colapso na hora, não na auditoria do fim do dia
    if (this.st.vars.desgaste >= 100) this.gameOver('colapso');
    return { ok: true, delta: 5, text: `${mortos} nomes com uma cruz do lado. Ler não ajudou.` };
  }

  // ---------------------------------------------------------------------------
  // linha do tempo do dia (rádio, interfone, scripts)
  // ---------------------------------------------------------------------------
  timelineCtx() {
    const self = this;
    const base = this.eff();
    return {
      ...base,
      shift: this.sh,
      now: this.sh.time,
      modal: (who: string, text: string, kind: 'simone' | 'interfone' | 'aviso' = 'simone', options?: import('./types').TimelineOption[]) => {
        const c0 = self.ctx();
        const opts = options?.filter((o) => !o.when || o.when(c0));
        if (opts?.length && self.tarm) {
          // campanha da Simone: a mesa decide sozinha (última opção)
          const o = opts[opts.length - 1];
          o.effect?.(self.timelineCtx());
          return;
        }
        const id = self.pushModal({ kind, who, text: resolveTokens(text, self.st.gender, self.st), blocking: kind !== 'simone' || !!opts?.length, options: opts?.map((o) => ({ id: o.id, label: o.label })) });
        if (id && opts?.length) self.inlineModals.set(id, opts);
      },
      request: (from: string, text: string, options: import('./types').TimelineOption[], defaultOpt: string, timeout = 8) => {
        const id = self.makeRequest({ kind: 'timeline', from, text: resolveTokens(text, self.st.gender, self.st), options: options.map((o) => ({ id: o.id, label: o.label, cost: o.cost })), defaultOpt, timeout, data: { inline: true } });
        self.inlineReqs.set(id, options);
      },
      extendShift: (until: number) => self.extendShift(until),
      sflag: (name: string, v?: boolean | number | string) => {
        if (v !== undefined) self.sh.flags[name] = v;
        return self.sh.flags[name];
      },
      unitsOfType: (t: 'USA' | 'USB') => Object.values(self.sh.units).filter((u) => u.type === t),
      freeUnits: (t?: 'USA' | 'USB') => self.availableUnits(t),
      setUnit: (id: string, status: UnitStatus, until?: number, note?: string) => self.setUnit(id, status, until, note),
      radio: (from: string, text: string, kind?: RadioKind) => self.radio(from, resolveTokens(text, self.st.gender, self.st), kind),
      schedule: (at: number, timelineId: string) => {
        const idx = (self.day.timeline ?? []).findIndex((t, i) => (t.id ?? `tl${i}`) === timelineId);
        if (idx >= 0) self.schedule(at, 'timeline', timelineId, { idx });
      },
      callStatus: (defId: string) => Object.values(self.sh.calls).find((c) => c.def === defId),
    };
  }

  /** estende o fim do turno (ex.: o noturno atrasou) */
  extendShift(until: number) {
    const sh = this.sh;
    if (sh.end >= until) return;
    sh.end = until;
    const i = sh.pending.findIndex((ev) => ev.kind === 'endShift');
    if (i >= 0) sh.pending.splice(i, 1);
    this.schedule(until, 'endShift', 'end');
  }

  private onTimeline(idx: number) {
    const tl: TimelineDef | undefined = this.day.timeline?.[idx];
    if (!tl) return;
    const c = this.ctx();
    if (tl.when && !tl.when(c)) return;
    if (tl.run) tl.run(this.timelineCtx());
    const text = tl.text ? resolveTokens(txt(tl.text, c), this.st.gender, this.st) : '';
    const id = tl.id ?? `tl${idx}`;
    if (tl.kind === 'radio' && text) this.radio(tl.who ?? 'RÁDIO', text, 'info');
    if (tl.kind === 'pedido' && tl.options) {
      this.makeRequest({ kind: 'timeline', from: tl.who ?? 'RÁDIO', text, options: tl.options.map((o) => ({ id: o.id, label: o.label, cost: o.cost })), defaultOpt: tl.defaultOption ?? tl.options[tl.options.length - 1].id, timelineId: id, timeout: tl.timeout ?? 6 });
    }
    if (this.tarm && (tl.kind === 'interfone' || tl.kind === 'simone' || tl.kind === 'aviso')) {
      // a mesa do regulador decide sozinha; a TARM só ouve o que é para a sala toda
      if (tl.options?.length) {
        const pick = tl.options.find((o) => o.id === (tl.defaultOption ?? tl.options![tl.options!.length - 1].id));
        if (pick?.effect) pick.effect(this.timelineCtx());
      }
      if (tl.kind === 'aviso' && text) this.pushModal({ kind: 'aviso', who: tl.who ?? 'AVISO', text, blocking: false }, true);
      else if (tl.kind === 'interfone' && text) this.tarmLog(`O interfone toca na Mesa 1 (${tl.who ?? 'DR. PEIXOTO'}).`);
      return;
    }
    if ((tl.kind === 'interfone' || tl.kind === 'simone' || tl.kind === 'aviso') && text) {
      const m: ModalMsg = {
        id: 'm' + ++this.sh.seq,
        kind: tl.kind === 'interfone' ? 'interfone' : tl.kind === 'simone' ? 'simone' : 'aviso',
        who: resolveTokens(tl.who ?? (tl.kind === 'interfone' ? 'DR. PEIXOTO' : 'SIMONE'), this.st.gender, this.st),
        text,
        options: tl.options?.map((o) => ({ id: o.id, label: resolveTokens(txt(o.label, c), this.st.gender, this.st) })),
        timelineId: id,
        blocking: tl.kind !== 'simone' || !!tl.options,
      };
      this.sh.modals.push(m);
      this.emit({ type: 'modal', id: m.id });
    }
  }

  ackModal(id: string, opt?: string) {
    const m = this.sh.modals.find((x) => x.id === id);
    if (!m) return;
    this.sh.modals = this.sh.modals.filter((x) => x.id !== id);
    const inline = this.inlineModals.get(id);
    if (inline) {
      this.inlineModals.delete(id);
      const o = inline.find((x) => x.id === opt) ?? inline[inline.length - 1];
      if (o?.effect) o.effect(this.timelineCtx());
      if (o?.cost) this.advance(o.cost);
      if (o?.reply) {
        const reply = resolveTokens(txt(o.reply, this.ctx()), this.st.gender, this.st);
        this.sh.modals.push({ id: 'm' + ++this.sh.seq, kind: m.kind, who: m.who, text: reply, blocking: false });
      }
      if (m.kind === 'interfone') this.advance(1);
      return;
    }
    if (m.timelineId && opt) {
      const tl = this.day.timeline?.find((t, i) => (t.id ?? `tl${i}`) === m.timelineId);
      const o = tl?.options?.find((x) => x.id === opt);
      if (o?.effect) o.effect(this.timelineCtx());
      if (o?.cost) this.advance(o.cost);
      if (o?.reply) {
        const reply = resolveTokens(txt(o.reply, this.ctx()), this.st.gender, this.st);
        this.sh.modals.push({ id: 'm' + ++this.sh.seq, kind: m.kind, who: m.who, text: reply, blocking: false });
      }
    }
    if (m.kind === 'interfone') this.advance(1);
  }

  pushModal(m: Omit<ModalMsg, 'id'>, force = false): string | undefined {
    // na campanha da Simone, recados da Simone e do Peixoto para o regulador não chegam à TARM
    if (this.tarm && !force && m.kind !== 'aviso') return undefined;
    const R = (x: string) => resolveTokens(x, this.st.gender, this.st);
    const mm = { ...m, who: R(m.who), text: R(m.text), options: m.options?.map((o) => ({ ...o, label: R(o.label) })), id: 'm' + ++this.sh.seq };
    this.sh.modals.push(mm);
    this.emit({ type: 'modal', id: mm.id });
    return mm.id;
  }

  private peixotoWatch() {
    const sh = this.sh;
    if (this.tarm) return;
    const goal = this.day.goal;
    if (!goal || this.st.day < 5) return;
    if (sh.peixotoCalls >= 2) return;
    if (sh.usaSent === goal.maxUSA + 1 && sh.time < hm('12:00')) {
      sh.peixotoCalls++;
      this.pushModal({ kind: 'interfone', who: 'DR. PEIXOTO', text: `{Dr}, ${sh.usaSent}ª USA antes do almoço? O painel tá amarelo. Lembra da meta.`.replace('{Dr}', this.st.gender === 'M' ? 'Doutor' : 'Doutora'), blocking: true });
    } else if (sh.usaSent === goal.maxUSA + 2) {
      sh.peixotoCalls++;
      this.pushModal({ kind: 'interfone', who: 'DR. PEIXOTO', text: 'Vermelho no painel. Vou ter que explicar isso pra diretoria, viu?', blocking: true });
    }
  }

  efficiency(): number {
    const sh = this.sh;
    const goal = this.day.goal?.maxUSA ?? 4;
    let idx = 100;
    if (sh.usaSent > goal) idx -= (sh.usaSent - goal) * 14;
    const avg = sh.regTimes.length ? sh.regTimes.reduce((a, b) => a + b, 0) / sh.regTimes.length : 0;
    if (avg > 40) idx -= Math.min(30, (avg - 40) * 0.8);
    idx -= sh.dispatches * 1.5;
    return Math.round(clamp(idx, 0, 100));
  }

  // ---------------------------------------------------------------------------
  // toques fantasmas
  // ---------------------------------------------------------------------------
  private onPhantom() {
    if (this.st.vars.desgaste <= 80) return;
    const id = 'ph' + ++this.sh.phantomSeq;
    this.sh.phantoms.push({ id, t: this.sh.time });
    this.emit({ type: 'phantom' });
    this.schedule(this.sh.time + 35 + Math.floor(randOf(this.st) * 70), 'phantom', 'ph');
  }

  /** o jogador reagiu a tempo: uma piscada longa, um minuto */
  acordar() {
    if (!this.sh.cochilo) return;
    this.sh.cochilo = undefined;
    this.toast('Você pisca forte e volta para a tela.', 'info');
    this.advance(1);
  }

  /** cochilou de verdade: quatro minutos se foram */
  cochilar() {
    if (!this.sh.cochilo) return;
    this.sh.cochilo = undefined;
    this.sh.cochilos = (this.sh.cochilos ?? 0) + 1;
    this.toast('Você cochilou na mesa. Quatro minutos se foram.', 'ruim');
    this.advance(4);
  }

  clickPhantom(id: string) {
    this.sh.phantoms = this.sh.phantoms.filter((p) => p.id !== id);
    this.toast('Ninguém na linha. O telefone não tinha tocado.', 'ruim');
    this.advance(2);
  }

  expirePhantoms() {
    this.sh.phantoms = this.sh.phantoms.filter((p) => this.sh.time - p.t < 6);
  }


  // ---------------------------------------------------------------------------
  // campanha da Simone: TARM (jogadora) + mesas de regulação (IA)
  // ---------------------------------------------------------------------------
  tarmLog(text: string) {
    const T = this.sh.tarm;
    if (!T) return;
    T.log.push({ t: this.sh.time, text: resolveTokens(text, this.st.gender, this.st) });
    if (T.log.length > 40) T.log.splice(0, T.log.length - 40);
  }

  /** a TARM passa a ligação ativa para uma mesa de regulação */
  tarmPass(color: Color, priority: boolean, to: RegId): { ok: boolean; error?: string } {
    const sh = this.sh;
    const T = sh.tarm;
    const call = this.active();
    if (!T || !call) return { ok: false, error: 'Nenhuma ligação ativa.' };
    if (call.status !== 'ativa') return { ok: false, error: 'A ligação não está com você.' };
    const R = T.regs[to];
    if (!R || R.away) return { ok: false, error: 'Essa mesa está vazia hoje.' };
    const def = this.defOf(call);
    const handle = Math.max(0, sh.time - (call.answered ?? sh.time));
    call.tarm = { color, priority, to, at: sh.time, handle, realSec: call.realSec };
    call.status = 'regulacao';
    sh.activeId = undefined;
    T.passed++;
    T.handleSum += handle;
    if (priority) R.queue.unshift(call.id);
    else R.queue.push(call.id);
    this.sysLine(call, `Pré-triagem: ${color.toUpperCase()}${priority ? ' · PRIORIDADE' : ''} → ${REG_LABEL[to]}.`);
    this.tarmLog(`${REG_LABEL[to]} recebe ${def.patient.name} (${color}${priority ? ', prioridade' : ''}).`);
    if (!R.current) this.aiNext(to);
    this.emit({ type: 'pass', callId: call.id, to });
    return { ok: true };
  }

  /** a TARM sai da mesa (crise): o resto do turno é triado às pressas por quem cobrir */
  tarmOut(reason: string) {
    const T = this.sh.tarm;
    if (!T || T.out) return;
    T.out = true;
    this.tarmLog(reason);
    const act = this.active();
    if (act && act.status === 'ativa') this.coverTriage(act);
    for (const c of this.queue()) this.schedule(this.sh.time + 2 + Math.floor(randOf(this.st) * 4), 'ai', 'tri:' + c.id);
  }

  /** triagem de quem cobre a TARM (Rose, do RH): sem treino */
  private coverTriage(call: CallRT) {
    const T = this.sh.tarm!;
    const t = this.truthOf(call);
    const truthColor = colorFor(t.sev);
    const order: Color[] = ['azul', 'verde', 'amarelo', 'vermelho'];
    let color = truthColor;
    if (randOf(this.st) > 0.5) {
      const i = order.indexOf(truthColor);
      color = order[clamp(i + (randOf(this.st) < 0.5 ? -1 : 1), 0, 3)];
    }
    if (call.answered === undefined) call.answered = this.sh.time;
    const to: RegId = T.regs.henrique.away || T.regs.moura.queue.length <= T.regs.henrique.queue.length ? 'moura' : 'henrique';
    call.tarm = { color, priority: false, to, at: this.sh.time, handle: 0, realSec: 0, cover: true };
    if (this.sh.activeId === call.id) this.sh.activeId = undefined;
    call.status = 'regulacao';
    T.regs[to].queue.push(call.id);
    if (!T.regs[to].current) this.aiNext(to);
  }

  private aiNext(reg: RegId) {
    const R = this.sh.tarm!.regs[reg];
    R.current = undefined;
    while (R.queue.length) {
      const id = R.queue.shift()!;
      const call = this.sh.calls[id];
      if (!call || call.status !== 'regulacao') continue;
      R.current = id;
      R.busyUntil = this.sh.time + this.aiThink(reg, call);
      this.schedule(R.busyUntil, 'ai', reg);
      return;
    }
  }

  private aiThink(reg: RegId, call: CallRT): number {
    const r = randOf(this.st);
    const t = this.truthOf(call);
    const right = call.tarm?.color === colorFor(t.sev);
    if (reg === 'henrique') return 2 + Math.round(r * 3);
    return 4 + Math.round(r * 4) + (right ? 0 : 3);
  }

  /** chance de a mesa acertar a decisão, dada a pré-triagem */
  aiAccuracy(reg: RegId, call: CallRT): number {
    const t = this.truthOf(call);
    const tri = call.tarm;
    const rank: Record<Color, number> = { azul: 0, verde: 1, amarelo: 2, vermelho: 3 };
    let acc: number;
    if (reg === 'moura') acc = (this.sh.flags['acc_moura'] as number | undefined) ?? 0.8;
    else {
      const d = this.st.day;
      acc = (this.sh.flags['acc_henrique'] as number | undefined) ?? (d <= 7 ? 0.78 : d <= 10 ? 0.7 : d === 11 ? 0.55 : 0.66);
      if (this.sh.time >= hm('17:30')) acc -= 0.2;
      else if (this.sh.time >= hm('15:00')) acc -= 0.12;
    }
    if (tri) {
      const diff = rank[tri.color] - rank[colorFor(t.sev)];
      if (diff === 0) acc += 0.14;
      else if (diff < 0) acc -= 0.18 * -diff; // subestimou: a mesa confia na pré-triagem
      else acc -= 0.04 * diff;
      if (tri.priority && t.sev === 'vermelho') acc += 0.03;
    }
    return clamp(acc, 0.05, 0.97);
  }

  private aiGuideQuality(call: CallRT): number {
    const reg = call.tarm?.to ?? 'moura';
    const r = randOf(this.st) * 0.2 - 0.1;
    if (reg === 'henrique') return clamp(0.68 - (this.sh.time >= hm('15:00') ? 0.2 : 0) + r, 0, 1);
    return clamp(0.8 + r, 0, 1);
  }

  private aiRequestChoice(req: PendingRequest): string {
    const has = (id: string) => req.options.some((o) => o.id === id);
    if (req.kind === 'piora') return has('usa') ? 'usa' : has('aguardar') ? 'aguardar' : req.defaultOpt;
    if (req.kind === 'retencao') return has('negociar') ? 'negociar' : req.defaultOpt;
    if (req.kind === 'vaga') return has('vagazero') ? 'vagazero' : req.defaultOpt;
    return req.defaultOpt;
  }

  private aiDecision(call: CallRT, correct: boolean): { color: Color; resource: Resource; unit?: string; support: Support[]; dest?: Dest; referral?: Referral } | null {
    const t = this.truthOf(call);
    const tri = call.tarm!;
    const truthColor = colorFor(t.sev);
    let res: Resource;
    let color: Color;
    if (correct) {
      res = t.best ?? t.ok[0];
      color = truthColor;
    } else if (tri.color !== truthColor) {
      // a mesa segue a pré-triagem errada
      color = tri.color;
      res = tri.color === 'vermelho' ? 'USA' : tri.color === 'amarelo' ? 'USB' : 'ORI';
    } else {
      // erro da própria mesa, mesmo com a triagem certa
      const best = t.best ?? t.ok[0];
      res = best === 'USA' ? 'USB' : best === 'USB' ? (randOf(this.st) < 0.5 ? 'ORI' : 'USA') : best === 'ORI' ? 'USB' : 'ORI';
      color = res === 'USA' ? 'vermelho' : res === 'USB' ? 'amarelo' : truthColor === 'azul' ? 'azul' : 'verde';
    }
    let unit: string | undefined;
    if (res === 'USA' || res === 'USB') {
      let free = this.availableUnits(res);
      if (!free.length) {
        const alt: Resource = res === 'USA' ? 'USB' : 'USA';
        const altFree = this.availableUnits(alt);
        if (altFree.length && (res === 'USA' || t.sev === 'vermelho' || t.sev === 'amarelo')) {
          res = alt;
          free = altFree;
        }
      }
      if (!free.length) return null;
      unit = free.sort((a, b) => this.etaFor(a.id, call) - this.etaFor(b.id, call))[0].id;
    }
    const dispatch = res === 'USA' || res === 'USB';
    const dest: Dest | undefined = dispatch && this.st.day >= 9 ? (correct && t.dest?.length ? t.dest[0] : color === 'vermelho' ? 'REG' : 'UPA') : undefined;
    const referral: Referral | undefined = res === 'ORI' ? (correct && t.ref?.length ? t.ref[0] : color === 'verde' ? 'UPA' : color === 'azul' ? 'CASA' : 'UBS') : undefined;
    const support: Support[] = correct || randOf(this.st) < 0.5 ? [...(t.sup ?? [])] : [];
    return { color, resource: res, unit, support, dest, referral };
  }

  private onAi(ref: string) {
    const T = this.sh.tarm;
    if (!T) return;
    if (ref.startsWith('tri:')) {
      const call = this.sh.calls[ref.slice(4)];
      if (call && (call.status === 'fila' || call.status === 'espera')) this.coverTriage(call);
      return;
    }
    const reg = ref as RegId;
    const R = T.regs[reg];
    if (!R) return;
    const id = R.current;
    if (!id) return this.aiNext(reg);
    if (this.sh.time + 0.001 < R.busyUntil) return; // evento antigo
    const call = this.sh.calls[id];
    if (!call || call.status !== 'regulacao') return this.aiNext(reg);
    const def = this.defOf(call);
    const acc = this.aiAccuracy(reg, call);
    const correct = randOf(this.st) < acc;
    if (def.mci) {
      this.aiMci(call, acc);
      R.decided++;
      call.tarm!.aiCorrect = correct;
      call.tarm!.decidedAt = this.sh.time;
      this.radio(REG_LABEL[reg].toUpperCase(), `Múltiplas vítimas no Parque de Exposições: triagem feita, viaturas saindo.`, 'info', call.id);
      return this.aiNext(reg);
    }
    const d = this.aiDecision(call, correct);
    if (!d) {
      R.busyUntil = this.sh.time + 3;
      this.schedule(R.busyUntil, 'ai', reg);
      if (!(call as CallRT & { aiWait?: boolean }).aiWait) {
        (call as CallRT & { aiWait?: boolean }).aiWait = true;
        this.tarmLog(`${REG_LABEL[reg]}: sem viatura livre para ${def.patient.name}. Esperando liberar.`);
      }
      return;
    }
    call.tarm!.aiCorrect = correct;
    call.tarm!.decidedAt = this.sh.time;
    R.decided++;
    if (!correct) R.errors++;
    const r = this.stamp(d, call);
    if (!r.ok) {
      // fallback: orientação (registrado como erro de mesa)
      this.stamp({ color: d.color, resource: 'ORI', support: [], referral: 'UPA' }, call);
    }
    const label = call.decision ? decisionLabel(call.decision) : d.resource;
    this.radio(REG_LABEL[reg].toUpperCase(), `${def.patient.name}: ${label}.`, 'info', call.id);
    this.aiNext(reg);
  }

  private aiMci(call: CallRT, acc: number) {
    const def = this.defOf(call);
    const mci = def.mci!;
    const triage: Record<string, Color | 'preto'> = {};
    const alloc: Record<string, string> = {};
    const usas = this.availableUnits('USA').map((u) => u.id);
    const usbs = this.availableUnits('USB').map((u) => u.id);
    for (const v of mci.victims) {
      const right = randOf(this.st) < acc;
      const col: Color | 'preto' = right ? v.cor : v.cor === 'vermelho' ? 'amarelo' : v.cor === 'amarelo' ? 'verde' : v.cor === 'verde' ? 'amarelo' : 'preto';
      triage[v.id] = col;
      if (col === 'vermelho') alloc[v.id] = usas.shift() ?? usbs.shift() ?? 'reforco';
      else if (col === 'amarelo') alloc[v.id] = usbs.shift() ?? 'upa';
      else alloc[v.id] = col === 'preto' ? 'none' : 'upa';
    }
    const prev = this.sh.activeId;
    this.sh.activeId = call.id;
    call.status = 'ativa';
    this.mciSubmit(triage, alloc, true);
    this.sh.activeId = prev && prev !== call.id ? prev : undefined;
  }

  /** resumo do turno da TARM */
  tarmSummary() {
    const sh = this.sh;
    const T = sh.tarm;
    const calls = sh.order.map((id) => sh.calls[id]).filter(Boolean);
    const passed = calls.filter((c) => c.tarm && !c.tarm.cover);
    let right = 0;
    let under = 0;
    let over = 0;
    const rank: Record<Color, number> = { azul: 0, verde: 1, amarelo: 2, vermelho: 3 };
    for (const c of passed) {
      const tc = colorFor(this.truthOf(c).sev);
      const d = rank[c.tarm!.color] - rank[tc];
      if (d === 0) right++;
      else if (d < 0) under++;
      else over++;
    }
    return {
      passed: passed.length,
      right,
      under,
      over,
      tma: passed.length ? (T?.handleSum ?? 0) / Math.max(1, T?.passed ?? passed.length) : 0,
      hangups: calls.filter((c) => c.status === 'desligou').length,
      night: calls.filter((c) => c.status === 'noturno').length,
      deaths: calls.filter((c) => c.outcome === 'obito').length,
      saves: sh.saves.length,
    };
  }

  // ---------------------------------------------------------------------------
  // fim do turno
  // ---------------------------------------------------------------------------
  private onEndTime() {
    const sh = this.sh;
    sh.closing = true;
    // fila vai para o noturno
    for (const id of sh.order) {
      const call = sh.calls[id];
      if (!call) continue;
      if (call.status === 'fila' || (call.status === 'espera' && call.id !== sh.activeId) || call.status === 'regulacao') {
        call.status = 'noturno';
        call.closed = sh.time;
      }
    }
    if (sh.tarm) {
      for (const r of Object.values(sh.tarm.regs)) {
        r.queue = [];
        r.current = undefined;
      }
    }
    this.radio('SISTEMA', `${fmtTime(sh.time)} — troca de turno. O que ficou na fila passa para o plantão noturno.`, 'info');
    if (!sh.activeId && !sh.guideCallId) this.finish();
  }

  /** encerra o plantão e calcula o relatório */
  finish() {
    const sh = this.sh;
    if (sh.ended) return;
    sh.ended = true;
    // posta em espera (ou que voltou a tocar) depois das 19h: também vai para o noturno
    for (const id of sh.order) {
      const call = sh.calls[id];
      if (call && (call.status === 'fila' || call.status === 'espera')) {
        call.status = 'noturno';
        call.closed = sh.time;
      }
    }
    if (this.tarm) {
      for (const id of sh.order) {
        const call = sh.calls[id];
        if (call && call.status === 'regulacao') {
          call.status = 'noturno';
          call.closed = sh.time;
        }
      }
    }
    const c = this.ctx();
    // ligações ainda não reveladas
    for (const id of sh.order) {
      const call = sh.calls[id];
      if (!call) continue;
      if (call.status === 'noturno') {
        this.nightShift(call);
        continue;
      }
      if (call.decision && call.verdict && !call.verdict.revealed) {
        const t = this.truthOf(call);
        // despachos em andamento: desfecho estimado
        if ((call.decision.resource === 'USA' || call.decision.resource === 'USB') && call.outcome === 'pendente') {
          const u = sh.units[call.decision.unit!];
          const arr = u?.t1 && u.status === 'DESLOC' ? u.t1 : sh.time;
          this.revealVerdict(call);
          if (!(call.verdict.kind === 'excesso' || t.sev === 'trote')) {
            const needs = t.risk?.needs ?? (t.sev === 'vermelho' ? 'USA' : 'USB');
            const under = needs === 'USA' && call.decision.resource === 'USB';
            this.evaluateCare(call, under ? arr + 30 : arr, 'USA', u);
          } else if (call.verdict.kind === 'excesso') call.outcome = 'liberado';
          else call.outcome = 'trote';
        } else {
          this.revealVerdict(call);
          const dismissed = (call.decision.resource === 'ORI' || call.decision.resource === 'TROTE') && (t.sev === 'vermelho' || t.sev === 'amarelo') && !t.ok.includes(call.decision.resource);
          if (dismissed && call.outcome === 'pendente') {
            // dispensado no fim do turno: o retorno cai no plantão noturno
            this.nightShift(call);
            // sem sindicância quando a verdade é "só narrativa" ou a coordenação assumiu (impedimento)
            if ((call.outcome as CallOutcome) === 'obito' && call.verdict.kind !== 'sem_penalidade') this.registerDeathNoDup(call);
            continue;
          }
          if (call.decision.resource === 'ORI' && call.outcome === 'pendente') {
            call.outcome = 'orientado';
            this.writeDiary(call, 'orientado');
          }
          if (call.decision.resource === 'TROTE' && call.outcome === 'pendente') call.outcome = 'trote';
        }
      }
    }
    // pendências clínicas sem desfecho (ex.: aguardando USA que nunca veio)
    for (const id of sh.order) {
      const call = sh.calls[id];
      if (!call || !call.decision || call.outcome !== 'pendente') continue;
      if (call.decision.resource === 'USA' || call.decision.resource === 'USB') this.evaluateCare(call, sh.time + 20, 'USA');
    }
    sh.report = this.buildReport();
    // produtividade
    const effW = this.effectiveWarnings();
    const handledCount = sh.handled + (sh.flags['mciHandled'] ? 2 : 0);
    let bonus = sh.bonusRaw;
    if (handledCount >= 8 && sh.warnings === 0) {
      bonus += PRODUCTIVITY_BONUS;
      sh.flags['produtividade'] = true;
    }
    // meta do Peixoto (armadilha)
    if (this.day.goal && sh.usaSent <= this.day.goal.maxUSA) {
      sh.goalMet = true;
      bonus += this.day.goal.bonus;
      const fault = Object.values(sh.calls).some((x) => x.verdict?.kind === 'falta' || x.verdict?.kind === 'dispensou');
      if (fault) {
        this.st.vars.integridade = clamp(this.st.vars.integridade - 1, 0, 10);
        sh.flags['metaSuja'] = true;
      }
    }
    const capped = Math.min(BONUS_CAP, bonus);
    sh.flags['glosa'] = Math.max(0, bonus - BONUS_CAP);
    sh.bonus = capped;
    const pay = FIXED_PAY + capped - sh.deductions;
    this.st.money += pay;
    recordIncome(this.st, 'salario', pay);
    // desgaste do plantão
    this.st.vars.desgaste = clamp(this.st.vars.desgaste + 5 + (sh.photoUsed ? 0 : 1), 0, 100);
    this.st.history.push({
      day: this.st.day,
      warnings: sh.warnings,
      notes: sh.notes,
      deaths: sh.deaths.length,
      saves: sh.saves.length,
      handled: sh.handled,
      pay,
      bonus: capped,
      deductions: sh.deductions,
      report: sh.report,
      moneyAfter: this.st.money,
    });
    if (effW >= this.warningLimit()) this.gameOver('exonerado');
    if (this.st.vars.desgaste >= 100) this.gameOver('colapso');
    this.emit({ type: 'end' });
    void c;
  }

  /** óbito registrado pelo noturno depois de uma dispensa: conta a sindicância sem duplicar o resto */
  private registerDeathNoDup(call: CallRT) {
    this.sh.sindicancias++;
    this.st.totals.sindicancias++;
    if (this.st.totals.sindicancias >= 2) this.gameOver('sindicancia');
    void call;
  }

  private nightShift(call: CallRT) {
    const t = this.truthOf(call);
    const def = this.defOf(call);
    let outcome: CallOutcome = 'orientado';
    let text = 'Passou para o plantão noturno.';
    if ((t.sev === 'vermelho' && t.risk) || def.nightDeath) {
      const henriqueBad = !!this.st.flags['henrique_piorando'];
      const at = this.sh.end + (henriqueBad ? 140 : 45) - call.arrived;
      const p = t.risk ? this.survival(t, at, 0) : 1;
      if (randOf(this.st) > p || def.nightDeath) {
        outcome = 'obito';
        text = 'Plantão noturno: óbito de madrugada.';
        this.sh.deaths.push(call.id);
        this.st.totals.deaths++;
        this.st.vars.desgaste = clamp(this.st.vars.desgaste + 5, 0, 100);
        this.writeDiary(call, 'morto', 'plantão noturno');
        if (t.key) this.st.keys[t.key] = 'perdido';
        call.outcome = 'obito';
        if (def.onResolve) def.onResolve(this.eff(), { outcome: 'obito' });
      } else {
        outcome = 'transportado';
        text = 'Plantão noturno: atendido, sobreviveu.';
        if (t.key) this.st.keys[t.key] = 'salvo';
        if (def.onResolve) def.onResolve(this.eff(), { outcome: 'salvo' });
      }
    }
    call.outcome = outcome;
    call.resultText = text;
    if (outcome === 'obito') this.st.flags[`noturno_obito_${def.id}`] = true;
  }

  buildReport(): ReportItem[] {
    const items: ReportItem[] = [];
    for (const id of this.sh.order) {
      const call = this.sh.calls[id];
      if (!call) continue;
      const v = call.verdict;
      if (call.status === 'noturno') items.push(this.reportItem(call, 'noturno', 0, call.resultText ?? 'Plantão noturno.'));
      else if (call.status === 'desligou' && !v) items.push(this.reportItem(call, 'desligou', 0, call.resultText ?? 'Desistiu.'));
      else if (v) items.push(this.reportItem(call, v.kind, v.bonus - v.notes * NOTE_COST - v.warnings * WARNING_COST, v.text + (call.resultText ? ' ' + call.resultText : '')));
      else if (call.status !== 'fila') items.push(this.reportItem(call, 'pendente', 0, 'Sem decisão.'));
    }
    return items;
  }
}

// -----------------------------------------------------------------------------
const CALM = [
  'Calma. Eu estou aqui com você e vou te ajudar. Respira comigo.',
  'Fica comigo na linha. Você está indo muito bem.',
  'Eu sei que é difícil. A gente vai resolver isso juntos.',
  'Respira devagar. Estou anotando tudo.',
];
function pickCalm(n: number): string {
  return CALM[n % CALM.length];
}

export function numKey(n: string): string {
  const d = n.replace(/\D/g, '');
  return d.slice(-5);
}

export const DEFAULT_RADIO = {
  okUSA: '{central}, {unit} em QUS. QTW: {dx}, estabilizado. QUR para o {dest}. Chegamos a tempo.',
  okUSB: '{central}, {unit} em QUS. QTW: {dx}, paciente estável. QUR para {dest}.',
  excessUSA: '{central}, {unit} em QUS. QTW: {dx}, conversando, bem. Vamos liberar no local. Precisava da gente aqui, {dr}?',
  excessUSB: 'Central, {unit} em QUS. Caso leve: {dx}. Orientamos e liberamos no local. QRV.',
  under: 'Central, {unit}! QTW grave: {dx}. Precisamos de apoio avançado, QRR 3!',
  prank: 'Central, {unit} em QUS. Ninguém chamou ambulância aqui. Era trote. QRV, retornando.',
  unsafe: 'Central, {unit}, QUF! Fomos recebidos com agressão, ainda tem gente armada! Recuamos. Cadê a PM?!',
  unsafeBomb: 'Central, {unit} em QUS. A gente não tem como fazer esse resgate sozinho: precisa de Bombeiro aqui. Aguardando o 193, paciente sem acesso.',
  dead: 'Central... {unit}. QTW: óbito constatado às {hora}.',
  late: 'Central, {unit}. {Dx}... chegamos tarde pra fazer diferença. Vai ficar com sequela.',
  saved: '{central}, {unit}. Pegamos grave, mas voltou. Quem tava orientando no telefone? Contou bonito. TKS.',
};

const DEFAULT_FOLLOWUP = {
  vermelho: ['{m:Moço|Moça}, pelo amor de Deus! Ele piorou! Ele não responde mais! Vocês não iam mandar ninguém?!', '[choro, gritos ao fundo]'],
  amarelo: ['Oi, liguei antes... piorou, viu? Não melhorou nada.'],
};

// capitaliza {Dx}
DEFAULT_RADIO.okUSB = DEFAULT_RADIO.okUSB;
export function capFirst(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
