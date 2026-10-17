// Arte 1.1: família nova, crachá com nome, Ozzy brincando, adesivos, fontes de conserto, pele no Desgaste.
import { describe, it, expect } from 'vitest';
import { portraitPix, MOODS, characterName, CHARACTERS } from '../src/client/art/portraits';
import { figurePix } from '../src/client/art/figures';
import { renderEnding } from '../src/client/art/endingArt';
import { renderScene } from '../src/client/art/scenes';
import { renderCityMap } from '../src/client/art/mapRender';
import { ozzyPlayAt, ozzyPlayDuration, OZZY_PLAY_PATHS, dogFramePix, DOG_FRAMES } from '../src/client/art/dog';
import { ozzyStickerPix, OZZY_STICKERS } from '../src/client/art/stickers';
import { buildBitmapFont, PIXELIFY_FIX_SPEC, JACQUARD_FIX_SPEC } from '../src/client/art/fontFix';
import { fitLines, protagonistLabel } from '../src/client/art/names';
import { gradeSkin, hexToRgb, SKIN } from '../src/client/art/palette';

describe('família nova', () => {
  it('retratos da Lúcia, do Alex e do Liam saem nos 7 humores', () => {
    for (const id of ['LUCIA', 'ALEX', 'DAVI'] as const)
      for (const m of MOODS) {
        const p = portraitPix(id, m);
        expect(p.w).toBe(64);
        expect(p.data.some((v) => v >>> 24)).toBe(true);
      }
  });
  it('corpos de cena nas três poses', () => {
    for (const id of ['LUCIA', 'ALEX', 'DAVI'] as const) for (const pose of ['em_pe', 'sentado', 'deitado'] as const) expect(figurePix(id, pose).w).toBeGreaterThan(8);
  });
  it('nomes padrão Thiago/Camille e nome escolhido', () => {
    expect(CHARACTERS.EU_M.name).toBe('Dr. Thiago Moura');
    expect(CHARACTERS.EU_F.name).toBe('Dra. Camille Moura');
    expect(characterName('EU_F', 'Ana')).toBe('Dra. Ana Moura');
    expect(protagonistLabel('M', '  ')).toBe('Dr. Thiago Moura');
  });
});

describe('crachá e Pix próprios', () => {
  it('o nome escolhido muda o crachá desenhado', () => {
    const a = renderEnding('cracha_prego', { time: 0, gender: 'F' });
    const b = renderEnding('cracha_prego', { time: 0, gender: 'F', name: 'Ana' });
    expect(Buffer.from(a.data.buffer).equals(Buffer.from(b.data.buffer))).toBe(false);
  });
  it('nome comprido cabe em 2 linhas de 31 px', () => {
    const l = fitLines(['DRA.', 'Maximiliana', 'José'], 31, 2);
    expect(l.length).toBeLessThanOrEqual(2);
  });
  it('renderScene/renderCityMap/renderEnding devolvem Pix novos', () => {
    const s1 = renderScene({ bg: 'sala', blend: 0, objects: [], time: 0 });
    const s2 = renderScene({ bg: 'cozinha', blend: 0, objects: [], time: 0 });
    expect(s1).not.toBe(s2);
    expect(renderCityMap({ tile: 4, t: 0 })).not.toBe(renderCityMap({ tile: 4, t: 0 }));
    expect(renderEnding('gaveta', { time: 0, gender: 'M' })).not.toBe(renderEnding('gaveta', { time: 0, gender: 'M' }));
  });
});

describe('Ozzy', () => {
  it('quadros novos existem', () => {
    for (const f of ['correndo0', 'correndo1', 'correndo2', 'correndo3', 'latindo0', 'latindo1', 'deitando0']) {
      expect(DOG_FRAMES).toContain(f);
      expect(dogFramePix(f).w).toBeGreaterThan(10);
    }
  });
  it('a brincadeira corre, late, deita e dorme no último ponto', () => {
    const path = OZZY_PLAY_PATHS.sala;
    const dur = ozzyPlayDuration(path);
    const phases = new Set<string>();
    let barked = false;
    for (let t = 0; t <= dur + 2000; t += 40) {
      const f = ozzyPlayAt(t, path);
      phases.add(f.phase);
      barked ||= f.bark;
    }
    expect([...phases]).toEqual(['correndo', 'latindo', 'deitando', 'dormindo']);
    expect(barked).toBe(true);
    const end = ozzyPlayAt(dur + 5000, path);
    expect(end.done).toBe(true);
    expect([end.x, end.y]).toEqual(path[path.length - 1]);
    // a cena aceita a brincadeira
    expect(renderScene({ bg: 'sala', blend: 0.4, objects: [], ozzyPlay: 2500, time: 2500 }).w).toBe(320);
  });
  it('adesivos com borda branca', () => {
    for (const k of OZZY_STICKERS) {
      const p = ozzyStickerPix(k);
      expect(p.w).toBe(30);
      // tem pixel branco de borda
      expect(p.data.some((v) => (v & 0xffffff) === 0xf0faff)).toBe(true);
    }
  });
});

describe('fontes de conserto', () => {
  it('gera TrueType com cabeçalho e tabelas', () => {
    for (const spec of [PIXELIFY_FIX_SPEC, JACQUARD_FIX_SPEC]) {
      const b = new DataView(buildBitmapFont(spec));
      expect(b.getUint32(0)).toBe(0x00010000);
      expect(b.getUint16(4)).toBe(10);
    }
  });
});

describe('pele no Desgaste', () => {
  it('esfria por igual: a ordem de claridade da rampa se mantém em qualquer tom', () => {
    const lum = (h: string) => {
      const [r, g, b] = hexToRgb(h);
      return 0.299 * r + 0.587 * g + 0.114 * b;
    };
    for (const base of SKIN) {
      const [r, g, b] = hexToRgb(base);
      const ramp = [0.6, 0.75, 0.9, 1, 1.1].map((k) => `#${[r, g, b].map((c) => Math.min(255, Math.round(c * k)).toString(16).padStart(2, '0')).join('')}`);
      const out = ramp.map((h) => lum(gradeSkin(h, 0.8)));
      for (let i = 1; i < out.length; i++) expect(out[i]).toBeGreaterThanOrEqual(out[i - 1]);
      // e perde cor (mais perto do cinza)
      const [r2, g2, b2] = hexToRgb(gradeSkin(base, 1));
      expect(Math.max(r2, g2, b2) - Math.min(r2, g2, b2)).toBeLessThan(Math.max(r, g, b) - Math.min(r, g, b));
    }
  });
});
