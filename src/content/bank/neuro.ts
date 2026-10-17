// =============================================================================
// Banco — neurológico: fala enrolada, boca torta, desmaio, convulsão, confusão,
// dor de cabeça. Instruções clínicas marcadas com [validar].
// =============================================================================
import { tpl, lk, lm, must, ex, guideIf, cap, alt, prankCallback } from './kit';

// -----------------------------------------------------------------------------
// "Minha mãe tá falando enrolado." (documento de design, 5.2)
// -----------------------------------------------------------------------------
export const FALA_ENROLADA = tpl({
  id: 'fala_enrolada',
  tags: ['neuro', 'idoso', 'grave', 'moderado'],
  minDay: 6,
  age: [58, 88],
  rel: ['filho', 'filho', 'neto', 'esposa', 'marido'],
  cena: { place: 'sala' },
  open: (p) => [`{Dr}, ${p.quem} tá {{falando enrolado|enrolado}}! Eu não entendo nada do que ${p.ele} fala!`, `${cap(p.voc)}? Fala comigo, ${p.voc}!`],
  truths: [
    {
      id: 'avc_janela',
      weight: 3,
      build: (p) => ({
        // ⚖ RC1: acordado, só com sinais do FAST, na janela = USI/USB (USA só com Glasgow <9, convulsão ou suporte ventilatório); o jogo prefere USA (tempo até a trombólise).
        truth: { dx: 'AVC na janela de trombólise', sev: 'vermelho', ok: ['USA', 'USB'], best: 'USA', must: must(p, 'inicio', 'fast'), dest: ['REG'], risk: { good: 60, bad: 140, needs: 'USB' } },
        note: `${p.tipo} com fala enrolada. Começou agora há pouco.`,
        noteWrong: `${p.tipo} meio enrolad${p.o}. Acho que bebeu, {dr}.`,
        amb: ['tv', 'cozinha'],
        noise: ['[a TV ligada no jornal; uma cadeira arrasta no chão]'],
        q: {
          oque: `Tava conversando comigo normal. De repente {{deixou cair o copo da mão|copo}} e começou a falar tudo embolado.`,
          inicio: `{{Faz uns vinte minutos|vinte_min}}, {dr}. Até ali tava normal, conversando.`,
          fast: [`Pedi pra sorrir... {{a boca entortou pra um lado|boca_torta}}.`, `Levantou os braços, mas {{o direito caiu sozinho|braco_cai}}.`, '"O céu é azul"... saiu tudo errado, {dr}.'],
          consciencia: `Tá acordad${p.o}, olhando pra mim. Mas parece assustad${p.o}.`,
          respira: 'Respira normal.',
          idade: `${p.anos}.`,
          historico: 'Pressão alta. Toma o remédio quando lembra. E fuma, né.',
          paciente: [`${p.PT}: Eu... tô... b-bem... a mão... num... pega...`, '[a voz arrastada, palavras emboladas]'],
          sangramento: 'Não, não caiu, não machucou nada.',
        },
        extra: [
          ex('acucar', 'Diabetes? Mediu o açúcar?', `${p.Ele} tem diabetes? Tem aparelho pra medir o açúcar aí?`, 'Diabetes não tem. Medi no aparelho da vizinha: {{deu 118|glicemia_ok}}.'),
          ex('bebida', 'Bebeu alguma coisa?', `${p.Ele} bebeu alguma bebida alcoólica hoje?`, 'Não bebe nada, {dr}. Nem cerveja.'),
        ],
        links: [
          lk('boca_torta', 'braco_cai', 'Boca torta e braço que cai: FAST positivo. Suspeita de AVC.'),
          lm(p, 'vinte_min', 'janela', 'Começou há vinte minutos: dentro da janela de 4h30. USA → Regional (Manual p.6).'),
          lk('glicemia_ok', 'enrolado', 'Glicemia normal: não é hipoglicemia imitando AVC.', { kind: 'confirma' }),
        ],
        guide: guideIf(!p.F, 'avc'),
        radio: {
          ok: '{central}, {unit} no local. AVC na janela, FAST positivo, glicemia normal. Corremos pro Regional, tomografia avisada.',
          under: 'Central, {unit}! É AVC agudo, dentro da janela! Precisamos de suporte avançado pra ganhar tempo!',
        },
        diary: { alive: 'AVC dentro da janela. Chegou a tempo do remédio que desentope.', dead: 'AVC. A janela fechou antes do Regional.' },
      }),
    },
    {
      id: 'avc_acordou',
      weight: 2,
      build: (p) => ({
        truth: { dx: 'AVC fora da janela (acordou com os sintomas)', sev: 'amarelo', ok: ['USB'], dest: ['UPA', 'REG'], risk: { good: 120, bad: 300, needs: 'USB' } },
        // cena da videochamada (onde a história acontece)
        cena: { place: 'quarto' },
        note: `${p.tipo} acordou com a fala enrolada.`,
        noteWrong: 'Fala enrolada de repente, {dr}! Corre!',
        amb: ['radio_am', 'passaros'],
        noise: ['[um rádio AM baixinho; passarinho cantando na gaiola]'],
        q: {
          oque: `Deitou pra cochilar e {{acordou assim|acordou}}. Fui chamar e ${p.ele} já tava falando embolado.`,
          inicio: `Deitou {{faz umas cinco horas|cinco_horas}}, tava normal, rindo da televisão. Acordou agora assim.`,
          fast: ['A boca... {{tá torta, sim|boca}}.', 'O braço esquerdo {{não levanta direito|braco}}.', '"O céu é azul"... não sai, {dr}.'],
          consciencia: `Acordad${p.o}. Entende o que eu falo, aperta a minha mão, mas não consegue responder.`,
          respira: 'Normal, normal.',
          idade: `${p.anos}.`,
          historico: 'Pressão alta. Tinha parado o remédio porque acabou no posto.',
          paciente: [`${p.PT}: Hm... nhã... [tenta falar]`, '[a respiração tranquila; a fala não sai]'],
        },
        extra: [ex('acucar', 'Diabetes? Mediu o açúcar?', `${p.Ele} tem diabetes? Dá pra medir o açúcar?`, 'Diabetes não. Medi agora: deu 132.')],
        links: [
          lm(p, 'acordou', 'acordou', 'Acordou com os sintomas: o início conta da hora em que foi visto bem, cinco horas atrás (Manual p.6).'),
          lm(p, 'cinco_horas', 'janela', 'Mais de 4h30 desde a última vez em que estava bem: fora da janela. USB (Manual p.6).'),
          lk('boca', 'braco', 'Boca torta e braço fraco: FAST positivo. É AVC — a hora decide o recurso.', { kind: 'confirma' }),
        ],
        radio: {
          ok: 'Central, {unit}. AVC, mas acordou assim: fora da janela. Estável, removendo.',
          excess: '{central}, {unit}. AVC de horas, fora da janela. Estável. Dava USB, {dr}.',
        },
        diary: { alive: `AVC percebido ao acordar do cochilo. Fora da janela. Internad${p.o}, estável.` },
      }),
    },
    {
      id: 'hipoglicemia',
      weight: 1.5,
      build: (p) => ({
        // ⚖ RC10: diabético sonolento, mas reativo = USB (hipoglicemia medida; BC19 prefere USI); não reativo = USA (a piora abaixo fecha em USA).
        truth: { dx: 'Hipoglicemia grave (imitando AVC)', sev: 'vermelho', ok: ['USA', 'USB'], best: 'USA', dest: ['REG', 'UPA'], risk: { good: 50, bad: 120, needs: 'USB' } },
        // cena da videochamada (onde a história acontece)
        cena: { place: 'cozinha' },
        note: `${p.tipo} com fala enrolada, suando muito.`,
        noteWrong: `${p.tipo} meio grogue. Parece sono, {dr}.`,
        amb: ['cozinha', 'ventilador'],
        noise: [`[alguém ao fundo: "${cap(p.voc)}, olha pra mim! Olha pra mim!"]`],
        q: {
          oque: `Tá enrolad${p.o}, {{suando frio, a roupa encharcada|suor}}... e ficando mole.`,
          historico: '{{Diabetes. Toma insulina|insulina}}, de manhã e de noite.',
          inicio: 'Faz uns quinze minutos. Foi piorando rápido.',
          consciencia: `{{Tá sonolent${p.o}, responde devagarinho|sonolento}}...`,
          respira: 'Respira. Meio rápido.',
          idade: `${p.anos}.`,
          fast: ['Sorriu meio mole... os dois lados iguais, acho.', 'Levantou os dois braços, fraquinhos, mas os dois.', 'Repetir? Fala tudo arrastado, {dr}.'],
          paciente: [`${p.PT}: Hã? ...quem... tô com... calor...`, '[respiração rápida]'],
        },
        extra: [
          ex('comeu', 'Comeu hoje?', `${p.Ele} comeu hoje?`, `{{Não comeu nada desde cedo|nao_comeu}}, disse que tava enjoad${p.o}. Mas tomou a insulina igual.`),
          ex('acucar', 'Mediu o açúcar?', 'Dá pra medir a glicemia agora?', 'Peraí... o aparelhinho... {{deu 38|glicemia_baixa}}! Isso é baixo, {dr}?'),
        ],
        links: [
          lk('insulina', 'nao_comeu', 'Insulina sem comer + suor frio + fala enrolada: hipoglicemia imitando AVC.'),
          lm(p, 'suor', 'hipoglicemia', `${p.g('Diabético', 'Diabética')} em uso de insulina, ${p.g('suado e confuso', 'suada e confusa')}: hipoglicemia grave. USA (Manual p.6).`),
          lk('glicemia_baixa', 'enrolado', 'Glicemia 38: é hipoglicemia, não AVC. Vermelho, USA.'),
        ],
        worsen: [{ after: 90, lines: [`{Dr}, ${p.ele} {{parou de responder|parou}}! Não acorda!`], truth: { ok: ['USA'], best: 'USA', risk: { good: 50, bad: 120 } } }],
        radio: { ok: '{central}, {unit}. Glicemia 34! Corrigimos a glicose e acordou conversando. Era açúcar, não derrame.' },
        diary: { alive: 'Hipoglicemia que parecia AVC. Acordou com glicose na veia.', dead: 'Hipoglicemia grave. Não acordou mais.' },
      }),
    },
    {
      id: 'embriaguez',
      weight: 1.5,
      build: (p) => ({
        // [validar] RC19: alteração da consciência totalmente atribuível ao álcool = orientação; ficou amarelo/USB porque é idoso com fala arrastada (AVC não se descarta por telefone).
        truth: { dx: 'Embriaguez (fala arrastada, sem sinal de AVC)', sev: 'amarelo', ok: ['USB'], dest: ['UPA'] },
        // cena da videochamada (onde a história acontece)
        cena: { place: 'salao', props: ['bexigas', 'bolo'], cast: [{ role: 'familiar', act: 'segurando_mao' }, { role: 'curioso', act: 'rindo', at: 'fundo' }] },
        note: `${p.tipo} com fala enrolada. Tem festa no fundo, {dr}.`,
        noteWrong: 'Fala enrolada do nada! AVC, {dr}!',
        amb: ['festa', 'risadas', 'musica'],
        noise: [`[{{música alta, gente rindo|festa}}; alguém grita: "Ô ${p.nome}, a saideira!"]`],
        q: {
          oque: `É o aniversário ${p.dele}, a família toda aqui... ${p.ele} começou a falar enrolado e ficou mole no sofá.`,
          consciencia: `Acordad${p.o}. Rindo. Rindo de tudo, {dr}.`,
          respira: 'Normal.',
          inicio: 'Foi piorando desde que a festa começou. De meia hora pra cá ficou pior.',
          idade: `${p.anos}. Hoje!`,
          fast: ['Sorriu! Sorriu até demais.', 'Levantou os dois braços... e pediu música. [risadas ao fundo]', '"O céu é azul"... falou, meio mole, mas falou inteiro.'],
          historico: 'Pressão alta, toma o remédio. Ah, e {{nunca bebe|nunca_bebe}}... quer dizer, quase nunca.',
          ingestao: `Bebeu, sim: {{umas cinco caipirinhas|caipirinha}}. ${p.Ele} quase nunca bebe, {dr}.`,
          paciente: [`${p.PT}: Eu tô ÓTIM${p.o.toUpperCase()}! Quem é? É o médico? Vem pra festa, {dr}!`, '[gargalhadas ao fundo]'],
        },
        extra: [
          ex('bebida', 'Bebeu alguma coisa?', `${p.Ele} bebeu alguma bebida alcoólica hoje?`, `...Bebeu. {{Umas cinco caipirinhas|caipirinha}}. ${p.Ele} quase nunca bebe, {dr}, por isso que eu assustei.`),
          ex('caiu', 'Caiu? Bateu a cabeça?', `${p.Ele} caiu? Bateu a cabeça?`, `Não caiu, não. Tá sentad${p.o} no sofá, a gente segurando.`),
          ex('acucar', 'Diabetes? Mediu o açúcar?', `${p.Ele} tem diabetes? Dá pra medir?`, 'Diabetes não tem. O aparelho da minha tia deu 104.'),
        ],
        links: [
          lk('festa', 'enrolado', 'Festa e música ao fundo, fala arrastada: pode ser bebida. Confirme antes de concluir.'),
          lk('caipirinha', 'nunca_bebe', 'Cinco caipirinhas em quem "nunca bebe", FAST normal: embriaguez. Idoso alcoolizado cai fácil: USB para observar.'),
        ],
        radio: {
          ok: 'Central, {unit}. Embriaguez, FAST normal, glicemia normal. Levamos pra UPA observar. A família tá envergonhada.',
          excess: `{central}, {unit}. Era caipirinha, {dr}. FAST normal. ${p.g('O aniversariante', 'A aniversariante')} chamou o enfermeiro pra dançar.`,
        },
        diary: { alive: 'Fala enrolada no próprio aniversário. Caipirinha. FAST normal.' },
      }),
    },
    {
      id: 'dentadura',
      weight: 1.2,
      build: (p) => ({
        // ⚖ RC1: "dificuldade recente de articular as palavras" é USI/USB; a dentadura solta (extra "dente") justifica a orientação.
        truth: { dx: 'Dentadura solta e confusão leve ao acordar', sev: 'azul', ok: ['ORI', 'USB'], best: 'ORI', ref: ['UBS', 'CASA'], dest: ['UPA'], must: must(p, 'fast', 'dente') },
        // cena da videochamada (onde a história acontece)
        cena: { place: 'cozinha' },
        note: `${p.tipo} com a fala esquisita depois do cochilo. Parece tranquilo.`,
        noteWrong: 'Fala enrolada! Derrame, {dr}!',
        amb: ['cozinha', 'tv'],
        noise: ['[barulho de louça; a TV ligada baixinho]'],
        q: {
          oque: `Acordou do cochilo falando assim, embolado. ${p.Ele} toma remédio pra dormir.`,
          consciencia: `Acordad${p.o}. Meio grogue, mas responde tudo certinho que eu pergunto.`,
          respira: 'Normal.',
          inicio: 'Desde que acordou, faz uns dez minutos.',
          idade: `${p.anos}.`,
          fast: ['Sorriu... {{sorriu normal, os dois lados|sorriso_ok}}.', 'Levantou os dois braços, firmes. Até reclamou.', '"O céu é azul"... saiu "o xéu é aful", {dr}. Mas falou inteiro.'],
          historico: 'Pressão. E {{toma um remédio pra dormir|remedio_dormir}} que o médico passou.',
          paciente: [`${p.PT}: Eu tô bem, criatura... é essa {{dentadura que tá dançando|dentadura}}...`],
        },
        extra: [
          ex('dente', 'Usa dentadura?', `${p.Ele} usa dentadura? Está no lugar?`, [`Usa! Peraí... {{a de cima tá solta|solta}}, acabou a cola. ${cap(p.voc)}, ajeita aí...`, `${p.PT}: Pronto. Agora sim. Que vergonha. Tô ótim${p.o}, {dr}.`]),
          ex('acucar', 'Diabetes? Mediu o açúcar?', `${p.Ele} tem diabetes?`, 'Diabetes não. Deu 96 no aparelho.'),
        ],
        links: [
          lk('sorriso_ok', 'solta', 'FAST normal e dentadura solta: a "fala enrolada" era a dentadura. Orientação.'),
          lk('remedio_dormir', 'enrolado', 'Remédio para dormir explica a lentidão ao acordar. Sem sinal de AVC: observar em casa e rever a dose na UBS.', { kind: 'confirma' }),
          lk('dentadura', 'enrolado', `${p.Ele} mesm${p.o} explica: a dentadura está solta.`, { kind: 'confirma' }),
        ],
        radio: { excess: '{central}, {unit}. A "fala enrolada" era a dentadura sem cola, {dr}. Ofereceram bolo pra equipe.' },
        diary: { ori: 'Fala enrolada ao acordar. Era a dentadura sem cola. Rever o remédio de dormir na UBS.' },
      }),
    },
  ],
});

