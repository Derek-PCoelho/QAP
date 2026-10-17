// =============================================================================
// QAP — Emergency Dispatch — tipos centrais do motor
// O motor é puro (sem DOM). Conteúdo (ligações, cenas, jornais) é escrito em TS
// e pode usar funções para condições/efeitos/texto. O ESTADO é sempre serializável.
// =============================================================================

export type Resource = 'USA' | 'USB' | 'ORI' | 'TROTE';
export type Color = 'vermelho' | 'amarelo' | 'verde' | 'azul';
export type TruthSev = Color | 'trote';
export type Support = 'PM' | 'BOMB';
export type Dest = 'REG' | 'UPA' | 'MAT';
export type Referral = 'UBS' | 'UPA' | 'REG' | 'MAT' | 'CASA';
export type Gender = 'M' | 'F';
export type Difficulty = 'narrativo' | 'padrao' | 'real';
export type Mode = 'campanha' | 'infinito' | 'simone';
export type Phase = 'jornal' | 'plantao' | 'relatorio' | 'casa' | 'final' | 'gameover';

export type CallerType =
  | 'comum' | 'trotista' | 'exagerador' | 'minimizador' | 'testemunha' | 'crianca'
  | 'frequentador' | 'embriagado' | 'profissional' | 'disfarcado' | 'vip' | 'familia' | 'jornalista';

export type VarName = 'desgaste' | 'lacos' | 'integridade' | 'humanidade' | 'lealSimone' | 'lealHenrique' | 'intimBene' | 'pressao' | 'wesley' | 'emprego';
export type KeyPatient = 'antonio' | 'davi_marcia' | 'rosangela' | 'juliana' | 'jairo' | 'osvaldo' | 'cida';
export type Source = 'voce' | 'lucia' | 'bene' | 'peixoto';
export type FamilyMember = 'lucia' | 'davi' | 'zelia';
export type MemberStatus = 'bem' | 'fome' | 'frio' | 'doente' | 'triste' | 'critico' | 'internado' | 'ausente' | 'morto';

export type LineStyle = 'arrastada' | 'sussurro' | 'grito' | 'choro' | 'tremida' | 'calma' | 'ofegante' | 'rindo' | 'fantasma';

/** Perfis de voz para o balbucio sintetizado (estilo Papers, Please). */
export type VoiceId =
  | 'homem' | 'mulher' | 'idoso' | 'idosa' | 'crianca' | 'menino' | 'adolescente' | 'jovem_h' | 'jovem_m'
  | 'grave' | 'aguda' | 'bebado' | 'profissional' | 'simone' | 'peixoto' | 'henrique' | 'bene' | 'lucia' | 'alex' | 'davi' | 'zelia' | 'cida' | 'radio';

/** Camadas de ambiente sonoro de cada ligação. */
export type AmbientId =
  | 'tv' | 'chuva' | 'festa' | 'choro' | 'silencio' | 'chuveiro' | 'rua' | 'risadas' | 'radio_am' | 'passaros'
  | 'cachorro' | 'ventilador' | 'buzinas' | 'sirene' | 'respiracao' | 'videogame' | 'gemidos' | 'multidao'
  | 'vento' | 'agua' | 'cozinha' | 'bar' | 'igreja' | 'escola' | 'maquina' | 'tiros' | 'gritos' | 'bebe' | 'desenho' | 'onibus' | 'academia' | 'musica';

export type GuideId = string; // 'rcp' | 'respiracao' | 'multiplas' | ids de roteiros em content/guides.ts

// ----------------------------------------------------------------------------
// Contexto para funções de conteúdo
// ----------------------------------------------------------------------------
export interface Ctx {
  s: GameState;
  day: number;
  g: Gender;
  flag(name: string): boolean;
  val<T = unknown>(name: string): T | undefined;
  v(name: VarName): number;
  money(): number;
  key(k: KeyPatient): 'salvo' | 'perdido' | undefined;
  /** aleatório determinístico (semente da partida) */
  rand(): number;
}

export interface EffCtx extends Ctx {
  set(flag: string, value?: boolean | number | string): void;
  unset(flag: string): void;
  add(v: VarName, delta: number, reason?: string): void;
  pay(amount: number, reason: string): void;
  keyPatient(k: KeyPatient, r: 'salvo' | 'perdido'): void;
  source(s: Source): void;
  diary(text: string, kind?: DiaryKind, name?: string): void;
  board(entry: BoardEntryIn): void;
  doc(id: string): void;
  toast(text: string): void;
  family(m: FamilyMember, status: MemberStatus): void;
  achievement(id: string): void;
}

export type Txt = string | ((c: Ctx) => string);
export type Cond = (c: Ctx) => boolean;
export type Effect = (c: EffCtx) => void;

// ----------------------------------------------------------------------------
// Falas e transcrição
// ----------------------------------------------------------------------------
export interface LineDef {
  /** texto; aceita marcação de pista {{trecho|idDaPista}} e tokens {dr}, {nome}, {m:masc|fem}... */
  t: Txt;
  who?: string;
  noise?: boolean;
  style?: LineStyle;
  when?: Cond;
}
/** string: "[ruído]" vira legenda de ambiente; "QUEM: fala" define o falante. */
export type LineIn = string | LineDef;
export type AnswerIn = LineIn | LineIn[] | ((c: Ctx) => LineIn | LineIn[]);

export interface ExtraQ {
  id: string;
  label: string;
  say?: Txt;
  cost?: number;
  a: AnswerIn;
  /** só aparece depois de desbloqueada: por outra pergunta (`unlocks`) ou por um gatilho de `unlockedBy` */
  locked?: boolean;
  unlocks?: string[];
  /**
   * Gatilhos que destravam esta pergunta `locked` (basta um):
   *  - id de pergunta já feita nesta ligação (base, extra ou 'callback' = Ligar de volta);
   *  - 'video' (a videochamada conectou) ou 'video:<idDoPonto>' (olhou aquele ponto);
   *  - 'quadro' (o número desta ligação está no quadro de trotes);
   *  - 'endereco' (a Simone anotou que o endereço não confere ou que há um marco nele);
   *  - 'doc:<id>' (o documento está na mesa) · 'lido:<id>' (o documento foi lido);
   *  - 'flag:<nome>' (flag da campanha) · 'sflag:<nome>' (flag do plantão).
   */
  unlockedBy?: string[];
  when?: Cond;
  onAsk?: Effect;
  kind?: 'pergunta' | 'confronto' | 'fala' | 'acalmar';
  /** repete? padrão: não (some depois de perguntada) */
  repeat?: boolean;
  /**
   * Caixa em que a pergunta aparece (1.1). Sem ela: confronto fica sempre à vista quando liberado;
   * o resto vai pela heurística de `extraBox` (palavras do texto) ou para a caixa da ligação.
   */
  cat?: BoxId;
}

