import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '@/libs/api/dto';

export class DivisionResponseDto extends BaseResponseDto {
  @ApiProperty()
  readonly name: string;

  @ApiProperty()
  readonly departmentId: string;

  constructor(props: {
    id: string;
    name: string;
    departmentId: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props);
    this.name = props.name;
    this.departmentId = props.departmentId;
  }
}
