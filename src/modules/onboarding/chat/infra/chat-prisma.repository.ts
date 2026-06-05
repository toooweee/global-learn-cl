import { Injectable } from '@nestjs/common';
import { None, Option, Some } from 'oxide.ts';
import { PrismaRepositoryBase } from '@/infra/prisma/prisma.repository.base';
import { AggregateId } from '@/libs/ddd/entity.base';
import { OnboardingChatEntity } from '@/modules/onboarding/chat/domain/chat.entity';
import { OnboardingChatRepositoryPort } from '@/modules/onboarding/chat/application/ports/chat.repository.port';

type PrismaChat = {
  id: string;
  onboardingId: string;
  createdAt: Date;
  messages: Array<{
    id: string;
    senderId: string;
    body: string;
    readAt: Date | null;
    createdAt: Date;
  }>;
};

@Injectable()
export class OnboardingChatPrismaRepository
  extends PrismaRepositoryBase
  implements OnboardingChatRepositoryPort
{
  async save(chat: OnboardingChatEntity): Promise<void> {
    const props = chat.getProps();
    const existing = await this.db.onboardingChat.findUnique({
      where: { id: chat.id },
      select: { id: true },
    });

    if (!existing) {
      await this.db.onboardingChat.create({
        data: {
          id: chat.id,
          onboardingId: props.onboardingId,
          createdAt: props.createdAt,
        },
      });
    }

    const pending = chat.pullPendingMessages();
    if (pending.length > 0) {
      await this.db.onboardingChatMessage.createMany({
        data: pending.map((m) => ({
          id: m.id,
          chatId: chat.id,
          senderId: m.senderId,
          body: m.body,
          createdAt: m.createdAt,
        })),
      });
    }
  }

  async findByOnboardingId(
    onboardingId: AggregateId,
  ): Promise<Option<OnboardingChatEntity>> {
    const row = await this.db.onboardingChat.findUnique({
      where: { onboardingId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!row) return None;
    const r = row as PrismaChat;
    return Some(
      OnboardingChatEntity.hydrate(
        {
          onboardingId: r.onboardingId,
          createdAt: r.createdAt,
          messages: r.messages.map((m) => ({
            id: m.id,
            senderId: m.senderId,
            body: m.body,
            readAt: m.readAt ?? undefined,
            createdAt: m.createdAt,
          })),
        },
        r.id,
      ),
    );
  }
}
