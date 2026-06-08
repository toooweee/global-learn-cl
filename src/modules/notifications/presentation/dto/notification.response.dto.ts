import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NotificationResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'ONBOARDING_ASSIGNED' })
  type: string;

  @ApiPropertyOptional({ example: { onboardingId: '...' } })
  payload: unknown;

  @ApiPropertyOptional({ example: '2025-11-24T17:43:15.970Z' })
  readAt?: string;

  @ApiProperty({ example: '2025-11-24T17:43:15.970Z' })
  createdAt: string;

  constructor(props: {
    id: string;
    type: string;
    payload: unknown;
    readAt: Date | null;
    createdAt: Date;
  }) {
    this.id = props.id;
    this.type = props.type;
    this.payload = props.payload;
    this.readAt = props.readAt?.toISOString();
    this.createdAt = props.createdAt.toISOString();
  }
}
