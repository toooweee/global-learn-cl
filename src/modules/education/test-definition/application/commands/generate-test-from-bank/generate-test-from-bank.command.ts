import { Command, CommandProps } from '@/libs/application';

export class GenerateTestFromBankCommand extends Command {
  readonly testId: string;
  readonly courseId: string;
  readonly count: number;
  readonly moduleId?: string;

  constructor(props: CommandProps<GenerateTestFromBankCommand>) {
    super(props);
    this.testId = props.testId;
    this.courseId = props.courseId;
    this.count = props.count;
    this.moduleId = props.moduleId;
  }
}
