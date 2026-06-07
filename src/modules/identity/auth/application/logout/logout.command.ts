import { Command, CommandProps } from '@/libs/application';

export class LogoutCommand extends Command {
  readonly userId: string;
  readonly userAgent: string;

  constructor(props: CommandProps<LogoutCommand>) {
    super(props);
    this.userId = props.userId;
    this.userAgent = props.userAgent;
  }
}
