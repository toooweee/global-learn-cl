import { Command, CommandProps } from '@/libs/application/command.base';
import { StepType } from '@generated/client';

export class AddStepCommand extends Command {
  readonly courseId: string;
  readonly moduleId: string;
  readonly name: string;
  readonly type: StepType;
  readonly lessonId?: string;
  readonly testId?: string;

  constructor(props: CommandProps<AddStepCommand>) {
    super(props);
    this.courseId = props.courseId;
    this.moduleId = props.moduleId;
    this.name = props.name;
    this.type = props.type;
    this.lessonId = props.lessonId;
    this.testId = props.testId;
  }
}
