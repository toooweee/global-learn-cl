import { Command, CommandProps } from '@/libs/application';

export class UpdatePositionCommand extends Command {
  readonly positionId: string;
  readonly name: string;
  readonly parentId?: string | null;

  constructor(props: CommandProps<UpdatePositionCommand>) {
    super(props);
    this.positionId = props.positionId;
    this.name = props.name;
    this.parentId = props.parentId;
  }
}
