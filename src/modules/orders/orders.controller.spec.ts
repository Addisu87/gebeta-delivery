import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { User } from '../users/entities/user.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { Delivery } from '../deliveries/entities/delivery.entity';
import { Promotion } from '../promotions/entities/promotion.entity';
import { ORDERS_QUEUE } from 'src/shared/constants';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('OrdersController', () => {
  let controller: OrdersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: {} },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: getRepositoryToken(Restaurant), useValue: {} },
        { provide: getRepositoryToken(Delivery), useValue: {} },
        { provide: getRepositoryToken(Promotion), useValue: {} },
        { provide: getQueueToken(ORDERS_QUEUE), useValue: { add: vi.fn() } },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
