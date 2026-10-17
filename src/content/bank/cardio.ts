// =============================================================================
// Banco — cardiovascular: dor no peito, coração disparado, pressão alta.
// Instruções clínicas marcadas com [validar].
// =============================================================================
import { tpl, lk, lm, must, ex, guideIf, alt } from './kit';

// -----------------------------------------------------------------------------
// "Tô com uma dor no peito." (protocolo de dor torácica: dia 3)
// -----------------------------------------------------------------------------
export const DOR_PEITO = tpl({
  id: 'dor_peito',
  tags: ['cardio', 'grave'],
  minDay: 3,
  age: [28, 78],
  rel: ['proprio'],
  cena: { place: 'sala' },
  open: () => ['{Dr}, eu tô com uma {{dor no peito|dor_peito}}... não sei se é coisa da minha cabeça, mas tá doendo.'],
  truths: [
    {
      id: 'infarto',
      weight: 3,
      build: (p0) => {
        const p = p0.at(45, 78);
        return {
          who: p,
          truth: { dx: 'Infarto agudo do miocárdio', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 60, bad: 150 } },
          note: `${p.tipo} com dor no peito. Voz ofegante, {dr}.`,
          noteWrong: 'Dor no peito, mas parece ansiedade, {dr}.',
          type: 'minimizador',
          amb: ['tv', 'respiracao'],
          noise: ['[respiração curta; a TV ligada]'],
          q: {
            oque: `Começou sentad${p.o}, vendo televisão. {{Um aperto, um peso|aperto}}. Não passa.`,
            inicio: '{{Faz uns quarenta minutos|quarenta}}. Achei que ia passar.',
            dorpeito: ['{{Vai pro braço esquerdo e pro queixo|irradia}}.', '{{Tô suando frio, a camisa molhada|suor_frio}}.'],
            respira: 'Respiro, mas meio curto.',
            consciencia: `Acordad${p.o}. Com medo.`,
            idade: `${p.anos}.`,
            historico: 'Pressão alta, colesterol. Fumo um maço por dia.',
            paciente: 'Sou eu mesm' + p.o + ', {dr}. Desculpa incomodar.',
          },
          links: [
            lm(p, 'irradia', 'peito', 'Mais de 40 anos, dor que vai para o braço e o queixo, suor frio: provável infarto. USA (Manual p.3).'),
            lk('aperto', 'suor_frio', 'Aperto em repouso com suor frio: não é dor muscular.', { kind: 'confirma' }),
          ],
          radio: { ok: '{central}, {unit}. Infarto com supra no eletro. Chegamos a tempo. Seguimos pro Regional.' },
          diary: { alive: 'Dor no peito vendo TV. Infarto. Desentupiram a tempo.', dead: 'Infarto em casa. Ligou depois de quarenta minutos.' },
        };
      },
    },
    {
      id: 'muscular',
      weight: 2,
      build: (p0) => {
        const p = p0.at(25, 42);
        return {
          who: p,
          truth: { dx: 'Dor muscular na parede do peito (após esforço)', sev: 'verde', ok: ['ORI'], ref: ['UBS'] },
          note: `${p.tipo} com dor no peito depois de esforço.`,
          noteWrong: 'Dor no peito! Infarto, {dr}!',
          type: 'exagerador',
          amb: ['rua'],
          q: {
            oque: `Ontem ${alt(p, ['carreguei um guarda-roupa na mudança', 'fiz supino pesado na academia', 'carreguei saco de cimento a tarde toda'])}. Hoje acordei com essa dor.`,
            inicio: 'Desde que acordei.',
            dorpeito: '{{Não vai pra lugar nenhum|nao_irradia}}. Suor não. É uma dor leve, mais incômoda. {{Dói quando eu aperto aqui do lado e quando viro o corpo|aperta}}.',
            respira: 'Respiro bem, sem falta de ar.', // RC17: "dói ao puxar fundo" seria dor pleurítica (USB)
            consciencia: 'Normal, normal.',
            idade: `${p.anos}.`,
            historico: 'Nada. Saudável. Não fumo.',
          },
          links: [
            lm(p, 'aperta', 'muscular', 'Dor que piora ao apertar o local e ao virar, depois de esforço, em jovem sem fator de risco: muscular. Orientação (Manual p.3).'),
            lk('nao_irradia', 'aperta', 'Sem irradiação, sem suor, piora ao apertar: parede do peito, não coração.', { kind: 'confirma' }),
          ],
          radio: { excess: '{central}, {unit}. Dor muscular, {dr}. Carregou peso ontem. Eletro normal.' },
          diary: { ori: 'Dor no peito depois de carregar peso. Muscular. Orientad' + p.o + '.' },
        };
      },
    },
    {
      id: 'ansiedade',
      weight: 1.5,
      build: (p0) => {
        const p = p0.at(20, 40);
        return {
          who: p,
          truth: { dx: 'Crise de ansiedade (dor em pontada, hiperventilação)', sev: 'verde', ok: ['ORI'], ref: ['UBS', 'CASA'] },
          note: `${p.tipo} com dor no peito e falta de ar. Nervos${p.o}.`,
          noteWrong: 'Dor no peito. Pode ser infarto, {dr}!',
          amb: ['respiracao', 'choro'],
          noise: ['[respiração rápida, choro baixinho]'],
          q: {
            oque: `${alt(p, [`Fui demitid${p.o} hoje`, 'Briguei feio em casa', 'Amanhã é a prova do concurso'])}... e começou essa pontada, o coração disparou.`,
            inicio: 'Faz uns vinte minutos.',
            dorpeito: 'Não vai pro braço. É uma pontada que vai e volta. Suor frio não, mas tô tremendo.',
            respira: '{{Rápido, rápido, não consigo parar|rapido}}.',
            consciencia: `Acordad${p.o}.`,
            idade: `${p.anos}.`,
            historico: 'Nada. Já tive crise de ansiedade antes.',
          },
          extra: [ex('formiga', 'Formigamento?', 'Sente formigamento na boca ou nas mãos?', '{{A boca tá formigando, as mãos também|formigando}}!')],
          links: [
            lm(p, 'formigando', 'ansiedade', 'Formigamento na boca e nas mãos, respiração rápida, fala frases inteiras: crise de ansiedade. Respiração guiada (Manual p.5-B).'),
            lk('rapido', 'formigando', 'Respirar rápido demais causa formigamento: hiperventilação.', { kind: 'confirma' }),
          ],
          guide: guideIf(p.F, 'respiracao', true),
          radio: { excess: '{central}, {unit}. Crise de ansiedade, {dr}. Eletro normal. Respiramos junto e passou.' },
          diary: { ori: 'Dor no peito de ansiedade. Respiramos juntos até passar.' },
        };
      },
    },
    {
      id: 'atipico',
      weight: 1.2,
      build: (p0) => {
        const p = p0.at(55, 78);
        return {
          who: p,
          truth: { dx: 'Infarto sem dor típica (diabético)', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 60, bad: 150 } },
          // cena da videochamada (onde a história acontece)
          cena: { place: 'cozinha' },
          note: `${p.tipo} com "azia" e mal-estar.`,
          noteWrong: 'Azia. Acho que é estômago, {dr}.',
          type: 'minimizador',
          amb: ['cozinha'],
          q: {
            oque: 'Não é bem dor... é {{uma azia, um peso aqui na boca do estômago|azia}}. E um enjoo.',
            inicio: 'Desde cedo, foi piorando. Umas duas horas.',
            dorpeito: 'Pro braço não vai. {{Tô suando frio, isso sim|suor_frio}}.',
            respira: 'Meio curta.',
            consciencia: `Acordad${p.o}.`,
            idade: `${p.anos}.`,
            historico: '{{Diabetes|diabetes}}, pressão alta. Tomo os remédios.',
          },
          extra: [ex('cansaco', 'Anda cansado(a)?', 'Tem sentido cansaço fora do normal?', '{{Uma canseira essa semana, não consigo nem varrer a casa|cansaco}}.')],
          links: [
            lm(p, 'azia', 'atipico', 'Diabético com "azia", enjoo, suor frio e cansaço: infarto sem dor clássica. USA (Manual p.3).'),
            lk('diabetes', 'suor_frio', 'Diabéticos infartam sem dor típica: o suor frio é o aviso.'),
          ],
          radio: { ok: '{central}, {unit}. Infarto inferior, {dr}. "Azia" com supra no eletro. Seguimos pro Regional.' },
          diary: { alive: 'A "azia" era infarto. Chegou a tempo.', dead: 'A "azia" era infarto.' },
        };
      },
    },
    {
      id: 'disseccao',
      weight: 0.6,
      build: (p0) => {
        const p = p0.at(55, 78);
        return {
          who: p,
          truth: { dx: 'Suspeita de dissecção de aorta', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 60, bad: 150 } },
          note: `${p.tipo} com dor no peito muito forte.`,
          noteWrong: 'Dor nas costas, parece coluna, {dr}.',
          amb: ['silencio'],
          q: {
            oque: 'Foi {{de uma vez, como uma facada que rasgou|rasgou}}. Começou no peito e {{foi pras costas|costas}}.',
            inicio: 'Faz meia hora. Foi na hora, de uma vez.',
            dorpeito: 'Vai pras costas, entre as escápulas. Suando, sim.',
            respira: 'Respiro... curto, de dor.',
            consciencia: `Acordad${p.o}. Dói demais, {dr}.`,
            idade: `${p.anos}.`,
            historico: '{{Pressão muito alta, nunca controlei|pressao}}.',
          },
          extra: [ex('braco', 'Diferença entre os braços?', 'Sente alguma diferença entre um braço e o outro?', '{{O braço esquerdo tá frio, formigando|braco_frio}}.')],
          links: [
            lk('rasgou', 'costas', `Dor súbita "rasgando" do peito para as costas em ${p.g('hipertenso', 'hipertensa')}: suspeita de dissecção de aorta. Vermelho, USA.`), // RC17: dor intensa = USA; RC13 (nota): dor irradiada para o dorso pode indicar dissecção de aorta
            lk('braco_frio', 'pressao', `Braço frio de um lado em ${p.g('hipertenso', 'hipertensa')} com dor rasgando: reforça a suspeita de dissecção.`, { kind: 'confirma' }),
          ],
          radio: { ok: '{central}, {unit}. Suspeita de dissecção de aorta. Pressão controlada, cirurgião avisado. Seguimos pro Regional.' },
          diary: { alive: 'Dor rasgando do peito às costas. Dissecção de aorta. Operou.', dead: 'Dissecção de aorta.' },
        };
      },
    },
  ],
});

