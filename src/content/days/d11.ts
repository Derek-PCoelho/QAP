// =============================================================================
// DIA 11 — "Febre" (Manual p.11: epidemia de dengue)
// Volume alto de ligações curtas. A maioria é dengue sem alarme (orientação, UBS);
// no meio delas, três com sinais de alarme. A pior chega tarde (18:20): se ficar
// na fila às 19:00, vai para o Henrique — e o menino morre de madrugada.
// v2.0: a Dona Cida NÃO liga hoje (a vizinha dela, Dona Neusa, conta por quê).
// Fios: ↺ Henrique (a ligação que sobra pra ele) · ↺ Antônio → Juliana (ateliê)
//       · aluguel do Seu Nogueira (130, ou 140 se brigou no D2).
// =============================================================================
import type { Ctx, SceneDef } from '../../engine/types';
import type { GuideScript } from '../../engine/content-api';
import { day, call, fx, is } from '../dsl';

const atelie = (c: Ctx) => c.flag('maquina') && is.present('lucia')(c);

// Conferido (campo B3/BC11: choque = pele fria e úmida, pulso fino → deitar, aquecer, não levantar; pernas elevadas
// como no campo A8; campo A5: epistaxe com compressão digital; USP cap. 58: na dengue, sem anti-inflamatório nem AAS).
// Cabeça de lado se descer sangue para a boca.
export const GUIDES_EXTRA: Record<string, GuideScript> = {
  d11_choque: {
    id: 'd11_choque',
    title: 'Orientação: dengue com choque',
    kind: 'dialogo',
    intro: 'Até a USA chegar: deitar, aquecer, nenhum remédio por conta própria. A mãe está sozinha com ele.',
    panic: 75,
    steps: [
      {
        who: 'MÃE',
        say: 'Ele tá sentado no chão do banheiro, todo mole!',
        options: [
          { label: 'Deita ele de barriga pra cima, no chão mesmo, e põe as pernas dele em cima de uma almofada.', kind: 'certo' },
          { label: 'Põe ele embaixo do chuveiro pra ele acordar.', kind: 'errado', reply: 'Ele ficou mais gelado ainda!' },
          { label: 'Dona Vera, eu estou com a senhora. A ambulância já saiu.', kind: 'calma' },
        ],
      },
      {
        who: 'MÃE',
        say: 'Ele tá gelado, tremendo.',
        options: [
          { label: 'Cobre ele com um cobertor. Mantém ele aquecido e não deixa ele levantar.', kind: 'certo' },
          { label: 'Esfrega álcool no corpo dele.', kind: 'errado', reply: 'Ele reclamou que arde... e continua gelado.' },
          { label: 'Conversa com ele. Não deixa ele dormir.', kind: 'calma' },
        ],
      },
      {
        who: 'MÃE',
        say: 'Eu tenho remédio pra dor aqui. Dou pra ele?',
        options: [
          { label: 'Não dê nenhum remédio agora, nem pra dor nem pra febre. A equipe cuida disso.', kind: 'certo' },
          { label: 'Dá um anti-inflamatório, que ajuda.', kind: 'errado', reply: 'Então eu dou? Eu dou?' },
          { label: 'Pode dar um pouquinho de água.', kind: 'neutro', reply: 'Ele não consegue nem segurar o copo.' },
        ],
      },
      {
        who: 'MÃE',
        say: 'O nariz voltou a sangrar!',
        options: [
          { label: 'Aperta a ponta do nariz com os dedos, firme, e vira a cabeça dele de lado se descer sangue pra boca.', kind: 'certo' },
          { label: 'Inclina a cabeça dele pra trás.', kind: 'errado', reply: 'Ele engasgou com o sangue!' },
          { label: 'A senhora está fazendo tudo certo.', kind: 'calma' },
        ],
      },
      {
        who: 'MÃE',
        say: 'Tô vendo a luz da ambulância na esquina!',
        options: [
          { label: 'Abre o portão e separa o exame de dengue dele pra entregar pra equipe.', kind: 'certo' },
          { label: 'Levanta ele e sai correndo com ele pra rua.', kind: 'errado' },
        ],
      },
    ],
    success: 'A equipe encontrou o Yuri deitado, aquecido, com as pernas para cima e o exame na mão da mãe.',
    fail: 'A orientação teve falhas, mas a equipe chegou.',
  },
};

