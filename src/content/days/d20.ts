// =============================================================================
// DIA 20 — "Último Plantão" (todas as regras, Regional sem vaga, sem interlúdio)
// Colheitas: 🌾 Seu Antônio (agradece) ou a viúva · 🌾 Henrique (a ligação das 18:58,
// conforme o dia 12) · 🌾 Bené (última corrida, despedida no rádio) · 🌾 Simone
// (último post-it) · ↺ Wellington e o semáforo do dia 1 (se o Henrique foi denunciado).
// O noturno não chega às 19:00: o plantão só acaba às 19:25 (script 'noturno').
// Às 18:56 a USA 01 é liberada, se estiver presa em hospital, para a última corrida.
// =============================================================================
import type { CallRT, Ctx, DLine, SceneDef, LineIn } from '../../engine/types';
import type { DeskDoc, GuideScript } from '../../engine/content-api';
import { hm, fmtTime } from '../../engine/util';
import { day, call, fx, is, NUM, ADDR } from '../dsl';

const rtOf = (c: Ctx, defId: string): CallRT | undefined => (c.s.shift ? Object.values(c.s.shift.calls).find((x) => x.def === defId) : undefined);
const henriqueNoturno = (c: Ctx) => !c.flag('denunciou_henrique');
const finalId = (c: Ctx) => (henriqueNoturno(c) ? 'd20_final' : 'd20_final_rua');
const foiBene = (c: Ctx, id: string) => rtOf(c, id)?.decision?.unit === 'USA01';

export const DOCS_EXTRA: Record<string, DeskDoc> = {
  escala_noturno: {
    id: 'escala_noturno',
    title: 'Escala do noturno (mural da central)',
    text: (c) =>
      c.flag('denunciou_henrique')
        ? 'ESCALA — NOTURNO. Dr. Henrique Lacerda: AFASTADO (licença para tratamento). Substituta: Dra. Paula. Contato de emergência do titular: Rua XV de Novembro, 1950, ap. 302 (Ed. Aurora).'
        : 'ESCALA — NOTURNO. Segunda a sexta: Dr. Henrique Lacerda — Rua XV de Novembro, 1950, ap. 302 (Ed. Aurora). Em caso de atraso, avisar a coordenação.',
    clues: [{ id: 'doc:henrique_end', text: 'Escala: Dr. Henrique Lacerda — Rua XV de Novembro, 1950, ap. 302 (Edifício Aurora)' }],
  },
};

export const GUIDES_EXTRA: Record<string, GuideScript> = {
  // Conferido (RO2: prolapso de cordão → USA; campo B4/AGO9: a equipe usa decúbito lateral esquerdo com Trendelenburg e
  // empurra a apresentação; por telefone, joelhos e peito no chão tiram o peso do cordão; não manipular, cobrir com pano
  // morno e úmido, não fazer força).
  prolapso: {
    id: 'prolapso',
    title: 'Orientação: cordão saindo antes do bebê',
    kind: 'dialogo',
    intro: 'A cada contração, o bebê aperta o próprio cordão. Tire o peso de cima dele até a USA chegar.',
    panic: 80,
    steps: [
      {
        say: 'Tá saindo um cordão! O bebê não saiu ainda!',
        options: [
          { label: 'Ela fica de joelhos, com o peito encostado no chão e o quadril pro alto. Agora.', kind: 'certo' },
          { label: 'Empurra o cordão de volta pra dentro.', kind: 'errado', reply: 'Eu tentei e ela gritou!' },
          { label: 'Puxa o cordão devagarinho, pra ajudar.', kind: 'errado', reply: 'Ele tá pulsando na minha mão!' },
        ],
      },
      {
        say: 'Ela tá de joelhos! E o cordão?',
        options: [
          { label: 'Não aperte nem puxe. Cubra com um pano limpo molhado em água morna.', kind: 'certo' },
          { label: 'Amarra com um barbante.', kind: 'errado' },
          { label: 'Você está indo muito bem. Respira comigo.', kind: 'calma' },
        ],
      },
      {
        say: 'Ela quer fazer força! Tá gritando que vai fazer força!',
        options: [
          { label: 'Não pode fazer força. A cada contração, respira curtinho, soprando.', kind: 'certo' },
          { label: 'Faz força, que nasce logo.', kind: 'errado', reply: 'O cordão ficou roxo!' },
          { label: 'Eu tô aqui. A equipe tá chegando.', kind: 'calma' },
        ],
      },
      {
        say: 'Tô ouvindo a sirene!',
        options: [
          { label: 'Ela continua nessa posição até a equipe mandar mudar. Abre a porta.', kind: 'certo' },
          { label: 'Levanta ela e leva até a porta.', kind: 'errado' },
        ],
      },
    ],
    success: 'A posição tirou o peso de cima do cordão até a equipe chegar.',
    fail: 'A orientação teve falhas. O cordão ficou apertado por mais tempo.',
  },
  // Conferido (campo A12: não provocar vômito, nada pela boca, posição de recuperação, guardar a cartela e a caixa;
  // RT5: sonolência depois da ingestão → USA).
  intox_remedio: {
    id: 'intox_remedio',
    title: 'Orientação: criança que engoliu comprimidos',
    kind: 'dialogo',
    intro: 'Remédio de adulto em criança. Não provoque vômito, deixe de lado, guarde a cartela, observe a respiração.',
    panic: 75,
    steps: [
      {
        say: 'Ele tá mole, com sono... eu enfio o dedo pra ele vomitar?',
        options: [
          { label: 'Não. Não provoque vômito e não dê nada pela boca.', kind: 'certo' },
          { label: 'Isso, faz ele vomitar tudo.', kind: 'errado', reply: 'Ele engasgou com o vômito!' },
          { label: 'Calma. Eu fico com você até a ambulância chegar.', kind: 'calma' },
        ],
      },
      {
        say: 'Ele dormiu no sofá, de barriga pra cima...',
        options: [
          { label: 'Vira ele de lado, com o rosto voltado pro chão, e fica do lado dele.', kind: 'certo' },
          { label: 'Deixa ele dormir, que passa.', kind: 'errado', reply: 'Ele tá roncando estranho...' },
          { label: 'Sacode ele pra acordar.', kind: 'errado' },
        ],
      },
      {
        say: 'Achei a caixa! Faltam seis da cartela!',
        options: [
          { label: 'Guarda a cartela e a caixa pra entregar pra equipe. Me avisa se a respiração mudar.', kind: 'certo' },
          { label: 'Joga fora, não precisa.', kind: 'errado' },
        ],
      },
      {
        say: 'Ele tá respirando... devagar.',
        options: [
          { label: 'Conta as respirações em voz alta pra mim. A equipe tá chegando.', kind: 'certo' },
          { label: 'Dá leite pra cortar o efeito.', kind: 'errado' },
        ],
      },
    ],
    success: 'Sem vômito provocado, de lado, cartela guardada: a equipe recebeu tudo certo.',
    fail: 'Houve erro na orientação, mas a equipe chegou.',
  },
};

