// =============================================================================
// DIA 17 — "Água" (Manual p.17: chuvas, ruas alagadas, Bombeiros obrigatório)
// Colheitas: 🌾 Simone (crise hipertensiva na própria central, 2h sem pré-triagem),
// 🌾 Rosângela (ajudante do ateliê), ↺ Cida (sinal 2: repete a mesma frase),
// ↺ Seu Hélio (D9), ↺ Nogueira (aluguel atrasado), ↺ Lúcia fora (D13–D17).
// Precisão da Simone: 50% enquanto presente (ela já está passando mal de manhã).
// =============================================================================
import type { CallRT, Ctx, EffCtx, SceneDef, DLine, Choice, HomeObject, LinkDef } from '../../engine/types';
import type { DeskDoc } from '../../engine/content-api';
import { hm } from '../../engine/util';
import { day, call, fx, is, NUM, ADDR } from '../dsl';
import { DAY as D16 } from './d16';

/** A ligação da Cida no dia 16 (sinal 1) só vira pista se o dia 16 a tiver com esse id. */
const TEM_D16_CIDA = D16.calls.some((x) => x.id === 'd16_cida');

const rtOf = (c: Ctx, defId: string): CallRT | undefined => (c.s.shift ? Object.values(c.s.shift.calls).find((x) => x.def === defId) : undefined);
const fora = (c: Ctx) => c.flag('lucia_fora') && !c.flag('lucia_foi_embora');
const zeliaViva = (c: Ctx) => c.s.family.zelia.status !== 'morto';

export const DOCS_EXTRA: Record<string, DeskDoc> = {
  boletim_chuva: {
    id: 'boletim_chuva',
    title: 'Boletim da Defesa Civil (segunda, 06:40)',
    text: 'DEFESA CIVIL DE SANTA AURORA — 06:40. Av. Beira-Rio INTERDITADA desde as 05:00, com água acima de um metro. Baixada da Vila Nova submersa abaixo da Rua São João. Av. Sul com lâmina d’água. Abrigos abertos: Igreja Batista Nova Aliança (Rua Bahia, 300) e Parque de Exposições.',
    until: 17,
    clues: [
      { id: 'doc:beira_rio', text: 'Defesa Civil: Av. Beira-Rio interditada desde as 05:00, água acima de 1 m' },
      { id: 'doc:baixada', text: 'Defesa Civil: baixada da Vila Nova submersa abaixo da Rua São João' },
    ],
  },
};

// -----------------------------------------------------------------------------
// Casa (interlúdio): goteiras, Nogueira, Rosângela, a casa vazia
// -----------------------------------------------------------------------------
function casaD17(c: Ctx): SceneDef {
  const luc = is.present('lucia')(c);
  const dav = is.present('davi')(c);
  const zel = zeliaViva(c);
  const ausentes = fora(c);
  const atrasos = c.s.bills.rentOverdue;
  const nogueira = atrasos > 0;
  const rosa = c.key('rosangela') === 'salvo' && c.flag('maquina') && luc && !c.flag('rosangela_ajudante');
  const bilhete = c.key('rosangela') === 'salvo' && c.flag('maquina') && !luc && ausentes && !c.flag('rosangela_ajudante');
  const depoisNogueira = rosa ? 'rosangela' : bilhete ? 'bilhete' : 'fim';
  const depoisCasa = nogueira ? 'nogueira' : depoisNogueira;

  const start: DLine[] = ausentes
    ? [
        { who: 'NARRADOR', t: 'A casa está escura. A goteira do quarto do Liam pinga bem em cima da cama dele, vazia, arrumada do jeito que ele deixou.' },
        { who: 'ZELIA', t: 'Pus o plástico da mudança em cima do colchão. {{Eu fiquei sentadinha o dia todo, não se preocupa|sentadinha}}.', when: () => zel },
        { who: 'NARRADOR', t: 'Ninguém pôs balde. A água fez uma poça no formato do tapete.', when: () => !zel },
      ]
    : !luc && !dav
      ? [
          { who: 'NARRADOR', t: 'A casa está quieta. Só a goteira fala.' },
          { who: 'ZELIA', t: 'Pus os baldes. Fiz sopa. A gente toma no prato fundo, que é pra não ter que lavar dois.', when: () => zel },
          { who: 'NARRADOR', t: 'Você põe uma panela embaixo da goteira e senta no chão da cozinha. O barulho da água faz companhia.', when: () => !zel },
        ]
      : [
          { who: 'NARRADOR', t: 'Tem balde na sala, panela no corredor e a forma de bolo em cima da cama do Liam. A casa inteira toca uma música de goteira.' },
          { who: 'DAVI', t: '{Pai}! A gente tá apostando: a da sala pinga mais rápido que a da cozinha!', when: () => dav },
          { who: 'ZELIA', t: 'A do meu quarto ganha de todas. Pinga bem em cima da santa.', when: () => zel },
          { who: 'LUCIA', t: 'Dezessete baldes de chuva e nenhum de dinheiro. Pelo menos a gente ri.', when: () => luc },
          { who: 'DAVI', t: '{{Os meus desenhos tão tudo bem, tá? Eu guardei|desenhos_ok}}.', when: () => dav },
        ];

  const objects: HomeObject[] = [
    { id: 'goteira', label: 'Goteira na viga da sala', desc: 'Pinga a cada dois segundos. A madeira da viga está escura e mole: infiltração antiga, de anos.', x: 148, y: 18, w: 22, h: 30 },
    { id: 'balde', label: 'Balde quase cheio', desc: 'O terceiro balde da noite. A borda tem marca de água velha, de outras chuvas.', x: 150, y: 122, w: 26, h: 26 },
  ];
  const links: LinkDef[] = [
    { a: 'goteira', b: 'balde', kind: 'confirma', insight: 'Viga podre e balde com marca de outras chuvas: essa goteira não é de hoje. O telhado está assim faz anos.', unlock: 'goteira_nogueira' },
  ];
  if (nogueira) links.push({ a: 'telhado_novo', b: 'goteira', insight: '"Reformei o telhado no ano passado." A gota cai no ombro da capa dele enquanto ele fala.', unlock: 'goteira_nogueira' });
  if (dav) {
    objects.push({ id: 'desenhos', label: 'Folhas no fundo do balde do quarto', desc: 'Os desenhos do Liam, empapados no fundo de um balde. A ambulância grande virou uma mancha azul.', x: 238, y: 120, w: 30, h: 24 });
    links.push({ a: 'desenhos_ok', b: 'desenhos', insight: '"Tão tudo bem, eu guardei." Ele guardou dentro do balde, pra você não ver que molhou.', unlock: 'desenhos_molhados' });
  }
  if (ausentes && zel) {
    objects.push({
      id: 'meia_mancha',
      label: 'A meia da Dona Zélia',
      desc: (cc) => (cc.flag('pe_ferida') ? 'Encharcada até o tornozelo, com uma mancha amarelada no lugar do curativo. Ela passou a tarde secando o chão.' : 'Encharcada até o tornozelo. Ela passou a tarde secando o chão.'),
      x: 70,
      y: 140,
      w: 20,
      h: 18,
    });
    links.push({ a: 'sentadinha', b: 'meia_mancha', insight: '"Fiquei sentadinha o dia todo." A meia está encharcada até o tornozelo. Ela passou o dia de rodo na mão.', unlock: 'zelia_meia' });
  }

  const fimChoices: Choice[] = [];
  if (dav) fimChoices.push({ label: 'Ver os desenhos com o Liam.', needLink: 'desenhos_molhados', next: 'desenhos', affectionate: true, effect: fx.add('lacos', 1, 'secou os desenhos do Liam') });
  if (ausentes && zel) {
    fimChoices.push({
      label: '"Mãe, a sua meia tá encharcada. Senta. Agora."',
      needLink: 'zelia_meia',
      next: 'meia',
      effect: (e) => {
        if (e.flag('pe_ferida')) e.s.family.zelia.risk = Math.max(0, e.s.family.zelia.risk - 1);
        e.add('lacos', 1, 'cuidou da Dona Zélia');
      },
    });
  }
  fimChoices.push({ label: 'Subir no telhado com a lanterna.', next: 'telhado', effect: fx.add('desgaste', 3, 'telhado na chuva') });
  fimChoices.push({ label: 'Ir dormir com o barulho da água.' });

  return {
    id: 'd17_goteiras',
    bg: 'sala',
    cast: [luc ? 'LUCIA' : '', dav ? 'DAVI' : '', zel ? 'ZELIA' : ''].filter(Boolean),
    nodes: {
      start: { lines: start, next: ausentes ? 'telefone' : depoisCasa },
      telefone: {
        lines: [
          { who: 'NARRADOR', t: 'O telefone toca. Número de Rio Claro.' },
          { who: 'LUCIA', t: '{nome}? Deu no jornal daqui que alagou aí. Vocês tão bem?' },
        ],
        choices: [
          { label: '"Tá chovendo dentro de casa, {c:Lú|Alex}. E tá tudo vazio."', next: 'tel_davi', affectionate: true, effect: fx.add('lacos', 1, 'disse que sente falta') },
          { label: '"Tá tudo bem. Fica aí o tempo que precisar."', next: 'tel_frio' },
          { label: '"Volta. Por favor."', next: 'tel_volta', effect: fx.add('lacos', 1, 'pediu pra eles voltarem') },
        ],
      },
      tel_davi: {
        lines: [
          { who: 'DAVI', t: '{Pai}! Aqui não tem goteira. Tem um cachorro chamado Pirata. Mas não tem você.' },
          { who: 'LUCIA', t: 'A gente volta amanhã. O Liam já arrumou a mochila duas vezes.' },
        ],
        next: depoisCasa,
      },
      tel_frio: {
        lines: [
          { who: 'LUCIA', t: '"Tá tudo bem." Você sempre fala isso, {nome}. Até quando não tá.' },
          { who: 'LUCIA', t: 'A gente volta amanhã. Pelo Liam.' },
        ],
        next: depoisCasa,
      },
      tel_volta: {
        lines: [
          { who: 'LUCIA', t: 'A gente volta amanhã. Não porque você pediu. Porque o Liam pediu primeiro.' },
          { who: 'LUCIA', t: '...Mas foi bom ouvir você pedir.' },
        ],
        next: depoisCasa,
      },
      nogueira: {
        lines: [
          { who: 'NARRADOR', t: 'Batem na porta. Seu Nogueira, de capa de chuva amarela e galocha até o joelho.' },
          c.flag('brigou_nogueira')
            ? { who: 'NOGUEIRA', t: 'Boa noite. E não me venha de novo com conta de água de inquilino antigo, {dr}.' }
            : { who: 'NOGUEIRA', t: 'Boa noite, {dr}. Desculpa a hora. Com essa chuva, a gente só acha as pessoas em casa.' },
          { who: 'NOGUEIRA', t: `Vim pelo atrasado. ${atrasos > 1 ? `São ${atrasos} meses` : 'É um mês'}. Eu também tenho conta pra pagar.` },
          { who: 'NOGUEIRA', t: '{{Essa casa é seca que nem deserto. Eu reformei o telhado no ano passado|telhado_novo}}.' },
          { who: 'NARRADOR', t: 'Uma gota cai da viga e acerta o ombro da capa dele. Ele finge que não viu.' },
        ],
        choices: [
          {
            label: 'Mostrar as goteiras: "O telhado é responsabilidade do senhor."',
            needLink: 'goteira_nogueira',
            next: 'nog_abate',
            effect: (e) => {
              e.s.bills.rentDebt = Math.max(0, e.s.bills.rentDebt - 50);
              e.set('nogueira_abateu');
            },
          },
          { label: '"Eu pago hoje, Seu Nogueira."', next: 'nog_paga' },
          { label: '"Me dá mais uma semana."', next: 'nog_semana' },
        ],
      },
      nog_abate: {
        lines: [
          { who: 'NOGUEIRA', t: '(ele olha a viga, o balde, a viga de novo) ...Tá. Tá bom!' },
          { who: 'NOGUEIRA', t: 'Abato cinquenta do atrasado pelo telhado. E mando o Zé da telha na semana que vem. Mas o resto é hoje, {dr}. Hoje.' },
        ],
        next: depoisNogueira,
      },
      nog_paga: {
        lines: [{ who: 'NOGUEIRA', t: 'Promessa não molha nem seca, {dr}. Eu espero o dinheiro, não a promessa.' }],
        next: depoisNogueira,
      },
      nog_semana: {
        lines: [
          c.flag('brigou_nogueira')
            ? { who: 'NOGUEIRA', t: 'Semana? {m:Pro senhor|Pra senhora}? Três atrasos e eu chamo o caminhão. Eu avisei no primeiro dia.' }
            : { who: 'NOGUEIRA', t: 'Uma semana. Por causa do menino. Nem um dia a mais.' },
        ],
        next: depoisNogueira,
      },
      rosangela: {
        lines: [
          { who: 'NARRADOR', t: 'Na mesa da máquina de costura, uma mulher que você não conhece corta um molde com a tesoura grande {doconj}.' },
          { who: 'LUCIA', t: '{nome}, essa é a Rosângela. Vai me ajudar no ateliê, meio período. Eu pago do que entrar. Já decidi.' },
          { who: 'ROSANGELA', t: 'Boa noite, {dr}.' },
          { who: 'NARRADOR', t: 'Ela para a tesoura no meio do pano.' },
          { who: 'ROSANGELA', t: 'Essa voz... Desculpa. É que eu já ouvi essa voz. Num telefone. Eu pedi uma pizza de calabresa.' },
          { who: 'NARRADOR', t: 'Ela não termina a frase. Não precisa.' },
          { who: 'ROSANGELA', t: 'Eu não sabia o seu nome. Só sabia a voz.' },
        ],
        onEnter: fx.set('rosangela_ajudante'),
        choices: [
          { label: '"Que bom que você tá aqui."', next: 'fim', affectionate: true, effect: fx.add('humanidade', 1, 'a Rosângela reconheceu sua voz') },
          { label: '(Acenar com a cabeça e ir lavar as mãos.)', next: 'fim' },
        ],
      },
      bilhete: {
        lines: [
          { who: 'NARRADOR', t: 'Embaixo da porta, um bilhete molhado, letra caprichada:' },
          { who: 'NARRADOR', t: '"{c:Dona|Seu} {conj}, passei pra falar do serviço do ateliê. Volto quando {c:a senhora|o senhor} voltar. Rosângela (Rua Ipê)."' },
        ],
        onEnter: fx.set('rosangela_bilhete'),
        next: 'fim',
      },
      fim: {
        lines: [
          { who: 'NARRADOR', t: 'Vocês jantam com os pés em cima das cadeiras, por causa da poça. O Liam acha isso a melhor coisa do mês.', when: () => luc && dav },
          { who: 'NARRADOR', t: 'Você e a Dona Zélia jantam em silêncio. A goteira do quarto do Liam marca o tempo.', when: () => !luc && zel },
          { who: 'NARRADOR', t: 'Você esquenta um resto de arroz. A goteira marca o tempo.', when: () => !luc && !zel },
        ],
        choices: fimChoices,
      },
      desenhos: {
        lines: [
          { who: 'DAVI', t: '...Molhou. O da ambulância grande borrou todinho.' },
          { who: 'EU', t: 'Vem. A gente seca no ferro de passar.' },
          { who: 'NARRADOR', t: 'Cheiro de papel quente. O azul da sirene escorreu e virou céu. O Liam decide que ficou mais bonito assim.' },
        ],
      },
      meia: {
        lines: [
          { who: 'ZELIA', t: '...Eu sequei o chão. Alguém tinha que secar, {filho}.' },
          { who: 'NARRADOR', t: 'Por baixo da meia, o curativo do pé está empapado. Você troca com as mãos de quem faz isso o dia inteiro pelo telefone e nunca de perto.', when: (cc) => cc.flag('pe_ferida') },
          { who: 'NARRADOR', t: 'Você enxuga os pés dela com a toalha boa. Ela reclama do desperdício.', when: (cc) => !cc.flag('pe_ferida') },
        ],
      },
      telhado: {
        lines: [
          { who: 'NARRADOR', t: 'Você sobe a escada com a lanterna na boca e empurra uma telha de volta pro lugar.' },
          { who: 'NARRADOR', t: 'Lá de cima, Santa Aurora está apagada em manchas: onde a luz caiu, onde a água subiu. Em algum lugar, uma sirene.' },
          { who: 'NARRADOR', t: 'Você fica contando quanto tempo ela demora pra chegar.' },
        ],
      },
    },
    inspect: { objects, links },
  };
}

