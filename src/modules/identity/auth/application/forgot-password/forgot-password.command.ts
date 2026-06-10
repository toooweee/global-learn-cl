import { Command, CommandProps } from '@/libs/application';

export class ForgotPasswordCommand extends Command {
  readonly email: string;

  constructor(props: CommandProps<ForgotPasswordCommand>) {
    super(props);
    this.email = props.email;
  }
}
