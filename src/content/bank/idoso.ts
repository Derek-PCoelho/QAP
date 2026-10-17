// =============================================================================
// Banco — idosos: desmaio na igreja, idoso sozinho que não atende, queda em casa,
// febre e tosse, remédios tomados errado. Instruções clínicas marcadas com [validar].
// =============================================================================
import { tpl, lk, lm, must, ex } from './kit';

// -----------------------------------------------------------------------------
// "Uma irmã desmaiou aqui no culto!"
// -----------------------------------------------------------------------------
export const DESMAIO_IGREJA = tpl({
  id: 'desmaio_igreja',
  tags: ['idoso', 'cardio', 'grave'],
  age: [62, 86],
  sex: 'F',
  rel: ['testemunha', 'amigo', 'vizinho'],
  cena: { place: 'igreja', cast: [{ role: 'fiel', act: 'abanando' }, { role: 'fiel', act: 'mao_na_boca', at: 'fundo' }, { role: 'fiel', act: 'olhando', at: 'fundo' }] },
  open: (p) => [`Alô, emergência? {{Uma irmã desmaiou aqui no culto|culto}}! A ${p.nome}! Ela caiu do banco!`],
  truths: [
    {
      id: 'calor_jejum',
      weight: 3,
      build: (p) => ({
        // ⚖ RC20 (mal súbito): "história de inconsciência" é USB; aqui ela só ficou mole e não chegou a apagar (orientação), mas o desmaio de idosa é defensável como USB.
        truth: { dx: 'Desmaio por calor e jejum (já recuperada)', sev: 'verde', ok: ['ORI', 'USB'], best: 'ORI', ref: ['UBS', 'CASA'], dest: ['UPA'], must: must(p, 'consciencia', 'dorpeito') },
        note: 'Senhora desmaiou na igreja. Já acordou.',
        noteWrong: 'Senhora desmaiada na igreja, não acorda!',
        caller: `${p.cFirst} (da igreja)`,
        amb: ['igreja', 'multidao'],
        noise: ['[ventiladores de teto girando; o coral parou de cantar]'],
        q: {
          oque: 'Tava de pé cantando, {{um calor danado aqui dentro|calor}}... ficou branca e foi escorregando do banco.',
          consciencia: 'Apagar de vez não apagou, ficou mole e foi escorregando. {{Já tá abanando, conversando|acordou}}. Tá envergonhada.',
          respira: 'Normal.',
          inicio: 'Agora, faz uns cinco minutos.',
          idade: `${p.anos}.`,
          historico: 'Pressão... toma remédio. {{Tá de jejum desde ontem|jejum}}, é a campanha de oração.',
          dorpeito: 'Perguntei: diz que não dói nada, só deu uma fraqueza.',
          paciente: [`${p.PT}: Ai, que vergonha. Foi o calor. Já tô boa. Só preciso de um pouco de água.`],
        },
        extra: [ex('diabetes', 'Ela tem diabetes?', 'Ela tem diabetes? Usa insulina?', '{{Diabetes não tem|sem_diabetes}}, não. Só pressão.')],
        links: [
          lk('calor', 'jejum', 'Calor, horas em pé e jejum: queda de pressão. Acordou logo e conversa: orientar água, comida e sombra.'),
          lk('sem_diabetes', 'jejum', 'Jejum sem diabetes: não é hipoglicemia grave.', { kind: 'confirma' }),
        ],
        radio: { excess: '{central}, {unit}. Senhora em jejum, no calor. Já tava tomando suco quando chegamos, {dr}.' },
        diary: { ori: 'Desmaio no culto: calor e jejum da campanha. Orientada a comer.' },
      }),
    },
    {
      id: 'hipoglicemia',
      weight: 1.5,
      minDay: 6,
      build: (p) => ({
        // ⚖ RC10: diabética confusa, mas reativa = alteração da consciência (USB); não reativa = USA (a piora abaixo fecha em USA).
        truth: { dx: 'Hipoglicemia grave (jejum com insulina)', sev: 'vermelho', ok: ['USA', 'USB'], best: 'USA', dest: ['REG', 'UPA'], risk: { good: 50, bad: 120, needs: 'USB' } },
        note: 'Senhora desmaiada no culto. Suando.',
        noteWrong: 'Desmaio na igreja, calor. Já acordou.',
        caller: `${p.cFirst} (da igreja)`,
        amb: ['igreja', 'multidao'],
        noise: ['[orações em voz alta; alguém pede: "Ô irmã, acorda!"]'],
        q: {
          oque: 'Tava estranha desde o começo do culto, {{suando muito, a mão tremendo|suor}}... aí desmaiou.',
          consciencia: '{{Abre o olho, mas não fala coisa com coisa|confusa}}.',
          respira: 'Respira, sim.',
          inicio: 'Uns vinte minutos que tá assim.',
          idade: `${p.anos}.`,
          historico: '{{É diabética, toma insulina|insulina}}. E {{tá de jejum, é a campanha de oração|jejum}}.',
          paciente: ['[um gemido]', 'Ela não responde direito, {dr}.'],
        },
        extra: [ex('diabetes', 'Ela tem diabetes?', 'Ela tem diabetes? Usa insulina?', 'Tem! Toma insulina de manhã. {{Tomou hoje e não comeu nada|tomou}}.')],
        links: [
          lk('insulina', 'jejum', 'Insulina e jejum: hipoglicemia. Suada e confusa: grave. USA.'),
          lm(p, 'suor', 'hipoglicemia', 'Diabética com insulina, suada e confusa: hipoglicemia grave (Manual p.6).'),
        ],
        worsen: [{ after: 90, lines: ['Ela parou de responder, {dr}! O pastor tá orando, mas ela não acorda!'], truth: { ok: ['USA'], best: 'USA', risk: { good: 50, bad: 120 } } }],
        radio: { ok: '{central}, {unit}. Glicemia 30, irmã em jejum com insulina. Corrigimos a glicose, já tá cantando de novo.' },
        diary: { alive: 'Jejum da campanha com insulina. Hipoglicemia no culto. Acordou cantando.', dead: 'Hipoglicemia no culto.' },
      }),
    },
    {
      id: 'parada',
      weight: 1,
      build: (p) => ({
        truth: { dx: 'Parada cardiorrespiratória', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 30, bad: 75, guideBonus: 28 } },
        note: 'Senhora caída na igreja. Não responde!',
        noteWrong: 'Desmaio no culto. Calor, {dr}.',
        caller: `${p.cFirst} (da igreja)`,
        amb: ['igreja', 'gritos', 'choro'],
        noise: ['[gritos e choro; alguém grita "chama o médico!"]'],
        q: {
          oque: 'Ela pôs a mão no peito e caiu do banco, assim, de uma vez!',
          consciencia: 'Não! Não responde! {{Chamei, sacudi, nada|nao_responde}}!',
          respira: 'Tá fazendo um {{barulho de ronco, de vez em quando|agonica}}... isso é respirar?',
          inicio: 'Agora! Dois minutos!',
          idade: `${p.anos}, por aí.`,
          historico: 'Coração, acho. Ela toma uns remédios.',
          paciente: 'Ela não fala, {dr}! Ela não fala!',
        },
        links: [
          lm(p, 'agonica', 'parada', '"Ronco de vez em quando" em quem não responde é respiração agônica: PARADA. USA + RCP guiada (Manual p.1).'),
          lk('nao_responde', 'agonica', 'Não responde e respira esquisito: parada até prova em contrário.'),
        ],
        guide: { id: 'rcp' },
        radio: {
          saved: '{central}, {unit}. Voltou com dois choques. A igreja inteira rezando na calçada. Quem contou a massagem? Contou bonito.',
          dead: 'Central... {unit}. Fizemos tudo. Óbito às {hora}. O coral tá cantando baixinho aqui fora.',
          under: 'Central, {unit}! É parada! Iniciamos massagem, precisamos de USA agora!',
        },
        diary: { alive: 'Parada no culto. A massagem começou no banco da igreja.', dead: 'Parada no culto.' },
      }),
    },
    {
      id: 'infarto_atipico',
      weight: 1,
      minDay: 3,
      build: (p) => ({
        truth: { dx: 'Infarto sem dor típica', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 60, bad: 150 } },
        note: 'Senhora passou mal na igreja.',
        noteWrong: 'Desmaio no calor. Tranquilo, {dr}.',
        caller: `${p.cFirst} (da igreja)`,
        amb: ['igreja', 'multidao'],
        noise: ['[o pastor pede silêncio; murmúrios]'],
        q: {
          oque: 'Disse que tava com {{uma azia, um enjoo|azia}}, foi ao banheiro, e na volta caiu sentada no banco.',
          consciencia: 'Acordada. Mas tá {{suando frio, cinza|suor_frio}}.',
          respira: 'Respira curtinho, cansada.',
          dorpeito: '{{Dor no peito ela não sente|sem_dor}}. Diz que é um peso no estômago, que sobe pro queixo.',
          inicio: 'Começou no meio do culto, faz uns quarenta minutos.',
          idade: `${p.anos}.`,
          historico: '{{Diabética|diabetica}}, pressão alta. Toma remédio.',
        },
        extra: [ex('cansaco', 'Andava cansada?', 'Ela andava cansada esses dias?', '{{Andava cansada essa semana|cansada}}, nem varria a casa.')],
        links: [
          lm(p, 'azia', 'atipico', 'Idosa diabética com "azia", enjoo, suor frio e cansaço: infarto sem dor clássica. USA (Manual p.3).'),
          lk('sem_dor', 'suor_frio', 'Sem dor no peito, mas suor frio e peso que sobe pro queixo: infarto atípico.'),
        ],
        radio: { ok: '{central}, {unit}. Infarto, {dr}. Sem dor nenhuma no peito, só "azia". Seguimos pro Regional.' },
        diary: { alive: 'Infarto que parecia azia, no culto. Chegou a tempo.', dead: 'Infarto que parecia azia.' },
      }),
    },
  ],
});

