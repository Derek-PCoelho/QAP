// =============================================================================
// DIA 12 — "Do Outro Lado da Linha" (Manual p.12: saúde mental)
// Domingo. A crise emocional (acolhimento: o relógio desacelera, a ligação não
// cai, o CVV 188 aparece). Temas sensíveis tratados sem métodos e sem detalhes:
// o foco é escutar, não julgar e não deixar ninguém sozinho.
// Fios: 🌾 Henrique (sindicância — encobrir, denunciar ou se omitir) · ↺ Simone
//       (demissão anunciada) · ↺ Cida ("tava na comadre") · 🌾 Rosângela (liga do
//       abrigo, se foi salva) · ↺ Lúcia (proposta de emprego — Modo Inconsistência).
// =============================================================================
import type { Ctx, EffCtx, SceneDef } from '../../engine/types';
import type { DeskDoc, GuideScript } from '../../engine/content-api';
import { day, call, fx, is, NUM, ADDR } from '../dsl';

/** o menino da dengue (D11) ficou na fila e morreu no noturno do Henrique */
const yuri = (c: Ctx) => c.flag('noturno_obito_d11_dengue_grave');

/** o cônjuge (Lúcia ou Alex) decide sem você: com Laços < 5 aceita a vaga e vai com o Liam (D13–D17) */
const luciaDecide = (e: EffCtx) => {
  if (e.v('lacos') < 5) {
    e.set('lucia_fora');
    e.family('lucia', 'ausente');
    e.family('davi', 'ausente');
  } else e.set('lucia_recusou_sozinha');
};

export const DOCS_EXTRA: Record<string, DeskDoc> = {
  ficha_sindicancia: {
    id: 'ficha_sindicancia',
    title: 'Sindicância: cópia da ficha',
    text: (c) =>
      yuri(c)
        ? 'FICHA · sábado, 18:20 · Yuri Santana, 15 · Dengue, 5º dia. NOTA DA TARM (Simone): "Mãe, filho de 15 com dengue. Sangrou o nariz e a gengiva. Tá tonto." Recebida na fila diurna; passada ao noturno às 19:00 sem atendimento. Conduta do noturno (Dr. Henrique Lacerda), 19:40: "orientado hidratação oral e UBS". Retorno às 03:50: rebaixado. USB enviada 04:05. Óbito às 04:10. — PARECER DO REGULADOR DO DIA: "O paciente relatou sangramento na triagem inicial?" [ ] Sim  [ ] Não'
        : 'FICHA · domingo, 02:10 · Rosa Teixeira, 68 · Dengue, 5º dia. NOTA DA TARM (Cleide, noturno): "Senhora, dengue 5º dia, gengiva sangrando, tonta." Conduta (Dr. Henrique Lacerda): "orientado hidratação oral e UBS". Retorno às 05:30: desmaio. USB enviada. Óbito na UPA às 06:40. — PARECER DO REGULADOR DO DIA: "O paciente relatou sangramento na triagem inicial?" [ ] Sim  [ ] Não',
    clues: [{ id: 'doc:ficha_sindicancia', text: 'Ficha da sindicância: a nota da triagem registra sangramento' }],
    // 1.1: ler a ficha (no quadro, ou na hora do interfone) é o que conta
    onRead: fx.set('viu_ficha_sindicancia'),
  },
};

// Conferido (campo A12: posição de recuperação, não provocar vômito, nada pela boca, guardar as embalagens; MASTER/RM2:
// observar a respiração até a equipe chegar). Sem nomes nem doses de medicamentos.
export const GUIDES_EXTRA: Record<string, GuideScript> = {
  d12_intox: {
    id: 'd12_intox',
    title: 'Orientação: intoxicação por remédios',
    kind: 'dialogo',
    intro: 'Mantenha a mãe ao lado do filho: de lado, nada pela boca, embalagens guardadas. Sem julgamento — as perguntas podem esperar.',
    panic: 80,
    card: 'CVV — Centro de Valorização da Vida · ligue 188 (24h, gratuito) · cvv.org.br. Em emergência médica, ligue para o serviço de emergência da sua cidade.',
    steps: [
      {
        who: 'MÃE',
        say: 'Ele tá dormindo de barriga pra cima! Eu sacudo e ele quase não abre o olho!',
        options: [
          { label: 'Vira ele de lado, com o rosto virado pro chão e o joelho de cima dobrado. Assim ele não engasga.', kind: 'certo' },
          { label: 'Senta ele e dá um café bem forte.', kind: 'errado', reply: 'Ele não consegue engolir, escorreu tudo!' },
          { label: 'Dona Sandra, eu fico com a senhora até a ambulância chegar.', kind: 'calma' },
        ],
      },
      {
        who: 'MÃE',
        say: 'Eu faço ele vomitar? Ponho o dedo?',
        options: [
          { label: 'Não. Não provoque vômito e não dê nada pela boca. Se ele vomitar sozinho, mantém de lado.', kind: 'certo' },
          { label: 'Faz, e depois dá leite pra cortar o efeito.', kind: 'errado', reply: 'Ele engasgou quando eu tentei!' },
          { label: 'A senhora está fazendo tudo certo.', kind: 'calma' },
        ],
      },
      {
        who: 'MÃE',
        say: 'As cartelas tão aqui na minha mão. Jogo fora?',
        options: [
          { label: 'Guarda todas, mesmo vazias, e entrega pra equipe. Isso ajuda muito.', kind: 'certo' },
          { label: 'Joga fora, não precisa.', kind: 'errado' },
        ],
      },
      {
        who: 'MÃE',
        say: 'Ele tá respirando tão devagar...',
        options: [
          { label: 'Põe a mão nas costas dele e conta comigo cada vez que o peito sobe. Se parar, me fala na hora.', kind: 'certo' },
          { label: 'Deixa ele dormir, deve ser o remédio.', kind: 'errado', reply: 'Mas ele não acorda nem quando eu grito!' },
          { label: 'Respira comigo, Dona Sandra.', kind: 'calma' },
        ],
      },
      {
        who: 'MÃE',
        say: 'Ele me pediu desculpa antes de fechar o olho. Desculpa por quê, meu Deus?',
        options: [
          { label: 'Agora ele precisa da senhora do lado dele. As perguntas podem esperar. Fala com ele: ele pode estar ouvindo.', kind: 'certo' },
          { label: 'Isso foi pra chamar atenção.', kind: 'errado', reply: '[ela começa a chorar e solta o telefone por um instante]' },
          { label: 'A senhora está sendo muito corajosa.', kind: 'calma' },
        ],
      },
      {
        who: 'MÃE',
        say: 'A sirene! Eles chegaram!',
        options: [{ label: 'Abre a porta, entrega as cartelas e vai junto com ele.', kind: 'certo' }],
      },
    ],
    success: 'A equipe encontrou o Lucas de lado, respirando, com a mãe segurando as cartelas e a mão dele.',
    fail: 'A orientação teve falhas, mas a mãe não saiu do lado dele.',
  },
};

