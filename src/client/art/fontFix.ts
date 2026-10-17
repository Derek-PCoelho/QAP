// =============================================================================
// Conserto de legibilidade das fontes web em texto pequeno — desenhado em pixel
// como o resto da arte. Na Pixelify Sans o "5" é quase um "S", o "Z" e o "2"
// viram "8", o "B" vira "8"; na Jacquard 24 (gótica) o "A" maiúsculo parece um
// "X". Em vez de trocar de fonte, este módulo GERA (em código, sem arquivo) duas
// fontes TrueType minúsculas só com esses glifos redesenhados em bitmap e as
// registra pela FontFace API:
//
//   'QAP Pixelify Fix' → 5 2 Z z B   (mesma grade, altura e avanço da Pixelify)
//   'QAP Jacquard Fix' → A Á À Â Ã    (mesmas métricas da Jacquard 24)
//
// Basta pôr a família de conserto ANTES da original na pilha do CSS: o
// navegador usa o conserto só nos caracteres que ele tem e cai na fonte
// original em todo o resto (fallback por caractere). As métricas verticais são
// as mesmas, então a altura da linha não muda.
//
//   await installFontFixes();   // uma vez, no início (main.tsx)
//   --f-ui:   'QAP Pixelify Fix', 'Pixelify Sans', ui-monospace, monospace;
//   --f-mast: 'QAP Jacquard Fix', 'Jacquard 24', 'Pixelify Sans', serif;
//
// buildBitmapFont() é puro (Node ok); installFontFixes() só age no navegador.
// =============================================================================

export const FONT_FIX_UI = 'QAP Pixelify Fix';
export const FONT_FIX_MAST = 'QAP Jacquard Fix';

export interface BitmapGlyph {
  /** linhas de cima para baixo; '#' = pixel cheio */
  rows: string[];
  /** linha (contada de baixo, 0 = linha de base) onde fica a ÚLTIMA linha do desenho */
  baseRow?: number;
}

export interface BitmapFontSpec {
  family: string;
  /** unidades por em (1000) */
  upm: number;
  ascent: number;
  descent: number;
  /** tamanho de um pixel do desenho, em unidades */
  px: number;
  /** quanto a linha de base do desenho fica abaixo da linha de base da fonte (unidades; Pixelify: 12) */
  sink?: number;
  /** recuo esquerdo e avanço de cada glifo (unidades) */
  lsb: number;
  advance: number;
  /** alarga cada traço horizontalmente (unidades) — versão negrito */
  embolden?: number;
  weight?: number;
  xHeight: number;
  capHeight: number;
  glyphs: Record<string, BitmapGlyph>;
}

