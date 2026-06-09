import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OnboardingStepType } from '@generated/client';
import { BaseResponseDto } from '@/libs/api/dto/base.response.dto';

export class OnboardingTemplateStepFeedbackOptionResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;
  @ApiProperty({ example: 'Изучил документацию' })
  label: string;
  constructor(props: { id: string; label: string }) {
    this.id = props.id;
    this.label = props.label;
  }
}

export class OnboardingTemplateStepResponseDto {
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
  @ApiProperty({ example: 0 })
  recommendedStartOffsetDays: number;
  @ApiProperty({ example: 7 })
  recommendedEndOffsetDays: number;
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  coverId?: string;
  @ApiProperty({ type: [OnboardingTemplateStepFeedbackOptionResponseDto] })
  feedbackOptions: OnboardingTemplateStepFeedbackOptionResponseDto[];

  constructor(props: {
    id: string;
    position: number;
    name: string;
    description: string;
    type: OnboardingStepType;
    courseId?: string | null;
    recommendedStartOffsetDays: number;
    recommendedEndOffsetDays: number;
    coverId?: string | null;
    feedbackOptions: { id: string; label: string }[];
  }) {
    this.id = props.id;
    this.position = props.position;
    this.name = props.name;
    this.description = props.description;
    this.type = props.type;
    this.courseId = props.courseId ?? undefined;
    this.recommendedStartOffsetDays = props.recommendedStartOffsetDays;
    this.recommendedEndOffsetDays = props.recommendedEndOffsetDays;
    this.coverId = props.coverId ?? undefined;
    this.feedbackOptions = props.feedbackOptions.map(
      (o) => new OnboardingTemplateStepFeedbackOptionResponseDto(o),
    );
  }
}

export class OnboardingTemplateResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Онбординг Backend Engineer' })
  name: string;
  @ApiProperty({ example: 'Программа адаптации' })
  description: string;
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  positionId?: string;
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  divisionId: string;
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  coverId?: string;
  @ApiProperty({ type: [OnboardingTemplateStepResponseDto] })
  steps: OnboardingTemplateStepResponseDto[];

  constructor(props: {
    id: string;
    name: string;
    description: string;
    positionId?: string | null;
    divisionId: string;
    coverId?: string | null;
    steps: ConstructorParameters<typeof OnboardingTemplateStepResponseDto>[0][];
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
    this.positionId = props.positionId ?? undefined;
    this.divisionId = props.divisionId;
    this.coverId = props.coverId ?? undefined;
    this.steps = props.steps.map(
      (s) => new OnboardingTemplateStepResponseDto(s),
    );
  }
}

export class OnboardingTemplateSummaryResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Онбординг Backend Engineer' })
  name: string;
  @ApiProperty({ example: 'Программа адаптации' })
  description: string;
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  positionId?: string;
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  divisionId: string;
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  coverId?: string;
  @ApiProperty({ example: 5 })
  stepCount: number;

  constructor(props: {
    id: string;
    name: string;
    description: string;
    positionId?: string | null;
    divisionId: string;
    coverId: string | null;
    stepCount: number;
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
    this.positionId = props.positionId ?? undefined;
    this.divisionId = props.divisionId;
    this.coverId = props.coverId ?? undefined;
    this.stepCount = props.stepCount;
  }
}
