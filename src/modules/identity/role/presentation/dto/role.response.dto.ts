import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '@/libs/api/dto';

export class RoleResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Admin' })
  readonly name: string;

  constructor(props: {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props);
    this.name = props.name;
  }
}
