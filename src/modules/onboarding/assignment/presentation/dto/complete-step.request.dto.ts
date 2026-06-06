import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
} from 'class-validator';

@ValidatorConstraint({ name: 'FeedbackPresent', async: false })
class FeedbackPresent implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments) {
    const obj = args.object as CompleteOnboardingStepRequestDto;
    const text = obj.feedbackText?.trim();
    return (obj.selectedOptionIds?.length ?? 0) > 0 || !!(text && text.length);
  }
  defaultMessage() {
    return 'Provide at least one selected option or feedbackText';
  }
}

export class CompleteOnboardingStepRequestDto {
  @IsUUID()
  stepId!: string;

  @IsArray()
  @IsUUID('all', { each: true })
  @Validate(FeedbackPresent)
  selectedOptionIds: string[] = [];

  @IsOptional()
  @IsString()
  feedbackText?: string;
}
