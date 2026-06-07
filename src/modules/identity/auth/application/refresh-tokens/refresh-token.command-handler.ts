import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { RefreshTokenCommand } from '@/modules/identity/auth/application/refresh-tokens/refresh-token.command';
import { PrismaService } from '@/infra/prisma/prisma.service';
import {
  TokenService,
  TokenIssuance,
} from '@/modules/identity/token/token.service';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';

@CommandHandler(RefreshTokenCommand)
@Injectable()
export class RefreshTokenCommandHandler implements ICommandHandler<
  RefreshTokenCommand,
  TokenIssuance
> {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<TokenIssuance> {
    const { refreshTokenCookie, userAgent } = command;

    const userId = await this.tokenService.verifyRefreshCookie(
      refreshTokenCookie,
      userAgent,
    );

    const user = await this.prismaService.client.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new ApplicationException('User not found', 404, 'USER_NOT_FOUND');
    }

    return this.tokenService.issueTokenPair(userId, user.role.name, userAgent);
  }
}
