// =============================================================================
// Banco — clínico geral: "bêbado" caído na calçada, picada no quintal, dor de
// barriga. Instruções clínicas marcadas com [validar].
// =============================================================================
import { tpl, lk, lm, must, ex, guideIf } from './kit';

// -----------------------------------------------------------------------------
// "Tem um homem caído aqui na calçada. Acho que é bêbado."
// -----------------------------------------------------------------------------
export const BEBADO = tpl({
  id: 'bebado',
  tags: ['leve', 'grave'],
  age: [25, 65],
  sex: 'M',
  rel: ['testemunha'],
  cena: { place: 'calcada', props: ['garrafa'] },
  open: () => ['Tem um homem {{caído aqui na calçada|caido}}, {dr}. Acho que é bêbado, mas tá esquisito.'],
  truths: [
    {
      id: 'embriaguez',
      weight: 3.5,
      build: (p) => ({
        truth: { dx: 'Embriaguez simples (acorda e responde)', sev: 'verde', ok: ['USB', 'ORI'], best: 'USB', ref: ['CASA', 'UBS'], dest: ['UPA'], must: must(p, 'consciencia', 'respira') },
        // cena da videochamada (onde a história acontece)
        cena: { place: 'bar_porta' },
        note: 'Homem caído na rua. Bêbado, diz a testemunha.',
        noteWrong: 'Homem caído, não responde! Grave, {dr}!',
        type: 'testemunha',
        amb: ['rua', 'bar'],
        q: {
          oque: '{{Fedendo a cachaça|cachaca}}, uma garrafa do lado.',
          consciencia: '{{Acordou quando eu cutuquei e me xingou|xingou}}.',
          respira: 'Respira normal. Tava roncando de leve, dormindo.',
          sangramento: 'Não vi sangue nenhum. Olhei a cabeça.',
          idade: `Uns ${Math.round(p.age / 5) * 5}.`,
          historico: 'Não conheço. Mas tá sempre no bar da esquina.',
          seguranca: 'Seguro. Ele é manso, só xinga.',
        },
        links: [lk('cachaca', 'xingou', 'Cheiro de cachaça, acorda e xinga quando cutucado, respira normal, sem sangue: embriaguez simples.')],
        radio: { ok: 'Central, {unit}. Embriaguez, sem trauma. Levamos pra UPA curar a ressaca.', excess: '{central}, {unit}. Bêbado, {dr}. Xingou a equipe toda.' },
        diary: { ori: 'Bêbado na calçada. Acordou xingando.', alive: 'Embriaguez na calçada. Sem trauma.' },
      }),
    },
    {
      id: 'hipoglicemia',
      weight: 1.2,
      minDay: 6,
      build: (p) => ({
        // ⚖ RC10/RC19: confuso, mas reativo (resmunga) = USB (alteração da consciência não atribuível ao álcool); USA é a melhor (pode apagar a qualquer momento).
        truth: { dx: 'Hipoglicemia confundida com embriaguez', sev: 'vermelho', ok: ['USA', 'USB'], best: 'USA', dest: ['REG', 'UPA'], risk: { good: 50, bad: 120, needs: 'USB' } },
        note: 'Homem caído, parece bêbado.',
        noteWrong: 'Bêbado na calçada. Sem pressa, {dr}.',
        type: 'testemunha',
        amb: ['rua'],
        q: {
          oque: 'Tava andando torto, suando, e caiu sentado.',
          consciencia: 'Resmunga, não fala coisa com coisa.',
          respira: 'Respira.',
          sangramento: 'Não.',
          idade: `Uns ${Math.round(p.age / 5) * 5}.`,
          seguranca: 'Seguro.',
        },
        extra: [
          ex('cheiro', 'Cheiro de bebida?', 'Ele tem cheiro de bebida?', '...Agora que você falou: {{não tem cheiro de bebida nenhum|sem_cheiro}}. Tá {{suando frio|suor}}.'),
          ex('documento', 'Tem documento, pulseira?', 'Ele tem algum documento, pulseira, cartão?', 'Tem uma {{pulseira escrito "diabético"|pulseira}}!'),
        ],
        links: [
          lk('sem_cheiro', 'caido', '"Bêbado" sem cheiro de bebida: procure outra causa.'),
          lk('pulseira', 'suor', `Pulseira de ${p.g('diabético', 'diabética')}, suor frio, confusão: hipoglicemia grave. USA.`),
          lm(p, 'pulseira', 'hipoglicemia', 'Hipoglicemia imita embriaguez (Manual p.6).'),
        ],
        radio: { ok: '{central}, {unit}. Glicemia 26! Não era bêbado. Corrigimos a glicose, acordou. Seguimos.' },
        diary: { alive: 'Todo mundo achou que era bêbado. Era açúcar baixo.', dead: 'Hipoglicemia na calçada. Acharam que era bêbado.' },
      }),
    },
    {
      id: 'tce',
      weight: 1.2,
      build: (p) => ({
        truth: { dx: 'Traumatismo craniano em embriagado', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 45, bad: 110 } },
        // cena da videochamada (onde a história acontece)
        cena: { signs: ['sangue_chao'] },
        note: 'Homem caído, bêbado, sangue na cabeça.',
        noteWrong: 'Bêbado dormindo. Sem pressa.',
        type: 'testemunha',
        amb: ['rua'],
        q: {
          oque: 'Bebeu, sim, tá fedendo. Mas {{tem sangue na nuca, empoçado|sangue_nuca}}.',
          consciencia: '{{Não acorda direito, nem quando eu chamo alto|nao_acorda}}.',
          respira: 'Respira, roncando.',
          sangramento: 'Na nuca. Bateu a cabeça no meio-fio, acho.',
          idade: `Uns ${Math.round(p.age / 5) * 5}.`,
          seguranca: 'Seguro.',
        },
        extra: [ex('vomito', 'Vomitou?', 'Ele vomitou?', '{{Vomitou duas vezes|vomitou}} desde que eu cheguei.')],
        links: [
          lk('sangue_nuca', 'nao_acorda', 'Bebida não explica sangue na nuca e não acordar: TCE grave. Vermelho, USA.'),
          lk('vomitou', 'nao_acorda', 'Vômitos e rebaixamento depois de bater a cabeça: sinais de alarme.', { kind: 'confirma' }),
        ],
        radio: { ok: '{central}, {unit}. TCE com hematoma, embriagado. Seguimos pro Regional.' },
        diary: { alive: 'Bêbado com a cabeça no meio-fio. Hematoma drenado.', dead: 'TCE no meio-fio. Acharam que era só bebida.' },
      }),
    },
    {
      id: 'coma_alcoolico',
      weight: 1,
      build: (p) => ({
        truth: { dx: 'Coma alcoólico com vômito (risco de aspiração)', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 50, bad: 120 } },
        // cena da videochamada (onde a história acontece)
        cena: { place: 'bar_porta', cast: [{ role: 'curioso', act: 'agachado' }, { role: 'curioso', act: 'olhando', at: 'fundo' }] },
        note: 'Homem caído, bêbado, não acorda.',
        noteWrong: 'Bêbado. Deixa dormir, {dr}.',
        type: 'testemunha',
        amb: ['rua', 'bar'],
        q: {
          oque: 'Tomou uma garrafa de pinga sozinho, apostando. Caiu.',
          consciencia: '{{Não acorda nem com tapa|nao_acorda}}.',
          respira: '{{Respira devagar, gorgolejando|gorgoleja}}.',
          sangramento: 'Não.',
          idade: `Uns ${Math.round(p.age / 5) * 5}.`,
          seguranca: 'Seguro. Os amigos do bar tão em volta.',
          ingestao: 'Uma garrafa de pinga, de uma vez só, apostando. A garrafa tá aqui do lado, vazia.',
        },
        extra: [
          ex('vomito', 'Vomitou?', 'Ele vomitou?', '{{Vomitou e tá com vômito na boca|vomito}}!'),
          ex('lado', 'Orientar: virar de lado', 'Orientar: virar de lado', ['Virei! Saiu vômito da boca...', 'Tá respirando melhor, sem aquele barulho.'], { kind: 'fala', say: 'Vira ele de lado agora, com a boca para baixo, e não deixa ninguém dar água ou café.' }), // campo A12 (BTox1): sem trauma, posição de recuperação e nada pela boca. [validar] "banho frio" não consta (mito comum)
        ],
        links: [lk('gorgoleja', 'vomito', 'Não acorda, respira gorgolejando, vômito na boca: risco de aspirar. Virar de lado já. Vermelho, USA.')],
        radio: { ok: '{central}, {unit}. Coma alcoólico, via aérea protegida. Seguimos.' },
        diary: { alive: 'Uma garrafa de pinga numa aposta. Viraram de lado a tempo.', dead: 'Coma alcoólico. Aspirou o vômito.' },
      }),
    },
  ],
});

