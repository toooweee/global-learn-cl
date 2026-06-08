import { Command, CommandProps } from '@/libs/application/command.base';

export class ArchiveCourseCommand extends Command {
  readonly courseId: string;
  readonly archive: boolean;

  constructor(props: CommandProps<ArchiveCourseCommand>) {
    super(props);
    this.courseId = props.courseId;
    this.archive = props.archive;
  }
}
