import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { PrismaService } from '@/infra/prisma/prisma.service';
import {
  ChatMessagesPageResponseDto,
  OnboardingChatMessageResponseDto,
} from '@/modules/onboarding/chat/presentation/dto/message.response.dto';
import { ListChatMessagesQuery } from './list-messages.query';

@QueryHandler(ListChatMessagesQuery)
export class ListChatMessagesQueryHandler implements IQueryHandler<
  ListChatMessagesQuery,
  ChatMessagesPageResponseDto
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(
    query: ListChatMessagesQuery,
  ): Promise<ChatMessagesPageResponseDto> {
    const chat = await this.prismaService.client.onboardingChat.findUnique({
      where: { onboardingId: query.onboardingId },
      select: { id: true },
    });
    if (!chat) {
      throw new ApplicationException(
        'Chat not found for this onboarding',
        404,
        'ONBOARDING_CHAT_NOT_FOUND',
      );
    }

    let cursorFilter: { createdAt: { lt: Date } } | undefined;
    if (query.before) {
      const anchor =
        await this.prismaService.client.onboardingChatMessage.findUnique({
          where: { id: query.before },
          select: { createdAt: true },
        });
      if (anchor) {
        cursorFilter = { createdAt: { lt: anchor.createdAt } };
      }
    }

    // fetch limit+1 to determine if there is a next page
    const rows = await this.prismaService.client.onboardingChatMessage.findMany(
      {
        where: { chatId: chat.id, ...cursorFilter },
        orderBy: { createdAt: 'desc' },
        take: query.limit + 1,
      },
    );

    const hasMore = rows.length > query.limit;
    const page = hasMore ? rows.slice(0, query.limit) : rows;
    const nextCursor = hasMore ? page[page.length - 1].id : null;

    return new ChatMessagesPageResponseDto({
      messages: page.map(
        (m) =>
          new OnboardingChatMessageResponseDto({
            id: m.id,
            senderId: m.senderId,
            body: m.body,
            readAt: m.readAt,
            createdAt: m.createdAt,
          }),
      ),
      nextCursor,
    });
  }
}
