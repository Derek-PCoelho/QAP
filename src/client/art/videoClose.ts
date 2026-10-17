// =============================================================================
// Videochamada: os closes (rosto, peito, mãos, pernas, ferimento, objeto, chão).
//
// Tudo sai do MESMO palco do plano geral: a mesma aparência do paciente (tom de
// pele, cabelo, penteado, roupa — o rosto vem de faces.ts com esses dados), o
// mesmo lugar (o fundo do close é o recorte desfocado do lugar atrás da parte
// do corpo) e a mesma luz (o nível de luz do ponto, tingido como no plano
// geral). Desenhado em 96×72 e ampliado 2× pela cena: o close é a câmera
// chegando perto, com pixels maiores, mas coerentes dentro do quadro.
// Puro (sem DOM).
// =============================================================================
import { Pix, mulberry, hashStr, bayerOn, hash2 } from './pix';
import { mix } from './palette';
import { mixLab } from './portraitKit';
import { patientFacePix, type PatientFaceSpec } from './faces';
import { Fig, capsule, ellipseShaded, polyShaded, stain, trickle, dots, innerLines, TH_CLOTH, TH_SKIN, G, BLOOD, INK, drawFigure, type V2 } from './videoFigure';
import { compose } from './portraitKit';
import { propSprite } from './videoProps';
import { applyLight, type LightMap } from './videoLight';
import { actorFrame, drawY, isLyingPose, type Stage, type Actor } from './video';
import type { VideoFocus, VideoProp, VideoSign, VideoWound, VideoBodyPart } from '../../engine/types';
import type { Look } from './videoLook';

export const CW = 96;
export const CH = 72;

const cache = new Map<string, Pix>();

// -----------------------------------------------------------------------------
// Fundo desfocado (recorte do lugar) e luz do ponto
// -----------------------------------------------------------------------------
/** recorte do fundo do palco ao redor de (wx, wy), ampliado ×4 com desfoque e pontilhado */
function bokeh(st: Stage, wx: number, wy: number, darken = 0.12): Pix {
  const w = 24;
  const h = 18;
  const x0 = Math.round(wx - w / 2);
  const y0 = Math.round(wy - h / 2);
  // desfoque 3×3 no recorte (em float)
  const R = new Float32Array(w * h);
  const Gc = new Float32Array(w * h);
  const B = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const v = st.bg.get(Math.max(0, Math.min(st.bg.w - 1, x0 + x + dx)), Math.max(0, Math.min(st.bg.h - 1, y0 + y + dy)));
          r += v & 255;
          g += (v >>> 8) & 255;
          b += (v >>> 16) & 255;
          n++;
        }
      R[y * w + x] = r / n;
      Gc[y * w + x] = g / n;
      B[y * w + x] = b / n;
    }
  const out = new Pix(CW, CH);
  for (let y = 0; y < CH; y++)
    for (let x = 0; x < CW; x++) {
      // bilinear com pontilhado ordenado (mantém a textura de pixel)
      const u = x / 4 - 0.5;
      const v = y / 4 - 0.5;
      let i0 = Math.floor(u);
      let j0 = Math.floor(v);
      const fu = u - i0;
      const fv = v - j0;
      if (bayerOn(x, y, fu)) i0++;
      if (bayerOn(x + 2, y + 1, fv)) j0++;
      i0 = Math.max(0, Math.min(w - 1, i0));
      j0 = Math.max(0, Math.min(h - 1, j0));
      const k = j0 * w + i0;
      const m = 1 - darken;
      const r = Math.round(R[k] * m);
      const g = Math.round(Gc[k] * m);
      const b = Math.round(B[k] * m);
      out.raw(x, y, ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0);
    }
  return out;
}

/** mapa de luz uniforme com o nível do ponto (x, y) do palco */
function pointLight(st: Stage, wx: number, wy: number): LightMap {
  const lm = st.lm;
  const x = Math.max(0, Math.min(lm.w - 1, Math.round(wx)));
  const y = Math.max(0, Math.min(lm.h - 1, Math.round(wy)));
  // média do nível em volta (evita pegar um pixel do pontilhado)
  let sum = 0;
  let n = 0;
  for (let dy = -3; dy <= 3; dy++)
    for (let dx = -3; dx <= 3; dx++) {
      const xx = Math.max(0, Math.min(lm.w - 1, x + dx));
      const yy = Math.max(0, Math.min(lm.h - 1, y + dy));
      sum += lm.band[yy * lm.w + xx];
      n++;
    }
  const band = new Uint8Array(CW * CH).fill(Math.round(sum / n));
  const hue = new Uint8Array(CW * CH).fill(lm.hue[y * lm.w + x]);
  return { w: CW, h: CH, band, hue, mode: lm.mode };
}

/** pontos do paciente no mundo (do mesmo desenho do plano geral) */
function worldPts(st: Stage, P: Actor): Record<string, V2> {
  const f = actorFrame(st, P, 0).fig;
  const out: Record<string, V2> = {};
  for (const [k, v] of Object.entries(f.pts)) out[k] = [P.x + v[0], drawY(P) + v[1]];
  return out;
}

// -----------------------------------------------------------------------------
// Rosto
// -----------------------------------------------------------------------------
function faceSpecOf(st: Stage, L: Look, sg: VideoSign[], pose: string): PatientFaceSpec {
  const dead = sg.includes('rigidez') || sg.includes('livores');
  const pain = sg.includes('suor') || sg.includes('mao_no_peito') || sg.includes('mao_na_barriga') || sg.includes('queimadura') || sg.some((s) => s.startsWith('sangue')) || sg.includes('deformidade_perna') || sg.includes('deformidade_braco');
  const scared = sg.includes('agitado') || sg.includes('respira_rapido') || sg.includes('tremor') || sg.includes('maos_no_pescoco') || sg.includes('tiragem') || sg.includes('chorando');
  const eyes: PatientFaceSpec['eyes'] = sg.includes('olhos_revirados') || pose === 'convulsao' ? 'revirados' : dead ? 'semi' : sg.includes('olhos_fechados') ? 'fechados' : 'abertos';
  const head = sg.includes('sangue_cabeca') || sg.includes('sangue_rosto');
  const nose = sg.includes('sangue_nariz');
  return {
    seed: hashStr(st.seed + ':rosto'),
    age: L.age,
    sex: L.sex,
    skin: L.tone,
    hair: L.hair,
    hairStyle: L.style,
    shirt: L.top === L.skin ? undefined : L.top,
    beard: L.beard,
    state: L.state,
    sweat: sg.includes('suor'),
    eyes,
    droop: sg.includes('face_torta') ? 'dir' : undefined,
    bruise: sg.includes('hematoma_olho'),
    swelling: sg.includes('inchaco_rosto'),
    blood: head || nose,
    bloodFrom: head && nose ? 'ambos' : nose ? 'nariz' : 'cabeca',
    froth: sg.includes('espuma') || sg.includes('baba'),
    petechiae: sg.includes('manchas_roxas'),
    expression: sg.includes('rindo') ? 'rindo' : eyes !== 'abertos' ? 'calmo' : scared ? 'assustado' : pain || L.state !== 'normal' ? 'dor' : 'calmo',
  };
}

function closeFace(st: Stage, t: number): Pix {
  const P = st.patient!;
  const L = P.look;
  const sg = P.spec.signs ?? [];
  const W = worldPts(st, P);
  const head = W.head;
  const p = bokeh(st, head[0], head[1] - 2);
  const spec = faceSpecOf(st, L, sg, P.pose);
  const face = patientFacePix(spec);
  applyLight(face, pointLight(st, head[0], head[1]), 0, 0);
  // tremor/convulsão/respiração rápida mexem o quadro
  const ph = P.phases > 1 ? Math.floor(t / P.period) % P.phases : 0;
  let jx = 0;
  let jy = 0;
  if (P.pose === 'convulsao') [jx, jy] = [[1, 0], [-1, 1], [0, -1], [1, 1]][ph % 4];
  else if (sg.includes('tremor') || sg.includes('agitado')) jx = ph % 2 ? 1 : 0;
  else if (sg.includes('respira_rapido') || sg.includes('tiragem')) jy = ph % 2;
  const ox = 16 + jx;
  const oy = 8 + jy;
  p.blit(face, ox, oy);
  faceOverlays(p, st, L, sg, ox, oy);
  return p;
}

