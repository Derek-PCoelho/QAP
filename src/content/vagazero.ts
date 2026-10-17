// =============================================================================
// Vaga zero negociada (1.1) — o Dr. Saulo Brandão, plantonista do PS do Regional.
// Bíblia: docs/roteiro-1.1/vaga-zero.md. Motor: src/engine/vagazero.ts.
//
// Formato (tipos em src/engine/types.ts: VagaZeroDef, VzObjection, VzCardDef):
//  · `calls` é indexado pelo id da ligação do dia (ex.: 'd03_conceicao'). A negociação abre quando
//    a ligação é despachada para o Regional (carimbo) ou pelo pedido de rádio de maca presa do
//    roteiro do dia (`abre: 'retencao'`, D9 e D15).
//  · Cada objeção é uma fala do Saulo com 3 cartões (bom / meio / ruim); o motor acrescenta um
//    argumento "sujo" (mentira, ameaça, carteirada, vereador, grito) e embaralha.
//  · Resistência inicial (`start`) menos `saulo_confianca` (mínimo 1; `fixo` não desconta).
//    Bom −2, meio −1, ruim +1 (ou `delta`). Resistência ≤ 0: "Manda." Quatro rodadas, no máximo.
//  · Tokens: {reg} = como o Saulo chama você ("Regulação"; pelo nome com confiança ≥ 3),
//    {recurso}, {paciente}, {hora}, e os de sempre ({nome}, {dr}, {m:a|b}...).
// Ninguém morre por falta de acordo: o PS recebe no corredor. O custo é a viatura presa.
// =============================================================================
import type { VagaZeroContent, VagaZeroDef, VzCardDef, VzObjection, Ctx } from '../engine/types';

const conf = (c: Ctx) => Number(c.s.flags['saulo_confianca']) || 0;

