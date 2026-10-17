// =============================================================================
// Campanha 2 ("Simone"): salário, contas fixas e o remédio da pressão.
//
// Calibragem (jogadora que paga tudo, TMA na meta quase todo dia, sem advertência):
//   salário 120 + bônus de TMA 15  ≈ R$ 135 por turno
//   fixas: aluguel (auto) 30 → 48 a partir do D7 (sem a parte do Wesley; 38 se ele voltar
//          a trabalhar) · ônibus (auto) 8 · mercado 36 · remédio 9 (grátis e automático na
//          Farmácia Popular depois da receita nova)
//   eventos: luz, gás, água, documento da moto, hospital, antibiótico, consórcio, dengue,
//            chuveiro, raio-X, fiado, carnê, goteira, UPA, ingredientes do bolo do Bené…
// Trajetória esperada (bot "cuidadosa"): começa em 90, fica negativa entre os dias 10 e 17
// (consórcio, dengue, chuveiro, raio-X, carnê) e termina entre R$ 150 e R$ 300. Quem perde
// bônus ou leva advertência afunda mais no meio e escolhe entre o remédio e o resto (com
// saldo negativo, a tela de contas não pré-marca nada). Abaixo de −250: despejo.
// =============================================================================
import type { BillDef, Ctx } from '../../engine/types';
import { inc } from './util';

export const PAY = 120;

/** o Wesley volta a ajudar no aluguel quando trabalha (moto ou banca da feira) */
const wesleyAjuda = (c: Ctx) => c.day < 7 || c.flag('wesley_voltou_moto') || c.flag('wesley_feira');

export function baseBills(c: Ctx): BillDef[] {
  const ajuda = wesleyAjuda(c);
  return [
    {
      id: 'aluguel',
      label: ajuda ? 'Aluguel da casa 2 (a sua parte)' : 'Aluguel da casa 2 (inteiro)',
      amount: ajuda ? (c.day < 7 ? 30 : 38) : 48,
      auto: true,
      desc: ajuda ? 'Vila do fundo, Rua Tiradentes. O Wesley paga o resto.' : 'Vila do fundo, Rua Tiradentes. Sem a parte do Wesley, é tudo seu.',
    },
    { id: 'onibus', label: 'Ônibus Vila Nova–Centro', amount: 8, auto: true, desc: 'Ida e volta.' },
    {
      id: 'mercado',
      label: 'Mercado',
      amount: 36,
      desc: 'Arroz, feijão, ovo, café, o pão do Wesley.',
      onSkip: (e) => {
        e.add('desgaste', 4, 'janta pão com café');
        inc('mercado_pulado')(e);
      },
    },
  ];
}

/** remédio da pressão: sempre a última conta da noite (é a primeira que a Simone corta) */
const tomou = (e: Parameters<NonNullable<BillDef['onPay']>>[0]) => {
  e.set('sem_remedio_seq', 0);
  inc('remedio_tomado')(e);
  if (e.v('pressao') >= 6) e.add('pressao', -1, 'remédio em dia');
};
const pulou = (e: Parameters<NonNullable<BillDef['onSkip']>>[0]) => {
  const n = (Number(e.val('sem_remedio_seq')) || 0) + 1;
  e.set('sem_remedio_seq', n);
  inc('remedio_pulado')(e);
  // a pressão sobe na primeira noite sem remédio e depois a cada duas
  if (n % 2 === 1) e.add('pressao', 1, 'sem remédio');
};

export const REMEDIO: BillDef[] = [
  {
    id: 'remedio',
    label: 'Remédio da pressão (farmácia)',
    amount: 9,
    when: (c) => !c.flag('receita_nova'),
    desc: 'Farmácia do Seu Toninho. A receita venceu em setembro: sem receita nova, é o preço cheio.',
    onPay: tomou,
    onSkip: pulou,
  },
  {
    // com a receita nova o dilema acaba: é de graça e entra sozinho na conta da noite
    id: 'remedio_popular',
    label: 'Remédio da pressão (Farmácia Popular)',
    amount: 0,
    auto: true,
    when: (c) => c.flag('receita_nova'),
    desc: 'Com a receita nova, de graça. A cartela fica na bolsa.',
    onPay: tomou,
  },
];

/** contas do dia + o remédio no fim da lista */
export const contas = (...extra: BillDef[]): BillDef[] => [...extra, ...REMEDIO];
