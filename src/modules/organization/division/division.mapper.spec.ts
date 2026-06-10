import { DivisionMapper } from '@/modules/organization/division/division.mapper';
import { DivisionEntity } from '@/modules/organization/division/domain/division.entity';
import { Division } from '@generated/client';

describe('DivisionMapper', () => {
  const mapper = new DivisionMapper();
  const record: Division = {
    id: 'div-1',
    name: 'Платформа',
    departmentId: 'dep-1',
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-02-01T00:00:00.000Z'),
  };

  it('toDomain преобразует запись БД в доменную сущность', () => {
    const entity = mapper.toDomain(record);
    expect(entity).toBeInstanceOf(DivisionEntity);
    expect(entity.getProps()).toMatchObject({
      id: 'div-1',
      name: 'Платформа',
      departmentId: 'dep-1',
    });
  });

  it('toPersistence преобразует сущность обратно в запись БД', () => {
    const entity = mapper.toDomain(record);
    expect(mapper.toPersistence(entity)).toEqual(record);
  });

  it('toResponse формирует DTO с привязкой к департаменту без поля isActive', () => {
    const entity = mapper.toDomain(record);
    const dto = mapper.toResponse(entity);

    expect(dto.id).toBe('div-1');
    expect(dto.name).toBe('Платформа');
    expect(dto.departmentId).toBe('dep-1');
    expect(dto).not.toHaveProperty('isActive');
  });
});
