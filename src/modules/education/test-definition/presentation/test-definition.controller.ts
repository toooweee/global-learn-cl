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
import { Roles } from '@/libs/auth/decorators/roles.decorator';
import { CreateTestDefinitionCommand } from '@/modules/education/test-definition/application/commands/create-test-definition/create-test-definition.command';
import { UpdateTestDefinitionCommand } from '@/modules/education/test-definition/application/commands/update-test-definition/update-test-definition.command';
import { DeleteTestDefinitionCommand } from '@/modules/education/test-definition/application/commands/delete-test-definition/delete-test-definition.command';
import { AddQuestionToTestCommand } from '@/modules/education/test-definition/application/commands/add-question-to-test/add-question-to-test.command';
import { RemoveQuestionFromTestCommand } from '@/modules/education/test-definition/application/commands/remove-question-from-test/remove-question-from-test.command';
import { CreateCourseQuestionCommand } from '@/modules/education/test-definition/application/commands/create-course-question/create-course-question.command';
import { DeleteCourseQuestionCommand } from '@/modules/education/test-definition/application/commands/delete-course-question/delete-course-question.command';
import { FindTestDefinitionQuery } from '@/modules/education/test-definition/application/queries/find-test-definition/find-test-definition.query';
import { FindCourseQuestionsQuery } from '@/modules/education/test-definition/application/queries/find-course-questions/find-course-questions.query';
import {
  AddQuestionToTestRequestDto,
  CreateCourseQuestionRequestDto,
  TestDefinitionRequestDto,
} from './dto/test-definition.request.dto';
import {
  CourseQuestionResponseDto,
  TestDefinitionResponseDto,
} from './dto/test-definition.response.dto';

@ApiTags('tests')
@Controller()
@Roles('admin', 'manager')
export class TestDefinitionController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // ── Test definition CRUD ─────────────────────────────────────────────────

  @Post('test-definitions')
  @ApiOperation({ summary: 'Create a test definition' })
  @ApiCreatedResponse({ type: IdResponseDto })
  createTest(@Body() dto: TestDefinitionRequestDto): Promise<IdResponseDto> {
    return this.commandBus.execute(
      new CreateTestDefinitionCommand({
        name: dto.name,
        passingPercent: dto.passingPercent,
      }),
    );
  }

  @Get('test-definitions/:id')
  @ApiOperation({ summary: 'Get test definition with questions' })
  @ApiOkResponse({ type: TestDefinitionResponseDto })
  @ApiNotFoundResponse()
  findTest(@Param() { id }: IdRequestDto): Promise<TestDefinitionResponseDto> {
    return this.queryBus.execute(new FindTestDefinitionQuery({ testId: id }));
  }

  @Patch('test-definitions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update test name' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  updateTest(
    @Param() { id }: IdRequestDto,
    @Body() dto: TestDefinitionRequestDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new UpdateTestDefinitionCommand({
        testId: id,
        name: dto.name,
        passingPercent: dto.passingPercent,
      }),
    );
  }

  @Delete('test-definitions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a test definition' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  deleteTest(@Param() { id }: IdRequestDto): Promise<void> {
    return this.commandBus.execute(
      new DeleteTestDefinitionCommand({ testId: id }),
    );
  }

  @Post('test-definitions/:id/questions')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Add an existing course question to a test' })
  @ApiNoContentResponse()
  addQuestion(
    @Param() { id }: IdRequestDto,
    @Body() dto: AddQuestionToTestRequestDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new AddQuestionToTestCommand({ testId: id, questionId: dto.questionId }),
    );
  }

  @Delete('test-definitions/:id/questions/:questionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a question from a test' })
  @ApiNoContentResponse()
  removeQuestion(
    @Param() { id }: IdRequestDto,
    @Param('questionId') questionId: string,
  ): Promise<void> {
    return this.commandBus.execute(
      new RemoveQuestionFromTestCommand({ testId: id, questionId }),
    );
  }

  // ── Course question bank ──────────────────────────────────────────────────

  @Post('courses/:id/questions')
  @ApiOperation({
    summary: 'Create a question (with answers) for a course question bank',
  })
  @ApiCreatedResponse({ type: IdResponseDto })
  createQuestion(
    @Param() { id }: IdRequestDto,
    @Body() dto: CreateCourseQuestionRequestDto,
  ): Promise<IdResponseDto> {
    return this.commandBus.execute(
      new CreateCourseQuestionCommand({
        courseId: id,
        moduleId: dto.moduleId,
        question: dto.question,
        answers: dto.answers,
      }),
    );
  }

  @Get('courses/:id/questions')
  @ApiOperation({ summary: 'List all questions for a course' })
  @ApiOkResponse({ type: [CourseQuestionResponseDto] })
  findQuestions(
    @Param() { id }: IdRequestDto,
  ): Promise<CourseQuestionResponseDto[]> {
    return this.queryBus.execute(
      new FindCourseQuestionsQuery({ courseId: id }),
    );
  }

  @Delete('questions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a course question (cascades answers + test links)',
  })
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  deleteQuestion(@Param() { id }: IdRequestDto): Promise<void> {
    return this.commandBus.execute(
      new DeleteCourseQuestionCommand({ questionId: id }),
    );
  }
}