/** @deprecated Resto do Modo Inconsistência (removido na 1.1). Nas ligações e nos dias é ignorado;
 *  na casa, `InspectDef.links` ainda diz o que cada objeto do "reparar" destrava. */
export interface LinkDef {
  a: string;
  b: string;
  kind?: 'contra' | 'confirma';
  insight: Txt;
  unlock?: string | string[];
  onFind?: Effect;
}

// ----------------------------------------------------------------------------
// Verdade clínica da chamada
// ----------------------------------------------------------------------------
export interface RiskDef {
  /** minutos (desde a chegada da ligação) até cuidado adequado com sobrevivência garantida */
  good: number;
  /** a partir daqui: óbito (vermelho) ou piora/sequela (amarelo) */
  bad: number;
  needs?: 'USA' | 'USB';
  /** minutos extras que a orientação ativa perfeita acrescenta à janela */
  guideBonus?: number;
}

export interface TruthDef {
  dx: string;
  sev: TruthSev;
  ok: Resource[];
  sup?: Support[];
  dest?: Dest[];
  ref?: Referral[];
  must?: string[];
  risk?: RiskDef;
  inevitable?: boolean;
  key?: KeyPatient;
  prankKind?: 'trote' | 'acidental' | 'teste' | 'desabafo';
  /** nenhuma decisão gera punição disciplinar (só narrativa) */
  noPenalty?: boolean;
  /** recurso "ideal" para efeito de bônus quando ok tem mais de um (default: o primeiro) */
  best?: Resource;
}

export interface WorsenDef {
  after: number;
  /** 'decidido' (padrão): só piora se ainda não carimbou. 'sempre': piora mesmo após carimbo, se ainda na linha. */
  unless?: 'decidido' | 'nada';
  lines: LineIn[];
  truth?: Partial<TruthDef> | ((c: Ctx) => Partial<TruthDef>);
  /** a janela de risco passa a contar a partir da piora (ex.: parada depois de esperar na fila) */
  resetRisk?: boolean;
  guide?: GuideId;
  onTrigger?: Effect;
}

export interface GuideRef {
  id: GuideId | ((c: Ctx) => GuideId);
  /** abre automaticamente ao carimbar (padrão true) */
  auto?: boolean;
  when?: Cond;
  /** abre também se a decisão for ORI (ex.: crise de ansiedade, intoxicação leve) */
  onOri?: boolean;
}

export interface RadioTexts {
  ok?: Txt; excess?: Txt; under?: Txt; prank?: Txt; unsafe?: Txt; dead?: Txt; late?: Txt; dismissed?: Txt; saved?: Txt; dest?: Txt;
  /** quando ninguém liga de novo (noFollowup) e a pessoa morre: o que a Simone conta */
  noReturn?: Txt;
}

export type DiaryKind = 'vivo' | 'morto' | 'orientado' | 'trote' | 'nota' | 'sequela';

export interface DiaryDef {
  alive?: Txt;
  dead?: Txt;
  ori?: Txt;
  /** sobreviveu com sequela (demora, dispensa) */
  sequela?: Txt;
  later?: { day: number; text: Txt; when?: Cond }[];
}

export interface AddrIn {
  rua: string;
  n: number;
  bairro: string;
  /** ponto de referência (resposta padrão para "referencia") */
  ref?: string;
  /** complemento livre: "casa do portão azul" */
  comp?: string;
}

export interface PatientIn { name: string; age?: number; sex?: Gender }

export interface ResolveInfo {
  outcome: CallOutcome;
  verdict?: Verdict;
  decision?: Decision;
}

// ----------------------------------------------------------------------------
// Videochamada de averiguação (Programa VER) — ver docs/VIDEOCHAMADA.md
// ----------------------------------------------------------------------------
export type VideoPlace =
  // casa
  | 'sala' | 'cozinha' | 'quarto' | 'banheiro' | 'quintal' | 'escada' | 'porta' | 'corredor'
  // rua e lugares abertos
  | 'rua' | 'calcada' | 'ponto_onibus' | 'praca' | 'feira' | 'estacionamento' | 'posto' | 'bar_porta' | 'alagado' | 'telhado'
  | 'praia' | 'rio' | 'piscina' | 'campo' | 'chacara' | 'obra'
  // lugares fechados (comércio, trabalho, serviço)
  | 'bar' | 'loja' | 'mercado' | 'padaria' | 'academia' | 'escritorio' | 'fabrica' | 'escola' | 'quadra' | 'igreja' | 'salao'
  | 'hospital' | 'central' | 'onibus' | 'carro';
/**
 * deitado = de barriga para cima · caido = largado no chão · lateral = de lado (posição de recuperação)
 * brucos = de barriga para baixo · encostado = sentado no chão, escorado na parede · parto = em trabalho de parto
 * preso = preso no banco do carro · debrucado = debruçado na mesa · colo = bebê/criança no colo de alguém
 */
export type VideoPose =
  | 'deitado' | 'sentado' | 'em_pe' | 'caido' | 'curvado' | 'convulsao' | 'colo' | 'cadeira' | 'cama'
  | 'lateral' | 'brucos' | 'encostado' | 'ajoelhado' | 'agachado' | 'parto' | 'preso' | 'debrucado';
export type VideoSkin = 'normal' | 'palido' | 'cianose' | 'vermelho' | 'amarelado' | 'cinza';
export type VideoSign =
  | 'suor' | 'olhos_fechados' | 'olhos_revirados' | 'face_torta' | 'braco_caido' | 'baba' | 'espuma' | 'vomito'
  | 'sangue_cabeca' | 'sangue_rosto' | 'sangue_braco' | 'sangue_perna' | 'sangue_tronco' | 'sangue_chao'
  | 'hematomas' | 'hematoma_olho' | 'manchas_roxas' | 'queimadura' | 'deformidade_perna' | 'deformidade_braco'
  | 'inchaco_rosto' | 'respira_rapido' | 'respira_fraco' | 'tiragem' | 'gravida' | 'curativo' | 'tremor'
  | 'livores' | 'rigidez' | 'agitado' | 'rindo' | 'mao_no_peito' | 'mao_na_barriga' | 'molhado'
  // novos
  | 'sangue_nariz' | 'sangue_boca' | 'chorando' | 'placas' | 'poeira' | 'vomito_sangue' | 'maos_no_pescoco'
  | 'maos_na_cabeca' | 'recem_nascido' | 'inchaco_pernas';
