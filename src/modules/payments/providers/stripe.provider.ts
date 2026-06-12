import { BadRequestException, Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import axios from 'axios';
import { Payment } from '../entities/payment.entity';
import {
  PaymentGatewayProvider,
  PaymentProviderInitInput,
  PaymentProviderInitResult,
} from './payment-provider.interface';

type StripeEvent = {
  id: string;
  type: string;
  data: {
    object: {
      id: string;
      payment_status?: string;
      metadata?: Record<string, string>;
    };
  };
};

@Injectable()
export class StripeProvider implements PaymentGatewayProvider {
  private readonly baseUrl = 'https://api.stripe.com/v1';

  async initializePayment(
    payment: Payment,
    input: PaymentProviderInitInput,
  ): Promise<PaymentProviderInitResult> {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new BadRequestException('STRIPE_SECRET_KEY is not configured');
    }

    const successUrl =
      input.successUrl ?? 'https://example.com/payment/success';
    const cancelUrl = input.cancelUrl ?? 'https://example.com/payment/cancel';

    const form = new URLSearchParams();
    form.append('mode', 'payment');
    form.append('success_url', successUrl);
    form.append('cancel_url', cancelUrl);
    form.append('line_items[0][quantity]', '1');
    form.append(
      'line_items[0][price_data][currency]',
      payment.currency.toLowerCase(),
    );
    form.append(
      'line_items[0][price_data][unit_amount]',
      `${Math.round(payment.amount * 100)}`,
    );
    form.append(
      'line_items[0][price_data][product_data][name]',
      `Order ${payment.orderId}`,
    );
    form.append('metadata[paymentId]', payment.id);
    form.append('metadata[orderId]', payment.orderId);

    const response = await axios.post(
      `${this.baseUrl}/checkout/sessions`,
      form,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    return {
      providerReference: response.data.id,
      checkoutUrl: response.data.url,
      rawResponse: response.data,
    };
  }

  constructWebhookEvent(
    rawBody: Buffer | string,
    signature: string,
  ): StripeEvent {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new BadRequestException('STRIPE_WEBHOOK_SECRET is not configured');
    }

    const payload = Buffer.isBuffer(rawBody)
      ? rawBody.toString('utf8')
      : rawBody;
    const elements = signature.split(',').map((entry) => entry.split('='));
    const timestamp = elements.find(([k]) => k === 't')?.[1];
    const signatures = elements.filter(([k]) => k === 'v1').map(([, v]) => v);

    if (!timestamp || signatures.length === 0) {
      throw new BadRequestException('Invalid Stripe signature header');
    }

    const signedPayload = `${timestamp}.${payload}`;
    const expected = createHmac('sha256', webhookSecret)
      .update(signedPayload, 'utf8')
      .digest('hex');

    const isValid = signatures.some((sig) => {
      try {
        return timingSafeEqual(
          Buffer.from(sig, 'hex'),
          Buffer.from(expected, 'hex'),
        );
      } catch {
        return false;
      }
    });

    if (!isValid) {
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    return JSON.parse(payload) as StripeEvent;
  }
}