// -----------------------------------------------------------------------------
// Casa — a proposta de emprego da Lúcia (Modo Inconsistência doméstico)
// -----------------------------------------------------------------------------
const PROPOSTA: SceneDef = {
  id: 'd12_proposta',
  bg: 'cozinha',
  cast: ['LUCIA', 'DAVI', 'ZELIA'],
  nodes: {
    start: {
      lines: [
        { who: 'NARRADOR', t: 'Domingo à noite. {Oconj} chega depois de todo mundo, com o sapato na mão e o cabelo {c:preso|penteado} de um jeito que você não conhece.' },
        { who: 'LUCIA', t: '{{Fui no centro|centro}}. Resolver umas coisas.' },
        { who: 'DAVI', t: '{c:A mãe|O pai} tava de {{{c:blusa de botão|camisa social}|blusa}}, {pai}! Parecia {c:moça|moço} de banco!', when: is.present('davi') },
        { who: 'LUCIA', t: 'Vai escovar o dente, Liam.', when: is.present('davi') },
        { who: 'NARRADOR', t: 'O jantar é sopa. Você come olhando o celular: o grupo da central, a escala do mês, uma mensagem do Peixoto que você ainda não abriu.' },
        { who: 'LUCIA', t: '{{Você ainda tá aqui com a gente, ou tá lá na central?|ainda_aqui}}' },
      ],
      choices: [
        { label: '"{c:Lú|Alex}. A passagem na bolsa. A roupa no varal. Me conta."', needLink: 'proposta', next: 'conversa' },
        { label: '(Tirar o crachá do pescoço e guardar na gaveta.) "Tô aqui."', needLink: 'cracha', affectionate: true, next: 'cracha' },
        { label: '"Tô aqui. Desculpa." (Guardar o celular.)', next: 'distante' },
        { label: '"Tô {m:cansado|cansada}, {c:Lú|Alex}. Amanhã a gente conversa."', next: 'dormir' },
      ],
    },
    cracha: {
      onEnter: fx.add('lacos', 1, 'guardou o crachá'),
      lines: [
        { who: 'NARRADOR', t: 'Você tira o crachá do pescoço. Só então percebe que ele estava ali, no jantar, desde as sete da manhã de ontem.' },
        { who: 'NARRADOR', t: 'Você guarda na gaveta dos talheres. {Oconj} acompanha com os olhos até a gaveta fechar.' },
        { who: 'LUCIA', t: 'Pronto. Agora sim.' },
      ],
      choices: [
        { label: '"{c:Lú|Alex}. A passagem na bolsa. A roupa no varal. Me conta."', needLink: 'proposta', next: 'conversa' },
        { label: '(Ficar ali com {c:ela|ele}, sem celular, até a sopa esfriar.)', next: 'decide' },
      ],
    },
    distante: {
      lines: [
        { who: 'NARRADOR', t: 'Você guarda o celular no bolso. Ele vibra duas vezes na sua perna durante o jantar. Você não olha. Mas {c:ela|ele} vê que você quis olhar.' },
        { who: 'LUCIA', t: 'Tá.' },
      ],
      next: 'decide',
    },
    dormir: {
      lines: [
        { who: 'LUCIA', t: 'Amanhã você trabalha.' },
        { who: 'NARRADOR', t: '{c:Ela|Ele} recolhe os pratos. Fica um tempo na área de serviço, olhando o varal no escuro.' },
      ],
      next: 'decide',
    },
    decide: {
      onEnter: luciaDecide,
      lines: [
        { who: 'NARRADOR', t: 'De manhã, uma mala está na porta. A mochila do Liam em cima, com o estojo de lápis de cor no bolso da frente.', when: is.flag('lucia_fora') },
        { who: 'LUCIA', t: 'Arrumei um serviço em Rio Claro de Minas. Fábrica de uniforme, carteira assinada. Vou ficar na casa da minha irmã. Levo o Liam.', when: is.flag('lucia_fora') },
        { who: 'LUCIA', t: 'Eu ia te contar ontem. Você tava na central. Mesmo {m:sentado|sentada} aqui.', when: is.flag('lucia_fora') },
        { who: 'DAVI', t: '{Pai}, a gente volta logo. {c:A mãe|O pai} prometeu. Eu vou desenhar o ônibus pra você.', when: is.flag('lucia_fora') },
        { who: 'NARRADOR', t: 'O táxi buzina às seis e dez. A casa fica do tamanho errado.', when: is.flag('lucia_fora') },
        { who: 'NARRADOR', t: 'De madrugada, você acorda com sede. {Oconj} está {c:sentada|sentado} na cozinha, {c:de camisola|de pijama}, com uma passagem de ônibus na mão.', when: is.flag('lucia_recusou_sozinha') },
        { who: 'NARRADOR', t: '{c:Ela|Ele} rasga a passagem em quatro e joga no lixo, embaixo da casca de batata.', when: is.flag('lucia_recusou_sozinha') },
        { who: 'NARRADOR', t: 'Você volta pra cama antes que {c:ela|ele} te veja. Você não pergunta. {c:Ela|Ele} não conta.', when: is.flag('lucia_recusou_sozinha') },
      ],
    },
    conversa: {
      onEnter: fx.set('lucia_proposta_descoberta'),
      lines: [
        { who: 'NARRADOR', t: '{c:Ela|Ele} demora. Dobra o guardanapo em quatro, desdobra.' },
        { who: 'LUCIA', t: 'Têxtil Rio Claro. Fábrica de uniforme, em Rio Claro de Minas. {c:Supervisora|Supervisor} de costura, carteira assinada. Dois mil e cem.' },
        { who: 'LUCIA', t: 'A minha irmã tem um quarto. A escola de lá tem vaga pro Liam. É contrato de experiência.' },
        { who: 'LUCIA', t: 'Eu fiz a entrevista hoje, no hotel do centro. Eles querem resposta até amanhã. O ônibus sai às seis e quarenta.' },
        { who: 'EU', t: 'E você ia me contar quando?' },
        { who: 'LUCIA', t: 'Quando você chegasse. Você chega, {nome}? Você chega, come, dorme e volta pra lá. Eu falo, e você responde "aham".' },
      ],
      choices: [
        { label: (c) => (c.flag('maquina') ? '"Fica. A gente faz o ateliê dar certo aqui."' : '"Fica. A gente dá um jeito aqui."'), affectionate: true, next: 'fica' },
        { label: '"Vai. Eu seguro as pontas aqui. Mas volta."', next: 'vai' },
        { label: '"Faz o que você quiser."', next: 'frio' },
      ],
    },
    fica: {
      onEnter: fx.all(fx.add('lacos', 1, 'pediu pra {c:ela|ele} ficar, de verdade'), fx.set('lucia_ficou')),
      lines: [
        { who: 'LUCIA', t: 'Dá um jeito como, {nome}?' },
        { who: 'EU', t: 'Uma janta por semana sem esse telefone. A primeira é hoje.' },
        { who: 'LUCIA', t: '(pausa) Eu vou ligar pra eles amanhã e dizer não.' },
        { who: 'LUCIA', t: 'Mas, {nome}... eu queria. Eu queria muito que alguém precisasse de mim às seis e quarenta da manhã.' },
        { who: 'NARRADOR', t: '{c:Ela|Ele} põe a passagem em cima da mesa, entre os dois pratos de sopa. Ninguém rasga. Ninguém guarda.' },
      ],
    },
    vai: {
      onEnter: (e) => {
        e.add('lacos', 1, 'apoiou {oconj}');
        e.set('lucia_fora');
        e.set('lucia_fora_apoiada');
        e.family('lucia', 'ausente');
        e.family('davi', 'ausente');
      },
      lines: [
        { who: 'LUCIA', t: '({c:ela|ele} ri e chora ao mesmo tempo) Você tá falando sério?' },
        { who: 'EU', t: 'Você costurou a vida inteira pros outros, {c:Lú|Alex}. Vai costurar pra você.' },
        { who: 'LUCIA', t: 'É só a experiência. Eu volto pra gente decidir junto. Eu prometo.' },
        { who: 'LUCIA', t: 'O Liam vai comigo. A Dona Zélia fica com você. Alguém tem que cuidar de você também.', when: is.alive('zelia') },
        { who: 'DAVI', t: '(da porta do quarto) A gente vai andar de ônibus de verdade?' },
        { who: 'NARRADOR', t: 'De madrugada, você leva os dois até a rodoviária. O ônibus das seis e quarenta sai às seis e cinquenta e dois. Você volta a pé, e a casa está do tamanho errado.' },
      ],
    },
    frio: {
      onEnter: (e) => {
        e.add('lacos', -1, 'deu de ombros');
        luciaDecide(e);
      },
      lines: [
        { who: 'LUCIA', t: 'Tá.' },
        { who: 'NARRADOR', t: '{c:Ela dobra a blusa de botão|Ele dobra a camisa social} em silêncio e guarda na bolsa, por cima da passagem.' },
        { who: 'NARRADOR', t: 'De manhã, a mala está na porta. {c:Ela|Ele} não te acorda pra se despedir. O Liam acorda: te dá um abraço de mochila nas costas.', when: is.flag('lucia_fora') },
        { who: 'DAVI', t: '{Pai}, {c:a mãe|o pai} disse que é só um pouquinho.', when: is.flag('lucia_fora') },
        { who: 'NARRADOR', t: '{c:Ela|Ele} não vai. Liga pra fábrica de manhã, da área de serviço, com a porta fechada. Você só ouve o "{c:obrigada|obrigado}".', when: is.flag('lucia_recusou_sozinha') },
      ],
    },
  },
  inspect: {
    objects: [
      { id: 'bolsa_passagem', label: 'A bolsa {doconj}', desc: 'A bolsa {c:dela|dele}, aberta na cadeira. Aparece a ponta de uma passagem de ônibus: "SANTA AURORA → RIO CLARO DE MINAS · IDA · AMANHÃ · 06:40".', x: 58, y: 110, w: 28, h: 22 },
      { id: 'roupa_varal', label: 'O varal da área', desc: 'No varal da área de serviço, a {c:blusa de botão branca|camisa social branca} e a calça social que {c:ela|ele} não usava desde que a confecção fechou. Lavadas hoje, ainda pingando.', x: 232, y: 38, w: 52, h: 36 },
      { id: 'cracha', label: 'O seu crachá', desc: 'O seu crachá da central, pendurado no pescoço, por cima do prato de sopa: "{tit} {nome} Moura — Regulação". Você nem tinha percebido.', x: 150, y: 108, w: 16, h: 12 },
    ],
    links: [
      { a: 'centro', b: 'bolsa_passagem', insight: '"Fui no centro"... com uma passagem para Rio Claro de Minas na bolsa. Só de ida. Amanhã cedo.', unlock: 'proposta', onFind: fx.set('lucia_proposta_descoberta') },
      { a: 'centro', b: 'roupa_varal', insight: 'A roupa de entrevista, lavada hoje. {c:Ela|Ele} não foi ao centro "resolver umas coisas": foi a uma entrevista de emprego.', unlock: 'proposta', onFind: fx.set('lucia_proposta_descoberta') },
      { a: 'bolsa_passagem', b: 'roupa_varal', insight: 'Roupa de entrevista no varal e passagem só de ida na bolsa. {c:Ela|Ele} já decidiu. Ou quase.', unlock: 'proposta', onFind: fx.set('lucia_proposta_descoberta') },
      { a: 'blusa', b: 'roupa_varal', insight: '"Parecia {c:moça|moço} de banco": a {c:blusa de botão|camisa social} que o Liam viu é a mesma que está pingando no varal.', unlock: 'proposta', onFind: fx.set('lucia_proposta_descoberta') },
      { a: 'ainda_aqui', b: 'cracha', insight: 'Você trouxe o crachá até a mesa do jantar. A pergunta {c:dela|dele} não é figura de linguagem.', unlock: 'cracha' },
    ],
  },
};

