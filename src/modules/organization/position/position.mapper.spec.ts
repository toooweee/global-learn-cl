import { PositionMapper } from '@/modules/organization/position/position.mapper';
import { PositionEntity } from '@/modules/organization/position/domain/position.entity';
import { Position } from '@generated/client';

describe('PositionMapper', () => {
  const mapper = new PositionMapper();
  const record: Position = {
    id: 'pos-2',
    name: 'Старший менеджер',
    parentId: 'pos-1',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-02-01T00:00:00.000Z'),
  };

  it('toDomain преобразует запись БД в доменную сущность', () => {
    const entity = mapper.toDomain(record);
    expect(entity).toBeInstanceOf(PositionEntity);
    expect(entity.getProps()).toMatchObject({
      id: 'pos-2',
      name: 'Старший менеджер',
      parentId: 'pos-1',
    });
  });

  it('toPersistence преобразует сущность обратно в запись БД', () => {
    const entity = mapper.toDomain(record);
    expect(mapper.toPersistence(entity)).toEqual(record);
  });

  it('toResponse формирует DTO с сохранением иерархической ссылки parentId', () => {
    const entity = mapper.toDomain(record);
    const dto = mapper.toResponse(entity);

    expect(dto.id).toBe('pos-2');
    expect(dto.name).toBe('Старший менеджер');
    expect(dto.parentId).toBe('pos-1');
  });
});
