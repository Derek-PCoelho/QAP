// Roteiro 1.1, dias 1–10: consequências que o jogador vê (dinheiro por faixa e origem, envelope, aliança,
// a queda interativa da Dona Zélia no dia 10, ida/almoço/volta de todos os dias).
import { describe, it, expect } from 'vitest';
import { CONTENT } from '../src/content/index';
import { Game } from '../src/engine/game';
import { newGameState, makeCtx, makeEffCtx } from '../src/engine/state';
import { jantarAbre, falaContas, falaRemedio, baseBills, SHOP } from '../src/content/home-base';
import type { Ctx, GameState, SceneDef, SceneNode } from '../src/engine/types';

function st(day: number, money: number, flags: Record<string, boolean | number | string> = {}, g: 'M' | 'F' = 'M'): GameState {
  const s = newGameState({ gender: g, difficulty: 'padrao', seed: 5 });
  s.day = day;
  s.money = money;
  s.flags = { ...flags };
  return s;
}
const txt = (c: Ctx, lines: { t: unknown; when?: (c: Ctx) => boolean }[]) =>
  lines
    .filter((l) => !l.when || l.when(c))
    .map((l) => (typeof l.t === 'function' ? (l.t as (c: Ctx) => string)(c) : String(l.t)))
    .join(' | ');
const sceneOf = (x: SceneDef | ((c: Ctx) => SceneDef) | undefined, c: Ctx) => (typeof x === 'function' ? x(c) : x)!;
const visibleChoices = (n: SceneNode, c: Ctx) => (n.choices ?? []).filter((ch) => !ch.when || ch.when(c)).map((ch) => (typeof ch.label === 'function' ? ch.label(c) : ch.label));

describe('a família fala do dinheiro que existe (ROTEIRO 3.1)', () => {
  it('jantar: aperto conta os presentes; folga e sobra não falam de aperto', () => {
    const a = makeCtx(st(11, 80));
    expect(txt(a, jantarAbre(a))).toMatch(/dividido em quatro/);
    const semZelia = st(11, 80);
    semZelia.family.zelia.status = 'morto';
    expect(txt(makeCtx(semZelia), jantarAbre(makeCtx(semZelia)))).toMatch(/dividido em três/);
    for (const m of [700, 1500]) {
      const c = makeCtx(st(11, m));
      expect(txt(c, jantarAbre(c))).not.toMatch(/ovo dividido|Ninguém reclama/);
    }
  });

  it('a origem muda a fala: vereador, bico e ateliê', () => {
    const ver = makeCtx(st(11, 1500, { envelope_aceito: true }));
    expect(txt(ver, jantarAbre(ver))).toMatch(/Pizza grande/);
    expect(txt(ver, jantarAbre(ver))).toMatch(/sem fome/);
    const bico = makeCtx(st(11, 700, { bico_d10: true, bico_d11: true }));
    expect(txt(bico, jantarAbre(bico))).toMatch(/Frango assado/);
    const atl = makeCtx(st(11, 700, { maquina: true, renda_atelie_d11: 40 }));
    expect(txt(atl, jantarAbre(atl))).toMatch(/Lasanha/);
    // envelope entregue à polícia: o dinheiro deixa de ser "do vereador"
    const entregue = makeCtx(st(11, 1500, { envelope_aceito: true, envelope_entregue: true, envelope_entregue_policia: true }));
    expect(txt(entregue, jantarAbre(entregue))).not.toMatch(/sem fome/);
  });

  it('contas: fala do cônjuge por faixa e origem; luz paga pelo ateliê; Zélia e a fita', () => {
    expect(falaContas(makeCtx(st(5, 100)))).toMatch(/aluguel|gás/);
    expect(falaContas(makeCtx(st(8, 1300, { envelope_aceito: true })))).toMatch(/Eu não vou tocar/);
    expect(falaContas(makeCtx(st(9, 1300, { envelope_aceito: true })))).toMatch(/sabendo de quem era/);
    expect(falaContas(makeCtx(st(11, 800)))).toMatch(/Primeiro mês que sobra/);
    const atl = makeCtx(st(11, 800, { maquina: true, juliana_cliente: true }));
    const luz = baseBills(atl).find((b) => b.id === 'energia')!;
    expect(typeof luz.amount === 'function' ? luz.amount(atl) : luz.amount).toBe(0);
    expect(falaRemedio(makeCtx(st(11, 100)))).toMatch(/amostras/);
    expect(falaRemedio(makeCtx(st(11, 800)))).toMatch(/fita/);
    const fita = SHOP.find((i) => i.id === 'fita_glicemia')!;
    expect(fita.when!(makeCtx(st(11, 800)))).toBe(true);
    expect(fita.when!(makeCtx(st(11, 100)))).toBe(false);
  });

  it('dia 9: "nem que eu venda" só com o saldo apertado', () => {
    const d9 = CONTENT.days[9];
    for (const [money, venda] of [
      [100, true],
      [900, false],
    ] as const) {
      const c = makeCtx(st(9, money));
      const sc = sceneOf(d9.interlude!.scene, c);
      const fim = txt(c, sc.nodes.fim.lines);
      expect(/Nem que eu venda/.test(fim), `saldo ${money}`).toBe(venda);
      expect(/O que faltou foi alguém em casa/.test(fim), `saldo ${money}`).toBe(!venda);
    }
  });
});

