import { BaseResponseDto, BaseResponseDtoProps } from '@/libs/api/dto';
import { ApiProperty } from '@nestjs/swagger';

interface UserResponseProps extends BaseResponseDtoProps {
  email: string;
}

export class UserResponseDto extends BaseResponseDto {
  @ApiProperty({
    example: 'omega@gmail.com',
  })
  readonly email: string;

  constructor(props: UserResponseProps) {
    super(props);
    this.email = props.email;
  }
}
