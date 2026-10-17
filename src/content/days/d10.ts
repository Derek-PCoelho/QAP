// =============================================================================
// DIA 10 — "Ninguém é Bobo" (trotes sofisticados)
// Os trotistas evoluem: endereço real, voz calma, história plausível. "Ligar de
// volta" vira ferramenta essencial, e a pré-triagem da Simone passa a errar mais.
// Armadilha invertida: o homem que ri de nervoso é um AVC de verdade.
// Fios: 🌾 Dona Zélia (hipoglicemia — Modo Inconsistência doméstico, GDD 9.1)
//       ↺ Henrique (atende a sua família se a Zélia cair) · ↺ Biel (9-8877)
//       ↺ Cida (a aliança que ela vendeu × a aliança que a Zélia oferece)
// =============================================================================
import type { Choice, Ctx, Effect, SceneDef } from '../../engine/types';
import type { GuideScript } from '../../engine/content-api';
import { day, call, fx, is, NUM, ADDR } from '../dsl';
import { temFolga, dinheiroVereador, falaLiam } from '../home-base';

/** recurso carimbado numa ligação do dia (lido nos ganchos onStamp) */
const carimbo = (c: Ctx, defId: string) => (c.s.shift ? Object.values(c.s.shift.calls).find((x) => x.def === defId)?.decision?.resource : undefined);

/** o 9-8877 já está no quadro de trotes? */
const bielNoQuadro = (c: Ctx) => c.s.board.some((b) => b.id === 'n98877');

// -----------------------------------------------------------------------------
// Orientação ativa da ligação 4 (pai com a filha). Tom cuidadoso, sem detalhe
// da lesão, foco na compressão, na presença e em não julgar.
// Conferido (campo A5: compressão contínua, não retirar o pano encharcado, pôr outro por cima; deitar com
// as pernas elevadas se ficar pálida e tonta; A15: não deixar sozinha, não julgar).
// -----------------------------------------------------------------------------
export const GUIDES_EXTRA: Record<string, GuideScript> = {
  d10_compressao: {
    id: 'd10_compressao',
    title: 'Compressão e presença',
    kind: 'dialogo',
    intro: 'Oriente a compressão e fique com o pai. Instruções simples, sem pressa e sem julgamento: ele precisa de alguém do outro lado da linha.',
    panic: 70,
    card: 'CVV — Centro de Valorização da Vida · ligue 188 (24h, gratuito) · cvv.org.br. Em emergência médica, ligue para o serviço de emergência da sua cidade.',
    steps: [
      {
        who: 'PAI',
        say: 'A toalha tá ficando vermelha... eu não sei se tô fazendo certo.',
        options: [
          { label: 'Está fazendo certo. Aperte firme a toalha em cima do machucado, com a mão espalmada, e não solte.', kind: 'certo' },
          { label: 'Tira a toalha um instante pra ver o tamanho do corte.', kind: 'errado', reply: 'Voltou a sangrar mais! Eu pus de novo, eu pus de novo!' },
          { label: 'Respira, Seu Sérgio. Eu estou aqui com o senhor, e a equipe já saiu.', kind: 'calma' },
        ],
      },
      {
        who: 'PAI',
        say: 'Ela fica pedindo desculpa. Fica falando "desculpa, pai".',
        options: [
          { label: 'Diz pra ela que ela não precisa pedir desculpa. Que o senhor está ali e não vai sair.', kind: 'certo' },
          { label: 'Pergunta pra ela por que ela fez isso.', kind: 'errado', reply: '[ela começa a chorar mais alto] ...Ela virou o rosto, {dr}.' },
          { label: 'Fala pra ela que foi bobagem, que isso passa.', kind: 'errado', reply: 'Ela fechou o olho. Não quer mais olhar pra mim.' },
        ],
      },
      {
        who: 'PAI',
        say: 'Molhou a toalha toda. Pego outra?',
        options: [
          { label: 'Não tire essa. Põe a outra por cima e continua apertando.', kind: 'certo' },
          { label: 'Troca por uma seca.', kind: 'errado', reply: 'Quando eu tirei, voltou...' },
          { label: 'O senhor está indo muito bem.', kind: 'calma' },
        ],
      },
      {
        who: 'PAI',
        say: 'Ela tá branquinha. Disse que tá tonta.',
        options: [
          { label: 'Deita ela no chão mesmo, com as pernas um pouco pra cima, e continua apertando o braço.', kind: 'certo' },
          { label: 'Dá um copo de água com açúcar pra ela.', kind: 'errado' },
          { label: 'Levanta ela e leva pro sofá.', kind: 'errado', reply: 'Ela quase caiu quando levantou!' },
        ],
      },
      {
        who: 'PAI',
        say: 'Eu não vi, {dr}. Ela tava quieta faz meses e eu achei que era da idade.',
        options: [
          { label: 'O senhor viu agora, e está do lado dela. É isso que importa agora.', kind: 'certo' },
          { label: 'É... os pais precisam prestar mais atenção.', kind: 'errado', reply: '[silêncio. Depois, um soluço.]' },
          { label: 'Respira comigo. Ela está ouvindo a sua voz.', kind: 'calma' },
        ],
      },
      {
        who: 'PAI',
        say: 'Tão batendo no portão! Chegaram!',
        options: [
          { label: 'Abre pra eles e vai junto com ela na ambulância. Não solta a mão dela.', kind: 'certo' },
          { label: 'Deixa ela com a equipe e espera em casa.', kind: 'errado' },
        ],
      },
    ],
    success: 'A equipe encontrou a Bianca acordada, com o sangramento contido, e o pai ainda apertando a toalha.',
    fail: 'A equipe chegou. Foi difícil, mas ela estava acordada, e o pai não saiu do lado dela.',
  },
};

// -----------------------------------------------------------------------------
// Casa — a hipoglicemia da Dona Zélia ("reparar"), a aliança (ROTEIRO 3.1-e, por faixa × origem do dinheiro)
// e, se ninguém percebeu, a queda das 22:00 com a ligação INTERATIVA para a Regulação (ROTEIRO 3.2).
// -----------------------------------------------------------------------------
const ESCOLHAS_ZELIA: Choice[] = [
  // zelia_ligou_almoco: ela mesma contou "arroz com ovo" ao meio-dia — a pista fica à vista, sem precisar reparar
  { label: '"Mãe, a senhora me disse no telefone que comeu arroz com ovo. O prato tá seco."', when: is.flag('zelia_ligou_almoco'), next: 'confissao' },
  { label: '"Mãe, o prato tá seco. A senhora aplicou a insulina e não comeu?"', needLink: 'prato', next: 'confissao' },
  { label: '"Mãe, a sua mão tá tremendo. Isso é açúcar baixo."', needLink: 'hipo', next: 'confissao_hipo' },
  { label: 'Que bom, mãe. (Sentar e tomar o café.)', next: 'ignora' },
];

const ESCOLHAS_SUCO: Choice[] = [
  { label: '"Toma o suco agora. Agora, mãe."', affectionate: true, next: 'suco' },
  { label: '"A senhora não pode fazer isso! A senhora quer morrer?"', next: 'bronca' },
];

/** quem pode corrigir o endereço na noite da queda */
const temBene = (c: Ctx) => c.flag('tel_bene') || c.flag('promessa_bene') || c.flag('bene_mapa_guardanapo') || c.v('intimBene') >= 4;

/** espera da USB na queda (min) → risco da Zélia e conta (ROTEIRO 3.2) */
function esperaZelia(min: number, ze = false): Effect {
  return (e) => {
    e.set('zelia_espera', min);
    const risco = ze || min <= 15 ? 1 : min >= 40 ? 3 : 2;
    e.s.family.zelia.risk += risco;
  };
}

