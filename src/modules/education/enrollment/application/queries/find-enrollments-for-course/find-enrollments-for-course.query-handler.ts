import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { Paginated } from '@/libs/application/query.base';
import { EnrollmentResponseDto } from '@/modules/education/enrollment/presentation/dto/enrollment.response.dto';
import { FindEnrollmentsForCourseQuery } from './find-enrollments-for-course.query';

@QueryHandler(FindEnrollmentsForCourseQuery)
export class FindEnrollmentsForCourseQueryHandler implements IQueryHandler<
  FindEnrollmentsForCourseQuery,
  Paginated<EnrollmentResponseDto>
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(
    query: FindEnrollmentsForCourseQuery,
  ): Promise<Paginated<EnrollmentResponseDto>> {
    const where = { courseId: query.courseId };
    const [count, rows] = await Promise.all([
      this.prismaService.client.courseEnrollment.count({ where }),
      this.prismaService.client.courseEnrollment.findMany({
        where,
        include: { progress: true },
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
          new EnrollmentResponseDto({
            id: row.id,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            courseId: row.courseId,
            employeeId: row.employeeId,
            assignedById: row.assignedById,
            status: row.status,
            startedAt: row.startedAt,
            completedAt: row.completedAt ?? undefined,
            progress: row.progress.map((p) => ({
              id: p.id,
              stepId: p.stepId,
              completedAt: p.completedAt ?? undefined,
              createdAt: p.createdAt,
            })),
          }),
      ),
    });
  }
}
