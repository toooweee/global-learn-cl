import { Command } from '@/libs/application/command.base';

export class SendOnboardingChatMessageCommand extends Command {
  readonly onboardingId: string;
  readonly senderId: string;
  readonly body: string;

  constructor(props: { onboardingId: string; senderId: string; body: string }) {
    super(props);
    this.onboardingId = props.onboardingId;
    this.senderId = props.senderId;
    this.body = props.body;
  }
}
