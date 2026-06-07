import { Command, CommandProps } from '@/libs/application';

export class RefreshTokenCommand extends Command {
  readonly refreshTokenCookie: string;
  readonly userAgent: string;

  constructor(props: CommandProps<RefreshTokenCommand>) {
    super(props);
    this.refreshTokenCookie = props.refreshTokenCookie;
    this.userAgent = props.userAgent;
  }
}
