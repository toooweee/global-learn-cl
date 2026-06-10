import {
  Body,
  Controller,
  Delete,
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
import { IdResponseDto } from '@/libs/api/dto';
import { IdRequestDto } from '@/libs/api/dto/id.request.dto';
import { PaginatedQueryRequestDto } from '@/libs/api/dto/paginated.query.request.dto';
import { FindCoursesRequestDto } from './dto/find-courses.request.dto';
import { PaginatedResponseDto } from '@/libs/api/dto/paginated.response.dto';
import { Roles } from '@/libs/auth/decorators/roles.decorator';
import { CreateCourseCommand } from '@/modules/education/course/application/commands/create-course/create-course.command';
import { UpdateCourseCommand } from '@/modules/education/course/application/commands/update-course/update-course.command';
import { DeleteCourseCommand } from '@/modules/education/course/application/commands/delete-course/delete-course.command';
import { AddModuleCommand } from '@/modules/education/course/application/commands/add-module/add-module.command';
import { RemoveModuleCommand } from '@/modules/education/course/application/commands/remove-module/remove-module.command';
import { AddStepCommand } from '@/modules/education/course/application/commands/add-step/add-step.command';
import { RemoveStepCommand } from '@/modules/education/course/application/commands/remove-step/remove-step.command';
import { FindCourseQuery } from '@/modules/education/course/application/queries/find-course/find-course.query';
import { FindCoursesQuery } from '@/modules/education/course/application/queries/find-courses/find-courses.query';
import { GetCoursesOverviewQuery } from '@/modules/education/course/application/queries/get-courses-overview/get-courses-overview.query';
import { GetCourseAnalyticsQuery } from '@/modules/education/course/application/queries/get-course-analytics/get-course-analytics.query';
import { CreateCourseRequestDto } from './dto/create-course.request.dto';
import { CreateFullCourseRequestDto } from './dto/create-full-course.request.dto';
import { UpdateCourseRequestDto } from './dto/update-course.request.dto';
import { AddModuleRequestDto } from './dto/add-module.request.dto';
import { AddStepRequestDto } from './dto/add-step.request.dto';
import {
  CourseResponseDto,
  CourseSummaryResponseDto,
} from './dto/course.response.dto';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import {
  CourseAnalyticsResponseDto,
  CoursesOverviewItemDto,
} from './dto/course-analytics.response.dto';
import { CreateFullCourseCommand } from '@/modules/education/course/application/commands/create-full-course/create-full-course.command';
import { ArchiveCourseCommand } from '@/modules/education/course/application/commands/archive-course/archive-course.command';
import { SubmitCourseForReviewCommand } from '@/modules/education/course/application/commands/submit-course-for-review/submit-course-for-review.command';
import { PublishCourseCommand } from '@/modules/education/course/application/commands/publish-course/publish-course.command';
import { RejectCourseCommand } from '@/modules/education/course/application/commands/reject-course/reject-course.command';
import { GenerateCourseTestCommand } from '@/modules/education/test-definition/application/commands/generate-course-test/generate-course-test.command';
import { GenerateModuleTestCommand } from '@/modules/education/test-definition/application/commands/generate-module-test/generate-module-test.command';
import { GenerateFinalTestRequestDto } from '@/modules/education/test-definition/presentation/dto/test-definition.request.dto';
import { FindCourseQuestionsQuery } from '@/modules/education/test-definition/application/queries/find-course-questions/find-course-questions.query';
import { CourseQuestionResponseDto } from '@/modules/education/test-definition/presentation/dto/test-definition.response.dto';

class RejectCourseRequestDto {
  @ApiPropertyOptional({ description: 'Rejection reason visible to author' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

@ApiTags('courses')
@Controller('courses')
export class CourseController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @Roles('admin', 'department_head', 'division_head')
  @ApiOperation({
    summary:
      'Create a course (Admin → PUBLISHED immediately; Manager → DRAFT, must submit for review)',
  })
  @ApiCreatedResponse({ type: IdResponseDto })
  create(@Body() dto: CreateCourseRequestDto): Promise<IdResponseDto> {
    return this.commandBus.execute(
      new CreateCourseCommand({
        name: dto.name,
        description: dto.description,
        scope: dto.scope,
        departmentId: dto.departmentId,
        divisionId: dto.divisionId,
        coverId: dto.coverId,
      }),
    );
  }

  @Post('full')
  @Roles('admin', 'department_head', 'division_head')
  @ApiOperation({
    summary:
      'Create a course with modules and steps atomically (Admin → PUBLISHED; Manager → DRAFT)',
  })
  @ApiCreatedResponse({ type: IdResponseDto })
  createFull(@Body() dto: CreateFullCourseRequestDto): Promise<IdResponseDto> {
    return this.commandBus.execute(
      new CreateFullCourseCommand({
        name: dto.name,
        description: dto.description ?? '',
        scope: dto.scope,
        departmentId: dto.departmentId,
        divisionId: dto.divisionId,
        coverId: dto.coverId,
        modules: dto.modules ?? [],
      }),
    );
  }

  @Get()
  @ApiOperation({
    summary:
      'List courses (filtered by scope, department, division, visibleToMe, includeArchived)',
  })
  @ApiOkResponse({ type: PaginatedResponseDto })
  findAll(
    @Query() query: FindCoursesRequestDto,
  ): Promise<PaginatedResponseDto<CourseSummaryResponseDto>> {
    return this.queryBus.execute(
      new FindCoursesQuery({
        limit: query.limit,
        page: query.page,
        search: query.search,
        authorId: query.authorId,
        scope: query.scope,
        departmentId: query.departmentId,
        divisionId: query.divisionId,
        visibleToMe: query.visibleToMe,
        includeArchived: query.includeArchived,
      }),
    );
  }

  @Get('analytics')
  @ApiOperation({
    summary: 'Courses enrollment overview (paginated, with completion rates)',
  })
  @ApiOkResponse({ type: PaginatedResponseDto })
  getCoursesOverview(
    @Query() query: PaginatedQueryRequestDto,
  ): Promise<PaginatedResponseDto<CoursesOverviewItemDto>> {
    return this.queryBus.execute(
      new GetCoursesOverviewQuery({ limit: query.limit, page: query.page }),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course by ID' })
  @ApiOkResponse({ type: CourseResponseDto })
  @ApiNotFoundResponse()
  findOne(@Param() { id }: IdRequestDto): Promise<CourseResponseDto> {
    return this.queryBus.execute(new FindCourseQuery({ courseId: id }));
  }

  @Get(':id/analytics')
  @ApiOperation({
    summary:
      'Course analytics: enrollment stats broken down by division and department',
  })
  @ApiOkResponse({ type: CourseAnalyticsResponseDto })
  @ApiNotFoundResponse()
  getCourseAnalytics(
    @Param() { id }: IdRequestDto,
  ): Promise<CourseAnalyticsResponseDto> {
    return this.queryBus.execute(new GetCourseAnalyticsQuery({ courseId: id }));
  }

  @Patch(':id')
  @Roles('admin', 'department_head', 'division_head')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Update course metadata (Manager can only update own courses)',
  })
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  update(
    @Param() { id }: IdRequestDto,
    @Body() dto: UpdateCourseRequestDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new UpdateCourseCommand({
        courseId: id,
        name: dto.name,
        description: dto.description,
        coverId: dto.coverId,
        scope: dto.scope,
        departmentId: dto.departmentId,
        divisionId: dto.divisionId,
      }),
    );
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a course' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  remove(@Param() { id }: IdRequestDto): Promise<void> {
    return this.commandBus.execute(new DeleteCourseCommand({ courseId: id }));
  }

  @Patch(':id/submit')
  @Roles('admin', 'department_head', 'division_head')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Submit a DRAFT course for admin review (author or Admin)',
  })
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  submitForReview(@Param() { id }: IdRequestDto): Promise<void> {
    return this.commandBus.execute(
      new SubmitCourseForReviewCommand({ courseId: id }),
    );
  }

  @Patch(':id/publish')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Publish a PENDING_REVIEW course (Admin only)' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  publish(@Param() { id }: IdRequestDto): Promise<void> {
    return this.commandBus.execute(new PublishCourseCommand({ courseId: id }));
  }

  @Patch(':id/reject')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Reject a PENDING_REVIEW course with optional note (Admin only)',
  })
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  reject(
    @Param() { id }: IdRequestDto,
    @Body() dto: RejectCourseRequestDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new RejectCourseCommand({ courseId: id, note: dto.note }),
    );
  }

  @Patch(':id/archive')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive a course (hides it from listings)' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  archive(@Param() { id }: IdRequestDto): Promise<void> {
    return this.commandBus.execute(
      new ArchiveCourseCommand({ courseId: id, archive: true }),
    );
  }

  @Patch(':id/unarchive')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unarchive a course' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  unarchive(@Param() { id }: IdRequestDto): Promise<void> {
    return this.commandBus.execute(
      new ArchiveCourseCommand({ courseId: id, archive: false }),
    );
  }

  @Post(':id/modules')
  @Roles('admin', 'department_head', 'division_head')
  @ApiOperation({ summary: 'Add a module to a course' })
  @ApiCreatedResponse({ type: IdResponseDto })
  @ApiNotFoundResponse()
  addModule(
    @Param() { id }: IdRequestDto,
    @Body() dto: AddModuleRequestDto,
  ): Promise<IdResponseDto> {
    return this.commandBus.execute(
      new AddModuleCommand({ courseId: id, name: dto.name }),
    );
  }

  @Delete(':id/modules/:moduleId')
  @Roles('admin', 'department_head', 'division_head')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a module from a course' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  removeModule(
    @Param('id') id: string,
    @Param('moduleId') moduleId: string,
  ): Promise<void> {
    return this.commandBus.execute(
      new RemoveModuleCommand({ courseId: id, moduleId }),
    );
  }

  @Post(':id/modules/:moduleId/steps')
  @Roles('admin', 'department_head', 'division_head')
  @ApiOperation({ summary: 'Add a step to a module' })
  @ApiCreatedResponse({ type: IdResponseDto })
  @ApiNotFoundResponse()
  addStep(
    @Param('id') id: string,
    @Param('moduleId') moduleId: string,
    @Body() dto: AddStepRequestDto,
  ): Promise<IdResponseDto> {
    return this.commandBus.execute(
      new AddStepCommand({
        courseId: id,
        moduleId,
        name: dto.name,
        type: dto.type,
        lessonId: dto.lessonId,
        testId: dto.testId,
      }),
    );
  }

  @Delete(':id/modules/:moduleId/steps/:stepId')
  @Roles('admin', 'department_head', 'division_head')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a step from a module' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  removeStep(
    @Param('id') id: string,
    @Param('moduleId') moduleId: string,
    @Param('stepId') stepId: string,
  ): Promise<void> {
    return this.commandBus.execute(
      new RemoveStepCommand({ courseId: id, moduleId, stepId }),
    );
  }

  @Post(':id/generate-test')
  @Roles('admin')
  @ApiOperation({
    summary:
      'Create a final test for the whole course from its question bank. Name: "Итоговый тест по {courseName}". Returns the new test ID.',
  })
  @ApiCreatedResponse({ type: IdResponseDto })
  @ApiNotFoundResponse()
  generateCourseTest(
    @Param() { id }: IdRequestDto,
    @Body() dto: GenerateFinalTestRequestDto,
  ): Promise<IdResponseDto> {
    return this.commandBus.execute(
      new GenerateCourseTestCommand({
        courseId: id,
        count: dto.count,
        passingPercent: dto.passingPercent,
      }),
    );
  }

  @Post(':id/modules/:moduleId/generate-test')
  @Roles('admin')
  @ApiOperation({
    summary:
      'Create a final test for a single module from its question bank. Name: "Итоговый тест по модулю {moduleName}". Returns the new test ID.',
  })
  @ApiCreatedResponse({ type: IdResponseDto })
  @ApiNotFoundResponse()
  generateModuleTest(
    @Param('id') id: string,
    @Param('moduleId') moduleId: string,
    @Body() dto: GenerateFinalTestRequestDto,
  ): Promise<IdResponseDto> {
    return this.commandBus.execute(
      new GenerateModuleTestCommand({
        courseId: id,
        moduleId,
        count: dto.count,
        passingPercent: dto.passingPercent,
      }),
    );
  }

  @Get(':id/modules/:moduleId/questions')
  @Roles('admin')
  @ApiOperation({
    summary:
      'List question bank for a specific module (subset of the course bank)',
  })
  @ApiOkResponse({ type: [CourseQuestionResponseDto] })
  @ApiNotFoundResponse()
  findModuleQuestions(
    @Param('id') id: string,
    @Param('moduleId') moduleId: string,
  ): Promise<CourseQuestionResponseDto[]> {
    return this.queryBus.execute(
      new FindCourseQuestionsQuery({ courseId: id, moduleId }),
    );
  }
}
