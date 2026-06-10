import { DivisionEntity } from '@/modules/organization/division/domain/division.entity';

describe('DivisionEntity', () => {
  describe('create', () => {
    it('создаёт отдел, привязанный к департаменту, с активным статусом', () => {
      const entity = DivisionEntity.create({
        name: 'Платформа',
        departmentId: 'dep-1',
      });
      const props = entity.getProps();

      expect(props.id).toEqual(expect.any(String));
      expect(props.name).toBe('Платформа');
      expect(props.departmentId).toBe('dep-1');
      expect(props.isActive).toBe(true);
      expect(props.createdAt).toBeInstanceOf(Date);
      expect(props.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('recreate', () => {
    it('восстанавливает отдел из сохранённых данных без изменения полей', () => {
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const updatedAt = new Date('2026-02-01T00:00:00.000Z');

      const entity = DivisionEntity.recreate({
        id: 'div-1',
        props: {
          name: 'Аналитика',
          departmentId: 'dep-2',
          isActive: false,
          createdAt,
          updatedAt,
        },
      });
      const props = entity.getProps();

      expect(props.id).toBe('div-1');
      expect(props.name).toBe('Аналитика');
      expect(props.departmentId).toBe('dep-2');
      expect(props.isActive).toBe(false);
      expect(props.createdAt).toBe(createdAt);
    });
  });
});
