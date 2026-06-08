import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { UpdateTestDefinitionCommand } from './update-test-definition.command';
import {
  TEST_DEFINITION_REPOSITORY,
  type TestDefinitionRepositoryPort,
} from '@/modules/education/test-definition/application/ports/test-definition.repository.port';

@CommandHandler(UpdateTestDefinitionCommand)
export class UpdateTestDefinitionCommandHandler implements ICommandHandler<
  UpdateTestDefinitionCommand,
  void
> {
  constructor(
    @Inject(TEST_DEFINITION_REPOSITORY)
    private readonly repository: TestDefinitionRepositoryPort,
  ) {}

  async execute(command: UpdateTestDefinitionCommand): Promise<void> {
    const option = await this.repository.findById(command.testId);
    if (option.isNone()) {
      throw new ApplicationException('Test not found', 404, 'TEST_NOT_FOUND');
    }
    const test = option.unwrap();
    test.update({ name: command.name, passingPercent: command.passingPercent });
    await this.repository.save(test);
  }
}
