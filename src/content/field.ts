// =============================================================================
// Intervenção: ocorrências do plantão extra na USA 01 (Seu Bené no volante,
// Enf. Márcio atrás). Cada caso tem o despacho da Regulação, a cena, os sinais
// vitais reais e as ações possíveis: o que salva (critico), o que ajuda, o que
// só gasta tempo (neutro) e o que piora (dano).
//
// 1.1:
// - toda USA sai em QRR 3 (QRR 2 é a USB quando é urgente);
// - oxigênio só quando o jogador escolhe: `oxy` diz a saturação em ar ambiente
//   e o motor gera cateter / Venturi / reservatório / intubação com o efeito
//   certo para cada caso (DPOC 88–92%; infarto só com SpO2 < 90%);
// - parada com ritmo (`arrest`): o monitor desenha, o jogador interpreta;
// - história própria das noites: as ocorrências com `story` (fim do arquivo).
//
// Condutas conferidas com as notas de campo dos protocolos (docs/fontes/) e
// os manuais (ACLS, PALS, PHTLS, ATLS). Doses só onde a fonte é padronizada.
// Tudo aqui é para jogo e precisa da validação da equipe médica.
// =============================================================================
import type { FieldCaseX, StoryCtx, StoryLine } from '../engine/field';

const SHOCK = ['FV', 'TV'] as const;
const CHOQUE_ERRADO =
  'Choque num ritmo que não é chocável: o corpo pula, o traçado não muda, e foram segundos de peito parado. Choque é para FV e TV sem pulso. Linha reta ou ritmo organizado sem pulso: compressão e adrenalina.';
const CAGADA_ERRADO =
  'Cabos no lugar, ganho no máximo, outra derivação: o traçado continua o mesmo. O CA-GA-DA serve para confirmar uma linha reta; este traçado não é linha reta.';
const AMIO_ERRADO = 'Amiodarona é para FV ou TV sem pulso que não saiu com o choque. Neste ritmo ela não ajuda.';

