import { Command, CommandProps } from '@/libs/application';

export class CreateUserCommand extends Command {
  constructor(
    props: CommandProps<CreateUserCommand>,
    readonly email: string,
    readonly password: string,
  ) {
    super(props);
  }
}
