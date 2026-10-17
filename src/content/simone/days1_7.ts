// =============================================================================
// Campanha 2 ("Simone") — dias 1 a 7.
// Fios plantados: 🌱 TMA e a cadeira vazia da Dulce · 🌱 xará (Dona Cida, Aparecida)
// · 🌱 Henrique e a menta (post-its de letra de forma) · 🌱 Vera e o Yuri (a vila)
// · 🌱 receita vencida · 🌱 a moto do consórcio e o capacete vermelho · 🌱 Av. Brasil, 2019
// · 🌱 bombinha → Farmácia Popular (muda o dia 9 do mundo-sombra) · 🌾 D7: o Wesley.
// =============================================================================
import type { SimoneDayDef } from '../../engine/content-api';
import type { Ctx, DLine } from '../../engine/types';
import { fx, is } from '../dsl';
import { contas } from './economy';
import { cena, noite, paLine, sombraSet, custaTMA, inc, semRemedio, fimDe, daSimone, despachou } from './util';

// -----------------------------------------------------------------------------
// DIA 1 — "Primeiro Plantão" (segunda, 3 de março): a OS chega, o TMA começa a contar
// -----------------------------------------------------------------------------
const D1: SimoneDayDef = {
  day: 1,
  morning: () =>
    cena('s01_manha', 'central', {
      start: {
        lines: [
          { who: 'NARRADOR', t: '06:38. Ônibus Vila Nova–Centro. A Simone desce na Rua XV de Novembro com a bolsa grande, o crachá no bolso e um pote de bolo de fubá enrolado em pano de prato.' },
          { who: 'NARRADOR', t: 'Na porta da central, uma faixa nova: "SAÚDE+ GESTÃO — EFICIÊNCIA QUE SALVA". Alguém já riscou o "que" de caneta.' },
          { who: 'NARRADOR', t: 'Na sala, a cadeira da Dulce está vazia desde sexta. Vinte e oito anos de TARM. A OS assinou o contrato e a Dulce assinou a aposentadoria no mesmo dia. A almofada de crochê ficou.' },
          { who: 'PEIXOTO', t: 'Simone! A partir de hoje a OS mede o TMA de vocês: o tempo entre atender e passar pra mesa. Meta de quarenta e cinco minutos. Passou muito disso, vira advertência.' },
          { who: 'SIMONE', t: 'E quem estiver morrendo devagar, doutor?' },
          { who: 'PEIXOTO', t: 'Entra na média. (ele ri sozinho) Na Mesa 1, {m:o doutor novo|a doutora nova}: Moura. Contrato de experiência. Ajuda {m:ele|ela}.' },
          { who: 'NARRADOR', t: 'Na Mesa 2, o Henrique emenda o noturno na dobra do dia, mascando bala de menta. Onze anos de central. A Simone conhece aquele cheiro de menta. E o que vem por baixo dele.' },
        ],
      },
    }),
  events: [
    {
      at: '07:04',
      onCall: 'd01_cida',
      scene: () =>
        cena('s01_cida', 'central', {
          start: {
            lines: [
              { who: 'NARRADOR', t: 'O número no visor, a Simone sabe de cor: (17) 3322-1408. Dona Cida, Bela Vista. Liga quase todo dia desde que o marido morreu.' },
              { who: 'NARRADOR', t: 'No quadro de cortiça, um post-it da própria Simone, de três anos atrás, letra redonda: "Dona Cida (79): liga quase todo dia. Viúva, mora sozinha. Pressão, novela."' },
              { who: 'CIDA', t: 'É a Simone? Aparecida que nem eu! Ô, xará, a pressão deu catorze por nove na farmácia do Seu Toninho. E a novela, você viu?' },
              { who: 'NARRADOR', t: 'No monitor novo da TARM, embaixo do relógio, um contador começou a correr: TMA.' },
            ],
            choices: [
              { label: 'Ouvir dois minutos de novela.', next: 'ouvir', effect: fx.all(custaTMA('d01_cida', 6), inc('cida_ouvida'), fx.add('desgaste', -1, 'a voz da Dona Cida')) },
              { label: 'Passar logo. A OS está cronometrando.', next: 'passar' },
            ],
          },
          ouvir: {
            lines: [
              { who: 'CIDA', t: 'A Marta descobriu tudo, Simone! O Henrique, o da fazenda... (ela ri) Ai, desculpa, minha filha. É que a casa fica tão quieta.' },
              { who: 'SIMONE', t: 'Fica com Deus, xará. Vou passar a senhora {m:pro médico|pra médica}. Hoje tem gente nova. Seja boazinha.' },
            ],
          },
          passar: {
            lines: [
              { who: 'SIMONE', t: 'Dona Cida, vou passar a senhora pra Mesa 1, tá? Hoje tem {m:médico novo|médica nova}.' },
              { who: 'CIDA', t: 'Ah, então eu conto da novela pra {ele}!' },
            ],
          },
        }),
    },
  ],
  bills: contas({ id: 'luz', label: 'Conta de luz', amount: 54, desc: 'Vence amanhã. Bandeira vermelha, diz o papel.', onSkip: fx.all(fx.set('luz_atrasada'), fx.add('desgaste', 2, 'aviso de corte')) }),
  night: (c) =>
    noite(c, 's01_noite', 'sala', {
      start: {
        lines: [
          { who: 'NARRADOR', t: '20:10. Vila do fundo, casa 2, Rua Tiradentes. O portão range do jeito de sempre. A Simone tira o sapato antes de acender a luz.' },
          paLine('No aparelho de pulso que o Wesley deu no Dia das Mães:'),
          { who: 'NARRADOR', t: 'Mais alta que a da Dona Cida. E quem liga pra emergência é a Dona Cida.', when: (cc) => cc.v('pressao') >= 5 },
          { who: 'WESLEY', t: 'Mãe! Saiu! O consórcio! Fui contemplado na terceira parcela. Sábado eu busco a moto.' },
          { who: 'WESLEY', t: 'De moto, o aplicativo paga o dobro da bicicleta. Domingo, o dobro do dobro.' },
        ],
        choices: [
          { label: '"Moto, não. Eu atendo motoboy todo santo dia."', next: 'nao', effect: fx.all(fx.add('wesley', -1, 'contra a moto'), fx.set('contra_moto')) },
          { label: '"Então capacete bom. E promete que vai devagar."', next: 'capacete', effect: fx.all(fx.add('wesley', 1, 'confiou nele'), fx.set('pediu_capacete')) },
          { label: '"Amanhã a gente conversa. Hoje eu só quero deitar."', next: 'deitar', effect: fx.add('desgaste', -5, 'deitou cedo') },
        ],
      },
      nao: {
        lines: [
          { who: 'WESLEY', t: 'Você atende os que caem, mãe. Não os que chegam.' },
          { who: 'NARRADOR', t: 'Ele fecha a porta do quarto devagar, que é o jeito dele de bater a porta.' },
        ],
      },
      capacete: {
        lines: [
          { who: 'WESLEY', t: 'Prometo. Juro pelo seu bolo de fubá.' },
          { who: 'SIMONE', t: 'Não jura pelo bolo, que o bolo é sagrado.' },
        ],
      },
      deitar: {
        lines: [{ who: 'NARRADOR', t: 'Ela deita de uniforme. Do quarto, baixinho, vem o som de vídeo de moto no celular do Wesley, um atrás do outro.' }],
      },
    }),
};

