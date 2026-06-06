import { Injectable } from '@nestjs/common';
import { None, Option, Some } from 'oxide.ts';
import { PrismaRepositoryBase } from '@/infra/prisma/prisma.repository.base';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { AggregateId } from '@/libs/ddd/entity.base';
import { OnboardingChatEntity } from '@/modules/onboarding/chat/domain/chat.entity';
import { OnboardingChatRepositoryPort } from '@/modules/onboarding/chat/application/ports/chat.repository.port';
import {
  OnboardingChatMapper,
  onboardingChatInclude,
} from '@/modules/onboarding/chat/chat.mapper';

@Injectable()
export class OnboardingChatPrismaRepository
  extends PrismaRepositoryBase
  implements OnboardingChatRepositoryPort
{
  constructor(
    prismaService: PrismaService,
    private readonly mapper: OnboardingChatMapper,
  ) {
    super(prismaService);
  }

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
      include: onboardingChatInclude,
    });
    return row ? Some(this.mapper.toDomain(row)) : None;
  }
}
