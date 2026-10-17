// Casa: contas fixas, loja, cenas genéricas e frases da família.
// 1.1 (ROTEIRO 3.1, "a família fala do dinheiro que existe"): as falas de dinheiro mudam com a FAIXA do saldo
// (aperto < 150 ≤ justo < 600 ≤ folga < 1200 ≤ sobra) e com a ORIGEM dominante do dinheiro (vereador, bico,
// ateliê, aliança, salário). Leitura pronta no motor: moneyBand/moneyOrigin (src/engine/state.ts).
import type { BillDef, Ctx, DLine, SceneDef, ShopItem } from '../engine/types';
import type { HomeContent } from '../engine/content-api';
import { moneyBand, moneyOrigin } from '../engine/state';

const present = (c: Ctx, m: 'lucia' | 'davi' | 'zelia') => {
  const f = c.s.family[m];
  return f.status !== 'ausente' && f.status !== 'morto' && !f.away;
};

// ---------------------------------------------------------------------------
// Dinheiro: faixa e origem (para as cenas dos dias também)
// ---------------------------------------------------------------------------
export type Faixa = 'aperto' | 'justo' | 'folga' | 'sobra';
export type Origem = ReturnType<typeof moneyOrigin>;
/** faixa do saldo agora (lida na hora da cena) */
export const faixa = (c: Ctx): Faixa => moneyBand(c.s.money);
/** origem dominante do dinheiro agora */
export const origem = (c: Ctx): Origem => moneyOrigin(c.s);
/** saldo folgado (folga ou sobra): nenhuma fala de aperto */
export const temFolga = (c: Ctx) => faixa(c) === 'folga' || faixa(c) === 'sobra';
/** dinheiro do vereador mandando na casa (envelope aceito e não devolvido) */
export const dinheiroVereador = (c: Ctx) => origem(c) === 'vereador';

const POR_EXTENSO = ['ninguém', 'um', 'dois', 'três', 'quatro'];

/** a primeira linha do jantar genérico (ROTEIRO 3.1-a): faixa × origem */
export function jantarAbre(c: Ctx): DLine[] {
  const f = faixa(c);
  const o = origem(c);
  const n = 1 + (['lucia', 'davi', 'zelia'] as const).filter((m) => present(c, m)).length;
  const zel = present(c, 'zelia');
  const conj = present(c, 'lucia');
  const liam = present(c, 'davi');
  const N = (t: string): DLine => ({ who: 'NARRADOR', t });
  const fome = c.s.bills.foodMissed > 0;
  if (fome || f === 'aperto') {
    if (o === 'bico') return [N('Arroz e ovo. O seu prato está coberto com outro prato: você chegou tarde de novo.')];
    if (o === 'atelie') return [N('Arroz, ovo e a máquina parada no canto. Hoje não teve encomenda.')];
    return [N(`Arroz, um ovo dividido em ${POR_EXTENSO[n] ?? 'quatro'}. Ninguém reclama em voz alta.`)];
  }
  if (f === 'justo') {
    if (o === 'bico') return [N('Feijão com linguiça.'), ...(zel ? [{ who: 'ZELIA', t: 'Essa linguiça é da sua noite na ambulância. Come devagar, que custou caro.' }] : [])];
    if (o === 'atelie' && conj) return [N('Feijão, arroz e bife.'), { who: 'LUCIA', t: 'O bife é da barra da Juliana. Pode elogiar.' }];
    if (o === 'vereador') return [N('Bife. Ninguém comenta o bife.')];
    return [N('Arroz, feijão, a novela baixinha na sala.')];
  }
  if (f === 'folga') {
    if (o === 'bico') return [N('Frango assado do Seu Toninho.'), ...(liam ? [{ who: 'DAVI', t: '{Pai}, quando você trabalha de noite tem frango.' }, N('Silêncio na mesa.')] : [])];
    if (o === 'atelie' && conj) return [N('Lasanha.'), { who: 'LUCIA', t: 'Essa conta de luz fui eu que paguei. Quero ouvir obrigad{m:o|a}.' }];
    if (o === 'vereador' && conj) return [N('Lasanha de padaria.'), { who: 'LUCIA', t: 'Eu comprei. Não perguntei de onde. Não quero saber hoje.' }];
    return [N('Bife e salada.'), ...(zel ? [{ who: 'ZELIA', t: 'Olha, tem tomate. Quem morreu?' }] : [])];
  }
  // sobra
  if (o === 'bico') return [N('Pizza. Você dorme na segunda fatia.')];
  if (o === 'atelie' && conj) return [N('Pizza e uma cadeira nova na cozinha.'), { who: 'LUCIA', t: 'Primeira coisa que eu compro pra mim em dois anos.' }];
  if (o === 'vereador') return [N('Pizza grande.' + (zel ? ' A Dona Zélia come arroz requentado.' : '')), ...(zel ? [{ who: 'ZELIA', t: 'Eu tô sem fome. De pizza.' }] : [])];
  return [N('Pizza no meio da semana.'), ...(zel ? [{ who: 'ZELIA', t: 'Vão acostumar o menino mal.' }] : [])];
}

