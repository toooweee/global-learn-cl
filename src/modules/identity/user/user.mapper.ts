import { Injectable } from '@nestjs/common';
import { Mapper } from '@/libs/ddd/mapper.interface';
import { UserEntity } from '@/modules/identity/user/domain/user.entity';
import { User } from '@generated/client';
import { UserResponseDto } from '@/modules/identity/user/presentation/dto/user.response.dto';

@Injectable()
export class UserMapper implements Mapper<UserEntity, User, UserResponseDto> {
  toDomain(user: User) {
    return UserEntity.recreate({
      id: user.id,
      props: {
        email: user.email,
        hashedPassword: user.hashedPassword,
        roleId: user.roleId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  }

  toPersistence(user: UserEntity): User {
    const props = user.getProps();

    return {
      id: props.id,
      email: props.email,
      hashedPassword: props.hashedPassword,
      roleId: props.roleId,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
    };
  }

  toResponse(user: UserEntity): UserResponseDto {
    const props = user.getProps();

    return new UserResponseDto({
      id: props.id,
      email: props.email,
      roleId: props.roleId,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }
}
