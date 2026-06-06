import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindUsersQuery } from '@/modules/identity/user/application/queries/find-users/find-users.query';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { parsePrismaOrderBy } from '@/infra/prisma/prisma.parse-order-by';
import { Paginated } from '@/libs/application';
import { User } from '@generated/client';

@QueryHandler(FindUsersQuery)
export class FindUsersQueryHandler implements IQueryHandler<FindUsersQuery> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(query: FindUsersQuery) {
    const { limit, page, offset } = query;

    const [count, users] = await Promise.all([
      this.prismaService.client.user.count(),
      this.prismaService.client.user.findMany({
        take: limit,
        skip: offset,
        orderBy: parsePrismaOrderBy(query.orderBy),
      }),
    ]);

    return new Paginated<User>({
      limit,
      page,
      count,
      data: users,
    });
  }
}
