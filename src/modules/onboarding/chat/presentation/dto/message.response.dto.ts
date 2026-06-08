import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OnboardingChatMessageResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  senderId: string;
  @ApiProperty({ example: 'Привет! Как дела с адаптацией?' })
  body: string;
  @ApiPropertyOptional({ example: '2025-11-24T17:43:15.970Z' })
  readAt?: string;
  @ApiProperty({ example: '2025-11-24T17:43:15.970Z' })
  createdAt: string;

  constructor(props: {
    id: string;
    senderId: string;
    body: string;
    readAt: Date | null;
    createdAt: Date;
  }) {
    this.id = props.id;
    this.senderId = props.senderId;
    this.body = props.body;
    this.readAt = props.readAt?.toISOString();
    this.createdAt = props.createdAt.toISOString();
  }
}

export class ChatMessagesPageResponseDto {
  @ApiProperty({ type: [OnboardingChatMessageResponseDto] })
  messages: OnboardingChatMessageResponseDto[];

  @ApiPropertyOptional({
    description:
      'Pass as ?before= for the next page (cursor to the oldest message returned)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  nextCursor: string | null;

  constructor(props: {
    messages: OnboardingChatMessageResponseDto[];
    nextCursor: string | null;
  }) {
    this.messages = props.messages;
    this.nextCursor = props.nextCursor;
  }
}
