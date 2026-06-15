import { ApiProperty } from '@nestjs/swagger';
import { IdResponseDto } from '@/libs/api/dto/id.response.dto';

export interface BaseResponseDtoProps {
  id: string;
  // Accept string too: values read back from the Redis cache are JSON, so a
  // Date round-trips as an ISO string rather than a Date instance.
  createdAt: Date | string;
  updatedAt?: Date | string | null;
}

export class BaseResponseDto extends IdResponseDto {
  @ApiProperty({ example: '2025-11-24T17:43:15.970Z' })
  readonly createdAt: string;

  @ApiProperty({ example: '2025-11-24T17:43:15.970Z' })
  readonly updatedAt?: string;

  constructor(props: BaseResponseDtoProps) {
    super(props.id);
    this.createdAt = new Date(props.createdAt).toISOString();
    this.updatedAt = props.updatedAt
      ? new Date(props.updatedAt).toISOString()
      : undefined;
  }
}