// -----------------------------------------------------------------------------
// "Alguma coisa picou meu marido lá no quintal!"
// -----------------------------------------------------------------------------
export const PICADA = tpl({
  id: 'picada',
  tags: ['leve'],
  age: [20, 75],
  rel: ['esposa', 'marido', 'vizinho', 'amigo'],
  cena: { place: 'quintal' },
  open: (p) => [`{Dr}, {{alguma coisa picou|picou}} ${p.quem} lá no quintal! ${p.Ele} tá gritando de dor!`],
  truths: [
    {
      id: 'abelha_local',
      weight: 2.5,
      build: (p) => ({
        truth: { dx: 'Picada de abelha com reação local', sev: 'verde', ok: ['ORI'], ref: ['UBS', 'CASA'] },
        note: 'Picada de inseto. Só dor, parece.',
        noteWrong: 'Picada! Alergia grave, {dr}!',
        amb: ['passaros'],
        q: {
          oque: '{{Foi abelha|abelha}}, mexeu na flor do maracujá.',
          consciencia: `Acordad${p.o}, reclamando.`,
          respira: '{{Respira normal, fala normal|respira_ok}}.',
          sangramento: 'Não.',
          idade: `${p.anos}.`,
          historico: 'Nunca teve alergia. Já foi picad' + p.o + ' outras vezes.',
        },
        extra: [
          ex('inchaco', 'Onde inchou?', 'Inchou onde? Só no lugar da picada ou em outros lugares?', '{{Só em volta da picada, na mão|local}}. Placa no corpo não.'),
          ex('ferrao', 'Orientar o ferrão', 'Orientar o ferrão', 'Raspei com o cartão do banco, saiu. Pus gelo.', { kind: 'fala', say: 'Se o ferrão ficou, raspe com a borda de um cartão, sem apertar. Gelo no local.' }), // [validar]
        ],
        links: [lk('local', 'respira_ok', 'Inchaço só no local, respiração e fala normais, sem alergia: reação local. Orientação.')],
        radio: { excess: '{central}, {unit}. Picada de abelha na mão, {dr}. Pediu gelo e cerveja.' },
        diary: { ori: 'Abelha do maracujá. Inchou a mão. Gelo.' },
      }),
    },
    {
      id: 'enxame',
      weight: 0.8,
      minDay: 4,
      build: (p) => ({
        truth: { dx: 'Ataque de enxame (múltiplas picadas)', sev: 'vermelho', ok: ['USA'], sup: ['BOMB'], dest: ['REG'], risk: { good: 45, bad: 110 } },
        note: 'Picada de abelha... muitas, {dr}!',
        noteWrong: 'Picada de abelha. Leve.',
        amb: ['gritos', 'vento'],
        noise: ['[{{um zumbido alto, constante|zumbido}}; gritos]'],
        q: {
          oque: `${p.Ele} mexeu na caixa de abelhas do muro e {{veio o enxame inteiro|enxame}}!`,
          consciencia: `Acordad${p.o}, gritando, mole.`,
          respira: 'Respira, ofegante.',
          sangramento: 'Não.',
          idade: `${p.anos}.`,
          seguranca: '{{As abelhas ainda tão aqui em volta, atacando|abelhas}}! A gente se trancou!',
        },
        extra: [ex('quantas', 'Quantas picadas?', 'Quantas picadas, mais ou menos?', '{{Mais de cinquenta! O rosto tá coberto|cinquenta}}!')],
        links: [
          lk('enxame', 'cinquenta', 'Mais de cinquenta picadas: risco de intoxicação pelo veneno, mesmo sem alergia. Vermelho, USA.'), // RC21: envenenamento de alta mortalidade = USA. [validar] o limiar de ~50 picadas é da toxicologia clínica, não do protocolo
          lm(p, 'abelhas', 'cena', 'Enxame ainda atacando: cena insegura, Bombeiros para afastar as abelhas (Manual p.4).'),
        ],
        radio: { ok: '{central}, {unit}. Bombeiros afastaram o enxame. Múltiplas picadas, monitorizado. Seguimos.', unsafe: 'Central, {unit}! O enxame atacou a equipe! Recuamos! Cadê os Bombeiros?!' },
        diary: { alive: 'O enxame do muro. Mais de cinquenta picadas. Os Bombeiros afastaram as abelhas.', dead: 'Ataque de enxame.' },
      }),
    },
    {
      id: 'anafilaxia',
      weight: 1.2,
      build: (p) => ({
        truth: { dx: 'Anafilaxia por picada de abelha', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 28, bad: 70, guideBonus: 35 } },
        note: 'Picada, e tá com falta de ar!',
        noteWrong: 'Picada de abelha. Gelo e pronto.',
        amb: ['respiracao'],
        noise: ['[uma respiração com assobio]'],
        q: {
          oque: 'Foi abelha... e {{em dois minutos começou a inchar a boca|boca}}!',
          consciencia: `Acordad${p.o}, mas {{ficando mole|mole}}.`,
          respira: '{{Faz um barulho fino, tipo apito|estridor}}.',
          sangramento: 'Não.',
          idade: `${p.anos}.`,
          historico: '{{Alergia a abelha! Quase morreu uma vez|alergia}}.',
        },
        extra: [ex('caneta', 'Tem caneta de adrenalina?', 'Tem caneta de adrenalina em casa?', 'Tem! Na gaveta. {{Venceu mês passado|vencida}}!')],
        links: [
          lk('estridor', 'alergia', 'Alérgico a abelha, boca inchando e respiração com apito: anafilaxia. Vermelho, USA. Caneta já, mesmo vencida.'), // [validar]
          lk('mole', 'boca', 'Inchaço e moleza: a pressão está caindo.', { kind: 'confirma' }),
        ],
        guide: guideIf(p.F, 'anafilaxia'),
        radio: { ok: '{central}, {unit}. Anafilaxia, a caneta segurou. Adrenalina de novo e seguimos pro Regional.' },
        diary: { alive: 'Alergia a abelha. A caneta vencida segurou até a equipe.', dead: 'Anafilaxia por abelha.' },
      }),
    },
    {
      id: 'escorpiao',
      weight: 1.5,
      build: (p) => ({
        truth: { dx: 'Picada de escorpião em adulto (só dor)', sev: 'verde', ok: ['ORI'], ref: ['UPA'] },
        note: 'Picada de bicho no quintal. Dor forte.',
        noteWrong: 'Picada de cobra! Grave, {dr}!',
        amb: ['passaros'],
        q: {
          oque: '{{Foi um escorpião amarelo|escorpiao}}! Tava no sapato!',
          consciencia: `Acordad${p.o}, gritando de dor.`,
          respira: 'Normal.',
          sangramento: 'Não.',
          idade: `${p.anos}.`,
          historico: 'Nada.',
        },
        extra: [ex('sintomas', 'Vômito, suor, falta de ar?', 'Tem vômito, suor muito forte, falta de ar, tremores?', '{{Nada disso. Só a dor no pé, que tá absurda|so_dor}}.')],
        links: [lk('escorpiao', 'so_dor', 'Escorpião em adulto, só dor no local, sem vômito nem suor: caso leve. Compressa morna e UPA para analgesia e observação.')], // RC21: dor intensa = orientação. [validar] compressa morna é do Ministério da Saúde (acidentes por escorpião), não das páginas
        radio: { excess: '{central}, {unit}. Escorpião, só dor local, {dr}. Analgesia.' },
        diary: { ori: 'Escorpião no sapato. Só dor. UPA para analgesia.' },
      }),
    },
    {
      id: 'cobra',
      weight: 1,
      build: (p) => ({
        truth: { dx: 'Picada de cobra (provável jararaca)', sev: 'amarelo', ok: ['USB'], dest: ['REG'] },
        note: 'Picada de bicho, perna inchando.',
        noteWrong: 'Picada de inseto. Leve.',
        amb: ['passaros', 'vento'],
        q: {
          oque: '{{Uma cobra no meio do mato|cobra}}, picou o tornozelo! Saiu correndo pro terreno baldio.',
          consciencia: `Acordad${p.o}, com medo.`,
          respira: 'Normal.',
          sangramento: '{{Duas marquinhas sangrando|marcas}}. O pé tá inchando e ficando roxo.',
          idade: `${p.anos}.`,
          historico: 'Nada.',
        },
        extra: [ex('orientar', 'Orientar os primeiros cuidados', 'Orientar os primeiros cuidados', 'Tá deitad' + p.o + ', parado, não amarramos nada.', { kind: 'fala', say: 'Deixe deitado e quieto, com a perna parada. Não amarre, não corte, não chupe. Tire anel, tornozeleira, sapato.' })], // campo A12 (BTox13): repouso absoluto, NÃO usar torniquete, não capturar o animal. [validar] "não cortar, não chupar" e "tirar anel" são primeiros socorros padrão
        links: [lk('cobra', 'marcas', 'Duas marcas de presa, inchaço e roxo: picada de cobra peçonhenta. O soro só existe no hospital: USB → Regional.')], // RC21: envenenamento de moderada mortalidade = USI/USB
        radio: { ok: 'Central, {unit}. Acidente botrópico provável. Seguimos pro Regional, soro avisado.' },
        diary: { alive: 'Jararaca no terreno baldio. Soro a tempo.' },
      }),
    },
  ],
});

