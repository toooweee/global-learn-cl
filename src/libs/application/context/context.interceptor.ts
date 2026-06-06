import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { type Request, type Response } from 'express';
import { RequestContextService } from '@/libs/application/context/app-request-context';
import { nanoid } from 'nanoid';
import { tap } from 'rxjs';

@Injectable()
export class ContextInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler) {
    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest<Request>();
      const response = context.switchToHttp().getResponse<Response>();

      const headerId = request.headers['x-request-id'];
      const headerRequestId = Array.isArray(headerId) ? headerId[0] : headerId;
      const bodyRequestId =
        request.body &&
        typeof request.body === 'object' &&
        'requestId' in request.body
          ? (request.body as { requestId: unknown }).requestId
          : undefined;
      const requestId =
        (typeof bodyRequestId === 'string' ? bodyRequestId : undefined) ??
        headerRequestId ??
        nanoid(6);

      RequestContextService.setRequestId(requestId);

      const { method, url } = request;
      const startTime = Date.now();

      this.logger.log(`🚀 [${method}] ${url} - Request Received`);

      return next.handle().pipe(
        tap(() => {
          const duration = Date.now() - startTime;
          this.logger.log(
            `🔥 [${method}] ${url} | Status: ${response.statusCode} | +${duration}ms`,
          );
        }),
      );
    }

    return next.handle();
  }
}