describe('dia 9: a Gazeta e o envelope (R1)', () => {
  it('o cônjuge reage ao envelope e oferece delegacia / guardar / queimar', () => {
    const d9 = CONTENT.days[9];
    const lu = makeCtx(st(9, 300, { envelope_lucia: true }));
    const pre = sceneOf(d9.interlude!.pre, lu);
    expect(txt(lu, pre.nodes.start.lines)).toMatch(/caixa de costura/);
    expect(visibleChoices(pre.nodes.start, lu)).toHaveLength(3);
    // entregar à polícia: Integridade +2 e o dinheiro deixa de ser "do vereador"
    const s = st(9, 1400, { envelope_aceito: true });
    const c = makeCtx(s);
    const p2 = sceneOf(d9.interlude!.pre, c);
    expect(txt(c, p2.nodes.start.lines)).toMatch(/Esse homem esteve na nossa porta/);
    const deleg = p2.nodes.start.choices!.find((ch) => /delegacia/.test(String(ch.label)) && (!ch.when || ch.when(c)))!;
    const integ = s.vars.integridade;
    deleg.effect!(makeEffCtx(s));
    expect(s.money).toBe(400);
    expect(s.vars.integridade).toBe(integ + 2);
    expect(s.flags['envelope_entregue_policia']).toBe(true);
  });

  it('o jornal de quinta traz o W.T. (preso ou foragido)', () => {
    const d9 = CONTENT.days[9];
    const vivo = makeCtx(st(9, 300));
    vivo.s.keys = { rosangela: 'salvo' };
    expect(d9.newspaper(vivo).sub).toMatch(/W\.T\., 41/);
    const morto = makeCtx(st(9, 300));
    morto.s.keys = { rosangela: 'perdido' };
    expect(d9.newspaper(morto).headline).toMatch(/procura o marido/);
  });
});

describe('dia 10: a aliança por faixa e origem', () => {
  const dinheiro = (money: number, flags: Record<string, boolean | number | string>) => {
    const c = makeCtx(st(10, money, flags));
    return { c, n: sceneOf(CONTENT.days[10].interlude!.scene, c).nodes.dinheiro };
  };
  it('aperto/justo: oferece a aliança (vender ou guardar)', () => {
    const { c, n } = dinheiro(200, {});
    expect(visibleChoices(n, c).join(' ')).toMatch(/Aceitar a aliança/);
  });
  it('folga sem vereador: guarda mais um mês e conta o ônibus doze', () => {
    const { c, n } = dinheiro(800, {});
    expect(visibleChoices(n, c)).toHaveLength(0);
    expect(txt(c, n.lines)).toMatch(/guardo mais um mês/);
    const s = c.s;
    n.onEnter!(makeEffCtx(s));
    expect(s.flags['zelia_contou_alianca']).toBe(true);
  });
  it('sobra com o envelope: a cinta do gabinete 7 na mesa e três respostas', () => {
    const { c, n } = dinheiro(1400, { envelope_aceito: true });
    expect(txt(c, n.lines)).toMatch(/Gab\. 7/);
    expect(visibleChoices(n, c).join(' ')).toMatch(/Vou devolver/);
  });
});

