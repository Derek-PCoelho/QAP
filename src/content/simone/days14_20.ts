// =============================================================================
// Campanha 2 ("Simone") — dias 14 a 20.
// Colheitas: 🌾 2019 (a Carla e o Murilo; a Simone era a do telefone) · 🌾 Rose e a
// Yasmin (D15 → a lista do D18) · 🌾 Peixoto e o pai (D16 → a lista) · 🌾 a moto (D16)
// · 🌾 D17: a crise (remédio, receita, Wesley na chuva) · 🌾 D18: a lista, a matéria, o
// Bené · 🌾 D19: Dona Cida · 🌾 D20: o Henrique às 18:58 e o último post-it.
// =============================================================================
import type { SimoneDayDef } from '../../engine/content-api';
import type { Ctx, DLine, Choice, NewspaperDef } from '../../engine/types';
import { makeCtx } from '../../engine/state';
import { DAY as D18DAY } from '../days/d18';
import { fx, is } from '../dsl';
import { contas } from './economy';
import { cena, noite, paLine, sombraSet, sombraFonte, custaTMA, num, fimDe, sFlag, sKey, mesa2SeAfastado, temComprimido, semRemedio, henriqueDenunciado } from './util';
import { escolhaUBS, noUBS } from './days8_13';

// -----------------------------------------------------------------------------
// a lista do dia 31 (D18): quanto pesa ficar
// -----------------------------------------------------------------------------
export function pesoLista(c: Ctx): number {
  let p = -1; // vinte e dois anos de casa custam caro na planilha
  const e = c.v('emprego');
  if (e >= 9) p += 2;
  else if (e >= 7) p += 1;
  else if (e <= 4) p -= 1;
  if (c.flag('rose_yasmin')) p += 1;
  if (peixotoAjuda(c)) p += 2;
  if (c.flag('sd14_fonte')) p -= 1;
  if (c.flag('sd17_crise')) p -= 1;
  return p;
}
export const peixotoAjuda = (c: Ctx) => c.flag('sd16_avisou_peixoto') && sKey(c, 'osvaldo') === 'salvo' && !sFlag(c, 'peixoto_caiu');
/** situação do emprego no fim do mês */
export type Status = 'supervisora' | 'fica' | 'fica_fone' | 'adiada' | 'assinou' | 'demitida';
export function statusEmprego(c: Ctx): Status {
  const s = c.val<Status>('emprego_status');
  if (s) return s;
  if (sFlag(c, 'materia_forte')) return 'fica';
  return pesoLista(c) >= 1 ? 'fica' : 'demitida';
}

// -----------------------------------------------------------------------------
// DIA 14 — "Carla" (quarta): o número de 2019
// -----------------------------------------------------------------------------
const D14: SimoneDayDef = {
  day: 14,
  tmaGoal: 40,
  henrique: { acc: 0.58 },
  morning: (c) =>
    cena('s14_manha', 'central', {
      start: {
        onEnter: mesa2SeAfastado,
        lines: [
          { who: 'NARRADOR', t: '06:45. O ar-condicionado voltou a funcionar. O balde continua no chão, por via das dúvidas.' },
          { who: 'NARRADOR', t: 'Na passagem de turno, a Mesa 1 ouve que às três da manhã uma mulher ligou perguntando quantas USA tinha no noturno, e desligou quando perguntaram o nome.' },
          { who: 'SIMONE', t: '(sem tirar o fone) Jornalista. Essa gente fareja sangue.' },
          { who: 'NARRADOR', t: 'A Mesa 2 continua vazia. O casaco do Henrique continua no encosto.', when: () => henriqueDenunciado(c) },
          { who: 'NARRADOR', t: 'Na Mesa 2, o Henrique conta balas de menta numa fileira em cima da mesa. Sete. Põe todas na boca de uma vez.', when: () => !henriqueDenunciado(c) },
        ],
      },
    }),
  events: [
    {
      at: '08:30',
      onCall: 'd14_carla',
      scene: () =>
        cena('s14_carla', 'central', {
          start: {
            lines: [
              { who: 'NARRADOR', t: 'Mulher, voz firme. Dor no peito "do lado esquerdo... direito... no meio". Quer saber quanto tempo a ambulância leva pra chegar no Centro.' },
              { who: 'NARRADOR', t: 'Embaixo do número, o sistema mostra: "1 atendimento anterior — 2019 — Av. Brasil — Murilo Nunes, 26 — óbito."' },
              { who: 'NARRADOR', t: 'A Simone lembra da voz. Lembra da ligação inteira. Foi ela que atendeu. Anotou, passou, e ninguém ficou na linha com a moça ajoelhada no asfalto. Quarenta minutos.' },
              { who: 'NARRADOR', t: 'Carla Nunes. Gazeta de Santa Aurora. Ligando de novo, cinco anos depois, pra cronometrar.' },
            ],
            choices: [
              { label: 'Tratar como ligação-teste: anotar, passar, não dizer nada.', next: 'calou', effect: fx.set('sd14_calou') },
              { label: '"Carla. Eu sei quem é você. Me procura depois das sete, no ponto da XV."', next: 'marcou', effect: fx.all(custaTMA('d14_carla', 3), fx.set('sd14_marcou')) },
            ],
          },
          calou: { lines: [{ who: 'NARRADOR', t: 'Ela escreve "Mulher, 44. Dor no peito. Fala bem, calma." É verdade. Não é tudo.' }] },
          marcou: { lines: [{ who: 'NARRADOR', t: 'Do outro lado, um silêncio. Depois, baixinho: "...É você. A do telefone." A dor no peito some da ligação.' }] },
        }),
    },
  ],
  evening: (c) =>
    cena(
      's14_ponto',
      'calcada',
      {
        start: {
          lines: [
            { who: 'NARRADOR', t: '19:10. Ponto de ônibus da XV de Novembro. Uma mulher de mochila, crachá de imprensa enfiado no bolso da camisa.' },
            { who: 'CARLA', t: 'Você disse depois das sete. São sete e dez.', when: () => c.flag('sd14_marcou') },
            { who: 'CARLA', t: 'Simone? Eu reconheci a sua voz hoje de manhã. Demorei cinco anos pra achar.', when: () => !c.flag('sd14_marcou') },
            { who: 'CARLA', t: 'Você era a do telefone. Em 2019.' },
            { who: 'SIMONE', t: 'Eu anotei e passei. Era o que a gente fazia. Ninguém ficou na linha com você.' },
            { who: 'CARLA', t: 'Eu fiquei ajoelhada no asfalto segurando a mão dele, esperando alguém me dizer o que fazer. Ninguém disse.' },
            { who: 'NARRADOR', t: 'O ônibus da Vila Nova passa. A Simone não sobe.' },
          ],
          choices: [
            { label: '"Me desculpa." (Só isso.)', next: 'desculpa', effect: fx.set('sd14_desculpa') },
            { label: '"Hoje eu fico na linha. Com todo mundo. Foi por causa de você."', next: 'linha', effect: fx.set('sd14_linha') },
            { label: '"Eu não posso falar com jornal. Tenho um filho de muleta e uma lista de corte."', next: 'recusou', effect: fx.set('sd14_recusou') },
          ],
        },
        desculpa: {
          lines: [{ who: 'CARLA', t: '...Fazia cinco anos que eu queria ouvir isso de alguém daí de dentro. (pausa) Não resolve. Mas ajuda. Me conta como é aí dentro hoje?' }],
          next: 'fonte',
        },
        linha: {
          lines: [{ who: 'CARLA', t: '(ela fica um tempo olhando a rua) Então me conta como é aí dentro. Sem nome.' }],
          next: 'fonte',
        },
        recusou: {
          lines: [
            { who: 'CARLA', t: 'Eu entendo. (ela estende um cartão) Meu irmão também achava que não era com ele.' },
            { who: 'NARRADOR', t: 'O cartão vai pro bolso do uniforme, junto do bloco de post-it.' },
          ],
        },
        fonte: {
          lines: [{ who: 'NARRADOR', t: 'O próximo ônibus é às 19:50. Tem tempo.' }],
          choices: [
            { label: 'Contar do TMA, do comunicado do corte e do painel. Sem nome.', next: 'falou', effect: fx.all(fx.set('sd14_fonte'), sombraFonte('simone')) },
            { label: '"Fala com {o} {dr} Moura. {Ele} anota tudo. Diz que fui eu que mandei."', next: 'mandou', effect: fx.all(fx.set('sd14_mandou_moura'), sombraSet('depoimento', 'aceitou')) },
            { label: 'Ir embora no próximo ônibus.', next: 'foi' },
          ],
        },
        falou: {
          lines: [
            { who: 'NARRADOR', t: 'Ela conta. O cronômetro do TMA, o comunicado do dia 31, o rostinho do painel, a USA 03 parada no pátio. A Carla anota num caderninho, sem gravar.' },
            { who: 'CARLA', t: 'Ninguém vai saber que foi você.' },
            { who: 'SIMONE', t: 'Três pessoas leram aquele comunicado na central. Vão saber.' },
          ],
          choices: [
            { label: '"E fala com {o} {dr} Moura também. {Ele} anota tudo."', next: 'mandou', effect: fx.all(fx.set('sd14_mandou_moura'), sombraSet('depoimento', 'aceitou')) },
            { label: 'Subir no ônibus.', next: 'foi' },
          ],
        },
        mandou: {
          lines: [
            { who: 'CARLA', t: '{Ele} mora na Vila Esperança, né? Casa azul. Eu vou hoje.' },
            { who: 'NARRADOR', t: 'Às nove da noite, a Carla bate palma num portão da Rua das Acácias. O que {o} {dr} respondeu, a Simone só vai saber pelo jornal.' },
          ],
        },
        foi: { lines: [{ who: 'NARRADOR', t: 'Da janela do ônibus, a Simone vê a Carla parada no ponto, escrevendo no caderninho. Escrevendo muito.' }] },
      },
      ['CARLA'],
    ),
  bills: contas({ id: 'fiado', label: 'Fiado da quitanda da vila', amount: 30, desc: 'Pão, leite e ovo da semana do Wesley.', onSkip: fx.add('desgaste', 1, 'conta na quitanda') }),
  night: (c) =>
    noite(c, 's14_noite', 'cozinha', {
      start: {
        lines: [
          { who: 'NARRADOR', t: '21:30. Ela chega no ônibus seguinte. O Wesley esquentou o arroz e deixou um prato no forno, com outro prato por cima.' },
          { who: 'WESLEY', t: 'Demorou, mãe. Aconteceu alguma coisa?' },
          paLine(),
        ],
        choices: [
          { label: 'Contar do Murilo, de 2019. Pela primeira vez.', next: 'tiago', effect: fx.all(fx.set('contou_tiago'), fx.add('wesley', 2, 'ela contou'), fx.add('desgaste', -2, 'falou')) },
          { label: '"Nada. Trânsito."', next: 'nada' },
        ],
      },
      tiago: {
        lines: [
          { who: 'NARRADOR', t: 'Moto. Av. Brasil. Vinte e seis anos. A irmã no telefone, gritando. Quarenta minutos. O Wesley escuta sem mexer no celular.' },
          { who: 'WESLEY', t: 'Na mesma avenida que eu caí.' },
          { who: 'SIMONE', t: 'Quatro quadras de diferença.' },
          { who: 'WESLEY', t: 'Por isso você fica na linha com todo mundo?' },
          { who: 'SIMONE', t: 'Desde aquele dia.' },
        ],
        next: 'folga',
      },
      nada: { lines: [{ who: 'WESLEY', t: 'Trânsito na XV às sete da noite. Sei.' }], next: 'folga' },
      folga: {
        lines: [{ who: 'NARRADOR', t: 'Amanhã é folga.' }],
        choices: [escolhaUBS(), { label: 'Dormir até o sol bater na janela.', next: 'dormir', effect: fx.add('desgaste', -6, 'folga') }],
        next: 'dormir',
      },
      ubs: noUBS,
      dormir: { lines: [{ who: 'NARRADOR', t: 'Ela sonha com um telefone que toca e não tem fone. Acorda às onze, com o cheiro do café que o Wesley fez, fraco, do jeito dele.' }] },
    }),
};

