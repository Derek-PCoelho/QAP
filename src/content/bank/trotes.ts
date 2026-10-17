// =============================================================================
// Banco — trotes e ligações ambíguas. Cada modelo tem ao menos uma verdade REAL:
// o padrão existe para ser quebrado (risada de nervoso, criança sozinha, calma de
// quem está em choque, linha aberta que é um pedido de socorro).
// =============================================================================
import { tpl, lk, lm, ex, alt, prankCallback, type P } from './kit';

// -----------------------------------------------------------------------------
// Trote clássico de adolescente: "Corre, corre! Meu amigo tá passando mal!"
// -----------------------------------------------------------------------------
export const TROTE_CLASSICO = tpl({
  id: 'trote_classico',
  tags: ['trote'],
  age: [14, 19],
  rel: ['amigo'],
  open: (p) => [`Alô, emergência? {{Corre, corre|corre}}! ${p.Quem} tá passando muito mal aqui!`],
  truths: [
    {
      id: 'trote',
      weight: 4,
      build: (p) => {
        const cb = prankCallback(p);
        return {
          truth: { dx: 'Trote', sev: 'trote', ok: ['TROTE'], prankKind: 'trote' },
          note: 'Adolescente. Tô ouvindo risada, {dr}.',
          noteWrong: 'Adolescente passando mal! Parece sério.',
          caller: 'Voz de adolescente',
          callerName: 'Voz de adolescente',
          type: 'trotista',
          voice: 'adolescente',
          amb: ['risadas', 'videogame'],
          noise: ['[{{risadas abafadas; alguém fala "para, para!"|risadas}}]'],
          patient: { name: `"${p.first}, passando mal"` },
          q: {
            oque: [`${p.Ele} comeu {{quarenta pastéis|pasteis}} e tá inchando igual balão!`, '[risada]'],
            consciencia: 'Tá... tá desmaiado! Não, tá rindo. Não! Desmaiado!',
            respira: 'Respira... tipo um aspirador de pó. [risadas]',
            idade: 'Uns... quinze? Cinquenta? [risada]',
            referencia: 'Do lado da padaria. A rosa. Não, a azul.',
            historico: 'Alergia a... a escola! [risadas]',
            sangramento: 'Sangue? Ketchup! Quer dizer, sangue! Muito!',
            paciente: ['[cochichos: "fala você!"]', `${p.Ele} não pode falar, tá inchado! [gargalhada]`],
            confronto_endereco: ['[risadas]', '[desliga]'],
            confronto_quadro: ['Ih, sujou! [risadas]', '[desliga]'],
          },
          callback: cb.lines,
          links: [
            lk('pasteis', 'risadas', 'Relato absurdo e risadas ao fundo: trote clássico.'),
            lm(p, 'risadas', 'trote_sinais', 'Risadas ao fundo e relato cinematográfico: sinais de trote (Manual p.2).'),
            lk(cb.id, 'num', cb.insight),
          ],
          radio: { prank: 'Central, {unit}. Ninguém aqui, só uns moleques correndo de bicicleta. Trote.' },
        };
      },
    },
    {
      id: 'skate',
      weight: 1,
      build: (p) => ({
        // [validar] RT6: "deformidade grosseira" = USB, mas "deformidade em membros superiores" = orientação. Aqui o braço "tá torto" e ele chora de dor: USB.
        truth: { dx: 'Fratura de braço (queda de skate)', sev: 'amarelo', ok: ['USB'], dest: ['UPA'] },
        // cena da videochamada (onde a história acontece)
        cena: { place: 'calcada' },
        note: `Adolescente. Tem risada, mas parece nervos${p.co}.`,
        noteWrong: 'Trote de moleque. Risada no fundo, {dr}.',
        caller: `${p.cFirst} (amig${p.co})`,
        voice: 'adolescente',
        amb: ['rua', 'risadas'],
        noise: ['[{{risadas nervosas; alguém fala "não tem graça, mano"|risadas}}]'],
        q: {
          oque: [`${p.Ele} tava descendo a ladeira de skate e caiu. {{O braço tá torto, mano|torto}}.`, '[risada nervosa]', 'Desculpa, a gente ri de nervoso.'],
          consciencia: `Acordad${p.o}, chorando. ${p.Ele} tá chorando, {m:moço|moça}.`,
          respira: 'Respira.',
          idade: `${p.anos}.`,
          historico: 'Nada.',
          sangramento: 'Ralou o joelho. O braço não sangra, só tá torto.',
          paciente: [`${p.PT}: {m:Moço|Moça}, dói muito... {{não é brincadeira, não|serio}}...`],
        },
        extra: [ex('cabeca', 'Bateu a cabeça? Capacete?', 'Bateu a cabeça? Estava de capacete?', 'Tava de capacete. Não desmaiou.')],
        callback: [`{{Alô! É sério, {m:moço|moça}! Manda alguém, ${p.ele} tá chorando!|retorno_ok}}`],
        links: [
          lk('torto', 'risadas', 'As risadas são de nervoso: o braço torto e o choro são reais.'),
          lk('retorno_ok', 'num', 'Ligar de volta: atenderam na hora, pedindo ajuda. Não é trote.', { kind: 'confirma' }),
          lk('serio', 'risadas', 'A própria vítima, chorando: "não é brincadeira".', { kind: 'confirma' }),
        ],
        radio: { ok: 'Central, {unit}. Fratura de antebraço no skate. Os amigos tão todos com cara de choro. Seguimos pra UPA.' },
        diary: { alive: 'Skate na ladeira. Braço quebrado. Os amigos riam de nervoso.' },
      }),
    },
    {
      id: 'coma_alcoolico',
      weight: 0.8,
      build: (p) => ({
        truth: { dx: 'Coma alcoólico em adolescente', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 50, bad: 120 } },
        // cena da videochamada (onde a história acontece)
        cena: { place: 'salao', pose: 'lateral', props: ['garrafa', 'bexigas'], cast: [{ role: 'curioso', act: 'agachado', age: 'adolescente' }, { role: 'curioso', act: 'mao_na_boca', at: 'fundo', age: 'adolescente' }] },
        note: 'Adolescente. Festa no fundo.',
        noteWrong: 'Trote de festinha, {dr}.',
        caller: `${p.cFirst} (amig${p.co})`,
        voice: 'adolescente',
        amb: ['festa', 'musica', 'risadas'],
        noise: ['[{{música de festa; alguém ri e depois grita "acorda, acorda!"|risadas}}]'],
        q: {
          oque: `${p.Ele} bebeu {{meia garrafa de vodca numa virada|vodca}}... a gente achou engraçado... agora não acorda!`,
          consciencia: 'Não acorda nem com tapa!',
          respira: '{{Respira devagar, fazendo um barulho|devagar}}.',
          idade: `${p.anos}.`,
          historico: 'Nada... nunca tinha bebido assim.',
          sangramento: 'Não.',
          ingestao: 'Vodca. Meia garrafa, numa virada, faz uns vinte minutos. A garrafa tá aqui.',
          paciente: `${p.Ele} não acorda, {m:moço|moça}! Não é brincadeira!`,
        },
        extra: [
          ex('vomito', 'Vomitou?', `${p.Ele} vomitou?`, '{{Vomitou e tá com vômito na boca|vomito}}!'),
          ex('lado', 'Orientar: virar de lado', 'Orientar: virar de lado', ['Virei! Saiu vômito da boca...', `${p.Ele} tá respirando melhor.`], { kind: 'fala', say: 'Vira de lado agora, com a boca para baixo. Ninguém dá água, café ou banho frio.' }), // campo A12 (BTox1): sem trauma, posição de recuperação e nada pela boca. [validar] "banho frio" não consta (mito comum)
        ],
        callback: ['{{Alô?! {m:Moço|Moça}, continua sem acordar!|retorno_ok}}'],
        links: [
          lk('vodca', 'devagar', 'Meia garrafa de vodca, não acorda e respira devagar: coma alcoólico. Vermelho, USA.'),
          lk('vomito', 'devagar', 'Vômito na boca de quem não acorda: risco de aspirar. Virar de lado já.'),
          lk('retorno_ok', 'num', 'Ligar de volta: atendem desesperados. Não é trote.', { kind: 'confirma' }),
        ],
        radio: { ok: '{central}, {unit}. Coma alcoólico, quinze anos. Via aérea protegida. Seguimos pro Regional.' },
        diary: { alive: 'Meia garrafa de vodca numa festa. Os amigos riam, depois choravam. Sobreviveu.', dead: 'Coma alcoólico numa festa.' },
      }),
    },
  ],
});

