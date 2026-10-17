// =============================================================================
// DIA 15 — "O Show" (Manual p.15: múltiplas vítimas)
// Âncoras: Dona Cida, tumulto na saída do show (17:00, 14 vítimas, painel START),
// infarto durante o evento (precisa de uma USA guardada, ou do reforço regional).
// Pressão: pedidos de rádio em sequência entre 17:00 e 18:30.
// Antes do show: duas ligações de "passou mal no sol" com verdades diferentes.
// Casa: aniversário do Liam, "um dia inteiro com {m:o pai|a mãe}".
// Fios: 🌾 Juliana (filha do Seu Antônio, D3/D11) · ↺ café e Laços · 🌱 manga comprida (D16).
// 1.1 (ROTEIRO, dia 15): almoço em pé (pré-autorizar o reforço de Rio Claro → 18 min em vez de
// 28; ou o Bené na saída lateral → a USA 01 3 min mais perto); o Saulo abre dois leitos do quarto
// andar se `saulo_confianca ≥ 2` (R2); o Sgt. Rocha lembra do bar do Neno; a Taís voluntária; o
// aniversário por faixa × origem do dinheiro (3.1-e); o presente da Cida = o caderno de guardanapos
// do Seu Nestor (R5); o desenho escondido fica com a Dona Iolanda (3.3); trote sem risada; nomes.
// =============================================================================
import type { Ctx, SceneDef, DLine, SceneNode, MciVictim, ShiftScriptCtx, BillDef } from '../../engine/types';
import { day, call, fx, NUM, ADDR } from '../dsl';
import { addressTarget, route } from '../../engine/city/path';
import { aulas, faixa, origem, rua, saulo, vivoNoDiario, zeliaViva } from './arco';

const presente = (c: Ctx, m: 'lucia' | 'davi') => {
  const f = c.s.family[m];
  return f.status !== 'ausente' && f.status !== 'morto' && !f.away && !c.flag('lucia_fora') && !c.flag('lucia_foi_embora');
};
const longe = (c: Ctx) => c.flag('lucia_fora') && !c.flag('lucia_foi_embora');
const foiEmbora = (c: Ctx) => c.flag('lucia_foi_embora') || c.s.family.davi.status === 'ausente';
const noturnoFala = (c: Ctx) => (c.flag('denunciou_henrique') ? 'PAULA' : 'HENRIQUE');

/** tempo até o reforço de Rio Claro de Minas chegar ao Parque (igual ao mci.reinforcementMin) */
const REFORCO_MIN = 28;
/** com o reforço pré-autorizado no almoço, Rio Claro já sai antes: 18 min */
const REFORCO_PRE = 18;
const reforcoMin = (c: { flag(f: string): boolean }) => (c.flag('reforco_preautorizado') ? REFORCO_PRE : REFORCO_MIN);

// -----------------------------------------------------------------------------
// As 14 vítimas do tumulto (START: anda → verde; FR > 30, enchimento > 2 s ou
// não obedece → vermelho; o resto → amarelo). Sem pretas neste evento.
// -----------------------------------------------------------------------------
const VITIMAS: MciVictim[] = [
  // vermelhas (3)
  { id: 'juliana', name: 'Juliana Ferreira', age: 27, desc: 'Pisoteada na grade caída, perto do portão. Fala pouco, perde o ar no meio da frase, segura o lado esquerdo do peito', anda: false, respira: true, fr: 36, enchimento: 2, obedece: true, cor: 'vermelho', key: 'juliana' },
  { id: 'kevin', name: 'Kevin Souza', age: 19, desc: 'Prensado contra o alambrado. Pálido, suor frio, pele manchada, diz que está com muita sede', anda: false, respira: true, fr: 26, enchimento: 4, obedece: true, cor: 'vermelho' },
  { id: 'josue', name: 'Jurandir Ramos', age: 58, desc: 'Caiu de cabeça da arquibancada. Não abre o olho quando chamam, só geme e puxa o braço quando beliscam', anda: false, respira: true, fr: 16, enchimento: 2, obedece: false, cor: 'vermelho' },
  // amarelas (5)
  { id: 'larissa', name: 'Luana Prado', age: 23, desc: 'Tornozelo virado pra dentro, não apoia o pé. Conversa, chora de dor, pede o celular', anda: false, respira: true, fr: 22, enchimento: 1, obedece: true, cor: 'amarelo' },
  { id: 'edmilson', name: 'Edmilson Pinto', age: 40, desc: 'Braço direito torto abaixo do cotovelo. Sentado no gramado, segura o braço com a outra mão; tentou levantar e as pernas bambearam de dor', anda: false, respira: true, fr: 20, enchimento: 2, obedece: true, cor: 'amarelo' },
  { id: 'ryan', name: 'Ryan Oliveira', age: 16, desc: 'Corte fundo na coxa no arame do alambrado. Um amigo aperta com a camiseta, o sangue parou de escorrer', anda: false, respira: true, fr: 24, enchimento: 2, obedece: true, cor: 'amarelo' },
  { id: 'neusa', name: 'Cremilda Martins', age: 66, desc: 'Derrubada no empurra-empurra. Dor forte no quadril, não consegue levantar, pergunta pela neta', anda: false, respira: true, fr: 20, enchimento: 2, obedece: true, cor: 'amarelo' },
  { id: 'gilmar', name: 'Gilmar Nascimento', age: 35, desc: 'Segurança do evento, empurrado de costas contra a grade. Dor nas costas e formigamento nas pernas, mas mexe os pés', anda: false, respira: true, fr: 22, enchimento: 2, obedece: true, cor: 'amarelo' },
  // verdes (6)
  { id: 'enzo', name: 'Gael Barbosa', age: 12, desc: 'Cotovelo ralado, camiseta rasgada. Anda atrás da mãe pedindo pra voltar pro show', anda: true, respira: true, fr: 20, enchimento: 1, obedece: true, cor: 'verde' },
  { id: 'patricia', name: 'Rebeca Alves', age: 30, desc: 'Em pânico, chorando, diz que não consegue respirar. Anda de um lado pro outro procurando a amiga', anda: true, respira: true, fr: 34, enchimento: 1, obedece: true, cor: 'verde' },
  { id: 'wanderson', name: 'Wanderson Freire', age: 22, desc: 'Corte no supercílio, o rosto todo vermelho de sangue. Anda, conversa, quer tirar foto com a PM', anda: true, respira: true, fr: 18, enchimento: 1, obedece: true, cor: 'verde' },
  { id: 'raimundo', name: 'Raimundo Araújo', age: 45, desc: 'Torceu o pé na saída. Anda mancando sozinho, xingando o sapato novo', anda: true, respira: true, fr: 18, enchimento: 2, obedece: true, cor: 'verde' },
  { id: 'zuleide', name: 'Iraci Mendes', age: 70, desc: 'A pressão baixou no calor e ela sentou no meio-fio. Já levantou e anda sozinha até a sombra', anda: true, respira: true, fr: 18, enchimento: 2, obedece: true, cor: 'verde' },
  { id: 'amanda', name: 'Amanda Vieira', age: 18, desc: 'Desmaiou no aperto e já acordou. Anda, fala, lembra de tudo, só está tonta', anda: true, respira: true, fr: 20, enchimento: 1, obedece: true, cor: 'verde' },
];

/** o evento do Parque; `reinforcementMin` acompanha `reforco_preautorizado` (ajustado no início do dia,
 *  no almoço e às 16:55, sempre nos dois sentidos, para não vazar de uma campanha para outra) */
const MCI = { victims: VITIMAS, redWindow: 35, reinforcementMin: REFORCO_MIN, reinforcementUnits: 2 };
const ajustaReforco = (c: { flag(f: string): boolean }) => {
  MCI.reinforcementMin = reforcoMin(c);
};

// -----------------------------------------------------------------------------
// Scripts de pressão (17:00–18:40)
// -----------------------------------------------------------------------------
/** almoço: o Bené guarda a USA 01 na saída lateral do Parque (3 min mais perto da primeira vermelha) */
const saidaLateral = (c: ShiftScriptCtx) => {
  if (!c.flag('bene_saida_lateral') || c.sflag('saida_lateral')) return;
  const u = c.shift.units['USA01'];
  if (!u || u.status !== 'QRV') return;
  const r = route(u.pos, addressTarget(ADDR.parque), 'none', c.now);
  if (r.blocked || r.path.length < 2) return;
  const k = r.minutes > 3 ? Math.round(((r.path.length - 1) * 3) / r.minutes) : r.path.length - 1;
  const pt = r.path[Math.max(0, Math.min(r.path.length - 1, k))];
  u.pos = [pt[0], pt[1]];
  c.sflag('saida_lateral', true);
  c.radio('USA 01 · BENÉ', '{bene}, USA 01 QRV na esquina da saída lateral do Parque. De frente pra rua, de ré pro palco. Se precisar da cidade, eu volto.', 'info');
};
/** reforço pedido e chegado: libera uma USA da cidade que estava presa no evento */
const reforcoTroca = (c: ShiftScriptCtx) => {
  if (c.sflag('reforco_trocou') || !c.flag('mci_reforco')) return;
  const mci = c.callStatus('d15_mci');
  if (!mci?.decision || c.now < mci.decision.t + reforcoMin(c)) return;
  if (c.freeUnits('USA').length) return;
  const u = c.unitsOfType('USA').find((x) => x.callId === mci.id && (x.status === 'LOCAL' || x.status === 'RETIDO'));
  if (!u) return;
  const onde = u.status === 'LOCAL' ? 'no Parque' : 'na porta do Regional';
  c.sflag('reforco_trocou', true);
  c.setUnit(u.id, 'QRV');
  c.radio(u.radioName, `Central, ${u.label}. A USA de Rio Claro de Minas chegou ${onde} e assumiu a nossa vítima. Estamos QRV pra cidade.`, 'ok');
};

