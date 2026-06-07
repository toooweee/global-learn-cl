import { Command, CommandProps } from '@/libs/application';

export class DeleteRoleCommand extends Command {
  readonly roleId: string;

  constructor(props: CommandProps<DeleteRoleCommand>) {
    super(props);
    this.roleId = props.roleId;
  }
}
