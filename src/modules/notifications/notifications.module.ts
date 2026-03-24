import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from './entities/notification.entity';
import { EMAIL_QUEUE, NOTIFICATIONS_QUEUE } from 'src/shared/constants';
import { NotificationProcessor } from '../queue/processors/notification.processor';
import { EmailProcessor } from '../queue/processors/email.processor';
import { SendgridEmailService } from '../queue/email/sendgrid-email.service';
import { SmtpEmailService } from '../queue/email/smtp-email.service';
import { NotificationsGateway } from './notifications.gateway';
import type { StringValue } from 'ms';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>(
          'JWT_ACCESS_SECRET',
          'access-secret-for-local-dev',
        ),
        signOptions: {
          expiresIn: config.get<string>(
            'JWT_ACCESS_EXPIRATION',
            '15m',
          ) as StringValue,
        },
      }),
    }),
    BullModule.registerQueue(
      { name: NOTIFICATIONS_QUEUE },
      { name: EMAIL_QUEUE },
    ),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsGateway,
    NotificationProcessor,
    EmailProcessor,
    SendgridEmailService,
    SmtpEmailService,
  ],
})
export class NotificationsModule {}