const julianaRadio = (c: ShiftScriptCtx) => {
  const m = c.callStatus('d15_mci');
  if (!m?.decision) return;
  const k = c.key('juliana');
  const u = c.unitsOfType('USA').find((x) => x.callId === m.id) ?? c.unitsOfType('USB').find((x) => x.callId === m.id);
  const from = u?.radioName ?? (c.flag('mci_reforco') ? 'REFORÇO · RIO CLARO' : 'COPOM · PM');
  if (k === 'salvo') {
    const pai = c.key('antonio') !== 'perdido';
    c.request(
      from,
      pai
        ? c.flag('juliana_sabe')
          ? 'Central, a moça da grade, a Juliana, tá estável. Quebrou costela, mas fala. Pediu pra avisar o pai, o Seu Antônio, da Vila Nova. E pediu pra dizer: "fala pro meu pai que foi a mesma central. Ele vai entender."'
          : 'Central, a moça da grade, a Juliana, tá estável. Quebrou costela, mas fala. Pediu pra avisar o pai, o Seu Antônio, da Vila Nova. Disse que ele é cardíaco e não pode saber pelo jornal.'
        : 'Central, a moça da grade, a Juliana, tá estável. Quebrou costela, mas fala. Pediu pra avisar a mãe, na Vila Nova. Disse que a mãe já perdeu o marido esse mês e não pode saber pelo jornal.',
      [
        {
          id: 'avisar',
          label: 'Pedir pra Simone ligar pra família (5 min)',
          cost: 5,
          effect: (cc) => {
            cc.set('juliana_pai_avisado');
            cc.add('humanidade', 1, 'avisou a família da Juliana');
          },
          reply: pai ? 'Central... a Simone conseguiu. O Seu Antônio tá indo pro Regional. Disse que conhece a voz da Regulação.' : 'Central... a Simone conseguiu. A mãe tá indo pro Regional.',
        },
        { id: 'nao', label: '"Agora não dá. A PM avisa."' },
      ],
      'nao',
      6,
    );
  } else if (k === 'perdido') {
    c.radio(
      from,
      c.flag('juliana_cliente')
        ? 'Central... a moça da grade não resistiu. Juliana. Tava com uma sacola de costura no braço... de um ateliê da Vila Esperança.'
        : 'Central... a moça da grade não resistiu. Juliana, vinte e sete anos. A PM tá procurando a família.',
      'obito',
    );
  }
};

const regionalLotado = (c: ShiftScriptCtx) => {
  if (c.sflag('regional_pedido')) return;
  const m = c.callStatus('d15_mci');
  if (!m?.decision) return;
  const u = Object.values(c.shift.units).find((x) => x.callId === m.id && x.status === 'RETIDO');
  if (!u) return;
  c.sflag('regional_pedido', true);
  if (saulo(c) >= 2) {
    // R2 (D15): com a confiança do Saulo, ele abre dois leitos do quarto andar por conta própria
    c.set('saulo_abriu_leitos');
    c.setUnit(u.id, 'QRV');
    c.radio(
      u.radioName,
      `Central, ${u.label} no Regional. O Dr. Saulo desceu no corredor, olhou a gente e abriu dois leitos do quarto andar "por conta própria", ele disse. Subiu direto. Estamos QRV.`,
      'ok',
    );
    return;
  }
  c.request(
    u.radioName,
    `Central, ${u.label} no Regional com vítima do show. Corredor lotado, sem maca. A gente tá preso aqui, sem previsão.`,
    [
      {
        id: 'negociar',
        label: 'Ligar pro Regional e negociar (15 min)',
        cost: 15,
        effect: (cc) => cc.setUnit(u.id, 'RETIDO', cc.now + 15, 'Retenção de maca · liberação negociada'),
        reply: `${u.label}: conseguiram uma maca. Liberação em quinze minutos.`,
      },
      { id: 'esperar', label: 'Não ligar' },
    ],
    'esperar',
    8,
  );
};

// -----------------------------------------------------------------------------
// Casa: aniversário do Liam
// O bolo segue a regra do dinheiro (ROTEIRO 3.1-e): aperto = fiado do Toninho; justo = pago à
// vista; folga = encomendado com a sirene que acende; sobra do envelope = dois andares de
// confeitaria; sobra das noites na ambulância = você dorme antes dos parabéns.
// -----------------------------------------------------------------------------
type Bolo = 'fiado' | 'vista' | 'sirene' | 'confeitaria' | 'sobra_bico';
function boloDoDia(c: Ctx): Bolo {
  const f = faixa(c);
  if (f === 'aperto') return 'fiado';
  if (f === 'justo') return 'vista';
  if (f === 'sobra' && origem(c) === 'vereador') return 'confeitaria';
  if (f === 'sobra' && origem(c) === 'bico') return 'sobra_bico';
  return 'sirene';
}
const BOLO_TEXTO: Record<Bolo, DLine[]> = {
  fiado: [{ who: 'NARRADOR', t: 'Tem bolo na mesa. De padaria, confeito azul, uma ambulância de plástico espetada no meio. {Oconj} comprou fiado no Seu Toninho.' }],
  vista: [
    { who: 'NARRADOR', t: 'Tem bolo na mesa. De padaria, confeito azul, uma ambulância de plástico espetada no meio.' },
    { who: 'LUCIA', t: 'Pago à vista. O Toninho até estranhou.', when: (c) => presente(c, 'lucia') },
  ],
  sirene: [
    { who: 'NARRADOR', t: 'Tem bolo na mesa, encomendado: uma ambulância de plástico em cima do glacê, com uma sirene de pilha que acende azul e vermelho.' },
    { who: 'DAVI', t: 'Ela acende! Ela ACENDE!' },
  ],
  confeitaria: [
    { who: 'NARRADOR', t: 'Tem um bolo de dois andares na mesa, de confeitaria do Centro, com o nome do Liam em açúcar dourado.' },
    { who: 'DAVI', t: 'É o maior da escola!' },
    { who: 'LUCIA', t: '(baixinho, sem sorriso) É o maior da escola.', when: (c) => presente(c, 'lucia') },
  ],
  sobra_bico: [{ who: 'NARRADOR', t: 'Tem bolo na mesa, encomendado: uma ambulância de plástico em cima do glacê, com uma sirene de pilha que acende.' }],
};
/** a conta do bolo acompanha o bolo (folga e sobra já vêm pagas: o dinheiro existe) */
const BOLO_CONTA: BillDef[] = [
  {
    id: 'bolo_davi',
    label: 'Bolo de aniversário do Liam',
    amount: 60,
    when: (c) => (!foiEmbora(c) || longe(c)) && (!presente(c, 'davi') || boloDoDia(c) === 'fiado' || boloDoDia(c) === 'vista'),
    desc: (c) => (!presente(c, 'davi') ? '{Oconj} comprou em Rio Claro e mandou a conta.' : boloDoDia(c) === 'vista' ? 'Pago à vista no Seu Toninho. Se não pagar agora, vira fiado.' : 'Fiado no caderno do Seu Toninho. "Paga quando der, doutor."'),
    onPay: fx.set('aniversario_pago'),
    onSkip: (e) => {
      e.set('aniversario_fiado');
      if (!presente(e, 'davi')) e.add('lacos', -1, '{oconj} pagou o bolo do bolso');
    },
  },
  {
    id: 'bolo_davi_encomenda',
    label: 'Bolo de aniversário do Liam (encomenda)',
    amount: (c) => (boloDoDia(c) === 'confeitaria' ? 180 : 90),
    auto: true,
    when: (c) => presente(c, 'davi') && boloDoDia(c) !== 'fiado' && boloDoDia(c) !== 'vista',
    desc: (c) => (boloDoDia(c) === 'confeitaria' ? 'Dois andares, confeitaria do Centro. Pago.' : 'Encomendado no Seu Toninho, com a sirene que acende. Pago.'),
    onPay: fx.set('aniversario_pago'),
  },
];

