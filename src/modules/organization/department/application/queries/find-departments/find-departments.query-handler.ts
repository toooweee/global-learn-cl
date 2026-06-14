import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindDepartmentsQuery } from '@/modules/organization/department/application/queries/find-departments/find-departments.query';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { Paginated } from '@/libs/application';
import { parsePrismaOrderBy } from '@/infra/prisma/prisma.parse-order-by';
import { Department } from '@generated/client';
import { CacheService, CACHE_NS, CACHE_TTL } from '@/infra/cache/cache.service';

@QueryHandler(FindDepartmentsQuery)
export class FindDepartmentsQueryHandler implements IQueryHandler<
  FindDepartmentsQuery,
  Paginated<Department>
> {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async execute(query: FindDepartmentsQuery): Promise<Paginated<Department>> {
    const { limit, page, offset } = query;

    return this.cache.getOrSet(
      CACHE_NS.ORG,
      ['departments', limit, page, JSON.stringify(query.orderBy)],
      CACHE_TTL.ORG,
      async () => {
        const [count, data] = await Promise.all([
          this.prismaService.client.department.count(),
          this.prismaService.client.department.findMany({
            take: limit,
            skip: offset,
            orderBy: parsePrismaOrderBy(query.orderBy),
          }),
        ]);

        return new Paginated<Department>({ limit, page, count, data });
      },
    );
  }
}
