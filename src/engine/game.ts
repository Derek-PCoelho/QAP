// =============================================================================
// Game: orquestra fases (jornal → plantão → relatório → casa → próximo dia),
// saves, finais e eventos para a interface/áudio/telemetria.
// =============================================================================
import type { GameState, SceneDef, NewspaperDef, Ctx, EffCtx, ReportField, Phase } from './types';
import type { Content } from './content-api';
import { migrate } from './migrate';
import { newGameState, makeCtx, makeEffCtx, SAVE_VERSION, type NewGameOpts } from './state';
import { parseSave, checkSave } from './save-check';
import { ShiftSim, type ShiftEvent } from './shift';
import { HomeSim } from './home';
import { buildEnding, checkEnding } from './endings';
import { infiniteDay, scoreVerdict } from './infinite';
import { seedFromLabel } from './state';
import type { DayDef } from './types';
import { txt, resolveTokens } from './text';
import { createSimoneState, simoneDay, simoneWorld, settleSimoneShift, simoneBills, type SimoneDayResult, type SimoneBillView } from './simone';
import { hm, clamp } from './util';

export type GameEvent =
  | ShiftEvent
  | { type: 'phase'; phase: Phase }
  | { type: 'telemetry'; name: string; data: Record<string, unknown> }
  | { type: 'achievement'; id: string }
  | { type: 'save' };

/** Cena transitória (passagem de turno, fim de turno) */
export class SceneRunner {
  sc: SceneDef;
  node = 'start';
  done = false;
  log: string[] = [];
  constructor(sc: SceneDef, private ctx: () => Ctx, private eff: () => EffCtx, private g: () => GameState) {
    this.sc = sc;
    this.sc.nodes['start']?.onEnter?.(this.eff());
  }
  lines() {
    const n = this.sc.nodes[this.node];
    if (!n) return [];
    const c = this.ctx();
    return n.lines.filter((l) => !l.when || l.when(c)).map((l) => ({ ...l, text: resolveTokens(txt(l.t, c), this.g().gender, this.g()) }));
  }
  choices() {
    const n = this.sc.nodes[this.node];
    const c = this.ctx();
    return (n?.choices ?? [])
      .map((ch, idx) => ({ ch, idx }))
      // cenas da central não têm "reparar": escolha que depende dele não aparece aqui
      .filter(({ ch }) => (!ch.when || ch.when(c)) && !ch.needLink)
      .map(({ ch, idx }) => ({
        idx,
        label: resolveTokens(txt(ch.label, c), this.g().gender, this.g()),
        disabled: (ch.needMoney !== undefined && this.g().money < ch.needMoney) || (!!ch.affectionate && this.g().irritado > 0),
      }));
  }
  choose(idx: number) {
    const n = this.sc.nodes[this.node];
    const ch = n?.choices?.[idx];
    if (!ch) return;
    // a interface já esconde/desabilita, mas o motor confere também (when, needLink, dinheiro, café)
    const vis = this.choices().find((x) => x.idx === idx);
    if (!vis || vis.disabled) return;
    this.log.push(txt(ch.label, this.ctx()));
    ch.effect?.(this.eff());
    if (ch.next && this.sc.nodes[ch.next]) this.goto(ch.next);
    else this.done = true;
  }
  continue() {
    const n = this.sc.nodes[this.node];
    if (n?.choices?.length && this.choices().length) return;
    if (n?.next && this.sc.nodes[n.next]) this.goto(n.next);
    else this.done = true;
  }
  goto(id: string) {
    this.node = id;
    this.sc.nodes[id]?.onEnter?.(this.eff());
  }
}

export interface NewspaperView extends NewspaperDef {
  day: number;
  date: string;
  yesterday: { deaths: string[]; saves: string[]; night: string[] };
}

const DATES = [
  'Seg., 3 de março', 'Ter., 4 de março', 'Qua., 5 de março', 'Qui., 6 de março', 'Sex., 7 de março',
  'Sáb., 8 de março', 'Dom., 9 de março', 'Seg., 10 de março', 'Qui., 13 de março', 'Sex., 14 de março',
  'Sáb., 15 de março', 'Dom., 16 de março', 'Ter., 18 de março', 'Qua., 19 de março', 'Sex., 21 de março',
  'Sáb., 22 de março', 'Seg., 24 de março', 'Ter., 25 de março', 'Qui., 27 de março', 'Sex., 28 de março',
];

