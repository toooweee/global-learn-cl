import { ICommand } from '@nestjs/cqrs';
import { randomUUID } from 'node:crypto';
import { RequestContextService } from '@/libs/application/context/app-request-context';

export type CommandProps<T> = Omit<T, 'id' | 'metadata'> & Partial<Command>;

type CommandMetadata = {
  readonly correlationId: string;
  readonly userId?: string;
  readonly timestamp: number;
};

export class Command implements ICommand {
  readonly id: string;
  readonly metadata: CommandMetadata;

  constructor(props: CommandProps<unknown>) {
    this.id = props.id || randomUUID();
    this.metadata = {
      correlationId:
        props?.metadata?.correlationId || RequestContextService.getRequestId(),
      userId: props?.metadata?.userId ?? RequestContextService.getUserId(),
      timestamp: props?.metadata?.timestamp || Date.now(),
    };
  }
}