export type VideoProp =
  | 'remedios' | 'cartela' | 'seringa' | 'caneta_insulina' | 'garrafa' | 'copo' | 'bombinha' | 'fumaca' | 'fogo'
  | 'agua' | 'faca' | 'arma' | 'moto' | 'carro' | 'bicicleta' | 'escada' | 'cama' | 'sofa' | 'mesa' | 'tv'
  | 'fogao' | 'panela' | 'fio' | 'tijolos' | 'berco' | 'produto' | 'ketchup' | 'boneco' | 'celular' | 'mochila'
  | 'balde' | 'cadeira_rodas' | 'andador' | 'oxigenio' | 'brinquedo' | 'animal' | 'cachorro' | 'capacete'
  // novos
  | 'bola' | 'carrinho_bebe' | 'churrasqueira' | 'galao' | 'viatura' | 'ambulancia' | 'onibus' | 'toalha' | 'gelo'
  | 'vasos' | 'pau' | 'garrafa_quebrada' | 'cadeira' | 'mesa_bar' | 'bengala' | 'glicosimetro' | 'mamadeira'
  | 'bexigas' | 'bolo' | 'aquecedor' | 'quadro_luz' | 'cones' | 'andaime' | 'esteira' | 'masseira' | 'sacola'
  | 'carrinho' | 'vidro' | 'poste' | 'gato' | 'termometro' | 'fralda' | 'livros' | 'pipoca' | 'videogame' | 'maquina';
export type VideoFocus = 'geral' | 'rosto' | 'peito' | 'maos' | 'pernas' | 'ferida' | 'ambiente' | 'objeto' | 'pessoas' | 'chao';
export type VideoAge = 'bebe' | 'crianca' | 'adolescente' | 'adulto' | 'idoso';
/** roupa (paciente ou figurante); sem ela, a roupa sai da semente e do lugar */
export type VideoWear =
  | 'casual' | 'pijama' | 'fralda' | 'escolar' | 'obra' | 'motoboy' | 'social' | 'esporte' | 'banho' | 'vestido'
  | 'farda' | 'bombeiro' | 'socorrista' | 'seguranca' | 'lanchonete' | 'avental' | 'uniforme' | 'jaleco' | 'sem_camisa';
export type VideoHat = 'capacete' | 'capacete_obra' | 'bone' | 'touca' | 'quepe';
/** equipamento posto pela equipe (Intervenção) ou por quem ajuda */
export type VideoGear = 'mascara_o2' | 'soro' | 'torniquete' | 'colar' | 'eletrodos' | 'manta' | 'compressa' | 'tala' | 'oximetro' | 'ambu' | 'toalha';
export type VideoWoundKind = 'corte' | 'tiro' | 'facada' | 'queimadura' | 'exposta' | 'fratura' | 'ralado' | 'mordida' | 'picada' | 'galo' | 'inchaco';
export type VideoBodyPart = 'cabeca' | 'rosto' | 'peito' | 'barriga' | 'braco' | 'mao' | 'perna' | 'joelho' | 'pe';
export interface VideoWound {
  kind: VideoWoundKind;
  at: VideoBodyPart;
}
/** o que a pessoa tem na mão */
export type VideoHold = 'celular' | 'lanterna' | 'bebe' | 'pano' | 'garrafa' | 'papelao' | 'pau' | 'bolsa_soro' | 'caneta' | 'colher' | 'galao';

export interface VideoPatient {
  pose: VideoPose;
  age?: VideoAge;
  sex?: Gender;
  skin?: VideoSkin;
  signs?: VideoSign[];
  /** tom de pele (0 claro … 4 escuro) quando a história diz; sem ele, sai da semente */
  tone?: number;
  wear?: VideoWear;
  /** null = tiraram o capacete */
  hat?: VideoHat | null;
  /** o que o close "Mostrar o ferimento" mostra (sem ele, sai dos sinais) */
  wound?: VideoWound;
  gear?: VideoGear[];
  hold?: VideoHold;
}

/** quem está em volta e o que está fazendo */
export type VideoRole =
  | 'mae' | 'pai' | 'esposa' | 'marido' | 'filho' | 'filha' | 'avo' | 'neto' | 'irmao' | 'irma' | 'familiar'
  | 'vizinho' | 'vizinha' | 'curioso' | 'colega' | 'motorista' | 'passageiro' | 'policial' | 'bombeiro' | 'seguranca'
  | 'professor' | 'aluno' | 'garcom' | 'socorrista' | 'enfermeira' | 'fiel' | 'crianca' | 'bebe' | 'atirador';
export type VideoAct =
  | 'em_pe' | 'olhando' | 'mao_na_boca' | 'maos_na_cabeca' | 'filmando' | 'apontando' | 'gritando' | 'rindo' | 'chorando'
  | 'abanando' | 'lanterna' | 'segurando_crianca' | 'sentado' | 'agachado' | 'escondido' | 'ajoelhado' | 'rcp'
  | 'comprimindo' | 'segurando_cabeca' | 'segurando_mao' | 'ventilando' | 'deitado' | 'ferido' | 'de_costas' | 'correndo';
export interface VideoExtra {
  role: VideoRole;
  act?: VideoAct;
  age?: VideoAge;
  sex?: Gender;
  wear?: VideoWear;
  /** onde fica: esq/dir (perto da câmera, nas bordas), fundo, cabeca/pes (junto do paciente) */
  at?: 'esq' | 'dir' | 'fundo' | 'cabeca' | 'pes';
  hold?: VideoHold;
}

export interface VideoScene {
  place: VideoPlace;
  light?: 'dia' | 'noite' | 'escuro';
  /** null = ninguém no quadro (cena vazia, trote) */
  patient?: VideoPatient | null;
  props?: VideoProp[];
  /** pessoas no quadro, contando o paciente (sem `cast`, os figurantes saem do lugar) */
  people?: number;
  /** quem está em volta, com papel e ação (substitui os figurantes genéricos) */
  cast?: VideoExtra[];
  /** risadas e gente filmando (trote) */
  laughing?: boolean;
  /** câmera tremendo (pânico) */
  shaky?: boolean;
  /** chuva caindo (enchente, temporal) */
  rain?: boolean;
  /** variação do lugar: 'farmacia' (calçada em frente à farmácia) */
  variant?: 'farmacia';
}

/**
 * Dica de cena escrita junto da história (ligação do dia ou verdade do banco): o que a
 * verdade clínica não diz e a história diz — onde está, como está, quem está junto.
 * Vai por cima da cena gerada (src/content/video.ts); os textos substituem os gerados.
 */
export interface VideoHint {
  place?: VideoPlace;
  /** ninguém no quadro (a casa vazia, a porta fechada) */
  vazio?: boolean;
  pose?: VideoPose;
  /** pessoas no quadro, contando o paciente (sem `cast`) */
  people?: number;
  skin?: VideoSkin;
  light?: VideoScene['light'];
  rain?: boolean;
  props?: VideoProp[];
  semProps?: VideoProp[];
  signs?: VideoSign[];
  /** sinais a tirar dos gerados */
  sem?: VideoSign[];
  cast?: VideoExtra[];
  wound?: VideoWound;
  gear?: VideoGear[];
  wear?: VideoWear;
  hat?: VideoHat | null;
  hold?: VideoHold;
  /** primeira impressão e falas dos pontos (sem colchetes) */
  first?: string;
  rosto?: string;
  respira?: string;
  corpo?: string;
  ferida?: string;
  objeto?: string;
  volta?: string;
  /** pedir vídeo aqui faz mal (quem liga está escondido de alguém armado) */
  harmful?: string[];
}

