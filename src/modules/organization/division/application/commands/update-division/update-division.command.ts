import { Command, CommandProps } from '@/libs/application';

export class UpdateDivisionCommand extends Command {
  readonly divisionId: string;
  readonly name: string;
  readonly departmentId: string;

  constructor(props: CommandProps<UpdateDivisionCommand>) {
    super(props);
    this.divisionId = props.divisionId;
    this.name = props.name;
    this.departmentId = props.departmentId;
  }
}
