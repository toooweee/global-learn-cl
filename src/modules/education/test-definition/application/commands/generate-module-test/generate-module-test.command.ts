import { Command, CommandProps } from '@/libs/application';

export class GenerateModuleTestCommand extends Command {
  readonly courseId: string;
  readonly moduleId: string;
  readonly count?: number;
  readonly passingPercent?: number;

  constructor(props: CommandProps<GenerateModuleTestCommand>) {
    super(props);
    this.courseId = props.courseId;
    this.moduleId = props.moduleId;
    this.count = props.count;
    this.passingPercent = props.passingPercent;
  }
}
