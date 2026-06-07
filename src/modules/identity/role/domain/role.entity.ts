import { CreateEntityProps, Entity } from '@/libs/ddd/entity.base';
import {
  CreateRoleProps,
  RecreateRoleProps,
  RoleProps,
} from '@/modules/identity/role/role.types';
import { randomUUID } from 'node:crypto';

export class RoleEntity extends Entity<RoleProps> {
  protected constructor(props: CreateEntityProps<RoleProps>) {
    super(props);
  }

  static create(props: CreateRoleProps) {
    return new RoleEntity({
      id: randomUUID(),
      props: { ...props, createdAt: new Date(), updatedAt: new Date() },
    });
  }

  static recreate({ id, props }: RecreateRoleProps) {
    return new RoleEntity({ id, props });
  }
}
