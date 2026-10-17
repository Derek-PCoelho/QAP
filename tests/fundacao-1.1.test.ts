// Fundação da 1.1: perguntas fixas + caixas, frases de "Outros", gatilhos que substituem o Modo
// Inconsistência, endereço conferido pela Simone, "reparar" da casa, almoço/ida/volta, QRR,
// documentos lidos e origem do dinheiro.
import { describe, it, expect } from 'vitest';
import { CONTENT } from '../src/content/index';
import { Game } from '../src/engine/game';
import { moneyOrigin, moneyBand, bicosRecent, incomeRecent } from '../src/engine/state';
import type { CallRT } from '../src/engine/types';

function skipScenes(g: Game) {
  let n = 0;
  while (g.scene && n++ < 100) {
    const ch = g.scene.choices().filter((x) => !x.disabled);
    if (ch.length) g.sceneChoose(ch[0].idx);
    else g.sceneContinue();
  }
}

function shiftOn(day: number, gender: 'M' | 'F' = 'F') {
  const g = Game.create(CONTENT, { gender, difficulty: 'padrao', seed: 7, startDay: day });
  g.newspaper();
  g.beginShift();
  skipScenes(g);
  return g;
}

/** carimba a decisão certa (pela verdade) */
function stampRight(g: Game, a: CallRT) {
  const sh = g.shift!;
  const t = sh.truthOf(a);
  let res = t.best ?? t.ok[0];
  const units = res === 'USA' || res === 'USB' ? sh.availableUnits(res) : [];
  if ((res === 'USA' || res === 'USB') && !units.length) res = 'ORI';
  sh.stamp({ color: t.sev === 'trote' ? 'azul' : t.sev, resource: res, unit: units[0]?.id, support: t.sup ?? [], dest: t.dest?.[0] ?? 'REG', referral: t.ref?.[0] ?? 'UBS' });
}

/** espera a ligação de conteúdo `defId` chegar na fila e atende */
function answerDef(g: Game, defId: string): CallRT {
  const sh = g.shift!;
  const call = Object.values(sh.sh.calls).find((c) => c.def === defId)!;
  expect(call, defId).toBeTruthy();
  let guard = 0;
  while ((call.status !== 'fila' || (call as CallRT & { pendingArrival?: boolean }).pendingArrival) && guard++ < 2000) {
    for (const m of [...sh.sh.modals]) sh.ackModal(m.id, m.options?.[0]?.id);
    for (const r of [...sh.sh.requests]) sh.answerRequest(r.id, r.options[0].id);
    skipScenes(g);
    sh.processUntil(sh.sh.time + 1);
  }
  if (sh.active() && sh.active()!.id !== call.id) sh.hold();
  sh.answer(call.id);
  expect(sh.active()?.id).toBe(call.id);
  return call;
}

describe('perguntas da 1.1', () => {
  it('cinco fixas, quatro caixas e ferramentas; perguntar abre a caixa', () => {
    const g = shiftOn(1);
    const call = answerDef(g, 'd01_lurdes');
    const sh = g.shift!;
    const qs = sh.questions(call);
    expect(qs.filter((q) => q.fixed).map((q) => q.id)).toEqual(['pulso', 'respira', 'pele', 'consciencia', 'oque']);
    expect(qs.some((q) => q.id === 'referencia' || q.id === 'idade')).toBe(false);
    for (const b of ['clinico', 'go', 'trauma', 'outros'] as const) expect(qs.some((q) => q.box?.includes(b)), b).toBe(true);
    expect(qs.filter((q) => q.group === 'ferramenta').map((q) => q.id)).toContain('paciente');
    expect(call.boxes ?? []).toEqual([]);
    sh.toggleBox('go');
    expect(call.boxes).toEqual(['go']);
    sh.toggleBox('go');
    expect(call.boxes).toEqual([]);
    // perguntar algo de caixa fechada (atalho/bot) abre a caixa do chamado
    expect(sh.ask('historico')).toBe(true);
    expect(call.boxes).toContain('trauma'); // queda com fratura de fêmur → Trauma
    expect(sh.callCat(call)).toBe('trauma');
    // pulso e pele têm resposta (padrão derivado da verdade)
    const n = call.lines.length;
    sh.ask('pulso');
    sh.ask('pele');
    expect(call.lines.length).toBeGreaterThan(n + 2);
  });

  it('Outros: "meios próprios" conta como orientação e "encerro" fecha a ligação como ORI', () => {
    const g = shiftOn(1);
    const call = answerDef(g, 'd01_cida');
    const sh = g.shift!;
    sh.ask('meios_proprios');
    expect(call.unlocked).toContain('meios');
    sh.ask('encerrar');
    expect(call.decision?.resource).toBe('ORI');
    expect(call.decision?.referral).not.toBe('CASA');
    expect(sh.active()).toBeUndefined();
  });
});