export class Game {
  st: GameState;
  c: Content;
  shift?: ShiftSim;
  home?: HomeSim;
  scene?: SceneRunner;
  sceneKind?: 'handover' | 'end' | 'event' | 'night' | 'evening' | 'ida' | 'almoco';
  /** campanha da Simone: resultado do último turno e passo da noite */
  simoneResult?: SimoneDayResult;
  private pendingOut = false;
  /** estado no começo de um trecho que não se salva pela metade (plantão; cena da noite da Simone) */
  private resumeSnap?: string;
  version = 0;
  private listeners = new Set<() => void>();
  private evListeners = new Set<(e: GameEvent) => void>();
  private unsubShift?: () => void;

  constructor(st: GameState, c: Content) {
    this.st = st;
    this.c = c;
    if (st.phase === 'plantao') {
      // saves só existem em fronteiras de fase; um plantão em andamento recomeça do jornal
      st.phase = 'jornal';
      st.shift = undefined;
    }
    if (st.phase === 'casa') {
      if (st.mode === 'simone') {
        // a cena da noite (re)começa aqui: um save no meio dela volta a este ponto
        if (st.flags['noite_passo'] !== 'contas') this.resumeSnap = JSON.stringify(st);
        this.startNight();
      } else {
        this.home = new HomeSim(st, c);
        if (!st.home) this.home.start();
      }
    }
  }

  /** campanha 2: os mesmos 20 dias, como TARM */
  static createSimone(c: Content, o: { gender: 'M' | 'F'; difficulty: import('./types').Difficulty; seed?: number; startDay?: number }): Game {
    const st = createSimoneState(o);
    if (o.startDay) {
      st.day = Math.max(1, Math.min(20, o.startDay));
      st.shadow!.day = st.day;
    }
    const g = new Game(st, c);
    g.enterDay(true);
    return g;
  }

  get simone(): boolean {
    return this.st.mode === 'simone';
  }

  /** contexto do mundo-sombra (regulador controlado pela IA) */
  shadowCtx(): Ctx {
    return makeCtx(this.st.shadow ?? this.st);
  }

  static create(c: Content, o: NewGameOpts): Game {
    const st = newGameState(o);
    const g = new Game(st, c);
    g.enterDay(true);
    return g;
  }

  static createInfinite(c: Content, seedLabel: string, gender: 'M' | 'F' = 'M'): Game {
    const st = newGameState({ gender, difficulty: 'padrao', mode: 'infinito', seed: seedFromLabel(seedLabel), variable: true });
    st.day = 20;
    st.vars.desgaste = 0;
    st.infinite = { score: 0, calls: 0, correct: 0, streak: 0, bestStreak: 0, seedLabel, shifts: 1 };
    const g = new Game(st, c);
    g.enterDay(true);
    return g;
  }

  /** definição do dia atual (campanha: conteúdo; infinito: gerado) */
  dayDef(): DayDef | undefined {
    if (this.st.mode === 'infinito') return infiniteDay(this.c, this.st);
    return this.c.days[this.st.day];
  }

  static load(c: Content, json: string): Game {
    // JSON puro, conferido antes de usar (save-check.ts): um arquivo corrompido vira mensagem, não trava
    const st = parseSave(json);
    // saves de versões anteriores são convertidos (migrate.ts); versão futura/desconhecida = incompatível
    migrate(st, SAVE_VERSION);
    checkSave(st);
    return new Game(st, c);
  }

  serialize(): string {
    // plantão ou cena (casa / noite da Simone) em andamento: o save volta ao começo do trecho,
    // sem os efeitos já aplicados nele (sindicâncias, desgaste, flags, diário, escolhas...)
    const midNight = this.simone && this.st.phase === 'casa' && this.st.flags['noite_passo'] === 'cena';
    const step = this.st.home?.step;
    const homeSnap = this.st.phase === 'casa' && (step === 'pre' || step === 'cena' || step === 'intervencao') ? this.home?.resumeSnap : undefined;
    const resume = homeSnap ?? (this.st.phase === 'plantao' || midNight ? this.resumeSnap : undefined);
    if (resume) {
      const snap = JSON.parse(resume) as GameState;
      return JSON.stringify({ ...snap, achievements: this.st.achievements, playSeconds: this.st.playSeconds, lastSave: Date.now() });
    }
    const copy = { ...this.st, lastSave: Date.now() };
    if (copy.phase === 'plantao') {
      copy.phase = 'jornal';
      copy.shift = undefined;
    }
    return JSON.stringify(copy);
  }

