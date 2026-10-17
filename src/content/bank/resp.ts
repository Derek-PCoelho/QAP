// =============================================================================
// Banco — respiratório: "não consegue respirar", engasgo, chiado na criança.
// Instruções clínicas marcadas com [validar].
// =============================================================================
import { tpl, lk, lm, must, ex, guideIf, alt } from './kit';

// -----------------------------------------------------------------------------
// "Não consegue respirar." (documento de design, 5.2)
// -----------------------------------------------------------------------------
export const NAO_RESPIRA = tpl({
  id: 'nao_respira',
  tags: ['respiratorio', 'leve', 'grave'],
  age: [18, 82],
  rel: ['esposa', 'marido', 'amigo', 'esposa'],
  cena: { place: 'sala' },
  open: (p) => [`${p.Quem} {{não consegue respirar|nao_respira}}, {dr}! Pelo amor de Deus!`],
  truths: [
    {
      id: 'ansiedade',
      weight: 3.5,
      build: (p0) => {
        const p = p0.at(18, 40);
        return {
          who: p,
          truth: { dx: 'Crise de ansiedade (hiperventilação)', sev: 'verde', ok: ['ORI', 'USB'], best: 'ORI', ref: ['CASA', 'UBS'], dest: ['UPA'], must: must(p, 'frases', 'labios') },
          note: `${p.tipo} com falta de ar. Muito nervos${p.o}.`,
          noteWrong: 'Falta de ar grave! Corre, {dr}!',
          amb: ['respiracao', 'choro'],
          noise: ['[respiração rápida e curta ao fundo; choro]'],
          q: {
            oque: `${alt(p, ['Recebeu uma notícia ruim no telefone', 'Brigou feio com o chefe', 'Viu um acidente na rua'])} e começou a puxar o ar desse jeito.`,
            consciencia: `Acordad${p.o}, andando de um lado pro outro.`,
            respira: '{{Rápido, rápido, não para|rapido}}. {{Mas não chia|sem_chiado}}.',
            inicio: 'Faz uns quinze minutos.',
            idade: `${p.anos}.`,
            historico: 'Nada. Nenhuma doença. Asma não tem.',
            dorpeito: 'Diz que aperta, mas é de nervoso.',
          },
          extra: [
            ex('frases', 'Fala frases inteiras?', `${p.Ele} consegue falar uma frase inteira?`, [`${p.PT}: Eu consigo falar, consigo! Mas parece que eu vou morrer, parece que o ar não chega no fundo!`, '{{Fala, {dr}, fala tudo, sem parar|frases}}.']),
            ex('labios', 'Lábios roxos?', 'Olha os lábios: estão roxos?', '{{Normais, rosados|labios_ok}}.'),
            ex('formiga', 'Formigamento?', 'Sente formigamento na boca ou nas mãos?', '{{A boca e as mãos formigando|formigando}}, as mãos tão travando.'),
          ],
          links: [
            lm(p, 'formigando', 'ansiedade', 'Formigamento na boca e nas mãos, fala frases, lábios normais, sem chiado: crise de ansiedade. Respiração guiada (Manual p.5-B).'),
            lk('frases', 'nao_respira', '"Não consegue respirar"... mas fala frases inteiras e os lábios estão normais: a falta de ar é real para quem sente, mas não é obstrução.'),
          ],
          guide: guideIf(p.F, 'respiracao', true),
          radio: { ok: 'Central, {unit}. Crise de ansiedade, saturação 99. Acalmou. Levamos pra UPA por precaução.', excess: '{central}, {unit}. Ansiedade, {dr}. Saturação 99.' },
          diary: { ori: 'Falta de ar de ansiedade. Respiramos juntos até passar.', alive: 'Crise de ansiedade. Acalmou na ambulância.' },
        };
      },
    },
    {
      id: 'asma_mod',
      weight: 2,
      build: (p0) => {
        const p = p0.at(18, 55);
        return {
          who: p,
          truth: { dx: 'Crise de asma moderada', sev: 'amarelo', ok: ['USB'], dest: ['UPA'], risk: { good: 90, bad: 240, needs: 'USB' } },
          note: `${p.tipo} asmátic${p.o} em crise.`,
          noteWrong: 'Falta de ar. Ansiedade, parece.',
          amb: ['respiracao'],
          noise: ['[um {{chiado audível ao fundo|chiado}}]'],
          q: {
            oque: 'Tem asma. Começou a chiar ontem, hoje piorou.',
            consciencia: `Acordad${p.o}, sentad${p.o}, assustad${p.o}.`,
            respira: 'Puxando, chiando. Mas entra ar.',
            inicio: 'Piorou faz uma hora.',
            idade: `${p.anos}.`,
            historico: 'Asma desde criança.',
          },
          extra: [
            ex('frases', 'Fala frases inteiras?', `${p.Ele} consegue falar uma frase inteira?`, [`${p.PT}: Consigo falar, {dr}. O peito tá apertado e chiando, mas eu falo.`, '{{Fala frases curtas, mas inteiras, sem parar no meio|frase_curta}}.']), // RC3: frases entrecortadas seriam USA (aqui não há)
            ex('labios', 'Lábios roxos?', 'Olha os lábios: estão roxos?', 'Normais.'),
            ex('bombinha', 'Usou a bombinha?', `${p.Ele} usou a bombinha?`, '{{Usou, melhorou um pouco|melhorou_pouco}}, mas voltou.'),
          ],
          links: [
            lm(p, 'melhorou_pouco', 'asma_mod', 'Chia, completa as frases, lábios normais, melhora só em parte com a bombinha: asma moderada. USB (Manual p.5-B).'),
            lk('chiado', 'frase_curta', 'Chiado e frases curtas, mas inteiras: crise de asma, não ansiedade.', { kind: 'confirma' }),
          ],
          worsen: [
            {
              after: 110,
              lines: [`{Dr}, ${p.ele} {{parou de chiar|parou_chiar}}... e tá ficando ${p.g('roxo', 'roxa')}!`],
              resetRisk: true,
            truth: { sev: 'vermelho', ok: ['USA'], dx: 'Crise de asma grave (piorou na espera)', dest: ['REG'], risk: { good: 50, bad: 120 } },
            },
          ],
          radio: { ok: 'Central, {unit}. Asma moderada. Nebulização, melhorando. Seguimos pra UPA.' },
          diary: { alive: 'Crise de asma. Nebulizad' + p.o + ' na ambulância.' },
        };
      },
    },
    {
      id: 'anafilaxia',
      weight: 1.2,
      build: (p0) => {
        const p = p0.at(18, 70);
        return {
          who: p,
          truth: { dx: 'Anafilaxia (reação alérgica grave)', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 28, bad: 70, guideBonus: 35 } },
          // cena da videochamada (onde a história acontece)
          cena: alt(p, [{ place: 'salao', props: ['bexigas'] }, { place: 'sala' }, { place: 'quintal' }]),
          note: `${p.tipo} com falta de ar e inchaço.`,
          noteWrong: `Falta de ar, parece nervos${p.o}, {dr}.`,
          amb: ['respiracao'],
          noise: ['[{{uma voz rouca ao fundo, tentando falar|rouca}}]'],
          q: {
            oque: `${alt(p, ['Comeu camarão na festa', 'Tomou uma dipirona pra dor de cabeça', `Foi picad${p.o} por um bicho no quintal`])}... e {{a boca começou a inchar|inchar}}.`,
            consciencia: `Acordad${p.o}, mas ficando mole.`,
            respira: '{{Faz um barulho fino, tipo apito|estridor}}.',
            inicio: 'Agora! Faz dez minutos!',
            idade: `${p.anos}.`,
            historico: 'Nada... nunca teve alergia.',
            ingestao: alt(p, ['Camarão, na festa. Faz uns dez minutos.', 'Uma dipirona pra dor de cabeça, faz uns dez minutos.', 'Engolir nada. Foi uma picada, de um bicho no quintal.']),
          },
          extra: [
            ex('pele', 'Manchas na pele?', 'Tem manchas ou placas na pele?', '{{Cheio de placas vermelhas|placas}}, coçando.'),
            ex('caneta', 'Tem caneta de adrenalina?', 'Tem caneta de adrenalina aí?', 'Não tem, nunca precisou!'),
          ],
          links: [
            lk('inchar', 'estridor', 'Boca inchando e respiração com apito depois de comida, remédio ou picada: anafilaxia. Vermelho, USA.'),
            lk('placas', 'inchar', 'Placas pelo corpo e inchaço: reação alérgica que se espalha.', { kind: 'confirma' }),
          ],
          guide: guideIf(p.F, 'anafilaxia'),
          radio: { ok: '{central}, {unit}. Anafilaxia, edema de lábio e estridor. Adrenalina, respondeu. Seguimos pro Regional.', under: '{unit}: anafilaxia com estridor! Precisamos de USA, AGORA!' },
          diary: { alive: 'Reação alérgica grave. A adrenalina chegou a tempo.', dead: 'Anafilaxia.' },
        };
      },
    },
    {
      id: 'engasgo',
      weight: 1,
      build: (p0) => {
        const p = p0.at(30, 82);
        return {
          who: p,
          truth: { dx: 'Engasgo com obstrução total', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 25, bad: 60, guideBonus: 30 } },
          // cena da videochamada (onde a história acontece)
          cena: { place: 'cozinha' },
          note: `${p.tipo} sem ar. Tava comendo.`,
          noteWrong: 'Falta de ar. Asma, deve ser.',
          amb: ['cozinha', 'gritos'],
          noise: ['[{{um silêncio estranho, ninguém tosse|silencio}}]'],
          q: {
            oque: 'Tava comendo carne e de repente {{pôs a mão no pescoço|mao_pescoco}}!',
            consciencia: `Acordad${p.o}, desesperad${p.o}!`,
            respira: `{{Não sai som nenhum|sem_som}}! Tá ficando ${p.g('roxo', 'roxa')}!`,
            inicio: 'Agora! Agora!',
            idade: `${p.anos}.`,
            historico: 'Nada! Tava comendo!',
          },
          extra: [ex('tosse', 'Consegue tossir ou falar?', `${p.Ele} consegue tossir ou falar?`, 'Não! Nem tosse, nem fala!')],
          links: [lk('mao_pescoco', 'sem_som', 'Mão no pescoço, sem som, sem tosse: engasgo total. USA + desengasgo guiado por telefone.')],
          guide: guideIf(!p.F, 'desengasgo'),
          radio: { saved: '{central}, {unit}. Desobstruíram por telefone antes da gente chegar. Quem guiou a manobra? Salvou.', ok: '{central}, {unit}. Engasgo resolvido, paciente respirando. Observação.' },
          diary: { alive: 'Engasgo com carne. A manobra saiu pelo telefone.', dead: 'Engasgo com carne.' },
        };
      },
    },
    {
      id: 'icc',
      weight: 1,
      build: (p0) => {
        const p = p0.at(65, 82);
        return {
          who: p,
          truth: { dx: 'Insuficiência cardíaca descompensada', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 50, bad: 120 } },
          // cena da videochamada (onde a história acontece)
          cena: { place: 'quarto' },
          note: `${p.tipo} com falta de ar, cardíac${p.o}.`,
          noteWrong: 'Falta de ar. Ansiedade, {dr}.',
          amb: ['respiracao', 'tv'],
          noise: ['[uma respiração {{borbulhante, molhada|molhada}}]'],
          q: {
            oque: `Faz três noites que {{dorme sentad${p.o} na poltrona|sentado}}. Hoje não aguenta.`,
            consciencia: `Acordad${p.o}, cansad${p.o}.`,
            respira: 'Rápido, chiando molhado. Só consegue falar uma palavra de cada vez.', // RC12: frases entrecortadas = USA
            inicio: 'Piorou de ontem pra hoje.',
            idade: `${p.anos}.`,
            historico: '{{Coração grande|coracao}}, toma remédio de urinar. Parou de tomar porque fazia xixi demais.',
          },
          extra: [
            ex('pernas', 'As pernas estão inchadas?', 'As pernas estão inchadas?', '{{Inchadas, afunda quando aperta|pernas}}.'),
            ex('tosse', 'Tosse com espuma?', `${p.Ele} tosse? Como é o catarro?`, '{{Tosse com uma espuma rosada|espuma}}.'),
          ],
          links: [
            lk('sentado', 'espuma', 'Não deita, espuma rosada, pernas inchadas e parou o diurético: insuficiência cardíaca descompensada. Vermelho, USA.'),
            lk('coracao', 'pernas', 'Coração grande e pernas inchadas: o líquido está acumulando.', { kind: 'confirma' }),
          ],
          radio: { ok: '{central}, {unit}. Edema agudo de pulmão, cardiopata. Sentamos, oxigênio, medicação. Seguimos pro Regional.' },
          diary: { alive: 'Coração grande, tinha parado o diurético. Respirou de novo.', dead: 'Insuficiência cardíaca.' },
        };
      },
    },
  ],
});

