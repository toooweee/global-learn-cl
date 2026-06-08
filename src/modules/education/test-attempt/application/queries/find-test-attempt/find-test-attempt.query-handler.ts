import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { TestAttemptResponseDto } from '@/modules/education/test-attempt/presentation/dto/test-attempt.response.dto';
import { FindTestAttemptQuery } from './find-test-attempt.query';

@QueryHandler(FindTestAttemptQuery)
export class FindTestAttemptQueryHandler implements IQueryHandler<
  FindTestAttemptQuery,
  TestAttemptResponseDto
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(query: FindTestAttemptQuery): Promise<TestAttemptResponseDto> {
    const row = await this.prismaService.client.testAttempt.findUnique({
      where: { id: query.attemptId },
      include: { answers: true },
    });

    if (!row) {
      throw new ApplicationException(
        'Test attempt not found',
        404,
        'TEST_ATTEMPT_NOT_FOUND',
      );
    }

    return new TestAttemptResponseDto({
      id: row.id,
      createdAt: row.createdAt,
      testId: row.testId,
      employeeId: row.employeeId,
      endedAt: row.endedAt ?? undefined,
      answeredCount: row.answers.length,
    });
  }
}
