// =============================================================================
// DIA 5 — "Corte" (Manual p.5 + p.5-B; frota cortada automaticamente: 2 USA + 4 USB)
// Armadilha do painel: o dia tem exatamente 3 casos reais de USA (infarto,
// parada na academia, pedreiro). A meta é 2 — os R$ 30 só saem errando de propósito.
// Fios: 🌱 Peixoto e o pai (doc peixoto_pai → D16), 🌱 queda da Cida ("e se eu
// cair aqui sozinha?" → D8), asma moderada ensinada antes do D9, trote com voz
// de criança que arma a armadilha do D6, resposta ao Liam que volta na redação do D8.
// =============================================================================
import type { Ctx, Decision, ShiftScriptCtx, TimelineDef, UnitState } from '../../engine/types';
import type { GuideScript } from '../../engine/content-api';
import { hm } from '../../engine/util';
import { day, call, fx, is, NUM, ADDR } from '../dsl';

/** decisão carimbada de uma ligação do dia (pelo id da definição; ignora variantes do banco) */
const decisao = (c: Ctx, defId: string): Decision | undefined =>
  c.s.shift ? Object.values(c.s.shift.calls).find((x) => x.def === defId && !x.gen)?.decision : undefined;

/**
 * Vigia de rádio: quando a viatura despachada para `defId` chega ao local, dispara
 * um pedido de mão dupla (uma vez). Reagenda a si mesmo a cada 5 min enquanto a
 * ligação ainda pode gerar viatura.
 */
function vigiaNoLocal(id: string, at: string, defId: string, fire: (c: ShiftScriptCtx, u: UnitState) => void): TimelineDef {
  return {
    at,
    kind: 'script',
    id,
    run: (c) => {
      if (c.sflag(id + '_feito')) return;
      const cl = c.callStatus(defId);
      if (!cl || cl.gen) return;
      const units = cl.units.map((uid) => c.shift.units[uid]).filter((u): u is UnitState => !!u);
      const local = units.find((u) => u.status === 'LOCAL' && u.callId === cl.id);
      if (local) {
        c.sflag(id + '_feito', true);
        fire(c, local);
        return;
      }
      const aCaminho = units.some((u) => u.status === 'DESLOC' && u.callId === cl.id);
      const aberta = cl.status === 'fila' || cl.status === 'ativa' || cl.status === 'espera' || cl.status === 'guia';
      if ((aberta || aCaminho) && c.now < hm('18:40')) c.schedule(c.now + 5, id);
    },
  };
}

// -----------------------------------------------------------------------------
// Orientação nova do dia: queda de altura com suspeita de lesão de coluna.
// -----------------------------------------------------------------------------
export const GUIDES_EXTRA: Record<string, GuideScript> = {
  // Conferido (campo A13; PHTLS): ninguém move a vítima, estabilização manual da cabeça, nada pela boca,
  // aquecer por cima sem mexer no corpo.
  queda_coluna: {
    id: 'queda_coluna',
    title: 'Orientação: queda de altura',
    kind: 'dialogo',
    intro: 'Suspeita de lesão de coluna. A regra é uma só: ninguém mexe na vítima até a equipe chegar com a prancha.',
    panic: 65,
    steps: [
      {
        say: 'Os meninos querem levantar ele e pôr na caminhonete! Dizem que é mais rápido!',
        options: [
          { label: 'Ninguém levanta ele. A ambulância está indo e ele vai na prancha, deitado.', kind: 'certo' },
          { label: 'Pode levar, se for mais rápido.', kind: 'errado', reply: 'Puxaram ele pelo braço... ele gritou, {dr}!' },
          { label: 'Calma. O senhor fez certo em me ligar. Eu vou te guiar.', kind: 'calma' },
        ],
      },
      {
        say: 'Ele quer sentar, diz que tá desconfortável deitado em cima do tijolo.',
        options: [
          { label: 'Não deixa sentar. Alguém se ajoelha atrás da cabeça dele e segura a cabeça parada, alinhada com o corpo.', kind: 'certo' },
          { label: 'Ajuda ele a sentar devagarinho.', kind: 'errado', reply: 'Ele falou que o braço formigou agora!' },
          { label: 'Põe um travesseiro embaixo da cabeça.', kind: 'neutro', reply: 'Travesseiro? Aqui só tem saco de cimento...' },
        ],
      },
      {
        say: 'Ele tá pedindo água, a boca tá seca.',
        options: [
          { label: 'Nada pela boca: ele pode precisar de cirurgia. Molha só os lábios com um pano.', kind: 'certo' },
          { label: 'Dá um copo d’água, coitado.', kind: 'errado' },
          { label: 'Conversa com ele. Fala que a ajuda está chegando.', kind: 'calma' },
        ],
      },
      {
        say: 'Ele tá tremendo, diz que tá com frio.',
        options: [
          { label: 'Cobre ele com uma lona ou um casaco, por cima, sem mexer no corpo.', kind: 'certo' },
          { label: 'Arrasta ele pra sombra.', kind: 'errado', reply: 'A gente puxou pela perna... ele nem sentiu.' },
        ],
      },
      {
        say: 'Tô ouvindo a sirene! Tá chegando!',
        options: [
          { label: 'Alguém vai até o portão guiar a equipe. Quem segura a cabeça não solta.', kind: 'certo' },
          { label: 'Todo mundo corre pra rua acenar.', kind: 'neutro' },
        ],
      },
    ],
    success: 'Ninguém mexeu nele até a prancha chegar.',
    fail: 'Mexeram na vítima mais do que deviam.',
  },
};

