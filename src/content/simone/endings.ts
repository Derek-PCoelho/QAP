// =============================================================================
// Campanha 2 ("Simone"): finais, fios do epílogo, game overs e créditos.
//
// Regras do final (avaliadas na ordem):
//   SECRETO "A Lista"           assinou a escala nova no D18 (a Tati sai, ela sobe)
//   RUIM                        demitida no dia 31 · Wesley ≤ 2 · pressão ≥ 9
//   BOM "Os post-its são oficiais"  promovida a supervisora (D18, corte congelado pela
//                               matéria) · Wesley ≥ 6 · pressão ≤ 6
//   NORMAL "A mesma cadeira"    o resto (fica no fone; a lista adiada; a Tati sai)
// =============================================================================
import type { Ctx, EndingInfo } from '../../engine/types';
import { statusEmprego, type Status } from './days14_20';
import { yuriMorreu } from './days8_13';
import { sFlag, sKey, num } from './util';

type Thread = EndingInfo['threads'][number];
type Kind = EndingInfo['kind'];

// -----------------------------------------------------------------------------
// fios
// -----------------------------------------------------------------------------
type HenriqueFim = 'tratamento' | 'sobreviveu' | 'morreu' | 'piorando';
export const henriqueFim = (c: Ctx): HenriqueFim => {
  if (sFlag(c, 'denunciou_henrique')) return 'tratamento';
  const f = c.val<string>('henrique_fim');
  if (f === 'vivo') return 'sobreviveu';
  if (f === 'morto') return 'morreu';
  return 'piorando';
};

const wesleyLinha = (c: Ctx): string => {
  if (c.flag('wesley_feira') && c.flag('falou_futuro')) return 'O Wesley fica no caixa da banca do Seu Edinho aos domingos e faz o curso de socorrista da Defesa Civil às terças. Diz que aprendeu a perguntar "desde que horas?" com a mãe.';
  if (c.flag('wesley_feira')) return 'O Wesley fica no caixa da banca do Seu Edinho aos domingos. Sentado. Conta tomate como quem conta troco e manda áudio pra mãe no fim da feira.';
  if (c.flag('falou_futuro')) return 'O Wesley se inscreveu no curso de socorrista da Defesa Civil. Na primeira aula, levantou a mão pra corrigir o instrutor: "Primeiro pergunta se respira."';
  if (c.flag('wesley_voltou_moto')) return 'O Wesley voltou às entregas, com o pino na perna e o capacete vermelho. A cada entrega, uma mensagem de uma palavra: "Cheguei."';
  if (c.flag('moto_passada')) return 'A moto foi embora com as parcelas. O Wesley guardou o capacete vermelho em cima do guarda-roupa. Um dia ele compra outra, ele diz.';
  return 'O Wesley tirou o pino em junho. Ainda manca quando chove.';
};

const empregoLinha = (c: Ctx, st: Status): string => {
  switch (st) {
    case 'supervisora':
      return 'Supervisora de TARM. Um ouvido no fone, o outro nas meninas novas. Os post-its agora são oficiais.';
    case 'fica_fone':
      return 'Recusou o cargo. Ficou com o fone. Em maio, a cadeira da Dulce ganhou uma TARM nova, que a Simone treina de ouvido.';
    case 'adiada':
      return 'A lista do dia 31 continua na gaveta da Rose, embaixo de uma pasta de férias. A auditoria ainda não acabou.';
    case 'assinou':
      return 'Assinou a escala nova. A Tati saiu no dia 31, com a filha no colo e uma caixa de papelão.';
    case 'demitida':
      return 'Demitida no dia 31, na reestruturação. Vinte e dois anos couberam numa sacola de mercado.';
    default:
      return sFlag(c, 'materia_forte')
        ? 'O corte ficou congelado até a auditoria. Congelado não é cancelado. Por enquanto, ela fica.'
        : c.flag('avisou_tati')
          ? 'Ficou. Quem saiu no dia 31 foi a Tati, que soube por ela, no banheiro, antes de saber pela OS.'
          : 'Ficou. Quem saiu no dia 31 foi a Tati. A franja torta da Manu sumiu do fundo de tela da baia ao lado.';
  }
};

