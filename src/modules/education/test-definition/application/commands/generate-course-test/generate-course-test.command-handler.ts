import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { IdResponseDto } from '@/libs/api/dto';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { TestDefinitionEntity } from '@/modules/education/test-definition/domain/test-definition.entity';
import { GenerateCourseTestCommand } from './generate-course-test.command';
import {
  TEST_DEFINITION_REPOSITORY,
  type TestDefinitionRepositoryPort,
} from '@/modules/education/test-definition/application/ports/test-definition.repository.port';

@CommandHandler(GenerateCourseTestCommand)
export class GenerateCourseTestCommandHandler implements ICommandHandler<
  GenerateCourseTestCommand,
  IdResponseDto
> {
  constructor(
    @Inject(TEST_DEFINITION_REPOSITORY)
    private readonly repository: TestDefinitionRepositoryPort,
    private readonly prismaService: PrismaService,
  ) {}

  async execute(command: GenerateCourseTestCommand): Promise<IdResponseDto> {
    const course = await this.prismaService.client.course.findUnique({
      where: { id: command.courseId },
      select: { name: true },
    });
    if (!course) {
      throw new ApplicationException(
        'Course not found',
        404,
        'COURSE_NOT_FOUND',
      );
    }

    const pool = await this.prismaService.client.courseQuestion.findMany({
      where: { courseId: command.courseId },
      select: { id: true },
    });
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
      name: `Итоговый тест по ${course.name}`,
      passingPercent: command.passingPercent ?? 80,
    });

    await this.repository.save(test);
    await this.repository.replaceQuestions(test.id, selected);

    return new IdResponseDto(test.id);
  }
}
