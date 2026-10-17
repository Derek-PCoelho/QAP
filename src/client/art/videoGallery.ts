// Galeria de revisão das cenas de vídeo (art-gallery.html, depois da galeria principal). Não faz parte do jogo.
// Lugares × luz, poses, pessoas (idade × sexo × tom), enquadramentos, sinais, situações e a Intervenção.
// Desenha aos poucos (um quadro por vez) para a página aparecer logo.
import { renderVideoFrame, VIDEO_W, VIDEO_H } from './video';
import { PLACES } from './videoPlace';
import { presentPix } from './pix';
import { FIELD_CASES } from '../../content/field';
import type { VideoScene, VideoFocus, VideoPose, VideoAge, VideoSign, VideoPlace, VideoPatient } from '../../engine/types';

const app = document.getElementById('app')!;
const params = new URLSearchParams(location.search);
/** ?vt=1200 congela num instante da animação; ?vz=2 muda o zoom dos quadros */
const T = Number(params.get('vt') ?? 600);
const Z = Number(params.get('vz') ?? 1);
/** ?vsec=situacoes,campo mostra só essas seções (a galeria inteira leva alguns segundos para desenhar) */
const ONLY = params.get('vsec')?.split(',');
const want = (id: string) => !ONLY || ONLY.includes(id);

const queue: (() => void)[] = [];
function pump(): void {
  const t0 = performance.now();
  while (queue.length && performance.now() - t0 < 30) queue.shift()!();
  if (queue.length) setTimeout(pump, 0);
}

function section(id: string, title: string, note?: string): HTMLElement {
  const s = document.createElement('section');
  s.id = id;
  const h = document.createElement('h2');
  h.textContent = title;
  s.appendChild(h);
  if (note) {
    const p = document.createElement('div');
    p.className = 'cap';
    p.textContent = note;
    p.style.marginBottom = '8px';
    s.appendChild(p);
  }
  app.appendChild(s);
  return s;
}

function frame(scene: VideoScene, focus: VideoFocus, seed: string, label: string, opts: { view?: 'ver' | 'campo'; z?: number } = {}): HTMLElement {
  const z = opts.z ?? Z;
  const c = document.createElement('canvas');
  c.width = VIDEO_W;
  c.height = VIDEO_H;
  c.className = 'px';
  c.style.width = VIDEO_W * z + 'px';
  c.style.height = VIDEO_H * z + 'px';
  const box = document.createElement('div');
  box.className = 'cell';
  box.appendChild(c);
  const t = document.createElement('div');
  t.textContent = label;
  box.appendChild(t);
  queue.push(() => {
    const pix = renderVideoFrame({ scene, focus, signal: 'bom', t: T, seed, view: opts.view ?? 'ver' });
    presentPix(c.getContext('2d')!, pix, 0, 0, 1, 'galeria-video');
  });
  return box;
}

function grid(s: HTMLElement, cols: number): HTMLElement {
  const g = document.createElement('div');
  g.className = 'grid';
  g.style.gridTemplateColumns = `repeat(${cols}, max-content)`;
  s.appendChild(g);
  return g;
}

// ---------------------------------------------------------------- lugares × luz
if (want('lugares')) {
  const s = section('video-lugares', 'Vídeo — lugares × luz', 'Cada lugar de dia, à noite e no escuro (lanterna do celular), com uma pessoa em pé para dar a escala.');
  const g = grid(s, 6);
  for (const place of Object.keys(PLACES) as VideoPlace[])
    for (const light of ['dia', 'noite', 'escuro'] as const) {
      const sc: VideoScene = { place, light, patient: { pose: 'em_pe', age: 'adulto', sex: 'M' } };
      g.appendChild(frame(sc, 'geral', 'galeria:' + place, `${place} · ${light}`));
    }
}