export const DAY = day({
  day: 5,
  title: 'Corte',
  weekday: 'Sexta-feira',
  weather: 'Abafado, 31 °C. Céu branco, sem vento.',
  goal: { maxUSA: 2, bonus: 30 },
  newspaper: (c) => ({
    headline: 'Saúde+ Gestão tira duas ambulâncias das ruas',
    sub: 'A partir de hoje, a Regulação de Santa Aurora opera com 2 USA e 4 USB. A OS promete "uso racional" e instala um painel de metas na Central.',
    photo: 'garagem',
    stories: [
      !c.flag('d4_tiro_despachado')
        ? { title: 'Atirador do Bar do Neno é preso no Jardim Primavera', text: 'O baleado chegou ao Regional no carro de um vizinho. A arma era emprestada de um primo, segundo a PM.' }
        : c.flag('d4_equipe_ferida')
          ? { title: 'Enfermeiro de ambulância é ferido no Bar do Neno', text: 'A equipe entrou antes de a polícia controlar a cena e levou uma garrafada. O baleado sobreviveu. A Saúde+ Gestão diz que "vai apurar a regulação".' }
          : c.flag('d4_pm_ok')
            ? { title: 'Atirador do Bar do Neno é preso; baleado passa bem', text: 'A ambulância e a PM chegaram juntas. "Foi tudo muito rápido", disse o dono do bar. A arma era emprestada de um primo.' }
            : { title: 'Ambulância chega antes da polícia no Bar do Neno', text: 'A equipe esperou na esquina, com o atirador na calçada, até a PM chegar. O baleado sobreviveu. O sindicato pede "regulação com polícia junto".' },
      { title: 'Vila Esperança perde a "ambulância do bairro"', text: 'A USA 03 foi recolhida à garagem da OS. Moradores fizeram abaixo-assinado. A Saúde+ Gestão respondeu que a Base Centro "fica a poucos minutos". Os moradores contaram: são onze.' },
      { title: 'Clube Municipal reabre a piscina no calor', text: 'Entrada a R$ 5. Salva-vidas, só aos sábados e domingos, "por contenção de despesas".' },
    ],
    notice: 'Novas páginas no Manual: 5 (corte de frota e meta do painel) e 5-B (respiratório e asma). O painel de metas fica ligado o dia inteiro.',
    ad: 'ACADEMIA FORÇA TOTAL — Matrícula grátis em março! "Sem dor, sem ganho." Av. Santos Dumont, 2480.',
    weather: 'Abafado · 31 °C',
  }),
  handover: () => ({
    id: 'd05_passagem',
    bg: 'central',
    cast: ['PEIXOTO', 'HENRIQUE', 'SIMONE'],
    nodes: {
      start: {
        lines: [
          { who: 'NARRADOR', t: '07:00. Tem um monitor novo na sua mesa, com o logo da Saúde+ Gestão e um rostinho sorridente no canto. Embaixo, em letras verdes: "META DO DIA: 2 USA".' },
          { who: 'PEIXOTO', t: 'Bom dia, {dr}! Dia histórico. A partir de hoje a gente opera enxuto: duas USA, quatro USB. A 03 e a USB 05 estão sendo recolhidas agora de manhã.' },
          { who: 'PEIXOTO', t: 'E tem o painel. Terminou o dia com até duas USA, a OS paga trinta reais de bônus. É incentivo, não é ordem. Eficiência!' },
          { who: 'HENRIQUE', t: '(vestindo a jaqueta) Trinta reais por USA economizada. Bonito, Peixoto. Vou mandar emoldurar.' },
          { who: 'PEIXOTO', t: 'Henrique, vai dormir.' },
          { who: 'SIMONE', t: '(sem tirar o fone) A Vila Esperança ficou sem USA, {dr}. Quem vai pra lá agora é a 01, lá do Centro.' },
        ],
        choices: [
          { label: '"Eu mando USA pra quem precisar de USA, Peixoto."', next: 'firme' },
          { label: '"Entendido."', next: 'ok' },
          { label: '(Olhar para a Simone.)', next: 'simone' },
        ],
      },
      firme: {
        lines: [
          { who: 'PEIXOTO', t: 'Claro, claro. Ninguém tá pedindo pra deixar ninguém morrer, {dr}. Só pra pensar duas vezes. A gente tá aqui pra pensar.' },
          { who: 'NARRADOR', t: 'Ele bate duas vezes no monitor, como quem bate na cabeça de um cachorro bonzinho, e sai.' },
        ],
      },
      ok: {
        lines: [
          { who: 'PEIXOTO', t: 'É assim que eu gosto. Equipe alinhada.' },
          { who: 'NARRADOR', t: 'O rostinho do painel sorri pra você o dia inteiro, até que deixa de sorrir.' },
        ],
      },
      simone: {
        lines: [
          { who: 'NARRADOR', t: 'A Simone dá de ombros e cola um post-it na borda do monitor novo, bem em cima do rostinho:' },
          { who: 'NARRADOR', t: '"A meta não está acima do Manual. (p.5)"' },
          { who: 'SIMONE', t: 'Tá escrito lá, {dr}. Eu só sublinhei.' },
        ],
      },
    },
  }),
  timeline: [
    { at: '07:02', kind: 'radio', who: 'USA 03 · ZÉ CARLOS', text: 'Central, USA 03 entregando a viatura na garagem da OS. Ordem de cima. Foi uma honra, pessoal. Cuidem da Vila Esperança pra gente.' },
    { at: '07:03', kind: 'radio', who: 'SISTEMA', text: 'Frota reduzida (Manual p.5): USA 03 e USB 05 fora de circulação. Painel de metas ativo: 2 USA.' },
    { at: '09:20', kind: 'simone', who: 'SIMONE', text: 'Conta de quem tá aqui há vinte e dois anos, {dr}: USA demora de duas a quatro horas pra voltar, com a retenção de maca. Manda as duas cedo e você almoça sem nenhuma.' },
    {
      at: '12:30',
      kind: 'interfone',
      who: 'DR. PEIXOTO',
      text: '{Dr}, almoçando aqui de olho no painel. Sabe o que me tira do sério? Gente que chama ambulância porque cortou o dedo. Meu pai tem 84 anos e nunca precisou de ambulância. É hábito, {dr}, o povo se acostumou mal.',
      run: (c) => {
        c.doc('peixoto_pai');
        c.set('peixoto_pai');
      },
      options: [
        { id: 'pai', label: '"Seu pai mora sozinho?"', reply: 'Sozinho, na Bela Vista. Não quer cuidadora, não quer bengala, não quer nada. Saúde de ferro, o Seu Osvaldo. ...Por quê?' },
        { id: 'habito', label: '"Infarto não é hábito, Peixoto."', reply: 'Mas a conta é, {dr}. Alguém paga a conta. Bom almoço.' },
        { id: 'calar', label: '(Não responder.)', reply: '...Bom. Meta é meta. Bom almoço, {dr}.' },
      ],
    },
    {
      at: '15:30',
      kind: 'simone',
      who: 'SIMONE',
      text: (c) => (c.s.shift && c.s.shift.usaSent > 2 ? 'O rostinho do painel ficou bravo com você, {dr}. Eu tirei foto. Vou emoldurar do lado do post-it.' : ''),
    },
    vigiaNoLocal('vigia_benedita', '15:55', 'd05_benedita', (c, u) => {
      c.request(
        u.radioName,
        `Central, ${u.label} na casa da Dona Benedita. Ela se recusa a ir. Diz que tem 86 anos e nunca precisou de ambulância. Tá desidratada, confunde o nome da vizinha. O que eu faço?`,
        [
          {
            id: 'falar',
            label: 'Falar com ela pelo rádio (10 min)',
            cost: 10,
            effect: (s) => {
              s.add('humanidade', 1, 'convenceu a Dona Benedita');
              s.set('d5_benedita_radio');
            },
            reply: 'Ela ouviu a Central e topou ir. Só se levar o radinho de pilha e o terço. Tá vindo, toda arrumada.',
          },
          {
            id: 'termo',
            label: 'Liberar mediante termo de recusa',
            effect: (s) => s.set('d5_benedita_termo'),
            reply: 'Assinou o termo com a letra tremida. Deixamos soro caseiro com a vizinha. Liberada.',
          },
          {
            id: 'levar',
            label: 'Levar mesmo assim (ela está confusa)',
            effect: (s) => s.set('d5_benedita_levada'),
            reply: 'Levamos. Ela xingou a equipe até a esquina e depois dormiu no meu ombro.',
          },
        ],
        'termo',
        8,
      );
    }),
    { at: '17:45', kind: 'radio', who: 'USA 01 · BENÉ', text: 'Central, USA 01 abastecendo. Dezoito anos de ambulância e nunca vi viatura boa parada em garagem. Tá feio isso, {bene}.' },
  ],
  calls: [
    // ------------------------------------------------------------------ 1
    call({
      id: 'd05_infarto',
      ref: 'D5 #1',
      at: '07:10',
      pool: 'cardio,grave',
      num: '(17) 3325-3120',
      caller: 'Edmilson (filho)',
      callerName: 'Edmilson',
      type: 'comum',
      voice: 'jovem_h',
      note: 'Filho. Pai com dor no peito, suando.',
      noteWrong: 'Filho nervoso. Pai com azia, acho.',
      addr: { rua: 'Rua Minas Gerais', n: 3120, bairro: 'Vila Esperança', ref: 'Portão de ferro verde, em frente ao bar do Tonho.' },
      amb: ['passaros', 'cozinha'],
      open: [
        'Alô, emergência? É o meu pai! Ele tá com {{uma dor no peito que aperta|aperto}}, falou que parece {{um elefante sentado em cima|elefante}}!',
        '[ao fundo, um gemido baixo e uma cadeira sendo arrastada]',
      ],
      q: {
        oque: 'Ele tava varrendo o quintal, parou, sentou no degrau e ficou branco. Pôs a mão aqui no peito e não tirou mais.',
        consciencia: 'Tá acordado, fala comigo, mas tá {{gelado e molhado de suor|suor}}.',
        respira: 'Respira, mas curtinho, meio ofegante.',
        idade: 'Sessenta e dois.',
        inicio: 'Faz uns {{quarenta minutos|quarenta_min}}. Ele achou que ia passar, não quis que eu ligasse.',
        historico: ['Pressão alta. Toma o remédio quando lembra.', '{{Fuma um maço por dia|fuma}} desde moleque.'],
        dorpeito: 'Vai {{pro braço esquerdo e pro queixo|irradia}}. E ele tá suando frio, a camisa tá encharcada.',
        sangramento: 'Não, sangue nenhum.',
        paciente: ['NIVALDO: Tá apertando... parece que tem um peso... aqui...', '[respiração curta]', 'NIVALDO: Não precisa... ambulância, Edmilson...'],
        referencia: 'Em frente ao bar do Tonho, portão de ferro verde.',
        seguranca: 'Seguro, só eu e ele.',
      },
      extra: [
        {
          id: 'repouso',
          kind: 'fala',
          label: 'Orientar repouso absoluto',
          cost: 5,
          say: 'Deixa ele sentado, quieto, sem fazer esforço nenhum. Não deixa ele levantar nem pra ir ao banheiro. Afrouxa a roupa.',
          // Conferido (campo A15: AC17/BC12): repouso, cabeceira elevada, tranquilizar; AAS e nitrato só pela equipe.
          a: 'Tá, tá. Sentei ele no sofá. Pai, fica quieto, pai. {O} {dr} mandou.',
        },
      ],
      links: [
        { a: 'irradia', b: 'manual:peito', insight: 'Mais de 40 anos, suor frio e dor irradiada para braço e queixo: provável infarto. Vermelho → USA (Manual p.3).' },
        { a: 'suor', b: 'aperto', kind: 'confirma', insight: 'Aperto no peito com suor frio em homem de 62 anos, fumante e hipertenso: quadro clássico de infarto.' },
      ],
      worsen: [
        {
          after: 95,
          lines: ['EDMILSON: {Dr}! Ele ficou roxo, escorregou do sofá! Pai! PAI!', '[o telefone bate no chão; alguém grita ao longe]'],
          truth: { dx: 'Parada cardíaca (infarto)', risk: { good: 60, bad: 150, guideBonus: 25 } },
          guide: 'rcp',
        },
      ],
      patient: { name: 'Nivaldo Pereira', age: 62, sex: 'M' },
      truth: { dx: 'Infarto agudo do miocárdio', sev: 'vermelho', ok: ['USA'], risk: { good: 60, bad: 150 } },
      radio: {
        ok: '{central}, {unit} no local. Supra de ST na parede inferior. Chegamos a tempo. Seguimos Regional.',
        saved: '{central}, {unit}. Pegamos ele em fibrilação, chocamos duas vezes, voltou. O filho contou a massagem até a gente entrar. Seguimos Regional.',
        under: 'Central, {unit}! É infarto com supra, o homem tá cinza! Precisamos de USA!',
        dismissed: 'EDMILSON: {Dr}! Ele desmaiou! Caiu do sofá! Vocês não iam mandar ninguém?!',
      },
      diary: {
        alive: 'Infarto varrendo o quintal. Supra de ST, chegou a tempo no Regional.',
        dead: 'Infarto varrendo o quintal. O filho ficou na linha até o fim.',
      },
    }),
    // ------------------------------------------------------------------ 2
    call({
      id: 'd05_dedo',
      ref: 'D5 #2',
      at: '07:50',
      pool: 'leve',
      num: '(17) 99712-1450',
      caller: 'Kléber',
      callerName: 'Kléber',
      type: 'exagerador',
      voice: 'jovem_h',
      note: 'Rapaz cortou o dedo. Muito nervoso.',
      noteWrong: 'Hemorragia, diz que tá jorrando.',
      addr: { rua: 'Rua Pará', n: 1450, bairro: 'Distrito Industrial', ref: 'República dos rapazes da metalúrgica, portão cinza.' },
      amb: ['respiracao', 'cozinha'],
      open: [
        '{Dr}, corre! Eu {{quase arranquei o dedo|arranquei}} abrindo uma lata de sardinha! {{Tem sangue pra todo lado|sangue_todo_lado}}!',
        '[respiração ofegante; um gato miando perto do telefone]',
      ],
      q: {
        oque: 'A tampa da lata escorregou e pegou a ponta do indicador. Aí eu vi o sangue e fiquei meio zonzo.',
        sangramento: ['Tinha bastante... {{mas parou quando eu apertei com a camiseta|parou}}.', 'Acho que parou. Não quero olhar.'],
        consciencia: 'Tô acordado. Sentei no chão da cozinha porque fiquei vendo estrelinha.',
        respira: 'Respiro... rápido, mas respiro.',
        idade: 'Vinte e quatro.',
        inicio: 'Agora, uns dez minutos.',
        historico: 'Nada. Só desmaio quando vejo sangue. Doei sangue uma vez e apaguei na cadeira.',
        paciente: 'Sou eu mesmo, {dr}.',
        seguranca: 'Seguro. Só eu e o gato. O gato tá lambendo a lata.',
      },
      extra: [
        {
          id: 'profundo',
          label: 'Dá pra ver o osso? Mexe o dedo?',
          say: 'Olha o corte comigo: dá pra ver osso ou carne funda? Você mexe o dedo normal?',
          a: '[pausa] ...{{É uma lasquinha na ponta|lasquinha}}. Osso não. Mexe, mexe normal. Arde.',
        },
        {
          id: 'tetano',
          label: 'Vacina antitetânica?',
          say: 'Sua vacina de tétano está em dia?',
          a: 'Tétano? A última foi no quartel, faz uns... seis anos? Sete?',
        },
        {
          id: 'orientar',
          kind: 'fala',
          label: 'Orientar compressão',
          say: 'Aperta o corte com um pano limpo, sem soltar, por dez minutos, com a mão levantada. Quando parar, lava com água e sabão e cobre. Se não parar, me liga de novo.',
          // Conferido (campo A5: AP19/BP8): compressão direta contínua até parar; só depois limpar e cobrir.
          a: ['Dez minutos... tá. Tô apertando.', '[pausa]', 'Parou. Parou mesmo. Desculpa, {dr}. Eu sou fraco pra sangue.'],
        },
      ],
      links: [
        { a: 'sangue_todo_lado', b: 'parou', insight: '"Sangue pra todo lado"... que parou com a compressão de uma camiseta. Sangramento controlado.' },
        { a: 'lasquinha', b: 'manual:verde', insight: 'Corte superficial na ponta do dedo, sem sangramento ativo e com movimento normal: verde. Orientar e UBS por meios próprios (Manual p.1).' },
      ],
      patient: { name: 'Kléber Antunes', age: 24, sex: 'M' },
      truth: { dx: 'Corte superficial na ponta do dedo', sev: 'verde', ok: ['ORI'], ref: ['UBS', 'UPA'] },
      radio: { excess: 'Central, {unit}. É um corte na ponta do dedo, {dr}. O rapaz desmaiou quando viu a gente entrar. De vergonha, eu acho.' },
      diary: { ori: 'Corte na ponta do dedo abrindo lata de sardinha. Desmaia vendo sangue. Orientado: compressão e vacina na UBS.' },
    }),
    // ------------------------------------------------------------------ 3 ★
    call({
      id: 'd05_academia',
      ref: 'D5 #3 ★',
      at: '08:40',
      anchor: true,
      num: '(17) 3324-2480',
      caller: 'Kelly (recepcionista)',
      callerName: 'Kelly',
      type: 'testemunha',
      voice: 'jovem_m',
      note: 'ACADEMIA. Homem caído, tão fazendo massagem nele!',
      noteFixed: true,
      addr: { rua: 'Av. Santos Dumont', n: 2480, bairro: 'Jardim Norte', ref: 'Academia Força Total, em cima da loja de pneus. Tem escada.' },
      amb: ['academia', 'musica', 'gritos'],
      open: [
        'Emergência?! O professor caiu da esteira! Ele {{não tá respirando|nao_respira}}! {{Uma aluna tá fazendo massagem nele|massagem}}!',
        '[{{música eletrônica alta|musica}}; alguém grita "desliga esse som!"]',
      ],
      q: {
        consciencia: 'Não! A gente chamou, deu tapinha na cara, ele {{não responde|nao_responde}}!',
        respira: [
          'Ele fez uns {{barulhos tipo puxando o ar, de vez em quando|gasping}}... agora nem isso.',
          '[ao fundo, uma moça contando alto: "...vinte e oito, vinte e nove, trinta!"]',
          'TAÍS: Não tem pulso! Eu tô contando!',
        ],
        idade: 'Quarenta e oito. É o dono, o Marcão.',
        inicio: 'Agora! Faz uns três minutos! Ele tava correndo e caiu de lado.',
        oque: 'Ele tava na esteira, fez uma careta, pôs a mão no peito e caiu. Bateu a cabeça no chão.',
        sangramento: 'Um cortinho na sobrancelha. Pouco.',
        historico: 'Ele sempre falou que era um touro... {{Ontem ele reclamou de uma azia que não passava|azia}}.',
        paciente: 'Ele não fala, {m:moço|moça}! Ele tá roxo!',
        referencia: 'Em cima da loja de pneus! Tem escada! Vou mandar alguém esperar lá embaixo!',
        seguranca: 'Seguro! Só cheio de gente em volta!',
      },
      extra: [
        {
          id: 'dea',
          label: 'Tem desfibrilador (DEA) aí?',
          say: 'A academia tem um desfibrilador automático? Uma caixa na parede, com adesivos e um coração desenhado?',
          a: 'Tem! {{Tem uma caixa amarela perto do bebedouro|dea_caixa}}! Ninguém nunca abriu! Ninguém sabe usar!',
          unlocks: ['dea_usar'],
        },
        {
          id: 'dea_usar',
          kind: 'fala',
          locked: true,
          label: 'Mandar ligar o DEA',
          say: 'Abre a caixa, liga o aparelho e faz exatamente o que ele mandar. Ele fala sozinho. Ninguém encosta no professor quando ele avisar.',
          // Conferido (campo A1: BC5; ACLS): o leigo segue as instruções do DEA, ninguém toca na análise e no choque,
          // e as compressões recomeçam logo depois.
          a: [
            'Liguei! Ele tá falando! "Aplique os eletrodos no peito do paciente"...',
            '[uma voz eletrônica: "Analisando o ritmo. Não toque no paciente."]',
            '[voz eletrônica: "Choque recomendado. Afaste-se."] TAÍS: Ninguém encosta! [{{um estalo seco|choque}}]',
            'TAÍS: Voltei a massagem! Um, dois, três...',
          ],
          onAsk: fx.set('d5_dea'),
        },
      ],
      links: [
        { a: 'nao_responde', b: 'manual:parada', insight: 'Não responde e não respira normalmente: parada cardíaca. USA + RCP guiada (Manual p.1).' },
        { a: 'gasping', b: 'manual:parada', insight: '"Puxando o ar de vez em quando" é respiração agônica, não respiração: parada (Manual p.1).' },
        { a: 'azia', b: 'manual:atipico', kind: 'confirma', insight: 'A "azia que não passava" de ontem pode ter sido o aviso: infarto sem dor clássica (Manual p.3).' },
      ],
      patient: { name: 'Marco Aurélio Teixeira', age: 48, sex: 'M' },
      truth: (c: Ctx) => ({
        dx: 'Parada cardiorrespiratória (fibrilação ventricular)',
        sev: 'vermelho',
        ok: ['USA'],
        risk: c.flag('d5_dea') ? { good: 45, bad: 100, guideBonus: 28 } : { good: 30, bad: 75, guideBonus: 28 },
      }),
      guide: { id: 'rcp' },
      radio: {
        ok: '{central}, {unit} no local. Fibrilação ventricular, dois choques, voltou pulso. Intubado. Descendo a escada com ele agora.',
        saved: (c: Ctx) =>
          c.flag('d5_dea')
            ? '{central}, {unit}. O DEA da academia já tinha chocado uma vez. A gente chocou mais duas e voltou. A menina da massagem não parou um segundo. Nem você, {dr}.'
            : '{central}, {unit}. Fibrilação, três choques e voltou. A aluna massageou até a gente subir a escada. Quem tava contando no telefone? Contou bonito.',
        dead: 'Central... {unit}. Quarenta minutos de reanimação. Óbito às {hora}. A aluna que massageou tá sentada na escada, não quer ir embora.',
        under: 'Central, {unit}! É parada! Iniciamos massagem, precisamos de USA agora!',
        dismissed: 'KELLY: {m:Moço|Moça}! Ninguém veio! A Taís não aguenta mais massagear! Ele tá morrendo!',
      },
      diary: {
        alive: 'Parada na esteira da academia. Uma aluna de enfermagem massageou até a gente chegar. Voltou.',
        dead: 'Parada na esteira da academia, aos 48 anos. Quarenta minutos de massagem.',
        later: [
          {
            day: 8,
            text: 'Teve alta do Regional. A academia comprou um DEA novo e pendurou a foto da aluna na recepção.',
            when: (c) => c.s.diary.some((d) => d.id === 'd05_academia' && d.kind === 'vivo'),
          },
        ],
      },
    }),
    // ------------------------------------------------------------------ 4
    call({
      id: 'd05_piscina',
      ref: 'D5 #4',
      at: '09:40',
      pool: 'pediatria,respiratorio',
      num: '(17) 3327-0980',
      caller: 'Dona Neusa (avó)',
      callerName: 'Dona Neusa',
      type: 'comum',
      voice: 'idosa',
      note: 'Criança tirada da piscina. Avó desesperada.',
      noteWrong: 'Criança afogada, não respira!',
      addr: { rua: 'Rua dos Expositores', n: 980, bairro: 'Parque das Exposições', ref: 'Clube Municipal, entrada pelo portão da piscina.' },
      amb: ['agua', 'choro', 'multidao'],
      open: [
        '{m:Moço|Moça}, meu neto caiu na piscina funda! Um rapaz pulou e tirou ele! Ele tá {{tossindo, tossindo|tosse}} e {{chorando muito|chorando}}!',
        '[{{choro forte de criança|choro_forte}}; gente em volta falando alto]',
      ],
      q: {
        oque: 'Eu virei pra pegar a toalha e ele correu pra piscina dos grandes. Quando eu olhei, ele tava lá no fundo.',
        inicio: 'Agora, faz uns cinco minutos.',
        consciencia: 'Tá acordado, chorando, me chamando de vó.',
        respira: 'Respira {{rapidinho, meio puxado|resp_rapida}}, e tosse, tosse.',
        idade: 'Quatro aninhos.',
        historico: 'Nada. É saudável. Bombinha não usa.',
        sangramento: 'Não.',
        paciente: ['[tosse forte]', 'ENZO: Vó... [choro] ...engoli água...'],
        referencia: 'Clube Municipal, entra pelo portão da piscina.',
        seguranca: 'Seguro. O salva-vidas só vem sábado, viu?',
      },
      extra: [
        {
          id: 'tempo_agua',
          label: 'Quanto tempo ficou embaixo?',
          say: 'Quanto tempo ele ficou embaixo d’água? Ele chegou a desmaiar, ficou molinho?',
          a: '{{Uns segundos... meio minuto?|segundos}} O rapaz disse que ele saiu se debatendo. Desmaiar, não desmaiou.',
        },
        { id: 'labios', label: 'Lábios e pele?', say: 'Como estão os lábios dele? Roxos? Pálido?', a: 'Tá {{rosadinho|rosado}}. Branquinho de susto, mas a boca tá rosa.' },
        { id: 'vomito', label: 'Vomitou?', say: 'Ele vomitou?', a: 'Vomitou um tanto de água agora. E tá {{tossindo sem parar|tosse_persiste}}.' },
        {
          id: 'aquecer',
          kind: 'fala',
          label: 'Orientar: secar e aquecer',
          say: 'Tira a roupa molhada, enrola ele numa toalha seca e deixa ele sentado no seu colo, de ladinho se for vomitar. Não dá nada pra beber.',
          // Conferido (campo A9: BT19/BPed26): tirar a roupa molhada, aquecer, posição lateral se vomitar.
          a: 'Tá, tá... enrolei. Ele tá agarrado em mim. Tá tossindo menos... mas ainda tá puxando o ar.',
        },
      ],
      links: [
        { a: 'tosse_persiste', b: 'manual:amarelo', insight: 'Afogamento sem perda de consciência, mas com tosse persistente e respiração rápida: precisa de avaliação e observação. Amarelo → USB.' },
        { a: 'chorando', b: 'segundos', kind: 'confirma', insight: 'Poucos segundos submerso, sem desmaio, chorando forte: não é parada. Não precisa de USA.' },
      ],
      worsen: [
        {
          after: 90,
          lines: ['DONA NEUSA: {m:Moço|Moça}... ele parou de chorar e tá ficando {{molinho, com sono|sonolento}}... tá puxando o ar com a barriga!'],
          truth: { dx: 'Afogamento com insuficiência respiratória', sev: 'vermelho', ok: ['USA'], risk: { good: 130, bad: 200 } },
        },
      ],
      patient: { name: 'Enzo Gabriel Martins', age: 4, sex: 'M' },
      // RT1: "dispneia aguda" (respira rápido e puxado, tosse que não para) é discriminador de USA; criança que
      // submergiu vai ao hospital mesmo sem sintoma (BPed26). Consciente, corada, poucos segundos sob a água: USB
      // preferida; USA ⚖ (antes era excesso).
      truth: { dx: 'Afogamento leve (quase afogamento), consciente', sev: 'amarelo', ok: ['USB', 'USA'], best: 'USB', risk: { good: 100, bad: 260, needs: 'USB' } },
      radio: {
        ok: 'Central, {unit}. Menino de 4 anos, saturando 93, chiado leve. Levando pra observação. A avó não larga a mão dele.',
        excess: '{central}, {unit} no local. Criança chorando forte, saturando bem, corado. Dava USB tranquilo, {dr}.',
      },
      diary: { alive: 'Afogamento na piscina do Clube Municipal, sexta-feira, sem salva-vidas. Observação de 24 horas.' },
    }),
    // ------------------------------------------------------------------ 5 ★ Cida
    call({
      id: 'd05_cida',
      ref: 'D5 #5 ★',
      at: '10:30',
      anchor: true,
      num: NUM.cida,
      caller: 'Dona Cida',
      callerName: 'Dona Cida',
      type: 'frequentador',
      voice: 'cida',
      note: 'Dona Cida. Leu o jornal hoje.',
      noteFixed: true,
      addr: ADDR.cida,
      amb: ['tv', 'passaros'],
      open: [
        'Oi, {meu} {filho}, é a Cida! Bom dia! Ó, eu li no jornal que {{tiraram duas ambulâncias|cortaram}}. É verdade?',
        '{{E se eu cair aqui sozinha, quem vem me buscar?|e_se_cair}}',
        '[TV: "...e a Marta entra na sala sem bater..."]',
      ],
      q: {
        oque: 'Nada não, {meu} {filho}. Só fiquei com medo da notícia. A pressão tá {{treze por oito|pressao_ok}}, medi agora no aparelhinho.',
        idade: 'Setenta e nove, graças a Deus.',
        consciencia: 'Acordadíssima. Tomei até café.',
        respira: 'Respiro. Ofegante só de subir a escadinha do quintal.',
        historico: 'Pressão. Tomo o remédio certinho. {{Hoje já tomei.|tomou}}',
        inicio: 'Desde que eu li o jornal, {meu} {filho}. O medo.',
        paciente: 'Sou eu mesma, uai!',
        sangramento: 'Sangue? Credo, não.',
        seguranca: 'Seguro. Só eu e o gato. O gato não conta.',
        referencia: 'Do lado da Igreja São Benedito, casa amarela, portão verde. Anota aí, vai que eu precise.',
      },
      extra: [
        {
          id: 'sintomas',
          label: 'Sente alguma coisa?',
          say: 'A senhora sente alguma coisa? Dor no peito, tontura, falta de ar?',
          a: ['Nada, nada. {{Tô ótima.|otima}}', 'Só a perna que {{falha de vez em quando no degrau do banheiro|degrau_banheiro}}. Coisa de velha.'],
        },
        {
          id: 'conversar',
          kind: 'fala',
          label: 'Conversar um pouco com ela',
          say: 'E a novela, Dona Cida? A Marta já descobriu tudo?',
          cost: 15,
          a: [
            'Ah, {meu} {filho}! A Marta descobriu que a filha não é filha! Eu chorei que nem boba.',
            'Sabe que eu {{costurava vestido de noiva pra fora|costurava}}? A Marta casou com um vestido igualzinho um que eu fiz em setenta e oito. Bordado à mão, {meu} {filho}. Pérola por pérola.',
            '[risada]',
            'Desculpa tomar seu tempo. É que a casa fica muito quieta.',
          ],
          onAsk: fx.all(fx.add('humanidade', 1, 'conversou com a Dona Cida'), fx.set('cida_conversou_d5')),
        },
        {
          id: 'tapete',
          kind: 'fala',
          label: 'Orientar: banheiro e telefone',
          say: 'Dona Cida, já que a senhora tocou no assunto: põe um tapete antiderrapante no banheiro e deixa o telefone sempre perto. Se cair, não levanta com pressa e me liga.',
          // Prevenção de queda (sem protocolo de regulação específico): tapete antiderrapante, telefone por perto,
          // não levantar com pressa depois de cair. Conselho seguro.
          a: 'Tapete de borracha? A Dirce da frente tem um. Vou pedir pra ela comprar na feira. Ai, {meu} {filho}, você fala igual o meu falecido. Ele cuidava de tudo.',
          onAsk: fx.set('cida_tapete'),
        },
      ],
      links: [
        { a: 'pressao_ok', b: 'manual:azul', insight: 'Pressão 13 por 8, já tomou o remédio, sem sintomas: não urgente. Orientação (Manual p.1).' },
        { a: 'e_se_cair', b: 'degrau_banheiro', kind: 'confirma', insight: 'Mora sozinha e a perna "falha no degrau do banheiro". Hoje é medo. Um dia pode não ser.' },
      ],
      onAnswer: fx.set('cida_ligou_d5'),
      patient: { name: 'Aparecida (Dona Cida)', age: 79, sex: 'F' },
      truth: { dx: 'Medo da notícia do corte (pressão normal)', sev: 'azul', ok: ['ORI'], ref: ['CASA', 'UBS'] },
      radio: { excess: '{central}, {unit} na casa da Dona Cida. Ela tá ótima, passou café pra equipe e perguntou se a gente viu a novela. Era só medo, {dr}. Medo de ficar sem a gente.' },
      diary: { ori: 'Leu sobre o corte das ambulâncias e ficou com medo. "E se eu cair aqui sozinha, quem vem me buscar?"' },
    }),
    // ------------------------------------------------------------------ 6
    call({
      id: 'd05_pedreiro',
      ref: 'D5 #6',
      at: '12:00',
      pool: 'grave,trauma_moderado',
      num: '(17) 99805-0640',
      caller: 'Seu Damião (mestre de obras)',
      callerName: 'Damião',
      type: 'testemunha',
      voice: 'homem',
      note: 'Queda de andaime numa obra.',
      noteWrong: 'Pedreiro caiu, mas disse que tá bem.',
      addr: { rua: 'Rua das Indústrias', n: 640, bairro: 'Distrito Industrial', ref: 'Obra do galpão novo, betoneira laranja na calçada.' },
      amb: ['maquina', 'rua', 'gritos'],
      open: [
        '{Dr}, o Gildásio caiu do andaime! Lá do {{segundo andar, uns seis metros|altura}}! Ele tá no chão falando que {{não sente as pernas|nao_sente}}!',
        '[betoneira ligada; alguém grita "desliga isso!"]',
      ],
      q: {
        oque: 'A tábua do andaime quebrou. Ele caiu de costas em cima do monte de tijolo.',
        consciencia: 'Tá acordado, falando, chorando de dor.',
        respira: 'Respira. Reclama que dói pra puxar o ar fundo.',
        idade: 'Trinta e sete.',
        inicio: 'Agorinha, cinco minutos.',
        sangramento: 'Ralou o braço, um corte na cabeça. Sangue pouco.',
        historico: 'Nada, é forte que nem um boi.',
        paciente: ['GILDÁSIO: Damião... eu não sinto... {{mexo o braço, mas a perna não vem|perna_nao_vem}}...', 'GILDÁSIO: Avisa a Rosilda... avisa minha mulher...'],
        seguranca: 'Seguro. Parei a obra. {{Os meninos querem pôr ele na caminhonete e levar|caminhonete}}, é mais rápido!',
        referencia: 'Obra do galpão novo, tem uma betoneira laranja na calçada.',
      },
      extra: [
        {
          id: 'mexer',
          label: 'Ele mexe as pernas? Sente?',
          say: 'Pede pra ele mexer os pés e os dedos dos pés. Ele consegue? Sente quando você encosta?',
          a: 'Gildásio, mexe o pé... [pausa] {{Não mexe. Nem sente eu apertando|sem_sensibilidade}}. O braço mexe.',
        },
        {
          id: 'nao_mover',
          kind: 'fala',
          label: 'Ninguém mexe nele',
          say: 'Ninguém mexe nele. Ninguém. Não põe na caminhonete, não senta, não dá água. Alguém segura a cabeça dele parada, do jeito que tá.',
          // Conferido (RT6: queda de altura + déficit neurológico agudo → USA; campo A13): não mover, cabeça parada.
          a: ['Tá, tá! Ô Neném, larga ele! {O} {dr} falou que não pode! [gritaria]', 'Tô segurando a cabeça dele. Ele tá me olhando assustado.'],
        },
      ],
      links: [
        { a: 'nao_sente', b: 'altura', insight: 'Queda de 6 metros com perda de sensibilidade nas pernas: trauma grave de coluna (raquimedular). Vermelho → USA. Não mover a vítima.' },
        { a: 'caminhonete', b: 'nao_sente', insight: 'Carregar na caminhonete pode transformar uma lesão de coluna em paralisia definitiva. Imobilização no local, USA.' },
        { a: 'altura', b: 'manual:vermelho', insight: 'Trauma grave por queda de altura: vermelho, USA (Manual p.1).' },
      ],
      patient: { name: 'Gildásio Damasceno', age: 37, sex: 'M' },
      truth: { dx: 'Trauma raquimedular (queda de 6 metros)', sev: 'vermelho', ok: ['USA'], risk: { good: 45, bad: 110, guideBonus: 15 } },
      guide: { id: 'queda_coluna' },
      radio: {
        ok: '{central}, {unit} no local. Trauma raquimedular, nível torácico. Prancha e colar. Ninguém tinha mexido nele: bom trabalho de telefone. Seguimos Regional.',
        under: 'Central, {unit}! Queda de altura, sem sensibilidade nas pernas, pressão caindo! Precisamos de USA!',
        dismissed: 'DAMIÃO: {Dr}, ninguém veio! Ele tá ficando branco, falando devagar! Os meninos tão querendo levar ele de qualquer jeito!',
      },
      diary: {
        alive: 'Queda de andaime, seis metros. Lesão de coluna. Ninguém mexeu nele até a prancha chegar.',
        dead: 'Queda de andaime, seis metros. Pediu pra avisar a mulher, a Rosilda.',
      },
    }),
    // ------------------------------------------------------------------ 7
    call({
      id: 'd05_asma',
      ref: 'D5 #7',
      at: '13:20',
      pool: 'respiratorio,moderado',
      num: '(17) 99347-1230',
      caller: 'Patrícia (a própria)',
      callerName: 'Patrícia',
      type: 'comum',
      voice: 'jovem_m',
      note: 'Moça com falta de ar. Asmática.',
      noteWrong: 'Moça nervosa, falta de ar. Parece ansiedade.',
      addr: { rua: 'Rua das Mangueiras', n: 1230, bairro: 'Jardim Primavera', ref: 'Prédio Ipanema, apartamento 104, no térreo.' },
      amb: ['respiracao', 'ventilador'],
      open: [
        'Oi... eu tenho asma... {{tô com crise desde cedo|crise}}.',
        '[chiado audível a cada respiração]',
        'Usei a bombinha {{três vezes|tres_vezes}}... {{melhorou um pouco|melhorou_pouco}}, mas não passa.',
      ],
      q: {
        oque: 'Tava limpando o armário... a poeira... [puxa o ar] ...e foi fechando.',
        respira: '{{Tá chiando|chiando}}... [puxa o ar] ...mas entra ar. Tô sentada, inclinada pra frente.',
        consciencia: 'Acordada. Bem acordada. Assustada.',
        idade: 'Trinta e quatro.',
        inicio: 'Desde as nove. Piorou agora depois do almoço.',
        historico: 'Asma desde criança. Internei duas vezes quando era pequena. Faz anos que não tinha crise assim.',
        paciente: 'Sou eu mesma.',
        sangramento: 'Não.',
        seguranca: 'Sozinha em casa. A porta tá destrancada, deixei aberta.',
        dorpeito: 'Aperta o peito, mas é do chiado. Não vai pro braço.',
      },
      extra: [
        {
          id: 'frases',
          label: 'Fala frases inteiras?',
          say: 'Você consegue me falar uma frase inteira, sem parar pra respirar?',
          a: '{{"Meu nome é Patrícia e eu moro na Mangueiras"...|frases}} [chiado] ...viu? Consigo. Cansa, mas consigo.',
        },
        { id: 'labios', label: 'Lábios e unhas?', say: 'Olha no espelho: os lábios e as unhas estão roxos?', a: '{{Tá normal. Rosa.|labios_ok}} Meio pálida.' },
        {
          id: 'sono',
          label: 'Sonolência? Peito afundando?',
          say: 'Você está com sono, confusa? O pescoço ou as costelas afundam quando você puxa o ar?',
          a: 'Sono não, tô é elétrica. Afunda um pouquinho embaixo da costela.',
        },
        {
          id: 'bombinha_orient',
          kind: 'fala',
          label: 'Orientar bombinha e posição',
          say: 'Fica sentada, inclinada pra frente, roupa frouxa. Repete a bombinha do jeito que o seu médico receitou para crise, e não deita.',
          // Conferido (RC3; campo A15): sentada, broncodilatador conforme a receita de crise. Fala frases inteiras e
          // melhorou pouco com a medicação → "sem melhora com a medicação habitual" = USI/USB.
          a: 'Tá... sentada... [chiado] ...repeti. Tô contando devagar. Melhorou... um tiquinho.',
        },
      ],
      links: [
        { a: 'frases', b: 'manual:asma_mod', insight: 'Fala frases completas, lábios normais, melhorou um pouco com a bombinha: asma moderada. Amarelo → USB (Manual p.5-B).' },
        { a: 'melhorou_pouco', b: 'chiando', kind: 'confirma', insight: 'Chiado presente e melhora parcial com a bombinha: o ar ainda entra. Não é tórax silencioso.' },
        { a: 'nao_fala', b: 'manual:torax_silencioso', insight: 'O chiado sumiu e ela não consegue mais falar: não é melhora, é tórax silencioso. Vermelho → USA (Manual p.5-B).' },
      ],
      worsen: [
        {
          after: 85,
          lines: ['[o chiado some de repente]', 'PATRÍCIA: ...não... {{tô... conseguindo... falar|nao_fala}}...', '[silêncio; só um assobio fraquinho]'],
          truth: { dx: 'Crise de asma grave (tórax silencioso)', sev: 'vermelho', ok: ['USA'], risk: { good: 140, bad: 210 } },
        },
      ],
      patient: { name: 'Patrícia Sampaio', age: 34, sex: 'F' },
      truth: { dx: 'Crise de asma moderada', sev: 'amarelo', ok: ['USB'], risk: { good: 110, bad: 280, needs: 'USB' } },
      radio: {
        ok: 'Central, {unit}. Asmática, saturando 91, sibilos difusos, falando frases. Nebulizando. Seguimos.',
        excess: '{central}, {unit}. Asma moderada, falando, saturação boa. A USB dava conta, {dr}.',
      },
      diary: { alive: 'Crise de asma limpando o armário. Moderada: falava frases, lábios normais.' },
    }),
    // ------------------------------------------------------------------ 8
    call({
      id: 'd05_trote',
      ref: 'D5 #8',
      at: '14:40',
      pool: 'trote',
      num: '(17) 99733-5150',
      caller: 'Voz de criança',
      type: 'trotista',
      voice: 'crianca',
      note: 'Criança. Diz que a professora desmaiou.',
      noteWrong: 'Criança chorando. Professora desmaiada na sala.',
      addr: { rua: 'Rua Ipê', n: 901, bairro: 'Jardim Norte', ref: 'Escola Estadual Prof. Aurélio Matos.' },
      amb: ['escola', 'risadas'],
      open: [
        'Alô? É da ambulância? {{A professora caiu no chão e não acorda!|professora}}',
        '[{{risadinhas de várias crianças|risadinhas}}; alguém sussurra "fala que tá sangrando!"]',
        'Ela tá... ela tá sangrando! Muito!',
      ],
      q: {
        oque: 'Ela tava escrevendo na lousa e caiu! Pum! [risadinha]',
        consciencia: '{{Não acorda... quer dizer, acordou, mas desmaiou de novo!|cons_confusa}}',
        respira: 'Respira pelo nariz! [risadas abafadas]',
        idade: 'Ela é velha. Uns... cem anos?',
        sangramento: 'Sangue pra todo lado! Vermelho!',
        paciente: ['[sussurros] "fala você!" "não, fala você!"', '[risadas]'],
        referencia: 'Na escola Aurélio Matos. Na sala do quarto ano B.',
        seguranca: 'Seguro, seguro.',
        historico: 'Ela é brava. [risada]',
      },
      extra: [
        {
          id: 'adulto',
          label: 'Chamar um adulto',
          say: 'Chama um adulto aí perto pra falar comigo, por favor.',
          a: ['[{{o sinal da escola toca|sinal}}]', 'VOZ DE ADULTO: Quem é que tá com celular na minha sala?!', '[o telefone é abafado; correria; uma porta batendo]'],
        },
      ],
      callback: ['[toca... toca...]', 'PROFESSORA: Alô? ...Regulação?! {{Esse celular é de um aluno, tava escondido na mochila|retorno_professora}}. Ninguém desmaiou aqui, {dr}. Eu estou ótima e muito brava. Desculpa.'],
      links: [
        { a: 'professora', b: 'risadinhas', insight: 'Relato grave com risadinhas de várias crianças e alguém soprando o que dizer: sinais de trote (Manual p.2).' },
        { a: 'cons_confusa', b: 'manual:trote_sinais', insight: '"Não acorda... acordou... desmaiou de novo": o relato muda a cada frase.' },
        { a: 'retorno_professora', b: 'num', insight: 'Ligar de volta: atende a própria professora "desmaiada". O celular é de um aluno.' },
      ],
      patient: { name: '"Professora desmaiada"' },
      truth: { dx: 'Trote (alunos com celular na sala)', sev: 'trote', ok: ['TROTE'], prankKind: 'trote' },
      radio: { prank: 'Central, {unit} na escola Aurélio Matos. A professora do 4º B tá ótima e furiosa. Achou o celular na mochila. Era trote.' },
    }),
    // ------------------------------------------------------------------ 9
    call({
      id: 'd05_benedita',
      ref: 'D5 #9',
      at: '15:50',
      pool: 'moderado',
      num: '(17) 3322-6610',
      caller: 'Sônia (vizinha)',
      callerName: 'Sônia',
      type: 'comum',
      voice: 'mulher',
      note: 'Vizinha. Idosa fraquinha, sem comer.',
      noteWrong: 'Vizinha preocupada. Idosa com fastio, nada urgente.',
      addr: { rua: 'Rua Quaresmeira', n: 980, bairro: 'Bela Vista', ref: 'Casa de muro baixo, com uma santinha no portão.' },
      amb: ['ventilador', 'radio_am'],
      open: [
        'Boa tarde... eu sou vizinha da Dona Benedita. Ela tá {{fraquinha, deitada, faz dois dias que não come|nao_come}}. Eu trouxe sopa e ela não quis.',
        'BENEDITA: Não precisa, Sônia... {{eu tenho oitenta e seis anos e nunca precisei de ambulância|nunca_precisou}}...',
      ],
      q: {
        oque: 'Ela mora sozinha. Eu passei hoje e ela tava na cama, a cozinha intacta, o pão de anteontem fechado no saquinho.',
        consciencia: ['Tá acordada, responde. Mas {{agora há pouco me chamou de Lurdinha, que era a irmã dela|confusa}}.', 'Ela não confunde nada, {dr}. Faz palavra cruzada todo dia.'],
        respira: 'Respira normal, só cansadinha.',
        idade: 'Oitenta e seis.',
        inicio: 'Desde quarta. Com esse calor.',
        historico: ['Pressão. Toma remédio de pressão e {{um de fazer xixi, pra perna inchada|diuretico}}.', 'Tá aqui a caixinha.'],
        sangramento: 'Não.',
        paciente: ['BENEDITA: Tô bem, {m:moço|moça}... só fraca... a boca tá {{seca que nem papel|boca_seca}}...'],
        seguranca: 'Tranquilo.',
      },
      extra: [
        {
          id: 'xixi',
          label: 'Bebeu água? Urinou?',
          say: 'Ela tem bebido água? Quando foi a última vez que ela urinou?',
          a: 'Água quase nada, ela diz que não sente sede. {{Xixi... desde ontem ela não vai no banheiro|sem_urina}}.',
        },
        {
          id: 'levantar',
          label: 'Consegue sentar ou levantar?',
          say: 'Ela consegue sentar ou ficar de pé sem tontura?',
          a: 'Tentei sentar ela e ela {{ficou branca e quase caiu pra trás|tontura}}.',
        },
        {
          id: 'agua',
          kind: 'fala',
          label: 'Orientar enquanto espera',
          say: 'Deixa ela deitada num lugar fresco. Se ela estiver bem acordada e engolindo direito, oferece água ou soro aos golinhos. Não força.',
          // Conferido (RC11: sinais de desidratação → USI/USB): líquido pela boca só se acordada e engolindo bem.
          a: 'Golinho... ela tomou dois golinhos. Disse que tá gostoso. Coitada, tava seca, {dr}.',
        },
      ],
      links: [
        { a: 'confusa', b: 'manual:amarelo', insight: 'Idosa que não come nem bebe há dois dias, confusa e com tontura ao sentar: desidratação. Amarelo → USB.' },
        { a: 'sem_urina', b: 'diuretico', insight: 'Diurético no calor, sem beber e sem urinar desde ontem: desidratação de verdade, não fastio.' },
        { a: 'nunca_precisou', b: 'doc:peixoto_pai', kind: 'confirma', insight: '"Nunca precisei de ambulância", igual ao pai do Peixoto. Nunca ter precisado não é diagnóstico: é só o dia que ainda não tinha chegado.' },
      ],
      patient: { name: 'Benedita Alves', age: 86, sex: 'F' },
      truth: { dx: 'Desidratação em idosa (calor e diurético)', sev: 'amarelo', ok: ['USB'], risk: { good: 120, bad: 320, needs: 'USB' } },
      radio: {
        ok: 'Central, {unit}. Dona Benedita, 86, desidratada, pressão 9 por 5. Hidratando.',
        excess: '{central}, {unit}. Desidratação, estável, conversando. Dava USB, {dr}.',
      },
      diary: {
        alive: 'Desidratada, sozinha em casa, aos 86. "Nunca precisei de ambulância."',
        later: [
          { day: 6, text: 'Ficou em casa com o termo assinado. Ligou de madrugada para o noturno, confusa. Foi internada.', when: is.flag('d5_benedita_termo') },
          { day: 7, text: 'Teve alta. Mandou dizer que gostou "da voz do rádio".', when: is.flag('d5_benedita_radio') },
          { day: 7, text: 'Teve alta. Contou pra vizinha que foi "sequestrada pela ambulância" e que a comida do hospital é boa.', when: is.flag('d5_benedita_levada') },
        ],
      },
    }),
  ],
  // 19:00 — o painel fecha o dia. Grava d5_meta_batida (lido no D16/D18).
  endScene: (c) => {
    const sh = c.s.shift;
    const met = !!sh?.goalMet;
    const suja = !!sh?.flags['metaSuja'];
    const usa = sh?.usaSent ?? 0;
    return {
      id: 'd05_painel',
      bg: 'central',
      cast: ['PEIXOTO', 'SIMONE'],
      nodes: {
        start: {
          onEnter: (e) => {
            if (e.s.shift?.goalMet) e.set('d5_meta_batida');
            if (e.s.shift?.goalMet && e.s.shift.flags['metaSuja']) e.set('d5_meta_suja');
          },
          lines: [
            { who: 'NARRADOR', t: '19:00. O monitor da Saúde+ Gestão pisca o resultado do dia em letras grandes.' },
            met
              ? { who: 'PEIXOTO', t: `${usa === 1 ? 'Uma USA' : usa === 0 ? 'Nenhuma USA' : usa + ' USA'}, {dr}! Primeiro dia de corte e a central no verde. Vou mandar print pra diretoria. Isso é gestão.` }
              : { who: 'PEIXOTO', t: `${usa} USA, {dr}. O rostinho ficou bravo. ...Tudo bem. Primeiro dia, ninguém acerta a mão.` },
            met && suja
              ? { who: 'SIMONE', t: '(desligando o fone, sem olhar pra você) Trinta reais. Eu vi as fichas, {dr}.' }
              : met
                ? { who: 'SIMONE', t: 'Bateu a meta sem errar ninguém? Então foi a fila que segurou as USA, {dr}. Olha o que ficou pro noturno.' }
                : { who: 'SIMONE', t: 'O rostinho ficou bravo. O meu ficou feliz. Boa noite, {dr}.' },
          ],
          choices: [
            { label: '"Eu mandei USA pra quem precisava, Peixoto."', next: 'resposta', when: () => !met },
            { label: '(Desligar o monitor do painel.)', next: 'monitor' },
          ],
        },
        resposta: {
          lines: [
            { who: 'PEIXOTO', t: 'Eu sei, {dr}. Eu sei. Lá em cima ninguém pergunta quem precisava. Pergunta quantas.' },
            { who: 'NARRADOR', t: 'Ele sai sem bater a porta. Pela primeira vez, ele parece cansado.' },
          ],
        },
        monitor: {
          lines: [{ who: 'NARRADOR', t: 'O rostinho apaga. No reflexo da tela preta, quem olha de volta é você, com doze horas a mais na cara.' }],
        },
      },
    };
  },
  interlude: {
    teaser: 'Primeiro dia de corte. Em casa, o Liam está acordado esperando você.',
    familyLacos: 1,
    scene: (c) => {
      const rec = c.s.history[c.s.history.length - 1];
      const morto = rec?.report.find((r) => r.outcome === 'obito' && r.verdict !== 'noturno');
      const nomeMorto = morto ? morto.name.split(',')[0].replace(/"/g, '') : '';
      return {
        id: 'd05_cara',
        bg: 'sala',
        cast: ['DAVI', 'LUCIA', 'ZELIA'],
        nodes: {
          start: {
            lines: [
              { who: 'NARRADOR', t: 'Nove e pouco da noite. {Oconj} corta um molde de papel na mesa da sala. O Liam, de pijama, deveria estar dormindo faz uma hora.' },
              { who: 'DAVI', t: '{Pai}... por que você chega em casa com cara de quem chorou?' },
              { who: 'ZELIA', t: '(da cozinha) Ih. Pergunta difícil, essa.' },
            ],
            choices: [
              { label: '"Porque hoje teve gente que eu não consegui ajudar."', next: 'verdade', effect: fx.all(fx.set('d5_resposta_davi', 'verdade'), fx.add('lacos', 1, 'falou a verdade pro Liam')) },
              { label: '"É o ar-condicionado da central, filho. Resseca o olho."', next: 'ar', effect: fx.set('d5_resposta_davi', 'ar') },
              { label: '(Puxar o Liam pro colo, sem dizer nada.)', next: 'abraco', affectionate: true, effect: fx.all(fx.set('d5_resposta_davi', 'abraco'), fx.add('lacos', 1, 'abraçou o Liam')) },
            ],
          },
          verdade: {
            lines: [
              { who: 'DAVI', t: 'Quem você não conseguiu ajudar?' },
              nomeMorto
                ? { who: 'EU', t: `Hoje morreu uma pessoa, filho. ${nomeMorto}. Eu não consegui chegar a tempo.` }
                : { who: 'EU', t: 'Hoje ninguém morreu, filho. Mas teve uma hora que eu tive que escolher quem recebia a ambulância grande primeiro. E eu não gosto de escolher.' },
              { who: 'DAVI', t: '(pensa um pouco) Então amanhã você ajuda mais um. Pra compensar.' },
              { who: 'LUCIA', t: '(sem tirar os olhos do molde, com a voz embargada) Vai deitar, Liam. {Pai} tá {cansado}.' },
            ],
            next: 'fim',
          },
          ar: {
            lines: [
              { who: 'DAVI', t: '...Ah.' },
              { who: 'ZELIA', t: '(da cozinha) Ar-condicionado. Na minha época o nome disso era outro.' },
              { who: 'NARRADOR', t: 'O Liam vai deitar. Na porta do quarto, ele olha pra trás, como quem guarda a resposta pra conferir depois.' },
            ],
            next: 'fim',
          },
          abraco: {
            lines: [
              { who: 'NARRADOR', t: 'Ele ainda cabe inteiro no seu colo. Por pouco tempo. Cheira a sabonete e a lápis de cor.' },
              { who: 'DAVI', t: '(abafado) Você tá apertando muito, {pai}.' },
              { who: 'LUCIA', t: 'Deixa, Liam. Deixa apertar.' },
            ],
            next: 'fim',
          },
          fim: {
            lines: [
              { who: 'NARRADOR', t: 'Mais tarde, no celular, o extrato do dia: "Bônus — meta de eficiência: R$ 30". Você apaga a notificação antes que {oconj} veja.', when: is.flag('d5_meta_batida') },
              { who: 'NARRADOR', t: 'Você sabe exatamente de qual ficha saíram esses trinta reais.', when: is.flag('d5_meta_suja') },
              { who: 'NARRADOR', t: 'A casa apaga as luzes uma por uma. A última é a da sala, onde {oconj} ainda corta o molde.', when: is.not('d5_meta_batida') },
            ],
          },
        },
      };
    },
    bico: {
      id: 'd05_bico',
      bg: 'cozinha',
      cast: ['LUCIA'],
      nodes: {
        start: {
          onEnter: fx.set('d5_resposta_davi', 'lucia'),
          lines: [
            { who: 'NARRADOR', t: 'Você liga avisando que vai emendar a noite na ambulância, logo depois de doze horas de telefone.' },
            { who: 'NARRADOR', t: 'Quando você chega, de madrugada, {oconj} está {c:acordada|acordado} na cozinha, com a costura no colo.' },
            { who: 'LUCIA', t: 'O Liam esperou você até as dez. Perguntou por que você chega com cara de quem chorou.' },
            { who: 'LUCIA', t: 'Eu disse que era o ar-condicionado da central.' },
            { who: 'LUCIA', t: '...Ele não acreditou. Ele é seu filho.' },
          ],
        },
      },
    },
  },
});
