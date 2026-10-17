// Galeria de revisão visual da arte (art-gallery.html). Não faz parte do jogo.
import '@fontsource/vt323';
import '@fontsource/pixelify-sans';
import '@fontsource/jacquard-24';
import { portrait, MOODS, CHARACTER_IDS, CHARACTERS } from './portraits';
import { icon, statusIcon, ICON_NAMES, STATUS_ICON_NAMES } from './icons';
import { drawCityMap, mapPixelSize, type MapUnit, type MapRoute, type MapMarker } from './mapRender';
import { landmarkPos } from '../../engine/city/map';
import { route, addressTarget } from '../../engine/city/path';
import { drawScene, SCENE_BGS, HOUSE_ROOMS, houseExits, objectsFor, objectRect, type SceneCast, type ArtSceneBg, type SceneOpts } from './scenes';
import { newsPhoto, NEWS_KINDS, NEWS_W, NEWS_H, NEWS_CROP_W, NEWS_CROP_H } from './newsPhotos';
import { drawEnding, renderEnding as renderEndingPix, ENDING_KINDS, MURAL_FRAMES } from './endingArt';
import { figurePix, type CastId } from './figures';
import { drawDog, DOG_POSES, dogPortrait, dogFramePix, DOG_FRAMES, ozzyPlayDuration, OZZY_PLAY_PATHS } from './dog';
import { ozzySticker, OZZY_STICKERS, OZZY_STICKER_LABELS } from './stickers';
import { installFontFixes, FONT_FIX_UI, FONT_FIX_MAST } from './fontFix';
import { renderScene } from './scenes';
import { Pix, presentPix, gradedCopy } from './pix';
import { liamDrawing, LIAM_SUBJECTS } from './liamArt';
import { homeGrader, quantize } from './palette';

const app = document.getElementById('app')!;

function section(id: string, title: string): HTMLElement {
  const s = document.createElement('section');
  s.id = id;
  const h = document.createElement('h2');
  h.textContent = title;
  s.appendChild(h);
  app.appendChild(s);
  return s;
}

function img(src: string, scale: number, w: number, h: number): HTMLImageElement {
  const i = document.createElement('img');
  i.src = src;
  i.className = 'px';
  i.width = w * scale;
  i.height = h * scale;
  return i;
}

function cell(child: HTMLElement, label?: string): HTMLElement {
  const c = document.createElement('div');
  c.className = 'cell';
  c.appendChild(child);
  if (label) {
    const t = document.createElement('div');
    t.textContent = label;
    c.appendChild(t);
  }
  return c;
}

// ---------------------------------------------------------------- retratos
const params = new URLSearchParams(location.search);
const zoomIds = (params.get('zoom') ?? 'EU_M,EU_F,LUCIA,ALEX,DAVI,ZELIA,SIMONE').split(',') as typeof CHARACTER_IDS;
{
  const s = section('portraits-zoom', 'Retratos — detalhe ×4');
  const row = document.createElement('div');
  row.className = 'flex';
  for (const id of zoomIds) row.appendChild(cell(img(portrait(id, 'neutro'), 4, 64, 64), id));
  s.appendChild(row);
}
const PER = 6;
for (let g = 0; g * PER < CHARACTER_IDS.length; g++) {
  const s = section(`portraits-${g}`, `Retratos 64×64 (×2) — grupo ${g + 1}`);
  const grid = document.createElement('div');
  grid.className = 'grid';
  grid.style.gridTemplateColumns = `170px repeat(${MOODS.length + 1}, 128px)`;
  // cabeçalho
  grid.appendChild(document.createElement('div'));
  for (const m of MOODS) {
    const d = document.createElement('div');
    d.className = 'cap';
    d.textContent = m;
    grid.appendChild(d);
  }
  const d = document.createElement('div');
  d.className = 'cap';
  d.textContent = 'neutro · blend .8';
  grid.appendChild(d);
  for (const id of CHARACTER_IDS.slice(g * PER, g * PER + PER)) {
    const lab = document.createElement('div');
    lab.className = 'rowlabel';
    lab.innerHTML = `${CHARACTERS[id].name}<small>${id} · ${CHARACTERS[id].role}</small>`;
    grid.appendChild(lab);
    for (const m of MOODS) grid.appendChild(cell(img(portrait(id, m), 2, 64, 64)));
    grid.appendChild(cell(img(portrait(id, 'neutro', { blend: 0.8 }), 2, 64, 64)));
  }
  s.appendChild(grid);
}

