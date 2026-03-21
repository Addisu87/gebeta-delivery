import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { ApiConfigService, AppService } from './app.service';
import { DatabaseModule } from './config/database.module';
import { configuration } from './config/configuration';
import { APP_PIPE } from '@nestjs/core';
import { UsersModule } from './modules/users/users.module';
import { LoggerModule } from './common/logger/logger.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: configuration }),
    LoggerModule,
    DatabaseModule,
    HealthModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    ApiConfigService,
    AppService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule {}