function bicoD17(c: Ctx): SceneDef {
  const luc = is.present('lucia')(c);
  const zel = zeliaViva(c);
  const nogueira = c.s.bills.rentOverdue > 0;
  const rosa = c.key('rosangela') === 'salvo' && c.flag('maquina') && luc && !c.flag('rosangela_ajudante');
  const lines: DLine[] = [
    { who: 'NARRADOR', t: 'A noite na USA 01 é água até o joelho: corte de vidro, febre, uma senhora que perdeu a dentadura na enchente e quer saber se "a gente acha".' },
    { who: 'NARRADOR', t: 'Você chega em casa às duas da manhã. Tem uma lona azul amarrada no telhado com corda de varal.', when: () => luc },
    { who: 'NARRADOR', t: 'Você chega em casa às duas da manhã. Os baldes transbordaram.', when: () => !luc },
  ];
  if (nogueira && luc) lines.push({ who: 'LUCIA', t: '(bilhete na geladeira) "O Nogueira veio. Mostrei a viga podre pra ele. Abateu cinquenta. O resto eu disse que você paga."' });
  else if (nogueira && zel) lines.push({ who: 'ZELIA', t: '(bilhete na geladeira) "O Nogueira veio cobrar. Eu disse umas verdades pra ele. Ele disse outras."' });
  if (rosa) {
    lines.push({ who: 'NARRADOR', t: 'Na mesa da máquina, um molde cortado com um capricho que não é {doconj}.' });
    lines.push({ who: 'LUCIA', t: '(outro bilhete) "Contratei a Rosângela. Ela perguntou de você. Disse que conhece a sua voz."' });
  }
  if (fora(c) && zel) lines.push({ who: 'ZELIA', t: '(bilhete na mesa) "{Oconj} ligou. Eles voltam amanhã. {c:Ela|Ele} perguntou se você tava em casa. Eu disse que não."' });
  return {
    id: 'd17_bico',
    bg: 'preto',
    nodes: {
      start: {
        lines,
        onEnter: (e) => {
          if (nogueira && is.present('lucia')(e)) {
            e.s.bills.rentDebt = Math.max(0, e.s.bills.rentDebt - 50);
            e.set('nogueira_abateu');
          }
          if (rosa) e.set('rosangela_ajudante');
        },
      },
    },
  };
}

