import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { Repository, FindOptionsRelations } from 'typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { PhotoService } from '../photo/photo.service';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    private readonly photoService: PhotoService,
  ) {}

  create(dto: CreateRestaurantDto) {
    const restaurant = this.restaurantRepository.create({
      ...dto,
      isOpen: dto.isOpen ?? true,
      averageRating: 0,
      photos: [],
    });
    return this.restaurantRepository.save(restaurant);
  }

  findAll() {
    return this.restaurantRepository.find({
      relations: [
        'reviews',
        'ratings',
      ] as unknown as FindOptionsRelations<Restaurant>,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id },
      relations: [
        'reviews',
        'ratings',
      ] as unknown as FindOptionsRelations<Restaurant>,
    });
    if (!restaurant) {
      throw new NotFoundException(`Restaurant with id ${id} not found`);
    }
    return restaurant;
  }

  async update(id: string, updateRestaurantDto: UpdateRestaurantDto) {
    const restaurant = await this.findOne(id);
    Object.assign(restaurant, updateRestaurantDto);
    return this.restaurantRepository.save(restaurant);
  }

  async addPhoto(id: string, photoPath: string) {
    const restaurant = await this.findOne(id);
    restaurant.photos = this.photoService.appendPhoto(
      restaurant.photos,
      photoPath,
    );
    return this.restaurantRepository.save(restaurant);
  }

  async remove(id: string) {
    const restaurant = await this.findOne(id);
    await this.restaurantRepository.remove(restaurant);
    return { message: 'Restaurant removed successfully' };
  }
}