// -----------------------------------------------------------------------------
// DIA 2 — "O Quadro" (terça): Bené, o 9-8877, a vila e o primeiro post-it
// -----------------------------------------------------------------------------
const D2: SimoneDayDef = {
  day: 2,
  morning: () =>
    cena('s02_manha', 'rua', {
      start: {
        lines: [
          { who: 'NARRADOR', t: '06:35. Padaria da esquina da XV. O Seu Bené já está no balcão, de macacão laranja, com dois cafés pedidos.' },
          { who: 'BENE', t: 'Simoninha. Pão na chapa, que a OS não dá café da manhã. E {o} {dr} nov{o} da Mesa 1?' },
          { who: 'SIMONE', t: 'Pergunta antes de mandar. Já é mais que muita gente.' },
          { who: 'BENE', t: 'Trinta e um anos de volante. Faltam dezoito dias pra aposentadoria, Simoninha. Tô contando no calendário da oficina.' },
          { who: 'NARRADOR', t: 'Na Mesa 2, o Henrique cochila sentado, de óculos escuros, até o primeiro toque. No teclado, um papel de bala de menta dobrado em quatro.' },
        ],
      },
    }),
  events: [
    {
      at: '07:06',
      onCall: 'd02_biel',
      scene: () =>
        cena('s02_biel', 'central', {
          start: {
            lines: [
              { who: 'NARRADOR', t: 'Voz de moleque. "Um cara esfaqueado na frente da escola!" A Estadual está fechada hoje: saiu no jornal. E tem risadinha no fundo.' },
              { who: 'NARRADOR', t: 'Final 8877. A Simone pega um post-it amarelo.' },
            ],
            choices: [
              { label: 'Pregar o número no quadro de trotes: "9-8877".', next: 'quadro', effect: fx.set('sd2_8877') },
              { label: 'Deixar pra lá. Moleque cansa.', next: 'lapra' },
            ],
          },
          quadro: { lines: [{ who: 'NARRADOR', t: 'A tachinha vermelha, no canto de cima. "Esses sempre voltam", ela diz pra ninguém.' }] },
          lapra: { lines: [{ who: 'NARRADOR', t: 'Ela amassa o post-it. Depois desamassa e guarda na gaveta, por via das dúvidas.' }] },
        }),
    },
  ],
  bills: contas(),
  night: (c) =>
    noite(c, 's02_noite', 'calcada', {
      start: {
        lines: [
          { who: 'NARRADOR', t: 'Na vila do fundo, a Dona Vera, da casa 4, está no portão com um balde de água sanitária, esfregando o quintal.' },
          { who: 'VIZINHA', t: 'Simone, o fumacê passou de manhã. Falaram que tem dengue na Vila Nova inteira. Eu virei até tampinha de garrafa.' },
          { who: 'VIZINHA', t: 'O Yuri fez quinze e já tá mais alto que eu. Pergunta de você. Diz que quer ser motoboy que nem o Wesley.' },
          { who: 'SIMONE', t: 'Fala pra ele estudar, Vera. Motoboy eu atendo todo dia.' },
          paLine(),
        ],
        choices: [
          { label: 'Assar dois bolos de fubá pra vender na central.', next: 'bolo', effect: fx.all(fx.money(30, 'bolos vendidos'), fx.add('desgaste', 4, 'assou até meia-noite')) },
          { label: 'Escrever um post-it. De letra de forma.', next: 'postit', effect: fx.all(inc('postit_h'), fx.set('postit_h1')) },
          { label: 'Sentar no portão com a Vera até o sereno.', next: 'vera', effect: fx.all(fx.add('desgaste', -3, 'conversa de portão'), fx.when(is.v('pressao', '>=', 6), fx.add('pressao', -1, 'conversa de portão'))) },
        ],
      },
      bolo: {
        lines: [
          { who: 'NARRADOR', t: 'Meia-noite. Cheiro de fubá na vila inteira. A Vera grita do portão que vai querer um pedaço.' },
          { who: 'NARRADOR', t: 'O bolo da Simone tem fila na central: a Tati, o porteiro, o pessoal da base. Quinze reais o bolo, vendido em pedaço.' },
        ],
      },
      postit: {
        lines: [
          { who: 'NARRADOR', t: 'Ela escreve devagar, em letra de forma, pra ninguém reconhecer a letra redonda dos post-its da triagem: "BALA DE MENTA NÃO TIRA CHEIRO."' },
          { who: 'NARRADOR', t: 'Dobra e guarda no bolso do uniforme. Amanhã cedo, antes de todo mundo, vai estar colado no teclado da Mesa 2.' },
          { who: 'NARRADOR', t: 'Não é o primeiro. Faz três anos que a Simone escreve post-its que ninguém assina.' },
        ],
      },
      vera: {
        lines: [
          { who: 'VIZINHA', t: 'Você tá com cara de cansada, Simone.' },
          { who: 'SIMONE', t: 'Eu nasci com essa cara, Vera.' },
          { who: 'NARRADOR', t: 'As duas riem baixo, pra não acordar a vila. Um mosquito pousa no braço da Vera. Ela mata com um tapa e mostra o sangue, orgulhosa.' },
        ],
      },
    }),
};

