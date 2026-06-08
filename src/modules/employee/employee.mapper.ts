import { Injectable } from '@nestjs/common';
import { ToPersistence, ToDomain } from '@/libs/ddd/mapper.interface';
import { EmployeeEntity } from '@/modules/employee/domain/employee.entity';
import { Employee } from '@generated/client';

@Injectable()
export class EmployeeMapper
  implements
    ToDomain<Employee, EmployeeEntity>,
    ToPersistence<EmployeeEntity, Employee>
{
  toDomain(record: Employee) {
    return EmployeeEntity.recreate({
      id: record.id,
      props: {
        fullname: record.fullname,
        biography: record.biography,
        birthDate: record.birthDate,
        employmentDate: record.employmentDate,
        dismissalDate: record.dismissalDate,
        divisionId: record.divisionId,
        positionId: record.positionId,
        avatarId: record.avatarId,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    });
  }

  toPersistence(entity: EmployeeEntity): Employee {
    const props = entity.getProps();
    return {
      id: props.id,
      fullname: props.fullname,
      biography: props.biography,
      birthDate: props.birthDate,
      employmentDate: props.employmentDate,
      dismissalDate: props.dismissalDate,
      divisionId: props.divisionId,
      positionId: props.positionId,
      avatarId: props.avatarId,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }
}
