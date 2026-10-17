// =============================================================================
// Videochamada de averiguação (Programa VER): cena padrão gerada a partir da
// verdade clínica de cada ligação. Ligações importantes podem escrever a própria
// cena no campo `video` (ver docs/VIDEOCHAMADA.md); o que estiver escrito lá
// substitui o que é gerado aqui.
//
// Regra de ouro: o vídeo nunca mente sobre a verdade clínica, mas também não
// mostra o que uma câmera de celular não mostra (pressão, glicemia, pulso,
// temperatura, pupila). As descrições dizem só o que se vê.
// Sinais visuais escolhidos com base em protocolos reais de regulação (ver docs/FONTES.md)
// (RM2: consciência, respiração, cor e temperatura da pele, sangramento;
// discriminadores de RC/RT/RO/RP) — ver docs/FONTES.md.
// =============================================================================
import type {
  CallDef, Ctx, TruthDef, VideoDef, VideoScene, VideoSpot, VideoSign, VideoProp, VideoPlace, VideoAge, VideoPose, VideoSkin, LineIn,
  VideoExtra, VideoWound, VideoGear, VideoWear, VideoHat, VideoHold, VideoHint,
} from '../engine/types';
import { hashString, hm } from '../engine/util';

export const VIDEO_FROM_DAY = 3;
export const VIDEO_CREDITS = 3;

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function ageOf(def: CallDef, dx = ''): VideoAge {
  const a = def.patient.age;
  // ficha sem idade: a verdade às vezes diz ("lactente", "criança")
  if (a === undefined) return /lactente|recem-nascid|neonat|\bbebe\b/.test(dx) ? 'bebe' : /crianca|menin/.test(dx) ? 'crianca' : 'adulto';
  if (a < 2) return 'bebe';
  if (a < 12) return 'crianca';
  if (a < 18) return 'adolescente';
  if (a < 65) return 'adulto';
  return 'idoso';
}

/** "ele"/"ela"/"o bebê"/"a criança" */
function pron(def: CallDef, age: VideoAge): { ele: string; Ele: string; o: string } {
  if (age === 'bebe') return { ele: 'o bebê', Ele: 'O bebê', o: 'o' };
  const f = def.patient.sex === 'F';
  if (age === 'crianca') return { ele: f ? 'a menina' : 'o menino', Ele: f ? 'A menina' : 'O menino', o: f ? 'a' : 'o' };
  return { ele: f ? 'ela' : 'ele', Ele: f ? 'Ela' : 'Ele', o: f ? 'a' : 'o' };
}

interface Feat {
  pose: VideoPose;
  skin: VideoSkin;
  signs: VideoSign[];
  props: VideoProp[];
  place: VideoPlace;
  people: number;
  shaky: boolean;
  /** frases por ponto de vista (sem colchetes; cada uma vira uma linha de vídeo) */
  rosto: string[];
  respira: string[];
  corpo: string[];
  volta: string[];
  ferida?: string[];
  objeto?: string[];
  first: string;
  /** quem está em volta (papel e ação); sem isto, o desenho escolhe pelo lugar */
  cast?: VideoExtra[];
  /** o que o close do ferimento mostra */
  wound?: VideoWound;
  gear?: VideoGear[];
  wear?: VideoWear;
  hat?: VideoHat | null;
  hold?: VideoHold;
  rain?: boolean;
}

const has = (re: RegExp, s: string) => re.test(s);
/** moto (sem pegar "motorista") */
const MOTO = /\bmotos?\b|motocic|motoqueir|motoboy/;

/** texto "em volta" por lugar (o padrão só conhecia casa e rua) */
const VOLTA: Partial<Record<VideoPlace, string>> = {
  banheiro: 'O banheiro: o box, a pia, o chão molhado.',
  quintal: 'O quintal; o portão aberto.',
  obra: 'A obra: tijolo, areia, colegas em volta.',
  escola: 'A escola; outros alunos olhando de longe.',
  bar: 'O bar: mesas de plástico, garrafas no balcão.',
  onibus: 'Dentro do ônibus parado; passageiros olhando.',
  carro: 'Dentro do carro.',
  loja: 'A loja; o balcão e as prateleiras.',
  igreja: 'A igreja; bancos e gente em volta.',
  escada: 'A escada; os degraus.',
  rio: 'A beira da água.',
  hospital: 'Um corredor de paredes claras.',
  corredor: 'O corredor da casa; a porta do quarto aberta.',
  porta: 'A porta da casa, aberta; vizinhos no portão.',
  ponto_onibus: 'O ponto de ônibus; gente parada olhando, o trânsito passando.',
  praca: 'A praça: bancos, árvores, gente em volta.',
  feira: 'As barracas da feira; feirantes e fregueses em volta.',
  estacionamento: 'O estacionamento; carros parados ao sol.',
  posto: 'O posto de gasolina; as bombas e os frentistas olhando.',
  bar_porta: 'A porta do bar; mesas na calçada, gente em pé.',
  alagado: 'Água pela canela na rua; a chuva não para.',
  telhado: 'Em volta, só água: as casas da rua até a metade da janela.',
  praia: 'A areia e o mar; banhistas olhando.',
  piscina: 'A borda da piscina; gente em volta, de roupa de banho.',
  campo: 'O pasto aberto; ninguém por perto.',
  chacara: 'A varanda da chácara; o terreiro e a plantação atrás.',
  mercado: 'Os corredores do mercado; um funcionário olhando.',
  padaria: 'Os fundos da padaria: o forno, a masseira, sacos de farinha.',
  academia: 'As esteiras e os aparelhos; alunos em volta.',
  escritorio: 'As mesas do escritório; colegas em pé.',
  fabrica: 'O galpão: a máquina de rolos parada, colegas de uniforme em volta.',
  quadra: 'A quadra da escola; os alunos sentados na arquibancada.',
  salao: 'O salão de festas: mesas, bexigas, o bolo.',
  central: 'As mesas da central; os colegas de fone, olhando.',
};

/**
 * Ajuste por ligação dos dias (id da ligação): o que a verdade clínica não diz e a
 * história diz — onde está, como está, quem está junto. Só vale para a ligação
 * escrita (as variantes do banco têm outro id e outra história: a dica delas vem
 * no próprio modelo, campo `cena`). Quem liga segura o celular: fica fora do quadro.
 */
