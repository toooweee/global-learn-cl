import { ApiProperty } from '@nestjs/swagger';
import { IdResponseDto } from '@/libs/api/dto/id.response.dto';

export interface ResponseBaseProps {
  id: string;
  createdAt: Date;
  updatedAt?: Date;
}

export class BaseResponseDto extends IdResponseDto {
  @ApiProperty({ example: '2025-11-24T17:43:15.970Z' })
  readonly createdAt: string;

  @ApiProperty({ example: '2025-11-24T17:43:15.970Z' })
  readonly updatedAt?: string;

  constructor(props: ResponseBaseProps) {
    super(props.id);
    this.createdAt = props.createdAt.toISOString();
    this.updatedAt = props.updatedAt?.toISOString();
  }
}
