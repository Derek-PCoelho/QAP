// =============================================================================
// DIA 14 — "Carla"
// Âncoras: Carla Nunes (ligação-teste da jornalista), Dona Cida pergunta pelo
// Liam pelo nome, pré-eclâmpsia grave, ciclista com hemorragia (compressão guiada).
// ⚖ Idosa caída há horas: USB ou USA → Regional, com perguntas obrigatórias.
// Casa: a Carla na porta (o irmão Tiago, 2019) e a Lúcia, que já era fonte dela.
// Fios: ↺ Carla, Lúcia · 🌱 Bené (o motorista que chorou no meio-fio) · ordem verbal do D9.
// =============================================================================
import type { Ctx, EffCtx, SceneDef, DLine, SceneNode, InspectDef } from '../../engine/types';
import { day, call, fx, NUM, ADDR } from '../dsl';

const presente = (c: Ctx, m: 'lucia' | 'davi') => {
  const f = c.s.family[m];
  return f.status !== 'ausente' && f.status !== 'morto' && !f.away && !c.flag('lucia_fora') && !c.flag('lucia_foi_embora');
};
const noturnoFala = (c: Ctx) => (c.flag('denunciou_henrique') ? 'PAULA' : 'HENRIQUE');

/** se a Lúcia não foi descoberta (ou o jogador não brigou), ela continua fonte da Carla */
const fonteSilenciosa = (e: EffCtx) => {
  if (e.val('lucia_fonte') === undefined) {
    e.set('lucia_fonte');
    e.source('lucia');
  }
};

