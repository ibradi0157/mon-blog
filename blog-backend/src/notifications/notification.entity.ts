import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: ['article_published', 'comment_added', 'comment_reply', 'like_received', 'follow', 'mention', 'NEW_FOLLOWER'],
    default: 'article_published'
  })
  type: 'article_published' | 'comment_added' | 'comment_reply' | 'like_received' | 'follow' | 'mention' | 'NEW_FOLLOWER';

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ nullable: true })
  link?: string;

  @Column({ type: 'json', nullable: true })
  payload?: any;

  @Column({ default: false, name: 'is_read' })
  isRead: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}