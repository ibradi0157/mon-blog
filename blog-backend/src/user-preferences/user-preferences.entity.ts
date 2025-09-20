import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../users/user.entity';

export enum PreferenceType {
  LIKED_ARTICLE = 'LIKED_ARTICLE',
  FOLLOWED_AUTHOR = 'FOLLOWED_AUTHOR',
  FOLLOWED_CATEGORY = 'FOLLOWED_CATEGORY',
  BOOKMARKED_ARTICLE = 'BOOKMARKED_ARTICLE'
}

@Entity()
@Index(['userId', 'type', 'targetId'], { unique: true })
export class UserPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: PreferenceType })
  type: PreferenceType;

  @Column({ type: 'uuid' })
  targetId: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: {
    targetTitle?: string;
    targetAuthor?: string;
    targetSlug?: string;
    [key: string]: any;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