/** o que o rosto de faces.ts não desenha: capacete, máscara de O2, colar, lágrimas, vômito, curativo, poeira */
function faceOverlays(p: Pix, st: Stage, L: Look, sg: VideoSign[], ox: number, oy: number): void {
  const P = st.patient!;
  const gear = P.spec.gear ?? [];
  const lit = (hex: string) => hex; // a luz já está no rosto; os acessórios usam cores médias
  const cx = ox + 32;
  if (sg.includes('chorando')) for (const x of [ox + 22, ox + 41]) for (let y = 0; y < 5; y++) p.px(x + (y > 2 ? 1 : 0), oy + 33 + y, y % 2 ? '#9ad0ec' : '#c8e8f8');
  if (sg.includes('sangue_boca')) {
    p.rect(cx + 4, oy + 45, 2, 2, BLOOD[2]);
    p.vl(cx + 5, oy + 47, oy + 51, BLOOD[1]);
  }
  if (sg.includes('vomito') || sg.includes('vomito_sangue')) {
    const c = sg.includes('vomito_sangue') ? '#4a2018' : '#a69a3c';
    p.rect(cx - 3, oy + 48, 5, 2, c);
    p.px(cx - 2, oy + 50, c);
  }
  if (sg.includes('poeira')) {
    const r = mulberry(5);
    for (let i = 0; i < 30; i++) p.px(ox + 10 + Math.floor(r() * 44), oy + 4 + Math.floor(r() * 50), '#c8bca4');
  }
  if (sg.includes('molhado')) {
    const r = mulberry(9);
    for (let i = 0; i < 10; i++) {
      const x = ox + 12 + Math.floor(r() * 40);
      const y = oy + 4 + Math.floor(r() * 46);
      p.px(x, y, '#e8f6ff');
      p.px(x, y + 1, '#8ac0e0');
    }
  }
  if (sg.includes('curativo')) {
    p.rect(cx + 4, oy + 12, 9, 5, '#f2f0ea');
    p.hl(cx + 4, cx + 12, oy + 12, '#ffffff');
    p.px(cx + 8, oy + 14, '#c8a0a0');
  }
  if (sg.includes('placas')) {
    const r = mulberry(13);
    for (let i = 0; i < 9; i++) p.ellipse(ox + 18 + r() * 28, oy + 54 + r() * 8, 2.2, 1.4, mixLab(L.skin, '#d84a4a', 0.4));
  }
  // capacete (moto: viseira levantada; obra: casco)
  const hat = L.hat;
  if (hat === 'capacete') {
    for (let y = oy - 2; y < oy + 56; y++)
      for (let x = ox - 2; x < ox + 66; x++) {
        const dx = (x - cx) / 27;
        const dy = (y - (oy + 26)) / 30;
        const d = dx * dx + dy * dy;
        const inFace = Math.abs(x - cx) < 15 && y > oy + 15 && y < oy + 50;
        if (d <= 1 && d > 0.62 && !inFace) p.px(x, y, d > 0.92 ? INK : d > 0.8 ? mixLab(L.hatColor, '#000000', 0.25) : L.hatColor);
      }
    // queixeira e viseira levantada
    p.rect(cx - 15, oy + 48, 30, 5, mixLab(L.hatColor, '#000000', 0.15));
    p.rect(cx - 20, oy + 1, 40, 6, '#26303a');
    p.hl(cx - 18, cx + 10, oy + 2, '#6a8aa8');
  } else if (hat === 'capacete_obra' || hat === 'bone' || hat === 'touca' || hat === 'quepe') {
    p.ellipse(cx, oy + 9, 22, 9, hat === 'quepe' ? '#3a4048' : L.hatColor);
    p.rect(cx - 22, oy + 9, 44, 4, hat === 'quepe' ? '#3a4048' : L.hatColor);
    p.ellipse(cx - 6, oy + 5, 8, 2.5, mix(L.hatColor, '#ffffff', 0.35));
    if (hat !== 'touca') p.rect(cx - 25, oy + 12, hat === 'bone' ? 40 : 50, 3, mixLab(L.hatColor, '#000000', 0.3));
    p.hl(cx - 22, cx + 22, oy + 15, INK);
  }
  // colar cervical
  if (gear.includes('colar')) {
    p.rect(cx - 13, oy + 51, 26, 9, '#e07a2a');
    p.hl(cx - 13, cx + 12, oy + 51, '#f0a060');
    p.rect(cx - 4, oy + 52, 8, 6, '#2a2a30');
  }
  // máscara de oxigênio
  if (gear.includes('mascara_o2') || gear.includes('ambu')) {
    p.ellipse(cx, oy + 42, 9, 7, '#bfe8d0', 0.75);
    p.ellipse(cx, oy + 42, 9, 7, '#bfe8d0', 0.0);
    for (let x = cx - 9; x <= cx + 9; x++) {
      const yy = oy + 42 - Math.round(7 * Math.sqrt(Math.max(0, 1 - ((x - cx) / 9) ** 2)));
      p.px(x, yy, '#8ac0a8');
    }
    p.line(cx - 9, oy + 40, ox + 2, oy + 30, '#4a8a6a');
    p.line(cx + 9, oy + 40, ox + 62, oy + 30, '#4a8a6a');
    if (gear.includes('ambu')) {
      p.ellipse(cx + 2, oy + 60, 7, 9, '#e8b931');
      p.rect(cx - 2, oy + 48, 6, 4, '#e8b931');
    }
  }
  void lit;
}

// -----------------------------------------------------------------------------
// Corpo em close: peito, mãos, pernas, ferimento
// -----------------------------------------------------------------------------
function mats(F: Fig, L: Look) {
  return {
    skin: F.mat('skin', L.skin),
    top: F.mat(L.top === L.skin ? 'skin' : 'cloth', L.top),
    top2: F.mat('cloth', L.top2),
    bottom: F.mat(L.bottom === L.skin ? 'skin' : 'cloth', L.bottom),
    hair: F.mat('hair', L.hair),
  };
}

function finish(F: Fig, bg: Pix, st: Stage, wx: number, wy: number): Pix {
  innerLines(F);
  F.L.despeckle(undefined, 1);
  const fig = compose(F.L, null, { ink: INK, rim: '#e8eef4', rimK: 0.1 });
  applyLight(fig, pointLight(st, wx, wy), 0, 0);
  bg.blit(fig, 0, 0);
  return bg;
}

/** quem faz massagem no paciente (para as mãos no peito) */
function rescuer(st: Stage): Actor | undefined {
  return st.actors.find((a) => a.act === 'rcp');
}

