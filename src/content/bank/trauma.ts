// =============================================================================
// Banco — trauma: sangramento, batida de carro, moto, queda de altura, briga,
// acidente de trabalho. Cena insegura → PM; resgate/fio/gás → Bombeiros.
// Instruções clínicas marcadas com [validar].
// =============================================================================
import { tpl, lk, lm, must, ex, guideIf, alt } from './kit';

// -----------------------------------------------------------------------------
// "Tá sangrando muito!" (documento de design, 5.2)
// -----------------------------------------------------------------------------
export const SANGRANDO = tpl({
  id: 'sangrando',
  tags: ['trauma_moderado', 'trauma', 'leve', 'grave'],
  age: [20, 80],
  rel: ['esposa', 'marido', 'amigo', 'esposa'],
  open: (p) => [`{{Tá sangrando muito|sangrando}}, {dr}! ${p.Quem}... é sangue pra todo lado!`],
  truths: [
    {
      id: 'corte_superficial',
      weight: 3,
      build: (p0) => {
        const p = p0.at(20, 60);
        return {
          who: p,
          truth: { dx: 'Corte superficial (sangramento controlável)', sev: 'verde', ok: ['ORI'], ref: ['UPA', 'UBS'] },
          // cena da videochamada (onde a história acontece)
          cena: { place: 'cozinha', hold: 'pano' },
          note: `Corte. Quem liga tá muito nervos${p.co}.`,
          noteWrong: 'Hemorragia! Muito sangue, {dr}!',
          type: 'exagerador',
          amb: ['cozinha'],
          noise: ['[alguém ao fundo: "aperta, aperta!"]'],
          q: {
            oque: `Cortou ${alt(p, ['o dedo com a faca de pão', 'a mão no copo que quebrou na pia', 'o dedo abrindo lata de sardinha'])}! Tá pingando no chão todo!`,
            sangramento: '{{Apertei com um pano de prato e parou|parou}}... mas se soltar volta a pingar.',
            consciencia: `Acordad${p.o}. Branc${p.o} de susto, mas falando.`,
            respira: 'Normal.',
            inicio: 'Agora, faz uns cinco minutos.',
            idade: `${p.anos}.`,
            historico: 'Nada. Saudável. Não toma remédio nenhum.',
          },
          extra: [
            ex('tamanho', 'Qual o tamanho do corte?', 'Qual o tamanho do corte? Dá pra ver alguma coisa por dentro?', '{{Uns dois centímetros|pequeno}}. Não dá pra ver nada por dentro.'),
            ex('mexe', 'Mexe os dedos? Sente?', 'Mexe os dedos normalmente? Sente quando encosta?', 'Mexe tudo, sente tudo.'),
          ],
          links: [lk('parou', 'pequeno', 'Corte de dois centímetros que para com pressão, dedos mexendo: sangramento controlável. Compressão e UPA para os pontos.')], // [validar]
          radio: { excess: '{central}, {unit}. Corte de dois centímetros, {dr}. Já tinha parado de sangrar.' },
          diary: { ori: 'Corte com muito sangue e muito susto. Três pontos na UPA.' },
        };
      },
    },
    {
      id: 'arterial',
      weight: 1.3,
      build: (p0) => {
        const p = p0.at(20, 70);
        return {
          who: p,
          truth: { dx: 'Hemorragia arterial no braço', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 45, bad: 110, guideBonus: 15 } },
          // cena da videochamada (onde a história acontece)
          cena: { place: 'cozinha', props: ['vidro'] },
          note: `${p.tipo} cortad${p.o}, sangrando muito!`,
          noteWrong: 'Corte. Nervosismo de quem liga, {dr}.',
          amb: ['gritos'],
          noise: ['[gritos; vidro estalando debaixo dos pés]'],
          q: {
            oque: '{{A vidraça caiu em cima do braço|vidraca}}! Cortou fundo, perto do cotovelo!',
            sangramento: '{{Jorra! Em jato, no ritmo do coração|jato}}! O pano encharcou em segundos!',
            consciencia: `Acordad${p.o}, mas {{branc${p.o}, tont${p.o}, gelad${p.o}|palido}}.`,
            respira: 'Rápido.',
            inicio: 'Agora! Dois minutos!',
            idade: `${p.anos}.`,
            historico: 'Nada!',
          },
          links: [lk('jato', 'palido', 'Sangue em jato, no ritmo do coração, com palidez e tontura: hemorragia arterial com choque. Vermelho, USA + compressão guiada.')],
          guide: guideIf(!p.F, 'hemorragia'),
          radio: {
            ok: '{central}, {unit}. Lesão arterial no braço. Torniquete, soro. Seguimos pro Regional.',
            saved: '{central}, {unit}. Chegamos com o sangramento contido. Quem orientou a compressão? Segurou.',
          },
          diary: { alive: 'A vidraça cortou uma artéria do braço. A compressão segurou até a equipe.', dead: 'Hemorragia pela vidraça.' },
        };
      },
    },
    {
      id: 'epistaxe',
      weight: 1.5,
      build: (p0) => {
        const p = p0.at(55, 85);
        return {
          who: p,
          truth: { dx: 'Sangramento nasal persistente (hipertensão, AAS)', sev: 'amarelo', ok: ['USB'], dest: ['UPA'] },
          // cena da videochamada (onde a história acontece)
          cena: { hold: 'pano' },
          note: `${p.tipo} sangrando pelo nariz faz tempo.`,
          noteWrong: 'Hemorragia grave! Corre, {dr}!',
          amb: ['silencio'],
          noise: ['[alguém cospe na pia]'],
          q: {
            oque: 'Começou a sair {{sangue do nariz|nariz}} e não para! Já encheu uma toalha!',
            sangramento: 'Do nariz. Escorre pela garganta também.',
            consciencia: `Acordad${p.o}, assustad${p.o}.`,
            respira: 'Pela boca.',
            inicio: '{{Faz uns quarenta minutos|quarenta_min}}.',
            idade: `${p.anos}.`,
            historico: '{{Pressão alta, toma AAS todo dia|aas}}.',
          },
          extra: [
            ex('pressao', 'Mediu a pressão?', 'Tem aparelho? Mediu a pressão?', '{{Deu 20 por 12|pa}}.'),
            ex('apertar', 'Orientar a compressão', 'Orientar a compressão', ['Inclinou pra frente... tô apertando...', '...diminuiu, mas ainda escorre um pouco.'], { kind: 'fala', say: 'Sente, incline a cabeça para FRENTE e aperte as duas narinas por 10 minutos, sem soltar para olhar.' }), // campo A5: compressão digital 5–10 min. [validar] "inclinar para a frente" é primeiros socorros padrão, não está nas páginas
          ],
          links: [
            lk('quarenta_min', 'aas', `Sangramento de nariz há quarenta minutos, em ${p.g('hipertenso', 'hipertensa')} que toma AAS: não para sozinho. Amarelo, USB.`),
            lk('pa', 'nariz', 'Pressão 20 por 12 alimentando o sangramento.', { kind: 'confirma' }),
          ],
          radio: { ok: `Central, {unit}. Epistaxe em ${p.g('hipertenso', 'hipertensa')}, tamponamos. Seguimos pra UPA.` },
          diary: { alive: 'Sangramento de nariz que não parava. Tamponado na UPA.' },
        };
      },
    },
    {
      id: 'digestiva',
      weight: 1,
      build: (p0) => {
        const p = p0.at(40, 75);
        return {
          who: p,
          truth: { dx: 'Hemorragia digestiva alta com choque', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 45, bad: 110 } },
          // cena da videochamada (onde a história acontece)
          cena: { place: 'banheiro', props: ['balde'] },
          note: `${p.tipo} vomitando sangue.`,
          noteWrong: 'Sangramento de nariz, parece.',
          amb: ['silencio'],
          noise: ['[alguém vomitando no banheiro]'],
          q: {
            oque: `É pela boca, {dr}! ${p.Ele} {{vomitou sangue|vomitou_sangue}}, uma bacia!`,
            sangramento: 'Vermelho vivo, e uns pedaços escuros, tipo borra de café.',
            consciencia: `Acordad${p.o}, mas {{tont${p.o}, quase desmaiou quando levantou|tonto}}.`,
            respira: 'Rápido.',
            inicio: 'Agora, faz uns quinze minutos.',
            idade: `${p.anos}.`,
            historico: '{{Bebe muito. O fígado já é ruim|figado}}.',
          },
          extra: [ex('fezes', 'Como estão as fezes?', 'Como estão as fezes? Mudou a cor?', '{{Pretas, feito piche, desde anteontem|fezes_pretas}}.')],
          links: [
            lk('vomitou_sangue', 'fezes_pretas', 'Vômito com sangue e fezes pretas, tontura ao levantar: hemorragia digestiva com choque. Vermelho, USA.'),
            lk('figado', 'vomitou_sangue', 'Fígado doente pela bebida: varizes no esôfago sangram muito.', { kind: 'confirma' }),
          ],
          radio: { ok: '{central}, {unit}. Hemorragia digestiva alta, chocad' + p.o + '. Dois acessos, soro. Seguimos pro Regional.' },
          diary: { alive: 'Vomitou sangue. Varizes do esôfago. Endoscopia a tempo.', dead: 'Hemorragia digestiva.' },
        };
      },
    },
  ],
});

