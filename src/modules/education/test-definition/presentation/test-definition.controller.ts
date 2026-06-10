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
import { Roles } from '@/libs/auth/decorators/roles.decorator';
import { CreateTestDefinitionCommand } from '@/modules/education/test-definition/application/commands/create-test-definition/create-test-definition.command';
import { UpdateTestDefinitionCommand } from '@/modules/education/test-definition/application/commands/update-test-definition/update-test-definition.command';
import { DeleteTestDefinitionCommand } from '@/modules/education/test-definition/application/commands/delete-test-definition/delete-test-definition.command';
import { AddQuestionToTestCommand } from '@/modules/education/test-definition/application/commands/add-question-to-test/add-question-to-test.command';
import { RemoveQuestionFromTestCommand } from '@/modules/education/test-definition/application/commands/remove-question-from-test/remove-question-from-test.command';
import { BulkAddQuestionsToTestCommand } from '@/modules/education/test-definition/application/commands/bulk-add-questions-to-test/bulk-add-questions-to-test.command';
import { GenerateTestFromBankCommand } from '@/modules/education/test-definition/application/commands/generate-test-from-bank/generate-test-from-bank.command';
import { CreateCourseQuestionCommand } from '@/modules/education/test-definition/application/commands/create-course-question/create-course-question.command';
import { DeleteCourseQuestionCommand } from '@/modules/education/test-definition/application/commands/delete-course-question/delete-course-question.command';
import { UpdateCourseQuestionCommand } from '@/modules/education/test-definition/application/commands/update-course-question/update-course-question.command';
import { FindTestDefinitionQuery } from '@/modules/education/test-definition/application/queries/find-test-definition/find-test-definition.query';
import { FindCourseQuestionsQuery } from '@/modules/education/test-definition/application/queries/find-course-questions/find-course-questions.query';
import { FindCourseQuestionQuery } from '@/modules/education/test-definition/application/queries/find-course-question/find-course-question.query';
import { GetQuestionBankStatsQuery } from '@/modules/education/test-definition/application/queries/get-question-bank-stats/get-question-bank-stats.query';
import {
  AddQuestionToTestRequestDto,
  BulkAddQuestionsRequestDto,
  CreateCourseQuestionRequestDto,
  GenerateTestFromBankRequestDto,
  TestDefinitionRequestDto,
  UpdateCourseQuestionRequestDto,
} from './dto/test-definition.request.dto';
import {
  CourseQuestionResponseDto,
  QuestionBankStatsDto,
  TestDefinitionResponseDto,
} from './dto/test-definition.response.dto';
import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

class QuestionFilterQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  moduleId?: string;
}

@ApiTags('tests')
@Controller()
@Roles('admin', 'department_head', 'division_head')
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
  @ApiOperation({ summary: 'Get test definition with its questions' })
  @ApiOkResponse({ type: TestDefinitionResponseDto })
  @ApiNotFoundResponse()
  findTest(@Param() { id }: IdRequestDto): Promise<TestDefinitionResponseDto> {
    return this.queryBus.execute(new FindTestDefinitionQuery({ testId: id }));
  }

  @Patch('test-definitions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update test name / passing percent' })
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

  // ── Test ↔ question bank wiring ──────────────────────────────────────────

  @Post('test-definitions/:id/questions')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Add a single question from the bank to a test' })
  @ApiNoContentResponse()
  addQuestion(
    @Param() { id }: IdRequestDto,
    @Body() dto: AddQuestionToTestRequestDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new AddQuestionToTestCommand({ testId: id, questionId: dto.questionId }),
    );
  }

  @Post('test-definitions/:id/questions/bulk')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Add multiple questions from the bank to a test at once (skips duplicates)',
  })
  @ApiNoContentResponse()
  bulkAddQuestions(
    @Param() { id }: IdRequestDto,
    @Body() dto: BulkAddQuestionsRequestDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new BulkAddQuestionsToTestCommand({
        testId: id,
        questionIds: dto.questionIds,
      }),
    );
  }

  @Post('test-definitions/:id/generate')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Auto-generate test questions from the course question bank. Picks `count` random questions and REPLACES all current questions in the test.',
  })
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  generateFromBank(
    @Param() { id }: IdRequestDto,
    @Body() dto: GenerateTestFromBankRequestDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new GenerateTestFromBankCommand({
        testId: id,
        courseId: dto.courseId,
        count: dto.count,
        moduleId: dto.moduleId,
      }),
    );
  }

  @Delete('test-definitions/:id/questions/:questionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a question from a test' })
  @ApiNoContentResponse()
  removeQuestion(
    @Param('id') id: string,
    @Param('questionId') questionId: string,
  ): Promise<void> {
    return this.commandBus.execute(
      new RemoveQuestionFromTestCommand({ testId: id, questionId }),
    );
  }

  // ── Course question bank ──────────────────────────────────────────────────

  @Post('courses/:id/questions')
  @ApiOperation({
    summary: 'Create a question (with answers) in a course question bank',
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
  @ApiOperation({
    summary: 'List questions in a course bank (optional ?moduleId filter)',
  })
  @ApiOkResponse({ type: [CourseQuestionResponseDto] })
  findQuestions(
    @Param() { id }: IdRequestDto,
    @Query() query: QuestionFilterQueryDto,
  ): Promise<CourseQuestionResponseDto[]> {
    return this.queryBus.execute(
      new FindCourseQuestionsQuery({ courseId: id, moduleId: query.moduleId }),
    );
  }

  @Get('courses/:id/questions/stats')
  @ApiOperation({
    summary:
      'Question bank stats: total, used in tests, unused, breakdown by module',
  })
  @ApiOkResponse({ type: QuestionBankStatsDto })
  getQuestionBankStats(
    @Param() { id }: IdRequestDto,
  ): Promise<QuestionBankStatsDto> {
    return this.queryBus.execute(
      new GetQuestionBankStatsQuery({ courseId: id }),
    );
  }

  @Get('questions/:id')
  @ApiOperation({ summary: 'Get a single course question by ID' })
  @ApiOkResponse({ type: CourseQuestionResponseDto })
  @ApiNotFoundResponse()
  findQuestion(
    @Param() { id }: IdRequestDto,
  ): Promise<CourseQuestionResponseDto> {
    return this.queryBus.execute(
      new FindCourseQuestionQuery({ questionId: id }),
    );
  }

  @Patch('questions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update a course question text and/or answers' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  updateQuestion(
    @Param() { id }: IdRequestDto,
    @Body() dto: UpdateCourseQuestionRequestDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new UpdateCourseQuestionCommand({
        questionId: id,
        question: dto.question,
        answers: dto.answers,
      }),
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
