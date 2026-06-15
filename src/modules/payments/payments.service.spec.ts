import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { PAYMENTS_QUEUE } from 'src/shared/constants';
import { StripeProvider } from './providers/stripe.provider';
import { ChapaProvider } from './providers/chapa.provider';
import { PaymentProvider } from 'src/shared/enums/payment-provider.enum';
import { PaymentStatus } from 'src/shared/enums/payment-status.enum';
import { beforeEach, afterEach, describe, expect, it, vi, Mock } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { Repository } from 'typeorm';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let paymentRepository: Partial<Record<keyof Repository<Payment>, Mock>>;
  let chapaProvider: Partial<Record<keyof ChapaProvider, Mock>>;

  beforeEach(async () => {
    paymentRepository = {
      findOne: vi.fn(),
      save: vi.fn(),
    };

    chapaProvider = {
      verifyPayment: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: getRepositoryToken(Payment), useValue: paymentRepository },
        { provide: getRepositoryToken(Order), useValue: {} },
        { provide: getQueueToken(PAYMENTS_QUEUE), useValue: { add: vi.fn() } },
        { provide: StripeProvider, useValue: {} },
        { provide: ChapaProvider, useValue: chapaProvider },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleChapaWebhook', () => {
    let originalSecret: string | undefined;
    const testSecret = 'test-secret';

    beforeEach(() => {
      originalSecret = process.env.CHAPA_WEBHOOK_SECRET;
      process.env.CHAPA_WEBHOOK_SECRET = testSecret;
    });

    afterEach(() => {
      process.env.CHAPA_WEBHOOK_SECRET = originalSecret;
    });

    it('should throw BadRequestException if signature is invalid', async () => {
      const rawBody = JSON.stringify({ tx_ref: 'test-ref' });
      await expect(
        service.handleChapaWebhook(rawBody, 'invalid-signature'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if tx_ref is missing', async () => {
      const rawBody = JSON.stringify({});
      const signature = crypto
        .createHmac('sha256', testSecret)
        .update(rawBody)
        .digest('hex');

      await expect(
        service.handleChapaWebhook(rawBody, signature),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if verification fails', async () => {
      const rawBody = JSON.stringify({ tx_ref: 'test-ref' });
      const signature = crypto
        .createHmac('sha256', testSecret)
        .update(rawBody)
        .digest('hex');

      chapaProvider.verifyPayment.mockResolvedValue(false);

      await expect(
        service.handleChapaWebhook(rawBody, signature),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update payment status to COMPLETED if verification succeeds', async () => {
      const rawBody = JSON.stringify({ tx_ref: 'test-ref' });
      const signature = crypto
        .createHmac('sha256', testSecret)
        .update(rawBody)
        .digest('hex');

      const mockPayment = {
        id: 'payment-id',
        provider: PaymentProvider.CHAPA,
        providerReference: 'test-ref',
        status: PaymentStatus.PENDING,
      };

      chapaProvider.verifyPayment.mockResolvedValue(true);
      paymentRepository.findOne.mockResolvedValue(mockPayment);
      paymentRepository.save.mockImplementation((x) => Promise.resolve(x));

      const result = await service.handleChapaWebhook(rawBody, signature);

      expect(result).toEqual({ received: true });
      expect(paymentRepository.findOne).toHaveBeenCalledWith({
        where: {
          provider: PaymentProvider.CHAPA,
          providerReference: 'test-ref',
        },
      });
      expect(mockPayment.status).toBe(PaymentStatus.COMPLETED);
    });
  });
});
