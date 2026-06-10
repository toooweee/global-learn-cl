import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsUUID,
} from 'class-validator';

export class BulkEnrollRequestDto {
  @ApiProperty({
    type: [String],
    description: 'List of employee IDs to enroll (1–100)',
    example: ['uuid-1', 'uuid-2'],
  })
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ArrayUnique()
  employeeIds: string[];
}