function closeChest(st: Stage, t: number): Pix {
  const P = st.patient!;
  const L = P.look;
  if (L.age === 'bebe') return closeChestBaby(st, t);
  const sg = P.spec.signs ?? [];
  const gear = P.spec.gear ?? [];
  const W = worldPts(st, P);
  const bg = bokeh(st, W.chest[0], W.chest[1]);
  const F = new Fig(CW, CH, 0, 0);
  const M = mats(F, L);
  const dead = sg.includes('rigidez') || sg.includes('livores') || (P.pose === 'deitado' && L.state === 'cinza' && sg.includes('olhos_fechados'));
  const fast = sg.includes('respira_rapido') || sg.includes('tiragem');
  const weak = sg.includes('respira_fraco');
  const cpr = rescuer(st);
  const ph = cpr ? Math.floor(t / cpr.period) % 2 : P.phases > 1 ? Math.floor(t / P.period) % P.phases : 0;
  // respiração: o peito sobe (inspira) e desce
  const insp = dead ? 0 : fast ? ph % 2 : weak ? (ph % 4 === 1 ? 1 : 0) : ph % 4 === 1 || ph % 4 === 2 ? 1 : 0;
  const rise = dead ? 0 : (fast ? 2 : weak ? 0.6 : 1.4) * insp;
  const push = cpr && ph === 1 ? 2 : 0;
  const top = 6 - rise + push;
  const kid = L.age === 'crianca';
  const shW = kid ? 34 : L.sex === 'F' ? 38 : 42;
  // pescoço e queixo (a boca aparece: lábio roxo na cianose)
  capsule(F, [48, -6], [48, top + 6], kid ? 7 : 8, kid ? 7.5 : 9, M.skin, G.NECK, TH_SKIN);
  F.next();
  // queixo: a parte de baixo do rosto entra no alto do quadro
  const chinC: V2 = [48, top - 1];
  ellipseShaded(F, chinC, kid ? 14 : 16, 11, M.skin, G.HEAD, TH_SKIN);
  const lipC = L.state === 'cianose' || L.state === 'cinza' ? '#5c5a9e' : mixLab(L.lip, '#3a1418', 0.25);
  const lipY = Math.round(chinC[1] - 4);
  if (lipY >= 0) {
    for (let x = 44; x <= 52; x++) F.ink(x, lipY, lipC);
    for (let x = 45; x <= 51; x++) F.ink(x, lipY + 1, mixLab(lipC, '#ffffff', 0.15));
  }
  if (L.beard) dots(F, [48, chinC[1] + 4], 11, 4, 18, mixLab(L.skin, L.hair, 0.4), 5);
  if (sg.includes('espuma') || sg.includes('baba')) dots(F, [48, lipY + 2], 5, 2, sg.includes('espuma') ? 10 : 4, '#f4f8fa', 3);
  // ombros e tronco
  const lifted = sg.includes('tiragem') || sg.includes('queimadura') || (gear.includes('eletrodos') && !cpr);
  const shirtEnd = lifted ? top + 26 : 999;
  polyShaded(F, [
    [48 - shW, top + 18],
    [48 - shW + 10, top + 6],
    [48 + shW - 10, top + 6],
    [48 + shW, top + 18],
    [48 + shW + 4, CH + 2],
    [48 - shW - 4, CH + 2],
  ], [0, 1], M.top, G.TORSO, L.top === L.skin ? TH_SKIN : TH_CLOTH, 0.8);
  // braços nas laterais
  for (const sx of [-1, 1]) capsule(F, [48 + sx * (shW - 4), top + 16], [48 + sx * (shW + 2), CH + 6], 7, 6.5, L.sleeve === 'longa' ? M.top : M.skin, sx < 0 ? G.ARML : G.ARMR, TH_SKIN);
  if (L.sleeve === 'curta')
    for (const sx of [-1, 1]) capsule(F, [48 + sx * (shW - 4), top + 16], [48 + sx * (shW - 1), top + 34], 8, 7.5, M.top, sx < 0 ? G.ARML : G.ARMR, TH_CLOTH);
  F.next();
  // decote
  if (L.top !== L.skin) {
    const v = L.sex === 'F' || L.wear === 'pijama';
    for (let i = 0; i <= (v ? 12 : 6); i++) {
      const w = v ? 12 - i : 9 - i * 0.6;
      for (let x = Math.floor(48 - w); x <= Math.ceil(48 + w - 1); x++) F.put(x, top + 5 + i, M.skin, x < 48 ? 2 : 1, G.NECK);
    }
  }
  // camisa levantada: barriga e costelas à mostra (tiragem, queimadura, eletrodos)
  if (lifted) {
    for (let y = Math.floor(shirtEnd); y < CH; y++)
      for (let x = 0; x < CW; x++) {
        if (!F.has(x, y) || F.grpAt(x, y) !== G.TORSO) continue;
        const u = (x + 0.5 - 48) / shW;
        F.put(x, y, M.skin, u < -0.55 ? 3 : u > 0.5 ? 1 : 2, G.TORSO);
      }
    // barra enrolada
    capsule(F, [48 - shW - 2, shirtEnd], [48 + shW + 2, shirtEnd], 3, 3, M.top, G.SKIRT, TH_CLOTH);
    // costelas
    for (let i = 0; i < 4; i++) {
      const y = shirtEnd + 7 + i * 7;
      for (const sx of [-1, 1])
        for (let j = 0; j < 14; j++) {
          const x = 48 + sx * (8 + j * 1.6);
          const yy = y + j * 0.5;
          if (F.has(x, yy) && F.grpAt(x, yy) === G.TORSO) F.shiftTone(x, yy, -1);
        }
    }
    // tiragem: na inspiração a pele entre as costelas e a fúrcula afundam
    if (sg.includes('tiragem') && insp) {
      for (let i = 0; i < 4; i++) {
        const y = shirtEnd + 10 + i * 7;
        for (const sx of [-1, 1])
          for (let j = 0; j < 12; j++) {
            const x = 48 + sx * (9 + j * 1.6);
            const yy = y + j * 0.5;
            if (F.has(x, yy)) F.ink(x, yy, mixLab(L.skin, '#3a1a2a', 0.45));
          }
      }
      // abaixo das costelas
      for (let x = 36; x <= 60; x++) F.ink(x, CH - 4 + Math.round(Math.abs(x - 48) * 0.15), mixLab(L.skin, '#3a1a2a', 0.4));
    }
  }
  if (sg.includes('tiragem') && insp) {
    // fúrcula (acima do esterno) afundando
    for (let x = 44; x <= 52; x++) F.ink(x, top + 3 + Math.round(Math.abs(x - 48) * 0.3), mixLab(L.skin, '#3a1a2a', 0.5));
  }
  F.next();
  // gestante
  if (sg.includes('gravida')) ellipseShaded(F, [52, CH + 4], 30, 20, M.top, G.TORSO, TH_CLOTH);
  // mão no peito
  if (sg.includes('mao_no_peito') && !cpr) {
    capsule(F, [88, CH + 6], [64, top + 34], 7, 6, L.sleeve === 'longa' ? M.top : M.skin, G.ARMR, TH_SKIN);
    ellipseShaded(F, [56, top + 30], 9, 7, M.skin, G.HANDR, TH_SKIN);
    for (let i = 0; i < 4; i++) F.shiftTone(48 + i * 4, top + 28, -1);
  }
  // sangue (tiro/facada) e o ferimento
  const wound = woundOf(P);
  if (sg.includes('sangue_tronco')) {
    const c: V2 = wound.at === 'peito' ? [56, top + 30] : [52, CH - 12];
    stain(F, c, 18, 13, 3);
    trickle(F, [c[0] + 6, c[1] + 10], [0, 1], 10);
    drawWoundMark(F, wound, c, 2.2);
  }
  if (sg.includes('queimadura') && (wound.at === 'peito' || wound.at === 'barriga' || wound.kind !== 'queimadura')) burn(F, L, [44, shirtEnd < 999 ? shirtEnd + 18 : top + 34], 20, 13);
  if (sg.includes('manchas_roxas')) dots(F, [48, top + 4], 9, 6, 8, '#6a1f5a', 3);
  if (sg.includes('placas')) dots(F, [48, top + 2], 10, 6, 6, mixLab(L.skin, '#d84a4a', 0.4), 5);
  if (sg.includes('suor')) dots(F, [48, top + 2], 8, 5, 3, '#e8f6ff', 7);
  if (sg.includes('livores')) dots(F, [48, top + 10], 30, 6, 10, mixLab(L.skin, '#5a2a6a', 0.45), 9);
  if (sg.includes('recem_nascido')) {
    const m = F.mat('cloth', '#e8d8a0');
    ellipseShaded(F, [48, top + 40], 26, 15, m, G.BABY, TH_CLOTH);
    ellipseShaded(F, [30, top + 30], 10, 9, F.mat('skin', mixLab(L.skin, '#e08a8a', 0.2)), G.BABY, TH_SKIN);
  }
  F.next();
  // equipamento
  if (gear.includes('eletrodos'))
    for (const [x, y] of [
      [34, top + 34],
      [62, top + 34],
      [40, top + 54],
      [58, top + 56],
    ] as V2[]) {
      ellipseShaded(F, [x, y], 3, 3, F.mat('cloth', '#e8e8e4'), G.GEAR, TH_CLOTH);
      F.ink(x, y, '#c8a040');
      capsule(F, [x, y], [x + (x < 48 ? -20 : 20), y + 30], 0.6, 0.6, F.mat('cloth', ['#c8352a', '#e8b931', '#3a7a3a', '#2a2a30'][(((Math.round(x + y) % 4) + 4) % 4)]), G.GEAR);
    }
  if (gear.includes('compressa')) {
    const c: V2 = wound.at === 'peito' ? [56, top + 30] : [52, CH - 12];
    ellipseShaded(F, c, 10, 7, F.mat('cloth', '#f2f2ee'), G.GEAR, TH_CLOTH);
    dots(F, c, 5, 3, 4, BLOOD[2], 11);
  }
  if (gear.includes('manta')) polyShaded(F, [[0, top + 44], [CW, top + 40], [CW, CH], [0, CH]], [0, 1], F.mat('cloth', '#d8c070'), G.GEAR, [-0.3, 0.1, 0.5, 0.8], 0.9);
  // mãos de quem faz a massagem: braços esticados, uma mão sobre a outra no meio do peito
  if (cpr) {
    const RL = cpr.look;
    const sk = F.mat('skin', RL.skin);
    const sl = RL.sleeve === 'longa' ? F.mat('cloth', RL.top) : sk;
    const hy = top + 34 + push;
    F.next();
    capsule(F, [18, -10], [40, hy - 6], 8, 6.5, sl, G.ARML, RL.sleeve === 'longa' ? TH_CLOTH : TH_SKIN);
    capsule(F, [78, -10], [56, hy - 6], 8, 6.5, sl, G.ARMR, RL.sleeve === 'longa' ? TH_CLOTH : TH_SKIN);
    if (RL.sleeve === 'curta') {
      capsule(F, [12, -14], [22, -2], 10, 9, F.mat('cloth', RL.top), G.ARML, TH_CLOTH);
      capsule(F, [84, -14], [74, -2], 10, 9, F.mat('cloth', RL.top), G.ARMR, TH_CLOTH);
    }
    F.next();
    // mão de baixo (calcanhar da mão no esterno) e a de cima, dedos entrelaçados
    ellipseShaded(F, [48, hy + 2], 12, 7, sk, G.HANDL, TH_SKIN);
    F.next();
    ellipseShaded(F, [48, hy - 2], 11, 7, sk, G.HANDR, TH_SKIN);
    for (let i = 0; i < 4; i++) {
      const x = 42 + i * 4;
      for (let y = hy - 6; y <= hy + 2; y++) if ((y + i) % 3 !== 0) F.shiftTone(x, y, -1);
    }
    capsule(F, [38, hy - 1], [34, hy + 6], 2.6, 2.2, sk, G.HANDR, TH_SKIN);
  }
  return finish(F, bg, st, W.chest[0], W.chest[1]);
}

// -----------------------------------------------------------------------------
// Bebê: o corpo inteiro é pequeno — o close mostra o tronco todo (queixo à fralda),
// as mãozinhas gordinhas e as perninhas dobradas, sempre com o body e a fralda.
// -----------------------------------------------------------------------------
const SINK = '#3a1a2a';

