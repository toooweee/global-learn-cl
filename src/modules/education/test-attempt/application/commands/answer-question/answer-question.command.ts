import { Command, CommandProps } from '@/libs/application/command.base';

export class AnswerQuestionCommand extends Command {
  readonly attemptId: string;
  readonly questionId: string;
  readonly answerId: string;
  readonly option: string;

  constructor(props: CommandProps<AnswerQuestionCommand>) {
    super(props);
    this.attemptId = props.attemptId;
    this.questionId = props.questionId;
    this.answerId = props.answerId;
    this.option = props.option;
  }
}
