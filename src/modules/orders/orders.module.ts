import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { User } from '../users/entities/user.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { Delivery } from '../deliveries/entities/delivery.entity';
import { Promotion } from '../promotions/entities/promotion.entity';
import { ORDERS_QUEUE } from '../queue/queue.constants';
import { OrdersQueueProcessor } from './orders.queue.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, User, Restaurant, Delivery, Promotion]),
    BullModule.registerQueue({ name: ORDERS_QUEUE }),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersQueueProcessor],
})
export class OrdersModule {}
