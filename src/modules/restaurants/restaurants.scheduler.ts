import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { In, Repository, FindOptionsSelect } from 'typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { Rating } from '../rating/entities/rating.entity';
import { calculateAverage } from 'src/common/utils/price.util';

@Injectable()
export class RestaurantsScheduler {
  private readonly logger = new Logger(RestaurantsScheduler.name);

  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
  ) {}

  // Daily reconciliation to keep persisted average ratings consistent.
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async reconcileRestaurantAverages() {
    const restaurants = await this.restaurantRepository.find({
      select: [
        'id',
        'averageRating',
      ] as unknown as FindOptionsSelect<Restaurant>,
    });

    if (restaurants.length === 0) {
      return;
    }

    const ratings = await this.ratingRepository.find({
      where: {
        restaurantId: In(restaurants.map((restaurant) => restaurant.id)),
      },
      select: ['restaurantId', 'value'] as unknown as FindOptionsSelect<Rating>,
    });

    const valuesByRestaurant = new Map<string, number[]>();
    for (const rating of ratings) {
      const bucket = valuesByRestaurant.get(rating.restaurantId) ?? [];
      bucket.push(rating.value);
      valuesByRestaurant.set(rating.restaurantId, bucket);
    }

    let updatedCount = 0;
    for (const restaurant of restaurants) {
      const values = valuesByRestaurant.get(restaurant.id) ?? [];
      const expectedAverage = calculateAverage(values);
      if (restaurant.averageRating !== expectedAverage) {
        restaurant.averageRating = expectedAverage;
        await this.restaurantRepository.save(restaurant);
        updatedCount += 1;
      }
    }

    this.logger.log(
      `Restaurant average reconciliation finished. Updated: ${updatedCount}`,
    );
  }
}
