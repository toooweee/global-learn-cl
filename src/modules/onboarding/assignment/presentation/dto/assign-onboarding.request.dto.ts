import { Type } from 'class-transformer';
import {
  IsDate,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
} from 'class-validator';

@ValidatorConstraint({ name: 'EndAfterStart', async: false })
class EndAfterStart implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments) {
    const obj = args.object as AssignOnboardingRequestDto;
    return obj.endDate instanceof Date && obj.endDate > obj.startDate;
  }
  defaultMessage() {
    return 'endDate must be after startDate';
  }
}

export class AssignOnboardingRequestDto {
  @IsUUID()
  templateId!: string;

  @IsUUID()
  assignedToId!: string;

  @IsDate()
  @Type(() => Date)
  startDate!: Date;

  @IsDate()
  @Type(() => Date)
  @Validate(EndAfterStart)
  endDate!: Date;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  nameOverride?: string;

  @IsOptional()
  @IsString()
  descriptionOverride?: string;
}