// -----------------------------------------------------------------------------
// Casa: a Carla na porta
// -----------------------------------------------------------------------------
function cenaCarla(c: Ctx): SceneDef {
  const L = presente(c, 'lucia');
  const longe = c.flag('lucia_fora') && !c.flag('lucia_foi_embora');
  const maquina = c.flag('maquina');
  /** onde está a prova de que a Lúcia já conhecia a Carla (null = não há o que descobrir hoje) */
  const prova: 'maquina' | 'bolsa' | null = L ? (maquina ? 'maquina' : 'bolsa') : longe && maquina ? 'maquina' : null;
  const objId = prova === 'maquina' ? 'cartao_maquina' : 'bolsa_passagem';
  const dec = c.val<string>('d14_carla_decisao');
  const percebeu = c.flag('carla_teste_percebido');
  const ordem = c.flag('ordem_peixoto_registrada');
  const depois = prova ? (L ? 'lucia_casa' : 'lucia_tel') : 'fim';

  const abertura: DLine[] = [
    { who: 'NARRADOR', t: 'Nove da noite. Alguém bate palma no portão, do jeito do interior.' },
    { who: 'NARRADOR', t: 'Uma mulher de uns quarenta anos, mochila nas costas, crachá de imprensa enfiado no bolso da camisa. Ela estende um cartão por cima do portão.' },
    { who: 'CARLA', t: 'Desculpa a hora. Carla Nunes, da Gazeta. {Dr} {nome} {sobrenome}? Me dá cinco minutos?' },
  ];
  if (percebeu) abertura.push({ who: 'CARLA', t: 'Você me pegou hoje de manhã, né? "Dor no peito" com pergunta demais. Eu mereci.' });
  else if (dec === 'USA' || dec === 'USB') abertura.push({ who: 'CARLA', t: 'Hoje de manhã eu liguei pra central fingindo uma dor no peito. A ambulância chegou. Eu cronometrei. Desculpa: eu precisava medir.' });
  else if (dec === 'ORI') abertura.push({ who: 'CARLA', t: 'Hoje de manhã eu liguei pra central fingindo uma dor no peito. Você me mandou procurar a UPA. Educadamente. Foi o mais perto de um "não" que eu ouvi da central.' });
  else abertura.push({ who: 'CARLA', t: 'Hoje de manhã eu liguei pra central fingindo uma dor no peito. Fiquei esperando na fila até cansar.' });

  const tiago: DLine[] = [
    { who: 'CARLA', t: 'Meu irmão, Tiago, tinha vinte e seis anos. Em 2019 ele caiu de moto na Av. Brasil, a quatro quadras do Regional. A ambulância levou quarenta minutos.' },
    { who: 'CARLA', t: 'O motorista da ambulância sentou no meio-fio e chorou. Nunca esqueci a cara dele. Chorava como quem já sabia.' },
    { who: 'CARLA', t: 'Eu sei que o salário de vocês atrasou dois meses. Sei que {{tem um menino de oito anos com asma nesta casa|carla_sabe}}.' },
    { who: 'CARLA', t: 'Não quero o seu nome. Quero saber como é aí dentro: o corte de viatura, as metas, a maca presa no Regional. O que a Saúde+ Gestão não põe no relatório.' },
  ];
  if (ordem) tiago.push({ who: 'NARRADOR', t: 'No bolso do jaleco, dobrado, o post-it do dia 9: "USA 01 é reserva técnica, só sai pra parada." Ordem verbal, sem respaldo no Manual.' });

  const nodes: Record<string, SceneNode> = {
    start: {
      lines: abertura,
      onEnter: fx.doc('cartao_carla'),
      choices: [
        { label: '"Pode falar."', next: 'tiago' },
        { label: '"Eu não falo com jornalista." (Fechar o portão.)', next: 'portao', effect: fx.set('depoimento', 'recusou') },
      ],
    },
    portao: {
      lines: [
        { who: 'NARRADOR', t: 'Você fecha o portão. Ela não insiste.' },
        { who: 'CARLA', t: '(do outro lado) O cartão fica na sua caixa de correio. Meu irmão também achava que não era com ele.' },
      ],
      next: depois,
    },
    tiago: {
      lines: tiago,
      choices: [
        { label: 'Aceitar: "Anônimo. E você confere tudo duas vezes."', next: 'aceitou', effect: fx.all(fx.set('depoimento', 'aceitou'), fx.source('voce')) },
        {
          label: 'Aceitar e entregar o post-it da ordem verbal do Peixoto.',
          when: () => ordem,
          next: 'aceitou_ordem',
          effect: fx.all(fx.set('depoimento', 'aceitou'), fx.source('voce'), fx.set('depoimento_ordem')),
        },
        { label: 'Recusar: "Eu tenho família. Não posso."', next: 'recusou', effect: fx.set('depoimento', 'recusou') },
        { label: 'Adiar: "Me dá uns dias pra pensar."', next: 'adiou', effect: fx.set('depoimento', 'adiou') },
      ],
    },
    aceitou: {
      lines: [
        { who: 'CARLA', t: 'Obrigada. Eu ligo pro número que você me der. Nunca pro da central.' },
        dec === 'USA' || dec === 'USB'
          ? { who: 'NARRADOR', t: 'Ela anota o seu celular num caderninho de capa dura. O mesmo, você tem certeza, onde anotou hoje cedo o tempo da ambulância.' }
          : { who: 'NARRADOR', t: 'Ela anota o seu celular num caderninho de capa dura, já quase sem folha em branco.' },
      ],
      next: depois,
    },
    aceitou_ordem: {
      lines: [
        { who: 'CARLA', t: '(lendo o post-it) "Peixoto, 13:45: USA 01 é reserva técnica, só sai pra parada." Com data e hora.' },
        { who: 'CARLA', t: '...Isso aqui vale mais que dez depoimentos, {dr}. Você sabe disso, né?' },
        { who: 'NARRADOR', t: 'Ela guarda o post-it dentro do caderninho, entre duas folhas, como quem guarda uma flor.' },
      ],
      next: depois,
    },
    recusou: {
      lines: [{ who: 'CARLA', t: 'Entendo. De verdade. O cartão fica com você. Se mudar de ideia.' }],
      next: depois,
    },
    adiou: {
      lines: [{ who: 'CARLA', t: 'A matéria fecha na segunda. Até lá, o cartão fica com você. Liga a qualquer hora. Eu não durmo muito.' }],
      next: depois,
    },
    fim: {
      lines: [{ who: 'NARRADOR', t: 'Mais tarde, você guarda o cartão da Carla na carteira, atrás da foto da família. Amanhã ele vai estar na sua mesa da central.' }],
      onEnter: fonteSilenciosa,
    },
  };

  let inspect: InspectDef | undefined;
  if (prova) {
    const ondeCartao = prova === 'maquina' ? 'preso na sua máquina' : 'na sua bolsa';
    if (L) {
      nodes.lucia_casa = {
        lines: [
          { who: 'NARRADOR', t: 'O portão bate. {Oconj} está na porta da sala, de braços cruzados. Você não sabe há quanto tempo.' },
          { who: 'LUCIA', t: 'Quem era?' },
          { who: 'EU', t: 'Uma jornalista. Carla Nunes, da Gazeta.' },
          { who: 'LUCIA', t: '{{Não conheço essa mulher.|nao_conheco}}' },
          prova === 'maquina'
            ? { who: 'NARRADOR', t: 'Rápido demais. {c:Ela|Ele} volta pra máquina de costura e liga o motor, alto.' }
            : { who: 'NARRADOR', t: 'Rápido demais. {c:Ela|Ele} pega a bolsa da cadeira, leva pro quarto, e volta sem ela.' },
        ],
        choices: [
          { label: `"{c:Lú|Alex}. O cartão dela tá ${ondeCartao}."`, next: 'confronto', needLink: 'lucia_fonte_rev' },
          { label: 'Deixar quieto. Ir dormir.', next: 'quieto' },
        ],
      };
    } else {
      nodes.lucia_tel = {
        lines: [
          { who: 'NARRADOR', t: 'A casa está quieta sem {oconj} e o Liam. Você liga pra Rio Claro de Minas e conta da visita.' },
          { who: 'LUCIA', t: '(no telefone) Uma jornalista? Aí em casa? {{Não conheço essa mulher.|nao_conheco}}' },
          { who: 'NARRADOR', t: 'Rápido demais. Na sala, a máquina de costura {c:dela|dele}, coberta com o pano de prato que {c:ela|ele} deixou antes de viajar.' },
        ],
        choices: [
          { label: '"{c:Lú|Alex}. O cartão dela tá preso na sua máquina."', next: 'confronto', needLink: 'lucia_fonte_rev' },
          { label: '"Tá bom. Dá um beijo no Liam."', next: 'quieto' },
        ],
      };
    }
    nodes.confronto = {
      lines: [
        { who: 'LUCIA', t: L ? '...Ela veio aqui faz duas semanas. Você tava no plantão.' : '(no telefone, depois de um silêncio comprido) ...Ela foi aí em casa faz duas semanas. Você tava no plantão.' },
        { who: 'LUCIA', t: 'Eu contei dos dois meses de salário atrasado. Da bombinha que acabou. De você chegando em casa com cara de quem chorou. Alguém tinha que falar, {nome}. Você não ia.' },
      ],
      choices: [
        { label: '"Você fez certo, {c:Lú|Alex}."', next: 'apoio', affectionate: true, effect: fx.all(fx.set('lucia_fonte'), fx.source('lucia'), fx.add('lacos', 1, 'apoiou {oconj}')) },
        { label: '"Você não tinha o direito de contar da nossa vida."', next: 'briga', effect: fx.all(fx.set('lucia_fonte', false), fx.add('lacos', -1, 'brigou com {oconj}')) },
        {
          label: '"Então a gente fala junto. Eu ligo pra ela amanhã."',
          when: (cc) => cc.val('depoimento') !== 'aceitou',
          next: 'ponte',
          effect: fx.all(fx.set('lucia_fonte'), fx.source('lucia'), fx.set('depoimento', 'aceitou'), fx.source('voce'), fx.set('depoimento_ponte')),
        },
        {
          label: '"Eu também falei com ela. Hoje. Agora somos dois."',
          when: (cc) => cc.val('depoimento') === 'aceitou',
          next: 'ponte',
          effect: fx.all(fx.set('lucia_fonte'), fx.source('lucia'), fx.add('lacos', 1, 'os dois do mesmo lado')),
        },
      ],
    };
    nodes.apoio = {
      lines: L
        ? [
            { who: 'LUCIA', t: 'Eu achei que você ia brigar.' },
            { who: 'NARRADOR', t: prova === 'maquina' ? '{c:Ela|Ele} desliga a máquina. Senta do seu lado no sofá, pela primeira vez em dias.' : '{c:Ela|Ele} senta do seu lado no sofá, pela primeira vez em dias.' },
          ]
        : [
            { who: 'LUCIA', t: '(no telefone) Eu achei que você ia brigar.' },
            { who: 'NARRADOR', t: 'Vocês ficam um tempo na linha sem falar nada. Do lado de lá, o Liam pergunta se é você.' },
          ],
      next: 'fim',
    };
    nodes.briga = {
      lines: L
        ? [
            { who: 'LUCIA', t: 'Então tá. Amanhã eu ligo pra ela e peço pra tirar tudo o que eu falei. {m:Satisfeito|Satisfeita}?' },
            { who: 'NARRADOR', t: prova === 'maquina' ? 'A máquina volta a funcionar. Mais alto ainda.' : '{c:Ela|Ele} vai pro quarto e fecha a porta devagar, que é pior que bater.' },
          ]
        : [
            { who: 'LUCIA', t: '(no telefone) Então tá. Amanhã eu peço pra ela tirar tudo o que eu falei. Boa noite, {nome}.' },
            { who: 'NARRADOR', t: '{c:Ela|Ele} desliga primeiro.' },
          ],
      next: 'fim',
    };
    nodes.ponte = {
      lines: [
        { who: 'LUCIA', t: 'Junto?' },
        { who: 'EU', t: 'Junto.' },
        L
          ? { who: 'NARRADOR', t: '{c:Ela|Ele} pega o cartão e põe em cima da mesa, entre vocês dois, como quem põe um prato pra mais alguém.' }
          : { who: 'NARRADOR', t: 'Do outro lado da linha, {oconj} ri. Um riso cansado, de quem achava que estava {c:sozinha|sozinho} nisso.' },
      ],
      next: 'fim',
    };
    nodes.quieto = {
      lines: [
        prova === 'maquina'
          ? { who: 'NARRADOR', t: L ? 'A máquina costura até meia-noite. Vocês não falam da jornalista.' : '{c:Ela|Ele} desliga. A máquina coberta fica na sala, quieta. Vocês não falam da jornalista.' }
          : { who: 'NARRADOR', t: 'Vocês não falam da jornalista. A bolsa fica no quarto, fechada.' },
      ],
      next: 'fim',
    };
    inspect = {
      objects: [
        prova === 'maquina'
          ? {
              id: 'cartao_maquina',
              label: 'Máquina de costura {doconj}',
              desc: 'Presa entre a bobina e o pé da máquina, a ponta de um cartão de visita: "CARLA NUNES — Gazeta de Santa Aurora". Amassado nos cantos. Não é de hoje.',
              x: 36,
              y: 96,
              w: 46,
              h: 34,
            }
          : {
              id: 'bolsa_passagem',
              label: 'Bolsa {doconj}',
              desc: 'A bolsa {doconj}, aberta na cadeira. No bolso da frente, um cartão dobrado ao meio: "CARLA NUNES — Gazeta". A dobra já está gasta.',
              x: 182,
              y: 112,
              w: 26,
              h: 22,
            },
      ],
      links: [
        {
          a: 'nao_conheco',
          b: objId,
          insight:
            prova === 'maquina'
              ? '"Não conheço essa mulher." O cartão da Carla está preso na máquina {c:dela|dele}, gasto de tanto mexer. {Oconj} já conhecia a jornalista.'
              : '"Não conheço essa mulher." O cartão da Carla está na bolsa {c:dela|dele}, com a dobra gasta. {Oconj} já conhecia a jornalista.',
          unlock: 'lucia_fonte_rev',
        },
        { a: 'nao_conheco', b: 'carla_sabe', insight: 'A Carla sabia do salário atrasado e do menino com asma. Alguém daqui de dentro contou.', unlock: 'lucia_fonte_rev' },
        { a: 'carla_sabe', b: objId, insight: 'O que a Carla sabia sobre a casa, e o cartão gasto: a fonte dela dorme do seu lado.', unlock: 'lucia_fonte_rev' },
      ],
    };
  }

  return { id: 'd14_carla', bg: 'porta', cast: L ? ['CARLA', 'LUCIA'] : ['CARLA'], nodes, inspect };
}