// -----------------------------------------------------------------------------
// "Bateu um carro aqui na esquina!"
// -----------------------------------------------------------------------------
export const ACIDENTE_CARRO = tpl({
  id: 'acidente_carro',
  tags: ['trauma', 'trauma_moderado', 'leve', 'grave'],
  age: [18, 70],
  rel: ['testemunha'],
  cena: { place: 'rua', props: ['carro'] },
  open: () => ['{{Bateu um carro aqui|bateu}}, {dr}! Na esquina! Tem gente machucada, eu acho!'],
  truths: [
    {
      id: 'leve',
      weight: 2.5,
      build: (p) => ({
        truth: { dx: 'Colisão leve, vítimas andando', sev: 'verde', ok: ['ORI'], ref: ['UPA'] },
        // cena da videochamada (onde a história acontece)
        cena: { pose: 'em_pe', cast: [{ role: 'motorista', act: 'gritando', at: 'fundo' }, { role: 'curioso', act: 'olhando', at: 'fundo' }] },
        note: 'Batida de carro. Testemunha diz que tá todo mundo de pé.',
        noteWrong: 'Acidente com vítima! Grave, {dr}!',
        type: 'testemunha',
        amb: ['rua', 'buzinas'],
        noise: ['[{{discussão alta, buzinas|discussao}}]'],
        q: {
          oque: 'Batida de leve, um carro na traseira do outro. Todo mundo desceu, {{tão discutindo|discutindo}}.',
          consciencia: 'Acordados, todo mundo. Brigando.',
          respira: 'Todo mundo respirando. Gritando, até.',
          sangramento: 'Sangue não.',
          idade: `${p.g('O motorista', 'A motorista')} da frente tem uns ${Math.round(p.age / 5) * 5}.`,
          seguranca: 'Seguro. Os carros tão no acostamento, pisca-alerta ligado.',
          paciente: [`${p.PT}: Meu pescoço dói um pouco, só. Tô andando, tô bem. Quero é o seguro!`],
        },
        extra: [ex('velocidade', 'Estavam rápido?', 'Os carros estavam rápido? Amassou muito?', '{{Devagar, no semáforo|devagar}}. Amassou o para-choque.')],
        links: [lk('devagar', 'discutindo', 'Batida devagar, todos andando e discutindo: sem vítima grave. Orientar UPA se a dor no pescoço piorar.')],
        radio: { excess: '{central}, {unit}. Ninguém ferido, {dr}. Só uma discussão de seguro.' },
        diary: { ori: `Batida no semáforo. Dor no pescoço, andando. Orientad${p.o} a procurar a UPA.` },
      }),
    },
    {
      id: 'presa',
      weight: 1.3,
      minDay: 4,
      build: (p) => ({
        truth: { dx: 'Vítima presa nas ferragens', sev: 'vermelho', ok: ['USA'], sup: ['BOMB'], dest: ['REG'], risk: { good: 45, bad: 110 } },
        note: 'Batida feia. Vítima presa no carro!',
        noteWrong: 'Batida leve, {dr}. Sem vítima grave.',
        type: 'testemunha',
        amb: ['rua', 'buzinas', 'gritos'],
        noise: ['[metal rangendo; uma buzina presa tocando sem parar]'],
        q: {
          oque: '{{O carro bateu no poste|poste}}, a frente toda amassada! A porta não abre!',
          consciencia: `${p.g('O motorista', 'A motorista')} tá acordad${p.o}, gemendo.`,
          respira: 'Respira, gemendo.',
          sangramento: 'Sangue na cabeça e {{a perna tá presa nas ferragens|presa}}.',
          idade: `Uns ${Math.round(p.age / 5) * 5} anos.`,
          seguranca: '{{Tem cheiro de gasolina... o motor tá fumaçando|gasolina}}.',
        },
        extra: [ex('sair', 'Dá pra tirar a pessoa?', 'Dá pra tirar a pessoa do carro?', 'Não dá! A porta tá amassada, a perna tá presa embaixo do painel.')],
        links: [
          lk('presa', 'poste', 'Vítima presa nas ferragens, consciente, sangrando: precisa de resgate (Bombeiros) e USA.'),
          lm(p, 'gasolina', 'cena', 'Cheiro de gasolina e fumaça: cena insegura até os Bombeiros chegarem (Manual p.4).'),
        ],
        radio: {
          ok: '{central}, {unit}. Bombeiros cortaram a porta. Fratura de fêmur e TCE leve. Seguimos pro Regional.',
          unsafe: 'Central, {unit}! Carro fumaçando, vítima presa e sem resgate! Cadê os Bombeiros?!',
        },
        diary: { alive: 'Presa nas ferragens no poste da esquina. Os Bombeiros cortaram a porta.', dead: 'Presa nas ferragens.' },
      }),
    },
    {
      id: 'mal_subito',
      weight: 1,
      minDay: 6,
      build: (p) => ({
        // ⚖ RC10: diabético confuso, mas reativo = USB (alteração da consciência); USA é a melhor (pode apagar a qualquer momento).
        truth: { dx: 'Hipoglicemia ao volante (batida leve)', sev: 'vermelho', ok: ['USA', 'USB'], best: 'USA', dest: ['REG', 'UPA'], risk: { good: 50, bad: 120, needs: 'USB' } },
        // cena da videochamada (onde a história acontece)
        cena: { place: 'carro', pose: 'preso', first: 'Dentro do carro batido no muro, a motorista sentada ao volante, suada, olhando para o nada.' },
        note: 'Batida leve. Motorista estranho, {dr}.',
        noteWrong: 'Motorista bêbado, batida leve.',
        type: 'testemunha',
        amb: ['rua'],
        noise: ['[pisca-alerta; gente batendo no vidro do carro]'],
        q: {
          oque: `{{O carro bateu devagarzinho no muro|devagar}}, sozinho. ${p.g('O motorista', 'A motorista')} tá estranh${p.o} lá dentro.`,
          consciencia: '{{Tá suando, falando enrolado, não entende nada|confuso}}.',
          respira: 'Respira.',
          sangramento: 'Não, nem machucou.',
          idade: `Uns ${Math.round(p.age / 5) * 5} anos.`,
          seguranca: 'Seguro. O carro tá desligado.',
        },
        extra: [ex('documento', 'Tem documento, pulseira?', 'Tem algum documento, pulseira de identificação?', '{{Tem uma pulseira escrito "diabético"|pulseira}}!')],
        links: [
          lk('pulseira', 'confuso', `Pulseira de ${p.g('diabético', 'diabética')}, ${p.g('suado e confuso', 'suada e confusa')} depois de uma batida à toa: hipoglicemia ao volante. Vermelho, USA.`),
          lm(p, 'confuso', 'hipoglicemia', 'Hipoglicemia imita embriaguez e AVC (Manual p.6).'),
        ],
        radio: { ok: '{central}, {unit}. Glicemia 31 no volante! Corrigimos a glicose, acordou. Seguimos pro Regional.' },
        diary: { alive: 'Hipoglicemia no volante. Bateu devagar no muro. Ninguém mais se feriu.', dead: 'Hipoglicemia ao volante.' },
      }),
    },
    {
      id: 'embriagado',
      weight: 1.2,
      minDay: 4,
      build: (p) => ({
        truth: { dx: 'Motorista embriagado e agressivo com corte na testa', sev: 'amarelo', ok: ['USB'], sup: ['PM'], dest: ['UPA'] },
        // cena da videochamada (onde a história acontece)
        cena: { place: 'calcada', pose: 'em_pe', signs: ['agitado'], cast: [{ role: 'curioso', act: 'gritando', at: 'fundo' }] },
        note: 'Batida. Motorista bêbado e brigando.',
        noteWrong: 'Batida leve. Tranquilo, {dr}.',
        type: 'testemunha',
        amb: ['rua', 'gritos'],
        noise: ['[gritos e palavrão; alguém grita "larga isso!"]'],
        q: {
          oque: `${p.g('O motorista', 'A motorista')} bateu no carro parado e saiu {{querendo bater em todo mundo|agressivo}}.`,
          consciencia: `Acordad${p.o} até demais. Bêbad${p.o}.`,
          respira: 'Respira, gritando.',
          sangramento: 'Tem um corte na testa, escorrendo.',
          idade: `Uns ${Math.round(p.age / 5) * 5}.`,
          seguranca: `{{Não! ${p.Ele} tá com uma barra de ferro na mão, ameaçando|barra}}!`,
        },
        extra: [ex('bebida', 'Bebeu?', 'Dá pra saber se bebeu?', 'Fedendo a cachaça. Mal para em pé.')],
        links: [
          lm(p, 'barra', 'cena', 'Agressor com barra de ferro: cena insegura. USB + PM (Manual p.4).'),
          lk('agressivo', 'barra', 'Ferido, bêbado e armado: a equipe não entra sem a polícia.', { kind: 'confirma' }),
        ],
        radio: { ok: 'Central, {unit}. PM conteve o motorista. Corte na testa suturável, embriaguez. Seguimos pra UPA.', unsafe: 'Central, {unit}! O motorista partiu pra cima da gente com uma barra! Recuamos! Cadê a PM?!' },
        diary: { alive: 'Motorista bêbado com barra de ferro. A PM chegou junto.' },
      }),
    },
  ],
});

