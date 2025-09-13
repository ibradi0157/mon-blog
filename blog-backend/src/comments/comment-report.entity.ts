import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Comment } from './comment.entity';
import { User } from '../users/user.entity';

export type CommentReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';

@Entity()
export class CommentReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Comment, { eager: true, onDelete: 'CASCADE' })
  comment: Comment;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  reporter: User;

  @Column({ type: 'varchar', length: 255 })
  reason: string;

  @Column({ type: 'varchar', length: 16, default: 'PENDING' })
  status: CommentReportStatus;

  @CreateDateColumn()
  createdAt: Date;
}
