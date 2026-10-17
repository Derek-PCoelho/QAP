// =============================================================================
// Campanha 2 ("Simone") — dias 8 a 13.
// Fios: ↺ Wesley (pino, antibiótico, dengue, consórcio) · ↺ Henrique (19:32, a dobra,
// a sindicância) · 🌾 D9: a ligação da casa d{o} {dr} (a Simone decide a mesa) ·
// ↺ Cida (a queda real, o dia em que não liga) · 🌾 D11: Yuri, filho da Vera, a vila
// · 🌾 D12: a nota da TARM na ficha (decide o Henrique no mundo-sombra) · 🌱 o corte.
// =============================================================================
import type { SimoneDayDef } from '../../engine/content-api';
import type { Ctx, DLine, SceneNode, Choice } from '../../engine/types';
import { fx, is } from '../dsl';
import { contas } from './economy';
import { cena, noite, paLine, sombraSet, sombraUnset, custaTMA, inc, num, fimDe, daSimone, sFlag, mesa2SeAfastado } from './util';

// -----------------------------------------------------------------------------
// a consulta na UBS (folgas dos dias 8, 12, 14 e 18): receita nova → Farmácia Popular
// -----------------------------------------------------------------------------
export const escolhaUBS = (next = 'ubs'): Choice => ({
  label: 'Amanhã é folga: UBS cedo, renovar a receita da pressão.',
  next,
  when: is.not('receita_nova'),
  effect: (e) => {
    e.set('receita_nova');
    e.set('receita_dia', e.day);
    e.add('pressao', -1, 'consulta na UBS');
    e.add('desgaste', e.flag('graca_encaixe') ? 2 : 4, e.flag('graca_encaixe') ? 'manhã na UBS' : 'fila da UBS desde as cinco');
  },
});
export const noUBS: SceneNode = {
  lines: [
    { who: 'NARRADOR', t: 'A Graça encaixa a Simone entre um curativo e uma vacina, às 07:10.', when: is.flag('graca_encaixe') },
    { who: 'NARRADOR', t: 'Fila na porta da UBS desde as cinco da manhã. Ficha 31. Atendida às 11:40.', when: is.not('graca_encaixe') },
    { who: 'NARRADOR', t: 'O médico mede a pressão, olha o número e olha pra ela por cima dos óculos: "A senhora trabalha na Regulação e tá com essa pressão?"' },
    { who: 'NARRADOR', t: 'Receita nova, de um ano. Na Farmácia Popular, sai de graça. Ela guarda a receita dentro do crachá, atrás da foto.' }, // [validar] programa Farmácia Popular: anti-hipertensivo gratuito com receita válida
  ],
};

// -----------------------------------------------------------------------------
// DIA 8 — "A Apresentação" (segunda): hospital, a folga do Henrique, o 19:32
// -----------------------------------------------------------------------------
const D8: SimoneDayDef = {
  day: 8,
  // o Henrique tirou a folga do dia: volta (atrasado) para o noturno
  henrique: { away: true },
  morning: (c) => {
    const d = c.val<string>('sd7_desfecho');
    const cor = c.val<string>('sd7_cor');
    const lines: DLine[] = [
      { who: 'NARRADOR', t: '06:30. A Simone vem direto do Regional, de ônibus, com a roupa de ontem por baixo do uniforme.', when: () => c.val('sd7_noite') === 'cadeira' },
      { who: 'NARRADOR', t: '06:30. A Simone chega com os olhos inchados e o uniforme passado. Passou a noite inteira passando roupa pra não pensar.', when: () => c.val('sd7_noite') !== 'cadeira' },
    ];
    if (d === 'viatura') lines.push({ who: 'NARRADOR', t: 'O Wesley pôs o pino ontem à noite. Às seis, mandou um joinha com a mão do soro.' });
    else if (d === 'dispensado' && (cor === 'verde' || cor === 'azul')) lines.push({ who: 'NARRADOR', t: `Na ficha de ontem, a cor que ela mesma deu: ${cor}. Ninguém precisa dizer nada. Ela leu.` });
    else if (d === 'dispensado') lines.push({ who: 'NARRADOR', t: 'Na ficha de ontem: "orientado a procurar UPA". A Simone lê três vezes a cor que deu, a mesa que pegou e a palavra "orientado".' });
    else lines.push({ who: 'NARRADOR', t: 'O Wesley ficou no Regional. Antibiótico na veia até quarta, disse a enfermeira.' }); // [validar]
    lines.push(
      { who: 'NARRADOR', t: 'Na Mesa 2, ninguém. O Henrique tirou a folga do dia pra "resolver umas coisas". Volta às sete, pro noturno.' },
      { who: 'NARRADOR', t: 'No monitor da Simone, um post-it da Tati, com coração no i: "Hoje as chatas são minhas. — T."' },
    );
    return cena('s08_manha', 'central', { start: { lines } });
  },
  events: [
    {
      at: '11:30',
      onCall: 'd08_cida',
      scene: () =>
        cena('s08_cida', 'central', {
          start: {
            lines: [
              { who: 'CIDA', t: 'Xará! Escorreguei no banheiro, acredita? O punho ficou meio torto. (ela ri) Mas não é nada, não.' },
              { who: 'NARRADOR', t: 'A Simone olha o post-it do quadro: "Pressão, novela." Em três anos de ligação, a Dona Cida nunca ligou pra falar de dor.' },
            ],
            onEnter: fx.set('sd8_cida_notou'),
          },
        }),
    },
  ],
  evening: () =>
    cena('s08_henrique', 'central', {
      start: {
        lines: [
          { who: 'NARRADOR', t: '19:00. A cadeira do noturno vazia. O Henrique mandou mensagem às 17:40: "atraso uns minutinhos, segura aí".' },
          { who: 'NARRADOR', t: 'Hoje é a apresentação do filho d{o} {dr} Moura, às oito, na escola da Vila Esperança. A frota inteira sabe, porque a Simone contou no rádio.' },
          { who: 'NARRADOR', t: '19:32. A porta abre. Cabelo molhado, bala de menta na boca. "Pneu furado na Beira-Rio." O cheiro de menta é forte demais. Tem outra coisa por baixo.' },
          { who: 'NARRADOR', t: 'Ele pede baixinho pr{o} {dr} assinar a passagem às sete em ponto. A Simone veste o casaco devagar.' },
        ],
        choices: [
          { label: 'Escrever no livro da TARM: "19:32 — Dr. Henrique assume."', next: 'livro', effect: fx.all(fx.set('sd8', 'registrou'), sombraSet('d8_henrique_registrado')) },
          { label: '"Eu não vi nada. Eu nunca vejo nada."', next: 'naoviu', effect: fx.set('sd8', 'nao_viu') },
          { label: 'Colar um post-it de letra de forma no teclado da Mesa 2, antes de sair.', next: 'postit', effect: fx.all(fx.set('sd8', 'postit'), inc('postit_h'), fx.set('postit_h2')) },
        ],
      },
      livro: {
        lines: [
          { who: 'NARRADOR', t: 'A letra redonda de sempre, no livro de ocorrências da TARM. Ninguém lê esse livro. Até alguém precisar ler.' },
          { who: 'SIMONE', t: '(segurando a porta) Vai, {dr}. Corre. Boa apresentação pro menino.' },
        ],
      },
      naoviu: {
        lines: [
          { who: 'NARRADOR', t: 'Ela sai sem olhar pra trás. No ponto de ônibus, abre a bolsa, pega um bloco de post-it e não escreve nada.' },
        ],
      },
      postit: {
        lines: [
          { who: 'NARRADOR', t: '"TERÇA E QUINTA, 20H. SALÃO DA IGREJA BATISTA, RUA BAHIA, 300. NINGUÉM PERGUNTA O NOME."' },
          { who: 'NARRADOR', t: 'Ela cola no teclado da Mesa 2, onde ele vai sentar amanhã cedo, e sai antes que alguém veja a letra.' },
        ],
      },
    }),
  bills: contas({
    id: 'remedios_wesley',
    label: 'Remédios da alta do Wesley',
    amount: 62,
    desc: 'O que a farmácia do hospital não tinha: antibiótico e analgésico pra casa.', // [validar]
    onPay: fx.set('antibiotico_ok'),
    onSkip: fx.all(fx.set('sem_antibiotico'), fx.add('wesley', -1, 'sem o remédio')),
  }),
  night: (c) =>
    noite(c, 's08_noite', 'hospital', {
      start: {
        onEnter: fx.when(is.flag('conheceu_edinho'), fx.money(40, 'vaquinha da feira')),
        lines: [
          { who: 'NARRADOR', t: 'O Wesley vai ficar no Regional até quarta, pra terminar o antibiótico na veia. Na alta, uma receita: o que o hospital não tem, a família compra.' }, // [validar]
          { who: 'NARRADOR', t: 'O Seu Edinho passou no hospital com um envelope: a vaquinha da feira. Quarenta reais em nota de dois e de cinco, e um saco de tomate.', when: is.flag('conheceu_edinho') },
          { who: 'NARRADOR', t: 'Amanhã e depois são folga.' },
          paLine(),
        ],
        choices: [
          escolhaUBS(),
          { label: 'Dois dias inteiros no hospital com o Wesley.', next: 'hospital', effect: fx.all(fx.add('wesley', 2, 'dois dias com ele'), fx.add('desgaste', -2, 'baralho')) },
          { label: 'Dormir até tarde. Pela primeira vez em um mês.', next: 'dormir', effect: fx.add('desgaste', -8, 'dormiu até tarde') },
        ],
      },
      ubs: {
        ...noUBS,
        lines: [...noUBS.lines, { who: 'NARRADOR', t: 'Da UBS, ela vai direto pro Regional. O Wesley pergunta o que ela tem na mão. "Receita. Minha." Ele não acredita.' }],
      },
      hospital: { lines: [{ who: 'NARRADOR', t: 'Ela leva baralho. Ele ganha todas as partidas de buraco e conta pra enfermeira que a mãe deixa ganhar. Ela não deixa.' }] },
      dormir: { lines: [{ who: 'NARRADOR', t: 'Onze horas de sono. Acorda com a Vera batendo no vidro com um prato de bolo de laranja.' }] },
    }),
};

