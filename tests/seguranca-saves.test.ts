// Segurança dos saves e da lógica do jogo (docs/SEGURANCA.md; checklist, seções 4 e 14).
//
// O save é JSON puro e é conferido antes de carregar (src/engine/save-check.ts). Estes testes:
//  • ida e volta: saves reais (campanha, os dois gêneros, todas as fases da noite; Simone) carregam;
//  • recusas esperadas: JSON cortado, Infinity, chave __proto__, aninhamento e listas gigantes;
//  • fuzzing: centenas de mutações aleatórias em saves reais nunca derrubam o jogo — ou o save é
//    recusado na hora de carregar, ou o bot continua jogando sem exceção;
//  • lógica: ações repetidas (clique duplo, tecla presa) não cobram nem dão nada duas vezes.
import { describe, it, expect } from 'vitest';
import { CONTENT } from '../src/content/index';
import { Game } from '../src/engine/game';
import { playBot, PROFILES } from '../src/engine/bot';
import { SaveError, SAVE_MAX_CHARS } from '../src/engine/save-check';

// ------------------------------------------------------------------ saves reais
function campaignSaves(gender: 'M' | 'F', seed: number, days: number[]): { tag: string; json: string }[] {
  const out: { tag: string; json: string }[] = [];
  const seen = new Set<string>();
  const g = Game.create(CONTENT, { gender, difficulty: 'padrao', seed });
  const r = playBot(CONTENT, PROFILES.medio, seed, {
    game: g,
    maxDays: Math.max(...days),
    stopWhen: (gg) => {
      const tag = `${gender}|d${gg.st.day}|${gg.st.phase}|${gg.st.home?.step ?? ''}`;
      if (days.includes(gg.st.day) && !seen.has(tag)) {
        seen.add(tag);
        out.push({ tag, json: gg.serialize() });
      }
      return false;
    },
  });
  expect(r.errors).toEqual([]);
  return out;
}

function simoneSaves(seed: number, maxDay: number): string[] {
  const g = Game.createSimone(CONTENT, { gender: 'F', difficulty: 'padrao', seed });
  const out: string[] = [];
  let last = '';
  let guard = 0;
  while (guard++ < 200000 && g.st.day <= maxDay) {
    const st = g.st;
    const tag = `${st.day}|${st.phase}`;
    if (tag !== last) {
      last = tag;
      out.push(g.serialize());
    }
    if (st.phase === 'final' || st.phase === 'gameover') break;
    if (st.phase === 'jornal') {
      g.newspaper();
      g.beginShift();
      continue;
    }
    if (g.scene) {
      const ch = g.scene.choices().filter((c) => !c.disabled);
      if (ch.length) g.sceneChoose(ch[0].idx);
      else g.sceneContinue();
      continue;
    }
    if (st.phase === 'relatorio') {
      if (st.gameOver) break;
      g.toHome();
      continue;
    }
    if (st.phase === 'casa') {
      g.finishNight(g.nightBills().map((b) => b.id));
      continue;
    }
    const sh = g.shift!;
    const act = sh.active();
    if (!act) {
      const q = sh.queue();
      if (q.length) sh.answer(q[0].id);
      else g.tick(1000);
      continue;
    }
    if (act.status !== 'ativa') {
      g.tick(500);
      continue;
    }
    g.tick(1000);
    sh.tarmPass('verde', false, 'moura');
  }
  return out;
}

const BASES = [...campaignSaves('M', 3, [1, 4, 9]), ...campaignSaves('F', 4, [2, 6, 12])];

describe('saves: ida e volta', () => {
  it('todo save real da campanha carrega e o jogo segue', () => {
    expect(BASES.length).toBeGreaterThan(20);
    const phases = new Set(BASES.map((b) => b.tag.split('|').slice(2).join('|')));
    for (const p of ['jornal|', 'relatorio|', 'casa|escolha', 'casa|contas', 'casa|loja']) expect(phases).toContain(p);
    for (const b of BASES) {
      const g = Game.load(CONTENT, b.json);
      const r = playBot(CONTENT, PROFILES.medio, 1, { game: g, maxDays: Math.min(20, g.st.day + 1) });
      expect(r.errors, b.tag).toEqual([]);
    }
  });

  it('saves da campanha da Simone (com o mundo-sombra) carregam', () => {
    const saves = simoneSaves(21, 4);
    expect(saves.length).toBeGreaterThan(5);
    for (const s of saves) expect(() => Game.load(CONTENT, s)).not.toThrow();
  });
});

