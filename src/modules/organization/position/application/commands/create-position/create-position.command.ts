import { Command, CommandProps } from '@/libs/application';

export class CreatePositionCommand extends Command {
  readonly name: string;
  readonly parentId?: string | null;

  constructor(props: CommandProps<CreatePositionCommand>) {
    super(props);
    this.name = props.name;
    this.parentId = props.parentId;
  }
}
