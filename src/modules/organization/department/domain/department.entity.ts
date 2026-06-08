import { CreateEntityProps, Entity } from '@/libs/ddd/entity.base';
import {
  CreateDepartmentProps,
  DepartmentProps,
  RecreateDepartmentProps,
} from '@/modules/organization/department/department.types';
import { randomUUID } from 'node:crypto';

export class DepartmentEntity extends Entity<DepartmentProps> {
  protected constructor(props: CreateEntityProps<DepartmentProps>) {
    super(props);
  }

  static create(props: CreateDepartmentProps) {
    return new DepartmentEntity({
      id: randomUUID(),
      props: {
        ...props,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  static recreate({ id, props }: RecreateDepartmentProps) {
    return new DepartmentEntity({ id, props });
  }
}