// -----------------------------------------------------------------------------
// "Um motoqueiro caiu aqui na rua!"
// -----------------------------------------------------------------------------
export const MOTO = tpl({
  id: 'moto',
  tags: ['trauma', 'trauma_moderado', 'moderado'],
  age: [17, 45],
  sex: 'M',
  rel: ['testemunha', 'colega'],
  cena: { place: 'rua', props: ['moto'], wear: 'motoboy', hat: 'capacete' },
  open: () => ['Um motoqueiro {{caiu aqui na rua|caiu}}, {dr}! Ele tá no chão!'],
  truths: [
    {
      id: 'escoriacoes',
      weight: 2.5,
      build: (p) => ({
        truth: { dx: 'Queda de moto com escoriações leves', sev: 'verde', ok: ['ORI'], ref: ['UPA', 'UBS'] },
        // cena da videochamada (onde a história acontece)
        cena: { pose: 'sentado', hat: null, props: ['capacete'] },
        note: 'Moto caiu. Motoqueiro já de pé, parece.',
        noteWrong: 'Moto! Vítima no chão, grave, {dr}!',
        type: 'testemunha',
        amb: ['rua', 'buzinas'],
        q: {
          oque: 'Derrapou na areia da curva, devagar. {{Já levantou sozinho|levantou}}.',
          consciencia: 'Acordado, xingando a moto.',
          respira: 'Normal.',
          sangramento: '{{Ralou o braço e o joelho|ralado}}. Sangue pouco.',
          idade: 'Novo, uns vinte e poucos.',
          seguranca: 'Já tirei a moto da rua.',
          paciente: [`${p.PT}: Tô bem, {dr}, tô bem. Tenho que entregar o lanche, cancela isso aí.`],
        },
        extra: [ex('capacete', 'Bateu a cabeça? Capacete?', 'Ele bateu a cabeça? Estava de capacete?', 'Tava de capacete, nem arranhou. Lembra de tudo.')],
        links: [lk('levantou', 'ralado', 'Levantou sozinho, lembra de tudo, só ralado: queda leve. Orientar limpar e UPA se doer muito.')],
        radio: { excess: '{central}, {unit}. Escoriação, {dr}. Ele já foi embora entregar o lanche.' },
        diary: { ori: 'Derrapou na areia. Ralado. Foi entregar o lanche.' },
      }),
    },
    {
      id: 'fratura_exposta',
      weight: 1.5,
      build: (p) => ({
        truth: { dx: 'Fratura exposta de perna', sev: 'amarelo', ok: ['USB'], dest: ['REG'], risk: { good: 90, bad: 240, needs: 'USB' } },
        note: 'Moto. Vítima com a perna machucada.',
        noteWrong: 'Moto, queda leve. Já levantou.',
        type: 'testemunha',
        amb: ['rua', 'gritos'],
        noise: ['[um grito de dor]'],
        q: {
          oque: 'Um carro fechou ele, caiu e a moto caiu em cima da perna.',
          consciencia: 'Acordado, gritando de dor.',
          respira: 'Respira, gritando.',
          sangramento: '{{O osso tá aparecendo na canela|osso}}! Sangra um pouco em volta.',
          idade: 'Uns vinte e cinco.',
          seguranca: 'O pessoal tá desviando o trânsito.',
        },
        extra: [ex('capacete', 'Bateu a cabeça? Capacete?', 'Ele bateu a cabeça? Estava de capacete?', 'Tava de capacete. A cabeça tá boa, ele fala tudo.')],
        links: [lk('osso', 'caiu', 'Osso aparecendo, consciente, sem trauma de cabeça: fratura exposta. Amarelo, USB → Regional (ortopedia). Cobrir com pano limpo, não empurrar o osso.')], // RT6/RC24: fratura exposta = USB; Anexo VII: perfil traumato-ortopédico vai a serviço especializado. [validar] "cobrir com pano limpo" é primeiros socorros padrão
        radio: { ok: 'Central, {unit}. Fratura exposta de tíbia, imobilizada. Seguimos pro Regional.' },
        diary: { alive: 'Fratura exposta na canela. Operou.' },
      }),
    },
    {
      id: 'tce',
      weight: 1.2,
      build: (p) => ({
        truth: { dx: 'Traumatismo cranioencefálico grave', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 45, bad: 110, guideBonus: 15 } },
        // cena da videochamada (onde a história acontece)
        cena: { props: ['onibus'] },
        note: 'Moto! Vítima no chão, não responde.',
        noteWrong: 'Moto. Parece leve, {dr}.',
        type: 'testemunha',
        amb: ['rua', 'buzinas', 'gritos'],
        noise: ['[alguém grita "não mexe nele!"]'],
        q: {
          oque: 'Vinha rápido, bateu na lateral do ônibus. Voou longe.',
          consciencia: '{{Não responde|nao_responde}}. Chamei, nada.',
          respira: 'Tá fazendo um {{barulho, tipo ronco|ronco}}.',
          sangramento: 'Do {{ouvido|ouvido}}, e um pouco no queixo.',
          idade: 'Novo, uns vinte.',
          seguranca: 'O ônibus parou no meio da pista, tem gente desviando.',
        },
        extra: [ex('capacete', 'Capacete?', 'Ele está de capacete?', 'Tá de capacete. Ninguém tirou.')],
        links: [lk('ronco', 'nao_responde', 'Não responde e ronca depois de trauma de alta energia, sangue no ouvido: TCE grave. Vermelho, USA → Regional.')],
        guide: { id: 'trauma' },
        worsen: [{ after: 100, lines: ['{{Ele vomitou! Tá engasgando!|vomitou}}'], guide: 'trauma' }],
        radio: { ok: 'Central, {unit}. TCE grave, Glasgow 6, intubado. Seguimos pro Regional.' },
        diary: { alive: 'Moto contra ônibus. TCE grave, intubado na rua.', dead: 'Moto contra ônibus. TCE grave.' },
      }),
    },
    {
      id: 'corte_braco',
      weight: 1.5,
      build: (p) => ({
        // [validar] RC24: "dor moderada" e edema são orientação e só "dor intensa"/"deformidade grosseira" são USB; corte fundo + ombro doendo depois de queda de moto: mantido USB.
        truth: { dx: 'Corte profundo no braço e dor no ombro', sev: 'amarelo', ok: ['USB'], dest: ['UPA'] },
        // cena da videochamada (onde a história acontece)
        cena: { pose: 'sentado', hat: null, props: ['capacete'] },
        note: 'Moto. Vítima sentada, com corte.',
        noteWrong: 'Moto, só um arranhão, {dr}.',
        type: 'testemunha',
        amb: ['rua', 'maquina'],
        q: {
          oque: 'Escorregou no óleo, caiu de lado. {{Tá sentado, conversando|conversando}}.',
          consciencia: 'Acordado, falando.',
          respira: 'Normal.',
          sangramento: 'Pouco sangue, já pôs um pano. Mas {{o corte é fundo, dá pra ver por dentro|fundo}}.',
          idade: 'Uns vinte e poucos.',
          seguranca: 'Tirei a moto da rua já.',
          paciente: [`${p.PT}: Tô bem... só o braço que arde. E o ombro dói pra mexer.`],
        },
        extra: [ex('capacete', 'Bateu a cabeça? Capacete?', 'Ele bateu a cabeça? Estava de capacete?', 'Tava de capacete. Não bateu, lembra de tudo.')],
        links: [lk('fundo', 'conversando', 'Consciente e conversando, mas com corte fundo e ombro doendo: trauma moderado. Amarelo, USB.')],
        radio: { ok: 'Central, {unit}. Corte profundo no antebraço, luxação de ombro. Seguimos pra UPA.' },
        diary: { alive: 'Queda de moto no óleo. Corte fundo e ombro no lugar de novo.' },
      }),
    },
    {
      id: 'torax',
      weight: 0.8,
      build: (p) => ({
        truth: { dx: 'Trauma de tórax com choque', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 45, bad: 110 } },
        note: 'Moto. Vítima com falta de ar.',
        noteWrong: 'Moto, queda leve. Tá falando.',
        type: 'testemunha',
        amb: ['rua', 'gritos'],
        q: {
          oque: 'Bateu de frente no carro, {{o peito bateu no guidão|guidao}}.',
          consciencia: 'Acordado, mas meio mole.',
          respira: '{{Tá puxando o ar, curtinho, diz que não entra|falta_ar}}.',
          sangramento: 'Por fora, quase nada.',
          idade: 'Uns trinta.',
          seguranca: 'Seguro, o trânsito parou.',
          pele: '{{Branco, suando, a mão gelada|palido}}.',
          pulso: 'No pescoço tem, mas tá fraquinho e rápido.',
        },
        links: [lk('guidao', 'falta_ar', 'Peito contra o guidão e falta de ar: trauma de tórax.'), lk('palido', 'falta_ar', 'Pálido, gelado e sem ar, sangrando por dentro: choque. Vermelho, USA.')],
        radio: { ok: '{central}, {unit}. Pneumotórax, drenamos no local. Seguimos pro Regional.' },
        diary: { alive: 'O peito bateu no guidão. Pulmão furado, drenado na rua.', dead: 'Trauma de tórax na moto.' },
      }),
    },
  ],
});

