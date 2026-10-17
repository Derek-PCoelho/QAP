// =============================================================================
// DIA 16 — "O Menino que Gritava Lobo"
// Âncoras: o trote de sempre do Biel (manhã) → o Biel chorando, de verdade
// (o recibo do Seu Jairo no quadro PROVA a ligação); Dona Cida, sinal 1
// (esquece o nome da novela); Seu Osvaldo Peixoto, pai do coordenador (sepse),
// com a frota reduzida pelo corte que o próprio filho aplicou.
// Casa: consequências do pé da Dona Zélia (antes da folga) e o Liam apanhando
// na escola (Modo Inconsistência doméstico), se a Márcia morreu e ele recebeu a USA.
// Fim do turno: o Peixoto na porta da central.
// Fios: 🌾 Jairo, Osvaldo · ↺ Cida (sinal 1 → diário d16_cida → D19) · 🌾 pé da Zélia · 🌾 Márcia/Liam.
// 1.1 (ROTEIRO, dia 16): almoço com o Peixoto ligando do carro ("meu pai não atende") no lugar do
// link; R2 vira às 14:40 (o Saulo liga: a folha do quarto andar; `saulo_fonte`/`saulo_sozinho`;
// "Por que agora?" conta 2019 em parte); o Biel chamado pelo nome (`d10_biel_nome`); a Cida faz o
// FAST sozinha (`d6_cida_fast`) e a Simone cola o post-it branco (`cida_sinal1`); o Liam apanhando
// também chega pela Dona Iolanda (aula) ou pelo cônjuge, sem precisar do "reparar"; trotes sem
// risada; folgado de reserva (sempre 1 no D16); ida (o fiado do Toninho; o Biel não está no ponto) e
// volta (a Dona Iolanda no Aurora).
// =============================================================================
import type { Ctx, SceneDef, DLine, SceneNode, ShiftScriptCtx } from '../../engine/types';
import type { GuideScript } from '../../engine/content-api';
import { hm } from '../../engine/util';
import { day, call, fx, is, NUM, ADDR } from '../dsl';
import { addNum, aulas, edsonVivo, rua, zeliaViva } from './arco';

const presente = (c: Ctx, m: 'lucia' | 'davi') => {
  const f = c.s.family[m];
  return f.status !== 'ausente' && f.status !== 'morto' && !f.away && !c.flag('lucia_fora') && !c.flag('lucia_foi_embora');
};
const noturnoFala = (c: Ctx) => (c.flag('denunciou_henrique') ? 'PAULA' : 'HENRIQUE');

// -----------------------------------------------------------------------------
// Roteiros novos de orientação ativa
// -----------------------------------------------------------------------------
export const GUIDES_EXTRA: Record<string, GuideScript> = {
  // Roteiro novo: idoso inconsciente após queda no box, orientando um adolescente. Conferido (campo A13: não mexer no
  // pescoço, virar em bloco só se vomitar; campo A5: compressão leve no corte do couro cabeludo; fechar a água e abrir
  // o portão para a equipe).
  queda_banheiro: {
    id: 'queda_banheiro',
    title: 'Orientação: o avô do Biel',
    kind: 'dialogo',
    intro: 'Do outro lado está um menino de quinze anos, sozinho com o avô. Frases curtas. Uma coisa de cada vez.',
    panic: 80,
    steps: [
      {
        who: 'BIEL',
        say: 'Ele tá no chão do box, a água caindo nele...',
        options: [
          { label: 'Biel, fecha o registro do chuveiro. Não puxa ele pelo braço.', kind: 'certo' },
          { label: 'Puxa ele pra fora do box!', kind: 'errado', reply: 'Ele escorregou da minha mão, bateu a cabeça de novo!' },
          { label: 'Biel, respira. Eu tô aqui com você.', kind: 'calma' },
        ],
      },
      {
        who: 'BIEL',
        say: 'Fechei. Ele tá fazendo um barulho, tipo ronco...',
        options: [
          { label: 'Não mexe no pescoço dele. Se ele vomitar, vira ele de lado inteiro: cabeça e corpo juntos.', kind: 'certo' },
          { label: 'Joga água no rosto dele pra acordar.', kind: 'errado', reply: 'Ele nem mexeu...' },
          { label: 'Senta ele encostado na parede.', kind: 'errado', reply: 'A cabeça dele caiu pro lado!' },
        ],
      },
      {
        who: 'BIEL',
        say: 'Tá saindo sangue da cabeça dele...',
        options: [
          { label: 'Pega uma toalha limpa e aperta de leve em cima do corte.', kind: 'certo' },
          { label: 'Lava com água pra ver o tamanho.', kind: 'errado' },
          { label: 'Você tá sendo muito corajoso, Biel.', kind: 'calma' },
        ],
      },
      {
        who: 'BIEL',
        say: 'O portão da frente tá trancado... a chave tá com ele...',
        options: [
          { label: 'Procura a chave, destranca o portão pra equipe e volta pro lado dele.', kind: 'certo' },
          { label: 'Sai pra rua e espera lá fora.', kind: 'errado', reply: 'E se ele parar de respirar sozinho?' },
        ],
      },
      {
        who: 'BIEL',
        say: 'Tô ouvindo a sirene... {m:moço|moça}, ele vai ficar bom?',
        options: [
          { label: 'Abre o portão e segura a mão dele. Você fez tudo certo, Biel.', kind: 'certo' },
          { label: 'A equipe vai cuidar dele agora. Você não tá sozinho.', kind: 'calma' },
        ],
      },
    ],
    success: 'O Biel fechou o chuveiro, protegeu o avô e destrancou o portão. A equipe entrou sem perder um minuto.',
    fail: 'O Biel fez o que conseguiu. Ele tem quinze anos.',
  },
  // Roteiro novo: queda de altura com suspeita de lesão de coluna. Conferido (campo A13: ninguém move a vítima, cabeça
  // parada com as duas mãos, rolamento em bloco se vomitar; campo A5: compressão leve no couro cabeludo).
  queda_laje: {
    id: 'queda_laje',
    title: 'Orientação: queda de laje',
    kind: 'dialogo',
    intro: 'Ninguém mexe na vítima. Coluna protegida, via aérea protegida se vomitar.',
    panic: 65,
    steps: [
      {
        who: 'JOSIAS',
        say: 'Os meninos tão querendo levantar ele pra sombra!',
        options: [
          { label: 'Ninguém mexe nele. Nem pra sombra. Segure a cabeça dele parada, com as duas mãos.', kind: 'certo' },
          { label: 'Pode carregar, com cuidado.', kind: 'errado', reply: 'Ele gritou quando levantaram!' },
          { label: 'Josias, você tá indo bem. A USA está a caminho.', kind: 'calma' },
        ],
      },
      {
        who: 'JOSIAS',
        say: 'Ele vomitou! Tá engasgando!',
        options: [
          { label: 'Vire ele de lado com mais dois, tudo junto: cabeça, ombro e quadril de uma vez.', kind: 'certo' },
          { label: 'Senta ele pra vomitar.', kind: 'errado', reply: 'Ele não consegue sentar, {dr}!' },
          { label: 'Deixa como está.', kind: 'errado', reply: 'Ele tá afogando!' },
        ],
      },
      {
        who: 'JOSIAS',
        say: 'Tá sangrando da cabeça...',
        options: [
          { label: 'Um pano limpo, apertando de leve no corte, sem mexer o pescoço.', kind: 'certo' },
          { label: 'Lava com a mangueira da obra.', kind: 'errado' },
          { label: 'Respira. Você tá fazendo tudo certo.', kind: 'calma' },
        ],
      },
      {
        who: 'JOSIAS',
        say: 'Ele tá falando que tá com sono...',
        options: [
          { label: 'Fique conversando com ele: o nome, o dia, a obra. Não deixa ele dormir.', kind: 'certo' },
          { label: 'Deixa ele dormir, descansa.', kind: 'errado' },
        ],
      },
    ],
    success: 'Ninguém moveu o Seu Dirceu até a equipe chegar. A coluna chegou inteira ao Regional.',
    fail: 'Mexeram nele mais do que deviam.',
  },
};

// -----------------------------------------------------------------------------
// Casa: antes da folga — o pé da Dona Zélia
// -----------------------------------------------------------------------------
/** o Liam apanhando (se a Márcia morreu e ele recebeu a USA no dia 9) */
const apanhandoD16 = (c: Ctx) => presente(c, 'davi') && c.flag('marcia_morreu') && c.val<string>('d9_davi') === 'USA';
/** com aula de desenho, a Dona Iolanda percebe e liga antes (ROTEIRO 3.3) */
const iolandaLiga = (c: Ctx) => apanhandoD16(c) && aulas(c) >= 1;

function preD16(c: Ctx): SceneDef {
  const sc = preD16Base(c);
  if (!iolandaLiga(c)) return sc;
  const st = sc.nodes.start;
  const antes = st.onEnter;
  return {
    ...sc,
    nodes: {
      ...sc.nodes,
      start: {
        ...st,
        lines: [
          { who: 'NARRADOR', t: 'Antes de você abrir o portão, o celular toca. Número fixo do Centro.' },
          { who: 'IOLANDA', t: '{Dr}? Iolanda, a professora de desenho do Liam. Desculpa ligar num sábado à noite.' },
          { who: 'IOLANDA', t: 'Hoje de manhã ele desenhou três meninos grandes e um pequeno no chão. E tinha um roxo no braço, de dedo. Eu dei aula quarenta anos. Isso não é imaginação.' },
          ...st.lines,
        ],
        onEnter: (e) => {
          e.set('iolanda_avisou');
          antes?.(e);
        },
      },
    },
  };
}