function cenaAniversario(c: Ctx): SceneDef {
  const irritado = c.s.irritado > 0;
  const D = presente(c, 'davi');
  const L = presente(c, 'lucia');
  const zelia = c.s.family.zelia.status !== 'morto';
  const apanhando = c.flag('marcia_morreu') && c.val<string>('d9_davi') === 'USA';
  const presenteCida = c.flag('cida_conversou_d15') || c.v('humanidade') >= 6;
  const julianaPerdida = c.key('juliana') === 'perdido' && c.flag('juliana_cliente');
  const escondeDesenho = irritado ? fx.set('davi_desenho_escondido') : undefined;
  const iolanda = aulas(c) >= 1;
  const bolo = boloDoDia(c);

  const promessaChoices = [
    { label: '"Domingo. O dia inteiro. Eu desligo o celular e a gente vai no campinho."', next: 'promessa', affectionate: true, effect: fx.all(fx.set('promessa_davi'), fx.add('lacos', 1, 'prometeu o domingo')) },
    { label: '"Filho, tem plantão... mas a gente dá um jeito."', next: 'jeito' },
    { label: '"Agora não, Liam. Eu tô {m:morto|morta} de cansaço."', next: 'cansado', when: () => irritado, effect: fx.add('lacos', -1, 'cortou o Liam no aniversário') },
  ];

  // ---- longe (Rio Claro de Minas) ou a família foi embora: por telefone
  if (!D) {
    const embora = foiEmbora(c) && !longe(c);
    const lines: DLine[] = embora
      ? [
          { who: 'NARRADOR', t: 'Aniversário do Liam. Você liga pra casa da irmã {doconj}. Quem atende é {c:ela|ele}.' },
          { who: 'LUCIA', t: '(no telefone) Ele tá aqui. Vou passar. Seja {m:rápido|rápida}, ele tá caindo de sono.' },
          { who: 'DAVI', t: '(no telefone) {Pai}... Oi.' },
        ]
      : [
          { who: 'NARRADOR', t: 'Aniversário do Liam, e ele está em Rio Claro de Minas, na casa da tia. Você liga às oito em ponto.' },
          { who: 'DAVI', t: '(no telefone) {Pai}! A tia fez bolo de chocolate! Cantaram parabéns. Faltou você.' },
        ];
    if (irritado) lines.push({ who: 'DAVI', t: 'Eu fiz um desenho pra você... deixa. Mostro outro dia.' }, { who: 'NARRADOR', t: 'Ele muda de assunto rápido demais.' });
    lines.push({ who: 'DAVI', t: 'Sabe o que eu quero de presente? Um dia inteiro com você. Quando eu voltar.' });
    return {
      id: 'd15_aniversario_tel',
      bg: 'sala',
      cast: ['DAVI'],
      nodes: {
        start: { lines, onEnter: escondeDesenho, choices: promessaChoices },
        promessa: { lines: [{ who: 'DAVI', t: 'Jura? Sem telefone? Nem se tocar?' }, { who: 'EU', t: 'Nem se tocar.' }], next: 'tel_fim' },
        jeito: { lines: [{ who: 'DAVI', t: 'Sempre tem plantão.' }, { who: 'NARRADOR', t: 'Ele não fala isso com raiva. Fala como quem já entendeu. É pior.' }], next: 'tel_fim' },
        cansado: { lines: [{ who: 'DAVI', t: 'Tá.' }, { who: 'NARRADOR', t: 'Ele passa o telefone {c:pra mãe|pro pai} sem se despedir.' }], next: 'tel_fim' },
        tel_fim: {
          lines: [
            { who: 'LUCIA', t: '(pegando o telefone) Ele ficou esperando a ligação desde as sete, {nome}. {c:Obrigada|Obrigado} por ligar.' },
            ...(zelia && presenteCida ? [{ who: 'ZELIA', t: '(da cozinha) A Cida mandou um caderno pro menino. Caderno velho, de capa dura, cheio de guardanapo colado. Guardei pra quando ele voltar.' }] : []),
          ],
        },
      },
    };
  }

  // ---- em casa
  const start: DLine[] = [...BOLO_TEXTO[bolo]];
  if (zelia) start.push({ who: 'ZELIA', t: 'Chegou atrasad{o}. Igualzinho no dia que ele nasceu.' });
  if (c.flag('foi_apresentacao')) start.push({ who: 'DAVI', t: 'Você foi na minha apresentação. Pode vir no meu aniversário também? ...Ah. Você veio.' });
  else start.push({ who: 'DAVI', t: 'Esse ano você veio!' });
  if (apanhando) start.push({ who: 'NARRADOR', t: 'Trinta e dois graus, e o Liam está de blusa de manga comprida.' });
  if (irritado) {
    start.push(
      { who: 'NARRADOR', t: 'O barulho da central ainda está na sua cabeça. O café da tarde queima no estômago. Você bate a porta sem querer.' },
      { who: 'DAVI', t: '{Pai}! Eu fiz... nada não.' },
      { who: 'NARRADOR', t: 'Ele esconde uma folha dobrada atrás das costas e sobe pro quarto. Desce sem ela.' },
    );
  } else {
    start.push(
      { who: 'DAVI', t: '{Pai}! Chegou! Fecha o olho, fecha o olho!' },
      { who: 'NARRADOR', t: 'Uma folha dobrada em quatro, com fita adesiva demais.' },
      { who: 'DAVI', t: 'Só abre depois do parabéns.' },
    );
  }
  start.push({ who: 'DAVI', t: 'Sabe o que eu quero de presente? Não é brinquedo.' }, { who: 'DAVI', t: 'Eu quero um dia inteiro com você. {m:O pai inteiro|A mãe inteira}. Sem telefone.' });

  const parabens: DLine[] = [];
  if (bolo === 'sobra_bico') parabens.push({ who: 'NARRADOR', t: 'Você senta na cadeira da cozinha "só um minuto" e acorda com todo mundo cantando. Dormiu antes dos parabéns. O Liam acha engraçado. {Oconj}, não.' });
  parabens.push({ who: 'NARRADOR', t: zelia ? 'Parabéns pra você, com a Dona Zélia meio tom acima de todo mundo.' : 'Parabéns pra você. A cadeira da Dona Zélia fica vazia na cabeceira, e todo mundo canta mais alto por causa disso.' });
  if (julianaPerdida && L) {
    parabens.push(
      { who: 'NARRADOR', t: 'No meio do bolo, o celular {doconj} vibra. {c:Ela|Ele} lê, sai da sala e volta com o olho vermelho.' },
      { who: 'LUCIA', t: '(baixinho) A Juliana. A minha primeira cliente. Ela tava no show.' },
    );
  }
  if (presenteCida) {
    parabens.push(
      zelia ? { who: 'ZELIA', t: 'Ah! A Cida mandou isso pela vizinha.' } : L ? { who: 'LUCIA', t: 'Chegou isso pela vizinha. É da Dona Cida.' } : { who: 'NARRADOR', t: 'A vizinha deixou um embrulho no portão. É da Dona Cida.' },
      { who: 'NARRADOR', t: 'Não é estojo. É um caderno de capa dura, gordo, cheio de guardanapos colados, cada um com um retrato a caneta. Bilhete com letra tremida: "Pro Liam, que desenha. Era do meu falecido. — Vó Cida."' },
      { who: 'DAVI', t: '(folheando, de boca aberta) É tudo gente de ônibus...' },
    );
  }
  if (c.flag('marcia_viva')) parabens.push({ who: 'NARRADOR', t: 'Na mochila dele, um cartão da escola: "Pro meu artista preferido. Tia Márcia."' });
  if (irritado) parabens.push({ who: 'NARRADOR', t: iolanda ? 'A folha dobrada não aparece mais. Não foi pro lixo: no sábado ela vai na mochila, pro 301 do Ed. Aurora, e fica com a Dona Iolanda.' : 'A folha dobrada não aparece mais. Nem naquela noite, nem depois.' });

  const nodes: Record<string, SceneNode> = {
    start: { lines: start, onEnter: escondeDesenho, choices: promessaChoices },
    promessa: {
      lines: [
        { who: 'DAVI', t: 'Jura? Sem telefone? Nem se tocar?' },
        { who: 'EU', t: 'Nem se tocar.' },
        ...(irritado ? [] : [{ who: 'NARRADOR', t: 'Depois do parabéns ele te entrega a folha: vocês dois num campinho de várzea, um sol enorme de óculos escuros. Nenhum telefone na sua mão.' }]),
      ],
      next: 'bolo',
    },
    jeito: {
      lines: [
        { who: 'DAVI', t: 'Sempre tem plantão.' },
        { who: 'NARRADOR', t: 'Ele não fala isso com raiva. Fala como quem já entendeu. É pior.' },
      ],
      next: 'bolo',
    },
    cansado: {
      lines: [
        { who: 'DAVI', t: 'Tá.' },
        { who: 'NARRADOR', t: 'Ele assopra as velas antes de alguém começar a cantar.' },
      ],
      next: 'bolo',
    },
    bolo: { lines: parabens },
  };
  const inspect = presenteCida
    ? {
        objects: [
          {
            id: 'caderno_nestor',
            label: 'O caderno da Dona Cida',
            desc: 'Retratos a caneta em guardanapo de bar: um cobrador cochilando, uma senhora com galinha no colo, um moleque de boné puxando palmas. Numa página do meio, um casal de costas no corredor de um ônibus, ele de joelho. Embaixo, a lápis: "Linha 12. Av. Brasil."',
            x: 150,
            y: 104,
            w: 34,
            h: 22,
            unlock: 'caderno_nestor',
            onFind: fx.set('caderno_nestor_visto'),
          },
        ],
        links: [],
      }
    : undefined;
  return { id: 'd15_aniversario', bg: 'cozinha', cast: ['DAVI', ...(L ? ['LUCIA'] : []), ...(zelia ? ['ZELIA'] : [])], nodes, inspect };
}

function bicoD15(c: Ctx): SceneDef {
  const D = presente(c, 'davi');
  return {
    id: 'd15_bico',
    bg: 'preto',
    nodes: {
      start: {
        lines: D
          ? [
              { who: 'NARRADOR', t: 'Você emenda a noite na ambulância no dia do aniversário do Liam. Sexta-feira de show: o rádio não para com gente do Parque.' },
              { who: 'NARRADOR', t: 'Quando você chega, de madrugada, o bolo está na geladeira com um pedaço a menos. Do lado, uma vela apagada.' },
              { who: 'NARRADOR', t: 'No seu travesseiro, uma folha dobrada em quatro, com fita adesiva demais: vocês dois num campinho, um sol enorme. Embaixo, em letra caprichada: "UM DIA INTEIRO".' },
            ]
          : [
              { who: 'NARRADOR', t: 'Você emenda a noite na ambulância no dia do aniversário do Liam.' },
              { who: 'NARRADOR', t: 'O celular tem três chamadas perdidas de Rio Claro: às oito, às oito e meia e às nove. E um áudio de dez segundos: "Parabéns pra mim."' },
            ],
      },
    },
  };
}