// -----------------------------------------------------------------------------
// DIA 3 — "O Peito" (quarta): o almoço e a bombinha (muda o dia 9 do mundo-sombra)
// -----------------------------------------------------------------------------
/** "Eu tomei o remédio da pressão" (campanha 1, D3 12:30): às vezes é mentira */
const mentiraDoRemedio = (c: Ctx): DLine[] => [
  { who: 'SIMONE', t: 'Não me olha assim, {dr}. Eu tomei o remédio da pressão.' },
  { who: 'NARRADOR', t: 'Não tomou. A cartela acabou ontem.', when: () => semRemedio(c) === 1 },
  { who: 'NARRADOR', t: 'Não tomou. A cartela acabou faz dias.', when: () => semRemedio(c) >= 2 },
];

const D3: SimoneDayDef = {
  day: 3,
  morning: (c) =>
    cena('s03_manha', 'central', {
      start: {
        lines: [
          { who: 'NARRADOR', t: '06:41, antes de todo mundo: o post-it de letra de forma no teclado da Mesa 2. "BALA DE MENTA NÃO TIRA CHEIRO."', when: is.flag('postit_h1') },
          { who: 'NARRADOR', t: 'Às sete, o Henrique senta, lê, olha em volta. Amassa e enfia no bolso do jaleco. Não joga fora.', when: is.flag('postit_h1') },
          { who: 'NARRADOR', t: '06:50. Quarta-feira de feijoada. A Simone pendura a bolsa e confere o quadro: o 9-8877 de ontem continua lá, na tachinha vermelha.', when: is.flag('sd2_8877') },
          { who: 'NARRADOR', t: '06:50. Quarta-feira de feijoada. Cheiro de alho já na escada da central.', when: is.not('sd2_8877') },
          { who: 'HENRIQUE', t: 'Bom dia, Simone. Quarta. Feijoada. De tarde chove dor no peito.' },
          { who: 'SIMONE', t: 'E de manhã chove o quê, Henrique?' },
          { who: 'HENRIQUE', t: '(ele demora a responder) Menta.', when: () => c.flag('postit_h1') },
          { who: 'HENRIQUE', t: 'Trote. De manhã chove trote.', when: () => !c.flag('postit_h1') },
        ],
      },
    }),
  events: [
    {
      at: '12:30',
      until: '13:30',
      scene: (c) =>
        cena('s03_bombinha', 'central', {
          start: {
            lines: [
              { who: 'NARRADOR', t: '12:30. Marmita de feijoada da vizinha em cima do teclado. Na Mesa 1, {o} {dr} Moura fala baixinho no celular, de costas pra sala.' },
              { who: 'NARRADOR', t: '"Oitenta reais a bombinha? ...Não, deixa. Depois eu vejo. Ele tá bem agora, não tá?"' },
              { who: 'NARRADOR', t: 'Asma. Criança. Oitenta reais que {o} {dr} não tem, pelo tom.' },
            ],
            choices: [
              {
                label: '"Desculpa ouvir, {dr}. Com receita do SUS, a Farmácia Popular dá a bombinha de graça."',
                next: 'dica',
                effect: fx.all(fx.set('sd3_bombinha'), sombraSet('bombinha'), sombraSet('farmacia_popular')),
              },
              { label: '(Comer a feijoada calada. Não é da sua conta.)', next: 'calada' },
            ],
          },
          dica: {
            lines: [
              { who: 'NARRADOR', t: '{O} {dr} demora um segundo pra entender. Depois anota no braço, de caneta: FARM. POPULAR.' },
              { who: 'SIMONE', t: 'Eu pego o meu remédio de pressão lá. (ela mexe a feijoada) Pegava. A receita venceu.' },
              ...mentiraDoRemedio(c),
            ],
          },
          calada: {
            lines: [
              { who: 'NARRADOR', t: 'Ela come a feijoada. {O} {dr} desliga o celular e fica um tempo olhando a tela, sem ver.' },
              ...mentiraDoRemedio(c),
            ],
          },
        }),
    },
  ],
  bills: contas({
    id: 'botijao',
    label: 'Botijão de gás',
    amount: 105,
    desc: 'Acabou no meio do arroz.',
    onPay: fx.unset('sem_gas'),
    onSkip: fx.all(fx.set('sem_gas'), fx.add('desgaste', 3, 'janta fria')),
  }),
  night: (c) =>
    noite(c, 's03_noite', 'cozinha', {
      start: {
        lines: [
          { who: 'NARRADOR', t: 'O botijão acabou no meio do arroz. O Wesley terminou de cozinhar no fogão da Dona Vera e trouxe a panela de volta pela vila, de chinelo.' },
          { who: 'WESLEY', t: 'Botijão tá cento e cinco, mãe. Eu vi no caminhão. Sábado, com a moto, eu busco um pra você na garupa.' },
          { who: 'NARRADOR', t: 'Na gaveta da cozinha, a receita do remédio da pressão. Vencida em setembro. Sem receita nova, a farmácia cobra o preço cheio, e a UBS só renova com consulta.' },
          paLine(),
        ],
        choices: [
          { label: '"Botijão na garupa, não. Pelo amor de Deus."', next: 'garupa', effect: fx.add('desgaste', -2, 'riu do Wesley') },
          { label: 'Pedir pro Wesley jantar com ela. Sem celular.', next: 'jantar', effect: fx.all(fx.add('wesley', 1, 'jantar sem celular'), fx.add('desgaste', -2, 'jantar')) },
          { label: 'Deitar cedo.', next: 'cedo', effect: fx.add('desgaste', -5, 'deitou cedo') },
        ],
      },
      garupa: { lines: [{ who: 'WESLEY', t: 'Tá, tá. Eu chamo o caminhão do gás. (pausa) Mas que ia ser bonito, ia.' }] },
      jantar: {
        lines: [
          { who: 'WESLEY', t: 'Sem celular? ...Tá. (ele vira o celular de tela pra baixo) Mãe, você acha que o pai ia gostar da moto?' },
          { who: 'SIMONE', t: 'Seu pai gostava de tudo que tinha motor e de nada que tinha boleto.' },
          { who: 'NARRADOR', t: 'O Wesley ri com a boca cheia. Faz quinze anos que o Cláudio foi pro Mato Grosso. Ele ainda pergunta.' },
        ],
      },
      cedo: { lines: [{ who: 'NARRADOR', t: 'Ela dorme antes do Jornal Nacional acabar. O Wesley desliga a TV e põe um lençol em cima dela.' }] },
    }),
};

