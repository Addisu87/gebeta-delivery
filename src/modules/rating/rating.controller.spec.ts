import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RatingController } from './rating.controller';
import { RatingService } from './rating.service';
import { Rating } from './entities/rating.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { Review } from '../review/entities/review.entity';
import { beforeEach, describe, expect, it } from 'vitest';

describe('RatingController', () => {
  let controller: RatingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RatingController],
      providers: [
        RatingService,
        { provide: getRepositoryToken(Rating), useValue: {} },
        { provide: getRepositoryToken(Restaurant), useValue: {} },
        { provide: getRepositoryToken(Review), useValue: {} },
      ],
    }).compile();

    controller = module.get<RatingController>(RatingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