const CASA_VAZIA: SceneDef = {
  id: 'd12_casa_vazia',
  bg: 'cozinha',
  cast: ['ZELIA'],
  nodes: {
    start: {
      lines: [
        { who: 'NARRADOR', t: 'Domingo à noite. A casa está quieta demais.' },
        { who: 'ZELIA', t: '{Oconj} ligou da casa da irmã. Perguntou se você tá comendo. Eu disse que sim.', when: is.alive('zelia') },
        { who: 'ZELIA', t: 'Mentira minha. Senta aí.', when: is.alive('zelia') },
        { who: 'NARRADOR', t: 'Você janta em pé, na pia, ouvindo a geladeira.', when: (c) => !is.alive('zelia')(c) },
      ],
    },
  },
};

export const DAY = day({
  day: 12,
  title: 'Do Outro Lado da Linha',
  weekday: 'Domingo',
  weather: 'Domingo nublado, 26 °C.',
  goal: { maxUSA: 2, bonus: 30 },
  newspaper: (c) => ({
    headline: yuri(c)
      ? 'Adolescente morre de dengue depois de ligar para a emergência'
      : c.flag('d11_dengue_obito')
        ? 'Adolescente morre de dengue grave no Regional'
        : c.flag('d11_dengue_salvo')
          ? 'Adolescente em choque por dengue é salvo pela Regulação'
          : 'Dengue: casos dobram em uma semana',
    sub: yuri(c)
      ? 'Yuri Santana, 15, da Vila Nova. A família diz que foi orientada a "dar soro e procurar a UBS". A Saúde+ Gestão abriu sindicância.'
      : c.flag('d11_dengue_obito')
        ? 'Yuri Santana, 15, chegou ao hospital em choque. "A febre tinha passado, a gente achou que era melhora", diz a mãe.'
        : c.flag('d11_dengue_salvo')
          ? 'Yuri Santana, 15, chegou ao Regional em choque e já está fora de perigo. "A febre tinha passado, a gente achou que era melhora", diz a mãe.'
          : 'A Secretaria lembra: quando a febre baixa, é hora de redobrar a atenção aos sinais de alarme.',
    photo: 'fumace',
    stories: [
      { title: 'OS anuncia "readequação" na Central de Regulação', text: 'A Saúde+ Gestão pretende reduzir o número de técnicos auxiliares de regulação por turno a partir do mês que vem. "Ganho de eficiência", diz a nota.' },
      { title: 'Domingo de mutirão contra a dengue', text: 'Agentes de saúde visitam casas na Vila Esperança e no Jardim Primavera. Moradores relatam caixas d’água destampadas e calhas entupidas.' },
      { title: 'Precisa conversar?', text: 'O CVV (Centro de Valorização da Vida) atende de graça, 24 horas, pelo telefone 188. Em emergência médica, ligue para o serviço de emergência da sua cidade.' },
    ],
    notice: 'Nova página no Manual: p.12 — Saúde mental (surto, crise com risco, acolhimento).',
    ad: 'TÊXTIL RIO CLARO contrata costureiras e supervisora de costura. Carteira assinada. Entrevistas no Hotel Central, segunda e terça.',
    weather: 'Nublado · 26 °C',
  }),
  handover: (c): SceneDef => ({
    id: 'd12_passagem',
    bg: 'central',
    nodes: yuri(c)
      ? {
          start: {
            lines: [
              { who: 'NARRADOR', t: '07:00. O Henrique está sentado na sua cadeira. Não está mascando nada.' },
              { who: 'HENRIQUE', t: 'O menino da dengue. O da sua fila, das seis e vinte. Yuri. Morreu às quatro e dez, na USB, a caminho do Regional.' },
              { who: 'HENRIQUE', t: 'Eu li "dengue" e orientei soro. Às sete e quarenta. Eu li "dengue", {nome}.' },
            ],
            choices: [
              { label: '"A fila era minha, Henrique. Eu não cheguei nele."', next: 'fila' },
              { label: '"Você leu a nota inteira?"', next: 'nota' },
              { label: '(Ficar em silêncio.)', next: 'silencio' },
            ],
          },
          fila: {
            onEnter: fx.set('assumiu_fila_d11'),
            lines: [
              { who: 'HENRIQUE', t: 'Era sua até as sete. Depois era minha.' },
              { who: 'NARRADOR', t: 'Ele levanta, devolve a cadeira e vai embora. Esquece o casaco no encosto.' },
            ],
          },
          nota: {
            lines: [
              { who: 'HENRIQUE', t: '(ele demora) Eu li o que dava pra ler, {nome}.' },
              { who: 'NARRADOR', t: 'Ele levanta devagar, se apoiando na mesa, e vai embora sem dizer bom plantão.' },
            ],
          },
          silencio: { lines: [{ who: 'NARRADOR', t: 'O silêncio dura até o primeiro telefone tocar. Ele vai embora sem dizer bom plantão.' }] },
        }
      : {
          start: {
            lines: [
              { who: 'NARRADOR', t: '07:00. O Henrique passa o plantão de casaco, com uma ficha dobrada na mão.' },
              { who: 'HENRIQUE', t: 'Perdi uma senhora essa noite. Dona Rosa, sessenta e oito, dengue. Ligou às duas, eu orientei soro. Às cinco e meia ela desmaiou. Morreu na UPA.' },
              { who: 'HENRIQUE', t: 'E soube do seu menino de ontem. O Yuri. Às vezes não dá, {nome}. Nem pra você, nem pra mim.', when: is.flag('d11_dengue_obito') },
              { who: 'HENRIQUE', t: 'A Saúde+ já ligou. Vão abrir sindicância.' },
            ],
            choices: [
              { label: '"Henrique, você tá bem?"', next: 'bem' },
              { label: '"Bom descanso."' },
            ],
          },
          bem: {
            lines: [
              { who: 'HENRIQUE', t: 'Você de novo com essa pergunta. (um riso sem graça) Me pergunta às sete da noite. Aí eu te respondo.', when: is.flag('henrique_perguntado') },
              { who: 'HENRIQUE', t: 'Tô ótimo. Calor, né.', when: is.not('henrique_perguntado') },
              { who: 'NARRADOR', t: 'Está nublado.', when: is.not('henrique_perguntado') },
            ],
          },
        },
  }),
  timeline: [
    { at: '07:02', kind: 'radio', who: 'USA 01 · BENÉ', text: 'Central, USA 01 em QRV. Domingo, {bene}. Domingo é dia de gente sozinha. Fica de olho.' },
    {
      at: '11:40',
      kind: 'script',
      id: 'simone_caio',
      run: (c) => {
        const cr = c.callStatus('d12_crise');
        if (cr?.guide?.done) c.modal('SIMONE', 'Eu ouvi um pedaço daquela, {dr}. Do menino. Você não apressou ele nenhuma vez.', 'simone');
      },
    },
    {
      at: '12:20',
      kind: 'simone',
      who: 'SIMONE',
      id: 'demissao',
      run: (c) => c.set('simone_demissao_anunciada'),
      text: '{Dr}... deixa eu falar uma coisa antes que eu desista. Saiu o comunicado da Saúde+: no fim do mês cortam uma TARM por turno. No dia, somos duas. Eu sou a mais velha e a mais cara.',
      options: [
        { id: 'apoio', label: '"Se depender de mim, você fica. E eu escrevo o que precisar."', effect: (c) => c.add('lealSimone', 1, 'apoiou a Simone'), reply: 'Escrever o quê, {dr}? "Ela acerta setenta e cinco por cento dos post-its"? (ela ri) ...Obrigada. De verdade.' },
        { id: 'realista', label: '"Você é a melhor TARM daqui. Eles vão perceber."', reply: 'Eles não ouvem as ligações, {dr}. Eles leem planilha.' },
        { id: 'silencio', label: '(Não saber o que dizer.)', reply: 'Tudo bem. Eu só precisava falar em voz alta. Próxima ligação.' },
      ],
    },
    {
      at: '13:40',
      kind: 'script',
      id: 'simone_rosangela',
      run: (c) => {
        if (!c.flag('rosangela_ligou')) return;
        if (c.flag('rosangela_simone')) c.modal('SIMONE', 'Ela mandou dizer que a calabresa tava ótima? (a Simone ri, e os olhos enchem ao mesmo tempo) ...Me dá um minuto, {dr}.', 'simone');
        else c.modal('SIMONE', 'Era a da calabresa, né, {dr}? (a Simone vira pro computador e fica um tempo sem digitar)', 'simone');
      },
    },
    {
      at: '15:00',
      kind: 'interfone',
      who: 'DR. PEIXOTO',
      text: '{Dr}, a Saúde+ abriu sindicância contra o Henrique. Óbito por dengue. Preciso do seu parecer técnico sobre a triagem até o fim do turno. A cópia da ficha tá na sua mesa. É burocracia. Assina e pronto.',
      run: (c) => c.doc('ficha_sindicancia'),
      options: [
        {
          id: 'ler',
          label: 'Ler a ficha agora, com calma',
          cost: 3,
          effect: (c) => {
            c.set('viu_ficha_sindicancia');
            c.set('doc_lido_ficha_sindicancia');
            c.toast('Na nota da triagem, com a letra redonda da Simone: sangramento de mucosa e tontura. Sinal de alarme da dengue (Manual p.11).');
          },
          reply: 'Lê, lê. Mas é burocracia, {dr}. Até o fim do turno.',
        },
        { id: 'depois', label: 'Depois eu vejo, doutor.' },
      ],
      defaultOption: 'depois',
    },
    { at: '18:30', kind: 'simone', who: 'SIMONE', text: 'O Henrique chegou, {dr}. Meia hora adiantado. Tá no corredor, de casaco. Disse que espera {m:o senhor|a senhora}.' },
  ],
  calls: [
    // ----------------------------------------------------------------- 1 surto com risco para terceiros (USB + PM)
    call({
      id: 'd12_surto',
      ref: 'D12 #1',
      at: '07:20',
      pool: 'psiq',
      num: '(17) 3325-0720',
      caller: 'Dona Zuleide (vizinha)',
      callerName: 'Zuleide',
      type: 'testemunha',
      voice: 'idosa',
      note: 'Vizinha. Homem gritando na rua, quebrando coisa.',
      noteWrong: 'Briga de bêbado. Coisa da PM, não nossa.',
      addr: { rua: 'Rua São João', n: 720, bairro: 'Vila Nova', ref: 'Em frente à padaria da esquina.' },
      amb: ['rua', 'gritos'],
      open: [
        '{m:Moço|Moça}, tem um rapaz aqui na rua {{gritando e quebrando os vasos da calçada|quebrando}}! É o Wanderley, filho da Dona Ivone. {{Ele tá dizendo que a televisão manda recado pra ele|tv_recado}}!',
        '[{{gritos ao fundo: "SAI DE PERTO! ELES TÃO ESCUTANDO!"; um vaso estoura no chão|gritos}}]',
      ],
      q: {
        oque: 'Desde cedo. Ele saiu de casa só de bermuda, gritando que tão seguindo ele. Já quebrou três vasos e o retrovisor de um carro.',
        consciencia: 'Acordado até demais.',
        respira: 'Respira, grita.',
        idade: 'Uns trinta. Trinta e um.',
        inicio: 'Faz uns três dias que ele tá estranho. Hoje explodiu.',
        historico: ['{{Ele faz tratamento no CAPS. Parou o remédio faz umas semanas|parou_remedio}}, a mãe falou.', 'Ele é bom menino, {m:moço|moça}. Quando toma o remédio, é um anjo.'],
        seguranca: ['{{Ele tá com um pedaço de pau na mão|pau}}. Grita com quem chega perto.', 'A mãe dele tá chorando no portão.'],
        risco: 'Ele tá {{ameaçando quem chega perto|ameaca}}. Bateu o pau no carro. Em gente, ainda não.',
        sangramento: '{{Cortou a mão no vaso|corte_mao}}. Tá pingando.',
        paciente: '[{{"NINGUÉM ENCOSTA EM MIM!"|grito_paciente}}]',
        referencia: 'Em frente à padaria da esquina. Não tem como errar: tem gente na rua toda olhando.',
      },
      links: [
        { a: 'pau', b: 'manual:surto', insight: 'Agitação com risco para terceiros (pedaço de pau, ameaçando quem chega perto): USB + PM como apoio (Manual p.12).' },
        { a: 'parou_remedio', b: 'tv_recado', insight: 'Tratamento no CAPS, remédio parado há semanas e "a televisão manda recado": é crise psicótica, não "briga de bêbado".' },
        { a: 'pau', b: 'manual:cena', insight: 'Objeto que pode ferir na mão de alguém agitado: a equipe não entra sem a PM (Manual p.4).' },
      ],
      patient: { name: 'Wanderley Souza', age: 31, sex: 'M' },
      // [validar] RC4: quebrar vasos e o carro é "comportamento heteroagressivo" e o pau na mão com gente perto é "alto
      // risco de agredir outros": os dois estão na lista USA/USI. No RC9, a USA vai "de apoio à USB para contenção
      // química". USB + PM preferida (Manual p.12), USA ⚖. Equipe: a USA deveria ser a preferida?
      truth: { dx: 'Crise psicótica com agitação e risco para terceiros', sev: 'amarelo', ok: ['USB', 'USA'], best: 'USB', sup: ['PM'], dest: ['UPA', 'REG'], risk: { good: 100, bad: 260, needs: 'USB' } },
      radio: {
        ok: 'Central, {unit} com a PM no local. Conseguimos conversar com ele. Aceitou vir. Mão enfaixada, removendo pra UPA. A mãe veio junto, com a receita do CAPS.',
        unsafe: 'Central, {unit}! Ele veio pra cima da viatura com o pau! Recuamos! Cadê a PM?!',
      },
      diary: { alive: 'Wanderley, 31. Parou o remédio; a televisão mandava recados. A PM e a USB chegaram juntas, e ele aceitou vir.' },
    }),
    // ----------------------------------------------------------------- 2 ★ Dona Cida: "Tava na comadre, ficou preocupado?"
    call({
      id: 'd12_cida',
      ref: 'D12 #2 ★',
      at: '08:15',
      anchor: true,
      num: NUM.cida,
      caller: 'Dona Cida',
      callerName: 'Dona Cida',
      type: 'frequentador',
      voice: 'cida',
      note: 'Dona Cida. Voltou da casa da comadre.',
      addr: ADDR.cida,
      amb: ['tv', 'passaros'],
      open: (c) => [
        'Oi {meu} {filho}, é a Cida! {{Tava na comadre|comadre}}, sabia? Fui sábado cedinho e voltei agora de manhã.',
        c.flag('d11_ligou_cida')
          ? 'A Neusa aqui do lado disse que o meu telefone tocou um tempão ontem. {{Era você, né? Ficou {m:preocupado|preocupada}?|preocupado}}'
          : 'Você nem sentiu a minha falta, né? {{Ficou {m:preocupado|preocupada}?|preocupado}} [risada]',
      ],
      q: {
        oque: 'Nada, {meu} {filho}! Liguei pra dar notícia. E a pressão: medi na farmácia, deu 13 por 8. Bonita, né?',
        consciencia: 'Acordadíssima.',
        respira: 'Respiro, respiro.',
        idade: 'Setenta e nove.',
        historico: 'Pressão. E o braço, que ainda tá ruinzinho. A comadre que me ajudou no banho.',
        dorpeito: 'Dor? Só nas costas. A cama da comadre é dura que nem tábua.',
        fast: 'Tô sorrindo pra você! Olha os dois braços pra cima! "O céu é azul, a novela é das seis"!',
        risco: 'Perigo? Só a comadre no volante. [risada]',
        paciente: 'Sou eu mesma!',
        sangramento: 'Credo, não.',
        seguranca: 'Tudo trancadinho.',
      },
      extra: [
        {
          id: 'conversar',
          kind: 'fala',
          label: 'Conversar um pouco com ela',
          cost: 15,
          say: 'Eu {m:fiquei preocupado|fiquei preocupada}, sim, Dona Cida. Como foi lá na comadre?',
          a: [
            'Ah, {meu} {filho}, foi bom demais. Lá tem neto correndo, tem cachorro, tem panela no fogo o dia inteiro.',
            '{{Aí eu volto pra cá e é só a televisão|so_tv}}. Sabe que eu falei com a televisão ontem à noite? Dei boa noite pra moça do jornal.',
            'A comadre quer comprar a minha máquina de costura, sabia? {{Eu não vendo, não. Eu costurava pra fora, aquela máquina era a minha vida.|maquina_cida}}',
            'Desculpa, tô falando demais. É que quando eu volto, a casa parece maior.',
          ],
          onAsk: fx.all(fx.add('humanidade', 1, 'conversou com a Dona Cida'), fx.set('cida_conversou_d12')),
        },
      ],
      links: [{ a: 'comadre', b: 'diario:d11_neusa', kind: 'confirma', insight: 'A Dona Neusa, vizinha dela, tinha avisado ontem: "a Cida saiu cedinho com uma sacola, foi pra casa da comadre". Mistério resolvido.' }],
      onAnswer: fx.set('cida_ligou_d12'),
      patient: { name: 'Aparecida (Dona Cida)', age: 79, sex: 'F' },
      truth: { dx: 'Ligação para dar notícias (pressão controlada)', sev: 'azul', ok: ['ORI'], ref: ['CASA', 'UBS'] },
      diary: { ori: 'A Dona Cida estava na casa da comadre. Voltou e ligou para avisar. "Ficou {m:preocupado|preocupada}?"' },
    }),
    // ----------------------------------------------------------------- 3 ★ crise emocional (acolhimento)
    call({
      id: 'd12_crise',
      ref: 'D12 #3 ★',
      at: '09:10',
      anchor: true,
      num: '(17) 99631-0910',
      caller: 'Caio',
      callerName: 'Caio',
      type: 'comum',
      voice: 'jovem_h',
      note: 'Rapaz, voz baixa. Diz que "não tá bem". Não deixa ele sem resposta, {dr}.',
      addr: { rua: 'Rua Padre Anchieta', n: 1880, bairro: 'Centro', ref: 'Prédio de tijolinho, apartamento 304. O porteiro é o Seu Dirceu.' },
      amb: ['silencio', 'ventilador'],
      open: [
        'Alô... é da emergência? Eu não sei se é aqui que liga.',
        '[{{uma respiração longa, de quem está segurando o choro|segura_choro}}]',
        '{{Eu não tô bem.|nao_bem}} Eu não tô machucado. Eu só... {{eu não tô conseguindo mais|nao_consigo}}.',
      ],
      q: {
        oque: ['Não aconteceu nada. Esse é o problema. Não aconteceu nada, e eu tô assim.', 'Faz semanas que tá pesado. {{Hoje eu acordei pensando que seria mais fácil não acordar mais.|pensamento}}'],
        consciencia: 'Tô acordado. Faz três noites que eu não durmo direito.',
        respira: 'Respiro. Às vezes parece que o ar não vem, mas é o choro.',
        idade: 'Vinte.',
        inicio: 'Faz uns meses. Piorou essa semana.',
        historico: ['Eu fui no posto uma vez. Me deram um encaminhamento pro psicólogo. {{A fila é de quatro meses.|fila}}', 'Não tomo remédio nenhum.'],
        risco: ['[{{silêncio longo|silencio_risco}}]', '{{Eu pensei nisso, sim. Hoje eu pensei muito.|pensou}} Mas eu liguei, né? Eu liguei.'],
        seguranca: '{{Eu tô sozinho no apartamento|sozinho}}. Ninguém sabe que eu tô assim.',
        paciente: 'Sou eu. É comigo mesmo.',
        sangramento: 'Não. Eu não me machuquei. Eu juro.',
        referencia: 'Prédio de tijolinho na Padre Anchieta, apartamento 304. O porteiro é o Seu Dirceu, ele é gente boa.',
      },
      extra: [
        { id: 'nao_desligo', kind: 'fala', label: '"Eu não vou desligar."', say: 'Caio, eu não vou desligar. Eu estou aqui com você.', a: ['[{{um soluço que ele não consegue mais segurar|soluco}}]', 'Obrigado. Desculpa. Desculpa tomar o seu tempo.'] },
        { id: 'irma', label: 'Tem alguém de confiança perto?', say: 'Tem alguém de confiança que mora perto e poderia vir ficar com você?', a: '{{Minha irmã. A Camila. Ela mora a duas quadras.|irma}} Mas eu não queria dar trabalho pra ela.' },
      ],
      links: [
        { a: 'pensou', b: 'manual:crise', insight: 'Pensamentos de não querer viver, sozinho, sem dormir há dias: crise com risco. USB + acolhimento por telefone. A ligação não pode cair (Manual p.12).' },
        { a: 'sozinho', b: 'manual:acolher', insight: 'Está sozinho: perguntar se há alguém de confiança perto. Ele tem uma irmã a duas quadras (Manual p.12).' },
        { a: 'fila', b: 'nao_consigo', kind: 'confirma', insight: 'Ele já pediu ajuda antes: o encaminhamento tem fila de quatro meses. Ligar para a emergência foi o que sobrou. Não é exagero; é pedido de ajuda.' },
      ],
      guide: { id: 'acolhimento', onOri: true },
      onResolve: (e) => e.set('d12_caio_acolhido'),
      patient: { name: 'Caio Ribeiro', age: 20, sex: 'M' },
      // [validar] RC5 põe "alto risco de autoagressão (ideação suicida)" na lista USA/USI; pela definição, alto risco
      // pede passado importante e tentativa em curso, e "na dúvida, alto". Ele pensou nisso hoje, está sozinho, sem
      // tentativa nem passado de autoagressão. USB preferida (Manual p.12), USA ⚖, como em d10_pulso. Equipe: concorda?
      truth: { dx: 'Crise emocional com risco (ideação suicida)', sev: 'amarelo', ok: ['USB', 'USA'], best: 'USB', dest: ['UPA', 'REG'] },
      radio: { ok: 'Central, {unit}. Estamos com o Caio. A irmã chegou junto com a gente. Ele aceitou ir pra UPA conversar com a equipe. Perguntou se podia agradecer quem atendeu.' },
      diary: {
        alive: 'Caio, 20. Ligou para não ficar sozinho com o que estava pensando. A irmã, Camila, chegou junto com a equipe.',
        ori: 'Caio, 20. Ficamos na linha até a irmã chegar.',
        later: [{ day: 15, text: 'Caio começou acompanhamento no CAPS. A irmã mandou um recado pela Simone: "obrigada por não desligar".', when: (c) => c.s.diary.some((d) => d.id === 'd12_crise' && (d.kind === 'vivo' || d.kind === 'orientado')) }],
      },
    }),
    // ----------------------------------------------------------------- 4 intoxicação por remédios (USA → REG)
    call({
      id: 'd12_cartelas',
      ref: 'D12 #4',
      at: '10:10',
      num: '(17) 3328-1010',
      caller: 'Dona Sandra (mãe)',
      callerName: 'Sandra',
      type: 'comum',
      voice: 'mulher',
      note: 'Mãe desesperada. Filho tomou remédio, tá sonolento.',
      noteWrong: 'Mãe nervosa, filho dormindo. Acho que é exagero.',
      addr: { rua: 'Rua Rui Barbosa', n: 2910, bairro: 'Vila Nova', ref: 'Casa de dois andares, garagem com portão de alumínio.' },
      amb: ['choro', 'respiracao'],
      open: ['{m:Moço|Moça}, pelo amor de Deus! O meu filho {{tomou várias cartelas de remédio|cartelas}}! {{Faz meia hora|meia_hora}}! Ele tá {{dormindo, mole|sonolento}}, eu chamo e ele mal responde!'],
      q: {
        oque: ['Eu achei as cartelas vazias no quarto dele. Ele tava deitado. Ele me disse "desculpa, mãe" e fechou o olho.', 'Ele tava triste. Eu sabia que ele tava triste.'],
        consciencia: '{{Responde se eu grito: abre o olho e fecha|responde_grito}}. Fala enrolado.',
        respira: '{{Respira devagar|resp_devagar}}. Devagar demais, {m:moço|moça}?',
        idade: 'Dezessete.',
        inicio: 'Ele disse que foi faz meia hora. Eu cheguei da missa agora.',
        historico: 'Ele faz tratamento no CAPS. Tava melhorando...',
        sangramento: 'Não.',
        risco: 'Ele... foi de propósito, {m:moço|moça}. Ele me disse.',
        paciente: ['[{{um murmúrio sem palavras|murmurio}}]', 'SANDRA: Filho, fala com {m:o moço|a moça}! Fala!'],
        seguranca: 'Só eu e ele.',
      },
      extra: [
        { id: 'embalagens', label: 'O que ele tomou? Tem a embalagem?', say: 'A senhora sabe o que ele tomou? As cartelas estão aí?', a: ['{{Estão aqui, vazias. Remédio da gaveta da minha mãe.|embalagens}} Eu não consigo ler o nome, {m:moço|moça}, a minha mão tá tremendo.', 'Vou guardar. Vou guardar tudo pra eles.'] },
        { id: 'nao_vomitar', kind: 'fala', label: '"Não provoque vômito."', say: 'Não faça ele vomitar e não dê nada pela boca. Se ele vomitar sozinho, vire de lado.', a: 'Tá... tá. Não dou nada. Deixo de lado.' }, // Conferido (campo A12: não provocar vômito, nada pela boca, posição de recuperação)
      ],
      links: [
        { a: 'sonolento', b: 'meia_hora', insight: 'Várias cartelas há meia hora e já sonolento, respondendo só a gritos: intoxicação grave em curso. Vermelho → USA → Regional.' },
        { a: 'resp_devagar', b: 'manual:vermelho', insight: 'Respiração lenta e consciência rebaixada: risco imediato de vida (Manual p.1).' },
      ],
      guide: { id: 'd12_intox' },
      patient: { name: 'Lucas Ferreira', age: 17, sex: 'M' },
      truth: { dx: 'Intoxicação medicamentosa intencional com rebaixamento de consciência', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 50, bad: 120 } },
      radio: {
        ok: '{central}, {unit} no local. Rebaixado, mas protegendo a via aérea. Embalagens recolhidas. Seguimos Regional. A mãe vem com a gente, de mão dada com ele.',
        under: '{unit}: intoxicação grave, rebaixado, respiração lenta! Precisamos de USA!',
      },
      diary: {
        alive: 'Lucas, 17. Várias cartelas, meia hora antes. A mãe guardou as embalagens e não largou a mão dele.',
        dead: 'Lucas, 17. A mãe chegou da missa e achou as cartelas.',
      },
    }),
    // ----------------------------------------------------------------- 5 Rosângela liga do abrigo (se foi salva no D8)
    call({
      id: 'd12_rosangela',
      ref: 'D12 (Teia: Rosângela)',
      at: '11:05',
      when: (c) => c.key('rosangela') === 'salvo',
      num: NUM.rosangela,
      caller: 'Rosângela',
      callerName: 'Rosângela',
      type: 'comum',
      voice: 'mulher',
      note: 'Moça, liga de um abrigo. Diz que não é emergência.',
      noteWrong: 'Mulher do abrigo. Acho que é trote.',
      addr: { rua: 'Rua São João', n: 1880, bairro: 'Vila Nova', ref: 'Casa-abrigo. Endereço sigiloso: não divulgar.' },
      amb: ['radio_am', 'cozinha'],
      open: [
        'Oi... desculpa ligar aqui, eu sei que é pra emergência. {{Não é emergência.|nao_emergencia}}',
        'Meu nome é Rosângela. {{Eu pedi uma pizza de calabresa pra vocês, semana passada.|calabresa}}',
        '[{{alguém mexe uma panela ao fundo; um rádio toca baixinho|abrigo}}]',
        'Eu só queria agradecer quem atendeu. Eu não sei quem foi. A moça do abrigo deixou eu ligar.',
      ],
      q: {
        oque: 'Nada, nada. Eu tô bem. É isso que eu queria dizer: eu tô bem.',
        consciencia: 'Tô bem acordada. Durmo de noite agora, sabia? A noite inteira.',
        respira: 'Respiro.',
        idade: 'Trinta e poucos. Mas hoje parece que eu tenho vinte.',
        paciente: 'Sou eu mesma.',
        seguranca: '{{Tô segura. Ele tá preso.|segura}} E aqui ninguém sabe o endereço. Nem eu posso falar.',
        historico: 'O braço já desinchou. O dente eu vou arrumar no posto.',
        sangramento: 'Não, não.',
      },
      extra: [
        {
          id: 'agradecer',
          kind: 'fala',
          label: 'Contar quem atendeu',
          say: 'Rosângela, quem atendeu foi a gente aqui da central. Eu e a Simone, que pegou a sua ligação primeiro. Que bom ouvir você.',
          a: [
            '[{{um silêncio; depois, um riso molhado|riso_molhado}}]',
            'A Simone? Fala pra ela que a calabresa tava ótima. [ri] Fala pra ela que eu tô viva.',
            'Eu tô aprendendo a costurar aqui no abrigo, sabia? A moça daqui diz que eu tenho mão boa.',
          ],
          onAsk: fx.set('rosangela_simone'),
        },
      ],
      links: [{ a: 'calabresa', b: 'manual:azul', kind: 'confirma', insight: 'A "pizza de calabresa" da semana passada. Hoje não é emergência: é a Rosângela, viva, ligando para agradecer.' }],
      onAnswer: fx.all(fx.set('rosangela_ligou'), fx.add('humanidade', 1, 'a Rosângela ligou para agradecer')),
      patient: { name: 'Rosângela', sex: 'F' },
      truth: { dx: 'Ligação de agradecimento (sem emergência)', sev: 'azul', ok: ['ORI'], ref: ['CASA'] },
      radio: { excess: 'Central, {unit}. Endereço de casa-abrigo, {dr}. Ninguém passando mal. A coordenadora pediu, por favor, pra não mandar viatura com sirene aqui.' },
      diary: { ori: 'Rosângela, a da pizza de calabresa. Ligou do abrigo só para dizer que está viva.' },
    }),
    // ----------------------------------------------------------------- 6 idosa ansiosa: o marido não voltou da missa
    call({
      id: 'd12_marido',
      ref: 'D12 #5',
      at: '11:50',
      pool: 'leve,psiq',
      num: '(17) 3326-1145',
      caller: 'Dona Odila',
      callerName: 'Odila',
      type: 'comum',
      voice: 'idosa',
      note: 'Senhora aflita. O marido não voltou da missa.',
      noteWrong: 'Senhora, marido desaparecido! Parece grave.',
      addr: { rua: 'Rua Minas Gerais', n: 760, bairro: 'Santa Luzia', ref: 'Casa de esquina com a Sete de Setembro, varanda com samambaia.' },
      amb: ['radio_am', 'passaros'],
      open: [
        '{m:Moço|Moça}, desculpa... o meu marido, o Euclides, {{foi na missa das sete e ainda não voltou|missa}}. Já é quase meio-dia. {{Ele tem 84 anos|idade_marido}}. E se caiu na rua? E se...',
        '[{{ela respira curto, rápido|resp_curta}}]',
      ],
      q: {
        oque: 'Ele vai na missa das sete todo domingo. Volta oito e meia, passa na padaria, traz o pão. {{Hoje não voltou|nao_voltou}}.',
        consciencia: 'Eu? Tô acordada. Tô é nervosa.',
        respira: 'Tô respirando curto, {m:moço|moça}. O coração tá batendo na garganta.',
        idade: 'Eu tenho oitenta. Ele, oitenta e quatro.',
        historico: 'Eu tomo remédio pra pressão e pra ansiedade. Tomei.',
        dorpeito: '{{Dor não. Aperto de nervoso.|aperto}}',
        paciente: 'Sou eu mesma que tô ligando.',
        seguranca: 'Tô em casa, sozinha, esperando.',
        risco: 'Perigo... só se aconteceu alguma coisa com ele, {m:moço|moça}.',
        sangramento: 'Não.',
      },
      extra: [
        { id: 'celular', label: 'Ele tem celular? Ligou pra ele?', say: 'Ele tem celular? A senhora já ligou pra ele?', a: '{{Tem, mas ele deixa no criado-mudo|celular_casa}}. Tá aqui do meu lado, tocando à toa.' },
        {
          id: 'respirar',
          kind: 'acalmar',
          label: 'Respirar junto com ela',
          say: 'Dona Odila, respira comigo. Puxa o ar devagar... solta devagar... Ele pode ter parado na padaria, no amigo, no bar...',
          a: [
            '[ela solta o ar devagar]',
            'Tá... tá. Respirei.',
            '[{{ao fundo, o portão range; uma voz de homem: "Odila! Cheguei! Fiquei no bar do Zé vendo o jogo!"|portao}}]',
            'EUCLIDES? Seu velho sem-vergonha! ...Desculpa, {m:moço|moça}. Desculpa. Ele chegou.',
          ],
        },
      ],
      links: [
        { a: 'resp_curta', b: 'manual:ansiedade', insight: 'Respiração curta, coração na garganta, aperto de nervoso sem dor: ansiedade. Acalmar e respirar junto com ela (Manual p.5-B).' },
        { a: 'celular_casa', b: 'nao_voltou', kind: 'confirma', insight: 'Ele "sumiu" sem celular, num domingo de jogo. Atraso não é emergência; a aflição dela é o que precisa de cuidado agora.' },
      ],
      patient: { name: 'Odila Prado', age: 80, sex: 'F' },
      // RC22: "coração batendo na garganta" agora é "palpitação atual"; RC12: falta de ar acima de 60 anos. Os dois são
      // USI/USB. Ansiedade com gatilho claro, sem dor, frases inteiras: orientação preferida, USB ⚖ (antes era
      // excesso), como em d03_briga e d09_bruna.
      truth: { dx: 'Crise de ansiedade (marido atrasado)', sev: 'verde', ok: ['ORI', 'USB'], best: 'ORI', ref: ['CASA', 'UBS'], dest: ['UPA'] },
      radio: {
        ok: 'Central, {unit}. A senhora tá bem, {dr}: pressão boa, coração já calmo. O marido chegou do bar enquanto a gente media. Ela deu uma bronca nele na nossa frente.',
        excess: 'Central, {unit}. A senhora tá bem, {dr}. O marido chegou do bar enquanto a gente estacionava. Ela deu uma bronca nele na nossa frente.',
      },
      diary: {
        ori: 'Dona Odila, 80. O marido atrasou três horas depois da missa. Estava no bar, vendo o jogo.',
        alive: 'Dona Odila, 80. O marido atrasou três horas depois da missa. Chegou do bar enquanto a equipe media a pressão dela.',
      },
    }),
    // ----------------------------------------------------------------- 7 mão presa na masseira (USB + Bombeiros)
    call({
      id: 'd12_masseira',
      ref: 'D12 #6',
      at: '13:00',
      pool: 'trauma_moderado',
      num: '(17) 3321-1300',
      caller: 'Seu Manoel (dono da padaria)',
      callerName: 'Manoel',
      type: 'testemunha',
      voice: 'homem',
      note: 'Padaria. Funcionário com a mão presa na máquina.',
      noteWrong: 'Acidente na padaria, corte na mão. Leve.',
      addr: { rua: 'Av. Primavera', n: 1610, bairro: 'Jardim Primavera', ref: 'Padaria da esquina com a Jacarandá, entrada pelos fundos.' },
      amb: ['maquina', 'gritos'],
      open: [
        'Socorro! {{O meu padeiro prendeu a mão na masseira|presa}}! {{A mão tá lá dentro, presa no gancho|dentro}}! Eu desliguei a máquina, desliguei! Mas a mão não sai de jeito nenhum!',
        '[{{um homem grita de dor; outro tenta acalmar: "calma, Josué, calma"|grito}}]',
      ],
      q: {
        oque: 'Ele foi tirar a massa com a máquina ligada. O gancho pegou a mão e puxou até o pulso.',
        consciencia: 'Acordado, gritando. Tá branco.',
        respira: 'Respira, rápido.',
        idade: 'Trinta e cinco.',
        inicio: 'Agora. Cinco minutos.',
        sangramento: '{{Tá sangrando, mas não muito|sangue_pouco}}. A mão tá esmagada, {m:moço|moça}, roxa.',
        historico: 'Nada. Saudável.',
        seguranca: '{{A máquina tá desligada da tomada|desligada}}. Mas a mão não sai. A gente tentou girar o gancho e ele gritou. Pra soltar, só desmontando a máquina, e aqui ninguém tem ferramenta pra isso.',
        paciente: '[{{gritos; depois, entre dentes: "tira, pelo amor de Deus, tira"|tira}}]',
        referencia: 'Padaria da esquina com a Jacarandá. Entra pelos fundos, pelo portão da farinha.',
      },
      extra: [{ id: 'nao_puxar', kind: 'fala', label: 'Orientar: não forçar', say: 'Não puxem a mão e não girem a máquina. Deixem desligada da tomada. Os Bombeiros vão desmontar a peça.', a: 'Tá, tá. Ninguém mexe! Ouviu, Zé? Ninguém mexe!' }], // Conferido (campo B5/AT23: no esmagamento, a equipe hidrata antes de liberar o membro, então ninguém força a liberação; regimento, art. 26: Bombeiros como parceiros no resgate)
      links: [
        { a: 'desligada', b: 'dentro', insight: 'Máquina desligada, mas a mão não sai: isso é resgate. Bombeiros (193) para desmontar a peça, USB para o paciente.' },
        { a: 'dentro', b: 'sangue_pouco', insight: 'Mão presa até o pulso, sangrando pouco, acordado: a viatura cuida da dor e do choque. Quem tira a mão de dentro da máquina são os Bombeiros.' },
      ],
      patient: { name: 'Josué Pereira', age: 35, sex: 'M' },
      // [validar] RC24: mão "esmagada, roxa" é "comprometimento vascular distal" (USA); dor intensa é USI/USB. O esmagamento
      // com encarceramento (AT23) é conduta de USA. USB + Bombeiros preferida, USA ⚖, como em d09_cida_b. Equipe: a USA
      // deveria ser a preferida?
      truth: { dx: 'Mão presa em masseira (esmagamento) com necessidade de desencarceramento', sev: 'amarelo', ok: ['USB', 'USA'], best: 'USB', sup: ['BOMB'], dest: ['REG'], risk: { good: 100, bad: 260, needs: 'USB' } },
      radio: {
        ok: 'Central, {unit} com os Bombeiros. Desmontaram o gancho, mão liberada. Analgesia feita. Seguimos Regional; a ortopedia já foi avisada. O dono da padaria mandou pão pra equipe.',
        unsafe: 'Central, {unit} na padaria. A mão tá presa na máquina e a gente não tem ferramenta pra desmontar! Precisamos dos Bombeiros, agora!',
      },
      diary: { alive: 'Josué, 35, padeiro. Mão presa na masseira num domingo de manhã. Os Bombeiros desmontaram a máquina.' },
    }),
    // ----------------------------------------------------------------- 8 dor no peito após cocaína (USA → REG)
    call({
      id: 'd12_cocaina',
      ref: 'D12 #7',
      at: '14:10',
      pool: 'cardio,intox',
      num: '(17) 99840-1410',
      caller: 'Felipe (amigo)',
      callerName: 'Felipe',
      type: 'comum',
      voice: 'jovem_h',
      note: 'Rapaz. Amigo com dor no peito. Diz que "só bebeu".',
      noteWrong: 'Rapaz bêbado com dor de barriga. Leve.',
      addr: { rua: 'Rua das Exposições', n: 2780, bairro: 'Parque das Exposições', ref: 'Kitnet do fundo, depois do lava-rápido.' },
      amb: ['musica', 'respiracao'],
      open: [
        'Ô, {m:moço|moça}, o meu amigo tá com {{uma dor no peito muito forte|dor_peito}}, {{o coração tá disparado|disparado}}, ele tá suando. A gente {{só bebeu|so_bebeu}}, juro. Desde ontem, no baile.',
        '[{{música alta de fundo, alguém abaixa; uma respiração rápida, ofegante|resp}}]',
      ],
      q: {
        oque: 'Ele tava sentado e do nada pôs a mão no peito. Diz que aperta, que vai pro braço.',
        consciencia: 'Acordado, assustado. Diz que vai morrer.',
        respira: 'Rápido. Ofegante.',
        idade: 'Vinte e quatro.',
        inicio: 'Faz uns vinte minutos.',
        dorpeito: '{{Vai pro braço esquerdo e pro queixo|irradia}}. {{Tá suando frio, todo molhado|suor}}.',
        historico: 'Nada! Ele é novo, {m:moço|moça}, ele joga bola!',
        sangramento: 'Não.',
        seguranca: 'Seguro. {{Não precisa chamar polícia, né?|policia}}',
        paciente: ['VINÍCIUS: Eu vou... morrer, cara... o coração... tá...', 'VINÍCIUS: {{Fala pra ele, Felipe. Fala o que a gente usou.|fala_pra_ele}}'],
      },
      extra: [
        { id: 'policia_q', kind: 'fala', label: 'Tranquilizar sobre a polícia', say: 'Felipe, a ambulância vai sem polícia. Ninguém vai ser preso. A gente só quer que ele fique vivo.', a: 'Tá. Tá bom. Obrigado, {dr}.', unlocks: ['usou'] },
        {
          id: 'usou',
          locked: true,
          // 1.1: o amigo pede pra contar ("fala o que a gente usou") quando você fala com o paciente
          unlockedBy: ['paciente'],
          label: '"Ele usou alguma droga?"',
          say: 'Eu não sou polícia. Pra ajudar, eu preciso saber: ele usou alguma droga?',
          a: ['[silêncio]', '{{...Cocaína. A noite toda. Ele cheirou de novo agora de manhã.|cocaina}}', 'Não chama a polícia, pelo amor de Deus.'],
        },
      ],
      links: [
        { a: 'so_bebeu', b: 'fala_pra_ele', insight: '"A gente só bebeu"... e o próprio amigo pede: "fala o que a gente usou".', unlock: 'usou' },
        { a: 'irradia', b: 'manual:peito', insight: 'Dor no peito irradiando para braço e queixo, com suor frio. Ele é jovem, mas a cocaína derruba a regra da idade: risco de infarto (Manual p.3).' }, // Conferido (RC17: aperto irradiando para braço e queixo, com suor frio, é "dor precordial típica" → USA; RT5: cocaína com sudorese fria é USA/USI)
        { a: 'cocaina', b: 'dor_peito', insight: 'Dor no peito e coração disparado depois de cocaína: risco cardíaco real em qualquer idade. Vermelho → USA → Regional.' },
      ],
      patient: { name: 'Vinícius Cardoso', age: 24, sex: 'M' },
      truth: { dx: 'Dor torácica após uso de cocaína (risco de infarto e arritmia)', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 60, bad: 150 } },
      radio: {
        ok: '{central}, {unit} no local. Dor torácica pós-cocaína, taquicárdico, eletro alterado. Medicado, seguimos Regional. Falei pro amigo que ninguém aqui é polícia. Ele chorou.',
        under: '{unit}: dor torácica pós-cocaína, eletro alterado! Precisamos de USA!',
      },
      diary: { alive: 'Vinícius, 24. Cocaína e dor no peito. O amigo mentiu primeiro, por medo da polícia, e depois contou.' },
    }),
    // ----------------------------------------------------------------- 9 trote
    call({
      id: 'd12_trote',
      ref: 'D12 #8',
      at: '15:25',
      pool: 'trote',
      num: '(17) 99603-5520',
      caller: 'Voz de adolescente',
      callerName: 'Garoto',
      type: 'trotista',
      voice: 'adolescente',
      note: 'Diz que uma capivara atacou o primo. Tem risada.',
      noteWrong: 'Mordida de animal, sangrando muito!',
      addr: { rua: 'Rua do Parque', n: 1201, bairro: 'Parque das Exposições' },
      amb: ['risadas', 'rua'],
      open: [
        'Alô, emergência! {{Uma capivara atacou o meu primo|capivara}} aqui no Parque de Exposições! Ela mordeu a bunda dele e saiu correndo!',
        '[{{gargalhada abafada de duas pessoas; uma delas tenta parar e não consegue|gargalhada}}]',
      ],
      q: {
        oque: 'Ele foi fazer carinho e ela mordeu! A capivara era desse tamanho! [risada]',
        consciencia: 'Tá acordado, chorando! [risada] Não, tá desmaiado!',
        respira: 'Respira pela... pela boca!',
        idade: 'Dezesseis. Dezoito. Sei lá.',
        sangramento: 'Muito! Tá jorrando! [{{explosão de riso|riso_alto}}]',
        paciente: '[{{"Fala que a capivara tinha raiva!" — e mais risada|raiva}}]',
        referencia: 'Do lado do lago. Do lado da capivara.',
        seguranca: 'Seguro, a capivara já fugiu!',
      },
      callback: ['[{{"O número chamado não existe."|retorno_inexistente}}]'],
      links: [
        { a: 'capivara', b: 'gargalhada', insight: 'Mordida de capivara "na bunda" e uma gargalhada que não para: trote clássico.' },
        { a: 'retorno_inexistente', b: 'num', insight: 'Ligar de volta: número inexistente. Chip descartável.' },
      ],
      patient: { name: '"Primo mordido pela capivara"' },
      truth: { dx: 'Trote', sev: 'trote', ok: ['TROTE'], prankKind: 'trote' },
      radio: { prank: 'Central, {unit} no Parque de Exposições. Tem capivara, sim, umas oito, dormindo na beira do lago. Ninguém mordido. Trote.' },
    }),
    // ----------------------------------------------------------------- 10 soluço há dois dias
    call({
      id: 'd12_soluco',
      ref: 'D12 #9',
      at: '16:35',
      pool: 'leve',
      num: '(17) 3324-1630',
      caller: 'Seu Nilton',
      callerName: 'Seu Nilton',
      type: 'comum',
      voice: 'idoso',
      note: 'Senhor com soluço. Há dois dias.',
      noteWrong: 'Senhor com falta de ar, não consegue falar direito!',
      addr: { rua: 'Rua Paineira', n: 760, bairro: 'Santa Luzia', ref: 'Casa com o carro velho azul na garagem.' },
      amb: ['tv'],
      open: ['Boa tarde, {dr}, desculpa inco- [hic] -modar. É que eu tô com esse {{soluço faz dois dias|dois_dias}}. Não para nem pra [hic] dormir.'],
      q: {
        oque: 'Soluço. [hic] Já tentei de tudo: susto, água de cabeça pra baixo, açúcar na língua, prender o ar. [hic]',
        consciencia: 'Acordado. Cansado de soluçar.',
        respira: 'Respiro entre um [hic] e outro.',
        idade: 'Sessenta e sete.',
        inicio: 'Sexta de manhã.',
        dorpeito: '{{Dor no peito não|sem_dor}}. Só a barriga dolorida de tanto [hic].',
        historico: 'Pressão. E refluxo. [hic] Comi uma feijoada na sexta, foi depois dela.',
        fast: 'Sorrio, [hic], levanto os braços, "o céu é azul", [hic]. Tudo certo.',
        sangramento: 'Não.',
        paciente: 'Sou eu mesmo. [hic] Desculpa.',
      },
      extra: [{ id: 'sinais', label: 'Vômito, febre, falta de ar, fraqueza?', say: 'O senhor tem vômito, febre, falta de ar, fraqueza num lado do corpo?', a: '{{Nada disso|nada}}. Só o [hic]. Tô comendo, tô andando, tô reclamando. Minha mulher que mandou ligar.' }],
      links: [{ a: 'nada', b: 'manual:verde', insight: 'Soluço há dois dias, sem dor no peito, sem falta de ar, sem sinal neurológico: verde. Orientar UBS (Manual p.1).' }],
      patient: { name: 'Nilton Barbosa', age: 67, sex: 'M' },
      truth: { dx: 'Soluço persistente sem sinais de gravidade', sev: 'verde', ok: ['ORI'], ref: ['UBS', 'UPA'] },
      radio: { excess: 'Central, {unit}. Soluço, {dr}. [hic] Desculpa, ele passou pra gente. Liberamos.' },
      diary: { ori: 'Seu Nilton, 67. Soluço desde a feijoada de sexta. Pedia desculpa a cada "hic".' },
    }),
  ],
  // 19:00 — a sindicância do Henrique
  endScene: (c) => {
    const y = yuri(c);
    return {
      id: 'd12_sindicancia',
      bg: 'central',
      cast: ['HENRIQUE', 'SIMONE'],
      nodes: {
        start: {
          lines: [
            { who: 'NARRADOR', t: '19:04. Troca de turno. A Simone desliga o computador e não levanta da cadeira.' },
            { who: 'NARRADOR', t: 'O Henrique está encostado na porta. Barba feita, camisa passada. Menta. Ele não tirou o casaco.' },
            y
              ? { who: 'HENRIQUE', t: 'A sindicância é do Yuri. Quinze anos. Ficou na sua fila às seis e vinte e passou pra mim às sete. Eu orientei soro e UBS.' }
              : { who: 'HENRIQUE', t: 'A sindicância é da Dona Rosa. Sessenta e oito. Eu orientei soro e UBS às duas da manhã.' },
            { who: 'HENRIQUE', t: 'A auditoria vai ouvir a gravação, mas quem fecha o parecer técnico é o regulador do dia. O Peixoto mandou pra você.' },
            { who: 'HENRIQUE', t: 'É um campo só, {nome}. "O paciente relatou sangramento na triagem inicial?" Você marca "não", e eu volto pro noturno amanhã. Ninguém mais perde nada.' },
            { who: 'HENRIQUE', t: 'E não me olha desse jeito. Você também já ajeitou ficha, {nome}. Eu vi o dia 9.', when: is.flag('mentiu_9B') },
            { who: 'HENRIQUE', t: 'Você foi {m:o único|a única} que perguntou se eu tava bem. Lembra? Pois é. Não tô.', when: is.flag('henrique_perguntado') },
            { who: 'HENRIQUE', t: 'E a sua mãe... eu sei que fui eu que atendi. Eu não lembro de nada daquela noite, {nome}. Nada.', when: is.flag('henrique_atendeu_zelia') },
            { who: 'EU', t: 'Tá escrito na nota, Henrique: "sangrou o nariz e a gengiva". É a letra da Simone.', when: (cc) => cc.flag('viu_ficha_sindicancia') && y },
            { who: 'HENRIQUE', t: 'Nota de TARM se corrige. A Simone entende.', when: (cc) => cc.flag('viu_ficha_sindicancia') && y },
            { who: 'SIMONE', t: '(sem levantar os olhos) A Simone não entende, não.', when: (cc) => cc.flag('viu_ficha_sindicancia') && y },
            { who: 'EU', t: 'Tá escrito na nota da triagem, Henrique: "gengiva sangrando, tonta".', when: (cc) => cc.flag('viu_ficha_sindicancia') && !y },
            { who: 'HENRIQUE', t: 'A Cleide escreve o que ouve. Eu regulo o que entendo.', when: (cc) => cc.flag('viu_ficha_sindicancia') && !y },
          ],
          choices: [
            { label: 'Marcar "não" no sistema. Encobrir.', next: 'encobre' },
            { label: '"Relatou, Henrique. Eu vou escrever a verdade no parecer."', next: 'denuncia' },
            { label: '"Eu não vou assinar nada. Nem pra um lado, nem pro outro."', next: 'omite' },
          ],
        },
        encobre: {
          onEnter: (e) => {
            e.add('integridade', -3, 'encobriu o Henrique');
            e.add('lealHenrique', 3, 'você o encobriu');
            e.add('lealSimone', y ? -2 : -1, 'a Simone viu');
            e.set('encobriu_henrique');
          },
          lines: [
            { who: 'NARRADOR', t: 'Você abre a ficha. O campo pisca, esperando. Você marca "não". O sistema confirma com um bipe educado.' },
            { who: 'HENRIQUE', t: 'Te devo uma. (pausa) Não. Te devo tudo.' },
            y
              ? { who: 'NARRADOR', t: 'A Simone pega a bolsa e sai sem dar boa noite. A nota dela continua lá, na ficha original, com a letra redonda dela. Ninguém vai ler.' }
              : { who: 'NARRADOR', t: 'A Simone pega a bolsa e sai sem dar boa noite.' },
            { who: 'NARRADOR', t: 'O Henrique assume o noturno às 19:10. Antes de sentar, joga uma bala de menta na boca. Depois, outra.' },
          ],
        },
        denuncia: {
          onEnter: fx.all(fx.add('integridade', 2, 'parecer verdadeiro'), fx.set('denunciou_henrique'), fx.set('henrique_afastado'), fx.unset('henrique_piorando'), fx.ach('denunciou')),
          lines: [
            { who: 'EU', t: 'Relatou, Henrique. Tá na nota e vai estar na gravação. E você não tava em condição de regular naquela noite.' },
            { who: 'EU', t: 'Nem na noite da minha mãe.', when: is.flag('henrique_atendeu_zelia') },
            { who: 'HENRIQUE', t: '(um silêncio comprido) Você sabe o que acontece comigo agora.' },
            { who: 'EU', t: 'Sei. Você vai ser afastado. E vai ter tratamento. É o que eu ia querer que fizessem comigo.' },
            { who: 'NARRADOR', t: 'O Peixoto desce às 19:40. Lê o parecer duas vezes, tira os óculos, lê de novo. Recolhe o crachá do Henrique "até segunda ordem" e o encaminha para a medicina do trabalho.' },
            { who: 'SIMONE', t: 'Ele tem dois filhos, {dr}.' },
            { who: 'SIMONE', t: '(pausa) E eu tenho um menino que anda de moto de madrugada. Se o Wesley ligar aqui às três da manhã, eu quero alguém sóbrio do outro lado.' },
            { who: 'NARRADOR', t: 'Ela diz as duas coisas com a mesma voz. Você não sabe qual das duas ela quer que você escute.' },
            { who: 'HENRIQUE', t: '(na porta, sem se virar) Eu vou te odiar por um tempo, {nome}.' },
            { who: 'NARRADOR', t: 'O noturno é coberto por uma substituta de Rio Claro de Minas, a Dra. Paula. Ela chega às 20:15, pedindo desculpa pelo trânsito.' },
          ],
        },
        omite: {
          onEnter: fx.set('omitiu_henrique'),
          lines: [
            { who: 'HENRIQUE', t: 'Isso é um sim ou um não?' },
            { who: 'EU', t: 'É um "não é comigo".' },
            { who: 'NARRADOR', t: 'O parecer fica em branco. Na segunda, a sindicância é arquivada por "insuficiência de manifestação técnica". Ninguém assina nada. Ninguém perde nada.' },
            { who: 'NARRADOR', t: 'O Henrique assume o noturno às 19:15. Quando ele aperta a sua mão, a dele treme.' },
            { who: 'SIMONE', t: '(vestindo o casaco) Quem cala consente, {dr}. Minha avó dizia.' },
          ],
        },
      },
    };
  },
  interlude: {
    teaser: (c) => (is.present('lucia')(c) ? '{Oconj} chega tarde. Diz que foi no centro.' : 'A casa está quieta demais.'),
    familyLacos: 1,
    scene: (c) => (is.present('lucia')(c) ? PROPOSTA : CASA_VAZIA),
    bico: (c) =>
      is.present('lucia')(c)
        ? {
            id: 'd12_bico',
            bg: 'preto',
            nodes: {
              start: {
                onEnter: luciaDecide,
                lines: [
                  { who: 'NARRADOR', t: 'Quando você chega da ambulância, de madrugada, a casa está escura.' },
                  { who: 'NARRADOR', t: 'Na mesa da cozinha, um bilhete preso pelo pote de açúcar, com a letra caprichada {doconj}:', when: is.flag('lucia_fora') },
                  { who: 'LUCIA', t: '"Arrumei serviço em Rio Claro de Minas. Fábrica, carteira assinada. Vou pra casa da minha irmã e levo o Liam. Eu tentei te contar. Você tava na central até quando estava aqui. — {c:L|A}."', when: is.flag('lucia_fora') },
                  { who: 'NARRADOR', t: 'Embaixo, com letra de oito anos: "Volto logo. Liam." E um desenho de ônibus.', when: is.flag('lucia_fora') },
                  { who: 'NARRADOR', t: 'No lixo da cozinha, embaixo da casca de batata, uma passagem de ônibus rasgada em quatro: Santa Aurora → Rio Claro de Minas.', when: is.flag('lucia_recusou_sozinha') },
                  { who: 'NARRADOR', t: '{Oconj} está dormindo de costas para a porta. Você não pergunta. {c:Ela|Ele} nunca conta.', when: is.flag('lucia_recusou_sozinha') },
                ],
              },
            },
          }
        : {
            id: 'd12_bico',
            bg: 'preto',
            nodes: {
              start: {
                lines: [
                  { who: 'NARRADOR', t: 'Quando você chega da ambulância, de madrugada, a casa está escura e a geladeira faz o único barulho da cozinha.' },
                ],
              },
            },
          },
  },
});
