import { Module, Provider } from '@nestjs/common';
import { PrismaModule } from '@/infra/prisma/prisma.module';
import { USER_REPOSITORY } from '@/modules/identity/user/application/ports/user.repository.port';
import { UserPrismaRepository } from '@/modules/identity/user/infra/user-prisma.repository';
import { CreateUserCommandHandler } from '@/modules/identity/user/application/commands/create-user/create-user.command-handler';
import { UserController } from '@/modules/identity/user/presentation/user.controller';
import { UserMapper } from '@/modules/identity/user/user.mapper';
import { FindUserQueryHandler } from '@/modules/identity/user/application/queries/find-user/find-user.query-handler';
import { FindUsersQueryHandler } from '@/modules/identity/user/application/queries/find-users/find-users.query-handler';

const repositories: Provider[] = [
  {
    provide: USER_REPOSITORY,
    useClass: UserPrismaRepository,
  },
];

const commandHandlers: Provider[] = [CreateUserCommandHandler];
const queryHandlers: Provider[] = [FindUserQueryHandler, FindUsersQueryHandler];

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [
    ...repositories,
    ...commandHandlers,
    ...queryHandlers,
    UserMapper,
  ],
})
export class UserModule {}
