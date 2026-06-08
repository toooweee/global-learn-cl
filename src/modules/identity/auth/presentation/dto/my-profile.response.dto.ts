import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseResponseDto } from '@/libs/api/dto';

export class MyProfileRoleDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  constructor(p: { id: string; name: string }) {
    this.id = p.id;
    this.name = p.name;
  }
}

export class MyProfileDepartmentDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  constructor(p: { id: string; name: string }) {
    this.id = p.id;
    this.name = p.name;
  }
}

export class MyProfileDivisionDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ type: MyProfileDepartmentDto })
  department: MyProfileDepartmentDto;
  constructor(p: {
    id: string;
    name: string;
    department: { id: string; name: string };
  }) {
    this.id = p.id;
    this.name = p.name;
    this.department = new MyProfileDepartmentDto(p.department);
  }
}

export class MyProfilePositionDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  constructor(p: { id: string; name: string }) {
    this.id = p.id;
    this.name = p.name;
  }
}

export class MyProfileEmployeeDto {
  @ApiProperty() id: string;
  @ApiProperty() fullname: string;
  @ApiPropertyOptional({ nullable: true }) biography: string | null;
  @ApiProperty() employmentDate: string;
  @ApiPropertyOptional({ nullable: true }) dismissalDate: string | null;
  @ApiPropertyOptional({ nullable: true }) avatarId: string | null;
  @ApiProperty({ type: MyProfileDivisionDto }) division: MyProfileDivisionDto;
  @ApiPropertyOptional({ type: MyProfilePositionDto, nullable: true })
  position: MyProfilePositionDto | null;

  constructor(p: {
    id: string;
    fullname: string;
    biography: string | null;
    employmentDate: Date;
    dismissalDate: Date | null;
    avatarId: string | null;
    division: {
      id: string;
      name: string;
      department: { id: string; name: string };
    };
    position: { id: string; name: string } | null;
  }) {
    this.id = p.id;
    this.fullname = p.fullname;
    this.biography = p.biography;
    this.employmentDate = p.employmentDate.toISOString();
    this.dismissalDate = p.dismissalDate?.toISOString() ?? null;
    this.avatarId = p.avatarId;
    this.division = new MyProfileDivisionDto(p.division);
    this.position = p.position ? new MyProfilePositionDto(p.position) : null;
  }
}

export class MyProfileResponseDto extends BaseResponseDto {
  @ApiProperty() email: string;
  @ApiProperty({ type: MyProfileRoleDto }) role: MyProfileRoleDto;
  @ApiPropertyOptional({ type: MyProfileEmployeeDto, nullable: true })
  employee: MyProfileEmployeeDto | null;

  constructor(props: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    email: string;
    role: { id: string; name: string };
    employee: {
      id: string;
      fullname: string;
      biography: string | null;
      employmentDate: Date;
      dismissalDate: Date | null;
      avatarId: string | null;
      division: {
        id: string;
        name: string;
        department: { id: string; name: string };
      };
      position: { id: string; name: string } | null;
    } | null;
  }) {
    super(props);
    this.email = props.email;
    this.role = new MyProfileRoleDto(props.role);
    this.employee = props.employee
      ? new MyProfileEmployeeDto(props.employee)
      : null;
  }
}
