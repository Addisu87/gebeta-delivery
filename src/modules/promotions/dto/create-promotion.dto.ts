import { IsBoolean, IsNumber, IsString, Max, Min } from 'class-validator';

export class CreatePromotionDto {
  @IsString()
  code: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent: number;

  @IsBoolean()
  isActive: boolean;
}
