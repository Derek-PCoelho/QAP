// =============================================================================
// DIA 6 — "O Lado do Rosto" (Manual p.6: FAST, janela de 4h30, "acordou assim",
// hipoglicemia). Sábado.
// ⚖ O AVC das 07:40 "acordou com a boca torta": a pergunta "Desde que horas?"
// revela que ele foi visto bem às 05:00. A verdade é calculada pelo relógio:
// até 09:30 (4h30 desde as 05:00) é USA (USB ⚖, ver RC1 abaixo); depois, USB.
// Contra-armadilha: fala enrolada de cachaça, FAST normal (USB).
// ★ A menina de 7 anos com a mãe em hipoglicemia (ensina os sinais da Zélia no D10).
// Fios: 🌱 Seu Jairo e o recibo (D16), 🌱 Cida aprende o FAST (D19),
// geladeira quebrada e a insulina da Dona Zélia.
// =============================================================================
import type { Ctx, Decision, ShiftScriptCtx, TimelineDef, TruthDef, UnitState } from '../../engine/types';
import { hm, fmtTime, fmtDur } from '../../engine/util';
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
// AVC das 07:40: visto bem pela última vez às 05:00 (foi ao banheiro e falou com a esposa).
// -----------------------------------------------------------------------------
const VISTO_BEM = hm('05:00');
const JANELA = 270; // 4h30
const agora = (c: Ctx) => c.s.shift?.time ?? hm('07:40');
const naJanela = (c: Ctx) => agora(c) - VISTO_BEM <= JANELA;

// RC1 (AVC): assimetria facial, fraqueza de um lado e fala alterada são discriminadores de USI/USB; USA só com
// Glasgow < 9, convulsão ou suporte ventilatório. Na janela, o jogo prefere USA (Manual p.6, tempo até a
// trombólise) e aceita USB (⚖); a USB que chega é cuidado adequado (risk.needs USB): o tratamento é no hospital.
const avcTruth = (c: Ctx): TruthDef =>
  naJanela(c)
    ? { dx: 'AVC isquêmico ("acordou assim"; visto bem às 05:00)', sev: 'vermelho', ok: ['USA', 'USB'], best: 'USA', must: ['inicio', 'fast'], risk: { good: 60, bad: 140, needs: 'USB' } }
    : { dx: 'AVC isquêmico ("acordou assim"; visto bem às 05:00)', sev: 'amarelo', ok: ['USB'], must: ['inicio', 'fast'] };

const janelaInsight = (c: Ctx) => {
  const t = agora(c);
  const passou = fmtDur(t - VISTO_BEM);
  return naJanela(c)
    ? `Visto bem pela última vez às 05:00, quando falou normal com a esposa. Agora são ${fmtTime(t)}: ${passou} desde então. Dentro da janela de 4h30 → USA → Regional (Manual p.6).`
    : `Visto bem pela última vez às 05:00. Agora são ${fmtTime(t)}: ${passou} desde então. Fora da janela de 4h30 → USB (Manual p.6).`;
};