// -----------------------------------------------------------------------------
// "Tô com uma dor de barriga que não passa."
// -----------------------------------------------------------------------------
export const DOR_BARRIGA = tpl({
  id: 'dor_barriga',
  tags: ['leve'],
  age: [18, 70],
  rel: ['proprio'],
  open: () => ['{Dr}, eu tô com uma {{dor de barriga que não passa|dor}}. Já tomei remédio e nada.'],
  truths: [
    {
      id: 'gastro',
      weight: 3,
      build: (p0) => {
        const p = p0.at(18, 60);
        return {
          who: p,
          truth: { dx: 'Gastroenterite', sev: 'verde', ok: ['ORI'], ref: ['UBS'] },
          note: 'Dor de barriga e diarreia.',
          noteWrong: 'Dor de barriga forte! Grave, {dr}!',
          type: 'exagerador',
          amb: ['silencio'],
          q: {
            oque: 'Comi um pastel na feira ontem... {{diarreia a noite toda|diarreia}}, vomitei duas vezes.',
            consciencia: `Acordad${p.o}, deitad${p.o}.`,
            respira: 'Normal.',
            inicio: 'Desde ontem à noite.',
            idade: `${p.anos}.`,
            historico: 'Nada.',
          },
          extra: [ex('liquidos', 'Bebe líquido? Faz xixi?', 'Consegue beber líquido? Está fazendo xixi?', '{{Bebo soro, faço xixi normal|hidratado}}. Sangue nas fezes não.')],
          links: [lk('diarreia', 'hidratado', 'Diarreia e vômito depois de comida da rua, bebendo e fazendo xixi: gastroenterite. Soro caseiro e UBS.')], // RC11: sem sinais de desidratação nem sangue = orientação
          radio: { excess: '{central}, {unit}. Gastroenterite, {dr}. O pastel da feira.' },
          diary: { ori: 'O pastel da feira. Soro caseiro.' },
        };
      },
    },
    {
      id: 'apendicite',
      weight: 1.5,
      build: (p0) => {
        const p = p0.at(18, 45);
        return {
          who: p,
          truth: { dx: 'Suspeita de apendicite', sev: 'amarelo', ok: ['USB'], dest: ['UPA', 'REG'] },
          note: 'Dor de barriga com febre.',
          noteWrong: 'Dor de barriga, gastroenterite.',
          amb: ['silencio'],
          q: {
            oque: '{{Começou no umbigo e desceu pro lado direito|migrou}}.',
            consciencia: `Acordad${p.o}.`,
            respira: 'Normal.',
            inicio: 'Desde ontem de tarde. Piorou hoje.',
            idade: `${p.anos}.`,
            historico: 'Nada.',
          },
          extra: [
            ex('febre', 'Febre? Fome?', 'Tem febre? Está com fome?', '{{38 de febre, e nenhuma fome|febre}}.'),
            ex('andar', 'Dói pra andar?', 'Dói mais pra andar ou tossir?', '{{Ando curvad' + p.o + '. Tossir dói muito|anda_curvado}}.'),
          ],
          links: [lk('migrou', 'febre', 'Dor que começou no umbigo e desceu para a direita, febre e sem fome: suspeita de apendicite. Amarelo, USB.')], // RC13: dor intensa = USI/USB
          radio: { ok: 'Central, {unit}. Abdome agudo, provável apendicite. Seguimos.' },
          diary: { alive: 'Apendicite. Operou no mesmo dia.' },
        };
      },
    },
    {
      id: 'colica_renal',
      weight: 1.5,
      build: (p0) => {
        const p = p0.at(25, 60);
        return {
          who: p,
          truth: { dx: 'Cólica renal sem sinais de gravidade', sev: 'verde', ok: ['ORI', 'USB'], best: 'ORI', ref: ['UPA'], dest: ['UPA'], must: must(p, 'febre', 'historico') },
          note: 'Dor forte nas costas e na barriga.',
          noteWrong: 'Dor de barriga grave!',
          amb: ['silencio'],
          q: {
            oque: `{{Dói nas costas e vai pra virilha|irradia}}. Vem em ondas, eu não paro quiet${p.o}.`,
            consciencia: `Acordad${p.o}. Andando pela casa de dor.`,
            respira: 'Normal.',
            inicio: 'Faz duas horas.',
            idade: `${p.anos}.`,
            historico: '{{Já tive pedra no rim|pedra}}.',
          },
          extra: [
            ex('febre', 'Febre? Xixi?', 'Tem febre? Como está o xixi?', '{{Febre não|sem_febre}}. O xixi tá meio rosado.'),
          ],
          links: [lk('irradia', 'pedra', 'Dor em ondas das costas para a virilha, xixi rosado, já teve pedra, sem febre: cólica renal. UPA para analgesia.')], // RC13: dor intensa = USI/USB, dor moderada = orientação; "não para quieto" fica entre as duas (⚖ ORI/USB)
          radio: { ok: 'Central, {unit}. Cólica renal. Analgesia, seguimos pra UPA.', excess: '{central}, {unit}. Cólica renal, {dr}. Tomou o remédio e já melhorou.' },
          diary: { ori: 'Cólica renal. Já conhecia a dor. UPA.', alive: 'Cólica renal. Analgesia na UPA.' },
        };
      },
    },
    {
      id: 'infarto_atipico',
      weight: 0.8,
      minDay: 3,
      build: (p0) => {
        const p = p0.at(50, 70);
        return {
          who: p,
          truth: { dx: 'Infarto inferior (dor na boca do estômago)', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 60, bad: 150 } },
          note: 'Dor de barriga, suando.',
          noteWrong: 'Gastrite, {dr}. Orienta.',
          type: 'minimizador',
          amb: ['silencio'],
          q: {
            oque: 'É {{na boca do estômago|estomago}}. Um peso. Tomei sal de frutas e nada.',
            consciencia: `Acordad${p.o}.`,
            respira: 'Meio curta.',
            inicio: 'Faz uma hora. Comecei sentad' + p.o + ' no sofá.',
            idade: `${p.anos}.`,
            historico: '{{Diabetes e pressão|diabetes}}. Fumo.',
            dorpeito: 'Vai um pouco pro queixo. E {{tô suando frio|suor}}.',
          },
          links: [
            lm(p, 'estomago', 'atipico', 'Diabético, peso na boca do estômago, suor frio: infarto sem dor clássica. USA (Manual p.3).'),
            lk('diabetes', 'suor', 'Diabetes, pressão, cigarro e suor frio: a "dor de barriga" é o coração.', { kind: 'confirma' }),
          ],
          radio: { ok: '{central}, {unit}. Infarto inferior, {dr}. "Dor de barriga" com supra. Seguimos pro Regional.' },
          diary: { alive: 'A dor de barriga era infarto. Chegou a tempo.', dead: 'Infarto que parecia dor de barriga.' },
        };
      },
    },
  ],
});

export const CLINICO = [BEBADO, PICADA, DOR_BARRIGA];
