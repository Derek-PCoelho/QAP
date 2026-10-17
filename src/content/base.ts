// Banco de perguntas, Manual de Regulação, frota, documentos da mesa e nomes.
// Orientações clínicas simplificadas para jogo — revisar com a equipe médica (ver docs/VALIDAR_MEDICO.md).
import type { QuestionDef, ManualPage, FleetSpec, GameState } from '../engine/types';
import type { DeskDoc } from '../engine/content-api';
import { protagonistFirst } from '../engine/text';

// 1.1: cinco perguntas fixas + quatro caixas (Clínico, GO, Trauma, Outros) + ferramentas.
// Os ids antigos ficam (truth.must e as respostas das ligações usam os ids); muda só onde aparecem.
export const QUESTIONS: QuestionDef[] = [
  // fixas (sempre na tela)
  { id: 'pulso', label: 'Tem pulso?', say: 'Encosta dois dedos no pescoço, do lado. Tem pulso? Está batendo?', cost: 5, group: 'base', fixed: true, hint: 'Circulação' },
  { id: 'respira', label: 'Respira?', say: 'Está respirando normalmente?', cost: 8, group: 'base', fixed: true, hint: 'Via aérea e respiração' },
  { id: 'pele', label: 'Cor da pele?', say: 'Qual a cor da pele? Está pálida, roxa, cinza, suando frio?', cost: 5, group: 'base', fixed: true, hint: 'Perfusão' },
  { id: 'consciencia', label: 'Está acordado?', say: 'A pessoa está acordada? Responde quando chama?', cost: 8, group: 'base', fixed: true, hint: 'Nível de consciência' },
  { id: 'oque', label: 'O que aconteceu?', say: 'O que aconteceu?', cost: 5, group: 'base', fixed: true, hint: 'Relato base' },
  // caixa Clínico (azul)
  { id: 'inicio', label: 'Desde que horas?', say: 'Desde que horas está assim?', cost: 8, group: 'base', box: ['clinico', 'trauma', 'go'], hint: 'Decisivo em AVC e infarto' },
  { id: 'historico', label: 'Doenças/remédios?', say: 'Tem alguma doença? Toma algum remédio?', cost: 10, group: 'base', box: ['clinico', 'trauma'], hint: 'Histórico' },
  { id: 'dorpeito', label: 'Dor irradia? Suor?', say: 'A dor vai para o braço, as costas ou o queixo? Está com suor frio?', cost: 8, day: 3, group: 'protocolo', box: 'clinico', hint: 'Manual p.3' },
  { id: 'fast', label: 'Teste FAST', say: 'Peça para sorrir, levantar os dois braços e repetir: "o céu é azul".', cost: 10, day: 6, group: 'protocolo', box: 'clinico', hint: 'Manual p.6 — AVC' },
  { id: 'dengue', label: 'Sinais de alarme', say: 'Tem dor forte na barriga, vômito sem parar, sangramento ou tontura ao levantar?', cost: 8, day: 11, group: 'protocolo', box: 'clinico', hint: 'Manual p.11 — dengue' },
  { id: 'risco', label: 'Risco imediato?', say: 'Alguém corre perigo agora? A pessoa está tentando machucar alguém ou a si mesma?', cost: 8, day: 12, group: 'protocolo', box: 'clinico', hint: 'Manual p.12' },
  { id: 'ingestao', label: 'O que engoliu?', say: 'O que foi engolido, quanto, e há quanto tempo? A embalagem está aí?', cost: 8, day: 13, group: 'protocolo', box: 'clinico', hint: 'Manual p.13' },
  // caixa GO (rosa)
  { id: 'gestacao', label: 'Gestação?', say: 'Está grávida? De quantas semanas? Tem sangramento, dor de cabeça forte, convulsão?', cost: 8, day: 7, group: 'protocolo', box: 'go', hint: 'Manual p.7' },
  // caixa Trauma (verde)
  { id: 'sangramento', label: 'Tem sangramento?', say: 'Tem sangramento? Muito ou pouco?', cost: 8, group: 'base', box: ['trauma', 'go'], hint: 'Hemorragia' },
  { id: 'seguranca', label: 'Local seguro?', say: 'O local está seguro? Tem alguém armado ou brigando aí?', cost: 8, group: 'base', box: ['trauma', 'clinico'], hint: 'Cena com violência' },
  // caixa Outros (branco): frases para quem quer ambulância como táxi ou consulta
  { id: 'gravada', label: '"A ligação está sendo gravada."', say: 'Atenção: esta ligação está sendo gravada.', cost: 1, group: 'base', box: 'outros', act: 'gravada', hint: 'Esfria quem está abusando' },
  { id: 'nao_perfil', label: '"Não é perfil do serviço de urgências."', say: 'O paciente não é perfil do nosso serviço de urgências.', cost: 2, group: 'base', box: 'outros', act: 'perfil', hint: 'Caso sem urgência' },
  { id: 'meios_proprios', label: '"Levar por meios próprios."', say: 'A indicação é levar o paciente por meios próprios até a UPA ou a UBS.', cost: 2, group: 'base', box: 'outros', act: 'meios', hint: 'Conta como orientação' },
  { id: 'encerrar', label: '"Encerro a ligação."', say: 'Por motivo de conflitos, encerro a ligação.', cost: 1, group: 'base', box: 'outros', act: 'encerra', hint: 'Encerra como orientação (meios próprios)' },
  // ferramentas
  { id: 'paciente', label: 'Falar com o paciente', say: 'Posso falar com o paciente?', cost: 15, group: 'ferramenta', hint: 'Testa a história' },
  { id: 'callback', label: 'Ligar de volta', say: 'Vou desligar e ligar de volta para confirmar o chamado.', cost: 30, day: 2, group: 'ferramenta', hint: 'Desmascara número falso (30 min)' },
  // da TARM (campanha da Simone): idade e endereço são dados que ela anota
  { id: 'idade', label: 'Qual a idade?', say: 'Qual a idade do paciente?', cost: 5, group: 'base', tarmOnly: true, hint: 'Fator de risco' },
  { id: 'referencia', label: 'Ponto de referência', say: 'Qual o ponto de referência?', cost: 8, group: 'base', tarmOnly: true, hint: 'Confirma o endereço' },
];

