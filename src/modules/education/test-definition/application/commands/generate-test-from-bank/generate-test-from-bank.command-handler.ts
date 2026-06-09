import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { GenerateTestFromBankCommand } from './generate-test-from-bank.command';
import {
  TEST_DEFINITION_REPOSITORY,
  type TestDefinitionRepositoryPort,
} from '@/modules/education/test-definition/application/ports/test-definition.repository.port';

@CommandHandler(GenerateTestFromBankCommand)
export class GenerateTestFromBankCommandHandler implements ICommandHandler<
  GenerateTestFromBankCommand,
  void
> {
  constructor(
    @Inject(TEST_DEFINITION_REPOSITORY)
    private readonly repository: TestDefinitionRepositoryPort,
    private readonly prismaService: PrismaService,
  ) {}

  async execute(command: GenerateTestFromBankCommand): Promise<void> {
    const option = await this.repository.findById(command.testId);
    if (option.isNone()) {
      throw new ApplicationException('Test not found', 404, 'TEST_NOT_FOUND');
    }

    const where: Record<string, unknown> = { courseId: command.courseId };
    if (command.moduleId) where.moduleId = command.moduleId;

    const pool = await this.prismaService.client.courseQuestion.findMany({
      where,
      select: { id: true },
    });

    if (pool.length === 0) {
      throw new ApplicationException(
        'No questions found in the bank for the given filters',
        422,
        'QUESTION_BANK_EMPTY',
      );
    }

    const shuffled = pool
      .map((q) => ({ id: q.id, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map((q) => q.id);

    const selected = shuffled.slice(0, command.count);

    await this.repository.replaceQuestions(command.testId, selected);
  }
}
