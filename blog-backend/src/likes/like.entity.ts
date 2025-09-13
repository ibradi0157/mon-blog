import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, Unique } from 'typeorm';
import { User } from '../users/user.entity';
import { Article } from '../articles/article.entity';
import { Comment } from '../comments/comment.entity';

@Entity()
@Unique(['user', 'article', 'comment'])
export class Like {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @ManyToOne(() => Article, { nullable: true, onDelete: 'CASCADE' })
  article: Article;

  @ManyToOne(() => Comment, { nullable: true, onDelete: 'CASCADE' })
  comment: Comment;

  @Column({ default: true })
  isLike: boolean; // true = like, false = dislike
}