import { Injectable } from '@nestjs/common';
import { Mapper } from '@/libs/ddd/mapper.interface';
import { DivisionEntity } from '@/modules/organization/division/domain/division.entity';
import { Division } from '@generated/client';
import { DivisionResponseDto } from '@/modules/organization/division/presentation/dto/division.response.dto';

@Injectable()
export class DivisionMapper implements Mapper<
  DivisionEntity,
  Division,
  DivisionResponseDto
> {
  toDomain(record: Division) {
    return DivisionEntity.recreate({
      id: record.id,
      props: {
        name: record.name,
        departmentId: record.departmentId,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    });
  }

  toPersistence(entity: DivisionEntity): Division {
    const props = entity.getProps();
    return {
      id: props.id,
      name: props.name,
      departmentId: props.departmentId,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  toResponse(entity: DivisionEntity): DivisionResponseDto {
    const props = entity.getProps();
    return new DivisionResponseDto({
      id: props.id,
      name: props.name,
      departmentId: props.departmentId,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }
}
