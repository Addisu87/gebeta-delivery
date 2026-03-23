import { Exclude } from 'class-transformer';
import { UserRole } from 'src/shared/enums/role.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from 'src/modules/orders/entities/order.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true, default: '' })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ type: 'text', nullable: true })
  @Exclude()
  refreshToken: string | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ default: false })
  isEmailVerified: boolean; // email verification status

  @Column({ type: 'text', nullable: true })
  verificationToken: string | null; // token for email verification

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
