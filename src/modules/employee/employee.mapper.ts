import { Injectable } from '@nestjs/common';
import { Mapper } from '@/libs/ddd/mapper.interface';
import { EmployeeEntity } from '@/modules/employee/domain/employee.entity';
import { Employee } from '@generated/client';
import { EmployeeResponseDto } from '@/modules/employee/presentation/dto/employee.response.dto';

@Injectable()
export class EmployeeMapper implements Mapper<
  EmployeeEntity,
  Employee,
  EmployeeResponseDto
> {
  toDomain(record: Employee) {
    return EmployeeEntity.recreate({
      id: record.id,
      props: {
        fullname: record.fullname,
        biography: record.biography,
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
      employmentDate: props.employmentDate,
      dismissalDate: props.dismissalDate,
      divisionId: props.divisionId,
      positionId: props.positionId,
      avatarId: props.avatarId,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  toResponse(entity: EmployeeEntity): EmployeeResponseDto {
    const props = entity.getProps();
    return new EmployeeResponseDto({
      id: props.id,
      fullname: props.fullname,
      biography: props.biography,
      employmentDate: props.employmentDate,
      dismissalDate: props.dismissalDate,
      divisionId: props.divisionId,
      positionId: props.positionId,
      avatarId: props.avatarId,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }
}
