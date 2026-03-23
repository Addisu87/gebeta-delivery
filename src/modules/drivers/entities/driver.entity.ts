import { Delivery } from 'src/modules/deliveries/entities/delivery.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('drivers')
export class Driver {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  phone: string;

  @Column({ nullable: true })
  vehicleType?: string;

  @Column({ type: 'text', nullable: true })
  photo?: string;

  @Column({ default: true })
  isAvailable: boolean;

  @OneToMany(() => Delivery, (delivery) => delivery.driver)
  deliveries: Delivery[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
