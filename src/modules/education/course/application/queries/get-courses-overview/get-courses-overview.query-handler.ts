import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { Paginated } from '@/libs/application/query.base';
import { CoursesOverviewItemDto } from '@/modules/education/course/presentation/dto/course-analytics.response.dto';
import { GetCoursesOverviewQuery } from './get-courses-overview.query';

@QueryHandler(GetCoursesOverviewQuery)
export class GetCoursesOverviewQueryHandler implements IQueryHandler<
  GetCoursesOverviewQuery,
  Paginated<CoursesOverviewItemDto>
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(
    query: GetCoursesOverviewQuery,
  ): Promise<Paginated<CoursesOverviewItemDto>> {
    const [courses, count] = await Promise.all([
      this.prismaService.client.course.findMany({
        skip: query.offset,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true },
      }),
      this.prismaService.client.course.count(),
    ]);

    const courseIds = courses.map((c) => c.id);

    const enrollmentGroups =
      await this.prismaService.client.courseEnrollment.groupBy({
        by: ['courseId', 'status'],
        where: { courseId: { in: courseIds } },
        _count: { id: true },
      });

    const statsMap = new Map<
      string,
      { inProgress: number; completed: number; cancelled: number }
    >();
    for (const group of enrollmentGroups) {
      const entry = statsMap.get(group.courseId) ?? {
        inProgress: 0,
        completed: 0,
        cancelled: 0,
      };
      if (group.status === 'IN_PROGRESS') entry.inProgress = group._count.id;
      else if (group.status === 'COMPLETED') entry.completed = group._count.id;
      else if (group.status === 'CANCELLED') entry.cancelled = group._count.id;
      statsMap.set(group.courseId, entry);
    }

    return new Paginated({
      count,
      limit: query.limit,
      page: query.page,
      data: courses.map((c) => {
        const s = statsMap.get(c.id) ?? {
          inProgress: 0,
          completed: 0,
          cancelled: 0,
        };
        const total = s.inProgress + s.completed + s.cancelled;
        return new CoursesOverviewItemDto({
          courseId: c.id,
          courseName: c.name,
          totalEnrollments: total,
          inProgress: s.inProgress,
          completed: s.completed,
          cancelled: s.cancelled,
          completionRate:
            total > 0 ? Math.round((s.completed / total) * 100) : 0,
        });
      }),
    });
  }
}