type Ajuste = VideoHint;
/** figurante: papel, ação e onde fica */
const fig = (role: VideoExtra['role'], act?: VideoExtra['act'], at?: VideoExtra['at'], o: Partial<VideoExtra> = {}): VideoExtra => ({ role, ...(act ? { act } : {}), ...(at ? { at } : {}), ...o });
const AJUSTE: Record<string, Ajuste> = {
  d03_antonio: { place: 'cozinha', cast: [fig('esposa', 'mao_na_boca', 'fundo')] },
  d03_conceicao: { place: 'quintal', cast: [fig('vizinha', 'olhando', 'fundo', { age: 'idoso' })] },
  d03_bicicleta: { place: 'calcada', props: ['bicicleta'], cast: [fig('vizinha', 'agachado', undefined, { age: 'idoso' })], first: 'O menino está sentado no chão da calçada, segurando o braço torto. Uma senhora agachada do lado.', ferida: 'O antebraço está torto, em "S", e inchado; a pele inteira, sem sangue.' },
  d03_briga: { place: 'loja', volta: 'A loja de capinhas, a porta de vidro fechada. Mais ninguém.' },
  d03_atropelamento: { signs: ['sangue_chao'], cast: [fig('curioso', 'ajoelhado'), fig('curioso', 'gritando', 'fundo'), fig('curioso', 'filmando', 'fundo'), fig('curioso', 'mao_na_boca', 'dir')], volta: 'Trânsito parado, gente gritando "não mexe nele!". O carro que atropelou não está mais lá.' },
  d04_exagerador: { pose: 'cama', props: ['balde'], first: 'Ela está deitada no sofá.' },
  d04_tiro: { place: 'bar', cast: [fig('curioso', 'escondido', 'fundo')], harmful: ['[sussurrando] Câmera?! Ele tá ali fora, {dr}! Se ele vê a luz do celular...', '[a voz some; só a respiração]'] },
  d04_facao: { place: 'calcada', hold: 'pano', wound: { kind: 'corte', at: 'cabeca' }, cast: [fig('vizinho', 'olhando', 'fundo'), fig('vizinha', 'mao_na_boca', 'fundo')] },
  d04_moto: { props: ['moto', 'carro'], hat: 'capacete', signs: ['deformidade_perna', 'sangue_chao'], cast: [fig('curioso', 'segurando_mao', undefined, { sex: 'M', wear: 'avental' }), fig('curioso', 'filmando', 'fundo')], first: 'Um motoqueiro caído no asfalto, imóvel, ao lado de um carro parado; a moto tombada mais à frente.', corpo: 'A perna está torta, dobrada para o lado errado.' },
  d04_escorpiao: { signs: ['vomito'] },
  d04_enxaqueca: { place: 'quarto', pose: 'cama', light: 'escuro', first: 'O quarto está escuro; ela está deitada, com o braço sobre os olhos.' },
  d04_joelho: { place: 'cozinha', wound: { kind: 'ralado', at: 'joelho' }, ferida: 'O joelho ralado, já lavado; um arranhão vermelho, sem sangrar agora.' },
  d05_infarto: { place: 'quintal' },
  d05_dedo: { place: 'cozinha', pose: 'encostado', hold: 'pano', signs: ['sangue_braco'], wound: { kind: 'corte', at: 'mao' }, first: 'Ele está sentado no chão da cozinha, a mão enrolada numa camiseta.', ferida: 'A ponta do dedo cortada, enrolada na camiseta suja de sangue; parou de sangrar.' },
  d05_academia: { place: 'academia', signs: ['sangue_rosto'], cast: [fig('colega', 'rcp', undefined, { sex: 'F', wear: 'esporte' }), fig('professor', 'olhando', 'fundo', { wear: 'esporte' }), fig('colega', 'mao_na_boca', 'fundo', { wear: 'esporte' })], volta: 'Uma academia: esteiras paradas, alunos em volta; uma aluna faz massagem no peito dele.' },
  d05_piscina: { place: 'piscina', cast: [fig('curioso', 'olhando', 'fundo', { age: 'adulto', sex: 'M', wear: 'banho' })], volta: 'A borda da piscina do clube; o rapaz que pulou está ensopado do lado.' },
  d05_pedreiro: { place: 'obra', props: ['tijolos', 'andaime'], cast: [fig('colega', 'ajoelhado'), fig('colega', 'maos_na_cabeca', 'fundo')] },
  d05_benedita: { pose: 'cama' },
  d06_tontura: { place: 'corredor', pose: 'encostado', props: ['gato'], first: 'Ela está sentada no chão do corredor, encostada na parede.' },
  d06_hipo_mae: { place: 'cozinha', pose: 'caido', signs: ['olhos_fechados'], first: 'Ela está caída no chão da cozinha, de olhos fechados; a testa molhada de suor.', rosto: '{{Suada e pálida|video_palido_suor}}; não abre os olhos quando chamam.' },
  d06_avc2: { place: 'cozinha', cast: [fig('neto', 'olhando', 'fundo', { age: 'crianca' })] },
  d06_cabeca: { pose: 'colo', wound: { kind: 'galo', at: 'cabeca' }, cast: [fig('irmao', 'olhando', 'fundo', { age: 'crianca' })] },
  d06_lombar: { pose: 'em_pe', first: 'Ele está em pé na sala, a mão nas costas, andando devagar.' },
  d07_parto: { place: 'banheiro', first: 'Ela está no chão do banheiro, deitada, as pernas abertas.' },
  d07_engasgo: { place: 'quintal', props: ['churrasqueira'], cast: [fig('familiar', 'gritando', 'fundo', { sex: 'M' }), fig('neto', 'mao_na_boca', 'fundo', { age: 'crianca' })] },
  d07_wesley: { place: 'feira', props: ['moto', 'capacete'], wear: 'motoboy', hat: null, cast: [fig('curioso', 'agachado'), fig('curioso', 'filmando', 'fundo'), fig('curioso', 'mao_na_boca', 'fundo')] },
  d08_onibus: { place: 'onibus', cast: [fig('passageiro', 'sentado'), fig('passageiro', 'olhando', 'fundo', { age: 'idoso', sex: 'F' })], first: 'Dentro do ônibus parado: um rapaz sentado num banco, acordado, conversando.' },
  d08_anticoag: { place: 'sala', pose: 'cama', wound: { kind: 'corte', at: 'cabeca' }, first: 'Ele está deitado no sofá, um pano apertado na cabeça.' },
  d08_convulsao: { place: 'cozinha' },
  d08_petequias: { place: 'quarto', props: ['mamadeira'] },
  d08_choque: { place: 'corredor', wear: 'uniforme', first: 'Ele está sentado no chão, perto do quadro de luz aberto, segurando a mão.' },
  d09_moto: { place: 'posto', props: ['moto', 'carro'], hat: 'capacete', signs: ['sangue_chao'], cast: [fig('curioso', 'olhando', 'fundo'), fig('colega', 'mao_na_boca', 'fundo', { wear: 'uniforme', sex: 'M' })], first: 'Um motoqueiro de capacete caído no asfalto, imóvel, em frente ao posto; um carro parado de lado.' },
  d09_parto: { cast: [fig('mae', 'segurando_mao', undefined, { age: 'idoso' }), fig('filho', 'olhando', 'fundo', { age: 'crianca' })] },
  d09_helio: { place: 'cozinha' },
  d09_marcia: { wound: { kind: 'picada', at: 'braco' } },
  d10_riso: { place: 'cozinha', props: ['glicosimetro'], cast: [fig('vizinha', 'olhando', 'fundo', { age: 'idoso' })] },
  d10_joelho: { place: 'quadra', props: ['gelo', 'bola'], cast: [fig('aluno', 'olhando', 'fundo')], wound: { kind: 'inchaco', at: 'joelho' }, first: 'Um aluno sentado no banco da quadra, com gelo no joelho.' },
  d10_telhado: { place: 'quintal', props: ['escada'], sem: ['deformidade_perna'], corpo: 'Caído no cimento do quintal; não consegue levantar, diz que dói o quadril.' },
  d11_olhos: { pose: 'cama', light: 'escuro', first: 'A sala está escura; ela está deitada no sofá.' },
  d11_barriga: { place: 'quarto', pose: 'cama' },
  d11_desmaio: { place: 'hospital', cast: [fig('enfermeira', 'olhando', 'fundo')] },
  d11_gestante: { signs: ['gravida'] },
  d11_idoso: { pose: 'cama' },
  d11_febre: { props: ['termometro'] },
  d11_dengue_grave: { place: 'corredor', pose: 'caido', props: ['gelo'], signs: ['sangue_nariz', 'sangue_boca'], first: 'Ele está caído no corredor, a caminho do banheiro; pálido, o nariz e a boca sujos de sangue.' },
  d12_surto: { place: 'calcada', hold: 'pau', props: ['vasos'], signs: ['sangue_braco'], semProps: ['faca'], wound: { kind: 'corte', at: 'mao' }, cast: [fig('mae', 'chorando', 'fundo', { age: 'idoso' }), fig('vizinho', 'olhando', 'fundo'), fig('curioso', 'filmando', 'fundo')], first: 'Na calçada, um rapaz em pé, gritando; vasos quebrados no chão.', volta: 'Vasos quebrados na calçada; ele segura um pedaço de pau. Vizinhos olhando de longe.' },
  d12_cartelas: { place: 'quarto', pose: 'cama' },
  d12_masseira: { place: 'padaria', cast: [fig('colega', 'maos_na_cabeca', 'fundo', { sex: 'M' })], volta: 'Os fundos da padaria: a masseira desligada, sacos de farinha, colegas em volta.' },
  d13_moto: { place: 'calcada', props: ['moto', 'capacete'], wear: 'motoboy', hat: null },
  d13_infarto: { place: 'sala' },
  d13_cachorro: { props: ['bola'] },
  d14_cefaleia: { place: 'sala', pose: 'cama' },
  d14_queimadura: { place: 'cozinha', wear: 'avental', props: ['panela'] },
  d14_ciclista: { props: ['bicicleta'], wound: { kind: 'corte', at: 'perna' }, cast: [fig('curioso', 'comprimindo'), fig('curioso', 'gritando', 'fundo'), fig('curioso', 'filmando', 'fundo')] },
  d15_fila: { place: 'calcada', cast: [fig('policial', 'olhando', 'fundo'), fig('curioso', 'abanando', 'fundo')], wound: { kind: 'ralado', at: 'joelho' } },
  d15_insolacao: { place: 'estacionamento', cast: [fig('curioso', 'abanando', 'fundo')], first: 'No estacionamento do Parque, ao sol: um rapaz deitado no chão, muito vermelho.' },
  d15_mci: { place: 'praca', pose: 'deitado', signs: ['olhos_fechados'], props: ['viatura', 'cones'], cast: [fig('policial', 'apontando', 'fundo'), fig('curioso', 'ferido', 'esq'), fig('curioso', 'chorando', 'fundo'), fig('curioso', 'deitado', 'fundo'), fig('curioso', 'segurando_cabeca')], first: 'Gente no chão por todo lado; uns sentados chorando, um senhor deitado que não abre o olho.' },
  d15_infarto: { place: 'sala' },
  d15_bebado: { place: 'bar_porta', pose: 'encostado', props: ['carro', 'poste'], signs: ['sangue_rosto', 'vomito'], cast: [fig('curioso', 'olhando', 'fundo'), fig('curioso', 'filmando', 'fundo')], first: 'Um carro enfiado no poste em frente ao bar; o motorista sentado no meio-fio, sangrando na testa.' },
  d15_crianca: { place: 'calcada', props: ['pipoca'], wound: { kind: 'ralado', at: 'joelho' }, first: 'Uma menininha sentada no meio-fio, chorando, o joelho ralado.', ferida: 'Um ralado no joelho, já limpo; sangrou um tiquinho.' },
  d16_biel: { signs: ['molhado'] },
  d16_convulsao: { place: 'feira', cast: [fig('irmao', 'ajoelhado'), fig('curioso', 'olhando', 'fundo'), fig('curioso', 'filmando', 'fundo')] },
  d16_laje: { place: 'obra', props: ['tijolos', 'andaime'], signs: ['sangue_cabeca'], cast: [fig('colega', 'ajoelhado'), fig('colega', 'maos_na_cabeca', 'fundo')] },
  d17_telhado: { place: 'telhado', rain: true, cast: [fig('esposa', 'segurando_mao', undefined, { age: 'idoso' }), fig('neto', 'chorando', 'fundo', { age: 'crianca' })], first: 'Em cima do telhado, cercado de água: ele está sentado nas telhas, a mão no peito.' },
  d17_crianca: { place: 'alagado', rain: true, cast: [fig('familiar', 'ajoelhado', undefined, { sex: 'M' }), fig('crianca', 'chorando', 'fundo')] },
  d17_choque: { place: 'quintal', rain: true, signs: ['molhado'], volta: '{{Um fio caído na água|video_fio}}. Ninguém deve tocar nele enquanto a energia não for desligada.' },
  d17_vidro: { place: 'escada', wound: { kind: 'corte', at: 'pe' }, first: 'Ela está sentada na escada, o pé enrolado numa toalha vermelha, apoiado para cima.' },
  d17_simone: { place: 'central', cast: [fig('colega', 'olhando', 'fundo', { sex: 'M' })] },
  d17_insulina: { place: 'sala' },
  d17_muro: { place: 'quintal', rain: true, props: ['tijolos'], semProps: ['carro'], cast: [fig('vizinho', 'agachado'), fig('vizinho', 'agachado'), fig('curioso', 'olhando', 'fundo')], first: 'No quintal, um muro caído: um homem preso debaixo dos tijolos.', volta: 'Vizinhos tentando tirar os tijolos com as mãos; água da chuva escorrendo.' },
  d17_enxurrada: { place: 'calcada', rain: true, gear: ['toalha'], first: 'O menino está sentado na calçada, molhado, enrolado numa toalha, tossindo.' },
  d18_punho: { place: 'quintal' },
  d18_odete: { place: 'sala' },
  d18_moto: { place: 'ponto_onibus', pose: 'encostado', props: ['moto', 'onibus'], wear: 'motoboy', signs: ['sangue_chao'], cast: [fig('curioso', 'olhando', 'fundo'), fig('curioso', 'filmando', 'fundo')] },
  d19_escada: { place: 'obra', props: ['escada'], signs: ['deformidade_braco'], wound: { kind: 'fratura', at: 'braco' }, ferida: 'O ombro caído; um calombo no meio da clavícula.' },
  d19_onibus: { place: 'onibus', wear: 'uniforme', cast: [fig('passageiro', 'olhando', 'fundo'), fig('passageiro', 'sentado')] },
  d20_faca: { place: 'bar', cast: [fig('garcom', 'olhando', 'fundo')] },
  d20_cordao: { signs: ['gravida'], corpo: 'Deitada; quem filma vira a câmera por pudor e descreve "um cordão saindo".' },
  d20_feijao: { cast: [fig('avo', 'olhando', 'fundo', { sex: 'F' })] },
  d20_queda: { place: 'banheiro', pose: 'encostado', signs: ['sangue_cabeca'], wound: { kind: 'corte', at: 'cabeca' }, ferida: 'Um galo na testa e um corte pequeno que não para de sangrar.' },
  d20_edema: { signs: ['espuma'] },
  d20_final: { props: ['garrafa'], signs: ['sangue_rosto'] },
  d20_final_rua: { place: 'ponto_onibus', signs: ['sangue_rosto'], cast: [fig('curioso', 'rcp'), fig('curioso', 'mao_na_boca', 'fundo')] },
  // trotes que se entregam no vídeo: o lugar da brincadeira
  d07_trote: { place: 'quintal', props: ['churrasqueira', 'garrafa'], first: 'Três rapazes num quintal com churrasqueira acesa. Um segura o celular, os outros riem. {{Ninguém no chão|video_trote}}.', corpo: 'A câmera aponta para o chão: uma camiseta enrolada feito gente, com ketchup em cima.', volta: 'A churrasqueira acesa, caixas de som, latinhas. Um deles tapa a câmera com a mão.' },
  d13_trote: { place: 'sala', props: ['videogame'], cast: [fig('crianca', 'filmando'), fig('crianca', 'rindo', 'esq'), fig('crianca', 'rindo', 'dir')], first: 'Três crianças na sala, na frente da TV. Uma segura o celular, as outras riem. {{Ninguém no chão|video_trote}}.', volta: 'A TV ligada no comercial; almofadas no chão. Uma delas tapa a câmera com a mão.' },
  d14_trote: { place: 'escola', cast: [fig('aluno', 'filmando', undefined, { age: 'adolescente' }), fig('aluno', 'rindo', 'esq', { age: 'adolescente' }), fig('aluno', 'rindo', 'dir', { age: 'adolescente' })], first: 'Uma sala de aula vazia; três alunos de uniforme rindo, um segura o celular. {{Ninguém no chão|video_trote}}.', corpo: 'A câmera aponta para o chão: uma mochila com um casaco por cima e ketchup.', volta: 'Carteiras, a lousa com a matéria do dia. Um deles tapa a câmera com a mão.' },
  d19_trote: { props: ['videogame'] },
};

