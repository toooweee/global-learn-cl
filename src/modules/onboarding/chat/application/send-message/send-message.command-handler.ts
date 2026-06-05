import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SendOnboardingChatMessageCommand } from '@/modules/onboarding/chat/application/send-message/send-message.command';
import { ONBOARDING_CHAT_REPOSITORY } from '@/modules/onboarding/chat/application/ports/chat.repository.port';
import type { OnboardingChatRepositoryPort } from '@/modules/onboarding/chat/application/ports/chat.repository.port';
import { ONBOARDING_REPOSITORY } from '@/modules/onboarding/assignment/application/ports/onboarding.repository.port';
import type { OnboardingRepositoryPort } from '@/modules/onboarding/assignment/application/ports/onboarding.repository.port';
import { IdResponseDto } from '@/libs/api/dto';

@CommandHandler(SendOnboardingChatMessageCommand)
export class SendOnboardingChatMessageHandler implements ICommandHandler<
  SendOnboardingChatMessageCommand,
  IdResponseDto
> {
  constructor(
    @Inject(ONBOARDING_CHAT_REPOSITORY)
    private readonly chatRepository: OnboardingChatRepositoryPort,
    @Inject(ONBOARDING_REPOSITORY)
    private readonly onboardingRepository: OnboardingRepositoryPort,
  ) {}

  async execute(
    command: SendOnboardingChatMessageCommand,
  ): Promise<IdResponseDto> {
    return this.chatRepository.transaction(async () => {
      const onboarding = await this.onboardingRepository.findById(
        command.onboardingId,
      );
      if (onboarding.isNone()) {
        throw new NotFoundException('Onboarding not found');
      }
      const o = onboarding.unwrap().getProps();

      const chat = await this.chatRepository.findByOnboardingId(
        command.onboardingId,
      );
      if (chat.isNone()) {
        throw new NotFoundException('Chat not found for this onboarding');
      }
      const c = chat.unwrap();
      const message = c.postMessage({
        senderId: command.senderId,
        body: command.body,
        allowedSenderIds: [o.assignedById, o.assignedToId],
      });
      await this.chatRepository.save(c);
      return new IdResponseDto(message.id);
    });
  }
}
