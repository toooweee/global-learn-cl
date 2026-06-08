import { Command, CommandProps } from '@/libs/application/command.base';

export class DeleteLessonCommand extends Command {
  readonly lessonId: string;

  constructor(props: CommandProps<DeleteLessonCommand>) {
    super(props);
    this.lessonId = props.lessonId;
  }
}
