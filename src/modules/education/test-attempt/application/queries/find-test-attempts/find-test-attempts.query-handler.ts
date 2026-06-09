import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { RequestContextService } from '@/libs/application/context/app-request-context';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { TestAttemptSummaryDto } from '@/modules/education/test-attempt/presentation/dto/test-attempt.response.dto';
import { FindTestAttemptsQuery } from './find-test-attempts.query';

@QueryHandler(FindTestAttemptsQuery)
export class FindTestAttemptsQueryHandler implements IQueryHandler<
  FindTestAttemptsQuery,
  TestAttemptSummaryDto[]
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(
    query: FindTestAttemptsQuery,
  ): Promise<TestAttemptSummaryDto[]> {
    const employeeId = RequestContextService.getUserId();
    if (!employeeId) {
      throw new ApplicationException('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const rows = await this.prismaService.client.testAttempt.findMany({
      where: { testId: query.testId, employeeId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        testId: true,
        endedAt: true,
        score: true,
        isPassed: true,
        createdAt: true,
      },
    });

    return rows.map(
      (r) =>
        new TestAttemptSummaryDto({
          id: r.id,
          createdAt: r.createdAt,
          testId: r.testId,
          endedAt: r.endedAt,
          score: r.score,
          isPassed: r.isPassed,
        }),
    );
  }
}
