import { IsNumber, IsString, Min } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  customerName: string;

  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsString()
  status: string;
}
