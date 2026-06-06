import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class IdRequestDto {
  @ApiProperty({
    example: 'b381a598-de67-4045-b332-c208589e2823',
  })
  @IsUUID()
  id: string;
}
