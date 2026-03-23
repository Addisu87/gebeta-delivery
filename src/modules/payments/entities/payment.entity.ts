import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from 'src/modules/orders/entities/order.entity';
import { PaymentStatus } from 'src/shared/enums/payment-status.enum';
import { PaymentMethod } from 'src/shared/enums/payment-method.enum';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'float' })
  amount: number;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.CASH })
  method: PaymentMethod;

  @Column({ type: 'uuid', unique: true })
  orderId: string;

  @OneToOne(() => Order, (order) => order.payment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
