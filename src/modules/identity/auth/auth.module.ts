import { Module, Provider } from '@nestjs/common';
import { TokenModule } from '@/modules/identity/token/token.module';
import { PrismaModule } from '@/infra/prisma/prisma.module';
import { CryptoModule } from '@/libs/crypto/crypto.module';
import { MailModule } from '@/modules/mail/mail.module';
import { AuthController } from '@/modules/identity/auth/presentation/auth.controller';
import { RegisterCommandHandler } from '@/modules/identity/auth/application/register/register.command-handler';
import { LoginCommandHandler } from '@/modules/identity/auth/application/login/login.command-handler';
import { LogoutCommandHandler } from '@/modules/identity/auth/application/logout/logout.command-handler';
import { RefreshTokenCommandHandler } from '@/modules/identity/auth/application/refresh-tokens/refresh-token.command-handler';
import { ChangePasswordCommandHandler } from '@/modules/identity/auth/application/change-password/change-password.command-handler';
import { CompleteRegistrationCommandHandler } from '@/modules/identity/auth/application/complete-registration/complete-registration.command-handler';
import { ForgotPasswordCommandHandler } from '@/modules/identity/auth/application/forgot-password/forgot-password.command-handler';
import { ResetPasswordCommandHandler } from '@/modules/identity/auth/application/reset-password/reset-password.command-handler';
import { GetMeQueryHandler } from '@/modules/identity/auth/application/queries/get-me/get-me.query-handler';
import { GetMyProfileQueryHandler } from '@/modules/identity/auth/application/queries/get-my-profile/get-my-profile.query-handler';
import { EnvModule } from '@/infra/env/env.module';

const commandHandlers: Provider[] = [
  RegisterCommandHandler,
  LoginCommandHandler,
  LogoutCommandHandler,
  RefreshTokenCommandHandler,
  ChangePasswordCommandHandler,
  CompleteRegistrationCommandHandler,
  ForgotPasswordCommandHandler,
  ResetPasswordCommandHandler,
];

@Module({
  imports: [EnvModule, TokenModule, PrismaModule, CryptoModule, MailModule],
  controllers: [AuthController],
  providers: [...commandHandlers, GetMeQueryHandler, GetMyProfileQueryHandler],
})
export class AuthModule {}
