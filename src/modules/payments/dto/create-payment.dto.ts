import { IsEnum, IsNumber, IsUUID, Min } from 'class-validator';
import { PaymentMethod } from 'src/shared/enums/payment-method.enum';
import { PaymentStatus } from 'src/shared/enums/payment-status.enum';

export class CreatePaymentDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsUUID()
  orderId: string;
}