const saudeLinha = (c: Ctx): string => {
  const p = c.v('pressao');
  if (p <= 6 && (c.flag('promessa_remedio') || c.flag('receita_nova'))) return 'Treze por oito. Remédio todo dia, às seis, com café. O Wesley conta.';
  if (p <= 6) return 'A pressão ficou no lugar. Do jeito dela: sem consulta, sem receita, contando com a sorte e com o aparelho de pulso.';
  if (p >= 9) return 'Dezenove por doze num dia comum. A nuca pesa. Ela sabe o nome disso e não fala em voz alta.';
  return 'Dezessete por dez num dia bom. A cartela na bolsa, às vezes vazia. A Simone ensina por telefone o que não faz em casa.';
};

const henriqueLinha = (c: Ctx): string => {
  const f = henriqueFim(c);
  const postits = num(c, 'postit_h');
  if (f === 'tratamento')
    return postits >= 2
      ? 'Uma carta do Henrique pra central, sem destinatário: "Hoje faz sessenta dias que eu não bebo." Dentro do envelope, dobrado, um post-it de letra de forma: "RUA BAHIA, 300." Ele nunca soube de quem era.'
      : 'Uma carta do Henrique pra central, sem destinatário: "Hoje faz sessenta dias que eu não bebo."';
  if (f === 'sobreviveu')
    return postits >= 2
      ? 'O Henrique saiu do Regional direto pra clínica. Na primeira terça, foi ao salão da Rua Bahia, 300. Levou um post-it no bolso.'
      : 'O Henrique saiu do Regional direto pra clínica. Desta vez estava escrito na ficha. Ninguém conseguiu encobrir.';
  if (f === 'morreu')
    return postits >= 1
      ? 'No bolso do jaleco do Henrique, dobrados, os post-its de letra de forma. Todos. Ninguém nunca soube de quem eram. Ela sabe.'
      : 'O crachá do Henrique no quadro de cortiça, com uma fita preta. A foto é de quando ele era novo na central.';
  return 'O Henrique continua no noturno. A voz dele fica mais lenta a cada mês.';
};

const dia9Linha = (c: Ctx): { ok: boolean; text: string } => {
  const mesa = c.val<string>('sd9_mesa');
  const marcia = c.val<string>('sd9_marcia');
  const quem = mesa === 'henrique' ? 'Ela passou a casa d{o} {dr} pro Henrique, pela página 9-C.' : mesa === 'moura' ? 'Ela passou a casa d{o} {dr} pr{o} própri{o} {dr}.' : 'A ligação da casa d{o} {dr} passou pela mesa que estava livre.';
  if (marcia === 'morto') return { ok: false, text: `${quem} A Márcia, da Rua Jacarandá, não voltou. Professora, disse o jornal do dia seguinte.` };
  if (marcia === 'vivo') return { ok: true, text: `${quem} A Márcia, da Rua Jacarandá, voltou a dar aula em abril. O menino da Rua das Acácias ficou bem.` };
  return { ok: true, text: `${quem} Ninguém nunca perguntou a ela por quê.` };
};

