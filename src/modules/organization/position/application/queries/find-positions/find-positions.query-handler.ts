import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindPositionsQuery } from '@/modules/organization/position/application/queries/find-positions/find-positions.query';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { Paginated } from '@/libs/application';
import { parsePrismaOrderBy } from '@/infra/prisma/prisma.parse-order-by';
import { Position } from '@generated/client';

@QueryHandler(FindPositionsQuery)
export class FindPositionsQueryHandler implements IQueryHandler<
  FindPositionsQuery,
  Paginated<Position>
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(query: FindPositionsQuery): Promise<Paginated<Position>> {
    const { limit, page, offset } = query;

    const [count, data] = await Promise.all([
      this.prismaService.client.position.count(),
      this.prismaService.client.position.findMany({
        take: limit,
        skip: offset,
        orderBy: parsePrismaOrderBy(query.orderBy),
      }),
    ]);

    return new Paginated<Position>({ limit, page, count, data });
  }
}
