import { randomUUID } from 'node:crypto';
import { AggregateId, CreateEntityProps, Entity } from '@/libs/ddd/entity.base';
import { DomainException } from '@/libs/ddd/domain.exception';
import {
  OnboardingChatMessageProps,
  OnboardingChatProps,
} from '@/modules/onboarding/chat/chat.types';

export interface RecreateOnboardingChatProps {
  id: AggregateId;
  props: OnboardingChatProps;
}

export class OnboardingChatEntity extends Entity<OnboardingChatProps> {
  private readonly _pendingMessages: OnboardingChatMessageProps[] = [];

  protected constructor(props: CreateEntityProps<OnboardingChatProps>) {
    super(props);
  }

  static create(onboardingId: string): OnboardingChatEntity {
    return new OnboardingChatEntity({
      id: randomUUID(),
      props: {
        onboardingId,
        messages: [],
        createdAt: new Date(),
      },
    });
  }

  static recreate({
    id,
    props,
  }: RecreateOnboardingChatProps): OnboardingChatEntity {
    return new OnboardingChatEntity({ id, props });
  }

  postMessage(input: {
    senderId: string;
    body: string;
    allowedSenderIds: ReadonlyArray<string>;
  }): OnboardingChatMessageProps {
    if (!input.allowedSenderIds.includes(input.senderId)) {
      throw new DomainException(
        'Sender is not a participant in this chat',
        'ONBOARDING_CHAT_SENDER_FORBIDDEN',
        403,
      );
    }
    const body = input.body.trim();
    if (body.length === 0) {
      throw new DomainException(
        'Message body cannot be empty',
        'ONBOARDING_CHAT_EMPTY_BODY',
      );
    }
    const message: OnboardingChatMessageProps = {
      id: randomUUID(),
      senderId: input.senderId,
      body,
      createdAt: new Date(),
    };
    this._props.messages.push(message);
    this._pendingMessages.push(message);
    return message;
  }

  pullPendingMessages(): OnboardingChatMessageProps[] {
    const out = this._pendingMessages.slice();
    this._pendingMessages.length = 0;
    return out;
  }
}