export const MANUAL: ManualPage[] = [
  {
    id: 'p1', day: 1, code: 'p.1', title: 'Classificação de risco e recursos',
    intro: 'Toda ligação recebe uma cor e um recurso. Na dúvida entre dois níveis, faça as perguntas que justificam a sua escolha.',
    rules: [
      { id: 'vermelho', text: 'VERMELHO — risco imediato de morte: parada, inconsciência ou mudança súbita da consciência, infarto, AVC na janela, trauma grave, grande hemorragia, falta de ar grave. Recurso: USA (meta de chegada: 10 min).' },
      { id: 'amarelo', text: 'AMARELO — urgência sem risco imediato: dor forte, fratura deformada ou exposta, queda de idoso, convulsão que já passou, desmaio com perda de consciência, hemorragia controlável, parto iminente. Recurso: USB (meta de chegada: 30 min).' },
      { id: 'verde', text: 'VERDE — casos leves: orientar procurar UPA ou UBS por meios próprios.' },
      { id: 'azul', text: 'AZUL — não urgente: orientação por telefone, UBS ou ficar em casa.' },
      { id: 'parada', text: 'Não responde e não respira (ou respira "esquisito", como ronco ou suspiro) = parada até prova em contrário. USA + RCP guiada.' },
      { id: 'usa_criterio', text: 'A USA (médico + enfermeiro + condutor) é para risco imediato de morte. Não existe "reserva técnica" fora deste manual.' },
    ],
  },
  {
    id: 'p2', day: 2, code: 'p.2', title: 'Protocolo de trote',
    intro: 'O trote tira a ambulância de quem precisa. Mas tratar emergência real como trote é a falha mais grave da regulação. O endereço quem confere é a TARM (está no post-it); o regulador desconfia pelo que ouve. Na dúvida, liga de volta. Custa meia hora.',
    rules: [
      { id: 'trote_sinais', text: 'Sinais de trote (o que o regulador ouve): relato de cinema sem nenhum detalhe do corpo; respostas rápidas demais ou que se contradizem nas perguntas fixas (pulso, respiração, cor da pele, acordado); fundo que não combina (silêncio onde devia ter desespero, TV, videogame, sinal de escola, eco de banheiro); recusa em pôr o paciente ou alguém perto na linha; pressa pela sirene ("manda com a sirene ligada!"); vídeo recusado ou "câmera quebrada". Risada ao fundo é raro — e às vezes é de nervoso.' },
      { id: 'trote_quadro', text: 'Números marcados como trote vão para o quadro de cortiça. Número no quadro NÃO prova trote: pessoas reais também ligam de números marcados.' },
      { id: 'ligar_volta', text: 'Ferramenta "Ligar de volta": desliga e retorna para o número (custa 30 min). Número inexistente, desligado ou caixa postal de adolescente reforçam a suspeita; quem precisa de ajuda atende na hora.' },
      { id: 'crianca', text: 'Criança ao telefone: peça para falar com um adulto. Se não houver adulto consciente, regule pelo que a criança descreve.' },
    ],
  },
  {
    id: 'p3', day: 3, code: 'p.3', title: 'Dor torácica',
    rules: [
      { id: 'peito', text: 'Mais de 40 anos + suor frio + dor irradiada (braço, costas, queixo) = provável infarto. USA.' },
      { id: 'atipico', text: 'Diabéticos, idosos e mulheres podem infartar sem dor clássica: cansaço, enjoo, "azia", suor frio. Desconfie.' },
      { id: 'muscular', text: 'Dor em pontada que piora ao apertar o local, após esforço físico, em jovem sem fatores de risco: provavelmente muscular. Orientação.' },
    ],
  },
  {
    id: 'p3v', day: 3, code: 'p.3-V', title: 'Videoatendimento (Programa VER)',
    intro: 'Programa VER (Videoatendimento de Emergência na Regulação). O sistema manda um link por mensagem; se quem liga aceitar, você vê a cena pela câmera do celular. Franquia de 3 vídeos por plantão.',
    rules: [
      { id: 'video_quando', text: 'Use quando o relato não fecha: suspeita de trote, quem minimiza ("não é nada"), pânico que pode ser exagero, história que não explica o que aconteceu.' },
      { id: 'video_custo', text: 'Pedir o link custa 2 min, mesmo se a pessoa recusar. Conectar leva de 3 a 8 min (sinal fraco na Vila Esperança, Vila Nova, Jardim Primavera, Parque e Distrito). Cada "mostre" custa de 3 a 6 min.' },
      { id: 'video_vermelho', text: 'Vermelho evidente não espera vídeo: decida primeiro. O minuto gasto olhando é o minuto que a viatura não andou.' },
      { id: 'video_limites', text: 'O vídeo mostra cor da pele, postura, esforço para respirar, sangue, deformidade e o ambiente. NÃO mostra pressão, glicemia, pulso, temperatura nem a pupila. Quem segura a câmera escolhe o que você vê.' },
      { id: 'video_local', text: 'Só funciona se quem liga estiver junto do paciente (Protocolo RM1).' },
      { id: 'video_nunca', text: 'Nunca peça vídeo para quem está escondido de um agressor ou em crise suicida: a câmera expõe e afasta. Acolha pela voz.' },
      { id: 'video_copo', text: 'Teste do copo: febre + manchas roxas que NÃO somem quando se aperta um copo de vidro em cima = púrpura. Vermelho (USA).' },
      { id: 'video_discordante', text: 'História discordante (o que se vê não combina com o que contam — "caiu da cama" com marcas de idades diferentes): suspeita de maus-tratos. Notificar e acionar apoio policial (Protocolo RM9).' },
      { id: 'video_morte', text: 'Sinais de morte evidente (rigidez, manchas roxas nas partes de baixo do corpo, decomposição): a constatação pode ser feita por telemedicina (Protocolo RM7). Morte natural: SVO; violenta ou suspeita: PM/IML.' },
      { id: 'video_trote', text: 'Trote filmado vale prova: registre como TROTE e a gravação vai para a PM (lei municipal do trote). Trotista costuma recusar, enrolar ou desligar quando você pede o vídeo.' },
    ],
  },
  {
    id: 'p4', day: 4, code: 'p.4', title: 'Cena insegura',
    rules: [
      { id: 'cena', text: 'Violência em andamento (arma, agressor no local, briga): acionar PM junto com a viatura. A equipe não entra em cena insegura.' },
      { id: 'cena_falta', text: 'Mandar equipe para cena insegura sem PM = advertência imediata.' },
      { id: 'cena_bombeiros', text: 'Vítima presa (ferragens, máquina, desabamento), afogamento com resgate, incêndio e choque elétrico com fio energizado: chame os Bombeiros junto com a ambulância. A equipe só se aproxima depois que eles liberarem a cena.' },
    ],
  },
  {
    id: 'p5', day: 5, code: 'p.5', title: 'Corte de frota (Saúde+ Gestão)',
    intro: 'Comunicado da coordenação: a partir de hoje a frota opera com 2 USA e 4 USB.',
    rules: [
      { id: 'frota', text: 'Frota: USA 01 (Centro), USA 02 (Norte), USB 01 a 04. A USA 03 e a USB 05 saem de circulação.' },
      { id: 'meta', text: 'Meta da OS: "uso racional" de USA. Painel de metas visível na mesa. (A meta não está acima deste manual.)' },
    ],
  },
  {
    id: 'p5b', day: 5, code: 'p.5-B', title: 'Respiratório e asma',
    rules: [
      { id: 'asma_mod', text: 'Asma moderada: chia e cansa, mas completa as frases, sem lábios roxos, melhora só em parte com a bombinha. USB.' },
      { id: 'asma_grave', text: 'Asma grave: frases entrecortadas (palavras soltas) ou não consegue falar, lábios/unhas roxos, sonolência, peito afundando muito. USA.' },
      { id: 'torax_silencioso', text: 'ATENÇÃO: "parou de chiar" em crise grave pode ser tórax silencioso — sinal de gravidade extrema, não de melhora.' },
      { id: 'ansiedade', text: 'Crise de ansiedade: formigamento na boca e nas mãos, fala frases inteiras, lábios normais. Orientar respiração guiada.' },
    ],
  },
  {
    id: 'p6', day: 6, code: 'p.6', title: 'AVC',
    rules: [
      { id: 'fast', text: 'Teste FAST: rosto torto ao sorrir, braço que cai, fala enrolada. Qualquer um positivo = suspeita de AVC.' },
      { id: 'janela', text: 'Janela de 4h30 desde a última vez em que foi visto bem. Dentro da janela, acordado e só com sinais do FAST: USB já atende (USA, se estiver livre) → Regional. Inconsciente, convulsionando ou com a via aérea em risco: USA → Regional. Fora da janela: USB.' },
      { id: 'acordou', text: 'Acordou com os sintomas: o início é a última vez em que foi visto bem (mesmo de madrugada), não a hora em que acordou.' },
      { id: 'hipoglicemia', text: 'Hipoglicemia imita AVC: diabético em uso de insulina, suado, confuso ou desacordado = USA. Se acordado e engolindo, açúcar.' },
    ],
  },
  {
    id: 'p7', day: 7, code: 'p.7', title: 'Obstetrícia',
    rules: [
      { id: 'expulsivo', text: 'Período expulsivo (vê a cabeça, vontade de fazer força): USB + orientação de parto por telefone. Cordão, pé, mão ou nádegas aparecendo antes da cabeça, hemorragia forte ou convulsão: USA.' },
      { id: 'eclampsia', text: 'Gestante com convulsão, ou com pressão alta + dor de cabeça forte, dor na boca do estômago ou visão "brilhando": USA.' },
      { id: 'inicio_parto', text: 'Início de trabalho de parto (contrações espaçadas, bolsa íntegra): orientar ir à maternidade por meios próprios.' },
      { id: 'sangramento_gest', text: 'Sangramento pequeno, sem dor, no início da gestação: orientação (maternidade/UBS). Com dor, ou depois de 20 semanas e mais que um fio de sangue: USB. Sangramento forte (coágulos, encharca a roupa), dor intensa ou tontura: USA.' },
    ],
  },
  {
    id: 'p9a', day: 9, code: 'p.9-A', title: 'Destino hospitalar',
    rules: [
      { id: 'destino_reg', text: 'REGIONAL (REG): trauma grave, vermelhos clínicos, pediatria grave.' },
      { id: 'destino_upa', text: 'UPA NORTE (UPA): amarelos adultos e pediátricos, fraturas simples.' },
      { id: 'destino_mat', text: 'MATERNIDADE (MAT): gestantes com mais de 20 semanas e partos.' },
    ],
  },
  {
    id: 'p9b', day: 9, code: 'p.9-B', title: 'Concorrência de recursos',
    rules: [
      { id: 'concorrencia', text: 'Dois vermelhos e um só recurso avançado: priorize (1) maior risco imediato de morte, (2) menor tempo de chegada, (3) possibilidade de suporte intermediário. Registre a justificativa.' },
    ],
  },
  {
    id: 'p9c', day: 9, code: 'p.9-C', title: 'Impedimento do regulador',
    rules: [
      { id: 'impedimento', text: 'O regulador não deve regular familiar nem pessoa com quem tenha vínculo. Nesses casos, aciona a coordenação (declarar impedimento).' },
    ],
  },
  {
    id: 'p11', day: 11, code: 'p.11', title: 'Epidemia de dengue',
    rules: [
      { id: 'dengue_sem', text: 'Dengue sem sinais de alarme: hidratação e UBS. Orientação.' },
      { id: 'dengue_alarme', text: 'Sinais de alarme: dor abdominal intensa, vômitos persistentes, sangramento de mucosa, sonolência, tontura ao levantar. USB → UPA (idoso ou confuso: REG).' },
      { id: 'dengue_grave', text: 'Choque: pele fria, sangramento com tontura, desmaio, pulso fraco. USA → Regional.' },
      { id: 'dengue_gestante', text: 'Gestante com febre: risco aumentado. USB → Maternidade.' },
    ],
  },
  {
    id: 'p12', day: 12, code: 'p.12', title: 'Saúde mental',
    rules: [
      { id: 'surto', text: 'Agitação ou ameaça a terceiros: USB + PM como apoio. Com arma ou agressão em curso, a PM entra primeiro e a USA pode ir de apoio (sedação) se o risco for alto.' },
      { id: 'crise', text: 'Crise emocional com risco de se machucar: USB + acolhimento por telefone. Plano, meio à mão ou tentativa em curso: USA. A ligação não pode cair. Exiba o CVV (188).' },
      { id: 'acolher', text: 'Acolher: escutar, não julgar, não apressar, não minimizar. Perguntar direto sobre suicídio (perguntar não induz) e se há alguém por perto. Não deixar a pessoa sozinha.' },
    ],
  },
  {
    id: 'p13', day: 13, code: 'p.13', title: 'Intoxicação em crianças',
    rules: [
      { id: 'intox_orient', text: 'Orientação imediata enquanto a viatura se desloca: NÃO provocar vômito, guardar a embalagem, observar a respiração.' },
      { id: 'intox_grave', text: 'Produto cáustico (soda, água sanitária concentrada) ou remédio de adulto (pressão, diabetes, calmante) em criança: USA → Regional.' },
      { id: 'corpo_estranho', text: 'Objeto engolido (moeda) sem dificuldade para respirar ou engolir: orientação, UPA por meios próprios. Pilha ou bateria de botão: urgência (USB), sem esperar sintomas.' },
    ],
  },
  {
    id: 'p15', day: 15, code: 'p.15', title: 'Múltiplas vítimas',
    rules: [
      { id: 'start_verde', text: 'START: anda sozinho → VERDE (UPA por meios próprios).' },
      { id: 'start_vermelho', text: 'Respira > 30/min, enchimento capilar > 2 s ou não obedece comandos → VERMELHO (USA).' },
      { id: 'start_amarelo', text: 'Não anda, mas respira normal, perfunde e obedece → AMARELO (USB).' },
      { id: 'reforco', text: 'Limite de viaturas por evento: peça reforço regional e preserve uma USA para a cidade, se possível.' },
    ],
  },
  {
    id: 'p17', day: 17, code: 'p.17', title: 'Chuvas',
    rules: [
      { id: 'alagamento', text: 'Ruas alagadas aparecem no mapa. Rotas ficam mais longas; algumas viaturas podem ficar presas.' },
      { id: 'bombeiros', text: 'Resgate, ilhados, afogamento, desabamento e choque elétrico em área alagada: Bombeiros obrigatório.' },
    ],
  },
  {
    id: 'p19', day: 19, code: 'p.19', title: 'Regional sem vaga',
    rules: [
      { id: 'vaga_zero', text: 'Regional sem vaga: para vermelho, negocie "vaga zero" por telefone. O paciente grave não pode esperar na prancha.' },
    ],
  },
];

