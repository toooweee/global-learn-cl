import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindDivisionsQuery } from '@/modules/organization/division/application/queries/find-divisions/find-divisions.query';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { Paginated } from '@/libs/application';
import { parsePrismaOrderBy } from '@/infra/prisma/prisma.parse-order-by';
import { Division } from '@generated/client';
import { CacheService, CACHE_NS, CACHE_TTL } from '@/infra/cache/cache.service';

@QueryHandler(FindDivisionsQuery)
export class FindDivisionsQueryHandler implements IQueryHandler<
  FindDivisionsQuery,
  Paginated<Division>
> {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async execute(query: FindDivisionsQuery): Promise<Paginated<Division>> {
    const { limit, page, offset, departmentId } = query;
    const where = departmentId ? { departmentId } : {};

    return this.cache.getOrSet(
      CACHE_NS.ORG,
      ['divisions', limit, page, departmentId, JSON.stringify(query.orderBy)],
      CACHE_TTL.ORG,
      async () => {
        const [count, data] = await Promise.all([
          this.prismaService.client.division.count({ where }),
          this.prismaService.client.division.findMany({
            where,
            take: limit,
            skip: offset,
            orderBy: parsePrismaOrderBy(query.orderBy),
          }),
        ]);

        return new Paginated<Division>({ limit, page, count, data });
      },
    );
  }
}
