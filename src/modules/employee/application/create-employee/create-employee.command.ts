import { Command, CommandProps } from '@/libs/application';

export class CreateEmployeeCommand extends Command {
  readonly email: string;
  readonly password: string;
  readonly roleId: string;
  readonly fullname: string;
  readonly divisionId: string;
  readonly employmentDate: Date;
  readonly positionId?: string | null;

  constructor(props: CommandProps<CreateEmployeeCommand>) {
    super(props);
    this.email = props.email;
    this.password = props.password;
    this.roleId = props.roleId;
    this.fullname = props.fullname;
    this.divisionId = props.divisionId;
    this.employmentDate = props.employmentDate;
    this.positionId = props.positionId;
  }
}
