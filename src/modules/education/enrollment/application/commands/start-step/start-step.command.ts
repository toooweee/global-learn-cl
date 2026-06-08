import { Command, CommandProps } from '@/libs/application/command.base';

export class StartStepCommand extends Command {
  readonly enrollmentId: string;
  readonly stepId: string;

  constructor(props: CommandProps<StartStepCommand>) {
    super(props);
    this.enrollmentId = props.enrollmentId;
    this.stepId = props.stepId;
  }
}
