import { Command, CommandProps } from '@/libs/application/command.base';

export class DeleteTestDefinitionCommand extends Command {
  readonly testId: string;

  constructor(props: CommandProps<DeleteTestDefinitionCommand>) {
    super(props);
    this.testId = props.testId;
  }
}
