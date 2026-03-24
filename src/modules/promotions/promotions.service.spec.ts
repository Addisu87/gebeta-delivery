import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PromotionsService } from './promotions.service';
import { Promotion } from './entities/promotion.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { beforeEach, describe, expect, it } from 'vitest';

describe('PromotionsService', () => {
  let service: PromotionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromotionsService,
        { provide: getRepositoryToken(Promotion), useValue: {} },
        { provide: getRepositoryToken(Restaurant), useValue: {} },
      ],
    }).compile();

    service = module.get<PromotionsService>(PromotionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
