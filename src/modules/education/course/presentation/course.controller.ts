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
  ApiTags,
} from '@nestjs/swagger';
import { IdResponseDto } from '@/libs/api/dto';
import { IdRequestDto } from '@/libs/api/dto/id.request.dto';
import { PaginatedQueryRequestDto } from '@/libs/api/dto/paginated.query.request.dto';
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
import {
  CourseAnalyticsResponseDto,
  CoursesOverviewItemDto,
} from './dto/course-analytics.response.dto';
import { CreateFullCourseCommand } from '@/modules/education/course/application/commands/create-full-course/create-full-course.command';

@ApiTags('courses')
@Controller('courses')
export class CourseController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @Roles('Admin')
  @ApiOperation({ summary: 'Create a course' })
  @ApiCreatedResponse({ type: IdResponseDto })
  create(@Body() dto: CreateCourseRequestDto): Promise<IdResponseDto> {
    return this.commandBus.execute(
      new CreateCourseCommand({
        name: dto.name,
        description: dto.description,
        coverId: dto.coverId,
      }),
    );
  }

  @Post('full')
  @Roles('Admin')
  @ApiOperation({
    summary: 'Create a course with modules and steps atomically',
  })
  @ApiCreatedResponse({ type: IdResponseDto })
  createFull(@Body() dto: CreateFullCourseRequestDto): Promise<IdResponseDto> {
    return this.commandBus.execute(
      new CreateFullCourseCommand({
        name: dto.name,
        description: dto.description ?? '',
        coverId: dto.coverId,
        modules: dto.modules ?? [],
      }),
    );
  }

  @Get()
  @ApiOperation({ summary: 'List courses' })
  @ApiOkResponse({ type: PaginatedResponseDto })
  findAll(
    @Query() query: PaginatedQueryRequestDto,
  ): Promise<PaginatedResponseDto<CourseSummaryResponseDto>> {
    return this.queryBus.execute(
      new FindCoursesQuery({ limit: query.limit, page: query.page }),
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
  @Roles('Admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update course metadata' })
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
      }),
    );
  }

  @Delete(':id')
  @Roles('Admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a course' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  remove(@Param() { id }: IdRequestDto): Promise<void> {
    return this.commandBus.execute(new DeleteCourseCommand({ courseId: id }));
  }

  @Post(':id/modules')
  @Roles('Admin')
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
  @Roles('Admin')
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
  @Roles('Admin')
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
  @Roles('Admin')
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
}