  // ---------------------------------------------------------------------------
  subscribe(f: () => void) {
    this.listeners.add(f);
    return () => this.listeners.delete(f);
  }
  onEvent(f: (e: GameEvent) => void) {
    this.evListeners.add(f);
    return () => this.evListeners.delete(f);
  }
  bump() {
    this.version++;
    for (const l of this.listeners) l();
  }
  emit(e: GameEvent) {
    for (const l of this.evListeners) l(e);
  }
  ctx(): Ctx {
    return makeCtx(this.st);
  }
  eff(): EffCtx {
    return makeEffCtx(this.st, { onAchievement: (id) => this.emit({ type: 'achievement', id }) });
  }
  setPhase(p: Phase) {
    this.st.phase = p;
    this.emit({ type: 'phase', phase: p });
    this.bump();
  }

  // ---------------------------------------------------------------------------
  // dia
  // ---------------------------------------------------------------------------
  private enterDay(first = false) {
    const st = this.st;
    // páginas do manual
    for (const pid of this.c.manualUntil(st.day)) if (!st.manual.includes(pid)) st.manual.push(pid);
    if (st.mode === 'simone') return this.enterSimoneDay(first);
    const day = this.dayDef();
    // atualizações do diário ("o que aconteceu depois")
    const ctx = this.ctx();
    for (const e of st.diary) {
      if (!e.callDef) continue;
      const d = this.c.days[e.day]?.calls.find((x) => x.id === e.callDef);
      for (const l of d?.diary?.later ?? []) {
        if (l.day !== st.day) continue;
        if (l.when && !l.when(ctx)) continue;
        const text = resolveTokens(txt(l.text, ctx), st.gender, st);
        if (!e.updates.some((u) => u.text === text)) e.updates.push({ day: st.day, text });
      }
    }
    day?.onStart?.(this.eff());
    const goFlag = st.flags['gameover'] as string | undefined;
    if (goFlag && !st.gameOver && ['exonerado', 'despejo', 'colapso', 'sindicancia'].includes(goFlag)) {
      st.gameOver = { kind: goFlag as 'sindicancia', day: st.day, text: '' };
      this.toGameOver();
      return;
    }
    st.phase = 'jornal';
    if (!first) this.emit({ type: 'save' });
    this.emit({ type: 'phase', phase: 'jornal' });
    this.bump();
  }

  newspaper(): NewspaperView {
    const day = this.dayDef();
    let base = day?.newspaper(this.simone ? this.shadowCtx() : this.ctx()) ?? { headline: 'Santa Aurora amanhece', stories: [] };
    if (this.simone) {
      const extra = simoneDay(this.c, this.st.day)?.newspaper?.(this.ctx());
      if (extra) base = { ...base, ...extra, stories: extra.stories ?? base.stories };
    }
    const prev = this.st.history[this.st.history.length - 1];
    const deaths: string[] = [];
    const saves: string[] = [];
    const night: string[] = [];
    if (prev) {
      for (const it of prev.report) {
        if (it.outcome === 'obito') (it.verdict === 'noturno' ? night : deaths).push(it.name);
        else if (it.outcome === 'salvo' && it.verdict !== 'noturno') saves.push(it.name);
      }
    }
    const R = (s: string) => resolveTokens(s, this.st.gender, this.st);
    return {
      ...base,
      headline: R(base.headline),
      sub: base.sub ? R(base.sub) : undefined,
      stories: base.stories.map((s) => ({ title: R(s.title), text: R(s.text) })),
      notice: base.notice ? R(base.notice) : undefined,
      ad: base.ad ? R(base.ad) : undefined,
      weather: base.weather ? R(base.weather) : undefined,
      day: this.st.day,
      date: DATES[this.st.day - 1] ?? '',
      yesterday: { deaths, saves, night },
    };
  }

