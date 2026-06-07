import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SendOnboardingChatMessageCommand } from '@/modules/onboarding/chat/application/send-message/send-message.command';
import { SendOnboardingChatMessageRequestDto } from '@/modules/onboarding/chat/presentation/dto/send-message.request.dto';
import { IdResponseDto } from '@/libs/api/dto';
import { CurrentUser } from '@/libs/auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '@/libs/auth/decorators/current-user.decorator';

@ApiTags('onboarding-chat')
@Controller('onboardings/:onboardingId/chat/messages')
export class OnboardingChatController {
  constructor(private readonly commandBus: CommandBus) {}

  @ApiOperation({ summary: 'Send a message to the onboarding chat' })
  @ApiCreatedResponse({ type: IdResponseDto })
  @ApiNotFoundResponse()
  @ApiForbiddenResponse()
  @Post()
  async sendMessage(
    @Param('onboardingId', ParseUUIDPipe) onboardingId: string,
    @Body() body: SendOnboardingChatMessageRequestDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<IdResponseDto> {
    return this.commandBus.execute<
      SendOnboardingChatMessageCommand,
      IdResponseDto
    >(
      new SendOnboardingChatMessageCommand({
        onboardingId,
        senderId: user.userId,
        body: body.body,
      }),
    );
  }
}
