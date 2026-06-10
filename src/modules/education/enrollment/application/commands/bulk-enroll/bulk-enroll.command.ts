import { Command, CommandProps } from '@/libs/application/command.base';

export class BulkEnrollCommand extends Command {
  readonly courseId: string;
  readonly employeeIds: string[];
  readonly assignedById?: string;

  constructor(props: CommandProps<BulkEnrollCommand>) {
    super(props);
    this.courseId = props.courseId;
    this.employeeIds = props.employeeIds;
    this.assignedById = props.assignedById;
  }
}
