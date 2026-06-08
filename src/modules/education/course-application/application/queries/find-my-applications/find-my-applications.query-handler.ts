import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { RequestContextService } from '@/libs/application/context/app-request-context';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { Paginated } from '@/libs/application/query.base';
import { CourseApplicationResponseDto } from '@/modules/education/course-application/presentation/dto/course-application.response.dto';
import { FindMyApplicationsQuery } from './find-my-applications.query';

@QueryHandler(FindMyApplicationsQuery)
export class FindMyApplicationsQueryHandler implements IQueryHandler<
  FindMyApplicationsQuery,
  Paginated<CourseApplicationResponseDto>
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(
    query: FindMyApplicationsQuery,
  ): Promise<Paginated<CourseApplicationResponseDto>> {
    const employeeId = RequestContextService.getUserId();
    if (!employeeId) {
      throw new ApplicationException('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const where = { employeeId };

    const [count, rows] = await Promise.all([
      this.prismaService.client.courseApplication.count({ where }),
      this.prismaService.client.courseApplication.findMany({
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
          new CourseApplicationResponseDto({
            id: row.id,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            courseId: row.courseId,
            employeeId: row.employeeId,
            status: row.status,
          }),
      ),
    });
  }
}
