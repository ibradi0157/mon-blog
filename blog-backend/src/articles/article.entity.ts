// src/articles/article.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, Index, BeforeInsert, BeforeUpdate, JoinColumn } from 'typeorm';
import { Category } from '../categories/category.entity';
import { User } from '../users/user.entity';
@Entity()
export class Article {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Index('idx_article_slug', { unique: true })
  @Column({ type: 'varchar', length: 200, unique: true, nullable: true })
  slug: string | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', nullable: true })
  excerpt: string | null;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[] | null;

  @Index('idx_article_isPublished')
  @Column({ default: false })
  isPublished: boolean;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date | null;

  @Index('idx_article_isFeatured')
  @Column({ default: false })
  isFeatured: boolean;

  @Column({ nullable: true })
  coverUrl: string;

  @Index('idx_article_createdAt')
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  // ...existing code...
  @Index('idx_article_authorId')
  @Column({ nullable: true })
  authorId: string | null;

  @Index('idx_article_authorRole')
  @Column()
  authorRole: string;

  @ManyToOne(() => Category, (category) => category.articles, { eager: true, nullable: true, onDelete: 'SET NULL' })
  category: Category | null;

  @ManyToOne(() => User, (user) => user.articles, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'authorId' })
  author: User | null;
  // ...existing code...

  @BeforeInsert()
  @BeforeUpdate()
  ensureSlug() {
    if (!this.slug && this.title) {
      const base = this.slugify(this.title);
      // Note: uniqueness must be enforced at DB level; here we only set a base slug
      this.slug = base;
    }
  }

  private slugify(text: string): string {
    return text
      .toString()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '') // remove diacritics
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .substring(0, 120);
  }
}
