// Casa: contas fixas, loja, cenas genéricas e frases da família.
import type { BillDef, Ctx, SceneDef, ShopItem } from '../engine/types';
import type { HomeContent } from '../engine/content-api';

const present = (c: Ctx, m: 'lucia' | 'davi' | 'zelia') => {
  const f = c.s.family[m];
  return f.status !== 'ausente' && f.status !== 'morto' && !f.away;
};

export function baseBills(c: Ctx): BillDef[] {
  const famCount = (['lucia', 'davi', 'zelia'] as const).filter((m) => present(c, m)).length;
  return [
    { id: 'transporte', label: 'Transporte', amount: 20, auto: true, desc: 'Ônibus até a central. Desconto automático.' },
    { id: 'aluguel', label: 'Aluguel (Seu Nogueira)', amount: (cc) => cc.s.bills.rent, desc: 'Se não pagar, acumula. 3 atrasos = despejo.' },
    { id: 'alimentacao', label: 'Alimentação', amount: famCount >= 3 ? 80 : famCount === 2 ? 65 : 45, desc: 'Sem pagar: família com fome. Duas vezes seguidas: alguém adoece.' },
    { id: 'energia', label: 'Energia', amount: 30, when: (cc) => !cc.s.bills.energyCut, desc: '1ª vez sem pagar: aviso. 2ª: corte, e a insulina estraga.' },
    { id: 'gas', label: 'Gás', amount: 15, desc: 'Sem gás: comida fria. Laços caem.' },
    { id: 'remedios', label: 'Remédios da Dona Zélia', amount: 35, when: (cc) => cc.s.family.zelia.status !== 'morto', desc: 'Sem pagar: ela piora. Duas vezes seguidas: internação.' },
  ];
}

export const SHOP: ShopItem[] = [
  {
    id: 'maquina',
    label: 'Máquina de costura usada',
    price: 450,
    once: true,
    when: (c) => c.day >= 4 && !c.flag('maquina') && present(c, 'lucia'),
    desc: 'O ateliê {doconj}: +R$ 40 por interlúdio a partir de agora.',
    effect: (e) => {
      e.set('maquina');
      e.set('maquina_comprada');
      e.add('lacos', 1, 'a máquina {doconj}');
    },
  },
  {
    id: 'bombinha',
    label: 'Bombinha e espaçador do Liam',
    price: (c) => (c.flag('farmacia_popular') ? 0 : 80),
    once: true,
    when: (c) => c.day >= 3 && !c.flag('bombinha') && present(c, 'davi'),
    desc: (c) => (c.flag('farmacia_popular') ? 'Pela Farmácia Popular, com a receita: de graça.' : 'A bombinha dele acabou.'),
    effect: (e) => {
      e.set('bombinha');
      e.set('bombinha_dia', e.day);
    },
  },
  {
    id: 'conserto',
    label: 'Conserto da geladeira',
    price: (c) => (c.flag('jairo_desconto') ? 200 : 350),
    once: true,
    when: (c) => c.flag('geladeira_quebrada') && !c.flag('geladeira_ok'),
    desc: (c) => (c.flag('jairo_desconto') ? 'Seu Jairo fez desconto (era R$ 350).' : 'Seu Jairo, Jairo Refrigeração.'),
    effect: (e) => e.set('geladeira_ok'),
  },
  {
    id: 'isopor',
    label: 'Isopor com gelo (insulina)',
    price: 10,
    when: (c) => c.flag('geladeira_quebrada') && !c.flag('geladeira_ok'),
    desc: 'Mantém a insulina da Dona Zélia gelada por mais um interlúdio.',
  },
  {
    id: 'curativo',
    label: 'Curativo especial (pé da Dona Zélia)',
    price: (c) => (c.flag('curativo_gratis') ? 0 : 90),
    once: true,
    when: (c) => c.flag('pe_ferida') && !c.flag('curativo') && c.s.family.zelia.status !== 'morto',
    desc: (c) => (c.flag('curativo_gratis') ? 'Amostras da UBS que a Simone conseguiu.' : 'A ferida não pode esperar.'),
    effect: (e) => {
      e.set('curativo');
      e.s.family.zelia.risk = Math.max(0, e.s.family.zelia.risk - 2);
    },
  },
  {
    id: 'fisio',
    label: 'Fisioterapia da Dona Zélia',
    price: 60,
    when: (c) => c.day >= 10 && c.s.family.zelia.status !== 'morto',
    desc: 'Laços +1. Reduz o risco no pé.',
    effect: (e) => {
      e.add('lacos', 1, 'fisioterapia');
      e.s.family.zelia.risk = Math.max(0, e.s.family.zelia.risk - 1);
      e.set('fisio');
    },
  },
  {
    id: 'desenho',
    label: 'Aula de desenho do Liam',
    price: 50,
    when: (c) => c.day >= 10 && present(c, 'davi'),
    desc: 'Laços +1. Ele vai desenhar cada vez melhor.',
    effect: (e) => {
      e.add('lacos', 1, 'aula de desenho');
      e.set('aula_desenho', (e.val<number>('aula_desenho') ?? 0) + 1);
    },
  },
  {
    id: 'pizza',
    label: 'Noite de pizza em família',
    price: 45,
    when: (c) => c.day >= 10,
    desc: 'Desgaste −10, Laços +1.',
    effect: (e) => {
      e.add('desgaste', -10, 'pizza');
      e.add('lacos', 1, 'pizza');
    },
  },
];

