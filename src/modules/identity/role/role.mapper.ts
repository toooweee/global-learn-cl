import { Injectable } from '@nestjs/common';
import { Mapper } from '@/libs/ddd/mapper.interface';
import { RoleEntity } from '@/modules/identity/role/domain/role.entity';
import { Role } from '@generated/client';
import { RoleResponseDto } from '@/modules/identity/role/presentation/dto/role.response.dto';

@Injectable()
export class RoleMapper implements Mapper<RoleEntity, Role, RoleResponseDto> {
  toDomain(record: Role): RoleEntity {
    return RoleEntity.recreate({
      id: record.id,
      props: {
        name: record.name,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    });
  }

  toPersistence(entity: RoleEntity): Role {
    const props = entity.getProps();
    return {
      id: props.id,
      name: props.name,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  toResponse(entity: RoleEntity): RoleResponseDto {
    const props = entity.getProps();
    return new RoleResponseDto({
      id: props.id,
      name: props.name,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }
}
