import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, Unique, JoinColumn } from 'typeorm';
import { Article } from './article.entity';

export type ReactionType = 'like' | 'dislike';

@Entity()
@Unique('UQ_article_user', ['articleId', 'userId'])
export class ArticleReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Article, { onDelete: 'CASCADE' })
  @JoinColumn()
  article: Article;

  @Column()
  articleId: string;

  @Column()
  userId: string;

  @Column({ type: 'varchar' })
  type: ReactionType;
}
