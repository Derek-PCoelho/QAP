// =============================================================================
// Banco — pediatria: febre, bebê que não para de chorar, queimadura, batida na
// cabeça, afogamento, engoliu objeto, bebeu produto. Instruções clínicas: [validar].
// =============================================================================
import { tpl, lk, lm, ex, guideIf } from './kit';

const mesTxt = (m: number) => (m <= 1 ? 'um mês' : `${m} meses`);

// -----------------------------------------------------------------------------
// "Meu filho tá muito quente." (documento de design, 5.2)
// -----------------------------------------------------------------------------
export const FILHO_QUENTE = tpl({
  id: 'filho_quente',
  tags: ['pediatria', 'leve', 'moderado'],
  age: [0, 8],
  rel: ['mae', 'pai', 'mae'],
  cena: { place: 'sala', props: ['termometro'] },
  open: (p) => [`${p.Quem} tá {{muito quente|quente}}, {dr}. Pus a mão na testa e tá pelando.`],
  truths: [
    {
      id: 'virose',
      weight: 4,
      build: (p0) => {
        const p = p0.at(3, 8);
        return {
          who: p,
          truth: { dx: 'Virose (febre sem sinais de alarme)', sev: 'verde', ok: ['ORI'], ref: ['UBS', 'UPA'] },
          note: `${p.cg('Pai', 'Mãe')} preocupad${p.co}, criança com febre.`,
          noteWrong: 'Criança grave, febre altíssima!',
          amb: ['desenho'],
          noise: ['[desenho animado na TV]'],
          q: {
            oque: `Febre desde ontem. Ficou caidinh${p.o} de manhã, mas {{depois do remédio tá brincando|brincando}}.`,
            consciencia: `Acordad${p.o}, brincando no tapete.`,
            respira: 'Normal, normal.',
            inicio: 'Desde ontem à tarde.',
            idade: `${p.anos}.`,
            historico: 'Saudável. Vacina em dia.',
            paciente: [`${p.PT}: ${p.cg('Papai', 'Mamãe')}, posso tomar sorvete?`, '[{{risada de criança|risada}}]'],
          },
          extra: [
            ex('alarme', 'Manchas, vômito, moleza?', 'Tem manchas na pele, vômito, está molinho demais, pescoço duro?', 'Não, nada disso. {{Tá comendo até|comendo}}.'),
            ex('febre', 'Quanto deu a febre?', 'Quanto deu a febre?', '{{38 e pouquinho|febre_38}}. Baixou com o antitérmico.'),
          ],
          links: [lk('brincando', 'comendo', 'Febre baixa, criança brincando e comendo: sem sinais de gravidade. Verde.', { kind: 'confirma' })],
          radio: { excess: '{central}, {unit}. Virose, {dr}. A criança pediu pra ligar a sirene.' },
          diary: { ori: 'Febre de virose, brincando. Orientados antitérmico e UBS.' },
        };
      },
    },
    {
      id: 'convulsao_febril',
      weight: 1.5,
      build: (p0) => {
        const p = p0.at(1, 5);
        return {
          who: p,
          truth: { dx: 'Convulsão febril (já passou)', sev: 'amarelo', ok: ['USB'], dest: ['UPA'] },
          note: 'Criança com febre. Tremeu, disse a família.',
          noteWrong: 'Febre de virose. Tranquilo, {dr}.',
          amb: ['choro'],
          noise: ['[choro fraco]'],
          q: {
            oque: 'Tava com febre e de repente {{tremeu todo, revirou o olho|tremeu}}! Parou agora!',
            consciencia: `{{Tá sonolent${p.o}, mas acorda e chora quando eu chamo|acorda}}.`,
            respira: 'Respira, sim. Normal agora.',
            inicio: '{{Durou uns dois minutos|dois_min}}. Parou faz cinco.',
            idade: `${p.anos}.`,
            historico: 'Nunca teve isso. A febre começou hoje cedo.',
          },
          extra: [
            ex('febre', 'Quanto deu a febre?', 'Quanto deu a febre?', '{{39 e meio|febre_alta}}.'),
            ex('manchas', 'Manchas? Pescoço duro?', 'Tem manchas na pele? O pescoço está duro?', 'Nenhuma mancha. O pescoço mexe normal.'),
          ],
          links: [
            lk('tremeu', 'febre_alta', 'Criança pequena, febre alta, tremor de dois minutos que parou e já acorda: convulsão febril. Amarelo, USB.'),
            lk('dois_min', 'acorda', 'Crise curta e criança que já acorda: não é estado de mal.', { kind: 'confirma' }),
          ],
          radio: { ok: 'Central, {unit}. Convulsão febril, já acordad' + p.o + ' e chorando. Seguimos pra UPA.' },
          diary: { alive: 'Primeira convulsão de febre. Susto enorme, criança bem.' },
        };
      },
    },
    {
      id: 'meningite',
      weight: 1,
      build: (p0) => {
        const p = p0.at(0, 8);
        return {
          who: p,
          truth: { dx: 'Meningococcemia (febre com manchas roxas)', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 50, bad: 120 } },
          note: 'Criança com febre e manchas, {dr}.',
          noteWrong: `Febre de virose. ${p.cg('Pai ansioso', 'Mãe ansiosa')}.`,
          amb: ['silencio', 'choro'],
          noise: ['[um choro fraquinho, um gemido]'],
          q: {
            oque: 'Febre alta desde a madrugada, e agora {{apareceram umas manchinhas roxas|manchas}}.',
            consciencia: `{{Muito molinh${p.o}, só quer dormir|molinho}}.`,
            respira: 'Respira rápido.',
            inicio: 'As manchas apareceram faz uma hora. Tão espalhando.',
            idade: `${p.anos}.`,
            historico: 'Nada. A vacina... tem umas atrasadas.',
          },
          extra: [
            ex('copo', 'Somem com o copo?', 'Aperta um copo de vidro em cima das manchas: elas somem?', '{{Não somem! Continuam roxas debaixo do copo|nao_somem}}!'),
            ex('pescoco', 'Pescoço duro?', p.age <= 1 ? 'A moleira está estufada? Chora quando mexe?' : 'O pescoço está duro? Chora quando dobra?', p.age <= 1 ? '{{A moleira tá estufadinha|pescoco}}, chora quando eu pego.' : '{{Chora quando eu dobro o pescoço|pescoco}}.'),
          ],
          links: [
            lk('manchas', 'nao_somem', 'Manchas roxas que não somem com a pressão do copo, febre e moleza: meningococcemia. Vermelho, USA, agora.'), // RC6/RC14: púrpura (erupção fixa) = USA
            lk('pescoco', 'molinho', 'Rigidez e moleza com febre: infecção grave do sistema nervoso.', { kind: 'confirma' }),
          ],
          radio: { ok: '{central}, {unit}. Meningococcemia, antibiótico na veia. Seguimos pro Regional, isolamento avisado.' },
          diary: { alive: 'Manchas que não sumiam no copo. Meningite. Antibiótico a tempo.', dead: 'Meningococcemia. As manchas espalharam rápido.' },
        };
      },
    },
    {
      id: 'dengue_alarme',
      weight: 1.2,
      minDay: 11,
      build: (p0) => {
        const p = p0.at(4, 8);
        return {
          who: p,
          truth: { dx: 'Dengue com sinais de alarme', sev: 'amarelo', ok: ['USB'], dest: ['UPA'], risk: { good: 90, bad: 260, needs: 'USB' } },
          note: 'Criança com dengue e febre.',
          noteWrong: 'Febre de virose, {dr}.',
          amb: ['tv'],
          q: {
            oque: 'Tá com dengue, o posto confirmou. Hoje {{reclama de uma dor forte na barriga|barriga}}.',
            consciencia: `Acordad${p.o}, mas molinh${p.o}.`,
            respira: 'Normal.',
            inicio: 'Dengue faz quatro dias. A dor na barriga começou hoje.',
            idade: `${p.anos}.`,
            historico: 'Nada antes disso.',
            dengue: '{{Vomitou quatro vezes|vomitos}}. E a gengiva sangrou quando escovou.',
            sangramento: 'Só a gengiva, quando escovou os dentes. Mais nada.',
          },
          links: [
            lm(p, 'barriga', 'dengue_alarme', 'Dengue com dor forte na barriga e vômitos: sinais de alarme. USB → UPA (Manual p.11).'),
            lk('vomitos', 'barriga', 'Vômitos repetidos e dor na barriga na dengue: fase crítica.', { kind: 'confirma' }),
          ],
          radio: { ok: 'Central, {unit}. Dengue com alarme, hidratando. Seguimos pra UPA.' },
          diary: { alive: 'Dengue com dor na barriga. Soro a tempo.' },
        };
      },
    },
    {
      id: 'desidratacao',
      weight: 1.2,
      build: (p0) => {
        const p = p0.at(0, 4);
        return {
          who: p,
          truth: { dx: 'Desidratação por diarreia e febre', sev: 'amarelo', ok: ['USB'], dest: ['UPA'] },
          note: 'Criança pequena com febre e diarreia.',
          noteWrong: 'Febre baixa, criança brincando.',
          amb: ['silencio'],
          q: {
            oque: 'Febre e {{diarreia desde ontem, não segura nada|diarreia}}.',
            consciencia: `Quiet${p.o} e cansadinh${p.o}, mas reage: olha pra mim e chora quando pego no colo.`, // RC11: prostração/hipotonia/"não reage aos pais" seria USA
            respira: 'Respira rapidinho.',
            inicio: 'Desde ontem de manhã.',
            idade: `${p.anos}.`,
            historico: 'Nasceu bem, nada antes.',
          },
          extra: [
            ex('xixi', 'Está fazendo xixi?', 'Está fazendo xixi? A fralda molha?', '{{Não faz xixi desde cedo|sem_xixi}}. A fralda tá sequinha.'),
            ex('olho', 'Olho fundo? Boca seca?', 'O olho está fundo? A boca seca? Chora com lágrima?', '{{O olho tá fundo, a boca seca|olho_fundo}}. Chora sem lágrima.'),
          ],
          links: [lk('sem_xixi', 'olho_fundo', 'Sem xixi, olho fundo e choro sem lágrima, mas ainda reage: desidratação. Amarelo, USB. Se estivesse mole e sem reagir, seria USA.')], // [validar]
          radio: { ok: 'Central, {unit}. Desidratação moderada. Soro, seguimos pra UPA.' },
          diary: { alive: 'Diarreia e febre, desidratou. Soro na UPA.' },
        };
      },
    },
  ],
});

