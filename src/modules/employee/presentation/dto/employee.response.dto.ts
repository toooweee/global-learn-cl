import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseResponseDto } from '@/libs/api/dto';

export class RoleSummaryDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  constructor(props: { id: string; name: string }) {
    this.id = props.id;
    this.name = props.name;
  }
}

export class DepartmentSummaryDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  constructor(props: { id: string; name: string }) {
    this.id = props.id;
    this.name = props.name;
  }
}

export class EmployeeResponseDto extends BaseResponseDto {
  @ApiProperty() readonly fullname: string;
  @ApiPropertyOptional({ nullable: true }) readonly biography: string | null;
  @ApiProperty() readonly employmentDate: string;
  @ApiPropertyOptional({ nullable: true }) readonly dismissalDate:
    | string
    | null;
  @ApiProperty() readonly divisionId: string;
  @ApiPropertyOptional({ nullable: true }) readonly positionId: string | null;
  @ApiPropertyOptional({ nullable: true }) readonly avatarId: string | null;
  @ApiProperty() readonly email: string;
  @ApiProperty({ type: RoleSummaryDto }) readonly role: RoleSummaryDto;
  @ApiProperty({ type: DepartmentSummaryDto })
  readonly department: DepartmentSummaryDto;

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
    email: string;
    role: { id: string; name: string };
    department: { id: string; name: string };
  }) {
    super(props);
    this.fullname = props.fullname;
    this.biography = props.biography;
    this.employmentDate = props.employmentDate.toISOString();
    this.dismissalDate = props.dismissalDate?.toISOString() ?? null;
    this.divisionId = props.divisionId;
    this.positionId = props.positionId;
    this.avatarId = props.avatarId;
    this.email = props.email;
    this.role = new RoleSummaryDto(props.role);
    this.department = new DepartmentSummaryDto(props.department);
  }
}
