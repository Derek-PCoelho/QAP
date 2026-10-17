// =============================================================================
// Interlúdio em casa: folga, evento familiar (cena com escolhas), Modo
// Inconsistência doméstico, contas, loja, consequências para a família.
// =============================================================================
import type { GameState, SceneDef, SceneNode, Choice, BillDef, ShopItem, InterludeDef, LinkDef, Ctx, EffCtx, DLine, MemberStatus, FamilyMember, FieldShift } from './types';
import type { Content } from './content-api';
import { makeCtx, makeEffCtx, VAR_LABEL } from './state';
import { txt, resolveTokens, cluesIn } from './text';
import { clamp } from './util';
import { FieldSim, createFieldShift, FIELD_WEAR, FIELD_WEAR_DEATH, FIELD_SLEEP_DEBT } from './field';

/** desgaste que sai brincando com o Ozzy (uma vez por noite) */
export const OZZY_RELIEF = 4;

export const BICO_PAY = 150;
export const TRANSPORT = 20;

export interface HomeToast {
  text: string;
  kind: 'bom' | 'ruim' | 'info' | 'dinheiro';
}

export interface BillView {
  id: string;
  label: string;
  amount: number;
  auto: boolean;
  desc: string;
  paid: boolean;
  kind: 'base' | 'evento' | 'divida';
}

export class HomeSim {
  st: GameState;
  c: Content;
  toasts: HomeToast[] = [];
  listeners: (() => void)[] = [];
  /** estado antes da cena em curso: as cenas são montadas a partir do estado (e mudam com ele),
   *  então um save no meio delas volta a este ponto em vez de remontar uma cena diferente */
  resumeSnap?: string;

  constructor(st: GameState, c: Content) {
    this.st = st;
    this.c = c;
  }

  get day() {
    return this.c.days[this.st.day];
  }
  get inter(): InterludeDef | undefined {
    return this.day?.interlude;
  }
  ctx(): Ctx {
    return makeCtx(this.st);
  }
  eff(): EffCtx {
    return makeEffCtx(this.st, {
      onVar: (v, d) => this.toast(`${VAR_LABEL[v]} ${d > 0 ? '+' : ''}${d}`, v === 'desgaste' ? (d > 0 ? 'ruim' : 'bom') : d > 0 ? 'bom' : 'ruim'),
      onMoney: (a, r) => this.toast(`${a >= 0 ? '+' : '−'}R$ ${Math.abs(a)} · ${r}`, 'dinheiro'),
      onToast: (t) => this.toast(t.text, t.kind),
      onAchievement: (id) => this.toast(`Conquista: ${this.c.achievements.find((a) => a.id === id)?.name ?? id}`, 'bom'),
    });
  }
  toast(text: string, kind: HomeToast['kind'] = 'info') {
    this.toasts.push({ text: resolveTokens(text, this.st.gender, this.st), kind });
    if (this.toasts.length > 12) this.toasts.shift();
  }

  // ---------------------------------------------------------------------------
  start() {
    const st = this.st;
    this.resumeSnap = JSON.stringify({ ...st, phase: 'casa', home: undefined });
    const e = this.eff();
    st.home = { step: 'pre', lineIdx: 0, paid: [], bought: [], found: [], tried: [], inspected: false, log: [], sceneDone: false };
    // café: chega irritado
    if (st.irritado > 0) {
      e.add('desgaste', 8 * st.irritado, 'café');
      this.toast('Você chega em casa {m:irritado|irritada}. As falas mais carinhosas ficam difíceis hoje.', 'ruim');
    }
    // renda do ateliê
    if (st.flags['maquina'] && this.present('lucia') && !st.flags['sem_costura_hoje']) {
      const v = 40 + (st.flags['rosangela_ajudante'] ? 20 : 0);
      e.pay(v, 'Ateliê {doconj}');
    }
    delete st.flags['sem_costura_hoje'];
    // internação da Zélia: custo e Lúcia sem costurar
    if (st.family.zelia.status === 'internado') {
      e.pay(-40, 'Internação da Dona Zélia (táxi e farmácia)');
      st.family.zelia.status = 'doente';
    }
    const pre = this.inter?.pre;
    if (pre) {
      const sc = typeof pre === 'function' ? pre(this.ctx()) : pre;
      this.enterScene(sc, 'pre');
    } else st.home.step = 'escolha';
  }

