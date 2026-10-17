// =============================================================================
// DIA 10 — "Ninguém é Bobo" (trotes sofisticados)
// Os trotistas evoluem: endereço real, voz calma, história plausível. "Ligar de
// volta" vira ferramenta essencial, e a pré-triagem da Simone passa a errar mais.
// Armadilha invertida: o homem que ri de nervoso é um AVC de verdade.
// Fios: 🌾 Dona Zélia (hipoglicemia — Modo Inconsistência doméstico, GDD 9.1)
//       ↺ Henrique (atende a sua família se a Zélia cair) · ↺ Biel (9-8877)
//       ↺ Cida (a aliança que ela vendeu × a aliança que a Zélia oferece)
// =============================================================================
import type { Choice, Ctx, DLine, SceneDef } from '../../engine/types';
import type { GuideScript } from '../../engine/content-api';
import { day, call, fx, is, NUM, ADDR } from '../dsl';

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
// Casa — GDD 9.1: a hipoglicemia da Dona Zélia (Modo Inconsistência doméstico)
// -----------------------------------------------------------------------------
const ESCOLHAS_ZELIA: Choice[] = [
  { label: '"Mãe, o prato tá seco. A senhora aplicou a insulina e não comeu?"', needLink: 'prato', next: 'confissao' },
  { label: '"Mãe, a sua mão tá tremendo. Isso é açúcar baixo."', needLink: 'hipo', next: 'confissao_hipo' },
  { label: 'Que bom, mãe. (Sentar e tomar o café.)', next: 'ignora' },
];

const ESCOLHAS_SUCO: Choice[] = [
  { label: '"Toma o suco agora. Agora, mãe."', affectionate: true, next: 'suco' },
  { label: '"A senhora não pode fazer isso! A senhora quer morrer?"', next: 'bronca' },
];

const QUEDA: DLine[] = [
  { who: 'NARRADOR', t: '22:00. Um barulho seco no banheiro. Depois, nada.', when: is.flag('zelia_caiu_d10') },
  { who: 'LUCIA', t: '{nome}! A sua mãe!', when: is.all(is.flag('zelia_caiu_d10'), is.present('lucia')) },
  { who: 'NARRADOR', t: 'Ela está no chão do banheiro, encharcada de suor, os olhos abertos e perdidos. Responde com palavras soltas. Um galo começa a subir na testa.', when: is.flag('zelia_caiu_d10') },
  { who: 'DAVI', t: '(na porta, de pijama) Vó? Vó, acorda...', when: is.all(is.flag('zelia_caiu_d10'), is.present('davi')) },
  { who: 'NARRADOR', t: 'Você corre até a cozinha e acha, atrás da lata de açúcar, um copo de suco cheio. Ela engole de golinho em golinho, com você segurando a cabeça dela.', when: is.flag('zelia_caiu_d10') },
  { who: 'NARRADOR', t: 'Ela bateu a cabeça na pia. Você liga para a emergência do seu próprio celular.', when: is.flag('zelia_caiu_d10') },
  { who: 'VOZ', t: 'R-Regulação... Dr. Henrique... o que aconteceu?', when: is.flag('zelia_caiu_d10') },
  { who: 'NARRADOR', t: 'A voz é lenta. Arrastada. As sílabas escorregam umas nas outras.', when: is.flag('zelia_caiu_d10') },
  { who: 'NARRADOR', t: 'Você sabe exatamente o que essa voz significa.', when: is.flag('zelia_caiu_d10') },
  { who: 'EU', t: 'Henrique, sou eu. {nome}. Minha mãe: diabética, hipoglicemia, caiu e bateu a cabeça. Rua das Acácias, 40.', when: is.flag('zelia_caiu_d10') },
  { who: 'HENRIQUE', t: 'Rua das... Acácias. Tá. Qual... qual número mesmo?', when: is.flag('zelia_caiu_d10') },
  { who: 'NARRADOR', t: 'Você repete. Ele pergunta de novo.', when: is.flag('zelia_caiu_d10') },
  { who: 'JOANA', t: 'Desculpa a demora, {dr}. O noturno passou "Rua das Palmeiras". A gente rodou a Vila inteira.', when: is.flag('zelia_caiu_d10') },
  { who: 'NARRADOR', t: 'Quarenta minutos. A sua mãe sai na maca da USB 01, acordada, pedindo desculpa pela camisola.', when: is.flag('zelia_caiu_d10') },
];

