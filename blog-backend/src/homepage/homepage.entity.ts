import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('homepage_config')
export class HomepageConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  heroTitle?: string | null;

  @Column({ type: 'varchar', nullable: true })
  heroSubtitle?: string | null;

  @Column({ type: 'varchar', nullable: true })
  heroImageUrl?: string | null;

  @Column('uuid', { array: true, default: [] })
  featuredArticleIds: string[];

  @Column('jsonb', { nullable: true })
  sections?: any | null; // Future: flexible layout blocks

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
