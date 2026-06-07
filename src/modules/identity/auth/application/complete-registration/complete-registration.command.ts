import { Command, CommandProps } from '@/libs/application';

export class CompleteRegistrationCommand extends Command {
  readonly email: string;
  readonly newPassword: string;

  constructor(props: CommandProps<CompleteRegistrationCommand>) {
    super(props);
    this.email = props.email;
    this.newPassword = props.newPassword;
  }
}
