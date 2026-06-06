import { IsString, IsUUID, Length } from 'class-validator';

export class SendOnboardingChatMessageRequestDto {
  @IsUUID()
  senderId!: string;

  @IsString()
  @Length(1, 4000)
  body!: string;
}
