import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Restaurant } from 'src/modules/restaurants/entities/restaurant.entity';
import { Order } from 'src/modules/orders/entities/order.entity';

@Entity('promotions')
export class Promotion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  code: string;

  @Column({ type: 'float' })
  discountPercent: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'uuid', nullable: true })
  restaurantId?: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.promotions, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'restaurantId' })
  restaurant?: Restaurant;

  @ManyToMany(() => Order, (order) => order.promotions)
  orders: Order[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
