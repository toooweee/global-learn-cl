import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { DeleteTestDefinitionCommand } from './delete-test-definition.command';
import {
  TEST_DEFINITION_REPOSITORY,
  type TestDefinitionRepositoryPort,
} from '@/modules/education/test-definition/application/ports/test-definition.repository.port';

@CommandHandler(DeleteTestDefinitionCommand)
export class DeleteTestDefinitionCommandHandler implements ICommandHandler<
  DeleteTestDefinitionCommand,
  void
> {
  constructor(
    @Inject(TEST_DEFINITION_REPOSITORY)
    private readonly repository: TestDefinitionRepositoryPort,
  ) {}

  async execute(command: DeleteTestDefinitionCommand): Promise<void> {
    const option = await this.repository.findById(command.testId);
    if (option.isNone()) {
      throw new ApplicationException('Test not found', 404, 'TEST_NOT_FOUND');
    }
    await this.repository.delete(command.testId);
  }
}
