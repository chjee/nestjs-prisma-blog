import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { PostModule } from './post/post.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: '.env.dev, .env',
    }),
    AuthModule,
    UserModule,
    PostModule,
    PrismaModule,
  ],
  providers: [
    { provide: 'APP_GUARD', useExisting: JwtAuthGuard },
    JwtAuthGuard,
  ],
})
export class AppModule {}
