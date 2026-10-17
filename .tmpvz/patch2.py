p='src/engine/shift.ts'
s=open(p).read()
def rep(old,new,cnt=1):
    global s
    if s.count(old)!=cnt:
        raise SystemExit(f"count {s.count(old)} != {cnt} for: {old[:80]}")
    s=s.replace(old,new)

rep("""    const verdict = grade({ truth, decision, asked: call.asked, day: this.st.day });
    call.verdict = verdict;
    sh.regTimes.push(sh.time - (call.answered ?? sh.time));""","""    const verdict = grade({ truth, decision, asked: call.asked, day: this.st.day });
    call.verdict = verdict;
    // 1.1: num caso grave, perguntar bem paga; perguntar à toa custou ao paciente (aparece na revelação)
    if (!this.tarm && truth.sev === 'vermelho') {
      const w = Math.round(call.waste ?? 0);
      if (w === 0 && call.asked.length > 0 && (verdict.kind === 'correto' || verdict.kind === 'defensavel')) {
        verdict.bonus += OBJECTIVE_BONUS;
        verdict.text += ` Direto ao ponto: nenhuma pergunta à toa (+R$ ${OBJECTIVE_BONUS}).`;
      } else if (w >= 5) verdict.text += ` ${w} min em perguntas que não mudavam a conduta contaram inteiros contra o paciente.`;
    }
    sh.regTimes.push(sh.time - (call.answered ?? sh.time));""")

rep("""    // peixoto
    this.peixotoWatch();
    const g = def.guide;
    const worsenGuide = (call as CallRT & { pendingGuide?: string }).pendingGuide;
    const gid = worsenGuide ?? (g && (!g.when || g.when(this.ctx())) && g.auto !== false ? (typeof g.id === 'function' ? g.id(this.ctx()) : g.id) : undefined);
    if (gid) this.startGuide(call, gid, Math.max(1, unit.t1 - sh.time));
    else this.closeCall(call);
    return { ok: true };""","""    // peixoto
    this.peixotoWatch();
    // 1.1: vaga zero negociada (ligação marcada em content/vagazero.ts indo para o Regional)
    vzOnStamp(this, call);
    const g = def.guide;
    const worsenGuide = (call as CallRT & { pendingGuide?: string }).pendingGuide;
    const gid = worsenGuide ?? (g && (!g.when || g.when(this.ctx())) && g.auto !== false ? (typeof g.id === 'function' ? g.id(this.ctx()) : g.id) : undefined);
    if (gid) this.startGuide(call, gid, Math.max(1, unit.t1 - sh.time));
    else this.closeCall(call);
    vzTryOpen(this);
    return { ok: true };""")

rep("""    if (lostReds === 0) e.set('mci_sem_obitos');
    summary.unshift(`Triagem: ${rightTriage} de ${mci.victims.length} corretas.`);""","""    if (lostReds === 0) e.set('mci_sem_obitos');
    // 1.1: o Regional também precisa aceitar as vítimas do show
    if (vzOnMci(this, call)) vzTryOpen(this);
    summary.unshift(`Triagem: ${rightTriage} de ${mci.victims.length} corretas.`);""")

rep("""        if (call && this.needsTransport(call)) {
          const dest = call.decision?.dest ?? this.defaultDest(call);""","""        if (call && this.needsTransport(call)) {
          const dest = call.vz?.result === 'desviado' ? 'UPA' : call.decision?.dest ?? this.defaultDest(call);""")

rep("""    // retenção de maca
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
    u.note = `Retenção de maca · ${destLandmark(dest).short}`;""","""    // retenção de maca
    let ret = 25 + Math.floor(randOf(this.st) * 55);
    let note = `Retenção de maca · ${destLandmark(dest).short}`;
    // 1.1: vaga zero negociada para esta ligação (aceita = maca solta logo; sem acordo = presa 40–60 min)
    const vzr = dest === 'REG' ? vzAtHospital(this, u, call) : undefined;
    if (vzr) {
      ret = vzr.ret;
      note = vzr.note;
      this.radio(u.radioName, vzr.text, ret > 20 ? 'alerta' : 'info', call.id);
    } else if (dest === 'REG' && this.sh.noVacancy && !(call as CallRT & { vagaZero?: boolean }).vagaZero) {
      ret += 60;
      const neg = vzEnabled(this);
      this.makeRequest({
        kind: 'vaga',
        from: u.radioName,
        text: `Central, ${u.label} na porta do Regional. Sem vaga, sem maca. Paciente ${t.sev === 'vermelho' ? 'grave' : 'estável'} na nossa prancha.`,
        options: neg
          ? [
              { id: 'negociar', label: 'Ligar pro Regional e negociar a vaga zero' },
              { id: 'upa', label: 'Desviar para a UPA Norte' },
              { id: 'aguardar', label: 'Aguardar liberação' },
            ]
          : [
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
    u.note = note;""")

