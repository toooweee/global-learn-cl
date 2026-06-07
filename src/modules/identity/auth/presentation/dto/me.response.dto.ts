import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '@/libs/api/dto';

export class MeResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'admin@company.com' })
  readonly email: string;

  @ApiProperty({ example: 'Admin' })
  readonly role: string;

  constructor(props: {
    id: string;
    email: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props);
    this.email = props.email;
    this.role = props.role;
  }
}