// -----------------------------------------------------------------------------
// "Minha vizinha mora sozinha e não atende a porta desde ontem."
// -----------------------------------------------------------------------------
export const IDOSO_SOZINHO = tpl({
  id: 'idoso_sozinho',
  tags: ['idoso', 'moderado'],
  age: [74, 93],
  rel: ['vizinho'],
  open: (p) => [
    `Oi, eu sou vizinh${p.co} d${p.o} ${p.nome}. ${p.Ele} mora sozinh${p.o} e {{não atende a porta desde ontem|nao_atende}}.`,
    `{{A luz da varanda tá acesa desde ontem|luz}}... eu tô preocupad${p.co}, {dr}.`,
  ],
  truths: [
    {
      id: 'caido',
      weight: 3,
      build: (p) => ({
        truth: { dx: 'Idoso caído no chão desde a noite anterior', sev: 'amarelo', ok: ['USB'], dest: ['UPA'], risk: { good: 120, bad: 300, needs: 'USB' } },
        // cena da videochamada (onde a história acontece)
        cena: { place: 'quarto' },
        note: `${p.tipo} sozinh${p.o}, não atende. Vizinh${p.co} acha que caiu.`,
        noteWrong: `Vizinh${p.co} exagerad${p.co}. Deve ter saído, {dr}.`,
        amb: ['silencio', 'passaros'],
        noise: ['[batidas na porta: TOC TOC TOC]'],
        q: {
          oque: `Olhei pela janela do quarto: {{${p.ele} tá no chão, mexendo a mão|chao}}! Falou alguma coisa baixinho.`,
          consciencia: `Mexe a mão, fala baixinho comigo pela janela. Tá acordad${p.o}.`,
          respira: 'Respira, sim.',
          inicio: '{{Acho que caiu ontem à noite|ontem}}. A luz tá acesa desde ontem.',
          idade: `${p.anos}.`,
          historico: 'Pressão. Usa andador.',
          paciente: ['[pela janela, uma voz fraca]', `${p.PT}: Caí... ontem... não consigo levantar... tô com sede...`],
        },
        extra: [ex('chave', 'Consegue entrar na casa?', 'Você consegue entrar? Tem chave?', ['A filha deixou uma chave comigo! Peraí...', `Entrei. {{Tá no chão do quarto, gelad${p.o}, a perna dói|dentro}}.`])],
        links: [lk('ontem', 'chao', `No chão desde ontem: risco de lesão muscular, desidratação, fratura. Acordad${p.o}: amarelo, USB.`)],
        radio: { ok: `Central, {unit}. ${p.g('Idoso', 'Idosa')} no chão desde ontem, desidratad${p.o}, provável fratura de quadril. Removendo.` },
        diary: { alive: 'Passou a noite inteira no chão. A vizinhança tinha a chave.' },
      }),
    },
    {
      id: 'viajou',
      weight: 1.5,
      build: (p) => ({
        truth: { dx: 'Nada: estava viajando (casa vazia)', sev: 'azul', ok: ['ORI'], ref: ['CASA'] },
        // cena da videochamada (onde a história acontece)
        cena: { vazio: true, place: 'porta', first: 'A porta da casa, fechada. Pela janela, a sala vazia e arrumada; ninguém lá dentro.', volta: 'A casa fechada, o portão com cadeado. A luz da varanda acesa.' },
        note: `Vizinh${p.co} preocupad${p.co}. ${p.tipo} não atende a porta.`,
        noteWrong: `${p.tipo} sozinh${p.o}, pode estar caíd${p.o}! Grave, {dr}.`,
        amb: ['rua', 'cachorro'],
        q: {
          oque: 'Ninguém atende. Eu bati, chamei, nada. {{A casa tá toda fechada|fechada}}.',
          consciencia: 'Não sei, {dr}! Não vejo ninguém lá dentro.',
          respira: 'Não sei, não vejo ninguém.',
          inicio: `Desde ontem ninguém viu ${p.ele}.`,
          idade: `${p.anos}.`,
          historico: 'Pressão alta. Mas é forte, faz hidroginástica.',
          paciente: 'Não tem como, {dr}, ninguém atende!',
        },
        extra: [
          ex('familia', 'Tem telefone da família?', 'Tem o telefone de alguém da família? Liga pra eles.', ['Tenho da filha... peraí, vou ligar no outro celular.', '[pausa]', `{{${p.Ele} tá na casa da filha em Rio Claro desde anteontem|viajou}}! A filha esqueceu de me avisar. Ai, que vergonha, {dr}.`]),
          ex('janela', 'Dá pra olhar pela janela?', 'Dá pra olhar pela janela do quarto?', 'Olhei pela fresta: {{a cama tá arrumada e a mala não tá no armário|cama}}.'),
        ],
        links: [
          lk('viajou', 'nao_atende', 'A família confirma: está viajando. Ninguém em perigo. Orientação.'),
          lk('cama', 'fechada', 'Cama arrumada e casa fechada: sinal de viagem, não de queda.', { kind: 'confirma' }),
        ],
        radio: { excess: `Central, {unit}. Casa vazia, {dr}. ${p.g('O senhor', 'A senhora')} tá em Rio Claro, na casa da filha.` },
        diary: { ori: 'Vizinhança preocupada com a luz acesa. Estava na casa da filha.' },
      }),
    },
    {
      id: 'coma',
      weight: 1.2,
      build: (p) => ({
        truth: { dx: 'AVC grave (encontrado em coma)', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 60, bad: 140 } },
        // cena da videochamada (onde a história acontece)
        cena: { place: 'sala', pose: 'cama', signs: ['olhos_fechados'] },
        note: `${p.tipo} sozinh${p.o}, vizinh${p.co} viu pela janela.`,
        noteWrong: `${p.tipo} dormindo, acho. Não atende, {dr}.`,
        amb: ['silencio'],
        noise: ['[batidas no vidro da janela]'],
        q: {
          oque: `Olhei pela janela: ${p.ele} tá no sofá e {{não acorda com as batidas no vidro|nao_acorda}}.`,
          consciencia: 'Não acorda! Bati no vidro, gritei!',
          respira: '{{Respira alto, roncando, mas regular|ronco}}. Dá pra ver a barriga subindo.',
          inicio: 'Não sei... ontem à noite vi pela janela, tava normal vendo TV.',
          idade: `${p.anos}.`,
          historico: 'Pressão alta. Toma remédio pra afinar o sangue, acho.',
          paciente: 'Não responde, {dr}!',
        },
        extra: [ex('chave', 'Consegue entrar na casa?', 'Você consegue entrar? Tem chave?', ['Tenho a chave da filha! Entrei...', `{{Um lado do rosto tá caído|rosto}}, a mão direita mole... e fez xixi no sofá.`])],
        links: [
          lk('nao_acorda', 'ronco', 'Não acorda com estímulo e ronca: coma. Vermelho, USA.'),
          lk('rosto', 'nao_acorda', 'Rosto caído de um lado e mão mole em quem não acorda: AVC grave. USA → Regional.'),
        ],
        radio: { ok: '{central}, {unit}. AVC grave, rebaixado. Via aérea protegida. Seguimos pro Regional.' },
        diary: { alive: 'Achado em coma pela vizinhança. AVC. Sobreviveu.', dead: 'Achado em coma pela vizinhança. AVC.' },
      }),
    },
    {
      id: 'obito',
      weight: 0.6,
      minDay: 3,
      build: (p) => ({
        truth: { dx: 'Óbito em casa (horas antes da ligação)', sev: 'vermelho', ok: ['USB', 'USA'], best: 'USB', dest: ['REG'], risk: { good: 1, bad: 2, needs: 'USB' }, inevitable: true },
        // cena da videochamada (onde a história acontece)
        cena: { place: 'cozinha', pose: 'caido' },
        note: `${p.tipo} sozinh${p.o}. Vizinh${p.co} diz que o cachorro não para de uivar.`,
        noteWrong: `${p.tipo} deve ter viajado. Calma, {dr}.`,
        amb: ['cachorro', 'silencio'],
        noise: ['[{{um cachorro uiva dentro da casa|cachorro}}]'],
        q: {
          oque: `{{O cachorro ${p.dele} não para de uivar|uiva}} desde ontem. E... tem um cheiro, {dr}.`,
          consciencia: [`Olhei pela janela da cozinha... ${p.ele} tá no chão. {{Não mexe nada|nao_mexe}}.`, '[a voz falha]'],
          respira: '{{Não dá pra ver a barriga mexer|nao_respira}}... a pele tá de uma cor esquisita, roxa.',
          inicio: 'Vi ontem de manhã no portão. Depois mais nada.',
          idade: `${p.anos}.`,
          historico: `Coração. Morava sozinh${p.o} desde que ficou viúv${p.o}.`,
          paciente: `${p.Ele} não responde, {dr}... não responde.`,
        },
        extra: [ex('chave', 'Consegue entrar na casa?', 'Você consegue entrar? Tem chave?', 'Não tenho chave... a porta é de ferro.')],
        links: [lk('uiva', 'nao_mexe', 'Cachorro uivando há um dia, imóvel, pele roxa: provável óbito há horas. Mesmo assim, quem constata é a equipe. Mande a viatura.')],
        radio: {
          dead: 'Central, {unit}. Óbito constatado. Já fazia muitas horas, {dr}. Não tinha o que fazer.',
          dismissed: 'Liguei de novo, {dr}... os bombeiros abriram a porta. Tá gelad' + p.o + '. Ninguém veio.',
        },
        diary: { dead: `Morava sozinh${p.o}. A vizinhança estranhou o cachorro. Já fazia horas.` },
      }),
    },
    {
      id: 'surdo',
      weight: 1.2,
      build: (p) => ({
        truth: { dx: 'Nada: dormia sem o aparelho de surdez', sev: 'azul', ok: ['ORI'], ref: ['CASA'] },
        // cena da videochamada (onde a história acontece)
        cena: { place: 'quarto', pose: 'cama', signs: ['olhos_fechados'] },
        note: `Vizinh${p.co} preocupad${p.co}, ${p.tipo.toLowerCase()} não atende.`,
        noteWrong: `${p.tipo} caíd${p.o} em casa, {dr}!`,
        amb: ['passaros'],
        noise: ['[TOC TOC TOC na janela]'],
        q: {
          oque: `Bati, chamei, nada... ${p.ele} tá deitad${p.o} na cama, eu vi pela janela, {{de olho fechado|olho_fechado}}.`,
          consciencia: 'Não sei, tá de olho fechado. Não responde quando eu chamo.',
          respira: '{{Respira tranquilo, a barriga subindo e descendo|respira_bem}}.',
          inicio: `Desde ontem ninguém viu ${p.ele}.`,
          idade: `${p.anos}.`,
          historico: `{{É surd${p.o}, usa aparelho|surdo}}. Pressão.`,
          paciente: ['Vou bater no vidro do quarto de novo... [TOC TOC TOC]', '...', `${p.PT}: Quem é? ...Ah, é você, ${p.cFirst}! {{Eu tava sem o aparelho|sem_aparelho}}! Que susto!`],
        },
        links: [
          lk('surdo', 'olho_fechado', 'Surdo, sem o aparelho, dormindo com a respiração tranquila: não ouviu as batidas.'),
          lk('sem_aparelho', 'nao_atende', 'Acordou e explicou: dormia sem o aparelho. Ninguém em perigo.'),
        ],
        radio: { excess: `{central}, {unit}. ${p.g('O senhor', 'A senhora')} tava dormindo sem o aparelho de surdez, {dr}. Ofereceu café.` },
        diary: { ori: 'Não atendia a porta: dormia sem o aparelho de surdez.' },
      }),
    },
  ],
});

