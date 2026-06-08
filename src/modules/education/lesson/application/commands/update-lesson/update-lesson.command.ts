import { Command, CommandProps } from '@/libs/application/command.base';

export class UpdateLessonCommand extends Command {
  readonly lessonId: string;
  readonly name?: string;
  readonly content?: string;

  constructor(props: CommandProps<UpdateLessonCommand>) {
    super(props);
    this.lessonId = props.lessonId;
    this.name = props.name;
    this.content = props.content;
  }
}