describe('gatilhos sem o Modo Inconsistência', () => {
  it('d02: "A escola está fechada" aparece depois de "O que aconteceu?"', () => {
    const g = shiftOn(2);
    const call = answerDef(g, 'd02_biel');
    const sh = g.shift!;
    expect(sh.questions(call).some((q) => q.id === 'fechada')).toBe(false);
    sh.ask('oque');
    expect(sh.questions(call).some((q) => q.id === 'fechada')).toBe(true);
  });

  it('d08: "Você está em perigo?" abre com "Aqui é a Regulação" e destrava as perguntas de sim/não', () => {
    const g = shiftOn(8);
    const call = answerDef(g, 'd08_pizza');
    const sh = g.shift!;
    expect(sh.ask('perigo')).toBe(false);
    sh.ask('engano');
    expect(sh.ask('perigo')).toBe(true);
    for (const id of ['agressor', 'machucada', 'arma', 'linha']) expect(sh.questions(call).some((q) => q.id === id), id).toBe(true);
  });

  it('a Simone confere o endereço: trote do dia 1 vem com "endereço não confere"', () => {
    const g = shiftOn(1);
    const call = answerDef(g, 'd01_et');
    expect(call.addrNote).toBe('nao_confere');
    expect(call.noteAddr).toMatch(/não confere/);
  });

  it('"Esse número já passou trote aqui" aparece quando o número está no quadro', () => {
    const g = shiftOn(3);
    const call = answerDef(g, 'd03_biel');
    const sh = g.shift!;
    expect(sh.onBoard(call)).toBe(true); // a Simone anota no começo do dia 3
    expect(sh.questions(call).some((q) => q.id === 'confronto_quadro')).toBe(true);
    expect(sh.ask('confronto_quadro')).toBe(true);
  });

  it('d12: ler a ficha da sindicância (no quadro) grava viu_ficha_sindicancia', () => {
    const g = shiftOn(12);
    const sh = g.shift!;
    g.st.docs.push('ficha_sindicancia');
    expect(sh.readDoc('ficha_sindicancia')).toBe(true);
    expect(g.st.flags['viu_ficha_sindicancia']).toBe(true);
    expect(sh.readDoc('ficha_sindicancia')).toBe(false);
  });
});

describe('reparar em casa', () => {
  it('d10: reparar no prato seco libera "o prato tá seco"', () => {
    const g = Game.create(CONTENT, { gender: 'M', difficulty: 'padrao', seed: 3, startDay: 10 });
    g.st.phase = 'relatorio';
    g.toHome();
    const h = g.home!;
    let guard = 0;
    while (g.st.home!.step !== 'cena' && guard++ < 20) {
      if (g.st.home!.step === 'pre') h.continueScene();
      if (g.st.home!.step === 'escolha') h.chooseTimeOff('familia');
    }
    const marks = h.noticeables();
    expect(marks.map((m) => m.id)).toContain('prato_seco');
    const before = h.choices().length;
    const r = h.notice('prato_seco')!;
    expect(r.desc.length).toBeGreaterThan(5);
    expect(r.unlocked).toContain('prato');
    expect(h.noticeables().find((m) => m.id === 'prato_seco')!.noticed).toBe(true);
    // a escolha só aparece no nó que a tem; aqui só conferimos que nada custou Laços
    expect(g.st.vars.lacos).toBeGreaterThanOrEqual(0);
    void before;
  });
});

