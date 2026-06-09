import { Command, CommandProps } from '@/libs/application';

export class BulkAddQuestionsToTestCommand extends Command {
  readonly testId: string;
  readonly questionIds: string[];

  constructor(props: CommandProps<BulkAddQuestionsToTestCommand>) {
    super(props);
    this.testId = props.testId;
    this.questionIds = props.questionIds;
  }
}
