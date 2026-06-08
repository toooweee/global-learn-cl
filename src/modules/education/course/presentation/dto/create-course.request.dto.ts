import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { CourseScope } from '@/modules/education/course/course.types';

export class CreateCourseRequestDto {
  @ApiProperty() @IsString() @MinLength(1) name: string;
  @ApiProperty() @IsString() @MinLength(1) description: string;
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
}