// -----------------------------------------------------------------------------
// DIA 15 — "O Show" (sexta): o Ítalo no show; a filha da Rose
// -----------------------------------------------------------------------------
const D15: SimoneDayDef = {
  day: 15,
  tmaGoal: 40,
  henrique: { acc: 0.58 },
  morning: (c) =>
    cena('s15_manha', 'rua', {
      start: {
        onEnter: mesa2SeAfastado,
        lines: [
          { who: 'NARRADOR', t: '06:35. Padaria da XV. O Seu Bené mexe o café com o cabo da colher, devagar demais.' },
          { who: 'BENE', t: 'A moça do jornal me procurou de novo ontem, Simoninha. A Carla. Faz cinco anos que ela me procura.' },
          { who: 'BENE', t: 'Eu só falo escondido. Ela quer com nome e foto. Diz que sem nome ninguém acredita.' },
          { who: 'NARRADOR', t: 'Ontem, no ponto de ônibus, a Carla falou do motorista que sentou no meio-fio. A Simone sabe quem é.', when: () => !c.flag('sd14_recusou') },
        ],
        choices: [
          { label: '"Fala com ela, Bené. Com nome. Você carrega isso faz cinco anos."', next: 'fala', effect: fx.all(fx.set('sd15_bene'), sombraSet('bene_falou')) },
          { label: '"Isso é com você, Bené. Faltam cinco plantões pra aposentadoria."', next: 'contigo' },
        ],
      },
      fala: {
        lines: [
          { who: 'BENE', t: '(ele fica um tempo olhando o café) Eu ia falar com ela no dia que me aposentasse. Pra ninguém poder me tirar a viatura.' },
          { who: 'BENE', t: 'Mas a viatura vai me tirar de qualquer jeito daqui a uma semana, né? (ele ri sem graça) Tá. Hoje à noite eu ligo pra ela.' },
        ],
        next: 'central',
      },
      contigo: {
        lines: [{ who: 'BENE', t: 'Cinco anos de 2019 nas costas, Simoninha. Mais cinco plantões não pesa.' }],
        next: 'central',
      },
      central: {
        lines: [
          { who: 'NARRADOR', t: '06:58. O Ítalo, o sobrinho, dezessete anos, mandou foto às seis: a fila do show já dobrando a Rua do Parque.' },
          { who: 'SIMONE', t: '(áudio) Se apertar, sai pela lateral, Ítalo. Ouviu? Pela lateral.' },
          { who: 'NARRADOR', t: 'A Rose, do RH, passa pela sala com um crachá de visitante pendurado no pescoço.' },
          { who: 'ROSE', t: 'Folga à tarde, Simone. Vou levar a Yasmin no show. Cinco anos e já sabe a música inteira.' },
          { who: 'NARRADOR', t: 'No porta-retrato da mesa da Rose, a Simone já viu: uma menina de franja, de tiara de orelha de gato.' },
        ],
      },
    }),
  events: [
    {
      at: '17:00',
      onCall: 'd15_mci',
      scene: () =>
        cena('s15_mci', 'central', {
          start: {
            lines: [
              { who: 'NARRADOR', t: 'Parque de Exposições. Grade derrubada na saída. "Muitas vítimas", diz o sargento, com a multidão gritando atrás.' },
              { who: 'NARRADOR', t: 'Com a outra mão, a Simone liga pro Ítalo. Caixa postal.' },
            ],
            choices: [
              { label: 'Mandar mensagem pro Ítalo e voltar pro fone.', next: 'msg', effect: fx.add('pressao', 1, 'o Ítalo no show') },
              { label: 'Ligar de novo pro Ítalo. E de novo.', next: 'ligou', effect: fx.all(custaTMA('d15_mci', 3), fx.add('pressao', 1, 'o Ítalo no show')) },
            ],
          },
          msg: { lines: [{ who: 'NARRADOR', t: '"SAI PELA LATERAL." Enviada. Não lida. A Simone escreve o post-it da ligação com a outra mão.' }] },
          ligou: {
            lines: [
              { who: 'NARRADOR', t: 'Na terceira, ele atende, ofegante: "Tia! Saí pela lateral! Tô bem! Tem gente no chão, tia..."' },
              { who: 'SIMONE', t: 'Sai daí. Vai pra casa. Agora.' },
            ],
          },
        }),
    },
    {
      at: '18:30',
      onCall: 'd15_crianca',
      scene: () =>
        cena('s15_yasmin', 'central', {
          start: {
            lines: [
              { who: 'NARRADOR', t: 'Pipoqueiro no portão B: "Achei uma menininha chorando sozinha. Perdeu a mãe no tumulto."' },
              { who: 'NARRADOR', t: 'Ao fundo, uma voz pequena: "A minha mãe chama Rose..."' },
              { who: 'NARRADOR', t: 'Yasmin. Cinco anos. Franja. A Simone já viu essa menina num porta-retrato.' },
            ],
            choices: [
              { label: 'Ligar pro celular da Rose, ali mesmo, do ramal da TARM.', next: 'rose', effect: fx.all(custaTMA('d15_crianca', 3), fx.set('rose_yasmin')) },
              { label: 'Passar pra mesa com a PM e seguir a fila.', next: 'pm' },
            ],
          },
          rose: {
            lines: [
              { who: 'NARRADOR', t: 'A Rose atende no segundo toque, gritando no meio do barulho: "Simone?!"' },
              { who: 'SIMONE', t: 'Portão B, Rose. Carrinho de pipoca. Ela tá com o Seu Zeca. Tá bem. Só ralou o joelho.' },
              { who: 'NARRADOR', t: 'Silêncio. Depois, um choro que a Simone conhece de vinte e dois anos de telefone: o choro de quem achou.' },
            ],
          },
          pm: { lines: [{ who: 'NARRADOR', t: 'A PM acha a mãe. Sempre acha. A Simone escreve: CRIANÇA PERDIDA, 5 ANOS, MÃE "ROSE". E não pensa mais nisso. Quase.' }] },
        }),
    },
  ],
  bills: contas({ id: 'carne', label: 'Carnê das Casas Aurora (a geladeira, 7 de 10)', amount: 58, desc: 'A geladeira de duas portas que o Wesley escolheu no Natal.', onSkip: fx.all(fx.set('carne_atrasado'), fx.add('desgaste', 2, 'carnê atrasado')) }),
  night: (c) =>
    noite(c, 's15_noite', 'sala', {
      start: {
        lines: [
          { who: 'NARRADOR', t: 'O Ítalo chegou em casa às oito, com o tênis rasgado e um vídeo de três minutos que mandou pra família inteira.' },
          { who: 'NARRADOR', t: 'Mensagem da Rose, às 22:14: "Simone. Obrigada. Não sei como você soube. Eu não esqueço."', when: is.flag('rose_yasmin') },
          { who: 'WESLEY', t: 'O Ítalo falou que a tia salvou a vida dele por áudio. "Sai pela lateral." Virou figurinha no grupo da família.' },
          paLine(),
        ],
        choices: [
          { label: 'Assar dois bolos pra vender amanhã.', next: 'bolo', effect: fx.all(fx.money(30, 'bolos vendidos'), fx.add('desgaste', 4, 'assou até tarde')) },
          { label: 'Ver o vídeo do Ítalo no sofá, com o Wesley, até dormir.', next: 'sofa', effect: fx.all(fx.add('desgaste', -5, 'sofá'), fx.add('wesley', 1, 'sofá')) },
          { label: 'Perguntar ao Wesley o que ele quer fazer quando a perna sarar.', next: 'futuro', effect: fx.all(fx.set('falou_futuro'), fx.add('wesley', 1, 'o futuro')) },
        ],
      },
      bolo: { lines: [{ who: 'NARRADOR', t: 'Duas formas no forno, uma de cada vez, porque a forma grande ficou na casa 4 desde o sábado.' }] },
      sofa: { lines: [{ who: 'NARRADOR', t: 'No vídeo, dá pra ver o Ítalo correndo pela lateral. O Wesley pausa no meio e diz: "Olha ele obedecendo, mãe. Um milagre."' }] },
      futuro: {
        lines: [
          { who: 'WESLEY', t: 'Sei lá. Entregar não dá mais por um tempo. (ele pensa) O Seu Edinho falou da banca de domingo. E o Everton falou de um curso de socorrista que a Defesa Civil dá de graça.', when: is.flag('conheceu_edinho') },
          { who: 'WESLEY', t: 'Sei lá. Entregar não dá mais por um tempo. O Everton falou de um curso de socorrista que a Defesa Civil dá de graça.', when: is.not('conheceu_edinho') },
          { who: 'SIMONE', t: 'Socorrista. Você.' },
          { who: 'WESLEY', t: 'Ué. Filho de peixe.' },
        ],
      },
    }),
};

