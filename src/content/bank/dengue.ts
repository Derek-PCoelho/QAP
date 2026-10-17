// =============================================================================
// Banco — epidemia de dengue (protocolo do dia 11): adulta, idoso, criança.
// Armadilha clássica: "a febre passou" não é melhora (fase crítica).
// Instruções clínicas marcadas com [validar].
// [validar] As páginas do protocolo de regulação não trazem dengue (só febre como
// discriminador): a conduta segue a classificação A–D do Ministério da Saúde
// (sem alarme → hidratação e UBS; alarme → hospital; choque → USA).
// =============================================================================
import { tpl, lk, lm, ex } from './kit';

// -----------------------------------------------------------------------------
// "Acho que eu tô com dengue."
// -----------------------------------------------------------------------------
export const DENGUE_ADULTA = tpl({
  id: 'dengue_adulta',
  tags: ['dengue', 'leve', 'moderado'],
  minDay: 11,
  age: [18, 40],
  sex: 'F',
  rel: ['proprio'],
  open: () => ['{Dr}, acho que eu tô com {{dengue|dengue}}. Febre, o corpo todo doendo, dói atrás do olho.'],
  truths: [
    {
      id: 'sem_alarme',
      weight: 3,
      build: (p) => ({
        truth: { dx: 'Dengue sem sinais de alarme', sev: 'verde', ok: ['ORI'], ref: ['UBS'] },
        note: 'Suspeita de dengue. Voz boa.',
        noteWrong: 'Dengue grave! Corre, {dr}!',
        amb: ['ventilador'],
        q: {
          oque: 'Febre de 38 e meio desde anteontem. Moleza, dor no corpo.',
          consciencia: 'Acordada, deitada.',
          respira: 'Normal.',
          inicio: 'Anteontem.',
          idade: `${p.anos}.`,
          historico: 'Nada. Saudável.',
          dengue: 'Dor na barriga não, vômito não, sangramento não. Tontura ao levantar... não.',
          gestacao: 'Grávida não.',
        },
        extra: [ex('agua', 'Está bebendo água?', 'Está bebendo bastante líquido? Fazendo xixi?', '{{Tô bebendo bastante, faço xixi normal|hidratada}}.')],
        links: [lm(p, 'hidratada', 'dengue_sem', 'Dengue sem sinais de alarme, hidratada: orientação, hidratação e UBS (Manual p.11).')],
        radio: { excess: '{central}, {unit}. Dengue sem alarme, {dr}. Hidratamos e orientamos.' },
        diary: { ori: 'Dengue sem alarme. Muita água e UBS.' },
      }),
    },
    {
      id: 'alarme',
      weight: 2,
      build: (p) => ({
        truth: { dx: 'Dengue com sinais de alarme', sev: 'amarelo', ok: ['USB'], dest: ['UPA'], risk: { good: 90, bad: 260, needs: 'USB' } },
        note: 'Suspeita de dengue. Diz que piorou.',
        noteWrong: 'Dengue comum. Orienta, {dr}.',
        amb: ['silencio'],
        q: {
          oque: 'Começou com febre faz quatro dias. Hoje piorou.',
          consciencia: 'Acordada, mas muito mole.',
          respira: 'Normal.',
          inicio: 'Piorou hoje cedo.',
          idade: `${p.anos}.`,
          historico: 'Nada.',
          dengue: ['{{Dor forte na barriga|barriga}}. Vomitei cinco vezes.', '{{A gengiva sangrou|gengiva}}. E fico tonta quando levanto.'],
          sangramento: 'Só {{a gengiva sangrou|gengiva}}, quando escovei os dentes. Mais em lugar nenhum.',
          gestacao: 'Grávida não.',
        },
        links: [
          lm(p, 'barriga', 'dengue_alarme', 'Dor abdominal intensa, vômitos e sangramento de gengiva: dengue com sinais de alarme. USB → UPA (Manual p.11).'),
          lk('gengiva', 'barriga', 'Sangramento de mucosa e dor na barriga: fase crítica da dengue.', { kind: 'confirma' }),
        ],
        radio: { ok: 'Central, {unit}. Dengue com alarme. Soro aberto, seguimos pra UPA.' },
        diary: { alive: 'Dengue com sinais de alarme. Soro a tempo.' },
      }),
    },
    {
      id: 'choque',
      weight: 1,
      build: (p) => ({
        truth: { dx: 'Dengue grave (choque)', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 50, bad: 120 } },
        note: 'Dengue. Voz fraca, {dr}.',
        noteWrong: 'Dengue comum, febre.',
        amb: ['silencio'],
        q: {
          oque: 'A febre passou ontem, mas hoje eu não consigo levantar.',
          consciencia: 'Acordada... tô tonta, tudo rodando.',
          respira: 'Rápido.',
          inicio: 'Piorou de ontem pra hoje.',
          idade: `${p.anos}.`,
          historico: 'Nada.',
          dengue: ['{{Desmaiei no banheiro|desmaio}}.', '{{As mãos tão geladas|maos_frias}}, a boca seca, o coração disparado e fraquinho.'],
          gestacao: 'Grávida não.',
        },
        links: [
          lm(p, 'maos_frias', 'dengue_grave', 'Mãos geladas, desmaio e pulso fraco na dengue: choque. USA → Regional (Manual p.11).'),
          lk('desmaio', 'maos_frias', 'A febre passou e ela piorou: é a fase crítica, não a melhora.', { kind: 'confirma' }),
        ],
        radio: { ok: '{central}, {unit}. Dengue com choque. Dois acessos, soro rápido. Seguimos pro Regional.' },
        diary: { alive: 'Choque da dengue. Voltou com soro.', dead: 'Dengue grave. A febre tinha passado.' },
      }),
    },
    {
      id: 'gestante',
      weight: 1.2,
      build: (p) => ({
        truth: { dx: 'Dengue em gestante', sev: 'amarelo', ok: ['USB'], dest: ['MAT'] },
        note: 'Suspeita de dengue, mulher jovem.',
        noteWrong: 'Dengue sem alarme. Orientação.',
        amb: ['ventilador'],
        q: {
          oque: 'Febre de 39 desde ontem, dor no corpo inteiro.',
          consciencia: 'Acordada.',
          respira: 'Normal.',
          inicio: 'Ontem.',
          idade: `${p.anos}.`,
          historico: 'Nada... {{tô grávida, isso conta?|gravida}}',
          dengue: 'Dor na barriga... é o bebê mexendo. Vômito não. Sangramento não.',
          gestacao: '{{Tô de 24 semanas|semanas_24}}. Desculpa, esqueci de falar.',
        },
        links: [
          lm(p, 'semanas_24', 'dengue_gestante', 'Gestante com febre na epidemia: risco aumentado. USB → Maternidade (Manual p.11).'),
          lk('gravida', 'dengue', 'Ela está grávida: muda o destino e a urgência.', { kind: 'confirma' }),
        ],
        radio: { ok: 'Central, {unit}. Dengue em gestante de 24 semanas, estável. Seguimos pra Maternidade.' },
        diary: { alive: 'Dengue grávida de 24 semanas. Mãe e bebê bem.' },
      }),
    },
  ],
});

