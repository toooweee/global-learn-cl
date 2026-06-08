import { Command, CommandProps } from '@/libs/application/command.base';

export class RemoveStepCommand extends Command {
  readonly courseId: string;
  readonly moduleId: string;
  readonly stepId: string;

  constructor(props: CommandProps<RemoveStepCommand>) {
    super(props);
    this.courseId = props.courseId;
    this.moduleId = props.moduleId;
    this.stepId = props.stepId;
  }
}
