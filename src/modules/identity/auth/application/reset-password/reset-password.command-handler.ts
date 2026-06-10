import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { ResetPasswordCommand } from './reset-password.command';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { PasswordService } from '@/libs/crypto/password.service';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';

@CommandHandler(ResetPasswordCommand)
@Injectable()
export class ResetPasswordCommandHandler implements ICommandHandler<
  ResetPasswordCommand,
  void
> {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  async execute(command: ResetPasswordCommand): Promise<void> {
    const { token, email, newPassword } = command;

    const user = await this.prismaService.client.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new ApplicationException('User not found', 404, 'USER_NOT_FOUND');
    }

    if (!user.passwordResetToken || !user.passwordResetExpiresAt) {
      throw new ApplicationException(
        'Reset token not found or already used',
        400,
        'RESET_TOKEN_INVALID',
      );
    }

    if (user.passwordResetExpiresAt < new Date()) {
      throw new ApplicationException(
        'Reset token has expired',
        400,
        'RESET_TOKEN_EXPIRED',
      );
    }

    const valid = await this.passwordService.verify(
      user.passwordResetToken,
      token,
    );
    if (!valid) {
      throw new ApplicationException(
        'Invalid reset token',
        400,
        'RESET_TOKEN_INVALID',
      );
    }

    const hashedPassword = await this.passwordService.hash(newPassword);

    // Update password, clear token, and invalidate all sessions
    await this.prismaService.client.$transaction([
      this.prismaService.client.user.update({
        where: { id: user.id },
        data: {
          hashedPassword,
          passwordResetToken: null,
          passwordResetExpiresAt: null,
        },
      }),
      this.prismaService.client.token.deleteMany({
        where: { userId: user.id },
      }),
    ]);
  }
}
