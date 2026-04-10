import { ArgumentsHost, Catch, HttpException, Inject } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Request } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    super();
  }

  catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType() === 'http') {
      const request = host.switchToHttp().getRequest<Request>();
      const statusCode =
        exception instanceof HttpException ? exception.getStatus() : 500;

      this.logger.error('Unhandled exception', {
        method: request.method,
        path: request.originalUrl,
        statusCode,
        requestId: request.header('x-request-id'),
        error:
          exception instanceof Error
            ? {
                name: exception.name,
                message: exception.message,
                stack: exception.stack,
              }
            : exception,
      });
    }

    super.catch(exception, host);
  }
}
