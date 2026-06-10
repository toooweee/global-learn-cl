import { Command, CommandProps } from '@/libs/application';

export class ResetPasswordCommand extends Command {
  readonly token: string;
  readonly email: string;
  readonly newPassword: string;

  constructor(props: CommandProps<ResetPasswordCommand>) {
    super(props);
    this.token = props.token;
    this.email = props.email;
    this.newPassword = props.newPassword;
  }
}