describe('saves: recusas', () => {
  const base = BASES.find((b) => b.tag.includes('casa|contas'))!.json;
  const reject = (text: string) => {
    let err: unknown;
    try {
      Game.load(CONTENT, text);
    } catch (e) {
      err = e;
    }
    expect(err, 'devia recusar').toBeInstanceOf(SaveError);
    return err as SaveError;
  };

  it('JSON cortado no meio', () => {
    expect(reject(base.slice(0, Math.floor(base.length / 2))).detail).toMatch(/JSON/);
  });
  it('números infinitos (1e999)', () => {
    reject(base.replace(/"money":-?\d+(\.\d+)?/, '"money":1e999'));
  });
  it('chave __proto__ (e nada vaza para o Object.prototype)', () => {
    const t = base.replace('"flags":{', '"flags":{"__proto__":{"poluido":"sim"},');
    expect(reject(t).detail).toMatch(/__proto__/);
    expect(({} as Record<string, unknown>).poluido).toBeUndefined();
  });
  // um campo a mais no começo do objeto (o JSON continua válido; quem recusa é a conferência)
  const extra = (v: string) => base.replace(/^\{/, `{"extra":${v},`);
  it('aninhamento gigante não estoura a pilha', () => {
    const deep = '['.repeat(20000) + '1' + ']'.repeat(20000);
    expect(reject(extra(deep)).detail).toMatch(/aninhamento/);
  });
  it('lista e texto gigantes', () => {
    expect(reject(extra(`[${Array(30000).fill('"x"').join(',')}]`)).detail).toMatch(/lista grande demais/);
    expect(reject(extra(`"${'A'.repeat(60000)}"`)).detail).toMatch(/texto grande demais/);
  });
  it('arquivo grande demais', () => {
    expect(reject(' '.repeat(SAVE_MAX_CHARS + 1) + base).detail).toMatch(/grande demais/);
  });
  it('tipos trocados nos campos principais', () => {
    const o = JSON.parse(base);
    for (const [k, v] of [['day', '3'], ['phase', 'xyz'], ['family', true], ['flags', 3], ['history', {}], ['totals', 0], ['vars', null], ['bills', []]] as const) {
      reject(JSON.stringify({ ...o, [k]: v }));
    }
  });
  it('versão desconhecida (anterior à 3 ou futura) continua com a mensagem de incompatível', () => {
    expect(() => Game.load(CONTENT, base.replace(/"v":\d+/, '"v":2'))).toThrow(/incompatível/);
    expect(() => Game.load(CONTENT, base.replace(/"v":\d+/, '"v":99'))).toThrow(/incompatível/);
  });
});

// ------------------------------------------------------------------ fuzzing
describe('saves: fuzzing', () => {
  it('600 mutações aleatórias: ou o save é recusado, ou o jogo segue sem exceção', () => {
    let seed = 20261016;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0), seed / 2 ** 32);
    const pick = <T,>(a: readonly T[]) => a[Math.floor(rnd() * a.length)];
    type J = any; // eslint-disable-line @typescript-eslint/no-explicit-any
    const paths = (v: J, p: (string | number)[] = [], out: (string | number)[][] = [], d = 0) => {
      if (d < 6 && v && typeof v === 'object') for (const k of Array.isArray(v) ? v.map((_: J, i: number) => i) : Object.keys(v)) (out.push([...p, k]), paths(v[k], [...p, k], out, d + 1));
      return out;
    };
    const get = (o: J, p: (string | number)[]) => p.reduce((a: J, k) => (a == null ? a : a[k]), o);
    const WEIRD: J[] = [null, true, 0, -1, 1.5, 1e300, '', 'x', [], {}, 'A'.repeat(70000)];
    let rejected = 0;
    let played = 0;
    const crashes: string[] = [];
    for (let i = 0; i < 600; i++) {
      const b = pick(BASES);
      const o = JSON.parse(b.json);
      const ps = paths(o);
      const p = pick(ps);
      const parent = get(o, p.slice(0, -1));
      const kind = pick(['apaga', 'troca', 'infinito', 'proto', 'trunca', 'texto'] as const);
      let text: string;
      if (kind === 'apaga') {
        if (Array.isArray(parent)) parent.splice(Number(p[p.length - 1]), 1);
        else delete parent[p[p.length - 1]];
        text = JSON.stringify(o);
      } else if (kind === 'troca') {
        parent[p[p.length - 1]] = pick(WEIRD);
        text = JSON.stringify(o);
      } else if (kind === 'infinito') {
        parent[p[p.length - 1]] = '__INF__';
        text = JSON.stringify(o).replace('"__INF__"', '-1e999');
      } else if (kind === 'proto') {
        const tgt = parent && typeof parent === 'object' && !Array.isArray(parent) ? parent : o;
        tgt['__P__'] = { poluido: 1 };
        text = JSON.stringify(o).replace('"__P__"', '"__proto__"');
      } else if (kind === 'trunca') {
        text = b.json.slice(0, Math.floor(rnd() * b.json.length));
      } else {
        const v = get(o, p);
        parent[p[p.length - 1]] = typeof v === 'number' ? String(v) : v;
        text = JSON.stringify(o);
      }
      let g: Game | undefined;
      try {
        g = Game.load(CONTENT, text);
      } catch (e) {
        expect(e instanceof SaveError || /incompatível/.test((e as Error).message), `${kind} @ ${p.join('.')}: ${(e as Error).message}`).toBe(true);
        rejected++;
      }
      if (g) {
        const r = playBot(CONTENT, PROFILES.medio, 2, { game: g, maxDays: Math.min(20, g.st.day + 1) });
        if (r.errors.length) crashes.push(`${kind} @ ${p.join('.')} [${b.tag}]: ${r.errors[0].split('\n')[0]}`);
        else played++;
      }
      expect(({} as Record<string, unknown>).poluido).toBeUndefined();
    }
    expect(crashes).toEqual([]);
    expect(rejected).toBeGreaterThan(100);
    expect(played).toBeGreaterThan(50);
  });
});

