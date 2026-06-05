import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe, createZodDto } from 'nestjs-zod';
import { SendOnboardingChatMessageHandler } from '@/modules/onboarding/chat/application/send-message/send-message.command-handler';
import { SendOnboardingChatMessageCommand } from '@/modules/onboarding/chat/application/send-message/send-message.command';

const SendMessageSchema = z.object({
  senderId: z.string().uuid(),
  body: z.string().min(1).max(4000),
});

export class SendOnboardingChatMessageDto extends createZodDto(
  SendMessageSchema,
) {}

@Controller('onboardings/:onboardingId/chat/messages')
export class OnboardingChatController {
  constructor(
    private readonly sendMessageHandler: SendOnboardingChatMessageHandler,
  ) {}

  @Post()
  async sendMessage(
    @Param('onboardingId', ParseUUIDPipe) onboardingId: string,
    @Body(ZodValidationPipe) body: SendOnboardingChatMessageDto,
  ) {
    return this.sendMessageHandler.execute(
      new SendOnboardingChatMessageCommand({
        onboardingId,
        senderId: body.senderId,
        body: body.body,
      }),
    );
  }
}