function bicoD14(c: Ctx): SceneDef {
  const L = presente(c, 'lucia');
  return {
    id: 'd14_bico',
    bg: 'cozinha',
    nodes: {
      start: {
        lines: [
          { who: 'NARRADOR', t: 'Quando você chega da ambulância, de madrugada, tem um cartão de visita em cima da mesa da cozinha, embaixo do açucareiro.' },
          { who: 'NARRADOR', t: 'CARLA NUNES — Gazeta de Santa Aurora.' },
          L
            ? { who: 'LUCIA', t: '(no verso, com a letra {doconj}) "Ela veio te procurar. Eu atendi. Faz tempo que eu falo com ela, {nome}. Amanhã a gente conversa. — {c:L|A}."' }
            : { who: 'NARRADOR', t: 'No verso, a caneta: "Volto outro dia. Meu irmão também achava que não era com ele. — C."' },
        ],
        onEnter: fx.all(fx.doc('cartao_carla'), fx.set('depoimento', 'adiou'), fx.set('lucia_fonte'), fx.source('lucia')),
      },
    },
  };
}

// -----------------------------------------------------------------------------
export const DAY = day({
  day: 14,
  title: 'Carla',
  weekday: 'Quarta-feira',
  weather: 'Mormaço, 30 °C. Céu branco de calor.',
  goal: { maxUSA: 3, bonus: 30 },
  newspaper: (c) => {
    const soda = c.flag('d13_soda_obito') ? 'obito' : c.flag('d13_soda_viva') ? 'viva' : '';
    const comp = c.flag('d13_comprimido_obito') ? 'obito' : c.flag('d13_comprimido_vivo') ? 'vivo' : '';
    return {
      headline:
        soda === 'obito'
          ? 'Menina de 3 anos morre após beber soda cáustica'
          : soda === 'viva'
            ? 'Menina que bebeu soda cáustica se recupera no Regional'
            : 'Gazeta investiga: quanto tempo leva uma ambulância?',
      sub:
        soda === 'obito'
          ? 'A mãe limpava o forno no Jardim Primavera. Vizinhos dizem que a ambulância "demorou uma eternidade".'
          : soda === 'viva'
            ? '"Uma voz no telefone me impediu de fazer ela vomitar", contou a mãe, no Jardim Primavera.'
            : 'Série de reportagens de Carla Nunes começa nesta semana. Envie seu relato à redação: sigilo garantido.',
      photo: soda ? 'hospital' : 'cronometro',
      stories: [
        soda
          ? { title: 'Gazeta investiga: quanto tempo leva uma ambulância?', text: 'Por Carla Nunes. A reportagem vai cronometrar as ambulâncias de Santa Aurora. Envie seu relato para a redação. Sigilo garantido.' }
          : { title: 'Vigilância faz mutirão contra intoxicação', text: 'Agentes vão de escola em escola ensinar o que é veneno dentro de casa. Começa pela Vila Esperança.' },
        comp === 'obito'
          ? { title: 'Menino de 2 anos morre após engolir remédio da avó', text: 'Ele tomou três comprimidos de pressão na Vila Esperança. A família pede que o caso sirva de alerta.' }
          : comp === 'vivo'
            ? { title: 'Remédio de adulto: menino de 2 anos é salvo no Regional', text: 'Ele engoliu comprimidos de pressão da avó. "Ele parecia bem", disse ela. Não estava.' }
            : { title: 'Remédio fora do alcance', text: 'A Secretaria lembra: remédio de pressão de adulto pode matar uma criança pequena. Na dúvida, chame a ambulância.' },
        { title: 'Expo Aurora: Prefeitura promete grade "reforçada"', text: 'O show gratuito de sexta no Parque de Exposições deve reunir 20 mil pessoas. Uma só saída principal, pela Rua do Parque.' },
      ],
      notice: 'Quarta-feira. Sem páginas novas no Manual. A coordenação lembra: imprensa só fala com a assessoria.',
      ad: 'GAZETA DE SANTA AURORA — assine e receba em casa. A notícia que a cidade lê primeiro.',
      weather: 'Mormaço · 30 °C',
    };
  },
  handover: (c) => ({
    id: 'd14_passagem',
    bg: 'central',
    nodes: {
      start: {
        lines: [
          { who: 'NARRADOR', t: '07:00. Quarta-feira. O ar-condicionado voltou a funcionar. O balde continua no chão, por via das dúvidas.' },
          { who: noturnoFala(c), t: 'Noite morna. Só uma coisa esquisita: às três da manhã uma mulher ligou perguntando quantas USA a gente tinha no noturno. Perguntei o nome, ela desligou.' },
          { who: 'SIMONE', t: 'Deve ser gente da prefeitura contando viatura. Ou jornalista. Essa gente fareja sangue.' },
        ],
      },
    },
  }),
  timeline: [
    { at: '07:01', kind: 'radio', who: 'USA 02 · TICO', text: 'Central, USA 02 em QRV na base Norte. Quarta sem novidade. Por enquanto.' },
    {
      at: '12:10',
      kind: 'interfone',
      who: 'DR. PEIXOTO',
      text: (c) =>
        c.flag('carla_teste_percebido')
          ? '{Dr}, soube que uma "paciente" ligou hoje cedo fazendo pergunta de frota e você percebeu. Era a jornalista da Gazeta. Bom trabalho. E ordem da diretoria: ninguém fala com imprensa. Ninguém.'
          : '{Dr}, a Gazeta tá fazendo matéria sobre a central. Ordem da diretoria: ninguém fala com jornalista. Se alguém ligar perguntando de frota ou de tempo de resposta, encaminha pra assessoria. Entendido?',
      options: [
        { id: 'ok', label: '"Entendido."' },
        { id: 'paciente', label: '"E se for paciente perguntando?"', reply: 'Paciente não pergunta quantas viaturas a gente tem, {dr}.' },
      ],
    },
    {
      at: '15:00',
      kind: 'script',
      id: 'simone_voz',
      run: (c) => {
        const k = c.callStatus('d14_carla');
        if (k?.answered !== undefined && !c.flag('carla_teste_percebido') && c.v('lealSimone') >= 6) {
          c.modal('SIMONE', '{Dr}, aquela moça de manhã, a da dor no peito que perguntava demais... Eu conheço a voz. É a Carla Nunes, da Gazeta. Ela fez a matéria da creche que fechou.', 'simone');
        }
      },
    },
  ],
  calls: [
    // ------------------------------------------------------------------ 1 CEFALEIA SÚBITA
    call({
      id: 'd14_cefaleia',
      ref: 'D14 #1',
      at: '07:20',
      pool: 'grave',
      num: '(17) 99406-2310',
      caller: 'Sandra (esposa)',
      callerName: 'Sandra',
      type: 'comum',
      voice: 'mulher',
      note: 'Esposa. Marido com dor de cabeça muito forte.',
      noteWrong: 'Dor de cabeça. Diz que tem enxaqueca.',
      addr: { rua: 'Rua Padre Anchieta', n: 2310, bairro: 'Centro', ref: 'Prédio de tijolinho, apartamento 3, em cima da papelaria.' },
      amb: ['gemidos', 'silencio'],
      open: [
        '{m:Moço|Moça}, meu marido tá com uma dor de cabeça que... ele disse que é {{a pior dor da vida dele|pior_vida}}. Ele nunca reclama de nada!',
        '[{{um homem gemendo baixo; depois, alguém vomitando|vomito}}]',
        'GILBERTO: Apaga essa luz, Sandra... pelo amor de Deus, apaga a luz...',
      ],
      q: {
        oque: 'Ele tava carregando os sacos de cimento da reforma e {{a dor veio de repente, igual uma paulada na nuca|paulada}}. Ele caiu sentado.',
        inicio: 'Faz uns quarenta minutos. Foi de uma vez, não foi aos poucos.',
        historico: '{{Tem enxaqueca desde moço, mas diz que nunca foi assim|enxaqueca}}. Pressão um pouco alta, não toma nada.',
        consciencia: 'Acordado. Mas esquisito, de olho fechado, não quer luz.',
        respira: 'Respira, respira. Gemendo.',
        idade: 'Cinquenta e dois.',
        sangramento: 'Não, sangue não.',
        fast: ['Ele sorriu, os dois lados iguais. Levantou os braços.', 'GILBERTO: O céu... é azul. Tá bom? Fala baixo, por favor.'],
        paciente: 'GILBERTO: {Dr}... é como se tivesse estourado alguma coisa aqui atrás. {{O pescoço tá duro|nuca_dura}}.',
        seguranca: 'Seguro.',
      },
      extra: [{ id: 'vomitou', label: 'Vomitou? Quantas vezes?', say: 'Ele vomitou? Quantas vezes?', a: 'Duas vezes já. Em jato.' }],
      links: [
        { a: 'paulada', b: 'enxaqueca', insight: '"A pior dor da vida", de uma vez, diferente da enxaqueca de sempre: não é enxaqueca. Suspeita de sangramento no cérebro.' },
        { a: 'nuca_dura', b: 'vomito', insight: 'Dor de cabeça súbita com nuca dura e vômito: hemorragia até prova em contrário. Vermelho → USA → Regional.' },
        { a: 'pior_vida', b: 'manual:vermelho', insight: 'Dor de cabeça súbita e explosiva, com vômito: risco imediato de morte. USA (Manual p.1).' },
      ],
      worsen: [{ after: 70, lines: ['{m:Moço|Moça}, ele tá ficando {{sonolento, falando mole|sonolento}}... ele não abre o olho quando eu chamo!'] }],
      patient: { name: 'Gilberto Teixeira', age: 52, sex: 'M' },
      truth: { dx: 'Suspeita de hemorragia subaracnoide', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 60, bad: 140 } },
      radio: {
        ok: '{central}, {unit} no local. Cefaleia súbita, rigidez de nuca, fotofobia. Suspeita de hemorragia subaracnoide. Seguimos Regional pra tomografia.',
        under: 'Central, {unit}! Paciente rebaixando, suspeita de sangramento cerebral! Precisamos de USA!',
        dead: 'Central... {unit}. Parou na escada do prédio. Óbito às {hora}.',
        dismissed: '{m:Moço|Moça}! Ele não acorda mais! Tá roncando! Eu falei que era a pior dor da vida dele!',
      },
      diary: {
        alive: 'Saco de cimento e uma "paulada na nuca". Aneurisma rompido, operado a tempo.',
        dead: 'Saco de cimento e uma "paulada na nuca". Aneurisma.',
        later: [{ day: 17, text: 'O Seu Gilberto saiu da UTI. A esposa disse que ele já quer terminar a reforma. Ela escondeu o cimento.', when: (c) => c.s.diary.some((d) => d.id === 'd14_cefaleia' && d.kind === 'vivo') }],
      },
    }),
    // ------------------------------------------------------------------ 2 ★ CARLA (ligação-teste)
    call({
      id: 'd14_carla',
      ref: 'D14 #2 ★',
      at: '08:30',
      anchor: true,
      num: NUM.carla,
      caller: 'Mulher, voz firme',
      callerName: 'Cláudia',
      type: 'jornalista',
      voice: 'mulher',
      note: 'Mulher, 44. Dor no peito. Fala bem, calma.',
      noteFixed: true,
      addr: { rua: 'Rua Marechal Deodoro', n: 1880, bairro: 'Centro', ref: 'Edifício Primavera, apartamento 501.' },
      amb: ['ventilador', 'rua'],
      open: [
        'Bom dia. Eu tô com uma {{dor no peito|dor_peito}}, sabe? {{Do lado... esquerdo|lado_esquerdo}}.',
        'Queria saber: {{quanto tempo a ambulância leva pra chegar aqui no Centro?|pergunta_tempo}}',
        '[{{barulho de teclado, alguém digitando rápido|teclado}}]',
      ],
      q: {
        oque: ['Uma dor aqui no peito. {{Do lado direito|lado_direito}}... quer dizer, no meio. Uma pressão.', 'Vocês estão com {{quantas ambulâncias rodando hoje|pergunta_frota}}? Só por curiosidade.'],
        dorpeito: '{{Não vai pra lugar nenhum, não suo, não... é uma dorzinha|sintoma_vago}}. Mas é dor no peito, né? Dor no peito é USA, não é?',
        inicio: 'Começou... agora. Não, faz uma hora. Desde que eu acordei.',
        idade: 'Quarenta e quatro.',
        consciencia: 'Totalmente lúcida.',
        respira: 'Respiro bem, obrigada.',
        historico: 'Nada. Faço exercício, não fumo.',
        paciente: 'Sou eu mesma. Cláudia. {{Cláudia Rezende|nome_falso}}.',
        sangramento: 'Não.',
        seguranca: 'Seguro. Moro sozinha. Ah, e é verdade que {{a Saúde+ Gestão cortou uma USA e uma USB|pergunta_corte}}?',
        referencia: 'Edifício Primavera, quinto andar. O porteiro abre.',
      },
      extra: [
        {
          id: 'por_que_tempo',
          label: '"Por que quer saber do tempo?"',
          say: 'Por que a senhora quer saber quanto tempo a ambulância leva?',
          a: ['Ah... pra me programar. Pra descer e esperar na portaria.', '[{{o teclado para de digitar|teclado_para}}]'],
        },
        {
          id: 'confronto_jornalista',
          kind: 'confronto',
          label: '"A senhora é jornalista?"',
          locked: true,
          say: 'A senhora não está com dor nenhuma, está? A senhora é jornalista?',
          a: ['[silêncio longo]', '...Tá bom. Você é {m:bom|boa}. Carla Nunes, da Gazeta. Desculpa, {dr}.', 'Eu precisava saber quanto tempo vocês levam de verdade. Meu irmão esperou quarenta minutos, uma vez. Não vou mais ocupar a sua linha.'],
          onAsk: fx.set('carla_teste_percebido'),
        },
      ],
      callback: ['[{{Caixa postal: "Oi, você ligou pra Carla Nunes, da Gazeta de Santa Aurora. Deixa o recado que eu retorno."|retorno_gazeta}}]'],
      links: [
        { a: 'pergunta_tempo', b: 'sintoma_vago', insight: 'Quem está com dor no peito quer a ambulância, não a estatística. Ela pergunta mais do serviço do que fala da dor.', unlock: 'confronto_jornalista' },
        { a: 'lado_direito', b: 'lado_esquerdo', insight: '"Lado esquerdo", depois "direito", depois "no meio": a dor muda de lugar a cada pergunta. O relato não se sustenta.', unlock: 'confronto_jornalista' },
        { a: 'retorno_gazeta', b: 'nome_falso', insight: 'Ela disse que se chama Cláudia. A caixa postal é da Carla Nunes, jornalista da Gazeta.', unlock: 'confronto_jornalista' },
        { a: 'teclado', b: 'pergunta_frota', insight: 'Alguém digitando enquanto ela pergunta quantas viaturas existem: ela está anotando as respostas.', unlock: 'confronto_jornalista' },
      ],
      onStamp: (e) => {
        const res = e.s.shift ? Object.values(e.s.shift.calls).find((x) => x.def === 'd14_carla')?.decision?.resource : undefined;
        if (res) e.set('d14_carla_decisao', res);
        if (res === 'TROTE') e.set('carla_teste_percebido');
      },
      patient: { name: '"Cláudia Rezende"', age: 44, sex: 'F' },
      truth: { dx: 'Ligação-teste da jornalista Carla Nunes', sev: 'trote', ok: ['TROTE'], prankKind: 'teste' },
      radio: { prank: '{central}, {unit} no Edifício Primavera. A "paciente" desceu sozinha, disse que tá ótima e que era um teste. Anotou o horário que a gente chegou num caderninho, {dr}. Cronometrou a gente.' },
    }),
    // ------------------------------------------------------------------ 3 ★ CIDA (pergunta pelo Liam)
    call({
      id: 'd14_cida',
      ref: 'D14 #3',
      at: '09:40',
      anchor: true,
      num: NUM.cida,
      caller: 'Dona Cida',
      callerName: 'Dona Cida',
      type: 'frequentador',
      voice: 'cida',
      note: 'Dona Cida. Animada.',
      noteFixed: true,
      addr: ADDR.cida,
      amb: ['tv', 'passaros'],
      open: (c) => [
        'Oi {meu} {filho}, é a Cida! Bom dia! Ó, primeiro: e o {{Liam|davi}}? Melhorou da asma, o menino?',
        '{{A Zélia me contou que ele desenha ambulância|desenho}}. Eu fiquei com isso na cabeça a semana inteira.',
        ...(c.flag('cida_maquina') ? ['E a máquina? {Oconj} já costurou alguma coisa? Fala pra {c:ela|ele} que a bobina tem um segredinho: tem que dar um tapinha do lado.'] : []),
      ],
      q: {
        oque: 'Liguei pra saber do Liam! E... ah, e pra perguntar se pode tomar {{chá de boldo junto com o remédio da pressão|boldo}}.',
        historico: 'Pressão. Tomo de manhã, certinho.',
        consciencia: 'Acordadíssima!',
        respira: 'Respirando, graças a Deus.',
        idade: 'Setenta e nove.',
        inicio: 'O boldo? Faz uma semana que eu tomo. A vizinha jurou que baixa a pressão.',
        dorpeito: 'Dor no peito não. Só uma azia de vez em quando, por isso o boldo.',
        paciente: 'Sou eu mesma, {meu} {filho}!',
      },
      extra: [
        { id: 'pressao', label: 'Mediu a pressão? Sente algo?', say: 'A senhora mediu a pressão? Está sentindo alguma coisa: tontura, dor de cabeça?', a: 'Doze por oito, ontem, na farmácia. Tô ótima. Só a azia, de vez em quando.' },
        {
          id: 'conversar',
          kind: 'fala',
          label: 'Contar do Liam',
          cost: 15,
          say: (c) =>
            c.flag('lucia_fora') || c.flag('lucia_foi_embora')
              ? 'Ele está passando uns dias com {c:a mãe|o pai}, em Rio Claro, Dona Cida.'
              : c.flag('marcia_morreu')
                ? 'Ele está bem da asma, Dona Cida. Triste com a professora, mas desenhando.'
                : 'Ele melhorou, Dona Cida. Tá desenhando que nem doido.',
          a: (c) =>
            c.flag('lucia_fora') || c.flag('lucia_foi_embora')
              ? ['Ah... casa vazia é ruim, {meu} {filho}. Eu sei bem como é.', 'Liga pra ele hoje. Criança guarda a voz da gente.']
              : ['Ah, que coisa boa! Diz pra ele que a vó Cida mandou um beijo. Posso ser vó Cida? A Zélia não vai ficar com ciúme? [risada]', 'Meu falecido também desenhava. Fazia o meu retrato num guardanapo do bar e eu brigava.'],
          onAsk: fx.all(fx.add('humanidade', 1, 'conversou com a Dona Cida'), fx.set('cida_conversou_d14')),
        },
      ],
      links: [
        // Conferido (RC17: sem dor no peito; azia ocasional, pressão 12 por 8, sem sinal de alarme → orientação; o chá
        // não substitui o remédio; a azia se investiga na UBS).
        { a: 'boldo', b: 'manual:azul', insight: 'Sem sinal de alarme e pressão controlada: não urgente. Orientar não trocar o remédio pelo chá e falar da azia na UBS (Manual p.1).' },
      ],
      onAnswer: fx.set('cida_ligou_d14'),
      patient: { name: 'Aparecida (Dona Cida)', age: 79, sex: 'F' },
      truth: { dx: 'Dúvida sobre chá e remédio (e saudade)', sev: 'azul', ok: ['ORI'], ref: ['UBS', 'CASA'] },
      diary: {
        ori: 'Perguntou do Liam pelo nome. Lembrou que ele desenha ambulância. E do boldo.',
        alive: 'Mandei viatura pra uma dúvida sobre boldo. Ela perguntou do Liam pra equipe também.',
      },
    }),
    // ------------------------------------------------------------------ 4 ⚖ IDOSA CAÍDA HÁ HORAS
    call({
      id: 'd14_idosa',
      ref: 'D14 #4 ⚖',
      at: '10:40',
      num: '(17) 3327-3120',
      caller: 'Cleide (filha)',
      callerName: 'Cleide',
      type: 'comum',
      voice: 'mulher',
      note: 'Filha achou a mãe caída no quarto.',
      noteWrong: 'Idosa caiu, mas tá conversando. Parece leve.',
      addr: { rua: 'Rua Dom Pedro II', n: 3120, bairro: 'Vila Esperança', ref: 'Casa verde com varanda, em frente ao ponto de ônibus.' },
      amb: ['silencio', 'radio_am'],
      open: [
        '{m:Moço|Moça}, cheguei agora na casa da minha mãe e {{ela tava caída no chão do quarto|caida}}. Ela diz que caiu {{de madrugada|madrugada}}!',
        'Tá acordada, mas {{tá falando que hoje é domingo|confusa}}. Hoje é quarta!',
      ],
      q: {
        oque: 'Ela levantou pra ir no banheiro de madrugada e caiu. Ficou no chão até agora. {{Não conseguiu levantar sozinha|nao_levantou}}.',
        inicio: 'Ela diz que foi "de noite". O abajur ainda tava aceso. Umas seis, sete horas no chão.',
        consciencia: 'Acordada, fala comigo... mas trocou o meu nome com o da minha irmã.',
        respira: 'Respira normal.',
        idade: 'Oitenta e um.',
        sangramento: 'Tem um ralado no cotovelo. Só.',
        historico: 'Pressão, coração... toma um monte de remédio, tá tudo numa caixinha.',
        fast: ['Ela sorriu, os dois lados iguais. Levantou os braços; o direito dói por causa do cotovelo.', 'TEREZA: O céu... é azul. Por que você quer saber do céu, {m:moço|moça}?'],
        paciente: 'TEREZA: Eu tô bem, filha, só me ajuda a levantar... Que dia é hoje? Domingo?',
        seguranca: 'Seguro. Só eu e ela.',
      },
      extra: [
        {
          id: 'anticoagulante',
          label: 'Toma remédio pra afinar o sangue?',
          say: 'Ela toma algum remédio pra afinar o sangue? Anticoagulante?',
          a: 'Deixa eu ver na caixinha... {{tem um que é "pro coração não fazer coágulo"|anticoag}}. Não sei se é de afinar. O cardiologista passou ano passado.',
        },
        {
          id: 'bateu_cabeca',
          label: 'Bateu a cabeça?',
          say: 'Ela bateu a cabeça quando caiu?',
          a: 'Ela diz que não. Mas {{ela não lembra direito como caiu|nao_lembra}}. Não vi galo, não vi sangue na cabeça.',
        },
        {
          id: 'fria',
          label: 'Está fria? Bebe água?',
          say: 'Ela está fria? Consegue beber água?',
          a: 'Tava gelada quando eu cheguei, no chão de cerâmica. Tá com a boca seca. Tô dando água de colherzinha.',
        },
      ],
      links: [
        { a: 'confusa', b: 'nao_lembra', insight: 'Confusa e sem lembrar como caiu: pode ser só desidratação de horas no chão... ou pancada na cabeça. Pergunte, e justifique a escolha.' },
        { a: 'anticoag', b: 'caida', insight: 'Idosa que caiu e toma remédio "pro coração não fazer coágulo": anticoagulante aumenta o risco de sangramento na cabeça.' },
        { a: 'nao_levantou', b: 'manual:amarelo', insight: 'Queda de idosa com horas no chão: no mínimo AMARELO. Confusão nova e possível anticoagulante podem justificar USA (Manual p.1).' },
      ],
      patient: { name: 'Tereza Gonçalves', age: 81, sex: 'F' },
      // [validar] RT6/RT9: confusão nova pode ser "alteração súbita da consciência" (na dúvida, presumir) e "tava gelada"
      // pode ser hipotermia: os dois são USA. Anticoagulante ("distúrbio de coagulação") e não lembrar a queda ("história
      // de inconsciência") são USI/USB. O jogo prefere USB e aceita USA (⚖). Equipe: a USA deveria ser a preferida?
      truth: { dx: 'Queda com longa permanência no chão (idosa confusa)', sev: 'amarelo', ok: ['USB', 'USA'], best: 'USB', dest: ['REG'], must: ['anticoagulante', 'bateu_cabeca'], risk: { good: 120, bad: 300, needs: 'USB' } },
      radio: {
        ok: 'Central, {unit}. Dona Tereza, fria e desidratada, confusa, Glasgow 14. Toma anticoagulante. Seguimos Regional pra tomografia.',
        late: 'Central, {unit}. Ela ficou tempo demais no chão: rim parando, muito desidratada. Seguimos Regional. Vai ficar internada um bom tempo.',
      },
      diary: { alive: 'Sete horas no chão do quarto, o abajur aceso. Achava que era domingo.' },
    }),
    // ------------------------------------------------------------------ 5 QUEIMADURA
    call({
      id: 'd14_queimadura',
      ref: 'D14 #5',
      at: '11:50',
      pool: 'trauma_moderado',
      num: '(17) 3329-1320',
      caller: 'Dona Lurdinha (pastelaria)',
      callerName: 'Dona Lurdinha',
      type: 'testemunha',
      voice: 'idosa',
      note: 'Pastelaria. Rapaz queimou o braço no óleo.',
      noteWrong: 'Queimadurinha de cozinha. Leve.',
      addr: { rua: 'Rua das Indústrias', n: 1320, bairro: 'Distrito Industrial', ref: 'Pastelaria em frente ao portão da fábrica de tecido.' },
      amb: ['cozinha', 'gritos'],
      open: [
        '{Dr}, o menino da fritura virou o tacho de óleo no braço! {{O braço inteiro, do cotovelo até a mão|braco_inteiro}}!',
        '[{{um rapaz gritando; água correndo na pia|agua_pia}}]',
        'Eu passei {{pasta de dente|pasta}}, que a minha mãe ensinava, mas ele tá gritando mais!',
      ],
      q: {
        oque: 'O cabo do tacho quebrou. O óleo tava fervendo, a gente frita pastel desde as dez.',
        consciencia: 'Acordado, gritando de dor.',
        respira: 'Respira. Chorando, mas respira.',
        idade: 'Vinte e dois.',
        inicio: 'Agora! Cinco minutos.',
        sangramento: 'Não sangra. Tá {{empolando inteiro, a pele soltando|bolhas}}.',
        historico: 'Nada, é um menino forte.',
        paciente: 'IGOR: Arde, {dr}! Arde muito! A pele tá saindo junto com a pasta!',
        seguranca: 'Desliguei o fogo. Seguro.',
      },
      extra: [
        { id: 'rosto', label: 'Pegou no rosto? Voz rouca?', say: 'O óleo pegou no rosto ou no pescoço? Ele está com a voz rouca?', a: 'Não, só o braço e a mão. A voz tá normal, só os gritos.' },
        {
          id: 'orientar_agua',
          kind: 'fala',
          label: 'Orientar: água corrente, tirar a pasta',
          // Conferido (campo A10: resfriar em abundância até 20 min, em temperatura ambiente; não romper bolhas; tirar
          // adornos não aderidos; cobrir com pano limpo e seco).
          say: 'Tire a pasta de dente com água corrente, em temperatura ambiente, por uns quinze minutos. Não estoure as bolhas. Tire anel e relógio. Depois cubra com um pano limpo.',
          a: 'Água... tá. Tá aliviando, ele parou de gritar um pouco. Anel ele não usa. Pasta, nunca mais.',
        },
      ],
      links: [
        { a: 'braco_inteiro', b: 'bolhas', insight: 'Bolhas e pele soltando do cotovelo à mão: queimadura de segundo grau, com dor intensa. Amarelo → USB → UPA (com a mão queimada, o Regional também serve).' },
        { a: 'pasta', b: 'agua_pia', insight: 'Pasta de dente em queimadura atrapalha: o certo é água corrente. Orientar enquanto a USB vai.' },
      ],
      patient: { name: 'Igor Fernandes', age: 22, sex: 'M' },
      // RT7: dor intensa → USI/USB; sem rosto, voz rouca nem inalação. Antebraço e mão são cerca de 5% da superfície
      // (regra dos nove, campo B5): não é "extensa". Queimadura de 2º grau na mão é critério de centro de queimados
      // (ATLS, tab. 9-2): Regional aceito como destino, além da UPA.
      truth: { dx: 'Queimadura de 2º grau no braço e na mão (óleo quente)', sev: 'amarelo', ok: ['USB'], dest: ['UPA', 'REG'], risk: { good: 120, bad: 300, needs: 'USB' } },
      radio: {
        ok: 'Central, {unit}. Queimadura de segundo grau, antebraço e mão. Lavaram direitinho. Seguimos UPA.',
        excess: '{central}, {unit}. Queimadura no braço, {dr}, sem via aérea comprometida. Dava USB.',
      },
      diary: { alive: 'O cabo do tacho quebrou. Óleo de pastel no braço inteiro. Pasta de dente, depois água.' },
    }),
    // ------------------------------------------------------------------ 6 TROTE SOFISTICADO
    call({
      id: 'd14_trote',
      ref: 'D14 #6',
      at: '13:00',
      pool: 'trote',
      num: '(17) 99150-0901',
      caller: 'Voz de rapaz, calma',
      type: 'trotista',
      voice: 'jovem_h',
      note: 'Rapaz calmo. Avô caído no quintal.',
      noteWrong: 'Rapaz calmo, avô desacordado. Parece sério.',
      addr: { rua: 'Rua Ipê', n: 901, bairro: 'Jardim Norte', ref: 'Casa amarela de muro baixo.' },
      amb: ['escola'],
      open: [
        'Boa tarde. Meu avô caiu no quintal e não tá respondendo. Rua Ipê, 901, Jardim Norte. {{É uma casa amarela, de muro baixo|casa_amarela}}.',
        '[{{um sinal tocando ao longe; barulho de corredor|sinal}}]',
      ],
      q: {
        oque: 'Ele tava regando as plantas e caiu. Simples assim.',
        consciencia: 'Não responde. Quer dizer, {{responde, mas mole|responde_mole}}.',
        respira: 'Respira. Acho.',
        idade: 'Oitenta. Oitenta e poucos.',
        inicio: 'Agora. Uns cinco minutos. Ou dez.',
        historico: 'Ele tem... diabetes. E pressão. O normal.',
        paciente: ['Ele não consegue falar.', '[{{alguém ao fundo: "fala que ele tá roxo, fala!"|sopro}}]'],
        referencia: 'Em frente à escola. Do lado da escola, quer dizer.',
        sangramento: 'Não vi.',
        seguranca: 'Seguro. Pode vir.',
      },
      extra: [{ id: 'nome', label: 'Nome do seu avô? E o seu?', say: 'Qual o nome do seu avô? E o seu?', a: 'Seu... Benedito. Benedito Silva. Eu sou o neto. Lucas.' }],
      callback: ['[{{"Este número está desligado ou fora da área de cobertura."|retorno_desligado}}]'],
      links: [
        { a: 'mapa', b: 'casa_amarela', insight: 'Rua Ipê, 901 é a Escola Estadual, não uma casa amarela. E o sinal que se ouve ao fundo é o da escola.' },
        { a: 'sinal', b: 'casa_amarela', insight: 'Sinal de escola e barulho de corredor no "quintal do avô", às 13h de uma quarta-feira: é aluno ligando de dentro da escola.' },
        { a: 'sopro', b: 'responde_mole', insight: 'Alguém ao fundo soprando a fala ("fala que ele tá roxo"): a história está sendo inventada na hora.' },
      ],
      patient: { name: '"Seu Benedito Silva"' },
      truth: { dx: 'Trote sofisticado (alunos ligando da escola)', sev: 'trote', ok: ['TROTE'], prankKind: 'trote' },
      radio: { prank: 'Central, {unit} na Rua Ipê, 901. É a Escola Estadual, {dr}. A diretora tá com dois alunos e um celular na sala dela. Trote.' },
    }),
    // ------------------------------------------------------------------ 7 ★ PRÉ-ECLÂMPSIA
    call({
      id: 'd14_preeclampsia',
      ref: 'D14 #7 ★',
      at: '14:10',
      anchor: true,
      num: '(17) 99563-1630',
      caller: 'Jaqueline (gestante)',
      callerName: 'Jaqueline',
      type: 'minimizador',
      voice: 'jovem_m',
      note: 'Gestante, dor de cabeça forte. Diz que "deve ser o calor".',
      noteFixed: true,
      addr: { rua: 'Rua São João', n: 1630, bairro: 'Vila Nova', ref: 'Casa de muro chapiscado, portão marrom, perto do campinho.' },
      amb: ['ventilador', 'tv'],
      open: [
        'Oi... desculpa ligar. Eu tô grávida, e tô com uma {{dor de cabeça muito forte|dor_cabeca}}. Deve ser o calor, né?',
        'É que {{a vista tá brilhando, tipo uns pontinhos de luz|visao_brilhando}}... e não passa.',
      ],
      q: {
        gestacao: ['Trinta e duas semanas. Primeiro filho.', 'No pré-natal a médica falou que {{a pressão tava subindo|pressao_alta}}. Pediu pra eu voltar semana que vem.'],
        oque: 'Acordei com dor de cabeça. Tomei um analgésico, não passou. Agora começou esse brilho na vista.',
        inicio: 'A dor desde de manhã. O brilho, faz uma meia hora.',
        consciencia: 'Acordada. Meio enjoada.',
        respira: 'Respiro bem.',
        idade: 'Vinte e quatro.',
        historico: 'Nada. Nunca tive pressão alta antes da gravidez.',
        sangramento: 'Não, sangue não.',
        dorpeito: 'No peito não. {{Dói aqui em cima da barriga, do lado direito|dor_epigastrio}}. Achei que era azia.',
        paciente: 'Sou eu mesma. Meu marido tá no serviço, eu tô sozinha.',
        seguranca: 'Sozinha, mas seguro.',
      },
      extra: [
        {
          id: 'inchaco',
          label: 'Inchaço? Pressão medida?',
          say: 'Você está inchada? Mediu a pressão hoje?',
          a: '{{O rosto e as mãos tão inchados, a aliança não sai|inchada}}. A vizinha mediu com o aparelho dela: dezesseis por onze.',
        },
      ],
      links: [
        { a: 'visao_brilhando', b: 'manual:eclampsia', insight: 'Gestante com dor de cabeça forte e visão "brilhando": pré-eclâmpsia grave. USA (Manual p.7), destino Maternidade (p.9-A).' },
        { a: 'dor_cabeca', b: 'pressao_alta', insight: '"Deve ser o calor"... mas a pressão já vinha subindo no pré-natal. Ela está minimizando.' },
        // Conferido (campo B4/AGO13: cefaleia, escotomas, dor epigástrica e náusea são sinais de gravidade; o inchaço
        // sozinho não mede gravidade, por isso a pressão entrou no texto).
        { a: 'inchada', b: 'dor_epigastrio', insight: 'Inchada, com pressão de 16 por 11 e dor em cima da barriga, do lado direito: sinais de gravidade da pré-eclâmpsia. Não é azia.' },
      ],
      worsen: [{ after: 60, lines: ['[{{barulho de queda; o telefone bate no chão|queda}}]', 'VIZINHA: Alô?! Alô! Ela tá se debatendo no chão! Tá tendo convulsão, {m:moço|moça}!'], guide: 'convulsao' }],
      patient: { name: 'Jaqueline Freitas', age: 24, sex: 'F' },
      // [validar] O RO2 só põe em USA a DHEG com convulsão (ou história de convulsão); "pressão arterial elevada" é
      // USI/USB. Mas o sulfato de magnésio (AGO13) só vai na USA, e ela tem cefaleia, escotomas, dor epigástrica e
      // 16 por 11. Mantida só a USA (Manual p.7). Equipe: a USB deveria ser aceita como ⚖ antes da convulsão?
      truth: { dx: 'Pré-eclâmpsia grave (32 semanas)', sev: 'vermelho', ok: ['USA'], dest: ['MAT'], risk: { good: 50, bad: 120 } },
      radio: {
        ok: '{central}, {unit} no local. Gestante de 32 semanas, pressão 17 por 11, cefaleia e escotomas. Sulfato iniciado. Seguimos Maternidade.',
        saved: '{central}, {unit}. Ela convulsionou, mas a vizinha protegeu a cabeça dela direitinho. Sulfato correndo, bebê com batimento. Seguimos Maternidade.',
        under: 'Central, {unit}! Gestante com pressão 17 por 11 e escotomas! Risco de eclâmpsia, precisamos de USA!',
        dead: 'Central... {unit}. Não conseguimos segurar a convulsão. Óbito da mãe às {hora}. O bebê foi pra cesárea de urgência.',
        dest: 'Central, {unit}. Gestante de 32 semanas não é perfil daqui. Vão transferir pra Maternidade. Perdemos tempo.',
        dismissed: 'Alô?! Aqui é a vizinha dela! Ela tá tendo convulsão! Ela ligou antes, disseram que era o calor?!',
      },
      onResolve: (e, r) => e.set(r.outcome === 'obito' ? 'd14_preeclampsia_obito' : 'd14_preeclampsia_viva'),
      diary: {
        alive: 'Trinta e duas semanas. "Deve ser o calor." A vista brilhando. Mãe e bebê bem.',
        dead: 'Trinta e duas semanas. "Deve ser o calor."',
      },
    }),
    // ------------------------------------------------------------------ 8 TOSSE
    call({
      id: 'd14_tosse',
      ref: 'D14 #8',
      at: '15:20',
      pool: 'leve,pediatria',
      num: '(17) 99274-1760',
      caller: 'Aline (mãe)',
      callerName: 'Aline',
      type: 'comum',
      voice: 'jovem_m',
      note: 'Mãe. Criança tossindo há três dias.',
      noteWrong: 'Criança com falta de ar!',
      addr: { rua: 'Rua Bahia', n: 1760, bairro: 'Centro', ref: 'Prédio azul, perto da UBS Central.' },
      amb: ['desenho'],
      open: [
        'Boa tarde. Minha filha tá {{tossindo há três dias|tres_dias}}, uma tosse de cachorro, de noite principalmente. Eu tô preocupada.',
        '[{{tosse seca de criança; logo depois, uma risada|tosse_risada}}]',
      ],
      q: {
        oque: 'Tosse seca. De noite piora. De dia ela brinca.',
        respira: '{{Respira normal, não chia, não afunda o peito|respira_bem}}.',
        consciencia: 'Acordada, brincando de boneca.',
        idade: 'Cinco anos.',
        inicio: 'Desde sábado.',
        historico: 'Nada. Vacina em dia.',
        sangramento: 'Não.',
        paciente: 'MARIA EDUARDA: Eu tô tossindo igual cachorro, ó: [tosse] Au!',
      },
      extra: [{ id: 'febre', label: 'Febre? Come? Lábios?', say: 'Ela tem febre? Está comendo? Os lábios estão rosados?', a: 'Febre baixinha no primeiro dia, depois sumiu. Come normal. Lábios rosadinhos.' }],
      links: [
        { a: 'respira_bem', b: 'tres_dias', insight: 'Tosse há três dias, sem febre alta, sem chiado, sem esforço pra respirar: caso leve. UBS.' },
        { a: 'tosse_risada', b: 'manual:verde', insight: 'Tosse e, logo depois, risada: criança ativa, sem sinal de gravidade. Verde (Manual p.1).' },
      ],
      patient: { name: 'Maria Eduarda Costa', age: 5, sex: 'F' },
      // Conferido (RP1: sem estridor, sem chiado, sem esforço respiratório → orientação; campo B6/APed18: tosse de
      // "cachorro" sem estridor é laringite leve). UPA também é encaminhamento correto (corticoide na laringite).
      truth: { dx: 'Tosse viral sem sinais de alarme', sev: 'verde', ok: ['ORI'], ref: ['UBS', 'UPA'] },
      radio: { excess: '{central}, {unit}. A menina latiu pra gente, {dr}. Literalmente. Tá ótima.' },
      diary: { ori: 'Tosse "de cachorro" há três dias. Latiu no telefone. UBS.' },
    }),
    // ------------------------------------------------------------------ 9 ★ CICLISTA (hemorragia)
    call({
      id: 'd14_ciclista',
      ref: 'D14 #9 ★',
      at: '16:30',
      anchor: true,
      num: '(17) 99610-2480',
      caller: 'Valter (testemunha)',
      callerName: 'Valter',
      type: 'testemunha',
      voice: 'homem',
      note: 'Atropelamento. Ciclista sangrando muito.',
      noteFixed: true,
      addr: { rua: 'Av. Beira-Rio', n: 2480, bairro: 'Vila Nova', ref: 'Em frente ao pesqueiro, perto da ponte.' },
      amb: ['rua', 'gritos', 'buzinas'],
      open: [
        'Um carro pegou o ciclista e fugiu! Aqui na Beira-Rio! {{Ele tá sangrando muito da perna|sangra_muito}}, tá fazendo uma poça!',
        '[{{gente gritando "aperta, aperta!"; uma bicicleta retorcida no asfalto|aperta}}]',
      ],
      q: {
        sangramento: '{{Jorrando, tipo em jato, junto com o coração|jato}}! Na coxa, do lado de dentro!',
        consciencia: 'Acordado, mas {{tá ficando branco, tonto|palido}}. Tá perguntando o que aconteceu.',
        respira: 'Respira rápido.',
        idade: 'Uns trinta e poucos.',
        oque: 'O carro veio costurando, bateu na traseira da bicicleta e foi embora. Ele voou em cima da grade do pesqueiro.',
        inicio: 'Agora! Dois minutos!',
        historico: 'Não sei, {m:moço|moça}, não conheço ele!',
        paciente: 'CICLISTA: Tá frio... por que tá tão frio?',
        seguranca: 'Seguro. O carro sumiu. Tô com o pisca-alerta ligado.',
        referencia: 'Em frente ao pesqueiro, perto da ponte.',
      },
      extra: [{ id: 'cabeca', label: 'Capacete? Bateu a cabeça?', say: 'Ele estava de capacete? Bateu a cabeça?', a: 'Tava de capacete, rachou no meio. Mas ele fala, lembra o nome. Wagner.' }],
      links: [
        { a: 'jato', b: 'manual:vermelho', insight: 'Sangramento em jato na coxa, palidez e tontura: hemorragia grave. USA + compressão guiada já (Manual p.1).' },
        { a: 'palido', b: 'sangra_muito', insight: 'Branco, tonto e com frio depois de perder muito sangue: está entrando em choque.' },
      ],
      worsen: [{ after: 30, lines: ['{m:Moço|Moça}! {{Ele tá apagando! Tá ficando mole|apagando}}! O pano encharcou!'], guide: 'hemorragia' }],
      guide: { id: 'hemorragia' },
      patient: { name: 'Wagner Dias', age: 34, sex: 'M' },
      truth: { dx: 'Hemorragia na coxa (atropelamento de ciclista)', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 45, bad: 110, guideBonus: 15 } },
      radio: {
        ok: '{central}, {unit} no local. Lesão arterial na coxa, em choque. Torniquete aplicado. Seguimos Regional.',
        saved: '{central}, {unit}. Quem tava apertando a coxa dele fez exatamente o que você mandou, {dr}. Sem aquilo ele não chegava. Seguimos Regional.',
        under: 'Central, {unit}! Hemorragia arterial, choque! Precisamos de USA, agora!',
        dead: 'Central... {unit}. Chegamos com ele sem pulso. Óbito às {hora}.',
        dismissed: '{m:Moço|Moça}! Ele parou de falar! Tem sangue pra todo lado! Cadê a ambulância?!',
      },
      onResolve: (e, r) => e.set(r.outcome === 'obito' ? 'd14_ciclista_obito' : 'd14_ciclista_vivo'),
      diary: {
        alive: 'Wagner, ciclista. Atropelado na Beira-Rio, o carro fugiu. Um desconhecido apertou a coxa dele até a USA chegar.',
        dead: 'Wagner, ciclista. Atropelado na Beira-Rio, o carro fugiu.',
      },
    }),
  ],
  interlude: {
    teaser: 'Alguém bate palma no portão às nove da noite.',
    familyLacos: 1,
    onBico: fx.add('lacos', -1, 'não estava em casa'),
    scene: (c) => cenaCarla(c),
    bico: (c) => bicoD14(c),
  },
});
