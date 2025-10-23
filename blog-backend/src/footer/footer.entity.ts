import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export interface FooterLink {
  text: string;
  href: string;
  external?: boolean;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}

@Entity()
export class Footer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'json', default: [] })
  sections: FooterSection[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  copyrightText: string;

  @Column({ type: 'boolean', default: true })
  showSocialLinks: boolean;

  @Column({ type: 'json', default: {} })
  socialLinks: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
    github?: string;
  };

  @Column({ type: 'varchar', length: 100, default: '#ffffff' })
  backgroundColor: string;

  @Column({ type: 'varchar', length: 100, default: '#1e293b' })
  textColor: string;

  @Column({ type: 'varchar', length: 100, default: '#0f172a', nullable: true })
  darkBackgroundColor: string;

  @Column({ type: 'varchar', length: 100, default: '#e2e8f0', nullable: true })
  darkTextColor: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
