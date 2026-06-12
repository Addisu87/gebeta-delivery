import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { Repository } from 'typeorm';
import { Menu } from './entities/menu.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
  ) {}

  async create(createMenuDto: CreateMenuDto) {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: createMenuDto.restaurantId },
    });
    if (!restaurant) {
      throw new NotFoundException(
        `Restaurant with id ${createMenuDto.restaurantId} not found`,
      );
    }

    const menu = this.menuRepository.create({
      ...createMenuDto,
      isAvailable: createMenuDto.isAvailable ?? true,
    });
    return this.menuRepository.save(menu);
  }

  findAll() {
    return this.menuRepository.find({
      relations: { restaurant: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const menu = await this.menuRepository.findOne({
      where: { id },
      relations: { restaurant: true },
    });
    if (!menu) {
      throw new NotFoundException(`Menu with id ${id} not found`);
    }
    return menu;
  }

  async update(id: string, updateMenuDto: UpdateMenuDto) {
    const menu = await this.findOne(id);

    if (updateMenuDto.restaurantId) {
      const restaurant = await this.restaurantRepository.findOne({
        where: { id: updateMenuDto.restaurantId },
      });
      if (!restaurant) {
        throw new NotFoundException(
          `Restaurant with id ${updateMenuDto.restaurantId} not found`,
        );
      }
    }

    Object.assign(menu, updateMenuDto);
    return this.menuRepository.save(menu);
  }

  async remove(id: string) {
    const menu = await this.findOne(id);
    await this.menuRepository.remove(menu);
    return { message: 'Menu removed successfully' };
  }
}