// ---------------------------------------------------------------- poses
const POSES: [VideoPose, VideoPlace, VideoSign[]][] = [
  ['em_pe', 'sala', []],
  ['sentado', 'sala', []],
  ['cadeira', 'cozinha', []],
  ['curvado', 'quarto', ['respira_rapido', 'tiragem']],
  ['debrucado', 'bar', []],
  ['encostado', 'corredor', []],
  ['cama', 'quarto', []],
  ['cama', 'sala', ['maos_na_cabeca']],
  ['deitado', 'sala', ['olhos_fechados']],
  ['caido', 'banheiro', []],
  ['lateral', 'feira', ['olhos_fechados']],
  ['brucos', 'calcada', []],
  ['convulsao', 'cozinha', ['baba']],
  ['ajoelhado', 'igreja', []],
  ['agachado', 'quintal', []],
  ['parto', 'quarto', ['gravida', 'suor']],
  ['parto', 'banheiro', ['gravida']],
  ['preso', 'carro', ['respira_rapido']],
  ['colo', 'sala', []],
];
if (want('poses')) {
  const s = section('video-poses', 'Vídeo — poses', 'Cada pose num lugar típico (cama na sala = deitado no sofá; parto fora do quarto = no chão, sobre toalhas).');
  const g = grid(s, 5);
  POSES.forEach(([pose, place, signs], i) => {
    const sc: VideoScene = { place, patient: { pose, age: pose === 'colo' ? 'bebe' : 'adulto', sex: i % 2 ? 'F' : 'M', signs } };
    g.appendChild(frame(sc, 'geral', 'galeria:pose:' + i, `${pose} · ${place}`));
  });
}

// ---------------------------------------------------------------- pessoas: idade × sexo × tom (plano geral e rosto da MESMA pessoa)
if (want('pessoas')) {
  const s = section('video-pessoas', 'Vídeo — pessoas (idade × sexo × tom)', 'O rosto do close é a mesma pessoa do plano geral (mesmo tom, cabelo, roupa).');
  const g = grid(s, 10);
  const ages: VideoAge[] = ['bebe', 'crianca', 'adolescente', 'adulto', 'idoso'];
  for (const age of ages)
    for (const sex of ['M', 'F'] as const)
      for (let tone = 0; tone < 5; tone++) {
        const pt: VideoPatient = { pose: age === 'bebe' ? 'colo' : 'sentado', age, sex, tone };
        const sc: VideoScene = { place: tone % 2 ? 'quarto' : 'sala', patient: pt };
        const seed = `galeria:pessoa:${age}:${sex}:${tone}`;
        g.appendChild(frame(sc, 'geral', seed, `${age} ${sex} tom ${tone}`, { z: 1 }));
        g.appendChild(frame(sc, 'rosto', seed, 'rosto', { z: 1 }));
      }
}

// ---------------------------------------------------------------- enquadramentos
const FOCUSES: VideoFocus[] = ['geral', 'rosto', 'peito', 'maos', 'pernas', 'ferida', 'objeto', 'chao', 'ambiente', 'pessoas'];
const SAMPLES: [string, VideoScene][] = [
  ['infarto na sala', { place: 'sala', patient: { pose: 'sentado', age: 'idoso', sex: 'M', skin: 'palido', signs: ['suor', 'mao_no_peito'] }, props: ['remedios'], cast: [{ role: 'esposa', act: 'mao_na_boca', at: 'fundo' }] }],
  ['bebê com meningite', { place: 'quarto', patient: { pose: 'colo', age: 'bebe', sex: 'F', skin: 'palido', signs: ['manchas_roxas'] }, props: ['termometro'] }],
  ['asma grave (criança)', { place: 'quarto', light: 'noite', patient: { pose: 'curvado', age: 'crianca', sex: 'M', skin: 'cianose', signs: ['tiragem', 'respira_rapido'] }, props: ['bombinha'] }],
  ['moto: fratura exposta', { place: 'rua', light: 'noite', patient: { pose: 'deitado', age: 'adulto', sex: 'M', skin: 'palido', signs: ['sangue_perna', 'sangue_chao', 'deformidade_perna'], wear: 'motoboy', wound: { kind: 'exposta', at: 'perna' } }, props: ['moto'] }],
  ['facada no bar', { place: 'bar', light: 'noite', patient: { pose: 'caido', age: 'adulto', sex: 'M', skin: 'palido', signs: ['sangue_tronco', 'sangue_chao', 'mao_na_barriga'], wound: { kind: 'facada', at: 'barriga' } }, props: ['garrafa_quebrada'], cast: [{ role: 'garcom', act: 'comprimindo' }] }],
  ['AVC (idosa)', { place: 'cozinha', patient: { pose: 'sentado', age: 'idoso', sex: 'F', signs: ['face_torta', 'braco_caido'] }, cast: [{ role: 'filha', act: 'segurando_mao' }] }],
];
if (want('enquadramentos')) {
  const s = section('video-enquadramentos', 'Vídeo — enquadramentos', 'Mesma cena em todos os pedidos de "Mostrar…": o fundo do close é o lugar desfocado, com a mesma luz.');
  const g = grid(s, FOCUSES.length);
  for (const [label, sc] of SAMPLES) for (const f of FOCUSES) g.appendChild(frame(sc, f, 'galeria:enq:' + label, `${label} · ${f}`));
}

