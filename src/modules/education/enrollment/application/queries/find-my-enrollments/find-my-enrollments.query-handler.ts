import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { RequestContextService } from '@/libs/application/context/app-request-context';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { Paginated } from '@/libs/application/query.base';
import { EnrollmentSummaryResponseDto } from '@/modules/education/enrollment/presentation/dto/enrollment.response.dto';
import { FindMyEnrollmentsQuery } from './find-my-enrollments.query';

@QueryHandler(FindMyEnrollmentsQuery)
export class FindMyEnrollmentsQueryHandler implements IQueryHandler<
  FindMyEnrollmentsQuery,
  Paginated<EnrollmentSummaryResponseDto>
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(
    query: FindMyEnrollmentsQuery,
  ): Promise<Paginated<EnrollmentSummaryResponseDto>> {
    const employeeId = RequestContextService.getUserId();
    if (!employeeId) {
      throw new ApplicationException('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const where = { employeeId };
    const [count, rows] = await Promise.all([
      this.prismaService.client.courseEnrollment.count({ where }),
      this.prismaService.client.courseEnrollment.findMany({
        where,
        take: query.limit,
        skip: query.offset,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return new Paginated({
      count,
      limit: query.limit,
      page: query.page,
      data: rows.map(
        (row) =>
          new EnrollmentSummaryResponseDto({
            id: row.id,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            courseId: row.courseId,
            employeeId: row.employeeId,
            status: row.status,
            startedAt: row.startedAt,
            completedAt: row.completedAt ?? undefined,
          }),
      ),
    });
  }
}