/** monta as características visuais a partir do diagnóstico (texto) e da gravidade */
function features(def: CallDef, t: TruthDef, age: VideoAge, aj?: Ajuste): Feat {
  const dx = norm(t.dx);
  const red = t.sev === 'vermelho';
  const yellow = t.sev === 'amarelo';
  const P = pron(def, age);
  const f: Feat = {
    pose: red ? 'deitado' : 'sentado',
    skin: red ? 'palido' : 'normal',
    signs: [],
    props: [],
    place: age === 'idoso' ? 'quarto' : 'sala',
    people: 1,
    shaky: def.type === 'exagerador' || def.type === 'embriagado' || red,
    rosto: [],
    respira: [],
    corpo: [],
    volta: [],
    first: '',
  };
  const add = (...s: VideoSign[]) => f.signs.push(...s.filter((x) => !f.signs.includes(x)));
  const prop = (...p: VideoProp[]) => f.props.push(...p.filter((x) => !f.props.includes(x)));
  // ---------------------------------------------------------------- lugar
  if (has(MOTO, dx) || has(/atropel|colisao|carro|onibus|ferragens|ciclista|bicicleta|via publica|batida/, dx)) f.place = 'rua';
  if (has(/\bonibus\b/, dx) && has(/motorista|passageir|dentro do/, dx)) f.place = 'onibus';
  // \b: sem ele "cobra" virava obra, "horário/período/inferior" viravam rio, "lombar" virava bar e "descolamento" virava escola
  if (has(/\bobra\b|andaime|laje|pedreiro|desabamento/, dx)) f.place = 'obra';
  if (has(/masseira|padaria/, dx)) f.place = 'padaria';
  if (has(/maquina|prensa|\bfirma\b|fabrica/, dx) && !has(/masseira/, dx)) f.place = 'fabrica';
  if (has(/afog|na agua|\brio\b|praia|piscina|correnteza/, dx) && !has(/era agua/, dx)) f.place = has(/piscina/, dx) ? 'piscina' : has(/praia|\bmar\b/, dx) ? 'praia' : 'rio';
  if (has(/academia|esteira/, dx)) f.place = 'academia';
  if (has(/\bigreja\b|\bculto\b/, dx)) f.place = 'igreja';
  if (has(/\bfeira\b/, dx)) f.place = 'feira';
  if (has(/agrotox|lavoura|chacara|\bsitio\b|\broca\b/, dx)) f.place = 'chacara';
  if (has(/banheiro/, dx)) f.place = 'banheiro';
  if (has(/oleo|forno|panela|soda|agua sanitaria|produto de limpeza|querosene|fogao|gas\b/, dx)) f.place = 'cozinha';
  if (has(/\bescola\b|alunos/, dx)) f.place = 'escola';
  if (has(/embriag|\bbar\b|briga|agress/, dx)) f.place = has(/domestic/, dx) ? 'sala' : 'calcada';
  if (has(/acamado|\bbebe\b|lactente|berco/, dx)) f.place = 'quarto';
  if (has(/alagad|enchente|ilhado|enxurrada/, dx)) {
    f.place = has(/telhado/, dx) ? 'telhado' : 'alagado';
    f.rain = true;
  }

  // ---------------------------------------------------------------- quadros
  if (has(/parada|pcr|fibrilacao/, dx)) {
    f.pose = 'deitado';
    f.skin = 'cinza';
    add('olhos_fechados');
    if (has(/afog/, dx)) add('molhado', 'espuma');
    f.first = `${P.Ele} está no chão, de barriga para cima, olhos fechados. Não se mexe.`;
    f.rosto = ['Rosto acinzentado, {{lábios roxos|video_cianose}}. Não pisca quando chamam.'];
    f.respira = ['O peito {{não sobe nem desce|video_nao_respira}}. De vez em quando, um suspiro curto, tipo soluço — e nada.'];
    f.corpo = ['Mole. O braço cai quando alguém levanta.'];
  } else if (has(/obito|horas antes|morte/, dx)) {
    f.pose = 'cama';
    f.skin = 'cinza';
    add('olhos_fechados', 'livores', 'rigidez');
    f.first = `${P.Ele} está na cama, de barriga para cima, imóvel.`;
    f.rosto = ['Rosto cinza-amarelado, boca entreaberta, olhos semicerrados.'];
    f.respira = ['O peito não se mexe.'];
    f.corpo = [
      'Quem liga tenta dobrar o braço: {{está duro, não dobra|video_rigidez}}.',
      'Nas costas e atrás das coxas, {{manchas roxas onde o corpo encosta na cama|video_livores}}.',
    ];
  } else if (has(/infarto|iam|coronari|dor toracica|dissec/, dx)) {
    f.pose = has(/queda|desmaio/, dx) ? 'deitado' : 'sentado';
    f.skin = 'palido';
    add('suor');
    if (!has(/sem dor|atipic/, dx)) add('mao_no_peito');
    f.first = `${P.Ele} está sentad${P.o}, curvad${P.o} para a frente${f.signs.includes('mao_no_peito') ? ', com a mão no meio do peito' : ''}.`;
    f.rosto = ['{{Pálid' + P.o + ' e molhad' + P.o + ' de suor|video_palido_suor}}, a testa brilhando.'];
    f.respira = ['Respira curto, mas respira. Não dá para contar direito pela câmera.'];
    f.corpo = ['Não consegue ficar quiet' + P.o + '; muda de posição o tempo todo.'];
  } else if (has(/subaracn|pior da vida|cefaleia|dor de cabeca/, dx) && red) {
    // no sofá (pose cama na sala), as mãos segurando a cabeça
    f.pose = 'cama';
    f.place = 'sala';
    add('vomito', 'maos_na_cabeca');
    f.first = `${P.Ele} está deitad${P.o} no sofá, com as duas mãos na cabeça.`;
    f.rosto = ['Olhos apertados, foge da luz da tela.'];
    f.respira = ['Respira rápido, de dor.'];
    f.corpo = ['Tem vômito no chão, ao lado do sofá.'];
  } else if (has(/bell|paralisia facial periferica/, dx)) {
    add('face_torta');
    f.rosto = ['Um lado do rosto caído — {{inclusive a testa: ela não franze desse lado|video_bell}}.', 'O olho desse lado não fecha direito.'];
    f.respira = ['Respira normal.'];
    f.corpo = ['Levanta os dois braços iguais, sem esforço.'];
    f.place = 'cozinha';
    prop('copo');
    f.first = `${P.Ele} está sentad${P.o} à mesa da cozinha, segurando um copo d’água que escorre pelo canto da boca.`;
  } else if (has(/\bavc\b|acidente vascular/, dx) && !has(/sequela|antigo|nada mudou|duvida|fast normal/, dx)) {
    f.pose = has(/sonol|rebaix|coma/, dx) ? 'deitado' : 'sentado';
    add('face_torta', 'braco_caido');
    f.first = `${P.Ele} está sentad${P.o}, meio tort${P.o} para um lado.`;
    f.rosto = ['Quando tenta sorrir, {{a boca entorta para um lado|video_face_torta}}. A testa franze dos dois lados.'];
    f.respira = ['Respira normal.'];
    f.corpo = ['Levanta os dois braços: {{um deles cai devagar|video_braco_caido}}.'];
  } else if (has(/hipoglic/, dx)) {
    const grave = has(/grave/, dx) || red;
    f.pose = grave ? (has(/desacord|imitando|confund/, dx) ? 'deitado' : 'sentado') : 'sentado';
    f.skin = grave ? 'palido' : 'normal';
    if (grave) add('suor');
    if (has(/insulina|diabet/, dx) || grave) prop('caneta_insulina');
    if (!grave) prop('copo');
    f.first = grave ? `${P.Ele} está ${f.pose === 'deitado' ? 'deitad' + P.o + ' no chão' : 'sentad' + P.o + ', olhando para o nada'}.` : `${P.Ele} está sentad${P.o}, tomando um copo de suco.`;
    f.rosto = grave ? ['{{Suad' + P.o + ' e pálid' + P.o + '|video_palido_suor}}, olhar perdido. Não responde direito quando chamam.'] : ['Cor normal. Responde, um pouco devagar.'];
    f.respira = ['Respira normal.'];
    f.corpo = grave ? ['Mãos tremendo.'] : ['Segura o copo firme.'];
    f.objeto = ['Em cima da mesa, {{uma caneta de insulina|video_insulina}} e o aparelho de glicemia (desligado).'];
  } else if (has(/convuls|epilep/, dx)) {
    if (has(/estado de mal|mal epilep/, dx) || (red && !has(/pos-crise|pos crise/, dx))) {
      f.pose = 'convulsao';
      add('baba');
      f.first = `${P.Ele} está no chão, ${'{{o corpo todo se debatendo|video_convulsao}}'}.`;
      f.rosto = ['Olhos revirados, baba na boca. A cor fica arroxeada nos lábios durante a crise.'];
      f.respira = ['Respira com ronco entre os abalos.'];
      f.corpo = ['Os abalos não param. Alguém afastou os móveis.'];
    } else {
      f.pose = 'lateral';
      add('olhos_fechados');
      if (has(/corte|testa/, dx)) add('sangue_rosto');
      f.first = `${P.Ele} está deitad${P.o} de lado no chão, sonolent${P.o}.`;
      f.rosto = ['Abre os olhos quando chamam, confus' + P.o + '. ' + (f.signs.includes('sangue_rosto') ? 'Um corte pequeno na testa, sangrando pouco.' : 'Sem ferimentos no rosto.')];
      f.respira = ['Respira fundo e devagar, como quem dorme pesado.'];
      f.corpo = ['Mexe braços e pernas. Molhou a calça.'];
    }
  } else if (has(/afog/, dx)) {
    add('molhado');
    f.pose = red ? 'deitado' : 'sentado';
    if (red) {
      // afogamento com insuficiência respiratória: não é o susto "tossindo na toalha"
      f.skin = 'cianose';
      add('respira_rapido', 'tiragem');
      f.first = `${P.Ele} está deitad${P.o} na beira, ensopad${P.o}, puxando o ar com força.`;
      f.rosto = ['{{Lábios arroxeados|video_cianose}}; olhos meio fechados, responde pouco.'];
      f.respira = ['{{Puxa o ar com força, a pele entre as costelas afunda|video_esforco}}; tosse com espuma.'];
      f.corpo = ['Mole, não consegue sentar sozinh' + P.o + '.'];
    } else {
      f.gear = ['toalha'];
      f.first = `${P.Ele} está sentad${P.o} na beira, enrolad${P.o} numa toalha, tossindo.`;
      f.rosto = ['Cor normal. Olhos vermelhos.'];
      f.respira = ['Tosse de vez em quando; entre uma tosse e outra, respira tranquil' + P.o + '.'];
      f.corpo = ['Mexe tudo, sem ferimento à vista.'];
    }
  } else if (has(/sem (sinais de )?obstrucao/, dx) && has(/moeda|corpo estranho|engol|nariz/, dx)) {
    // corpo estranho sem obstrução: calmo, respirando normal
    f.pose = 'sentado';
    f.first = `${P.Ele} está sentad${P.o}, quiet${P.o}, ${has(/nariz/, dx) ? 'mexendo no nariz' : 'tomando um gole d’água'}.`;
    f.rosto = ['Cor normal. Fala e chora com a voz de sempre.'];
    f.respira = ['Respira normal, sem barulho.'];
    f.corpo = ['Brinca, mexe tudo.'];
  } else if (has(/engasgo|obstrucao|carne/, dx) && !has(/sem (sinais de )?obstrucao/, dx)) {
    f.pose = 'em_pe';
    f.skin = red ? 'cianose' : 'vermelho';
    add('maos_no_pescoco');
    f.first = `${P.Ele} está em pé, {{com as duas mãos no pescoço|video_engasgo}}, a boca aberta.`;
    f.rosto = [red ? 'O rosto está ficando roxo. Não sai som nenhum.' : 'Vermelh' + P.o + ', tossindo forte.'];
    f.respira = [red ? 'Faz força para puxar o ar e nada entra.' : 'Tosse e consegue puxar o ar entre as tossidas.'];
    f.corpo = ['Desesperad' + P.o + ', batendo na mesa.'];
  } else if (has(/anafil|alergi.*grave|edema de glote|choque anafil/, dx)) {
    add('inchaco_rosto', 'respira_rapido', 'placas');
    f.pose = 'sentado';
    f.skin = 'vermelho';
    f.first = `${P.Ele} está sentad${P.o}, com o rosto inchado e vermelho.`;
    f.rosto = ['{{Lábios e pálpebras muito inchados|video_inchaco}}. Fala com a voz abafada.'];
    f.respira = ['Respira com esforço; dá para ouvir um chiado pelo celular.'];
    f.corpo = ['Placas vermelhas no pescoço e nos braços.'];
  } else if (has(/picada|mordida|marimbondo|abelha|escorpiao|cobra|jararaca/, dx)) {
    f.wound = has(/cobra|jararaca/, dx) ? { kind: 'picada', at: 'perna' } : has(/escorpiao/, dx) ? { kind: 'picada', at: 'pe' } : has(/cachorro|mordida/, dx) ? { kind: 'mordida', at: 'perna' } : { kind: 'picada', at: 'braco' };
    if (has(/enxame/, dx)) add('placas');
    if (has(/escorpiao/, dx) && red) add('vomito');
    f.ferida = has(/cobra|jararaca/, dx)
      ? ['A perna está inchada e roxa em volta de {{dois furinhos|video_picada_cobra}}. Sangra um pouco.']
      : has(/escorpiao/, dx)
        ? [red ? 'Um ponto vermelho no pé. A criança está pálida e vomitou.' : 'Um ponto vermelho no pé, sem inchaço grande.']
        : has(/cachorro/, dx)
          ? ['Marcas de dente na panturrilha, rasas. Sangra pouco.']
          : ['Um calombo vermelho no lugar da picada. Mais nada.'];
    f.rosto = [red ? 'Pálid' + P.o + ', chorando.' : 'Cor normal, sem inchaço no rosto.'];
    f.respira = ['Respira normal.'];
    f.corpo = [red ? 'Molinh' + P.o + ' no colo.' : 'Mexe tudo normal.'];
    if (red) f.pose = age === 'crianca' || age === 'bebe' ? 'colo' : 'deitado';
  } else if (has(/ansiedade|hiperventil|palpitacao apos susto|panico/, dx)) {
    add('respira_rapido', 'tremor');
    f.rosto = ['Cor normal, lábios rosados. Choros' + P.o + ' e assustad' + P.o + '.'];
    f.respira = ['Respira muito rápido, mas fala frases inteiras.'];
    f.corpo = ['As mãos tremem; diz que formigam.'];
  } else if (has(/asma|torax silencioso|dpoc|insuficiencia respir|edema agudo|insuficiencia cardiaca|pneumonia|crupe|laringite|bronquiolite|falta de ar|dispneia/, dx)) {
    const grave = red || has(/grave|silencioso|edema agudo|insuficiencia respir/, dx);
    f.pose = grave ? 'curvado' : 'sentado';
    f.skin = grave ? 'cianose' : 'normal';
    add('respira_rapido');
    if (grave) add('tiragem', 'suor');
    if (has(/edema agudo/, dx)) add('espuma');
    if (has(/asma/, dx)) prop('bombinha');
    if (has(/dpoc/, dx)) prop('oxigenio');
    f.first = grave ? `${P.Ele} está sentad${P.o}, inclinad${P.o} para a frente, as mãos nos joelhos.` : `${P.Ele} está sentad${P.o}, respirando rápido.`;
    f.rosto = grave ? ['{{Lábios arroxeados|video_cianose}}. ' + (has(/silencioso/, dx) ? 'Os olhos querem fechar.' : 'Assustad' + P.o + '.')] : ['Cor normal, lábios rosados.'];
    f.respira = grave
      ? [has(/silencioso/, dx) ? 'O peito quase não mexe — e {{não se ouve mais o chiado|video_silencioso}}.' : '{{Puxa o ar com força, a pele entre as costelas afunda|video_esforco}}. Não completa uma frase.']
      : [has(/crupe|laringite/, dx) ? 'Tosse rouca, tipo latido; entre as tosses respira sem afundar o peito.' : 'Respira rápido, mas sem afundar as costelas; fala frases inteiras.'];
    f.corpo = grave ? ['Não consegue deitar.'] : ['Consegue andar pela casa.'];
  } else if (has(/meningo|manchas roxas|petequ|purpura|meningite/, dx)) {
    f.pose = age === 'bebe' ? 'colo' : 'cama';
    f.skin = 'palido';
    add('manchas_roxas');
    f.first = `${P.Ele} está deitad${P.o}, quietinh${P.o} demais.`;
    f.rosto = ['Pálid' + P.o + ', olhos fundos. Não reage muito à tela.'];
    f.respira = ['Respira rápido.'];
    f.corpo = ['Nas pernas, {{manchinhas roxas que não somem quando apertam um copo em cima|video_purpura}}.'];
  } else if (has(/dengue/, dx)) {
    const grave = red || has(/choque|grave/, dx);
    const alarme = grave || (has(/alarme/, dx) && !has(/sem (sinais de )?alarme/, dx));
    f.pose = alarme ? 'deitado' : 'sentado';
    f.skin = grave ? 'cinza' : alarme ? 'palido' : 'normal';
    if (grave) add('suor');
    if (grave && has(/sangra|hemorrag/, dx)) add('sangue_nariz', 'sangue_boca');
    if (has(/gestante/, dx)) add('gravida');
    f.rosto = [grave ? '{{Pele acinzentada e suada|video_choque}}, olhos fundos.' : alarme ? 'Pálid' + P.o + ', abatid' + P.o + '.' : 'Corad' + P.o + ', com cara de gripe.'];
    f.respira = ['Respira ' + (grave ? 'rápido e curto.' : 'normal.')];
    f.corpo = [grave ? 'Não consegue sentar sem tontura.' : alarme ? 'Encolhid' + P.o + ', com a mão na barriga.' : 'Senta e levanta sem problema.'];
    if (alarme) add('mao_na_barriga');
  } else if (has(/tce|traumatismo cranio|craniano|trauma de cranio|trauma craniano/, dx)) {
    // anticoagulado é risco, não aparência: só parece grave quem está grave
    const grave = red || (has(/grave|rebaix|sinais de alarme|sonolencia|inconsc|desacord/, dx) && !has(/\bleve\b/, dx));
    f.pose = grave ? 'deitado' : 'sentado';
    // leve: só sangra quando a verdade fala em corte (galo de bebê que caiu do beliche não sangrou)
    const corte = grave || has(/corte|sangr|ferimento/, dx);
    if (corte) add('sangue_cabeca');
    f.wound = corte ? { kind: 'corte', at: 'cabeca' } : { kind: 'galo', at: 'cabeca' };
    if (grave) add('olhos_fechados');
    const guaxinim = has(/olhos|guaxinim/, dx);
    f.ferida = [grave ? 'Um corte no couro cabeludo sangrando bastante; o cabelo empapado.' : corte ? 'Um galo na testa, com um corte pequeno sangrando.' : 'Um galo grande na cabeça; a pele inteira, sem sangue.'];
    f.rosto = [grave ? 'Olhos fechados; só abre quando gritam o nome.' + (guaxinim ? ' {{Roxo em volta dos olhos|video_olhos_guaxinim}}.' : '') : 'Olha para a câmera e responde.'];
    f.respira = ['Respira ' + (grave ? 'devagar, com ronco.' : 'normal.')];
    f.corpo = [grave && has(/hemi|deficit|fraqueza|lado/, dx) ? 'Não mexe direito o lado direito.' : grave ? 'Mexe os braços e as pernas quando beliscam.' : 'Mexe tudo.'];
    if (grave && guaxinim) add('hematoma_olho');
  } else if (has(/fratura exposta/, dx)) {
    f.pose = 'deitado';
    add('deformidade_perna', 'sangue_perna');
    f.wound = { kind: 'exposta', at: 'perna' };
    const coxa = has(/femur|coxa/, dx);
    f.ferida = [coxa ? '{{O osso aparece pela pele da coxa|video_exposta}}; a calça está encharcada de sangue.' : '{{O osso aparece pela pele da canela|video_exposta}}; sangra, mas não esguicha.'];
    f.rosto = [red ? 'Pálid' + P.o + ' e suad' + P.o + '.' : 'Com muita dor, mas acordad' + P.o + ' e falando.'];
    f.respira = ['Respira rápido, de dor.'];
    f.corpo = [coxa ? 'A coxa está torta e inchada.' : 'A perna está torta abaixo do joelho.'];
  } else if (has(/femur|bacia/, dx)) {
    f.pose = 'deitado';
    add('deformidade_perna');
    f.wound = { kind: 'fratura', at: 'perna' };
    f.rosto = ['Com dor, mas responde.'];
    f.respira = ['Respira normal.'];
    f.corpo = ['{{A perna está mais curta e virada para fora|video_femur}}. Não consegue levantar.'];
  } else if (has(/punho|antebraco|tornozelo|entorse|luxacao|ombro/, dx)) {
    if (!has(/joelho/, dx)) add(has(/tornozelo|entorse/, dx) ? 'deformidade_perna' : 'deformidade_braco');
    f.wound = has(/joelho/, dx) ? { kind: 'inchaco', at: 'joelho' } : has(/tornozelo|entorse/, dx) ? { kind: 'inchaco', at: 'pe' } : { kind: 'fratura', at: 'braco' };
    f.ferida = [has(/joelho/, dx) ? 'O joelho está inchado; a perna está reta, sem deformidade.' : has(/tornozelo|entorse/, dx) ? 'O tornozelo está inchado e roxo. O pé está na posição certa.' : has(/ombro|luxacao/, dx) ? 'O ombro está "quadrado", diferente do outro.' : 'O punho está inchado, com um degrau de lado.'];
    f.rosto = ['Cor normal, com dor.'];
    f.respira = ['Respira normal.'];
    f.corpo = ['Segura o membro machucado; o resto mexe tudo.'];
  } else if (has(/arma de fogo|baleado|\btiro\b|facada|esfaque|ferimento por faca|perfurante/, dx)) {
    // tiro ou facada: o sangue aparece onde a verdade diz (coxa, barriga, tórax)
    const perna = has(/coxa|perna/, dx);
    f.pose = red ? 'deitado' : 'sentado';
    f.skin = red ? 'palido' : 'normal';
    add(perna ? 'sangue_perna' : 'sangue_tronco', 'sangue_chao');
    if (!perna) add('mao_na_barriga');
    if (red) add('suor');
    const tiro = has(/arma de fogo|baleado|\btiro\b/, dx);
    f.wound = { kind: tiro ? 'tiro' : 'facada', at: perna ? 'perna' : has(/torax|peito/, dx) ? 'peito' : 'barriga' };
    f.ferida = [perna ? 'Um furo na coxa; a calça encharcada de sangue, que escorre para o chão.' : 'Um corte na barriga; a camisa empapada de sangue.'];
    f.rosto = [red ? '{{Pálid' + P.o + ' e suad' + P.o + '|video_palido_suor}}, gemendo.' : 'Assustad' + P.o + ', com dor; cor normal.'];
    f.respira = ['Respira rápido.'];
    f.corpo = ['{{Uma poça de sangue no chão|video_sangue}}.'];
  } else if (has(/hemorragia arterial|corte profundo|hemorragia na coxa|esguich/, dx)) {
    f.skin = red ? 'palido' : 'normal';
    add(has(/coxa|perna|\bpe\b/, dx) ? 'sangue_perna' : 'sangue_braco', 'sangue_chao');
    f.wound = { kind: 'corte', at: has(/\bpe\b/, dx) ? 'pe' : has(/coxa|perna/, dx) ? 'perna' : has(/mao|dedo/, dx) ? 'mao' : 'braco' };
    f.ferida = [red ? '{{O sangue sai em jatos|video_jato}}, mesmo com o pano apertado.' : 'Um corte fundo; sangra, mas diminui com o pano apertado.'];
    f.rosto = [red ? 'Pálid' + P.o + ', suad' + P.o + '.' : 'Corad' + P.o + ', assustad' + P.o + '.'];
    f.respira = ['Respira rápido.'];
    f.corpo = ['{{Uma poça de sangue no chão|video_sangue}}.'];
  } else if (has(/queda de altura|laje|metros|raquimedular|coluna/, dx)) {
    f.pose = 'deitado';
    f.place = f.place === 'sala' ? 'quintal' : f.place;
    f.rosto = ['Acordad' + P.o + ', fala com quem filma.'];
    f.respira = [red ? 'Respira curto, com dor no peito.' : 'Respira normal.'];
    f.corpo = [has(/raquimedular|coluna/, dx) ? '{{Não mexe as pernas|video_paraplegia}}; os braços, sim.' : 'Deitad' + P.o + ' no chão, com dor nas costas. Não tentaram levantar.'];
    prop('tijolos');
  } else if (has(/politrauma|colisao|atropel|ferragens|desabamento|trauma de torax|trauma grave/, dx)) {
    f.pose = has(/ferragens/, dx) ? 'sentado' : 'deitado';
    f.place = has(/desabamento/, dx) ? 'obra' : 'rua';
    f.skin = red ? 'palido' : 'normal';
    // colisão leve não sangra; trauma de tórax quase não sangra por fora
    if (red && !has(/torax/, dx)) add('sangue_cabeca', 'sangue_chao');
    if (red) add('olhos_fechados');
    prop(has(MOTO, dx) ? 'moto' : 'carro');
    if (has(MOTO, dx)) f.hat = 'capacete';
    if (has(/ferragens/, dx)) {
      f.place = 'carro';
      f.pose = 'preso';
    }
    f.people = 4;
    f.first = has(/ferragens/, dx) ? 'Um carro amassado contra o poste. Alguém dentro, preso.' : 'Gente em volta de alguém no asfalto.';
    f.rosto = [red ? 'Sangue no rosto, olhos fechados. Geme quando chamam.' : 'Arranhões no rosto; responde.'];
    f.respira = [red ? 'Respira rápido e curto.' : 'Respira normal.'];
    f.corpo = [has(/ferragens/, dx) ? 'As pernas estão presas sob o painel.' : 'Uma perna em posição estranha.'];
    f.volta = ['Trânsito parado, muita gente filmando. Ninguém mexeu na vítima.'];
  } else if (has(/esmagamento|mao presa/, dx)) {
    f.pose = 'em_pe';
    f.place = has(/masseira/, dx) ? 'padaria' : 'fabrica';
    f.wound = { kind: 'inchaco', at: 'mao' };
    add('sangue_braco');
    prop(has(/masseira/, dx) ? 'masseira' : 'maquina');
    f.ferida = ['A mão continua presa na máquina; ' + P.ele + ' não deixa ninguém ligar de novo.'];
    f.rosto = ['Pálid' + P.o + ', mordendo um pano.'];
    f.respira = ['Respira rápido.'];
    f.corpo = ['Em pé, curvad' + P.o + ' sobre a máquina.'];
  } else if (has(/choque eletrico|eletrocut/, dx)) {
    f.pose = 'deitado';
    f.skin = red ? 'cinza' : 'normal';
    if (red) add('olhos_fechados');
    prop('fio', 'quadro_luz');
    f.wound = { kind: 'queimadura', at: 'mao' };
    if (has(/agua|alagad|chuva|enchente|molhad/, dx)) {
      add('molhado');
      f.volta = ['{{Um fio caído na água|video_fio}}. Ninguém deve tocar n' + (P.o === 'a' ? 'ela' : 'ele') + ' enquanto a energia não for desligada.'];
    } else {
      // caiu sentado no chão, perto do quadro de luz
      f.pose = red ? 'deitado' : 'encostado';
      if (has(/queimad/, dx)) add('queimadura');
      f.ferida = has(/queimad/, dx) ? ['Na palma da mão, uma marca preta, um furinho queimado.'] : undefined;
      f.volta = ['O quadro de luz aberto; o disjuntor já desligado.'];
    }
  } else if (has(/queimadura/, dx)) {
    const grave = red || has(/extensa|tronco|crianca|segundo grau extensa/, dx);
    add('queimadura');
    f.wound = { kind: 'queimadura', at: grave ? 'peito' : has(/\bmao\b|dedo/, dx) && !has(/braco/, dx) ? 'mao' : 'braco' };
    if (has(/oleo|panela|fritura/, dx)) prop('panela');
    if (has(/olho|quimic/, dx)) prop('produto');
    f.ferida = [grave ? '{{Uma área grande vermelha, com bolhas estouradas, pegando o peito e a barriga|video_queimadura}}.' : has(/olho/, dx) ? 'O olho está vermelho e lacrimejando; a pele do braço, avermelhada.' : has(/braco|antebraco/, dx) ? 'Do cotovelo até a mão, a pele vermelha e brilhante, com bolhas; algumas estouradas.' : 'Uma área vermelha do tamanho da palma da mão, com uma bolha fechada.'];
    f.rosto = [grave ? 'Chorando de dor.' : 'Com dor, calm' + P.o + '.'];
    f.respira = ['Respira normal.'];
    f.corpo = [grave ? 'Ainda com a roupa grudada na pele.' : 'O resto da pele sem marcas.'];
  } else if (has(/expulsivo|parto|bolsa rota|trabalho de parto|tampao/, dx)) {
    add('gravida');
    f.pose = has(/expulsivo/, dx) ? 'parto' : has(/prolapso/, dx) ? 'deitado' : 'sentado';
    f.rosto = [has(/expulsivo/, dx) ? 'Suando, fazendo força a cada contração.' : 'Cor normal, respira fundo nas contrações.'];
    f.respira = ['Respira fundo e solta devagar.'];
    f.corpo = [has(/expulsivo/, dx) ? 'Deitada, as pernas abertas; quem filma vira a câmera por pudor e descreve: "a cabeça tá aparecendo".' : 'A barriga é de fim de gestação. Anda pela casa entre as contrações.'];
  } else if (has(/eclampsia|pre-eclampsia|pre eclampsia/, dx)) {
    add('gravida', 'inchaco_rosto');
    f.pose = has(/^eclampsia|convuls/, dx) ? 'convulsao' : 'deitado';
    if (f.pose === 'convulsao') {
      // em crise ela não fala nem foge da luz: o vídeo mostra a convulsão
      add('baba');
      f.first = `${P.Ele} está no chão, {{o corpo todo se debatendo|video_convulsao}}. A barriga de grávida.`;
      f.rosto = ['Olhos revirados, baba na boca. O rosto está inchado.'];
      f.respira = ['Respira com ronco entre os abalos.'];
      f.corpo = ['Os abalos não param; as mãos e os pés estão inchados.'];
    } else {
      f.rosto = ['O rosto e as mãos estão inchados. Aperta os olhos com a luz da tela.'];
      f.respira = ['Respira normal.'];
      f.corpo = ['Diz que a cabeça "vai explodir" e que vê pontinhos brilhando.'];
    }
  } else if (has(/ectopica|placenta|sangramento.*gesta|gesta.*sangramento|aborto/, dx)) {
    add('gravida');
    f.skin = red ? 'palido' : 'normal';
    if (red) add('suor', 'mao_na_barriga');
    f.pose = red ? 'deitado' : 'sentado';
    f.rosto = [red ? '{{Pálida e suando frio|video_palido_suor}}.' : 'Corada, preocupada.'];
    f.respira = ['Respira ' + (red ? 'rápido.' : 'normal.')];
    f.corpo = [red ? 'Uma toalha encharcada de sangue no sofá.' : 'Um absorvente com pouco sangue; nada no chão.'];
  } else if (has(/soda|caustic|agua sanitaria|querosene|produto de limpeza|vapor de produto/, dx)) {
    f.pose = age === 'bebe' || age === 'crianca' ? 'colo' : 'sentado';
    prop('produto');
    if (has(/soda|caustic/, dx)) add('baba');
    f.rosto = [has(/soda|caustic/, dx) ? '{{A boca está vermelha por dentro e baba sem parar|video_caustico}}.' : 'Cor normal, tossindo um pouco.'];
    f.respira = [has(/querosene|aspira/, dx) ? 'Respira rápido, com tosse.' : 'Respira normal.'];
    f.corpo = ['Mexe tudo; chora.'];
    f.objeto = ['A embalagem: ' + (has(/soda|caustic/, dx) ? 'soda cáustica, sem tampa.' : has(/querosene/, dx) ? 'querosene numa garrafa de refrigerante.' : 'produto de limpeza diluído.')];
  } else if (has(/remedio|comprimid|calmante|cartela|medicament|intoxicacao por|ingestao de remedio|vitamina/, dx)) {
    prop('cartela', 'remedios');
    const sono = has(/rebaix|sonol|calmante|intencional/, dx) || red;
    f.pose = age === 'bebe' || age === 'crianca' ? (sono ? 'colo' : 'sentado') : sono ? 'deitado' : 'sentado';
    if (sono) add('olhos_fechados');
    f.rosto = [sono ? 'Sonolent' + P.o + ', mal abre os olhos quando chamam.' : 'Acordad' + P.o + ' e espert' + P.o + '.'];
    f.respira = [sono ? 'Respira devagar.' : 'Respira normal.'];
    f.corpo = [sono ? 'Mole.' : age === 'bebe' || age === 'crianca' ? 'Brincando normalmente.' : 'Mexe tudo, conversa normalmente.'];
    f.objeto = ['{{A cartela do remédio|video_cartela}} em cima da mesa: dá para ler o nome e contar os buracos.'];
  } else if (has(/monoxido|aquecedor/, dx)) {
    f.place = 'banheiro';
    f.pose = 'encostado';
    f.people = 2;
    prop('aquecedor');
    f.rosto = ['Sonolentos, com dor de cabeça; a pele está corada.'];
    f.respira = ['Respiram normal.'];
    f.corpo = ['Sentados no chão, perto da porta do banheiro.'];
    f.volta = ['{{O aquecedor a gás do banheiro, com a janela fechada|video_aquecedor}}.'];
  } else if (has(/alcool|embriag/, dx)) {
    prop('garrafa');
    f.pose = red ? 'lateral' : 'sentado';
    if (has(/vomit/, dx)) add('vomito');
    if (has(/corte|supercilio|testa/, dx)) add('sangue_rosto');
    f.rosto = ['Olhos vermelhos, fala enrolada. ' + (f.signs.includes('sangue_rosto') ? 'Um corte no supercílio, sangrando pouco.' : '')];
    f.respira = ['Respira normal.'];
    f.corpo = [red ? 'No chão, de lado.' : f.place === 'rua' || f.place === 'calcada' ? 'Sentad' + P.o + ' no meio-fio, balançando.' : 'Sentad' + P.o + ', balançando; cochila e acorda.'];
  } else if (has(/surto|psicot|agitac/, dx)) {
    f.pose = 'em_pe';
    add('agitado');
    f.people = 2;
    f.shaky = true;
    f.rosto = ['Grita com alguém fora do quadro. Olhar arregalado.'];
    f.respira = ['Ofegante.'];
    f.corpo = ['Anda de um lado para o outro.'];
    f.volta = [has(/terceiros|risco/, dx) ? '{{Uma faca em cima da mesa, perto dele|video_faca}}. A família está encostada na parede.' : 'A sala revirada.'];
    f.cast = [{ role: 'familiar', act: 'mao_na_boca', at: 'fundo' }];
    if (has(/terceiros|risco/, dx)) prop('faca');
  } else if (has(/sepse|infeccao|pneumonia com/, dx) && !has(/sem sina\w* de infeccao/, dx)) {
    f.pose = 'cama';
    f.skin = red ? 'cinza' : 'palido';
    add('suor');
    f.rosto = [red ? '{{Pele acinzentada e suada|video_choque}}; olha sem reconhecer.' : 'Pálid' + P.o + ', abatid' + P.o + '.'];
    f.respira = ['Respira rápido e curto.'];
    f.corpo = ['Encolhid' + P.o + ' debaixo do cobertor, com calafrio.'];
  } else if (has(/apendic|abdom|invagin|hernia|colica|barriga/, dx)) {
    f.pose = age === 'bebe' ? 'colo' : 'curvado';
    add('mao_na_barriga');
    f.skin = red ? 'palido' : 'normal';
    f.rosto = [red ? 'Pálid' + P.o + ', gemendo.' : 'Careta de dor; cor normal.'];
    f.respira = ['Respira curto para não mexer a barriga.'];
    f.corpo = [has(/hernia/, dx) ? 'Na virilha, uma bola dura que não volta para dentro.' : has(/invagin/, dx) ? 'Encolhe as perninhas e chora a cada poucos minutos; depois fica mole.' : 'Encolhid' + P.o + ', não quer esticar o corpo.'];
  } else if (has(/hemorragia digestiva|hda/, dx)) {
    f.pose = 'deitado';
    f.skin = red ? 'cinza' : 'palido';
    add('vomito_sangue', 'suor');
    f.rosto = ['{{Pálid' + P.o + ' e suad' + P.o + '|video_palido_suor}}.'];
    f.respira = ['Respira rápido.'];
    f.corpo = ['{{Um balde com vômito escuro, cor de borra de café|video_hda}}.'];
    prop('balde');
  } else if (has(/nasal|epistax/, dx)) {
    add('sangue_rosto');
    f.rosto = ['Segura um pano no nariz; o pano está bem vermelho. Cor normal.'];
    f.respira = ['Respira pela boca, normal.'];
    f.corpo = ['Sentad' + P.o + ', inclinad' + P.o + ' para a frente.'];
  } else if (has(/caido no chao|permanencia no chao|longa permanencia|caid[ao] desde/, dx)) {
    f.pose = 'caido';
    f.place = has(/banheiro/, dx) ? 'banheiro' : 'quarto';
    f.skin = 'palido';
    f.rosto = ['Pálid' + P.o + ', lábios secos. Confus' + P.o + '.'];
    f.respira = ['Respira normal.'];
    f.corpo = ['No chão ao lado da cama, de lado. Não consegue levantar sozinh' + P.o + '.'];
  } else if (has(/insolacao|intermacao/, dx)) {
    f.pose = 'deitado';
    f.skin = 'vermelho';
    f.rosto = ['{{Rosto muito vermelho e a pele seca, sem suor|video_intermacao}}. Fala coisas sem sentido.'];
    f.respira = ['Respira rápido.'];
    f.corpo = ['Deitad' + P.o + ' na sombra, sem forças para levantar.'];
  } else if (has(/corte no couro cabeludo|corte na cabeca|corte na testa|supercilio/, dx)) {
    add('sangue_cabeca');
    f.wound = { kind: 'corte', at: has(/supercilio|testa/, dx) ? 'rosto' : 'cabeca' };
    f.hold = 'pano';
    f.ferida = [has(/supercilio/, dx) ? 'Um corte no supercílio, sangrando; o olho do lado inchando.' : 'Um corte na cabeça, no meio do cabelo; o pano apertado em cima está vermelho.'];
    f.rosto = ['Sangue escorrendo pela testa. Acordad' + P.o + ', responde.'];
    f.respira = ['Respira normal.'];
    f.corpo = ['Mexe tudo; segura o pano na cabeça.'];
  } else if (has(/violencia|domestic/, dx)) {
    f.place = 'banheiro';
    f.pose = 'encostado';
    add('hematoma_olho');
    f.rosto = ['Um olho roxo, inchado.'];
    f.respira = ['Respira rápido, assustad' + P.o + '.'];
    f.corpo = ['Sentada no chão do banheiro, a porta trancada.'];
  }
  // ---------------------------------------------------------------- ajuste da ligação (lugar, pose, gente)
  if (aj) {
    if (aj.place) f.place = aj.place;
    if (aj.pose) f.pose = aj.pose;
    if (aj.people) f.people = aj.people;
    if (aj.skin) f.skin = aj.skin;
    if (aj.props) prop(...aj.props);
    if (aj.semProps) f.props = f.props.filter((x) => !aj.semProps!.includes(x));
    if (aj.signs) add(...aj.signs);
    if (aj.sem) f.signs = f.signs.filter((x) => !aj.sem!.includes(x));
    if (aj.cast) f.cast = aj.cast;
    if (aj.wound) f.wound = aj.wound;
    if (aj.gear) f.gear = aj.gear;
    if (aj.wear) f.wear = aj.wear;
    if (aj.hat !== undefined) f.hat = aj.hat;
    if (aj.hold) f.hold = aj.hold;
    if (aj.rain !== undefined) f.rain = aj.rain;
    if (aj.first) f.first = aj.first;
    if (aj.rosto) f.rosto = [aj.rosto];
    if (aj.respira) f.respira = [aj.respira];
    if (aj.corpo) f.corpo = [aj.corpo];
    if (aj.ferida) f.ferida = [aj.ferida];
    if (aj.objeto) f.objeto = [aj.objeto];
    if (aj.volta) f.volta = [aj.volta];
  }
  // colo só para bebê e criança: o desenho transforma qualquer um no colo em criança
  if (f.pose === 'colo' && age !== 'bebe' && age !== 'crianca') f.pose = 'deitado';
  // ---------------------------------------------------------------- padrão por gravidade
  if (!f.rosto.length) f.rosto = [red ? 'Pálid' + P.o + ', com cara de quem está passando mal.' : yellow ? 'Cor normal, com dor.' : 'Cor normal. Olha para a câmera e responde.'];
  if (!f.respira.length) f.respira = [red ? 'Respira rápido.' : 'Respira normal, sem esforço que dê para ver.'];
  if (!f.corpo.length) f.corpo = [red ? 'Não consegue ficar em pé.' : yellow ? 'Consegue se mexer, devagar.' : 'Mexe tudo, conversa normalmente.'];
  if (!f.volta.length)
    f.volta = [
      f.place === 'rua' || f.place === 'calcada'
        ? 'Rua movimentada; algumas pessoas olhando.'
        : f.place === 'quarto'
          ? 'Um quarto arrumado; remédios na mesinha de cabeceira.'
          : f.place === 'cozinha'
            ? 'A cozinha; o fogão está desligado.'
            : (VOLTA[f.place] ?? 'A sala da casa. Ninguém mais ferido.'),
    ];
  if (!f.first) {
    const where = ({
      sala: 'na sala', quarto: 'no quarto', cozinha: 'na cozinha', banheiro: 'no banheiro', quintal: 'no quintal', escada: 'na escada', porta: 'na porta de casa', corredor: 'no corredor',
      rua: 'na rua', calcada: 'na calçada', ponto_onibus: 'no ponto de ônibus', praca: 'na praça', feira: 'na feira', estacionamento: 'no estacionamento', posto: 'no posto de gasolina',
      bar_porta: 'na porta do bar', alagado: 'na água da rua', telhado: 'em cima do telhado', praia: 'na areia', rio: 'na beira da água', piscina: 'na beira da piscina', campo: 'no campo',
      chacara: 'na varanda da chácara', obra: 'na obra', bar: 'no bar', loja: 'na loja', mercado: 'no mercado', padaria: 'nos fundos da padaria', academia: 'na academia',
      escritorio: 'no escritório', fabrica: 'no galpão da fábrica', escola: 'na escola', quadra: 'na quadra', igreja: 'na igreja', salao: 'no salão de festas', hospital: 'no corredor do posto',
      central: 'na central', onibus: 'no ônibus', carro: 'no carro',
    } as Record<VideoPlace, string>)[f.place] ?? 'em casa';
    const pose = ({
      deitado: 'deitad' + P.o, sentado: 'sentad' + P.o, em_pe: 'em pé', caido: 'caíd' + P.o + ' no chão', curvado: 'curvad' + P.o + ' para a frente', convulsao: 'no chão',
      colo: 'no colo de alguém', cadeira: 'numa cadeira', cama: f.place === 'sala' ? 'deitad' + P.o + ' no sofá' : 'na cama', lateral: 'deitad' + P.o + ' de lado', brucos: 'de bruços no chão',
      encostado: 'sentad' + P.o + ' no chão', ajoelhado: 'ajoelhad' + P.o, agachado: 'agachad' + P.o, parto: 'deitada, em trabalho de parto', preso: 'pres' + P.o + ' no banco do carro',
      debrucado: 'debruçad' + P.o + ' na mesa',
    } as Record<VideoPose, string>)[f.pose];
    f.first = f.pose === 'cama' && f.place === 'sala' ? `${P.Ele} está ${pose}.` : `${P.Ele} está ${pose} ${where}.`;
  }
  return f;
}