// -----------------------------------------------------------------------------
// Casa
// -----------------------------------------------------------------------------
const julianaScene = (c: Ctx): SceneDef => {
  const k = c.key('antonio');
  return {
    id: 'd11_juliana',
    bg: 'sala',
    cast: ['LUCIA', 'JULIANA'],
    nodes: {
      start: {
        onEnter: fx.all(fx.set('juliana_cliente'), fx.set('lucia_costura_fora')),
        lines: [
          { who: 'NARRADOR', t: 'Oito da noite. A máquina de costura está na mesa da sala, com uma toalha de crochê por baixo pra não riscar. {Oconj} arrumou a sala como se fosse loja.' },
          { who: 'LUCIA', t: 'Primeira cliente, {nome}. Primeira. Se ela gostar, ela conta pra rua inteira.' },
          { who: 'NARRADOR', t: 'Palmas no portão. Uma moça de uns trinta anos, pochete de feirante na cintura, sacola na mão. Pede desculpa pela hora: passou o dia na barraca da feira.' },
          ...(k === 'salvo'
            ? [
                { who: 'JULIANA', t: 'Boa noite! {c:A Dona|O Seu} {conj}? Me indicaram {c:a senhora|o senhor} na padaria. Eu sou a Juliana.' },
                { who: 'JULIANA', t: 'É o terno do meu pai. Eu caso em abril e ele vai entrar comigo na igreja. Só que tá largo: ele emagreceu depois do susto.' },
                { who: 'JULIANA', t: 'Ele teve um infarto, sabia? Achou que era o feijão. Meu pai diz que foi {m:um médico|uma médica} da Regulação que salvou ele. Pelo telefone. Ele nem sabe o nome.' },
                { who: 'NARRADOR', t: '{Oconj} para de medir a manga. Olha pra você.' },
              ]
            : k === 'perdido'
              ? [
                  { who: 'JULIANA', t: 'Boa noite. {c:A Dona|O Seu} {conj}? Eu sou a Juliana. Desculpa a roupa preta.' },
                  { who: 'JULIANA', t: 'É uma encomenda diferente. São as camisas do meu pai. Eu queria fazer umas almofadas com elas. Pra minha mãe abraçar de noite.' },
                  { who: 'JULIANA', t: 'Ele morreu faz uns dias. Infarto. Achou que era o feijão. Ligou pra emergência pedindo desculpa por incomodar.' },
                  { who: 'NARRADOR', t: 'Você lembra da voz. "Desculpa incomodar, {dr}."' },
                ]
              : [
                  { who: 'JULIANA', t: 'Boa noite! Eu sou a Juliana, filha do Seu Antônio, da São João. É uma barra de calça e um vestido pra ajustar. Dá pra semana que vem?' },
                  { who: 'LUCIA', t: 'Dá pra quarta.' },
                ]),
        ],
        choices:
          k === 'salvo'
            ? [
                { label: 'Contar que foi você.', next: 'contou' },
                { label: '(Ficar {m:quieto|quieta} e sorrir.)', next: 'quieto' },
              ]
            : k === 'perdido'
              ? [
                  { label: 'Contar que você atendeu a ligação dele.', next: 'contou_luto' },
                  { label: '(Ficar em silêncio e segurar a sacola.)', next: 'quieto_luto' },
                ]
              : undefined,
        next: k === 'salvo' || k === 'perdido' ? undefined : 'fim',
      },
      contou: {
        onEnter: fx.all(fx.add('humanidade', 1, 'a Juliana'), fx.set('juliana_sabe')),
        lines: [
          { who: 'EU', t: 'Fui eu que atendi o seu pai, Juliana. Ele pediu desculpa por incomodar umas três vezes.' },
          { who: 'JULIANA', t: '(ela leva a mão à boca) Ele pede desculpa pra tudo! Pro garçom, pro padre, pra emergência!' },
          { who: 'JULIANA', t: 'Eu vou contar pra ele. Ele vai querer trazer um bolo de fubá. Ele faz bolo de fubá quando quer agradecer, e sempre queima o fundo.' },
        ],
        next: 'fim',
      },
      quieto: {
        onEnter: fx.add('lacos', 1, '{oconj} entendeu'),
        lines: [
          { who: 'NARRADOR', t: 'Você sorri e não diz nada. {Oconj} tira as medidas do terno em silêncio, mais devagar do que precisava.' },
          { who: 'NARRADOR', t: 'Quando a Juliana vai embora, {oconj} passa a mão no seu cabelo.' },
          { who: 'LUCIA', t: 'Era você, né?' },
          { who: 'EU', t: 'Não posso falar de paciente, {c:Lú|Alex}.' },
          { who: 'LUCIA', t: 'Não precisa.' },
        ],
        next: 'fim',
      },
      contou_luto: {
        onEnter: fx.add('humanidade', 1, 'a Juliana'),
        lines: [
          { who: 'EU', t: 'Juliana... fui eu que atendi o seu pai.' },
          { who: 'NARRADOR', t: 'Ela demora pra responder. A sacola de camisas fica entre vocês dois, no sofá.' },
          { who: 'JULIANA', t: 'Ele pedia desculpa pra tudo. Pro garçom, pro padre, pra emergência.' },
          { who: 'JULIANA', t: 'Ele não ia querer ninguém se culpando. Ele nunca quis incomodar. Nem pra morrer.' },
        ],
        next: 'fim',
      },
      quieto_luto: {
        lines: [{ who: 'NARRADOR', t: 'Você segura a sacola enquanto {oconj} anota as medidas. Uma das camisas ainda tem cheiro de cigarro de palha.' }],
        next: 'fim',
      },
      fim: {
        lines: [
          { who: 'LUCIA', t: 'O terno do casamento, {nome}. Minha primeira encomenda.', when: () => k === 'salvo' },
          { who: 'LUCIA', t: 'Seis almofadas. Eu vou fazer com o maior cuidado do mundo.', when: () => k === 'perdido' },
          { who: 'LUCIA', t: 'Primeira encomenda, {nome}. Com nota e tudo.', when: () => k !== 'salvo' && k !== 'perdido' },
          { who: 'NARRADOR', t: '{c:Ela|Ele} abre um caderninho novo e escreve, com a letra caprichada: "Juliana — 1ª cliente". Sublinha duas vezes.' },
        ],
      },
    },
  };
};

const DENGUE_CASA: SceneDef = {
  id: 'd11_dengue_casa',
  bg: 'cozinha',
  cast: ['DAVI', 'LUCIA', 'ZELIA'],
  nodes: {
    start: {
      lines: [
        { who: 'NARRADOR', t: 'Sábado à noite. A Prefeitura passou na rua à tarde com um panfleto: "10 minutos contra a dengue".' },
        { who: 'DAVI', t: '{Pai}! Eu sou fiscal da dengue! A professora deu crachá e tudo!', when: is.present('davi') },
        { who: 'NARRADOR', t: 'Vocês viram os vasos, esvaziam a calha, tampam a caixa d’água com um plástico e uma pedra. O Liam acha três criadouros e anota num caderno, com data e hora.', when: is.present('davi') },
        { who: 'NARRADOR', t: 'Você vira os vasos do quintal {sozinho}, à luz do poste. O pratinho da samambaia tinha larva.', when: (c) => !is.present('davi')(c) },
        { who: 'LUCIA', t: 'Se eu tivesse a máquina, fazia tela de janela pra rua inteira. Vinte reais cada. Ia ter fila.', when: is.present('lucia') },
        { who: 'ZELIA', t: 'No meu tempo era areia no prato da planta e chinelo no mosquito.', when: is.alive('zelia') },
      ],
      choices: [
        { label: 'Dar um prêmio pro fiscal: pipoca.', affectionate: true, when: is.present('davi'), next: 'pipoca' },
        { label: 'Sentar cinco minutos no sofá.', next: 'sofa' },
      ],
    },
    pipoca: {
      lines: [
        { who: 'NARRADOR', t: 'Pipoca na panela de tampa de vidro. O Liam assiste os grãos estourarem como se fosse televisão.' },
        { who: 'DAVI', t: 'Quando eu crescer, eu vou ser fiscal da dengue e {m:médico|médica} do telefone. Os dois.' },
      ],
    },
    sofa: {
      lines: [{ who: 'NARRADOR', t: 'Você senta "cinco minutos" e acorda às onze, com uma manta em cima e o panfleto da dengue grudado na bochecha.' }],
    },
  },
};