  present(m: FamilyMember): boolean {
    const f = this.st.family[m];
    return f.status !== 'ausente' && f.status !== 'morto' && !f.away;
  }

  teaser(): string {
    const t = this.inter?.teaser;
    return t ? resolveTokens(txt(t, this.ctx()), this.st.gender, this.st) : 'Uma noite comum em casa.';
  }

  canBico(): boolean {
    return !this.inter?.noBico && !this.tooTiredForField();
  }

  /** com o desgaste alto demais, ninguém deixa você subir na ambulância */
  tooTiredForField(): boolean {
    return !!this.c.field?.cases.length && this.st.vars.desgaste >= 80;
  }

  chooseTimeOff(k: 'descanso' | 'familia' | 'bico') {
    const st = this.st;
    const h = st.home!;
    if (h.timeOff) return;
    this.resumeSnap = JSON.stringify(st);
    h.timeOff = k;
    const e = this.eff();
    const inter = this.inter;
    if (k === 'descanso') {
      e.add('desgaste', -15, 'descanso');
      inter?.onRest?.(e);
    } else if (k === 'familia') {
      e.add('lacos', inter?.familyLacos ?? 1, 'tempo com a família');
      e.add('desgaste', -10, 'família');
      inter?.onFamily?.(e);
    } else if (this.c.field?.cases.length) {
      // plantão extra na Intervenção: o jogo da ambulância vem antes da cena de casa
      st.totals.bicos++;
      inter?.onBico?.(e);
      const ctx = this.ctx();
      const radio = (inter?.field?.radio ?? [])
        .filter((r) => !r.when || r.when(ctx))
        .map((r) => ({ before: r.before, who: r.who, text: resolveTokens(r.text, st.gender, st) }));
      h.field = createFieldShift(st, this.c.field.cases, { special: inter?.field?.cases, radio });
      h.step = 'intervencao';
      const last = st.history[st.history.length - 1];
      if (last) last.timeOff = k;
      return;
    } else {
      e.pay(BICO_PAY, 'Bico na UPA');
      e.add('desgaste', 20, 'bico');
      st.totals.bicos++;
      inter?.onBico?.(e);
    }
    const last = st.history[st.history.length - 1];
    if (last) last.timeOff = k;
    // cena
    if (k === 'bico') {
      const b = inter?.bico ?? this.c.home.genericBico(this.ctx());
      this.enterScene(typeof b === 'function' ? b(this.ctx()) : b, 'cena');
    } else {
      const sc = inter?.scene ?? this.c.home.genericScene(this.ctx());
      this.enterScene(typeof sc === 'function' ? sc(this.ctx()) : sc, 'cena');
    }
  }

  // ---------------------------------------------------------------------------
  // Intervenção (plantão extra na ambulância)
  // ---------------------------------------------------------------------------
  private fieldCache?: { f: FieldShift; sim: FieldSim };

  fieldSim(): FieldSim | undefined {
    const f = this.st.home?.field;
    if (!f || !this.c.field) return undefined;
    if (this.fieldCache?.f !== f) this.fieldCache = { f, sim: new FieldSim(f, this.c.field.cases, this.st.difficulty, 'USA 01', (t) => resolveTokens(t, this.st.gender, this.st)) };
    return this.fieldCache.sim;
  }

