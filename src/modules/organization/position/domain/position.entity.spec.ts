import { PositionEntity } from '@/modules/organization/position/domain/position.entity';

describe('PositionEntity', () => {
  describe('create', () => {
    it('создаёт корневую должность с parentId = null по умолчанию', () => {
      const entity = PositionEntity.create({ name: 'Директор' });
      const props = entity.getProps();

      expect(props.id).toEqual(expect.any(String));
      expect(props.name).toBe('Директор');
      expect(props.parentId).toBeNull();
      expect(props.createdAt).toBeInstanceOf(Date);
      expect(props.updatedAt).toBeInstanceOf(Date);
    });

    it('создаёт подчинённую должность с указанным parentId', () => {
      const entity = PositionEntity.create({
        name: 'Менеджер',
        parentId: 'pos-1',
      });
      expect(entity.getProps().parentId).toBe('pos-1');
    });
  });

  describe('recreate', () => {
    it('восстанавливает должность из сохранённых данных без изменения полей', () => {
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const updatedAt = new Date('2026-02-01T00:00:00.000Z');

      const entity = PositionEntity.recreate({
        id: 'pos-2',
        props: {
          name: 'Старший менеджер',
          parentId: 'pos-1',
          createdAt,
          updatedAt,
        },
      });
      const props = entity.getProps();

      expect(props.id).toBe('pos-2');
      expect(props.name).toBe('Старший менеджер');
      expect(props.parentId).toBe('pos-1');
      expect(props.updatedAt).toBe(updatedAt);
    });
  });
});
