import { CreateEntityProps, Entity } from '@/libs/ddd/entity.base';
import {
  CreateUserProps,
  RecreateUserProps,
  UserProps,
} from '@/modules/identity/user/user.types';
import { randomUUID } from 'node:crypto';

export class UserEntity extends Entity<UserProps> {
  protected constructor(props: CreateEntityProps<UserProps>) {
    super(props);
  }

  static create(props: CreateUserProps) {
    return new UserEntity({
      id: randomUUID(),
      props: { ...props, createdAt: new Date(), updatedAt: new Date() },
    });
  }

  static recreate(props: RecreateUserProps) {
    return new UserEntity({ id: props.id, props: props });
  }
}
