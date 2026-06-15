import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Payment } from '../entities/payment.entity';
import {
  PaymentGatewayProvider,
  PaymentProviderInitInput,
  PaymentProviderInitResult,
} from './payment-provider.interface';

@Injectable()
export class StripeProvider implements PaymentGatewayProvider {
  private readonly stripe: InstanceType<typeof Stripe>;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2026-05-27.dahlia',
    });
  }

  async initializePayment(
    payment: Payment,
    input: PaymentProviderInitInput,
  ): Promise<PaymentProviderInitResult> {
    const successUrl =
      input.successUrl ?? 'https://example.com/payment/success';
    const cancelUrl = input.cancelUrl ?? 'https://example.com/payment/cancel';

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: input.customerEmail,
      line_items: [
        {
          price_data: {
            currency: payment.currency.toLowerCase(),
            product_data: {
              name: `Order ${payment.orderId}`,
            },
            unit_amount: Math.round(payment.amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        paymentId: payment.id,
        orderId: payment.orderId,
      },
    });

    return {
      providerReference: session.id,
      checkoutUrl: session.url ?? undefined,
      rawResponse: session as unknown as Record<string, unknown>,
    };
  }

  constructWebhookEvent(
    rawBody: Buffer | string,
    signature: string,
  ): ReturnType<InstanceType<typeof Stripe>['webhooks']['constructEvent']> {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    if (!webhookSecret) {
      throw new BadRequestException('STRIPE_WEBHOOK_SECRET is not configured');
    }

    try {
      return this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      throw new BadRequestException(`Webhook Error: ${message}`);
    }
  }
}