/** trote: a cena depende do tipo (sorteado de forma fixa por ligação) */
function prankVideo(def: CallDef, t: TruthDef, callId: string): VideoDef {
  const kind = t.prankKind ?? 'trote';
  if (kind === 'acidental') {
    const baby = /beb|crian/.test(norm(t.dx));
    return {
      scene: baby ? { place: 'quarto', patient: { pose: 'sentado', age: 'bebe' }, props: ['brinquedo'], people: 1 } : { place: 'rua', light: 'escuro', patient: null, people: 0, shaky: true },
      first: baby ? ['[Um bebê de fralda, sentado no tapete, mordendo o celular. Ninguém passando mal.]'] : ['[Imagem preta, balançando. Barulho de tecido e de passos: o celular está num bolso.]'],
      spots: [{ id: 'volta', label: 'Mostrar em volta', focus: 'ambiente', cost: 3, see: baby ? ['[A mãe aparece e toma o celular: "Ai, meu Deus, desculpa! Foi ele!"]'] : ['[Só escuro. Alguém conversa ao longe sobre o preço do pão.]'] }],
      proof: false,
    };
  }
  if (kind === 'teste') {
    return { refuse: { lines: ['Não precisa de vídeo, {dr}. Pode seguir o protocolo normal.'] }, proof: false };
  }
  if (kind === 'desabafo') {
    return {
      scene: { place: 'sala', patient: { pose: 'sentado', age: 'idoso', sex: def.patient.sex ?? 'F' }, props: ['tv', 'sofa'] },
      first: ['[Uma pessoa idosa sentada na poltrona, sozinha, ajeitando o cabelo para a câmera.]'],
      spots: [
        { id: 'rosto', label: 'Mostrar o rosto', focus: 'rosto', cost: 3, see: ['[Corada, sorrindo. Os olhos estão molhados.]'] },
        { id: 'volta', label: 'Mostrar em volta', focus: 'ambiente', cost: 3, see: ['[A casa arrumada, a TV ligada sem som. Um porta-retrato virado para a parede.]'] },
      ],
      proof: false,
    };
  }
  // trote de verdade: recusa e desliga, recusa e insiste, ou aceita e se entrega
  // >>> 0: hashString tem sinal; com resto negativo quase 70% caía em "recusa e desliga" (era para ser 40/30/30)
  const r = ((hashString(callId + ':trote') >>> 0) % 100) / 100;
  if (r < 0.4) return { refuse: { lines: ['Vídeo?! [risadas] {m:Tá maluco, tio|Tá maluca, tia}?', '[desliga]'], hangup: true } };
  if (r < 0.7) return { refuse: { lines: ['Ih... a câmera tá quebrada. Manda logo a ambulância, pô!', '[alguém ri perto do telefone]'] } };
  // onde a turma está (ajuste da ligação): quarto por padrão
  const aj = AJUSTE[def.id] ?? def.cena;
  return {
    scene: {
      place: aj?.place ?? 'quarto',
      ...(aj?.light ? { light: aj.light } : {}),
      patient: null,
      people: aj?.cast ? aj.cast.length : 3,
      ...(aj?.cast ? { cast: aj.cast } : {}),
      laughing: true,
      shaky: true,
      props: ['ketchup', 'boneco', ...(aj?.props ?? [])],
    },
    first: [`[${aj?.first ?? 'Três adolescentes num quarto. Um segura o celular, os outros riem. {{Ninguém no chão|video_trote}}.'}]`],
    spots: [
      { id: 'vitima', label: 'Mostrar a vítima', focus: 'chao', cost: 3, see: [`[${aj?.corpo ?? 'A câmera aponta para o chão: um travesseiro com uma camiseta por cima e ketchup.'}]`, 'Ó a vítima aí, {dr}! [gargalhadas]'] },
      { id: 'volta', label: 'Mostrar em volta', focus: 'pessoas', cost: 3, see: [`[${aj?.volta ?? 'Pôster na parede, videogame ligado. Um deles tapa a câmera com a mão.'}]`] },
    ],
    proof: true,
  };
}

