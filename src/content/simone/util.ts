// =============================================================================
// Campanha 2 ("Simone"): ajudantes compartilhados pelos dias, contas e finais.
//
// Dois estados convivem nesta campanha:
//  · o da Simone (c.s): dinheiro, pressão, Wesley, emprego, desgaste, flags "sdN_*";
//  · o mundo-sombra (c.s.shadow): a frota, os pacientes e as escolhas do regulador
//    controlado pela IA. As poucas escolhas da Simone que mudam o mundo da
//    campanha 1 (bombinha no D3, sindicância no D12, Carla no D14) são gravadas
//    lá com `sombraSet` / `sombraFonte`.
// =============================================================================
import type { Ctx, Effect, SceneDef, SceneNode, SceneBg, DLine, CallRT, GameState, KeyPatient } from '../../engine/types';
import type { SimoneWorld } from '../../engine/content-api';

// -----------------------------------------------------------------------------
// mundo-sombra
// -----------------------------------------------------------------------------
export const sombra = (c: Ctx): GameState | undefined => c.s.shadow;
export const sFlag = (c: Ctx, f: string): boolean => !!c.s.shadow?.flags[f];
export const sVal = <T = unknown>(c: Ctx, f: string): T | undefined => c.s.shadow?.flags[f] as T | undefined;
export const sKey = (c: Ctx, k: KeyPatient): 'salvo' | 'perdido' | undefined => c.s.shadow?.keys[k];

/** grava uma escolha no mundo-sombra (o que a Simone muda no mundo da campanha 1) */
export const sombraSet =
  (f: string, v: boolean | number | string = true): Effect =>
  (e) => {
    if (e.s.shadow) e.s.shadow.flags[f] = v;
  };
export const sombraUnset =
  (f: string): Effect =>
  (e) => {
    if (e.s.shadow) delete e.s.shadow.flags[f];
  };
/**
 * Fonte da matéria da Carla no mundo-sombra. 'simone' não faz parte do tipo Source
 * do motor: entra como chave extra e conta em nFontes() do dia 18 (ver relatório).
 */
export const sombraFonte =
  (src: string): Effect =>
  (e) => {
    if (e.s.shadow) (e.s.shadow.sources as Record<string, boolean>)[src] = true;
  };

/** o Henrique foi denunciado no D12 (no mundo-sombra): a Mesa 2 fica vazia */
export const henriqueDenunciado = (c: Ctx) => sFlag(c, 'denunciou_henrique');

/**
 * Mesa 2 vazia a partir do D13 quando o Henrique foi afastado. O motor só aceita
 * `henrique.away` estático por dia; como depende da escolha do D12, a manhã liga a
 * ausência direto no turno recém-criado (ver relatório: pedir `away` como função).
 */
export const mesa2SeAfastado: Effect = (e) => {
  const T = e.s.shadow?.shift?.tarm;
  if (T && e.s.shadow?.flags['denunciou_henrique']) T.regs.henrique.away = true;
};

// -----------------------------------------------------------------------------
// ligações do turno de hoje (valem durante o turno, no fim do turno e à noite)
// -----------------------------------------------------------------------------
export function rt(c: Ctx, defId: string): CallRT | undefined {
  const shf = c.s.shadow?.shift;
  if (!shf || shf.day !== c.day) return undefined;
  return Object.values(shf.calls).find((x) => x.def === defId);
}
export const wcall = (c: Ctx, w: SimoneWorld | undefined, defId: string): CallRT | undefined => w?.call(defId) ?? rt(c, defId);

/** desfecho resumido de uma ligação */
export type Fim = 'vivo' | 'morto' | 'noturno' | 'pendente' | 'sem';
export function fimDe(r: CallRT | undefined): Fim {
  if (!r) return 'sem';
  if (r.outcome === 'obito') return 'morto';
  if (r.status === 'noturno') return 'noturno';
  if (['salvo', 'transportado', 'orientado', 'liberado', 'sequela', 'piorou', 'trote'].includes(r.outcome)) return 'vivo';
  return 'pendente';
}
/** a Simone triou essa ligação (não a Rose) */
export const daSimone = (r?: CallRT) => !!r?.tarm && !r.tarm.cover;
/** mandaram viatura */
export const despachou = (r?: CallRT) => r?.decision?.resource === 'USA' || r?.decision?.resource === 'USB';

