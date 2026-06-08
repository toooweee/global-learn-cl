import { Command, CommandProps } from '@/libs/application/command.base';

export class ApproveCourseApplicationCommand extends Command {
  readonly applicationId: string;

  constructor(props: CommandProps<ApproveCourseApplicationCommand>) {
    super(props);
    this.applicationId = props.applicationId;
  }
}
