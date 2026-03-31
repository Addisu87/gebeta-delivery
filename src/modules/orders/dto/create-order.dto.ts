import { IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { OrderStatus } from 'src/shared/enums/order-status.enum';

export class CreateOrderDto {
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsInt()
  userId: number;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsUUID()
  restaurantId: string;

  @IsOptional()
  @IsUUID()
  deliveryId?: string;
}