describe('dia 10: a queda interativa (ROTEIRO 3.2)', () => {
  /** leva o jogo até a cena da Zélia, ignorando a hipoglicemia (a queda acontece) */
  function ateAQueda(flags: Record<string, boolean | number | string>) {
    const g = Game.create(CONTENT, { gender: 'M', difficulty: 'padrao', seed: 3, startDay: 10 });
    Object.assign(g.st.flags, flags);
    g.st.money = 200;
    g.st.phase = 'relatorio';
    g.toHome();
    const h = g.home!;
    let guard = 0;
    while (g.st.home!.step !== 'cena' && guard++ < 20) {
      if (g.st.home!.step === 'pre') h.continueScene();
      if (g.st.home!.step === 'escolha') h.chooseTimeOff('familia');
    }
    // "Que bom, mãe" (ignora) → ... → noite
    const pick = (re: RegExp) => {
      const ch = h.choices().find((x) => re.test(x.label));
      expect(ch, String(re)).toBeTruthy();
      h.choose(ch!.idx);
    };
    pick(/Que bom, mãe/);
    h.continueScene(); // ignora → dinheiro
    pick(/Guarda, mãe/);
    h.continueScene(); // guarda → noite
    expect(g.st.home!.node).toBe('noite');
    expect(g.st.flags['zelia_caiu_d10']).toBe(true);
    return { g, h, pick };
  }

  it('sem o telefone do Bené nem do Zé Carlos: três caminhos; não insistir = 40 min, risco +3, conta R$ 30', () => {
    const { g, h, pick } = ateAQueda({});
    const labels = h.choices().map((x) => x.label).join(' | ');
    expect(labels).toMatch(/A-cá-cias/);
    expect(labels).toMatch(/TARM/);
    expect(labels).not.toMatch(/Bené|Zé Carlos/);
    const r0 = g.st.family.zelia.risk;
    pick(/Não insistir/);
    expect(g.st.flags['zelia_espera']).toBe(40);
    expect(g.st.family.zelia.risk).toBe(r0 + 3);
    h.continueScene(); // q_espera → bilhete
    pick(/Anotar/);
    expect(g.st.flags['anotou_henrique_d10']).toBe(true);
    const conta = h.bills().find((b) => b.id === 'd10_queda');
    expect(conta?.amount ?? 30).toBe(30);
  });

  it('com o telefone do Bené: ele corrige pelo rádio (15 min, risco +1, conta R$ 10)', () => {
    const { g, h, pick } = ateAQueda({ promessa_bene: true, tel_bene: true });
    const r0 = g.st.family.zelia.risk;
    const ib = g.st.vars.intimBene;
    pick(/Bené/);
    expect(g.st.flags['zelia_bene_corrigiu']).toBe(true);
    expect(g.st.flags['zelia_espera']).toBe(15);
    expect(g.st.family.zelia.risk).toBe(r0 + 1);
    expect(g.st.vars.intimBene).toBe(ib + 1);
    h.continueScene();
    pick(/Não pensar/);
    h.continueScene();
    expect(g.st.home!.step).toBe('contas');
    expect(h.bills().find((b) => b.id === 'd10_queda')!.amount).toBe(10);
  });

  it('com o telefone do Zé Carlos: ele vem a pé (risco +1)', () => {
    const { g, pick } = ateAQueda({ tel_ze_carlos: true });
    const r0 = g.st.family.zelia.risk;
    pick(/Zé Carlos/);
    expect(g.st.flags['zelia_ze_carlos']).toBe(true);
    expect(g.st.family.zelia.risk).toBe(r0 + 1);
  });

  it('o bilhete das 22:07 vira documento para o dia 12', () => {
    const doc = CONTENT.docs['bilhete_henrique'];
    expect(doc).toBeTruthy();
    const c = makeCtx(st(12, 100, { anotou_henrique_d10: true, zelia_espera: 15, zelia_bene_corrigiu: true }));
    const t = typeof doc.text === 'function' ? doc.text(c) : doc.text;
    expect(t).toMatch(/Palmeiras em vez de Acácias/);
    expect(t).toMatch(/Bené/);
  });
});

describe('ida, almoço e volta dos dias 1 a 10', () => {
  it('todos os dias têm as três cenas', () => {
    for (let d = 1; d <= 10; d++) {
      const day = CONTENT.days[d];
      const c = makeCtx(st(d, 300));
      expect(day.ida?.(c), `ida D${d}`).toBeTruthy();
      expect(day.almoco?.(c), `almoço D${d}`).toBeTruthy();
      expect(day.volta?.(c), `volta D${d}`).toBeTruthy();
    }
  });

  it('dia 3: a volta compra a bombinha (R$ 80) e a cena da tosse muda', () => {
    const s = st(3, 300);
    const c = makeCtx(s);
    const v = CONTENT.days[3].volta!(c)!;
    const ch = v.nodes.start.choices!.find((x) => /farmácia 24 horas/.test(String(x.label)))!;
    ch.effect!(makeEffCtx(s));
    expect(s.money).toBe(220);
    expect(s.flags['bombinha_volta']).toBe(true);
    const sc = sceneOf(CONTENT.days[3].interlude!.scene, makeCtx(s));
    expect(txt(makeCtx(s), sc.nodes.start.lines)).toMatch(/sacolinha da farmácia/);
  });
});
