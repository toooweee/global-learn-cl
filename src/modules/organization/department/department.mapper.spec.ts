import { DepartmentMapper } from '@/modules/organization/department/department.mapper';
import { DepartmentEntity } from '@/modules/organization/department/domain/department.entity';
import { Department } from '@generated/client';

describe('DepartmentMapper', () => {
  const mapper = new DepartmentMapper();
  const record: Department = {
    id: 'dep-1',
    name: 'Маркетинг',
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-02-01T00:00:00.000Z'),
  };

  it('toDomain преобразует запись БД в доменную сущность', () => {
    const entity = mapper.toDomain(record);
    expect(entity).toBeInstanceOf(DepartmentEntity);
    expect(entity.getProps()).toMatchObject({
      id: 'dep-1',
      name: 'Маркетинг',
      isActive: true,
    });
  });

  it('toPersistence преобразует сущность обратно в запись БД', () => {
    const entity = mapper.toDomain(record);
    expect(mapper.toPersistence(entity)).toEqual(record);
  });

  it('toResponse формирует DTO без служебного поля isActive', () => {
    const entity = mapper.toDomain(record);
    const dto = mapper.toResponse(entity);

    expect(dto.id).toBe('dep-1');
    expect(dto.name).toBe('Маркетинг');
    expect(dto).not.toHaveProperty('isActive');
  });
});
