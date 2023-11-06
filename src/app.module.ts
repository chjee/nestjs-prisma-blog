import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { PostModule } from './post/post.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: '.env.dev, .env',
    }),
    UserModule,
    PostModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [{ provide: 'APP_GUARD', useClass: JwtAuthGuard }],
})
export class AppModule {}
