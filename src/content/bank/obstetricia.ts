// =============================================================================
// Banco — obstetrícia (protocolo do dia 7): dor na gravidez, sangramento na
// gravidez. Destino: Maternidade só acima de 20 semanas (Manual p.9-A).
// Instruções clínicas marcadas com [validar].
// =============================================================================
import { tpl, lk, lm, must, ex } from './kit';

// -----------------------------------------------------------------------------
// "Minha esposa tá grávida e tá com muita dor na barriga!"
// -----------------------------------------------------------------------------
export const GRAVIDA_DOR = tpl({
  id: 'gravida_dor',
  tags: ['obstetricia', 'leve', 'grave'],
  minDay: 7,
  age: [19, 40],
  sex: 'F',
  rel: ['marido', 'mae', 'marido'],
  cena: { place: 'sala' },
  open: (p) => [`${p.Quem} tá grávida e tá com {{muita dor na barriga|dor}}, {dr}!`],
  truths: [
    {
      id: 'inicio_parto',
      weight: 3,
      build: (p) => ({
        truth: { dx: 'Início de trabalho de parto', sev: 'verde', ok: ['ORI'], ref: ['MAT'] },
        note: `Gestante com contrações. ${p.cg('Marido', 'Mãe')} nervos${p.co}.`,
        noteWrong: 'Parto acontecendo! Corre, {dr}!',
        amb: ['tv'],
        q: {
          oque: 'As dores tão vindo e indo. Ela tá andando pela sala.',
          consciencia: 'Acordada, conversando entre uma dor e outra.',
          respira: 'Normal. Respira fundo na dor.',
          inicio: 'Começou de madrugada, fraquinho. Agora tá mais forte.',
          idade: `${p.anos}.`,
          historico: 'Pré-natal certinho, tudo normal.',
          gestacao: ['{{39 semanas|semanas_39}}. Primeiro filho.', '{{A bolsa não estourou|bolsa_integra}}. Sangramento não, só um pouquinho de muco.', 'Dor de cabeça não, convulsão não.'],
          paciente: [`${p.PT}: Ai... dói, mas dá pra aguentar. É normal, né?`],
        },
        extra: [ex('intervalo', 'Intervalo das contrações?', 'De quanto em quanto tempo vêm as contrações? Quanto duram?', '{{De dez em dez minutos, mais ou menos|dez_min}}. Duram uns trinta segundos.')],
        links: [
          lm(p, 'dez_min', 'inicio_parto', 'Contrações espaçadas e bolsa íntegra: início de trabalho de parto. Ir à Maternidade por meios próprios (Manual p.7).'),
          lk('bolsa_integra', 'semanas_39', '39 semanas, bolsa inteira, sem sangramento: o parto ainda vai demorar.', { kind: 'confirma' }),
        ],
        radio: { excess: '{central}, {unit}. Trabalho de parto inicial, {dr}. Dava pra ir de carro. O marido esqueceu a mala.' },
        diary: { ori: 'Início de trabalho de parto. Foi de carro para a Maternidade. Nasceu à noite.' },
      }),
    },
    {
      id: 'expulsivo',
      weight: 1.5,
      build: (p) => ({
        // ⚖ RO2: parto domiciliar ou iminente = USI/USB ("enquanto aguarda o suporte avançado"); multípara com contrações grudadas pode passar de 7 no escore de Malinas (USA). Cabeça coroando não é "parte fetal" anormal.
        truth: { dx: 'Trabalho de parto em período expulsivo', sev: 'amarelo', ok: ['USB', 'USA'], best: 'USB', dest: ['MAT'] },
        note: 'Gestante em trabalho de parto. Dores seguidas.',
        noteWrong: 'Contração leve, começo de parto. Tranquilo, {dr}.',
        amb: ['gemidos'],
        noise: ['[gemidos ritmados]'],
        q: {
          oque: 'A bolsa estourou faz meia hora, agora as dores tão grudadas uma na outra! {{Ela diz que quer fazer força|forca}}!',
          consciencia: 'Acordada, gritando.',
          respira: 'Ofegante.',
          inicio: 'A bolsa estourou faz meia hora.',
          idade: `${p.anos}.`,
          historico: 'Pré-natal todinho, normal.',
          gestacao: ['39 semanas.', 'Segundo filho. {{O primeiro nasceu rapidinho|rapido}}.'],
          sangramento: 'Um pouquinho.',
        },
        extra: [ex('cabeca', 'Dá pra ver a cabeça?', 'Dá pra ver a cabeça do bebê?', 'Tô vendo... {{cabelinho|cabelinho}}!')],
        links: [
          lm(p, 'cabelinho', 'expulsivo', 'Cabeça visível e vontade de fazer força: período expulsivo. USB + orientação de parto → Maternidade (Manual p.7).'),
          lm(p, 'forca', 'expulsivo', 'Vontade de fazer força com bolsa rota: período expulsivo (Manual p.7).'),
        ],
        guide: { id: 'parto' },
        worsen: [{ after: 120, lines: ['{Dr}! Nasceu! Nasceu aqui no chão da sala! Tá roxinho!'], guide: 'parto' }],
        radio: { ok: 'Central, {unit}. Recém-nascido chorando forte, mãe bem. Seguimos pra Maternidade.' },
        diary: { alive: 'Parto em casa, guiado pelo telefone. Chorou forte.' },
      }),
    },
    {
      id: 'eclampsia',
      weight: 1,
      build: (p) => ({
        // ⚖ [validar] RO2: "pressão arterial elevada" é USI/USB e só "DHEG severa" (convulsão ou história de convulsão) é USA. Sem convulsão ainda, USB defensável; USA é a melhor (sulfato de magnésio); a piora para convulsão fecha em USA.
        truth: { dx: 'Pré-eclâmpsia grave', sev: 'vermelho', ok: ['USA', 'USB'], best: 'USA', dest: ['MAT'], risk: { good: 50, bad: 120, needs: 'USB' } },
        note: 'Gestante com dor e dor de cabeça forte.',
        noteWrong: 'Contração de parto, começo. Tranquilo.',
        amb: ['silencio'],
        q: {
          oque: 'A dor é aqui em cima, na boca do estômago. E {{uma dor de cabeça forte|cabeca}}.',
          consciencia: 'Acordada, mas meio esquisita.',
          respira: 'Normal.',
          inicio: 'Desde cedo. Piorou.',
          idade: `${p.anos}.`,
          historico: 'A pressão tava subindo nas últimas consultas.',
          gestacao: ['{{34 semanas|semanas_34}}.', 'Sangramento não. Ela disse que {{tá vendo uns pontinhos brilhando|brilho}}.'],
        },
        extra: [
          ex('pressao', 'Mediu a pressão?', 'Mediram a pressão dela?', '{{17 por 11|pa}}, na farmácia aqui do lado.'),
          ex('inchaco', 'Inchaço?', 'Ela está inchada?', 'O rosto e as mãos inchados, a aliança não sai.'),
        ],
        links: [
          lm(p, 'brilho', 'eclampsia', 'Gestante com dor de cabeça forte, visão "brilhando" e pressão alta: pré-eclâmpsia grave. USA → Maternidade (Manual p.7).'),
          lk('pa', 'cabeca', 'Pressão 17 por 11 e dor de cabeça na gravidez: não é contração.', { kind: 'confirma' }),
        ],
        worsen: [{ after: 90, lines: ['{Dr}! {{Ela tá se debatendo|convulsao}}! Tá tremendo toda!'], guide: 'convulsao', truth: { dx: 'Eclâmpsia (convulsão)', ok: ['USA'], best: 'USA', risk: { good: 50, bad: 120 } } }],
        radio: { ok: '{central}, {unit}. Pré-eclâmpsia grave, pressão alta e dor de cabeça. Seguimos pra Maternidade, centro obstétrico avisado.' },
        diary: { alive: 'Pré-eclâmpsia. Bebê nasceu de 34 semanas, os dois bem.', dead: 'Eclâmpsia.' },
      }),
    },
    {
      id: 'descolamento',
      weight: 0.8,
      build: (p) => ({
        truth: { dx: 'Descolamento de placenta', sev: 'vermelho', ok: ['USA'], dest: ['MAT'], risk: { good: 50, bad: 120 } },
        note: 'Gestante com dor forte e sangramento.',
        noteWrong: 'Trabalho de parto começando, {dr}.',
        amb: ['gemidos'],
        q: {
          oque: '{{A barriga tá dura feito pedra|dura}}, e a dor não passa. Não vai e volta, é direto.',
          consciencia: 'Acordada, pálida.',
          respira: 'Rápido.',
          inicio: 'Faz uma hora.',
          idade: `${p.anos}.`,
          historico: 'Pressão alta na gravidez. E fuma escondido.',
          gestacao: ['32 semanas.', '{{Sangramento escuro|sangue_escuro}}, não muito.'],
          sangramento: 'Um pouco, {{escuro|sangue_escuro}}. Não é muito.',
        },
        extra: [ex('mexe', 'O bebê está mexendo?', 'O bebê está mexendo?', 'Ela disse que {{parou de mexer|parou_mexer}}... desde cedo não sente.')],
        links: [
          lk('dura', 'sangue_escuro', 'Barriga dura que não relaxa, dor contínua e sangramento escuro: descolamento de placenta. USA → Maternidade.'), // RO1: dor intensa = USA; RO2: dor intensa por risco de rotura uterina e choque = USA
          lk('parou_mexer', 'dura', 'O bebê parou de mexer: sofrimento fetal.', { kind: 'confirma' }),
        ],
        radio: { ok: '{central}, {unit}. Descolamento de placenta, mãe chocada. Seguimos pra Maternidade, centro obstétrico avisado.' },
        diary: { alive: 'Descolamento de placenta. Cesárea de emergência.', dead: 'Descolamento de placenta.' },
      }),
    },
    {
      id: 'ectopica',
      weight: 0.8,
      build: (p) => ({
        truth: { dx: 'Gravidez ectópica rota (7 semanas)', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 50, bad: 120 } },
        note: 'Gestante com dor forte. Desmaiou.',
        noteWrong: 'Cólica da gravidez. Tranquilo, {dr}.',
        amb: ['silencio'],
        q: {
          oque: 'Uma dor fina, {{de um lado só, embaixo|um_lado}}. E {{desmaiou no banheiro|desmaiou}}.',
          consciencia: 'Acordou, mas tá branca, suando.',
          respira: 'Rápido.',
          inicio: 'A dor faz duas horas. O desmaio foi agora.',
          idade: `${p.anos}.`,
          historico: 'Nada.',
          gestacao: ['{{Sete semanas|sete_semanas}}. Fez o teste de farmácia semana passada.', 'Sangrando um pouquinho.'],
          sangramento: 'Um pouquinho. Manchou a calcinha.',
        },
        links: [
          lk('sete_semanas', 'um_lado', 'Gravidez de sete semanas, dor forte de um lado e desmaio: gravidez ectópica rota até prova em contrário. USA → Regional.'), // RO1: dor intensa e alteração súbita da consciência = USA; RC13 (nota): sangramento vaginal com dor = ectópica ou abortamento
          lm(p, 'sete_semanas', 'destino_mat', 'Maternidade é para mais de 20 semanas: sete semanas vai para o Regional (Manual p.9-A).'),
        ],
        radio: { ok: '{central}, {unit}. Ectópica rota, chocada. Seguimos pro Regional, centro cirúrgico avisado.' },
        diary: { alive: 'Gravidez ectópica. Cirurgia a tempo.', dead: 'Gravidez ectópica rota.' },
      }),
    },
  ],
});

