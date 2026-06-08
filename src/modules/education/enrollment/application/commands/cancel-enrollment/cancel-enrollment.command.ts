import { Command, CommandProps } from '@/libs/application/command.base';

export class CancelEnrollmentCommand extends Command {
  readonly enrollmentId: string;

  constructor(props: CommandProps<CancelEnrollmentCommand>) {
    super(props);
    this.enrollmentId = props.enrollmentId;
  }
}