// ---------------------------------------------------------------- sinais
const SIGNS: { signs: VideoSign[]; skin: VideoPatient['skin']; focus: VideoFocus; pose?: VideoPose }[] = [
  { signs: ['olhos_fechados'], skin: 'cianose', focus: 'rosto' },
  { signs: ['suor'], skin: 'palido', focus: 'rosto' },
  { signs: ['face_torta'], skin: 'normal', focus: 'rosto' },
  { signs: ['inchaco_rosto', 'placas'], skin: 'vermelho', focus: 'rosto' },
  { signs: ['hematoma_olho'], skin: 'normal', focus: 'rosto' },
  { signs: ['sangue_nariz', 'sangue_boca'], skin: 'cinza', focus: 'rosto' },
  { signs: ['baba', 'olhos_revirados'], skin: 'palido', focus: 'rosto' },
  { signs: ['vomito'], skin: 'palido', focus: 'rosto' },
  { signs: ['tiragem', 'respira_rapido'], skin: 'cianose', focus: 'peito' },
  { signs: ['sangue_tronco'], skin: 'palido', focus: 'peito' },
  { signs: ['queimadura'], skin: 'normal', focus: 'peito' },
  { signs: ['manchas_roxas'], skin: 'palido', focus: 'pernas' },
  { signs: ['deformidade_perna', 'sangue_perna'], skin: 'palido', focus: 'pernas' },
  { signs: ['tremor'], skin: 'normal', focus: 'maos' },
  { signs: ['gravida'], skin: 'normal', focus: 'geral', pose: 'sentado' },
  { signs: ['baba'], skin: 'palido', focus: 'geral', pose: 'convulsao' },
];
if (want('sinais')) {
  const s = section('video-sinais', 'Vídeo — sinais', 'Sinais que precisam ser lidos de relance (sem sangue demais).');
  const g = grid(s, 8);
  SIGNS.forEach((x, i) => {
    const sc: VideoScene = { place: i % 2 ? 'sala' : 'quarto', patient: { pose: x.pose ?? 'deitado', age: 'adulto', sex: i % 3 ? 'F' : 'M', tone: i % 5, skin: x.skin, signs: x.signs } };
    g.appendChild(frame(sc, x.focus, 'galeria:sinal:' + i, (x.pose === 'convulsao' ? 'convulsão' : x.signs.join('+')) + ' · ' + x.focus));
  });
}

