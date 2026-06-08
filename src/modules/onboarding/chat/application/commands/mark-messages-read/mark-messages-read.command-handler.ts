import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { MarkChatMessagesReadCommand } from './mark-messages-read.command';

@CommandHandler(MarkChatMessagesReadCommand)
export class MarkChatMessagesReadCommandHandler implements ICommandHandler<
  MarkChatMessagesReadCommand,
  void
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(command: MarkChatMessagesReadCommand): Promise<void> {
    const chat = await this.prismaService.client.onboardingChat.findUnique({
      where: { onboardingId: command.onboardingId },
      select: { id: true },
    });
    if (!chat) return;

    await this.prismaService.client.onboardingChatMessage.updateMany({
      where: {
        chatId: chat.id,
        senderId: { not: command.readerId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });
  }
}