// -----------------------------------------------------------------------------
// Voz de criança: "Moço... a minha mãe não acorda..."
// -----------------------------------------------------------------------------
/** ponto de referência do jeito que uma criança de 5–7 anos explica */
const kidRef = (p: P) =>
  alt(p, [
    'A casa tem portão azul. Tem um mercadinho na esquina.',
    'Do lado da padaria. O portão é verde.',
    'Perto da escola. Tem um pé de manga na frente.',
    'Tem um cachorro preto no portão. E um carro velho na frente.',
  ]);

export const TROTE_CRIANCA = tpl({
  id: 'trote_crianca',
  tags: ['trote'],
  minDay: 2,
  age: [24, 42],
  sex: 'F',
  rel: ['filho'],
  open: () => ['{m:Moço|Moça}... {{a minha mãe não acorda|nao_acorda}}...'],
  truths: [
    {
      id: 'trote',
      weight: 3.5,
      build: (p) => ({
        truth: { dx: 'Trote infantil', sev: 'trote', ok: ['TROTE'], prankKind: 'trote' },
        note: 'Criança no telefone. Ouvi risadinha.',
        noteWrong: 'Criança sozinha, mãe desmaiada! Grave!',
        caller: 'Voz de criança',
        callerName: 'Voz de criança',
        type: 'crianca',
        voice: 'crianca',
        amb: ['desenho', 'risadas'],
        noise: ['[{{risadinhas; outra criança cochicha "fala que ela morreu!"|cochicho}}]', '[desenho animado alto]'],
        patient: { name: '"Mãe"' },
        q: {
          oque: ['Ela... ela caiu. E morreu! [risadinha]'],
          consciencia: 'Não acorda! ...Acordou! Não, não acordou. [risadas]',
          respira: 'Não sei... [cochicho]',
          idade: 'Minha mãe tem... cem anos!',
          referencia: 'Na minha casa, ué.',
          historico: 'Ela tem... dor de barriga de tanto rir! [risadas]',
          paciente: ['[cochicho: "desliga, desliga!"]'],
          confronto_endereco: ['[risadinha]', '[desliga]'],
        },
        callback: ['[Atende uma mulher]', `{{"Alô? Regulação? Ai, meu Deus, desculpa! Foi ${p.cg('o meu filho', 'a minha filha')} com o meu celular! Eu tô aqui do lado ${p.cg('dele', 'dela')}, tá todo mundo bem!"|retorno_mae}}`],
        links: [
          lk('cochicho', 'nao_acorda', 'Outra criança cochichando "fala que ela morreu" e risadinhas: brincadeira.'),
          lk('retorno_mae', 'num', 'Ligar de volta: a mãe atendeu, está bem — foi a criança brincando com o celular.'),
          lm(p, 'cochicho', 'crianca', 'Criança ao telefone: peça para falar com um adulto (Manual p.2).'),
        ],
        radio: { prank: 'Central, {unit}. A mãe abriu a porta com o celular na mão, morrendo de vergonha. Trote de criança.' },
      }),
    },
    {
      id: 'hipoglicemia',
      weight: 1.2,
      minDay: 6,
      build: (p) => ({
        truth: { dx: 'Hipoglicemia grave (mãe diabética desacordada, criança sozinha)', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 50, bad: 120 } },
        addr: { ...p.addrOk, ref: kidRef(p) },
        note: 'Criança diz que a mãe não acorda.',
        noteWrong: 'Criança passando trote, {dr}. Risadinha.',
        caller: 'Voz de criança',
        callerName: 'Voz de criança',
        type: 'crianca',
        voice: 'crianca',
        amb: ['silencio', 'tv'],
        noise: ['[silêncio; só a TV baixinha]'],
        q: {
          oque: 'Ela tava tremendo, suando muito... aí deitou no chão e dormiu. E não acorda.',
          consciencia: 'Eu chamei, chacoalhei... {{ela não acorda|nao_acorda2}}.',
          respira: '{{Respira, a barriga sobe|respira}}.',
          idade: 'Ela tem... trinta? Eu tenho seis.',
          historico: ['Ela {{toma uma injeção na barriga|injecao}}... do açúcar.', 'A caneta fica na geladeira.'],
          paciente: 'Ela não fala, {m:moço|moça}...',
          seguranca: 'A porta tá trancada. Só eu e ela.',
        },
        extra: [ex('adulto', 'Tem algum adulto aí?', 'Tem algum adulto aí com você?', 'Não... só eu. Meu pai tá trabalhando.')],
        callback: ['{{Alô? {m:Moço|Moça}? É você? Ela ainda não acordou...|retorno_crianca}}'],
        links: [
          lm(p, 'injecao', 'hipoglicemia', '"Injeção na barriga" guardada na geladeira: insulina. Suou, tremeu e não acorda: hipoglicemia grave. USA (Manual p.6).'),
          lk('retorno_crianca', 'num', 'Ligar de volta: a mesma criança atende, sozinha. Não é trote.', { kind: 'confirma' }),
          lm(p, 'nao_acorda2', 'crianca', 'Sem adulto consciente: regular pelo que a criança descreve (Manual p.2).'),
        ],
        guide: { id: 'hipoglicemia' },
        radio: { ok: `{central}, {unit}. Mãe com glicemia 24, glicose na veia, acordou. ${p.cg('O menino', 'A menina')} destrancou a porta pra gente. Valente.` },
        diary: { alive: 'Uma criança de seis anos ligou: a mãe não acordava. Hipoglicemia. A criança destrancou a porta.', dead: 'A criança ligou: a mãe não acordava. Hipoglicemia.' },
      }),
    },
    {
      id: 'caiu_escada',
      weight: 1,
      build: (p) => ({
        truth: { dx: 'Queda da escada com provável fratura de tornozelo', sev: 'amarelo', ok: ['USB'], dest: ['UPA'] },
        // cena da videochamada (onde a história acontece)
        cena: { place: 'escada', pose: 'encostado' },
        addr: { ...p.addrOk, ref: kidRef(p) },
        note: 'Criança ligando pela mãe.',
        noteWrong: 'Trote de criança, {dr}.',
        caller: 'Voz de criança',
        callerName: 'Voz de criança',
        type: 'crianca',
        voice: 'crianca',
        amb: ['silencio'],
        noise: ['[um gemido de mulher, longe]'],
        q: {
          oque: '{{Ela caiu da escada|escada}}. Não acordava... agora acordou, mas não levanta.',
          consciencia: 'Acordou! Tá chorando. Falou pra eu ligar pra vocês.',
          respira: 'Respira.',
          idade: 'Eu tenho sete. Ela é minha mãe.',
          historico: 'Não sei...',
          sangramento: 'Tem um pouquinho de sangue no joelho.',
          paciente: ['[passos; a criança leva o telefone]', `${p.PT}: Alô... eu caí da escada... {{não consigo pôr o pé no chão|pe}}. ${p.cg('Meu filho', 'Minha filha')} tá aqui comigo.`],
        },
        callback: ['{{Alô? Sou eu de novo, {m:moço|moça}!|retorno_crianca}}'],
        links: [
          lk('escada', 'pe', 'A própria mãe confirma: caiu da escada, acordada, não apoia o pé. Amarelo, USB.'),
          lk('retorno_crianca', 'num', 'Ligar de volta: a criança atende de novo. Não é trote.', { kind: 'confirma' }),
        ],
        radio: { ok: 'Central, {unit}. Fratura de tornozelo, consciente. A criança ajudou a gente a achar a casa.' },
        diary: { alive: `${p.cg('O filho', 'A filha')} de sete anos ligou. A mãe tinha caído da escada.` },
      }),
    },
    {
      id: 'dormindo',
      weight: 1,
      build: (p) => ({
        truth: { dx: 'Nada: mãe dormindo depois do plantão noturno', sev: 'azul', ok: ['ORI'], ref: ['CASA'] },
        // cena da videochamada (onde a história acontece)
        cena: { pose: 'cama', signs: ['olhos_fechados'] },
        addr: { ...p.addrOk, ref: kidRef(p) },
        note: 'Criança diz que a mãe não acorda. Calma, parece.',
        noteWrong: 'Mãe desmaiada, criança sozinha! Grave!',
        caller: 'Voz de criança',
        callerName: 'Voz de criança',
        type: 'crianca',
        voice: 'crianca',
        amb: ['desenho'],
        noise: ['[um ronco de adulto ao fundo]'],
        q: {
          oque: 'Ela tá dormindo e não acorda... eu tô com fome.',
          consciencia: 'Tá dormindo de boca aberta.',
          respira: 'Respira alto, ronca.',
          idade: 'Eu tenho cinco.',
          historico: 'Ela {{trabalha de noite no hospital|noite}}.',
          paciente: ['Vou chamar ela de novo... MÃÃÃE!', `${p.PT}: Hã? Quê? ...Ambulância?! Ai, meu Deus... {{eu trabalhei a noite toda, tava dormindo|plantao}}. ${p.cg('Ele', 'Ela')} tá bem, eu tô bem. Desculpa, {dr}.`],
        },
        callback: ['[Atende uma mulher sonolenta]', `{{"Alô? Ah... foi ${p.cg('meu filho', 'minha filha')}. Eu trabalhei a noite toda, tava dormindo. Tá tudo bem."|retorno_mae}}`],
        links: [
          lk('noite', 'nao_acorda', 'Mãe que trabalha à noite, dormindo pesado de dia e roncando: provavelmente só sono. Peça para a criança chamar de novo.'),
          lk('plantao', 'nao_acorda', 'A mãe acordou: dormia depois do plantão. Ninguém em perigo.'),
        ],
        radio: { excess: '{central}, {unit}. A mãe tava dormindo depois do plantão, {dr}. Colega da enfermagem, inclusive.' },
        diary: { ori: `A mãe dormia depois do plantão noturno. ${p.cg('O menino', 'A menina')} estava com fome.` },
      }),
    },
  ],
});