// ---------------------------------------------------------------- ícones
{
  const isc = Number(params.get('iconscale') ?? 3);
  const s = section('icons', `Ícones 16×16 (×${isc}) e status 12×12 (×${isc})`);
  const row = document.createElement('div');
  row.className = 'grid';
  row.style.gridTemplateColumns = `repeat(${isc > 4 ? 9 : 12}, ${Math.max(84, 16 * isc + 8)}px)`;
  for (const n of ICON_NAMES) row.appendChild(cell(img(icon(n, isc), 1, 16 * isc, 16 * isc), n));
  s.appendChild(row);
  const row2 = document.createElement('div');
  row2.className = 'grid';
  row2.style.gridTemplateColumns = `repeat(${isc > 4 ? 9 : 12}, ${Math.max(84, 16 * isc + 8)}px)`;
  row2.style.marginTop = '14px';
  for (const n of STATUS_ICON_NAMES) row2.appendChild(cell(img(statusIcon(n, isc), 1, 12 * isc, 12 * isc), n));
  s.appendChild(row2);
  // amostra sobre fundo de painel claro
  const row3 = document.createElement('div');
  row3.className = 'flex';
  row3.style.marginTop = '14px';
  row3.style.background = '#2f4139';
  row3.style.padding = '8px';
  for (const n of ICON_NAMES) row3.appendChild(img(icon(n, 2), 1, 32, 32));
  s.appendChild(row3);
}

// ---------------------------------------------------------------- mapa
function canvas(w: number, h: number, scale: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  c.className = 'px';
  c.style.width = w * scale + 'px';
  c.style.height = h * scale + 'px';
  return c;
}
const animations: ((t: number) => void)[] = [];
{
  const tile = Number(params.get('tile') ?? 8);
  const mscale = Number(params.get('mapscale') ?? 2);
  const { w, h } = mapPixelSize(tile);
  const bc = landmarkPos('base_centro');
  const bn = landmarkPos('base_norte');
  const bv = landmarkPos('base_ve');
  const reg = landmarkPos('reg');
  const callA = addressTarget({ rua: 'Rua São João', n: 1240, bairro: 'Vila Nova' });
  const callB = addressTarget({ rua: 'Rua Pitangueira', n: 845, bairro: 'Bela Vista' });
  const r1 = route(bc, callA);
  const r2 = route(callB, reg);
  const r3 = route(bn, callB);
  const mk = (flood: boolean) => {
    const r1f = flood ? route(bc, callA, 'flood') : r1;
    const at = (path: [number, number][], f: number): [number, number] => path[Math.min(path.length - 1, Math.floor(f * (path.length - 1)))];
    const units: MapUnit[] = [
      { id: 'USA01', type: 'USA', x: bc[0], y: bc[1], status: 'QRV', label: 'USA 01' },
      { id: 'USB02', type: 'USB', x: bc[0], y: bc[1], status: 'QRV', label: 'USB 02' },
      { id: 'USB04', type: 'USB', x: at(r1f.path, 0.35)[0], y: at(r1f.path, 0.35)[1], status: 'DESLOC', label: 'USB 04', selected: true },
      { id: 'USA02', type: 'USA', x: at(r3.path, 0.5)[0], y: at(r3.path, 0.5)[1], status: 'DESLOC', label: 'USA 02' },
      { id: 'USB03', type: 'USB', x: callB[0], y: callB[1], status: 'LOCAL', label: 'USB 03' },
      { id: 'USB05', type: 'USB', x: at(r2.path, 0.6)[0], y: at(r2.path, 0.6)[1], status: 'TRANSP', label: 'USB 05' },
      { id: 'USA03', type: 'USA', x: reg[0], y: reg[1], status: 'RETIDO', label: 'USA 03' },
      { id: 'USB01', type: 'USB', x: bv[0], y: bv[1], status: 'PANE', label: 'USB 01' },
    ];
    const routes: MapRoute[] = [
      { path: r1f.path.slice(Math.floor(0.35 * (r1f.path.length - 1))), color: '#e8a33d' },
      { path: r3.path.slice(Math.floor(0.5 * (r3.path.length - 1))), color: '#e8a33d' },
      { path: r2.path.slice(Math.floor(0.6 * (r2.path.length - 1))), color: '#5aa7d6' },
      { path: route(callA, bv).path, color: '#8fa89a', dashed: true },
    ];
    const casa = landmarkPos('casa');
    const markers: MapMarker[] = [
      { x: casa[0], y: casa[1], kind: 'casa', label: 'SUA CASA' },
      { x: callA[0], y: callA[1], kind: 'chamada', label: 'Rua São João' },
      { x: callB[0], y: callB[1], kind: 'alvo' },
      { x: 47, y: 9, kind: 'invalido', label: 'Rua Saturno?' },
    ];
    return { units, routes, markers };
  };
  for (const flood of [false, true]) {
    const s = section(flood ? 'map-flood' : 'map', `Mapa de Santa Aurora — tile ${tile} (${w}×${h}) ×${mscale}${flood ? ' · alagamento (dia 17)' : ''}`);
    const c = canvas(w, h, mscale);
    s.appendChild(c);
    const ctx = c.getContext('2d')!;
    const data = mk(flood);
    const hover: [number, number] = [30, 9];
    const draw = (t: number) =>
      drawCityMap(ctx, { tile, t, flood, showLabels: true, ...data, hoverTile: hover, highlightStreet: flood ? undefined : 'Rua São João' });
    draw(1000);
    animations.push(draw);
  }
}

