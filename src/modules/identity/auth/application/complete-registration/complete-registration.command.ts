import { Command, CommandProps } from '@/libs/application';

export class CompleteRegistrationCommand extends Command {
  readonly token: string;
  readonly email: string;
  readonly newPassword: string;

  constructor(props: CommandProps<CompleteRegistrationCommand>) {
    super(props);
    this.token = props.token;
    this.email = props.email;
    this.newPassword = props.newPassword;
  }
}
