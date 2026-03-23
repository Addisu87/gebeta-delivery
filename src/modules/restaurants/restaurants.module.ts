import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantsService } from './restaurants.service';
import { RestaurantsController } from './restaurants.controller';
import { Restaurant } from './entities/restaurant.entity';
import { PhotoModule } from '../photo/photo.module';
import { Rating } from '../rating/entities/rating.entity';
import { RestaurantsScheduler } from './restaurants.scheduler';

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, Rating]), PhotoModule],
  controllers: [RestaurantsController],
  providers: [RestaurantsService, RestaurantsScheduler],
})
export class RestaurantsModule {}
