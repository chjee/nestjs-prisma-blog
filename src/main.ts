import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'debug', 'verbose'],
    cors: { origin: '*', methods: 'GET,HEAD,PUT,PATCH,POST,DELETE' },
  });

  app.enableShutdownHooks();

  const configService = app.get(ConfigService);
  const listenPort = configService.get('PORT', 3000);
  await app.listen(listenPort);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
