import { Command, CommandProps } from '@/libs/application/command.base';

export class CompleteStepCommand extends Command {
  readonly enrollmentId: string;
  readonly stepId: string;

  constructor(props: CommandProps<CompleteStepCommand>) {
    super(props);
    this.enrollmentId = props.enrollmentId;
    this.stepId = props.stepId;
  }
}
