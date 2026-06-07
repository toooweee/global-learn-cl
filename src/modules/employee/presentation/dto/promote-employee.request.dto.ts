import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class PromoteEmployeeRequestDto {
  @ApiProperty({ example: '2cdc8ab1-6d50-49cc-ba14-54e4ac7ec231' })
  @IsUUID()
  positionId: string;
}
