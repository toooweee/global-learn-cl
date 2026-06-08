import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { CourseScope } from '@/modules/education/course/course.types';

export class UpdateCourseRequestDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(1) name?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsUUID() coverId?:
    | string
    | null;
  @ApiPropertyOptional({ enum: CourseScope })
  @IsOptional()
  @IsEnum(CourseScope)
  scope?: CourseScope;
  @ApiPropertyOptional({
    nullable: true,
    description: 'Required when scope=DEPARTMENT',
  })
  @IsOptional()
  @IsUUID()
  departmentId?: string | null;
  @ApiPropertyOptional({
    nullable: true,
    description: 'Required when scope=DIVISION',
  })
  @IsOptional()
  @IsUUID()
  divisionId?: string | null;
}
