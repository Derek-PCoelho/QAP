// =============================================================================
// Ajudantes dos dias 11 a 20 (1.1, frente "Roteiro D11–20 + finais").
// Leitura das marcas que a bíblia (docs/ROTEIRO-1.1.md) manda colher nestes dias:
// dinheiro por faixa e origem (Parte 3.1), presença da família, contadores
// (saulo_confianca, aula_desenho), quem voltou vivo de um dia anterior, e a loja
// da aliança de volta (R5).
// =============================================================================
import type { Ctx, EffCtx, ShopItem, SceneDef, DLine, Choice, SceneBg } from '../../engine/types';
import { moneyBand, moneyOrigin } from '../../engine/state';

/** faixa do saldo agora (aperto < 150 ≤ justo < 600 ≤ folga < 1200 ≤ sobra) */
export const faixa = (c: Ctx) => moneyBand(c.money());
/** origem dominante do dinheiro (vereador > bico > ateliê > aliança > salário) */
export const origem = (c: Ctx) => moneyOrigin(c.s);
/** tem dinheiro sobrando (folga ou sobra) */
export const comFolga = (c: Ctx) => faixa(c) === 'folga' || faixa(c) === 'sobra';
/** aperto ou justo: as falas de aperto só aparecem aqui (regra do dinheiro) */
export const apertado = (c: Ctx) => !comFolga(c);
/** o dinheiro que sobra é do envelope do vereador */
export const dinheiroDoVereador = (c: Ctx) => comFolga(c) && origem(c) === 'vereador';

/** número guardado numa flag (contadores) */
export const num = (c: Ctx, f: string) => Number(c.s.flags[f]) || 0;
/** soma num contador com limites (ex.: saulo_confianca 0–5) */
export function addNum(e: EffCtx, f: string, d: number, lo = 0, hi = 5) {
  e.set(f, Math.max(lo, Math.min(hi, num(e, f) + d)));
}
/** confiança do Dr. Saulo, do Regional (0–5; a frente da vaga zero também soma aqui) */
export const saulo = (c: Ctx) => num(c, 'saulo_confianca');
/** aulas de desenho do Liam com a Dona Iolanda (item da loja, D10+) */
export const aulas = (c: Ctx) => num(c, 'aula_desenho');

/** o cônjuge ou o Liam estão em casa hoje (fora em Rio Claro, ido embora ou ausente = não) */
export const presente = (c: Ctx, m: 'lucia' | 'davi') => {
  const f = c.s.family[m];
  return f.status !== 'ausente' && f.status !== 'morto' && !f.away && !c.flag('lucia_fora') && !c.flag('lucia_foi_embora');
};
/** a Dona Zélia está viva */
export const zeliaViva = (c: Ctx) => c.s.family.zelia.status !== 'morto';
/** a Dona Zélia está em casa (viva e não internada) */
export const zeliaEmCasa = (c: Ctx) => zeliaViva(c) && c.s.family.zelia.status !== 'internado';

/** a ligação daquele dia acabou com o paciente vivo (pelo diário) */
export const vivoNoDiario = (c: Ctx, callId: string) => c.s.diary.some((d) => d.callDef === callId && (d.kind === 'vivo' || d.kind === 'orientado' || d.kind === 'sequela'));
/** o Edson (parada do dia 1) está vivo: porteiro do Ed. Aurora */
export const edsonVivo = (c: Ctx) => vivoNoDiario(c, 'd01_parada');

/** quem atende o noturno */
export const noturnoFala = (c: Ctx) => (c.flag('denunciou_henrique') ? 'PAULA' : 'HENRIQUE');

/** o envelope do vereador saiu de casa antes da matéria (delegacia; nos dias 9 e 10) */
export const envelopeEntregue = (c: Ctx) => c.flag('envelope_entregue_policia') || c.flag('envelope_entregue');

/**
 * O nome sai na matéria só se o envelope foi aceito, a Rosângela não cortou a página do
 * caderninho e o envelope não foi entregue à polícia antes (flags.md, `nome_na_materia`).
 */
export const nomeNaMateria = (c: Ctx) => c.flag('envelope_aceito') && !c.flag('rosangela_protegeu') && !envelopeEntregue(c);

/**
 * Fontes da matéria da Carla: as quatro "pessoas" do motor (você, cônjuge, Bené, Peixoto) e
 * as duas novas da 1.1 (Saulo com a folha das sete; o caderninho da Rosângela).
 */
export const fontesDaMateria = (c: Ctx) => Object.values(c.s.sources).filter(Boolean).length + (c.flag('saulo_fonte') ? 1 : 0) + (c.flag('rosangela_caderninho') ? 1 : 0);

/** R5: a história da aliança no ônibus doze foi contada em casa ou pelo Bené */
export const sabeDoOnibus = (c: Ctx) => c.flag('zelia_contou_alianca') || c.flag('bene_contou_casamento');
/** a aliança da Zélia está em casa (nunca vendida, ou comprada de volta) */
export const aliancaEmCasa = (c: Ctx) => !c.flag('alianca_vendida') || c.flag('alianca_recomprada');

/** cena curta de rua (ida/volta): sem família desenhada */
export function rua(id: string, bg: SceneBg, lines: DLine[], choices?: Choice[], extra?: Record<string, { lines: DLine[]; next?: string }>): SceneDef {
  return { id, bg, cast: [], nodes: { start: { lines, choices }, ...(extra ?? {}) } };
}

/**
 * R5 — "Comprar a aliança de volta (Seu Jacó)", D11 a D19 (bíblia: "Ouro a gente compra por
 * duzentos e vende por duzentos e sessenta"). Comprada com dinheiro do envelope, a Zélia não põe
 * no dedo: guarda na caixinha (`alianca_envelope`).
 */
export const ALIANCA_VOLTA: ShopItem = {
  id: 'alianca_volta',
  label: 'Comprar a aliança de volta (Seu Jacó)',
  price: 260,
  once: true,
  when: (c) => c.flag('alianca_vendida') && !c.flag('alianca_recomprada') && zeliaViva(c) && c.day >= 11 && c.day <= 19,
  desc: (c) =>
    origem(c) === 'vereador'
      ? '"Ouro a gente compra por duzentos e vende por duzentos e sessenta. É a vida." A Dona Zélia já avisou: com o dinheiro daquele homem, não.'
      : '"Ouro a gente compra por duzentos e vende por duzentos e sessenta. É a vida." A aliança do seu pai, na vitrine da XV.',
  effect: (e) => {
    e.set('alianca_recomprada');
    e.set('alianca_recomprada_dia', e.day);
    if (origem(e) === 'vereador') {
      e.set('alianca_envelope');
      e.toast('A Dona Zélia segura a caixinha e não abre. "Com esse dinheiro, não. Prefiro o dedo pelado." Ela guarda a aliança no criado-mudo.');
    } else {
      e.add('lacos', 1, 'a aliança voltou pra casa');
      e.toast('A Dona Zélia põe a aliança no dedo sem dizer nada. Depois diz: "Ficou larga. Eu é que emagreci."');
    }
  },
};
