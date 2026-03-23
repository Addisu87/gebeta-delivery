import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { Repository } from 'typeorm';
import { Rating } from './entities/rating.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { Review } from '../review/entities/review.entity';

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

  async create(createRatingDto: CreateRatingDto) {
    await this.ensureReferencesExist(
      createRatingDto.restaurantId,
      createRatingDto.reviewId,
    );

    const rating = this.ratingRepository.create(createRatingDto);
    const savedRating = await this.ratingRepository.save(rating);
    await this.updateRestaurantAverage(createRatingDto.restaurantId);
    return savedRating;
  }

  findAll() {
    return this.ratingRepository.find({
      relations: ['restaurant', 'user', 'review'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const rating = await this.ratingRepository.findOne({
      where: { id },
      relations: ['restaurant', 'user', 'review'],
    });
    if (!rating) {
      throw new NotFoundException(`Rating with id ${id} not found`);
    }
    return rating;
  }

  async update(id: string, updateRatingDto: UpdateRatingDto) {
    const rating = await this.findOne(id);
    const previousRestaurantId = rating.restaurantId;

    await this.ensureReferencesExist(
      updateRatingDto.restaurantId,
      updateRatingDto.reviewId,
    );

    Object.assign(rating, updateRatingDto);
    const updatedRating = await this.ratingRepository.save(rating);

    if (previousRestaurantId !== updatedRating.restaurantId) {
      await this.updateRestaurantAverage(previousRestaurantId);
    }
    await this.updateRestaurantAverage(updatedRating.restaurantId);
    return updatedRating;
  }

  async remove(id: string) {
    const rating = await this.findOne(id);
    await this.ratingRepository.remove(rating);
    await this.updateRestaurantAverage(rating.restaurantId);
    return { message: 'Rating removed successfully' };
  }

  private async ensureReferencesExist(restaurantId?: string, reviewId?: string) {
    if (restaurantId) {
      const restaurant = await this.restaurantRepository.findOne({
        where: { id: restaurantId },
      });
      if (!restaurant) {
        throw new NotFoundException(`Restaurant with id ${restaurantId} not found`);
      }
    }

    if (reviewId) {
      const review = await this.reviewRepository.findOne({ where: { id: reviewId } });
      if (!review) {
        throw new NotFoundException(`Review with id ${reviewId} not found`);
      }
    }
  }

  private async updateRestaurantAverage(restaurantId: string) {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId },
      relations: ['ratings'],
    });

    if (!restaurant) {
      return;
    }

    const ratings = restaurant.ratings ?? [];
    const average =
      ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating.value, 0) / ratings.length
        : 0;

    restaurant.averageRating = Number(average.toFixed(2));
    await this.restaurantRepository.save(restaurant);
  }
}
