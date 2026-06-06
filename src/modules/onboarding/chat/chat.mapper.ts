import { Injectable } from '@nestjs/common';
import { Prisma } from '@generated/client';
import { ToDomain } from '@/libs/ddd/mapper.interface';
import { OnboardingChatEntity } from '@/modules/onboarding/chat/domain/chat.entity';

export const onboardingChatInclude = {
  messages: { orderBy: { createdAt: 'asc' } },
} satisfies Prisma.OnboardingChatInclude;

export type OnboardingChatRecord = Prisma.OnboardingChatGetPayload<{
  include: typeof onboardingChatInclude;
}>;

@Injectable()
export class OnboardingChatMapper implements ToDomain<
  OnboardingChatRecord,
  OnboardingChatEntity
> {
  toDomain(row: OnboardingChatRecord): OnboardingChatEntity {
    return OnboardingChatEntity.recreate({
      id: row.id,
      props: {
        onboardingId: row.onboardingId,
        createdAt: row.createdAt,
        messages: row.messages.map((m) => ({
          id: m.id,
          senderId: m.senderId,
          body: m.body,
          readAt: m.readAt ?? undefined,
          createdAt: m.createdAt,
        })),
      },
    });
  }
}