/** tronco do bebê visto de cima, da bochecha à fralda: respiração, tiragem, body aberto */
function closeChestBaby(st: Stage, t: number): Pix {
  const P = st.patient!;
  const L = P.look;
  const sg = P.spec.signs ?? [];
  const gear = P.spec.gear ?? [];
  const W = worldPts(st, P);
  const bg = bokeh(st, W.chest[0], W.chest[1]);
  const F = new Fig(CW, CH, 0, 0);
  const M = mats(F, L);
  const dead = sg.includes('rigidez') || sg.includes('livores') || (L.state === 'cinza' && sg.includes('olhos_fechados'));
  const fast = sg.includes('respira_rapido') || sg.includes('tiragem');
  const cpr = rescuer(st);
  const ph = cpr ? Math.floor(t / cpr.period) % 2 : P.phases > 1 ? Math.floor(t / P.period) % P.phases : 0;
  const insp = dead ? 0 : fast ? ph % 2 : ph % 4 === 1 || ph % 4 === 2 ? 1 : 0;
  const push = cpr && ph === 1 ? 2 : 0;
  // a barriga sobe na inspiração (o bebê respira com a barriga)
  const bel = (fast ? 2.4 : 1.4) * insp - push;
  // body aberto quando é preciso ver a pele (respiração difícil, manchas, queimadura, eletrodos)
  const open = sg.includes('tiragem') || sg.includes('manchas_roxas') || sg.includes('queimadura') || gear.includes('eletrodos') || !!cpr || fast;
  // bochechas, boca e a dobrinha do queixo no alto do quadro
  ellipseShaded(F, [48, -6], 24, 16, M.skin, G.HEAD, TH_SKIN);
  if (L.state === 'normal' || L.state === 'vermelho') for (const sx of [-1, 1]) dots(F, [48 + sx * 13, 3], 3, 1.5, 5, mixLab(L.skin, '#e86a6a', 0.35), 31 + sx, M.skin);
  const lipC = L.state === 'cianose' || L.state === 'cinza' ? '#5c5a9e' : mixLab(L.lip, '#c84a5a', 0.3);
  for (let x = 46; x <= 50; x++) F.ink(x, 4 + (x === 46 || x === 50 ? -1 : 0), lipC);
  for (let x = 47; x <= 49; x++) F.ink(x, 5, mixLab(lipC, '#ffffff', 0.2));
  for (let x = 40; x <= 56; x++) F.ink(x, 8 + Math.round(((x - 48) * (x - 48)) / 40), mixLab(L.skin, '#3a1418', 0.25));
  if (sg.includes('espuma') || sg.includes('baba')) dots(F, [48, 7], 4, 2, sg.includes('espuma') ? 9 : 4, '#f4f8fa', 3);
  if (sg.includes('vomito')) dots(F, [56, 6], 4, 2, 6, '#c8bc5a', 5);
  F.next();
  // tronco: largo e curto, sem pescoço, barriga redonda maior que o peito
  const body: V2[] = [
    [24, 11],
    [72, 11],
    [78, 28],
    [75 + bel * 0.6, 48],
    [68, 64],
    [28, 64],
    [21 - bel * 0.6, 48],
    [18, 28],
  ];
  polyShaded(F, body, [0, 1], open ? M.skin : M.top, G.TORSO, open ? TH_SKIN : TH_CLOTH, 0.95);
  ellipseShaded(F, [48, 45 - bel * 0.4], 23 + bel * 0.5, 15 + bel * 0.4, open ? M.skin : M.top, G.TORSO, open ? TH_SKIN : TH_CLOTH);
  F.next();
  if (open) {
    // o body puxado para cima, embolado embaixo do queixo
    capsule(F, [20, 13], [76, 13], 4.5, 4.5, M.top, G.SKIRT, TH_CLOTH);
    // costelas bem finas; mamilos e umbigo
    for (let i = 0; i < 3; i++)
      for (const sx of [-1, 1])
        for (let j = 0; j < 9; j++) {
          const x = 48 + sx * (6 + j * 1.6);
          const y = 23 + i * 6 + j * 0.45;
          if (F.has(x, y) && F.grpAt(x, y) === G.TORSO && (j + i) % 2 === 0) F.shiftTone(x, y, -1);
        }
    for (const sx of [-1, 1]) F.ink(48 + sx * 13, 25, mixLab(L.skin, '#b05a5a', 0.4));
    F.ink(48, 50 - Math.round(bel * 0.4), mixLab(L.skin, '#3a1418', 0.35));
    if (sg.includes('tiragem') && insp) {
      // tiragem: a pele afunda entre as costelas, embaixo delas (subcostal) e acima do esterno
      for (let i = 0; i < 3; i++)
        for (const sx of [-1, 1])
          for (let j = 0; j < 8; j++) {
            const x = 48 + sx * (7 + j * 1.6);
            const y = 26 + i * 6 + j * 0.45;
            if (F.has(x, y)) F.ink(x, y, mixLab(L.skin, SINK, 0.45));
          }
      for (let x = 30; x <= 66; x++) {
        const y = 39 - Math.round(Math.abs(x - 48) * 0.28);
        F.ink(x, y, mixLab(L.skin, SINK, 0.5));
        F.ink(x, y + 1, mixLab(L.skin, SINK, 0.25));
      }
      for (let x = 44; x <= 52; x++) F.ink(x, 17 + Math.round(Math.abs(x - 48) * 0.3), mixLab(L.skin, SINK, 0.5));
    }
  } else {
    // body fechado: gola envelope, um desenhinho no peito e os botões de pressão
    for (const sx of [-1, 1]) capsule(F, [48 + sx * 6, 11], [48 + sx * 18, 14], 2.2, 2, F.mat('cloth', mixLab(L.top, '#ffffff', 0.35)), G.SKIRT, TH_CLOTH);
    const art = mixLab(L.top, '#3a5a9a', 0.45);
    for (const [dx, dy] of [[0, 0], [-1, 1], [1, 1], [0, 2], [-2, 0], [2, 0]] as V2[]) F.ink(48 + dx, 26 + dy, art);
    for (const y of [40, 50]) F.ink(48, y, mixLab(L.top, '#ffffff', 0.5));
  }
  F.next();
  // braços dobrados, os punhos fechados perto do peito (o jeito de bebê deitado)
  const flail = !dead && ph % 4 === 3 ? 1 : 0;
  for (const sx of [-1, 1]) {
    const sh: V2 = [48 + sx * 23, 17];
    const el: V2 = [48 + sx * 35, 40 - flail];
    const hd: V2 = [48 + sx * 29, 25 - flail * 2];
    const sleeveM = L.sleeve === 'longa' && !open ? M.top : M.skin;
    capsule(F, sh, el, 7, 6.5, sleeveM, sx < 0 ? G.ARML : G.ARMR, sleeveM === M.skin ? TH_SKIN : TH_CLOTH);
    if (L.sleeve !== 'longa' || open) capsule(F, sh, lerp(sh, el, 0.35), 7.6, 7.2, M.top, sx < 0 ? G.ARML : G.ARMR, TH_CLOTH);
    capsule(F, el, hd, 6, 5.4, sleeveM, sx < 0 ? G.ARML : G.ARMR, sleeveM === M.skin ? TH_SKIN : TH_CLOTH);
    F.next();
    ellipseShaded(F, hd, 5.4, 5, M.skin, sx < 0 ? G.HANDL : G.HANDR, TH_SKIN);
    // dedinhos dobrados (punho) e a dobrinha do punho
    for (let i = -2; i <= 2; i++) F.shiftTone(hd[0] + i * 1.6, hd[1] - 2, -1);
    for (let i = -3; i <= 3; i++) F.shiftTone(hd[0] + i, hd[1] + 5, -1);
    F.next();
  }
  // fralda embaixo
  polyShaded(F, [[24, 63], [72, 63], [70, CH + 2], [26, CH + 2]], [0, 1], F.mat('cloth', '#f2f0ea'), G.SKIRT, TH_CLOTH, 0.8);
  for (const sx of [-1, 1]) {
    F.ink(48 + sx * 20, 66, '#8ac8e8');
    F.ink(48 + sx * 20, 67, '#8ac8e8');
  }
  F.next();
  // sinais
  if (sg.includes('manchas_roxas')) dots(F, [48, 40], 22, 20, 16, '#6a1f5a', 3, M.skin);
  if (sg.includes('placas')) dots(F, [48, 36], 22, 18, 7, mixLab(L.skin, '#d84a4a', 0.4), 5, M.skin);
  if (sg.includes('livores')) dots(F, [48, 50], 26, 10, 12, mixLab(L.skin, '#5a2a6a', 0.45), 9, M.skin);
  if (sg.includes('queimadura')) burn(F, L, [42, 40], 16, 12);
  if (sg.includes('suor')) dots(F, [48, -2], 14, 4, 4, '#e8f6ff', 7);
  // equipamento
  if (gear.includes('eletrodos'))
    for (const [x, y] of [
      [32, 22],
      [64, 22],
      [56, 50],
    ] as V2[]) {
      ellipseShaded(F, [x, y], 2.6, 2.6, F.mat('cloth', '#e8e8e4'), G.GEAR, TH_CLOTH);
      F.ink(x, y, '#c8a040');
    }
  if (gear.includes('mascara_o2') || gear.includes('ambu')) ellipseShaded(F, [48, 0], 11, 8, F.mat('cloth', '#d8eef4'), G.GEAR, TH_CLOTH);
  if (gear.includes('manta')) polyShaded(F, [[0, 56], [CW, 52], [CW, CH], [0, CH]], [0, 1], F.mat('cloth', '#d8c070'), G.GEAR, [-0.3, 0.1, 0.5, 0.8], 0.9);
  // massagem no bebê: as duas mãos do adulto abraçam o peito, os polegares no meio do esterno
  if (cpr) {
    const RL = cpr.look;
    const sk = F.mat('skin', RL.skin);
    F.next();
    for (const sx of [-1, 1]) {
      ellipseShaded(F, [48 + sx * 26, 32 + push], 11, 13, sk, sx < 0 ? G.HANDL : G.HANDR, TH_SKIN);
      capsule(F, [48 + sx * 18, 30 + push], [48 + sx * 3, 28 + push], 3.2, 2.8, sk, sx < 0 ? G.HANDL : G.HANDR, TH_SKIN);
    }
  }
  return finish(F, bg, st, W.chest[0], W.chest[1]);
}

