import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async create(createPaymentDto: CreatePaymentDto) {
    await this.ensureOrderExists(createPaymentDto.orderId);
    const payment = this.paymentRepository.create(createPaymentDto);
    return this.paymentRepository.save(payment);
  }

  findAll() {
    return this.paymentRepository.find({
      relations: ['order'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['order'],
    });
    if (!payment) throw new NotFoundException(`Payment with id ${id} not found`);
    return payment;
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto) {
    const payment = await this.findOne(id);
    if (updatePaymentDto.orderId) {
      await this.ensureOrderExists(updatePaymentDto.orderId);
    }
    Object.assign(payment, updatePaymentDto);
    return this.paymentRepository.save(payment);
  }

  async remove(id: string) {
    const payment = await this.findOne(id);
    await this.paymentRepository.remove(payment);
    return { message: 'Payment removed successfully' };
  }

  private async ensureOrderExists(orderId: string) {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Order with id ${orderId} not found`);
  }
}
