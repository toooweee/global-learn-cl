import { ApiProperty } from '@nestjs/swagger';
import { EnrollmentStatus } from '@generated/client';
import { BaseResponseDto } from '@/libs/api/dto/base.response.dto';

export class StepProgressResponseDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' }) id: string;
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  stepId: string;
  @ApiProperty({ example: '2025-01-01T00:00:00.000Z', required: false })
  completedAt?: string;
  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' }) createdAt: string;

  constructor(props: {
    id: string;
    stepId: string;
    completedAt?: Date;
    createdAt: Date;
  }) {
    this.id = props.id;
    this.stepId = props.stepId;
    this.completedAt = props.completedAt?.toISOString();
    this.createdAt = props.createdAt.toISOString();
  }
}

export class EnrollmentResponseDto extends BaseResponseDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  courseId: string;
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  employeeId: string;
  @ApiProperty({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    required: false,
  })
  assignedById?: string;
  @ApiProperty({
    enum: EnrollmentStatus,
    example: EnrollmentStatus.IN_PROGRESS,
  })
  status: EnrollmentStatus;
  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' }) startedAt: string;
  @ApiProperty({ example: '2025-01-01T00:00:00.000Z', required: false })
  completedAt?: string;
  @ApiProperty({ type: [StepProgressResponseDto] })
  progress: StepProgressResponseDto[];

  constructor(props: {
    id: string;
    createdAt: Date;
    updatedAt?: Date;
    courseId: string;
    employeeId: string;
    assignedById?: string | null;
    status: EnrollmentStatus;
    startedAt: Date;
    completedAt?: Date;
    progress: {
      id: string;
      stepId: string;
      completedAt?: Date;
      createdAt: Date;
    }[];
  }) {
    super(props);
    this.courseId = props.courseId;
    this.employeeId = props.employeeId;
    this.assignedById = props.assignedById ?? undefined;
    this.status = props.status;
    this.startedAt = props.startedAt.toISOString();
    this.completedAt = props.completedAt?.toISOString();
    this.progress = props.progress.map((p) => new StepProgressResponseDto(p));
  }
}

export class EnrollmentSummaryResponseDto extends BaseResponseDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  courseId: string;
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  employeeId: string;
  @ApiProperty({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    required: false,
  })
  assignedById?: string;
  @ApiProperty({
    enum: EnrollmentStatus,
    example: EnrollmentStatus.IN_PROGRESS,
  })
  status: EnrollmentStatus;
  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' }) startedAt: string;
  @ApiProperty({ example: '2025-01-01T00:00:00.000Z', required: false })
  completedAt?: string;

  constructor(props: {
    id: string;
    createdAt: Date;
    updatedAt?: Date;
    courseId: string;
    employeeId: string;
    assignedById?: string | null;
    status: EnrollmentStatus;
    startedAt: Date;
    completedAt?: Date;
  }) {
    super(props);
    this.courseId = props.courseId;
    this.employeeId = props.employeeId;
    this.assignedById = props.assignedById ?? undefined;
    this.status = props.status;
    this.startedAt = props.startedAt.toISOString();
    this.completedAt = props.completedAt?.toISOString();
  }
}
