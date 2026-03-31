import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { User } from '../users/entities/user.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { Delivery } from '../deliveries/entities/delivery.entity';
import { Promotion } from '../promotions/entities/promotion.entity';
import { OrderStatus } from 'src/shared/enums/order-status.enum';
import { calculateDiscountedAmount } from 'src/common/utils/price.util';
import { JOB_ORDER_CREATED, ORDERS_QUEUE } from 'src/shared/constants';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Delivery)
    private readonly deliveryRepository: Repository<Delivery>,
    @InjectRepository(Promotion)
    private readonly promotionRepository: Repository<Promotion>,
    @InjectQueue(ORDERS_QUEUE)
    private readonly ordersQueue: Queue,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    await this.ensureReferencesExist(
      createOrderDto.userId,
      createOrderDto.restaurantId,
      createOrderDto.deliveryId,
    );

    const totalAmount = calculateDiscountedAmount(
      createOrderDto.totalAmount,
      [],
    );

    const order = this.orderRepository.create({
      totalAmount,
      status: createOrderDto.status ?? OrderStatus.PENDING,
      userId: createOrderDto.userId,
      phoneNumber: createOrderDto.phoneNumber,
      restaurantId: createOrderDto.restaurantId,
      deliveryId: createOrderDto.deliveryId,
      promotions: [],
    });

    const savedOrder = await this.orderRepository.save(order);
    await this.ordersQueue.add(
      JOB_ORDER_CREATED,
      {
        orderId: savedOrder.id,
        userId: savedOrder.userId,
        restaurantId: savedOrder.restaurantId,
        totalAmount: savedOrder.totalAmount,
      },
      { jobId: `order-created:${savedOrder.id}` },
    );
    return savedOrder;
  }

  findAll() {
    return this.orderRepository.find({
      relations: ['user', 'restaurant', 'delivery', 'payment', 'promotions'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['user', 'restaurant', 'delivery', 'payment', 'promotions'],
    });
    if (!order) throw new NotFoundException(`Order with id ${id} not found`);
    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    const order = await this.findOne(id);

    await this.ensureReferencesExist(
      updateOrderDto.userId,
      updateOrderDto.restaurantId,
      updateOrderDto.deliveryId,
      updateOrderDto.promotionIds,
    );

    if (updateOrderDto.promotionIds) {
      order.promotions = await this.promotionRepository.find({
        where: updateOrderDto.promotionIds.map((promotionId) => ({
          id: promotionId,
        })),
      });
    }

    const incomingAmount = updateOrderDto.totalAmount ?? order.totalAmount;
    const promotionPercents = (order.promotions ?? [])
      .filter((promotion) => promotion.isActive)
      .map((promotion) => promotion.discountPercent);
    const recalculatedAmount = calculateDiscountedAmount(
      incomingAmount,
      promotionPercents,
    );

    Object.assign(order, {
      totalAmount: recalculatedAmount,
      status: updateOrderDto.status ?? order.status,
      userId: updateOrderDto.userId ?? order.userId,
      phoneNumber: updateOrderDto.phoneNumber ?? order.phoneNumber,
      restaurantId: updateOrderDto.restaurantId ?? order.restaurantId,
      deliveryId:
        updateOrderDto.deliveryId !== undefined
          ? updateOrderDto.deliveryId
          : order.deliveryId,
    });

    return this.orderRepository.save(order);
  }

  async remove(id: string) {
    const order = await this.findOne(id);
    await this.orderRepository.remove(order);
    return { message: 'Order removed successfully' };
  }

  private async ensureReferencesExist(
    userId?: number,
    restaurantId?: string,
    deliveryId?: string,
    promotionIds?: string[],
  ) {
    if (userId !== undefined) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException(`User with id ${userId} not found`);
    }

    if (restaurantId) {
      const restaurant = await this.restaurantRepository.findOne({
        where: { id: restaurantId },
      });
      if (!restaurant) {
        throw new NotFoundException(`Restaurant with id ${restaurantId} not found`);
      }
    }

    if (deliveryId) {
      const delivery = await this.deliveryRepository.findOne({
        where: { id: deliveryId },
      });
      if (!delivery) {
        throw new NotFoundException(`Delivery with id ${deliveryId} not found`);
      }
    }

    if (promotionIds?.length) {
      const promotions = await this.promotionRepository.find({
        where: promotionIds.map((id) => ({ id })),
      });
      if (promotions.length !== promotionIds.length) {
        throw new NotFoundException('One or more promotions were not found');
      }
    }
  }
}
