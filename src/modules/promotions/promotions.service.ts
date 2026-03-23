import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { Repository } from 'typeorm';
import { Promotion } from './entities/promotion.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectRepository(Promotion)
    private readonly promotionRepository: Repository<Promotion>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
  ) {}

  async create(createPromotionDto: CreatePromotionDto) {
    if (createPromotionDto.restaurantId) {
      await this.ensureRestaurantExists(createPromotionDto.restaurantId);
    }
    const promotion = this.promotionRepository.create(createPromotionDto);
    return this.promotionRepository.save(promotion);
  }

  findAll() {
    return this.promotionRepository.find({
      relations: ['restaurant', 'orders'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const promotion = await this.promotionRepository.findOne({
      where: { id },
      relations: ['restaurant', 'orders'],
    });
    if (!promotion) {
      throw new NotFoundException(`Promotion with id ${id} not found`);
    }
    return promotion;
  }

  async update(id: string, updatePromotionDto: UpdatePromotionDto) {
    const promotion = await this.findOne(id);
    if (updatePromotionDto.restaurantId) {
      await this.ensureRestaurantExists(updatePromotionDto.restaurantId);
    }
    Object.assign(promotion, updatePromotionDto);
    return this.promotionRepository.save(promotion);
  }

  async remove(id: string) {
    const promotion = await this.findOne(id);
    await this.promotionRepository.remove(promotion);
    return { message: 'Promotion removed successfully' };
  }

  private async ensureRestaurantExists(restaurantId: string) {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId },
    });
    if (!restaurant) {
      throw new NotFoundException(`Restaurant with id ${restaurantId} not found`);
    }
  }
}