export const DAY = day({
  day: 6,
  title: 'O Lado do Rosto',
  weekday: 'Sábado',
  weather: 'Céu limpo, 30 °C. Ventania à tarde.',
  newspaper: (c) => {
    const meta = c.flag('d5_meta_batida');
    const academia = noDiario(c, 'd05_academia');
    return {
      headline: meta ? 'Central de Regulação bate a meta no primeiro dia de corte' : 'Regulação "estoura" a meta no primeiro dia de corte, diz OS',
      sub: meta
        ? 'Saúde+ Gestão comemora "só duas viaturas avançadas em doze horas". O sindicato pede os relatórios do dia.'
        : '"Faltou consciência de custo", afirma a Saúde+ Gestão. Reguladores falam em "um dia normal de trabalho".',
      photo: 'central',
      stories: [
        academia === 'vivo'
          ? { title: 'Aluna salva dono de academia com massagem cardíaca', text: 'Estudante de enfermagem fez compressões até a chegada da USA, orientada por telefone. "Contei até perder a voz", disse.' }
          : academia === 'morto'
            ? { title: 'Dono de academia morre após mal súbito na esteira', text: 'Alunos fizeram massagem até a chegada da ambulância. A Academia Força Total fecha por três dias. A matrícula grátis foi suspensa.' }
            : { title: 'Manhã de susto em academia da Santos Dumont', text: 'O dono passou mal na esteira e foi levado ao Regional. A academia não quis comentar.' },
        { title: 'Vereador promete "UTI móvel" para idosos', text: 'Arlindo Matos, o "Amigo da Saúde", quer uma ambulância avançada "só para a terceira idade da Bela Vista". A Câmara ainda não discutiu de onde sai o dinheiro.' },
        { title: 'Andaime cede em obra do Distrito Industrial', text: 'Um pedreiro caiu de seis metros. A obra foi embargada para perícia. A tábua estava podre, segundo os colegas.' },
      ],
      notice: 'Nova página no Manual: 6 (AVC — teste FAST, janela de 4h30, "acordou assim", hipoglicemia).',
      ad: 'JAIRO REFRIGERAÇÃO — Geladeira, freezer e ar-condicionado. Atendimento a domicílio, inclusive fim de semana. Rua Quaresmeira, 1720.',
      weather: 'Sol e ventania · 30 °C',
    };
  },
  handover: () => ({
    id: 'd06_passagem',
    bg: 'central',
    cast: ['HENRIQUE'],
    nodes: {
      start: {
        lines: [
          { who: 'NARRADOR', t: '07:00. Sábado. A central cheira a café velho e a bala de menta.' },
          { who: 'HENRIQUE', t: 'Sábado, {nome}. Dia de AVC e de cachaça. Às vezes os dois na mesma pessoa. Às vezes um fingindo que é o outro.' },
          { who: 'HENRIQUE', t: 'Dica de quem já errou: quando disserem "acordou assim", pergunta a última vez que alguém viu ele bem. Quase nunca é a hora que acordou.' },
          { who: 'NARRADOR', t: 'Ele fala olhando para a porta, as mãos enfiadas nos bolsos do jaleco.' },
        ],
      },
    },
  }),
  timeline: [
    { at: '07:01', kind: 'radio', who: 'USA 01 · BENÉ', text: 'Central, USA 01 em QRV. Sábado de sol, {bene}. Dia de churrasco, de cachaça e de vô caindo da laje.' },
    { at: '09:40', kind: 'simone', who: 'SIMONE', text: 'Sábado eu trago bolo de fubá, {dr}. Tá na gaveta de baixo. Não conta pro Peixoto que a gaveta é patrimônio da OS.' },
    {
      at: '11:05',
      kind: 'simone',
      who: 'CELULAR · DR. PEIXOTO',
      text: (c) =>
        c.flag('d5_meta_batida')
          ? '"Bom dia, equipe! Ontem a Central bateu a meta. A diretoria elogiou. Sábado é dia de foco!"'
          : '"Bom dia, equipe. Ontem o painel fechou no vermelho. A diretoria perguntou. Sábado é dia de foco."',
    },
    vigiaNoLocal('vigia_avc', '07:45', 'd06_avc', (c, u) => {
      c.request(
        u.radioName,
        `Central, ${u.label} na casa do Seu Ademir. A esposa quer levar ele pro São Lucas, o hospital particular do convênio dela. O São Lucas não tem neurologista de sábado. O Regional tem tomografia e neuro de plantão.`,
        [
          {
            id: 'regional',
            label: 'Regional: explicar à família que tempo é cérebro (5 min)',
            cost: 5,
            effect: (s) => s.set('d6_avc_regional'),
            reply: 'Ela entendeu. "Se é o melhor pra ele, vai." Seguimos Regional, Central.',
          },
          {
            id: 'convenio',
            label: 'Atender a família: São Lucas',
            effect: (s) => s.set('d6_avc_convenio'),
            reply: 'Entendido, São Lucas. ...Deus nos ajude, Central.',
          },
        ],
        'regional',
        6,
      );
    }),
    {
      at: '16:30',
      kind: 'script',
      id: 'simone_menina',
      run: (c) => {
        if (c.flag('hipo_mae_salva')) {
          c.modal('SIMONE', 'A menina da injeção na barriga, {dr}... a Joana contou que ela abriu a porta com a chave numa mão e o telefone na outra. Sete anos.', 'simone');
        } else if (c.flag('hipo_mae_morreu') && c.flag('d6_hipo_dispensada')) {
          c.modal('SIMONE', 'Eu também achei que era trote, {dr}. A menina. Por dois segundos, eu também achei.', 'simone');
        }
      },
    },
    { at: '18:30', kind: 'radio', who: 'USB 03 · LIA', text: 'Central, USB 03 recolhendo. Sábado de boca torta. Bom descanso, {dr}.' },
  ],
  calls: [
    // ------------------------------------------------------------------ 1
    call({
      id: 'd06_tontura',
      ref: 'D6 #1',
      at: '07:15',
      pool: 'leve',
      num: '(17) 99281-1820',
      caller: 'Camila (a própria)',
      callerName: 'Camila',
      type: 'comum',
      voice: 'jovem_m',
      note: 'Moça com tontura. Calma.',
      noteWrong: 'Moça desmaiou, diz que caiu no corredor.',
      addr: { rua: 'Rua Padre Anchieta', n: 1820, bairro: 'Centro', ref: 'Edifício Solar, apartamento 52.' },
      amb: ['ventilador', 'rua'],
      open: ['Oi, bom dia... desculpa ligar. Eu levantei da cama rápido e {{ficou tudo escuro|escuro}}. Sentei no chão do corredor. É normal isso?'],
      q: {
        oque: 'Acordei, levantei de uma vez pra desligar o despertador e a vista apagou. Sentei antes de cair. Agora passou um pouco.',
        consciencia: 'Acordada. {{Não desmaiei, não|nao_desmaiou}}. Só sentei antes.',
        respira: 'Normal.',
        idade: 'Trinta.',
        inicio: 'Agora, quando eu levantei. Uns dez minutos.',
        historico: 'Nada. Tô de dieta. {{Ontem só tomei um suco no jantar|comeu_pouco}}.',
        sangramento: 'Não. Menstruação normal, acabou semana passada.',
        dorpeito: 'Dor no peito não. O coração tá normal, acho.',
        fast: 'Sorri, levantei os dois braços... "o céu é azul". Tudo normal, {dr}.',
        paciente: 'Sou eu mesma.',
        seguranca: 'Seguro. Moro sozinha, com a gata.',
      },
      extra: [
        {
          id: 'palpitacao',
          label: 'Desmaiou? Palpitação? Bateu a cabeça?',
          say: 'Você chegou a desmaiar? Sentiu o coração disparar? Bateu a cabeça?',
          a: 'Não, não. Sentei antes. O coração tá normal agora. Não bati em nada.',
        },
        {
          id: 'orientar',
          kind: 'fala',
          label: 'Orientar',
          say: 'Fica sentada mais um pouco, bebe água e come alguma coisa. Levanta devagar: senta, espera um minuto, depois fica de pé. Se desmaiar, sentir dor no peito ou o coração disparar, liga de novo. Se repetir, procura a UBS.',
          // Conferido (RC20): sem perda de consciência, sem dor no peito, sem palpitação, FAST normal → orientação.
          a: 'Comer... é, minha avó vive falando isso. Tá bom, {dr}. Vou comer um pão com manteiga e parar com essa dieta de suco. Obrigada.',
        },
      ],
      links: [
        { a: 'comeu_pouco', b: 'escuro', kind: 'confirma', insight: 'Jantou só um suco e levantou de uma vez: tontura postural. Sem desmaio, sem dor no peito, FAST normal: verde.' },
        { a: 'nao_desmaiou', b: 'manual:verde', insight: 'Tontura que passou sentada, sem sinal de alarme: verde. Orientar (Manual p.1).' },
      ],
      patient: { name: 'Camila Freitas', age: 30, sex: 'F' },
      truth: { dx: 'Tontura postural (jejum)', sev: 'verde', ok: ['ORI'], ref: ['CASA', 'UBS'] },
      radio: { excess: 'Central, {unit}. A moça tá ótima, {dr}, comendo pão com manteiga. Pediu desculpa umas cinco vezes.' },
      diary: { ori: 'Tontura ao levantar depois de jantar só um suco. Orientada a comer e levantar devagar.' },
    }),
    // ------------------------------------------------------------------ 2 ★ ⚖ AVC "acordou assim"
    call({
      id: 'd06_avc',
      ref: 'D6 #2 ★ ⚖',
      at: '07:40',
      anchor: true,
      num: '(17) 3328-2850',
      caller: 'Dona Neide (esposa)',
      callerName: 'Dona Neide',
      type: 'comum',
      voice: 'idosa',
      note: 'Senhora. Marido "acordou estranho", boca torta.',
      noteFixed: true,
      addr: { rua: 'Rua Rui Barbosa', n: 2850, bairro: 'Vila Nova', ref: 'Esquina com a Tiradentes, casa do muro de pedra.' },
      amb: ['radio_am', 'cozinha'],
      open: [
        '{Dr}, meu marido {{acordou com a boca torta|boca_torta}}! Ele tá falando {{enrolado, tipo bêbado|enrolado}}, mas ele não bebe! Não bebe nada!',
        '[um rádio AM ao fundo; um homem tenta falar e as palavras saem emboladas]',
      ],
      q: {
        oque: 'Fui chamar ele pro café e ele tava sentado na cama, com a boca puxando pro lado. Não conseguiu segurar a xícara.',
        inicio: [
          '{{Ele deitou umas dez da noite|deitou_22}}. Eu acordei sete e vinte e ele já tava assim.',
          '...Ah, mas peraí: {{ele levantou pra ir no banheiro às cinco, eu ouvi a descarga|banheiro_5h}}. E {{ele falou comigo normal|falou_normal}}: "volta a dormir, Neide". Normalzinho.',
        ],
        fast: [
          'Ademir, sorri pra mim... {{a boca só sobe de um lado|fast_boca}}.',
          'Levanta os braços... {{o direito cai, não para em cima|fast_braco}}.',
          'Fala "o céu é azul"... ADEMIR: O... cé... é... zu... {{Tá tudo embolado|fast_fala}}.',
        ],
        consciencia: 'Acordado, olhando pra mim. Entende tudo, mas a fala não sai.',
        respira: 'Respira normal.',
        idade: 'Sessenta e sete.',
        historico: 'Pressão alta. {{Parou o remédio faz um mês, disse que tava bom|parou_remedio}}. Fumou trinta anos.',
        sangramento: 'Não.',
        dorpeito: 'Do peito ele não reclamou, não.',
        paciente: ['ADEMIR: Ne... Nei... tô... bem...', '[as palavras escorregam, uma em cima da outra]'],
        referencia: 'Esquina com a Tiradentes, casa do muro de pedra.',
        seguranca: 'Seguro.',
      },
      extra: [
        {
          id: 'glicemia',
          label: 'É diabético? Usa insulina?',
          say: 'Ele é diabético? Toma insulina? Tem aparelho de glicemia aí?',
          a: '{{Diabético não é|nao_diabetico}}. Fez exame mês passado, o açúcar deu normal.',
        },
        {
          id: 'nada_boca',
          kind: 'fala',
          label: 'Orientar: nada pela boca',
          say: 'Não dá água, café nem remédio pela boca: ele pode engasgar. Deixa ele deitado de lado se vomitar. E guarda essa hora das cinco: a equipe vai perguntar.',
          // Conferido (campo A15: AC21/BC14): nada pela boca, lateral se vomitar, guardar a hora em que foi visto bem.
          a: 'Nada pela boca... tá. Ele queria o café. Ai, meu Deus, Ademir. Cinco horas. Tô anotando no calendário da cozinha.',
        },
      ],
      links: [
        { a: 'deitou_22', b: 'manual:acordou', insight: 'Acordou com os sintomas: o início é a última vez em que foi visto bem, não a hora em que a esposa acordou (Manual p.6).' },
        { a: 'falou_normal', b: 'manual:janela', insight: janelaInsight },
        { a: 'fast_braco', b: 'manual:fast', insight: 'Boca torta, braço que cai e fala enrolada: FAST positivo. Suspeita de AVC (Manual p.6).' },
        { a: 'nao_diabetico', b: 'manual:hipoglicemia', kind: 'confirma', insight: 'Não é diabético nem usa insulina: hipoglicemia improvável. É AVC.' },
      ],
      patient: { name: 'Ademir Toledo', age: 67, sex: 'M' },
      truth: avcTruth,
      guide: { id: 'avc' },
      radio: {
        // dentro ou fora da janela pela hora do carimbo (na janela, USA e USB são aceitas)
        ok: (c: Ctx) => {
          const d = decisao(c, 'd06_avc');
          return (d ? d.t - VISTO_BEM <= JANELA : naJanela(c))
            ? '{central}, {unit} com o Seu Ademir. Visto bem às cinco, hora anotada no calendário. Déficit à direita. Seguimos Regional pra trombólise. A esposa veio de chinelo, com a xícara na mão.'
            : 'Central, {unit}. AVC, visto bem às cinco: fora da janela. Estável, déficit à direita. Seguimos Regional pra investigar.';
        },
        excess: '{central}, {unit}. AVC fora da janela, {dr}: foi visto bem às cinco. Dava USB, mas a gente leva.',
        under: 'Central, {unit}! AVC dentro da janela, visto bem às cinco! Precisa de USA, tempo é cérebro!',
        dismissed: 'DONA NEIDE: {Dr}, ele piorou! Agora o braço direito não mexe mais nada! Ele tá chorando!',
      },
      diary: {
        alive: 'Acordou com a boca torta. Tinha falado normal às cinco da manhã, no caminho do banheiro.',
        dead: 'AVC. Acordou com a boca torta e não voltou a falar.',
        later: [
          {
            day: 8,
            text: 'Voltou a falar frases curtas. A primeira foi "cadê meu café".',
            when: (c) => noDiario(c, 'd06_avc') === 'vivo' && !c.flag('d6_avc_convenio'),
          },
          {
            day: 8,
            text: 'O São Lucas transferiu ele pro Regional às duas da tarde. Perdeu a janela. O braço direito não voltou.',
            when: (c) => noDiario(c, 'd06_avc') === 'vivo' && c.flag('d6_avc_convenio'),
          },
        ],
      },
    }),
    // ------------------------------------------------------------------ 3 (contra-armadilha)
    call({
      id: 'd06_cachaca',
      ref: 'D6 #3',
      at: '09:00',
      pool: 'intox,moderado',
      num: '(17) 99620-1460',
      caller: 'Cleonice (esposa)',
      callerName: 'Cleonice',
      type: 'comum',
      voice: 'mulher',
      note: 'Mulher. Marido falando enrolado.',
      noteWrong: 'Mulher. Marido com AVC, boca torta!',
      addr: { rua: 'Rua Tiradentes', n: 1460, bairro: 'Vila Nova', ref: 'Do lado do bar do Português, porta de aço azul.' },
      amb: ['tv', 'cachorro'],
      open: [
        '{m:Moço|Moça}, meu marido tá {{falando tudo enrolado|enrolado}}, não para em pé! Será que é derrame? Passou na TV que derrame é assim!',
        '[um homem cantando desafinado ao fundo: "...ai, ai, ai, meu coração..."]',
      ],
      q: {
        oque: 'Ele chegou da festa do compadre {{umas seis da manhã|chegou_6h}}. Dormiu no sofá. Acordou agora assim, cambaleando. Vomitou no tapete.',
        fast: [
          'Gérson, sorri! ...{{Sorriu dos dois lados|fast_sorriso}}, o safado.',
          'Levanta os braços... {{levantou os dois|fast_bracos}}, meio balançando.',
          'Fala "o céu é azul"... GÉRSON: O céu é azuuul, Cleonice, igual teu olho... [risada] Enrolado, mas falou tudo.',
        ],
        consciencia: 'Acordado, mas {{mole, com sono|sonolento}}. Fica cochilando sentado.',
        respira: 'Respira. Ronca quando cochila.',
        idade: 'Cinquenta e dois.',
        historico: '{{Bebe todo fim de semana|bebe}}. Pressão alta, toma remédio. Diabetes não tem.',
        inicio: 'Desde que acordou, umas oito e meia. Mas ontem já chegou assim.',
        sangramento: 'Não. Ralou o cotovelo na porta.',
        paciente: ['GÉRSON: Tô... ótimo... {{um copinho só|copinho}}... [soluço]'],
        referencia: 'Do lado do bar do Português. Ironia, né?',
        seguranca: 'Seguro. Ele é manso, só cantor.',
      },
      extra: [
        {
          id: 'cheiro',
          label: 'Cheiro de bebida? Quanto bebeu?',
          say: 'Ele está com cheiro de bebida? Sabe quanto ele bebeu?',
          a: '{{Cheiro de cachaça que dá pra sentir da cozinha|cachaca}}. O compadre disse que foi uma garrafa entre dois. Fora a cerveja.',
        },
        {
          id: 'cabeca',
          label: 'Bateu a cabeça? Tomou remédio?',
          say: 'Ele caiu ou bateu a cabeça? Tomou algum remédio pra dormir junto?',
          a: 'Não bateu, não. Remédio só o da pressão, de manhã... que ele nem tomou hoje.',
        },
        {
          id: 'de_lado',
          kind: 'fala',
          label: 'Orientar: deitado de lado',
          say: 'Deixa ele deitado de lado, com a cabeça virada, pra não engasgar se vomitar de novo. Não dá café nem água com sal. Fica perto dele.',
          // Conferido (campo A12: lateral, nada pela boca). RC19: sonolento e vomitando, sem glicemia, com medo
          // de AVC = "alteração da consciência não totalmente atribuível ao álcool" → USI/USB (não USA: FAST normal).
          a: 'De lado... tá. Café eu ia dar! Credo. Deitei ele de lado. Já tá roncando.',
        },
      ],
      links: [
        { a: 'fast_sorriso', b: 'manual:fast', insight: 'Sorriso simétrico, levanta os dois braços, fala enrolada mas completa: FAST sem sinal de um lado só. A fala enrolada aqui é da bebida (Manual p.6).' },
        { a: 'enrolado', b: 'cachaca', insight: '"Enrolado" com cheiro forte de cachaça depois de uma noite de festa: intoxicação alcoólica. Vomitando e sonolento: USB para observar, não USA.' },
        { a: 'copinho', b: 'cachaca', insight: '"Um copinho só"... com cheiro de cachaça da cozinha. Ele minimiza; a esposa confirma a bebedeira.' },
      ],
      patient: { name: 'Gérson Lopes', age: 52, sex: 'M' },
      truth: { dx: 'Intoxicação alcoólica (vômitos e sonolência)', sev: 'amarelo', ok: ['USB'] },
      radio: {
        ok: 'Central, {unit}. Seu Gérson, intoxicação alcoólica, glicemia normal, FAST negativo. Cantou uma moda de viola inteira na maca.',
        excess: '{central}, {unit}. É cachaça, {dr}. FAST negativo. Ele quer saber se a ambulância toca música.',
      },
      diary: { alive: 'Fala enrolada... de cachaça. FAST normal. A esposa achou que era derrame.' },
    }),
    // ------------------------------------------------------------------ 4 ★ criança e a mãe em hipoglicemia
    call({
      id: 'd06_hipo_mae',
      ref: 'D6 #4 ★',
      at: '10:20',
      anchor: true,
      num: '(17) 99158-1830',
      caller: 'Criança (Ana Clara, 7)',
      callerName: 'Ana Clara',
      type: 'crianca',
      voice: 'crianca',
      note: 'CRIANÇA. Diz que a mãe não acorda. Não ouvi risada.',
      noteFixed: true,
      addr: { rua: 'Rua São João', n: 1830, bairro: 'Vila Nova', ref: 'Casa do portão azul, com um pé de acerola.' },
      amb: ['desenho', 'tv'],
      noFollowup: true,
      open: [
        '{m:Moço|Moça}... {{minha mãe não acorda|nao_acorda}}. Ela tá {{no chão da cozinha|chao}}.',
        '[{{desenho animado na TV, uma musiquinha alegre|desenho}}]',
        'Eu chamei, chamei... ela não fala.',
      ],
      q: {
        oque: 'Ela tava fazendo o meu leite e caiu. Fez barulho. {{Antes ela tava tremendo e falou que tava tonta|tremendo}}.',
        respira: ['Respira?... Eu ponho a mão na barriga dela?', '[pausa]', '{{Sobe... devagarinho|sobe_devagar}}. Sobe e desce.'],
        consciencia: 'Ela não acorda. Eu chamei "mãe, mãe". Ela {{faz "hum" e não abre o olho|resmunga}}.',
        idade: ['Eu tenho sete.', 'A mamãe tem... trinta e um, eu acho.'],
        inicio: 'Agora... quando começou o desenho do cachorro. Faz pouquinho.',
        historico: ['{{Ela toma injeção na barriga|injecao_barriga}}. Todo dia. A barriga dela fica roxinha.', 'Tem uma caixinha na geladeira com as injeções.'],
        sangramento: 'Não tem sangue. Só que {{ela tá molhada... a testa tá molhada|suor}}.',
        paciente: ['[a criança encosta o telefone na mãe]', 'JAQUELINE: ...hmmm... [um gemido fraco]', 'Ela não fala, {m:moço|moça}.'],
        referencia: 'A casa é do portão azul. Tem um pé de acerola. Rua São João, mil oitocentos e trinta. A mamãe me ensinou.',
        seguranca: 'Só eu e a mamãe. {{A porta tá trancada|trancada}}.',
      },
      extra: [
        {
          id: 'adulto',
          label: 'Tem algum adulto aí?',
          say: 'Tem algum adulto aí com você? Seu pai, uma vizinha?',
          a: ['{{Não tem ninguém|sem_adulto}}. O papai tá viajando de caminhão.', 'A vizinha não ouve. Eu bati na parede.'],
        },
        {
          id: 'comeu',
          label: 'A mamãe tomou café?',
          say: 'Você sabe se a sua mãe tomou café da manhã hoje?',
          a: '{{Ela me deu o último pão e falou que ia comer depois|deu_o_pao}}. Ela tomou a injeção e não comeu.',
        },
        {
          id: 'nome',
          kind: 'fala',
          label: 'Perguntar o nome dela',
          say: 'Como é o seu nome? Você está sendo muito corajosa.',
          a: 'Ana Clara. [funga] Eu não tô chorando.',
        },
      ],
      links: [
        { a: 'injecao_barriga', b: 'manual:hipoglicemia', insight: 'Injeção na barriga todo dia é insulina. Diabética caída, suada, sem acordar: hipoglicemia grave. Vermelho → USA (Manual p.6).' },
        { a: 'deu_o_pao', b: 'injecao_barriga', insight: 'Tomou a insulina e não comeu: deu o último pão para a filha. O açúcar despencou.' },
        { a: 'sem_adulto', b: 'manual:crianca', insight: 'Não há adulto consciente: regule pelo que a criança descreve. Isto não é trote (Manual p.2).' },
        { a: 'sobe_devagar', b: 'manual:parada', kind: 'confirma', insight: 'A barriga "sobe devagarinho": ela respira. Não é parada, mas não acorda: vermelho mesmo assim.' },
      ],
      onStamp: (e) => {
        const d = decisao(e, 'd06_hipo_mae');
        if (d && (d.resource === 'ORI' || d.resource === 'TROTE')) e.set('d6_hipo_dispensada');
      },
      onResolve: (e, r) => {
        if (r.outcome === 'obito') e.set('hipo_mae_morreu');
        else e.set('hipo_mae_salva');
      },
      patient: { name: 'Jaqueline Santos', age: 31, sex: 'F' },
      truth: { dx: 'Hipoglicemia grave (diabética em uso de insulina)', sev: 'vermelho', ok: ['USA'], risk: { good: 50, bad: 120 } },
      guide: { id: 'hipoglicemia' },
      radio: {
        ok: '{central}, {unit}. Glicemia 31. Glicose na veia, ela acordou perguntando da filha. A menina abriu a porta pra gente com a chave na mão.',
        saved: '{central}, {unit}. A menina destrancou a porta e não largou o telefone um segundo. Glicemia 28, glicose na veia, a mãe acordou. Quem tava falando com ela?',
        dead: 'Central... {unit}. Óbito às {hora}. A menina tá com a vizinha. Ninguém teve coragem de desligar o desenho.',
        under: 'Central, {unit}! Diabética desacordada, glicemia baixíssima, a gente não tem glicose na veia! Precisamos de USA!',
      },
      diary: {
        alive: 'A Ana Clara, de 7 anos, ligou porque a mãe não acordava. Insulina sem café: a mãe tinha dado o último pão pra filha.',
        dead: 'A filha de 7 anos ligou. A mãe tinha tomado a insulina e dado o último pão pra ela.',
      },
    }),
    // ------------------------------------------------------------------ 5 ★ Cida aprende o FAST
    call({
      id: 'd06_cida',
      ref: 'D6 #5 ★',
      at: '11:30',
      anchor: true,
      num: NUM.cida,
      caller: 'Dona Cida',
      callerName: 'Dona Cida',
      type: 'frequentador',
      voice: 'cida',
      note: 'Dona Cida. Viu reportagem de derrame na TV.',
      noteFixed: true,
      addr: ADDR.cida,
      amb: ['tv', 'passaros'],
      open: [
        'Oi, {meu} {filho}, é a Cida! Ó, passou no jornal da TV {{como é que a gente sabe se tá tendo derrame|derrame_tv}}. Fiquei cismada.',
        '{{Me ensina?|ensina}}',
        '[TV: "...no próximo capítulo de Amor de Cristal..."]',
      ],
      q: {
        oque: 'Nada, {meu} {filho}. Só a cisma. A Zuleide do terço teve derrame e ninguém percebeu. Acharam que era sono.',
        fast: [
          'Ai, que coisa boba... tô sorrindo. {{Os dois lados, acho|cida_sorri}}. Tem espelho aqui no corredor.',
          'Levantei os bracinhos. {{Os dois lá em cima|cida_bracos}}. Parece que tô na igreja.',
          '"O céu é azul." {{O céu é azul, {meu} {filho}|cida_fala}}. Passei?',
        ],
        idade: 'Setenta e nove.',
        consciencia: 'Acordada, acordada.',
        respira: 'Respirando.',
        historico: 'Pressão. Tomo o remédio. Hoje já tomei.',
        inicio: 'Desde que passou a reportagem, ué.',
        paciente: 'Sou eu mesma!',
        sangramento: 'Não!',
        seguranca: 'Seguro. O gato tá dormindo em cima da TV.',
      },
      extra: [
        {
          id: 'ensinar',
          kind: 'fala',
          label: 'Ensinar o FAST pra ela',
          cost: 10,
          say: 'É assim, Dona Cida: sorrir, levantar os dois braços e falar uma frase. Se a boca entortar, um braço cair ou a fala enrolar, liga na hora pra emergência e diz a hora que começou.',
          // Conferido (RC1, escala de Cincinnati; campo A15: hora de início = último momento visto sem sintomas).
          a: [
            'Sorrir, braço, frase... e a hora. A hora! Vou escrever num papelzinho e pregar na geladeira.',
            'Ô, {meu} {filho}... e se for comigo e eu não perceber?',
            '{{Se eu ligar falando estranho, você vai saber que sou eu, né?|vai_saber}}',
          ],
          onAsk: fx.set('d6_cida_fast'),
        },
        {
          id: 'conversar',
          kind: 'fala',
          label: 'Conversar um pouco com ela',
          cost: 15,
          say: 'E a novela, Dona Cida? O que vai acontecer no próximo capítulo?',
          a: [
            'Ai, {meu} {filho}, a Marta vai pro casamento do Henrique! O da fazenda! E ela vai de vermelho, que é pra todo mundo ver.',
            'Eu fazia vestido vermelho também, sabia? Ninguém tinha coragem de usar. Só as que tinham.',
            '[risada]',
            'Sábado é bom, que a novela reprisa. É a mesma coisa duas vezes, mas a casa fica com barulho.',
          ],
          onAsk: fx.all(fx.add('humanidade', 1, 'conversou com a Dona Cida'), fx.set('cida_conversou_d6')),
        },
      ],
      links: [
        { a: 'cida_bracos', b: 'manual:fast', kind: 'confirma', insight: 'Sorriso dos dois lados, os dois braços em cima, frase completa: FAST normal. A Dona Cida está bem hoje (Manual p.6).' },
        { a: 'vai_saber', b: 'manual:fast', kind: 'confirma', insight: 'Ela pediu pra você reconhecer a voz dela se um dia ligar "falando estranho". Anotado.' },
      ],
      onAnswer: fx.set('cida_ligou_d6'),
      patient: { name: 'Aparecida (Dona Cida)', age: 79, sex: 'F' },
      truth: { dx: 'Dúvida sobre AVC (FAST normal)', sev: 'azul', ok: ['ORI'], ref: ['CASA', 'UBS'] },
      radio: { excess: '{central}, {unit} na Dona Cida. FAST normal, pressão boa. Ela fez a equipe inteira sorrir, levantar os braços e falar "o céu é azul". Dava orientação, {dr}.' },
      diary: { ori: 'Ligou pra aprender a reconhecer derrame. Fez o FAST no espelho do corredor: tudo normal. "Se eu ligar falando estranho, você vai saber que sou eu."' },
    }),
    // ------------------------------------------------------------------ 6
    call({
      id: 'd06_avc2',
      ref: 'D6 #6',
      at: '13:00',
      pool: 'grave',
      num: '(17) 3323-1950',
      caller: 'Vanessa (filha)',
      callerName: 'Vanessa',
      type: 'comum',
      voice: 'mulher',
      note: 'Filha. Pai com a fala enrolada no almoço.',
      noteWrong: 'Filha. Pai alegre demais no almoço de sábado.',
      addr: { rua: 'Av. Primavera', n: 1950, bairro: 'Jardim Primavera', ref: 'Condomínio Recanto, casa 7.' },
      amb: ['cozinha', 'tv'],
      open: [
        '{Dr}, meu pai {{começou a falar enrolado no almoço|enrolado}}. E {{o braço esquerdo dele tá caído|braco}}, ele não consegue pegar o copo.',
        '[talheres; uma criança pergunta "o vô tá bem?"]',
      ],
      q: {
        oque: 'A gente tava almoçando, ele foi falar e saiu tudo torto. Derrubou o garfo. Achei que era brincadeira dele.',
        inicio: '{{Meio-dia e dez|meio_dia}}. Eu olhei no relógio da sala porque ia começar o jornal. Faz uma hora.',
        fast: [
          'Pai, sorri... {{a boca puxa pra direita|fast_boca}}.',
          'Levanta os braços... {{o esquerdo não sobe|fast_braco}}.',
          'Fala "o céu é azul"... SEBASTIÃO: O... sé... u... Embolado.',
        ],
        consciencia: 'Acordado. Olha pra mim assustado.',
        respira: 'Normal.',
        idade: 'Setenta e quatro.',
        historico: ['Pressão e {{diabetes, toma insulina à noite|diabetes}}.', 'Mediu agora a glicemia: {{deu 132|glicemia_132}}.'],
        sangramento: 'Não.',
        dorpeito: 'Não reclamou do peito.',
        paciente: ['SEBASTIÃO: Fi... lha... o... braço...'],
        referencia: 'Condomínio Recanto, casa sete. O porteiro já sabe.',
        seguranca: 'Seguro.',
      },
      extra: [
        {
          id: 'bebida',
          label: 'Bebeu no almoço?',
          say: 'Ele bebeu alguma coisa no almoço? Cerveja, cachaça?',
          a: '{{Não bebe desde o infarto, faz dez anos|nao_bebe}}. Tomou guaraná.',
        },
      ],
      links: [
        { a: 'meio_dia', b: 'manual:janela', insight: 'Início claro às 12:10, há cerca de uma hora: dentro da janela de 4h30. USA → Regional (Manual p.6).' },
        { a: 'glicemia_132', b: 'manual:hipoglicemia', kind: 'confirma', insight: 'Diabético com insulina, mas glicemia 132: não é hipoglicemia. É AVC.' },
        { a: 'fast_braco', b: 'manual:fast', insight: 'Boca torta, braço que não sobe, fala embolada: FAST positivo (Manual p.6).' },
      ],
      patient: { name: 'Sebastião Ramos', age: 74, sex: 'M' },
      // RC1: FAST positivo = USI/USB; na janela o jogo prefere USA e aceita USB (⚖), como no AVC das 07:40.
      truth: { dx: 'AVC isquêmico na janela', sev: 'vermelho', ok: ['USA', 'USB'], best: 'USA', risk: { good: 60, bad: 140, needs: 'USB' } },
      guide: { id: 'avc' },
      radio: {
        ok: '{central}, {unit}. AVC, início 12:10 confirmado. Glicemia 128. Seguimos Regional pra trombólise.',
        under: 'Central, {unit}! AVC na janela, começou ao meio-dia! Precisa de USA!',
        dismissed: 'VANESSA: {Dr}, ele não fala mais nada! Tá babando, o lado todo caiu!',
      },
      diary: {
        alive: 'AVC no almoço de sábado. Derrubou o garfo às 12:10. Chegou na janela.',
        dead: 'AVC no almoço de sábado. Derrubou o garfo às 12:10.',
      },
    }),
    // ------------------------------------------------------------------ 7
    call({
      id: 'd06_cabeca',
      ref: 'D6 #7',
      at: '14:20',
      pool: 'pediatria,trauma_moderado',
      num: '(17) 99430-0850',
      caller: 'Talita (mãe)',
      callerName: 'Talita',
      type: 'comum',
      voice: 'jovem_m',
      note: 'Mãe. Bebê bateu a cabeça, já brincando.',
      noteWrong: 'Mãe desesperada. Bebê desmaiou depois da queda.',
      addr: { rua: 'Rua Sabiá', n: 850, bairro: 'Vila Esperança', ref: 'Casa dos fundos, entrada pelo corredor do lado da mercearia.' },
      amb: ['bebe', 'musica'],
      open: [
        '{m:Moço|Moça}, meu bebê {{caiu da cama de cima do beliche|beliche}}! Bateu a cabeça no chão! {{Chorou na hora|chorou}}, um berro!',
        '[{{risadinha de bebê|risadinha}}; um brinquedo musical tocando]',
      ],
      q: {
        oque: 'O irmão mais velho subiu com ele no beliche. Eu tava estendendo roupa. Quando eu vi, já tinha caído.',
        consciencia: 'Tá acordado, tá {{brincando com o carrinho agora|brincando}}. Mas eu tô com medo.',
        respira: 'Normal.',
        idade: 'Um ano e meio.',
        inicio: 'Faz uns vinte minutos.',
        sangramento: 'Não sangrou. Mas {{subiu um galo enorme do lado da cabeça|galo}}, mole assim.',
        historico: 'Nada. Vacina em dia.',
        paciente: ['BERNARDO: Mamã! [balbucio] Caiu! Bum!'],
        seguranca: 'Seguro.',
      },
      extra: [
        { id: 'altura', label: 'De que altura caiu?', say: 'De que altura ele caiu? Em cima de quê?', a: 'Da cama de cima do beliche... {{mais de um metro, no piso frio|altura}}.' },
        {
          id: 'alarme',
          label: 'Desmaiou? Vomitou? Sonolento?',
          say: 'Ele desmaiou, vomitou, ficou sonolento ou diferente do normal?',
          a: 'Não desmaiou, chorou na hora. Não vomitou. Tá normal, brincando... é só esse galo que me assusta.',
        },
        {
          id: 'observar',
          kind: 'fala',
          label: 'Orientar enquanto espera',
          say: 'Deixa ele no seu colo, quietinho. Gelo enrolado num pano em cima do galo, sem apertar. Se ele vomitar, ficar molinho ou com muito sono, me liga na hora.',
          // [validar] RT9 põe "hematoma ou inchaço em couro cabeludo" em orientação; o jogo pede USB pela soma de menos
          // de 2 anos, queda de mais de 1 m e hematoma mole fora da testa (risco de fratura: RT6, criança < 10 anos com
          // fratura → USI/USB). Equipe: orientar ida ao hospital por meios próprios deveria ser aceito (⚖)?
          a: 'Gelo no pano... tá. Ele não deixa, puxa o pano. Mas tá rindo.',
        },
      ],
      links: [
        { a: 'galo', b: 'altura', insight: 'Bebê com menos de 2 anos, queda de mais de um metro e galo mole do lado da cabeça: precisa ser avaliado. Amarelo → USB, mesmo brincando.' },
        { a: 'chorou', b: 'brincando', kind: 'confirma', insight: 'Chorou na hora, não desmaiou, está brincando: sem sinal de gravidade imediata. Não precisa de USA.' },
      ],
      patient: { name: 'Bernardo', age: 1, sex: 'M' },
      truth: { dx: 'Trauma craniano leve em bebê (queda do beliche)', sev: 'amarelo', ok: ['USB'] },
      radio: {
        ok: 'Central, {unit}. Bebê de 1 ano e meio, hematoma do lado da cabeça, ativo, chorando forte. Levando pra observação. A mãe tá mais branca que ele.',
        excess: '{central}, {unit}. O bebê tá ótimo, {dr}, mordeu meu estetoscópio. Dava USB.',
      },
      diary: { alive: 'Bebê caiu do beliche, galo do lado da cabeça. Observação; tomografia normal.' },
    }),
    // ------------------------------------------------------------------ 8
    call({
      id: 'd06_lombar',
      ref: 'D6 #8',
      at: '15:40',
      pool: 'leve',
      num: '(17) 99876-2650',
      caller: 'Valdemar (o próprio)',
      callerName: 'Valdemar',
      type: 'exagerador',
      voice: 'homem',
      note: 'Homem com dor nas costas. Quer remédio.',
      noteWrong: 'Homem com dor forte, não consegue andar.',
      addr: { rua: 'Av. Beira-Rio', n: 2650, bairro: 'Vila Nova', ref: 'Do lado do depósito de material de construção.' },
      amb: ['ventilador', 'tv'],
      open: ['{Dr}, boa tarde. Eu tô com {{uma dor nas costas que vai me matar|vai_matar}}. Manda {{uma injeção forte|injecao}} aí, que a dipirona não faz mais nem cócegas.'],
      q: {
        oque: 'Dor aqui embaixo, na lombar. Carreguei saco de cimento a semana inteira.',
        inicio: '{{Ah, essa dor eu tenho faz uns três anos|tres_anos}}. Hoje tá mais chata.',
        consciencia: 'Acordadíssimo. Com dor, mas acordado.',
        respira: 'Respiro, ué.',
        idade: 'Quarenta e cinco.',
        historico: 'Nada. Hérnia, o médico falou uma vez. Nunca fiz o exame.',
        sangramento: 'Não.',
        paciente: 'Sou eu mesmo.',
        seguranca: 'Tranquilo.',
      },
      extra: [
        {
          id: 'alarme',
          label: 'Febre? Perna fraca? Controle do xixi?',
          say: 'Tem febre? A perna ficou fraca ou dormente? Perdeu o controle do xixi ou do cocô? Formigamento entre as pernas?',
          a: '{{Nada disso. Andar eu ando, ué|anda}}. Tô andando aqui pela sala. Xixi normal. É só a dor chata.',
        },
        {
          id: 'remedio',
          kind: 'fala',
          label: 'Explicar: a ambulância não leva injeção',
          say: 'A ambulância não leva injeção para dor de três anos, Seu Valdemar. O senhor precisa tratar essa dor na UBS, com consulta e exame.',
          a: ['UBS? Tem fila de três meses, {dr}!', '[suspiro longo]', 'Tá bom. Segunda eu vou. Mas fala pra eles que eu sou ruim de agulha.'],
        },
      ],
      links: [
        { a: 'vai_matar', b: 'tres_anos', insight: '"Vai me matar"... uma dor que ele tem há três anos. Sem sinal de alarme: crônica. Verde, UBS.' },
        { a: 'anda', b: 'manual:verde', insight: 'Anda, sem febre, sem perda de força nem do controle da urina: dor lombar crônica. Orientação, UBS (Manual p.1).' },
      ],
      patient: { name: 'Valdemar Souza', age: 45, sex: 'M' },
      truth: { dx: 'Dor lombar crônica (sem sinais de alarme)', sev: 'verde', ok: ['ORI'], ref: ['UBS'] },
      radio: { excess: '{central}, {unit}. Lombalgia de três anos, {dr}. Ele perguntou se a gente aceitava cartão pra aplicar a injeção.' },
      diary: { ori: 'Dor lombar de três anos. Queria "uma injeção forte". Orientado à UBS.' },
    }),
    // ------------------------------------------------------------------ 9
    call({
      id: 'd06_trote',
      ref: 'D6 #9',
      at: '17:00',
      pool: 'trote',
      num: '(17) 99442-0420',
      caller: 'Voz de adolescente',
      type: 'trotista',
      voice: 'adolescente',
      note: 'Diz que a avó tá com AVC.',
      noteWrong: 'AVC! Avó com a boca torta, neto desesperado.',
      addr: { rua: 'Rua Paineira', n: 2400, bairro: 'Santa Luzia' },
      amb: ['videogame', 'risadas'],
      open: [
        'Alô, emergência! Minha avó tá tendo um AVC! Ela tá {{falando tudo de trás pra frente|tras_pra_frente}}! Fala "luza é uéc O"!',
        '[{{risadas abafadas|risadas}}; música de videogame]',
      ],
      q: {
        oque: 'Ela tava jogando videogame comigo e começou a falar ao contrário! [risada]',
        fast: ['Ela sorriu dos dois lados... e {{do lado de trás também|fast_absurdo}}! [risadas]', 'Levantou os braços e as pernas! Tá fazendo estrela!'],
        inicio: 'Desde... desde mil novecentos e noventa e oito! [risadas]',
        idade: 'Uns... duzentos?',
        consciencia: 'Acordada! Tá ganhando de mim no jogo!',
        respira: 'Respira pelo controle! [risadas]',
        referencia: 'Rua Paineira, dois mil e quatrocentos. Do lado do... do lado.',
        paciente: ['[voz fina, imitando velhinha]: "Socorro, meu netinho!"', '[gargalhada]'],
      },
      callback: ['[{{caixa postal: "Oi, aqui é o Duda, deixa recado aí, falou!"|retorno_caixa_duda}}]'],
      links: [
        { a: 'tras_pra_frente', b: 'risadas', insight: 'Relato absurdo e risadas abafadas: trote (Manual p.2).' },
        { a: 'fast_absurdo', b: 'manual:fast', insight: '"Sorriu do lado de trás": o teste FAST virou piada. Trote.' },
        { a: 'retorno_caixa_duda', b: 'num', insight: 'Ligar de volta: caixa postal de um adolescente. Nenhuma avó.' },
      ],
      patient: { name: '"Avó com AVC"' },
      truth: { dx: 'Trote (avó "falando ao contrário")', sev: 'trote', ok: ['TROTE'], prankKind: 'trote' },
      radio: { prank: 'Central, {unit}. A Rua Paineira termina no 1999, {dr}. Rodamos e voltamos. Era trote.' },
    }),
  ],
  interlude: {
    teaser: 'Sábado à noite. Em casa, alguma coisa parou de fazer barulho.',
    familyLacos: 1,
    // A geladeira quebra em qualquer caso (mesmo com bico): isopor e conserto ficam na loja.
    pre: {
      id: 'd06_geladeira',
      bg: 'cozinha',
      cast: ['ZELIA', 'LUCIA'],
      nodes: {
        start: {
          onEnter: fx.set('geladeira_quebrada'),
          lines: [
            { who: 'NARRADOR', t: 'Você chega e a cozinha está em silêncio. Silêncio demais: a geladeira parou de zumbir.' },
            { who: 'ZELIA', t: 'Morreu, {filho}. A geladeira. Bem no sábado, que é pra ninguém atender.' },
            { who: 'ZELIA', t: 'A minha insulina tá lá dentro, ficando morna. E o leite do Liam.' },
            { who: 'LUCIA', t: 'Liguei pro técnico do anúncio do jornal, o Seu Jairo. Ele vem ainda hoje, mesmo sendo sábado à noite.' },
            { who: 'LUCIA', t: 'Até lá, o isopor com gelo do posto custa dez reais. Segura a insulina por um dia.' },
          ],
        },
      },
    },
    scene: {
      id: 'd06_jairo',
      bg: 'cozinha',
      cast: ['JAIRO', 'ZELIA', 'LUCIA'],
      nodes: {
        start: {
          lines: [
            { who: 'NARRADOR', t: 'Sábado, oito da noite. Seu Jairo chega de boné, óculos de aro grosso e caixa de ferramentas, o macacão cinza cheio de graxa.' },
            { who: 'JAIRO', t: 'Boa noite, boa noite. Cadê a doente?' },
            { who: 'NARRADOR', t: 'Ele puxa a geladeira, encosta o ouvido no motor e bate num cano com a chave de fenda, como quem ausculta um peito.' },
            { who: 'JAIRO', t: 'Compressor cansado. Vai ter que trocar o relé e recarregar o gás. Fica trezentos e cinquenta, com um ano de garantia.' },
            { who: 'ZELIA', t: '(baixinho, pra você) Trezentos e cinquenta, {filho}.' },
          ],
          choices: [
            { label: 'Puxar conversa: "O senhor trabalha sozinho?"', next: 'conversa' },
            { label: '"Vou ver as contas e te ligo, Seu Jairo."', next: 'direto' },
          ],
        },
        conversa: {
          lines: [
            { who: 'JAIRO', t: 'Sozinho, desde que a patroa faleceu. Só eu e o meu neto, o Gabriel. Quinze anos.' },
            { who: 'JAIRO', t: 'E {m:o senhor|a senhora}, trabalha com o quê?' },
          ],
          choices: [
            { label: '"Sou {medico} da Regulação. Sou eu que atendo quando alguém chama ambulância."', next: 'samu' },
            { label: '"Trabalho num escritório, lá no Centro."', next: 'direto' },
          ],
        },
        samu: {
          lines: [
            { who: 'JAIRO', t: '(para de mexer no cano) Da ambulância? ...Ô, meu Deus.' },
            { who: 'JAIRO', t: 'O Gabriel vive no celular. Já levou bronca por passar trote, me mata de vergonha. A polícia veio aqui em casa uma vez, sabia?' },
            { who: 'JAIRO', t: 'Eu falo pra ele: um dia você vai precisar e ninguém vai acreditar. Ele ri. Quinze anos, né. Ri de tudo.' },
          ],
          choices: [
            {
              label: '"Ele tem quinze anos, Seu Jairo. Dá tempo de entender. Conversa com ele sobre o que acontece do lado de cá."',
              next: 'desconto',
              effect: fx.all(fx.set('jairo_desconto'), fx.add('humanidade', 1, 'conversou com o Seu Jairo')),
            },
            { label: '"Trote mata gente, Seu Jairo. Tira o celular desse menino."', next: 'bravo' },
          ],
        },
        desconto: {
          lines: [
            { who: 'JAIRO', t: '(limpa as mãos no macacão, demora) Faz o seguinte: duzentos. Só a peça e o gás. A mão de obra fica por conta do Gabriel. Quer dizer... por minha conta.' },
            { who: 'JAIRO', t: 'E se um dia esse menino ligar aí, {dr}...' },
            { who: 'NARRADOR', t: 'Ele não termina a frase. Volta para o compressor.' },
          ],
          next: 'recibo',
        },
        bravo: {
          lines: [
            { who: 'JAIRO', t: 'É. {m:O senhor|A senhora} tem razão. (ele abaixa os olhos para o cano) Trezentos e cinquenta, então.' },
          ],
          next: 'recibo',
        },
        direto: {
          lines: [{ who: 'JAIRO', t: 'Tá bom. Se fechar, eu volto amanhã com a peça. Se não der agora, isopor com gelo segura a insulina. Troca o gelo todo dia.' }],
          next: 'recibo',
        },
        recibo: {
          onEnter: fx.all(fx.doc('recibo_jairo'), fx.board({ id: 'recibo_jairo', kind: 'doc', title: 'Recibo do Seu Jairo', text: 'Rua Quaresmeira, 1720 · "neto Gabriel — 9-8877"' })),
          lines: [
            { who: 'NARRADOR', t: 'Ele preenche o recibo em pé, apoiado na geladeira morta, e rabisca alguma coisa no verso.' },
            { who: 'JAIRO', t: 'O número do meu neto tá aí atrás. Se eu não atender, é ele que atende. Pra emergência.' },
            { who: 'NARRADOR', t: 'Você dobra o recibo e guarda no bolso do jaleco. Amanhã ele vai para o quadro de cortiça da central.' },
            { who: 'ZELIA', t: '(baixinho) Isopor é dez reais, {filho}. Só dizendo.', when: is.not('jairo_desconto') },
            { who: 'ZELIA', t: 'Duzentos. Viu? Educação ainda dá desconto nesse mundo.', when: is.flag('jairo_desconto') },
          ],
        },
      },
    },
    bico: {
      id: 'd06_bico',
      bg: 'cozinha',
      cast: ['LUCIA', 'JAIRO'],
      nodes: {
        start: {
          onEnter: fx.all(fx.doc('recibo_jairo'), fx.board({ id: 'recibo_jairo', kind: 'doc', title: 'Recibo do Seu Jairo', text: 'Rua Quaresmeira, 1720 · "neto Gabriel — 9-8877"' })),
          lines: [
            { who: 'NARRADOR', t: 'Você está na USA 01. Quem recebe o Seu Jairo, às oito da noite, é {oconj}.' },
            { who: 'NARRADOR', t: 'Ele mexe na geladeira e fala do compressor, do relé, do gás. Depois fala do neto, que vive no celular, que já passou trote, que a polícia já bateu na porta.' },
            { who: 'JAIRO', t: 'Trezentos e cinquenta, {c:dona|moço}. Com garantia.' },
            { who: 'LUCIA', t: '{m:Meu marido|Minha esposa} trabalha na Regulação, sabia? Atende quem chama ambulância.' },
            { who: 'JAIRO', t: '(fica um tempo calado) ...É mesmo? Fala pra {m:ele|ela} que eu mandei um abraço. Trezentos e cinquenta.' },
            { who: 'NARRADOR', t: '{Oconj} faz a conta de cabeça, olhando a insulina da sogra na pia, dentro de uma panela com gelo.' },
            { who: 'NARRADOR', t: 'Quando você chega, de madrugada, o recibo está preso com um ímã de pizzaria na porta da geladeira morta. No verso, rabiscado: "neto Gabriel — 9-8877 (pra emergência)".' },
            { who: 'NARRADOR', t: 'Você guarda o recibo no bolso do jaleco.' },
          ],
        },
      },
    },
  },
});
