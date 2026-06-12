import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreatePromotionDto {
  @IsString()
  code: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent: number;

  @IsBoolean()
  isActive: boolean;

  @IsOptional()
  @IsUUID()
  restaurantId?: string;
}
