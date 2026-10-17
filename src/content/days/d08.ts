// =============================================================================
// DIA 8 — "A Apresentação". Segunda-feira. Sem página nova no Manual.
// ★ 08:10 — "Queria pedir uma pizza de calabresa pra Rua Ipê, 112." É a emergência.
// Pedido disfarçado de violência doméstica (Rosângela): USB + PM. Se for encerrado
// como trote ou orientação, ninguém liga de novo e ela morre (o D9 noticia).
// ★ Queda REAL da Dona Cida (USB): o padrão dela quebra. O D9 lê
// cida_queda_regulada / cida_queda_dispensada.
// 19:00 — o Henrique chega 30 minutos atrasado e pede cobertura (D9: passagem).
// Em casa: a redação do Liam, a Tia Márcia ("alérgica a tudo, até a picada de
// abelha") e o bilhete que estará na mesa no D9.
// Fios: 🌱 Márcia, 🌱 Rosângela, ↺ Cida, ↺ Henrique.
// =============================================================================
import type { Ctx, Decision, ShiftScriptCtx, TimelineDef, TruthDef, UnitState } from '../../engine/types';
import { hm } from '../../engine/util';
import { day, call, fx, is, NUM, ADDR } from '../dsl';

/** decisão carimbada de uma ligação do dia (pelo id da definição; ignora variantes do banco) */
const decisao = (c: Ctx, defId: string): Decision | undefined =>
  c.s.shift ? Object.values(c.s.shift.calls).find((x) => x.def === defId && !x.gen)?.decision : undefined;

/** entrada do diário de uma ligação */
const noDiario = (c: Ctx, id: string) => c.s.diary.find((d) => d.id === id)?.kind;

/** Vigia de rádio: dispara um pedido quando a viatura chega ao local (uma vez). */
function vigiaNoLocal(id: string, at: string, defId: string, fire: (c: ShiftScriptCtx, u: UnitState) => void): TimelineDef {
  return {
    at,
    kind: 'script',
    id,
    run: (c) => {
      if (c.sflag(id + '_feito')) return;
      const cl = c.callStatus(defId);
      if (!cl || cl.gen) return;
      const units = cl.units.map((uid) => c.shift.units[uid]).filter((u): u is UnitState => !!u);
      const local = units.find((u) => u.status === 'LOCAL' && u.callId === cl.id);
      if (local) {
        c.sflag(id + '_feito', true);
        fire(c, local);
        return;
      }
      const aCaminho = units.some((u) => u.status === 'DESLOC' && u.callId === cl.id);
      const aberta = cl.status === 'fila' || cl.status === 'ativa' || cl.status === 'espera' || cl.status === 'guia';
      if ((aberta || aCaminho) && c.now < hm('18:40')) c.schedule(c.now + 5, id);
    },
  };
}

// -----------------------------------------------------------------------------
// Rosângela: amarelo (USB + PM). Se a ligação for encerrada (ORI/TROTE), a
// verdade vira vermelho e a revelação "sem retorno" registra o óbito.
// -----------------------------------------------------------------------------
const pizzaTruth = (c: Ctx): TruthDef =>
  c.flag('rosangela_dispensada')
    ? { dx: 'Violência doméstica (pedido disfarçado de pizza)', sev: 'vermelho', ok: ['USB'], sup: ['PM'], key: 'rosangela' }
    : { dx: 'Violência doméstica (pedido disfarçado de pizza)', sev: 'amarelo', ok: ['USB'], sup: ['PM'], key: 'rosangela', risk: { good: 120, bad: 300, needs: 'USB' } };

/** a linha da redação do Liam que depende do que você respondeu no D5 */
const redacaoChoro = (c: Ctx): string => {
  switch (c.val<string>('d5_resposta_davi')) {
    case 'verdade':
      return '{m:Meu pai|Minha mãe} chega em casa com cara de quem chorou. {m:Ele|Ela} me falou que é porque às vezes não dá pra ajudar todo mundo. Mas {m:ele|ela} ajuda quase todo mundo.';
    case 'ar':
      return '{m:Meu pai|Minha mãe} chega em casa com cara de quem chorou. {m:Ele|Ela} diz que é o ar-condicionado da central. A minha vó diz que ar-condicionado não faz ninguém chorar.';
    case 'lucia':
      return '{m:Meu pai|Minha mãe} chega em casa com cara de quem chorou. {c:A minha mãe|O meu pai} diz que é o ar-condicionado da central. Eu acho que é mentira. Mas é mentira de proteger.';
    case 'abraco':
      return 'Quando {m:meu pai|minha mãe} chega com cara de quem chorou, {m:ele|ela} me abraça bem forte e não fala nada. Eu acho que {m:ele|ela} tá guardando as palavras pro telefone.';
    default:
      return '{m:Meu pai|Minha mãe} chega em casa {cansado}. Mas sempre pergunta como foi a escola.';
  }
};