export interface VideoSpot {
  id: string;
  /** botão: "Mostrar o rosto" */
  label: Txt;
  /** o que aparece/ quem liga diz; aceita {{trecho|pista}} para o Modo Inconsistência */
  see: AnswerIn;
  /** minutos de jogo (padrão 4) */
  cost?: number;
  /** enquadramento desenhado */
  focus?: VideoFocus;
  /** muda a cena a partir daqui (ex.: virou a câmera para a cozinha) */
  scene?: Partial<VideoScene>;
  when?: Cond;
  unlocks?: string[];
  onSee?: Effect;
}

export interface VideoDef {
  /** cena desenhada (padrão: gerada a partir da verdade clínica) */
  scene?: VideoScene | ((c: Ctx) => VideoScene);
  /** o que dá para pedir para mostrar (padrão: rosto, respiração, em volta) */
  spots?: VideoSpot[];
  /** substitui só a primeira impressão ao conectar */
  first?: AnswerIn;
  /** quem liga não está com o paciente */
  remote?: boolean | Cond;
  /** recusa (celular sem câmera, desconfiança, trote) */
  refuse?: { lines: AnswerIn; hangup?: boolean; when?: Cond };
  /** pedir vídeo aqui faz mal (vítima escondida, crise suicida, agressor perto) */
  harmful?: { lines: AnswerIn; effect?: Effect; patience?: number; hangup?: boolean };
  /** qualidade do sinal (padrão: pelo bairro) */
  signal?: 'bom' | 'fraco' | 'ruim';
  /** trote: o vídeo serve de prova (padrão: verdade = trote) */
  proof?: boolean;
}

export interface VideoRT {
  state: 'ativo' | 'encerrado';
  /** minuto de jogo em que conectou */
  at: number;
  signal: 'bom' | 'fraco' | 'ruim';
  scene: VideoScene;
  focus: VideoFocus;
  seen: string[];
  /** o vídeo mostrou o trote (vale prova) */
  proof?: boolean;
  /** minutos de jogo gastos com o vídeo nesta ligação */
  minutes: number;
}

// ----------------------------------------------------------------------------
// Intervenção: plantão extra na ambulância (USA 01) — ver docs/INTERVENCAO.md
// ----------------------------------------------------------------------------
export type FieldDest = 'REG' | 'UPA' | 'MAT' | 'LOCAL';
/** info = achado; critico = o que salva; ajuda = bom, não decisivo; neutro = gasta tempo; dano = piora */
export type FieldActKind = 'info' | 'critico' | 'ajuda' | 'neutro' | 'dano';
export type FieldGroup = 'cena' | 'via' | 'resp' | 'circ' | 'neuro' | 'exp' | 'med';
export type FieldVital = 'pa' | 'fc' | 'fr' | 'sat' | 'glic' | 'temp' | 'ritmo' | 'glasgow';
export type FieldVitals = Partial<Record<FieldVital, string>>;

export interface FieldActionDef {
  id: string;
  label: string;
  group: FieldGroup;
  /** segundos que a equipe leva */
  cost: number;
  kind: FieldActKind;
  /** o que se vê e ouve ao terminar (vai para o registro) */
  say: string;
  /** muda a estabilidade ao terminar (dano = negativo) */
  delta?: number;
  /** precisa destas ações concluídas antes */
  needs?: string[];
  /** só aparece depois destas ações (um achado muda o raciocínio) */
  after?: string[];
  /** some depois de qualquer uma destas (o erro deixa de fazer sentido) */
  until?: string[];
  /** sinais que passam a aparecer no monitor */
  shows?: FieldVital[];
  /** muda o que se vê da cena (o paciente é mesclado: só o que vier escrito muda; `gear` soma ao que já tem) */
  scene?: Omit<Partial<VideoScene>, 'patient'> & { patient?: Partial<VideoPatient> | null };
  focus?: VideoFocus;
  /** cena insegura: esta ação libera a entrada */
  secures?: boolean;
  /** entrar em cena insegura: a equipe se fere e a ocorrência acaba */
  hurts?: boolean;
  /** ocorrência sem vítima: encerra como trote */
  endsPrank?: boolean;
}

export interface FieldCaseDef {
  id: string;
  /** o que era (aparece no fim) */
  title: string;
  /** a partir de que dia da campanha pode aparecer */
  minDay?: number;
  /** só entra quando o dia pede */
  special?: boolean;
  qrr: 1 | 2 | 3;
  /** despacho da Regulação */
  radio: string;
  addr: { rua: string; n: number; bairro: string };
  scene: VideoScene;
  /** cena insegura vista de longe, antes de entrar (padrão: a fachada do lugar) */
  far?: VideoScene;
  /** primeira impressão ao chegar */
  see: string[];
  vitals: FieldVitals;
  /** sinais depois de estabilizado (o que muda no monitor) */
  vitalsAfter?: FieldVitals;
  /** estabilidade inicial (0–100) */
  start: number;
  /** pontos de estabilidade perdidos por segundo antes do tratamento */
  decay: number;
  actions: FieldActionDef[];
  /** destinos aceitos; o primeiro é o ideal */
  dest: FieldDest[];
  /** o tratamento definitivo é no hospital: depois do essencial, chegar rápido (a piora continua mais lenta) */
  scoop?: boolean;
  /** tratar no local: sair antes de estabilizar é óbito no caminho (parada cardíaca: o pulso volta na cena, não na ambulância) */
  treatOnScene?: boolean;
  /** cena insegura: só entra depois da ação que "secures" */
  unsafe?: boolean;
  /** sem vítima (trote) */
  prank?: boolean;
  /** o que era e o que importava */
  debrief: string;
  /** protocolos de referência */
  source: string;
  /** falas da equipe durante a cena ("BENÉ: ...") */
  crew?: string[];
}