/** o celular é de botão? (idosos que ligam do próprio aparelho, frequentadores) */
function buttonPhone(def: CallDef, callId: string): boolean {
  if (def.type === 'frequentador') return true;
  const self = /propri|ela mesma|ele mesmo|o proprio|a propria/i.test(norm(def.caller));
  if (self && (def.patient.age ?? 0) >= 75) return hashString(callId + ':botao') % 2 === 0;
  return false;
}

const LYING: VideoPose[] = ['deitado', 'caido', 'lateral', 'brucos'];
const HELPING = ['rcp', 'comprimindo', 'ajoelhado', 'segurando_mao', 'segurando_cabeca', 'ventilando', 'agachado'];

/** quem está em volta: com o paciente grave no chão, alguém da cena se abaixa do lado dele */
function castFor(f: Feat, red: boolean): VideoExtra[] | undefined {
  if (!f.cast) return undefined;
  const cast = f.cast.map((c) => ({ ...c }));
  const grave = red || f.skin === 'cinza' || f.skin === 'cianose';
  if (grave && LYING.includes(f.pose) && !cast.some((c) => HELPING.includes(c.act ?? ''))) {
    const i = cast.findIndex((c) => !c.act || c.act === 'olhando' || c.act === 'mao_na_boca');
    if (i >= 0) cast[i] = { ...cast[i], act: 'ajoelhado', at: undefined };
  }
  return cast;
}

