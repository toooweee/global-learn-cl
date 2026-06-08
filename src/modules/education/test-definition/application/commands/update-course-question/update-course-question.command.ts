import { Command, CommandProps } from '@/libs/application/command.base';

export class UpdateCourseQuestionCommand extends Command {
  readonly questionId: string;
  readonly question?: string;
  readonly answers?: { answer: string; isCorrect: boolean }[];

  constructor(props: CommandProps<UpdateCourseQuestionCommand>) {
    super(props);
    this.questionId = props.questionId;
    this.question = props.question;
    this.answers = props.answers;
  }
}
