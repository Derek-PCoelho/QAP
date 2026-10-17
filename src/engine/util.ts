// Utilitários: RNG determinístico, tempo de jogo, clamp.

/** mulberry32 — retorna [próximo estado, valor 0..1) */
export function rngNext(state: number): [number, number] {
  let t = (state + 0x6d2b79f5) | 0;
  let r = Math.imul(t ^ (t >>> 15), 1 | t);
  r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
  const out = ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  return [t, out];
}

/** RNG mutável a partir de uma semente (uso local, ex.: geração de conteúdo) */
export class Rng {
  state: number;
  constructor(seed: number) {
    this.state = seed | 0;
  }
  next(): number {
    const [s, v] = rngNext(this.state);
    this.state = s;
    return v;
  }
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
  chance(p: number): boolean {
    return this.next() < p;
  }
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  weighted<T>(items: readonly T[], w: (t: T) => number): T {
    const total = items.reduce((a, t) => a + Math.max(0, w(t)), 0);
    let r = this.next() * total;
    for (const it of items) {
      r -= Math.max(0, w(it));
      if (r <= 0) return it;
    }
    return items[items.length - 1];
  }
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h | 0;
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** 'HH:MM' -> minutos desde 00:00 */
export function hm(s: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) throw new Error(`Horário inválido: ${s}`);
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

/** minutos -> 'HH:MM' */
export function fmtTime(min: number): string {
  const total = Math.max(0, Math.floor(min));
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function fmtMoney(v: number): string {
  const sign = v < 0 ? '−' : '';
  const abs = Math.abs(Math.round(v));
  return `${sign}R$ ${abs.toLocaleString('pt-BR')}`;
}

export function fmtDur(min: number): string {
  const m = Math.max(0, Math.round(min));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h${String(r).padStart(2, '0')}` : `${h}h`;
}

export function uid(prefix = ''): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function sumBy<T>(arr: readonly T[], f: (t: T) => number): number {
  let s = 0;
  for (const a of arr) s += f(a);
  return s;
}
