import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { StepType } from '@generated/client';

export class AddStepRequestDto {
  @ApiProperty() @IsString() @MinLength(1) name: string;
  @ApiProperty({ enum: StepType }) @IsEnum(StepType) type: StepType;
  @ApiProperty({ required: false }) @IsOptional() @IsUUID() lessonId?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsUUID() testId?: string;
}