export type FieldOutcome = 'estavel' | 'instavel' | 'obito' | 'equipe_ferida' | 'trote';
export interface FieldLogLine {
  t: number;
  who?: string;
  text: string;
  kind: 'radio' | 'acao' | 'achado' | 'alerta' | 'equipe' | 'fim';
}
export interface FieldCaseRT {
  id: string;
  /** segundos desde a chegada */
  t: number;
  stab: number;
  done: string[];
  busy?: { id: string; start: number; end: number };
  log: FieldLogLine[];
  harm: number;
  shown: FieldVital[];
  scene: VideoScene;
  focus: VideoFocus;
  /** volta ao plano geral neste segundo */
  focusUntil?: number;
  secured: boolean;
  /** todas as ações críticas feitas */
  stable: boolean;
  crewIdx: number;
  outcome?: FieldOutcome;
  dest?: FieldDest;
  destOk?: boolean;
  pay?: number;
}
export interface FieldResult {
  id: string;
  title: string;
  outcome: FieldOutcome;
  dest?: FieldDest;
  destOk: boolean;
  harm: number;
  pay: number;
  secs: number;
}
export interface FieldShift {
  cases: string[];
  idx: number;
  phase: 'radio' | 'cena' | 'resultado' | 'fim';
  rt?: FieldCaseRT;
  results: FieldResult[];
  /** horário de cada chamado (minutos desde 00:00) */
  clock: number[];
  /** falas de rádio extras antes de cada ocorrência (índice → linhas) */
  extra: Record<number, { who: string; text: string }[]>;
  /** pagamento já aplicado */
  paid?: boolean;
}

export interface CallDef {
  id: string;
  /** horário de chegada 'HH:MM' */
  at: string;
  anchor?: boolean;
  when?: Cond;
  /** etiqueta de banco: com "ligações variáveis" ativado, pode ser substituída por variante do banco */
  pool?: string;
  /** sempre sorteada do banco (pool), mesmo sem "ligações variáveis": o que está escrito aqui é só reserva */
  genOnly?: boolean;
  num: string;
  caller: string;
  callerName?: string;
  type: CallerType;
  voice?: VoiceId;
  note: Txt;
  noteWrong?: Txt;
  noteFixed?: boolean;
  addr: AddrIn;
  amb?: AmbientId[];
  open: LineIn[] | ((c: Ctx) => LineIn[]);
  q?: Partial<Record<string, AnswerIn>>;
  extra?: ExtraQ[];
  callback?: AnswerIn;
  links?: LinkDef[];
  patient: PatientIn;
  truth: TruthDef | ((c: Ctx) => TruthDef);
  worsen?: WorsenDef[];
  guide?: GuideRef;
  radio?: RadioTexts;
  diary?: DiaryDef;
  onAnswer?: Effect;
  onStamp?: (c: EffCtx, d?: Decision) => void;
  onResolve?: (c: EffCtx, r: ResolveInfo) => void;
  /** minutos na fila antes de desistir (padrão 120; âncoras nunca desistem) */
  patience?: number;
  /** modos especiais de tela */
  special?: 'mci' | 'simone' | 'peixoto_teste';
  /** ID de ligação de referência no documento de design (rastreabilidade) */
  ref?: string;
  /** sem anotação da Simone (chega "crua") */
  raw?: boolean;
  /** se ficar para o plantão noturno, o paciente morre (ex.: D11, adolescente com dengue grave) */
  nightDeath?: boolean;
  /** quem liga não consegue ligar de novo (pedido disfarçado, idosa sozinha): dispensar = desfecho sem retorno */
  noFollowup?: boolean;
  /** múltiplas vítimas (dia 15) */
  mci?: MciDef;
  /** ação de impedimento: a coordenação assume a ligação */
  impedimento?: { cost: number; decision: { resource: Resource; color: Color; dest?: Dest; support?: Support[] }; text: Txt; effect?: Effect };
  /** videochamada de averiguação (sem isto, a cena é gerada a partir da verdade clínica) */
  video?: VideoDef | ((c: Ctx) => VideoDef);
  /** dica para a cena gerada da videochamada (lugar, pose, quem está junto); ver VideoHint */
  cena?: VideoHint;
  /**
   * Categoria do chamado (1.1): Clínico, GO ou Trauma (e a cor do post-it da Simone na Onda 2).
   * Sem ela, `callBox` deduz pelo diagnóstico/etiquetas. As perguntas específicas sem `cat`
   * caem nesta caixa.
   */
  cat?: BoxId;
}

export interface MciVictim {
  id: string;
  name: string;
  age: number;
  /** descrição curta do estado (START) */
  desc: string;
  anda: boolean;
  respira: boolean;
  fr?: number;
  enchimento?: number;
  obedece?: boolean;
  /** cor correta */
  cor: Color | 'preto';
  key?: KeyPatient;
}

export interface MciDef {
  victims: MciVictim[];
  /** tempo (min) até as vítimas vermelhas morrerem sem USA */
  redWindow: number;
  /** reforço da cidade vizinha chega em */
  reinforcementMin: number;
  reinforcementUnits: number;
}

// ----------------------------------------------------------------------------
// Cenas (casa, passagens de turno, Simone, finais)
// ----------------------------------------------------------------------------
export interface DLine {
  who: string; // 'LUCIA' | 'DAVI' | 'ZELIA' | 'EU' | 'NARRADOR' | 'SIMONE' | ...
  t: Txt;
  mood?: 'neutro' | 'feliz' | 'triste' | 'bravo' | 'preocupado' | 'surpreso' | 'cansado';
  when?: Cond;
}

export interface Choice {
  label: Txt;
  next?: string;
  effect?: Effect;
  when?: Cond;
  /** desabilita (mas mostra) quando não cumpre */
  needMoney?: number;
  /** bloqueada quando o protagonista está "Irritado" (café) */
  affectionate?: boolean;
  /** só aparece depois de reparar no objeto que destrava este id (casa: `HomeObject.unlock`/`InspectDef.links`) */
  needLink?: string;
  hint?: string;
}

export interface SceneNode {
  lines: DLine[];
  choices?: Choice[];
  next?: string;
  onEnter?: Effect;
}

export type SceneBg = 'cozinha' | 'sala' | 'quarto' | 'porta' | 'escola' | 'central' | 'rua' | 'hospital' | 'mesa' | 'preto' | 'calcada' | 'escritorio' | 'igreja';

export interface HomeObject {
  id: string;
  label: string;
  desc: Txt;
  /** posição na cena (grade 320x180) */
  x: number; y: number; w: number; h: number;
  sprite?: string;
  when?: Cond;
  /** o que reparar neste objeto destrava (ids usados em `Choice.needLink`) */
  unlock?: string | string[];
  /** efeito na primeira vez que ele destrava algo */
  onFind?: Effect;
}

/** "Reparar" da casa: objetos marcados na cena. Um clique no objeto mostra `desc` e dispara os
 *  `unlock`/`onFind` do próprio objeto e dos `links` em que ele aparece (a ou b). */
export interface InspectDef {
  objects: HomeObject[];
  /** pares antigos (objeto × fala/objeto): basta o objeto aparecer num lado para destravar */
  links: LinkDef[];
}

export interface SceneDef {
  id: string;
  bg?: SceneBg;
  cast?: string[];
  nodes: Record<string, SceneNode>;
  inspect?: InspectDef;
}

