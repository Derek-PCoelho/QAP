// =============================================================================
// DIA 13 — "Produto de Limpeza" (Manual p.13: intoxicação em crianças)
// Âncoras: soda cáustica (orientação ativa: não provocar vômito), remédio de
// pressão da avó numa criança de 2 anos, Dona Cida (inalação de produto).
// Fios: 🌾 máquina da Cida (Humanidade ≥ 6) · ↺ Cida e Zélia (grupo de senhoras)
// · 🌱 pé da Zélia (Modo Inconsistência doméstico → D16) · 🌱 curativo da Simone.
// =============================================================================
import type { Ctx, SceneDef, DLine, HomeObject, LinkDef } from '../../engine/types';
import type { GuideScript } from '../../engine/content-api';
import { day, call, fx, is, NUM, ADDR } from '../dsl';

const presente = (c: Ctx, m: 'lucia' | 'davi') => {
  const f = c.s.family[m];
  return f.status !== 'ausente' && f.status !== 'morto' && !f.away && !c.flag('lucia_fora') && !c.flag('lucia_foi_embora');
};
const zeliaViva = (c: Ctx) => c.s.family.zelia.status !== 'morto';
/** a Cida oferece a máquina se a Humanidade chegou a 6 e ainda não há máquina em casa */
const ofertaMaquina = (c: Ctx) => c.v('humanidade') >= 6 && !c.flag('maquina');
/** levou bronca no D10: esconde melhor (menos pistas) */
const fechada = (c: Ctx) => c.flag('zelia_fechada');

type Noturno = 'paula' | 'encoberto' | 'omitido' | 'henrique';
const noturno = (c: Ctx): Noturno =>
  c.flag('denunciou_henrique') ? 'paula' : c.flag('encobriu_henrique') ? 'encoberto' : c.flag('omitiu_henrique') ? 'omitido' : 'henrique';

// -----------------------------------------------------------------------------
// Roteiro novo de orientação ativa
// -----------------------------------------------------------------------------
export const GUIDES_EXTRA: Record<string, GuideScript> = {
  // Roteiro novo: remédio de adulto (anti-hipertensivo) ingerido por criança. Conferido (campo A12: nada pela boca,
  // não provocar vômito, posição de recuperação, separar a embalagem; campo A2: RCP pediátrica se parar de respirar).
  intox_comprimido: {
    id: 'intox_comprimido',
    title: 'Orientação: remédio de adulto em criança',
    kind: 'dialogo',
    intro: 'Quem está do outro lado é a avó, e a culpa dela grita mais alto que o menino. Orientação imediata enquanto a USA se desloca.',
    panic: 70,
    steps: [
      {
        who: 'DONA IRENE',
        say: 'Ele tá molinho no meu colo... Eu dou um leite pra cortar o efeito?',
        options: [
          { label: 'Não dê nada pela boca e não provoque vômito. Nem leite, nem água.', kind: 'certo' },
          { label: 'Dá leite, ajuda a cortar o efeito.', kind: 'errado', reply: 'Ele engasgou com o leite!' },
          { label: 'Dona Irene, a ambulância já está a caminho. Eu fico na linha com a senhora.', kind: 'calma' },
        ],
      },
      {
        who: 'DONA IRENE',
        say: 'Ele quer dormir... Deixo ele dormir?',
        options: [
          { label: 'Deite ele de lado, cabeça apoiada, e fique chamando pelo nome. Me avise se ele não responder.', kind: 'certo' },
          { label: 'Deixa dormir. Sono ajuda.', kind: 'errado', reply: 'Ele tá apagando...' },
          { label: 'Joga água fria no rosto dele.', kind: 'errado', reply: 'Ele nem abriu o olho!' },
        ],
      },
      {
        who: 'DONA IRENE',
        say: 'A cartela! Eu jogo fora pra ele não pegar mais?',
        options: [
          { label: 'Não. Separe a cartela e a caixa do remédio pra entregar na mão da equipe.', kind: 'certo' },
          { label: 'Joga fora, tanto faz agora.', kind: 'errado' },
          { label: 'A senhora está indo muito bem.', kind: 'calma' },
        ],
      },
      {
        who: 'DONA IRENE',
        say: 'Ele tá respirando devagarinho... Devagar demais?',
        options: [
          { label: 'Conte as respirações em voz alta pra mim. Se ele parar de respirar, eu te ensino a massagem.', kind: 'certo' },
          { label: 'Sacode ele pra acordar.', kind: 'errado' },
          { label: 'A senhora não está sozinha. Eles estão chegando.', kind: 'calma' },
        ],
      },
      {
        who: 'DONA IRENE',
        say: 'Tô ouvindo a sirene!',
        options: [
          { label: 'Abra a porta e entregue a cartela na mão do médico.', kind: 'certo' },
          { label: 'Leva ele correndo pra rua.', kind: 'errado' },
        ],
      },
    ],
    success: 'Nada pela boca, cartela separada, menino de lado e chamado pelo nome até a equipe entrar.',
    fail: 'A avó fez o que achava certo. Nem tudo era.',
  },
};