// -----------------------------------------------------------------------------
// "A boca dele ficou torta."
// -----------------------------------------------------------------------------
export const BOCA_TORTA = tpl({
  id: 'boca_torta',
  tags: ['neuro', 'grave', 'leve'],
  minDay: 6,
  age: [58, 86],
  rel: ['filho', 'neto', 'filho'],
  cena: { place: 'sala' },
  open: (p) => [`{Dr}, ${p.quem} tá com {{a boca torta|torta}}! Metade do rosto caída! É derrame?`],
  truths: [
    {
      id: 'avc',
      weight: 2.5,
      build: (p) => ({
        // ⚖ RC1: acordado, só com sinais do FAST, na janela = USI/USB (USA só com Glasgow <9, convulsão ou suporte ventilatório); o jogo prefere USA (tempo até a trombólise).
        truth: { dx: 'AVC na janela', sev: 'vermelho', ok: ['USA', 'USB'], best: 'USA', must: must(p, 'inicio', 'fast'), dest: ['REG'], risk: { good: 60, bad: 140, needs: 'USB' } },
        // cena da videochamada (onde a história acontece)
        cena: { place: 'cozinha' },
        note: `${p.tipo} com a boca torta de repente.`,
        noteWrong: 'Boca torta. Diz que acordou assim, {dr}.',
        amb: ['cozinha'],
        noise: ['[uma xícara cai e quebra]'],
        q: {
          oque: 'Tava tomando café comigo e de repente {{a boca puxou pro lado|puxou}} e a fala ficou estranha.',
          inicio: '{{Agora, faz uns quarenta minutos|quarenta_min}}.',
          fast: ['A boca torta, só a parte de baixo. A testa enruga normal.', '{{O braço direito cai|braco_cai}} quando levanta.', '"O céu é azul"... tá enrolando, {dr}.'],
          consciencia: `Acordad${p.o}, olhando pra mim assustad${p.o}.`,
          respira: 'Respira normal.',
          idade: `${p.anos}.`,
          historico: 'Pressão alta e colesterol. Fumou a vida inteira.',
          paciente: [`${p.PT}: O... b-braço... tá... pesado...`],
        },
        extra: [
          ex('olho', 'Fecha os dois olhos?', 'Peça para fechar os dois olhos com força. Fecham?', 'Fecha. Os dois fecham, apertadinho.'),
          ex('testa', 'Franze a testa?', 'Peça para franzir a testa, olhar pra cima. Os dois lados enrugam?', 'Enruga. Os dois lados iguais.'),
        ],
        links: [
          lk('puxou', 'braco_cai', 'Boca torta de repente e braço que cai: FAST positivo. AVC.'),
          lm(p, 'quarenta_min', 'janela', 'Quarenta minutos: dentro da janela de 4h30. USA → Regional (Manual p.6).'),
        ],
        guide: guideIf(!p.F, 'avc'),
        radio: { ok: '{central}, {unit}. AVC agudo na janela. Seguimos pro Regional com pré-aviso.' },
        diary: { alive: 'Boca torta no café da manhã. AVC dentro da janela.', dead: 'AVC. Chegou tarde demais.' },
      }),
    },
    {
      id: 'bell',
      weight: 2,
      build: (p) => ({
        truth: { dx: 'Paralisia facial periférica (de Bell)', sev: 'verde', ok: ['ORI', 'USB'], best: 'ORI', ref: ['UPA'], dest: ['UPA'], must: must(p, 'fast', 'olho', 'testa') },
        note: `${p.tipo} acordou com a boca torta. Fala normal.`,
        noteWrong: 'Boca torta! AVC, {dr}!',
        amb: ['ventilador'],
        noise: ['[um ventilador de pé rangendo]'],
        q: {
          oque: `Acordou assim hoje. {{Dormiu com o ventilador na cara|ventilador}}. Ontem reclamou de {{dor atrás da orelha|orelha}}.`,
          inicio: 'Acordou assim. Eu reparei faz umas três horas.',
          fast: ['Sorriu... {{a boca torta, o lado esquerdo todo caído|boca}}.', '{{Levantou os dois braços, firmes, iguais|bracos_ok}}.', '"O céu é azul": {{falou certinho|fala_ok}}, só meio chiado porque a boca não fecha.'],
          consciencia: `Acordad${p.o}, conversando, preocupad${p.o} com a cara.`,
          respira: 'Normal.',
          idade: `${p.anos}.`,
          historico: 'Nada. Saudável. Teve gripe semana passada.',
          paciente: [`${p.PT}: Eu tô bem, só não consigo segurar a água na boca. Escorre.`],
        },
        extra: [
          ex('olho', 'Fecha os dois olhos?', 'Peça para fechar os dois olhos com força. Fecham?', '{{O olho esquerdo não fecha|olho_aberto}}! Fica aberto, lacrimejando.'),
          ex('testa', 'Franze a testa?', 'Peça para franzir a testa, olhar pra cima. Os dois lados enrugam?', '{{A testa não enruga do lado esquerdo|testa}}. Do direito enruga.'),
        ],
        links: [
          lk('testa', 'torta', 'A paralisia pega o rosto inteiro de um lado, testa e olho incluídos: típico de paralisia facial periférica (de Bell), não de AVC. Precisa de médico hoje, na UPA.'), // [validar]
          lk('bracos_ok', 'fala_ok', 'Braços firmes e fala certa: só o rosto está afetado. Na dúvida o FAST manda regular; aqui a UPA resolve.'),
        ],
        radio: {
          ok: '{central}, {unit}. Paralisia facial periférica: testa e olho pegos, braço e fala normais. Levamos pra UPA.',
          excess: '{central}, {unit}. Paralisia de Bell, {dr}. Testa e olho pegos, braço e fala ótimos. Não era AVC.',
        },
        diary: { ori: 'Boca torta ao acordar. Paralisia facial periférica: olho e testa pegos, braço e fala normais.', alive: 'Paralisia facial periférica. UPA, colírio e remédio.' },
      }),
    },
    {
      id: 'ait',
      weight: 1.2,
      build: (p) => ({
        truth: { dx: 'Ataque isquêmico transitório (sintomas que passaram)', sev: 'amarelo', ok: ['USB'], dest: ['REG', 'UPA'] },
        note: `${p.tipo} com boca torta. Diz que já tá melhorando.`,
        noteWrong: 'Já passou. Acho que não é nada, {dr}.',
        amb: ['tv'],
        q: {
          oque: 'Ficou com a boca torta e o braço mole... e agora {{tá passando|passou}}. Tá quase normal.',
          inicio: 'Começou faz uns vinte minutos. Agora voltou quase tudo.',
          fast: ['Sorriu. Agora tá certinho... mas tava torto, {dr}, eu vi!', 'Levantou os dois braços. Normal agora.', '"O céu é azul": falou direitinho.'],
          consciencia: `Acordad${p.o}, conversando.`,
          respira: 'Normal.',
          idade: `${p.anos}.`,
          historico: 'Pressão alta, diabetes. E {{semana passada teve a mesma coisa, de leve|repetiu}}.',
          paciente: [`${p.PT}: Já passou, gente. Eu tô bem. Não precisa de nada, não.`],
        },
        links: [
          lk('passou', 'repetiu', 'Sintomas de AVC que somem sozinhos e já tinham acontecido antes: ataque isquêmico transitório, aviso de AVC grande. Avaliação hoje: USB.'), // [validar]
          lm(p, 'passou', 'fast', 'FAST positivo, mesmo que tenha passado, é suspeita de AVC (Manual p.6).'),
        ],
        radio: {
          ok: 'Central, {unit}. Sintomas regrediram, exame normal agora. AIT. Levando pra investigar.',
          excess: '{central}, {unit}. Já tava normal quando chegamos, {dr}. AIT: precisa investigar, mas dava USB.',
        },
        diary: { alive: `Boca torta que passou sozinha. AIT: o aviso antes do AVC grande. Internad${p.o} para investigar.` },
      }),
    },
    {
      id: 'sequela',
      weight: 0.8,
      build: (p) => ({
        truth: { dx: 'Sequela de AVC antigo (nada mudou hoje)', sev: 'azul', ok: ['ORI', 'USB'], best: 'ORI', ref: ['UBS', 'CASA'], dest: ['UPA'], must: must(p, 'inicio', 'historico') },
        // cena da videochamada (onde a história acontece)
        cena: { place: 'quarto' },
        note: `${cap(p.cWord)} chegou de viagem e achou ${p.g('o', 'a')} ${p.voc} com a boca torta.`,
        noteWrong: 'Boca torta de repente! AVC!',
        amb: ['radio_am'],
        q: {
          oque: `Eu cheguei agora de viagem, não via ${p.quem} faz dois anos... e ${p.ele} tá com a boca torta!`,
          inicio: '{{Não sei, {dr}! Eu cheguei faz uma hora|nao_sei}}. Já tava assim.',
          fast: ['Sorriu... torto, sim.', `O braço direito {{é fraquinho, ${p.ele} anda de bengala|bengala}}.`, '"O céu é azul"... fala devagar, mas fala certo.'],
          consciencia: `Acordad${p.o}, contando história.`,
          respira: 'Normal.',
          idade: `${p.anos}.`,
          historico: 'Não sei direito... pressão. {{Teve um derrame faz dois anos|derrame_antigo}}, minha tia falou.',
          paciente: [`${p.PT}: Ô, ${p.cg('meu', 'minha')} ${p.cWord}... é assim desde o derrame. Senta aí, toma um café.`],
        },
        extra: [ex('familia', 'Ligou para a família?', 'Tem alguém da família que cuida no dia a dia? Pergunta se mudou alguma coisa hoje.', ['Liguei pra minha tia agora...', 'Ela disse que {{é assim desde o derrame, tá igualzinho|desde_derrame}}.'])],
        links: [
          lk('derrame_antigo', 'torta', 'A boca torta é sequela do AVC de dois anos atrás. Nada mudou hoje: orientação e acompanhamento na UBS.'),
          lk('desde_derrame', 'bengala', 'Braço fraco e bengala desde o derrame antigo, "tá igualzinho": não há sintoma novo.', { kind: 'confirma' }),
        ],
        radio: { excess: `{central}, {unit}. Sequela de AVC antigo, {dr}. Tá igual há dois anos. ${p.cg('O', 'A')} ${p.cWord} chegou de viagem e se assustou.` },
        diary: { ori: 'Boca torta "nova" para quem chegou de viagem. Sequela de dois anos. Nada mudou.' },
      }),
    },
  ],
});

