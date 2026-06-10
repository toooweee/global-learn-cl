import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { IdResponseDto } from '@/libs/api/dto';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { TestDefinitionEntity } from '@/modules/education/test-definition/domain/test-definition.entity';
import { GenerateModuleTestCommand } from './generate-module-test.command';
import {
  TEST_DEFINITION_REPOSITORY,
  type TestDefinitionRepositoryPort,
} from '@/modules/education/test-definition/application/ports/test-definition.repository.port';

@CommandHandler(GenerateModuleTestCommand)
export class GenerateModuleTestCommandHandler implements ICommandHandler<
  GenerateModuleTestCommand,
  IdResponseDto
> {
  constructor(
    @Inject(TEST_DEFINITION_REPOSITORY)
    private readonly repository: TestDefinitionRepositoryPort,
    private readonly prismaService: PrismaService,
  ) {}

  async execute(command: GenerateModuleTestCommand): Promise<IdResponseDto> {
    const module = await this.prismaService.client.module.findUnique({
      where: { id: command.moduleId },
      select: { name: true, courseId: true },
    });
    if (!module || module.courseId !== command.courseId) {
      throw new ApplicationException(
        'Module not found',
        404,
        'MODULE_NOT_FOUND',
      );
    }

    let pool = await this.prismaService.client.courseQuestion.findMany({
      where: { courseId: command.courseId, moduleId: command.moduleId },
      select: { id: true },
    });

    // Fall back to all course questions when none are scoped to this module
    if (pool.length === 0) {
      pool = await this.prismaService.client.courseQuestion.findMany({
        where: { courseId: command.courseId },
        select: { id: true },
      });
    }

    if (pool.length === 0) {
      throw new ApplicationException(
        'Question bank is empty for this course',
        422,
        'QUESTION_BANK_EMPTY',
      );
    }

    const shuffled = pool
      .map((q) => ({ id: q.id, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map((q) => q.id);

    const selected = command.count
      ? shuffled.slice(0, command.count)
      : shuffled;

    const test = TestDefinitionEntity.create({
      name: `Итоговый тест по модулю ${module.name}`,
      passingPercent: command.passingPercent ?? 80,
    });

    await this.repository.save(test);
    await this.repository.replaceQuestions(test.id, selected);

    return new IdResponseDto(test.id);
  }
}