// -----------------------------------------------------------------------------
// "Meu marido caiu da escada mexendo na calha!"
// -----------------------------------------------------------------------------
export const QUEDA_ALTURA = tpl({
  id: 'queda_altura',
  tags: ['trauma', 'trauma_moderado', 'grave'],
  age: [25, 70],
  sex: 'M',
  rel: ['esposa', 'filho', 'vizinho', 'colega'],
  cena: { place: 'quintal', props: ['escada'] },
  open: (p) => [`${p.Quem} {{caiu da escada|caiu}}, {dr}! Tava lá em cima mexendo na calha!`],
  truths: [
    {
      id: 'coluna',
      weight: 1.5,
      build: (p) => ({
        truth: { dx: 'Trauma de coluna (queda de 4 metros)', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 45, bad: 110 } },
        note: 'Queda de altura. Não mexe as pernas.',
        noteWrong: 'Caiu da escada, torceu o pé.',
        amb: ['gritos', 'passaros'],
        q: {
          oque: 'Caiu {{lá do alto, do telhado, uns quatro metros|alto}}. De costas no chão.',
          consciencia: 'Acordado, falando, chorando.',
          respira: 'Respira, sim.',
          sangramento: 'Sangue não.',
          idade: `${p.anos}.`,
          paciente: [`${p.PT}: Eu {{não sinto as pernas|pernas}}... não sinto nada da cintura pra baixo...`],
        },
        extra: [ex('mexer', 'Alguém mexeu nele?', 'Alguém tentou levantar ou mexer nele?', 'Não! O vizinho falou pra não mexer.')],
        links: [lk('alto', 'pernas', 'Queda de quatro metros de costas e não sente as pernas: trauma de coluna. Não mexer! Vermelho, USA.')],
        radio: { ok: '{central}, {unit}. Trauma raquimedular, imobilizado na prancha. Seguimos pro Regional.' },
        diary: { alive: 'Caiu do telhado. Coluna. Ninguém mexeu nele, e isso ajudou.', dead: 'Queda do telhado.' },
      }),
    },
    {
      id: 'entorse',
      weight: 2.5,
      build: (p) => ({
        truth: { dx: 'Entorse de tornozelo', sev: 'verde', ok: ['ORI'], ref: ['UPA', 'UBS'] },
        note: 'Caiu da escada. Parece leve.',
        noteWrong: 'Queda de altura! Grave, {dr}!',
        amb: ['passaros'],
        q: {
          oque: 'Escorregou {{nos últimos degraus|degraus}}, caiu sentado e virou o pé.',
          consciencia: 'Acordado, xingando a escada.',
          respira: 'Normal.',
          sangramento: 'Não.',
          idade: `${p.anos}.`,
          paciente: [`${p.PT}: Só o tornozelo, gente. Inchou. Mas eu {{piso, mancando, mas piso|pisa}}.`],
        },
        links: [lk('degraus', 'pisa', 'Caiu dos últimos degraus, só o tornozelo, consegue pisar: entorse. Gelo, repouso e UPA por meios próprios.')], // RC24: dor moderada e edema, apoiando o pé = orientação
        radio: { excess: '{central}, {unit}. Entorse de tornozelo, {dr}. Ele tava tomando cerveja com gelo no pé.' },
        diary: { ori: 'Torceu o pé nos últimos degraus.' },
      }),
    },
    {
      id: 'fratura_braco',
      weight: 2,
      build: (p) => ({
        truth: { dx: 'Fratura de antebraço (queda de 2 metros)', sev: 'amarelo', ok: ['USB'], dest: ['UPA'] },
        note: 'Caiu da escada. Braço machucado.',
        noteWrong: 'Caiu de altura, não mexe as pernas!',
        amb: ['gemidos'],
        noise: ['[gemidos]'],
        q: {
          oque: 'Caiu de uns dois metros e {{pôs o braço na frente|braco}}.',
          consciencia: 'Acordado, gemendo.',
          respira: 'Normal.',
          sangramento: 'Não sangra. Mas {{o braço tá torto no meio|torto}}.',
          idade: `${p.anos}.`,
          paciente: [`${p.PT}: Bati só o braço... a cabeça não. Mexo as pernas, tá vendo?`],
        },
        links: [lk('torto', 'braco', 'Braço torto depois de cair com a mão na frente, cabeça e pernas bem: fratura de antebraço. Amarelo, USB.')],
        radio: { ok: 'Central, {unit}. Fratura de antebraço, imobilizada. Seguimos pra UPA.' },
        diary: { alive: 'Queda da escada, braço quebrado. Gesso.' },
      }),
    },
    {
      id: 'choque',
      weight: 0.8,
      minDay: 4,
      build: (p) => ({
        // [validar] RT7 põe "queimadura elétrica" em USI/USB; USA aqui pelo choque de alta tensão com queda e coração "pulando" (arritmia).
        truth: { dx: 'Choque elétrico com queda (fio energizado no local)', sev: 'vermelho', ok: ['USA'], sup: ['BOMB'], dest: ['REG'], risk: { good: 45, bad: 110 } },
        note: 'Caiu da escada. Falou em choque, {dr}.',
        noteWrong: 'Queda da escada. Torção, acho.',
        amb: ['gritos', 'rua'],
        noise: ['[{{um zumbido elétrico; estalos|zumbido}}]'],
        q: {
          oque: '{{A calha de alumínio encostou no fio da rua|fio}}! Ele levou um choque e caiu!',
          consciencia: 'Acordado, tremendo, olhando pro nada.',
          respira: 'Respira rápido.',
          sangramento: '{{A mão tá queimada, preta|queimada}}.',
          idade: `${p.anos}.`,
          seguranca: '{{A calha ainda tá encostada no fio, caída no quintal|perigo}}. Ninguém chegou perto.',
        },
        extra: [ex('coracao', 'Sente o coração?', 'Ele sente o coração estranho? Dor no peito?', 'Diz que o coração tá pulando, esquisito.')],
        links: [
          lm(p, 'perigo', 'cena', 'Fio energizado no quintal: cena insegura. Ninguém encosta; Bombeiros e concessionária (Manual p.4).'),
          lk('fio', 'queimada', 'Choque de alta tensão com queimadura e coração "pulando": risco de arritmia. Vermelho, USA.'), // [validar]
        ],
        radio: { ok: '{central}, {unit}. Bombeiros desligaram a rede. Queimadura elétrica e arritmia. Seguimos pro Regional.', unsafe: 'Central, {unit}! Fio energizado no quintal! A equipe não entra sem os Bombeiros!' },
        diary: { alive: 'A calha encostou no fio. Queimadura e o coração pulando. Sobreviveu.', dead: 'Choque elétrico na calha.' },
      }),
    },
  ],
});

