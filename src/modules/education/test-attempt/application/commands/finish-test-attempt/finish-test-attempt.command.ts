import { Command, CommandProps } from '@/libs/application/command.base';

export class FinishTestAttemptCommand extends Command {
  readonly attemptId: string;

  constructor(props: CommandProps<FinishTestAttemptCommand>) {
    super(props);
    this.attemptId = props.attemptId;
  }
}
