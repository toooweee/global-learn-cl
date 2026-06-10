import { DepartmentEntity } from '@/modules/organization/department/domain/department.entity';

describe('DepartmentEntity', () => {
  describe('create', () => {
    it('создаёт новый департамент с активным статусом и метками времени', () => {
      const entity = DepartmentEntity.create({ name: 'Маркетинг' });
      const props = entity.getProps();

      expect(props.id).toEqual(expect.any(String));
      expect(props.name).toBe('Маркетинг');
      expect(props.isActive).toBe(true);
      expect(props.createdAt).toBeInstanceOf(Date);
      expect(props.updatedAt).toBeInstanceOf(Date);
    });

    it('генерирует уникальные идентификаторы для разных департаментов', () => {
      const a = DepartmentEntity.create({ name: 'A' });
      const b = DepartmentEntity.create({ name: 'B' });

      expect(a.id).not.toBe(b.id);
    });
  });

  describe('recreate', () => {
    it('восстанавливает департамент из сохранённых данных без изменения полей', () => {
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const updatedAt = new Date('2026-02-01T00:00:00.000Z');

      const entity = DepartmentEntity.recreate({
        id: 'dep-1',
        props: { name: 'Продажи', isActive: false, createdAt, updatedAt },
      });
      const props = entity.getProps();

      expect(props.id).toBe('dep-1');
      expect(props.name).toBe('Продажи');
      expect(props.isActive).toBe(false);
      expect(props.createdAt).toBe(createdAt);
      expect(props.updatedAt).toBe(updatedAt);
    });
  });
});
