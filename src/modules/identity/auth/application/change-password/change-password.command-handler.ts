import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Inject } from '@nestjs/common';
import { ChangePasswordCommand } from '@/modules/identity/auth/application/change-password/change-password.command';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { PasswordService } from '@/libs/crypto/password.service';
import {
  TOKEN_REPOSITORY,
  type TokenRepositoryPort,
} from '@/modules/identity/token/application/ports/token.repository.port';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';

@CommandHandler(ChangePasswordCommand)
@Injectable()
export class ChangePasswordCommandHandler implements ICommandHandler<
  ChangePasswordCommand,
  void
> {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly passwordService: PasswordService,
    @Inject(TOKEN_REPOSITORY)
    private readonly tokenRepository: TokenRepositoryPort,
  ) {}

  async execute(command: ChangePasswordCommand): Promise<void> {
    const { userId, oldPassword, newPassword } = command;

    const user = await this.prismaService.client.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new ApplicationException('User not found', 404, 'USER_NOT_FOUND');
    }

    const valid = await this.passwordService.verify(
      user.hashedPassword,
      oldPassword,
    );
    if (!valid) {
      throw new ApplicationException(
        'Invalid current password',
        400,
        'INVALID_PASSWORD',
      );
    }

    const hashedPassword = await this.passwordService.hash(newPassword);

    await this.prismaService.client.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { hashedPassword } });
      await tx.token.deleteMany({ where: { userId } });
    });
  }
}
