import { CreateEntityProps, Entity } from '@/libs/ddd/entity.base';
import {
  CreateEmployeeProps,
  EmployeeProps,
  RecreateEmployeeProps,
} from '@/modules/employee/employee.types';

export class EmployeeEntity extends Entity<EmployeeProps> {
  protected constructor(props: CreateEntityProps<EmployeeProps>) {
    super(props);
  }

  static create(props: CreateEmployeeProps) {
    return new EmployeeEntity({
      id: props.id,
      props: {
        fullname: props.fullname,
        biography: props.biography ?? null,
        birthDate: props.birthDate ?? null,
        employmentDate: props.employmentDate,
        dismissalDate: props.dismissalDate ?? null,
        divisionId: props.divisionId,
        positionId: props.positionId ?? null,
        avatarId: props.avatarId ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  static recreate({ id, props }: RecreateEmployeeProps) {
    return new EmployeeEntity({ id, props });
  }

  dismiss(): EmployeeEntity {
    return EmployeeEntity.recreate({
      id: this._id,
      props: {
        ...this._props,
        dismissalDate: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  promote(positionId: string): EmployeeEntity {
    return EmployeeEntity.recreate({
      id: this._id,
      props: { ...this._props, positionId, updatedAt: new Date() },
    });
  }
}
