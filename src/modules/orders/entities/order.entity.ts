import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { Restaurant } from 'src/modules/restaurants/entities/restaurant.entity';
import { Delivery } from 'src/modules/deliveries/entities/delivery.entity';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { Promotion } from 'src/modules/promotions/entities/promotion.entity';
import { OrderStatus } from 'src/shared/enums/order-status.enum';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'float' })
  totalAmount: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ nullable: true })
  phoneNumber?: string;

  @Column()
  userId: number;

  @Column({ type: 'uuid' })
  restaurantId: string;

  @Column({ type: 'uuid', nullable: true, unique: true })
  deliveryId?: string;

  @ManyToOne(() => User, (user) => user.orders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.orders, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;

  @OneToOne(() => Delivery, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'deliveryId' })
  delivery?: Delivery;

  @OneToOne(() => Payment, (payment) => payment.order)
  payment?: Payment;

  @ManyToMany(() => Promotion, (promotion) => promotion.orders)
  @JoinTable()
  promotions: Promotion[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
