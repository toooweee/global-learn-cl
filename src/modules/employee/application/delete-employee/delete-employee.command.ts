import { Command, CommandProps } from '@/libs/application';

export class DeleteEmployeeCommand extends Command {
  readonly employeeId: string;

  constructor(props: CommandProps<DeleteEmployeeCommand>) {
    super(props);
    this.employeeId = props.employeeId;
  }
}