// -----------------------------------------------------------------------------
// "Eu tô grávida e tô sangrando."
// -----------------------------------------------------------------------------
export const GRAVIDA_SANGRA = tpl({
  id: 'gravida_sangra',
  tags: ['obstetricia', 'leve', 'grave'],
  minDay: 7,
  age: [19, 40],
  sex: 'F',
  rel: ['proprio'],
  cena: { place: 'sala' },
  open: () => ['{Dr}, eu tô grávida e {{tô sangrando|sangrando}}. Eu tô com muito medo.'],
  truths: [
    {
      id: 'pequeno_inicio',
      weight: 2.5,
      build: (p) => ({
        truth: { dx: 'Sangramento pequeno no início da gestação', sev: 'verde', ok: ['ORI'], ref: ['MAT', 'UBS'] },
        note: 'Gestante com sangramento. Calma, parece.',
        noteWrong: 'Gestante sangrando muito! Corre!',
        amb: ['silencio'],
        q: {
          oque: 'Fui no banheiro e vi sangue no papel.',
          consciencia: 'Acordada. Com medo.',
          respira: 'Normal.',
          inicio: 'Agora, faz meia hora.',
          idade: `${p.anos}.`,
          historico: 'Nada. Primeira gravidez.',
          gestacao: ['{{Oito semanas|oito}}.', '{{Um pouquinho, rosado, só no papel|pouco}}. Dor não tenho. Dor de cabeça não.'],
          sangramento: '{{Um pouquinho, rosado, só no papel|pouco}}. Não molhou a roupa.',
        },
        extra: [ex('tontura', 'Tontura? Cólica?', 'Sente tontura, cólica forte?', 'Não. Só o susto.')],
        links: [lm(p, 'pouco', 'sangramento_gest', 'Sangramento pequeno, sem dor, no início da gestação: orientação, Maternidade/UBS por meios próprios (Manual p.7).')],
        radio: { excess: '{central}, {unit}. Sangramento discreto de oito semanas, estável, {dr}.' },
        diary: { ori: 'Sangramento pequeno com oito semanas. Ultrassom normal no dia seguinte.' },
      }),
    },
    {
      id: 'aborto',
      weight: 1,
      build: (p) => ({
        truth: { dx: 'Abortamento com sangramento intenso', sev: 'vermelho', ok: ['USA'], dest: ['REG', 'MAT'], risk: { good: 50, bad: 120 } },
        note: 'Gestante sangrando muito.',
        noteWrong: 'Sangramento pequeno, começo de gravidez.',
        amb: ['choro'],
        q: {
          oque: 'Começou com cólica e agora é muito sangue.',
          consciencia: '{{Tô tonta... quando levanto fica tudo preto|tonta}}.',
          respira: 'Rápido.',
          inicio: 'Faz uma hora.',
          idade: `${p.anos}.`,
          historico: 'Nada.',
          gestacao: ['{{Onze semanas|onze}}.', '{{Muito sangue, encharquei dois absorventes em meia hora|muito}}. Cólica forte.'],
          sangramento: '{{Muito sangue, encharquei dois absorventes em meia hora|muito}}.',
        },
        links: [
          lm(p, 'muito', 'sangramento_gest', 'Sangramento forte na gestação: USA (Manual p.7).'),
          lk('muito', 'tonta', 'Sangramento forte com tontura ao levantar: choque.'),
        ],
        radio: { ok: '{central}, {unit}. Abortamento com hemorragia, soro aberto. Seguimos.' },
        diary: { alive: 'Perdeu o bebê de onze semanas. Ela ficou bem.', dead: 'Hemorragia no abortamento.' },
      }),
    },
    {
      id: 'placenta_previa',
      weight: 1,
      build: (p) => ({
        truth: { dx: 'Placenta prévia sangrando (32 semanas)', sev: 'vermelho', ok: ['USA'], dest: ['MAT'], risk: { good: 50, bad: 120 } },
        note: 'Gestante sangrando no fim da gravidez.',
        noteWrong: 'Tampão saindo, normal, {dr}.',
        amb: ['silencio'],
        q: {
          oque: 'Acordei com a cama molhada de sangue.',
          consciencia: 'Acordada. Meio tonta.',
          respira: 'Rápido.',
          inicio: 'Agora.',
          idade: `${p.anos}.`,
          historico: 'O ultrassom falou que {{a placenta tava baixa|placenta}}.',
          gestacao: ['{{32 semanas|semanas_32}}.', '{{Sangue vivo, muito, e não dói nada|sem_dor}}.'],
          sangramento: '{{Sangue vivo, muito, e não dói nada|sem_dor}}. A cama tá encharcada.',
        },
        links: [lk('sem_dor', 'placenta', 'Sangramento vivo, abundante e sem dor no terceiro trimestre, com placenta baixa: placenta prévia. USA → Maternidade.')], // RO1: sangramento vaginal intenso = USA; RC13/RO2: mais de 20 semanas = USA
        radio: { ok: '{central}, {unit}. Placenta prévia sangrando, 32 semanas. Seguimos pra Maternidade.' },
        diary: { alive: 'Placenta prévia. Cesárea de 32 semanas. Os dois vivos.', dead: 'Hemorragia por placenta prévia.' },
      }),
    },
    {
      id: 'tampao',
      weight: 1.5,
      build: (p) => ({
        // ⚖ [validar] RO1/RC13: em gestante acima de 20 semanas "qualquer pinga de sangue" é USB (RC13: USA). Tampão com fio de sangue a termo, sem dor: orientação é defensável, USB também.
        truth: { dx: 'Perda do tampão mucoso a termo', sev: 'verde', ok: ['ORI', 'USB'], best: 'ORI', ref: ['MAT'], dest: ['MAT'], must: must(p, 'gestacao', 'consciencia') },
        note: 'Gestante de fim de gravidez, sangramento leve.',
        noteWrong: 'Gestante sangrando! Grave, {dr}!',
        amb: ['tv'],
        q: {
          oque: 'Saiu uma coisa com sangue quando fui no banheiro.',
          consciencia: 'Acordada.',
          respira: 'Normal.',
          inicio: 'Agora há pouco.',
          idade: `${p.anos}.`,
          historico: 'Pré-natal certinho.',
          gestacao: ['{{39 semanas|semanas_39}}.', '{{Uma gosma com rajadinha de sangue|tampao}}. As contrações vêm de vez em quando.'],
          sangramento: 'Só {{uma gosma com rajadinha de sangue|tampao}}. Nada que molhe a roupa.',
        },
        links: [lk('tampao', 'semanas_39', 'Muco com raias de sangue a termo: tampão mucoso, o parto se aproxima. Ir à Maternidade quando as contrações ficarem regulares ou a bolsa romper.')], // [validar]
        radio: { excess: '{central}, {unit}. Tampão mucoso, {dr}. Nem em trabalho de parto tá.' },
        diary: { ori: 'Perdeu o tampão com 39 semanas. Orientada a esperar as contrações.' },
      }),
    },
  ],
});

export const OBSTETRICIA = [GRAVIDA_DOR, GRAVIDA_SANGRA];
