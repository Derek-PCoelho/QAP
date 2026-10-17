// =============================================================================
// DIA 18 — "Escândalo" (a matéria da Carla sai)
// Colheitas: 🌾 fontes da matéria (você, Lúcia, Bené, Peixoto), 🌾 Bené = condutor
// de 2019 (revelação), 🌾 Peixoto (delata ou endurece e testa você), 🌾 Vereador e
// Dona Odete (desta vez a minimizadora é ela), 🌾 envelope do dia 7, ↺ Lúcia volta.
// onStart calcula a matéria ANTES do jornal (flags: materia_publicada, materia_forte,
// peixoto_caiu, reforco_frota) e pode encerrar o jogo (sindicância por fraude de ficha).
// =============================================================================
import type { CallRT, Ctx, DLine, Choice, SceneDef, EffCtx } from '../../engine/types';
import type { DeskDoc } from '../../engine/content-api';
import { day, call, fx, is, NUM, ADDR } from '../dsl';
import { beneForm, protagonistName } from '../../engine/text';

const rtOf = (c: Ctx, defId: string): CallRT | undefined => (c.s.shift ? Object.values(c.s.shift.calls).find((x) => x.def === defId) : undefined);
const zeliaViva = (c: Ctx) => c.s.family.zelia.status !== 'morto';
const nFontes = (c: Ctx) => Object.values(c.s.sources).filter(Boolean).length;
/** como o Bené chama você (para textos que o motor não passa pelos tokens) */
const beneNome = (c: Ctx) => beneForm(c.s);

export const DOCS_EXTRA: Record<string, DeskDoc> = {
  ramais_central: {
    id: 'ramais_central',
    title: 'Lista de ramais (colada no monitor)',
    text: 'CENTRAL DE REGULAÇÃO — RAMAIS ÚTEIS. Coordenação (Dr. Peixoto): (17) 3321-4720 · Regional, plantão da emergência: (17) 3320-3301 · UPA Norte: (17) 3325-0801 · Maternidade: (17) 3328-1301 · Bombeiros: 193 · COPOM: 190 · Defesa Civil: 199.',
    clues: [
      { id: 'doc:ramal_coord', text: 'Ramais: Coordenação (Dr. Peixoto) — (17) 3321-4720' },
      { id: 'doc:ramal_regional', text: 'Ramais: Regional, plantão da emergência — (17) 3320-3301' },
    ],
  },
  materia_carla: {
    id: 'materia_carla',
    title: 'Gazeta: a matéria da Carla',
    text: (c) =>
      [
        '"QUANTO VALE UMA AMBULÂNCIA" — por Carla Nunes.',
        'Em 2019, Tiago Nunes, 26 anos, caiu de moto na Av. Brasil, a quatro quadras do Regional. A ambulância levou quarenta minutos.',
        c.s.sources.bene ? 'O motorista daquela USA, Benedito, que sentou no meio-fio e chorou, aceitou falar com nome e foto: "Não tinha viatura. Tinha meta."' : 'O motorista daquela USA, que sentou no meio-fio e chorou, não quis se identificar.',
        c.s.sources.peixoto ? 'Planilhas internas mostram que o bônus da coordenação dependia de manter "menos de 4 USA por plantão".' : '',
        c.s.sources.voce ? 'Um médico regulador, que pediu anonimato, descreve ordens verbais sem respaldo no manual.' : '',
        c.s.sources.lucia ? `${c.g === 'M' ? 'A esposa de um regulador' : 'O marido de uma reguladora'} conta que o salário atrasou dois meses: "A gente vive de bico."` : '',
        c.flag('envelope_aceito') ? `A reportagem cita ${c.g === 'M' ? 'o regulador' : 'a reguladora'} ${protagonistName(c.g)}, que teria recebido R$ 1.000 do gabinete do vereador Arlindo Matos.` : '',
        'A Saúde+ Gestão está registrada em nome de Mauro Teixeira, cunhado do vereador Arlindo Matos.',
      ]
        .filter(Boolean)
        .join(' '),
    until: 18,
    clues: [{ id: 'doc:materia_tiago', text: 'Matéria: Tiago Nunes, 26, esperou a USA por 40 minutos em 2019, na Av. Brasil' }],
  },
};

// -----------------------------------------------------------------------------
// Casa: a volta (pre), a matéria e o envelope (cena), o bico
// -----------------------------------------------------------------------------
function chegadaD18(c: Ctx): SceneDef {
  if (c.flag('lucia_voltou')) {
    // D12 "Vai. Eu seguro as pontas aqui. Mas volta." → ela volta pra decidir junto, como prometeu
    const apoiada = c.flag('lucia_fora_apoiada');
    return {
      id: 'd18_volta',
      bg: 'porta',
      cast: ['LUCIA', 'DAVI'],
      nodes: {
        start: {
          lines: [
            { who: 'NARRADOR', t: 'Tem uma mala azul na porta. A da mudança de dez anos atrás, com a fita crepe ainda escrito "COZINHA".' },
            { who: 'DAVI', t: '{Pai}! O cachorro da tia se chama Pirata e tem um olho só! Eu desenhei ele!' },
            { who: 'LUCIA', t: 'Minha irmã mandou doce de leite. E mandou dizer que você é {um} idiota. Com carinho.', when: () => !apoiada },
            { who: 'LUCIA', t: 'Acabou a experiência. A Têxtil quer me efetivar, {nome}. {c:Supervisora|Supervisor}.', when: () => apoiada },
            { who: 'LUCIA', t: 'Eu disse que voltava pra gente decidir junto. Prometi, não prometi? Então eu vim.', when: () => apoiada },
            { who: 'LUCIA', t: '({c:ela|ele} tira da bolsa um papel com o timbre da fábrica) E trouxe isso. Facção: eles mandam o corte de Rio Claro, eu costuro aqui e devolvo. Ganha menos. Mas é aqui.', when: () => apoiada },
          ],
          choices: apoiada
            ? [
                { label: '"Aceita a facção. A mesa da cozinha é sua."', next: 'faccao', affectionate: true, effect: fx.all(fx.add('lacos', 1, 'decidiram junto'), fx.set('lucia_faccao')) },
                { label: '"Se você quiser a vaga, a gente se muda."', next: 'mudar', effect: fx.all(fx.add('lacos', 1, 'ofereceu ir junto'), fx.set('lucia_faccao')) },
                { label: 'Abraçar os dois ao mesmo tempo.', next: 'abraco', affectionate: true, effect: fx.add('lacos', 1, 'eles voltaram') },
              ]
            : [
                { label: 'Abraçar os dois ao mesmo tempo.', next: 'abraco', affectionate: true, effect: fx.add('lacos', 1, 'eles voltaram') },
                { label: 'Pegar a mala.', next: 'mala' },
                { label: '"Desculpa, {c:Lú|Alex}."', next: 'desculpa' },
              ],
        },
        faccao: {
          lines: [
            { who: 'LUCIA', t: 'A mesa da cozinha sempre foi minha, {nome}. Agora vai ter nota fiscal.' },
            { who: 'DAVI', t: '{c:A mãe|O pai} ensinou a chefe de lá a fazer barra invisível. Agora {c:a mãe é a chefe|o pai é o chefe} da chefe.' },
          ],
        },
        mudar: {
          lines: [
            { who: 'LUCIA', t: '({c:ela|ele} demora) Você largaria a central?' },
            { who: 'LUCIA', t: 'Não responde. Eu vi a sua cara. ({c:ela|ele} ri) Fica a facção. Mas {c:obrigada|obrigado} por perguntar. Faz tempo que você não perguntava nada.' },
          ],
        },
        abraco: { lines: [{ who: 'NARRADOR', t: 'O Liam fica no meio, esmagado, rindo. {Oconj} demora um segundo a mais pra soltar.' }] },
        mala: { lines: [{ who: 'LUCIA', t: 'Deixa que eu levo. Você sempre põe no lugar errado.' }] },
        desculpa: {
          lines: [
            { who: 'LUCIA', t: 'Pede pro Liam. Eu ainda tô pensando no que você me deve.' },
            { who: 'LUCIA', t: '...Mas pode começar pela louça.' },
          ],
          onEnter: fx.add('lacos', 1, 'pediu desculpa'),
        },
      },
    };
  }
  return {
    id: 'd18_rua',
    bg: 'calcada',
    nodes: {
      start: {
        lines: [
          { who: 'NARRADOR', t: 'Na esquina da Acácias, o Diego da casa 88 lê a Gazeta encostado no portão. Ele levanta o jornal quando você passa, sem dizer nada.' },
          { who: 'NARRADOR', t: 'Você não sabe se é um cumprimento ou uma acusação. Ele também não.' },
        ],
      },
    },
  };
}

