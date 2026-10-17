// =============================================================================
// DIA 19 — "Dona Cida" (Manual p.19: Regional sem vaga → "vaga zero")
// Colheita: 🌾 Dona Cida (AVC às 18:30, âncora). Sinais: D16 (esqueceu o nome da
// novela) e D17 (repetiu a mesma frase). Ligar a fala arrastada ao diário (d16/d17)
// ou ao post-it "só conversa" libera o reconhecimento imediato (cida_reconhecida).
// Ecos: Liam no D9 (tórax silencioso), Seu Hélio no D9 (insulina sem almoço),
// Reginaldo no D1 (o mesmo dente), Henrique de manhã (a outra fala enrolada).
// =============================================================================
import type { CallRT, Ctx, DLine, LineDef, SceneDef, LinkDef, Choice } from '../../engine/types';
import type { GuideScript } from '../../engine/content-api';
import { day, call, fx, is, NUM, ADDR } from '../dsl';
import { DAY as D16 } from './d16';

/** A ligação da Cida no dia 16 (sinal 1) só vira pista se o dia 16 a tiver com esse id. */
const TEM_D16_CIDA = D16.calls.some((x) => x.id === 'd16_cida');

const rtOf = (c: Ctx, defId: string): CallRT | undefined => (c.s.shift ? Object.values(c.s.shift.calls).find((x) => x.def === defId) : undefined);
/** fala arrastada (estilo de transcrição diferente) */
const arr = (t: string): LineDef => ({ t, style: 'arrastada' });

export const GUIDES_EXTRA: Record<string, GuideScript> = {
  // Conferido (campo A15: falta de ar → sentado, em posição de conforto; campo C: salbutamol com espaçador; RC3/RP1:
  // sonolência, lábios roxos e tórax silencioso são exaustão → manter acordada até a USA).
  asma_crianca: {
    id: 'asma_crianca',
    title: 'Orientação: crise de asma grave (criança)',
    kind: 'dialogo',
    intro: 'A avó está sozinha com a menina. Ganhe tempo até a USA chegar. Não deixe ela dormir.',
    panic: 80,
    steps: [
      {
        who: 'AVÓ',
        say: 'Ela tá deitadinha no sofá, quietinha...',
        options: [
          { label: 'Senta ela no colo, inclinada pra frente, com a roupa frouxa. Deitada, o ar entra menos.', kind: 'certo' },
          { label: 'Deixa ela deitada descansando, tá cansada.', kind: 'errado', reply: 'Mas ela tá ficando mais roxinha deitada!' },
          { label: 'Dona Rita, a senhora tá fazendo tudo certo. Fica comigo.', kind: 'calma' },
        ],
      },
      {
        who: 'AVÓ',
        say: 'A bombinha dela tá aqui, mas tem pouquinho.',
        options: [
          { label: 'Usa com o espaçador, do jeito que o médico ensinou. Pode repetir enquanto a ambulância vem.', kind: 'certo' },
          { label: 'Guarda, que tá acabando.', kind: 'errado', reply: 'Ela tá puxando mais forte!' },
          { label: 'Dá um xarope de mel.', kind: 'errado' },
        ],
      },
      {
        who: 'AVÓ',
        say: 'O olhinho dela tá fechando...',
        options: [
          { label: 'Chama ela pelo nome, conversa, não deixa dormir. Conta as respirações em voz alta pra mim.', kind: 'certo' },
          { label: 'Deixa ela dormir, que melhora.', kind: 'errado', reply: 'Ela não tá respondendo direito!' },
          { label: 'Respira comigo, Dona Rita. A ambulância tá chegando.', kind: 'calma' },
        ],
      },
      {
        who: 'AVÓ',
        say: 'Tô ouvindo a sirene!',
        options: [
          { label: 'Abre a porta e separa a bombinha e os papéis dela pra equipe.', kind: 'certo' },
          { label: 'Sai correndo com ela pra rua.', kind: 'errado' },
        ],
      },
    ],
    success: 'A menina chegou à equipe sentada, acordada, chiando de novo: o ar voltou a passar.',
    fail: 'O pânico atrapalhou, mas a equipe chegou.',
  },
  // Conferido (campo A15: AVC consciente fica sentado, sem esforço; nada pela boca pelo risco de engasgo; RM2: vigiar a
  // consciência na linha até a equipe entrar).
  avc_cida: {
    id: 'avc_cida',
    title: 'Orientação: AVC — Dona Cida, sozinha',
    kind: 'dialogo',
    intro: 'Ela está sozinha e com a fala arrastada. Mantenha a Dona Cida sentada, acordada e na linha até a equipe entrar.',
    panic: 60,
    steps: [
      {
        who: 'CIDA',
        say: 'O gato... tá miando... na porta...',
        options: [
          { label: 'Dona Cida, fica sentada onde a senhora está. Não levanta.', kind: 'certo' },
          { label: 'Levanta e vai abrir a porta pro moço.', kind: 'errado', reply: '[um baque surdo] ...caí... {meu} {filho}...' },
          { label: 'Eu tô aqui. Não vou desligar.', kind: 'calma' },
        ],
      },
      {
        who: 'CIDA',
        say: 'Tô com sede... vou pegar... um copo d’água...',
        options: [
          { label: 'Não bebe nada agora. A senhora pode engasgar.', kind: 'certo' },
          { label: 'Pode beber, devagarinho.', kind: 'errado', reply: '[tosse, engasgo] ...desceu... errado...' },
          { label: 'Daqui a pouco, Dona Cida. Fica comigo.', kind: 'calma' },
        ],
      },
      {
        who: 'CIDA',
        say: 'Tô com... sono...',
        options: [
          { label: 'Fica acordada comigo. Me conta o nome do gato.', kind: 'certo' },
          { label: 'Pode cochilar, a ambulância já tá chegando.', kind: 'errado', reply: '[silêncio comprido]' },
          { label: 'A senhora tá indo muito bem.', kind: 'calma' },
        ],
      },
      {
        who: 'CIDA',
        say: 'Tão batendo... no portão...',
        options: [
          { label: 'É a equipe. Fala pra eles onde tá a chave.', kind: 'certo' },
          { label: 'Não abre pra ninguém.', kind: 'errado' },
        ],
      },
    ],
    success: 'A Dona Cida ficou sentada, acordada e na linha até a equipe entrar.',
    fail: 'A equipe entrou, mas a orientação teve falhas.',
  },
};

