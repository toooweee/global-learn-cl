import { RepositoryPort } from '@/libs/application';
import { DivisionEntity } from '@/modules/organization/division/domain/division.entity';

export const DIVISION_REPOSITORY = Symbol('DIVISION_REPOSITORY');

export interface DivisionRepositoryPort extends RepositoryPort<DivisionEntity> {
  findByName(name: string): Promise<DivisionEntity | null>;
}