// -----------------------------------------------------------------------------
// Almoço (almoco.md, D15 — "Vinte mil pessoas, uma saída"). Só uma das duas preparações.
// -----------------------------------------------------------------------------
function almocoD15(c: Ctx): SceneDef {
  void c;
  return {
    id: 'd15_almoco',
    bg: 'central',
    cast: ['SIMONE'],
    nodes: {
      start: {
        lines: [
          { who: 'NARRADOR', t: '13:00. Sexta da Expo. O almoço é em pé, encostado na pia da copa. Pela janela, o Bené enche a garrafa térmica no filtro do pátio.' },
          { who: 'BENÉ', t: 'Uma saída, {bene}. Vinte mil pessoas e uma saída. Eu já vi grade cair em rodeio. Cai pra frente.' },
          { who: 'SIMONE', t: 'Meu sobrinho foi às sete pra pegar grade. Sem boné. Mandou foto da fila. Vai sobrar pra gente.' },
          { who: 'CASTRO', t: 'Se cair, a gente vai precisar de Rio Claro antes de precisar.' },
          { who: 'NARRADOR', t: 'A porta da coordenação está aberta. O Peixoto finge que não está ouvindo.' },
        ],
        choices: [
          { label: '"Peixoto, pré-autoriza o reforço de Rio Claro agora."', next: 'peixoto' },
          { label: '"Bené, guarda a USA 01 pra mim na saída lateral."', next: 'lateral', effect: fx.set('bene_saida_lateral') },
          { label: 'Comer quieto.', next: 'quieto' },
        ],
      },
      peixoto: {
        lines: [{ who: 'DR. PEIXOTO', t: '(da porta) Agora? Antes de acontecer? Isso custa diária de viatura parada, {dr}. Rio Claro cobra até o cafezinho.' }],
        choices: [
          {
            label: '"Custa menos que catorze vítimas."',
            next: 'assina',
            effect: (e) => {
              e.set('reforco_preautorizado');
              ajustaReforco(e);
            },
          },
          { label: '"Então deixa."', next: 'deixa' },
        ],
      },
      assina: {
        lines: [
          { who: 'NARRADOR', t: 'O Peixoto olha pra você um tempo comprido. Depois assina um formulário em cima do micro-ondas, com a caneta da planilha.' },
          { who: 'DR. PEIXOTO', t: 'Catorze. Você chutou um número bonito. Se não acontecer nada, essa diária sai do seu índice.' },
          { who: 'BENÉ', t: '(da janela) Tomara que saia, {bene}. Tomara que saia.' },
        ],
      },
      deixa: { lines: [{ who: 'DR. PEIXOTO', t: 'Se acontecer, você pede. Pedir depois é mais barato. (ele fecha a porta)' }] },
      lateral: {
        lines: [
          { who: 'BENÉ', t: 'Saída lateral eu conheço. Fico de frente pra rua, de ré pro palco. A partir das três.' },
          { who: 'BENÉ', t: 'Se a cidade precisar de mim antes, me chama que eu volto. Ninguém fica sem a 01 por causa de show.' },
        ],
      },
      quieto: { lines: [{ who: 'NARRADOR', t: 'Vocês comem em pé, olhando o pátio. O feijão da Simone está bom. Ninguém fala disso.' }] },
    },
  };
}

