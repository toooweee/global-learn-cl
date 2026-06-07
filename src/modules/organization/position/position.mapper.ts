import { Injectable } from '@nestjs/common';
import { Mapper } from '@/libs/ddd/mapper.interface';
import { PositionEntity } from '@/modules/organization/position/domain/position.entity';
import { Position } from '@generated/client';
import { PositionResponseDto } from '@/modules/organization/position/presentation/dto/position.response.dto';

@Injectable()
export class PositionMapper implements Mapper<
  PositionEntity,
  Position,
  PositionResponseDto
> {
  toDomain(record: Position) {
    return PositionEntity.recreate({
      id: record.id,
      props: {
        name: record.name,
        parentId: record.parentId,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    });
  }

  toPersistence(entity: PositionEntity): Position {
    const props = entity.getProps();
    return {
      id: props.id,
      name: props.name,
      parentId: props.parentId,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  toResponse(entity: PositionEntity): PositionResponseDto {
    const props = entity.getProps();
    return new PositionResponseDto({
      id: props.id,
      name: props.name,
      parentId: props.parentId,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }
}
