import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index, CreateDateColumn, UpdateDateColumn, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Article } from '../articles/article.entity';

@Entity()
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Index('idx_category_slug', { unique: true })
  @Column({ type: 'varchar', length: 160, unique: true, nullable: true })
  slug: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Article, article => article.category)
  articles: Article[];

  @BeforeInsert()
  @BeforeUpdate()
  ensureSlug() {
    if (!this.slug && this.name) {
      this.slug = this.slugify(this.name);
    }
  }

  private slugify(text: string): string {
    return text
      .toString()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .substring(0, 80);
  }
}
//code: src/articles/article.entity.ts