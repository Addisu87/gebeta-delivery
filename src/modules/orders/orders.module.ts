import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { User } from '../users/entities/user.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { Delivery } from '../deliveries/entities/delivery.entity';
import { Promotion } from '../promotions/entities/promotion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, User, Restaurant, Delivery, Promotion])],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
