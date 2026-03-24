import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { PAYMENTS_QUEUE } from 'src/shared/constants';
import { StripeProvider } from './providers/stripe.provider';
import { ChapaProvider } from './providers/chapa.provider';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('PaymentsController', () => {
  let controller: PaymentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        PaymentsService,
        { provide: getRepositoryToken(Payment), useValue: {} },
        { provide: getRepositoryToken(Order), useValue: {} },
        { provide: getQueueToken(PAYMENTS_QUEUE), useValue: { add: vi.fn() } },
        { provide: StripeProvider, useValue: {} },
        { provide: ChapaProvider, useValue: {} },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