// -----------------------------------------------------------------------------
// DIA 9 — "Linha Direta" (quinta): RES. RUA DAS ACÁCIAS, 40
// -----------------------------------------------------------------------------
const D9: SimoneDayDef = {
  day: 9,
  morning: (c) =>
    cena('s09_manha', 'central', {
      start: {
        lines: [
          { who: 'NARRADOR', t: '06:55. Calor seco. No jornal da padaria: "Postos sem remédio de pressão: falta deve durar até a semana que vem."' },
          { who: 'NARRADOR', t: 'A receita nova está na bolsa. Farmácia Popular não é posto. Ela respira.', when: is.flag('receita_nova') },
          { who: 'NARRADOR', t: 'Ela não tem receita nova. Nem posto, nem Farmácia Popular. Dobra o jornal na página e guarda.', when: is.not('receita_nova') },
          { who: 'NARRADOR', t: '07:05. O Henrique passa o plantão pr{o} {dr} dizendo que vai dormir até as cinco. Às 07:20 está sentado na Mesa 2, de óculos escuros, com um café duplo.' },
          { who: 'NARRADOR', t: 'No teclado da Mesa 2 não tem mais post-it. Ele guardou. Ou jogou fora. A Simone não pergunta.', when: () => c.flag('postit_h2') },
          { who: 'NARRADOR', t: 'O Wesley teve alta ontem. Em casa, de muleta, com a perna esticada numa cadeira, manda áudio de dez em dez minutos: "Tédio, mãe."' },
        ],
      },
    }),
  events: [
    {
      at: '08:20',
      onCall: 'd09_moto',
      scene: () =>
        cena('s09_everton', 'central', {
          start: {
            lines: [
              { who: 'NARRADOR', t: 'Av. Norte, em frente ao Posto Avenida. Motoboy no chão, fazendo um barulho de ronco. Capacete. Sangue no ouvido.' },
              { who: 'NARRADOR', t: 'Everton Lima, vinte e dois. O que ensinou o Wesley a amarrar a mochila térmica na garupa sem cair no primeiro quebra-molas.' },
              { who: 'NARRADOR', t: 'A Simone escreve antes de deixar o pensamento terminar.' },
            ],
            onEnter: fx.set('sd9_everton'),
          },
        }),
    },
    {
      at: '14:00',
      onCall: 'd09_casa',
      scene: () =>
        cena('s09_casa', 'central', {
          start: {
            lines: [
              { who: 'NARRADOR', t: '14:00. Duas linhas acendem juntas.' },
              { who: 'NARRADOR', t: 'A primeira: RES. RUA DAS ACÁCIAS, 40. Vila Esperança. A Simone conhece o endereço: é o da ficha de cadastro da Mesa 1. É a casa d{o} {dr}.' },
              { who: 'NARRADOR', t: 'Do outro lado, {c:a esposa|o marido}, {oconj}: "É o Liam... a crise... a bombinha..." Atrás {c:dela|dele}, uma senhora: "Devagar, meu anjo, o ar entra pelo nariz."' },
              { who: 'NARRADOR', t: 'Na outra linha, piscando: Jardim Primavera. Um homem gritando sobre uma abelha.' },
              { who: 'NARRADOR', t: 'Página 9-C do manual, que a Simone leu antes de todo mundo: o regulador não deve regular familiar.' },
            ],
            choices: [
              { label: 'Passar pra Mesa 1. Se fosse o Wesley, você ia querer saber.', next: 'moura', effect: fx.set('sd9_quer', 'moura') },
              { label: 'Passar pro Henrique. Página 9-C.', next: 'henrique', effect: fx.set('sd9_quer', 'henrique') },
              { label: 'Ficar um minuto na linha com {oconj} antes de decidir.', next: 'segurar', effect: fx.all(custaTMA('d09_casa', 6), fx.set('sd9_segurou')) },
            ],
          },
          segurar: {
            lines: [
              { who: 'SIMONE', t: '{conj}, é a Simone, da central. Senta ele inclinado pra frente. Afrouxa a roupa. Não deita ele. Eu tô passando agora.' }, // [validar]
              { who: 'NARRADOR', t: 'Do outro lado, {oconj} repete cada palavra em voz alta. A senhora atrás {c:dela|dele} também.' },
            ],
            choices: [
              { label: 'Passar pra Mesa 1.', next: 'moura', effect: fx.set('sd9_quer', 'moura') },
              { label: 'Passar pro Henrique.', next: 'henrique', effect: fx.set('sd9_quer', 'henrique') },
            ],
          },
          moura: {
            lines: [
              { who: 'NARRADOR', t: 'Ela escreve o post-it com a letra mais firme que tem: "{Dr}. É da sua casa."' },
              { who: 'NARRADOR', t: 'E guarda a decisão onde ninguém vai procurar.' },
            ],
          },
          henrique: {
            lines: [
              { who: 'NARRADOR', t: 'Ela olha pra Mesa 2. O Henrique, de óculos escuros, já com a mão no fone.' },
              { who: 'NARRADOR', t: 'São duas da tarde. Até as três, o Henrique ainda é o Henrique.' },
            ],
          },
        }),
    },
    {
      at: '14:00',
      onCall: 'd09_marcia',
      scene: () =>
        cena('s09_marcia', 'central', {
          start: {
            lines: [
              { who: 'NARRADOR', t: 'Rua Jacarandá, 215. "Minha mulher tá roxa! Foi uma abelha! Ela é alérgica!" A voz do marido falha no meio de cada frase.' },
              { who: 'NARRADOR', t: 'No painel da OS, bem na frente da cadeira da Simone: uma USA livre. Uma.' },
            ],
          },
        }),
    },
  ],
  evening: (c, w) => {
    const casa = w.call('d09_casa');
    const marcia = w.call('d09_marcia');
    const casaUSA = casa?.decision?.resource === 'USA';
    const marciaUSA = marcia?.decision?.resource === 'USA';
    const mFim = fimDe(marcia);
    const cFim = fimDe(casa);
    const mesa = casa?.tarm && !casa.tarm.cover ? casa.tarm.to : undefined;
    const lines: DLine[] = [{ who: 'NARRADOR', t: '19:00. O que aconteceu das duas às cinco cabe numa linha do relatório da OS: "Concorrência de recursos."' }];
    if (marciaUSA) lines.push({ who: 'NARRADOR', t: 'A única USA livre foi pra Rua Jacarandá.' });
    else if (casaUSA) lines.push({ who: 'NARRADOR', t: 'A única USA livre foi pra Rua das Acácias, 40.' });
    else lines.push({ who: 'NARRADOR', t: 'A única USA livre não foi pra nenhuma das duas.' });
    if (mFim === 'morto') lines.push({ who: 'NARRADOR', t: 'Às 14:31, o Bené: "Central... óbito constatado." O marido perguntou o nome do regulador. O Bené não falou.' });
    else if (mFim === 'vivo') lines.push({ who: 'NARRADOR', t: marciaUSA ? 'O Bené, no rádio: "Márcia estabilizada. A caneta vencida segurou ela."' : 'A Márcia chegou ao Regional de básica, com a caneta de adrenalina vencida no bolso do marido. Segurou.' });
    if (cFim === 'vivo' && casa?.decision?.unit === 'USB01') lines.push({ who: 'NARRADOR', t: 'A Joana, da USB 01, chegou à Rua das Acácias em três minutos: "Seu menino tá bem. Tá pedindo pra ver a sirene. Liguei ela um pouquinho."' });
    else if (cFim === 'vivo') lines.push({ who: 'NARRADOR', t: 'Na Rua das Acácias, o menino ficou bem. A senhora que falava "devagar, meu anjo" mandou um áudio agradecendo "a moça do telefone".' });
    else if (cFim === 'morto') lines.push({ who: 'NARRADOR', t: 'Na Rua das Acácias, ninguém atende mais o telefone.' });
    const pre: DLine[] =
      mesa === 'henrique'
        ? [
            { who: 'NARRADOR', t: 'O Henrique regulou a casa d{o} {dr} em quatro minutos, sem tirar os óculos escuros.' },
            { who: 'NARRADOR', t: '19:05. {O} {dr} Moura para na mesa da TARM. "Você passou a minha casa pro Henrique."' },
          ]
        : mesa === 'moura'
          ? [
              { who: 'NARRADOR', t: '{O} {dr} regulou a própria casa. A Simone viu as mãos {dele} no teclado: firmes até o carimbo. Depois, não.' },
              { who: 'NARRADOR', t: '19:05. {O} {dr} Moura passa pela mesa da TARM sem parar. Volta. Para.' },
            ]
          : [{ who: 'NARRADOR', t: '19:05. {O} {dr} Moura passa pela mesa da TARM e para, sem saber o que dizer.' }];
    const choices: Choice[] =
      mesa === 'henrique'
        ? [
            { label: '"Página 9-C, {dr}. Eu te poupei de escolher."', next: 'fim', effect: fx.set('sd9_fala', 'poupou') },
            { label: '"Passei pra quem não ia tremer. Às duas, ele ainda não treme."', next: 'fim', effect: fx.set('sd9_fala', 'tremer') },
            { label: '(Não responder.)', next: 'fim', effect: fx.set('sd9_fala', 'nada') },
          ]
        : [
            { label: '"Eu vi o número, {dr}. Não vou falar nada."', next: 'fim', effect: fx.set('sd9_fala', 'vi') },
            { label: '"Eu teria feito igual. Qualquer que fosse."', next: 'fim', effect: fx.set('sd9_fala', 'igual') },
            { label: '(Só balançar a cabeça.)', next: 'fim', effect: fx.set('sd9_fala', 'nada') },
          ];
    return cena('s09_fim', 'central', {
      start: {
        lines: [...lines, ...pre],
        onEnter: fx.all(fx.set('sd9_mesa', mesa ?? ''), fx.set('sd9_marcia', mFim), fx.set('sd9_casa_usa', casaUSA), fx.set('sd9_marcia_usa', marciaUSA)),
        choices,
      },
      fim: {
        lines: [
          { who: 'NARRADOR', t: '{O} {dr} fica um tempo parad{o} ali. Depois pega a mochila e vai embora sem bater o ponto. A Simone bate por {ele}.' },
        ],
      },
    });
  },
  bills: contas({ id: 'curativo', label: 'Gaze, soro e esparadrapo', amount: 24, desc: 'Pro curativo da perna do Wesley, duas vezes por dia.', onSkip: fx.all(fx.set('curativo_improvisado'), fx.add('wesley', -1, 'curativo de pano')) }), // [validar]
  night: (c) =>
    noite(c, 's09_noite', 'sala', {
      start: {
        lines: [
          { who: 'NARRADOR', t: 'O Wesley está no sofá, a perna esticada em cima de duas almofadas e um pacote de arroz de cinco quilos.' },
          { who: 'WESLEY', t: 'Como foi, mãe? Você tá com a cara de quando eu era pequeno e quebrava alguma coisa.' },
          paLine(),
        ],
        choices: [
          { label: 'Contar, sem nome: "A ligação era da casa {m:de um médico da central. O filho dele|de uma médica da central. O filho dela}."', next: 'contou', effect: fx.add('wesley', 1, 'ela contou') },
          { label: 'Fazer o curativo da perna dele e ensinar ele a fazer sozinho.', next: 'curativo', effect: fx.all(fx.set('curativo_ensinou'), fx.add('wesley', 1, 'aprendeu o curativo'), fx.add('desgaste', -1, 'mãos ocupadas')) },
          { label: 'Não falar de trabalho. Ver novela com ele.', next: 'novela', effect: fx.add('desgaste', -4, 'novela') },
        ],
      },
      contou: {
        lines: [
          { who: 'WESLEY', t: 'E você passou pra quem?' },
          { who: 'SIMONE', t: '{m:Pro pai|Pra mãe}.', when: (cc) => cc.val('sd9_mesa') === 'moura' },
          { who: 'SIMONE', t: 'Pro outro médico.', when: (cc) => cc.val('sd9_mesa') === 'henrique' },
          { who: 'SIMONE', t: 'Pra quem tava livre.', when: (cc) => !['moura', 'henrique'].includes(String(cc.val('sd9_mesa'))) },
          { who: 'WESLEY', t: 'E se fosse eu?' },
          { who: 'SIMONE', t: 'Eu ia querer que me passassem.', when: (cc) => cc.val('sd9_mesa') !== 'henrique' },
          { who: 'SIMONE', t: 'Eu ia querer que não me passassem. E ia odiar quem fizesse isso.', when: (cc) => cc.val('sd9_mesa') === 'henrique' },
        ],
      },
      curativo: {
        lines: [
          { who: 'NARRADOR', t: 'Mão lavada, luva, soro, gaze, de dentro pra fora. Ele faz careta e presta atenção. Na segunda vez, faz sozinho. Torto, mas sozinho.' }, // [validar]
          { who: 'WESLEY', t: 'Você faz isso no telefone com os outros, né? Ensina.' },
          { who: 'SIMONE', t: 'Eu ensino a esperar. Quem ensina o resto é {o} {dr}.' },
        ],
      },
      novela: { lines: [{ who: 'NARRADOR', t: 'Na novela das seis, que agora passa às nove de reprise, a Marta vai embora pela porteira. O Wesley dorme antes do fim.' }] },
    }),
};

