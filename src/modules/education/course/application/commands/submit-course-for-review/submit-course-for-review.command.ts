import { Command, CommandProps } from '@/libs/application';

export class SubmitCourseForReviewCommand extends Command {
  readonly courseId: string;
  constructor(props: CommandProps<SubmitCourseForReviewCommand>) {
    super(props);
    this.courseId = props.courseId;
  }
}