// -----------------------------------------------------------------------------
// Casa: o pé da Dona Zélia (Modo Inconsistência doméstico)
// -----------------------------------------------------------------------------
function cenaPe(c: Ctx): SceneDef {
  const esconde = fechada(c);
  const L = presente(c, 'lucia');
  const D = presente(c, 'davi');
  const oferta = ofertaMaquina(c);
  const h6 = c.v('humanidade') >= 6;
  const onFind = fx.all(fx.set('pe_ferida'), fx.unset('pe_ferida_escondida'));
  const objects: HomeObject[] = [
    {
      id: 'meia_mancha',
      label: 'Cesto de roupa suja',
      desc: esconde
        ? 'No fundo do cesto, embaixo das toalhas, uma meia branca da Dona Zélia. Na sola, uma mancha amarelada com a borda escura. Alguém se deu ao trabalho de esconder.'
        : 'Uma meia branca da Dona Zélia em cima do cesto. Na sola, uma mancha amarelada com a borda escura. Não é sujeira de chão.',
      x: 262,
      y: 122,
      w: 30,
      h: 22,
    },
  ];
  if (!esconde) {
    objects.push({
      id: 'sapato_fechado',
      label: 'Pés da Dona Zélia',
      desc: 'Sapato fechado, de amarrar. Dentro de casa a Dona Zélia anda de chinelo desde que você se entende por gente. Trinta e um graus lá fora.',
      x: 132,
      y: 150,
      w: 28,
      h: 14,
    });
  }
  const links: LinkDef[] = esconde
    ? [{ a: 'so_cansada', b: 'meia_mancha', insight: '"Só cansada"... e escondeu no fundo do cesto uma meia com secreção na sola. É uma ferida no pé. E ela é diabética.', unlock: 'ver_pe', onFind }]
    : [
        { a: 'so_cansada', b: 'mancando', insight: 'Cansaço não faz ninguém mancar. Ela está poupando o pé direito.', unlock: 'ver_pe', onFind },
        { a: 'mancando', b: 'sapato_fechado', insight: 'Manca do pé direito e trocou o chinelo por sapato fechado, no calor. Está escondendo o pé.', unlock: 'ver_pe', onFind },
        { a: 'so_cansada', b: 'meia_mancha', insight: '"Só cansada"... e a meia dela tem secreção na sola. É uma ferida. E ela é diabética.', unlock: 'ver_pe', onFind },
        { a: 'meia_mancha', b: 'sapato_fechado', insight: 'A meia manchada é do pé direito; o sapato fechado esconde o resto. Uma ferida que ela não quer que ninguém veja.', unlock: 'ver_pe', onFind },
      ];

  const startLines: DLine[] = esconde
    ? [{ who: 'NARRADOR', t: 'Cozinha, oito da noite. Cheiro de alho frito. A Dona Zélia já está sentada quando você entra, os pés debaixo da mesa. A panela fica no fogão: ela não levanta nem pra pegar o sal.' }]
    : [
        { who: 'NARRADOR', t: 'Cozinha, oito da noite. Cheiro de alho frito. A Dona Zélia está no fogão, de costas pra porta.' },
        { who: 'NARRADOR', t: 'Quando ela vai até a pia, {{puxa um pouco a perna direita e apoia a mão no balcão|mancando}}.' },
      ];
  startLines.push({ who: 'ZELIA', t: 'Chegou, {filho}? Senta. Hoje {{eu só tô cansada|so_cansada}}, então é arroz, feijão e ovo. Quem reclamar lava a louça.' });
  if (L) {
    startLines.push(
      esconde
        ? { who: 'LUCIA', t: 'Ela tá quieta desde ontem, {nome}. Pergunta você, que comigo ela não fala.' }
        : { who: 'LUCIA', t: 'Ela passou a tarde sentada, {nome}. Não foi no grupo da igreja. Ela nunca falta no grupo.' },
    );
  } else if (c.flag('lucia_fora')) {
    startLines.push({ who: 'ZELIA', t: '{Oconj} ligou de Rio Claro. O menino tá bem, tá comendo. Mandou beijo. Pra mim. Pra você {c:ela|ele} mandou "oi".' });
  }
  if (D && !esconde) {
    startLines.push({ who: 'DAVI', t: 'Vó, por que você tá de sapato dentro de casa?' }, { who: 'ZELIA', t: 'Pra não pegar friagem, menino. Come.' });
  }

  const igrejaLines: DLine[] = [
    { who: 'EU', t: 'A senhora não foi no grupo hoje, mãe?' },
    { who: 'ZELIA', t: 'Fui não. Mas a Cida me ligou. Aparecida, do grupo de senhoras da Matriz. Viúva, mora na Bela Vista, fala pelos cotovelos.' },
    { who: 'ZELIA', t: 'Ela me contou que liga pra emergência todo santo dia. Todo dia, {filho}! Por qualquer coisa.' },
  ];
  if (h6) {
    igrejaLines.push(
      { who: 'ZELIA', t: 'E sabe o que ela disse? Que tem {um} {medico} lá que conversa com ela da novela. Que pergunta se ela almoçou. Que é a única voz que ela ouve o dia inteiro.' },
      { who: 'ZELIA', t: 'Aí eu falei o seu nome. A velha chorou no telefone, {filho}.' },
    );
    if (oferta) igrejaLines.push({ who: 'ZELIA', t: 'Ela tem uma máquina de costura parada desde que a vista piorou. Quer dar {proconj}. Falou assim: "é pro ateliê {c:da mulher|do marido} {m:do meu doutor|da minha doutora}".' });
    else igrejaLines.push({ who: 'ZELIA', t: 'Ela queria dar a máquina dela {proconj}, mas eu disse que a gente já tem uma. Ficou toda boba: disse que então vai mandar retalho.' });
  } else {
    igrejaLines.push(
      { who: 'ZELIA', t: 'Ela disse que tem uns lá que desligam na cara dela. Que ela fica até sem graça de ligar.' },
      { who: 'ZELIA', t: 'Eu disse que você não é desses. Você não é desses, né, {filho}?' },
    );
  }

  const curativoLines: DLine[] = [
    { who: 'NARRADOR', t: 'Na sua mochila, as amostras que a Simone deixou na gaveta: curativo de hidrogel, gaze, pomada. Dá pra começar hoje mesmo.', when: (cc) => cc.flag('curativo_gratis') },
    { who: 'NARRADOR', t: 'Curativo especial, na farmácia, custa noventa reais. Soro e gaze seguram até amanhã. Não mais que isso.', when: (cc) => !cc.flag('curativo_gratis') },
  ];

  return {
    id: 'd13_pe',
    bg: 'cozinha',
    cast: ['ZELIA', ...(L ? ['LUCIA'] : []), ...(D ? ['DAVI'] : [])],
    nodes: {
      start: { lines: startLines, next: 'igreja' },
      igreja: {
        lines: igrejaLines,
        choices: oferta
          ? [
              {
                label: 'Aceitar: "Diz pra ela que a gente aceita. E que eu mesm{o} vou buscar."',
                next: 'maquina_sim',
                effect: fx.all(fx.set('cida_maquina'), fx.set('maquina'), fx.add('lacos', 1, 'a máquina da Dona Cida')),
              },
              { label: 'Recusar: "Não dá, mãe. É dela. É a lembrança dela."', next: 'maquina_nao' },
            ]
          : undefined,
        next: 'noite',
      },
      maquina_sim: {
        lines: L
          ? [
              { who: 'LUCIA', t: 'Uma máquina? Pra mim? Eu nem conheço essa mulher, {nome}...' },
              { who: 'ZELIA', t: 'Mas ela conhece vocês. Pelo telefone.' },
              { who: 'NARRADOR', t: '{Oconj} vira de costas pra pia. Demora pra virar de volta.' },
            ]
          : [{ who: 'ZELIA', t: 'Fica aqui na sala esperando {oconj}. Máquina boa não estraga parada.' }],
        next: 'noite',
      },
      maquina_nao: {
        lines: [
          { who: 'ZELIA', t: 'Orgulho igualzinho ao do seu pai.' },
          { who: 'ZELIA', t: 'Vou dizer pra ela que você agradeceu. Pelo menos isso.' },
        ],
        next: 'noite',
      },
      noite: {
        lines: [
          { who: 'NARRADOR', t: 'Depois do jantar, a Dona Zélia levanta devagar, segurando na beirada da mesa.' },
          { who: 'ZELIA', t: 'Vou deitar. Amanhã tem feira e eu quero chegar antes do tomate acabar.' },
        ],
        choices: [
          { label: esconde ? '"Mãe. Senta aqui. Deixa eu ver o seu pé."' : '"Mãe. Senta aqui. Tira esse sapato."', next: 'pe', needLink: 'ver_pe' },
          { label: '"Boa noite, mãe."', next: 'fim' },
        ],
      },
      pe: {
        lines: [
          { who: 'ZELIA', t: 'Ai, {filho}, não é nada. Uma bolhinha do sapato novo.' },
          { who: 'NARRADOR', t: esconde ? 'Você tira o chinelo. Depois a meia, devagar, porque ela grudou.' : 'Você desamarra o sapato. Depois tira a meia, devagar, porque ela grudou.' },
          { who: 'NARRADOR', t: 'Na sola do pé direito, uma ferida do tamanho de uma moeda, funda, com a borda vermelha e quente. O cheiro chega antes da vista.' },
          { who: 'NARRADOR', t: 'Diabética há vinte anos. Você sabe o nome disso. E sabe o que acontece quando ninguém olha.' },
          { who: 'ZELIA', t: 'Faz uma semana. Eu não quis falar. O dinheiro tá curto, a bombinha, a luz... Eu ia passar uma pomada.' },
        ],
        onEnter: onFind,
        choices: [
          {
            label: '"Ninguém nesta casa esconde ferida de mim. Amanhã a gente cuida disso. Junto."',
            next: 'pe_cuidado',
            affectionate: true,
            effect: fx.add('lacos', 1, 'cuidou do pé da mãe'),
          },
          { label: '"A senhora quer perder o pé, mãe?!"', next: 'pe_bronca', effect: fx.add('lacos', -1, 'bronca na Dona Zélia') },
        ],
      },
      pe_cuidado: {
        lines: [
          { who: 'NARRADOR', t: 'Você lava o pé dela com soro e cobre com gaze limpa. Ela fica olhando pro teto da cozinha.' },
          { who: 'ZELIA', t: 'Teu pai fazia isso. Lavava o meu pé quando eu chegava da fábrica, inchada de ficar em pé.' },
          ...curativoLines,
        ],
        next: 'fim',
      },
      pe_bronca: {
        lines: [
          { who: 'ZELIA', t: 'Não grita comigo, {nome}. Eu já sei que fiz besteira.' },
          { who: 'NARRADOR', t: 'Ela deixa você lavar o pé. Não olha pra você nenhuma vez.' },
          ...curativoLines,
        ],
        next: 'fim',
      },
      fim: {
        lines: [{ who: 'NARRADOR', t: 'A casa apaga as luzes uma por uma. Do quarto dela, o rádio baixinho, como toda noite.' }],
        onEnter: (e) => {
          if (!e.flag('pe_ferida')) e.set('pe_ferida_escondida');
        },
      },
    },
    inspect: { objects, links },
  };
}