/** ocorrências avulsas (sorteadas a cada noite) */
export const FIELD_POOL: FieldCaseX[] = [
  // ---------------------------------------------------------------------------
  {
    id: 'iam_inferior',
    title: 'Infarto inferior com pressão baixa',
    qrr: 3,
    radio: '{unit}, QRR 3. QTH Rua Tiradentes, 742, Vila Nova. Homem, 61 anos, dor no peito há 40 minutos, suando frio. A esposa diz que "é o jantar".',
    addr: { rua: 'Rua Tiradentes', n: 742, bairro: 'Vila Nova' },
    scene: { place: 'sala', light: 'noite', patient: { pose: 'sentado', age: 'idoso', sex: 'M', skin: 'palido', signs: ['suor', 'mao_no_peito'] }, props: ['remedios', 'sofa'], cast: [{ role: 'esposa', act: 'mao_na_boca', at: 'fundo', age: 'idoso' }] },
    see: ['Seu Lauro, 61, sentado no sofá, a mão fechada no peito. Pálido, molhado de suor.', 'A esposa: "Ele tomou o remédio de pressão à tarde e disse que era o jantar."'],
    vitals: { pa: '86x54', fc: '48', fr: '20', sat: '95%', glic: '132', ritmo: 'Supra de ST em DII, DIII e aVF' },
    oxy: { sat: 95, need: 90, iam: true },
    start: 72,
    decay: 0.9,
    actions: [
      { id: 'ecg', label: 'Monitor e ECG de 12 derivações', group: 'circ', cost: 7, kind: 'critico', shows: ['pa', 'fc', 'sat', 'ritmo'], focus: 'peito', scene: { patient: { gear: ['eletrodos'] } }, say: 'ECG: supradesnível de ST em DII, DIII e aVF. Infarto inferior. PA 86x54, FC 48, saturação 95%.' },
      { id: 'aas', label: 'AAS 300 mg mastigado', group: 'med', cost: 3, kind: 'critico', say: 'Ele mastiga o AAS e faz careta. "Amargo, {dr}."' },
      { id: 'clopi300', label: 'Clopidogrel 300 mg (até 75 anos)', group: 'med', cost: 3, kind: 'critico', until: ['clopi75'], say: 'Quatro comprimidos de 75 mg, junto com o AAS. Aos 61 anos, a dose de ataque é 300 mg.' },
      { id: 'clopi75', label: 'Clopidogrel 75 mg (acima de 75 anos)', group: 'med', cost: 3, kind: 'neutro', until: ['clopi300'], satisfies: 'clopi300', say: 'Um comprimido só. Aos 61 anos é pouco: 75 mg é a dose de quem tem mais de 75. Até 75 anos, o ataque é de 300 mg. Antiagregou, mas devagar.' },
      { id: 'acesso', label: 'Acesso venoso', group: 'circ', cost: 6, kind: 'critico', focus: 'maos', scene: { patient: { gear: ['soro'] } }, say: 'Acesso no antebraço. Com a pressão baixa, soro em pequenas alíquotas, olhando o pulmão.' },
      { id: 'cabeceira', label: 'Cabeceira a 45°, acalmar', group: 'exp', cost: 2, kind: 'ajuda', delta: 4, say: 'O Márcio ajeita as almofadas. Ele respira um pouco mais devagar.' },
      { id: 'glicemia', label: 'Glicemia capilar', group: 'neuro', cost: 3, kind: 'info', shows: ['glic'], focus: 'maos', say: 'Glicemia 132. Não é isso.' },
      { id: 'dinitrato', label: 'Dinitrato sublingual', group: 'med', cost: 3, kind: 'dano', delta: -24, scene: { patient: { pose: 'deitado', age: 'idoso', sex: 'M', skin: 'cinza', signs: ['suor', 'olhos_fechados'] } }, say: 'A pressão despenca: 62x38. Ele fica cinza e apaga por um instante. Nitrato é contraindicado com PAS < 90, FC < 50 e no infarto inferior.' },
    ],
    dest: ['REG'],
    destNote: { UPA: 'A UPA não tem hemodinâmica: infarto com supra vai para o Regional, avisando antes.' },
    debrief:
      'Infarto inferior com pressão baixa e frequência lenta. O que salva: ECG cedo, AAS 300 mg mastigado com clopidogrel (300 mg até 75 anos; 75 mg acima), acesso e transporte para a hemodinâmica do Regional, avisando antes. O nitrato derruba a pressão justamente neste infarto (proibido com PAS < 90, FC < 50 ou infarto inferior). Oxigênio só se a saturação estiver abaixo de 90%: aqui estava em 95%.',
    source: 'SAV AC17 (síndrome coronariana) · fichas de AAS, clopidogrel e dinitrato',
    crew: ['BENÉ: O Regional tá com a hemodinâmica aberta hoje. Eu vi o Dr. Castro levar um ontem.', 'MÁRCIO: {Dr}, ele tá com 48 de frequência. Bradicárdico.'],
  },
  // ---------------------------------------------------------------------------
  {
    id: 'pcr_fv',
    title: 'Parada cardíaca: fibrilação ventricular',
    qrr: 3,
    radio: '{unit}, QRR 3, prioridade absoluta. QTH Av. Brasil, 3720, Centro, ponto de ônibus. Homem caído, não respira. Um rapaz já está fazendo massagem.',
    addr: { rua: 'Av. Brasil', n: 3720, bairro: 'Centro' },
    scene: {
      place: 'ponto_onibus',
      light: 'noite',
      patient: { pose: 'deitado', age: 'adulto', sex: 'M', skin: 'cianose', signs: ['olhos_fechados'] },
      cast: [{ role: 'curioso', act: 'rcp', sex: 'M', wear: 'lanchonete' }, { role: 'curioso', act: 'filmando', at: 'fundo' }, { role: 'curioso', act: 'mao_na_boca', at: 'fundo' }],
    },
    see: ['Um homem de uns cinquenta anos no chão do ponto, roxo. Um rapaz de uniforme de lanchonete comprime o peito dele, contando alto.', '"Ele caiu do nada! Eu vi na TV que tinha que apertar!"'],
    vitals: { pa: '—', fc: '0', fr: '0', sat: '—', ritmo: 'Fibrilação ventricular' },
    vitalsAfter: { pa: '102x64', fc: '96', fr: '12', sat: '94%', ritmo: 'Sinusal depois do choque' },
    arrest: { start: 'FV' },
    start: 62,
    decay: 1.3,
    treatOnScene: true,
    actions: [
      {
        id: 'rcp',
        label: 'Assumir as compressões (30:2)',
        group: 'circ',
        cost: 4,
        kind: 'critico',
        delta: 6,
        focus: 'peito',
        // a equipe assume: o rapaz da lanchonete dá um passo atrás
        scene: { cast: [{ role: 'socorrista', act: 'rcp' }, { role: 'socorrista', act: 'ventilando', at: 'cabeca' }, { role: 'curioso', act: 'olhando', at: 'fundo', sex: 'M', wear: 'lanchonete' }, { role: 'curioso', act: 'filmando', at: 'fundo' }], patient: { gear: ['ambu'] } },
        say: 'O Márcio assume: 100 a 120 por minuto, 5 a 6 centímetros, deixando o peito voltar. O Bené prepara a bolsa-válvula-máscara.',
      },
      { id: 'monitor', label: 'Pás do monitor: ver o ritmo', group: 'circ', cost: 5, kind: 'critico', shows: ['ritmo', 'fc'], scene: { patient: { gear: ['eletrodos'] } }, say: 'Pás no peito, pausa curta. O traçado aparece na tela. Pulso carotídeo: ausente. Leia o monitor.' },
      { id: 'choque', label: 'Desfibrilar (200 J bifásico)', group: 'circ', cost: 4, kind: 'critico', needs: ['monitor'], when: [...SHOCK], wrongSay: CHOQUE_ERRADO, delta: 18, say: '"Todos afastados!" Choque. O Márcio volta direto às compressões, dois minutos antes de olhar o ritmo de novo.' },
      { id: 'cagada', label: 'CA-GA-DA (cabos, ganho, derivação)', group: 'circ', cost: 4, kind: 'neutro', needs: ['monitor'], when: ['ASSISTOLIA'], wrongSay: CAGADA_ERRADO, wrongDelta: -3, say: 'Linha reta confirmada.' },
      { id: 'acesso', label: 'Acesso venoso', group: 'circ', cost: 6, kind: 'ajuda', focus: 'maos', scene: { patient: { gear: ['soro'] } }, say: 'Acesso no braço, sem parar a massagem.' },
      { id: 'adrenalina', label: 'Adrenalina 1 mg IV', group: 'med', cost: 3, kind: 'critico', needs: ['acesso'], delta: 8, say: 'Adrenalina 1 mg e flush de 20 mL de soro, braço elevado. Repete a cada 3 a 5 minutos.' },
      { id: 'amiodarona', label: 'Amiodarona 300 mg IV', group: 'med', cost: 3, kind: 'critico', needs: ['acesso', 'choque'], when: [...SHOCK], wrongSay: AMIO_ERRADO, wrongDelta: -4, delta: 6, say: 'Amiodarona 300 mg em bolus. Se precisar de novo, a próxima é de 150.' },
      { id: 'intubar', label: 'Intubar antes de tudo', group: 'via', cost: 10, kind: 'neutro', until: ['choque'], say: 'O tubo entra, mas foram dez segundos de peito parado. Na parada, compressão e choque vêm antes da via aérea avançada.' },
      { id: 'pulso', label: 'Parar tudo para sentir o pulso', group: 'circ', cost: 5, kind: 'dano', until: ['choque'], delta: -10, say: 'Pausa longa, nada de pulso. Cada segundo sem compressão derruba a chance de voltar. A checagem é rápida, a cada 2 minutos.' },
    ],
    dest: ['REG'],
    debrief:
      'Fibrilação ventricular: o traçado caótico, sem complexos, é ritmo chocável. Compressões sem parar, choque cedo, adrenalina 1 mg a cada 3 a 5 minutos e amiodarona 300 mg. Massagem de leigo desde o primeiro minuto: o melhor cenário que existe. Intubar não vem antes de compressão e choque.',
    source: 'SAV AC5–AC8 (RCP, AHA 2015) · SBV BC5 · fichas de adrenalina e amiodarona',
    crew: ['BENÉ: O rapaz da lanchonete não parou nem pra respirar. Esse merecia o nome no jornal.', 'MÁRCIO: Trocando a massagem em dez segundos, {dr}.'],
  },
  // ---------------------------------------------------------------------------
  {
    id: 'pcr_assistolia',
    title: 'Parada cardíaca: assistolia que virou FV',
    minDay: 3,
    qrr: 3,
    radio: '{unit}, QRR 3, prioridade absoluta. QTH Rua Goiás, 950, Santa Luzia. Homem, 66, caiu no sofá vendo o jogo. A esposa está fazendo massagem pelo telefone.',
    addr: { rua: 'Rua Goiás', n: 950, bairro: 'Santa Luzia' },
    scene: {
      place: 'sala',
      light: 'noite',
      patient: { pose: 'deitado', age: 'idoso', sex: 'M', skin: 'cianose', signs: ['olhos_fechados'] },
      props: ['tv', 'sofa'],
      cast: [{ role: 'esposa', act: 'rcp', age: 'idoso' }, { role: 'filho', act: 'maos_na_cabeca', at: 'fundo' }],
    },
    see: ['Seu Nelson, 66, no chão da sala, entre o sofá e a TV ligada no jogo. A esposa comprime o peito dele com o telefone no ombro.', '"Tomou o terceiro gol e caiu, {dr}! Eu disse pra ele não assistir!"'],
    vitals: { pa: '—', fc: '0', fr: '0', sat: '—', ritmo: 'Assistolia' },
    vitalsAfter: { pa: '98x60', fc: '104', fr: '12', sat: '93%', ritmo: 'Sinusal depois do choque' },
    arrest: { start: 'ASSISTOLIA', rules: [{ from: 'ASSISTOLIA', to: 'FV', after: ['cagada', 'adrenalina'] }] },
    start: 60,
    decay: 1.2,
    treatOnScene: true,
    actions: [
      { id: 'rcp', label: 'Assumir as compressões (30:2)', group: 'circ', cost: 4, kind: 'critico', delta: 6, focus: 'peito', scene: { cast: [{ role: 'socorrista', act: 'rcp' }, { role: 'socorrista', act: 'ventilando', at: 'cabeca' }, { role: 'esposa', act: 'chorando', at: 'fundo', age: 'idoso' }], patient: { gear: ['ambu'] } }, say: 'O Márcio assume a massagem. A esposa senta no sofá e segura o controle remoto como quem segura um terço.' },
      { id: 'monitor', label: 'Pás do monitor: ver o ritmo', group: 'circ', cost: 5, kind: 'critico', shows: ['ritmo', 'fc'], scene: { patient: { gear: ['eletrodos'] } }, say: 'Pás no peito. O traçado aparece na tela. Pulso carotídeo: ausente. Leia o monitor.' },
      { id: 'cagada', label: 'CA-GA-DA (cabos, ganho, derivação)', group: 'circ', cost: 4, kind: 'critico', needs: ['monitor'], when: ['ASSISTOLIA'], wrongSay: CAGADA_ERRADO, wrongDelta: -3, say: 'Cabos firmes nas pás, ganho no máximo, troca para DII: linha reta em todas. Assistolia confirmada. Volta às compressões.' },
      { id: 'acesso', label: 'Acesso venoso', group: 'circ', cost: 6, kind: 'ajuda', focus: 'maos', scene: { patient: { gear: ['soro'] } }, say: 'Acesso no braço sem parar a massagem.' },
      { id: 'adrenalina', label: 'Adrenalina 1 mg IV', group: 'med', cost: 3, kind: 'critico', needs: ['acesso'], delta: 8, say: 'Adrenalina 1 mg e flush de 20 mL, braço elevado. No ritmo não chocável, ela vem logo, e repete a cada 3 a 5 minutos.' },
      { id: 'choque', label: 'Desfibrilar (200 J bifásico)', group: 'circ', cost: 4, kind: 'critico', needs: ['monitor'], when: [...SHOCK], wrongSay: CHOQUE_ERRADO, delta: 18, say: '"Todos afastados!" Choque. Compressões de novo, dois minutos.' },
      { id: 'amiodarona', label: 'Amiodarona 300 mg IV', group: 'med', cost: 3, kind: 'ajuda', needs: ['acesso', 'choque'], when: [...SHOCK], wrongSay: AMIO_ERRADO, wrongDelta: -4, delta: 4, say: 'Amiodarona 300 mg, para a FV não voltar.' },
      { id: 'parar', label: 'Parar: linha reta não tem jeito', group: 'circ', cost: 3, kind: 'dano', until: ['adrenalina'], delta: -20, say: 'Parada presenciada, massagem desde o primeiro minuto, menos de dez de parada: não é hora de parar. Antes de pensar nisso, CA-GA-DA, adrenalina e causas reversíveis.' },
    ],
    dest: ['REG'],
    debrief:
      'Linha quase reta no monitor: antes de chamar de assistolia, CA-GA-DA (cabos, ganho, outra derivação). Confirmada, é ritmo não chocável: compressões e adrenalina 1 mg logo, sem choque. Depois da adrenalina o traçado virou fibrilação ventricular, e aí sim: choque. O ritmo muda durante a RCP; cada checagem é uma leitura nova. Assistolia costuma ter o pior prognóstico; aqui a parada foi presenciada e a massagem começou cedo.',
    source: 'SAV AC5–AC8 (assistolia, CA-GA-DA; AHA 2015) · AC9 (quando parar) · ficha de adrenalina',
    crew: ['MÁRCIO: Ela fez a massagem certinho, {dr}. Seis minutos, sozinha.', 'BENÉ: A TV ainda tá no jogo. Alguém desliga isso, pelo amor de Deus.'],
  },
  // ---------------------------------------------------------------------------
  {
    id: 'pcr_aesp',
    title: 'Parada cardíaca: AESP por engasgo',
    minDay: 4,
    qrr: 3,
    radio: '{unit}, QRR 3, prioridade absoluta. QTH Rua Quaresmeira, 330, Bela Vista. Homem engasgou no churrasco, ficou roxo e caiu. Não respira.',
    addr: { rua: 'Rua Quaresmeira', n: 330, bairro: 'Bela Vista' },
    scene: {
      place: 'quintal',
      light: 'noite',
      patient: { pose: 'deitado', age: 'adulto', sex: 'M', skin: 'cianose', signs: ['olhos_fechados'] },
      props: ['churrasqueira', 'bexigas', 'mesa'],
      cast: [{ role: 'filho', act: 'rcp' }, { role: 'curioso', act: 'mao_na_boca', at: 'fundo' }, { role: 'crianca', act: 'olhando', at: 'fundo' }],
    },
    see: ['Aniversário de criança no quintal. Seu Afonso, 58, no chão ao lado da churrasqueira, roxo. O genro comprime o peito dele.', '"Ele tava rindo e comendo ao mesmo tempo! Pôs a mão no pescoço e caiu!"'],
    vitals: { pa: '—', fc: '0', fr: '0', sat: '—', ritmo: 'Atividade elétrica sem pulso' },
    vitalsAfter: { pa: '110x70', fc: '112', fr: '14', sat: '92%', ritmo: 'Sinusal' },
    arrest: { start: 'AESP' },
    start: 60,
    decay: 1.2,
    treatOnScene: true,
    actions: [
      { id: 'rcp', label: 'Assumir as compressões (30:2)', group: 'circ', cost: 4, kind: 'critico', delta: 6, focus: 'peito', scene: { cast: [{ role: 'socorrista', act: 'rcp' }, { role: 'socorrista', act: 'ventilando', at: 'cabeca' }, { role: 'curioso', act: 'mao_na_boca', at: 'fundo' }], patient: { gear: ['ambu'] } }, say: 'O Márcio assume. O Bené tenta ventilar: o peito não sobe. "Tá tampado, {dr}."' },
      { id: 'monitor', label: 'Pás do monitor: ver o ritmo', group: 'circ', cost: 5, kind: 'critico', shows: ['ritmo', 'fc'], scene: { patient: { gear: ['eletrodos'] } }, say: 'Pás no peito. O traçado aparece na tela. O Márcio procura o pulso carotídeo: nada. Leia o monitor.' },
      { id: 'choque', label: 'Desfibrilar (200 J bifásico)', group: 'circ', cost: 4, kind: 'dano', needs: ['monitor'], when: [...SHOCK], wrongSay: CHOQUE_ERRADO, say: 'Choque.' },
      { id: 'cagada', label: 'CA-GA-DA (cabos, ganho, derivação)', group: 'circ', cost: 4, kind: 'neutro', needs: ['monitor'], when: ['ASSISTOLIA'], wrongSay: CAGADA_ERRADO, wrongDelta: -3, say: 'Linha reta confirmada.' },
      { id: 'acesso', label: 'Acesso venoso', group: 'circ', cost: 6, kind: 'ajuda', focus: 'maos', scene: { patient: { gear: ['soro'] } }, say: 'Acesso no braço sem parar a massagem.' },
      { id: 'adrenalina', label: 'Adrenalina 1 mg IV', group: 'med', cost: 3, kind: 'critico', needs: ['acesso'], delta: 6, say: 'Adrenalina 1 mg e flush, braço elevado. Repete a cada 3 a 5 minutos.' },
      { id: 'causas', label: 'Buscar causas reversíveis (5H/5T)', group: 'circ', cost: 4, kind: 'critico', needs: ['monitor'], say: 'Hipovolemia, H+, hipóxia, potássio, hipotermia; trombose, TEP, tamponamento, tensão no tórax, tóxicos. A primeira da lista grita: hipóxia. Ele engasgou e o ar não entra.' },
      { id: 'magill', label: 'Laringoscopia e pinça de Magill', group: 'via', cost: 5, kind: 'critico', after: ['causas'], delta: 20, focus: 'rosto', say: 'Laringoscópio na boca: um pedaço de carne do tamanho de uma ameixa, parado na entrada da laringe. Sai inteiro na pinça. O Bené ventila: agora o peito sobe.' },
      { id: 'amiodarona', label: 'Amiodarona 300 mg IV', group: 'med', cost: 3, kind: 'neutro', needs: ['acesso'], when: [...SHOCK], wrongSay: AMIO_ERRADO, wrongDelta: -4, say: 'Amiodarona.' },
    ],
    dest: ['REG'],
    debrief:
      'Complexos organizados no monitor e nenhum pulso: atividade elétrica sem pulso, ritmo não chocável. Choque não ajuda; compressões, adrenalina e, principalmente, a causa (5H/5T). Aqui era hipóxia por engasgo: tirar o pedaço de carne com a pinça de Magill devolveu o pulso. Na AESP, quem acha a causa trata a parada.',
    source: 'SAV AC5–AC8 (AESP, 5H/5T; AHA 2015) · AC3 (OVACE) · ficha de adrenalina',
    crew: ['BENÉ: A criançada tá vendo, {dr}. Alguém leva eles pra dentro.', 'MÁRCIO: O bolo nem foi cortado ainda.'],
  },
  // ---------------------------------------------------------------------------
  {
    id: 'hipoglicemia',
    title: 'Hipoglicemia (não era bebedeira)',
    qrr: 3,
    radio: '{unit}, QRR 3. QTH Rua Bahia, 230, Centro, em frente à farmácia. Homem caído, "bêbado", segundo quem ligou. Não responde direito.',
    addr: { rua: 'Rua Bahia', n: 230, bairro: 'Centro' },
    scene: { place: 'calcada', variant: 'farmacia', light: 'noite', patient: { pose: 'encostado', age: 'adulto', sex: 'M', skin: 'palido', signs: ['suor', 'olhos_fechados'] }, props: ['mochila'], cast: [{ role: 'seguranca', act: 'olhando', at: 'fundo' }] },
    see: ['Homem de uns quarenta anos encostado na porta da farmácia fechada, molhado de suor. Resmunga palavras soltas.', 'O segurança: "Tá bêbado, {dr}. Deixa que a PM leva."'],
    vitals: { pa: '128x82', fc: '112', fr: '18', sat: '97%', glic: '31', glasgow: '12' },
    vitalsAfter: { glic: '118', glasgow: '15', fc: '96' },
    oxy: { sat: 97 },
    start: 70,
    decay: 0.8,
    actions: [
      { id: 'glicemia', label: 'Glicemia capilar', group: 'neuro', cost: 3, kind: 'critico', shows: ['glic'], focus: 'maos', say: 'Glicemia: 31 mg/dL.' },
      { id: 'sinais', label: 'Sinais vitais e Glasgow', group: 'neuro', cost: 4, kind: 'info', shows: ['pa', 'fc', 'fr', 'sat', 'glasgow'], say: 'PA 128x82, FC 112, FR 18, saturação 97%. Glasgow 12: abre o olho ao chamado, fala confuso.' },
      { id: 'mochila', label: 'Olhar a mochila', group: 'exp', cost: 3, kind: 'info', focus: 'objeto', scene: { props: ['mochila', 'caneta_insulina'] }, say: 'Na mochila: uma caneta de insulina e um sanduíche intacto, ainda no plástico. Confirma o que a glicemia já disse.' },
      { id: 'acesso', label: 'Acesso venoso', group: 'circ', cost: 6, kind: 'critico', focus: 'maos', scene: { patient: { gear: ['soro'] } }, say: 'Acesso no dorso da mão. Ele tenta puxar o braço.' },
      {
        id: 'glicose',
        label: 'Glicose 50% IV (30–50 mL)',
        group: 'med',
        cost: 4,
        kind: 'critico',
        needs: ['glicemia', 'acesso'],
        delta: 30,
        scene: { patient: { pose: 'encostado', skin: 'normal', signs: ['suor'] } },
        say: 'Glicose 50% em bolus. Em dois minutos ele pisca e olha em volta: "Onde eu tô? Eu tomei a insulina e não jantei. Moro sozinho, {dr}." Nova glicemia: 118.',
      },
      { id: 'pm', label: 'Deixar com a PM (embriaguez)', group: 'cena', cost: 3, kind: 'dano', until: ['glicose'], delta: -22, scene: { patient: { pose: 'caido' } }, say: 'O segurança ri. O homem para de resmungar e escorrega no chão. Isso não é sono. Todo "bêbado" desacordado merece uma glicemia.' },
    ],
    dest: ['UPA', 'REG'],
    destNote: {
      LOCAL: 'Ele acordou, mas toma insulina, não jantou e mora sozinho: a insulina continua agindo e a glicose cai de novo antes do sol. Ele mesmo contou ao acordar. Vai para observação.',
    },
    debrief:
      'Hipoglicemia, não bebedeira. Suor frio e confusão: a glicemia capilar é o primeiro exame de quem parece bêbado ou está desacordado. Glicose 50% na veia e nova glicemia. Quem trata certo não precisa da mochila (ela só confirma). Ao acordar, ele conta que usa insulina, não jantou e mora sozinho: vai para observação, não para casa.',
    source: 'SAV AC29 (hipoglicemia) · AC25 (inconsciência)',
    crew: ['MÁRCIO: {Dr}, ele não tem cheiro de bebida nenhum.', 'BENÉ: Esse segurança já mandou três "bêbados" pra delegacia este mês.'],
  },
  // ---------------------------------------------------------------------------
  {
    id: 'avc',
    title: 'AVC dentro da janela',
    qrr: 3,
    radio: '{unit}, QRR 3. QTH Rua Ipê, 410, Jardim Norte. Mulher, 67, a filha diz que a boca entortou e a fala enrolou. Começou há uns 40 minutos.',
    addr: { rua: 'Rua Ipê', n: 410, bairro: 'Jardim Norte' },
    scene: { place: 'sala', light: 'noite', patient: { pose: 'sentado', age: 'idoso', sex: 'F', skin: 'normal', signs: ['face_torta', 'braco_caido'] }, props: ['tv', 'sofa'], cast: [{ role: 'filha', act: 'segurando_mao' }] },
    see: ['Dona Neusa, 67, sentada no sofá, a boca puxada para um lado. Tenta falar e a palavra sai embolada.', 'A filha: "Ela tava lavando a louça e conversando comigo!"'],
    vitals: { pa: '178x96', fc: '88', fr: '16', sat: '96%', glic: '104', glasgow: '15' },
    oxy: { sat: 96 },
    start: 80,
    decay: 0.6,
    scoop: true,
    actions: [
      { id: 'glicemia', label: 'Glicemia capilar', group: 'neuro', cost: 3, kind: 'critico', shows: ['glic'], focus: 'maos', say: 'Glicemia 104. Não é hipoglicemia imitando AVC.' },
      { id: 'hora', label: 'Perguntar quando foi vista bem pela última vez', group: 'neuro', cost: 3, kind: 'critico', say: 'A filha: "Faz uma hora ela tava lavando a louça e conversando. Uns vinte minutos depois a boca entortou." Dentro da janela para o trombolítico.' },
      { id: 'cincinnati', label: 'Escala de Cincinnati', group: 'neuro', cost: 4, kind: 'critico', focus: 'rosto', say: 'Sorriso torto, braço direito cai, fala arrastada: as três alterações.' },
      { id: 'sinais', label: 'Sinais vitais', group: 'circ', cost: 4, kind: 'info', shows: ['pa', 'fc', 'fr', 'sat', 'glasgow'], say: 'PA 178x96, FC 88, FR 16, saturação 96%, Glasgow 15.' },
      { id: 'acesso', label: 'Acesso no braço que não está fraco', group: 'circ', cost: 6, kind: 'ajuda', delta: 2, focus: 'maos', scene: { patient: { gear: ['soro'] } }, say: 'Acesso no braço esquerdo, o bom.' },
      { id: 'aas', label: 'AAS 300 mg', group: 'med', cost: 3, kind: 'dano', delta: -18, say: 'Sem tomografia ninguém sabe se é entupimento ou sangramento. Se for sangramento, o AAS piora. No AVC não se dá AAS antes da imagem.' },
      { id: 'pressao', label: 'Baixar a pressão (captopril)', group: 'med', cost: 3, kind: 'dano', delta: -14, say: 'A pressão cai e o braço fica mais fraco. No AVC não se baixa a pressão na rua, salvo PAS > 220 ou PAD > 120.' },
    ],
    dest: ['REG'],
    destNote: { UPA: 'A UPA não tem tomografia nem trombolítico de AVC: tempo é cérebro, direto para o Regional.' },
    debrief: 'AVC dentro da janela. O que importa é tempo: glicemia para afastar hipoglicemia, a hora em que foi vista bem pela última vez, Cincinnati e transporte direto para o Regional, avisando o protocolo de AVC. Sem AAS e sem baixar a pressão antes da tomografia. Saturação 96%: oxigênio não muda nada.',
    source: 'SAV AC21 (AVC) · AP29 (Cincinnati) · AC19',
    crew: ['BENÉ: Regional avisado? Eu conheço o caminho sem semáforo.', 'MÁRCIO: A filha quer ir junto. Cabe.'],
  },
  // ---------------------------------------------------------------------------
  {
    id: 'asma_crianca',
    title: 'Asma grave em criança',
    qrr: 3,
    radio: '{unit}, QRR 3. QTH Rua das Palmeiras, 312, Vila Esperança. Menina de 9 anos com falta de ar, fala cortado, a bombinha acabou.',
    addr: { rua: 'Rua das Palmeiras', n: 312, bairro: 'Vila Esperança' },
    scene: { place: 'quarto', light: 'noite', patient: { pose: 'curvado', age: 'crianca', sex: 'F', skin: 'palido', signs: ['tiragem', 'respira_rapido'] }, props: ['bombinha', 'cama'], cast: [{ role: 'mae', act: 'olhando', at: 'fundo' }] },
    see: ['Kauane, 9, sentada na beira da cama, os ombros subindo a cada respiração. As costelas afundam. Fala duas palavras e para.', 'A mãe sacode a bombinha vazia: "Acabou ontem. O posto só tem na segunda."'],
    vitals: { pa: '104x66', fc: '142', fr: '44', sat: '88%' },
    vitalsAfter: { fr: '32', fc: '128' },
    oxy: { sat: 88 },
    start: 64,
    decay: 1.0,
    actions: [
      { id: 'oximetro', label: 'Oxímetro e frequência', group: 'resp', cost: 3, kind: 'critico', shows: ['sat', 'fc', 'fr'], focus: 'maos', scene: { patient: { gear: ['oximetro'] } }, say: 'Saturação 88%, FC 142, FR 44. Asma muito grave.' },
      { id: 'broncodilatador', label: 'Salbutamol com espaçador (série)', group: 'med', cost: 5, kind: 'critico', delta: 16, scene: { patient: { pose: 'sentado', skin: 'normal', signs: ['respira_rapido'] } }, say: 'Primeira série no espaçador com máscara. Aparece um chiado: bom sinal, o ar voltou a passar. Repete a cada 20 minutos.' },
      { id: 'corticoide', label: 'Corticoide (hidrocortisona IV)', group: 'med', cost: 3, kind: 'ajuda', needs: ['acesso'], delta: 5, say: 'Corticoide na primeira hora, para a crise não voltar.' },
      { id: 'acesso', label: 'Acesso venoso', group: 'circ', cost: 7, kind: 'ajuda', focus: 'maos', scene: { patient: { gear: ['soro'] } }, say: 'Veia fina, segunda tentativa. Ela chora, o que gasta ar.' },
      { id: 'agua', label: 'Nebulizar com água destilada', group: 'med', cost: 4, kind: 'dano', delta: -14, say: 'O chiado piora. Água destilada irrita o brônquio: o veículo da nebulização é soro fisiológico.' },
      { id: 'deitar', label: 'Deitar a menina para descansar', group: 'exp', cost: 2, kind: 'dano', until: ['broncodilatador'], delta: -10, scene: { patient: { pose: 'cama', skin: 'palido', signs: ['tiragem', 'respira_rapido'] } }, say: 'Deitada, ela puxa o ar pior ainda e senta sozinha, assustada. Falta de ar: sentada.' },
    ],
    dest: ['REG', 'UPA'],
    debrief: 'Asma muito grave: frases cortadas, tiragem e saturação 88%. Oxigênio até 94% ou mais (a máscara de Venturi ou a com reservatório chegam lá; o cateter não), broncodilatador em série com espaçador e corticoide na primeira hora. Sempre sentada; nebulização nunca com água destilada.',
    source: 'SAV AC22 (asma) · APed19 · SBV BC10 · AP15–AP17 (dispositivos de O2)',
    crew: ['MÁRCIO: Ela tá cansando, {dr}. Olha o pescoço.', 'BENÉ: Terceira criança com bombinha vazia esta semana.'],
  },
  // ---------------------------------------------------------------------------
  {
    id: 'dpoc',
    title: 'DPOC exacerbado',
    minDay: 2,
    qrr: 3,
    radio: '{unit}, QRR 3. QTH Rua Marechal Deodoro, 2810, Vila Nova. Homem, 72, falta de ar que piorou desde ontem, chiando, lábio roxo. A filha diz que ele "tem enfisema".',
    addr: { rua: 'Rua Marechal Deodoro', n: 2810, bairro: 'Vila Nova' },
    scene: { place: 'quarto', light: 'noite', patient: { pose: 'curvado', age: 'idoso', sex: 'M', skin: 'cianose', signs: ['respira_rapido', 'tiragem'] }, props: ['cama', 'remedios', 'bombinha'], cast: [{ role: 'filha', act: 'olhando', at: 'fundo' }] },
    see: ['Seu Jurandir, 72, sentado na beira da cama, inclinado para a frente com as mãos nos joelhos. Lábios arroxeados, sopra o ar devagar pela boca franzida. Um cinzeiro limpo demais na janela.', 'A filha: "Fumou quarenta anos. Parou faz dois. Diz ele."'],
    vitals: { pa: '150x90', fc: '112', fr: '30', sat: '84%', temp: '37,6 °C', glasgow: '15' },
    vitalsAfter: { fr: '24', fc: '100' },
    oxy: { sat: 84, copd: true },
    start: 70,
    decay: 0.8,
    actions: [
      { id: 'sinais', label: 'Sinais vitais e oxímetro', group: 'resp', cost: 4, kind: 'info', shows: ['pa', 'fc', 'fr', 'sat', 'temp', 'glasgow'], scene: { patient: { gear: ['oximetro'] } }, say: 'PA 150x90, FC 112, FR 30, saturação 84%, temperatura 37,6 °C. Acordado, Glasgow 15, frases curtas.' },
      { id: 'auscultar', label: 'Auscultar os pulmões', group: 'resp', cost: 3, kind: 'info', focus: 'peito', say: 'Sibilos espalhados, expiração comprida, murmúrio baixo nas bases. Peito de barril.' },
      { id: 'sentado', label: 'Manter sentado, inclinado para a frente', group: 'exp', cost: 2, kind: 'ajuda', delta: 3, say: 'Ele já sabe a posição. O Márcio só põe um travesseiro na frente para ele apoiar os braços.' },
      { id: 'broncodilatador', label: 'Salbutamol + ipratrópio (espaçador)', group: 'med', cost: 5, kind: 'critico', delta: 14, scene: { patient: { pose: 'sentado', skin: 'palido', signs: ['respira_rapido'] } }, say: 'Salbutamol, 4 a 8 jatos no espaçador, junto do ipratrópio. A expiração encurta e o chiado fica mais solto.' },
      { id: 'acesso', label: 'Acesso venoso', group: 'circ', cost: 6, kind: 'ajuda', focus: 'maos', scene: { patient: { gear: ['soro'] } }, say: 'Acesso no antebraço, pele fina de quem usou muito corticoide.' },
      { id: 'corticoide', label: 'Hidrocortisona IV', group: 'med', cost: 3, kind: 'ajuda', needs: ['acesso'], delta: 5, say: 'Corticoide na primeira hora: no DPOC grave, também.' },
      { id: 'deitar', label: 'Deitar para descansar', group: 'exp', cost: 2, kind: 'dano', until: ['broncodilatador'], delta: -10, scene: { patient: { pose: 'cama' } }, say: 'Deitado, ele perde o apoio dos braços e a respiração vira um assobio curto. Ele mesmo senta de volta, irritado.' },
    ],
    dest: ['REG', 'UPA'],
    debrief:
      'DPOC exacerbado. O alvo de saturação é 88 a 92%, não 94%: quem vive com o CO₂ alto respira por causa da falta de oxigênio, e oxigênio demais (máscara com reservatório) faz o CO₂ subir, com sonolência e parada. Venturi titulada (ou cateter com pouco fluxo) até o alvo, broncodilatador com ipratrópio, corticoide, sentado. Intubar não era preciso: ele sustentava.',
    source: 'SAV AC23 (DPOC) · SBV BC10 (alvo de SatO2 88–92%) · AP15–AP17 (cateter, reservatório, Venturi)',
    crew: ['MÁRCIO: Boca franzida, {dr}. Ele mesmo aprendeu a soprar devagar.', 'BENÉ: O cinzeiro tá limpinho. Limpinho demais.'],
  },
  // ---------------------------------------------------------------------------
  {
    id: 'anafilaxia',
    title: 'Anafilaxia com choque',
    qrr: 3,
    radio: '{unit}, QRR 3. QTH Rua dos Bem-te-vis, 77, Bela Vista, salão de festas. Homem, 34, comeu camarão, a boca inchou, falta de ar.',
    addr: { rua: 'Rua dos Bem-te-vis', n: 77, bairro: 'Bela Vista' },
    scene: {
      place: 'salao',
      light: 'noite',
      patient: { pose: 'sentado', age: 'adulto', sex: 'M', skin: 'vermelho', signs: ['inchaco_rosto', 'respira_rapido', 'placas'] },
      props: ['bexigas', 'bolo', 'copo'],
      cast: [{ role: 'curioso', act: 'abanando', sex: 'F' }, { role: 'curioso', act: 'mao_na_boca', at: 'fundo' }, { role: 'crianca', act: 'olhando', at: 'fundo' }],
    },
    see: ['Festa de aniversário. Um homem sentado numa cadeira de plástico, o rosto inchado e vermelho, placas no pescoço. Respira rápido, chiando, mas a voz sai normal.', 'Uma mulher abana ele com um prato: "Ele sabia que não podia comer camarão!"'],
    vitals: { pa: '78x40', fc: '134', fr: '30', sat: '90%' },
    vitalsAfter: { pa: '98x62', fc: '112' },
    oxy: { sat: 90 },
    start: 62,
    decay: 1.2,
    actions: [
      { id: 'adrenalina', label: 'Adrenalina IM na coxa (0,5 mg)', group: 'med', cost: 3, kind: 'critico', delta: 24, say: 'Na face lateral da coxa, por cima da calça mesmo. O Márcio anota a hora no braço da luva.' },
      { id: 'deitar', label: 'Deitar com as pernas elevadas', group: 'exp', cost: 3, kind: 'critico', delta: 6, scene: { patient: { pose: 'deitado' } }, say: 'Deitado no chão do salão, pernas na cadeira. Nada de sentar ou levantar de repente.' },
      { id: 'sinais', label: 'Sinais vitais', group: 'circ', cost: 3, kind: 'info', shows: ['pa', 'fc', 'fr', 'sat'], say: 'PA 78x40, FC 134, FR 30, saturação 90%. Choque.' },
      { id: 'soro', label: 'Acesso e soro fisiológico', group: 'circ', cost: 7, kind: 'ajuda', delta: 8, focus: 'maos', scene: { patient: { gear: ['soro'] } }, say: 'Dois acessos, soro aberto (1 a 2 litros). A pressão começa a subir.' },
      { id: 'antialergico', label: 'Só antialérgico na veia', group: 'med', cost: 4, kind: 'neutro', say: 'Antialérgico não segura anafilaxia. Foram quatro minutos sem o remédio que importa.' },
      { id: 'sentar', label: 'Sentar para respirar melhor', group: 'exp', cost: 2, kind: 'dano', delta: -14, say: 'Ele senta e quase apaga: com a pressão a 78x40, ficar em pé ou sentado pode parar o coração. Deitado, pernas para cima.' },
      { id: 'adrenalina_iv', label: 'Adrenalina IV pura, em bolus', group: 'med', cost: 3, kind: 'dano', delta: -18, say: 'Frequência a 190, dor no peito. Na anafilaxia a adrenalina é na coxa; na veia, só diluída, em infusão lenta e com monitor.' },
    ],
    dest: ['REG', 'UPA'],
    debrief: 'Anafilaxia com choque. Primeiro a adrenalina IM na coxa (0,5 mg no adulto, repetível), deitado com as pernas elevadas, oxigênio até 94% (Venturi ou reservatório) e soro. Antialérgico sozinho não trata; sentar ou levantar pode matar. Voz normal, sem estridor: intubação não estava indicada (seria, cedo, com rouquidão, língua inchada ou estridor).',
    source: 'SAV AC33 (anafilaxia) · SBV BC23 · ficha de adrenalina',
    crew: ['BENÉ: {Dr}, a mulher tá filmando. Faz bonito.', 'MÁRCIO: Lábio desinchando. Ele já fala.'],
  },
  // ---------------------------------------------------------------------------
  {
    id: 'moto_coxa',
    title: 'Hemorragia na coxa (moto)',
    qrr: 3,
    radio: '{unit}, QRR 3. QTH Av. Beira-Rio, 4900, Parque das Exposições. Motociclista caído, sangrando muito na perna. A USB mais perto está em outra ocorrência.',
    addr: { rua: 'Av. Beira-Rio', n: 4900, bairro: 'Parque das Exposições' },
    scene: {
      place: 'rua',
      light: 'noite',
      patient: { pose: 'deitado', age: 'adulto', sex: 'M', skin: 'palido', signs: ['sangue_perna', 'sangue_chao', 'deformidade_perna'], hat: 'capacete', wound: { kind: 'exposta', at: 'perna' } },
      props: ['moto'],
      cast: [{ role: 'motorista', act: 'lanterna', at: 'fundo' }],
    },
    see: ['Um rapaz de jaqueta no asfalto, a perna direita torta. A calça empapada de sangue, uma poça crescendo embaixo da coxa.', 'Um motorista de aplicativo segura uma lanterna: "A moto rodou sozinha, eu vi."'],
    vitals: { pa: '88x60', fc: '128', fr: '26', sat: '94%' },
    oxy: { sat: 94, min: 'reservatorio' },
    start: 58,
    decay: 1.4,
    scoop: true,
    actions: [
      { id: 'compressao', label: 'Compressão direta na coxa', group: 'circ', cost: 3, kind: 'ajuda', delta: 6, focus: 'pernas', scene: { patient: { gear: ['compressa'] } }, say: 'O Márcio aperta com compressas. O sangue encharca. Não tira: põe outra por cima, com mais força.' },
      { id: 'torniquete', label: 'Torniquete acima da ferida', group: 'circ', cost: 4, kind: 'critico', delta: 18, focus: 'pernas', scene: { patient: { gear: ['torniquete'] } }, say: 'Torniquete na raiz da coxa, apertado até o sangramento parar. O Márcio escreve a hora: {hora}.' },
      { id: 'cervical', label: 'Estabilizar a cervical', group: 'via', cost: 4, kind: 'critico', scene: { patient: { hat: null, gear: ['colar'] } }, say: 'O Bené segura a cabeça alinhada. Capacete fora em dupla, colar e prancha.' },
      { id: 'sinais', label: 'Sinais vitais', group: 'circ', cost: 3, kind: 'info', shows: ['pa', 'fc', 'fr', 'sat'], say: 'PA 88x60, FC 128, FR 26, saturação 94%. Choque.' },
      { id: 'acesso', label: 'Acesso e soro moderado', group: 'circ', cost: 6, kind: 'ajuda', delta: 5, shows: ['pa', 'fc'], focus: 'maos', scene: { patient: { gear: ['soro'] } }, say: 'Dois acessos. Soro só até a pressão sistólica de 80 a 90: mais que isso faz sangrar de novo.' },
      { id: 'soro_aberto', label: 'Correr dois litros de soro rápido', group: 'circ', cost: 5, kind: 'dano', delta: -12, say: 'A pressão sobe e o sangue volta a escorrer pelas bordas. No trauma, soro com moderação.' },
      { id: 'osso', label: 'Colocar o osso de volta no lugar', group: 'exp', cost: 4, kind: 'dano', delta: -10, say: 'Ele grita e o sangramento aumenta. Fratura exposta: cobrir, imobilizar como está, nunca recolocar o osso.' },
    ],
    dest: ['REG'],
    debrief: 'Hemorragia de membro: compressão direta primeiro e, se não segura, torniquete logo acima da ferida, apertado, com a hora anotada. Cervical alinhada, oxigênio com reservatório (trauma grave com choque pede alto fluxo) e transporte rápido para o Regional. Soro com moderação (PAS de 80 a 90).',
    source: 'SAV AT1 · AT20 · AT21 · AP19/AP20 · SBV BT14',
    crew: ['BENÉ: Regional avisado do torniquete. Hora anotada?', 'MÁRCIO: Pulso radial sumindo, {dr}.'],
  },
  // ---------------------------------------------------------------------------
  {
    id: 'pneumotorax',
    title: 'Pneumotórax hipertensivo',
    minDay: 3,
    qrr: 3,
    radio: '{unit}, QRR 3. QTH Av. Norte, 1320, Jardim Norte. Carro contra poste. Motorista acordado, muita falta de ar. Bombeiros no local.',
    addr: { rua: 'Av. Norte', n: 1320, bairro: 'Jardim Norte' },
    scene: { place: 'carro', light: 'noite', patient: { pose: 'preso', age: 'adulto', sex: 'M', skin: 'cianose', signs: ['respira_rapido', 'tiragem', 'suor', 'mao_no_peito'] }, cast: [{ role: 'bombeiro', act: 'olhando', at: 'fundo' }] },
    see: ['O volante amassado. O motorista, preso pelo cinto, respira curto e rápido, os lábios roxos. Agarra o peito do lado direito.', 'O bombeiro: "Já desligamos o carro. Pode trabalhar."'],
    vitals: { pa: '76x50', fc: '138', fr: '36', sat: '82%' },
    vitalsAfter: { pa: '98x64', fc: '118' },
    oxy: { sat: 82, min: 'reservatorio' },
    start: 55,
    decay: 1.5,
    scoop: true,
    actions: [
      {
        id: 'cervical',
        label: 'Cervical e retirada do carro',
        group: 'via',
        cost: 5,
        kind: 'critico',
        // fora do carro: deitado no asfalto, o carro contra o poste atrás
        scene: { place: 'rua', props: ['carro', 'poste'], cast: [{ role: 'bombeiro', act: 'segurando_cabeca' }, { role: 'bombeiro', act: 'olhando', at: 'fundo' }], patient: { pose: 'deitado', gear: ['colar'] } },
        say: 'Colar, prancha, os bombeiros ajudam a tirar em bloco.',
      },
      { id: 'auscultar', label: 'Examinar e auscultar o tórax', group: 'resp', cost: 4, kind: 'info', shows: ['sat', 'fr', 'pa', 'fc'], focus: 'peito', say: 'Sem murmúrio à direita, som de tambor na percussão, jugulares cheias. PA 76x50, saturação 82%.' },
      { id: 'descomprimir', label: 'Descompressão com agulha (lado direito)', group: 'resp', cost: 4, kind: 'critico', after: ['auscultar'], delta: 30, scene: { patient: { skin: 'palido', signs: ['respira_rapido'] } }, say: 'Ar sai assobiando pela agulha. A pressão volta: 98x64.' },
      { id: 'acesso', label: 'Acesso venoso', group: 'circ', cost: 6, kind: 'ajuda', delta: 2, focus: 'maos', scene: { patient: { gear: ['soro'] } }, say: 'Acesso calibroso no braço.' },
      { id: 'intubar', label: 'Intubar e ventilar com pressão', group: 'via', cost: 9, kind: 'dano', until: ['descomprimir'], delta: -14, say: 'Ar empurrado para dentro de um tórax que já não tem para onde expandir: a pressão cai mais. Primeiro descomprimir.' },
    ],
    dest: ['REG'],
    debrief: 'Pneumotórax hipertensivo: trauma, choque, murmúrio ausente de um lado, timpanismo, jugulares cheias. A descompressão por agulha do lado afetado tira o paciente da morte; oxigênio com reservatório e transporte rápido para o Regional, onde ele recebe o dreno. Ventilar com pressão antes de descomprimir piora.',
    source: 'SAV AT12 (pneumotórax hipertensivo) · AT1 · ATLS',
    crew: ['BENÉ: Sem cinto ele tinha morrido. Com cinto, quebrou costela.', 'MÁRCIO: Traqueia desviando pra esquerda, {dr}.'],
  },
  // ---------------------------------------------------------------------------
  {
    id: 'parto',
    title: 'Parto iminente em casa',
    qrr: 3,
    radio: '{unit}, QRR 3. QTH Rua São João, 51, Vila Nova. Gestante de 39 semanas, terceiro filho. O marido diz que "tá nascendo".',
    addr: { rua: 'Rua São João', n: 51, bairro: 'Vila Nova' },
    scene: { place: 'quarto', light: 'noite', patient: { pose: 'parto', age: 'adulto', sex: 'F', skin: 'normal', signs: ['gravida', 'suor'] }, props: ['cama'], cast: [{ role: 'marido', act: 'segurando_mao' }] },
    see: ['Jéssica, 27, na cama, agarrada na grade. Uma contração atrás da outra.', '"Eu quero fazer força! Eu PRECISO fazer força!"'],
    vitals: { pa: '122x78', fc: '104', fr: '22', sat: '98%' },
    oxy: { sat: 98 },
    start: 80,
    decay: 0.7,
    actions: [
      { id: 'avaliar', label: 'Avaliar contrações e períneo', group: 'exp', cost: 4, kind: 'critico', say: 'Contração a cada 2 minutos, vontade de fazer força, a cabeça já aparece. Não dá tempo de chegar à Maternidade: o parto é aqui.' },
      { id: 'sinais', label: 'Sinais vitais da mãe', group: 'circ', cost: 3, kind: 'info', shows: ['pa', 'fc', 'fr', 'sat'], say: 'PA 122x78, FC 104, FR 22, saturação 98%. Mãe bem.' },
      { id: 'kit', label: 'Abrir o kit de parto e panos limpos', group: 'exp', cost: 4, kind: 'critico', say: 'Campos, clamps, compressas, manta aluminizada e um cobertor separado para o bebê. O Bené fecha a janela e desliga o ventilador.' },
      { id: 'amparar', label: 'Proteger o períneo e amparar a cabeça', group: 'exp', cost: 5, kind: 'critico', needs: ['avaliar', 'kit'], delta: 12, scene: { patient: { signs: ['suor', 'recem_nascido'] } }, say: 'Uma mão no períneo, a outra segurando a cabeça sem puxar. Ombro de cima, ombro de baixo... nasceu. {hora}.' },
      { id: 'aquecer', label: 'Secar e aquecer o bebê no colo da mãe', group: 'exp', cost: 3, kind: 'critico', needs: ['amparar'], delta: 8, scene: { patient: { pose: 'cama', signs: ['recem_nascido'], gear: ['manta'] } }, say: 'Secou, cobriu a cabeça, pele a pele com a mãe. Ele chora alto. A Jéssica ri e chora junto.' },
      { id: 'clampear', label: 'Clampear o cordão (1 a 3 min depois)', group: 'exp', cost: 3, kind: 'critico', needs: ['aquecer'], say: 'Dois clamps, corte entre eles. Ninguém puxou o cordão.' },
      { id: 'puxar', label: 'Puxar a cabeça do bebê', group: 'exp', cost: 3, kind: 'dano', until: ['amparar'], delta: -18, say: 'Nunca se puxa a cabeça. Ela sai sozinha, com a contração.' },
      { id: 'segurar', label: 'Pedir para ela segurar e correr para a Maternidade', group: 'cena', cost: 3, kind: 'dano', until: ['amparar'], delta: -14, say: 'Não se segura um parto iminente. Com a cabeça aparecendo, o parto se faz no local.' },
      { id: 'placenta', label: 'Puxar o cordão para tirar a placenta', group: 'exp', cost: 3, kind: 'dano', needs: ['amparar'], delta: -8, say: 'Sangramento. A placenta sai sozinha; se sair, vai num saco, junto com a mãe.' },
    ],
    dest: ['MAT'],
    destNote: { REG: 'Mãe e bebê bem depois de um parto normal: o lugar é a Maternidade.', UPA: 'A UPA não tem maternidade: mãe e bebê vão para a Maternidade.' },
    debrief: 'Parto iminente: contrações a cada 2 minutos, vontade de fazer força e cabeça visível. O parto se faz no local: proteger o períneo, nunca puxar a cabeça, secar e aquecer o bebê (cabeça coberta, pele a pele), clampear em 1 a 3 minutos, não puxar o cordão. Mãe e bebê para a Maternidade.',
    source: 'SAV AGO2 · AGO4 · SBV BGO4 · BPed9',
    crew: ['BENÉ: Trinta e um anos de volante, sétimo parto. Nunca acostuma.', 'MÁRCIO: Menino. Três quilos e pouco, no olho.'],
  },
  // ---------------------------------------------------------------------------
  {
    id: 'convulsao',
    title: 'Crise convulsiva que não para',
    qrr: 3,
    radio: '{unit}, QRR 3. QTH Rua Paineira, 300, Santa Luzia. Homem, 28, epiléptico, convulsionando há uns 10 minutos.',
    addr: { rua: 'Rua Paineira', n: 300, bairro: 'Santa Luzia' },
    scene: { place: 'sala', light: 'noite', patient: { pose: 'convulsao', age: 'adulto', sex: 'M', skin: 'palido', signs: ['baba', 'tremor'] }, props: ['mesa'], cast: [{ role: 'irmao', act: 'olhando', hold: 'colher' }] },
    see: ['Um rapaz no chão da sala, o corpo inteiro se sacudindo. Baba espumando no canto da boca. A mesinha de centro virou.', 'O irmão segura uma colher: "Bota na boca dele? Ele vai enrolar a língua!"'],
    vitals: { pa: '150x90', fc: '126', fr: '28', sat: '89%', glic: '96' },
    vitalsAfter: { fc: '104' },
    oxy: { sat: 89 },
    start: 66,
    decay: 1.0,
    actions: [
      { id: 'proteger', label: 'Proteger a cabeça, afastar objetos', group: 'cena', cost: 3, kind: 'critico', scene: { props: [] }, say: 'O Bené tira a mesinha. Uma almofada embaixo da cabeça.' },
      { id: 'aspirar', label: 'Aspirar a boca', group: 'via', cost: 3, kind: 'ajuda', delta: 4, say: 'Aspiração da baba. O ronco diminui.' },
      { id: 'sinais', label: 'Sinais vitais e oxímetro', group: 'circ', cost: 3, kind: 'info', shows: ['pa', 'fc', 'fr', 'sat'], scene: { patient: { gear: ['oximetro'] } }, say: 'PA 150x90, FC 126, FR 28, saturação 89%.' },
      { id: 'glicemia', label: 'Glicemia capilar', group: 'neuro', cost: 3, kind: 'critico', shows: ['glic'], focus: 'maos', say: 'Glicemia 96. Não é hipoglicemia.' },
      { id: 'acesso', label: 'Acesso venoso', group: 'circ', cost: 7, kind: 'ajuda', focus: 'maos', scene: { patient: { gear: ['soro'] } }, say: 'Acesso no braço, com o Márcio segurando sem forçar.' },
      { id: 'diazepam', label: 'Diazepam 10 mg IV lento', group: 'med', cost: 4, kind: 'critico', needs: ['acesso'], delta: 22, scene: { patient: { pose: 'lateral', skin: 'normal', signs: ['olhos_fechados', 'baba'] } }, say: 'Em um minuto a crise para. Ele ronca: pós-ictal. Lateralizado.' },
      { id: 'colher', label: 'Colher na boca para não enrolar a língua', group: 'via', cost: 2, kind: 'dano', until: ['diazepam'], delta: -12, say: 'Um dente quebra e a gengiva sangra. Ninguém engole a língua: nada na boca durante a crise.' },
      { id: 'segurar', label: 'Segurar os braços e as pernas com força', group: 'cena', cost: 3, kind: 'dano', until: ['diazepam'], delta: -8, say: 'Segurar não para a crise e machuca. Só proteger.' },
    ],
    dest: ['REG', 'UPA'],
    debrief: 'Estado de mal epiléptico (crise de mais de 5 minutos). Proteger a cabeça, aspirar, oxigênio porque a saturação está abaixo de 94%, glicemia e benzodiazepínico na veia (diazepam 10 mg lento). Nada na boca, nada de segurar à força. Depois do diazepam ele ronca, mas respira: pós-ictal não é indicação de tubo.',
    source: 'SAV AC26 (convulsão) · ficha de diazepam · SBV BC16',
    crew: ['MÁRCIO: Ficou sem o remédio, {dr}. A caixa tá vazia na pia.', 'BENÉ: O irmão guardou a colher. Bom menino.'],
  },
  // ---------------------------------------------------------------------------
  {
    id: 'bar_faca',
    title: 'Facada no abdome, cena insegura',
    qrr: 3,
    radio: '{unit}, QRR 3. QTH Rua Pará, 1350, Distrito Industrial, Bar do Neno. Homem esfaqueado na barriga. O agressor pode ainda estar no local. COPOM acionado.',
    addr: { rua: 'Rua Pará', n: 1350, bairro: 'Distrito Industrial' },
    unsafe: true,
    scene: {
      place: 'bar',
      light: 'noite',
      patient: { pose: 'caido', age: 'adulto', sex: 'M', skin: 'palido', signs: ['sangue_tronco', 'sangue_chao', 'mao_na_barriga'], wound: { kind: 'facada', at: 'barriga' } },
      props: ['garrafa', 'faca', 'garrafa_quebrada'],
      cast: [{ role: 'garcom', act: 'olhando', at: 'fundo' }, { role: 'curioso', act: 'mao_na_boca', at: 'fundo' }, { role: 'policial', act: 'olhando', at: 'fundo' }],
    },
    // da esquina: a porta do bar, o homem caído e o da garrafa quebrada andando na calçada
    far: {
      place: 'bar_porta',
      light: 'noite',
      patient: { pose: 'caido', age: 'adulto', sex: 'M', skin: 'palido', signs: ['sangue_tronco', 'mao_na_barriga'] },
      cast: [{ role: 'curioso', act: 'gritando', hold: 'garrafa', sex: 'M', at: 'dir' }, { role: 'curioso', act: 'maos_na_cabeca', at: 'fundo' }, { role: 'curioso', act: 'gritando', at: 'fundo' }],
    },
    see: ['Da esquina dá para ver a porta do Bar do Neno: gente gritando, um homem no chão segurando a barriga.', 'Outro homem anda de um lado para o outro na calçada com uma garrafa quebrada na mão.'],
    vitals: { pa: '92x60', fc: '122', fr: '24', sat: '95%' },
    oxy: { sat: 95, min: 'reservatorio' },
    start: 74,
    decay: 0.8,
    scoop: true,
    actions: [
      { id: 'aguardar', label: 'Aguardar a PM a uma quadra (QRX)', group: 'cena', cost: 10, kind: 'ajuda', secures: true, say: 'Vocês param a uma quadra, luzes apagadas. Em três minutos a PM chega e leva o homem da garrafa algemado. "Pode entrar, {dr}."' },
      { id: 'entrar', label: 'Entrar já, o paciente está sangrando', group: 'cena', cost: 3, kind: 'dano', hurts: true, say: 'A garrafa voa da porta. O Márcio leva no ombro e cai. O Bené dá ré. Ninguém atende ninguém até a PM chegar.' },
      { id: 'compressao', label: 'Compressão no ferimento', group: 'circ', cost: 3, kind: 'critico', delta: 6, focus: 'ferida', scene: { patient: { gear: ['compressa'] } }, say: 'Compressas sobre o corte, pressão firme. A faca está no chão, longe.' },
      { id: 'sinais', label: 'Sinais vitais', group: 'circ', cost: 3, kind: 'info', shows: ['pa', 'fc', 'fr', 'sat'], say: 'PA 92x60, FC 122, FR 24, saturação 95%. Sangrando por dentro.' },
      { id: 'acesso', label: 'Acesso e soro moderado', group: 'circ', cost: 6, kind: 'critico', focus: 'maos', scene: { patient: { gear: ['soro'] } }, say: 'Dois acessos. Soro só até a sistólica de 80 a 90.' },
      { id: 'apalpar', label: 'Apalpar a barriga com força', group: 'exp', cost: 3, kind: 'dano', delta: -6, say: 'Ele grita e o sangramento aumenta. Ferida no abdome não se fica apertando para examinar.' },
    ],
    dest: ['REG'],
    debrief: 'Em cena insegura a equipe não entra: espera a polícia a uma distância segura, porque equipe ferida não salva ninguém. Liberada a cena: compressão, oxigênio com reservatório (trauma penetrante com choque), acesso com soro moderado e transporte rápido. Sangramento dentro da barriga se resolve no centro cirúrgico.',
    source: 'PE1 (segurança da cena) · SAV AT1 · AT16',
    crew: ['BENÉ: Esse bar já mandou enfermeiro pro hospital. Não precisa mandar dois.', 'MÁRCIO: Ele tá falando. Bom sinal, mas tá frio.'],
  },
  // ---------------------------------------------------------------------------
  {
    id: 'trote_praca',
    title: 'Trote na Praça da Matriz',
    minDay: 2,
    qrr: 3,
    prank: true,
    radio: '{unit}, QRR 3. QTH Rua XV de Novembro, 1230, Centro, Praça da Matriz. Homem caído no banco da praça, não se mexe, "parece morto".',
    addr: { rua: 'Rua XV de Novembro', n: 1230, bairro: 'Centro' },
    scene: {
      place: 'praca',
      light: 'noite',
      patient: null,
      laughing: true,
      props: ['pipoca'],
      cast: [{ role: 'curioso', act: 'filmando', age: 'adolescente', at: 'fundo' }, { role: 'curioso', act: 'rindo', age: 'adolescente', at: 'fundo' }, { role: 'curioso', act: 'rindo', age: 'adolescente', at: 'fundo' }, { role: 'curioso', act: 'apontando', age: 'adolescente', at: 'fundo' }],
    },
    see: ['Bancos vazios, o coreto apagado. Do outro lado da praça, quatro adolescentes filmam a ambulância chegando.'],
    vitals: {},
    start: 100,
    decay: 0,
    actions: [
      { id: 'procurar', label: 'Procurar a vítima pela praça', group: 'cena', cost: 8, kind: 'neutro', focus: 'pessoas', say: 'Ninguém caído, ninguém sentado. Um saco de pipoca e as risadas do outro lado.' },
      { id: 'pm', label: 'Passar a descrição para a PM (lei do trote)', group: 'cena', cost: 3, kind: 'ajuda', endsPrank: true, say: '"Central, {unit}: QTH sem vítima, QRU. Grupo de adolescentes filmando, a PM está ciente." A PM anota: "É o terceiro esta semana."' },
      { id: 'qru', label: 'Avisar a Regulação: QTH sem vítima', group: 'cena', cost: 2, kind: 'ajuda', endsPrank: true, say: '"Central, {unit}: QTH sem vítima, QRU. Retornando à base."' },
    ],
    dest: [],
    debrief: 'Trote. Enquanto a USA 01 rodava até a praça, o Centro ficou sem viatura avançada. É isso que a lei do trote tenta evitar, e é por isso que, na Regulação, ligação suspeita merece pergunta antes de ambulância.',
    source: 'RM1 (trote)',
    crew: ['BENÉ: Já vi esse filme. Literalmente: amanhã tá na internet.'],
  },
  // ---------------------------------------------------------------------------
  {
    id: 'afogamento',
    title: 'Afogamento em criança',
    minDay: 4,
    qrr: 3,
    radio: '{unit}, QRR 3. QTH Rua do Parque, 1240, Parque das Exposições, lago. Menino de 6 anos tirado da água, tossindo e vomitando.',
    addr: { rua: 'Rua do Parque', n: 1240, bairro: 'Parque das Exposições' },
    scene: {
      place: 'rio',
      light: 'noite',
      patient: { pose: 'deitado', age: 'crianca', sex: 'M', skin: 'cianose', signs: ['molhado', 'respira_rapido', 'vomito'] },
      cast: [{ role: 'pai', act: 'ajoelhado', wear: 'banho' }, { role: 'curioso', act: 'lanterna', at: 'fundo' }, { role: 'curioso', act: 'mao_na_boca', at: 'fundo' }],
    },
    see: ['Um menino ensopado na grama, tossindo, os lábios arroxeados. Um homem de bermuda, também ensopado, ajoelhado do lado.', 'O pai: "Foi um minuto! Ele tava pescando comigo!"'],
    vitals: { pa: '96x60', fc: '128', fr: '34', sat: '90%', temp: '35,2 °C' },
    vitalsAfter: { temp: '35,9 °C' },
    oxy: { sat: 90 },
    start: 72,
    decay: 0.9,
    actions: [
      { id: 'lateral', label: 'De lado e aspirar', group: 'via', cost: 3, kind: 'critico', delta: 6, scene: { patient: { pose: 'lateral' } }, say: 'De lado, o Márcio aspira água e vômito da boca.' },
      { id: 'aquecer', label: 'Tirar a roupa molhada e aquecer', group: 'exp', cost: 4, kind: 'critico', delta: 4, shows: ['temp'], scene: { patient: { gear: ['manta'] } }, say: 'Manta aluminizada, cobertor. Temperatura 35,2 °C. Ele treme, o que é bom.' },
      { id: 'auscultar', label: 'Auscultar e oxímetro', group: 'resp', cost: 3, kind: 'info', shows: ['fr', 'fc', 'sat'], focus: 'peito', say: 'Estertores nas bases: entrou água no pulmão. FR 34, saturação 90%.' },
      { id: 'barriga', label: 'Apertar a barriga para tirar a água', group: 'via', cost: 3, kind: 'dano', delta: -10, say: 'Só fez vomitar de novo, e vômito vai para o pulmão. Apertar a barriga não tira água do pulmão.' },
    ],
    dest: ['REG'],
    destNote: { LOCAL: 'Criança afogada vai ao hospital mesmo que melhore: o pulmão pode piorar horas depois.' },
    debrief: 'Afogamento em criança: de lado, aspirar, oxigênio até 94% (Venturi ou reservatório) e aquecer. E hospital mesmo que melhore, porque o pulmão pode piorar horas depois. Liberar no local seria o erro mais fácil da noite.',
    source: 'SBV BPed26 · SAV APed33 · AT26 (afogamento)',
    crew: ['BENÉ: O pai pulou de roupa e tudo. Tá tremendo mais que o menino.', 'MÁRCIO: Ele perguntou se vai poder pescar amanhã.'],
  },
  // ---------------------------------------------------------------------------
  {
    id: 'agrotoxico',
    title: 'Intoxicação por inseticida agrícola',
    minDay: 5,
    qrr: 3,
    radio: '{unit}, QRR 3. QTH Rua Minas Gerais, 2450, Distrito Industrial, chácara no fim da rua. Homem, 45, passou veneno na plantação sem máscara. Babando, vomitando, falta de ar.',
    addr: { rua: 'Rua Minas Gerais', n: 2450, bairro: 'Distrito Industrial' },
    scene: {
      place: 'chacara',
      light: 'noite',
      patient: { pose: 'deitado', age: 'adulto', sex: 'M', skin: 'palido', signs: ['baba', 'suor', 'vomito', 'respira_rapido'], wear: 'obra', hat: 'bone' },
      props: ['galao'],
      cast: [{ role: 'esposa', act: 'apontando', hold: 'galao', at: 'fundo' }],
    },
    see: ['Um homem deitado na varanda da chácara, encharcado de suor, babando muito. Cheiro forte de veneno no ar.', 'A esposa mostra um galão sem rótulo: "Ele tava passando isso no tomate."'],
    vitals: { pa: '96x60', fc: '46', fr: '30', sat: '86%' },
    vitalsAfter: { fc: '88' },
    oxy: { sat: 86, needs: ['epi'] },
    start: 62,
    decay: 1.1,
    actions: [
      { id: 'epi', label: 'Luvas, máscara e avental antes de tocar', group: 'cena', cost: 3, kind: 'critico', say: 'Equipe protegida. Janelas da ambulância abertas.' },
      { id: 'descontaminar', label: 'Tirar a roupa e lavar a pele', group: 'exp', cost: 5, kind: 'critico', needs: ['epi'], scene: { patient: { wear: 'sem_camisa', signs: ['baba', 'suor', 'respira_rapido', 'molhado'] } }, say: 'Roupa cortada e num saco fechado, pele lavada com água corrente.' },
      { id: 'aspirar', label: 'Aspirar as secreções', group: 'via', cost: 3, kind: 'critico', needs: ['epi'], delta: 4, say: 'Muita secreção, um litro de baba no frasco. O ronco diminui.' },
      { id: 'sinais', label: 'Monitor, oxímetro e pupilas', group: 'circ', cost: 4, kind: 'info', needs: ['epi'], shows: ['pa', 'fc', 'fr', 'sat'], focus: 'rosto', say: 'FC 46, saturação 86%, pupilas puntiformes, chiado no pulmão. Síndrome colinérgica.' },
      { id: 'acesso', label: 'Acesso venoso', group: 'circ', cost: 6, kind: 'ajuda', needs: ['epi'], focus: 'maos', scene: { patient: { gear: ['soro'] } }, say: 'Acesso no braço.' },
      { id: 'atropina', label: 'Atropina IV (repetir até secar)', group: 'med', cost: 4, kind: 'critico', needs: ['acesso'], delta: 22, say: 'Doses repetidas até a secreção diminuir. A frequência sobe para 88. O alvo é secar o pulmão, não a pupila.' },
      { id: 'embalagem', label: 'Guardar o galão para o hospital', group: 'cena', cost: 2, kind: 'ajuda', say: 'O galão vai num saco, junto. O hospital precisa saber o que foi.' },
      { id: 'vomito', label: 'Provocar vômito', group: 'via', cost: 3, kind: 'dano', delta: -10, say: 'Nunca provocar vômito em intoxicação: mais risco de aspirar.' },
    ],
    dest: ['REG'],
    debrief: 'Intoxicação por inseticida (síndrome colinérgica: baba, suor, pupila pequena, chiado, frequência baixa). Equipe protegida primeiro, descontaminação antes de embarcar, aspiração, oxigênio com reservatório (86% não sobe com menos) e atropina até secar as secreções. Levar a embalagem; nunca provocar vômito.',
    source: 'SAV ATox1 · ATox8 · SBV BTox1 · BTox6',
    crew: ['BENÉ: Abre a janela, {dr}. Esse cheiro gruda.', 'MÁRCIO: Pupila que nem cabeça de alfinete.'],
  },
];