// ---- glifos (5×7 maiúsculas/números, 5×5 minúsculas), no espírito da Pixelify
const UI_GLYPHS: Record<string, BitmapGlyph> = {
  // 5 com o canto de cima-esquerda reto e a barriga aberta: nunca um S
  '5': { rows: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'] },
  // 2 com a base reta e a diagonal: nunca um 8
  '2': { rows: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'] },
  // Z de traço diagonal limpo
  Z: { rows: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'] },
  z: { rows: ['#####', '...#.', '..#..', '.#...', '#####'] },
  // B com o lado esquerdo reto e cantos vivos: nunca um 8
  B: { rows: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'] },
};

// ---- "A" gótico legível (textura com a perna direita grossa e a barra marcada)
const A_ROWS = [
  '....####.....',
  '...######....',
  '...##.###....',
  '..##..###....',
  '..##...###...',
  '.##....###...',
  '.#########...',
  '.##.....###..',
  '##......###..',
  '##......###..',
  '##.......###.',
  '###.....#####',
];
const acc = (marks: string[]): BitmapGlyph => ({ rows: [...marks, '.............', ...A_ROWS] });
const MAST_GLYPHS: Record<string, BitmapGlyph> = {
  A: { rows: A_ROWS },
  Á: acc(['.......##....', '......##.....']),
  À: acc(['....##.......', '.....##......']),
  Â: acc(['.....###.....', '....##.##....']),
  Ã: acc(['....###..#...', '...#..###....']),
};

/** Pixelify Sans 400: upm 1000, 920/−280, desenho de 7 px ≈ 92 un., base 12 un. abaixo, lsb 60, avanço 586 */
export const PIXELIFY_FIX_SPEC: BitmapFontSpec = {
  family: FONT_FIX_UI,
  upm: 1000,
  ascent: 920,
  descent: -280,
  px: 92,
  sink: 12,
  lsb: 60,
  advance: 586,
  xHeight: 450,
  capHeight: 700,
  weight: 400,
  glyphs: UI_GLYPHS,
};

/** Jacquard 24 convertida para upm 1000 (1020/−270 em 1290), A de 12 linhas na altura de versal 750/1290 */
export const JACQUARD_FIX_SPEC: BitmapFontSpec = {
  family: FONT_FIX_MAST,
  upm: 1000,
  ascent: Math.round((1020 / 1290) * 1000),
  descent: Math.round((-270 / 1290) * 1000),
  px: Math.round(((750 / 1290) * 1000) / 12),
  sink: 0,
  lsb: Math.round((30 / 1290) * 1000),
  advance: Math.round((840 / 1290) * 1000),
  xHeight: Math.round((510 / 1290) * 1000),
  capHeight: Math.round((750 / 1290) * 1000),
  weight: 400,
  glyphs: MAST_GLYPHS,
};

// -----------------------------------------------------------------------------
// Gerador TrueType mínimo (glyf/loca, cmap formato 4) a partir dos bitmaps
// -----------------------------------------------------------------------------
class Buf {
  b: number[] = [];
  u8(v: number) { this.b.push(v & 255); return this; }
  u16(v: number) { this.u8(v >> 8).u8(v); return this; }
  i16(v: number) { return this.u16(v < 0 ? v + 65536 : v); }
  u32(v: number) { this.u16((v >>> 16) & 0xffff).u16(v & 0xffff); return this; }
  bytes(a: ArrayLike<number>) { for (let i = 0; i < a.length; i++) this.b.push(a[i] & 255); return this; }
  pad4() { while (this.b.length % 4) this.b.push(0); return this; }
  get length() { return this.b.length; }
}

type Contour = [number, number][];

/** contornos (retângulos por corrida horizontal) de um glifo, no sentido horário */
function glyphContours(g: BitmapGlyph, s: BitmapFontSpec): Contour[] {
  const out: Contour[] = [];
  const n = g.rows.length;
  const base = (g.baseRow ?? 0) * s.px - (s.sink ?? 0);
  g.rows.forEach((row, r) => {
    const yBot = base + (n - 1 - r) * s.px;
    const yTop = yBot + s.px;
    let x = 0;
    while (x < row.length) {
      if (row[x] !== '#') {
        x++;
        continue;
      }
      let e = x;
      while (e < row.length && row[e] === '#') e++;
      const x0 = s.lsb + x * s.px;
      const x1 = s.lsb + e * s.px + (s.embolden ?? 0);
      // horário (TrueType): canto inferior-esquerdo → superior-esquerdo → superior-direito → inferior-direito
      out.push([
        [x0, yBot],
        [x0, yTop],
        [x1, yTop],
        [x1, yBot],
      ]);
      x = e;
    }
  });
  return out;
}

function checksum(b: number[]): number {
  let sum = 0;
  for (let i = 0; i < b.length; i += 4) sum = (sum + (((b[i] << 24) | ((b[i + 1] ?? 0) << 16) | ((b[i + 2] ?? 0) << 8) | (b[i + 3] ?? 0)) >>> 0)) >>> 0;
  return sum;
}

function utf16be(s: string): number[] {
  const o: number[] = [];
  for (const ch of s) {
    const c = ch.charCodeAt(0);
    o.push(c >> 8, c & 255);
  }
  return o;
}

/** Monta um arquivo TrueType (ArrayBuffer) com os glifos do spec. Puro. */
export function buildBitmapFont(s: BitmapFontSpec): ArrayBuffer {
  const chars = Object.keys(s.glyphs).sort((a, b) => a.codePointAt(0)! - b.codePointAt(0)!);
  const numGlyphs = chars.length + 1; // 0 = .notdef (vazio)
  // ---- glyf + loca
  const glyf = new Buf();
  const loca: number[] = [0, 0]; // .notdef vazio: começa e termina em 0
  let maxPts = 0;
  let maxCont = 0;
  let gxMin = 0;
  let gyMin = 0;
  let gxMax = 0;
  let gyMax = 0;
  const lsbs: number[] = [0];
  for (const ch of chars) {
    const cs = glyphContours(s.glyphs[ch], s);
    const pts = cs.flat();
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const xMin = Math.min(...xs);
    const yMin = Math.min(...ys);
    const xMax = Math.max(...xs);
    const yMax = Math.max(...ys);
    gxMin = Math.min(gxMin, xMin);
    gyMin = Math.min(gyMin, yMin);
    gxMax = Math.max(gxMax, xMax);
    gyMax = Math.max(gyMax, yMax);
    maxPts = Math.max(maxPts, pts.length);
    maxCont = Math.max(maxCont, cs.length);
    lsbs.push(xMin);
    glyf.i16(cs.length).i16(xMin).i16(yMin).i16(xMax).i16(yMax);
    let end = -1;
    for (const c of cs) glyf.u16((end += c.length));
    glyf.u16(0); // sem instruções
    for (let i = 0; i < pts.length; i++) glyf.u8(0x01); // todos no contorno, coordenadas de 16 bits
    let px = 0;
    for (const [x] of pts) {
      glyf.i16(x - px);
      px = x;
    }
    let py = 0;
    for (const [, y] of pts) {
      glyf.i16(y - py);
      py = y;
    }
    glyf.pad4();
    loca.push(glyf.length);
  }
  const locaB = new Buf();
  for (const o of loca) locaB.u32(o);
  // ---- head
  const head = new Buf()
    .u32(0x00010000)
    .u32(0x00010000)
    .u32(0) // checkSumAdjustment (depois)
    .u32(0x5f0f3cf5)
    .u16(0x000b)
    .u16(s.upm)
    .u32(0).u32(0).u32(0).u32(0) // datas
    .i16(gxMin).i16(gyMin).i16(gxMax).i16(gyMax)
    .u16((s.weight ?? 400) >= 600 ? 1 : 0)
    .u16(8)
    .i16(2)
    .i16(1) // loca longa
    .i16(0);
  // ---- hhea
  const hhea = new Buf()
    .u32(0x00010000)
    .i16(s.ascent).i16(s.descent).i16(0)
    .u16(s.advance)
    .i16(0).i16(0).i16(gxMax)
    .i16(1).i16(0).i16(0)
    .i16(0).i16(0).i16(0).i16(0)
    .i16(0)
    .u16(numGlyphs);
  // ---- maxp 1.0
  const maxp = new Buf().u32(0x00010000).u16(numGlyphs).u16(maxPts).u16(maxCont).u16(0).u16(0).u16(2).u16(0).u16(0).u16(0).u16(0).u16(0).u16(0).u16(0).u16(0);
  // ---- hmtx
  const hmtx = new Buf();
  for (let i = 0; i < numGlyphs; i++) hmtx.u16(i === 0 ? s.advance : s.advance).i16(lsbs[i] ?? 0);
  // ---- cmap (3,1) formato 4: um segmento por caractere + 0xFFFF
  const codes = chars.map((c) => c.codePointAt(0)!);
  const segs = codes.length + 1;
  const sub = new Buf();
  const seg2 = segs * 2;
  const es = Math.floor(Math.log2(segs));
  const sr = 2 * 2 ** es;
  sub.u16(4).u16(16 + segs * 8).u16(0).u16(seg2).u16(sr).u16(es).u16(seg2 - sr);
  for (const c of codes) sub.u16(c);
  sub.u16(0xffff).u16(0);
  for (const c of codes) sub.u16(c);
  sub.u16(0xffff);
  codes.forEach((c, i) => sub.u16((i + 1 - c) & 0xffff)); // idDelta: glifo = código + delta (mód 65536)
  sub.i16(1);
  for (let i = 0; i < segs; i++) sub.u16(0);
  const cmap = new Buf().u16(0).u16(1).u16(3).u16(1).u32(12).bytes(sub.b);
  // ---- OS/2 v4
  const bold = (s.weight ?? 400) >= 600;
  const os2 = new Buf()
    .u16(4)
    .i16(s.advance)
    .u16(s.weight ?? 400)
    .u16(5)
    .u16(0)
    .i16(650).i16(600).i16(0).i16(75).i16(650).i16(600).i16(0).i16(350)
    .i16(50).i16(250)
    .i16(0)
    .bytes([2, 0, 5, 3, 0, 0, 0, 0, 0, 0])
    .u32(1).u32(0).u32(0).u32(0) // Basic Latin
    .bytes([0x51, 0x41, 0x50, 0x20]) // 'QAP '
    .u16(bold ? 0x20 : 0x40)
    .u16(Math.min(...codes)).u16(Math.max(...codes))
    .i16(s.ascent).i16(s.descent).i16(0)
    .u16(s.ascent).u16(-s.descent)
    .u32(1).u32(0)
    .i16(s.xHeight).i16(s.capHeight)
    .u16(0).u16(32).u16(0);
  // ---- name
  const sub2 = bold ? 'Bold' : 'Regular';
  const ps = s.family.replace(/\s+/g, '') + '-' + sub2;
  const recs: [number, string][] = [
    [1, s.family],
    [2, sub2],
    [4, `${s.family} ${sub2}`],
    [6, ps],
  ];
  const strs = recs.map(([, v]) => utf16be(v));
  const name = new Buf().u16(0).u16(recs.length).u16(6 + recs.length * 12);
  let off = 0;
  recs.forEach(([id], i) => {
    name.u16(3).u16(1).u16(0x409).u16(id).u16(strs[i].length).u16(off);
    off += strs[i].length;
  });
  for (const st of strs) name.bytes(st);
  // ---- post 3.0
  const post = new Buf().u32(0x00030000).u32(0).i16(-100).i16(50).u32(0).u32(0).u32(0).u32(0).u32(0);

  const tables: [string, Buf][] = [
    ['OS/2', os2],
    ['cmap', cmap],
    ['glyf', glyf],
    ['head', head],
    ['hhea', hhea],
    ['hmtx', hmtx],
    ['loca', locaB],
    ['maxp', maxp],
    ['name', name],
    ['post', post],
  ];
  const n = tables.length;
  const es2 = Math.floor(Math.log2(n));
  const sr2 = 16 * 2 ** es2;
  const out = new Buf().u32(0x00010000).u16(n).u16(sr2).u16(es2).u16(n * 16 - sr2);
  let offset = 12 + n * 16;
  const datas: number[][] = [];
  for (const [tag, b] of tables) {
    const data = b.b.slice();
    out.bytes([...tag].map((c) => c.charCodeAt(0)));
    out.u32(checksum(data)).u32(offset).u32(data.length);
    while (data.length % 4) data.push(0);
    datas.push(data);
    offset += data.length;
  }
  let headOff = 0;
  let o2 = 12 + n * 16;
  tables.forEach(([tag], i) => {
    if (tag === 'head') headOff = o2;
    o2 += datas[i].length;
  });
  for (const d of datas) out.bytes(d);
  const all = out.b;
  const adj = (0xb1b0afba - checksum(all)) >>> 0;
  all[headOff + 8] = adj >>> 24;
  all[headOff + 9] = (adj >>> 16) & 255;
  all[headOff + 10] = (adj >>> 8) & 255;
  all[headOff + 11] = adj & 255;
  return new Uint8Array(all).buffer;
}

/** faixa unicode (descritor unicodeRange) dos caracteres do spec */
export function unicodeRangeOf(s: BitmapFontSpec): string {
  return Object.keys(s.glyphs)
    .map((c) => 'U+' + c.codePointAt(0)!.toString(16).toUpperCase())
    .join(', ');
}

let installing: Promise<void> | null = null;

/**
 * Registra as fontes de conserto no documento (FontFace API). Idempotente.
 * Pixelify: pesos 400 e 600 (o 600 com traço mais largo); Jacquard: 400.
 * Fora do navegador não faz nada.
 */
export function installFontFixes(): Promise<void> {
  if (installing) return installing;
  const FF = (globalThis as { FontFace?: typeof FontFace }).FontFace;
  const doc = (globalThis as { document?: Document }).document;
  if (!FF || !doc?.fonts) return (installing = Promise.resolve());
  const specs: BitmapFontSpec[] = [
    PIXELIFY_FIX_SPEC,
    { ...PIXELIFY_FIX_SPEC, weight: 600, embolden: 24, lsb: 61, advance: 597 },
    JACQUARD_FIX_SPEC,
  ];
  installing = Promise.all(
    specs.map(async (s) => {
      const face = new FF(s.family, buildBitmapFont(s), { weight: String(s.weight ?? 400), unicodeRange: unicodeRangeOf(s), display: 'block' });
      await face.load();
      doc.fonts.add(face);
    }),
  ).then(() => undefined, (e) => console.warn('[arte] conserto de fontes não carregou', e));
  return installing;
}
