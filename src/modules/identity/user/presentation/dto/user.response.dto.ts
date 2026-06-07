import { BaseResponseDto, BaseResponseDtoProps } from '@/libs/api/dto';
import { ApiProperty } from '@nestjs/swagger';

interface UserResponseProps extends BaseResponseDtoProps {
  email: string;
  roleId: string;
}

export class UserResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'omega@gmail.com' })
  readonly email: string;

  @ApiProperty({ example: '2cdc8ab1-6d50-49cc-ba14-54e4ac7ec231' })
  readonly roleId: string;

  constructor(props: UserResponseProps) {
    super(props);
    this.email = props.email;
    this.roleId = props.roleId;
  }
}