  /** fim do plantão extra: paga, cansa, marca a noite em claro e mostra o que aconteceu em casa */
  finishField(): void {
    const st = this.st;
    const h = st.home;
    const sim = this.fieldSim();
    if (!h || !sim || h.step !== 'intervencao' || sim.f.phase !== 'fim') return;
    // já pago: veio de um save feito depois da Intervenção; só falta a cena de casa
    if (!sim.f.paid) {
      const sum = sim.summary();
      const e = this.eff();
      sim.f.paid = true;
      e.pay(sum.pay, 'Plantão extra na Intervenção');
      // noites seguidas na ambulância: a dívida de sono cresce (+5 de desgaste por noite seguida a mais;
      // no plantão seguinte, mais cochilos e menos tempo para reagir — ver ShiftSim)
      const seguidas = (Number(st.flags['noites_seguidas']) || 0) + 1;
      st.flags['noites_seguidas'] = seguidas;
      e.add('desgaste', FIELD_WEAR + FIELD_SLEEP_DEBT * (seguidas - 1) + FIELD_WEAR_DEATH * sum.deaths, seguidas > 1 ? `noite na ambulância (${seguidas}ª seguida)` : 'noite na ambulância');
      e.add('intimBene', 1, 'uma noite na 01 com o Bené');
      if (sum.hurt) e.add('desgaste', 6, 'equipe ferida');
      st.flags['noite_em_claro'] = true;
      st.flags['fez_intervencao'] = true;
      for (const r of sum.results) st.flags['field_' + r.id] = true;
      e.achievement('dobra');
      if (sum.results.length >= 3 && sum.stable === sum.results.filter((r) => r.outcome !== 'trote').length && sum.stable > 0) e.achievement('noite_limpa');
      if (sim.f.results.some((r) => r.id === 'bar_faca' && r.outcome !== 'equipe_ferida')) e.achievement('esperou_a_pm');
    }
    // a noite já está paga: um save na cena seguinte volta ao resumo do plantão extra,
    // e não à escolha da folga (que jogaria fora a Intervenção inteira, pagamento e cochilos)
    this.resumeSnap = JSON.stringify(st);
    const b = this.inter?.bico ?? this.c.home.genericBico(this.ctx());
    this.enterScene(typeof b === 'function' ? b(this.ctx()) : b, 'cena');
  }

  // ---------------------------------------------------------------------------
  // cenas
  // ---------------------------------------------------------------------------
  private scenes = new Map<string, SceneDef>();

  enterScene(sc: SceneDef, step: 'pre' | 'cena') {
    const h = this.st.home!;
    this.scenes.set(sc.id, sc);
    h.sceneId = sc.id;
    h.node = 'start';
    h.lineIdx = 0;
    h.step = step;
    h.sceneDone = false;
    const n = sc.nodes['start'];
    if (n?.onEnter) n.onEnter(this.eff());
  }

  scene(): SceneDef | undefined {
    const h = this.st.home;
    if (!h?.sceneId) return undefined;
    let sc = this.scenes.get(h.sceneId);
    if (!sc) {
      // recarregado de save: reconstrói
      const inter = this.inter;
      const cands: (SceneDef | ((c: Ctx) => SceneDef) | undefined)[] = [inter?.pre, inter?.scene, inter?.bico];
      for (const x of cands) {
        if (!x) continue;
        const s = typeof x === 'function' ? x(this.ctx()) : x;
        if (s.id === h.sceneId) sc = s;
      }
      if (!sc) {
        const g = this.c.home.genericScene(this.ctx());
        const b = this.c.home.genericBico(this.ctx());
        sc = [g, b].find((s) => s.id === h.sceneId);
      }
      if (sc) this.scenes.set(sc.id, sc);
    }
    return sc;
  }

  node(): SceneNode | undefined {
    const sc = this.scene();
    const h = this.st.home;
    if (!sc || !h?.node) return undefined;
    return sc.nodes[h.node];
  }

  visibleLines(): (DLine & { text: string })[] {
    const n = this.node();
    if (!n) return [];
    const c = this.ctx();
    return n.lines.filter((l) => !l.when || l.when(c)).map((l) => ({ ...l, text: resolveTokens(txt(l.t, c), this.st.gender, this.st) }));
  }

  choices(): { idx: number; label: string; disabled: boolean; reason?: string; hint?: string; affectionate?: boolean }[] {
    const n = this.node();
    if (!n?.choices) return [];
    const c = this.ctx();
    const h = this.st.home!;
    const out: { idx: number; label: string; disabled: boolean; reason?: string; hint?: string; affectionate?: boolean }[] = [];
    n.choices.forEach((ch, idx) => {
      if (ch.when && !ch.when(c)) return;
      if (ch.needLink && !h.found.includes(ch.needLink)) return;
      let disabled = false;
      let reason: string | undefined;
      if (ch.needMoney !== undefined && this.st.money < ch.needMoney) {
        disabled = true;
        reason = `Precisa de R$ ${ch.needMoney}`;
      }
      if (ch.affectionate && this.st.irritado > 0) {
        disabled = true;
        reason = `Você está ${this.st.gender === 'M' ? 'irritado' : 'irritada'} demais (café)`;
      }
      out.push({ idx, label: resolveTokens(txt(ch.label, c), this.st.gender, this.st), disabled, reason, hint: ch.hint, affectionate: ch.affectionate });
    });
    return out;
  }

