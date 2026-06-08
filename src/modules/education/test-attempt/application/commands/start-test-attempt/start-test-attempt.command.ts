import { Command, CommandProps } from '@/libs/application/command.base';

export class StartTestAttemptCommand extends Command {
  readonly testId: string;

  constructor(props: CommandProps<StartTestAttemptCommand>) {
    super(props);
    this.testId = props.testId;
  }
}
