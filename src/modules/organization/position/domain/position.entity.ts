import { CreateEntityProps, Entity } from '@/libs/ddd/entity.base';
import {
  CreatePositionProps,
  PositionProps,
  RecreatePositionProps,
} from '@/modules/organization/position/position.types';
import { randomUUID } from 'node:crypto';

export class PositionEntity extends Entity<PositionProps> {
  protected constructor(props: CreateEntityProps<PositionProps>) {
    super(props);
  }

  static create(props: CreatePositionProps) {
    return new PositionEntity({
      id: randomUUID(),
      props: {
        name: props.name,
        parentId: props.parentId ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  static recreate({ id, props }: RecreatePositionProps) {
    return new PositionEntity({ id, props });
  }
}