const ZELIA_SCENE = (c: Ctx): SceneDef => {
  // faixa do saldo e origem do dinheiro lidas quando a cena abre (antes das contas)
  const folga = temFolga(c);
  const vereador = folga && dinheiroVereador(c);
  const liam = is.present('davi')(c);
  return {
    id: 'd10_zelia',
    bg: 'cozinha',
    cast: ['ZELIA', 'LUCIA', 'DAVI'],
    nodes: {
      start: {
        lines: [
          // 1.1 (calendário): o plantão acaba às sete; é começo da noite
          { who: 'NARRADOR', t: 'Cozinha. Começo da noite. Você chega com o pão da padaria do Toninho; a casa está quieta. A Dona Zélia está sentada de costas para a pia.' },
          { who: 'ZELIA', t: 'Chegou, {filho}? Hoje até que não demorou. Senta, tem café requentado.' },
          { who: 'EU', t: 'A senhora almoçou, mãe?' },
          { who: 'ZELIA', t: '{{Almocei, almocei|almocei}}. Arroz com ovo. Tava uma delícia.' },
          { who: 'NARRADOR', t: 'Arroz com ovo. Foi exatamente o que ela disse ao telefone, às treze e dez. Com as mesmas palavras.', when: is.flag('zelia_ligou_almoco') },
          { who: 'NARRADOR', t: '{{Uma gota de suor desce pela têmpora dela|suor}}, devagar. A janela está aberta e a noite já esfriou.' },
          { who: 'ZELIA', t: '{{Tô ótima, {filho}. Para de me olhar com essa cara de plantão.|otima}}' },
        ],
        choices: [ESCOLHAS_ZELIA[0], ESCOLHAS_ZELIA[1], ESCOLHAS_ZELIA[2], { label: '"Almoçou mesmo, mãe?"', next: 'insiste' }, ESCOLHAS_ZELIA[3]],
      },
      insiste: {
        lines: [
          { who: 'ZELIA', t: 'Almocei, {filho}. Quer que eu desenhe? Arroz, ovo, um tomatinho. Pronto.' },
          { who: 'NARRADOR', t: 'Ela sorri. A xícara, na mão dela, faz um tlec-tlec miúdo contra o pires.' },
        ],
        choices: ESCOLHAS_ZELIA,
      },
      confissao: {
        lines: [
          { who: 'ZELIA', t: '(pausa) ...É que o arroz tava acabando. O menino precisa mais do que eu.' },
          { who: 'NARRADOR', t: 'Ela fala olhando para a xícara. A mão não para.' },
        ],
        choices: ESCOLHAS_SUCO,
      },
      confissao_hipo: {
        lines: [
          { who: 'ZELIA', t: 'Tremendo nada. É o café requentado, que é forte.' },
          { who: 'NARRADOR', t: 'A xícara bate no pires. Ela põe a xícara na mesa e esconde a mão no colo.' },
          { who: 'ZELIA', t: '(pausa) ...Não almocei, não. O arroz tava acabando. O menino precisa mais do que eu.' },
        ],
        choices: ESCOLHAS_SUCO,
      },
      suco: {
        onEnter: fx.all(fx.set('zelia_hipo_percebida'), fx.add('lacos', 1, 'ouviu a sua mãe'), fx.ach('ouvir_a_familia')),
        lines: [
          { who: 'NARRADOR', t: 'Ela não discute. Estica o braço, tira o copo de trás da lata de açúcar e bebe em goles pequenos, de olhos fechados.' },
          { who: 'ZELIA', t: 'Como é que você sabia do suco?' },
          { who: 'EU', t: 'Eu passo doze horas por dia ouvindo gente dizer que tá ótima, mãe.' },
          { who: 'ZELIA', t: '...E eu achando que enganava {m:o médico|a médica}.' },
          { who: 'NARRADOR', t: 'Dez minutos depois, o tremor passa. Você frita o último ovo e divide no meio. Ela come a metade dela devagar, e você finge que não está contando as garfadas.' },
          { who: 'ZELIA', t: 'Tá salgado.' },
          { who: 'EU', t: 'Tá perfeito.' },
          { who: 'ZELIA', t: 'Tá salgado e tá perfeito. Pode ser as duas coisas, {filho}.' },
        ],
        next: 'dinheiro',
      },
      bronca: {
        onEnter: fx.all(fx.set('zelia_hipo_percebida'), fx.set('zelia_fechada'), fx.add('lacos', -1, 'a bronca')),
        lines: [
          { who: 'ZELIA', t: 'Não grita comigo, {nome}. Eu sou sua mãe, não sou ligação.' },
          { who: 'NARRADOR', t: 'Ela bebe o suco que estava escondido atrás da lata de açúcar. O tremor passa. Mas ela não olha mais pra você.' },
          { who: 'ZELIA', t: 'Pronto. Bebi. {m:Satisfeito|Satisfeita}?' },
          { who: 'NARRADOR', t: 'Ela lava duas vezes uma xícara que já estava limpa. Você entende, tarde demais, que da próxima vez ela vai esconder melhor.' },
        ],
        next: 'dinheiro',
      },
      ignora: {
        lines: [
          { who: 'NARRADOR', t: 'Você toma o café requentado. Conta do dia na central: a ligação da igreja, o homem que ria de nervoso. Ela ri nas horas certas.' },
          { who: 'ZELIA', t: 'Vai tomar um banho, {filho}. Você tá com cheiro de central.' },
          { who: 'NARRADOR', t: 'No jantar, ela empurra o prato pro lado.' },
          { who: 'ZELIA', t: 'Já belisquei na vizinha. Comam vocês.' },
        ],
        next: 'dinheiro',
      },
      // ROTEIRO 3.1-e: a aliança muda com o dinheiro que existe (aperto/justo → oferece; folga sem vereador → guarda
      // mais um mês; folga/sobra com o dinheiro do vereador → põe na mesa a aliança e a cinta do banco)
      dinheiro: vereador
        ? {
            lines: [
              { who: 'NARRADOR', t: 'Mais tarde, com o Liam dormindo, a Dona Zélia põe na mesa duas coisas: uma caixinha de veludo vermelho, gasta nos cantos, e uma cinta de papel de banco, amassada.' },
              { who: 'NARRADOR', t: 'Na cinta, carimbado: "Câmara Municipal — Gab. 7". Ela achou no lixo da cozinha.' },
              { who: 'ZELIA', t: 'A aliança do seu pai. Eu ia vender pro Seu Jacó. Aí eu fui jogar a casca de batata fora e achei isso.' },
              { who: 'ZELIA', t: 'Teu pai devolvia troco errado de padaria. Isso aqui é o quê, {filho}?' },
            ],
            choices: [
              { label: '"Foi um agradecimento do vereador."', next: 'contou_vereador' },
              { label: '"É nosso agora, mãe."', next: 'nosso', effect: fx.add('lacos', -1, 'é nosso agora') },
              { label: '"Vou devolver."', next: 'devolver', effect: fx.set('prometeu_devolver') },
            ],
          }
        : folga
          ? {
              onEnter: fx.set('zelia_contou_alianca'),
              lines: [
                { who: 'NARRADOR', t: 'Mais tarde, com o Liam dormindo, a Dona Zélia põe na mesa uma caixinha de veludo vermelho, gasta nos cantos. Abre. Fecha.' },
                { who: 'ZELIA', t: 'Eu ia te oferecer a aliança do seu pai. Ouro dezoito. O Seu Jacó dá duzentos, eu fui lá perguntar.' },
                { who: 'ZELIA', t: 'Mas vocês tão respirando um pouco agora. Eu guardo mais um mês.' },
                { who: 'ZELIA', t: 'Ele me deu isso dentro de um ônibus, sabia? O doze. Não tinha dinheiro pro jantar, então me deu no ônibus mesmo, na frente de todo mundo. Ficou vermelho, o bobo.' },
                { who: 'ZELIA', t: 'O motorista parou no meio da avenida pra ele terminar de falar. Hoje prendiam.' },
                { who: 'NARRADOR', t: 'Ela guarda a caixinha no bolso do avental e dá dois tapinhas por cima, como quem acalma um bicho.' },
              ],
              next: 'noite',
            }
          : {
              lines: [
                { who: 'NARRADOR', t: 'Mais tarde, com o Liam dormindo, a Dona Zélia põe na mesa uma caixinha de veludo vermelho, gasta nos cantos.' },
                { who: 'ZELIA', t: 'Eu falei que vendia alguma coisa. Falei sério.', when: is.not('bombinha') },
                { who: 'ZELIA', t: 'Ontem foi o susto do menino. Amanhã é o aluguel. Eu sei fazer conta, {filho}. Fiz.', when: is.flag('bombinha') },
                { who: 'ZELIA', t: 'A aliança do seu pai. Ouro dezoito. O Seu Jacó, da joalheria da XV, dá duzentos. Eu já fui lá perguntar.' },
                { who: 'ZELIA', t: 'Seu pai ia preferir ver o neto respirando do que ver isso aqui dentro de uma gaveta.' },
              ],
              choices: [
                { label: 'Aceitar a aliança.', next: 'vende', effect: fx.all(fx.money(200, 'A aliança do seu pai'), fx.add('lacos', -1, 'a aliança'), fx.set('alianca_vendida'), fx.set('alianca_vendida_dia', 10)) },
                { label: '"Guarda, mãe. Isso não se vende."', next: 'guarda' },
              ],
            },
      contou_vereador: {
        lines: [
          { who: 'ZELIA', t: 'Agradecimento de quê? Você mandou a ambulância pra mãe dele?' },
          { who: 'NARRADOR', t: 'Você não responde rápido o bastante.', when: is.flag('d7_vereador_usa') },
          { who: 'ZELIA', t: 'Mandou. Eu sabia.', when: is.flag('d7_vereador_usa') },
          { who: 'ZELIA', t: 'Não mandou? Então ele pagou pelo quê, {filho}? Pelo que você ainda vai fazer?', when: is.not('d7_vereador_usa') },
          { who: 'NARRADOR', t: 'Ela guarda a aliança no bolso do avental. A cinta fica na mesa, entre vocês dois, até alguém jogar fora de novo.' },
        ],
        onEnter: fx.when(is.flag('d7_vereador_usa'), fx.add('integridade', -1, 'a mãe sabia')),
        next: 'noite',
      },
      nosso: {
        onEnter: fx.all(fx.set('zelia_alianca_sutia'), fx.set('zelia_contou_alianca')),
        lines: [
          { who: 'ZELIA', t: '(guarda a aliança dentro do sutiã, devagar) Então essa aqui é minha.' },
          { who: 'ZELIA', t: 'Ele me deu dentro de um ônibus, o doze. O motorista parou no meio da avenida. Ninguém pagou ele pra isso, {filho}. Ninguém.' },
        ],
        next: 'noite',
      },
      devolver: {
        onEnter: fx.set('zelia_contou_alianca'),
        lines: [
          { who: 'ZELIA', t: 'Devolve. Eu vou perguntar. Toda semana eu vou perguntar.' },
          { who: 'ZELIA', t: '(abre a caixinha, olha a aliança) Teu pai me deu isso dentro de um ônibus. Ficou vermelho, o bobo. O motorista parou no meio da avenida. Hoje prendiam.' },
          { who: 'NARRADOR', t: 'Ela fecha a caixinha e leva com ela. Não oferece mais.' },
        ],
        next: 'noite',
      },
      vende: {
        onEnter: fx.set('zelia_contou_alianca'),
        lines: [
          { who: 'NARRADOR', t: 'Ela empurra a caixinha pra você. Antes de soltar, abre uma última vez.' },
          { who: 'ZELIA', t: 'Ele me deu isso dentro de um ônibus. O doze. Não tinha dinheiro pro jantar, então me deu no ônibus mesmo, na frente de todo mundo. Ficou vermelho, o bobo.' },
          { who: 'ZELIA', t: 'O motorista parou no meio da avenida pra ele terminar. Hoje prendiam.' },
          { who: 'ZELIA', t: 'Vende amanhã cedo, {filho}. Antes de eu me arrepender.' },
          { who: 'NARRADOR', t: 'Você guarda a caixinha no bolso do jaleco. Pesa mais do que devia.' },
          { who: 'NARRADOR', t: 'Você lembra da Dona Cida, de manhã, no telefone: "Ouro a gente vende uma vez só. Depois fica o dedo pelado, contando história."', when: is.flag('cida_conversou_d10') },
        ],
        next: 'noite',
      },
      guarda: {
        onEnter: fx.set('zelia_contou_alianca'),
        lines: [
          { who: 'NARRADOR', t: 'Você fecha a caixinha e devolve. Ela segura a sua mão por cima do veludo.' },
          { who: 'EU', t: 'Uma senhora me disse hoje, no telefone, que ouro a gente vende uma vez só.', when: is.flag('cida_conversou_d10') },
          { who: 'ZELIA', t: 'Senhora sabida. Deve ser lá da igreja.', when: is.flag('cida_conversou_d10') },
          { who: 'ZELIA', t: '{m:Teimoso|Teimosa} igual a ele. Ele me deu isso dentro de um ônibus, sabia? O motorista parou no meio da avenida. Hoje prendiam.' },
          { who: 'ZELIA', t: 'Então faz um trato comigo: eu como direito, e você para de olhar pra minha mão.', when: is.all(is.flag('zelia_hipo_percebida'), is.not('zelia_fechada')) },
          { who: 'NARRADOR', t: 'Ela guarda a caixinha no bolso do avental.' },
        ],
        next: 'noite',
      },
      noite: {
        onEnter: (e) => {
          if (e.flag('zelia_hipo_percebida')) return;
          // não percebeu / ignorou: a queda das 22:00 (o risco depende de quanto a ambulância demora: ver escolhas)
          e.set('zelia_caiu_d10');
          e.set('henrique_atendeu_zelia');
          e.add('desgaste', 10, 'a queda da sua mãe');
          if (is.present('davi')(e)) e.set('davi_viu_queda');
        },
        lines: [
          { who: 'NARRADOR', t: 'Antes de dormir, ela bate na porta do seu quarto: "Jantei. Arroz, feijão e um tomate. Pode dormir, {dr}."', when: is.all(is.flag('zelia_hipo_percebida'), is.not('zelia_fechada')) },
          { who: 'NARRADOR', t: 'Antes de dormir, você ouve a geladeira abrir e fechar. Ela comeu sozinha, no escuro, pra você não ver.', when: is.flag('zelia_fechada') },
          { who: 'NARRADOR', t: '21:58. O Ozzy late para a porta do banheiro. Duas vezes. Ninguém entende por quê.', when: is.flag('zelia_caiu_d10') },
          { who: 'NARRADOR', t: '22:00. Um barulho seco no banheiro. Depois, nada.', when: is.flag('zelia_caiu_d10') },
          { who: 'LUCIA', t: '{nome}! A sua mãe!', when: is.all(is.flag('zelia_caiu_d10'), is.present('lucia')) },
          { who: 'NARRADOR', t: 'Ela está no chão do banheiro, encharcada de suor, os olhos abertos e perdidos. Responde com palavras soltas. Um galo começa a subir na testa.', when: is.flag('zelia_caiu_d10') },
          { who: 'DAVI', t: '(na porta, de pijama) Vó? Vó, acorda...', when: is.all(is.flag('zelia_caiu_d10'), is.present('davi')) },
          // [validar] confusa mas engolindo: açúcar umedecido na mucosa da bochecha, em pequenas porções, cabeça de
          // lado; nada de copo "goela abaixo" com a consciência alterada (protocolos de hipoglicemia, campo A15)
          { who: 'NARRADOR', t: 'Atrás da lata de açúcar, um copo de suco cheio, escondido. Você não dá o copo: ela não está acordada o bastante para beber de goles.', when: is.flag('zelia_caiu_d10') },
          { who: 'NARRADOR', t: 'Ela engole quando você encosta a colher. Açúcar umedecido por dentro da bochecha, um pouquinho de cada vez, com a cabeça dela de lado no seu colo.', when: is.flag('zelia_caiu_d10') },
          { who: 'NARRADOR', t: 'Ela bateu a cabeça na pia. Você liga para a emergência do seu próprio celular.', when: is.flag('zelia_caiu_d10') },
          { who: 'VOZ', t: 'R-Regulação... Dr. Henrique... o que aconteceu?', when: is.flag('zelia_caiu_d10') },
          { who: 'NARRADOR', t: 'A voz é lenta. Arrastada. As sílabas escorregam umas nas outras.', when: is.flag('zelia_caiu_d10') },
          { who: 'NARRADOR', t: 'De manhã você sentiu o cheiro. Agora você ouve o cheiro.', when: is.all(is.flag('zelia_caiu_d10'), is.flag('henrique_cheiro_d10')) },
          { who: 'EU', t: 'Henrique, sou eu. {nome}. Minha mãe: diabética, hipoglicemia, caiu e bateu a cabeça. Rua das Acácias, 40, Vila Esperança.', when: is.flag('zelia_caiu_d10') },
          { who: 'HENRIQUE', t: 'Tá. ...Repete o número? ...Quarenta. Tá. Palmeiras, quarenta. Tá indo.', when: is.flag('zelia_caiu_d10') },
          { who: 'NARRADOR', t: 'Palmeiras. Ele disse Palmeiras. A Rua das Palmeiras fica do outro lado da Vila.', when: is.flag('zelia_caiu_d10') },
        ],
        choices: [
          { label: '"Acácias, Henrique. A-cá-cias. Repete pra mim."', when: is.flag('zelia_caiu_d10'), next: 'q_repete', effect: fx.all(fx.set('zelia_henrique_corrigido'), esperaZelia(25)) },
          { label: '"Me passa a TARM."', when: is.flag('zelia_caiu_d10'), next: 'q_tarm', effect: fx.all(fx.set('zelia_tarm_corrigiu'), esperaZelia(20)) },
          { label: 'Desligar e ligar para o Bené. (O número dele está na carteira.)', when: (cc) => cc.flag('zelia_caiu_d10') && temBene(cc), next: 'q_bene', effect: fx.all(fx.set('zelia_bene_corrigiu'), fx.add('intimBene', 1, 'o Bené corrigiu pelo rádio'), esperaZelia(15)) },
          { label: 'Ligar para o Zé Carlos, três ruas pra cima.', when: (cc) => cc.flag('zelia_caiu_d10') && cc.flag('tel_ze_carlos'), next: 'q_ze', effect: fx.all(fx.set('zelia_ze_carlos'), esperaZelia(25, true)) },
          { label: '(Não insistir. Ele já disse que tá indo.)', when: is.flag('zelia_caiu_d10'), next: 'q_espera', effect: esperaZelia(40) },
        ],
      },
      q_repete: {
        lines: [
          { who: 'HENRIQUE', t: 'A-cá-cias. Acácias, quarenta. Desculpa. ...Tá. Tá indo.' },
          { who: 'NARRADOR', t: 'Você ouve ele digitar do outro lado. Devagar demais.' },
          { who: 'NARRADOR', t: '22:32. A USB 01 encosta no portão. A Joana desce correndo, o prendedor de borboleta torto.' },
          { who: 'JOANA', t: 'Desculpa a demora, {dr}. O endereço chegou trocado e depois chegou certo. Vinte e cinco minutos. Bateu a cabeça? Ela tá falando, que bom.' },
        ],
        next: 'bilhete',
      },
      q_tarm: {
        lines: [
          { who: 'NARRADOR', t: 'Silêncio na linha. Um clique. Uma voz de mulher, rápida.' },
          { who: 'CLEIDE', t: 'TARM do noturno, Cleide. Acácias, quarenta, casa azul, perto da base da Vila. Anotado, {dr}. Desculpa.' },
          { who: 'NARRADOR', t: '22:20. A USB 01 encosta no portão. A Joana pula da viatura antes de ela parar.' },
          { who: 'JOANA', t: 'Vinte minutos, {dr}. A Cleide gritou o endereço certo no rádio duas vezes. Deixa eu ver ela.' },
        ],
        next: 'bilhete',
      },
      q_bene: {
        lines: [
          { who: 'NARRADOR', t: 'Você desliga na cara da Regulação pela primeira vez na vida e liga para o número da carteira. Atende no segundo toque.' },
          { who: 'BENÉ', t: '(voz de quem dormia) Fala, {bene}. ...Acácias? A casa azul? Deixa comigo.' },
          { who: 'NARRADOR', t: 'Ele não desliga. Você ouve, pelo telefone dele, o rádio velho da base pegando a frequência da USB 01.' },
          { who: 'BENÉ', t: 'Joana, é o Bené. Não é Palmeiras. É Acácias, quarenta. A casa azul do doutor. Corre.' },
          { who: 'NARRADOR', t: '22:15. A USB 01 encosta no portão. Quinze minutos.' },
          { who: 'JOANA', t: 'O Bené gritou no rádio de pijama, {dr}. Nunca vi isso. Cadê ela?' },
        ],
        next: 'bilhete',
      },
      q_ze: {
        lines: [
          { who: 'NARRADOR', t: 'O Zé Carlos atende no primeiro toque, com a televisão alta atrás.' },
          { who: 'ZÉ CARLOS', t: 'Moro a três ruas. Tô indo. ...Ela engole? Então açúcar na bochecha, devagar, que nem você tá fazendo. Não para.' },
          { who: 'NARRADOR', t: '22:06. Palmas no portão. O Zé Carlos de chinelo, bermuda e o glicosímetro da mulher na mão. Ele ajoelha no chão do banheiro como quem ajoelha numa calçada.' },
          { who: 'ZÉ CARLOS', t: 'Trinta e oito. Subindo. Ela tá voltando, {dr}. Bate aqui no meu ombro, Dona Zélia. Isso.' },
          { who: 'NARRADOR', t: 'A USB chega às 22:32, com o endereço consertado no meio do caminho. Quando a Joana entra, a sua mãe já está sentada, pedindo desculpa pela camisola.' },
        ],
        next: 'bilhete',
      },
      q_espera: {
        lines: [
          { who: 'NARRADOR', t: 'Você espera. Dez minutos. Vinte. Lá fora, uma sirene passa na rua de cima, devagar, procurando número, e vai embora.' },
          { who: 'NARRADOR', t: 'Da janela da frente, a Dona Dirce grita para a rua vazia: "É NA ACÁCIAS!"' },
          { who: 'JOANA', t: 'Desculpa a demora, {dr}. O noturno passou "Rua das Palmeiras". A gente rodou a Vila inteira.' },
          { who: 'NARRADOR', t: 'Quarenta minutos. A sua mãe sai na maca da USB 01, acordada, pedindo desculpa pela camisola.' },
        ],
        next: 'bilhete',
      },
      bilhete: {
        lines: [
          { who: 'NARRADOR', t: 'Da porta do quarto, o Liam viu tudo: a vó no chão, o telefone, a sirene que não achava a rua. Ele não chorou. Ficou olhando.', when: () => liam },
          { who: 'NARRADOR', t: 'Em cima da mesa da cozinha, o papel do pão, ainda com farelo. E uma caneta.' },
        ],
        choices: [
          { label: '(Anotar no papel do pão: hora, voz, endereço trocado.)', next: 'anotou' },
          { label: '(Não pensar nisso agora.)', next: 'upa' },
        ],
      },
      anotou: {
        onEnter: fx.all(fx.set('anotou_henrique_d10'), fx.set('bilhete_origem', 'papel')),
        lines: [
          { who: 'NARRADOR', t: 'Você escreve com a mão que ainda treme: "22:07. Henrique. Voz arrastada. Pediu o número duas vezes. Passou Palmeiras em vez de Acácias."' },
          { who: 'NARRADOR', t: 'Dobra o papel de pão em quatro e guarda no bolso do jaleco. Não sabe pra quem ele serve. Ainda.' },
        ],
      },
      upa: {
        lines: [
          { who: 'NARRADOR', t: 'Você passa a madrugada na sala de espera da UPA, segurando a mão da sua mãe. A voz arrastada fica no fundo da cabeça, como uma ligação que ninguém desligou.', when: (cc) => (Number(cc.val('zelia_espera')) || 40) >= 20 && !cc.flag('zelia_ze_carlos') },
          { who: 'NARRADOR', t: 'A equipe faz o curativo da testa ali mesmo, mede o açúcar duas vezes e deixa ela em casa, com a recomendação de não ficar sozinha. Você não dorme. A voz arrastada fica no fundo da cabeça.', when: (cc) => (Number(cc.val('zelia_espera')) || 40) < 20 || cc.flag('zelia_ze_carlos') },
        ],
      },
    },
    inspect: {
      objects: [
        { id: 'prato_seco', label: 'Prato no escorredor', desc: (cc) => (cc.flag('zelia_ligou_almoco') ? '"Arroz com ovo", ela disse ao telefone, às treze e dez. O único prato do escorredor está limpo e seco: nem uma gota da torneira. Ninguém comeu nele hoje.' : 'Um prato no escorredor. Limpo e seco: nem uma gota da torneira. Ninguém comeu nele hoje.'), x: 20, y: 84, w: 30, h: 14 },
        { id: 'xicara', label: 'A xícara de café', desc: 'A xícara treme na mão direita dela. O café faz ondinhas. Quando percebe que você olhou, ela segura com as duas mãos.', x: 150, y: 104, w: 14, h: 12 },
        {
          id: 'insulina',
          label: 'Insulina',
          desc: (cc) =>
            cc.flag('geladeira_quebrada') && !cc.flag('geladeira_ok')
              ? 'A caixa de isopor aberta em cima da mesa, o gelo virando água. A caneta de insulina está fora, sem a tampa, com um algodão usado do lado: ela aplicou a dose do almoço.'
              : 'A caneta de insulina em cima da mesa, ao lado do açucareiro, sem a tampa. Um algodão usado do lado: ela aplicou a dose do almoço.',
          x: 178,
          y: 100,
          w: 24,
          h: 16,
        },
        { id: 'lata_acucar', label: 'Lata de açúcar', desc: 'A lata de açúcar na prateleira, fora do lugar: puxada pra frente, torta, como se alguém tivesse escondido alguma coisa atrás dela com pressa.', x: 248, y: 56, w: 18, h: 22 },
        { id: 'suco_escondido', label: 'Copo atrás da lata', desc: 'Atrás da lata de açúcar, um copo de suco de laranja, cheio até a borda. Escondido. Ela sabe exatamente o que está sentindo.', x: 268, y: 60, w: 12, h: 18 },
      ],
      links: [
        { a: 'almocei', b: 'prato_seco', insight: '"Almocei, almocei"... e o único prato do escorredor está seco, sem uma gota. Ninguém comeu nele hoje.', unlock: 'prato' },
        { a: 'prato_seco', b: 'insulina', insight: 'Insulina do almoço aplicada e prato sem uso: ela tomou a dose e não comeu.', unlock: 'prato' },
        { a: 'xicara', b: 'insulina', insight: 'A mão tremendo na xícara e a insulina do almoço aplicada. Hipoglicemia: igual à mãe do dia 6.', unlock: 'hipo' },
        { a: 'suor', b: 'insulina', insight: 'Suor frio com a janela aberta e a insulina do almoço aplicada. Hipoglicemia: igual à mãe do dia 6.', unlock: 'hipo' },
        { a: 'suor', b: 'xicara', insight: 'Suor frio e mão tremendo: o corpo dela está pedindo açúcar.', unlock: 'hipo' },
        { a: 'otima', b: 'xicara', insight: '"Tô ótima", com a xícara batendo no pires.', unlock: 'hipo' },
        { a: 'lata_acucar', b: 'suco_escondido', insight: 'Um copo de suco escondido atrás da lata de açúcar. Ela sabe que está baixando, e está escondendo de você.', unlock: 'hipo' },
      ],
    },
  };
};

