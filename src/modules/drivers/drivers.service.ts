import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { Repository, FindOptionsRelations } from 'typeorm';
import { Driver } from './entities/driver.entity';
import { PhotoService } from '../photo/photo.service';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    private readonly photoService: PhotoService,
  ) {}

  create(createDriverDto: CreateDriverDto) {
    const driver = this.driverRepository.create({
      ...createDriverDto,
      isAvailable: createDriverDto.isAvailable ?? true,
    });
    return this.driverRepository.save(driver);
  }

  findAll() {
    return this.driverRepository.find({
      relations: ['deliveries'] as unknown as FindOptionsRelations<Driver>,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const driver = await this.driverRepository.findOne({
      where: { id },
      relations: ['deliveries'] as unknown as FindOptionsRelations<Driver>,
    });
    if (!driver) {
      throw new NotFoundException(`Driver with id ${id} not found`);
    }
    return driver;
  }

  async update(id: string, updateDriverDto: UpdateDriverDto) {
    const driver = await this.findOne(id);
    Object.assign(driver, updateDriverDto);
    return this.driverRepository.save(driver);
  }

  async uploadPhoto(id: string, photoPath: string) {
    const driver = await this.findOne(id);
    driver.photo = this.photoService.setPhoto(photoPath);
    return this.driverRepository.save(driver);
  }

  async remove(id: string) {
    const driver = await this.findOne(id);
    await this.driverRepository.remove(driver);
    return { message: 'Driver removed successfully' };
  }
}