// -----------------------------------------------------------------------------
// DIA 4 — "Cena Quente" (quinta): a Tati, o capacete, a Graça da UBS
// -----------------------------------------------------------------------------
const D4: SimoneDayDef = {
  day: 4,
  morning: () =>
    cena('s04_manha', 'central', {
      start: {
        lines: [
          { who: 'NARRADOR', t: '06:59. O ônibus atrasou vinte minutos numa blitz na Av. Brasil. A Simone bate o ponto correndo, com um minuto de sobra.' },
          { who: 'NARRADOR', t: 'Na baia ao lado, a Tati, a outra TARM do dia, vinte e seis anos, mostra no celular a filha de um ano com a franja cortada torta.' },
          { who: 'NARRADOR', t: '"A Manu cortou o próprio cabelo, Simone." A Simone ri. A Tati ganha menos da metade do salário dela.' },
          { who: 'NARRADOR', t: 'O Bar do Neno abre às seis pros peões da usina. A Simone já atendeu tiro lá três vezes. Hoje ela sabe que vai ser a quarta antes de saber.' },
        ],
      },
    }),
  bills: contas({
    id: 'botijao2',
    label: 'Botijão de gás (com entrega)',
    amount: 110,
    when: is.flag('sem_gas'),
    desc: 'Segunda noite cozinhando no fogão da Vera.',
    onPay: fx.unset('sem_gas'),
    onSkip: fx.add('desgaste', 3, 'mais uma janta fria'),
  }),
  night: (c) =>
    noite(c, 's04_noite', 'sala', {
      start: {
        lines: [
          { who: 'NARRADOR', t: 'O Wesley chega de bicicleta com a mochila térmica nas costas e a canela ralada do pedal.' },
          { who: 'WESLEY', t: 'Última semana de bicicleta, mãe. O capacete do primo tá rachado na viseira. Um bom, de verdade, custa oitenta e cinco.' },
          paLine(),
        ],
        choices: [
          { label: 'Dar o dinheiro do capacete bom.', next: 'deu', needMoney: 85, effect: fx.all(fx.money(-85, 'capacete do Wesley'), fx.set('capacete_bom'), fx.add('wesley', 1, 'o capacete')) },
          { label: '"O do primo serve até o fim do mês."', next: 'primo', effect: fx.set('capacete_primo') },
        ],
      },
      deu: {
        lines: [
          { who: 'WESLEY', t: 'Vermelho, mãe. Vou comprar vermelho, que é pra você me ver de longe.' },
          { who: 'SIMONE', t: 'Eu não vou te ver de longe, Wesley. Eu vou te ouvir no telefone, se você cair. Vai devagar.' },
        ],
        next: 'graca',
      },
      primo: {
        lines: [{ who: 'WESLEY', t: 'Serve. Rachado, mas é vermelho. Dá pra ver de longe.' }],
        next: 'graca',
      },
      graca: {
        lines: [{ who: 'NARRADOR', t: 'Na geladeira, preso com ímã, o telefone da cunhada Graça, técnica de enfermagem da UBS da Vila Esperança há quinze anos.' }],
        choices: [
          { label: 'Ligar pra Graça e pedir um encaixe pra renovar a receita.', next: 'ligou', effect: fx.set('graca_encaixe') },
          { label: 'Amanhã. Ou depois.', next: 'depois' },
        ],
      },
      ligou: {
        lines: [
          { who: 'NARRADOR', t: '"Terça que vem eu te encaixo, Simone. Sete da manhã. Leva o cartão do SUS e a receita velha. E vem, hein? Não faz que nem da outra vez."' },
          { who: 'NARRADOR', t: 'Terça é folga. A Simone escreve no calendário da cozinha: UBS 7H. Embaixo, menor: IR.' },
        ],
      },
      depois: { lines: [{ who: 'NARRADOR', t: 'O papel com o telefone da Graça continua na geladeira, embaixo do ímã de pizzaria.' }] },
    }),
};