// -----------------------------------------------------------------------------
// DIA 16 — "O Menino que Gritava Lobo" (sábado): Cida, o 9-8877, o pai do Peixoto
// -----------------------------------------------------------------------------
const D16: SimoneDayDef = {
  day: 16,
  tmaGoal: 40,
  henrique: { acc: 0.55 },
  morning: (c) =>
    cena('s16_manha', 'central', {
      start: {
        onEnter: mesa2SeAfastado,
        lines: [
          { who: 'NARRADOR', t: '06:50. Sábado seco. Poeira e cheiro de churrasco desde cedo.' },
          { who: 'NARRADOR', t: 'A cabeça dói desde ontem à noite. Uma dor atrás dos olhos que ela conhece e finge que não conhece.', when: () => c.v('pressao') >= 6 },
          { who: 'NARRADOR', t: 'Ela tomou o comprimido com café, de pé, na cozinha. Sábado é dia de bolo na gaveta.', when: () => c.v('pressao') < 6 },
          { who: 'NARRADOR', t: 'Na Mesa 2, o Henrique pergunta pra ninguém se alguém tem dipirona. Às sete da manhã.', when: () => !henriqueDenunciado(c) },
        ],
      },
    }),
  events: [
    {
      at: '08:50',
      onCall: 'd16_cida',
      scene: () =>
        cena('s16_cida', 'central', {
          start: {
            lines: [
              { who: 'CIDA', t: 'Viu ontem a novela, xará? A... aquela... das seis, como é que chama mesmo? Tá na ponta da língua.' },
              { who: 'NARRADOR', t: 'Três anos de "Amor de Cristal", todo santo dia. Hoje ela não lembrou o nome.' },
            ],
            choices: [
              { label: 'Anotar no quadro, embaixo do post-it velho: "22/3: esqueceu o nome da novela."', next: 'anotou', effect: fx.set('sd16_cida_sinal') },
              { label: 'Rir com ela. Todo mundo esquece.', next: 'riu' },
            ],
          },
          anotou: { lines: [{ who: 'NARRADOR', t: 'Letra pequena, a lápis, embaixo de "Pressão, novela". Pode não ser nada. Ela anota mesmo assim.' }] },
          riu: { lines: [{ who: 'CIDA', t: '"Amor de Cristal"! Lembrei! Viu? A cabeça ainda funciona, xará.' }] },
        }),
    },
    {
      at: '10:40',
      onCall: 'd16_biel',
      scene: (c) =>
        cena('s16_biel', 'central', {
          start: {
            lines: [
              { who: 'NARRADOR', t: '9-8877. O número que ela mesma pregou no quadro, com a tachinha vermelha.', when: () => c.flag('sd2_8877') },
              { who: 'NARRADOR', t: '9-8877. O número do quadro de trotes, aquele do moleque da escola fechada.', when: () => !c.flag('sd2_8877') },
              { who: 'NARRADOR', t: 'Mas não tem risada. Tem chuveiro aberto. E um menino chorando: "Meu vô Jairo caiu no banheiro e não acorda. Juro, juro que não é brincadeira."' },
              { who: 'NARRADOR', t: 'Foi ela que ensinou na central: o quadro diz quem já mentiu. Não diz quem tá mentindo agora.' },
            ],
          },
        }),
    },
    {
      at: '14:30',
      onCall: 'd16_osvaldo',
      scene: () =>
        cena('s16_osvaldo', 'central', {
          start: {
            lines: [
              { who: 'NARRADOR', t: 'Bela Vista. Rua dos Bem-te-vis, 1480, apartamento 41. Senhor de oitenta e quatro, falta de ar e febre. "Não quero incomodar."' },
              { who: 'NARRADOR', t: 'No cadastro: Osvaldo Ribeiro Peixoto.' },
              { who: 'NARRADOR', t: '"Meu pai tem 84 anos e nunca precisou de ambulância." O Peixoto disse isso no dia 5, alto, no almoço, pra sala inteira ouvir.' },
            ],
            choices: [
              { label: 'Ligar pro ramal da coordenação: "Doutor, é o seu pai."', next: 'avisou', effect: fx.all(custaTMA('d16_osvaldo', 2), fx.set('sd16_avisou_peixoto')) },
              { label: 'Triar como qualquer outro. Falta de ar é falta de ar.', next: 'neutra', effect: fx.set('sd16_neutra') },
            ],
          },
          avisou: { lines: [{ who: 'NARRADOR', t: 'O Peixoto desce a escada de dois em dois degraus, de gravata solta. Fica atrás da cadeira dela, ouvindo, com a mão na boca.' }] },
          neutra: { lines: [{ who: 'NARRADOR', t: 'Ela escreve como escreve pra todo mundo. O sobrenome fica na ficha. Quem quiser, lê.' }] },
        }),
    },
  ],
  evening: (c, w) => {
    if (!c.flag('sd16_avisou_peixoto')) return undefined;
    const fim = fimDe(w.call('d16_osvaldo'));
    return cena('s16_peixoto', 'central', {
      start: {
        lines:
          fim === 'morto'
            ? [
                { who: 'NARRADOR', t: '16:10. O Peixoto saiu sem o paletó. O paletó continua no encosto da cadeira da coordenação, às sete da noite.' },
                { who: 'NARRADOR', t: 'Ninguém da central sabe o que dizer. A Simone deixa um post-it no paletó, de letra redonda, assinado: "Sinto muito. — Simone."' },
              ]
            : [
                { who: 'NARRADOR', t: '19:00. O Peixoto para na mesa da TARM. Está sem gravata. Tem cara de quem passou a tarde num corredor de hospital.' },
                { who: 'PEIXOTO', t: 'Simone. (pausa) Obrigado.' },
                { who: 'NARRADOR', t: 'Em doze anos, é a primeira vez que ele fala o nome dela sem "a TARM" na frente.' },
              ],
        onEnter: fx.set('sd16_osvaldo', fim),
      },
    });
  },
  bills: contas({
    id: 'consorcio_multa',
    label: 'Parcela atrasada do consórcio + multa',
    amount: 185,
    when: (c) => c.flag('parcela_atrasada') && !c.flag('moto_passada'),
    desc: '"Risco de exclusão do grupo", diz a carta.',
    onPay: fx.unset('parcela_atrasada'),
    onSkip: fx.all(fx.set('moto_excluida'), fx.add('wesley', -2, 'a moto vai embora')),
  }),
  night: (c) =>
    noite(c, 's16_noite', 'sala', {
      start: {
        lines: [
          { who: 'NARRADOR', t: 'Carta do consórcio: parcela vencida, multa, "risco de exclusão do grupo". O Wesley lê duas vezes em voz alta.', when: is.flag('parcela_atrasada') },
          { who: 'NARRADOR', t: 'O Wesley passou a tarde olhando a moto. Tirou a lona. Pôs de volta. Tirou de novo.', when: is.not('parcela_atrasada') },
          { who: 'WESLEY', t: 'Segunda eu volto pras entregas, mãe. A perna aguenta. Chuva paga em dobro, e vai chover.' },
          { who: 'NARRADOR', t: 'Sessenta dias, disse o médico da clínica. Faz nove.', when: is.flag('raiox') }, // [validar]
          { who: 'WESLEY', t: 'O Seu Edinho falou que eu posso ficar no caixa da banca, domingo, sentado. Cinquenta por domingo.', when: is.flag('conheceu_edinho') },
          paLine(),
        ],
        choices: [
          {
            label: '"Não. Nem pensar."',
            next: 'proibiu',
            effect: (e) => {
              e.set('proibiu_moto');
              e.add('wesley', -1, 'proibiu');
              if (e.v('wesley') <= 3) {
                e.set('wesley_voltou_moto');
                e.set('voltou_escondido');
              }
            },
          },
          { label: '"Passa a moto pra frente, com as parcelas. A moto vai. Você fica."', next: 'passou', effect: fx.all(fx.set('moto_passada'), fx.unset('parcela_atrasada'), fx.money(220, 'o que ele já tinha pago na moto'), fx.add('wesley', -1, 'a moto')) },
          { label: '"Banca do Seu Edinho, sentado, até a perna sarar."', when: is.flag('conheceu_edinho'), next: 'feira', effect: fx.all(fx.set('wesley_feira'), fx.add('wesley', 1, 'a banca')) },
          { label: '"Você tem dezenove anos. Decide você."', next: 'decide', effect: fx.all(fx.set('wesley_voltou_moto'), fx.add('wesley', 1, 'confiou'), fx.add('pressao', 1, 'a moto na chuva')) },
        ],
      },
      proibiu: {
        lines: [
          { who: 'WESLEY', t: 'Tá.' },
          { who: 'NARRADOR', t: 'É o "tá" de quem vai fazer mesmo assim. A Simone conhece. Foi ela que ensinou.', when: is.flag('voltou_escondido') },
          { who: 'NARRADOR', t: 'É um "tá" de verdade. Ele põe a lona de volta na moto e amarra com o elástico.', when: is.not('voltou_escondido') },
        ],
      },
      passou: {
        lines: [
          { who: 'NARRADOR', t: 'O sobrinho do Seu Edinho fica com a moto e com as trinta e duas parcelas. Paga duzentos e vinte pelo que o Wesley já tinha pago.', when: is.flag('conheceu_edinho') },
          { who: 'NARRADOR', t: 'Um primo do primo fica com a moto e com as parcelas. Paga duzentos e vinte pelo que o Wesley já tinha pago.', when: is.not('conheceu_edinho') },
          { who: 'WESLEY', t: '(ele demora) ...Tá. Mas um dia eu compro outra. Vermelha.' },
        ],
      },
      feira: {
        lines: [
          { who: 'WESLEY', t: 'Sentado no caixa. Que nem você na central.' },
          { who: 'SIMONE', t: 'Na central ninguém fica sentado, Wesley. A gente só não levanta.' },
        ],
      },
      decide: {
        lines: [
          { who: 'WESLEY', t: 'Sério?' },
          { who: 'SIMONE', t: 'Sério. Mas você me manda mensagem a cada entrega. Uma palavra. "Cheguei."' },
          { who: 'WESLEY', t: '"Cheguei." Combinado.' },
        ],
      },
    }),
};

