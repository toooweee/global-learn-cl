import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SendOnboardingChatMessageCommand } from '@/modules/onboarding/chat/application/send-message/send-message.command';
import { MarkChatMessagesReadCommand } from '@/modules/onboarding/chat/application/commands/mark-messages-read/mark-messages-read.command';
import { ListChatMessagesQuery } from '@/modules/onboarding/chat/application/queries/list-messages/list-messages.query';
import { SendOnboardingChatMessageRequestDto } from '@/modules/onboarding/chat/presentation/dto/send-message.request.dto';
import { ChatMessagesPageResponseDto } from '@/modules/onboarding/chat/presentation/dto/message.response.dto';
import { IdResponseDto } from '@/libs/api/dto';
import { CurrentUser } from '@/libs/auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '@/libs/auth/decorators/current-user.decorator';
import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

class ChatMessagesQueryDto {
  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Cursor (message id) for pagination',
  })
  @IsOptional()
  @IsUUID()
  before?: string;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  limit?: number;
}

@ApiTags('onboarding-chat')
@Controller('onboardings/:onboardingId/chat/messages')
export class OnboardingChatController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get chat messages (cursor-based, newest first)' })
  @ApiOkResponse({ type: ChatMessagesPageResponseDto })
  @ApiNotFoundResponse()
  listMessages(
    @Param('onboardingId', ParseUUIDPipe) onboardingId: string,
    @Query() query: ChatMessagesQueryDto,
  ): Promise<ChatMessagesPageResponseDto> {
    return this.queryBus.execute(
      new ListChatMessagesQuery({
        onboardingId,
        before: query.before,
        limit: query.limit ? Number(query.limit) : undefined,
      }),
    );
  }

  @Post()
  @ApiOperation({ summary: 'Send a message to the onboarding chat' })
  @ApiCreatedResponse({ type: IdResponseDto })
  @ApiNotFoundResponse()
  @ApiForbiddenResponse()
  sendMessage(
    @Param('onboardingId', ParseUUIDPipe) onboardingId: string,
    @Body() body: SendOnboardingChatMessageRequestDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<IdResponseDto> {
    return this.commandBus.execute(
      new SendOnboardingChatMessageCommand({
        onboardingId,
        senderId: user.userId,
        body: body.body,
      }),
    );
  }

  @Post('read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark all messages from others as read' })
  @ApiNoContentResponse()
  async markRead(
    @Param('onboardingId', ParseUUIDPipe) onboardingId: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<void> {
    await this.commandBus.execute(
      new MarkChatMessagesReadCommand({ onboardingId, readerId: user.userId }),
    );
  }
}