/** o cônjuge e as contas (ROTEIRO 3.1-b): uma fala por noite, antes de pagar */
export function falaContas(c: Ctx): string {
  if (!present(c, 'lucia')) return '';
  const f = faixa(c);
  const o = origem(c);
  if (f === 'aperto') return c.day % 2 ? '"Marca o aluguel e a luz. O resto a gente vê."' : '"Se faltar, a gente corta o gás. De novo."';
  if (f === 'justo') return '"Dá pra pagar tudo. Não dá pra pagar tudo e comer bem. Escolhe."';
  if (o === 'vereador') return c.day >= 9 ? '"Paga. Mas paga sabendo de quem era."' : '"O dinheiro tá aí. Paga as contas com ele, se quiser. Eu não vou tocar."';
  if (o === 'bico') return '"Sobrou. Sobrou porque você não dormiu. Eu queria que sobrasse com você em casa."';
  if (o === 'atelie') return '"Hoje eu pago a luz. Deixa eu pagar. Faz bem pra mim."';
  if (o === 'alianca') return '"Paga com o dinheiro do seu pai. A sua mãe disse que ele ia gostar de pagar a luz."';
  return '"Primeiro mês que sobra. Não gasta tudo de uma vez, que eu te conheço."';
}

/** a Dona Zélia e o remédio dela (ROTEIRO 3.1-c) */
export function falaRemedio(c: Ctx): string {
  if (!present(c, 'zelia')) return '';
  const f = faixa(c);
  if (f === 'aperto') return 'Dona Zélia: "Pula o meu esse mês. Eu tenho umas amostras." (Não tem.)';
  if (f === 'justo') return 'Dona Zélia: "Paga o meu. Eu fico de olho no açúcar."';
  if (f === 'sobra' && dinheiroVereador(c)) return 'Dona Zélia: "Remédio comprado com aquilo eu tomo. Porque eu não sou burra. Mas eu tomo com raiva."';
  return 'Dona Zélia: "Já que sobrou, compra a fita do aparelho também. Faz três meses que eu meço no olho."';
}

/** o Liam pede coisas (ROTEIRO 3.1-d, a partir do dia 8) */
export function falaLiam(c: Ctx): string {
  const f = faixa(c);
  if (f === 'aperto') return 'Não precisa de tênis novo. O furo é do lado, ninguém vê.';
  if (f === 'justo') return 'Dá pra comprar giz de cera? Só o de doze. O de vinte e quatro é muito.';
  if (f === 'sobra' && dinheiroVereador(c) && c.day >= 10) return 'Na escola falaram que vocês ficaram ricos. É verdade?';
  return 'Posso fazer a aula de desenho? A da Dona Iolanda? O Pedro faz.';
}

/** a conta de luz vem paga pelo ateliê (folga/sobra com a máquina rendendo) */
const luzDoAtelie = (c: Ctx) => temFolga(c) && origem(c) === 'atelie' && present(c, 'lucia');

