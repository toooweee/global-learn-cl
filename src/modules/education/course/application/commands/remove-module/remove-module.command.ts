import { Command, CommandProps } from '@/libs/application/command.base';

export class RemoveModuleCommand extends Command {
  readonly courseId: string;
  readonly moduleId: string;

  constructor(props: CommandProps<RemoveModuleCommand>) {
    super(props);
    this.courseId = props.courseId;
    this.moduleId = props.moduleId;
  }
}
