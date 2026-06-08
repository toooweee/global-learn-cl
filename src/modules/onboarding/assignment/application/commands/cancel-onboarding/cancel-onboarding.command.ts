import { ICommand } from '@nestjs/cqrs';
import { Command, CommandProps } from '@/libs/application/command.base';

export class CancelOnboardingCommand extends Command implements ICommand {
  readonly onboardingId: string;
  constructor(props: CommandProps<CancelOnboardingCommand>) {
    super(props);
    this.onboardingId = props.onboardingId;
  }
}