// -----------------------------------------------------------------------------
// "Meu pai engasgou!"
// -----------------------------------------------------------------------------
export const ENGASGO = tpl({
  id: 'engasgo',
  tags: ['respiratorio', 'idoso', 'grave', 'moderado'],
  age: [60, 90],
  sex: 'M',
  rel: ['filho', 'neto', 'esposa'],
  cena: { place: 'cozinha' },
  open: (p) => [`{Dr}, ${p.quem} {{engasgou|engasgou}}! Tava comendo e engasgou!`],
  truths: [
    {
      id: 'total',
      weight: 3,
      build: (p) => ({
        truth: { dx: 'Engasgo com obstrução total', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 25, bad: 60, guideBonus: 30 } },
        note: `${p.tipo} engasgado. Não tosse.`,
        noteWrong: 'Engasgou, mas tá tossindo. Calma, {dr}.',
        amb: ['cozinha', 'gritos'],
        noise: ['[cadeira caindo; alguém bate nas costas dele]'],
        q: {
          oque: 'Comendo carne. {{Pôs a mão no pescoço|mao_pescoco}} e arregalou o olho!',
          consciencia: 'Acordado, desesperado, em pé!',
          respira: '{{Não sai som nenhum|sem_som}}! Tá roxo!',
          inicio: 'Agora, agora!',
          idade: `${p.anos}.`,
          historico: 'Dentadura... ele come rápido.',
        },
        extra: [ex('tosse', 'Consegue tossir ou falar?', 'Ele consegue tossir ou falar?', '{{Não! Nem tosse, nem fala|nao_tosse}}!')],
        links: [lk('sem_som', 'nao_tosse', 'Sem som e sem tosse: obstrução total. USA + desengasgo guiado já.')],
        guide: { id: p.rel === 'filho' ? 'desengasgo_rcp' : 'desengasgo' },
        radio: { saved: '{central}, {unit}. Desengasgaram antes da gente chegar. Quem guiou? Salvou o homem.', dead: 'Central... {unit}. Não conseguimos desobstruir a tempo. Óbito às {hora}.' },
        diary: { alive: 'Engasgou com carne. A manobra saiu pelo telefone.', dead: 'Engasgo com carne.' },
      }),
    },
    {
      id: 'parcial',
      weight: 1.5,
      build: (p) => ({
        truth: { dx: 'Engasgo parcial (tosse eficaz)', sev: 'amarelo', ok: ['USB', 'ORI'], best: 'USB', ref: ['UPA'], dest: ['UPA'], must: must(p, 'respira', 'tosse') },
        note: `${p.tipo} engasgado, tossindo.`,
        noteWrong: 'Engasgou e não respira! Corre!',
        amb: ['cozinha'],
        noise: ['[{{tosse forte e seguida ao fundo|tosse_forte}}]'],
        q: {
          oque: 'Engasgou com a farofa. Tá tossindo, vermelho...',
          consciencia: 'Acordado, sentado.',
          respira: 'Respira, puxando, entre uma tosse e outra.',
          inicio: 'Faz uns cinco minutos.',
          idade: `${p.anos}.`,
          historico: 'Pressão. Usa dentadura.',
        },
        extra: [ex('tosse', 'Consegue tossir ou falar?', 'Ele consegue tossir ou falar?', [`${p.PT}: Tô... [tosse] ...engasgado... [tosse]`, 'Tosse forte e fala, {dr}.'])],
        links: [lk('tosse_forte', 'engasgou', 'Engasgado que tosse forte e fala: obstrução parcial. Deixar tossir, não bater, não dar água. Se parar de tossir ou falar, vira emergência.')], // campo BC3 (obstrução leve): não manobrar, deixar tossir com vigor, observar
        worsen: [
          {
            after: 60,
            lines: ['{Dr}! Agora {{não sai mais som|sem_som}}! Parou de tossir!'],
            // a piora troca a verdade por cima da original: limpar best/must da versão parcial
            resetRisk: true,
            truth: { sev: 'vermelho', ok: ['USA'], best: 'USA', must: [], dx: 'Engasgo que virou obstrução total', dest: ['REG'], risk: { good: 25, bad: 60, guideBonus: 30 } },
            guide: 'desengasgo',
          },
        ],
        radio: { ok: 'Central, {unit}. Engasgo parcial, desobstruiu tossindo. Observação na UPA.' },
        diary: { alive: 'Engasgo com farofa. Tossiu até sair.', ori: 'Engasgo parcial. Tossiu até sair.' },
      }),
    },
    {
      id: 'resolvido',
      weight: 1.5,
      build: (p) => ({
        truth: { dx: 'Engasgo já resolvido', sev: 'verde', ok: ['ORI'], ref: ['CASA', 'UBS'] },
        note: `${p.tipo} engasgou. Parece que saiu.`,
        noteWrong: 'Engasgado, roxo! Corre, {dr}!',
        amb: ['cozinha'],
        noise: ['[uma tosse, depois alguém chorando de alívio]'],
        q: {
          oque: 'Engasgou com frango... minha irmã apertou a barriga dele e {{saiu|saiu}}! Saiu um pedaço!',
          consciencia: 'Acordado, sentado, falando.',
          respira: '{{Respira! Agora respira normal|respira_ok}}. Tossindo um pouco.',
          inicio: 'Agora há pouco.',
          idade: `${p.anos}.`,
          historico: 'Pressão. Usa dentadura.',
          paciente: [`${p.PT}: Tô bem, gente... que susto. Foi o frango.`],
        },
        extra: [ex('dor', 'Dor ou falta de ar?', 'Ele sente dor ou falta de ar agora?', 'Diz que dói a costela de tanto apertar. Falta de ar não.')],
        links: [lk('saiu', 'respira_ok', 'Desobstruiu, respira e fala: engasgo resolvido. Orientar observar e passar na UBS para avaliar depois da manobra; se ficar com falta de ar, dor na barriga ou febre, procurar a UPA.')], // [validar] avaliação após Heimlich (BC3 não detalha)
        radio: { excess: '{central}, {unit}. Já tinha desengasgado, {dr}. Tá tomando água.' },
        diary: { ori: 'Engasgo com frango. A família desobstruiu antes de a gente precisar.' },
      }),
    },
    {
      id: 'aspiracao',
      weight: 1,
      build: (p) => ({
        truth: { dx: 'Pneumonia por aspiração (engasga em toda refeição)', sev: 'amarelo', ok: ['USB'], dest: ['UPA'] },
        note: `${p.tipo} engasga sempre. Hoje com febre.`,
        noteWrong: 'Engasgou! Obstrução, {dr}!',
        amb: ['tv', 'respiracao'],
        q: {
          oque: 'Engasgou com a sopa, tossiu e passou. Mas desde ontem tá com febre e respirando rápido.',
          consciencia: 'Acordado, mais quieto que o normal.',
          respira: '{{Respirando rápido, cansado|rapido}}.',
          inicio: 'O engasgo foi agora. A febre começou ontem.',
          idade: `${p.anos}.`,
          historico: '{{Ele tem Parkinson e engasga toda refeição|engasga_sempre}}.',
        },
        extra: [ex('febre', 'Tem febre?', 'Ele tem febre?', '{{38 e meio|febre}}.')],
        links: [lk('engasga_sempre', 'febre', 'Engasga toda refeição, agora com febre e respiração rápida: comida indo para o pulmão. Pneumonia por aspiração: USB.')], // RC12: dispneia em idoso acima de 60 anos = USI/USB
        radio: { ok: 'Central, {unit}. Pneumonia aspirativa provável. Oxigênio, seguimos pra UPA.' },
        diary: { alive: 'Engasgava em toda refeição. Pneumonia. Encaminhado para fono.' },
      }),
    },
  ],
});