export function baseBills(c: Ctx): BillDef[] {
  const famCount = (['lucia', 'davi', 'zelia'] as const).filter((m) => present(c, m)).length;
  const conj = falaContas(c);
  const zel = falaRemedio(c);
  return [
    { id: 'transporte', label: 'Transporte', amount: 20, auto: true, desc: 'Ônibus até a central. Desconto automático.' },
    {
      id: 'aluguel',
      label: 'Aluguel (Seu Nogueira)',
      amount: (cc) => cc.s.bills.rent,
      desc: (conj ? `{Oconj}: ${conj} ` : '') + 'Se não pagar, acumula. 3 atrasos = despejo.',
    },
    { id: 'alimentacao', label: 'Alimentação', amount: famCount >= 3 ? 80 : famCount === 2 ? 65 : 45, desc: 'Sem pagar: família com fome. Duas vezes seguidas: alguém adoece.' },
    {
      id: 'energia',
      label: 'Energia',
      amount: (cc) => (luzDoAtelie(cc) ? 0 : 30),
      when: (cc) => !cc.s.bills.energyCut,
      desc: (cc) => (luzDoAtelie(cc) ? '{Oconj} já pagou a luz com o dinheiro do ateliê.' : '1ª vez sem pagar: aviso. 2ª: corte, e a insulina estraga.'),
    },
    { id: 'gas', label: 'Gás', amount: 15, desc: 'Sem gás: comida fria. Laços caem.' },
    {
      id: 'remedios',
      label: 'Remédios da Dona Zélia',
      amount: 35,
      when: (cc) => cc.s.family.zelia.status !== 'morto',
      desc: (zel ? zel + ' ' : '') + 'Sem pagar: ela piora. Duas vezes seguidas: internação.',
    },
  ];
}

// ---------------------------------------------------------------------------
// Aulas de desenho do Liam (ROTEIRO 3.3): Dona Iolanda Quintana, Ed. Aurora, ap. 301 (Rua XV, 1950),
// o prédio do Henrique (302) e do porteiro Edson (parada do dia 1). Sábado de manhã, de ônibus 12.
// `aula_desenho` = número de aulas; `aula_desenho_dN` = dia da compra; `aula_sem_rosto` = paga com o
// dinheiro do vereador (o desenho daquela semana sai sem o rosto do protagonista).
// ---------------------------------------------------------------------------
const edsonVivo = (c: Ctx) => c.s.diary.some((d) => (d.callDef === 'd01_parada' || d.id === 'd01_parada') && d.kind === 'vivo');

function aulaDesc(c: Ctx): string {
  const n = c.val<number>('aula_desenho') ?? 0;
  const fala = n === 0 ? `LIAM: "${falaLiam(c)}" ` : '';
  const prox = [
    'Primeira aula: o Liam vai sábado, de ônibus 12, até o Ed. Aurora, 301.',
    'Segunda aula: retrato, "do jeito que a pessoa é, não do jeito que ela quer".',
    'Terceira aula: a Dona Iolanda fala de uma mostra na Biblioteca Municipal.',
    'Mais uma aula: lápis grafite e aquarela.',
  ][Math.min(n, 3)];
  return `${fala}${prox} Laços +1.`;
}

