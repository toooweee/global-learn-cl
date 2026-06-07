import { RepositoryPort } from '@/libs/application';
import { RoleEntity } from '@/modules/identity/role/domain/role.entity';

export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');

export interface RoleRepositoryPort extends RepositoryPort<RoleEntity> {
  findByName(name: string): Promise<RoleEntity | null>;
}