function casaD18(c: Ctx): SceneDef {
  const S = c.s.sources;
  const luc = is.present('lucia')(c);
  const dav = is.present('davi')(c);
  const zel = zeliaViva(c);
  const nome = c.flag('envelope_aceito');
  const env = c.flag('envelope_lucia') && luc && !c.flag('envelope_devolvido') && !c.flag('envelope_usado');
  const forte = c.flag('materia_forte');
  const lacos = c.v('lacos');
  const rosa = c.key('rosangela') === 'salvo' && c.flag('maquina') && luc && !c.flag('rosangela_ajudante');
  const depois = env ? 'davi_acha' : rosa ? 'rosangela' : 'fim';
  const depoisEnvelope = rosa ? 'rosangela' : 'fim';

  const start: DLine[] = [
    { who: 'NARRADOR', t: 'A Gazeta está aberta em cima da mesa da cozinha. Alguém circulou a matéria com caneta azul.' },
    { who: 'LUCIA', t: 'Tá aí. "Um médico regulador que pediu anonimato." O bairro inteiro sabe que regulador anônimo em Vila Esperança é um só.', when: () => !!S.voce && luc },
    { who: 'LUCIA', t: '{{Do dinheiro eu dou conta, sempre dei|dou_conta}}. Mas a frase dos salários atrasados é minha. A Carla tirou o meu nome e deixou a frase. Achei justo.', when: () => !!S.lucia && luc },
    { who: 'LUCIA', t: '{{Do dinheiro eu dou conta, sempre dei|dou_conta}}. O que eu não aguento é ler o seu trabalho no jornal antes de ouvir de você.', when: () => !S.lucia && luc },
    { who: 'ZELIA', t: 'A vizinha da 88 veio dizer que tem orgulho. Eu fingi que não sabia de nada. Sei mentir, {filho}: aprendi com o seu pai.', when: () => forte && zel },
    { who: 'LUCIA', t: 'Saiu pequena. Página sete, do lado do horóscopo.', when: () => !forte && luc },
    { who: 'NARRADOR', t: 'Na página três, o seu nome. A caneta azul passou por cima dele duas vezes.', when: () => nome },
    { who: 'DAVI', t: '{Pai}... na escola falaram que você pegou dinheiro do vereador. É mentira, né?', when: () => nome && dav },
    { who: 'ZELIA', t: 'Seu pai era pedreiro, {nome}. Morreu devendo. Mas nunca saiu no jornal.', when: () => nome && zel },
    { who: 'DAVI', t: 'A professora leu um pedaço da matéria na sala. Eu falei que {m:o meu pai|a minha mãe} trabalha lá. Todo mundo olhou.', when: () => !nome && dav },
    { who: 'NARRADOR', t: '{Oconj} encosta a cabeça no seu ombro enquanto lê tudo de novo.', when: () => luc && lacos >= 7 },
    { who: 'NARRADOR', t: '{Oconj} lê tudo de novo, {c:sozinha|sozinho}, do outro lado da mesa.', when: () => luc && lacos <= 4 },
    { who: 'NARRADOR', t: 'A cozinha está quieta. O jornal fala sozinho em cima da mesa.', when: () => !luc && !zel },
  ];

  const startChoices: Choice[] = [];
  if (nome) {
    startChoices.push({ label: '"É verdade. Eu peguei o dinheiro."', next: 'confessa', effect: fx.add('integridade', 1, 'assumiu o envelope') });
    startChoices.push({ label: '"É mentira. É política."', next: 'nega', effect: fx.add('lacos', -1, 'mentiu em casa') });
  }
  if (S.voce && luc) startChoices.push({ label: '"Fui eu. {m:O regulador anônimo|A reguladora anônima}."', next: 'orgulho', affectionate: true, effect: fx.add('lacos', 1, 'contou do depoimento') });
  if (env) startChoices.push({ label: 'Mostrar o envelope pra {c:ela|ele}, longe do Liam.', needLink: 'achou_envelope', next: 'envelope' });
  startChoices.push({ label: 'Jantar e não falar do jornal.', next: depois });

  const envChoices = (comPorque: boolean): Choice[] => [
    {
      label: '"A gente devolve o que sobrou. Amanhã."',
      next: 'devolver',
      effect: fx.all(fx.set('envelope_devolvido'), fx.add('integridade', 1, 'devolveu o envelope')),
    },
    {
      label: '"Fica. A gente precisa."',
      next: 'ficar',
      effect: (e: EffCtx) => {
        e.pay(700, 'O que sobrou do envelope');
        e.add('integridade', -2, 'ficou com o envelope');
        e.set('envelope_usado');
      },
    },
    ...(comPorque ? [{ label: '"Por que você não me contou?"', next: 'porque' }] : []),
  ];

  return {
    id: 'd18_jornal',
    bg: 'cozinha',
    cast: [luc ? 'LUCIA' : '', dav ? 'DAVI' : '', zel ? 'ZELIA' : ''].filter(Boolean),
    nodes: {
      start: { lines: start, choices: startChoices },
      confessa: {
        lines: [
          { who: 'LUCIA', t: 'Eu sabia. Não do envelope. De você. Você tava diferente desde aquele dia.', when: () => luc },
          { who: 'DAVI', t: '...Então é verdade?', when: () => dav },
          { who: 'EU', t: 'É. E eu vou consertar. Do jeito que der.' },
          { who: 'ZELIA', t: 'Consertar se conserta geladeira, {filho}. Isso aí a gente carrega.', when: () => zel },
        ],
        next: depois,
      },
      nega: {
        lines: [
          { who: 'LUCIA', t: '({c:ela|ele} olha pra você um tempo comprido) ...Tá.', when: () => luc },
          { who: 'NARRADOR', t: '{c:Ela|Ele} não acredita. O Liam acredita. É pior.', when: () => luc && dav },
          { who: 'NARRADOR', t: 'Ninguém responde. O relógio da cozinha, atrasado como sempre, faz o barulho de sempre.', when: () => !luc },
        ],
        next: depois,
      },
      orgulho: {
        lines: [
          { who: 'LUCIA', t: 'Eu sei. Soube na hora que li "a meta decide quem recebe ambulância". É frase sua. Você fala isso dormindo.' },
          { who: 'ZELIA', t: 'Vão te mandar embora.', when: () => zel },
          { who: 'LUCIA', t: 'Se mandarem, a gente se vira. A gente sempre se vira.' },
        ],
        next: depois,
      },
      envelope: {
        lines: [
          { who: 'EU', t: '{c:Lú|Alex}. O que é isso?' },
          { who: 'LUCIA', t: '({c:ela|ele} não pega o envelope) É o que você tá pensando.' },
          { who: 'LUCIA', t: 'O assessor veio naquele domingo, de noite. Você tava no bico. A conta de luz, o aluguel, o remédio da sua mãe. Eu peguei.' },
          { who: 'LUCIA', t: 'Usei trezentos. O resto tá aí. Eu ia te contar. Todo dia eu ia te contar.' },
        ],
        choices: envChoices(true),
      },
      davi_acha: {
        lines: [
          { who: 'NARRADOR', t: 'O Liam entra na cozinha com as duas mãos para trás.', when: () => dav },
          { who: 'DAVI', t: '{Pai}! Achei dinheiro na caixa de costura {c:da mãe|do pai}! Um monte! A gente tá rico?', when: () => dav },
          { who: 'NARRADOR', t: 'No fundo da caixa de costura, embaixo dos moldes, um envelope pardo com o carimbo do gabinete do vereador.', when: () => !dav },
          { who: 'NARRADOR', t: '{Oconj} fica {c:branca|branco}.' },
          { who: 'LUCIA', t: 'Liam, devolve isso. Vai pro quarto. Agora.', when: () => dav },
          { who: 'LUCIA', t: 'O assessor veio naquele domingo, de noite. Você tava no bico. Eu peguei. Usei trezentos. O resto tá aí.' },
        ],
        onEnter: (e) => {
          if (is.present('davi')(e)) e.add('lacos', -1, 'o Liam achou o envelope');
        },
        choices: envChoices(true),
      },
      porque: {
        lines: [
          { who: 'LUCIA', t: 'Porque você não tava, {nome}. Você nunca tá.' },
          { who: 'LUCIA', t: 'Faz três semanas que eu decido as coisas {c:sozinha|sozinho} e você fica sabendo pelo jornal. Dessa vez, nem pelo jornal.' },
        ],
        choices: envChoices(false),
      },
      devolver: {
        lines: [
          { who: 'LUCIA', t: 'Tá. Eu sabia que você ia dizer isso. Foi por isso que eu não contei.', when: () => lacos >= 6 },
          { who: 'LUCIA', t: 'E os trezentos? A gente paga com o quê, {nome}? Com orgulho?', when: () => lacos < 6 },
          { who: 'NARRADOR', t: 'No dia seguinte, o envelope volta pela portaria da Câmara com um bilhete na letra {c:dela|dele}: "Devolvo R$ 700. Os outros 300 eu fico devendo."' },
        ],
        next: depoisEnvelope,
      },
      ficar: {
        lines: [
          { who: 'LUCIA', t: '({c:ela|ele} guarda o envelope de volta na caixa de costura, devagar) Agora é nosso, então.' },
          { who: 'NARRADOR', t: 'Nenhum dos dois dorme direito. O vereador nunca vai cobrar. É isso que pesa.' },
        ],
        next: depoisEnvelope,
      },
      rosangela: {
        lines: [
          { who: 'LUCIA', t: 'Ah, e tinha um bilhete da Rosângela embaixo da porta. Ela quer trabalhar comigo no ateliê. Eu disse sim antes de ler a segunda linha.' },
          { who: 'NARRADOR', t: 'Na segunda linha: "{c:A senhora é casada|O senhor é casado} com a voz do telefone, né? Eu reconheci no portão."' },
        ],
        onEnter: fx.set('rosangela_ajudante'),
        next: 'fim',
      },
      fim: {
        lines: [
          { who: 'NARRADOR', t: 'A Gazeta vai pro saco do reciclável. O Liam tira de volta e recorta a foto da ambulância pra colar no caderno.', when: () => dav },
          { who: 'NARRADOR', t: 'A Gazeta vai pro saco do reciclável. Amanhã é dia de plantão.', when: () => !dav },
        ],
      },
    },
    inspect: env
      ? {
          objects: [
            { id: 'envelope', label: 'Caixa de costura {doconj}', desc: 'No fundo, embaixo dos moldes, um envelope pardo grosso. No canto, o carimbo: "Gabinete do Vereador Arlindo Matos".', x: 218, y: 104, w: 30, h: 20 },
            { id: 'carta', label: 'Conta de luz na porta da geladeira', desc: 'Presa pelo ímã de pizzaria: paga em dinheiro vivo, em dia, no mês em que não sobrou nada.', x: 60, y: 70, w: 22, h: 18 },
          ],
          links: [
            { a: 'dou_conta', b: 'envelope', insight: '"Do dinheiro eu dou conta." Com um envelope do gabinete do vereador escondido na caixa de costura.', unlock: 'achou_envelope' },
            { a: 'carta', b: 'envelope', kind: 'confirma', insight: 'A conta de luz foi paga em dinheiro vivo, em dia, no mês em que não sobrou nada. E tem um envelope do vereador na caixa de costura.', unlock: 'achou_envelope' },
          ],
        }
      : undefined,
  };
}