/** mãozinhas de bebê: dedos curtos e gordinhos, dobrinha no punho */
function closeHandsBaby(st: Stage, t: number): Pix {
  const P = st.patient!;
  const L = P.look;
  const sg = P.spec.signs ?? [];
  const W = worldPts(st, P);
  const hc: V2 = [(W.handL[0] + W.handR[0]) / 2, (W.handL[1] + W.handR[1]) / 2];
  const bg = bokeh(st, hc[0], hc[1]);
  const F = new Fig(CW, CH, 0, 0);
  const M = mats(F, L);
  const ph = P.phases > 1 ? Math.floor(t / P.period) % P.phases : 0;
  const jit = sg.includes('tremor') || P.pose === 'convulsao' ? (ph % 2 ? 1 : -1) : 0;
  const blue = L.state === 'cianose' || L.state === 'cinza';
  const tip = blue ? mixLab(L.skin, '#5a5ab0', 0.45) : mixLab(L.skin, '#e89090', 0.3);
  // a barriga (body) atrás das mãos
  polyShaded(F, [[6, 34], [90, 34], [96, CH], [0, CH]], [0, 1], M.top, G.TORSO, TH_CLOTH, 0.7);
  F.next();
  for (const sx of [-1, 1]) {
    const c: V2 = [48 + sx * 20 + jit * sx, 30];
    const sleeveM = L.sleeve === 'longa' ? M.top : M.skin;
    capsule(F, [48 + sx * 30, CH + 6], [c[0] + sx * 2, c[1] + 10], 10, 9, sleeveM, sx < 0 ? G.ARML : G.ARMR, sleeveM === M.skin ? TH_SKIN : TH_CLOTH);
    F.next();
    // dobrinhas do punho (pulseirinha de gordura)
    for (const dy of [12, 16]) for (let i = -7; i <= 7; i++) if (F.has(c[0] + i, c[1] + dy)) F.shiftTone(c[0] + i, c[1] + dy, -1);
    ellipseShaded(F, c, 10, 9, M.skin, sx < 0 ? G.HANDL : G.HANDR, TH_SKIN);
    // dedos curtos e grossos
    for (const [fx, fl] of [
      [-6, 6],
      [-2, 7.5],
      [2.5, 7],
      [6.5, 5.5],
    ] as [number, number][]) {
      const a: V2 = [c[0] + fx * sx, c[1] - 5];
      const b: V2 = [c[0] + fx * sx * 1.05, c[1] - 5 - fl];
      capsule(F, a, b, 2.7, 2.5, M.skin, sx < 0 ? G.HANDL : G.HANDR, TH_SKIN);
      F.ink(b[0], b[1] - 1.5, tip);
    }
    capsule(F, [c[0] - sx * 8, c[1] + 2], [c[0] - sx * 13, c[1] - 3], 3.2, 2.8, M.skin, sx < 0 ? G.HANDL : G.HANDR, TH_SKIN);
    // covinhas dos nós
    for (const fx of [-6, -2, 2.5, 6.5]) F.ink(c[0] + fx * sx, c[1] - 3, mixLab(L.skin, '#3a1418', 0.2));
    F.next();
  }
  if (sg.includes('manchas_roxas')) dots(F, [48, 40], 34, 14, 12, '#6a1f5a', 21, M.skin);
  if (sg.includes('livores') || L.state === 'cinza') dots(F, [48, 46], 34, 10, 14, mixLab(L.skin, '#5a4a7a', 0.35), 23, M.skin);
  if (sg.includes('queimadura') && (P.spec.wound?.at === 'mao' || P.spec.wound?.at === 'braco')) burn(F, L, [68, 36], 9, 7);
  if ((P.spec.gear ?? []).includes('oximetro')) {
    ellipseShaded(F, [70, 18], 4, 3, F.mat('cloth', '#3a6ab0'), G.GEAR, TH_CLOTH);
    F.ink(70, 17, '#ff6a5a');
  }
  return finish(F, bg, st, hc[0], hc[1]);
}

/** perninhas de bebê dobradas (de sapo), com a fralda e os pezinhos */
function closeLegsBaby(st: Stage, t: number): Pix {
  const P = st.patient!;
  const L = P.look;
  const sg = P.spec.signs ?? [];
  const W = worldPts(st, P);
  const lc: V2 = [(W.kneeL[0] + W.kneeR[0]) / 2, (W.kneeL[1] + W.kneeR[1]) / 2];
  const bg = bokeh(st, lc[0], lc[1]);
  const F = new Fig(CW, CH, 0, 0);
  const M = mats(F, L);
  const ph = P.phases > 1 ? Math.floor(t / P.period) % P.phases : 0;
  const kick = P.pose === 'convulsao' ? (ph % 2 ? 2 : -2) : ph % 4 === 1 ? 1 : 0;
  const blue = L.state === 'cianose' || L.state === 'cinza';
  const legs: { hip: V2; knee: V2; ankle: V2 }[] = [];
  for (const sx of [-1, 1]) {
    const hip: V2 = [48 + sx * 12, 12];
    const knee: V2 = [48 + sx * 36, 36 + (sx > 0 ? kick : -kick)];
    const ankle: V2 = [48 + sx * 16, 56];
    const g = sx < 0 ? G.LEGL : G.LEGR;
    capsule(F, hip, knee, 11, 9.5, M.skin, g, TH_SKIN);
    capsule(F, knee, ankle, 9, 7, M.skin, g, TH_SKIN);
    // dobrinhas das coxas
    for (const tt of [0.4, 0.62]) {
      const c = lerp(hip, knee, tt);
      for (let i = -5; i <= 5; i++) if (F.has(c[0] + i * 0.5, c[1] + i)) F.shiftTone(c[0] + i * 0.5, c[1] + i, -1);
    }
    F.next();
    // pezinho com os dedinhos para a câmera
    const foot: V2 = [ankle[0] - sx * 6, ankle[1] + 7];
    ellipseShaded(F, foot, 8, 6, M.skin, sx < 0 ? G.SHOEL : G.SHOER, TH_SKIN);
    for (let i = 0; i < 5; i++) {
      const tx = foot[0] - sx * (6 - i * 2.6);
      F.ink(tx, foot[1] + 5, blue ? mixLab(L.skin, '#5a5ab0', 0.4) : mixLab(L.skin, '#e89090', 0.25));
      F.shiftTone(tx, foot[1] + 4, -1);
    }
    F.next();
    legs.push({ hip, knee, ankle });
  }
  // fralda (e o body por cima, abotoado entre as pernas)
  const fr = F.mat('cloth', '#f2f0ea');
  polyShaded(F, [[22, -2], [74, -2], [70, 18], [58, 26], [38, 26], [26, 18]], [0, 1], fr, G.SKIRT, TH_CLOTH, 0.9);
  polyShaded(F, [[24, -2], [72, -2], [68, 10], [56, 18], [40, 18], [28, 10]], [0, 1], M.top, G.SKIRT, TH_CLOTH, 0.9);
  F.ink(48, 16, mixLab(L.top, '#ffffff', 0.5));
  F.next();
  if (sg.includes('manchas_roxas')) for (const l of legs) dots(F, lerp(l.hip, l.knee, 0.6), 9, 12, 16, '#6a1f5a', 11, M.skin);
  if (sg.includes('livores')) for (const l of legs) dots(F, lerp(l.knee, l.ankle, 0.4), 8, 10, 14, mixLab(L.skin, '#5a2a6a', 0.5), 13, M.skin);
  if (P.spec.wound?.kind === 'picada' && (P.spec.wound.at === 'pe' || P.spec.wound.at === 'perna')) {
    const c = lerp(legs[1].knee, legs[1].ankle, P.spec.wound.at === 'pe' ? 0.95 : 0.4);
    ellipseShaded(F, c, 4, 3, F.mat('skin', mixLab(L.skin, '#d84a4a', 0.4)), G.GEAR, TH_SKIN);
    F.ink(c[0], c[1], '#5a1418');
  }
  if (sg.includes('queimadura') && (P.spec.wound?.at === 'perna' || P.spec.wound?.at === 'pe')) burn(F, L, lerp(legs[1].knee, legs[1].ankle, 0.5), 8, 8);
  void t;
  return finish(F, bg, st, lc[0], lc[1]);
}

function woundOf(P: Actor): VideoWound {
  if (P.spec.wound) return P.spec.wound;
  const sg = P.spec.signs ?? [];
  if (sg.includes('sangue_cabeca')) return { kind: 'corte', at: 'cabeca' };
  if (sg.includes('sangue_rosto')) return { kind: 'corte', at: 'rosto' };
  if (sg.includes('sangue_tronco')) return { kind: 'facada', at: 'barriga' };
  if (sg.includes('deformidade_perna') && sg.includes('sangue_perna')) return { kind: 'exposta', at: 'perna' };
  if (sg.includes('sangue_perna')) return { kind: 'corte', at: 'perna' };
  if (sg.includes('sangue_braco')) return { kind: 'corte', at: 'braco' };
  if (sg.includes('queimadura')) return { kind: 'queimadura', at: 'braco' };
  if (sg.includes('deformidade_perna')) return { kind: 'fratura', at: 'perna' };
  if (sg.includes('deformidade_braco')) return { kind: 'fratura', at: 'braco' };
  if (sg.includes('hematomas')) return { kind: 'inchaco', at: 'braco' };
  return { kind: 'ralado', at: 'braco' };
}

/** marca do ferimento sobre a mancha: furo (tiro), corte (faca), osso (exposta) */
function drawWoundMark(F: Fig, w: VideoWound, c: V2, s: number): void {
  if (w.kind === 'tiro') {
    F.ink(c[0], c[1], '#2a0608');
    F.ink(c[0] + 1, c[1], '#2a0608');
    F.ink(c[0], c[1] + 1, '#2a0608');
    F.ink(c[0] + 1, c[1] + 1, '#4a0a10');
    F.ink(c[0] - 1, c[1] - 1, BLOOD[3]);
  } else if (w.kind === 'facada' || w.kind === 'corte') {
    for (let i = -3; i <= 3; i++) {
      F.ink(c[0] + i * s * 0.6, c[1] + i * 0.4, '#2a0608');
      F.ink(c[0] + i * s * 0.6, c[1] + i * 0.4 - 1, BLOOD[3]);
    }
  }
}

function burn(F: Fig, L: Look, c: V2, rx: number, ry: number): void {
  const raw = F.mat('skin', mixLab(L.skin, '#d8564a', 0.6));
  for (let y = Math.floor(c[1] - ry); y <= Math.ceil(c[1] + ry); y++)
    for (let x = Math.floor(c[0] - rx); x <= Math.ceil(c[0] + rx); x++) {
      const d = ((x + 0.5 - c[0]) / rx) ** 2 + ((y + 0.5 - c[1]) / ry) ** 2;
      if (d > 1 - hash2(x, y, 3) * 0.25 || !F.has(x, y)) continue;
      F.put(x, y, raw, d < 0.35 ? 3 : d < 0.7 ? 2 : 1, 98);
    }
  // bolhas (algumas estouradas)
  const r = mulberry(17);
  for (let i = 0; i < 7; i++) {
    const x = c[0] + (r() - 0.5) * rx * 1.4;
    const y = c[1] + (r() - 0.5) * ry * 1.2;
    if (!F.has(x, y)) continue;
    const bm = F.mat('skin', '#f2dcc8');
    ellipseShaded(F, [x, y], 2.4 + r() * 1.5, 1.8 + r(), bm, 97, TH_SKIN);
    if (r() < 0.4) F.ink(x, y, '#c84a3a');
  }
}

