import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MapsController } from './maps.controller';
import { MapsService } from './maps.service';
import { Map } from './entities/map.entity';
import { beforeEach, describe, expect, it } from 'vitest';

describe('MapsController', () => {
  let controller: MapsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MapsController],
      providers: [
        MapsService,
        { provide: getRepositoryToken(Map), useValue: {} },
      ],
    }).compile();

    controller = module.get<MapsController>(MapsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
