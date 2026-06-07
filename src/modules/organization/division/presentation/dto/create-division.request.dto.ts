import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, Length } from 'class-validator';

export class CreateDivisionRequestDto {
  @ApiProperty({ example: 'Platform' })
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @ApiProperty({ example: '2cdc8ab1-6d50-49cc-ba14-54e4ac7ec231' })
  @IsUUID()
  departmentId: string;
}
