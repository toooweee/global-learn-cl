import { Command, CommandProps } from '@/libs/application';

export class CreateDivisionCommand extends Command {
  readonly name: string;
  readonly departmentId: string;

  constructor(props: CommandProps<CreateDivisionCommand>) {
    super(props);
    this.name = props.name;
    this.departmentId = props.departmentId;
  }
}