function fios(c: Ctx, st: Status): Thread[] {
  const out: Thread[] = [];
  out.push({ id: 'emprego', ok: ['supervisora', 'fica', 'fica_fone', 'adiada'].includes(st), text: empregoLinha(c, st) });
  out.push({ id: 'wesley', ok: c.v('wesley') >= 6, text: c.v('wesley') <= 2 ? 'O Wesley foi morar com o pai, em Sinop. Manda dinheiro no aniversário dela. Não manda notícia.' : wesleyLinha(c) });
  out.push({ id: 'saude', ok: c.v('pressao') <= 6, text: saudeLinha(c) });
  if (c.day >= 12) out.push({ id: 'henrique', ok: ['tratamento', 'sobreviveu'].includes(henriqueFim(c)), text: henriqueLinha(c) });
  const d9 = dia9Linha(c);
  out.push({ id: 'dia9', ok: d9.ok, text: d9.text });
  out.push({
    id: 'yuri',
    ok: !yuriMorreu(c),
    text: yuriMorreu(c)
      ? 'A casa 4 da vila foi alugada pra outra família em maio. A Vera deixou um vaso de espada-de-são-jorge na porta da casa 2.'
      : 'O Yuri ficou três dias na UTI e um mês sem jogar bola. Agora quer ser socorrista também. A Vera põe a culpa na Simone.',
  });
  const cida = sKey(c, 'cida');
  const naCentral = st !== 'demitida';
  out.push({
    id: 'cida',
    ok: cida === 'salvo',
    text:
      cida === 'salvo'
        ? naCentral
          ? 'A Dona Cida voltou pra casa de andador. Liga toda manhã, às nove. A Simone atende e não passa pra ninguém: as duas conversam dois minutos de novela. O TMA que se dane.'
          : 'A Dona Cida voltou pra casa de andador. Na escada da casa amarela, quem segura o braço dela é a xará.'
        : naCentral
          ? 'No quadro de cortiça, no lugar do post-it da Dona Cida, uma tachinha sem nada.'
          : 'A Simone guardou o post-it da Dona Cida na carteira, atrás da foto do Wesley.',
  });
  out.push({
    id: 'carla',
    ok: c.flag('sd14_desculpa') || c.flag('sd14_linha') || c.flag('sd14_fonte'),
    text: c.flag('sd14_fonte')
      ? 'Na matéria da Carla, uma frase sem nome: "A gente é cronometrada pra desligar." A Carla mandou o recorte pelo correio, com um bilhete: "Obrigada por ficar na linha."'
      : c.flag('sd14_desculpa') || c.flag('sd14_linha')
        ? 'A Carla manda mensagem todo dia 12 de abril, o dia do Rafael. Uma palavra: "Linha." A Simone responde: "Tô aqui."'
        : 'O cartão da Carla Nunes continua no bolso do uniforme, junto do bloco de post-it.',
  });
  out.push({
    id: 'bene',
    ok: c.flag('bolo_feito') || c.flag('sd18_bene'),
    text: c.flag('bolo_feito')
      ? 'No churrasco de aposentadoria do Bené, o bolo de fubá acabou antes da carne. O Bené guardou a forma como troféu e nunca devolveu.'
      : c.flag('sd18_bene')
        ? 'O café na padaria da XV continua às 06:35. Um café a menos no balcão. O Bené passa às sextas, de bermuda, só pra implicar.'
        : 'O Bené se aposentou numa sexta. Na segunda, o balcão da padaria tinha um café a menos e ninguém pra perguntar do pneu.',
  });
  if (c.flag('sd16_avisou_peixoto'))
    out.push({
      id: 'peixoto',
      ok: sKey(c, 'osvaldo') === 'salvo',
      text:
        sKey(c, 'osvaldo') === 'salvo'
          ? 'O Seu Osvaldo come goiabada escondido da cuidadora. O Peixoto passou a dar bom-dia à TARM pelo nome.'
          : 'O Peixoto assumiu uma central em outra cidade, com as mesmas metas. Levou o paletó. Deixou o vaso.',
    });
  return out;
}

// -----------------------------------------------------------------------------
// textos dos finais
// -----------------------------------------------------------------------------
function onde(c: Ctx): string {
  // GDD: "É demitida. Na campanha 2 você vê para onde ela foi."
  if (sKey(c, 'cida') === 'salvo') return 'Em abril, a Simone começa a trabalhar de cuidadora da Dona Cida, de segunda a sábado, na Bela Vista. Duas Aparecidas e um gato. A novela às seis.';
  return 'Em abril, a Simone começa numa central de cobrança de plano de saúde, no Centro. Fone, roteiro na tela, meta de TMA de três minutos. Ninguém liga pra pedir socorro. Todo mundo liga pra reclamar.';
}

