import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindRolesQuery } from '@/modules/identity/role/application/queries/find-roles/find-roles.query';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { Paginated } from '@/libs/application';
import { parsePrismaOrderBy } from '@/infra/prisma/prisma.parse-order-by';
import { Role } from '@generated/client';

@QueryHandler(FindRolesQuery)
export class FindRolesQueryHandler implements IQueryHandler<
  FindRolesQuery,
  Paginated<Role>
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(query: FindRolesQuery): Promise<Paginated<Role>> {
    const { limit, page, offset } = query;

    const [count, data] = await Promise.all([
      this.prismaService.client.role.count(),
      this.prismaService.client.role.findMany({
        take: limit,
        skip: offset,
        orderBy: parsePrismaOrderBy(query.orderBy),
      }),
    ]);

    return new Paginated<Role>({ limit, page, count, data });
  }
}
