import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatingService } from './rating.service';
import { RatingController } from './rating.controller';
import { Rating } from './entities/rating.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { Review } from '../review/entities/review.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Rating, Restaurant, Review])],
  controllers: [RatingController],
  providers: [RatingService],
})
export class RatingModule {}