function closeHands(st: Stage, t: number): Pix {
  const P = st.patient!;
  const L = P.look;
  if (L.age === 'bebe') return closeHandsBaby(st, t);
  const sg = P.spec.signs ?? [];
  const gear = P.spec.gear ?? [];
  const W = worldPts(st, P);
  const lying = isLyingPose(P.pose);
  const hc: V2 = [(W.handL[0] + W.handR[0]) / 2, (W.handL[1] + W.handR[1]) / 2];
  const bg = bokeh(st, hc[0], hc[1]);
  const F = new Fig(CW, CH, 0, 0);
  const M = mats(F, L);
  // sentado: o colo (calça) atrás das mãos
  if (!lying) polyShaded(F, [[0, 30], [CW, 30], [CW, CH], [0, CH]], [1, 0], M.bottom, G.SKIRT, TH_CLOTH, 0.6);
  F.next();
  const ph = P.phases > 1 ? Math.floor(t / P.period) % P.phases : 0;
  const jit = sg.includes('tremor') || sg.includes('agitado') || P.pose === 'convulsao' ? (ph % 2 ? 1 : -1) : 0;
  const blue = L.state === 'cianose' || L.state === 'cinza';
  const nail = blue ? '#7a7ab8' : L.state === 'palido' ? '#e8dcd8' : mixLab(L.skin, '#e89090', 0.35);
  const sleeve = L.sleeve === 'longa' ? M.top : M.skin;
  for (const [i, sx] of [
    [0, -1],
    [1, 1],
  ] as [number, number][]) {
    const wx = 48 + sx * 18 + jit * (i ? 1 : -1);
    const wy = 40;
    // antebraço vindo de baixo
    capsule(F, [48 + sx * 34, CH + 8], [wx, wy + 6], 9, 8, sleeve, i ? G.ARMR : G.ARML, L.sleeve === 'longa' ? TH_CLOTH : TH_SKIN);
    if (L.sleeve === 'longa') capsule(F, [48 + sx * 26, CH - 8], [wx, wy + 6], 1, 1, sleeve, i ? G.ARMR : G.ARML);
    F.next();
    hand(F, [wx, wy], sx, M.skin, nail, i ? G.HANDR : G.HANDL, L.age === 'crianca' ? 0.78 : 1);
    F.next();
  }
  // sinais e equipamento
  const wound = woundOf(P);
  if (sg.includes('sangue_braco') || (wound.at === 'mao' && wound.kind !== 'queimadura')) {
    stain(F, [64, 46], 9, 7, 5);
    trickle(F, [66, 52], [0, 1], 8);
  }
  if (sg.includes('queimadura') && (wound.at === 'mao' || wound.at === 'braco')) burn(F, L, [66, 50], 12, 9);
  if (sg.includes('manchas_roxas')) dots(F, [48, 52], 34, 14, 14, '#6a1f5a', 21, M.skin);
  if (sg.includes('livores') || L.state === 'cinza') dots(F, [48, 58], 34, 10, 16, mixLab(L.skin, '#5a4a7a', 0.35), 23, M.skin);
  if (sg.includes('suor')) dots(F, [48, 40], 30, 10, 5, '#e8f6ff', 25, M.skin);
  if (gear.includes('soro')) {
    // acesso no antebraço esquerdo: esparadrapo e equipo
    const c: V2 = [26, 56];
    F.ink(c[0], c[1], '#e8e8e4');
    for (let x = -4; x <= 4; x++) for (let y = -2; y <= 2; y++) F.ink(c[0] + x, c[1] + y, (x + y) % 3 ? '#f2f2ee' : '#e0e0dc');
    capsule(F, [c[0] + 4, c[1]], [c[0] + 20, -4], 0.6, 0.6, F.mat('cloth', '#d8eef4'), G.GEAR);
  }
  if (gear.includes('oximetro')) {
    ellipseShaded(F, [66, 22], 4, 3, F.mat('cloth', '#3a6ab0'), G.GEAR, TH_CLOTH);
    F.ink(66, 21, '#ff6a5a');
  }
  if ((st.scene.props ?? []).includes('glicosimetro')) {
    // ponta do dedo com uma gota de sangue e o aparelho
    F.ink(30, 18, BLOOD[2]);
    F.ink(30, 17, BLOOD[3]);
  }
  return finish(F, bg, st, hc[0], hc[1]);
}

/** mão vista de cima: dorso, quatro dedos e polegar */
function hand(F: Fig, c: V2, sx: number, skin: number, nail: string, grp: number, z = 1): void {
  ellipseShaded(F, c, 9 * z, 7.5 * z, skin, grp, TH_SKIN);
  const fingers: [number, number][] = [
    [-6, 9],
    [-2, 11],
    [2.5, 10.5],
    [6.5, 8],
  ];
  // criança: dedos mais curtos para a palma
  const fz = z < 1 ? z * 0.85 : 1;
  for (const [fx, fl] of fingers) {
    const a: V2 = [c[0] + fx * sx * z, c[1] - 4 * z];
    const b: V2 = [c[0] + fx * sx * 1.1 * z, c[1] - 4 * z - fl * fz];
    capsule(F, a, b, 2.2 * Math.max(0.85, z), 1.9 * Math.max(0.85, z), skin, grp, TH_SKIN);
    F.ink(b[0], b[1] - 1, nail);
    F.ink(b[0] + (sx > 0 ? -1 : 0), b[1] - 1, nail);
  }
  // polegar para dentro
  capsule(F, [c[0] - sx * 7 * z, c[1] + 1], [c[0] - sx * 13 * z, c[1] - 6 * z], 2.6 * Math.max(0.85, z), 2.2 * Math.max(0.85, z), skin, grp, TH_SKIN);
  // nós dos dedos
  for (const fx of [-6, -2, 2.5, 6.5]) F.shiftTone(c[0] + fx * sx * z, c[1] - 3 * z, -1);
}

function closeLegs(st: Stage, t: number): Pix {
  const P = st.patient!;
  const L = P.look;
  if (L.age === 'bebe') return closeLegsBaby(st, t);
  const sg = P.spec.signs ?? [];
  const gear = P.spec.gear ?? [];
  const W = worldPts(st, P);
  const lc: V2 = [(W.kneeL[0] + W.kneeR[0]) / 2, (W.kneeL[1] + W.kneeR[1]) / 2];
  const bg = bokeh(st, lc[0], lc[1] + 4);
  const F = new Fig(CW, CH, 0, 0);
  const M = mats(F, L);
  void t;
  const needSkin = sg.includes('manchas_roxas') || sg.includes('livores') || sg.includes('deformidade_perna') || sg.includes('inchaco_pernas') || (P.spec.wound && ['perna', 'joelho', 'pe'].includes(P.spec.wound.at));
  // calça arregaçada quando é preciso ver a pele
  const legs = L.legs === 'calca' && needSkin ? 'bermuda' : L.legs;
  const kid = L.age === 'crianca';
  const r0 = kid ? 9 : 11;
  const r1 = kid ? 6 : 7.5;
  const def = sg.includes('deformidade_perna');
  // fêmur (perna encurtada e virada para fora): fratura fechada da perna — dita pela ferida ou pela deformidade sem sangue
  const fem = (P.spec.wound?.at === 'perna' && P.spec.wound.kind === 'fratura') || (def && !sg.includes('sangue_perna') && P.spec.wound?.kind !== 'exposta');
  // pernas de cima (quadril) para baixo (pés)
  const hipY = -6;
  const kneeY = 30;
  const footY = CH + 2;
  const leg = (sx: number, grp: number, bent: boolean) => {
    const hip: V2 = [48 + sx * 14, hipY];
    const knee: V2 = [48 + sx * 16, kneeY];
    let ankle: V2 = [48 + sx * 17, footY - 8];
    if (bent && fem) {
      // fêmur: perna mais curta e virada para fora
      ankle = [48 + sx * 26, footY - 14];
    } else if (bent) {
      // canela torta
      ankle = [48 + sx * 30, footY - 6];
    }
    const thighM = legs === 'shorts' || legs === 'fralda' || legs === 'saia' ? M.skin : M.bottom;
    capsule(F, hip, knee, r0, r1 + 1, thighM, grp, thighM === M.skin ? TH_SKIN : TH_CLOTH);
    const shinM = legs === 'calca' || legs === 'saia_longa' ? M.bottom : M.skin;
    const mid: V2 = bent && !fem ? [48 + sx * 20, (kneeY + footY) / 2] : lerp(knee, ankle, 0.5);
    capsule(F, knee, mid, r1 + 1, r1, shinM, grp, shinM === M.skin ? TH_SKIN : TH_CLOTH);
    capsule(F, mid, ankle, r1, r1 - 1.5, shinM, grp, shinM === M.skin ? TH_SKIN : TH_CLOTH);
    if (legs === 'bermuda') capsule(F, knee, lerp(knee, mid, 0.25), r1 + 2, r1 + 1.5, M.bottom, grp, TH_CLOTH);
    // pé
    const foot: V2 = bent ? [ankle[0] + sx * 10, ankle[1] + 2] : [ankle[0] + sx * 1, ankle[1] + 6];
    capsule(F, ankle, foot, r1 - 1.5, r1 - 2.5, L.shoes && !L.chinelo ? F.mat('cloth', L.shoes) : M.skin, grp, TH_CLOTH);
    F.next();
    return { hip, knee, mid, ankle };
  };
  const a = leg(-1, G.LEGL, false);
  const b = leg(1, G.LEGR, def);
  if (legs === 'saia' || L.dress) polyShaded(F, [[20, hipY], [76, hipY], [80, kneeY - 2], [16, kneeY - 2]], [0, 1], M.bottom, G.SKIRT, TH_CLOTH, 0.7);
  // sinais
  if (def) dots(F, b.mid, 6, 6, 10, mixLab(L.skin, '#6a3a7a', 0.45), 3, M.skin);
  if (sg.includes('sangue_perna')) {
    const c: V2 = P.spec.wound?.at === 'pe' ? b.ankle : P.spec.wound?.at === 'joelho' ? b.knee : def ? b.mid : lerp(b.hip, b.knee, 0.6);
    stain(F, c, 10, 9, 7);
    trickle(F, [c[0] - 2, c[1] + 8], [0, 1], 12);
    if (P.spec.wound?.kind === 'exposta' || (def && !fem)) {
      // ponta de osso aparecendo (sem detalhe sangrento)
      capsule(F, [c[0] - 1, c[1] + 1], [c[0] + 4, c[1] - 6], 1.8, 1.5, F.mat('cloth', '#efe6d4'), G.GEAR, TH_CLOTH);
    }
  }
  if (sg.includes('manchas_roxas')) for (const l of [a, b]) dots(F, l.mid, 7, 14, 16, '#6a1f5a', 11, M.skin);
  if (sg.includes('livores')) for (const l of [a, b]) dots(F, l.mid, 8, 16, 18, mixLab(L.skin, '#5a2a6a', 0.5), 13, M.skin);
  if (sg.includes('queimadura') && (P.spec.wound?.at === 'perna' || P.spec.wound?.at === 'pe')) burn(F, L, b.mid, 9, 10);
  if (gear.includes('torniquete')) capsule(F, [b.hip[0] - 12, b.hip[1] + 10], [b.hip[0] + 12, b.hip[1] + 12], 2.2, 2.2, F.mat('cloth', '#26262c'), G.GEAR);
  if (gear.includes('tala')) capsule(F, [b.knee[0] + 9, b.knee[1] - 10], [b.ankle[0] + 9, b.ankle[1]], 2.4, 2.4, F.mat('cloth', '#e8a33d'), G.GEAR);
  return finish(F, bg, st, lc[0], lc[1]);
}