// -----------------------------------------------------------------------------
// "Meu pai caiu no banheiro."
// -----------------------------------------------------------------------------
export const QUEDA_IDOSO = tpl({
  id: 'queda_idoso',
  tags: ['idoso', 'trauma_moderado', 'leve', 'moderado'],
  age: [70, 94],
  rel: ['filho', 'neto', 'esposa', 'marido'],
  cena: { place: 'banheiro', pose: 'caido' },
  open: (p) => [`${p.Quem} {{caiu no banheiro|caiu}}, {dr}! Tá no chão, eu não consigo levantar ${p.ele} sozinh${p.co}!`],
  truths: [
    {
      id: 'femur',
      weight: 3,
      build: (p) => ({
        // [validar] RT6 (idoso >70 com fratura = USB) + Anexo VII (perfil traumato-ortopédico vai a serviço especializado): fêmur aceita UPA ou Regional.
        truth: { dx: 'Provável fratura de fêmur', sev: 'amarelo', ok: ['USB'], dest: ['UPA', 'REG'], risk: { good: 120, bad: 320, needs: 'USB' } },
        note: `${p.tipo} caiu no banheiro. Não levanta.`,
        noteWrong: `${p.tipo} caiu, mas tá bem, {dr}. Só precisa de ajuda pra levantar.`,
        amb: ['gemidos', 'chuveiro'],
        noise: ['[{{gemidos de dor|gemido}}]'],
        q: {
          oque: 'Escorregou no piso molhado e caiu de lado, em cima do quadril.',
          consciencia: `Acordad${p.o}, reclamando de dor. Sabe quem eu sou, sabe o dia.`,
          respira: 'Respira, sim. Só gemendo.',
          inicio: 'Agora, faz uns quinze minutos.',
          idade: `${p.anos}.`,
          sangramento: 'Sangue não. Mas {{a perna tá virada pra fora e parece mais curta|perna_curta}}.',
          historico: 'Pressão e osteoporose. Toma cálcio.',
          paciente: [`${p.PT}: Ai... o quadril... não mexe, não mexe...`, `${p.PT}: Bater a cabeça eu não bati, não.`],
        },
        links: [lm(p, 'perna_curta', 'amarelo', 'Idoso, queda sobre o quadril, perna encurtada e virada para fora: provável fratura de fêmur. Amarelo → USB (Manual p.1).')],
        radio: {
          ok: `Central, {unit}. Provável fratura de colo de fêmur. Imobilizad${p.o}, removendo.`,
          excess: '{central}, {unit}. Fratura de fêmur, estável, sem risco imediato. Dava USB, {dr}.',
        },
        diary: { alive: 'Queda no banheiro, fratura de fêmur. Operou.' },
      }),
    },
    {
      id: 'sem_lesao',
      weight: 2,
      build: (p) => ({
        truth: { dx: 'Queda sem lesão (só precisava de ajuda para levantar)', sev: 'verde', ok: ['ORI'], ref: ['UBS', 'CASA'] },
        // cena da videochamada (onde a história acontece)
        cena: { pose: 'encostado' },
        note: `${p.tipo} caiu sentad${p.o}. Parece bem.`,
        noteWrong: `${p.tipo} caiu e não levanta! Fratura, {dr}.`,
        amb: ['tv'],
        noise: ['[{{uma risada nervosa ao fundo|risada}}]'],
        q: {
          oque: `Escorregou e {{caiu sentad${p.o}|sentado}}. Não bateu a cabeça.`,
          consciencia: `Acordad${p.o}, rindo de nervoso.`,
          respira: 'Normal.',
          inicio: 'Faz uns dez minutos.',
          idade: `${p.anos}.`,
          sangramento: 'Não, nada. Só um vermelhinho no cotovelo.',
          historico: 'Pressão. Toma o remédio certinho.',
          paciente: [`${p.PT}: Eu tô bem! É que eu sou pesad${p.o} e ninguém aqui aguenta me levantar. [risada]`],
        },
        extra: [
          ex('dor', 'Dói? Mexe as pernas?', `Dói em algum lugar? ${p.Ele} mexe as duas pernas?`, '{{Mexe tudo, as duas pernas|mexe}}. Dor nenhuma, só no orgulho.'),
          ex('cabeca', 'Bateu a cabeça? Afina o sangue?', `${p.Ele} bateu a cabeça? Toma remédio pra afinar o sangue?`, 'Não bateu. Remédio de afinar o sangue não toma.'),
          ex('levantar', 'Orientar a levantar', 'Orientar como levantar com segurança', ['Uma cadeira firme do lado, virar de lado, ficar de joelhos e apoiar na cadeira... peraí...', `${p.Ele} levantou! Tá sentad${p.o} na cadeira!`], { kind: 'fala', say: 'Traz uma cadeira firme. Ajuda a virar de lado, depois ficar de joelhos e apoiar na cadeira para levantar. Devagar.' }), // [validar]
        ],
        links: [lk('mexe', 'sentado', `Caiu sentad${p.o}, mexe tudo, sem dor e sem bater a cabeça: sem lesão. Orientar como levantar com segurança.`)],
        radio: { excess: `{central}, {unit}. Ninguém machucado, {dr}. Só ajudamos a levantar. ${p.g('Ele', 'Ela')} pediu desculpa três vezes.` },
        diary: { ori: `Caiu sentad${p.o} no banheiro. Sem lesão. Ensinamos a levantar com uma cadeira.` },
      }),
    },
    {
      id: 'tce_anticoagulado',
      weight: 1.2,
      build: (p) => ({
        truth: { dx: 'Traumatismo craniano em quem usa anticoagulante', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 45, bad: 110 } },
        note: `${p.tipo} caiu e bateu a cabeça.`,
        noteWrong: `Queda simples, ${p.tipo.toLowerCase()} acordad${p.o}.`,
        amb: ['silencio'],
        q: {
          oque: 'Caiu e {{bateu a cabeça na pia|cabeca}}. Tem um galo enorme.',
          consciencia: `{{Tá com muito sono|sono}}, eu chamo e ${p.ele} demora pra responder.`,
          respira: 'Respira.',
          inicio: 'Faz uma meia hora.',
          idade: `${p.anos}.`,
          sangramento: 'Um pouco de sangue da testa.',
          historico: 'Coração... {{toma remédio pra afinar o sangue|anticoagulante}}, aquele que tem que fazer exame.',
        },
        extra: [ex('vomito', 'Vomitou?', `${p.Ele} vomitou depois da queda?`, '{{Vomitou duas vezes|vomitou}}.')],
        links: [
          lk('anticoagulante', 'cabeca', 'Batida na cabeça em quem toma remédio para afinar o sangue: risco alto de sangramento no cérebro.'),
          lk('sono', 'vomitou', 'Sonolência e vômitos depois de bater a cabeça: sinais de alarme. TCE grave: USA → Regional.'),
        ],
        worsen: [{ after: 100, lines: [`{Dr}, agora ${p.ele} {{não responde mais|nao_responde}}!`] }],
        radio: { ok: '{central}, {unit}. TCE em anticoagulado, rebaixando. Seguimos pro Regional, tomografia avisada.' },
        diary: { alive: 'Bateu a cabeça na pia. Afinava o sangue. Sangramento drenado a tempo.', dead: 'Bateu a cabeça na pia. Sangramento no cérebro.' },
      }),
    },
    {
      id: 'sincope_cardiaca',
      weight: 1,
      minDay: 3,
      build: (p) => ({
        truth: { dx: 'Queda por desmaio de origem cardíaca (provável infarto)', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 60, bad: 150 } },
        note: `${p.tipo} caiu. Acordad${p.o}, suando.`,
        noteWrong: 'Escorregou no banheiro. Queda simples, {dr}.',
        amb: ['silencio'],
        q: {
          oque: `${p.Ele} disse que {{ficou tudo preto antes de cair|preto}}.`,
          consciencia: `Acordad${p.o}, mas {{suando frio|suor}}.`,
          respira: 'Respira curto, cansad' + p.o + '.',
          inicio: 'Uns quinze minutos.',
          idade: `${p.anos}.`,
          dorpeito: `Diz que tá com {{uma dor apertando no peito|aperto}}, que vai pro braço.`,
          sangramento: 'Não sangrou, não.',
          historico: 'Pressão, colesterol. Diabetes.',
        },
        links: [
          lm(p, 'aperto', 'peito', 'Idoso com dor apertando no peito que vai para o braço, suor frio, desmaio: provável infarto. USA (Manual p.3).'),
          lk('preto', 'aperto', 'A queda não foi tropeço: desmaiou por causa do coração.'),
        ],
        radio: { ok: '{central}, {unit}. Infarto, {dr}. A queda foi o de menos. Seguimos pro Regional.' },
        diary: { alive: 'A queda no banheiro era infarto. Desentupiram a tempo.', dead: 'A queda no banheiro era infarto.' },
      }),
    },
    {
      id: 'punho',
      weight: 1.5,
      build: (p) => ({
        // [validar] RT6: idoso >70 com fratura = USB, mas "deformidade em membro superior" = orientação; ficou ⚖ ORI/USB (qual é a "melhor"?).
        truth: { dx: 'Provável fratura de punho, sem outros sinais', sev: 'verde', ok: ['ORI', 'USB'], best: 'ORI', ref: ['UPA'], dest: ['UPA'], must: must(p, 'consciencia', 'cabeca') },
        // cena da videochamada (onde a história acontece)
        cena: { pose: 'encostado' },
        note: `${p.tipo} caiu e machucou o pulso.`,
        noteWrong: `${p.tipo} caíd${p.o} no chão! Grave, {dr}.`,
        amb: ['tv'],
        q: {
          oque: 'Escorregou e {{pôs a mão no chão|mao_chao}}. Agora o pulso tá torto.',
          consciencia: `Acordad${p.o}, falando, reclamando do pulso.`,
          respira: 'Normal.',
          inicio: 'Agora há pouco.',
          idade: `${p.anos}.`,
          sangramento: 'Não sangra. Tá inchado e {{torto, tipo um garfo|garfo}}.',
          historico: 'Pressão. Osteoporose.',
          paciente: [`${p.PT}: Só o pulso, gente. O resto tá bom. Me ajuda que eu vou de táxi.`],
        },
        extra: [
          ex('cabeca', 'Bateu a cabeça? Afina o sangue?', `${p.Ele} bateu a cabeça? Toma remédio pra afinar o sangue?`, 'Não bateu. Remédio de afinar o sangue não toma.'),
          ex('andar', 'Consegue andar?', `${p.Ele} consegue andar?`, '{{Levantou com ajuda e anda|anda}}. Só segura o braço.'),
        ],
        links: [lk('garfo', 'anda', 'Pulso torto como um garfo, anda e não bateu a cabeça: fratura de punho sem gravidade. UPA por meios próprios, com o braço imobilizado.')], // [validar]
        radio: { ok: 'Central, {unit}. Fratura de punho, estável. Levamos pra UPA.', excess: '{central}, {unit}. Fratura de punho. Ia de táxi, {dr}.' },
        diary: { ori: 'Queda com fratura de punho. Foi de táxi para a UPA.', alive: 'Fratura de punho na queda. Gesso.' },
      }),
    },
  ],
});