// -----------------------------------------------------------------------------
// "Meu coração tá disparado."
// -----------------------------------------------------------------------------
export const CORACAO_DISPARADO = tpl({
  id: 'coracao_disparado',
  tags: ['cardio', 'leve'],
  age: [18, 64],
  rel: ['proprio'],
  cena: { place: 'sala' },
  open: () => ['{Dr}, {{meu coração tá disparado|disparado}}. Tá batendo na garganta. Eu tô com medo.'],
  truths: [
    {
      id: 'ansiedade',
      weight: 3,
      build: (p0) => {
        const p = p0.at(18, 45);
        return {
          who: p,
          // ⚖ RC22: "palpitação atual" é USB; orientação quando fala frases inteiras, sem dor, sem desmaio e sem história cardíaca. [validar] "pulso anormal" (>100) é USA no RC22, mas só "se medido" pela equipe.
          truth: { dx: 'Crise de ansiedade (taquicardia sinusal)', sev: 'verde', ok: ['ORI', 'USB'], best: 'ORI', ref: ['UBS', 'CASA'], dest: ['UPA'], must: must(p, 'consciencia', 'respira', 'dorpeito') },
          note: `${p.tipo} com o coração disparado. Muito nervos${p.o}.`,
          noteWrong: 'Coração disparado! Arritmia, {dr}!',
          amb: ['respiracao'],
          noise: ['[respiração rápida, curta]'],
          q: {
            oque: `${alt(p, ['Recebi uma mensagem do banco cobrando', 'Tive um pesadelo e acordei assim', 'Tô sozinh' + p.o + ' em casa e começou do nada'])}... e o coração disparou.`,
            inicio: 'Faz uns quinze minutos. Começou aos pouquinhos e foi aumentando.',
            respira: 'Rápido. Mas falo, tá vendo? Falo tudo.',
            dorpeito: 'Uma pontadinha. Não vai pro braço. Suor frio não.',
            consciencia: `Acordad${p.o}, andando pela casa.`,
            idade: `${p.anos}.`,
            historico: '{{Já tive crise de pânico|panico}}. Fiz exame do coração ano passado, normal.',
          },
          extra: [
            ex('formiga', 'Formigamento?', 'Sente formigamento na boca ou nas mãos?', '{{As mãos e a boca formigando|formigando}}.'),
            ex('contar_pulso', 'Contar o pulso', 'Põe dois dedos no pulso e conta as batidas por 15 segundos.', '...vinte e sete, vinte e oito. {{Deu 28|pulso_110}}.'),
          ],
          links: [
            lm(p, 'formigando', 'ansiedade', 'Formigamento, respiração rápida, fala frases inteiras: crise de ansiedade. Respiração guiada (Manual p.5-B).'),
            lk('pulso_110', 'panico', 'Pulso de 112, que subiu aos poucos, em quem já teve pânico e exame normal: coração acelerado pela crise.'),
          ],
          guide: guideIf(p.F, 'respiracao', true),
          radio: { excess: '{central}, {unit}. Taquicardia sinusal de ansiedade, {dr}. Eletro normal.' },
          diary: { ori: 'Coração disparado de ansiedade. Respiramos juntos.' },
        };
      },
    },
    {
      id: 'tsv',
      weight: 1.5,
      build: (p0) => {
        const p = p0.at(20, 60);
        return {
          who: p,
          // [validar] RC22: pulso anormal medido (>100) é USA; aqui o pulso é contado pelo leigo, então ficou amarelo/USB (UPA reverte).
          truth: { dx: 'Taquicardia supraventricular', sev: 'amarelo', ok: ['USB'], dest: ['UPA'] },
          note: `${p.tipo} com o coração disparado de repente.`,
          noteWrong: 'Coração disparado, deve ser nervoso, {dr}.',
          amb: ['silencio'],
          q: {
            oque: 'Foi {{de repente, de um segundo pro outro, como se ligasse uma chave|chave}}.',
            inicio: 'Faz uns quarenta minutos. Não desliga.',
            respira: 'Meio curta.',
            dorpeito: 'Um aperto leve. Não vai pro braço.',
            consciencia: `Acordad${p.o}, meio zonz${p.o}.`,
            idade: `${p.anos}.`,
            historico: '{{Já aconteceu duas vezes|ja_aconteceu}}. No hospital apertaram meu pescoço e me deram uma injeção.',
          },
          extra: [ex('contar_pulso', 'Contar o pulso', 'Põe dois dedos no pulso e conta as batidas por 15 segundos.', '...nem consigo contar direito, é muito rápido. {{Uns 48|pulso_rapido}}.')],
          links: [
            lk('chave', 'pulso_rapido', 'Começo súbito "como uma chave", quase 200 por minuto: taquicardia supraventricular. Amarelo, USB.'),
            lk('ja_aconteceu', 'chave', 'Já aconteceu antes e reverteu no hospital: mesmo quadro.', { kind: 'confirma' }),
          ],
          radio: { ok: 'Central, {unit}. Taquicardia supraventricular, 190. Estável. Levamos pra UPA reverter.' },
          diary: { alive: 'Coração a 190 "como uma chave". Reverteu na UPA.' },
        };
      },
    },
    {
      id: 'energetico',
      weight: 1.2,
      build: (p0) => {
        const p = p0.at(18, 30);
        return {
          who: p,
          truth: { dx: 'Taquicardia por energéticos e remédio para emagrecer', sev: 'verde', ok: ['ORI', 'USB'], best: 'ORI', ref: ['UPA'], dest: ['UPA'], must: must(p, 'dorpeito', 'tomou') },
          note: `${p.tipo} com o coração disparado. Parece cansad${p.o}.`,
          noteWrong: 'Coração disparado! Pode ser infarto, {dr}!',
          amb: ['silencio', 'ventilador'],
          q: {
            oque: 'Tô estudando pra prova, não durmo faz duas noites... e agora o coração não para.',
            inicio: 'Faz uma hora, mais ou menos.',
            respira: 'Normal.',
            dorpeito: 'Dor não. Só o coração batendo forte.',
            consciencia: `Acordad${p.o}. Acordad${p.o} até demais.`,
            idade: `${p.anos}.`,
            historico: 'Nada. Saudável.',
            ingestao: `Tomei umas coisas pra aguentar ficar acordad${p.o}, sim.`,
          },
          extra: [
            ex('tomou', 'Tomou alguma coisa?', 'Você tomou alguma coisa? Energético, remédio, droga?', '{{Quatro latas de energético|energetico}}... e {{um remédio pra emagrecer que a minha prima me deu|emagrecer}}.'),
            ex('contar_pulso', 'Contar o pulso', 'Põe dois dedos no pulso e conta por 15 segundos.', 'Deu 30.'),
          ],
          links: [lk('energetico', 'emagrecer', 'Energéticos e remédio para emagrecer, sem dormir: o coração acelerado tem causa. Sem dor no peito: UPA por meios próprios e nada de cafeína.')], // [validar]
          radio: { ok: 'Central, {unit}. Taquicardia por estimulante, estável. Levamos pra UPA.', excess: '{central}, {unit}. Energético e remédio de emagrecer, {dr}. Estável.' },
          diary: { ori: 'Quatro energéticos e remédio para emagrecer. Orientad' + p.o + ' a ir à UPA.', alive: 'Coração acelerado por estimulante. UPA.' },
        };
      },
    },
    {
      id: 'hipo_leve',
      weight: 1,
      minDay: 6,
      build: (p0) => {
        const p = p0.at(30, 64);
        return {
          who: p,
          truth: { dx: 'Hipoglicemia leve (acordado, consegue engolir)', sev: 'verde', ok: ['ORI'], ref: ['UBS', 'CASA'] },
          // cena da videochamada (onde a história acontece)
          cena: { place: 'cozinha' },
          note: `${p.tipo} com o coração disparado e suando.`,
          noteWrong: 'Coração disparado. Arritmia, {dr}!',
          amb: ['cozinha'],
          q: {
            oque: 'Tô tremendo, {{suando frio|suor}}, o coração disparado...',
            inicio: 'Uns dez minutos.',
            respira: 'Normal.',
            dorpeito: 'Dor no peito não.',
            consciencia: `Acordad${p.o}, lúcid${p.o}. Só tremendo.`,
            idade: `${p.anos}.`,
            historico: '{{Diabétic' + p.o + ', tomo insulina|insulina}}.',
          },
          extra: [
            ex('acucar', 'Mediu a glicemia?', 'Você tem aparelho de glicemia? Mede agora.', '{{Deu 58|glicemia}}.'),
            ex('suco', 'Orientar o açúcar', 'Orientar o açúcar', ['Tomei... [goles]', '[quinze minutos depois]', 'Deu 104, {dr}! O coração tá desacelerando.'], { kind: 'fala', say: 'Você está acordado e engolindo bem: toma meio copo de suco ou um copo de água com uma colher de sopa de açúcar agora. Daqui a 15 minutos mede de novo.' }), // [validar] regra dos 15 minutos
          ],
          links: [
            lm(p, 'glicemia', 'hipoglicemia', `${p.g('Diabético acordado', 'Diabética acordada')}, que engole, glicemia 58: hipoglicemia leve. Açúcar agora e medir de novo em 15 minutos (Manual p.6).`),
            lk('insulina', 'suor', 'Insulina + suor frio + tremor: hipoglicemia.', { kind: 'confirma' }),
          ],
          radio: { excess: '{central}, {unit}. Hipoglicemia leve, já corrigida com suco, {dr}. Glicemia 110.' },
          diary: { ori: 'Hipoglicemia leve. Corrigiu com suco pelo telefone.' },
        };
      },
    },
  ],
});

