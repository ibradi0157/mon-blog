import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Article } from './article.entity';

@Entity()
export class ArticleStats {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Article, { onDelete: 'CASCADE' })
  @JoinColumn()
  article: Article;

  @Column({ default: 0 })
  views: number;

  @Column({ default: 0 })
  likes: number;

  @Column({ default: 0 })
  dislikes: number;

  @Column({ default: 0 })
  commentsCount: number;
}