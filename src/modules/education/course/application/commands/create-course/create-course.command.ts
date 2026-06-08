import { Command, CommandProps } from '@/libs/application/command.base';

export class CreateCourseCommand extends Command {
  readonly name: string;
  readonly description: string;
  readonly coverId?: string;

  constructor(props: CommandProps<CreateCourseCommand>) {
    super(props);
    this.name = props.name;
    this.description = props.description;
    this.coverId = props.coverId;
  }
}