export const FLEET: FleetSpec[] = [
  { id: 'USA01', type: 'USA', label: 'USA 01', base: 'base_centro', crew: 'Seu Bené (condutor) · Dr. Castro · Enf. Márcio', radioName: 'USA 01 · BENÉ' },
  { id: 'USA02', type: 'USA', label: 'USA 02', base: 'base_norte', crew: 'Tico (condutor) · Dra. Fernanda · Enf. Sueli', radioName: 'USA 02 · TICO' },
  { id: 'USA03', type: 'USA', label: 'USA 03', base: 'base_ve', crew: 'Zé Carlos (condutor) · Dr. Ivo · Enf. Rita', radioName: 'USA 03 · ZÉ CARLOS' },
  { id: 'USB01', type: 'USB', label: 'USB 01', base: 'base_ve', crew: 'Téc. Joana · Paulão (condutor)', radioName: 'USB 01 · JOANA' },
  { id: 'USB02', type: 'USB', label: 'USB 02', base: 'base_centro', crew: 'Téc. Ramon · Dida (condutor)', radioName: 'USB 02 · RAMON' },
  { id: 'USB03', type: 'USB', label: 'USB 03', base: 'base_norte', crew: 'Téc. Lia · Beto (condutor)', radioName: 'USB 03 · LIA' },
  { id: 'USB04', type: 'USB', label: 'USB 04', base: 'base_centro', crew: 'Téc. Edu · Marcão (condutor)', radioName: 'USB 04 · EDU' },
  { id: 'USB05', type: 'USB', label: 'USB 05', base: 'base_norte', crew: 'Téc. Neide · Juca (condutor)', radioName: 'USB 05 · NEIDE' },
];