// -----------------------------------------------------------------------------
// Casa: a véspera do último dia
// -----------------------------------------------------------------------------
function vesperaD19(c: Ctx): SceneDef {
  const luc = is.present('lucia')(c);
  const dav = is.present('davi')(c);
  const zel = c.s.family.zelia.status !== 'morto' && is.present('zelia')(c);
  const fome = c.s.bills.foodMissed > 0;
  const cida = c.key('cida');
  const lacos = c.v('lacos');
  const doente = (['lucia', 'davi', 'zelia'] as const).filter((m) => ['doente', 'critico', 'internado', 'frio', 'fome'].includes(c.s.family[m].status));

  const lines: DLine[] = [
    { who: 'NARRADOR', t: 'Arroz, feijão ralo e um ovo cortado em quatro. Ninguém fala da comida.', when: () => fome },
    { who: 'NARRADOR', t: 'Frango assado, arroz soltinho e a salada que a Dona Zélia tempera com limão demais. Hoje ninguém reclama do limão.', when: () => !fome && zel },
    { who: 'NARRADOR', t: 'Macarrão com salsicha, que é o que o Liam pediu. Hoje ninguém reclama de nada.', when: () => !fome && !zel },
    { who: 'NARRADOR', t: 'A cadeira da Dona Zélia continua na mesa. Ninguém teve coragem de tirar.', when: (cc) => cc.s.family.zelia.status === 'morto' },
    { who: 'NARRADOR', t: 'Duas cadeiras vazias do outro lado da mesa. Você janta de frente pra elas.', when: (cc) => cc.flag('lucia_foi_embora') },
    { who: 'LUCIA', t: 'Amanhã é o último plantão do contrato, né? Vinte dias.', when: () => luc },
    { who: 'ZELIA', t: 'Vinte dias e parece um ano. Seu pai dizia isso do quartel.', when: () => zel },
    { who: 'ZELIA', t: 'Eu tô bem, {filho}. Para de me olhar com essa cara de ficha.', when: () => zel && doente.includes('zelia') },
    { who: 'DAVI', t: '{Pai}, eu tô fazendo um desenho pra amanhã. Mas só mostro depois. É segredo.', when: () => dav },
    { who: 'NARRADOR', t: 'O Liam tosse um pouco, e todo mundo olha pra ele ao mesmo tempo. Ele revira os olhos.', when: () => dav && doente.includes('davi') },
    { who: 'NARRADOR', t: 'Você ainda tem a voz da Dona Cida no ouvido. Lenta, arrastada: "só queria ouvir uma voz".', when: () => !!cida },
    { who: 'NARRADOR', t: '{Oconj} apoia o pé no seu, embaixo da mesa, como fazia antes de tudo.', when: () => luc && lacos >= 7 },
    { who: 'NARRADOR', t: '{Oconj} come olhando o prato. De vez em quando, olha pra você como quem confere se você ainda está ali.', when: () => luc && lacos <= 4 },
  ];

  const choices: Choice[] = [];
  if (cida) choices.push({ label: 'Contar da Dona Cida.', next: cida === 'salvo' ? 'cida_viva' : 'cida_morta' });
  if (luc || zel) choices.push({ label: 'Agradecer pela comida.', next: 'agradece', affectionate: true, effect: fx.add('lacos', 1, 'agradeceu na véspera') });
  if (dav) choices.push({ label: 'Prometer chegar cedo amanhã.', next: 'promessa', effect: fx.set('prometeu_cedo') });
  choices.push({ label: 'Ficar em silêncio, olhando todo mundo.', next: 'silencio' });

  return {
    id: 'd19_vespera',
    bg: 'cozinha',
    cast: [luc ? 'LUCIA' : '', dav ? 'DAVI' : '', zel ? 'ZELIA' : ''].filter(Boolean),
    nodes: {
      start: { lines, choices },
      cida_viva: {
        lines: [
          { who: 'EU', t: 'Hoje uma senhora ligou. A Dona Cida. Liga todo dia pra falar de novela. Hoje ligou com a fala arrastada. Era um AVC. Chegou a tempo.' },
          { who: 'ZELIA', t: 'A Cida? A Cida do grupo da igreja? Da Pitangueira?', when: () => zel },
          { who: 'ZELIA', t: 'Ela me ligou domingo pra contar da novela. Disse que tinha {m:um doutor|uma doutora} na central que perguntava da novela de volta. Era você, {filho}?', when: () => zel },
          { who: 'EU', t: 'Era.', when: () => zel },
          { who: 'ZELIA', t: 'Amanhã eu levo um bolo pra ela no Regional. Ela vai reclamar do açúcar.', when: () => zel },
          { who: 'LUCIA', t: 'Você reconheceu pela voz?', when: () => !zel && luc },
          { who: 'EU', t: 'Ela não falou da novela. Foi isso.', when: () => !zel && luc },
        ],
        onEnter: fx.add('humanidade', 1, 'contou da Dona Cida'),
      },
      cida_morta: {
        lines: [
          { who: 'EU', t: 'Hoje uma senhora ligou. A Dona Cida. Liga todo dia pra falar de novela. Hoje ligou com a fala arrastada.' },
          { who: 'ZELIA', t: '...A Cida? Do grupo?', when: () => zel },
          { who: 'NARRADOR', t: 'A Dona Zélia larga o garfo devagar.', when: () => zel },
          { who: 'ZELIA', t: 'Ela tinha medo de morrer sozinha. Falava isso toda terça, depois da reza.', when: () => zel },
          { who: 'ZELIA', t: 'Ela não morreu sozinha, {filho}. Ela tava ligando pra alguém.', when: () => zel },
          { who: 'LUCIA', t: '({c:ela|ele} segura a sua mão por cima da mesa e não diz nada)', when: () => !zel && luc },
          { who: 'NARRADOR', t: 'Ninguém responde. O prato esfria.', when: () => !zel && !luc },
        ],
      },
      agradece: {
        lines: [
          { who: 'ZELIA', t: 'Agradece o ovo. Ele que se sacrificou.', when: () => fome && zel },
          { who: 'ZELIA', t: 'Agradece o frango. Eu só segurei a faca.', when: () => !fome && zel },
          { who: 'LUCIA', t: 'De nada. Amanhã você lava.', when: () => luc },
        ],
      },
      promessa: {
        lines: [
          { who: 'LUCIA', t: 'Cedo é sete horas, {nome}. Não oito. Não nove.', when: () => luc },
          { who: 'DAVI', t: 'Promete de mindinho!' },
          { who: 'NARRADOR', t: 'Você promete de mindinho. Ele aperta com a força de quem já viu promessa quebrar.' },
        ],
      },
      silencio: {
        lines: [
          { who: 'NARRADOR', t: 'Você olha cada um por um tempo. Gravando, sem saber pra quê.' },
          { who: 'NARRADOR', t: 'A Zélia percebe e finge que não. O Liam faz careta. {Oconj} sorri sem saber de quê.', when: () => zel && dav && luc },
        ],
      },
    },
  };
}

function bicoD19(c: Ctx): SceneDef {
  const dav = is.present('davi')(c);
  return {
    id: 'd19_bico',
    bg: 'preto',
    nodes: {
      start: {
        lines: [
          { who: 'NARRADOR', t: 'Véspera do último dia e você está na traseira da USA 01, segurando a cabeça de um bêbado que canta enquanto o Márcio faz o curativo.' },
          { who: 'NARRADOR', t: 'Quando você chega, tem um prato coberto em cima do fogão. Em cima do prato, um desenho virado pra baixo e um bilhete: "SÓ PODE VER AMANHÃ".', when: () => dav },
          { who: 'NARRADOR', t: 'Quando você chega, tem um prato coberto em cima do fogão. A casa dorme.', when: () => !dav },
        ],
      },
    },
  };
}

// -----------------------------------------------------------------------------
const linksCida: LinkDef[] = [
  {
    a: 'fala_arrastada',
    b: 'diario:d17_cida',
    insight: 'Dia 17: ela repetiu "a água tá entrando em casa" duas vezes, igualzinho. Hoje a fala arrasta e falha. Não é solidão: é o cérebro dela pedindo socorro.',
    unlock: 'reconhecer',
  },
  {
    a: 'fala_arrastada',
    b: 'doc:cida',
    insight: 'O post-it diz "só conversa". Mas a Dona Cida que conversa fala rápido, ri, conta a novela inteira. Esta não. O post-it está errado hoje.',
    unlock: 'reconhecer',
  },
  {
    a: 'sem_novela',
    b: 'novela_tv',
    insight: 'A novela está passando na TV dela, e ela pergunta "que novela?". A Dona Cida nunca perdeu um capítulo.',
    unlock: 'reconhecer',
  },
  { a: 'braco_bobo', b: 'manual:fast', insight: 'Braço "bobo" de um lado só e fala arrastada: FAST positivo. Suspeita de AVC (Manual p.6).' },
  { a: 'um_braco', b: 'manual:fast', insight: 'Só um braço sobe, o sorriso é "acho", a frase não termina: FAST positivo nos três. AVC (Manual p.6).' },
  { a: 'inicio_novela', b: 'manual:janela', insight: 'Começou às seis, com a novela: meia hora. Dentro da janela de 4h30. USA → Regional, e a vaga zero se o Regional travar (Manual p.6 e p.19).' },
  ...(TEM_D16_CIDA
    ? [
        {
          a: 'fala_arrastada',
          b: 'diario:d16_cida',
          insight: 'Dia 16: esqueceu o nome da novela. Dia 17: repetiu a mesma frase. Hoje: a fala arrastada. Três avisos. Este é o que não pode passar.',
          unlock: 'reconhecer',
        },
        {
          a: 'sem_novela',
          b: 'diario:d16_cida',
          insight: 'No dia 16 ela não lembrou o nome da novela. Hoje não lembra que existe novela.',
          unlock: 'reconhecer',
        },
      ]
    : []),
];

