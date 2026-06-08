import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { RemoveQuestionFromTestCommand } from './remove-question-from-test.command';
import {
  TEST_DEFINITION_REPOSITORY,
  type TestDefinitionRepositoryPort,
} from '@/modules/education/test-definition/application/ports/test-definition.repository.port';

@CommandHandler(RemoveQuestionFromTestCommand)
export class RemoveQuestionFromTestCommandHandler implements ICommandHandler<
  RemoveQuestionFromTestCommand,
  void
> {
  constructor(
    @Inject(TEST_DEFINITION_REPOSITORY)
    private readonly repository: TestDefinitionRepositoryPort,
  ) {}

  async execute(command: RemoveQuestionFromTestCommand): Promise<void> {
    const option = await this.repository.findById(command.testId);
    if (option.isNone()) {
      throw new ApplicationException('Test not found', 404, 'TEST_NOT_FOUND');
    }
    await this.repository.removeQuestion(command.testId, command.questionId);
  }
}