// -----------------------------------------------------------------------------
// DIA 5 — "Corte" (sexta): o painel do Peixoto, o rostinho, a conta de água
// -----------------------------------------------------------------------------
const D5: SimoneDayDef = {
  day: 5,
  morning: () =>
    cena('s05_manha', 'central', {
      start: {
        lines: [
          { who: 'NARRADOR', t: '07:00. Monitor novo na Mesa 1, com o logo da Saúde+ e um rostinho sorridente no canto: "META DO DIA: 2 USA". A USA 03 e a USB 05 foram recolhidas ontem à noite.' },
          { who: 'PEIXOTO', t: 'Eficiência, Simone! Terminou o dia com até duas USA, a OS paga trinta reais de bônus pro regulador.' },
          { who: 'SIMONE', t: 'E pra TARM, doutor?' },
          { who: 'PEIXOTO', t: 'Pra TARM tem o TMA.' },
        ],
        choices: [
          { label: 'Colar um post-it no rostinho: "A META NÃO ESTÁ ACIMA DO MANUAL (P.5)".', next: 'painel', effect: fx.set('postit_painel') },
          { label: 'Não mexer no painel. Pôr o fone.', next: 'fone' },
        ],
      },
      painel: {
        lines: [
          { who: 'NARRADOR', t: 'A letra redonda de sempre, desta vez sem esconder. Ela sublinha duas vezes o "não".' },
          { who: 'SIMONE', t: 'Tá escrito lá, {dr}. Eu só sublinhei.' },
          { who: 'NARRADOR', t: 'Às dez, o Peixoto arranca o post-it sem dizer nada. Às dez e meia tem outro.' },
        ],
      },
      fone: { lines: [{ who: 'NARRADOR', t: 'O rostinho sorri pra sala inteira. A Simone vira o monitor dela uns cinco graus, pra não ver.' }] },
    }),
  bills: contas({ id: 'agua', label: 'Conta de água', amount: 44, desc: 'Com a taxa de esgoto que a vila não tem.', onSkip: fx.add('desgaste', 2, 'mais um papel na geladeira') }),
  night: (c) =>
    noite(c, 's05_noite', 'cozinha', {
      start: {
        lines: [
          { who: 'NARRADOR', t: 'Sexta à noite. O Wesley lava a calçada da vila de chinelo, cantando. Amanhã ele busca a moto.' },
          { who: 'WESLEY', t: 'Que cara é essa, mãe?' },
          { who: 'SIMONE', t: 'Cara de painel. Puseram um rostinho no monitor {m:do médico|da médica} que fica bravo quando {ele} manda ambulância.' },
          { who: 'WESLEY', t: 'E o seu rostinho?' },
          { who: 'SIMONE', t: 'O meu ficou feliz.' },
          { who: 'WESLEY', t: 'Mãe... o documento da moto sai cento e dez, com o emplacamento. Eu tenho sessenta.' },
          paLine(),
        ],
        choices: [
          { label: 'Emprestar os cinquenta que faltam.', next: 'emprestou', needMoney: 50, effect: fx.all(fx.money(-50, 'documento da moto'), fx.set('ajudou_documento'), fx.add('wesley', 1, 'emprestou')) },
          { label: '"Pede pro seu pai. Pelo menos uma vez."', next: 'pai', effect: fx.all(fx.set('pai_audio'), fx.add('wesley', -1, 'o pai')) },
          { label: 'Assar dois bolos pra vender. O dinheiro dele é dele.', next: 'bolo', effect: fx.all(fx.money(30, 'bolos vendidos'), fx.add('desgaste', 4, 'assou até tarde')) },
        ],
      },
      emprestou: {
        lines: [
          { who: 'WESLEY', t: 'Domingo eu te pago. Domingo paga em dobro.' },
          { who: 'NARRADOR', t: 'Ela finge que acredita. Ele finge que não percebeu.' },
        ],
      },
      pai: {
        lines: [
          { who: 'NARRADOR', t: 'Às 23:40, o celular do Wesley vibra em cima da mesa. Áudio de Sinop: "Orgulho, campeão." Quarenta segundos. Nenhum centavo.' },
          { who: 'WESLEY', t: 'O primo empresta. Tudo bem, mãe.' },
        ],
      },
      bolo: { lines: [{ who: 'NARRADOR', t: 'O Wesley lambe a colher da massa, como quando tinha seis anos. O primo empresta os cinquenta.' }] },
    }),
};

