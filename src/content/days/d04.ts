// =============================================================================
// DIA 4 — "Cena Quente" (Manual p.4: cena insegura — PM junto com a viatura)
// Fios: 🌱 Dona Cida "costurava pra fora" (→ máquina, D13) · 🌱 máquina de
// costura da Lúcia · primeiro pedido de rádio de mão dupla ("cena ficou hostil")
// · ↺ Bené (promessa da passagem de turno) · ↺ Antônio (manchete do jornal).
// =============================================================================
import type { Ctx, ShiftScriptCtx, TimelineOption } from '../../engine/types';
import type { DeskDoc, GuideScript } from '../../engine/content-api';
import { hm } from '../../engine/util';
import { day, call, fx, is, NUM, ADDR } from '../dsl';

const saud = (c: Ctx) => {
  const t = c.s.shift?.time ?? 8 * 60;
  return t < 12 * 60 ? 'Bom dia' : t < 18 * 60 ? 'Boa tarde' : 'Boa noite';
};
const diaryKind = (c: Ctx, id: string) => c.s.diary.find((d) => d.id === id)?.kind;
const TIRO = 'd04_tiro';

export const DOCS_EXTRA: Record<string, DeskDoc> = {
  jornal_d04: {
    id: 'jornal_d04',
    title: 'Gazeta de Santa Aurora (quinta-feira)',
    text: 'Recortes da página 5: "TERRENO BALDIO VIRA LIXÃO — O terreno da Rua Pitangueira, 2950, no Parque das Exposições, acumula entulho há dois anos. Não há construção no local. Moradores reclamam de ratos e escorpiões." / "BAR DO NENO, TERCEIRA BRIGA DO MÊS — O bar da Rua Pará, 1350, em frente ao portão 2 da usina, abre às seis para quem sai do turno da noite."',
    until: 4,
    clues: [
      { id: 'doc:terreno_baldio', text: 'Jornal: Rua Pitangueira, 2950 é um TERRENO BALDIO — entulho, sem nenhuma construção' },
      { id: 'doc:bar_neno', text: 'Jornal: Bar do Neno (Rua Pará, 1350) — terceira briga do mês' },
    ],
  },
};

// Conferido: segurança de quem liga primeiro e PM junto (Manual p.4; Regimento da central, Art. 15–18: "segurança
// de cena" é o primeiro dos 3S da segurança da equipe); compressão direta
// com pano limpo (campo A5: AP19/BP8). Torniquete improvisado com fio fino é errado: o protocolo pede faixa
// larga (≥10 cm), só por profissional, depois de a compressão falhar. Escorpião: sem torniquete, sem "simpatia",
// lavar, compressa morna para a dor, nada pela boca se vomita, lateral (campo A12: BTox13; USP, acidentes
// escorpiônicos: vômito e sudorese em criança = moderado/grave, soro).
export const GUIDES_EXTRA: Record<string, GuideScript> = {
  cena_insegura: {
    id: 'cena_insegura',
    title: 'Orientação: cena com arma',
    kind: 'dialogo',
    intro: 'A segurança de quem liga vem primeiro. Ninguém vira herói: abaixado, longe da porta, e só ajuda a vítima se der sem se expor.',
    panic: 75,
    steps: [
      {
        say: 'Ele ainda tá lá fora, {dr}! Tá andando de um lado pro outro com o revólver na mão!',
        options: [
          { label: 'Fique abaixado atrás do balcão, longe da porta e das janelas. Não saia e não chame a atenção dele.', kind: 'certo' },
          { label: 'Vai lá e tenta conversar com ele, acalmar.', kind: 'errado', reply: 'Eu não vou sair, não, {dr}! {m:Tá maluco|Tá maluca}?' },
          { label: 'Respira. Eu fico com você na linha o tempo todo.', kind: 'calma' },
        ],
      },
      {
        say: 'O Josué tá gemendo aqui do lado, tá saindo muito sangue da perna dele!',
        options: [
          { label: 'Se ele estiver ao seu alcance sem você se levantar: pano limpo em cima do ferimento e aperte forte.', kind: 'certo' },
          { label: 'Arrasta ele pra calçada pra ambulância achar mais rápido.', kind: 'errado', reply: 'Pra calçada?! O cara tá na calçada!' },
          { label: 'Amarra o fio da TV bem apertado na perna.', kind: 'errado', reply: 'O fio? Tô apertando com o pano mesmo, {dr}...' },
        ],
      },
      {
        say: '[sirene ao longe] ...Ele correu! O cara correu pro beco!',
        options: [
          { label: 'Continue abaixado e apertando. Ele pode voltar. Só abra quando a polícia ou a equipe disserem que é seguro.', kind: 'certo' },
          { label: 'Corre atrás pra ver pra onde ele foi.', kind: 'errado', reply: 'Eu? Eu não!' },
          { label: 'Você está indo muito bem.', kind: 'calma' },
        ],
      },
      {
        say: 'Tem gente de colete aí na porta mandando abrir...',
        options: [
          { label: 'Abra só quando eles se identificarem. Mantenha a pressão no ferimento até a equipe assumir.', kind: 'certo' },
          { label: 'Pode soltar o pano e ir lavar a mão.', kind: 'errado', reply: 'Soltei... voltou a sangrar!' },
        ],
      },
    ],
    success: 'Ninguém mais se feriu e o sangramento ficou contido até a equipe entrar.',
    fail: 'A cena foi um caos. A equipe entrou com a vítima ainda sangrando muito.',
  },
  escorpiao: {
    id: 'escorpiao',
    title: 'Orientação: picada de escorpião',
    kind: 'dialogo',
    intro: 'Criança pequena com vômito depois da picada é caso grave. Oriente o que fazer — e principalmente o que NÃO fazer — enquanto a viatura vai.',
    panic: 75,
    steps: [
      {
        say: 'A vizinha falou pra amarrar a perna dela com um pano pro veneno não subir!',
        options: [
          { label: 'Não amarre nada. Não corte, não chupe, não passe nada no lugar da picada.', kind: 'certo' },
          { label: 'Amarra bem apertado acima do joelho.', kind: 'errado', reply: 'Ela tá gritando mais ainda, {m:moço|moça}!' },
          { label: 'Calma. Eu vou te dizer o que fazer até a ambulância chegar.', kind: 'calma' },
        ],
      },
      {
        say: 'E agora? Ponho alho? Café? A minha mãe falava de querosene...',
        options: [
          { label: 'Nada disso. Só lave com água e sabão. Um pano morno em cima ajuda na dor.', kind: 'certo' },
          { label: 'Passa um pouco de alho amassado.', kind: 'errado', reply: 'Ficou vermelho e ela tá chorando mais...' },
          { label: 'Fica do lado dela, conversando.', kind: 'calma' },
        ],
      },
      {
        say: 'Ela vomitou de novo... tá suando, babando, tremendo.',
        options: [
          { label: 'Deite de lado, com a cabeça virada, para não engasgar com o vômito. Não dê nada pela boca.', kind: 'certo' },
          { label: 'Dá água com açúcar pra ela se acalmar.', kind: 'errado', reply: 'Ela vomitou a água toda!' },
          { label: 'Ela vai receber o soro no hospital. A equipe está indo.', kind: 'calma' },
        ],
      },
      {
        say: 'O bicho tá aqui num pote, eu matei com o chinelo. Levo?',
        options: [
          { label: 'Leve o pote fechado para a equipe, sem pegar com a mão. Ajuda o hospital.', kind: 'certo' },
          { label: 'Joga fora, não precisa.', kind: 'neutro' },
        ],
      },
    ],
    success: 'Nada de torniquete nem de "simpatia". A Lara chegou de lado, respirando, e o soro foi preparado antes dela entrar.',
    fail: 'A orientação teve falhas. A Lara chegou pior do que precisava.',
  },
};

