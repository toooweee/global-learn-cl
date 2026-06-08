import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { Paginated } from '@/libs/application/query.base';
import { CourseApplicationResponseDto } from '@/modules/education/course-application/presentation/dto/course-application.response.dto';
import { FindApplicationsForCourseQuery } from './find-applications-for-course.query';

@QueryHandler(FindApplicationsForCourseQuery)
export class FindApplicationsForCourseQueryHandler implements IQueryHandler<
  FindApplicationsForCourseQuery,
  Paginated<CourseApplicationResponseDto>
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(
    query: FindApplicationsForCourseQuery,
  ): Promise<Paginated<CourseApplicationResponseDto>> {
    const where = {
      courseId: query.courseId,
      ...(query.status ? { status: query.status } : {}),
    };

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