// -----------------------------------------------------------------------------
// DIA 17 — "Água" (segunda): a enchente e a crise na central
// -----------------------------------------------------------------------------
const naRua = (c: Ctx) => c.flag('wesley_voltou_moto') && !c.flag('moto_excluida') && !c.flag('moto_passada');

const crise = (quando: 'central' | 'tarde') =>
  fx.all(fx.set('sd17_crise', quando), fx.set('sd17_evento'), fx.add('desgaste', 5, 'a crise'));

const D17: SimoneDayDef = {
  day: 17,
  tmaGoal: 40,
  moura: { acc: 0.75 },
  henrique: { acc: 0.52 },
  morning: (c) =>
    cena('s17_manha', 'central', {
      start: {
        onEnter: mesa2SeAfastado,
        lines: [
          { who: 'NARRADOR', t: '07:12. A Simone entra pingando, o guarda-chuva virado do avesso, os sapatos na mão. O ônibus parou na Santos Dumont; ela veio a pé.' },
          { who: 'NARRADOR', t: 'O Wesley saiu de moto às seis: "Chuva paga em dobro, mãe." A perna com pino dentro de uma bota de borracha.', when: () => naRua(c) },
          { who: 'NARRADOR', t: 'O Wesley ficou em casa, com a perna pra cima. Quando ela saiu, a água da Tiradentes já estava no meio-fio.', when: () => !naRua(c) },
          { who: 'NARRADOR', t: 'A dor de cabeça é de ontem. Hoje tem uns pontinhos brilhando no canto do olho.', when: () => c.v('pressao') >= 6 }, // [validar]
          { who: 'NARRADOR', t: 'No rádio da sala: Beira-Rio interditada, baixada da Vila Nova submersa.' },
        ],
        choices: [
          { label: 'Medir a pressão no aparelho da gaveta.', next: 'mediu', effect: fx.set('sd17_mediu') },
          { label: '"Medir pra quê? Pra ver o número e ficar nervosa?"', next: 'naomediu' },
        ],
      },
      mediu: {
        lines: [
          paLine('O aparelho da gaveta apita:'),
          { who: 'NARRADOR', t: 'Ela guarda o aparelho com o visor pra baixo.', when: () => c.v('pressao') >= 6 },
          { who: 'NARRADOR', t: 'Ela respira. Guarda o aparelho e pega o fone.', when: () => c.v('pressao') < 6 },
        ],
      },
      naomediu: { lines: [{ who: 'NARRADOR', t: 'É dor de cabeça. Desde ontem. Passa.' }] },
    }),
  events: [
    {
      at: '08:15',
      onCall: 'd17_cida',
      scene: (c) =>
        cena('s17_cida', 'central', {
          start: {
            lines: [
              { who: 'CIDA', t: 'Xará... a água tá entrando em casa. Tá vindo por baixo da porta da cozinha. Eu pus o pano, pus o tapete.' },
              { who: 'NARRADOR', t: 'Mais adiante, no mesmo tom, sem perceber: "A água tá entrando em casa."' },
              { who: 'NARRADOR', t: 'A mesma frase duas vezes. Sábado ela esqueceu o nome da novela. A anotação a lápis está no quadro.', when: () => c.flag('sd16_cida_sinal') },
            ],
            choices: [
              { label: 'Escrever no quadro: "24/3: repetiu a mesma frase."', next: 'anotou', effect: fx.set('sd17_cida_sinal') },
              { label: 'É o susto. Com essa chuva, qualquer um repete.', next: 'susto' },
            ],
          },
          anotou: { lines: [{ who: 'NARRADOR', t: 'Duas linhas a lápis embaixo de "Pressão, novela". A Simone olha as duas juntas e não gosta do que vê.' }] },
          susto: { lines: [{ who: 'NARRADOR', t: 'Ela escreve "idosa sozinha, casa alagando" e passa. É verdade. Não é tudo.' }] },
        }),
    },
    // 12:45 — a crise. Com a pressão em 7 ou mais, ela cai (a Rose cobre até as 19h).
    {
      at: '12:45',
      until: '14:20',
      when: (c) => c.v('pressao') >= 7 && !c.flag('sd17_evento'),
      out: () => true,
      scene: (c) =>
        cena('s17_crise', 'central', {
          start: {
            onEnter: crise('central'),
            lines: [
              { who: 'NARRADOR', t: '12:45. A letra do post-it sai torta, grande demais, atravessando o papel.' },
              { who: 'NARRADOR', t: 'Ela levanta pra lavar o rosto. O chão da central inclina devagar, como a vila quando enche.' },
              { who: 'NARRADOR', t: 'Senta de novo. Abre uma ficha nova, por hábito, e digita: "Mulher, 51 anos. Dor de cabeça forte desde ontem. Vista embaçada. Hipertensa."' }, // [validar]
              { who: 'NARRADOR', t: `Sem remédio faz ${semRemedio(c)} dias. Isso ela não digita.`, when: () => semRemedio(c) >= 2 },
              { who: 'NARRADOR', t: '{O} {dr} Moura levanta da Mesa 1, mede a pressão dela com o aparelho da gaveta, olha o FAST, e regula em voz alta: "USB, sentada, pra UPA."' }, // [validar]
              { who: 'NARRADOR', t: 'A Simone corrige baixinho, por hábito: "Sem sirene."' },
              { who: 'NARRADOR', t: 'A Rose, do RH, desce pra cobrir a pré-triagem até as sete. Nunca anotou uma ligação na vida.' },
            ],
            choices: [
              { label: '"Não liga pro Wesley. Ele tá de moto na chuva. Se eu ligo, ele vem voando e cai de novo."', when: () => naRua(c), next: 'fim' },
              { label: '"Avisa o Wesley só quando eu estiver sentada na UPA, com soro no braço."', next: 'fim' },
              { label: '(Não dizer nada. Deixar levarem.)', next: 'fim' },
            ],
          },
          fim: { lines: [{ who: 'NARRADOR', t: 'Ela desce a escada da central de braço dado com o técnico da USB, andando. Sem sirene.' }] },
        }),
    },
    // 12:45 — com a pressão abaixo de 7: parar ou continuar
    {
      at: '12:45',
      until: '14:20',
      when: (c) => c.v('pressao') < 7 && !c.flag('sd17_evento'),
      scene: (c) =>
        cena('s17_aviso', 'central', {
          start: {
            onEnter: fx.set('sd17_evento'),
            lines: [
              { who: 'NARRADOR', t: '12:45. A letra do post-it sai torta. Ela olha pra própria mão como se fosse de outra pessoa.' },
              { who: 'NARRADOR', t: 'Dor de cabeça desde ontem. Pontinhos brilhando no canto do olho. Ela sabe o nome disso. Ela ensina o nome disso por telefone.' }, // [validar]
            ],
            choices: [
              {
                label: 'Parar. Pedir pra Tati segurar a linha, tomar o comprimido, lavar o rosto.',
                next: 'parou',
                effect: (e) => {
                  e.set('sd17_parou');
                  if (temComprimido(e) || e.flag('receita_nova')) e.add('pressao', -1, 'parou e tomou o remédio');
                  else {
                    e.set('sd17_sem_comprimido');
                    e.add('pressao', 1, 'sem comprimido na bolsa');
                  }
                },
              },
              { label: 'Continuar. Tem criança na água e velho em cima de telhado.', next: 'continuou', effect: fx.all(fx.set('sd17_continuou'), fx.add('pressao', 2, 'continuou')) },
            ],
          },
          parou: {
            lines: [
              { who: 'NARRADOR', t: 'Quinze minutos de banheiro, comprimido com água da torneira, o rosto molhado. Quando volta, a letra sai redonda de novo. Quase.', when: (cc) => !cc.flag('sd17_sem_comprimido') },
              { who: 'NARRADOR', t: 'A cartela na bolsa está vazia faz dias. A Tati tem dipirona. Não é a mesma coisa. Ela volta pro fone com o rosto molhado.', when: (cc) => cc.flag('sd17_sem_comprimido') },
            ],
          },
          continuou: { lines: [{ who: 'NARRADOR', t: 'Ela aperta as têmporas com as duas mãos, solta, e atende a próxima no primeiro toque.' }] },
        }),
    },
    // 14:30 — quem continuou (ou não tinha remédio) e passou de 7: cai à tarde
    {
      at: '14:30',
      until: '17:30',
      when: (c) => (c.flag('sd17_continuou') || c.flag('sd17_sem_comprimido')) && c.v('pressao') >= 7 && !c.flag('sd17_crise'),
      out: () => true,
      scene: () =>
        cena('s17_crise_tarde', 'central', {
          start: {
            onEnter: crise('tarde'),
            lines: [
              { who: 'NARRADOR', t: '14:30. No meio de uma ligação, a Simone tira o fone, devagar, e vomita no lixo de papel.' }, // [validar]
              { who: 'NARRADOR', t: '"A luz tá doendo", ela diz, pra ninguém.' },
              { who: 'NARRADOR', t: '{O} {dr} Moura regula a TARM da mesa ao lado: "USB, sentada, pra UPA." A Rose desce do RH pra cobrir até as sete.' },
            ],
          },
        }),
    },
  ],
  evening: (c) => {
    if (c.flag('sd17_crise')) {
      return cena('s17_upa', 'hospital', {
        start: {
          onEnter: (e) => {
            if (!e.flag('receita_nova')) {
              e.set('receita_nova');
              e.set('receita_upa');
            }
            e.add('pressao', -2, 'UPA');
            e.set('sem_remedio_seq', 0);
          },
          lines: [
            { who: 'NARRADOR', t: '19:30. UPA Norte. Soro no braço, a pressão descendo: dezesseis por dez.' }, // [validar]
            { who: 'NARRADOR', t: 'O médico da UPA escreve devagar: receita nova, de um ano. "Na Farmácia Popular sai de graça, dona. E não para mais. Combinado?"', when: (cc) => cc.flag('receita_upa') },
            { who: 'NARRADOR', t: 'O médico da UPA olha a receita da bolsa dela, de dez dias atrás. "A senhora tinha o remédio. Por que parou?" Ela não responde.', when: (cc) => !cc.flag('receita_upa') },
            { who: 'NARRADOR', t: 'O Wesley chega às oito, encharcado, de moto, com a bota cheia d’água. Senta do lado dela e não fala nada por um tempo.', when: () => naRua(c) },
            { who: 'NARRADOR', t: 'O Wesley chega às oito de táxi, de muleta, com a sacola de roupa seca que a Vera arrumou.', when: () => !naRua(c) },
            { who: 'WESLEY', t: 'Você vive mandando os outros pra UPA, mãe.' },
            { who: 'NARRADOR', t: 'Mensagem no celular, às 19:12: "Simone, eu cobri a sua mesa. Não entendi metade. Amanhã, dez horas, na minha sala. — Rose."' },
          ],
        },
      });
    }
    return cena('s17_fim', 'rua', {
      start: {
        lines: [
          { who: 'NARRADOR', t: '19:00. A Simone sobrevive ao turno com a cabeça latejando e a letra torta.' },
          { who: 'NARRADOR', t: '{O} {dr} Moura para na mesa dela, de mochila: "Mede a pressão, Simone." Ela mede na frente del{m:e|a}, de pirraça.' },
          paLine('O aparelho apita:'),
          { who: 'NARRADOR', t: 'Ônibus até a Santos Dumont. Dali, a pé, com a água no tornozelo, até a vila.' },
        ],
        onEnter: fx.set('sd17_aguentou'),
      },
    });
  },
  bills: contas(
    { id: 'goteira', label: 'Lona e telha (goteira e barro)', amount: 38, desc: 'A água entrou até o segundo degrau da casa 2.', onSkip: fx.add('desgaste', 3, 'goteira na cama') },
    { id: 'remedios_upa', label: 'Remédios da UPA (o que faltava no posto)', amount: 30, when: is.flag('sd17_crise'), desc: 'Pra dor de cabeça e pro estômago, até a Farmácia Popular abrir.', onSkip: fx.add('pressao', 1, 'sem os remédios da UPA') }, // [validar]
  ),
  night: (c) =>
    noite(c, 's17_noite', 'sala', {
      start: {
        lines: [
          { who: 'NARRADOR', t: 'A água entrou na vila até o segundo degrau da casa 2. Marca de barro na parede, na altura do joelho.' },
          { who: 'WESLEY', t: 'Eu vi a vila do alto da Tiradentes, mãe. Parecia um rio.', when: () => naRua(c) },
          { who: 'WESLEY', t: 'Subi a geladeira nos tijolos, mãe. Com a perna. A Vera me ajudou.', when: () => !naRua(c) },
          paLine(),
        ],
        choices: [
          { label: 'Tomar o comprimido na frente dele. E prometer.', next: 'promessa', effect: fx.all(fx.set('promessa_remedio'), fx.add('wesley', 1, 'a promessa'), fx.add('pressao', -1, 'o comprimido')) },
          { label: 'Limpar o barro até de madrugada.', next: 'barro', effect: fx.add('desgaste', 5, 'barro') },
          { label: 'Deixar o barro pra amanhã. Dormir.', next: 'dormir', effect: fx.add('desgaste', -6, 'dormiu') },
        ],
      },
      promessa: {
        lines: [
          { who: 'SIMONE', t: 'Todo dia. Às seis, com café. Você pode contar.' },
          { who: 'WESLEY', t: 'Eu vou contar. Eu conto até moto passando na rua.' },
        ],
      },
      barro: { lines: [{ who: 'NARRADOR', t: 'Às duas da manhã, a parede está limpa até a altura do joelho. Acima disso, a marca da água fica pra sempre.' }] },
      dormir: { lines: [{ who: 'NARRADOR', t: 'Ela dorme com o barulho da água escorrendo na calha. Parece chuva. Não é mais.' }] },
    }),
};

