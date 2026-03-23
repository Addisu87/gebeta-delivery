import { Driver } from 'src/modules/drivers/entities/driver.entity';
import { DeliveryStatus } from 'src/shared/enums/delivery-status.enum';
import { Order } from 'src/modules/orders/entities/order.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('deliveries')
export class Delivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  pickupAddress: string;

  @Column({ type: 'text' })
  dropoffAddress: string;

  @Column({
    type: 'enum',
    enum: DeliveryStatus,
    default: DeliveryStatus.PENDING,
  })
  status: DeliveryStatus;

  @Column({ type: 'uuid', nullable: true })
  driverId?: string;

  @ManyToOne(() => Driver, (driver) => driver.deliveries, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'driverId' })
  driver?: Driver;

  @OneToOne(() => Order, (order) => order.delivery)
  order: Order;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
