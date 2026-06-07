import { Module, Provider } from '@nestjs/common';
import { TokenModule } from '@/modules/identity/token/token.module';
import { PrismaModule } from '@/infra/prisma/prisma.module';
import { CryptoModule } from '@/libs/crypto/crypto.module';
import { AuthController } from '@/modules/identity/auth/presentation/auth.controller';
import { RegisterCommandHandler } from '@/modules/identity/auth/application/register/register.command-handler';
import { LoginCommandHandler } from '@/modules/identity/auth/application/login/login.command-handler';
import { LogoutCommandHandler } from '@/modules/identity/auth/application/logout/logout.command-handler';
import { RefreshTokenCommandHandler } from '@/modules/identity/auth/application/refresh-tokens/refresh-token.command-handler';
import { ChangePasswordCommandHandler } from '@/modules/identity/auth/application/change-password/change-password.command-handler';
import { CompleteRegistrationCommandHandler } from '@/modules/identity/auth/application/complete-registration/complete-registration.command-handler';

const commandHandlers: Provider[] = [
  RegisterCommandHandler,
  LoginCommandHandler,
  LogoutCommandHandler,
  RefreshTokenCommandHandler,
  ChangePasswordCommandHandler,
  CompleteRegistrationCommandHandler,
];

@Module({
  imports: [TokenModule, PrismaModule, CryptoModule],
  controllers: [AuthController],
  providers: [...commandHandlers],
})
export class AuthModule {}