/**
 * A conversa custa tempo de TMA: "atrasa" o atendimento em `min` minutos de jogo
 * (o motor mede TMA = hora do passe − hora do atendimento). Só antes do passe.
 */
export const custaTMA =
  (defId: string, min: number): Effect =>
  (e) => {
    const r = rt(e, defId);
    if (r && r.answered !== undefined && !r.tarm) r.answered -= min;
  };

// -----------------------------------------------------------------------------
// contadores e flags
// -----------------------------------------------------------------------------
export const num = (c: Ctx, f: string): number => Number(c.val(f)) || 0;
export const inc =
  (f: string, d = 1): Effect =>
  (e) =>
    e.set(f, (Number(e.val(f)) || 0) + d);

// -----------------------------------------------------------------------------
// pressão arterial
// -----------------------------------------------------------------------------
// [validar] correspondência entre a escala de pressão do jogo (0–10) e a leitura
// do aparelho de pulso. 7 = "17 por 10" é o limiar da crise do dia 17; a crise da
// campanha 1 marca 22 por 13 na central; depois da UPA, 16 por 10.
const PA = ['12 por 8', '12 por 8', '13 por 8', '13 por 8', '14 por 9', '15 por 9', '16 por 10', '17 por 10', '18 por 11', '19 por 12', '21 por 13'];
export const pa = (c: Ctx): string => PA[Math.max(0, Math.min(10, Math.round(c.v('pressao'))))];

/** linha do aparelho de pulso (o presente de Dia das Mães do Wesley) */
export const paLine = (pre = 'O aparelho de pulso apita:'): DLine => ({ who: 'NARRADOR', t: (c) => `${pre} ${pa(c)}.` });

/** remédio: noites seguidas sem tomar */
export const semRemedio = (c: Ctx): number => num(c, 'sem_remedio_seq');
export const temComprimido = (c: Ctx): boolean => semRemedio(c) === 0;

// -----------------------------------------------------------------------------
// cenas
// -----------------------------------------------------------------------------
export const cena = (id: string, bg: SceneBg, nodes: Record<string, SceneNode>, cast?: string[]): SceneDef => ({ id, bg, cast, nodes });

/**
 * Cena da noite com o alarme da pressão: na primeira noite em que a pressão chega a 10,
 * um susto (a vista apaga pela metade e volta); se chegar de novo, colapso (game over).
 */
export function noite(c: Ctx, id: string, bg: SceneBg, nodes: Record<string, SceneNode>, cast?: string[]): SceneDef {
  const start = nodes.start;
  const own = start.onEnter;
  const susto: DLine[] = [
    // [validar] sinais de alarme de pressão muito alta (dor de nuca, visão turva)
    { who: 'NARRADOR', t: 'Na escada da vila, a vista apaga pela metade e volta. A nuca lateja como se tivesse outro coração ali dentro. Ela senta no degrau e conta até sessenta, do jeito que ensina pra quem liga.', when: (cc) => cc.val('aviso_pressao_dia') === cc.day && !cc.flag('simone_colapso') },
    { who: 'NARRADOR', t: 'Passa. Quase.', when: (cc) => cc.val('aviso_pressao_dia') === cc.day && !cc.flag('simone_colapso') },
    { who: 'NARRADOR', t: 'Na escada da vila, a vista apaga pela metade. Desta vez não volta.', when: (cc) => cc.flag('simone_colapso') },
  ];
  const alto: DLine = { who: 'NARRADOR', t: 'A nuca pesa. Ela sabe o nome disso e não fala em voz alta.', when: (cc) => cc.v('pressao') === 9 };
  return {
    id,
    bg,
    cast,
    nodes: {
      ...nodes,
      start: {
        ...start,
        lines: [...susto, alto, ...start.lines],
        onEnter: (e) => {
          if (e.v('pressao') >= 10) {
            if (e.flag('aviso_pressao') && e.val('aviso_pressao_dia') !== e.day) e.set('simone_colapso');
            else {
              e.set('aviso_pressao');
              e.set('aviso_pressao_dia', e.day);
            }
          }
          // a casa descansa um pouco, qualquer que seja a noite (o turno soma +3 a +7)
          e.add('desgaste', -3, 'em casa');
          own?.(e);
        },
      },
    },
  };
}

/** gênero do protagonista (Mesa 1) */
export const mesa1 = (c: Ctx) => (c.g === 'M' ? 'Dr. Moura' : 'Dra. Moura');
