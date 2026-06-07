import { Command, CommandProps } from '@/libs/application';

export class LoginCommand extends Command {
  readonly email: string;
  readonly password: string;
  readonly userAgent: string;

  constructor(props: CommandProps<LoginCommand>) {
    super(props);
    this.email = props.email;
    this.password = props.password;
    this.userAgent = props.userAgent;
  }
}
