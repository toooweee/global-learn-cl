import { Command, CommandProps } from '@/libs/application';

export class ChangePasswordCommand extends Command {
  readonly userId: string;
  readonly oldPassword: string;
  readonly newPassword: string;

  constructor(props: CommandProps<ChangePasswordCommand>) {
    super(props);
    this.userId = props.userId;
    this.oldPassword = props.oldPassword;
    this.newPassword = props.newPassword;
  }
}