// -----------------------------------------------------------------------------
// "Minha avó tá com febre e tosse faz três dias."
// -----------------------------------------------------------------------------
export const FEBRE_IDOSO = tpl({
  id: 'febre_idoso',
  tags: ['idoso', 'respiratorio', 'leve', 'moderado'],
  age: [70, 92],
  rel: ['filho', 'neto', 'esposa', 'marido'],
  cena: { place: 'quarto', pose: 'cama' },
  open: (p) => [`${p.Quem} tá com {{febre e tosse faz três dias|tres_dias}}, {dr}. Hoje ${p.ele} não quer levantar da cama.`],
  truths: [
    {
      id: 'gripe',
      weight: 2.5,
      build: (p) => ({
        truth: { dx: 'Gripe sem sinais de gravidade', sev: 'verde', ok: ['ORI'], ref: ['UBS', 'UPA'] },
        note: `${p.tipo} gripad${p.o}. Família preocupada.`,
        noteWrong: `${p.tipo} com febre, prostrad${p.o}. Pode ser grave, {dr}.`,
        amb: ['tv'],
        q: {
          oque: 'Gripe, acho. Nariz escorrendo, tosse seca.',
          consciencia: `Acordad${p.o}, reclamando, assistindo TV na cama.`,
          respira: '{{Respira normal|respira_ok}}, só a tosse.',
          inicio: 'Começou sábado.',
          idade: `${p.anos}.`,
          historico: 'Pressão. A vacina da gripe esse ano... acho que não tomou.',
          paciente: [`${p.PT}: Tô cansad${p.o}, só isso. Me deixa quiet${p.o}.`],
        },
        extra: [
          ex('come', 'Está comendo e bebendo?', `${p.Ele} está comendo e bebendo?`, '{{Come pouquinho, mas come. Bebe água|come}}.'),
          ex('febre', 'Quanto deu a febre?', 'Quanto deu a febre? Baixa com remédio?', '{{38, baixa com o remédio|febre_baixa}}.'),
        ],
        links: [lk('come', 'febre_baixa', 'Come, bebe, febre que baixa com remédio, respiração normal: gripe sem gravidade. UBS.')],
        radio: { excess: '{central}, {unit}. Gripe, {dr}. Saturação ótima. Pediu pra gente fechar a porta.' },
        diary: { ori: 'Gripe em casa. Orientados hidratação e UBS.' },
      }),
    },
    {
      id: 'sepse',
      weight: 1.3,
      build: (p) => ({
        truth: { dx: 'Sepse por pneumonia', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 50, bad: 120 } },
        note: `${p.tipo} com febre e confus${p.o}.`,
        noteWrong: 'Gripe em idoso. Tranquilo, {dr}.',
        amb: ['silencio'],
        q: {
          oque: `Hoje ${p.ele} {{não fala coisa com coisa|confuso}}, e tá respirando rápido.`,
          consciencia: `Confus${p.o}, sonolent${p.o}.`,
          respira: '{{Rápido, puxando, parece que corre|taquipneia}}.',
          inicio: 'A febre faz três dias. A confusão começou hoje.',
          idade: `${p.anos}.`,
          historico: 'Diabetes, pressão.',
        },
        extra: [
          ex('maos', 'Mãos e pés? Xixi?', 'Como estão as mãos e os pés? Fez xixi hoje?', '{{Gelados, meio roxinhos|maos_frias}}. E não fez xixi hoje.'),
          ex('febre', 'Quanto deu a febre?', 'Quanto deu a febre?', '39 e meio de manhã. Agora tá até fri' + p.o + '.'),
        ],
        links: [
          lk('confuso', 'taquipneia', 'Febre com confusão e respiração rápida: infecção grave (sepse).'),
          lk('maos_frias', 'confuso', 'Mãos geladas, sem xixi e confusão: choque. Vermelho, USA.'), // RC12/RC20: alteração (súbita) da consciência = USA
        ],
        radio: { ok: '{central}, {unit}. Sepse, pressão 8 por 4. Soro aberto, seguimos pro Regional.' },
        diary: { alive: 'Febre de três dias que virou sepse. Chegou a tempo.', dead: 'Sepse por pneumonia.' },
      }),
    },
    {
      id: 'pneumonia',
      weight: 2,
      build: (p) => ({
        truth: { dx: 'Pneumonia (cansaço aos esforços, fala frases inteiras)', sev: 'amarelo', ok: ['USB'], dest: ['UPA'], risk: { good: 120, bad: 300, needs: 'USB' } },
        note: `${p.tipo} com febre, tosse e cansaço.`,
        noteWrong: 'Só uma gripe, {dr}.',
        amb: ['respiracao'],
        noise: ['[uma tosse cheia de catarro ao fundo]'],
        q: {
          oque: 'A tosse virou catarro amarelo. E hoje cansa só de ir até o banheiro.',
          consciencia: `Acordad${p.o}, conversa direitinho, mas cansa.`,
          respira: '{{Respira rápido, cansa nos esforços|cansa}}, mas fala as frases inteiras.',
          inicio: 'Três dias de febre. Piorou ontem.',
          idade: `${p.anos}.`,
          historico: 'Pressão alta. Fumou muitos anos.',
        },
        extra: [
          ex('febre', 'Quanto deu a febre?', 'Quanto deu a febre? Baixa com remédio?', '{{39, que não baixa direito|febre}}.'),
          ex('come', 'Está comendo e bebendo?', `${p.Ele} está comendo e bebendo?`, 'Quase nada. Bebe água se eu insistir.'),
        ],
        links: [lk('cansa', 'febre', 'Febre alta que não baixa, catarro e falta de ar aos esforços em idoso, ainda falando frases inteiras: provável pneumonia. Amarelo, USB.')], // RC12: frase entrecortada seria USA
        radio: { ok: 'Central, {unit}. Pneumonia, saturando 90. Oxigênio e seguimos pra UPA.' },
        diary: { alive: 'Pneumonia. Ficou uns dias no oxigênio.' },
      }),
    },
  ],
});