// -----------------------------------------------------------------------------
// "Meu pai tá com dengue e hoje tá muito fraco."
// -----------------------------------------------------------------------------
export const DENGUE_IDOSO = tpl({
  id: 'dengue_idoso',
  tags: ['dengue', 'idoso', 'moderado'],
  minDay: 11,
  age: [65, 90],
  rel: ['filho', 'neto'],
  open: (p) => [`${p.Quem} tá com {{dengue|dengue}}, {dr}. O posto confirmou anteontem. Hoje ${p.ele} tá muito fra${p.g('co', 'ca')}.`],
  truths: [
    {
      id: 'sem_alarme',
      weight: 1.5,
      build: (p) => ({
        truth: { dx: 'Dengue sem sinais de alarme (idoso)', sev: 'verde', ok: ['ORI'], ref: ['UBS', 'UPA'] },
        note: `${p.tipo} com dengue. Fraqueza.`,
        noteWrong: `${p.tipo} com dengue grave!`,
        amb: ['tv'],
        q: {
          oque: `Fraqueza, dor no corpo. Mas ${p.ele} come, bebe água.`,
          consciencia: `{{Acordad${p.o}, conversando, lúcid${p.o}|lucido}}.`,
          respira: 'Normal.',
          inicio: 'Começou faz quatro dias.',
          idade: `${p.anos}.`,
          historico: 'Pressão. Toma o remédio.',
          dengue: '{{Barriga não dói, não vomitou, não sangrou|sem_alarme}}. Levanta e vai no banheiro sozinh' + p.o + '.',
        },
        links: [lm(p, 'sem_alarme', 'dengue_sem', `${p.g('Idoso lúcido', 'Idosa lúcida')}, sem sinais de alarme, bebendo: hidratação e UBS (Manual p.11). Reavaliar se mudar.`)],
        radio: { excess: `{central}, {unit}. Dengue sem alarme, {dr}. Tá lúcid${p.o}, comendo.` },
        diary: { ori: 'Dengue sem alarme. Família orientada a dar muita água.' },
      }),
    },
    {
      id: 'alarme_confuso',
      weight: 2.5,
      build: (p) => ({
        truth: { dx: 'Dengue com sinais de alarme em idoso confuso', sev: 'amarelo', ok: ['USB'], dest: ['REG'], risk: { good: 90, bad: 260, needs: 'USB' } },
        note: `${p.tipo} com dengue, confus${p.o}.`,
        noteWrong: 'Dengue comum, fraqueza normal.',
        amb: ['silencio'],
        q: {
          oque: `Tá frac${p.o}, e hoje ${p.ele} {{não sabe que dia é|confuso}}.`,
          consciencia: `Acordad${p.o}, mas confus${p.o}.`,
          respira: 'Normal.',
          inicio: 'A confusão começou hoje.',
          idade: `${p.anos}.`,
          historico: 'Pressão, diabetes.',
          dengue: '{{Vomitou três vezes|vomitou}}. E fica tont' + p.o + ' quando levanta.',
        },
        links: [lm(p, 'confuso', 'dengue_alarme', `Dengue com vômitos e tontura em ${p.g('idoso confuso', 'idosa confusa')}: sinais de alarme. USB → Regional (Manual p.11: idoso ou confuso vai para o REG).`)],
        radio: { ok: `Central, {unit}. Dengue com alarme, ${p.g('idoso desidratado e confuso', 'idosa desidratada e confusa')}. Seguimos pro Regional.` },
        diary: { alive: `Dengue com confusão. Internad${p.o} no Regional, voltou pra casa.` },
      }),
    },
    {
      id: 'choque',
      weight: 1.2,
      build: (p) => ({
        truth: { dx: 'Dengue grave com choque (idoso)', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 50, bad: 120 } },
        note: `${p.tipo} com dengue, muito mal.`,
        noteWrong: 'Dengue, fraqueza. Tranquilo, {dr}.',
        amb: ['silencio'],
        q: {
          oque: `${p.Ele} {{desmaiou quando foi levantar|desmaiou}}. Tá deitad${p.o}, branc${p.o}.`,
          consciencia: 'Abre o olho quando eu chamo, mas não fala direito.',
          respira: 'Rápido.',
          inicio: 'Piorou de ontem pra hoje.',
          idade: `${p.anos}.`,
          historico: 'Pressão alta.',
          dengue: '{{A pele tá fria, o pulso fraquinho|pele_fria}}. Não fez xixi hoje.',
        },
        links: [lm(p, 'pele_fria', 'dengue_grave', 'Pele fria, pulso fraco, desmaio: choque da dengue. USA → Regional (Manual p.11).')],
        radio: { ok: '{central}, {unit}. Dengue com choque, idoso. Soro rápido, seguimos pro Regional.' },
        diary: { alive: 'Choque da dengue aos ' + p.age + ' anos. Saiu da UTI.', dead: 'Dengue grave.' },
      }),
    },
  ],
});

