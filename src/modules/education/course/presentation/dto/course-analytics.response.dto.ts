import { ApiProperty } from '@nestjs/swagger';

export class EnrollmentStatsDto {
  @ApiProperty() total: number;
  @ApiProperty() inProgress: number;
  @ApiProperty() completed: number;
  @ApiProperty() cancelled: number;
  @ApiProperty() completionRate: number;

  constructor(props: EnrollmentStatsDto) {
    this.total = props.total;
    this.inProgress = props.inProgress;
    this.completed = props.completed;
    this.cancelled = props.cancelled;
    this.completionRate = props.completionRate;
  }
}

export class DivisionEnrollmentDto {
  @ApiProperty() divisionId: string;
  @ApiProperty() divisionName: string;
  @ApiProperty() total: number;
  @ApiProperty() completed: number;
  @ApiProperty() completionRate: number;

  constructor(props: DivisionEnrollmentDto) {
    Object.assign(this, props);
  }
}

export class DepartmentEnrollmentDto {
  @ApiProperty() departmentId: string;
  @ApiProperty() departmentName: string;
  @ApiProperty() total: number;
  @ApiProperty() completed: number;
  @ApiProperty() completionRate: number;

  constructor(props: DepartmentEnrollmentDto) {
    Object.assign(this, props);
  }
}

export class CourseAnalyticsResponseDto {
  @ApiProperty() courseId: string;
  @ApiProperty() courseName: string;
  @ApiProperty({ type: EnrollmentStatsDto }) enrollments: EnrollmentStatsDto;
  @ApiProperty({ type: [DivisionEnrollmentDto] })
  byDivision: DivisionEnrollmentDto[];
  @ApiProperty({ type: [DepartmentEnrollmentDto] })
  byDepartment: DepartmentEnrollmentDto[];

  constructor(props: CourseAnalyticsResponseDto) {
    Object.assign(this, props);
  }
}

export class CoursesOverviewItemDto {
  @ApiProperty() courseId: string;
  @ApiProperty() courseName: string;
  @ApiProperty() totalEnrollments: number;
  @ApiProperty() inProgress: number;
  @ApiProperty() completed: number;
  @ApiProperty() cancelled: number;
  @ApiProperty() completionRate: number;

  constructor(props: CoursesOverviewItemDto) {
    Object.assign(this, props);
  }
}