// -----------------------------------------------------------------------------
// "Ele desmaiou." (documento de design, 5.2)
// -----------------------------------------------------------------------------
export const DESMAIOU = tpl({
  id: 'desmaiou',
  tags: ['neuro', 'cardio', 'leve', 'grave'],
  age: [18, 82],
  rel: ['esposa', 'marido', 'amigo', 'testemunha'],
  open: (p) => [`${p.Quem} desmaiou, {dr}! {{Caiu duro aqui no chão|caiu}}!`],
  truths: [
    {
      id: 'vasovagal',
      weight: 4,
      build: (p0) => {
        const p = p0.at(18, 40);
        return {
          who: p,
          // ⚖ RC20/RM4: "história de inconsciência" (desmaio testemunhado) é USI/USB; jovem saudável com pródromo típico e recuperação em segundos = orientação.
          truth: { dx: 'Desmaio vasovagal', sev: 'verde', ok: ['ORI', 'USB'], best: 'ORI', ref: ['UBS', 'CASA'], dest: ['UPA'], must: must(p, 'consciencia', 'historico') },
          // cena da videochamada (onde a história acontece)
          cena: alt(p, [{ place: 'calcada', cast: [{ role: 'curioso', act: 'abanando' }, { role: 'curioso', act: 'olhando', at: 'fundo' }] }, { place: 'hospital', cast: [{ role: 'enfermeira', act: 'olhando', at: 'fundo' }, { role: 'filho', act: 'olhando', at: 'fundo', age: 'crianca' }] }, { place: 'onibus', cast: [{ role: 'passageiro', act: 'abanando' }, { role: 'passageiro', act: 'sentado' }] }]),
          note: `${p.tipo} desmaiou e já acordou.`,
          noteWrong: 'Desmaiou! Não acorda, {dr}!',
          amb: ['rua', 'multidao'],
          noise: ['[vozes em volta: "dá água pra ele", "abana, abana"]'],
          q: {
            oque: `Tava ${alt(p, ['na fila do banco, em pé no calor', 'vendo tirarem sangue do dedo do filho', 'em pé no ônibus lotado'])}... ficou branc${p.o}, suou e {{apagou|apagou}}.`,
            consciencia: `{{Já acordou, foi rapidinho, nem um minuto|acordou_rapido}}. Tá sentad${p.o}, conversando, morrendo de vergonha.`,
            respira: 'Normal.',
            inicio: 'Agora, faz uns cinco minutos.',
            idade: `${p.anos}.`,
            historico: 'Nada. Saudável. Só não tomou café hoje.',
            dorpeito: 'Dor no peito? Não, nada.',
            paciente: [`${p.PT}: Tô bem, gente, foi só uma tontura. Ficou tudo preto e quando vi tava no chão.`],
          },
          extra: [ex('antes', 'O que sentiu antes de cair?', 'Pergunta o que sentiu antes de cair.', `Disse que {{ficou tudo escuro, um enjoo, um calorão|prodromo}}, aí apagou.`)],
          links: [
            lk('acordou_rapido', 'prodromo', 'Calorão, enjoo e visão escura antes; acordou em segundos e já conversa: desmaio vasovagal típico. Orientação.'),
            lm(p, 'acordou_rapido', 'verde', `Recuperou sozinh${p.o}, conversa, sem dor no peito: caso verde (Manual p.1).`),
          ],
          radio: { excess: '{central}, {unit}. Desmaio vasovagal, já tá bem, {dr}. Tomou um suco e foi embora.' },
          diary: { ori: `Desmaio em pé, no calor. Acordou em segundos. Orientad${p.o}.` },
        };
      },
    },
    {
      id: 'arritmia',
      weight: 2,
      build: (p0) => {
        const p = p0.at(58, 82);
        return {
          who: p,
          truth: { dx: 'Desmaio por arritmia (bradicardia grave)', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 60, bad: 150 } },
          note: `${p.tipo} desmaiou. Acordou, mas tá pálid${p.o}.`,
          noteWrong: 'Desmaio comum, {dr}. Já acordou.',
          amb: ['silencio'],
          q: {
            oque: `Caiu {{de repente, sem aviso nenhum|sem_aviso}}. Nem pôs a mão na frente.`,
            consciencia: `Acordou, mas tá {{branc${p.o}, suando frio|palido}}, meio zonz${p.o}.`,
            respira: `Respira... meio cansad${p.o}.`,
            inicio: 'Agora! Uns cinco minutos.',
            idade: `${p.anos}.`,
            historico: `Problema de coração. Toma um remédio pro coração. E {{semana passada desmaiou também|ja_desmaiou}}.`,
            dorpeito: 'Diz que tá com um aperto no peito, uma fraqueza.',
            paciente: [`${p.PT}: Eu tô... fraco... o coração tá... esquisito...`],
          },
          extra: [
            ex('contar_pulso', 'Contar o pulso', `Põe dois dedos no pulso ${p.dele} e conta as batidas enquanto eu marco 15 segundos.`, ['Peraí... um... dois... três...', '[pausa longa]', 'Deu {{oito, {dr}. Bem devagarinho|pulso_lento}}.']),
          ],
          links: [
            lk('sem_aviso', 'pulso_lento', 'Desmaio sem aviso e pulso de 32 por minuto em quem tem doença do coração: bradiarritmia. Vermelho, USA.'),
            lk('ja_desmaiou', 'sem_aviso', 'Segundo desmaio sem aviso na mesma semana: suspeita de arritmia.'),
          ],
          radio: {
            ok: '{central}, {unit}. Bloqueio cardíaco, frequência 30. Marca-passo externo e seguimos pro Regional.',
            under: 'Central, {unit}! Frequência 30, paciente chocado! Precisamos de USA!',
          },
          diary: { alive: 'Desmaio sem aviso. O coração batia 30 por minuto. Marca-passo.', dead: 'Desmaio sem aviso. Arritmia.' },
        };
      },
    },
    {
      id: 'hipoglicemia',
      weight: 1.2,
      minDay: 6,
      build: (p0) => {
        const p = p0.at(30, 78);
        return {
          who: p,
          // [validar] RC10: hipoglicemia medida com alteração da consciência é USI/USB; só "não reativo" ou convulsão é USA. Aqui só abre o olho e resmunga, sem condição de engolir: mantido USA.
          truth: { dx: 'Hipoglicemia grave', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 50, bad: 120 } },
          // cena da videochamada (onde a história acontece)
          cena: { place: 'calcada' },
          note: `${p.tipo} desmaiad${p.o}, suando.`,
          noteWrong: 'Desmaio. Já tá acordando, {dr}.',
          amb: ['rua'],
          q: {
            oque: `Tava estranh${p.o}, {{suando muito|suor}}, falando coisa sem sentido... aí caiu.`,
            consciencia: '{{Não acorda direito|nao_acorda}}. Abre o olho e fecha. Resmunga.',
            respira: 'Respira, sim.',
            inicio: 'Uns dez minutos.',
            idade: `${p.anos}.`,
            historico: `{{É diabétic${p.o}, usa insulina|insulina}}.`,
            paciente: ['[um gemido]', `${p.PT}: ...hm... calor...`],
          },
          extra: [
            ex('comeu', 'Comeu hoje?', `${p.Ele} comeu hoje?`, '{{Não comeu nada desde cedo|nao_comeu}}... tava correndo com o serviço.'),
            ex('acucar', 'Tem aparelho de glicemia?', 'Tem aparelho de glicemia aí? Mede pra mim.', `Tem na bolsa ${p.dele}... {{deu 29|glicemia}}.`),
          ],
          links: [
            lm(p, 'insulina', 'hipoglicemia', `${p.g('Diabético', 'Diabética')} com insulina, ${p.g('suado, desmaiado', 'suada, desmaiada')} e sem acordar direito: hipoglicemia grave. USA (Manual p.6).`),
            lk('insulina', 'nao_comeu', 'Insulina sem comida: hipoglicemia.', { kind: 'confirma' }),
          ],
          worsen: [{ after: 90, lines: ['{Dr}, agora não acorda mais! Nem abre o olho!'] }],
          radio: { ok: '{central}, {unit}. Glicemia 29. Glicose na veia, acordou. Seguimos pro Regional.' },
          diary: { alive: 'Desmaio por hipoglicemia. Acordou com glicose.', dead: 'Hipoglicemia. Não acordou.' },
        };
      },
    },
    {
      id: 'convulsao',
      weight: 1.5,
      build: (p0) => {
        const p = p0.at(18, 45);
        return {
          who: p,
          truth: { dx: 'Crise convulsiva (já passou)', sev: 'amarelo', ok: ['USB'], dest: ['UPA'] },
          // cena da videochamada (onde a história acontece)
          cena: { place: 'calcada', cast: [{ role: 'curioso', act: 'olhando', at: 'fundo' }, { role: 'curioso', act: 'filmando', at: 'fundo' }] },
          note: `${p.tipo} caiu e tremeu. Agora dormindo.`,
          noteWrong: 'Desmaio simples. Acordou.',
          amb: ['multidao'],
          q: {
            oque: 'Caiu duro e {{tremeu todo|tremeu}}, uns dois minutos. Depois parou.',
            consciencia: `Parou de tremer. Agora tá {{dormindo pesado, respirando fundo|pos_crise}}. Não responde direito ainda.`,
            respira: 'Respira fundo, babando um pouco. Virei de lado.',
            inicio: 'Faz uns dez minutos.',
            idade: `${p.anos}.`,
            historico: '{{Tem epilepsia|epilepsia}}. Mas acho que {{parou o remédio faz uma semana|parou_remedio}}.',
            sangramento: '{{Mordeu a língua|lingua}}, tá saindo um pouco de sangue da boca.',
          },
          extra: [ex('xixi', 'Escapou xixi?', 'Escapou xixi na roupa?', 'Escapou. Molhou a calça.')],
          links: [
            lk('tremeu', 'epilepsia', `Tremor de corpo inteiro em quem tem epilepsia e parou o remédio, agora sonolent${p.o}: crise convulsiva que já passou. Amarelo, USB.`),
            lk('lingua', 'tremeu', 'Mordeu a língua e tremeu: convulsão, não desmaio simples.', { kind: 'confirma' }),
            lm(p, 'pos_crise', 'amarelo', 'Convulsão que já passou: amarelo, USB (Manual p.1).'),
          ],
          worsen: [
            {
              after: 100,
              lines: ['{Dr}! {{Começou de novo|de_novo}}! Tá tremendo de novo e nem acordou da outra!'],
              resetRisk: true,
            truth: { sev: 'vermelho', ok: ['USA'], dx: 'Crises convulsivas repetidas (estado de mal)', dest: ['REG'], risk: { good: 45, bad: 110 } },
              ...(p.F ? { guide: 'convulsao' } : {}),
            },
          ],
          radio: { ok: 'Central, {unit}. Crise convulsiva, paciente em pós-crise. Epiléptico sem remédio. Removendo pra UPA.' },
          diary: { alive: 'Convulsão na rua. Tinha parado o remédio.' },
        };
      },
    },
    {
      id: 'trote',
      weight: 1,
      build: (p) => {
        const cb = prankCallback(p);
        return {
          // 1.1: trote difícil, sem risada — a pista é a resposta às perguntas fixas, que muda a cada vez
          truth: { dx: 'Trote', sev: 'trote', ok: ['TROTE'], prankKind: 'trote' },
          note: 'Diz que o amigo desmaiou. Voz tranquila, {dr}.',
          noteWrong: 'Desmaio! Parece grave.',
          caller: 'Voz jovem',
          callerName: 'Voz jovem',
          type: 'trotista',
          voice: 'jovem_h',
          amb: ['silencio', 'ventilador'],
          noise: ['[{{um ventilador; ninguém chamando o nome do desmaiado|calmo}}]'],
          patient: { name: `"${p.first}"` },
          q: {
            oque: 'Desmaiou, {dr}. Ficou {{verde|verde}} e caiu. Do nada.',
            consciencia: '{{Tá acordado... não. Desmaiou de novo|cons}}.',
            respira: 'Respira. Normal. Quer dizer, devagar.',
            pulso: '{{Tem, forte, uns cento e vinte... não, tá fraco|pulso}}.',
            pele: 'Verde. Quer dizer... branco. Normal.',
            idade: 'Sei lá... uns... dezessete? Dezoito.',
            inicio: 'Agora. Pode mandar com a sirene.',
            historico: 'Nada. Ele é atleta.',
            paciente: ['Não dá, ele tá no banheiro. Quer dizer... no chão.'],
            referencia: 'Do lado do... do lugar lá. Perto da padaria.',
          },
          callback: cb.lines,
          links: [
            lk('pulso', 'cons', '"Forte, cento e vinte... não, fraco" e "acordado... desmaiou de novo": ninguém está examinando ninguém.'),
            lm(p, 'calmo', 'trote_sinais', 'Silêncio de quarto, nenhum desespero, pressa pela sirene: sinais de trote (Manual p.2).'),
            lk(cb.id, 'num', cb.insight),
          ],
          radio: { prank: 'Central, {unit}. Ninguém desmaiado. Uns moleques saíram correndo da esquina. Trote.' },
        };
      },
    },
  ],
});

