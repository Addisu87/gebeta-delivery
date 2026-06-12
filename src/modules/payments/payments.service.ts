import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Queue } from 'bullmq';
import { Repository, FindOptionsRelations } from 'typeorm';
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
      relations: ['order'] as unknown as FindOptionsRelations<Payment>,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['order'] as unknown as FindOptionsRelations<Payment>,
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
    const event = this.stripeProvider.constructWebhookEvent(rawBody, signature);

    if (event.type === 'checkout.session.completed') {
      await this.updateByProviderReference(
        PaymentProvider.STRIPE,
        event.data.object.id,
        {
          status: PaymentStatus.COMPLETED,
          providerResponse: event as unknown as Record<string, unknown>,
          failureReason: undefined,
        },
      );
    }

    if (
      event.type === 'checkout.session.async_payment_failed' ||
      event.type === 'checkout.session.expired'
    ) {
      await this.updateByProviderReference(
        PaymentProvider.STRIPE,
        event.data.object.id,
        {
          status: PaymentStatus.FAILED,
          providerResponse: event as unknown as Record<string, unknown>,
          failureReason: event.type,
        },
      );
    }

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
    throw new BadRequestException(`Unsupported payment provider: ${provider}`);
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
