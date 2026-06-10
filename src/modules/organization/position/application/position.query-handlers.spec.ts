import { FindPositionQueryHandler } from '@/modules/organization/position/application/queries/find-position/find-position.query-handler';
import { FindPositionQuery } from '@/modules/organization/position/application/queries/find-position/find-position.query';
import { FindPositionsQueryHandler } from '@/modules/organization/position/application/queries/find-positions/find-positions.query-handler';
import { FindPositionsQuery } from '@/modules/organization/position/application/queries/find-positions/find-positions.query';
import { GetPositionTreeQueryHandler } from '@/modules/organization/position/application/queries/get-position-tree/get-position-tree.query-handler';
import { GetPositionTreeQuery } from '@/modules/organization/position/application/queries/get-position-tree/get-position-tree.query';

const makePrisma = () => ({
  client: {
    position: {
      findUnique: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
  },
});

describe('Position query handlers', () => {
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(() => {
    prisma = makePrisma();
  });

  describe('FindPositionQueryHandler', () => {
    it('возвращает должность по идентификатору', async () => {
      const record = { id: 'pos-1', name: 'Директор', parentId: null };
      prisma.client.position.findUnique.mockResolvedValue(record);
      const handler = new FindPositionQueryHandler(prisma as never);

      await expect(
        handler.execute(new FindPositionQuery('pos-1')),
      ).resolves.toBe(record);
    });

    it('бросает 404, если должность не найдена', async () => {
      prisma.client.position.findUnique.mockResolvedValue(null);
      const handler = new FindPositionQueryHandler(prisma as never);

      await expect(
        handler.execute(new FindPositionQuery('missing')),
      ).rejects.toMatchObject({ statusCode: 404, code: 'POSITION_NOT_FOUND' });
    });
  });

  describe('FindPositionsQueryHandler', () => {
    it('возвращает постраничный список должностей', async () => {
      const data = [{ id: 'pos-1', name: 'Директор', parentId: null }];
      prisma.client.position.count.mockResolvedValue(1);
      prisma.client.position.findMany.mockResolvedValue(data);
      const handler = new FindPositionsQueryHandler(prisma as never);

      const result = await handler.execute(
        new FindPositionsQuery({ limit: 20, page: 1 }),
      );

      expect(result.count).toBe(1);
      expect(result.data).toEqual(data);
    });
  });

  describe('GetPositionTreeQueryHandler', () => {
    it('строит иерархическое дерево должностей из плоской выборки с вложенностью', async () => {
      prisma.client.position.findMany.mockResolvedValue([
        {
          id: 'pos-1',
          name: 'Директор',
          parentId: null,
          subordinates: [
            {
              id: 'pos-2',
              name: 'Руководитель департамента',
              parentId: 'pos-1',
              subordinates: [],
            },
          ],
        },
      ]);
      const handler = new GetPositionTreeQueryHandler(prisma as never);

      const tree = await handler.execute(new GetPositionTreeQuery());

      expect(prisma.client.position.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { parentId: null } }),
      );
      expect(tree).toHaveLength(1);
      expect(tree[0]).toMatchObject({ id: 'pos-1', name: 'Директор' });
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children[0]).toMatchObject({
        id: 'pos-2',
        parentId: 'pos-1',
        children: [],
      });
    });
  });
});
