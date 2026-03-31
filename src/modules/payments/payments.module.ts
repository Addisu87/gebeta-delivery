import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { PAYMENTS_QUEUE } from 'src/shared/constants';
import { PaymentsQueueProcessor } from './payments.queue.processor';
import { StripeProvider } from './providers/stripe.provider';
import { ChapaProvider } from './providers/chapa.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Order]),
    BullModule.registerQueue({ name: PAYMENTS_QUEUE }),
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentsQueueProcessor,
    StripeProvider,
    ChapaProvider,
  ],
})
export class PaymentsModule {}
