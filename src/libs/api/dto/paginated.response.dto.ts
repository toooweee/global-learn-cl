import { ApiProperty } from '@nestjs/swagger';

export class PaginatedResponseDto<T> {
  @ApiProperty({
    example: 5312,
    description: 'Total number of items',
  })
  readonly count: number;

  @ApiProperty({
    example: 10,
    description: 'Number of items per page',
  })
  readonly limit: number;

  @ApiProperty({ example: 1, description: 'Page number' })
  readonly page: number;

  @ApiProperty({ isArray: true })
  readonly data: readonly T[];

  constructor(props: PaginatedResponseDto<T>) {
    this.count = props.count;
    this.limit = props.limit;
    this.page = props.page;
    this.data = props.data;
  }
}
