import { Command, CommandProps } from '@/libs/application';

export class RejectCourseCommand extends Command {
  readonly courseId: string;
  readonly note?: string;
  constructor(props: CommandProps<RejectCourseCommand>) {
    super(props);
    this.courseId = props.courseId;
    this.note = props.note;
  }
}
