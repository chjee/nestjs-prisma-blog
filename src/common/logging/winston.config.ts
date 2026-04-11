import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import { WinstonModuleOptions } from 'nest-winston';
import * as path from 'node:path';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { getRequestId } from './request-context';
import { maskSensitiveData } from './mask.util';

type DailyRotateFileTransportOptions = Record<string, unknown>;
type DailyRotateFileTransportConstructor = new (
  options: DailyRotateFileTransportOptions,
) => winston.transport;

const DailyRotateFileTransport = winston.transports
  .DailyRotateFile as unknown as DailyRotateFileTransportConstructor;

const addRequestContext = winston.format((info) => {
  const requestId = getRequestId();
  if (requestId) {
    info.requestId = requestId;
  }
  return info;
});

const maskSensitiveFormat = winston.format((info) => {
  return Object.assign(info, maskSensitiveData(info));
});

function createConsoleFormat(nodeEnv: string): winston.Logform.Format {
  if (nodeEnv === 'production') {
    return winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      addRequestContext(),
      maskSensitiveFormat(),
      winston.format.json(),
    );
  }

  return winston.format.combine(
    winston.format.timestamp(),
    winston.format.ms(),
    winston.format.errors({ stack: true }),
    addRequestContext(),
    maskSensitiveFormat(),
    nestWinstonModuleUtilities.format.nestLike('nestjs-prisma-blog', {
      colors: true,
      prettyPrint: true,
    }),
  );
}

export function createWinstonOptions(params: {
  nodeEnv?: string;
  logLevel?: string;
  logDir?: string;
  retentionDays?: string;
}): WinstonModuleOptions {
  const nodeEnv = params.nodeEnv ?? 'development';
  const level =
    params.logLevel ?? (nodeEnv === 'production' ? 'warn' : 'debug');
  const logDir = params.logDir ?? path.join(process.cwd(), 'logs');
  const retentionDays = params.retentionDays ?? '30d';

  return {
    level,
    transports: [
      new winston.transports.Console({
        level,
        format: createConsoleFormat(nodeEnv),
      }),
      new DailyRotateFileTransport({
        dirname: logDir,
        filename: 'application-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxFiles: retentionDays,
        level,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          addRequestContext(),
          maskSensitiveFormat(),
          winston.format.json(),
        ),
      }),
      new DailyRotateFileTransport({
        dirname: logDir,
        filename: 'error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxFiles: retentionDays,
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          addRequestContext(),
          maskSensitiveFormat(),
          winston.format.json(),
        ),
      }),
    ],
  };
}
