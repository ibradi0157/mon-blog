import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Article } from '../articles/article.entity';
import { User } from '../users/user.entity';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Article, { onDelete: 'CASCADE' })
  article: Article;

  @ManyToOne(() => User, { eager: true })
  author: User;

  @Column({ type: 'varchar', length: 32 })
  authorTag: string;

  @Column({ default: 0 })
  likes: number;

  @Column({ default: 0 })
  dislikes: number;

  // Replies
  @ManyToOne(() => Comment, (c) => c.children, { nullable: true, onDelete: 'CASCADE' })
  parent?: Comment | null;

  @OneToMany(() => Comment, (c) => c.parent)
  children?: Comment[];
}