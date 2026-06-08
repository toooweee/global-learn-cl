import { ICommand } from '@nestjs/cqrs';
import { Command, CommandProps } from '@/libs/application/command.base';

export class MarkChatMessagesReadCommand extends Command implements ICommand {
  readonly onboardingId: string;
  readonly readerId: string;
  constructor(props: CommandProps<MarkChatMessagesReadCommand>) {
    super(props);
    this.onboardingId = props.onboardingId;
    this.readerId = props.readerId;
  }
}