const BICO_SCENE: SceneDef = {
  id: 'd10_bico',
  bg: 'preto',
  cast: ['LUCIA', 'ZELIA'],
  nodes: {
    start: {
      onEnter: (e) => {
        e.set('zelia_caiu_d10');
        e.s.family.zelia.risk += 3;
        if (is.present('lucia')(e)) e.set('henrique_atendeu_zelia');
      },
      lines: [
        { who: 'NARRADOR', t: '00:50. A USA 01 deixa o último paciente no Regional.', when: is.present('lucia') },
        { who: 'NARRADOR', t: 'Na observação, numa maca, de camisola, com um galo na testa: a Dona Zélia. A USB 03 trouxe ela às dez da noite. Ela te reconhece primeiro.', when: is.present('lucia') },
        { who: 'LUCIA', t: '{nome}, a sua mãe caiu no banheiro. Tava suando, falando coisa sem sentido. Eu achei um suco escondido atrás da lata de açúcar e dei de golinho, só quando ela conseguia engolir. Ela engoliu.', when: is.present('lucia') },
        { who: 'LUCIA', t: 'Eu liguei pra emergência. O médico que atendeu... {nome}, ele tava estranho. Falava devagar, perguntou o número da casa duas vezes. Disse que era o Dr. Henrique.', when: is.present('lucia') },
        { who: 'ZELIA', t: 'Não conta pra ninguém que eu dei trabalho, {filho}.', when: is.present('lucia') },
        { who: 'NARRADOR', t: 'Você chega da ambulância de madrugada. A casa está quieta. Ninguém percebe nada.', when: (c) => !is.present('lucia')(c) },
        { who: 'NARRADOR', t: 'De manhã, a Dona Zélia aparece na cozinha com um roxo na testa.', when: (c) => !is.present('lucia')(c) },
        { who: 'ZELIA', t: 'Bati no armário. Velha é assim.', when: (c) => !is.present('lucia')(c) },
        { who: 'NARRADOR', t: 'Atrás da lata de açúcar, um copo vazio, com a borda melada de suco.', when: (c) => !is.present('lucia')(c) },
        { who: 'NARRADOR', t: 'Em cima do seu travesseiro, uma caixinha de veludo vermelho e um bilhete com a letra dela: "A aliança do seu pai. O Seu Jacó dá duzentos. Vende. — Mãe."' },
      ],
      choices: [
        { label: 'Guardar a caixinha no bolso. Vender amanhã.', next: 'vendeu', effect: fx.all(fx.money(200, 'A aliança do seu pai'), fx.add('lacos', -1, 'a aliança'), fx.set('alianca_vendida')) },
        { label: 'Devolver a caixinha à gaveta dela.', next: 'devolveu' },
      ],
    },
    vendeu: { lines: [{ who: 'NARRADOR', t: 'Você não acorda a sua mãe para conversar. Ela não pergunta nada no café. Só olha a própria mão, sem o costume de girar a aliança.' }] },
    devolveu: { lines: [{ who: 'NARRADOR', t: 'De manhã, a caixinha volta pro seu travesseiro. Você devolve de novo. Nenhum dos dois fala nisso.' }] },
  },
};

