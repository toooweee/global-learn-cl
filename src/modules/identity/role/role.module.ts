import { Module, Provider } from '@nestjs/common';
import { PrismaModule } from '@/infra/prisma/prisma.module';
import { ROLE_REPOSITORY } from '@/modules/identity/role/application/ports/role.repository.port';
import { RolePrismaRepository } from '@/modules/identity/role/infra/role-prisma.repository';
import { RoleMapper } from '@/modules/identity/role/role.mapper';
import { CreateRoleCommandHandler } from '@/modules/identity/role/application/commands/create-role/create-role.command-handler';
import { DeleteRoleCommandHandler } from '@/modules/identity/role/application/commands/delete-role/delete-role.command-handler';
import { FindRoleQueryHandler } from '@/modules/identity/role/application/queries/find-role/find-role.query-handler';
import { FindRolesQueryHandler } from '@/modules/identity/role/application/queries/find-roles/find-roles.query-handler';
import { RoleController } from '@/modules/identity/role/presentation/role.controller';

const repositories: Provider[] = [
  { provide: ROLE_REPOSITORY, useClass: RolePrismaRepository },
];

const commandHandlers: Provider[] = [
  CreateRoleCommandHandler,
  DeleteRoleCommandHandler,
];

const queryHandlers: Provider[] = [FindRoleQueryHandler, FindRolesQueryHandler];

@Module({
  imports: [PrismaModule],
  controllers: [RoleController],
  providers: [
    ...repositories,
    ...commandHandlers,
    ...queryHandlers,
    RoleMapper,
  ],
  exports: [ROLE_REPOSITORY],
})
export class RoleModule {}
