import { Command, CommandProps } from '@/libs/application';

export class UpdateDepartmentCommand extends Command {
  readonly departmentId: string;
  readonly name: string;

  constructor(props: CommandProps<UpdateDepartmentCommand>) {
    super(props);
    this.departmentId = props.departmentId;
    this.name = props.name;
  }
}