// -----------------------------------------------------------------------------
// "Meu bebê não para de chorar."
// -----------------------------------------------------------------------------
export const BEBE_CHORANDO = tpl({
  id: 'bebe_chorando',
  tags: ['pediatria', 'leve', 'moderado'],
  age: [0, 0],
  rel: ['mae', 'pai', 'mae'],
  cena: { place: 'quarto', props: ['mamadeira'] },
  open: (p) => [`${p.Quem} {{não para de chorar|chorando}}, {dr}. Faz horas. Eu já não sei mais o que fazer.`],
  truths: [
    {
      id: 'colica',
      weight: 3,
      build: (p) => {
        const m = 1 + (p.meses % 3);
        return {
          truth: { dx: 'Cólica do lactente', sev: 'verde', ok: ['ORI'], ref: ['UBS', 'CASA'] },
          note: `Bebê de ${mesTxt(m)} chorando. ${p.cg('Pai', 'Mãe')} exaust${p.cg('o', 'a')}.`,
          noteWrong: 'Bebê chorando de dor! Grave, {dr}!',
          patient: { name: p.name, age: 0, sex: p.sex },
          amb: ['bebe'],
          noise: ['[{{choro forte, a plenos pulmões|choro_forte}}]'],
          q: {
            oque: `Chora sempre nessa hora, {{encolhe as perninhas, solta pum|perninhas}}. Todo dia.`,
            consciencia: `Acordad${p.o}, berrando.`,
            respira: 'Normal. Chora forte.',
            inicio: 'Começou faz umas duas horas. Ontem foi igual.',
            idade: `${mesTxt(m)}.`,
            historico: 'Nasceu bem, no tempo certo. Mama no peito.',
          },
          extra: [
            ex('febre', 'Tem febre? Mama?', 'Tem febre? Está mamando, fazendo xixi e cocô?', '{{Febre não. Mama bem, faz xixi, cocô normal|mama_bem}}.'),
            ex('voce', 'Perguntar como você está', 'E você, como está?', ['...Eu não durmo faz uma semana, {dr}. Desculpa.', 'Eu só queria saber se é normal.'], { kind: 'fala' }),
          ],
          links: [lk('perninhas', 'mama_bem', 'Bebê pequeno que chora nas mesmas horas, encolhe as pernas e solta pum, sem febre e mamando bem: cólica. Orientar e acolher.')],
          radio: { excess: '{central}, {unit}. Cólica, {dr}. O bebê dormiu no colo do enfermeiro.' },
          diary: { ori: 'Cólica de bebê. A família não dormia fazia uma semana.' },
        };
      },
    },
    {
      id: 'invaginacao',
      weight: 1,
      build: (p) => {
        const m = 5 + (p.meses % 7);
        return {
          truth: { dx: 'Invaginação intestinal', sev: 'amarelo', ok: ['USB'], dest: ['REG'] },
          note: `Bebê de ${mesTxt(m)} chorando em crises.`,
          noteWrong: 'Cólica de bebê. Tranquilo, {dr}.',
          patient: { name: p.name, age: 0, sex: p.sex },
          amb: ['bebe', 'silencio'],
          noise: ['[o choro para de repente... silêncio... e volta, desesperado]'],
          q: {
            oque: `Chora {{em crise, uns minutos, e para|crises}}. Entre uma e outra fica {{pálid${p.o} e mole|mole}}.`,
            consciencia: 'Entre as crises fica largadinho no meu colo.',
            respira: 'Normal.',
            inicio: 'Desde cedo. As crises tão vindo mais perto.',
            idade: `${mesTxt(m)}.`,
            historico: 'Saudável. Teve uma gripe semana passada.',
            sangramento: 'Machucado não tem. Sangramento assim, não.',
          },
          extra: [
            ex('coco', 'Como está o cocô?', 'Como está o cocô? Viu sangue?', '{{Saiu um cocô com sangue, tipo geleia|geleia}}!'),
            ex('vomito', 'Vomitou?', 'Vomitou?', 'Vomitou duas vezes.'),
          ],
          links: [lk('crises', 'geleia', 'Crises de choro com moleza entre elas, vômito e cocô "geleia de morango": invaginação intestinal. USB → Regional (cirurgia).')], // RP2: inconsolável, vômitos e fezes em groselha = USI/USB; Regional pela avaliação cirúrgica pediátrica (Anexo VII)
          radio: { ok: 'Central, {unit}. Suspeita de invaginação. Seguimos pro Regional, cirurgia pediátrica avisada.' },
          diary: { alive: 'Choro em crises e cocô de geleia. Invaginação, resolvida no Regional.' },
        };
      },
    },
    {
      id: 'febre_neonatal',
      weight: 1.2,
      build: (p) => ({
        // ⚖ [validar] BPed19 (USI preferida a USB): RN febril e hipoativo; sem USI no jogo, USB é a melhor e USA é defensável (risco de sepse).
        truth: { dx: 'Febre em recém-nascido', sev: 'amarelo', ok: ['USB', 'USA'], best: 'USB', dest: ['REG', 'UPA'] },
        // cena da videochamada (onde a história acontece)
        cena: { pose: 'colo' },
        note: 'Recém-nascido quente, não mama.',
        noteWrong: 'Bebê com cólica, {dr}.',
        patient: { name: p.name, age: 0, sex: p.sex },
        amb: ['bebe'],
        noise: ['[um choro fraquinho, quase um miado]'],
        q: {
          oque: 'Tá quentinh' + p.o + ' e não quer mamar. Chora fraquinho.',
          consciencia: 'Dormindo muito. Acorda e dorme de novo.',
          respira: 'Rapidinho.',
          inicio: 'Desde a madrugada.',
          idade: '{{Vinte dias|vinte_dias}}.',
          historico: 'Nasceu de 38 semanas, tudo normal.',
        },
        extra: [ex('febre', 'Quanto deu a febre?', 'Mediu a temperatura? Quanto deu?', '{{38 e 2 no termômetro|febre}}.')],
        links: [lk('vinte_dias', 'febre', 'Febre em bebê com menos de três meses é sempre urgente: pode ser infecção grave. USB.')], // [validar]
        radio: { ok: 'Central, {unit}. Recém-nascido febril, hipoativo. Seguimos pro Regional.' },
        diary: { alive: `${p.g('Recém-nascido', 'Recém-nascida')} com febre. Internad${p.o} para investigar. Bem.` },
      }),
    },
    {
      id: 'hernia',
      weight: 0.8,
      build: (p) => {
        const m = 2 + (p.meses % 8);
        return {
          truth: { dx: 'Hérnia inguinal encarcerada', sev: 'amarelo', ok: ['USB'], dest: ['REG'] },
          note: `Bebê de ${mesTxt(m)} chorando muito.`,
          noteWrong: 'Cólica. Tranquilo, {dr}.',
          patient: { name: p.name, age: 0, sex: p.sex },
          amb: ['bebe'],
          q: {
            oque: 'Chorando muito e {{apareceu um caroço na virilha|caroco}}.',
            consciencia: `Acordad${p.o}, chorando.`,
            respira: 'Normal.',
            inicio: 'O caroço apareceu faz umas três horas.',
            idade: `${mesTxt(m)}.`,
            historico: 'Nasceu prematuro, de 34 semanas.',
          },
          extra: [ex('volta', 'O caroço volta?', 'Quando acalma, o caroço volta pra dentro?', '{{Não volta, tá duro e vermelho|duro}}. E vomitou.')],
          links: [lk('caroco', 'duro', 'Caroço na virilha duro, que não volta, com choro e vômito: hérnia encarcerada. USB → Regional (cirurgia).')], // RP2: massa abdominal visível, inconsolável, vômitos persistentes = USI/USB; Regional pela avaliação cirúrgica (Anexo VII)
          radio: { ok: 'Central, {unit}. Hérnia encarcerada. Seguimos pro Regional, cirurgia avisada.' },
          diary: { alive: 'Um caroço na virilha que não voltava. Hérnia, operada a tempo.' },
        };
      },
    },
  ],
});