export interface ShopItem {
  id: string;
  label: string;
  price: number | ((c: Ctx) => number);
  desc: Txt;
  when?: Cond;
  effect?: Effect;
  /** compra única no jogo */
  once?: boolean;
}

export interface BillDef {
  id: string;
  label: string;
  amount: number | ((c: Ctx) => number);
  when?: Cond;
  /** obrigatória? (desconta automático) */
  auto?: boolean;
  onPay?: Effect;
  onSkip?: Effect;
  desc?: Txt;
}

export interface InterludeDef {
  teaser: Txt;
  scene: SceneDef | ((c: Ctx) => SceneDef);
  /** o que acontece se você fizer o bico (o evento se resolve sem você) */
  bico?: SceneDef | ((c: Ctx) => SceneDef);
  bills?: BillDef[];
  shop?: ShopItem[];
  /** multiplicador/bonus de "Ficar com a família" */
  familyLacos?: number;
  onBico?: Effect;
  onFamily?: Effect;
  onRest?: Effect;
  /** sem opção de bico neste dia */
  noBico?: boolean;
  /** plantão na Intervenção: ocorrências especiais deste dia (ids) e falas de rádio entre elas */
  field?: { cases?: string[]; radio?: { before: number; who: string; text: string; when?: Cond }[] };
  /** cena antes da escolha de folga (ex.: chegada em casa) */
  pre?: SceneDef | ((c: Ctx) => SceneDef);
}

export interface NewspaperDef {
  headline: string;
  sub?: string;
  photo?: string;
  stories: { title: string; text: string }[];
  notice?: string;
  ad?: string;
  weather?: string;
}

export interface TimelineOption {
  id: string;
  label: string;
  cost?: number;
  effect?: (c: ShiftScriptCtx) => void;
  reply?: Txt;
  when?: Cond;
}

export interface TimelineDef {
  at: string;
  when?: Cond;
  kind: 'radio' | 'interfone' | 'simone' | 'script' | 'pedido' | 'aviso';
  who?: string;
  text?: Txt;
  options?: TimelineOption[];
  defaultOption?: string;
  /** minutos para responder antes do padrão */
  timeout?: number;
  run?: (c: ShiftScriptCtx) => void;
  id?: string;
}

export interface ShiftScriptCtx extends EffCtx {
  shift: ShiftState;
  now: number;
  unitsOfType(t: 'USA' | 'USB'): UnitState[];
  freeUnits(t?: 'USA' | 'USB'): UnitState[];
  setUnit(id: string, status: UnitStatus, until?: number, note?: string): void;
  radio(from: string, text: string, kind?: RadioKind): void;
  schedule(at: number, timelineId: string): void;
  callStatus(defId: string): CallRT | undefined;
  /** recado/interfone; com opções, vira uma escolha (efeito e resposta como nos eventos da linha do tempo) */
  modal(who: string, text: string, kind?: 'simone' | 'interfone' | 'aviso', options?: TimelineOption[]): void;
  /** pedido de rádio com opções definidas no próprio script */
  request(from: string, text: string, options: TimelineOption[], defaultOpt: string, timeout?: number): void;
  /** flags do turno (não persistem entre dias) */
  sflag(name: string, v?: boolean | number | string): boolean | number | string | undefined;
  /** estende o fim do turno para este horário (minutos desde 00:00) */
  extendShift(until: number): void;
}

export interface HandoverDef {
  lines: DLine[];
  choices?: Choice[];
}

export interface FleetSpec {
  id: string;
  type: 'USA' | 'USB';
  label: string;
  base: string;
  crew: string;
  radioName: string;
}

export interface DayDef {
  day: number;
  title: string;
  weekday: string;
  weather?: string;
  manual?: string[];
  /** ids das viaturas ativas no dia (padrão: frota conforme corte) */
  fleet?: (c: Ctx) => string[];
  goal?: { maxUSA: number; bonus: number };
  newspaper: (c: Ctx) => NewspaperDef;
  handover?: (c: Ctx) => SceneDef | undefined;
  /**
   * 1.1 — cena de IDA para o plantão (casa → ônibus → central), antes da passagem de turno.
   * Roda numa cena da central (SceneOverlay); o relógio ainda não começou. bg sugerido: 'rua'/'calcada'.
   */
  ida?: (c: Ctx) => SceneDef | undefined;
  /**
   * 1.1 — ALMOÇO com a equipe. Às `almocoAt` (padrão '13:00') o relógio para, a fila congela e a
   * cena roda (assim que não houver ligação ativa nem orientação em curso). bg sugerido: 'central'.
   * Devolva undefined para pular (ex.: almoço interrompido escrito na linha do tempo).
   */
  almoco?: (c: Ctx) => SceneDef | undefined;
  /** horário do almoço 'HH:MM' (padrão '13:00') */
  almocoAt?: string;
  /**
   * 1.1 — cena de VOLTA do plantão (central → ônibus → portão), depois do fim do turno e do
   * relatório, antes da casa (é a primeira cena da noite, antes de `interlude.pre`).
   */
  volta?: (c: Ctx) => SceneDef | undefined;
  calls: CallDef[];
  timeline?: TimelineDef[];
  endScene?: (c: Ctx) => SceneDef | undefined;
  interlude?: InterludeDef;
  /** ruas alagadas (dia 17) */
  flood?: boolean;
  /** Regional sem vaga (dias 19-20) */
  noVacancy?: boolean;
  /** campo extra no relatório (ex.: Anexo 9-B) */
  reportField?: (c: Ctx) => ReportField | undefined;
  /** precisão da Simone neste dia (0..1) — padrão por fase */
  simoneAccuracy?: number;
  /** efeitos ao começar o dia (antes do jornal): quadro, documentos na mesa etc. */
  onStart?: Effect;
  /** inconsistências do dia que não dependem de ligação (ex.: ordem verbal do Peixoto × manual) */
  links?: LinkDef[];
  /** tutorial guiado (dia 1) */
  tutorial?: boolean;
  /** escala de tempo especial (ex.: dia 12 durante acolhimento) */
}

export interface ReportField {
  id: string;
  label: string;
  options: { id: string; label: string; when?: Cond; effect?: Effect }[];
}

export interface ManualRule { id: string; text: string }
export interface ManualPage {
  id: string;
  day: number;
  code: string;
  title: string;
  intro?: string;
  rules: ManualRule[];
}

/** Caixas de perguntas da mesa (1.1): Clínico (azul), GO (rosa), Trauma (verde), Outros (branco). */
export type BoxId = 'clinico' | 'go' | 'trauma' | 'outros';
export const BOXES: readonly BoxId[] = ['clinico', 'go', 'trauma', 'outros'];

/** Frases do regulador para o solicitante folgado (caixa Outros) e o que fazem no motor. */
export type OutrosAct = 'gravada' | 'perfil' | 'meios' | 'encerra';

