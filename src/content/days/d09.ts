// =============================================================================
// DIA 9 — "Linha Direta" (bíblia de roteiro do documento de design)
// Centro moral do jogo. Convergem: 🌾 bombinha (D3), 🌾 Tia Márcia (D8),
// 🌾 Rosângela (D8), 🌾 queda da Cida (D8), lealdade da Simone, Henrique (D8).
// Garantia de roteiro: às 14:00 existe exatamente uma USA livre.
// O rendez-vous das 14:20 só existe para quem negociou com o Regional às 11:00.
// =============================================================================
import type { Ctx, TruthDef } from '../../engine/types';
import { hm } from '../../engine/util';
import { day, call, fx, is, NUM, ADDR } from '../dsl';

/** Cenário Moderado (bombinha comprada) × Grave (sem bombinha) */
const M = (c: Ctx) => c.flag('bombinha');

const casaTruth = (c: Ctx): TruthDef =>
  M(c)
    ? { dx: 'Crise de asma moderada', sev: 'amarelo', ok: ['USB'], dest: ['UPA', 'REG'] }
    : { dx: 'Crise de asma grave (tórax silencioso)', sev: 'vermelho', ok: ['USA', 'USB'], dest: ['REG'], noPenalty: true };

const marciaTruth = (c: Ctx): TruthDef =>
  M(c)
    ? { dx: 'Anafilaxia grave (picada de abelha)', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 28, bad: 70, guideBonus: 35 }, key: 'davi_marcia' }
    : { dx: 'Anafilaxia grave (picada de abelha)', sev: 'vermelho', ok: ['USA', 'USB'], dest: ['REG'], risk: { good: 28, bad: 70, guideBonus: 35 }, key: 'davi_marcia', noPenalty: true };