const ZELIA_SCENE: SceneDef = {
  id: 'd10_zelia',
  bg: 'cozinha',
  cast: ['ZELIA', 'LUCIA', 'DAVI'],
  nodes: {
    start: {
      lines: [
        { who: 'NARRADOR', t: 'Cozinha. Fim de tarde. Você volta da padaria com o pão; a casa está quieta. A Dona Zélia está sentada de costas para a pia.' },
        { who: 'ZELIA', t: 'Chegou cedo hoje, {filho}. Senta, tem café requentado.' },
        { who: 'EU', t: 'A senhora almoçou, mãe?' },
        { who: 'ZELIA', t: '{{Almocei, almocei|almocei}}. Arroz com ovo. Tava uma delícia.' },
        { who: 'NARRADOR', t: '{{Uma gota de suor desce pela têmpora dela|suor}}, devagar. A janela está aberta e a tarde já esfriou.' },
        { who: 'ZELIA', t: '{{Tô ótima, {filho}. Para de me olhar com essa cara de plantão.|otima}}' },
      ],
      choices: [ESCOLHAS_ZELIA[0], ESCOLHAS_ZELIA[1], { label: '"Almoçou mesmo, mãe?"', next: 'insiste' }, ESCOLHAS_ZELIA[2]],
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
        { who: 'NARRADOR', t: 'Você toma o café requentado. Conta da igreja que virou trote, do homem que ria de nervoso. Ela ri nas horas certas.' },
        { who: 'ZELIA', t: 'Vai tomar um banho, {filho}. Você tá com cheiro de central.' },
        { who: 'NARRADOR', t: 'No jantar, ela empurra o prato pro lado.' },
        { who: 'ZELIA', t: 'Já belisquei na vizinha. Comam vocês.' },
      ],
      next: 'dinheiro',
    },
    dinheiro: {
      lines: [
        { who: 'NARRADOR', t: 'Mais tarde, com o Liam dormindo, a Dona Zélia põe na mesa uma caixinha de veludo vermelho, gasta nos cantos.' },
        { who: 'ZELIA', t: 'Eu falei que vendia alguma coisa. Falei sério.', when: is.not('bombinha') },
        { who: 'ZELIA', t: 'Ontem foi o susto do menino. Amanhã é o aluguel. Eu sei fazer conta, {filho}. Fiz.', when: is.flag('bombinha') },
        { who: 'ZELIA', t: 'A aliança do seu pai. Ouro dezoito. O Seu Jacó, da joalheria da XV, dá duzentos. Eu já fui lá perguntar.' },
        { who: 'ZELIA', t: 'Seu pai ia preferir ver o neto respirando do que ver isso aqui dentro de uma gaveta.' },
      ],
      choices: [
        { label: 'Aceitar a aliança.', next: 'vende', effect: fx.all(fx.money(200, 'A aliança do seu pai'), fx.add('lacos', -1, 'a aliança'), fx.set('alianca_vendida')) },
        { label: '"Guarda, mãe. Isso não se vende."', next: 'guarda' },
      ],
    },
    vende: {
      lines: [
        { who: 'NARRADOR', t: 'Ela empurra a caixinha pra você. Antes de soltar, abre uma última vez.' },
        { who: 'ZELIA', t: 'Ele me deu isso dentro de um ônibus. Não tinha dinheiro pro jantar, então me deu no ônibus mesmo, na frente de todo mundo. Ficou vermelho, o bobo.' },
        { who: 'ZELIA', t: 'Vende amanhã cedo, {filho}. Antes de eu me arrepender.' },
        { who: 'NARRADOR', t: 'Você guarda a caixinha no bolso do jaleco. Pesa mais do que devia.' },
        { who: 'NARRADOR', t: 'Você lembra da Dona Cida, de manhã, no telefone: "Ouro a gente vende uma vez só. Depois fica o dedo pelado, contando história."', when: is.flag('cida_conversou_d10') },
      ],
      next: 'noite',
    },
    guarda: {
      lines: [
        { who: 'NARRADOR', t: 'Você fecha a caixinha e devolve. Ela segura a sua mão por cima do veludo.' },
        { who: 'EU', t: 'Uma senhora me disse hoje, no telefone, que ouro a gente vende uma vez só.', when: is.flag('cida_conversou_d10') },
        { who: 'ZELIA', t: 'Senhora sabida. Deve ser lá da igreja.', when: is.flag('cida_conversou_d10') },
        { who: 'ZELIA', t: '{m:Teimoso|Teimosa} igual a ele.' },
        { who: 'ZELIA', t: 'Então faz um trato comigo: eu como direito, e você para de olhar pra minha mão.', when: is.all(is.flag('zelia_hipo_percebida'), is.not('zelia_fechada')) },
        { who: 'NARRADOR', t: 'Ela guarda a caixinha no bolso do avental.' },
      ],
      next: 'noite',
    },
    noite: {
      onEnter: (e) => {
        if (e.flag('zelia_hipo_percebida')) return;
        // C) não percebeu / ignorou: a queda das 22:00
        e.set('zelia_caiu_d10');
        e.set('henrique_atendeu_zelia');
        e.s.family.zelia.risk += 3;
        e.add('desgaste', 10, 'a queda da sua mãe');
      },
      lines: [
        { who: 'NARRADOR', t: 'Antes de dormir, ela bate na porta do seu quarto: "Jantei. Arroz, feijão e um tomate. Pode dormir, {dr}."', when: is.all(is.flag('zelia_hipo_percebida'), is.not('zelia_fechada')) },
        { who: 'NARRADOR', t: 'Antes de dormir, você ouve a geladeira abrir e fechar. Ela comeu sozinha, no escuro, pra você não ver.', when: is.flag('zelia_fechada') },
        ...QUEDA,
      ],
      choices: [
        { label: '(Anotar no celular: hora, voz, endereço trocado.)', when: is.flag('zelia_caiu_d10'), next: 'anotou' },
        { label: '(Não pensar nisso agora.)', when: is.flag('zelia_caiu_d10'), next: 'upa' },
      ],
    },
    anotou: {
      onEnter: fx.set('anotou_henrique_d10'),
      lines: [
        { who: 'NARRADOR', t: 'Você digita com a mão que ainda treme: "22:07. Henrique. Voz arrastada. Pediu o número duas vezes. Passou Palmeiras em vez de Acácias."' },
        { who: 'NARRADOR', t: 'Você salva a nota. Não sabe pra quem ela serve. Ainda.' },
      ],
    },
    upa: {
      lines: [{ who: 'NARRADOR', t: 'Você passa a madrugada na sala de espera da UPA, segurando a mão da sua mãe. A voz arrastada fica no fundo da cabeça, como uma ligação que ninguém desligou.' }],
    },
  },
  inspect: {
    objects: [
      { id: 'prato_seco', label: 'Prato no escorredor', desc: 'Um prato no escorredor. Limpo e seco: nem uma gota da torneira. Ninguém comeu nele hoje.', x: 20, y: 84, w: 30, h: 14 },
      { id: 'xicara', label: 'A xícara de café', desc: 'A xícara treme na mão direita dela. O café faz ondinhas. Quando percebe que você olhou, ela segura com as duas mãos.', x: 150, y: 104, w: 14, h: 12 },
      {
        id: 'insulina',
        label: 'Insulina',
        desc: (c) =>
          c.flag('geladeira_quebrada') && !c.flag('geladeira_ok')
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
        { who: 'LUCIA', t: '{nome}, a sua mãe caiu no banheiro. Tava suando, falando coisa sem sentido. Eu achei um suco escondido atrás da lata de açúcar e dei pra ela. Ela engoliu.', when: is.present('lucia') },
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
        sangramento: 'Não.',
      },
      extra: [
        { id: 'nome_pai', label: 'Nome completo do seu pai?', say: 'Qual o nome completo do seu pai?', a: '{{José... José da Silva.|nome_generico}}' },
        { id: 'ouvir_pai', label: 'Pedir para ouvir o pai', say: 'Coloca o telefone perto dele. Eu quero ouvir a respiração dele.', a: ['[{{nada: nem respiração, nem gemido|nada}}]', 'Ele... ele virou pro outro lado.'] },
        {
          id: 'igreja',
          label: '"No endereço tem uma igreja."',
          kind: 'confronto',
          locked: true,
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
      addr: { rua: 'Rua Ipê', n: 901, bairro: 'Jardim Norte', ref: 'Escola Estadual Prof. Aurélio Matos, entrada da quadra pela lateral.' },
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
      note: (c) => (bielNoQuadro(c) ? 'Risada. É o 9-8877 de novo, {dr}.' : 'Tô ouvindo risada, {dr}.'),
      noteWrong: 'Menino engasgado! Parece sério.',
      addr: { rua: 'Rua dos Bem-te-vis', n: 4800, bairro: 'Bela Vista' },
      amb: ['risadas', 'videogame'],
      open: [
        'Alô, emergência? Corre, {{o meu amigo engoliu o controle do videogame|controle}}! Inteiro! Com pilha e tudo!',
        '[{{risadas de dois ou três moleques; um grita "fala do fio!"|risadas}}]',
        'E o fio! O fio tá pra fora! [risada]',
      ],
      q: {
        oque: 'Ele tava perdendo e engoliu! Pra ninguém mais jogar! [risadas]',
        consciencia: 'Tá... tá jogando ainda! Quer dizer, tá desmaiado!',
        respira: 'Pelo nariz! O fio tá saindo pela boca!',
        idade: 'Treze. Não, quinze. [risada]',
        referencia: 'Rua dos Bem-te-vis, quatro mil e oitocentos. Do lado da... da casa do lado.',
        paciente: '[{{"Glub, glub!" — e a gargalhada explode|glub}}]',
        seguranca: 'Seguro, mas vem rápido senão ele engole o outro controle! [risadas]',
        sangramento: 'Não! Quer dizer, sim!',
      },
      extra: [
        {
          id: 'avo',
          kind: 'confronto',
          locked: true,
          label: '"Gabriel, o seu avô sabe?"',
          say: 'Gabriel, o seu avô sabe que você liga pra cá?',
          a: ['[as risadas param de uma vez]', '[{{silêncio; alguém sussurra: "como é que ele sabe o teu nome?"|silencio_biel}}]', '[desliga]'],
          onAsk: fx.set('d10_biel_nome'),
        },
      ],
      callback: ['[{{Chama, chama... cai na caixa postal. A mensagem é uma risada gravada.|retorno_caixa}}]'],
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
        amount: 30,
        when: is.flag('zelia_caiu_d10'),
        desc: 'A queda no banheiro: o táxi de volta da UPA e o curativo da testa.',
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
