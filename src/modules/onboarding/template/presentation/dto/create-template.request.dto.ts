import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
  ValidateNested,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
} from 'class-validator';
import { OnboardingStepType } from '@generated/client';

export class CreateOnboardingTemplateStepFeedbackOptionRequestDto {
  @IsString()
  @Length(1, 255)
  label!: string;
}

@ValidatorConstraint({ name: 'CourseIdRequiredForCourseStep', async: false })
class CourseIdRequiredForCourseStep implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments) {
    const obj = args.object as CreateOnboardingTemplateStepRequestDto;
    return obj.type !== OnboardingStepType.COURSE || !!obj.courseId;
  }
  defaultMessage() {
    return 'courseId is required when step type is COURSE';
  }
}

export class CreateOnboardingTemplateStepRequestDto {
  @IsInt()
  @Min(1)
  position!: number;

  @IsString()
  @Length(1, 255)
  name!: string;

  @IsString()
  description!: string;

  @IsEnum(OnboardingStepType)
  type!: OnboardingStepType;

  @IsOptional()
  @IsUUID()
  @Validate(CourseIdRequiredForCourseStep)
  courseId?: string;

  @IsInt()
  @Min(0)
  recommendedStartOffsetDays!: number;

  @IsInt()
  @Min(0)
  recommendedEndOffsetDays!: number;

  @IsOptional()
  @IsUUID()
  coverId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOnboardingTemplateStepFeedbackOptionRequestDto)
  feedbackOptions: CreateOnboardingTemplateStepFeedbackOptionRequestDto[] = [];
}

export class CreateOnboardingTemplateRequestDto {
  @IsString()
  @Length(1, 255)
  name!: string;

  @IsString()
  description!: string;

  @IsUUID()
  positionId!: string;

  @IsUUID()
  divisionId!: string;

  @IsOptional()
  @IsUUID()
  coverId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOnboardingTemplateStepRequestDto)
  steps!: CreateOnboardingTemplateStepRequestDto[];
}
