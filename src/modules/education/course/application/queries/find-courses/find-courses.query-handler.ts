import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { Paginated } from '@/libs/application/query.base';
import { CourseSummaryResponseDto } from '@/modules/education/course/presentation/dto/course.response.dto';
import { FindCoursesQuery } from './find-courses.query';

@QueryHandler(FindCoursesQuery)
export class FindCoursesQueryHandler implements IQueryHandler<
  FindCoursesQuery,
  Paginated<CourseSummaryResponseDto>
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(
    query: FindCoursesQuery,
  ): Promise<Paginated<CourseSummaryResponseDto>> {
    const where = query.authorId ? { authorId: query.authorId } : {};

    const [count, rows] = await Promise.all([
      this.prismaService.client.course.count({ where }),
      this.prismaService.client.course.findMany({
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
          new CourseSummaryResponseDto({
            id: row.id,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            name: row.name,
            description: row.description,
            authorId: row.authorId,
            coverId: row.coverId,
          }),
      ),
    });
  }
}