/** Variante rara: a Dona Zélia já não está (morreu antes do D13). */
function cenaSemZelia(c: Ctx): SceneDef {
  const L = presente(c, 'lucia');
  const oferta = ofertaMaquina(c);
  const h6 = c.v('humanidade') >= 6;
  const lines: DLine[] = [{ who: 'NARRADOR', t: 'A cadeira da Dona Zélia continua na cabeceira. Ninguém teve coragem de tirar.' }];
  if (L) {
    lines.push({ who: 'LUCIA', t: 'A Cida ligou. Aparecida, do grupo de senhoras da sua mãe. Foi no enterro, lembra? A de chapéu, que chorou mais que todo mundo.' });
    if (h6) lines.push({ who: 'LUCIA', t: 'Ela disse que conversa com você pelo telefone. Que você é a única voz que ela ouve no dia.' });
    if (oferta) lines.push({ who: 'LUCIA', t: 'Ela quer me dar a máquina de costura dela. Disse que é o que a sua mãe ia querer.' });
  } else {
    lines.push({ who: 'NARRADOR', t: 'Um bilhete enfiado por baixo da porta, letra tremida: "Meus pêsames pela Zélia. Ela falava de você toda terça. — Cida, do grupo."' });
    if (oferta) lines.push({ who: 'NARRADOR', t: 'Embaixo, a mesma letra: "Tenho uma máquina de costura parada. {c:É pra sua esposa|É pro seu marido}. É o que a Zélia ia querer."' });
  }
  return {
    id: 'd13_sem_zelia',
    bg: 'cozinha',
    cast: L ? ['LUCIA'] : [],
    nodes: {
      start: {
        lines,
        choices: oferta
          ? [
              { label: 'Aceitar a máquina da Dona Cida.', next: 'fim', effect: fx.all(fx.set('cida_maquina'), fx.set('maquina'), fx.add('lacos', 1, 'a máquina da Dona Cida')) },
              { label: 'Agradecer e recusar.', next: 'fim' },
            ]
          : undefined,
        next: 'fim',
      },
      fim: { lines: [{ who: 'NARRADOR', t: 'O rádio do quarto dela continua em cima da cômoda. Desligado.' }] },
    },
  };
}

function bicoD13(c: Ctx): SceneDef {
  const L = presente(c, 'lucia');
  const viva = zeliaViva(c);
  const percebe = viva && L && c.v('lacos') >= 6;
  const maquina = ofertaMaquina(c);
  const lines: DLine[] = [{ who: 'NARRADOR', t: 'Doze horas na USA 01: sirene, escada de prédio sem elevador e gente gritando na porta.' }];
  if (viva && percebe) {
    lines.push(
      { who: 'NARRADOR', t: 'Quando você chega, de madrugada, tem um bilhete {doconj} preso na geladeira com o ímã de pizzaria:' },
      { who: 'LUCIA', t: '"Tua mãe tá mancando e escondendo o pé. Eu vi a meia no cesto. Amanhã você olha, nem que seja à força. — {c:L|A}."' },
    );
  } else if (viva) {
    lines.push(
      { who: 'NARRADOR', t: 'Quando você chega, de madrugada, a Dona Zélia já está deitada. O sapato fechado dela está do lado da cama, com a meia enfiada dentro.' },
      { who: 'NARRADOR', t: 'Você não repara. Ninguém repara.' },
    );
  }
  if (maquina) lines.push({ who: 'NARRADOR', t: 'Na sala, coberta com um lençol, uma máquina de costura antiga. Um bilhete com letra tremida: "{c:Pra|Pro} {conj}. Da Cida, do grupo de senhoras."' });
  return {
    id: 'd13_bico',
    bg: 'cozinha',
    nodes: {
      start: {
        lines,
        onEnter: (e) => {
          if (viva) e.set(percebe ? 'pe_ferida' : 'pe_ferida_escondida');
          if (maquina) {
            e.set('cida_maquina');
            e.set('maquina');
          }
        },
      },
    },
  };
}

