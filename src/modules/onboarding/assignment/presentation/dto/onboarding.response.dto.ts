import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OnboardingStatus, OnboardingStepType } from '@generated/client';
import { BaseResponseDto } from '@/libs/api/dto/base.response.dto';

export class OnboardingStepFeedbackOptionDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;
  @ApiProperty({ example: 'Ознакомился с процессами команды' })
  label: string;
  constructor(props: { id: string; label: string }) {
    this.id = props.id;
    this.label = props.label;
  }
}

export class OnboardingStepResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;
  @ApiProperty({ example: 1 })
  position: number;
  @ApiProperty({ example: 'Знакомство с командой' })
  name: string;
  @ApiProperty({ example: 'Описание шага' })
  description: string;
  @ApiProperty({ enum: OnboardingStepType, example: OnboardingStepType.TEXT })
  type: OnboardingStepType;
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  courseId?: string;
  @ApiProperty({ example: '2025-11-01T00:00:00.000Z' })
  recommendedStartDate: string;
  @ApiProperty({ example: '2025-11-07T00:00:00.000Z' })
  recommendedEndDate: string;
  @ApiPropertyOptional({ example: 'Всё прошло хорошо' })
  feedbackText?: string;
  @ApiPropertyOptional({ example: '2025-11-05T12:00:00.000Z' })
  completedAt?: string;
  @ApiProperty({ type: [OnboardingStepFeedbackOptionDto] })
  feedbackOptions: OnboardingStepFeedbackOptionDto[];
  @ApiProperty({ example: ['id1', 'id2'] })
  selectedOptionIds: string[];

  constructor(props: {
    id: string;
    position: number;
    name: string;
    description: string;
    type: OnboardingStepType;
    courseId?: string;
    recommendedStartDate: Date;
    recommendedEndDate: Date;
    feedbackText?: string;
    completedAt?: Date;
    feedbackOptions: { id: string; label: string }[];
    selectedOptionIds: string[];
  }) {
    this.id = props.id;
    this.position = props.position;
    this.name = props.name;
    this.description = props.description;
    this.type = props.type;
    this.courseId = props.courseId;
    this.recommendedStartDate = props.recommendedStartDate.toISOString();
    this.recommendedEndDate = props.recommendedEndDate.toISOString();
    this.feedbackText = props.feedbackText;
    this.completedAt = props.completedAt?.toISOString();
    this.feedbackOptions = props.feedbackOptions.map(
      (o) => new OnboardingStepFeedbackOptionDto(o),
    );
    this.selectedOptionIds = props.selectedOptionIds;
  }
}

export class OnboardingResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Онбординг — Backend Engineer' })
  name: string;
  @ApiProperty({ example: 'Программа адаптации для нового сотрудника' })
  description: string;
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  templateId?: string;
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  assignedById: string;
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  assignedToId: string;
  @ApiProperty({
    enum: OnboardingStatus,
    example: OnboardingStatus.IN_PROGRESS,
  })
  status: OnboardingStatus;
  @ApiProperty({ example: '2025-11-01T00:00:00.000Z' })
  startDate: string;
  @ApiProperty({ example: '2025-12-01T00:00:00.000Z' })
  endDate: string;
  @ApiPropertyOptional({ example: '2025-11-28T00:00:00.000Z' })
  completedAt?: string;
  @ApiProperty({ type: [OnboardingStepResponseDto] })
  steps: OnboardingStepResponseDto[];

  constructor(props: {
    id: string;
    name: string;
    description: string;
    templateId?: string;
    assignedById: string;
    assignedToId: string;
    status: OnboardingStatus;
    startDate: Date;
    endDate: Date;
    completedAt?: Date;
    steps: ConstructorParameters<typeof OnboardingStepResponseDto>[0][];
    createdAt: Date;
    updatedAt?: Date;
  }) {
    super({
      id: props.id,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
    this.name = props.name;
    this.description = props.description;
    this.templateId = props.templateId;
    this.assignedById = props.assignedById;
    this.assignedToId = props.assignedToId;
    this.status = props.status;
    this.startDate = props.startDate.toISOString();
    this.endDate = props.endDate.toISOString();
    this.completedAt = props.completedAt?.toISOString();
    this.steps = props.steps.map((s) => new OnboardingStepResponseDto(s));
  }
}

export class OnboardingSummaryResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Онбординг — Backend Engineer' })
  name: string;
  @ApiProperty({ example: 'Программа адаптации' })
  description: string;
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  assignedById: string;
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  assignedToId: string;
  @ApiProperty({
    enum: OnboardingStatus,
    example: OnboardingStatus.IN_PROGRESS,
  })
  status: OnboardingStatus;
  @ApiProperty({ example: '2025-11-01T00:00:00.000Z' })
  startDate: string;
  @ApiProperty({ example: '2025-12-01T00:00:00.000Z' })
  endDate: string;
  @ApiPropertyOptional({ example: '2025-11-28T00:00:00.000Z' })
  completedAt?: string;

  constructor(props: {
    id: string;
    name: string;
    description: string;
    assignedById: string;
    assignedToId: string;
    status: OnboardingStatus;
    startDate: Date;
    endDate: Date;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date | null;
  }) {
    super({
      id: props.id,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt ?? undefined,
    });
    this.name = props.name;
    this.description = props.description;
    this.assignedById = props.assignedById;
    this.assignedToId = props.assignedToId;
    this.status = props.status;
    this.startDate = props.startDate.toISOString();
    this.endDate = props.endDate.toISOString();
    this.completedAt = props.completedAt?.toISOString();
  }
}
