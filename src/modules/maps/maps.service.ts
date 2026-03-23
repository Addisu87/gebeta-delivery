import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateMapDto } from './dto/create-map.dto';
import { UpdateMapDto } from './dto/update-map.dto';
import { Repository } from 'typeorm';
import { Map } from './entities/map.entity';

@Injectable()
export class MapsService {
  constructor(
    @InjectRepository(Map)
    private readonly mapRepository: Repository<Map>,
  ) {}

  create(createMapDto: CreateMapDto) {
    const map = this.mapRepository.create(createMapDto);
    return this.mapRepository.save(map);
  }

  findAll() {
    return this.mapRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const map = await this.mapRepository.findOne({ where: { id } });
    if (!map) throw new NotFoundException(`Map with id ${id} not found`);
    return map;
  }

  async update(id: string, updateMapDto: UpdateMapDto) {
    const map = await this.findOne(id);
    Object.assign(map, updateMapDto);
    return this.mapRepository.save(map);
  }

  async remove(id: string) {
    const map = await this.findOne(id);
    await this.mapRepository.remove(map);
    return { message: 'Map removed successfully' };
  }
}