// -----------------------------------------------------------------------------
// Trote oportunista: "Manda uma ambulância aqui, o vizinho tá passando mal."
// -----------------------------------------------------------------------------
export const TROTE_OPORTUNISTA = tpl({
  id: 'trote_oportunista',
  tags: ['trote'],
  minDay: 2,
  age: [30, 80],
  rel: ['vizinho'],
  open: (p) => [`Manda uma ambulância aqui, rápido. {{${p.Quem} tá passando mal|passando_mal}}, aqui do lado de casa.`],
  truths: [
    {
      id: 'vinganca',
      weight: 3.5,
      build: (p) => ({
        truth: { dx: 'Trote (ambulância como vingança contra o vizinho)', sev: 'trote', ok: ['TROTE'], prankKind: 'trote' },
        note: 'Diz que o vizinho passa mal. Voz tranquila demais.',
        noteWrong: 'Vizinho caído! Grave, {dr}.',
        type: 'trotista',
        amb: ['cachorro', 'rua'],
        noise: ['[{{um cachorro latindo sem parar do outro lado do muro|cachorro}}]'],
        addr: { ...p.addrOk, ref: 'A casa com o cachorro que late a noite inteira. Não tem erro.' },
        q: {
          oque: ['Passando mal, ué. {{Caído na calçada|calcada}}.', 'Pode mandar com a sirene ligada, viu? Bem alto.'],
          consciencia: 'Ah... deve tá. Sei lá.',
          respira: 'Respira, acho.',
          idade: 'Sei lá a idade dessa pessoa.',
          historico: 'Doença? Só se for de não deixar ninguém dormir com aquele cachorro.',
          seguranca: 'Seguro, seguro. Só manda.',
          paciente: [`Não dá, ${p.ele} tá {{lá dentro de casa|dentro}}... eu tô aqui na minha.`],
        },
        extra: [
          ex('sente', 'O que está sentindo?', `O que ${p.ele} está sentindo?`, `{{Não sei, só sei que tá mal|nao_sabe}}. Manda logo, que ${p.ele} merece um susto.`),
          ex('confronto', '"Quer dar um susto no vizinho?"', `${p.cg('O senhor', 'A senhora')} está usando a ambulância pra dar um susto no vizinho?`, ['[silêncio]', 'Vocês nunca vêm mesmo! [desliga]'], { kind: 'confronto', locked: true, unlockedBy: ['sente', 'paciente', 'callback'] }),
        ],
        callback: ['[Atende a mesma pessoa, irritada]', '{{"Já falei! Vão mandar ou não vão?"|retorno_irritado}}'],
        links: [
          lk('calcada', 'dentro', '"Caído na calçada"... e agora "lá dentro de casa": o relato muda.', { unlock: 'confronto' }),
          lk('nao_sabe', 'cachorro', 'Não sabe o que o vizinho sente, reclama do cachorro e quer "um susto": ambulância usada como vingança. Trote.', { unlock: 'confronto' }),
        ],
        radio: { prank: 'Central, {unit}. O morador tava regando as plantas. Disse que é a vizinha do muro, de novo. Trote.' },
      }),
    },
    {
      id: 'taxi',
      weight: 1.5,
      build: (p) => ({
        truth: { dx: 'Dor de garganta (pedido de ambulância como transporte)', sev: 'verde', ok: ['ORI'], ref: ['UBS', 'UPA'] },
        // cena da videochamada (onde a história acontece)
        cena: { place: 'porta' },
        note: 'Vizinho passando mal. Parece leve.',
        noteWrong: 'Vizinho caído, grave!',
        type: 'exagerador',
        amb: ['rua'],
        q: {
          oque: `Dor de garganta faz três dias. ${p.Ele} quer ir pra UPA e não tem carro.`,
          consciencia: `Acordad${p.o}, sentad${p.o} na varanda, reclamando.`,
          respira: 'Normal.',
          idade: `${p.anos}.`,
          historico: 'Pressão. Toma remédio.',
          paciente: [`${p.PT}: É a garganta. Dói pra engolir. E o ônibus só passa de hora em hora.`],
        },
        extra: [ex('febre', 'Febre? Falta de ar?', `${p.Ele} tem febre? Falta de ar? Consegue engolir?`, '{{Febre baixinha. Falta de ar nenhuma|sem_gravidade}}. Come, bebe.')],
        links: [lk('sem_gravidade', 'passando_mal', 'Dor de garganta, febre baixa, come e respira bem: caso leve. A ambulância não é táxi: UPA/UBS por meios próprios.')],
        radio: { excess: '{central}, {unit}. Dor de garganta, {dr}. Queria carona pra UPA.' },
        diary: { ori: 'Dor de garganta. Queria a ambulância porque o ônibus demora.' },
      }),
    },
    {
      id: 'real',
      weight: 1.2,
      build: (p) => ({
        truth: { dx: 'Corte na cabeça após queda de bicicleta', sev: 'amarelo', ok: ['USB'], dest: ['UPA'] },
        // cena da videochamada (onde a história acontece)
        cena: { place: 'calcada', props: ['bicicleta'] },
        note: 'Vizinho ferido. Quem liga parece meio seco.',
        noteWrong: 'Trote de vizinho brigado, {dr}.',
        amb: ['rua'],
        noise: ['[um gemido do outro lado da cerca]'],
        q: {
          oque: [`${p.Ele} caiu da bicicleta na frente de casa. {{Tá com a cabeça sangrando|cabeca}}.`, `A gente não se fala, mas não vou deixar ${p.ele} ali, né?`],
          consciencia: `{{Acordad${p.o}, falando comigo|acordado}}, meio tont${p.o}.`,
          respira: 'Respira.',
          idade: `${p.anos}.`,
          historico: 'Sei que toma remédio de pressão.',
          sangramento: 'Um corte na testa, sangrando bastante. Pus uma toalha.',
          paciente: [`${p.PT}: Ai... tô tont${p.o}... ${p.g('obrigado', 'obrigada')}, viu? Mesmo a gente brigado.`],
        },
        extra: [ex('desmaiou', 'Desmaiou? Vomitou?', `${p.Ele} desmaiou? Vomitou?`, 'Não desmaiou. Vomitar não vomitou.')],
        callback: ['{{Alô? Sou eu. Ainda tô aqui com ' + p.ele + ', segurando a toalha.|retorno_ok}}'],
        links: [
          lk('cabeca', 'acordado', `Batida na cabeça com corte sangrando, ${p.g('acordado e tonto', 'acordada e tonta')}: trauma moderado. Amarelo, USB.`),
          lk('retorno_ok', 'num', 'Ligar de volta: atende na hora, ainda com a vítima. Não é trote.', { kind: 'confirma' }),
        ],
        radio: { ok: 'Central, {unit}. Corte no couro cabeludo, TCE leve. A vizinha segurou a toalha o tempo todo. Seguimos.' },
        diary: { alive: 'Caiu da bicicleta. Quem ligou foi a vizinha com quem não se falava.' },
      }),
    },
  ],
});