  beginShift() {
    if (this.st.phase !== 'jornal') return;
    this.resumeSnap = JSON.stringify(this.st);
    this.unsubShift?.();
    if (this.simone) return this.beginSimoneShift();
    this.shift = new ShiftSim(this.st, this.c, false, this.dayDef());
    this.unsubShift = this.shift.on((e) => {
      if (e.type === 'verdict' && this.st.infinite) this.scoreInfinite(e.kind, e.sev);
      this.emit(e);
      if (e.type === 'gameover') this.toGameOver();
      if (e.type === 'end') this.onShiftEnd();
    });
    this.st.phase = 'plantao';
    const day = this.dayDef();
    // 1.1: a ida para o plantão vem antes da passagem de turno (afterScene abre a passagem depois)
    const ida = this.st.mode === 'campanha' ? day?.ida?.(this.ctx()) : undefined;
    if (ida) {
      this.scene = new SceneRunner(ida, () => this.ctx(), () => this.eff(), () => this.st);
      this.sceneKind = 'ida';
    } else this.openHandover();
    this.emit({ type: 'phase', phase: 'plantao' });
    this.bump();
  }

  private openHandover() {
    const ho = this.dayDef()?.handover?.(this.ctx());
    if (ho) {
      this.scene = new SceneRunner(ho, () => this.ctx(), () => this.eff(), () => this.st);
      this.sceneKind = 'handover';
    }
  }

  /**
   * 1.1 — almoço: o ShiftSim marca `almocoPendente` às 13:00; a cena abre no primeiro momento sem
   * ligação ativa, orientação ou aviso bloqueante. Com a cena aberta, `tick` não anda: o relógio
   * para e a fila congela.
   */
  private checkLunch(): boolean {
    const sh = this.shift;
    if (!sh || this.scene || this.st.mode !== 'campanha') return false;
    const s = sh.sh;
    if (!s.flags['almocoPendente'] || s.activeId || s.guideCallId || s.ended || s.closing || s.modals.some((m) => m.blocking)) return false;
    delete s.flags['almocoPendente'];
    s.flags['almocou'] = true;
    const sc = this.dayDef()?.almoco?.(this.ctx());
    if (!sc) return false;
    this.scene = new SceneRunner(sc, () => this.ctx(), () => this.eff(), () => this.st);
    this.sceneKind = 'almoco';
    return true;
  }

  sceneContinue() {
    this.scene?.continue();
    this.afterScene();
  }
  sceneChoose(i: number) {
    this.scene?.choose(i);
    this.afterScene();
  }
  private afterScene() {
    if (this.scene?.done) {
      const kind = this.sceneKind;
      this.scene = undefined;
      this.sceneKind = undefined;
      if (kind === 'end' || kind === 'evening') this.setPhase('relatorio');
      if (kind === 'ida') this.openHandover();
      if (kind === 'night') {
        this.st.flags['noite_passo'] = 'contas';
      }
      if (kind === 'event' && this.pendingOut && this.shift) {
        // a TARM saiu: o resto do turno corre sem ela
        this.pendingOut = false;
        this.shift.tarmOut('A Simone saiu da mesa. A Rose, do RH, cobre a pré-triagem até as 19h.');
        let guard = 0;
        while (this.shift && !this.shift.sh.ended && guard++ < 400) this.shift.processUntil(this.shift.sh.time + 15);
      }
    }
    this.bump();
  }

  tick(ms: number) {
    if (this.st.phase !== 'plantao' || !this.shift || this.scene) return;
    if (this.simone && this.checkSimoneEvents()) {
      this.bump();
      return;
    }
    if (this.checkLunch()) {
      this.bump();
      return;
    }
    this.shift.tick(ms);
    this.shift.expirePhantoms();
    this.checkLunch();
    this.bump();
  }

  private scoreInfinite(kind: import('./types').VerdictKind, sev: import('./types').TruthSev) {
    const inf = this.st.infinite!;
    const pts = scoreVerdict(kind, sev);
    inf.calls++;
    if (pts > 0) {
      inf.correct++;
      inf.streak++;
      inf.bestStreak = Math.max(inf.bestStreak, inf.streak);
      inf.score += Math.round(pts * (1 + Math.min(1, inf.streak / 10)));
    } else {
      inf.streak = 0;
      inf.score = Math.max(0, inf.score + pts);
    }
    if (inf.calls === 25) this.eff().achievement('infinito_25');
    if (inf.calls === 50) this.eff().achievement('infinito_50');
  }

