import { Command, CommandProps } from '@/libs/application/command.base';

export class CreateCourseQuestionCommand extends Command {
  readonly courseId: string;
  readonly moduleId?: string;
  readonly question: string;
  readonly answers: { answer: string; isCorrect: boolean }[];

  constructor(props: CommandProps<CreateCourseQuestionCommand>) {
    super(props);
    this.courseId = props.courseId;
    this.moduleId = props.moduleId;
    this.question = props.question;
    this.answers = props.answers;
  }
}