// -----------------------------------------------------------------------------
// DIA 10 — "Ninguém é Bobo" (sexta): o enxaguante, a parcela, a febre
// -----------------------------------------------------------------------------
const D10: SimoneDayDef = {
  day: 10,
  morning: (c) =>
    cena('s10_manha', 'central', {
      start: {
        lines: [
          { who: 'NARRADOR', t: '06:50. Recado do Peixoto colado na porta, por escrito: "Endereço duvidoso: ligar de volta antes de despachar."' },
          { who: 'NARRADOR', t: 'Na Mesa 2, o Henrique bocheja enxaguante bucal e cospe na lixeira. "Tem álcool, Simone. Lê o rótulo." Ninguém tinha perguntado.' },
          { who: 'NARRADOR', t: 'Ele mexe em alguma coisa no bolso do jaleco. Papel dobrado. Não tira.', when: () => num(c, 'postit_h') >= 1 },
          { who: 'SIMONE', t: '(pra Tati) Hoje eu vou errar nota. Esses trotes novos tão me pegando também. Pergunta duas vezes antes de acreditar no meu post-it.' },
        ],
      },
    }),
  bills: contas({
    id: 'consorcio',
    label: 'Parcela do consórcio da moto',
    amount: 165,
    desc: 'Vence amanhã. A moto está parada na vila, debaixo da lona.',
    onPay: fx.unset('parcela_atrasada'),
    onSkip: fx.all(fx.set('parcela_atrasada'), fx.add('wesley', -1, 'a parcela')),
  }),
  night: (c) =>
    noite(c, 's10_noite', 'quarto', {
      start: {
        lines: [
          { who: 'NARRADOR', t: 'O boleto do consórcio chegou no celular do Wesley: cento e sessenta e cinco, vence amanhã.' },
          { who: 'WESLEY', t: 'Mãe, eu tô meio quente. Deve ser da perna.' },
          { who: 'NARRADOR', t: 'O termômetro que era da avó marca trinta e oito e meio. Dor atrás dos olhos, dor no corpo inteiro. A perna, quieta.' }, // [validar]
          { who: 'NARRADOR', t: 'Na vila, três casas com gente de febre. O fumacê passou de novo à tarde.' },
          paLine(),
        ],
        choices: [
          { label: 'Soro, dipirona e água. Nada de anti-inflamatório. E vigiar.', next: 'vigiar', effect: fx.all(fx.set('dengue_cuidou'), fx.add('wesley', 1, 'cuidou'), fx.add('desgaste', 3, 'acordou de hora em hora')) }, // [validar]
          { label: 'Levar na UPA agora, de táxi.', next: 'upa', needMoney: 30, effect: fx.all(fx.money(-30, 'táxi pra UPA'), fx.add('wesley', 1, 'levou na UPA'), fx.add('desgaste', 5, 'madrugada na UPA')) },
          { label: 'Dipirona e cama. Ela também precisa dormir.', next: 'cama', effect: fx.add('desgaste', -4, 'dormiu') },
        ],
      },
      vigiar: {
        lines: [
          { who: 'NARRADOR', t: 'Ela escreve num papel e prende na geladeira: DOR NA BARRIGA, VÔMITO, SANGRAMENTO, TONTURA = ME LIGA.' }, // [validar] sinais de alarme da dengue
          { who: 'NARRADOR', t: 'As mesmas perguntas que faz o dia inteiro pra quem liga. Pela primeira vez, em letra de forma pra si mesma.' },
        ],
      },
      upa: {
        lines: [
          { who: 'NARRADOR', t: 'UPA Norte com quatro horas de espera. Às duas da manhã, a médica diz o que ela já sabia: dengue, sem sinal de alarme, soro e repouso.' }, // [validar]
          { who: 'NARRADOR', t: 'Voltam de táxi de novo. O Wesley dorme no ombro dela, de muleta no colo.' },
        ],
      },
      cama: { lines: [{ who: 'NARRADOR', t: 'Ela dorme de roupa, com o celular na mão e o volume no máximo.' }] },
    }),
};

