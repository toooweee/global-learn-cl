import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
  HttpException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { DomainException } from '@/libs/ddd/domain.exception';
import { RequestContextService } from '@/libs/application/context';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';

type HttpExceptionResponse = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const correlationId = RequestContextService.getRequestId();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Internal server error';

    if (exception instanceof DomainException) {
      statusCode = exception.statusCode;
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof ApplicationException) {
      statusCode = exception.statusCode;
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();

      const response = exception.getResponse();

      if (typeof response === 'string') {
        message = response;
      } else {
        const errorResponse = response as HttpExceptionResponse;

        if (Array.isArray(errorResponse.message)) {
          message = errorResponse.message.join(', ');
        } else {
          message = errorResponse.message ?? exception.message;
        }
      }

      code = exception.name;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(
      `Exception caught: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    return response.status(statusCode).json({
      statusCode,
      code,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId,
    });
  }
}
