import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ApplicationStatus } from '@generated/client';
import { IdResponseDto } from '@/libs/api/dto';
import { IdRequestDto } from '@/libs/api/dto/id.request.dto';
import { PaginatedQueryRequestDto } from '@/libs/api/dto/paginated.query.request.dto';
import { PaginatedResponseDto } from '@/libs/api/dto/paginated.response.dto';
import { Roles } from '@/libs/auth/decorators/roles.decorator';
import { ApplyForCourseCommand } from '@/modules/education/course-application/application/commands/apply-for-course/apply-for-course.command';
import { ApproveCourseApplicationCommand } from '@/modules/education/course-application/application/commands/approve-course-application/approve-course-application.command';
import { RejectCourseApplicationCommand } from '@/modules/education/course-application/application/commands/reject-course-application/reject-course-application.command';
import { FindApplicationsForCourseQuery } from '@/modules/education/course-application/application/queries/find-applications-for-course/find-applications-for-course.query';
import { FindMyApplicationsQuery } from '@/modules/education/course-application/application/queries/find-my-applications/find-my-applications.query';
import { CourseApplicationResponseDto } from './dto/course-application.response.dto';

class ApplicationsFilterQueryDto extends PaginatedQueryRequestDto {
  @ApiPropertyOptional({ enum: ApplicationStatus })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;
}

@ApiTags('course-applications')
@Controller()
export class CourseApplicationController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('courses/:id/applications')
  @ApiOperation({ summary: 'Apply for a course' })
  @ApiCreatedResponse({ type: IdResponseDto })
  apply(@Param() { id }: IdRequestDto): Promise<IdResponseDto> {
    return this.commandBus.execute(new ApplyForCourseCommand({ courseId: id }));
  }

  @Get('courses/:id/applications')
  @Roles('Admin')
  @ApiOperation({
    summary: 'List applications for a course (filterable by status)',
  })
  @ApiOkResponse({ type: PaginatedResponseDto })
  findForCourse(
    @Param() { id }: IdRequestDto,
    @Query() query: ApplicationsFilterQueryDto,
  ): Promise<PaginatedResponseDto<CourseApplicationResponseDto>> {
    return this.queryBus.execute(
      new FindApplicationsForCourseQuery({
        courseId: id,
        limit: query.limit,
        page: query.page,
        status: query.status,
      }),
    );
  }

  @Patch('courses/:id/applications/:appId/approve')
  @Roles('Admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Approve a course application' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  approve(@Param('appId') appId: string): Promise<void> {
    return this.commandBus.execute(
      new ApproveCourseApplicationCommand({ applicationId: appId }),
    );
  }

  @Patch('courses/:id/applications/:appId/reject')
  @Roles('Admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reject a course application' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  reject(@Param('appId') appId: string): Promise<void> {
    return this.commandBus.execute(
      new RejectCourseApplicationCommand({ applicationId: appId }),
    );
  }

  @Get('me/applications')
  @ApiOperation({ summary: 'List my course applications' })
  @ApiOkResponse({ type: PaginatedResponseDto })
  findMine(
    @Query() query: PaginatedQueryRequestDto,
  ): Promise<PaginatedResponseDto<CourseApplicationResponseDto>> {
    return this.queryBus.execute(
      new FindMyApplicationsQuery({ limit: query.limit, page: query.page }),
    );
  }
}
