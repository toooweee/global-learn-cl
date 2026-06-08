import { Command, CommandProps } from '@/libs/application/command.base';

export class ApplyForCourseCommand extends Command {
  readonly courseId: string;

  constructor(props: CommandProps<ApplyForCourseCommand>) {
    super(props);
    this.courseId = props.courseId;
  }
}