function linhas(c: Ctx, kind: Kind, st: Status): string[] {
  const p = c.v('pressao');
  const w = c.v('wesley');
  if (kind === 'secreto')
    return [
      'A LISTA',
      'A Simone assinou a escala nova com a caneta azul da OS. A assinatura saiu redonda, igual à letra dos post-its.',
      'A Tati saiu no dia 31, com a filha no colo e uma caixa de papelão.',
      'A sala da supervisão fica no segundo andar, com ar-condicionado e uma janela pra rua.',
      'Lá de cima, o telefone da central toca baixinho. Depois de um mês, nem isso.',
      'O TMA da central é o melhor da história da OS. Tem um gráfico na parede, com uma linha que só desce.',
      w >= 6 ? 'O salário novo pagou o que faltava da moto. O Wesley não pergunta de onde veio. Ela também não conta.' : 'O salário novo pagou o que faltava da moto. O Wesley já não mora com ela.',
      'Ela ainda escreve post-its. Agora chamam memorando.',
      'Na mesa de baixo, na cadeira dela, uma menina de vinte anos atende primeiro e passa. Ninguém deixa post-it pra ela.',
    ];
  if (kind === 'ruim') {
    const out: string[] = [];
    const nuca = st !== 'demitida' && p >= 9;
    const sinop = 'O Wesley foi morar com o pai, em Sinop, numa terça de manhã. Deixou o capacete vermelho em cima da geladeira.';
    if (st === 'demitida') {
      out.push('O DIA 31');
      out.push('No dia 31, a Rose desce com um envelope pardo. "Reestruturação", ela diz, sem olhar.');
      out.push('A Simone esvazia a gaveta: o bloco de post-it, o aparelho de pressão, o santinho e a almofada de crochê da Dulce.');
      out.push('A cadeira dela fica vazia ao lado da cadeira da Dulce. A OS chama isso de eficiência.');
      out.push(onde(c));
      out.push('Às vezes, no ônibus, uma sirene passa na Av. Brasil. Ela conta os minutos sem querer.');
      if (w <= 2) out.push(sinop);
    } else if (nuca) {
      out.push('A NUCA');
      out.push('A Simone chega ao fim do mês com a pressão de quem atende o telefone por todo mundo e não atende o próprio corpo.');
      out.push('Em abril, numa terça de manhã, a vista apaga pela metade no meio de uma ligação. Desta vez, quem regula é ela mesma, em voz alta, antes de cair: "Mulher, cinquenta e um anos."'); // [validar]
      out.push('Volta pra central em junho, devagar, com um lado do corpo mais lento. Volta. É o que ela consegue.');
      if (w <= 2) out.push(sinop);
    } else {
      out.push('O QUARTO VAZIO');
      out.push('O emprego ficou. O Wesley, não.');
      out.push(sinop);
      out.push('O quarto dele continua como ficou: a cama sem lençol, o carregador na tomada, a jaqueta da entrega atrás da porta.');
    }
    // epílogo: do outro lado da linha. O motivo da ligação segue o que o jogador construiu.
    const mes = nuca ? 'julho' : 'maio';
    if (st === 'demitida' && sKey(c, 'cida') === 'salvo')
      out.push(`Numa noite de ${mes}, a Dona Cida escorrega no banheiro da casa amarela. A Simone ajoelha no chão molhado, firma a cabeça dela com as duas mãos, sem deixar mexer, e liga pra emergência no viva-voz.`); // [validar]
    else if (p >= 7) out.push(`Numa noite de ${mes}, ${w <= 2 ? 'sozinha na casa 2' : 'com o Wesley fora'}, a nuca pesa e o peito aperta. Ela liga pra emergência.`);
    else if (w <= 2) out.push(`Numa noite de ${mes}, sozinha na casa 2, ela liga pra emergência. Não dói nada. A casa é que está quieta demais.`);
    else out.push(`Numa noite de ${mes}, na volta do mercado, um senhor cai na calçada da vila. A Simone ajoelha do lado dele, olha se o peito sobe e liga pra emergência.`); // [validar]
    out.push('Toque. Toque. Atende uma voz de TARM nova, que pergunta "o que aconteceu?" do jeito que ela ensinou.');
    out.push('A Simone ouve a pergunta inteira antes de responder. Do outro lado da linha, pela primeira vez.');
    return out;
  }
  if (kind === 'bom')
    return [
      'OS POST-ITS SÃO OFICIAIS',
      sFlag(c, 'peixoto_caiu') ? 'A auditoria durou três semanas. A Saúde+ Gestão perdeu o contrato em maio, e a central voltou pra Prefeitura.' : 'A auditoria durou três semanas. O corte de TARM foi cancelado no relatório final, numa linha de rodapé.',
      'A Simone virou supervisora de TARM. Continua com o fone num ouvido. O outro é pra Tati e pras duas meninas novas.',
      'O cronômetro do TMA saiu do monitor. No lugar, ela colou um post-it com a letra redonda: "PERGUNTA. ESPERA. ESCUTA."',
      'Às sextas, o Wesley espera a mãe no ponto da XV, no fim do turno. Os dois voltam juntos, de ônibus, falando mal do motorista.',
      'O aparelho de pulso fica em cima da mesa da supervisão, pra todo mundo ver que ela mede.',
      'Às vezes, no fim do turno, ela atende uma ligação da fila só pra lembrar como é.',
      'A primeira pergunta continua a mesma: "O que aconteceu?"',
    ];
  const cadeira =
    st === 'fica_fone'
      ? 'Ela recusou o cargo e ficou com o fone.'
      : st === 'adiada'
        ? 'A lista do dia 31 ficou numa gaveta. A Simone ficou na cadeira.'
        : st === 'supervisora'
          ? 'Ela virou supervisora no papel. Na prática, continua na mesma cadeira, com o mesmo fone.'
          : sFlag(c, 'materia_forte')
            ? 'O corte do dia 31 ficou congelado. A Simone ficou na cadeira.'
            : 'O corte do dia 31 levou a Tati. A Simone ficou na cadeira.';
  return [
    'A MESMA CADEIRA',
    cadeira,
    'Nada mudou na central: o mesmo painel, o mesmo balde embaixo do ar-condicionado, a mesma meta de TMA colada no monitor.',
    'Em casa, as contas continuam apertadas. O aparelho de pulso mora na mesa da cozinha, do lado do açucareiro.',
    'Na segunda-feira, às 06:38, o ônibus Vila Nova–Centro para na XV de Novembro. A Simone desce com a bolsa grande e o pote de bolo.',
    'A almofada de crochê da Dulce, agora, está na cadeira dela.',
    'O telefone toca. Ela atende antes do segundo toque.',
  ];
}