// ---------------------------------------------------------------- situações
const SITUACOES: [string, VideoScene][] = [
  ['tiroteio na rua (PM, gente abaixada)', { place: 'rua', light: 'noite', patient: { pose: 'deitado', age: 'adolescente', sex: 'M', skin: 'palido', signs: ['sangue_tronco', 'sangue_chao', 'olhos_fechados'], wound: { kind: 'tiro', at: 'barriga' } }, props: ['viatura', 'cones'], cast: [{ role: 'curioso', act: 'comprimindo' }, { role: 'policial', act: 'apontando', at: 'fundo' }, { role: 'curioso', act: 'escondido', at: 'esq' }, { role: 'curioso', act: 'filmando', at: 'dir' }] }],
  ['parto em casa', { place: 'quarto', light: 'noite', patient: { pose: 'parto', age: 'adulto', sex: 'F', signs: ['gravida', 'suor'] }, cast: [{ role: 'marido', act: 'segurando_mao' }, { role: 'mae', act: 'mao_na_boca', at: 'fundo' }] }],
  ['nasceu: bebê no peito', { place: 'quarto', light: 'noite', patient: { pose: 'cama', age: 'adulto', sex: 'F', signs: ['recem_nascido'], gear: ['manta'] } }],
  ['múltiplas vítimas', { place: 'praca', patient: { pose: 'deitado', age: 'idoso', sex: 'M', signs: ['olhos_fechados'] }, props: ['viatura', 'cones'], cast: [{ role: 'policial', act: 'apontando', at: 'fundo' }, { role: 'curioso', act: 'ferido', at: 'esq' }, { role: 'curioso', act: 'chorando', at: 'fundo' }, { role: 'curioso', act: 'deitado', at: 'fundo' }, { role: 'curioso', act: 'segurando_cabeca' }] }],
  ['carro contra o poste', { place: 'rua', light: 'noite', patient: { pose: 'deitado', age: 'adulto', sex: 'F', skin: 'palido', signs: ['sangue_cabeca', 'olhos_fechados'], gear: ['colar'] }, props: ['carro', 'poste'], cast: [{ role: 'bombeiro', act: 'segurando_cabeca' }, { role: 'curioso', act: 'filmando', at: 'fundo' }] }],
  ['preso no banco do carro', { place: 'carro', light: 'noite', patient: { pose: 'preso', age: 'adulto', sex: 'M', skin: 'cianose', signs: ['respira_rapido', 'mao_no_peito'] }, cast: [{ role: 'bombeiro', act: 'olhando', at: 'dir' }] }],
  ['RCP no ponto de ônibus', { place: 'ponto_onibus', light: 'noite', patient: { pose: 'deitado', age: 'adulto', sex: 'M', skin: 'cianose', signs: ['olhos_fechados'] }, cast: [{ role: 'curioso', act: 'rcp', wear: 'lanchonete' }, { role: 'curioso', act: 'filmando', at: 'fundo' }] }],
  ['afogamento na piscina', { place: 'piscina', patient: { pose: 'sentado', age: 'crianca', sex: 'M', signs: ['molhado'], gear: ['toalha'] }, cast: [{ role: 'curioso', act: 'olhando', at: 'fundo', wear: 'banho' }] }],
  ['enchente: infarto no telhado', { place: 'telhado', rain: true, patient: { pose: 'sentado', age: 'idoso', sex: 'M', skin: 'palido', signs: ['suor', 'mao_no_peito'] }, cast: [{ role: 'esposa', act: 'segurando_mao' }] }],
  ['agrotóxico na chácara', { place: 'chacara', light: 'noite', patient: { pose: 'deitado', age: 'adulto', sex: 'M', skin: 'palido', signs: ['baba', 'suor', 'vomito'] }, props: ['galao'], cast: [{ role: 'esposa', act: 'apontando', hold: 'galao', at: 'fundo' }] }],
  ['surto na calçada', { place: 'calcada', patient: { pose: 'em_pe', age: 'adulto', sex: 'M', signs: ['agitado', 'sangue_braco'], hold: 'pau' }, props: ['vasos'], cast: [{ role: 'mae', act: 'chorando', at: 'fundo' }, { role: 'curioso', act: 'filmando', at: 'fundo' }] }],
  ['mão presa na masseira', { place: 'padaria', patient: { pose: 'em_pe', age: 'adulto', sex: 'M', skin: 'palido', signs: ['sangue_braco'], wound: { kind: 'inchaco', at: 'mao' } }, props: ['masseira'], cast: [{ role: 'colega', act: 'maos_na_cabeca', at: 'fundo' }] }],
  ['academia: RCP na esteira', { place: 'academia', patient: { pose: 'deitado', age: 'adulto', sex: 'M', skin: 'cinza', signs: ['olhos_fechados'] }, cast: [{ role: 'colega', act: 'rcp', sex: 'F', wear: 'esporte' }, { role: 'professor', act: 'olhando', at: 'fundo', wear: 'esporte' }] }],
  ['desmaio no culto', { place: 'igreja', patient: { pose: 'deitado', age: 'idoso', sex: 'F', skin: 'palido', signs: ['suor'] }, cast: [{ role: 'fiel', act: 'abanando' }, { role: 'fiel', act: 'ajoelhado' }] }],
  ['quadra: joelho torcido', { place: 'quadra', patient: { pose: 'sentado', age: 'adolescente', sex: 'M' }, props: ['gelo', 'bola'], cast: [{ role: 'professor', act: 'olhando', at: 'fundo' }] }],
  ['trote: adolescentes rindo', { place: 'quarto', patient: null, laughing: true, shaky: true, props: ['ketchup', 'boneco'], people: 3 }],
];
if (want('situacoes')) {
  const s = section('video-situacoes', 'Vídeo — situações', 'Cenas compostas (lugar + pose + objetos + quem está em volta), no tamanho do jogo.');
  const g = grid(s, 4);
  for (const [label, sc] of SITUACOES) g.appendChild(frame(sc, 'geral', 'galeria:sit:' + label, label, { z: 2 }));
}

// ---------------------------------------------------------------- Intervenção
if (want('campo')) {
  const s = section('video-campo', 'Intervenção — a cena de cada ocorrência', 'Vista da equipe (sem efeito de celular; faróis à noite). A de longe é a cena insegura.');
  const g = grid(s, 4);
  for (const f of FIELD_CASES) {
    g.appendChild(frame(f.scene, 'geral', 'fd:' + f.id, f.id, { view: 'campo', z: 2 }));
    if (f.far) g.appendChild(frame(f.far, 'geral', 'fd:' + f.id + ':longe', f.id + ' · de longe', { view: 'campo', z: 2 }));
  }
}

pump();