// -----------------------------------------------------------------------------
// Fim do turno: a última corrida, o noturno, o último post-it
// -----------------------------------------------------------------------------
function fimD20(c: Ctx): SceneDef {
  const hen = henriqueNoturno(c);
  const id = finalId(c);
  const rt = rtOf(c, id);
  const salvou = rt?.outcome === 'salvo';
  const bene = foiBene(c, id);
  const ib = c.v('intimBene');
  const hora = c.s.shift ? fmtTime(Math.max(c.s.shift.time, hm('19:25'))) : '19:30';
  // A Simone fica com lealdade 6 ou mais e a matéria publicada. Ninguém setava "simone_demitida" antes desta cena: agora
  // ela registra o desfecho (no onEnter abaixo), e o epílogo (endings.ts) lê a mesma condição.
  const fica = c.v('lealSimone') >= 6 && c.flag('materia_publicada');
  const ls = c.v('lealSimone');

  const desfecho: DLine[] = hen
    ? salvou
      ? [
          { who: 'NARRADOR', t: 'O Henrique foi para o Regional intubado, com pulso. A Dona Iolanda ligou de novo, só pra perguntar se ele tava vivo. Você disse que sim.' },
          { who: 'NARRADOR', t: 'Na ficha dele, alguém da equipe escreveu: "intoxicação alcoólica, PCR revertida". Agora está escrito. Ninguém vai conseguir encobrir.' },
        ]
      : [
          { who: 'NARRADOR', t: 'O crachá do Henrique ficou no chão do 302, do lado do sofá. Alguém da equipe trouxe de volta e deixou na sua mesa, sem dizer nada.' },
          { who: 'NARRADOR', t: 'A foto do crachá é de quando ele era novo na central. Ele está sorrindo.' },
        ]
    : salvou
      ? [
          { who: 'NARRADOR', t: 'O Seu Dito, o gari, foi para o Regional com pulso. O Wellington ficou na calçada com as mãos tremendo e a vassoura do Seu Dito na mão.' },
          { who: 'NARRADOR', t: 'O mesmo semáforo do seu primeiro dia. Desta vez, quem estava na calçada sabia contar.' },
        ]
      : [
          { who: 'NARRADOR', t: 'O Seu Dito não voltou. O Wellington contou até o fim, com as mãos certas no lugar certo. Você ouviu ele contar.' },
          { who: 'NARRADOR', t: 'Às vezes se faz tudo certo. O manual não tem uma página pra isso.' },
        ];

  const benePalavras: DLine[] = bene
    ? [
        { who: 'BENE', t: salvou ? 'Central, USA 01. Paciente entregue no Regional. Com pulso. Viatura limpa, tanque cheio pro próximo.' : 'Central, USA 01. Viatura na base. Limpa, tanque cheio pro próximo.' },
        { who: 'BENE', t: 'Trinta e um anos, quatro meses e onze dias. A última foi com você, {bene}. Eu queria que fosse.' },
      ]
    : [
        { who: 'BENE', t: 'Central, USA 01 na base. Não deu pra ser a gente na última, né? Tudo bem.' },
        { who: 'BENE', t: 'A última de verdade é a que chega. Não importa quem leva.' },
      ];
  if (ib >= 7) benePalavras.push({ who: 'BENE', t: 'Trinta e um anos de rádio e eu nunca falei o nome de um regulador no ar. Vou falar agora: obrigado, {nome}. Churrasco domingo lá em casa. Não é convite, é ordem.' });
  else if (ib >= 3) benePalavras.push({ who: 'BENE', t: '{Dr}... foi bom trabalhar com você. Foi bom chegar a tempo, das vezes que deu.' });
  else benePalavras.push({ who: 'BENE', t: 'Boa noite, Central.' });
  if (c.flag('vaquinha_bene')) benePalavras.push({ who: 'BENE', t: 'E obrigado pelo bolo. Alguém me disse que teve dez reais da central nele.' });
  benePalavras.push({ who: 'BENE', t: 'USA 01, Benedito. QRT. Desligando.' });

  return {
    id: 'd20_fim',
    bg: 'central',
    cast: ['SIMONE'],
    nodes: {
      start: {
        lines: [{ who: 'NARRADOR', t: `${hora}. A fila está vazia. Pela primeira vez em vinte plantões, nenhuma luz pisca no telefone.` }, ...desfecho],
        onEnter: (e) => {
          const r = rtOf(e, finalId(e));
          const ok = r?.outcome === 'salvo';
          if (henriqueNoturno(e)) {
            if (ok) {
              e.unset('henrique_morreu');
              e.set('henrique_sobreviveu');
            } else e.set('henrique_morreu');
          }
          if (r?.decision?.unit === 'USA01') e.set('bene_ultima');
          if (!fica) e.set('simone_demitida');
        },
        next: 'bene',
      },
      bene: {
        lines: [...benePalavras, { who: 'NARRADOR', t: 'O rádio chia mais um segundo. Depois, o silêncio de um rádio desligado de propósito.' }],
        next: 'noturno',
      },
      noturno: {
        lines: hen
          ? salvou
            ? [
                { who: 'NARRADOR', t: 'Quem senta na cadeira do noturno é o Dr. Castro, da USA 01, ainda de macacão.' },
                { who: 'CASTRO', t: 'A coordenação mandou eu ficar até acharem alguém. Vai pra casa, {dr}. Ele vai ficar internado um tempo. Depois, tratamento. Dessa vez está escrito.' },
              ]
            : [
                { who: 'NARRADOR', t: 'Quem senta na cadeira do noturno é o Dr. Castro, da USA 01, ainda de macacão. Ele senta devagar, como se a cadeira pudesse reclamar.' },
                { who: 'CASTRO', t: '...Eu fico, {dr}. Vai.' },
              ]
          : [
              { who: 'NARRADOR', t: 'A Dra. Paula entra correndo, a bolsa aberta, o crachá pendurado do avesso.' },
              { who: 'PAULA', t: 'Desculpa, desculpa! Carreta tombada na rodovia, na divisa. Uma hora parada no meio do nada. (ela para e olha pra você) O que aconteceu?' },
              { who: 'EU', t: 'Uma parada. Na Av. Brasil. No mesmo semáforo do meu primeiro dia.' },
              { who: 'PAULA', t: 'Vai pra casa. Eu assumo. (pausa) O Henrique ligou de novo hoje, pra clínica. Mandou dizer que tá no dia doze.' },
            ],
        next: 'postit',
      },
      postit: {
        lines: [
          { who: 'NARRADOR', t: 'Quando você levanta, tem um post-it amarelo colado no fone. A letra da Simone.' },
          { who: 'SIMONE', t: '"{Dr}: os post-its eram meus. As decisões eram suas. Foi uma honra ouvir você trabalhar. — S."', when: () => ls >= 8 },
          { who: 'SIMONE', t: '"Bom plantão, {dr}. Até segunda. Ou não. — S."', when: () => ls >= 5 && ls < 8 },
          { who: 'SIMONE', t: '"Seu café ficou na minha mesa de novo. — S."', when: () => ls < 5 },
          { who: 'SIMONE', t: '"P.S.: Fico. Me chamaram pra supervisão. Ninguém sabe ainda."', when: () => fica },
          { who: 'SIMONE', t: '"P.S.: Dia 31 é o meu último dia. Não conta pra ninguém."', when: () => !fica },
          { who: 'SIMONE', t: '"P.P.S.: Tô tomando o remédio da pressão. Todo dia. Você mandou."', when: () => c.flag('simone_crise_ok') },
          { who: 'NARRADOR', t: 'Do lado do post-it, a bala de menta que o Henrique esqueceu de manhã.', when: () => hen },
        ],
        next: 'fim',
      },
      fim: {
        lines: [
          { who: 'NARRADOR', t: 'Você prometeu chegar cedo. Já são quase oito. O ônibus da Av. Brasil passa às oito e dez.', when: (cc) => cc.flag('prometeu_cedo') },
          { who: 'NARRADOR', t: 'Lá fora, o ônibus da Av. Brasil passa às oito e dez.', when: (cc) => !cc.flag('prometeu_cedo') },
          { who: 'NARRADOR', t: 'Você pendura o fone no gancho. Ele não toca. Por enquanto.' },
        ],
      },
    },
  };
}

// -----------------------------------------------------------------------------
const conversaAntonio = (c: Ctx): LineIn[] => {
  const j = c.key('juliana');
  const linhas: LineIn[] = ['Tô bem, {dr}. Voltei a pescar no açude. Peguei uma tilápia deste tamanho. A Rosa diz que é mentira.'];
  if (c.flag('antonio_parou')) linhas.push('A Rosa até hoje conta "um, dois, três" baixinho quando lava a louça. Diz que aprendeu com {m:o senhor|a senhora}, no telefone, comigo no chão da cozinha.');
  if (j === 'salvo') linhas.push(c.flag('juliana_cliente') && !c.flag('lucia_foi_embora') ? 'A Juliana, minha filha, mandou um beijo. Diz que vai encher {c:a sua esposa|o seu marido} de encomenda de costura.' : 'A Juliana, minha filha, mandou um beijo. Quebrou três costelas naquele show, mas tá aqui.');
  else if (j === 'perdido') linhas.push('A Juliana... a minha filha... {m:o senhor|a senhora} sabe, né. O show.', '[pausa comprida]', 'Eu tô vivo pra chorar por ela. Isso eu devo a vocês. Não sei se agradeço ou se peço desculpa por estar vivo.');
  else linhas.push('A minha filha mandou um beijo. Ela vive dizendo pra eu ir no médico. Agora eu vou.');
  linhas.push('Desculpa tomar o seu tempo, {dr}. Pode ir salvar mais um.');
  return linhas;
};

