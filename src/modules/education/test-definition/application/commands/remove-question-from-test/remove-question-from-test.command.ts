import { Command, CommandProps } from '@/libs/application/command.base';

export class RemoveQuestionFromTestCommand extends Command {
  readonly testId: string;
  readonly questionId: string;

  constructor(props: CommandProps<RemoveQuestionFromTestCommand>) {
    super(props);
    this.testId = props.testId;
    this.questionId = props.questionId;
  }
}
