// src/subscriptions/subscription.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../users/user.entity';
import { Category } from '../categories/category.entity';

@Entity('subscriptions')
@Index(['userId', 'type', 'targetId'], { unique: true })
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: ['category', 'author', 'all_articles'],
    default: 'category'
  })
  type: 'category' | 'author' | 'all_articles';

  @Column({ name: 'target_id', nullable: true })
  targetId?: string;

  // For category subscriptions, this links to Category
  @ManyToOne(() => Category, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_id' })
  category?: Category;

  // For author subscriptions, targetId is the author's userId
  // For all_articles, targetId is null

  @Column({ default: true })
  isActive: boolean;

  @Column({
    type: 'enum',
    enum: ['instant', 'daily', 'weekly'],
    default: 'instant'
  })
  frequency: 'instant' | 'daily' | 'weekly';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
