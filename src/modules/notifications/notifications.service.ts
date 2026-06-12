import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import {
  JOB_NOTIFICATION_CREATED,
  NOTIFICATIONS_QUEUE,
} from 'src/shared/constants';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationType } from 'src/shared/enums/notification-type.enum';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectQueue(NOTIFICATIONS_QUEUE)
    private readonly notificationsQueue: Queue,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async create(createNotificationDto: CreateNotificationDto) {
    const notification = this.notificationRepository.create({
      ...createNotificationDto,
      type: createNotificationDto.type ?? NotificationType.SYSTEM,
      isRead: createNotificationDto.isRead ?? false,
    });
    const savedNotification =
      await this.notificationRepository.save(notification);
    await this.notificationsQueue.add(
      JOB_NOTIFICATION_CREATED,
      {
        notificationId: savedNotification.id,
        title: savedNotification.title,
        message: savedNotification.message,
        recipientEmail: savedNotification.recipientEmail,
      },
      { jobId: `notification-created:${savedNotification.id}` },
    );
    this.notificationsGateway.emitNotificationCreated(savedNotification);
    return savedNotification;
  }

  findAll() {
    return this.notificationRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });
    if (!notification) {
      throw new NotFoundException(`Notification with id ${id} not found`);
    }
    return notification;
  }

  async update(id: string, updateNotificationDto: UpdateNotificationDto) {
    const notification = await this.findOne(id);
    Object.assign(notification, updateNotificationDto);
    return this.notificationRepository.save(notification);
  }

  async remove(id: string) {
    const notification = await this.findOne(id);
    await this.notificationRepository.remove(notification);
    return { message: 'Notification removed successfully' };
  }
}