  private onShiftEnd() {
    if (this.simone) return this.onSimoneShiftEnd();
    const day = this.dayDef();
    this.emit({
      type: 'telemetry',
      name: 'day_end',
      data: { day: this.st.day, ...this.lastRecord(), desgaste: this.st.vars.desgaste, money: this.st.money },
    });
    if (this.st.gameOver) return;
    const es = day?.endScene?.(this.ctx());
    if (es) {
      this.scene = new SceneRunner(es, () => this.ctx(), () => this.eff(), () => this.st);
      this.sceneKind = 'end';
      this.st.phase = 'plantao';
      this.bump();
      return;
    }
    this.setPhase('relatorio');
  }

  private lastRecord() {
    const r = this.st.history[this.st.history.length - 1];
    if (!r) return {};
    return { warnings: r.warnings, notes: r.notes, deaths: r.deaths, saves: r.saves, handled: r.handled, pay: r.pay };
  }

  private fillGameOverText() {
    const go = this.st.gameOver;
    if (!go || go.text) return;
    const sg = this.simone ? this.c.simone?.gameover[go.kind as 'exonerado' | 'colapso' | 'despejo'] : undefined;
    go.text = ((sg ? sg(this.ctx()) : this.c.endings.gameover[go.kind](this.ctx())) ?? []).join('\n');
  }

  private toGameOver() {
    const go = this.st.gameOver;
    if (!go) return;
    this.fillGameOverText();
    this.emit({ type: 'telemetry', name: 'gameover', data: { kind: go.kind, day: go.day } });
    this.setPhase('gameover');
  }

  // ---------------------------------------------------------------------------
  // relatório
  // ---------------------------------------------------------------------------
  reportField(): ReportField | undefined {
    const day = this.dayDef();
    return day?.reportField?.(this.ctx());
  }

  chooseReportField(optId: string) {
    const f = this.reportField();
    if (!f) return;
    const key = 'report_' + f.id;
    if (this.st.flags[key]) return;
    this.st.flags[key] = optId;
    const o = f.options.find((x) => x.id === optId);
    o?.effect?.(this.eff());
    this.bump();
  }

  mourn(): boolean {
    const key = 'luto_d' + this.st.day;
    if (this.st.flags[key]) return false;
    const rec = this.st.history[this.st.history.length - 1];
    if (!rec || rec.deaths === 0) return false;
    this.st.flags[key] = true;
    const e = this.eff();
    e.add('humanidade', 1, 'luto');
    e.add('desgaste', -2, 'luto');
    this.bump();
    return true;
  }

  toHome() {
    if (this.st.phase !== 'relatorio') return;
    if (this.st.gameOver) return this.toGameOver();
    this.shift = undefined;
    this.unsubShift?.();
    this.st.shift = undefined;
    if (this.simone) {
      if (this.st.day >= 20) {
        this.toEnding();
        return;
      }
      // antes da cena: ao carregar, a noite recomeça e os efeitos de entrada valem uma vez só
      this.resumeSnap = JSON.stringify({ ...this.st, phase: 'casa' });
      this.startNight();
      this.setPhase('casa');
      this.emit({ type: 'save' });
      return;
    }
    if (this.st.mode === 'infinito') {
      // próximo turno, sem casa
      this.st.infinite!.shifts++;
      this.st.vars.desgaste = Math.min(95, this.st.vars.desgaste);
      this.enterDay();
      return;
    }
    if (this.st.day >= 20 || this.st.mode !== 'campanha') {
      this.toEnding();
      return;
    }
    this.home = new HomeSim(this.st, this.c);
    this.home.start();
    this.setPhase('casa');
    this.emit({ type: 'save' });
  }

  // ---------------------------------------------------------------------------
  // casa
  // ---------------------------------------------------------------------------
  finishHome() {
    if (!this.home) return;
    // dormir é o último passo da noite: antes da folga e das contas não pula etapas
    const step = this.st.home?.step;
    if (step !== 'loja' && step !== 'fim') return;
    const r = this.home.finish();
    if (r.gameOver) {
      this.toGameOver();
      return;
    }
    this.st.home = undefined;
    this.home = undefined;
    this.st.day++;
    this.enterDay();
  }

