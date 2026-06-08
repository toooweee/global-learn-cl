import { Command, CommandProps } from '@/libs/application/command.base';

export class DeleteFileCommand extends Command {
  readonly fileId: string;

  constructor(props: CommandProps<DeleteFileCommand>) {
    super(props);
    this.fileId = props.fileId;
  }
}