// -----------------------------------------------------------------------------
// "Meu filho tá com dengue. A febre até passou, mas ele tá esquisito."
// -----------------------------------------------------------------------------
export const DENGUE_CRIANCA = tpl({
  id: 'dengue_crianca',
  tags: ['dengue', 'pediatria', 'moderado'],
  minDay: 11,
  age: [5, 14],
  rel: ['mae', 'pai'],
  open: (p) => [`${p.Quem} tá com dengue, {dr}. {{A febre até passou hoje|febre_passou}}, mas ${p.ele} tá esquisit${p.o}.`],
  truths: [
    {
      id: 'melhorando',
      weight: 2,
      build: (p) => ({
        truth: { dx: 'Dengue em melhora, sem sinais de alarme', sev: 'verde', ok: ['ORI'], ref: ['UBS'] },
        // cena da videochamada (onde a história acontece)
        cena: { props: ['videogame'] },
        note: 'Criança com dengue, febre passou.',
        noteWrong: 'Criança com dengue grave!',
        amb: ['videogame'],
        noise: ['[barulho de videogame]'],
        q: {
          oque: `Esquisit${p.o} assim... cansad${p.o}, quiet${p.o}. Mas {{comeu, tá jogando videogame|jogando}}.`,
          consciencia: `Acordad${p.o}, jogando.`,
          respira: 'Normal.',
          inicio: 'A febre passou de manhã.',
          idade: `${p.anos}.`,
          historico: 'Nada.',
          dengue: '{{Barriga não dói, não vomitou, não sangrou|sem_alarme}}. Bebe água certinho.',
          paciente: [`${p.PT}: Tô bem! Só cansad${p.o}. Posso jogar mais?`],
        },
        links: [lm(p, 'sem_alarme', 'dengue_sem', 'Sem sinais de alarme, comendo e brincando: orientação e UBS. Atenção aos próximos dois dias (Manual p.11).')],
        radio: { excess: '{central}, {unit}. Dengue em melhora, {dr}. Tava jogando videogame.' },
        diary: { ori: 'Dengue saindo da febre, sem alarme. Família orientada sobre os sinais.' },
      }),
    },
    {
      id: 'alarme',
      weight: 2.5,
      build: (p) => ({
        truth: { dx: 'Dengue em fase crítica (sinais de alarme após a febre)', sev: 'amarelo', ok: ['USB'], dest: ['UPA'], risk: { good: 90, bad: 260, needs: 'USB' } },
        note: 'Criança com dengue, febre passou.',
        noteWrong: 'Febre passou, tá melhorando, {dr}.',
        amb: ['silencio'],
        q: {
          oque: `A febre passou, mas ${p.ele} {{tá com uma dor forte na barriga|barriga}} e molinh${p.o}.`,
          consciencia: `Acordad${p.o}, deitad${p.o}, quiet${p.o} demais.`,
          respira: 'Normal.',
          inicio: 'A febre passou hoje cedo. A dor começou depois.',
          idade: `${p.anos}.`,
          historico: 'Nada.',
          dengue: `{{Vomitou tudo que comeu|vomitos}}. Tont${p.o} quando levanta.`,
        },
        links: [
          lk('febre_passou', 'barriga', '"A febre passou" e apareceu dor forte na barriga com vômitos: não é melhora, é a fase crítica da dengue.'),
          lm(p, 'vomitos', 'dengue_alarme', 'Dor abdominal intensa e vômitos persistentes: sinais de alarme. USB → UPA (Manual p.11).'),
        ],
        radio: { ok: 'Central, {unit}. Dengue na fase crítica, com alarme. Soro, seguimos pra UPA.' },
        diary: { alive: 'A febre passou e a barriga doeu: fase crítica da dengue. Soro a tempo.' },
      }),
    },
    {
      id: 'grave',
      weight: 1,
      build: (p) => ({
        truth: { dx: 'Dengue grave (choque) em criança', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 50, bad: 120 } },
        note: 'Criança com dengue, muito mole.',
        noteWrong: 'Febre passou. Tá melhorando.',
        amb: ['silencio', 'choro'],
        q: {
          oque: `${p.Ele} tá sonolent${p.o}, {{a mão gelada, roxinha|mao_fria}}.`,
          consciencia: `{{Muito sonolent${p.o}, quase não responde|sonolento}}.`,
          respira: 'Rápido.',
          inicio: 'Piorou de uma hora pra cá.',
          idade: `${p.anos}.`,
          historico: 'Nada.',
          dengue: 'Sangrou o nariz, e não fez xixi desde cedo.',
          sangramento: 'O nariz sangrou hoje, do nada. Foi pouco.',
        },
        links: [lm(p, 'mao_fria', 'dengue_grave', 'Mãos frias e roxas, sonolência, sem xixi: choque da dengue. USA → Regional (Manual p.11).')],
        radio: { ok: '{central}, {unit}. Choque da dengue, criança. Soro em bolus. Seguimos pro Regional.' },
        diary: { alive: 'Choque da dengue na criança. Saiu da UTI.', dead: 'Dengue grave.' },
      }),
    },
  ],
});

export const DENGUE = [DENGUE_ADULTA, DENGUE_IDOSO, DENGUE_CRIANCA];
