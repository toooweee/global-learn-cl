import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubordinateTreeEmployeeDto {
  @ApiProperty() id: string;
  @ApiProperty() fullname: string;
  @ApiProperty() email: string;
  @ApiPropertyOptional({ nullable: true }) avatarId: string | null;
  @ApiProperty() divisionId: string;
  @ApiProperty() divisionName: string;
  @ApiProperty() departmentId: string;

  constructor(props: {
    id: string;
    fullname: string;
    email: string;
    avatarId: string | null;
    divisionId: string;
    divisionName: string;
    departmentId: string;
  }) {
    this.id = props.id;
    this.fullname = props.fullname;
    this.email = props.email;
    this.avatarId = props.avatarId;
    this.divisionId = props.divisionId;
    this.divisionName = props.divisionName;
    this.departmentId = props.departmentId;
  }
}

export class SubordinateTreeNodeDto {
  @ApiProperty() positionId: string;
  @ApiProperty() positionName: string;
  @ApiProperty({ type: () => [SubordinateTreeEmployeeDto] })
  employees: SubordinateTreeEmployeeDto[];
  @ApiProperty({ type: () => [SubordinateTreeNodeDto] })
  children: SubordinateTreeNodeDto[];

  constructor(props: {
    positionId: string;
    positionName: string;
    employees: SubordinateTreeEmployeeDto[];
    children: SubordinateTreeNodeDto[];
  }) {
    this.positionId = props.positionId;
    this.positionName = props.positionName;
    this.employees = props.employees;
    this.children = props.children;
  }
}