// ---------------------------------------------------------------- cenas
const SAMPLE: Record<ArtSceneBg, { objects: string[]; cast: SceneCast[] }> = {
  cozinha: {
    objects: ['cracha', 'geladeira_quebrada', 'desenhos', 'isopor', 'prato_seco', 'lata_acucar', 'suco_escondido', 'insulina', 'xicara', 'bolo', 'vela', 'roupa_varal', 'goteira', 'balde', 'meia_mancha', 'maquina', 'cartao_maquina'],
    cast: [
      { id: 'LUCIA', pose: 'em_pe', x: 70, status: 'bem' },
      { id: 'DAVI', pose: 'em_pe', x: 140, status: 'frio' },
      { id: 'ZELIA', pose: 'sentado', x: 210, status: 'doente' },
    ],
  },
  sala: {
    objects: ['cracha', 'maquina', 'cartao_maquina', 'sapato_fechado', 'carta', 'bolsa_passagem', 'flores', 'alianca', 'envelope', 'goteira', 'balde', 'cadeira_vazia', 'desenhos'],
    cast: [
      { id: 'LUCIA', pose: 'sentado', x: 176, status: 'triste' },
      { id: 'EU_M', pose: 'em_pe', x: 272 },
      { id: 'DAVI', pose: 'em_pe', x: 40 },
    ],
  },
  quarto: {
    objects: ['bombinha', 'desenho_raiva', 'meia_mancha'],
    cast: [
      { id: 'DAVI', pose: 'deitado', x: 50, status: 'doente' },
      { id: 'LUCIA', pose: 'em_pe', x: 150 },
      { id: 'EU_F', pose: 'em_pe', x: 186 },
    ],
  },
  porta: { objects: ['bolo', 'vela', 'flores', 'carta', 'sapato_fechado'], cast: [{ id: 'EU_F', pose: 'em_pe', x: 160 }] },
  escola: { objects: [], cast: [{ id: 'DAVI', pose: 'em_pe', x: 160, status: 'bem' }] },
  central: { objects: ['xicara'], cast: [{ id: 'EU_M', pose: 'em_pe', x: 196 }] },
  rua: { objects: [], cast: [{ id: 'EU_M', pose: 'em_pe', x: 150 }] },
  hospital: { objects: [], cast: [{ id: 'ZELIA', pose: 'deitado', x: 58, status: 'critico' }, { id: 'LUCIA', pose: 'sentado', x: 262, status: 'triste' }] },
  calcada: { objects: ['moveis_calcada'], cast: [{ id: 'DAVI', pose: 'em_pe', x: 176 }, { id: 'LUCIA', pose: 'em_pe', x: 200 }] },
  escritorio: { objects: [], cast: [{ id: 'EU_M', pose: 'sentado', x: 160 }] },
  igreja: { objects: ['flores'], cast: [{ id: 'LUCIA', pose: 'em_pe', x: 156 }, { id: 'DAVI', pose: 'em_pe', x: 174 }] },
  mesa: { objects: ['xicara', 'cracha'], cast: [] },
  preto: { objects: [], cast: [] },
  quarto_casal: {
    objects: ['cracha', 'caixa_costura', 'receita_sus', 'despertador', 'celular_carregando', 'guardanapo_mapa', 'telefone_cama'],
    cast: [
      { id: 'LUCIA', pose: 'sentado', x: 200 },
      { id: 'EU_M', pose: 'em_pe', x: 92 },
    ],
  },
  quintal: {
    objects: ['tambor_cheio', 'tampinha', 'balde'],
    cast: [
      { id: 'ZELIA', pose: 'sentado', x: 152 },
      { id: 'DAVI', pose: 'em_pe', x: 230 },
      { id: 'LUCIA', pose: 'em_pe', x: 66 },
    ],
  },
  banheiro: { objects: ['chinelo_zelia', 'remedios_zelia'], cast: [{ id: 'ZELIA', pose: 'em_pe', x: 70 }] },
};
{
  const sscale = Number(params.get('scenescale') ?? 2);
  const only = params.get('bg');
  for (const bg of SCENE_BGS) {
    if (only && only !== bg) continue;
    const s = section('scene-' + bg, `Cena "${bg}" — blend 0 e 0.8 (320×180 ×${sscale})`);
    const row = document.createElement('div');
    row.className = 'flex';
    const sample = SAMPLE[bg];
    // com a protagonista mulher, o Alex entra onde a Lúcia estaria
    const comAlex = sample.cast.some((c) => c.id === 'LUCIA');
    const castF = sample.cast.map((c) => ({ ...c, id: c.id === 'LUCIA' ? ('ALEX' as const) : c.id === 'EU_M' ? ('EU_F' as const) : c.id }));
    const variants: { blend: number; cast: SceneCast[]; label: string }[] = [
      { blend: 0, cast: sample.cast, label: 'blend 0' },
      { blend: 0.8, cast: sample.cast, label: 'blend 0.8' },
      ...(comAlex ? [{ blend: 0, cast: castF, label: 'protagonista mulher (Alex) · blend 0' }] : []),
    ];
    for (const v of variants) {
      const c = canvas(320, 180, sscale);
      row.appendChild(cell(c, v.label));
      const ctx = c.getContext('2d')!;
      const draw = (t: number) => drawScene(ctx, { bg, blend: v.blend, objects: sample.objects, cast: v.cast, ozzy: 'sentado', time: t });
      draw(1000);
      animations.push(draw);
    }
    s.appendChild(row);
  }
}

