import { None, Some } from 'oxide.ts';
import { CreatePositionCommandHandler } from '@/modules/organization/position/application/commands/create-position/create-position.command-handler';
import { CreatePositionCommand } from '@/modules/organization/position/application/commands/create-position/create-position.command';
import { UpdatePositionCommandHandler } from '@/modules/organization/position/application/commands/update-position/update-position.command-handler';
import { UpdatePositionCommand } from '@/modules/organization/position/application/commands/update-position/update-position.command';
import { DeletePositionCommandHandler } from '@/modules/organization/position/application/commands/delete-position/delete-position.command-handler';
import { DeletePositionCommand } from '@/modules/organization/position/application/commands/delete-position/delete-position.command';
import { PositionEntity } from '@/modules/organization/position/domain/position.entity';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';

const makeRepo = () => ({
  findByName: jest.fn(),
  findById: jest.fn(),
  save: jest.fn<Promise<void>, [PositionEntity]>(),
  delete: jest.fn(),
  transaction: jest.fn(),
});

describe('Position command handlers', () => {
  let repo: ReturnType<typeof makeRepo>;

  beforeEach(() => {
    repo = makeRepo();
  });

  describe('CreatePositionCommandHandler', () => {
    it('создаёт должность с иерархической привязкой parentId', async () => {
      repo.findByName.mockResolvedValue(null);
      const handler = new CreatePositionCommandHandler(repo);

      const id = await handler.execute(
        new CreatePositionCommand({ name: 'Менеджер', parentId: 'pos-1' }),
      );

      expect(typeof id).toBe('string');
      const saved = repo.save.mock.calls[0][0];
      expect(saved.getProps().parentId).toBe('pos-1');
    });

    it('бросает 409, если должность с таким именем уже существует', async () => {
      repo.findByName.mockResolvedValue(
        PositionEntity.create({ name: 'Менеджер' }),
      );
      const handler = new CreatePositionCommandHandler(repo);

      await expect(
        handler.execute(new CreatePositionCommand({ name: 'Менеджер' })),
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'POSITION_ALREADY_EXISTS',
      });
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('UpdatePositionCommandHandler', () => {
    it('обновляет должность, найденную по positionId', async () => {
      const existing = PositionEntity.create({ name: 'Старое' });
      repo.findById.mockResolvedValue(Some(existing));
      const handler = new UpdatePositionCommandHandler(repo);

      await handler.execute(
        new UpdatePositionCommand({
          positionId: existing.id,
          name: 'Новое',
          parentId: 'pos-1',
        }),
      );

      // поиск выполняется именно по positionId, а не по id команды
      expect(repo.findById).toHaveBeenCalledWith(existing.id);
      const saved = repo.save.mock.calls[0][0];
      expect(saved.getProps().name).toBe('Новое');
      expect(saved.getProps().parentId).toBe('pos-1');
    });

    it('бросает 404, если должность не найдена', async () => {
      repo.findById.mockResolvedValue(None);
      const handler = new UpdatePositionCommandHandler(repo);

      await expect(
        handler.execute(
          new UpdatePositionCommand({ positionId: 'missing', name: 'X' }),
        ),
      ).rejects.toThrow(ApplicationException);
    });
  });

  describe('DeletePositionCommandHandler', () => {
    it('удаляет должность, найденную по positionId', async () => {
      const existing = PositionEntity.create({ name: 'Удаляемая' });
      repo.findById.mockResolvedValue(Some(existing));
      const handler = new DeletePositionCommandHandler(repo);

      await handler.execute(
        new DeletePositionCommand({ positionId: existing.id }),
      );

      expect(repo.findById).toHaveBeenCalledWith(existing.id);
      expect(repo.delete).toHaveBeenCalledWith(existing);
    });

    it('бросает 404 при удалении несуществующей должности', async () => {
      repo.findById.mockResolvedValue(None);
      const handler = new DeletePositionCommandHandler(repo);

      await expect(
        handler.execute(new DeletePositionCommand({ positionId: 'missing' })),
      ).rejects.toMatchObject({ statusCode: 404, code: 'POSITION_NOT_FOUND' });
    });
  });
});