// -----------------------------------------------------------------------------
// "Ela tá se debatendo toda!"
// -----------------------------------------------------------------------------
export const CONVULSAO = tpl({
  id: 'convulsao',
  tags: ['neuro', 'moderado', 'grave'],
  age: [18, 65],
  sex: 'F',
  rel: ['marido', 'colega', 'vizinho', 'amigo'],
  open: (p) => [`{Dr}, ${p.quem} tá {{se debatendo toda|debatendo}}! Tremendo inteira no chão!`, 'Eu não sei o que eu faço!'],
  truths: [
    {
      id: 'crise_cedeu',
      weight: 3,
      build: (p) => ({
        truth: { dx: 'Crise convulsiva que cedeu (epilepsia, esqueceu o remédio)', sev: 'amarelo', ok: ['USB'], dest: ['UPA'] },
        // cena da videochamada (onde a história acontece)
        cena: { place: 'cozinha' },
        note: `${p.tipo} convulsionando. Já tem epilepsia, parece.`,
        noteWrong: 'Convulsão que não para! Corre, {dr}!',
        amb: ['cozinha', 'gritos'],
        q: {
          oque: ['Tava na cozinha, caiu e começou a tremer toda, revirando o olho...', '{{Parou! Parou agora! Foi uns dois minutos|parou}}.'],
          consciencia: '{{Tá dormindo pesado, babando|pos_crise}}. Não responde direito ainda.',
          respira: 'Tá respirando fundo. Virei de lado como a minha mãe ensinou.',
          inicio: 'Começou faz uns cinco minutos.',
          idade: `${p.anos}.`,
          historico: '{{Ela tem epilepsia|epilepsia}}, toma remédio... {{acho que esqueceu de tomar ontem|esqueceu}}.',
          sangramento: 'Um pouquinho de sangue na boca. Mordeu a língua.',
        },
        extra: [ex('tempo', 'Quanto tempo durou?', 'Quanto tempo durou o tremor?', 'Uns dois minutos. Eu olhei no relógio do micro-ondas.')],
        links: [
          lk('epilepsia', 'esqueceu', 'Epilepsia conhecida, remédio esquecido, crise de dois minutos que parou: crise que cedeu. Amarelo, USB.'),
          lm(p, 'parou', 'amarelo', 'Convulsão que já passou: amarelo, USB (Manual p.1).'),
        ],
        worsen: [
          {
            after: 100,
            lines: ['{Dr}! {{Começou de novo|de_novo}}! E ela nem acordou da primeira!'],
            resetRisk: true,
            truth: { sev: 'vermelho', ok: ['USA'], dx: 'Crises convulsivas repetidas (estado de mal)', dest: ['REG'], risk: { good: 45, bad: 110 } },
            guide: 'convulsao',
          },
        ],
        radio: { ok: 'Central, {unit}. Pós-crise, epiléptica que esqueceu o remédio. Estável, seguimos pra UPA.' },
        diary: { alive: 'Convulsão em casa. Tinha esquecido o remédio.' },
      }),
    },
    {
      id: 'estado_mal',
      weight: 1.5,
      build: (p) => ({
        // [validar] RC7 põe "crise >5 min" e "episódios recidivantes" em USI/USB; aqui é USA por estado de mal (cianose, sem acordar entre as crises) e pela medicação de resgate.
        truth: { dx: 'Estado de mal epiléptico', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 45, bad: 110 } },
        note: `${p.tipo} convulsionando faz tempo.`,
        noteWrong: 'Convulsão. Diz que já passou, {dr}.',
        amb: ['gritos', 'choro'],
        q: {
          oque: ['Não para, {dr}! {{Já faz uns dez minutos|dez_min}}!', 'Parou um pouquinho e {{começou de novo sem ela acordar|de_novo}}!'],
          consciencia: 'Não acorda! Entre uma e outra ela não acorda!',
          respira: 'Tá roxinha em volta da boca... respira fazendo barulho.',
          inicio: 'Dez minutos! Quinze!',
          idade: `${p.anos}.`,
          historico: 'Epilepsia, desde criança. Toma dois remédios.',
        },
        links: [lk('dez_min', 'de_novo', 'Crise de mais de cinco minutos, ou uma atrás da outra sem acordar: estado de mal epiléptico. Vermelho, USA.')], // [validar]
        guide: { id: 'convulsao' },
        radio: { ok: '{central}, {unit}. Estado de mal. Medicamos, crise cedeu. Seguimos pro Regional.', under: 'Central, {unit}! Crise que não para, precisamos de suporte avançado!' },
        diary: { alive: 'Convulsão que não parava. Cedeu com a medicação da equipe.', dead: 'Convulsão que não parou.' },
      }),
    },
    {
      id: 'hipoglicemia',
      weight: 1,
      minDay: 6,
      build: (p) => ({
        truth: { dx: 'Convulsão por hipoglicemia', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 50, bad: 120 } },
        note: `${p.tipo} convulsionando. Suada.`,
        noteWrong: 'Convulsão. Deve ser epilepsia, {dr}.',
        amb: ['silencio'],
        q: {
          oque: 'Ela tava {{suando muito, tremendo|suor}}, falando esquisito... aí caiu e começou a se debater.',
          consciencia: 'Parou de debater... mas não acorda. Tá molhada de suor.',
          respira: 'Respira, sim.',
          inicio: 'Uns quinze minutos, contando antes.',
          idade: `${p.anos}.`,
          historico: '{{Diabética, usa insulina|insulina}}. {{Epilepsia não tem, nunca teve|sem_epilepsia}}.',
        },
        extra: [ex('acucar', 'Mediu o açúcar?', 'Tem aparelho de glicemia? Mede pra mim.', 'O aparelho {{deu 31|glicemia}}.')],
        links: [
          lm(p, 'insulina', 'hipoglicemia', 'Diabética com insulina, suada, convulsionando sem história de epilepsia: hipoglicemia grave. USA (Manual p.6).'),
          lk('sem_epilepsia', 'debatendo', 'Primeira convulsão da vida numa diabética suada: procure a causa — açúcar.'),
        ],
        radio: { ok: '{central}, {unit}. Glicemia 31, convulsão por hipoglicemia. Glicose na veia, acordou.' },
        diary: { alive: 'Convulsão por açúcar baixo. Acordou com glicose.', dead: 'Convulsão por hipoglicemia.' },
      }),
    },
    {
      id: 'calafrio',
      weight: 1.2,
      build: (p) => ({
        truth: { dx: 'Calafrio de febre alta (infecção urinária), não convulsão', sev: 'verde', ok: ['ORI', 'USB'], best: 'ORI', ref: ['UPA'], dest: ['UPA'], must: must(p, 'consciencia', 'febre') },
        note: `${p.tipo} tremendo muito. Tá falando.`,
        noteWrong: 'Convulsão! Corre, {dr}!',
        amb: ['ventilador'],
        q: {
          oque: 'Tá {{batendo o queixo|queixo}}, tremendo toda, enrolada no cobertor... diz que tá com frio. Com esse calor!',
          consciencia: '{{Tá acordada, falando comigo|acordada}}: "me cobre, me cobre".',
          respira: 'Respira rápido, mas fala.',
          inicio: 'Começou faz meia hora.',
          idade: `${p.anos}.`,
          historico: 'Epilepsia não. {{Tá com ardência pra fazer xixi faz três dias|xixi}}, e dor nas costas.',
          paciente: [`${p.PT}: Tô... com... frio... [dentes batendo] ...dói aqui nas costas...`],
        },
        extra: [ex('febre', 'Tem febre?', 'Ela tem febre? Mediu?', '{{39 e meio|febre}} no termômetro!')],
        links: [
          lk('acordada', 'debatendo', 'Ela treme, mas está acordada e conversando: não é convulsão. É calafrio de febre alta.'),
          lk('febre', 'xixi', 'Febre de 39,5 com ardência para urinar e dor nas costas: infecção urinária alta. UPA hoje.'), // [validar]
        ],
        radio: { ok: 'Central, {unit}. Calafrio de febre, infecção urinária alta. Consciente. Levamos pra UPA.', excess: '{central}, {unit}. Era calafrio, {dr}, não convulsão. Pielonefrite, conversando.' },
        diary: { ori: 'Tremia de calafrio, não de convulsão. Infecção urinária. UPA.', alive: 'Calafrio de febre alta. Infecção urinária.' },
      }),
    },
  ],
});