// -----------------------------------------------------------------------------
// "Teve uma briga aqui!" (cena insegura: dia 4)
// -----------------------------------------------------------------------------
export const BRIGA = tpl({
  id: 'briga',
  tags: ['trauma', 'trauma_moderado', 'grave'],
  minDay: 4,
  age: [18, 50],
  sex: 'M',
  rel: ['testemunha', 'amigo', 'vizinho'],
  cena: { place: 'calcada', cast: [{ role: 'curioso', act: 'olhando', at: 'fundo' }, { role: 'curioso', act: 'gritando', at: 'fundo' }] },
  open: () => ['{Dr}, teve uma {{briga aqui|briga}}! O cara tá machucado, tá sangrando!'],
  truths: [
    {
      id: 'facada',
      weight: 2,
      build: (p) => ({
        truth: { dx: 'Ferimento por faca no abdome, agressor no local', sev: 'vermelho', ok: ['USA'], sup: ['PM'], dest: ['REG'], risk: { good: 45, bad: 110 } },
        // cena da videochamada (onde a história acontece)
        cena: { cast: [{ role: 'curioso', act: 'gritando', at: 'fundo', sex: 'M' }, { role: 'curioso', act: 'escondido', at: 'esq' }] },
        note: 'Briga, facada! Agressor ainda por aí.',
        noteWrong: 'Briga de bar, soco. Leve, {dr}.',
        amb: ['gritos', 'rua', 'multidao'],
        noise: ['[gritos; alguém grita "ele tá voltando!"]'],
        q: {
          oque: '{{Levou uma facada na barriga|facada}}! O outro puxou a faca do nada!',
          consciencia: 'Acordado, mas branco, gemendo.',
          respira: 'Rápido.',
          sangramento: 'Muito! A camisa tá encharcada!',
          idade: 'Uns trinta.',
          seguranca: '{{O cara da faca ainda tá aqui na rua, gritando|agressor}}! Tá com a faca na mão!',
        },
        links: [
          lm(p, 'agressor', 'cena', 'Agressor armado ainda no local: cena insegura. USA + PM (Manual p.4).'),
          lk('facada', 'agressor', 'Facada na barriga e o agressor armado na rua: a equipe só entra com a polícia.', { kind: 'confirma' }),
        ],
        radio: {
          ok: '{central}, {unit}. PM conteve o agressor. Ferimento abdominal, chocado. Seguimos pro Regional.',
          unsafe: 'Central, {unit}! O agressor ainda tá com a faca! Recuamos! Cadê a PM?!',
        },
        diary: { alive: 'Facada na barriga numa briga. A PM chegou junto, a equipe entrou.', dead: 'Facada numa briga.' },
      }),
    },
    {
      id: 'soco',
      weight: 2,
      build: (p) => ({
        truth: { dx: 'Corte no supercílio após soco (agressor foi embora)', sev: 'verde', ok: ['ORI', 'USB'], best: 'ORI', ref: ['UPA'], dest: ['UPA'], must: must(p, 'seguranca', 'consciencia') },
        // cena da videochamada (onde a história acontece)
        cena: { place: 'bar_porta', hold: 'pano' },
        note: 'Briga. Um ferido no rosto, consciente.',
        noteWrong: 'Briga com faca! Grave, {dr}!',
        amb: ['bar', 'musica'],
        noise: ['[música de bar; risadas]'],
        q: {
          oque: 'Levou um soco, {{cortou a sobrancelha|sobrancelha}}. Sangrou bastante.',
          consciencia: '{{Acordado, xingando, lembra de tudo|lucido}}.',
          respira: 'Normal.',
          sangramento: 'Agora parou. Tá com um guardanapo na testa.',
          idade: 'Uns vinte e cinco.',
          seguranca: '{{O outro foi embora de carro faz tempo|foi_embora}}. Tá tranquilo agora.',
          paciente: [`${p.PT}: Tô bem, tô bem! Só quero ir pra casa.`],
        },
        extra: [ex('desmaiou', 'Desmaiou? Vomitou?', 'Ele desmaiou ou vomitou depois do soco?', 'Não desmaiou, não vomitou. Ficou de pé o tempo todo.')],
        links: [lk('lucido', 'foi_embora', 'Agressor foi embora, vítima lúcida, sangramento parado: cena segura e caso leve. UPA para os pontos.')],
        radio: { ok: 'Central, {unit}. Corte no supercílio, lúcido. Levamos pra UPA suturar.', excess: '{central}, {unit}. Corte no supercílio, {dr}. Tá rindo da briga.' },
        diary: { ori: 'Soco no bar. Corte na sobrancelha. Pontos na UPA.', alive: 'Soco no bar. Pontos na sobrancelha.' },
      }),
    },
    {
      id: 'paulada',
      weight: 1.2,
      build: (p) => ({
        truth: { dx: 'Traumatismo craniano por agressão (agressores fugiram)', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 45, bad: 110 } },
        note: 'Briga. Vítima no chão, desacordada.',
        noteWrong: 'Briga, um soco. Leve.',
        amb: ['rua', 'choro'],
        q: {
          oque: '{{Deram uma paulada na cabeça dele|paulada}} e saíram correndo.',
          consciencia: '{{Não acorda direito|nao_acorda}}. Abre o olho e fecha.',
          respira: 'Respira, roncando um pouco.',
          sangramento: 'Sangue na cabeça, atrás.',
          idade: 'Uns vinte.',
          seguranca: '{{Os caras fugiram de carro|fugiram}}. Agora só tem a gente aqui.',
        },
        extra: [ex('vomito', 'Vomitou?', 'Ele vomitou?', '{{Vomitou duas vezes|vomitou}}.')],
        links: [
          lk('paulada', 'nao_acorda', 'Paulada na cabeça, não acorda direito e vomita: TCE grave. Vermelho, USA.'),
          lk('fugiram', 'briga', 'Os agressores fugiram: a cena agora está segura.', { kind: 'confirma' }),
        ],
        radio: { ok: '{central}, {unit}. TCE por agressão, Glasgow 9. Seguimos pro Regional.' },
        diary: { alive: 'Paulada na cabeça. Os agressores fugiram. Sobreviveu.', dead: 'Paulada na cabeça.' },
      }),
    },
    {
      id: 'bebado_agressivo',
      weight: 1.2,
      build: (p) => ({
        truth: { dx: 'Corte na mão em embriagado agressivo', sev: 'amarelo', ok: ['USB'], sup: ['PM'], dest: ['UPA'] },
        // cena da videochamada (onde a história acontece)
        cena: { place: 'bar_porta', pose: 'em_pe', signs: ['agitado'], hold: 'garrafa', props: ['garrafa_quebrada'], wound: { kind: 'corte', at: 'mao' } },
        note: 'Briga. Bêbado ferido, ameaçando.',
        noteWrong: 'Briga terminou, ferido leve.',
        type: 'testemunha',
        amb: ['bar', 'gritos'],
        noise: ['[{{garrafa quebrando|garrafa}}; gritos]'],
        q: {
          oque: `Quebrou uma garrafa na mesa e {{cortou a mão|cortou}}. Tá sangrando e {{ameaçando todo mundo com o caco de vidro|caco}}.`,
          consciencia: 'Acordado. Bêbado.',
          respira: 'Normal, gritando.',
          sangramento: 'A mão sangra bastante. Pinga no chão.',
          idade: 'Uns quarenta.',
          seguranca: 'Seguro não! Ele tá com o caco na mão, ninguém chega perto!',
        },
        links: [lm(p, 'caco', 'cena', 'Ferido armado com caco de vidro, ameaçando: cena insegura. USB + PM (Manual p.4).')],
        radio: { ok: 'Central, {unit}. PM conteve. Corte na mão, tendão preservado. Seguimos pra UPA.', unsafe: 'Central, {unit}! Ele veio pra cima com o vidro! Recuamos, cadê a PM?!' },
        diary: { alive: 'Bêbado com a mão cortada e um caco de vidro. A PM conteve.' },
      }),
    },
  ],
});

