// =============================================================================
// DIA 7 — "O Vereador" (Manual p.7: período expulsivo, eclâmpsia, sangramento na
// gestação). Domingo.
// ★ 08:40, no mesmo minuto: o vereador Arlindo exige a "UTI móvel" para a mãe
// estável (ORI) e uma gestante de 34 semanas convulsiona (USA). Ceder ao VIP custa
// Integridade e pode deixar a eclâmpsia sem USA. Às 10:15 o assessor aparece na base.
// ★ Desengasgo guiado que vira RCP. ★ O motoboy com fratura exposta é o WESLEY,
// filho da Simone: depois do carimbo, um momento com ela (Lealdade +2 se você foi
// rápido e conversou). Em casa: o envelope de R$ 1.000 (a Lúcia decide se você
// estiver no bico). Fios: 🌱 vereador e Dona Odete (D18), Simone e Wesley (D12, D17).
// =============================================================================
import type { Ctx, Decision } from '../../engine/types';
import type { GuideScript } from '../../engine/content-api';
import { hm } from '../../engine/util';
import { day, call, fx, is, NUM, ADDR } from '../dsl';

/** decisão carimbada de uma ligação do dia (pelo id da definição; ignora variantes do banco) */
const decisao = (c: Ctx, defId: string): Decision | undefined =>
  c.s.shift ? Object.values(c.s.shift.calls).find((x) => x.def === defId && !x.gen)?.decision : undefined;

/** entrada do diário de uma ligação */
const noDiario = (c: Ctx, id: string) => c.s.diary.find((d) => d.id === id)?.kind;

// -----------------------------------------------------------------------------
// Orientação nova do dia: gestante após convulsão (eclâmpsia).
// -----------------------------------------------------------------------------
export const GUIDES_EXTRA: Record<string, GuideScript> = {
  // Conferido (RO2: DHEG severa convulsionando → USA; campo A4 e A6: decúbito lateral esquerdo, proteger a
  // cabeça, nada na boca, não conter a crise; sulfato de magnésio é da equipe, AGO14).
  eclampsia: {
    id: 'eclampsia',
    title: 'Orientação: convulsão na gestante',
    kind: 'dialogo',
    intro: 'Gestante depois de uma convulsão. Proteja a via aérea, deite do lado esquerdo e não deixe ninguém pôr nada na boca dela.',
    panic: 75,
    steps: [
      {
        say: 'Ela parou de tremer, mas tá roncando, babando, não acorda direito!',
        options: [
          { label: 'Vira ela de lado, de preferência para o lado esquerdo, com a boca virada pra baixo.', kind: 'certo' },
          { label: 'Senta ela e dá um copo d’água.', kind: 'errado', reply: 'Ela engasgou, tossiu tudo!' },
          { label: 'Respira. Você está fazendo tudo certo me ligando.', kind: 'calma' },
        ],
      },
      {
        say: 'Ela começou a tremer de novo! A barriga tá dura!',
        options: [
          { label: 'Não segura ela. Afasta os móveis, protege a cabeça e olha o relógio.', kind: 'certo' },
          { label: 'Põe uma colher na boca pra ela não morder a língua!', kind: 'errado', reply: 'Ela mordeu a colher e quebrou um dente!' },
          { label: 'Segura os braços dela com força.', kind: 'errado' },
        ],
      },
      {
        say: 'Parou. Ela tá respirando fundo... E o bebê? E o bebê?',
        options: [
          { label: 'Deixa ela do lado esquerdo: é o melhor pra ela e pro bebê. A equipe vai ouvir o coração dele.', kind: 'certo' },
          { label: 'Aperta a barriga pra ver se o bebê mexe.', kind: 'errado' },
          { label: 'Eu sei que dá medo. Fica do lado dela.', kind: 'calma' },
        ],
      },
      {
        say: 'A sirene! Tão chegando!',
        options: [
          { label: 'Abre a porta, prende o cachorro e separa a carteirinha do pré-natal pra equipe.', kind: 'certo' },
          { label: 'Vai lá fora esperar e deixa ela sozinha.', kind: 'errado' },
        ],
      },
    ],
    success: 'Ela chegou à equipe deitada de lado, respirando, sem nada na boca.',
    fail: 'A orientação teve falhas, mas a equipe chegou.',
  },
};

