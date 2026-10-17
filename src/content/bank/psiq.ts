// =============================================================================
// Banco — saúde mental (protocolo do dia 12): agitação/surto, crise emocional.
// Tema sensível: nenhum detalhe de método de autolesão; a crise com risco usa o
// roteiro "acolhimento" (CVV 188). Instruções clínicas marcadas com [validar].
// =============================================================================
import { tpl, lk, lm, ex, guideIf } from './kit';

// -----------------------------------------------------------------------------
// "Meu filho tá descontrolado! Tá quebrando as coisas!"
// -----------------------------------------------------------------------------
export const SURTO = tpl({
  id: 'surto',
  tags: ['psiq', 'moderado'],
  minDay: 12,
  age: [22, 55],
  sex: 'M',
  rel: ['mae', 'pai', 'esposa', 'vizinho'],
  open: (p) => [`{Dr}, ${p.quem} tá {{descontrolado|descontrolado}}! Tá quebrando as coisas, gritando!`],
  truths: [
    {
      id: 'psicose',
      weight: 2.5,
      build: (p) => ({
        // ⚖ RC9 (USA/USI): arma e vítimas por perto = alto risco de agredir outros → USA vai de apoio à USB para a contenção química. A USB com a PM continua sendo a melhor.
        truth: { dx: 'Surto psicótico com risco para terceiros', sev: 'amarelo', ok: ['USB', 'USA'], best: 'USB', sup: ['PM'], dest: ['UPA', 'REG'] },
        // cena da videochamada (onde a história acontece)
        cena: { place: 'porta', cast: [{ role: 'familiar', act: 'mao_na_boca', at: 'fundo' }] },
        note: 'Homem em surto. Família com medo.',
        noteWrong: 'Briga de família. Não é caso médico, {dr}.',
        amb: ['gritos', 'rua'],
        noise: ['[gritos ao longe; algo de vidro quebra]'],
        q: {
          oque: 'Faz uma semana que não dorme. {{Fala que ouve vozes|vozes}}, que a TV fala dele.',
          consciencia: 'Acordado, andando de um lado pro outro.',
          respira: 'Normal.',
          inicio: 'A semana toda sem dormir. Hoje de tarde ele ficou descontrolado.',
          idade: `${p.anos}.`,
          historico: 'Tem esquizofrenia. {{Parou o remédio faz um mês|parou}}.',
          seguranca: 'Não! {{Ele pegou uma faca de cozinha|faca}}. A gente saiu de casa, tá na calçada.',
          risco: 'Diz que vão pegar ele, que vai se defender. Ninguém machucado ainda.',
        },
        links: [
          lm(p, 'faca', 'surto', 'Agitação com faca e risco para terceiros: USB + PM (Manual p.12).'),
          lk('vozes', 'parou', 'Vozes e insônia depois de parar o remédio da esquizofrenia: surto psicótico.', { kind: 'confirma' }),
        ],
        radio: {
          ok: 'Central, {unit}. PM conteve com calma, paciente aceitou a medicação. Seguimos pra UPA.',
          unsafe: 'Central, {unit}! Paciente armado com faca, a equipe recuou! Cadê a PM?!',
        },
        diary: { alive: 'Surto depois de parar o remédio. Contido sem ninguém ferido.' },
      }),
    },
    {
      id: 'droga',
      weight: 1.5,
      build: (p) => ({
        // ⚖ RC4/RT5 (USA/USI): comportamento heteroagressivo → USA de apoio à USB para a contenção química. A USB com a PM continua sendo a melhor.
        truth: { dx: 'Agitação por intoxicação com estimulante', sev: 'amarelo', ok: ['USB', 'USA'], best: 'USB', sup: ['PM'], dest: ['UPA', 'REG'] },
        // cena da videochamada (onde a história acontece)
        cena: { place: 'sala' },
        note: 'Homem agitado e agressivo.',
        noteWrong: 'Briga em casa. Orientar, {dr}.',
        amb: ['gritos', 'musica'],
        noise: ['[música alta; gritos]'],
        q: {
          oque: 'Chegou da rua assim. Suando, falando sem parar, quebrando a sala.',
          consciencia: 'Acordado até demais. Os olhos arregalados.',
          respira: 'Rápido.',
          idade: `${p.anos}.`,
          historico: 'Nada... quer dizer. Ele usa umas coisas.',
          seguranca: `{{${p.Ele} empurrou o irmão na parede|agressao}}. Tá quebrando tudo.`,
          risco: 'Tá agressivo com a gente, sim.',
          dorpeito: 'Ele fala que o coração vai sair pela boca.',
          ingestao: 'Engolir não sei. Ele usa umas coisas, mas hoje eu não vi o que foi.',
        },
        extra: [ex('usou', 'Usou alguma coisa?', 'Ele usou alguma droga ou bebida?', '{{Usou pó, eu acho|po}}. A pupila tá enorme.')],
        links: [
          lm(p, 'agressao', 'surto', 'Agitação violenta: USB com PM de apoio (Manual p.12).'),
          lk('po', 'descontrolado', 'Estimulante explica a agitação, o suor e o coração disparado.', { kind: 'confirma' }),
        ],
        radio: { ok: 'Central, {unit}. Intoxicação por cocaína, agitado, PM no apoio. Sedado, seguimos pra UPA.', unsafe: 'Central, {unit}! Paciente partiu pra cima! Sem PM a gente não entra!' },
        diary: { alive: 'Agitação por cocaína. Ninguém mais se machucou.' },
      }),
    },
    {
      id: 'hipoglicemia',
      weight: 1,
      build: (p) => ({
        // ⚖ RC10: diabético confuso e agitado, mas reativo = USB (alteração da consciência); USA é a melhor (pode apagar a qualquer momento).
        truth: { dx: 'Hipoglicemia grave (agitação e confusão)', sev: 'vermelho', ok: ['USA', 'USB'], best: 'USA', dest: ['REG', 'UPA'], risk: { good: 50, bad: 120, needs: 'USB' } },
        note: 'Homem agitado, confuso.',
        noteWrong: 'Surto psicótico, precisa de PM.',
        amb: ['silencio'],
        q: {
          oque: 'Tá agressivo, confuso, {{suando frio|suor}}. Não é ele, {dr}, ele é calmo!',
          consciencia: 'Acordado, mas não fala coisa com coisa. Cambaleando.',
          respira: 'Normal.',
          idade: `${p.anos}.`,
          historico: '{{Ele é diabético, toma insulina|insulina}}. Doença da cabeça nunca teve.',
          seguranca: 'Ele tá mais confuso que perigoso. Mal para em pé.',
          risco: 'Ninguém em perigo. Ele empurrou a cadeira, só.',
        },
        extra: [ex('acucar', 'Mediu o açúcar?', 'Tem aparelho de glicemia? Dá pra medir?', 'Deu {{32|glicemia}}! É isso, {dr}?')],
        links: [
          lm(p, 'suor', 'hipoglicemia', 'Diabético com insulina, suado, confuso e agressivo: hipoglicemia, não surto. USA (Manual p.6).'),
          lk('glicemia', 'descontrolado', 'Glicemia 32: a "agressividade" é o cérebro sem açúcar.'),
        ],
        radio: { ok: '{central}, {unit}. Hipoglicemia, 32. Corrigimos a glicose e ele acordou pedindo desculpa. Não era surto.' },
        diary: { alive: 'A "agressividade" era açúcar baixo. Pediu desculpa à família.', dead: 'Hipoglicemia confundida com surto.' },
      }),
    },
    {
      id: 'discussao',
      weight: 1.2,
      build: (p) => ({
        truth: { dx: 'Discussão familiar sem doença nem risco', sev: 'azul', ok: ['ORI'], ref: ['CASA'] },
        // cena da videochamada (onde a história acontece)
        cena: { vazio: true, place: 'corredor', first: 'A porta do quarto fechada; música alta lá dentro.', volta: 'O corredor; a porta do quarto trancada. Ninguém machucado.' },
        note: 'Briga em casa. Ninguém ferido.',
        noteWrong: 'Surto! Precisa de PM, {dr}!',
        amb: ['musica'],
        noise: ['[música alta atrás de uma porta fechada]'],
        q: {
          oque: 'Ele perdeu o emprego hoje, chegou bravo, gritou, bateu a porta do quarto.',
          consciencia: 'Acordado. Trancado no quarto.',
          respira: 'Normal.',
          idade: `${p.anos}.`,
          historico: '{{Doença nenhuma. Nunca foi assim|nenhuma}}.',
          seguranca: 'Seguro. Ele só tá bravo.',
          risco: '{{Machucar não machucou ninguém|ninguem}}. Nem falou nada disso.',
          paciente: [`${p.PT}: ${p.rel === 'vizinho' ? 'Vai cuidar da sua vida' : 'Me deixa em paz'}! Eu tô bem, só quero ficar sozinho!`],
        },
        links: [lk('ninguem', 'nenhuma', 'Raiva depois de uma perda, sem doença e sem risco para ninguém: não é emergência médica. Orientar; se houver ameaça ou violência, acionar a polícia.')],
        radio: { excess: '{central}, {unit}. Discussão de família, {dr}. Ninguém doente.' },
        diary: { ori: 'Perdeu o emprego e brigou em casa. Orientados.' },
      }),
    },
    {
      id: 'abstinencia',
      weight: 1,
      build: (p) => ({
        // ⚖ RC19 (USA/USI): "síndrome de abstinência alcoólica grave" (alucinação, delírio, sudorese) → USA/USI. Sem USI no jogo, USB segue como melhor; USA defensável.
        truth: { dx: 'Abstinência alcoólica grave (delirium)', sev: 'amarelo', ok: ['USB', 'USA'], best: 'USB', dest: ['UPA', 'REG'] },
        note: 'Homem tremendo, confuso.',
        noteWrong: 'Bêbado fazendo escândalo.',
        amb: ['silencio'],
        q: {
          oque: 'Tá tremendo todo, suando, {{vendo bicho na parede|bichos}}.',
          consciencia: 'Acordado, assustado. Fala com quem não tá aqui.',
          respira: 'Rápido.',
          inicio: 'O tremor começou ontem. Hoje piorou e ele começou a ver bicho.',
          idade: `${p.anos}.`,
          historico: 'Bebe todo dia, muito. {{Parou de beber faz três dias|parou_beber}}, prometeu pra família.',
          seguranca: 'Ele tá com medo, não tá violento. Escondido atrás do sofá.',
          risco: 'Perigo pra ninguém. Ele tá apavorado.',
          ingestao: 'Hoje, nada. {{Parou de beber faz três dias|parou_beber}}.',
        },
        links: [lk('bichos', 'parou_beber', 'Parou de beber há três dias: tremor, suor e alucinações. Abstinência grave (delirium tremens). USB.')], // RC19: abstinência com tremor, sudorese e alucinação (ver ⚖ acima)
        radio: { ok: 'Central, {unit}. Abstinência alcoólica com alucinação. Medicado, seguimos.' },
        diary: { alive: 'Parou de beber de uma vez e viu bichos na parede. Tratado.' },
      }),
    },
  ],
});

