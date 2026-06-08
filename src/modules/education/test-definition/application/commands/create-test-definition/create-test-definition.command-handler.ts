import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IdResponseDto } from '@/libs/api/dto';
import { TestDefinitionEntity } from '@/modules/education/test-definition/domain/test-definition.entity';
import { CreateTestDefinitionCommand } from './create-test-definition.command';
import {
  TEST_DEFINITION_REPOSITORY,
  type TestDefinitionRepositoryPort,
} from '@/modules/education/test-definition/application/ports/test-definition.repository.port';

@CommandHandler(CreateTestDefinitionCommand)
export class CreateTestDefinitionCommandHandler implements ICommandHandler<
  CreateTestDefinitionCommand,
  IdResponseDto
> {
  constructor(
    @Inject(TEST_DEFINITION_REPOSITORY)
    private readonly repository: TestDefinitionRepositoryPort,
  ) {}

  async execute(command: CreateTestDefinitionCommand): Promise<IdResponseDto> {
    const test = TestDefinitionEntity.create({
      name: command.name,
      passingPercent: command.passingPercent,
    });
    await this.repository.save(test);
    return new IdResponseDto(test.id);
  }
}