  /** avança após ler todas as falas de um nó sem escolhas */
  continueScene() {
    const n = this.node();
    if (!n) return this.endScene();
    if (n.choices && this.choices().length) return;
    if (n.next) this.goto(n.next);
    else this.endScene();
  }

  choose(idx: number) {
    const n = this.node();
    const ch: Choice | undefined = n?.choices?.[idx];
    if (!ch) return;
    const vis = this.choices().find((x) => x.idx === idx);
    if (!vis || vis.disabled) return;
    const h = this.st.home!;
    h.log.push(txt(ch.label, this.ctx()));
    if (ch.effect) ch.effect(this.eff());
    if (ch.next) this.goto(ch.next);
    else this.endScene();
  }

  goto(nodeId: string) {
    const sc = this.scene();
    const h = this.st.home!;
    if (!sc || !sc.nodes[nodeId]) return this.endScene();
    h.node = nodeId;
    h.lineIdx = 0;
    const n = sc.nodes[nodeId];
    if (n.onEnter) n.onEnter(this.eff());
  }

  endScene() {
    const h = this.st.home!;
    h.sceneDone = true;
    if (h.step === 'pre') {
      h.step = 'escolha';
      h.sceneId = undefined;
      h.node = undefined;
      return;
    }
    h.step = 'contas';
  }

  // ---------------------------------------------------------------------------
  // Modo Inconsistência doméstico
  // ---------------------------------------------------------------------------
  inspectAvailable(): boolean {
    return !!this.scene()?.inspect;
  }

