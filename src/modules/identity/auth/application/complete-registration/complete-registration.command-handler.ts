import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { CompleteRegistrationCommand } from '@/modules/identity/auth/application/complete-registration/complete-registration.command';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { PasswordService } from '@/libs/crypto/password.service';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';

@CommandHandler(CompleteRegistrationCommand)
@Injectable()
export class CompleteRegistrationCommandHandler implements ICommandHandler<
  CompleteRegistrationCommand,
  void
> {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  async execute(command: CompleteRegistrationCommand): Promise<void> {
    const { token, email, newPassword } = command;

    const user = await this.prismaService.client.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new ApplicationException('User not found', 404, 'USER_NOT_FOUND');
    }

    if (!user.passwordResetToken || !user.passwordResetExpiresAt) {
      throw new ApplicationException(
        'Invite token not found or already used',
        400,
        'INVITE_TOKEN_INVALID',
      );
    }

    if (user.passwordResetExpiresAt < new Date()) {
      throw new ApplicationException(
        'Invite token has expired',
        400,
        'INVITE_TOKEN_EXPIRED',
      );
    }

    const valid = await this.passwordService.verify(
      user.passwordResetToken,
      token,
    );
    if (!valid) {
      throw new ApplicationException(
        'Invalid invite token',
        400,
        'INVITE_TOKEN_INVALID',
      );
    }

    const hashedPassword = await this.passwordService.hash(newPassword);
    await this.prismaService.client.user.update({
      where: { id: user.id },
      data: {
        hashedPassword,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });
  }
}
