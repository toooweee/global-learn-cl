import { FindDivisionQueryHandler } from '@/modules/organization/division/application/queries/find-division/find-division.query-handler';
import { FindDivisionQuery } from '@/modules/organization/division/application/queries/find-division/find-division.query';
import { FindDivisionsQueryHandler } from '@/modules/organization/division/application/queries/find-divisions/find-divisions.query-handler';
import { FindDivisionsQuery } from '@/modules/organization/division/application/queries/find-divisions/find-divisions.query';

const makePrisma = () => ({
  client: {
    division: {
      findUnique: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
  },
});

// CacheService stub: getOrSet just runs the factory (cache miss every time).
const passthroughCache = {
  getOrSet: (
    _ns: string,
    _parts: unknown[],
    _ttl: number,
    factory: () => unknown,
  ) => factory(),
  invalidate: jest.fn(),
};

describe('Division query handlers', () => {
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(() => {
    prisma = makePrisma();
  });

  describe('FindDivisionQueryHandler', () => {
    it('возвращает отдел по идентификатору', async () => {
      const record = { id: 'div-1', name: 'Платформа', departmentId: 'dep-1' };
      prisma.client.division.findUnique.mockResolvedValue(record);
      const handler = new FindDivisionQueryHandler(prisma as never);

      await expect(
        handler.execute(new FindDivisionQuery('div-1')),
      ).resolves.toBe(record);
    });

    it('бросает 404, если отдел не найден', async () => {
      prisma.client.division.findUnique.mockResolvedValue(null);
      const handler = new FindDivisionQueryHandler(prisma as never);

      await expect(
        handler.execute(new FindDivisionQuery('missing')),
      ).rejects.toMatchObject({ statusCode: 404, code: 'DIVISION_NOT_FOUND' });
    });
  });

  describe('FindDivisionsQueryHandler', () => {
    it('возвращает постраничный список отделов', async () => {
      const data = [{ id: 'div-1', name: 'Платформа', departmentId: 'dep-1' }];
      prisma.client.division.count.mockResolvedValue(1);
      prisma.client.division.findMany.mockResolvedValue(data);
      const handler = new FindDivisionsQueryHandler(
        prisma as never,
        passthroughCache as never,
      );

      const result = await handler.execute(
        new FindDivisionsQuery({ limit: 10, page: 2 }),
      );

      expect(result.count).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.page).toBe(2);
      expect(result.data).toEqual(data);
      expect(prisma.client.division.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10, skip: 10 }),
      );
    });
  });
});
