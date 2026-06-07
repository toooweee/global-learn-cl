import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseResponseDto } from '@/libs/api/dto';

export class PositionResponseDto extends BaseResponseDto {
  @ApiProperty()
  readonly name: string;

  @ApiPropertyOptional({ nullable: true })
  readonly parentId: string | null;

  constructor(props: {
    id: string;
    name: string;
    parentId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props);
    this.name = props.name;
    this.parentId = props.parentId;
  }
}

export class PositionTreeDto {
  @ApiProperty()
  readonly id: string;

  @ApiProperty()
  readonly name: string;

  @ApiPropertyOptional({ nullable: true })
  readonly parentId: string | null;

  @ApiProperty({ type: () => [PositionTreeDto] })
  readonly children: PositionTreeDto[];

  constructor(props: {
    id: string;
    name: string;
    parentId: string | null;
    children: PositionTreeDto[];
  }) {
    this.id = props.id;
    this.name = props.name;
    this.parentId = props.parentId;
    this.children = props.children;
  }
}