// -----------------------------------------------------------------------------
// "Eu não sei nem por que eu liguei. Eu não aguento mais."
// -----------------------------------------------------------------------------
export const CRISE_EMOCIONAL = tpl({
  id: 'crise_emocional',
  tags: ['psiq', 'leve', 'moderado'],
  minDay: 12,
  age: [17, 60],
  rel: ['proprio'],
  open: () => ['Alô... {{eu não sei nem por que eu liguei|nao_sei}}. Eu não tô bem. Eu não aguento mais.'],
  truths: [
    {
      id: 'risco',
      weight: 2.5,
      build: (p) => ({
        truth: { dx: 'Crise emocional com risco', sev: 'amarelo', ok: ['USB'], dest: ['UPA'] },
        note: 'Voz muito baixa. Diz que não aguenta mais.',
        noteWrong: 'Desabafo. Só quer conversar, {dr}.',
        amb: ['silencio'],
        q: {
          oque: 'Perdi o emprego, a pessoa que eu amava foi embora... faz dias que eu não durmo.',
          consciencia: 'Acordad' + p.o + '. Cansad' + p.o + '.',
          respira: 'Respiro.',
          inicio: 'Faz dias. Hoje foi o pior.',
          idade: `${p.anos}.`,
          historico: 'Já tive depressão. Parei o tratamento.',
          risco: ['...Eu penso em sumir, {dr}. {{Penso em não acordar mais|risco}}.', 'Não fiz nada. Ainda não.'],
          seguranca: 'Tô em casa.',
        },
        extra: [ex('sozinho', 'Tem alguém com você?', 'Tem alguém aí com você agora?', `{{Tô sozinh${p.o} em casa|sozinho}}. Minha irmã mora aqui perto.`)],
        links: [
          lm(p, 'risco', 'crise', `Ideia de morte, sozinh${p.o} em casa: crise com risco. USB + acolhimento; a ligação não pode cair. CVV 188 (Manual p.12).`),
          lm(p, 'sozinho', 'acolher', 'Perguntar quem está perto; não julgar, não apressar (Manual p.12).', { kind: 'confirma' }),
        ],
        guide: { id: 'acolhimento' },
        radio: { ok: 'Central, {unit}. Chegamos, a irmã também. Aceitou ir com a gente. Obrigado por segurar a linha.' },
        diary: { alive: 'Ligou sem saber por quê. A irmã chegou junto com a equipe.' },
      }),
    },
    {
      id: 'panico',
      weight: 2,
      build: (p) => ({
        truth: { dx: 'Crise de pânico sem risco', sev: 'verde', ok: ['ORI'], ref: ['UBS', 'CASA'] },
        note: 'Pessoa em crise de pânico, parece.',
        noteWrong: 'Crise com risco! Cuidado, {dr}.',
        amb: ['respiracao'],
        noise: ['[respiração rápida e curta]'],
        q: {
          oque: 'O coração disparou, as mãos formigando, eu achei que ia morrer... de novo.',
          consciencia: `Acordad${p.o}.`,
          respira: 'Rápido, rápido...',
          idade: `${p.anos}.`,
          historico: '{{Já tive crise de pânico|panico}}. Faço tratamento no posto, mas faltei.',
          risco: '{{Não, não penso em me machucar|sem_risco}}. Eu tenho medo é de morrer disso.',
          dorpeito: 'Não dói, é um aperto de medo.',
        },
        links: [
          lk('panico', 'sem_risco', 'Crise de pânico conhecida, sem ideia de se machucar: respiração guiada e retomar o tratamento.'),
          lm(p, 'sem_risco', 'ansiedade', 'Formigamento e medo de morrer, fala frases: crise de ansiedade. Respiração guiada (Manual p.5-B).'),
        ],
        guide: guideIf(p.F, 'respiracao', true),
        radio: { excess: '{central}, {unit}. Crise de pânico, já melhor, {dr}.' },
        diary: { ori: 'Crise de pânico. Respiramos juntos. Voltou ao tratamento.' },
      }),
    },
    {
      id: 'solidao',
      weight: 1.5,
      build: (p0) => {
        const p = p0.at(70, 88);
        return {
          who: p,
          truth: { dx: 'Solidão no aniversário de casamento (sem risco)', sev: 'azul', ok: ['ORI'], ref: ['UBS', 'CASA'] },
          // cena da videochamada (onde a história acontece)
          cena: { place: 'quarto' },
          note: `${p.tipo} sozinh${p.o}. Só quer conversar, parece.`,
          noteWrong: 'Crise com risco, {dr}. Cuidado.',
          amb: ['radio_am', 'silencio'],
          noise: ['[um rádio antigo tocando uma valsa]'],
          q: {
            oque: `Faz dois anos que ${p.g('a minha Maria', 'o meu Zé')} morreu. Hoje seria nosso aniversário de casamento.`,
            consciencia: `Acordad${p.o}, {dr}.`,
            respira: 'Respiro bem.',
            inicio: 'Hoje o dia inteiro, {dr}. Esse dia pesa.',
            idade: `${p.anos}.`,
            historico: 'Pressão. Tomo os remédios direitinho.',
            risco: '{{Não, {dr}, não é isso, não|sem_risco}}. Eu só queria ouvir alguém.',
          },
          extra: [
            ex('familia', 'Tem família por perto?', 'Tem família por perto?', 'Meu filho mora em São Paulo. {{Liga domingo|domingo}}.'),
            ex('conversar', 'Conversar um pouco', 'Conversar um pouco', [`${p.g('Ela', 'Ele')} gostava dessa valsa... a gente dançou no casamento.`, `...Obrigad${p.o}, {dr}. Fazia tempo que ninguém me perguntava nada.`], {
              kind: 'fala',
              cost: 15,
              say: 'Me conta: como vocês se conheceram?',
              onAsk: (e) => e.add('humanidade', 1, 'escutou'),
            }),
          ],
          links: [lk('sem_risco', 'domingo', 'Solidão no aniversário de casamento, sem risco: escutar, orientar grupo de convivência na UBS e o CVV 188.')],
          radio: { excess: `{central}, {unit}. Ninguém doente, {dr}. Tomamos um café com ${p.g('ele', 'ela')}. Falou da valsa.` },
          diary: { ori: 'Viúv' + p.o + ' no aniversário de casamento. Só queria ouvir alguém.' },
        };
      },
    },
  ],
});

export const PSIQ = [SURTO, CRISE_EMOCIONAL];
