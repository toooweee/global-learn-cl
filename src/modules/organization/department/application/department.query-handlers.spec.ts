import { FindDepartmentQueryHandler } from '@/modules/organization/department/application/queries/find-department/find-department.query-handler';
import { FindDepartmentQuery } from '@/modules/organization/department/application/queries/find-department/find-department.query';
import { FindDepartmentsQueryHandler } from '@/modules/organization/department/application/queries/find-departments/find-departments.query-handler';
import { FindDepartmentsQuery } from '@/modules/organization/department/application/queries/find-departments/find-departments.query';

const makePrisma = () => ({
  client: {
    department: {
      findUnique: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
  },
});

describe('Department query handlers', () => {
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(() => {
    prisma = makePrisma();
  });

  describe('FindDepartmentQueryHandler', () => {
    it('возвращает департамент по идентификатору', async () => {
      const record = { id: 'dep-1', name: 'Маркетинг' };
      prisma.client.department.findUnique.mockResolvedValue(record);
      const handler = new FindDepartmentQueryHandler(prisma as never);

      await expect(
        handler.execute(new FindDepartmentQuery('dep-1')),
      ).resolves.toBe(record);
    });

    it('бросает 404, если департамент не найден', async () => {
      prisma.client.department.findUnique.mockResolvedValue(null);
      const handler = new FindDepartmentQueryHandler(prisma as never);

      await expect(
        handler.execute(new FindDepartmentQuery('missing')),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'DEPARTMENT_NOT_FOUND',
      });
    });
  });

  describe('FindDepartmentsQueryHandler', () => {
    it('возвращает постраничный список департаментов', async () => {
      const data = [{ id: 'dep-1', name: 'Маркетинг' }];
      prisma.client.department.count.mockResolvedValue(1);
      prisma.client.department.findMany.mockResolvedValue(data);
      const handler = new FindDepartmentsQueryHandler(prisma as never);

      const result = await handler.execute(
        new FindDepartmentsQuery({ limit: 20, page: 1 }),
      );

      expect(result.count).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.page).toBe(1);
      expect(result.data).toEqual(data);
      expect(prisma.client.department.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 20, skip: 0 }),
      );
    });
  });
});
