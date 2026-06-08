import { Command, CommandProps } from '@/libs/application/command.base';

export class DeleteCourseQuestionCommand extends Command {
  readonly questionId: string;

  constructor(props: CommandProps<DeleteCourseQuestionCommand>) {
    super(props);
    this.questionId = props.questionId;
  }
}
