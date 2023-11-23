import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { PostModule } from './post/post.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: '.env.dev, .env',
    }),
    HealthModule,
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
