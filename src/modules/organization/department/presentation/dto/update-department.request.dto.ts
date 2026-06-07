import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Length } from 'class-validator';

export class UpdateDepartmentRequestDto {
  @ApiProperty({ example: 'Engineering' })
  @IsNotEmpty()
  @Length(1, 255)
  name: string;
}
