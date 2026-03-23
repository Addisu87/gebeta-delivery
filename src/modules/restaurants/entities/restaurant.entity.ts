import { Review } from 'src/modules/review/entities/review.entity';
import { Rating } from 'src/modules/rating/entities/rating.entity';
import { Menu } from 'src/modules/menu/entities/menu.entity';
import { Promotion } from 'src/modules/promotions/entities/promotion.entity';
import { Order } from 'src/modules/orders/entities/order.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('restaurants')
export class Restaurant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  address: string;

  @Column({ type: 'simple-array', default: '' })
  cuisines: string[];

  @Column({ type: 'simple-array', default: '' })
  photos: string[];

  @Column({ default: true })
  isOpen: boolean;

  @Column({ type: 'float', default: 0 })
  averageRating: number;

  @OneToMany(() => Review, (review) => review.restaurant)
  reviews: Review[];

  @OneToMany(() => Rating, (rating) => rating.restaurant)
  ratings: Rating[];

  @OneToMany(() => Menu, (menu) => menu.restaurant)
  menus: Menu[];

  @OneToMany(() => Promotion, (promotion) => promotion.restaurant)
  promotions: Promotion[];

  @OneToMany(() => Order, (order) => order.restaurant)
  orders: Order[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