// =============================================================================
// A HISTÓRIA DAS NOITES: "O Sereno"
//
// Um capítulo por noite feita na Intervenção (não por dia: a pessoa escolhe
// quando vai). Seis capítulos e um desfecho. Se a pessoa começar tarde, a
// noite traz dois capítulos para o desfecho ainda caber até o dia 19.
//
// Mistério: um senhor de capa cinza chega antes da ambulância em ocorrências
// de noites diferentes. Os meninos da USB chamam ele de "Sereno" (aparece com
// o sereno). Ele ouve o rádio da Regulação num aparelho de radioamador e anota
// num caderno a hora de cada chamado e de cada chegada; quando o noturno passa
// endereço errado, ele liga para a central e corrige. Reviravolta: é o Seu
// Anselmo Nunes, pai do Rafael (morto em 12/04/2019 na Av. Brasil, 2400,
// esperando quarenta minutos) e da jornalista Carla. Ele não chega para salvar:
// chega "pra ninguém ficar sozinho". E a cidade dorme sem saber de outra coisa:
// da meia-noite às seis, a Saúde+ Gestão deixa só a USA 01 na rua.
//
// Coerente com a bíblia da 1.1 (docs/ROTEIRO-1.1.md, R3 "A noite de 2019 tinha
// três pessoas"): naquela noite a 01 era Bené, Dr. Castro e Márcio, com a maca
// presa no Regional; quem regulava era o Henrique; quem disse "sem maca" era o
// Saulo; a TARM era a Simone. Isso só se revela no dia 18. Antes, a noite só
// planta: o Henrique trava no rádio no endereço da cruz, o Bené evita a Av.
// Brasil e senta no meio-fio, o Saulo diz "sem maca" e alguém insiste. O Seu
// Anselmo corrige toda madrugada a voz do regulador daquela noite sem saber de
// quem é (e ninguém conta para ele aqui).
//
// Voz do noturno no rádio: o Henrique, piorando noite a noite (ou a Dra.
// Paula, se ele foi denunciado e afastado no dia 12).
// =============================================================================
const afastado = (s: StoryCtx) => !!s.flag('henrique_afastado');
const henrique = (text: string, extra?: (s: StoryCtx) => boolean): StoryLine => ({ who: 'RÁDIO · DR. HENRIQUE', text, when: (s) => !afastado(s) && (!extra || extra(s)) });
const paula = (text: string, extra?: (s: StoryCtx) => boolean): StoryLine => ({ who: 'RÁDIO · DRA. PAULA', text, when: (s) => afastado(s) && (!extra || extra(s)) });
/** a pessoa já conheceu a Carla Nunes (dia 14) */
const conheceCarla = (s: StoryCtx) => s.day >= 15;
/** o Bené já contou que era o condutor de 2019 (dia 18, 07:05) */
const beneContou = (s: StoryCtx) => s.day >= 18;
/** o almoço do dia 18 já contou quem regulava em 2019 (escolhas da bíblia: contar à Carla, ligar para o Henrique ou guardar) */
const sabeRegulador = (s: StoryCtx) => s.day >= 18 && (!!s.flag('carla_sabe_regulador') || !!s.flag('ligou_henrique_2019') || !!s.flag('guardou_2019'));

