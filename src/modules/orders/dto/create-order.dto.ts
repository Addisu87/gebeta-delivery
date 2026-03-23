import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
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

  @IsUUID()
  restaurantId: string;

  @IsOptional()
  @IsUUID()
  deliveryId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  promotionIds?: string[];
}