  // ---------------------------------------------------------------------------
  // final
  // ---------------------------------------------------------------------------
  toEnding() {
    if (this.simone) {
      const e = this.c.simone?.ending(this.ctx()) ?? { kind: 'normal' as const, lines: ['Fim'], threads: [] };
      this.st.ending = { kind: e.kind, lines: e.lines.map((l) => resolveTokens(l, this.st.gender, this.st)), threads: e.threads.map((t) => ({ ...t, text: resolveTokens(t.text, this.st.gender, this.st) })) };
      this.eff().achievement('outro_lado');
      this.emit({ type: 'telemetry', name: 'ending', data: { kind: e.kind, mode: 'simone', money: this.st.money } });
      this.emit({ type: 'save' });
      this.setPhase('final');
      return;
    }
    const chk = checkEnding(this.st);
    if (this.st.totals.coffee === 0) this.eff().achievement('sem_cafe');
    if (chk.secretEligible && !this.st.flags['cadeira_decidida']) {
      this.st.flags['cadeira_oferecida'] = true;
    } else {
      this.st.ending = buildEnding(this.st, this.c);
      this.emitEnding();
    }
    this.setPhase('final');
  }

  decideChair(choice: 'assinar' | 'recusar') {
    if (this.st.ending) return;
    this.st.flags['cadeira_decidida'] = choice;
    this.st.ending = buildEnding(this.st, this.c, choice);
    this.emitEnding();
    // evento de fase: a interface registra o final (metas, desbloqueio da campanha da Simone, trilha)
    this.setPhase('final');
  }

  private emitEnding() {
    const e = this.st.ending!;
    const ach: Record<string, string> = { ruim: 'linha_ocupada', normal: 'a_gente_sobreviveu', bom: 'medico_do_telefone', secreto: 'a_cadeira' };
    this.eff().achievement(ach[e.kind]);
    this.emit({ type: 'telemetry', name: 'ending', data: { kind: e.kind, keys: Object.values(this.st.keys).filter((x) => x === 'salvo').length, money: this.st.money, lacos: this.st.vars.lacos, integridade: this.st.vars.integridade } });
    this.emit({ type: 'save' });
  }

  // ---------------------------------------------------------------------------
  // campanha da Simone
  // ---------------------------------------------------------------------------
  private enterSimoneDay(first: boolean) {
    const st = this.st;
    const sh = st.shadow!;
    sh.day = st.day;
    for (const pid of this.c.manualUntil(sh.day)) if (!sh.manual.includes(pid)) sh.manual.push(pid);
    const sday = simoneDay(this.c, st.day);
    sday?.shadow?.(sh);
    // o mundo segue as regras do dia (frota, aluguel do regulador etc.)
    this.dayDef()?.onStart?.(makeEffCtx(sh, {}));
    sday?.onStart?.(this.eff());
    st.flags['noite_passo'] = '';
    if (this.checkSimoneGameOver()) return;
    st.phase = 'jornal';
    if (!first) this.emit({ type: 'save' });
    this.emit({ type: 'phase', phase: 'jornal' });
    this.bump();
  }

  private beginSimoneShift() {
    const st = this.st;
    const sh = st.shadow!;
    sh.phase = 'plantao';
    const sday = simoneDay(this.c, st.day);
    this.shift = new ShiftSim(sh, this.c, false, this.dayDef());
    const T = this.shift.sh.tarm!;
    if (sday?.moura?.acc !== undefined) this.shift.sh.flags['acc_moura'] = sday.moura.acc;
    if (sday?.henrique?.acc !== undefined) this.shift.sh.flags['acc_henrique'] = sday.henrique.acc;
    if (sday?.henrique?.away) T.regs.henrique.away = true;
    // pressão alta: a mão demora
    this.shift.baseScale *= st.vars.pressao >= 8 ? 1.08 : 1;
    this.unsubShift = this.shift.on((e) => {
      this.emit(e);
      if (e.type === 'end') this.onShiftEnd();
    });
    st.phase = 'plantao';
    const mo = sday?.morning?.(this.ctx());
    if (mo) {
      this.scene = new SceneRunner(mo, () => this.ctx(), () => this.eff(), () => this.st);
      this.sceneKind = 'handover';
    }
    this.emit({ type: 'phase', phase: 'plantao' });
    this.bump();
  }