// -----------------------------------------------------------------------------
// "Meu pai tá estranho, confuso."
// -----------------------------------------------------------------------------
export const CONFUSO = tpl({
  id: 'confuso',
  tags: ['idoso', 'neuro', 'moderado'],
  age: [70, 93],
  rel: ['filho', 'neto', 'esposa', 'marido'],
  open: (p) => [`${p.Quem} tá {{estranh${p.o}, confus${p.o}|confuso}}, {dr}. Não tá falando coisa com coisa. Não parece ${p.ele}.`],
  truths: [
    {
      id: 'itu',
      weight: 3,
      build: (p) => ({
        truth: { dx: 'Delirium por infecção urinária', sev: 'amarelo', ok: ['USB'], dest: ['UPA'], risk: { good: 120, bad: 300, needs: 'USB' } },
        note: `${p.tipo} confus${p.o} desde ontem.`,
        noteWrong: `${p.g('Idoso confuso', 'Idosa confusa')}. Deve ser caduquice, {dr}.`,
        amb: ['tv'],
        q: {
          oque: `Desde ontem tá agitad${p.o}, {{não dormiu, ficou mexendo nas gavetas|agitado}}. Hoje não sabe onde tá.`,
          inicio: '{{Começou ontem e foi piorando|ontem}}.',
          consciencia: `Acordad${p.o}, mas confus${p.o}. Me chamou pelo nome da minha tia.`,
          respira: 'Normal.',
          idade: `${p.anos}.`,
          historico: `Pressão. Nunca foi assim, {dr}. Lúcid${p.o}, faz palavra cruzada.`,
          fast: 'Sorriu, levantou os braços... falou o céu é azul. Mas logo perguntou pela mãe, que morreu faz trinta anos.',
        },
        extra: [
          ex('xixi', 'Como está o xixi?', `Como está o xixi ${p.dele}? Cheiro, frequência, ardência?`, `{{Indo toda hora, cheiro forte|xixi}}, e reclamou que arde.`),
          ex('febre', 'Tem febre?', `${p.Ele} tem febre?`, '{{37 e 8|febre}}.'),
        ],
        links: [
          lk('xixi', 'agitado', 'Confusão nova em idoso, com xixi de cheiro forte, ardência e febre: infecção urinária causando delirium. Amarelo, USB.'), // [validar]
          lk('ontem', 'confuso', 'Confusão que começou ontem em quem era lúcido: é quadro novo, não "da idade".', { kind: 'confirma' }),
        ],
        radio: { ok: 'Central, {unit}. Delirium, provável infecção urinária. Febril, estável. Seguimos pra UPA.' },
        diary: { alive: 'Confusão de um dia para o outro. Infecção urinária. Voltou a fazer palavra cruzada.' },
      }),
    },
    {
      id: 'desidratacao',
      weight: 2,
      build: (p) => ({
        truth: { dx: 'Desidratação no calor (confusão)', sev: 'amarelo', ok: ['USB'], dest: ['UPA'], risk: { good: 120, bad: 300, needs: 'USB' } },
        note: `${p.tipo} caíd${p.o} e confus${p.o}. Calor, {dr}.`,
        noteWrong: 'Confusão. Parece normal da idade.',
        amb: ['ventilador'],
        q: {
          oque: `Tá caíd${p.o}, confus${p.o}... {{faz dias que não bebe água direito|nao_bebe}}. Diz que não tem sede.`,
          inicio: 'Foi ficando assim desde anteontem.',
          consciencia: `Acordad${p.o}, mas mole, respondendo devagar.`,
          respira: 'Normal.',
          idade: `${p.anos}.`,
          historico: 'Pressão, {{toma diurético|diuretico}}. E esse calor... a casa é um forno.',
        },
        extra: [
          ex('xixi', 'Como está o xixi?', `${p.Ele} está fazendo xixi?`, '{{Quase não fez xixi hoje|pouco_xixi}}, e é escurinho.'),
          ex('boca', 'Boca e língua?', 'Olha a boca e a língua: estão molhadas ou secas?', '{{Seca, a língua parece uma lixa|boca_seca}}.'),
        ],
        links: [
          lk('pouco_xixi', 'boca_seca', 'Quase sem xixi, boca seca, calor e diurético: desidratação causando confusão. Amarelo, USB.'), // [validar]
          lk('diuretico', 'nao_bebe', 'Diurético e pouca água no calor: perde líquido sem repor.', { kind: 'confirma' }),
        ],
        radio: { ok: 'Central, {unit}. Desidratação importante, pressão baixa. Soro e seguimos pra UPA.' },
        diary: { alive: 'Confusão de desidratação no calor. Soro na UPA.' },
      }),
    },
    {
      id: 'hipoglicemia',
      weight: 1.5,
      minDay: 6,
      build: (p) => ({
        // [validar] RC10: hipoglicemia medida com alteração da consciência é USI/USB; só "não reativo" ou convulsão é USA. Aqui responde cada vez menos (RM4: alteração gradual = amarelo): mantido USA, a piora fecha em não reativo.
        truth: { dx: 'Hipoglicemia grave', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 50, bad: 120 } },
        note: `${p.tipo} confus${p.o}, suando.`,
        noteWrong: `${p.g('Idoso confuso', 'Idosa confusa')}, parece demência.`,
        amb: ['silencio'],
        q: {
          oque: `Tá confus${p.o}, {{suando frio|suor}}, tremendo a mão.`,
          inicio: 'Faz uns vinte minutos que piorou.',
          consciencia: '{{Tá apagando, responde cada vez menos|apagando}}.',
          respira: 'Respira, sim.',
          idade: `${p.anos}.`,
          historico: '{{Diabetes, toma insulina|insulina}} e o comprimido também.',
        },
        extra: [ex('acucar', 'Mediu o açúcar?', 'Tem aparelho de glicemia? Mede agora.', '{{Deu 35|glicemia}}! Isso é muito baixo, né?')],
        links: [
          lm(p, 'insulina', 'hipoglicemia', `${p.g('Diabético', 'Diabética')} com insulina, suando frio e ${p.g('confuso', 'confusa')}: hipoglicemia grave. USA (Manual p.6).`),
          lk('glicemia', 'confuso', 'Glicemia 35 explica a confusão. Vermelho, USA.'),
        ],
        worsen: [{ after: 90, lines: [`{Dr}, ${p.ele} não acorda mais!`] }],
        radio: { ok: '{central}, {unit}. Hipoglicemia, 35. Glicose na veia, voltou.' },
        diary: { alive: 'Confusão de açúcar baixo. Voltou com glicose.', dead: 'Hipoglicemia em casa.' },
      }),
    },
    {
      id: 'demencia',
      weight: 1.5,
      build: (p) => {
        // cônjuge convive com a doença; filho/neto acabou de assumir o cuidado
        const conj = p.rel === 'esposa' || p.rel === 'marido';
        return {
          truth: { dx: 'Confusão habitual de Alzheimer (nada novo)', sev: 'azul', ok: ['ORI'], ref: ['UBS', 'CASA'] },
          note: conj
            ? `${p.tipo} com Alzheimer, confus${p.o} no fim da tarde. ${cap(p.cWord)} assustad${p.co}.`
            : `${p.tipo} com Alzheimer. ${cap(p.cWord)} começou a cuidar essa semana.`,
          noteWrong: `${p.tipo} confus${p.o} de repente! Pode ser AVC.`,
          amb: ['tv', 'radio_am'],
          q: {
            oque: `${p.Ele} acha que {{tá na fazenda, procurando a mãe|fazenda}}. Quer sair pra rua.`,
            inicio: conj
              ? `O médico falou que {{é assim mesmo, vai e volta|sempre_assim}}, piora no fim da tarde. Mas hoje ${p.ele} me chamou de ${p.cg('pai', 'mãe')} e eu me assustei.`
              : `A minha tia disse que {{é sempre assim, vai e volta|sempre_assim}}. Eu comecei a cuidar ${p.g('dele', 'dela')} essa semana.`,
            consciencia: `Acordad${p.o}, andando pela casa.`,
            respira: 'Normal.',
            idade: `${p.anos}.`,
            historico: '{{Tem Alzheimer, diagnosticado faz três anos|alzheimer}}. Toma o remédio do posto.',
            fast: 'Sorriu, levantou os dois braços... repetiu, rindo de mim.',
          },
          extra: [
            ex(
              'novo',
              'Febre? Algo diferente?',
              'Tem febre? Comeu, fez xixi? Alguma coisa diferente de ontem?',
              conj
                ? '{{Febre não. Comeu bem, fez xixi normal|sem_febre}}. É essa confusão que vem quando escurece.'
                : '{{Febre não. Comeu bem, fez xixi normal|sem_febre}}. Só essa confusão de sempre, a tia falou.',
            ),
          ],
          links: [
            lk('alzheimer', 'sempre_assim', 'Alzheimer diagnosticado, confusão que vai e volta igual, sem nada novo: quadro habitual. Orientar a família e a UBS.'),
            lk('sem_febre', 'confuso', 'Sem febre, sem mudança no xixi ou na comida: não há sinal de doença nova.', { kind: 'confirma' }),
          ],
          radio: {
            excess: conj
              ? `{central}, {unit}. Alzheimer, {dr}. Tá igual sempre. ${cap(p.cWord)} se assustou. Orientamos.`
              : `{central}, {unit}. Alzheimer, {dr}. Tá igual sempre, ${p.cg('o cuidador é novo', 'a cuidadora é nova')}. Orientamos.`,
          },
          diary: {
            ori: conj
              ? `Alzheimer. Uma tarde ruim, ${p.cg('o marido', 'a esposa')} se assustou. Orientad${p.co}.`
              : `Alzheimer. ${p.cg('O cuidador era novo', 'A cuidadora era nova')} e se assustou. Orientad${p.co}.`,
          },
        };
      },
    },
  ],
});

