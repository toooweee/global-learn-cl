import { Command, CommandProps } from '@/libs/application';

export class PublishCourseCommand extends Command {
  readonly courseId: string;
  constructor(props: CommandProps<PublishCourseCommand>) {
    super(props);
    this.courseId = props.courseId;
  }
}
