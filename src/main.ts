import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'verbose', 'debug'],
    cors: { origin: '*', methods: 'GET,HEAD,PUT,PATCH,POST,DELETE' },
  });

  app.useGlobalInterceptors(new TransformInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Prisma NestJS API')
    .setDescription('The Prisma SNS API description')
    .setVersion('1.0')
    .addTag('SNS')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        name: 'JWT', // Key name in the swagger
        description: 'Enter JWT token',
        bearerFormat: 'JWT', // Optional
        in: 'header',
      },
      'access_token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      defaultModelsExpandDepth: -1,
    },
  });

  app.enableShutdownHooks();

  const configService = app.get(ConfigService);
  const listenPort = configService.get('PORT', 3000);
  await app.listen(listenPort);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
