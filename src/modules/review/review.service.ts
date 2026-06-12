import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { calculateAverage } from 'src/common/utils/price.util';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
  ) {}

  async create(createReviewDto: CreateReviewDto) {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: createReviewDto.restaurantId },
    });
    if (!restaurant) {
      throw new NotFoundException(
        `Restaurant with id ${createReviewDto.restaurantId} not found`,
      );
    }

    const review = this.reviewRepository.create(createReviewDto);
    const savedReview = await this.reviewRepository.save(review);
    await this.updateRestaurantAverage(createReviewDto.restaurantId);
    return savedReview;
  }

  findAll() {
    return this.reviewRepository.find({
      relations: { restaurant: true, user: true, ratings: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: { restaurant: true, user: true, ratings: true },
    });
    if (!review) {
      throw new NotFoundException(`Review with id ${id} not found`);
    }
    return review;
  }

  async update(id: string, updateReviewDto: UpdateReviewDto) {
    const review = await this.findOne(id);
    const previousRestaurantId = review.restaurantId;

    if (
      updateReviewDto.restaurantId &&
      updateReviewDto.restaurantId !== review.restaurantId
    ) {
      const restaurant = await this.restaurantRepository.findOne({
        where: { id: updateReviewDto.restaurantId },
      });
      if (!restaurant) {
        throw new NotFoundException(
          `Restaurant with id ${updateReviewDto.restaurantId} not found`,
        );
      }
    }

    Object.assign(review, updateReviewDto);
    const updatedReview = await this.reviewRepository.save(review);

    if (previousRestaurantId !== updatedReview.restaurantId) {
      await this.updateRestaurantAverage(previousRestaurantId);
    }
    await this.updateRestaurantAverage(updatedReview.restaurantId);

    return updatedReview;
  }

  async remove(id: string) {
    const review = await this.findOne(id);
    await this.reviewRepository.remove(review);
    await this.updateRestaurantAverage(review.restaurantId);
    return { message: 'Review removed successfully' };
  }

  private async updateRestaurantAverage(restaurantId: string) {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId },
      relations: { ratings: true },
    });

    if (!restaurant) {
      return;
    }

    const ratings = restaurant.ratings ?? [];
    restaurant.averageRating = calculateAverage(
      ratings.map((rating) => rating.value),
    );
    await this.restaurantRepository.save(restaurant);
  }
}