// -----------------------------------------------------------------------------
// DIA 11 — "Febre" (sábado): a Dona Cida não liga; o Yuri, da casa 4
// -----------------------------------------------------------------------------
type CasoYuri = 'vivo' | 'noturno' | 'henrique' | 'moura' | 'sem';
const casoYuri = (c: Ctx): CasoYuri => (c.val<CasoYuri>('sd11_yuri') ?? 'sem') as CasoYuri;
export const yuriMorreu = (c: Ctx) => ['noturno', 'henrique', 'moura'].includes(casoYuri(c)) || sFlag(c, 'd11_dengue_obito') || sFlag(c, 'noturno_obito_d11_dengue_grave');
/** a sindicância do D12 é a do Yuri (o Henrique conduziu e o menino morreu) */
export const sindicanciaYuri = (c: Ctx) => ['noturno', 'henrique'].includes(casoYuri(c)) || sFlag(c, 'noturno_obito_d11_dengue_grave');

const D11: SimoneDayDef = {
  day: 11,
  morning: () =>
    cena('s11_manha', 'calcada', {
      start: {
        lines: [
          { who: 'NARRADOR', t: '06:20. Antes de sair, a Simone bate na casa 4. A Dona Vera abre de camisola.' },
          { who: 'VIZINHA', t: 'Pode ir, Simone. Eu dou uma olhada no Wesley de duas em duas horas.' },
          { who: 'VIZINHA', t: 'O Yuri também tá de dengue. Quinto dia. A febre passou ontem, graças a Deus. Hoje ele só tá molinho.' },
        ],
        choices: [
          {
            label: '"Vera, quando a febre passa é que tem que olhar. Sangrou, tontura, dor na barriga: liga na hora."',
            next: 'avisou',
            effect: fx.set('sd11_avisou_vera'),
          }, // [validar] fase crítica da dengue após a defervescência
          { label: '"Obrigada, Vera. Qualquer coisa, me liga."', next: 'saiu' },
        ],
      },
      avisou: {
        lines: [
          { who: 'VIZINHA', t: 'Credo, Simone. Você fala igual o rádio.' },
          { who: 'NARRADOR', t: 'Mas ela repete baixinho, contando nos dedos: sangrou, tontura, barriga. A Simone vê pela janela do ônibus.' },
        ],
      },
      saiu: { lines: [{ who: 'NARRADOR', t: 'Ônibus lotado de gente com febre. Metade vai pra UPA Norte. A outra metade vai ligar pra central.' }] },
    }),
  events: [
    {
      at: '09:20',
      until: '10:30',
      scene: () =>
        cena('s11_cida', 'central', {
          start: {
            lines: [{ who: 'NARRADOR', t: '09:20. A Dona Cida não ligou. Em três anos, é a primeira vez.' }],
            choices: [
              { label: 'Ligar pra ela do ramal da TARM.', next: 'ligou', effect: fx.set('sd11_ligou_cida') },
              { label: 'Seguir a fila. Ela deve ter saído.', next: 'fila' },
            ],
          },
          ligou: {
            lines: [
              { who: 'NARRADOR', t: 'Chama, chama. Ninguém atende. "Deve ter saído", diz a Tati.' },
              { who: 'NARRADOR', t: 'A Simone escreve no canto do monitor, a lápis: CIDA?' },
            ],
          },
          fila: { lines: [{ who: 'NARRADOR', t: 'Ela sai, a Dona Cida. Vai na igreja, na comadre, na farmácia do Seu Toninho medir a pressão. Sai, sim.' }] },
        }),
    },
    {
      at: '16:10',
      until: '17:30',
      scene: () =>
        cena('s11_wesley', 'central', {
          start: {
            lines: [{ who: 'NARRADOR', t: '16:10. Mensagem do Wesley: "mãe tô vomitando". Uma vez? Duas? Desde quando?' }],
            choices: [
              { label: 'Ligar pra ele e fazer as perguntas.', next: 'perguntas', effect: fx.all(fx.set('sd11_perguntou'), fx.add('wesley', 1, 'as perguntas')) },
              { label: 'Pedir pra Vera dar uma olhada nele.', next: 'vera', effect: fx.set('sd11_vera_olhou') },
              { label: 'Responder "bebe soro" e voltar pro fone. Tem trinta febres na fila.', next: 'fone', effect: fx.all(fx.add('desgaste', 2, 'culpa'), fx.add('pressao', 1, 'preocupação')) },
            ],
          },
          perguntas: {
            lines: [
              { who: 'SIMONE', t: 'Quantas vezes? Dor na barriga? Sangrou nariz, gengiva? Tontura quando levanta?' },
              { who: 'WESLEY', t: 'Uma vez só, mãe. Foi o miojo. Barriga não dói. Sangue não. Tô com sede.' },
              { who: 'SIMONE', t: 'Soro. Um copo agora e um a cada hora. Qualquer coisa daquele papel da geladeira, me liga.' }, // [validar]
            ],
          },
          vera: {
            lines: [
              { who: 'NARRADOR', t: 'A Vera responde em dois minutos: "Tá bem, comendo bolacha, reclamando. O Yuri que tá molinho hoje. Deve ser a dengue mesmo."' },
            ],
          },
          fone: { lines: [{ who: 'NARRADOR', t: 'Ela vira o celular de tela pra baixo. Desvira. Vira de novo.' }] },
        }),
    },
    {
      at: '18:20',
      until: '18:59',
      when: (c, w) => w.call('d11_dengue_grave')?.status === 'fila',
      scene: () =>
        cena('s11_visor', 'central', {
          start: {
            lines: [
              { who: 'NARRADOR', t: '18:20. Uma linha acende na fila. No visor, um número que a Simone tem salvo no celular: (17) 99503-1820. Dona Vera, casa 4.' },
            ],
          },
        }),
    },
    {
      at: '18:20',
      onCall: 'd11_dengue_grave',
      scene: (c) =>
        cena('s11_yuri', 'central', {
          start: {
            lines: [
              { who: 'NARRADOR', t: 'A voz da Vera: "Moço... o Yuri... a febre passou ontem, eu achei que ele tava melhorando. Sangrou o nariz e a gengiva. Levantou e caiu. Tá gelado."' },
              { who: 'NARRADOR', t: 'Febre que some. Sangramento. Tontura. Pele fria. A página 11 do manual inteira, na voz da vizinha.' }, // [validar]
              { who: 'NARRADOR', t: 'Às sete, o que estiver na fila vai pro noturno.' },
              { who: 'NARRADOR', t: 'Ela avisou a Vera de manhã. A Vera ligou na hora.', when: () => c.flag('sd11_avisou_vera') },
            ],
            choices: [
              { label: '"Vera, é a Simone. Eu tô aqui. A ambulância vai."', next: 'falou', effect: fx.all(custaTMA('d11_dengue_grave', 4), fx.set('sd11_falou_vera')) },
              { label: 'Não dizer que é ela. Perguntar, escrever, passar. Rápido.', next: 'rapida', effect: fx.set('sd11_rapida') },
            ],
          },
          falou: {
            lines: [
              { who: 'NARRADOR', t: '"Simone? ...Ai, Simone. Graças a Deus." Do fundo, o Yuri: "Mãe... tô com frio."' },
              { who: 'NARRADOR', t: 'Ela escreve: "Mãe, filho de 15 com dengue. Sangrou o nariz e a gengiva. Tá tonto."' },
            ],
          },
          rapida: {
            lines: [
              { who: 'NARRADOR', t: 'Ela escreve sem nome: "Mãe, filho de 15 com dengue. Sangrou o nariz e a gengiva. Tá tonto."' },
              { who: 'NARRADOR', t: 'A mesma nota que vai estar na ficha, depois, se alguém precisar ler.' },
            ],
          },
        }),
    },
  ],
  evening: (c, w) => {
    const r = w.call('d11_dengue_grave');
    let caso: CasoYuri = 'sem';
    if (r) {
      if (r.status === 'noturno' || !daSimone(r)) caso = 'noturno';
      else if (fimDe(r) === 'morto') caso = r.tarm?.to === 'henrique' ? 'henrique' : 'moura';
      else caso = 'vivo';
    }
    const lines: DLine[] = [];
    if (caso === 'vivo')
      lines.push(
        { who: 'NARRADOR', t: '18:58, o rádio: "Adolescente em choque, dengue grave. Dois acessos, soro aberto, a pressão tá voltando. A mãe tá rezando alto aqui atrás."' },
        { who: 'NARRADOR', t: 'A Simone conhece a reza. É a da Vera.' },
      );
    else if (caso === 'noturno')
      lines.push(
        { who: 'NARRADOR', t: '19:00. A linha da Vera ainda estava esperando quando o turno virou. O que fica na fila às sete vai pro noturno.' },
        { who: 'NARRADOR', t: 'A Simone vê o cartão mudar de cor na tela: NOTURNO. Dr. Henrique Lacerda.' },
      );
    else if (caso === 'henrique')
      lines.push(
        { who: 'NARRADOR', t: 'A Mesa 2, às 18:40: "Yuri Santana: orientação. Hidratação oral e UBS."' },
        { who: 'NARRADOR', t: 'A Simone lê duas vezes. O Henrique já está de casaco, com uma bala de menta na boca.' },
      );
    else if (caso === 'moura')
      lines.push(
        { who: 'NARRADOR', t: 'A Mesa 1 mandou o que mandou, com a cor que a Simone deu. O rádio do Yuri chegou tarde, com uma palavra que ela não quer ouvir de novo.' },
      );
    else lines.push({ who: 'NARRADOR', t: '19:00. Sábado de dengue. Trinta febres, três alarmes. A Simone desliga o fone e fica um tempo com ele no colo.' });
    return cena('s11_fim', 'central', {
      start: { lines, onEnter: fx.all(fx.set('sd11_yuri', caso), fx.add('desgaste', caso === 'vivo' ? 1 : 4, 'o Yuri')) },
    });
  },
  bills: contas({ id: 'dengue_wesley', label: 'Dengue do Wesley: soro, dipirona, repelente', amount: 32, desc: 'Nada de anti-inflamatório, disse a moça da farmácia.', onSkip: fx.all(fx.add('wesley', -1, 'sem soro'), fx.add('desgaste', 2, 'soro caseiro de madrugada')) }), // [validar]
  night: (c) => {
    const morreu = yuriMorreu(c);
    return noite(c, 's11_noite', 'calcada', {
      start: {
        lines: [
          { who: 'NARRADOR', t: 'Meia-noite. A Vera manda mensagem do Regional: "UTI, mas falando. Obrigada, Simone. Eu sei que foi você."', when: () => !morreu },
          { who: 'NARRADOR', t: '04:10. A luz da casa 4 acende. Depois a da casa 3, a da 5, a da Simone. A vila inteira acende, uma luz de cada vez.', when: () => morreu },
          { who: 'NARRADOR', t: 'Ninguém grita. A Vera só pede, na porta, pra alguém ligar pro irmão dela.', when: () => morreu },
          { who: 'NARRADOR', t: 'No quarto, o Wesley, segundo dia de dengue, pergunta o que aconteceu. A Simone não sabe por onde começar.' },
          paLine(),
        ],
        choices: [
          { label: 'Atravessar a vila e sentar com a Vera.', when: () => morreu, next: 'vera', effect: fx.all(fx.set('sd11_vera'), fx.add('desgaste', 3, 'a casa 4')) },
          { label: 'Levar roupa limpa pra Vera no Regional.', when: () => !morreu, next: 'roupa', effect: fx.all(fx.set('sd11_vera'), fx.add('desgaste', 3, 'ônibus de madrugada')) },
          { label: 'Ficar com o Wesley e medir a febre de hora em hora.', next: 'wesley', effect: fx.all(fx.add('wesley', 1, 'ficou'), fx.add('pressao', morreu ? 1 : 0, 'a noite')) },
          { label: morreu ? '(Não conseguir levantar da cama.)' : 'Dormir. Amanhã tem plantão.', next: 'cama', effect: fx.all(fx.add('desgaste', morreu ? -2 : -5, 'cama'), fx.add('pressao', morreu ? 1 : 0, 'a noite')) },
        ],
      },
      vera: {
        lines: [
          { who: 'NARRADOR', t: 'Ela senta no chão da casa 4, do lado da Vera, e segura a mão dela. As duas não falam nada até amanhecer.' },
          { who: 'NARRADOR', t: 'Às seis, a Vera diz uma frase só: "Você atendeu, né? Eu reconheci a sua voz."' },
        ],
      },
      roupa: { lines: [{ who: 'NARRADOR', t: 'Corredor da UTI, duas da manhã. A Vera abraça a sacola de roupa como se fosse o filho.' }] },
      wesley: {
        lines: [
          { who: 'NARRADOR', t: 'Trinta e sete e oito. Trinta e oito. Trinta e sete e meio. Ela anota cada hora num post-it e cola na cabeceira.' },
          { who: 'WESLEY', t: '(meio dormindo) Mãe. Para de me triar.' },
        ],
      },
      cama: { lines: [{ who: 'NARRADOR', t: 'O teto da casa 2 tem uma mancha de infiltração com formato de mapa. Ela conhece cada bairro.' }] },
    });
  },
};