// -----------------------------------------------------------------------------
// "Meu filho se queimou! Derrubou a água quente!"
// -----------------------------------------------------------------------------
export const QUEIMADURA_CRIANCA = tpl({
  id: 'queimadura_crianca',
  tags: ['pediatria', 'trauma_moderado', 'leve'],
  age: [1, 8],
  rel: ['mae', 'pai'],
  cena: { place: 'cozinha', props: ['panela'] },
  open: (p) => [`{Dr}, ${p.quem} {{se queimou|queimou}}! Derrubou a água quente!`],
  truths: [
    {
      id: 'pequena',
      weight: 2.5,
      build: (p) => ({
        truth: { dx: 'Queimadura pequena na mão', sev: 'verde', ok: ['ORI'], ref: ['UBS', 'UPA'] },
        note: 'Criança queimada, mão. Parece pequena.',
        noteWrong: 'Criança muito queimada! Grave, {dr}!',
        amb: ['cozinha', 'choro'],
        q: {
          oque: 'Encostou a mão na chaleira. {{Pegou só na mão|so_mao}}.',
          consciencia: `Acordad${p.o}, chorando.`,
          respira: 'Normal.',
          sangramento: 'Não sangra. {{Tá vermelhinho, com uma bolhinha pequena|bolhinha}}.',
          idade: `${p.anos}.`,
          historico: 'Nada. Saudável.',
        },
        extra: [ex('agua', 'Já pôs na água?', 'Já colocou a mão debaixo da água corrente?', 'Pus debaixo da torneira, já parou de chorar tanto.')],
        links: [lk('so_mao', 'bolhinha', 'Queimadura pequena, só na mão, uma bolha: água corrente em temperatura ambiente (sem gelo), não estourar bolha, nada de pasta de dente. UBS.')], // campo A10 (BPed27): na criança água gelada e gelo são contraindicados; não romper bolhas. [validar] "nada de pasta de dente/pomada" não consta nas páginas (primeiros socorros padrão); "água corrente" é a adaptação leiga do "soro fisiológico em abundância"
        radio: { excess: '{central}, {unit}. Queimadura pequena na mão, {dr}. Já tava brincando.' },
        diary: { ori: 'Queimou a mão na chaleira. Água corrente e UBS.' },
      }),
    },
    {
      id: 'bolhas_braco',
      weight: 1.5,
      build: (p) => ({
        truth: { dx: 'Queimadura de segundo grau no braço', sev: 'amarelo', ok: ['USB'], dest: ['UPA'] },
        note: 'Criança queimada no braço.',
        noteWrong: 'Queimadurinha na mão. Leve.',
        amb: ['cozinha', 'choro'],
        noise: ['[choro alto]'],
        q: {
          oque: 'Puxou a caneca de café quente da mesa. {{Molhou o braço inteiro|braco}}.',
          consciencia: `Acordad${p.o}, chorando muito.`,
          respira: 'Normal, chorando.',
          sangramento: 'Não sangra. {{Tá cheio de bolha, da mão até o cotovelo|bolhas}}.',
          idade: `${p.anos}.`,
          historico: 'Nada.',
        },
        links: [lk('braco', 'bolhas', 'Bolhas no braço inteiro de uma criança: queimadura de segundo grau extensa para o tamanho dela. Amarelo, USB.')], // [validar] RT7: dor intensa = USB; o RT7 não traz extensão da queimadura
        radio: { ok: 'Central, {unit}. Queimadura de segundo grau no braço, analgesia. Seguimos pra UPA.' },
        diary: { alive: 'Café quente no braço. Curativos por duas semanas.' },
      }),
    },
    {
      id: 'extensa',
      weight: 1,
      build: (p) => ({
        truth: { dx: 'Queimadura extensa (tronco) em criança', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 60, bad: 150 } },
        note: 'Criança muito queimada!',
        noteWrong: 'Queimadura leve na mão.',
        amb: ['cozinha', 'gritos', 'choro'],
        noise: ['[gritos; uma panela no chão]'],
        q: {
          oque: '{{Puxou a panela de água fervendo do fogão|panela}}! Caiu no peito e na barriga!',
          consciencia: `Acordad${p.o}, gritando... agora tá ficando quiet${p.o}.`,
          respira: 'Rápido.',
          sangramento: '{{A pele tá soltando|pele}}, {dr}! Tá branca em uns lugares!',
          idade: `${p.anos}.`,
          historico: 'Nada!',
        },
        extra: [ex('roupa', 'Tirou a roupa molhada?', 'Tirou a roupa molhada de cima? Colou na pele?', 'Tirei a camiseta... um pedaço grudou, não puxei.')],
        links: [lk('panela', 'pele', 'Água fervendo no peito e na barriga, pele soltando: queimadura extensa em criança. Vermelho, USA → Regional.')], // [validar] RT7 não traz extensão; USA pelo risco de choque do grande queimado (ATLS/PHTLS)
        radio: { ok: '{central}, {unit}. Queimadura de 20% em criança. Analgesia, soro, cobertura. Seguimos pro Regional.' },
        diary: { alive: 'A panela do fogão. Queimadura extensa. Muitos meses de curativo, mas viv' + p.o + '.', dead: 'Queimadura extensa com a panela do fogão.' },
      }),
    },
    {
      id: 'cha_morno',
      weight: 1,
      build: (p) => ({
        truth: { dx: 'Vermelhidão leve (líquido já morno)', sev: 'azul', ok: ['ORI'], ref: ['CASA', 'UBS'] },
        // cena da videochamada (onde a história acontece)
        cena: { place: 'sala', semProps: ['panela'] },
        note: `Criança "queimada". ${p.cg('Pai', 'Mãe')} assustad${p.co}.`,
        noteWrong: 'Criança queimada com água fervendo!',
        amb: ['desenho'],
        q: {
          oque: 'Derrubou a xícara de chá na perna.',
          consciencia: `Acordad${p.o}. {{Já parou de chorar|parou_chorar}}.`,
          respira: 'Normal.',
          sangramento: '{{Só vermelhinho, nem bolha|vermelho}}.',
          idade: `${p.anos}.`,
          historico: 'Nada.',
        },
        extra: [ex('quente', 'O chá estava quente?', 'O chá estava fervendo ou já tinha esfriado?', '{{Tava morno, eu ia dar pra ele tomar|morno}}... foi mais o susto.')],
        links: [lk('morno', 'vermelho', 'Chá morno, só vermelhidão, criança calma: sem queimadura importante. Água fria e observar em casa.')],
        radio: { excess: '{central}, {unit}. Vermelhidão de chá morno, {dr}. Nem precisou de curativo.' },
        diary: { ori: 'Chá morno na perna. Mais susto que queimadura.' },
      }),
    },
  ],
});

