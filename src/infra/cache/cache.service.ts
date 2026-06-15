import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

/** Logical cache namespaces — group invalidation rotates one of these. */
export const CACHE_NS = {
  COURSES: 'courses',
  ORG: 'org',
} as const;

/** Read TTLs (ms). Short — staleness is bounded for user-scoped reads. */
export const CACHE_TTL = {
  COURSES: 60_000,
  ORG: 60_000,
} as const;

// Version counters must outlive data keys so invalidation can't be "forgotten".
const VERSION_TTL = 7 * 24 * 60 * 60 * 1000;

/**
 * Max time (ms) to wait on any single Redis op. If the store is unreachable,
 * node-redis queues commands and never settles — without this bound a Redis
 * outage would hang every cached read forever. On timeout/error we treat it as
 * a miss and fall through to the source of truth (the DB).
 */
const CACHE_OP_TIMEOUT = 1_000;

/** Sentinel distinguishing a real `undefined`/null cache value from a timeout. */
const TIMED_OUT = Symbol('cache-timeout');

/**
 * Thin wrapper over the Redis-backed cache-manager.
 *
 * Group invalidation uses a per-namespace version counter embedded in every
 * key (`<ns>:v<N>:...`). Bumping the counter makes all previously written keys
 * unreachable without scanning Redis — they simply expire on their own TTL.
 *
 * The cache is treated as strictly best-effort: any Redis failure (down, slow,
 * timeout) degrades to reading/writing nothing, so a cache outage can never
 * block or fail a request — it just loses the speed-up.
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  /** Race a cache op against a timeout; on any error/timeout return `fallback`. */
  private async safe<T>(op: () => Promise<T>, fallback: T): Promise<T> {
    try {
      let timer: NodeJS.Timeout;
      const timeout = new Promise<typeof TIMED_OUT>((resolve) => {
        timer = setTimeout(() => resolve(TIMED_OUT), CACHE_OP_TIMEOUT);
      });
      const result = await Promise.race([op(), timeout]).finally(() =>
        clearTimeout(timer),
      );
      if (result === TIMED_OUT) {
        this.logger.warn(`cache op timed out after ${CACHE_OP_TIMEOUT}ms`);
        return fallback;
      }
      return result;
    } catch (err) {
      this.logger.warn(`cache op failed: ${(err as Error).message}`);
      return fallback;
    }
  }

  private async version(ns: string): Promise<number> {
    const v = await this.safe(
      () => this.cache.get<number>(`ns:${ns}:ver`),
      undefined,
    );
    return typeof v === 'number' ? v : 1;
  }

  /** Bump a namespace version → every key built before becomes unreachable. */
  async invalidate(ns: string): Promise<void> {
    const next = (await this.version(ns)) + 1;
    await this.safe(
      () => this.cache.set(`ns:${ns}:ver`, next, VERSION_TTL),
      undefined,
    );
  }

  /** Return a cached value or compute+store it under a namespaced version key. */
  async getOrSet<T>(
    ns: string,
    parts: Array<string | number | boolean | undefined>,
    ttlMs: number,
    factory: () => Promise<T>,
  ): Promise<T> {
    const suffix = parts
      .map((p) => (p === undefined ? '_' : String(p)))
      .join('|');
    const key = `${ns}:v${await this.version(ns)}:${suffix}`;

    const hit = await this.safe(() => this.cache.get<T>(key), undefined);
    if (hit !== undefined && hit !== null) return hit;

    const fresh = await factory();
    await this.safe(() => this.cache.set(key, fresh, ttlMs), undefined);
    return fresh;
  }
}
