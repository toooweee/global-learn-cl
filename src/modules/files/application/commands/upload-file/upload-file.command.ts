import { Command, CommandProps } from '@/libs/application/command.base';

export class UploadFileCommand extends Command {
  readonly buffer: Buffer;
  readonly filename: string;
  readonly mimeType: string;

  constructor(props: CommandProps<UploadFileCommand>) {
    super(props);
    this.buffer = props.buffer;
    this.filename = props.filename;
    this.mimeType = props.mimeType;
  }
}
