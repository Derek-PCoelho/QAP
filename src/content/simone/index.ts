// =============================================================================
// Campanha 2: "Simone" — os mesmos 20 dias, da cadeira da TARM.
// Simone Aparecida Batista, 51 anos, 22 de central. Mora na vila do fundo da
// Rua Tiradentes (Vila Nova), casa 2, com o filho Wesley Campos, 19.
//
// Arquivos:
//   util.ts      ajudantes (mundo-sombra, TMA, pressão, cena da noite com alarme)
//   economy.ts   salário, contas fixas, remédio da pressão (sempre a última conta)
//   days1_7.ts   D1–D7  (a OS, a vila, a bombinha, a moto, o Wesley no chão)
//   days8_13.ts  D8–D13 (19:32, a casa d{o} {dr}, a dengue, o Yuri, a sindicância)
//   days14_20.ts D14–D20 (2019, a Yasmin, o pai do Peixoto, a crise, a lista, a Cida, 18:58)
//   endings.ts   finais, fios do epílogo, game overs, créditos
// =============================================================================
import type { SimoneContent, SimoneDayDef } from '../../engine/content-api';
import { PAY, baseBills } from './economy';
import { DAYS_1_7 } from './days1_7';
import { DAYS_8_13 } from './days8_13';
import { DAYS_14_20 } from './days14_20';
import { ending, GAMEOVER, CREDITS } from './endings';

const DAYS: Record<number, SimoneDayDef> = {};
for (const d of [...DAYS_1_7, ...DAYS_8_13, ...DAYS_14_20]) DAYS[d.day] = d;

export const SIMONE: SimoneContent = {
  days: DAYS,
  pay: PAY,
  baseBills,
  ending,
  gameover: GAMEOVER,
  credits: CREDITS,
};
