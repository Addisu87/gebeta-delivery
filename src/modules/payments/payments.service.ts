import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { JOB_PAYMENT_CREATED, PAYMENTS_QUEUE } from 'src/shared/constants';
import { PaymentProvider } from 'src/shared/enums/payment-provider.enum';
import { StripeProvider } from './providers/stripe.provider';
import { ChapaProvider } from './providers/chapa.provider';
import { PaymentStatus } from 'src/shared/enums/payment-status.enum';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectQueue(PAYMENTS_QUEUE)
    private readonly paymentsQueue: Queue,
    private readonly stripeProvider: StripeProvider,
    private readonly chapaProvider: ChapaProvider,
  ) {}

  async create(createPaymentDto: CreatePaymentDto) {
    await this.ensureOrderExists(createPaymentDto.orderId);
    const payment = this.paymentRepository.create({
      ...createPaymentDto,
      currency: createPaymentDto.currency ?? 'ETB',
      status: createPaymentDto.status ?? PaymentStatus.PENDING,
    });
    const savedPayment = await this.paymentRepository.save(payment);

    const provider = this.resolveProvider(savedPayment.provider);
    const providerResult = await provider.initializePayment(savedPayment, {
      successUrl: createPaymentDto.successUrl,
      cancelUrl: createPaymentDto.cancelUrl,
      callbackUrl: createPaymentDto.callbackUrl,
      customerEmail: createPaymentDto.customerEmail,
    });

    Object.assign(savedPayment, {
      providerReference: providerResult.providerReference,
      checkoutUrl: providerResult.checkoutUrl,
      providerResponse: providerResult.rawResponse,
    });
    const finalizedPayment = await this.paymentRepository.save(savedPayment);

    await this.paymentsQueue.add(
      JOB_PAYMENT_CREATED,
      {
        paymentId: finalizedPayment.id,
        orderId: finalizedPayment.orderId,
        amount: finalizedPayment.amount,
        status: finalizedPayment.status,
        method: finalizedPayment.method,
        provider: finalizedPayment.provider,
        providerReference: finalizedPayment.providerReference,
      },
      { jobId: `payment-created:${finalizedPayment.id}` },
    );
    return finalizedPayment;
  }

  findAll() {
    return this.paymentRepository.find({
      relations: { order: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: { order: true },
    });
    if (!payment)
      throw new NotFoundException(`Payment with id ${id} not found`);
    return payment;
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto) {
    const payment = await this.findOne(id);
    if (updatePaymentDto.orderId) {
      await this.ensureOrderExists(updatePaymentDto.orderId);
    }
    Object.assign(payment, updatePaymentDto);
    return this.paymentRepository.save(payment);
  }

  async remove(id: string) {
    const payment = await this.findOne(id);
    await this.paymentRepository.remove(payment);
    return { message: 'Payment removed successfully' };
  }

  async handleStripeWebhook(rawBody: Buffer | string, signature: string) {
    type StripeWebhookEvent = {
      type: string;
      data: { object: Record<string, unknown> };
    };

    let event: StripeWebhookEvent;
    try {
      event = this.stripeProvider.constructWebhookEvent(
        rawBody,
        signature,
      ) as unknown as StripeWebhookEvent;
    } catch (_err: unknown) {
      throw new BadRequestException('Invalid Stripe webhook event');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      await this.updateByProviderReference(
        PaymentProvider.STRIPE,
        session.id as string,
        {
          status: PaymentStatus.COMPLETED,
          providerResponse: event as Record<string, unknown>,
          failureReason: undefined,
        },
      );
    }

    if (
      event.type === 'checkout.session.async_payment_failed' ||
      event.type === 'checkout.session.expired'
    ) {
      const session = event.data.object;
      await this.updateByProviderReference(
        PaymentProvider.STRIPE,
        session.id as string,
        {
          status: PaymentStatus.FAILED,
          providerResponse: event as Record<string, unknown>,
          failureReason: event.type,
        },
      );
    }

    return { received: true };
  }

  async handleChapaWebhook(rawBody: Buffer | string, signature: string) {
    const webhookSecret =
      process.env.CHAPA_WEBHOOK_SECRET || process.env.CHAPA_SECRET_KEY;
    if (!webhookSecret) {
      throw new BadRequestException('CHAPA_WEBHOOK_SECRET is not configured');
    }

    const computedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (computedSignature !== signature) {
      throw new BadRequestException('Invalid Chapa webhook signature');
    }

    const parsedBody = JSON.parse(rawBody.toString()) as unknown;
    if (typeof parsedBody !== 'object' || parsedBody === null) {
      throw new BadRequestException('Invalid Chapa webhook payload');
    }

    const payload = parsedBody as { tx_ref?: unknown; [key: string]: unknown };
    const txRef =
      typeof payload.tx_ref === 'string' ? payload.tx_ref : undefined;
    if (!txRef) {
      throw new BadRequestException('Missing tx_ref in Chapa webhook payload');
    }

    const isVerified = await this.chapaProvider.verifyPayment(txRef);
    if (!isVerified) {
      throw new BadRequestException('Chapa payment verification failed');
    }

    await this.updateByProviderReference(PaymentProvider.CHAPA, txRef, {
      status: PaymentStatus.COMPLETED,
      providerResponse: payload,
      failureReason: undefined,
    });

    return { received: true };
  }

  private async ensureOrderExists(orderId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });
    if (!order)
      throw new NotFoundException(`Order with id ${orderId} not found`);
  }

  private resolveProvider(provider: PaymentProvider) {
    if (provider === PaymentProvider.STRIPE) return this.stripeProvider;
    if (provider === PaymentProvider.CHAPA) return this.chapaProvider;
    throw new BadRequestException(
      `Unsupported payment provider: ${String(provider)}`,
    );
  }

  private async updateByProviderReference(
    provider: PaymentProvider,
    providerReference: string,
    patch: Partial<Payment>,
  ) {
    const payment = await this.paymentRepository.findOne({
      where: { provider, providerReference },
    });
    if (!payment) {
      throw new NotFoundException(
        `Payment not found for provider=${provider} reference=${providerReference}`,
      );
    }
    Object.assign(payment, patch);
    return this.paymentRepository.save(payment);
  }
}