  /** dispara cenas curtas do dia; devolve true se uma cena abriu */
  private checkSimoneEvents(): boolean {
    const sday = simoneDay(this.c, this.st.day);
    const sim = this.shift;
    if (!sday?.events?.length || !sim || sim.sh.ended) return false;
    const w = simoneWorld(sim);
    for (let i = 0; i < sday.events.length; i++) {
      const ev = sday.events[i];
      const key = `ev_d${this.st.day}_${i}`;
      if (sim.sh.flags[key]) continue;
      if (hm(ev.at) > sim.sh.time) continue;
      const until = ev.until ? hm(ev.until) : ev.onCall ? hm('21:00') : hm(ev.at) + 60;
      if (sim.sh.time > until) {
        sim.sh.flags[key] = 'perdido';
        continue;
      }
      if (ev.onCall) {
        const call = w.call(ev.onCall);
        if (!call || call.status !== 'ativa' || sim.sh.activeId !== call.id) continue;
      }
      if (ev.when && !ev.when(this.ctx(), w)) continue;
      sim.sh.flags[key] = true;
      this.scene = new SceneRunner(ev.scene(this.ctx(), w), () => this.ctx(), () => this.eff(), () => this.st);
      this.sceneKind = 'event';
      this.pendingOut = !!ev.out?.(this.ctx(), w);
      return true;
    }
    return false;
  }

  private onSimoneShiftEnd() {
    const sim = this.shift!;
    const res = settleSimoneShift(this.st, this.c, sim);
    this.simoneResult = res;
    this.st.shadow!.phase = 'jornal';
    if (res.passed >= 6 && res.right === res.passed) this.eff().achievement('post_it_certo');
    this.emit({ type: 'telemetry', name: 'day_end', data: { mode: 'simone', day: this.st.day, passed: res.passed, right: res.right, tma: Math.round(res.tma), money: this.st.money } });
    if (this.checkSimoneGameOver(true)) return;
    const ev = simoneDay(this.c, this.st.day)?.evening?.(this.ctx(), simoneWorld(sim));
    if (ev) {
      this.scene = new SceneRunner(ev, () => this.ctx(), () => this.eff(), () => this.st);
      this.sceneKind = 'evening';
      this.st.phase = 'plantao';
      this.bump();
      return;
    }
    this.setPhase('relatorio');
  }

  private checkSimoneGameOver(deferToReport = false): boolean {
    const st = this.st;
    let kind: 'exonerado' | 'colapso' | 'despejo' | undefined;
    if (st.totals.warnings >= (st.difficulty === 'real' ? 2 : 3) || st.vars.emprego <= 0) kind = 'exonerado';
    else if (st.vars.desgaste >= 100 || st.flags['simone_colapso']) kind = 'colapso';
    else if (st.money < -250) kind = 'despejo';
    if (!kind) return false;
    st.gameOver = { kind, day: st.day, text: '' };
    if (deferToReport) {
      // mostra o relatório do dia antes do fim
      this.fillGameOverText();
      this.emit({ type: 'telemetry', name: 'gameover', data: { kind, day: st.day, mode: 'simone' } });
      this.setPhase('relatorio');
      return true;
    }
    this.toGameOver();
    return true;
  }

  private startNight() {
    const sday = simoneDay(this.c, this.st.day);
    const step = this.st.flags['noite_passo'];
    if (step === 'contas') return;
    const sc = sday?.night(this.ctx());
    if (sc) {
      this.scene = new SceneRunner(sc, () => this.ctx(), () => this.eff(), () => this.st);
      this.sceneKind = 'night';
      this.st.flags['noite_passo'] = 'cena';
    } else this.st.flags['noite_passo'] = 'contas';
  }

  /** contas da noite da Simone */
  nightBills(): SimoneBillView[] {
    return simoneBills(this.st, this.c, this.ctx()).views;
  }

  finishNight(paid: string[]) {
    if (!this.simone || this.st.phase !== 'casa') return;
    const { defs, views } = simoneBills(this.st, this.c, this.ctx());
    const e = this.eff();
    let total = 0;
    for (const b of defs) {
      const v = views.find((x) => x.id === b.id)!;
      if (v.auto || paid.includes(b.id)) {
        total += v.amount;
        b.onPay?.(e);
      } else b.onSkip?.(e);
    }
    this.st.money -= total;
    this.st.flags['noite_passo'] = '';
    this.scene = undefined;
    this.sceneKind = undefined;
    if (this.checkSimoneGameOver()) return;
    this.st.day++;
    this.enterDay();
  }

  chairText(): string[] {
    return this.c.endings.chairOffer(this.ctx()).map((x) => resolveTokens(x, this.st.gender, this.st));
  }
}
