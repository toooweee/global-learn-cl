import { Command, CommandProps } from '@/libs/application/command.base';

export class UpdateTestDefinitionCommand extends Command {
  readonly testId: string;
  readonly name?: string;
  readonly passingPercent?: number;

  constructor(props: CommandProps<UpdateTestDefinitionCommand>) {
    super(props);
    this.testId = props.testId;
    this.name = props.name;
    this.passingPercent = props.passingPercent;
  }
}