/** cor da pele que a cena do vídeo mostraria (fonte da resposta padrão de "Cor da pele?") */
export function skinOf(def: CallDef, t: TruthDef): VideoSkin {
  if (t.sev === 'trote') return 'normal';
  const age = ageOf(def, norm(t.dx));
  return features(def, t, age, AJUSTE[def.id] ?? def.cena).skin;
}

export function buildVideo(def: CallDef, t: TruthDef, c: Ctx, callId: string): VideoDef {
  if (t.sev === 'trote') return prankVideo(def, t, callId);
  const dx = norm(t.dx);
  const age = ageOf(def, dx);
  // dica da ligação: a tabela dos dias ou a `cena` que o modelo do banco escreveu
  const aj = AJUSTE[def.id] ?? def.cena;
  const f = features(def, t, age, aj);
  const out: VideoDef = {};
  // celular de botão
  if (buttonPhone(def, callId))
    out.refuse = {
      lines: def.type === 'frequentador' ? ['Ô, {dr}, aqui é o telefone fixo da sala. Não tem câmera nenhuma.'] : ['Ô, {dr}, meu celular é desses de botão. Tira foto não.'],
    };
  // quem liga longe do paciente
  if (/outra cidade|do trabalho|longe|por telefone|nao esta com|nao estou com/.test(norm(def.caller))) out.remote = true;
  // vítima escondida / crise: pedir vídeo faz mal
  if (/violencia domestica|pedido disfarcado|socorro silencioso/.test(dx)) {
    out.harmful = { lines: ['[sussurrando] Não... não dá. Ele tá aqui do lado.', '[a voz some por uns segundos]'], patience: 35 };
  } else if (/suicid|ideacao|crise emocional|desesperanca|autoprovoc|autoagress|autoles/.test(dx)) {
    // quem liga é a própria pessoa ou alguém da casa (pai, mãe, irmão): a reação é outra
    const quem = norm(def.callerName ?? def.caller ?? '');
    const proprio = !quem || norm(def.patient?.name ?? '').startsWith(quem.split(' ')[0]);
    out.harmful = proprio
      ? { lines: ['[silêncio]', 'Pra quê? Pra ver se eu tô mentindo?'], patience: 30 }
      : { lines: ['Filmar? Agora? A porta tá trancada, {dr}. Se escutar que eu tô filmando, aí que não abre mais.', '[a voz falha]'], patience: 30 };
  } else if (aj?.harmful) {
    out.harmful = { lines: aj.harmful, patience: 30 };
  }
  const light = aj?.light ?? (hm(def.at) >= hm('18:45') ? 'noite' : undefined);
  const cast = castFor(f, t.sev === 'vermelho');
  const scene: VideoScene = {
    place: f.place,
    ...(light ? { light } : {}),
    patient: aj?.vazio ? null : {
      pose: f.pose,
      age,
      sex: def.patient.sex,
      skin: f.skin,
      signs: f.signs,
      ...(f.wound ? { wound: f.wound } : {}),
      ...(f.gear ? { gear: f.gear } : {}),
      ...(f.wear ? { wear: f.wear } : {}),
      ...(f.hat !== undefined ? { hat: f.hat } : {}),
      ...(f.hold ? { hold: f.hold } : {}),
    },
    props: f.props,
    people: aj?.vazio ? 0 : cast ? cast.length + 1 : f.people,
    ...(cast ? { cast } : {}),
    shaky: f.shaky,
    ...(f.rain ? { rain: true } : {}),
  };
  const sp = (id: string, label: string, focus: VideoSpot['focus'], cost: number, lines: string[] | undefined): VideoSpot | null =>
    lines && lines.length ? { id, label, focus, cost, see: lines.map((l) => `[${l}]`) as LineIn[] } : null;
  const spots = [
    sp('rosto', 'Mostrar o rosto', 'rosto', 4, f.rosto),
    sp('respira', 'Mostrar o peito (respiração)', 'peito', 5, f.respira),
    sp('ferida', 'Mostrar o ferimento', 'ferida', 4, f.ferida),
    sp('corpo', 'Mostrar o corpo inteiro', 'geral', 4, f.corpo),
    sp('objeto', 'Mostrar remédios e embalagens', 'objeto', 3, f.objeto),
    sp('volta', 'Mostrar em volta', 'ambiente', 3, f.volta),
  ].filter((x): x is VideoSpot => !!x);
  out.scene = scene;
  // ninguém no quadro: só dá para mostrar em volta
  out.spots = aj?.vazio ? spots.filter((x) => x.id === 'volta') : spots;
  out.first = [`[${f.first}]`];
  void c;
  // morte evidente: o vídeo serve para constatar por telemedicina (RM7)
  if (/obito|horas antes/.test(dx)) out.spots = spots;
  return out;
}

export function remoteLines(def: CallDef): LineIn[] {
  return [`Mas eu não tô aí, {dr}! ${def.patient.sex === 'F' ? 'Ela' : 'Ele'} tá em casa, eu tô no trabalho.`, 'Eu só liguei porque me avisaram.'];
}

export const VIDEO_INTRO = {
  who: 'COORDENAÇÃO · DR. PEIXOTO',
  text:
    'A partir de hoje a central entra no Programa VER de videoatendimento. Com a lei municipal do trote, ligação suspeita pode ser averiguada por vídeo: o sistema manda um link por mensagem e, se a pessoa aceitar, você vê a cena. ' +
    'Franquia: 3 vídeos por plantão. Cada vídeo aumenta o tempo da ligação — e o tempo médio entra na meta. Leia a página 3-V do manual antes de usar.',
};
