// =============================================================================
// Banco — trotes e ligações ambíguas. Cada modelo tem ao menos uma verdade REAL:
// o padrão existe para ser quebrado (risada de nervoso, criança sozinha, calma de
// quem está em choque, linha aberta que é um pedido de socorro).
//
// 1.1 (docs/roteiro-1.1/trotes-folgados.md, parte A): risada ao fundo só no trote ÓBVIO e
// engraçado (metade dos "quarenta pastéis"); todos os outros trotes são difíceis e sem risada.
// O endereço é a Simone que confere (vem no post-it); o regulador desconfia pelo que ouve:
// relato de cinema sem corpo, respostas que se enrolam nas perguntas fixas (pulso, pele,
// acordado), fundo que não combina, recusa em pôr alguém na linha, pressa pela sirene,
// Ligar de volta (caixa postal, número inexistente), quadro e vídeo.
// Risada que fica em ligação REAL é a armadilha inversa (o skate, o coma alcoólico na festa).
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
      // o ÓBVIO e engraçado do banco: o único trote com risada ao fundo
      id: 'trote',
      weight: 2,
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
            pulso: 'Tem! Tem três! Um em cada pastel! [gargalhada]',
            pele: 'Vermelho de pastel. Quer dizer, roxo! Roxo!',
            idade: 'Uns... quinze? Cinquenta? [risada]',
            referencia: 'Do lado da padaria. A rosa. Não, a azul.',
            historico: 'Alergia a... a escola! [risadas]',
            sangramento: 'Sangue? Ketchup! Quer dizer, sangue! Muito!',
            paciente: ['[cochichos: "fala você!"]', `${p.Ele} não pode falar, tá inchado! [gargalhada]`],
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
      // a mesma história, sem risada: a pista é o relato impossível e as respostas às fixas
      id: 'trote_seco',
      weight: 2,
      build: (p) => {
        const cb = prankCallback(p);
        return {
          truth: { dx: 'Trote', sev: 'trote', ok: ['TROTE'], prankKind: 'trote' },
          note: 'Adolescente. Amigo passando mal. Falou em pastel, {dr}.',
          noteWrong: 'Adolescente passando mal! Parece sério.',
          caller: 'Voz de adolescente',
          callerName: 'Voz de adolescente',
          type: 'trotista',
          voice: 'adolescente',
          amb: ['videogame'],
          noise: ['[{{um jogo pausado ao fundo: a musiquinha de pausa repetindo|pausa}}]'],
          patient: { name: `"${p.first}, passando mal"` },
          q: {
            oque: `${p.Ele} comeu {{quarenta pastéis|pasteis}}. E tá inchando. Igual balão.`,
            consciencia: 'Tá desmaiado. [pausa] É. Desmaiado.',
            respira: 'Respira. Devagar. Bem devagar. Tipo... muito devagar.',
            pulso: '{{Tem. Uns... duzentos?|pulso}}',
            pele: 'Vermelho. Não, roxo. Roxo de pastel.',
            idade: 'Quinze. Ou dezesseis.',
            historico: 'Nada. Só fome.',
            sangramento: 'Não. Quer dizer... um pouco. Do pastel.',
            paciente: ['[cochicho: "faz voz de morto"]', `${p.Ele} não consegue falar, tá cheio de pastel.`],
            seguranca: 'Seguro. Pode mandar com a sirene.',
          },
          callback: cb.lines,
          links: [
            lk('pasteis', 'pulso', 'Quarenta pastéis e um pulso de "duzentos" dito sem conferir: relato impossível, ninguém examinou ninguém.'),
            lk('pausa', 'pasteis', 'Um videogame pausado ao fundo e nenhum desespero: o "inchado" está jogando.'),
            lk(cb.id, 'num', cb.insight),
          ],
          radio: { prank: 'Central, {unit}. Casa certa, ninguém inchado. Tinha uma caixa de pastel vazia na porta, {dr}. Trote.' },
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
        note: 'Criança no telefone. Tem outra cochichando do lado, {dr}.',
        noteWrong: 'Criança sozinha, mãe desmaiada! Grave!',
        caller: 'Voz de criança',
        callerName: 'Voz de criança',
        type: 'crianca',
        voice: 'crianca',
        amb: ['desenho'],
        noise: ['[{{outra criança cochicha: "fala que ela morreu!"|cochicho}}]', '[desenho animado alto]'],
        patient: { name: '"Mãe"' },
        q: {
          oque: ['Ela... ela caiu. E morreu.', '[cochicho: "fala que tem sangue!"]', 'E tem sangue.'],
          consciencia: 'Não acorda! ...Acordou! Não, não acordou.',
          respira: ['Não sei...', '[cochicho: "fala que não"]', 'Não.'],
          pulso: 'Pulso? [cochicho: "o que é pulso?"] ...Tem. Não tem.',
          pele: ['Ela tá... verde.', '[cochicho: "azul!"]', 'Azul.'],
          idade: 'Minha mãe tem... cem anos!',
          referencia: 'Na minha casa, ué.',
          historico: 'Ela tem... dor de barriga.',
          paciente: ['[cochicho: "desliga, desliga!"]'],
        },
        callback: ['[Atende uma mulher]', `{{"Alô? Regulação? Ai, meu Deus, desculpa! Foi ${p.cg('o meu filho', 'a minha filha')} com o meu celular! Eu tô aqui do lado ${p.cg('dele', 'dela')}, tá todo mundo bem!"|retorno_mae}}`],
        links: [
          lk('cochicho', 'nao_acorda', 'Outra criança cochichando as respostas ("fala que ela morreu"): brincadeira.'),
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
        noteWrong: 'Criança passando trote, {dr}. Acho.',
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
          pulso: 'Pulso? Ah, sei lá. Deve ter. Não vou lá medir, né.',
          pele: 'Normal. Cor de vizinho chato.',
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
          consciencia: '[{{conversa animada, distante; alguém conta uma fofoca|conversa}}]',
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
            pulso: '{{Tem. Normal. Oitenta|pulso_pronto}}.',
            pele: 'Normal. Branca. Normal.',
            idade: '{{Uns... setenta? Setenta|idade_hesita}}.',
            inicio: 'Agora. Faz pouco.',
            historico: 'Não sei direito. Remédio de pressão, essas coisas.',
            sangramento: 'Um pouco.',
            paciente: 'Ela não pode falar agora.',
            referencia: '{{É... perto da praça|ref_vaga}}.',
          },
          extra: [
            ex('nome', 'Qual o nome dela?', 'Qual o nome completo dela?', '{{Dona... Maria. Maria|nome_hesita}}.'),
            ex('perto', 'Você está do lado dela?', 'Você está do lado dela agora?', '{{Tô. Quer dizer... tô no outro cômodo|longe}}. Ela tá na sala.'),
          ],
          callback: cb.lines,
          links: [
            lk('cons', 'idade_hesita', 'Hesita na idade e diz "acordada... desmaiou": quem liga não está vendo a vítima.'),
            lk('pulso_pronto', 'longe', 'O pulso "oitenta" veio na hora, sem ninguém conferir — e quem liga nem está no mesmo cômodo.'),
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
          pulso: 'Radial cheio, uns noventa. Contei agora.',
          pele: 'Corada. Um pouco pálida da dor, mas corada.',
          idade: `${p.age} anos.`,
          inicio: 'Faz uns vinte minutos.',
          historico: `{{Sou ${p.cg('técnico', 'técnica')} de enfermagem|tecnica}}. Ela é hipertensa, usa losartana. Não usa anticoagulante.`,
          sangramento: 'Sem sangramento.',
          paciente: [`${p.PT}: Ai... ${p.cg('o meu', 'a minha')} ${p.cWord} tá cuidando de mim. Dói o quadril.`],
        },
        extra: [
          ex('nome', 'Qual o nome dela?', 'Qual o nome completo dela?', `{{${p.name}|nome_firme}}.`),
          ex('perto', 'Você está do lado dela?', 'Você está do lado dela agora?', '{{Do lado. Segurando a perna dela parada|ao_lado}}.'),
        ],
        callback: ['{{Alô, sou eu. Ela continua com dor, consciente.|retorno_ok}}'],
        links: [
          lk('tecnica', 'femur', `A calma é profissional: ${p.cg('técnico', 'técnica')} de enfermagem, relato objetivo de provável fratura de fêmur. Amarelo, USB.`),
          lk('ao_lado', 'femur', 'Está ao lado da vítima e descreve o que vê: quem liga está no local.', { kind: 'confirma' }),
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

// -----------------------------------------------------------------------------
// 1.1 — Trote de cinema (dia 4+): acidente de filme, e o fundo é uma sala de TV.
// Difícil: sem risada. Pistas: ninguém mais ligou (a Simone), o ambiente (TV de auditório,
// nenhuma buzina, nenhum grito), as fixas sem corpo ("De quem? De todos"), retorno.
// -----------------------------------------------------------------------------
export const TROTE_CINEMA = tpl({
  id: 'trote_cinema',
  tags: ['trote'],
  minDay: 4,
  age: [20, 60],
  rel: ['testemunha'],
  cena: { place: 'rua', props: ['carro'] },
  open: () => ['Alô, emergência? {{Acidente feio aqui na esquina|acidente}}! Três carros! Tem gente presa nas ferragens, sangue pra todo lado!'],
  truths: [
    {
      id: 'trote',
      weight: 3.5,
      build: (p) => {
        const cb = prankCallback(p);
        return {
          truth: { dx: 'Trote (acidente inventado)', sev: 'trote', ok: ['TROTE'], prankKind: 'trote' },
          note: 'Diz que é acidente com três carros e presos. Ninguém mais ligou daí, {dr}.',
          noteWrong: 'Acidente grave! Três carros, gente presa!',
          caller: 'Testemunha',
          callerName: 'Testemunha',
          type: 'trotista',
          voice: p.F ? 'jovem_m' : 'jovem_h',
          amb: ['tv', 'silencio'],
          noise: ['[{{ao fundo, só uma TV de auditório baixinha; nenhuma buzina, nenhum grito|tv}}]'],
          patient: { name: '"Vítimas do acidente"' },
          q: {
            oque: 'Bateu, capotou, quase explodiu. Igual filme. Um saiu voando.',
            consciencia: '{{Todos. Não. Uns|todos}}.',
            respira: 'Respiram. Os que tão vivos.',
            pulso: '{{De quem? ...De todos. Tem, tem pulso|pulso}}.',
            pele: 'Sei lá, tô longe. Normal.',
            sangramento: 'Muito. Litros.',
            historico: 'Não sei, não conheço ninguém.',
            paciente: 'Não dá, eles tão presos.',
            seguranca: 'Seguro, pode vir. Vem com a sirene ligada, viu?',
            idade: 'Uns... vários.',
          },
          extra: [ex('quantos', 'Quantos feridos? Como estão?', 'Quantas pessoas estão feridas? Me descreve uma delas.', ['{{Cinco. Ou seis. Feridos, bem feridos|cinco}}.', 'Um tá... de olho fechado. Os outros também.'], { cat: 'trauma' })],
          callback: cb.lines,
          links: [
            lk('tv', 'acidente', 'Três carros batidos na esquina e o fundo é uma TV de auditório, sem buzina, sem grito: quem liga não está na rua.'),
            lk('pulso', 'todos', '"De quem? De todos": ninguém está do lado de vítima nenhuma.'),
            lk(cb.id, 'num', cb.insight),
          ],
          radio: { prank: 'Central, {unit}. Esquina vazia, {dr}. Nem um retrovisor no chão. Trote.' },
        };
      },
    },
    {
      id: 'janela',
      weight: 1.2,
      build: (p) => ({
        // [validar] colisão com vítima consciente sangrando na testa, sem presos: USB, UPA.
        truth: { dx: 'Colisão com um ferido consciente (testemunha vê da janela)', sev: 'amarelo', ok: ['USB'], dest: ['UPA', 'REG'] },
        cena: { pose: 'sentado', signs: ['sangue_cabeca'], cast: [{ role: 'curioso', act: 'olhando', at: 'fundo' }] },
        note: 'Testemunha vendo da janela. Batida, um ferido sentado na calçada.',
        noteWrong: 'Acidente com três carros, presos! Grave, {dr}!',
        type: 'testemunha',
        amb: ['rua', 'buzinas'],
        noise: ['[{{buzinas e alguém gritando "chama a ambulância!" lá embaixo|rua}}]'],
        q: {
          oque: ['Eu vi da janela do terceiro andar. Bateu forte. Tem um carro de lado.', '{{Um moço saiu sozinho e sentou na calçada|sentou}}. Exagerei nos três carros, desculpa. São dois.'],
          consciencia: 'Acordado. Tá falando com o pessoal que desceu.',
          respira: 'Respira. Tá sentado, conversando.',
          pulso: 'Daqui da janela não dá pra eu saber, {dr}. Mas ele mexe os braços.',
          pele: 'Daqui... tem sangue escorrendo na testa dele.',
          sangramento: 'Na testa. Tão segurando um pano.',
          seguranca: 'O pessoal ligou o pisca-alerta. Os carros tão parados.',
          paciente: 'Eu tô na janela, {dr}. Mas tem gente do lado dele.',
          idade: `Uns ${Math.round(p.age / 5) * 5} anos.`,
        },
        extra: [ex('quantos', 'Quantos feridos? Como estão?', 'Quantas pessoas estão feridas? Me descreve uma delas.', 'Só ele. O outro motorista tá em pé, no telefone. O moço tá com a mão na cabeça.', { cat: 'trauma' })],
        callback: ['{{Alô? Sou eu, da janela. O moço continua sentado, apertando o pano na testa.|retorno_ok}}'],
        links: [
          lk('sentou', 'rua', 'Buzinas e gente gritando lá embaixo: é na rua de verdade. Um ferido consciente com corte na testa: USB.'),
          lk('retorno_ok', 'num', 'Ligar de volta: atende na hora, ainda olhando a cena.', { kind: 'confirma' }),
        ],
        radio: { ok: 'Central, {unit}. Colisão, um ferido, corte no couro cabeludo, consciente. A testemunha acenou da janela. Seguimos pra UPA.' },
        diary: { alive: 'Viu o acidente da janela e exagerou nos carros. O ferido era um só, com um corte na testa.' },
      }),
    },
    {
      id: 'presos',
      weight: 0.8,
      build: (p) => ({
        truth: { dx: 'Colisão com vítima presa nas ferragens', sev: 'vermelho', ok: ['USA'], sup: ['BOMB'], dest: ['REG'], risk: { good: 45, bad: 110 } },
        cena: { pose: 'preso', signs: ['sangue_rosto'], props: ['carro'], cast: [{ role: 'curioso', act: 'gritando', at: 'fundo' }] },
        note: 'Acidente na esquina, gente presa. Tem gritaria aí, {dr}. Já ligaram mais dois.',
        noteWrong: 'Diz que é acidente de três carros. Parece exagero.',
        type: 'testemunha',
        amb: ['rua', 'gritos', 'buzinas'],
        noise: ['[{{gritos, buzina presa tocando sem parar|gritos}}]'],
        q: {
          oque: { t: 'Um carro entrou no outro na esquina! O motorista tá preso, a porta amassou toda! Ele tá gemendo!', style: 'grito' },
          consciencia: 'Ele geme! Abre o olho e fecha! Responde pouco!',
          respira: 'Respira rápido, tá gemendo muito.',
          pulso: 'Eu pus a mão no pescoço dele pela janela... tá rápido, fininho!',
          pele: 'Branco! Branco e suando, com sangue no rosto!',
          sangramento: 'Muito sangue no rosto e na perna, preso no painel!',
          seguranca: 'Tem gasolina no chão, {dr}! Um cheiro forte!',
          paciente: 'Ele não consegue falar direito, {dr}!',
          idade: `Uns ${Math.round(p.age / 5) * 5}.`,
        },
        extra: [ex('quantos', 'Quantos feridos? Como estão?', 'Quantas pessoas estão feridas? Me descreve uma delas.', 'Dois! O do outro carro tá andando, sangrando no braço. O preso é que tá mal!', { cat: 'trauma' })],
        callback: ['{{Alô! Vem logo! Ele tá ficando mais branco!|retorno_ok}}'],
        links: [
          lk('gritos', 'acidente', 'Gritos, buzina presa, cheiro de gasolina: a cena é real. Preso nas ferragens, pálido e com pulso fino: USA + Bombeiros.'),
          lm(p, 'gritos', 'cena', 'Gasolina no chão e vítima presa: Bombeiros (Manual p.4).'),
        ],
        radio: { ok: '{central}, {unit}. Bombeiros desencarceraram. Choque hemorrágico, seguimos pro Regional.', dead: 'Central... {unit}. Óbito no local. Presos demoram.' },
        diary: { alive: 'Preso nas ferragens na esquina. Os bombeiros cortaram a porta.', dead: 'Preso nas ferragens na esquina.' },
      }),
    },
  ],
});

// -----------------------------------------------------------------------------
// 1.1 — Trote do "primo desmaiado" (dia 3+): adolescente calmo demais, respostas de internet.
// Difícil: sem risada. Pistas: palavras de seriado ("filiforme", "Glasgow três") ditas sem
// ninguém examinar, silêncio de quarto, retorno cai na caixa postal de adolescente. Armadilha
// inversa: a mesma calma é choque de quem viu a primeira convulsão do primo.
// -----------------------------------------------------------------------------
export const TROTE_DESAFIO = tpl({
  id: 'trote_desafio',
  tags: ['trote'],
  minDay: 3,
  age: [14, 17],
  sex: 'M',
  rel: ['amigo'],
  cena: { place: 'quarto' },
  open: () => ['Alô? O meu primo {{desmaiou aqui no quarto|desmaiou}}. Não tá respondendo.'],
  truths: [
    {
      id: 'trote',
      weight: 3,
      build: (p) => ({
        truth: { dx: 'Trote (adolescente imitando seriado médico)', sev: 'trote', ok: ['TROTE'], prankKind: 'trote' },
        note: 'Adolescente, primo desmaiado. Tranquilo demais, {dr}.',
        noteWrong: 'Adolescente desmaiado, não responde! Grave!',
        caller: 'Voz de adolescente',
        callerName: 'Voz de adolescente',
        type: 'trotista',
        voice: 'adolescente',
        amb: ['ventilador', 'silencio'],
        noise: ['[um ventilador; mais nada]'],
        patient: { name: `"Primo do ${p.first}"` },
        q: {
          oque: 'Ele desmaiou. Do nada. Caiu da cadeira.',
          consciencia: '{{Glasgow três|glasgow}}. Quer dizer... ele não acorda.',
          respira: 'Respira. Não. Respira. Tá em... apneia intermitente.',
          pulso: '{{Tá filiforme|filiforme}}.',
          pele: 'Cianótico de extremidades. E pálido. Bem pálido.',
          historico: 'Nada. Ele é atleta.',
          inicio: 'Agora. Faz dois minutos. Três.',
          paciente: 'Não dá. Ele tá... desmaiado.',
          idade: 'Dezesseis. Igual eu.',
        },
        extra: [ex('adulto', 'Tem algum adulto aí?', 'Tem algum adulto em casa com vocês?', 'Não. Minha mãe tá no serviço. Pode mandar a ambulância. Com a sirene, se der.')],
        callback: ['[Chama, chama...]', `{{[Caixa postal: "Fala aí, é o ${p.first}. Deixa o recado depois do bipe."]|retorno_caixa}}`, '[piii]'],
        links: [
          lk('filiforme', 'glasgow', '"Filiforme", "Glasgow três", "apneia intermitente": palavras de seriado, ditas sem ninguém examinar o primo. Quem está assustado não fala assim.'),
          lk('retorno_caixa', 'num', 'Ligar de volta: caixa postal de adolescente. Ninguém pede socorro e deixa cair na caixa.'),
        ],
        radio: { prank: 'Central, {unit}. Dois moleques no quarto jogando, {dr}. O "desmaiado" abriu a porta.' },
      }),
    },
    {
      id: 'convulsao',
      weight: 1.2,
      build: (p) => ({
        // [validar] primeira crise convulsiva em adolescente, em pós-crise: USB (amarelo), avaliação hospitalar.
        truth: { dx: 'Primeira crise convulsiva em adolescente (pós-crise)', sev: 'amarelo', ok: ['USB'], dest: ['UPA', 'REG'], risk: { good: 100, bad: 260, needs: 'USB' } },
        cena: { pose: 'lateral', signs: ['olhos_fechados', 'baba'] },
        note: 'Adolescente, primo desmaiado. Voz estranha, devagar. Acho que tá em choque, {dr}.',
        noteWrong: 'Adolescente passando trote, {dr}. Tranquilo demais.',
        caller: `${p.first} (primo)`,
        callerName: p.first,
        type: 'comum',
        voice: 'adolescente',
        amb: ['silencio'],
        noise: ['[uma respiração pesada, roncada, perto do telefone]'],
        q: {
          oque: ['Ele... tava jogando. Aí travou. {{Tremeu todo, assim, uns dois minutos|tremeu}}. E caiu.', 'Agora tá dormindo. Mas não é dormindo normal.'],
          consciencia: 'Abre o olho quando eu chamo. Mas não fala nada. Tá meio... longe.',
          respira: 'Respira fundo, fazendo um barulho. Tá melhorando.',
          pulso: 'Tem... tá batendo. Rápido.',
          pele: 'Tava roxo na boca quando tremia. Agora tá voltando a cor.',
          historico: 'Nada. Nunca teve isso. Ele dormiu mal essa semana, jogando.',
          inicio: 'Faz uns cinco minutos.',
          paciente: 'Ele não consegue falar ainda.',
          idade: `${p.anos}.`,
          sangramento: '{{Saiu um pouco de sangue da boca. Acho que mordeu a língua|lingua}}.',
        },
        extra: [ex('adulto', 'Tem algum adulto aí?', 'Tem algum adulto em casa com vocês?', 'Não... a tia saiu. Eu tô sozinho com ele. Eu não sei o que fazer, {dr}.'), ex('lado', 'Orientar: virar de lado', 'Orientar: virar de lado', ['Virei. A baba saiu pela boca. Ele tá respirando melhor.'], { kind: 'fala', say: 'Vira ele de lado, com a boca para baixo. Não põe nada na boca dele. Fica do lado.' })], // [validar] pós-crise: posição lateral, nada na boca
        callback: ['{{Alô? Sou eu. Ele abriu o olho. Perguntou onde tava.|retorno_ok}}'],
        links: [
          lk('tremeu', 'lingua', 'Tremeu dois minutos, mordeu a língua e agora está "longe": convulsão em pós-crise. A calma é choque. USB.'),
          lk('retorno_ok', 'num', 'Ligar de volta: atende na hora, ainda do lado do primo.', { kind: 'confirma' }),
        ],
        radio: { ok: 'Central, {unit}. Pós-crise, primeira convulsão. O primo virou ele de lado sozinho. Seguimos.' },
        diary: { alive: 'O primo ligou calmo demais. Era choque: a primeira convulsão, no meio do jogo.' },
      }),
    },
    {
      id: 'desmaio',
      weight: 0.9,
      build: (p) => ({
        // [validar] desmaio ao levantar rápido, já acordado e bem, sem sinais de alarme: orientação, UPA por meios próprios.
        truth: { dx: 'Desmaio ao levantar (vasovagal), já acordou', sev: 'verde', ok: ['ORI'], ref: ['UPA', 'UBS'] },
        note: 'Adolescente, primo desmaiado. Agora parece que acordou.',
        noteWrong: 'Adolescente desmaiado, não responde! Grave!',
        caller: `${p.first} (primo)`,
        callerName: p.first,
        type: 'comum',
        voice: 'adolescente',
        amb: ['ventilador'],
        q: {
          oque: 'Ele levantou rápido da cadeira pra pegar água e apagou. Uns segundos. Já acordou.',
          consciencia: 'Acordou. Tá sentado no chão, falando que tá tonto.',
          respira: 'Respira normal.',
          pulso: 'Tem. Normal, acho.',
          pele: 'Tava branco. Agora tá voltando.',
          historico: 'Nada. Não almoçou, só tomou energético.',
          paciente: [`PRIMO: Tô bem... só tonto. Não fala pra minha mãe, {m:moço|moça}.`],
          idade: `${p.anos}.`,
        },
        extra: [ex('adulto', 'Tem algum adulto aí?', 'Tem algum adulto em casa com vocês?', 'A avó tá na sala, vendo novela. Ela é surda.')],
        callback: ['{{Alô? Ele já tá comendo bolacha.|retorno_ok}}'],
        links: [lk('retorno_ok', 'num', 'Ligar de volta: atendem na hora. Desmaio rápido ao levantar, já acordado: orientação.', { kind: 'confirma' })],
        radio: { excess: 'Central, {unit}. O "desmaiado" tava comendo bolacha, {dr}. Pressão ok.' },
        diary: { ori: 'Desmaiou ao levantar, sem almoço e com energético. Comeu bolacha e melhorou.' },
      }),
    },
  ],
});

// -----------------------------------------------------------------------------
// 1.1 — "A professora caiu" (dia 5+): crianças sérias demais.
// Difícil: sem risada. Pistas: elas cochicham a resposta antes de dizer, o sinal da escola toca
// e não há nenhum adulto por perto em plena aula; o retorno cai na própria professora.
// Armadilha inversa: às vezes a professora caiu mesmo (desmaio; ou a diabetes dela).
// -----------------------------------------------------------------------------
export const TROTE_ESCOLA = tpl({
  id: 'trote_escola',
  tags: ['trote'],
  minDay: 5,
  age: [28, 55],
  sex: 'F',
  rel: ['testemunha'],
  cena: { place: 'escola' },
  open: () => ['Alô? A professora {{caiu aqui na sala|caiu}}. Ela não levanta.'],
  truths: [
    {
      id: 'trote',
      weight: 3,
      build: (p) => ({
        truth: { dx: 'Trote (alunos com o celular da professora)', sev: 'trote', ok: ['TROTE'], prankKind: 'trote' },
        note: 'Criança dizendo que a professora caiu. Ouvi sinal de escola, {dr}.',
        noteWrong: 'Professora desmaiada na sala! Criança ligando!',
        caller: 'Voz de criança',
        callerName: 'Voz de criança',
        type: 'crianca',
        voice: 'menino',
        amb: ['escola'],
        noise: ['[{{o sinal da escola toca; um corredor de crianças correndo|sinal}}]'],
        patient: { name: '"A professora"' },
        q: {
          oque: ['[cochichos]', 'Ela caiu. Da cadeira.'],
          consciencia: ['[cochicho: "fala que não acorda"]', 'Não acorda.'],
          respira: ['{{Respira. [cochicho] Não. [cochicho] Respira|respira}}.'],
          pulso: ['[cochicho: "fala que não tem"]', 'Não tem.'],
          pele: ['[cochichos]', 'Verde.'],
          historico: 'Ela é brava.',
          paciente: 'Ela não pode falar. Ela tá caída.',
          idade: 'Ela é velha. Uns trinta.',
          seguranca: 'Seguro. Só tem a gente.',
        },
        extra: [ex('adulto', 'Tem algum adulto aí?', 'Tem algum adulto aí perto? Outro professor, a diretora?', ['[silêncio]', '{{Não. Só a gente. A sala inteira|sem_adulto}}.'])],
        callback: [`[Atende uma mulher, brava]`, `{{"Alô? Aqui é a professora ${p.first}, da Monteiro Lobato. Quem ligou daqui? ...Eu tô ótima! Quem pegou o celular da minha bolsa?!"|retorno_prof}}`],
        links: [
          lk('respira', 'sinal', 'Cochicham a resposta antes de dizer, e "respira, não, respira": estão combinando o que falar.'),
          lk('sem_adulto', 'sinal', '"Professora caída" no meio da aula e nenhum adulto por perto numa escola cheia: não fecha.'),
          lk('retorno_prof', 'num', 'Ligar de volta: a própria professora atende, bem e brava.'),
        ],
        radio: { prank: 'Central, {unit}. A professora tava dando aula, {dr}. A sala inteira ficou de castigo.' },
      }),
    },
    {
      id: 'desmaio',
      weight: 1.2,
      build: (p) => ({
        // [validar] síncope rápida em adulta jovem, já acordada, sem sinais de alarme: orientação, UPA (USB defensável).
        truth: { dx: 'Desmaio da professora em sala (jejum), já acordando', sev: 'verde', ok: ['ORI', 'USB'], best: 'ORI', ref: ['UPA'], dest: ['UPA'] },
        cena: { pose: 'sentado', cast: [{ role: 'aluno', act: 'olhando', at: 'fundo', age: 'crianca' }] },
        note: 'Criança dizendo que a professora caiu. Parece assustada de verdade.',
        noteWrong: 'Trote de criança, {dr}. Tem sinal de escola.',
        caller: 'Voz de criança',
        callerName: 'Voz de criança',
        type: 'crianca',
        voice: 'menino',
        amb: ['escola', 'choro'],
        noise: ['[uma criança chorando perto; alguém grita "chama a diretora!"]'],
        q: {
          oque: 'Ela levantou pra escrever na lousa e caiu. Bateu o braço na mesa.',
          consciencia: 'Abriu o olho! Tá falando devagar.',
          respira: 'Respira.',
          pulso: 'Eu não sei achar...',
          pele: 'Branca. Branca que nem giz.',
          historico: 'Ela falou que não tomou café hoje.',
          paciente: [`DIRETORA: Alô? Sou a diretora. A ${p.first} desmaiou, mas já acordou. Tá sentada, comendo um biscoito. Ela tá meio tonta.`],
          idade: 'Não sei. Adulta.',
        },
        extra: [ex('adulto', 'Tem algum adulto aí?', 'Tem algum adulto aí perto? Outro professor, a diretora?', ['A diretora tá vindo! Chegou!', 'DIRETORA: Sou a diretora, {dr}. Ela acordou.'])],
        callback: ['{{Alô? É a diretora. Ela tá melhor, sentada.|retorno_ok}}'],
        links: [lk('retorno_ok', 'num', 'Ligar de volta: a diretora atende. A professora desmaiou de jejum e já acordou.', { kind: 'confirma' })],
        radio: { excess: 'Central, {unit}. A professora desmaiou de jejum, {dr}. Já tava comendo biscoito com a turma.', ok: 'Central, {unit}. Síncope de jejum, a professora tá bem. Levando pra UPA pra avaliar.' },
        diary: { ori: 'A professora desmaiou de jejum no meio da aula. Um aluno ligou; a diretora confirmou.', alive: 'A professora desmaiou de jejum no meio da aula. Um aluno ligou.' },
      }),
    },
    {
      id: 'hipoglicemia',
      weight: 0.8,
      minDay: 6,
      build: (p) => ({
        truth: { dx: 'Hipoglicemia grave (professora diabética desacordada em sala)', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 50, bad: 120 } },
        cena: { pose: 'caido', signs: ['suor', 'olhos_fechados'] },
        note: 'Criança: a professora caiu e não acorda. Tem criança chorando, {dr}.',
        noteWrong: 'Trote de criança, {dr}. Tem sinal de escola.',
        caller: 'Voz de criança',
        callerName: 'Voz de criança',
        type: 'crianca',
        voice: 'menino',
        amb: ['escola', 'choro'],
        noise: ['[crianças chorando; um adulto corre pelo corredor gritando o nome dela]'],
        q: {
          oque: 'Ela tava tremendo e suando, falando enrolado. Aí sentou no chão e deitou. {{Não acorda|nao_acorda}}.',
          consciencia: 'Não acorda! A gente chama, ela não responde!',
          respira: 'Respira, a barriga mexe.',
          pulso: 'Tem... rápido.',
          pele: 'Branca e molhada de suor.',
          historico: 'Ela tem diabete. {{Toma injeção na barriga, fica na bolsa dela|insulina}}.',
          paciente: 'Ela não fala!',
          idade: 'Não sei... adulta.',
        },
        extra: [ex('adulto', 'Tem algum adulto aí?', 'Tem algum adulto aí perto? Outro professor, a diretora?', 'O professor de educação física tá vindo correndo!')],
        callback: ['{{Alô! O professor chegou, ela ainda não acordou!|retorno_ok}}'],
        links: [
          lm(p, 'insulina', 'hipoglicemia', 'Diabética que suou, tremeu, falou enrolado e não acorda: hipoglicemia grave. USA (Manual p.6).'),
          lk('retorno_ok', 'num', 'Ligar de volta: atendem na hora, desesperados.', { kind: 'confirma' }),
        ],
        guide: { id: 'hipoglicemia' },
        radio: { ok: '{central}, {unit}. Glicemia 31, glicose na veia, a professora acordou. A turma inteira tava no corredor. Que crianças.' },
        diary: { alive: 'Um aluno ligou: a professora diabética não acordava. Hipoglicemia. Acordou com a turma no corredor.', dead: 'Um aluno ligou: a professora diabética não acordava.' },
      }),
    },
  ],
});

export const TROTES = [TROTE_CLASSICO, TROTE_CRIANCA, TROTE_OPORTUNISTA, LINHA_ABERTA, TROTE_SOFISTICADO, TROTE_CINEMA, TROTE_DESAFIO, TROTE_ESCOLA];