// -----------------------------------------------------------------------------
// "Meu filho caiu e bateu a cabeça!"
// -----------------------------------------------------------------------------
export const CRIANCA_CABECA = tpl({
  id: 'crianca_cabeca',
  tags: ['pediatria', 'trauma_moderado', 'trauma', 'leve', 'grave'],
  age: [4, 10],
  rel: ['mae', 'pai'],
  open: (p) => [`${p.Quem} {{caiu e bateu a cabeça|bateu}}, {dr}! Fez um galo enorme!`],
  truths: [
    {
      id: 'galo',
      weight: 3,
      build: (p) => ({
        truth: { dx: 'Traumatismo craniano leve (galo, sem sinais de alarme)', sev: 'verde', ok: ['ORI'], ref: ['UBS', 'CASA'] },
        note: 'Criança bateu a cabeça. Chorou na hora.',
        noteWrong: 'Criança desmaiada! Bateu a cabeça!',
        amb: ['desenho'],
        q: {
          oque: 'Tropeçou correndo na sala e bateu na quina da mesa.',
          consciencia: `{{Chorou na hora|chorou_na_hora}}, e agora {{já tá brincando|brincando}}.`,
          respira: 'Normal.',
          sangramento: 'Não sangrou. Só o galo.',
          inicio: 'Faz uns vinte minutos.',
          idade: `${p.anos}.`,
          historico: 'Nada.',
          paciente: [`${p.PT}: Doeu... mas já passou. Posso comer biscoito?`],
        },
        extra: [ex('alarme', 'Vômito? Sono? Desmaiou?', 'Desmaiou na hora? Vomitou? Está com sono fora do normal?', 'Não desmaiou, não vomitou. Tá ligadíssim' + p.o + '.')],
        links: [lk('chorou_na_hora', 'brincando', 'Chorou na hora, não desmaiou, não vomita e já brinca: trauma leve. Observar em casa; vômito, sono ou mudança de comportamento: voltar a ligar.')], // RT9: hematoma/inchaço em couro cabeludo e vômito isolado = orientação
        radio: { excess: '{central}, {unit}. Galo na testa, {dr}. Ganhou um adesivo da equipe.' },
        diary: { ori: 'Galo na quina da mesa. Orientada observação em casa.' },
      }),
    },
    {
      id: 'vomitos',
      weight: 1.2,
      build: (p) => ({
        truth: { dx: 'Traumatismo craniano com sinais de alarme', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 45, bad: 110 } },
        // cena da videochamada (onde a história acontece)
        cena: { place: 'quarto', pose: 'cama' },
        note: 'Criança bateu a cabeça. Tá sonolenta.',
        noteWrong: 'Galo na cabeça. Leve, {dr}.',
        amb: ['silencio'],
        q: {
          oque: 'Caiu do beliche, de cabeça no chão.',
          consciencia: `{{Tá com sono, não quer abrir o olho|sono}}.`,
          respira: 'Respira.',
          sangramento: 'Não sangrou. Tem um galo mole atrás.',
          inicio: 'Faz uma hora.',
          idade: `${p.anos}.`,
          historico: 'Nada.',
        },
        extra: [ex('alarme', 'Vômito? Desmaiou?', 'Vomitou? Desmaiou na hora?', '{{Vomitou três vezes|vomitou}}. Na hora não desmaiou, chorou.')],
        links: [lk('sono', 'vomitou', 'Vômitos repetidos e sonolência depois de bater a cabeça: sinais de alarme. TCE: USA → Regional.')], // RT9: sonolência após o trauma = alteração da consciência (USA); vômitos persistentes isolados seriam USB
        radio: { ok: '{central}, {unit}. TCE pediátrico, Glasgow 13. Seguimos pro Regional, tomografia avisada.' },
        diary: { alive: 'Caiu do beliche. Sangramento pequeno no cérebro, sem cirurgia. Bem.', dead: 'Caiu do beliche.' },
      }),
    },
    {
      id: 'apagou',
      weight: 1.5,
      build: (p) => ({
        truth: { dx: 'Traumatismo craniano com perda breve de consciência', sev: 'amarelo', ok: ['USB'], dest: ['UPA', 'REG'] },
        note: 'Criança bateu a cabeça, ficou apagada um pouco.',
        noteWrong: 'Galo. Já tá brincando, {dr}.',
        amb: ['desenho'],
        q: {
          oque: 'Caiu da bicicleta, sem capacete.',
          consciencia: `{{Ficou uns segundos desacordad${p.o}|apagou}}, depois chorou. Agora parece normal.`,
          respira: 'Normal.',
          sangramento: 'Ralou a testa.',
          inicio: 'Faz meia hora.',
          idade: `${p.anos}.`,
          historico: 'Nada.',
        },
        extra: [ex('alarme', 'Vômito? Lembra do que houve?', 'Vomitou? Lembra do que aconteceu?', '{{Não lembra da queda|nao_lembra}}. Vomitar não vomitou.')],
        links: [lk('apagou', 'nao_lembra', 'Desmaiou alguns segundos e não lembra da queda: precisa de avaliação. Amarelo, USB.')], // RT9: história de inconsciência = USB
        radio: { ok: 'Central, {unit}. TCE leve com perda de consciência, estável. Levando pra avaliação.' },
        diary: { alive: 'Caiu da bicicleta sem capacete. Apagou uns segundos. Ficou em observação.' },
      }),
    },
    {
      id: 'altura',
      weight: 0.8,
      build: (p) => ({
        truth: { dx: 'Queda de altura (laje) em criança', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 45, bad: 110 } },
        // cena da videochamada (onde a história acontece)
        cena: { place: 'quintal', cast: [{ role: 'vizinho', act: 'ajoelhado' }, { role: 'vizinha', act: 'mao_na_boca', at: 'fundo' }] },
        note: 'Criança caiu de altura!',
        noteWrong: 'Bateu a cabeça na mesa. Leve.',
        amb: ['gritos', 'choro'],
        noise: ['[gritos de vizinhos]'],
        q: {
          oque: '{{Caiu da laje, do segundo andar|laje}}! Tava empinando pipa!',
          consciencia: `{{Tá quietinh${p.o}, chorando fraco|quieto}}.`,
          respira: 'Rápido.',
          sangramento: 'Um pouco do nariz.',
          inicio: 'Agora! Agora!',
          idade: `${p.anos}.`,
          historico: 'Nada!',
        },
        extra: [ex('mexer', 'Alguém mexeu?', 'Alguém tirou ou mexeu a criança do lugar?', 'O vizinho pegou no colo... eu mandei pôr no chão de novo.')],
        links: [lk('laje', 'quieto', 'Queda de seis metros e criança quieta, chorando fraco: trauma grave. Vermelho, USA.')],
        radio: { ok: '{central}, {unit}. Queda de altura, politrauma pediátrico. Seguimos pro Regional.' },
        diary: { alive: 'Caiu da laje empinando pipa. Fraturas, mas viv' + p.o + '.', dead: 'Caiu da laje empinando pipa.' },
      }),
    },
  ],
});

