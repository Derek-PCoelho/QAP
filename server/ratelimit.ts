// =============================================================================
// Limite de taxa em memória (token bucket por IP e por "balde").
// =============================================================================

export interface BucketSpec {
  /** fichas no balde cheio (rajada máxima) */
  capacity: number;
  /** fichas devolvidas por segundo */
  refillPerSec: number;
}

export type BucketName = 'api' | 'telemetry' | 'ranking' | 'profiles';

export const DEFAULT_RATE_LIMITS: Readonly<Record<BucketName, BucketSpec>> = Object.freeze({
  /** toda a API: 60 requisições / 10 s */
  api: { capacity: 60, refillPerSec: 6 },
  /** telemetria: 12 lotes / 10 s (o cliente manda ~1 a cada 10 s) */
  telemetry: { capacity: 12, refillPerSec: 1.2 },
  /** envio de pontuação: 6 por minuto */
  ranking: { capacity: 6, refillPerSec: 0.1 },
  /** criação de perfil: 10 por minuto */
  profiles: { capacity: 10, refillPerSec: 10 / 60 },
});

interface Bucket {
  tokens: number;
  last: number;
}

export type TakeResult = { ok: true } | { ok: false; retryAfter: number };

const MAX_TRACKED = 50_000;

export class RateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  constructor(
    private readonly specs: Partial<Record<BucketName, BucketSpec>>,
    private readonly now: () => number = Date.now,
  ) {}

  take(bucket: BucketName, key: string, cost = 1): TakeResult {
    const spec = this.specs[bucket];
    if (!spec) return { ok: true };
    const id = `${bucket}|${key}`;
    const t = this.now();
    let b = this.buckets.get(id);
    if (!b) {
      if (this.buckets.size >= MAX_TRACKED) this.prune(true);
      b = { tokens: spec.capacity, last: t };
      this.buckets.set(id, b);
    } else {
      b.tokens = Math.min(spec.capacity, b.tokens + ((t - b.last) / 1000) * spec.refillPerSec);
      b.last = t;
    }
    if (b.tokens >= cost) {
      b.tokens -= cost;
      return { ok: true };
    }
    const wait = spec.refillPerSec > 0 ? (cost - b.tokens) / spec.refillPerSec : 3600;
    return { ok: false, retryAfter: Math.max(1, Math.ceil(wait)) };
  }

  /** Remove baldes que já estariam cheios (inativos). `all` esvazia tudo se ainda estiver lotado. */
  prune(all = false): void {
    const t = this.now();
    for (const [id, b] of this.buckets) {
      const spec = this.specs[id.slice(0, id.indexOf('|')) as BucketName];
      if (!spec || b.tokens + ((t - b.last) / 1000) * spec.refillPerSec >= spec.capacity) this.buckets.delete(id);
    }
    if (all && this.buckets.size >= MAX_TRACKED) this.buckets.clear();
  }

  get size(): number {
    return this.buckets.size;
  }
}