export interface QuestionDef {
  id: string;
  label: string;
  say: string;
  cost: number;
  day?: number;
  group: 'base' | 'protocolo' | 'ferramenta';
  hint?: string;
  /** uma das cinco perguntas fixas (sempre na tela) */
  fixed?: boolean;
  /** caixa(s) em que a pergunta aparece quando aberta */
  box?: BoxId | BoxId[];
  /** frase da caixa Outros: efeito no motor (gravada, não é perfil, meios próprios, encerrar) */
  act?: OutrosAct;
  /** só para a TARM (campanha da Simone); o regulador não vê */
  tarmOnly?: boolean;
}

// ----------------------------------------------------------------------------
// Estado (serializável)
// ----------------------------------------------------------------------------
export type UnitStatus = 'QRV' | 'DESLOC' | 'LOCAL' | 'TRANSP' | 'RETIDO' | 'RETORNO' | 'PANE' | 'FORA';
export type RadioKind = 'info' | 'ok' | 'alerta' | 'obito' | 'pedido' | 'bene';

export interface UnitState {
  id: string;
  type: 'USA' | 'USB';
  label: string;
  base: string;
  crew: string;
  radioName: string;
  status: UnitStatus;
  pos: [number, number];
  path: [number, number][];
  t0: number;
  t1: number;
  callId?: string;
  until?: number;
  dest?: Dest;
  note?: string;
  /** destino atual do deslocamento (para desenhar) */
  target?: [number, number];
}

export interface RadioMsg {
  id: number;
  t: number;
  from: string;
  text: string;
  kind: RadioKind;
  callId?: string;
}

export interface PendingRequest {
  id: string;
  t: number;
  from: string;
  text: string;
  options: { id: string; label: string; cost?: number }[];
  expires: number;
  defaultOpt: string;
  kind: 'timeline' | 'piora' | 'recusa' | 'retencao' | 'hostil' | 'vaga';
  callId?: string;
  timelineId?: string;
  data?: Record<string, unknown>;
}

export interface ShownLine {
  id: number;
  who: string;
  text: string;
  kind: 'caller' | 'regulador' | 'sistema' | 'ruido' | 'insight' | 'video';
  style?: LineStyle;
  t: number;
}

export interface Decision {
  color: Color;
  resource: Resource;
  unit?: string;
  support: Support[];
  dest?: Dest;
  referral?: Referral;
  t: number;
  /** segundos reais desde o atendimento */
  realSec: number;
  /** nenhuma USA livre na hora do carimbo (RM4: na falta de USA, USB) */
  noUSA?: boolean;
}

export type VerdictKind =
  | 'correto' | 'defensavel' | 'sem_justificativa' | 'excesso' | 'falta' | 'trote_enviado'
  | 'dispensou' | 'trote_ok' | 'trote_falso' | 'sem_penalidade';

export interface Verdict {
  kind: VerdictKind;
  safety: boolean;
  destWrong: boolean;
  refWrong: boolean;
  bonus: number;
  notes: number;
  warnings: number;
  golden: boolean;
  text: string;
  revealed: boolean;
  sindicancia?: boolean;
}

export type CallOutcome = 'pendente' | 'salvo' | 'obito' | 'orientado' | 'trote' | 'liberado' | 'sequela' | 'piorou' | 'transportado';

export interface CallRT {
  id: string;
  def: string;
  day: number;
  status: 'fila' | 'ativa' | 'espera' | 'encerrada' | 'desligou' | 'noturno' | 'guia' | 'regulacao';
  arrived: number;
  answered?: number;
  answeredReal?: number;
  realSec: number;
  closed?: number;
  lines: ShownLine[];
  asked: string[];
  unlocked: string[];
  /** caixas de perguntas abertas nesta ligação (1.1) */
  boxes?: BoxId[];
  patience: number;
  worsenIdx: number;
  truthPatch?: Partial<TruthDef>;
  noteRight: boolean;
  noteText: string;
  /** a Simone marcou "Pega essa agora" (post-it vermelho) */
  noteUrgent?: boolean;
  /** conferência do endereço pela Simone: 'nao_confere' (não existe no cadastro) ou 'marco' (há um marco no endereço) */
  addrNote?: 'nao_confere' | 'marco';
  /** a linha que a Simone escreveu sobre o endereço (vai no post-it) */
  noteAddr?: string;
  decision?: Decision;
  verdict?: Verdict;
  units: string[];
  outcome: CallOutcome;
  guide?: { id: GuideId; quality?: number; done: boolean; success?: boolean };
  /** tempo efetivo (min desde chegada) do cuidado adequado */
  careAt?: number;
  /** variante gerada (banco/infinito) */
  gen?: GenParams;
  calmed: number;
  /** ligações de retorno geradas por dispensa */
  followOf?: string;
  /** texto do desfecho para o relatório (noturno, desistência) */
  resultText?: string;
  holdCount: number;
  mismanaged?: boolean;
  revealedAt?: number;
  /** início da janela de risco quando diferente da chegada (piora com resetRisk) */
  riskFrom?: number;
  /** diagnóstico congelado no carimbo (verdades que dependem do relógio) */
  dxAtStamp?: string;
  /** campanha da Simone: pré-triagem feita pela TARM */
  tarm?: TarmInfo;
  /** minutos de conversa antes da decisão (contam mais devagar para a janela de risco) */
  talk?: number;
  /** videochamada de averiguação */
  video?: VideoRT;
  /** pedidos de vídeo nesta ligação (tentativas, inclusive recusas) */
  videoTries?: number;
}

/** reguladores na campanha da Simone */
export type RegId = 'moura' | 'henrique';

export interface TarmInfo {
  color: Color;
  priority: boolean;
  to: RegId;
  /** hora (jogo) em que passou para o regulador */
  at: number;
  /** minutos de jogo entre atender e passar */
  handle: number;
  realSec: number;
  /** triada por quem cobriu a TARM (não pela jogadora) */
  cover?: boolean;
  /** a IA do regulador acertou a decisão */
  aiCorrect?: boolean;
  decidedAt?: number;
}

export interface TarmRegState {
  queue: string[];
  current?: string;
  busyUntil: number;
  decided: number;
  errors: number;
  /** fora da mesa (afastado, sindicância) */
  away?: boolean;
}

export interface TarmShiftState {
  regs: Record<RegId, TarmRegState>;
  passed: number;
  handleSum: number;
  /** a TARM saiu da mesa (crise do dia 17): o resto do turno vai cru para a Rose */
  out?: boolean;
  log: { t: number; text: string }[];
}

export interface GenParams {
  template: string;
  truth: string;
  name: string;
  age: number;
  sex: Gender;
  addr: AddrIn;
  num: string;
  caller: string;
  seed: number;
}

