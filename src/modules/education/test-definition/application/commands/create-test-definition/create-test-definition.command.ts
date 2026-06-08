import { Command, CommandProps } from '@/libs/application/command.base';

export class CreateTestDefinitionCommand extends Command {
  readonly name: string;
  readonly passingPercent?: number;

  constructor(props: CommandProps<CreateTestDefinitionCommand>) {
    super(props);
    this.name = props.name;
    this.passingPercent = props.passingPercent;
  }
}
