import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { TestAttemptResultDto } from '@/modules/education/test-attempt/presentation/dto/test-attempt.response.dto';
import { FinishTestAttemptCommand } from './finish-test-attempt.command';
import {
  TEST_ATTEMPT_REPOSITORY,
  type TestAttemptRepositoryPort,
} from '@/modules/education/test-attempt/application/ports/test-attempt.repository.port';

@CommandHandler(FinishTestAttemptCommand)
export class FinishTestAttemptCommandHandler implements ICommandHandler<
  FinishTestAttemptCommand,
  TestAttemptResultDto
> {
  constructor(
    @Inject(TEST_ATTEMPT_REPOSITORY)
    private readonly repository: TestAttemptRepositoryPort,
    private readonly prismaService: PrismaService,
  ) {}

  async execute(
    command: FinishTestAttemptCommand,
  ): Promise<TestAttemptResultDto> {
    const option = await this.repository.findById(command.attemptId);
    if (option.isNone()) {
      throw new ApplicationException(
        'Test attempt not found',
        404,
        'TEST_ATTEMPT_NOT_FOUND',
      );
    }

    const attempt = option.unwrap();
    attempt.finish();
    await this.repository.save(attempt);

    const props = attempt.getProps();
    const [total, correct, test] = await Promise.all([
      this.prismaService.client.testQuestion.count({
        where: { testId: props.testId },
      }),
      this.prismaService.client.testAttemptAnswer.count({
        where: { attemptId: command.attemptId, answer: { isCorrect: true } },
      }),
      this.prismaService.client.test.findUnique({
        where: { id: props.testId },
        select: { passingPercent: true },
      }),
    ]);

    const passingPercent = test?.passingPercent ?? 80;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    const isPassed = score >= passingPercent;

    await this.prismaService.client.testAttempt.update({
      where: { id: command.attemptId },
      data: { score, isPassed },
    });

    return new TestAttemptResultDto({ correct, total, score, isPassed });
  }
}