// -----------------------------------------------------------------------------
// DIA 6 — "O Lado do Rosto" (sábado): a menina da injeção na barriga; a moto chega
// -----------------------------------------------------------------------------
const D6: SimoneDayDef = {
  day: 6,
  morning: (c) =>
    cena('s06_manha', 'central', {
      start: {
        lines: [
          { who: 'NARRADOR', t: 'Sábado. A Simone trouxe bolo de fubá, como todo sábado, e guardou na gaveta de baixo. A gaveta é patrimônio da OS. O bolo não.' },
          { who: 'NARRADOR', t: '06:40, chega a foto: o Wesley em cima da moto, que ainda tem o plástico no banco, fazendo joinha. O capacete vermelho pendurado no guidão.' },
          { who: 'HENRIQUE', t: 'Sábado, Simone. Dia de AVC e de cachaça. Às vezes os dois na mesma pessoa.' },
          { who: 'NARRADOR', t: 'A Simone não responde. Pensa no post-it de quarta, que ele amassou e guardou no bolso.', when: () => c.flag('postit_h1') },
          { who: 'NARRADOR', t: 'A Simone não responde. Conta os papéis de bala de menta no lixo da Mesa 2: quatro, antes das sete.', when: () => !c.flag('postit_h1') },
        ],
      },
    }),
  events: [
    {
      at: '10:20',
      onCall: 'd06_hipo_mae',
      scene: () =>
        cena('s06_menina', 'central', {
          start: {
            lines: [
              { who: 'NARRADOR', t: 'Voz de criança. "Moço... minha mãe não acorda. Ela tá no chão da cozinha." Ao fundo, desenho animado no volume alto.' },
              { who: 'NARRADOR', t: 'Por dois segundos, a Simone acha que é trote. Vinte e dois anos de criança passando trote em sábado de manhã.' },
            ],
            choices: [
              { label: '"Ela tá respirando, meu amor? Põe a mão na barriga dela."', next: 'respira', effect: fx.set('sd6_menina') },
              { label: '(Por dois segundos, achar.)', next: 'achar' },
            ],
          },
          respira: {
            lines: [
              { who: 'NARRADOR', t: '"Sobe... devagarinho. Ela toma injeção na barriga." A Simone deixa de achar. A caneta anda sozinha.' },
            ],
          },
          achar: {
            lines: [
              { who: 'NARRADOR', t: '"Moço? Ela tá fria." Os dois segundos acabam. A Simone se odeia um pouquinho e escreve rápido.' },
            ],
          },
        }),
    },
  ],
  bills: contas(),
  night: (c) =>
    noite(c, 's06_noite', 'calcada', {
      start: {
        lines: [
          { who: 'NARRADOR', t: 'A moto está estacionada dentro da vila, entre o tanque e o varal, com uma lona por cima. O Wesley passou pano até no pneu.' },
          { who: 'WESLEY', t: 'Uma volta, mãe. Só no quarteirão. Você nunca andou de moto comigo.' },
          { who: 'NARRADOR', t: 'O capacete pendurado no guidão é vermelho, novo, ainda com a etiqueta.', when: is.flag('capacete_bom') },
          { who: 'NARRADOR', t: 'O capacete pendurado no guidão é o do primo: vermelho, com a viseira rachada colada com fita.', when: is.not('capacete_bom') },
          paLine(),
        ],
        choices: [
          { label: 'Subir na garupa. Uma volta só.', next: 'garupa', effect: fx.all(fx.add('wesley', 2, 'garupa'), fx.set('garupa')) },
          { label: '"Comigo, não. Mas tira foto que eu mostro pro pessoal."', next: 'foto', effect: fx.add('wesley', 1, 'a foto') },
          { label: '"Amanhã você começa às sete. Vai dormir, menino."', next: 'dormir', effect: fx.add('desgaste', -4, 'casa quieta') },
        ],
      },
      garupa: {
        lines: [
          { who: 'NARRADOR', t: 'Ele vai a trinta por hora, devagar até demais, pra mostrar pra ela. Na esquina da Tiradentes, dá seta pra ninguém.' },
          { who: 'NARRADOR', t: 'A Simone segura na cintura dele e conta os quarteirões como quem conta compressões.' },
          { who: 'SIMONE', t: 'Amanhã é domingo. Paga em dobro. Vai devagar desse jeito.' },
          { who: 'WESLEY', t: 'Igualzinho hoje, mãe. Juro.' },
        ],
      },
      foto: { lines: [{ who: 'NARRADOR', t: 'Ela tira três fotos. Numa, ele está rindo de olho fechado. É essa que ela vai mostrar pra central inteira amanhã.' }] },
      dormir: { lines: [{ who: 'NARRADOR', t: 'Ele obedece, o que é raro. Da janela, a Simone vê a lona da moto mexer com o vento a noite inteira.' }] },
    }),
};

