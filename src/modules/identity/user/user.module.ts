import { Module, Provider } from '@nestjs/common';
import { PrismaModule } from '@/infra/prisma/prisma.module';
import { USER_REPOSITORY } from '@/modules/identity/user/application/ports/user.repository.port';
import { UserPrismaRepository } from '@/modules/identity/user/infra/user-prisma.repository';
import { CreateUserCommandHandler } from '@/modules/identity/user/application/commands/create-user/create-user.command-handler';
import { UserController } from '@/modules/identity/user/presentation/user.controller';

const repositories: Provider[] = [
  {
    provide: USER_REPOSITORY,
    useClass: UserPrismaRepository,
  },
];

const commandHandlers: Provider[] = [CreateUserCommandHandler];

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [...repositories, ...commandHandlers],
})
export class UserModule {}
