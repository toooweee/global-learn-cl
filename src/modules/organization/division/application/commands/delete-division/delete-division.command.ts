import { Command, CommandProps } from '@/libs/application';

export class DeleteDivisionCommand extends Command {
  readonly divisionId: string;

  constructor(props: CommandProps<DeleteDivisionCommand>) {
    super(props);
    this.divisionId = props.divisionId;
  }
}
