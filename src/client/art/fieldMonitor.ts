// Monitor da Intervenção: o traçado do ECG em pixel art, por ritmo.
// Na parada o monitor não escreve o nome do ritmo: quem lê o traçado é o jogador.
//   FV          ondas caóticas, sem complexos, amplitude que varia
//   TV sem pulso complexos largos, rápidos (~180/min) e regulares, "serrote"
//   assistolia   linha quase reta (só a oscilação da linha de base)
//   AESP         complexos organizados, estreitos e lentos, sem pulso
//   sinusal      P-QRS-T normal na frequência medida
import type { Rhythm } from '../../engine/field';

export type EcgRhythm = Rhythm | 'off';

/** altura (y, em pixels, 0 = topo) do traçado no instante tt (ms); base = linha de base */
export function ecgY(r: EcgRhythm, tt: number, fc: number, h = 30): number {
  const base = Math.round(h * 0.6);
  const amp = h / 30;
  switch (r) {
    case 'off':
      return base;
    case 'ASSISTOLIA': {
      // linha "quase reta": só a deriva lenta da linha de base e um tremor mínimo
      const drift = Math.sin(tt / 900) * 0.7 + Math.sin(tt / 2300) * 0.6;
      return base + Math.round(drift * amp);
    }
    case 'FV': {
      // caótica: frequências que se misturam e amplitude que cresce e some
      const env = 0.7 + 0.3 * Math.sin(tt / 1300 + Math.sin(tt / 510));
      const w = Math.sin(tt / 47) * 5 + Math.sin(tt / 29 + 1.3) * 3.2 + Math.sin(tt / 83 + Math.sin(tt / 170) * 2) * 2.5;
      return base - 2 + Math.round(w * env * amp);
    }
    case 'TV': {
      // complexos largos e regulares, ~180/min, quase senoidais com a subida mais íngreme
      const period = 333;
      const ph = (((tt % period) + period) % period) / period;
      const s = ph < 0.42 ? Math.sin((ph / 0.42) * Math.PI) : -Math.sin(((ph - 0.42) / 0.58) * Math.PI) * 0.75;
      return base - 3 - Math.round(s * 10 * amp);
    }
    case 'AESP':
    case 'SINUSAL': {
      // AESP: organizado e lento, QRS um pouco mais largo, T achatada; sinusal: P-QRS-T
      const rate = r === 'AESP' ? 44 : fc > 0 ? fc : 72;
      const period = 60000 / rate;
      const ph = ((tt % period) + period) % period;
      const wide = r === 'AESP' ? 1.6 : 1;
      if (ph < 40) return base - Math.round(Math.sin((ph / 40) * Math.PI) * 2 * amp);
      if (ph > 90 && ph < 90 + 10 * wide) return base + Math.round(3 * amp);
      if (ph >= 90 + 10 * wide && ph < 90 + 28 * wide) {
        const k = (ph - (90 + 10 * wide)) / (18 * wide);
        return base - Math.round((1 - Math.abs(k * 2 - 1)) * (r === 'AESP' ? 11 : 15) * amp);
      }
      if (ph >= 90 + 28 * wide && ph < 90 + 38 * wide) return base + Math.round(5 * amp);
      if (ph > 220 && ph < 300) return base - Math.round(Math.sin(((ph - 220) / 80) * Math.PI) * (r === 'AESP' ? 1.5 : 3) * amp);
      return base;
    }
  }
}

/** desenha o traçado inteiro (rolando para a esquerda) num canvas w×h */
export function drawEcg(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, r: EcgRhythm, fc: number): void {
  ctx.fillStyle = '#04100a';
  ctx.fillRect(0, 0, w, h);
  // grade fraca do papel de ECG
  ctx.fillStyle = '#0a2014';
  for (let x = 0; x < w; x += 10) ctx.fillRect(x, 0, 1, h);
  for (let y = 0; y < h; y += 10) ctx.fillRect(0, y, w, 1);
  ctx.fillStyle = r === 'off' ? '#2a4a32' : '#7fe28a';
  const speed = 0.06;
  let prev = ecgY(r, t - (w - 1) / speed, fc, h);
  for (let x = 0; x < w; x++) {
    const y = Math.max(0, Math.min(h - 1, ecgY(r, t - (w - 1 - x) / speed, fc, h)));
    // liga os pontos com uma coluna, para as subidas rápidas não virarem pontilhado
    const a = Math.min(prev, y);
    const b = Math.max(prev, y);
    ctx.fillRect(x, a, 1, b - a + 1);
    prev = y;
  }
}