// -----------------------------------------------------------------------------
// "Meu filho caiu na água!"
// -----------------------------------------------------------------------------
export const AFOGAMENTO = tpl({
  id: 'afogamento',
  tags: ['pediatria', 'respiratorio', 'grave', 'moderado'],
  age: [2, 12],
  rel: ['mae', 'pai'],
  cena: { place: 'piscina', cast: [{ role: 'vizinha', act: 'mao_na_boca', at: 'fundo' }] },
  open: (p) => [`${p.Quem} {{caiu na água|agua}}, {dr}! Ai, meu Deus!`],
  truths: [
    {
      id: 'parada',
      weight: 1.2,
      build: (p) => ({
        truth: { dx: 'Afogamento com parada respiratória', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 30, bad: 75, guideBonus: 28 } },
        note: 'Afogamento! Criança não respira!',
        noteWrong: 'Caiu na piscina, já saiu, tá bem.',
        amb: ['agua', 'gritos'],
        noise: ['[gritos; água espirrando]'],
        q: {
          oque: 'Caiu na piscina da casa da vizinha. {{Tiraram do fundo|fundo}}!',
          consciencia: '{{Não acorda! Tá mole|mole}}!',
          respira: `{{Não respira! Tá ${p.g('roxo', 'roxa')}|nao_respira}}!`,
          inicio: 'Agora! Ninguém sabe quanto tempo ficou lá!',
          idade: `${p.anos}.`,
          historico: 'Nada! Não sabe nadar!',
        },
        links: [lm(p, 'nao_respira', 'parada', `Tirad${p.o} do fundo, mole, sem respirar: parada. USA + RCP guiada já (Manual p.1).`)],
        guide: { id: 'rcp' },
        radio: { saved: '{central}, {unit}. Voltou a respirar. Quem contou a massagem? Contou bonito.', dead: 'Central... {unit}. Fizemos tudo. Óbito às {hora}.' },
        diary: { alive: `Tirad${p.o} do fundo da piscina. A massagem começou na borda.`, dead: 'Afogamento na piscina.' },
      }),
    },
    {
      id: 'tosse',
      weight: 2,
      build: (p) => ({
        // RT1: "história de inconsciência" é USB; "dispneia aguda" e espuma seriam USA. Por isso a criança fica mole uns segundos, mas respira sem esforço.
        truth: { dx: 'Afogamento com perda breve de consciência e tosse', sev: 'amarelo', ok: ['USB'], dest: ['UPA', 'REG'] },
        note: 'Afogamento. Criança tossindo.',
        noteWrong: 'Afogamento, não respira!',
        amb: ['agua', 'choro'],
        noise: ['[tosse, choro]'],
        q: {
          oque: 'Caiu na piscina, tiraram rápido. Ficou mole uns segundos e depois chorou.',
          consciencia: `Acordad${p.o}, chorando alto, assustad${p.o}.`,
          respira: '{{Tossiu muita água|tosse}}, respira um pouco rápido, mas sem fazer esforço. Não tem espuma.',
          inicio: 'Faz uns dez minutos.',
          idade: `${p.anos}.`,
          historico: 'Nada.',
        },
        extra: [ex('labios', 'Lábios roxos?', 'Como estão os lábios?', 'Normais... meio pálidos.')],
        links: [lk('tosse', 'agua', 'Engoliu e aspirou água, ficou mole uns segundos e respira rápido: pode piorar nas próximas horas. USB para avaliar. Com falta de ar forte ou espuma, seria USA.')], // [validar] RT1
        radio: { ok: 'Central, {unit}. Afogamento grau 2, saturação 93. Oxigênio, seguimos.' },
        diary: { alive: 'Caiu na piscina, tossiu muita água. Uma noite em observação.' },
      }),
    },
    {
      id: 'susto',
      weight: 2,
      build: (p) => ({
        // BPed26/APed33: criança que submergiu vai ao hospital mesmo sem sintoma → orientação com ida à UPA (sem "CASA").
        truth: { dx: 'Susto na água, sem sintomas', sev: 'verde', ok: ['ORI'], ref: ['UPA'] },
        note: 'Caiu na piscina. Já saiu, chorando.',
        noteWrong: 'Afogamento! Corre, {dr}!',
        amb: ['agua', 'risadas'],
        q: {
          oque: '{{Ficou uns segundinhos embaixo|segundos}}, o tio pulou e tirou.',
          consciencia: `Acordad${p.o}, {{já tá brincando de novo|brincando}}.`,
          respira: 'Normal. Nem tossiu.',
          inicio: 'Faz uns quinze minutos.',
          idade: `${p.anos}.`,
          historico: 'Nada.',
        },
        links: [lk('segundos', 'brincando', 'Poucos segundos submerso, sem tosse e já brincando: susto, sem urgência de ambulância. Mas criança que ficou debaixo da água deve ser vista na UPA, por meios próprios, mesmo sem sintoma.')], // [validar] BPed26
        radio: { excess: '{central}, {unit}. Tá brincando na piscina de novo, {dr}.' },
        diary: { ori: 'Uns segundos debaixo da água. Susto. Foi à UPA por precaução.' },
      }),
    },
    {
      id: 'rio',
      weight: 0.8,
      minDay: 4,
      build: (p0) => {
        const p = p0.at(7, 12);
        return {
          who: p,
          truth: { dx: 'Criança na correnteza do rio (resgate)', sev: 'vermelho', ok: ['USA'], sup: ['BOMB'], dest: ['REG'], risk: { good: 30, bad: 75 } },
          // cena da videochamada (onde a história acontece)
          cena: { place: 'rio', cast: [{ role: 'curioso', act: 'apontando', at: 'fundo' }, { role: 'curioso', act: 'gritando', at: 'fundo' }] },
          note: 'Criança no rio, na Beira-Rio!',
          noteWrong: 'Caiu na piscina, já tiraram.',
          amb: ['agua', 'gritos', 'vento'],
          noise: ['[barulho de correnteza; gritos]'],
          q: {
            oque: '{{Caiu no rio, lá na Beira-Rio|rio}}! A correnteza levou!',
            consciencia: '{{Ainda tá na água, agarrad' + p.o + ' num galho|galho}}! Gritando!',
            respira: 'Tá gritando, respira!',
            inicio: 'Agora!',
            idade: `${p.anos}.`,
            seguranca: 'Um homem quer pular pra pegar, o rio tá forte!',
          },
          links: [
            lk('rio', 'galho', 'Criança ainda na correnteza: resgate aquático é dos Bombeiros. Ninguém pula. USA + Bombeiros.'),
            lm(p, 'galho', 'cena', 'Resgate na água é cena insegura para quem ajuda (Manual p.4).'),
          ],
          radio: { ok: '{central}, {unit}. Bombeiros tiraram a criança do rio. Hipotermia, consciente. Seguimos.', unsafe: 'Central, {unit}! A criança ainda tá no rio e não tem resgate! Cadê os Bombeiros?!' },
          diary: { alive: 'A correnteza da Beira-Rio. Os Bombeiros tiraram a tempo.', dead: 'A correnteza da Beira-Rio.' },
        };
      },
    },
  ],
});