// -----------------------------------------------------------------------------
// Objeções genéricas (O1–O9 da bíblia, §3.1)
// -----------------------------------------------------------------------------
const GENERIC: VzObjection[] = [
  {
    id: 'O1',
    say: 'Tô com trinta e oito no corredor e duas macas, {reg}. Duas macas, um tomógrafo, um eu.',
    cards: [
      { id: 'O1b', kind: 'bom', text: 'Vaga zero não é leito, Saulo. É porta. Recebe na sala vermelha e solta a minha maca. Se a minha USA ficar presa, a próxima parada da cidade fica sem viatura.' },
      { id: 'O1m', kind: 'meio', text: 'Eu sei que tá lotado. Eu também tô com uma cidade inteira aqui.' },
      { id: 'O1r', kind: 'ruim', text: 'Lotado todo mundo tá.' },
    ],
  },
  {
    id: 'O2',
    say: 'Não tenho leito de UTI, {reg}. Não tenho nem onde pôr.',
    precisa: true,
    cards: [
      { id: 'O2b', kind: 'bom', text: 'Não tô pedindo UTI. Tô pedindo avaliação e estabilização no PS. A central de leitos procura a UTI depois, com {paciente} vivo.' },
      { id: 'O2m', kind: 'meio', text: 'A regulação procura a UTI pra você.' },
      { id: 'O2r', kind: 'ruim', text: 'Arruma um leito.' },
    ],
  },
  {
    id: 'O3',
    say: 'Leva pra UPA Norte, {reg}. Tem médico lá.',
    cards: [
      { id: 'O3b', kind: 'bom', precisa: true, text: 'A UPA não tem {recurso}. É disso que {paciente} precisa agora, e só você tem.' },
      { id: 'O3d', kind: 'bom', precisa: false, tag: 'desvio', text: 'Você tem razão. Esse aguenta a UPA. Eu desvio.' },
      { id: 'O3m', kind: 'meio', text: 'A UPA tá com quatro horas de espera.' },
      { id: 'O3r', kind: 'ruim', text: 'A UPA é pior que vocês.' },
    ],
  },
  {
    id: 'O4',
    say: 'Manda pro São Lucas. Lá tem quarto sobrando.',
    precisa: true,
    cards: [
      { id: 'O4b', kind: 'bom', text: 'O São Lucas é particular e não tem {recurso} de plantão hoje. A referência pactuada pra esse caso é você.' },
      { id: 'O4m', kind: 'meio', text: 'Não tem convênio, Saulo.' },
      { id: 'O4r', kind: 'ruim', text: 'O São Lucas é de rico.' },
    ],
  },
  {
    id: 'O5',
    say: 'Especialista aqui é sobreaviso, {reg}. Não vou chamar ninguém de casa pra paciente que nem chegou.',
    precisa: true,
    cards: [
      { id: 'O5b', kind: 'bom', text: 'Sobreaviso é pra isso: quem chama é o PS, quando o paciente chega e o exame mostra. Ele vem em meia hora. A rua não chama sobreaviso.' },
      { id: 'O5m', kind: 'meio', text: 'Liga pra ele mesmo assim.' },
      { id: 'O5r', kind: 'ruim', text: 'Problema seu.' },
    ],
  },
  {
    id: 'O6',
    say: 'E se morrer no meu corredor? O processo vem no meu nome, {reg}. Já veio uma vez.',
    cards: [
      { id: 'O6b', kind: 'bom', text: 'Eu registro agora: vaga zero às {hora}, regulador {nome} Moura, plantonista Saulo. A responsabilidade é compartilhada e tá escrita. Você não responde sozinho.' },
      { id: 'O6e', kind: 'bom', tag: 'empatia', when: (c) => c.flag('castro_saulo'), text: 'Eu sei que já mandaram e esqueceram de você. Eu não vou esquecer.' },
      { id: 'O6m', kind: 'meio', text: 'Eu assumo.' },
      { id: 'O6r', kind: 'ruim', tag: 'ameaca', text: 'Se morrer na rua, o processo é seu também.', reply: 'Ah. Agora é ameaça. (crec) Anota aí, {reg}: ameaça às {hora}.' },
    ],
  },
  {
    id: 'O7',
    say: 'Já recebi três vagas zero hoje, {reg}. Três. Você sabe o que é isso?',
    cards: [
      { id: 'O7b', kind: 'bom', text: 'E eu vou te mandar mais uma porque {paciente} precisa. Amanhã você me cobra.' },
      { id: 'O7m', kind: 'meio', text: 'Hoje tá difícil pra todo mundo.' },
      { id: 'O7r', kind: 'ruim', text: 'Problema da OS.' },
    ],
  },
  {
    id: 'O8',
    say: 'Isso é caso de UPA, {reg}. Não é caso de sala vermelha.',
    cards: [
      { id: 'O8b', kind: 'bom', precisa: true, text: 'Não é. {Paciente} precisa de {recurso}, e a UPA não tem. Se fosse caso de UPA, eu nem te ligava.' },
      { id: 'O8d', kind: 'bom', precisa: false, tag: 'desvio', text: 'Você tem razão. Ele aguenta a UPA. Eu desvio.' },
      { id: 'O8m', kind: 'meio', precisa: true, text: 'Confia em mim, Saulo.' },
      { id: 'O8i', kind: 'ruim', precisa: false, delta: 2, text: 'Vai pro Regional e pronto.', reply: 'Pro Regional e pronto? Pra ficar no corredor do lado de um infartado? (crec) Você nem perguntou direito, {reg}.' },
      { id: 'O8r', kind: 'ruim', precisa: true, tag: 'desvio', text: 'Tá bom. Eu mando pra UPA.' },
    ],
  },
  {
    id: 'O9',
    birra: true,
    say: 'Você não é médico daqui pra me dizer o que fazer, {reg}.',
    cards: [
      { id: 'O9b', kind: 'bom', text: 'Não sou. Sou a regulação. Vaga zero é prerrogativa do regulador, e a regulação responde junto. Eu não tô te mandando: tô te avisando que ele vai chegar.' },
      { id: 'O9e', kind: 'bom', tag: 'empatia', when: (c) => c.flag('castro_saulo'), text: 'Eu sei que já mandaram e esqueceram de você. Dessa vez quem manda sou eu, e eu assino.' },
      { id: 'O9m', kind: 'meio', text: 'Sou médic{m:o|a} também.' },
      { id: 'O9r', kind: 'ruim', tag: 'ameaca', text: 'Eu vou te denunciar no CRM.', reply: 'Denuncia. O CRM fica a duas quadras daqui. Leva o corredor junto.' },
    ],
  },
];

// -----------------------------------------------------------------------------
// Argumentos ruins que tentam (§3.3): entram um por rodada, quando cabe
// -----------------------------------------------------------------------------
const SUJOS: VzCardDef[] = [
  { id: 'S_mentira', kind: 'ruim', tag: 'mentira', delta: -2, text: 'Ele tá parando, Saulo! Tá parando!', reply: '...Parando? Então manda logo. (crec)' },
  { id: 'S_ameaca', kind: 'ruim', tag: 'ameaca', text: 'Essa ligação tá gravada. Vai pro Ministério Público.', reply: 'Grava. Grava também os trinta e oito do corredor.' },
  { id: 'S_peixoto', kind: 'ruim', tag: 'carteirada', delta: 2, text: 'O Dr. Peixoto mandou você receber.', reply: '(ele tapa o fone) Peixoto, você mandou? ... (volta) Ele disse que não mandou nada, {reg}. E que agora você deve uma pra ele.' },
  { id: 'S_vereador', kind: 'ruim', tag: 'vereador', delta: 2, text: 'É parente de vereador, Saulo.', reply: 'Aqui parente de vereador vai pro quarto andar, {reg}. Você sabe disso? (silêncio) ...Esquece o que eu disse.' },
  { id: 'S_grito', kind: 'ruim', tag: 'grito', text: '(gritando) RECEBE ESSE PACIENTE!', reply: '(o Saulo afasta o fone; dá pra ouvir o corredor inteiro) ...Pois não, {reg}. Mais alguma coisa, {reg}?' },
];

