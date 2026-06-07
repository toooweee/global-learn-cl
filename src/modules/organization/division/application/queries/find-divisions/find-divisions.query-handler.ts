import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindDivisionsQuery } from '@/modules/organization/division/application/queries/find-divisions/find-divisions.query';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { Paginated } from '@/libs/application';
import { parsePrismaOrderBy } from '@/infra/prisma/prisma.parse-order-by';
import { Division } from '@generated/client';

@QueryHandler(FindDivisionsQuery)
export class FindDivisionsQueryHandler implements IQueryHandler<
  FindDivisionsQuery,
  Paginated<Division>
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(query: FindDivisionsQuery): Promise<Paginated<Division>> {
    const { limit, page, offset, departmentId } = query;
    const where = departmentId ? { departmentId } : {};

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
  }
}
