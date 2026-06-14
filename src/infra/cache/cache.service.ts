import { Inject, Injectable } from '@nestjs/common';
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
 * Thin wrapper over the Redis-backed cache-manager.
 *
 * Group invalidation uses a per-namespace version counter embedded in every
 * key (`<ns>:v<N>:...`). Bumping the counter makes all previously written keys
 * unreachable without scanning Redis — they simply expire on their own TTL.
 */
@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  private async version(ns: string): Promise<number> {
    const v = await this.cache.get<number>(`ns:${ns}:ver`);
    return typeof v === 'number' ? v : 1;
  }

  /** Bump a namespace version → every key built before becomes unreachable. */
  async invalidate(ns: string): Promise<void> {
    const next = (await this.version(ns)) + 1;
    await this.cache.set(`ns:${ns}:ver`, next, VERSION_TTL);
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

    const hit = await this.cache.get<T>(key);
    if (hit !== undefined && hit !== null) return hit;

    const fresh = await factory();
    await this.cache.set(key, fresh, ttlMs);
    return fresh;
  }
}
