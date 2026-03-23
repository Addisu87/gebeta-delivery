import { Restaurant } from 'src/modules/restaurants/entities/restaurant.entity';
import { Review } from 'src/modules/review/entities/review.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('ratings')
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  value: number;

  @Column({ type: 'uuid' })
  restaurantId: string;

  @Column()
  userId: number;

  @Column({ type: 'uuid', nullable: true })
  reviewId?: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.ratings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Review, (review) => review.ratings, { nullable: true })
  @JoinColumn({ name: 'reviewId' })
  review?: Review;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