export const DAY = day({
  day: 7,
  title: 'O Vereador',
  weekday: 'Domingo',
  weather: 'Mormaço, 32 °C. Cheiro de churrasco em todos os bairros.',
  newspaper: (c) => {
    const viva = c.flag('hipo_mae_salva');
    const morta = c.flag('hipo_mae_morreu');
    const avc = noDiario(c, 'd06_avc');
    return {
      headline: viva
        ? 'Menina de 7 anos salva a mãe ligando para a emergência'
        : morta
          ? 'Mulher morre em casa; a filha de 7 anos estava sozinha com ela'
          : 'Sábado de AVC: Central de Regulação atende três "bocas tortas" em um dia',
      sub: viva
        ? 'Ana Clara destrancou a porta para a equipe da ambulância. A mãe, diabética, tinha dado o último pão para a filha e ficado sem café.'
        : morta
          ? c.flag('d6_hipo_dispensada')
            ? 'A menina ligou para a emergência de manhã. A ligação foi encerrada. Vizinhos chamaram a polícia à tarde.'
            : 'A menina ligou para a emergência e ficou na linha até o fim. A equipe chegou tarde demais.'
          : 'Neurologista do Regional lembra: o que conta é a última hora em que a pessoa foi vista bem.',
      photo: viva || morta ? 'casa' : 'hospital',
      stories: [
        avc === 'vivo' && c.flag('d6_avc_regional')
          ? { title: 'Tempo é cérebro: Seu Ademir já pede café', text: 'O aposentado que "acordou com a boca torta" no sábado foi levado direto ao Regional e passou pela trombólise. A esposa, Dona Neide, lembrou que ele tinha ido ao banheiro às cinco da manhã: foi o que salvou a janela. Ontem à noite ele já reclamava do café do hospital.' }
          : avc === 'vivo'
            ? { title: 'Tempo é cérebro', text: 'Idoso que "acordou com a boca torta" chega a tempo ao hospital. A esposa lembrou que ele tinha ido ao banheiro às cinco da manhã: foi o que salvou a janela.' }
            : { title: 'Tempo é cérebro', text: 'O Regional registrou dois casos de AVC no sábado. O neurologista lembra: sorrir, levantar os braços, falar uma frase. E anotar a hora.' },
        ...(c.flag('d5_benedita_radio') || c.flag('d5_benedita_levada')
          ? [{ title: 'Aos 86, "a primeira ambulância da vida"', text: 'Dona Benedita Alves, da Bela Vista, teve alta depois de dois dias de soro. "Nunca tinha precisado. Agora já sei como é", disse. Levou o terço e o radinho de pilha.' }]
          : []),
        { title: 'Missa pelos trabalhadores da saúde', text: '"Rezem pelos plantonistas", pediu o padre na Matriz. A Saúde+ Gestão não mandou representante.' },
        { title: 'Coluna social: domingo em família', text: 'O vereador Arlindo Matos posa com a mãe, Dona Odete, 82, "a mulher mais forte de Santa Aurora", no almoço de domingo na Bela Vista.' },
      ].slice(0, 4),
      notice: 'Nova página no Manual: 7 (obstetrícia — período expulsivo, eclâmpsia, sangramento na gestação).',
      ad: 'MOTO ENTREGAS JÁ — Seu pedido em 20 minutos ou é de graça! Contratamos motoboys com moto própria. Domingo paga em dobro.',
      weather: 'Mormaço · 32 °C',
    };
  },
  handover: () => ({
    id: 'd07_passagem',
    bg: 'central',
    cast: ['SIMONE'],
    nodes: {
      start: {
        lines: [
          { who: 'NARRADOR', t: '07:00. Domingo. A Simone chegou antes de todo mundo e está sorrindo, o que é raro.' },
          { who: 'SIMONE', t: 'Bom dia, {dr}. Hoje eu tô boba: meu filho, o Wesley, comprou moto. Vai fazer entrega de aplicativo. Domingo paga em dobro.' },
          { who: 'NARRADOR', t: 'Ela mostra uma foto no celular: um rapaz magro de capacete vermelho, fazendo joinha em cima de uma moto que ainda tem o plástico no banco.' },
        ],
        choices: [
          { label: '"Parabéns pro Wesley, Simone."', next: 'parabens' },
          { label: '"Fala pra ele ir devagar."', next: 'devagar' },
        ],
      },
      parabens: {
        lines: [{ who: 'SIMONE', t: 'Vou falar. Ele vai ficar todo bobo. Ele acha que {m:o doutor|a doutora} da central é gente importante.' }],
      },
      devagar: {
        lines: [{ who: 'SIMONE', t: 'Falo todo dia, {dr}. Ele tem dezenove anos. Ninguém de dezenove anos vai devagar.' }],
      },
    },
  }),
  // 1.1 — ida (a missa da Dona Dirce), almoço INTERROMPIDO às 13:05 (a marmita que o Wesley fez) e volta (o carro preto)
  ida: () => ({
    id: 'd07_ida',
    bg: 'calcada',
    cast: [],
    nodes: {
      start: {
        lines: [
          { who: 'NARRADOR', t: '06:15. Domingo, o 12 passa de meia em meia hora. Você espera vinte minutos no ponto com a Dona Dirce, de véu na bolsa, indo para a missa das sete.' },
          { who: 'DIRCE', t: 'A missa hoje é pelos plantonistas, {dr}. Eu vou pedir por você. Pede você também, que santo gosta de ouvir a voz do interessado.' },
        ],
      },
    },
  }),
  almoco: (c) => {
    const w = c.s.shift ? Object.values(c.s.shift.calls).find((x) => x.def === 'd07_wesley' && !x.gen) : undefined;
    if (w?.decision) {
      return {
        id: 'd07_almoco',
        bg: 'central',
        cast: ['SIMONE'],
        nodes: { start: { lines: [{ who: 'NARRADOR', t: '13:00. A marmita que o Wesley deixou pra mãe está fechada em cima da mesa, com o bilhete preso na tampa: "pra minha mãe não comer bolacha". Ninguém almoça.' }] } },
      };
    }
    return {
      id: 'd07_almoco',
      bg: 'central',
      cast: ['SIMONE'],
      nodes: {
        start: {
          lines: [
            { who: 'NARRADOR', t: '13:00. Domingo. A Simone abre a marmita com cuidado de quem abre presente.' },
            { who: 'SIMONE', t: 'O Wesley que fez, {dr}. Arroz, feijão e um bife que parece sola. Ele saiu cedo com a moto nova e deixou isso na geladeira com um bilhete: "pra minha mãe não comer bolacha".' },
            { who: 'SIMONE', t: 'Dezenove anos. Dezenove anos e ele fez arroz.' },
            { who: 'NARRADOR', t: 'Ela ri. Pega o garfo.' },
            w
              ? { who: 'NARRADOR', t: 'A sua linha já está piscando. No visor: "SEU EDINHO (FEIRANTE) · AV. BRASIL, 2780".' }
              : { who: 'NARRADOR', t: '13:05. A sua linha acende. No visor: "SEU EDINHO (FEIRANTE) · AV. BRASIL, 2780".' },
            { who: 'NARRADOR', t: 'O relógio volta a correr. A Simone ainda está com o garfo no ar quando você atende.' },
          ],
        },
      },
    };
  },
  volta: () => ({
    id: 'd07_volta',
    bg: 'calcada',
    cast: [],
    nodes: {
      start: {
        lines: [
          { who: 'NARRADOR', t: '19:50. Na Vila, um carro preto de vidro escuro está estacionado na sua rua, motor ligado. No banco do motorista, um homem de terno fala ao celular.' },
          { who: 'NARRADOR', t: '"...Pode deixar. Tá bom? Tá bom." Ele desliga, ajeita a gravata no retrovisor e olha para a casa azul.' },
          { who: 'NARRADOR', t: 'O Ozzy, no portão, para de abanar o rabo.' },
        ],
      },
    },
  }),
  timeline: [
    { at: '07:02', kind: 'radio', who: 'USA 01 · BENÉ', text: 'Central, USA 01 em QRV. Domingo, {bene}: almoço de família. Engasgo, queimadura de churrasco e briga de cunhado.' },
    { at: '08:41', kind: 'simone', who: 'SIMONE', text: 'Duas linhas ao mesmo tempo, {dr}. Uma delas sabe o seu nome. A outra precisa de você.' },
    {
      at: '10:15',
      kind: 'script',
      id: 'assessor_base',
      run: (c) => {
        const res = c.callStatus('d07_vereador')?.decision?.resource;
        if (res === 'USA' || res === 'USB') return; // já ganhou a viatura
        const u = c.freeUnits('USA').find((x) => x.status === 'QRV');
        if (!u) return;
        c.request(
          u.radioName,
          `Central, ${u.label} na base. Tem um rapaz de terno aqui, assessor do vereador Arlindo. Diz que é "ordem do Dr. Peixoto" levar a mãe do vereador pro Regional fazer exame. Quer que a gente saia agora.`,
          [
            {
              id: 'nega',
              label: 'Negar: viatura só sai com regulação',
              effect: (s) => s.set('d7_assessor_negado'),
              reply: 'Entendido, Central. Falei pra ele ligar pra emergência igual todo mundo. Ele anotou o meu nome. E perguntou o seu.',
            },
            {
              id: 'peixoto',
              label: 'Confirmar com o Peixoto antes (10 min)',
              cost: 10,
              effect: (s) => {
                s.set('d7_assessor_negado');
                s.modal('DR. PEIXOTO', 'Ordem minha? Eu não dei ordem nenhuma, {dr}. ...Mas também não quero confusão com vereador. Faz o que o Manual manda e me deixa fora disso.', 'interfone');
              },
              reply: 'Entendido, Central. O assessor foi embora falando no celular.',
            },
            {
              id: 'libera',
              label: `Liberar a ${u.label} para buscar a Dona Odete`,
              effect: (s) => {
                s.add('integridade', -2, 'viatura para o vereador');
                s.set('d7_usa_vip');
                // o pedido fica aberto alguns minutos: se a USA já saiu para outra ocorrência, não a tira de lá
                if (u.status === 'QRV' || u.status === 'RETORNO') s.setUnit(u.id, 'FORA', s.now + 110, 'Transporte VIP (vereador)');
              },
              reply: 'Entendido... saindo, com o carro do assessor na frente, de batedor. Que vergonha, Central.',
            },
          ],
          'nega',
          8,
        );
      },
    },
    {
      at: '13:10',
      kind: 'script',
      id: 'vigia_wesley',
      run: (c) => {
        if (c.sflag('simone_agendada')) return;
        const cl = c.callStatus('d07_wesley');
        if (!cl) return;
        if (cl.decision) {
          c.sflag('simone_agendada', true);
          c.schedule(c.now + 12, 'simone_wesley');
          return;
        }
        if (c.now < hm('18:30')) c.schedule(c.now + 5, 'vigia_wesley');
      },
    },
    {
      // Agendado pelo vigia ~12 min depois do carimbo do Wesley. O horário nominal (18:58)
      // é só a rede de segurança: a flag do turno garante que o momento acontece uma vez.
      at: '18:58',
      kind: 'simone',
      id: 'simone_wesley',
      who: 'SIMONE',
      when: (c) => (c.flag('wesley_atendido') || c.flag('d7_wesley_dispensado')) && !c.s.shift?.flags['simone_wesley_feito'],
      run: (c) => {
        c.sflag('simone_wesley_feito', true);
      },
      defaultOption: 'falar',
      text: (c) =>
        c.flag('wesley_atendido')
          ? 'Era o meu filho, {dr}. O Wesley. (ela segura o fone com as duas mãos) Eu contei os minutos até a ambulância sair. Eu contei.'
          : 'Era o meu filho, {dr}. O Wesley. Com o osso pra fora. E você... (ela não termina a frase)',
      options: [
        {
          id: 'ir',
          label: '"Vai ver o seu filho, Simone. Eu seguro a fila."',
          effect: (c) => {
            if (c.flag('wesley_atendido')) {
              c.add('lealSimone', 2, 'deixou a Simone ver o Wesley');
              c.add('humanidade', 1, 'cuidou da Simone');
              c.set('simone_wesley_conversa');
            } else c.add('lealSimone', -1, 'o Wesley');
            c.set('d7_simone_hospital');
            c.shift.simoneAway = true;
            c.schedule(c.now + 90, 'simone_volta');
          },
          reply: (c) =>
            c.flag('wesley_atendido')
              ? '(pega a bolsa e para na porta) Eu volto antes do fim do plantão, {dr}. Os post-its ficam por sua conta.'
              : '(pega a bolsa sem olhar pra você) Eu vou ver o meu filho. Na UPA, que foi pra onde ele foi, de táxi.',
        },
        {
          id: 'falar',
          label: '"Senta um minuto. Como você tá?"',
          effect: (c) => {
            if (c.flag('wesley_atendido')) {
              c.add('lealSimone', 2, 'conversou com a Simone');
              c.set('simone_wesley_conversa');
            } else c.add('lealSimone', -1, 'o Wesley');
          },
          reply: (c) =>
            c.flag('wesley_atendido')
              ? 'Eu tô... (ela ri e chora ao mesmo tempo) A moto tinha três parcelas pagas, {dr}. Três. ...Obrigada por ter sido {m:rápido|rápida}.'
              : 'Não, {dr}. Hoje eu não sento.',
        },
        {
          id: 'fila',
          label: '"Agora não, Simone. A fila tá cheia."',
          effect: (c) => c.add('lealSimone', c.flag('wesley_atendido') ? -1 : -3, 'a fila antes da Simone'),
          reply: (c) => (c.flag('wesley_atendido') ? '(põe o fone de volta) Tá certo. A fila não para. Nunca para.' : '(põe o fone de volta, devagar) Tá certo. A fila.'),
        },
      ],
    },
    {
      at: '18:59',
      kind: 'script',
      id: 'simone_volta',
      run: (c) => {
        if (!c.shift.simoneAway || !c.flag('d7_simone_hospital')) return;
        c.shift.simoneAway = false;
        c.radio('SIMONE', c.flag('wesley_atendido') ? 'Voltei, {dr}. Ele tá no centro cirúrgico, vai pôr pino. Me dá a fila.' : 'Voltei. Me dá a fila, {dr}.', 'info');
      },
    },
    {
      at: '15:30',
      kind: 'script',
      id: 'peixoto_vereador',
      run: (c) => {
        const res = c.callStatus('d07_vereador')?.decision?.resource;
        if (!res && !c.flag('d7_usa_vip')) return;
        if (res === 'USA' || c.flag('d7_usa_vip')) {
          c.modal('DR. PEIXOTO', 'O vereador Arlindo me ligou, {dr}. Domingo! Pra agradecer! Quatro anos nessa cadeira e é a primeira vez que um vereador me agradece. ...Não sei se eu fico feliz ou preocupado.', 'interfone');
        } else {
          c.modal('DR. PEIXOTO', 'O vereador Arlindo me ligou no celular, {dr}. Domingo. Disse que você foi "burocrático" com a mãe dele. Eu disse que você seguiu o protocolo. ...Ele disse que vai lembrar. Eu também vou.', 'interfone');
        }
      },
    },
    { at: '18:20', kind: 'radio', who: 'USB 02 · RAMON', text: 'Central, USB 02 recolhendo. Domingo: dois partos na conta da semana e nenhum no carro. Por enquanto.' },
  ],
  calls: [
    // ------------------------------------------------------------------ 1
    call({
      id: 'd07_sangramento',
      ref: 'D7 #1',
      at: '07:15',
      pool: 'obstetricia,leve',
      num: '(17) 99367-1610',
      caller: 'Aline (a própria)',
      callerName: 'Aline',
      type: 'comum',
      voice: 'jovem_m',
      note: 'Grávida. Sangramento pequeno, assustada.',
      noteWrong: 'Grávida sangrando muito!',
      addr: { rua: 'Rua das Acácias', n: 1610, bairro: 'Vila Esperança', ref: 'Casa rosa, em frente ao campinho.' },
      amb: ['passaros', 'silencio'],
      open: ['Bom dia... eu tô grávida, de vinte semanas. Fui no banheiro e {{tinha um pouquinho de sangue na calcinha|pouquinho}}. É normal? {{Tô com tanto medo|medo}}...'],
      q: {
        oque: 'Acordei, fui fazer xixi e vi umas gotinhas. Rosado. Ontem eu carreguei as compras do mercado sozinha.',
        sangramento: ['Pouquinho. {{Umas gotinhas, rosadas|gotinhas}}. Não escorreu, não encheu o absorvente.', 'Não voltou a sair.'],
        gestacao: 'Vinte semanas, primeiro filho. Pré-natal em dia. Sem dor de cabeça, sem convulsão, sem nada.',
        consciencia: 'Acordada.',
        respira: 'Normal.',
        idade: 'Vinte e seis.',
        inicio: 'Agora cedo, umas seis e meia.',
        historico: 'Nada. A pressão sempre deu boa no pré-natal.',
        paciente: 'Sou eu mesma.',
        seguranca: 'Seguro. O Fábio tá aqui do meu lado.',
      },
      extra: [
        {
          id: 'dor',
          label: 'Dor? Cólica? O bebê mexe?',
          say: 'Você está com dor, cólica ou contração? O bebê está mexendo?',
          a: '{{Nenhuma dor|sem_dor}}. Nada de cólica. E ele mexeu agora, olha... [ri chorando] {{mexeu de novo|mexeu}}.',
        },
        {
          id: 'orientar',
          kind: 'fala',
          label: 'Orientar ida à Maternidade',
          say: 'Não parece urgência agora, mas precisa ser avaliado hoje. Vai à Maternidade Municipal com alguém, de carro, sem pressa. Se o sangue aumentar, vier dor forte ou febre, liga de novo na hora.',
          // Conferido (RO1: sangramento não intenso → orientação; avaliação no mesmo dia na Maternidade).
          a: 'O Fábio tem carro. Ele tá aqui do lado, branco que nem papel. ...Tá bom. Obrigada, {dr}. De verdade.',
        },
      ],
      links: [
        { a: 'gotinhas', b: 'manual:sangramento_gest', insight: 'Sangramento pequeno, sem dor, bebê mexendo: não é urgência imediata. Avaliação na Maternidade por meios próprios (Manual p.7).' },
        { a: 'sem_dor', b: 'mexeu', kind: 'confirma', insight: 'Sem dor nem contração e o bebê mexendo: sinais tranquilizadores.' },
      ],
      patient: { name: 'Aline Barros', age: 26, sex: 'F' },
      // RO1: "sangramento vaginal não intenso" → orientação; "sangramento vaginal com mais de 20 semanas" → USI/USB
      // (no RC13, com dor abdominal, chega a USA). Com exatamente 20 semanas, gotas, sem dor e bebê mexendo:
      // orientação preferida, USB ⚖ (antes era excesso).
      truth: { dx: 'Sangramento pequeno na gestação (20 semanas), sem dor', sev: 'verde', ok: ['ORI', 'USB'], best: 'ORI', ref: ['MAT'] },
      radio: { excess: 'Central, {unit}. Gestante de 20 semanas, sangramento de gotinhas, bebê mexendo. O marido tinha carro na porta, {dr}.' },
      diary: { ori: 'Grávida de 20 semanas, gotinhas de sangue, sem dor. O bebê mexeu durante a ligação. Foi de carro à Maternidade.' },
    }),
    // ------------------------------------------------------------------ 2 ★ VIP
    call({
      id: 'd07_vereador',
      ref: 'D7 #2 ★',
      at: '08:40',
      anchor: true,
      num: NUM.vereador,
      caller: 'Vereador Arlindo Matos',
      callerName: 'Vereador Arlindo',
      type: 'vip',
      voice: 'grave',
      note: 'VEREADOR ARLINDO MATOS. Quer a "UTI móvel" pra mãe.',
      noteFixed: true,
      addr: ADDR.odete,
      amb: ['tv', 'passaros'],
      open: [
        'Bom dia. Aqui é o vereador {{Arlindo Matos|arlindo}}. Minha mãe tá {{fraquinha|fraquinha}} e eu quero {{a UTI móvel|uti_movel}}, a ambulância boa, pra levar ela no Regional fazer uns exames.',
        '{{Você sabe com quem tá falando?|sabe_quem}}',
      ],
      q: {
        oque: 'Ela tá fraquinha. Não quis o café da manhã inteiro, comeu só meio pão. Na idade dela a gente não arrisca.',
        consciencia: 'Acordada. Vendo a missa na TV.',
        respira: 'Respira, ué. Normal.',
        idade: 'Oitenta e dois.',
        inicio: 'Desde ontem ela tá mais quietinha.',
        historico: 'Pressão, colesterol. Toma tudo certinho. Tem cuidadora de segunda a sábado.',
        sangramento: 'Não.',
        dorpeito: 'Dor no peito? Não. Mãe, dói o peito? ...Não.',
        fast: ['Que teste é esse? ...Mãe, sorri. Levanta o braço. Fala alguma coisa.', '...Tá, ela fez tudo. {{Tá normal|fast_ok}}. Isso é perda de tempo, {dr}.'],
        paciente: [
          '[o vereador passa o telefone, contrariado]',
          'ODETE: Alô? Bom dia, {meu} {filho}. {{Eu tô bem, {meu} {filho}, é ele que inventa|odete_bem}}.',
          'ODETE: {{Comi meu mamão, tomei meu remédio|odete_comeu}}. Ele quer me levar pra fazer exame no domingo porque segunda ele tem sessão na Câmara.',
        ],
        referencia: 'A casa de esquina, grade dourada. Todo mundo conhece.',
        seguranca: 'Seguríssimo. Tem segurança na porta.',
        pulso: ['ODETE (ao fundo): Setenta e dois, Arlindo! O aparelhinho da cuidadora diz setenta e dois!', 'VEREADOR: ...Setenta e dois. Mas pode piorar!'],
        pele: 'Corada. Normal. ...Ela passou batom, {dr}. Pra ir no hospital. Isso não é sinal de nada?',
      },
      extra: [
        {
          id: 'resposta_vip',
          kind: 'fala',
          label: '"Sei, sim, vereador."',
          say: 'Sei, sim, vereador. E o senhor está falando com a Regulação, que atende todo mundo pela gravidade.',
          a: ['[silêncio]', 'Qual é o seu nome completo, {dr}? É pra eu anotar. Eu anoto tudo.'],
        },
        {
          id: 'orientar',
          kind: 'fala',
          label: 'Orientar o exame de rotina',
          say: 'Pelo que ela me disse, ela está estável. Exame de rotina se agenda pelo médico dela ou pela UBS. Ambulância é para emergência.',
          a: ['Pela UBS. Pela UBS! Eu sou da comissão de saúde da Câmara, {dr}!', 'ODETE (ao fundo): Arlindo, deixa {m:o moço|a moça} trabalhar. Vai, desliga isso.'],
        },
      ],
      links: [
        { a: 'odete_bem', b: 'fraquinha', insight: '"Fraquinha", diz o filho. "Tô bem, é ele que inventa", diz a paciente, que comeu e tomou o remédio. Paciente estável: orientação.' },
        { a: 'uti_movel', b: 'manual:usa_criterio', insight: 'A USA é para risco imediato de morte. Não existe "UTI móvel para exame" no Manual. Nem para vereador (Manual p.1).' },
        { a: 'odete_comeu', b: 'manual:azul', insight: 'Comeu, tomou o remédio, conversa e não tem queixa: estável. Azul, orientação (Manual p.1).' },
      ],
      onStamp: (e) => {
        const d = decisao(e, 'd07_vereador');
        if (!d) return;
        if (d.resource === 'USA') {
          e.add('integridade', -1, 'privilégio ao vereador');
          e.set('d7_vereador_usa');
        } else if (d.resource === 'USB') e.set('d7_vereador_usb');
        else e.set('d7_vereador_ori');
      },
      patient: { name: 'Odete Matos', age: 82, sex: 'F' },
      truth: { dx: 'Idosa estável (transporte para exame de rotina)', sev: 'azul', ok: ['ORI'], ref: ['UBS', 'CASA'] },
      radio: {
        excess: '{central}, {unit} na casa do vereador. A Dona Odete tá ótima, {dr}. Ofereceu bolo pra equipe. O vereador quer que a gente leve ela pro Regional "de sirene ligada". A gente vai levar. Ordem é ordem.',
      },
      diary: {
        ori: 'O vereador Arlindo quis a "UTI móvel" para a mãe fazer exames. Dona Odete: "Eu tô bem, {meu} {filho}, é ele que inventa."',
        alive: 'Dona Odete, 82, levada de ambulância para exames de rotina, a pedido do filho vereador.',
      },
    }),
    // ------------------------------------------------------------------ 3 ★ eclâmpsia (mesmo minuto)
    call({
      id: 'd07_eclampsia',
      ref: 'D7 #3 ★',
      at: '08:40',
      anchor: true,
      num: '(17) 99503-2210',
      caller: 'Robson (marido)',
      callerName: 'Robson',
      type: 'comum',
      voice: 'jovem_h',
      note: 'Marido. Grávida se debatendo!',
      noteFixed: true,
      addr: { rua: 'Rua Pitangueira', n: 2210, bairro: 'Jardim Primavera', ref: 'Sobrado amarelo com garagem de portão de madeira.' },
      amb: ['gritos', 'choro', 'cachorro'],
      open: [
        'Socorro! Minha mulher tá {{se debatendo toda no chão|convulsao}}! Ela tá grávida! {{A pressão dela tava alta no posto|pressao_alta}}!',
        '[um baque; um cachorro latindo sem parar; o homem gritando "Kátia! Kátia!"]',
      ],
      q: {
        gestacao: ['{{Trinta e quatro semanas|semanas_34}}. Primeiro filho.', 'Ela reclamou de {{dor de cabeça forte desde ontem e de ver umas luzinhas|luzinhas}}.'],
        oque: 'Ela tava deitada, falou que a cabeça ia explodir. Aí revirou o olho e começou a tremer toda.',
        consciencia: ['Parou de tremer agora... {{ela não acorda direito|nao_acorda}}, tá roncando.', 'O olho abre e fecha.'],
        respira: 'Tá {{roncando alto|ronco}}, babando.',
        inicio: 'Agora! Um minuto!',
        idade: 'Vinte e nove.',
        historico: '{{No posto a pressão deu 16 por 11 semana passada|pa_16_11}}. Mandaram ela repousar. O pé tá inchado faz dias.',
        sangramento: 'Não vi sangue. Ela mordeu a língua.',
        dorpeito: 'Ela reclamou de uma dor aqui em cima da barriga, na boca do estômago.',
        paciente: 'Ela não fala! Não fala!',
        seguranca: 'Seguro! Tirei a mesinha de perto!',
        referencia: 'Sobrado amarelo, garagem de madeira.',
        pulso: 'Tá batendo! Forte, rápido, aqui no pescoço!',
        pele: 'Vermelha, suada... a boca tá meio roxa, babando. Agora tá voltando a cor, eu acho.',
      },
      extra: [
        {
          id: 'de_lado',
          kind: 'fala',
          label: 'Orientar: virar de lado',
          say: 'Vira ela de lado, de preferência para o lado esquerdo, com a boca virada pra baixo. Não põe nada na boca dela. Afasta os móveis.',
          // Conferido (campo A4/A6: decúbito lateral esquerdo na gestante, proteger de trauma, nada na boca).
          a: 'Virei, virei! Ela tá babando, mas respira... ronca menos agora.',
        },
      ],
      links: [
        { a: 'convulsao', b: 'manual:eclampsia', insight: 'Gestante de 34 semanas com convulsão, pressão alta e dor de cabeça forte: eclâmpsia. Vermelho → USA (Manual p.7).' },
        { a: 'luzinhas', b: 'pressao_alta', kind: 'confirma', insight: 'Dor de cabeça forte e "luzinhas" com pressão 16 por 11: pré-eclâmpsia grave que virou eclâmpsia.' },
        { a: 'nao_acorda', b: 'manual:vermelho', insight: 'Depois da convulsão, ela não acorda direito e ronca: via aérea em risco. Vermelho (Manual p.1).' },
      ],
      patient: { name: 'Kátia Cardoso', age: 29, sex: 'F' },
      truth: { dx: 'Eclâmpsia (34 semanas)', sev: 'vermelho', ok: ['USA'], risk: { good: 50, bad: 120 } },
      guide: { id: 'eclampsia' },
      radio: {
        ok: '{central}, {unit}. Eclâmpsia, pressão 18 por 12. Sulfato correndo. Seguimos Maternidade. Batimento do bebê presente.',
        under: 'Central, {unit}! Gestante pós-convulsão, pressão 18 por 12, voltou a convulsionar! Precisa de USA!',
        dead: 'Central... {unit}. Perdemos a mãe às {hora}. A equipe da Maternidade tá tentando pelo bebê. (pausa) Sem mais, Central.',
        dismissed: 'ROBSON: Ela tá tremendo de novo! De novo! Pelo amor de Deus, cadê a ambulância?!',
      },
      diary: {
        alive: 'Eclâmpsia com 34 semanas. A pressão tinha dado 16 por 11 no posto. Mãe e bebê vivos.',
        dead: 'Eclâmpsia com 34 semanas. A ligação chegou no mesmo minuto que a do vereador.',
      },
    }),
    // ------------------------------------------------------------------ 4
    call({
      id: 'd07_parto',
      ref: 'D7 #4',
      at: '09:50',
      pool: 'obstetricia',
      num: '(17) 3326-2950',
      caller: 'Dona Irene (mãe da gestante)',
      callerName: 'Dona Irene',
      type: 'comum',
      voice: 'idosa',
      note: 'Mãe da gestante. "Tô vendo a cabeça!"',
      noteWrong: 'Gestante com contração, ainda no começo.',
      addr: { rua: 'Rua Goiás', n: 2950, bairro: 'Vila Esperança', ref: 'Vila de casas, a terceira, portão vermelho.' },
      amb: ['gemidos', 'agua'],
      open: [
        '{m:Moço|Moça}! Minha filha tá parindo no banheiro! {{Tô vendo a cabeça do bebê|cabeca}}! Tá saindo!',
        '[gritos ritmados de esforço; água correndo]',
      ],
      q: {
        gestacao: '{{Trinta e nove semanas|semanas_39}}. Segundo filho. Pré-natal tudo normal, pressão boa. Sem convulsão, sem dor de cabeça.',
        oque: 'A bolsa estourou faz meia hora, as dores vieram uma atrás da outra. Ela entrou no banheiro e não quis mais sair.',
        consciencia: 'Acordada, gritando!',
        respira: 'Respira, ofegante, fazendo força.',
        idade: 'Vinte e dois.',
        inicio: 'A bolsa, meia hora. A força, agora.',
        sangramento: 'Pouquinho, misturado com a água.',
        historico: 'Nada. O primeiro também nasceu rapidinho.',
        paciente: ['BIANCA: Mãe... {{tá vindo... eu preciso fazer força|forca}}...'],
        seguranca: 'Seguro.',
        referencia: 'Vila de casas, a terceira, portão vermelho.',
      },
      links: [
        { a: 'cabeca', b: 'manual:expulsivo', insight: 'Cabeça visível e vontade de fazer força: período expulsivo. USB + orientação de parto por telefone (Manual p.7).' },
        { a: 'forca', b: 'manual:inicio_parto', insight: 'Não é início de trabalho de parto: com vontade de fazer força e a cabeça aparecendo, não dá tempo de ir por meios próprios (Manual p.7).' },
      ],
      worsen: [{ after: 60, lines: ['DONA IRENE: Nasceu! Nasceu aqui no tapete do banheiro! Ela tá roxinha, {m:moço|moça}!'], guide: 'parto' }],
      guide: { id: 'parto' },
      patient: { name: 'Bianca Mendes', age: 22, sex: 'F' },
      // RO2: parto iminente → USI/USB, "para garantir o melhor tempo-resposta enquanto aguarda o suporte avançado";
      // "apresentação de partes fetais" está na lista de USA. Termo, segundo filho, pré-natal normal: USB preferida
      // (Manual p.7), USA ⚖ (antes era excesso).
      truth: { dx: 'Parto em período expulsivo', sev: 'amarelo', ok: ['USB', 'USA'], best: 'USB' },
      radio: {
        ok: 'Central, {unit}. Menina, nasceu no tapete do banheiro, chorando forte. Mãe bem. Seguimos Maternidade. A avó quer o nome de quem orientou, pra pôr no batizado.',
        excess: '{central}, {unit}. Parto normal, nasceu antes da gente chegar, tudo bem. A USB fazia isso, {dr}.',
      },
      diary: { alive: 'Parto no banheiro, orientado por telefone. Menina. Chorou forte.' },
    }),
    // ------------------------------------------------------------------ 5 (desengasgo que vira RCP)
    call({
      id: 'd07_engasgo',
      ref: 'D7 #5',
      at: '10:50',
      pool: 'grave,respiratorio',
      num: '(17) 3329-1240',
      caller: 'Sandra (filha)',
      callerName: 'Sandra',
      type: 'comum',
      voice: 'mulher',
      note: 'Filha. Pai engasgado no almoço!',
      noteWrong: 'Filha. Pai tossindo no almoço, já melhorando.',
      addr: { rua: 'Rua Bahia', n: 1240, bairro: 'Centro', ref: 'Casa com churrasqueira na garagem, portão aberto.' },
      amb: ['cozinha', 'gritos', 'multidao'],
      open: [
        'Socorro! Meu pai {{tá engasgado com carne|engasgado}}! {{Ele não consegue falar|nao_fala}}, tá com a mão no pescoço!',
        '[gritos; alguém dando tapas nas costas dele; uma criança chorando]',
      ],
      q: {
        oque: 'Churrasco de domingo! Ele pegou um pedaço grande de carne, riu de uma piada e engasgou!',
        respira: 'Não sai ar! {{Ele faz um chiado fininho e para|chiado_fino}}!',
        consciencia: 'Tá acordado, desesperado, olhando pra mim!',
        idade: 'Setenta e oito!',
        inicio: 'Agora! Um minuto!',
        historico: 'Usa dentadura. Pressão.',
        sangramento: 'Não!',
        paciente: ['[um som de ar que não passa]', 'SANDRA: Ele não fala, ele só balança a cabeça!'],
        seguranca: 'Seguro!',
      },
      extra: [
        {
          id: 'tosse',
          label: 'Ele consegue tossir ou falar?',
          say: 'Ele consegue tossir com força ou falar alguma palavra?',
          a: '{{Não! Nem tosse! Só a mão no pescoço|nao_tosse}}! Tá ficando roxo!',
        },
      ],
      links: [
        { a: 'nao_tosse', b: 'manual:vermelho', insight: 'Engasgo sem conseguir tossir nem falar: obstrução total da via aérea. Vermelho → USA + desengasgo guiado (Manual p.1).' },
        { a: 'nao_fala', b: 'chiado_fino', kind: 'confirma', insight: 'Não fala e só um chiado fino: quase nenhum ar passa. Cada segundo conta.' },
      ],
      patient: { name: 'Geraldo Nascimento', age: 78, sex: 'M' },
      truth: { dx: 'Obstrução de via aérea (engasgo com carne)', sev: 'vermelho', ok: ['USA'], risk: { good: 25, bad: 60, guideBonus: 30 } },
      guide: { id: 'desengasgo_rcp' },
      radio: {
        ok: '{central}, {unit}. Pedaço de carne retirado com a pinça. A manobra da filha já tinha soltado metade. Saturando bem. Ele pediu pra terminar o almoço. Não deixamos.',
        saved: '{central}, {unit}. Pegamos em parada, a filha massageando do jeito que você mandou. Tiramos a carne com a pinça e voltou pulso. Contou bonito, {dr}.',
        dead: 'Central... {unit}. Óbito às {hora}. A churrasqueira ainda tava acesa.',
        under: 'Central, {unit}! Engasgo evoluiu pra parada! Precisamos de USA!',
        dismissed: 'SANDRA: Ele caiu! Ele caiu no chão e não respira! Ninguém veio!',
      },
      diary: {
        alive: 'Engasgou com carne no churrasco de domingo, aos 78. A filha fez a manobra pelo telefone.',
        dead: 'Engasgou com carne no churrasco de domingo, aos 78.',
      },
    }),
    // ------------------------------------------------------------------ 6 ★ Cida
    call({
      id: 'd07_cida',
      ref: 'D7 #6 ★',
      at: '11:50',
      anchor: true,
      num: NUM.cida,
      caller: 'Dona Cida',
      callerName: 'Dona Cida',
      type: 'frequentador',
      voice: 'cida',
      note: 'Dona Cida. Domingo de bolo. Queimou o dedo.',
      noteFixed: true,
      addr: ADDR.cida,
      amb: ['cozinha', 'tv'],
      open: [
        'Oi, {meu} {filho}, é a Cida! Bom domingo! Ó, tô fazendo bolo de laranja pro grupo da igreja e {{queimei a pontinha do dedo no forno|queimou}}.',
        '{{Passei pasta de dente, que a minha mãe ensinava|pasta}}. Fiz certo?',
      ],
      q: {
        oque: 'Encostei na grade do forno pra tirar a forma. Fez uma bolhinha deste tamaninho.',
        sangramento: 'Não.',
        idade: 'Setenta e nove.',
        consciencia: 'Acordada, com cheiro de bolo.',
        respira: 'Respirando.',
        historico: 'Pressão. Tomo o remédio.',
        paciente: 'Sou eu mesma!',
        inicio: 'Agorinha.',
        seguranca: 'Seguro. O forno já desliguei.',
        pulso: 'Normal, {meu} {filho}. O dedo é que tá batendo, que nem coração pequenininho.',
        pele: 'Só a pontinha do dedo vermelha. O resto, corada de forno.',
      },
      extra: [
        {
          id: 'tamanho',
          label: 'Tamanho da queimadura?',
          say: 'De que tamanho é a queimadura, Dona Cida? Pegou só o dedo? A pele soltou?',
          a: '{{Só a pontinha do indicador|pontinha}}. Uma bolhinha que nem um grão de feijão. A pele tá inteira.',
        },
        {
          id: 'orientar',
          kind: 'fala',
          label: 'Orientar a queimadura',
          say: 'Tira a pasta de dente e deixa o dedo debaixo da água corrente fria, uns dez a vinte minutos. Não estoura a bolha e não passa nada: nem pasta, nem manteiga, nem pó de café.',
          // Conferido (campo A10: BT18 — resfriar no máximo 20 min, não romper bolhas; RT7: dor leve → orientação).
          a: ['Pó de café eu ia passar depois! Ai, {meu} {filho}, o que seria de mim sem você.', 'Tá na torneira. Tá aliviando.'],
        },
        {
          id: 'conversar',
          kind: 'fala',
          label: 'Conversar um pouco com ela',
          cost: 15,
          say: 'E o bolo é pra quem, Dona Cida?',
          a: [
            'Pro grupo das senhoras, na terça! Tem uma amiga nova lá, sabia? Uma senhora brava, engraçada... diz que {m:o filho é médico|a filha é médica} e não come direito.',
            'Ela fala desse {m:filho|filha} com um orgulho... igual eu falava do meu falecido.',
            '[risada]',
            'Domingo é o pior dia, {meu} {filho}. Ninguém liga. Só eu que ligo.',
          ],
          onAsk: fx.all(fx.add('humanidade', 1, 'conversou com a Dona Cida'), fx.set('cida_conversou_d7')),
        },
      ],
      links: [
        { a: 'pontinha', b: 'manual:azul', insight: 'Queimadura pequena na ponta do dedo, pele inteira: orientação por telefone (Manual p.1).' },
        { a: 'pasta', b: 'pontinha', kind: 'confirma', insight: 'Queimadura pequena: o que ela precisa é de água corrente fria, não de pasta de dente.' },
      ],
      onAnswer: fx.set('cida_ligou_d7'),
      patient: { name: 'Aparecida (Dona Cida)', age: 79, sex: 'F' },
      truth: { dx: 'Queimadura pequena no dedo (forno)', sev: 'azul', ok: ['ORI'], ref: ['CASA', 'UBS'] },
      radio: { excess: '{central}, {unit}. Uma bolhinha na ponta do dedo, {dr}. A Dona Cida mandou um pedaço de bolo de laranja pra central.' },
      diary: { ori: 'Queimou a ponta do dedo fazendo bolo de laranja para o grupo da igreja. Ia passar pó de café.' },
    }),
    // ------------------------------------------------------------------ 7 ★ Wesley, filho da Simone
    call({
      id: 'd07_wesley',
      ref: 'D7 #7 ★',
      // 1.1: chega às 13:05, no meio do almoço (o almoço do dia 7 é interrompido)
      at: '13:05',
      anchor: true,
      num: '(17) 99761-1300',
      caller: 'Seu Edinho (feirante)',
      callerName: 'Edinho',
      type: 'testemunha',
      voice: 'homem',
      note: 'Motoboy caiu. Osso aparecendo na perna. Testemunha.',
      noteFixed: true,
      addr: { rua: 'Av. Brasil', n: 2780, bairro: 'Centro', ref: 'Em frente à feira de domingo, perto da banca de pastel.' },
      amb: ['rua', 'multidao', 'buzinas'],
      open: [
        '{Dr}, um motoboy caiu aqui na frente da feira! {{O osso da perna tá aparecendo|osso}}, saindo pela calça!',
        '[gente em volta; alguém grita "não tira o capacete dele!"]',
        'Ele tá pedindo pra avisar a mãe. {{Diz que a mãe trabalha aí na Regulação|mae_regulacao}}. Simone, o nome dela.',
      ],
      q: {
        oque: 'Ele vinha de entrega, um carro abriu a porta sem olhar e ele bateu. Caiu de lado e arrastou.',
        consciencia: 'Acordado, conversando, chorando de dor. {{Sabe o nome, sabe tudo|lucido}}.',
        respira: 'Respira normal. Geme.',
        idade: 'Novinho. Dezenove, ele falou.',
        inicio: 'Agora, uns dez minutos.',
        sangramento: '{{Sangra pouco|sangra_pouco}}, um fiozinho. Alguém pôs uma camiseta em volta, sem apertar.',
        historico: 'Diz que não tem nada. Moto nova, comprou semana passada. Tá mais preocupado com a moto.',
        paciente: ['WESLEY: Ai... ai, minha perna... Fala pra minha mãe que tá tudo bem... {{ela trabalha aí, no telefone|mae_telefone}}...', 'WESLEY: Não fala da moto pra ela, não.'],
        seguranca: 'Seguro. O pessoal da feira parou o trânsito com as caixas de tomate.',
        pulso: 'Tem, tem. Rápido. O coração dele tá a mil, mas ele tá falando comigo.',
        pele: 'Pálido de dor, suando um pouco. A boca tá normal.',
        referencia: 'Em frente à feira, perto da banca de pastel.',
      },
      extra: [
        { id: 'nome', label: 'Nome completo dele?', say: 'Qual o nome completo dele?', a: '{{Wesley... Wesley Campos Batista|nome_wesley}}. Tá escrito no colete da firma de entrega.' },
        {
          id: 'capacete',
          label: 'Capacete? Bateu a cabeça?',
          say: 'Ele estava de capacete? Bateu a cabeça, apagou?',
          a: 'Capacete vermelho, tá com ele ainda. Não apagou, não bateu a cabeça, ele disse. Lembra de tudo.',
        },
        {
          id: 'pe',
          label: 'O pé está quente? Mexe os dedos?',
          say: 'Olha o pé da perna machucada: está quente, rosado? Ele mexe os dedos?',
          a: '{{Mexe os dedos. Tá quentinho|pe_ok}}. Ele grita quando mexe, mas mexe.',
        },
        {
          id: 'cobrir',
          kind: 'fala',
          label: 'Orientar: não mexer no osso',
          say: 'Ninguém empurra o osso de volta nem mexe na perna. Cobre a ferida com um pano limpo, sem apertar, e deixa ele deitado, de capacete, até a equipe chegar.',
          // Conferido (RC24/RT6: fratura exposta → USI/USB; campo A13 e PHTLS: não reduzir, cobrir com pano
          // limpo, não tirar o capacete).
          a: 'Ninguém mexe! Ouviram? Ninguém mexe! ...Cobri com uma toalha limpa da banca. Ele tá tremendo, ponho meu casaco por cima?',
        },
      ],
      links: [
        { a: 'osso', b: 'sangra_pouco', insight: 'Osso exposto com sangramento pequeno, consciente, pé quente: fratura exposta estável. Amarelo → USB (Manual p.1).' },
        { a: 'mae_regulacao', b: 'nome_wesley', kind: 'confirma', insight: 'Wesley Campos Batista, 19 anos. A mãe "trabalha na Regulação, no telefone", chama Simone. Na mesa ao lado, a Simone parou de digitar.' },
        { a: 'lucido', b: 'manual:amarelo', kind: 'confirma', insight: 'Lúcido, sem trauma de cabeça, respirando bem: não é vermelho. A urgência é a fratura.' },
      ],
      onAnswer: (e) => {
        e.toast('Na mesa ao lado, a Simone tira o fone do ouvido devagar.');
        e.set('d7_simone_ouviu');
      },
      onStamp: (e) => {
        const d = decisao(e, 'd07_wesley');
        if (!d) return;
        if (d.resource === 'USA' || d.resource === 'USB') e.set('wesley_atendido');
        else e.set('d7_wesley_dispensado');
      },
      patient: { name: 'Wesley Campos Batista', age: 19, sex: 'M' },
      truth: { dx: 'Fratura exposta de perna (estável)', sev: 'amarelo', ok: ['USB'], risk: { good: 100, bad: 260, needs: 'USB' } },
      radio: {
        ok: 'Central, {unit}. Fratura exposta de tíbia, sangramento controlado, pé quente. Imobilizado. O rapaz mandou dizer pra Simone que "a moto só ralou". Seguimos Regional.',
        excess: '{central}, {unit}. Fratura exposta estável, {dr}. Dava USB. ...É o filho da Simone, né? Ele não para de pedir pra avisar ela.',
        late: 'Central, {unit}. A ferida ficou exposta tempo demais. Vai ficar internado um bom tempo, com antibiótico.',
      },
      diary: {
        alive: 'Wesley, 19 anos, filho da Simone. Fratura exposta na perna. A moto era nova, com três parcelas pagas.',
      },
    }),
    // ------------------------------------------------------------------ 8
    call({
      id: 'd07_febre',
      ref: 'D7 #8',
      at: '14:20',
      pool: 'leve',
      num: '(17) 99240-3150',
      caller: 'Rodrigo (o próprio)',
      callerName: 'Rodrigo',
      type: 'exagerador',
      voice: 'homem',
      note: 'Homem com febre e dor no corpo.',
      noteWrong: 'Homem dizendo que tá morrendo. Febre alta.',
      addr: { rua: 'Rua Marechal Deodoro', n: 3150, bairro: 'Vila Nova', ref: 'Sobrado branco, portão de garagem marrom.' },
      amb: ['tv', 'ventilador'],
      open: ['{Dr}... {{eu tô morrendo|morrendo}}. Febre, dor no corpo inteiro. Até o cabelo dói.', 'ESPOSA: É gripe, Rodrigo! Gripe!'],
      q: {
        oque: 'Começou ontem: febre, dor no corpo, nariz escorrendo. Hoje acordei moído.',
        consciencia: 'Acordado. Sofrendo, mas acordado.',
        respira: 'Respiro normal, só o nariz entupido.',
        idade: 'Trinta e um.',
        inicio: 'Desde ontem à tarde.',
        historico: 'Nada. Nunca fico doente. Por isso que é grave!',
        sangramento: 'Não.',
        dorpeito: 'Dor no peito não. Dói é tudo, o corpo.',
        paciente: ['Sou eu mesmo. [tosse]', 'ESPOSA (pegando o telefone): {Dr}, ele tá com trinta e oito e meio, bebendo água e comendo canja. É gripe de homem.'],
        seguranca: 'Seguro.',
      },
      extra: [
        {
          id: 'temperatura',
          label: 'Quanto deu a febre? Bebe água?',
          say: 'Quanto deu a febre? Ele está bebendo água e fazendo xixi normal?',
          a: '{{Trinta e oito e meio|febre_385}}. Tomou o antitérmico, baixou um pouco. Água ele bebe, xixi normal. Tá comendo canja.',
        },
        {
          id: 'alarme',
          label: 'Falta de ar? Manchas? Pescoço duro?',
          say: 'Tem falta de ar, manchas na pele, dor de cabeça forte com o pescoço duro, confusão?',
          a: '{{Nada disso|sem_alarme}}. Só a dor no corpo e o nariz.',
        },
        {
          id: 'orientar',
          kind: 'fala',
          label: 'Orientar',
          say: 'Repouso, bastante líquido, antitérmico nos horários certos. Se tiver falta de ar, manchas, pescoço duro, confusão, ou se a febre não ceder em três dias, procura a UPA ou liga de novo.',
          // Conferido (RC20: febre em adulto → orientação; sinais de alarme de RC6/RC12 para religar).
          a: 'ESPOSA: Ouviu, Rodrigo? Repouso. ...Ele vai repousar no sofá vendo o jogo, {dr}. Obrigada.',
        },
      ],
      links: [
        { a: 'morrendo', b: 'sem_alarme', insight: '"Tô morrendo"... de gripe: febre de 38,5, bebendo, comendo, sem nenhum sinal de alarme. Verde, orientação.' },
        { a: 'febre_385', b: 'manual:verde', insight: 'Febre com dor no corpo, sem sinal de gravidade: verde. Repouso e líquidos; UBS ou UPA se piorar (Manual p.1).' },
      ],
      patient: { name: 'Rodrigo Dias', age: 31, sex: 'M' },
      truth: { dx: 'Síndrome gripal (virose)', sev: 'verde', ok: ['ORI'], ref: ['CASA', 'UBS', 'UPA'] },
      radio: { excess: 'Central, {unit}. Gripe, {dr}. Trinta e oito e meio. A esposa pediu desculpa pela gente e ofereceu canja.' },
      diary: { ori: 'Gripe de domingo. "Até o cabelo dói." Orientado: repouso e líquidos.' },
    }),
    // ------------------------------------------------------------------ 9
    call({
      id: 'd07_trote',
      ref: 'D7 #9',
      at: '15:40',
      pool: 'trote',
      num: '(17) 99610-7777',
      caller: 'Rapaz',
      type: 'trotista',
      voice: 'jovem_h',
      note: 'Diz que o tio desmaiou no churrasco.',
      noteWrong: 'Homem desmaiado num churrasco, não respira!',
      addr: { rua: 'Rua Sabiá', n: 1500, bairro: 'Vila Esperança' },
      // 1.1 (trotes-folgados.md): médio e sem risada. O "morto" responde antes do sobrinho e o churrasco continua
      // animado ao fundo, sem pânico nenhum. A voz do tio aparece uma vez, abafada.
      amb: ['festa', 'musica'],
      open: [
        'Alô, emergência? O meu tio {{tá desmaiado, não respira|desmaiado}}! Manda a ambulância grande, rápido!',
        '[{{churrasco animado ao fundo: pagode, gente conversando alto, panela de pressão chiando. Ninguém grita, ninguém chora|festa_calma}}]',
        '[uma voz de homem, abafada, perto do fone: {{"fala que eu tô morrendo"|voz_tio}}]',
      ],
      q: {
        oque: 'Ele caiu duro no churrasco! Bebeu... quer dizer, não bebeu nada!',
        consciencia: ['TIO (mais perto, antes de qualquer um): {{Tô!|nao_acorda}}', 'SOBRINHO: ...Não tá. Não acorda. Desmaiado.'],
        respira: 'Não respira! Quer dizer... respira pouco.',
        pulso: ['Pulso? [uma voz ao fundo: "pega no meu pulso, pega"]', '...Tem. Fraquinho. Acho.'],
        pele: 'Roxo. Quer dizer, vermelho. Ele é moreno, {m:moço|moça}, não dá pra ver direito.',
        idade: 'Uns quarenta... cinquenta... sessenta?',
        paciente: ['[alguém toma o telefone e devolve: "para, tio"]', '[o pagode continua, no mesmo volume]'],
        referencia: 'Rua Sabiá, mil e quinhentos. Do lado do pagode.',
        seguranca: 'Seguro, seguro! Só tem cerveja!',
      },
      callback: ['[toca muito... ninguém atende]', '[{{caixa postal cheia|retorno_cheia}}]'],
      links: [
        { a: 'desmaiado', b: 'voz_tio', insight: '"Desmaiado, não respira"... e a voz do próprio tio ao fundo, pedindo pra dizer que está morrendo: trote (Manual p.2).' },
        { a: 'nao_acorda', b: 'manual:trote_sinais', insight: 'O "desmaiado" responde ao fundo e todo mundo ri: o relato é desmentido pelo próprio ambiente.' },
      ],
      patient: { name: '"Tio desmaiado"' },
      truth: { dx: 'Trote (churrasco)', sev: 'trote', ok: ['TROTE'], prankKind: 'trote' },
      radio: { prank: 'Central, {unit}. A Rua Sabiá acaba no 1099, {dr}. Seguimos o barulho do pagode e caímos numa festa de aniversário. O "morto" ofereceu linguiça. Era trote.' },
    }),
  ],
  interlude: {
    teaser: 'Domingo à noite. Um carro preto para na frente da sua casa.',
    familyLacos: 1,
    scene: (c) => ({
      id: 'd07_envelope',
      bg: 'porta',
      cast: ['ASSESSOR', 'LUCIA', 'ZELIA'],
      nodes: {
        start: {
          lines: [
            { who: 'NARRADOR', t: 'Oito da noite. O carro preto de vidro escuro encosta na frente da sua casa. Os vizinhos aparecem nas janelas, um por um. A Dona Dirce, de vassoura, varrendo nada.' },
            { who: 'NARRADOR', t: 'O Ozzy rosna pela fresta do portão. O Ozzy nunca rosna.' },
            { who: 'ASSESSOR', t: 'Boa noite! {Dr} {nome}? Wagner Tavares, assessor do vereador Arlindo Matos. Pode ficar tranquil{m:o|a}, {dr}. Tá bom? Tá bom.' },
            c.flag('d7_vereador_usa') || c.flag('d7_usa_vip')
              ? { who: 'ASSESSOR', t: 'O vereador pediu pra agradecer pessoalmente a agilidade com a Dona Odete hoje. (estende um envelope pardo, gordo) Uma lembrança. Pela atenção.' }
              : { who: 'ASSESSOR', t: 'O vereador ficou chateado com o atendimento de hoje, não vou mentir. Mas ele não guarda rancor. (estende um envelope pardo, gordo) Uma lembrança, pra gente começar de novo. Pela atenção.' },
            { who: 'NARRADOR', t: 'A mão que segura o envelope tem uma aliança apertada no dedo, afundando na carne. E um arranhão fresco nas costas, de unha.' },
            { who: 'NARRADOR', t: 'Pelo volume, mil reais em notas de cinquenta. {Oconj} está {c:parada|parado} na porta da cozinha. A Dona Zélia baixou o volume da TV.' },
          ],
          choices: [
            { label: 'Aceitar o envelope.', next: 'aceita', effect: fx.all(fx.money(1000, 'envelope do vereador'), fx.add('integridade', -4, 'propina'), fx.set('envelope_aceito')) },
            { label: 'Recusar: "Não posso aceitar. Diz pro vereador que a Regulação atende todo mundo igual."', next: 'recusa', effect: fx.all(fx.set('envelope_recusado'), fx.set('vereador_inimigo')) },
            { label: '(Olhar para {oconj} antes de responder.)', next: 'olhar' },
            { label: '"Aceita um café, seu Wagner?"', next: 'cafe' },
          ],
        },
        cafe: {
          lines: [
            { who: 'ASSESSOR', t: '(olha o relógio, rápido demais) Não, não. A patroa me espera. Ela não gosta que eu demore.' },
            { who: 'NARRADOR', t: 'Ele passa o polegar no arranhão das costas da mão, como quem apaga uma coisa escrita.' },
            { who: 'ASSESSOR', t: 'É só uma lembrança, {dr}. Tá bom? Tá bom.' },
          ],
          choices: [
            { label: 'Aceitar o envelope.', next: 'aceita', effect: fx.all(fx.money(1000, 'envelope do vereador'), fx.add('integridade', -4, 'propina'), fx.set('envelope_aceito')) },
            { label: 'Recusar: "Não posso aceitar. Diz pro vereador que a Regulação atende todo mundo igual."', next: 'recusa', effect: fx.all(fx.set('envelope_recusado'), fx.set('vereador_inimigo')) },
          ],
        },
        olhar: {
          lines: [
            { who: 'NARRADOR', t: '{Oconj} olha para o envelope. Depois para a conta de luz presa na geladeira com um ímã de pizzaria. Depois para você.', when: (cc) => cc.money() < 300 },
            { who: 'NARRADOR', t: '{Oconj} cruza os braços e não desvia o olhar do assessor.', when: (cc) => cc.money() >= 300 },
            { who: 'LUCIA', t: '(baixinho) A decisão é sua, {nome}. Mas eu vou lembrar dela.' },
          ],
          choices: [
            { label: 'Aceitar o envelope.', next: 'aceita', effect: fx.all(fx.money(1000, 'envelope do vereador'), fx.add('integridade', -4, 'propina'), fx.set('envelope_aceito')) },
            { label: 'Recusar: "Não posso aceitar. Diz pro vereador que a Regulação atende todo mundo igual."', next: 'recusa', effect: fx.all(fx.set('envelope_recusado'), fx.set('vereador_inimigo')) },
          ],
        },
        aceita: {
          lines: [
            { who: 'ASSESSOR', t: 'O vereador não esquece quem é amigo, {dr}. Tá bom? Tá bom. Boa noite.' },
            { who: 'NARRADOR', t: 'O carro vai embora. Você guarda o envelope na lata de biscoito, em cima da geladeira. As notas são novas, em sequência, presas por uma cinta de papel: "Câmara Municipal — Gab. 7".' },
            { who: 'LUCIA', t: '(sem olhar pra você) Quanto tem aí?' },
            { who: 'ZELIA', t: '(da sala, sem tirar os olhos da TV) Teu pai devolvia até troco errado de padaria, {filho}.' },
            // a partir daqui a família fala do dinheiro que existe (ROTEIRO 3.1)
            { who: 'LUCIA', t: '(olhando a conta de luz presa no ímã) A luz tá paga, pelo menos. ...Não sei se eu queria que estivesse.', when: (cc) => cc.money() >= 1000 },
          ],
        },
        recusa: {
          lines: [
            { who: 'ASSESSOR', t: '(o sorriso não sai do rosto) Tá bom. Tá bom. Eu transmito, {dr}. Ele vai lembrar. Ele lembra de tudo.' },
            { who: 'NARRADOR', t: 'O carro demora para sair. Depois sai.' },
            { who: 'LUCIA', t: '(fechando a porta) Mil reais, {nome}.' },
            { who: 'LUCIA', t: 'Eu tô {c:orgulhosa|orgulhoso} e com raiva ao mesmo tempo. Dá pra ser as duas coisas?' },
            { who: 'ZELIA', t: '(da sala) Dá. Eu fui as duas coisas com o teu pai por quarenta anos.' },
          ],
        },
      },
    }),
    // Bico: a Lúcia recebe o envelope sozinha (Laços ≥ 5 joga fora; Laços < 5 e saldo negativo aceita e esconde).
    bico: {
      id: 'd07_bico',
      bg: 'porta',
      cast: ['LUCIA', 'ASSESSOR'],
      nodes: {
        start: {
          onEnter: (e) => {
            if (e.v('lacos') >= 5) {
              e.set('envelope_recusado');
              e.set('vereador_inimigo');
              e.set('d7_lucia_jogou');
            } else if (e.money() < 0) {
              e.set('envelope_lucia');
              e.add('integridade', -2, 'envelope do vereador');
            } else {
              e.set('envelope_recusado');
              e.set('vereador_inimigo');
              e.set('d7_lucia_fechou');
            }
          },
          lines: [
            { who: 'NARRADOR', t: 'Você está na USA 01, no meio de uma ocorrência. Em casa, às oito da noite, a campainha toca.' },
            { who: 'NARRADOR', t: '{Oconj} abre. Um homem de terno, aliança apertada no dedo, um arranhão fresco nas costas da mão. Um envelope pardo.' },
            { who: 'ASSESSOR', t: '{m:O doutor|A doutora} não está? Tudo bem. Wagner, assessor do vereador Arlindo. É uma lembrança. Pela atenção com a mãe dele. Tá bom? Tá bom.' },
            { who: 'LUCIA', t: 'Pela atenção.', when: is.flag('d7_lucia_jogou') },
            { who: 'NARRADOR', t: '{c:Ela|Ele} pega o envelope, pesa na mão... e joga por cima do portão. As notas de cinquenta se espalham pela calçada.', when: is.flag('d7_lucia_jogou') },
            { who: 'NARRADOR', t: 'O assessor recolhe uma por uma, agachado, de terno, enquanto a rua inteira assiste das janelas.', when: is.flag('d7_lucia_jogou') },
            { who: 'LUCIA', t: '(para a vizinha da frente) Boa noite, Dona Dirce.', when: is.flag('d7_lucia_jogou') },
            { who: 'NARRADOR', t: 'A Dona Dirce, sem querer, varre uma nota de cinquenta para dentro do bueiro. Diz que foi sem querer. Ninguém acredita.', when: is.flag('d7_lucia_jogou') },
            { who: 'LUCIA', t: 'Não, {c:obrigada|obrigado}.', when: is.flag('d7_lucia_fechou') },
            { who: 'NARRADOR', t: '{c:Ela fecha a porta antes de ele terminar a frase|Ele fecha a porta antes de o assessor terminar a frase}. Depois fica um tempo {c:encostada|encostado} nela, de olhos fechados.', when: is.flag('d7_lucia_fechou') },
            { who: 'NARRADOR', t: '{Oconj} olha para o envelope. Depois para a conta de luz presa na geladeira com um ímã de pizzaria.', when: is.flag('envelope_lucia') },
            { who: 'LUCIA', t: '...{c:Obrigada|Obrigado}.', when: is.flag('envelope_lucia') },
            { who: 'NARRADOR', t: '{c:Ela|Ele} guarda o envelope no fundo da caixa de costura, embaixo dos moldes. Não conta pra ninguém.', when: is.flag('envelope_lucia') },
            { who: 'NARRADOR', t: 'Quando você chega, de madrugada, {c:ela|ele} já está dormindo. Ou finge.', when: is.flag('envelope_lucia') },
            { who: 'NARRADOR', t: 'Quando você chega, de madrugada, {oconj} conta tudo, rindo e {c:brava|bravo} ao mesmo tempo. A Dona Zélia já contou pra três vizinhas.', when: is.flag('d7_lucia_jogou') },
            { who: 'NARRADOR', t: 'Quando você chega, de madrugada, {c:ela|ele} conta em duas frases e vai dormir.', when: is.flag('d7_lucia_fechou') },
          ],
        },
      },
    },
  },
});