// ---------------------------------------------------------------- casa explorável
{
  const k = Number(params.get('casascale') ?? 2);
  const only = params.get('casa');
  const cast = (bg: ArtSceneBg, g: 'M' | 'F'): SceneCast[] =>
    (SAMPLE[bg]?.cast ?? []).map((c) => ({ ...c, id: g === 'F' ? (c.id === 'LUCIA' ? 'ALEX' : c.id === 'EU_M' ? 'EU_F' : c.id) : c.id }));
  for (const bg of HOUSE_ROOMS) {
    if (only && only !== bg) continue;
    const s = section('casa-' + bg, `Casa explorável — "${bg}": noite (com as saídas), dia e madrugada (×${k})`);
    const row = document.createElement('div');
    row.className = 'flex';
    const exits = houseExits(bg);
    const variants: { label: string; o: Partial<SceneOpts> }[] = [
      { label: `noite · saídas: ${exits.map((e) => e.to).join(', ')}`, o: { tod: 'noite', exits: exits[0]?.to ?? true } },
      { label: 'dia · protagonista mulher', o: { tod: 'dia', gender: 'F' } },
      { label: 'madrugada (Bico)', o: { tod: 'madrugada' } },
      { label: 'noite · blend .8', o: { tod: 'noite', blend: 0.8 } },
    ];
    const vsel = params.get('casav');
    for (const [vi, v] of variants.entries()) {
      if (vsel !== null && Number(vsel) !== vi) continue;
      const c = canvas(320, 180, k);
      row.appendChild(cell(c, v.label));
      const ctx = c.getContext('2d')!;
      const g = v.o.gender ?? 'M';
      const draw = (t: number) =>
        drawScene(ctx, { bg, blend: 0, objects: SAMPLE[bg]?.objects ?? [], cast: v.o.tod === 'madrugada' ? [] : cast(bg, g), ozzy: v.o.tod === 'madrugada' ? 'dormindo' : 'sentado', time: t, ...v.o });
      draw(1000);
      animations.push(draw);
    }
    s.appendChild(row);
    // todos os objetos do cômodo de uma vez, com o retângulo clicável de cada um
    const objs = objectsFor(bg);
    const s2 = section('casa-obj-' + bg, `"${bg}" — os ${objs.length} objetos clicáveis de uma vez (retângulos em vermelho)`);
    const wrap = document.createElement('div');
    wrap.style.position = 'relative';
    const c = canvas(320, 180, 3);
    wrap.appendChild(c);
    for (const id of objs) {
      const r = objectRect(bg, id);
      const d = document.createElement('div');
      Object.assign(d.style, { position: 'absolute', left: r.x * 3 + 'px', top: r.y * 3 + 'px', width: r.w * 3 + 'px', height: r.h * 3 + 'px', outline: '1px dashed rgba(224,72,61,.8)' });
      d.title = id;
      wrap.appendChild(d);
    }
    s2.appendChild(wrap);
    const list = document.createElement('div');
    list.className = 'cap';
    list.style.maxWidth = '960px';
    list.textContent = objs.join(' · ');
    s2.appendChild(list);
    const ctx = c.getContext('2d')!;
    const draw = (t: number) => drawScene(ctx, { bg, blend: 0, objects: objs, cast: [], ozzy: false, time: t, liamArt: Number(params.get('aulas') ?? 0) });
    draw(1000);
    animations.push(draw);
  }
}