export function fleetForDay(s: GameState): string[] {
  if (s.mode === 'infinito') return ['USA01', 'USA02', 'USB01', 'USB02', 'USB03', 'USB04'];
  if (s.day <= 4) return FLEET.map((f) => f.id);
  const base = ['USA01', 'USA02', 'USB01', 'USB02', 'USB03', 'USB04'];
  if (s.day >= 19 && s.flags['reforco_frota']) base.splice(2, 0, 'USA03');
  return base;
}

export function manualUntil(day: number): string[] {
  return MANUAL.filter((p) => p.day <= day).map((p) => p.id);
}

export const DOCS: Record<string, DeskDoc> = {
  recibo_jairo: {
    id: 'recibo_jairo',
    title: 'Recibo do Seu Jairo (geladeira)',
    text: 'JAIRO REFRIGERAÇÃO — Jairo Bento Lima. Rua Quaresmeira, 1720 — Jardim Primavera. "Conserto de geladeira — 1 ano de garantia." No verso, rabiscado: "neto Gabriel — 9-8877 (pra emergência)".',
    clues: [
      { id: 'doc:jairo_end', text: 'Recibo: Seu Jairo mora na Rua Quaresmeira, 1720 — Jardim Primavera' },
      { id: 'doc:jairo_neto', text: 'Recibo: "neto Gabriel — 9-8877"' },
    ],
  },
  bilhete_marcia: {
    id: 'bilhete_marcia',
    title: 'Bilhete da professora (do sarau de segunda)',
    // dia 9: o bilhete do sarau de segunda está na mesa (você trouxe e esqueceu)
    text: (c) =>
      `"${protagonistFirst(c.g, c.s)}, o Liam leu a redação mais bonita da turma. Ele tem muito orgulho de você. — Tia Márcia, 3º B (Márcia Albuquerque Reis)"` +
      (c.flag('marcia_caneta_alerta') ? ' No verso, com a sua letra, sublinhado duas vezes: "alérgica a tudo, até abelha — caneta vencida?"' : ''),
    clues: [{ id: 'doc:marcia', text: 'Bilhete: "Tia Márcia, 3º B — Márcia Albuquerque Reis"' }],
  },
  jornal_rosangela: {
    id: 'jornal_rosangela',
    title: 'Gazeta de Santa Aurora (quinta-feira)',
    // ROTEIRO R1: o homem do envelope é o homem da pizza (W.T., assessor de gabinete na Câmara)
    text: (c) =>
      c.key('rosangela') === 'perdido'
        ? 'Matéria de fundo, página 3: "RUA IPÊ: POLÍCIA AINDA PROCURA O MARIDO. A moradora do sobrado verde da Rua Ipê, 112, foi morta em casa na segunda. A ligação para a emergência tinha sido encerrada. O marido, W.T., 41, assessor parlamentar na Câmara, está foragido."'
        : 'Matéria de fundo, página 3: "TRÊS DIAS DEPOIS: A MULHER QUE PEDIU PIZZA. Na segunda, uma moradora da Rua Ipê, 112, ligou para a emergência fingindo pedir uma calabresa. O agressor, W.T., 41, assessor de gabinete na Câmara, foi preso em flagrante. Na casa, a polícia encontrou uma gaveta com envelopes de dinheiro com a cinta do gabinete 7."',
    until: 9,
    clues: [{ id: 'doc:rua_ipe', text: 'Jornal: o caso da Rua Ipê, 112 (casa da Rosângela) — W.T., assessor de gabinete' }],
  },
  ordem_peixoto: {
    id: 'ordem_peixoto',
    title: 'Post-it: ordem verbal',
    text: '"Peixoto, 13:45: USA 01 é reserva técnica, só sai pra parada." (anotação sua)',
    clues: [{ id: 'doc:ordem_peixoto', text: 'Ordem verbal do Peixoto: "USA 01 só sai pra parada"' }],
  },
  cartao_carla: {
    id: 'cartao_carla',
    title: 'Cartão de visita',
    text: 'CARLA NUNES — jornalista, Gazeta de Santa Aurora. (17) 99812-3030.',
    clues: [{ id: 'doc:carla', text: 'Cartão da jornalista Carla Nunes' }],
  },
  peixoto_pai: {
    id: 'peixoto_pai',
    title: 'Anotação: conversa com o Peixoto',
    text: '"Meu pai tem 84 anos e nunca precisou de ambulância. É hábito, {dr}, o povo se acostumou mal." — Dr. Peixoto, dia 5. (O pai: Seu Osvaldo Peixoto, mora sozinho na Bela Vista. "Com uma cuidadora que ele demite toda semana.")',
    clues: [{ id: 'doc:peixoto_pai', text: 'Peixoto: "Meu pai, Osvaldo, 84 anos, nunca precisou de ambulância"' }],
  },
  // ROTEIRO 3.2: o bilhete das 22:07 (dia 10). Existe só com `anotou_henrique_d10`; a frente D11–20 põe na mesa
  // do dia 12 (fx.doc('bilhete_henrique')). `bilhete_origem`: 'papel' (anotou na hora) ou 'desenho' (D11).
  bilhete_henrique: {
    id: 'bilhete_henrique',
    title: 'Papel de pão dobrado em quatro',
    text: (c) => {
      const esp = Number(c.val('zelia_espera')) || 40;
      const fim = c.flag('zelia_bene_corrigiu')
        ? ' Embaixo, menor: "O Bené corrigiu pelo rádio. 15 min."'
        : c.flag('zelia_ze_carlos')
          ? ' Embaixo, menor: "Zé Carlos veio a pé. USB: ' + esp + ' min."'
          : c.flag('zelia_tarm_corrigiu')
            ? ' Embaixo, menor: "A TARM corrigiu. ' + esp + ' min."'
            : ' Embaixo, menor: "USB: ' + esp + ' min."';
      const nota = '"22:07. Henrique. Voz arrastada. Pediu o número duas vezes. Passou Palmeiras em vez de Acácias."';
      return c.val('bilhete_origem') === 'desenho'
        ? 'A sua letra, tremida, escrita depois de olhar o desenho do Liam: ' + nota + fim + ' Atrás, um pedacinho de giz de cera azul grudado.'
        : 'A sua letra, tremida: ' + nota + fim;
    },
    until: 12,
    clues: [{ id: 'doc:bilhete_henrique', text: 'Bilhete: "22:07. Henrique. Voz arrastada. Passou Palmeiras em vez de Acácias."' }],
  },
  postit_cida: {
    id: 'postit_cida',
    title: 'Post-it no quadro',
    text: '"Dona Cida (79): liga quase todo dia. Viúva, mora sozinha. Pressão, novela."',
    clues: [{ id: 'doc:cida', text: 'Post-it: "Dona Cida: só conversa"' }],
  },
};

