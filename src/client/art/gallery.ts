// Galeria de revisão visual da arte (art-gallery.html). Não faz parte do jogo.
import '@fontsource/vt323';
import '@fontsource/pixelify-sans';
import '@fontsource/jacquard-24';
import { portrait, MOODS, CHARACTER_IDS, CHARACTERS } from './portraits';
import { icon, statusIcon, ICON_NAMES, STATUS_ICON_NAMES } from './icons';
import { drawCityMap, mapPixelSize, type MapUnit, type MapRoute, type MapMarker } from './mapRender';
import { landmarkPos } from '../../engine/city/map';
import { route, addressTarget } from '../../engine/city/path';
import { drawScene, SCENE_BGS, type SceneCast } from './scenes';
import type { SceneBg } from '../../engine/types';
import { newsPhoto, NEWS_KINDS, NEWS_W, NEWS_H, NEWS_CROP_W, NEWS_CROP_H } from './newsPhotos';
import { drawEnding, ENDING_KINDS, MURAL_FRAMES } from './endingArt';
import { figurePix } from './figures';
import { drawDog, DOG_POSES, dogPortrait } from './dog';
import { Pix, presentPix, gradedCopy } from './pix';
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
const SAMPLE: Record<SceneBg, { objects: string[]; cast: SceneCast[] }> = {
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

let frozen = params.has('freeze');
const loop = (t: number) => {
  if (!frozen) for (const a of animations) a(t);
  requestAnimationFrame(loop);
};
requestAnimationFrame(loop);
void frozen;

(window as unknown as { __galleryReady: boolean }).__galleryReady = true;
