import { None, Some } from 'oxide.ts';
import { CreateDivisionCommandHandler } from '@/modules/organization/division/application/commands/create-division/create-division.command-handler';
import { CreateDivisionCommand } from '@/modules/organization/division/application/commands/create-division/create-division.command';
import { UpdateDivisionCommandHandler } from '@/modules/organization/division/application/commands/update-division/update-division.command-handler';
import { UpdateDivisionCommand } from '@/modules/organization/division/application/commands/update-division/update-division.command';
import { DeleteDivisionCommandHandler } from '@/modules/organization/division/application/commands/delete-division/delete-division.command-handler';
import { DeleteDivisionCommand } from '@/modules/organization/division/application/commands/delete-division/delete-division.command';
import { DivisionEntity } from '@/modules/organization/division/domain/division.entity';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';

const makeRepo = () => ({
  findByName: jest.fn(),
  findById: jest.fn(),
  save: jest.fn<Promise<void>, [DivisionEntity]>(),
  delete: jest.fn(),
  transaction: jest.fn(),
});

describe('Division command handlers', () => {
  let repo: ReturnType<typeof makeRepo>;

  beforeEach(() => {
    repo = makeRepo();
  });

  describe('CreateDivisionCommandHandler', () => {
    it('создаёт отдел и возвращает его идентификатор', async () => {
      repo.findByName.mockResolvedValue(null);
      const handler = new CreateDivisionCommandHandler(repo);

      const id = await handler.execute(
        new CreateDivisionCommand({ name: 'Платформа', departmentId: 'dep-1' }),
      );

      expect(typeof id).toBe('string');
      const saved = repo.save.mock.calls[0][0];
      expect(saved.getProps().departmentId).toBe('dep-1');
    });

    it('бросает 409, если отдел с таким именем уже существует', async () => {
      repo.findByName.mockResolvedValue(
        DivisionEntity.create({ name: 'Платформа', departmentId: 'dep-1' }),
      );
      const handler = new CreateDivisionCommandHandler(repo);

      await expect(
        handler.execute(
          new CreateDivisionCommand({
            name: 'Платформа',
            departmentId: 'dep-1',
          }),
        ),
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'DIVISION_ALREADY_EXISTS',
      });
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('UpdateDivisionCommandHandler', () => {
    it('обновляет имя и департамент существующего отдела', async () => {
      const existing = DivisionEntity.create({
        name: 'Старое',
        departmentId: 'dep-1',
      });
      repo.findById.mockResolvedValue(Some(existing));
      const handler = new UpdateDivisionCommandHandler(repo);

      await handler.execute(
        new UpdateDivisionCommand({
          divisionId: existing.id,
          name: 'Новое',
          departmentId: 'dep-2',
        }),
      );

      const saved = repo.save.mock.calls[0][0];
      expect(saved.getProps().name).toBe('Новое');
      expect(saved.getProps().departmentId).toBe('dep-2');
    });

    it('бросает 404, если отдел не найден', async () => {
      repo.findById.mockResolvedValue(None);
      const handler = new UpdateDivisionCommandHandler(repo);

      await expect(
        handler.execute(
          new UpdateDivisionCommand({
            divisionId: 'missing',
            name: 'X',
            departmentId: 'dep-1',
          }),
        ),
      ).rejects.toThrow(ApplicationException);
    });
  });

  describe('DeleteDivisionCommandHandler', () => {
    it('удаляет существующий отдел', async () => {
      const existing = DivisionEntity.create({
        name: 'Удаляемый',
        departmentId: 'dep-1',
      });
      repo.findById.mockResolvedValue(Some(existing));
      const handler = new DeleteDivisionCommandHandler(repo);

      await handler.execute(
        new DeleteDivisionCommand({ divisionId: existing.id }),
      );

      expect(repo.delete).toHaveBeenCalledWith(existing);
    });

    it('бросает 404 при удалении несуществующего отдела', async () => {
      repo.findById.mockResolvedValue(None);
      const handler = new DeleteDivisionCommandHandler(repo);

      await expect(
        handler.execute(new DeleteDivisionCommand({ divisionId: 'missing' })),
      ).rejects.toMatchObject({ statusCode: 404, code: 'DIVISION_NOT_FOUND' });
    });
  });
});
