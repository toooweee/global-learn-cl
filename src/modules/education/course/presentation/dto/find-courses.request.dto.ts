import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginatedQueryRequestDto } from '@/libs/api/dto/paginated.query.request.dto';
import { CourseScope } from '@/modules/education/course/course.types';

export class FindCoursesRequestDto extends PaginatedQueryRequestDto {
  @ApiPropertyOptional({ enum: CourseScope })
  @IsOptional()
  @IsEnum(CourseScope)
  scope?: CourseScope;

  @ApiPropertyOptional({
    description: 'Filter by department ID (for scope=DEPARTMENT)',
  })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({
    description: 'Filter by division ID (for scope=DIVISION)',
  })
  @IsOptional()
  @IsUUID()
  divisionId?: string;

  @ApiPropertyOptional({
    description:
      'Return only courses accessible to the current user based on their division/department',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  visibleToMe?: boolean;

  @ApiPropertyOptional({
    description: 'Include archived courses (default: false)',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeArchived?: boolean;
}
