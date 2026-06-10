import { None, Some } from 'oxide.ts';
import { CreateDepartmentCommandHandler } from '@/modules/organization/department/application/commands/create-department/create-department.command-handler';
import { CreateDepartmentCommand } from '@/modules/organization/department/application/commands/create-department/create-department.command';
import { DeleteDepartmentCommandHandler } from '@/modules/organization/department/application/commands/delete-department/delete-department.command-handler';
import { DeleteDepartmentCommand } from '@/modules/organization/department/application/commands/delete-department/delete-department.command';
import { DepartmentEntity } from '@/modules/organization/department/domain/department.entity';

const makeRepo = () => ({
  findByName: jest.fn(),
  findById: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  transaction: jest.fn(),
});

describe('Department command handlers', () => {
  let repo: ReturnType<typeof makeRepo>;

  beforeEach(() => {
    repo = makeRepo();
  });

  describe('CreateDepartmentCommandHandler', () => {
    it('создаёт департамент и возвращает его идентификатор', async () => {
      repo.findByName.mockResolvedValue(null);
      const handler = new CreateDepartmentCommandHandler(repo);

      const id = await handler.execute(
        new CreateDepartmentCommand({ name: 'Маркетинг' }),
      );

      expect(typeof id).toBe('string');
      expect(repo.save).toHaveBeenCalledTimes(1);
    });

    it('бросает 409, если департамент с таким именем уже существует', async () => {
      repo.findByName.mockResolvedValue(
        DepartmentEntity.create({ name: 'Маркетинг' }),
      );
      const handler = new CreateDepartmentCommandHandler(repo);

      await expect(
        handler.execute(new CreateDepartmentCommand({ name: 'Маркетинг' })),
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'DEPARTMENT_ALREADY_EXISTS',
      });
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('DeleteDepartmentCommandHandler', () => {
    it('удаляет существующий департамент', async () => {
      const existing = DepartmentEntity.create({ name: 'Удаляемый' });
      repo.findById.mockResolvedValue(Some(existing));
      const handler = new DeleteDepartmentCommandHandler(repo);

      await handler.execute(
        new DeleteDepartmentCommand({ departmentId: existing.id }),
      );

      expect(repo.delete).toHaveBeenCalledWith(existing);
    });

    it('бросает 404 при удалении несуществующего департамента', async () => {
      repo.findById.mockResolvedValue(None);
      const handler = new DeleteDepartmentCommandHandler(repo);

      await expect(
        handler.execute(
          new DeleteDepartmentCommand({ departmentId: 'missing' }),
        ),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'DEPARTMENT_NOT_FOUND',
      });
      expect(repo.delete).not.toHaveBeenCalled();
    });
  });
});