const lerp = (a: V2, b: V2, t: number): V2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** ferimento: a parte do corpo onde ele está, grande, com o tipo de lesão */
function closeWound(st: Stage, t: number): Pix {
  const P = st.patient!;
  const L = P.look;
  const w = woundOf(P);
  if (w.at === 'peito' || w.at === 'barriga') return closeChest(st, t);
  if (w.at === 'rosto') {
    const p = closeFace(st, t);
    // corte no supercílio em destaque
    const x = 16 + 40;
    const y = 8 + 20;
    for (let i = 0; i < 6; i++) p.px(x + i, y - (i > 3 ? 1 : 0), '#4a0a10');
    for (let i = 0; i < 6; i++) p.px(x + i, y + 1, BLOOD[2]);
    return p;
  }
  const W = worldPts(st, P);
  const anchor: V2 = w.at === 'cabeca' ? W.head : w.at === 'braco' || w.at === 'mao' ? W.handR : W.kneeR;
  const bg = bokeh(st, anchor[0], anchor[1]);
  const F = new Fig(CW, CH, 0, 0);
  const M = mats(F, L);
  const c: V2 = [48, 38];
  if (w.at === 'cabeca') {
    // cabeça de cima: couro cabeludo e cabelo, com o corte
    ellipseShaded(F, [48, 46], 40, 34, M.skin, G.HEAD, TH_SKIN);
    const bald = L.style === 'careca' || L.style === 'raspado' || L.style === 'bebe';
    for (let y = 8; y < CH; y++)
      for (let x = 4; x < 92; x++) {
        if (!F.has(x, y)) continue;
        const dx = (x - 48) / 40;
        const dy = (y - 46) / 34;
        if (dx * dx + dy * dy > 0.98) continue;
        if (bald ? hash2(x, y, 3) < 0.12 : y < 58 - Math.abs(x - 48) * 0.2) {
          const s = Math.sin(x * 0.7 + y * 0.25) > 0.6 ? 1 : 2;
          F.put(x, y, M.hair, bald ? 1 : s + (dx < -0.3 ? 1 : 0), G.HAIR);
        }
      }
    if (w.kind === 'galo') {
      ellipseShaded(F, c, 10, 8, F.mat('skin', mixLab(L.skin, '#8a4a6a', 0.25)), G.GEAR, TH_SKIN);
    } else {
      stain(F, c, 16, 11, 3);
      for (let i = -6; i <= 6; i++) F.ink(c[0] + i, c[1] + Math.round(i * 0.3), '#2a0608');
      trickle(F, [c[0] + 4, c[1] + 8], [0.2, 1], 22);
      trickle(F, [c[0] - 6, c[1] + 6], [0, 1], 16);
    }
  } else if (w.at === 'braco' || w.at === 'mao') {
    // antebraço atravessando o quadro (manga de um lado, mão do outro)
    const sleeve = L.sleeve === 'longa' ? M.top : M.skin;
    capsule(F, [-6, 54], [74, 34], 14, 12, M.skin, G.ARMR, TH_SKIN);
    if (L.sleeve !== 'nenhuma' && L.sleeve !== 'regata') capsule(F, [-10, 56], [8, 51], 16, 15, L.sleeve === 'longa' ? sleeve : M.top, G.TORSO, TH_CLOTH);
    F.next();
    hand(F, [84, 30], 1, M.skin, mixLab(L.skin, '#e89090', 0.35), G.HANDR);
    F.next();
    woundOnLimb(F, L, w, [44, 42]);
  } else {
    // perna (canela/joelho/pé) atravessando o quadro
    const legsM = L.legs === 'calca' || L.legs === 'saia_longa' ? M.bottom : M.skin;
    capsule(F, [-8, 40], [70, 40], 15, 12, M.skin, G.LEGR, TH_SKIN);
    if (legsM !== M.skin) capsule(F, [-12, 40], [10, 40], 17, 16, M.bottom, G.SKIRT, TH_CLOTH);
    // pé
    capsule(F, [70, 40], [90, 26], 11, 9, L.shoes && !L.chinelo ? F.mat('cloth', L.shoes) : M.skin, G.SHOER, TH_CLOTH);
    F.next();
    woundOnLimb(F, L, w, [w.at === 'pe' ? 74 : 40, 40]);
  }
  return finish(F, bg, st, anchor[0], anchor[1]);
}

function woundOnLimb(F: Fig, L: Look, w: VideoWound, c: V2): void {
  switch (w.kind) {
    case 'queimadura':
      burn(F, L, c, 22, 11);
      break;
    case 'exposta':
      stain(F, c, 16, 10, 5);
      capsule(F, [c[0] - 2, c[1] + 2], [c[0] + 8, c[1] - 9], 3.2, 2.6, F.mat('cloth', '#efe6d4'), G.GEAR, TH_CLOTH);
      trickle(F, [c[0] + 3, c[1] + 6], [0, 1], 12);
      break;
    case 'fratura':
    case 'inchaco':
      // inchaço roxo com um "degrau"
      ellipseShaded(F, c, 16, 11, F.mat('skin', mixLab(L.skin, '#6a3a7a', 0.38)), G.GEAR, TH_SKIN);
      dots(F, c, 10, 6, 10, mixLab(L.skin, '#3a1a4a', 0.5), 7);
      break;
    case 'mordida':
      for (let i = 0; i < 9; i++) {
        const a = Math.PI * (0.15 + (i / 8) * 0.7);
        F.ink(c[0] + Math.cos(a) * 12, c[1] - 4 + Math.sin(a) * 7, BLOOD[1]);
        F.ink(c[0] + Math.cos(a) * 12, c[1] + 6 - Math.sin(a) * 7, BLOOD[1]);
      }
      dots(F, c, 10, 6, 6, mixLab(L.skin, '#d84a4a', 0.35), 9);
      break;
    case 'picada':
      ellipseShaded(F, c, 14, 9, F.mat('skin', mixLab(L.skin, '#8a3a6a', 0.3)), G.GEAR, TH_SKIN);
      F.ink(c[0] - 3, c[1], '#2a0608');
      F.ink(c[0] + 3, c[1], '#2a0608');
      trickle(F, [c[0] + 3, c[1] + 1], [0, 1], 5);
      break;
    case 'ralado':
      for (let i = 0; i < 6; i++) for (let j = -10; j <= 10; j++) if (hash2(i, j, 4) < 0.7) F.ink(c[0] + j, c[1] - 5 + i * 2 + j * 0.2, i % 2 ? '#c8504a' : '#e07a6a');
      break;
    case 'tiro':
      stain(F, c, 9, 7, 3);
      drawWoundMark(F, w, c, 2);
      trickle(F, [c[0] + 1, c[1] + 3], [0, 1], 10);
      break;
    default:
      // corte
      stain(F, c, 12, 6, 3);
      for (let i = -9; i <= 9; i++) {
        F.ink(c[0] + i, c[1] + Math.round(i * 0.25), '#2a0608');
        F.ink(c[0] + i, c[1] + Math.round(i * 0.25) - 1, BLOOD[3]);
      }
      trickle(F, [c[0] - 2, c[1] + 4], [0, 1], 12);
  }
}

// -----------------------------------------------------------------------------
// Objeto e chão
// -----------------------------------------------------------------------------
const SMALL: VideoProp[] = ['cartela', 'remedios', 'caneta_insulina', 'glicosimetro', 'produto', 'galao', 'garrafa', 'garrafa_quebrada', 'bombinha', 'faca', 'arma', 'seringa', 'mamadeira', 'celular', 'mochila', 'copo', 'termometro', 'balde', 'bolo', 'fralda', 'pipoca', 'videogame', 'livros', 'sacola'];