// -----------------------------------------------------------------------------
// DIA 18 — "Escândalo" (terça): a matéria, o Bené, a lista
// -----------------------------------------------------------------------------
type NovaManchete = Partial<NewspaperDef>;
const jornalD18 = (c: Ctx): NovaManchete | undefined => {
  if (!c.flag('sd14_fonte') || !c.s.shadow) return undefined;
  const base = D18DAY.newspaper(makeCtx(c.s.shadow));
  return {
    stories: [
      ...base.stories.slice(0, 4),
      { title: '"A gente é cronometrada"', text: 'Uma técnica auxiliar de regulação com mais de vinte anos de central, que pediu anonimato, conta que a OS mede o "tempo médio de atendimento" de cada ligação e vai cortar uma TARM por turno no fim do mês. "A gente é cronometrada pra desligar."' },
    ],
  };
};

const D18: SimoneDayDef = {
  day: 18,
  tmaGoal: 40,
  henrique: { acc: 0.5 },
  // Na campanha 1, o Bené vira fonte (com nome) pela intimidade com o regulador. Aqui a IA
  // regula bem demais e ele sempre chegaria a 10: quem decide é a Simone, no café do D15.
  // Roda antes do onStart do dia 18 principal, que conta as fontes e decide matéria/corte.
  shadow: (s) => {
    if (!s.flags['bene_falou']) s.vars.intimBene = Math.min(s.vars.intimBene, 4);
  },
  newspaper: jornalD18,
  morning: (c) =>
    cena('s18_manha', 'rua', {
      start: {
        onEnter: mesa2SeAfastado,
        lines: [
          { who: 'NARRADOR', t: '06:40. Na padaria, a Gazeta em cima do balcão. O Seu Bené lê a matéria de óculos, com o dedo embaixo de cada linha.' },
          { who: 'NARRADOR', t: 'Matéria grande, de capa. A Simone reconhece duas frases que ela mesma disse no ponto de ônibus.', when: () => c.flag('sd14_fonte') && sFlag(c, 'materia_forte') },
          { who: 'NARRADOR', t: 'Matéria grande, de capa.', when: () => !c.flag('sd14_fonte') && sFlag(c, 'materia_forte') },
          { who: 'NARRADOR', t: 'Matéria pequena, na página sete, do lado do horóscopo. O signo da Simone diz "mudanças à vista".', when: () => !sFlag(c, 'materia_forte') },
          paLine('Ela mede a pressão na frente do Bené, de propósito:'),
          { who: 'BENE', t: 'Simoninha... (ele dobra o jornal) Hoje eu vou falar uma coisa no rádio. Escuta.' },
        ],
      },
    }),
  events: [
    {
      at: '07:06',
      until: '08:30',
      scene: () =>
        cena('s18_bene', 'central', {
          start: {
            lines: [
              { who: 'NARRADOR', t: 'No rádio da sala, a voz do Bené: "O motorista que sentou no meio-fio e chorou, em 2019, na Av. Brasil: era eu."' },
              { who: 'NARRADOR', t: 'Ele deu a entrevista pra Carla com nome e foto. Porque a Simoninha pediu, no balcão da padaria.', when: is.flag('sd15_bene') },
              { who: 'NARRADOR', t: 'A Simone sabia. Era ela no telefone. Em cinco anos de café na mesma padaria, os dois nunca falaram disso.' },
            ],
            choices: [
              { label: 'Mandar mensagem pro Bené: "Eu tava no telefone."', next: 'msg', effect: fx.set('sd18_bene') },
              { label: 'Não dizer nada. Ainda não.', next: 'nada' },
            ],
          },
          msg: { lines: [{ who: 'NARRADOR', t: 'Ele responde em um minuto: "Eu sei, Simoninha. Sempre soube. Café amanhã?"' }] },
          nada: { lines: [{ who: 'NARRADOR', t: 'Ela aumenta o volume do rádio. Depois abaixa. O Bené já mudou de assunto: um pneu careca da USA 01.' }] },
        }),
    },
    {
      at: '12:00',
      until: '16:00',
      scene: (c) => listaCena(c),
    },
  ],
  night: (c) => {
    const st = statusEmprego(c);
    const lines: DLine[] = [];
    if (st === 'supervisora') lines.push({ who: 'NARRADOR', t: 'Supervisora. A palavra fica estranha na boca. Ela fala em voz alta no ônibus, baixinho, pra ver como soa.' });
    else if (st === 'assinou') lines.push({ who: 'NARRADOR', t: 'A Tati ainda não sabe. A Simone sabe. A caneta da Rose ficou na bolsa dela, por engano.' });
    else if (st === 'demitida') lines.push({ who: 'NARRADOR', t: 'Dia 31. Faltam doze dias. Ela conta no calendário da cozinha, embaixo do "UBS 7H".' });
    else if (st === 'adiada') lines.push({ who: 'NARRADOR', t: 'A lista ficou na gaveta da Rose. Até a auditoria. Ninguém sabe quando é a auditoria.' });
    else lines.push({ who: 'NARRADOR', t: 'O nome dela não está na lista. Ela devia estar aliviada. Está.' });
    if (st === 'fica' && !sFlag(c, 'materia_forte')) lines.push({ who: 'NARRADOR', t: 'O nome que está é o da Tati. A franja torta da Manu no fundo de tela do celular dela.' });
    lines.push(
      { who: 'NARRADOR', t: 'O telefone de casa toca às nove. Dona Nilza, a mulher do Bené: "Simone, o bolo da despedida dele. De fubá, que é o que ele gosta. Pra sexta. Eu pago oitenta."' },
      paLine(),
    );
    return noite(c, 's18_noite', 'cozinha', {
      start: {
        lines,
        choices: [
          { label: 'Aceitar a encomenda do bolo do Bené.', next: 'folga', effect: fx.set('bolo_bene') },
          { label: '"Faço de graça, Dona Nilza. É o Bené."', next: 'folga', effect: fx.all(fx.set('bolo_bene'), fx.set('bolo_gratis')) },
          { label: '"Essa semana não dá, Dona Nilza."', next: 'folga' },
        ],
      },
      folga: {
        lines: [{ who: 'NARRADOR', t: 'Amanhã é folga.' }],
        choices: [escolhaUBS(), { label: 'Tirar o barro da parede até a altura da janela, pra não ver mais a marca.', next: 'parede', effect: fx.add('desgaste', 2, 'a parede') }, { label: 'Dormir.', next: 'dormir', effect: fx.add('desgaste', -6, 'folga') }],
        next: 'dormir',
      },
      ubs: noUBS,
      parede: { lines: [{ who: 'NARRADOR', t: 'Cal branca por cima. Em dois dias, a marca volta, mais clara. A parede lembra.' }] },
      dormir: { lines: [{ who: 'NARRADOR', t: 'Ela dorme de lado, com a mão no peito, contando as batidas sem querer.' }] },
    });
  },
  // os ingredientes saem na mesma noite da encomenda (a conta vem depois da cena da noite)
  bills: contas({ id: 'bolo_bene', label: 'Ingredientes do bolo do Bené', amount: 34, when: is.flag('bolo_bene'), desc: 'Fubá, ovo, leite, erva-doce. A forma grande volta da casa 4.', onSkip: fx.set('bolo_sem_ingredientes') }),
};

