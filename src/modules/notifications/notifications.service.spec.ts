import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { NOTIFICATIONS_QUEUE, EMAIL_QUEUE } from 'src/shared/constants';
import { NotificationsGateway } from './notifications.gateway';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(Notification), useValue: {} },
        {
          provide: getQueueToken(NOTIFICATIONS_QUEUE),
          useValue: { add: vi.fn() },
        },
        { provide: getQueueToken(EMAIL_QUEUE), useValue: { add: vi.fn() } },
        {
          provide: NotificationsGateway,
          useValue: { emitNotificationCreated: vi.fn() },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