function preD16Base(c: Ctx): SceneDef {
  const viva = c.s.family.zelia.status !== 'morto';
  const ferida = c.flag('pe_ferida') || c.flag('pe_ferida_escondida');
  const tratada = c.flag('curativo');
  const L = presente(c, 'lucia');
  if (!viva || !ferida) {
    return {
      id: 'd16_chegada',
      bg: 'calcada',
      nodes: { start: { lines: [{ who: 'NARRADOR', t: 'Sábado à noite. A rua cheira a churrasco de vizinho e a terra molhada de mangueira.' }] } },
    };
  }
  if (tratada) {
    return {
      id: 'd16_pe_ok',
      bg: 'sala',
      cast: ['ZELIA'],
      nodes: {
        start: {
          lines: [
            { who: 'NARRADOR', t: 'Sábado à noite. A Dona Zélia está na sala, de chinelo de novo, o pé direito com um curativo branco e limpo apoiado num banquinho.' },
            { who: 'ZELIA', t: 'A enfermeira da UBS disse que tá fechando bonito. Disse que mais uma semana e era hospital.' },
            { who: 'ZELIA', t: 'Obrigada, {filho}. Por ter olhado.' },
          ],
          onEnter: fx.add('lacos', 1, 'a Dona Zélia de chinelo de novo'),
        },
      },
    };
  }
  // não tratada: internação
  const voz = c.flag('denunciou_henrique')
    ? 'a Dra. Paula, firme, já perguntando o endereço'
    : 'o Henrique. A voz arrastada. Você sabe exatamente o que essa voz significa';
  const lines: DLine[] = [
    L ? { who: 'NARRADOR', t: 'Você ainda está no ônibus quando {oconj} liga.' } : { who: 'NARRADOR', t: 'Você ainda está no ônibus quando a vizinha liga.' },
    L
      ? { who: 'LUCIA', t: '{nome}, a sua mãe caiu no banheiro. Febre de trinta e nove. O pé direito tá inchado até o tornozelo, vermelho, quente.' }
      : { who: 'VIZINHA', t: 'É a Dirce, do lado. A sua mãe tá caída no banheiro, ardendo em febre. O pé dela tá que é uma bola.' },
  ];
  if (c.flag('pe_ferida_escondida')) {
    lines.push(
      L
        ? { who: 'LUCIA', t: 'Ela tava escondendo, {nome}. Uma ferida embaixo do pé. Faz duas semanas. Meia por cima e sapato fechado, nesse calor.' }
        : { who: 'VIZINHA', t: 'Tinha uma ferida embaixo do pé, {dr}. Ela escondia até de mim.' },
    );
  } else {
    lines.push({ who: 'NARRADOR', t: 'A ferida que você viu na terça. O curativo ficou pra depois. O depois chegou.' });
  }
  lines.push(
    { who: 'NARRADOR', t: `Você liga pra emergência. Quem atende é ${voz}.` },
    { who: 'NARRADOR', t: 'Hospital Regional, corredor da clínica médica. Pé diabético infectado. Antibiótico na veia e um cirurgião que fala em "limpar a ferida no centro cirúrgico" sem olhar pra vocês.' },
    { who: 'ZELIA', t: '(na maca) Não era nada, {filho}. Não era pra dar trabalho.' },
  );
  return {
    id: 'd16_pe_internada',
    bg: 'hospital',
    cast: ['ZELIA'],
    nodes: {
      start: {
        lines,
        onEnter: (e) => {
          e.s.family.zelia.status = 'internado';
          e.s.family.zelia.risk += 2;
          e.set('zelia_internada_pe');
          e.set('sem_costura_hoje');
        },
      },
    },
  };
}

// -----------------------------------------------------------------------------
// Casa: o Liam (apanhando na escola, se a Márcia morreu e ele recebeu a USA)
// -----------------------------------------------------------------------------
function cenaD16(c: Ctx): SceneDef {
  const D = presente(c, 'davi');
  const L = presente(c, 'lucia');
  const internada = c.s.family.zelia.status === 'internado';
  const zeliaMorta = c.s.family.zelia.status === 'morto';
  const apanhando = apanhandoD16(c);
  const promessa = c.flag('promessa_davi');
  const iolanda = iolandaLiga(c);
  const conjugeViu = L && c.v('lacos') >= 6;

  const abertura: DLine = internada
    ? { who: 'NARRADOR', t: L ? 'Sábado, quase dez da noite. A cadeira da Dona Zélia vazia. {Oconj} voltou do hospital agora há pouco, ainda com o crachá de acompanhante.' : 'Sábado, quase dez da noite. A cadeira da Dona Zélia vazia.' }
    : zeliaMorta
      ? { who: 'NARRADOR', t: 'Sábado. A cadeira da Dona Zélia continua na cabeceira.' }
      : { who: 'NARRADOR', t: 'Sábado. Jantar mais tarde que o normal: arroz, feijão e o bife que a Dona Zélia guardou "pra ocasião".' };

  const fimNode: SceneNode = {
    lines: [
      { who: 'DAVI', t: '(quase dormindo) Amanhã é domingo, {pai}. O dia inteiro. Você prometeu.', when: is.flag('promessa_davi') },
      { who: 'NARRADOR', t: 'A casa apaga. Lá fora, alguém ainda solta rojão sobrando do show de ontem.' },
    ],
  };

  if (apanhando) {
    const nodes: Record<string, SceneNode> = {
      start: {
        lines: [
          abertura,
          { who: 'NARRADOR', t: 'O Liam come de cabeça baixa. Quando estica o braço pra pegar o pão, a manga sobe: {{uma mancha roxa no antebraço, quatro marquinhas de dedo|hematoma}}.' },
          { who: 'EU', t: 'Que roxo é esse, Liam?' },
          { who: 'DAVI', t: '{{Caí no recreio.|cai_recreio}}' },
          ...(L ? [{ who: 'LUCIA', t: 'Foi o que ele me disse também. Na quinta. E ontem. E hoje.' }] : []),
          ...(conjugeViu ? [{ who: 'LUCIA', t: '(baixinho, enquanto ele sobe) Eu vi o braço dele no banho, {nome}. Não foi queda. Vai lá.' }] : []),
          { who: 'NARRADOR', t: 'Ele puxa a manga de volta e vai pro quarto sem terminar o prato.' },
        ],
        onEnter: fx.set('davi_apanhando'),
        choices: [
          ...(iolanda
            ? [{ label: '(Ir até o quarto dele.) "Liam, a Dona Iolanda me ligou. Me mostra o desenho dos três meninos."', next: 'quarto' }]
            : conjugeViu
              ? [{ label: '(Ir até o quarto dele.) "Liam, {c:a sua mãe|o seu pai} viu o seu braço. A gente precisa conversar."', next: 'quarto' }]
              : [{ label: '(Ir até o quarto dele.) "Liam, a gente precisa conversar."', next: 'quarto', needLink: 'davi_verdade' }]),
          { label: 'Deixar ele em paz hoje.', next: 'silencio' },
        ],
      },
      quarto: {
        lines: [
          { who: 'NARRADOR', t: 'Você bate na porta. Ele está deitado de costas pra porta, de tênis na cama.' },
          { who: 'EU', t: 'Liam. Ninguém cai no recreio com a marca de quatro dedos. Quem apertou o seu braço?' },
          { who: 'DAVI', t: '...O Pedro. Do 3º B.' },
          { who: 'DAVI', t: 'Ele falou na frente de todo mundo que {m:o meu pai|a minha mãe} deixou a tia Márcia morrer. Que a mãe dele leu no jornal. Que a ambulância grande foi buscar o filho {m:do doutor|da doutora} e a tia ficou sem.' },
          { who: 'DAVI', t: 'E que a mãe dele disse que a ambulância grande foi pra quem não precisava.', when: is.flag('d9_favorecimento') },
          { who: 'DAVI', t: '...É verdade?' },
        ],
        choices: [
          { label: 'Contar a verdade.', next: 'verdade', effect: fx.all(fx.set('davi_conversa_verdade'), fx.add('humanidade', 1, 'disse a verdade ao Liam')) },
          { label: '"Não é verdade. Ele inventou."', next: 'mentira', effect: fx.set('davi_mentira') },
          { label: 'Não responder. Só abraçar.', next: 'abraco', affectionate: true, effect: fx.add('lacos', 1, 'abraçou o Liam') },
        ],
      },
      verdade: {
        lines: [
          c.flag('bombinha')
            ? { who: 'EU', t: 'Naquele dia só tinha uma ambulância grande livre. Você tava com crise, mas a tia Márcia tava muito pior. E eu mandei a grande pra você. Eu errei, filho.' }
            : { who: 'EU', t: 'Naquele dia só tinha uma ambulância grande livre. Você não conseguia respirar. A tia Márcia também não. Eu tive que escolher, e escolhi você.' },
          { who: 'DAVI', t: 'Então foi por minha causa.' },
          { who: 'EU', t: 'Não. Foi por minha causa. A escolha foi minha, não sua. Nunca vai ser sua.' },
          { who: 'NARRADOR', t: 'Ele chora. Primeiro baixinho, depois muito, com a cara no seu ombro. Você fica até a respiração dele ficar comprida.' },
          { who: 'NARRADOR', t: 'Segunda cedo, antes do plantão, você vai à escola falar com a diretora. E com a mãe do Pedro.' },
        ],
        next: 'fim',
      },
      mentira: {
        lines: [
          { who: 'DAVI', t: '...Tá.' },
          { who: 'NARRADOR', t: 'Ele vira pra parede. Você sabe que ele sabe. Ele sabe que você sabe que ele sabe.' },
        ],
        next: 'fim',
      },
      abraco: {
        lines: [{ who: 'NARRADOR', t: 'Você deita do lado dele, de sapato e tudo, e abraça sem dizer nada. Ele deixa. Naquela noite, não conta mais nada.' }],
        next: 'fim',
      },
      silencio: {
        lines: [{ who: 'NARRADOR', t: 'Ele dorme cedo. De manga comprida, com trinta graus.' }],
        next: 'fim',
      },
      fim: fimNode,
    };
    return {
      id: 'd16_davi',
      bg: 'cozinha',
      cast: ['DAVI', ...(L ? ['LUCIA'] : [])],
      nodes,
      inspect: {
        objects: [
          {
            id: 'desenho_raiva',
            label: 'Desenho na porta da geladeira',
            desc: 'O desenho novo do Liam, preso com o ímã de pizzaria: uma ambulância grande e uma pequena. A grande está riscada de preto com tanta força que o papel rasgou.',
            x: 250,
            y: 46,
            w: 28,
            h: 34,
          },
        ],
        links: [
          { a: 'cai_recreio', b: 'hematoma', insight: 'Queda no recreio não deixa marca de quatro dedos. Alguém apertou o braço dele.', unlock: 'davi_verdade' },
          { a: 'cai_recreio', b: 'desenho_raiva', insight: '"Caí no recreio." E a ambulância grande, a que foi buscar ele no dia 9, riscada de preto até rasgar. Não é sobre o recreio.', unlock: 'davi_verdade' },
          { a: 'hematoma', b: 'desenho_raiva', insight: 'Marca de dedos no braço e raiva da ambulância grande: estão batendo nele por causa do dia 9.', unlock: 'davi_verdade' },
        ],
      },
    };
  }

  // ---- sem agressão: um sábado comum (ou quase)
  if (!D) {
    return {
      id: 'd16_sabado',
      bg: 'sala',
      nodes: {
        start: {
          lines: [
            abertura,
            { who: 'NARRADOR', t: c.flag('lucia_fora') ? 'A casa fica grande demais sem {oconj} e o Liam. Às nove, o telefone toca: Rio Claro.' : 'A casa fica grande demais. O telefone não toca.' },
            ...(c.flag('lucia_fora') ? [{ who: 'DAVI', t: '(no telefone) {c:A mãe|O pai} disse que a gente volta logo. ...Você ainda tá aí, {pai}?' }] : []),
          ],
        },
      },
    };
  }
  const sabado: DLine[] = [abertura];
  if (c.flag('marcia_viva')) sabado.push({ who: 'DAVI', t: '{Pai}, a tia Márcia voltou pra escola! Ela tem uma marquinha no pescoço, da abelha. Deixou a gente ver.' });
  else if (c.flag('marcia_morreu')) sabado.push({ who: 'DAVI', t: 'Ontem a escola plantou um ipê no pátio pra tia Márcia. Eu que segurei a placa.' });
  else sabado.push({ who: 'DAVI', t: '{Pai}, sabia que o show de ontem passou na TV? Tinha uma ambulância igual à do meu desenho.' });
  if (promessa) sabado.push({ who: 'DAVI', t: 'Amanhã é domingo. O dia inteiro, lembra? Você prometeu.' });
  return {
    id: 'd16_sabado',
    bg: 'cozinha',
    cast: ['DAVI', ...(L ? ['LUCIA'] : [])],
    nodes: {
      start: {
        lines: sabado,
        choices: promessa
          ? [
              { label: '"Lembro. Celular desligado desde já."', next: 'domingo', affectionate: true },
              { label: '"Vai dormir, que amanhã a gente vê."', next: 'fim' },
            ]
          : undefined,
        next: 'fim',
      },
      domingo: {
        lines: [{ who: 'NARRADOR', t: 'Você desliga o celular e deixa em cima da geladeira. O Liam confere duas vezes se está desligado mesmo.' }],
        next: 'fim',
      },
      fim: fimNode,
    },
  };
}

