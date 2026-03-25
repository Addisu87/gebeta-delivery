import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { EMAIL_QUEUE, NOTIFICATIONS_QUEUE } from 'src/shared/constants';
import { EmailFanoutProcessor } from '../queue/processors/email-fanout.processor';
import { EmailDeliveryProcessor } from '../queue/processors/email-delivery.processor';
import { MailtrapEmailService } from '../queue/email/mailtrap-email.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_ACCESS_EXPIRATION') as StringValue,
        },
      }),
    }),
    BullModule.registerQueue(
      { name: NOTIFICATIONS_QUEUE },
      { name: EMAIL_QUEUE },
    ),
  ],
  providers: [
    EmailFanoutProcessor,
    EmailDeliveryProcessor,
    MailtrapEmailService,
  ],
})
export class EmailModule {}