/** pedido de rádio "cena hostil": sai quando a equipe do bar chega ao local */
function cenaHostil(c: ShiftScriptCtx) {
  if (c.sflag('hostil_feito')) return;
  const rt = c.callStatus(TIRO);
  const d = rt?.decision;
  const uid = d && (d.resource === 'USA' || d.resource === 'USB') ? rt?.units[0] : undefined;
  const u = uid ? c.shift.units[uid] : undefined;
  if (!rt || !u) {
    if (c.now < hm('16:30')) c.schedule(c.now + 10, 'cena_hostil');
    return;
  }
  if (u.status === 'DESLOC' && u.callId === rt.id) {
    c.schedule(Math.max(c.now + 1, u.t1 + 2), 'cena_hostil');
    return;
  }
  // só faz sentido com a equipe parada na porta do bar; se já saiu de lá, o momento passou
  if (u.status !== 'LOCAL' || u.callId !== rt.id) return;
  c.sflag('hostil_feito', true);
  const chamado = u.id === 'USA01' ? '{bene}' : 'Central';
  const comPM = d!.support.includes('PM');
  const opts: TimelineOption[] = comPM
    ? [
        {
          id: 'recuar',
          label: 'Recuar e só entrar quando a PM liberar a cena',
          reply: `${u.label}: entendido, recuamos. ...Cinco minutos. A PM dispersou a turma e liberou. Entramos. A vítima tá com a gente.`,
          effect: (s) => {
            s.set('d4_pm_ok');
            if (u.id === 'USA01') s.add('intimBene', 1, 'o Bené confia em você');
          },
        },
        { id: 'reforco', label: 'Pedir reforço da PM ao COPOM (3 min)', cost: 3, reply: 'Entendido, Central. O COPOM mandou mais duas viaturas da PM. Cena controlada, entramos. A vítima tá com a gente.', effect: (s) => s.set('d4_pm_ok') },
        {
          id: 'entrar',
          label: 'Mandar a equipe entrar e tirar a vítima de uma vez',
          reply: `${u.label}: ...entramos. Voou garrafa. O enfermeiro levou um corte na cabeça, mas a vítima tá com a gente.`,
          effect: (s) => {
            s.unset('d4_pm_ok');
            s.set('d4_equipe_ferida');
            s.add('intimBene', -2, 'mandou a equipe entrar na cena quente');
            s.add('desgaste', 3, 'equipe ferida');
          },
        },
      ]
    : [
        { id: 'pm', label: 'Acionar a PM agora e manter a equipe recuada', reply: 'Entendido, Central. O COPOM avisou: PM em oito minutos. A gente segura aqui na esquina, ouvindo o homem gritar lá dentro.', effect: (s) => s.set('d4_pm_tardia') },
        {
          id: 'entrar',
          label: 'Mandar a equipe entrar assim mesmo',
          reply: `${u.label}: ...a gente entrou. Ele atirou pro alto, a equipe se jogou no chão. Tiramos a vítima arrastada. Ninguém mais se feriu. Dessa vez.`,
          effect: (s) => {
            s.set('d4_equipe_ferida');
            s.add('intimBene', -2, 'mandou a equipe entrar na cena quente');
            s.add('desgaste', 5, 'equipe exposta a tiro');
          },
        },
      ];
  const text = comPM
    ? `${chamado}, ${u.label}. Cena ficou hostil: o atirador correu pro beco, mas a turma dele voltou e tá cercando a porta do bar, xingando a PM. A vítima ainda tá lá dentro, a dez metros. Entramos agora ou esperamos a PM limpar?`
    : `${chamado}, ${u.label}. A gente tá atrás da viatura, na esquina. A vítima tá sangrando lá dentro, o dono do bar gritando, e o cara anda de um lado pro outro na calçada com o revólver. O que a gente faz?`;
  c.request(u.radioName, text, opts, comPM ? 'recuar' : 'pm', 6);
}

