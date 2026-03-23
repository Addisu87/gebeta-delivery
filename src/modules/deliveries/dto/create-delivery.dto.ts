import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { DeliveryStatus } from 'src/shared/enums/delivery-status.enum';

export class CreateDeliveryDto {
  @IsString()
  pickupAddress: string;

  @IsString()
  dropoffAddress: string;

  @IsOptional()
  @IsEnum(DeliveryStatus)
  status?: DeliveryStatus;

  @IsOptional()
  @IsUUID()
  driverId?: string;
}