// -----------------------------------------------------------------------------
export const DAY = day({
  day: 17,
  title: 'Água',
  weekday: 'Segunda-feira',
  weather: 'Temporal. 112 mm em seis horas. O Rio Aurora saiu da calha.',
  flood: true,
  simoneAccuracy: 0.5,
  goal: { maxUSA: 3, bonus: 30 },
  onStart: fx.doc('boletim_chuva'),
  newspaper: (c) => {
    const stories: { title: string; text: string }[] = [];
    const jairo = c.key('jairo');
    if (jairo === 'salvo') stories.push({ title: 'Neto adolescente salva o avô', text: 'Seu Jairo, da Jairo Refrigeração, caiu no banheiro de casa e foi socorrido a tempo. "Ele ligou chorando, e acreditaram nele", conta uma vizinha.' });
    else if (jairo === 'perdido') stories.push({ title: 'Morre Seu Jairo, da refrigeração', text: 'Jairo Bento Lima foi encontrado no banheiro de casa, no Jardim Primavera. O neto adolescente tinha ligado para a emergência. "Ele consertava a geladeira de meio bairro", diz a vizinha.' });
    const osv = c.key('osvaldo');
    if (osv === 'salvo') stories.push({ title: 'Pai do coordenador da Regulação se recupera', text: 'Osvaldo Peixoto, 84, segue internado no Regional com pneumonia, fora de perigo. O filho, coordenador da Central de Regulação, não quis dar entrevista.' });
    else if (osv === 'perdido') stories.push({ title: 'Morre o pai do coordenador da Regulação', text: 'Osvaldo Peixoto, 84, morreu no fim de semana, de pneumonia. Morava sozinho na Bela Vista. "Nunca precisou de ambulância", dizia o filho.' });
    stories.push({ title: 'Saúde+ Gestão: "frota preparada para as chuvas"', text: 'A OS garante que as duas USA da cidade "dão conta do temporal". A Defesa Civil contabiliza 41 pontos de alagamento.' });
    return {
      headline: 'Temporal histórico: Rio Aurora transborda e alaga a Vila Nova',
      sub: 'Defesa Civil interdita a Av. Beira-Rio e pede que moradores da baixada procurem abrigo. A chuva deve seguir até o fim da tarde.',
      photo: 'enchente',
      stories,
      notice: 'Manual p.17 (Chuvas): ruas alagadas no mapa. Resgate, ilhados, afogamento, desabamento e choque elétrico em área alagada: Bombeiros obrigatório.',
      ad: 'Lona preta, balde e rodo na Casa do Construtor Aurora. "A gente entrega quando a rua deixar."',
      weather: 'Temporal · 21 °C',
    };
  },
  handover: (c) => ({
    id: 'd17_passagem',
    bg: 'central',
    nodes: {
      start: {
        lines: [
          { who: 'NARRADOR', t: '07:00. A chuva bate de lado no vidro da central. O balde embaixo do ar-condicionado já não dá conta: alguém pôs um segundo balde do lado do primeiro.' },
          ...(c.flag('denunciou_henrique')
            ? [
                { who: 'PAULA', t: 'Paula, do noturno. Noite horrível: três famílias ilhadas na Vila Nova, os Bombeiros com tudo na rua.' },
                { who: 'PAULA', t: 'A Beira-Rio fechou às cinco. Esquece a baixada: viatura que entra lá não sai.' },
              ]
            : [
                { who: 'HENRIQUE', t: 'Noite... comprida. A Beira-Rio fechou às cinco. Os Bombeiros tão com tudo na rua.' },
                { who: 'NARRADOR', t: 'O cheiro de menta chega antes dele. Hoje, a outra coisa por baixo chega junto.' },
                { who: 'HENRIQUE', t: 'Não me olha assim, {nome}. Choveu a noite inteira. Eu fiquei acordado a noite inteira. Só isso.' },
              ]),
          { who: 'NARRADOR', t: '07:12. A Simone entra pingando, o guarda-chuva virado do avesso, os sapatos na mão.' },
          { who: 'SIMONE', t: 'O ônibus parou na Santos Dumont. Vim a pé. Não me olha assim também, {dr}.' },
          { who: 'NARRADOR', t: 'Ela senta, liga o fone e aperta a têmpora com dois dedos, devagar, como quem aperta uma campainha que não toca.' },
        ],
        choices: [
          { label: '"Simone, você tá bem? Mediu a pressão?"', next: 'pressao', effect: fx.set('d17_simone_perguntada') },
          { label: '"Bora. Hoje vai ser longo."', next: 'fim' },
        ],
      },
      pressao: {
        lines: [
          { who: 'SIMONE', t: 'Medir pra quê? Pra ver o número e ficar nervosa? É dor de cabeça, {dr}. Desde ontem. Passa.' },
          { who: 'NARRADOR', t: 'Ela demora um segundo a mais pra achar a tecla do fone.' },
          { who: 'SIMONE', t: '...Passa.' },
        ],
        next: 'fim',
      },
      fim: { lines: [{ who: 'SIMONE', t: 'Se o post-it sair torto hoje, a culpa é da chuva.' }] },
    },
  }),
  timeline: [
    { at: '07:00', kind: 'script', id: 'base_alagada', run: (c) => c.setUnit('USB01', 'FORA', hm('10:40'), 'Base alagada') },
    { at: '07:01', kind: 'radio', who: 'USB 01 · JOANA', text: 'Central, USB 01. A garagem da base Vila Esperança encheu, a água tá no meio da roda. Sem condição de sair até baixar. Previsão: dez e meia, onze.' },
    { at: '07:02', kind: 'radio', who: 'DEFESA CIVIL', text: 'Av. Beira-Rio interditada desde as 05:00. Baixada da Vila Nova submersa. Av. Sul com lâmina d’água. Rotas recalculadas no mapa.' },
    { at: '07:03', kind: 'radio', who: 'COPOM/193', text: 'Bombeiros: todas as equipes de resgate empenhadas. Acionamento pela central, com risco de vida ou de desabamento.' },
    { at: '11:00', kind: 'simone', who: 'SIMONE', text: 'Desculpa, {dr}. Tô trocando as bolas hoje. Se o post-it vier esquisito, confia no seu ouvido, não na minha letra.' },
    { at: '12:45', kind: 'simone', who: 'SIMONE', text: '(a letra sai torta, grande demais, atravessando o papel) Vou lavar o rosto. Já volto.' },
    {
      at: '13:00',
      kind: 'script',
      id: 'simone_sai',
      run: (c) => {
        c.shift.simoneAway = true;
        c.radio('SISTEMA', 'Posto da TARM vazio. As ligações chegam sem pré-triagem.', 'alerta');
      },
    },
    {
      at: '13:45',
      kind: 'script',
      id: 'peixoto_simone',
      run: (c) => {
        const s = c.callStatus('d17_simone');
        if (s && s.status === 'fila' && s.answered === undefined) {
          s.status = 'desligou';
          s.closed = c.now;
          s.outcome = 'piorou';
          s.resultText = 'Ninguém regulou. O Peixoto levou a Simone de carro até a UPA.';
          c.set('d17_simone_dispensada');
          c.add('lealSimone', -2, 'ninguém regulou a Simone');
          c.modal('DR. PEIXOTO', 'Eu desci e a Simone tava com a cabeça em cima da mesa, {dr}. Quarenta e cinco minutos. Ninguém regulou. Tô levando ela no meu carro.', 'interfone');
        } else if (c.flag('d17_simone_dispensada')) {
          c.modal('DR. PEIXOTO', 'Orientação? Pra Simone? Com a pressão dela? ...Eu levo ela no meu carro, {dr}. Depois a gente conversa.', 'interfone');
        } else {
          c.modal('DR. PEIXOTO', 'Fiquei sabendo da Simone. Não tenho TARM pra cobrir até as três. Segura a central sozinh{m:o|a}, {dr}. Eu sei. Eu sei.', 'interfone');
        }
      },
    },
    {
      at: '15:00',
      kind: 'script',
      id: 'rose',
      run: (c) => {
        c.shift.simoneAway = false;
        c.modal('ROSE (RH)', 'Oi, {dr}. Rose, do RH. O Peixoto mandou eu cobrir a Simone até as sete. Eu nunca anotei ligação na vida. Vou escrever o que eu entender, tá?', 'simone');
      },
    },
    {
      at: '15:10',
      kind: 'script',
      id: 'simone_upa',
      run: (c) => {
        if (c.flag('d17_simone_usa')) c.modal('SIMONE (MENSAGEM)', 'Do celular da Simone: "Tô na UPA. Dezesseis por dez. Vieram me buscar de USA, {dr}. De USA. Tinha criança na água. Obrigada. Mas depois a gente conversa."', 'simone');
        else if (c.flag('simone_crise_ok')) c.modal('SIMONE (MENSAGEM)', 'Do celular da Simone: "Tô na UPA. Baixou pra dezesseis por dez. Vão me segurar até a noite. Você fez certinho: USB, sentada, sem sirene. Não deixa a Rose triar dor no peito."', 'simone');
        else if (c.flag('d17_simone_dispensada')) c.modal('SIMONE (MENSAGEM)', 'Do celular da Simone: "Tô na UPA. O Peixoto me trouxe. Ele dirige muito mal."', 'simone');
      },
    },
    { at: '17:00', kind: 'radio', who: 'DEFESA CIVIL', text: 'O Rio Aurora começou a baixar. Av. Sul liberada em meia pista. A Beira-Rio segue interditada.' },
    { at: '18:40', kind: 'radio', who: 'USA 01 · BENÉ', text: 'Central, USA 01 recolhendo. Trinta e um anos de volante e eu nunca tinha visto a Vila Nova assim. Vai com cuidado pra casa, {bene}.' },
  ],
  calls: [
    // ----------------------------------------------------------------- 1
    call({
      id: 'd17_telhado',
      ref: 'D17 #1',
      at: '07:10',
      pool: 'grave,cardio',
      num: '(17) 99714-2650',
      caller: 'Leandro (filho)',
      callerName: 'Leandro',
      type: 'comum',
      voice: 'jovem_h',
      note: 'Família ilhada no telhado. Senhor com dor no peito.',
      noteWrong: 'Família no telhado. Querem resgate, ninguém ferido.',
      addr: { rua: 'Av. Beira-Rio', n: 2650, bairro: 'Vila Nova', ref: 'Casa de dois andares com caixa-d’água azul, perto da ponte velha.' },
      amb: ['chuva', 'vento', 'agua'],
      open: [
        'Alô! Alô! A gente tá {{em cima do telhado|telhado}}, a água subiu de madrugada! Eu, minha mulher, minhas duas filhas e o meu pai!',
        '[vento forte; chuva batendo em telha; uma criança chorando perto do telefone]',
        'E o meu pai tá com {{uma dor no peito|dor_peito}} desde que subiu a escada. {{A bateria tá em seis por cento|bateria}}, {m:moço|moça}!',
      ],
      q: {
        oque: 'A água entrou às quatro. A gente foi subindo: cama, armário, laje. Agora é o telhado. {{A água tá no meio da janela de cima|nivel}}.',
        consciencia: 'Acordado, conversando. Mas tá quieto, sentado na telha, segurando o peito.',
        respira: 'Respira, mas curtinho. Diz que falta o ar quando a dor aperta.',
        idade: 'Setenta e um.',
        inicio: 'Desde que subiu, umas seis e meia. Faz uns quarenta minutos.',
        sangramento: 'Ninguém se cortou não. Só o susto.',
        historico: '{{Pressão e diabetes|diabetes}}. Os remédios ficaram lá embaixo, debaixo d’água.',
        dorpeito: '{{Diz que aperta e vai pro queixo e pro braço|irradia}}. E tá {{suando frio|suor}}, mesmo com essa chuva gelada. A testa dele pinga suor, não é chuva: eu passei a mão.',
        paciente: ['LEANDRO: Pai, fala com {o} {medico}.', 'SEBASTIÃO: [ofegante] É um peso... aqui no meio. Igual um saco de cimento. Não é nada não, é o frio.'],
        seguranca: 'Seguro não tá, {m:moço|moça}! A água tá subindo e a correnteza tá arrastando carro na avenida!',
        referencia: 'Av. Beira-Rio, 2650, perto da ponte velha. A casa de dois andares com a caixa-d’água azul. É a única com gente em cima.',
      },
      extra: [
        { id: 'quantos', label: 'Quantas pessoas no telhado?', say: 'Quantas pessoas estão no telhado? Tem criança?', a: 'Cinco. Eu, a Kátia, a Yasmin de nove, a Sofia de cinco e o meu pai. A pequena tá no meu colo.' },
        {
          id: 'poupar',
          label: 'Poupar a bateria',
          kind: 'fala',
          cost: 4,
          say: 'Leandro, apaga a tela do celular e só liga de novo se ele piorar. A ajuda tá indo.',
          a: 'Tá... tá bom. Não demora, {m:moço|moça}. Por favor não demora.',
          onAsk: fx.set('d17_telhado_bateria'),
        },
      ],
      links: [
        { a: 'irradia', b: 'manual:peito', insight: 'Homem de 71 anos, dor em aperto que vai para o queixo e o braço, suor frio: provável infarto. Vermelho → USA (Manual p.3).' },
        { a: 'suor', b: 'manual:atipico', insight: 'Diabético e idoso, suando frio debaixo de chuva gelada: o suor não é do frio. Infarto até prova em contrário (Manual p.3).' },
        { a: 'telhado', b: 'manual:bombeiros', insight: 'Família ilhada no telhado, água subindo, correnteza na avenida: a USA não chega sem bote. Bombeiros obrigatório (Manual p.17).' },
      ],
      worsen: [{ after: 95, lines: ['LEANDRO: {m:Moço|Moça}! {{Meu pai deitou na telha, tá cinza!|cinza}} Ele não quer mais falar!', '[o choro da criança mais alto]'] }],
      patient: { name: 'Sebastião Souza', age: 71, sex: 'M' },
      truth: { dx: 'Infarto em idoso ilhado pela enchente', sev: 'vermelho', ok: ['USA'], sup: ['BOMB'], dest: ['REG'], risk: { good: 60, bad: 150 } },
      radio: {
        ok: '{central}, {unit} na cabeceira da ponte velha. Os Bombeiros desceram o senhor do telhado no bote, deitado na prancha. Supra no eletro. A família vem no segundo bote. Seguimos {dest}.',
        unsafe: 'Central, {unit} na Beira-Rio! A água tá na altura do peito, a correnteza levou um carro na nossa frente! Sem bote a gente não chega no telhado. Cadê os Bombeiros?!',
        dead: 'Central... {unit}. Os Bombeiros trouxeram ele no bote, mas chegou parado. Óbito às {hora}. A família ainda tá no telhado.',
        under: '{unit}: senhor com dor torácica típica, suando frio, ilhado. É infarto, precisamos de USA!',
      },
      diary: {
        alive: 'Seu Sebastião, 71. Infarto em cima do telhado, na Beira-Rio. Desceu de bote. A neta de cinco anos dormiu no colo do bombeiro.',
        dead: 'Seu Sebastião, 71. Infarto em cima do telhado, na Beira-Rio, com a família em volta e a água subindo.',
      },
    }),
    // ----------------------------------------------------------------- 2 ★ CIDA (sinal 2)
    call({
      id: 'd17_cida',
      ref: 'D17 #2 ★',
      at: '08:15',
      anchor: true,
      num: NUM.cida,
      caller: 'Dona Cida',
      callerName: 'Dona Cida',
      type: 'frequentador',
      voice: 'cida',
      note: 'Dona Cida. Diz que tá entrando água.',
      noteFixed: true,
      addr: ADDR.cida,
      amb: ['chuva', 'agua', 'tv'],
      open: [
        'Oi, {meu} {filho}, é a Cida. {{A água tá entrando em casa.|agua1}}',
        '[chuva grossa no telhado; uma goteira estala dentro de uma panela; a TV chiando, fora do ar]',
        'Tá vindo por baixo da porta da cozinha. Eu pus o pano de chão, pus o tapete, não adianta.',
        { t: '{{A água tá entrando em casa.|agua2}}', style: 'calma' },
      ],
      q: {
        oque: 'A chuva, {meu} {filho}. A rua virou um rio e a água achou a minha cozinha.',
        consciencia: 'Acordada, acordada. Não dormi nada com esse barulho.',
        respira: 'Respiro. Só o coração que tá disparado de susto.',
        idade: 'Setenta e nove, {meu} {filho}. Você sabe.',
        inicio: 'Começou a entrar faz uma meia hora. Tá subindo devagarinho.',
        historico: 'Pressão. O remédio tá em cima da geladeira, lá a água não chega.',
        paciente: 'Sou eu mesma.',
        sangramento: 'Não, nada disso.',
        seguranca: '{{Tô sozinha com o gato|sozinha}}, nós dois em cima da cadeira. Ele odeia água.',
        referencia: 'Casa amarela do portão verde, do lado da igreja de São Benedito. A rua tá que é um rio.',
        fast: ['Ai, esse teste! [ela ri] Sorri. Levantei os dois braços.', '"O céu é azul." Hoje tá cinza, né, {meu} {filho}?'],
        dorpeito: 'Dor no peito, não. Só susto.',
      },
      extra: [
        {
          id: 'nivel',
          label: 'Até onde a água chegou?',
          say: 'Até onde a água chegou, Dona Cida? Tem tomada perto do chão?',
          a: 'Tá na canela. No pé da geladeira. {{E a tomada da cozinha é baixinha, {meu} {filho}, tô com medo dela|tomada}}.',
        },
        {
          id: 'luz',
          label: 'Orientar: desligar a chave de luz',
          kind: 'fala',
          cost: 5,
          // Conferido (campo A11: nenhuma página de campo trata choque elétrico; desligar a chave geral sem pisar na água,
          // e só se der, é conselho seguro de cena, como os riscos elétricos do PE1).
          say: 'Dona Cida, a senhora consegue desligar a chave geral sem pisar na água? Se não der, não vai. Fica em cima da cadeira.',
          a: ['A caixinha de luz é no corredor, lá tá seco... [passos; um estalo]', 'Desliguei! Ficou escuro. Mas a TV já tinha ido embora mesmo.'],
          onAsk: fx.set('d17_cida_luz'),
        },
        {
          id: 'repetiu',
          label: '"A senhora já tinha me falado da água..."',
          kind: 'fala',
          locked: true,
          // 1.1: ela repetiu a frase na abertura; aparece depois da primeira troca com ela
          unlockedBy: ['oque', 'nivel', 'consciencia', 'conversar', 'seguranca'],
          say: 'Dona Cida, a senhora já tinha me falado da água. Tá tudo bem com a senhora?',
          a: ['Falei? [silêncio curto] ...Falei, né.', 'Desculpa, {meu} {filho}. É o nervoso. Quando eu fico nervosa eu fico boba.'],
          onAsk: (e) => {
            e.set('cida_sinal2');
            // sábado ela esqueceu a novela; hoje repetiu a frase: dois sinais, um atrás do outro
            if (e.flag('cida_sinal1')) e.set('cida_sinais_cruzados');
          },
        },
        {
          id: 'conversar',
          label: 'Conversar um pouco com ela',
          kind: 'fala',
          cost: 15,
          say: 'E a novela, Dona Cida? Deu pra ver ontem, com essa chuva?',
          a: [
            'Ah, deu! A luz piscou bem na hora do beijo, acredita? [ri]',
            'É aquela... a das seis... {{como é o nome mesmo? Amor de... de... ah, você sabe qual é|nome_novela}}.',
            'Desculpa tomar seu tempo com água, {meu} {filho}. É que de manhã a sua é a única voz.',
          ],
          onAsk: fx.all(fx.add('humanidade', 1, 'conversou com a Dona Cida'), fx.set('cida_conversou_d17')),
        },
      ],
      links: [
        {
          a: 'agua1',
          b: 'agua2',
          insight: 'Ela disse a mesma frase duas vezes, palavra por palavra, como se fosse a primeira. A Dona Cida de sempre não se repete: ela conta novela.',
          unlock: 'repetiu',
          onFind: fx.set('cida_sinal2'),
        },
        { a: 'sozinha', b: 'manual:bombeiros', insight: '79 anos, sozinha, água entrando em casa: o risco não é clínico, é a casa. Bombeiros obrigatório (Manual p.17). Clinicamente, ela está bem.' },
        { a: 'tomada', b: 'manual:bombeiros', insight: 'Água no pé da geladeira e tomada baixa: risco de choque numa casa alagando. Bombeiros (Manual p.17).' },
        ...(TEM_D16_CIDA
          ? [
              {
                a: 'nome_novela',
                b: 'diario:d16_cida',
                insight: 'No sábado ela não lembrou o nome da novela. Hoje, de novo. E repetiu a mesma frase duas vezes. Dois sinais pequenos, um atrás do outro.',
                onFind: fx.all(fx.set('cida_sinal2'), fx.set('cida_sinais_cruzados')),
              },
            ]
          : []),
      ],
      onAnswer: fx.set('cida_ligou_d17'),
      onStamp: (e) => {
        if (rtOf(e, 'd17_cida')?.decision?.support.includes('BOMB')) e.set('d17_cida_bombeiros');
      },
      patient: { name: 'Aparecida (Dona Cida)', age: 79, sex: 'F' },
      truth: { dx: 'Casa alagando: idosa sozinha, sem lesão', sev: 'verde', ok: ['ORI', 'USB'], sup: ['BOMB'], dest: ['UPA'], ref: ['CASA'] },
      radio: {
        ok: 'Central, {unit} com os Bombeiros na Rua Pitangueira. A Dona Cida saiu no colo do bombeiro, com o gato no colo dela. Pressão boa, sem ferimento. A vizinha da frente vai ficar com os dois.',
        unsafe: '{unit} na Pitangueira: a água tá no joelho dentro da casa e a tomada da cozinha faiscou. Sem Bombeiros a gente não entra.',
      },
      diary: {
        ori: (c) => {
          const bomb = !!rtOf(c, 'd17_cida')?.decision?.support.includes('BOMB');
          return `A água entrando em casa, sozinha com o gato. Disse "a água tá entrando em casa" duas vezes seguidas, igualzinho.${bomb ? ' Os Bombeiros tiraram os dois de bote.' : ' Ficou em cima de uma cadeira até a água baixar.'}`;
        },
        alive: 'A água entrando em casa, sozinha com o gato. Disse "a água tá entrando em casa" duas vezes seguidas, igualzinho. Saiu no colo do bombeiro.',
      },
    }),
    // ----------------------------------------------------------------- 3
    call({
      id: 'd17_crianca',
      ref: 'D17 #3',
      at: '09:10',
      pool: 'grave,pediatria',
      num: '(17) 99577-0850',
      caller: 'Fábio (tio)',
      callerName: 'Fábio',
      type: 'testemunha',
      voice: 'homem',
      note: 'Criança tirada da enxurrada. Não acorda.',
      noteWrong: 'Criança caiu na enxurrada. Já tiraram, tá bem.',
      addr: { rua: 'Rua Sabiá', n: 850, bairro: 'Vila Esperança', ref: 'Na ponte do córrego, perto da escola Monteiro Lobato.' },
      amb: ['chuva', 'gritos', 'agua'],
      open: [
        'Socorro! O menino foi arrastado pela enxurrada, eu puxei ele do córrego, {{ele não acorda|nao_acorda}}!',
        '[chuva; gente gritando; uma mulher chorando alto: "LUAN! LUAN!"]',
      ],
      q: {
        respira: '{{Saiu água pela boca e ele deu um suspiro... um só|suspiro}}. Agora tá parado. Isso é respirar?',
        consciencia: 'Não! Chamei, belisquei, nada!',
        idade: 'Sete anos. É meu sobrinho.',
        inicio: 'Agora! Ele tava brincando na enxurrada com os primos, a correnteza levou. Uns dois minutos debaixo d’água.',
        oque: 'A escola fechou por causa da chuva, os meninos foram brincar na água da rua. O córrego pegou ele.',
        sangramento: 'Ralou a cabeça numa pedra. Pouquinho.',
        historico: 'Nada, menino saudável.',
        seguranca: 'A gente tá na calçada. {{Mas a correnteza ainda tá forte no córrego, levou a bicicleta dele agora|correnteza}}.',
        referencia: 'Rua Sabiá, 850, na ponte do córrego, perto da escola Monteiro Lobato.',
        paciente: 'Ele não fala, {dr}! Ele não fala!',
      },
      extra: [{ id: 'cor', label: 'Cor dos lábios?', say: 'Como estão os lábios dele? E a pele?', a: '{{Roxinhos. E a pele gelada|roxo}}.' }],
      links: [
        { a: 'suspiro', b: 'manual:parada', insight: 'Um suspiro só, em quem não responde: respiração agônica. PARADA. USA + RCP guiada já (Manual p.1).' },
        { a: 'nao_acorda', b: 'manual:parada', insight: 'Não acorda e não respira normalmente depois de afogamento: parada até prova em contrário (Manual p.1).' },
        { a: 'correnteza', b: 'manual:bombeiros', insight: 'Afogamento com a correnteza ainda ativa: Bombeiros obrigatório (Manual p.17).' },
      ],
      worsen: [{ after: 18, lines: ['FÁBIO: Ele tá ficando mais roxo, {dr}! O que eu faço?! Fala o que eu faço!'] }],
      guide: { id: 'rcp' },
      patient: { name: 'Luan Cardoso', age: 7, sex: 'M' },
      // [validar] Campo A9 (BPed26/APed33): no afogamento da criança, A-B-C, via aérea e ventilação primeiro. O roteiro
      // "rcp" do jogo é só compressões, e "boca a boca" para leigo não consta em nenhuma página. Equipe: na criança
      // afogada, o telefone deve orientar ventilações de resgate antes das compressões?
      truth: { dx: 'Parada por afogamento (criança)', sev: 'vermelho', ok: ['USA'], sup: ['BOMB'], dest: ['REG'], risk: { good: 30, bad: 75, guideBonus: 28 } },
      radio: {
        saved: '{central}, {unit}. O menino voltou! Tossiu água, chorou, tá chamando a mãe. Quem tava contando no telefone com o tio? Contou bonito.',
        ok: '{central}, {unit}. Criança reanimada, respirando, levando pro {dest}. Os Bombeiros seguraram a correnteza com corda.',
        dead: 'Central... {unit}. Fizemos quarenta minutos. Óbito às {hora}. (pausa) A mãe tá aqui do lado. Desculpa, {dr}.',
        unsafe: 'Central, {unit}! A correnteza tá levando a calçada! Sem os Bombeiros a gente não desce até ele!',
        under: 'Central, {unit}! Criança em parada, afogamento! Precisamos de USA!',
      },
      diary: {
        alive: 'Luan, 7. Arrastado pela enxurrada na Rua Sabiá. Voltou com RCP. O tio contou as compressões em voz alta, chorando.',
        dead: 'Luan, 7. Arrastado pela enxurrada na Rua Sabiá. Dois minutos debaixo d’água.',
        later: [{ day: 19, text: 'Luan teve alta da UTI pediátrica. A mãe levou um bolo para o quartel dos Bombeiros.', when: (c) => c.s.diary.some((d) => d.id === 'd17_crianca' && d.kind === 'vivo') }],
      },
    }),
    // ----------------------------------------------------------------- 4
    call({
      id: 'd17_choque',
      ref: 'D17 #4',
      at: '10:25',
      pool: 'grave',
      num: '(17) 3324-0760',
      caller: 'Rosana (esposa)',
      callerName: 'Rosana',
      type: 'comum',
      voice: 'mulher',
      note: 'Homem levou choque na fiação alagada. Caído.',
      noteWrong: 'Choque leve. Diz que ele já tá melhor.',
      addr: { rua: 'Rua São João', n: 760, bairro: 'Vila Nova', ref: 'Casa de muro verde, perto do campinho.' },
      amb: ['chuva', 'gritos', 'agua'],
      open: [
        '{Dr}! Meu marido foi mexer no quadro de luz e {{levou um choque|choque}}, tá caído no chão da área, {{dentro da água|na_agua}}!',
        '[chuva; um zumbido elétrico; uma criança chorando]',
        'ROSANA: Edinho! Edinho, fala comigo!',
      ],
      q: {
        consciencia: 'Não fala! Não mexe! {{Não responde nada|nao_responde}}!',
        respira: 'Eu não sei! {{Eu não consigo chegar perto, o fio tá caído na água ainda|fio}}!',
        seguranca: '{{Tá faiscando ainda|faisca}}, a luz da casa tá acesa!',
        idade: 'Quarenta e dois.',
        inicio: 'Agora! Faz um minuto!',
        historico: 'Nada, ele é forte que nem um touro.',
        sangramento: 'Não vi sangue. A mão tá preta, queimada.',
        oque: 'A água entrou na área e o disjuntor ficava desarmando. Ele pegou a chave de fenda e foi mexer, descalço.',
        referencia: 'Rua São João, 760, casa de muro verde, perto do campinho.',
        paciente: 'Ele não responde, {dr}!',
      },
      extra: [
        {
          id: 'chave',
          label: 'Onde fica a chave geral?',
          // Conferido (campo A11: sem página de campo para choque elétrico; desligar a fonte antes de tocar é segurança de
          // cena, PE1; depois, RCP pelo campo A1).
          say: 'Onde fica a chave geral? Dá pra desligar sem pisar na água? Ninguém toca nele antes disso.',
          a: 'O relógio de luz é no muro da frente, lá tá seco! Eu vou lá! Eu vou!',
          onAsk: fx.set('d17_choque_chave'),
        },
      ],
      links: [
        { a: 'fio', b: 'manual:bombeiros', insight: 'Choque elétrico em área alagada, fio energizado na água: Bombeiros obrigatório. Ninguém toca nele antes de cortar a energia (Manual p.17).' },
        { a: 'nao_responde', b: 'manual:parada', insight: 'Choque elétrico e não responde: a corrente pode parar o coração. Parada até prova em contrário. USA (Manual p.1).' },
        { a: 'nao_respira', b: 'manual:parada', insight: 'Fora da água, não respira e está roxo: PARADA. A energia já foi cortada: massagem agora (Manual p.1).' },
      ],
      worsen: [{ after: 15, lines: ['ROSANA: Desliguei a chave! Puxei ele pro seco! {{Ele não respira, {dr}! Tá roxo!|nao_respira}}'] }],
      guide: { id: 'agua' },
      patient: { name: 'Ednaldo Lopes', age: 42, sex: 'M' },
      truth: { dx: 'Parada cardíaca por choque elétrico em área alagada', sev: 'vermelho', ok: ['USA'], sup: ['BOMB'], dest: ['REG'], risk: { good: 30, bad: 75, guideBonus: 25 } },
      radio: {
        saved: '{central}, {unit}. Fibrilação, choque, voltou. Os Bombeiros cortaram a energia da rua. Quem mandou a esposa desligar a chave antes de tocar nele? Salvou duas pessoas.',
        ok: '{central}, {unit}. Ritmo de volta, queimadura na mão direita. Seguimos {dest}.',
        unsafe: 'Central, {unit}! Fio energizado na água, a área inteira tá eletrificada! Sem Bombeiros e sem cortar a energia a gente não entra!',
        dead: 'Central... {unit}. Óbito às {hora}. A esposa ainda tá com a chave de fenda na mão.',
        under: 'Central, {unit}! Parada por choque elétrico! Precisamos de USA!',
      },
      diary: {
        alive: 'Edinho, 42. Choque no quadro de luz com a casa alagada. A esposa desligou a chave antes de tocar nele.',
        dead: 'Edinho, 42. Choque no quadro de luz com a casa alagada. Estava descalço.',
      },
    }),
    // ----------------------------------------------------------------- 5
    call({
      id: 'd17_vidro',
      ref: 'D17 #5',
      at: '11:35',
      pool: 'trauma_moderado',
      num: '(17) 99620-1150',
      caller: 'Cleide',
      callerName: 'Cleide',
      type: 'exagerador',
      voice: 'mulher',
      note: 'Mulher cortou o pé na água. Diz que tá jorrando.',
      noteWrong: 'Hemorragia grave! Muito sangue!',
      addr: { rua: 'Rua Tiradentes', n: 1150, bairro: 'Vila Nova', ref: 'Sobrado bege, na frente da lotérica.' },
      amb: ['chuva', 'choro', 'agua'],
      open: ['{m:Moço|Moça}, eu {{cortei o pé num vidro|vidro}} dentro da água, {{tá jorrando sangue|jorrando}}! Eu vou morrer aqui!', '[água batendo na parede; duas crianças chorando]'],
      q: {
        oque: 'Fui tirar as coisas do chão da cozinha, a água na canela, pisei num caco de garrafa. Entrou fundo, no meio do pé.',
        consciencia: 'Acordada, nervosa!',
        respira: 'Respiro, respiro, tô ofegante de nervoso.',
        idade: 'Trinta e oito.',
        inicio: 'Faz uns quinze minutos.',
        sangramento: ['Tava jorrando! Aí eu enrolei a toalha e apertei... {{parou de pingar, mas a toalha ficou vermelha|toalha}}.', 'O corte é grande, dá pra ver por dentro.'],
        historico: 'Nada. Só a vacina do tétano, que eu não sei quando foi.',
        paciente: 'Sou eu mesma! Tô sentada na escada, com o pé pra cima.',
        seguranca: 'Seguro. A água parou de subir aqui na Tiradentes.',
        referencia: 'Sobrado bege, em frente da lotérica. Tem um barco de isopor dos meninos na porta, juro.',
      },
      extra: [
        { id: 'tontura', label: 'Tontura? Pele fria?', say: 'Você está tonta? Pele fria, suor, vista escurecendo?', a: '{{Tontura não. Só nervoso|sem_tontura}}. Mas não consigo pisar, {m:moço|moça}, e não tenho como ir. A rua é um rio.' },
        {
          id: 'apertar',
          label: 'Orientar compressão',
          kind: 'fala',
          cost: 4,
          // Conferido (campo A5: compressão contínua até parar, sem tirar o pano para olhar; pé elevado ajuda).
          say: 'Mantém a toalha apertada em cima do corte e o pé pra cima. Não tira a toalha pra olhar.',
          a: 'Tá... tô apertando. Não vou olhar. Ai, não vou olhar.',
        },
      ],
      links: [
        { a: 'jorrando', b: 'toalha', insight: '"Tá jorrando"... mas com a toalha apertada parou de pingar. Corte profundo com sangramento controlado: não é hemorragia grave.' },
        { a: 'sem_tontura', b: 'manual:amarelo', insight: 'Corte profundo no pé, sangramento controlado, sem tontura nem pele fria, e sem como chegar à UPA pela enchente: amarelo → USB → UPA (Manual p.1 e 9-A).' },
      ],
      patient: { name: 'Cleide Ramos', age: 38, sex: 'F' },
      truth: { dx: 'Corte profundo no pé (sangramento controlado)', sev: 'amarelo', ok: ['USB'], dest: ['UPA'], risk: { good: 120, bad: 300, needs: 'USB' } },
      radio: {
        ok: 'Central, {unit}. Corte de oito centímetros na planta do pé, sangramento contido na toalha. Vai precisar de pontos e vacina. Seguimos {dest}.',
        excess: '{central}, {unit}. Corte no pé, sangramento controlado. Ela tá bem, {dr}. Dava USB.',
      },
      diary: { alive: 'Cleide, 38. Cortou o pé num caco de garrafa dentro da enchente. Oito pontos.' },
    }),
    // ----------------------------------------------------------------- 6 ★ SIMONE (crise na central)
    call({
      id: 'd17_simone',
      ref: 'D17 ★ Simone',
      at: '13:00',
      anchor: true,
      raw: true,
      // na campanha 2 a TARM é a própria Simone: o motor pula esta ligação (shift.ts, special 'simone')
      special: 'simone',
      num: '(17) 3321-0417',
      caller: 'Simone (TARM)',
      callerName: 'Simone',
      type: 'profissional',
      voice: 'simone',
      note: '',
      addr: ADDR.central,
      amb: ['chuva', 'silencio'],
      open: [
        '[a cadeira da Simone arrasta no chão; o fone dela cai em cima da mesa]',
        'SIMONE: {Dr}... desculpa. Eu mesma abro a ficha, que é mais rápido.',
        'SIMONE: Mulher, cinquenta e um anos. {{Dor de cabeça forte desde ontem|cefaleia}}, piorou agora. {{A vista tá embaçada|visao_turva}}. Hipertensa. {{Sem remédio faz três semanas|sem_remedio}}.',
        '[ela aperta as têmporas com as duas mãos]',
        'SIMONE: Pode regular. Eu espero.',
      ],
      q: {
        oque: 'SIMONE: A cabeça. Desde ontem, de leve. Hoje de manhã apertou. Agora parece que vai estourar atrás dos olhos.',
        consciencia: 'SIMONE: Lúcida, {dr}. Sei que dia é hoje, sei quem é você, sei que a USB 03 tá presa na Av. Norte.',
        respira: 'SIMONE: Respiro bem. Sem falta de ar.',
        idade: 'SIMONE: Cinquenta e um. Não precisa repetir em voz alta.',
        inicio: 'SIMONE: A dor começou ontem à noite. A vista embaçou faz uns vinte minutos, quando eu fui ler o post-it.',
        historico: ['SIMONE: Pressão alta. Tinha remédio...', 'SIMONE: {{Parei quando acabou, faz umas três semanas|parou}}. Com a demissão no fim do mês, não ia gastar com farmácia.'],
        dorpeito: 'SIMONE: Dor no peito, não. Nada no braço. Suor frio, não: o suor é da chuva.',
        fast: [
          'SIMONE: [ela sorri, torto de dor, mas os dois cantos da boca sobem iguais]',
          'SIMONE: [levanta os dois braços; os dois ficam no alto] {{"O céu é azul." Hoje não é, mas tá|fast_normal}}.',
        ],
        paciente: 'SIMONE: Sou eu, {dr}. Tô na sua frente.',
        sangramento: 'SIMONE: Não. Nem pelo nariz.',
        seguranca: 'SIMONE: Seguro. A não ser que o Peixoto desça.',
        referencia: 'SIMONE: Rua XV de Novembro, 601. A gente. Mesa da TARM.',
      },
      extra: [
        {
          id: 'pressao',
          label: 'Medir a pressão dela',
          cost: 5,
          say: 'Simone, deixa eu medir a sua pressão. O aparelho tá na gaveta.',
          a: ['[o velcro rasga; a pera chia; o ponteiro sobe e treme]', 'SIMONE: E aí?', '[o visor marca {{22 por 13|pa}}]'],
        },
        {
          id: 'visao',
          label: 'Visão: embaçada inteira ou falta um pedaço?',
          say: 'A vista está embaçada inteira ou falta um pedaço? Vê dobrado?',
          a: 'SIMONE: Embaçada inteira, com uns pontinhos brilhando. Não falta pedaço. Não vejo dobrado. Consigo ler o seu crachá... com esforço.',
        },
        {
          id: 'usa',
          label: '"Vou mandar a USA."',
          kind: 'fala',
          say: 'Simone, eu vou mandar a USA pra você.',
          a: ['SIMONE: {{Não. Tem criança na enchente e velho em cima de telhado|nao_usa}}.', 'SIMONE: Pressão alta sem déficit é USB, {dr}. Eu te ensinei o quadro, você me ensinou o manual. Eu vou sentada.'],
        },
        {
          id: 'wesley',
          label: '"Quer que eu avise o Wesley?"',
          kind: 'fala',
          when: is.any(is.flag('wesley_atendido'), is.flag('simone_wesley_conversa')),
          say: 'Quer que eu avise o Wesley?',
          a: ['SIMONE: Não. Ele tá de moto na chuva, entregando. Se eu ligo, ele larga tudo, vem voando e cai de novo.', 'SIMONE: [pausa] Avisa depois. Quando eu estiver sentada na UPA, com soro no braço.'],
          onAsk: fx.add('lealSimone', 1, 'lembrou do Wesley'),
        },
      ],
      links: [
        {
          a: 'pa',
          b: 'sem_remedio',
          insight: 'Pressão 22 por 13, sem remédio há três semanas, dor de cabeça e vista embaçada: crise hipertensiva com sintomas. Sem déficit e sem dor no peito, é urgência, não emergência: USB → UPA.',
        },
        {
          a: 'visao_turva',
          b: 'manual:fast',
          kind: 'confirma',
          insight: 'Dor de cabeça e vista embaçada com a pressão alta: antes de decidir, o FAST. Se for positivo, é AVC e vira USA → Regional (Manual p.6).',
        },
        {
          a: 'fast_normal',
          b: 'nao_usa',
          kind: 'confirma',
          insight: 'FAST normal, lúcida, sem dor no peito. A própria TARM está certa: USB, sentada, sem sirene.',
        },
      ],
      worsen: [{ after: 70, lines: ['SIMONE: {Dr}... {{vomitei. A luz tá doendo|vomito}}.', '[ela apoia a testa na mesa, em cima dos post-its]'] }],
      patient: { name: 'Simone Batista', age: 51, sex: 'F' },
      truth: { dx: 'Crise hipertensiva sintomática, sem déficit neurológico', sev: 'amarelo', ok: ['USB'], dest: ['UPA'], must: ['fast'], risk: { good: 90, bad: 240, needs: 'USB' } },
      noFollowup: true,
      onStamp: (e: EffCtx) => {
        const d = rtOf(e, 'd17_simone')?.decision;
        if (!d) return;
        if (d.resource === 'USB') {
          e.set('d17_simone_usb');
          e.set('simone_crise_ok');
          e.add('lealSimone', 2, 'regulou a Simone direito');
        } else if (d.resource === 'USA') {
          e.set('d17_simone_usa');
          e.set('simone_crise_ok');
          e.add('lealSimone', 1, 'mandou a USA pra Simone');
        } else {
          e.set('d17_simone_dispensada');
          e.add('lealSimone', -2, 'dispensou a Simone');
        }
      },
      radio: {
        ok: 'Central, {unit} na portaria. A Simone desceu andando, de braço dado com o técnico. Vinte e dois por treze, FAST normal. Seguimos {dest}. Ela mandou dizer que a nota da ligação das onze tava errada.',
        excess: 'Central, {unit} na portaria. A Simone tá brigando com a gente porque viemos de USA. "Tem criança na água", ela fica repetindo. Vamos levar assim mesmo, já que tamo aqui.',
        late: 'Central, {unit}. Demorou, {dr}. A Simone vomitou duas vezes na escada. Vai ficar internada.',
      },
      diary: {
        alive: (c) =>
          c.flag('d17_simone_usa')
            ? 'Simone, a TARM. Crise hipertensiva na mesa ao lado da minha. Mandei a USA. Ela brigou comigo até a porta da ambulância.'
            : 'Simone, a TARM. Crise hipertensiva na mesa ao lado da minha. Ela mesma abriu a ficha. Foi de USB, sentada.',
      },
    }),
    // ----------------------------------------------------------------- 7 (sem pré-triagem)
    call({
      id: 'd17_trote',
      ref: 'D17 #6',
      at: '13:25',
      pool: 'trote',
      num: '(17) 99843-0017',
      caller: 'Voz masculina, calma',
      type: 'trotista',
      voice: 'jovem_h',
      note: 'Ônibus caiu no rio na Beira-Rio. Muitas vítimas.',
      noteWrong: 'Ônibus no rio! Parece sério, pega logo.',
      addr: { rua: 'Av. Beira-Rio', n: 4500, bairro: 'Parque das Exposições', ref: 'Perto da ponte do Parque.' },
      amb: ['silencio', 'videogame'],
      open: [
        'Alô, emergência? Um ônibus {{caiu no rio na Av. Beira-Rio|onibus}}, perto da ponte do Parque! Tem umas trinta pessoas lá dentro! {{Eu tô vendo daqui, passei de carro agora|passei_carro}}!',
        '[{{silêncio no fundo: nenhum barulho de chuva|sem_chuva}}]',
      ],
      q: {
        oque: 'O ônibus escorregou na pista e foi pro rio. Tá boiando! Tá todo mundo gritando!',
        consciencia: 'Tá... tão todos desmaiados. Não, tão gritando! [pausa] Uns desmaiados, uns gritando.',
        respira: 'Como é que eu vou saber, {m:moço|moça}? Tão dentro do ônibus!',
        idade: 'Sei lá, de todas as idades. Tem criança, tem velho.',
        inicio: 'Agora! Agorinha!',
        sangramento: 'Muito sangue! Na água!',
        historico: 'Doença? {m:Moço|Moça}, é um ônibus.',
        paciente: 'Não dá pra falar com ninguém, tão no rio!',
        seguranca: 'Seguro, seguro. Eu tô no carro.',
        referencia: 'Na ponte do Parque. Linha 12, o amarelo.',
      },
      extra: [{ id: 'quem', label: 'Mais alguém ligou? Bombeiros aí?', say: 'Tem mais gente aí ajudando? Os Bombeiros já chegaram?', a: 'Não... só eu. Não tem ninguém. [{{alguém ri baixinho perto do telefone|risadinha}}]' }],
      callback: ['[{{O número chamado não existe ou está fora de serviço.|retorno_inexistente}}]'],
      links: [
        { a: 'passei_carro', b: 'doc:beira_rio', insight: 'A Av. Beira-Rio está interditada desde as cinco da manhã, com mais de um metro de água. Ninguém "passou de carro agora" por ali.' },
        { a: 'sem_chuva', b: 'passei_carro', insight: 'Diz que está na rua, de carro, no meio do temporal... e não tem barulho de chuva nenhum na ligação.' },
        { a: 'retorno_inexistente', b: 'num', insight: 'Ligar de volta: o número não existe (chip descartável). Trote aproveitando a enchente.' },
        { a: 'risadinha', b: 'manual:trote_sinais', insight: 'Risada abafada, relato cinematográfico e ninguém mais ligando sobre um ônibus no rio: sinais de trote (Manual p.2).' },
      ],
      patient: { name: '"Ônibus no rio"' },
      truth: { dx: 'Trote aproveitando a enchente', sev: 'trote', ok: ['TROTE'], prankKind: 'trote' },
      radio: { prank: 'Central, {unit} na ponte do Parque. Ônibus nenhum, vítima nenhuma. Só o rio, cheio e marrom. Era trote. Perdemos quarenta minutos de rota alagada.' },
    }),
    // ----------------------------------------------------------------- 8 (sem pré-triagem)
    call({
      id: 'd17_insulina',
      ref: 'D17 #7',
      at: '14:10',
      pool: 'moderado',
      num: '(17) 3329-1350',
      caller: 'Dona Nair (esposa)',
      callerName: 'Dona Nair',
      type: 'comum',
      voice: 'idosa',
      note: 'Senhor diabético perdeu a insulina na enchente.',
      noteWrong: 'Senhor diabético. Só quer saber onde pega insulina.',
      addr: { rua: 'Rua Paineira', n: 1350, bairro: 'Santa Luzia', ref: 'Casa com jabuticabeira na calçada.' },
      amb: ['chuva', 'cozinha'],
      open: [
        'Boa tarde, {dr}. Desculpa... é o Hélio, meu marido. {{A água desceu o morro e entrou pela garagem|agua_garagem}}, derrubou a geladeira, {{a insulina dele foi embora na enxurrada|perdeu_insulina}}.',
        'Ele tá fraco, com uma sede que não passa.',
      ],
      q: {
        oque: 'Desde ontem de noite ele tá sem a insulina. Hoje tá bebendo água igual camelo e indo no banheiro toda hora.',
        consciencia: '{{Acordado, conversando|lucido}}. Meio molenga, mas sabe onde tá, sabe o meu nome.',
        respira: 'Respira normal. Não tá ofegante, não.',
        idade: 'Sessenta e oito.',
        inicio: 'A última insulina foi ontem de manhã. Já vai pra mais de um dia.',
        historico: ['Diabetes. Insulina de manhã e de noite.', '{{Ele já ligou pra vocês uma vez, por causa do açúcar baixo, lembra?|ja_ligou}}'],
        paciente: ['HÉLIO: Boa tarde, {dr}. Tô bem, tô bem... é só essa sede. E a vista meio embaçada. E as pernas moles.', 'HÉLIO: Dessa vez eu não pulei almoço, viu? [ri fraco]'],
        sangramento: 'Não, nada.',
        seguranca: 'Seguro. A água já foi embora, ficou o barro.',
        referencia: 'Rua Paineira, 1350, a casa da jabuticabeira. A rua tá com lama até o tornozelo, mas passa carro.',
      },
      extra: [
        { id: 'glicemia', label: 'Mediu a glicemia?', say: 'Vocês têm o aparelhinho? Mediram a glicemia?', a: 'O aparelho boiou, mas funciona. Deu {{quatrocentos e vinte|glicemia_alta}}.' },
        {
          id: 'gravidade',
          label: 'Vômito? Confusão? Respiração funda?',
          say: 'Ele está vomitando, confuso, respirando rápido e fundo, com hálito de fruta?',
          a: 'Vômito não. Confuso não. Só cansado. Hálito... hálito de sede, {dr}. [ri nervosa]',
        },
        { id: 'carro', label: 'Alguém pode levar à UPA?', say: 'Alguém pode levar ele até a UPA?', a: 'O carro tava na garagem, {dr}. Tá cheio de lama até o banco. E o ônibus não tá passando.' },
      ],
      links: [
        { a: 'ja_ligou', b: 'diario:d09_helio', insight: 'Seu Hélio, do dia 9. Daquela vez, insulina e almoço pulado: o açúcar despencou. Agora, sem insulina há mais de um dia, é o contrário.' },
        // Conferido (RC10: lúcido, sem vômito, sem respiração funda e glicemia abaixo de 500 → USI/USB no máximo; campo
        // B2: cetoacidose acima de 250 com acidose, estado hiperosmolar acima de 600). USB porque não tem como ir à UPA.
        { a: 'glicemia_alta', b: 'lucido', insight: 'Glicemia 420, sede e muita urina, mas lúcido, sem vômito e sem respiração funda: hiperglicemia sem sinal de gravidade imediata. Amarelo → USB → UPA, já que não tem como ir.' },
      ],
      patient: { name: 'Hélio Moreira', age: 68, sex: 'M' },
      truth: { dx: 'Hiperglicemia sem insulina (perdida na enchente)', sev: 'amarelo', ok: ['USB'], dest: ['UPA'], risk: { good: 120, bad: 300, needs: 'USB' } },
      radio: { ok: 'Central, {unit}. Seu Hélio, glicemia quatrocentos e dez no nosso aparelho, lúcido, desidratado. Soro e insulina na UPA. A esposa mandou um saco de jabuticaba pra equipe.' },
      diary: { alive: 'Seu Hélio, 68, de novo. A enchente levou a insulina dele. Glicemia 420. A esposa mandou jabuticaba.' },
    }),
    // ----------------------------------------------------------------- 9
    call({
      id: 'd17_muro',
      ref: 'D17 #8',
      at: '15:40',
      pool: 'grave,trauma_moderado',
      num: '(17) 99561-3020',
      caller: 'Seu Joel (vizinho)',
      callerName: 'Seu Joel',
      type: 'testemunha',
      voice: 'homem',
      note: 'Muro caiu em cima de um homem. Diz que tá conversando.',
      noteWrong: 'Muro caiu. Homem preso, mas tá bem, conversando.',
      addr: { rua: 'Rua Dom Pedro II', n: 3020, bairro: 'Vila Esperança', ref: 'Casa de esquina com a Rua das Acácias, portão de ferro verde.' },
      amb: ['chuva', 'gritos', 'multidao'],
      open: [
        'O muro do vizinho caiu! {{Pegou o Seu Josué pelas pernas|pernas}}, ele tá preso embaixo dos tijolos!',
        '[chuva; gente gritando "não puxa, não puxa!"; um cachorro latindo]',
        '{{Mas ele tá bem, tá conversando|conversando}}!',
      ],
      q: {
        oque: 'Ele tava tirando o entulho que a enxurrada trouxe pro quintal. O muro tava encharcado, desabou de uma vez.',
        consciencia: 'Acordado, falando. Pede pra tirar ele dali.',
        respira: '{{Respirando rápido, ofegante|ofegante}}.',
        idade: 'Uns sessenta.',
        inicio: 'Faz uns dez minutos.',
        sangramento: '{{Tem sangue escorrendo por baixo dos tijolos|sangue_tijolo}}, misturado com a água da chuva. Não dá pra ver de onde.',
        historico: 'Não sei, {m:moço|moça}. Ele é forte, trabalha de pedreiro.',
        paciente: ['JOSUÉ: Tira isso de mim... tá pesado... {{tô com sede, me dá água|sede}}...', 'JOSUÉ: Tô com frio.'],
        seguranca: '{{O resto do muro tá rachado, balançando|rachado}}. Tem gente querendo puxar ele assim mesmo.',
        referencia: 'Dom Pedro II, 3020, esquina com a Acácias. Portão de ferro verde.',
      },
      extra: [
        { id: 'cor', label: 'Como está a cor dele?', say: 'Como está a cor dele? Está suando?', a: '{{Branco que nem papel, suando, a boca clarinha|branco}}.' },
        {
          id: 'nao_puxar',
          label: 'Orientar: ninguém puxa',
          kind: 'fala',
          cost: 4,
          // Conferido (RT3: risco de desabamento define zona quente; campo B5/AT23: no esmagamento, a equipe hidrata antes
          // de liberar; regimento, art. 26: Bombeiros como parceiros no resgate).
          say: 'Ninguém puxa ele nem levanta o muro sozinho. O resto pode cair em cima de vocês. Os Bombeiros tiram com segurança.',
          a: 'GENTE! {O} {medico} mandou ninguém puxar! Ninguém mexe! [vozes reclamando, depois mais baixas]',
        },
      ],
      links: [
        { a: 'conversando', b: 'branco', insight: '"Tá bem, tá conversando"... mas está branco, suando, com sede e frio, respirando rápido: sinais de choque por sangramento. Vermelho.' },
        { a: 'sede', b: 'manual:vermelho', insight: 'Sede, frio e respiração rápida em quem sangra preso: choque. Risco imediato de morte → USA (Manual p.1).' },
        { a: 'rachado', b: 'manual:bombeiros', insight: 'Desabamento com vítima presa e o resto do muro balançando: Bombeiros obrigatório (Manual p.17).' },
      ],
      guide: { id: 'hemorragia' },
      patient: { name: 'Josué Fagundes', age: 61, sex: 'M' },
      truth: { dx: 'Vítima presa em desabamento, com choque hemorrágico', sev: 'vermelho', ok: ['USA'], sup: ['BOMB'], dest: ['REG'], risk: { good: 45, bad: 110, guideBonus: 15 } },
      radio: {
        ok: '{central}, {unit}. Os Bombeiros escoraram o muro e tiraram o Seu Josué. Fratura de bacia, sangrando por dentro. Dois acessos, seguimos {dest}. Chegamos a tempo.',
        saved: '{central}, {unit}. Pegamos ele branco, mas a compressão segurou. Quem mandou ninguém puxar? Se puxassem, caía o resto do muro em cima de três.',
        unsafe: 'Central, {unit}! O resto do muro tá caindo aos pedaços! Sem Bombeiros pra escorar, a gente não chega nele!',
        dead: 'Central... {unit}. Tiraram ele sem pulso. Óbito às {hora}.',
        under: 'Central, {unit}! Vítima presa em choque! Precisamos de USA!',
      },
      diary: {
        alive: 'Seu Josué, 61, pedreiro. Um muro encharcado caiu nas pernas dele. Ninguém puxou. Os Bombeiros escoraram.',
        dead: 'Seu Josué, 61, pedreiro. Um muro encharcado caiu nas pernas dele, no quintal de casa.',
      },
    }),
    // ----------------------------------------------------------------- 10
    call({
      id: 'd17_enxurrada',
      ref: 'D17 #9',
      at: '17:20',
      pool: 'leve,pediatria',
      num: '(17) 99208-1720',
      caller: 'Patrícia (mãe)',
      callerName: 'Patrícia',
      type: 'comum',
      voice: 'jovem_m',
      note: 'Mãe: criança engoliu água da enxurrada.',
      noteWrong: 'Criança se afogou! Mãe desesperada.',
      addr: { rua: 'Rua das Acácias', n: 1720, bairro: 'Vila Esperança', ref: 'Casa rosa, do lado do bar do Toninho.' },
      amb: ['chuva', 'desenho'],
      open: ['Oi, desculpa ligar por isso... meu filho {{caiu sentado na enxurrada|caiu}} brincando na porta e {{engoliu um golão daquela água suja|engoliu}}. Isso faz mal?'],
      q: {
        oque: 'Ele escorregou na calçada, a água tava na canela. Levantou sozinho, chorando, cuspindo.',
        consciencia: '{{Acordado, já tá vendo desenho|vendo_desenho}}, comendo bolacha.',
        respira: 'Normal. Tossiu um pouco na hora, agora parou.',
        idade: 'Quatro anos.',
        inicio: 'Faz meia hora.',
        sangramento: 'Ralou o joelho, só.',
        historico: 'Nada. Vacina em dia.',
        paciente: ['MIGUEL: Eu nadei, mamãe!', '[risada de criança]'],
        seguranca: 'Seguro, ele tá dentro de casa.',
      },
      extra: [
        { id: 'sinais', label: 'Tosse, falta de ar, vômito?', say: 'Ele está com tosse, falta de ar, cansado? Vomitou?', a: 'Não... tossiu na hora e parou. {{Agora tá normalzinho|normal}}.' },
        {
          id: 'orientar',
          label: 'Orientar sinais de alerta',
          kind: 'fala',
          cost: 5,
          // Conferido (campo A9: tosse ou cansaço depois de engolir água pedem avaliação logo; leptospirose: febre, dor no
          // corpo e na batata da perna nos dias seguintes, contar da enchente). Separados por urgência.
          say: 'Dá banho nele e observa hoje e amanhã. Se tiver tosse que não para ou cansaço pra respirar, leva na UPA na hora ou liga de novo. Se tiver febre, dor no corpo ou na batata da perna, vômito ou diarreia nos próximos dias, leva na UBS e conta da enchente.',
          a: 'Febre... diarreia... tô anotando no caderno da escola dele. Obrigada, {dr}. Desculpa ligar.',
        },
      ],
      links: [{ a: 'engoliu', b: 'vendo_desenho', kind: 'confirma', insight: 'Engoliu água suja, tossiu e parou; agora brinca, come e respira normal: não houve afogamento. Verde: orientar e observar sinais de alerta.' }],
      patient: { name: 'Miguel', age: 4, sex: 'M' },
      // [validar] Campo A9 (BPed26/APed33): criança que submergiu vai ao hospital mesmo sem sintoma. Ele caiu sentado em
      // água na canela, engoliu e tossiu na hora; agora brinca e respira normal. O jogo trata como "sem afogamento" e
      // aceita a UPA como encaminhamento. Equipe: deveria ser só UPA (avaliação no mesmo dia)?
      truth: { dx: 'Engoliu água da enchente, sem sinais de afogamento', sev: 'verde', ok: ['ORI'], ref: ['UBS', 'CASA', 'UPA'] },
      diary: { ori: 'Miguel, 4. Caiu na enxurrada e engoliu água suja. Brincando. Orientei os sinais de alerta.' },
    }),
  ],
  interlude: {
    teaser: (c) => {
      if (fora(c)) return 'A casa está escura. Uma goteira pinga em cima da cama vazia do Liam.';
      if (c.flag('lucia_foi_embora')) return 'Chove dentro de casa. Não tem ninguém pra contar as goteiras.';
      return 'Chove dentro de casa. Tem balde em todo canto.';
    },
    familyLacos: 1,
    onBico: fx.add('lacos', -1, 'a casa alagando e você fora'),
    bills: [
      {
        id: 'lona',
        label: 'Lona e duas telhas (goteiras)',
        amount: 25,
        desc: 'Sem isso, chove no quarto do Liam a semana inteira.',
        onPay: fx.set('telhado_lona'),
        onSkip: (e) => {
          if (is.present('davi')(e)) e.add('lacos', -1, 'goteira no quarto do Liam');
        },
      },
    ],
    scene: casaD17,
    bico: bicoD17,
  },
});
