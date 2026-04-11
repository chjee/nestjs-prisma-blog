import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { requestContext } from '../logging/request-context';
import { maskSensitiveData } from '../logging/mask.util';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const requestId =
      req.header('x-request-id')?.trim() || randomUUID().replace(/-/g, '');

    res.setHeader('x-request-id', requestId);

    requestContext.run({ requestId }, () => {
      this.logger.http('Incoming request', {
        requestId,
        method: req.method,
        path: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        params: req.params,
        query: req.query,
        body: maskSensitiveData(req.body),
      });
      next();
    });
  }
}
