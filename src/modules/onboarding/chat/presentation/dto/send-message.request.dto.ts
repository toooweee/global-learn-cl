import { IsString, Length } from 'class-validator';

export class SendOnboardingChatMessageRequestDto {
  @IsString()
  @Length(1, 4000)
  body!: string;
}
