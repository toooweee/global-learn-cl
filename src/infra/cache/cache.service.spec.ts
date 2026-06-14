import { CacheService } from './cache.service';

// Map-backed fake of cache-manager's Cache — proves the caching/versioning
// semantics without a live Redis.
const makeFakeCache = () => {
  const store = new Map<string, unknown>();
  return {
    get: jest.fn(async (k: string) => (store.has(k) ? store.get(k) : null)),
    set: jest.fn(async (k: string, v: unknown) => {
      store.set(k, v);
    }),
    store,
  };
};

describe('CacheService', () => {
  let fake: ReturnType<typeof makeFakeCache>;
  let cache: CacheService;

  beforeEach(() => {
    fake = makeFakeCache();
    cache = new CacheService(fake as never);
  });

  it('runs the factory once and serves the cached value on repeat', async () => {
    const factory = jest.fn(async () => ({ v: 1 }));

    const a = await cache.getOrSet('courses', ['list', 1], 1000, factory);
    const b = await cache.getOrSet('courses', ['list', 1], 1000, factory);

    expect(factory).toHaveBeenCalledTimes(1);
    expect(a).toEqual({ v: 1 });
    expect(b).toEqual({ v: 1 });
  });

  it('re-runs the factory after the namespace is invalidated', async () => {
    const factory = jest.fn(async () => 'x');

    await cache.getOrSet('org', ['k'], 1000, factory);
    await cache.invalidate('org');
    await cache.getOrSet('org', ['k'], 1000, factory);

    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('keys by parts — different params are cached separately', async () => {
    const factory = jest.fn(async (n: number) => n);

    await cache.getOrSet('org', ['k', 1], 1000, () => factory(1));
    await cache.getOrSet('org', ['k', 2], 1000, () => factory(2));
    await cache.getOrSet('org', ['k', 1], 1000, () => factory(1));

    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('invalidating one namespace does not drop another', async () => {
    const courses = jest.fn(async () => 'c');
    const org = jest.fn(async () => 'o');

    await cache.getOrSet('courses', ['k'], 1000, courses);
    await cache.getOrSet('org', ['k'], 1000, org);

    await cache.invalidate('org');

    await cache.getOrSet('courses', ['k'], 1000, courses); // still cached
    await cache.getOrSet('org', ['k'], 1000, org); // dropped → re-run

    expect(courses).toHaveBeenCalledTimes(1);
    expect(org).toHaveBeenCalledTimes(2);
  });
});
