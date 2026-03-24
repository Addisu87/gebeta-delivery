import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { NOTIFICATIONS_QUEUE } from 'src/shared/constants';
import { NotificationsGateway } from './notifications.gateway';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('NotificationsController', () => {
  let controller: NotificationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(Notification), useValue: {} },
        {
          provide: getQueueToken(NOTIFICATIONS_QUEUE),
          useValue: { add: vi.fn() },
        },
        {
          provide: NotificationsGateway,
          useValue: { emitNotificationCreated: vi.fn() },
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
