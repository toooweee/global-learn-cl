import { Command, CommandProps } from '@/libs/application';

export class CreateDepartmentCommand extends Command {
  readonly name: string;

  constructor(props: CommandProps<CreateDepartmentCommand>) {
    super(props);
    this.name = props.name;
  }
}
