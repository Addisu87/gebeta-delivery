import { IsInt, IsString, IsUUID } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  comment: string;

  @IsUUID()
  restaurantId: string;

  @IsInt()
  userId: number;
}
