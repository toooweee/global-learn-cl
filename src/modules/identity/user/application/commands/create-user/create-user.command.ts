import { Command, CommandProps } from '@/libs/application';

export class CreateUserCommand extends Command {
  readonly email: string;
  readonly password: string;

  constructor(props: CommandProps<CreateUserCommand>) {
    super(props);
    this.email = props.email;
    this.password = props.password;
  }
}