// -----------------------------------------------------------------------------
// DIA 12 — "Do Outro Lado da Linha" (domingo): o comunicado; a sindicância
// -----------------------------------------------------------------------------
const D12: SimoneDayDef = {
  day: 12,
  henrique: { acc: 0.6 },
  morning: (c) => {
    const morreu = yuriMorreu(c);
    return cena('s12_manha', 'central', {
      start: {
        lines: [
          { who: 'NARRADOR', t: '06:40. Domingo nublado. O velório do Yuri é às dez, na capela do Municipal. A Simone tem plantão até as sete.', when: () => morreu },
          { who: 'NARRADOR', t: '06:40. Domingo nublado. Na vila, a Vera dormiu no Regional. O Yuri saiu da UTI de madrugada, pedindo pastel.', when: () => !morreu },
          { who: 'BENE', t: '(no balcão da padaria) Domingo é dia de gente sozinha, Simoninha. Fica de olho.' },
          { who: 'NARRADOR', t: 'Na Mesa 2, o Henrique está de cabeça baixa. Às 06:20, alguém da OS ligou pra ele. Ele sabe o que é.' },
          { who: 'NARRADOR', t: 'A Simone também sabe. Foi a letra dela que ficou na ficha.', when: () => sindicanciaYuri(c) },
        ],
      },
    });
  },
  events: [
    {
      at: '09:10',
      onCall: 'd12_crise',
      scene: () =>
        cena('s12_caio', 'central', {
          start: {
            lines: [
              { who: 'NARRADOR', t: 'Voz baixa, de rapaz: "Eu não tô bem." Entre uma frase e outra, um silêncio que a Simone reconhece.' },
              { who: 'NARRADOR', t: 'Na borda do monitor, desde 2019, um post-it desbotado com a letra redonda dela: "CVV 188 — 24h."' },
              { who: 'NARRADOR', t: 'Ela escreve pra Mesa 1: "Rapaz, voz baixa. Diz que não tá bem. Não deixa ele sem resposta."' },
            ],
          },
        }),
    },
    {
      at: '12:15',
      until: '13:30',
      scene: () =>
        cena('s12_corte', 'central', {
          start: {
            lines: [
              { who: 'NARRADOR', t: 'E-mail da OS pra todas as TARMs, com cópia pra coordenação: "COMUNICADO — REESTRUTURAÇÃO. A partir do dia 31, uma profissional de pré-triagem por turno. Critérios: TMA, auditoria de cor e custo."' },
              { who: 'NARRADOR', t: 'No dia, são duas: a Simone e a Tati. A Simone é a mais velha. E a mais cara.' },
              { who: 'NARRADOR', t: 'A Tati lê, tira o fone e olha pra ela. Nenhuma das duas fala nada.' },
            ],
            choices: [
              { label: 'Contar pr{o} {dr} Moura, em voz alta, antes de desistir.', next: 'contou', effect: fx.set('sd12_contou') },
              { label: 'Engolir e atender a próxima.', next: 'engoliu', effect: fx.add('pressao', 1, 'o comunicado') },
              { label: 'Ir ao banheiro. Cinco minutos.', next: 'banheiro', effect: fx.add('desgaste', -2, 'água no rosto') },
            ],
          },
          contou: {
            lines: [
              { who: 'SIMONE', t: '{Dr}... deixa eu falar uma coisa antes que eu desista. No fim do mês cortam uma TARM por turno. No dia, somos duas. Eu sou a mais velha e a mais cara.' },
              { who: 'NARRADOR', t: '{O} {dr} demora pra responder. Quando responde, ela já voltou pro fone.' },
            ],
          },
          engoliu: { lines: [{ who: 'NARRADOR', t: 'Ela atende a próxima no primeiro toque. TMA de doze minutos. A planilha vai gostar.' }] },
          banheiro: {
            lines: [
              { who: 'NARRADOR', t: 'No espelho do banheiro, o aparelho de pulso apita na mão dela. Ela não olha o número. Lava o rosto. Volta.' },
            ],
          },
        }),
    },
  ],
  evening: (c) => {
    const y = sindicanciaYuri(c);
    const ph = num(c, 'postit_h');
    const base: DLine[] = [
      { who: 'NARRADOR', t: '19:04. Troca de turno. A Simone desliga o computador e não levanta da cadeira.' },
      { who: 'NARRADOR', t: 'O Henrique está encostado na porta. Barba feita, camisa passada. Menta. Não tirou o casaco.' },
    ];
    if (y)
      base.push(
        { who: 'NARRADOR', t: 'Na Mesa 1, a ficha da sindicância aberta na tela: "Yuri Santana, 15. NOTA DA TARM (Simone): Mãe, filho de 15 com dengue. Sangrou o nariz e a gengiva. Tá tonto."' },
        { who: 'HENRIQUE', t: 'É um campo só, {nome}. "O paciente relatou sangramento na triagem inicial?" Você marca "não", e eu volto amanhã. Ninguém mais perde nada.' },
      );
    else
      base.push(
        { who: 'NARRADOR', t: 'A sindicância é de uma senhora de sessenta e oito, atendida às duas da manhã. A nota da TARM do noturno diz: "gengiva sangrando, tonta".' },
        { who: 'HENRIQUE', t: 'É um campo só, {nome}. "Relatou sangramento?" Marca "não". A Cleide escreve o que ouve. Eu regulo o que entendo.' },
      );
    if (ph >= 1)
      base.push(
        { who: 'HENRIQUE', t: '(ele tira do bolso uns papéis amassados) E alguém fica deixando isso na minha mesa. Letra de forma. "Bala de menta não tira cheiro."' },
        { who: 'HENRIQUE', t: '"Rua Bahia, 300." (ele olha pra Mesa 1) Se foi você, {nome}, para.', when: () => c.flag('postit_h2') },
        { who: 'NARRADOR', t: 'A Simone olha pro teclado.' },
      );
    if (y) base.push({ who: 'HENRIQUE', t: 'Nota de TARM se corrige. A Simone entende.' });
    else base.push({ who: 'HENRIQUE', t: 'Fala pra {ele}, Simone. Você me conhece há onze anos.' });
    const denuncia = fx.all(sombraSet('denunciou_henrique'), sombraSet('henrique_afastado'), sombraUnset('henrique_piorando'), fx.set('sd12', 'falou'), fx.add('desgaste', 3, 'a sindicância'));
    const omite = fx.all(sombraSet('omitiu_henrique'), fx.set('sd12', 'calou'), fx.add('desgaste', 2, 'a sindicância'));
    const encobre = fx.all(sombraSet('encobriu_henrique'), fx.set('sd12', 'mentiu'), fx.add('desgaste', 5, 'a sindicância'), fx.add('pressao', 1, 'a mentira'));
    return cena('s12_sindicancia', 'central', {
      start: {
        lines: base,
        choices: y
          ? [
              { label: '"A Simone não entende, não."', next: 'falou', effect: denuncia },
              { label: '(Olhar pra tela. Não dizer nada.)', next: 'calou', effect: omite },
              { label: '"Eu posso ter anotado errado. Era fim de turno."', next: 'mentiu', effect: encobre },
            ]
          : [
              { label: '"Ele bebe, {dr}. No carro, no estacionamento. Faz anos."', next: 'falou', effect: denuncia },
              { label: '(Olhar pra tela. Não dizer nada.)', next: 'calou', effect: omite },
              { label: '"Ele é bom médico, {dr}. Foi uma noite ruim."', next: 'mentiu', effect: encobre },
            ],
      },
      falou: {
        lines: [
          { who: 'SIMONE', t: 'A Vera me ligou às 18:20, Henrique. Eu ouvi "sangrou o nariz e a gengiva". Eu escrevi o que ouvi. Tá gravado.', when: () => y },
          { who: 'SIMONE', t: 'Eu conto os papéis de bala no lixo da Mesa 2, Henrique. Faz três anos.', when: () => !y },
          { who: 'NARRADOR', t: '{O} {dr} fecha a ficha e escreve o parecer. Não marca "não".' },
          { who: 'NARRADOR', t: 'O Peixoto desce às 19:40. Lê duas vezes. Recolhe o crachá do Henrique "até segunda ordem" e encaminha pra medicina do trabalho.' },
          { who: 'HENRIQUE', t: '(na porta, sem se virar) Eu levei o seu sobrinho pro Regional no meu carro, Simone. Às três da manhã. Lembra?' },
          { who: 'SIMONE', t: 'Lembro. Você tava sóbrio.' },
        ],
      },
      calou: {
        lines: [
          { who: 'NARRADOR', t: 'O silêncio da Simone dura o tempo de um parecer em branco.' },
          { who: 'NARRADOR', t: '{O} {dr} fecha a ficha sem marcar nada: "Não é comigo." Na segunda, a sindicância é arquivada por "insuficiência de manifestação técnica".' },
          { who: 'NARRADOR', t: 'O Henrique aperta a mão d{o} {dr}. A dele treme.' },
          { who: 'NARRADOR', t: 'No ponto de ônibus, a Simone lembra da avó: quem cala consente. A avó não trabalhava em central.' },
        ],
      },
      mentiu: {
        lines: [
          { who: 'NARRADOR', t: 'A frase sai antes de ela decidir dizer. A Vera não está aqui. O Henrique está.', when: () => y },
          { who: 'NARRADOR', t: 'A frase sai antes de ela decidir dizer. Onze anos de café na mesma garrafa térmica.', when: () => !y },
          { who: 'NARRADOR', t: '{O} {dr} olha pra Simone um tempo comprido. Depois marca "não". O sistema confirma com um bipe educado.' },
          { who: 'HENRIQUE', t: 'Te devo uma, Simone.' },
          { who: 'NARRADOR', t: 'A nota original continua na ficha, com a letra redonda dela. Ninguém vai ler.', when: () => y },
        ],
      },
    });
  },
  bills: contas({ id: 'chuveiro', label: 'Resistência do chuveiro', amount: 45, desc: 'Queimou com o Wesley debaixo, de saco plástico na perna.', onSkip: fx.add('desgaste', 2, 'banho de caneca') }),
  night: (c) =>
    noite(c, 's12_noite', 'cozinha', {
      start: {
        lines: [
          { who: 'NARRADOR', t: 'O chuveiro queimou com o Wesley debaixo, de saco plástico na perna. Ele terminou o banho de caneca, rindo.' },
          { who: 'NARRADOR', t: 'Na casa 4, a luz está acesa. A Simone não consegue olhar pra janela.', when: () => yuriMorreu(c) && c.val('sd12') === 'mentiu' },
          { who: 'WESLEY', t: 'Mãe, a Tati te ligou. Ela tava chorando. (pausa) É verdade isso do corte?' },
          paLine(),
        ],
        choices: [
          { label: '"É. Uma de nós duas, dia 31."', next: 'verdade', effect: fx.add('wesley', 1, 'a verdade') },
          { label: '"Coisa da OS. Vai dar tudo certo."', next: 'mentira' },
        ],
      },
      verdade: {
        lines: [{ who: 'WESLEY', t: 'Então eu volto pras entregas. Com a perna assim mesmo. A moto tá parada e a parcela não para.' }],
        next: 'moto',
      },
      mentira: {
        lines: [
          { who: 'WESLEY', t: '(ele não acredita) Tá.' },
          { who: 'WESLEY', t: 'Mesmo assim, eu volto pras entregas. A parcela não para.' },
        ],
        next: 'moto',
      },
      moto: {
        lines: [{ who: 'NARRADOR', t: 'Ele bate com a muleta no pé da mesa, de leve, como quem testa.' }],
        choices: [
          { label: '"Não. Você não sobe naquela moto antes do médico liberar."', next: 'folga', effect: fx.all(fx.set('proibiu_moto'), fx.add('wesley', -1, 'proibiu')) },
          { label: '"A gente decide depois do raio-X. Juntos."', next: 'folga', effect: fx.all(fx.set('raiox_prometido'), fx.add('wesley', 1, 'juntos')) },
        ],
      },
      folga: {
        lines: [{ who: 'NARRADOR', t: 'Amanhã é folga.' }],
        choices: [escolhaUBS(), { label: 'Dormir e não pensar em nada até meio-dia.', next: 'dormir', effect: fx.add('desgaste', -6, 'folga') }],
        next: 'dormir',
      },
      ubs: noUBS,
      dormir: { lines: [{ who: 'NARRADOR', t: 'Ela dorme de janela aberta. Às três, acorda com o barulho de uma moto passando na Tiradentes. Não é a dele.' }] },
    }),
};