// -----------------------------------------------------------------------------
// "Meu filho engoliu uma coisa!" (protocolo de intoxicação/corpo estranho: dia 13)
// -----------------------------------------------------------------------------
export const ENGOLIU = tpl({
  id: 'engoliu',
  tags: ['intox', 'pediatria', 'leve'],
  minDay: 13,
  age: [1, 5],
  rel: ['mae', 'pai'],
  cena: { place: 'sala' },
  open: (p) => [`${p.Quem} {{engoliu uma coisa|engoliu}}, {dr}! Eu vi a mão na boca e agora sumiu!`],
  truths: [
    {
      id: 'moeda',
      weight: 2.5,
      build: (p) => ({
        truth: { dx: 'Moeda engolida, sem sintomas', sev: 'verde', ok: ['ORI'], ref: ['UPA'] },
        note: 'Criança engoliu objeto. Respira normal.',
        noteWrong: 'Criança engasgada! Corre!',
        amb: ['desenho'],
        q: {
          oque: 'Tava brincando com o porquinho de moedas.',
          consciencia: `Acordad${p.o}, brincando.`,
          respira: '{{Respira normal|respira_ok}}. Tá até rindo.',
          ingestao: '{{Uma moeda de dez centavos|moeda}}. Faz uns quinze minutos.',
          idade: `${p.anos}.`,
          historico: 'Nada.',
        },
        extra: [ex('engole', 'Engole saliva? Baba?', 'Engole a saliva normal? Está babando? Vomitou?', '{{Engole normal, comeu banana|engole}}. Não baba.')],
        links: [
          lm(p, 'moeda', 'corpo_estranho', 'Moeda engolida sem dificuldade para respirar ou engolir: orientação, UPA por meios próprios (Manual p.13).'),
          lk('respira_ok', 'engole', 'Respira, engole e não baba: a moeda passou para o estômago.', { kind: 'confirma' }),
        ],
        radio: { excess: '{central}, {unit}. Moeda no estômago, {dr}. Vai sair sozinha.' },
        diary: { ori: `Engoliu uma moeda. ${p.cg('Pai orientado', 'Mãe orientada')} a levar à UPA para o raio-x.` },
      }),
    },
    {
      id: 'bateria',
      weight: 1.2,
      build: (p) => ({
        truth: { dx: 'Bateria de botão engolida', sev: 'amarelo', ok: ['USB'], dest: ['REG'] },
        note: 'Criança engoliu objeto pequeno.',
        noteWrong: 'Engoliu uma moeda. Leve, {dr}.',
        amb: ['tv'],
        q: {
          oque: 'Tava mexendo no controle da TV.',
          consciencia: `Acordad${p.o}, meio choros${p.o}.`,
          respira: 'Normal.',
          ingestao: '{{A bateria redondinha, achatada, do controle|bateria}}. Faz meia hora.',
          idade: `${p.anos}.`,
          historico: 'Nada.',
        },
        extra: [ex('engole', 'Engole saliva? Baba?', 'Engole a saliva normal? Está babando?', '{{Tá babando um pouco|baba}}, e não quis o suco.')],
        links: [lk('bateria', 'baba', 'Bateria de botão engolida queima o esôfago em poucas horas, e já está babando: urgência. USB → Regional (endoscopia). Não provocar vômito.')], // [validar]
        radio: { ok: 'Central, {unit}. Bateria de botão no esôfago no raio-x. Seguimos pro Regional, endoscopia avisada.' },
        diary: { alive: 'Engoliu a bateria do controle. Endoscopia a tempo.' },
      }),
    },
    {
      id: 'remedio',
      weight: 1.2,
      build: (p) => ({
        truth: { dx: 'Ingestão de remédio de adulto (pressão/diabetes)', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 50, bad: 120 } },
        note: 'Criança engoliu remédio de adulto!',
        noteWrong: 'Engoliu uma moeda. Tranquilo.',
        amb: ['silencio'],
        q: {
          oque: 'Mexeu na bolsa da avó.',
          consciencia: `Acordad${p.o}... {{tá ficando molinh${p.o}|molinho}}.`,
          respira: 'Respira.',
          ingestao: '{{Os comprimidos da avó, de pressão e de diabetes|comprimidos}}. A cartela tá aqui, faltam quatro. Faz uns vinte minutos.',
          idade: `${p.anos}.`,
          historico: 'Nada.',
        },
        extra: [ex('suor', 'Suando? Pálido?', 'Está suando, pálido?', '{{Suando, branquinh' + p.o + '|suor}}.')],
        links: [
          lm(p, 'comprimidos', 'intox_grave', 'Remédio de adulto (pressão, diabetes) em criança: USA → Regional (Manual p.13).'),
          lk('molinho', 'suor', 'Moleza e suor depois de remédio de diabetes: açúcar caindo.', { kind: 'confirma' }),
          lm(p, 'comprimidos', 'intox_orient', 'Não provocar vômito, guardar a cartela, observar a respiração enquanto a viatura vai (Manual p.13).', { kind: 'confirma' }),
        ],
        radio: { ok: '{central}, {unit}. Intoxicação por hipoglicemiante e anti-hipertensivo. Glicose, monitorização. Seguimos pro Regional.' },
        diary: { alive: 'Quatro comprimidos da bolsa da avó. Ficou dois dias internad' + p.o + '. Bem.', dead: 'Os comprimidos da bolsa da avó.' },
      }),
    },
    {
      id: 'achou',
      weight: 1,
      build: (p0) => {
        const p = p0.at(3, 5);
        return {
          who: p,
          truth: { dx: 'Não engoliu nada (objeto encontrado)', sev: 'azul', ok: ['ORI'], ref: ['CASA'] },
          note: `${p.cg('Pai', 'Mãe')} acha que a criança engoliu algo.`,
          noteWrong: 'Engoliu pilha! Grave, {dr}!',
          amb: ['desenho'],
          q: {
            oque: 'Tava com um brinco na mão... agora não tá mais!',
            consciencia: `Acordad${p.o}, rindo.`,
            respira: 'Normal.',
            ingestao: 'Um brinco de argola, pequeno. Não sei se engoliu, {dr}.',
            idade: `${p.anos}.`,
            historico: 'Nada.',
            paciente: [`${p.PT}: Não comi! Escondi!`],
          },
          extra: [ex('procurar', 'Procurar pela casa', 'Procura em volta: chão, sofá, roupa da criança.', ['Peraí... debaixo do sofá...', '{{ACHEI! Tava debaixo da almofada|achou}}! Ai, {dr}, desculpa.'])],
          links: [lk('achou', 'engoliu', 'O objeto foi achado: ninguém engoliu nada. Orientação.')],
          radio: { excess: '{central}, {unit}. O brinco tava no sofá, {dr}.' },
          diary: { ori: 'O brinco "engolido" estava debaixo da almofada.' },
        };
      },
    },
  ],
});

