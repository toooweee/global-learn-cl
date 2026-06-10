import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubordinateEnrollmentDto {
  @ApiProperty() enrollmentId: string;
  @ApiProperty() courseId: string;
  @ApiProperty() courseName: string;
  @ApiProperty() status: string;
  @ApiProperty() completionRate: number;
  @ApiProperty() completedSteps: number;
  @ApiProperty() totalSteps: number;
  @ApiPropertyOptional() startedAt?: Date;
  @ApiPropertyOptional() completedAt?: Date;

  constructor(props: SubordinateEnrollmentDto) {
    Object.assign(this, props);
  }
}

export class SubordinateOnboardingDto {
  @ApiProperty() onboardingId: string;
  @ApiProperty() name: string;
  @ApiProperty() status: string;
  @ApiProperty() completedSteps: number;
  @ApiProperty() totalSteps: number;
  @ApiProperty() startDate: Date;
  @ApiProperty() endDate: Date;

  constructor(props: SubordinateOnboardingDto) {
    Object.assign(this, props);
  }
}

export class SubordinateDashboardItemDto {
  @ApiProperty() id: string;
  @ApiProperty() fullname: string;
  @ApiPropertyOptional() positionId?: string;
  @ApiPropertyOptional() positionName?: string;
  @ApiProperty() divisionId: string;
  @ApiProperty() divisionName: string;
  @ApiProperty({ type: [SubordinateEnrollmentDto] })
  enrollments: SubordinateEnrollmentDto[];
  @ApiPropertyOptional({ type: SubordinateOnboardingDto })
  activeOnboarding?: SubordinateOnboardingDto;

  constructor(props: SubordinateDashboardItemDto) {
    Object.assign(this, props);
  }
}

export class ManagerDashboardSummaryDto {
  @ApiProperty() totalSubordinates: number;
  @ApiProperty() activeEnrollments: number;
  @ApiProperty() completedEnrollments: number;
  @ApiProperty() activeOnboardings: number;
  @ApiProperty() completedOnboardings: number;

  constructor(props: ManagerDashboardSummaryDto) {
    Object.assign(this, props);
  }
}

export class ManagerDashboardResponseDto {
  @ApiProperty({ type: ManagerDashboardSummaryDto })
  summary: ManagerDashboardSummaryDto;
  @ApiProperty({ type: [SubordinateDashboardItemDto] })
  subordinates: SubordinateDashboardItemDto[];

  constructor(props: ManagerDashboardResponseDto) {
    Object.assign(this, props);
  }
}