/** o que só o Regional tem, pelo diagnóstico (negociações sem roteiro) */
function recursoDe(dx: string): string {
  const d = dx.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  if (/infarto|iam|supra|coronar/.test(d)) return 'hemodinâmica (cateterismo)';
  if (/avc|derrame/.test(d)) return 'tomografia e trombólise';
  if (/hemorragia subaracn|hsa|cefaleia/.test(d)) return 'tomografia e neurologia';
  if (/craniano|tce|cabeca/.test(d)) return 'tomografia e neurocirurgia';
  if (/raquimedular|coluna/.test(d)) return 'tomografia e neurocirurgia';
  if (/fratura exposta|faca|tiro|abdome|hemorrag|choque hemorr|politrauma|atropel|trauma/.test(d)) return 'cirurgião e centro cirúrgico';
  if (/sepse|septic/.test(d)) return 'sala vermelha, antibiótico na veia e UTI';
  if (/edema agudo|insuficiencia cardiaca/.test(d)) return 'ventilação e UTI';
  if (/parada|pcr/.test(d)) return 'UTI';
  if (/dengue/.test(d)) return 'sala vermelha e hidratação venosa monitorada';
  return 'sala vermelha';
}

// -----------------------------------------------------------------------------
// Negociações escritas, pelo id da ligação
// -----------------------------------------------------------------------------
const CALLS: Record<string, VagaZeroDef> = {
  // ---------------------------------------------------------------- D3 — 1ª vaga zero (tutorial)
  d03_conceicao: {
    recurso: 'hemodinâmica (cateterismo)',
    start: 3,
    peixoto: false,
    dica: true,
    intro: [
      { who: 'NARRADOR', t: 'O telefone do Regional toca antes de você pousar o carimbo. Dois toques curtos, mais graves que os outros.' },
      { who: 'SIMONE', t: '(puxa a cadeira pra perto, baixinho) Agora ele vai dizer que tá lotado. Não discute o lotado. Fala do que só ele tem.' },
    ],
    objections: [
      {
        id: 'd3_upa',
        say: 'PS do Regional, Saulo. (crec) Infarto? {reg}, tô com trinta e oito no corredor e duas macas. Leva pra UPA.',
        cards: [
          // [validar] infarto sem dor em diabética: a referência é o hospital com hemodinâmica (protocolo de dor torácica)
          { id: 'd3_hemo', kind: 'bom', text: 'A UPA não faz cateterismo. Sessenta e sete anos, diabética, infarto sem dor: o eletro da USA vai confirmar, e ela precisa de hemodinâmica. Só você tem.' },
          { id: 'd3_espera', kind: 'meio', text: 'A UPA tá com quatro horas de espera.' },
          { id: 'd3_lotado', kind: 'ruim', text: 'Lotado todo mundo tá.' },
        ],
      },
      {
        id: 'd3_corredor',
        say: 'A hemodinâmica tá com um na mesa. Ela vai esperar no corredor, {reg}.',
        cards: [
          { id: 'd3_porta', kind: 'bom', text: 'Vaga zero não é leito. Recebe na sala vermelha e solta a minha maca. A hemodinâmica chama quando liberar.' },
          { id: 'd3_registro', kind: 'meio', text: 'Eu registro com o seu nome e o meu.' },
          { id: 'd3_jeito', kind: 'ruim', text: 'Arruma um jeito.' },
        ],
      },
    ],
    aceita: '(pausa) Vocês adoram mandar e esquecer. Em dezenove eu aprendi. (crec) ...Manda. E não esquece.',
    recusa: 'Não dá, {reg}. Ela vai ficar na prancha de vocês até abrir maca. (crec) Vocês adoram mandar e esquecer.',
    depois: [{ who: 'SIMONE', t: 'Se ele empacar, tem o Peixoto. Mas o Peixoto só pega uma por dia. E cobra.' }],
  },

  // ---------------------------------------------------------------- D5 — o Saulo irredutível e o primeiro Peixoto
  d05_pedreiro: {
    recurso: 'tomografia, sala vermelha e neurocirurgia de sobreaviso',
    start: 5,
    fixo: true,
    floor: 2,
    objections: [
      {
        id: 'd5_rioclaro',
        say: 'PS do Regional, Saulo. (crec) Queda de andaime? Não tenho ortopedia, não tenho neuro, não tenho maca. Manda pra Rio Claro.',
        cards: [
          // [validar] trauma raquimedular: transporte longo com coluna instável piora o prognóstico; a referência é o hospital com tomografia e neurocirurgia
          { id: 'd5_estrada', kind: 'bom', text: 'Rio Claro é uma hora de estrada com coluna instável. Ele perde o que ainda tem. Ele precisa de tomografia e de neuro, e a sua sala vermelha é a mais perto.' },
          { id: 'd5_longe', kind: 'meio', text: 'É longe demais, Saulo.' },
          { id: 'd5_vire', kind: 'ruim', text: 'Rio Claro que se vire.' },
        ],
      },
      {
        id: 'd5_sobreaviso',
        say: 'Neuro é sobreaviso. Não vou chamar sobreaviso pra paciente que nem chegou, {reg}.',
        cards: [
          { id: 'd5_chama', kind: 'bom', text: 'Sobreaviso é pra isso. Quem chama é o PS quando a tomografia mostra. A rua não chama sobreaviso.' },
          { id: 'd5_liga', kind: 'meio', text: 'Liga pra ele mesmo assim.' },
          { id: 'd5_problema', kind: 'ruim', text: 'Problema seu.' },
        ],
      },
      {
        id: 'd5_folha',
        birra: true,
        say: 'Não é birra, {reg}. É folha. Tá escrito aqui: zero. (papel) "Leitos disponíveis: zero." Você quer que eu minta pra folha?',
        cards: [
          { id: 'd5_pernas', kind: 'bom', text: 'Folha não é paciente. Ele tem trinta e sete anos e não sente as pernas.' },
          { id: 'd5_naoesua', kind: 'meio', text: 'Eu sei que a folha não é sua.' },
          { id: 'd5_rasga', kind: 'ruim', text: 'Rasga a folha.' },
        ],
      },
    ],
    recusa: 'Não tem como, {reg}. Ele fica na prancha de vocês até sair maca. (crec) Desculpa.',
    peixotoFala: [
      { who: 'PEIXOTO', t: '(interfone) Me dá ele.' },
      { who: 'PEIXOTO', t: '(liga) Saulo? Peixoto. ...Eu sei, eu sei, a folha. Saulo, eu sei do quarto andar. Você sabe que eu sei. Recebe o pedreiro.' },
      { who: 'PEIXOTO', t: '(desliga) Recebeu. Agora me devolve a USA pro painel, {dr}. Eu não faço isso por você. Faço pelo rostinho. Mas faço.' },
    ],
    onPeixoto: (e) => e.set('peixoto_negociou_d5'),
  },

  // ---------------------------------------------------------------- D6 — AVC na janela (a esposa quer o São Lucas)
  d06_avc: {
    recurso: 'tomografia e trombólise',
    start: 3,
    when: (_c, t) => t.sev === 'vermelho',
    objections: [
      {
        id: 'd6_saolucas',
        say: 'PS do Regional, Saulo. (crec) AVC? A esposa não queria o São Lucas? Então manda pro São Lucas, {reg}.',
        cards: [
          // [validar] AVC isquêmico na janela de 4h30: trombólise exige tomografia e neurologia; serviço sem protocolo não é referência
          { id: 'd6_janela', kind: 'bom', text: 'O São Lucas não tem neurologista no sábado nem faz trombólise. Ele tá dentro da janela de quatro horas e meia. A referência pra AVC é você.' },
          { id: 'd6_convenio', kind: 'meio', text: 'Ele não tem convênio.' },
          { id: 'd6_rico', kind: 'ruim', text: 'O São Lucas é de rico.' },
        ],
      },
      {
        id: 'd6_tomo',
        say: 'A tomografia tá em manutenção até as dez, {reg}. O técnico tá com a tampa aberta.',
        cards: [
          { id: 'd6_plano', kind: 'bom', text: 'Então chama o neuro e recebe. Se a tomografia não voltar até nove e meia, eu transfiro pra Rio Claro com a mesma USA, sem perder a janela.' },
          { id: 'd6_dez', kind: 'meio', text: 'Até as dez dá tempo.' },
          { id: 'd6_desculpa', kind: 'ruim', text: 'Tomografia quebrada é desculpa.' },
        ],
      },
    ],
    aceita: '...Tá. Eu chamo o neuro. E se a tomo não voltar, a USA é sua de novo. Manda.',
  },

  // ---------------------------------------------------------------- D8 — Otávio: o argumento da tomografia
  d08_anticoag: {
    recurso: 'tomografia e neurocirurgia',
    start: 4,
    // [validar] TCE leve em anticoagulado: tomografia obrigatória; com vômitos e sonolência a tomografia é urgente e o compromisso de devolução vem depois
    promessa: {
      exame: 'tomografia',
      limpo: false,
      depois: 150,
      alterado: 'Sua tomografia não veio limpa, {reg}. Sangrou. A neuro já levou o Seu Otávio pro centro cirúrgico. (crec) Ainda bem que você mandou.',
    },
    objections: [
      {
        id: 'd8_observar',
        say: 'PS do Regional, Saulo. (crec) Idoso caiu e bateu a cabeça? Leva pra UPA observar, {reg}.',
        cards: [
          { id: 'd8_tecnico', kind: 'bom', text: 'Anticoagulado, vomitou duas vezes, tá sonolento. Precisa de tomografia agora. A UPA não tem tomógrafo.' },
          {
            id: 'd8_promessa',
            kind: 'bom',
            tag: 'promessa',
            goodAfter: ['d8_tecnico'],
            text: 'Se a tomografia vier limpa e ele acordar bem, eu tiro e levo pra UPA. A viatura volta pra buscar.',
            replyEarly: 'Sonolento e vomitando não é "tomo e tchau", {reg}.',
          },
          { id: 'd8_idoso', kind: 'ruim', text: 'Idoso tem que ser no hospital.' },
        ],
      },
      {
        id: 'd8_ese',
        after: ['d8_tecnico'],
        say: '...E se a tomo vier limpa? Ele fica ocupando a minha maca até amanhã?',
        cards: [
          {
            id: 'd8_promessa2',
            kind: 'bom',
            tag: 'promessa',
            text: 'Se vier limpa e ele acordar bem, eu tiro. A viatura volta pra buscar e leva pra UPA observar.',
          },
          { id: 'd8_aivê', kind: 'meio', text: 'Aí a gente vê.' },
          { id: 'd8_naovem', kind: 'ruim', text: 'Não vai vir limpa.' },
        ],
      },
      {
        id: 'd8_tchau',
        after: ['d8_promessa'],
        notAfter: ['d8_tecnico'],
        say: 'Me fala por que ele precisa de mim, {reg}. Não por que eu vou me livrar dele.',
        cards: [
          { id: 'd8_tecnico2', kind: 'bom', text: 'Anticoagulado, vomitou duas vezes, tá sonolento. Isso é sangramento até prova em contrário. A tomografia é agora, e a UPA não tem tomógrafo.' },
          { id: 'd8_velho', kind: 'meio', text: 'Ele tem oitenta e um anos, Saulo.' },
          { id: 'd8_preguica', kind: 'ruim', text: 'Você tá é com preguiça.' },
        ],
      },
    ],
    aceita: 'Fechado. Se vier limpa, você busca. Se não vier, ele é meu. (crec) Manda.',
  },

  // ---------------------------------------------------------------- D9 — Everton: a retenção das 11:00 vira negociação
  d09_moto: {
    recurso: 'neurocirurgia e UTI',
    start: 4,
    abre: 'retencao',
    intro: [{ who: 'RÁDIO', t: 'Doutor, tão segurando a nossa maca. Paciente intubado, TCE. Dizem que não tem leito.' }],
    objections: [
      {
        id: 'd9_intubado',
        say: 'PS do Regional, Saulo. Intubado na minha maca não fica, {reg}. Eu não tenho UTI.',
        cards: [
          { id: 'd9_sala', kind: 'bom', text: 'Ele não precisa ficar na sua maca. Precisa da sala vermelha e da neuro. Solta a maca da minha USA, que eu tenho uma cidade e uma viatura só depois do almoço.' },
          { id: 'd9_leitos', kind: 'meio', text: 'A central de leitos procura a UTI.' },
          { id: 'd9_respirador', kind: 'ruim', text: 'Arruma um respirador aí.' },
        ],
      },
    ],
    depois: [{ who: 'RÁDIO', t: 'Doutor, tem maca vazia no elevador de serviço subindo pro quarto andar. Aqui embaixo diz que não tem.' }],
  },

  // ---------------------------------------------------------------- D14 — suspeita de hemorragia subaracnoide (opcional)
  d14_cefaleia: {
    recurso: 'tomografia e, se vier normal, punção lombar',
    start: 3,
    objections: [
      {
        id: 'd14_dor',
        say: 'PS do Regional, Saulo. (crec) Dor de cabeça? Isso é caso de UPA, {reg}. Dipirona e casa.',
        cards: [
          // [validar] cefaleia súbita "a pior da vida": suspeita de HSA; tomografia normal não exclui, exige punção lombar no hospital
          { id: 'd14_hsa', kind: 'bom', text: 'Pior dor de cabeça da vida, de repente, cinquenta e dois anos. É hemorragia até prova em contrário: tomografia agora e, se vier normal, punção. A UPA não faz nenhuma das duas.' },
          {
            id: 'd14_promessa',
            kind: 'ruim',
            text: 'Se a tomografia vier normal, eu tiro e levo pra UPA.',
            reply: 'Tomografia normal em cefaleia súbita não libera ninguém, {reg}. Tem que puncionar. Você sabe disso.',
          },
          { id: 'd14_forte', kind: 'meio', text: 'É uma dor muito forte, Saulo.' },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- D15 — múltiplas vítimas no show
  d15_mci: {
    recurso: 'centro cirúrgico e o plano de catástrofe',
    start: 4,
    retencao: 'normal',
    objections: [
      {
        id: 'd15_janela',
        say: 'Saulo. (sem bolacha) O show? Já sei. Tô vendo pela janela: tá chegando gente a pé. Corredor a cento e sessenta por cento, {reg}. Manda as vermelhas pra Rio Claro.',
        cards: [
          // [validar] múltiplas vítimas: plano de catástrofe do hospital de referência; vermelhos para o centro cirúrgico, verdes para a UPA
          { id: 'd15_plano', kind: 'bom', text: 'Rio Claro é uma hora. As vermelhas não têm uma hora. Aciona o plano de catástrofe: centro cirúrgico pras vermelhas; as verdes eu mando pra UPA a pé.' },
          { id: 'd15_amarelas', kind: 'meio', text: 'As amarelas eu seguro na UPA.' },
          { id: 'd15_vira', kind: 'ruim', text: 'Se vira com o que tem.' },
        ],
      },
    ],
    aceita: (c) =>
      conf(c) >= 2
        ? '(pausa) ...Abre dois do quarto andar. Por minha conta. Se perguntarem, foi o plano de catástrofe. Manda.'
        : 'Tá. Plano de catástrofe. Manda as vermelhas. As verdes, nem pensar.',
    onAceita: (e) => {
      if (conf(e) >= 2) e.set('saulo_abriu_4andar');
    },
  },

  // ---------------------------------------------------------------- D16 — Seu Osvaldo, o pai do Peixoto
  d16_osvaldo: {
    recurso: 'sala vermelha, droga vasoativa e UTI',
    start: 3,
    peixoto: 'impedimento',
    objections: [
      {
        id: 'd16_atb',
        say: 'PS do Regional, Saulo. (crec) Sepse em idoso de oitenta e quatro? UPA dá antibiótico, {reg}. Manda pra UPA.',
        cards: [
          // [validar] choque séptico (confusão, hipotensão, taquipneia): sala vermelha, antibiótico na primeira hora, vasopressor e UTI
          { id: 'd16_choque', kind: 'bom', text: 'Ele tá confuso, com a pressão baixa e respirando rápido. É choque séptico: sala vermelha, antibiótico na primeira hora, droga vasoativa e UTI. A UPA Norte tá com quatro horas de dengue.' },
          { id: 'd16_idoso', kind: 'meio', text: 'Ele é idoso, Saulo.' },
          { id: 'd16_pai', kind: 'ruim', delta: 2, text: 'É o pai do coordenador.', reply: 'E daí? O pai do coordenador fura o corredor? (pausa) ...Não foi isso que eu quis dizer.' },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- D18 — Dona Odete: o leito aparece em quatro minutos
  d18_odete: {
    recurso: 'hemodinâmica',
    start: 0,
    fixo: true,
    aceita: 'Dona Odete Matos? (silêncio; papel) ...Leito no quarto andar. Sobe direto.',
    radioDepois: { min: 20, who: 'RÁDIO', text: 'Doutor, a mãe do vereador ganhou leito em quatro minutos. A gente nunca viu isso.' },
    onAceita: (e) => e.set('odete_leito'),
    objections: [],
  },

  // ---------------------------------------------------------------- D18 — Jonathan: "se tem leito pra mãe do vereador..."
  d18_moto: {
    recurso: 'cirurgião, sangue e centro cirúrgico',
    start: 4,
    objections: [
      {
        id: 'd18_cc',
        say: 'PS do Regional, Saulo. Fratura exposta de fêmur? Tô sem centro cirúrgico livre e sem leito, {reg}.',
        cards: [
          { id: 'd18_odete', kind: 'bom', delta: -5, when: (c) => c.flag('odete_leito'), text: 'Se tem leito pra mãe do vereador, tem pro Jonathan.', reply: '(longa pausa) ...Eu mereci essa.' },
          // [validar] fratura exposta de fêmur com choque hemorrágico: controle do sangramento, sangue e cirurgia
          { id: 'd18_choque', kind: 'bom', text: 'Ele tá em choque, sangrando pela fratura. Precisa de sangue e de cirurgião agora. Recebe na sala vermelha; o centro cirúrgico abre quando ele estabilizar.' },
          { id: 'd18_novo', kind: 'meio', text: 'Ele tem vinte e seis anos, Saulo.' },
          { id: 'd18_culpa', kind: 'ruim', tag: 'ameaca', text: 'Se ele morrer, é com você.' },
        ],
      },
    ],
    aceita: 'Manda.',
  },

  // ---------------------------------------------------------------- D19 — infarto (07:10), Regional sem vaga
  d19_infarto: {
    recurso: 'hemodinâmica (cateterismo)',
    start: 4,
    objections: [
      {
        id: 'd19_capela',
        say: 'Saulo. Regional a cento e sessenta por cento, {reg}. Tem maca no corredor até a porta da capela. Infarto? Segura na UPA.',
        cards: [
          // [validar] IAM com supra: reperfusão (cateterismo) em até 90 min da chegada; UPA sem hemodinâmica não é destino
          { id: 'd19_cate', kind: 'bom', text: 'Infarto com supra não fica na UPA: precisa de cateterismo em noventa minutos. Recebe na sala vermelha, solta a maca, e a hemodinâmica chama.' },
          { id: 'd19_cheio', kind: 'meio', text: 'Eu sei que tá cheio.' },
          { id: 'd19_problema', kind: 'ruim', text: 'Não é problema meu.' },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- D19 — CLÍMAX: Dona Cida, 18:30
  d19_cida: {
    recurso: 'tomografia e trombólise',
    especial: 'cida',
    fixo: true,
    start: (c) => (c.flag('saulo_leito_cida') ? 0 : 3),
    intro: [{ who: 'NARRADOR', t: 'O telefone do Regional toca antes de você pegar. A Simone não fica cinza: ela levanta e para de pé atrás da sua cadeira. Na outra linha, em espera, a respiração da Dona Cida.' }],
    objections: [
      {
        id: 'd19c_fila',
        say: 'Saulo. AVC? A tomo tá com fila de três, {reg}.',
        cards: [
          // [validar] AVC na janela: tomografia sem fila e trombólise; "tempo é cérebro"
          { id: 'd19c_janela', kind: 'bom', text: 'Ela tá dentro da janela, Saulo. Começou às dezoito e quinze. Tomografia e trombólise. Não dá pra fila.' },
          { id: 'd19c_idosa', kind: 'meio', text: 'Ela tem setenta e nove anos.' },
          { id: 'd19c_furar', kind: 'ruim', text: 'Fura a fila e pronto.' },
        ],
      },
      {
        id: 'd19c_quem',
        after: ['d19c_janela'],
        when: (c) => conf(c) >= 2,
        say: '...Quem é ela?',
        cards: [
          { id: 'd19c_voz', kind: 'bom', text: 'Uma senhora que ligava todo dia pra Regulação só pra ouvir uma voz.' },
          { id: 'd19c_paciente', kind: 'meio', text: 'Uma paciente como as outras.' },
          { id: 'd19c_importa', kind: 'ruim', text: 'Que diferença faz?' },
        ],
      },
    ],
    aceita: (c) =>
      c.flag('saulo_leito_cida')
        ? '{nome}? É ela? A senhora que não tinha ligado? ...Então manda. Eu recebo. Pelo nome dela. (crec) O leito tá aqui desde o almoço, com uma bolacha em cima pra ninguém pegar.'
        : conf(c) >= 2
          ? '(pausa) Manda. Põe o nome dela na ficha inteiro. Eu quero ler.'
          : 'Manda. A tomo eu seguro.',
    depois: [{ who: 'SIMONE', t: '(cola um post-it azul escrito à mão no seu monitor: "CIDA — VAGA ZERO — {hora}". Embaixo, menor:) Ela ia gostar de saber que foi você.' }],
  },

  // ---------------------------------------------------------------- D20 — o Henrique (não denunciado)
  d20_final: {
    recurso: 'UTI',
    especial: 'henrique',
    start: 0,
    fixo: true,
    aceita: 'É o Henrique, né? Do noturno? (sem crec) Manda. Eu conheço o Henrique. Ele me ligava às três da manhã pra perguntar se tinha vaga. Não tinha paciente. Era só pra perguntar. Eu achava que vocês sabiam.',
    objections: [],
  },
  d20_final_rua: {
    recurso: 'UTI',
    start: 0,
    fixo: true,
    aceita: 'Parada revertida na rua? Manda. Hoje eu recebo o que vier, {reg}.',
    objections: [],
  },
  d20_faca: {
    recurso: 'cirurgião e centro cirúrgico',
    start: 3,
    objections: [
      {
        id: 'd20f_pm',
        say: 'Saulo. Facada? Com a PM atrás? Meu corredor não é delegacia, {reg}.',
        cards: [
          // [validar] ferimento penetrante de abdome com choque: cirurgia de urgência
          { id: 'd20f_cirurgia', kind: 'bom', text: 'Facada no abdome com choque é centro cirúrgico, não delegacia. A PM fica na porta. Ele precisa de cirurgião agora.' },
          { id: 'd20f_novo', kind: 'meio', text: 'Ele é só um rapaz, Saulo.' },
          { id: 'd20f_bandido', kind: 'ruim', text: 'Bandido também é gente, né?' },
        ],
      },
    ],
  },
  d20_edema: {
    recurso: 'ventilação e UTI',
    start: 3,
    objections: [
      {
        id: 'd20e_upa',
        say: 'Saulo. Edema agudo? A UPA tem furosemida, {reg}.',
        cards: [
          // [validar] edema agudo de pulmão com insuficiência respiratória: ventilação não invasiva/IOT e UTI
          { id: 'd20e_vent', kind: 'bom', text: 'Ele tá se afogando: espuma na boca, saturação caindo. Precisa de ventilação, talvez tubo, e de UTI. A UPA estabiliza e me devolve a mesma ligação daqui a uma hora.' },
          { id: 'd20e_velho', kind: 'meio', text: 'Ele tem setenta e oito anos.' },
          { id: 'd20e_furo', kind: 'ruim', text: 'Furosemida eu também sei dar.' },
        ],
      },
    ],
  },
};

export const VAGAZERO: VagaZeroContent = {
  calls: CALLS,
  generic: GENERIC,
  sujos: SUJOS,
  recursoDe,
  abertura: 'PS do Regional, Saulo. (crec) Vaga zero? De novo? Fala, {reg}.',
  falas: {
    peixoto: [
      { who: 'PEIXOTO', t: '(interfone) Me passa.' },
      { who: 'PEIXOTO', t: '(liga) Saulo? Peixoto. ...Eu sei. Eu sei do quarto andar, Saulo. Recebe.' },
      { who: 'PEIXOTO', t: '(desliga) Recebeu. Uma por dia, {dr}. Só uma.' },
    ],
    peixotoCobra: 'E o painel tá vermelho de USA hoje. Isso vai na conta, {dr}. (você sente o peso: Desgaste +2)',
    peixotoEndureceu: '(interfone) Negocia ou desvia, {dr}. Hoje eu não ligo pra ninguém.',
    peixotoFonte: [
      { who: 'PEIXOTO', t: '(interfone) Manda as que precisar. E me passa todas. Hoje eu ligo pra quantas forem.' },
      { who: 'PEIXOTO', t: '(liga) Saulo. Recebe. Depois a gente conversa sobre a folha. ...Recebeu, {dr}.' },
    ],
    heloisa: [
      { who: 'HELOÍSA', t: '(interfone) Me passa o plantonista.' },
      { who: 'HELOÍSA', t: 'Doutor Saulo, aqui é a Dra. Heloísa Rangel, coordenação. Eu estou gravando a ligação e anotando o horário. Receba o paciente.' },
    ],
    diretor: [
      { who: 'SIMONE', t: '(já discando) O Peixoto não pode, é o pai dele. Eu ligo pro diretor clínico. Ele me deve um favor de dois mil e dezenove.' },
      { who: 'SIMONE', t: '(baixinho, no fone) Doutor Amaral? Simone, da Regulação. É o Seu Osvaldo. ...É. Isso. (desliga) Ele vai descer.' },
    ],
    diretorFalhou: '(a Simone desliga devagar) Caixa postal, {dr}. Duas vezes.',
    peixotoFalhou: '(o interfone chia) O Saulo não atendeu, {dr}. Tá na sala vermelha. Vou tentar de novo daqui a pouco.',
    aceita: 'Manda.',
    recusa: 'Não dá, {reg}. Fica na prancha de vocês até sair maca.',
    pavio: 'Regulação? Caiu? ...Tô com gente morrendo aqui.',
    mentiraDescoberta: 'Saulo, do Regional. Parando? Ele tá comendo bolacha comigo, {reg}. Da próxima vez, eu peço o eletro antes.',
    promessaLembra: 'Da outra vez você prometeu buscar, {reg}.',
    promessaBuscar: 'Saulo, do Regional. A {exame} de {paciente} veio limpa, acordou bem. Vocês vêm buscar, como combinado?',
    promessaCumprida: 'Saulo. Chegou a USB pra buscar. (crec) Você cumpre o que fala, {reg}. Anotado.',
    promessaQuebrada: 'Saulo. Ninguém veio buscar. Tá anotado também, {reg}.',
    precisouChefe: 'Precisou do chefe, {reg}?',
    simoneDicaPeixoto: 'Se ele empacar, tem o Peixoto. Mas o Peixoto só pega uma por dia. E cobra.',
    postit: '(a Simone cola um post-it azul no seu monitor: "VAGA ZERO ✓ {hora}")',
  },
};