export interface SchedEvent {
  t: number;
  kind: 'arrival' | 'unit' | 'timeline' | 'reveal' | 'followup' | 'request' | 'hangup' | 'phantom' | 'simone' | 'peixoto' | 'death' | 'endShift' | 'ai' | 'notice' | 'cochilo';
  ref: string;
  data?: Record<string, unknown>;
  seq: number;
}

export interface ReportItem {
  callId: string;
  name: string;
  dx: string;
  decision: string;
  verdict: VerdictKind | 'noturno' | 'desligou' | 'pendente';
  money: number;
  text: string;
  outcome: CallOutcome;
  t: number;
}

export interface ModalMsg {
  id: string;
  kind: 'interfone' | 'simone' | 'aviso' | 'henrique' | 'tutorial';
  who: string;
  text: string;
  options?: { id: string; label: string }[];
  timelineId?: string;
  blocking?: boolean;
}

export interface ShiftState {
  day: number;
  time: number;
  start: number;
  end: number;
  calls: Record<string, CallRT>;
  order: string[];
  activeId?: string;
  pending: SchedEvent[];
  seq: number;
  units: Record<string, UnitState>;
  radio: RadioMsg[];
  radioSeq: number;
  requests: PendingRequest[];
  modals: ModalMsg[];
  warnings: number;
  notes: number;
  bonus: number;
  bonusRaw: number;
  deductions: number;
  usaSent: number;
  dispatches: number;
  handled: number;
  deaths: string[];
  saves: string[];
  coffee: number;
  coffeeUntil: number;
  /** emendou a noite na Intervenção: chegou sem dormir */
  semSono?: boolean;
  /** pálpebras pesando agora (minuto em que começou) */
  cochilo?: { at: number };
  /** cochilos que custaram tempo */
  cochilos?: number;
  /** "adiantar até a próxima ligação": o relógio corre 4× enquanto não há nada para fazer */
  fast?: boolean;
  /** noites seguidas na ambulância antes deste plantão (dívida de sono: mais cochilos, menos tempo para reagir) */
  noites?: number;
  photoUsed: boolean;
  diaryRead: boolean;
  guideCallId?: string;
  simoneAway: boolean;
  report: ReportItem[];
  ended: boolean;
  closing: boolean;
  regTimes: number[];
  goldenCount: number;
  phantomSeq: number;
  phantoms: { id: string; t: number }[];
  flags: Record<string, boolean | number | string>;
  goalMet?: boolean;
  noVacancy: boolean;
  flood: boolean;
  costToday: number;
  toasts: Toast[];
  toastSeq: number;
  peixotoCalls: number;
  pauseUntilReal?: number;
  sindicancias: number;
  /** campanha da Simone: mesas dos reguladores */
  tarm?: TarmShiftState;
  /** videochamadas: franquia do plantão e uso */
  video?: { credits: number; used: number; proofs: number; minutes: number };
}

export interface Toast { id: number; text: string; kind: 'bom' | 'ruim' | 'info' | 'dinheiro'; t: number }

export interface DiaryEntry {
  id: string;
  day: number;
  name: string;
  text: string;
  kind: DiaryKind;
  updates: { day: number; text: string }[];
  callDef?: string;
}

export interface BoardEntryIn {
  id: string;
  kind: 'trote' | 'frequente' | 'doc' | 'postit';
  title: string;
  text: string;
  num?: string;
}
export interface BoardEntry extends BoardEntryIn { day: number; count: number }

export interface MemberState {
  status: MemberStatus;
  hunger: number;
  risk: number;
  away?: boolean;
}

export interface BillsState {
  rentDebt: number;
  rentOverdue: number;
  rent: number;
  energyMissed: number;
  energyCut: boolean;
  foodMissed: number;
  medsMissed: number;
  gasMissed: number;
  icebox: boolean;
  fridgeBroken: boolean;
  insulinSpoiled: boolean;
}

export interface DayRecord {
  day: number;
  warnings: number;
  notes: number;
  deaths: number;
  saves: number;
  handled: number;
  pay: number;
  bonus: number;
  deductions: number;
  report: ReportItem[];
  moneyAfter: number;
  timeOff?: 'descanso' | 'familia' | 'bico';
}

export interface GameState {
  v: number;
  id: string;
  seed: number;
  rng: number;
  mode: Mode;
  difficulty: Difficulty;
  gender: Gender;
  /** primeiro nome escolhido pelo jogador (sem ele, o padrão do gênero: Thiago/Camille) */
  name?: string;
  variable: boolean;
  day: number;
  phase: Phase;
  money: number;
  vars: Record<VarName, number>;
  keys: Partial<Record<KeyPatient, 'salvo' | 'perdido'>>;
  sources: Partial<Record<Source, boolean>>;
  flags: Record<string, boolean | number | string>;
  family: Record<FamilyMember, MemberState>;
  bills: BillsState;
  diary: DiaryEntry[];
  board: BoardEntry[];
  docs: string[];
  manual: string[];
  achievements: string[];
  history: DayRecord[];
  shift?: ShiftState;
  totals: { warnings: number; notes: number; deaths: number; saves: number; handled: number; pranks: number; sindicancias: number; coffee: number; bicos: number; calls: number; golden: number };
  irritado: number;
  home?: HomeState;
  gameOver?: GameOverInfo;
  ending?: EndingInfo;
  infinite?: InfiniteState;
  createdAt: number;
  playSeconds: number;
  /** momento (ms) do último save */
  lastSave?: number;
  /** campanha da Simone: o mundo visto pela mesa do regulador (protagonista controlado pela IA) */
  shadow?: GameState;
}

export interface HomeState {
  step: 'pre' | 'escolha' | 'intervencao' | 'cena' | 'contas' | 'loja' | 'fim';
  timeOff?: 'descanso' | 'familia' | 'bico';
  /** plantão extra na Intervenção (o antigo "bico") */
  field?: FieldShift;
  sceneId?: string;
  node?: string;
  lineIdx: number;
  paid: string[];
  bought: string[];
  found: string[];
  tried: string[];
  inspected: boolean;
  log: string[];
  sceneDone: boolean;
  /** já brincou com o Ozzy hoje (uma vez por noite) */
  ozzy?: boolean;
  /** 1.1: a cena aberta no passo 'pre' é a volta do plantão (DayDef.volta); depois dela vem o `pre` do dia */
  volta?: boolean;
}

export interface GameOverInfo {
  kind: 'exonerado' | 'despejo' | 'colapso' | 'sindicancia';
  day: number;
  text: string;
}

export interface EndingInfo {
  kind: 'ruim' | 'normal' | 'bom' | 'secreto';
  chairOffered?: boolean;
  chairSigned?: boolean;
  lines: string[];
  threads: { id: string; ok: boolean; text: string }[];
}

export interface InfiniteState {
  score: number;
  calls: number;
  correct: number;
  streak: number;
  bestStreak: number;
  seedLabel: string;
  shifts: number;
}