export const DAY = day({
  day: 9,
  title: 'Linha Direta',
  weekday: 'Quinta-feira',
  weather: 'Calor seco, 33 °C. Mangueiras floridas, abelhas agitadas.',
  goal: { maxUSA: 3, bonus: 30 },
  onStart: fx.all(fx.doc('bilhete_marcia'), fx.doc('jornal_rosangela')),
  newspaper: (c) => ({
    headline: c.key('rosangela') === 'perdido' ? 'Mulher é morta em casa na Rua Ipê' : 'Mulher pede socorro com "pedido de pizza" e é resgatada',
    sub: c.key('rosangela') === 'perdido' ? 'Vizinhos dizem que ouviram gritos. Ligação à emergência foi encerrada como trote.' : 'Agressor foi preso na Rua Ipê, 112, Jardim Norte. Vítima está num abrigo.',
    photo: c.key('rosangela') === 'perdido' ? 'policia' : 'casa',
    stories: [
      { title: 'Saúde+ Gestão comemora economia', text: 'A OS divulgou economia de 18% na frota de ambulâncias desde o corte de viaturas.' },
      { title: 'Calor multiplica enxames', text: 'Mangueiras do Jardim Primavera estão cheias de abelhas. Bombeiros pedem cuidado a alérgicos.' },
      { title: 'Postos sem remédio de pressão', text: 'Falta de anti-hipertensivo nas UBS deve durar até a semana que vem.' },
    ],
    notice: 'Novas páginas no Manual: 9-A (destino hospitalar), 9-B (concorrência de recursos), 9-C (impedimento do regulador).',
    ad: 'Saúde+ Gestão: eficiência que salva.',
    weather: 'Calor seco · 33 °C',
  }),
  handover: (c) => ({
    id: 'd09_passagem',
    bg: 'central',
    nodes: {
      start: {
        lines: [
          { who: 'NARRADOR', t: 'O Henrique está de pé, jaleco aberto, mascando bala de menta. O cheiro de menta é forte demais para as sete da manhã.' },
          c.flag('henrique_coberto')
            ? { who: 'HENRIQUE', t: '{nome}, meu herói. Te devo uma, sério.' }
            : { who: 'HENRIQUE', t: 'Ah. Bom dia. (ele não olha pra você)' },
          { who: 'HENRIQUE', t: 'Noite tranquila. Deixei um velhinho de pressão na fila, ligou 06:52. Nada demais, você pega.' },
          { who: 'NARRADOR', t: 'As mãos dele não param de mexer no crachá.' },
          { who: 'HENRIQUE', t: 'Vou dormir até as cinco. Se o Peixoto perguntar, eu saí sete e quinze.' },
        ],
        choices: [
          { label: '"Henrique, você tá bem?"', next: 'pergunta', effect: fx.set('henrique_perguntado') },
          { label: '"Bom descanso."' },
        ],
      },
      pergunta: { lines: [{ who: 'HENRIQUE', t: 'Tô ótimo. Calor, né.' }] },
    },
  }),
  links: [
    {
      a: 'doc:ordem_peixoto',
      b: 'manual:usa_criterio',
      insight: 'A "reserva técnica" da USA 01 não existe no Manual: é ordem verbal sem respaldo. Anotado no diário.',
      onFind: fx.all(fx.set('ordem_peixoto_registrada'), fx.diary('13:45 — Peixoto: "USA 01 só sai pra parada". Ordem verbal sem respaldo no Manual.', 'Ordem verbal')),
    },
  ],
  timeline: [
    { at: '07:00', kind: 'script', id: 'oficina', run: (c) => c.setUnit('USB04', 'FORA', hm('12:00'), 'Oficina') },
    { at: '07:02', kind: 'radio', who: 'SISTEMA', text: 'USB 04 na oficina. Previsão de retorno: 12:00.' },
    {
      at: '11:00',
      kind: 'script',
      id: 'retencao',
      run: (c) => {
        const moto = c.callStatus('d09_moto');
        const usaId = moto?.units.find((u) => u.startsWith('USA'));
        if (!usaId) return;
        const u = c.shift.units[usaId];
        // não prende uma USA em ocorrência (a da moto ainda indo/no local, ou já despachada para outra ligação)
        if (!u || u.status === 'DESLOC' || u.status === 'LOCAL' || u.status === 'TRANSP') return;
        c.setUnit(usaId, 'RETIDO', hm('15:30'), 'Retenção de maca · REGIONAL');
        c.sflag('retida', usaId);
        c.request(
          u.radioName,
          `Central, ${u.label} no Regional. Sem maca. Paciente intubado na nossa, não dá pra tirar. Previsão... não tem previsão.`,
          [
            {
              id: 'negociar',
              label: 'Ligar para o Regional e negociar (15 min)',
              cost: 15,
              effect: (s) => {
                s.setUnit(usaId, 'RETIDO', hm('14:20'), 'Retenção de maca · liberação 14:20');
                s.set('d9_negociou');
              },
              reply: 'Central, conseguiram uma previsão: liberam a gente às 14:20.',
            },
            { id: 'nao', label: 'Não ligar agora' },
          ],
          'nao',
          25,
        );
      },
    },
    {
      at: '12:30',
      kind: 'script',
      id: 'pane',
      run: (c) => {
        if (c.sflag('retida')) return;
        const u2 = c.shift.units['USA02'];
        if (u2 && (u2.status === 'QRV' || u2.status === 'RETORNO')) {
          c.setUnit('USA02', 'PANE', hm('16:00'), 'Pane elétrica');
          c.radio('USA 02 · TICO', 'Central, USA 02 com pane elétrica na base. Mecânico só às quatro.', 'alerta');
        }
      },
    },
    {
      at: '13:40',
      kind: 'script',
      id: 'usb01',
      run: (c) => {
        const u = c.shift.units['USB01'];
        // não tira a USB 01 de uma ocorrência em andamento (o paciente ficaria sem viatura)
        if (!u || u.status === 'DESLOC' || u.status === 'LOCAL' || u.status === 'TRANSP') return;
        if (u.status !== 'QRV') c.setUnit('USB01', 'QRV');
        c.radio('USB 01 · JOANA', 'Central, USB 01 de volta na base Vila Esperança. QRV.', 'info');
      },
    },
    {
      at: '13:45',
      kind: 'interfone',
      who: 'DR. PEIXOTO',
      text: '{Dr}, painel amarelo. Uma USA presa, a outra é a última. A 01 é reserva técnica: só sai pra parada, entendeu? Pra parada.',
      run: (c) => c.doc('ordem_peixoto'),
    },
    {
      at: '13:59',
      kind: 'script',
      id: 'garantia',
      run: (c) => {
        const usas = c.unitsOfType('USA');
        const free = usas.filter((u) => u.status === 'QRV' || u.status === 'RETORNO');
        if (free.length === 0) {
          // só "libera antes do previsto" quem não está com paciente (retida, pane, fora)
          const idle = (st: string) => st !== 'DESLOC' && st !== 'LOCAL' && st !== 'TRANSP';
          const cand = usas.find((u) => u.id !== c.sflag('retida') && idle(u.status)) ?? usas.find((u) => idle(u.status));
          if (cand) {
            c.setUnit(cand.id, 'QRV');
            c.radio(cand.radioName, `Central, ${cand.label} liberada antes do previsto. QRV na base.`, 'info');
          }
        } else if (free.length > 1) {
          const extra = free.find((u) => u.id === 'USA02') ?? free[1];
          c.setUnit(extra.id, 'PANE', hm('16:00'), 'Pane elétrica');
          c.radio(extra.radioName, `Central, ${extra.label} com pane elétrica. Só volta às quatro.`, 'alerta');
        }
      },
    },
    {
      at: '14:00',
      kind: 'simone',
      who: 'SIMONE',
      when: is.v('lealSimone', '>=', 6),
      text: '{Dr}. É da sua casa. Quer que eu fique na linha com ela enquanto {m:o senhor|a senhora} pega a outra?',
      options: [
        { id: 'sim', label: '"Fica, Simone. Obrigad{m:o|a}."', effect: (c) => c.set('simone_segura') },
        { id: 'nao', label: '"Não precisa."' },
      ],
    },
    {
      at: '14:05',
      kind: 'script',
      id: 'religa',
      run: (c) => {
        if (c.flag('simone_segura')) return;
        const casa = c.callStatus('d09_casa');
        if (casa && casa.status === 'fila') {
          casa.noteText = M(c) ? (c.g === 'M' ? 'LIGOU DE NOVO. Sua esposa, desesperada.' : 'LIGOU DE NOVO. Seu marido, desesperado.') : 'LIGOU DE NOVO. Agora é a Dona Zélia.';
          c.set('d9_lucia_religou');
        }
      },
    },
    { at: '15:00', kind: 'simone', who: 'SIMONE', text: 'Eu vi o número, {dr}. Não vou falar nada.' },
    { at: '15:01', kind: 'simone', who: 'SIMONE', when: is.v('lealSimone', '>=', 8), text: 'E, se quer saber, eu teria feito igual. Qualquer que fosse.' },
  ],
  calls: [
    // ----------------------------------------------------------------- 1 ⚖
    call({
      id: 'd09_valdir',
      ref: 'D9 #1',
      at: '06:52',
      num: '(17) 3325-0610',
      caller: 'Seu Valdir',
      callerName: 'Seu Valdir',
      type: 'comum',
      voice: 'idoso',
      note: 'Senhor educado. Pressão alta. (Recebida 06:52 · regulador: —)',
      noteFixed: true,
      addr: { rua: 'Rua Rui Barbosa', n: 610, bairro: 'Jardim Norte', ref: 'Casa de esquina com a Sete de Setembro.' },
      amb: ['radio_am', 'passaros'],
      open: ['Bom dia, {dr}. Desculpa ligar cedo. Fui na farmácia medir a pressão e deu {{18 por 11|pa}}. A moça ficou assustada e mandou eu ligar.'],
      q: {
        idade: '71. Pressão alta há vinte anos.',
        historico: 'Tomo, mas {{acabou no posto faz dois dias|acabou_posto}}. Disseram que chega semana que vem.',
        oque: 'Uma {{dorzinha de cabeça, igual sempre|dor_cabeca}}.',
        dorpeito: 'Dor no peito? Não, {m:senhor|senhora}.',
        respira: 'Respiro bem. Falta de ar, não.',
        fast: ['Tô sorrindo {m:pro senhor|pra senhora} aqui. [ri]', 'Levantei os dois braços. "O céu é azul." Tá bom assim?'],
        inicio: 'A dor de cabeça desde ontem.',
        consciencia: 'Lúcido, lúcido.',
        paciente: 'Sou eu mesmo, {dr}.',
      },
      extra: [
        { id: 'visao', label: 'Visão embaçada? Confusão?', say: 'O senhor está enxergando bem? Alguma confusão, fala enrolada?', a: 'Enxergo bem. Tô lúcido, {dr}, sou contador aposentado.' },
        {
          id: 'farmacia',
          kind: 'fala',
          label: 'Falar da Farmácia Popular',
          say: 'O senhor sabia que, com a receita, o remédio de pressão sai de graça na Farmácia Popular?',
          a: 'Não sabia que dava, {dr}! Vou lá hoje mesmo. Deus lhe pague.',
          onAsk: fx.set('farmacia_popular'),
        },
      ],
      patient: { name: 'Valdir Gomes', age: 71, sex: 'M' },
      truth: { dx: 'Hipertensão sem sinais de gravidade (sem remédio)', sev: 'verde', ok: ['ORI', 'USB'], best: 'ORI', ref: ['UBS', 'UPA'], dest: ['UPA'], must: ['dorpeito', 'respira', 'fast', 'visao'] },
      radio: { ok: 'Central, {unit}. Seu Valdir, 18 por 11, assintomático, lúcido. Levamos pra UPA ajustar o remédio.' },
      diary: { ori: 'Pressão 18 por 11, sem sintomas de gravidade. O remédio "acabou no posto".', alive: 'Pressão 18 por 11. Levado à UPA para ajuste.' },
    }),
    // ----------------------------------------------------------------- 2
    call({
      id: 'd09_moto',
      ref: 'D9 #2',
      at: '08:20',
      anchor: true,
      num: '(17) 3321-1001',
      caller: 'Cléber (frentista)',
      callerName: 'Cléber',
      type: 'testemunha',
      voice: 'jovem_h',
      note: 'Acidente na Av. Norte. Vítima no chão.',
      noteFixed: true,
      addr: { rua: 'Av. Norte', n: 1001, bairro: 'Jardim Norte', ref: 'Posto Avenida, em frente.' },
      amb: ['buzinas', 'rua', 'gritos'],
      open: ['Um motoqueiro bateu num carro aqui na frente do posto, ele tá no chão, {{não responde|nao_responde}}!', '[buzinas, motor ligado, alguém gritando "não mexe nele!"]'],
      q: {
        respira: 'Tá fazendo um {{barulho, tipo ronco|ronco}}.',
        consciencia: 'Não, não acorda. Chamei, nada.',
        seguranca: 'O carro tá parado no meio da pista, tem gente desviando.',
        referencia: 'Posto Avenida, em frente.',
        idade: 'Novo, uns vinte.',
        sangramento: 'Do {{ouvido|ouvido}}, e um pouco no queixo.',
        oque: 'Ele vinha rápido, o carro saiu do posto, pá. Voou longe.',
        historico: 'Não sei, {m:moço|moça}, nunca vi ele.',
      },
      extra: [
        { id: 'capacete', label: 'Capacete?', say: 'Ele está de capacete?', a: 'Tá de capacete. {{Tá saindo sangue do ouvido|ouvido2}}.' },
        { id: 'mexe', label: 'Se mexe?', say: 'Ele mexe braços e pernas?', a: 'Não. Nada.' },
      ],
      links: [{ a: 'ronco', b: 'nao_responde', insight: 'Não responde e ronca após trauma de alta energia, sangue no ouvido: TCE grave. Vermelho → USA → Regional.' }],
      worsen: [{ after: 100, lines: ['{{Ele vomitou! Tá engasgando!|vomitou}}'], guide: 'trauma' }],
      guide: { id: 'trauma' },
      patient: { name: 'Everton Lima', age: 22, sex: 'M' },
      truth: { dx: 'Traumatismo cranioencefálico grave', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 45, bad: 110, guideBonus: 15 } },
      radio: { ok: 'Central, {unit}. TCE grave, Glasgow 6, intubado. Seguimos Regional.' },
      onResolve: (e, r) => {
        if (r.outcome !== 'obito' && e.v('lealSimone') >= 6) e.toast('SIMONE (baixinho): Conheço esse menino. Entrega junto com o Wesley.');
      },
      diary: { alive: 'Entregador de aplicativo. TCE grave, intubado na rua.', dead: 'Entregador de aplicativo. TCE grave.' },
    }),
    // ----------------------------------------------------------------- 3 (A: queda regulada no D8)
    call({
      id: 'd09_cida',
      ref: 'D9 #3A',
      at: '09:00',
      anchor: true,
      when: (c) => !c.flag('cida_queda_dispensada'),
      num: NUM.cida,
      caller: 'Dona Cida',
      callerName: 'Dona Cida',
      type: 'frequentador',
      voice: 'cida',
      note: 'Dona Cida. Hoje com gesso.',
      noteFixed: true,
      addr: ADDR.cida,
      amb: ['tv'],
      open: ['Oi {meu} {filho}, é a Cida! Ó, {{o gesso tá coçando que é uma loucura|gesso}}. Posso enfiar uma agulha de tricô por dentro?'],
      q: {
        oque: 'O gesso, {meu} {filho}! Coça!',
        consciencia: 'Acordadíssima.',
        respira: 'Respiro, respiro.',
        idade: 'Setenta e nove.',
        paciente: 'Sou eu mesma!',
        historico: 'Pressão. E agora esse braço, né.',
      },
      extra: [
        { id: 'dedos', label: 'Como estão os dedos?', say: 'Como estão os dedos da mão do gesso? Cor, inchaço, formigamento?', a: '{{Rosadinhos, mexendo|dedos_ok}}. Só coça.' },
        {
          id: 'conversar',
          kind: 'fala',
          label: 'Conversar um pouco com ela',
          cost: 15,
          say: 'E fora o gesso, Dona Cida, como a senhora tá?',
          a: [
            'Ah, uma amiga minha da igreja falou que o netinho dela tem asma. Coitadinho.',
            'Meu falecido tinha, sabe? Eu deixava {{a bombinha sempre na bolsa, sempre|bombinha_bolsa}}. A gente nunca sabe a hora.',
          ],
          onAsk: fx.all(fx.add('humanidade', 1, 'conversou com a Dona Cida'), fx.set('cida_conversou_d9')),
        },
      ],
      onAnswer: fx.set('cida_ligou_d9'),
      patient: { name: 'Aparecida (Dona Cida)', age: 79, sex: 'F' },
      truth: { dx: 'Coceira no gesso (fratura de punho em tratamento)', sev: 'azul', ok: ['ORI'], ref: ['CASA', 'UBS'] },
      diary: { ori: 'Coceira no gesso. Orientada a não enfiar nada e observar os dedos.' },
    }),
    // ----------------------------------------------------------------- 3 (B: queda dispensada no D8)
    call({
      id: 'd09_cida_b',
      ref: 'D9 #3B',
      at: '09:00',
      anchor: true,
      when: (c) => c.flag('cida_queda_dispensada'),
      num: NUM.cida,
      caller: 'Dona Cida',
      callerName: 'Dona Cida',
      type: 'frequentador',
      voice: 'cida',
      note: 'Dona Cida. Voz diferente.',
      noteFixed: true,
      addr: ADDR.cida,
      amb: ['silencio'],
      open: ['{{O punho tá roxo e inchado desde ontem|punho}}, {meu} {filho}. {{Não dormi.|nao_dormiu}}', '[ela respira fundo]', 'Desculpa ligar de novo.'],
      q: {
        oque: 'Desde a queda de ontem. Eu achei que ia passar.',
        consciencia: 'Acordada. Cansada.',
        idade: 'Setenta e nove.',
        paciente: 'Sou eu.',
        historico: 'Pressão. Tomo o remédio.',
        sangramento: 'Não, só roxo.',
      },
      extra: [{ id: 'dedos', label: 'Como estão os dedos?', say: 'E os dedos, Dona Cida? Mexem? Estão frios?', a: '{{Inchados, meio dormentes|dedos_ruins}}.' }],
      onAnswer: fx.set('cida_ligou_d9'),
      patient: { name: 'Aparecida (Dona Cida)', age: 79, sex: 'F' },
      // RT6: idosa > 70 anos com fratura → USI/USB. Dedos "inchados, meio dormentes" = alteração de sensibilidade
      // distal, que o RC24 chama de "comprometimento vascular distal" (discriminador de USA): USA ⚖. Deixou de ser
      // "fratura simples" (perfil traumato-ortopédico, Anexo VII): Regional também é destino correto.
      truth: { dx: 'Fratura de punho não tratada (queda de ontem)', sev: 'amarelo', ok: ['USB', 'USA'], best: 'USB', dest: ['REG', 'UPA'] },
      diary: { alive: 'Fratura de punho que esperou um dia inteiro. A queda de ontem tinha sido dispensada.' },
    }),
    // ----------------------------------------------------------------- 4
    call({
      id: 'd09_parto',
      ref: 'D9 #4',
      at: '10:15',
      anchor: true,
      num: '(17) 99456-0088',
      caller: 'Diego (marido)',
      callerName: 'Diego',
      type: 'comum',
      voice: 'jovem_h',
      note: 'Gestante, contrações. Marido no telefone.',
      noteFixed: true,
      addr: ADDR.diego,
      amb: ['gemidos', 'bebe'],
      open: ['Minha mulher tá ganhando neném! A bolsa estourou, {{ela diz que quer fazer força|forca}}!', '[gemidos ritmados; uma criança pequena pergunta: "mamãe tá dodói?"]'],
      q: {
        oque: 'A bolsa estourou faz meia hora, agora as dores tão grudadas uma na outra!',
        consciencia: 'Acordada, gritando.',
        respira: 'Respira, ofegante.',
        idade: 'Ela tem 27.',
        sangramento: 'Pouquinho.',
        historico: 'Fez pré-natal todinho, tudo normal.',
        gestacao: ['39 semanas.', 'Segundo filho. {{O primeiro nasceu no carro.|primeiro_carro}}'],
        referencia: 'Rua das Acácias, 88. A quatro casas da casa azul.',
        seguranca: 'Tranquilo.',
      },
      extra: [{ id: 'cabeca', label: 'Dá pra ver a cabeça?', say: 'Dá pra ver a cabeça do bebê?', a: 'Tô vendo... {{cabelinho|cabelinho}}!' }],
      links: [
        { a: 'cabelinho', b: 'manual:expulsivo', insight: 'Cabeça visível e vontade de fazer força: período expulsivo. USB + orientação de parto → Maternidade (Manual p.7).' },
        { a: 'forca', b: 'manual:expulsivo', insight: 'Vontade de fazer força com bolsa rota: período expulsivo (Manual p.7).' },
      ],
      worsen: [{ after: 120, lines: ['DIEGO: {Dr}! Nasceu! Nasceu aqui no chão da sala! Ele tá roxinho!'], guide: 'parto' }],
      guide: { id: 'parto' },
      onStamp: (e) => {
        e.set('d9_parto_regulado');
      },
      patient: { name: 'Tainara (gestante)', age: 27, sex: 'F' },
      // RO2: parto iminente → USI/USB "enquanto aguarda o suporte avançado"; cabeça visível ("apresentação de partes
      // fetais") está na lista de USA, e o primeiro filho nasceu no carro. USB preferida (Manual p.7), USA ⚖.
      truth: { dx: 'Trabalho de parto em período expulsivo', sev: 'amarelo', ok: ['USB', 'USA'], best: 'USB', dest: ['MAT'] },
      radio: { ok: 'Central, {unit}. Recém-nascido chorando forte, mãe bem. Seguimos Maternidade. Vizinha {m:do senhor|da senhora}, né, {dr}? A dona aqui disse que conhece {c:sua esposa|seu marido}.' },
      diary: { alive: 'Parto na Rua das Acácias, 88. Menino, chorou forte. Vizinhos de casa.' },
    }),
    // ----------------------------------------------------------------- 5 (trote sofisticado)
    call({
      id: 'd09_trote',
      ref: 'D9 #5',
      at: '11:30',
      num: '(17) 99001-4471',
      caller: 'Voz de adulto jovem',
      type: 'trotista',
      voice: 'adolescente',
      note: 'Neto, avó caiu da escada.',
      noteWrong: 'Neto, avó caiu da escada. Parece sério.',
      addr: ADDR.rosangela,
      amb: ['videogame'],
      open: ['Minha avó caiu da escada. {{Rua Ipê, 112, Jardim Norte|end_ipe}}. Manda rápido.', '[{{música de videogame baixinha|videogame}}]'],
      q: {
        consciencia: '{{Tá, tá sim...|cons_sim}} {{não, desmaiou.|cons_nao}}',
        oque: 'Ela caiu. Da escada. Manda logo.',
        idade: 'Uns... setenta? Setenta.',
        respira: 'Respira.',
        sangramento: 'Um pouco.',
        historico: 'Não sei. Remédio de velho.',
        paciente: 'Ela não pode falar agora. [música de videogame]',
        referencia: 'Perto da... praça.',
      },
      extra: [{ id: 'nome', label: 'Nome da sua avó?', say: 'Qual o nome da sua avó?', a: '{{Dona... Maria.|hesita}}' }],
      callback: ['[{{"O número chamado não existe ou está fora de serviço."|retorno_inexistente}}]'],
      links: [
        { a: 'cons_sim', b: 'cons_nao', insight: '"Tá acordada" e "desmaiou" na mesma frase: o relato não se sustenta.' },
        { a: 'end_ipe', b: 'doc:rua_ipe', insight: 'Rua Ipê, 112 é a casa da Rosângela, que saiu no jornal de hoje. A casa está fechada.' },
        { a: 'retorno_inexistente', b: 'num', insight: 'Ligar de volta: número inexistente (chip descartável).' },
      ],
      patient: { name: '"Dona Maria"' },
      truth: { dx: 'Trote sofisticado', sev: 'trote', ok: ['TROTE'], prankKind: 'trote' },
      radio: { prank: (c) => (c.key('rosangela') === 'perdido' ? 'Central, {unit}. Casa fechada, fita da polícia na porta. Ninguém aqui.' : 'Central, {unit}. Casa vazia, a moradora tá no abrigo. Era trote.') },
    }),
    // ----------------------------------------------------------------- 6
    call({
      id: 'd09_helio',
      ref: 'D9 #6',
      at: '12:40',
      num: '(17) 3329-1350',
      caller: 'Seu Hélio',
      callerName: 'Seu Hélio',
      type: 'comum',
      voice: 'idoso',
      note: 'Senhor diabético, diz que já melhorou.',
      addr: { rua: 'Rua Paineira', n: 1350, bairro: 'Santa Luzia', ref: 'Casa com jabuticabeira na calçada.' },
      amb: ['cozinha'],
      open: ['{Dr}, eu tremi todo, suei, achei que ia morrer. Aí minha mulher me deu um suco com açúcar e passou. Precisa de ambulância?'],
      q: {
        historico: 'Diabetes. {{Tomo insulina de manhã|insulina}}.',
        oque: 'Tremedeira, suor frio, coração disparado. Agora tô bem.',
        consciencia: 'Tô bem, conversando.',
        respira: 'Normal.',
        idade: '68.',
        inicio: 'Faz uns vinte minutos. Já passou.',
        paciente: 'Sou eu.',
      },
      extra: [
        { id: 'comeu', label: 'Comeu hoje?', say: 'O senhor almoçou hoje?', a: '...{{Pulei o almoço|pulou}}. Minha mulher fala que eu pulo pra economizar, mas é falta de fome.' },
        { id: 'mediu', label: 'Mediu a glicemia?', say: 'Mediu a glicemia?', a: 'Tava 54. Agora deu 112 no aparelhinho.' },
      ],
      links: [{ a: 'insulina', b: 'pulou', insight: 'Insulina de manhã + almoço pulado = hipoglicemia. Já corrigida com açúcar: orientar comer e ajustar a dose na UBS.' }],
      patient: { name: 'Hélio Moreira', age: 68, sex: 'M' },
      truth: { dx: 'Hipoglicemia leve, já corrigida', sev: 'verde', ok: ['ORI'], ref: ['UBS', 'CASA'] },
      diary: { ori: 'Insulina de manhã e refeição pulada: hipoglicemia. Corrigida com suco. "Pula pra economizar."' },
    }),
    // ----------------------------------------------------------------- 7
    call({
      id: 'd09_thais',
      ref: 'D9 #7',
      at: '13:30',
      num: '(17) 99280-0700',
      caller: 'Thaís (mãe)',
      callerName: 'Thaís',
      type: 'comum',
      voice: 'mulher',
      note: 'Mãe calma, criança com dor de ouvido.',
      addr: { rua: 'Rua Sabiá', n: 700, bairro: 'Vila Esperança', ref: 'Perto da escola Monteiro Lobato.' },
      amb: ['desenho'],
      open: ['O Pedro tá com dor no ouvido desde ontem, 38 de febre. Tá brincando, comendo...', 'A {{tia Márcia, do 3º B|tia_marcia}}, mandou ele pra casa de manhã. Ela é um anjo, aquela mulher.'],
      q: {
        oque: 'Dor no ouvido esquerdo, chorou de noite.',
        consciencia: 'Acordado, vendo desenho.',
        respira: 'Normal.',
        idade: 'Oito. É da turma do seu filho, inclusive! O Pedro do 3º B.',
        inicio: 'Desde ontem à noite.',
        historico: 'Nada.',
        paciente: 'PEDRO: Dói aqui, ó.',
      },
      patient: { name: 'Pedro', age: 8, sex: 'M' },
      truth: { dx: 'Otite (dor de ouvido) sem sinais de gravidade', sev: 'verde', ok: ['ORI'], ref: ['UBS', 'UPA'] },
      diary: { ori: 'Dor de ouvido. Colega de turma do Liam, 3º B.' },
    }),
    // ----------------------------------------------------------------- 8 ★ CASA
    call({
      id: 'd09_casa',
      ref: 'D9 #8 ★',
      at: '14:00',
      anchor: true,
      num: NUM.casa,
      caller: '{conj} ({c:sua esposa|seu marido})',
      callerName: '{conj}',
      type: 'familia',
      voice: 'lucia',
      note: 'RES. RUA DAS ACÁCIAS, 40. {Dr}. É da sua casa.',
      noteFixed: true,
      addr: ADDR.casa,
      amb: ['respiracao', 'choro'],
      open: (c: Ctx) =>
        M(c)
          ? [
              '{CONJ}: {nome}? É você? ...Ai, graças a Deus.',
              '{CONJ}: É o Liam, ele tá com crise. Eu dei a bombinha com o espaçador, melhorou um pouco, mas ele tá {{chiando muito|chiando}} e o peito tá puxando.',
              '[chiado audível ao fundo]',
              'ZÉLIA: Devagar, meu anjo, o ar entra pelo nariz...',
            ]
          : [
              '{CONJ}: {nome}! O Liam não tá respirando direito, {{a bombinha acabou faz dias|sem_bombinha}}, eu não sei o que fazer!',
              '[um silêncio estranho]',
              'ZÉLIA: {conj}, {{a boquinha dele tá ficando roxa|boca_roxa}}.',
              '{CONJ}: Mas pelo menos {{parou de chiar|parou_chiar}}, né? Isso é bom, né?',
            ],
      q: {
        respira: (c: Ctx) => (M(c) ? 'Puxando, chiando. Mas entra ar.' : 'Fraquinho. Quase não mexe o peito.'),
        consciencia: (c: Ctx) => (M(c) ? 'Não, tá assustado. Bem acordado.' : 'Tá com {{o olho pesado|sonolento}}, {nome}.'),
        inicio: (c: Ctx) => (M(c) ? 'Uma hora.' : 'Uma hora e pouco, foi piorando.'),
        historico: (c: Ctx) => (M(c) ? 'Dei a bombinha há 15 minutos, como o médico ensinou.' : 'A bombinha acabou, {nome}. Acabou!'),
        idade: 'Oito, {nome}! Você sabe!',
        oque: 'Tava tossindo desde ontem. Começou a puxar o ar depois do almoço.',
        // moderada: frases curtas, mas inteiras ("frases entrecortadas" é discriminador de USA no RC3 e no RP1)
        paciente: (c: Ctx) => (M(c) ? ['{CONJ}: Liam, fala com {m:o pai|a mãe}.', 'LIAM: {Pai}, tô cansado. [chiado] A bombinha ajudou um pouco.'] : ['{CONJ}: Ele não consegue falar, só balança a cabeça.']),
        referencia: 'É a nossa casa, {nome}!',
        seguranca: 'Seguro! Vem logo!',
      },
      extra: [
        { id: 'labios', label: 'Lábios e unhas?', say: 'Como estão os lábios e as unhas dele?', a: (c: Ctx) => (M(c) ? 'Normais.' : '{{Roxinhos|labios_roxos}}.') },
        { id: 'afunda', label: 'O peito afunda?', say: 'O peito dele afunda quando puxa o ar?', a: (c: Ctx) => (M(c) ? 'Um pouco, embaixo da costela.' : 'Muito. Até no pescoço.') },
        {
          id: 'falar_davi',
          kind: 'fala',
          label: 'Falar com o Liam',
          say: 'Põe o telefone no ouvido dele, {c:Lú|Alex}.',
          a: (c: Ctx) =>
            M(c)
              ? ['LIAM: {Pai}, você vai mandar a ambulância grande? [chiado]']
              : ['ZÉLIA: Ele tá ouvindo, {filho}. Fala com ele.', 'EU: Liam. Respira devagar comigo. Pelo nariz. Eu tô aqui.', '[um chiado fraquinho]'],
          onAsk: fx.add('lacos', 1, 'falou com o Liam'),
        },
      ],
      links: [
        { a: 'parou_chiar', b: 'boca_roxa', insight: '"Parou de chiar" com a boca roxa não é melhora: é TÓRAX SILENCIOSO. Gravidade extrema (Manual p.5-B).' },
        { a: 'parou_chiar', b: 'manual:torax_silencioso', insight: 'Tórax silencioso: o ar quase não entra. {Oconj} está minimizando sem saber (Manual p.5-B).' },
        { a: 'sonolento', b: 'manual:asma_grave', insight: 'Sonolência e lábios roxos numa crise de asma: grave. USA (Manual p.5-B).' },
        { a: 'chiando', b: 'manual:asma_mod', kind: 'confirma', insight: 'Chia mas fala frases curtas, lábios normais, melhorou um pouco com a bombinha: moderada. USB (Manual p.5-B).' },
      ],
      impedimento: {
        cost: 10,
        decision: { resource: 'USB', color: 'amarelo', dest: 'UPA' },
        text: 'O Peixoto assume a ligação na linha dele: "Deixa comigo. USB 01, Rua das Acácias, 40, com oxigênio." Você fica livre para a outra.',
        effect: fx.all(fx.add('integridade', 1, 'declarou impedimento'), fx.set('d9_impedimento'), fx.set('d9_davi', 'IMPEDIMENTO'), fx.unset('foto_bloqueada')),
      },
      onAnswer: fx.set('foto_bloqueada', 'Você olha a foto. Ele está nela.'),
      onStamp: (e) => {
        e.unset('foto_bloqueada');
        const res = e.s.shift ? Object.values(e.s.shift.calls).find((x) => x.def === 'd09_casa')?.decision?.resource : undefined;
        if (res) e.set('d9_davi', res);
        if (res === 'USA' && M(e)) {
          e.add('integridade', -3, 'favorecimento');
          e.set('d9_favorecimento');
        }
      },
      guide: { id: (c: Ctx) => (M(c) ? 'asma' : 'asma_grave') },
      worsen: [
        {
          after: 25,
          lines: [
            { who: '{CONJ}', t: 'Ele piorou, {nome}... tá puxando mais.', when: (c: Ctx) => M(c) },
            { who: 'ZÉLIA', t: 'Ele tá apagando, {filho}!', when: (c: Ctx) => !M(c) },
          ],
        },
      ],
      patient: { name: 'Liam Moura', age: 8, sex: 'M' },
      truth: casaTruth,
      radio: {
        ok: (c: Ctx) => (M(c) ? '{Dr}, seu menino tá bem. Tá pedindo pra ver a sirene. Liguei ela um pouquinho, não conta pro Peixoto.' : 'Central, {unit}. Liam estabilizado no oxigênio, seguimos para o Regional. Ele tá acordado.'),
        under: '{unit}: criança em crise grave, saturando mal. Precisamos de suporte avançado!',
        saved: 'Central, {unit}. O menino tá estável, acordado. Pode respirar, {dr}.',
      },
      diary: { alive: (c: Ctx) => (M(c) ? 'Meu filho. Crise de asma moderada. Alta à noite.' : 'Meu filho. Crise grave, tórax silencioso. Internado.') },
    }),
    // ----------------------------------------------------------------- 9 ★ MÁRCIA
    call({
      id: 'd09_marcia',
      ref: 'D9 #9 ★',
      at: '14:00',
      anchor: true,
      num: NUM.marcos,
      caller: 'Marcos (marido)',
      callerName: 'Marcos',
      type: 'comum',
      voice: 'homem',
      note: 'Homem. Esposa com falta de ar depois de picada de abelha. Muito nervoso.',
      noteFixed: true,
      addr: ADDR.marcia,
      amb: ['respiracao', 'cachorro'],
      open: [
        'Moça! {Dr}! {{Minha mulher tá roxa|roxa}}, ela não consegue respirar! {{Foi uma abelha|abelha}}, lá no pé de manga, ela é alérgica, pelo amor de Deus!',
        '[respiração com um assobio agudo; cachorro latindo]',
        'MÁRCIA (rouca): Marcos... a garganta...',
      ],
      q: {
        consciencia: 'Tá, mas {{tá ficando mole|mole}}.',
        respira: 'Faz um {{barulho fino, tipo apito|estridor}}.',
        inicio: 'Agora, faz uns cinco minutos!',
        referencia: 'Rua Jacarandá, 215, casa do portão azul, tem um pé de manga enorme na frente.',
        idade: '41.',
        historico: 'Alergia a abelha! {{Ela quase morreu uma vez, faz anos|quase_morreu}}.',
        oque: 'Tava apanhando manga, a abelha picou no pescoço, em dois minutos começou a inchar!',
        paciente: 'MÁRCIA: [{{voz rouca, quase sem ar|rouca}}] ...não... consigo...',
        seguranca: 'Seguro! Vem logo!',
      },
      extra: [
        { id: 'nome', label: 'Nome completo da paciente?', say: 'Qual o nome completo dela?', a: '{{Márcia Albuquerque Reis|marcia_nome}}. Pelo amor de Deus, manda!' },
        { id: 'inchaco', label: 'Inchaço? Manchas?', say: 'Tem inchaço? Manchas na pele?', a: 'A boca e o olho tão inchando, tá cheio de mancha vermelha no braço.' },
        { id: 'adrenalina', label: 'Tem caneta de adrenalina?', say: 'Ela tem caneta de adrenalina em casa?', a: 'Tem uma caneta que a médica deu, mas {{tá vencida desde o ano passado|vencida}}!' },
        { id: 'professora', label: 'Ela é professora?', locked: true, say: 'Ela é professora? Da escola Monteiro Lobato?', a: 'É... do 3º B. Como {m:o senhor|a senhora} sabe?' },
      ],
      links: [
        { a: 'marcia_nome', b: 'doc:marcia', insight: 'Márcia Albuquerque Reis. É a Tia Márcia, a professora do Liam. O bilhete está na sua mesa.', unlock: 'professora', onFind: fx.set('sabia_que_era_marcia') },
        { a: 'estridor', b: 'abelha', insight: 'Picada de abelha em alérgica + estridor + inchaço: anafilaxia. Vermelho, USA. Caneta de adrenalina já, mesmo vencida.' },
      ],
      guide: { id: 'anafilaxia' },
      onStamp: (e) => {
        const res = e.s.shift ? Object.values(e.s.shift.calls).find((x) => x.def === 'd09_marcia')?.decision?.resource : undefined;
        if (res) e.set('d9_marcia', res);
      },
      onResolve: (e, r) => {
        if (r.outcome === 'obito') {
          e.set('marcia_morreu');
          e.keyPatient('davi_marcia', 'perdido');
        } else {
          e.set('marcia_viva');
          e.keyPatient('davi_marcia', 'salvo');
          const davi = e.val<string>('d9_davi');
          if (r.decision?.resource === 'USA' && (davi === 'USB' || davi === 'IMPEDIMENTO')) e.achievement('nem_pelo_meu_filho');
          if (e.flag('rendezvous_d9')) e.achievement('rendezvous');
        }
      },
      patient: { name: 'Márcia Albuquerque Reis', age: 41, sex: 'F' },
      truth: marciaTruth,
      radio: {
        ok: '{central}, Márcia estabilizada. A caneta vencida segurou ela. Quem mandou aplicar? ...Achei. Bom trabalho.',
        saved: '{central}, Márcia estabilizada. Foi por pouco. Quem mandou aplicar a caneta? Bom trabalho.',
        dead: 'Central... óbito constatado às {hora}. (pausa) O marido tá perguntando o nome do regulador. Eu não falei.',
        under: '{unit}: anafilaxia grave, edema de glote! Precisamos de USA, AGORA!',
      },
      diary: {
        alive: 'Tia Márcia, professora do Liam. Anafilaxia. Viva.',
        dead: 'Tia Márcia, professora do Liam. Anafilaxia. A ambulância demorou.',
      },
    }),
    // ----------------------------------------------------------------- 10 ⚖
    call({
      id: 'd09_bruna',
      ref: 'D9 #10',
      at: '17:50',
      num: '(17) 99188-2200',
      caller: 'Bruna',
      callerName: 'Bruna',
      type: 'comum',
      voice: 'jovem_m',
      note: 'Moça, falta de ar.',
      addr: { rua: 'Rua Marechal Deodoro', n: 2200, bairro: 'Centro', ref: 'Prédio azul, apartamento 12.' },
      amb: ['respiracao', 'choro'],
      open: [
        { t: '[...roxa...]', style: 'fantasma', when: (c: Ctx) => c.flag('marcia_morreu') && c.v('desgaste') > 60 },
        'Eu {{não consigo respirar|nao_respira}}! Minha {{boca tá formigando, minhas mãos tão travando|formigando}}!',
        '[respiração rápida e curta, choro, uma porta batendo]',
      ],
      q: {
        idade: '19. Não tenho nada.',
        historico: 'Nada. Nenhuma doença.',
        oque: 'Briguei com meu namorado... ele foi embora... e começou isso.',
        consciencia: 'Tô acordada, tô acordada!',
        respira: 'Rápido! Não para! {{Mas não chia|sem_chiado}}, só não entra ar.',
        dorpeito: 'Aperta... mas é de nervoso, eu acho.',
        inicio: 'Faz uns quinze minutos.',
        paciente: 'Sou eu!',
      },
      extra: [
        { id: 'frases', label: 'Fala frases inteiras?', say: 'Você consegue falar uma frase inteira comigo?', a: '{{Consigo... consigo falar, mas parece que vou morrer|frases}}.' },
        { id: 'labios', label: 'Lábios roxos?', say: 'Olha no espelho: os lábios estão roxos?', a: 'Não... tá normal.' },
        { id: 'inchaco', label: 'Inchaço, picada, alergia?', say: 'Teve alguma picada, inchaço, alergia?', a: 'Não!' },
      ],
      links: [
        { a: 'formigando', b: 'manual:ansiedade', insight: 'Formigamento na boca e mãos, fala frases, lábios normais, sem chiado: crise de ansiedade. Respiração guiada (Manual p.5-B).' },
        { a: 'frases', b: 'nao_respira', insight: '"Não consigo respirar"... mas fala frases inteiras. A falta de ar é real para ela, mas não é obstrução.' },
      ],
      guide: { id: 'respiracao', onOri: true },
      patient: { name: 'Bruna Santana', age: 19, sex: 'F' },
      truth: { dx: 'Crise de ansiedade (hiperventilação)', sev: 'verde', ok: ['ORI', 'USB'], best: 'ORI', ref: ['CASA', 'UBS'], dest: ['UPA'], must: ['frases', 'labios', 'inchaco', 'dorpeito'] },
      diary: { ori: 'Crise de ansiedade depois de uma briga. Respiramos {m:juntos|juntas} até passar.' },
    }),
  ],
  reportField: (c) => {
    const davi = c.val<string>('d9_davi');
    return {
      id: '9b',
      label: 'Justificativa de concorrência (Anexo 9-B)',
      options: [
        {
          id: 'risco',
          label: 'Maior risco imediato de morte.',
          effect: (e) => {
            if (davi === 'USA' && M(e)) {
              e.add('integridade', -2, 'fraude de ficha');
              e.set('mentiu_9B');
            }
          },
        },
        {
          id: 'tempo',
          label: 'Menor tempo de chegada.',
          effect: (e) => {
            if (davi === 'USA') {
              e.add('integridade', -2, 'fraude de ficha');
              e.set('mentiu_9B');
            }
          },
        },
        { id: 'vinculo', label: 'Vínculo pessoal.', when: () => davi === 'USA', effect: fx.set('admitiu_vinculo') },
      ],
    };
  },
  interlude: {
    teaser: (c) => (c.flag('marcia_morreu') ? 'A casa está em silêncio quando você chega.' : 'O Liam está em casa. A bombinha do lado do travesseiro.'),
    familyLacos: 2,
    onBico: fx.add('lacos', -3, 'foi trabalhar hoje'),
    bills: [
      { id: 'internacao_davi', label: 'Táxi e farmácia (internação do Liam)', amount: 40, when: (c) => !c.flag('bombinha'), desc: 'O Liam ficou internado. {Oconj} não costura hoje.', onPay: fx.set('sem_costura_hoje'), onSkip: fx.all(fx.set('sem_costura_hoje'), fx.add('lacos', -1, '{oconj} pagou do bolso')) },
      { id: 'bombinha_receita', label: 'Bombinha nova (receita da alta)', amount: (c) => (c.flag('farmacia_popular') ? 0 : 80), when: (c) => !c.flag('bombinha'), desc: (c) => (c.flag('farmacia_popular') ? 'Farmácia Popular: de graça com a receita (dica do Seu Valdir).' : 'R$ 80 na farmácia.'), onPay: fx.set('bombinha') },
    ],
    scene: (c) => ({
      id: 'd09_noite',
      bg: 'quarto',
      cast: ['DAVI', 'LUCIA'],
      nodes: {
        start: {
          lines: [
            { who: 'NARRADOR', t: 'Liam na cama. A bombinha do lado do travesseiro.' },
            ...(c.flag('marcia_morreu')
              ? [
                  { who: 'LUCIA', t: '(na porta, baixinho) A escola ligou. A professora dele... a Márcia. Morreu hoje à tarde, em casa. Uma alergia. Disseram que a ambulância demorou.' },
                  { who: 'NARRADOR', t: 'Você lembra da fila. Do sobrenome na ficha. Márcia Albuquerque.' },
                  { who: 'DAVI', t: '(da cama) {Pai}? A tia Márcia vai voltar segunda?' },
                ]
              : c.val<string>('d9_davi') === 'USA'
                ? [
                    { who: 'LUCIA', t: 'A professora dele passou mal hoje. Foi pro hospital. Tá viva, graças a Deus. Disseram que foi por pouco.' },
                    { who: 'DAVI', t: '{Pai}, a ambulância grande veio me buscar! Eu vi a sirene!' },
                  ]
                : [
                    { who: 'DAVI', t: '{Pai}, {c:a mãe|o pai} disse que você mandou a ambulância pequena pra mim.' },
                    { who: 'DAVI', t: 'A tia Márcia também passou mal hoje, sabia? A ambulância grande salvou ela. Amanhã eu vou contar pra ela que foi {m:meu pai|minha mãe}.' },
                  ]),
          ],
          choices: [
            { label: '"Eu sabia quem era." (para {oconj})', when: (cc) => cc.flag('sabia_que_era_marcia'), next: 'confissao' },
            { label: 'Sentar na beira da cama até ele dormir.', affectionate: true, next: 'beira', effect: fx.add('lacos', 1, 'ficou com o Liam') },
            { label: c.flag('marcia_morreu') ? 'Dizer a verdade: "Não, filho. Ela não vai voltar."' : 'Apagar a luz.', next: c.flag('marcia_morreu') ? 'verdade' : 'fim' },
          ],
        },
        confissao: {
          lines: [
            { who: 'EU', t: 'Eu sabia quem era, {c:Lú|Alex}. Eu vi o nome na ficha.' },
            { who: 'LUCIA', t: 'Você fez o que tinha que fazer.', when: (cc) => cc.v('lacos') >= 6 },
            { who: 'LUCIA', t: 'E mesmo assim?', when: (cc) => cc.v('lacos') < 6 },
          ],
          next: 'fim',
        },
        verdade: {
          lines: [
            { who: 'NARRADOR', t: 'Ele não chora na hora. Vira para a parede. Você fica até a respiração dele ficar comprida.' },
          ],
          onEnter: fx.add('humanidade', 1, 'disse a verdade'),
          next: 'fim',
        },
        beira: {
          lines: [{ who: 'NARRADOR', t: 'Você conta as respirações dele no escuro. Doze por minuto. Normal. Você conta de novo.' }],
          next: 'fim',
        },
        fim: {
          lines: [
            { who: 'ZELIA', t: '(da cozinha) Amanhã a gente arruma o dinheiro da bombinha, {filho}. Nem que eu venda alguma coisa.', when: (cc) => !cc.flag('bombinha') },
            { who: 'ZELIA', t: '(da cozinha) Deixa o menino dormir, {filho}. Vem comer.', when: (cc) => cc.flag('bombinha') },
          ],
        },
      },
    }),
    bico: {
      id: 'd09_bico',
      bg: 'cozinha',
      cast: ['ZELIA'],
      nodes: {
        start: {
          lines: [
            { who: 'NARRADOR', t: 'Quando você chega da ambulância, de madrugada, a Dona Zélia está acordada na cozinha, no escuro.' },
            { who: 'ZELIA', t: 'Você foi trabalhar. Hoje.' },
            { who: 'NARRADOR', t: 'Ela não fala mais nada. Lava uma xícara que já estava limpa.' },
          ],
        },
      },
    },
  },
});
