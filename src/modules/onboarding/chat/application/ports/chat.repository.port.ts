import { Option } from 'oxide.ts';
import { BaseRepositoryPort } from '@/libs/application/repository.port';
import { AggregateId } from '@/libs/ddd/entity.base';
import { OnboardingChatEntity } from '@/modules/onboarding/chat/domain/chat.entity';

export const ONBOARDING_CHAT_REPOSITORY = Symbol('ONBOARDING_CHAT_REPOSITORY');

export interface OnboardingChatRepositoryPort extends BaseRepositoryPort {
  save(chat: OnboardingChatEntity): Promise<void>;
  findByOnboardingId(
    onboardingId: AggregateId,
  ): Promise<Option<OnboardingChatEntity>>;
}