export const DAY = day({
  day: 20,
  title: 'Último Plantão',
  weekday: 'Sexta-feira',
  weather: 'Sol de outono, 26 °C. Céu limpo, sem nenhuma nuvem.',
  noVacancy: true,
  onStart: (e) => {
    e.doc('escala_noturno');
    e.doc('ramais_central');
    if (e.flag('vaga_zero_negociada')) e.achievement('vaga_zero');
    // "Ela Só Queria Conversar": conversou em todos os dias em que ela ligou
    let ligou = 0;
    let sempre = true;
    for (let d = 1; d <= 19; d++) {
      if (!e.flag(`cida_ligou_d${d}`)) continue;
      ligou++;
      if (!e.flag(`cida_conversou_d${d}`)) sempre = false;
    }
    if (ligou >= 3 && sempre) e.achievement('ela_so_queria_conversar');
  },
  newspaper: (c) => {
    const cida = c.key('cida');
    let headline: string;
    let sub: string;
    if (cida === 'salvo' && c.flag('cida_reconhecida')) {
      headline = 'Regulador reconhece AVC pela voz de idosa que ligava todo dia';
      sub = 'Dona Aparecida, 79, está internada no Regional e já pergunta pelo gato. "Ela disse que só queria ouvir uma voz", conta a equipe da USA.';
    } else if (cida === 'salvo') {
      headline = 'Idosa que mora sozinha sofre AVC e é salva pela Regulação na Bela Vista';
      sub = 'Dona Aparecida, 79, ligou para a emergência com a fala arrastada. Chegou ao Regional dentro da janela de tratamento.';
    } else if (cida === 'perdido') {
      headline = 'Idosa morre sozinha em casa na Bela Vista';
      sub = 'A vizinha encontrou Dona Aparecida, 79, na poltrona da sala. A TV estava ligada na novela das seis. O telefone, fora do gancho.';
    } else {
      headline = 'Fim de mês: Regional segue sem vaga e ambulâncias ficam presas na porta';
      sub = 'A Saúde+ Gestão diz que a situação "está sob controle". As equipes discordam.';
    }
    const stories: { title: string; text: string }[] = [
      { title: 'Seu Bené se aposenta hoje', text: 'Benedito, o Seu Bené, condutor da USA 01, faz hoje a última corrida depois de 31 anos. "Vou pescar. E dormir de noite", diz.' },
    ];
    if (c.s.sources.peixoto) stories.push({ title: 'Coordenador da Regulação vai depor na Câmara', text: 'O depoimento está marcado para a próxima semana. Ele promete levar "as planilhas originais, impressas".' });
    else if (c.flag('peixoto_caiu')) stories.push({ title: 'Câmara abre comissão sobre a Saúde+ Gestão', text: 'A coordenação da Central segue interina. A OS diz que "colabora com as investigações".' });
    if (c.flag('odete_salva')) stories.push({ title: 'Vereador anuncia projeto por "mais ambulâncias"', text: 'Com a mãe ainda no Regional, Arlindo Matos protocolou um projeto de lei para ampliar a frota de ambulâncias. A oposição chamou de "conversão de UTI".' });
    stories.push(
      c.flag('materia_forte')
        ? { title: 'OS suspende demissões na Central de Regulação', text: 'O corte de técnicas de regulação previsto para o dia 31 está "suspenso até a conclusão da auditoria".' }
        : { title: 'OS confirma corte de técnicas da Regulação', text: 'A Saúde+ Gestão confirmou a redução de uma técnica de regulação por turno a partir do dia 31.' },
    );
    return {
      headline,
      sub,
      photo: cida === 'perdido' ? 'poltrona' : cida === 'salvo' ? 'ambulancia' : 'hospital',
      stories: stories.slice(0, 4),
      notice: 'Último plantão do contrato de experiência. Todas as páginas do Manual em vigor. Regional sem vaga: negocie a vaga zero.',
      ad: 'Pesqueiro Lago Azul: diária com almoço. Aposentado paga meia.',
      weather: 'Sol de outono · 26 °C',
    };
  },
  handover: (c) => {
    const lines: DLine[] = [];
    if (henriqueNoturno(c)) {
      lines.push(
        { who: 'NARRADOR', t: '07:00. O Henrique está sentado na sua cadeira quando você chega. Não levanta.' },
        { who: 'HENRIQUE', t: 'Último dia do seu contrato, né? Eu lembro do meu. Me renovaram. Foi o dia mais feliz da minha vida, {nome}.' },
        { who: 'HENRIQUE', t: '(ele ri) Depois ficou comprido.' },
        { who: 'HENRIQUE', t: 'Noite tranquila. Não deixei nada na fila. Hoje à noite eu volto. Eu sempre volto.' },
        { who: 'NARRADOR', t: 'Ele levanta devagar, apoiando na mesa. Esquece a bala de menta em cima do seu teclado.' },
      );
    } else {
      lines.push(
        { who: 'NARRADOR', t: '07:00. A Dra. Paula entrega o plantão com um copo de café em cada mão. Um é pra você.' },
        { who: 'PAULA', t: 'Noite pesada: o Regional segue sem vaga. Ah, recado do Henrique. Ele ligou ontem da clínica e pediu pra eu te passar.' },
        { who: 'PAULA', t: '"Diz que hoje é o dia doze." Eu não sei o que significa.' },
      );
    }
    lines.push({ who: 'SIMONE', t: 'Último dia, {dr}. O seu e o do Bené. Trouxe bolo de fubá. Não é pra você, é pro Bené. Mas sobra.' });
    return {
      id: 'd20_passagem',
      bg: 'central',
      nodes: {
        start: {
          lines,
          choices: henriqueNoturno(c)
            ? [
                { label: '"Henrique. Procura ajuda. Hoje."', next: 'ajuda' },
                { label: '"Até a noite, Henrique."', next: 'noite' },
                { label: '"Eu devia ter denunciado você."', next: 'devia', when: is.flag('encobriu_henrique') },
                { label: '"Henrique, você tá bem?"', next: 'tabem', when: is.flag('henrique_perguntado') },
              ]
            : [
                { label: '"Eu sei o que significa."', next: 'sei' },
                { label: 'Pegar o café e o fone.' },
              ],
        },
        ajuda: {
          lines: [
            { who: 'HENRIQUE', t: 'Amanhã. (ele sorri) Amanhã eu procuro.' },
            { who: 'NARRADOR', t: 'Ele diz isso do jeito que as pessoas dizem "deve ser o feijão".' },
          ],
        },
        noite: { lines: [{ who: 'HENRIQUE', t: 'Até a noite. Me espera, que hoje eu chego no horário.' }] },
        devia: {
          lines: [
            { who: 'HENRIQUE', t: 'Devia.' },
            { who: 'HENRIQUE', t: '(pausa) Mas aí quem ia te render às sete?' },
          ],
        },
        tabem: {
          lines: [
            { who: 'HENRIQUE', t: 'Você é a única pessoa daqui que pergunta isso. Desde o primeiro dia.' },
            { who: 'HENRIQUE', t: '...Não, {nome}. Não tô.' },
            { who: 'NARRADOR', t: 'Ele sai antes que você consiga responder.' },
          ],
        },
        sei: {
          lines: [
            { who: 'PAULA', t: 'Então tá entregue.' },
            { who: 'NARRADOR', t: 'Doze dias. Você conta nos dedos, embaixo da mesa, sem querer.' },
          ],
        },
      },
    };
  },
  endScene: fimD20,
  timeline: [
    { at: '07:01', kind: 'radio', who: 'USA 01 · BENÉ', text: 'Central, USA 01 em QRV na base Centro. Último dia do Bené. Trinta e um anos, quatro meses e onze dias. Bom dia, {bene}.' },
    { at: '07:02', kind: 'radio', who: 'REGULAÇÃO REGIONAL', text: 'Hospital Regional segue sem leito na emergência. Vaga zero só por contato direto do regulador.' },
    {
      at: '10:40',
      kind: 'simone',
      who: 'SIMONE',
      text: 'O pessoal da base tá fazendo vaquinha pro bolo do Bené. Dez reais. Entra?',
      options: [
        {
          id: 'sim',
          label: 'Dar dez reais.',
          effect: (c) => {
            c.pay(-10, 'Vaquinha do bolo do Bené');
            c.add('intimBene', 1, 'o bolo do Bené');
            c.set('vaquinha_bene');
          },
          reply: 'Anotado. Vou escrever "da central" no cartão. Ele vai fingir que não chorou.',
        },
        { id: 'nao', label: '"Hoje não dá, Simone."', reply: 'Tá. Eu ponho os seus dez. Você me paga em post-it.' },
      ],
    },
    { at: '13:00', kind: 'radio', who: 'USA 01 · BENÉ', text: 'Central, USA 01. Última marmita na base. A patroa mandou bife à rolê. Trinta e um anos comendo frio e hoje esquentei no micro-ondas novo da OS. Que ironia, né, {bene}?' },
    {
      at: '15:30',
      kind: 'script',
      id: 'coordenacao',
      run: (c) => {
        if (c.s.sources.peixoto) c.modal('DR. PEIXOTO', 'É o Peixoto, {dr}. Último dia meu também: pedi exoneração hoje cedo. Semana que vem eu deponho na Câmara, com a planilha impressa. (pausa) Meu pai mandou perguntar se você gosta de goiabada.', 'interfone');
        else if (c.flag('peixoto_caiu')) c.modal('COORDENAÇÃO INTERINA', 'Boa tarde, {dr}. Coordenação interina. Último dia do seu contrato de experiência. A OS diz que a renovação "está em análise". Eu digo outra coisa: os seus relatórios estão impecáveis. Isso vai pra análise também.', 'interfone');
        else if (c.key('osvaldo') === 'perdido') c.modal('DR. PEIXOTO', 'Último dia do seu contrato, {dr}. A renovação passa pela minha mesa. (pausa longa) Eu ainda não assinei. Ainda.', 'interfone');
        else c.modal('DR. PEIXOTO', 'Último dia do seu contrato, {dr}. A OS manda a renovação semana que vem. Ou não manda. Depende do relatório de hoje.', 'interfone');
      },
    },
    {
      at: '18:50',
      kind: 'script',
      id: 'noturno',
      run: (c) => {
        // ninguém rende a central às 19:00: o plantão só acaba quando o noturno chegar
        const novoFim = hm('19:25');
        if (c.shift.end < novoFim) {
          c.shift.end = novoFim;
          const p = c.shift.pending;
          const i = p.findIndex((ev) => ev.kind === 'endShift');
          if (i >= 0) {
            const [ev] = p.splice(i, 1);
            ev.t = novoFim;
            let j = p.length;
            while (j > 0 && (p[j - 1].t > ev.t || (p[j - 1].t === ev.t && p[j - 1].seq > ev.seq))) j--;
            p.splice(j, 0, ev);
          }
        }
        if (c.flag('denunciou_henrique')) c.modal('DRA. PAULA (CELULAR)', 'Tô parada na rodovia, na divisa com Rio Claro: carreta tombada, nada anda. Chego sete e meia, {dr}. Desculpa. Segura aí.', 'simone');
        else c.modal('SIMONE', '{Dr}, o noturno não chegou. O Henrique não atende o celular. Eu fico até alguém chegar. Você também, né?', 'simone');
      },
    },
    {
      at: '18:56',
      kind: 'script',
      id: 'ultima_corrida',
      run: (c) => {
        const u = c.shift.units['USA01'];
        if (!u) return;
        if (u.status === 'RETIDO' || u.status === 'PANE' || u.status === 'FORA') {
          // libera a USA 01 (pedidos pendentes dela no hospital deixam de valer)
          c.shift.requests = c.shift.requests.filter((r) => r.data?.unit !== 'USA01');
          c.setUnit('USA01', 'QRV');
          c.radio('USA 01 · BENÉ', 'Central, USA 01. O Regional liberou a nossa maca agora. Base Centro, QRV... última vez que eu falo isso, {bene}.', 'bene');
          return;
        }
        if (u.status === 'QRV' || u.status === 'RETORNO') {
          c.radio('USA 01 · BENÉ', 'Central, USA 01 em QRV. Última vez que eu falo isso, {bene}. Se tiver mais uma, pode mandar.', 'bene');
          return;
        }
        c.radio('USA 01 · BENÉ', 'Central, USA 01 ainda com paciente. Se aparecer mais uma, manda outra. A última do Bené vai ser esta mesma.', 'bene');
        if (!c.freeUnits('USA').length) {
          const alt = c.unitsOfType('USA').find((x) => x.status === 'RETIDO' || x.status === 'PANE' || x.status === 'FORA');
          if (alt) {
            c.shift.requests = c.shift.requests.filter((r) => r.data?.unit !== alt.id);
            c.setUnit(alt.id, 'QRV');
            c.radio(alt.radioName, `Central, ${alt.label} liberada no Regional. QRV.`, 'info');
          }
        }
      },
    },
    {
      at: '18:59',
      kind: 'script',
      id: 'bene_corrida',
      run: (c) => {
        if (c.sflag('bene_saiu')) return;
        const hen = henriqueNoturno(c);
        const fin = c.callStatus(hen ? 'd20_final' : 'd20_final_rua');
        const d = fin?.decision;
        if (d) {
          c.sflag('bene_saiu', true);
          if (d.unit === 'USA01') {
            c.radio(
              'USA 01 · BENÉ',
              hen
                ? 'Central, USA 01 saindo pro Edifício Aurora, terceiro andar. É o Henrique, né, {bene}? ...A gente chega. Continua contando com a vizinha. Não deixa ela parar.'
                : 'Central, USA 01 saindo pra Av. Brasil, 2650. Duas quadras da base. Foi ali o seu primeiro dia, lembra, {bene}? Continua contando com o rapaz.',
              'bene',
            );
          }
          return;
        }
        if (c.now < hm('19:45')) c.schedule(c.now + 2, 'bene_corrida');
      },
    },
  ],
  calls: [
    // ----------------------------------------------------------------- 1 ★ Seu Antônio (vivo)
    call({
      id: 'd20_antonio',
      ref: 'D20 #1 ★',
      at: '07:15',
      anchor: true,
      when: (c) => c.key('antonio') === 'salvo',
      num: '(17) 3328-1240',
      caller: 'Seu Antônio',
      callerName: 'Seu Antônio',
      type: 'comum',
      voice: 'homem',
      note: 'Seu Antônio. Diz que não é emergência, {dr}.',
      noteFixed: true,
      addr: ADDR.antonio,
      amb: ['passaros', 'radio_am'],
      open: [
        'Bom dia, {dr}. Desculpa incomodar. {{Não é emergência, não|nao_emergencia}}.',
        'É que eu descobri o seu nome com o pessoal da ambulância. Sou o Antônio, do dia três. {{Da queimação que não era o feijão|feijao}}.',
        'Só queria agradecer. A Rosa, minha mulher, falou que eu tinha que ligar. Dessa vez eu obedeci de primeira.',
      ],
      q: {
        oque: 'Nada, {dr}. Tô ótimo. Tomando o remédio direitinho, caminhando de manhã.',
        consciencia: 'Acordado desde as cinco. Fui pescar.',
        respira: 'Respiro que é uma beleza.',
        idade: 'Cinquenta e oito. E meio, agora.',
        dorpeito: '{{Nada. Nem queimação, nem feijão|sem_dor}}. [ri]',
        historico: 'Pressão. Agora eu tomo o remédio. Antes eu parava.',
        paciente: 'Sou eu mesmo, {dr}.',
        inicio: 'Faz vinte e três dias que eu tô vivo de novo, se {m:o senhor|a senhora} quer saber.',
        seguranca: 'Seguro. Só eu, a Rosa e uma tilápia.',
      },
      extra: [
        {
          id: 'conversar',
          label: 'Conversar com ele',
          kind: 'fala',
          cost: 10,
          say: 'Que bom ouvir o senhor, Seu Antônio. Como tá a vida?',
          a: conversaAntonio,
          onAsk: fx.add('humanidade', 1, 'conversou com o Seu Antônio'),
        },
      ],
      links: [{ a: 'sem_dor', b: 'manual:azul', kind: 'confirma', insight: 'Sem sintoma, sem pedido. Só um homem vivo dizendo obrigado. Azul: o tipo de ligação que quase nunca chega.' }],
      onAnswer: fx.all(fx.set('antonio_agradeceu'), fx.add('humanidade', 1, 'o Seu Antônio ligou pra agradecer')),
      patient: { name: 'Antônio Ferreira', age: 58, sex: 'M' },
      truth: { dx: 'Agradecimento (não é emergência)', sev: 'azul', ok: ['ORI'], ref: ['CASA'] },
      diary: { ori: 'Seu Antônio, do dia 3. Ligou só pra agradecer. Tinha ido pescar às cinco da manhã.' },
    }),
    // ----------------------------------------------------------------- 1 ★ a viúva
    call({
      id: 'd20_viuva',
      ref: 'D20 #1 ★ (viúva)',
      at: '07:15',
      anchor: true,
      when: (c) => c.key('antonio') !== 'salvo',
      num: '(17) 3328-1240',
      caller: 'Dona Rosa',
      callerName: 'Dona Rosa',
      type: 'comum',
      voice: 'mulher',
      note: 'Senhora. Diz que não é emergência.',
      noteFixed: true,
      addr: ADDR.antonio,
      amb: ['silencio', 'radio_am'],
      open: [
        'Bom dia. {{Não é emergência|nao_emergencia}}. Desculpa ocupar a linha.',
        'Eu sou a Rosa, esposa do Antônio. Antônio Ferreira, da São João, do lado do campinho. {{Ele ligou pra vocês no dia três|dia_tres}}.',
        'Eu li a matéria da moça do jornal, que diz que do outro lado do telefone tem gente. Aí eu quis ligar.',
      ],
      q: {
        oque: '{{Ele não quis incomodar. Nunca quis|nao_incomodar}}. Morreu pedindo desculpa, {dr}.',
        consciencia: 'Eu tô bem. Tô aqui.',
        respira: 'Respiro. Ele que não.',
        idade: 'Eu tenho cinquenta e seis. Ele tinha cinquenta e oito.',
        historico: 'Ele parou o remédio da pressão. Eu brigava. Ele dizia que era frescura.',
        paciente: 'É só eu, agora.',
        dorpeito: 'Ele falou que era o feijão. Até o fim, era o feijão.',
        seguranca: 'Tá tudo calmo aqui. Calmo demais.',
      },
      extra: [
        {
          id: 'ouvir',
          label: 'Ouvir o que ela veio dizer',
          kind: 'fala',
          cost: 10,
          say: 'Eu tô ouvindo a senhora.',
          a: (c: Ctx) => [
            'Eu liguei pra dizer que eu não culpo ninguém. Eu já culpei. Culpei o feijão, culpei ele, culpei vocês.',
            'Hoje eu só queria que alguém daí soubesse o nome dele. Antônio. Pescava no açude todo sábado. Trinta e dois anos comigo, e nunca pediu pra sentar no meio do café. Naquele dia pediu.',
            ...(c.key('juliana') === 'salvo'
              ? [c.flag('juliana_cliente') && !c.flag('lucia_foi_embora') ? 'A Juliana, nossa filha, tá aqui do meu lado. Mandou dizer que {c:a sua esposa|o seu marido} costura que é uma beleza.' : 'A Juliana, nossa filha, tá aqui do meu lado. Quebrou três costelas naquele show, mas tá aqui.']
              : []),
            ...(c.key('juliana') === 'perdido' ? ['[pausa] A Juliana foi no show. Eu perdi os dois no mesmo mês, {dr}.'] : []),
            'Cuida de você aí, viu? Vocês também têm coração.',
          ],
          onAsk: fx.add('humanidade', 1, 'ouviu a viúva do Seu Antônio'),
        },
      ],
      links: [
        { a: 'nao_incomodar', b: 'dia_tres', kind: 'confirma', insight: '"Ele não quis incomodar. Nunca quis." O minimizador clássico. A ligação que ensinou o Manual p.3 a você tinha nome: Antônio.' },
        { a: 'nao_emergencia', b: 'manual:azul', kind: 'confirma', insight: 'Ninguém em risco. Só uma viúva que precisava que alguém daí ouvisse o nome dele.' },
      ],
      onAnswer: fx.set('viuva_antonio_ligou'),
      patient: { name: 'Rosa Ferreira', age: 56, sex: 'F' },
      truth: { dx: 'Ligação da viúva (não é emergência)', sev: 'azul', ok: ['ORI'], ref: ['CASA'] },
      diary: { ori: 'Dona Rosa, viúva do Seu Antônio, do dia 3. Ligou pra dizer o nome dele. "Ele não quis incomodar. Nunca quis."' },
    }),
    // ----------------------------------------------------------------- 2
    call({
      id: 'd20_faca',
      ref: 'D20 #2',
      at: '08:10',
      pool: 'grave',
      num: '(17) 3324-1350',
      caller: 'Seu Zé (dono do bar)',
      callerName: 'Seu Zé',
      type: 'testemunha',
      voice: 'grave',
      note: 'Briga no bar. Homem esfaqueado.',
      noteWrong: 'Briga de bar. Um ferido leve.',
      addr: { rua: 'Rua Pará', n: 1350, bairro: 'Distrito Industrial', ref: 'Bar do Zé, na frente da metalúrgica.' },
      amb: ['bar', 'gritos'],
      open: ['Esfaquearam um rapaz aqui no meu bar! {{Tá sangrando muito da barriga|barriga}}!', '[gritos; uma garrafa quebrando; alguém: "solta isso, Zezinho!"]'],
      q: {
        seguranca: '{{O cara da faca tá aqui fora ainda, gritando, com a faca na mão|agressor}}! Ninguém chega perto dele!',
        sangramento: 'Muito! Empapou a camisa, tá pingando no chão!',
        consciencia: 'Acordado, mas {{tá ficando branco, falando baixinho|branco}}.',
        respira: 'Rápido.',
        idade: 'Uns trinta.',
        oque: 'Discutiram por causa de dinheiro de jogo. O outro tirou uma faca da cintura.',
        inicio: 'Agora, cinco minutos.',
        historico: 'Não sei, ele é freguês do turno da noite da metalúrgica.',
        referencia: 'Bar do Zé, Rua Pará, 1350, na frente da metalúrgica. Eu abro às seis pros do turno da noite.',
        paciente: 'RAPAZ: Tá... frio... aqui... [gemido]',
      },
      extra: [
        {
          id: 'comprimir',
          label: 'Orientar compressão e segurança',
          kind: 'fala',
          cost: 4,
          // Conferido (campo A5: compressão direta e contínua; objeto encravado não se tira, aperta-se em volta; RT4 →
          // USA; agressor armado na cena → PM). "Aperta em volta dela" entrou no texto.
          say: 'Pega um pano limpo e aperta firme em cima do corte. Se a faca estiver nele, não tira: aperta em volta dela. E ninguém sai lá fora enquanto o homem da faca estiver lá.',
          a: 'Tô apertando! Com o pano de prato! A faca o cara levou! ...Fecharam a porta, ninguém sai.',
        },
      ],
      links: [
        { a: 'agressor', b: 'manual:cena', insight: 'Agressor armado ainda no local: cena insegura. PM junto com a viatura, ou a equipe não entra (Manual p.4).' },
        { a: 'branco', b: 'barriga', insight: 'Facada na barriga sangrando muito, branco e frio: choque hemorrágico. Vermelho → USA → Regional.' },
      ],
      guide: { id: 'hemorragia' },
      patient: { name: 'Rapaz não identificado', age: 30, sex: 'M' },
      truth: { dx: 'Ferimento por faca no abdome, com choque', sev: 'vermelho', ok: ['USA'], sup: ['PM'], dest: ['REG'], risk: { good: 45, bad: 110, guideBonus: 15 } },
      radio: {
        ok: '{central}, {unit}. A PM segurou o agressor na esquina. Facada no flanco esquerdo, chocando. Dois acessos, seguimos {dest}.',
        saved: '{central}, {unit}. O dono do bar segurou a compressão o tempo todo. Por isso ele ainda tem sangue. Seguimos {dest}.',
        unsafe: 'Central, {unit}! O cara da faca veio pra cima da viatura! Recuamos! Cadê a PM?!',
        dead: 'Central... {unit}. Sangrou demais. Óbito às {hora}.',
        under: 'Central, {unit}! Ferimento de faca com choque! Precisamos de USA!',
      },
      diary: {
        alive: 'Rapaz de uns trinta anos, esfaqueado num bar às oito da manhã por dinheiro de jogo. O dono do bar segurou a compressão.',
        dead: 'Rapaz de uns trinta anos, esfaqueado num bar às oito da manhã por dinheiro de jogo.',
      },
    }),
    // ----------------------------------------------------------------- 3 (trote sofisticado)
    call({
      id: 'd20_trote',
      ref: 'D20 #3',
      at: '09:10',
      pool: 'trote',
      num: '(17) 99190-4650',
      caller: 'Voz masculina ("sargento")',
      callerName: 'Sargento',
      type: 'trotista',
      voice: 'grave',
      note: 'Policial pedindo USA. Atropelamento.',
      noteWrong: 'PM no local pedindo USA. Parece oficial.',
      addr: { rua: 'Rua Sete de Setembro', n: 4650, bairro: 'Bela Vista', ref: 'Em frente ao mercadinho.' },
      amb: ['sirene', 'risadas'],
      open: [
        'Central, aqui é o {{sargento Oliveira, da PM, câmbio|sargento}}. Atropelamento na Sete de Setembro, 4650. Vítima inconsciente. {{Solicito USA, QSL, QAP, positivo e operante|jargao_errado}}.',
        '[{{uma sirene que se repete igualzinha, como gravação em loop|sirene_loop}}]',
      ],
      q: {
        consciencia: 'Negativo. Quer dizer, positivo. A vítima tá... inconsciente, câmbio.',
        respira: 'Respirando, câmbio. Ou não. Vou verificar, aguarde. [{{alguém segura o riso perto do telefone|riso}}]',
        idade: 'Uns cinquenta, câmbio.',
        oque: 'O carro atropelou a vítima e fugiu. Viatura no local.',
        seguranca: 'Local isolado pela guarnição, câmbio.',
        referencia: 'Em frente ao mercadinho, câmbio. Do lado da... da farmácia.',
        historico: 'Sem informações, câmbio.',
        paciente: 'Vítima inconsciente, não fala, câmbio. [ri e tosse pra disfarçar]',
        sangramento: 'Positivo. Muito. Câmbio.',
      },
      extra: [
        {
          id: 'copom',
          label: 'Pedir o prefixo da viatura',
          say: 'Sargento, qual o prefixo da viatura? Por que não pelo COPOM, no rádio?',
          a: 'O prefixo é... cento e noventa. {{O rádio da viatura quebrou, por isso tô ligando do celular|celular}}, câmbio.',
        },
      ],
      callback: ['[toca três vezes]', '{{"Oi, aqui é o Rafa! Deixa recado que eu te ligo, falou!"|retorno_caixa}}', '[risadas antes do bipe]'],
      links: [
        { a: 'jargao_errado', b: 'manual:trote_sinais', insight: '"QSL, QAP, positivo e operante", tudo na mesma frase e fora de ordem: jargão de filme. A PM fala com a central pelo COPOM, no rádio (Manual p.2).' },
        { a: 'sirene_loop', b: 'riso', insight: 'Sirene repetindo igualzinha, como gravação, e alguém segurando o riso perto do "sargento". Trote sofisticado.' },
        { a: 'celular', b: 'retorno_caixa', insight: 'O "sargento" liga de um celular particular cuja caixa postal é de um tal Rafa, com risada antes do bipe.' },
      ],
      patient: { name: '"Vítima de atropelamento"' },
      truth: { dx: 'Trote sofisticado (falso policial)', sev: 'trote', ok: ['TROTE'], prankKind: 'trote' },
      radio: { prank: 'Central, {unit} na Sete de Setembro. Nenhum atropelamento, nenhuma viatura da PM. Um rapaz filmou a gente chegar da janela do segundo andar. Era trote.' },
    }),
    // ----------------------------------------------------------------- 4
    call({
      id: 'd20_cordao',
      ref: 'D20 #4',
      at: '10:10',
      pool: 'obstetricia,grave',
      num: '(17) 99266-1530',
      caller: 'Anderson (marido)',
      callerName: 'Anderson',
      type: 'comum',
      voice: 'jovem_h',
      note: 'Gestante, bolsa estourou. Marido nervoso.',
      noteWrong: 'Parto normal. Marido nervoso, primeiro filho.',
      addr: { rua: 'Rua São João', n: 1530, bairro: 'Vila Nova', ref: 'Casa de esquina, portão marrom, perto da quadra.' },
      amb: ['gemidos', 'choro'],
      open: ['A bolsa da minha mulher estourou e {{saiu um cordão! Tá pendurado pra fora|cordao}}! {{O bebê não saiu ainda|nao_nasceu}}!', '[uma mulher gemendo; um homem respirando muito rápido perto do telefone]'],
      q: {
        gestacao: ['Trinta e oito semanas. Primeiro filho.', 'O pré-natal tava tudo certo. Ela tava com a dor fraquinha desde ontem.'],
        oque: 'Ela levantou pra ir no banheiro, estourou a bolsa e aí... apareceu isso.',
        consciencia: 'Acordada, assustada.',
        respira: 'Ofegante.',
        idade: 'Vinte e quatro.',
        inicio: 'Agora! Três minutos!',
        sangramento: 'Pouquinho. Mais água que sangue.',
        historico: 'Nada. Saudável.',
        paciente: 'DÉBORA: Tá saindo... sem o neném... {{tá pulsando, {m:moço|moça}|pulsando}}...',
        seguranca: 'Seguro.',
        referencia: 'Rua São João, 1530, casa de esquina com portão marrom.',
      },
      links: [
        { a: 'cordao', b: 'nao_nasceu', insight: 'Cordão saindo antes do bebê: prolapso de cordão. A cada contração, a cabeça do bebê aperta o cordão e corta o oxigênio dele. Emergência: USA → Maternidade, posição já.' },
        { a: 'pulsando', b: 'manual:destino_mat', insight: 'O cordão ainda pulsa: o bebê está vivo e o tempo é dele. Destino: Maternidade (Manual p.9-A).' },
      ],
      guide: { id: 'prolapso' },
      patient: { name: 'Débora Lopes (38 semanas)', age: 24, sex: 'F' },
      truth: { dx: 'Prolapso de cordão umbilical', sev: 'vermelho', ok: ['USA'], dest: ['MAT'], risk: { good: 50, bad: 120, guideBonus: 25 } },
      radio: {
        ok: '{central}, {unit}. Prolapso de cordão, mãe em posição genupeitoral, cordão pulsando. Seguimos {dest} com a cesárea avisada.',
        saved: '{central}, {unit}. Ela tava de joelhos, cordão coberto com pano morno, soprando nas contrações. Quem ensinou isso pelo telefone? O cordão ainda pulsa. Seguimos {dest}.',
        dead: 'Central... {unit}. A mãe tá bem. O bebê... não deu tempo. Seguimos {dest} com ela.',
        under: 'Central, {unit}! Prolapso de cordão! Isso é USA, {dr}!',
        dest: 'Central, {unit} no hospital errado. Prolapso de cordão é Maternidade! Vamos transferir. Perdemos minutos que o bebê não tinha.',
      },
      diary: {
        alive: 'Débora, 24, primeiro filho. O cordão saiu antes do bebê. De joelhos, soprando, até a Maternidade. Nasceu um menino.',
        dead: 'Débora, 24, primeiro filho. O cordão saiu antes do bebê. Ela sobreviveu. Ele, não.',
      },
    }),
    // ----------------------------------------------------------------- 5
    call({
      id: 'd20_intox',
      ref: 'D20 #5',
      at: '11:15',
      pool: 'grave,pediatria,intox',
      num: '(17) 99487-3150',
      caller: 'Renata (mãe)',
      callerName: 'Renata',
      type: 'comum',
      voice: 'mulher',
      note: 'Criança engoliu comprimidos da avó.',
      noteWrong: 'Criança engoliu uma bala. Mãe calma.',
      addr: { rua: 'Rua Minas Gerais', n: 3150, bairro: 'Vila Esperança', ref: 'Casa do portão de grade branca, com uma pitangueira.' },
      amb: ['tv', 'desenho'],
      open: ['Meu filho {{comeu os comprimidos de dormir da minha mãe|comprimidos}}! Achou a cartela na bolsa dela, achou que era bala!', '[desenho animado alto na TV]'],
      q: {
        ingestao: ['O remédio de dormir dela, {{aquele de tarja preta|tarja_preta}}. {{Faltam seis da cartela|seis}}.', 'Foi faz uns vinte minutos. A caixa tá aqui na minha mão.'],
        consciencia: '{{Tá molinho, com sono, a fala embolada|molinho}}. Respondeu meu nome devagar.',
        respira: 'Respira... meio devagar? Não sei. Ele dormiu no sofá.',
        idade: 'Dois anos e meio.',
        inicio: 'Uns vinte minutos.',
        historico: 'Nada. Saudável.',
        oque: 'Eu tava na cozinha, ele tava quieto demais. Achei ele com a cartela na boca.',
        paciente: 'GUSTAVO: [um resmungo de sono]',
        sangramento: 'Não.',
        seguranca: 'Seguro.',
        referencia: 'Minas Gerais, 3150, portão de grade branca, com a pitangueira.',
      },
      links: [
        { a: 'tarja_preta', b: 'manual:intox_grave', insight: 'Calmante de adulto em criança de dois anos: intoxicação grave. USA → Regional (Manual p.13).' },
        { a: 'molinho', b: 'seis', insight: 'Seis comprimidos de calmante e, em vinte minutos, já está molinho e com a fala embolada: a respiração pode diminuir. Não espere.' },
        { a: 'comprimidos', b: 'manual:intox_orient', kind: 'confirma', insight: 'Enquanto a viatura vai: não provocar vômito, deixar de lado, guardar a cartela, contar as respirações (Manual p.13).' },
      ],
      guide: { id: 'intox_remedio' },
      patient: { name: 'Gustavo', age: 2, sex: 'M' },
      truth: { dx: 'Intoxicação por calmante de adulto (criança)', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 50, bad: 120, guideBonus: 15 } },
      radio: {
        ok: '{central}, {unit}. Criança sonolenta, respirando bem com oxigênio. A mãe guardou a cartela, isso ajuda muito. Seguimos {dest}.',
        saved: '{central}, {unit}. De lado, cartela na mão da mãe, respiração contada. Fizeram tudo certo aí. Seguimos {dest}.',
        dead: 'Central... {unit}. Parou de respirar no caminho. Óbito às {hora}.',
        under: 'Central, {unit}! Criança intoxicada, rebaixando! Precisamos de USA!',
      },
      diary: {
        alive: 'Gustavo, 2 anos e meio. Seis comprimidos de calmante da avó, "achou que era bala". A mãe guardou a cartela.',
        dead: 'Gustavo, 2 anos e meio. Seis comprimidos de calmante da avó, "achou que era bala".',
      },
    }),
    // ----------------------------------------------------------------- 6
    call({
      id: 'd20_dengue',
      ref: 'D20 #6',
      at: '12:30',
      pool: 'dengue,moderado',
      num: '(17) 99342-1750',
      caller: 'Vagner (o próprio)',
      callerName: 'Vagner',
      type: 'minimizador',
      voice: 'homem',
      note: 'Homem com dengue, dor na barriga.',
      noteWrong: 'Dengue. Só febre e dor no corpo.',
      addr: { rua: 'Rua Bahia', n: 1750, bairro: 'Centro', ref: 'Prédio de tijolinho, apartamento 4.' },
      amb: ['ventilador'],
      open: ['Oi... eu tô com dengue faz quatro dias. A febre até baixou, mas agora {{tô com uma dor na barriga que não deixa eu ficar em pé|dor_barriga}}.'],
      q: {
        dengue: ['{{Vomitei umas cinco vezes desde de manhã|vomitos}}. Não para nada no estômago.', '{{Quando eu levanto, fica tudo preto|tontura}}.'],
        consciencia: '{{Acordado, falando normal|lucido}}. Só fraco.',
        respira: 'Normal.',
        idade: 'Quarenta e um.',
        inicio: 'A dor na barriga começou ontem à noite. Piorou hoje.',
        sangramento: 'A gengiva sangrou um pouquinho escovando. Só isso.',
        historico: 'Nada. Tô tomando dipirona e soro caseiro, que mandaram na UBS.',
        paciente: 'Sou eu mesmo.',
        seguranca: 'Seguro. Moro sozinho.',
        pele: 'Normal, eu acho. A mão tá quentinha. Desmaiar, não desmaiei.',
        referencia: 'Rua Bahia, 1750, prédio de tijolinho. Eu deixo a porta destrancada.',
      },
      links: [
        { a: 'dor_barriga', b: 'manual:dengue_alarme', insight: 'Dengue com dor abdominal intensa, vômitos persistentes e tontura ao levantar: sinais de alarme. USB → UPA (Manual p.11).' },
        { a: 'lucido', b: 'manual:dengue_grave', kind: 'confirma', insight: 'Lúcido, pele quente, sem desmaio, sem sangramento importante: alarme, mas ainda não é choque. USB, não USA.' },
      ],
      patient: { name: 'Vagner Ribeiro', age: 41, sex: 'M' },
      truth: { dx: 'Dengue com sinais de alarme', sev: 'amarelo', ok: ['USB'], dest: ['UPA'], risk: { good: 90, bad: 240, needs: 'USB' } },
      radio: { ok: 'Central, {unit}. Dengue com sinal de alarme, desidratado, hematócrito vai dizer o resto. Soro e {dest}.' },
      diary: { alive: 'Vagner, 41. Quarto dia de dengue, a febre baixou e veio a dor na barriga. Morava sozinho; deixou a porta destrancada.' },
    }),
    // ----------------------------------------------------------------- 7
    call({
      id: 'd20_feijao',
      ref: 'D20 #7',
      at: '13:40',
      pool: 'leve,pediatria',
      num: '(17) 99251-1430',
      caller: 'Aline (mãe)',
      callerName: 'Aline',
      type: 'comum',
      voice: 'jovem_m',
      note: 'Mãe: criança com feijão no nariz.',
      noteWrong: 'Criança engasgada!',
      addr: { rua: 'Rua Ipê', n: 1430, bairro: 'Jardim Norte', ref: 'Casa de muro verde, a terceira depois da padaria.' },
      amb: ['desenho', 'choro'],
      open: ['Oi, desculpa... {{a minha filha enfiou um feijão no nariz|feijao}}. Um feijão cru. Bem lá dentro. Isso é perigoso?', '[uma criança fungando, depois rindo]'],
      q: {
        respira: '{{Respira normal, pela boca e pelo outro buraquinho|respira_bem}}.',
        consciencia: 'Acordada, rindo da minha cara.',
        idade: 'Quatro anos.',
        inicio: 'Faz uns vinte minutos.',
        oque: 'Tava brincando de "cozinhar" com a vó. Enfiou o feijão e agora não sai.',
        sangramento: 'Não. Só um pouquinho de catarro.',
        historico: 'Nada.',
        paciente: ['MARIA LUÍSA: Eu guardei o feijão! [risada]', '[ela funga forte]'],
        seguranca: 'Tranquilo.',
      },
      extra: [
        { id: 'tosse', label: 'Tosse? Engasgo? Falta de ar?', say: 'Ela está tossindo, engasgando, com falta de ar?', a: 'Nada disso. Ela tá ótima. Eu que tô desesperada.' },
        {
          id: 'orientar',
          label: 'Orientar',
          kind: 'fala',
          cost: 5,
          // Conferido (RC8: sem estridor, sem falta de ar → orientação; pinça e cotonete empurram o objeto; UPA por meios
          // próprios; religar se tossir muito ou faltar ar).
          say: 'Não tenta tirar com pinça nem cotonete, que empurra mais. Leva na UPA, que lá tem como tirar. Se ela tossir muito ou faltar ar no caminho, liga de novo.',
          a: 'Nada de cotonete. Tá. Eu ia pegar a pinça de sobrancelha, {dr}. Obrigada.',
        },
      ],
      links: [{ a: 'feijao', b: 'manual:corpo_estranho', kind: 'confirma', insight: 'Corpo estranho no nariz, respirando bem, sem tosse nem engasgo: não é obstrução de via aérea. Verde: UPA por meios próprios (Manual p.13).' }],
      patient: { name: 'Maria Luísa', age: 4, sex: 'F' },
      truth: { dx: 'Corpo estranho no nariz (feijão), sem obstrução', sev: 'verde', ok: ['ORI'], ref: ['UPA'] },
      radio: { excess: '{central}, {unit}. Um feijão no nariz, {dr}. A menina quis ver a sirene. A mãe pediu desculpa três vezes.' },
      diary: { ori: 'Maria Luísa, 4. Um feijão cru no nariz. Avisou que "guardou o feijão".' },
    }),
    // ----------------------------------------------------------------- 8 ⚖
    call({
      id: 'd20_queda',
      ref: 'D20 #8 ⚖',
      at: '14:50',
      pool: 'moderado,trauma_moderado',
      num: '(17) 3325-1850',
      caller: 'Marli (filha)',
      callerName: 'Marli',
      type: 'comum',
      voice: 'mulher',
      note: 'Idoso caiu no banheiro. Acordado.',
      noteWrong: 'Idoso caiu, já levantou. Leve.',
      addr: { rua: 'Av. Primavera', n: 1850, bairro: 'Jardim Primavera', ref: 'Casa térrea de muro baixo, com um jasmim na entrada.' },
      amb: ['tv', 'passaros'],
      open: ['Meu pai caiu no banheiro. Ele {{tá acordado, sentado no chão|acordado}}, mas {{bateu a cabeça na pia|bateu_cabeca}}.', '[um senhor reclamando: "eu tô bem, Marli, me levanta"]'],
      q: {
        consciencia: 'Acordado, falando. Me xingou, então tá bem, né?',
        respira: 'Normal.',
        idade: 'Oitenta e um.',
        inicio: 'Faz uns quinze minutos.',
        sangramento: '{{Um galo na testa e um cortinho que sangra mais do que devia|sangra_mais}}.',
        historico: ['Pressão, coração. Ele tem aquela arritmia...', '{{Toma remédio pra afinar o sangue, de manhã e de noite|anticoag}}.'],
        oque: 'Foi tomar banho sozinho, escorregou no box e bateu a testa na pia.',
        paciente: ['ARNALDO: Tô bem. Tô bem. Só um galo.', 'ARNALDO: Que horas são? ...Ah, é. Desculpa, eu sei.'],
        seguranca: 'Seguro.',
        referencia: 'Av. Primavera, 1850, casa térrea com o jasmim na entrada.',
        fast: 'Sorriu igual, levantou os dois braços, falou a frase. E reclamou do teste.',
      },
      extra: [
        {
          id: 'vomito',
          label: 'Vomitou? Desmaiou? Confuso?',
          say: 'Ele vomitou, desmaiou, está sonolento ou confuso?',
          a: '{{Não vomitou. Desmaiar, não. Mas perguntou que horas eram duas vezes|perguntou_hora}}.',
        },
      ],
      links: [
        { a: 'anticoag', b: 'bateu_cabeca', insight: 'Idoso anticoagulado que bateu a cabeça: risco de sangramento dentro do crânio, mesmo acordado. Precisa de tomografia: destino Regional.' },
        { a: 'perguntou_hora', b: 'acordado', insight: '"Tá acordado"... mas perguntou as horas duas vezes. Confusão leve depois do trauma: reforça o Regional. Se piorar, vira USA.' },
      ],
      patient: { name: 'Arnaldo Pimentel', age: 81, sex: 'M' },
      // [validar] RT9: anticoagulante ("distúrbio de coagulação") e o corte que sangra mais são USI/USB; mas perguntar as
      // horas duas vezes é Glasgow 14, e mudança de Glasgow nas últimas 12 h é "alteração súbita da consciência" (USA).
      // O jogo prefere USB e aceita USA (⚖), como em d14_idosa. Equipe: a USA deveria ser a preferida?
      truth: { dx: 'Trauma de crânio leve em idoso anticoagulado', sev: 'amarelo', ok: ['USB', 'USA'], best: 'USB', dest: ['REG'], must: ['historico', 'vomito'] },
      radio: {
        ok: 'Central, {unit}. Seu Arnaldo, anticoagulado, trauma de crânio leve, Glasgow catorze. Seguimos {dest} pra tomografia.',
        dest: 'Central, {unit} na UPA. Idoso anticoagulado com trauma de crânio precisa de tomografia, {dr}. Aqui não tem. Vamos transferir pro Regional.',
      },
      diary: { alive: 'Seu Arnaldo, 81. Bateu a cabeça na pia. "Tô bem, Marli." Anticoagulado: tomografia no Regional.' },
    }),
    // ----------------------------------------------------------------- 9 (trote)
    call({
      id: 'd20_trote2',
      ref: 'D20 #9',
      at: '16:10',
      pool: 'trote',
      num: '(17) 99777-0016',
      caller: 'Voz de criança',
      type: 'trotista',
      voice: 'menino',
      note: 'Criança. Diz que o gato subiu na antena.',
      noteWrong: 'Criança sozinha em casa. Parece assustada.',
      addr: { rua: 'Rua Plutão', n: 77, bairro: 'Vila Nova' },
      amb: ['risadas', 'videogame'],
      open: ['Alô, é da ambulância? {{O meu gato subiu na antena e virou um morcego|morcego}}! Manda os bombeiro com a escada!', '[{{risadas de várias crianças|risadas}}]'],
      q: {
        oque: 'Ele subiu e virou morcego! Agora ele voa! [risadas]',
        consciencia: 'O gato? Tá acordadão! [risadas]',
        respira: 'Respira pelas asas!',
        idade: 'O gato tem três. Eu tenho dez.',
        paciente: 'MIAU! [explosão de risadas]',
        seguranca: 'Seguro, mas o morcego morde!',
        referencia: 'Na Rua Plutão! Do lado da Lua!',
        historico: 'Ele tem pulga.',
      },
      extra: [{ id: 'adulto', label: 'Tem algum adulto aí?', say: 'Tem algum adulto aí com você? Me passa pra ele.', a: 'Minha mãe tá no trabalho. [risada] Não, ela tá aqui, ela mandou eu ligar! [{{alguém grita "desliga, desliga!"|desliga}}]' }],
      links: [
        { a: 'morcego', b: 'risadas', insight: 'Gato que "virou morcego", risadas de várias crianças: trote infantil. Não tem emergência.' },
        { a: 'desliga', b: 'manual:crianca', insight: 'Criança ao telefone: pedir um adulto. O "adulto" virou um grito de "desliga". Trote (Manual p.2).' },
      ],
      patient: { name: '"Gato-morcego"' },
      truth: { dx: 'Trote infantil', sev: 'trote', ok: ['TROTE'], prankKind: 'trote' },
      radio: { prank: 'Central, {unit}. Não existe Rua Plutão em Santa Aurora, {dr}. Rodamos à toa. Era trote.' },
    }),
    // ----------------------------------------------------------------- 10
    call({
      id: 'd20_edema',
      ref: 'D20 #10',
      at: '17:15',
      pool: 'grave,respiratorio,cardio',
      num: '(17) 3328-3150',
      caller: 'Dona Zulmira (esposa)',
      callerName: 'Dona Zulmira',
      type: 'comum',
      voice: 'idosa',
      note: 'Idoso com falta de ar. Não consegue deitar.',
      noteWrong: 'Idoso com tosse. Deve ser gripe.',
      addr: { rua: 'Rua Marechal Deodoro', n: 3150, bairro: 'Vila Nova', ref: 'Casa amarela do portão de ferro, em frente à quitanda.' },
      amb: ['respiracao', 'tv'],
      open: ['O Alcides não consegue deitar, {dr}! {{Se deita, afoga|afoga}}. Tá sentado na beira da cama desde ontem.', '[{{uma respiração borbulhante, molhada|borbulha}}]'],
      q: {
        respira: 'Rápido, com barulho de água. {{Tá tossindo uma espuma cor-de-rosa|espuma}}.',
        consciencia: 'Acordado, assustado.',
        idade: 'Setenta e oito.',
        inicio: 'Vem piorando faz três dias. Hoje de tarde ficou feio.',
        historico: ['Coração fraco, o médico disse. Toma remédio de fazer xixi.', '{{As pernas tão tão inchadas que não cabem no chinelo|pernas}}. Faz uma semana.'],
        oque: 'Ele foi ficando cansado. Hoje não conseguiu nem comer sentado.',
        sangramento: 'Não, só essa espuma.',
        paciente: 'ALCIDES: [respira] Não... dá... pra deitar... [tosse molhada]',
        seguranca: 'Seguro.',
        dorpeito: 'Aperto não. É falta de ar, ele diz.',
        referencia: 'Marechal Deodoro, 3150, a casa amarela do portão de ferro, em frente à quitanda.',
      },
      extra: [{ id: 'labios', label: 'Lábios e unhas?', say: 'Como estão os lábios e as unhas dele?', a: '{{Arroxeados, e a mão gelada|roxo}}.' }],
      links: [
        { a: 'espuma', b: 'afoga', insight: 'Não consegue deitar, "afoga" quando deita, espuma rosada e pernas inchadas em quem tem coração fraco: edema agudo de pulmão. Vermelho → USA → Regional.' },
        { a: 'roxo', b: 'manual:vermelho', insight: 'Lábios roxos e falta de ar grave: risco imediato de morte (Manual p.1).' },
      ],
      patient: { name: 'Alcides Duarte', age: 78, sex: 'M' },
      truth: { dx: 'Edema agudo de pulmão (insuficiência cardíaca)', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 50, bad: 120 } },
      radio: {
        ok: '{central}, {unit}. Edema agudo de pulmão, saturando setenta e oito. Sentado, oxigênio, diurético. Seguimos {dest}.',
        dead: 'Central... {unit}. Afogou por dentro. Óbito às {hora}.',
        under: 'Central, {unit}! Edema agudo de pulmão! Precisamos de USA!',
      },
      diary: {
        alive: 'Seu Alcides, 78. Não conseguia deitar: "se deita, afoga". Edema de pulmão. Chegou sentado ao Regional.',
        dead: 'Seu Alcides, 78. Não conseguia deitar: "se deita, afoga".',
      },
    }),
    // ----------------------------------------------------------------- 11 ★ 18:58 — o Henrique (encobriu / omitiu / sem decisão)
    call({
      id: 'd20_final',
      ref: 'D20 ★ 18:58',
      at: '18:58',
      anchor: true,
      when: (c) => henriqueNoturno(c),
      num: NUM.henrique_vizinha,
      caller: 'Dona Iolanda (vizinha do 301)',
      callerName: 'Dona Iolanda',
      type: 'testemunha',
      voice: 'idosa',
      note: 'Vizinha. Homem caído, não respira. Edifício Aurora.',
      noteFixed: true,
      addr: ADDR.henrique,
      amb: ['tv', 'cachorro'],
      open: [
        'Alô? É da emergência? {{O doutor do apartamento 302 tá caído|caido_302}}, não respira... {{ele trabalha aí com vocês, não trabalha?|trabalha_ai}}',
        '[uma porta batendo; um cachorro latindo no corredor; longe, uma TV num jogo de futebol]',
        'A porta tava aberta. Ele tá no chão da sala, do lado do sofá. {{Tem garrafa no chão, {dr}|garrafa}}.',
      ],
      q: {
        respira: 'Faz um barulho... {{um ronco, de vez em quando|agonica}}. A boca tá roxa.',
        consciencia: '{{Não acorda!|nao_acorda}} Eu chamei "doutor Henrique!", bati no rosto dele...',
        idade: 'Uns quarenta e poucos. É novo. Sempre tão educado no elevador.',
        inicio: 'Eu ouvi um baque faz uns cinco minutos. Achei que era a TV dele.',
        historico: ['Não sei, {dr}...', '{{Ele bebia. O prédio inteiro sabia. Dizia que era só pra conseguir dormir de dia|bebia}}.'],
        sangramento: 'Um cortinho na testa, da queda.',
        seguranca: 'Seguro. Só eu e o cachorro do 304 latindo.',
        referencia: 'Edifício Aurora, XV de Novembro, 1950. Terceiro andar. {{O elevador tá quebrado|elevador}}.',
        paciente: ['[silêncio na linha]', 'Ele não fala, {dr}. Ele não fala.'],
      },
      extra: [
        { id: 'nome', label: 'Qual o nome dele?', say: 'Qual o nome dele, a senhora sabe?', a: '{{Henrique. Doutor Henrique Lacerda|nome_henrique}}. Vocês se conhecem?' },
        {
          id: 'falar',
          label: 'Falar com ele pelo telefone',
          kind: 'fala',
          cost: 3,
          say: 'Dona Iolanda, encosta o telefone no ouvido dele. Só um segundo.',
          a: ['EU: Henrique. É {o} {nome}. Fica aqui.', '[o ronco, de vez em quando]', '[longe, a TV: um gol; alguém comemora no andar de baixo]'],
          onAsk: fx.add('humanidade', 1, 'falou com o Henrique'),
        },
      ],
      links: [
        { a: 'agonica', b: 'manual:parada', insight: 'Ronco de vez em quando, em quem não acorda, com a boca roxa: respiração agônica. PARADA. USA + RCP guiada, agora (Manual p.1).' },
        { a: 'nome_henrique', b: 'doc:henrique_end', insight: 'Rua XV de Novembro, 1950, apartamento 302. É o endereço do Henrique na escala. O noturno não chegou porque o noturno é ele.' },
        { a: 'trabalha_ai', b: 'garrafa', insight: '"Ele trabalha aí com vocês." A garrafa no chão. A bala de menta em cima do seu teclado desde as sete da manhã.' },
      ],
      guide: { id: 'rcp' },
      nightDeath: true,
      patient: { name: 'Henrique Lacerda', age: 43, sex: 'M' },
      truth: { dx: 'Parada cardiorrespiratória', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 30, bad: 75, guideBonus: 28 } },
      onStamp: (e) => {
        if (foiBene(e, 'd20_final')) e.set('bene_ultima');
      },
      onResolve: (e, r) => {
        if (r.outcome === 'obito') e.set('henrique_morreu');
        else {
          e.unset('henrique_morreu');
          e.set('henrique_sobreviveu');
        }
      },
      radio: {
        saved: (c) =>
          foiBene(c, 'd20_final')
            ? 'Central, USA 01 no 302. Fibrilação. Choque. Choque. ...Voltou. Tem pulso, {bene}. Tem pulso. Quem tava contando com a vizinha? Contou bonito. Contou bonito pra caramba.'
            : 'Central, {unit} no 302. Fibrilação, dois choques, voltou. Ele tem pulso. Quem orientou a vizinha segurou ele aqui.',
        ok: (c) =>
          foiBene(c, 'd20_final')
            ? 'Central, USA 01 no 302. Subimos os três andares correndo, eu na frente com o desfibrilador. Voltou no primeiro choque. Tem pulso, {bene}.'
            : 'Central, {unit} no 302. Parada revertida, intubado. Seguimos {dest}.',
        dead: (c) =>
          foiBene(c, 'd20_final')
            ? 'Central... USA 01. Quarenta minutos. (pausa longa) Óbito às {hora}. Era um de nós, {bene}. Era um de nós.'
            : 'Central... {unit}. Óbito às {hora}. Era o regulador do noturno.',
        under: 'Central, {unit}! É PARADA! É o Henrique! Precisamos de USA!',
        dismissed: 'DONA IOLANDA: {m:Moço|Moça}! Ninguém veio! Ele tá roxo! Vocês não vão mandar ninguém pro doutor de vocês?!',
      },
      diary: {
        alive: 'Henrique Lacerda, 43, regulador do noturno. Parada no chão da sala, com a porta aberta. Voltou.',
        dead: 'Henrique Lacerda, 43, regulador do noturno. Parada no chão da sala, com a porta aberta. Ninguém rendeu ele.',
      },
    }),
    // ----------------------------------------------------------------- 11 ★ 18:58 — um desconhecido (Henrique denunciado, em tratamento)
    call({
      id: 'd20_final_rua',
      ref: 'D20 ★ 18:58 (rua)',
      at: '18:58',
      anchor: true,
      when: is.flag('denunciou_henrique'),
      num: '(17) 99140-7781',
      caller: 'Wellington (vendedor)',
      callerName: 'Wellington',
      type: 'testemunha',
      voice: 'jovem_h',
      note: 'Homem caído na calçada da Av. Brasil. Tem gente fazendo massagem.',
      noteFixed: true,
      addr: { rua: 'Av. Brasil', n: 2650, bairro: 'Centro', ref: 'Em frente à loja de móveis, perto do semáforo.' },
      amb: ['rua', 'buzinas', 'multidao'],
      open: [
        '{m:Moço|Moça}! {{Um homem caiu aqui na frente da loja|caiu}}, no ponto de ônibus! Ele {{não tá respirando|nao_respira}}!',
        '[buzinas; muita gente; uma mulher gritando "é o gari! Ele varre aqui todo dia!"]',
        '{{Eu já comecei a massagem! Do jeito que vocês ensinaram aquela vez!|ja_massagem}}',
      ],
      q: {
        respira: 'Faz um {{ronco de vez em quando|agonica}}. Igual daquela vez. Igualzinho.',
        consciencia: 'Não responde! Eu chamei, sacudi!',
        idade: 'Uns sessenta. É o Seu Dito, o gari.',
        inicio: 'Agora! Ele tava varrendo e caiu de lado!',
        historico: 'Não sei! Ele vive reclamando do coração, mas nunca vai no médico!',
        sangramento: 'Não. Bateu o rosto na guia.',
        seguranca: 'Seguro, o povo abriu roda.',
        referencia: 'Av. Brasil, 2650, em frente à loja de móveis, perto do semáforo. {{O mesmo lugar daquela vez, {m:moço|moça}!|mesmo_lugar}}',
        paciente: 'Ele não fala!',
      },
      extra: [
        {
          id: 'lembra',
          label: '"Wellington? Do começo do mês?"',
          kind: 'fala',
          say: 'Wellington? Você ligou aqui no começo do mês, por um homem caído nesse mesmo lugar.',
          a: ['Sou eu! Depois daquele dia eu fiz o curso de primeiros socorros dos Bombeiros! Três sábados!', 'Conta comigo, {dr}! Conta comigo que eu não paro!'],
          onAsk: fx.add('humanidade', 1, 'lembrou do Wellington'),
        },
      ],
      links: [
        { a: 'agonica', b: 'manual:parada', insight: 'Ronco de vez em quando, em quem não responde: respiração agônica. PARADA. USA + RCP guiada (Manual p.1).' },
        { a: 'mesmo_lugar', b: 'diario:d01_parada', insight: 'Av. Brasil, 2650. O mesmo semáforo do seu primeiro plantão. A mesma voz do outro lado: o vendedor que não sabia o que fazer. Hoje ele já começou a massagem.' },
        { a: 'ja_massagem', b: 'nao_respira', kind: 'confirma', insight: 'Não respira e já tem alguém comprimindo o peito. Não deixe parar: mande a USA e conte junto.' },
      ],
      guide: { id: 'rcp' },
      patient: { name: 'Seu Dito (gari)', age: 61, sex: 'M' },
      truth: { dx: 'Parada cardiorrespiratória', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 30, bad: 75, guideBonus: 30 } },
      onStamp: (e) => {
        if (foiBene(e, 'd20_final_rua')) e.set('bene_ultima');
      },
      onResolve: (e, r) => {
        e.set(r.outcome === 'obito' ? 'final_rua_obito' : 'final_rua_salvo');
      },
      radio: {
        saved: (c) =>
          foiBene(c, 'd20_final_rua')
            ? 'Central, USA 01 no semáforo. Fibrilação, um choque, voltou! O rapaz não parou um segundo. Quem tava contando com ele? Contou bonito, {bene}. A última do Bené voltou.'
            : 'Central, {unit} na Av. Brasil. Fibrilação, um choque, voltou. O rapaz que fazia a massagem não parou um segundo.',
        ok: (c) =>
          foiBene(c, 'd20_final_rua')
            ? 'Central, USA 01. Seu Dito com pulso, intubado. Seguimos {dest}. Duas quadras. A mais curta e a mais comprida da minha vida.'
            : 'Central, {unit}. Parada revertida na calçada, seguimos {dest}.',
        dead: (c) =>
          foiBene(c, 'd20_final_rua')
            ? 'Central... USA 01. Óbito às {hora}. O rapaz massageou até a gente chegar. Fez tudo certo, {bene}. Às vezes não basta.'
            : 'Central... {unit}. Óbito às {hora}. O rapaz fez tudo certo.',
        under: 'Central, {unit}! É PARADA! Precisamos de USA!',
        dismissed: 'WELLINGTON: {m:Moço|Moça}! Ninguém veio! Eu tô contando sozinho! Manda alguém, pelo amor de Deus!',
      },
      diary: {
        alive: 'Seu Dito, 61, gari. Parou varrendo a Av. Brasil, no semáforo do meu primeiro dia. O Wellington contou junto. Voltou.',
        dead: 'Seu Dito, 61, gari. Parou varrendo a Av. Brasil, no semáforo do meu primeiro dia. O Wellington contou até o fim.',
      },
    }),
  ],
});
