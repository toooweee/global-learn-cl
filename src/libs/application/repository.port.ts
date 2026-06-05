import { Option } from 'oxide.ts';
import { AggregateId } from '@/libs/ddd/entity.base';

export interface BaseRepositoryPort {
  transaction<T>(handler: () => Promise<T>): Promise<T>;
}

export interface RepositoryPort<Entity> extends BaseRepositoryPort {
  save: (entity: Entity) => Promise<void>;
  findById: (id: AggregateId) => Promise<Option<Entity>>;
  delete: (entity: Entity) => Promise<void>;
}
