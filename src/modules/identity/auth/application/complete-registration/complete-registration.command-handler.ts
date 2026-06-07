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
    const { email, newPassword } = command;

    const user = await this.prismaService.client.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new ApplicationException('User not found', 404, 'USER_NOT_FOUND');
    }

    const hashedPassword = await this.passwordService.hash(newPassword);
    await this.prismaService.client.user.update({
      where: { id: user.id },
      data: { hashedPassword },
    });
  }
}
