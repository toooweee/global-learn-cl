import { Command, CommandProps } from '@/libs/application/command.base';

export class CreateEnrollmentCommand extends Command {
  readonly courseId: string;
  readonly employeeId: string;
  readonly assignedById?: string;

  constructor(props: CommandProps<CreateEnrollmentCommand>) {
    super(props);
    this.courseId = props.courseId;
    this.employeeId = props.employeeId;
    this.assignedById = props.assignedById;
  }
}