// ---------------------------------------------------------------- casa: dias que mudam a cena
{
  const k = Number(params.get('diascale') ?? 2);
  const s = section('casa-dias', `Casa — dias marcados (casa.md): goteira, a volta da família, o aniversário, o Bico (×${k})`);
  const row = document.createElement('div');
  row.className = 'flex';
  const days: { label: string; o: SceneOpts }[] = [
    { label: 'D17 sala: goteiras, baldes, desenhos molhados', o: { bg: 'sala', blend: 0.3, objects: ['goteira', 'balde', 'desenhos_molhados'], cast: [{ id: 'ZELIA', pose: 'sentado', x: 236 }], time: 0, ozzy: 'deitado', liamArt: 1 } },
    { label: 'D17 quintal: chuva, tambor transbordando', o: { bg: 'quintal', blend: 0.3, objects: ['chuva', 'tambor_transbordando', 'urso_varal'], cast: [], time: 0, ozzy: 'dormindo' } },
    { label: 'D18 sala: a mala azul e o Pirata (os dois cães no tapete)', o: { bg: 'sala', blend: 0, objects: ['mala_azul'], cast: [{ id: 'LUCIA', pose: 'em_pe', x: 112 }, { id: 'DAVI', pose: 'em_pe', x: 152 }], time: 0, ozzy: 'dormindo', pirata: 'dormindo' } },
    { label: 'D15 quintal: o Ozzy de chapéu de festa (dia)', o: { bg: 'quintal', blend: 0, objects: [], cast: [{ id: 'DAVI', pose: 'em_pe', x: 230 }], time: 0, ozzy: 'sentado', ozzyHat: true, tod: 'dia' } },
    { label: 'D15 cozinha: bolo com sirene', o: { bg: 'cozinha', blend: 0, objects: ['bolo_sirene', 'vela', 'desenho_geladeira'], cast: [{ id: 'DAVI', pose: 'em_pe', x: 150 }, { id: 'ZELIA', pose: 'sentado', x: 204 }], time: 0, ozzy: 'sentado', liamArt: 2 } },
    { label: 'D10 Bico: quarto do casal de madrugada, a caixinha no travesseiro', o: { bg: 'quarto_casal', blend: 0.2, objects: ['caixinha_veludo', 'celular_carregando'], cast: [], time: 0, ozzy: false, tod: 'madrugada' } },
    { label: 'D10 banheiro: a queda (tapete torto, chinelo virado)', o: { bg: 'banheiro', blend: 0.2, objects: ['tapete_torto', 'chinelo_virado', 'poca_agua'], cast: [{ id: 'ZELIA', pose: 'deitado', x: 190, status: 'doente' }], time: 0, ozzy: false } },
    { label: 'D9 quintal de dia: abelhas no limoeiro, Zélia na cadeira', o: { bg: 'quintal', blend: 0, objects: ['abelhas', 'pratinhos'], cast: [{ id: 'ZELIA', pose: 'sentado', x: 152 }], time: 0, ozzy: 'brincando', tod: 'dia' } },
  ];
  for (const d of days) {
    const c = canvas(320, 180, k);
    row.appendChild(cell(c, d.label));
    const ctx = c.getContext('2d')!;
    const draw = (t: number) => drawScene(ctx, { ...d.o, time: t });
    draw(1000);
    animations.push(draw);
  }
  s.appendChild(row);
  // os desenhos do Liam: os 14 assuntos nos 3 níveis (giz, traço firme, grafite e aquarela)
  const s2 = section('liam-desenhos', 'Desenhos do Liam na cena — 14 assuntos × 3 níveis pelas aulas de desenho (×6)');
  for (const level of [0, 1, 2] as const) {
    const r2 = document.createElement('div');
    r2.className = 'flex';
    for (const sub of LIAM_SUBJECTS) {
      const p = new Pix(18, 16);
      p.clear('#c9a46a');
      liamDrawing(p, 2, 3, 14, 12, sub, level, 3, level === 0);
      r2.appendChild(cell(img(p.toDataURL(6), 1, 18 * 6, 16 * 6), `${sub} · ${['giz', 'firme', 'aquarela'][level]}`));
    }
    s2.appendChild(r2);
  }
}