function comprarAula(e: Parameters<NonNullable<ShopItem['effect']>>[0]) {
  const n = (e.val<number>('aula_desenho') ?? 0) + 1;
  e.add('lacos', 1, 'aula de desenho');
  e.set('aula_desenho', n);
  e.set('aula_desenho_d' + e.day, true);
  if (dinheiroVereador(e) && !e.flag('zelia_lapis_vereador')) {
    e.set('zelia_lapis_vereador');
    e.set('aula_sem_rosto');
    if (present(e, 'zelia')) e.toast('DONA ZÉLIA (sem tirar o olho da novela): "Lápis comprado com aquilo desenha torto."');
  }
  const t = [
    edsonVivo(e)
      ? 'Sábado, Ed. Aurora, 301. Na volta, o Liam conta: "O porteiro tem uma cicatriz de raio no peito. Disse que um doutor do telefone salvou ele."'
      : 'Sábado, Ed. Aurora, 301. A Dona Iolanda cobra cinquenta reais e um café. O Liam volta com a mão suja de carvão.',
    'O Liam volta da aula falando de um moço que fica sentado na escada do terceiro andar "cheirando a bala".',
    'A Dona Iolanda mandou recado: quer inscrever um desenho do Liam na Mostra dos Alunos da Biblioteca.',
    'O Liam agora assina embaixo: "LIAM, 9 ANOS". Ainda tem 8.',
  ][Math.min(n - 1, 3)];
  e.toast(t);
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
      e.set('maquina_comprada_dia', e.day);
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
    // ROTEIRO 3.1-c: com o saldo folgado, a Zélia pede a fita do aparelho (dinheiro usado de forma visível)
    id: 'fita_glicemia',
    label: 'Fitas do aparelho de glicemia (Dona Zélia)',
    price: 25,
    once: true,
    when: (c) => c.day >= 3 && temFolga(c) && c.s.family.zelia.status !== 'morto',
    desc: '"Faz três meses que eu meço no olho." Com a fita, ela mede o açúcar de verdade. Reduz o risco da Dona Zélia.',
    effect: (e) => {
      e.set('fita_glicemia');
      e.s.family.zelia.risk = Math.max(0, e.s.family.zelia.risk - 1);
    },
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
    // id mantido ('desenho'): saves antigos guardam a contagem em `aula_desenho`
    id: 'desenho',
    label: 'Aula de desenho com a Dona Iolanda',
    price: 50,
    when: (c) => c.day >= 10 && present(c, 'davi'),
    desc: aulaDesc,
    effect: comprarAula,
  },
  {
    // ROTEIRO R5: o Seu Jacó revende mais caro. Com o dinheiro do envelope, a Zélia recusa (fica na gaveta).
    id: 'alianca_volta',
    label: 'Comprar a aliança de volta (Seu Jacó)',
    price: 260,
    once: true,
    when: (c) => c.day >= 11 && c.flag('alianca_vendida') && !c.flag('alianca_recomprada') && c.s.family.zelia.status !== 'morto',
    desc: (c) =>
      dinheiroVereador(c)
        ? 'SEU JACÓ: "Ouro a gente compra por duzentos e vende por duzentos e sessenta. É a vida." (Com o dinheiro do envelope? A sua mãe vai saber.)'
        : 'SEU JACÓ: "Ouro a gente compra por duzentos e vende por duzentos e sessenta. É a vida."',
    effect: (e) => {
      e.set('alianca_recomprada');
      e.set('alianca_recomprada_dia', e.day);
      if (dinheiroVereador(e)) {
        e.set('alianca_recusada');
        if (present(e, 'zelia')) e.toast('DONA ZÉLIA: "Com o dinheiro daquele homem? Guarda na gaveta. No meu dedo ela não entra."');
      } else {
        e.add('lacos', 1, 'a aliança voltou');
        if (present(e, 'zelia')) e.toast('A Dona Zélia não diz nada. Põe a aliança no dedo, gira duas vezes e vai lavar uma louça que já estava lavada.');
      }
    },
  },
  {
    id: 'pizza',
    label: 'Noite de pizza em família',
    price: 45,
    when: (c) => c.day >= 10,
    desc: 'Desgaste −10, Laços +1. (Ligação pra pizzaria do Seu Toninho: de dia padaria, de noite pizzaria.)',
    effect: (e) => {
      e.add('desgaste', -10, 'pizza');
      e.add('lacos', 1, 'pizza');
    },
  },
];

export function genericScene(c: Ctx): SceneDef {
  const luc = present(c, 'lucia');
  const dav = present(c, 'davi');
  return {
    id: 'generico_d' + c.day,
    bg: 'cozinha',
    nodes: {
      start: {
        lines: [
          ...jantarAbre(c),
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