export const NAMES = {
  m: ['José', 'João', 'Antônio', 'Francisco', 'Carlos', 'Paulo', 'Pedro', 'Lucas', 'Luiz', 'Marcos', 'Gabriel', 'Ricardo', 'Daniel', 'Rubens', 'Bruno', 'Eduardo', 'Felipe', 'Raimundo', 'Rodrigo', 'Manoel', 'Sebastião', 'Valdir', 'Jorge', 'Vicente', 'Cícero', 'Geraldo', 'Elias', 'Reginaldo', 'Adilson', 'Matheus', 'Kauã', 'Enzo', 'Samuel', 'Arthur', 'Otávio', 'Silvio', 'Osmar', 'Nilton', 'Ademar', 'Josué'],
  f: ['Maria', 'Ana', 'Francisca', 'Antônia', 'Adriana', 'Elaine', 'Silvana', 'Fernanda', 'Patrícia', 'Aline', 'Sandra', 'Camila', 'Amanda', 'Bruna', 'Jéssica', 'Letícia', 'Júlia', 'Luciana', 'Vanessa', 'Mariana', 'Gabriela', 'Regina', 'Denise', 'Sueli', 'Valdirene', 'Solange', 'Tereza', 'Rita', 'Cristina', 'Irene', 'Kátia', 'Larissa', 'Beatriz', 'Helena', 'Alice', 'Lurdes', 'Eliane', 'Iracema', 'Zuleide', 'Raimunda'],
  last: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa', 'Rocha', 'Dias', 'Nascimento', 'Andrade', 'Moreira', 'Moraes', 'Marques', 'Machado', 'Mendes', 'Freitas', 'Cardoso', 'Ramos', 'Gonçalves', 'Santana', 'Pacheco', 'Araújo', 'Pinto', 'Quintino', 'Bento', 'Prado'],
};
