import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseResponseDto } from '@/libs/api/dto';

export class EmployeeResponseDto extends BaseResponseDto {
  @ApiProperty()
  readonly fullname: string;

  @ApiPropertyOptional({ nullable: true })
  readonly biography: string | null;

  @ApiProperty()
  readonly employmentDate: string;

  @ApiPropertyOptional({ nullable: true })
  readonly dismissalDate: string | null;

  @ApiProperty()
  readonly divisionId: string;

  @ApiPropertyOptional({ nullable: true })
  readonly positionId: string | null;

  @ApiPropertyOptional({ nullable: true })
  readonly avatarId: string | null;

  constructor(props: {
    id: string;
    fullname: string;
    biography: string | null;
    employmentDate: Date;
    dismissalDate: Date | null;
    divisionId: string;
    positionId: string | null;
    avatarId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props);
    this.fullname = props.fullname;
    this.biography = props.biography;
    this.employmentDate = props.employmentDate.toISOString();
    this.dismissalDate = props.dismissalDate?.toISOString() ?? null;
    this.divisionId = props.divisionId;
    this.positionId = props.positionId;
    this.avatarId = props.avatarId;
  }
}
