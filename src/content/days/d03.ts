// =============================================================================
// DIA 3 — "O Peito" (Manual p.3: dor torácica — clássica, atípica, muscular)
// Fios: 🌱 Seu Antônio, paciente-chave 1 (piora no meio da ligação) e a filha
// Juliana · 🌱 bombinha do Liam (decide o cenário do Dia 9) · ↺ Biel (número no
// quadro) · ↺ Henrique (bala de menta, "tudo é azia") · ↺ Dona Cida.
// =============================================================================
import type { Ctx, TruthDef, ReportItem } from '../../engine/types';
import { fmtTime } from '../../engine/util';
import { day, call, fx, is, NUM, ADDR } from '../dsl';

const saud = (c: Ctx) => {
  const t = c.s.shift?.time ?? 8 * 60;
  return t < 12 * 60 ? 'Bom dia' : t < 18 * 60 ? 'Boa tarde' : 'Boa noite';
};
const diaryKind = (c: Ctx, id: string) => c.s.diary.find((d) => d.id === id)?.kind;
const report = (c: Ctx, id: string): ReportItem | undefined => {
  for (const h of c.s.history) for (const r of h.report) if (r.callId === id) return r;
  return undefined;
};
const BIEL_BOARD = 'n' + NUM.biel.replace(/\D/g, '').slice(-5);

/**
 * Seu Antônio: infarto. Se o regulador demora (piora aos 90 min do atendimento),
 * ele para no telefone. A janela da parada passa a contar a partir do momento
 * em que ele caiu (gravado no turno pela piora), e não da chegada da ligação.
 */
const antonioTruth = (c: Ctx): TruthDef => {
  const t = c.s.shift?.flags['d3_parada_t'];
  if (typeof t === 'number') {
    return { dx: 'Parada cardíaca (infarto em curso)', sev: 'vermelho', ok: ['USA'], risk: { good: t + 30, bad: t + 75, guideBonus: 28 }, key: 'antonio' };
  }
  return { dx: 'Infarto agudo do miocárdio', sev: 'vermelho', ok: ['USA'], risk: { good: 60, bad: 150 }, key: 'antonio' };
};