function bicoD18(c: Ctx): SceneDef {
  const luc = is.present('lucia')(c);
  const env = c.flag('envelope_lucia') && luc && !c.flag('envelope_devolvido') && !c.flag('envelope_usado');
  const rosa = c.key('rosangela') === 'salvo' && c.flag('maquina') && luc && !c.flag('rosangela_ajudante');
  const lines: DLine[] = [
    { who: 'NARRADOR', t: 'Você não está em casa quando a cidade lê o seu jornal. Na porta do Regional, um maqueiro reconhece você da central e pergunta se "é verdade aquilo".' },
    { who: 'NARRADOR', t: '{Oconj} deixou a Gazeta virada pra baixo em cima da mesa. Do lado, um prato coberto com outro prato.', when: () => luc },
  ];
  if (env && c.v('lacos') >= 5) lines.push({ who: 'NARRADOR', t: 'Na caixa de costura, um bilhete no lugar de alguma coisa: "Devolvi o que sobrou, na portaria da Câmara. A gente conversa. {c:L|A}."' });
  else if (env) lines.push({ who: 'NARRADOR', t: 'No fundo da caixa de costura, embaixo dos moldes, tem um envelope que você nunca vai ver.' });
  if (rosa) lines.push({ who: 'NARRADOR', t: 'Em cima da máquina, um molde cortado por outra mão. {Oconj} contratou a Rosângela sem esperar você.' });
  return {
    id: 'd18_bico',
    bg: 'preto',
    nodes: {
      start: {
        lines,
        onEnter: (e) => {
          if (env && e.v('lacos') >= 5) e.set('envelope_devolvido');
          else if (env) e.set('envelope_usado');
          if (rosa) e.set('rosangela_ajudante');
        },
      },
    },
  };
}

