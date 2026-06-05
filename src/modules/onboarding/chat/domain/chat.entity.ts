import { randomUUID } from 'node:crypto';
import { AggregateId, Entity } from '@/libs/ddd/entity.base';
import {
  OnboardingChatMessageProps,
  OnboardingChatProps,
} from '@/modules/onboarding/chat/chat.types';

export class OnboardingChatEntity extends Entity<OnboardingChatProps> {
  protected readonly _id: AggregateId;
  private readonly _pendingMessages: OnboardingChatMessageProps[] = [];

  private constructor(props: OnboardingChatProps, id: AggregateId) {
    super({ id, props });
  }

  static create(onboardingId: string): OnboardingChatEntity {
    return new OnboardingChatEntity(
      {
        onboardingId,
        messages: [],
        createdAt: new Date(),
      },
      randomUUID(),
    );
  }

  static hydrate(
    props: OnboardingChatProps,
    id: AggregateId,
  ): OnboardingChatEntity {
    return new OnboardingChatEntity(props, id);
  }

  postMessage(input: {
    senderId: string;
    body: string;
    allowedSenderIds: ReadonlyArray<string>;
  }): OnboardingChatMessageProps {
    if (!input.allowedSenderIds.includes(input.senderId)) {
      throw new Error('Sender is not a participant in this chat');
    }
    const body = input.body.trim();
    if (body.length === 0) {
      throw new Error('Message body cannot be empty');
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
