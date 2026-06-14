import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { StartTestAttemptCommand } from '@/modules/education/test-attempt/application/commands/start-test-attempt/start-test-attempt.command';
import { AnswerQuestionCommand } from '@/modules/education/test-attempt/application/commands/answer-question/answer-question.command';
import { FinishTestAttemptCommand } from '@/modules/education/test-attempt/application/commands/finish-test-attempt/finish-test-attempt.command';
import { FindTestAttemptQuery } from '@/modules/education/test-attempt/application/queries/find-test-attempt/find-test-attempt.query';
import { FindTestAttemptsQuery } from '@/modules/education/test-attempt/application/queries/find-test-attempts/find-test-attempts.query';
import { AnswerQuestionRequestDto } from './dto/answer-question.request.dto';
import {
  TestAttemptResponseDto,
  TestAttemptResultDto,
  TestAttemptSummaryDto,
} from './dto/test-attempt.response.dto';

@ApiTags('test-attempts')
@Controller()
export class TestAttemptController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('tests/:testId/attempts')
  @ApiOperation({
    summary:
      'Start or resume a test attempt (returns existing active attempt ID if one already exists)',
  })
  @ApiCreatedResponse({ type: IdResponseDto })
  start(@Param('testId') testId: string): Promise<IdResponseDto> {
    return this.commandBus.execute(new StartTestAttemptCommand({ testId }));
  }

  @Get('tests/:testId/attempts')
  @ApiOperation({ summary: 'List my attempts for a test (most recent first)' })
  @ApiOkResponse({ type: [TestAttemptSummaryDto] })
  findByTest(
    @Param('testId') testId: string,
  ): Promise<TestAttemptSummaryDto[]> {
    return this.queryBus.execute(new FindTestAttemptsQuery({ testId }));
  }

  @Get('attempts/:id')
  @ApiOperation({ summary: 'Get a test attempt status' })
  @ApiOkResponse({ type: TestAttemptResponseDto })
  @ApiNotFoundResponse()
  findOne(@Param() { id }: IdRequestDto): Promise<TestAttemptResponseDto> {
    return this.queryBus.execute(new FindTestAttemptQuery({ attemptId: id }));
  }

  @Post('attempts/:id/answers')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Submit or update an answer for a question' })
  @ApiNoContentResponse()
  answer(
    @Param() { id }: IdRequestDto,
    @Body() dto: AnswerQuestionRequestDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new AnswerQuestionCommand({
        attemptId: id,
        questionId: dto.questionId,
        answerId: dto.answerId,
        option: dto.option,
      }),
    );
  }

  @Post('attempts/:id/finish')
  @ApiOperation({
    summary:
      "Finish the attempt and get score (correct/total, passed if ≥ the test's passing percent)",
  })
  @ApiCreatedResponse({ type: TestAttemptResultDto })
  @ApiNotFoundResponse()
  finish(@Param() { id }: IdRequestDto): Promise<TestAttemptResultDto> {
    return this.commandBus.execute(
      new FinishTestAttemptCommand({ attemptId: id }),
    );
  }
}