// ---------------------------------------------------------------- jornal
{
  // ×2 é a escala do jogo; ?newscrop mostra também o recorte da página apertada
  const nscale = Number(params.get('newsscale') ?? 2);
  const s = section('news', `Fotos de jornal ${NEWS_W}×${NEWS_H} (×${nscale}) — retícula ordenada`);
  const row = document.createElement('div');
  row.className = 'grid';
  row.style.gridTemplateColumns = `repeat(4, ${NEWS_W * nscale + 8}px)`;
  for (const k of NEWS_KINDS) row.appendChild(cell(img(newsPhoto(k), nscale, NEWS_W, NEWS_H), k));
  s.appendChild(row);
  if (params.has('newscrop')) {
    const row2 = document.createElement('div');
    row2.className = 'grid';
    row2.style.gridTemplateColumns = `repeat(6, ${NEWS_CROP_W * nscale + 8}px)`;
    row2.style.marginTop = '16px';
    for (const k of NEWS_KINDS) row2.appendChild(cell(img(newsPhoto(k, { crop: true }), nscale, NEWS_CROP_W, NEWS_CROP_H), k + ' (recorte)'));
    s.appendChild(row2);
  }
}

// ---------------------------------------------------------------- finais
{
  const escale = Number(params.get('endscale') ?? 2);
  const only = params.get('end');
  for (const kind of ENDING_KINDS) {
    if (only && only !== kind) continue;
    const s = section('end-' + kind, `Vinheta "${kind}" (320×180 ×${escale})`);
    const row = document.createElement('div');
    row.className = 'flex';
    const variants: { gender: 'M' | 'F'; blend: number; label: string }[] =
      kind === 'desenho_davi' || kind === 'desenho_cadeira' || kind === 'cracha_prego' || kind === 'quarto_alugado' || kind === 'escritorio_ar'
        ? [
            { gender: 'M', blend: 0, label: 'M' },
            { gender: 'F', blend: kind === 'cracha_prego' ? 0.8 : 0, label: kind === 'cracha_prego' ? 'F · blend .8' : 'F' },
          ]
        : kind === 'calcada_moveis'
          ? [
              { gender: 'M', blend: 0, label: 'M · blend 0' },
              { gender: 'F', blend: 0.8, label: 'F (Alex) · blend .8' },
            ]
          : kind === 'mural' || kind === 'bolo_porta'
          ? [
              { gender: 'M', blend: 0, label: 'blend 0' },
              { gender: 'M', blend: 0.8, label: 'blend .8' },
            ]
          : [{ gender: 'M', blend: 0, label: '' }];
    for (const v of variants) {
      const c = canvas(320, 180, escale);
      const wrap = document.createElement('div');
      wrap.style.position = 'relative';
      wrap.appendChild(c);
      if (kind === 'mural') {
        // mostra as áreas exportadas para legendas
        for (const r of MURAL_FRAMES) {
          const d = document.createElement('div');
          Object.assign(d.style, {
            position: 'absolute',
            left: r.x * escale + 'px',
            top: r.y * escale + 'px',
            width: r.w * escale + 'px',
            height: r.h * escale + 'px',
            outline: '1px dashed rgba(224,72,61,.7)',
          });
          wrap.appendChild(d);
        }
      }
      row.appendChild(cell(wrap, v.label));
      const ctx = c.getContext('2d')!;
      const draw = (t: number) => drawEnding(ctx, kind, { time: t, gender: v.gender, blend: v.blend });
      draw(1000);
      animations.push(draw);
    }
    s.appendChild(row);
  }
}