// -----------------------------------------------------------------------------
// "Meu filho bebeu um negócio da garrafa de refrigerante!" (dia 13)
// -----------------------------------------------------------------------------
export const BEBEU_PRODUTO = tpl({
  id: 'bebeu_produto',
  tags: ['intox', 'pediatria', 'leve'],
  minDay: 13,
  age: [1, 6],
  rel: ['mae', 'pai'],
  cena: { place: 'cozinha', props: ['garrafa'] },
  open: (p) => [`{Dr}, ${p.quem} {{bebeu um negócio|bebeu}} da garrafa de refrigerante! Não era refrigerante!`],
  truths: [
    {
      id: 'sanitaria_diluida',
      weight: 2,
      build: (p) => ({
        truth: { dx: 'Gole de água sanitária diluída', sev: 'verde', ok: ['ORI'], ref: ['UPA', 'CASA'] },
        note: 'Criança bebeu produto de limpeza. Pouco, parece.',
        noteWrong: 'Criança bebeu soda! Grave!',
        amb: ['cozinha'],
        q: {
          oque: 'Eu tinha guardado a mistura de limpar o chão na garrafa.',
          consciencia: `Acordad${p.o}, normal.`,
          respira: 'Normal.',
          ingestao: '{{Água sanitária bem diluída no balde, um golinho só|diluida}}. Cuspiu na hora.',
          idade: `${p.anos}.`,
          historico: 'Nada.',
        },
        extra: [ex('boca', 'Boca vermelha? Baba?', 'A boca está vermelha? Está babando, vomitando?', '{{Nada disso. Tá pedindo biscoito|sem_lesao}}.')],
        links: [
          lm(p, 'diluida', 'intox_orient', 'Não provocar vômito, guardar a embalagem, observar (Manual p.13).'),
          lk('diluida', 'sem_lesao', 'Um gole de água sanitária muito diluída, cuspido, sem lesão na boca: orientar e observar; UPA se aparecer dor ou vômito.'), // [validar]
        ],
        radio: { excess: '{central}, {unit}. Um gole de água sanitária diluída, {dr}. Criança ótima.' },
        diary: { ori: 'Um gole da mistura de limpar o chão. Orientada observação.' },
      }),
    },
    {
      id: 'soda',
      weight: 1.2,
      build: (p) => ({
        truth: { dx: 'Ingestão de soda cáustica', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 50, bad: 120 } },
        note: 'Criança bebeu produto cáustico!',
        noteWrong: 'Bebeu água da garrafa, {dr}. Susto.',
        amb: ['choro', 'gritos'],
        noise: ['[choro alto, engasgado]'],
        q: {
          oque: `Era a soda que ${p.cg('eu uso', 'o pai usa')} pra desentupir a pia!`,
          consciencia: `Acordad${p.o}, chorando muito.`,
          respira: 'Respira, chorando.',
          ingestao: '{{Soda cáustica|soda}}. Um gole, faz cinco minutos. A embalagem tá aqui.',
          idade: `${p.anos}.`,
          historico: 'Nada.',
        },
        extra: [ex('boca', 'Boca vermelha? Baba?', 'A boca está vermelha? Está babando?', '{{A boquinha tá vermelha e não para de babar|baba}}!')],
        links: [
          lm(p, 'soda', 'intox_grave', 'Produto cáustico em criança: USA → Regional (Manual p.13).'),
          lk('soda', 'baba', 'Soda cáustica e boca queimada, babando: lesão no esôfago. Não provocar vômito, não dar nada. Vermelho, USA.'), // RT5: sialorreia = USA/USI; campo A12 (BTox1): não provocar vômito, nada pela boca, não neutralizar
        ],
        guide: guideIf(!p.F, 'intoxicacao'),
        radio: { ok: '{central}, {unit}. Ingestão de cáustico, lesão oral. Seguimos pro Regional, endoscopia avisada.' },
        diary: { alive: 'Soda na garrafa de refrigerante. Esôfago queimado, mas viv' + p.o + '.', dead: 'Soda na garrafa de refrigerante.' },
      }),
    },
    {
      id: 'querosene',
      weight: 1.2,
      build: (p) => ({
        // [validar] RT5 (mortalidade moderada = USB) × RP1 (dispneia = USA): tosse e respiração rápida, mas sem esforço, saturando 93: mantido USB.
        truth: { dx: 'Ingestão de querosene com aspiração', sev: 'amarelo', ok: ['USB'], dest: ['REG'] },
        note: 'Criança bebeu querosene, tossindo.',
        noteWrong: 'Bebeu produto, mas tá bem.',
        amb: ['silencio'],
        noise: ['[tosse seca, seguida]'],
        q: {
          oque: 'Era o querosene do lampião, na garrafa de guaraná.',
          consciencia: `Acordad${p.o}.`,
          respira: '{{Tossiu muito, agora respira rápido|rapido}}.',
          ingestao: '{{Querosene|querosene}}, um gole. Faz uns vinte minutos.',
          idade: `${p.anos}.`,
          historico: 'Nada.',
        },
        links: [
          lk('querosene', 'rapido', 'Querosene que fez tossir e agora respiração rápida: foi para o pulmão. Não provocar vômito! USB → Regional.'), // [validar]
          lm(p, 'querosene', 'intox_orient', 'Não provocar vômito (Manual p.13): o vômito leva mais querosene ao pulmão.'),
        ],
        radio: { ok: 'Central, {unit}. Ingestão de hidrocarboneto com tosse, saturando 93. Oxigênio. Seguimos pro Regional.' },
        diary: { alive: 'Querosene na garrafa de guaraná. Pneumonite, uns dias de oxigênio.' },
      }),
    },
    {
      id: 'agua',
      weight: 1,
      build: (p) => ({
        truth: { dx: 'Nada: era água', sev: 'azul', ok: ['ORI'], ref: ['CASA'] },
        note: `${p.cg('Pai', 'Mãe')} acha que a criança bebeu produto.`,
        noteWrong: 'Criança bebeu veneno! Grave, {dr}!',
        amb: ['desenho'],
        q: {
          oque: 'Tava na prateleira de baixo, garrafa sem rótulo.',
          consciencia: `Acordad${p.o}, normal.`,
          respira: 'Normal.',
          ingestao: 'Não sei o que é, {dr}! Não tem rótulo!',
          idade: `${p.anos}.`,
          historico: 'Nada.',
        },
        extra: [ex('cheiro', 'Cheira a garrafa', 'Cheira a garrafa. Tem cheiro de alguma coisa?', ['[pausa]', '{{Não tem cheiro nenhum... é a água do filtro que o vô guarda|agua_filtro}}! Ai, {dr}...'])],
        links: [lk('agua_filtro', 'bebeu', 'A garrafa era de água do filtro. Ninguém se intoxicou. Orientar a guardar produtos fora do alcance e nunca em garrafa de refrigerante.')],
        radio: { excess: '{central}, {unit}. Era água, {dr}. Orientamos guardar os produtos no alto.' },
        diary: { ori: 'A garrafa sem rótulo era água do filtro.' },
      }),
    },
  ],
});

export const PEDIATRIA = [FILHO_QUENTE, BEBE_CHORANDO, QUEIMADURA_CRIANCA, CRIANCA_CABECA, AFOGAMENTO, ENGOLIU, BEBEU_PRODUTO];