export const DAY = day({
  day: 4,
  title: 'Cena Quente',
  weekday: 'Quinta-feira',
  weather: 'Seco e quente, 35 °C. Cheiro de queimada no fim da tarde.',
  onStart: fx.doc('jornal_d04'),
  newspaper: (c) => {
    const ant = c.key('antonio');
    const conc = diaryKind(c, 'd03_conceicao');
    const nilton = diaryKind(c, 'd03_atropelamento');
    const head =
      ant === 'salvo'
        ? c.flag('antonio_parou')
          ? { headline: '"Achei que era o feijão": pedreiro para no chão da cozinha e volta com dois choques', sub: 'Antônio Ferreira, 58, da Vila Nova, teve um infarto em casa. A esposa fez massagem cardíaca orientada pelo telefone até a UTI móvel chegar.', photo: 'hospital' }
          : { headline: '"Achei que era o feijão": pedreiro infarta em casa e é salvo a tempo', sub: 'Antônio Ferreira, 58, da Vila Nova, ligou para a emergência "pedindo desculpa pelo incômodo". Passou por cateterismo no Regional e passa bem.', photo: 'hospital' }
        : ant === 'perdido'
          ? { headline: 'Pedreiro morre de infarto em casa; "ele achou que era o feijão", diz a esposa', sub: 'Antônio Ferreira, 58, da Vila Nova, deixa esposa e uma filha. "Ele nunca quis incomodar ninguém."', photo: 'casa' }
          : { headline: 'Bar do Neno tem a terceira briga do mês; moradores pedem policiamento', sub: 'Estabelecimento em frente à usina abre às seis da manhã para quem sai do turno da noite.', photo: 'bar' };
    const stories: { title: string; text: string }[] = [];
    if (conc === 'vivo') stories.push({ title: 'Infarto sem dor', text: 'Conceição Lopes, 67, diabética, sentiu "só um cansaço" estendendo roupa. Era infarto. Cardiologista do Regional alerta: em mulheres e diabéticos, o coração muitas vezes não dói.' });
    else if (conc === 'morto') stories.push({ title: 'Falecimento', text: 'Conceição Aparecida Lopes, 67, da Vila Esperança. Morreu sentada no banquinho do varal. A vizinha, Dona Neusa, recolheu a roupa.' });
    if (nilton) stories.push({ title: 'Atropelador da Santos Dumont segue foragido', text: nilton === 'morto' ? 'O jornaleiro Nilton Araújo, 61, morreu após ser atingido na faixa de pedestres. O motorista não parou. A banca amanheceu fechada, com flores na porta.' : 'O jornaleiro Nilton Araújo, 61, segue internado no Regional. O motorista que o atingiu na faixa não parou. A banca reabriu, tocada pela neta.' });
    stories.push({ title: 'Terreno baldio vira lixão no Parque das Exposições', text: 'O terreno da Rua Pitangueira, 2950, acumula entulho há dois anos. Não há construção no local, só ratos e escorpiões. A prefeitura diz que "a limpeza está no cronograma".' });
    if (ant !== undefined) stories.push({ title: 'Bar do Neno: terceira briga do mês', text: 'O bar da Rua Pará, em frente ao portão 2 da usina, abre às seis para quem sai do turno da noite. Moradores pedem policiamento. A PM diz que "faz rondas".' });
    return {
      ...head,
      stories: stories.slice(0, 4),
      notice: 'Nova página no Manual: p.4 — Cena insegura. Violência em andamento: PM junto com a viatura.',
      ad: 'BAZAR DO SEU TIÃO — máquinas de costura usadas, revisadas, a partir de R$ 450. Aceitamos sua máquina velha como parte do pagamento.',
      weather: 'Seco · 35 °C',
    };
  },
  handover: () => ({
    id: 'd04_passagem',
    bg: 'central',
    nodes: {
      start: {
        lines: [
          { who: 'NARRADOR', t: '07:00. Um senhor grisalho de macacão azul está encostado na porta da central, segurando um copo de café. O crachá diz: BENEDITO — USA 01.', when: is.not('fez_intervencao') },
          { who: 'BENE', t: 'Então {m:esse é o doutor|essa é a doutora} da voz. Bené, da 01. Vim buscar o crachá novo e conhecer a cara de quem me manda pra rua.', when: is.not('fez_intervencao') },
          // quem já fez plantão extra na ambulância já conhece o Bené
          { who: 'NARRADOR', t: '07:00. O Seu Bené está encostado na porta da central, de macacão azul, com dois copos de café. Um deles é seu.', when: is.flag('fez_intervencao') },
          { who: 'BENE', t: '{O} {dr} da madrugada! Contei pra base inteira que {m:o regulador novo|a reguladora nova} subiu na 01 comigo e ninguém acreditou. Vim buscar o crachá novo. O café é pra quem dorme três horas, que eu sei como é.', when: is.flag('fez_intervencao') },
          { who: 'BENE', t: 'Página 4 nova, né? Cena insegura. Vou te contar uma coisa: em 2017 eu levei uma garrafada na cabeça porque um regulador achou que "não precisava de polícia". Sete pontos.', when: is.not('fez_intervencao') },
          { who: 'BENE', t: 'Página 4 nova, né? Cena insegura. Você já viu como é do lado de lá: em 2017 eu levei uma garrafada na cabeça porque um regulador achou que "não precisava de polícia". Sete pontos.', when: is.flag('fez_intervencao') },
          { who: 'BENE', t: 'Eu entro em qualquer lugar, {dr}. Mas eu entro pra voltar.' },
        ],
        choices: [
          { label: '"Prometo, Bené: cena quente, a PM vai junto."', next: 'promessa', effect: fx.all(fx.set('promessa_bene'), fx.add('intimBene', 1, 'promessa ao Bené')) },
          { label: '"Cada um faz a sua parte, Bené."', next: 'seco' },
        ],
      },
      promessa: {
        lines: [
          { who: 'BENE', t: '(ele ri, mostrando a cicatriz na testa) Promessa de regulador. Vou anotar no painel da viatura.' },
          { who: 'SIMONE', t: 'Ele anota mesmo, {dr}. Tem lá: "Dr. Castro me deve um pastel desde 2019".' },
        ],
      },
      seco: {
        lines: [
          { who: 'BENE', t: 'Justo. A minha parte é voltar inteiro pra casa. A sua é me ajudar com isso.' },
          { who: 'NARRADOR', t: 'Ele bate duas vezes na porta, como quem bate na madeira, e sai.' },
        ],
      },
    },
  }),
  timeline: [
    { at: '07:02', kind: 'radio', who: 'COPOM · PM', text: 'Central, COPOM na escuta. Cena com arma ou briga, aciona a gente junto que a gente chega.' },
    { at: '08:40', kind: 'simone', who: 'SIMONE', text: 'O Bar do Neno abre às seis pros peões que saem do turno da noite da usina, {dr}. Às nove já tem gente valente lá dentro.' },
    { at: '09:10', kind: 'script', id: 'cena_hostil', run: cenaHostil },
    {
      at: '11:30',
      kind: 'script',
      id: 'peixoto_pm',
      run: (c) => {
        const d = c.callStatus(TIRO)?.decision;
        if (!d || (d.resource !== 'USA' && d.resource !== 'USB')) return;
        if (d.support.includes('PM')) c.modal('DR. PEIXOTO', '{Dr}, vi o bar no painel. PM acionada junto. Isso. Pode reclamar das minhas metas à vontade, mas equipe minha não entra em cena quente. Disso eu não abro mão.', 'interfone');
        else c.modal('DR. PEIXOTO', '{Dr}, mandou equipe pra tiroteio sem polícia? Página 4! Se o Bené leva um tiro, quem explica pra mulher dele sou eu.', 'interfone');
      },
    },
    { at: '13:05', kind: 'simone', who: 'SIMONE', text: 'Época de escorpião, {dr}. Calor, entulho e terreno baldio que ninguém limpa. Toda semana tem criança.' },
    { at: '16:40', kind: 'radio', who: 'COPOM · PM', text: 'COPOM informa: o autor dos disparos no Bar do Neno foi detido no Jardim Primavera. A arma era emprestada de um primo.' },
    { at: '17:50', kind: 'simone', who: 'SIMONE', text: 'Dia de rua quente, {dr}. Amanhã o Peixoto tem reunião com a OS. Ele tava com a cara do corte de frota.' },
  ],
  calls: [
    // ------------------------------------------------------------------ 1 ★ CIDA ("eu costurava pra fora")
    // Conferido (RC24/RT7: outras queixas → orientação): perfuração por agulha limpa, uma gota de sangue, sem sinal
    // de infecção. Lavar, cobrir e conferir a antitetânica na UBS.
    call({
      id: 'd04_cida',
      ref: 'D4 #1',
      at: '07:10',
      anchor: true,
      num: NUM.cida,
      caller: 'Dona Cida',
      callerName: 'Dona Cida',
      type: 'frequentador',
      voice: 'cida',
      note: 'Dona Cida. Espetou o dedo.',
      noteFixed: true,
      addr: ADDR.cida,
      amb: ['tv', 'passaros'],
      open: (c) => [
        `${saud(c)}, {meu} {filho}! É a Cida! Ó, {{espetei o dedo na agulha|dedo}}, pregando um botão. Precisa tomar a vacina do tétano?`,
        'Eu {{costurava pra fora|costurava}}, sabe, {meu} {filho}? Quarenta anos de agulha e nunca me espetei assim. Tô ficando velha.',
      ],
      q: {
        oque: 'Fui pregar um botão na camisa do meu falecido, que eu guardo. A agulha escorregou e entrou no dedão.',
        idade: 'Setenta e nove.',
        consciencia: 'Acordada! Espetada, mas acordada. [risada]',
        respira: 'Respiro, respiro.',
        inicio: 'Agorinha, antes do café.',
        sangramento: '{{Saiu uma gotinha só|gotinha}}. Já lavei com sabão e pus um esparadrapo.',
        historico: ['Pressão. Tomo direitinho.', 'A vacina do tétano... sei lá quando foi. {{Acho que foi quando o Brasil foi campeão.|vacina}} Uma das vezes.'],
        paciente: 'Sou eu mesma, {meu} {filho}.',
        seguranca: 'Seguro. Só eu, o Bolinha e a agulha.',
      },
      extra: [
        { id: 'sinais', label: 'Vermelhidão, pus, febre?', say: 'O dedo está muito vermelho, inchado, com pus? A senhora tem febre?', a: 'Nada disso. Um pontinho vermelho só. Tá até envergonhado de ter me espetado.' },
        {
          id: 'conversar',
          kind: 'fala',
          label: 'Conversar sobre a costura',
          cost: 15,
          say: 'A senhora costurava pra fora? Me conta.',
          a: [
            'Ah, {meu} {filho}... Vestido de noiva, uniforme de escola, barra de calça da cidade inteira. {{Paguei esta casa com uma máquina de pedal|maquina}}.',
            'O meu falecido dizia que eu costurava mais rápido do que ele falava. E ele falava muito, viu?',
            '[pausa]',
            'Hoje ela fica lá, a máquina, coberta com um pano. A vista não ajuda mais. Às vezes eu tiro o pano só pra olhar.',
            'Bom! Chega de saudade. Obrigada por me ouvir, {meu} {filho}.',
          ],
          onAsk: fx.all(fx.add('humanidade', 1, 'conversou com a Dona Cida'), fx.set('cida_conversou_d4')),
        },
      ],
      links: [
        { a: 'gotinha', b: 'manual:azul', insight: 'Espetada de agulha limpa, uma gota de sangue, sem sinais de infecção: não urgente. Lavar, cobrir e conferir a vacina na UBS (Manual p.1).' },
        { a: 'vacina', b: 'manual:azul', insight: 'Vacina do tétano sem data certa: orientar procurar a UBS para conferir a carteirinha. Não é caso de ambulância.' },
      ],
      onAnswer: fx.all(fx.set('cida_ligou_d4'), fx.set('cida_costurava')),
      patient: { name: 'Aparecida (Dona Cida)', age: 79, sex: 'F' },
      truth: { dx: 'Picada de agulha de costura no dedo (vacina antitetânica a conferir)', sev: 'azul', ok: ['ORI'], ref: ['UBS', 'CASA'] },
      diary: { ori: 'Espetou o dedo pregando botão na camisa do falecido. Costurou pra fora quarenta anos. A máquina de pedal fica coberta com um pano.' },
    }),
    // ------------------------------------------------------------------ 2 (exagerador)
    // Conferido (RC11): vômitos com alívio entre os episódios (não são "persistentes"), bebe e urina (sem "sinais de
    // desidratação"), sem sangue, consciente → orientação.
    call({
      id: 'd04_exagerador',
      ref: 'D4 #2',
      at: '08:00',
      pool: 'leve',
      num: '(17) 99714-2236',
      caller: 'Gilmar (marido)',
      callerName: 'Gilmar',
      type: 'exagerador',
      voice: 'homem',
      note: 'Marido gritando que a esposa tá morrendo.',
      noteWrong: 'Mulher morrendo! Marido desesperado!',
      addr: { rua: 'Rua das Acácias', n: 1620, bairro: 'Vila Esperança', ref: 'Casa de esquina, com um carro velho azul parado na garagem.' },
      amb: ['tv', 'cozinha'],
      open: ['Minha esposa tá {{MORRENDO|morrendo}}, pelo amor de Deus, manda a ambulância! Manda agora!'],
      q: {
        oque: 'Ela tá {{vomitando desde ontem|desde_ontem}}! Comeu um pastel na feira e começou.',
        consciencia: '{{Tá, tá falando|falando}}. Tá deitada no sofá.',
        respira: 'Respira, respira. Tá cansada de vomitar.',
        idade: 'Quarenta e um.',
        inicio: 'Desde ontem de tarde. Umas oito vezes.',
        sangramento: 'Sangue não. É só a comida mesmo, depois só água.',
        historico: 'Nada, ela é forte. Nunca tomou remédio.',
        paciente: ['SIRLENE: {{Tô enjoada, amor... fala que é só pra levar a gente na UPA, o carro tá sem gasolina|taxi}}.', 'GILMAR: Sirlene! Fica quieta!'],
        referencia: 'Casa de esquina, com o carro azul na garagem. Parado. Sem gasolina.',
        seguranca: 'Seguro. Só a gente.',
      },
      extra: [
        { id: 'liquidos', label: 'Ela bebe líquido? Faz xixi?', say: 'Ela consegue beber água em golinhos? Está fazendo xixi?', a: 'Bebe uns golinhos de soro caseiro. Fez xixi agora há pouco, normal.' },
        { id: 'diarreia', label: 'Diarreia, febre, dor forte?', say: 'Tem diarreia, febre alta ou dor forte na barriga?', a: 'Uma diarreiazinha. Febre não. Dor, só aquela cólica de quem vomitou muito.' },
      ],
      links: [
        { a: 'morrendo', b: 'falando', insight: '"Tá morrendo" — mas está acordada, conversando, deitada no sofá. A urgência está na voz dele, não no quadro dela.' },
        { a: 'taxi', b: 'morrendo', insight: 'A própria paciente entrega: é "só pra levar na UPA, o carro tá sem gasolina". A viatura seria usada como táxi. Verde: orientação.' },
        { a: 'desde_ontem', b: 'manual:verde', insight: 'Vômito desde ontem, bebendo e urinando, sem sangue nem febre alta: caso verde. UPA por meios próprios (Manual p.1).' },
      ],
      patient: { name: 'Sirlene Pinto', age: 41, sex: 'F' },
      truth: { dx: 'Gastroenterite sem desidratação grave', sev: 'verde', ok: ['ORI'], ref: ['UPA', 'UBS'] },
      radio: { excess: 'Central, {unit}. Gastroenterite, paciente hidratada, conversando. O marido perguntou se a gente passava no posto de gasolina na volta, {dr}.' },
      diary: { ori: 'Vômito depois de um pastel de feira. "Tá morrendo", disse o marido; "o carro tá sem gasolina", disse ela.' },
    }),
    // ------------------------------------------------------------------ 3 ★ TIROTEIO NO BAR
    // Conferido (RT4 / RT8): tiro na coxa com calça ensopada, poça e palidez = "hemorragia maior incontrolável" → USA;
    // agressor armado na cena → PM junto (Manual p.4). Compressão só se der sem se expor (guia cena_insegura).
    call({
      id: TIRO,
      ref: 'D4 #3 ★',
      at: '09:00',
      anchor: true,
      num: '(17) 3325-1350',
      caller: 'Seu Neno (dono do bar)',
      callerName: 'Seu Neno',
      type: 'testemunha',
      voice: 'grave',
      note: 'TIRO no Bar do Neno! Atirador ainda no local!',
      noteFixed: true,
      addr: { rua: 'Rua Pará', n: 1350, bairro: 'Distrito Industrial', ref: 'Bar do Neno, em frente ao portão 2 da usina.' },
      amb: ['bar', 'gritos', 'tiros'],
      open: [
        'Emergência! {{Deram tiro aqui no Bar do Neno|tiro}}! O Josué tá no chão sangrando! {{O cara ainda tá lá fora com o revólver|atirador}}, eu tô escondido atrás do balcão!',
        '[{{gritos na rua, um estampido seco|estampido}}]',
      ],
      q: {
        oque: 'Briga por causa de dívida de sinuca. O cara saiu, voltou com o revólver e atirou. Pegou na perna do Josué.',
        consciencia: 'Tá acordado, gemendo, segurando a perna. Tá ficando branco.',
        respira: 'Respira rápido, gemendo.',
        idade: 'Uns trinta e poucos. Peão da usina, saiu do turno da noite.',
        inicio: 'Agora! Dois minutos!',
        sangramento: '{{A calça tá ensopada, tá fazendo poça|poca}} no chão do bar.',
        historico: 'Sei lá, {m:moço|moça}! Ele bebe aqui todo dia, é só o que eu sei.',
        paciente: ['JOSUÉ: Ai... a minha perna... não deixa ele voltar, Neno...', '[gemido]'],
        referencia: 'Bar do Neno, em frente ao portão 2 da usina. Todo mundo conhece.',
        seguranca: ['Seguro?! {{O cara tá na calçada, andando de um lado pro outro, gritando que vai voltar|na_calcada}}!', '{{Ninguém chamou a polícia ainda|sem_pm}}, todo mundo correu!'],
      },
      extra: [
        { id: 'onde_tiro', label: 'Onde pegou o tiro?', say: 'Onde pegou o tiro? Só na perna?', a: 'Na coxa, do lado de dentro. Só um tiro, eu acho. Ele mexe os pés.' },
        { id: 'abaixado', label: 'Você está em segurança?', say: 'Você está protegido? Consegue ficar abaixado longe da porta?', a: 'Tô atrás do balcão, abaixado, com a mão na cabeça. O Josué tá a uns dois metros de mim.' },
      ],
      links: [
        { a: 'atirador', b: 'manual:cena', insight: 'Arma e agressor ainda no local: cena insegura. A viatura só vai junto com a PM (Manual p.4).' },
        { a: 'sem_pm', b: 'manual:cena_falta', insight: 'Ninguém chamou a polícia. Mandar equipe para cena com atirador sem PM = advertência imediata (Manual p.4).' },
        { a: 'poca', b: 'manual:vermelho', insight: 'Tiro na coxa, calça ensopada e ficando branco: hemorragia com risco de morte. Vermelho → USA (Manual p.1).' },
        { a: 'end', b: 'doc:bar_neno', kind: 'confirma', insight: 'O bar das brigas do jornal de hoje. Cena com histórico: PM obrigatória.' },
      ],
      guide: { id: 'cena_insegura' },
      onStamp: (e) => {
        const d = e.s.shift?.calls[TIRO]?.decision;
        if (d && (d.resource === 'USA' || d.resource === 'USB')) {
          e.set('d4_tiro_despachado');
          if (d.support.includes('PM')) e.set('d4_pm_ok');
        }
      },
      patient: { name: 'Josué Batista', age: 34, sex: 'M' },
      truth: { dx: 'Ferimento por arma de fogo na coxa com hemorragia', sev: 'vermelho', ok: ['USA'], sup: ['PM'], risk: { good: 45, bad: 110, guideBonus: 15 } },
      radio: {
        // sem {tokens}: no caminho "sem PM" o motor agenda este texto sem resolver os marcadores
        ok: (c) =>
          c.flag('d4_pm_ok')
            ? 'Central, chegamos no Bar do Neno junto com a PM. Baleado na coxa, sangrando muito. Aguardando a PM liberar a porta pra entrar.'
            : 'Central, a PM chegou, finalmente. Entramos. Baleado na coxa, perdeu muito sangue, mas tá falando. Seguimos pro Regional.',
        saved: (c) =>
          c.flag('d4_pm_ok')
            ? 'Central, chegamos no Bar do Neno junto com a PM. O dono do bar tá segurando o pano na perna dele, abaixado atrás do balcão. Aguardando a PM liberar a porta.'
            : 'Central, a PM chegou, finalmente. O dono do bar segurou o pano na perna dele o tempo todo, abaixado. Perdeu sangue, mas tá falando. Seguimos pro Regional.',
        unsafe: (c) => {
          const u = c.s.shift?.calls[TIRO]?.units[0];
          return u === 'USA01' && c.flag('promessa_bene')
            ? 'Central... {dr}, você prometeu. Fomos recebidos a bala. Recuamos pra trás da viatura. CADÊ A PM?!'
            : 'Central, {unit}! Chegamos e o atirador ainda tá na rua! Recuamos! Cadê a PM?!';
        },
        under: 'Central, {unit}! Baleado na coxa, sangramento grande, pressão caindo! Precisamos de avançado!',
        dead: 'Central... a gente esperou a cena liberar. Perdeu sangue demais. Óbito constatado no chão do bar.',
      },
      diary: { alive: 'Tiro na coxa, briga por dívida de sinuca no Bar do Neno. O dono do bar segurou o pano abaixado atrás do balcão.', dead: 'Tiro na coxa no Bar do Neno. Dívida de sinuca.' },
    }),
    // ------------------------------------------------------------------ 4 (briga de vizinhos com facão)
    // Conferido (RT2 / RT9): golpe com o cabo (não é trauma penetrante), acordado, sem perda de consciência nem
    // vômito; o corte ainda escorre sob a toalha ("hemorragia menor incontrolável", RT9) → USB; agressor armado no
    // portão → PM junto (Manual p.4; RM9 não se aplica: adulto).
    call({
      id: 'd04_facao',
      ref: 'D4 #4',
      at: '10:10',
      pool: 'trauma_moderado',
      num: '(17) 99186-4407',
      caller: 'Dona Vilma (esposa)',
      callerName: 'Dona Vilma',
      type: 'comum',
      voice: 'mulher',
      note: 'Briga de vizinho. Um com a cabeça sangrando.',
      noteWrong: 'Corte na cabeça. Briga já acabou.',
      addr: { rua: 'Rua das Palmeiras', n: 610, bairro: 'Vila Esperança', ref: 'Casa do muro descascado, a do pé de jaca que caiu na casa do vizinho.' },
      amb: ['gritos', 'cachorro'],
      open: [
        '{m:Moço|Moça}, o vizinho deu com o cabo do facão na cabeça do meu marido por causa do pé de jaca! {{Tá sangrando muito|sangra}}!',
        '[ao fundo, um homem gritando: {{"Vem que tem mais! Vem!"|ameaca}}]',
      ],
      q: {
        oque: 'A jaca caiu no telhado dele e quebrou umas telhas. Ele veio cobrar, o Valmir respondeu, e ele veio com o facão.',
        consciencia: 'Tá acordado, xingando o vizinho. Diz que tá meio tonto.',
        respira: 'Normal. Bravo, mas normal.',
        idade: 'Cinquenta e dois.',
        inicio: 'Agora, faz uns dez minutos.',
        sangramento: 'Corte na cabeça, em cima, no cabelo. {{Sangrou demais, encharcou a camisa|camisa}}, mas com a toalha apertando tá diminuindo.',
        historico: 'Pressão. Toma remédio.',
        paciente: ['VALMIR: Tô bem! Me dá o telefone que eu falo com a polícia eu mesmo!', 'VILMA: Senta, Valmir!'],
        referencia: 'Muro descascado, o pé de jaca na divisa. Dá pra ver o vizinho no portão.',
        seguranca: ['Seguro não, {m:moço|moça}! {{O vizinho ainda tá no portão dele com o facão na mão|facao}}, gritando!', 'Ninguém chamou polícia, a rua toda tá olhando.'],
      },
      extra: [
        { id: 'vomito', label: 'Vomitou? Desmaiou?', say: 'Ele desmaiou na hora? Vomitou? Está confuso?', a: 'Desmaiar não. Vomitar não. Confuso só de raiva.' },
      ],
      links: [
        { a: 'facao', b: 'manual:cena', insight: 'O agressor ainda está no portão com o facão: cena insegura. PM junto com a viatura (Manual p.4).' },
        { a: 'ameaca', b: 'facao', insight: '"Vem que tem mais": a briga não acabou. A equipe não pode chegar sozinha.' },
        { a: 'camisa', b: 'manual:amarelo', insight: 'Corte no couro cabeludo sangra muito, mas ele está acordado, sem vômito e o sangramento cede com a toalha: amarelo → USB, com PM (Manual p.1 e p.4).' },
      ],
      patient: { name: 'Valmir Santana', age: 52, sex: 'M' },
      truth: { dx: 'Corte no couro cabeludo por agressão (agressor armado no local)', sev: 'amarelo', ok: ['USB'], sup: ['PM'], risk: { good: 100, bad: 280, needs: 'USB' } },
      radio: {
        ok: 'Central, a PM segurou o vizinho e a gente entrou. Corte no couro cabeludo, paciente consciente, sem sinal de gravidade. Removendo pra UPA pra sutura.',
        late: 'Central, demorou pra cena liberar. O corte sangrou muito tempo e ele chegou tonto. Vai ficar em observação na UPA.',
        unsafe: 'Central, {unit}! O vizinho veio pra cima da viatura com o facão! Recuamos! Cadê a PM?!',
        excess: '{central}, {unit}. Corte na cabeça, paciente bem, xingando o vizinho. Isso era básica, {dr}. E a PM já tinha levado o homem do facão.',
      },
      diary: { alive: 'Briga por um pé de jaca. Cabo de facão na cabeça. Sete pontos e um boletim de ocorrência.' },
    }),
    // ------------------------------------------------------------------ 5 (carro × moto)
    // Conferido (RT8 / RT9): motociclista projetado sobre o carro, só geme à dor (alteração súbita da consciência),
    // respiração ruidosa, deformidade de perna → USA. Não tirar o capacete (campo A13).
    call({
      id: 'd04_moto',
      ref: 'D4 #5',
      at: '11:15',
      pool: 'grave',
      num: '(17) 99657-0930',
      caller: 'Sônia (motorista do carro)',
      callerName: 'Sônia',
      type: 'testemunha',
      voice: 'mulher',
      note: 'Batida de carro com moto. Motorista do carro no telefone, em pânico.',
      noteWrong: 'Carro e moto. Só susto, todo mundo bem.',
      addr: { rua: 'Av. Brasil', n: 4500, bairro: 'Jardim Primavera', ref: 'No cruzamento com a Av. Primavera, perto do Shopping Aurora.' },
      amb: ['buzinas', 'rua', 'multidao'],
      open: [
        'Eu bati nele! Eu não vi, juro que não vi! O motoqueiro voou por cima do meu carro e {{tá no chão, não se mexe|nao_mexe}}!',
        '[buzinas, alguém gritando "não tira o capacete!"]',
      ],
      q: {
        oque: 'Eu tava virando na Primavera, ele vinha no corredor, rápido. Bateu na minha porta e voou longe.',
        consciencia: '{{Não abre o olho. Só geme quando o rapaz da padaria aperta a mão dele|geme}}.',
        respira: 'Respira... {{rápido e com barulho|barulho}}.',
        idade: 'Novo. Uns vinte e cinco.',
        inicio: 'Agora, cinco minutos!',
        sangramento: 'Tá saindo sangue do nariz. E {{a perna tá torta, dobrada pro lado errado|perna}}.',
        historico: 'Eu não sei quem ele é, {m:moço|moça}! Tá com a mochila de entrega nas costas.',
        paciente: 'Ele não responde! Ele não fala!',
        referencia: 'No cruzamento da Brasil com a Primavera, do lado do shopping.',
        seguranca: 'Tem um homem desviando o trânsito. O carro tá parado no meio da pista.',
      },
      extra: [
        { id: 'capacete', label: 'Está de capacete?', say: 'Ele está de capacete? Alguém mexeu nele?', a: 'Tá de capacete. Um moço queria tirar, eu gritei pra não tirar!' },
      ],
      links: [
        { a: 'geme', b: 'manual:vermelho', insight: 'Não abre o olho, só geme na dor, depois de voar por cima de um carro: inconsciência por trauma grave. Vermelho → USA (Manual p.1).' },
        { a: 'barulho', b: 'nao_mexe', insight: 'Respiração rápida e com barulho em quem não se mexe: via aérea em risco. Não é caso de USB.' },
        { a: 'geme', b: 'manual:parada', kind: 'confirma', insight: 'Geme e respira: não é parada. É trauma grave, e o relógio está correndo.' },
      ],
      worsen: [{ after: 100, lines: ['SÔNIA: {{Ele parou de gemer! Tá fazendo um ronco!|ronco}}', '[gritos]'] }],
      guide: { id: 'trauma' },
      patient: { name: 'Wanderson Lima', age: 25, sex: 'M' },
      truth: { dx: 'Politrauma com TCE (colisão carro × moto)', sev: 'vermelho', ok: ['USA'], risk: { good: 45, bad: 110, guideBonus: 15 } },
      radio: {
        ok: '{central}, {unit} no local. Politrauma, TCE, fratura exposta de fêmur. Intubado, seguimos pro Regional. A motorista do carro não sai do lado dele.',
        under: 'Central, {unit}! Motociclista rebaixado, TCE e fêmur! Precisamos de avançado aqui!',
        dead: 'Central... {unit}. Óbito constatado às {hora}. Entregador. A motorista do carro tá sentada no meio-fio.',
      },
      diary: { alive: 'Entregador de moto, voou por cima de um carro na Av. Brasil. Quem ligou foi a motorista que bateu nele.', dead: 'Entregador de moto, Av. Brasil. Quem ligou foi a motorista que bateu nele.' },
    }),
    // ------------------------------------------------------------------ 6 (escorpião em criança)
    // Conferido (RC21 / USP): escorpião amarelo em criança de 4 anos com vômitos repetidos, sudorese e sialorreia =
    // acidente moderado a grave, "envenenamento de alta mortalidade" → USA; soro antiescorpiônico no hospital.
    call({
      id: 'd04_escorpiao',
      ref: 'D4 #6',
      at: '12:20',
      pool: 'grave,pediatria',
      num: '(17) 99470-6640',
      caller: 'Daiane (mãe)',
      callerName: 'Daiane',
      type: 'comum',
      voice: 'jovem_m',
      note: 'Mãe. Criança de 4 anos picada por escorpião.',
      noteWrong: 'Picada de bicho em criança. Mãe nervosa, parece leve.',
      addr: { rua: 'Rua Quaresmeira', n: 2850, bairro: 'Parque das Exposições', ref: 'Casa de muro baixo, a uma quadra do terreno baldio da Pitangueira.' },
      amb: ['choro', 'tv'],
      open: [
        '{m:Moço|Moça}, um {{escorpião picou a minha filha|escorpiao}}! No pé, quando ela foi calçar o tênis! Ela tem quatro anos!',
        '[{{choro agudo, e um barulho de ânsia|ansia}}]',
      ],
      q: {
        oque: 'O bicho tava dentro do tênis. Ela gritou, eu tirei, ele caiu e eu matei com o chinelo.',
        consciencia: 'Tá acordada, chorando muito, agitada.',
        respira: 'Respira rápido, de tanto chorar. Agora tá meio ofegante.',
        idade: 'Quatro anos. A Lara.',
        inicio: 'Faz uns vinte minutos. Achei que ia passar com gelo.',
        sangramento: 'Não, só um pontinho vermelho no pé.',
        historico: 'Nada. É saudável, vacina em dia.',
        paciente: ['LARA: Mamãe, tá doendo! Tá doendo até aqui!', '[choro]'],
        referencia: 'A uma quadra do terreno baldio da Pitangueira, aquele cheio de entulho.',
        seguranca: 'Seguro. Matei o bicho. Mas tem mais lá no terreno, todo mundo sabe.',
      },
      extra: [
        { id: 'vomito', label: 'Vomitou? Suando?', say: 'Ela vomitou? Está suando, babando, tremendo?', a: '{{Já vomitou três vezes|vomitou}}! Tá suando frio e babando, {m:moço|moça}. Isso é normal?' },
        { id: 'bicho', label: 'Como era o bicho?', say: 'Você viu o escorpião? Como ele era?', a: '{{Amarelo, com o rabo enrolado|amarelo}}. Tá aqui num pote de margarina.' },
      ],
      links: [
        { a: 'vomitou', b: 'escorpiao', insight: 'Criança de 4 anos picada por escorpião, vomitando e suando: o veneno já está agindo no corpo todo. Grave → USA.' },
        { a: 'vomitou', b: 'manual:vermelho', insight: 'Vômitos repetidos, suor frio e agitação numa criança pequena depois da picada: risco de vida. Vermelho → USA (Manual p.1).' },
        { a: 'amarelo', b: 'escorpiao', insight: 'Escorpião amarelo: o mais perigoso da região. Em criança pequena, cada minuto até o soro conta.' },
        { a: 'end', b: 'doc:terreno_baldio', kind: 'confirma', insight: 'A uma quadra do terreno baldio do jornal: entulho, calor e escorpião. A prefeitura diz que a limpeza "está no cronograma".' },
      ],
      guide: { id: 'escorpiao' },
      patient: { name: 'Lara Martins', age: 4, sex: 'F' },
      truth: { dx: 'Picada de escorpião com sinais sistêmicos (vômitos) em criança', sev: 'vermelho', ok: ['USA'], risk: { good: 50, bad: 120, guideBonus: 10 } },
      radio: {
        ok: '{central}, {unit}. Criança de 4 anos, picada de escorpião amarelo, vômitos repetidos e sudorese. Seguimos pro Regional, soro antiescorpiônico avisado.',
        under: 'Central, {unit}! Criança com escorpionismo grave, vomitando, taquicárdica! Precisamos de avançado e de soro!',
        dead: 'Central... {unit}. Não deu, {dr}. Quatro anos. Óbito constatado às {hora}.',
        dismissed: 'DAIANE: {m:Moço|Moça}! Ela não para de vomitar, tá gelada e mole! Vocês não vão mandar ninguém?!',
      },
      diary: { alive: 'Escorpião amarelo dentro do tênis. Lara, 4 anos. Recebeu o soro a tempo.', dead: 'Escorpião amarelo dentro do tênis. Lara, 4 anos. Um terreno baldio a uma quadra.' },
    }),
    // ------------------------------------------------------------------ 7 (enxaqueca de sempre)
    // Conferido (RC6): sem início abrupto, febre, meningismo, déficit ou alteração de consciência → nada de USA.
    // [validar] O RC6 põe "dor moderada" (dor intensa, mas suportável) em USI/USB: o jogo prefere orientar (crise
    // habitual, marido em casa, UPA por meios próprios se não ceder) e aceita USB (⚖). Equipe: confirmar.
    call({
      id: 'd04_enxaqueca',
      ref: 'D4 #7',
      at: '13:40',
      pool: 'leve',
      num: '(17) 3322-7764',
      caller: 'Rosana',
      callerName: 'Rosana',
      type: 'comum',
      voice: 'mulher',
      note: 'Mulher de 50 com "a enxaqueca de sempre".',
      noteWrong: 'Mulher com a pior dor de cabeça da vida!',
      addr: { rua: 'Rua Padre Anchieta', n: 900, bairro: 'Jardim Norte', ref: 'Sobrado bege, cortina fechada no andar de cima.' },
      amb: ['silencio'],
      open: [
        '(voz baixinha) Oi... desculpa. É {{a enxaqueca de sempre|de_sempre}}. Tomei o meu remédio e não passou. Meu marido que mandou ligar.',
      ],
      q: {
        oque: 'Começou depois do almoço. A luz incomoda, o barulho incomoda. Tô no quarto escuro.',
        consciencia: 'Acordada. Só não quero abrir o olho.',
        respira: 'Normal.',
        idade: 'Cinquenta.',
        inicio: 'Faz umas duas horas. {{Foi vindo devagar, igual sempre|devagar}}.',
        sangramento: 'Não.',
        historico: 'Enxaqueca desde mocinha. Tenho o remédio da neurologista. Pressão boa.',
        paciente: 'Sou eu.',
        seguranca: 'Tudo bem.',
      },
      extra: [
        { id: 'igual', label: 'É igual às outras crises?', say: 'Essa dor é igual às suas crises de sempre, ou é diferente?', a: '{{Igualzinha. Começou com aquelas luzinhas em zigue-zague, depois a dor de um lado só|igual}}. Enjoo, a luz incomoda.' },
        { id: 'pancada', label: 'Começou de repente?', say: 'Ela começou de repente, como uma pancada, a pior dor da sua vida?', a: 'Não, não. Foi chegando. Já tive muito pior.' },
        { id: 'alarme', label: 'Febre, nuca dura, fraqueza?', say: 'Tem febre, nuca dura, fraqueza num lado do corpo, fala enrolada ou boca torta?', a: '{{Nada disso|sem_alarme}}. Só a dor e o enjoo. Falo normal, mexo tudo.' },
      ],
      links: [
        { a: 'igual', b: 'sem_alarme', kind: 'confirma', insight: 'Igual às crises de sempre, com aura, sem febre, sem nuca dura, sem fraqueza nem fala enrolada: enxaqueca. Verde: orientação.' },
        { a: 'devagar', b: 'manual:verde', insight: 'Dor que foi chegando devagar, conhecida há anos, sem sinal de alarme: caso verde. Se não melhorar, UPA por meios próprios (Manual p.1).' },
      ],
      patient: { name: 'Rosana Mendes', age: 50, sex: 'F' },
      truth: { dx: 'Crise de enxaqueca habitual, sem sinais de alarme', sev: 'verde', ok: ['ORI', 'USB'], best: 'ORI', ref: ['CASA', 'UBS', 'UPA'] },
      radio: { excess: '{central}, {unit}. Enxaqueca de sempre, sinais normais. A gente falou baixinho e apagou a luz da sirene. Liberamos, {dr}.' },
      diary: { ori: 'A enxaqueca de sempre, com as luzinhas antes. Quarto escuro, remédio e UPA se piorar.' },
    }),
    // ------------------------------------------------------------------ 8 (trote: incêndio no terreno baldio)
    call({
      id: 'd04_incendio',
      ref: 'D4 #8',
      at: '14:50',
      pool: 'trote',
      num: '(17) 99358-0013',
      caller: 'Voz de homem',
      callerName: 'Voz de homem',
      type: 'trotista',
      voice: 'jovem_h',
      note: 'Diz que é incêndio com cinco feridos. Ninguém mais ligou.',
      noteWrong: 'INCÊNDIO! Cinco feridos! Pega já!',
      addr: { rua: 'Rua Pitangueira', n: 2950, bairro: 'Parque das Exposições', ref: 'Do lado da padaria, em frente ao mercadinho.' },
      amb: ['tv'],
      open: [
        '{{Incêndio com cinco feridos|incendio}}! Tá pegando fogo num {{sobrado na Rua Pitangueira, 2950|sobrado}}! Manda tudo, manda ambulância, manda tudo!',
        '[{{ao fundo, só uma televisão num programa de auditório. Nenhuma sirene, nenhum grito, nenhum estalo de fogo|tv_calma}}]',
      ],
      q: {
        oque: 'Pegou fogo do nada! O sobrado inteiro! Tem gente queimada!',
        consciencia: 'Os cinco? Tá... uns tão, outros não. Sei lá!',
        respira: 'Tão tossindo, tossindo muito!',
        idade: 'De tudo quanto é idade. Velho, criança...',
        inicio: 'Agora!',
        sangramento: 'Muito! Tá todo mundo sangrando!',
        historico: 'Como é que eu vou saber, {m:moço|moça}?',
        paciente: ['[risadinha abafada]', 'Não dá pra falar com ninguém, tá todo mundo... queimando!'],
        referencia: '{{Do lado da padaria, em frente ao mercadinho|padaria}}.',
        seguranca: 'Seguro não, tá pegando fogo! [a televisão ri junto com a plateia]',
      },
      extra: [
        { id: 'bombeiros', label: 'Já chamaram os Bombeiros?', say: 'Os Bombeiros já foram chamados? Tem alguém tirando as pessoas de lá?', a: 'Bombeiro? Não... {{chama você, que é mais rápido|bombeiro}}.' },
        { id: 'nomes', label: 'Conhece os feridos?', say: 'Você conhece as pessoas feridas? Sabe o nome de alguma?', a: ['É... a família do... Seu Zé. Os Zé. Todos eles. Manda logo!', '[uma risadinha abafada, longe do fone]'] },
      ],
      callback: ['[{{"O número chamado não existe ou está temporariamente fora de serviço."|retorno_inexistente}}]'],
      links: [
        { a: 'sobrado', b: 'doc:terreno_baldio', insight: 'Rua Pitangueira, 2950 é o terreno baldio do jornal de hoje: só entulho, nenhuma construção. Não existe sobrado ali para pegar fogo.' },
        { a: 'end', b: 'doc:terreno_baldio', insight: 'O endereço é o terreno baldio que saiu no jornal: não tem casa, padaria nem mercadinho.' },
        { a: 'tv_calma', b: 'incendio', insight: 'Incêndio com cinco feridos e, ao fundo, só uma televisão rindo. Nenhuma sirene, nenhum grito, nenhuma tosse de verdade.' },
        { a: 'bombeiro', b: 'incendio', insight: 'Ninguém chamou os Bombeiros para um sobrado em chamas. E ninguém mais ligou. Cinco feridos não ficam em silêncio.' },
        { a: 'retorno_inexistente', b: 'manual:ligar_volta', insight: 'Ligar de volta: número inexistente (chip descartável). Reforça o trote (Manual p.2).' },
      ],
      patient: { name: '"Cinco feridos em incêndio"' },
      truth: { dx: 'Trote', sev: 'trote', ok: ['TROTE'], prankKind: 'trote' },
      radio: { prank: 'Central, {unit} na Pitangueira, 2950. Terreno baldio, entulho e um gato. Nenhum fogo, nenhum ferido. Trote. Os Bombeiros vieram junto e não acharam graça.' },
      diary: { ori: 'Trote: "incêndio com cinco feridos" num terreno baldio que tinha saído no jornal da manhã.' },
    }),
    // ------------------------------------------------------------------ 9 (idoso que já levantou)
    // Conferido (RT6): idoso de 76 anos, queda da própria altura, sem fratura, sem dor moderada/intensa, sem
    // anticoagulante, sem TCE, anda → orientação (o "idoso > 70 com fratura ou dor" do RT6 não se aplica).
    call({
      id: 'd04_joelho',
      ref: 'D4 #9',
      at: '16:00',
      pool: 'leve',
      num: '(17) 3328-4410',
      caller: 'Seu Geraldo',
      callerName: 'Seu Geraldo',
      type: 'minimizador',
      voice: 'idoso',
      note: 'Senhor de 76 caiu, diz que já levantou.',
      noteWrong: 'Queda de idoso! Pode ter fratura!',
      addr: { rua: 'Rua Paineira', n: 1230, bairro: 'Santa Luzia', ref: 'Casa da horta na frente, portão de madeira.' },
      amb: ['passaros', 'agua'],
      open: ['Boa tarde. Olha, eu nem ia ligar, foi a minha filha que mandou por mensagem. {{Caí no quintal, mas já levantei|levantei}}. Só {{ralou o joelho|ralou}}.'],
      q: {
        oque: 'Tava regando a horta, {{tropecei na mangueira|tropecei}} e caí de joelho. Pus as mãos no chão.',
        consciencia: 'Tô ótimo, lúcido. Tô até terminando de regar.',
        respira: 'Normal.',
        idade: 'Setenta e seis.',
        inicio: 'Faz meia hora.',
        sangramento: 'Ralou o joelho, sangrou um pouquinho. Já lavei na torneira.',
        historico: 'Só pressão. E a próstata, mas isso não vem ao caso.',
        paciente: 'Sou eu mesmo.',
        seguranca: 'Seguro. Eu e os pés de alface.',
      },
      extra: [
        { id: 'anticoagulante', label: 'Toma remédio de "afinar o sangue"?', say: 'O senhor toma algum remédio para afinar o sangue?', a: '{{Não, só o da pressão|sem_anticoag}}. O de afinar quem toma é o meu cunhado.' },
        { id: 'cabeca', label: 'Bateu a cabeça? Tontura antes?', say: 'O senhor bateu a cabeça? Sentiu tontura ou apagou antes de cair?', a: '{{Não bati, caí de joelho. E não apaguei: foi a mangueira, a danada.|sem_cabeca}}' },
        { id: 'andar', label: 'Anda normalmente?', say: 'O senhor consegue andar e apoiar a perna normalmente?', a: 'Ando. Mancando um tiquinho no começo, agora normal. Subi os dois degraus da cozinha.' },
      ],
      links: [
        { a: 'tropecei', b: 'sem_cabeca', kind: 'confirma', insight: 'Tropeçou, não desmaiou, não bateu a cabeça, anda normalmente: queda mecânica sem gravidade.' },
        { a: 'sem_anticoag', b: 'ralou', kind: 'confirma', insight: 'Sem remédio de afinar o sangue e só um ralado: orientação. (Idoso anticoagulado que bate a cabeça seria outra história.)' },
        { a: 'levantei', b: 'manual:verde', insight: 'Levantou sozinho, anda, só ralou o joelho: caso verde. Lavar, cobrir e procurar a UBS se inchar (Manual p.1).' },
      ],
      patient: { name: 'Geraldo Freitas', age: 76, sex: 'M' },
      truth: { dx: 'Queda mecânica com escoriação no joelho', sev: 'verde', ok: ['ORI'], ref: ['CASA', 'UBS'] },
      radio: { excess: '{central}, {unit}. Ralado no joelho. Ele ofereceu alface pra equipe. Liberamos, {dr}.' },
      diary: { ori: 'Tropeçou na mangueira regando a horta. Ralou o joelho. Terminou de regar.' },
    }),
  ],
  interlude: {
    teaser: '{Oconj} espalhou retalhos na mesa da sala e circulou um anúncio no jornal.',
    familyLacos: 1,
    scene: {
      id: 'd04_maquina',
      bg: 'sala',
      cast: ['LUCIA', 'DAVI', 'ZELIA'],
      nodes: {
        start: {
          lines: [
            { who: 'NARRADOR', t: 'Na mesa da sala, uns retalhos, uma fita métrica e a Gazeta aberta num anúncio circulado de caneta: "Máquinas de costura usadas, revisadas, a partir de R$ 450".' },
            { who: 'LUCIA', t: 'A bombinha, {nome}. Você disse que ia passar na farmácia.', when: (c) => c.flag('prometeu_bombinha') && !c.flag('bombinha') },
            { who: 'NARRADOR', t: '{c:Ela|Ele} não fala mais nada sobre isso. Alisa um retalho em cima da mesa.', when: (c) => c.flag('prometeu_bombinha') && !c.flag('bombinha') },
            { who: 'LUCIA', t: 'A Cleide do 52 quer barra de calça. A Zuleide, dois vestidos pra neta. Na confecção eu fazia sessenta peças por dia.' },
            { who: 'LUCIA', t: 'Com uma máquina eu tiro uns quarenta reais por folga sua. Fácil. Mais, se pegar uniforme de escola.' },
            { who: 'LUCIA', t: 'Eu tinha começado a juntar num pote de margarina. Tinha cento e vinte. ...Foi na conta de água do Valdemar.', when: (c) => c.flag('lucia_pagou_agua') },
            { who: 'LUCIA', t: 'Tenho cento e vinte guardados num pote de margarina. Falta muito, eu sei.', when: (c) => !c.flag('lucia_pagou_agua') },
            { who: 'LUCIA', t: 'Não precisa ser agora... mas pensa.' },
          ],
          onEnter: (e) => {
            if (e.flag('prometeu_bombinha') && !e.flag('bombinha') && !e.flag('d4_cobrou_bombinha')) {
              e.set('d4_cobrou_bombinha');
              e.add('lacos', -1, 'promessa da bombinha não cumprida');
            }
          },
          choices: [
            { label: '"A gente vai comprar essa máquina, {c:Lú|Alex}."', next: 'sim', affectionate: true },
            { label: '"Agora não dá. Mas eu penso. De verdade."', next: 'pensa' },
            { label: '"Por que você não pega serviço numa confecção?"', next: 'confeccao' },
            { label: '"Hoje uma senhora me disse no telefone que costurava pra fora."', next: 'cida', when: (c) => c.flag('cida_costurava') },
          ],
        },
        sim: {
          lines: [
            { who: 'LUCIA', t: '({c:ela ri, desconfiada|ele ri, desconfiado}) Com que dinheiro, {dr}?' },
            { who: 'EU', t: 'Com o dinheiro que a máquina vai fazer.' },
            { who: 'LUCIA', t: 'Isso é conta de quem nunca pagou boleto. ...Mas {c:obrigada|obrigado}.' },
            { who: 'DAVI', t: '(da porta) {c:Mãe|Pai}, quando tiver a máquina, faz uma capa de super-herói pra mim? Com a estrela azul da ambulância nas costas?' },
          ],
          onEnter: fx.set('maquina_prometida'),
          next: 'fim',
        },
        pensa: {
          lines: [
            { who: 'LUCIA', t: 'Pensa mesmo, viu? Não é "pensa" de quem já decidiu que não.' },
            { who: 'ZELIA', t: '(sem tirar o olho da novela) {c:Ela|Ele} fazia vestido de noiva, sabia? Com renda. Eu vi as fotos.' },
          ],
          next: 'fim',
        },
        confeccao: {
          lines: [
            { who: 'LUCIA', t: 'Fechou, {nome}. As três da cidade. Agora vem tudo pronto de fora, mais barato que o tecido.' },
            { who: 'LUCIA', t: 'E eu não quero patrão de novo. Quero a minha mesa, a minha luz, o meu horário. Quero ver o Liam chegar da escola.' },
          ],
          choices: [
            { label: '"Então a gente vai comprar essa máquina."', next: 'sim', affectionate: true },
            { label: '"Eu penso. De verdade."', next: 'pensa' },
          ],
        },
        cida: {
          lines: [
            { who: 'EU', t: 'Uma senhora que liga todo dia. Costurou quarenta anos. Disse que pagou a casa com uma máquina de pedal.' },
            { who: 'LUCIA', t: '(os olhos {c:dela|dele} brilham) Viu? Tem gente que criou uma vida inteira com isso.' },
            { who: 'ZELIA', t: '(levanta os olhos da novela por um segundo) Costurava, é? ...Tem tanta costureira velha nessa cidade.' },
            { who: 'NARRADOR', t: 'A Dona Zélia volta para a novela. Mas fica um tempo com a agulha de crochê parada no ar.' },
          ],
          onEnter: fx.add('lacos', 1, 'contou da Dona Cida para {oconj}'),
          next: 'fim',
        },
        fim: {
          lines: [
            { who: 'NARRADOR', t: 'Depois que todo mundo dorme, você vê {oconj} na sala, medindo a mesa com a fita métrica. Para ver se a máquina cabe.' },
          ],
        },
      },
    },
    bico: {
      id: 'd04_bico',
      bg: 'sala',
      cast: ['ZELIA'],
      nodes: {
        start: {
          lines: [
            { who: 'NARRADOR', t: 'A noite na USA 01 não para: briga de bar, baleado de raspão, um menino picado por escorpião.' },
            { who: 'NARRADOR', t: 'Em casa, de madrugada, tem retalhos dobrados em cima da mesa da sala e o jornal com um anúncio circulado.' },
            { who: 'ZELIA', t: '(da poltrona, no escuro) {c:Ela|Ele} foi lá no bazar ver a tal máquina. Ficou meia hora passando a mão nela.' },
            { who: 'ZELIA', t: 'Voltou sem falar nada. Fez a janta, lavou a louça e foi dormir. Nem perguntou de você.' },
          ],
        },
      },
    },
    onBico: fx.add('lacos', -1, '{oconj} foi ver a máquina {c:sozinha|sozinho}'),
  },
});
