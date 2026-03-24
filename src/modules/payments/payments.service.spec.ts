import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { PAYMENTS_QUEUE } from 'src/shared/constants';
import { StripeProvider } from './providers/stripe.provider';
import { ChapaProvider } from './providers/chapa.provider';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: getRepositoryToken(Payment), useValue: {} },
        { provide: getRepositoryToken(Order), useValue: {} },
        { provide: getQueueToken(PAYMENTS_QUEUE), useValue: { add: vi.fn() } },
        { provide: StripeProvider, useValue: {} },
        { provide: ChapaProvider, useValue: {} },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
