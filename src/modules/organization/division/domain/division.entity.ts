import { CreateEntityProps, Entity } from '@/libs/ddd/entity.base';
import {
  CreateDivisionProps,
  DivisionProps,
  RecreateDivisionProps,
} from '@/modules/organization/division/division.types';
import { randomUUID } from 'node:crypto';

export class DivisionEntity extends Entity<DivisionProps> {
  protected constructor(props: CreateEntityProps<DivisionProps>) {
    super(props);
  }

  static create(props: CreateDivisionProps) {
    return new DivisionEntity({
      id: randomUUID(),
      props: {
        ...props,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  static recreate({ id, props }: RecreateDivisionProps) {
    return new DivisionEntity({ id, props });
  }
}
