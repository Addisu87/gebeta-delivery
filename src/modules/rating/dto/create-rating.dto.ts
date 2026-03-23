import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class CreateRatingDto {
  @IsInt()
  @Min(1)
  @Max(5)
  value: number;

  @IsUUID()
  restaurantId: string;

  @IsInt()
  userId: number;

  @IsOptional()
  @IsUUID()
  reviewId?: string;
}
