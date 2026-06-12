import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { Repository } from 'typeorm';
import { Delivery } from './entities/delivery.entity';
import { Driver } from '../drivers/entities/driver.entity';
import { DeliveryStatus } from 'src/shared/enums/delivery-status.enum';

@Injectable()
export class DeliveriesService {
  constructor(
    @InjectRepository(Delivery)
    private readonly deliveryRepository: Repository<Delivery>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
  ) {}

  async create(createDeliveryDto: CreateDeliveryDto) {
    this.ensureDriverStatusConsistency(
      createDeliveryDto.status ?? DeliveryStatus.PENDING,
      createDeliveryDto.driverId,
    );
    await this.validateDriver(createDeliveryDto.driverId);
    const delivery = this.deliveryRepository.create({
      ...createDeliveryDto,
      status: createDeliveryDto.status ?? DeliveryStatus.PENDING,
    });
    return this.deliveryRepository.save(delivery);
  }

  findAll() {
    return this.deliveryRepository.find({
      relations: { driver: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const delivery = await this.deliveryRepository.findOne({
      where: { id },
      relations: { driver: true },
    });
    if (!delivery) {
      throw new NotFoundException(`Delivery with id ${id} not found`);
    }
    return delivery;
  }

  async update(id: string, updateDeliveryDto: UpdateDeliveryDto) {
    const delivery = await this.findOne(id);
    const nextStatus = updateDeliveryDto.status ?? delivery.status;
    const nextDriverId =
      updateDeliveryDto.driverId !== undefined
        ? updateDeliveryDto.driverId
        : delivery.driverId;

    this.validateStatusTransition(delivery.status, nextStatus);
    this.ensureDriverStatusConsistency(nextStatus, nextDriverId);
    await this.validateDriver(nextDriverId);
    Object.assign(delivery, updateDeliveryDto);
    return this.deliveryRepository.save(delivery);
  }

  async remove(id: string) {
    const delivery = await this.findOne(id);
    await this.deliveryRepository.remove(delivery);
    return { message: 'Delivery removed successfully' };
  }

  private async validateDriver(driverId?: string) {
    if (!driverId) {
      return;
    }

    const driver = await this.driverRepository.findOne({
      where: { id: driverId },
    });
    if (!driver) {
      throw new NotFoundException(`Driver with id ${driverId} not found`);
    }
  }

  private validateStatusTransition(
    current: DeliveryStatus,
    next: DeliveryStatus,
  ) {
    if (current === next) {
      return;
    }

    const allowedTransitions: Record<DeliveryStatus, DeliveryStatus[]> = {
      [DeliveryStatus.PENDING]: [
        DeliveryStatus.ASSIGNED,
        DeliveryStatus.CANCELLED,
      ],
      [DeliveryStatus.ASSIGNED]: [
        DeliveryStatus.PICKED_UP,
        DeliveryStatus.CANCELLED,
      ],
      [DeliveryStatus.PICKED_UP]: [
        DeliveryStatus.DELIVERED,
        DeliveryStatus.CANCELLED,
      ],
      [DeliveryStatus.DELIVERED]: [],
      [DeliveryStatus.CANCELLED]: [],
    };

    if (!allowedTransitions[current].includes(next)) {
      throw new BadRequestException(
        `Invalid delivery status transition: ${current} -> ${next}`,
      );
    }
  }

  private ensureDriverStatusConsistency(
    status: DeliveryStatus,
    driverId?: string,
  ) {
    const requiresDriver =
      status === DeliveryStatus.ASSIGNED ||
      status === DeliveryStatus.PICKED_UP ||
      status === DeliveryStatus.DELIVERED;

    if (requiresDriver && !driverId) {
      throw new BadRequestException(
        `Status ${status} requires a driver to be assigned`,
      );
    }
  }
}