/** Rose e a lista (D18, meio-dia) */
function listaCena(c: Ctx) {
  const forte = sFlag(c, 'materia_forte');
  const caiu = sFlag(c, 'peixoto_caiu');
  const peso = pesoLista(c);
  const e = c.v('emprego');
  const intro: DLine[] = [
    { who: 'NARRADOR', t: '12:00. A Rose desce do RH e chama a Simone pra sala dela. A Tati segura as duas linhas.' },
    { who: 'NARRADOR', t: 'No porta-retrato da mesa, a Yasmin de tiara de orelha de gato. A Rose vira o porta-retrato um pouquinho pro lado.', when: () => c.flag('rose_yasmin') },
  ];
  if (forte) {
    const lines: DLine[] = [
      ...intro,
      { who: 'ROSE', t: 'Senta, Simone. (ela fecha a porta) A OS suspendeu as reestruturações até a auditoria. O corte do dia 31 tá congelado.' },
      { who: 'SIMONE', t: 'Congelado não é cancelado, Rose.' },
      { who: 'ROSE', t: 'Não é. (pausa)' },
      caiu
        ? { who: 'ROSE', t: 'E o Peixoto saiu ontem com uma caixa de papelão. A coordenação interina quer uma supervisora de TARM pra auditoria. Pediram um nome da casa.' }
        : { who: 'ROSE', t: 'E a coordenação vai precisar de uma supervisora de TARM pra auditoria. Pediram um nome da casa.' },
    ];
    const oferta = e >= 6;
    lines.push(oferta ? { who: 'ROSE', t: 'Eu dei o seu.' } : { who: 'ROSE', t: 'Eu dei o da Tati. Os seus números caíram, Simone. Faz o seu TMA até a auditoria.' });
    if (c.flag('rose_yasmin')) lines.push({ who: 'ROSE', t: 'E... obrigada. Pela Yasmin. Eu não esqueço.' });
    return cena('s18_lista', 'escritorio', {
      start: {
        lines,
        onEnter: oferta ? undefined : fx.set('emprego_status', 'fica'),
        choices: oferta
          ? [
              { label: '"Aceito. Mas o fone continua no meu ouvido."', next: 'aceitou', effect: fx.all(fx.set('emprego_status', 'supervisora'), fx.add('emprego', 2, 'supervisora')) },
              { label: '"Não quero cargo, Rose. Quero o meu fone."', next: 'recusou', effect: fx.set('emprego_status', 'fica_fone') },
            ]
          : undefined,
      },
      aceitou: { lines: [{ who: 'ROSE', t: 'Um ouvido pro fone, outro pras meninas. (ela quase sorri) Eu escrevo assim no ofício.' }] },
      recusou: { lines: [{ who: 'ROSE', t: 'Vinte e dois anos e ninguém nunca recusou nada nessa sala. (pausa) Tá anotado.' }] },
    });
  }
  const lines: DLine[] = [
    ...intro,
    { who: 'ROSE', t: 'Senta, Simone. (ela fecha a porta e não senta) A lista do dia 31 tá pronta. Uma TARM por turno. A planilha manda: TMA, cor, custo.' },
  ];
  if (c.flag('sd14_fonte')) lines.push({ who: 'ROSE', t: 'E alguém daqui falou com a Gazeta sobre o TMA. Só três pessoas leram aquele comunicado. A OS me perguntou se eu sei quem foi. Eu disse que não.' });
  if (c.flag('sd17_crise')) lines.push({ who: 'ROSE', t: 'E tem o dia 17. Eu cobri a sua mesa. A OS anotou "afastamento por motivo de saúde".' });
  if (peixotoAjuda(c)) lines.push({ who: 'ROSE', t: 'O Peixoto mandou um bilhete pro RH ontem. Pediu pra tirar o seu nome. Não disse por quê.' }, { who: 'NARRADOR', t: 'A Simone sabe por quê. Mora na Bela Vista, tem oitenta e quatro anos e agora precisa de ambulância.' });
  const tati = peso >= 1;
  if (tati)
    lines.push(
      { who: 'ROSE', t: 'O nome do dia é o da Tati.' },
      { who: 'NARRADOR', t: 'Vinte e seis anos. Uma filha de um ano com a franja cortada torta.' },
      { who: 'ROSE', t: 'E tem mais. A OS quer uma supervisora pra assinar a escala nova. Quem assina, fica com o cargo. Pediram você.' },
    );
  else
    lines.push(
      { who: 'ROSE', t: 'O nome do dia é o seu, Simone.' },
      { who: 'ROSE', t: 'Vinte e dois anos de casa custam caro na planilha.' },
      { who: 'ROSE', t: 'Tem uma saída. A OS quer uma supervisora pra assinar a escala nova. Se você assinar, o nome na lista muda.' },
    );
  const choices: Choice[] = tati
    ? [
        { label: 'Assinar a escala.', next: 'assinou', effect: fx.all(fx.set('emprego_status', 'assinou'), fx.add('emprego', 2, 'supervisora')) },
        { label: '"Não assino. Fico no meu fone."', next: 'naoassinou', effect: fx.set('emprego_status', 'fica') },
        { label: '"Não assino. E a Tati fica sabendo hoje, por mim."', next: 'tati', effect: fx.all(fx.set('emprego_status', 'fica'), fx.set('avisou_tati')) },
      ]
    : [
        { label: 'Assinar. O nome da Tati entra no lugar do seu.', next: 'assinou', effect: fx.all(fx.set('emprego_status', 'assinou'), fx.add('emprego', 2, 'supervisora')) },
        { label: '"Não assino."', next: 'demitida', effect: fx.set('emprego_status', 'demitida') },
        { label: '"Rose... segura essa lista até a auditoria."', when: is.flag('rose_yasmin'), next: 'adiada', effect: fx.set('emprego_status', 'adiada') },
      ];
  return cena('s18_lista', 'escritorio', {
    start: { lines, choices },
    assinou: {
      lines: [
        { who: 'NARRADOR', t: 'A caneta é da OS, azul, com o logo. A assinatura sai redonda, igual à letra dos post-its.' },
        { who: 'ROSE', t: '(sem olhar pra ela) Parabéns, supervisora.' },
      ],
    },
    naoassinou: { lines: [{ who: 'ROSE', t: 'Então o seu nome sai, o da Tati fica, e a escala a OS assina sozinha. (pausa) Ela sempre assina.' }] },
    tati: {
      lines: [
        { who: 'NARRADOR', t: 'Às 15:00, no banheiro da central, a Simone conta pra Tati. A Tati chora de raiva, depois de medo, depois de raiva de novo.' },
        { who: 'NARRADOR', t: 'Antes de voltar pro fone, a Tati diz: "Pelo menos foi você que me contou."' },
      ],
    },
    demitida: {
      lines: [
        { who: 'ROSE', t: 'Dia 31, então.' },
        { who: 'NARRADOR', t: 'A Simone volta pra mesa e atende a próxima no primeiro toque. TMA de onze minutos. A planilha não percebe a diferença.' },
      ],
    },
    adiada: {
      lines: [
        { who: 'NARRADOR', t: 'A Rose olha o porta-retrato da Yasmin um tempo comprido.' },
        { who: 'ROSE', t: '...Até a auditoria. Depois não depende de mim.' },
        { who: 'NARRADOR', t: 'Ela guarda a lista na gaveta, embaixo de uma pasta de férias.' },
      ],
    },
  });
}