// -----------------------------------------------------------------------------
export const DAY = day({
  day: 15,
  title: 'O Show',
  weekday: 'Sexta-feira',
  weather: 'Sol forte, 32 °C. Expo Aurora no Parque de Exposições.',
  goal: { maxUSA: 4, bonus: 30 },
  onStart: (e) => ajustaReforco(e),
  newspaper: (c) => {
    const cic = c.flag('d14_ciclista_obito') ? 'obito' : c.flag('d14_ciclista_vivo') ? 'vivo' : '';
    const pre = c.flag('d14_preeclampsia_obito') ? 'obito' : c.flag('d14_preeclampsia_viva') ? 'viva' : '';
    return {
      headline: 'Expo Aurora: 20 mil pessoas esperadas no show de hoje',
      sub: 'Show gratuito das 13h às 17h no Parque de Exposições. Uma saída principal, pela Rua do Parque. PM promete efetivo reforçado.',
      photo: 'show',
      stories: [
        cic === 'obito'
          ? { title: 'Ciclista morre atropelado na Beira-Rio', text: 'O motorista fugiu sem prestar socorro. A polícia procura um carro prata com o para-choque amassado.' }
          : cic === 'vivo'
            ? { title: 'Ciclista atropelado na Beira-Rio sobrevive', text: 'O motorista fugiu. Um pescador apertou a coxa da vítima, orientado pela Regulação por telefone, até a ambulância chegar.' }
            : { title: 'Beira-Rio: atropelamento com fuga', text: 'Um ciclista foi atingido em frente ao pesqueiro. A polícia procura o motorista.' },
        pre === 'viva'
          ? { title: 'Gestante de alto risco é salva na Maternidade', text: 'Mirela, 24 anos, chegou com pressão de 17 por 11. "Eu achei que era o calor", disse. Mãe e bebê passam bem.' }
          : pre === 'obito'
            ? { title: 'Jovem grávida morre na Vila Nova', text: 'A gestante de 24 anos teve convulsões em casa. O bebê nasceu prematuro e está na UTI neonatal.' }
            : { title: 'Pré-natal: pressão alta exige atenção', text: 'Dor de cabeça forte e visão "brilhando" na gravidez são sinal de alerta, lembra a Secretaria.' },
        c.val<string>('depoimento') === 'aceitou'
          ? { title: 'Gazeta recebe relatos de dentro da Regulação', text: 'Servidores da Central de Regulação procuraram a reportagem. A Saúde+ Gestão diz que "não comenta boatos".' }
          : { title: 'Saúde+ Gestão: frota é "suficiente"', text: 'Em nota, a OS afirma que o tempo médio de resposta das ambulâncias "está dentro dos parâmetros".' },
      ],
      notice: 'Nova página no Manual: p.15 — Múltiplas vítimas (triagem START, reforço regional).',
      ad: 'EXPO AURORA — chapéu de peão com 30% de desconto na entrada do Parque. Leve água.',
      weather: 'Sol forte · 32 °C',
    };
  },
  handover: (c) => ({
    id: 'd15_passagem',
    bg: 'central',
    nodes: {
      start: {
        lines: [
          { who: 'NARRADOR', t: '07:00. Sexta-feira de Expo Aurora. Da janela da central dá pra ver as carretas de som subindo a Av. Brasil.' },
          { who: noturnoFala(c), t: 'Noite tranquila. Hoje à tarde é que vai ser. Show de graça, vinte mil pessoas, uma saída só. Boa sorte.' },
          { who: 'SIMONE', t: 'Meu sobrinho vai. Já falei: se apertar, sai pela lateral. Ninguém escuta a tia.' },
        ],
      },
    },
  }),
  timeline: [
    { at: '07:02', kind: 'radio', who: 'COPOM · PM', text: 'Central, PM informa: Expo Aurora hoje, show gratuito das 13h às 17h no Parque de Exposições. Público estimado em vinte mil pessoas.' },
    { at: '15:00', kind: 'script', id: 'saida_lateral', run: saidaLateral },
    {
      at: '16:40',
      kind: 'interfone',
      who: 'DR. PEIXOTO',
      text: (c) =>
        c.flag('reforco_preautorizado')
          ? '{Dr}, o show acaba às cinco. O reforço de Rio Claro tá assinado desde o almoço, com diária e tudo. Se der confusão: Manual, página 15. Não me faz arrepender.'
          : '{Dr}, o show acaba às cinco. Se der confusão: Manual, página 15. Limite de viaturas por evento. Não me esvazia a cidade. Se precisar, pede reforço pra Regional de Rio Claro. Eu assino.',
    },
    { at: '16:55', kind: 'script', id: 'reforco_tempo', run: (c) => ajustaReforco(c) },
    { at: '17:01', kind: 'radio', who: 'COPOM/193', text: 'Corpo de Bombeiros a caminho do Parque de Exposições: tumulto na saída do show, grade derrubada, várias vítimas.' },
    {
      at: '17:06',
      kind: 'radio',
      who: 'PM · SGT. ROCHA',
      when: (c) => c.flag('d4_pm_tardia'),
      text: 'Central, Sargento Rocha de novo. Foi {o} {dr} que pediu a gente atrasado no bar do Neno, no dia seis? Hoje a gente já veio junto. Pode mandar a equipe entrar.',
    },
    {
      at: '17:18',
      kind: 'radio',
      who: 'PM · SGT. ROCHA',
      when: (c) => vivoNoDiario(c, 'd05_academia'),
      text: 'Central, tem uma moça de enfermagem aqui, voluntária, que diz que já fez massagem num dono de academia. Taís. Tá segurando o tornozelo de uma menina e acalmando os verdes. Deixo?',
    },
    {
      at: '17:12',
      kind: 'pedido',
      who: 'PM · SGT. ROCHA',
      text: 'Central, Sargento Rocha. Tem um pai querendo levar o filho de carro pra UPA. O menino anda e fala, cortou o braço no alambrado. Eu libero?',
      options: [
        { id: 'libera', label: '"Libera. Quem anda vai por meios próprios." (START)', reply: 'Positivo. Liberando os que andam pela saída lateral.' },
        { id: 'segura', label: '"Segura todo mundo até chegar viatura."', reply: 'Central... tá difícil segurar o povo aqui. Vou tentar.', effect: (c) => c.add('desgaste', 2, 'tumulto') },
      ],
      defaultOption: 'segura',
      timeout: 6,
    },
    {
      at: '17:25',
      kind: 'script',
      id: 'cobranca',
      run: (c) => {
        const m = c.callStatus('d15_mci');
        if (m && !m.decision) c.modal('SIMONE', '{Dr}! O sargento ligou de novo na outra linha. Perguntou se a gente esqueceu deles no Parque.', 'simone');
      },
    },
    { at: '17:35', kind: 'script', id: 'reforco1', run: reforcoTroca },
    { at: '17:45', kind: 'script', id: 'juliana', run: julianaRadio },
    { at: '17:52', kind: 'script', id: 'reforco2', run: reforcoTroca },
    { at: '18:16', kind: 'script', id: 'regional', run: regionalLotado },
    { at: '18:12', kind: 'script', id: 'reforco3', run: reforcoTroca },
    { at: '18:28', kind: 'script', id: 'reforco4', run: reforcoTroca },
    { at: '18:36', kind: 'script', id: 'regional2', run: regionalLotado },
    {
      at: '18:45',
      kind: 'script',
      id: 'encerramento',
      run: (c) => {
        const m = c.callStatus('d15_mci');
        if (m?.decision) c.radio('COPOM · PM', 'Central, Sargento Rocha. O último ferido saiu do Parque. Obrigado pelo apoio, {dr}. Foi feio. Mas foi.', 'info');
      },
    },
  ],
  calls: [
    // ------------------------------------------------------------------ 1 FRATURA
    call({
      id: 'd15_fratura',
      ref: 'D15 #1',
      at: '07:50',
      pool: 'trauma_moderado',
      num: '(17) 3323-1620',
      caller: 'Seu Ademar',
      callerName: 'Seu Ademar',
      type: 'minimizador',
      voice: 'idoso',
      note: 'Senhor caiu da escada. Braço machucado.',
      noteWrong: 'Senhor caiu. Diz que não é nada.',
      addr: { rua: 'Rua Minas Gerais', n: 1620, bairro: 'Distrito Industrial', ref: 'Casa com uma oficina de bicicleta na frente.' },
      amb: ['radio_am'],
      open: ['Bom dia, {dr}. Caí da escadinha arrumando a calha. {{O braço ficou meio torto|torto}}, mas não é nada não. Queria saber se posso ir de bicicleta pro posto.'],
      q: {
        oque: 'A escadinha escorregou. Caí em cima do braço esquerdo.',
        consciencia: 'Lúcido, lúcido.',
        respira: 'Normal.',
        idade: 'Setenta e quatro.',
        sangramento: 'Não sangra. Tá {{inchando e roxo, com um degrau no meio|degrau}}.',
        historico: 'Pressão. Tomo o remédio.',
        inicio: 'Faz meia hora. Tomei café primeiro, pra ver se passava.',
        paciente: 'Sou eu mesmo. Moro sozinho desde que a patroa faleceu.',
        seguranca: 'Seguro.',
      },
      extra: [
        { id: 'cabeca', label: 'Bateu a cabeça?', say: 'O senhor bateu a cabeça? Desmaiou?', a: 'Cabeça não. Caí sentado e apoiei o braço. Lembro de tudo, até do palavrão.' },
        { id: 'dedos', label: 'Mexe os dedos?', say: 'O senhor mexe os dedos? A mão está fria?', a: 'Mexo, devagar. A mão tá quente. Dói pra caramba.' },
      ],
      links: [
        { a: 'degrau', b: 'manual:amarelo', insight: 'Braço com degrau e deformidade depois da queda, em idoso: fratura. Amarelo → USB → UPA (Manual p.1 e 9-A).' },
        { a: 'torto', b: 'degrau', insight: '"Não é nada"... e tem um degrau no meio do braço. Ele quer ir de bicicleta. Minimizador.' },
      ],
      patient: { name: 'Ademar Fonseca', age: 74, sex: 'M' },
      truth: { dx: 'Fratura de antebraço (queda de escada)', sev: 'amarelo', ok: ['USB'], dest: ['UPA'], risk: { good: 120, bad: 300, needs: 'USB' } },
      radio: {
        ok: 'Central, {unit}. Fratura de antebraço com desvio. Imobilizado. Ele queria trazer a bicicleta junto. Seguimos UPA.',
        excess: '{central}, {unit}. Fratura simples de braço, {dr}, estável. Dava USB.',
      },
      diary: { alive: 'Calha, escadinha, braço com um degrau. Queria ir de bicicleta pro posto.' },
    }),
    // ------------------------------------------------------------------ 2 ★ CIDA
    call({
      id: 'd15_cida',
      ref: 'D15 #2',
      at: '09:15',
      anchor: true,
      num: NUM.cida,
      caller: 'Dona Cida',
      callerName: 'Dona Cida',
      type: 'frequentador',
      voice: 'cida',
      note: 'Dona Cida. Dor nas costas.',
      noteFixed: true,
      addr: ADDR.cida,
      amb: ['tv', 'musica'],
      open: (c) => [
        'Oi {meu} {filho}, é a Cida! Bom dia! Ó, {{varri o quintal inteiro e travou as costas|costas}}. Fiquei torta igual um ponto de interrogação! [risada]',
        zeliaViva(c)
          ? 'E hoje tem show no Parque, você vai? Eu ia, mas a Zélia disse que é {{muito empurra-empurra|empurra}}, que velha não tem que ir.'
          : 'E hoje tem show no Parque, você vai? Eu ia, mas é {{muito empurra-empurra|empurra}}. A sua mãe ia dizer que velha não tem que ir.',
      ],
      q: {
        oque: 'Abaixei pra pegar a pá e ploft. Travou aqui embaixo, na cintura.',
        consciencia: 'Acordadíssima!',
        respira: 'Respiro bem.',
        idade: 'Setenta e nove.',
        inicio: 'Agora cedo, umas sete.',
        historico: 'Pressão. E agora as costas, né.',
        dorpeito: 'No peito não, {meu} {filho}. É embaixo, nas costas. Dói pra abaixar.',
        paciente: 'Sou eu mesma! Torta, mas eu mesma.',
        sangramento: 'Não.',
      },
      extra: [
        {
          id: 'sinais',
          label: 'Formigamento? Xixi? Febre?',
          say: 'A dor desce pras pernas? Formiga? Tem dificuldade pra fazer xixi? Febre?',
          a: '{{Nada disso. Só dói quando eu mexo|sem_alarme}}. Parada, não dói.',
        },
        {
          id: 'conversar',
          kind: 'fala',
          label: 'Conversar um pouco com ela',
          cost: 15,
          say: 'E a senhora, Dona Cida, além das costas? Vai acompanhar o show?',
          a: (c) => [
            zeliaViva(c) ? 'Vou ouvir no rádio, que a TV tá com fantasma. Ah, e hoje é aniversário do Liam, né? A Zélia me contou!' : 'Vou ouvir no rádio, que a TV tá com fantasma. Ah, e hoje é aniversário do Liam, né? Tá anotado na minha folhinha desde o grupo.',
            'Mandei um presentinho pela vizinha de vocês. Uma coisa do meu falecido, o Nestor. Ele ia gostar de saber que foi pra um menino que desenha. Não abre antes da hora, hein?',
            ...(c.flag('lucia_fora') || c.flag('lucia_foi_embora') ? ['A Zélia disse que ele tá longe, com {c:a mãe|o pai}... Liga pra ele, {meu} {filho}. Aniversário longe é aniversário pela metade.'] : []),
          ],
          onAsk: fx.all(fx.add('humanidade', 1, 'conversou com a Dona Cida'), fx.set('cida_conversou_d15')),
        },
      ],
      links: [
        // Conferido (RC15: sem déficit, formigamento, alteração urinária, febre ou trauma, dor só ao mexer → orientação).
        { a: 'costas', b: 'sem_alarme', kind: 'confirma', insight: 'Dor nas costas depois de esforço, sem formigamento, febre ou problema pra urinar: dor muscular. Orientação: repouso relativo, calor local, UBS.' },
      ],
      onAnswer: fx.set('cida_ligou_d15'),
      patient: { name: 'Aparecida (Dona Cida)', age: 79, sex: 'F' },
      truth: { dx: 'Dor lombar mecânica (travou as costas)', sev: 'verde', ok: ['ORI'], ref: ['UBS', 'CASA'] },
      diary: {
        ori: 'Travou as costas varrendo o quintal. Lembrou do aniversário do Liam antes de mim.',
        alive: 'Mandei viatura pras costas da Dona Cida. Ela ofereceu bolo pra equipe.',
      },
    }),
    // ------------------------------------------------------------------ 3 DESMAIO NA FILA (mesma abertura, verde)
    call({
      id: 'd15_fila',
      ref: 'D15 extra',
      at: '11:10',
      pool: 'leve',
      num: '(17) 99733-1180',
      caller: 'Jéssica (amiga)',
      callerName: 'Jéssica',
      type: 'testemunha',
      voice: 'jovem_m',
      note: 'Moça desmaiou na fila do show.',
      noteWrong: 'Desmaio na fila do show! Parece grave!',
      addr: { rua: 'Rua dos Expositores', n: 1180, bairro: 'Parque das Exposições', ref: 'Fila do portão B do Parque, do lado da barraca de churrasquinho.' },
      amb: ['multidao', 'musica'],
      open: [
        'Oi! Minha amiga {{desmaiou aqui na fila do show|desmaiou}}! A gente tá aqui desde as sete da manhã, no sol!',
        'Ela já {{acordou, tá falando comigo|acordou}}, mas tá branca!',
      ],
      q: {
        oque: 'Ela ficou tonta, a vista escureceu e ela sentou no chão. Apagou uns segundinhos.',
        consciencia: 'Acordada. Xingando o sol.',
        respira: 'Respira normal.',
        idade: 'Dezenove.',
        inicio: 'Agora, uns cinco minutos.',
        historico: 'Nada. {{Ela não tomou café, só cerveja|sem_cafe}}. Ninguém tomou, né, a gente queria pegar grade.',
        sangramento: 'Ralou o joelho quando sentou. Pouquinho.',
        gestacao: ['ABIGAIL: Grávida? Não, {m:moço|moça}! Nem namorado eu tenho!', '[risadas das amigas]'],
        paciente: 'ABIGAIL: Tô bem, tô bem... só tonta. {{Tô suando, mas tô boa|suando}}. Não quero sair da fila!',
        seguranca: 'Seguro, tem PM pra todo lado.',
      },
      extra: [
        { id: 'confusa', label: 'Confusa? Pele quente e seca?', say: 'Ela está confusa? A pele está quente e seca, ou suando? Vomitou?', a: 'Confusa não, ela sabe até o nome do cantor. Tá suando que nem tampa de panela. Não vomitou.' },
      ],
      links: [
        { a: 'acordou', b: 'suando', insight: 'Desmaiou, acordou logo, suando, lúcida, sem comer e no sol: desmaio por calor e jejum. Orientação: sombra, água, comer.' },
        { a: 'desmaiou', b: 'manual:verde', insight: 'Desmaio rápido, já acordada e falando normalmente: caso leve. UPA só se não melhorar (Manual p.1).' },
      ],
      patient: { name: 'Abigail Rodrigues', age: 19, sex: 'F' },
      // RC20: desmaio testemunhado = "história de inconsciência" → USI/USB. Vasovagal por calor e jejum (pródromo,
      // segundos, lúcida, sem vômito): orientação preferida (sombra, água, comer; UPA se não melhorar), USB ⚖ (antes
      // era excesso), como em d08_onibus.
      truth: { dx: 'Desmaio por calor e jejum (recuperada)', sev: 'verde', ok: ['ORI', 'USB'], best: 'ORI', ref: ['UPA', 'CASA'], dest: ['UPA'] },
      radio: {
        ok: '{central}, {unit}. Moça de 19 anos, já corada, pressão boa, comendo churrasquinho. Não quis sair da fila, {dr}: assinou a recusa de remoção.',
        excess: '{central}, {unit}. Moça de 19 anos, ótima, comendo churrasquinho. Não quis sair da fila, {dr}.',
      },
      diary: {
        ori: 'Desmaio na fila do show: sol, cerveja e nada de café. Voltou pra fila.',
        alive: 'Desmaio na fila do show: sol, cerveja e nada de café. A equipe avaliou; ela assinou a recusa e voltou pra fila.',
      },
    }),
    // ------------------------------------------------------------------ 4 INSOLAÇÃO GRAVE (mesma abertura, vermelho)
    call({
      id: 'd15_insolacao',
      ref: 'D15 extra',
      at: '13:40',
      pool: 'grave',
      num: '(17) 99821-1450',
      caller: 'Douglas (primo)',
      callerName: 'Douglas',
      type: 'testemunha',
      voice: 'jovem_h',
      note: 'Rapaz passando mal no sol, no show.',
      noteWrong: 'Bêbado passando mal no show. Coisa leve.',
      addr: { rua: 'Rua do Parque', n: 1450, bairro: 'Parque das Exposições', ref: 'Estacionamento do Parque, do lado do caminhão de som.' },
      amb: ['musica', 'multidao'],
      open: [
        '{m:Moço|Moça}, meu primo tá passando mal aqui no estacionamento do Parque! Ele {{tá falando coisa com coisa|confuso}}, tá {{andando torto|cambaleando}}!',
        'A gente bebeu umas, mas ele não é de ficar assim não!',
      ],
      q: {
        oque: 'A gente tá no sol desde as nove, guardando lugar. Ele bebeu cerveja, dançou, e agora não fala coisa com coisa.',
        consciencia: 'Acordado... mas não sabe onde tá. {{Me chamou pelo nome do meu irmão|nao_reconhece}}.',
        respira: 'Respira rápido.',
        idade: 'Vinte e três.',
        inicio: 'Faz uns vinte minutos que ficou assim. Piorando.',
        historico: 'Nada. Atleta, joga bola toda semana.',
        sangramento: 'Não.',
        paciente: ['MATHEUS: Que dia é hoje... cadê o palco...', '[ele balbucia alguma coisa sem sentido]', 'Viu? Tá assim.'],
        seguranca: 'Seguro.',
        pele: ['Vermelho que nem pimentão.', 'Encostei: {{tá pelando, mas seco! Parou de suar|pele_seca}}.'],
        pulso: 'Tá batendo rápido, {dr}. Muito rápido.',
      },
      extra: [
        { id: 'vomitou', label: 'Vomitou? Convulsionou?', say: 'Ele vomitou? Teve tremedeira, convulsão?', a: 'Vomitou duas vezes. Tremer não tremeu.' },
        {
          id: 'resfriar',
          kind: 'fala',
          label: 'Orientar: sombra e resfriar',
          // Conferido (sem página de campo para calor: sombra, tirar a roupa, molhar e abanar é o resfriamento por
          // evaporação dos primeiros socorros; nada pela boca com a consciência alterada).
          say: 'Levem ele pra sombra agora. Tirem a camisa, molhem o corpo com água e abanem. Não deem nada pra beber se ele estiver confuso.',
          a: 'Tá, tá! Puxamos ele pra sombra do caminhão de som. Tô jogando água e abanando com o boné.',
        },
      ],
      links: [
        { a: 'pele_seca', b: 'confuso', insight: 'Confuso, pele quente e seca, que parou de suar, depois de horas no sol: insolação grave (intermação). Não é só bebida. Vermelho.' },
        { a: 'nao_reconhece', b: 'manual:vermelho', insight: 'Confusão e alteração de consciência: risco imediato de morte. USA (Manual p.1).' },
      ],
      patient: { name: 'Matheus Soares', age: 23, sex: 'M' },
      // Conferido (RM4: alteração importante da consciência e da temperatura = vermelho → USA). A janela de risco é
      // balanceamento de jogo.
      truth: { dx: 'Insolação grave (intermação)', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 50, bad: 120 } },
      radio: {
        ok: '{central}, {unit} no local. Temperatura de 41, confuso, desidratado. Resfriando e hidratando. Seguimos Regional.',
        under: 'Central, {unit}! Hipertermia grave, rebaixando! Precisamos de USA!',
        dead: 'Central... {unit}. Convulsionou e parou. Óbito às {hora}. Vinte e três anos.',
        dismissed: '{m:Moço|Moça}! Ele caiu e tá tremendo todo! Ele não acorda!',
      },
      diary: {
        alive: 'Seis horas no sol guardando lugar no show. A pele parou de suar. Chegou a tempo.',
        dead: 'Seis horas no sol guardando lugar no show. Vinte e três anos.',
      },
    }),
    // ------------------------------------------------------------------ 5 ★ MÚLTIPLAS VÍTIMAS
    call({
      id: 'd15_mci',
      ref: 'D15 #3 ★ MÚLTIPLAS VÍTIMAS',
      at: '17:00',
      anchor: true,
      num: '(17) 3321-0190',
      caller: 'Sargento Rocha (PM)',
      callerName: 'Sgt. Rocha',
      type: 'profissional',
      voice: 'profissional',
      note: 'PM no Parque de Exposições. Tumulto na saída do show. MUITAS vítimas.',
      noteFixed: true,
      addr: ADDR.parque,
      amb: ['multidao', 'gritos', 'sirene'],
      special: 'mci',
      open: [
        'Central, aqui é o Sargento Rocha, da PM, no portão principal do Parque de Exposições. {{Caiu a grade da saída no fim do show|grade}} e o povo passou por cima.',
        '[{{multidão, gritos, apito, uma sirene da PM chegando|multidao}}]',
        'Contando por alto, {{tenho umas quatorze vítimas no chão|quatorze}}. {{Tem gente andando ferida|anda_ferido}}, tem gente que não levanta. Preciso de tudo o que vocês tiverem!',
      ],
      q: {
        oque: 'Acabou o show, abriram só o portão principal, a grade cedeu no empurra-empurra. Foi coisa de um minuto.',
        consciencia: 'Tem de tudo, {dr}. Uns gritando, uns sentados chorando, {{um senhor que não abre o olho|nao_abre_olho}}.',
        respira: 'Uma moça perto da grade tá {{respirando que nem cachorro cansado, rápido e curto|fr_alta}}.',
        sangramento: 'Uns cortes feios no alambrado. Um rapaz com o rosto todo vermelho de sangue, mas ele tá andando, conversando.',
        idade: 'De criança a idoso. Era show de família.',
        historico: 'Não dá pra saber, é muita gente.',
        paciente: 'Tô com o rádio na mão e uma moça pisoteada do meu lado. Ela fala, mas fala pouco: perde o ar.',
        seguranca: 'A PM isolou a grade caída. O povo ainda tá saindo pela lateral. Área segura pra equipe entrar pela Rua do Parque.',
        referencia: 'Portão principal, Rua do Parque, 1201. As viaturas entram pela lateral, que eu deixei aberta.',
        inicio: 'Agora. Cinco da tarde em ponto.',
      },
      extra: [
        { id: 'quantos', label: 'Quantos não andam?', say: 'Quantas vítimas não conseguem andar?', a: 'Contei oito que não levantam. O resto tá andando, chorando, sentado no meio-fio.' },
        { id: 'bombeiros', label: 'Bombeiros no local?', say: 'Os Bombeiros já chegaram?', a: 'Uma viatura do Corpo de Bombeiros acabou de chegar. Tão ajudando a separar os feridos do povo.' },
      ],
      links: [
        { a: 'quatorze', b: 'manual:reforco', insight: 'Quatorze vítimas pra 2 USA e 4 USB: evento de múltiplas vítimas. Triagem START e pedido de reforço regional; se der, preserve uma USA pra cidade (Manual p.15).' },
        { a: 'anda_ferido', b: 'manual:start_verde', insight: 'Quem anda sozinho é VERDE: UPA por meios próprios, mesmo com o rosto sangrando (Manual p.15).' },
        { a: 'fr_alta', b: 'manual:start_vermelho', insight: 'Respira mais de 30 por minuto, não obedece ou enchimento lento: VERMELHO, USA (Manual p.15).' },
        { a: 'nao_abre_olho', b: 'manual:start_vermelho', insight: 'Não abre o olho, não obedece comando: VERMELHO, mesmo respirando (Manual p.15).' },
      ],
      mci: MCI,
      // se ninguém regular o evento até as 19:00, as vítimas graves morrem no gramado
      nightDeath: true,
      onResolve: (e, r) => {
        if (r.outcome === 'obito' && !e.val('mci_sem_obitos') && e.key('juliana') === undefined) e.keyPatient('juliana', 'perdido');
      },
      patient: { name: 'Vítimas do tumulto no Parque de Exposições' },
      truth: { dx: 'Múltiplas vítimas', sev: 'vermelho', ok: ['USA'], sup: ['PM'], dest: ['REG'] },
      diary: { dead: 'Tumulto no show. A triagem não aconteceu a tempo: as vítimas graves esperaram no gramado do Parque.' },
    }),
    // ------------------------------------------------------------------ 6 ★ INFARTO DURANTE O EVENTO
    call({
      id: 'd15_infarto',
      ref: 'D15 #4 ★',
      at: '17:20',
      anchor: true,
      num: '(17) 3322-0640',
      caller: 'Dona Dalva (esposa)',
      callerName: 'Dona Dalva',
      type: 'comum',
      voice: 'idosa',
      note: 'Senhor de 70, dor no peito. Em casa, Santa Luzia.',
      noteFixed: true,
      addr: { rua: 'Rua Paineira', n: 640, bairro: 'Santa Luzia', ref: 'Casa de esquina com a Goiás, portão de madeira.' },
      amb: ['radio_am', 'ventilador'],
      open: [
        '{m:Moço|Moça}, o rádio tá falando do tumulto no show, eu sei que vocês tão ocupados... mas o meu marido tá com {{uma dor no peito que não passa|dor_peito}}.',
        'ERNESTO: Não precisa, Dalva... {{deve ser o pastel da feira|pastel}}...',
      ],
      q: {
        dorpeito: ['{{Vai pro braço esquerdo e pras costas|irradia}}. E ele tá {{suando frio, molhado|suor}}.', 'ERNESTO: Aperta... parece um elefante sentado.'],
        oque: 'Ele tava ouvindo a transmissão do show no rádio, deitado no sofá. Aí sentou de repente, branco.',
        inicio: 'Faz uns vinte minutos. Começou junto com a notícia do tumulto. Ele ficou nervoso: o neto tava lá.',
        idade: 'Setenta.',
        historico: 'Pressão alta. Diabetes. {{Fumou cinquenta anos|fumou}}.',
        consciencia: 'Acordado, falando. Pálido.',
        respira: 'Respira curtinho.',
        paciente: 'ERNESTO: Desculpa, {m:moço|moça}... deve ser o pastel. A Dalva exagera.',
        seguranca: 'Só nós dois. O neto foi no show... graças a Deus ele já ligou, tá bem.',
        sangramento: 'Não.',
      },
      links: [
        { a: 'irradia', b: 'manual:peito', insight: 'Mais de 40 anos, suor frio, dor que vai pro braço e pras costas: infarto. USA (Manual p.3).' },
        { a: 'pastel', b: 'suor', insight: '"Deve ser o pastel"... molhado de suor frio. Minimizador clássico, igual ao Seu Antônio.' },
        { a: 'fumou', b: 'manual:atipico', insight: 'Diabético, setenta anos, fumante: risco altíssimo. Mesmo que a dor fosse "esquisita", é infarto até prova em contrário (Manual p.3).' },
      ],
      worsen: [{ after: 80, lines: ['{m:Moço|Moça}! {{Ele desmaiou no sofá|desmaiou}}! Ele tá fazendo um ronco!'], truth: { risk: { good: 60, bad: 150, guideBonus: 25 } }, guide: 'rcp' }],
      patient: { name: 'Ernesto Salles', age: 70, sex: 'M' },
      truth: { dx: 'Infarto', sev: 'vermelho', ok: ['USA'], dest: ['REG'], risk: { good: 60, bad: 150 } },
      radio: {
        ok: '{central}, {unit} no local. Infarto com supra. Seguimos Regional. Ele perguntou do neto no show; falei que tá todo mundo bem.',
        saved: '{central}, {unit}. Pegamos ele em fibrilação, voltou no segundo choque. Quem contou a massagem no telefone? Contou bonito.',
        under: 'Central, {unit}! É infarto, supra no eletro! Cadê uma USA?!',
        dead: 'Central... {unit}. Chegamos tarde. Óbito às {hora}. A esposa disse que ele só queria saber se o neto tava bem.',
        dismissed: '{m:Moço|Moça}! Ele caiu do sofá! Não fala mais! Eu sei que tem o show, mas e ele?!',
      },
      diary: {
        alive: 'Seu Ernesto. Infartou ouvindo o tumulto no rádio, com o neto no show. O neto estava bem. Ele também ficou.',
        dead: 'Seu Ernesto. Infartou ouvindo o tumulto no rádio. A ambulância estava no Parque.',
      },
    }),
    // ------------------------------------------------------------------ 7 TROTE OPORTUNISTA
    call({
      id: 'd15_trote',
      ref: 'D15 #5',
      at: '17:35',
      pool: 'trote',
      num: '(17) 99004-4801',
      caller: 'Voz de rapaz, agitada',
      type: 'trotista',
      voice: 'adolescente',
      note: 'Diz que tem outro tumulto no shopping.',
      noteWrong: 'OUTRO tumulto, {dr}! No shopping! Muita vítima!',
      addr: { rua: 'Av. Brasil', n: 4801, bairro: 'Jardim Primavera', ref: 'Shopping Aurora.' },
      amb: ['musica'],
      open: [
        'Emergência?! Corre que {{tem outro tumulto no shopping|outro_tumulto}}! Tão pisoteando gente na escada rolante! {{Umas cem pessoas|cem}}!',
        '[{{ao fundo, calma, a musiquinha de loja do shopping; uma voz no alto-falante anuncia promoção de chinelo|musica_loja}}]',
      ],
      q: {
        oque: 'É... o povo do show foi tudo pro shopping e a escada rolante... desabou! É!',
        consciencia: 'Tão todos desmaiados! Os cem!',
        respira: 'Uns respiram, uns não. Sei lá!',
        idade: 'De todas as idades, {m:moço|moça}!',
        referencia: 'No shopping, ué. Do lado da praça de alimentação.',
        sangramento: 'Muito! A escada tá vermelha!',
        paciente: ['[{{silêncio; a mesma musiquinha de loja, ninguém gritando perto|calmo}}]', 'Ninguém pode falar, tá todo mundo desmaiado!'],
        seguranca: 'Seguro! Pode mandar todas as ambulâncias!',
        historico: 'Hã?',
      },
      callback: ['[{{Caixa postal de adolescente: "Fala aí, deixa recado que eu vejo... ou não."|retorno_caixa}}]'],
      links: [
        { a: 'cem', b: 'manual:trote_sinais', insight: 'Cem vítimas na escada rolante e nenhum detalhe de corpo nenhum; ninguém mais ligou do shopping: trote oportunista aproveitando o tumulto do Parque (Manual p.2).' },
        { a: 'outro_tumulto', b: 'musica_loja', insight: '"Tão pisoteando gente", e ao fundo a musiquinha de loja tocando calma, com anúncio de promoção. Pisoteamento não tem trilha sonora.' },
        { a: 'calmo', b: 'cem', insight: 'Cem pessoas desmaiadas e silêncio em volta do telefone: o ambiente não combina com o relato (Manual p.2).' },
      ],
      patient: { name: '"Cem pessoas no shopping"' },
      truth: { dx: 'Trote oportunista', sev: 'trote', ok: ['TROTE'], prankKind: 'trote' },
      radio: { prank: 'Central, {unit} no Shopping Aurora. Escada rolante funcionando, ninguém ferido, a segurança disse que ninguém chamou. Trote, {dr}. Numa hora dessas.' },
    }),
    // ------------------------------------------------------------------ 8 MÃE ANSIOSA
    call({
      id: 'd15_mae',
      ref: 'D15 #6',
      at: '17:50',
      pool: 'leve,psiq',
      num: '(17) 99367-0980',
      caller: 'Dona Ivete (mãe)',
      callerName: 'Dona Ivete',
      type: 'comum',
      voice: 'mulher',
      note: 'Mãe desesperada: o filho estava no show.',
      noteWrong: 'Mulher com falta de ar forte!',
      addr: { rua: 'Rua Rui Barbosa', n: 980, bairro: 'Jardim Norte', ref: 'Casa de muro amarelo, perto da padaria.' },
      amb: ['tv', 'respiracao'],
      open: [
        '{m:Moço|Moça}, {{o meu filho tava no show|filho_show}}! Ele não atende o celular! Eu vi na TV a grade caindo... {{eu não consigo respirar|nao_respira}}, meu coração vai sair pela boca!',
        '[{{respiração rápida, choro, a TV com o repórter falando do tumulto|tv_tumulto}}]',
      ],
      q: {
        oque: 'Eu vi na TV. A grade caiu. O Teodoro tava lá com os amigos. Ele não atende!',
        respira: 'Rápido! Não para! Minhas {{mãos tão formigando|formigando}}!',
        consciencia: 'Acordada! Desesperada!',
        idade: 'Quarenta e seis.',
        historico: 'Nada. Tomo um remedinho pra ansiedade, às vezes.',
        dorpeito: 'Aperta... mas é de nervoso, eu sei que é de nervoso.',
        inicio: 'Desde que eu vi a notícia. Meia hora.',
        paciente: 'Sou eu mesma! Me ajuda a achar meu filho!',
        seguranca: 'Seguro.',
        sangramento: 'Não.',
      },
      extra: [
        {
          id: 'lista',
          label: 'Nome do filho? (lista de vítimas)',
          say: 'Qual o nome completo do seu filho? Eu tenho aqui a lista das vítimas do Parque.',
          a: [
            'Teodoro... Teodoro Alves. Dezessete anos. Tá na lista? Tá?',
            '[{{o celular dela vibra em cima da mesa|celular}}]',
            '...{m:Moço|Moça}. É ele. Mensagem dele: "mãe tô bem, tô na casa do Gui, meu celular morreu". {{Ele tá bem|ele_bem}}. Ai, meu Deus. Ele tá bem.',
          ],
        },
        {
          id: 'respirar_junto',
          kind: 'acalmar',
          label: 'Respirar junto com ela',
          repeat: true,
          say: 'Dona Ivete, respira comigo. Puxa o ar pelo nariz... segura... solta devagar pela boca.',
          a: ['[a respiração dela vai ficando mais lenta]', 'Tá... tá passando o formigamento...'],
        },
      ],
      links: [
        { a: 'formigando', b: 'manual:ansiedade', insight: 'Formigamento nas mãos, fala frases inteiras, aperto "de nervoso": crise de ansiedade. Orientação com respiração guiada (Manual p.5-B).' },
        { a: 'ele_bem', b: 'filho_show', kind: 'confirma', insight: 'O filho mandou mensagem: está bem. Agora é cuidar da crise da mãe, por telefone.' },
      ],
      guide: { id: 'respiracao', onOri: true },
      patient: { name: 'Ivete Alves', age: 46, sex: 'F' },
      // RC22: "meu coração vai sair pela boca" agora é "palpitação atual" (USI/USB). Hiperventilação com gatilho claro,
      // frases inteiras, mãos formigando: orientação preferida, USB ⚖ (antes era excesso), como em d03_briga.
      truth: { dx: 'Crise de ansiedade (o filho estava no show e está bem)', sev: 'verde', ok: ['ORI', 'USB'], best: 'ORI', ref: ['CASA'], dest: ['UPA'] },
      radio: {
        ok: '{central}, {unit}. A senhora tá bem, abraçada no filho, que acabou de chegar. Pressão e coração normais. Liberada no local, {dr}.',
        excess: '{central}, {unit}. A senhora tá bem, abraçada no filho, que acabou de chegar. Viemos à toa, {dr}, mas foi bonito de ver.',
      },
      diary: {
        ori: 'Viu a grade cair na TV e o filho não atendia. Celular descarregado. Respiramos {m:juntos|juntas} até a mensagem chegar.',
        alive: 'Viu a grade cair na TV e o filho não atendia. Celular descarregado. Quando a equipe chegou, ele já estava em casa.',
      },
    }),
    // ------------------------------------------------------------------ 9 MOTORISTA EMBRIAGADO
    call({
      id: 'd15_bebado',
      ref: 'D15 #7',
      at: '18:10',
      pool: 'trauma_moderado',
      num: '(17) 99712-2950',
      caller: 'Seu Jorge (dono do bar)',
      callerName: 'Seu Jorge',
      type: 'testemunha',
      voice: 'homem',
      note: 'Carro bateu no poste. Motorista bêbado, acordado.',
      noteWrong: 'Bêbado batendo boca na rua. Coisa de polícia.',
      addr: { rua: 'Av. Primavera', n: 2950, bairro: 'Parque das Exposições', ref: 'Em frente ao Bar do Jorge, perto da rotatória do Parque.' },
      amb: ['bar', 'rua', 'gritos'],
      open: [
        '{m:Moço|Moça}, um carro saiu do estacionamento do show e {{enfiou no poste aqui na frente do meu bar|poste}}! O motorista tá {{bêbado que nem um gambá|bebado}}!',
        'MOTORISTA: Eu tô bem, caramba! Me dá a chave! {{Eu vou embora dirigindo|vai_dirigir}}!',
      ],
      q: {
        oque: 'Veio rápido, desviou de uma moto e pá. O poste tá torto. Tá saindo fumaça do capô.',
        consciencia: 'Acordado. Gritando, xingando todo mundo.',
        respira: 'Respira. Grita, então respira.',
        idade: 'Uns quarenta.',
        sangramento: 'Cortou a testa no volante, {{tá sangrando no olho|testa}}. E segura o peito, do lado do cinto.',
        historico: 'Sei lá. Cachaça, pelo cheiro.',
        paciente: ['MOTORISTA: Ninguém encosta em mim! Eu sou é...', '[ele vomita na calçada]', 'MOTORISTA: ...tô bem.'],
        seguranca: '{{Ele tá querendo brigar com quem chega perto|agressivo}}. Tirou a chave e não dá pra ninguém. Tem povo do show passando e provocando.',
        referencia: 'Bar do Jorge, rotatória do Parque.',
      },
      extra: [
        { id: 'cinto', label: 'Cinto? Airbag? Dor no peito?', say: 'Ele estava de cinto? O airbag abriu? Reclama de dor no peito ou na barriga?', a: 'Cinto tava. Airbag abriu. Ele segura o peito, do lado do cinto, quando respira fundo.' },
      ],
      links: [
        { a: 'agressivo', b: 'manual:cena', insight: 'Motorista embriagado, agressivo, querendo sair dirigindo, plateia provocando: cena insegura. PM junto com a viatura (Manual p.4).' },
        { a: 'poste', b: 'testa', insight: 'Batida forte (o airbag abriu), corte na testa, dor no peito do cinto e alcoolizado: trauma moderado que precisa de avaliação no Regional.' },
      ],
      patient: { name: 'Motorista não identificado', age: 40, sex: 'M' },
      // [validar] RT8: poste entortado e airbag aberto sugerem "mecanismo de trauma significativo" (USA). Acordado, com
      // corte na testa, dor no peito do cinto ao respirar fundo e embriagado: RC19 e RT9 dão USI/USB (história de trauma
      // craniano). USB + PM preferida, USA ⚖. Equipe: a USA deveria ser a preferida?
      truth: { dx: 'Colisão em poste: motorista embriagado, trauma moderado', sev: 'amarelo', ok: ['USB', 'USA'], best: 'USB', sup: ['PM'], dest: ['REG'], risk: { good: 110, bad: 280, needs: 'USB' } },
      radio: {
        ok: 'Central, {unit} com a PM. Motorista contido, corte na testa e dor torácica do cinto, embriagado. Seguimos Regional.',
        unsafe: 'Central, {unit}! O motorista partiu pra cima da equipe e o povo do show tá cercando! Recuamos! Cadê a PM?!',
        excess: '{central}, {unit}. Embriagado, corte na testa, estável. A PM levou a chave. Dava USB, {dr}.',
      },
      diary: { alive: 'Saiu do estacionamento do show e beijou o poste. A PM levou a chave. Ele levou pontos na testa.' },
    }),
    // ------------------------------------------------------------------ 10 CRIANÇA PERDIDA
    call({
      id: 'd15_crianca',
      ref: 'D15 #8',
      at: '18:30',
      pool: 'leve,pediatria',
      num: '(17) 99540-1350',
      caller: 'Seu Zeca (pipoqueiro)',
      callerName: 'Seu Zeca',
      type: 'testemunha',
      voice: 'idoso',
      note: 'Pipoqueiro achou uma criança perdida no tumulto.',
      noteWrong: 'Criança ferida no tumulto! Grave!',
      addr: { rua: 'Rua dos Expositores', n: 1350, bairro: 'Parque das Exposições', ref: 'Carrinho de pipoca na esquina do portão B do Parque.' },
      amb: ['multidao', 'choro'],
      open: [
        '{Dr}, achei uma menininha {{chorando sozinha, perdeu a mãe no tumulto|perdida}}. {{Tá com o joelho ralado|joelho}}, sangrou um tiquinho.',
        'Eu não posso sair daqui, tô com o carrinho. {{E tem muito homem estranho rodando|estranhos}}, {dr}. Ela não solta da minha mão.',
      ],
      q: {
        oque: 'Ela tava embaixo da arquibancada, chorando. Diz que a mãe "sumiu no meio do povo".',
        consciencia: 'Acordada. Chorando, mas falando.',
        respira: 'Respira normal. Soluçando.',
        idade: 'Ela disse que tem cinco. Mostrou com a mão.',
        sangramento: 'Um ralado no joelho. Já limpei com água da garrafinha.',
        historico: 'Não sei, {dr}. Ela não sabe falar de remédio.',
        paciente: 'YASMIN: Eu quero a minha mãe... a minha mãe chama Sueli... [choro]',
        seguranca: 'Aqui no carrinho é seguro. Mas tá escurecendo e o povo tá nervoso.',
      },
      extra: [{ id: 'outros', label: 'Bateu a cabeça? Anda normal?', say: 'Ela bateu a cabeça? Reclama de dor em outro lugar? Anda normal?', a: 'Não bateu, ela disse. Anda normal, até pulou pra pegar pipoca. Só o joelho.' }],
      links: [
        { a: 'joelho', b: 'perdida', insight: 'O ralado é leve. O problema é uma criança de cinco anos sozinha no meio do tumulto: orientação + PM pra encontrar a família.' },
        { a: 'estranhos', b: 'perdida', insight: 'Cinco anos, sozinha, escurecendo, gente estranha rondando: o risco não é o joelho, é ela ficar sozinha. PM.' },
      ],
      patient: { name: 'Yasmin (5 anos)', age: 5, sex: 'F' },
      truth: { dx: 'Criança perdida com escoriação leve no joelho', sev: 'verde', ok: ['ORI'], sup: ['PM'], ref: ['CASA', 'UPA'] },
      radio: { excess: '{central}, {unit}. Joelho ralado, {dr}. A PM achou a mãe dela chorando no portão A. Não precisava da gente, mas que bom.' },
      diary: { ori: 'Yasmin, cinco anos, perdida embaixo da arquibancada. O pipoqueiro segurou a mão dela até a PM chegar com a mãe.' },
    }),
  ],
  ida: (c) =>
    rua('d15_ida', 'rua', [
      { who: 'NARRADOR', t: 'Aniversário do Liam. Na padaria da esquina, o Seu Toninho anota no caderno do fiado com o lápis de trás da orelha.' },
      faixa(c) === 'folga' || faixa(c) === 'sobra'
        ? { who: 'TONINHO', t: 'O bolo de ambulância tá encomendado pra seis da tarde, doutor. Já pagaram ontem. {Oconj} veio com o dinheiro contado.' }
        : { who: 'TONINHO', t: 'O bolo de ambulância tá encomendado pra seis da tarde. Paga quando der, doutor. Aniversário não espera salário.' },
    ]),
  almoco: (c) => almocoD15(c),
  volta: (c) =>
    rua('d15_volta', 'rua', [
      { who: 'NARRADOR', t: 'Você sai tarde: o show, o Parque, o rádio que não parou. O ônibus 12 está lotado de gente com a pulseira da Expo no braço.' },
      ...(vivoNoDiario(c, 'd05_academia')
        ? [
            { who: 'NARRADOR', t: 'Uma moça de camiseta de enfermagem cochila no seu ombro. Acorda num tranco de lombada.' },
            { who: 'TAÍS', t: 'Desculpa. Fiz massagem num menino hoje, no Parque. Duas vezes na mesma semana, credo. (ela olha pra você) ...A sua voz é conhecida.' },
          ]
        : [{ who: 'NARRADOR', t: 'Uma moça de camiseta de enfermagem cochila no seu ombro até a XV. Você não tem coragem de acordar.' }]),
    ]),
  interlude: {
    teaser: (c) => (presente(c, 'davi') ? 'É aniversário do Liam. Tem bolo esperando.' : 'É aniversário do Liam. Ele está longe.'),
    familyLacos: 2,
    onBico: fx.add('lacos', -2, 'perdeu o aniversário do Liam'),
    bills: BOLO_CONTA,
    scene: (c) => cenaAniversario(c),
    bico: (c) => bicoD15(c),
  },
});

