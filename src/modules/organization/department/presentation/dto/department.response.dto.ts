import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '@/libs/api/dto';

export class DepartmentResponseDto extends BaseResponseDto {
  @ApiProperty()
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