// -----------------------------------------------------------------------------
// "Minha mãe tomou os remédios errado!" (protocolo de intoxicação, dia 13)
// -----------------------------------------------------------------------------
export const REMEDIOS_IDOSO = tpl({
  id: 'remedios_idoso',
  tags: ['intox', 'idoso', 'moderado'],
  minDay: 13,
  age: [68, 90],
  rel: ['filho', 'neto', 'esposa', 'marido'],
  cena: { place: 'sala' },
  open: (p) => [`{Dr}, ${p.quem} {{tomou os remédios errado|errado}}! Acho que tomou dobrado!`],
  truths: [
    {
      id: 'pressao_dobrada',
      weight: 2,
      build: (p) => ({
        truth: { dx: 'Hipotensão por remédio de pressão em dobro', sev: 'amarelo', ok: ['USB'], dest: ['UPA'] },
        note: `${p.tipo} tomou remédio dobrado. Tont${p.o}.`,
        noteWrong: 'Tomou vitamina dobrada. Nada grave, {dr}.',
        amb: ['tv'],
        q: {
          oque: 'Tomou o da pressão de manhã e {{tomou de novo agora|de_novo}}, esqueceu que já tinha tomado.',
          consciencia: `Acordad${p.o}, mas {{tont${p.o}, pálid${p.o}|tonto}}.`,
          respira: 'Normal.',
          inicio: 'Faz uma hora.',
          idade: `${p.anos}.`,
          ingestao: '{{Dois comprimidos de pressão|dois_comprimidos}}. A cartela tá aqui na minha mão.',
          historico: 'Pressão alta e coração.',
        },
        extra: [ex('pressao', 'Mediu a pressão?', 'Tem aparelho? Mede a pressão agora.', '{{Deu 8 por 5|pa_baixa}}.')],
        links: [
          lk('pa_baixa', 'tonto', 'Remédio de pressão dobrado, pressão 8 por 5, tontura: hipotensão. Amarelo, USB.'),
          lm(p, 'dois_comprimidos', 'intox_orient', 'Guardar a embalagem, não provocar vômito e observar a respiração (Manual p.13). Com tontura, deixar deitad' + p.o + '.', { kind: 'confirma' }), // campo A12 (BTox1). [validar] "deixar deitado" na hipotensão é primeiros socorros padrão
        ],
        radio: { ok: 'Central, {unit}. Hipotensão por remédio dobrado. Soro, melhorando. Seguimos pra UPA.' },
        diary: { alive: 'Esqueceu que já tinha tomado o remédio de pressão. Soro na UPA.' },
      }),
    },
    {
      id: 'diabetes_dobrada',
      weight: 1.2,
      build: (p) => ({
        // ⚖ RT5 (USA/USI: consciência alterada) × RC10 (USI/USB: hipoglicemia medida); sem USI no jogo, USB também é defensável. USA é a melhor: pode voltar por horas.
        truth: { dx: 'Hipoglicemia grave por remédio de diabetes em dobro', sev: 'vermelho', ok: ['USA', 'USB'], best: 'USA', dest: ['REG', 'UPA'], risk: { good: 50, bad: 120, needs: 'USB' } },
        note: `${p.tipo} tomou remédio de diabetes dobrado. Suando.`,
        noteWrong: 'Remédio dobrado, mas tá bem, {dr}.',
        amb: ['silencio'],
        q: {
          oque: 'Tomou o comprimido do diabetes duas vezes e não comeu nada.',
          consciencia: `{{Suando frio, confus${p.o}|suor}}.`,
          respira: 'Respira.',
          inicio: 'Tomou cedo. Faz umas quatro horas.',
          idade: `${p.anos}.`,
          ingestao: '{{Glibenclamida, dois em vez de um|glibenclamida}}. Faz umas quatro horas.',
          historico: 'Diabetes e pressão.',
        },
        extra: [ex('acucar', 'Mediu o açúcar?', 'Tem aparelho de glicemia? Mede agora.', 'Deu {{41|glicemia}} no aparelho.')],
        links: [
          lm(p, 'suor', 'hipoglicemia', 'Remédio de diabetes dobrado, suor frio e confusão: hipoglicemia grave. USA (Manual p.6).'),
          lk('glibenclamida', 'glicemia', 'Glibenclamida em dobro e glicemia 41: a hipoglicemia pode voltar por horas. USA.'), // [validar]
        ],
        radio: { ok: '{central}, {unit}. Hipoglicemia por glibenclamida. Glicose corrigida, mas vai precisar ficar internad' + p.o + '.' },
        diary: { alive: 'Remédio de diabetes dobrado. Hipoglicemia que voltava. Internad' + p.o + '.', dead: 'Remédio de diabetes dobrado.' },
      }),
    },
    {
      id: 'vitamina',
      weight: 2,
      build: (p) => ({
        truth: { dx: 'Vitamina tomada em dobro (sem risco)', sev: 'azul', ok: ['ORI'], ref: ['CASA', 'UBS'] },
        // cena da videochamada (onde a história acontece)
        cena: { place: 'cozinha' },
        note: `${p.tipo} tomou remédio dobrado. Parece bem.`,
        noteWrong: 'Remédio dobrado! Intoxicação, {dr}!',
        amb: ['cozinha'],
        q: {
          oque: 'Tomou duas vezes um comprimido que eu não sei qual é!',
          consciencia: `Acordad${p.o}, ótim${p.o}, rindo de mim.`,
          respira: 'Normal.',
          inicio: 'Agora, faz meia hora.',
          idade: `${p.anos}.`,
          ingestao: 'Peraí, achei a cartela... {{é a vitamina D|vitamina}}. Tomou duas.',
          historico: 'Pressão. Mas o da pressão fica separado na caixinha.',
          paciente: [`${p.PT}: Eu tô ótim${p.o}! Esse povo exagera.`],
        },
        extra: [ex('caixa', 'Confere a caixinha de remédios', 'Confere a caixinha de remédios do dia: o resto está no lugar?', '{{O da pressão tá aqui intacto|intacto}}. Só a vitamina que foi dobrada.')],
        links: [lk('vitamina', 'intacto', 'Só a vitamina foi dobrada; o remédio de pressão está intacto: sem risco. Orientação.')],
        radio: { excess: '{central}, {unit}. Vitamina D dobrada, {dr}. Tá ótim' + p.o + '.' },
        diary: { ori: 'Vitamina dobrada. Nenhum risco.' },
      }),
    },
    {
      id: 'calmante',
      weight: 1.2,
      build: (p) => ({
        // [validar] RT5: sonolência recente por sedativo + álcool pode contar como "alteração súbita da consciência" (USA/USI). Ficou amarelo/USB, com piora para USA.
        truth: { dx: 'Sonolência por calmante em dobro com álcool', sev: 'amarelo', ok: ['USB'], dest: ['UPA'] },
        note: `${p.tipo} tomou calmante dobrado. Sonolent${p.o}.`,
        noteWrong: 'Tá só dormindo, {dr}.',
        amb: ['silencio'],
        q: {
          oque: `Tomou o calmante duas vezes. Agora ${p.ele} tá {{dormindo pesado|sonolento}}.`,
          consciencia: '{{Acorda quando eu chamo alto, mas volta a dormir|acorda_chamando}}.',
          respira: '{{Respira normal, devagarinho|respira_ok}}.',
          inicio: 'Tomou faz uma hora.',
          idade: `${p.anos}.`,
          ingestao: '{{Dois comprimidos de clonazepam|clonazepam}}... e tomou com um copo de cerveja.',
          historico: 'Ansiedade, pressão.',
        },
        links: [
          lk('clonazepam', 'acorda_chamando', 'Calmante dobrado com álcool, acorda quando chama, respira normal: amarelo, USB, de olho na respiração.'),
          lm(p, 'clonazepam', 'intox_orient', 'Orientar: não provocar vômito, deixar de lado, observar a respiração e guardar a cartela (Manual p.13).', { kind: 'confirma' }), // campo A12 (BTox1): sem trauma, posição de recuperação; nada pela boca
        ],
        worsen: [
          {
            after: 100,
            lines: [`{Dr}, agora ${p.ele} {{tá roncando e não acorda mais|nao_acorda}}!`],
            resetRisk: true,
            truth: { sev: 'vermelho', ok: ['USA'], dx: 'Rebaixamento por calmante e álcool', dest: ['REG'], risk: { good: 45, bad: 110 } },
          },
        ],
        radio: { ok: 'Central, {unit}. Sonolência por benzodiazepínico e álcool. Respira bem. Seguimos pra UPA.' },
        diary: { alive: 'Calmante dobrado com cerveja. Dormiu na UPA, acordou envergonhad' + p.o + '.' },
      }),
    },
  ],
});

export const IDOSO = [DESMAIO_IGREJA, IDOSO_SOZINHO, QUEDA_IDOSO, FEBRE_IDOSO, REMEDIOS_IDOSO];
