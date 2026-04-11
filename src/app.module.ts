import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import Joi from 'joi';
import { WinstonModule } from 'nest-winston';
import { AuthModule } from './auth/auth.module';
import { CategoryModule } from './category/category.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { createWinstonOptions } from './common/logging/winston.config';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { HealthModule } from './health/health.module';
import { PostModule } from './post/post.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env.dev', '.env'],
      validationSchema: Joi.object({
        PORT: Joi.number().port().default(3000),
        DATABASE_URL: Joi.string()
          .uri({
            scheme: ['mysql', 'mysql2'],
          })
          .required(),
        JWT_SECRET: Joi.string().min(1).required(),
        ALLOWED_ORIGINS: Joi.string().min(1).required(),
        NODE_ENV: Joi.string()
          .valid('development', 'test', 'production')
          .default('development'),
        LOG_LEVEL: Joi.string()
          .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')
          .optional(),
        LOG_RETENTION_DAYS: Joi.string()
          .pattern(/^\d+d$/)
          .default('30d'),
      }),
    }),
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createWinstonOptions({
          nodeEnv: configService.get<string>('NODE_ENV'),
          logLevel: configService.get<string>('LOG_LEVEL'),
          retentionDays: configService.get<string>('LOG_RETENTION_DAYS'),
        }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    HealthModule,
    AuthModule,
    CategoryModule,
    UserModule,
    PostModule,
    PrismaModule,
  ],
  providers: [
    { provide: 'APP_GUARD', useExisting: JwtAuthGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    JwtAuthGuard,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