export const DAY = day({
  day: 10,
  title: 'Ninguém é Bobo',
  weekday: 'Sexta-feira',
  weather: 'Abafado, 32 °C. Nuvens carregadas no fim da tarde.',
  goal: { maxUSA: 2, bonus: 30 },
  // o noturno vem piorando (ver nightShift no motor); o D12 decide o que acontece com isso
  onStart: fx.set('henrique_piorando'),
  newspaper: (c) => ({
    headline: c.flag('marcia_morreu')
      ? 'Professora morre à espera de ambulância no Jardim Primavera'
      : c.flag('marcia_viva')
        ? 'Professora picada por abelha é salva com "caneta vencida"'
        : 'Saúde+ Gestão comemora economia recorde na frota de ambulâncias',
    sub: c.flag('marcia_morreu')
      ? 'Márcia Albuquerque Reis, 41, do 3º B da E.M. Monteiro Lobato, teve reação alérgica no quintal. Marido diz que pediu "a ambulância grande".'
      : c.flag('marcia_viva')
        ? 'Márcia Albuquerque Reis, 41, teve choque anafilático no quintal. O marido aplicou a adrenalina orientado pela Central.'
        : 'A OS fala em "uso racional de viaturas". O sindicato fala em "ambulância que não sai".',
    photo: c.flag('marcia_morreu') || c.flag('marcia_viva') ? 'abelhas' : 'garagem',
    stories: [
      { title: 'Asma lota a UPA Norte', text: 'Calor seco e poeira: 40 crianças em crise atendidas em dois dias. Pais relatam falta de bombinha nos postos.' },
      { title: 'Economia da frota chega a 21%', text: 'A Saúde+ Gestão diz que o corte de viaturas "não afetou o tempo de resposta". A OS não divulgou o tempo de resposta.' },
      { title: 'Trote à emergência "ficou mais esperto"', text: 'Segundo a PM, trotistas agora usam endereços reais e falam com calma. "Ligar de volta salva ambulância", diz a coordenação da Central.' },
    ],
    notice: 'Recado da coordenação: trotes com endereço real e voz calma. Na dúvida, "Ligar de volta" antes de despachar.',
    ad: 'COMPRA-SE OURO — Joalheria Jacó, Rua XV de Novembro. Avaliação na hora, pagamento em dinheiro.',
    weather: 'Abafado · 32 °C',
  }),
  handover: () => ({
    id: 'd10_passagem',
    bg: 'central',
    nodes: {
      start: {
        lines: [
          { who: 'NARRADOR', t: '07:00. O Henrique passa o plantão de pé, já de casaco, a chave do carro na mão.' },
          { who: 'HENRIQUE', t: 'Noite de trote, {nome}. Um cara com voz de locutor de rádio me deu um "infarto" no Shopping às três da manhã. Shopping fechado. Mandei USB.' },
          { who: 'HENRIQUE', t: 'Eles aprenderam. Agora dão endereço certinho, falam devagar, pedem "por favor".' },
          { who: 'HENRIQUE', t: 'Soube da professora. (ele olha pro chão) Acontece. Acontece com todo mundo, e ninguém te conta isso na faculdade.', when: is.flag('marcia_morreu') },
          { who: 'HENRIQUE', t: 'E soube da professora. A caneta vencida. Bonito, {nome}. Bonito mesmo.', when: is.flag('marcia_viva') },
          { who: 'NARRADOR', t: 'Menta. Muita menta. E, por baixo, de novo, aquela outra coisa.' },
        ],
        choices: [
          { label: '"Vai descansar, Henrique."', next: 'simone' },
          { label: '(Chegar mais perto. Sentir o cheiro.)', next: 'cheiro' },
        ],
      },
      cheiro: {
        onEnter: fx.set('henrique_cheiro_d10'),
        lines: [
          { who: 'NARRADOR', t: 'Não é de ontem. É de agora.' },
          { who: 'HENRIQUE', t: 'Que foi? Tá me cheirando, {nome}? (um riso curto) Enxaguante bucal. Tem álcool, sabia? Lê o rótulo.' },
        ],
        next: 'simone',
      },
      simone: {
        lines: [
          { who: 'SIMONE', t: 'Bom dia, {dr}. Recado do Peixoto, por escrito, olha só: "endereço duvidoso, ligar de volta antes de despachar". Meia hora de relógio. Ele mesmo disse que compensa.' },
          { who: 'SIMONE', t: 'E outra coisa, já que é sexta e eu tô sincera: hoje eu vou errar nota. Esses trotes novos tão me pegando também. Não confia cego no meu post-it.' },
          // flags.md: admitiu_vinculo / d9_impedimento (eco imediato) — o Peixoto responde por escrito
          { who: 'NARRADOR', t: 'Embaixo do recado, um segundo papel, com a letra de planilha do Peixoto: "Recebi o seu 9-B. \'Vínculo pessoal\'. Ninguém escreve isso. Vou guardar."', when: is.flag('admitiu_vinculo') },
          { who: 'NARRADOR', t: 'Preso no seu monitor, um bilhete do Peixoto: "9-C. Você me passou o seu filho. Foi o certo. Foi o pior minuto dos meus quatro anos nessa cadeira."', when: is.flag('d9_impedimento') },
        ],
      },
    },
  }),
  // 1.1 — ida (o Benício no carrinho), almoço (a Zélia liga: "arroz com ovo") e volta (a joalheria do Seu Jacó)
  ida: (c) => ({
    id: 'd10_ida',
    bg: 'calcada',
    cast: [],
    nodes: {
      start: c.flag('d9_parto_regulado')
        ? {
            lines: [
              { who: 'NARRADOR', t: '06:25. Na calçada da casa 88, o Diego empurra um carrinho de bebê azul, de chinelo. A Tainara acena da janela, de camisola.' },
              { who: 'DIEGO', t: 'Nasceu, {dr}! Na ambulância pequena, ontem. Benício. A moça disse "foi a central". Foi você?' },
            ],
            choices: [
              { label: '"Foi a central."', next: 'afilhado', effect: fx.set('benicio_afilhado') },
              { label: '(Olhar o Benício dormindo.)', next: 'olhar' },
            ],
          }
        : {
            lines: [
              { who: 'NARRADOR', t: '06:25. Na calçada da casa 88, o Diego empurra um carrinho de bebê azul.' },
              { who: 'DIEGO', t: 'Nasceu no carro, {dr}. De novo! Benício. Rápido igual o irmão. A Tainara disse que o próximo nasce no ônibus.' },
            ],
          },
      afilhado: { lines: [{ who: 'DIEGO', t: 'Então a central ganhou um afilhado. Vou contar pra ele quando ele crescer.' }] },
      olhar: { lines: [{ who: 'NARRADOR', t: 'Ele dorme de boca aberta, com o punho fechado do lado da orelha, como quem segura um telefone.' }] },
    },
  }),
  almoco: () => ({
    id: 'd10_almoco',
    bg: 'central',
    cast: ['SIMONE', 'ZELIA'],
    nodes: {
      start: {
        lines: [
          { who: 'NARRADOR', t: '13:00. Sexta. A Simone espalha os post-its do dia na mesa da copa, como cartas de baralho. Dois têm "trote?" escrito e riscado.' },
          { who: 'SIMONE', t: 'Já errei dois hoje, {dr}. Esses trotes de voz calma me pegam. Não confia cego no meu post-it, eu falei.' },
          { who: 'NARRADOR', t: 'O seu celular vibra em cima da mesa. "CASA".' },
          { who: 'ZELIA', t: '(ao telefone) Almoçou, {filho}? Eu já almocei. Arroz com ovo. Tava uma delícia. Só liguei pra saber se você almoçou. Não almoçou, né? Tá na voz.' },
        ],
        choices: [
          { label: '"O que a senhora comeu, mãe?"', next: 'perguntou', effect: fx.set('zelia_ligou_almoco') },
          { label: '"Almocei, mãe. Fica tranquila."', next: 'mentiu' },
        ],
      },
      perguntou: {
        lines: [
          { who: 'ZELIA', t: 'Arroz com ovo, já falei. O menino comeu o ovo. Eu comi o arroz. É a mesma coisa.' },
          { who: 'NARRADOR', t: 'Ela desliga antes de você perguntar de novo. Arroz com ovo. Você anota de cabeça, sem saber por quê.' },
          { who: 'SIMONE', t: 'Mãe é a única que liga pra saber se a gente comeu. O resto liga pra saber se a gente morreu.' },
        ],
      },
      mentiu: {
        lines: [
          { who: 'ZELIA', t: 'Mentira de filho eu conheço de longe. Come alguma coisa. Tchau.' },
          { who: 'SIMONE', t: 'Mãe é a única que liga pra saber se a gente comeu. O resto liga pra saber se a gente morreu.' },
        ],
      },
    },
  }),
  volta: (c) => ({
    id: 'd10_volta',
    bg: 'rua',
    cast: [],
    nodes: {
      start: {
        lines: [
          { who: 'NARRADOR', t: '19:15. Na XV, o Seu Jacó baixa a porta de ferro da joalheria, de lupa ainda presa na testa. A placa pendurada balança: "COMPRA-SE OURO".' },
          { who: 'NARRADOR', t: 'No ônibus, você pensa no pão da Dona Zélia. Desce na padaria do Toninho antes de casa.' },
          { who: 'NARRADOR', t: `Na vitrine da papelaria do lado, uma caixa de giz de cera de vinte e quatro cores. Você lembra do Liam: "${falaLiam(c)}"`, when: () => is.present('davi')(c) },
        ],
      },
    },
  }),
  timeline: [
    { at: '07:01', kind: 'radio', who: 'USA 01 · BENÉ', text: 'Central, USA 01 em QRV na base Centro. Sexta-feira, {bene}. Dia de trote caprichado.' },
    {
      at: '09:40',
      kind: 'script',
      id: 'simone_igreja',
      run: (c) => {
        const ig = c.callStatus('d10_igreja');
        if (!ig?.decision) return;
        if (ig.decision.resource === 'TROTE') c.modal('SIMONE', 'Igreja Batista, {dr}. Eu tinha posto "pega essa agora" numa igreja. Boa.', 'simone');
        else c.modal('SIMONE', 'Desculpa, {dr}. A da igreja... eu caí também. Fui eu que pus "pega essa agora".', 'simone');
      },
    },
    { at: '17:40', kind: 'simone', who: 'SIMONE', text: 'O Henrique ligou pra avisar que chega no horário hoje, {dr}. Em onze anos de central, ele nunca ligou pra avisar isso.' },
  ],
  calls: [
    // ----------------------------------------------------------------- 1 ★ trote sofisticado (igreja)
    call({
      id: 'd10_igreja',
      ref: 'D10 #1 ★',
      at: '07:15',
      anchor: true,
      num: '(17) 99318-4400',
      caller: 'Voz masculina adulta, calma',
      callerName: 'Homem',
      type: 'trotista',
      voice: 'grave',
      note: 'Infarto. Filho no telefone, voz calma, educado.',
      addr: { ...ADDR.igreja_bahia, ref: 'Casa de muro branco, perto da praça.' },
      amb: ['silencio'],
      open: [
        'Bom dia. Meu pai tá infartando. {{Rua Bahia, 300, Centro|end_bahia}}. Por favor, mandem a UTI.',
        '[{{silêncio absoluto do outro lado: nenhum barulho de casa, de gente, de nada|silencio_total}}]',
      ],
      q: {
        oque: 'Ele pôs a mão no peito e caiu sentado no sofá. {{Tá gemendo aqui do meu lado|gemendo}}.',
        consciencia: 'Consciente. Consciente, sim.',
        respira: 'Respira. Com dificuldade.',
        idade: 'Sessenta e cinco anos.',
        inicio: 'Agora há pouco. Dez minutos.',
        dorpeito: '{{Dor no peito que vai pro braço esquerdo, suor frio, falta de ar.|de_livro}} Tudo.',
        historico: 'Pressão. Toma um remédio aí... não sei o nome.',
        paciente: ['Ele não consegue falar agora, {dr}.', '[silêncio]'],
        referencia: 'É uma casa. {{Casa de muro branco, perto da praça|casa_muro}}.',
        seguranca: 'Seguro. Só eu e ele, {{aqui em casa|em_casa}}.',
        pulso: 'Tem pulso. Fraco. Rápido e fraco. Como diz na internet.',
        pele: 'Pálido. Sudoreico. Frio e úmido. É o quadro completo, {dr}.',
        sangramento: 'Não.',
      },
      extra: [
        { id: 'nome_pai', label: 'Nome completo do seu pai?', say: 'Qual o nome completo do seu pai?', a: '{{José... José da Silva.|nome_generico}}' },
        { id: 'ouvir_pai', label: 'Pedir para ouvir o pai', say: 'Coloca o telefone perto dele. Eu quero ouvir a respiração dele.', a: ['[{{nada: nem respiração, nem gemido|nada}}]', '[bem baixinho, longe, {{um órgão tocando um hino|orgao}}]', 'Ele... ele virou pro outro lado.'] },
        {
          id: 'igreja',
          label: '"No endereço tem uma igreja."',
          kind: 'confronto',
          locked: true,
          // 1.1 (ROTEIRO, dia 10): "Pedir para ouvir o pai" (silêncio); ou a Simone anota o marco do endereço no post-it
          unlockedBy: ['ouvir_pai', 'endereco', 'callback'],
          say: 'Senhor, na Rua Bahia, 300 fica a Igreja Batista Nova Aliança. O senhor está numa igreja?',
          a: ['...', '[{{um riso curto, abafado|riso_curto}}]', '[desliga]'],
        },
      ],
      callback: ['[{{"Este número está desligado ou fora da área de cobertura."|retorno_desligado}}]'],
      links: [
        { a: 'em_casa', b: 'mapa', insight: 'Ele diz que está "em casa", mas o mapa mostra: Rua Bahia, 300 é a Igreja Batista Nova Aliança.', unlock: 'igreja' },
        { a: 'casa_muro', b: 'mapa', insight: '"Casa de muro branco": no número 300 da Rua Bahia não existe casa. Existe uma igreja.', unlock: 'igreja' },
        { a: 'retorno_desligado', b: 'num', insight: 'Ligou faz minutos e o número já está desligado. Quem tem o pai infartando do lado não desliga o celular.' },
        { a: 'gemendo', b: 'silencio_total', insight: '"Tá gemendo aqui do meu lado"... e a linha está num silêncio absoluto.' },
        { a: 'de_livro', b: 'manual:trote_sinais', insight: 'Os sintomas vêm recitados em ordem de livro, sem nenhum detalhe de verdade: relato "cinematográfico" (Manual p.2).' },
      ],
      onStamp: (e) => {
        const r = carimbo(e, 'd10_igreja');
        if (r === 'USA' || r === 'USB') e.set('d10_igreja_viatura');
      },
      patient: { name: '"José da Silva"' },
      truth: { dx: 'Trote sofisticado (endereço de igreja)', sev: 'trote', ok: ['TROTE'], prankKind: 'trote' },
      radio: { prank: 'Central, {unit} na Rua Bahia, 300. É a Igreja Batista. Tem culto de oração rolando... O pastor disse que ninguém passou mal, graças a Deus. Era trote. Retornando.' },
    }),
    // ----------------------------------------------------------------- 2 ★ riso nervoso: AVC real (armadilha invertida)
    call({
      id: 'd10_riso',
      ref: 'D10 #2 ★',
      at: '08:10',
      anchor: true,
      num: '(17) 99714-2206',
      caller: 'Renato (filho)',
      callerName: 'Renato',
      type: 'comum',
      voice: 'homem',
      note: 'Filho. Diz que a mãe tá "falando tudo errado". Ele não para de rir.',
      addr: { rua: 'Rua Tiradentes', n: 1210, bairro: 'Vila Nova', ref: 'Esquina com a Marechal Deodoro, portão de grade azul, do lado da quitanda.' },
      amb: ['tv', 'cozinha'],
      open: [
        'Alô? É da emergência? É que a minha mãe... [{{ri|riso1}}] desculpa... ela tá {{falando tudo errado|fala_errada}}.',
        '[{{uma risada nervosa, curta, que ele tenta engolir|riso2}}]',
        'Ela pediu "o feijão da janela". Que feijão da janela, mãe? [ri] Desculpa, {dr}. Desculpa.',
      ],
      q: {
        oque: ['Ela tava fazendo café. Aí derrubou a xícara e começou a falar trocado. [ri] Não é engraçado, eu sei. Eu sei que não é.', '{{Eu rio quando fico nervoso. Desde pequeno. Rio até em velório.|ri_nervoso}}'],
        consciencia: 'Acordada. Olha pra mim, entende... acho que entende. Mas a resposta vem errada.',
        respira: 'Respira normal.',
        idade: 'Setenta e quatro.',
        inicio: '{{Às sete e meia ela tava boa|visto_bem}}. Tomou café comigo, reclamou do preço do pão. Foi agora, uns vinte minutos.',
        fast: [
          'Mãe, sorri pra mim... [pausa] {{A boca entorta pro lado direito|fast_rosto}}.',
          'Levanta os braços, mãe... {{o direito não sobe. Cai.|fast_braco}}',
          'Fala "o céu é azul", mãe...',
          'MÃE: O... o céu é... {{cadeira|fast_fala}}.',
          '[{{ele ri de novo, e a risada quebra no meio|riso3}}]',
        ],
        historico: 'Pressão alta. {{O remédio acabou no posto semana passada|sem_remedio}}. Ela disse que tava se sentindo bem sem.',
        paciente: ['MÃE: Renato... a... a janela... o feijão...', '[{{ela fala com calma, como se a frase fizesse todo o sentido|afasia}}]'],
        sangramento: 'Não, nada.',
        seguranca: 'Tá tudo certo aqui, é só eu e ela.',
        pulso: 'A vizinha enfermeira mediu: oitenta e oito, batendo certinho. Forte. [ri de nervoso] Desculpa.',
        pele: 'Corada. Normal. Só a boca torta. [a risada quebra no meio]',
        referencia: 'Esquina com a Marechal Deodoro. Portão de grade azul, do lado da quitanda.',
      },
      extra: [
        { id: 'diabetes', label: 'Ela é diabética? Mediu o açúcar?', say: 'Ela tem diabetes? Alguém mediu o açúcar dela?', a: 'Diabetes não. A vizinha é enfermeira aposentada, {{mediu agora com o aparelhinho: deu 118|glicemia_ok}}.' },
        {
          id: 'brincadeira',
          kind: 'confronto',
          label: '"Isso é brincadeira?"',
          say: 'O senhor está rindo. Isso é alguma brincadeira?',
          a: ['[o riso some de uma vez]', 'Brincadeira? {Dr}... é a minha mãe. {{Por favor.|por_favor}}', '[{{a voz dele quebra|quebra}}]'],
        },
      ],
      callback: ['{{Alô! Alô, {dr}? Sou eu, o Renato! Manda, pelo amor de Deus, ela tá piorando!|retorno_ok}}'],
      links: [
        { a: 'riso2', b: 'ri_nervoso', kind: 'confirma', insight: 'A risada é nervosa, não deboche: ele mesmo explica, e ela quebra quando o assunto aperta.' },
        { a: 'riso1', b: 'manual:trote_sinais', kind: 'confirma', insight: 'Risada sozinha não prova trote. Aqui o relato é coerente, cheio de detalhe real, e o número atende de volta (Manual p.2: o sinal é o conjunto, não o riso).' },
        { a: 'fast_rosto', b: 'manual:fast', insight: 'Boca torta, braço que cai, fala trocada: FAST positivo. Suspeita de AVC (Manual p.6).' },
        { a: 'visto_bem', b: 'manual:janela', insight: 'Vista bem às 07:30: dentro da janela de 4h30. USA → Regional (Manual p.6).' },
        { a: 'glicemia_ok', b: 'manual:hipoglicemia', kind: 'confirma', insight: 'Glicemia 118 e sem diabetes: não é hipoglicemia imitando AVC.' },
      ],
      worsen: [{ after: 95, lines: ['RENATO: {Dr}... [sem riso nenhum agora] ela tá ficando sonolenta. {{Ela não abre mais o olho direito|piora}}.'] }],
      guide: { id: 'avc' },
      onResolve: (e, r) => {
        if (r.outcome !== 'obito') e.set('d10_avc_salva');
      },
      patient: { name: 'Geralda Ferreira Lopes', age: 74, sex: 'F' },
      // RC1: afasia e fraqueza de um lado = USI/USB (USA só com Glasgow < 9, convulsão ou suporte ventilatório).
      // Na janela, USA preferida (Manual p.6) e USB ⚖, como nos AVCs do dia 6; USB que chega é cuidado adequado.
      truth: { dx: 'AVC na janela (afasia e fraqueza à direita)', sev: 'vermelho', ok: ['USA', 'USB'], best: 'USA', dest: ['REG'], risk: { good: 60, bad: 140, needs: 'USB' } },
      radio: {
        ok: '{central}, {unit} no local. AVC, déficit à direita, afasia, dentro da janela. Pré-notificamos o Regional. O filho tá rindo e chorando ao mesmo tempo, coitado.',
        under: '{unit}: senhora com AVC em evolução! Precisamos de suporte avançado pra ganhar a janela!',
      },
      diary: {
        alive: 'Dona Geralda, 74. AVC na janela. O filho ria de nervoso e pedia desculpa a cada frase.',
        dead: 'Dona Geralda, 74. AVC. O filho ria de nervoso; a risada parecia trote.',
      },
    }),
    // ----------------------------------------------------------------- 3 ★ Dona Cida (o golpe do banco)
    call({
      id: 'd10_cida',
      ref: 'D10 #3 ★',
      at: '09:00',
      anchor: true,
      num: NUM.cida,
      caller: 'Dona Cida',
      callerName: 'Dona Cida',
      type: 'frequentador',
      voice: 'cida',
      note: 'Dona Cida. Diz que ligaram do "banco".',
      addr: ADDR.cida,
      amb: ['tv'],
      open: [
        'Oi {meu} {filho}, é a Cida! Ó, você não vai acreditar.',
        '{{Ligaram aqui em casa dizendo que era do banco|golpe}}. Um moço educadíssimo, sabia o meu nome, o meu CPF, tudo. Queria a senha do cartão "pra cancelar uma compra".',
        'Eu desliguei na cara dele! Fiz certo, né? {{Mas fiquei com o coração na boca|coracao}}.',
      ],
      q: {
        oque: 'O coração disparou de nervoso, {meu} {filho}. Agora já tá mais calminho.',
        consciencia: 'Acordadíssima. Mais esperta que o golpista!',
        respira: 'Respiro. Respirei fundo, devagarinho, que nem a moça da novela faz.',
        idade: 'Setenta e nove.',
        inicio: 'Foi agora, umas oito e meia. Já passou uns vinte minutos.',
        dorpeito: 'Dor não, {meu} {filho}. Foi só o susto. {{Contei o pulso igual a moça da farmácia ensinou: oitenta e pouco, certinho|pulso}}.',
        historico: 'Pressão. Tomei o remédio às sete, igual todo dia.',
        fast: 'Tô sorrindo! Levantei os dois braços! "O céu é azul"! Ai, que divertido.',
        paciente: 'Sou eu mesma, {meu} {filho}!',
        seguranca: 'Tranquei a porta. Vai que o moço do banco vem aqui.',
        pulso: 'Contei! Oitenta e pouco, certinho, igual a moça da farmácia ensinou. Agora tá mais devagar.',
        pele: 'Vermelha de raiva do golpista, {meu} {filho}. Já tá passando.',
        sangramento: 'Credo, não.',
      },
      extra: [
        {
          id: 'conversar',
          kind: 'fala',
          label: 'Conversar um pouco com ela',
          cost: 15,
          say: 'A senhora fez muito bem, Dona Cida. E fora o susto, como a senhora tá?',
          a: [
            'Ah, {meu} {filho}... sabe que esse moço do banco me lembrou o Nestor? Falava bonito igual.',
            'Quando o Nestor morreu, {{eu vendi a minha aliança pra pagar o enterro|alianca_cida}}. Duzentos e poucos reais. Me arrependo até hoje. Não do enterro, viu? Da aliança.',
            'Ouro a gente vende uma vez só. Depois fica o dedo pelado, contando história.',
            'Desculpa tomar seu tempo. É que a casa fica muito quieta.',
          ],
          onAsk: fx.all(fx.add('humanidade', 1, 'conversou com a Dona Cida'), fx.set('cida_conversou_d10')),
        },
        {
          id: 'golpe_orient',
          kind: 'fala',
          label: 'Orientar sobre o golpe',
          say: 'Banco nunca pede senha por telefone, Dona Cida. Se ligarem de novo, desliga e liga a senhora mesma pro número que está atrás do cartão.',
          a: 'Ah, isso eu já sabia! Mas é bom ouvir de {m:um médico|uma médica}. Vou contar pras meninas da igreja.',
        },
      ],
      links: [{ a: 'coracao', b: 'pulso', kind: 'confirma', insight: 'Coração disparado de susto, pulso regular em 80, sem dor no peito: foi o susto. Azul (Manual p.1).' }],
      onAnswer: fx.set('cida_ligou_d10'),
      patient: { name: 'Aparecida (Dona Cida)', age: 79, sex: 'F' },
      truth: { dx: 'Palpitação após susto (tentativa de golpe por telefone)', sev: 'azul', ok: ['ORI'], ref: ['CASA', 'UBS'] },
      diary: { ori: 'Tentaram aplicar o golpe do banco na Dona Cida. Ela desligou na cara do golpista. Coração disparado de susto, já passando.' },
    }),
    // ----------------------------------------------------------------- 4 a nota errada da Simone: é real
    call({
      id: 'd10_pulso',
      ref: 'D10 #4',
      at: '10:00',
      num: '(17) 3327-0916',
      caller: 'Sérgio (pai)',
      callerName: 'Sérgio',
      type: 'comum',
      voice: 'homem',
      note: 'Homem, voz esquisita, calma demais. Acho que é trote, {dr}.',
      noteFixed: true,
      addr: { rua: 'Rua das Mangueiras', n: 916, bairro: 'Jardim Primavera', ref: 'Sobrado bege, portão de madeira, em frente ao ponto de ônibus.' },
      amb: ['silencio'],
      open: [
        'Minha filha cortou o pulso. Rua das Mangueiras, 916.',
        '[{{a voz é baixa, sem pressa, quase sem cor|voz_calma}}]',
        'Ela tá no banheiro. Eu tô com ela.',
      ],
      q: {
        oque: ['Eu ouvi ela chorando no banheiro. A porta tava trancada. Eu forcei.', 'Ela tava sentada no chão. Ela se machucou. No pulso.'],
        consciencia: 'Tá acordada. Tá olhando pra mim. {{Fica pedindo desculpa|desculpa}}.',
        respira: 'Respira. Chorando, mas respira.',
        idade: 'Dezesseis. Fez dezesseis em janeiro.',
        sangramento: ['{{Eu enrolei uma toalha e tô apertando|toalha}}. A toalha tá ficando vermelha, mas devagar.', 'Não tá jorrando. Tá escorrendo.'],
        inicio: 'Agora. Faz uns dez minutos que eu achei ela.',
        historico: ['Ela não tem doença nenhuma. {{Ela anda quieta faz uns meses. Eu achei que era da idade.|quieta}}', 'Não toma remédio. Que eu saiba.'],
        paciente: ['[ao fundo, uma voz de menina, baixinho]', 'FILHA: {{Desculpa, pai. Desculpa.|filha_desculpa}}', 'SÉRGIO: Não pede desculpa, filha. Não pede.'],
        seguranca: 'É só eu e ela. A mãe tá no plantão, é técnica de enfermagem no Regional.',
        referencia: 'Em frente ao ponto de ônibus. Sobrado bege. O portão tá aberto, eu deixei aberto.',
      },
      extra: [
        {
          id: 'ficar_com_ela',
          kind: 'fala',
          label: 'Pedir que ele fique com ela',
          say: 'Seu Sérgio, o senhor fez tudo certo. Não sai do lado dela. Eu fico na linha com o senhor até a equipe chegar.',
          a: ['[{{ele respira fundo; a voz finalmente treme|treme}}]', 'Tá. Tá bom. Eu não saio.', 'Filha, {m:o doutor|a doutora} tá aqui com a gente. Tá aqui.'],
          onAsk: fx.add('humanidade', 1, 'ficou com o pai na linha'),
        },
        {
          id: 'outros',
          label: 'Ela tomou alguma coisa também?',
          say: 'Ela pode ter tomado algum remédio, alguma outra coisa, além do machucado?',
          a: 'Não... não, eu olhei. Não tem nada aberto. Filha, você tomou alguma coisa? ...{{Ela balançou a cabeça. Não.|nao_tomou}}',
        },
        {
          id: 'eh_trote',
          kind: 'confronto',
          label: '"Isso é verdade?"',
          say: 'Senhor, o senhor está muito calmo. Isso é verdade?',
          a: ['[silêncio]', 'Calmo? ...', '[{{e então ele desaba; o choro vem todo de uma vez|desaba}}]', 'É a minha filha, {dr}. É a minha filha.'],
        },
      ],
      callback: ['[{{chama uma vez só; ele atende chorando|retorno_choro}}]', 'SÉRGIO: Alô? Alô! Não desliga de novo, pelo amor de Deus, {{não desliga|nao_desliga}}...'],
      links: [
        { a: 'voz_calma', b: 'retorno_choro', insight: 'A voz "calma demais" era choque. No retorno, o pai desaba: é real. A nota da Simone estava errada.' },
        { a: 'voz_calma', b: 'treme', insight: 'Quando você oferece ficar na linha, a voz dele treme. A calma era choque, não deboche.' },
        { a: 'voz_calma', b: 'desaba', insight: 'A calma era choque. Confrontado, o pai desaba. Ninguém aqui está brincando.' },
        { a: 'toalha', b: 'manual:amarelo', insight: 'Sangramento contido com compressão, acordada, respirando: urgência sem risco imediato. USB, com orientação de compressão (Manual p.1).' },
      ],
      guide: { id: 'd10_compressao' },
      patient: { name: 'Bianca Alves', age: 16, sex: 'F' },
      // [validar] RC5: "alto risco de nova autoagressão" está na lista USA/USI (o exemplo do RM4, "tentou cortar os
      // pulsos", registra "considerado o envio de USA; enviado USI"). Sangramento que escorre sob compressão =
      // "hemorragia menor incontrolável" (USI/USB). Sem USI no jogo: USB preferida (o pai junto, ela calma), USA ⚖;
      // Regional também aceito. Equipe: a USA deveria ser a preferida?
      truth: { dx: 'Lesão autoprovocada no punho, sangramento contido por compressão', sev: 'amarelo', ok: ['USB', 'USA'], best: 'USB', dest: ['UPA', 'REG'], risk: { good: 100, bad: 260, needs: 'USB' } },
      radio: {
        ok: 'Central, {unit} no local. Adolescente acordada, sangramento contido com a compressão do pai. Curativo feito. Removendo para a UPA, com o pai junto. Ela pediu pra segurar a mão dele o caminho todo.',
        saved: 'Central, {unit}. Ela tá acordada, o sangramento parou. O pai fez tudo direitinho. Quem ficou com ele na linha? Ele não larga o telefone.',
      },
      diary: {
        alive: 'Bianca, 16. O pai apertou a toalha e não soltou. A Simone achou que era trote.',
        later: [{ day: 13, text: 'Bianca começou acompanhamento no CAPS infantojuvenil. O pai liga toda semana para confirmar a consulta.', when: (c) => c.s.diary.some((d) => d.id === 'd10_pulso' && d.kind === 'vivo') }],
      },
    }),
    // ----------------------------------------------------------------- 5 trote: ônibus escolar (endereço real)
    call({
      id: 'd10_onibus',
      ref: 'D10 #5',
      at: '11:05',
      num: '(17) 99862-1150',
      caller: 'Voz feminina adulta',
      callerName: 'Mulher',
      type: 'trotista',
      voice: 'mulher',
      note: 'Ônibus escolar tombado na frente da Estadual. Ela tá muito calma.',
      noteWrong: 'Ônibus escolar, muita criança machucada! Parece gravíssimo.',
      addr: { ...ADDR.escola },
      amb: ['rua'],
      open: [
        'Alô, emergência? {{Um ônibus escolar bateu e tombou|tombou}} aqui na Rua Ipê, na frente da Escola Estadual. Tem muita criança machucada.',
        '[{{carros passando devagar. Nenhum grito, nenhuma sirene, nenhum choro de criança|sem_multidao}}]',
      ],
      q: {
        oque: 'O ônibus bateu no poste e virou de lado. As crianças tão lá dentro.',
        consciencia: '{{Umas sim, outras não. Não sei. Várias.|vago_consc}}',
        respira: 'Acho que sim. A maioria.',
        idade: 'Criança. Pequena. Uns... de escola.',
        sangramento: 'Tem sangue, sim. Bastante.',
        paciente: 'Não dá, {dr}, eu tô longe do ônibus.',
        inicio: 'Agora. Agorinha.',
        referencia: 'Na frente da escola. Do portão principal.',
        seguranca: 'Seguro. O motorista tá... tá lá.',
        historico: 'Como assim? São crianças.',
      },
      extra: [
        { id: 'quantas', label: 'Quantas crianças? Quantas feridas?', say: 'Quantas crianças estão no ônibus? Quantas estão feridas?', a: '{{Muitas. Umas... várias. Uma porção.|quantas_vago}}' },
        { id: 'linha', label: 'Qual escola? Qual a linha do ônibus?', say: 'De qual escola é o ônibus? Tem número de linha, nome da empresa na lataria?', a: 'Da... da escola daqui. {{Amarelo. Ônibus amarelo, normal.|amarelo}}' },
        {
          id: 'simone_radio',
          label: 'Pedir para a Simone checar o rádio',
          cost: 10,
          say: 'Simone, checa o rádio pra mim: alguém mais ligou sobre ônibus na Rua Ipê? PM, Bombeiros, a escola?',
          a: ['SIMONE: {{Ninguém mais ligou, {dr}. Nem PM, nem Bombeiro, nem a escola, nem um vizinho.|ninguem_ligou}}', 'SIMONE: Ônibus escolar tombado na frente da Estadual, às onze da manhã, e só uma pessoa ligou?'],
        },
      ],
      callback: ['[{{Caixa postal. "Deixe sua mensagem após o sinal."|retorno_caixa}}]'],
      links: [
        { a: 'tombou', b: 'sem_multidao', insight: 'Um ônibus escolar tombado com "muita criança machucada"... e nenhum grito, nenhum choro, nenhuma sirene ao fundo.' },
        { a: 'ninguem_ligou', b: 'tombou', insight: 'Acidente com ônibus escolar na porta de uma escola, às onze da manhã, gera dezenas de ligações. Só uma pessoa ligou.' },
        { a: 'retorno_caixa', b: 'num', insight: 'Ligar de volta: caixa postal. Quem está vendo criança ferida não deixa o celular cair na caixa.' },
        { a: 'quantas_vago', b: 'manual:trote_sinais', insight: 'Respostas vagas para tudo o que é concreto (quantas, quem, qual linha): ninguém está vendo acidente nenhum (Manual p.2).' },
      ],
      onStamp: (e) => {
        const r = carimbo(e, 'd10_onibus');
        if (r === 'USA' || r === 'USB') e.set('d10_onibus_viatura');
      },
      patient: { name: '"Crianças do ônibus escolar"' },
      truth: { dx: 'Trote (falso acidente com ônibus escolar)', sev: 'trote', ok: ['TROTE'], prankKind: 'trote' },
      radio: { prank: 'Central, {unit} na frente da Estadual. Nenhum ônibus. O porteiro tá varrendo a calçada e nem sabia de nada. Era trote. Retornando.' },
    }),
    // ----------------------------------------------------------------- 6 insuficiência cardíaca descompensada
    call({
      id: 'd10_icc',
      ref: 'D10 #6',
      at: '12:20',
      pool: 'grave,cardio,respiratorio',
      num: '(17) 3326-2240',
      caller: 'Dona Nair (esposa)',
      callerName: 'Nair',
      type: 'comum',
      voice: 'idosa',
      note: 'Esposa. Marido com falta de ar e "pé inchado".',
      noteWrong: 'Senhora, marido cansado. Coisa da idade.',
      addr: { rua: 'Rua Dom Pedro II', n: 2240, bairro: 'Distrito Industrial', ref: 'Vila dos ferroviários, casa 12, a do pé de acerola.' },
      amb: ['respiracao', 'radio_am'],
      open: [
        'Alô, {m:moço|moça}... {dr}? É o meu marido, o Osmar. Ele tá com {{uma falta de ar que vem piorando faz uns dias|piorando}}. Hoje ele não tá conseguindo nem terminar a frase.',
        '[{{respiração rápida, molhada, com um chiado grosso no fundo|resp_molhada}}]',
      ],
      q: {
        oque: ['Começou cansado na semana passada. Depois {{as pernas incharam|pernas}}: o chinelo não entra mais.', '{{Essa noite ele dormiu sentado na poltrona|poltrona}}. Disse que deitado ele afoga.'],
        consciencia: 'Acordado. Mas tá {{meio aéreo|aereo}}, assustado.',
        respira: ['Rápido. Sentado, puxando o ar com o ombro.', '{{Tossiu uma espuminha rosada agora há pouco|espuma}}.'],
        idade: 'Setenta e oito.',
        inicio: 'Faz uns cinco dias que vem piorando. Hoje de manhã ficou feio.',
        historico: ['Coração. {{Ele tem coração fraco, o médico falou|coracao_fraco}}. Toma remédio pra água e pro coração.', '{{O remédio de urinar acabou no posto faz uma semana|sem_diuretico}}. Disseram que chega.'],
        dorpeito: 'Dor não. É um aperto. É o ar que não vem.',
        paciente: ['OSMAR: Não é... nada... Nair... é a... idade.', '[{{ele precisa parar para respirar a cada duas palavras|fala_cortada}}]'],
        sangramento: 'Não, sangue não.',
        seguranca: 'Seguro. Só nós dois.',
        referencia: 'Vila dos ferroviários, casa 12. A do pé de acerola.',
      },
      extra: [
        { id: 'labios', label: 'Lábios e unhas roxos?', say: 'Como estão os lábios e as unhas dele?', a: 'Tão {{meio arroxeados|labios_roxos}}, {m:moço|moça}. A ponta do dedo também.' },
        { id: 'deitar', label: 'Ele consegue deitar?', say: 'Ele consegue ficar deitado?', a: 'Não. Deitou, afoga. Tá sentado, com os pés pra baixo.' },
      ],
      links: [
        { a: 'poltrona', b: 'pernas', insight: 'Dorme sentado porque deitado "afoga" e as pernas incharam: o coração está falhando e o pulmão está encharcando.' },
        { a: 'espuma', b: 'manual:vermelho', insight: 'Falta de ar em repouso, fala cortada e espuma rosada: edema de pulmão. Vermelho → USA (Manual p.1).' }, // conferido: RC12 (frases entrecortadas, exaustão → USA)
        { a: 'sem_diuretico', b: 'piorando', insight: 'O remédio de "água" acabou no posto há uma semana; a falta de ar piora há cinco dias. A falta do remédio explica a piora.' },
      ],
      patient: { name: 'Osmar Carvalho', age: 78, sex: 'M' },
      truth: { dx: 'Insuficiência cardíaca descompensada (edema agudo de pulmão)', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 50, bad: 120 } },
      radio: {
        ok: '{central}, {unit} no local. Edema agudo de pulmão, saturando 82. Sentamos ele, oxigênio, medicação. Melhorando. Seguimos Regional. A esposa mandou perguntar quando chega o remédio de água no posto.',
        under: '{unit}: insuficiência cardíaca descompensada, edema de pulmão! Precisamos de USA!',
      },
      diary: {
        alive: 'Seu Osmar, 78. Coração fraco; o remédio de água acabou no posto. Edema de pulmão. Chegou a tempo.',
        dead: 'Seu Osmar, 78. O remédio de água tinha acabado no posto.',
      },
    }),
    // ----------------------------------------------------------------- 7 entorse de joelho (a escola de verdade)
    call({
      id: 'd10_joelho',
      ref: 'D10 #7',
      at: '13:35',
      pool: 'leve',
      num: '(17) 3324-0901',
      caller: 'Prof. Anderson (Educação Física)',
      callerName: 'Anderson',
      type: 'profissional',
      voice: 'homem',
      note: 'Professor da Estadual. Aluno torceu o joelho no vôlei. Quer ambulância "por protocolo".',
      noteWrong: 'Escola Estadual de novo. Acho que é trote.',
      addr: { rua: 'Rua Ipê', n: 901, bairro: 'Jardim Norte', ref: 'Escola Estadual Prof. Aurélio Valença, entrada da quadra pela lateral.' },
      amb: ['escola'],
      open: [
        'Boa tarde, aqui é o Anderson, professor de Educação Física da Escola Estadual. Um aluno {{torceu o joelho no vôlei|torceu}}.',
        '{{O protocolo da escola é chamar a ambulância|protocolo}}. A diretora pediu pra eu ligar.',
      ],
      q: {
        oque: 'Caiu de mau jeito depois de um bloqueio. O joelho virou pra dentro.',
        consciencia: 'Acordado, reclamando. Pedindo pra não ligar pra mãe dele.',
        respira: 'Normal.',
        idade: 'Quinze anos.',
        inicio: 'Agora, uns vinte minutos.',
        sangramento: 'Não, nada.',
        paciente: ['ALUNO: Tá doendo, mas eu tô bem, professor. {{Eu consigo andar, olha.|anda}}', '[{{passos mancando no piso da quadra|passos}}]'],
        historico: 'Nada, menino saudável. Joga em tudo.',
        seguranca: 'Seguro, é a quadra da escola.',
        referencia: 'Entrada da quadra pela lateral. E olha, aquela história do ônibus de hoje cedo não foi aqui, viu? Ligaram até pra diretora.',
      },
      extra: [
        { id: 'joelho', label: 'Deformado? Inchou?', say: 'O joelho está torto, deformado? Inchou muito? Ele consegue dobrar?', a: '{{Inchou um pouco do lado de dentro. Torto não tá.|inchou}} Dobra, mas reclama.' },
        { id: 'apoia', label: 'Consegue dar quatro passos?', say: 'Ele consegue apoiar o pé e dar quatro passos sozinho?', a: 'Deu quatro, cinco passos mancando. Agora tá sentado, com gelo.' },
      ],
      links: [
        { a: 'anda', b: 'protocolo', insight: 'O "protocolo da escola" pede ambulância, mas o aluno anda e não tem deformidade: caso verde. Orientar UPA por meios próprios, gelo e perna elevada.' }, // conferido: RC24 (sem deformidade, anda, dor moderada → orientação)
        { a: 'inchou', b: 'manual:verde', insight: 'Entorse com inchaço leve, apoia e anda: verde (Manual p.1).' },
      ],
      patient: { name: 'Kevin Santos', age: 15, sex: 'M' },
      truth: { dx: 'Entorse de joelho sem sinais de gravidade', sev: 'verde', ok: ['ORI'], ref: ['UPA', 'UBS'] },
      radio: { excess: 'Central, {unit}. Entorse de joelho, o menino tá andando e pedindo pra gente não contar pra mãe. Orientamos e liberamos. A diretora queria "um papel da ambulância".' },
      diary: { ori: 'Kevin, 15. Entorse no vôlei. O "protocolo da escola" queria ambulância; ele andava.' },
    }),
    // ----------------------------------------------------------------- 8 ⚖ queda de telhado
    call({
      id: 'd10_telhado',
      ref: 'D10 #8 ⚖',
      at: '14:50',
      pool: 'trauma_moderado',
      num: '(17) 99540-7720',
      caller: 'Leandro (vizinho)',
      callerName: 'Leandro',
      type: 'testemunha',
      voice: 'jovem_h',
      note: 'Homem caiu do telhado. Tá acordado, falando.',
      noteWrong: 'Caiu do telhado. Parece que não acorda.',
      addr: { rua: 'Rua Padre Anchieta', n: 2890, bairro: 'Vila Nova', ref: 'Casa em obra, caixa d’água azul no telhado.' },
      amb: ['rua', 'gemidos'],
      open: [
        '{m:Moço|Moça}, o meu vizinho {{caiu do telhado|caiu}}! Tava trocando a caixa d’água e escorregou!',
        'SEU JORGE: {{Ai, o quadril... não mexe... não mexe|quadril}}!',
      ],
      q: {
        oque: 'A telha quebrou e ele veio junto. Caiu sentado no quintal, no cimento.',
        consciencia: 'Acordado! Xingando a caixa d’água, a telha e o fabricante.',
        respira: 'Respira, respira. Gemendo.',
        idade: 'Uns cinquenta. Cinquenta e dois, ele falou.',
        inicio: 'Agora, cinco minutos.',
        sangramento: 'Ralou o braço. Sangue pouco.',
        historico: 'Pressão, eu acho. Ah, e {{ele toma um remédio pra afinar o sangue|afina_sangue}}, por causa de uma trombose que teve.',
        paciente: ['SEU JORGE: Tô aqui, tô aqui. {{Não bati a cabeça, não|nao_cabeca}}. Caí de bunda. Ai.', 'SEU JORGE: {{Sinto as pernas, mexo os pés|mexe}}... mas o quadril, ai...'],
        seguranca: 'Seguro. Tirei a escada do caminho.',
        referencia: 'Casa em obra, caixa d’água azul em cima. O portão tá aberto.',
      },
      extra: [
        { id: 'altura', label: 'De que altura?', say: 'De que altura ele caiu?', a: 'Do telhado da casa. {{Uns quatro metros|altura4}}, por aí. Casa de laje com telhado em cima.' },
        { id: 'cabeca', label: 'Bateu a cabeça? Desmaiou?', say: 'Ele bateu a cabeça? Desmaiou, nem que por um segundo?', a: 'Não, ele caiu sentado. Não apagou. Lembra de tudo, tá até reclamando do preço da telha.' },
        { id: 'pernas', label: 'Mexe e sente as pernas?', say: 'Ele mexe os pés? Sente quando você toca na perna?', a: 'Mexe os dois pés. Sente tudo. Só não consegue levantar: o quadril trava.' },
      ],
      links: [
        { a: 'altura4', b: 'manual:destino_reg', insight: 'Queda de quatro metros é trauma de alta energia: mesmo acordado e falando, o destino é o Regional (Manual p.9-A).' },
        { a: 'quadril', b: 'manual:amarelo', insight: 'Acordado, sem bater a cabeça, mexe e sente as pernas, dor no quadril: urgência sem risco imediato. USB (Manual p.1).' },
        { a: 'afina_sangue', b: 'altura4', insight: 'Anticoagulante + queda de altura: risco de sangramento por dentro. USB ou USA são defensáveis — se você perguntou altura, cabeça e remédios. Destino: Regional.' },
      ],
      worsen: [
        {
          after: 120,
          lines: ['LEANDRO: {m:Moço|Moça}... {{ele tá ficando branco, suando frio. Diz que tá com uma sede danada|choque}}.'],
          truth: { dx: 'Queda de altura com fratura de bacia e sangramento interno', sev: 'vermelho', ok: ['USA'], risk: { good: 170, bad: 260 } },
        },
      ],
      patient: { name: 'Jorge Mendes', age: 52, sex: 'M' },
      // [validar] RT6/RT8: queda de mais de 1,5 vez a própria altura é "mecanismo de trauma significativo" → USA, e ele
      // usa anticoagulante ("distúrbio de coagulação"). O jogo prefere USB (acordado, sem TCE, sem déficit, estável) e
      // aceita USA (⚖); se piorar (choque), só USA. Equipe: a USA deveria ser a preferida desde o início?
      truth: { dx: 'Queda de altura com provável fratura de bacia', sev: 'amarelo', ok: ['USB', 'USA'], best: 'USB', dest: ['REG'], must: ['altura', 'cabeca', 'historico'], risk: { good: 110, bad: 300, needs: 'USB' } },
      radio: {
        ok: 'Central, {unit} no local. Queda de quatro metros, provável fratura de bacia, estável por enquanto. Imobilizado. Seguimos Regional. Ele quer saber quem vai terminar a caixa d’água.',
        under: '{unit}: queda de altura, anticoagulado, entrando em choque! Precisamos de suporte avançado!',
      },
      diary: { alive: 'Seu Jorge, 52. Caiu do telhado trocando a caixa d’água. Fratura de bacia. Reclamou do preço da telha até o Regional.' },
    }),
    // ----------------------------------------------------------------- 9 trote clássico: o 9-8877 (Biel)
    call({
      id: 'd10_biel',
      ref: 'D10 #9',
      at: '16:15',
      num: NUM.biel,
      caller: 'Voz de adolescente',
      callerName: 'Garoto',
      type: 'trotista',
      voice: 'adolescente',
      note: (c) => (bielNoQuadro(c) ? 'Videogame no fundo. É o 9-8877 de novo, {dr}.' : 'Voz de moleque. Videogame tocando no fundo.'),
      noteWrong: 'Menino engasgado! Parece sério.',
      addr: { rua: 'Rua dos Bem-te-vis', n: 4800, bairro: 'Bela Vista' },
      // 1.1 (trotes-folgados.md): óbvio, mas sem risada — o próprio videogame toca a musiquinha ao fundo
      amb: ['videogame'],
      open: [
        'Alô, emergência? Corre, {{o meu amigo engoliu o controle do videogame|controle}}! Inteiro! Com pilha e tudo!',
        '[{{a musiquinha do videogame tocando alto; alguém do lado: "fala do fio!"|risadas}}]',
        'E o fio! O fio tá pra fora!',
      ],
      q: {
        oque: 'Ele tava perdendo e engoliu! Pra ninguém mais jogar!',
        consciencia: 'Tá... tá jogando ainda! Quer dizer, tá desmaiado!',
        respira: 'Pelo nariz! O fio tá saindo pela boca!',
        idade: 'Treze. Não, quinze.',
        referencia: 'Rua dos Bem-te-vis, quatro mil e oitocentos. Do lado da... da casa do lado.',
        paciente: '[{{"Glub, glub!" — e o videogame toca a musiquinha de fim de fase|glub}}]',
        seguranca: 'Seguro, mas vem rápido senão ele engole o outro controle!',
        pulso: 'Tem! Tá pulsando que nem o controle quando vibra!',
        pele: 'Verde. Verde de raiva. Ele tava perdendo.',
        sangramento: 'Não! Quer dizer, sim!',
      },
      extra: [
        {
          id: 'avo',
          kind: 'confronto',
          locked: true,
          // 1.1 (ROTEIRO, dia 10): o "Ligar de volta" cai na caixa postal do Biel, que se entrega
          unlockedBy: ['callback'],
          label: '"Gabriel, o seu avô sabe?"',
          say: 'Gabriel, o seu avô sabe que você liga pra cá?',
          a: ['[a musiquinha do videogame para de uma vez]', '[{{silêncio; alguém sussurra: "como é que ele sabe o teu nome?"|silencio_biel}}]', '[desliga]'],
          onAsk: fx.set('d10_biel_nome'),
        },
      ],
      callback: ['[{{Chama, chama... cai na caixa postal|retorno_caixa}}]', '"Fala aí, é o Biel, neto do Jairo da refrigeração! Se é serviço de geladeira, liga pro meu vô. Se não é... deixa recado."'],
      links: [
        { a: 'num', b: 'doc:jairo_neto', insight: '9-8877: é o número do Gabriel, o neto do Seu Jairo. Está no verso do recibo da geladeira.', unlock: 'avo' },
        { a: 'controle', b: 'risadas', insight: 'Controle de videogame engolido "com pilha e tudo" e gargalhadas ao fundo: trote clássico.' },
      ],
      patient: { name: '"Amigo que engoliu o controle"' },
      truth: { dx: 'Trote', sev: 'trote', ok: ['TROTE'], prankKind: 'trote' },
      radio: { prank: 'Central, {unit}. A Rua dos Bem-te-vis acaba no 2199. Rodamos o bairro inteiro. Trote. Retornando.' },
    }),
  ],
  interlude: {
    teaser: 'A Dona Zélia diz que já almoçou.',
    familyLacos: 1,
    bills: [
      {
        id: 'd10_queda',
        label: 'Táxi da UPA e curativo (Dona Zélia)',
        // ROTEIRO 3.2: com socorro em 15 min ou o Zé Carlos, sem observação na UPA: só o curativo
        amount: (c) => ((Number(c.val('zelia_espera')) || 40) <= 15 || c.flag('zelia_ze_carlos') ? 10 : 30),
        when: is.flag('zelia_caiu_d10'),
        desc: (c) =>
          (Number(c.val('zelia_espera')) || 40) <= 15 || c.flag('zelia_ze_carlos')
            ? 'A queda no banheiro: só o curativo da testa. Ela não precisou passar a noite na UPA.'
            : 'A queda no banheiro: a noite na UPA, o táxi de volta e o curativo da testa.',
        onSkip: fx.add('lacos', -1, '{oconj} pagou do bolso'),
      },
    ],
    scene: ZELIA_SCENE,
    bico: BICO_SCENE,
    // Intervenção: antes da 2ª ocorrência, o rádio manda a USB para a sua casa
    field: {
      radio: [
        { before: 1, who: 'RÁDIO · DR. HENRIQUE', text: 'USB 03, QRR 2. QTH Rua das Acácias, 40, Vila Esperança. Idosa, 74, caída no banheiro, suando, confusa. {c:A nora|O genro} deu suco. ...Repete o número da casa? Quarenta. Quarenta.', when: is.present('lucia') },
        { before: 1, who: 'BENÉ', text: '{Dr}... Rua das Acácias, 40. Não é a sua casa? ...A USB 03 tá a cinco minutos de lá. A gente não pode largar esse aqui.', when: is.present('lucia') },
      ],
    },
  },
});