// -----------------------------------------------------------------------------
// "Um colega se machucou na máquina aqui na firma!"
// -----------------------------------------------------------------------------
export const ACIDENTE_TRABALHO = tpl({
  id: 'acidente_trabalho',
  tags: ['trauma_moderado', 'leve', 'moderado'],
  age: [19, 60],
  rel: ['colega'],
  cena: { place: 'fabrica', cast: [{ role: 'colega', act: 'olhando', at: 'fundo' }, { role: 'colega', act: 'maos_na_cabeca', at: 'fundo' }] },
  open: (p) => [`Alô! ${p.g('Um colega', 'Uma colega')} {{se machucou na máquina|maquina}} aqui na firma, {dr}!`],
  truths: [
    {
      id: 'corte_dedo',
      weight: 2.5,
      build: (p) => ({
        truth: { dx: 'Corte no dedo (máquina)', sev: 'verde', ok: ['ORI'], ref: ['UPA'] },
        note: 'Acidente de trabalho. Corte na mão.',
        noteWrong: 'Acidente na máquina! Grave, {dr}!',
        amb: ['maquina'],
        q: {
          oque: `Cortou o dedo na guilhotina de papel. {{O corte é pequeno|pequeno}}.`,
          consciencia: `Acordad${p.o}, sentad${p.o}, meio branc${p.o} de susto.`,
          respira: 'Normal.',
          sangramento: '{{Já parou com o pano|parou}}.',
          idade: `${p.anos}.`,
          historico: 'Nada. Saudável.',
          seguranca: 'A máquina tá desligada.',
        },
        extra: [ex('mexe', 'Mexe o dedo?', 'Mexe e sente o dedo normal?', 'Mexe, sente tudo.')],
        links: [lk('pequeno', 'parou', 'Corte pequeno, sangramento parado, dedo mexendo: UPA por meios próprios para os pontos.')],
        radio: { excess: '{central}, {unit}. Corte pequeno, {dr}. Dois pontos. A firma tem carro.' },
        diary: { ori: 'Corte na guilhotina. Dois pontos na UPA.' },
      }),
    },
    {
      id: 'amputacao',
      weight: 1.2,
      build: (p) => ({
        truth: { dx: 'Amputação da ponta do dedo', sev: 'amarelo', ok: ['USB'], dest: ['REG'] },
        note: 'Acidente de trabalho. Machucou o dedo feio.',
        noteWrong: 'Corte leve na mão.',
        amb: ['maquina', 'gritos'],
        q: {
          oque: `A prensa pegou a mão. {{A ponta do dedo saiu|ponta}}!`,
          consciencia: `Acordad${p.o}, chorando de dor.`,
          respira: 'Rápido, de nervoso.',
          sangramento: 'Sangra, mas com o pano tá controlando.',
          idade: `${p.anos}.`,
          historico: 'Nada.',
          seguranca: 'Desligamos a prensa.',
        },
        extra: [ex('pedaco', 'Achou o pedaço?', 'Vocês acharam o pedaço do dedo?', ['Achamos! Tá aqui no chão!', '{{Embrulhei num pano limpo, num saquinho, e pus o saquinho no gelo|gelo}}, como o técnico falou.'])], // campo A5: parte em saco plástico, dentro de outro recipiente com gelo (nunca contato direto); não atrasar o transporte para procurá-la
        links: [lk('ponta', 'gelo', 'Ponta do dedo amputada, sangramento controlado, pedaço embrulhado e no gelo (sem encostar direto): USB → Regional, levando o pedaço.')], // campo A5 (amputação); RT4 só põe "amputação traumática de membro" em USA, e aqui é só a ponta do dedo (USB, hemorragia menor)
        radio: { ok: 'Central, {unit}. Amputação de falange distal, coto controlado, peça no gelo. Seguimos pro Regional.' },
        diary: { alive: 'A prensa pegou a ponta do dedo. O pedaço foi junto, no gelo.' },
      }),
    },
    {
      id: 'mao_presa',
      weight: 1,
      minDay: 4,
      build: (p) => ({
        truth: { dx: 'Mão presa em máquina (esmagamento)', sev: 'vermelho', ok: ['USA'], sup: ['BOMB'], dest: ['REG'], risk: { good: 45, bad: 110 } },
        note: 'Acidente de trabalho. Mão presa na máquina!',
        noteWrong: 'Corte na mão. Tranquilo, {dr}.',
        amb: ['maquina', 'gritos'],
        noise: ['[gritos; um motor desligando]'],
        q: {
          oque: `{{A mão ficou presa no rolo da máquina|presa}}! Desligamos, mas não sai!`,
          consciencia: `Acordad${p.o}, gritando, ficando branc${p.o}.`,
          respira: 'Rápido.',
          sangramento: 'Sangra por baixo do rolo. Muito.',
          idade: `${p.anos}.`,
          historico: 'Nada.',
          seguranca: 'A máquina tá desligada, mas {{o rolo não abre sem ferramenta|ferramenta}}.',
        },
        links: [lk('presa', 'ferramenta', 'Mão esmagada e presa no rolo, que não abre sem ferramenta: resgate (Bombeiros) e USA.')],
        radio: { ok: '{central}, {unit}. Bombeiros desmontaram o rolo. Esmagamento de mão, chocad' + p.o + '. Seguimos pro Regional.', unsafe: 'Central, {unit}! A mão tá presa no rolo, sem ferramenta pra soltar! Cadê os Bombeiros?!' },
        diary: { alive: 'Mão presa no rolo da máquina. Os Bombeiros desmontaram.', dead: 'Esmagamento na máquina.' },
      }),
    },
    {
      id: 'quimica',
      weight: 1,
      build: (p) => ({
        // ⚖ RT7: queimadura química é USI/USB, mas RC25: "lesão ocular química aguda" é USA. Mantido amarelo com USB como melhor (lavagem imediata), USA defensável.
        truth: { dx: 'Queimadura química no braço e no olho', sev: 'amarelo', ok: ['USB', 'USA'], best: 'USB', dest: ['UPA', 'REG'] },
        note: 'Acidente de trabalho com produto químico.',
        noteWrong: 'Corte na máquina, leve.',
        amb: ['maquina', 'agua'],
        noise: ['[água correndo de uma mangueira]'],
        q: {
          oque: `Estourou a mangueira da soda na máquina de lavar peças. {{Espirrou no braço e no olho|olho}}.`,
          consciencia: `Acordad${p.o}, gritando que arde.`,
          respira: 'Normal.',
          sangramento: 'Não sangra. {{A pele do braço tá branca e vermelha|pele}}.',
          idade: `${p.anos}.`,
          historico: 'Nada.',
          seguranca: 'Já fecharam o registro da soda.',
        },
        extra: [ex('lavar', 'Já lavaram com água?', 'Já estão lavando o olho e o braço com água corrente?', ['Tô lavando com a mangueira! Quanto tempo?', '{{Lavando sem parar, como {m:o senhor|a senhora} falou|lavando}}.'])], // campo A10: químico, água corrente sem neutralizar; olho por pelo menos 20 min
        links: [lk('olho', 'pele', 'Soda no olho e na pele: queimadura química. Lavar com água corrente sem parar até a equipe chegar. Amarelo, USB.')], // RT7: queimadura química = USB (⚖ USA pelo olho: RC25); campo A10
        radio: { ok: 'Central, {unit}. Queimadura química, olho lavado na hora. Seguimos pra UPA, oftalmo avisado.' },
        diary: { alive: 'Soda no olho e no braço. Lavaram com a mangueira até a equipe chegar.' },
      }),
    },
  ],
});

export const TRAUMA = [SANGRANDO, ACIDENTE_CARRO, MOTO, QUEDA_ALTURA, BRIGA, ACIDENTE_TRABALHO];
