import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class ArticleHistoryTitle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  title: string;

  @Column({ type: 'uuid' })
  originalArticleId: string;

  @CreateDateColumn()
  createdAt: Date;
}