export const DAY = day({
  day: 19,
  title: 'Dona Cida',
  weekday: 'Quinta-feira',
  weather: 'Céu limpo depois da chuva. 27 °C. O barro secou nas calçadas e virou poeira.',
  noVacancy: true,
  onStart: fx.all(fx.doc('postit_cida'), fx.doc('ramais_central')),
  newspaper: (c) => {
    const stories: { title: string; text: string }[] = [];
    if (c.flag('peixoto_caiu')) {
      stories.push({
        title: 'Coordenador da Regulação é afastado',
        text: c.s.sources.peixoto
          ? 'O coordenador da Central pediu afastamento e deve depor na Câmara. "Eu assinei as metas. Vou explicar quem escreveu", disse.'
          : 'A Saúde+ Gestão afastou o coordenador da Central "para garantir a lisura da auditoria".',
      });
    }
    if (c.flag('reforco_frota')) stories.push({ title: 'USA 03 volta às ruas', text: 'Após a matéria, a Prefeitura determinou a volta da terceira USA "em caráter emergencial". A viatura volta hoje à base Vila Esperança.' });
    if (c.flag('odete_salva')) stories.push({ title: 'Mãe do vereador sofre infarto e é salva pela Regulação', text: 'Dona Odete, 82, está internada no Regional. "Eles salvaram a minha mãe. Os mesmos que eu ataquei", disse Arlindo Matos.' });
    else if (c.flag('odete_morreu')) stories.push({ title: 'Morre Dona Odete, mãe do vereador', text: 'Odete Matos, 82, morreu de infarto. O vereador cancelou a agenda e não falou com a imprensa.' });
    if (!c.flag('materia_forte')) stories.push({ title: 'OS processa a Gazeta', text: 'A Saúde+ Gestão entrou na Justiça contra o jornal. A repórter Carla Nunes diz que "tem mais coisa pra sair".' });
    stories.push({ title: 'Céu limpo, barro seco', text: 'Depois do temporal, a Defesa Civil contabiliza 312 desalojados. Previsão de sol até o fim de semana.' });
    return {
      headline: 'Regional opera com 160% da capacidade; pacientes esperam em macas no corredor',
      sub: 'Depois da enchente, o hospital não tem leito na emergência. Ambulâncias ficam retidas na porta, com o paciente na prancha.',
      photo: 'corredor',
      stories: stories.slice(0, 4),
      notice: 'Manual p.19: Regional sem vaga. Para o paciente vermelho, negocie a "vaga zero" por telefone.',
      ad: c.flag('materia_forte') ? 'SAÚDE+ GESTÃO — "Estamos colaborando com a auditoria."' : 'SAÚDE+ GESTÃO — Eficiência que salva.',
      weather: 'Sol · 27 °C',
    };
  },
  handover: (c) => {
    const den = c.flag('denunciou_henrique');
    const lines: DLine[] = [{ who: 'NARRADOR', t: '07:00. Céu limpo pela primeira vez em três dias. Na central, o balde do ar-condicionado voltou a ser um balde só.' }];
    if (den) lines.push({ who: 'PAULA', t: 'Paula. Noite de vaga zero: o Regional tá com maca no corredor até a porta da capela. Liga pro plantonista e chama pelo nome, Marcelo. Ajuda.' });
    else {
      lines.push({ who: 'HENRIQUE', t: 'Bom dia... {nome}. Noite... tranquila.' });
      lines.push({ who: 'NARRADOR', t: 'A voz dele arrasta nas vogais. O rosto está igual dos dois lados; as mãos, firmes no crachá; a menta por cima de tudo. Fala enrolada tem mais de um motivo. Você sabe qual é o dele.' });
    }
    lines.push(
      c.flag('simone_crise_ok')
        ? { who: 'SIMONE', t: 'Treze por oito hoje. Tomei o remédio. Não precisa perguntar.' }
        : { who: 'SIMONE', t: 'Bom dia, {dr}. O Regional já ligou duas vezes avisando que tá sem vaga. Como se fosse novidade.' },
    );
    if (c.flag('peixoto_caiu')) lines.push({ who: 'SIMONE', t: 'O Peixoto saiu ontem com uma caixa de papelão debaixo do braço. Deixou o vaso de planta. Ninguém sabe quem assume.' });
    return {
      id: 'd19_passagem',
      bg: 'central',
      nodes: {
        start: {
          lines,
          choices: den
            ? [{ label: 'Pegar o fone.' }]
            : [
                { label: '"Henrique, você bebeu?"', next: 'bebeu' },
                { label: '"Vai pra casa dormir, Henrique."', next: 'dormir' },
                { label: '"Henrique, você tá bem?"', next: 'tabem', when: is.flag('henrique_perguntado') },
              ],
        },
        bebeu: {
          lines: [
            c.flag('encobriu_henrique')
              ? { who: 'HENRIQUE', t: 'Você assinou embaixo, lembra? Então não pergunta.' }
              : { who: 'HENRIQUE', t: 'Bebi café, {nome}. Doze. (ele ri sozinho) Vai, pega o fone.' },
          ],
        },
        dormir: { lines: [{ who: 'HENRIQUE', t: 'Dormir é o que eu mais faço. É acordar que tá difícil.' }] },
        tabem: {
          lines: [
            { who: 'HENRIQUE', t: 'Você é a única pessoa daqui que pergunta isso. Sabia? Desde o primeiro dia.' },
            { who: 'NARRADOR', t: 'Ele não responde a pergunta. Vai embora antes.' },
          ],
        },
      },
    };
  },
  timeline: [
    { at: '07:01', kind: 'radio', who: 'USA 03 · ZÉ CARLOS', when: is.flag('reforco_frota'), text: 'Central, USA 03 de volta, base Vila Esperança, QRV! Três semanas parada no pátio e o motor pegou de primeira. Bom dia, gente.' },
    { at: '07:02', kind: 'radio', who: 'REGULAÇÃO REGIONAL', text: 'Hospital Regional: emergência com 160% da capacidade. Sem leito e sem maca. Vaga zero só por contato direto do regulador.' },
    {
      at: '09:30',
      kind: 'script',
      id: 'coordenacao',
      run: (c) => {
        if (c.flag('peixoto_caiu')) c.modal('COORDENAÇÃO INTERINA', 'Bom dia, {dr}. Coordenação interina, até a auditoria. Recado da OS: metas suspensas. Recado meu: faça o que o manual manda e anote tudo.', 'interfone');
        else if (c.s.sources.peixoto) c.modal('DR. PEIXOTO', 'Regional sem vaga, {dr}. Vaga zero é com você: o plantonista atende regulador, não atende coordenador. Eu não vou ligar pra perguntar quantas USA você mandou. Manda as que precisar.', 'interfone');
        else c.modal('DR. PEIXOTO', 'Regional sem vaga. Não quero viatura parada na porta do hospital o dia inteiro com paciente na prancha, {dr}. Negocia ou desvia.', 'interfone');
      },
    },
    { at: '11:50', kind: 'simone', who: 'SIMONE', text: 'A Dona Cida não ligou hoje de manhã. Ela sempre liga. (pausa) Da outra vez era a comadre, né?' },
    { at: '15:00', kind: 'radio', who: 'USA 01 · BENÉ', text: 'Central, USA 01. Amanhã é o último, {bene}. Trinta e um anos. A patroa já encomendou o bolo. De fubá, que é o que eu gosto.' },
  ],
  calls: [
    // ----------------------------------------------------------------- 1
    call({
      id: 'd19_infarto',
      ref: 'D19 #1',
      at: '07:10',
      pool: 'grave,cardio',
      num: '(17) 3327-1450',
      caller: 'Dona Zilda (esposa)',
      callerName: 'Dona Zilda',
      type: 'comum',
      voice: 'idosa',
      note: 'Senhor com dor no peito. Esposa calma.',
      noteWrong: 'Senhor com azia. Esposa calma.',
      addr: { rua: 'Rua Jacarandá', n: 1450, bairro: 'Jardim Primavera', ref: 'Casa com varanda de madeira, do lado da padaria Santa Rita.' },
      amb: ['radio_am', 'cozinha'],
      open: ['Bom dia, {dr}. O Geraldo acordou com {{um aperto no peito|aperto}} e não passa. Ele não queria que eu ligasse.', '[um rádio AM dando a previsão do tempo; uma colher batendo em xícara]'],
      q: {
        oque: 'Ele levantou pra fazer o café e teve que sentar no meio do caminho.',
        dorpeito: '{{Vai pro braço esquerdo e pro queixo|irradia}}. E tá {{suando frio, o pijama encharcado|suor}}.',
        consciencia: 'Acordado. Quieto. Ele nunca fica quieto.',
        respira: 'Respira curtinho.',
        idade: 'Setenta e quatro.',
        inicio: 'Faz uns quarenta minutos.',
        historico: 'Pressão, colesterol. {{Ele fuma escondido no quintal, acha que eu não sei|fuma}}.',
        paciente: ['GERALDO: Bom dia... é um aperto aqui. Igual alguém sentado no meu peito.', 'GERALDO: Não precisa ambulância, não. A Zilda que é exagerada.'],
        sangramento: 'Não.',
        seguranca: 'Seguro, só nós dois e o canário.',
        referencia: 'Jacarandá, 1450, casa da varanda de madeira, do lado da padaria Santa Rita.',
      },
      extra: [{ id: 'nausea', label: 'Enjoo? Vômito?', say: 'Ele está com enjoo? Vomitou?', a: 'Enjoado, sim. Não quis nem o café, e ele não dispensa café.' }],
      links: [
        { a: 'irradia', b: 'manual:peito', insight: '74 anos, aperto que vai para o braço e o queixo, suor frio, há 40 minutos: infarto. USA → Regional (Manual p.3).' },
        { a: 'aperto', b: 'manual:vaga_zero', kind: 'confirma', insight: 'Infarto a caminho de um Regional sem vaga: negocie a "vaga zero" enquanto a USA vai. Paciente grave não espera na prancha (Manual p.19).' },
      ],
      guide: { id: 'vagazero', when: (c) => rtOf(c, 'd19_infarto')?.decision?.dest === 'REG' },
      patient: { name: 'Geraldo Amaral', age: 74, sex: 'M' },
      truth: { dx: 'Infarto agudo do miocárdio', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 60, bad: 150 } },
      onResolve: (e, r) => {
        const rt = rtOf(e, 'd19_infarto');
        if (r.outcome !== 'obito' && rt?.guide?.id === 'vagazero' && rt.guide.done && rt.guide.success) {
          (rt as CallRT & { vagaZero?: boolean }).vagaZero = true;
          e.set('vaga_zero_negociada');
          e.achievement('vaga_zero');
        }
      },
      radio: {
        ok: '{central}, {unit}. Supra de parede anterior. AAS, nitrato, seguimos {dest}. Chegamos a tempo.',
        saved: '{central}, {unit}. Supra no eletro. A vaga zero tá garantida, o plantonista já tá esperando na porta. Quem negociou isso? Seguimos {dest}.',
        dead: 'Central... {unit}. Fibrilou na prancha, na porta do Regional. Óbito às {hora}.',
        under: 'Central, {unit}! É infarto! Precisamos de USA!',
      },
      diary: {
        alive: 'Seu Geraldo, 74. Infarto às sete da manhã. Fumava escondido no quintal; a esposa sabia.',
        dead: 'Seu Geraldo, 74. Infarto às sete da manhã, a caminho de um hospital sem vaga.',
      },
    }),
    // ----------------------------------------------------------------- 2
    call({
      id: 'd19_marimbondo',
      ref: 'D19 #2',
      at: '08:05',
      pool: 'leve',
      num: '(17) 99413-2100',
      caller: 'Sandra (mãe)',
      callerName: 'Sandra',
      type: 'exagerador',
      voice: 'mulher',
      note: 'Mãe: filho picado por marimbondo.',
      noteWrong: 'Picada de inseto, alergia! Igual a da professora!',
      addr: { rua: 'Rua Pitangueira', n: 2100, bairro: 'Jardim Primavera', ref: 'Sobrado com a calha caída na frente.' },
      amb: ['passaros'],
      open: ['Bom dia. Meu filho foi picado por {{um marimbondo no dedo|marimbondo}} limpando a calha. {{Inchou o dedo todo|dedo}}! Dizem que picada mata, é verdade?', '[um adolescente reclamando ao fundo: "Mãe, para, tá tudo bem"]'],
      q: {
        respira: '{{Respira normal, tá até reclamando de mim|respira_bem}}.',
        consciencia: 'Acordado. Emburrado.',
        idade: 'Dezessete.',
        inicio: 'Faz uns quarenta minutos.',
        historico: 'Nada. Nunca teve alergia de nada.',
        oque: 'Tava limpando a calha que a chuva entupiu. Tinha um ninho lá dentro.',
        paciente: 'LUCAS: Tá doendo e inchado, só isso. A minha mãe viu um vídeo na internet.',
        sangramento: 'Não.',
        seguranca: 'Seguro. O ninho ficou lá em cima.',
      },
      extra: [
        {
          id: 'boca',
          label: 'Inchaço na boca? Manchas no corpo? Rouquidão?',
          say: 'Ele tem inchaço na boca, nos olhos, na garganta? Manchas vermelhas pelo corpo? Rouquidão?',
          a: '{{Não, só o dedo e um pouco da mão|so_dedo}}. A voz tá normal, ele não para de falar.',
        },
        {
          id: 'gelo',
          label: 'Orientar cuidados e sinais de alarme',
          kind: 'fala',
          cost: 5,
          // Conferido (RC21: reação local → orientação; os sinais para religar são os de USA do RC2: inchaço de boca ou
          // língua, falta de ar, alteração da consciência; campo A8).
          say: 'Gelo enrolado num pano por alguns minutos, tirar anel se tiver, e observar. Se inchar a boca, faltar ar, aparecer mancha no corpo ou tontura, liga na hora.',
          a: 'Gelo, anel, boca, ar, mancha. Anotei. Desculpa, {dr}. É que eu vi um vídeo.',
        },
      ],
      links: [
        { a: 'so_dedo', b: 'respira_bem', kind: 'confirma', insight: 'Inchaço só em volta da picada, quarenta minutos depois, respirando e falando normal, sem manchas: reação local. Verde.' },
        { a: 'so_dedo', b: 'diario:d09_marcia', insight: 'Na Tia Márcia, a garganta fechou em minutos e veio o apito. Aqui, só o dedo inchou. Lembrar da Márcia não é motivo para mandar a USA: é motivo para perguntar direito.' },
      ],
      patient: { name: 'Lucas Teixeira', age: 17, sex: 'M' },
      truth: { dx: 'Picada de marimbondo, reação local', sev: 'verde', ok: ['ORI'], ref: ['UBS', 'CASA'] },
      radio: { excess: '{central}, {unit}. Dedo inchado de marimbondo, {dr}. O menino ficou com vergonha da sirene.' },
      diary: { ori: 'Lucas, 17. Marimbondo no dedo, limpando a calha da enchente. Reação local. A mãe tinha visto um vídeo.' },
    }),
    // ----------------------------------------------------------------- 3
    call({
      id: 'd19_escada',
      ref: 'D19 #3',
      at: '09:00',
      pool: 'trauma_moderado',
      num: '(17) 99582-1150',
      caller: 'Toninho (colega de obra)',
      callerName: 'Toninho',
      type: 'testemunha',
      voice: 'homem',
      note: 'Pedreiro caiu da escada. Consciente.',
      noteWrong: 'Queda de altura. Parece grave.',
      addr: { rua: 'Rua das Indústrias', n: 1150, bairro: 'Distrito Industrial', ref: 'Galpão novo, portão de lona azul.' },
      amb: ['maquina', 'rua'],
      open: ['O Cícero caiu da escada aqui na obra! {{Uns dois metros|dois_metros}}. Caiu em pé e depois de lado, em cima do ombro.', '[uma betoneira girando vazia; alguém desliga]'],
      q: {
        consciencia: 'Acordado, xingando a escada.',
        respira: 'Normal.',
        idade: 'Cinquenta e dois.',
        inicio: 'Agora, uns dez minutos.',
        oque: 'O pé da escada tava no barro da chuva. Escorregou.',
        sangramento: 'Não, só ralado.',
        historico: 'Nada que eu saiba.',
        paciente: ['CÍCERO: É o ombro, rapaz. {{O osso da clavícula tá com um degrau aqui|clavicula}}.', 'CÍCERO: A cabeça eu não bati, não. Pescoço tá bom.'],
        seguranca: 'Seguro, paramos a obra.',
        referencia: 'Rua das Indústrias, 1150, galpão novo, portão de lona azul.',
      },
      extra: [
        {
          id: 'pernas',
          label: 'Mexe pernas e braços? Dor no pescoço?',
          say: 'Ele mexe as pernas e os braços? Tem dor no pescoço, formigamento?',
          a: '{{Mexe tudo, só não levanta o braço direito|mexe_tudo}}. Pescoço não dói: ele girou a cabeça pra me xingar.',
        },
      ],
      links: [
        { a: 'clavicula', b: 'mexe_tudo', kind: 'confirma', insight: 'Queda de dois metros, sem bater a cabeça, sem dor no pescoço, mexendo tudo: fratura de clavícula. Amarelo → USB → UPA.' },
        { a: 'dois_metros', b: 'manual:amarelo', insight: 'Queda de altura baixa, lúcido e sem sinal neurológico: urgência sem risco imediato. USB (Manual p.1).' },
      ],
      patient: { name: 'Cícero Almeida', age: 52, sex: 'M' },
      truth: { dx: 'Fratura de clavícula (queda de escada)', sev: 'amarelo', ok: ['USB'], dest: ['UPA'], risk: { good: 120, bad: 300, needs: 'USB' } },
      radio: { ok: 'Central, {unit}. Fratura de clavícula direita, neurológico normal. Tipoia e analgesia. Seguimos {dest}.' },
      diary: { alive: 'Seu Cícero, 52, pedreiro. A escada escorregou no barro da enchente. Clavícula.' },
    }),
    // ----------------------------------------------------------------- 4
    call({
      id: 'd19_parto',
      ref: 'D19 #4',
      at: '10:00',
      pool: 'obstetricia',
      num: '(17) 99604-0300',
      caller: 'Kelly (irmã)',
      callerName: 'Kelly',
      type: 'comum',
      voice: 'jovem_m',
      note: 'Gestante em trabalho de parto. Irmã no telefone.',
      noteWrong: 'Gestante com contrações. Pode ir de carro.',
      addr: { rua: 'Rua Sabiá', n: 300, bairro: 'Vila Esperança', ref: 'Casa com o muro amarelo, do lado da escola Monteiro Lobato.' },
      amb: ['gemidos', 'bebe'],
      open: ['Minha irmã tá em trabalho de parto! {{A bolsa estourou faz uma hora|bolsa_rota}}, as dores tão vindo {{de três em três minutos|tres_min}}!', '[gemidos ritmados; uma criança pequena perguntando "a mamãe vai buscar o neném?"]'],
      q: {
        gestacao: ['Trinta e nove semanas. {{É o terceiro|terceiro}}.', 'O segundo nasceu em duas horas, do começo ao fim.'],
        oque: 'Começou de madrugada, fraquinho. Agora apertou.',
        consciencia: 'Acordada, gemendo.',
        respira: 'Ofegante na dor, normal entre uma e outra.',
        idade: 'Trinta e um.',
        inicio: 'As dores fortes, faz uma hora. A bolsa também.',
        sangramento: 'Um pouquinho de sangue com muco. Pouquinho.',
        historico: 'Pré-natal todinho, tudo normal. Pressão boa.',
        paciente: 'JAQUELINE: [respirando fundo] Tá vindo... não, ainda não... tá vindo de novo.',
        seguranca: 'Seguro. O marido levou o carro pro trabalho. Só tem eu e as crianças.',
        referencia: 'Rua Sabiá, 300, casa do muro amarelo, do lado da escola.',
      },
      extra: [{ id: 'cabeca', label: 'Vontade de fazer força? Dá pra ver a cabeça?', say: 'Ela está com vontade de fazer força? Dá pra ver a cabeça do bebê?', a: 'Força... ela diz que ainda não. {{Não dá pra ver nada ainda|nao_ve}}.' }],
      links: [
        { a: 'bolsa_rota', b: 'manual:inicio_parto', insight: 'Não é começo de trabalho de parto: bolsa rota e contrações a cada três minutos, no terceiro filho. Pode nascer rápido. USB → Maternidade (Manual p.7 e 9-A).' },
        { a: 'nao_ve', b: 'manual:expulsivo', kind: 'confirma', insight: 'Ainda sem cabeça visível e sem vontade de fazer força: não é período expulsivo agora. No terceiro filho, isso muda em minutos.' },
      ],
      worsen: [{ after: 80, lines: ['KELLY: {Dr}! {{Ela tá dizendo que vai fazer força! Tô vendo o cabelinho!|cabelinho}}'], guide: 'parto' }],
      patient: { name: 'Jaqueline Rocha', age: 31, sex: 'F' },
      // RO2: terceiro filho, bolsa rota há uma hora e contrações a cada 3 min dão Malinas perto de 7 (5 a 7 é USI/USB;
      // acima de 7, USA). USB preferida, USA ⚖, como em d07_parto e d09_parto.
      truth: { dx: 'Trabalho de parto ativo (terceiro filho, bolsa rota)', sev: 'amarelo', ok: ['USB', 'USA'], best: 'USB', dest: ['MAT'] },
      radio: {
        ok: 'Central, {unit}. Trinta e nove semanas, bolsa rota, contrações de dois em dois minutos. Seguimos {dest}. Se correr, nasce na viatura.',
        saved: 'Central, {unit}. Nasceu! Menina, chorou forte, mãe bem. Quem orientou a irmã? Mãos firmes. Seguimos {dest}.',
      },
      diary: { alive: 'Jaqueline, 31, terceiro filho. Bolsa rota, contrações de três em três minutos. Menina.' },
    }),
    // ----------------------------------------------------------------- 5 (trote)
    call({
      id: 'd19_trote',
      ref: 'D19 #5',
      at: '11:05',
      pool: 'trote',
      num: '(17) 99321-4801',
      caller: 'Voz masculina jovem',
      type: 'trotista',
      voice: 'jovem_h',
      note: 'Homem desmaiado no banheiro do shopping.',
      noteWrong: 'Homem desmaiado no shopping. Pega logo.',
      addr: { rua: 'Av. Brasil', n: 4801, bairro: 'Jardim Primavera', ref: 'Shopping Aurora, banheiro do segundo andar.' },
      amb: ['videogame', 'silencio'],
      open: ['Alô, tem um cara {{desmaiado no banheiro do Shopping Aurora|shopping}}, segundo andar. Tá caído no chão, todo branco.', '[{{fundo silencioso, sem música nem movimento de shopping; um clique de controle de videogame|quarto}}]'],
      q: {
        consciencia: 'Não acorda. Não, acorda um pouco. Mexeu o dedo.',
        respira: 'Respira... acho. Tá respirando, sim. Mais ou menos.',
        idade: 'Uns... quarenta? Trinta. Jovem.',
        oque: 'Entrei no banheiro e ele tava lá, caído.',
        seguranca: 'Seguro, seguro. Pode vir.',
        referencia: 'Shopping Aurora. Segundo andar. Banheiro masculino.',
        paciente: 'Ele não fala, tá desmaiado, ué. [{{risadinha abafada|risadinha}}]',
        historico: 'Sei lá, nunca vi ele.',
        sangramento: 'Um pouco. Da cabeça. Não, do nariz.',
      },
      extra: [{ id: 'brigada', label: 'A segurança do shopping já foi avisada?', say: 'A brigada ou a segurança do shopping já estão aí com ele?', a: '{{Que segurança? Não tem ninguém aqui, só eu|sem_seguranca}}. [pausa] Quer dizer, tão vindo.' }],
      callback: ['[{{O número chamado não existe ou está fora de serviço.|retorno_inexistente}}]'],
      links: [
        { a: 'shopping', b: 'quarto', insight: 'Diz que está no banheiro de um shopping às onze da manhã... e no fundo não tem música, eco nem gente. Só um clique de controle de videogame.' },
        { a: 'sem_seguranca', b: 'manual:trote_sinais', insight: 'Shopping tem brigada e segurança, e quem acha alguém caído chama primeiro quem está do lado. Relato que muda a cada pergunta: trote (Manual p.2).' },
        { a: 'retorno_inexistente', b: 'num', insight: 'Ligar de volta: número inexistente.' },
      ],
      patient: { name: '"Homem no banheiro"' },
      truth: { dx: 'Trote', sev: 'trote', ok: ['TROTE'], prankKind: 'trote' },
      radio: { prank: 'Central, {unit} no Shopping Aurora. A brigada olhou os três banheiros com a gente. Ninguém. Era trote.' },
    }),
    // ----------------------------------------------------------------- 6
    call({
      id: 'd19_asma',
      ref: 'D19 #6',
      at: '12:40',
      pool: 'grave,pediatria,respiratorio',
      num: '(17) 3326-2900',
      caller: 'Dona Rita (avó)',
      callerName: 'Dona Rita',
      type: 'comum',
      voice: 'idosa',
      note: 'Avó: neta com asma, não consegue falar.',
      noteWrong: 'Avó diz que a neta tá melhorando da asma.',
      addr: { rua: 'Rua Goiás', n: 2900, bairro: 'Vila Esperança', ref: 'Casa de muro azul, do lado do terreno baldio.' },
      amb: ['ventilador', 'silencio'],
      open: [
        '{m:Moço|Moça}, a minha neta tá com asma, {{ela não consegue falar|nao_fala}}!',
        '[uma respiração curta, quase sem som; um ventilador girando]',
        'Mas olha, {{parou de chiar agora. Melhorou, né?|parou_chiar}}',
      ],
      q: {
        respira: 'Puxando com a barriga... {{o peito afunda até no pescoço|afunda}}.',
        consciencia: 'Tá {{com o olhinho pesado, querendo dormir|sonolenta}}.',
        idade: 'Seis anos.',
        inicio: 'Começou ontem de noite, tossindo. Piorou faz uma hora.',
        historico: 'Asma. A bombinha dela {{tá no finzinho, dei duas vezes e nada|bombinha_fim}}.',
        oque: 'A mãe dela tá no trabalho, lá no Distrito. Eu tô sozinha com ela.',
        paciente: '[{{a menina tenta falar e só sai ar|so_ar}}]',
        sangramento: 'Não.',
        seguranca: 'Seguro. Só eu e ela.',
        referencia: 'Rua Goiás, 2900, a casa do muro azul, do lado do terreno baldio.',
      },
      extra: [{ id: 'labios', label: 'Lábios e unhas?', say: 'Como estão os lábios e as unhas dela?', a: '{{Roxinhos, {m:moço|moça}. Os dois|labios_roxos}}.' }],
      links: [
        { a: 'parou_chiar', b: 'manual:torax_silencioso', insight: '"Parou de chiar" numa crise que não deixa falar: tórax silencioso. O ar quase não entra. Gravidade extrema (Manual p.5-B).' },
        { a: 'sonolenta', b: 'manual:asma_grave', insight: 'Sonolenta, lábios roxos, não fala, peito afundando: asma grave. USA → Regional (Manual p.5-B e 9-A).' },
        {
          a: 'parou_chiar',
          b: 'diario:d09_casa',
          insight: (c) =>
            c.flag('bombinha')
              ? 'No dia 9, o Liam chiava e falava: era moderada. Aqui ela parou de chiar e não fala: é o contrário. Grave.'
              : 'Você já ouviu esse silêncio. Dentro da sua casa, no dia 9. Tórax silencioso: grave.',
        },
      ],
      worsen: [{ after: 25, lines: ['DONA RITA: {{Ela tá apagando, {m:moço|moça}!|apagando}} Não responde direito!'] }],
      guide: { id: 'asma_crianca' },
      patient: { name: 'Ana Clara Mendes', age: 6, sex: 'F' },
      truth: { dx: 'Crise de asma grave (tórax silencioso)', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 50, bad: 120, guideBonus: 15 } },
      radio: {
        ok: '{central}, {unit}. Asma grave, saturando oitenta e cinco. Nebulização, corticoide, seguimos {dest}. Ela voltou a chiar, o que é bom.',
        saved: '{central}, {unit}. Pegamos ela apagando, mas a avó manteve a menina sentada e acordada. Voltou a chiar. Seguimos {dest}.',
        dead: 'Central... {unit}. Não deu, {dr}. Óbito às {hora}. A avó ainda tá segurando a bombinha.',
        under: 'Central, {unit}! Criança em crise grave, tórax silencioso! Precisamos de USA!',
      },
      diary: {
        alive: 'Ana Clara, 6. "Parou de chiar, melhorou, né?" Não tinha melhorado. Voltou a chiar na ambulância.',
        dead: 'Ana Clara, 6. "Parou de chiar, melhorou, né?"',
      },
    }),
    // ----------------------------------------------------------------- 7
    call({
      id: 'd19_dente',
      ref: 'D19 #7',
      at: '14:10',
      pool: 'leve',
      num: '(17) 99388-0650',
      caller: 'Reginaldo',
      callerName: 'Reginaldo',
      type: 'exagerador',
      voice: 'homem',
      note: 'Dor de dente. Diz que tá morrendo. De novo.',
      noteWrong: 'Rapaz com dor forte no rosto. Parece grave.',
      addr: { rua: 'Rua Tiradentes', n: 650, bairro: 'Vila Nova', ref: 'Do lado da lotérica.' },
      amb: ['ventilador'],
      open: ['{Dr}, aqui é o Reginaldo! {{Lembra de mim? O do dente!|o_do_dente}} O mesmo dente, {dr}. Eu tô morrendo de novo!'],
      q: {
        oque: '{{Da outra vez vocês me mandaram pra UPA. Eu fui! O dentista tava de férias|ferias}}. Aí passou, aí voltou.',
        consciencia: 'Acordado, {dr}. Não durmo desde domingo.',
        respira: 'Respiro.',
        idade: 'Trinta e quatro. E meio, com esse dente.',
        inicio: 'Voltou ontem de noite.',
        historico: 'Nada. Só esse dente, que é meu inimigo.',
        paciente: 'Sou eu mesmo, {dr}! Reginaldo!',
        sangramento: 'Um pouquinho na gengiva.',
      },
      extra: [
        {
          id: 'alarme',
          label: 'Rosto inchado? Febre? Engole? Abre a boca?',
          say: 'O rosto inchou? Tem febre? Consegue engolir e abrir a boca? O inchaço desceu pro pescoço?',
          a: '{{Inchou só a gengiva, igual da outra vez|so_gengiva}}. Febre não. Engulo, abro a boca, comi até pastel.',
        },
      ],
      links: [
        { a: 'o_do_dente', b: 'diario:d01_dente', insight: 'Reginaldo, do seu primeiro plantão. O mesmo dente, mais de três semanas depois. Ele foi à UPA; o dentista estava de férias.' },
        { a: 'so_gengiva', b: 'manual:verde', insight: 'Dor de dente sem febre, sem inchaço no rosto ou no pescoço, engolindo e abrindo a boca: verde. Orientar UBS ou UPA com dentista (Manual p.1).' },
      ],
      patient: { name: 'Reginaldo Prado', age: 34, sex: 'M' },
      // RC23: "dor intensa" e "dor moderada" são USI/USB. Sem febre, sem inchaço no rosto ou no pescoço, engolindo:
      // orientação preferida, USB ⚖ (antes era excesso), igual a d01_dente, onde está a pergunta para a equipe.
      truth: { dx: 'Dor de dente, sem sinal de infecção grave', sev: 'verde', ok: ['ORI', 'USB'], best: 'ORI', ref: ['UBS', 'UPA'], dest: ['UPA'] },
      radio: {
        ok: '{central}, {unit}. É o Reginaldo, {dr}. O do dente. Levamos pra UPA; ele perguntou se dessa vez o dentista tá lá.',
        excess: '{central}, {unit}. É o Reginaldo, {dr}. O do dente. Ele perguntou se dessa vez tem dentista na ambulância.',
      },
      diary: {
        ori: 'Reginaldo, de novo. O mesmo dente do dia 1. Orientei a UBS com dentista e os sinais que não podem esperar.',
        alive: 'Reginaldo, de novo. O mesmo dente do dia 1. Foi de USB para a UPA.',
      },
    }),
    // ----------------------------------------------------------------- 8
    call({
      id: 'd19_onibus',
      ref: 'D19 #8',
      at: '16:05',
      pool: 'grave',
      num: '(17) 99144-1501',
      caller: 'Seu Juvenal (cobrador)',
      callerName: 'Seu Juvenal',
      type: 'testemunha',
      voice: 'homem',
      note: 'Motorista de ônibus passando mal. Fala enrolada.',
      noteWrong: 'Motorista bêbado no ponto. Fala enrolada.',
      addr: { rua: 'Av. Brasil', n: 1501, bairro: 'Distrito Industrial', ref: 'Ponto da Rodoviária, ônibus da linha 12 com o pisca-alerta ligado.' },
      amb: ['onibus', 'multidao'],
      open: ['O motorista parou o ônibus no ponto da Rodoviária e tá passando mal! Tá {{suando, tremendo, falando enrolado|enrolado}}!', '[passageiros reclamando; um pisca-alerta tiquetaqueando]'],
      q: {
        consciencia: 'Acordado, mas {{confuso. Perguntou duas vezes onde a gente tava|confuso}}.',
        respira: 'Normal. Rápido, mas normal.',
        idade: 'Cinquenta e poucos.',
        inicio: 'Faz uns quinze minutos. Ele errou o ponto, depois parou do nada.',
        historico: '{{Ele é diabético, toma insulina. Aplica no banheiro da garagem todo dia|insulina}}.',
        oque: 'A gente tá atrasado desde a enchente. {{Ele não almoçou pra recuperar o horário|nao_almocou}}.',
        sangramento: 'Não.',
        paciente: ['VALTER: Tô... bem... o ônibus... tá atrasado...', 'VALTER: [ri sem motivo] Cadê... a chave?'],
        seguranca: 'Seguro. Desliguei o motor e tirei a chave dele.',
        referencia: 'Ponto da Rodoviária, Av. Brasil, 1501. Linha 12, com o pisca ligado.',
        fast: ['Sorriu igual dos dois lados. {{Levantou os dois braços, e os dois ficaram|fast_ok}}.', 'A frase ele não conseguiu. Falou "o céu é a chave". [risadas nervosas de passageiros]'],
        ingestao: 'Engolir? Não tomou nada. Bebida, não: ele é da igreja, não bebe nem guaraná de festa.',
      },
      extra: [
        { id: 'cheiro', label: 'Cheiro de bebida?', say: 'Ele está com cheiro de bebida?', a: 'Nenhum, {dr}. Ele é crente. Cheira a café da garagem.' },
        {
          id: 'acucar',
          label: 'Orientar: algo doce, se engolir bem',
          kind: 'fala',
          cost: 4,
          // Conferido (campo A7: açúcar pela boca não está em AC29/BC19; só o APed24 dá glicose oral, e só consciente e
          // sem vômito. Dar só se engole bem é bom senso seguro).
          say: 'Se ele estiver engolindo bem, sem engasgar, dá um suco ou refrigerante comum, aos golinhos. Se não engolir direito, não dá nada.',
          a: 'Tem uma senhora aqui com um refrigerante! ...Ele tá tomando devagarinho. Engoliu.',
          onAsk: fx.set('d19_onibus_acucar'),
        },
      ],
      links: [
        { a: 'insulina', b: 'manual:hipoglicemia', insight: 'Diabético com insulina, sem almoço, suado, tremendo, confuso: hipoglicemia. Imita AVC, mas não é. Confuso = USA (Manual p.6).' },
        { a: 'fast_ok', b: 'enrolado', insight: 'Rosto simétrico e os dois braços firmes: o FAST não fecha AVC. A fala enrolada, com suor e tremor, aponta para açúcar baixo.' },
        { a: 'nao_almocou', b: 'insulina', insight: 'Insulina de manhã e almoço pulado: a mesma conta do Seu Hélio, no dia 9. Só que agora no volante de um ônibus.' },
      ],
      patient: { name: 'Valter Nogueira', age: 54, sex: 'M' },
      // RC10: confuso, mas responde: "alteração súbita da consciência" e "hipoglicemia" são USI/USB; USA só se não reativo
      // ou convulsionando. A USB dá glicose 50% sob orientação médica (BC19, SIV). USA preferida (Manual p.6), USB ⚖;
      // a USB que chega conta como cuidado adequado. Se não acordar, é USA, como em d06_hipo_mae.
      truth: { dx: 'Hipoglicemia grave (motorista diabético)', sev: 'vermelho', ok: ['USA', 'USB'], best: 'USA', dest: ['REG'], risk: { good: 50, bad: 120, needs: 'USB' } },
      radio: {
        ok: (c) =>
          c.flag('d19_onibus_acucar')
            ? '{central}, {unit}. Glicemia trinta e oito antes do refrigerante, setenta e dois agora. Já tá pedindo desculpa pra todo mundo. Seguimos {dest}.'
            : '{central}, {unit}. Glicemia trinta e um. Glicose na veia, acordou pedindo desculpa pros passageiros. Seguimos {dest}.',
        dead: 'Central... {unit}. Convulsionou e parou no banco do motorista. Óbito às {hora}.',
        under: 'Central, {unit}! Hipoglicemia grave, rebaixando! Precisamos de USA!',
      },
      diary: {
        alive: 'Seu Valter, 54, motorista da linha 12. Pulou o almoço pra recuperar o horário da enchente. Fala enrolada que não era AVC.',
        dead: 'Seu Valter, 54, motorista da linha 12. Pulou o almoço pra recuperar o horário da enchente.',
      },
    }),
    // ----------------------------------------------------------------- 9 ★ DONA CIDA (18:30)
    call({
      id: 'd19_cida',
      ref: 'D19 #9 ★ 18:30',
      at: '18:30',
      anchor: true,
      num: NUM.cida,
      caller: 'Dona Cida',
      callerName: 'Dona Cida',
      type: 'frequentador',
      voice: 'cida',
      note: (c) => (c.v('lealSimone') >= 7 ? 'Dona Cida. Ligando tarde hoje. A voz tá estranha, {dr}. Pega com calma.' : 'Dona Cida. Ligando tarde hoje.'),
      noteFixed: true,
      addr: ADDR.cida,
      amb: ['tv', 'silencio'],
      open: [
        arr('{{Oi... {meu} {filho}... é a... Cida|fala_arrastada}}.'),
        '[uma pausa longa; ao fundo, {{a novela das seis passando na TV|novela_tv}}]',
        arr('O braço tá... {{bobo|braco_bobo}}. Não é nada não.'),
        arr('Só queria ouvir... uma voz.'),
      ],
      q: {
        oque: arr('O braço... direito. Ficou bobo. {{Caiu a xícara... no chão|xicara}}.'),
        consciencia: arr('Tô... acordada. Só... cansada.'),
        respira: arr('Respiro... sim.'),
        idade: arr('Setenta e... nove.'),
        inicio: [arr('{{Desde que começou... a novela|inicio_novela}}.'), arr('Seis horas. Eu sentei pra ver... e não consegui... pegar o controle.')],
        fast: [arr('{{Tô sorrindo pra você... acho|sorriso}}.'), '[um esforço abafado; uma almofada caindo]', arr('{{O braço... não sobe. Só um|um_braco}}.'), arr('"O céu... é..." ...é...'), '[silêncio]'],
        historico: [arr('Pressão... Tomo o remédio... de manhã.'), arr('{{Hoje... não lembro... se tomei|nao_lembra}}.')],
        paciente: arr('Sou eu... {meu} {filho}.'),
        sangramento: arr('Não...'),
        seguranca: arr('Sozinha. Eu e o gato.'),
        referencia: arr('Casa amarela... portão verde... do lado da igreja.'),
        dorpeito: arr('Dor não... nenhuma dor.'),
      },
      extra: [
        { id: 'novela', label: 'Perguntar da novela', say: 'Dona Cida, e a novela de hoje? O que aconteceu?', a: ['[silêncio comprido]', arr('{{Que... novela, {meu} {filho}?|sem_novela}}')] },
        {
          id: 'porta',
          label: 'A porta está trancada? Tem chave?',
          say: 'Dona Cida, a porta está trancada? Tem chave com alguém?',
          a: [arr('Trancada... A chave... fica embaixo... do vaso... de samambaia.'), arr('Do lado... do portão.')],
          onAsk: fx.set('d19_cida_chave'),
        },
        {
          id: 'reconhecer',
          label: 'Reconhecer a voz dela, agora',
          kind: 'fala',
          locked: true,
          cost: 2,
          say: 'Dona Cida, é {o} {dr}. Eu tô ouvindo a senhora diferente hoje. A ambulância já tá saindo. Fica comigo: sorri pra mim e me fala desde que horas.',
          a: [arr('Tá... bom... {meu} {filho}.'), '[ela respira devagar]', arr('Desde as seis... A boca... tá torta... acho. O braço... direito... não sobe.'), arr('Você... reconheceu... a minha voz.')],
          onAsk: fx.all(fx.set('cida_reconhecida'), fx.add('humanidade', 1, 'reconheceu a Dona Cida')),
        },
        {
          id: 'conversar',
          label: 'Ficar na linha com ela',
          kind: 'fala',
          cost: 5,
          say: 'Eu tô aqui, Dona Cida. Não vou desligar.',
          a: [arr('Que bom... {meu} {filho}.'), arr('A casa... fica muito... quieta.')],
          onAsk: fx.all(fx.add('humanidade', 1, 'ficou na linha com a Dona Cida'), fx.set('cida_conversou_d19')),
        },
      ],
      links: linksCida,
      worsen: [{ after: 40, lines: ['[{{o telefone bate em alguma coisa; depois, só a TV e um gato miando perto do fone|telefone_caiu}}]'] }],
      onAnswer: fx.set('cida_ligou_d19'),
      guide: { id: 'avc_cida' },
      patient: { name: 'Aparecida (Dona Cida)', age: 79, sex: 'F' },
      // RC1: braço que não sobe, boca torta e fala arrastada são USI/USB; USA só com Glasgow abaixo de 9, convulsão ou
      // suporte ventilatório (RM8: AVC na janela pode ir de USB). Na janela, USA preferida (Manual p.6) e USB ⚖, como
      // nos AVCs dos dias 6 e 10; a USB que chega é cuidado adequado.
      truth: { dx: 'AVC na janela (idosa sozinha)', sev: 'vermelho', ok: ['USA', 'USB'], best: 'USA', dest: ['REG'], risk: { good: 60, bad: 140, needs: 'USB' }, key: 'cida' },
      noFollowup: true,
      radio: {
        ok: (c) =>
          c.flag('d19_cida_chave')
            ? '{central}, {unit}. Achamos a chave embaixo da samambaia. Dona Cida: braço direito caído, fala arrastada, dentro da janela. Seguimos {dest}. O gato quis vir junto.'
            : '{central}, {unit}. Porta trancada; a vizinha da frente tinha a chave. Dona Cida: braço direito caído, fala arrastada, dentro da janela. Seguimos {dest}.',
        saved: '{central}, {unit}. Ela ficou na linha com você até a gente entrar. Perguntei quem tava falando com ela. Ela disse "a voz". Seguimos {dest}.',
        dead: 'Central... {unit}. Dona Cida. (pausa) A TV tava ligada na novela. O gato não saiu do lado dela.',
        under: 'Central, {unit}! É AVC na janela! Precisamos de USA, agora!',
      },
      diary: {
        alive: (c) =>
          c.flag('cida_reconhecida')
            ? 'Dona Cida, 79. AVC às seis da tarde, na hora da novela. Reconheci a voz antes de ela terminar a frase.'
            : 'Dona Cida, 79. AVC às seis da tarde, na hora da novela. Chegou a tempo.',
        dead: 'Dona Cida, 79. AVC às seis da tarde, sozinha, na hora da novela. Ela só queria ouvir uma voz.',
        later: [{ day: 20, text: 'Dona Cida acordou na UTI e perguntou do gato. A vizinha da frente está cuidando dele.', when: (c) => c.key('cida') === 'salvo' }],
      },
    }),
  ],
  interlude: {
    teaser: (c) => (c.key('cida') === 'perdido' ? 'A véspera do último plantão. Você chega com a voz da Dona Cida na cabeça.' : 'A véspera do último plantão. Amanhã é o último dia do contrato.'),
    familyLacos: 2,
    onBico: fx.add('lacos', -2, 'a véspera longe de casa'),
    scene: vesperaD19,
    bico: bicoD19,
  },
});