// -----------------------------------------------------------------------------
export const DAY = day({
  day: 13,
  title: 'Produto de Limpeza',
  weekday: 'Terça-feira',
  weather: 'Abafado, 31 °C. Dia de faxina em meia cidade.',
  goal: { maxUSA: 3, bonus: 30 },
  onStart: fx.when(is.v('lealSimone', '>=', 7), fx.set('curativo_gratis')),
  newspaper: (c) => {
    const n = noturno(c);
    const henrique = n === 'paula' || c.flag('encobriu_henrique') || c.flag('omitiu_henrique');
    return {
      headline:
        n === 'paula'
          ? 'Médico da Regulação é afastado após sindicância'
          : n === 'encoberto'
            ? 'Sindicância na Regulação termina sem culpados'
            : n === 'omitido'
              ? 'Sindicância da Regulação termina sem conclusão'
              : 'Faxina de verão: intoxicações de criança disparam',
      sub:
        n === 'paula'
          ? 'Regulador do plantão noturno vai para tratamento. Saúde+ Gestão fala em "caso isolado".'
          : n === 'encoberto'
            ? `Relatório interno diz que a morte ${c.flag('noturno_obito_d11_dengue_grave') ? 'do adolescente' : 'da idosa'} com dengue foi "evolução natural da doença".`
            : n === 'omitido'
              ? `Família ${c.flag('noturno_obito_d11_dengue_grave') ? 'do adolescente' : 'da idosa'} que morreu de dengue diz que vai procurar a Justiça.`
              : 'Vigilância alerta: produto de limpeza e remédio têm que ficar no alto e trancados.',
      photo: henrique ? 'central' : 'veneno',
      stories: [
        henrique
          ? { title: 'Faxina de verão: intoxicações de criança disparam', text: 'Soda cáustica, água sanitária e remédio de adulto lideram os casos. A Vigilância pede: tudo no alto, trancado, na embalagem original.' }
          : { title: 'Remédio de pressão volta aos postos', text: 'Depois de duas semanas em falta, o anti-hipertensivo chegou às UBS. Teve fila de idoso desde as seis da manhã.' },
        { title: 'Expo Aurora terá show gratuito na sexta', text: 'Show sertanejo no Parque de Exposições, das 13h às 17h. A organização espera 20 mil pessoas e promete "grade reforçada" na saída.' },
        c.flag('simone_demissao_anunciada')
          ? { title: 'Saúde+ Gestão vai "otimizar" atendentes da Regulação', text: 'A OS confirmou o corte de uma técnica auxiliar de regulação por turno a partir do mês que vem.' }
          : { title: 'Grupo de senhoras da Matriz faz bazar', text: 'Crochê, bolo de fubá e roupa usada. A renda vai para a cozinha da igreja. Terças, às 15h.' },
      ],
      notice: 'Nova página no Manual: p.13 — Intoxicação em crianças. Nova pergunta liberada: "O que engoliu?"',
      ad: 'LOJA DO ZÉ MATERIAIS — soda cáustica em escamas, cal e cimento com desconto. Guarde longe das crianças.',
      weather: 'Abafado · 31 °C',
    };
  },
  handover: (c) => {
    const n = noturno(c);
    const lines: DLine[] = [{ who: 'NARRADOR', t: '07:00. Terça-feira. Cheiro de água sanitária no corredor: a faxineira passou antes de todo mundo.' }];
    if (n === 'paula') {
      lines.push(
        { who: 'NARRADOR', t: 'Na cadeira do noturno não está o Henrique. É uma médica de cabelo preso e olheira funda, guardando o estetoscópio na mochila.' },
        { who: 'PAULA', t: 'Paula. Tô cobrindo o noturno até... até resolverem. Você que é {o} {nome}?' },
        { who: 'PAULA', t: 'Ele falou de você antes de ir. Não falou mal. Noite calma, fila zerada.' },
        { who: 'NARRADOR', t: 'A Simone pendura a bolsa no encosto da cadeira sem dar bom-dia.' },
      );
    } else if (n === 'encoberto') {
      lines.push(
        { who: 'HENRIQUE', t: '{nome}! Meu parceiro. Ficou tudo certinho no sistema, viu? Te devo essa pra sempre.' },
        { who: 'NARRADOR', t: 'O cheiro de menta chega antes dele. Hoje tem mais coisa por baixo da menta. Muito mais.' },
        { who: 'HENRIQUE', t: 'Noite tranquila. Vou nessa.' },
      );
    } else if (n === 'omitido') {
      lines.push(
        { who: 'HENRIQUE', t: 'Noite tranquila. Fila zerada.' },
        { who: 'NARRADOR', t: 'Ele fala olhando pro monitor. Pega a mochila e sai sem esperar resposta.' },
      );
    } else {
      lines.push(
        { who: 'HENRIQUE', t: 'Bom dia. Noite tranquila, fila zerada. Só um adolescente que misturou cachaça com remédio da mãe. Já foi.' },
        { who: 'NARRADOR', t: 'Menta. As mãos dele mexem no crachá, na chave, na bala.' },
      );
    }
    return {
      id: 'd13_passagem',
      bg: 'central',
      nodes: {
        start: {
          lines,
          choices: [
            { label: 'Perguntar à Simone se ela está bem.', when: () => n === 'paula', next: 'simone', effect: fx.add('lealSimone', 1, 'perguntou como ela estava') },
            { label: '"Henrique, você precisa de ajuda."', when: () => n === 'encoberto', next: 'ajuda' },
            { label: '"Bom descanso."' },
          ],
        },
        simone: {
          lines: [
            { who: 'SIMONE', t: 'Ele levou meu sobrinho pro Regional uma vez, de madrugada, no carro dele. Antes de tudo isso.' },
            { who: 'SIMONE', t: '...Você fez o certo, {dr}. Eu só queria que o certo não doesse tanto.' },
          ],
        },
        ajuda: { lines: [{ who: 'HENRIQUE', t: 'Preciso de férias. E de um café. Tchau, {nome}.' }] },
      },
    };
  },
  timeline: [
    { at: '07:01', kind: 'radio', who: 'USA 01 · BENÉ', text: '{bene}, USA 01 em QRV na base Centro. Terça de faxina: hoje chove produto de limpeza na cozinha de meia cidade.' },
    {
      at: '12:20',
      kind: 'simone',
      who: 'SIMONE',
      when: is.v('lealSimone', '>=', 7),
      text: '{Dr}, minha cunhada trabalha na UBS da Vila Esperança. Ganhei um monte de amostra de curativo, gaze, pomada. Deixei na sua gaveta. Vai que alguém da sua casa precisa.',
    },
    {
      at: '14:10',
      kind: 'script',
      id: 'peixoto_criancas',
      run: (c) => {
        const a = c.callStatus('d13_soda');
        const b = c.callStatus('d13_comprimidos');
        if (a?.decision?.resource === 'USA' && b?.decision?.resource === 'USA') {
          c.modal('DR. PEIXOTO', '{Dr}, duas USA pra criança antes das três da tarde. Tá certo, tá certo, criança é criança. Só lembra que o painel não sabe a idade de ninguém.', 'interfone');
        }
      },
    },
    {
      at: '16:05',
      kind: 'radio',
      who: 'USB 01 · JOANA',
      // dica sutil do pé escondido; se ela levou bronca no D10, esconde melhor e não aparece no portão
      when: (c) => c.s.family.zelia.status !== 'morto' && !c.flag('zelia_fechada'),
      text: 'Central, USB 01 voltando pra base pela Rua das Acácias. Tinha uma senhora regando planta no portão da casa azul, de sapato fechado nesse calor. Acenou pra gente e disse que é mãe de alguém daí da central.',
    },
  ],
  calls: [
    // ------------------------------------------------------------------ 1 ★ SODA
    call({
      id: 'd13_soda',
      ref: 'D13 #1 ★',
      at: '07:25',
      anchor: true,
      num: '(17) 99645-1240',
      caller: 'Daiane (mãe)',
      callerName: 'Daiane',
      type: 'comum',
      voice: 'jovem_m',
      note: 'Mãe gritando. Criança bebeu produto de limpeza.',
      noteFixed: true,
      addr: { rua: 'Rua das Mangueiras', n: 1240, bairro: 'Jardim Primavera', ref: 'Casa de esquina, muro azul, um pé de acerola na calçada.' },
      amb: ['choro', 'cozinha'],
      open: [
        '{m:Moço|Moça}! {m:Moço|Moça}, minha filha {{bebeu soda cáustica|soda}}! Eu tava limpando o forno, virei as costas e ela pegou o copinho!',
        '[{{choro de criança pequena, engasgado, desesperado|choro}}]',
        'Eu vou {{enfiar o dedo na garganta dela pra ela vomitar|vomitar}}, né? Fala que é pra fazer isso!',
      ],
      q: {
        ingestao: [
          'Soda cáustica, aquela de escama. Eu tinha dissolvido num copo de requeijão pra limpar a grelha.',
          '{{Ela deu um gole, eu acho. Cuspiu um pouco no chão|um_gole}}. Foi agora, uns cinco minutos! O pote tá aqui na minha mão.',
        ],
        oque: 'Ela subiu no banquinho, pegou o copo da pia e bebeu. Achou que era suco. O copo é de suco!',
        consciencia: 'Acordada! Gritando, chorando, esfregando a boca.',
        respira: 'Respira, chorando... {{tá babando muito, a boquinha tá vermelha|babando}}.',
        idade: 'Três anos. Fez três mês passado.',
        sangramento: 'Na boca? Não sei! Tá tudo vermelho, a baba tá saindo rosinha...',
        historico: 'Nada, ela não tem nada. Só a bronquite quando era bebê.',
        inicio: 'Agora! Cinco minutos, se tanto!',
        paciente: ['[choro alto, tosse]', 'ANA CLARA: Tá ardendo, mamãe! Tá ardeeendo!'],
        seguranca: 'Seguro. Só eu e ela. O marido tá no serviço.',
        referencia: 'Esquina com a Av. Primavera, muro azul, pé de acerola na calçada.',
      },
      extra: [
        {
          id: 'bebeu_depois',
          label: 'Ela bebeu alguma coisa depois?',
          say: 'Depois disso ela bebeu ou comeu alguma coisa?',
          a: 'Eu ia dar leite! Minha sogra sempre fala que leite corta veneno. Ainda não dei. Dou?',
        },
      ],
      links: [
        { a: 'vomitar', b: 'manual:intox_orient', insight: 'NÃO provocar vômito: o cáustico queima de novo na volta. A orientação tem que vir já, antes de a mãe fazer (Manual p.13).' },
        { a: 'soda', b: 'manual:intox_grave', insight: 'Produto cáustico em criança: USA → Regional, com orientação por telefone enquanto a viatura vai (Manual p.13).' },
        { a: 'babando', b: 'um_gole', insight: '"Só um gole"... mas a baba não para e a boca está vermelha: queimadura na boca e no esôfago. A garganta pode inchar.' },
      ],
      worsen: [{ after: 25, lines: ['{m:Moço|Moça}, ela tá {{com a voz rouquinha|rouca}}... e tá fazendo um barulhinho fino pra puxar o ar!', '[chiado agudo no meio do choro]'], guide: 'intoxicacao' }],
      guide: { id: 'intoxicacao' },
      patient: { name: 'Ana Clara Ribeiro', age: 3, sex: 'F' },
      // Conferido (RT5: cáustico em criança, com baba e boca vermelha = substância de alta mortalidade, "na dúvida, alto
      // risco" → USA; a piora com estridor é USA no RC8/RP1; campo A12: não provocar vômito nem neutralizar). A janela
      // de risco é balanceamento de jogo.
      truth: { dx: 'Ingestão de soda cáustica (criança de 3 anos)', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 50, bad: 130, guideBonus: 20 } },
      radio: {
        ok: '{central}, {unit} no local. Menina de 3 anos, lesão na boca e na língua, via aérea pérvia por enquanto. A mãe guardou o pote. Seguimos Regional pra endoscopia.',
        saved: '{central}, {unit}. Menina rouquinha, mas respirando. A mãe disse que ia fazer ela vomitar e alguém no telefone segurou. Fez diferença, {dr}.',
        under: 'Central, {unit}! A menina tá babando sangue, com estridor! Precisamos de USA, essa via aérea vai fechar!',
        dead: 'Central... {unit}. Não deu. Óbito às {hora}. A mãe ainda tá segurando o pote.',
        dismissed: '{m:Moço|Moça}! Ela tá ficando roxinha, não para de babar! Vocês não vão mandar ninguém?!',
      },
      onResolve: (e, r) => e.set(r.outcome === 'obito' ? 'd13_soda_obito' : 'd13_soda_viva'),
      diary: {
        alive: 'Três anos. Soda cáustica num copo de suco. A mãe ia provocar vômito; não provocou.',
        dead: 'Três anos. Soda cáustica num copo de suco.',
        later: [{ day: 15, text: 'A Ana Clara voltou a tomar sopinha. A mãe mandou um áudio pra central agradecendo "a voz que mandou não fazer vomitar".', when: (c) => c.flag('d13_soda_viva') }],
      },
    }),
    // ------------------------------------------------------------------ 2 ★ CIDA
    call({
      id: 'd13_cida',
      ref: 'D13 #2',
      at: '08:30',
      anchor: true,
      num: NUM.cida,
      caller: 'Dona Cida',
      callerName: 'Dona Cida',
      type: 'frequentador',
      voice: 'cida',
      note: 'Dona Cida. Diz que "fez uma bobagem com produto de limpeza".',
      noteFixed: true,
      addr: ADDR.cida,
      amb: ['tv', 'ventilador'],
      open: [
        'Oi {meu} {filho}, é a Cida! Bom dia! Ó, eu fiz uma bobagem: {{misturei a água sanitária com aquele desinfetante de pinho|misturou}} pra limpar o banheiro e subiu um cheiro... ardeu o nariz, os olhos...',
        'Mas já {{abri tudo e vim pra varanda|ventilou}}. Liguei pra saber se eu morro, né? [risada]',
      ],
      q: {
        oque: 'Fui limpar o banheiro. Achei que misturando ficava mais forte. Ficou forte mesmo, {meu} {filho}! Quase desmaiei de susto.',
        ingestao: 'Engolir? Credo, não! Só cheirei. Engolir, só café.',
        respira: 'Tô respirando bem aqui fora. {{A tossinha já tá passando|tosse_passou}}.',
        consciencia: 'Acordadíssima!',
        idade: 'Setenta e nove.',
        inicio: 'Agora mesmo. Uns quinze minutos.',
        historico: 'Pressão. Tomo o remédio certinho.',
        dorpeito: 'Dor no peito não. Só ardeu o nariz.',
        paciente: 'Sou eu mesma, {meu} {filho}!',
        seguranca: 'Seguro. Só eu e o gato, e o gato fugiu do cheiro.',
      },
      extra: [
        {
          id: 'falta_ar',
          label: 'Falta de ar? Chiado?',
          say: 'A senhora está com falta de ar? Chiado no peito? Tosse forte?',
          a: 'Nada disso. Uma tossezinha boba, já passando. Os olhos é que ainda tão vermelhos.',
        },
        {
          id: 'conversar',
          kind: 'fala',
          label: 'Conversar um pouco com ela',
          cost: 15,
          say: 'E fora o susto, Dona Cida? Hoje tem o grupo da igreja?',
          a: [
            'Tem! Terça é dia do grupo de senhoras. A gente faz crochê e fala da vida dos outros. [risada]',
            'Tem uma comadre minha lá que tem {m:um filho médico|uma filha médica}, sabia? Ela fala que {m:ele chega|ela chega} em casa com cara de quem ouviu o mundo inteiro pelo telefone.',
            'Eu costurava pra fora, sabe? {{Tenho uma máquina lá parada|maquina_parada}}, coitada. A vista não ajuda mais.',
          ],
          onAsk: fx.all(fx.add('humanidade', 1, 'conversou com a Dona Cida'), fx.set('cida_conversou_d13')),
        },
      ],
      links: [
        // Conferido (campo A12: sair do ambiente e ventilar; RC12: sem falta de ar nem chiado → orientação; RC25: olho
        // vermelho → orientação; campo A10: lavar o olho com água corrente).
        { a: 'tosse_passou', b: 'ventilou', kind: 'confirma', insight: 'Saiu do ambiente, abriu tudo e a tosse está passando: inalação leve. Orientar lavar os olhos com água corrente, não voltar ao banheiro até arejar e nunca misturar produtos.' },
      ],
      onAnswer: fx.set('cida_ligou_d13'),
      patient: { name: 'Aparecida (Dona Cida)', age: 79, sex: 'F' },
      truth: { dx: 'Inalação leve de vapor de produto de limpeza', sev: 'verde', ok: ['ORI'], ref: ['CASA', 'UBS'] },
      radio: { excess: '{central}, {unit}. Dona Aparecida, bem, na varanda. Serviu café pra equipe. Mandou um beijo pr{o} {dr}, disse que você sabe quem é.' },
      diary: {
        ori: 'Misturou água sanitária com desinfetante "pra ficar mais forte". Ficou. Já na varanda, rindo de si mesma.',
        alive: 'Mandei viatura por causa do cheiro de cloro. Ela ofereceu café pra equipe.',
      },
    }),
    // ------------------------------------------------------------------ 3 MOEDA
    call({
      id: 'd13_moeda',
      ref: 'D13 #3',
      at: '09:30',
      pool: 'leve,pediatria',
      num: '(17) 99318-0820',
      caller: 'Anderson (pai)',
      callerName: 'Anderson',
      type: 'comum',
      voice: 'homem',
      note: 'Pai calmo. Criança engoliu uma moeda.',
      noteWrong: 'Criança engasgada, {dr}! Pega logo!',
      addr: { rua: 'Rua Tiradentes', n: 820, bairro: 'Vila Nova', ref: 'Sobrado bege em frente à lotérica.' },
      amb: ['desenho', 'choro'],
      open: [
        'Bom dia. Meu filho de quatro anos {{engoliu uma moeda|moeda}} de vinte e cinco centavos. Tá {{brincando normal|brincando}}...',
        'MÃE: Fala que é grave, Anderson! Fala que é grave!',
        '...mas a mãe dele tá desesperada aqui.',
      ],
      q: {
        ingestao: 'Uma moeda de vinte e cinco centavos. Faz uns vinte minutos. Tava brincando de cofrinho com a irmã.',
        respira: '{{Respira normal. Tá falando sem parar|respira_bem}}, aliás.',
        consciencia: 'Acordado, pedindo pra ver desenho.',
        idade: 'Quatro anos.',
        oque: 'Ele pôs a moeda na boca pra mostrar pra irmã que era mágico. A mágica deu errado.',
        inicio: 'Uns vinte minutos.',
        sangramento: 'Não, nada.',
        historico: 'Saudável. Vacina em dia.',
        paciente: 'THEO: A moeda foi passear na minha barriga! Ela vai sair?',
      },
      extra: [
        {
          id: 'engolir',
          label: 'Engole água? Baba? Dor?',
          say: 'Ele consegue engolir água? Está babando? Reclama de dor no peito ou na garganta?',
          a: '{{Bebeu água agorinha, desceu normal|engole}}. Não baba, não reclama de nada. Quer biscoito.',
        },
      ],
      links: [
        { a: 'engole', b: 'manual:corpo_estranho', insight: 'Engoliu moeda, respira e engole bem, sem baba nem dor: orientação, UPA por meios próprios pra fazer raio-x (Manual p.13).' },
        { a: 'respira_bem', b: 'moeda', kind: 'confirma', insight: 'A moeda passou: ele fala sem parar, sem esforço pra respirar. Não é engasgo.' },
      ],
      patient: { name: 'Theo Marques', age: 4, sex: 'M' },
      // Conferido (RC8: sem estridor, sem dor, engole água e respira bem → orientação; raio-x na UPA por meios próprios).
      truth: { dx: 'Moeda engolida, sem obstrução', sev: 'verde', ok: ['ORI'], ref: ['UPA'] },
      radio: { excess: '{central}, {unit}. Menino de quatro anos, ótimo, comendo biscoito. A moeda tá "passeando", segundo ele. Dava pra ir de carro pra UPA, {dr}.' },
      diary: { ori: 'Moeda de 25 centavos, "mágica que deu errado". Orientado raio-x na UPA.' },
    }),
    // ------------------------------------------------------------------ 4 INFARTO
    call({
      id: 'd13_infarto',
      ref: 'D13 #4',
      at: '10:30',
      pool: 'cardio,grave',
      num: '(17) 3324-0880',
      caller: 'Dona Rosa (esposa)',
      callerName: 'Dona Rosa',
      type: 'comum',
      voice: 'idosa',
      note: 'Senhor de 68, dor no peito. Já infartou antes.',
      noteWrong: 'Esposa diz que ele "sempre acha que tá infartando".',
      addr: { rua: 'Rua Goiás', n: 880, bairro: 'Santa Luzia', ref: 'Casa de grade verde, do lado da borracharia.' },
      amb: ['radio_am', 'ventilador'],
      open: [
        '{m:Moço|Moça}, é a Rosa. O Joaquim diz que tá infartando de novo. {{Todo mês ele acha que tá infartando|exagerado}}, viu? Mas hoje...',
        'Hoje ele tá {{suando que nem tampa de panela|suando}}.',
        'JOAQUIM: {{É igual à do meu infarto de antes, {dr}. Igualzinha.|mesma_dor}} Eu conheço essa dor.',
      ],
      q: {
        oque: 'Ele foi varrer a calçada e entrou com a mão no peito. Sentou e não levantou mais.',
        dorpeito: ['{{Vai pro queixo e pro braço esquerdo|irradia}}, ele disse. E a camisa tá ensopada.', 'JOAQUIM: Aperta, {dr}. Parece que sentaram em cima.'],
        historico: ['Infartou há dois anos. Pôs stent. Toma uns cinco remédios.', '{{Pôs o comprimidinho debaixo da língua, o que o cardiologista deu, e não passou nada|nitrato}}.'],
        inicio: 'Faz uns quarenta minutos. Começou na vassoura.',
        idade: 'Sessenta e oito.',
        consciencia: 'Acordado, falando. Branco que nem papel.',
        respira: 'Respira, mas puxando curto.',
        paciente: 'JOAQUIM: Desculpa o trabalho, {dr}. A Rosa que inventou de ligar. Eu ia esperar passar... mas não tá passando.',
        sangramento: 'Não.',
        seguranca: 'Só nós dois aqui.',
      },
      links: [
        { a: 'exagerado', b: 'suando', insight: '"Todo mês ele acha que tá infartando"... mas hoje está ensopado de suor frio. O histórico de exagero não apaga os sinais de agora.' },
        { a: 'irradia', b: 'manual:peito', insight: 'Mais de 40 anos, suor frio e dor que vai pro queixo e pro braço: provável infarto. USA (Manual p.3).' },
        { a: 'nitrato', b: 'mesma_dor', insight: 'A mesma dor do infarto anterior, e o remédio debaixo da língua não fez efeito: reinfarto até prova em contrário.' },
      ],
      patient: { name: 'Joaquim Batista Lopes', age: 68, sex: 'M' },
      truth: { dx: 'Infarto (reinfarto)', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 60, bad: 150 } },
      radio: {
        ok: '{central}, {unit} no local. Supra de ST, mesmo território do infarto antigo. Seguimos Regional pra hemodinâmica.',
        under: 'Central, {unit}! É infarto, supra no eletro! Precisamos de USA!',
        dead: 'Central... {unit}. Fibrilou na sala. Não voltou. Óbito às {hora}.',
        dismissed: '{m:Moço|Moça}, é a Rosa de novo! Ele caiu da cadeira! Tá cinza! Eu falei que hoje era diferente!',
      },
      diary: {
        alive: 'Seu Joaquim. "É igual à do meu infarto de antes." Era. Stent novo.',
        dead: 'Seu Joaquim. "É igual à do meu infarto de antes." A esposa dizia que ele sempre exagerava.',
      },
    }),
    // ------------------------------------------------------------------ 5 MAIONESE
    call({
      id: 'd13_maionese',
      ref: 'D13 #5',
      at: '11:40',
      pool: 'leve',
      num: '(17) 99502-1150',
      caller: 'Maurício (marido)',
      callerName: 'Maurício',
      type: 'exagerador',
      voice: 'homem',
      note: 'Marido nervoso. Esposa vomitando.',
      noteWrong: 'Diz que a esposa tá morrendo!',
      addr: { rua: 'Rua Pará', n: 1150, bairro: 'Distrito Industrial', ref: 'Vila operária, terceira casa, portão de ferro.' },
      amb: ['tv', 'cozinha'],
      open: [
        '{m:Moço|Moça}, manda ambulância que {{minha mulher tá morrendo de tanto vomitar|morrendo}}! Desde ontem à noite!',
        'Foi a {{maionese do aniversário da minha sobrinha|maionese}}, tenho certeza! Ficou no sol a festa inteira!',
      ],
      q: {
        oque: 'Vomitou umas seis vezes. E caganeira, com o perdão da palavra. {{Metade da festa tá igual|metade_festa}}: minha cunhada, meu sogro...',
        consciencia: 'Acordada. Reclamando de mim.',
        respira: 'Respira, respira.',
        idade: 'Trinta e dois.',
        inicio: 'Desde umas onze da noite. A festa foi às sete.',
        sangramento: 'Sangue? Não, graças a Deus.',
        historico: 'Nada. É forte que nem um touro.',
        gestacao: ['Grávida? ...Não. Não, né, amor?', '[ao fundo: "NÃO, Maurício!"]'],
        paciente: 'PRISCILA: Amor, para de drama... {Dr}, tô enjoada, mas {{tô tomando soro de pacotinho e segurando|soro}}. Ele que tá desesperado.',
        seguranca: 'Seguro.',
      },
      extra: [
        {
          id: 'desidratacao',
          label: 'Tontura? Xixi? Febre?',
          say: 'Ela tem tontura ao levantar? Está fazendo xixi? Tem febre?',
          a: 'PRISCILA: Fiz xixi agora. Tontura não. Febre baixinha, trinta e sete e meio.',
        },
      ],
      links: [
        { a: 'morrendo', b: 'soro', insight: '"Morrendo"... mas ela bebe soro, segura, faz xixi e discute com o marido: gastroenterite sem desidratação. Orientação.' },
        { a: 'metade_festa', b: 'maionese', kind: 'confirma', insight: 'Metade da festa com o mesmo quadro: intoxicação alimentar. Hidratação e UBS; UPA se piorar.' },
      ],
      patient: { name: 'Priscila Andrade', age: 32, sex: 'F' },
      // Conferido (RC11: segura o soro, urina, sem tontura nem sangue → sem vômitos persistentes nem desidratação →
      // orientação; febre baixa também é orientação).
      truth: { dx: 'Gastroenterite (intoxicação alimentar) sem desidratação', sev: 'verde', ok: ['ORI'], ref: ['CASA', 'UBS', 'UPA'] },
      radio: { excess: '{central}, {unit}. Moça com vômito, hidratada, conversando. O marido queria carona pro posto, {dr}.' },
      diary: { ori: 'Maionese de festa, metade dos convidados. Soro de pacotinho e paciência.' },
    }),
    // ------------------------------------------------------------------ 6 ★ COMPRIMIDOS DA AVÓ
    call({
      id: 'd13_comprimidos',
      ref: 'D13 #6 ★',
      at: '13:00',
      anchor: true,
      num: '(17) 3326-0960',
      caller: 'Dona Irene (avó)',
      callerName: 'Dona Irene',
      type: 'minimizador',
      voice: 'idosa',
      note: 'Avó. Neto pegou remédio dela. Diz que ele tá bem.',
      noteFixed: true,
      addr: { rua: 'Rua Sabiá', n: 960, bairro: 'Vila Esperança', ref: 'Casa rosa, a duas quadras da UBS.' },
      amb: ['ventilador', 'silencio'],
      open: [
        '{Dr}, desculpa... meu neto pegou {{a cartela do meu remédio de pressão|remedio_pressao}}. Eu deixei em cima da mesa, fui estender roupa...',
        '[{{um menino pequeno resmungando, sonolento|resmungo}}]',
        'Mas ele tá {{bonzinho, brincando|parece_bem}}. Será que precisa mesmo de alguma coisa? Eu não quero fazer escândalo.',
      ],
      q: {
        ingestao: ['O remédio da pressão, um branquinho redondo.', '{{Faltam três da cartela|faltam_tres}}, e ontem tava inteira, eu acho. Faz... meia hora? A caixa tá aqui na minha mão.'],
        oque: 'Ele subiu na cadeira e pegou a cartela. Quando eu vi, tava com a boca suja de branco.',
        consciencia: 'Acordado... {{tá meio molinho, com soninho|sonolento}}. Mas é a hora da soneca dele, né?',
        respira: 'Respira... devagarinho. Tá deitado no meu colo.',
        idade: 'Dois anos e meio.',
        inicio: 'Meia hora, por aí. Eu achei que era bobagem e fui terminar a roupa. Aí ele deitou no chão da sala.',
        historico: 'Ele não tem nada. O remédio é meu. Tenho pressão alta faz trinta anos.',
        sangramento: 'Não.',
        paciente: ['LORENZO: [resmungo] ...vó... sono...', 'Viu? Ele tá bem. Só com sono.'],
        seguranca: 'Seguro. A mãe dele tá trabalhando, ele fica comigo.',
      },
      extra: [
        {
          id: 'cor',
          label: 'Pálido? Mãos frias?',
          say: 'Ele está pálido? As mãos estão frias? E os lábios?',
          a: '{{Tá branquinho e a mãozinha tá gelada|frio}}. Achei que era o ventilador.',
        },
      ],
      links: [
        { a: 'parece_bem', b: 'resmungo', insight: 'Ela diz que ele está "bonzinho, brincando"... mas ao fundo ele resmunga, sonolento. A avó está minimizando.' },
        { a: 'faltam_tres', b: 'manual:intox_grave', insight: 'Remédio de pressão de adulto em criança: risco mesmo que ela pareça bem agora. USA → Regional (Manual p.13).' },
        // Conferido (RT5: sonolência nova depois da ingestão = alteração súbita da consciência → USA; campo B6: choque
        // na criança = pele fria e pálida, pulsos fracos, com PA às vezes normal).
        { a: 'sonolento', b: 'frio', insight: 'Sonolento, pálido e com a mão gelada meia hora depois: o remédio já está agindo. Não é soneca.' },
      ],
      worsen: [{ after: 40, lines: ['{Dr}, ele não tá acordando direito! Eu chamo e ele só geme! A boquinha tá ficando roxinha!'], guide: 'intox_comprimido' }],
      guide: { id: 'intox_comprimido' },
      patient: { name: 'Lorenzo Batista', age: 2, sex: 'M' },
      // Conferido (RT5: anti-hipertensivo de adulto em criança é substância de alta mortalidade; "na dúvida, alto risco").
      // A janela de risco é balanceamento de jogo.
      truth: { dx: 'Intoxicação por remédio de pressão (criança de 2 anos)', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 50, bad: 120, guideBonus: 15 } },
      radio: {
        ok: '{central}, {unit} no local. Criança de 2 anos, sonolenta, pulso lento, pressão baixa. A avó separou a cartela. Seguimos Regional.',
        saved: '{central}, {unit}. O menino tava de lado, a avó chamando o nome dele, a cartela na mão. Chegamos a tempo. Seguimos Regional.',
        under: 'Central, {unit}! A criança tá com pulso lento e pressão no chão! Precisamos de USA!',
        dead: 'Central... {unit}. Óbito às {hora}. A avó não para de pedir desculpa.',
        dismissed: '{Dr}... ele não acorda... ele tá molinho igual pano... me ajuda...',
      },
      onResolve: (e, r) => e.set(r.outcome === 'obito' ? 'd13_comprimido_obito' : 'd13_comprimido_vivo'),
      diary: {
        alive: 'Dois anos e meio. Três comprimidos de pressão da avó. "Ele tá bonzinho", ela disse. Não estava.',
        dead: 'Dois anos e meio. Três comprimidos de pressão da avó. "Ele tá bonzinho", ela disse.',
      },
    }),
    // ------------------------------------------------------------------ 7 CACHORRO
    call({
      id: 'd13_cachorro',
      ref: 'D13 #7',
      at: '14:20',
      pool: 'leve',
      num: '(17) 99456-0410',
      caller: 'Seu Rubens',
      callerName: 'Seu Rubens',
      type: 'exagerador',
      voice: 'idoso',
      note: 'Mordida de cachorro na perna. Senhor nervoso.',
      noteWrong: 'Ataque de cachorro, sangrando muito!',
      addr: { rua: 'Rua dos Expositores', n: 410, bairro: 'Parque das Exposições', ref: 'Casa com um pé de jabuticaba, do lado do cachorro bravo.' },
      amb: ['cachorro', 'rua'],
      open: ['{Dr}, {{fui atacado por um cachorro|atacado}}! Me mordeu a perna! E se for raiva? Eu vi no jornal que raiva mata!'],
      q: {
        sangramento: '{{Dois furinhos, saiu um tiquinho de sangue|furinhos}}. Já parou.',
        oque: 'O cachorro do vizinho, o Thor. Fui pegar a bola do meu neto no quintal dele e o desgraçado me pegou na batata da perna.',
        consciencia: 'Acordado e bravo!',
        respira: 'Respiro. Nervoso, mas respiro.',
        idade: 'Sessenta e quatro.',
        inicio: 'Agora, meia hora.',
        historico: 'Pressão. E a vacina de tétano eu não lembro, faz tempo.',
        paciente: 'Sou eu mesmo, o atacado!',
        seguranca: 'O cachorro tá preso. Agora tá, né.',
      },
      extra: [
        { id: 'vacina', label: 'O cachorro é vacinado?', say: 'O cachorro é vacinado? É conhecido?', a: '{{O vizinho mostrou a carteirinha, vacinado em janeiro|vacinado}}. Mas e se a vacina não pegou?' },
        {
          id: 'lavar',
          kind: 'fala',
          label: 'Orientar: água e sabão',
          // Conferido (RC21: sangramento parado, sem sinal sistêmico → orientação; profilaxia da raiva do Ministério da
          // Saúde: lavar com água corrente e sabão e avaliar vacina e tétano no mesmo dia).
          say: 'Lave bem a mordida com água corrente e sabão por uns minutos. Depois procure a UPA ou a UBS ainda hoje pra avaliar vacina.',
          a: 'Água e sabão? Só isso? ...Tá bom, {dr}. Tô lavando aqui na pia do tanque.',
        },
      ],
      links: [
        { a: 'atacado', b: 'furinhos', insight: '"Atacado"... dois furinhos que já pararam de sangrar. Mordida superficial: orientação.' },
        { a: 'vacinado', b: 'manual:verde', insight: 'Cachorro conhecido e vacinado, mordida superficial: caso leve. Lavar com água e sabão e avaliar vacina na UBS/UPA (Manual p.1).' },
      ],
      patient: { name: 'Rubens Almeida', age: 64, sex: 'M' },
      truth: { dx: 'Mordida de cachorro superficial', sev: 'verde', ok: ['ORI'], ref: ['UPA', 'UBS'] },
      radio: { excess: '{central}, {unit}. Dois furinhos na panturrilha, {dr}. Lavamos com soro. Ele perguntou se a gente tem vacina antirrábica na viatura.' },
      diary: { ori: 'Mordida do Thor, cachorro do vizinho, vacinado. Água, sabão e UBS.' },
    }),
    // ------------------------------------------------------------------ 8 MOTO
    call({
      id: 'd13_moto',
      ref: 'D13 #8',
      at: '15:30',
      pool: 'trauma_moderado',
      num: '(17) 99251-2750',
      caller: 'Fabiano (entregador)',
      callerName: 'Fabiano',
      type: 'testemunha',
      voice: 'jovem_h',
      note: 'Moto. Consciente, dor no ombro.',
      noteWrong: 'Acidente de moto grave, {dr}!',
      addr: { rua: 'Av. Santos Dumont', n: 2750, bairro: 'Jardim Norte', ref: 'Na frente da farmácia da esquina com a Rui Barbosa.' },
      amb: ['rua', 'buzinas'],
      open: ['Oi, um colega meu caiu de moto aqui na Santos Dumont! Ele tá {{sentado na calçada, consciente|consciente}}, mas o {{ombro dele tá esquisito, caído|ombro}}.'],
      q: {
        oque: 'Um carro abriu a porta na frente dele. Ele bateu e caiu de lado.',
        consciencia: 'Acordado. Xingando o carro.',
        respira: 'Normal.',
        idade: 'Vinte e cinco.',
        sangramento: 'Ralou o braço. Pouco sangue.',
        historico: 'Nada que eu saiba.',
        paciente: 'RENAN: Ai, não mexe... o ombro saiu do lugar, eu sinto. Não consigo levantar o braço.',
        seguranca: 'Tiramos a moto da pista. O motorista do carro tá aqui, nervoso.',
      },
      extra: [
        { id: 'capacete', label: 'Bateu a cabeça? Capacete?', say: 'Ele bateu a cabeça? Estava de capacete?', a: 'Tava de capacete. Diz que não bateu a cabeça. Lembra de tudo.' },
        { id: 'mao', label: 'Mexe os dedos? Mão fria?', say: 'Ele mexe os dedos? A mão está fria ou roxa?', a: '{{Mexe os dedos, a mão tá quentinha|dedos_ok}}.' },
      ],
      links: [
        { a: 'ombro', b: 'manual:amarelo', insight: 'Ombro deformado depois da queda, consciente, sem trauma de cabeça: trauma moderado. Amarelo → USB → UPA (Manual p.1 e 9-A).' },
        { a: 'dedos_ok', b: 'consciente', kind: 'confirma', insight: 'Mão quente, dedos mexendo, lúcido: sem sinal de gravidade. USB basta.' },
      ],
      patient: { name: 'Renan Cardoso', age: 25, sex: 'M' },
      // Anexo VII (matriz 4): a UPA atende o trauma de menor densidade e manda o perfil traumato-ortopédico a serviço
      // especializado; luxação pode ir à UPA ou ao Regional, como em d09_cida_b.
      truth: { dx: 'Provável luxação de ombro (queda de moto)', sev: 'amarelo', ok: ['USB'], dest: ['UPA', 'REG'], risk: { good: 120, bad: 300, needs: 'USB' } },
      radio: {
        ok: 'Central, {unit}. Luxação de ombro, pulso presente. Imobilizado. Seguimos UPA.',
        excess: '{central}, {unit}. Ombro luxado, {dr}. Consciente, conversando. Dava USB.',
      },
      diary: { alive: 'Porta de carro aberta na Santos Dumont. Ombro luxado, voltou pro lugar na UPA.' },
    }),
    // ------------------------------------------------------------------ 9 TROTE
    call({
      id: 'd13_trote',
      ref: 'D13 #9',
      at: '16:40',
      pool: 'trote',
      num: '(17) 99088-1500',
      caller: 'Voz de menino',
      type: 'trotista',
      voice: 'menino',
      note: 'Criança. Diz que o irmão bebeu soda.',
      noteWrong: 'Outra criança com soda, {dr}! Pega logo!',
      addr: { rua: 'Rua das Palmeiras', n: 1500, bairro: 'Vila Esperança' },
      amb: ['risadas', 'tv'],
      open: [
        'Alô? É da emergência? {{Meu irmão bebeu soda cáustica|soda_trote}}! Um litro inteiro! Ele tá {{espumando pela boca igual sabão|espuma}}!',
        '[{{risadinhas abafadas; alguém cochicha "fala do sabão, fala do sabão"|risadas}}]',
      ],
      q: {
        ingestao: 'Soda... é, soda! Bebeu {{um litro, não, dois litros|dois_litros}}! Da propaganda da TV!',
        consciencia: 'Tá... tá desmaiado. Não, tá acordado. Tá dançando!',
        respira: 'Respira bolha de sabão! [risada]',
        idade: 'Uns... dez? Ele é mais velho que eu. Não, é mais novo.',
        oque: 'Ele bebeu! Bebeu tudo! Manda a ambulância com a sirene ligada!',
        historico: 'Doença? Ele é chato, isso conta?',
        paciente: ['[sussurro: "faz voz de morto, faz"]', 'IRMÃO: Aaaaai... eu morri... [risadas]'],
        referencia: 'Do lado da padaria. Da outra padaria.',
        seguranca: 'Seguro, pode vir rapidão!',
      },
      callback: ['[{{Caixa postal: "Oi, é o celular da Kátia, mãe do Kevin e do Kaique. Deixa recado."|retorno_mae}}]'],
      links: [
        { a: 'espuma', b: 'risadas', insight: 'Espuma "igual sabão", risadas e alguém soprando a fala: brincadeira imitando a propaganda da TV.' },
        { a: 'dois_litros', b: 'manual:trote_sinais', insight: 'Relato cinematográfico ("dois litros"), risadas ao fundo: sinais de trote (Manual p.2).' },
        { a: 'retorno_mae', b: 'num', insight: 'O celular é da mãe dos meninos, que está fora. As crianças estão brincando com o telefone.' },
      ],
      patient: { name: '"Irmão que bebeu soda"' },
      truth: { dx: 'Trote (crianças imitando a propaganda da TV)', sev: 'trote', ok: ['TROTE'], prankKind: 'trote' },
      radio: { prank: 'Central, {unit}. A Rua das Palmeiras acaba no 820. Rodamos a Vila Esperança, ninguém chamou. Trote.' },
    }),
  ],
  interlude: {
    teaser: (c) => (zeliaViva(c) ? 'Em casa, a Dona Zélia diz que está só cansada.' : 'A casa está quieta demais.'),
    familyLacos: 1,
    onBico: fx.add('lacos', -1, 'não jantou em casa'),
    scene: (c) => (zeliaViva(c) ? cenaPe(c) : cenaSemZelia(c)),
    bico: (c) => bicoD13(c),
  },
});