// -----------------------------------------------------------------------------
// Linha aberta: bolso? bebê? ou alguém que não pode falar?
// -----------------------------------------------------------------------------
export const LINHA_ABERTA = tpl({
  id: 'linha_aberta',
  tags: ['trote'],
  minDay: 2,
  age: [20, 80],
  rel: ['proprio'],
  open: () => ['[{{barulho abafado, como de tecido|abafado}}]', '[{{vozes distantes; ninguém responde ao "alô"|vozes}}]'],
  truths: [
    {
      id: 'bolso',
      weight: 3,
      build: (p) => ({
        truth: { dx: 'Ligação acidental (bolso)', sev: 'trote', ok: ['TROTE'], prankKind: 'acidental' },
        note: 'Linha aberta, ninguém fala. Bolso, acho.',
        noteWrong: 'Linha muda. Pode ser alguém sem conseguir falar, {dr}!',
        caller: 'Linha aberta',
        callerName: 'Linha aberta',
        amb: ['onibus', 'rua'],
        noise: ['[ruído de ônibus; uma conversa: "...e aí ela falou que o almoço era por conta dele..."]'],
        patient: { name: '(ligação acidental)' },
        q: {
          oque: '[ninguém responde; a conversa continua: "...não, o pastel de lá é melhor..."]',
          consciencia: '[{{risada distante, conversa animada|conversa}}]',
          respira: '[o ônibus freia; alguém dá o sinal]',
          idade: '[ninguém responde]',
          paciente: '[farfalhar de tecido]',
          referencia: '[a conversa continua, tranquila]',
        },
        callback: ['{{Alô? Ih, foi sem querer! Tava no bolso! Desculpa, {m:moço|moça}!|retorno_bolso}}'],
        links: [
          lk('conversa', 'abafado', 'Tecido abafando e uma conversa tranquila sobre almoço: ligação acidental de bolso.'),
          lk('retorno_bolso', 'num', 'Ligar de volta: a pessoa atende, ligou sem querer.'),
        ],
        radio: { prank: 'Central, {unit}. Endereço sem ocorrência. Ligação acidental. Retornando.' },
      }),
    },
    {
      id: 'bebe_celular',
      weight: 1.5,
      build: (p) => ({
        truth: { dx: 'Ligação acidental (bebê com o celular)', sev: 'trote', ok: ['TROTE'], prankKind: 'acidental' },
        note: 'Linha aberta. Parece criança brincando.',
        noteWrong: 'Linha aberta, alguém pedindo ajuda?',
        caller: 'Linha aberta',
        callerName: 'Linha aberta',
        amb: ['desenho', 'bebe'],
        noise: ['[{{um bebê balbuciando "a-ba-ba-ba"|balbucio}}; desenho animado]'],
        patient: { name: '(ligação acidental)' },
        q: {
          oque: '[balbucio: "bu-bu... papá!"]',
          consciencia: '[uma risadinha de bebê]',
          respira: '[o telefone bate no chão]',
          idade: '[barulho de brinquedo]',
          paciente: '[balbucio; alguém ao longe: "cadê o celular da mamãe?"]',
          referencia: '[o desenho continua]',
        },
        callback: ['[Atende uma mulher]', '{{"Alô? Ai, foi o bebê com o meu celular! Desculpa, desculpa!"|retorno_mae}}'],
        links: [
          lk('balbucio', 'abafado', 'Balbucio de bebê e desenho animado: o celular está na mão de uma criança pequena.'),
          lk('retorno_mae', 'num', 'Ligar de volta: a mãe confirma, foi o bebê.'),
        ],
        radio: { prank: 'Central, {unit}. Foi o bebê com o celular. Retornando.' },
      }),
    },
    {
      id: 'pedido_silencioso',
      weight: 0.8,
      minDay: 4,
      build: (p) => ({
        truth: { dx: 'Violência doméstica: pedido de socorro silencioso', sev: 'amarelo', ok: ['USB'], sup: ['PM'], dest: ['UPA'] },
        note: 'Linha aberta. Tem grito ao fundo, {dr}.',
        noteWrong: 'Ligação de bolso. Pode encerrar.',
        caller: 'Linha aberta',
        callerName: 'Linha aberta',
        type: 'disfarcado',
        amb: ['gritos', 'silencio'],
        noise: ['[{{um homem gritando; algo quebra|gritos}}]', '[alguém respira perto do telefone, sem falar]'],
        noFollowup: true,
        q: {
          oque: '[a respiração perto do fone; o homem grita: "com quem você tá falando?!"]',
          consciencia: '[um sussurro: "...sim"]',
          respira: '[respiração rápida, contida]',
          idade: '[silêncio]',
          paciente: '[um choro abafado]',
          seguranca: '[{{"...não" — quase sem voz|nao_seguro}}]',
          referencia: '[o homem: "desliga essa porcaria!"]',
        },
        extra: [
          ex('sim_nao', 'Responda só sim ou não', 'Se você não pode falar, responda só "sim" ou "não". Você está em perigo?', ['[pausa]', '{{"...sim."|perigo}}'], { unlocks: ['ferida'] }),
          ex('ferida', 'Está machucado(a)?', 'Está machucad' + p.o + '? Só sim ou não.', '{{"...sim. O braço."|ferida_braco}}', { locked: true }),
        ],
        callback: ['[Atende um homem]', '{{"Ninguém ligou daqui. Foi engano." [desliga]|retorno_homem}}'],
        links: [
          lk('perigo', 'gritos', '"Sim" sussurrado com um homem gritando ao fundo: pedido de socorro disfarçado. Violência em andamento: USB + PM.'),
          lm(p, 'nao_seguro', 'cena', 'Agressor no local: cena insegura. PM junto (Manual p.4).'),
          lk('retorno_homem', 'gritos', 'Ligar de volta: um homem atende e nega. É a mesma voz que gritava.'),
        ],
        radio: {
          ok: 'Central, {unit}. PM entrou junto. Vítima com fratura no braço, agressor detido. Seguimos pra UPA.',
          unsafe: 'Central, {unit}! O agressor tá na porta, armado! Recuamos! Cadê a PM?!',
        },
        diary: { alive: 'Uma linha aberta e um "sim" sussurrado. A PM entrou junto.' },
      }),
    },
    {
      id: 'avc_afasia',
      weight: 0.8,
      minDay: 6,
      build: (p0) => {
        const p = p0.at(62, 88);
        return {
          who: p,
          // ⚖ RC1: AVC só com sinais do FAST (aqui, perda da fala) = USI/USB; USA se Glasgow <9, convulsão ou suporte ventilatório. Sem como avaliar à distância, o jogo prefere USA.
          truth: { dx: 'AVC com perda da fala (afasia)', sev: 'vermelho', ok: ['USA', 'USB'], best: 'USA', dest: ['REG'], risk: { good: 60, bad: 140, needs: 'USB' } },
          note: 'Linha aberta, alguém gemendo. Fixo, {dr}.',
          noteWrong: 'Linha aberta. Bolso, acho.',
          caller: 'Linha aberta',
          callerName: 'Linha aberta',
          amb: ['tv', 'silencio'],
          noise: ['[{{um gemido; alguém tenta falar: "nh... nhh..."|gemido}}]', '[uma TV ligada]'],
          noFollowup: true,
          q: {
            oque: '[{{"nh... a... a..." — a voz não forma palavras|afasia}}]',
            consciencia: '[a pessoa geme quando você fala]',
            respira: '[respiração forte, regular]',
            idade: '[um gemido]',
            paciente: ['[esforço para falar]', '"...nh... aj... aju..."'],
            referencia: '[a TV continua]',
            inicio: '[silêncio]',
          },
          extra: [
            ex('bater', 'Peça duas batidas para "sim"', 'Se você está me ouvindo e precisa de ajuda, bata duas vezes no telefone.', ['[TOC TOC]', '[{{duas batidas, firmes|sim}}]']),
            ex('cadastro', 'Ver o cadastro do número', 'Consultar o cadastro do telefone fixo', `[{{Cadastro do fixo: ${p.name}, ${p.age} anos. Mora sozinh${p.o}|cadastro}}.]`, { kind: 'fala' }),
          ],
          callback: ['[{{Ocupado. O telefone ficou fora do gancho.|retorno_ocupado}}]'],
          links: [
            lk('afasia', 'sim', 'Ouve, entende e bate "sim", mas não consegue formar palavras: perda súbita da fala. Suspeita de AVC. Vermelho, USA.'),
            lk('retorno_ocupado', 'num', 'Ligar de volta: ocupado, o fone ficou fora do gancho. Não é bolso.'),
            lk('cadastro', 'gemido', `${p.g('Idoso que mora sozinho', 'Idosa que mora sozinha')} e não consegue falar: mande a viatura ao endereço do cadastro.`, { kind: 'confirma' }),
          ],
          radio: { ok: `{central}, {unit}. AVC com afasia, mora sozinh${p.o}. Achamos o fone fora do gancho. Seguimos pro Regional.` },
          diary: { alive: 'Uma linha aberta com gemidos. AVC: não conseguia falar, mas bateu duas vezes no telefone.', dead: 'Uma linha aberta com gemidos. AVC.' },
        };
      },
    },
  ],
});

