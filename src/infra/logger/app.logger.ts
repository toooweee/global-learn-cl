import { ConsoleLogger } from '@nestjs/common';
import { RequestContextService } from '@/libs/application/context';

export class AppLogger extends ConsoleLogger {
  private withCid(message: unknown) {
    const cid = RequestContextService.getRequestId();
    if (cid === 'unknown-request' || typeof message !== 'string') {
      return message;
    }
    return `[${cid}] ${message}`;
  }

  log(message: unknown, ...rest: unknown[]) {
    super.log(this.withCid(message), ...(rest as never[]));
  }

  error(message: unknown, ...rest: unknown[]) {
    super.error(this.withCid(message), ...(rest as never[]));
  }

  warn(message: unknown, ...rest: unknown[]) {
    super.warn(this.withCid(message), ...(rest as never[]));
  }

  debug(message: unknown, ...rest: unknown[]) {
    super.debug(this.withCid(message), ...(rest as never[]));
  }

  verbose(message: unknown, ...rest: unknown[]) {
    super.verbose(this.withCid(message), ...(rest as never[]));
  }
}