describe('ganchos de cena: ida, almoço, volta', () => {
  it('dia 1: a ida abre antes da passagem; o almoço às 13:00 para o relógio; a volta abre a noite', () => {
    const g = Game.create(CONTENT, { gender: 'F', difficulty: 'padrao', seed: 11 });
    g.newspaper();
    g.beginShift();
    expect(g.scene?.sc.id).toBe('d01_ida');
    g.sceneContinue();
    expect(g.scene?.sc.id).toBe('d01_passagem');
    skipScenes(g);
    const sh = g.shift!;
    let guard = 0;
    while (!g.scene && sh.sh.time < 14 * 60 && guard++ < 20000) {
      for (const m of [...sh.sh.modals]) sh.ackModal(m.id, m.options?.[0]?.id);
      for (const r of [...sh.sh.requests]) sh.answerRequest(r.id, r.options[0].id);
      const a = sh.active();
      if (a && !a.decision) stampRight(g, a);
      if (!sh.active() && sh.queue().length) sh.answer(sh.queue()[0].id);
      if (sh.sh.guideCallId) sh.finishGuide(0.9, true);
      g.tick(250);
    }
    expect(g.st.phase).toBe('plantao');
    expect(g.scene?.sc.id).toBe('d01_almoco');
    const t = sh.sh.time;
    expect(t).toBeGreaterThanOrEqual(13 * 60);
    g.tick(250);
    g.tick(250);
    expect(sh.sh.time).toBe(t); // relógio parado
    skipScenes(g);
    expect(g.st.flags['almoco_d1_dividiu']).toBe(true);
    // fim do dia → casa: a volta abre a noite
    g.st.phase = 'relatorio';
    g.toHome();
    expect(g.st.home!.sceneId).toBe('d01_volta');
    g.home!.continueScene();
    expect(g.st.home!.volta).toBe(false);
  });
});

describe('rádio e consertos', () => {
  it('USA despacha com QRR 3', () => {
    const g = shiftOn(1);
    const call = answerDef(g, 'd01_parada');
    const sh = g.shift!;
    const usa = sh.availableUnits('USA')[0];
    sh.stamp({ color: 'vermelho', resource: 'USA', unit: usa.id, support: [] });
    const msg = sh.sh.radio.filter((r) => r.callId === call.id).map((r) => r.text).join(' ');
    expect(msg).toMatch(/QRR 3/);
  });
});

describe('origem do dinheiro', () => {
  it('soma por origem e decide a dominante', () => {
    const g = Game.create(CONTENT, { gender: 'M', difficulty: 'padrao', seed: 1, startDay: 8 });
    const e = g.eff();
    e.pay(1000, 'envelope do vereador');
    expect(g.st.flags['renda_vereador']).toBe(1000);
    g.st.flags['envelope_aceito'] = true;
    expect(moneyOrigin(g.st)).toBe('vereador');
    delete g.st.flags['envelope_aceito'];
    g.st.flags['bico_d8'] = true;
    g.st.flags['bico_d7'] = true;
    expect(bicosRecent(g.st, 4)).toBe(2);
    expect(moneyOrigin(g.st)).toBe('bico');
    e.pay(40, 'Ateliê da Lúcia');
    expect(incomeRecent(g.st, 'atelie', 3)).toBe(40);
    expect(moneyBand(100)).toBe('aperto');
    expect(moneyBand(1300)).toBe('sobra');
  });
});
