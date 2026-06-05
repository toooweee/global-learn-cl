import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { SendOnboardingChatMessageCommand } from '@/modules/onboarding/chat/application/send-message/send-message.command';
import { SendOnboardingChatMessageDto } from '@/modules/onboarding/chat/presentation/dto/send-message.dto';
import { IdResponseDto } from '@/libs/api/dto';

@Controller('onboardings/:onboardingId/chat/messages')
export class OnboardingChatController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  async sendMessage(
    @Param('onboardingId', ParseUUIDPipe) onboardingId: string,
    @Body() dto: SendOnboardingChatMessageDto,
  ): Promise<IdResponseDto> {
    return this.commandBus.execute<
      SendOnboardingChatMessageCommand,
      IdResponseDto
    >(
      new SendOnboardingChatMessageCommand({
        onboardingId,
        senderId: dto.senderId,
        body: dto.body,
      }),
    );
  }
}