export const DAY = day({
  day: 8,
  title: 'A Apresentação',
  weekday: 'Segunda-feira',
  weather: 'Garoa fina de manhã, 26 °C. Abafado à tarde.',
  newspaper: (c) => {
    const vip = c.flag('d7_vereador_usa') || c.flag('d7_usa_vip');
    const ecl = noDiario(c, 'd07_eclampsia');
    const eng = noDiario(c, 'd07_engasgo');
    return {
      headline: vip
        ? 'Ambulância leva mãe de vereador para "exame de rotina"'
        : ecl === 'morto'
          ? 'Grávida morre após convulsão; família diz que esperou a ambulância'
          : 'Domingo na Central: parto no banheiro, engasgo no churrasco e motoboy ferido',
      sub: vip
        ? 'Foto de leitor mostra a USA parada na porta do vereador Arlindo Matos no domingo de manhã. A Saúde+ Gestão diz que "todos os atendimentos seguem protocolo".'
        : ecl === 'morto'
          ? 'Kátia Cardoso, 29 anos, estava grávida de 34 semanas. A Saúde+ Gestão diz que "a ocorrência será apurada".'
          : 'A Central de Regulação orientou um parto pelo telefone e atendeu uma eclâmpsia na mesma manhã de domingo.',
      photo: vip ? 'vip' : ecl === 'morto' ? 'casa' : 'central',
      stories: [
        c.flag('vereador_inimigo')
          ? { title: 'Vereador cobra "humanização" na Regulação', text: 'Arlindo Matos diz que vai convocar a Saúde+ Gestão para explicar "o tratamento frio dado aos idosos" pela Central de Regulação.' }
          : { title: 'Entregadores protestam por segurança', text: 'Depois da queda de um motoboy de 19 anos no domingo, entregadores fizeram buzinaço na Av. Brasil contra a promessa de "20 minutos ou é de graça".' },
        eng === 'vivo'
          ? { title: 'Filha desengasga o pai no churrasco', text: 'Seu Geraldo, 78, engasgou com um pedaço de carne. A filha seguiu as instruções da Regulação pelo telefone. "Nunca mais como rindo", disse ele.' }
          : eng === 'morto'
            ? { title: 'Idoso morre engasgado no almoço de domingo', text: 'A família tentou a manobra até a chegada da ambulância. O velório foi na Igreja Matriz.' }
            : { title: 'Semana começa com garoa', text: 'A Defesa Civil prevê chuva fraca até quarta. As mangueiras do Jardim Primavera seguem floridas, e cheias de abelha.' },
        { title: 'Pizzaria do Toninho faz 30 anos', text: 'A calabresa grande sai por R$ 39 na semana de aniversário. "O segredo é a calabresa fininha", diz o dono.' },
      ],
      notice: 'Nenhuma página nova no Manual hoje. Vale reler a p.4 (cena insegura).',
      ad: 'PIZZARIA DO TONINHO — Calabresa grande R$ 39. Peça pelo telefone: (17) 3322-3939. Entrega grátis no Jardim Norte.',
      weather: 'Garoa de manhã · 26 °C',
    };
  },
  handover: () => ({
    id: 'd08_passagem',
    bg: 'central',
    cast: ['HENRIQUE', 'SIMONE'],
    nodes: {
      start: {
        lines: [
          { who: 'NARRADOR', t: '07:00. Segunda-feira. O Henrique já está de jaqueta, a chave do carro na mão. O cheiro de menta chega antes dele.' },
          { who: 'HENRIQUE', t: 'Noite calma, {nome}. Ah: hoje à noite eu posso chegar uns minutinhos atrasado. Coisa boba. Segura as pontas pra mim?' },
          { who: 'SIMONE', t: 'O Wesley pôs o pino ontem à noite, {dr}. Tá bem. Mandou um joinha pra você no meu celular.', when: (c) => c.flag('wesley_atendido') && c.flag('simone_wesley_conversa') },
          { who: 'SIMONE', t: 'O Wesley operou ontem. Tá bem. (ela volta para o monitor antes que você responda)', when: (c) => c.flag('wesley_atendido') && !c.flag('simone_wesley_conversa') },
          { who: 'NARRADOR', t: 'A Simone já está na mesa. Não diz bom dia. No seu monitor, um post-it com a letra dura dela: "Ligações."', when: is.flag('d7_wesley_dispensado') },
        ],
        choices: [
          { label: '"Uns minutinhos, Henrique. Hoje à noite eu não posso ficar: tem apresentação do meu filho na escola."', next: 'aviso', effect: fx.set('avisou_sarau') },
          { label: '"Tranquilo."', next: 'ok' },
        ],
      },
      aviso: {
        lines: [
          { who: 'HENRIQUE', t: 'Relaxa. Sete em ponto eu tô aqui. Palavra de escoteiro.' },
          { who: 'NARRADOR', t: 'Ele faz a saudação dos escoteiros com a mão errada e sai rindo.' },
        ],
      },
      ok: {
        lines: [{ who: 'HENRIQUE', t: 'Você é dos meus, {nome}.' }],
      },
    },
  }),
  // 1.1 — ida (o Seu Aílton de mau humor; o Seu Ademir no ponto), almoço (a Rose e os "minutinhos" do Henrique)
  // e volta (o sobrado verde da Rua Ipê, 112: R1, pista 2)
  ida: (c) => ({
    id: 'd08_ida',
    bg: 'rua',
    cast: [],
    nodes: {
      start: {
        lines: [
          { who: 'NARRADOR', t: '06:40. Garoa fina. O Seu Aílton está de mau humor e com o rádio AM desligado, o que é pior.' },
          { who: 'AÍLTON', t: 'Ontem um menino desmaiou aqui dentro, em jejum pra exame. Hoje vai ser outro, {dr}, eu sinto no joelho. Esse ônibus já viu de tudo. Já viu até casamento.' },
          ...(c.flag('d6_avc_regional') && c.s.diary.some((d) => (d.id === 'd06_avc' || d.callDef === 'd06_avc') && d.kind === 'vivo')
            ? [
                { who: 'NARRADOR', t: 'No ponto da Rua Rui Barbosa sobe um senhor de bengala, devagar, com a esposa segurando o cotovelo.' },
                { who: 'NEIDE', t: '{Dr} do telefone? A gente reconheceu a voz no rádio do ônibus... mentira, foi o Aílton que contou que era você.' },
                { who: 'ADEMIR', t: '(a boca ainda puxa um pouquinho pro lado quando ele sorri) Café. Eu já tomo café. Reclamo do café. Tô bom.' },
              ]
            : []),
        ],
      },
    },
  }),
  almoco: (c) => ({
    id: 'd08_almoco',
    bg: 'central',
    cast: ['ROSE', 'SIMONE'],
    nodes: {
      start: {
        lines: [
          { who: 'NARRADOR', t: '13:00. Segunda-feira. A Rose, do RH, entra com a prancheta e o perfume de talco.' },
          { who: 'ROSE', t: 'Bom dia, meu bem. Ponto do noturno. O Dr. Henrique tá com uns "minutinhos" no mês. Muitos minutinhos. Vocês viram ele chegar sábado?' },
          { who: 'SIMONE', t: 'Eu não vi nada. Eu nunca vejo nada.' },
          { who: 'ROSE', t: 'Ai, Simone. (para você) E você, {dr}? Ele chega no horário pra te render?' },
        ],
        choices: [
          { label: '"Chega. Ele me avisa quando atrasa."', next: 'cobriu', effect: fx.all(fx.add('lealHenrique', 1, 'cobriu o Henrique com a Rose'), fx.set('rose_ponto_henrique', 'cobriu')) },
          { label: '"Chega atrasado. Pergunta pra ele, não pra mim."', next: 'falou', effect: fx.set('rose_ponto_henrique', 'falou') },
          { label: '"Hoje é a apresentação do meu filho." (mudar de assunto)', next: 'sarau' },
        ],
      },
      cobriu: { lines: [{ who: 'ROSE', t: 'Que bom. Eu só carimbo, meu bem.' }, { who: 'NARRADOR', t: 'Ela anota alguma coisa na prancheta. Não é o seu nome. Ou é.' }] },
      falou: { lines: [{ who: 'ROSE', t: 'Pergunto. Eu só carimbo.' }, { who: 'NARRADOR', t: 'A Simone para de mastigar e olha pra você por cima dos óculos. Não diz nada.' }] },
      sarau: {
        lines: [
          { who: 'SIMONE', t: 'Vai. Às sete eu te enxoto daqui.', when: (cc) => !cc.flag('avisou_sarau') },
          { who: 'SIMONE', t: 'Você me contou na passagem. Tá vendo, Rose? Avisa. Às sete eu enxoto {m:ele|ela} daqui.', when: (cc) => cc.flag('avisou_sarau') },
          { who: 'ROSE', t: 'Ai, que lindo. Leva lenço.' },
        ],
      },
    },
  }),
  volta: (c) => ({
    id: 'd08_volta',
    bg: 'rua',
    cast: [],
    nodes: {
      start: {
        lines: [
          { who: 'NARRADOR', t: '19:40. O ônibus pega a Rua Ipê por causa de uma obra na Brasil. No 112, um sobrado verde. A luz da cozinha acesa. Um carro preto parado na frente, de vidro escuro.' },
          { who: 'NARRADOR', t: 'Sobrado verde. Luz da cozinha acesa. Você não sabe por que guardou essa imagem.' },
          { who: 'NARRADOR', t: 'Você desce dois pontos antes e corre para a Monteiro Lobato, ainda de jaleco.', when: () => c.s.family.davi.status !== 'morto' && !c.s.family.davi.away },
        ],
      },
    },
  }),
  timeline: [
    {
      at: '07:20',
      kind: 'script',
      id: 'peixoto_vereador',
      run: (c) => {
        // flags.md: d7_assessor_negado (eco imediato) — o Peixoto conta do assessor que você barrou na base
        if (c.flag('d7_assessor_negado') && !c.flag('envelope_aceito') && !c.flag('envelope_lucia')) {
          c.modal('DR. PEIXOTO', 'O assessor do vereador anotou o seu nome no domingo, {dr}. Aquele de terno, da base. Ele me ligou. Eu disse que você é teimos{m:o|a}. Ele não riu.' + (c.flag('vereador_inimigo') ? ' E o vereador ligou pro diretor da OS. Quer o seu nome numa reunião da comissão de saúde. Eu segurei, por enquanto.' : ''), 'interfone');
          return;
        }
        if (c.flag('envelope_aceito')) {
          c.modal('DR. PEIXOTO', 'O vereador Arlindo mandou elogio por escrito pra diretoria, {dr}. Você virou "{m:o doutor|a doutora} da confiança dele". Parabéns. Eu acho.', 'interfone');
        } else if (c.flag('envelope_lucia')) {
          c.modal('DR. PEIXOTO', 'O vereador Arlindo mandou elogio por escrito pra diretoria, {dr}. Agradeceu "a gentileza da sua família". ...Eu não sabia que vocês eram tão amigos.', 'interfone');
        } else if (c.flag('vereador_inimigo')) {
          c.modal(
            'DR. PEIXOTO',
            c.flag('d7_lucia_jogou')
              ? 'O vereador Arlindo ligou pro diretor da OS, {dr}. Disse que você foi "grosseiro e burocrático" com a mãe dele. E que {c:a sua esposa|o seu marido} jogou o presente dele na calçada. ...Presente, {dr}? (pausa) Eu não quero saber. Só não me arruma mais vereador.'
              : 'O vereador Arlindo ligou pro diretor da OS, {dr}. Disse que você foi "grosseiro e burocrático" com a mãe dele. Quer o seu nome numa reunião da comissão de saúde. Eu segurei, por enquanto. Segura a onda, tá?',
            'interfone',
          );
        }
      },
    },
    vigiaNoLocal('vigia_pizza', '08:15', 'd08_pizza', (c, u) => {
      const d = c.callStatus('d08_pizza')?.decision;
      if (!d?.support.includes('PM')) return;
      c.request(
        u.radioName,
        `Central, ${u.label}. Ela pediu o rádio. Quer falar com quem atendeu a "pizza".`,
        [
          {
            id: 'falar',
            label: 'Falar com ela pelo rádio (5 min)',
            cost: 5,
            effect: (s) => {
              s.add('humanidade', 1, 'falou com a Rosângela');
              s.set('rosangela_falou');
            },
            reply: 'ROSÂNGELA (pelo rádio, baixinho): Era você? ...Eu tinha certeza que você ia desligar. Todo mundo desliga. Obrigada por não desligar.',
          },
          { id: 'seguir', label: 'Pedir que digam a ela que deu tudo certo, e seguir', reply: 'Entendido, Central. Ela sorriu quando eu falei. Seguimos.' },
        ],
        'seguir',
        8,
      );
    }),
    { at: '12:10', kind: 'simone', who: 'CELULAR · {CONJ}', text: '"Não esquece: 20h, sarau da escola. O Liam tá ensaiando a redação no banheiro, de porta trancada. Não quer que ninguém ouça antes de você."' },
    { at: '17:40', kind: 'simone', who: 'SIMONE', text: 'O Henrique mandou mensagem: "atraso uns minutinhos, segura aí". Os minutinhos do Henrique, {dr}, são maiores que os nossos.' },
    { at: '18:45', kind: 'radio', who: 'USA 01 · BENÉ', text: 'Central, USA 01 recolhendo. Boa apresentação pro menino hoje, {bene}. A Simone contou pra frota inteira.' },
  ],
  calls: [
    // ------------------------------------------------------------------ 1
    call({
      id: 'd08_onibus',
      ref: 'D8 #1',
      at: '07:10',
      pool: 'leve',
      num: '(17) 99332-1560',
      caller: 'Seu Aílton (motorista de ônibus)',
      callerName: 'Aílton',
      type: 'testemunha',
      voice: 'homem',
      note: 'Motorista de ônibus. Passageiro desmaiou, já acordou.',
      noteWrong: 'Rapaz desacordado dentro do ônibus!',
      addr: { rua: 'Av. Brasil', n: 1560, bairro: 'Distrito Industrial', ref: 'Ponto de ônibus em frente à Rodoviária.' },
      amb: ['onibus', 'buzinas', 'multidao'],
      open: [
        'Bom dia, {dr}, aqui é o Aílton, motorista da linha 12. {{Um rapaz desmaiou aqui no ônibus|desmaiou}}, caiu em cima de uma senhora. {{Mas já acordou|acordou}}, tá sentado, tá falando.',
        'Esse ônibus já viu de tudo, {dr}. Já viu até casamento. Mas desmaio às sete da manhã é a primeira vez na semana.',
        '[buzinas; passageiros reclamando do atraso]',
      ],
      q: {
        oque: 'Tava em pé, lotado, abafado. Ficou branco, disse que ia vomitar e apagou. O pessoal segurou ele.',
        consciencia: 'Acordou rapidinho, {{uns segundos|segundos}}. Tá falando normal, meio envergonhado.',
        respira: 'Normal.',
        idade: 'Uns dezenove, vinte.',
        inicio: 'Agora, uns cinco minutos.',
        historico: '(pergunta pro rapaz) Diz que não tem nada. {{Tá em jejum, ia fazer exame de sangue|jejum}} no posto.',
        sangramento: 'Não. Não bateu em nada, caiu em cima da senhora. A senhora tá bem também. Só brava.',
        dorpeito: 'Ele diz que não. Coração normal, só tá com fome.',
        paciente: ['LUCAS: Oi... foi mal. {{Antes de apagar eu fiquei tonto e enjoado|tonto_antes}}. Não comi nada desde ontem, por causa do exame.', 'LUCAS: Não chama ambulância, não, pelo amor de Deus. Tô atrasado.'],
        seguranca: 'Seguro. Parei o ônibus no ponto.',
        referencia: 'Ponto em frente à Rodoviária.',
      },
      extra: [
        {
          id: 'convulsao',
          label: 'Tremeu? Mordeu a língua? Urinou?',
          say: 'Quando ele desmaiou, tremeu o corpo, mordeu a língua ou fez xixi na roupa?',
          a: 'Não, nada. Apagou mole, acordou em seguida. Tá limpinho.',
        },
        {
          id: 'orientar',
          kind: 'fala',
          label: 'Orientar',
          say: 'Ele pode descer, sentar na sombra e comer alguma coisa. Se desmaiar de novo, sentir dor no peito, falta de ar ou o coração disparar, procura a UPA ou liga de novo.',
          // Conferido (RC20: sem dor no peito, dispneia, convulsão ou déficit; sinais para religar).
          a: 'LUCAS: Uma coxinha resolve? ...Tá bom, {dr}. Obrigado. Motorista, me deixa na lanchonete!',
        },
      ],
      links: [
        { a: 'jejum', b: 'tonto_antes', kind: 'confirma', insight: 'Jejum, calor, ônibus lotado, tontura e enjoo antes de apagar, acordou em segundos: desmaio vasovagal. Verde, orientação.' },
        { a: 'desmaiou', b: 'acordou', insight: '"Desmaiou"... e já acordou, sentado e conversando. Sem sinal de alarme: não precisa de viatura.' },
      ],
      patient: { name: 'Lucas Teles', age: 19, sex: 'M' },
      // RC20: desmaio testemunhado = "história de inconsciência" → USI/USB. Vasovagal típico (jejum, calor, ônibus
      // lotado, pródromo, segundos, recuperação completa, 19 anos): orientação preferida, USB ⚖ (antes era excesso).
      // Primeiro desmaio: avaliação na UBS (eletrocardiograma) também é encaminhamento correto.
      truth: { dx: 'Desmaio vasovagal (jejum e calor)', sev: 'verde', ok: ['ORI', 'USB'], best: 'ORI', ref: ['CASA', 'UPA', 'UBS'] },
      radio: { excess: 'Central, {unit}. O rapaz tá ótimo, {dr}, comendo uma coxinha na lanchonete da Rodoviária. Pediu pra gente não contar pra mãe dele.' },
      diary: { ori: 'Desmaiou no ônibus, em jejum para exame de sangue. Saiu comendo uma coxinha.' },
    }),
    // ------------------------------------------------------------------ 2 ★ pedido disfarçado
    call({
      id: 'd08_pizza',
      ref: 'D8 #2 ★',
      at: '08:10',
      anchor: true,
      num: NUM.rosangela,
      caller: 'Voz feminina, baixa',
      callerName: 'Mulher',
      type: 'disfarcado',
      voice: 'mulher',
      note: 'Diz que quer pedir pizza. Voz baixinha.',
      noteFixed: true,
      addr: ADDR.rosangela,
      amb: ['tv', 'gritos'],
      noFollowup: true,
      nightDeath: true,
      open: [
        { t: 'Oi... {{queria pedir uma pizza|pizza}}. Grande. De calabresa.', style: 'sussurro' },
        { t: 'Pra {{Rua Ipê, 112|end_ipe}}. Jardim Norte.', style: 'sussurro' },
        '[{{voz masculina ao fundo, gritando: "Com quem você tá falando?! Desliga isso. Tá bom? TÁ BOM?"|voz_homem}}]',
      ],
      q: {
        oque: [{ t: '{{A pizza... só a pizza|so_pizza}}. Calabresa.', style: 'sussurro' }],
        consciencia: [{ t: 'Sim.', style: 'sussurro' }],
        respira: [{ t: 'Sim...', style: 'sussurro' }, '[uma respiração curta, contida]'],
        idade: [{ t: '...Trinta e oito. [pausa] O troco... é pra trinta e oito.', style: 'sussurro' }],
        sangramento: [{ t: '{{Sim.|sangra_sim}} [pausa] ...Com bastante molho.', style: 'sussurro' }],
        historico: [{ t: 'Não... sem cebola.', style: 'sussurro' }],
        inicio: [{ t: 'Desde ontem à noite. A... a fome.', style: 'sussurro' }],
        paciente: [{ t: 'Sou eu. A pizza é pra mim.', style: 'sussurro' }],
        referencia: [{ t: 'Sobrado verde. {{Primeira casa depois da esquina|ref_sobrado}}.', style: 'sussurro' }],
        seguranca: [{ t: '{{Não.|seguro_nao}}', style: 'sussurro' }, '[um baque, como uma porta batendo]'],
        pulso: [{ t: '...Rápido. [pausa] A entrega. Rápida.', style: 'sussurro' }],
        pele: [{ t: 'Roxa... [pausa] ...a berinjela. Sem berinjela. Roxo aqui no braço não.', style: 'sussurro' }],
      },
      extra: [
        {
          id: 'engano',
          label: '"Aqui é a Regulação, senhora."',
          say: 'Senhora, aqui é a Central de Regulação. Não é pizzaria.',
          a: [{ t: '{{Eu sei.|eu_sei}}', style: 'sussurro' }, '[silêncio]', { t: '...Eu sei. Calabresa.', style: 'sussurro' }],
        },
        {
          id: 'perigo',
          kind: 'confronto',
          locked: true,
          // 1.1 (ROTEIRO, dia 8): depois do "Aqui é a Regulação" ("Eu sei.") ou do "Local seguro?" ("Não.")
          unlockedBy: ['engano', 'seguranca'],
          label: '"Você está em perigo? Responda só sim ou não."',
          say: 'Você está em perigo? Responda só sim ou não.',
          a: [{ t: '{{Sim, isso, calabresa.|sim_calabresa}}', style: 'sussurro' }],
          unlocks: ['agressor', 'machucada', 'arma', 'linha'],
        },
        {
          id: 'agressor',
          locked: true,
          label: '"Ele está aí com você agora?"',
          say: 'Ele está aí com você agora? Só sim ou não.',
          a: [{ t: 'Sim.', style: 'sussurro' }, '[a voz masculina, mais perto: "Desliga isso agora!"]', { t: '...Pode ser sem azeitona.', style: 'sussurro' }],
        },
        {
          id: 'machucada',
          locked: true,
          label: '"Você está machucada?"',
          say: 'Você está machucada? Só sim ou não.',
          a: [{ t: 'Sim. [pausa] Mas consigo andar... até a porta.', style: 'sussurro' }],
        },
        {
          id: 'arma',
          locked: true,
          label: '"Ele tem alguma arma?"',
          say: 'Ele tem alguma arma? Faca, revólver? Só sim ou não.',
          a: [{ t: '{{Faca... de cozinha. Na mesa.|faca}}', style: 'sussurro' }, { t: '[rápido] Grande. A pizza. Grande.', style: 'sussurro' }],
        },
        {
          id: 'linha',
          kind: 'fala',
          locked: true,
          label: '"Não precisa falar. Deixa o telefone ligado."',
          say: 'Não precisa falar nada. Deixa o telefone ligado, perto de você. A ajuda está indo, com a polícia.',
          a: [{ t: '...[respira]... Obrigada... pelo pedido.', style: 'sussurro' }],
        },
      ],
      links: [
        { a: 'pizza', b: 'voz_homem', insight: 'Um "pedido de pizza" na linha de emergência, sussurrado, com um homem gritando ao fundo: ela não pode falar livremente. Pedido disfarçado.', unlock: 'perigo' },
        { a: 'eu_sei', b: 'pizza', insight: 'Ela sabe que ligou para a emergência e continua "pedindo pizza". Alguém está ouvindo.', unlock: 'perigo' },
        { a: 'seguro_nao', b: 'manual:cena', insight: '"O local está seguro?" "Não." Violência em andamento: PM junto com a viatura. A equipe não entra sem a polícia (Manual p.4).' },
        { a: 'faca', b: 'manual:cena_falta', insight: 'Agressor com faca: mandar equipe sem PM é advertência e põe todo mundo em risco (Manual p.4).' },
        { a: 'sim_calabresa', b: 'sangra_sim', kind: 'confirma', insight: 'Em perigo e sangrando, com o agressor em casa: USB com apoio da PM.' },
      ],
      onStamp: (e) => {
        const d = decisao(e, 'd08_pizza');
        if (!d) return;
        if (d.resource === 'ORI' || d.resource === 'TROTE') {
          e.set('rosangela_dispensada');
          e.keyPatient('rosangela', 'perdido');
        } else {
          e.keyPatient('rosangela', 'salvo');
          if (d.support.includes('PM')) e.achievement('calabresa');
        }
      },
      worsen: [
        {
          after: 35,
          lines: ['[{{a voz masculina, mais perto: "Desliga isso. Agora. Tá bom? TÁ BOM?"|voz_perto}}]', { t: 'Isso... calabresa. {{Rápido, {m:moço|moça}.|rapido}}', style: 'sussurro' }],
        },
      ],
      patient: { name: 'Rosângela Ferraz', age: 38, sex: 'F' },
      truth: pizzaTruth,
      radio: {
        ok: 'Central, {unit} na Rua Ipê. A PM entrou primeiro. Agressor detido na cozinha. Ela tá consciente, machucada, andando com a gente.',
        unsafe: 'Central, {unit}! O homem veio pra cima da gente com uma faca! Recuamos pra viatura! Cadê a PM?!',
        excess: '{central}, {unit} na Rua Ipê, com a PM. Ela tá machucada, mas consciente e andando. A USB dava conta, {dr}. Mas que bom que alguém entendeu a pizza.',
        late: 'Central, {unit}. A PM entrou primeiro. Ela tá viva, mas apanhou muito enquanto a gente demorava.',
      },
      diary: {
        alive: 'Ligou para a emergência e pediu uma pizza de calabresa. Rua Ipê, 112. A PM levou o agressor da cozinha.',
        dead: 'Ligou para a emergência e pediu uma pizza de calabresa. Ninguém chegou a tempo. Rua Ipê, 112.',
      },
    }),
    // ------------------------------------------------------------------ 3
    call({
      id: 'd08_anticoag',
      ref: 'D8 #3',
      at: '09:20',
      pool: 'trauma_moderado,grave',
      num: '(17) 3321-1100',
      caller: 'Juninho (filho)',
      callerName: 'Juninho',
      type: 'comum',
      voice: 'jovem_h',
      note: 'Filho. Pai caiu da escada, diz que tá bem.',
      noteWrong: 'Idoso caiu, só um galo. Tranquilo.',
      addr: { rua: 'Rua Dom Pedro II', n: 1100, bairro: 'Santa Luzia', ref: 'Sobrado cinza com a escada do lado de fora, cheia de limo.' },
      amb: ['tv', 'chuva'],
      open: [
        '{Dr}, meu pai caiu da escada de fora agora cedo. {{Bateu a cabeça no degrau|bateu_cabeca}}. Ele diz que não foi nada, mas {{acabou de vomitar duas vezes|vomitou}}.',
        'OTÁVIO: Para de exagero, Juninho...',
      ],
      q: {
        oque: 'Escorregou no limo da escada, rolou uns cinco degraus. Levantou sozinho, xingando. Meia hora depois começou a vomitar.',
        consciencia: ['Acordado, mas {{tá com sono, falando devagar|sonolento}}. Ele não é assim.', 'Perguntei que dia é hoje e ele demorou pra responder.'],
        respira: 'Respira normal.',
        idade: 'Oitenta e um.',
        inicio: 'A queda foi umas oito. O vômito agora, nove e pouco.',
        historico: ['Coração. Tem arritmia. {{Toma remédio pra afinar o sangue|anticoagulante}} todo dia.', 'E pressão.'],
        sangramento: 'Um galo grande do lado e {{um corte que não para de pingar|corte_pinga}}. Já troquei o pano duas vezes.',
        paciente: ['OTÁVIO: Tô bem, {dr}... é só... [pausa longa] ...é só uma dor de cabeça.', 'OTÁVIO: Que dia é hoje mesmo?'],
        seguranca: 'Seguro.',
        referencia: 'Sobrado cinza com a escada do lado de fora, cheia de limo.',
      },
      extra: [
        {
          id: 'apagou',
          label: 'Apagou na hora? Dor de cabeça?',
          say: 'Ele apagou na hora da queda? Está com dor de cabeça forte?',
          a: 'Ficou meio zonzo, não sei se apagou. {{A dor de cabeça tá piorando|cefaleia}}, ele falou.',
        },
        {
          id: 'deitado',
          kind: 'fala',
          label: 'Orientar enquanto espera',
          say: 'Deixa ele deitado, com a cabeça um pouco elevada. Se vomitar, vira de lado. Aperta o corte com um pano limpo. Não dá remédio nenhum e não deixa ele levantar.',
          // Conferido (RT9: alteração súbita da consciência + vômitos em anticoagulado → USA; campo A5: comprimir o
          // couro cabeludo; lateral se vomitar).
          a: 'Deitei ele no sofá. Tô apertando o corte. Pai, fica quieto, pai.',
        },
      ],
      links: [
        { a: 'anticoagulante', b: 'bateu_cabeca', insight: 'Idoso que toma remédio para afinar o sangue e bateu a cabeça: risco alto de sangramento dentro do crânio.' },
        { a: 'vomitou', b: 'sonolento', insight: 'Vômitos repetidos e sonolência depois de bater a cabeça, em uso de anticoagulante: trauma craniano de risco. Vermelho → USA.' },
        { a: 'sonolento', b: 'manual:vermelho', insight: 'Rebaixamento da consciência depois de um trauma: vermelho (Manual p.1).' },
      ],
      worsen: [{ after: 80, lines: ['JUNINHO: {Dr}! {{Ele não tá respondendo direito! Tá roncando!|ronco}}', '[um ronco alto e irregular]'] }],
      patient: { name: 'Otávio Cunha', age: 81, sex: 'M' },
      truth: { dx: 'Trauma craniano em idoso anticoagulado (vômitos e sonolência)', sev: 'vermelho', ok: ['USA'], risk: { good: 45, bad: 110 } },
      radio: {
        ok: '{central}, {unit}. Seu Otávio, anticoagulado, sonolento, pupilas iguais. Seguimos Regional pra tomografia. Bem lembrado o remédio, {dr}.',
        under: 'Central, {unit}! Idoso anticoagulado rebaixando, uma pupila maior que a outra! Precisamos de USA!',
        dismissed: 'JUNINHO: {Dr}! Ele não acorda mais! Tá roncando alto! Vocês não iam mandar ninguém?!',
      },
      diary: {
        alive: 'Caiu da escada com limo. Tomava remédio de afinar o sangue: o sangramento na cabeça foi operado a tempo.',
        dead: 'Caiu da escada com limo. Anticoagulado. "Que dia é hoje mesmo?"',
      },
    }),
    // ------------------------------------------------------------------ 4
    call({
      id: 'd08_convulsao',
      ref: 'D8 #4',
      at: '10:30',
      pool: 'grave',
      num: '(17) 99714-1240',
      caller: 'Fabrício (marido)',
      callerName: 'Fabrício',
      type: 'comum',
      voice: 'homem',
      note: 'Marido. Esposa convulsionando faz tempo.',
      noteWrong: 'Marido. Esposa teve convulsão, já parou.',
      addr: { rua: 'Av. Sul', n: 1240, bairro: 'Vila Nova', ref: 'Prédio verde, apartamento 23. O interfone tá quebrado: grita do portão.' },
      amb: ['gritos', 'respiracao'],
      open: [
        'A minha mulher tá {{tendo convulsão|convulsao}} e {{não para|nao_para}}! Já faz {{mais de dez minutos|dez_min}}!',
        '[batidas ritmadas no chão; o homem contando baixinho]',
      ],
      q: {
        oque: 'Ela tem epilepsia. Começou a tremer na cozinha e caiu. Para um pouco e começa de novo, {{sem acordar no meio|sem_acordar}}.',
        inicio: 'Dez e vinte e cinco. Olhei no relógio do micro-ondas. Já são quinze minutos!',
        consciencia: 'Não acorda. Nem no meio, entre uma e outra.',
        respira: 'Tá babando muito, fazendo um barulho. {{Os lábios tão ficando roxinhos|labios_roxos}}.',
        idade: 'Trinta e três.',
        historico: ['Epilepsia desde criança. {{Ficou sem o remédio: acabou no posto faz uma semana|sem_remedio}}.', 'Nunca teve uma tão comprida.'],
        gestacao: 'Grávida? Não, não tá.',
        sangramento: 'Mordeu a língua. Sangue na boca, pouco.',
        paciente: 'Ela não fala! Ela tá tremendo!',
        seguranca: 'Seguro. Tirei as cadeiras.',
      },
      extra: [
        {
          id: 'colher',
          kind: 'fala',
          label: '"Não coloca nada na boca dela!"',
          say: 'Não põe nada na boca dela: nem colher, nem dedo. Protege a cabeça e afasta os móveis.',
          // Conferido (RC7: crise > 5 min sem recuperar entre elas = estado de mal → USA; campo A6: proteger a
          // cabeça, sem medidas intempestivas na boca).
          a: 'Eu ia pôr a colher! A vizinha falou pra pôr a colher! Tá, tá, tirei. Pus a almofada embaixo da cabeça.',
        },
      ],
      links: [
        { a: 'dez_min', b: 'sem_acordar', insight: 'Convulsão há mais de 10 minutos, sem recuperar a consciência entre as crises: estado de mal epiléptico. Vermelho → USA. Não é "convulsão que já passou".' },
        { a: 'sem_remedio', b: 'convulsao', kind: 'confirma', insight: 'Epiléptica sem o remédio há uma semana ("acabou no posto"): crise prolongada.' },
        { a: 'labios_roxos', b: 'manual:vermelho', insight: 'Lábios roxos durante a crise: falta de oxigênio. Vermelho (Manual p.1).' },
      ],
      patient: { name: 'Luciana Prates', age: 33, sex: 'F' },
      truth: { dx: 'Estado de mal epiléptico', sev: 'vermelho', ok: ['USA'], risk: { good: 50, bad: 120 } },
      guide: { id: 'convulsao' },
      radio: {
        ok: '{central}, {unit}. Estado de mal, cedeu com o medicamento na veia. Ela tá dormindo agora. O marido não larga a almofada.',
        under: 'Central, {unit}! Convulsão que não para há vinte minutos, saturando 82! Precisamos de USA!',
        dismissed: 'FABRÍCIO: Não parou! Não parou! Ela tá roxa! Cadê vocês?!',
      },
      diary: {
        alive: 'Epiléptica sem remédio ("acabou no posto"). Crise de vinte minutos. Cedeu na USA.',
        dead: 'Epiléptica sem remédio ("acabou no posto"). A crise não parou.',
      },
    }),
    // ------------------------------------------------------------------ 5 ★ Cida: a queda de verdade
    call({
      id: 'd08_cida',
      ref: 'D8 #5 ★',
      at: '11:30',
      anchor: true,
      num: NUM.cida,
      caller: 'Dona Cida',
      callerName: 'Dona Cida',
      type: 'frequentador',
      voice: 'cida',
      note: 'Dona Cida de novo. Disse que escorregou, mas tá rindo.',
      noteFixed: true,
      addr: ADDR.cida,
      amb: ['silencio', 'agua'],
      noFollowup: true,
      open: [
        'Oi, {meu} {filho}... é a Cida. [{{uma risadinha sem graça|risadinha}}] {{Hoje não é novela, não|nao_novela}}.',
        '{{Escorreguei no banheiro|escorregou}}. Tô sentada no chão aqui. Acho que torci o pulso.',
        '[uma torneira pingando]',
      ],
      q: {
        oque: (c: Ctx) => [
          'Fui pôr o pé pra fora do box e a perna falhou. {{Caí sentada e pus a mão no chão|mao_no_chao}}.',
          c.flag('cida_tapete') ? 'O tapete de borracha... eu ia pedir pra Noêmia comprar na feira de amanhã, {meu} {filho}.' : 'O piso tava molhado. Coisa de velha.',
        ],
        consciencia: 'Acordada, {meu} {filho}. Com dor, mas acordada.',
        respira: 'Respirando. Meio rápido, do susto.',
        idade: 'Setenta e nove.',
        inicio: 'Agora, uns vinte minutos. Demorei pra alcançar o telefone. Vim me arrastando.',
        historico: 'Pressão. {{Remédio de afinar o sangue não tomo, não|sem_anticoag}}.',
        sangramento: 'Não, sangue não. Só roxo.',
        paciente: 'Sou eu mesma, {meu} {filho}. Desculpa.',
        seguranca: 'Seguro. A porta tá trancada... a chave tá na fechadura, por dentro.',
        referencia: 'Casa amarela, portão verde, do lado da Igreja São Benedito. Você sabe.',
        pulso: 'O do braço bom tá batendo ligeiro, {meu} {filho}. Do susto. O do braço ruim eu nem encosto.',
        pele: 'Branca. Branca de susto. E a mão tá ficando roxinha em volta do pulso.',
      },
      extra: [
        {
          id: 'punho',
          label: 'Como está o pulso?',
          say: 'Como está o pulso, Dona Cida? Está torto, inchado? Mexe os dedos?',
          a: ['{{Tá torto, {meu} {filho}. Parece um garfo virado|punho_torto}}.', 'Inchou que nem pão. {{Os dedos mexem, mas dói demais|dedos}}.'],
        },
        {
          id: 'cabeca',
          label: 'Bateu a cabeça? Consegue levantar?',
          say: 'A senhora bateu a cabeça? Consegue levantar sozinha?',
          a: 'Cabeça não bati, não. Levantar... {{tentei duas vezes e não consegui|nao_levanta}}. A perna tá boa, é o braço que não dá pra apoiar.',
        },
        {
          id: 'chave',
          kind: 'fala',
          label: 'Orientar: o braço e a porta',
          say: 'Não tenta levantar sozinha. Deixa o braço quietinho, apoiado no colo. Alguém tem a chave da sua casa?',
          // Conferido (RT6: idosa acima de 70 anos com fratura e dor → USI/USB): imobilizar no colo, não levantar.
          a: 'A Noêmia da frente tem cópia. Vou gritar pela janelinha do banheiro... NOÊMIA! ...Ela ouviu, {meu} {filho}. Tá vindo.',
        },
        {
          id: 'conversar',
          kind: 'fala',
          label: 'Ficar na linha com ela até a ambulância',
          cost: 15,
          say: 'Eu fico aqui com a senhora até a ambulância chegar. Me conta da novela.',
          a: [
            'A novela... [respira fundo] ...a Marta perdoou o Henrique, acredita? Depois de tudo.',
            'Ai, {meu} {filho}. Eu sempre liguei pra nada. E hoje, que é sério, eu fiquei com vergonha de ligar.',
            '{{Vergonha de incomodar|vergonha}}. Quase não liguei.',
          ],
          onAsk: fx.all(fx.add('humanidade', 1, 'conversou com a Dona Cida'), fx.set('cida_conversou_d8')),
        },
      ],
      links: [
        { a: 'punho_torto', b: 'manual:amarelo', insight: 'Idosa, queda com a mão no chão, punho torto "em garfo" e inchado: provável fratura de punho. Amarelo → USB (Manual p.1).' },
        { a: 'nao_novela', b: 'escorregou', insight: 'A Dona Cida não falou da novela. Hoje não é solidão: é uma queda de verdade. O padrão quebrou.' },
        { a: 'nao_levanta', b: 'manual:amarelo', insight: 'Idosa sozinha que não consegue levantar depois da queda: não pode ficar sem atendimento. USB (Manual p.1).' },
      ],
      onAnswer: fx.set('cida_ligou_d8'),
      onStamp: (e) => {
        const d = decisao(e, 'd08_cida');
        if (!d) return;
        if (d.resource === 'USB' || d.resource === 'USA') {
          e.set('cida_queda_regulada');
          e.unset('cida_queda_dispensada');
        } else {
          e.set('cida_queda_dispensada');
          e.unset('cida_queda_regulada');
        }
      },
      patient: { name: 'Aparecida (Dona Cida)', age: 79, sex: 'F' },
      truth: { dx: 'Provável fratura de punho (queda no banheiro)', sev: 'amarelo', ok: ['USB'], risk: { good: 120, bad: 320, needs: 'USB' } },
      radio: {
        ok: 'Central, {unit} na casa da Dona Cida. Fratura de punho, imobilizada. A vizinha abriu a porta. Ela pediu desculpa pela bagunça do banheiro umas dez vezes. Seguimos.',
        excess: '{central}, {unit}. Fratura de punho, estável. A Dona Cida ficou toda prosa de vir a ambulância grande, {dr}. Dava USB.',
      },
      diary: {
        alive: 'Dona Cida, de verdade desta vez. Escorregou no banheiro e quebrou o punho. "Hoje não é novela."',
        ori: 'Dona Cida disse que escorregou no banheiro. Orientada por telefone.',
      },
    }),
    // ------------------------------------------------------------------ 6
    call({
      id: 'd08_petequias',
      ref: 'D8 #6',
      at: '12:40',
      pool: 'pediatria,grave',
      num: '(17) 99288-3105',
      caller: 'Natália (mãe)',
      callerName: 'Natália',
      type: 'comum',
      voice: 'jovem_m',
      note: 'Mãe. Bebê com febre e manchinhas.',
      noteWrong: 'Mãe. Criança com febre, brincando.',
      addr: { rua: 'Rua Pitangueira', n: 3150, bairro: 'Parque das Exposições', ref: 'Conjunto habitacional, bloco C, apartamento 12.' },
      amb: ['choro', 'ventilador'],
      open: [
        'Meu filho tá com {{febre alta desde de manhã|febre}} e apareceram umas {{manchinhas roxas na perna|manchas}}. Antes eram duas, {{agora tá cheio|espalhando}}.',
        '[{{um choro fraco, quase um gemido|choro_fraco}}]',
      ],
      q: {
        oque: 'Acordou quente, eu dei o remédio de febre. Na hora do almoço vi as manchinhas. Achei que era mosquito.',
        consciencia: '{{Tá molinho, só quer ficar deitado|molinho}}. Não quis nem a mamadeira. Ele não é assim.',
        respira: 'Respira rapidinho.',
        idade: 'Dois anos.',
        inicio: 'A febre, desde as sete. As manchas, faz uma hora.',
        historico: 'Nada. A vacina... acho que atrasou uma, com a mudança.',
        sangramento: 'Não. Só as manchas.',
        paciente: ['[um gemido fraquinho]', 'Ele nem chora direito, {dr}.'],
        seguranca: 'Seguro.',
        referencia: 'Conjunto habitacional, bloco C, apartamento doze.',
      },
      extra: [
        {
          id: 'copo',
          label: 'Teste do copo nas manchas',
          say: 'Pega um copo de vidro liso e aperta em cima de uma mancha. Ela some ou continua aparecendo através do vidro?',
          // Conferido (RC6/RC7/RC14: "erupção cutânea fixa ou púrpura" → USA; teste do copo = mancha que não some à pressão).
          a: '[pausa] ...{{Continua. Continua roxinha através do vidro|nao_some}}. Ai, meu Deus, o que é isso?',
        },
        { id: 'maos', label: 'Mãos e pés?', say: 'Como estão as mãos e os pés dele? Quentes ou gelados?', a: '{{Gelados|maos_frias}}, mesmo com a febre. A boquinha tá meio pálida.' },
      ],
      links: [
        { a: 'nao_some', b: 'febre', insight: 'Febre com manchas roxas que não somem sob o vidro: suspeita de meningococcemia. Vermelho → USA, sem demora.' },
        { a: 'molinho', b: 'manual:vermelho', insight: 'Criança febril, molinha, recusando a mamadeira, com mãos frias: sinais de gravidade. Vermelho (Manual p.1).' },
        { a: 'espalhando', b: 'manchas', kind: 'confirma', insight: 'Manchas que se espalham em uma hora: o quadro está evoluindo rápido.' },
      ],
      patient: { name: 'Heitor', age: 2, sex: 'M' },
      truth: { dx: 'Suspeita de meningococcemia', sev: 'vermelho', ok: ['USA'], risk: { good: 50, bad: 120 } },
      radio: {
        // a lista de medicações da USA (campo C) não tem antibiótico: ele começa no hospital
        ok: '{central}, {unit}. Petéquias e púrpura, mal perfundido. Acesso na veia, soro correndo. Regional avisado: antibiótico na porta. Boa pegada, {dr}.',
        under: 'Central, {unit}! Criança em choque com púrpura! Precisamos de USA, agora!',
        dead: 'Central... {unit}. Óbito às {hora}. (pausa longa) Sem mais, Central.',
        dismissed: 'NATÁLIA: Ele não acorda direito! As manchas tão no corpo todo agora! Pelo amor de Deus!',
      },
      diary: {
        alive: 'Febre e manchas que não sumiam no copo de vidro. Meningococcemia, antibiótico a tempo.',
        dead: 'Heitor, 2 anos. Febre e manchas que não sumiam no copo de vidro.',
      },
    }),
    // ------------------------------------------------------------------ 7
    call({
      id: 'd08_diarreia',
      ref: 'D8 #7',
      at: '14:00',
      pool: 'leve',
      num: '(17) 3328-0640',
      caller: 'Rayssa (neta)',
      callerName: 'Rayssa',
      type: 'comum',
      voice: 'jovem_m',
      note: 'Neta. Avó com diarreia.',
      noteWrong: 'Neta. Avó desidratada, fraca.',
      addr: { rua: 'Rua São João', n: 640, bairro: 'Vila Nova', ref: 'Casa com as samambaias na varanda.' },
      amb: ['tv', 'passaros'],
      open: ['Oi, boa tarde. Minha avó tá com {{diarreia faz dois dias|dois_dias}}. Ela é teimosa, não quer ir no médico. Fiquei com medo dela desidratar.'],
      q: {
        oque: 'Comeu um pastel na feira de sábado. Desde domingo tá indo no banheiro umas cinco vezes por dia.',
        consciencia: 'Acordadíssima, reclamando de mim.',
        respira: 'Normal.',
        idade: 'Setenta e sete.',
        inicio: 'Desde domingo de manhã.',
        historico: 'Pressão. Toma remédio. De fazer xixi, não toma.',
        sangramento: '{{Sangue não. Nem catarro|sem_sangue}}. Eu olhei, ela ficou brava.',
        paciente: ['TEREZA: Tô ótima, menina. {{Tô tomando o soro que a farmácia deu, olha a garrafa aqui|soro}}.', 'TEREZA: O problema é essa minha neta, que fez um semestre de enfermagem.'],
        seguranca: 'Seguro.',
      },
      extra: [
        {
          id: 'xixi',
          label: 'Bebe? Urina? Tontura?',
          say: 'Ela está bebendo bem? Fazendo xixi normal? Tem tontura quando levanta, boca seca, confusão?',
          a: '{{Bebe, faz xixi normal|bebe_urina}}. Levanta sozinha pra ir no banheiro, toda hora, aliás. Tontura não.',
        },
        {
          id: 'febre',
          label: 'Febre? Vômito? Dor forte?',
          say: 'Tem febre alta, vômito que não para ou dor forte na barriga?',
          a: 'Febre não, medi agora: trinta e seis e oito. Vômito não. Uma cólica antes de ir no banheiro, só.',
        },
        {
          id: 'orientar',
          kind: 'fala',
          label: 'Orientar',
          say: 'Mantém o soro aos golinhos, comida leve, e leva ela na UBS amanhã. Se aparecer sangue, febre, se ela parar de fazer xixi, ficar confusa ou tonta, liga na hora.',
          // Conferido (RC11: sem sangue, sem desidratação, sem vômitos persistentes → orientação; sinais para religar).
          a: 'TEREZA (ao fundo): Viu? Eu falei que tava tudo bem! ...Tá bom, {dr}. Amanhã eu levo ela na UBS. Nem que seja arrastada.',
        },
      ],
      links: [
        { a: 'bebe_urina', b: 'soro', kind: 'confirma', insight: 'Bebendo bem, fazendo xixi, sem tontura e tomando soro: hidratada. Diarreia não é, sozinha, desidratação.' },
        { a: 'dois_dias', b: 'manual:verde', insight: 'Diarreia sem sangue, sem febre e sem sinais de desidratação: verde. Orientação e UBS (Manual p.1).' },
      ],
      patient: { name: 'Tereza Siqueira', age: 77, sex: 'F' },
      truth: { dx: 'Diarreia aguda sem desidratação', sev: 'verde', ok: ['ORI'], ref: ['UBS', 'CASA'] },
      radio: { excess: 'Central, {unit}. A Dona Tereza tá ótima, {dr}. Expulsou a gente da varanda e mandou levar a neta.' },
      diary: { ori: 'Diarreia depois de um pastel de feira. Bebendo, hidratada. Teimosa.' },
    }),
    // ------------------------------------------------------------------ 8
    call({
      id: 'd08_choque',
      ref: 'D8 #8',
      at: '15:20',
      pool: 'trauma_moderado',
      num: '(17) 99566-1650',
      caller: 'Valter (colega de trabalho)',
      callerName: 'Valter',
      type: 'testemunha',
      voice: 'homem',
      note: 'Colega. Eletricista levou choque, acordado.',
      noteWrong: 'Choque elétrico, homem desmaiado!',
      addr: { rua: 'Rua Minas Gerais', n: 1650, bairro: 'Distrito Industrial', ref: 'Casa de muro amarelo, a caminhonete da firma tá na porta.' },
      amb: ['cachorro', 'rua'],
      open: [
        '{m:Moço|Moça}, meu colega {{levou um choque|choque}} mexendo no quadro de luz de uma casa! Foi jogado pra trás! {{Ele tá acordado|acordado}}, mas {{a mão tá queimada|mao_queimada}}!',
        '[um homem gemendo; um cachorro latindo]',
      ],
      q: {
        oque: 'Ele tava trocando um disjuntor e encostou no barramento. Pá! Caiu sentado.',
        consciencia: 'Acordado. Ficou {{meio grogue uns segundos|grogue}}, agora tá falando normal.',
        respira: 'Normal.',
        idade: 'Quarenta e um.',
        inicio: 'Agora, dez minutos.',
        historico: 'Nada. Fuma.',
        sangramento: 'Não sangra. A palma da mão tá {{com uma marca preta, tipo um furinho queimado|marca_entrada}}.',
        dorpeito: 'Diz que {{o coração tá normal, sem dor no peito|coracao_ok}}.',
        paciente: ['CÍCERO: Tô bem, tô bem... só a mão que arde. {{E o pé esquerdo formigou|pe_formigou}}.', 'CÍCERO: Tem uma marquinha queimada na sola da bota, olha.'],
        seguranca: '{{Desliguei o disjuntor geral|desligou}}. Ninguém mais encosta em nada.',
        referencia: 'Casa de muro amarelo. A caminhonete da firma tá na porta.',
      },
      extra: [
        {
          id: 'voltagem',
          label: 'Que rede? Alta tensão?',
          say: 'Foi na rede da casa, 127 ou 220? Ou foi fio de poste, alta tensão?',
          a: '{{Da casa, 220|rede_220}}. Do poste não, Deus me livre.',
        },
        {
          id: 'agua_fria',
          kind: 'fala',
          label: 'Orientar a queimadura',
          say: 'Água corrente fria na mão, uns dez a vinte minutos. Não passa pasta, pomada nem manteiga. Cobre com um pano limpo e deixa ele sentado, quieto.',
          // Conferido (RT7: queimadura elétrica → USI/USB; campo A10: resfriar até 20 min, cobrir com pano limpo).
          a: 'Água na mão... tá. CÍCERO: Ai, que alívio. ...Pasta de dente eu ia passar, sim.',
        },
      ],
      links: [
        { a: 'marca_entrada', b: 'pe_formigou', insight: 'Marca de entrada na mão e formigamento no pé: a corrente atravessou o corpo. Precisa de avaliação e eletrocardiograma. USB.' },
        { a: 'acordado', b: 'coracao_ok', kind: 'confirma', insight: 'Consciente, sem dor no peito, coração normal, rede de 220: choque moderado. USB, não USA.' },
        { a: 'desligou', b: 'manual:cena', kind: 'confirma', insight: 'Energia desligada no disjuntor geral: a cena está segura para a equipe (Manual p.4).' },
      ],
      patient: { name: 'Cícero Bastos', age: 41, sex: 'M' },
      truth: { dx: 'Choque elétrico (220 V) com queimadura na mão', sev: 'amarelo', ok: ['USB'], risk: { good: 110, bad: 280, needs: 'USB' } },
      radio: {
        ok: 'Central, {unit}. Choque de 220, queimadura de entrada na mão e de saída no pé. Eletro normal. Seguimos.',
        excess: '{central}, {unit}. Choque de 220, consciente, eletro normal, {dr}. A USB fazia.',
      },
      diary: { alive: 'Eletricista, choque de 220 no quadro de luz. Entrada na mão, saída no pé. Eletro normal.' },
    }),
    // ------------------------------------------------------------------ 9 (o espelho da pizza)
    call({
      id: 'd08_trote',
      ref: 'D8 #9',
      at: '16:40',
      pool: 'trote',
      num: '(17) 99450-1212',
      caller: 'Voz de adolescente',
      type: 'trotista',
      voice: 'adolescente',
      note: 'Pedindo pizza. Voz baixa.',
      noteWrong: 'Mulher pedindo pizza de novo. Voz baixa. Igual a de manhã.',
      // 1.1 (trotes-folgados.md): difícil, sem risada — o espelho da Rosângela. Voz baixinha, mas a festa ao fundo
      // NÃO para, ninguém grita com ninguém, e a pergunta de perigo vira piada. A mesma senha não é a mesma ligação.
      addr: { rua: 'Rua dos Bem-te-vis', n: 2400, bairro: 'Bela Vista' },
      amb: ['festa', 'musica'],
      open: [
        { t: 'Oi... {{é da pizzaria?|pizzaria}} Queria uma {{calabresa grande. Com borda recheada|calabresa_trote}}.', style: 'sussurro' },
        '[{{ao fundo, uma festa: música alta, conversa, uma panela batendo. Ninguém grita com ninguém. A música não para nem um segundo|gargalhadas}}]',
      ],
      q: {
        oque: [{ t: 'A pizza. Calabresa. E um refri de dois litros.', style: 'sussurro' }],
        consciencia: [{ t: 'Sim. Acordadíssima.', style: 'sussurro' }],
        respira: [{ t: 'Respirando... o cheiro da pizza que não chega.', style: 'sussurro' }],
        idade: [{ t: 'O troco é pra... dezoito. Não. Quinze.', style: 'sussurro' }],
        seguranca: [{ t: 'Seguro... só a fome.', style: 'sussurro' }, '[a música sobe; alguém canta junto o refrão]'],
        referencia: [{ t: 'Do lado da... casa do lado.', style: 'sussurro' }],
        pulso: [{ t: 'O meu? Tá bom. Tá ótimo, na verdade.', style: 'sussurro' }],
        pele: [{ t: 'Morena. Bronzeada. É do clube.', style: 'sussurro' }],
        paciente: ['[outra voz, longe: "pede de frango também!"]', { t: 'Sou eu. A pizza é pra todo mundo.', style: 'sussurro' }],
      },
      extra: [
        {
          id: 'perigo',
          label: '"Você está em perigo? Responda só sim ou não."',
          say: 'Você está em perigo? Responda só sim ou não.',
          a: [{ t: '{{Perigo? Só se a pizza atrasar.|perigo_piada}}', style: 'sussurro' }, '[alguém do lado: "desliga, desliga, é a ambulância de verdade!"]', '[desliga]'],
        },
      ],
      callback: ['[{{caixa postal: "Fala aí, aqui é o Kauê, manda áudio!"|retorno_caixa_kaue}}]'],
      links: [
        { a: 'pizzaria', b: 'gargalhadas', insight: 'Pedido de pizza na linha de emergência com gargalhadas, música e várias vozes: trote. Compare com a ligação da manhã: lá era sussurro e um homem gritando.' },
        { a: 'perigo_piada', b: 'manual:trote_sinais', insight: 'Até a pergunta de perigo virou piada, com risadas ao fundo: trote (Manual p.2).' },
        { a: 'retorno_caixa_kaue', b: 'num', insight: 'Ligar de volta: caixa postal de um adolescente.' },
      ],
      patient: { name: '"Pedido de pizza"' },
      truth: { dx: 'Trote (pedido de pizza)', sev: 'trote', ok: ['TROTE'], prankKind: 'trote' },
      radio: { prank: 'Central, {unit}. A Rua dos Bem-te-vis acaba no 2199, {dr}. Não tem pizza, não tem ninguém. Era trote.' },
    }),
  ],
  // 19:00 — o Henrique chega 30 minutos atrasado (lido na passagem de turno do D9).
  endScene: () => ({
    id: 'd08_henrique',
    bg: 'central',
    cast: ['SIMONE', 'HENRIQUE'],
    nodes: {
      start: {
        lines: [
          { who: 'NARRADOR', t: '19:00. A cadeira do noturno está vazia. O telefone toca. A Simone veste o casaco devagar, olhando pra você.' },
          { who: 'SIMONE', t: 'O Henrique, {dr}. De novo.' },
          // flags.md: avisou_sarau (eco imediato)
          { who: 'NARRADOR', t: 'Ela tira o casaco de novo e pendura o seu nas costas da sua cadeira.', when: is.flag('avisou_sarau') },
          { who: 'SIMONE', t: 'Avisou, vai. Eu seguro o Henrique. Eu fico até ele chegar.', when: is.flag('avisou_sarau') },
        ],
        choices: [
          { label: 'Ir agora. (A Simone fica.)', next: 'foi', when: is.flag('avisou_sarau') },
          { label: 'Esperar o Henrique.', next: 'espera', when: is.flag('avisou_sarau') },
        ],
        next: 'espera',
      },
      foi: {
        onEnter: fx.all(fx.set('simone_segurou_d8'), fx.set('d8_henrique_registrado'), fx.add('lealSimone', 1, 'a Simone segurou o noturno')),
        lines: [
          { who: 'NARRADOR', t: '19:04. Você sai correndo para o ponto, de jaleco ainda.' },
          { who: 'NARRADOR', t: 'Amanhã, na folha da passagem, vai estar escrito na letra redonda da Simone: "Henrique — 19:32". Ela não vê nada. Mas assina o que vê.' },
        ],
      },
      espera: {
        lines: [
          { who: 'NARRADOR', t: '19:10. 19:20. Você atende mais duas ligações que já não eram suas. O sarau do Liam é às oito.' },
          { who: 'NARRADOR', t: '19:32. A porta abre. Henrique, cabelo molhado, bala de menta na boca. O cheiro de menta é forte demais. Tem outra coisa por baixo.' },
          { who: 'HENRIQUE', t: 'Foi mal, foi mal, {nome}. Pneu furado na Beira-Rio.' },
          { who: 'HENRIQUE', t: '(baixinho) Faz um favor? Assina a passagem às sete em ponto. O Peixoto tá contando minuto. Mais um atraso e é advertência. Eu te devo uma.' },
          { who: 'HENRIQUE', t: 'A Rose já sabe, né? Você contou pra ela no almoço. (ele sorri sem sorrir) Assina 19:00 pra mim assim mesmo?', when: (c) => c.val('rose_ponto_henrique') === 'falou' },
        ],
        choices: [
          {
            label: 'Assinar "19:00". "Vai. Mas se cuida, Henrique."',
            next: 'cobriu',
            effect: fx.all(fx.set('henrique_coberto'), fx.add('desgaste', 5, 'cobriu o Henrique'), fx.add('lealHenrique', 1, 'cobriu o Henrique')),
          },
          { label: 'Assinar "19:32". "Não dá, Henrique. Meu filho tá me esperando."', next: 'nao', effect: fx.all(fx.set('d8_henrique_registrado'), fx.set('d8_saiu_pelo_filho')) },
        ],
      },
      cobriu: {
        lines: [
          { who: 'HENRIQUE', t: 'Você é dos meus, {nome}.' },
          { who: 'NARRADOR', t: 'Ele aperta o seu ombro. A mão dele está gelada e treme um pouco. Você escreve "19:00" com a sua letra.' },
          { who: 'SIMONE', t: '(saindo, sem olhar pra trás) Eu não vi nada. Eu nunca vejo nada.' },
        ],
      },
      nao: {
        lines: [
          { who: 'HENRIQUE', t: '...Tá. Tá certo. (ele pega a caneta e não olha mais pra você)' },
          { who: 'NARRADOR', t: 'Você escreve "19:32" na passagem de turno. A letra sai mais firme do que você esperava.' },
          { who: 'SIMONE', t: '(segurando a porta pra você) Vai, {dr}. Corre. Boa apresentação pro menino.' },
        ],
      },
    },
  }),
  interlude: {
    teaser: 'Hoje é o sarau da escola. O Liam vai ler a redação às oito.',
    familyLacos: 1,
    onBico: fx.add('lacos', -2, 'perdeu a apresentação do Liam'),
    scene: (c) => ({
      id: 'd08_sarau',
      bg: 'escola',
      cast: ['DAVI', 'MARCIA', 'LUCIA', 'ZELIA'],
      nodes: {
        start: {
          lines: [
            { who: 'NARRADOR', t: 'Quadra da E.M. Monteiro Lobato, oito da noite. Cadeiras de plástico, um ventilador de teto que não dá conta, cheiro de pipoca.' },
            { who: 'NARRADOR', t: 'Você chega correndo, ainda de jaleco, na hora em que chamam o 3º B. {Oconj} guardou uma cadeira {c:com a bolsa|com a mochila}. A Dona Zélia guardou outra com o próprio corpo.' },
            { who: 'MARCIA', t: 'E agora, o Liam, do 3º B, com a redação "O que {m:meu pai|minha mãe} faz".' },
            { who: 'DAVI', t: '{m:Meu pai|Minha mãe} é {medico}, mas não usa estetoscópio. Usa um telefone.' },
            { who: 'DAVI', t: 'Quando alguém liga pra emergência, primeiro atende a tia Simone, depois {m:meu pai|minha mãe}. {m:Ele|Ela} pergunta: o que aconteceu? Tá respirando? Desde que horas?' },
            { who: 'DAVI', t: 'Aí {m:ele|ela} manda a ambulância grande ou a pequena. A grande tem médico dentro. A pequena tem maca e um moço legal. Às vezes não manda nenhuma, e a pessoa fica brava. Mas é porque outra pessoa precisa mais.' },
            { who: 'DAVI', t: redacaoChoro(c) },
            { who: 'DAVI', t: 'Quando eu crescer, eu quero dirigir a ambulância grande, porque aí eu chego lá e vejo se deu certo. {m:Meu pai|Minha mãe} nunca vê. Fim.' },
            { who: 'NARRADOR', t: 'Um segundo de silêncio. Depois, as palmas. {Oconj} está chorando e fingindo que não.' },
          ],
          choices: [
            { label: 'Aplaudir de pé.', next: 'palmas', affectionate: true, effect: fx.add('lacos', 1, 'a redação do Liam') },
            { label: 'Ficar sentad{m:o|a}, sem conseguir falar.', next: 'palmas' },
          ],
        },
        palmas: {
          lines: [
            { who: 'DAVI', t: '(correndo até você) Você ouviu? Você ouviu a parte da ambulância grande?' },
            { who: 'ZELIA', t: '(no ouvido {doconj}, alto demais) "Ar-condicionado não faz ninguém chorar." Esse menino é meu neto, viu?', when: (cc) => cc.val<string>('d5_resposta_davi') === 'ar' },
            { who: 'ZELIA', t: '(alto demais) Puxou a avó. Eu também escrevia bonito.', when: (cc) => cc.val<string>('d5_resposta_davi') !== 'ar' },
            { who: 'NARRADOR', t: 'A professora se aproxima, abanando o rosto com a lista de chamada.' },
          ],
          next: 'marcia',
        },
        marcia: {
          onEnter: fx.set('marcia_alergia'),
          lines: [
            { who: 'MARCIA', t: 'Você é {m:o pai|a mãe} do Liam! Márcia Albuquerque. Mas aqui todo mundo me chama de tia.' },
            { who: 'MARCIA', t: 'Foi a redação mais bonita da turma. Ele tem muito orgulho de você, sabia?' },
            { who: 'LUCIA', t: 'Aceita um brigadeiro, professora? A Dona Zélia fez.' },
            { who: 'MARCIA', t: '(rindo) Brigadeiro eu aceito. Só não me oferece nada com mel, que eu sou alérgica a tudo. Até a picada de abelha.' },
            { who: 'MARCIA', t: 'E lá em casa tem um pé de manga que vive cheio de abelha. O Marcos quer cortar, eu não deixo. Árvore não tem culpa.' },
          ],
          choices: [
            { label: '"A senhora anda com caneta de adrenalina?"', next: 'caneta' },
            { label: '"Obrigad{m:o|a} por cuidar dele, professora."', next: 'bilhete' },
          ],
        },
        caneta: {
          onEnter: fx.set('marcia_caneta_alerta'),
          lines: [
            { who: 'MARCIA', t: '(surpresa) Olha só, {medico} mesmo! Tenho uma, que a alergista deu... faz tempo. Tá numa gaveta lá em casa. Nem sei se tá na validade.' },
            { who: 'MARCIA', t: 'Faz tanto tempo que não acontece nada que eu esqueço que ela existe. Vou olhar, prometo.' },
          ],
          next: 'bilhete',
        },
        bilhete: {
          onEnter: fx.set('foi_apresentacao'),
          lines: [
            { who: 'NARRADOR', t: 'Ela tira um papel dobrado do bolso do casaquinho e entrega pra você.' },
            { who: 'MARCIA', t: 'Escrevi pra você. Pra ler depois, com calma.' },
            { who: 'NARRADOR', t: '"O Liam leu a redação mais bonita da turma. Ele tem muito orgulho de você. — Tia Márcia, 3º B (Márcia Albuquerque Reis)." Você guarda no bolso do jaleco.' },
          ],
          next: 'fim',
        },
        fim: {
          lines: [
            { who: 'DAVI', t: '{Pai}, amanhã você vai salvar mais gente?' },
            { who: 'EU', t: 'Vou tentar, filho.' },
            { who: 'NARRADOR', t: 'Na volta pra casa, ele dorme no ônibus com a cabeça no seu braço. Você não se mexe a viagem inteira.' },
          ],
        },
      },
    }),
    bico: {
      id: 'd08_bico',
      bg: 'cozinha',
      cast: ['LUCIA'],
      nodes: {
        start: {
          onEnter: fx.set('marcia_alergia'),
          lines: [
            { who: 'NARRADOR', t: 'Às oito da noite, enquanto a ambulância da noite corta a Av. Brasil de sirene ligada, o Liam lê a redação numa quadra cheia de cadeiras de plástico.' },
            { who: 'NARRADOR', t: 'Às sete e meia você tinha dito ao Henrique que o seu filho estava esperando. A Simone segurou a porta pra você. "Corre." ...Pra ambulância, Simone. Não pra escola.', when: is.flag('d8_saiu_pelo_filho') },
            { who: 'NARRADOR', t: 'A Simone ficou na sua cadeira até o Henrique chegar, para você ir à escola. Você foi para a ambulância.', when: is.flag('simone_segurou_d8') },
            { who: 'NARRADOR', t: 'Quando você chega, de madrugada, {oconj} está {c:acordada|acordado} na cozinha.' },
            { who: 'LUCIA', t: 'Ele procurou você na plateia. Duas vezes. Depois parou de procurar.' },
            { who: 'LUCIA', t: 'A redação era sobre você. "O que {m:meu pai|minha mãe} faz". Ele leu inteirinha, sem gaguejar. No final ele disse que você nunca vê se deu certo.' },
            { who: 'LUCIA', t: 'A professora dele, a tia Márcia, pediu pra te entregar um bilhete. Pus no bolso do seu jaleco.' },
            { who: 'LUCIA', t: 'Simpática ela. Alérgica a tudo, coitada. Até a picada de abelha. Recusou o bolo de mel da sua mãe.' },
            { who: 'NARRADOR', t: 'No bolso do jaleco, um papel dobrado: "O Liam leu a redação mais bonita da turma. Ele tem muito orgulho de você. — Tia Márcia, 3º B (Márcia Albuquerque Reis)."' },
          ],
        },
      },
    },
  },
});