// ------------------------------------------------------------------ lógica: ações repetidas
describe('lógica: ações repetidas não valem duas vezes', () => {
  const at = (step: string) => Game.load(CONTENT, BASES.find((b) => b.tag.endsWith('casa|' + step))!.json);

  it('pagar as contas duas vezes cobra uma vez só', () => {
    const g = at('contas');
    const h = g.home!;
    const ids = h.bills().filter((b) => !b.auto).map((b) => b.id);
    g.st.money = 5000;
    expect(h.payBills(ids).ok).toBe(true);
    const after = g.st.money;
    const paid = [...g.st.home!.paid];
    expect(h.payBills(ids).ok).toBe(false);
    expect(g.st.money).toBe(after);
    expect(g.st.home!.paid).toEqual(paid);
  });

  it('dormir duas vezes avança um dia só', () => {
    const g = at('loja');
    const day = g.st.day;
    g.finishHome();
    g.finishHome();
    expect(g.st.day).toBe(day + 1);
  });

  it('dormir antes de escolher a folga e pagar as contas não pula etapas', () => {
    const g = at('escolha');
    const day = g.st.day;
    g.finishHome();
    expect(g.st.day).toBe(day);
    expect(g.st.phase).toBe('casa');
  });

  it('comprar, brincar com o Ozzy e escolher a folga duas vezes valem uma vez', () => {
    // uma noite em que a loja ainda tem algo para comprar
    const g = BASES.filter((b) => b.tag.endsWith('casa|loja'))
      .map((b) => Game.load(CONTENT, b.json))
      .find((x) => x.home!.shop().some((i) => !i.owned))!;
    expect(g, 'nenhuma loja com item à venda nos saves').toBeTruthy();
    const h = g.home!;
    g.st.money = 5000;
    const item = h.shop().find((i) => !i.owned)!;
    expect(h.buy(item.id).ok).toBe(true);
    const m = g.st.money;
    expect(h.buy(item.id).ok).toBe(false);
    expect(g.st.money).toBe(m);
    g.st.vars.desgaste = 50;
    expect(h.playOzzy().ok).toBe(true);
    const d1 = g.st.vars.desgaste;
    expect(d1).toBeLessThan(50);
    expect(h.playOzzy().ok).toBe(false);
    expect(g.st.vars.desgaste).toBe(d1);

    const g2 = at('escolha');
    g2.st.vars.desgaste = 50;
    g2.home!.chooseTimeOff('descanso');
    const d2 = g2.st.vars.desgaste;
    expect(d2).toBeLessThan(50);
    g2.home!.chooseTimeOff('descanso');
    g2.home!.chooseTimeOff('familia');
    expect(g2.st.vars.desgaste).toBe(d2);
  });

  it('café, foto e diário do plantão têm limite', () => {
    const g = Game.load(CONTENT, BASES.find((b) => b.tag.endsWith('jornal|'))!.json);
    g.newspaper();
    g.beginShift();
    g.beginShift();
    const sh = g.shift!;
    expect([sh.coffee(), sh.coffee(), sh.coffee(), sh.coffee()]).toEqual([true, true, false, false]);
    g.st.vars.desgaste = 50;
    sh.photo();
    const d = g.st.vars.desgaste;
    sh.photo();
    expect(g.st.vars.desgaste).toBe(d);
  });
});