rep("""    const o = req.options.find((x) => x.id === opt);
    this.radio('VOCÊ', o ? o.label : opt, 'info');
    this.applyRequest(req, opt);
    if (o?.cost) this.advance(o.cost);
  }""","""    const o = req.options.find((x) => x.id === opt);
    this.radio('VOCÊ', o ? o.label : opt, 'info');
    // 1.1: "negociar" com o Regional abre a tela da vaga zero (o efeito da opção só vale com acordo)
    if (vzInterceptRequest(this, req, opt)) return;
    this.applyRequest(req, opt);
    if (o?.cost) this.advance(o.cost);
  }

  /** aplica a opção de um pedido já retirado da bandeja (a vaga zero aplica o pedido do roteiro só com acordo) */
  applyRequestNow(req: PendingRequest, opt: string) {
    this.applyRequest(req, opt);
  }

  /** esquece as opções de um pedido de roteiro que não vai mais ser aplicado */
  dropInlineRequest(id: string) {
    this.inlineReqs.delete(id);
  }

  /** destino padrão da ligação (verdade; vermelho → Regional) */
  defaultDestOf(call: CallRT): Dest {
    return this.defaultDest(call);
  }

  /** desvia para a UPA Norte as viaturas desta ligação que iam (ou estão presas) no Regional */
  divertToUPA(call: CallRT) {
    for (const uid of call.units) {
      const u = this.sh.units[uid];
      if (!u || u.callId !== call.id) continue;
      if ((u.status === 'TRANSP' && u.dest !== 'UPA') || u.status === 'RETIDO') {
        u.dest = 'UPA';
        u.note = undefined;
        this.moveUnit(u, landmarkPos('upa'), 'TRANSP', 'hospital', call.id);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 1.1: vaga zero negociada (lógica em vagazero.ts) — a tela chama estes
  // ---------------------------------------------------------------------------
  vzScreen(): VzScreen | undefined {
    return vzScreen(this);
  }
  vzChoose(cardId: string): boolean {
    return vzChoose(this, cardId);
  }
  vzTimeout(): boolean {
    return vzTimeout(this);
  }
  vzPeixoto(): boolean {
    return vzPeixoto(this);
  }
  vzDesviar(): boolean {
    return vzDesviar(this);
  }
  vzDesistir(): boolean {
    return vzDesistir(this);
  }
  vzClose(): boolean {
    return vzClose(this);
  }""")

rep("""      case 'timeline': {
        if (req.data?.inline) {""","""      case 'promessa':
        vzPromiseAnswer(this, call, opt);
        return;
      case 'timeline': {
        if (req.data?.inline) {""")

rep("""  startGuide(call: CallRT, guideId: string, etaMin: number) {
    const script = this.c.guides[guideId];""","""  startGuide(call: CallRT, guideId: string, etaMin: number) {
    // 1.1: o roteiro fixo "vagazero" virou a negociação com o Saulo (tela do tempo parando)
    if (guideId === 'vagazero' && vzEnabled(this)) {
      if (!call.vz) {
        call.vz = { key: 'generico', tries: 0 };
        vzEnqueue(this, { key: 'generico', callId: call.id, unit: call.decision?.unit, origin: 'carimbo' });
      }
      this.closeCall(call);
      return;
    }
    const script = this.c.guides[guideId];""")

rep("""    if (dc) {
      delete (call as CallRT & { deferCare?: unknown }).deferCare;
      this.evaluateCare(call, dc.at, dc.level, dc.unit ? sh.units[dc.unit] : undefined);
    }
    this.emit({ type: 'guide', callId: id, start: false });
    void def;
  }""","""    if (dc) {
      delete (call as CallRT & { deferCare?: unknown }).deferCare;
      this.evaluateCare(call, dc.at, dc.level, dc.unit ? sh.units[dc.unit] : undefined);
    }
    this.emit({ type: 'guide', callId: id, start: false });
    // negociação de vaga zero que esperava a orientação acabar
    vzTryOpen(this);
    void def;
  }""")

rep("""      if (w.resetRisk) {
        call.riskFrom = this.sh.time;
        call.talk = 0;
      }""","""      if (w.resetRisk) {
        call.riskFrom = this.sh.time;
        call.talk = 0;
        call.waste = 0;
      }""")

rep("""    const dur = (sh.noites ?? 1) >= 3 ? 60 : (sh.noites ?? 1) === 2 ? 90 : 120;
    sh.coffeeUntil = Math.max(sh.time, sh.coffeeUntil) + dur;
    this.toast(`Café: perguntas mais rápidas por ${dur === 120 ? '2 h' : dur === 90 ? '1 h 30' : '1 h'}${sh.semSono ? ' e sem cochilar' : ''}. Em casa você vai chegar irritad${this.st.gender === 'M' ? 'o' : 'a'}.`, 'info');
    return true;""","""    const dur = (sh.noites ?? 1) >= 3 ? 60 : (sh.noites ?? 1) === 2 ? 90 : 120;
    sh.coffeeUntil = Math.max(sh.time, sh.coffeeUntil) + dur;
    this.toast(
      `Café: foco por ${dur === 120 ? '2 h' : dur === 90 ? '1 h 30' : '1 h'}. Perguntas 40% mais rápidas e, na linha, o relógio anda mais devagar${sh.semSono ? '; sem cochilar' : ''}. Em casa: Desgaste +${COFFEE_HOME_COST} e irritad${this.st.gender === 'M' ? 'o' : 'a'}.`,
      'info',
    );
    return true;""")

rep("""/** 1.1 — caso grave decidido sem nenhuma pergunta à toa (e com as obrigatórias feitas): bônus */
export const OBJECTIVE_BONUS = 10;""","""/** 1.1 — caso grave decidido sem nenhuma pergunta à toa (e com as obrigatórias feitas): bônus */
export const OBJECTIVE_BONUS = 10;
/** 1.1 — cada café vira este Desgaste em casa (antes: 8), além de chegar irritado (home.ts) */
export const COFFEE_HOME_COST = 3;""")
open(p,'w').write(s)
print("ok")