  homeClues(): { id: string; text: string; source: 'fala' | 'objeto'; x?: number; y?: number; w?: number; h?: number; desc?: string }[] {
    const sc = this.scene();
    const out: { id: string; text: string; source: 'fala' | 'objeto'; x?: number; y?: number; w?: number; h?: number; desc?: string }[] = [];
    if (!sc) return out;
    const c = this.ctx();
    // falas já exibidas da cena (todas as do nó atual e anteriores visitados)
    for (const node of Object.values(sc.nodes)) {
      for (const l of node.lines) {
        if (l.when && !l.when(c)) continue;
        for (const cl of cluesIn(resolveTokens(txt(l.t, c), this.st.gender, this.st))) out.push({ id: cl.id, text: `${l.who}: “${cl.text}”`, source: 'fala' });
      }
    }
    for (const o of sc.inspect?.objects ?? []) {
      if (o.when && !o.when(c)) continue;
      out.push({ id: o.id, text: resolveTokens(o.label, this.st.gender, this.st), source: 'objeto', x: o.x, y: o.y, w: o.w, h: o.h, desc: resolveTokens(txt(o.desc, c), this.st.gender, this.st) });
    }
    const seen = new Set<string>();
    return out.filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)));
  }

  /** usar o modo sem nada escondido custa Laços */
  markInspect(): string | undefined {
    const h = this.st.home!;
    if (h.inspected) return undefined;
    h.inspected = true;
    if (!this.scene()?.inspect) {
      this.eff().add('lacos', -1, 'família se sentiu vigiada');
      return resolveTokens(this.c.home.pointlessInspect(this.ctx()), this.st.gender, this.st);
    }
    return undefined;
  }

  link(a: string, b: string): { ok: boolean; insight?: string } {
    const sc = this.scene();
    const h = this.st.home!;
    const key = [a, b].sort().join('×');
    const links: LinkDef[] = sc?.inspect?.links ?? [];
    const m = links.find((l) => [l.a, l.b].sort().join('×') === key);
    if (!m) {
      if (!h.tried.includes(key)) h.tried.push(key);
      if (h.tried.length === 3) {
        this.eff().add('lacos', -1, '"Para de me examinar."');
        this.toast(this.c.home.pointlessInspect(this.ctx()), 'ruim');
      }
      return { ok: false };
    }
    if (!h.found.includes(key)) {
      h.found.push(key);
      // também registra pelo nome da pista de desbloqueio
      if (m.unlock) for (const u of Array.isArray(m.unlock) ? m.unlock : [m.unlock]) if (!h.found.includes(u)) h.found.push(u);
      if (m.onFind) m.onFind(this.eff());
    }
    return { ok: true, insight: resolveTokens(txt(m.insight, this.ctx()), this.st.gender, this.st) };
  }

  // ---------------------------------------------------------------------------
  // contas e loja
  // ---------------------------------------------------------------------------
  bills(): BillView[] {
    const c = this.ctx();
    const h = this.st.home;
    const b = this.st.bills;
    const list: BillView[] = [];
    const add = (x: BillDef, kind: BillView['kind']) => {
      if (x.when && !x.when(c)) return;
      const amount = typeof x.amount === 'function' ? x.amount(c) : x.amount;
      list.push({ id: x.id, label: x.label, amount, auto: !!x.auto, desc: x.desc ? resolveTokens(txt(x.desc, c), this.st.gender, this.st) : '', paid: !!h?.paid.includes(x.id), kind });
    };
    for (const x of this.c.home.baseBills(c)) add(x, 'base');
    if (b.rentOverdue > 0) list.push({ id: 'aluguel_atrasado', label: `Aluguel atrasado (${b.rentOverdue}×)`, amount: b.rentDebt, auto: false, desc: '3 atrasos = despejo.', paid: !!h?.paid.includes('aluguel_atrasado'), kind: 'divida' });
    if (b.energyCut) list.push({ id: 'religacao', label: 'Religação de energia', amount: 60, auto: false, desc: 'A luz foi cortada. A insulina não tem onde ficar.', paid: !!h?.paid.includes('religacao'), kind: 'divida' });
    for (const x of this.inter?.bills ?? []) add(x, 'evento');
    return list;
  }

  billTotal(ids: string[]): number {
    return this.bills()
      .filter((b) => ids.includes(b.id) || b.auto)
      .reduce((a, b) => a + b.amount, 0);
  }

  /** confirma pagamento (ids escolhidos; automáticas sempre) */
  payBills(ids: string[]): { ok: boolean; error?: string } {
    // só no passo das contas: um clique duplo (ou repetido) não cobra a mesma noite duas vezes
    if (this.st.home?.step !== 'contas') return { ok: false, error: 'As contas desta noite já foram resolvidas.' };
    const all = this.bills();
    const chosen = all.filter((b) => !b.auto && ids.includes(b.id));
    const autos = all.filter((b) => b.auto);
    const total = chosen.reduce((a, b) => a + b.amount, 0);
    if (total > Math.max(0, this.st.money - autos.reduce((a, b) => a + b.amount, 0))) return { ok: false, error: 'Dinheiro insuficiente.' };
    const h = this.st.home!;
    const e = this.eff();
    for (const b of [...autos, ...chosen]) {
      this.st.money -= b.amount;
      h.paid.push(b.id);
    }
    if (autos.length || chosen.length) this.toast(`Contas pagas: R$ ${autos.concat(chosen).reduce((a, b) => a + b.amount, 0)}`, 'dinheiro');
    // efeitos de pagar/não pagar das contas de evento
    const c = this.ctx();
    for (const x of [...this.c.home.baseBills(c), ...(this.inter?.bills ?? [])]) {
      if (x.when && !x.when(c)) continue;
      if (h.paid.includes(x.id)) x.onPay?.(e);
      else x.onSkip?.(e);
    }
    this.applyDebts(h.paid);
    h.step = 'loja';
    return { ok: true };
  }

  shop(): (ShopItem & { priceN: number; owned: boolean; descT: string })[] {
    const c = this.ctx();
    const items = [...this.c.home.shop, ...(this.inter?.shop ?? [])];
    return items
      .filter((i) => !i.when || i.when(c))
      .map((i) => ({
        ...i,
        priceN: typeof i.price === 'function' ? i.price(c) : i.price,
        owned: !!(i.once && this.st.flags['item_' + i.id]),
        descT: resolveTokens(txt(i.desc, c), this.st.gender, this.st),
      }));
  }

  /**
   * Ozzy, o lulu da pomerânia laranja: brincar com ele uma vez por noite tira um pouco do desgaste.
   * Nada de ruim acontece com o Ozzy em nenhum momento do jogo (nem conta, nem evento, nem final).
   */
  playOzzy(): { ok: boolean; text: string } {
    const st = this.st;
    const h = st.home;
    if (!h) return { ok: false, text: '' };
    if (h.ozzy) return { ok: false, text: 'O Ozzy já dormiu, enrolado no tapete.' };
    h.ozzy = true;
    const dias = (Number(st.flags['ozzy_dias']) || 0) + 1;
    st.flags['ozzy_dias'] = dias;
    const e = this.eff();
    e.add('desgaste', -OZZY_RELIEF, 'brincou com o Ozzy');
    if (dias >= 10) e.achievement('melhor_amigo');
    const falas = [
      'O Ozzy traz a bolinha e solta no seu pé. Três arremessos depois, você está rindo {sozinho} na cozinha.',
      'O Ozzy rola de barriga para cima e espera. Você coça até a respiração desacelerar: a dele e a sua.',
      'O Ozzy dá voltas em você como se você tivesse chegado da guerra. Talvez tenha.',
      'Você senta no chão. O Ozzy sobe no seu colo, gira três vezes e dorme. Por dez minutos, o mundo cabe ali.',
      'O Ozzy late para a vassoura, para a porta e para você, nessa ordem. Você ri pela primeira vez no dia.',
      'O Ozzy pega a meia e foge. Você corre atrás pela sala inteira. Ele deixa você ganhar.',
    ];
    return { ok: true, text: falas[(st.day * 7 + dias) % falas.length] };
  }

  buy(id: string): { ok: boolean; error?: string } {
    const it = this.shop().find((i) => i.id === id);
    if (!it) return { ok: false, error: 'Item indisponível.' };
    if (it.owned) return { ok: false, error: 'Já comprado.' };
    const h = this.st.home!;
    if (h.bought.includes(id)) return { ok: false, error: 'Já comprado hoje.' };
    if (this.st.money < it.priceN) return { ok: false, error: 'Dinheiro insuficiente.' };
    const e = this.eff();
    e.pay(-it.priceN, it.label);
    h.bought.push(id);
    if (it.once) this.st.flags['item_' + id] = true;
    it.effect?.(e);
    return { ok: true };
  }

  private applyDebts(paid: string[]) {
    const b = this.st.bills;
    if (paid.includes('aluguel_atrasado')) {
      b.rentDebt = 0;
      b.rentOverdue = 0;
    }
    if (paid.includes('religacao')) {
      b.energyCut = false;
      b.energyMissed = 0;
    }
  }

  // ---------------------------------------------------------------------------
  // fim do interlúdio: consequências
  // ---------------------------------------------------------------------------
  finish(): { gameOver?: 'despejo' | 'colapso'; notes: string[] } {
    const st = this.st;
    const h = st.home!;
    const b = st.bills;
    const f = st.family;
    const e = this.eff();
    const notes: string[] = [];
    const paid = (id: string) => h.paid.includes(id);
    const wasCritical = f.zelia.status === 'critico';

    // aluguel
    if (!paid('aluguel')) {
      b.rentOverdue++;
      b.rentDebt += b.rent;
      notes.push(`Aluguel não pago (${b.rentOverdue}/3 atrasos).`);
    }
    // alimentação
    if (!paid('alimentacao')) {
      b.foodMissed++;
      for (const m of ['lucia', 'davi', 'zelia'] as const) if (this.present(m) && f[m].status === 'bem') f[m].status = 'fome';
      notes.push('Sem compra de comida: a família ficou com fome.');
      if (b.foodMissed >= 2) {
        f.zelia.risk += 1;
        f.davi.risk += 1;
        notes.push('Dois interlúdios seguidos com pouca comida: alguém vai adoecer.');
      }
    } else {
      b.foodMissed = 0;
      for (const m of ['lucia', 'davi', 'zelia'] as const) if (f[m].status === 'fome') f[m].status = 'bem';
    }
    // energia
    if (!b.energyCut) {
      if (!paid('energia')) {
        b.energyMissed++;
        if (b.energyMissed === 1) notes.push('Chegou o aviso de corte de energia.');
        else {
          b.energyCut = true;
          b.insulinSpoiled = true;
          f.zelia.risk += 2;
          notes.push('A energia foi cortada. A insulina da Dona Zélia estragou.');
        }
      } else b.energyMissed = 0;
    }
    // gás
    if (!paid('gas')) {
      b.gasMissed++;
      e.add('lacos', -1, 'comida fria');
      if (this.present('davi') && f.davi.status === 'bem') f.davi.status = 'frio';
      notes.push('Sem gás: comida fria.');
    } else {
      b.gasMissed = 0;
      if (f.davi.status === 'frio') f.davi.status = 'bem';
    }
    // remédios
    if (!paid('remedios')) {
      b.medsMissed++;
      f.zelia.risk += 1;
      notes.push('Sem os remédios da Dona Zélia.');
      if (b.medsMissed >= 2) {
        f.zelia.status = 'internado';
        b.medsMissed = 0;
        st.flags['sem_costura_hoje'] = true;
        notes.push('Dona Zélia foi internada.');
      }
    } else {
      b.medsMissed = 0;
      f.zelia.risk = Math.max(0, f.zelia.risk - 1);
    }
    // geladeira
    if (st.flags['geladeira_quebrada'] && !st.flags['geladeira_ok'] && !paid('isopor') && !h.bought.includes('isopor')) {
      f.zelia.risk += 2;
      notes.push('Sem geladeira nem isopor: a insulina estragou.');
    }
    // limites e estado da Zélia
    f.zelia.risk = clamp(f.zelia.risk, 0, 9);
    if (f.zelia.status !== 'morto' && f.zelia.status !== 'internado') {
      if (f.zelia.risk >= 7 && wasCritical) {
        f.zelia.status = 'morto';
        st.flags['zelia_morreu'] = true;
        notes.push('Dona Zélia não resistiu.');
        e.add('desgaste', 25, 'luto');
        e.add('lacos', -2, 'luto');
      } else if (f.zelia.risk >= 5) f.zelia.status = 'critico';
      else if (f.zelia.risk >= 3) f.zelia.status = 'doente';
      else if (f.zelia.status === 'doente' || f.zelia.status === 'critico') f.zelia.status = 'bem';
    }
    // Davi
    f.davi.risk = clamp(f.davi.risk, 0, 5);
    if (this.present('davi')) {
      if (f.davi.risk >= 3) f.davi.status = 'doente';
      else if (f.davi.status === 'doente' && f.davi.risk < 2) f.davi.status = 'bem';
    }
    if (paid('alimentacao') && paid('gas')) f.davi.risk = Math.max(0, f.davi.risk - 1);
    // Lúcia
    if (this.present('lucia')) {
      if (st.vars.lacos <= 4 && f.lucia.status === 'bem') f.lucia.status = 'triste';
      else if (st.vars.lacos >= 6 && f.lucia.status === 'triste') f.lucia.status = 'bem';
    }
    if (st.vars.lacos < 3 && !st.flags['lucia_foi_embora']) {
      st.flags['lucia_foi_embora'] = true;
      f.lucia.status = 'ausente';
      f.davi.status = 'ausente';
      notes.push(resolveTokens('{conj} foi embora com o Liam.', st.gender, st));
    }
    // despejo
    if (b.rentOverdue >= 3) {
      st.gameOver = { kind: 'despejo', day: st.day, text: '' };
      return { gameOver: 'despejo', notes };
    }
    // desgaste 100 é colapso também em casa (noite na ambulância com óbitos, luto): sem isto o
    // plantão seguinte começava em 100 e o colapso só vinha na primeira penalidade ou na auditoria
    if (st.vars.desgaste >= 100) {
      st.gameOver = { kind: 'colapso', day: st.day, text: '' };
      return { gameOver: 'colapso', notes };
    }
    st.irritado = 0;
    h.step = 'fim';
    return { notes };
  }

  familyStatus(): Record<FamilyMember, MemberStatus> {
    return { lucia: this.st.family.lucia.status, davi: this.st.family.davi.status, zelia: this.st.family.zelia.status };
  }
}
