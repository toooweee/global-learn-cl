import { Injectable } from '@nestjs/common';
import { Mapper } from '@/libs/ddd/mapper.interface';
import { DepartmentEntity } from '@/modules/organization/department/domain/department.entity';
import { Department } from '@generated/client';
import { DepartmentResponseDto } from '@/modules/organization/department/presentation/dto/department.response.dto';

@Injectable()
export class DepartmentMapper implements Mapper<
  DepartmentEntity,
  Department,
  DepartmentResponseDto
> {
  toDomain(record: Department) {
    return DepartmentEntity.recreate({
      id: record.id,
      props: {
        name: record.name,
        isActive: record.isActive,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    });
  }

  toPersistence(entity: DepartmentEntity): Department {
    const props = entity.getProps();
    return {
      id: props.id,
      name: props.name,
      isActive: props.isActive,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  toResponse(entity: DepartmentEntity): DepartmentResponseDto {
    const props = entity.getProps();
    return new DepartmentResponseDto({
      id: props.id,
      name: props.name,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }
}
