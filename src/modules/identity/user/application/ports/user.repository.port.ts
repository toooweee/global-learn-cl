import { RepositoryPort } from '@/libs/application';
import { UserEntity } from '@/modules/identity/user/domain/user.entity';
import { Option } from 'oxide.ts';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepositoryPort extends RepositoryPort<UserEntity> {
  findByEmail: (email: string) => Promise<Option<UserEntity>>;
}