// -----------------------------------------------------------------------------
// DIA 19 — "Dona Cida" (quinta): 18:30
// -----------------------------------------------------------------------------
const D19: SimoneDayDef = {
  day: 19,
  tmaGoal: 40,
  henrique: { acc: 0.5 },
  morning: (c) => {
    const st = statusEmprego(c);
    return cena('s19_manha', 'rua', {
      start: {
        onEnter: mesa2SeAfastado,
        lines: [
          { who: 'NARRADOR', t: '06:40. Céu limpo depois da chuva. O barro secou nas calçadas e virou poeira.' },
          { who: 'NARRADOR', t: 'Na janela da coordenação, o vaso de planta do Peixoto. Ninguém rega.', when: () => sFlag(c, 'peixoto_caiu') },
          { who: 'NARRADOR', t: 'A Tati ainda não sabe. A Simone sabe.', when: () => st === 'assinou' },
          { who: 'NARRADOR', t: 'Faltam onze dias pro dia 31. A Simone atende como se fossem onze anos.', when: () => st === 'demitida' },
          { who: 'BENE', t: '(na padaria) Amanhã é o último, Simoninha. Trinta e um anos. Vou sentir falta até do pneu careca.' },
          { who: 'SIMONE', t: 'O bolo tá encomendado, Bené. De fubá. Não conta pra Nilza que eu contei.', when: is.flag('bolo_bene') },
        ],
      },
    });
  },
  events: [
    {
      at: '11:50',
      until: '13:00',
      scene: (c) =>
        cena('s19_semcida', 'central', {
          start: {
            lines: [
              { who: 'NARRADOR', t: 'A Dona Cida não ligou de manhã. Ela sempre liga.' },
              { who: 'NARRADOR', t: 'Da outra vez, a Simone ligou e ninguém atendeu: era a comadre.', when: () => c.flag('sd11_ligou_cida') },
            ],
            choices: [
              { label: 'Ligar pra ela.', next: 'ligou', effect: fx.set('sd19_ligou') },
              { label: 'Seguir a fila. Deve ser a comadre de novo.', next: 'fila' },
            ],
          },
          ligou: { lines: [{ who: 'NARRADOR', t: 'Ela atende na sexta chamada: "Tô bem, xará. Só cansada. Liguei não pra não incomodar." A voz parece a de sempre. Quase.' }] },
          fila: { lines: [{ who: 'NARRADOR', t: 'Deve ser a comadre.' }] },
        }),
    },
    {
      at: '18:30',
      until: '18:59',
      when: (c, w) => w.call('d19_cida')?.status === 'fila',
      scene: () =>
        cena('s19_visor', 'central', {
          start: {
            lines: [{ who: 'NARRADOR', t: '18:30. A linha acende: (17) 3322-1408. Dona Cida. Ela nunca liga depois que a novela começa.' }],
          },
        }),
    },
    {
      at: '18:30',
      onCall: 'd19_cida',
      scene: (c) => {
        const sinais = c.flag('sd16_cida_sinal') && c.flag('sd17_cida_sinal');
        return cena('s19_cida', 'central', {
          start: {
            lines: [
              { who: 'NARRADOR', t: 'A voz arrasta: "Oi... é a... Cida." Ao fundo, a novela das seis. "O braço tá... bobo. Não é nada não. Só queria ouvir uma voz."' },
              { who: 'NARRADOR', t: 'No quadro, o post-it de três anos atrás: "Pressão, novela." Embaixo, a lápis: "22/3: esqueceu o nome da novela." "24/3: repetiu a mesma frase."', when: () => sinais },
              { who: 'NARRADOR', t: 'A Simone não precisa de mais nada.', when: () => sinais },
              { who: 'NARRADOR', t: 'No quadro, o post-it de três anos atrás: "Pressão, novela." Vinte dias de "só conversa". O ouvido da Simone demora um segundo a mais. Um segundo.', when: () => !sinais },
            ],
            choices: [
              { label: '"Dona Cida, é a Simone. A senhora sorri pra mim?"', next: 'sorri', effect: fx.all(custaTMA('d19_cida', 2), fx.set('sd19_sorriu')) },
              { label: 'Escrever rápido, sem conversar: "IDOSA, FALA ARRASTADA, BRAÇO FRACO, DESDE AS 18H."', next: 'rapido', effect: fx.set('sd19_rapido') },
            ],
          },
          sorri: {
            lines: [
              { who: 'CIDA', t: 'Tô... sorrindo... acho. Xará.' },
              { who: 'NARRADOR', t: 'Não está. Do jeito que a voz chega, não está.' }, // [validar]
            ],
          },
          rapido: { lines: [{ who: 'NARRADOR', t: 'Letra de forma, sem querer. A mesma dos outros post-its.' }] },
        });
      },
    },
  ],
  evening: (c, w) => {
    const r = w.call('d19_cida');
    const fim = fimDe(r);
    const lines: DLine[] =
      fim === 'vivo'
        ? [
            { who: 'NARRADOR', t: '19:10. O rádio: "Senhora de setenta e nove, déficit no braço direito, dentro da janela. Seguimos Regional."' },
            { who: 'NARRADOR', t: 'A chave estava embaixo do vaso de samambaia, do lado do portão. O gato saiu correndo quando a equipe entrou.' },
          ]
        : fim === 'noturno'
          ? [
              { who: 'NARRADOR', t: '19:00. A linha da Dona Cida ainda estava na fila quando o turno virou. A Simone vê o cartão mudar de cor: NOTURNO.' },
              { who: 'NARRADOR', t: 'Ela fica sentada até alguém do noturno abrir a ficha. Depois vai embora sem saber.' },
            ]
          : fim === 'morto'
            ? [
                { who: 'NARRADOR', t: 'O rádio, às 19:20, fala devagar. A Simone tira o fone antes do fim da frase.' },
                { who: 'NARRADOR', t: 'No quadro, ela tira o post-it da Dona Cida. Guarda na carteira, atrás da foto do Wesley.' },
              ]
            : [{ who: 'NARRADOR', t: '19:00. Último turno antes do último turno.' }];
    return cena('s19_fim', 'central', { start: { lines, onEnter: fx.set('sd19_cida', fim) } });
  },
  bills: contas(),
  night: (c) =>
    noite(c, 's19_noite', 'cozinha', {
      start: {
        lines: [
          { who: 'NARRADOR', t: 'Véspera do último dia do Bené.' },
          { who: 'NARRADOR', t: 'A Dona Cida está no Regional. A Simone ligou pra enfermaria duas vezes: "estável".', when: () => c.val('sd19_cida') === 'vivo' },
          { who: 'WESLEY', t: 'Mãe, quer que eu bata a massa? Eu bato sentado.', when: is.flag('bolo_bene') },
          paLine(),
        ],
        choices: [
          { label: 'Assar o bolo do Bené até meia-noite.', when: is.flag('bolo_bene'), next: 'bolo', effect: fx.all(fx.add('desgaste', 3, 'o bolo do Bené'), fx.set('bolo_feito')) },
          { label: 'Escrever, devagar, o último post-it do mês. Ainda sem saber pra quem.', next: 'postit', effect: fx.add('desgaste', -2, 'escrever') },
          { label: 'Dormir cedo. Amanhã é longo.', next: 'dormir', effect: fx.add('desgaste', -6, 'dormiu') },
        ],
      },
      bolo: {
        lines: [
          { who: 'NARRADOR', t: 'O Wesley bate a massa sentado, com a perna esticada na cadeira. A vila inteira cheira a erva-doce.', when: is.not('bolo_sem_ingredientes') },
          { who: 'NARRADOR', t: 'Não tem fubá. Não tem ovo. A Simone pede emprestado na casa 4, e a Vera manda o que tem: meio pacote de fubá e um ovo. Sai um bolo pequeno.', when: is.flag('bolo_sem_ingredientes') },
        ],
      },
      postit: { lines: [{ who: 'NARRADOR', t: 'Ela escreve três, joga dois fora. O terceiro fica na bolsa, em branco, com a letra redonda esperando.' }] },
      dormir: { lines: [{ who: 'NARRADOR', t: 'Ela dorme antes das dez. O Wesley desliga a TV e põe um lençol por cima dela, como no dia 3.' }] },
    }),
};