// -----------------------------------------------------------------------------
// DIA 13 — "Produto de Limpeza" (terça): a Mesa 2 (vazia ou não), as amostras da Graça
// -----------------------------------------------------------------------------
const D13: SimoneDayDef = {
  day: 13,
  tmaGoal: 40,
  henrique: { acc: 0.6 },
  morning: (c) => {
    const den = sFlag(c, 'denunciou_henrique');
    const lines: DLine[] = den
      ? [
          { who: 'NARRADOR', t: '06:45. A Mesa 2 vazia. No encosto da cadeira, o casaco do Henrique, esquecido no domingo. A OS não manda substituto de dia.' },
          { who: 'NARRADOR', t: 'A partir de hoje, tudo o que a Simone triar vai pra uma mesa só.' },
        ]
      : [
          { who: 'NARRADOR', t: '06:45. O Henrique está na Mesa 2 desde as sete do noturno. Barba feita. Menta. Não olha pra TARM.' },
          { who: 'NARRADOR', t: 'Em cima do teclado da Simone, uma bala de menta. Ela não sabe se é agradecimento ou aviso.', when: () => c.val('sd12') === 'mentiu' },
        ];
    lines.push({ who: 'NARRADOR', t: 'No monitor da TARM, o número mudou durante a folga: META TMA 40. "É pra planilha do dia 31", diz a Tati, sem tirar o fone.' });
    lines.push({ who: 'NARRADOR', t: 'Na bolsa, uma sacola que a cunhada Graça mandou pelo Ítalo: amostra de curativo, gaze, pomada. "Pro Wesley. O que sobrar, dá pra quem precisar."' });
    const podePostit = !den && num(c, 'postit_h') >= 1;
    return cena('s13_manha', 'central', {
      start: {
        lines,
        onEnter: mesa2SeAfastado,
        choices: [
          { label: 'Deixar metade na gaveta d{o} {dr}: "Vai que alguém da sua casa precisa."', next: podePostit ? 'postit' : 'fim', effect: fx.all(fx.set('sd13_amostras'), sombraSet('curativo_gratis')) },
          { label: 'Guardar tudo pro Wesley.', next: podePostit ? 'postit' : 'fim' },
        ],
      },
      postit: {
        lines: [{ who: 'NARRADOR', t: 'No bolso do uniforme, o bloco de post-it. A letra de forma espera.' }],
        choices: [
          { label: 'Colar mais um no teclado da Mesa 2: "AINDA DÁ TEMPO."', next: 'colou', effect: fx.all(inc('postit_h'), fx.set('postit_h3')) },
          { label: 'Hoje não.', next: 'fim' },
        ],
      },
      colou: { lines: [{ who: 'NARRADOR', t: 'Ele lê às 07:12. Fica parado com o post-it na mão o tempo de uma ligação inteira. Guarda no bolso, junto com os outros.' }] },
      fim: { lines: [{ who: 'NARRADOR', t: 'Primeira ligação: 07:25. Uma mãe gritando. Produto de limpeza.' }] },
    });
  },
  bills: contas(),
  night: (c) =>
    noite(c, 's13_noite', 'sala', {
      start: {
        lines: [
          { who: 'NARRADOR', t: 'O ortopedista do SUS marcou o retorno do Wesley pra maio. A clínica popular da Av. Sul faz o raio-X amanhã cedo por oitenta e cinco.' }, // [validar]
          { who: 'WESLEY', t: 'A perna nem dói mais, mãe. Eu ando sem muleta até o tanque.' },
          { who: 'NARRADOR', t: 'O curativo de hoje foi com as amostras da Graça. A ferida está seca, rosada nas bordas.' }, // [validar]
          paLine(),
        ],
        choices: [
          { label: 'Pagar o raio-X na clínica.', next: 'raiox', needMoney: 85, effect: fx.all(fx.money(-85, 'raio-X do Wesley'), fx.set('raiox'), fx.set('wesley_sabe')) },
          { label: 'Acreditar nele: se não dói, tá sarando.', next: 'acreditar', effect: fx.all(fx.set('sem_raiox'), fx.add('wesley', 1, 'confiou')) },
          { label: 'Fazer o curativo e mudar de assunto.', next: 'assunto', effect: fx.add('desgaste', -3, 'noite quieta') },
        ],
      },
      raiox: {
        lines: [
          { who: 'NARRADOR', t: 'No raio-X, o osso ainda é dois, com um pino no meio. O médico da clínica fala devagar, olhando pro Wesley: "Sessenta dias sem moto. No mínimo."' }, // [validar]
          { who: 'NARRADOR', t: 'O Wesley olha pro chão. Depois olha pra ela. "Sessenta, então."' },
        ],
      },
      acreditar: { lines: [{ who: 'NARRADOR', t: 'Ele dá três passos sem muleta pra provar. No quarto, ela finge que não viu ele segurar no batente.' }] },
      assunto: { lines: [{ who: 'NARRADOR', t: 'Ela pergunta do Everton. Ele diz que o Everton acordou, que está falando enrolado, que vai demorar. Depois os dois ficam quietos.' }] },
    }),
};

export const DAYS_8_13: SimoneDayDef[] = [D8, D9, D10, D11, D12, D13];
