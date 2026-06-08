import { Command, CommandProps } from '@/libs/application/command.base';

export class AddQuestionToTestCommand extends Command {
  readonly testId: string;
  readonly questionId: string;

  constructor(props: CommandProps<AddQuestionToTestCommand>) {
    super(props);
    this.testId = props.testId;
    this.questionId = props.questionId;
  }
}