// -----------------------------------------------------------------------------
// DIA 20 — "Último Plantão" (sexta): 18:58 e o último post-it
// -----------------------------------------------------------------------------
const D20: SimoneDayDef = {
  day: 20,
  tmaGoal: 40,
  // o Henrique passa o noturno às 07:00 e vai pra casa: hoje ele não dobra
  henrique: { away: true },
  morning: (c) =>
    cena('s20_manha', 'rua', {
      start: {
        onEnter: fx.when(is.all(is.flag('bolo_feito'), is.not('bolo_gratis')), fx.money(80, 'bolo do Bené')),
        lines: [
          { who: 'NARRADOR', t: '06:30. Padaria. O Seu Bené chega de macacão passado a ferro. Último dia.' },
          { who: 'NARRADOR', t: 'A Simone entrega o pote: bolo de fubá, ainda morno. A Dona Nilza paga no celular, oitenta reais, com um coração.', when: () => c.flag('bolo_feito') && !c.flag('bolo_gratis') },
          { who: 'NARRADOR', t: 'A Simone entrega o pote: bolo de fubá, ainda morno. A Dona Nilza manda um áudio chorando, que a Simone não tem coragem de ouvir até o fim.', when: () => c.flag('bolo_feito') && c.flag('bolo_gratis') },
          { who: 'BENE', t: 'Trinta e um anos, quatro meses e onze dias, Simoninha. Hoje eu levo o último.' },
          { who: 'NARRADOR', t: '07:00. O Henrique passa o plantão pr{o} {dr} e não senta na Mesa 2. "Hoje eu não dobro, Simone. Vou pra casa. Volto às sete pro noturno." Esquece uma bala de menta no teclado da Mesa 1.', when: () => !henriqueDenunciado(c) },
          { who: 'NARRADOR', t: '07:00. A Mesa 2 continua vazia. A Dra. Paula, do noturno, deixa recado: o Henrique ligou da clínica. "Diz que hoje é o dia doze."', when: () => henriqueDenunciado(c) },
          { who: 'NARRADOR', t: 'O pessoal da base passa o envelope da vaquinha pro bolo do Bené. A Simone põe dez e escreve "da central" no cartão.' },
        ],
      },
    }),
  events: [
    {
      at: '18:58',
      until: '19:20',
      when: (c, w) => w.call('d20_final')?.status === 'fila' || w.call('d20_final_rua')?.status === 'fila',
      scene: (c, w) =>
        cena('s20_visor', 'central', {
          start: {
            lines: w.call('d20_final')
              ? [{ who: 'NARRADOR', t: '18:58. A linha acende. Rua XV de Novembro, 1950. Edifício Aurora. A Simone sabe o endereço: é o que está na escala do noturno, na parede.' }]
              : [{ who: 'NARRADOR', t: '18:58. A linha acende. Av. Brasil, 2650. O semáforo da loja de móveis.' }],
          },
        }),
    },
    {
      at: '18:58',
      onCall: 'd20_final',
      scene: (c) =>
        cena('s20_henrique', 'central', {
          start: {
            lines: [
              { who: 'NARRADOR', t: '"O doutor do apartamento 302 tá caído, não respira... Ele trabalha aí com vocês, não trabalha?"' },
              { who: 'NARRADOR', t: 'Dez quadras da central. O noturno não chegou. A Mesa 2 ficou vazia o dia inteiro.' },
              { who: 'NARRADOR', t: 'No bolso do jaleco dele, se a Simone tivesse que adivinhar, os post-its de letra de forma. Todos.', when: () => num(c, 'postit_h') >= 1 },
            ],
            choices: [
              { label: '"Dona Iolanda, é a Simone, da central. Deita ele de costas no chão. Eu vou passar pr{o} {dr}, que vai te ensinar a massagem."', next: 'falou', effect: fx.all(custaTMA('d20_final', 2), fx.set('sd20_falou')) }, // [validar]
              { label: 'Vermelho. Pega essa agora. Sem falar nada.', next: 'calada' },
            ],
          },
          falou: { lines: [{ who: 'NARRADOR', t: 'A vizinha repete cada palavra. A Simone escreve com a mão que não treme. A outra, ela segura embaixo da mesa.' }] },
          calada: { lines: [{ who: 'NARRADOR', t: 'Onze anos de café na mesma garrafa térmica cabem em três palavras: "Homem. Não respira."' }] },
        }),
    },
    {
      at: '18:58',
      onCall: 'd20_final_rua',
      scene: () =>
        cena('s20_rua', 'central', {
          start: {
            lines: [
              { who: 'NARRADOR', t: 'Av. Brasil, 2650. Homem caído na calçada. O mesmo semáforo do primeiro dia d{o} {dr}.' },
              { who: 'NARRADOR', t: 'Tem um vendedor de loja fazendo massagem, contando alto. O Wellington. Ele aprendeu.' },
            ],
          },
        }),
    },
  ],
  evening: (c, w) => {
    const h = w.call('d20_final');
    const rua = w.call('d20_final_rua');
    const fim = fimDe(h ?? rua);
    // 'noturno' sem óbito = sobreviveu (alguém do noturno pegou a tempo)
    const vivo = fim !== 'morto';
    const bene = (h ?? rua)?.decision?.unit === 'USA01';
    const st = statusEmprego(c);
    const desfecho: DLine[] = h
      ? vivo
        ? [
            { who: 'NARRADOR', t: '19:31. O Henrique foi pro Regional intubado, com pulso. A Dona Iolanda ligou de novo só pra perguntar se ele tava vivo. A Simone disse que sim.' },
            { who: 'NARRADOR', t: 'Na ficha dele, alguém da equipe escreveu: "intoxicação alcoólica, PCR revertida". Agora está escrito. Ninguém vai conseguir encobrir.' },
          ]
        : [
            { who: 'NARRADOR', t: 'O crachá do Henrique ficou no chão do 302, do lado do sofá. Alguém da equipe trouxe de volta e deixou na mesa da TARM, sem dizer nada.' },
            { who: 'NARRADOR', t: 'A foto do crachá é de quando ele era novo na central. Ele está sorrindo.' },
          ]
      : vivo
        ? [{ who: 'NARRADOR', t: 'O homem da Av. Brasil foi pro Regional com pulso. O Wellington ficou na calçada com as mãos tremendo.' }]
        : [{ who: 'NARRADOR', t: 'O homem da Av. Brasil não voltou. O Wellington contou até o fim, com as mãos certas no lugar certo. Às vezes se faz tudo certo.' }];
    const ps: DLine[] = [];
    if (st === 'supervisora') ps.push({ who: 'SIMONE', t: '"P.S.: Fico. Me chamaram pra supervisão. Ninguém sabe ainda."' });
    else if (st === 'demitida') ps.push({ who: 'SIMONE', t: '"P.S.: Dia 31 é o meu último dia. Não conta pra ninguém."' });
    else if (st === 'assinou') ps.push({ who: 'SIMONE', t: '"P.S.: Vou sentir falta do fone."' });
    else ps.push({ who: 'SIMONE', t: '"P.S.: Fico. Por enquanto. Segunda a gente se vê."' });
    if (c.flag('promessa_remedio') || (c.flag('receita_nova') && c.v('pressao') <= 6)) ps.push({ who: 'SIMONE', t: '"P.P.S.: Tô tomando o remédio da pressão. Todo dia. O Wesley conta."' });
    return cena('s20_fim', 'central', {
      start: {
        onEnter: (e) => {
          if (h) e.set('henrique_fim', vivo ? 'vivo' : 'morto');
          if (bene) e.set('bene_ultima_simone');
        },
        lines: [{ who: 'NARRADOR', t: '19:25. A fila está vazia. Pela primeira vez em vinte dias, nenhuma luz pisca no telefone da TARM.' }, ...desfecho],
        next: 'bene',
      },
      bene: {
        lines: [
          bene ? { who: 'BENE', t: 'Central, USA 01. Paciente entregue. Viatura limpa, tanque cheio pro próximo. A última foi com vocês. Eu queria que fosse.' } : { who: 'BENE', t: 'Central, USA 01 na base. Não deu pra ser a gente na última. Tudo bem. A última de verdade é a que chega.' },
          { who: 'BENE', t: 'E obrigado pelo bolo, Simoninha. Tava com gosto de 2019 antes de 2019.', when: () => c.flag('bolo_feito') },
          { who: 'BENE', t: 'USA 01, Benedito. QRT. Desligando.' },
          { who: 'NARRADOR', t: 'O rádio chia mais um segundo. Depois, o silêncio de um rádio desligado de propósito.' },
        ],
        next: 'postit',
      },
      postit: {
        lines: [{ who: 'NARRADOR', t: 'Na bolsa, o post-it em branco. A caneta. A Mesa 1 vazia, com a jaqueta d{o} {dr} no encosto.' }],
        choices: [
          { label: '"{Dr}: os post-its eram meus. As decisões eram suas. Foi uma honra ouvir você trabalhar. — S."', next: 'ps', effect: fx.set('ultimo_postit', 'honra') },
          { label: '"Bom plantão, {dr}. Até segunda. Ou não. — S."', next: 'ps', effect: fx.set('ultimo_postit', 'segunda') },
          { label: '"Seu café ficou na minha mesa de novo. — S."', next: 'ps', effect: fx.set('ultimo_postit', 'cafe') },
        ],
      },
      ps: {
        lines: [
          ...ps,
          { who: 'NARRADOR', t: 'Ela cola o post-it no fone da Mesa 1, pega a bolsa e a forma vazia do bolo, e vai pro ponto.' },
          { who: 'NARRADOR', t: 'O ônibus da Av. Brasil passa às oito e dez.' },
        ],
      },
    });
  },
  bills: contas(),
  // depois do dia 20 vem o final; a noite nunca é mostrada (o tipo exige uma cena)
  night: (c) => noite(c, 's20_noite', 'sala', { start: { lines: [{ who: 'NARRADOR', t: 'Sexta à noite. A casa 2 está quieta.' }] } }),
};

export const DAYS_14_20: SimoneDayDef[] = [D14, D15, D16, D17, D18, D19, D20];
