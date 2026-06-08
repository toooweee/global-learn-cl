import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { StepType } from '@generated/client';
import { CourseScope } from '@/modules/education/course/course.types';

export class FullCourseStepDto {
  @ApiProperty() @IsString() @MinLength(1) name: string;
  @ApiProperty({ enum: StepType }) @IsEnum(StepType) type: StepType;
  @ApiPropertyOptional() @IsOptional() @IsUUID() lessonId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() testId?: string;
}

export class FullCourseModuleDto {
  @ApiProperty() @IsString() @MinLength(1) name: string;

  @ApiPropertyOptional({ type: [FullCourseStepDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FullCourseStepDto)
  steps?: FullCourseStepDto[];
}

export class CreateFullCourseRequestDto {
  @ApiProperty() @IsString() @MinLength(1) name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: CourseScope, default: CourseScope.ALL })
  @IsOptional()
  @IsEnum(CourseScope)
  scope?: CourseScope;
  @ApiPropertyOptional({ description: 'Required when scope=DEPARTMENT' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;
  @ApiPropertyOptional({ description: 'Required when scope=DIVISION' })
  @IsOptional()
  @IsUUID()
  divisionId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() coverId?: string;

  @ApiPropertyOptional({ type: [FullCourseModuleDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FullCourseModuleDto)
  modules?: FullCourseModuleDto[];
}