function surface(p: Pix, st: Stage): void {
  const s = st.layout.surface;
  if (s === 'chao') return floorTexture(p, st, 22);
  const cols: Record<string, [string, string]> = {
    mesa: ['#8a6440', '#7a5636'],
    criado: ['#7a5a3e', '#6a4c34'],
    balcao: ['#6a4430', '#5a3a28'],
    pia: ['#d8d4cc', '#c8c4bc'],
    banco: ['#8a6a44', '#7a5a3a'],
    painel: ['#2a2a30', '#222228'],
    estante: ['#c8ccd0', '#b8bcc0'],
  };
  const [a, b] = cols[s] ?? cols.mesa;
  p.vgrad(0, 22, CW, CH - 22, [a, b]);
  if (s === 'mesa' || s === 'criado' || s === 'balcao' || s === 'banco') {
    // veios da madeira
    for (let y = 24; y < CH; y += 5) for (let x = 0; x < CW; x++) if (Math.sin(x * 0.15 + y) > 0.85) p.px(x, y + (x % 7 === 0 ? 1 : 0), mix(b, '#000000', 0.18));
    p.hl(0, CW - 1, 22, mix(a, '#ffffff', 0.2));
  }
  if (s === 'mesa' && ['cozinha'].includes(st.place)) {
    // toalha xadrez
    for (let y = 22; y < CH; y++) for (let x = 0; x < CW; x++) if (((x >> 2) + (y >> 2)) % 2 === 0) p.px(x, y, (y >> 2) % 2 ? '#c8352a' : '#e8e4dc');
  }
}

function floorTexture(p: Pix, st: Stage, y0 = 0): void {
  const f = st.layout.floor;
  const [a, b] = st.layout.floorCol;
  p.vgrad(0, y0, CW, CH - y0, [a, b]);
  const r = mulberry(hashStr(st.seed + ':chao'));
  switch (f) {
    case 'piso':
    case 'azulejo':
      for (let y = y0 + 6; y < CH; y += 18) p.hl(0, CW - 1, y, mix(b, '#000000', 0.15));
      for (let x = 10; x < CW; x += 18) p.vl(x, y0, CH - 1, mix(b, '#000000', 0.15));
      if (f === 'azulejo') for (let y = y0; y < CH; y++) for (let x = 0; x < CW; x++) if ((Math.floor((x + 8) / 18) + Math.floor((y - y0 + 12) / 18)) % 2 === 0) p.px(x, y, b);
      break;
    case 'madeira':
      for (let y = y0; y < CH; y += 7) p.hl(0, CW - 1, y, mix(b, '#000000', 0.25));
      for (let i = 0; i < 40; i++) p.hl(Math.floor(r() * CW), Math.floor(r() * CW), y0 + Math.floor(r() * (CH - y0)), mix(a, '#000000', 0.08));
      break;
    case 'vermelhao':
      for (let i = 0; i < 90; i++) p.px(Math.floor(r() * CW), y0 + Math.floor(r() * (CH - y0)), mix(a, '#ffffff', 0.1));
      break;
    case 'asfalto':
      for (let i = 0; i < 380; i++) p.px(Math.floor(r() * CW), y0 + Math.floor(r() * (CH - y0)), r() < 0.5 ? '#62666c' : '#3a3e44');
      break;
    case 'calcada':
    case 'cimento':
      for (let i = 0; i < 200; i++) p.px(Math.floor(r() * CW), y0 + Math.floor(r() * (CH - y0)), r() < 0.5 ? '#c4c0b6' : '#8a867e');
      if (f === 'calcada') for (let y = y0; y < CH; y++) for (let x = 0; x < CW; x++) if (Math.abs(Math.sin(x * 0.08 + Math.sin(y * 0.1) * 1.5) - 0.9) < 0.05) p.px(x, y, '#4a4a50');
      break;
    case 'grama':
      for (let i = 0; i < 300; i++) {
        const x = Math.floor(r() * CW);
        const y = y0 + Math.floor(r() * (CH - y0));
        p.vl(x, y, y + 2, r() < 0.5 ? mix(a, '#ffffff', 0.15) : mix(a, '#000000', 0.2));
      }
      break;
    case 'areia':
      for (let i = 0; i < 300; i++) p.px(Math.floor(r() * CW), y0 + Math.floor(r() * (CH - y0)), r() < 0.5 ? '#f0e4c0' : '#c8b07a');
      break;
    case 'agua':
      for (let i = 0; i < 50; i++) {
        const x = Math.floor(r() * CW);
        const y = y0 + Math.floor(r() * (CH - y0));
        p.hl(x, x + 5 + Math.floor(r() * 8), y, mix(a, '#ffffff', 0.25));
      }
      break;
    case 'terra':
      for (let i = 0; i < 220; i++) p.px(Math.floor(r() * CW), y0 + Math.floor(r() * (CH - y0)), r() < 0.5 ? '#b89a74' : '#7a6040');
      break;
    default:
      for (let i = 0; i < 120; i++) p.px(Math.floor(r() * CW), y0 + Math.floor(r() * (CH - y0)), mix(a, '#000000', 0.1));
  }
}

function closeObject(st: Stage): Pix | null {
  const props = (st.scene.props ?? []).filter((x) => SMALL.includes(x));
  if (!props.length) return null;
  const p = new Pix(CW, CH);
  // parede/fundo desfocado em cima, superfície embaixo
  const P = st.patient;
  const back = bokeh(st, st.layout.env, st.layout.floorY - 12, 0.2);
  p.blit(back, 0, 0);
  surface(p, st);
  const order = props.slice(0, 3);
  const xs = order.length === 1 ? [48] : order.length === 2 ? [32, 66] : [22, 50, 76];
  order.forEach((prop, i) => {
    const big = prop === 'galao' || prop === 'mochila' || prop === 'balde' || prop === 'produto' || prop === 'garrafa';
    const s = propSprite(prop, big ? 3 : 4, prop === 'balde' && (P?.spec.signs ?? []).includes('vomito_sangue') ? 'hda' : undefined);
    if (!s) return;
    p.blit(s.pix, Math.round(xs[i] - s.ax), Math.round(60 - s.ay + (i % 2) * 6));
  });
  applyLight(p, pointLight(st, st.patient?.x ?? 128, st.patient?.y ?? 110), 0, 0);
  return p;
}

function closeFloor(st: Stage): Pix {
  const p = new Pix(CW, CH);
  floorTexture(p, st, 0);
  const sg = st.patient?.spec.signs ?? [];
  const props = st.scene.props ?? [];
  if (sg.includes('sangue_chao')) {
    p.ellipse(50, 40, 34, 16, '#4a0a10');
    p.ellipse(48, 38, 30, 13, '#7a0c12');
    p.ellipse(42, 34, 12, 4, '#a3141c');
    p.px(36, 33, '#d8504a');
  }
  if (sg.includes('vomito') || sg.includes('vomito_sangue')) {
    const c = sg.includes('vomito_sangue') ? '#4a2018' : '#a69a3c';
    p.ellipse(56, 44, 22, 9, c);
    p.ellipse(52, 42, 12, 4, sg.includes('vomito_sangue') ? '#6a3020' : '#c8bc5a');
  }
  if (sg.includes('molhado') || props.includes('agua') || st.layout.floor === 'agua') {
    p.ellipse(48, 40, 40, 18, '#7a9ab0', 0.5);
    for (let i = 0; i < 6; i++) p.hl(20 + i * 10, 26 + i * 10, 34 + (i % 3) * 6, '#c8e0ec');
  }
  const put = (prop: VideoProp, x: number, y: number, k: number, v?: string) => {
    const s = propSprite(prop, k, v);
    if (s) p.blit(s.pix, Math.round(x - s.ax), Math.round(y - s.ay));
  };
  let x = 18;
  for (const pr of props) {
    if (pr === 'ketchup') put('ketchup', 30, 56, 3.5);
    else if (pr === 'boneco') put('boneco', 56, 40, 3);
    else if (pr === 'fio') put('fio', 50, 50, 2.6);
    else if (pr === 'vidro' || pr === 'garrafa_quebrada' || pr === 'cartela' || pr === 'remedios' || pr === 'capacete' || pr === 'vasos' || pr === 'pau' || pr === 'faca') {
      put(pr, x + 8, 62, pr === 'capacete' || pr === 'vasos' ? 2.6 : 3.4);
      x += 30;
    }
  }
  applyLight(p, pointLight(st, st.patient?.x ?? 128, st.patient?.y ?? 110), 0, 0);
  return p;
}

// -----------------------------------------------------------------------------
// Entrada
// -----------------------------------------------------------------------------
export function renderClose(st: Stage, focus: VideoFocus, t: number): Pix | null {
  const P = st.patient;
  const needPt = focus === 'rosto' || focus === 'peito' || focus === 'maos' || focus === 'pernas' || focus === 'ferida';
  if (needPt && !P) return null;
  // quadro de animação que importa para o close
  const cpr = P ? st.actors.find((a) => a.act === 'rcp') : undefined;
  const ph = P ? (cpr && (focus === 'peito' || focus === 'ferida') ? Math.floor(t / cpr.period) % 2 : P.phases > 1 ? Math.floor(t / P.period) % P.phases : 0) : 0;
  const key = st.key + '|' + focus + '|' + ph;
  const hit = cache.get(key);
  if (hit) return hit;
  let out: Pix | null = null;
  switch (focus) {
    case 'rosto':
      out = closeFace(st, t);
      break;
    case 'peito':
      out = closeChest(st, t);
      break;
    case 'maos':
      out = closeHands(st, t);
      break;
    case 'pernas':
      out = closeLegs(st, t);
      break;
    case 'ferida':
      out = closeWound(st, t);
      break;
    case 'objeto':
      out = closeObject(st) ?? closeFloor(st);
      break;
    case 'chao':
      out = closeFloor(st);
      break;
    default:
      out = null;
  }
  if (out) {
    if (cache.size > 40) cache.delete(cache.keys().next().value as string);
    cache.set(key, out);
  }
  return out;
}

void drawFigure;
void dots;
void TH_CLOTH;
void G;
