import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { AnswerQuestionCommand } from './answer-question.command';
import {
  TEST_ATTEMPT_REPOSITORY,
  type TestAttemptRepositoryPort,
} from '@/modules/education/test-attempt/application/ports/test-attempt.repository.port';

@CommandHandler(AnswerQuestionCommand)
export class AnswerQuestionCommandHandler implements ICommandHandler<
  AnswerQuestionCommand,
  void
> {
  constructor(
    @Inject(TEST_ATTEMPT_REPOSITORY)
    private readonly repository: TestAttemptRepositoryPort,
  ) {}

  async execute(command: AnswerQuestionCommand): Promise<void> {
    const option = await this.repository.findById(command.attemptId);
    if (option.isNone()) {
      throw new ApplicationException(
        'Test attempt not found',
        404,
        'TEST_ATTEMPT_NOT_FOUND',
      );
    }

    const attempt = option.unwrap();
    attempt.answerQuestion(
      command.questionId,
      command.answerId,
      command.option,
    );
    await this.repository.save(attempt);
  }
}
