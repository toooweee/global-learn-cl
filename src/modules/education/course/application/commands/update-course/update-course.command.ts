import { Command, CommandProps } from '@/libs/application/command.base';

export class UpdateCourseCommand extends Command {
  readonly courseId: string;
  readonly name?: string;
  readonly description?: string;
  readonly coverId?: string | null;

  constructor(props: CommandProps<UpdateCourseCommand>) {
    super(props);
    this.courseId = props.courseId;
    this.name = props.name;
    this.description = props.description;
    this.coverId = props.coverId;
  }
}
