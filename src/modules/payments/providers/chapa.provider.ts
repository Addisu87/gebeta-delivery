import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';
import { Payment } from '../entities/payment.entity';
import {
  PaymentGatewayProvider,
  PaymentProviderInitInput,
  PaymentProviderInitResult,
} from './payment-provider.interface';

@Injectable()
export class ChapaProvider implements PaymentGatewayProvider {
  private readonly baseUrl = 'https://api.chapa.co/v1';

  async initializePayment(
    payment: Payment,
    input: PaymentProviderInitInput,
  ): Promise<PaymentProviderInitResult> {
    const secretKey = process.env.CHAPA_SECRET_KEY;
    if (!secretKey) {
      throw new BadRequestException('CHAPA_SECRET_KEY is not configured');
    }
    if (!input.customerEmail) {
      throw new BadRequestException(
        'customerEmail is required for Chapa payment initialization',
      );
    }

    const payload = {
      amount: `${payment.amount}`,
      currency: payment.currency,
      email: input.customerEmail,
      tx_ref: `order-${payment.orderId}-payment-${payment.id}`,
      callback_url:
        input.callbackUrl ?? 'https://example.com/payments/webhooks/chapa',
      return_url: input.successUrl ?? 'https://example.com/payment/success',
      customization: {
        title: 'Gebeta Delivery Payment',
        description: `Payment for order ${payment.orderId}`,
      },
      meta: {
        paymentId: payment.id,
        orderId: payment.orderId,
      },
    };

    const response = await axios.post(
      `${this.baseUrl}/transaction/initialize`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const checkoutUrl = response.data?.data?.checkout_url as string | undefined;
    const txRef = response.data?.data?.tx_ref as string | undefined;

    if (!txRef) {
      throw new BadRequestException('Chapa initialization failed');
    }

    return {
      providerReference: txRef,
      checkoutUrl,
      rawResponse: response.data,
    };
  }
}
