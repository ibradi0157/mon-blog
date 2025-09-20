// src/subscriptions/notification-queue.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../users/user.entity';
import { Article } from '../articles/article.entity';

@Entity('notification_queue')
@Index(['status', 'scheduledFor'])
export class NotificationQueue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'article_id' })
  articleId: string;

  @ManyToOne(() => Article, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'article_id' })
  article: Article;

  @Column({
    type: 'enum',
    enum: ['new_article', 'author_published', 'category_update'],
    default: 'new_article'
  })
  type: 'new_article' | 'author_published' | 'category_update';

  @Column({
    type: 'enum',
    enum: ['pending', 'sent', 'failed', 'cancelled'],
    default: 'pending'
  })
  status: 'pending' | 'sent' | 'failed' | 'cancelled';

  @Column({ name: 'scheduled_for', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  scheduledFor: Date;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt?: Date;

  @Column({ name: 'error_message', nullable: true })
  errorMessage?: string;

  @Column({ name: 'retry_count', default: 0 })
  retryCount: number;

  @Column({ name: 'max_retries', default: 3 })
  maxRetries: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