export const DAY = day({
  day: 3,
  title: 'O Peito',
  weekday: 'Quarta-feira',
  weather: 'Abafado, 33 °C. Cheiro de feijoada em todo quarteirão.',
  onStart: (e) => {
    if (!e.s.board.some((b) => b.id === BIEL_BOARD)) {
      e.board({ id: BIEL_BOARD, kind: 'trote', title: NUM.biel, text: 'Trote · anotado pela Simone', num: NUM.biel });
      e.set('d3_simone_anotou');
    }
  },
  newspaper: (c) => {
    const biel = report(c, 'd02_biel');
    const faca = diaryKind(c, 'd02_faca');
    const hda = diaryKind(c, 'd02_hda');
    const stories: { title: string; text: string }[] = [];
    if (biel?.verdict === 'trote_enviado') stories.push({ title: 'Ambulância vai socorrer esfaqueado que não existia', text: 'Uma ambulância foi até a Escola Estadual, fechada para dedetização, atender um "esfaqueado". Encontrou um gato. A Saúde+ Gestão calcula o prejuízo em R$ 720.' });
    else stories.push({ title: 'Trotes crescem em dia sem aula', text: 'Segundo a Central de Regulação, as ligações falsas dobram quando as escolas fecham. "É sempre o mesmo tipo de voz", diz uma atendente, que pediu para não ser identificada.' });
    stories.push({ title: 'Lei do trote: ligação falsa à emergência agora dá multa', text: 'A Câmara aprovou por unanimidade. O vereador Arlindo Matos, o "Amigo da Saúde", autor do projeto, anunciou junto o Programa VER: a central poderá pedir vídeo pelo celular para "ver com os próprios olhos" quem está do outro lado. A Saúde+ Gestão diz que o pacote de dados "cabe no orçamento".' });
    if (faca === 'vivo') stories.push({ title: 'Abóbora quase mata morador do Jardim Primavera', text: 'Juarez Almeida, 46, cortou uma artéria do braço com a faca de cozinha. A esposa apertou o pano "do jeito que o telefone mandou" até a ambulância chegar. Ele passa bem.' });
    else if (faca === 'morto') stories.push({ title: 'Morre homem que se cortou em casa', text: 'Juarez Almeida, 46, não resistiu a um corte no braço feito com faca de cozinha, no Jardim Primavera. A família não quis falar com a reportagem.' });
    if (hda === 'morto') stories.push({ title: 'Falecimento', text: 'Sebastião Moreira, 70, morador da Vila Esperança. Deixa esposa, a filha Rosilene e uma bacia de alumínio que ninguém tem coragem de guardar.' });
    if (c.flag('agua_cortada')) stories.push({ title: 'DAE corta água de 214 imóveis em um dia', text: 'A "força-tarefa" de cobrança atingiu sobretudo casas alugadas. "A dívida é do imóvel", repete o diretor.' });
    stories.push({ title: 'Feijoada de quarta lota restaurantes', text: 'Com o calor, o prato preferido do santa-aurorense ganhou concorrência da salada. Perdeu de goleada.' });
    return {
      headline: 'Homem só procura médico quando a mulher manda, diz pesquisa do Regional',
      sub: 'Seis em cada dez homens com mais de 50 anos não passam por consulta há mais de dois anos. "Eles chegam já infartando e pedindo desculpa", diz cardiologista.',
      photo: 'hospital',
      stories: stories.slice(0, 4),
      notice: 'Novas páginas no Manual: p.3 — Dor torácica (pergunta "Dor irradia? Suor?" liberada) e p.3-V — Videoatendimento (Programa VER, 3 vídeos por plantão).',
      ad: 'FEIJOADA DO ZÉ — toda quarta e sábado. Leve a família! (Fiado só para conhecido.)',
      weather: 'Abafado · 33 °C',
    };
  },
  handover: () => ({
    id: 'd03_passagem',
    bg: 'central',
    nodes: {
      start: {
        lines: [
          { who: 'NARRADOR', t: 'O Henrique ainda está na cadeira, os pés em cima da gaveta, desembrulhando uma bala de menta.' },
          { who: 'HENRIQUE', t: 'Bom dia, {nome}. Noite de dor no peito: duas. As duas eram azia. Metade da cidade comeu torresmo ontem.' },
          { who: 'HENRIQUE', t: 'Hoje é quarta. Feijoada. Prepara que de tarde chove dor no peito.' },
          { who: 'NARRADOR', t: 'Ele levanta devagar demais. O cheiro de menta chega antes dele.' },
          { who: 'NARRADOR', t: 'Ele pega a chave do carro duas vezes antes de conseguir segurar. As mesmas mãos de segunda. Você reparou nelas uma vez; agora não consegue mais desver.', when: is.flag('henrique_maos_d1') },
        ],
        choices: [
          { label: '"Dor no peito é coração até prova em contrário, Henrique."', next: 'protocolo' },
          { label: '"Vai dormir. Você tá com cara de quem não dorme faz dias."', next: 'cuidado', effect: fx.add('lealHenrique', 1, 'reparou no Henrique') },
          { label: '"Bom descanso."' },
        ],
      },
      protocolo: {
        lines: [
          { who: 'HENRIQUE', t: '(ele ri sem graça) Fala isso às quatro da manhã, com a fila piscando e o Peixoto contando USA.' },
          { who: 'HENRIQUE', t: 'Mas tá certo. Tá certo. É o que a página 3 diz, né? Lê com atenção, que a página 3 morde.' },
        ],
      },
      cuidado: {
        lines: [
          { who: 'HENRIQUE', t: 'Durmo de dia, {nome}. É igual, só que com mais barulho.' },
          { who: 'NARRADOR', t: 'Ele pega a chave do carro duas vezes antes de conseguir segurar.', when: is.not('henrique_maos_d1') },
          { who: 'NARRADOR', t: 'A chave cai no chão. Ele ri, junta, e sai sem olhar pra trás.', when: is.flag('henrique_maos_d1') },
        ],
      },
    },
  }),
  // 1.1 — ida (a farmácia fechada), almoço (o Saulo tem medo) e volta (a farmácia 24 horas do Centro)
  ida: () => ({
    id: 'd03_ida',
    bg: 'calcada',
    cast: [],
    nodes: {
      start: {
        lines: [
          { who: 'NARRADOR', t: '06:30. Garoa fina. A Drogaria do Gervásio ainda está de porta baixada. Uma placa amarela, desbotada: "FARMÁCIA POPULAR AQUI".' },
          { who: 'NARRADOR', t: 'O Ozzy late para a moto do entregador de pão. A moto não liga para o Ozzy.' },
          { who: 'AÍLTON', t: 'Quarta-feira, {dr}. Dia de feijoada e de enfarte. Senta firme que a curva da Brasil hoje tá lisa.' },
          { who: 'AÍLTON', t: 'Quem me ensinou essa curva foi o Bené, que hoje dirige ambulância. E quem ensinou ele foi o finado Nestor, que dirigiu o doze trinta anos. Curva é herança, {dr}.' },
        ],
      },
    },
  }),
  almoco: (c) => {
    const conc = c.s.shift ? Object.values(c.s.shift.calls).find((x) => x.def === 'd03_conceicao' && !x.gen)?.decision?.resource : undefined;
    return {
      id: 'd03_almoco',
      bg: 'central',
      cast: ['SIMONE', 'CASTRO'],
      nodes: {
        start: {
          lines: [
            { who: 'NARRADOR', t: '13:00. Feijoada da quarta, de marmitex. A Simone come pouco e conta os torresmos como quem conta comprimidos.' },
            { who: 'SIMONE', t: 'Eu tomei o remédio da pressão. Já vou avisando antes de você perguntar.' },
            { who: 'NARRADOR', t: 'O Dr. Castro, médico da USA 01, entra para esquentar a marmita no micro-ondas da copa.' },
            conc === 'USA'
              ? { who: 'CASTRO', t: 'A senhora do infarto sem dor, de manhã? Foi você? A gente levou pro Regional e o Saulo, o plantonista, chiou: "trinta e oito no corredor". Recebeu chiando. O Saulo é bom médico. Só tem medo.' }
              : { who: 'CASTRO', t: 'Ouvi o Saulo do Regional chiando no rádio hoje: "trinta e oito no corredor, duas macas". Ele fala em número. O Saulo é bom médico. Só tem medo.' },
            { who: 'SIMONE', t: 'Ele te deve um pastel desde dezenove, Castro.' },
            { who: 'CASTRO', t: 'Eu devo pra ela. Não ele. Ela que conta errado.' },
          ],
          choices: [
            { label: '"Medo de quê?"', next: 'medo', effect: (e) => e.set('castro_saulo') },
            { label: '"Qual pastel?"', next: 'pastel', effect: (e) => e.add('lealSimone', 1, 'fez a Simone rir') },
          ],
        },
        medo: {
          lines: [
            { who: 'CASTRO', t: 'De vaga zero. Teve uma noite que...' },
            { who: 'NARRADOR', t: 'O micro-ondas apita.' },
            { who: 'CASTRO', t: '...Deixa pra lá. Pergunta pra ele quando ele gostar de você. Ele demora.' },
            { who: 'NARRADOR', t: 'A Simone para de contar os torresmos.' },
          ],
        },
        pastel: {
          lines: [
            { who: 'CASTRO', t: 'Pastel de palmito da Lurdinha, ali na Santos Dumont. Tinha uma aposta. Ela ganhou. Eu nunca paguei, porque se eu pagar acaba a aposta.' },
            { who: 'SIMONE', t: '(rindo pela primeira vez no dia) Seis anos, Castro. Seis anos de juros.' },
          ],
        },
      },
    };
  },
  volta: (c) => ({
    id: 'd03_volta',
    bg: 'rua',
    cast: [],
    nodes: {
      start: {
        lines: [
          { who: 'NARRADOR', t: '19:30. A drogaria do Gervásio fechou às sete. A placa da Farmácia Popular continua lá, acesa, de enfeite.' },
          { who: 'NARRADOR', t: 'Você conta as moedas no bolso no ponto. Oitenta reais não cabem num bolso.', when: (cc) => !cc.flag('bombinha') },
        ],
        choices: [
          {
            label: 'Descer um ponto antes e ver se a farmácia 24 horas do Centro está aberta (R$ 80).',
            needMoney: 80,
            when: (cc) => !cc.flag('bombinha') && cc.s.family.davi.status !== 'morto' && !cc.s.family.davi.away,
            next: 'farmacia',
            effect: (e) => {
              e.pay(-80, 'Bombinha do Liam (farmácia 24 horas)');
              e.set('bombinha');
              e.set('bombinha_dia', 3);
              e.set('bombinha_volta');
            },
          },
          { label: '(Seguir no ônibus até a Vila.)', next: 'segue', when: (cc) => !cc.flag('bombinha') },
        ],
      },
      farmacia: {
        lines: [
          { who: 'NARRADOR', t: 'Aberta. Um balconista de olheira te vende a bombinha e o espaçador sem levantar os olhos do celular.' },
          { who: 'NARRADOR', t: 'Você faz o resto do caminho a pé, com a sacolinha balançando. A garoa voltou.' },
        ],
      },
      segue: { lines: [{ who: 'NARRADOR', t: 'O ônibus passa pela frente da farmácia 24 horas sem parar. A luz verde da cruz pisca na janela.' }] },
    },
  }),
  timeline: [
    { at: '07:01', kind: 'simone', who: 'SIMONE', when: is.flag('d3_simone_anotou'), text: 'Aquele moleque de ontem, o da escola fechada: pus o número no quadro, {dr}. Final 8877. Esses sempre voltam.' },
    { at: '07:01', kind: 'simone', who: 'SIMONE', when: is.not('d3_simone_anotou'), text: 'O número do moleque de ontem tá no quadro, {dr}, final 8877. Esses sempre voltam.' },
    { at: '07:40', kind: 'interfone', who: 'DR. PEIXOTO', text: '{Dr}, página 3 nova, dor no peito. Só um lembrete de quem tá aqui há doze anos: metade da dor no peito dessa cidade é azia. Quarta-feira, então... Não sai mandando USA pra toda queimação, tá?' },
    {
      at: '16:20',
      kind: 'script',
      id: 'antonio_bene',
      run: (c) => {
        const a = c.callStatus('d03_antonio');
        if (a?.outcome === 'salvo') c.radio('USA 01 · BENÉ', 'Central, notícia do Seu Antônio, o do feijão: tá no cateterismo, abriram a artéria. A mulher dele mandou um obrigado "pra pessoa do telefone". Passei adiante.', 'bene');
      },
    },
    { at: '17:45', kind: 'simone', who: 'SIMONE', text: 'Toda quarta é assim, {dr}: feijoada no almoço, dor no peito no fim da tarde, e todo mundo jura que é azia. Às vezes é.' },
  ],
  calls: [
    // ------------------------------------------------------------------ 1 BIEL (número no quadro)
    call({
      id: 'd03_biel',
      ref: 'D3 #1',
      at: '07:05',
      anchor: true,
      num: NUM.biel,
      caller: 'Voz de moleque',
      callerName: 'Voz de moleque',
      type: 'trotista',
      voice: 'adolescente',
      note: 'Aquele número de novo. Final 8877.',
      noteFixed: true,
      addr: { rua: 'Rua Ipê', n: 1180, bairro: 'Jardim Norte', ref: 'No ponto de ônibus da Rua Ipê, perto da Estadual.' },
      // 1.1 (trotes-folgados.md): sem risada. O Biel tenta "voz de adulto"; a pista é a cor que ele não sabe dizer,
      // o cochicho e o número no quadro (que não prova nada sozinho: a Simone avisa).
      amb: ['onibus'],
      open: [
        { t: 'Alô. Emergência. {{Aqui é um senhor adulto|voz_adulto}}. Tem um véio aqui no ponto de ônibus que {{engoliu a dentadura|dentadura}}. Tá ficando roxo.', style: 'calma' },
        '[{{freio de ônibus; a voz grossa demais escorrega pra fina no fim da frase|risadas}}]',
      ],
      q: {
        oque: ['Ele tava comendo pão de queijo, espirrou e... glup! A dentadura foi junto!', '[voz ao fundo: {{"fala que ele tá azul!"|cochicho}}]'],
        consciencia: '{{Tá acordado, tá xingando a gente|xingando}}... digo, tá desmaiado! Desmaiou!',
        respira: 'Tá... respirando. Assobiando. Fiu-fiu.',
        idade: 'Uns cem anos. Cento e dez.',
        inicio: 'Agora, agora! Corre!',
        sangramento: 'Só na gengiva. Que ele não tem.',
        historico: 'Sei lá, mano. Dentadura frouxa.',
        paciente: ['[ônibus arrancando]', 'Ele não pode falar, tá sem dente.', '[cochicho perto do fone: "engrossa a voz, mano"]'],
        referencia: 'No ponto da Rua Ipê, perto da Estadual. Hoje tem aula, tá ligado? Quer dizer... o senhor está ligado?',
        seguranca: 'Seguro! Só o véio e a dentadura.',
        confronto_quadro: ['...Que quadro? [a voz grossa some] ...Ih.', 'Fala aí pro Biel. [desliga]'],
        pele: ['O véio tá roxo... ou verde, sei lá.', '[cochicho: "fala azul, azul é pior"]', 'Azul. Azul-marinho.'],
        pulso: 'Pulso? Ah... deve ter. Ele tá xingando, então tem, né?',
      },
      callback: ['[chama...]', '[{{caixa postal de novo: "Fala aí, é o Biel..."|retorno_caixa}}]'],
      links: [
        { a: 'xingando', b: 'dentadura', insight: 'Quem engoliu a dentadura e está "ficando roxo" não consegue xingar ninguém.' },
        { a: 'cochicho', b: 'risadas', insight: 'Risadas e alguém soprando o que ele deve dizer: trote montado em grupo (Manual p.2).' },
        { a: 'retorno_caixa', b: `quadro:${BIEL_BOARD}`, insight: 'Mesmo número de ontem, mesma caixa postal: "é o Biel". Trote de novo.' },
      ],
      patient: { name: '"Idoso engasgado com a dentadura"' },
      truth: { dx: 'Trote', sev: 'trote', ok: ['TROTE'], prankKind: 'trote' },
      radio: { prank: 'Central, {unit} no ponto da Rua Ipê. Nenhum engasgado. Tinha uma senhora esperando o ônibus, de dentadura no lugar, brava com a gente. Trote.' },
      diary: { ori: 'Trote do mesmo número (final 8877): "véio engoliu a dentadura" no ponto de ônibus. Caixa postal: "é o Biel".' },
    }),
    // ------------------------------------------------------------------ 2 ★ SEU ANTÔNIO
    // Conferido (RC17): "dor precordial típica" (peso no meio do peito, suor frio, braço) → USA; depois da piora,
    // PCR → USA + RCP guiada (RM7, campo A1). A janela da parada conta a partir do colapso.
    call({
      id: 'd03_antonio',
      ref: 'D3 #2 ★',
      at: '08:05',
      anchor: true,
      num: '(17) 3328-1240',
      caller: 'Seu Antônio',
      callerName: 'Seu Antônio',
      type: 'minimizador',
      voice: 'homem',
      note: 'Senhor educado, pede desculpa. Queimação no estômago.',
      noteFixed: true,
      addr: ADDR.antonio,
      amb: ['radio_am', 'ventilador'],
      open: (c) => [
        `${saud(c)}, {dr}, desculpa incomodar... é que eu tô com uma {{queimação aqui no estômago|queimacao}}, {{deve ser o feijão|feijao}}. Minha mulher que mandou ligar.`,
        '[ao fundo, uma mulher: "Fala direito, Antônio! Fala do braço!"]',
      ],
      q: {
        oque: 'Comi um feijão requentado com farinha no café, aí começou essa queimação aqui no meio, embaixo do peito. Tomei sal de fruta, não passou.',
        consciencia: 'Tô bem, tô bem, tô conversando com {m:o senhor|a senhora}. Só meio agoniado.',
        respira: 'Respiro... meio curto. Deve ser o nervoso da Rosa me apurando.',
        idade: 'Cinquenta e oito.',
        inicio: '{{Começou faz uns quarenta minutos|quarenta}}. Não vai embora, vem e fica.',
        sangramento: 'Não, {m:senhor|senhora}.',
        historico: ['Pressão alta. {{Mas parei o remédio faz um mês|parei}}, me dava uma tosse chata.', 'Fumei trinta anos. Parei faz cinco.'],
        paciente: 'Sou eu mesmo, {dr}. A Rosa que ficou apurando.',
        referencia: 'Rua São João, 1240. Do lado do campinho de várzea, portão marrom.',
        seguranca: 'Seguro, só eu e a Rosa.',
        dorpeito: ['Pro braço? É... {{o braço esquerdo tá formigando|formiga}}, {{mas eu dormi em cima dele|dormi}}.', '{{Tô suando um pouco, mas tá calor|suor}}, né, {dr}? Trinta e três graus.'],
        pulso: ['ROSA (pegando o telefone): Eu sei achar, {dr}, eu fui atendente de posto. ...Tá rápido. E falhando. Bate, para, bate.', 'ANTÔNIO: Tá vendo? Ela fica apurando.'],
        pele: 'ROSA (ao fundo): Fala que você tá cinza, Antônio! Cinza e molhado! ...Ele não fala, {dr}. Ele tá cinza.',
      },
      extra: [
        { id: 'peso', label: 'É queimação ou aperto?', say: 'Me descreve a dor: queima, aperta, pesa?', a: 'É... {{um peso. Tipo um tijolo em cima do peito|tijolo}}. Mas é queimação, né? Deve ser.' },
        { id: 'familia', label: 'Tem família por perto?', say: 'Tem mais alguém da família por perto?', a: ['Só a Rosa. {{Minha filha vive dizendo pra eu ir no médico|filha}}, a Juliana. Ela vende roupa na feira, vive atrás de costureira pra fazer barra.', 'Eu nunca vou, né. Médico é pra quem tá doente.'] },
        {
          id: 'falar_rosa',
          kind: 'fala',
          label: 'Falar com a esposa',
          say: 'Pode passar o telefone para a sua esposa um instante?',
          a: ['ESPOSA: É a Rosa, {dr}. Ele tá {{cinza|cinza}}. Eu conheço esse homem há trinta e dois anos. Ele nunca pediu pra sentar no meio do café.', 'ESPOSA: Ele vai dizer que tá bem. Ele sempre diz que tá bem.'],
        },
      ],
      links: [
        { a: 'feijao', b: 'suor', insight: '"Deve ser o feijão" — mas está suando frio. Azia não faz suar frio.' },
        { a: 'feijao', b: 'manual:peito', insight: 'Homem de 58, hipertenso sem remédio, ex-fumante, queimação que não passa, suor e braço formigando: provável infarto. Vermelho → USA (Manual p.3).' },
        { a: 'formiga', b: 'dormi', insight: '"Dormi em cima do braço" — mas o formigamento começou junto com a queimação. Não é do travesseiro.' },
        { a: 'parei', b: 'queimacao', insight: 'Hipertenso que parou o remédio há um mês, com "dor de estômago" há 40 minutos: até prova em contrário, é o coração.' },
        { a: 'tijolo', b: 'manual:peito', insight: 'Peso "de tijolo" no peito, suor e braço: dor torácica clássica, só que com outro nome.' },
        { a: 'agonico', b: 'manual:parada', insight: 'Caiu, não fala, "ronco esquisito": PARADA CARDÍACA. USA + RCP guiada agora (Manual p.1).' },
      ],
      worsen: [
        {
          after: 90,
          lines: [
            'ANTÔNIO: Ô {dr}... {{o braço ficou pesado agora|braco_pesado}}. Tá... difícil de...',
            '[{{barulho do telefone batendo no chão|telefone_cai}}]',
            'ESPOSA: ANTÔNIO! {{Ele caiu, {dr}, ele não fala!|nao_fala}}',
            'ESPOSA: Ele tá fazendo um {{ronco esquisito|agonico}}... e não mexe, não mexe!',
          ],
          guide: 'rcp',
          onTrigger: (e) => {
            const sh = e.s.shift;
            const rt = sh?.calls['d03_antonio'];
            if (sh && rt) sh.flags['d3_parada_t'] = Math.round(sh.time - rt.arrived);
            e.set('antonio_parou');
          },
        },
      ],
      onResolve: (e, r) => {
        if (r.outcome !== 'obito') e.set('antonio_salvo');
      },
      patient: { name: 'Antônio Ferreira', age: 58, sex: 'M' },
      truth: antonioTruth,
      radio: {
        ok: '{central}, {unit} no local. Eletro com supra de ST: infarto em curso. Chegamos a tempo. Seguimos pro Regional, hemodinâmica avisada.',
        saved: '{central}, {unit}. Pegamos ele em fibrilação, chocamos duas vezes, voltou. Quem tava contando no telefone, {dr}? Contou bonito.',
        under: 'Central, {unit}! Infarto com supra, paciente suando, instável! Precisamos de suporte avançado aqui!',
        dead: '{central}... {unit}. Fizemos de tudo. Óbito constatado às {hora}. A esposa fica repetindo que ele achou que era o feijão.',
        dismissed: 'ESPOSA: {Dr}? É a Rosa, mulher do Antônio! Ele piorou! Tá suando que pinga, branco, segurando o braço! Ele mandou eu não ligar de novo. Eu tô ligando.',
      },
      diary: {
        alive: (c) => (c.flag('antonio_parou') ? 'Infarto. Parou no telefone; a Rosa fez a massagem até a USA chegar. Voltou com dois choques.' : 'Infarto. "Deve ser o feijão." Chegamos antes de parar.'),
        dead: 'Infarto. Pediu desculpa por incomodar. Achou que era o feijão.',
        later: [{ day: 15, text: 'Voltou a pescar no açude, segundo a filha.', when: (c) => c.flag('antonio_salvo') }],
      },
    }),
    // ------------------------------------------------------------------ 3 (muscular)
    // Conferido (RC17): dor leve, reproduzível à palpação e à rotação, após esforço, sem fator de risco → orientação
    // (preferida). A "fisgada ao puxar o ar fundo" preenche "dor pleurítica", que o RC17 põe em USI/USB: USB ⚖.
    call({
      id: 'd03_muscular',
      ref: 'D3 #3',
      at: '09:00',
      pool: 'leve,cardio',
      num: '(17) 99352-4471',
      caller: 'Pâmela',
      callerName: 'Pâmela',
      type: 'comum',
      voice: 'mulher',
      note: 'Moça com dor no peito em pontada. Calma.',
      noteWrong: 'Mulher com dor no peito! Pode ser infarto!',
      addr: { rua: 'Rua Bahia', n: 1720, bairro: 'Centro', ref: 'Prédio da esquina, sem elevador, apartamento 31.' },
      amb: ['rua'],
      open: ['Oi, bom dia. Eu tô com uma {{dor no peito|dor_peito}}, tipo uma {{pontada|pontada}}, do lado esquerdo. Fiquei com medo de ser coração, minha mãe teve problema.'],
      q: {
        oque: 'Ontem eu ajudei a minha irmã a {{subir um sofá de três lugares pro terceiro andar|sofa}}. Sem elevador. Hoje acordei assim.',
        consciencia: 'Tô ótima, tô até trabalhando, de casa.',
        respira: 'Respiro bem. Só que quando eu puxo o ar bem fundo, dá uma fisgada.',
        idade: 'Trinta e cinco.',
        inicio: 'Desde que eu acordei. Umas seis horas.',
        sangramento: 'Não.',
        historico: 'Nada. Não fumo, não tenho pressão, nada. Faço caminhada.',
        paciente: 'Sou eu mesma.',
        seguranca: 'Tranquilo.',
        dorpeito: '{{Não vai pra lugar nenhum. Fica num pontinho só|pontinho}}, aqui do lado. {{Suor nenhum|sem_suor}}.',
      },
      extra: [
        { id: 'apertar', label: 'Dói ao apertar o local?', say: 'Se você apertar com o dedo o lugar da dor, ela piora?', a: '{{Piora! Se eu aperto aqui, dói muito|apertar}}. E quando eu viro o tronco também.' },
        { id: 'mae', label: 'O que sua mãe teve?', say: 'O que a sua mãe teve no coração? Com que idade?', a: 'Ela infartou com setenta e dois. Por isso eu fiquei cismada.' },
      ],
      links: [
        { a: 'apertar', b: 'manual:muscular', insight: 'Pontada que piora ao apertar e ao virar o tronco, depois de carregar peso, em mulher jovem sem fator de risco: dor muscular. Orientação (Manual p.3).' },
        { a: 'sofa', b: 'pontada', insight: 'Subiu um sofá três andares ontem e acordou com pontada no peito: esforço físico, dor de músculo.' },
        { a: 'pontinho', b: 'manual:peito', kind: 'confirma', insight: 'Sem suor, sem irradiar, dor em ponto: não fecha o critério de infarto da p.3. A mãe infartou aos 72 — não aos 35.' },
      ],
      patient: { name: 'Pâmela Gonçalves', age: 35, sex: 'F' },
      truth: { dx: 'Dor muscular na parede do tórax (esforço)', sev: 'verde', ok: ['ORI', 'USB'], best: 'ORI', ref: ['UBS', 'CASA', 'UPA'] },
      radio: { excess: '{central}, {unit}. Dor muscular, piora à palpação. Ela pediu desculpa pra equipe. Liberamos no local, {dr}.' },
      diary: { ori: 'Pontada no peito depois de carregar um sofá três andares. Músculo. Orientada repouso, compressa e UBS se não passar.' },
    }),
    // ------------------------------------------------------------------ 4 ★ CIDA
    call({
      id: 'd03_cida',
      ref: 'D3 #4',
      at: '09:45',
      anchor: true,
      num: NUM.cida,
      caller: 'Dona Cida',
      callerName: 'Dona Cida',
      type: 'frequentador',
      voice: 'cida',
      note: 'Dona Cida. Pergunta boba, mas tá aflita.',
      noteFixed: true,
      addr: ADDR.cida,
      amb: ['tv', 'passaros'],
      open: (c) => [
        `${saud(c)}, {meu} {filho}! É a Cida! Ó, desculpa, é bobagem: {{o relógio da cozinha parou|relogio}} e eu não sei se já posso tomar o remédio das dez.`,
        'Que horas são aí, {meu} {filho}? A TV tá passando propaganda e propaganda não tem hora.',
      ],
      q: {
        oque: 'O relógio, {meu} {filho}! Parou nas sete e quinze. Acho que é a pilha.',
        idade: 'Setenta e nove.',
        consciencia: 'Acordada, acordada. Só desorientada de hora, por culpa do relógio.',
        respira: 'Respirando, graças a Deus.',
        inicio: 'Não sei, ué! Parou o relógio! [risada]',
        historico: '{{Pressão. O comprimido é às dez em ponto|remedio_dez}}, a moça do postinho falou que é pra ser sempre na mesma hora.',
        paciente: 'Sou eu mesma, {meu} {filho}.',
        sangramento: 'Não, credo.',
        seguranca: 'Seguro. O Bolinha tá dormindo em cima da TV.',
        pulso: 'Batendo, batendo. Contei no relógio do micro-ondas, que esse não para. Setenta e pouco.',
        pele: 'Normal, {meu} {filho}. Só a cara de quem perdeu a hora.',
      },
      extra: [
        {
          id: 'hora',
          kind: 'fala',
          label: 'Dizer as horas',
          say: (c) => `Agora são ${fmtTime(c.s.shift?.time ?? 585)}, Dona Cida.`,
          a: (c) =>
            (c.s.shift?.time ?? 585) < 600
              ? ['Ainda não deu dez? Então eu espero. Vou ficar olhando o relógio da igreja pela janela, que esse é de confiança.', 'Obrigada, {meu} {filho}. Você é melhor que o relógio.']
              : ['Já passou das dez? Credo! Vou tomar agorinha, com um copo d’água.', 'Obrigada, {meu} {filho}. Você é melhor que o relógio.'],
        },
        {
          id: 'conversar',
          kind: 'fala',
          label: 'Conversar um pouco com ela',
          cost: 15,
          say: 'E a senhora, Dona Cida, o que está vendo na TV?',
          a: [
            'Ah, passou no jornal da manhã que {{tem gente que infarta achando que é azia|azia}}! Credo em cruz. Com suor frio e tudo.',
            'Eu anotei num papelzinho pra contar pras meninas do grupo: dor no peito, suor frio, braço. E mulher às vezes só sente canseira. Tá certo isso, {meu} {filho}?',
            '[risada] Olha eu, dando aula pra {m:doutor|doutora}. Vou deixar você trabalhar.',
          ],
          onAsk: fx.all(fx.add('humanidade', 1, 'conversou com a Dona Cida'), fx.set('cida_conversou_d3')),
        },
      ],
      links: [
        { a: 'relogio', b: 'manual:azul', insight: 'O relógio parou e ela não sabe se pode tomar o remédio. Não é urgência: é uma senhora sozinha sem ninguém para perguntar a hora (Manual p.1).' },
      ],
      onAnswer: fx.set('cida_ligou_d3'),
      patient: { name: 'Aparecida (Dona Cida)', age: 79, sex: 'F' },
      truth: { dx: 'Dúvida sobre o horário do remédio (relógio parado)', sev: 'azul', ok: ['ORI'], ref: ['CASA', 'UBS'] },
      diary: { ori: 'O relógio da cozinha parou. Ligou para saber se já era hora do remédio das dez.' },
    }),
    // ------------------------------------------------------------------ 5 ★ INFARTO ATÍPICO (a armadilha)
    // Conferido (RC17/RC20): "dispneia aguda" em repouso, sudorese, náusea e dor epigástrica numa diabética de 67
    // anos → USA (a definição de "dor precordial típica" admite sudorese, náusea e dor epigástrica associadas).
    call({
      id: 'd03_conceicao',
      ref: 'D3 #5 ★',
      at: '10:40',
      anchor: true,
      num: '(17) 3326-0507',
      caller: 'Dona Conceição',
      callerName: 'Dona Conceição',
      type: 'minimizador',
      voice: 'idosa',
      note: 'Senhora de 67, diabética. "Só um cansaço e enjoo."',
      noteFixed: true,
      addr: { rua: 'Rua Dom Pedro II', n: 3010, bairro: 'Vila Esperança', ref: 'Casa com varal na frente e um pé de mamão, perto da caixa d’água.' },
      amb: ['passaros', 'respiracao'],
      open: (c) => [
        `${saud(c)}, {dr}. Desculpa ligar por bobagem... é que eu tô com {{só um cansaço e um enjoo|cansaco}}. A vizinha que insistiu pra eu ligar.`,
        '[respiração curta entre uma frase e outra]',
      ],
      q: {
        oque: 'Fui estender a roupa e {{não consegui terminar|nao_terminou}}. Me deu uma canseira, um enjoo, sentei no banquinho. Tô sentada até agora.',
        consciencia: 'Tô acordada, tô conversando. Meio mole, só.',
        respira: 'Meio curta, {dr}. {{Parece que subi uma ladeira, e eu só tô sentada|ladeira}}.',
        idade: 'Sessenta e sete.',
        inicio: 'Faz uma hora, mais ou menos. Desde a roupa.',
        sangramento: 'Não, {m:senhor|senhora}.',
        historico: ['{{Diabetes, há vinte anos. Tomo insulina|diabetes}}. E pressão.', 'O médico do postinho falou que o açúcar "come os nervos". {{Eu nem sinto mais o pé direito.|nervos}}'],
        paciente: 'Sou eu mesma, {dr}.',
        referencia: 'Casa com varal na frente e um pé de mamão.',
        seguranca: 'Seguro. A Leonor, minha vizinha, tá aqui comigo.',
        pulso: ['A Leonor tá contando... [pausa]', 'LEONOR: Tá fraquinho, {m:moço|moça}. Fininho. E rápido. Eu tô com medo de errar a conta.'],
        pele: 'LEONOR (pegando o telefone): Ela tá {{cinza|cinza_pele}}, {m:moço|moça}. Cinza e molhada. Eu nunca vi ela dessa cor.',
        dorpeito: ['Dor no peito não, {dr}. Nem no braço. {{É uma agonia, uma canseira|agonia}}.', '{{Suor frio sim. Tô molhada|suor_frio}}, e a casa nem tá quente, fechei a janela.'],
      },
      extra: [
        { id: 'glicemia', label: 'Mediu o açúcar?', say: 'A senhora mediu o açúcar agora?', a: 'A Leonor mediu no aparelhinho: {{deu cento e oitenta|glicemia}}. Tá alto, mas pra mim é normal.' },
        { id: 'azia', label: 'Queimação no estômago?', say: 'Está com queimação no estômago, azia?', a: 'Uma queimaçãozinha aqui em cima da barriga. Tomei um chá de boldo. Não adiantou.' },
        {
          id: 'falar_leonor',
          kind: 'fala',
          label: 'Falar com a vizinha',
          say: 'Pode passar o telefone pra sua vizinha um instante?',
          a: ['LEONOR: Ela tá {{cinza, {m:moço|moça}|cinza}}. Cinza. Conheço a Conceição há trinta anos, ela nunca sentou no meio da roupa.', 'LEONOR: E ela é teimosa. Se deixar, ela vai fazer o almoço.'],
        },
      ],
      links: [
        { a: 'cansaco', b: 'manual:atipico', insight: 'Diabética de 67 anos com canseira, enjoo e suor frio, sem dor nenhuma: é o infarto que não dói. Vermelho → USA (Manual p.3).' },
        { a: 'glicemia', b: 'suor_frio', insight: 'Açúcar alto, não baixo: o suor frio não é hipoglicemia. É o coração até prova em contrário.' },
        { a: 'nervos', b: 'agonia', insight: 'O diabetes "come os nervos": ela não sente o pé, e pode não sentir a dor do infarto. Por isso "só uma agonia".' },
        { a: 'ladeira', b: 'nao_terminou', insight: 'Falta de ar e canseira em repouso, sem esforço nenhum: o coração não está dando conta.' },
      ],
      worsen: [{ after: 110, lines: ['CONCEIÇÃO: {Dr}... tá tudo rodando... vou deitar um pouquinho...', 'LEONOR: Conceição? Conceição! {{Ela tá desmaiando, {m:moço|moça}!|desmaiando}}'] }],
      patient: { name: 'Conceição Aparecida Lopes', age: 67, sex: 'F' },
      truth: { dx: 'Infarto atípico (sem dor) em diabética', sev: 'vermelho', ok: ['USA'], risk: { good: 60, bad: 150 } },
      radio: {
        ok: '{central}, {unit}. Senhora diabética, eletro com infarto inferior. Nenhuma dor, só canseira e suor. Boa pegada, {dr}. Seguimos pro Regional.',
        saved: '{central}, {unit}. Ela apagou quando a gente entrou, mas voltou com soro e oxigênio. Infarto sem dor. Seguimos pro Regional.',
        under: 'Central, {unit}! O eletro é infarto! Senhora instável, pressão caindo! Precisamos de USA!',
        dead: 'Central... {unit}. Infarto. Ela tava sentada no banquinho do varal. Óbito às {hora}.',
        dismissed: 'LEONOR: {m:Moço|Moça}! É a vizinha da Dona Conceição! Ela desmaiou no banquinho! Tá gelada, tá cinza!',
      },
      diary: {
        alive: 'Infarto sem dor nenhuma, "só um cansaço". Diabética. A vizinha disse que ela estava cinza.',
        dead: 'Infarto sem dor nenhuma. Ligou pedindo desculpa por "bobagem".',
      },
    }),
    // ------------------------------------------------------------------ 6 (criança ao telefone)
    // Conferido (RT6 / RC24): criança abaixo de 10 anos com fratura e dor → USI/USB. A fala da Dona Cleide dizia
    // "osso levantando a pele", que é "pele crítica" (discriminador de USA no RC24) e contradizia a verdade:
    // agora a pele está íntegra e sem tensão. Criança ao telefone: pedir um adulto (Manual p.2).
    call({
      id: 'd03_bicicleta',
      ref: 'D3 #6',
      at: '11:40',
      pool: 'trauma_moderado,pediatria',
      num: '(17) 99671-3302',
      caller: 'Pedrinho (amigo, 10 anos)',
      callerName: 'Pedrinho',
      type: 'crianca',
      voice: 'menino',
      note: 'Criança no telefone. Amigo caiu de bicicleta.',
      noteWrong: 'Criança. Acho que é trote.',
      addr: { rua: 'Rua Sabiá', n: 820, bairro: 'Vila Esperança', ref: 'Na descida da Sabiá, perto da quitanda da Quitéria, depois da escola Monteiro Lobato.' },
      amb: ['rua', 'choro'],
      open: [
        '{m:Moço|Moça}! {m:Moço|Moça} da ambulância! O Enzo caiu da bicicleta na descida e {{o braço dele ficou torto|torto}}! Ele tá chorando muito!',
        '[{{choro alto de criança ao fundo|choro}}]',
      ],
      q: {
        oque: 'A gente tava apostando corrida na descida, a corrente soltou e ele voou. Caiu com a mão no chão.',
        consciencia: 'Tá acordado, tá chorando e chamando a mãe.',
        respira: 'Tá, tá respirando. Chorando.',
        idade: 'Ele tem nove. Eu tenho dez.',
        inicio: 'Agora! Eu corri na quitanda e peguei o telefone da Dona Quitéria!',
        sangramento: 'Ralou o joelho. {{O braço não tá saindo sangue, mas tá tipo um S|tipo_s}}.',
        historico: 'Ele tem bronquite. Só.',
        paciente: ['ENZO: Tá doendo muito! Eu quero a minha mãe!', '[choro]'],
        referencia: 'Na descida da Sabiá, na frente da quitanda da Dona Quitéria.',
        seguranca: 'Seguro. A Dona Quitéria tirou as bicicletas da rua.',
      },
      extra: [
        {
          id: 'adulto',
          label: 'Tem algum adulto aí?',
          say: 'Tem algum adulto aí perto? Pode passar o telefone pra ele?',
          a: [
            'Tem a Dona Quitéria da quitanda! Dona Quitéria! É {m:o moço|a moça} da ambulância!',
            'QUITÉRIA: Alô, {m:moço|moça}? Aqui é a Quitéria. O menino tá com o antebraço {{entortado e inchado, mas a pele tá inteirinha, não furou|deformidade}}. Ele bateu a cabeça não, caiu de mão.',
            'QUITÉRIA: A mãe dele tá vindo correndo do serviço. Eu fico com ele.',
          ],
        },
        { id: 'cabeca', label: 'Bateu a cabeça?', say: 'Ele bateu a cabeça? Estava de capacete?', a: 'Capacete ele não tem. Mas não bateu a cabeça, caiu de mão. Ele lembra de tudo, até xingou a corrente.' },
      ],
      links: [
        { a: 'torto', b: 'manual:crianca', insight: 'Criança ao telefone: peça para falar com um adulto (Manual p.2). Aqui tem a dona da quitanda do lado.' },
        { a: 'deformidade', b: 'manual:amarelo', insight: 'Braço deformado, sem ferida aberta, criança acordada e respirando bem: fratura. Amarelo → USB (Manual p.1).' },
        { a: 'tipo_s', b: 'choro', kind: 'confirma', insight: 'Choro forte e braço "em S": dor real, criança alerta. Não é trote, é fratura.' },
      ],
      patient: { name: 'Enzo Matias', age: 9, sex: 'M' },
      truth: { dx: 'Fratura fechada de antebraço', sev: 'amarelo', ok: ['USB'], risk: { good: 100, bad: 280, needs: 'USB' } },
      radio: {
        ok: 'Central, {unit} na Sabiá. Fratura de antebraço fechada, criança estável e muito brava com a bicicleta. Imobilizamos. A mãe chegou. Removendo.',
        excess: '{central}, {unit}. Fratura de braço simples, criança estável. Isso era básica, {dr}.',
      },
      diary: { alive: 'Caiu de bicicleta apostando corrida. Quem ligou foi o amigo de dez anos, do telefone da quitanda.' },
    }),
    // ------------------------------------------------------------------ 7 (ansiedade: orientação + respiração guiada)
    // Conferido (RC22/RC12): hiperventilação após abalo emocional, frases inteiras, sem chiado, sem lábio roxo,
    // 25 anos sem fator de risco → orientação + respiração guiada (preferida). "Palpitação atual" é USI/USB no RC22:
    // USB ⚖, como na ligação igual do dia 9 (d09_bruna).
    call({
      id: 'd03_briga',
      ref: 'D3 #7',
      at: '12:50',
      pool: 'leve,psiq',
      num: '(17) 99904-1182',
      caller: 'Leandro',
      callerName: 'Leandro',
      type: 'comum',
      voice: 'jovem_h',
      note: 'Rapaz de 25. Coração disparado depois de uma briga.',
      noteWrong: 'Rapaz com dor no peito e formigamento! Parece infarto!',
      addr: { rua: 'Rua Marechal Deodoro', n: 1510, bairro: 'Centro', ref: 'Loja de capinha de celular, na galeria, do lado da lotérica.' },
      amb: ['respiracao', 'rua'],
      open: [
        '{m:Moço|Moça}, {{meu coração tá disparado|disparado}}, não para! E {{as minhas mãos tão formigando|formiga}}, tão travando! Eu vou morrer?',
        '[respiração rápida e curta]',
      ],
      q: {
        oque: 'Um cliente veio brigar comigo por causa de uma capinha. Gritou, me empurrou, falou que ia voltar com os amigos. Depois que ele foi embora começou isso.',
        consciencia: 'Tô acordado. Tô até demais.',
        respira: 'Rápido, rápido, não consigo parar. {{Mas não chia nada|sem_chiado}}, só parece que o ar não chega.',
        idade: 'Vinte e cinco.',
        inicio: 'Faz uns vinte minutos. Desde a briga.',
        sangramento: 'Não, ele só me empurrou.',
        historico: 'Nada. Nunca tive nada. Não uso nada, juro.',
        paciente: 'Sou eu mesmo. Tô sozinho na loja.',
        seguranca: 'O cara foi embora. Fechei a porta de vidro.',
        dorpeito: ['{{Não vai pra braço nenhum|nao_irradia}}. É um aperto de nervoso, aqui no meio.', 'Suor frio não. Tô é quente, vermelho.'],
      },
      extra: [
        { id: 'frases', label: 'Fala frases inteiras?', say: 'Você consegue falar uma frase inteira comigo, devagar?', a: '{{Consigo... consigo falar, mas parece que eu vou desmaiar|frases}}.' },
        { id: 'boca', label: 'Formiga a boca também?', say: 'Está formigando em volta da boca também?', a: 'Tá! Como você sabe? A boca tá dormente!' },
      ],
      links: [
        { a: 'formiga', b: 'disparado', insight: 'Coração disparado e mãos e boca formigando logo depois de um susto, falando frases inteiras: crise de ansiedade com hiperventilação.' },
        { a: 'nao_irradia', b: 'manual:peito', kind: 'confirma', insight: '25 anos, sem fator de risco, sem dor irradiada e sem suor frio: não fecha o critério de infarto da p.3. Orientar e acalmar por telefone.' },
        { a: 'frases', b: 'manual:verde', insight: 'Fala frases inteiras, sem chiado, sem lábio roxo: não é falta de ar grave. Verde: orientação com respiração guiada (Manual p.1).' },
      ],
      guide: { id: 'respiracao', onOri: true },
      patient: { name: 'Leandro Nunes', age: 25, sex: 'M' },
      truth: { dx: 'Crise de ansiedade (hiperventilação) após agressão', sev: 'verde', ok: ['ORI', 'USB'], best: 'ORI', ref: ['CASA', 'UBS'] },
      radio: { excess: '{central}, {unit} na galeria. Rapaz ansioso, já melhor quando a gente chegou. Sinais normais. Liberamos, {dr}.' },
      diary: { ori: 'Crise de ansiedade depois de ser empurrado por um cliente. Respiramos juntos até as mãos destravarem.' },
    }),
    // ------------------------------------------------------------------ 8 (atropelamento)
    // Conferido (RT9 / RT8): atropelamento (mecanismo de trauma significativo), não reativo à voz, otorragia e
    // respiração em gargarejo → USA.
    call({
      id: 'd03_atropelamento',
      ref: 'D3 #8',
      at: '14:00',
      pool: 'grave',
      num: '(17) 99238-5150',
      caller: 'Sandro (motorista de aplicativo)',
      callerName: 'Sandro',
      type: 'testemunha',
      voice: 'homem',
      note: 'Atropelamento na Santos Dumont. Vítima no chão.',
      noteWrong: 'Atropelamento leve, a vítima tá sentada.',
      addr: { rua: 'Av. Santos Dumont', n: 2850, bairro: 'Jardim Norte', ref: 'Na faixa de pedestre em frente à banca de jornal.' },
      amb: ['buzinas', 'multidao', 'rua'],
      open: [
        'Atropelaram o Seu Nilton da banca! Um carro pegou ele na faixa e fugiu! Ele tá no chão, {{não responde|nao_responde}}!',
        '[{{buzinas, gente gritando "não mexe nele!"|gritos}}]',
      ],
      q: {
        oque: 'O carro vinha voando, furou o sinal e pegou ele em cheio. Ele bateu no capô e {{caiu de cabeça no asfalto|cabeca}}.',
        consciencia: 'Não acorda. Chamei, belisquei, nada. Só {{geme quando aperta o ombro|geme}}.',
        respira: 'Tá respirando, mas {{com um barulho, tipo gargarejo|gargarejo}}.',
        idade: 'Uns sessenta. Seu Nilton, da banca de jornal.',
        inicio: 'Agora, faz três minutos!',
        sangramento: '{{Tá saindo sangue da cabeça e do ouvido|ouvido}}. Uma poça.',
        historico: 'Não sei, ele é diabético, eu acho. Vive comprando bala diet.',
        paciente: 'Ele não fala, {m:moço|moça}! Só geme!',
        referencia: 'Na faixa em frente à banca de jornal da Santos Dumont.',
        seguranca: 'O carro fugiu. Tem gente parando o trânsito com a mão.',
      },
      extra: [
        { id: 'mexe', label: 'Mexe braços e pernas?', say: 'Ele mexe os braços e as pernas?', a: 'Mexe o braço direito quando a gente aperta. A perna esquerda tá virada.' },
        { id: 'vomito', label: 'Vomitou?', say: 'Ele vomitou?', a: 'Ainda não. Tá de barriga pra cima, fazendo esse barulho.' },
      ],
      links: [
        { a: 'nao_responde', b: 'ouvido', insight: 'Atropelado, não acorda e sangra pelo ouvido: traumatismo craniano grave. Vermelho → USA.' },
        { a: 'gargarejo', b: 'manual:vermelho', insight: 'Respiração com barulho de gargarejo em quem não acorda: a via aérea está em risco. Vermelho → USA (Manual p.1).' },
        { a: 'geme', b: 'manual:parada', kind: 'confirma', insight: 'Ele geme quando apertam e respira: não é parada. É trauma grave, e cada minuto conta.' },
      ],
      worsen: [{ after: 100, lines: ['SANDRO: {{Ele vomitou! Tá engasgando com o vômito!|vomitou}}', '[gritos]'], guide: 'trauma' }],
      guide: { id: 'trauma' },
      patient: { name: 'Nilton Araújo', age: 61, sex: 'M' },
      truth: { dx: 'Traumatismo cranioencefálico grave (atropelamento)', sev: 'vermelho', ok: ['USA'], risk: { good: 45, bad: 110, guideBonus: 15 } },
      radio: {
        ok: '{central}, {unit} no local. TCE grave, Glasgow 7, fratura de fêmur esquerdo. Intubado. Seguimos pro Regional.',
        under: 'Central, {unit}! TCE grave, paciente rebaixado, via aérea comprometida! Precisamos de avançado!',
        dead: 'Central... {unit}. Seu Nilton da banca. Óbito constatado às {hora}. O motorista do carro não parou.',
      },
      diary: { alive: 'Atropelado na faixa, o carro fugiu. Seu Nilton, da banca de jornal. Chegou ao Regional intubado.', dead: 'Atropelado na faixa por um carro que não parou. Seu Nilton, da banca de jornal.' },
    }),
    // ------------------------------------------------------------------ 9 (idoso acamado)
    // Conferido (RM4): confusão nova e progressiva com febre = "alteração gradual da consciência" (amarelo); acamado
    // só sai em decúbito → USB.
    call({
      id: 'd03_acamado',
      ref: 'D3 #9',
      at: '15:30',
      pool: 'moderado',
      num: '(17) 3323-0918',
      caller: 'Valéria (nora)',
      callerName: 'Valéria',
      type: 'familia',
      voice: 'mulher',
      note: 'Nora. Sogro acamado, confuso, com febre.',
      noteWrong: 'Velhinho acamado com febre. Manda pra UBS.',
      addr: { rua: 'Rua Rui Barbosa', n: 2900, bairro: 'Vila Nova', ref: 'Casa de muro chapiscado, tem uma cadeira de rodas na varanda.' },
      amb: ['tv', 'ventilador'],
      open: [
        'Boa tarde. Meu sogro é acamado, teve derrame faz dois anos. Desde ontem ele tá {{falando coisa com coisa... quer dizer, não tá falando coisa com coisa|confuso}}. E tá com {{febre de trinta e oito e meio|febre}}.',
      ],
      q: {
        oque: 'Ele sempre foi lúcido, mesmo de cama. Ontem começou a chamar a minha sogra, que já morreu. Hoje {{não me reconheceu|nao_reconheceu}}.',
        consciencia: 'Acordado, mas longe. Abre o olho quando eu chamo, fala umas coisas sem sentido.',
        respira: 'Respira um pouco rápido. Tossindo uma tosse molhada desde anteontem.',
        idade: 'Oitenta e quatro.',
        inicio: 'A confusão desde ontem de tarde. A febre desde a noite.',
        sangramento: 'Não.',
        historico: ['Derrame, pressão, próstata. Usa fralda.', '{{O xixi tá escuro, com cheiro forte|xixi}}. E tá comendo quase nada.'],
        paciente: ['SEU OSMAR: Cadê a Dita? Fala pra Dita que eu vou...', 'VALÉRIA: É a Dita que ele chama. A minha sogra. Morreu faz seis anos.'],
        referencia: 'Muro chapiscado, cadeira de rodas na varanda.',
        seguranca: 'Seguro. Eu e ele. Meu marido tá na usina.',
      },
      extra: [
        { id: 'levar', label: 'Conseguem levar ele à UPA?', say: 'Vocês têm como levar ele até a UPA?', a: ['Liguei pra UBS de manhã. {{Falaram pra levar ele lá|levar_ubs}}. {m:Moço|Moça}, como é que eu levo um homem acamado de oitenta quilos no ônibus?', 'O médico da família vinha todo mês. Faz um ano que não vem ninguém.'] },
        { id: 'labios', label: 'Lábios roxos? Muito sonolento?', say: 'Os lábios estão roxos? Ele está muito difícil de acordar?', a: 'Roxo não. Acorda quando eu chamo, mas não fica acordado muito tempo.' },
      ],
      links: [
        { a: 'confuso', b: 'febre', insight: 'Idoso que fica confuso de repente com febre: provável infecção (urina ou pulmão). Precisa ser removido e avaliado hoje. Amarelo → USB.' },
        { a: 'levar_ubs', b: 'manual:amarelo', insight: 'Acamado, sem condição de ir por meios próprios, com infecção e confusão: não é caso de "leva na UBS". USB (Manual p.1).' },
        { a: 'xixi', b: 'nao_reconheceu', insight: 'Xixi escuro e com cheiro forte, confusão nova: em idoso, a infecção urinária muitas vezes aparece assim, sem dor nenhuma.' },
      ],
      patient: { name: 'Osmar Cardoso', age: 84, sex: 'M' },
      truth: { dx: 'Provável infecção (urinária ou pulmonar) com confusão em idoso acamado', sev: 'amarelo', ok: ['USB'], risk: { good: 120, bad: 320, needs: 'USB' } },
      radio: {
        ok: 'Central, {unit}. Idoso acamado, febril, confuso, saturando 92. Provável infecção. Removendo pra UPA. A nora mandou a fralda e a lista de remédios.',
        excess: '{central}, {unit}. Idoso com febre e confusão, estável. Isso era básica, {dr}.',
      },
      diary: { alive: 'Acamado havia dois anos, confuso e com febre. Chamava a esposa que morreu. A UBS tinha mandado "levar lá".' },
    }),
  ],
  interlude: {
    teaser: 'A bombinha do Liam acabou. Ele jura que a tosse é "da garganta".',
    familyLacos: 1,
    bills: [
      {
        id: 'bombinha_davi',
        label: 'Bombinha e espaçador do Liam',
        amount: 80,
        when: (c) => !c.flag('bombinha') && is.present('davi')(c),
        desc: 'Na farmácia, sem receita nova: R$ 80. A receita do SUS venceu; a UBS só renova no dia 28.',
        onPay: fx.all(fx.set('bombinha'), fx.set('bombinha_dia', 3)),
      },
    ],
    scene: {
      id: 'd03_bombinha',
      bg: 'cozinha',
      cast: ['LUCIA', 'DAVI', 'ZELIA'],
      nodes: {
        start: {
          lines: [
            { who: 'NARRADOR', t: 'Onze da noite. Do quarto do Liam vem uma tosse seca, abafada no travesseiro.', when: is.not('bombinha_volta') },
            { who: 'NARRADOR', t: 'Você entra com a sacolinha da farmácia 24 horas pingando de garoa. Do quarto do Liam vem uma tosse seca, abafada no travesseiro.', when: is.flag('bombinha_volta') },
            { who: 'NARRADOR', t: 'A água voltou hoje cedo. {Oconj} não disse como. Em cima da geladeira, o pote de margarina está vazio.', when: (c) => c.flag('lucia_pagou_agua') },
            { who: 'LUCIA', t: '(chacoalhando a bombinha perto do ouvido) Acabou. Fazia três dias que ele tava usando "só um pouquinho", pra render.', when: is.not('bombinha_volta') },
            { who: 'LUCIA', t: '(abrindo a sacola) Você adivinhou ou ele te ligou escondido? A dele acabou hoje. Tava usando "só um pouquinho", pra render.', when: is.flag('bombinha_volta') },
            { who: 'DAVI', t: '(da porta do quarto, de pijama) Eu não tô tossindo. É a garganta.' },
            { who: 'ZELIA', t: 'Volta pra cama, meu anjo. A vó já vai fazer um chá de guaco.', when: is.not('bombinha_volta') },
            { who: 'LUCIA', t: 'Oitenta reais na farmácia, com o espaçador. O dele rachou, tá com fita crepe.', when: is.not('bombinha_volta') },
            { who: 'NARRADOR', t: 'Dois jatos com o espaçador novo, sem fita crepe. Ele conta até dez segurando o ar, de olho em você. A tosse vai espaçando.', when: is.flag('bombinha_volta') },
            { who: 'ZELIA', t: 'Oitenta reais. O seu pai ia reclamar do preço e comprar duas.', when: is.flag('bombinha_volta') },
          ],
          onEnter: (e) => {
            // a conta de água que ficou sem pagar no dia 2: a Lúcia resolveu com as economias da máquina
            if (e.flag('agua_cortada') && !e.flag('pagou_agua')) {
              e.set('pagou_agua');
              e.set('lucia_pagou_agua');
              e.unset('agua_cortada');
            }
          },
          choices: [
            { label: '"E a Farmácia Popular? Saiu no jornal que é de graça."', next: 'popular', when: is.not('bombinha') },
            { label: '"Amanhã cedo eu compro. Prometo."', next: 'promessa', effect: fx.set('prometeu_bombinha'), when: is.not('bombinha') },
            { label: '"Esse mês não fecha, {c:Lú|Alex}. A gente segura até o pagamento."', next: 'segura', when: is.not('bombinha') },
            { label: 'Ir até o quarto do Liam.', next: 'quarto', affectionate: true },
            { label: '(Sentar na cozinha e ouvir a tosse sumir.)', next: 'fim', when: is.flag('bombinha') },
          ],
        },
        popular: {
          lines: [
            { who: 'LUCIA', t: 'Com receita do SUS, {nome}. A dele venceu em janeiro. Fui na UBS hoje de manhã.' },
            { who: 'LUCIA', t: 'A moça olhou no computador e disse: "Renovação de receita, só dia vinte e oito". Vinte e oito de março.' },
            { who: 'ZELIA', t: 'Até lá o menino já fez faculdade.' },
          ],
          next: 'decide',
        },
        decide: {
          lines: [{ who: 'NARRADOR', t: 'Na cozinha, só o barulho da chaleira e a tosse, do outro lado da parede.' }],
          choices: [
            { label: '"Amanhã cedo eu compro. Prometo."', next: 'promessa', effect: fx.set('prometeu_bombinha') },
            { label: '"Esse mês não fecha, {c:Lú|Alex}. A gente segura até o pagamento."', next: 'segura' },
            { label: 'Ir até o quarto do Liam.', next: 'quarto', affectionate: true },
          ],
        },
        promessa: {
          lines: [
            { who: 'LUCIA', t: 'Tá. ({c:ela|ele} guarda a bombinha vazia na gaveta, do lado do espaçador de fita crepe) Oitenta reais, {nome}.' },
            { who: 'ZELIA', t: 'Tira do meu remédio, {filho}. Eu fico uns dias sem o da pressão, não vou morrer.' },
          ],
          choices: [
            { label: '"Não, mãe. O remédio da senhora não entra nessa conta."', next: 'fim', effect: fx.add('humanidade', 1, 'não deixou a mãe sem remédio') },
            { label: '(Não responder.)', next: 'fim', effect: fx.set('zelia_ofereceu_remedio') },
          ],
        },
        segura: {
          lines: [
            { who: 'LUCIA', t: '({c:ela|ele} demora pra responder) ...Tá.' },
            { who: 'DAVI', t: '(lá do quarto, alto o bastante) Tudo bem, {pai}! Eu fico quietinho pra não tossir!' },
            { who: 'NARRADOR', t: 'A tosse para. Você sabe que ele está segurando.' },
            { who: 'ZELIA', t: 'Igualzinho você pequeno, {filho}. Escondia a tosse pra não perder a escola.' },
          ],
          onEnter: fx.set('d3_segurou_bombinha'),
          next: 'fim',
        },
        quarto: {
          lines: [
            { who: 'NARRADOR', t: 'O Liam está sentado na cama, encostado na parede, com o desenho da ambulância grande no colo.' },
            { who: 'DAVI', t: '{Pai}, quando a bombinha acaba, o ar acaba também?' },
          ],
          choices: [
            { label: '"Não, filho. O ar não acaba. Amanhã eu compro outra."', next: 'fim', when: is.not('bombinha'), effect: fx.all(fx.set('prometeu_bombinha'), fx.add('lacos', 1, 'ficou com o Liam')) },
            { label: '"O ar não acaba. Respira devagar comigo: entra pelo nariz..."', next: 'respira', effect: fx.add('lacos', 1, 'ficou com o Liam') },
          ],
        },
        respira: {
          lines: [
            { who: 'NARRADOR', t: 'Vocês respiram juntos no escuro. Pelo nariz, devagar. Sai pela boca, mais devagar ainda.' },
            { who: 'DAVI', t: '(já com sono) Igual você ensina as pessoas no telefone?' },
          ],
          next: 'fim',
        },
        fim: {
          lines: [
            { who: 'NARRADOR', t: 'Você faz a conta de cabeça: aluguel, comida, luz, gás, o remédio da sua mãe. E oitenta reais. O número não fecha de nenhum jeito que não doa.', when: (c) => !c.flag('bombinha') },
            // flags.md: d3_segurou_bombinha (eco imediato) e zelia_ofereceu_remedio
            { who: 'NARRADOR', t: 'Meia-noite. Você passa pela porta do quarto: ele dormiu sentado, encostado na parede, com a mão na frente da boca. Segurando a tosse até no sono.', when: is.flag('d3_segurou_bombinha') },
            { who: 'NARRADOR', t: 'Na sala, a Dona Zélia tira um comprimido da cartela e devolve. Tira de novo. Devolve. Três vezes, sem saber que você está vendo.', when: is.flag('zelia_ofereceu_remedio') },
            { who: 'ZELIA', t: '(da cozinha) O chá de guaco tá pronto. Não cura nada, mas é quentinho.' },
          ],
        },
      },
    },
    bico: (c) => ({
      id: 'd03_bico',
      bg: 'cozinha',
      cast: ['LUCIA', 'ZELIA'],
      nodes: {
        start: {
          lines: [
            { who: 'NARRADOR', t: 'Na USA 01, entre uma ocorrência e outra, o Bené conta que esta semana já foram três crianças com asma e a bombinha vazia.' },
            ...(c.flag('bombinha_lucia')
              ? [
                  { who: 'NARRADOR', t: 'Em casa, de madrugada, em cima da mesa: uma bombinha nova, o espaçador e a nota da farmácia 24 horas. R$ 80. Mais R$ 20 de táxi, anotado à caneta.' },
                  { who: 'ZELIA', t: '(da cozinha, no escuro) {Oconj} foi de táxi às dez da noite. O menino tava puxando o ar. {c:Ela|Ele} não quis esperar você.' },
                ]
              : [
                  { who: 'NARRADOR', t: 'Em casa, de madrugada, a luz do quarto do Liam ainda está acesa.' },
                  { who: 'ZELIA', t: 'Ele dormiu sentado, {filho}. Encostado na parede, pra tossir menos. {Oconj} ficou do lado até agora.' },
                  { who: 'LUCIA', t: '(sem levantar os olhos) Não tinha dinheiro pra bombinha e pro táxi. Escolhi esperar você.' },
                ]),
          ],
        },
      },
    }),
    // a Lúcia decide sozinha: se a casa tem folga de dinheiro (e os Laços seguram), ela vai de táxi à farmácia 24 h
    onBico: (e) => {
      if (e.flag('agua_cortada') && !e.flag('pagou_agua')) {
        e.set('pagou_agua');
        e.set('lucia_pagou_agua');
        e.unset('agua_cortada');
      }
      if (!e.flag('bombinha') && e.v('lacos') >= 5 && e.money() >= 450) {
        e.pay(-100, 'Bombinha do Liam (farmácia 24 h + táxi)');
        e.set('bombinha');
        e.set('bombinha_dia', 3);
        e.set('bombinha_lucia');
      }
    },
  },
});