// ---------------------------------------------------------------- Ozzy
{
  const oscale = Number(params.get('dogscale') ?? 6);
  const s = section('ozzy', `Ozzy, o lulu da família — poses (×${oscale}), ao lado do Liam; blend 0 e 0.8`);
  for (const blend of [0, 0.8]) {
    const row = document.createElement('div');
    row.className = 'flex';
    const q = quantize(blend, 20);
    const map = q > 0 ? homeGrader(q) : null;
    for (const pose of DOG_POSES) {
      const W = pose === 'brincando' ? 52 : 40;
      const c = canvas(W, 32, oscale);
      row.appendChild(cell(c, `${pose}${blend ? ' · blend ' + blend : ''}`));
      const ctx = c.getContext('2d')!;
      const p = new Pix(W, 32);
      const draw = (t: number) => {
        p.setMap(map).clear('#8e3e2c');
        p.blit(gradedCopy(figurePix('DAVI', 'em_pe', { blink: t % 4300 < 150 }), map, 'g' + q), 2, 6);
        drawDog(p, 26, 29, pose, t, { map, mapKey: 'g' + q });
        presentPix(ctx, p, 0, 0, 1, 'ozzy-' + pose + blend);
      };
      draw(1000);
      animations.push(draw);
    }
    s.appendChild(row);
  }
  // retrato 64×64 (×2) para a interface
  const prow = document.createElement('div');
  prow.className = 'flex';
  for (const pose of DOG_POSES) prow.appendChild(cell(img(dogPortrait(pose, { t: 1000, size: 128 }), 1, 128, 128), `retrato · ${pose}`));
  s.appendChild(prow);
}

// ---------------------------------------------------------------- família nova
{
  const fscale = Number(params.get('famscale') ?? 6);
  const s = section('familia', `Família — corpo inteiro (×${fscale}): em pé, sentado, deitado; blend 0 e 0.8`);
  for (const blend of [0, 0.8]) {
    const row = document.createElement('div');
    row.className = 'flex';
    const q = quantize(blend, 20);
    const map = q > 0 ? homeGrader(q) : null;
    for (const id of ['LUCIA', 'ALEX', 'DAVI', 'ZELIA', 'EU_M', 'EU_F'] as CastId[]) {
      const p = new Pix(84, 36);
      p.setMap(map).clear('#7a5030');
      p.blit(gradedCopy(figurePix(id, 'em_pe'), map, 'f' + q), 2, 2);
      p.blit(gradedCopy(figurePix(id, 'sentado', { chair: true }), map, 'f' + q), 20, 36 - figurePix(id, 'sentado', { chair: true }).h - 2);
      p.blit(gradedCopy(figurePix(id, 'deitado'), map, 'f' + q), 44, 22);
      row.appendChild(cell(img(p.toDataURL(fscale), 1, 84 * fscale, 36 * fscale), `${id}${blend ? ' · blend .8' : ''}`));
    }
    s.appendChild(row);
  }
}

// ---------------------------------------------------------------- Ozzy: quadros e brincadeira
{
  const k = Number(params.get('framescale') ?? 8);
  const s = section('ozzy-quadros', `Ozzy — todos os quadros (×${k}), virado para a direita (a UI espelha)`);
  const row = document.createElement('div');
  row.className = 'flex';
  for (const f of DOG_FRAMES) {
    const d = dogFramePix(f);
    const p = new Pix(24, 16);
    p.clear('#c99a5e');
    p.blit(d, 12 - Math.floor(d.w / 2), 15 - d.h);
    row.appendChild(cell(img(p.toDataURL(k), 1, 24 * k, 16 * k), f));
  }
  s.appendChild(row);

  const bscale = Number(params.get('playscale') ?? 2);
  const s2 = section('ozzy-brincar', `Brincar com o Ozzy — ele corre pela sala latindo e dorme no tapete (SceneOpts.ozzyPlay; ×${bscale})`);
  const cast: SceneCast[] = [
    { id: 'LUCIA', pose: 'sentado', x: 176 },
    { id: 'DAVI', pose: 'em_pe', x: 40 },
    { id: 'ZELIA', pose: 'sentado', x: 236 },
  ];
  const dur = ozzyPlayDuration(OZZY_PLAY_PATHS.sala);
  const live = canvas(320, 180, bscale);
  s2.appendChild(cell(live, `ao vivo (repete a cada ${Math.round((dur + 4000) / 100) / 10} s)`));
  const lctx = live.getContext('2d')!;
  const t0 = performance.now();
  const drawLive = (t: number) => drawScene(lctx, { bg: 'sala', blend: 0, objects: [], cast, ozzyPlay: (t - t0) % (dur + 4000), time: t });
  drawLive(t0);
  animations.push(drawLive);
  const strip = document.createElement('div');
  strip.className = 'flex';
  const moments: [number, string][] = [
    [600, 'correndo'],
    [2400, 'parou e latiu: AU!'],
    [3300, 'correndo de volta'],
    [4620, 'late de novo'],
    [dur - 900, 'deitando no tapete'],
    [dur + 2600, 'dormindo (zzz)'],
  ];
  for (const [t, lab] of moments) {
    const p = renderScene({ bg: 'sala', blend: 0, objects: [], cast, ozzyPlay: t, time: t }).crop(40, 92, 260, 70);
    strip.appendChild(cell(img(p.toDataURL(2), 1, 520, 140), `${Math.round(t)} ms · ${lab}`));
  }
  s2.appendChild(strip);
}

