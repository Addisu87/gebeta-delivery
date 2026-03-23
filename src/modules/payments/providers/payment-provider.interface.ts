import { Payment } from '../entities/payment.entity';

export type PaymentProviderInitInput = {
  successUrl?: string;
  cancelUrl?: string;
  callbackUrl?: string;
  customerEmail?: string;
};

export type PaymentProviderInitResult = {
  providerReference: string;
  checkoutUrl?: string;
  rawResponse?: Record<string, unknown>;
};

export interface PaymentGatewayProvider {
  initializePayment(
    payment: Payment,
    input: PaymentProviderInitInput,
  ): Promise<PaymentProviderInitResult>;
}
