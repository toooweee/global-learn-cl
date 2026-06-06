import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindUserQuery } from '@/modules/identity/user/application/queries/find-user/find-user.query';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';

@QueryHandler(FindUserQuery)
export class FindUserQueryHandler implements IQueryHandler<FindUserQuery> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(query: FindUserQuery) {
    const { id } = query;

    const user = await this.prismaService.client.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new ApplicationException(
        `User with id ${id} not found`,
        404,
        'USER_NOT_FOUND',
      );
    }

    return user;
  }
}