// -----------------------------------------------------------------------------
// "Tô com uma dor de cabeça que não aguento."
// -----------------------------------------------------------------------------
export const DOR_CABECA = tpl({
  id: 'dor_cabeca',
  tags: ['neuro', 'leve'],
  age: [22, 62],
  rel: ['proprio'],
  open: () => ['{Dr}, eu tô com uma {{dor de cabeça|dor}} que eu não aguento mais. Parece que a cabeça vai explodir.'],
  truths: [
    {
      id: 'enxaqueca',
      weight: 3,
      build: (p) => ({
        // [validar] RC6: "dor moderada" (intensa, mas suportável) é USI/USB e "dor leve recente" é orientação; enxaqueca habitual, igual às outras, sem sinal neurológico: ficou orientação.
        truth: { dx: 'Crise de enxaqueca', sev: 'verde', ok: ['ORI'], ref: ['UBS', 'UPA'] },
        note: 'Dor de cabeça forte. Fala normal.',
        noteWrong: 'Diz que a cabeça vai explodir! Grave, {dr}.',
        type: 'exagerador',
        amb: ['silencio'],
        q: {
          oque: 'Começou de manhã, foi aumentando. {{Lateja de um lado só|um_lado}}. Vomitei uma vez.',
          inicio: '{{Foi aumentando aos pouquinhos|aos_poucos}}, desde cedo.',
          historico: `{{Tenho enxaqueca desde ${p.g('mocinho', 'mocinha')}|enxaqueca}}. Mas essa tá forte.`,
          consciencia: 'Acordad' + p.o + ', tô de olho fechado. A luz incomoda.',
          respira: 'Normal.',
          idade: `${p.anos}.`,
          fast: 'Sorri, levantei os braços, falei "o céu é azul". Tudo normal, {dr}.',
        },
        extra: [
          ex('igual', 'É igual às outras crises?', 'Essa dor é igual às suas crises de sempre?', '{{É igual às outras|igual}}, só que mais forte. Acabou o remédio que eu tomo.'),
          ex('pescoco', 'Pescoço duro? Febre?', 'O pescoço está duro? Tem febre?', 'Não, o pescoço mexe normal. Febre não.'),
        ],
        links: [
          lk('igual', 'enxaqueca', 'Dor igual às crises de sempre, de um lado, que veio aos poucos, sem febre, exame normal: enxaqueca. Orientar.'),
          lk('aos_poucos', 'um_lado', 'Dor que veio aos poucos e lateja de um lado: padrão de enxaqueca.', { kind: 'confirma' }),
        ],
        radio: { excess: '{central}, {unit}. Enxaqueca de sempre, {dr}. Pediu pra apagar a luz da ambulância.' },
        diary: { ori: 'Crise de enxaqueca. O remédio tinha acabado.' },
      }),
    },
    {
      id: 'hsa',
      weight: 1.3,
      build: (p) => ({
        truth: { dx: 'Hemorragia subaracnóidea (dor súbita, a pior da vida)', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 60, bad: 140 } },
        // cena da videochamada (onde a história acontece)
        cena: alt(p, [{ place: 'sala' }, { place: 'academia', pose: 'deitado' }, { place: 'banheiro', pose: 'encostado' }]),
        note: 'Dor de cabeça súbita. Voz fraca.',
        noteWrong: 'Dor de cabeça. Enxaqueca, deve ser.',
        amb: ['silencio'],
        q: {
          oque: `Foi {{de repente, como uma paulada na nuca|paulada}}, quando eu ${alt(p, ['levantei uma caixa pesada', 'tava na academia', 'fiz força no banheiro'])}.`,
          inicio: '{{Em um segundo|segundo}}. Do nada pro pior. Faz uma hora.',
          historico: 'Nunca tive dor de cabeça na vida. Pressão alta, não tomo remédio.',
          consciencia: 'Tô... tô com muito sono, {dr}...',
          respira: 'Respiro.',
          idade: `${p.anos}.`,
          fast: 'Sorri... levantei os braços... "o céu é azul". Acho que tá normal.',
        },
        extra: [
          ex('pior', 'É a pior dor da sua vida?', 'É a pior dor de cabeça da sua vida?', '{{A pior da minha vida|pior}}. Nunca senti nada assim.'),
          ex('pescoco', 'Pescoço duro? Vômito?', 'O pescoço está duro? Vomitou?', '{{O pescoço tá duro|pescoco}}, não encosto o queixo no peito. Vomitei três vezes.'),
        ],
        links: [
          lk('paulada', 'pior', 'Dor súbita, "a pior da vida", em esforço: suspeita de sangramento no cérebro (hemorragia subaracnóidea). Vermelho, USA.'), // RC6: início abrupto e "a pior dor de cabeça já sentida" = USA
          lk('segundo', 'pescoco', 'Começou em um segundo e o pescoço endureceu: não é enxaqueca.'),
        ],
        worsen: [{ after: 80, lines: ['[a voz fica arrastada]', '...{dr}... tô... com... sono...'] }],
        radio: { ok: '{central}, {unit}. Cefaleia súbita, rigidez de nuca. Suspeita de hemorragia. Seguimos pro Regional.' },
        diary: { alive: 'A pior dor de cabeça da vida, de repente. Sangramento no cérebro. Operou.', dead: 'Dor de cabeça súbita. Sangramento no cérebro.' },
      }),
    },
    {
      id: 'hipertensao',
      weight: 2,
      build: (p0) => {
        const p = p0.at(38, 62);
        return {
          who: p,
          truth: { dx: 'Pressão alta sem sinais de gravidade (remédio acabou)', sev: 'verde', ok: ['ORI', 'USB'], best: 'ORI', ref: ['UBS', 'UPA'], dest: ['UPA'], must: must(p, 'dorpeito', 'fast', 'visao') },
          // cena da videochamada (onde a história acontece)
          cena: { place: 'calcada', props: ['remedios'] },
          note: 'Dor de cabeça e pressão alta. Lúcid' + p.o + '.',
          noteWrong: 'Pressão alta! Pode ser derrame, {dr}.',
          amb: ['rua'],
          q: {
            oque: 'Medi a pressão na farmácia: {{18 por 11|pa}}. A cabeça dói aqui atrás, na nuca.',
            inicio: 'A dor começou ontem. Medi agora.',
            historico: 'Pressão alta. {{O remédio acabou faz três dias|acabou}}, o posto tá sem.',
            dorpeito: 'Dor no peito? Não, nada.',
            respira: 'Respiro bem, sem falta de ar.',
            fast: 'Sorri, levantei os dois braços, "o céu é azul". Tudo certo.',
            consciencia: `Lúcid${p.o}, lúcid${p.o}.`,
            idade: `${p.anos}.`,
          },
          extra: [ex('visao', 'Visão embaçada? Fraqueza?', 'Está enxergando bem? Alguma fraqueza, confusão, formigamento?', 'Enxergo normal. Fraqueza não, formigamento não.')],
          links: [
            lk('pa', 'acabou', 'Pressão alta porque o remédio acabou, sem sinal de lesão: urgência sem gravidade. UBS/UPA para retomar o remédio.'),
            lm(p, 'acabou', 'verde', 'Sem sinais de gravidade: verde (Manual p.1).'),
          ],
          radio: { ok: 'Central, {unit}. Pressão 18 por 11, só a dor de cabeça. Levamos pra UPA ajustar o remédio.' },
          diary: { ori: `Pressão alta porque o remédio acabou. Orientad${p.o} a voltar à UBS.` },
        };
      },
    },
    {
      id: 'monoxido',
      weight: 0.8,
      minDay: 4,
      build: (p) => ({
        truth: { dx: 'Intoxicação por monóxido de carbono (aquecedor a gás)', sev: 'amarelo', ok: ['USB'], sup: ['BOMB'], dest: ['UPA', 'REG'] },
        note: 'Dor de cabeça e enjoo. Diz que a família toda tá igual.',
        noteWrong: 'Dor de cabeça. Enxaqueca, {dr}.',
        amb: ['chuveiro'],
        noise: ['[um chuveiro pingando; um cachorro gane baixinho]'],
        q: {
          oque: 'É que... {{lá em casa todo mundo tá com dor de cabeça|todos}} hoje. E enjoo.',
          inicio: 'Começou de manhã. Piorou depois do banho.',
          historico: 'Nada, sou saudável.',
          consciencia: `Tô meio zonz${p.o}...`,
          respira: 'Respiro... meio cansad' + p.o + '.',
          idade: `${p.anos}.`,
          seguranca: 'Seguro? Acho que sim... não tem cheiro de nada.',
        },
        extra: [
          ex('onde', 'O que tem ligado na casa?', 'Onde você está agora? Tem aquecedor, fogão ou algo a gás ligado?', 'No banheiro, acabei de tomar banho. {{O aquecedor a gás do banheiro tá com a chama amarela|aquecedor}} faz uns dias. A janelinha a gente tapou por causa do pernilongo.'),
          ex('fora', 'Melhora fora de casa?', 'Quando vocês saem de casa, a dor melhora?', '{{Quando eu saio pra rua melhora|melhora_fora}}. O cachorro tá molinho também.'),
        ],
        links: [
          lk('todos', 'aquecedor', 'Família inteira com dor de cabeça e enjoo, aquecedor a gás com chama amarela em banheiro fechado: intoxicação por monóxido de carbono. Todos para fora, janelas abertas, Bombeiros.'), // [validar]
          lk('melhora_fora', 'aquecedor', 'Melhora fora de casa e até o cachorro está mole: o problema está no ar da casa.', { kind: 'confirma' }),
          lm(p, 'aquecedor', 'cena', 'Ambiente com gás é cena insegura: a equipe só entra com os Bombeiros (Manual p.4).'),
        ],
        radio: {
          ok: 'Central, {unit}. Monóxido! Aquecedor do banheiro. Família toda pra fora, Bombeiros fechando o gás. Levando os dois mais sintomáticos.',
          unsafe: 'Central, {unit}! Ambiente com gás, a equipe começou a passar mal e recuou! Cadê os Bombeiros?!',
        },
        diary: { alive: 'Família inteira com dor de cabeça. Era o aquecedor do banheiro. Monóxido.' },
      }),
    },
  ],
});

export const NEURO = [FALA_ENROLADA, BOCA_TORTA, DESMAIOU, CONVULSAO, CONFUSO, DOR_CABECA];