/** o Seu Anselmo na cena (figurante) */
const SERENO = { role: 'curioso', age: 'idoso', sex: 'M', wear: 'social' } as const;
/** a cruz do Rafael: Av. Brasil, 2400 (o poste que o ônibus 12 mostra no dia 4) */
const CRUZ = { rua: 'Av. Brasil', n: 2400, bairro: 'Centro' };

export const FIELD_STORY_CASES: FieldCaseX[] = [
  // ---------------------------------------------------------------------------
  // 1 · Capa cinza
  // ---------------------------------------------------------------------------
  {
    id: 'noite_capa',
    title: 'Infarto na rodoviária (o homem de capa)',
    special: true,
    qrr: 3,
    radio: '{unit}, QRR 3. QTH Av. Brasil, 1501, Distrito Industrial, rodoviária velha. Homem, 78 anos, dor no peito há uns 30 minutos. Quem ligou deu o endereço certinho, com ponto de referência, e desligou sem dizer o nome.',
    addr: { rua: 'Av. Brasil', n: 1501, bairro: 'Distrito Industrial' },
    scene: {
      place: 'ponto_onibus',
      light: 'noite',
      patient: { pose: 'sentado', age: 'idoso', sex: 'M', skin: 'palido', signs: ['suor', 'mao_no_peito'] },
      props: ['mochila'],
      cast: [{ ...SERENO, act: 'segurando_mao', hold: 'caneta' }],
    },
    see: [
      'Banco da plataforma 3. Seu Ladislau, 78, sentado, a mão aberta no peito, suando. Do lado dele, um senhor magro de capa cinza segura o pulso dele e olha o relógio.',
      'O senhor de capa: "A dor começou trinta e dois minutos antes de vocês chegarem. Eu marquei. Não dei remédio nenhum, que isso não é comigo." Ele põe um papel na sua mão: o verso de uma passagem, com "32 min" escrito a lápis.',
    ],
    vitals: { pa: '148x92', fc: '92', fr: '20', sat: '96%', glic: '140', ritmo: 'Supra de ST de V1 a V4' },
    oxy: { sat: 96, need: 90, iam: true },
    start: 76,
    decay: 0.8,
    actions: [
      { id: 'ecg', label: 'Monitor e ECG de 12 derivações', group: 'circ', cost: 7, kind: 'critico', shows: ['pa', 'fc', 'sat', 'ritmo'], focus: 'peito', scene: { patient: { gear: ['eletrodos'] } }, say: 'ECG: supra de ST de V1 a V4. Infarto anterior. PA 148x92, FC 92, saturação 96%.' },
      { id: 'aas', label: 'AAS 300 mg mastigado', group: 'med', cost: 3, kind: 'critico', say: 'Ele mastiga devagar, como quem mastiga bala de goma. "Já tomei pior, {dr}."' },
      { id: 'clopi75', label: 'Clopidogrel 75 mg (acima de 75 anos)', group: 'med', cost: 3, kind: 'critico', until: ['clopi300'], say: 'Um comprimido de 75 mg, junto com o AAS. Aos 78 a dose é essa, sem ataque de 300.' },
      { id: 'clopi300', label: 'Clopidogrel 300 mg (até 75 anos)', group: 'med', cost: 3, kind: 'dano', until: ['clopi75'], satisfies: 'clopi75', delta: -6, say: 'Quatro comprimidos. Acima de 75 anos, a dose é 75 mg: a de ataque só aumenta o risco de sangrar. Ninguém sangrou hoje, mas o Dr. Castro levanta uma sobrancelha.' },
      { id: 'acesso', label: 'Acesso venoso', group: 'circ', cost: 6, kind: 'critico', focus: 'maos', scene: { patient: { gear: ['soro'] } }, say: 'Acesso no antebraço, veia boa. "Doador de sangue trinta anos", ele avisa.' },
      { id: 'dinitrato', label: 'Dinitrato 5 mg sublingual', group: 'med', cost: 3, kind: 'ajuda', delta: 6, say: 'PAS acima de 90, FC entre 50 e 100, parede anterior, nada de remédio para disfunção erétil ("Na minha idade, {dr}? Deus me livre."). A dor cai de 8 para 5.' },
      { id: 'glicemia', label: 'Glicemia capilar', group: 'neuro', cost: 3, kind: 'info', shows: ['glic'], focus: 'maos', say: 'Glicemia 140.' },
      { id: 'perguntar', label: 'Perguntar ao senhor de capa quem ele é', group: 'cena', cost: 2, kind: 'info', focus: 'pessoas', sets: { noite_capa_perguntou: true }, scene: { cast: [] }, say: 'Você vira para perguntar. O banco do lado está vazio. Na plataforma, só o vento, um papel de bala e o chiado de um radinho de pilha indo embora pelo escuro.' },
    ],
    dest: ['REG'],
    destNote: { UPA: 'A UPA não tem hemodinâmica: infarto com supra vai para o Regional.' },
    debrief:
      'Infarto anterior com pressão boa. AAS 300 mg mastigado e clopidogrel na dose da idade (acima de 75 anos, 75 mg), acesso e Regional com a hemodinâmica avisada. Aqui o nitrato pode (PAS > 90, FC entre 50 e 100, sem infarto inferior, sem sildenafil). Saturação 96%: oxigênio não entra. E a hora de início anotada por um desconhecido vale ouro para quem vai abrir a artéria.',
    source: 'SAV AC17 · fichas de AAS, clopidogrel e dinitrato',
    crew: ['CASTRO: Setenta e oito anos, {dr}. Pensa na dose antes de abrir a caixa. Não vou soprar.', 'BENÉ: Esse senhor de capa... eu já vi ele. Não lembro onde. Não gosto de não lembrar.'],
    story: {
      chapter: 1,
      title: 'Capa cinza',
      minDay: 1,
      crew: 'Seu Bené (condutor) · Dr. Castro (só olhando) · Enf. Márcio · você',
      open: [
        { who: 'DR. CASTRO', text: 'Castro, da 01. Hoje eu vou junto, só olhando. Depois a 01 da noite é sua quando quiser: eu tô velho pra dobrar. O Bené não tá.' },
        { who: 'BENÉ', text: 'Eu dobro até o dia 20, {dr}. Aposentadoria do INSS é do tamanho de um pastel. Falando nisso: o Castro deve um pastel pra Simone desde 2019.' },
        { who: 'DR. CASTRO', text: 'Eu devo pra ela. Não ela pra mim. A Simone conta errado. ...Bora, Bené.' },
        henrique('Boa noite, zero um. Henrique no noturno. Noite tranquila, se Deus quiser. E se Ele não quiser, eu tô aqui. Eu sempre tô aqui.'),
        paula('Boa noite, zero um. Paula no noturno. Qualquer coisa, me chama pelo nome. Funciona.'),
      ],
      before: [{ who: 'BENÉ', text: 'Rodoviária velha. De noite lá só fica o vento e quem não tem pra onde ir.' }],
      epilogue: [
        { who: 'DR. CASTRO', text: 'Na base, o Dr. Castro desce: "Gostei. A 01 da noite é sua." Você pergunta da aposta do pastel de 2019. Ele finge que não ouviu. Isso ele faz bem.' },
        { who: 'NARRADOR', text: 'O Bené prende o papel da passagem no quebra-sol, ao lado de um santinho de São Benedito: "32 min". Ninguém pergunta por quê.' },
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // 2 · Rua errada
  // ---------------------------------------------------------------------------
  {
    id: 'noite_rua_errada',
    title: 'Edema agudo de pulmão (a rua errada)',
    special: true,
    qrr: 3,
    radio: '{unit}, QRR 3. QTH Rua Ipê, 1210, Jardim Norte. Idosa, 81, falta de ar de repente, "afogando", não consegue deitar.',
    addr: { rua: 'Rua Ipê', n: 1210, bairro: 'Jardim Norte' },
    scene: {
      place: 'quarto',
      light: 'noite',
      patient: { pose: 'sentado', age: 'idoso', sex: 'F', skin: 'cianose', signs: ['respira_rapido', 'suor', 'inchaco_pernas'] },
      props: ['cama', 'remedios'],
      cast: [{ ...SERENO, act: 'lanterna', hold: 'lanterna', at: 'fundo' }, { role: 'neto', act: 'mao_na_boca', at: 'fundo' }],
    },
    see: [
      'Rua Ipê, 1210: um terreno baldio e um cachorro. Nenhuma luz. O Bené já está engatando a ré quando uma lanterna acende na esquina. O senhor de capa cinza, de novo: "É no 210! Dona Celeste, casa verde. O rádio falou mil duzentos e dez."',
      'Na casa verde, Dona Celeste, 81, sentada na beira da cama, puxando o ar com barulho de chaleira. Espuma rosada no lenço. Os pés inchados no chinelo.',
    ],
    vitals: { pa: '182x104', fc: '118', fr: '34', sat: '86%', glasgow: '15' },
    vitalsAfter: { pa: '150x90', fc: '100', fr: '24' },
    oxy: { sat: 86 },
    start: 60,
    decay: 1.0,
    actions: [
      { id: 'sinais', label: 'Sinais vitais e oxímetro', group: 'circ', cost: 3, kind: 'info', shows: ['pa', 'fc', 'fr', 'sat', 'glasgow'], scene: { patient: { gear: ['oximetro'] } }, say: 'PA 182x104, FC 118, FR 34, saturação 86%. Acordada, assustada.' },
      { id: 'auscultar', label: 'Auscultar os pulmões', group: 'resp', cost: 3, kind: 'info', focus: 'peito', say: 'Estertores dos dois lados, subindo até o meio do pulmão. Edema agudo de pulmão.' },
      { id: 'pernas', label: 'Sentada, pernas pendentes', group: 'exp', cost: 2, kind: 'critico', delta: 6, say: 'Sentada na beira da cama, as pernas para fora. O sangue fica um pouco nas pernas e o pulmão agradece.' },
      { id: 'dinitrato', label: 'Dinitrato 5 mg sublingual', group: 'med', cost: 3, kind: 'critico', needs: ['sinais'], delta: 10, say: 'PAS 182: pode. Um comprimido embaixo da língua; repete a cada 5 a 10 minutos se precisar.' },
      { id: 'acesso', label: 'Acesso venoso', group: 'circ', cost: 6, kind: 'ajuda', focus: 'maos', scene: { patient: { gear: ['soro'] } }, say: 'Acesso fino no dorso da mão, sem soro correndo.' },
      { id: 'furosemida', label: 'Furosemida 40 mg IV', group: 'med', cost: 3, kind: 'critico', needs: ['acesso'], delta: 10, say: 'Furosemida na veia. Em dez minutos o Márcio procura um penico pela casa.' },
      { id: 'soro', label: 'Correr soro para "hidratar"', group: 'circ', cost: 4, kind: 'dano', delta: -12, say: 'O pulmão já está cheio de água. Soro aberto afoga mais. A chaleira volta a apitar.' },
      { id: 'deitar', label: 'Deitar para descansar', group: 'exp', cost: 2, kind: 'dano', until: ['furosemida'], delta: -10, scene: { patient: { pose: 'cama' } }, say: 'Deitada, ela se afoga no próprio pulmão e senta sozinha, apavorada. Edema de pulmão é sentado.' },
      { id: 'nome', label: 'Perguntar o nome do senhor da lanterna', group: 'cena', cost: 2, kind: 'info', focus: 'pessoas', sets: { noite_sereno_nome: true }, say: '"Pode me chamar de ninguém, {dr}. Os meninos da USB me chamam de Sereno." Ele aponta para o céu, para a umidade da madrugada. "Eu apareço com ele."' },
    ],
    dest: ['REG'],
    destNote: { UPA: 'Edema agudo de pulmão com pressão alta numa senhora de 81 anos: vai para o Regional.' },
    debrief:
      'Edema agudo de pulmão: falta de ar súbita, espuma rosada, estertores, sentada. Sentada com as pernas pendentes, oxigênio até 94% (com 86%, só a máscara com reservatório chega lá), dinitrato com PAS acima de 90 e furosemida. Soro aberto e deitar pioram. E o endereço errado custou minutos: o número certo veio de um desconhecido.',
    source: 'SAV AC24 (EAP) · AP16 (máscara com reservatório) · fichas de dinitrato e furosemida',
    crew: ['BENÉ: Mil duzentos e dez. Eu ouvi direito, {dr}? Ouvi. Eu sempre ouço direito.', 'MÁRCIO: Ela tá melhorando, {dr}. Menos chaleira.'],
    story: {
      chapter: 2,
      title: 'Rua errada',
      minDay: 2,
      open: [
        henrique('Zero um, Henrique. Noite... comprida. O café acabou na central. A Cleide diz que eu bebo café demais. Café.'),
        paula('Zero um, Paula. A Cleide trouxe bolo. Se sobrar, eu guardo pra vocês.'),
        { who: 'RÁDIO · USB 01 (JOANA)', text: 'Central, USB 01, QRR 2 pro Regional com a gestante da Vila. Sangrando pouco, consciente. Chegamos em oito. Tá todo mundo vivo, por enquanto.' },
      ],
      before: [{ who: 'BENÉ', text: 'Jardim Norte. Conheço cada buraco. Se a numeração não mudou, é lá no alto, perto do fim da rua.' }],
      epilogue: [
        { who: 'NARRADOR', text: 'No fim da noite, o Bené liga para a central: "Henrique, o 1210 era 210." Do outro lado, um silêncio comprido. "Erro de digitação, Bené. É tudo número." O Bené desliga e fica olhando o rádio como quem olha um cachorro que mordeu.', when: (s) => !afastado(s) },
        { who: 'NARRADOR', text: 'No fim da noite, a Dra. Paula liga: "O neto passou o número com um 1 a mais, de nervoso. Já corrigi." O Bené agradece. Depois diz, para ninguém: "E quem avisou o senhor da lanterna?"', when: afastado },
        { who: 'RÁDIO · USB 01 (JOANA)', text: 'Joana pra 01, antes do QRT: vocês viram o Sereno hoje? A gente chama ele assim. Semana passada ele chegou antes de mim num AVC. Nunca diz o nome. Nunca aceita carona.' },
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // 3 · O caderno
  // ---------------------------------------------------------------------------
  {
    id: 'noite_caderno',
    title: 'Parada na praça do dominó (TV sem pulso)',
    special: true,
    qrr: 3,
    radio: '{unit}, QRR 3, prioridade absoluta. QTH Av. Primavera, 900, Bela Vista, a praça do dominó. Homem caiu na mesa do jogo. Tem alguém fazendo massagem.',
    addr: { rua: 'Av. Primavera', n: 900, bairro: 'Bela Vista' },
    scene: {
      place: 'praca',
      light: 'noite',
      patient: { pose: 'deitado', age: 'idoso', sex: 'M', skin: 'cianose', signs: ['olhos_fechados'] },
      props: ['mesa', 'cadeira'],
      cast: [{ ...SERENO, act: 'rcp' }, { role: 'curioso', act: 'maos_na_cabeca', at: 'fundo', age: 'idoso' }, { role: 'curioso', act: 'olhando', at: 'fundo', age: 'idoso' }],
    },
    see: [
      'Mesa de dominó virada, pedras no chão. Seu Agenor, 63, de costas no cimento. Quem comprime o peito dele é o senhor de capa cinza, contando alto, sem pressa e sem parar: "...vinte e oito, vinte e nove, trinta."',
      '"Caiu faz quatro minutos. Parou de respirar um minuto depois. Eu comecei no minuto seguinte," ele diz, sem olhar para você. "Pode assumir."',
    ],
    vitals: { pa: '—', fc: '0', fr: '0', sat: '—', ritmo: 'Taquicardia ventricular sem pulso' },
    vitalsAfter: { pa: '108x70', fc: '92', fr: '12', sat: '95%', ritmo: 'Sinusal depois do choque' },
    arrest: { start: 'TV' },
    start: 64,
    decay: 1.2,
    treatOnScene: true,
    actions: [
      { id: 'rcp', label: 'Assumir as compressões (30:2)', group: 'circ', cost: 4, kind: 'critico', delta: 6, focus: 'peito', scene: { cast: [{ role: 'socorrista', act: 'rcp' }, { role: 'socorrista', act: 'ventilando', at: 'cabeca' }, { ...SERENO, act: 'olhando', at: 'fundo' }], patient: { gear: ['ambu'] } }, say: 'O Márcio assume sem perder o ritmo. O senhor de capa se levanta devagar, limpa os joelhos e fica olhando de longe.' },
      { id: 'monitor', label: 'Pás do monitor: ver o ritmo', group: 'circ', cost: 5, kind: 'critico', shows: ['ritmo', 'fc'], scene: { patient: { gear: ['eletrodos'] } }, say: 'Pás no peito. O traçado aparece na tela. Pulso carotídeo: ausente. Leia o monitor.' },
      { id: 'cagada', label: 'CA-GA-DA (cabos, ganho, derivação)', group: 'circ', cost: 4, kind: 'neutro', needs: ['monitor'], when: ['ASSISTOLIA'], wrongSay: CAGADA_ERRADO, wrongDelta: -3, say: 'Linha reta confirmada.' },
      { id: 'choque', label: 'Desfibrilar (200 J bifásico)', group: 'circ', cost: 4, kind: 'critico', needs: ['monitor'], when: [...SHOCK], wrongSay: CHOQUE_ERRADO, delta: 18, say: '"Todos afastados!" Choque. Compressões de novo, dois minutos.' },
      { id: 'acesso', label: 'Acesso venoso', group: 'circ', cost: 6, kind: 'ajuda', focus: 'maos', scene: { patient: { gear: ['soro'] } }, say: 'Acesso no braço sem parar a massagem.' },
      { id: 'adrenalina', label: 'Adrenalina 1 mg IV', group: 'med', cost: 3, kind: 'critico', needs: ['acesso'], delta: 8, say: 'Adrenalina 1 mg, flush, braço elevado. Repete a cada 3 a 5 minutos.' },
      { id: 'amiodarona', label: 'Amiodarona 300 mg IV', group: 'med', cost: 3, kind: 'critico', needs: ['acesso', 'choque'], when: [...SHOCK], wrongSay: AMIO_ERRADO, wrongDelta: -4, delta: 6, say: 'Amiodarona 300 mg em bolus.' },
      { id: 'pulso', label: 'Parar tudo para sentir o pulso', group: 'circ', cost: 5, kind: 'dano', until: ['choque'], delta: -10, say: 'Pausa longa, nada de pulso. A checagem é rápida, a cada 2 minutos.' },
      {
        id: 'caderno',
        label: 'Pegar o caderno que caiu no chão',
        group: 'cena',
        cost: 2,
        kind: 'info',
        after: ['choque'],
        focus: 'chao',
        sets: { noite_leu_caderno: true },
        say: 'Caiu do bolso da capa: um caderno de capa dura, colunas a lápis. Data, rua, "chamado", "chegada". "14/03 · Rua Sabiá · 22:10 · 22:51." "02/05 · Av. Brasil · 23:40 · 00:19." Centenas de linhas. Na última página escrita: "Noturno passou rua errada. Liguei e corrigi. 3ª vez este mês."',
      },
    ],
    dest: ['REG'],
    debrief:
      'Complexos largos, rápidos e regulares, sem pulso: taquicardia ventricular sem pulso. Trata-se como a FV: é chocável. Choque, dois minutos de RCP, adrenalina 1 mg a cada 3 a 5 minutos e amiodarona 300 mg. O leigo que começou a massagem em um minuto deu ao Seu Agenor a chance que ele teve.',
    source: 'SAV AC5–AC8 (FV/TV sem pulso; AHA 2015) · fichas de adrenalina e amiodarona',
    crew: ['MÁRCIO: Quem é esse senhor, {dr}? A compressão dele é melhor que a minha.', 'BENÉ: Ele tá indo embora. ...Deixou cair alguma coisa.'],
    story: {
      chapter: 3,
      title: 'O caderno',
      minDay: 3,
      open: [
        henrique('Zero um... confirma o QTH? ...QSL. QSL. Eu ouvi. Pode ir. (pausa) Eu ouvi, Cleide.'),
        paula('Zero um, Paula. Noite de lua cheia. A Cleide diz que é noite de parto e de doido.'),
        { who: 'BENÉ', text: 'Sabe o que me incomoda, {dr}? Ele sabia o número certo antes da gente.' },
      ],
      epilogue: [
        { who: 'NARRADOR', text: 'Você fica com o caderno para devolver. O Bené dirige calado e não pega a Av. Brasil: corta pela Santos Dumont. "É mais longe", diz. "Eu gosto de longe."', when: (s) => !!s.flag('noite_leu_caderno') },
        { who: 'NARRADOR', text: 'Quando vocês voltam para buscar o que ele deixou cair, o banco da praça está vazio. Na volta, o Bené não pega a Av. Brasil: corta pela Santos Dumont. "É mais longe", diz. "Eu gosto de longe."', when: (s) => !s.flag('noite_leu_caderno') },
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // 4 · Meia-noite
  // ---------------------------------------------------------------------------
  {
    id: 'noite_meia_noite',
    title: 'Corte na coxa na usina (meia-noite)',
    special: true,
    qrr: 3,
    radio: '{unit}, QRR 3. QTH Rua das Indústrias, 1700, Distrito Industrial, portaria da usina. Trabalhador com corte fundo na coxa, serra elétrica. Vocês são a única avançada na rua.',
    addr: { rua: 'Rua das Indústrias', n: 1700, bairro: 'Distrito Industrial' },
    scene: {
      place: 'fabrica',
      light: 'noite',
      patient: { pose: 'deitado', age: 'adulto', sex: 'M', skin: 'palido', signs: ['sangue_perna', 'sangue_chao'], wear: 'obra', wound: { kind: 'corte', at: 'perna' } },
      cast: [{ ...SERENO, act: 'comprimindo' }, { role: 'colega', act: 'maos_na_cabeca', at: 'fundo', wear: 'obra' }],
    },
    see: [
      'Vinte e seis minutos de estrada. Na portaria, um rapaz de macacão deitado, a calça empapada. Ajoelhado em cima da coxa dele, com as duas mãos e o peso do corpo, o senhor de capa cinza.',
      '"Pressão direta faz vinte e cinco minutos. Não tirei o pano, pus outro por cima," ele diz. E, mais baixo: "Vinte e seis minutos. Não é culpa de vocês. Eu sei de quem é."',
    ],
    vitals: { pa: '84x52', fc: '132', fr: '26', sat: '92%' },
    oxy: { sat: 92, min: 'reservatorio' },
    start: 54,
    decay: 1.3,
    scoop: true,
    actions: [
      { id: 'torniquete', label: 'Torniquete acima do corte', group: 'circ', cost: 4, kind: 'critico', delta: 18, focus: 'pernas', scene: { patient: { gear: ['torniquete'] } }, say: 'Torniquete na raiz da coxa, apertado até parar. O senhor de capa tira as mãos devagar e escreve a hora no próprio caderno: {hora}.' },
      { id: 'compressao', label: 'Trocar a compressão por compressas', group: 'circ', cost: 3, kind: 'ajuda', delta: 4, focus: 'pernas', scene: { patient: { gear: ['compressa'] } }, say: 'O Márcio assume a pressão sem tirar o pano de baixo.' },
      { id: 'sinais', label: 'Sinais vitais', group: 'circ', cost: 3, kind: 'info', shows: ['pa', 'fc', 'fr', 'sat'], say: 'PA 84x52, FC 132, FR 26, saturação 92%. Choque hemorrágico.' },
      { id: 'acesso', label: 'Acesso e soro moderado', group: 'circ', cost: 6, kind: 'critico', focus: 'maos', scene: { patient: { gear: ['soro'] } }, say: 'Dois acessos. Soro aquecido, só até a sistólica de 80 a 90.' },
      { id: 'aquecer', label: 'Manta e cobertor', group: 'exp', cost: 3, kind: 'ajuda', delta: 4, scene: { patient: { gear: ['manta'] } }, say: 'Manta aluminizada. Quem sangra esfria, e quem esfria sangra mais.' },
      { id: 'soro_aberto', label: 'Correr dois litros rápido', group: 'circ', cost: 5, kind: 'dano', delta: -12, say: 'A pressão sobe e o sangue volta a escorrer. Soro com moderação.' },
      { id: 'como', label: 'Perguntar como ele chegou antes', group: 'cena', cost: 2, kind: 'info', focus: 'pessoas', sets: { noite_sereno_radio: true }, say: '"Eu ouço o rádio de vocês, {dr}. Um aparelho velho de radioamador, desde 2019. Hoje, à meia-noite, eu ouvi a central ler aquele papel. Moro perto. Vim de bicicleta." Ele bate no bolso da capa: o caderno.' },
    ],
    dest: ['REG'],
    debrief:
      'Hemorragia de membro com choque: torniquete acima do corte, oxigênio com reservatório (trauma grave com choque pede alto fluxo), soro aquecido com moderação e manta. O resto é no centro cirúrgico. E, da meia-noite às seis, a cidade tem uma ambulância avançada. Ninguém votou nisso.',
    source: 'SAV AT1 · AT21 · AC16 (choque) · AP19/AP20 (torniquete)',
    crew: ['SAULO NO RÁDIO: Zero um, Saulo, PS do Regional. Tô com trinta e oito no corredor e sem maca. ...Torniquete na coxa? Manda. Sala vermelha. Eu dou um jeito na maca.', 'BENÉ: Vinte e seis minutos. Eu fiz em vinte e seis o que é de doze. E ainda tô ouvindo que foi rápido.'],
    story: {
      chapter: 4,
      title: 'Meia-noite',
      minDay: 5,
      at: 24 * 60 + 12,
      open: [
        henrique('Atenção, viaturas. Comunicado da Saúde+ Gestão. A partir de hoje, da meia-noite às seis, a USA 02 e a USA 03 ficam... em reserva técnica. "Plano Noturno de Otimização." A 01 cobre a cidade. (pausa) Quem escreveu isso nunca dirigiu de noite. (pausa) Isso eu não li, Cleide. Apaga.'),
        paula('Atenção, viaturas. Comunicado da Saúde+ Gestão, eu só leio: da meia-noite às seis, USA 02 e USA 03 em reserva técnica. A 01 cobre a cidade. (pausa) Fica registrado que eu li contrariada.'),
        { who: 'RÁDIO · USB 01 (JOANA)', text: 'Joana pra 01. A 03 recolheu. Se cair coisa grave na Vila, sou eu e a minha prancha. Reza aí por nós.' },
      ],
      before: [{ who: 'BENÉ', text: 'A cidade inteira dormindo e uma ambulância acordada. E ninguém vai ficar sabendo, {dr}. É assim que eles fazem: de noite.' }],
      epilogue: [
        { who: 'NARRADOR', text: 'No Regional, o Saulo recebe na sala vermelha com uma bolacha de água e sal na boca e a maca de um corredor qualquer. O Bené fica parado na porta do PS olhando a maca chegar. Solta o ar como quem segurava desde muito tempo.' },
        { who: 'NARRADOR', text: 'Na base, às 0h58, o Bené pega uma caneta e escreve na palma da mão: "0h–6h: só a 01." "Pra não esquecer que eu sei", diz. Lá fora, Santa Aurora dorme sem saber.' },
      ],
      flags: { estavel: { noite_plano_noturno: true }, instavel: { noite_plano_noturno: true }, obito: { noite_plano_noturno: true } },
    },
  },
  // ---------------------------------------------------------------------------
  // 5 · Nunes
  // ---------------------------------------------------------------------------
  {
    id: 'noite_nunes',
    title: 'Hipoglicemia em casa (o Sereno)',
    special: true,
    qrr: 3,
    radio: '{unit}, QRR 3. QTH Rua Sabiá, 77, Vila Esperança. Homem, setenta e poucos anos, encontrado caído na cozinha pela vizinha, suando, não responde direito. Mora sozinho.',
    addr: { rua: 'Rua Sabiá', n: 77, bairro: 'Vila Esperança' },
    scene: {
      place: 'cozinha',
      light: 'noite',
      patient: { pose: 'encostado', age: 'idoso', sex: 'M', skin: 'palido', signs: ['suor', 'olhos_fechados'] },
      props: ['caneta_insulina', 'mesa', 'celular'],
      cast: [{ role: 'vizinha', act: 'mao_na_boca', at: 'fundo', age: 'idoso' }],
    },
    see: [
      'Uma casa pequena com uma antena de rádio torta no telhado. A vizinha abre: "Ele vive de noite, {dr}. Hoje não saiu. Estranhei." No chão da cozinha, encostado no armário, molhado de suor: o senhor da capa cinza. A capa pendurada atrás da porta.',
      'Na mesa: três rádios, um mapa de Santa Aurora cheio de alfinetes, um porta-retrato virado para a parede e uma caneta de insulina sem tampa.',
    ],
    vitals: { pa: '132x80', fc: '108', fr: '18', sat: '97%', glic: '34', glasgow: '11' },
    vitalsAfter: { glic: '126', glasgow: '15', fc: '90' },
    oxy: { sat: 97 },
    start: 68,
    decay: 0.8,
    actions: [
      { id: 'glicemia', label: 'Glicemia capilar', group: 'neuro', cost: 3, kind: 'critico', shows: ['glic'], focus: 'maos', say: 'Glicemia: 34 mg/dL.' },
      { id: 'sinais', label: 'Sinais vitais e Glasgow', group: 'neuro', cost: 4, kind: 'info', shows: ['pa', 'fc', 'fr', 'sat', 'glasgow'], say: 'PA 132x80, FC 108, FR 18, saturação 97%. Glasgow 11.' },
      { id: 'acesso', label: 'Acesso venoso', group: 'circ', cost: 6, kind: 'critico', focus: 'maos', scene: { patient: { gear: ['soro'] } }, say: 'Acesso no dorso da mão. Veia de quem doou sangue a vida inteira.' },
      {
        id: 'glicose',
        label: 'Glicose 50% IV (30–50 mL)',
        group: 'med',
        cost: 4,
        kind: 'critico',
        needs: ['glicemia', 'acesso'],
        delta: 30,
        scene: { patient: { pose: 'encostado', skin: 'normal', signs: ['suor'] } },
        say: 'Glicose na veia. Ele abre os olhos e olha o relógio da parede antes de olhar para você: "Nove minutos. Vocês chegaram em nove minutos." A vizinha: "Seu Anselmo, o senhor esqueceu de jantar de novo." "Eu esqueço", ele diz. "Fui vigia de usina trinta anos. De noite eu tenho mais o que fazer."',
      },
      { id: 'mapa', label: 'Olhar o mapa da parede', group: 'exp', cost: 2, kind: 'info', focus: 'ambiente', sets: { noite_viu_mapa: true }, say: 'Cada alfinete tem um papelzinho: hora do chamado, hora da chegada. Vermelho quando passou de trinta minutos. Quase todos os vermelhos são de madrugada. Na Av. Brasil, perto do 2400, a quatro quadras do Regional, o alfinete mais velho, enferrujado: "40 min".' },
      {
        id: 'retrato',
        label: 'Desvirar o porta-retrato',
        group: 'exp',
        cost: 2,
        kind: 'info',
        focus: 'objeto',
        sets: { noite_viu_retrato: true },
        say: 'Um rapaz de capacete azul, sorrindo, encostado numa moto. Presa no vidro, uma conta de luz: "Anselmo Nunes". O Bené, que entrou atrás de você, olha a foto um tempo. Depois sai sem dizer nada e senta no meio-fio, do lado da ambulância. "É a coluna", diz o Márcio, sem acreditar, e vai sentar do lado dele.',
      },
    ],
    dest: ['UPA', 'REG'],
    destNote: { LOCAL: 'Mora sozinho, usa insulina e "esquece de jantar": em casa, a glicose cai de novo antes do sol. Observação.' },
    debrief: 'Hipoglicemia num idoso que usa insulina, mora sozinho e esquece de comer: glicemia, glicose 50% na veia, nova glicemia e observação, porque a insulina continua agindo. O mapa e a foto não mudam a conduta. Mudam a noite.',
    source: 'SAV AC29 (hipoglicemia)',
    crew: ['MÁRCIO: {Dr}, olha esses rádios. Ele ouve a gente. Ele ouve tudo.', 'BENÉ: (o Bené fica na porta da cozinha, de boné na mão, sem entrar)'],
    story: {
      chapter: 5,
      title: 'Nunes',
      minDay: 6,
      open: [
        henrique('...'),
        { who: 'RÁDIO · CLEIDE (TARM)', text: 'Zero um, aqui é a Cleide. O doutor foi... lavar o rosto. Eu passo os chamados por enquanto. Ele já volta. Ele sempre volta.', when: (s) => !afastado(s) },
        paula('Zero um, Paula. Noite parada. Parada demais. Eu não gosto.'),
      ],
      before: [{ who: 'BENÉ', text: 'Rua Sabiá, 77. (pausa) {Dr}... essa casa tem uma antena no telhado. Eu passo aqui toda noite. Nunca reparei.' }],
      epilogue: [
        { who: 'NARRADOR', text: 'O Seu Anselmo vai para a observação reclamando: "E quem vai ouvir o rádio hoje?" O Bené dirige com as duas mãos no volante, coisa que ele nunca faz.' },
        { who: 'NARRADOR', text: 'Nunes. Como a jornalista da Gazeta. Você pensa nisso a madrugada inteira e não fala em voz alta.', when: conheceCarla },
        { who: 'NARRADOR', text: 'Na base, o Bené tira o papel da passagem do quebra-sol ("32 min"), olha um tempo e põe de volta.', when: (s) => !conheceCarla(s) },
      ],
      flags: { estavel: { noite_nome_anselmo: true }, instavel: { noite_nome_anselmo: true }, obito: { noite_nome_anselmo: true } },
    },
  },
  // ---------------------------------------------------------------------------
  // 6 · Quarenta minutos
  // ---------------------------------------------------------------------------
  {
    id: 'noite_quarenta',
    title: 'Motociclista com trauma de crânio (a cruz do poste)',
    special: true,
    qrr: 3,
    radio: '{unit}, QRR 3. QTH Av. Brasil, 2400, Centro, no poste da cruz. Motociclista caído, inconsciente, roncando.',
    addr: CRUZ,
    scene: {
      place: 'rua',
      light: 'noite',
      patient: { pose: 'deitado', age: 'adulto', sex: 'M', skin: 'palido', signs: ['olhos_fechados', 'sangue_cabeca', 'respira_fraco'], wear: 'motoboy', hat: 'capacete', wound: { kind: 'galo', at: 'cabeca' } },
      props: ['moto', 'poste'],
      cast: [{ ...SERENO, act: 'segurando_cabeca', at: 'cabeca' }],
    },
    see: [
      'Av. Brasil, 2400. No poste, uma cruz de madeira pintada de branco com flor de plástico desbotada. Embaixo dela, um rapaz de jaqueta de entrega no asfalto, capacete ainda na cabeça. Ajoelhado atrás da cabeça dele, segurando o capacete alinhado com as duas mãos: o Seu Anselmo. Um radinho de pilha no bolso da capa chia a frequência de vocês.',
      '"Ele ronca, {dr}. Ronco não é sono. Eu não mexi no capacete. Aprendi."',
    ],
    vitals: { pa: '138x86', fc: '64', fr: '8', sat: '85%', glasgow: '7' },
    vitalsAfter: { fr: '12' },
    oxy: { sat: 85, iot: true },
    start: 58,
    decay: 1.2,
    scoop: true,
    actions: [
      { id: 'cervical', label: 'Capacete fora em dupla, colar e prancha', group: 'via', cost: 5, kind: 'critico', scene: { patient: { hat: null, gear: ['colar'] } }, say: 'O Seu Anselmo segura a cabeça enquanto o Márcio tira o capacete em dupla. Colar, prancha, em bloco. "Bonito", diz o velho, baixinho.' },
      { id: 'avaliar', label: 'Glasgow, pupilas e respiração', group: 'neuro', cost: 3, kind: 'info', shows: ['glasgow', 'fr', 'sat', 'pa', 'fc'], focus: 'rosto', say: 'Não abre os olhos, geme, retira à dor: Glasgow 7. Pupila direita maior que a esquerda. Ronco, FR 8, saturação 85%. Ele não protege a via aérea.' },
      { id: 'aspirar', label: 'Aspirar a boca', group: 'via', cost: 3, kind: 'ajuda', delta: 3, say: 'Saliva e um fio de sangue. O ronco diminui um pouco, mas volta.' },
      { id: 'acesso', label: 'Acesso venoso', group: 'circ', cost: 6, kind: 'ajuda', delta: 2, focus: 'maos', scene: { patient: { gear: ['soro'] } }, say: 'Acesso no braço. PAS acima de 90 é o alvo no trauma de crânio.' },
      { id: 'hiperventilar', label: 'Ventilar rápido para "baixar a pressão"', group: 'via', cost: 3, kind: 'dano', after: ['iot'], delta: -8, say: 'O Bené segura a sua mão: "Devagar, {dr}." No trauma de crânio, sem hiperventilar: 10 a 12 por minuto.' },
      {
        id: 'historia',
        label: 'Sentar no meio-fio com o Seu Anselmo',
        group: 'cena',
        cost: 3,
        kind: 'info',
        after: ['iot'],
        focus: 'pessoas',
        sets: { noite_anselmo_historia: true },
        say: '"O meu filho caiu aqui. Embaixo dessa cruz. Vinte e seis anos, capacete azul. Em 2019, quase duas da manhã. A ambulância levou quarenta minutos. Eu era vigia da usina; quando me ligaram, já tinha acabado. A minha filha tava com ele, segurando a mão. Ninguém tinha ensinado nada pra ela." Ele olha o rapaz na prancha. "Eu fiz o curso dos Bombeiros. Comprei o rádio. Eu não chego pra salvar, {dr}. Eu chego pra ninguém ficar sozinho."',
      },
    ],
    dest: ['REG'],
    debrief: 'Trauma de crânio grave: Glasgow 7, ronco, respiração lenta, pupilas diferentes. Glasgow 8 ou menos é via aérea definitiva: máscara nenhuma resolve quem não protege a via aérea, e a intubação aqui era a indicação certa. Cervical desde o início, sem hiperventilar, PAS acima de 90 e Regional.',
    source: 'SAV AT5 (TCE) · AP7/AP10 (intubação) · AP28 (Glasgow) · AT1',
    crew: ['MÁRCIO: Pupila direita maior, {dr}. (o Márcio olha a cruz no poste, depois o chão) Anisocoria.', 'BENÉ: (o Bené não desce da cabine. As mãos no volante, olhando o poste.)'],
    story: {
      chapter: 6,
      title: 'Quarenta minutos',
      minDay: 8,
      open: [
        henrique('Zero um, tudo bem aí? Tudo bem aqui. Tudo... (chiado) ...Cleide, cadê a minha bala?'),
        paula('Zero um, Paula. O Henrique ligou pra central hoje, da clínica. Pediu pra avisar que tá vivo. Achei que vocês iam querer saber.'),
      ],
      before: [
        henrique('Zero um... QRR 3, Av. Brasil, vinte e qua... (quatro minutos de chiado. Do outro lado, alguém respira perto do microfone e não fala.)'),
        { who: 'RÁDIO · VOZ DESCONHECIDA', text: 'Zero um, QTH Av. Brasil, 2400. Dois, quatro, zero, zero. No poste da cruz. Ele tá roncando, eu tô segurando a cabeça. Desculpa invadir a frequência.', when: (s) => !afastado(s) },
        { who: 'RÁDIO · VOZ DESCONHECIDA', text: 'Zero um, desculpa invadir a frequência. Av. Brasil, 2400, no poste da cruz. Ele tá roncando, eu tô segurando a cabeça.', when: afastado },
        { who: 'BENÉ', text: 'Isso é crime, sabia? Transmitir na nossa frequência. (pausa longa) ...Dois mil e quatrocentos. Segura, {dr}. Vou pela Brasil.' },
      ],
      epilogue: [
        { who: 'NARRADOR', text: 'Desta vez o Bené desce. Atravessa a avenida, para na frente do Seu Anselmo e tira o boné. "Fui eu, seu Anselmo. Em 2019. Era eu dirigindo." O velho demora. Depois segura a mão dele com as duas mãos: "A minha filha me contou que o motorista chorou. Eu vim agradecer o choro. Demorei." O Márcio, que também estava lá naquela noite, põe a mão no ombro do Bené e não diz nada. Vocês ficam ali até o rádio chamar.', when: beneContou },
        { who: 'NARRADOR', text: 'O Seu Anselmo pergunta: "O motorista de vocês... sempre foi o mesmo, na 01?" Da cabine, o Bené liga o motor antes de você responder. "Bora, {dr}. Hospital." No caminho ele diz uma frase só, na porta do Regional, a quatro quadras dali: "Trinta e um anos de volante. A gente carrega umas noites."', when: (s) => !beneContou(s) },
        { who: 'NARRADOR', text: 'Você pensa no almoço. Quem estava no rádio naquela noite era o Henrique. O mesmo Henrique que, hoje, travou quatro minutos no número 2400. O Seu Anselmo não sabe. Você não conta. Não hoje, não aqui.', when: sabeRegulador },
        { who: 'NARRADOR', text: 'De madrugada, a voz do Henrique volta ao rádio: "Zero um... tudo certo aí?" Ninguém responde de primeira.', when: (s) => !afastado(s) && !sabeRegulador(s) },
      ],
      flags: {
        estavel: { noite_voz_no_radio: true, noite_motoboy_vivo: true },
        instavel: { noite_voz_no_radio: true, noite_motoboy_vivo: true },
        obito: { noite_voz_no_radio: true },
      },
    },
  },
  // ---------------------------------------------------------------------------
  // 7 · Desfecho: Quatro minutos
  // ---------------------------------------------------------------------------
  {
    id: 'noite_desfecho',
    title: 'Parada na cruz do poste (o Seu Anselmo)',
    special: true,
    qrr: 3,
    radio: '{unit}, QRR 3, prioridade absoluta. QTH Av. Brasil, 2400, Centro, no poste da cruz. Homem de setenta e poucos anos caído na calçada, não respira. Um motoboy está fazendo massagem "do jeito que ele ensinou".',
    addr: CRUZ,
    scene: {
      place: 'calcada',
      light: 'noite',
      patient: { pose: 'deitado', age: 'idoso', sex: 'M', skin: 'cianose', signs: ['olhos_fechados'], wear: 'social' },
      props: ['poste', 'moto', 'celular'],
      cast: [{ role: 'curioso', act: 'rcp', sex: 'M', wear: 'motoboy' }, { role: 'curioso', act: 'mao_na_boca', at: 'fundo' }],
    },
    see: [
      'Quatro minutos. O Bené marca no relógio do painel e diz em voz alta: "Quatro." Embaixo da cruz do poste, um rapaz de jaqueta de entrega comprime o peito do Seu Anselmo, contando como ele contava: "...vinte e oito, vinte e nove, trinta."',
      'No chão, a capa cinza aberta, o caderno e o radinho chiando a frequência de vocês. Na mão do Seu Anselmo, ainda fechada, uma flor de verdade, de floricultura. A de plástico do poste está no bolso dele.',
    ],
    vitals: { pa: '—', fc: '0', fr: '0', sat: '—', ritmo: 'Fibrilação ventricular' },
    vitalsAfter: { pa: '96x60', fc: '88', fr: '14', sat: '94%', ritmo: 'Sinusal' },
    arrest: {
      start: 'FV',
      rules: [
        { from: 'FV', to: 'AESP', after: ['choque'], say: 'Dois minutos de massagem. Na checagem, o traçado mudou: complexos estreitos, organizados. O Márcio procura o pulso: nada.' },
        { from: 'AESP', to: 'FV', after: ['adrenalina', 'causas'], say: 'Mais dois minutos. Na checagem, o traçado mudou de novo. Pulso? Nada.' },
      ],
    },
    start: 62,
    decay: 1.15,
    treatOnScene: true,
    actions: [
      { id: 'rcp', label: 'Assumir as compressões (30:2)', group: 'circ', cost: 4, kind: 'critico', delta: 6, focus: 'peito', scene: { cast: [{ role: 'socorrista', act: 'rcp' }, { role: 'socorrista', act: 'ventilando', at: 'cabeca' }, { role: 'curioso', act: 'chorando', at: 'fundo', sex: 'M', wear: 'motoboy' }], patient: { gear: ['ambu'] } }, say: 'O Márcio assume. O rapaz senta no meio-fio, com as mãos tremendo, e continua contando baixinho.' },
      { id: 'monitor', label: 'Pás do monitor: ver o ritmo', group: 'circ', cost: 5, kind: 'critico', shows: ['ritmo', 'fc'], scene: { patient: { gear: ['eletrodos'] } }, say: 'Pás no peito. O traçado aparece na tela. Pulso carotídeo: ausente. Leia o monitor.' },
      { id: 'choque', label: 'Desfibrilar (200 J bifásico)', group: 'circ', cost: 4, kind: 'critico', needs: ['monitor'], when: [...SHOCK], wrongSay: CHOQUE_ERRADO, delta: 10, say: '"Todos afastados!" Choque. O Bené fala sozinho, olhando o poste: "Vai, seu Anselmo."' },
      { id: 'cagada', label: 'CA-GA-DA (cabos, ganho, derivação)', group: 'circ', cost: 4, kind: 'neutro', needs: ['monitor'], when: ['ASSISTOLIA'], wrongSay: CAGADA_ERRADO, wrongDelta: -3, say: 'Linha reta confirmada.' },
      { id: 'acesso', label: 'Acesso venoso', group: 'circ', cost: 6, kind: 'ajuda', focus: 'maos', scene: { patient: { gear: ['soro'] } }, say: 'Acesso no braço, a veia de doador de sempre.' },
      {
        id: 'causas',
        label: 'Buscar causas reversíveis (5H/5T)',
        group: 'circ',
        cost: 4,
        kind: 'critico',
        after: ['choque'],
        say: 'Hipovolemia? Não sangrou. Hipóxia? Ventilando bem, o peito sobe. Hipoglicemia? Glicemia 112: ele jantou desta vez. Tensão no tórax? Murmúrio dos dois lados. Tamponamento? Jugular normal. Tóxicos? Só a insulina. A mais provável é a trombose coronariana: segue a RCP e a adrenalina.',
      },
      { id: 'adrenalina', label: 'Adrenalina 1 mg IV', group: 'med', cost: 3, kind: 'critico', needs: ['acesso'], delta: 8, say: 'Adrenalina 1 mg, flush, braço elevado. Próxima em 3 a 5 minutos.' },
      { id: 'choque2', label: 'Desfibrilar de novo', group: 'circ', cost: 4, kind: 'critico', after: ['causas'], when: [...SHOCK], wrongSay: CHOQUE_ERRADO, delta: 14, say: '"Afastados!" Segundo choque. O peito pula. Compressões.' },
      { id: 'amiodarona', label: 'Amiodarona 300 mg IV', group: 'med', cost: 3, kind: 'critico', needs: ['acesso', 'choque2'], when: [...SHOCK], wrongSay: AMIO_ERRADO, wrongDelta: -4, delta: 8, say: 'Amiodarona 300 mg em bolus. Mais dois minutos de massagem.' },
      { id: 'pulso', label: 'Parar tudo para sentir o pulso', group: 'circ', cost: 5, kind: 'dano', until: ['choque2'], delta: -10, say: 'Pausa longa, nada de pulso. A checagem é rápida, a cada dois minutos.' },
    ],
    dest: ['REG'],
    debrief:
      'Fibrilação ventricular (choque), que virou atividade elétrica sem pulso depois do choque (sem choque: adrenalina e 5H/5T), e voltou a FV (choque de novo e amiodarona 300 mg). O ritmo muda durante a RCP; cada checagem de dois minutos é uma leitura nova. Quatro minutos de chegada e massagem de leigo desde o primeiro minuto.',
    source: 'SAV AC5–AC8 (FV, AESP, 5H/5T; AHA 2015) · fichas de adrenalina e amiodarona',
    crew: ['DR. CASTRO: Eu cuido da via aérea, {dr}. O ritmo é seu. Lê com calma: calma é rápido.', 'BENÉ: (o Bené segura o radinho do Seu Anselmo na mão e não larga)'],
    story: {
      chapter: 7,
      title: 'Quatro minutos',
      minDay: 9,
      at: 23 * 60 + 50,
      crew: 'Seu Bené (condutor) · Dr. Castro · Enf. Márcio · você',
      open: [
        { who: 'DR. CASTRO', text: 'Castro. Hoje eu vou junto. Não pergunta por quê: pressentimento de velho. E eu trouxe dinheiro trocado.' },
        { who: 'BENÉ', text: 'Dinheiro trocado pra quê?' },
        { who: 'DR. CASTRO', text: 'A Lurdinha não aceita cartão de madrugada, Bené.' },
      ],
      before: [
        henrique('Zero um... (a voz firme, pela primeira vez em semanas) QRR 3, Av. Brasil, 2400. É o senhor do rádio, Bené. O que liga aqui toda noite pra corrigir os meus endereços. Ninguém sabe disso, só eu e a Cleide. (pausa) Vai rápido. Desta vez vai rápido.'),
        paula('Zero um, QRR 3, Av. Brasil, 2400. Quem ligou pediu pelo nome: "a 01 do Seu Bené". Vai.'),
        { who: 'BENÉ', text: 'Segura, {dr}. Hoje eu vou pela Brasil.' },
      ],
      epilogue: [
        { who: 'NARRADOR', text: 'Uma da manhã. O Seu Anselmo sobe para a UTI do Regional com pulso e o caderno no peito, embaixo do lençol. Na última página, com a sua letra, porque ele pediu com os olhos: "01 · 4 min." A flor de floricultura ficou com o Bené, para pôr no poste quando ele puder.', when: (s) => !!s.flag('noite_anselmo_vivo') },
        { who: 'NARRADOR', text: 'Uma da manhã. Vocês fizeram tudo, e não voltou. O Bené guarda o caderno no porta-luvas da 01; na última página, com a letra dele: "01 · 4 min. Não deu. Mas ninguém ficou sozinho." Depois amarra a flor de floricultura no poste, do lado da cruz.', when: (s) => !!s.flag('noite_anselmo_morreu') },
        { who: 'NARRADOR', text: 'O rapaz que fez a massagem era o motoboy da outra noite, o da cruz. "Ele segurou a minha cabeça", diz. "Agora eu sei contar até trinta."', when: (s) => !!s.flag('noite_motoboy_vivo') },
        { who: 'DR. CASTRO', text: 'Na volta, o Castro pede para passar pela Santos Dumont. A Lurdinha abre a porta de aço pela metade. Três pastéis de palmito e um embrulhado "pra Simone". "2019 tá pago", ele diz. "A aposta acaba hoje." Ninguém pergunta qual era a aposta. O Bené come de pé e não fala nada por um pastel inteiro.' },
        { who: 'BENÉ', text: 'Na volta, o Bené diz: "Um dia eu te conto uma coisa, {dr}. Não hoje."', when: (s) => !beneContou(s) },
        { who: 'BENÉ', text: 'Na volta, o Bené diz: "Dessa vez eu cheguei, {dr}. Quatro minutos. Anota aí também, que eu quero ver escrito."', when: beneContou },
        { who: 'NARRADOR', text: 'Às 0h50 a central chama: "Zero um... ele tá vivo?" É o Henrique. É a primeira vez que você ouve ele perguntar de um paciente depois.', when: (s) => !afastado(s) && !!s.flag('noite_anselmo_vivo') },
      ],
      flags: {
        estavel: { noite_anselmo_vivo: true, noite_desfecho: true },
        instavel: { noite_anselmo_vivo: true, noite_desfecho: true },
        obito: { noite_anselmo_morreu: true, noite_desfecho: true },
      },
      afterwards: [
        { who: 'RÁDIO · USB 01 (JOANA)', text: 'Joana pra 01: o Seu Anselmo tirou a licença de radioamador. Agora é legal. Ele pediu pra avisar que vai continuar corrigindo endereço, mas "com documento".', when: (s) => !!s.flag('noite_anselmo_vivo') },
        { who: 'BENÉ', text: 'Passei na Brasil hoje, {dr}. Pela Brasil mesmo. Tem flor nova no poste. Não fui eu. Ou fui. Não lembro.' },
        { who: 'RÁDIO · USB 01 (JOANA)', text: 'Joana pra 01: madrugada sem USA 02 e 03 de novo. Se alguém da Gazeta perguntar, eu não disse nada. Mas eu disse.', when: (s) => !!s.flag('noite_plano_noturno') },
        { who: 'DR. CASTRO', text: 'Castro na escuta. Alguém viu o caderno do Seu Anselmo? O Bené diz que tá no porta-luvas. Eu digo que é documento histórico.' },
      ],
    },
  },
];

/** tudo o que a Intervenção conhece: as avulsas e os capítulos da história (que só entram pela história) */
export const FIELD_CASES: FieldCaseX[] = [...FIELD_POOL, ...FIELD_STORY_CASES];