// -----------------------------------------------------------------------------
// "Minha mãe mediu a pressão e deu 20 por 12!"
// -----------------------------------------------------------------------------
export const PRESSAO_ALTA = tpl({
  id: 'pressao_alta',
  tags: ['cardio', 'idoso', 'leve', 'grave'],
  age: [58, 88],
  rel: ['filho', 'neto', 'esposa', 'marido'],
  cena: { place: 'sala' },
  open: (p) => [`${p.Quem} mediu a pressão e {{deu 20 por 12|pa}}, {dr}! Isso é muito alto, não é?`],
  truths: [
    {
      id: 'urgencia',
      weight: 3,
      build: (p) => ({
        truth: { dx: 'Pressão alta sem sinais de gravidade', sev: 'verde', ok: ['ORI', 'USB'], best: 'ORI', ref: ['UBS', 'UPA'], dest: ['UPA'], must: must(p, 'fast', 'dorpeito', 'visao') },
        note: `${p.tipo} com pressão alta. Sem sintoma, parece.`,
        noteWrong: 'Pressão 20 por 12! Vai ter um derrame, {dr}!',
        amb: ['tv'],
        q: {
          oque: `Mediu porque a vizinha tem aparelho. ${p.Ele} tá bem, vendo novela.`,
          inicio: 'Mediu agora. Dor de cabeça não tem.',
          consciencia: `Acordad${p.o}, normal.`,
          respira: 'Normal, sem falta de ar.',
          dorpeito: 'Dor no peito? Não, nada.',
          fast: 'Sorriu, levantou os dois braços, falou "o céu é azul". Tudo certo.',
          idade: `${p.anos}.`,
          historico: 'Pressão alta. {{Acabou o remédio faz uns dias|acabou}}, o posto tá sem.',
        },
        extra: [ex('visao', 'Visão? Fraqueza? Falta de ar?', `${p.Ele} está enxergando bem? Alguma fraqueza, confusão, falta de ar?`, 'Enxerga bem, lê o jornal. Fraqueza não.')],
        links: [
          lk('pa', 'acabou', 'Pressão alta porque o remédio acabou, sem sintoma de gravidade: retomar o remédio pela UBS/UPA.'),
          lm(p, 'acabou', 'verde', 'Sem sinais de gravidade: verde (Manual p.1).'),
        ],
        radio: { ok: 'Central, {unit}. Pressão 20 por 12, assintomático. Levamos pra UPA ajustar.', excess: '{central}, {unit}. Pressão alta sem sintoma, {dr}. Faltou o remédio do posto.' },
        diary: { ori: 'Pressão alta porque o remédio acabou. Orientados a Farmácia Popular e a UBS.' },
      }),
    },
    {
      id: 'avc',
      weight: 1.2,
      minDay: 6,
      build: (p) => ({
        // ⚖ RC1: acordado, só com sinais do FAST, na janela = USI/USB (USA só com Glasgow <9, convulsão ou suporte ventilatório); o jogo prefere USA (tempo até a trombólise).
        truth: { dx: 'AVC na janela (pressão alta)', sev: 'vermelho', ok: ['USA', 'USB'], best: 'USA', must: must(p, 'inicio', 'fast'), dest: ['REG'], risk: { good: 60, bad: 140, needs: 'USB' } },
        note: `${p.tipo} com pressão alta e meio estranh${p.o}.`,
        noteWrong: 'Só pressão alta, {dr}. Tranquilo.',
        amb: ['tv'],
        q: {
          oque: `Mediu porque ${p.ele} ficou {{estranh${p.o}, a mão fraca|mao_fraca}}.`,
          inicio: '{{Faz meia hora|meia_hora}}. Antes tava normal.',
          consciencia: `Acordad${p.o}, mas meio devagar.`,
          respira: 'Normal.',
          dorpeito: 'Dor no peito não.',
          fast: ['{{A boca entortou|boca}} quando sorriu.', 'O braço esquerdo cai.', '"O céu é azul"... saiu enrolado.'],
          idade: `${p.anos}.`,
          historico: 'Pressão alta. Toma o remédio, acho.',
        },
        extra: [ex('visao', 'Visão? Fraqueza?', `${p.Ele} está enxergando bem? Alguma fraqueza?`, 'Disse que tá vendo embaçado de um lado. E a mão esquerda não segura a xícara.')],
        links: [
          lk('boca', 'mao_fraca', 'Pressão alta com boca torta e mão fraca: não é só pressão, é AVC.'),
          lm(p, 'meia_hora', 'janela', 'Meia hora: dentro da janela. USA → Regional (Manual p.6).'),
        ],
        guide: guideIf(!p.F, 'avc'),
        radio: { ok: '{central}, {unit}. AVC na janela, pressão 21 por 12. Seguimos pro Regional.' },
        diary: { alive: 'Pressão alta e mão fraca. Era AVC. Chegou na janela.', dead: 'AVC com pressão alta.' },
      }),
    },
    {
      id: 'edema_pulmao',
      weight: 1.2,
      build: (p) => ({
        truth: { dx: 'Edema agudo de pulmão (insuficiência cardíaca)', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 50, bad: 120 } },
        // cena da videochamada (onde a história acontece)
        cena: { place: 'quarto' },
        note: `${p.tipo} com pressão alta e falta de ar.`,
        noteWrong: 'Pressão alta, só isso. Sem pressa, {dr}.',
        amb: ['respiracao'],
        noise: ['[uma respiração borbulhante, molhada]'],
        q: {
          oque: 'Mediu porque {{não consegue respirar deitad' + p.o + '|nao_deita}}.',
          inicio: 'Piorou de uma hora pra cá.',
          consciencia: `Acordad${p.o}, assustad${p.o}.`,
          respira: '{{Rápido, chiando molhado, sentad' + p.o + ' na beira da cama|sentado}}. Só consegue falar uma palavra de cada vez.', // RC12: frases entrecortadas = USA
          dorpeito: 'Um aperto. Mais é a falta de ar.',
          idade: `${p.anos}.`,
          historico: '{{Coração grande|coracao}}. Toma remédio de urinar.',
        },
        extra: [ex('tosse', 'Tosse? Catarro?', `${p.Ele} está tossindo? Como é o catarro?`, '{{Tosse com uma espuma cor-de-rosa|espuma}}!')],
        links: [
          lk('nao_deita', 'espuma', 'Falta de ar que piora deitado e espuma rosada com pressão alta: edema agudo de pulmão. Vermelho, USA.'), // RC12: frases entrecortadas = USA
          lk('coracao', 'sentado', 'Coração grande e falta de ar sentado: o coração está falhando.', { kind: 'confirma' }),
        ],
        radio: { ok: '{central}, {unit}. Edema agudo de pulmão. Sentamos, oxigênio, medicação. Seguimos pro Regional.' },
        diary: { alive: 'Pressão alta e falta de ar: edema de pulmão. Respirou de novo na ambulância.', dead: 'Edema agudo de pulmão.' },
      }),
    },
    {
      id: 'aparelho',
      weight: 1.2,
      build: (p) => ({
        truth: { dx: 'Medida pouco confiável (aparelho de pulso), sem sintomas', sev: 'azul', ok: ['ORI'], ref: ['UBS'] },
        note: `Família assustada com a pressão. ${p.tipo} sem sintoma nenhum.`,
        noteWrong: 'Pressão 20 por 12! Grave, {dr}!',
        amb: ['tv', 'radio_am'],
        q: {
          oque: `${p.Ele} tá bem, fazendo crochê... mas a pressão deu 20 por 12!`,
          inicio: 'Mediu agora.',
          consciencia: `Acordad${p.o}, rindo da minha cara.`,
          respira: 'Normal.',
          dorpeito: 'Nada.',
          fast: 'Sorriu, levantou os braços, repetiu. Tá ótim' + p.o + '.',
          idade: `${p.anos}.`,
          historico: 'Pressão alta, toma o remédio certinho.',
        },
        extra: [
          ex('medidas', 'Quantas vezes mediu?', 'Quantas vezes mediu? Quanto deu cada vez?', '{{Mediu seis vezes|seis_vezes}}: 20 por 12, 13 por 8, 16 por 9... {{cada vez dá um número|numeros}}.'),
          ex('aparelho', 'Que aparelho é?', 'Que aparelho é esse?', '{{É aquele de pulso, comprei na feira|pulso}}.'),
        ],
        links: [
          lk('numeros', 'pulso', 'Aparelho de pulso da feira, cada medida um número, sem sintoma nenhum: medida pouco confiável. Orientar UBS.'),
          lk('seis_vezes', 'pa', 'Seis medidas diferentes: a de 20 por 12 é a exceção.', { kind: 'confirma' }),
        ],
        radio: { excess: '{central}, {unit}. Pressão 13 por 8 no nosso aparelho, {dr}. O de pulso da feira tava louco.' },
        diary: { ori: 'Pressão "20 por 12" num aparelho de feira. Estava 13 por 8.' },
      }),
    },
  ],
});

export const CARDIO = [DOR_PEITO, CORACAO_DISPARADO, PRESSAO_ALTA];
