import { Command, CommandProps } from '@/libs/application/command.base';

export class AddModuleCommand extends Command {
  readonly courseId: string;
  readonly name: string;

  constructor(props: CommandProps<AddModuleCommand>) {
    super(props);
    this.courseId = props.courseId;
    this.name = props.name;
  }
}
