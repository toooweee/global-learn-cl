import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { LoginCommand } from '@/modules/identity/auth/application/login/login.command';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { PasswordService } from '@/libs/crypto/password.service';
import {
  TokenService,
  TokenIssuance,
} from '@/modules/identity/token/token.service';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';

@CommandHandler(LoginCommand)
@Injectable()
export class LoginCommandHandler implements ICommandHandler<
  LoginCommand,
  TokenIssuance
> {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(command: LoginCommand): Promise<TokenIssuance> {
    const { email, password, userAgent } = command;

    const user = await this.prismaService.client.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user) {
      throw new ApplicationException(
        'Invalid credentials',
        401,
        'INVALID_CREDENTIALS',
      );
    }

    const passwordValid = await this.passwordService.verify(
      user.hashedPassword,
      password,
    );
    if (!passwordValid) {
      throw new ApplicationException(
        'Invalid credentials',
        401,
        'INVALID_CREDENTIALS',
      );
    }

    return this.tokenService.issueTokenPair(user.id, user.role.name, userAgent);
  }
}