export const DAY = day({
  day: 11,
  title: 'Febre',
  weekday: 'Sábado',
  weather: 'Calor úmido, 31 °C. Pancada de chuva no fim da tarde.',
  goal: { maxUSA: 1, bonus: 30 },
  onStart: (e) => {
    // reajuste do Seu Nogueira (IGP-M); quem brigou com ele no D2 paga mais
    e.s.bills.rent = e.flag('brigou_nogueira') ? 140 : 130;
  },
  newspaper: (c) => ({
    headline: 'Dengue: Santa Aurora decreta emergência',
    sub: 'UPA Norte tem espera de quatro horas. A Secretaria pede que casos leves procurem as UBS e lembra os sinais de alarme: dor forte na barriga, vômito sem parar, sangramento, tontura e sonolência.',
    photo: 'dengue',
    stories: [
      c.flag('d10_igreja_viatura')
        ? { title: 'Ambulância vai a culto por trote', text: 'Uma USA chegou à Igreja Batista Nova Aliança durante o culto de oração de sexta. "Ninguém passou mal, graças a Deus", disse o pastor. O número do trotista estava desligado.' }
        : { title: 'Central desmascara trote com endereço de igreja', text: 'O "infarto" da Rua Bahia, 300 era a Igreja Batista Nova Aliança. A Central ligou de volta: o número já estava desligado.' },
      c.flag('d10_avc_salva')
        ? { title: '"Ele ri de nervoso", conta idosa salva de AVC', text: 'Dona Geralda, 74, chegou ao Regional dentro da janela de tratamento. "Meu filho ri quando tá nervoso. Ainda bem que acreditaram nele."' }
        : { title: 'AVC: tempo é cérebro', text: 'Neurologistas do Regional lembram: boca torta, braço fraco e fala enrolada são motivo para chamar a ambulância na hora.' },
      ...(c.flag('d10_onibus_viatura')
        ? [{ title: 'Trote de "ônibus tombado" mobiliza viatura', text: 'Ambulância foi à Escola Estadual Prof. Aurélio Matos por um acidente que não existiu. A diretora pede que pais não espalhem boatos.' }]
        : []),
      { title: 'Aluguel: IGP-M sobe e inquilinos sentem', text: 'Proprietários da Vila Esperança reajustam contratos no meio do mês. "É o índice", diz um deles. "Eu também pago conta."' },
    ],
    notice: 'Nova página no Manual: p.11 — Epidemia de dengue (sinais de alarme e choque).',
    ad: 'Mutirão contra a dengue: 10 minutos por semana. Vire o vaso, tampe a caixa d’água, limpe a calha.',
    weather: 'Calor úmido · 31 °C · pancadas à tarde',
  }),
  handover: () => ({
    id: 'd11_passagem',
    bg: 'central',
    nodes: {
      start: {
        lines: [
          { who: 'NARRADOR', t: '07:00. O Henrique está perto da máquina de café. Te vê e demora um segundo a mais para sorrir.', when: is.flag('henrique_atendeu_zelia') },
          { who: 'HENRIQUE', t: 'Bom dia. ...Sua mãe tá bem? Eu vi a ficha agora de manhã: Rua das Acácias, 40. O seu endereço.', when: is.flag('henrique_atendeu_zelia') },
          { who: 'HENRIQUE', t: 'Eu nem lembrava que tinha sido eu.', when: is.flag('henrique_atendeu_zelia') },
          { who: 'NARRADOR', t: '07:00. O Henrique está com os olhos vermelhos e o jaleco dobrado no braço.', when: is.not('henrique_atendeu_zelia') },
          { who: 'HENRIQUE', t: 'Dengue, {nome}. Dengue pra todo lado. Trinta ligações de febre de madrugada.', when: is.not('henrique_atendeu_zelia') },
        ],
        choices: [
          { label: '"Ela tá bem. A USB levou quarenta minutos."', when: is.flag('henrique_atendeu_zelia'), next: 'bem' },
          { label: '"Você passou Rua das Palmeiras pra equipe, Henrique."', when: is.flag('henrique_atendeu_zelia'), next: 'confronto' },
          { label: '(Não responder.)', when: is.flag('henrique_atendeu_zelia'), next: 'dengue' },
        ],
        next: 'dengue',
      },
      bem: {
        lines: [
          { who: 'HENRIQUE', t: 'Quarenta? ...É. Noite cheia.' },
          { who: 'NARRADOR', t: 'Ele não pergunta mais nada.' },
        ],
        next: 'dengue',
      },
      confronto: {
        onEnter: fx.set('confrontou_henrique_d11'),
        lines: [
          { who: 'HENRIQUE', t: '(o sorriso some) Palmeiras... Acácias. É tudo árvore, {nome}. Erro de digitação. Acontece.' },
          { who: 'NARRADOR', t: 'As mãos dele procuram o crachá, a chave, a bala. Não acham nada pra segurar.' },
        ],
        next: 'dengue',
      },
      dengue: {
        lines: [{ who: 'HENRIQUE', t: 'Dica de quem tá há doze horas nisso: febre é UBS. Se mandar viatura pra cada febre, às dez da manhã não tem mais frota.' }],
        choices: [
          { label: '"Febre com sangramento não é UBS, Henrique."', next: 'manual' },
          { label: '"Bom descanso."' },
        ],
      },
      manual: {
        lines: [
          { who: 'HENRIQUE', t: 'Eu sei ler manual, {nome}.' },
          { who: 'HENRIQUE', t: '(pausa) Eu escrevi metade dele. Antes da OS.' },
        ],
      },
    },
  }),
  timeline: [
    { at: '07:02', kind: 'radio', who: 'SISTEMA', text: 'Secretaria Municipal de Saúde: emergência por dengue. UPA Norte com espera de 4h. Febre sem sinal de alarme: orientar UBS.' },
    {
      at: '09:20',
      kind: 'simone',
      who: 'SIMONE',
      id: 'cida_sumiu',
      text: '{Dr}, a Dona Cida não ligou hoje. Primeira vez desde que {m:o senhor|a senhora} chegou. Quer que eu ligue pra ela?',
      options: [
        { id: 'ligar', label: '"Liga, Simone. Só pra saber."', cost: 5, effect: (c) => c.set('d11_ligou_cida'), reply: 'Chamou, chamou... ninguém atendeu. Deve ter saído. Ela sai, né? ...Ela sai?' },
        { id: 'nao', label: '"Deve ter saído. Depois a gente vê."', reply: 'É. Deve ter saído.' },
      ],
    },
    { at: '12:10', kind: 'interfone', who: 'DR. PEIXOTO', text: '{Dr}, ofício da Secretaria: febre é UBS. Sem sinal de alarme, nada de viatura. A frota não aguenta dengue, entendeu? E o painel tá olhando.' },
    { at: '16:10', kind: 'simone', who: 'SIMONE', text: 'O Wesley pegou dengue, {dr}. Tá de cama, reclamando que nem criança. Eu fico olhando a fila e pensando: e se o próximo nome for o dele?' },
    {
      at: '18:45',
      kind: 'script',
      id: 'yuri_fila',
      run: (c) => {
        const y = c.callStatus('d11_dengue_grave');
        if (y && (y.status === 'fila' || y.status === 'espera')) c.modal('SIMONE', '{Dr}... a mãe do menino do nariz ainda tá na linha. Às sete, o que estiver na fila vai pro Henrique.', 'simone');
      },
    },
  ],
  calls: [
    // ----------------------------------------------------------------- 1 dengue sem alarme
    call({
      id: 'd11_olhos',
      ref: 'D11 #1',
      at: '07:10',
      pool: 'dengue,leve',
      num: '(17) 99631-0710',
      caller: 'Patrícia',
      callerName: 'Patrícia',
      type: 'comum',
      voice: 'jovem_m',
      note: 'Moça, febre e dor atrás dos olhos. Acha que é dengue.',
      noteWrong: 'Moça com febre altíssima, diz que tá muito mal.',
      addr: { rua: 'Rua Jacarandá', n: 640, bairro: 'Jardim Primavera', ref: 'Prédio verde, apartamento 21.' },
      amb: ['ventilador'],
      open: ['Bom dia... desculpa, é que eu tô com {{febre de 39 desde ontem|febre}} e uma {{dor atrás dos olhos|olhos}} que parece que vai estourar. É dengue, né? Metade do meu prédio tá com dengue.'],
      q: {
        oque: 'Febre, dor no corpo inteiro e essa dor atrás do olho. Não aguento luz.',
        consciencia: 'Acordada, deitada no escuro.',
        respira: 'Normal.',
        idade: 'Vinte e seis.',
        inicio: 'Ontem à tarde.',
        historico: 'Nada. Saudável.',
        sangramento: 'Não, nada.',
        dengue: '{{Dor na barriga não, vômito não, sangramento não|sem_alarme}}. Tontura também não. Só a febre e as dores.',
        gestacao: 'Grávida? Não. Não mesmo.',
        paciente: 'Sou eu mesma.',
      },
      extra: [{ id: 'liquidos', label: 'Bebendo líquido? Urinando?', say: 'Você está conseguindo beber bastante líquido? Está urinando normal?', a: 'Tô bebendo água, soro da farmácia, suco. Fazendo xixi normal.' }],
      links: [{ a: 'sem_alarme', b: 'manual:dengue_sem', insight: 'Febre e dor atrás dos olhos, sem sinal de alarme, bebendo líquido: dengue sem alarme. Hidratação e UBS (Manual p.11).' }],
      patient: { name: 'Patrícia Rocha', age: 26, sex: 'F' },
      truth: { dx: 'Dengue sem sinais de alarme', sev: 'verde', ok: ['ORI'], ref: ['UBS'] },
      radio: { excess: 'Central, {unit}. Dengue sem alarme, andando, bebendo água. Ela pediu desculpa por chamar a ambulância. Liberamos com orientação.' },
      diary: { ori: 'Patrícia, 26. Dengue sem alarme. Metade do prédio dela também.' },
    }),
    // ----------------------------------------------------------------- 2 dengue sem alarme (exantema)
    call({
      id: 'd11_manchas',
      ref: 'D11 #2',
      at: '07:55',
      pool: 'dengue,leve',
      num: '(17) 99412-0755',
      caller: 'Cícero',
      callerName: 'Cícero',
      type: 'comum',
      voice: 'homem',
      note: 'Homem, febre e manchas pelo corpo.',
      noteWrong: 'Manchas roxas pelo corpo! Parece grave.',
      addr: { rua: 'Rua Goiás', n: 2910, bairro: 'Vila Esperança', ref: 'Casa amarela com grade, perto do depósito de gás.' },
      amb: ['tv'],
      open: ['Bom dia. Eu tô com dengue faz quatro dias, já fiz o exame. Hoje {{acordei cheio de mancha vermelha|manchas}} no corpo. E coça que é uma desgraça. Isso é normal?'],
      q: {
        oque: 'Manchinha vermelha no peito, nas costas, no braço. Coça muito.',
        consciencia: 'Acordado, me coçando.',
        respira: 'Normal.',
        idade: 'Trinta e quatro.',
        inicio: 'A febre começou terça. As manchas, hoje cedo. {{A febre até baixou ontem|febre_baixou}}.',
        historico: 'Nada. O exame deu dengue.',
        sangramento: 'Não. Escovei o dente agora, nada de sangue.',
        dengue: 'Não, nada disso. Barriga boa, comi pão com café, {{não vomitei, não tô tonto|sem_alarme}}.',
        paciente: 'Sou eu, {dr}.',
      },
      extra: [{ id: 'aperta', label: 'A mancha some quando aperta?', say: 'Aperta uma mancha com o dedo, ou com um copo de vidro. Ela some, fica branca?', a: '[pausa] {{Some. Fica branquinha e depois volta|some}}.' }],
      links: [
        { a: 'some', b: 'manchas', kind: 'confirma', insight: 'Manchas vermelhas que somem à pressão, com coceira, no 4º dia: é o exantema da própria dengue, sem sinal de alarme.' },
        { a: 'febre_baixou', b: 'manual:dengue_alarme', insight: 'A febre baixou: é justamente quando os sinais de alarme costumam aparecer. Ele não tem nenhum agora; orientar a voltar a ligar se aparecerem (Manual p.11).' }, // Conferido (USP cap. 58: a fase crítica começa na defervescência, do 3º ao 7º dia; mancha que some à pressão não é "erupção cutânea fixa", RC seção 8)
      ],
      patient: { name: 'Cícero Nascimento', age: 34, sex: 'M' },
      truth: { dx: 'Dengue sem sinais de alarme (exantema)', sev: 'verde', ok: ['ORI'], ref: ['UBS'] },
      diary: { ori: 'Cícero, 34. Dengue no 4º dia, manchas que somem à pressão. Orientado a ligar de novo se aparecer sinal de alarme.' },
    }),
    // ----------------------------------------------------------------- 3 dengue COM alarme (dor abdominal + vômitos)
    call({
      id: 'd11_barriga',
      ref: 'D11 #3',
      at: '08:45',
      pool: 'dengue,moderado',
      num: '(17) 3329-0845',
      caller: 'Dona Luzia (mãe)',
      callerName: 'Luzia',
      type: 'comum',
      voice: 'mulher',
      note: 'Mãe. Filho com dengue há 4 dias, diz que piorou.',
      noteWrong: 'Mais uma dengue. Coisa leve.',
      addr: { rua: 'Rua Minas Gerais', n: 3120, bairro: 'Vila Esperança', ref: 'Casa de muro verde, em frente ao bar do Tonho.' },
      amb: ['cozinha', 'gemidos'],
      open: ['{m:Moço|Moça}, meu filho tá com dengue faz quatro dias. {{Hoje a dor na barriga piorou muito|dor_barriga}}, e {{ele vomita tudo que põe na boca|vomita}}. Até água.'],
      q: {
        oque: 'Desde a madrugada. Vomitou umas seis vezes. A dor é aqui do lado direito, embaixo da costela.',
        consciencia: 'Acordado, mas molinho, encolhido na cama.',
        respira: 'Respira normal.',
        idade: 'Vinte e oito.',
        inicio: 'A febre começou terça. A dor forte, de madrugada.',
        sangramento: 'Sangramento não. Só o vômito.',
        historico: 'Nada. Nunca ficou doente. Nem quer ir em médico.',
        dengue: '{{Dor forte na barriga e vômito sem parar, isso tem|alarme}}. E ele levantou pra ir no banheiro e teve que sentar no meio do caminho.',
        paciente: ['MURILO: Tô bem, mãe... é só... [{{ânsia de vômito|ansia}}]', 'MURILO: Desculpa... a barriga... aperta.'],
        seguranca: 'Seguro.',
      },
      extra: [{ id: 'urina', label: 'Está urinando?', say: 'Ele está urinando? Quando foi a última vez?', a: '{{Desde ontem à noite não fez xixi|sem_urina}}.' }],
      links: [
        { a: 'alarme', b: 'manual:dengue_alarme', insight: 'Dor abdominal intensa e vômitos persistentes no 4º dia: dengue COM sinais de alarme. USB → UPA (Manual p.11).' },
        { a: 'vomita', b: 'sem_urina', insight: 'Vomita até água e não urina desde ontem: está desidratando. Não dá pra hidratar em casa.' }, // Conferido (RC11: vômitos persistentes e sinais de desidratação → USI/USB; USP cap. 58: vômito persistente é sinal de alarme, hidratação venosa)
      ],
      patient: { name: 'Murilo Moreira', age: 28, sex: 'M' },
      truth: { dx: 'Dengue com sinais de alarme (dor abdominal e vômitos persistentes)', sev: 'amarelo', ok: ['USB'], dest: ['UPA'], risk: { good: 100, bad: 260, needs: 'USB' } },
      radio: { ok: 'Central, {unit} no local. Dengue com sinal de alarme, desidratado, pressão no limite. Acesso venoso, soro correndo. Removendo pra UPA.' },
      diary: { alive: 'Murilo, 28. Dengue com sinal de alarme. A mãe ligou; ele dizia que estava bem.' },
    }),
    // ----------------------------------------------------------------- 4 (no lugar da Dona Cida) Dona Neusa, a vizinha
    call({
      id: 'd11_neusa',
      ref: 'D11 #4 (v2.0: a Cida não liga)',
      at: '09:35',
      num: '(17) 3322-1914',
      caller: 'Dona Neusa',
      callerName: 'Dona Neusa',
      type: 'comum',
      voice: 'idosa',
      note: 'Senhora sozinha, febre. (Não é a Dona Cida.)',
      noteWrong: 'Senhora com febre alta, parece confusa.',
      addr: { rua: 'Rua Pitangueira', n: 910, bairro: 'Bela Vista', ref: 'Casa de muro baixo, tem uma imagem de Santo Antônio na janela.' },
      amb: ['radio_am', 'silencio'],
      open: ['Alô? É do pronto-socorro? Aqui é a Neusa. {{Tô com uma febrinha|febrinha}} desde ontem, e uma moleza. Meu filho mora em São Paulo, não atende. Aí eu liguei pra vocês.'],
      q: {
        oque: 'Febre de 38, dor nas juntas. Moleza.',
        consciencia: 'Acordada. Fazendo palavra cruzada pra passar o tempo.',
        respira: 'Normal, graças a Deus.',
        idade: 'Oitenta e um.',
        inicio: 'Ontem de tarde.',
        historico: 'Pressão e diabetes de comprimido. Tomei tudo hoje.',
        dengue: 'Nada disso, {meu} {filho}. {{Tô comendo, tô bebendo água, levanto e não fico tonta|sem_alarme}}.',
        sangramento: 'Não.',
        paciente: 'Sou eu mesma.',
        seguranca: '{{Tô sozinha|sozinha}}, mas tranquila. A porta tá trancada.',
      },
      extra: [
        {
          id: 'vizinha',
          kind: 'fala',
          label: 'Alguém pode olhar a senhora?',
          say: 'Dona Neusa, tem algum vizinho que possa ficar de olho na senhora hoje? Ir com a senhora no posto?',
          a: ['Tem a Cida, aqui do lado. Mas {{a Cida saiu cedinho com uma sacola, foi pra casa da comadre|cida_comadre}}. Disse que volta amanhã.', 'Mas tem o rapaz da farmácia. Ele me leva no posto, ele é bom.'],
        },
      ],
      links: [{ a: 'sem_alarme', b: 'manual:dengue_sem', insight: 'Febre sem sinal de alarme, comendo e bebendo. Mas tem 81 anos, diabetes e mora sozinha: precisa ser vista na UBS hoje, com alguém junto.' }], // Conferido (USP cap. 58: acima de 65 anos ou com doença crônica, hemograma e reavaliação no mesmo dia; UPA também serve)
      patient: { name: 'Neusa Andrade', age: 81, sex: 'F' },
      truth: { dx: 'Dengue sem sinais de alarme em idosa (avaliação na UBS no mesmo dia)', sev: 'verde', ok: ['ORI'], ref: ['UBS', 'UPA'] },
      diary: { ori: 'Dona Neusa, 81, vizinha da Dona Cida. Febre sem alarme. "Meu filho mora em São Paulo, não atende."' },
    }),
    // ----------------------------------------------------------------- 5 dengue sem alarme (o atestado)
    call({
      id: 'd11_atestado',
      ref: 'D11 #5',
      at: '10:30',
      pool: 'dengue,leve',
      num: '(17) 99288-1030',
      caller: 'Rodrigo',
      callerName: 'Rodrigo',
      type: 'exagerador',
      voice: 'jovem_h',
      note: 'Rapaz, diz que tá "morrendo de dengue".',
      noteWrong: 'Rapaz morrendo, febre muito alta!',
      addr: { rua: 'Rua das Indústrias', n: 1180, bairro: 'Distrito Industrial', ref: 'República dos funcionários da cerâmica, portão cinza.' },
      amb: ['ventilador', 'tv'],
      open: ['{Dr}, {{eu tô morrendo|morrendo}}. Dengue. Tô com o corpo moído, febre de 38 e meio. E o meu supervisor falou que {{sem atestado eu tô na rua|atestado}}. Manda uma ambulância, que lá no hospital eles me dão o papel.'],
      q: {
        oque: 'Febre e dor no corpo. Dor de cabeça.',
        consciencia: 'Acordado, né. Ligando pra você.',
        respira: 'Respiro.',
        idade: 'Vinte e três.',
        inicio: 'Ontem à noite.',
        historico: 'Nada. Atleta. Quer dizer, jogo bola no sábado.',
        dengue: '{{Barriga não dói, não vomitei, sangue nenhum|sem_alarme}}. Tonto? Só de fome, que não tem nada na geladeira.',
        sangramento: 'Não.',
        paciente: 'Sou eu.',
      },
      extra: [
        {
          id: 'atestado_ori',
          kind: 'fala',
          label: 'Explicar sobre o atestado',
          say: 'Ambulância não é transporte para atestado. A UBS faz o atestado. Hidrata, vai à UBS, e se aparecer dor forte na barriga, vômito ou sangramento, liga de novo.',
          a: '[suspiro] Tá. Mas se eu morrer a culpa é sua. ...Brincadeira, {dr}. Valeu.',
        },
      ],
      links: [
        { a: 'morrendo', b: 'sem_alarme', insight: '"Tô morrendo"... sem nenhum sinal de alarme. O que ele precisa é do atestado: UBS (Manual p.11).' },
        { a: 'atestado', b: 'manual:verde', insight: 'Ambulância como transporte para atestado: verde, orientação (Manual p.1).' },
      ],
      patient: { name: 'Rodrigo Lima', age: 23, sex: 'M' },
      truth: { dx: 'Dengue sem sinais de alarme', sev: 'verde', ok: ['ORI'], ref: ['UBS'] },
      radio: { excess: 'Central, {unit}. Rapaz com febre, andando, pediu pra passar na padaria antes. Era pelo atestado, {dr}.' },
      diary: { ori: 'Rodrigo, 23. "Tô morrendo." Queria o atestado.' },
    }),
    // ----------------------------------------------------------------- 6 "desmaiou" (vasovagal no laboratório)
    call({
      id: 'd11_desmaio',
      ref: 'D11 #7',
      at: '11:30',
      pool: 'dengue,leve',
      num: '(17) 3321-2250',
      caller: 'Rose (recepção do laboratório)',
      callerName: 'Rose',
      type: 'testemunha',
      voice: 'mulher',
      note: 'Laboratório. Paciente com dengue desmaiou.',
      noteWrong: 'Moça com dengue desmaiou, não acorda!',
      addr: { rua: 'Rua XV de Novembro', n: 2050, bairro: 'Centro', ref: 'Laboratório de análises no térreo, do lado da lotérica.' },
      amb: ['tv'],
      open: [
        'Alô, emergência? Aqui é do laboratório da XV. Uma moça que veio fazer exame de dengue {{desmaiou na cadeira de coleta|desmaiou}}!',
        '[{{sala de espera cheia; alguém pede "dá um ar pra ela"|sala}}]',
      ],
      q: {
        oque: 'A técnica furou, o sangue começou a subir na seringa, {{ela olhou e apagou|olhou_sangue}}. Caiu sentada, a gente segurou.',
        consciencia: '{{Já acordou! Foi uns segundos.|acordou}} Tá conversando, meio envergonhada.',
        respira: 'Normal.',
        idade: 'Dezenove.',
        inicio: 'Agora, cinco minutos.',
        sangramento: 'Só o furinho do braço, já tá com algodão.',
        historico: '{{Ela disse que desmaia com sangue desde criança|sempre}}. Dengue, terceiro dia.',
        dengue: '{{Ela diz que não tem dor de barriga, não vomitou, a gengiva não sangra|sem_alarme}}. Antes de furar tava bem, conversando.',
        paciente: ['LARISSA: Ai, que vergonha... Eu sempre desmaio com agulha, {m:moço|moça}.', 'LARISSA: {{Tô bem. Já tô até com fome.|fome}}'],
        seguranca: 'Seguro.',
      },
      extra: [{ id: 'cor', label: 'Cor e pele: pálida? Fria?', say: 'Como está a cor dela agora? A pele está fria, suada? Ela consegue ficar sentada sem tontura?', a: '{{A cor voltou, tá corada. A mão tá quentinha.|corada}} Sentou e tá tomando um suco.' }],
      links: [
        { a: 'olhou_sangue', b: 'manual:dengue_grave', insight: '"Desmaio" está na página do choque da dengue... mas ela desmaiou ao VER o sangue na seringa, acordou em segundos, está corada e quente: desmaio vasovagal, não choque (Manual p.11).' }, // Conferido (RC20: recuperação completa, sem dor no peito, dispneia, convulsão ou déficit; corada e quente, sem os sinais de choque do campo B3)
        { a: 'sempre', b: 'acordou', kind: 'confirma', insight: 'Desmaia com agulha desde criança e voltou em segundos: reflexo, não gravidade.' },
      ],
      patient: { name: 'Larissa Teixeira', age: 19, sex: 'F' },
      // RC20: desmaio testemunhado = "história de inconsciência" → USI/USB. Vasovagal típico (viu o sangue, segundos,
      // corada e quente, desmaia com agulha desde criança): orientação preferida, USB ⚖ (antes era excesso), como em
      // d08_onibus.
      truth: { dx: 'Desmaio vasovagal na coleta de sangue (dengue sem alarme)', sev: 'verde', ok: ['ORI', 'USB'], best: 'ORI', ref: ['UBS', 'CASA'], dest: ['UPA'] },
      radio: {
        ok: 'Central, {unit} no laboratório. A moça desmaiou de ver sangue, {dr}. Corada, pressão boa, comendo bolacha. Levamos pra UPA por precaução.',
        excess: 'Central, {unit} no laboratório. A moça desmaiou de ver sangue, {dr}. Tá comendo bolacha. Liberamos.',
      },
      diary: {
        ori: 'Larissa, 19. Desmaiou ao ver o próprio sangue na seringa. Dengue sem alarme.',
        alive: 'Larissa, 19. Desmaiou ao ver o próprio sangue na seringa. Foi para a UPA por precaução. Dengue sem alarme.',
      },
    }),
    // ----------------------------------------------------------------- 7 febre em gestante
    call({
      id: 'd11_gestante',
      ref: 'D11 #8',
      at: '12:40',
      pool: 'dengue,obstetricia',
      num: '(17) 99377-1235',
      caller: 'Daniele (gestante)',
      callerName: 'Daniele',
      type: 'minimizador',
      voice: 'jovem_m',
      note: 'Grávida, febre. Diz que não é nada.',
      noteWrong: 'Moça com febre, dengue. Leve.',
      addr: { rua: 'Rua Sabiá', n: 320, bairro: 'Vila Esperança', ref: 'Casa rosa, a segunda depois da escola Monteiro Lobato.' },
      amb: ['tv', 'ventilador'],
      open: ['Oi, desculpa ligar. {{Deve ser dengue, todo mundo aqui na rua tá com|deve_ser}}... mas a minha sogra mandou eu ligar porque eu tô {{grávida|gravida}}. {{Febre de 38 e meio|febre}} desde ontem.'],
      q: {
        oque: 'Febre, dor no corpo, dor atrás do olho. Igual todo mundo.',
        consciencia: 'Acordada.',
        respira: 'Normal.',
        idade: 'Vinte e quatro.',
        inicio: 'Ontem de manhã.',
        gestacao: ['{{Trinta semanas|semanas}}. Primeiro filho.', 'Sangramento não. Dor de cabeça, só a da febre. {{O neném mexeu hoje cedo|mexeu}}, mexeu bastante.'],
        dengue: 'Nada disso. Só a febre e o corpo moído.',
        historico: 'Nada. Pré-natal em dia, lá na UBS.',
        sangramento: 'Não.',
        paciente: 'Sou eu.',
      },
      links: [
        { a: 'gravida', b: 'manual:dengue_gestante', insight: 'Gestante com febre na epidemia: risco aumentado mesmo sem sinal de alarme. USB → Maternidade (Manual p.11).' },
        { a: 'deve_ser', b: 'semanas', insight: '"Deve ser dengue, igual todo mundo"... só que ela está com 30 semanas. Não é igual todo mundo.' },
      ],
      patient: { name: 'Daniele Ramos', age: 24, sex: 'F' },
      // [validar] Nenhuma página de regulação trata dengue ou febre na gestante. Estável, sem sangramento, bebê mexendo:
      // sem discriminador, o RM4 orientaria a ida à maternidade por meios próprios; USP cap. 58: gestante com dengue é
      // grupo B (hemograma e avaliação no mesmo dia). USB preferida (Manual p.11); orientação → Maternidade ⚖.
      // Equipe: a orientação para ir hoje à maternidade deve ser aceita?
      truth: { dx: 'Febre (provável dengue) em gestante de 30 semanas', sev: 'amarelo', ok: ['USB', 'ORI'], best: 'USB', dest: ['MAT'], ref: ['MAT'], risk: { good: 120, bad: 300, needs: 'USB' } },
      radio: { ok: 'Central, {unit}. Gestante de 30 semanas, febril, estável, bebê mexendo. Seguimos Maternidade. A sogra veio junto, com a sacola do enxoval. "Por via das dúvidas", ela disse.' },
      diary: {
        alive: 'Daniele, 24, 30 semanas. Febre na epidemia. "Deve ser dengue, igual todo mundo."',
        ori: 'Daniele, 24, 30 semanas. Febre na epidemia. Orientada a ir hoje à maternidade; a sogra levou.',
      },
    }),
    // ----------------------------------------------------------------- 8 idoso confuso e sonolento (alarme)
    call({
      id: 'd11_idoso',
      ref: 'D11 #9',
      at: '14:00',
      pool: 'dengue,moderado',
      num: '(17) 99150-1350',
      caller: 'Márcio (neto)',
      callerName: 'Márcio',
      type: 'comum',
      voice: 'jovem_h',
      note: 'Neto. Avô com dengue e "esquisito".',
      noteWrong: 'Velhinho com febre. Dengue. Leve.',
      addr: { rua: 'Rua Marechal Deodoro', n: 3020, bairro: 'Vila Nova', ref: 'Casa do lado da igreja São Judas, portão marrom.' },
      amb: ['tv', 'passaros'],
      open: ['Alô, meu avô tá com dengue, o exame saiu ontem. {{Hoje ele tá esquisito|esquisito}}. {{Me chamou pelo nome do meu pai|confuso}}. E {{dorme o tempo todo|sonolento}}: a gente acorda e ele apaga de novo.'],
      q: {
        oque: 'Febre há cinco dias. Ontem tava conversando normal. Hoje, isso.',
        consciencia: '{{Acorda quando chama alto, responde enrolado e dorme de novo|acorda_chama}}.',
        respira: 'Respira. Normal, eu acho.',
        idade: 'Oitenta e dois.',
        inicio: 'A confusão, de manhã. A febre, faz cinco dias.',
        historico: 'Pressão, próstata. Toma uns quatro remédios.',
        dengue: '{{Não tá comendo nada, bebendo pouquinho|pouco_liquido}}. Vomitar não. Sangue não. Tontura... ele nem levanta.',
        sangramento: 'Não vi.',
        fast: 'Sorriu... sorriu normal. Levantou os dois braços, devagar. Falou "o céu é azul" meio mole, mas falou.',
        paciente: ['SEU SEBASTIÃO: Hum? ...Carlinhos? ... [{{ele dorme no meio da frase|dorme_frase}}]'],
        seguranca: 'Seguro.',
      },
      extra: [{ id: 'glicemia', label: 'É diabético? Mediu o açúcar?', say: 'Ele é diabético? Alguém mediu o açúcar dele?', a: 'Não é diabético. A tia mediu com o aparelho dela: {{deu 132|glicemia}}.' }],
      links: [
        { a: 'sonolento', b: 'manual:dengue_alarme', insight: 'Sonolência e confusão na dengue de um idoso: sinal de alarme. USB → Regional (idoso ou confuso: REG — Manual p.11).' },
        { a: 'confuso', b: 'glicemia', insight: 'Confuso, mas com glicemia normal e FAST sem alteração: não é hipoglicemia nem AVC. É a dengue pesando num corpo de 82 anos.' },
      ],
      patient: { name: 'Sebastião Gonçalves', age: 82, sex: 'M' },
      truth: { dx: 'Dengue com sinais de alarme em idoso (sonolência e confusão)', sev: 'amarelo', ok: ['USB'], dest: ['REG'], risk: { good: 90, bad: 240, needs: 'USB' } },
      radio: { ok: 'Central, {unit} no local. Idoso com dengue, desidratado, sonolento, pressão baixa. Soro e oxigênio. Seguimos Regional. Ele acordou na ambulância e perguntou pelo Carlinhos.' },
      diary: { alive: 'Seu Sebastião, 82. Dengue com sinal de alarme. Chamou o neto pelo nome do filho.' },
    }),
    // ----------------------------------------------------------------- 9 febre em criança, sem alarme
    call({
      id: 'd11_febre',
      ref: 'D11 #10',
      at: '16:30',
      pool: 'dengue,leve,pediatria',
      num: '(17) 99220-1520',
      caller: 'Cleide (mãe)',
      callerName: 'Cleide',
      type: 'comum',
      voice: 'mulher',
      note: 'Mãe, criança com febre.',
      noteWrong: 'Criança com febre e sangramento!',
      addr: { rua: 'Rua Quaresmeira', n: 1860, bairro: 'Jardim Primavera', ref: 'Na rua da oficina de geladeira, casa de esquina.' },
      amb: ['desenho'],
      open: ['Oi, meu filho de seis anos tá com {{febre de 38 e pouco|febre}} desde ontem. Aqui na rua tá todo mundo com dengue. Eu fico com medo, né, por causa do que passa na televisão.'],
      q: {
        oque: 'Febre. Ficou meio molinho de manhã. Agora tá vendo desenho.',
        consciencia: 'Acordado, {{vendo desenho e pedindo pipoca|pipoca}}.',
        respira: 'Normal.',
        idade: 'Seis anos.',
        inicio: 'Ontem à noite.',
        dengue: '{{Barriga não dói, não vomitou, não sangrou nada|sem_alarme}}. Fez xixi de manhã, bastante.',
        historico: 'Nada. Vacina em dia.',
        sangramento: 'Não.',
        paciente: ['ENZO: Mãe, a febre foi embora?', '[{{risadinha com o desenho|risadinha}}]'],
      },
      links: [{ a: 'sem_alarme', b: 'manual:dengue_sem', insight: 'Febre, ativo, pedindo pipoca, urinando, sem sinal de alarme: dengue sem alarme. Hidratação e UBS (Manual p.11).' }],
      patient: { name: 'Enzo Martins', age: 6, sex: 'M' },
      truth: { dx: 'Febre na epidemia (provável dengue sem alarme)', sev: 'verde', ok: ['ORI'], ref: ['UBS'] },
      diary: { ori: 'Enzo, 6. Febre, pedindo pipoca. A mãe saiu sabendo os sinais de alarme de cor.' },
    }),
    // ----------------------------------------------------------------- 10 ★ dengue grave (chega tarde; se sobrar, vai pro Henrique)
    call({
      id: 'd11_dengue_grave',
      ref: 'D11 #6 ★',
      at: '18:20',
      anchor: true,
      nightDeath: true,
      num: '(17) 99503-1820',
      caller: 'Dona Vera (mãe)',
      callerName: 'Vera',
      type: 'comum',
      voice: 'mulher',
      note: 'Mãe, filho de 15 com dengue. Sangrou o nariz e a gengiva. Tá tonto.',
      addr: { rua: 'Rua Tiradentes', n: 2080, bairro: 'Vila Nova', ref: 'Vila do fundo, casa 4, portão de ferro verde.' },
      amb: ['chuva', 'tv'],
      open: [
        '{m:Moço|Moça}, o meu filho tá com dengue faz cinco dias. Ontem a febre passou, eu achei que ele tava melhorando...',
        '...mas agora {{o nariz sangrou e a gengiva tá sangrando|sangra}}. E ele {{levantou pra ir no banheiro e caiu|caiu}}. Ele tá {{gelado|gelado}}, {m:moço|moça}.',
      ],
      q: {
        oque: ['A febre sumiu ontem. Hoje ele ficou deitado o dia inteiro. {{Agora à tarde começou a sangrar o nariz|nariz}}, e escovou o dente e a gengiva não para.', 'Aí levantou e caiu. Não apagou de tudo, mas {{ficou branco|branco}}.'],
        consciencia: 'Acordado, mas {{mole, respondendo devagar|mole}}.',
        respira: 'Rápido. Respirando rápido.',
        idade: 'Quinze.',
        inicio: 'O sangue, faz uma hora. A tontura, agora.',
        dengue: ['{{Sangramento, tontura, tudo|alarme}}. E dor na barriga desde ontem.', 'Vomitou duas vezes hoje.'],
        sangramento: 'O do nariz parou um pouco, eu pus gelo. A gengiva tá minando sangue.',
        historico: 'Nada. Nunca teve nada. Fez o exame de dengue na UBS anteontem.',
        paciente: ['YURI: Mãe... tô com frio...', '[{{a voz dele é fraca, sem força|voz_fraca}}]'],
        seguranca: 'Seguro.',
        // 1.1: as perguntas fixas de pulso e pele (antes, uma pergunta própria "Pele fria? Pulso?")
        pele: '{{Frio e molhado, as mãos e os pés|pele_fria}}. E branquinho, {dr}. Branco de papel.',
        pulso: 'No punho... {{fininho, rápido, quase não acho|pulso_fraco}}.',
        referencia: 'Vila do fundo, casa 4. Portão de ferro verde. Eu ponho uma luz na frente.',
      },
      extra: [
        { id: 'urina', label: 'Está urinando?', say: 'Quando ele urinou pela última vez?', a: 'De manhã. Uma vez só, pouquinho.' },
      ],
      links: [
        { a: 'pele_fria', b: 'manual:dengue_grave', insight: 'Pele fria e úmida, pulso fino, sangramento e tontura ao levantar, logo depois que a febre baixou: CHOQUE da dengue. USA → Regional (Manual p.11).' }, // Conferido (campo B3: choque hipovolêmico = pele fria, úmida, pulso fino; RM4: insuficiência circulatória é vermelho; USP cap. 58: dengue com choque é grupo D)
        { a: 'gelado', b: 'manual:dengue_grave', insight: '"Ele tá gelado" e caiu ao levantar: sinais de choque (Manual p.11).' },
        { a: 'sangra', b: 'manual:dengue_alarme', insight: 'Sangramento de mucosa (nariz e gengiva) é sinal de alarme. Com tontura e pele fria, já é choque (Manual p.11).' },
      ],
      worsen: [{ after: 60, lines: ['VERA: {m:Moço|Moça}, {{ele não tá respondendo direito|piora}}! Tá com o olho virando!'] }],
      guide: { id: 'd11_choque' },
      onResolve: (e, r) => {
        e.set(r.outcome === 'obito' ? 'd11_dengue_obito' : 'd11_dengue_salvo');
      },
      patient: { name: 'Yuri Santana', age: 15, sex: 'M' },
      truth: { dx: 'Dengue grave (choque com sangramento)', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 50, bad: 120 } },
      radio: {
        ok: '{central}, {unit} no local. Adolescente em choque, dengue grave. Dois acessos, soro aberto, a pressão tá voltando. Seguimos Regional. A mãe tá rezando alto aqui atrás.',
        under: '{unit}: adolescente em choque, dengue grave! Precisamos de USA!',
        dead: 'Central... {unit}. Óbito às {hora}. Quinze anos, {dr}. Quinze.',
      },
      diary: {
        alive: 'Yuri, 15. Dengue grave, choque. Chegou a tempo. A mãe pôs uma luz no portão.',
        dead: (c) => {
          const st = c.s.shift ? Object.values(c.s.shift.calls).find((x) => x.def === 'd11_dengue_grave')?.status : undefined;
          return st === 'noturno'
            ? 'Yuri, 15. Dengue grave. Ficou na minha fila às 18:20 e passou para o noturno às 19:00. Morreu de madrugada.'
            : 'Yuri, 15. Dengue grave. A febre tinha baixado, e a mãe achou que ele estava melhorando.';
        },
        later: [{ day: 13, text: 'Yuri teve alta. A mãe mandou uma foto pela Simone: ele de boné, segurando o exame.', when: (c) => c.s.diary.some((d) => d.id === 'd11_dengue_grave' && d.kind === 'vivo') }],
      },
    }),
  ],
  interlude: {
    teaser: (c) => (atelie(c) ? '{Oconj} arrumou a sala como se fosse loja. Tem cliente vindo.' : 'Sábado à noite. Tem mosquito até no ônibus.'),
    familyLacos: 1,
    pre: (c) => ({
      id: 'd11_aluguel',
      bg: 'porta',
      cast: ['NOGUEIRA'],
      nodes: {
        start: {
          lines: [
            { who: 'NARRADOR', t: 'Você desce do ônibus e o Seu Nogueira está no seu portão, com a pasta de elástico debaixo do braço e a camisa social grudada nas costas.' },
            c.flag('brigou_nogueira')
              ? { who: 'NOGUEIRA', t: '{Dr}. Não vou entrar, não precisa. O IGP-M subiu. E depois daquela conversa da conta de água... eu tive que rever umas coisas. Cento e quarenta, a partir deste mês.' }
              : { who: 'NOGUEIRA', t: 'Boa noite, {dr}. Desculpa vir no sábado. É o IGP-M, né? Sobe pra todo mundo. Cento e trinta, a partir deste mês.' },
            { who: 'NOGUEIRA', t: 'Tá no contrato. Cláusula sexta. Pode ler.' },
          ],
          choices: [
            { label: '"Tá certo, Seu Nogueira."', next: 'ok' },
            { label: c.flag('brigou_nogueira') ? '"Quarenta reais é a semana de remédio da minha mãe."' : '"Trinta reais é a semana de remédio da minha mãe."', next: 'reclama' },
          ],
        },
        ok: { lines: [{ who: 'NOGUEIRA', t: '{m:O senhor|A senhora} é gente fina, {dr}. Médico entende de número.' }] },
        reclama: {
          lines: [
            { who: 'NOGUEIRA', t: 'E o meu é o da pressão, {dr}. Todo mundo tem um remédio.' },
            { who: 'NARRADOR', t: 'Ele aperta a sua mão com a mão suada e vai embora devagar. Ele também manca.' },
          ],
        },
      },
    }),
    scene: (c) => (atelie(c) ? julianaScene(c) : DENGUE_CASA),
    bico: (c) =>
      atelie(c)
        ? {
            id: 'd11_bico',
            bg: 'preto',
            nodes: {
              start: {
                onEnter: fx.all(fx.set('juliana_cliente'), fx.set('lucia_costura_fora')),
                lines: [
                  { who: 'NARRADOR', t: 'Doze horas na USA 01. Dengue atrás de dengue: o soro da ambulância acaba antes da meia-noite.' },
                  { who: 'NARRADOR', t: 'Quando você chega, tem um bilhete preso na máquina de costura, com a letra caprichada {doconj}:' },
                  { who: 'LUCIA', t: '"Primeira cliente! Juliana, filha de um Seu Antônio. O terno do pai pro casamento dela. Ela disse que {m:um médico|uma médica} da Regulação salvou o pai pelo telefone. Pensei em você o tempo todo. Tem bolo na geladeira."', when: (cc) => cc.key('antonio') === 'salvo' },
                  { who: 'LUCIA', t: '"Primeira cliente. Juliana. O pai dela morreu de infarto; vou fazer almofadas com as camisas dele, pra mãe dela abraçar. Chorei junto. Queria que você estivesse aqui."', when: (cc) => cc.key('antonio') === 'perdido' },
                  { who: 'LUCIA', t: '"Primeira cliente! Juliana, da São João. Barra e um vestido. Fiz um caderninho. Queria que você tivesse visto."', when: (cc) => cc.key('antonio') !== 'salvo' && cc.key('antonio') !== 'perdido' },
                ],
              },
            },
          }
        : {
            id: 'd11_bico',
            bg: 'preto',
            nodes: {
              start: {
                lines: [
                  { who: 'NARRADOR', t: 'Doze horas na USA 01. Dengue atrás de dengue: o soro da ambulância acaba antes da meia-noite.' },
                  { who: 'NARRADOR', t: 'Na mesa da cozinha, um desenho do Liam: um mosquito gigante com um X vermelho em cima. Embaixo, com letra de oito anos: "Fiscal da dengue. Você não veio."', when: is.present('davi') },
                  { who: 'NARRADOR', t: 'Na mesa da cozinha, um prato coberto com outro prato. Arroz, feijão, um bife fino. Frio.', when: (cc) => !is.present('davi')(cc) },
                ],
              },
            },
          },
  },
});
