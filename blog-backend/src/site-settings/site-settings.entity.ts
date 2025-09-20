// src/site-settings/site-settings.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('site_settings')
export class SiteSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'Mon Blog' })
  siteName: string;

  @Column({ nullable: true })
  siteDescription?: string;

  @Column({ nullable: true })
  logoUrl?: string;

  @Column({ nullable: true })
  faviconUrl?: string;

  @Column({ default: 'light' })
  defaultTheme: 'light' | 'dark' | 'auto';

  @Column({ nullable: true })
  primaryColor?: string;

  @Column({ nullable: true })
  secondaryColor?: string;

  // SEO Settings
  @Column({ nullable: true })
  metaTitle?: string;

  @Column({ nullable: true })
  metaDescription?: string;

  @Column({ nullable: true })
  metaKeywords?: string;

  @Column({ nullable: true })
  ogImage?: string;

  @Column({ nullable: true })
  twitterHandle?: string;

  @Column({ nullable: true })
  googleAnalyticsId?: string;

  @Column({ nullable: true })
  facebookPixelId?: string;

  // Contact & Social
  @Column({ nullable: true })
  contactEmail?: string;

  @Column({ nullable: true })
  socialFacebook?: string;

  @Column({ nullable: true })
  socialTwitter?: string;

  @Column({ nullable: true })
  socialInstagram?: string;

  @Column({ nullable: true })
  socialLinkedIn?: string;

  @Column({ nullable: true })
  socialYoutube?: string;

  // Footer Settings
  @Column({ type: 'text', nullable: true })
  footerText?: string;

  @Column({ default: true })
  showPoweredBy: boolean;

  // Homepage Settings
  @Column({ type: 'json', nullable: true })
  homepageConfig?: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