function bicoD16(c: Ctx): SceneDef {
  const D = presente(c, 'davi');
  const L = presente(c, 'lucia');
  const apanhando = D && c.flag('marcia_morreu') && c.val<string>('d9_davi') === 'USA';
  const lucDescobre = apanhando && L && c.v('lacos') >= 6;
  const lines: DLine[] = [{ who: 'NARRADOR', t: 'Sábado à noite na USA 01: briga de bar, moto, gente do show ainda caindo de escada.' }];
  if (lucDescobre) {
    lines.push({ who: 'NARRADOR', t: 'De madrugada, um bilhete {doconj} na mesa: "O Liam tá apanhando na escola por causa da professora. Ele me contou. Segunda eu vou lá. Vem comigo. — {c:L|A}."' });
  } else if (apanhando) {
    lines.push({ who: 'NARRADOR', t: 'O Liam já está dormindo, de manga comprida. Ninguém pergunta por quê.' });
  }
  if (c.flag('promessa_davi') && D) lines.push({ who: 'NARRADOR', t: 'No domingo você dorme até as três da tarde. O Liam passa o dia desenhando no quarto, de porta fechada.' });
  return {
    id: 'd16_bico',
    bg: 'preto',
    nodes: {
      start: {
        lines,
        onEnter: (e) => {
          if (apanhando) e.set('davi_apanhando');
          if (lucDescobre) e.set('davi_lucia_descobriu');
        },
      },
    },
  };
}

// -----------------------------------------------------------------------------
// R2 vira (ROTEIRO, D16 14:40): o Saulo liga do celular dele, sem ser chamado
// -----------------------------------------------------------------------------
const SAULO_ESCOLHAS = (c: ShiftScriptCtx) => [
  {
    id: 'fonte',
    label: '"Eu aviso a Carla."',
    effect: (cc: ShiftScriptCtx) => {
      cc.set('saulo_fonte');
      addNum(cc, 'saulo_confianca', 1);
    },
    reply: 'Estacionamento do Regional, vaga do fundo, depois das sete. Eu vou estar de jaleco amassado. Ela vai saber. (crec) Obrigado, Regulação.',
  },
  {
    id: 'sozinho',
    label: '"Isso é com a direção, Saulo."',
    effect: (cc: ShiftScriptCtx) => cc.set('saulo_sozinho'),
    reply: '...É. É sempre com a direção. (ele desliga sem tchau)',
  },
  ...(c.flag('saulo_contou_2019')
    ? []
    : [
        {
          id: 'porque',
          label: '"Por que agora?"',
          effect: (cc: ShiftScriptCtx) => {
            cc.set('saulo_contou_2019');
            cc.schedule(cc.now + 1, 'saulo_virada2');
          },
          reply:
            'Porque em dezenove eu li a folha. Eu tinha seis meses de formado. Disse "sem maca" pra um regulador às duas da manhã. O regulador não insistiu. Eu nunca soube o nome dele. Eu nunca soube o nome de ninguém daquela noite.',
        },
      ]),
];
/** cida_sinal1 (flags.md): a Simone cola um post-it branco no quadro ("ela não sabe classificar") */
function postitBranco(c: ShiftScriptCtx) {
  if (!c.flag('cida_sinal1') || c.sflag('postit_branco')) return;
  c.sflag('postit_branco', true);
  c.modal(
    'SIMONE',
    c.flag('cida_feijao')
      ? 'Anotei num post-it branco, {dr}. Branco porque eu não sei que cor é isso. "Cida esqueceu a novela. Esqueceu o feijão no fogo." Colei no quadro, do lado do dela.'
      : 'Anotei num post-it branco, {dr}. Branco porque eu não sei que cor é isso. "Cida esqueceu a novela." Colei no quadro, do lado do dela.',
    'simone',
  );
}
function sauloLiga(c: ShiftScriptCtx) {
  if (c.sflag('saulo_ligou')) return;
  c.sflag('saulo_ligou', true);
  const o = c.callStatus('d16_osvaldo');
  const recebe = o?.decision ? 'O seu idoso da sepse, o pai do Peixoto. Eu recebo.' : 'Se aparecer o pai do Peixoto, o da sepse, manda. Eu recebo.';
  c.modal(
    'DR. SAULO (CELULAR)',
    `Regulação? É o Saulo. Não é pedido. ...${recebe} E escuta. Tem seis leitos no quarto andar com placa de "reservado". Reservado pra quem paga o Saúde+ Vida, o plano da mesma OS que regula vocês. Quando eu digo "lotado", eu tô lendo uma folha que a diretoria me entrega às sete. Eu tô cansado de ler essa folha. Tenho a de hoje no bolso. Se aquela jornalista quiser, ela que venha buscar no estacionamento. Eu não falo no telefone.`,
    'aviso',
    SAULO_ESCOLHAS(c),
  );
}
function sauloDecide(c: ShiftScriptCtx) {
  if (c.sflag('saulo_decidiu') || !c.flag('saulo_contou_2019') || c.flag('saulo_fonte') || c.flag('saulo_sozinho')) return;
  c.sflag('saulo_decidiu', true);
  c.modal('DR. SAULO (CELULAR)', '...Então. A folha tá no meu bolso. O que eu faço com ela, Regulação?', 'aviso', SAULO_ESCOLHAS(c));
}

// -----------------------------------------------------------------------------
// Almoço (almoco.md, D16 — "Meu pai não atende")
// -----------------------------------------------------------------------------
function almocoD16(c: Ctx): SceneDef {
  void c;
  return {
    id: 'd16_almoco',
    bg: 'central',
    cast: ['SIMONE'],
    nodes: {
      start: {
        lines: [
          { who: 'NARRADOR', t: '13:00. Sábado. A copa está vazia, só a Simone e o micro-ondas novo da OS, que apita duas vezes pra cada vez que precisa.' },
          { who: 'SIMONE', t: 'O Peixoto passou às seis. De bermuda, {dr}. Bermuda. Ia ver o pai, "gripadinho". Eu nem sabia que ele tinha joelho.' },
          { who: 'NARRADOR', t: 'O seu celular vibra em cima da mesa de fórmica. "DR. PEIXOTO". Ao fundo, o tique-taque de pisca-alerta de carro.' },
          { who: 'DR. PEIXOTO', t: '{Dr}. Desculpa ligar no seu almoço. Meu pai não atende desde as onze. Ele faz isso pra me irritar.' },
          { who: 'DR. PEIXOTO', t: 'Eu tô parado na rodovia, tem uma carreta tombada. ...Se aparecer um Osvaldo, Rua dos Bem-te-vis, 1480, apartamento 41... me avisa? Não manda nada. Só avisa.' },
          { who: 'DR. PEIXOTO', t: 'Você me passou o seu filho no dia nove. Hoje eu entendo o que é isso.', when: is.flag('d9_impedimento') },
        ],
        choices: [
          { label: '"Aviso. E se precisar, eu mando."', next: 'aviso', effect: fx.all(fx.set('d16_peixoto_almoco', 'aviso'), fx.set('peixoto_pediu_aviso')) },
          { label: '"Liga pra cuidadora dele."', next: 'cuidadora', effect: fx.all(fx.set('d16_peixoto_almoco', 'cuidadora'), fx.set('peixoto_pediu_aviso')) },
          { label: '"Não posso misturar, Peixoto. Se ligar, é ligação como qualquer outra."', next: 'neutro', effect: fx.set('d16_peixoto_almoco', 'neutro') },
        ],
      },
      aviso: {
        lines: [
          { who: 'DR. PEIXOTO', t: '...Manda. Se precisar, manda. Esquece o que eu falei de não mandar.' },
          { who: 'NARRADOR', t: 'Ele desliga. A Simone tinha parado de mastigar no meio da ligação.' },
        ],
      },
      cuidadora: {
        lines: [
          { who: 'DR. PEIXOTO', t: 'Ele demitiu a cuidadora quarta. Disse que ela "mexia nas coisas". As coisas dele são três caixas de remédio e um rádio.' },
          { who: 'NARRADOR', t: 'Silêncio na linha. Uma buzina de carreta, longe.' },
          { who: 'DR. PEIXOTO', t: 'Avisa. Se aparecer, avisa.' },
        ],
      },
      neutro: {
        lines: [
          { who: 'DR. PEIXOTO', t: 'Certo. Certo. É assim que tem que ser.' },
          { who: 'NARRADOR', t: 'Ele desliga primeiro. A Simone olha pra você por cima do pote.' },
          { who: 'SIMONE', t: 'Você tá certo. Eu odiei você tá certo.' },
        ],
      },
    },
  };
}

