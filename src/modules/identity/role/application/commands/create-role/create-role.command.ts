import { Command, CommandProps } from '@/libs/application';

export class CreateRoleCommand extends Command {
  readonly name: string;

  constructor(props: CommandProps<CreateRoleCommand>) {
    super(props);
    this.name = props.name;
  }
}