// -----------------------------------------------------------------------------
// Trote sofisticado (dia 10+): voz calma, endereço real, hesitações.
// -----------------------------------------------------------------------------
export const TROTE_SOFISTICADO = tpl({
  id: 'trote_sofisticado',
  tags: ['trote'],
  minDay: 10,
  age: [70, 92],
  sex: 'F',
  rel: ['neto', 'filho', 'vizinho'],
  open: (p) => [`Olá. ${p.Quem} caiu em casa e precisa de uma ambulância. {{O endereço é ${p.addrOk.rua}, ${p.addrOk.n}, ${p.addrOk.bairro}|end_dito}}.`],
  truths: [
    {
      id: 'trote',
      weight: 4,
      build: (p) => {
        const cb = prankCallback(p);
        const errado = p.addrOk.n + 12;
        return {
          truth: { dx: 'Trote sofisticado (endereço real)', sev: 'trote', ok: ['TROTE'], prankKind: 'trote' },
          note: 'Idosa caiu. Voz calma demais, {dr}.',
          noteWrong: 'Idosa caída, parece sério, {dr}.',
          caller: 'Voz calma',
          callerName: 'Voz calma',
          type: 'trotista',
          voice: p.cF ? 'jovem_m' : 'jovem_h',
          amb: ['silencio'],
          noise: ['[{{um clique de teclado, bem baixinho|teclado}}]'],
          addr: { ...p.addrOk, ref: 'Perto da praça.' },
          patient: { name: '"Dona Maria"' },
          q: {
            oque: 'Ela caiu. Na sala. Precisa de ambulância.',
            consciencia: '{{Tá acordada... quer dizer, desmaiou|cons}}.',
            respira: 'Respira.',
            idade: '{{Uns... setenta? Setenta|idade_hesita}}.',
            inicio: 'Agora. Faz pouco.',
            historico: 'Não sei direito. Remédio de pressão, essas coisas.',
            sangramento: 'Um pouco.',
            paciente: 'Ela não pode falar agora.',
            referencia: '{{É... perto da praça|ref_vaga}}.',
          },
          extra: [
            ex('nome', 'Qual o nome dela?', 'Qual o nome completo dela?', '{{Dona... Maria. Maria|nome_hesita}}.'),
            ex('confirma_end', 'Confirmar o endereço', 'Me confirma o endereço, por favor? Rua e número.', `${p.addrOk.rua}... {{${errado}|end_errado}}. Não, ${p.addrOk.n}. Isso.`),
          ],
          callback: cb.lines,
          links: [
            lk('cons', 'idade_hesita', 'Hesita na idade e diz "acordada... desmaiou": quem liga não está vendo a vítima.'),
            lk('end_dito', 'end_errado', 'Pedindo para confirmar, o número do endereço muda: quem liga está lendo de algum lugar, não está lá.'),
            lk(cb.id, 'num', cb.insight),
            lm(p, 'nome_hesita', 'trote_sinais', 'Voz calma e endereço real, mas relato que não se sustenta: o trotista mais esperto (Manual p.2).'),
          ],
          radio: { prank: 'Central, {unit}. Casa certa, senhora certa... vendo novela. Ninguém caiu. Trote.' },
        };
      },
    },
    {
      id: 'tecnica',
      weight: 1,
      build: (p) => ({
        // [validar] RT6 (idoso >70 com fratura = USB) + Anexo VII (perfil traumato-ortopédico vai a serviço especializado): fêmur aceita UPA ou Regional.
        truth: { dx: 'Provável fratura de fêmur (quem liga é da enfermagem)', sev: 'amarelo', ok: ['USB'], dest: ['UPA', 'REG'], risk: { good: 120, bad: 320, needs: 'USB' } },
        // cena da videochamada (onde a história acontece)
        cena: { place: 'banheiro' },
        note: 'Idosa caiu. Voz calma, objetiva.',
        noteWrong: 'Voz calma demais. Trote, {dr}.',
        type: 'profissional',
        amb: ['silencio'],
        q: {
          oque: 'Queda da própria altura no banheiro. Consciente, orientada. {{Encurtamento e rotação externa da perna direita|femur}}.',
          consciencia: 'Glasgow 15. Orientada.',
          respira: 'Respira bem, sem esforço.',
          idade: `${p.age} anos.`,
          inicio: 'Faz uns vinte minutos.',
          historico: `{{Sou ${p.cg('técnico', 'técnica')} de enfermagem|tecnica}}. Ela é hipertensa, usa losartana. Não usa anticoagulante.`,
          sangramento: 'Sem sangramento.',
          paciente: [`${p.PT}: Ai... ${p.cg('o meu', 'a minha')} ${p.cWord} tá cuidando de mim. Dói o quadril.`],
        },
        extra: [
          ex('nome', 'Qual o nome dela?', 'Qual o nome completo dela?', `{{${p.name}|nome_firme}}.`),
          ex('confirma_end', 'Confirmar o endereço', 'Me confirma o endereço, por favor? Rua e número.', `{{${p.addrOk.rua}, ${p.addrOk.n}, ${p.addrOk.bairro}|end_confirmado}}. ${p.refPoint}`),
        ],
        callback: ['{{Alô, sou eu. Ela continua com dor, consciente.|retorno_ok}}'],
        links: [
          lk('tecnica', 'femur', `A calma é profissional: ${p.cg('técnico', 'técnica')} de enfermagem, relato objetivo de provável fratura de fêmur. Amarelo, USB.`),
          lk('end_dito', 'end_confirmado', 'O endereço confirma igual: quem liga está no local.', { kind: 'confirma' }),
          lk('retorno_ok', 'num', 'Ligar de volta: atende na hora. Não é trote.', { kind: 'confirma' }),
        ],
        radio: { ok: `Central, {unit}. Fratura de colo de fêmur, exatamente como ${p.cg('o técnico', 'a técnica')} descreveu. Seguimos pro hospital.` },
        diary: { alive: `Fratura de fêmur. ${p.cg('O técnico', 'A técnica')} de enfermagem descreveu tudo certinho.` },
      }),
    },
    {
      id: 'choque',
      weight: 0.7,
      build: (p) => ({
        truth: { dx: 'Parada cardiorrespiratória (quem liga em choque, voz calma)', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 30, bad: 75, guideBonus: 28 } },
        note: 'Idosa caída. Voz calma, estranha.',
        noteWrong: 'Voz calma demais. Trote, {dr}.',
        type: 'minimizador',
        amb: ['tv'],
        q: {
          oque: 'Ela caiu. Tá deitada no chão. {{Acho que tá dormindo|dormindo}}.',
          consciencia: '{{Não responde quando eu chamo|nao_responde}}.',
          respira: '{{Faz um barulho de ronco de vez em quando|agonica}}... e para.',
          idade: `${p.anos}.`,
          inicio: 'Agora. Faz uns três minutos.',
          historico: 'Coração. Ela toma uns remédios.',
          paciente: 'Ela não fala.',
        },
        extra: [ex('voce', 'Perguntar se está bem', 'E você, está bem? Tem alguém aí com você?', ['[uma pausa longa]', '...Eu não sei, {dr}. Eu não tô sentindo nada. A gente tava vendo TV.'], { kind: 'fala' })],
        callback: ['{{Alô... é... ela não acordou.|retorno_ok}}'],
        links: [
          lm(p, 'agonica', 'parada', '"Ronco de vez em quando" em quem não responde: PARADA. A calma de quem liga é choque, não trote. USA + RCP (Manual p.1).'),
          lk('dormindo', 'nao_responde', '"Dormindo"... mas não responde: a calma esconde a gravidade.'),
        ],
        guide: { id: 'rcp' },
        radio: { saved: '{central}, {unit}. Voltou com um choque. Quem fez a massagem tava em choque também, mas fez. Contou bonito.', dead: 'Central... {unit}. Óbito às {hora}. Quem ligou não chorou. Ainda vai chorar.' },
        diary: { alive: 'A voz calma era choque. A massagem começou no chão da sala.', dead: 'A voz calma era choque. Parada em casa.' },
      }),
    },
  ],
});

export const TROTES = [TROTE_CLASSICO, TROTE_CRIANCA, TROTE_OPORTUNISTA, LINHA_ABERTA, TROTE_SOFISTICADO];
