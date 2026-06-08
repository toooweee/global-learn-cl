import { Command, CommandProps } from '@/libs/application/command.base';

export class CreateLessonCommand extends Command {
  readonly name: string;
  readonly content?: string;

  constructor(props: CommandProps<CreateLessonCommand>) {
    super(props);
    this.name = props.name;
    this.content = props.content;
  }
}
