import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindRoleQuery } from '@/modules/identity/role/application/queries/find-role/find-role.query';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { Role } from '@generated/client';

@QueryHandler(FindRoleQuery)
export class FindRoleQueryHandler implements IQueryHandler<
  FindRoleQuery,
  Role
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(query: FindRoleQuery): Promise<Role> {
    const role = await this.prismaService.client.role.findUnique({
      where: { id: query.id },
    });

    if (!role) {
      throw new ApplicationException('Role not found', 404, 'ROLE_NOT_FOUND');
    }

    return role;
  }
}