// -----------------------------------------------------------------------------
export const DAY = day({
  day: 16,
  title: 'O Menino que Gritava Lobo',
  weekday: 'Sábado',
  weather: 'Seco, 30 °C. Poeira e cheiro de churrasco.',
  goal: { maxUSA: 3, bonus: 30 },
  // a anotação do D5 ("meu pai nunca precisou de ambulância") precisa estar na mesa hoje
  onStart: fx.when(is.flag('peixoto_pai'), fx.doc('peixoto_pai')),
  newspaper: (c) => {
    const mortos = c.s.diary.filter((d) => d.day === 15 && d.id.startsWith('mci_') && d.kind === 'morto').length;
    const triado = c.s.diary.some((d) => d.day === 15 && d.id.startsWith('mci_'));
    const jul = c.key('juliana');
    const antonio = c.key('antonio');
    return {
      headline: 'Grade cai na saída de show e fere 14 no Parque de Exposições',
      sub: c.flag('mci_sem_obitos')
        ? 'A Regulação socorreu todas as vítimas graves com vida. Organização e Prefeitura trocam acusações.'
        : triado
          ? `${mortos === 1 ? 'Uma vítima morreu' : `${mortos} vítimas morreram`} no gramado. Organização e Prefeitura trocam acusações.`
          : 'Vítimas graves esperaram mais de uma hora no gramado. Organização e Prefeitura trocam acusações.',
      photo: 'grade',
      stories: [
        jul === 'salvo'
          ? {
              title: 'Costureira pisoteada se recupera',
              text:
                antonio === 'salvo'
                  ? 'Juliana Ferreira, 27, quebrou três costelas na grade. "Meu pai já foi salvo pela Regulação uma vez. Agora fui eu", disse, do leito do Regional.'
                  : antonio === 'perdido'
                    ? 'Juliana Ferreira, 27, quebrou três costelas na grade. "A ambulância não chegou a tempo pro meu pai. Pra mim chegou", disse, do leito do Regional.'
                    : 'Juliana Ferreira, 27, quebrou três costelas na grade e passa bem no Regional.',
            }
          : jul === 'perdido'
            ? {
                title: 'Costureira de 27 anos é a vítima mais jovem',
                text:
                  antonio === 'perdido'
                    ? 'Juliana Ferreira foi pisoteada na grade da saída. A mãe, viúva do aposentado Antônio Ferreira, passou a noite no corredor do Regional.'
                    : 'Juliana Ferreira foi pisoteada na grade da saída. O pai, o aposentado Antônio Ferreira, passou a noite no corredor do Regional.',
              }
            : { title: 'A grade "reforçada" cedeu em um minuto', text: 'Laudo preliminar aponta parafusos de obra comum. A organização diz que seguiu o projeto aprovado.' },
        { title: 'Tempo seco: pneumonia lota as UBS', text: 'Idosos com febre e falta de ar devem procurar atendimento logo, alerta a Secretaria. "Não espere piorar. Não tenha vergonha de chamar."' },
        { title: 'Motorista bate em poste na saída do show', text: 'Ele estava embriagado e tentou ir embora dirigindo depois da batida. A PM recolheu a chave.' },
      ],
      notice: 'Sábado. Sem páginas novas no Manual.',
      ad: 'JAIRO REFRIGERAÇÃO — geladeira, freezer, ar-condicionado. 1 ano de garantia. Rua Quaresmeira, 1720, Jardim Primavera.',
      weather: 'Seco · 30 °C',
    };
  },
  handover: (c) => ({
    id: 'd16_passagem',
    bg: 'central',
    nodes: {
      start: {
        lines: [
          { who: 'NARRADOR', t: '07:00. Sábado. A central cheira a café requentado e desinfetante.' },
          { who: noturnoFala(c), t: 'Noite pesada: ainda tinha vítima do show chegando no Regional às duas da manhã.' },
          { who: noturnoFala(c), t: 'Ah: o Peixoto passou aqui às seis. Num sábado. Pegou umas planilhas e disse que depois ia ver o pai, que o velho tá "gripadinho" e não atende o telefone.' },
          { who: 'SIMONE', t: 'O Peixoto tem pai? Achei que ele tinha nascido de uma planilha.' },
        ],
      },
    },
  }),
  timeline: [
    { at: '07:01', kind: 'radio', who: 'USA 01 · BENÉ', text: '{bene}, USA 01 em QRV. Sábado de sol. Tô com um pressentimento hoje, mas deve ser o torresmo de ontem.' },
    { at: '09:35', kind: 'script', id: 'postit_branco1', run: (c) => postitBranco(c) },
    { at: '10:20', kind: 'script', id: 'postit_branco2', run: (c) => postitBranco(c) },
    { at: '11:30', kind: 'script', id: 'postit_branco3', run: (c) => postitBranco(c) },
    {
      at: '13:13',
      kind: 'script',
      id: 'frota_usb03',
      run: (c) => {
        const t = c.callStatus('d16_trote');
        if (t && t.answered !== undefined && !t.decision) c.modal('SIMONE', 'Conferi a frota, {dr}: a USB 03 tá na base. A Lia tá tomando café, eu tô vendo pela janela. E ninguém da equipe fala "QRR" pra acidente.', 'simone');
      },
    },
    { at: '14:40', kind: 'script', id: 'saulo_virada', run: (c) => sauloLiga(c) },
    { at: '23:58', kind: 'script', id: 'saulo_virada2', run: (c) => sauloDecide(c) },
    {
      // a frota "otimizada": às 14:20, se as duas USA estão livres, a Regulação Estadual leva uma
      at: '14:20',
      kind: 'script',
      id: 'rodovia',
      run: (c) => {
        const free = c.freeUnits('USA');
        if (free.length < 2) return;
        const u = free.find((x) => x.id === 'USA02') ?? free[1];
        c.setUnit(u.id, 'FORA', hm('16:20'), 'Rodovia · Regulação Estadual');
        c.radio(u.radioName, `Central, ${u.label} acionada pela Regulação Estadual: capotamento na rodovia, na divisa com Rio Claro. Fora da cidade até umas quatro e vinte.`, 'alerta');
      },
    },
    {
      at: '14:38',
      kind: 'script',
      id: 'sem_usa',
      run: (c) => {
        const o = c.callStatus('d16_osvaldo');
        if (o && !o.decision && !c.freeUnits('USA').length) {
          c.modal('SIMONE', 'Nenhuma USA no painel, {dr}. No tempo da USA 03, a base da Vila Esperança tava aberta... Desculpa. Não é hora.', 'simone');
        }
      },
    },
    {
      at: '17:40',
      kind: 'script',
      id: 'jairo_acordou',
      run: (c) => {
        if (c.key('jairo') === 'salvo') c.radio('REGIONAL · ENFERMAGEM', 'Central, enfermagem do Regional. O senhor Jairo acordou. Perguntou pelo neto e pela oficina, nessa ordem.', 'ok');
      },
    },
  ],
  calls: [
    // ------------------------------------------------------------------ 1 ★ O TROTE DE SEMPRE
    call({
      id: 'd16_biel_trote',
      ref: 'D16 #1',
      at: '07:40',
      anchor: true,
      num: NUM.biel,
      caller: 'Voz de menino',
      type: 'trotista',
      voice: 'adolescente',
      note: 'O 9-8877 de novo. Sem risada hoje. Só o videogame.',
      noteFixed: true,
      addr: { rua: 'Rua XV de Novembro', n: 1201, bairro: 'Centro', ref: 'Praça da Matriz, no laguinho.' },
      amb: ['videogame'],
      open: [
        'Alô, emergência? Corre! {{Tem um jacaré no laguinho da praça da Matriz|jacare}} comendo um cachorro! Já comeu a metade!',
        '[{{a musiquinha de fase de videogame, alta, do lado do telefone|videogame}}]',
      ],
      q: {
        oque: 'O jacaré pulou do lago e pegou o cachorro! Um poodle! Ele tá mastigando a coleira!',
        consciencia: 'O jacaré? Tá acordadão!',
        respira: 'O cachorro? Respira pela metade que sobrou.',
        idade: 'O jacaré tem uns cem anos.',
        referencia: 'Na praça da Matriz! Do lado da igreja! Corre!',
        sangramento: 'Muito! A praça tá vermelha!',
        paciente: ['[{{o videogame faz o barulhinho de "game over"|game_over}}]', '...ah, não. Perdi. [ele esquece que está no telefone por um segundo]'],
        seguranca: 'Seguro não! Traz rede!',
        historico: 'Hã?',
        confronto_quadro: ['[silêncio; o videogame continua tocando]', 'Ih, sujou. [desliga]'],
      },
      callback: ['[{{Caixa postal: "E aí, é o Biel. Deixa o recado que eu talvez ouça."|retorno_biel}}]'],
      links: [
        { a: 'jacare', b: 'videogame', insight: 'Jacaré comendo poodle na praça, e o videogame tocando a fase ao lado do telefone: trote. De novo o 9-8877.' },
        { a: 'jacare', b: 'manual:trote_sinais', insight: 'Um jacaré num laguinho de praça, "comendo a metade" de um cachorro: relato de cinema, sem corpo nenhum (Manual p.2).' },
        { a: 'retorno_biel', b: 'num', insight: 'A caixa postal se apresenta: "é o Biel". O mesmo 9-8877 dos trotes de sempre.' },
      ],
      patient: { name: '"Cachorro e jacaré"' },
      truth: { dx: 'Trote (o 9-8877 de sempre)', sev: 'trote', ok: ['TROTE'], prankKind: 'trote' },
      radio: { prank: 'Central, {unit} na praça da Matriz. O laguinho tem trinta centímetros de água e três patos. Nenhum jacaré. Trote, {dr}. O de sempre.' },
    }),
    // ------------------------------------------------------------------ 2 ★ CIDA — SINAL 1
    call({
      id: 'd16_cida',
      ref: 'D16 #2 (sinal 1)',
      at: '08:50',
      anchor: true,
      num: NUM.cida,
      caller: 'Dona Cida',
      callerName: 'Dona Cida',
      type: 'frequentador',
      voice: 'cida',
      note: 'Dona Cida. A novela.',
      noteFixed: true,
      addr: ADDR.cida,
      amb: ['tv'],
      open: [
        'Oi {meu} {filho}, é a Cida! Bom dia! Viu ontem a novela? A... {{aquela... das seis, como é que chama mesmo?|novela_esquecida}}',
        '[a TV ligada num programa de culinária]',
        'Ai, tá na ponta da língua. Bom, você sabe qual é! A Marta foi embora de vez, {meu} {filho}!',
      ],
      q: {
        oque: 'Nada não, liguei pra contar da novela. E pra saber se você comeu.',
        consciencia: 'Acordada! Acordadíssima.',
        respira: 'Respirando.',
        idade: 'Setenta e nove. Oitenta em agosto, se Deus quiser.',
        historico: 'Pressão. Tomo certinho. Tenho uma caixinha com os dias da semana, ajuda muito.',
        fast: (c) =>
          c.flag('d6_cida_fast')
            ? ['Ah, essa eu sei! Sorri, levanta os braços, fala "o rato roeu a roupa do rei de Roma". Tudo certo, viu? Eu faço todo dia, de manhã, no espelho. Você que me ensinou.', '[risada]']
            : ['Tô sorrindo, ó! Levantei os dois braços, a vizinha tá rindo de mim na janela.', '"O céu é azul"... e a novela é das seis! [risada]'],
        inicio: 'A novela? Começa às seis! Isso eu sei! [risada]',
        dorpeito: 'Nada, nada.',
        sangramento: 'Não.',
        paciente: 'Sou eu mesma, {meu} {filho}!',
      },
      extra: [
        {
          id: 'conversar',
          kind: 'fala',
          label: 'Conversar um pouco com ela',
          cost: 15,
          say: 'E o capítulo de ontem, Dona Cida? Me conta.',
          a: (c) => [
            'A Marta pegou a mala e saiu pela porteira, e o Henrique, o da fazenda, ficou olhando. {{Eu nunca perdi um capítulo, desde o primeiro|nunca_perdeu}}, sabia? Nem quando o meu falecido tava no hospital. Levava o radinho.',
            '[risada]',
            !zeliaViva(c)
              ? 'O grupo de terça ficou sem graça sem a sua mãe, sabia? A gente deixa a cadeira dela.'
              : c.flag('curativo')
                ? 'Ah, e a Zélia disse que o pé tá sarando. Graças a Deus, viu?'
                : c.flag('pe_ferida') || c.flag('pe_ferida_escondida')
                  ? 'A Zélia não foi no grupo de novo esta semana. Tá tudo bem aí, {meu} {filho}? Ela anda mancando, eu reparei.'
                  : 'A Zélia mandou um beijo. Disse que você tá trabalhando demais.',
          ],
          onAsk: fx.all(fx.add('humanidade', 1, 'conversou com a Dona Cida'), fx.set('cida_conversou_d16')),
        },
        {
          id: 'esta_bem',
          label: '"A senhora está bem mesmo?"',
          locked: true,
          // 1.1 (ROTEIRO, dia 16): perguntar da novela ("Conversar um pouco com ela") destrava
          unlockedBy: ['conversar'],
          say: 'Dona Cida, a senhora está bem mesmo? A senhora esqueceu o nome da novela...',
          a: [
            '[silêncio]',
            'Ah, {meu} {filho}... É a idade. {{Ontem eu fiquei olhando a panela de feijão um tempão, sem lembrar o que ia fazer com ela|feijao}}. Coisa boba.',
            'Não conta pra ninguém, tá? Ninguém. Vão querer me levar no médico.',
          ],
          onAsk: fx.all(fx.set('cida_sinal1'), fx.set('cida_feijao')),
        },
      ],
      links: [
        { a: 'novela_esquecida', b: 'nunca_perdeu', insight: 'Ela nunca perdeu um capítulo, desde o primeiro... e hoje não lembrou o nome da novela. Pode ser a idade. Pode não ser. Vale anotar.', unlock: 'esta_bem', onFind: fx.set('cida_sinal1') },
        { a: 'novela_esquecida', b: 'quadro:cida', insight: 'No quadro: "Pressão, novela." Ela liga há semanas pra falar da novela das seis. Hoje não lembrou o nome dela.', unlock: 'esta_bem', onFind: fx.set('cida_sinal1') },
        { a: 'novela_esquecida', b: 'doc:cida', insight: 'O post-it diz "pressão, novela". Hoje ela não lembrou o nome da novela.', unlock: 'esta_bem', onFind: fx.set('cida_sinal1') },
      ],
      onAnswer: fx.set('cida_ligou_d16'),
      patient: { name: 'Aparecida (Dona Cida)', age: 79, sex: 'F' },
      truth: { dx: 'Esquecimento isolado (sem urgência hoje)', sev: 'azul', ok: ['ORI'], ref: ['UBS', 'CASA'] },
      radio: { excess: '{central}, {unit}. Dona Aparecida está ótima, {dr}. Só não lembrava o nome da novela. A gente também não.' },
      diary: {
        // Dia 19 liga esta entrada (diario:d16_cida): o registro tem que guardar a estranheza
        ori: (c) =>
          c.flag('cida_feijao')
            ? 'Esqueceu o nome da novela das seis ("aquela... das seis"), ela que nunca perdeu um capítulo. Contou que ficou olhando a panela de feijão sem saber o que fazer. "É a idade."'
            : c.flag('cida_sinal1')
              ? 'Esqueceu o nome da novela das seis ("aquela... das seis"), ela que nunca perdeu um capítulo. Disse que tá na ponta da língua.'
              : 'Ligou pra falar da novela. Não lembrou o nome dela: "aquela... das seis".',
        alive: 'Mandei viatura. Estava bem. Só não lembrava o nome da novela das seis.',
      },
    }),
    // ------------------------------------------------------------------ 3 APENDICITE
    call({
      id: 'd16_apendicite',
      ref: 'D16 #3',
      at: '09:50',
      pool: 'moderado',
      num: '(17) 99683-1880',
      caller: 'Rosimeire',
      callerName: 'Rosimeire',
      type: 'comum',
      voice: 'mulher',
      note: 'Mulher, dor forte na barriga e febre.',
      noteWrong: 'Cólica. Parece leve.',
      addr: { rua: 'Rua Pitangueira', n: 1880, bairro: 'Jardim Primavera', ref: 'Sobrado cinza, do lado da academia.' },
      amb: ['gemidos', 'tv'],
      open: ['{m:Moço|Moça}, eu tô com uma {{dor do lado direito da barriga, embaixo|dor_direita}} que não me deixa nem ficar em pé. E febre.'],
      q: {
        oque: 'Começou ontem em volta do umbigo, uma dor chata. De madrugada {{desceu pro lado direito e ficou fina, de pontada|migrou}}.',
        inicio: 'Ontem à tarde. Piorou de madrugada.',
        consciencia: 'Acordada. Suando.',
        respira: 'Respiro, mas dói pra respirar fundo.',
        idade: 'Quarenta.',
        historico: 'Nada. Nunca operei nada.',
        sangramento: 'Não.',
        gestacao: 'Não. Eu fiz laqueadura depois do segundo.',
        dengue: 'Sangramento não. Vomitei uma vez, de manhã.',
        paciente: 'Sou eu mesma. Meu filho tá aqui comigo.',
        seguranca: 'Seguro.',
      },
      extra: [
        { id: 'febre', label: 'Febre? Dói pra andar?', say: 'Quanto de febre? Dói mais pra andar, pular, tossir?', a: 'Trinta e oito e meio. {{Pra andar eu vou curvada; se eu tusso, dói lá embaixo|dor_andar}}.' },
      ],
      links: [
        { a: 'migrou', b: 'dor_direita', insight: 'Dor que começa no umbigo e desce pro lado direito, com febre e piora ao andar: apendicite. Amarelo → USB → Regional (cirurgia).' },
        { a: 'dor_andar', b: 'manual:amarelo', insight: 'Dor abdominal forte com febre, sem choque: urgência sem risco imediato. USB (Manual p.1); destino com cirurgia: Regional.' },
      ],
      patient: { name: 'Rosimeire Campos', age: 40, sex: 'F' },
      truth: { dx: 'Provável apendicite', sev: 'amarelo', ok: ['USB'], dest: ['REG'], risk: { good: 120, bad: 300, needs: 'USB' } },
      radio: {
        ok: 'Central, {unit}. Abdome agudo, dor na fossa ilíaca direita, febril. Seguimos Regional pra cirurgia.',
        excess: '{central}, {unit}. Apendicite, {dr}, estável. Dava USB.',
        dest: 'Central, {unit} na UPA. Abdome cirúrgico não é daqui. Vão transferir pro Regional.',
      },
      diary: { alive: 'Dor no umbigo que desceu pro lado direito. Apendicite. Operada no sábado à tarde.' },
    }),
    // ------------------------------------------------------------------ 4 ★ BIEL — DESTA VEZ É VERDADE
    call({
      id: 'd16_biel',
      ref: 'D16 #4 ★',
      at: '10:40',
      anchor: true,
      num: NUM.biel,
      caller: 'Voz de menino',
      type: 'crianca',
      voice: 'adolescente',
      note: 'O 9-8877 de novo, {dr}. Mas... ele tá chorando.',
      noteFixed: true,
      addr: ADDR.jairo,
      amb: ['chuveiro'],
      open: [
        '{m:Moço|Moça}... {m:moço|moça}, {{meu vô caiu no banheiro e não acorda|nao_acorda}}. {{Juro, juro que não é brincadeira|juro}}.',
        '[{{chuveiro aberto, a água batendo no chão; nenhuma risada|chuveiro}}]',
        'Ele tava tomando banho e fez um barulho. Eu arrombei a porta. {{Ele tá no chão do box|chao_box}}, a água caindo nele...',
      ],
      q: {
        consciencia: ['Não acorda! Eu chamo, eu chacoalho... {{ele só geme|geme}}. Abre o olho e fecha.', '[choro]'],
        respira: 'Respira... tá fazendo {{um barulho, tipo ronco|ronco}}. Isso é respirar? {m:Moço|Moça}, isso é respirar?',
        sangramento: '{{Tá saindo sangue da cabeça|sangue_cabeca}}, aqui do lado, onde bateu no registro.',
        idade: 'Setenta e um.',
        oque: 'Ele chegou da oficina e foi tomar banho. Eu tava no quarto jogando. Ouvi um barulho de coisa caindo. A porta tava trancada.',
        inicio: 'Agora! Faz uns cinco minutos!',
        historico: 'Ele tem pressão. Toma um remédio de manhã. {{Ontem ele falou que tava tonto|tonto}}.',
        referencia: 'É a {{oficina, Jairo Refrigeração|oficina}}. A casa é nos fundos. O portão da frente tá trancado, a chave fica com o vô.',
        paciente: ['[um gemido longo; a água caindo]', 'Vô? Vô! Fala com ele, {m:moço|moça}! Ele não fala!'],
        seguranca: 'Seguro, só eu e ele. Minha mãe tá trabalhando.',
        confronto_quadro: ['[choro]', 'Eu sei! Eu sei que eu passei trote! Eu passei hoje de manhã, eu sei!', 'Mas agora é sério, {m:moço|moça}, {{juro por Deus, é o meu vô|juro_deus}}! Ele não acorda! Por favor!'],
      },
      extra: [
        {
          id: 'nome',
          label: 'Seu nome? Nome do seu avô?',
          say: 'Qual é o seu nome? E o nome completo do seu avô?',
          a: '{{Gabriel. Biel.|nome_gabriel}} O meu vô é o {{Jairo. Jairo Bento Lima|vo_jairo}}.',
        },
        {
          id: 'acredito',
          kind: 'fala',
          label: '"Gabriel. Você é o neto do Seu Jairo. Eu acredito em você."',
          when: (c) => c.flag('d10_biel_nome'),
          say: 'Gabriel. Você é o neto do Seu Jairo. Eu acredito em você. Agora faz o que eu falar.',
          a: ['[o choro para de uma vez, como quem engole]', '...Tá. Tá bom. Fala. Eu faço.'],
          onAsk: fx.set('biel_acreditou'),
        },
        {
          id: 'fechar_chuveiro',
          label: 'Fechar o chuveiro?',
          say: 'Gabriel, você consegue fechar o chuveiro sem escorregar?',
          a: ['Fechei.', '[a água para]', '...Tá muito quieto agora. Só o ronco dele.'],
        },
      ],
      callback: ['[o telefone mal chega a tocar]', '{{Alô?! {m:Moço|Moça}?! Vocês desligaram?! Ele não acorda!|retorno_choro}}'],
      links: [
        { a: 'end', b: 'doc:jairo_end', kind: 'confirma', insight: 'Rua Quaresmeira, 1720: a casa do Seu Jairo, o da geladeira. O recibo está no seu quadro. O endereço é real, e é a casa do avô.' },
        { a: 'num', b: 'doc:jairo_neto', kind: 'confirma', insight: '"Neto Gabriel — 9-8877 (pra emergência)", no verso do recibo. É o Biel. E é a emergência.' },
        { a: 'nome_gabriel', b: 'doc:jairo_neto', kind: 'confirma', insight: 'Gabriel, o Biel: o neto que o Seu Jairo anotou no recibo. A ligação é verdadeira.' },
        { a: 'chuveiro', b: 'manual:trote_sinais', kind: 'confirma', insight: 'Sinais de trote: risadas, relato cinematográfico, endereço inexistente... Aqui não há nenhum. Só um chuveiro aberto e um menino chorando.' },
        { a: 'num', b: 'manual:trote_quadro', insight: 'Número no quadro não prova trote (Manual p.2). Quem passou trote também pode precisar de socorro.' },
      ],
      worsen: [{ after: 35, lines: ['{m:Moço|Moça}! {{Ele vomitou! Tá fazendo um barulho de afogado|vomitou}}!', '[choro desesperado]'], guide: 'queda_banheiro' }],
      guide: { id: 'queda_banheiro' },
      patient: { name: 'Jairo Bento Lima', age: 71, sex: 'M' },
      // d10_biel_nome: chamado pelo nome, ele para de chorar e segue a guia (janela +5 min)
      truth: (c) => ({
        dx: 'Traumatismo craniano após queda no banheiro (rebaixamento de consciência)',
        sev: 'vermelho',
        ok: ['USA'],
        dest: ['REG'],
        risk: { good: 45 + (c.flag('biel_acreditou') ? 5 : 0), bad: 110 + (c.flag('biel_acreditou') ? 5 : 0), guideBonus: 15 },
        key: 'jairo',
      }),
      radio: {
        ok: '{central}, {unit} no local. Senhor de 71, TCE, Glasgow 9, protegido de lado no box. Seguimos Regional. O neto veio junto, segurando a mão dele.',
        saved: '{central}, {unit}. O menino fechou o chuveiro, virou o avô de lado e destrancou o portão. Fez tudo direitinho, {dr}. Seguimos Regional.',
        under: 'Central, {unit}! TCE grave, rebaixado, vomitando! Precisamos de USA, agora!',
        dead: 'Central... {unit}. Óbito às {hora}. O neto tá sentado no chão do banheiro. Não fala com ninguém.',
        dismissed: '[choro] {m:Moço|Moça}... ele tá roxo... ele parou de fazer o barulho... por favor... por favor, não é trote...',
      },
      onResolve: (e, r) => {
        if (r.outcome !== 'obito') e.achievement('o_menino');
      },
      diary: {
        alive: 'Seu Jairo, o da geladeira. Caiu no banheiro. O Biel ligou do número do quadro de trotes, chorando. Era verdade.',
        dead: 'Seu Jairo, o da geladeira. O neto ligou do número que estava no quadro de trotes.',
        later: [{ day: 18, text: 'O Seu Jairo saiu da UTI. Pediu pro neto descobrir quem foi {o} {medico} que acreditou nele.', when: (c) => c.key('jairo') === 'salvo' }],
      },
    }),
    // ------------------------------------------------------------------ 5 PÓS-CRISE (epiléptico conhecido)
    call({
      id: 'd16_convulsao',
      ref: 'D16 #5',
      at: '12:00',
      pool: 'moderado',
      num: '(17) 99227-0820',
      caller: 'Feirante',
      callerName: 'Feirante',
      type: 'testemunha',
      voice: 'jovem_m',
      note: 'Homem caído na feira. Curiosos em volta.',
      noteWrong: 'Homem desacordado na rua. Parece parada!',
      addr: { rua: 'Rua Bahia', n: 820, bairro: 'Centro', ref: 'Feira de sábado, na barraca de pastel.' },
      amb: ['multidao', 'rua'],
      open: [
        '{m:Moço|Moça}, um homem caiu aqui na feira e ficou se debatendo! {{Agora tá desacordado|desacordado}}! Tá juntando gente!',
        '[{{vozes em volta: "ele já fez isso antes", "é o Tião da banca de alho", "é epilepsia, gente"|ja_fez}}]',
      ],
      q: {
        oque: 'Ele tava arrumando a banca e caiu duro, tremendo todo. Uns dois minutos. Parou.',
        consciencia: 'Desacordado... não, peraí, {{tá abrindo o olho, meio bobo|acordando}}. Perguntou onde tá.',
        respira: 'Respira fundo, roncando um pouco, mas respira.',
        idade: 'Uns quarenta e cinco.',
        historico: 'O pessoal tá falando que ele tem epilepsia. {{O irmão dele disse que ele ficou sem o remédio essa semana|sem_remedio}}.',
        sangramento: 'Mordeu a língua. Sangrou um pouco na boca.',
        inicio: 'Agora, uns cinco minutos.',
        paciente: 'TIÃO: [voz pastosa] ...que que aconteceu... cadê o meu alho...',
        seguranca: 'Seguro. Só muita gente em volta querendo pôr colher na boca dele. Eu não deixei.',
      },
      extra: [
        { id: 'quanto_tempo', label: 'Quanto tempo tremeu? Bateu a cabeça?', say: 'Quanto tempo durou a tremedeira? Ele bateu a cabeça quando caiu?', a: 'Uns dois minutos, por aí. Caiu sentado na lona, não bateu a cabeça.' },
        {
          id: 'orientar',
          kind: 'fala',
          label: 'Orientar: de lado, nada na boca',
          // Conferido (campo A6: nada de "medidas intempestivas" contra a mordedura da língua; de lado no pós-crise, como
          // no campo A12; nada pela boca até acordar). RC7: epiléptico conhecido com crise de 2 min seria orientação, mas
          // ainda confuso e sem o remédio é "estado pós-ictal alterado" → USI/USB.
          say: 'Não coloquem nada na boca dele. Deixem ele deitado de lado e afastem o povo. Não deem água até ele acordar direito.',
          a: ['Ouviu, gente? Nada de colher!', '[o barulho do povo se afastando]', 'Pronto, tá de lado. Tá respirando melhor.'],
        },
      ],
      links: [
        { a: 'ja_fez', b: 'acordando', insight: 'Epiléptico conhecido, crise de dois minutos que já parou, acordando confuso: pós-crise. Amarelo → USB (Manual p.1).' },
        { a: 'sem_remedio', b: 'desacordado', insight: 'Ficou sem o remédio e convulsionou: precisa de avaliação e de receita, não de USA. A crise já passou.' },
      ],
      patient: { name: 'Sebastião "Tião" Moraes', age: 45, sex: 'M' },
      truth: { dx: 'Pós-crise convulsiva em epiléptico conhecido (sem o remédio)', sev: 'amarelo', ok: ['USB'], dest: ['UPA', 'REG'], risk: { good: 120, bad: 300, needs: 'USB' } },
      radio: {
        ok: 'Central, {unit}. Pós-ictal, acordando, sem trauma. Ficou sem o anticonvulsivante. Seguimos UPA.',
        excess: '{central}, {unit}. Epiléptico conhecido, pós-crise, já conversando, {dr}. Dava USB.',
      },
      diary: { alive: 'O Tião da banca de alho. Ficou sem o remédio a semana inteira. Convulsionou na feira; o povo queria pôr colher na boca dele.' },
    }),
    // ------------------------------------------------------------------ 6 TROTE SOFISTICADO (falso condutor)
    call({
      id: 'd16_trote',
      ref: 'D16 #6',
      at: '13:10',
      pool: 'trote',
      num: '(17) 99981-1010',
      caller: 'Homem que diz ser da USB 03',
      callerName: 'Homem',
      type: 'trotista',
      voice: 'jovem_h',
      note: 'Diz que é da equipe da USB 03. Acidente com a viatura.',
      noteWrong: 'É da nossa equipe, {dr}! A USB 03 bateu!',
      addr: { rua: 'Av. Norte', n: 1010, bairro: 'Jardim Norte', ref: 'Na frente do Posto Avenida.' },
      amb: ['rua', 'buzinas'],
      open: [
        'Central, aqui é o {{Beto, condutor da USB 03|beto}}! {{QRR 5, QRR 5!|qrr}} A gente bateu na Av. Norte, na frente do Posto Avenida! {{A Lia tá desacordada|lia}}!',
        'Tô {{ligando do meu celular porque o rádio quebrou|celular}}. Manda uma USA, rápido!',
      ],
      q: {
        oque: 'Um caminhão fechou a gente no cruzamento. A viatura capotou. Não, tombou. De lado.',
        consciencia: 'A Lia não responde. O paciente que a gente levava também não.',
        respira: 'Respira, acho. Não dá pra ver direito.',
        idade: 'A Lia? Uns... trinta? Quarenta.',
        referencia: 'Posto Avenida, Av. Norte. Tá todo mundo olhando.',
        seguranca: 'Seguro. Manda logo.',
        sangramento: 'Muito sangue. Muito.',
        historico: 'Sei lá, cara. Manda a USA.',
        paciente: '[{{silêncio; ao fundo, alguém cochicha "fala do caminhão, fala do caminhão"|riso_fundo}}]',
        inicio: 'Agora. Agorinha.',
      },
      extra: [
        { id: 'paciente_viatura', label: 'Que paciente vocês levavam?', say: 'Qual paciente a USB 03 estava transportando? Pra onde?', a: 'Um... senhor. Pro Regional. Infarto. É, infarto.' },
      ],
      callback: ['[{{Caixa postal: "Fala, aqui é o Dudu. Deixa o recado aí, valeu!"|retorno_dudu}}]'],
      links: [
        { a: 'retorno_dudu', b: 'beto', insight: 'Quem atende o retorno é o "Dudu", não o Beto da USB 03. E equipe chama a central pelo rádio, não pelo celular.' },
        { a: 'celular', b: 'manual:trote_sinais', insight: 'Um "condutor" ligando do celular pessoal, sem saber direito o paciente que levava: história de quem ouviu nomes num rádio de escuta (Manual p.2).' },
        { a: 'lia', b: 'riso_fundo', insight: '"A Lia está desacordada"... e alguém sopra a história ao fundo. Confira a USB 03 no painel da frota antes de mandar qualquer coisa.' },
        { a: 'qrr', b: 'beto', insight: '"QRR 5" não é código de acidente de viatura em lugar nenhum. Jargão de quem ouviu rádio de escuta e juntou palavras.' },
      ],
      patient: { name: '"Equipe da USB 03"' },
      truth: { dx: 'Trote sofisticado (falso condutor da USB 03)', sev: 'trote', ok: ['TROTE'], prankKind: 'trote' },
      radio: { prank: 'Central, {unit} no Posto Avenida. Nenhum acidente, nenhuma viatura tombada. O frentista disse que uns moleques ficaram rindo aqui do lado com um rádio de escuta. Trote, {dr}.' },
    }),
    // ------------------------------------------------------------------ folgado de reserva (trotes-folgados.md: sempre 1 no D16)
    call({
      id: 'd16_folgado',
      ref: 'D16 folgado',
      at: '16:05',
      pool: 'folgado',
      genOnly: true,
      num: '(17) 3324-1605',
      caller: 'Seu Valfrido',
      callerName: 'Seu Valfrido',
      type: 'comum',
      voice: 'homem',
      note: 'Homem quer ambulância com sirene pro soluço da esposa.',
      noteWrong: 'Mulher com crise há vinte minutos. Parece sério.',
      cat: 'clinico',
      addr: { rua: 'Rua Sabiá', n: 605, bairro: 'Vila Esperança', ref: 'Casa com uma Brasília amarela na garagem.' },
      amb: ['tv'],
      open: [
        'Boa tarde! É o seguinte: a minha esposa tá com soluço faz vinte minutos. Já tentei tudo. Água de cabeça pra baixo, susto, açúcar.',
        'Aí eu pensei: vocês passam com aquela sirene alta... Se passar aqui na frente com ela ligada, o susto cura. Não precisa nem parar.',
      ],
      q: {
        oque: 'Soluço. Desde o almoço. Ela comeu rápido, foi isso.',
        consciencia: 'Acordada. Brava comigo. Soluçando e brava.',
        respira: 'Respira. Entre um soluço e outro, mas respira.',
        pulso: 'Normal. Eu medi no relógio de pulso dela, que mede tudo. Setenta e oito.',
        pele: 'Vermelha de raiva de mim. Fora isso, normal.',
        dorpeito: 'Dor? Não. Só o soluço. (ao fundo: "HIC. Fala que não dói, Valfrido. HIC.")',
        historico: 'Nada, ela é forte. Só o soluço mesmo.',
        paciente: 'DONA EULÁLIA: Eu falei pra ele não ligar. HIC. Eu falei.',
        gravada: 'Gravando? Então registra aí que eu tentei de tudo antes. Foi uma tarde perdida.',
        nao_perfil: 'Perfil? Mas é só passar na frente! Vocês passam aqui toda hora com a sirene!',
        meios_proprios: ['Meio próprio? Eu já dei o susto, não funcionou. O meu susto é fraco.', 'Bando de #%!#@$ ... [piii] ...Ela tá rindo de mim agora. HIC.'],
        encerrar: 'Tá. Vou fazer ela beber água de canudinho tapando o nariz. Se não der, eu ligo de novo. Brincadeira. Não ligo.',
      },
      patient: { name: 'Eulália (esposa do Seu Valfrido)', age: 61, sex: 'F' },
      truth: { dx: 'Soluço há vinte minutos, sem outra queixa (pedido de sirene)', sev: 'azul', ok: ['ORI'], ref: ['CASA', 'UBS'] },
      radio: { excess: 'Central, {unit}. Uma senhora soluçando no portão, {dr}. Quando viu a viatura parar, levou um susto e o soluço passou. O marido quer agradecer à central. Eu não sei se agradeço.' },
      diary: { ori: 'O Seu Valfrido queria a sirene passando na frente de casa pra curar o soluço da esposa no susto. O soluço passou sozinho às quatro e quinze.' },
    }),
    // ------------------------------------------------------------------ 7 ★ SEU OSVALDO PEIXOTO
    call({
      id: 'd16_osvaldo',
      ref: 'D16 #7 ★',
      at: '14:30',
      anchor: true,
      num: '(17) 3328-1480',
      caller: 'Seu Osvaldo',
      callerName: 'Seu Osvaldo',
      type: 'minimizador',
      voice: 'idoso',
      note: 'Senhor de 84, falta de ar e febre. Diz que não quer incomodar.',
      noteFixed: true,
      addr: ADDR.osvaldo,
      amb: ['silencio', 'radio_am'],
      // mora sozinho e não quer dar trabalho: se for dispensado, não liga de novo
      noFollowup: true,
      open: [
        'Boa tarde, {dr}. Aqui é o {{Osvaldo Peixoto|osvaldo_nome}}. Desculpa incomodar num sábado...',
        'É que eu tô com uma {{falta de ar|falta_ar}} desde ontem e uma febrinha. {{Não precisa mandar nada, não|nao_precisa}}. Meu filho trabalha aí, eu não quero dar trabalho.',
        '[{{tosse molhada; ele para pra respirar no meio das frases|frases_curtas}}]',
      ],
      q: {
        oque: 'Só queria saber... se posso tomar... um xarope. A tosse tá... chata.',
        consciencia: 'Lúcido, lúcido... só meio aéreo hoje. {{Achei que era domingo|confuso}}. Que dia é hoje?',
        respira: 'Puxando um pouco. Falo e paro... falo e paro. Deitado piora.',
        idade: 'Oitenta e quatro.',
        inicio: 'A tosse desde quarta. A febre desde ontem. Hoje nem levantei direito da cama.',
        historico: 'Pressão. E fumei quarenta anos, parei faz dez. O pulmão não perdoa, né?',
        dorpeito: 'Dói do lado direito quando eu tusso. Só quando tusso.',
        paciente: 'Sou eu mesmo, {dr}. Moro sozinho.',
        sangramento: 'Não, não.',
        seguranca: 'Moro sozinho. {{O meu filho é muito ocupado|filho_ocupado}}.',
        referencia: 'Prédio Solar das Palmeiras, apartamento 41. O porteiro tem a chave.',
      },
      extra: [
        { id: 'febre', label: 'Mediu a febre? Calafrio?', say: 'O senhor mediu a febre? Teve calafrio?', a: 'Trinta e nove e meio, no termômetro. Tremi de frio a noite inteira, debaixo de dois cobertores.' },
        {
          id: 'labios',
          label: 'Lábios, unhas? Xixi?',
          say: 'Como estão os lábios e as unhas do senhor? Está fazendo xixi?',
          a: '{{As unhas tão meio arroxeadas|unhas_roxas}}... e xixi, quase nada desde ontem. Nem tô bebendo água, não desce.',
        },
        {
          id: 'filho_peixoto',
          label: '"O seu filho é o Dr. Peixoto?"',
          locked: true,
          // 1.1: "Osvaldo Peixoto... meu filho trabalha aí" + o recado do dia 5 (pai de 84, mora sozinho) na mesa
          unlockedBy: ['doc:peixoto_pai', 'flag:peixoto_pai', 'flag:peixoto_pediu_aviso', 'seguranca', 'paciente'],
          say: 'Seu Osvaldo, o seu filho é o Dr. Peixoto, o coordenador aqui da central?',
          a: ['...É. O Carlinhos.', 'Não conta pra ele, não. {{Ele vive dizendo que o povo se acostumou mal com ambulância|povo_acostumou}}. Eu não quero ser o povo.'],
          unlocks: ['avisar_peixoto'],
        },
        {
          id: 'avisar_peixoto',
          kind: 'fala',
          label: 'Avisar o Peixoto pelo interfone',
          locked: true,
          cost: 6,
          say: '(interfone) Dr. Peixoto? É sobre o seu pai. Ele está na linha, com febre e falta de ar.',
          a: ['[silêncio do outro lado do interfone]', 'PEIXOTO (INTERFONE): ...Manda. Manda o que tiver. Não me pergunta, manda.', '[a voz dele falha na última palavra]'],
          onAsk: fx.set('peixoto_avisado_d16'),
        },
      ],
      links: [
        { a: 'osvaldo_nome', b: 'doc:peixoto_pai', insight: 'Osvaldo Peixoto, 84 anos, mora sozinho na Bela Vista: é o pai do Dr. Peixoto. O que "nunca precisou de ambulância".', unlock: 'filho_peixoto' },
        { a: 'nao_precisa', b: 'frases_curtas', insight: 'Diz que não precisa de nada... mas não termina uma frase sem parar pra respirar. Minimizador.' },
        // Conferido (RC12: frases entrecortadas e confusão nova → USA; RM4: insuficiência respiratória e circulatória é
        // vermelho; unhas roxas e pouca urina são má perfusão).
        { a: 'confuso', b: 'unhas_roxas', insight: 'Febre alta, confusão nova, unhas arroxeadas e quase sem urina, aos 84 anos: pneumonia com infecção generalizada (sepse). Vermelho.' },
      ],
      patient: { name: 'Osvaldo Ribeiro Peixoto', age: 84, sex: 'M' },
      // Conferido (RC12 → USA). A janela de risco é balanceamento de jogo.
      truth: { dx: 'Pneumonia com sepse', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 60, bad: 150 }, key: 'osvaldo' },
      radio: {
        ok: '{central}, {unit} no local. Senhor de 84, saturando 84, febril, pressão baixa. Pneumonia com sepse. Seguimos Regional. Ele pediu pra não avisar o filho.',
        under: 'Central, {unit}! Idoso séptico, hipotenso, saturando mal! Precisamos de USA!',
        dead: 'Central... {unit}. O porteiro abriu o 41. Chegamos tarde. Óbito às {hora}. Na cabeceira, um porta-retrato com o filho de jaleco.',
      },
      diary: {
        alive: 'Seu Osvaldo Peixoto, 84. "Não precisa mandar nada." O pai do coordenador. Precisava.',
        dead: 'Seu Osvaldo Peixoto, 84. "Meu filho trabalha aí, não quero dar trabalho."',
      },
    }),
    // ------------------------------------------------------------------ 8 DOR DE GARGANTA
    call({
      id: 'd16_garganta',
      ref: 'D16 #8',
      at: '15:40',
      pool: 'leve',
      num: '(17) 99436-4620',
      caller: 'Rodrigo',
      callerName: 'Rodrigo',
      type: 'exagerador',
      voice: 'jovem_h',
      note: 'Rapaz com dor de garganta.',
      noteWrong: 'Diz que não consegue respirar!',
      addr: { rua: 'Rua Sete de Setembro', n: 4620, bairro: 'Bela Vista', ref: 'República de estudantes, portão azul.' },
      amb: ['musica', 'videogame'],
      open: ['{Dr}, eu {{não consigo engolir nem a saliva|nao_engole}}! A minha garganta tá fechando! Tá cheia de bolinha branca!'],
      q: {
        oque: 'Começou ontem. Dor pra engolir. Hoje olhei no espelho e tá cheio de placa branca na amígdala.',
        respira: '{{Respirar eu respiro normal|respira_normal}}. É engolir que dói.',
        consciencia: 'Acordado. Com raiva.',
        idade: 'Vinte.',
        historico: 'Nada.',
        inicio: 'Desde ontem.',
        sangramento: 'Não.',
        paciente: 'Sou eu mesmo. Tô falando normal, né? Meio fanho. Mas dói.',
        seguranca: 'Seguro. Os caras da república tão jogando videogame.',
      },
      extra: [
        {
          id: 'baba',
          label: 'Baba? Voz abafada? Abre a boca?',
          say: 'Você está babando? A voz está abafada, de "batata quente"? Consegue abrir a boca toda?',
          a: 'Não babo. A voz tá normal, meio fanha. Abro a boca, abro tudo. {{Tomei um iogurte agora, doeu, mas desceu|engoliu}}.',
        },
        { id: 'febre', label: 'Febre?', say: 'Tem febre?', a: 'Trinta e oito.' },
      ],
      links: [
        { a: 'nao_engole', b: 'engoliu', insight: '"Não consigo engolir nem a saliva"... e acabou de tomar um iogurte. Dói, mas desce.' },
        { a: 'respira_normal', b: 'manual:verde', insight: 'Dor de garganta com placas e febre, respira normal, sem baba nem voz abafada: amigdalite. Verde, UPA ou UBS (Manual p.1).' },
      ],
      patient: { name: 'Rodrigo Santos', age: 20, sex: 'M' },
      // Conferido (RC12: sem estridor, sem baba, sem voz de "batata quente", abre a boca e engole → sem obstrução; febre
      // é orientação).
      truth: { dx: 'Amigdalite sem sinais de obstrução', sev: 'verde', ok: ['ORI'], ref: ['UPA', 'UBS'] },
      radio: { excess: '{central}, {unit}. Amigdalite, {dr}. Ele pediu pra gente passar na farmácia no caminho.' },
      diary: { ori: 'Garganta "fechando". Fechou um iogurte inteiro. UPA.' },
    }),
    // ------------------------------------------------------------------ 9 QUEDA DE LAJE
    call({
      id: 'd16_laje',
      ref: 'D16 #9',
      at: '16:50',
      pool: 'grave',
      num: '(17) 99158-3240',
      caller: 'Josias (servente)',
      callerName: 'Josias',
      type: 'testemunha',
      voice: 'homem',
      note: 'Queda de laje. Pedreiro no chão.',
      noteWrong: 'Pedreiro caiu, mas tá falando. Parece leve.',
      addr: { rua: 'Rua Minas Gerais', n: 3240, bairro: 'Vila Esperança', ref: 'Obra de sobrado com tapume verde, do lado da igreja evangélica.' },
      amb: ['rua', 'gritos'],
      open: [
        '{Dr}, o mestre de obras {{caiu da laje|caiu_laje}}! Do segundo andar, {{uns seis metros|seis_metros}}! Caiu de costas em cima do entulho!',
        'Ele tá falando, mas {{tá dizendo que não sente as pernas|nao_sente}}!',
      ],
      q: {
        oque: 'A gente tava concretando a laje, a escora cedeu. Ele caiu junto com a tábua.',
        consciencia: 'Acordado, falando. Mas falando devagar, assustado.',
        respira: 'Respira, mas reclama que dói pra puxar o ar. {{Tá ficando cinza|cinza}}.',
        idade: 'Cinquenta e um.',
        sangramento: 'Sangra da cabeça, um corte atrás. Tem um vergalhão do lado, mas não espetou.',
        historico: 'Não sei. Ele bebe uma no fim do dia.',
        inicio: 'Agora, uns cinco minutos.',
        paciente: 'SEU DIRCEU: Não me mexe... não me mexe... eu não sinto as pernas, Josias... por que eu não sinto as pernas?',
        seguranca: 'Seguro. Desliguei a betoneira.',
      },
      extra: [{ id: 'mexer', label: 'Alguém mexeu nele?', say: 'Alguém tentou levantar ou mexer nele?', a: 'Os meninos queriam carregar ele pra sombra. Eu não deixei. Fiz certo?' }],
      links: [
        { a: 'seis_metros', b: 'nao_sente', insight: 'Queda de seis metros, de costas, sem sentir as pernas: trauma grave com lesão de coluna. USA → Regional. Ninguém mexe nele.' },
        { a: 'cinza', b: 'manual:vermelho', insight: 'Dor pra respirar e cor cinzenta depois da queda: trauma grave, risco imediato. Vermelho (Manual p.1).' },
      ],
      worsen: [{ after: 50, lines: ['{Dr}! {{Ele vomitou e tá ficando sonolento|vomitou}}!'], guide: 'queda_laje' }],
      guide: { id: 'queda_laje' },
      patient: { name: 'Dirceu Pereira', age: 51, sex: 'M' },
      truth: { dx: 'Trauma grave (queda de 6 m): coluna e tórax', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 45, bad: 110, guideBonus: 15 } },
      radio: {
        ok: '{central}, {unit} no local. Queda de seis metros, trauma raquimedular e de tórax. Prancha, colar, oxigênio. Seguimos Regional.',
        saved: '{central}, {unit}. Ninguém mexeu nele, viraram em bloco quando vomitou. Quem orientou? Salvou a coluna desse homem. Seguimos Regional.',
        under: 'Central, {unit}! Trauma raquimedular, pneumotórax provável! Precisamos de USA!',
        dead: 'Central... {unit}. Parou na prancha. Óbito às {hora}.',
        dismissed: '{Dr}! Ele não tá mais falando! Tá roxo! Cadê vocês?!',
      },
      diary: {
        alive: 'Seu Dirceu, mestre de obras. A escora cedeu. Seis metros. Ninguém deixou carregarem ele pra sombra.',
        dead: 'Seu Dirceu, mestre de obras. A escora cedeu. Seis metros.',
      },
    }),
  ],
  endScene: (c) => {
    const k = c.key('osvaldo');
    if (k === 'salvo') {
      return {
        id: 'd16_peixoto',
        bg: 'central',
        cast: ['PEIXOTO'],
        nodes: {
          start: {
            lines: [
              { who: 'NARRADOR', t: '19:05. Você está desligando o monitor quando o Peixoto aparece na porta da central. Sem gravata. Sábado.' },
              { who: 'PEIXOTO', t: 'Era o meu pai. Na ficha das duas e meia.' },
              { who: 'PEIXOTO', t: 'A equipe disse que se demorasse mais uma hora... (ele não termina a frase)' },
              c.flag('peixoto_avisado_d16')
                ? { who: 'PEIXOTO', t: 'Você me avisou pelo interfone. Eu não sabia o que dizer. Disse "manda". Foi a única coisa certa que eu falei esse mês.' }
                : { who: 'PEIXOTO', t: 'Ele disse que {m:o regulador foi educado|a reguladora foi educada}. Que não deixou ele terminar o "não precisa".' },
              ...(c.val('d16_peixoto_almoco') === 'cuidadora' ? [{ who: 'PEIXOTO', t: 'Você mandou eu ligar pra cuidadora. Não tinha cuidadora. Eu demorei duas horas pra lembrar disso parado na rodovia.' }] : []),
              ...(c.val('d16_peixoto_almoco') === 'neutro' ? [{ who: 'PEIXOTO', t: 'Você disse que era ligação como qualquer outra. Você tinha razão. E eu odeio que você tinha razão.' }] : []),
              { who: 'PEIXOTO', t: 'Ele sempre diz "não precisa". Eu aprendi com ele.' },
            ],
            choices: [
              { label: '"Ninguém precisa de ambulância, Dr. Peixoto. Até precisar."', next: 'fim' },
              { label: '"Eu teria mandado pra qualquer um."', next: 'fim' },
            ],
          },
          fim: {
            lines: [
              { who: 'PEIXOTO', t: 'É. ...É isso que me assusta.' },
              { who: 'NARRADOR', t: 'Ele sai sem apagar a luz do corredor. O painel de metas continua aceso na parede.' },
            ],
          },
        },
      };
    }
    if (k === 'perdido') {
      return {
        id: 'd16_peixoto',
        bg: 'central',
        cast: ['PEIXOTO'],
        nodes: {
          start: {
            lines: [
              { who: 'NARRADOR', t: '19:05. O Peixoto está parado na porta da central. Não entra.' },
              { who: 'PEIXOTO', t: 'Meu pai morreu hoje à tarde. Sozinho, no apartamento.' },
              { who: 'PEIXOTO', t: 'Eu vou querer a gravação. A ficha. Os horários. Cada minuto da ligação das duas e meia.' },
              ...(c.val('d16_peixoto_almoco') === 'neutro' ? [{ who: 'PEIXOTO', t: 'Você disse no almoço que era ligação como qualquer outra. Era. Foi.' }] : []),
              { who: 'NARRADOR', t: 'Ele fala baixo, sem olhar pra você. A voz de quem já começou a procurar um culpado e tem medo de encontrar no espelho.' },
            ],
            choices: [
              { label: '"Eu sinto muito, Dr. Peixoto."', next: 'fim' },
              { label: 'Não dizer nada.', next: 'fim' },
            ],
          },
          fim: {
            lines: [
              { who: 'PEIXOTO', t: 'Sente. Todo mundo sente.' },
              { who: 'NARRADOR', t: 'Na parede, o painel de metas continua aceso. Verde.' },
            ],
          },
        },
      };
    }
    return undefined;
  },
  ida: (c) =>
    rua('d16_ida', 'rua', [
      c.flag('aniversario_pago')
        ? { who: 'TONINHO', t: '(da porta da padaria) O bolo tava bom, doutor? O menino gostou da sirene?' }
        : c.flag('aniversario_fiado')
          ? { who: 'TONINHO', t: '(da porta da padaria) Sem pressa, doutor. O fiado de aniversário eu não cobro antes do mês virar.' }
          : { who: 'NARRADOR', t: 'A padaria do Seu Toninho ainda está de porta meio fechada. Cheiro de pão saindo pela fresta.' },
      { who: 'NARRADOR', t: 'No ponto da XV, o Biel não está. O banco do ponto, onde ele senta toda manhã de boné virado, está vazio. Pela primeira vez em duas semanas.' },
    ]),
  almoco: (c) => almocoD16(c),
  volta: (c) =>
    rua('d16_volta', 'rua', [
      { who: 'NARRADOR', t: 'Sábado à noite. O 12 passa pela XV, 1950. Na portaria do Ed. Aurora, uma senhora de xale roxo conversa com o porteiro.' },
      ...(aulas(c) >= 1
        ? [{ who: 'NARRADOR', t: edsonVivo(c) ? 'É a Dona Iolanda, a professora do Liam, falando com o Edson. Ela acena para o ônibus como se soubesse quem está nele.' : 'É a Dona Iolanda, a professora do Liam. Ela acena para o ônibus como se soubesse quem está nele.' }]
        : [{ who: 'NARRADOR', t: 'O porteiro ri de alguma coisa que ela diz. Lá em cima, no terceiro andar, só uma janela acesa.' }]),
    ]),
  interlude: {
    teaser: (c) => (c.s.family.zelia.status === 'internado' ? 'A Dona Zélia ficou no Regional. Em casa, o resto da família espera você.' : 'Sábado à noite. Amanhã é domingo.'),
    pre: (c) => preD16(c),
    familyLacos: 1,
    onFamily: (e) => {
      if (e.flag('promessa_davi') && presente(e, 'davi')) {
        e.set('promessa_cumprida');
        e.add('lacos', 1, 'o domingo inteiro com o Liam');
      }
    },
    onRest: (e) => {
      if (e.flag('promessa_davi') && presente(e, 'davi')) e.add('lacos', -1, 'dormiu o domingo prometido');
    },
    onBico: (e) => {
      e.add('lacos', -1, 'bico no sábado');
      if (e.flag('promessa_davi') && presente(e, 'davi')) e.add('lacos', -1, 'quebrou a promessa do domingo');
    },
    scene: (c) => cenaD16(c),
    bico: (c) => bicoD16(c),
  },
});
