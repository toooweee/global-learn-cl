import { IsString, IsUUID, Length } from 'class-validator';

export class SendOnboardingChatMessageDto {
  @IsUUID()
  senderId!: string;

  @IsString()
  @Length(1, 4000)
  body!: string;
}
