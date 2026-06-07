import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Length } from 'class-validator';

export class CreateRoleRequestDto {
  @ApiProperty({ example: 'Manager' })
  @IsNotEmpty()
  @Length(1, 64)
  name: string;
}