// -----------------------------------------------------------------------------
export const DAY = day({
  day: 18,
  title: 'Escândalo',
  weekday: 'Terça-feira',
  weather: 'Nublado, abafado depois da chuva. 24 °C.',
  goal: { maxUSA: 3, bonus: 30 },
  onStart: (e) => {
    // a família volta de Rio Claro (o cônjuge e o Liam fora do D13 ao D17)
    if (e.flag('lucia_fora') && !e.flag('lucia_foi_embora')) {
      for (const m of ['lucia', 'davi'] as const) {
        e.family(m, 'bem');
        e.s.family[m].away = false;
      }
      e.unset('lucia_fora');
      e.set('lucia_voltou');
    }
    // fontes da matéria
    if (e.val<string>('depoimento') === 'aceitou') e.source('voce');
    if (e.flag('lucia_fonte')) e.source('lucia');
    if (e.v('intimBene') >= 5) {
      e.source('bene');
      e.set('bene_fonte');
    }
    if (e.key('osvaldo') === 'salvo') e.source('peixoto');
    const n = nFontes(e);
    e.set('materia_publicada');
    e.set('materia_fontes', n);
    if (n >= 2) e.set('materia_forte');
    if (n >= 2 && (e.s.sources.voce || e.s.sources.peixoto)) e.set('peixoto_caiu');
    if (e.val<string>('depoimento') === 'aceitou') e.set('reforco_frota');
    if (e.key('osvaldo') === 'perdido') e.set('peixoto_endureceu');
    if (e.flag('envelope_aceito')) {
      e.add('integridade', -3, 'seu nome na matéria');
      e.set('nome_na_materia');
    }
    // o noturno sem tratamento piora (o motor usa isso nas ligações deixadas ao noturno)
    if (e.flag('encobriu_henrique') || e.flag('omitiu_henrique')) e.set('henrique_piorando');
    e.doc('ramais_central');
    e.doc('materia_carla');
    // a auditoria pega a ficha do Henrique e o Anexo 9-B fraudados
    if (e.flag('encobriu_henrique') && e.flag('mentiu_9B')) {
      e.set('gameover_motivo', 'fraude_ficha');
      e.set('gameover', 'sindicancia');
    }
  },
  newspaper: (c) => {
    const S = c.s.sources;
    const forte = c.flag('materia_forte');
    let headline: string;
    let sub: string;
    if (forte && S.peixoto) {
      headline = 'Planilha interna: Regulação tinha meta para segurar ambulâncias';
      sub = 'Documentos entregues à Gazeta por alguém de dentro da coordenação mostram bônus por "uso racional" de USA. A Saúde+ Gestão está em nome do cunhado do vereador Arlindo Matos.';
    } else if (forte && S.voce) {
      headline = '"A meta decide quem recebe ambulância", diz médico da Regulação';
      sub = 'Regulador da Central, que pediu anonimato, descreve ordens verbais e corte de frota. A Saúde+ Gestão está em nome do cunhado do vereador Arlindo Matos.';
    } else if (forte && S.bene) {
      headline = '"Cansei de chegar tarde": condutor de ambulância quebra o silêncio';
      sub = 'Com nome e foto, o motorista da USA que chegou tarde para Tiago Nunes em 2019 fala de frota cortada e salários atrasados.';
    } else if (forte) {
      headline = 'Salários atrasados e frota cortada: a Central de Regulação por dentro';
      sub = 'Familiares de servidores descrevem a rotina da regulação sob a Saúde+ Gestão.';
    } else {
      headline = 'Família acusa demora da ambulância; OS diz que "nenhum paciente deixou de ser atendido"';
      sub = S.bene
        ? 'Um condutor da Central confirma o atraso de 2019. A reportagem não conseguiu outros depoimentos.'
        : 'A reportagem não obteve documentos internos. A Saúde+ Gestão nega irregularidades e promete processar o jornal.';
    }
    const stories: { title: string; text: string }[] = [];
    if (c.flag('envelope_aceito')) stories.push({ title: 'O envelope do gabinete', text: 'A reportagem cita {m:o médico regulador|a médica reguladora} {tit} {nome} Moura, que teria recebido R$ 1.000 do gabinete do vereador Arlindo Matos. {m:O regulador não foi localizado|A reguladora não foi localizada}.' });
    stories.push({ title: 'Tiago, 26 anos, 40 minutos', text: 'Em 2019, o irmão da repórter caiu de moto na Av. Brasil, a quatro quadras do Regional. A ambulância levou quarenta minutos. "Escrevo esta matéria há cinco anos", diz Carla Nunes.' });
    if (S.bene) stories.push({ title: '"Eu sentei no meio-fio e chorei"', text: 'Benedito, o Seu Bené, condutor da USA 01, com 31 anos de volante, era o motorista daquela ambulância. Aceitou falar com nome: "Não tinha viatura. Tinha meta."' });
    if (S.peixoto) stories.push({ title: 'A planilha', text: 'Pela planilha, o bônus da coordenação dependia de manter "menos de 4 USA por plantão". A fonte entregou os arquivos impressos.' });
    if (S.voce) stories.push({ title: 'Ordem verbal', text: c.flag('ordem_peixoto_registrada') ? 'O regulador entregou uma anotação de próprio punho, com data e hora: "USA 01 só sai pra parada". A ordem não existe no manual.' : 'O regulador descreve ordens dadas pelo interfone que não constam do manual.' });
    if (S.lucia) stories.push({ title: '"A gente vive de bico"', text: '{c:A esposa de um médico regulador|O marido de uma médica reguladora}, que pediu para não ser {c:identificada|identificado}, conta que o salário atrasou dois meses.' });
    stories.push({ title: 'A dona da OS', text: 'A Saúde+ Gestão está registrada em nome de Mauro Teixeira, cunhado do vereador Arlindo Matos. O vereador diz que "não mistura família e política".' });
    return {
      headline,
      sub,
      photo: forte ? (S.peixoto ? 'planilha' : S.voce ? 'anonimo' : S.bene ? 'condutor' : 'central') : 'ambulancia',
      stories: stories.slice(0, 5),
      notice: 'A Câmara convocou a coordenação da Regulação para depor na sexta-feira.',
      ad: 'SAÚDE+ GESTÃO — Nota oficial: "Nenhum paciente deixou de ser atendido."',
      weather: 'Nublado · 24 °C',
    };
  },
  handover: (c) => {
    const lines: DLine[] = [{ who: 'NARRADOR', t: '07:00. Alguém deixou a Gazeta em cima do seu teclado, dobrada na página da matéria.' }];
    if (c.flag('denunciou_henrique')) lines.push({ who: 'PAULA', t: 'Bom dia. Noite estranha: três ligações querendo falar com a coordenação, às quatro da manhã. Uma era de um jornal de São Paulo.' });
    else lines.push({ who: 'HENRIQUE', t: 'Virou notícia, hein? (ele ri sozinho, alto demais) A noite foi tranquila. Ninguém lê jornal de madrugada.' });
    if (c.flag('d17_simone_usa')) lines.push({ who: 'SIMONE', t: 'Catorze por nove. Remédio tomado às seis, com café. (pausa) Você mandou a USA pra mim, {dr}. Tinha criança na água. Eu sei por que você mandou. Não faz mais isso.' });
    else if (c.flag('simone_crise_ok')) lines.push({ who: 'SIMONE', t: 'Catorze por nove. Remédio tomado às seis, com café. Não me olha assim. (pausa) Obrigada por ontem. USB, sentada, sem sirene. Do jeito que eu ia mandar.' });
    else if (c.flag('d17_simone_dispensada')) {
      lines.push({ who: 'SIMONE', t: 'Pressão boa. Remédio tomado. O Peixoto me levou de carro ontem.' });
      lines.push({ who: 'NARRADOR', t: 'Ela liga o fone e não diz mais nada até as nove.' });
    } else lines.push({ who: 'SIMONE', t: 'Bom dia. Leu? A cidade inteira leu.' });
    if (c.flag('envelope_aceito')) {
      lines.push({ who: 'NARRADOR', t: 'Na página três, o seu nome. Com "{tit}" na frente e "teria recebido" no meio.' });
      lines.push({ who: 'SIMONE', t: '(sem olhar pra você) A linha um tá tocando.' });
    }
    return {
      id: 'd18_passagem',
      bg: 'central',
      nodes: {
        start: {
          lines,
          choices: [
            { label: '"Simone, o que você achou da matéria?"', next: 'materia' },
            { label: 'Pegar o fone.' },
          ],
        },
        materia: {
          lines: c.flag('materia_forte')
            ? [
                { who: 'SIMONE', t: 'Li duas vezes. Na segunda eu chorei no ônibus. Não conta pra ninguém.' },
                { who: 'SIMONE', t: 'Hoje vai ter gente ligando só pra xingar. Deixa xingar, {dr}. Dói menos que o resto.' },
              ]
            : [
                { who: 'SIMONE', t: 'Página sete, do lado do horóscopo. O meu signo dizia "mudanças à vista".' },
                { who: 'SIMONE', t: 'O do Peixoto também, imagino. Mas pra ele a mudança é a cor da gravata.' },
              ],
        },
      },
    };
  },
  timeline: [
    {
      at: '07:05',
      kind: 'pedido',
      id: 'bene_revela',
      who: 'USA 01 · BENÉ',
      text: (c) =>
        c.v('intimBene') >= 5
          ? 'Central, USA 01 em QRV. ...{bene}, a matéria. O motorista que sentou no meio-fio e chorou, em 2019, na Av. Brasil: era eu. A Carla me achou faz cinco anos e eu só falei escondido. Ontem eu falei com nome e foto. Achei que agora tinha alguém do lado de cá do rádio que ia entender.'
          : 'Central, USA 01 em QRV. ...Saiu no jornal o motorista que sentou no meio-fio e chorou, em 2019. Sem nome. Era eu. Quarenta minutos, a quatro quadras do Regional. Achei que alguém aí devia saber.',
      options: [
        { id: 'obrigado', label: '"Valeu por me contar, Bené."', effect: (c) => c.add('intimBene', 1, 'ouviu o Bené'), reply: (c) => `De nada. Bora trabalhar, ${beneNome(c)}.` },
        { id: 'tiago', label: '"Você lembra dele? Do Tiago?"', effect: (c) => c.add('humanidade', 1, 'perguntou do Tiago'), reply: 'Lembro todo dia. Vinte e seis anos, capacete azul. A gente tava preso numa transferência que nem precisava de USA. Quando eu cheguei, a irmã tava ajoelhada no asfalto, segurando a mão dele. Ninguém tinha ensinado nada pra ela no telefone.' },
        { id: 'silencio', label: '(Não responder.)' },
      ],
      defaultOption: 'silencio',
      timeout: 10,
    },
    {
      at: '07:40',
      kind: 'script',
      id: 'peixoto_manha',
      run: (c) => {
        if (c.s.sources.peixoto) c.modal('DR. PEIXOTO', 'Leu o jornal, {dr}? (pausa) Não precisa dizer nada. A planilha da página três... alguém entregou. Meu pai tá em casa, comendo goiabada escondido da cuidadora. Eu fico aqui até a auditoria. Depois a gente vê.', 'interfone');
        else if (c.key('osvaldo') === 'perdido') c.modal('DR. PEIXOTO', 'Leu? Pois é. A diretoria quer um nome até sexta. Eu vou dar o nome de quem errou, {dr}. Não o de quem cortou. Cuidado onde pisa hoje.', 'interfone');
        else if (c.flag('peixoto_caiu')) c.modal('DR. PEIXOTO', 'Bom dia. A diretoria me chamou às dez. Se eu não voltar, o painel continua aí. Ele não precisa de mim pra ficar amarelo.', 'interfone');
        else c.modal('DR. PEIXOTO', 'Matéria fraca, {dr}. A OS já mandou nota. Hoje é dia normal, meta normal. Entendido?', 'interfone');
      },
    },
    { at: '10:30', kind: 'radio', who: 'RÁDIO AM', text: '"...o vereador Arlindo Matos nega relação com a Saúde+ Gestão. Disse que o cunhado é empresário honesto e que a mãe dele, Dona Odete, é a primeira a defender a Regulação..."' },
    {
      at: '12:00',
      kind: 'script',
      id: 'simone_corte',
      run: (c) => {
        if (c.flag('materia_forte')) c.modal('SIMONE', 'A Rose do RH desceu. Disse que a OS "suspendeu reestruturações até a auditoria". Tradução: o corte de TARM do dia 31 tá congelado. Congelado não é cancelado, {dr}. Mas é melhor que ontem.', 'simone');
        else c.modal('SIMONE', 'A Rose do RH desceu. A lista do corte do dia 31 tá pronta. Ela não quis me olhar. Isso é uma resposta, né?', 'simone');
      },
    },
    {
      at: '16:45',
      kind: 'script',
      id: 'peixoto_teste_fim',
      run: (c) => {
        const t = c.callStatus('d18_peixoto_teste');
        const r = t?.decision?.resource;
        if (r !== 'USA' && r !== 'USB') return;
        if (c.key('osvaldo') === 'perdido') {
          c.set('peixoto_culpou');
          c.add('desgaste', 5, 'o Peixoto anotou seu nome');
          c.modal('DR. PEIXOTO', 'Ligação-teste das duas e vinte. Dor no peito de livro, voz de quem lê bula. Você mandou viatura. Tá no relatório da auditoria, {dr}. Com o seu nome.', 'interfone');
        } else {
          c.modal('DR. PEIXOTO', 'Era eu às duas e vinte. Ligação-teste, ordem da OS. Você mandou viatura. Se fosse de verdade, eu mandaria também... mas a OS não quer saber disso. Vou escrever "dentro do protocolo". Fica entre nós.', 'interfone');
        }
      },
    },
    { at: '18:40', kind: 'radio', who: 'USA 01 · BENÉ', text: 'Central, USA 01 recolhendo. Hoje o pessoal da base me olhou diferente. Uns com raiva, uns com orgulho. Amanhã a gente segue, {bene}.' },
  ],
  calls: [
    // ----------------------------------------------------------------- 1 ★ desabafo
    call({
      id: 'd18_desabafo',
      ref: 'D18 #1 ★',
      at: '07:10',
      anchor: true,
      num: '(17) 99307-5512',
      caller: 'Mulher, voz alterada',
      callerName: 'Mulher',
      type: 'comum',
      voice: 'mulher',
      note: 'Mulher brava. Diz que leu o jornal.',
      noteFixed: true,
      addr: { rua: 'Rua Tiradentes', n: 1880, bairro: 'Vila Nova', ref: 'Casa com o portão pintado de branco, do lado da borracharia.' },
      amb: ['cozinha', 'radio_am'],
      open: (c: Ctx) => [
        'É da emergência? {{Não é emergência|nao_emergencia}}. Eu liguei pra falar umas verdades.',
        'Eu li a matéria. {{Meu pai morreu esperando vocês em 2022. Cinquenta e cinco minutos|espera_pai}}. Na calçada de casa, do lado do portão.',
        c.flag('envelope_aceito') ? '{{E agora sai no jornal que tem {m:doutor|doutora} aí pegando dinheiro de vereador|nome_jornal}}. É você? Hein? É você?' : 'E vocês aí, sentadinhos no ar-condicionado, contando ambulância.',
      ],
      q: {
        oque: 'Já falei: não é emergência. É raiva. Cinquenta e cinco minutos.',
        consciencia: 'Eu tô ótima. Acordada até demais.',
        respira: 'Respiro, {m:moço|moça}. Eu respiro. Ele que não.',
        idade: 'Eu tenho quarenta e oito. Ele tinha setenta e um.',
        paciente: 'Não tem paciente. Tem eu.',
        seguranca: 'Ninguém aqui. Só eu e o rádio.',
        historico: 'Ele tinha coração. Eu falei isso no telefone, em 2022. Falei três vezes.',
        referencia: 'Pra quê? Pra mandar ambulância agora? [riso amargo]',
        inicio: 'Faz dois anos, três meses e onze dias.',
        risco: 'Perigo? Não, {m:moço|moça}. Ninguém aqui vai fazer besteira. Eu só tô com raiva.',
      },
      extra: [
        {
          id: 'ouvir',
          label: 'Deixar ela falar',
          kind: 'fala',
          cost: 10,
          say: 'Pode falar. Eu tô ouvindo.',
          a: [
            '[silêncio comprido]',
            'Ele chamou meu nome. Na calçada. Depois parou de chamar. Eu fiquei contando no relógio da cozinha, porque não sabia o que mais fazer.',
            'Ninguém me ensinou a fazer nada no telefone. Hoje eu li que ensinam. Que tem regulador que conta junto.',
            '...Não é com você, né? Você nem tava aí.',
          ],
          onAsk: fx.add('humanidade', 1, 'deixou ela desabafar'),
        },
        {
          id: 'nome_pai',
          label: 'Perguntar o nome do pai dela',
          say: 'Qual era o nome do seu pai?',
          a: '...Nestor. Nestor Gonçalves. {{Ninguém nunca me perguntou o nome dele|ninguem_perguntou}}.',
          onAsk: fx.add('humanidade', 1, 'perguntou o nome do Seu Nestor'),
        },
      ],
      links: [
        { a: 'espera_pai', b: 'doc:materia_tiago', kind: 'confirma', insight: 'Tiago esperou quarenta minutos em 2019. O pai dela, cinquenta e cinco, em 2022. A matéria não inventou nada. Não é emergência: é luto.' },
        { a: 'nao_emergencia', b: 'manual:azul', kind: 'confirma', insight: 'Ninguém em risco, ninguém doente: não é caso de viatura. Encerrar com respeito, sem punir o desabafo.' },
      ],
      patient: { name: 'Filha do Seu Nestor Gonçalves' },
      truth: { dx: 'Desabafo depois da matéria (não é emergência)', sev: 'trote', ok: ['TROTE'], prankKind: 'desabafo' },
      radio: { prank: 'Central, {unit} na Tiradentes. Uma senhora abriu o portão, olhou a gente e começou a chorar. Disse que não chamou ninguém. Disse que a gente chegou dois anos atrasado.' },
      diary: { ori: 'A filha do Seu Nestor Gonçalves. Ele esperou 55 minutos em 2022. Ela ligou pra gritar. Eu deixei.' },
    }),
    // ----------------------------------------------------------------- 2 ★ CIDA
    call({
      id: 'd18_cida',
      ref: 'D18 #2 ★',
      at: '08:05',
      anchor: true,
      num: NUM.cida,
      caller: 'Dona Cida',
      callerName: 'Dona Cida',
      type: 'frequentador',
      voice: 'cida',
      note: 'Dona Cida. Leu o jornal.',
      noteFixed: true,
      addr: ADDR.cida,
      amb: ['tv', 'passaros'],
      open: (c: Ctx) => [
        'Oi, {meu} {filho}, é a Cida! {{Eu li no jornal|jornal}}. Você tá bem?',
        c.flag('envelope_aceito')
          ? 'Escreveram umas coisas lá... do seu nome. {{Eu não acredito, viu? Eu conheço a sua voz|conheco_voz}}.'
          : 'Disseram que a central tá sem ambulância, que o povo espera... Você tá comendo direito, pelo menos?',
      ],
      q: {
        oque: 'Nada não, {meu} {filho}. Liguei pra saber de você. Hoje é você que tá no jornal, né? [ri]',
        consciencia: 'Acordadíssima. Dormi bem pela primeira vez desde a chuva.',
        respira: 'Respiro, respiro.',
        idade: 'Setenta e nove. Ainda.',
        historico: 'Pressão. Tomei o remédio. A cozinha ainda tá com barro da enchente.',
        paciente: 'Sou eu mesma!',
        sangramento: 'Credo, não.',
        fast: ['Ai, você e esse teste! Sorri. Levantei os dois braços.', '"O céu é azul." Hoje é azul mesmo, {meu} {filho}!'],
        seguranca: 'Seguro. Eu, o gato e o jornal.',
      },
      extra: [
        {
          id: 'enchente',
          label: 'E a casa, depois da água?',
          say: 'E a casa, Dona Cida? Secou?',
          a: (c: Ctx) =>
            c.flag('d17_cida_bombeiros')
              ? ['Os bombeiros me tiraram de bote, eu e o gato! O moço me carregou no colo igual galã de novela.', 'Agora tá tudo com cheiro de barro. Mas tá seco.']
              : ['Fiquei em cima da cadeira até de noite, {meu} {filho}. A água foi embora sozinha.', 'A cozinha tá um barro só. Mas o gato tá bem. Ele ficou bravo comigo o dia inteiro.'],
        },
        {
          id: 'davi',
          label: 'Ela pergunta do Liam',
          kind: 'fala',
          when: is.flag('lucia_voltou'),
          say: 'O Liam? Tá pra voltar, Dona Cida.',
          a: 'Tá pra voltar! A Zélia me contou. Que bom, {meu} {filho}. Casa sem criança é casa sem relógio.',
        },
        {
          id: 'conversar',
          label: 'Conversar um pouco com ela',
          kind: 'fala',
          cost: 15,
          say: 'Tô bem, Dona Cida. Obrigad{m:o|a} por ligar. E a senhora? Me conta da novela.',
          a: [
            'A Marta descobriu tudo, {meu} {filho}! Mas eu não vou contar, que você vai querer ver.',
            '[ela ri]',
            'Sabe que você é a primeira pessoa que me pergunta da novela de volta? Todo mundo só escuta. Você pergunta.',
          ],
          onAsk: fx.all(fx.add('humanidade', 1, 'conversou com a Dona Cida'), fx.set('cida_conversou_d18')),
        },
      ],
      links: [{ a: 'jornal', b: 'manual:azul', kind: 'confirma', insight: 'Ela ligou pra saber de você. Não é urgência de ninguém. A não ser, talvez, sua.' }],
      onAnswer: fx.all(fx.set('cida_ligou_d18'), fx.add('humanidade', 1, 'a Dona Cida perguntou de você')),
      patient: { name: 'Aparecida (Dona Cida)', age: 79, sex: 'F' },
      truth: { dx: 'Ligou para saber como você está', sev: 'azul', ok: ['ORI'], ref: ['CASA', 'UBS'] },
      diary: { ori: 'Ligou pra saber se eu estava bem, depois da matéria. Ninguém mais perguntou.' },
    }),
    // ----------------------------------------------------------------- 3
    call({
      id: 'd18_aorta',
      ref: 'D18 #3',
      at: '09:00',
      pool: 'grave,cardio',
      num: '(17) 3326-1820',
      caller: 'Cláudia (esposa)',
      callerName: 'Cláudia',
      type: 'comum',
      voice: 'mulher',
      note: 'Homem com dor nas costas fortíssima. Esposa apavorada.',
      noteWrong: 'Dor nas costas. Carregou peso ontem.',
      addr: { rua: 'Rua Rui Barbosa', n: 1820, bairro: 'Centro', ref: 'Prédio cinza, apartamento 3, em cima da papelaria.' },
      amb: ['gemidos', 'cachorro'],
      open: ['Meu marido tá com uma {{dor nas costas que ele diz que tá rasgando|rasgando}}, {dr}! Ele tá gritando!', '[um homem gemendo alto; um cachorro latindo sem parar]', 'CLÁUDIA: Calma, Beto, calma...'],
      q: {
        oque: 'Ele tava sentado tomando café e {{do nada|subito}} deu um grito. Disse que foi uma facada nas costas, que agora tá subindo pro peito.',
        consciencia: 'Acordado, gritando. Tá branco.',
        respira: 'Respira rápido, de dor.',
        idade: 'Cinquenta e cinco.',
        inicio: 'Agora! Uns dez minutos.',
        historico: '{{Pressão alta, das brabas|has}}. E ele não toma o remédio direito.',
        dorpeito: 'Começou nas costas, no meio das escápulas... agora tá no peito. {{Suando frio, molhou a camisa toda|suor}}.',
        paciente: ['BETO: [grito] Tá... rasgando... aqui dentro...', 'BETO: Nunca senti... nada assim...'],
        sangramento: 'Não.',
        seguranca: 'Tranquilo. Só eu e ele, e o cachorro.',
        referencia: 'Rui Barbosa, 1820, prédio cinza em cima da papelaria. Apartamento 3. A escada é estreita.',
      },
      extra: [
        { id: 'esforco', label: 'Fez esforço? Carregou peso?', say: 'Ele fez esforço ontem? Carregou peso?', a: 'Ontem ele carregou uns sacos de cimento... {{deve ser a coluna, né?|coluna}}' },
        {
          id: 'aparelho',
          label: 'Tem aparelho de pressão em casa?',
          say: 'Tem aparelho de pressão em casa? Mede nos dois braços.',
          a: ['Tem! Peraí... [bip] Deu vinte e um por doze.', '[bip] {{No outro braço deu quinze por nove|bracos}}, {dr}. Tá quebrado esse aparelho?'],
        },
      ],
      links: [
        { a: 'rasgando', b: 'manual:peito', insight: 'Dor súbita, "rasgando", nas costas e indo para o peito, com suor frio, em hipertenso: dissecção de aorta ou infarto. Vermelho → USA → Regional (Manual p.3).' },
        { a: 'coluna', b: 'subito', insight: 'Dor de coluna vem devagar e piora com o movimento. Esta veio "do nada", como facada. Não é coluna.' },
        // Conferido (RC17: dor intensa → USA; RC13: dor que vai para o dorso pode ser dissecção de aorta; diferença de
        // pressão de mais de 20 mmHg entre os braços é sinal clássico).
        { a: 'bracos', b: 'rasgando', insight: 'Pressão diferente entre os braços e dor que rasga: sinal clássico de dissecção de aorta. Cada minuto conta.' },
      ],
      worsen: [{ after: 90, lines: ['CLÁUDIA: {Dr}! {{Ele desmaiou e voltou, tá cinza!|desmaiou}}'] }],
      patient: { name: 'Roberto Nascimento', age: 55, sex: 'M' },
      truth: { dx: 'Dissecção de aorta', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 60, bad: 150 } },
      radio: {
        ok: '{central}, {unit}. Pressão diferente nos braços, dor que rasga. Dissecção até prova em contrário. Seguimos {dest} com a cirurgia avisada.',
        dead: 'Central... {unit}. Rompeu no caminho. Óbito às {hora}.',
        under: 'Central, {unit}! Suspeita de dissecção de aorta, paciente chocando! Precisamos de USA!',
      },
      diary: {
        alive: 'Seu Roberto, 55. A aorta rasgou enquanto ele tomava café. A esposa mediu a pressão nos dois braços.',
        dead: 'Seu Roberto, 55. A aorta rasgou enquanto ele tomava café.',
      },
    }),
    // ----------------------------------------------------------------- 4
    call({
      id: 'd18_punho',
      ref: 'D18 #4',
      at: '10:00',
      pool: 'trauma_moderado',
      num: '(17) 99412-1650',
      caller: 'Bianca (neta)',
      callerName: 'Bianca',
      type: 'comum',
      voice: 'jovem_m',
      note: 'Idosa caiu no quintal. Punho torto.',
      noteWrong: 'Idosa caiu. Acho que bateu a cabeça.',
      addr: { rua: 'Rua Quaresmeira', n: 1650, bairro: 'Jardim Primavera', ref: 'Casa de muro de pedra, com um ipê roxo na frente.' },
      amb: ['gemidos', 'passaros'],
      open: ['Oi, bom dia. Minha vó escorregou no quintal, ainda tá com limo da chuva. {{Caiu com a mão no chão|mao_chao}} e o punho ficou {{torto, que nem um garfo|garfo}}.', '[uma senhora gemendo baixinho: "ai, Bia, não mexe"]'],
      q: {
        oque: 'Ela foi estender roupa, escorregou no limo.',
        consciencia: 'Acordada, reclamando. Sabe tudo, sabe até o capítulo da novela.',
        respira: 'Normal.',
        idade: 'Oitenta e quatro.',
        inicio: 'Faz uns vinte minutos.',
        historico: 'Pressão e osteoporose. {{Remédio de afinar o sangue ela não toma|sem_anticoag}}, só o da pressão.',
        sangramento: 'Não sangrou. Tá inchando e roxo.',
        paciente: 'CELINA: Bati só a mão, minha filha. A cabeça não. Ai...',
        seguranca: 'Tranquilo.',
        referencia: 'Muro de pedra, ipê roxo na frente. {m:O senhor|A senhora} vai ver as flores no chão.',
      },
      extra: [
        { id: 'cabeca', label: 'Bateu a cabeça? Desmaiou?', say: 'Ela bateu a cabeça? Desmaiou em algum momento?', a: 'Não, ela caiu sentada e pôs a mão. {{Lembra de tudo|lembra}}.' },
        { id: 'dedos', label: 'Os dedos mexem? Cor?', say: 'Os dedos dessa mão mexem? Estão rosados ou roxos, frios?', a: 'Mexe, rosadinho. Só dói muito.' },
      ],
      links: [
        { a: 'garfo', b: 'manual:amarelo', insight: 'Punho torto "em garfo" após queda com a mão no chão, idosa lúcida, sem bater a cabeça: fratura de punho. Amarelo → USB → UPA (Manual p.1 e 9-A).' },
        { a: 'sem_anticoag', b: 'lembra', kind: 'confirma', insight: 'Sem anticoagulante, sem bater a cabeça, lembra de tudo: não é trauma de crânio. O problema é o punho.' },
      ],
      patient: { name: 'Celina Prado', age: 84, sex: 'F' },
      truth: { dx: 'Fratura de punho (queda da própria altura)', sev: 'amarelo', ok: ['USB'], dest: ['UPA'], risk: { good: 120, bad: 300, needs: 'USB' } },
      radio: { ok: 'Central, {unit}. Fratura de punho, deformidade em dorso de garfo, imobilizada. A neta vem junto. Seguimos {dest}.' },
      diary: { alive: 'Dona Celina, 84. Escorregou no limo da chuva estendendo roupa. Punho imobilizado.' },
    }),
    // ----------------------------------------------------------------- 5 (trote)
    call({
      id: 'd18_trote',
      ref: 'D18 #5',
      at: '11:00',
      pool: 'trote',
      num: '(17) 99876-1213',
      caller: 'Voz de adolescente',
      type: 'trotista',
      voice: 'adolescente',
      note: 'Homem caído na Praça da Matriz.',
      noteWrong: 'Homem desmaiado na praça. Parece sério.',
      addr: { rua: 'Rua XV de Novembro', n: 1201, bairro: 'Centro', ref: 'Praça da Matriz.' },
      amb: ['risadas', 'rua'],
      open: ['Alô? Emergência? Tem um cara {{caído ali na Praça da Matriz|praca}}, manda a ambulância! {{Vamos ver se vocês demoram cinquenta minutos mesmo!|cinquenta}}', '[{{risadas abafadas; alguém sussurra "grava, grava"|risadas}}]'],
      q: {
        consciencia: 'Tá... tá desmaiado. Não, tá acordado. [risada]',
        respira: 'Respira... pelo nariz! [risadas]',
        idade: 'Sei lá, uns cem anos? [risada]',
        oque: 'Caiu, ué! Do nada!',
        referencia: 'Na praça, do lado do... do pipoqueiro.',
        paciente: 'Ele não quer falar com você, {m:moço|moça}. [risadas]',
        seguranca: 'Seguro, seguro. Vem logo que a gente tá filmando!',
        historico: 'Doença? Sei lá. Doença de velho.',
        sangramento: 'Um monte! Não, pouquinho.',
      },
      callback: ['[{{Caixa postal: "Oi, aqui é o Dudu, deixa recado aí, falou!"|retorno_caixa}}]', '[risadas ao fundo antes do bipe]'],
      links: [
        { a: 'cinquenta', b: 'risadas', insight: 'Querem "testar" se a ambulância demora cinquenta minutos, rindo e filmando. Não tem ninguém caído: tem um vídeo sendo gravado.' },
        { a: 'risadas', b: 'manual:trote_sinais', insight: 'Risadas, relato que muda a cada pergunta e "vem logo que a gente tá filmando": sinais de trote (Manual p.2).' },
        { a: 'retorno_caixa', b: 'num', insight: 'Ligar de volta: caixa postal de um adolescente, com risada antes do bipe.' },
      ],
      patient: { name: '"Homem na praça"' },
      truth: { dx: 'Trote inspirado na matéria', sev: 'trote', ok: ['TROTE'], prankKind: 'trote' },
      radio: { prank: 'Central, {unit} na Matriz. Dois moleques filmando a gente chegar e saíram correndo. Ninguém caído. Mais um vídeo pra internet.' },
    }),
    // ----------------------------------------------------------------- 6
    call({
      id: 'd18_bebe',
      ref: 'D18 #6',
      at: '12:10',
      pool: 'grave,pediatria',
      num: '(17) 99230-0980',
      caller: 'Raíssa (mãe)',
      callerName: 'Raíssa',
      type: 'comum',
      voice: 'jovem_m',
      note: 'Mãe: bebê de 3 meses molinho, não quer mamar.',
      noteWrong: 'Mãe de primeira viagem. Bebê com cólica.',
      addr: { rua: 'Rua das Mangueiras', n: 980, bairro: 'Jardim Primavera', ref: 'Casa verde-água com uma bicicleta infantil no portão.' },
      amb: ['bebe', 'silencio'],
      open: ['Desculpa ligar... meu bebê tá {{molinho|molinho}}, não quer mamar desde a madrugada. Minha sogra disse que {{é dente nascendo|dente}}, mas ele tá esquisito.', '[{{um gemido fraco e ritmado, de bebê, a cada respiração|gemido}}]'],
      q: {
        idade: '{{Três meses|tres_meses}}. Faz quatro no dia dez.',
        consciencia: 'Ele abre o olho e fecha. Não chora direito, {{só geme|so_geme}}.',
        respira: 'Rápido... e fazendo esse gemidinho que você tá ouvindo.',
        inicio: 'Desde as três da manhã. Achei que era cólica.',
        historico: 'Nasceu bem, de trinta e nove semanas. A vacina de dois meses ele tomou.',
        sangramento: 'Não.',
        paciente: '[o gemido, fraquinho, do lado do telefone]',
        oque: 'Ele mamava de três em três horas. Hoje não quis nada. {{A fralda tá sequinha desde as seis|fralda}}.',
        seguranca: 'Tranquilo. Só eu e ele, meu marido tá no trabalho.',
        referencia: 'Casa verde-água com a bicicletinha no portão. É do irmão dele.',
      },
      extra: [
        { id: 'febre', label: 'Tem febre? Mediu?', say: 'Ele tem febre? Você mediu?', a: 'Tá {{trinta e oito e meio|febre}}. E a mãozinha gelada, isso é normal?' },
        { id: 'moleira', label: 'Como está a moleira?', say: 'Como está a moleira dele, a parte mole da cabeça?', a: '{{Tá estufadinha|moleira}}... Dura. É normal?' },
        { id: 'manchas', label: 'Manchas na pele?', say: 'Ele tem manchas na pele? Roxinhas, que não somem quando aperta?', a: 'Não vi... peraí... [pausa] Não. Nenhuma.' },
      ],
      links: [
        { a: 'dente', b: 'tres_meses', insight: 'Três meses é cedo para dente. E dente não deixa bebê gemendo, molinho e sem mamar.' },
        { a: 'molinho', b: 'manual:vermelho', insight: 'Bebê de três meses molinho, gemendo, sem mamar, com febre: sinais de infecção grave. Vermelho → USA → Regional (pediatria grave, Manual p.9-A).' },
        // Conferido (RC6/RC14: "sinais de meningismo" → USA; no lactente, a moleira abaulada com febre faz esse papel;
        // campo B1/B6: gemência, hipoatividade e mão fria na impressão inicial são sinais de gravidade).
        { a: 'moleira', b: 'febre', insight: 'Moleira estufada com febre num bebê pequeno: suspeita de meningite. Não espere.' },
      ],
      worsen: [{ after: 60, lines: ['RAÍSSA: {Dr}... {{ele ficou meio roxinho em volta da boca|roxinho}}. E parou de gemer. Isso é bom?'] }],
      patient: { name: 'Heitor (3 meses)', sex: 'M' },
      truth: { dx: 'Infecção grave em lactente (suspeita de meningite)', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 50, bad: 120 } },
      radio: {
        ok: '{central}, {unit}. Lactente toxemiado, fontanela abaulada. Acesso, soro correndo. Seguimos {dest}, já avisados pra ter antibiótico na porta. Chegamos a tempo.',
        dead: 'Central... {unit}. (silêncio comprido) Óbito às {hora}. Três meses.',
        under: 'Central, {unit}! Lactente grave, gemente, hipotérmico! Precisamos de USA!',
      },
      diary: {
        alive: 'Heitor, três meses. "É dente", disse a avó. Era meningite. A mãe ligou mesmo assim.',
        dead: 'Heitor, três meses. "É dente", disse a avó.',
      },
    }),
    // ----------------------------------------------------------------- 7
    call({
      id: 'd18_colica',
      ref: 'D18 #7',
      at: '13:15',
      pool: 'moderado',
      num: '(17) 99178-2050',
      caller: 'Vinícius',
      callerName: 'Vinícius',
      type: 'exagerador',
      voice: 'jovem_h',
      note: 'Rapaz com dor forte nas costas. Vomitando.',
      noteWrong: 'Rapaz diz que tá morrendo. Infarto?',
      addr: { rua: 'Rua Padre Anchieta', n: 2050, bairro: 'Centro', ref: 'Prédio amarelo, apartamento 22, interfone quebrado.' },
      amb: ['gemidos'],
      open: ['{Dr}, eu {{tô morrendo|morrendo}}! É uma dor do lado, aqui nas costas, que vem e vai, {{eu não paro quieto|nao_para}}!', '[alguém vomitando; passos de um lado pro outro]'],
      q: {
        oque: 'Acordei com uma pontada aqui do lado direito, nas costas, que desce pra virilha. {{Vomitei duas vezes|vomitou}}.',
        consciencia: 'Acordado! Antes não tivesse!',
        respira: 'Respiro... respiro rápido de dor.',
        idade: 'Vinte e nove.',
        inicio: 'Faz uma hora.',
        historico: '{{Meu pai tem pedra no rim|pai_pedra}}. Eu nunca tive nada.',
        sangramento: 'O xixi saiu {{escuro, cor de chá|urina}}... é sangue?',
        paciente: 'Sou eu mesmo, ai!',
        dorpeito: 'Peito não. É do lado, nas costas.',
        seguranca: 'Tô sozinho em casa, minha mulher tá no trabalho.',
        referencia: 'Padre Anchieta, 2050, prédio amarelo. O interfone tá quebrado, eu desço.',
      },
      extra: [
        { id: 'febre', label: 'Tem febre, calafrio?', say: 'Você tem febre, calafrio, tremedeira?', a: '{{Febre não|sem_febre}}. Só suor da dor.' },
        { id: 'carro', label: 'Alguém pode te levar?', say: 'Tem alguém que pode te levar à UPA?', a: 'Não. Minha mulher tá com o carro em Rio Claro. Eu não consigo nem ficar em pé direito, quanto mais pegar ônibus.' },
      ],
      links: [
        { a: 'morrendo', b: 'nao_para', insight: '"Tô morrendo" de quem não para quieto, com dor em cólica que vem e vai: cólica renal. Dói muito, mas não mata. Amarelo.' },
        { a: 'urina', b: 'pai_pedra', insight: 'Urina escura com sangue, dor em cólica e o pai com pedra no rim: cálculo renal. USB → UPA para analgesia; sozinho, vomitando, não tem como ir.' },
      ],
      patient: { name: 'Vinícius Prado', age: 29, sex: 'M' },
      truth: { dx: 'Cólica renal', sev: 'amarelo', ok: ['USB'], dest: ['UPA'], risk: { good: 120, bad: 320, needs: 'USB' } },
      radio: {
        ok: 'Central, {unit}. Cólica renal clássica, sem febre. Analgesia na UPA. Ele pediu desculpa pelo "tô morrendo".',
        excess: '{central}, {unit}. É pedra no rim, {dr}. Dói, mas não precisava de USA.',
      },
      diary: { alive: 'Vinícius, 29. "Tô morrendo", de pedra no rim. Pediu desculpa pra equipe.' },
    }),
    // ----------------------------------------------------------------- 8 ★ Peixoto (ligação-teste)
    call({
      id: 'd18_peixoto_teste',
      ref: 'D18 #8 ★',
      at: '14:20',
      anchor: true,
      num: NUM.peixoto,
      caller: 'Homem, voz rouca',
      callerName: 'Homem',
      type: 'disfarcado',
      voice: 'peixoto',
      note: 'Homem, dor no peito. Fala estranho, {dr}. Fala que nem médico.',
      noteFixed: true,
      addr: ADDR.osvaldo,
      amb: ['silencio', 'radio_am'],
      open: [
        'Boa tarde. Eu estou com uma {{dor precordial em aperto, irradiando para o membro superior esquerdo|jargao}}. Início há vinte minutos.',
        '[ao fundo, bem baixinho: {{um rádio chiando: "...USB 03, QRV na base Norte..."|radio_fundo}}]',
      ],
      q: {
        idade: '{{Cinquenta e... oito|idade_hesita}}. Cinquenta e oito anos.',
        oque: 'Dor torácica típica. Sudorese. Náusea. O quadro completo, como se diz.',
        consciencia: 'Lúcido e orientado. {{Glasgow quinze|glasgow}}.',
        respira: 'Respiro bem. Frequência normal, eu diria.',
        inicio: ['Vinte minutos.', '{{Quanto tempo a USA leva até aqui? Vocês têm quantas livres agora?|pergunta_frota}}'],
        historico: 'Hipertenso. Tomo os remédios... os de pressão. Os normais.',
        dorpeito: 'Irradia para o braço esquerdo e para a mandíbula. Suor frio. Tudo isso que {m:o senhor|a senhora} perguntou.',
        paciente: 'Sou eu mesmo. {{Sozinho em casa|sozinho}}.',
        sangramento: 'Não.',
        seguranca: 'Seguro. Ninguém aqui.',
        referencia: 'Rua dos Bem-te-vis, 1480. Prédio Solar das Palmeiras, apartamento 41.',
        fast: 'Sorrindo, braços para cima, "o céu é azul". Não é AVC, se é o que {m:o senhor|a senhora} quer saber.',
      },
      extra: [
        { id: 'profissao', label: 'O senhor é da área da saúde?', say: 'O senhor é profissional de saúde?', a: '...Não. Aposentado. {{Vejo muito programa de médico na televisão|programa}}.' },
        {
          id: 'desmascarar',
          label: '"Dr. Peixoto?"',
          kind: 'confronto',
          locked: true,
          say: 'Dr. Peixoto?',
          a: (c: Ctx) =>
            c.key('osvaldo') === 'salvo'
              ? [
                  'PEIXOTO: [longo silêncio] ...Passou, {dr}.',
                  'PEIXOTO: A OS mandou a coordenação fazer cinco ligações-teste hoje. Querem achar regulador errando, pra matéria virar culpa de vocês. Você é a quinta.',
                  'PEIXOTO: Vou escrever "nenhuma irregularidade". [pausa] Meu pai mandou um abraço. Ele não sabe que eu tô fazendo isso.',
                ]
              : c.key('osvaldo') === 'perdido'
                ? [
                    'PEIXOTO: [longo silêncio]',
                    'PEIXOTO: A diretoria quer provar que o problema é regulador que manda USA pra qualquer um que fala bonito.',
                    'PEIXOTO: Meu pai não sabia falar bonito. Ele só disse que tava cansado. [ele desliga]',
                  ]
                : ['PEIXOTO: ...É. Ordem da diretoria: ligação-teste. Não é pessoal, {dr}.', 'PEIXOTO: Se servir de consolo, você foi {m:o único|a única} que percebeu.'],
          onAsk: fx.set('peixoto_desmascarado'),
        },
      ],
      callback: ['[toca duas vezes]', '{{"Coordenação da Regulação, boa tarde..."|retorno_peixoto}}', '[a voz para no meio; silêncio]', '"...É. Sou eu."'],
      links: [
        { a: 'num', b: 'doc:ramal_coord', insight: 'O número é o ramal da coordenação da própria central. Quem está com "dor no peito" é o Peixoto.', unlock: 'desmascarar', onFind: fx.set('peixoto_desmascarado') },
        { a: 'retorno_peixoto', b: 'num', insight: 'Ligar de volta caiu na coordenação. A voz é a do Peixoto.', unlock: 'desmascarar', onFind: fx.set('peixoto_desmascarado') },
        { a: 'radio_fundo', b: 'sozinho', insight: '"Sozinho em casa"... com o rádio das viaturas chiando no fundo. Ele está ligando de dentro da central.', unlock: 'desmascarar', onFind: fx.set('peixoto_desmascarado') },
        { a: 'jargao', b: 'programa', insight: '"Precordial", "membro superior esquerdo", "Glasgow quinze". Ninguém aprende isso em programa de televisão. É um médico recitando o protocolo.' },
      ],
      patient: { name: '"Paciente-teste"' },
      truth: { dx: 'Ligação-teste da coordenação', sev: 'trote', ok: ['TROTE'], prankKind: 'teste' },
      radio: { prank: 'Central, {unit} no Solar das Palmeiras. O porteiro disse que o 41 tá vazio desde a semana passada. Tinha um carro da coordenação parado na frente. Saiu quando a gente chegou.' },
      diary: { ori: 'Ligação-teste. Era o Peixoto, com voz de bula.' },
    }),
    // ----------------------------------------------------------------- 9 ★ Dona Odete (o vereador, de novo)
    call({
      id: 'd18_odete',
      ref: 'D18 #9 ★',
      at: '15:30',
      anchor: true,
      num: NUM.vereador,
      caller: 'Vereador Arlindo Matos',
      callerName: 'Arlindo',
      type: 'vip',
      voice: 'grave',
      note: 'Vereador Arlindo. De novo, {dr}. A mãe dele.',
      noteFixed: true,
      addr: ADDR.odete,
      amb: ['tv', 'ventilador'],
      open: (c: Ctx) => [
        'ARLINDO: {Dr}... aqui é o Arlindo. Arlindo Matos. Eu sei. Eu sei o que {m:o senhor|a senhora} tá pensando.',
        c.flag('envelope_aceito')
          ? 'ARLINDO: Saiu seu nome no jornal por minha causa. Não é hora pra isso. É a minha mãe de novo. {{Ela diz que não é nada|diz_nada}}. Mas ela tá esquisita.'
          : 'ARLINDO: É a minha mãe de novo. {{Ela diz que não é nada|diz_nada}}. Mas ela tá esquisita. Ela nunca fica quieta assim.',
        '[ao fundo, uma TV de notícias é desligada no meio de uma frase]',
      ],
      q: {
        oque: 'ARLINDO: Ela almoçou pouco, foi deitar, disse que tava com {{uma azia|azia}}. Agora tá sentada no sofá, quieta, olhando pro nada.',
        consciencia: 'ARLINDO: Tá acordada. Responde. Mas devagar, cansada.',
        respira: 'ARLINDO: Respira... meio curto. Ela diz que é o calor.',
        idade: 'ARLINDO: Oitenta e dois.',
        inicio: 'ARLINDO: A azia começou depois do almoço, uma e pouco. Piorou agora, faz meia hora.',
        historico: 'ARLINDO: {{Diabetes|diabetes}}, pressão. Toma uns cinco remédios. Eu tenho a lista no celular.',
        dorpeito: 'ARLINDO: Dor no peito ela diz que não tem. Mas tá {{suando frio, a testa molhada|suor}}, e o ar-condicionado tá ligado.',
        paciente: ['ODETE: Alô? {{Tô bem, {meu} {filho}, é ele que inventa|ta_bem}}.', 'ODETE: Ele inventa desde pequeno. [ela respira curto] ...Só uma azia. E um cansaço. {{E um enjoo que não passa|enjoo}}.'],
        sangramento: 'ARLINDO: Não.',
        seguranca: 'ARLINDO: Seguro. Só eu, ela e a moça que trabalha aqui.',
        referencia: 'ARLINDO: Rua dos Bem-te-vis, 610. A casa de esquina, da grade dourada. {m:O senhor|A senhora} já sabe.',
        fast: ['ARLINDO: Mãe, sorri. [pausa] Sorriu. Os dois lados.', 'ARLINDO: Levantou os braços. Falou a frase certinha. Ela tá brava comigo, isso tá normal.'],
      },
      extra: [
        {
          id: 'tom',
          label: '"Da outra vez o senhor exigiu a UTI móvel."',
          kind: 'fala',
          say: 'Vereador, da outra vez o senhor exigiu a UTI móvel.',
          a: ['ARLINDO: Exigi. Eu tava errado, ela tava bem.', 'ARLINDO: {{Hoje eu não tô exigindo nada, {dr}. Eu tô pedindo|pedindo}}.'],
        },
        { id: 'costas', label: 'Peso nas costas, no braço, no queixo?', say: 'Dona Odete, a senhora sente algum peso no braço, no queixo, nas costas?', a: 'ODETE: {{Um peso nas costas, aqui no meio|costas}}. É o colchão, {meu} {filho}. Colchão velho.' },
      ],
      links: [
        { a: 'suor', b: 'manual:atipico', insight: 'Idosa diabética, 82 anos, com "azia", enjoo, cansaço e suor frio no ar-condicionado: infarto atípico até prova em contrário. USA → Regional (Manual p.3).' },
        { a: 'ta_bem', b: 'suor', insight: '"Tô bem, é ele que inventa"... suando frio e enjoada. Da outra vez quem exagerava era ele. Hoje quem minimiza é ela.' },
        { a: 'azia', b: 'manual:atipico', insight: 'Mulher, idosa e diabética com "azia" que não passa: o infarto dela pode não doer no peito (Manual p.3).' },
        { a: 'pedindo', b: 'diz_nada', kind: 'confirma', insight: 'Da outra vez ele exigia e ameaçava. Hoje pede, com medo. O vereador mudou de tom porque a mãe mudou de cor.' },
      ],
      worsen: [{ after: 60, lines: ['ARLINDO: {Dr}! {{Ela ficou cinza, tá apagando no sofá!|cinza}}', '[alguém grita "Dona Odete!" ao fundo]'] }],
      patient: { name: 'Odete Matos', age: 82, sex: 'F' },
      truth: { dx: 'Infarto atípico (idosa diabética)', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 60, bad: 150 } },
      onResolve: (e, r) => {
        if (r.outcome === 'obito') e.set('odete_morreu');
        else e.set('odete_salva');
      },
      radio: {
        ok: '{central}, {unit}. Dona Odete: infarto de parede inferior, sem dor no peito. O vereador tá chorando no portão. Seguimos {dest}.',
        saved: '{central}, {unit}. Pegamos ela cinza, mas segurou. Infarto, sim. O vereador perguntou o nome do regulador. Eu falei. Achei que dessa vez podia.',
        dead: 'Central... {unit}. Óbito às {hora}. O vereador sentou no meio-fio. Não falou mais nada.',
        under: 'Central, {unit}! É infarto, a senhora tá chocando! Precisamos de USA!',
        dismissed: 'ARLINDO: {Dr}! Ela apagou no sofá! Vocês não iam mandar?! Eu PEDI dessa vez! Eu pedi!',
      },
      diary: {
        alive: 'Dona Odete, 82, mãe do vereador. "Tô bem, é ele que inventa." Era infarto. Viva.',
        dead: 'Dona Odete, 82, mãe do vereador. Da outra vez ele exagerou. Desta vez, não.',
      },
    }),
    // ----------------------------------------------------------------- 10
    call({
      id: 'd18_moto',
      ref: 'D18 #10',
      at: '17:00',
      pool: 'grave,trauma_moderado',
      num: '(17) 99655-2650',
      caller: 'Testemunha (motorista)',
      callerName: 'Motorista',
      type: 'testemunha',
      voice: 'homem',
      note: 'Moto embaixo de ônibus. Muito sangue.',
      noteWrong: 'Moto. Tá falando, parece leve.',
      addr: { rua: 'Av. Santos Dumont', n: 2650, bairro: 'Jardim Norte', ref: 'No ponto de ônibus em frente à farmácia.' },
      amb: ['buzinas', 'multidao', 'rua'],
      open: ['Um motoboy bateu na traseira do ônibus aqui na Santos Dumont! Ele {{tá sentado, falando|falando}}, mas a perna...', '[buzinas; muita gente; alguém gritando "não tira o capacete dele!"]'],
      q: {
        consciencia: 'Tá acordado, falando, mas meio {{lerdo. Repete a mesma pergunta|repete}}.',
        respira: 'Rápido. Ofegante.',
        sangramento: '{{Tá saindo muito sangue da coxa, empoçou no asfalto|sangue}}! O osso tá aparecendo!',
        idade: 'Uns vinte e cinco.',
        oque: 'Ele vinha costurando, o ônibus freou, ele entrou embaixo da traseira.',
        seguranca: 'O ônibus tá parado, o trânsito tá parado. Tá seguro.',
        historico: 'Não sei, {m:moço|moça}. Nunca vi ele.',
        paciente: ['JONATHAN: Que dia é hoje? ...Que dia é hoje? A minha moto...', 'JONATHAN: Que dia é hoje?'],
        inicio: 'Agora, uns cinco minutos.',
        referencia: 'Santos Dumont, 2650, no ponto de ônibus em frente à farmácia.',
      },
      extra: [{ id: 'cor', label: 'Como está a cor dele?', say: 'Como está a cor dele? Está suando?', a: '{{Branco, suando, a boca roxinha|branco}}.' }],
      links: [
        { a: 'sangue', b: 'branco', insight: 'Fratura exposta de coxa sangrando muito, pele branca e suor: choque hemorrágico. Vermelho → USA → Regional, compressão já.' },
        { a: 'repete', b: 'manual:vermelho', insight: 'Repete a mesma pergunta depois de trauma de alta energia: concussão com amnésia. Somado ao sangramento, é vermelho (Manual p.1).' },
        { a: 'falando', b: 'sangue', insight: '"Tá falando" não quer dizer "tá bem": a hemorragia da coxa mata em minutos, falando ou não.' },
      ],
      guide: { id: 'hemorragia' },
      patient: { name: 'Jonathan Alves', age: 26, sex: 'M' },
      truth: { dx: 'Fratura exposta de fêmur com choque hemorrágico', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 45, bad: 110, guideBonus: 15 } },
      radio: {
        ok: '{central}, {unit}. Fratura exposta de fêmur, torniquete, dois acessos. Seguimos {dest}. Chegamos a tempo.',
        saved: '{central}, {unit}. Quem orientou a compressão salvou a perna e o resto dele. Seguimos {dest}.',
        dead: 'Central... {unit}. Sangrou demais. Óbito às {hora}. Ele perguntava que dia era hoje.',
        under: 'Central, {unit}! Fratura exposta de fêmur com choque! Precisamos de USA!',
      },
      diary: {
        alive: 'Jonathan, 26, entregador. Entrou embaixo de um ônibus na Santos Dumont. Perguntava que dia era hoje.',
        dead: 'Jonathan, 26, entregador. Entrou embaixo de um ônibus na Santos Dumont. Perguntava que dia era hoje.',
      },
    }),
  ],
  interlude: {
    teaser: (c) => {
      if (c.flag('lucia_voltou')) return 'Tem uma mala azul na porta de casa.';
      if (c.flag('envelope_aceito')) return 'O seu nome está na página três. Em casa, todo mundo leu.';
      return 'A Gazeta está aberta em cima da mesa da cozinha.';
    },
    familyLacos: 1,
    onBico: fx.add('lacos', -1, 'longe no dia da matéria'),
    pre: chegadaD18,
    scene: casaD18,
    bico: bicoD18,
  },
});
