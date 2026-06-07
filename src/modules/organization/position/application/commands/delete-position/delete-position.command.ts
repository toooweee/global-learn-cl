import { Command, CommandProps } from '@/libs/application';

export class DeletePositionCommand extends Command {
  readonly positionId: string;

  constructor(props: CommandProps<DeletePositionCommand>) {
    super(props);
    this.positionId = props.positionId;
  }
}