// -----------------------------------------------------------------------------
// "Meu filho tá com um chiado no peito."
// -----------------------------------------------------------------------------
export const CHIADO_CRIANCA = tpl({
  id: 'chiado_crianca',
  tags: ['pediatria', 'respiratorio', 'leve', 'moderado'],
  age: [4, 10],
  rel: ['mae', 'pai'],
  cena: { place: 'sala' },
  open: (p) => [`${p.Quem} tá com um {{chiado no peito|chiado}}, {dr}. Tá puxando o ar. Eu tô ficando nervos${p.co}.`],
  truths: [
    {
      id: 'asma_leve',
      weight: 2,
      build: (p) => ({
        truth: { dx: 'Crise de asma leve (melhorou com a bombinha)', sev: 'verde', ok: ['ORI'], ref: ['UBS', 'UPA'] },
        note: `${p.tipo} asmátic${p.o}, chiado leve.`,
        noteWrong: 'Criança sem ar! Grave, {dr}!',
        amb: ['desenho'],
        q: {
          oque: 'Começou a chiar depois que brincou na poeira. Dei a bombinha.',
          consciencia: `Acordad${p.o}, vendo desenho.`,
          respira: '{{Chiadinho leve, mas fala tudo, brinca|brinca}}.',
          inicio: 'Faz uma hora. Melhorou depois da bombinha.',
          idade: `${p.anos}.`,
          historico: 'Asma. Tem bombinha com espaçador.',
          paciente: [`${p.PT}: ${p.cg('Pai', 'Mãe')}, posso ver o desenho? [tosse]`],
        },
        extra: [ex('bombinha', 'Melhorou com a bombinha?', 'Melhorou depois da bombinha?', '{{Melhorou bem|melhorou}}. Quase não chia mais.')],
        links: [lk('melhorou', 'brinca', 'Chiado leve, melhorou com a bombinha, fala e brinca: crise leve. Orientar bombinha e UBS.')],
        radio: { excess: '{central}, {unit}. Crise leve, já respondendo à bombinha, {dr}.' },
        diary: { ori: 'Chiado leve depois da poeira. Bombinha resolveu.' },
      }),
    },
    {
      id: 'asma_mod',
      weight: 2.5,
      build: (p) => ({
        // RP1/RC3: "frases entrecortadas" e "esforço respiratório aumentado" (tiragem) são USA; aqui sem tiragem e com frases inteiras: USB, com piora para USA.
        truth: { dx: 'Crise de asma moderada', sev: 'amarelo', ok: ['USB'], dest: ['UPA'], risk: { good: 90, bad: 240, needs: 'USB' } },
        note: `${p.tipo} em crise de asma.`,
        noteWrong: 'Chiadinho leve. Bombinha resolve, {dr}.',
        amb: ['respiracao', 'choro'],
        noise: ['[chiado audível ao fundo]'],
        q: {
          oque: 'Tava tossindo desde ontem. Hoje começou a puxar o ar.',
          consciencia: `Acordad${p.o}, assustad${p.o}.`,
          respira: 'Chiando, puxando um pouco. {{O peito não afunda, a barriga não puxa|sem_tiragem}}.',
          inicio: 'Piorou faz uma hora.',
          idade: `${p.anos}.`,
          historico: 'Asma. Tem bombinha.',
        },
        extra: [
          ex('frases', 'Fala frases inteiras?', `${p.Ele} consegue falar uma frase inteira?`, '{{Fala frase inteira, curtinha, sem parar no meio|frase_curta}}.'),
          ex('bombinha', 'Usou a bombinha?', 'Deu a bombinha? Melhorou?', '{{Dei, melhorou um pouco|melhorou_pouco}}, mas voltou.'),
          ex('labios', 'Lábios roxos?', 'Como estão os lábios?', 'Normais.'),
        ],
        links: [lm(p, 'melhorou_pouco', 'asma_mod', 'Chia, completa as frases, lábios normais, melhora só em parte com a bombinha: asma moderada. USB (Manual p.5-B).')],
        worsen: [
          {
            after: 110,
            lines: [`{Dr}, ${p.ele} {{parou de chiar|parou_chiar}}... e tá com a boca roxinha!`],
            resetRisk: true,
            truth: { sev: 'vermelho', ok: ['USA'], dx: 'Crise de asma grave (piorou na espera)', dest: ['REG'], risk: { good: 50, bad: 120 } },
          },
        ],
        radio: { ok: 'Central, {unit}. Asma moderada, nebulizando. Melhorando. Seguimos pra UPA.' },
        diary: { alive: 'Crise de asma. Nebulização na ambulância.' },
      }),
    },
    {
      id: 'asma_grave',
      weight: 1,
      build: (p) => ({
        truth: { dx: 'Crise de asma grave (tórax silencioso)', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 50, bad: 120 } },
        note: `${p.tipo} em crise. ${p.cg('Pai', 'Mãe')} diz que parou de chiar.`,
        noteWrong: 'Parou de chiar, tá melhorando, {dr}.',
        amb: ['silencio', 'choro'],
        noise: ['[um silêncio estranho]'],
        q: {
          oque: `Tava chiando muito... agora {{parou de chiar|parou_chiar}}. Isso é bom, né?`,
          consciencia: `{{Tá com o olho pesado, querendo dormir|sonolento}}.`,
          respira: 'Fraquinho. Quase não mexe o peito.',
          inicio: 'Faz umas duas horas que começou.',
          idade: `${p.anos}.`,
          historico: '{{A bombinha acabou faz dias|sem_bombinha}}.',
        },
        extra: [ex('labios', 'Lábios roxos?', 'Como estão os lábios e as unhas?', '{{Roxinhos|roxo}}.')],
        links: [
          lk('parou_chiar', 'roxo', '"Parou de chiar" com lábios roxos não é melhora: é TÓRAX SILENCIOSO. Vermelho, USA.'),
          lm(p, 'parou_chiar', 'torax_silencioso', 'Tórax silencioso: o ar quase não entra (Manual p.5-B).'),
          lm(p, 'sonolento', 'asma_grave', 'Sonolência e lábios roxos numa crise de asma: grave. USA (Manual p.5-B).'),
        ],
        radio: { ok: '{central}, {unit}. Asma grave, tórax silencioso. Adrenalina, oxigênio. Seguimos pro Regional.', under: '{unit}: criança em crise grave, saturando mal! Precisamos de suporte avançado!' },
        diary: { alive: 'Tórax silencioso. A bombinha tinha acabado. Internad' + p.o + ', viv' + p.o + '.', dead: 'Crise de asma grave. A bombinha tinha acabado.' },
      }),
    },
    {
      id: 'crupe',
      weight: 1.5,
      build: (p0) => {
        const p = p0.at(2, 5);
        return {
          who: p,
          truth: { dx: 'Laringite (crupe) sem sinais de gravidade', sev: 'verde', ok: ['ORI'], ref: ['UPA', 'UBS'] },
          note: `${p.tipo} com tosse de cachorro.`,
          noteWrong: 'Criança sem ar! Corre, {dr}!',
          amb: ['silencio'],
          noise: ['[uma {{tosse rouca, de cachorro|tosse_cachorro}}]'],
          q: {
            oque: 'Acordou da soneca com essa tosse esquisita, rouca.',
            consciencia: `Acordad${p.o}, no meu colo.`,
            respira: '{{Respira bem, sem nenhum barulho, nem quando chora|chora}}.', // RP1: estridor laríngeo (mesmo só ao chorar) é USA
            inicio: 'Faz meia hora.',
            idade: `${p.anos}.`,
            historico: 'Nada. Tá resfriad' + p.o + ' desde ontem.',
          },
          extra: [
            ex('labios', 'Lábios roxos?', 'Como estão os lábios?', 'Rosadinhos.'),
            ex('baba', 'Baba? Consegue engolir?', `${p.Ele} está babando? Engole normal?`, 'Engole normal, tomou leite. Não baba.'),
          ],
          links: [lk('tosse_cachorro', 'chora', 'Tosse de cachorro e rouquidão em criança resfriada, que respira sem barulho nenhum, nem chorando: crupe leve. Acalmar e levar à UPA por meios próprios. Com chiado ou apito ao respirar (estridor) seria urgência.')], // [validar]
          radio: { excess: `{central}, {unit}. Crupe leve, {dr}. Tá dormindo no colo ${p.cg('do pai', 'da mãe')}.` },
          diary: { ori: `Tosse de cachorro. Crupe leve. ${p.cg('Pai orientado', 'Mãe orientada')} a levar à UPA.` },
        };
      },
    },
    {
      id: 'corpo_estranho',
      weight: 0.8,
      build: (p0) => {
        const p = p0.at(1, 4);
        return {
          who: p,
          truth: { dx: 'Corpo estranho aspirado (amendoim/peça)', sev: 'amarelo', ok: ['USB'], dest: ['REG'] },
          note: `${p.tipo} pequen${p.o} com chiado de repente.`,
          noteWrong: 'Chiado. Asma, deve ser, {dr}.',
          amb: ['desenho'],
          q: {
            oque: `Tava brincando no tapete, {{tossiu muito de repente|tosse_subita}}, e depois ficou com esse chiado.`,
            consciencia: `Acordad${p.o}, chorando um pouco.`,
            respira: 'Chia... {{só de um lado, parece|um_lado}}.',
            inicio: 'Faz uma meia hora. Foi de repente.',
            idade: `${p.anos}.`,
            historico: '{{Nunca teve asma, nunca chiou|nunca_chiou}}. Febre não tem.',
          },
          extra: [ex('brincando', 'Brincava com o quê?', `${p.Ele} estava brincando ou comendo o quê?`, 'Comendo {{amendoim|amendoim}} com o irmão mais velho... e as pecinhas de montar no chão.')],
          links: [lk('tosse_subita', 'amendoim', 'Tosse súbita comendo amendoim, chiado de um lado, sem asma nem febre: corpo estranho no pulmão. USB → Regional.')], // RP1: sibilância audível ou chiado = USI/USB
          radio: { ok: 'Central, {unit}. Suspeita de aspiração de amendoim, estável. Seguimos pro Regional, broncoscopia.' },
          diary: { alive: 'Um amendoim no pulmão. Tiraram no Regional.' },
        };
      },
    },
  ],
});

export const RESP = [NAO_RESPIRA, ENGASGO, CHIADO_CRIANCA];
