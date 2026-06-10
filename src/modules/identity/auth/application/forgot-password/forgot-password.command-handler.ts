import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { ForgotPasswordCommand } from './forgot-password.command';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { PasswordService } from '@/libs/crypto/password.service';
import { MailService } from '@/modules/mail/mail.service';
import { EnvService } from '@/infra/env/env.service';

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

@CommandHandler(ForgotPasswordCommand)
@Injectable()
export class ForgotPasswordCommandHandler implements ICommandHandler<
  ForgotPasswordCommand,
  void
> {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly mailService: MailService,
    private readonly envService: EnvService,
  ) {}

  async execute(command: ForgotPasswordCommand): Promise<void> {
    const { email } = command;

    const user = await this.prismaService.client.user.findUnique({
      where: { email },
    });

    // Always return successfully to prevent email enumeration
    if (!user) return;

    const rawToken = randomBytes(32).toString('hex');
    const hashedToken = await this.passwordService.hash(rawToken);
    const expiresAt = new Date(Date.now() + RESET_TTL_MS);

    await this.prismaService.client.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpiresAt: expiresAt,
      },
    });

    const appUrl = this.envService.get('APP_URL');
    const resetLink = `${appUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;
    await this.mailService.sendPasswordReset(email, { resetLink });
  }
}
