import { Command, CommandProps } from '@/libs/application';

export class UpdateEmployeeCommand extends Command {
  readonly employeeId: string;
  readonly fullname?: string;
  readonly biography?: string | null;
  readonly divisionId?: string;
  readonly positionId?: string | null;
  readonly avatarId?: string | null;

  constructor(props: CommandProps<UpdateEmployeeCommand>) {
    super(props);
    this.employeeId = props.employeeId;
    this.fullname = props.fullname;
    this.biography = props.biography;
    this.divisionId = props.divisionId;
    this.positionId = props.positionId;
    this.avatarId = props.avatarId;
  }
}
