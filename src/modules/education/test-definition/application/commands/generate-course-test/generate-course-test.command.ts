import { Command, CommandProps } from '@/libs/application';

export class GenerateCourseTestCommand extends Command {
  readonly courseId: string;
  readonly count?: number;
  readonly passingPercent?: number;

  constructor(props: CommandProps<GenerateCourseTestCommand>) {
    super(props);
    this.courseId = props.courseId;
    this.count = props.count;
    this.passingPercent = props.passingPercent;
  }
}
