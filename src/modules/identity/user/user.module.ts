import { Module, Provider } from '@nestjs/common';
import { PrismaModule } from '@/infra/prisma/prisma.module';
import { USER_REPOSITORY } from '@/modules/identity/user/application/ports/user.repository.port';
import { UserPrismaRepository } from '@/modules/identity/user/infra/user-prisma.repository';
import { CreateUserCommandHandler } from '@/modules/identity/user/application/commands/create-user/create-user.command-handler';
import { DeleteUserCommandHandler } from '@/modules/identity/user/application/commands/delete-user/delete-user.command-handler';
import { UserController } from '@/modules/identity/user/presentation/user.controller';
import { UserMapper } from '@/modules/identity/user/user.mapper';
import { FindUserQueryHandler } from '@/modules/identity/user/application/queries/find-user/find-user.query-handler';
import { FindUsersQueryHandler } from '@/modules/identity/user/application/queries/find-users/find-users.query-handler';
import { CryptoModule } from '@/libs/crypto/crypto.module';

const repositories: Provider[] = [
  {
    provide: USER_REPOSITORY,
    useClass: UserPrismaRepository,
  },
];

const commandHandlers: Provider[] = [
  CreateUserCommandHandler,
  DeleteUserCommandHandler,
];
const queryHandlers: Provider[] = [FindUserQueryHandler, FindUsersQueryHandler];

@Module({
  imports: [PrismaModule, CryptoModule],
  controllers: [UserController],
  providers: [
    ...repositories,
    ...commandHandlers,
    ...queryHandlers,
    UserMapper,
  ],
  exports: [USER_REPOSITORY, UserMapper],
})
export class UserModule {}