export function ending(c: Ctx): Pick<EndingInfo, 'kind' | 'lines' | 'threads'> {
  const st = statusEmprego(c);
  const w = c.v('wesley');
  const p = c.v('pressao');
  let kind: Kind;
  if (st === 'assinou') kind = 'secreto';
  else if (st === 'demitida' || w <= 2 || p >= 9) kind = 'ruim';
  else if (st === 'supervisora' && w >= 6 && p <= 6) kind = 'bom';
  else kind = 'normal';
  return { kind, lines: linhas(c, kind, st), threads: fios(c, st) };
}

// -----------------------------------------------------------------------------
// game overs
// -----------------------------------------------------------------------------
export const GAMEOVER = {
  exonerado: (c: Ctx): string[] => [
    'DEMITIDA',
    c.v('emprego') <= 0 ? 'A planilha decidiu antes do dia 31. A Rose desce com um envelope pardo e não senta.' : 'Terceira advertência da OS. A Rose desce com um envelope pardo e não senta.',
    'A Simone esvazia a gaveta: o bloco de post-it, o aparelho de pressão, a almofada de crochê da Dulce.',
    'Vinte e dois anos cabem numa sacola de mercado.',
    'No dia seguinte, quem atende primeiro é a Tati. A fila não percebe a diferença. A Dona Cida percebe.',
    c.day >= 7 ? 'No portão da vila, o Wesley já está esperando, de muleta. Soube antes dela: a Tati mandou mensagem.' : 'No portão da vila, o Wesley já está esperando, com o capacete na mão. Soube antes dela: a Tati mandou mensagem.',
  ],
  colapso: (c: Ctx): string[] =>
    c.flag('simone_colapso')
      ? [
          'A PRESSÃO VENCEU',
          'Na escada da vila, a vista apaga pela metade e não volta.',
          c.day >= 7 ? 'O Wesley liga pra emergência do degrau, com a muleta caída do lado.' : 'O Wesley liga pra emergência do degrau, ainda de capacete.',
          'Quem atende primeiro é a Tati. Ela reconhece o endereço antes de ele terminar de falar.',
          'A Simone passa onze dias no Regional. Volta pra casa devagar, segurando no braço do filho.', // [validar]
          'Não volta pra central.',
        ]
      : [
          'ESGOTADA',
          'O telefone toca. A Simone sabe que precisa atender.',
          'A mão não obedece. O fone fica no gancho, tocando, tocando.',
          'A Tati atende por cima do ombro dela.',
          'O médico da UPA escreve "esgotamento" e trinta dias de afastamento.',
          'A OS não espera trinta dias.',
        ],
  despejo: (c: Ctx): string[] => [
    'SEM CASA',
    'O dono da vila trocou a fechadura numa terça-feira, com as coisas dentro.',
    c.day >= 7 ? 'A Vera guarda a geladeira na casa 4. O Wesley carrega a TV de muleta, sem deixar ninguém ajudar.' : 'A Vera guarda a geladeira na casa 4. O Wesley carrega a TV sozinho, sem deixar ninguém ajudar.',
    'A Simone vai morar com o irmão e a Graça, em dois cômodos no fundo da Vila Esperança.',
    'Dois ônibus até a central. Ela bate o ponto às 06:59. A planilha não pergunta por quê.',
  ],
};

export const CREDITS: string[] = [
  'QAP — Do outro lado da linha',
  'Para as TARMs: quem atende primeiro.',
  '',
  'Pressão alta quase nunca dói, até doer. Meça, trate, não pare o remédio por conta própria.',
  'O trote à emergência tira a ambulância de quem precisa.',
  'Em caso de dúvida, ligue. Não desligue até a regulação mandar.',
  '',
  'Se você está passando por um momento difícil: CVV — 188 (24h, gratuito) · cvv.org.br',
  '',
  'Protocolos simplificados para fins de jogo. Não use este jogo como manual médico.',
];