export function genericScene(c: Ctx): SceneDef {
  const luc = present(c, 'lucia');
  const dav = present(c, 'davi');
  const fome = c.s.bills.foodMissed > 0;
  return {
    id: 'generico_d' + c.day,
    bg: 'cozinha',
    nodes: {
      start: {
        lines: [
          { who: 'NARRADOR', t: fome ? 'Arroz, um ovo dividido em quatro. Ninguém reclama em voz alta.' : 'Arroz, feijão, a novela baixinha na sala.' },
          { who: 'ZELIA', t: 'Chegou, {filho}? Senta. Come antes que esfrie.', when: (cc) => cc.s.family.zelia.status !== 'morto' },
          { who: 'DAVI', t: 'Salvou alguém hoje, {pai}?', when: () => dav },
          { who: 'LUCIA', t: 'Deixa {m:seu pai|sua mãe} comer, Liam.', when: () => luc && dav },
        ],
        choices: [
          { label: 'Contar uma história boa do plantão.', next: 'boa', affectionate: true },
          { label: 'Só comer em silêncio.', next: 'silencio' },
        ],
      },
      boa: {
        lines: [
          { who: 'EU', t: 'Hoje uma senhora ligou só pra saber se eu tinha almoçado.' },
          { who: 'DAVI', t: 'E você tinha?', when: () => dav },
          { who: 'ZELIA', t: 'Não tinha. Tá na cara.', when: (cc) => cc.s.family.zelia.status !== 'morto' },
        ],
      },
      silencio: {
        lines: [{ who: 'NARRADOR', t: 'O barulho dos talheres. O relógio da cozinha, atrasado como sempre.' }],
      },
    },
  };
}

export function genericBico(c: Ctx): SceneDef {
  return {
    id: 'bico_d' + c.day,
    bg: 'preto',
    nodes: {
      start: {
        lines: [
          { who: 'NARRADOR', t: 'A sirene ainda zune no seu ouvido quando você chega em casa, de madrugada.' },
          { who: 'NARRADOR', t: 'Tem um prato coberto com outro prato em cima do fogão.' },
          { who: 'NARRADOR', t: 'Um bilhete com a letra {doconj}: "Tem feijão. Não acorda o Liam."', when: (cc) => present(cc, 'lucia') },
        ],
      },
    },
  };
}

export const HOME: HomeContent = {
  baseBills,
  shop: SHOP,
  genericScene,
  genericBico,
};