// -----------------------------------------------------------------------------
// DIA 7 — "O Vereador" (domingo): Av. Brasil, 2780. O Wesley.
// -----------------------------------------------------------------------------
const wesleyFim = (c: Ctx): string => {
  const v = c.val<string>('sd7_desfecho');
  if (v) return v;
  return 'vivo';
};

const D7: SimoneDayDef = {
  day: 7,
  morning: () =>
    cena('s07_manha', 'rua', {
      start: {
        lines: [
          { who: 'NARRADOR', t: '06:30. Domingo. A Simone chega antes de todo mundo e está sorrindo, o que é raro.' },
          { who: 'NARRADOR', t: 'Mostra a foto pro Seu Bené na padaria, pro porteiro, pra Tati: o Wesley de capacete vermelho, fazendo joinha numa moto com plástico no banco.' },
          { who: 'BENE', t: 'Moto nova, Simoninha? (ele devolve o celular devagar) Fala pra ele: porta de carro. Domingo de feira, todo mundo abre a porta sem olhar.' },
          { who: 'SIMONE', t: 'Eu falo todo dia, Bené. Dezenove anos. Ninguém de dezenove anos escuta.' },
          { who: 'NARRADOR', t: '06:52. "Primeira entrega, mãe! Domingo paga em dobro!" Ela responde com o desenho do capacete. Depois apaga e escreve: "Devagar."' },
        ],
      },
    }),
  events: [
    {
      at: '13:00',
      onCall: 'd07_wesley',
      scene: () =>
        cena('s07_wesley', 'central', {
          start: {
            lines: [
              { who: 'NARRADOR', t: 'Av. Brasil, 2780. Em frente à feira de domingo, perto da banca de pastel. Motoboy no chão. Osso aparecendo na perna.' },
              { who: 'NARRADOR', t: 'Av. Brasil, a quatro quadras do Regional. A Simone conhece esse trecho: em 2019, uma moça ligou dali gritando pelo irmão. Quarenta minutos.' },
              { who: 'NARRADOR', t: '"Ele tá pedindo pra avisar a mãe. Diz que a mãe trabalha aí na Regulação. Simone, o nome dela."' },
              { who: 'NARRADOR', t: 'A caneta para no meio do post-it. Na Mesa 1, {o} {dr} levanta os olhos. Na Mesa 2, o Henrique também.' },
            ],
            choices: [
              { label: 'Respirar. Fazer as perguntas. Uma de cada vez.', next: 'firme', effect: fx.all(fx.set('sd7_firme'), fx.add('pressao', 1, 'o Wesley no chão')) },
              { label: 'Pedir pro homem pôr o Wesley no telefone.', next: 'ouvir', effect: fx.all(custaTMA('d07_wesley', 5), fx.add('wesley', 1, 'a voz da mãe'), fx.add('pressao', 1, 'o Wesley no chão'), fx.set('sd7_ouviu')) },
              { label: 'Olhar pra Mesa 1.', next: 'mesa', effect: fx.all(fx.set('sd7_olhou'), fx.add('pressao', 1, 'o Wesley no chão')) },
            ],
          },
          firme: {
            lines: [
              { who: 'SIMONE', t: 'Moço, é a Simone. A mãe dele. Ele tá acordado? Respira? O pé tá quente?' },
              { who: 'NARRADOR', t: 'A voz sai igual à de sempre. Isso assusta mais do que se tremesse.' },
              { who: 'NARRADOR', t: '"Tá acordado, dona. Mexe os dedo. Tá chorando de dor, mas tá falando. Eu sou o Edinho, da banca de tomate."' },
            ],
          },
          ouvir: {
            lines: [
              { who: 'WESLEY', t: 'Mãe? ...Mãe, não briga. Foi a porta de um carro. Eu tava devagar, juro. A moto só ralou.' },
              { who: 'SIMONE', t: 'Eu sei, filho. Fica deitado. Não deixa ninguém tirar o capacete. Eu tô aqui.' },
            ],
          },
          mesa: {
            lines: [
              { who: 'NARRADOR', t: '{O} {dr} Moura já tirou o fone de um lado. Faz um sinal curto com a mão: "passa".' },
              { who: 'NARRADOR', t: 'Do outro lado do vidro, o Henrique também faz um sinal. O mesmo.' },
              { who: 'NARRADOR', t: 'A Simone olha pros dois e escreve, com a letra redonda de sempre, o que precisa escrever.' },
            ],
          },
        }),
    },
  ],
  evening: (c, w) => {
    const r = w.call('d07_wesley');
    const fim = fimDe(r);
    const desfecho = !r || !daSimone(r) ? 'semtriagem' : fim === 'morto' ? 'morto' : despachou(r) ? (r.outcome === 'sequela' ? 'tarde' : 'viatura') : 'dispensado';
    const lines: DLine[] = [{ who: 'NARRADOR', t: '19:40. Regional. A Simone ainda de uniforme, o crachá virado pra dentro.' }];
    if (desfecho === 'viatura')
      lines.push(
        { who: 'NARRADOR', t: 'O rádio da tarde ainda está no ouvido dela: "Fratura exposta de tíbia, sangramento controlado, pé quente. O rapaz mandou dizer pra Simone que a moto só ralou."' },
        { who: 'NARRADOR', t: 'O Wesley entra no centro cirúrgico às oito. Vai pôr pino.' },
      );
    else if (desfecho === 'tarde')
      lines.push(
        { who: 'NARRADOR', t: 'A viatura chegou, mas a ferida ficou aberta tempo demais. O ortopedista fala em antibiótico forte e internação comprida.' }, // [validar]
        { who: 'NARRADOR', t: 'O Wesley entra no centro cirúrgico às nove. Vai pôr pino. E vai ficar.' },
      );
    else if (desfecho === 'dispensado')
      lines.push(
        { who: 'NARRADOR', t: 'Ninguém mandou viatura. O Seu Edinho levou o Wesley na Kombi da feira, deitado em cima das caixas de tomate, até a UPA. Da UPA, transferido pro Regional.' },
        { who: 'NARRADOR', t: 'O ortopedista olha a ferida e não diz nada por um tempo. Depois diz: "Demorou."' }, // [validar]
      );
    else
      lines.push({ who: 'NARRADOR', t: 'O Wesley entra no centro cirúrgico às oito e meia. Vai pôr pino.' });
    lines.push(
      { who: 'NARRADOR', t: 'No corredor, um senhor de avental de feira segura o capacete vermelho do Wesley com as duas mãos. Seu Edinho, da banca de tomate. Foi ele que ligou.' },
    );
    return cena('s07_regional', 'hospital', {
      start: {
        lines,
        onEnter: fx.all(fx.set('sd7_desfecho', desfecho), fx.set('sd7_mesa', r?.tarm?.to ?? ''), fx.set('sd7_cor', r?.tarm?.color ?? ''), fx.add('desgaste', 4, 'o dia do Wesley')),
        choices: [
          { label: '"Obrigada, Seu Edinho."', next: 'edinho', effect: fx.set('conheceu_edinho') },
          { label: '(Pegar o capacete e sentar sozinha.)', next: 'sozinha' },
        ],
      },
      edinho: {
        lines: [
          { who: 'NARRADOR', t: '"Que isso, dona. Eu só segurei a mão dele e parei o trânsito com as caixa. O resto foi vocês aí do telefone."' },
          { who: 'NARRADOR', t: 'Ele anota o número dela num pedaço de papelão de caixa. "Qualquer coisa, a feira ajuda. A feira sempre ajuda."' },
        ],
      },
      sozinha: { lines: [{ who: 'NARRADOR', t: 'O capacete está rachado do lado. Do lado de fora. Do lado de dentro, não.' }] },
    });
  },
  bills: contas(
    { id: 'taxi_regional', label: 'Táxi pro Regional (ida e volta)', amount: 32, auto: true, desc: 'Domingo à noite não tem ônibus que preste.' },
    { id: 'lanche_hospital', label: 'Lanche da máquina do hospital', amount: 10, desc: 'Bolacha recheada e café de máquina.', onSkip: fx.add('desgaste', 1, 'fome de corredor') },
  ),
  night: (c) =>
    noite(c, 's07_noite', 'hospital', {
      start: {
        lines: [
          { who: 'NARRADOR', t: '23:10. Cadeira de plástico no corredor da ortopedia. O Wesley saiu da cirurgia às dez: pino na tíbia, antibiótico na veia, a perna pra cima.' }, // [validar]
          { who: 'NARRADOR', t: 'O ortopedista disse "noventa dias sem moto" e "antibiótico até quarta". Ferida que demorou: mais cuidado ainda.', when: () => ['tarde', 'dispensado'].includes(wesleyFim(c)) }, // [validar]
          { who: 'WESLEY', t: '(grogue) Mãe... a moto só ralou. Fala pro pessoal da central que eu tava devagar.' },
          { who: 'NARRADOR', t: 'Três parcelas pagas. Faltam trinta e três. Noventa dias sem moto, disse o ortopedista.' }, // [validar]
          { who: 'NARRADOR', t: 'O aluguel, a partir de hoje, é inteiro dela.' },
        ],
        choices: [
          { label: 'Dormir na cadeira ao lado dele.', next: 'cadeira', effect: fx.all(fx.set('sd7_noite', 'cadeira'), fx.add('wesley', 1, 'ficou'), fx.add('desgaste', 3, 'cadeira de plástico')) },
          { label: 'Ir pra casa dormir. Amanhã tem plantão.', next: 'casa', effect: fx.all(fx.set('sd7_noite', 'casa'), fx.add('desgaste', -3, 'a própria cama')) },
          { label: 'Ligar pro Cláudio, o pai, em Sinop.', next: 'pai', effect: fx.all(fx.set('sd7_noite', 'pai'), fx.set('ligou_pai')) },
        ],
      },
      cadeira: {
        lines: [
          { who: 'NARRADOR', t: 'Às três da manhã, a enfermeira traz um cobertor sem perguntar nada. A Simone dorme sentada, com a mão no lençol dele.' },
        ],
      },
      casa: {
        lines: [
          { who: 'NARRADOR', t: 'Ela beija a testa dele e pega o último ônibus. Na vila, a Vera deixou a luz da área acesa e um prato de sopa no portão.' },
        ],
      },
      pai: {
        lines: [
          { who: 'NARRADOR', t: 'Chama sete vezes. Às 23:52, chega um áudio: "Força aí, campeão. Assim que der eu mando alguma coisa."' },
          { who: 'NARRADOR', t: 'Não manda.' },
        ],
      },
    }),
};

export const DAYS_1_7: SimoneDayDef[] = [D1, D2, D3, D4, D5, D6, D7];
