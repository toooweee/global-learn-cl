import { Command, CommandProps } from '@/libs/application/command.base';

export class DeleteCourseCommand extends Command {
  readonly courseId: string;

  constructor(props: CommandProps<DeleteCourseCommand>) {
    super(props);
    this.courseId = props.courseId;
  }
}
