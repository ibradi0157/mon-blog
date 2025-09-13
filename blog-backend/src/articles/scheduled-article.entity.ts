import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Article } from './article.entity';

export enum ScheduleStatus {
  PENDING = 'pending',
  PUBLISHED = 'published',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

@Entity('scheduled_articles')
export class ScheduledArticle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'article_id' })
  articleId: string;

  @ManyToOne(() => Article, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'article_id' })
  article: Article;

  @Column({ name: 'scheduled_at', type: 'timestamp' })
  scheduledAt: Date;

  @Column({ 
    type: 'enum', 
    enum: ScheduleStatus, 
    default: ScheduleStatus.PENDING 
  })
  status: ScheduleStatus;

  @Column({ name: 'scheduled_by' })
  scheduledBy: string;

  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt: Date;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount: number;

  @Column({ name: 'max_retries', type: 'int', default: 3 })
  maxRetries: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Additional scheduling options
  @Column({ name: 'auto_social_share', default: false })
  autoSocialShare: boolean;

  @Column({ name: 'send_notification', default: true })
  sendNotification: boolean;

  @Column({ name: 'timezone', default: 'Europe/Paris' })
  timezone: string;
}
