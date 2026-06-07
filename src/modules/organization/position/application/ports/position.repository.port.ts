import { RepositoryPort } from '@/libs/application';
import { PositionEntity } from '@/modules/organization/position/domain/position.entity';

export const POSITION_REPOSITORY = Symbol('POSITION_REPOSITORY');

export interface PositionRepositoryPort extends RepositoryPort<PositionEntity> {
  findByName(name: string): Promise<PositionEntity | null>;
}
