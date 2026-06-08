import { Command, CommandProps } from '@/libs/application/command.base';

export class RejectCourseApplicationCommand extends Command {
  readonly applicationId: string;

  constructor(props: CommandProps<RejectCourseApplicationCommand>) {
    super(props);
    this.applicationId = props.applicationId;
  }
}
