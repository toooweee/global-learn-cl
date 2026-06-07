import { Command, CommandProps } from '@/libs/application';

export class PromoteEmployeeCommand extends Command {
  readonly employeeId: string;
  readonly positionId: string;

  constructor(props: CommandProps<PromoteEmployeeCommand>) {
    super(props);
    this.employeeId = props.employeeId;
    this.positionId = props.positionId;
  }
}
