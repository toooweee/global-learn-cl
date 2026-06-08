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
import { CreateCourseRequestDto } from './dto/create-course.request.dto';
import { UpdateCourseRequestDto } from './dto/update-course.request.dto';
import { AddModuleRequestDto } from './dto/add-module.request.dto';
import { AddStepRequestDto } from './dto/add-step.request.dto';
import {
  CourseResponseDto,
  CourseSummaryResponseDto,
} from './dto/course.response.dto';

@ApiTags('courses')
@Controller('courses')
export class CourseController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @Roles('admin', 'manager')
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

  @Get(':id')
  @ApiOperation({ summary: 'Get course by ID' })
  @ApiOkResponse({ type: CourseResponseDto })
  @ApiNotFoundResponse()
  findOne(@Param() { id }: IdRequestDto): Promise<CourseResponseDto> {
    return this.queryBus.execute(new FindCourseQuery({ courseId: id }));
  }

  @Patch(':id')
  @Roles('admin', 'manager')
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
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a course' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  remove(@Param() { id }: IdRequestDto): Promise<void> {
    return this.commandBus.execute(new DeleteCourseCommand({ courseId: id }));
  }

  @Post(':id/modules')
  @Roles('admin', 'manager')
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
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a module from a course' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  removeModule(
    @Param() { id }: IdRequestDto,
    @Param('moduleId') moduleId: string,
  ): Promise<void> {
    return this.commandBus.execute(
      new RemoveModuleCommand({ courseId: id, moduleId }),
    );
  }

  @Post(':id/modules/:moduleId/steps')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Add a step to a module' })
  @ApiCreatedResponse({ type: IdResponseDto })
  @ApiNotFoundResponse()
  addStep(
    @Param() { id }: IdRequestDto,
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
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a step from a module' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  removeStep(
    @Param() { id }: IdRequestDto,
    @Param('moduleId') moduleId: string,
    @Param('stepId') stepId: string,
  ): Promise<void> {
    return this.commandBus.execute(
      new RemoveStepCommand({ courseId: id, moduleId, stepId }),
    );
  }
}
