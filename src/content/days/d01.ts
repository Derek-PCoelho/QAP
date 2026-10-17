// =============================================================================
// DIA 1 — "Primeiro Plantão" (tutorial guiado pela Simone)
// Fios plantados: 🌱 Henrique (bala de menta), 🌱 Cida (frequentadora) e Zélia
// (grupo de senhoras da igreja), 🌱 Bené no rádio, 🌱 Farmácia Popular (jornal).
// =============================================================================
import { day, call, fx, NUM, ADDR } from '../dsl';

export const DAY = day({
  day: 1,
  title: 'Primeiro Plantão',
  weekday: 'Segunda-feira',
  weather: 'Sol forte, 33 °C',
  tutorial: true,
  newspaper: () => ({
    headline: 'Saúde+ Gestão assume a Regulação de Santa Aurora',
    sub: 'Organização social promete "eficiência" e "uso racional de viaturas" na Central de Regulação',
    photo: 'coletiva',
    stories: [
      { title: 'Calor de 33 °C deve durar a semana', text: 'A Defesa Civil recomenda hidratação. As mangueiras do Jardim Primavera estão floridas e cheias de abelhas.' },
      { title: 'Novela das seis bate recorde', text: '"Amor de Cristal" chega ao capítulo do segredo de Marta. Telespectadoras prometem não perder um minuto.' },
      { title: 'Vereador recebe título de "Amigo da Saúde"', text: 'A Câmara aprovou por unanimidade a homenagem ao vereador Arlindo Matos.' },
    ],
    notice: 'Seu primeiro plantão começa às 07:00. Leia a página 1 do Manual de Regulação.',
    ad: 'FARMÁCIA POPULAR — remédios de pressão, diabetes e asma de graça, com receita do SUS.',
    weather: 'Sol forte · 33 °C',
  }),
  handover: () => ({
    id: 'd01_passagem',
    bg: 'central',
    nodes: {
      start: {
        lines: [
          { who: 'NARRADOR', t: '07:00. Central de Regulação de Santa Aurora. Luz fluorescente, o ar-condicionado pingando num balde.' },
          { who: 'SIMONE', t: 'Bom dia, {dr}. Simone, TARM. Eu atendo primeiro e passo {m:pro senhor|pra senhora}. Os post-its são meus.' },
          { who: 'HENRIQUE', t: 'Henrique, do noturno. Bem-vind{m:o|a} à central. Noite tranquila, não deixei nada na fila.' },
          { who: 'NARRADOR', t: 'Ele aperta sua mão mascando uma bala de menta. O cheiro de menta é forte. E tem alguma outra coisa por baixo.' },
          { who: 'HENRIQUE', t: 'Dica de graça: o Peixoto conta as USA. Eu conto as horas. Boa sorte.' },
        ],
        choices: [
          { label: '"Obrigad{m:o|a}. Vai descansar."', next: 'fim' },
          { label: '(Reparar nas mãos dele, que não param quietas.)', next: 'maos' },
        ],
      },
      maos: {
        lines: [
          { who: 'NARRADOR', t: 'As mãos dele brincam com o crachá, com a chave do carro, com a bala. Quando percebe que você olhou, ele enfia as mãos no bolso do jaleco.' },
          { who: 'HENRIQUE', t: 'Muito café. Até amanhã.' },
        ],
        onEnter: fx.set('henrique_maos_d1'),
      },
      fim: { lines: [{ who: 'SIMONE', t: 'O telefone vai tocar, {dr}. Clica no cartão da fila pra atender. Eu vou falando o resto.' }] },
    },
  }),
  // 1.1 — exemplo dos ganchos novos (o texto dos 20 dias é da Onda 2; ver docs/roteiro-1.1/)
  ida: () => ({
    id: 'd01_ida',
    bg: 'calcada',
    cast: [],
    nodes: {
      start: {
        lines: [
          { who: 'NARRADOR', t: '06:20. O Ozzy late para a moto do entregador como se fosse a primeira vez. É a sua primeira vez também.' },
          { who: 'DIRCE', t: '(varrendo a calçada às seis da manhã) Primeiro dia, {dr}? Vai com Deus e volta com o mesmo nome.' },
          { who: 'NARRADOR', t: 'No ônibus 12, o motorista olha o crachá novo pendurado no seu pescoço.' },
          { who: 'AÍLTON', t: 'Central da Regulação? Ih. Senta aqui na frente. Quem trabalha lá desce no ponto da XV com cara de enterro. Na volta, com cara de velório.' },
        ],
      },
    },
  }),
  almoco: () => ({
    id: 'd01_almoco',
    bg: 'central',
    cast: ['SIMONE', 'BENE'],
    nodes: {
      start: {
        lines: [
          { who: 'NARRADOR', t: '13:00. A Simone empurra o teclado para o lado e abre um pote de margarina que não tem margarina: tem bolacha de água e sal. Seis.' },
          { who: 'SIMONE', t: 'Almoço é aqui mesmo, {dr}. Vinte minutos. Se tocar, a gente finge que não ouviu. Se tocar duas vezes, a gente ouviu.' },
          { who: 'NARRADOR', t: 'Pela janela, a USA 01 encosta no pátio. O Bené desce e acena para a central como quem acena para um aquário.' },
          { who: 'BENÉ', t: '(da porta) Primeiro dia, né? Come. Quem regula de barriga vazia manda USA pra azia.' },
          { who: 'SIMONE', t: 'E o Henrique? Ele nunca almoça. Ele janta às sete da manhã.' },
          { who: 'NARRADOR', t: 'Ela ri de um jeito que não é bem riso.' },
        ],
        choices: [
          { label: '"Divide comigo. Eu trouxe arroz e feijão pra dois sem querer."', next: 'dividiu', effect: fx.all(fx.add('lealSimone', 1, 'dividiu o almoço'), fx.set('almoco_d1_dividiu')) },
          { label: '"Janta o quê, às sete?"', next: 'janta' },
          { label: '(Comer lendo o Manual.)', next: 'manual' },
        ],
      },
      dividiu: { lines: [{ who: 'SIMONE', t: 'Sem querer, sei. ...Obrigada. A bolacha é pra pressão, sabia? Sal pouco. Mentira, é pro bolso.' }] },
      janta: { lines: [{ who: 'SIMONE', t: 'Pergunta pra ele. Ele te responde "noite tranquila".' }] },
      manual: { lines: [{ who: 'NARRADOR', t: 'A página 1 tem uma mancha de café em forma de Brasil. Você aprende que "não existe reserva técnica".' }] },
    },
  }),
  volta: (c) => ({
    id: 'd01_volta',
    bg: 'rua',
    cast: [],
    nodes: {
      start: {
        lines: [
          { who: 'NARRADOR', t: '19:20. O ônibus para no semáforo da Av. Brasil, 2650. Na calçada, um vendedor de bilhete fala alto com um amigo.' },
          { who: 'NARRADOR', t: '"...e eu fiquei apertando o peito dele até a ambulância chegar, igual a moça do telefone mandou!"' },
          c.s.diary.some((d) => d.callDef === 'd01_parada' && d.kind === 'vivo')
            ? { who: 'NARRADOR', t: 'O Wellington ri e chora ao mesmo tempo. O ônibus arranca antes de você decidir se acena.' }
            : { who: 'NARRADOR', t: 'Ele fala baixo agora. O amigo põe a mão no ombro dele. O ônibus arranca.' },
        ],
      },
    },
  }),
  timeline: [
    { at: '07:01', kind: 'radio', who: 'USA 01 · BENÉ', text: 'Central, USA 01 em QRV na base Centro. Bom dia pr{o} {dr} nov{o}. Bené na escuta.' },
    { at: '16:00', kind: 'interfone', who: 'DR. PEIXOTO', text: 'Bem-vind{m:o|a}, {dr}. Peixoto, coordenação. Passei o dia em reunião com a OS, por isso só agora. Qualquer coisa, pode me chamar. Só não me chama pra pedir viatura, hein? Brincadeira.' },
  ],
  calls: [
    // ------------------------------------------------------------------ 1
    call({
      id: 'd01_cida',
      ref: 'D1 #1',
      at: '07:04',
      anchor: true,
      num: NUM.cida,
      caller: 'Dona Cida',
      callerName: 'Dona Cida',
      type: 'frequentador',
      voice: 'cida',
      note: 'Dona Cida, 79. Liga quase todo dia. Pressão e novela.',
      noteFixed: true,
      addr: ADDR.cida,
      amb: ['tv', 'passaros'],
      open: [
        'Oi {meu} {filho}, é a Cida! Bom dia! Viu a novela ontem?',
        'Ó, eu fui medir a pressão na farmácia e deu {{14 por 9|cida_pressao}}. A moça falou pra ficar de olho. Aí eu liguei, né? Pra ficar de olho junto.',
      ],
      q: {
        oque: 'Nada não, {meu} {filho}. Só a pressão. E a novela! A Marta descobriu tudo!',
        idade: 'Setenta e nove, graças a Deus.',
        consciencia: 'Tô aqui conversando com você, uai!',
        respira: 'Respirando, respirando. Até demais, o médico fala que eu falo muito.',
        inicio: 'Medi agora de manhã, na farmácia do Seu Toninho.',
        historico: 'Pressão. Tomo o remédio certinho de manhã. {{Hoje já tomei.|cida_tomou}}',
        paciente: 'Sou eu mesma, {meu} {filho}!',
        sangramento: 'Sangue? Credo, não.',
        seguranca: 'Seguro, seguro. Só eu e o gato.',
      },
      extra: [
        {
          id: 'sintomas',
          label: 'Dor de cabeça, tontura, falta de ar?',
          say: 'A senhora sente alguma coisa? Dor de cabeça, tontura, falta de ar, dor no peito?',
          a: ['Nada, nada. Tô ótima. {{Só sozinha, né.|cida_sozinha}}', '[TV alta: "...Marta, eu sempre soube!"]'],
        },
        {
          id: 'conversar',
          kind: 'fala',
          label: 'Conversar um pouco com ela',
          say: 'E a novela, Dona Cida? O que a Marta descobriu?',
          cost: 15,
          a: ['Ah, que bom que você perguntou! A Marta descobriu que o Henrique... não, o outro Henrique, o da fazenda...', '[risada]', 'Desculpa tomar seu tempo, {meu} {filho}. É que a casa fica muito quieta.'],
          onAsk: fx.all(fx.add('humanidade', 1, 'conversou com a Dona Cida'), fx.set('cida_conversou_d1')),
        },
      ],
      links: [
        { a: 'cida_pressao', b: 'manual:azul', insight: 'Pressão 14 por 9 em quem já tomou o remédio e não sente nada: não urgente. Orientar UBS (Manual p.1).' },
      ],
      onAnswer: fx.all(fx.set('cida_ligou_d1'), fx.board({ id: 'cida', kind: 'frequente', title: 'Dona Cida (79)', text: 'Liga quase todo dia. Pressão, novela. Mora sozinha, Bela Vista.' })),
      patient: { name: 'Aparecida (Dona Cida)', age: 79, sex: 'F' },
      truth: { dx: 'Pressão levemente alta e solidão', sev: 'azul', ok: ['ORI'], ref: ['UBS', 'CASA'] },
      diary: { ori: 'Pressão 14 por 9. Ligou para conversar sobre a novela.' },
    }),
    // ------------------------------------------------------------------ 2
    call({
      id: 'd01_lurdes',
      ref: 'D1 #2',
      at: '07:30',
      anchor: true,
      num: '(17) 3328-2950',
      caller: 'Sueli (filha)',
      callerName: 'Sueli',
      type: 'comum',
      voice: 'mulher',
      note: 'Senhora caiu em casa. Filha nervosa.',
      noteFixed: true,
      addr: { rua: 'Rua Minas Gerais', n: 2950, bairro: 'Vila Esperança', ref: 'Em frente à quitanda do Japonês.' },
      amb: ['gemidos', 'cozinha'],
      open: [
        'Alô, emergência? Minha mãe caiu aqui em casa! Ela tá no chão da cozinha, {{não consegue apoiar a perna|perna}}!',
        '[{{gemidos ao fundo|gemido}}]',
        'MÃE: Ai, Sueli, não mexe... não mexe...',
      ],
      q: {
        oque: 'Ela escorregou no piso molhado. Caiu de lado, em cima do quadril.',
        consciencia: 'Tá acordada, reclamando de dor. Sabe quem eu sou, sabe o dia.',
        respira: 'Tá respirando, sim. Só gemendo.',
        idade: 'Oitenta. Oitenta e um em julho.',
        inicio: 'Agora, faz uns dez minutos.',
        sangramento: 'Não, sangue não. Só que a perna tá {{virada pra fora e parece mais curta|perna_curta}}.',
        historico: 'Pressão e osteoporose. Toma cálcio.',
        paciente: ['MÃE: Ai, foi o quadril... não consigo levantar.', 'MÃE: Bater a cabeça eu não bati, não, viu?'],
        seguranca: 'Seguro, só eu e ela.',
      },
      links: [
        { a: 'perna_curta', b: 'manual:amarelo', insight: 'Idosa, queda sobre o quadril, perna encurtada e virada para fora: provável fratura de fêmur. Amarelo → USB (Manual p.1).' },
      ],
      patient: { name: 'Lurdes Andrade', age: 80, sex: 'F' },
      truth: { dx: 'Provável fratura de fêmur', sev: 'amarelo', ok: ['USB'], risk: { good: 120, bad: 320, needs: 'USB' } },
      radio: {
        ok: 'Central, {unit} no local. Senhora de 80 anos, provável fratura de colo de fêmur. Imobilizada, removendo.',
        excess: '{central}, {unit} no local. Fratura de fêmur, estável, sem risco imediato. Dava USB, {dr}.',
      },
      diary: { alive: 'Queda em casa, fratura de fêmur. Removida com dor controlada.' },
    }),
    // ------------------------------------------------------------------ 3
    call({
      id: 'd01_et',
      ref: 'D1 #3',
      at: '08:15',
      anchor: true,
      num: '(17) 99877-3412',
      caller: 'Voz masculina jovem',
      type: 'trotista',
      voice: 'adolescente',
      note: 'Tô ouvindo risada, {dr}.',
      noteFixed: true,
      addr: { rua: 'Rua Saturno', n: 42, bairro: 'Centro' },
      amb: ['risadas', 'videogame'],
      open: [
        'Alô? Emergência? Corre, corre! Tem um {{ET ferido|et}} aqui na Rua Saturno, 42! Ele tá verde e sangrando azul!',
        '[{{risadas abafadas|risadas}}]',
      ],
      q: {
        oque: ['O disco voador bateu no poste, {m:moço|moça}!', '[risadas]'],
        consciencia: 'Tá... ele tá falando na língua dele!',
        respira: 'Pelas antenas!',
        idade: 'Sei lá, uns trezentos anos?',
        referencia: 'Do lado da... da padaria espacial. [risada]',
        paciente: 'Ele não fala português, {m:moço|moça}. [risadas]',
        seguranca: 'Seguro, mas traz arma laser! [risadas]',
        sangramento: 'Sangue azul! Muito!',
      },
      links: [
        { a: 'et', b: 'risadas', insight: 'Relato absurdo e risadas abafadas ao fundo: sinais clássicos de trote.' },
      ],
      patient: { name: '"ET ferido"' },
      truth: { dx: 'Trote', sev: 'trote', ok: ['TROTE'], prankKind: 'trote' },
      radio: { prank: 'Central, {unit}. Rodamos o Centro inteiro: não existe Rua Saturno. Era trote. Voltando.' },
    }),
    // ------------------------------------------------------------------ 4
    call({
      id: 'd01_parada',
      ref: 'D1 #4',
      at: '09:10',
      anchor: true,
      num: '(17) 99140-7781',
      caller: 'Wellington (vendedor)',
      callerName: 'Wellington',
      type: 'testemunha',
      voice: 'jovem_h',
      note: 'Homem caído na calçada! Testemunha.',
      noteFixed: true,
      addr: { rua: 'Av. Brasil', n: 2650, bairro: 'Centro', ref: 'Em frente à loja de móveis, perto do semáforo.' },
      amb: ['rua', 'buzinas', 'gritos'],
      open: [
        '{m:Moço|Moça}! Um homem {{caiu na calçada|caiu}} aqui na frente da loja! Ele {{não tá respirando|nao_respira}}!',
        '[{{buzinas, gente gritando em volta|rua}}]',
      ],
      q: {
        oque: 'Ele tava andando, pôs a mão no peito e caiu de cara. Assim, do nada!',
        consciencia: 'Não! Chamei, sacudi, ele {{não responde|nao_responde}}!',
        respira: 'Tá fazendo um {{barulho de ronco, de vez em quando|agonica}}... isso é respirar?',
        idade: 'Uns cinquenta e poucos.',
        inicio: 'Agora! Dois minutos!',
        sangramento: 'Cortou a testa quando caiu. Pouquinho.',
        historico: 'Não conheço ele, {m:moço|moça}!',
        paciente: 'Ele não fala! Ele não fala!',
        seguranca: 'Seguro. Só um monte de gente em volta.',
      },
      links: [
        { a: 'agonica', b: 'manual:parada', insight: '"Ronco de vez em quando" em quem não responde é respiração agônica: PARADA CARDÍACA. USA + RCP guiada (Manual p.1).' },
        { a: 'nao_responde', b: 'manual:parada', insight: 'Não responde e não respira normalmente: parada até prova em contrário (Manual p.1).' },
      ],
      patient: { name: 'Homem não identificado', age: 55, sex: 'M' },
      truth: { dx: 'Parada cardiorrespiratória', sev: 'vermelho', ok: ['USA'], risk: { good: 30, bad: 75, guideBonus: 28 } },
      guide: { id: 'rcp' },
      radio: {
        saved: '{central}, USA 01 no local. Fibrilação ventricular, chocamos duas vezes e voltou o pulso. Quem tava contando no telefone? Contou bonito.',
        ok: '{central}, {unit} no local. Parada revertida, paciente intubado. Seguimos.',
        dead: 'Central... {unit}. Fizemos tudo. Óbito constatado às {hora}.',
        under: 'Central, {unit}! É PARADA! Iniciamos massagem, precisamos de USA agora!',
      },
      diary: {
        alive: 'Parada na calçada da Av. Brasil. Voltou com dois choques.',
        dead: 'Parada na calçada da Av. Brasil. Ninguém sabia o nome dele.',
        later: [{ day: 4, text: 'Identificado: Edson Ribeiro, 56, porteiro. Teve alta da UTI.', when: (c) => c.s.diary.some((d) => d.id === 'd01_parada' && d.kind === 'vivo') }],
      },
    }),
    // ------------------------------------------------------------------ 5
    call({
      id: 'd01_febre',
      ref: 'D1 #5',
      at: '10:25',
      pool: 'leve,pediatria',
      num: '(17) 99623-1350',
      caller: 'Jéssica (mãe)',
      callerName: 'Jéssica',
      type: 'comum',
      voice: 'jovem_m',
      note: 'Mãe preocupada, criança com febre.',
      noteWrong: 'Criança grave, mãe desesperada.',
      addr: { rua: 'Rua das Acácias', n: 1350, bairro: 'Vila Esperança', ref: 'Rua da creche, portão marrom.' },
      amb: ['desenho'],
      open: ['Bom dia, desculpa ligar... meu filho tá com {{febre de 38|febre}} desde ontem. É grave?'],
      q: {
        oque: 'Febre. Ficou meio caidinho ontem, mas agora tá brincando com o carrinho.',
        consciencia: 'Tá acordado, {{brincando|brincando}}.',
        respira: 'Normal, normal.',
        idade: 'Três aninhos.',
        inicio: 'Desde ontem à tarde.',
        historico: 'Nada. É saudável, vacina em dia.',
        paciente: ['KAUÃ: Vrum! Vruuum!', '[{{risada de criança|risada_crianca}}]'],
        sangramento: 'Não.',
      },
      extra: [
        { id: 'alarme', label: 'Manchas, vômito, moleza?', say: 'Tem manchas na pele, vômito, convulsão, está molinho demais?', a: 'Não, nada disso. Tá comendo até. Tomou o antitérmico e a febre baixou.' },
      ],
      links: [{ a: 'febre', b: 'brincando', kind: 'confirma', insight: 'Febre baixa, criança brincando e comendo: sem sinais de gravidade. Verde.' }],
      patient: { name: 'Kauã', age: 3, sex: 'M' },
      // febre há menos de 24 h, criança ativa, comendo, vacinada, sem sinal de alarme: observar em casa com
      // antitérmico e sinais para voltar também é encaminhamento correto (CASA), além da UBS
      truth: { dx: 'Virose (febre sem sinais de alarme)', sev: 'verde', ok: ['ORI'], ref: ['UBS', 'UPA', 'CASA'] },
      diary: { ori: 'Febre de 38 °C, brincando. Orientada UBS e antitérmico.' },
    }),
    // ------------------------------------------------------------------ 6
    call({
      id: 'd01_moto',
      ref: 'D1 #6',
      at: '11:35',
      pool: 'trauma_moderado',
      num: '(17) 99512-3300',
      caller: 'Adilson (mecânico)',
      callerName: 'Adilson',
      type: 'testemunha',
      voice: 'homem',
      note: 'Moto. Parece leve.',
      addr: { rua: 'Rua Sete de Setembro', n: 3300, bairro: 'Jardim Norte', ref: 'Na frente da oficina do Adilson.' },
      amb: ['rua', 'maquina'],
      open: ['Oi, um motoboy caiu aqui na Sete de Setembro! Ele {{tá sentado, conversando|conversando}}, mas {{cortou o braço feio|corte}}.'],
      q: {
        oque: 'Escorregou no óleo e caiu de lado. Tava devagar.',
        consciencia: 'Tá acordado, xingando a moto.',
        respira: 'Normal.',
        idade: 'Novo, uns vinte e poucos.',
        sangramento: '{{Pouco sangue|pouco_sangue}}, já pôs um pano. Mas o corte é fundo, dá pra ver por dentro.',
        paciente: 'MATHEUS: Tô bem, tô bem... só o braço que arde. E o ombro dói pra mexer.',
        seguranca: 'Tirei a moto da rua já.',
        historico: 'Diz que não tem nada.',
      },
      extra: [{ id: 'capacete', label: 'Bateu a cabeça? Capacete?', say: 'Ele bateu a cabeça? Estava de capacete?', a: 'Tava de capacete. Não bateu, ele falou. Lembra de tudo.' }],
      patient: { name: 'Matheus Rocha', age: 23, sex: 'M' },
      truth: { dx: 'Trauma moderado: corte profundo no braço e dor no ombro', sev: 'amarelo', ok: ['USB'] },
      diary: { alive: 'Queda de moto, corte profundo no braço. Suturado.' },
    }),
    // ------------------------------------------------------------------ 7
    call({
      id: 'd01_dente',
      ref: 'D1 #7',
      at: '12:55',
      pool: 'leve',
      num: '(17) 99388-0650',
      caller: 'Reginaldo',
      callerName: 'Reginaldo',
      type: 'exagerador',
      voice: 'homem',
      note: 'Diz que tá morrendo.',
      addr: { rua: 'Rua Tiradentes', n: 650, bairro: 'Vila Nova', ref: 'Do lado da lotérica.' },
      amb: ['ventilador'],
      open: ['{Dr}, pelo amor de Deus, eu {{tô morrendo|morrendo}}... {{de dor de dente|dente}}! Não aguento mais!'],
      q: {
        oque: 'Um dente aqui do fundo. Lateja que eu vejo estrela!',
        consciencia: 'Acordado até demais, não dormi a noite toda.',
        respira: 'Respiro, {dr}, mas a dor...',
        idade: '34.',
        inicio: 'Desde ontem à noite.',
        historico: 'Nada. Só esse dente estragado.',
        paciente: 'Sou eu mesmo, {dr}!',
        sangramento: 'Um pouquinho na gengiva.',
      },
      extra: [
        { id: 'inchaco', label: 'Inchaço? Febre? Engole?', say: 'O rosto inchou? Tem febre? Consegue engolir e abrir a boca?', a: 'Inchou um {{pouquinho a gengiva|gengiva}}. Febre não. Engulo normal.' },
      ],
      links: [
        { a: 'morrendo', b: 'manual:verde', insight: '"Tô morrendo"... de dor de dente, sem febre nem dificuldade para engolir: caso verde (Manual p.1).' },
      ],
      patient: { name: 'Reginaldo Prado', age: 34, sex: 'M' },
      // [validar] RC23 (problemas odontológicos) lista "dor intensa" e "dor moderada" como discriminador de USI/USB.
      // Pelo critério do RM4 (consciente, respira e circula bem, anda, sem valência social) o jogo prefere orientar;
      // a USB fica aceita (⚖) para não punir quem segue o RC23 ao pé da letra. Equipe: manter a USB como defensável?
      truth: { dx: 'Dor de dente (caso odontológico)', sev: 'verde', ok: ['ORI', 'USB'], best: 'ORI', ref: ['UPA', 'UBS'] },
      radio: { excess: '{central}, {unit}. É dor de dente, {dr}. Ele perguntou se a gente tem dentista na ambulância.' },
      diary: { ori: 'Dor de dente. Orientado a procurar a UPA (dentista de plantão).' },
    }),
    // ------------------------------------------------------------------ 8
    call({
      id: 'd01_dpoc',
      ref: 'D1 #8',
      at: '14:20',
      pool: 'grave,respiratorio',
      num: '(17) 3327-1650',
      caller: 'Valdirene (filha)',
      callerName: 'Valdirene',
      type: 'comum',
      voice: 'mulher',
      note: 'Filha diz que a mãe tá roxa!',
      noteWrong: 'Falta de ar, parece ansiedade.',
      addr: { rua: 'Rua Goiás', n: 1650, bairro: 'Distrito Industrial', ref: 'Vila operária, casa 3, portão azul.' },
      amb: ['respiracao', 'radio_am'],
      open: [
        'Alô! Minha mãe tem DPOC, usa oxigênio... {{a boca dela tá roxa|roxa}} e ela {{não consegue falar|nao_fala}}!',
        '[{{respiração rápida e chiada ao fundo|resp}}]',
      ],
      q: {
        oque: 'Ela foi piorando desde de manhã. Agora tá puxando o ar e não sai palavra.',
        consciencia: 'Tá acordada, mas {{tá ficando sonolenta|sonolenta}}...',
        respira: 'Muito rápido, com a barriga, fazendo barulho.',
        idade: '74.',
        inicio: 'Piorou de manhã, mas agora ficou feio.',
        historico: 'DPOC, fumou a vida toda. Usa oxigênio em casa. A bombinha não tá fazendo efeito.',
        paciente: ['[respiração curta]', 'IRACEMA: Não... dá... ar...'],
        sangramento: 'Não.',
        seguranca: 'Tranquilo.',
      },
      extra: [{ id: 'oxigenio', label: 'O oxigênio está ligado?', say: 'O oxigênio dela está ligado?', a: 'Tá ligado no máximo, {dr}! Não adianta!' }],
      links: [
        { a: 'roxa', b: 'manual:vermelho', insight: 'Lábios roxos, não consegue falar e ficando sonolenta: falta de ar grave. Vermelho → USA (Manual p.1).' },
        { a: 'sonolenta', b: 'manual:vermelho', insight: 'Sonolência em quem está com falta de ar é sinal de esgotamento: vermelho (Manual p.1).' },
      ],
      patient: { name: 'Iracema Ferreira', age: 74, sex: 'F' },
      truth: { dx: 'Insuficiência respiratória (DPOC descompensada)', sev: 'vermelho', ok: ['USA'], risk: { good: 50, bad: 120 } },
      radio: { ok: '{central}, {unit} no local. DPOC descompensada, saturando 78. Ventilando, seguimos.' },
      diary: { alive: 'DPOC descompensada, lábios roxos. Chegou a tempo na UTI.' },
    }),
  ],
  interlude: {
    teaser: 'Primeiro plantão. Em casa, tem bolo de fubá esperando.',
    familyLacos: 1,
    onBico: fx.add('lacos', -1, 'perdeu a comemoração'),
    scene: {
      id: 'd01_bolo',
      bg: 'cozinha',
      cast: ['LUCIA', 'DAVI', 'ZELIA'],
      nodes: {
        start: {
          lines: [
            { who: 'NARRADOR', t: 'Tem bolo de fubá na mesa e uma vela de aniversário reaproveitada, espetada torta.' },
            { who: 'LUCIA', t: 'Primeiro plantão! E aí, {nome}? Salvou o mundo?' },
            { who: 'DAVI', t: '{Pai}, você salvou alguém pelo telefone?' },
          ],
          choices: [
            { label: '"Salvei. Um homem que caiu na rua."', next: 'heroi', affectionate: true },
            { label: '"Foi cansativo. Vamos comer."', next: 'cansado' },
          ],
        },
        heroi: {
          lines: [
            { who: 'DAVI', t: 'Igual herói! Igual herói de verdade!' },
            { who: 'ZELIA', t: 'Médico do telefone, hein? Pelo menos não pega gripe.' },
          ],
          next: 'igreja',
        },
        cansado: {
          lines: [
            { who: 'NARRADOR', t: '{Oconj} segura sua mão por baixo da mesa. Ninguém fala nada por um tempo.' },
            { who: 'ZELIA', t: 'Médico do telefone, hein? Pelo menos não pega gripe.' },
          ],
          next: 'igreja',
        },
        igreja: {
          lines: [
            { who: 'ZELIA', t: 'Amanhã tem o grupo de senhoras da igreja. Tem uma lá que liga pra vocês todo dia, sabia? Diz que é a única voz que ela ouve o dia inteiro.' },
            { who: 'LUCIA', t: 'Liam, mostra o desenho.' },
            { who: 'DAVI', t: 'Fiz a ambulância grande. A que salva. E você do lado, com o telefone.' },
            { who: 'NARRADOR', t: 'Ele prende o desenho na geladeira com um ímã de pizzaria.' },
          ],
          onEnter: fx.set('desenho_geladeira'),
        },
      },
    },
    bico: {
      id: 'd01_bico',
      bg: 'preto',
      nodes: {
        start: {
          lines: [
            { who: 'NARRADOR', t: 'Você liga avisando que vai emendar a noite na ambulância. Do outro lado, {oconj} demora para responder.' },
            { who: 'LUCIA', t: 'Tá. A gente guarda o bolo.' },
            { who: 'NARRADOR', t: 'Quando você chega, de madrugada, o bolo está na geladeira, inteiro, com a vela torta ainda espetada.' },
          ],
        },
      },
    },
  },
});

// Tarde do dia 1: três ligações leves sorteadas do banco (sempre, mesmo sem "ligações variáveis"),
// para quem aprende rápido não ficar parado depois das 14h20. A ligação do dente é só a reserva.
{
  const base = DAY.calls.find((c) => c.id === 'd01_dente')!;
  const extras: [string, string, string][] = [
    ['d01_tarde1', '15:10', 'leve'],
    ['d01_tarde2', '16:35', 'leve,pediatria'],
    ['d01_tarde3', '17:50', 'leve'],
  ];
  for (const [id, at, pool] of extras) DAY.calls.push({ ...base, id, ref: 'D1 tarde', at, pool, genOnly: true });
}
