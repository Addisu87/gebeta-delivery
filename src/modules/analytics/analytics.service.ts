import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateAnalyticsDto } from './dto/create-analytics.dto';
import { UpdateAnalyticsDto } from './dto/update-analytics.dto';
import { Repository } from 'typeorm';
import { Analytics } from './entities/analytics.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Analytics)
    private readonly analyticsRepository: Repository<Analytics>,
  ) {}

  create(createAnalyticsDto: CreateAnalyticsDto) {
    const analytics = this.analyticsRepository.create(createAnalyticsDto);
    return this.analyticsRepository.save(analytics);
  }

  findAll() {
    return this.analyticsRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const analytics = await this.analyticsRepository.findOne({ where: { id } });
    if (!analytics) {
      throw new NotFoundException(`Analytics with id ${id} not found`);
    }
    return analytics;
  }

  async update(id: string, updateAnalyticsDto: UpdateAnalyticsDto) {
    const analytics = await this.findOne(id);
    Object.assign(analytics, updateAnalyticsDto);
    return this.analyticsRepository.save(analytics);
  }

  async remove(id: string) {
    const analytics = await this.findOne(id);
    await this.analyticsRepository.remove(analytics);
    return { message: 'Analytics removed successfully' };
  }
}