// ---------------------------------------------------------------- adesivos do Ozzy
{
  const k = Number(params.get('stickerscale') ?? 4);
  const s = section('adesivos', `Adesivos do Ozzy para o quadro de cortiça (30×28 ×${k})`);
  const row = document.createElement('div');
  row.className = 'flex';
  row.style.background = '#a8763f';
  row.style.padding = '12px';
  for (const kind of OZZY_STICKERS) row.appendChild(cell(img(ozzySticker(kind, k), 1, 30 * k, 28 * k), OZZY_STICKER_LABELS[kind]));
  s.appendChild(row);
}

// ---------------------------------------------------------------- crachá com o nome do jogador
{
  const s = section('cracha-nomes', 'Crachá com o nome escolhido (EndingOpts.name)');
  const row = document.createElement('div');
  row.className = 'flex';
  for (const [g, name] of [
    ['F', undefined],
    ['M', undefined],
    ['F', 'Maria Eduarda'],
    ['M', 'Maximiliano'],
  ] as ['M' | 'F', string | undefined][]) {
    const c = canvas(140, 100, 2);
    const ctx = c.getContext('2d')!;
    const p = new Pix(320, 180);
    const draw = (t: number) => {
      const e = renderEndingPix('cracha_prego', { time: t, gender: g, name });
      p.copyFrom(e);
      presentPix(ctx, p.crop(90, 10, 140, 100), 0, 0, 1, 'cr' + g + name);
    };
    draw(1000);
    row.appendChild(cell(c, `${g} · ${name ?? 'padrão'}`));
  }
  s.appendChild(row);
}

// ---------------------------------------------------------------- legibilidade das fontes
{
  const s = section('fontes', `Fontes — antes e depois do conserto (${FONT_FIX_UI} / ${FONT_FIX_MAST})`);
  const sample = 'R$ 150 · Dona Zélia · 20 dias · Bem · Zona 25 · 1258 · Bebê';
  const mk = (family: string, size: number, weight: number, text: string, lab: string) => {
    const d = document.createElement('div');
    d.style.fontFamily = family;
    d.style.fontSize = size + 'px';
    d.style.fontWeight = String(weight);
    d.style.margin = '4px 0';
    d.innerHTML = `<small style="font:12px monospace;color:#8fa89a;margin-right:10px">${lab}</small>${text}`;
    s.appendChild(d);
  };
  for (const size of [12, 14, 16]) {
    mk("'Pixelify Sans'", size, 400, sample, `antes ${size}px`);
    mk(`'${FONT_FIX_UI}', 'Pixelify Sans'`, size, 400, sample, `depois ${size}px`);
  }
  mk("'Pixelify Sans'", 14, 600, sample, 'antes 14px 600');
  mk(`'${FONT_FIX_UI}', 'Pixelify Sans'`, 14, 600, sample, 'depois 14px 600');
  mk("'Jacquard 24'", 36, 400, 'A médica do telefone · Às vezes', 'antes');
  mk(`'${FONT_FIX_MAST}', 'Jacquard 24'`, 36, 400, 'A médica do telefone · Às vezes', 'depois');
  void installFontFixes();
}

let frozen = params.has('freeze');
const loop = (t: number) => {
  if (!frozen) for (const a of animations) a(t);
  requestAnimationFrame(loop);
};
requestAnimationFrame(loop);
void frozen;

(window as unknown as { __galleryReady: boolean }).__galleryReady = true;
